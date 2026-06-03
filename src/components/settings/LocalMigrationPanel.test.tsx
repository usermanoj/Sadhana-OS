import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import {
  AuthContext,
  defaultAuthContext,
  type AuthContextValue,
} from '../../auth/AuthProvider';
import {
  CloudSyncContext,
  type CloudSyncContextValue,
} from '../../cloud/CloudSyncProvider';
import { appRepository, resetActiveAppRepository } from '../../lib/repository';
import type { Category } from '../../types';
import LocalMigrationPanel from './LocalMigrationPanel';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(() => ({})),
  uploadLocalMigrationPlan: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}));

vi.mock('../../lib/localMigration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/localMigration')>();

  return {
    ...actual,
    uploadLocalMigrationPlan: mocks.uploadLocalMigrationPlan,
  };
});

const category: Category = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Yoga',
  icon: 'lotus',
  color: '#7C3AED',
  displayOrder: 0,
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  subComponents: [],
};

const syncedCloudContext: CloudSyncContextValue = {
  status: 'synced',
  message: null,
  lastSyncedAt: '2026-06-03T00:00:00.000Z',
  lastErrorAt: null,
  pendingWrites: 0,
  canRetry: false,
  retry: vi.fn(async () => undefined),
  refreshFromCloud: vi.fn(async () => undefined),
};

const signedInAuthContext: AuthContextValue = {
  ...defaultAuthContext,
  isCloudConfigured: true,
  missingConfigKeys: [],
  status: 'signedIn',
  user: {
    id: 'user-1',
    email: 'practitioner@example.com',
  } as User,
  profile: {
    id: 'user-1',
    email: 'practitioner@example.com',
    displayName: 'Mira',
    timezone: 'Asia/Singapore',
    onboardingCompletedAt: '2026-06-01T00:00:00.000Z',
    weekStartsOn: 1,
  },
};

describe('LocalMigrationPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    resetActiveAppRepository();
    mocks.getSupabaseClient.mockReturnValue({});
    mocks.uploadLocalMigrationPlan.mockResolvedValue({
      importJobId: 'import-job-1',
      completedAt: '2026-06-03T00:00:00.000Z',
      checksum: 'local-123',
      summary: {
        categories: 1,
        habits: 0,
        dailyEntries: 0,
        dailyHabitEntries: 0,
        journalEntries: 0,
        auditLogs: 0,
        totalRows: 1,
      },
    });
  });

  afterEach(() => {
    resetActiveAppRepository();
    vi.clearAllMocks();
  });

  it('does not render without a signed-in cloud user', () => {
    appRepository.setCategories([category]);

    const { container } = render(<LocalMigrationPanel />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows migration summary for signed-in users with local data', () => {
    appRepository.replaceSnapshot({
      version: '1.1',
      categories: [category],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    });

    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <LocalMigrationPanel />
      </AuthContext.Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Local Data Migration' })).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Migrate Local Data')).toBeInTheDocument();
  });

  it('refreshes cloud-backed local cache after successful migration upload', async () => {
    const refreshFromCloud = vi.fn(async () => undefined);
    appRepository.replaceSnapshot({
      version: '1.1',
      categories: [category],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    });

    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <CloudSyncContext.Provider value={{ ...syncedCloudContext, refreshFromCloud }}>
          <LocalMigrationPanel />
        </CloudSyncContext.Provider>
      </AuthContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Migrate Local Data' }));

    await waitFor(() => {
      expect(mocks.uploadLocalMigrationPlan).toHaveBeenCalledTimes(1);
    });
    expect(refreshFromCloud).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Your cloud view has been refreshed');
  });

  it('keeps migration success visible when post-upload cache refresh fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const refreshFromCloud = vi.fn(async () => {
      throw new Error('refresh failed');
    });
    appRepository.replaceSnapshot({
      version: '1.1',
      categories: [category],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    });

    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <CloudSyncContext.Provider value={{ ...syncedCloudContext, refreshFromCloud }}>
          <LocalMigrationPanel />
        </CloudSyncContext.Provider>
      </AuthContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Migrate Local Data' }));

    await waitFor(() => {
      expect(mocks.uploadLocalMigrationPlan).toHaveBeenCalledTimes(1);
    });
    expect(refreshFromCloud).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Local data was copied to your cloud account');
    expect(screen.getByRole('status')).toHaveTextContent('Cloud refresh did not complete');
  });
});
