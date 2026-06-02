import type {
  AuditActionType,
  Category,
  DailyEntry,
  DateKey,
  JournalEntry,
} from '../types';
import { getItem, setItem } from './storage';

export interface StoredAuditLogEntry {
  id: string;
  timestamp: string;
  action?: string;
  actionType?: AuditActionType;
  entityType: 'category' | 'subComponent' | 'habit' | 'system';
  entityId: string;
  before?: unknown | null;
  after?: unknown | null;
  oldValue?: unknown | null;
  newValue?: unknown | null;
  description?: string;
  note?: string;
}

export interface AppStateSnapshot {
  version: string;
  categories: Category[];
  dailyEntries: Record<DateKey, DailyEntry>;
  journalEntries: Record<DateKey, JournalEntry>;
  auditLogs: StoredAuditLogEntry[];
}

export interface AppRepository {
  getVersion(fallback: string): string;
  getVersion(fallback: null): string | null;
  setVersion(version: string): void;
  getCategories(): Category[];
  setCategories(categories: Category[]): void;
  getDailyEntries(): Record<DateKey, DailyEntry>;
  setDailyEntries(entries: Record<DateKey, DailyEntry>): void;
  getJournalEntries(): Record<DateKey, JournalEntry>;
  setJournalEntries(entries: Record<DateKey, JournalEntry>): void;
  getAuditLogs(): StoredAuditLogEntry[];
  setAuditLogs(auditLogs: StoredAuditLogEntry[]): void;
  getSnapshot(options?: { versionFallback?: string }): AppStateSnapshot;
  replaceSnapshot(snapshot: AppStateSnapshot): void;
}

interface LocalStorageRepositoryOptions {
  keyPrefix?: string;
}

function createStorageKey(key: string, keyPrefix?: string): string {
  return keyPrefix ? `${keyPrefix}:${key}` : key;
}

export function createLocalStorageRepository(options: LocalStorageRepositoryOptions = {}): AppRepository {
  const storageKey = (key: string): string => createStorageKey(key, options.keyPrefix);

  function readVersion(fallback: string): string;
  function readVersion(fallback: null): string | null;
  function readVersion(fallback: string | null): string | null {
    return getItem<string | null>(storageKey('version'), fallback);
  }

  return {
    getVersion: readVersion,
    setVersion(version) {
      setItem(storageKey('version'), version);
    },
    getCategories() {
      return getItem<Category[]>(storageKey('categories'), []);
    },
    setCategories(categories) {
      setItem(storageKey('categories'), categories);
    },
    getDailyEntries() {
      return getItem<Record<DateKey, DailyEntry>>(storageKey('entries'), {});
    },
    setDailyEntries(entries) {
      setItem(storageKey('entries'), entries);
    },
    getJournalEntries() {
      return getItem<Record<DateKey, JournalEntry>>(storageKey('journal'), {});
    },
    setJournalEntries(entries) {
      setItem(storageKey('journal'), entries);
    },
    getAuditLogs() {
      return getItem<StoredAuditLogEntry[]>(storageKey('audit'), []);
    },
    setAuditLogs(auditLogs) {
      setItem(storageKey('audit'), auditLogs);
    },
    getSnapshot(options) {
      return {
        version: readVersion(options?.versionFallback ?? '1.1'),
        categories: getItem<Category[]>(storageKey('categories'), []),
        dailyEntries: getItem<Record<DateKey, DailyEntry>>(storageKey('entries'), {}),
        journalEntries: getItem<Record<DateKey, JournalEntry>>(storageKey('journal'), {}),
        auditLogs: getItem<StoredAuditLogEntry[]>(storageKey('audit'), []),
      };
    },
    replaceSnapshot(snapshot) {
      setItem(storageKey('version'), snapshot.version);
      setItem(storageKey('categories'), snapshot.categories);
      setItem(storageKey('entries'), snapshot.dailyEntries);
      setItem(storageKey('journal'), snapshot.journalEntries);
      setItem(storageKey('audit'), snapshot.auditLogs);
    },
  };
}

export function createUserScopedLocalStorageRepository(userId: string): AppRepository {
  return createLocalStorageRepository({ keyPrefix: `users:${encodeURIComponent(userId)}` });
}

const localStorageRepository = createLocalStorageRepository();
let activeRepository: AppRepository = localStorageRepository;

function getActiveVersion(fallback: string): string;
function getActiveVersion(fallback: null): string | null;
function getActiveVersion(fallback: string | null): string | null {
  if (fallback === null) {
    return activeRepository.getVersion(null);
  }

  return activeRepository.getVersion(fallback);
}

export const appRepository: AppRepository = {
  getVersion: getActiveVersion,
  setVersion(version) {
    activeRepository.setVersion(version);
  },
  getCategories() {
    return activeRepository.getCategories();
  },
  setCategories(categories) {
    activeRepository.setCategories(categories);
  },
  getDailyEntries() {
    return activeRepository.getDailyEntries();
  },
  setDailyEntries(entries) {
    activeRepository.setDailyEntries(entries);
  },
  getJournalEntries() {
    return activeRepository.getJournalEntries();
  },
  setJournalEntries(entries) {
    activeRepository.setJournalEntries(entries);
  },
  getAuditLogs() {
    return activeRepository.getAuditLogs();
  },
  setAuditLogs(auditLogs) {
    activeRepository.setAuditLogs(auditLogs);
  },
  getSnapshot(options) {
    return activeRepository.getSnapshot(options);
  },
  replaceSnapshot(snapshot) {
    activeRepository.replaceSnapshot(snapshot);
  },
};

export function setActiveAppRepository(repository: AppRepository): void {
  activeRepository = repository;
}

export function resetActiveAppRepository(): void {
  activeRepository = localStorageRepository;
}
