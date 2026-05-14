import type { AuditLogEntry, Category, DailyEntry, DateKey, ExportPayload, JournalEntry } from '../types';
import { recordAuditEntry } from './auditService';
import { getItem, setItem } from './storage';

export type ImportMode = 'merge' | 'overwrite';

export interface ConflictSummary {
  categories: number;
  dailyEntries: number;
  journalEntries: number;
  auditLogs: number;
  settings: boolean;
  total: number;
}

interface ExistingState {
  version: string;
  categories: Category[];
  dailyEntries: Record<DateKey, DailyEntry>;
  journalEntries: Record<DateKey, JournalEntry>;
  auditLogs: AuditLogEntry[];
}

export async function parseImport(source: string | Blob): Promise<ExportPayload> {
  const raw = typeof source === 'string' ? source : await readBlobText(source);
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON backup.');
  }

  return validateExportPayload(parsed);
}

function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') {
    return blob.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(new Error('Invalid JSON backup.'));
    };
    reader.readAsText(blob);
  });
}

export function detectConflicts(payload: ExportPayload, existingState = loadExistingState()): ConflictSummary {
  const existingCategoryIds = new Set(existingState.categories.map((category) => category.id));
  const existingEntryDates = new Set(Object.keys(existingState.dailyEntries));
  const existingJournalDates = new Set(Object.keys(existingState.journalEntries));
  const existingAuditIds = new Set(existingState.auditLogs.map((entry) => entry.id));

  const summary = {
    categories: payload.categories.filter((category) => existingCategoryIds.has(category.id)).length,
    dailyEntries: Object.keys(payload.dailyEntries).filter((date) => existingEntryDates.has(date)).length,
    journalEntries: Object.keys(payload.journalEntries).filter((date) => existingJournalDates.has(date)).length,
    auditLogs: payload.auditLogs.filter((entry) => existingAuditIds.has(entry.id)).length,
    settings: payload.settings.schemaVersion !== existingState.version,
    total: 0,
  };

  summary.total = summary.categories
    + summary.dailyEntries
    + summary.journalEntries
    + summary.auditLogs
    + (summary.settings ? 1 : 0);

  return summary;
}

export function applyImport(payload: ExportPayload, mode: ImportMode): void {
  const validated = validateExportPayload(payload);
  const existingState = loadExistingState();
  const before = summarizeState(existingState);

  if (mode === 'overwrite') {
    setItem('version', validated.settings.schemaVersion);
    setItem('categories', validated.categories);
    setItem('entries', validated.dailyEntries);
    setItem('journal', validated.journalEntries);
    setItem('audit', validated.auditLogs);
  } else {
    const nextCategories = mergeCategories(existingState.categories, validated.categories);
    const nextDailyEntries = mergeRecords(existingState.dailyEntries, validated.dailyEntries);
    const nextJournalEntries = mergeRecords(existingState.journalEntries, validated.journalEntries);
    const nextAuditLogs = mergeAuditLogs(existingState.auditLogs, validated.auditLogs);

    setItem('version', existingState.version || validated.settings.schemaVersion);
    setItem('categories', nextCategories);
    setItem('entries', nextDailyEntries);
    setItem('journal', nextJournalEntries);
    setItem('audit', nextAuditLogs);
  }

  recordAuditEntry({
    actionType: 'data_imported',
    entityType: 'system',
    entityId: 'system',
    oldValue: before,
    newValue: summarizeState(loadExistingState()),
    note: `Imported JSON backup with ${mode} mode`,
  });
}

function validateExportPayload(value: unknown): ExportPayload {
  if (!isRecord(value)) {
    throw new Error('Invalid JSON backup.');
  }

  const categories = value.categories;
  const dailyEntries = value.dailyEntries ?? value.entries;
  const journalEntries = value.journalEntries ?? value.journal;
  const auditLogs = value.auditLogs ?? value.audit;
  const settings = value.settings;

  if (!Array.isArray(categories)
    || !isRecord(dailyEntries)
    || !isRecord(journalEntries)
    || !Array.isArray(auditLogs)
    || !isRecord(settings)
    || typeof settings.schemaVersion !== 'string'
  ) {
    throw new Error('Invalid JSON backup.');
  }

  const normalizedCategories = categories.map(validateCategory);
  const normalizedDailyEntries = validateDailyEntries(dailyEntries);
  const normalizedJournalEntries = validateJournalEntries(journalEntries);
  const normalizedAuditLogs = auditLogs.map(validateAuditEntry);
  const habits = normalizedCategories.flatMap((category) => category.subComponents);
  const version = typeof value.version === 'string' ? value.version : settings.schemaVersion;
  const exportedAt = typeof value.exportedAt === 'string'
    ? value.exportedAt
    : new Date().toISOString();

  return {
    version,
    exportedAt,
    categories: normalizedCategories,
    habits,
    dailyEntries: normalizedDailyEntries,
    journalEntries: normalizedJournalEntries,
    auditLogs: normalizedAuditLogs,
    settings: { schemaVersion: settings.schemaVersion },
    entries: normalizedDailyEntries,
    journal: normalizedJournalEntries,
    audit: normalizedAuditLogs,
  };
}

function validateCategory(value: unknown): Category {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || typeof value.icon !== 'string'
    || typeof value.color !== 'string'
    || typeof value.displayOrder !== 'number'
    || typeof value.isArchived !== 'boolean'
    || typeof value.createdAt !== 'string'
    || typeof value.updatedAt !== 'string'
    || !Array.isArray(value.subComponents)
  ) {
    throw new Error('Invalid JSON backup.');
  }

  return {
    id: value.id,
    name: value.name,
    icon: value.icon,
    color: value.color,
    displayOrder: value.displayOrder,
    isArchived: value.isArchived,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    subComponents: value.subComponents.map((habit) => {
      if (!isRecord(habit)
        || typeof habit.id !== 'string'
        || typeof habit.categoryId !== 'string'
        || typeof habit.name !== 'string'
        || typeof habit.trackingType !== 'string'
        || typeof habit.displayOrder !== 'number'
        || typeof habit.isArchived !== 'boolean'
        || typeof habit.createdAt !== 'string'
        || typeof habit.updatedAt !== 'string'
      ) {
        throw new Error('Invalid JSON backup.');
      }

      return {
        id: habit.id,
        categoryId: habit.categoryId,
        name: habit.name,
        trackingType: habit.trackingType as Category['subComponents'][number]['trackingType'],
        displayOrder: habit.displayOrder,
        isArchived: habit.isArchived,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
      };
    }),
  };
}

function validateDailyEntries(value: Record<string, unknown>): Record<DateKey, DailyEntry> {
  return Object.fromEntries(
    Object.entries(value).map(([date, entry]) => {
      if (!isRecord(entry)
        || typeof entry.date !== 'string'
        || !isRecord(entry.completions)
        || !isRecord(entry.categoryScores)
        || typeof entry.overallScore !== 'number'
        || typeof entry.updatedAt !== 'string'
      ) {
        throw new Error('Invalid JSON backup.');
      }

      return [date, {
        date: entry.date,
        completions: entry.completions as DailyEntry['completions'],
        categoryScores: entry.categoryScores as DailyEntry['categoryScores'],
        overallScore: entry.overallScore,
        updatedAt: entry.updatedAt,
      }];
    }),
  );
}

function validateJournalEntries(value: Record<string, unknown>): Record<DateKey, JournalEntry> {
  return Object.fromEntries(
    Object.entries(value).map(([date, entry]) => {
      if (!isRecord(entry)
        || typeof entry.date !== 'string'
        || typeof entry.content !== 'string'
        || typeof entry.createdAt !== 'string'
        || typeof entry.updatedAt !== 'string'
      ) {
        throw new Error('Invalid JSON backup.');
      }

      return [date, {
        date: entry.date,
        mood: typeof entry.mood === 'string' ? entry.mood : undefined,
        gratitude: typeof entry.gratitude === 'string' ? entry.gratitude : undefined,
        spiritualInsight: typeof entry.spiritualInsight === 'string' ? entry.spiritualInsight : undefined,
        triggerObserved: typeof entry.triggerObserved === 'string' ? entry.triggerObserved : undefined,
        lessonLearned: typeof entry.lessonLearned === 'string' ? entry.lessonLearned : undefined,
        content: entry.content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      }];
    }),
  );
}

function validateAuditEntry(value: unknown): AuditLogEntry {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.timestamp !== 'string'
    || typeof value.actionType !== 'string'
    || typeof value.entityType !== 'string'
    || typeof value.entityId !== 'string'
  ) {
    throw new Error('Invalid JSON backup.');
  }

  return {
    id: value.id,
    timestamp: value.timestamp,
    actionType: value.actionType as AuditLogEntry['actionType'],
    entityType: value.entityType as AuditLogEntry['entityType'],
    entityId: value.entityId,
    oldValue: 'oldValue' in value ? value.oldValue : null,
    newValue: 'newValue' in value ? value.newValue : null,
    note: typeof value.note === 'string' ? value.note : undefined,
  };
}

function loadExistingState(): ExistingState {
  return {
    version: getItem<string>('version', '1.1'),
    categories: getItem<Category[]>('categories', []),
    dailyEntries: getItem<Record<DateKey, DailyEntry>>('entries', {}),
    journalEntries: getItem<Record<DateKey, JournalEntry>>('journal', {}),
    auditLogs: getItem<AuditLogEntry[]>('audit', []),
  };
}

function mergeCategories(existing: Category[], incoming: Category[]): Category[] {
  const existingIds = new Set(existing.map((category) => category.id));
  return [
    ...existing,
    ...incoming.filter((category) => !existingIds.has(category.id)),
  ];
}

function mergeRecords<T>(existing: Record<string, T>, incoming: Record<string, T>): Record<string, T> {
  return { ...incoming, ...existing };
}

function mergeAuditLogs(existing: AuditLogEntry[], incoming: AuditLogEntry[]): AuditLogEntry[] {
  const existingIds = new Set(existing.map((entry) => entry.id));
  return [
    ...existing,
    ...incoming.filter((entry) => !existingIds.has(entry.id)),
  ];
}

function summarizeState(state: ExistingState) {
  return {
    categories: state.categories.length,
    dailyEntries: Object.keys(state.dailyEntries).length,
    journalEntries: Object.keys(state.journalEntries).length,
    auditLogs: state.auditLogs.length,
    schemaVersion: state.version,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
