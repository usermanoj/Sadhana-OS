import type { AppRepository, AppStateSnapshot, StoredAuditLogEntry } from './repository';
import {
  createCloudBackedRepository,
  hydrateLocalCacheFromCloud,
  hydrateLocalCacheOrCreateStarterTemplate,
} from './cloudSync';
import type { CloudDataGateway } from './cloudRepository';
import type { Category, DailyEntry, DateKey, JournalEntry } from '../types';

function createMemoryRepository(): AppRepository {
  let snapshot: AppStateSnapshot = {
    version: '1.1',
    categories: [],
    dailyEntries: {},
    journalEntries: {},
    auditLogs: [],
  };

  return {
    getVersion: (fallback: string | null) => snapshot.version || fallback,
    setVersion: (version: string) => {
      snapshot = { ...snapshot, version };
    },
    getCategories: () => snapshot.categories,
    setCategories: (categories: Category[]) => {
      snapshot = { ...snapshot, categories };
    },
    getDailyEntries: () => snapshot.dailyEntries,
    setDailyEntries: (dailyEntries: Record<DateKey, DailyEntry>) => {
      snapshot = { ...snapshot, dailyEntries };
    },
    getJournalEntries: () => snapshot.journalEntries,
    setJournalEntries: (journalEntries: Record<DateKey, JournalEntry>) => {
      snapshot = { ...snapshot, journalEntries };
    },
    getAuditLogs: () => snapshot.auditLogs,
    setAuditLogs: (auditLogs: StoredAuditLogEntry[]) => {
      snapshot = { ...snapshot, auditLogs };
    },
    getSnapshot: () => snapshot,
    replaceSnapshot: (nextSnapshot: AppStateSnapshot) => {
      snapshot = nextSnapshot;
    },
  } as AppRepository;
}

describe('createCloudBackedRepository', () => {
  it('writes locally and forwards category changes to the cloud gateway', async () => {
    const localRepository = createMemoryRepository();
    const saveCategories = vi.fn<CloudDataGateway['saveCategories']>().mockResolvedValue(undefined);
    const onSyncStart = vi.fn();
    const onSyncSuccess = vi.fn();
    const gateway = {
      loadSnapshot: vi.fn<CloudDataGateway['loadSnapshot']>(),
      saveCategories,
      saveDailyEntries: vi.fn<CloudDataGateway['saveDailyEntries']>(),
      saveJournalEntries: vi.fn<CloudDataGateway['saveJournalEntries']>(),
      saveAuditLogs: vi.fn<CloudDataGateway['saveAuditLogs']>(),
      replaceSnapshot: vi.fn<CloudDataGateway['replaceSnapshot']>(),
    };
    const repository = createCloudBackedRepository({
      localRepository,
      cloudGateway: gateway,
      onSyncStart,
      onSyncSuccess,
    });
    const categories: Category[] = [{
      id: 'category-1',
      name: 'Yoga',
      icon: 'lotus',
      color: '#7C3AED',
      displayOrder: 0,
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      subComponents: [],
    }];

    repository.setCategories(categories);
    await Promise.resolve();

    expect(repository.getCategories()).toEqual(categories);
    expect(saveCategories).toHaveBeenCalledWith(categories);
    expect(onSyncStart).toHaveBeenCalledWith({ operation: 'categories' });
    expect(onSyncSuccess).toHaveBeenCalledWith({ operation: 'categories' });
  });

  it('reports failed background cloud writes without rolling back local state', async () => {
    const localRepository = createMemoryRepository();
    const error = new Error('network unavailable');
    const onSyncError = vi.fn();
    const gateway = {
      loadSnapshot: vi.fn<CloudDataGateway['loadSnapshot']>(),
      saveCategories: vi.fn<CloudDataGateway['saveCategories']>().mockRejectedValue(error),
      saveDailyEntries: vi.fn<CloudDataGateway['saveDailyEntries']>(),
      saveJournalEntries: vi.fn<CloudDataGateway['saveJournalEntries']>(),
      saveAuditLogs: vi.fn<CloudDataGateway['saveAuditLogs']>(),
      replaceSnapshot: vi.fn<CloudDataGateway['replaceSnapshot']>(),
    };
    const repository = createCloudBackedRepository({
      localRepository,
      cloudGateway: gateway,
      onSyncError,
    });
    const categories: Category[] = [{
      id: 'category-1',
      name: 'Yoga',
      icon: 'lotus',
      color: '#7C3AED',
      displayOrder: 0,
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      subComponents: [],
    }];

    repository.setCategories(categories);
    await Promise.resolve();
    await Promise.resolve();

    expect(repository.getCategories()).toEqual(categories);
    expect(onSyncError).toHaveBeenCalledWith(error, { operation: 'categories' });
  });

  it('hydrates the local cache from the cloud gateway', async () => {
    const localRepository = createMemoryRepository();
    const snapshot: AppStateSnapshot = {
      version: '0.2',
      categories: [],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    };
    const gateway = {
      loadSnapshot: vi.fn<CloudDataGateway['loadSnapshot']>().mockResolvedValue(snapshot),
      saveCategories: vi.fn<CloudDataGateway['saveCategories']>(),
      saveDailyEntries: vi.fn<CloudDataGateway['saveDailyEntries']>(),
      saveJournalEntries: vi.fn<CloudDataGateway['saveJournalEntries']>(),
      saveAuditLogs: vi.fn<CloudDataGateway['saveAuditLogs']>(),
      replaceSnapshot: vi.fn<CloudDataGateway['replaceSnapshot']>(),
    };

    await hydrateLocalCacheFromCloud(localRepository, gateway);

    expect(localRepository.getSnapshot()).toEqual(snapshot);
  });

  it('creates and uploads the starter template for an empty cloud account', async () => {
    const localRepository = createMemoryRepository();
    const snapshot: AppStateSnapshot = {
      version: '0.2',
      categories: [],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    };
    const replaceSnapshot = vi.fn<CloudDataGateway['replaceSnapshot']>().mockResolvedValue(undefined);
    const gateway = {
      loadSnapshot: vi.fn<CloudDataGateway['loadSnapshot']>().mockResolvedValue(snapshot),
      saveCategories: vi.fn<CloudDataGateway['saveCategories']>(),
      saveDailyEntries: vi.fn<CloudDataGateway['saveDailyEntries']>(),
      saveJournalEntries: vi.fn<CloudDataGateway['saveJournalEntries']>(),
      saveAuditLogs: vi.fn<CloudDataGateway['saveAuditLogs']>(),
      replaceSnapshot,
    };

    const starterSnapshot = await hydrateLocalCacheOrCreateStarterTemplate(localRepository, gateway);

    expect(starterSnapshot.categories).toHaveLength(9);
    expect(starterSnapshot.categories[0]!.name).toBe('8 Limbs of Yoga');
    expect(starterSnapshot.auditLogs[0]!.note).toBe('Applied starter template 2026.06.default');
    expect(localRepository.getSnapshot()).toEqual(starterSnapshot);
    expect(replaceSnapshot).toHaveBeenCalledWith(starterSnapshot);
  });

  it('does not overwrite existing cloud account data with the starter template', async () => {
    const localRepository = createMemoryRepository();
    const snapshot: AppStateSnapshot = {
      version: '0.2',
      categories: [{
        id: 'category-1',
        name: 'Existing Practice',
        icon: 'sparkles',
        color: '#7C3AED',
        displayOrder: 0,
        isArchived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        subComponents: [],
      }],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    };
    const replaceSnapshot = vi.fn<CloudDataGateway['replaceSnapshot']>().mockResolvedValue(undefined);
    const gateway = {
      loadSnapshot: vi.fn<CloudDataGateway['loadSnapshot']>().mockResolvedValue(snapshot),
      saveCategories: vi.fn<CloudDataGateway['saveCategories']>(),
      saveDailyEntries: vi.fn<CloudDataGateway['saveDailyEntries']>(),
      saveJournalEntries: vi.fn<CloudDataGateway['saveJournalEntries']>(),
      saveAuditLogs: vi.fn<CloudDataGateway['saveAuditLogs']>(),
      replaceSnapshot,
    };

    const hydratedSnapshot = await hydrateLocalCacheOrCreateStarterTemplate(localRepository, gateway);

    expect(hydratedSnapshot).toEqual(snapshot);
    expect(replaceSnapshot).not.toHaveBeenCalled();
  });
});
