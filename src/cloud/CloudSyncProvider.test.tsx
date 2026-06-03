import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { AuthContext, defaultAuthContext, type AuthContextValue } from '../auth/AuthProvider';
import {
  appRepository,
  createLocalStorageRepository,
  resetActiveAppRepository,
  type AppStateSnapshot,
} from '../lib/repository';
import { createCloudMutationQueue } from '../lib/cloudMutationQueue';
import type { Category } from '../types';
import CloudSyncProvider, { useCloudSync } from './CloudSyncProvider';

const mocks = vi.hoisted(() => ({
  currentUserId: 'user-b',
  loadSnapshot: vi.fn(),
  saveCategories: vi.fn(),
  saveDailyEntries: vi.fn(),
  saveJournalEntries: vi.fn(),
  saveAuditLogs: vi.fn(),
  replaceSnapshot: vi.fn(),
  recordMutationStatus: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({}),
}));

vi.mock('../lib/cloudRepository', () => ({
  createSupabaseCloudGateway: vi.fn((_client: unknown, userId: string) => {
    mocks.currentUserId = userId;
    return {
      loadSnapshot: mocks.loadSnapshot,
      saveCategories: mocks.saveCategories,
      saveDailyEntries: mocks.saveDailyEntries,
      saveJournalEntries: mocks.saveJournalEntries,
      saveAuditLogs: mocks.saveAuditLogs,
      replaceSnapshot: mocks.replaceSnapshot,
      recordMutationStatus: mocks.recordMutationStatus,
    };
  }),
}));

const userACategory: Category = {
  id: 'category-user-a',
  name: 'User A Practice',
  icon: 'sparkles',
  color: '#7C3AED',
  displayOrder: 0,
  isArchived: false,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  subComponents: [],
};

const emptyCloudSnapshot: AppStateSnapshot = {
  version: '0.2',
  categories: [],
  dailyEntries: {},
  journalEntries: {},
  auditLogs: [],
};

const existingCloudSnapshot: AppStateSnapshot = {
  ...emptyCloudSnapshot,
  categories: [{
    id: 'category-existing',
    name: 'Existing Cloud Practice',
    icon: 'sparkles',
    color: '#7C3AED',
    displayOrder: 0,
    isArchived: false,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    subComponents: [],
  }],
};

const remoteChangedCloudSnapshot: AppStateSnapshot = {
  ...emptyCloudSnapshot,
  categories: [{
    id: 'category-existing',
    name: 'Changed On Another Device',
    icon: 'sparkles',
    color: '#7C3AED',
    displayOrder: 0,
    isArchived: false,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-02T00:00:00.000Z',
    subComponents: [],
  }],
};

const signedInContext = (userId: string): AuthContextValue => ({
  ...defaultAuthContext,
  isCloudConfigured: true,
  missingConfigKeys: [],
  status: 'signedIn',
  user: {
    id: userId,
    email: `${userId}@example.com`,
  } as User,
  profile: {
    id: userId,
    email: `${userId}@example.com`,
    displayName: 'Practitioner',
    timezone: 'Asia/Singapore',
    onboardingCompletedAt: '2026-06-01T00:00:00.000Z',
    weekStartsOn: 1,
  },
});

function CategoryProbe() {
  const names = appRepository.getCategories().map((category) => category.name);
  return <div data-testid="category-names">{names.join(',') || 'empty'}</div>;
}

function SyncProbe() {
  const sync = useCloudSync();

  return (
    <div>
      <span data-testid="sync-status">{sync.status}</span>
      <span data-testid="sync-message">{sync.message ?? 'no message'}</span>
      <button
        type="button"
        onClick={() => {
          void sync.retry();
        }}
        disabled={!sync.canRetry}
      >
        Retry cloud sync
      </button>
    </div>
  );
}

function CategoryWriter() {
  return (
    <button
      type="button"
      onClick={() => {
        appRepository.setCategories([userACategory]);
      }}
    >
      Save category locally
    </button>
  );
}

describe('CloudSyncProvider', () => {
  beforeEach(() => {
    setNavigatorOnline(true);
    localStorage.clear();
    resetActiveAppRepository();
    mocks.loadSnapshot.mockResolvedValue(emptyCloudSnapshot);
    mocks.saveCategories.mockResolvedValue(undefined);
    mocks.saveDailyEntries.mockResolvedValue(undefined);
    mocks.saveJournalEntries.mockResolvedValue(undefined);
    mocks.saveAuditLogs.mockResolvedValue(undefined);
    mocks.replaceSnapshot.mockResolvedValue(undefined);
    mocks.recordMutationStatus.mockResolvedValue(undefined);
  });

  afterEach(() => {
    resetActiveAppRepository();
    vi.clearAllMocks();
  });

  it('does not mount the app with another user local cache during cloud sign-in', async () => {
    createLocalStorageRepository().setCategories([userACategory]);

    render(
      <AuthContext.Provider value={signedInContext('user-b')}>
        <CloudSyncProvider>
          <CategoryProbe />
        </CloudSyncProvider>
      </AuthContext.Provider>,
    );

    expect(screen.getByText('Preparing your private practice space...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('category-names')).toHaveTextContent('8 Limbs of Yoga');
    });

    expect(screen.getByTestId('category-names')).not.toHaveTextContent('User A Practice');
    expect(mocks.currentUserId).toBe('user-b');
    expect(JSON.parse(localStorage.getItem('sadhana:users:user-b:categories') ?? '[]')).toHaveLength(9);
    expect(JSON.parse(localStorage.getItem('sadhana:categories') ?? '[]')).toEqual([userACategory]);
    expect(mocks.replaceSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      categories: expect.any(Array),
      auditLogs: expect.arrayContaining([
        expect.objectContaining({ note: 'Applied starter template 2026.06.default' }),
      ]),
    }));
  });

  it('surfaces initial cloud hydration failure and retries hydration', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.loadSnapshot
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(emptyCloudSnapshot);

    render(
      <AuthContext.Provider value={signedInContext('user-a')}>
        <CloudSyncProvider>
          <SyncProbe />
          <CategoryProbe />
        </CloudSyncProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('failed');
    });

    expect(screen.getByTestId('sync-message')).toHaveTextContent('Cloud data could not be refreshed');
    expect(screen.getByTestId('category-names')).toHaveTextContent('empty');

    fireEvent.click(screen.getByRole('button', { name: 'Retry cloud sync' }));

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
    });

    expect(mocks.loadSnapshot).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(screen.getByTestId('category-names')).toHaveTextContent('8 Limbs of Yoga');
    });
  });

  it('surfaces a background write failure and retries the current local snapshot', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.loadSnapshot.mockResolvedValue(existingCloudSnapshot);
    mocks.saveCategories.mockRejectedValueOnce(new Error('network unavailable'));

    render(
      <AuthContext.Provider value={signedInContext('user-a')}>
        <CloudSyncProvider>
          <SyncProbe />
          <CategoryWriter />
        </CloudSyncProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save category locally' }));

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('queued');
    });

    expect(screen.getByTestId('sync-message')).toHaveTextContent(
      'Unsynced changes are queued',
    );
    expect(createCloudMutationQueue('user-a').get()?.snapshot.categories).toEqual([userACategory]);
    await waitFor(() => {
      expect(mocks.recordMutationStatus).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
        clientMutationId: createCloudMutationQueue('user-a').get()?.clientMutationId,
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry cloud sync' }));

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
    });
    expect(mocks.replaceSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      categories: [userACategory],
    }));
    expect(mocks.recordMutationStatus).toHaveBeenCalledWith(expect.objectContaining({
      status: 'running',
      mutationType: 'replaceSnapshot',
    }));
    expect(mocks.recordMutationStatus).toHaveBeenCalledWith(expect.objectContaining({
      status: 'succeeded',
      mutationType: 'replaceSnapshot',
      completedAt: expect.any(String),
    }));
    expect(createCloudMutationQueue('user-a').get()).toBeNull();
  });

  it('loads a durable queued snapshot on the next signed-in mount', async () => {
    createCloudMutationQueue('user-a').enqueueSnapshot({
      ...emptyCloudSnapshot,
      categories: [userACategory],
    });

    render(
      <AuthContext.Provider value={signedInContext('user-a')}>
        <CloudSyncProvider>
          <SyncProbe />
          <CategoryProbe />
        </CloudSyncProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('queued');
    });

    expect(screen.getByTestId('category-names')).toHaveTextContent('User A Practice');
    expect(mocks.loadSnapshot).not.toHaveBeenCalled();
  });

  it('replays queued writes when the browser comes back online', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    setNavigatorOnline(false);
    mocks.loadSnapshot.mockResolvedValue(existingCloudSnapshot);
    mocks.saveCategories.mockRejectedValueOnce(new Error('network unavailable'));

    render(
      <AuthContext.Provider value={signedInContext('user-a')}>
        <CloudSyncProvider>
          <SyncProbe />
          <CategoryWriter />
        </CloudSyncProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('offline');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save category locally' }));

    await waitFor(() => {
      expect(createCloudMutationQueue('user-a').count()).toBe(1);
    });

    setNavigatorOnline(true);
    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
    });

    expect(mocks.replaceSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      categories: [userACategory],
    }));
    expect(createCloudMutationQueue('user-a').count()).toBe(0);
  });

  it('blocks queued replay when cloud changed since the queued write base snapshot', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.loadSnapshot
      .mockResolvedValueOnce(existingCloudSnapshot)
      .mockResolvedValueOnce(remoteChangedCloudSnapshot);
    mocks.saveCategories.mockRejectedValueOnce(new Error('network unavailable'));

    render(
      <AuthContext.Provider value={signedInContext('user-a')}>
        <CloudSyncProvider>
          <SyncProbe />
          <CategoryWriter />
        </CloudSyncProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save category locally' }));

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('queued');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry cloud sync' }));

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('conflict');
    });

    expect(screen.getByTestId('sync-message')).toHaveTextContent('Cloud data changed on another device');
    expect(mocks.recordMutationStatus).toHaveBeenCalledWith(expect.objectContaining({
      status: 'conflict',
      lastErrorMessage: expect.stringContaining('Cloud data changed'),
    }));
    expect(mocks.replaceSnapshot).not.toHaveBeenCalled();
    expect(createCloudMutationQueue('user-a').count()).toBe(1);
  });

  it('does not block queued replay when mutation status tracking fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.loadSnapshot.mockResolvedValue(existingCloudSnapshot);
    mocks.saveCategories.mockRejectedValueOnce(new Error('network unavailable'));
    mocks.recordMutationStatus.mockRejectedValue(new Error('tracking table unavailable'));

    render(
      <AuthContext.Provider value={signedInContext('user-a')}>
        <CloudSyncProvider>
          <SyncProbe />
          <CategoryWriter />
        </CloudSyncProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save category locally' }));

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('queued');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry cloud sync' }));

    await waitFor(() => {
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
    });

    expect(mocks.replaceSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      categories: [userACategory],
    }));
    expect(createCloudMutationQueue('user-a').count()).toBe(0);
  });
});

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}
