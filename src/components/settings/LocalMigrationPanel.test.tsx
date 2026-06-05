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
import {
  checksumSnapshot,
  createLocalMigrationPlan,
  getLocalMigrationCompletion,
  recordLocalMigrationCompletion,
} from '../../lib/localMigration';
import { appRepository, resetActiveAppRepository } from '../../lib/repository';
import { createStarterTemplateSnapshot } from '../../lib/seed';
import type { Category } from '../../types';
import LocalMigrationPanel from './LocalMigrationPanel';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(() => ({})),
  loadSnapshot: vi.fn(),
  saveCategories: vi.fn(),
  saveAuditLogs: vi.fn(),
  uploadLocalMigrationPlan: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}));

vi.mock('../../lib/cloudRepository', () => ({
  createSupabaseCloudGateway: vi.fn(() => ({
    loadSnapshot: mocks.loadSnapshot,
    saveCategories: mocks.saveCategories,
    saveAuditLogs: mocks.saveAuditLogs,
  })),
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

const emptyCloudSnapshot = {
  version: '0.2',
  categories: [],
  dailyEntries: {},
  journalEntries: {},
  auditLogs: [],
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
    mocks.loadSnapshot.mockResolvedValue(emptyCloudSnapshot);
    mocks.saveCategories.mockResolvedValue(undefined);
    mocks.saveAuditLogs.mockResolvedValue(undefined);
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
    expect(screen.getByText('Review Local Data')).toBeInTheDocument();
  });

  it('loads review details before uploading local data', async () => {
    appRepository.replaceSnapshot({
      version: '1.1',
      categories: [category],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    });

    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <CloudSyncContext.Provider value={syncedCloudContext}>
          <LocalMigrationPanel />
        </CloudSyncContext.Provider>
      </AuthContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Review Local Data' }));

    await waitFor(() => {
      expect(screen.getByText('Review before copying')).toBeInTheDocument();
    });
    expect(mocks.uploadLocalMigrationPlan).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Copy Reviewed Data' })).toBeInTheDocument();
  });

  it('warns during review when the cloud account already has practice data', async () => {
    mocks.loadSnapshot.mockResolvedValue({
      ...emptyCloudSnapshot,
      categories: [
        {
          ...category,
          id: 'cloud-custom-category',
          name: 'Existing Cloud Practice',
        },
      ],
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
        <CloudSyncContext.Provider value={syncedCloudContext}>
          <LocalMigrationPanel />
        </CloudSyncContext.Provider>
      </AuthContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Review Local Data' }));

    await waitFor(() => {
      expect(screen.getByText(/already has practice data/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Local custom groups: Yoga/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy Reviewed Data' })).not.toBeInTheDocument();
    expect(mocks.uploadLocalMigrationPlan).not.toHaveBeenCalled();
  });

  it('archives copied local custom groups from a non-empty cloud account', async () => {
    const refreshFromCloud = vi.fn(async () => undefined);
    const localSnapshot = {
      version: '1.1',
      categories: [category],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    };
    const plan = createLocalMigrationPlan(localSnapshot, 'user-1');
    const copiedCategoryId = plan.rows.categories[0]!.id;
    mocks.loadSnapshot.mockResolvedValue({
      ...emptyCloudSnapshot,
      categories: [
        {
          ...category,
          id: copiedCategoryId,
          name: 'Yoga',
        },
      ],
    });
    appRepository.replaceSnapshot(localSnapshot);

    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <CloudSyncContext.Provider value={{ ...syncedCloudContext, refreshFromCloud }}>
          <LocalMigrationPanel />
        </CloudSyncContext.Provider>
      </AuthContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Review Local Data' }));

    await waitFor(() => {
      expect(screen.getByText(/Already copied local groups found/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Archive Copied Local Groups' }));

    await waitFor(() => {
      expect(mocks.saveCategories).toHaveBeenCalledTimes(1);
    });
    expect(mocks.uploadLocalMigrationPlan).not.toHaveBeenCalled();
    expect(mocks.saveCategories.mock.calls[0]![0]).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: copiedCategoryId,
        isArchived: true,
      }),
    ]));
    expect(mocks.saveAuditLogs).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        actionType: 'category_archived',
        entityId: copiedCategoryId,
        note: 'Archived custom category copied from local backup',
      }),
    ]));
    expect(refreshFromCloud).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('1 copied local group was archived');
  });

  it('blocks the same device backup from being copied to a different account after success', () => {
    const localSnapshot = {
      version: '1.1',
      categories: [category],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    };
    appRepository.replaceSnapshot(localSnapshot);
    recordLocalMigrationCompletion({
      checksum: checksumSnapshot(localSnapshot),
      userId: 'another-user',
      importJobId: 'import-job-previous',
      completedAt: '2026-06-03T00:00:00.000Z',
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

    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <CloudSyncContext.Provider value={syncedCloudContext}>
          <LocalMigrationPanel />
        </CloudSyncContext.Provider>
      </AuthContext.Provider>,
    );

    expect(screen.getByText(/already copied to a different cloud account/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review Local Data' })).not.toBeInTheDocument();
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

    await reviewAndCopyLocalData();

    await waitFor(() => {
      expect(mocks.uploadLocalMigrationPlan).toHaveBeenCalledTimes(1);
    });
    expect(refreshFromCloud).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Your cloud view has been refreshed');
    expect(getLocalMigrationCompletion('local-123')).toMatchObject({
      userId: 'user-1',
      importJobId: 'import-job-1',
    });
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

    await reviewAndCopyLocalData();

    await waitFor(() => {
      expect(mocks.uploadLocalMigrationPlan).toHaveBeenCalledTimes(1);
    });
    expect(refreshFromCloud).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Local data was copied to your cloud account');
    expect(screen.getByRole('status')).toHaveTextContent('Cloud refresh did not complete');
  });

  it('shows readable Supabase object errors when migration upload fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.uploadLocalMigrationPlan.mockRejectedValue({
      message: 'new row violates row-level security policy',
      details: 'update denied for audit_log_entries',
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
        <CloudSyncContext.Provider value={syncedCloudContext}>
          <LocalMigrationPanel />
        </CloudSyncContext.Provider>
      </AuthContext.Provider>,
    );

    await reviewAndCopyLocalData();

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Migration failed: new row violates row-level security policy update denied for audit_log_entries',
      );
    });
  });

  it('repairs existing duplicate starter-template rows before migration upload', async () => {
    const cloudStarter = createStarterTemplateSnapshot({
      timestamp: '2026-06-01T00:00:00.000Z',
      idFactory: (stableId) => `cloud-${stableId}`,
      auditIdFactory: () => 'cloud-audit',
    });
    const duplicateStarter = createStarterTemplateSnapshot({
      timestamp: '2026-06-02T00:00:00.000Z',
      idFactory: (stableId) => `migrated-${stableId}`,
      auditIdFactory: () => 'migrated-audit',
    });
    mocks.loadSnapshot
      .mockResolvedValueOnce({
        ...cloudStarter,
        categories: [
          cloudStarter.categories[0]!,
          duplicateStarter.categories[0]!,
          ...cloudStarter.categories.slice(1),
        ],
      })
      .mockResolvedValueOnce(emptyCloudSnapshot);
    appRepository.replaceSnapshot({
      version: '1.1',
      categories: [category],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    });

    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <CloudSyncContext.Provider value={syncedCloudContext}>
          <LocalMigrationPanel />
        </CloudSyncContext.Provider>
      </AuthContext.Provider>,
    );

    await reviewAndCopyLocalData();

    await waitFor(() => {
      expect(mocks.uploadLocalMigrationPlan).toHaveBeenCalledTimes(1);
    });
    expect(mocks.saveCategories).toHaveBeenCalledTimes(1);
    expect(mocks.saveCategories.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.uploadLocalMigrationPlan.mock.invocationCallOrder[0]!);
    expect(screen.getByRole('status')).toHaveTextContent('Duplicate starter rows were archived');
  });

  it('archives duplicate starter-template rows after migration upload', async () => {
    const duplicateStarterSnapshot = {
      ...emptyCloudSnapshot,
      categories: [
        {
          id: 'cloud-default-yoga',
          name: '8 Limbs of Yoga',
          icon: 'lotus',
          color: '#7C3AED',
          displayOrder: 0,
          isArchived: false,
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
          subComponents: [
            {
              id: 'cloud-yama',
              categoryId: 'cloud-default-yoga',
              name: 'Yama',
              trackingType: 'boolean',
              displayOrder: 0,
              isArchived: false,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
            {
              id: 'cloud-niyama',
              categoryId: 'cloud-default-yoga',
              name: 'Niyama',
              trackingType: 'boolean',
              displayOrder: 1,
              isArchived: false,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
            {
              id: 'cloud-asana',
              categoryId: 'cloud-default-yoga',
              name: 'Asana',
              trackingType: 'boolean',
              displayOrder: 2,
              isArchived: false,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
            {
              id: 'cloud-pranayama',
              categoryId: 'cloud-default-yoga',
              name: 'Pranayama',
              trackingType: 'boolean',
              displayOrder: 3,
              isArchived: false,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
            {
              id: 'cloud-pratyahara',
              categoryId: 'cloud-default-yoga',
              name: 'Pratyahara',
              trackingType: 'boolean',
              displayOrder: 4,
              isArchived: false,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
            {
              id: 'cloud-dharana',
              categoryId: 'cloud-default-yoga',
              name: 'Dharana',
              trackingType: 'boolean',
              displayOrder: 5,
              isArchived: false,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
            {
              id: 'cloud-dhyana',
              categoryId: 'cloud-default-yoga',
              name: 'Dhyana',
              trackingType: 'boolean',
              displayOrder: 6,
              isArchived: false,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
            {
              id: 'cloud-samadhi',
              categoryId: 'cloud-default-yoga',
              name: 'Samadhi',
              trackingType: 'boolean',
              displayOrder: 7,
              isArchived: false,
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
          ],
        },
        {
          id: 'migrated-default-yoga',
          name: '8 Limbs of Yoga',
          icon: 'lotus',
          color: '#7C3AED',
          displayOrder: 0,
          isArchived: false,
          createdAt: '2026-06-02T00:00:00.000Z',
          updatedAt: '2026-06-02T00:00:00.000Z',
          subComponents: [
            {
              id: 'migrated-yama',
              categoryId: 'migrated-default-yoga',
              name: 'Yama',
              trackingType: 'boolean',
              displayOrder: 0,
              isArchived: false,
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
            {
              id: 'migrated-niyama',
              categoryId: 'migrated-default-yoga',
              name: 'Niyama',
              trackingType: 'boolean',
              displayOrder: 1,
              isArchived: false,
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
            {
              id: 'migrated-asana',
              categoryId: 'migrated-default-yoga',
              name: 'Asana',
              trackingType: 'boolean',
              displayOrder: 2,
              isArchived: false,
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
            {
              id: 'migrated-pranayama',
              categoryId: 'migrated-default-yoga',
              name: 'Pranayama',
              trackingType: 'boolean',
              displayOrder: 3,
              isArchived: false,
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
            {
              id: 'migrated-pratyahara',
              categoryId: 'migrated-default-yoga',
              name: 'Pratyahara',
              trackingType: 'boolean',
              displayOrder: 4,
              isArchived: false,
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
            {
              id: 'migrated-dharana',
              categoryId: 'migrated-default-yoga',
              name: 'Dharana',
              trackingType: 'boolean',
              displayOrder: 5,
              isArchived: false,
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
            {
              id: 'migrated-dhyana',
              categoryId: 'migrated-default-yoga',
              name: 'Dhyana',
              trackingType: 'boolean',
              displayOrder: 6,
              isArchived: false,
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
            {
              id: 'migrated-samadhi',
              categoryId: 'migrated-default-yoga',
              name: 'Samadhi',
              trackingType: 'boolean',
              displayOrder: 7,
              isArchived: false,
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
          ],
        },
      ],
      dailyEntries: {
        '2026-06-03': {
          date: '2026-06-03',
          completions: {
            'migrated-yama': true,
          },
          categoryScores: {
            'migrated-default-yoga': 100,
          },
          overallScore: 100,
          updatedAt: '2026-06-03T00:00:00.000Z',
        },
      },
    };
    mocks.loadSnapshot
      .mockResolvedValueOnce(emptyCloudSnapshot)
      .mockResolvedValueOnce(duplicateStarterSnapshot);
    appRepository.replaceSnapshot({
      version: '1.1',
      categories: [category],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    });

    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <CloudSyncContext.Provider value={syncedCloudContext}>
          <LocalMigrationPanel />
        </CloudSyncContext.Provider>
      </AuthContext.Provider>,
    );

    await reviewAndCopyLocalData();

    await waitFor(() => {
      expect(mocks.saveCategories).toHaveBeenCalledTimes(1);
    });
    expect(mocks.saveCategories.mock.calls[0]![0]).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'cloud-default-yoga',
        isArchived: true,
      }),
      expect.objectContaining({
        id: 'migrated-default-yoga',
        isArchived: false,
      }),
    ]));
    expect(mocks.saveAuditLogs).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        actionType: 'category_archived',
        entityId: 'cloud-default-yoga',
      }),
    ]));
    expect(screen.getByRole('status')).toHaveTextContent('Duplicate starter rows were archived');
  });
});

async function reviewAndCopyLocalData() {
  fireEvent.click(screen.getByRole('button', { name: 'Review Local Data' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Copy Reviewed Data' })).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: 'Copy Reviewed Data' }));
}
