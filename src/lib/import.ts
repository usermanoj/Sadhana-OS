import type {
  AuditLogEntry,
  Category,
  DailyEntry,
  DailySadhanaPlan,
  DateKey,
  ExportPayload,
  JournalEntry,
} from '../types';
import { recordAuditEntry } from './auditService';
import { appRepository } from './repository';

export type ImportMode = 'merge' | 'overwrite';

export interface ConflictSummary {
  categories: number;
  dailyEntries: number;
  journalEntries: number;
  auditLogs: number;
  dailyPlans: number;
  settings: boolean;
  total: number;
}

interface ExistingState {
  version: string;
  categories: Category[];
  dailyEntries: Record<DateKey, DailyEntry>;
  journalEntries: Record<DateKey, JournalEntry>;
  auditLogs: AuditLogEntry[];
  dailyPlans: Record<DateKey, DailySadhanaPlan>;
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
  const existingPlanDates = new Set(Object.keys(existingState.dailyPlans));

  const summary = {
    categories: payload.categories.filter((category) => existingCategoryIds.has(category.id)).length,
    dailyEntries: Object.keys(payload.dailyEntries).filter((date) => existingEntryDates.has(date)).length,
    journalEntries: Object.keys(payload.journalEntries).filter((date) => existingJournalDates.has(date)).length,
    auditLogs: payload.auditLogs.filter((entry) => existingAuditIds.has(entry.id)).length,
    dailyPlans: Object.keys(payload.dailyPlans ?? {}).filter((date) => existingPlanDates.has(date)).length,
    settings: payload.settings.schemaVersion !== existingState.version,
    total: 0,
  };

  summary.total = summary.categories
    + summary.dailyEntries
    + summary.journalEntries
    + summary.auditLogs
    + summary.dailyPlans
    + (summary.settings ? 1 : 0);

  return summary;
}

export function applyImport(payload: ExportPayload, mode: ImportMode): void {
  const validated = validateExportPayload(payload);
  const existingState = loadExistingState();
  const before = summarizeState(existingState);

  if (mode === 'overwrite') {
    appRepository.replaceSnapshot({
      version: validated.settings.schemaVersion,
      categories: validated.categories,
      dailyEntries: validated.dailyEntries,
      journalEntries: validated.journalEntries,
      auditLogs: validated.auditLogs,
      dailyPlans: validated.dailyPlans ?? {},
    });
  } else {
    const nextCategories = mergeCategories(existingState.categories, validated.categories);
    const nextDailyEntries = mergeRecords(existingState.dailyEntries, validated.dailyEntries);
    const nextJournalEntries = mergeRecords(existingState.journalEntries, validated.journalEntries);
    const nextAuditLogs = mergeAuditLogs(existingState.auditLogs, validated.auditLogs);
    const nextDailyPlans = mergeRecords(existingState.dailyPlans, validated.dailyPlans ?? {});

    appRepository.replaceSnapshot({
      version: existingState.version || validated.settings.schemaVersion,
      categories: nextCategories,
      dailyEntries: nextDailyEntries,
      journalEntries: nextJournalEntries,
      auditLogs: nextAuditLogs,
      dailyPlans: nextDailyPlans,
    });
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
  const dailyPlans = value.dailyPlans ?? {};
  const settings = value.settings;

  if (!Array.isArray(categories)
    || !isRecord(dailyEntries)
    || !isRecord(journalEntries)
    || !Array.isArray(auditLogs)
    || !isRecord(dailyPlans)
    || !isRecord(settings)
    || typeof settings.schemaVersion !== 'string'
  ) {
    throw new Error('Invalid JSON backup.');
  }

  const normalizedCategories = categories.map(validateCategory);
  const normalizedDailyEntries = validateDailyEntries(dailyEntries);
  const normalizedJournalEntries = validateJournalEntries(journalEntries);
  const normalizedAuditLogs = auditLogs.map(validateAuditEntry);
  const normalizedDailyPlans = validateDailyPlans(dailyPlans);
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
    dailyPlans: normalizedDailyPlans,
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

function validateDailyPlans(value: Record<string, unknown>): Record<DateKey, DailySadhanaPlan> {
  const validModes = new Set(['minimum', 'balanced', 'full']);
  const validStatuses = new Set(['suggested', 'confirmed']);
  const validReasons = new Set([
    'focus_area',
    'gentle_energy',
    'growth_edge',
    'recent_rhythm',
    'time_fit',
    'steady_foundation',
  ]);

  return Object.fromEntries(
    Object.entries(value).map(([date, plan]) => {
      if (!isRecord(plan)
        || plan.date !== date
        || !validModes.has(String(plan.mode))
        || !validStatuses.has(String(plan.status))
        || typeof plan.availableMinutes !== 'number'
        || !Number.isInteger(plan.availableMinutes)
        || plan.availableMinutes < 1
        || plan.availableMinutes > 180
        || typeof plan.energyLevel !== 'number'
        || !Number.isInteger(plan.energyLevel)
        || plan.energyLevel < 1
        || plan.energyLevel > 5
        || !isStringArray(plan.focusCategoryIds)
        || plan.focusCategoryIds.length > 2
        || !Array.isArray(plan.items)
        || !isStringArray(plan.excludedHabitIds)
        || typeof plan.engineVersion !== 'string'
        || typeof plan.createdAt !== 'string'
        || typeof plan.updatedAt !== 'string'
        || (plan.intention !== undefined
          && (typeof plan.intention !== 'string' || plan.intention.length > 80))
      ) {
        throw new Error('Invalid JSON backup.');
      }

      const items = plan.items.map((item) => {
        if (!isRecord(item)
          || typeof item.habitId !== 'string'
          || typeof item.categoryId !== 'string'
          || typeof item.rank !== 'number'
          || !Number.isInteger(item.rank)
          || item.rank < 1
          || typeof item.plannedMinutes !== 'number'
          || !Number.isInteger(item.plannedMinutes)
          || item.plannedMinutes < 1
          || typeof item.recommendationScore !== 'number'
          || !isStringArray(item.reasons)
          || item.reasons.some((reason) => !validReasons.has(reason))
        ) {
          throw new Error('Invalid JSON backup.');
        }

        return item as unknown as DailySadhanaPlan['items'][number];
      });

      return [date, {
        date,
        mode: plan.mode as DailySadhanaPlan['mode'],
        status: plan.status as DailySadhanaPlan['status'],
        availableMinutes: plan.availableMinutes,
        energyLevel: plan.energyLevel as DailySadhanaPlan['energyLevel'],
        focusCategoryIds: plan.focusCategoryIds,
        intention: typeof plan.intention === 'string' ? plan.intention : undefined,
        items,
        excludedHabitIds: plan.excludedHabitIds,
        engineVersion: plan.engineVersion,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      } satisfies DailySadhanaPlan];
    }),
  );
}

function loadExistingState(): ExistingState {
  return {
    version: appRepository.getVersion('1.1'),
    categories: appRepository.getCategories(),
    dailyEntries: appRepository.getDailyEntries(),
    journalEntries: appRepository.getJournalEntries(),
    auditLogs: appRepository.getAuditLogs().map((entry) => entry as AuditLogEntry),
    dailyPlans: appRepository.getDailyPlans(),
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
    dailyPlans: Object.keys(state.dailyPlans).length,
    schemaVersion: state.version,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
