import type { AppRepository, AppStateSnapshot, StoredAuditLogEntry } from './repository';
import type { CloudDataGateway } from './cloudRepository';
import type { Category, DailyEntry, DateKey, JournalEntry } from '../types';
import { createStarterTemplateSnapshot, shouldApplyStarterTemplate } from './seed';

export interface CloudBackedRepositoryOptions {
  localRepository: AppRepository;
  cloudGateway: CloudDataGateway;
  onSyncStart?: (event: CloudSyncOperationEvent) => void;
  onSyncSuccess?: (event: CloudSyncOperationEvent) => void;
  onSyncError?: (error: unknown, event: CloudSyncOperationEvent) => void;
}

export type CloudSyncOperation =
  | 'categories'
  | 'dailyEntries'
  | 'journalEntries'
  | 'auditLogs'
  | 'snapshot';

export interface CloudSyncOperationEvent {
  operation: CloudSyncOperation;
}

export function createCloudBackedRepository({
  localRepository,
  cloudGateway,
  onSyncStart,
  onSyncSuccess,
  onSyncError,
}: CloudBackedRepositoryOptions): AppRepository {
  function getVersion(fallback: string): string;
  function getVersion(fallback: null): string | null;
  function getVersion(fallback: string | null): string | null {
    if (fallback === null) {
      return localRepository.getVersion(null);
    }

    return localRepository.getVersion(fallback);
  }

  const sync = (operationName: CloudSyncOperation, operation: Promise<void>) => {
    const event: CloudSyncOperationEvent = { operation: operationName };

    onSyncStart?.(event);
    void operation
      .then(() => {
        onSyncSuccess?.(event);
      })
      .catch((error: unknown) => {
        onSyncError?.(error, event);
      });
  };

  return {
    getVersion,
    setVersion(version) {
      localRepository.setVersion(version);
    },
    getCategories() {
      return localRepository.getCategories();
    },
    setCategories(categories: Category[]) {
      localRepository.setCategories(categories);
      sync('categories', cloudGateway.saveCategories(categories));
    },
    getDailyEntries() {
      return localRepository.getDailyEntries();
    },
    setDailyEntries(entries: Record<DateKey, DailyEntry>) {
      localRepository.setDailyEntries(entries);
      sync('dailyEntries', cloudGateway.saveDailyEntries(entries));
    },
    getJournalEntries() {
      return localRepository.getJournalEntries();
    },
    setJournalEntries(entries: Record<DateKey, JournalEntry>) {
      localRepository.setJournalEntries(entries);
      sync('journalEntries', cloudGateway.saveJournalEntries(entries));
    },
    getAuditLogs() {
      return localRepository.getAuditLogs();
    },
    setAuditLogs(auditLogs: StoredAuditLogEntry[]) {
      localRepository.setAuditLogs(auditLogs);
      sync('auditLogs', cloudGateway.saveAuditLogs(auditLogs));
    },
    getSnapshot(options) {
      return localRepository.getSnapshot(options);
    },
    replaceSnapshot(snapshot: AppStateSnapshot) {
      localRepository.replaceSnapshot(snapshot);
      sync('snapshot', cloudGateway.replaceSnapshot(snapshot));
    },
  };
}

export async function hydrateLocalCacheFromCloud(
  localRepository: AppRepository,
  cloudGateway: CloudDataGateway,
): Promise<AppStateSnapshot> {
  const snapshot = await cloudGateway.loadSnapshot();
  localRepository.replaceSnapshot(snapshot);
  return snapshot;
}

export async function hydrateLocalCacheOrCreateStarterTemplate(
  localRepository: AppRepository,
  cloudGateway: CloudDataGateway,
): Promise<AppStateSnapshot> {
  const snapshot = await hydrateLocalCacheFromCloud(localRepository, cloudGateway);

  if (!shouldApplyStarterTemplate(snapshot)) {
    return snapshot;
  }

  const starterSnapshot = createStarterTemplateSnapshot({
    schemaVersion: snapshot.version,
  });

  localRepository.replaceSnapshot(starterSnapshot);
  await cloudGateway.replaceSnapshot(starterSnapshot);

  return starterSnapshot;
}
