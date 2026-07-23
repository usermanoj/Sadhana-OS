import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AuditActionType,
  AuditEntityType,
  Category,
  DailyEntry,
  DailySadhanaPlan,
  TrackingValue,
} from '../types';
import { createSeedCategories, STARTER_TEMPLATE_VERSION } from './seed';
import type { AppStateSnapshot, StoredAuditLogEntry } from './repository';
import { getItem, setItem } from './storage';

export interface LocalMigrationSummary {
  categories: number;
  habits: number;
  dailyEntries: number;
  dailyHabitEntries: number;
  journalEntries: number;
  auditLogs: number;
  dailyPlans?: number;
  totalRows: number;
}

export interface CloudCategoryRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  display_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CloudHabitRow {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  tracking_type: string;
  display_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CloudDailyEntryRow {
  id: string;
  user_id: string;
  entry_date: string;
  overall_score: number;
  category_scores: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface CloudDailyHabitEntryRow {
  id: string;
  user_id: string;
  entry_date: string;
  habit_id: string;
  value: TrackingValue;
  created_at: string;
  updated_at: string;
}

export interface CloudJournalEntryRow {
  id: string;
  user_id: string;
  entry_date: string;
  mood: string | null;
  gratitude: string | null;
  spiritual_insight: string | null;
  trigger_observed: string | null;
  lesson_learned: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CloudAuditLogEntryRow {
  id: string;
  user_id: string;
  timestamp: string;
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string;
  old_value: unknown | null;
  new_value: unknown | null;
  note: string | null;
  source: 'migration';
}

export interface CloudDailySadhanaPlanRow {
  id: string;
  user_id: string;
  plan_date: string;
  mode: DailySadhanaPlan['mode'];
  status: DailySadhanaPlan['status'];
  available_minutes: number;
  energy_level: DailySadhanaPlan['energyLevel'];
  focus_category_ids: string[];
  intention: string | null;
  items: DailySadhanaPlan['items'];
  excluded_habit_ids: string[];
  engine_version: string;
  created_at: string;
  updated_at: string;
}

export interface LocalMigrationPlan {
  userId: string;
  sourceSchemaVersion: string;
  checksum: string;
  summary: LocalMigrationSummary;
  rows: {
    categories: CloudCategoryRow[];
    habits: CloudHabitRow[];
    dailyEntries: CloudDailyEntryRow[];
    dailyHabitEntries: CloudDailyHabitEntryRow[];
    journalEntries: CloudJournalEntryRow[];
    auditLogs: CloudAuditLogEntryRow[];
    dailyPlans?: CloudDailySadhanaPlanRow[];
  };
}

export interface LocalMigrationResult {
  importJobId: string;
  completedAt: string;
  checksum: string;
  summary: LocalMigrationSummary;
}

export interface LocalMigrationPlanOptions {
  existingCloudSnapshot?: AppStateSnapshot | null;
}

export interface LocalMigrationPreview {
  checksum: string;
  summary: LocalMigrationSummary;
  customCategoryNames: string[];
  starterCategoryCount: number;
  hasPracticeHistory: boolean;
  hasJournalEntries: boolean;
}

export interface LocalMigrationCompletion {
  checksum: string;
  userId: string;
  importJobId: string;
  completedAt: string;
  summary: LocalMigrationSummary;
}

export interface CopiedLocalCategory {
  id: string;
  name: string;
}

export interface StarterTemplateDuplicateRepairResult {
  snapshot: AppStateSnapshot;
  archivedCategoryIds: string[];
  archivedHabitIds: string[];
  addedAuditLogs: StoredAuditLogEntry[];
}

interface UpsertOptions {
  ignoreDuplicates?: boolean;
}

const actionTypeMap: Record<string, AuditActionType> = {
  category_created: 'category_created',
  category_updated: 'category_updated',
  category_archived: 'category_archived',
  category_restored: 'category_restored',
  subcomponent_created: 'habit_created',
  subcomponent_updated: 'habit_updated',
  subcomponent_archived: 'habit_archived',
  subcomponent_restored: 'habit_restored',
  habit_created: 'habit_created',
  habit_updated: 'habit_updated',
  habit_archived: 'habit_archived',
  habit_restored: 'habit_restored',
  tracking_type_changed: 'tracking_type_changed',
  smart_goal_changed: 'smart_goal_changed',
  target_value_changed: 'target_value_changed',
  frequency_changed: 'frequency_changed',
  weight_changed: 'weight_changed',
  data_imported: 'data_imported',
  data_exported: 'data_exported',
  daily_plan_generated: 'daily_plan_generated',
  daily_plan_adjusted: 'daily_plan_adjusted',
  daily_plan_confirmed: 'daily_plan_confirmed',
};

const createId = (): string => crypto.randomUUID();
const DETERMINISTIC_UUID_NAMESPACE = 'sadhana-os:v0.2:local-migration';
const LOCAL_MIGRATION_COMPLETIONS_KEY = 'local_migration_completions';
const STARTER_DEDUPE_AUDIT_NOTE = 'Archived duplicate starter-template category after local migration';
const LOCAL_BACKUP_CLEANUP_AUDIT_NOTE = 'Archived custom category copied from local backup';
const STARTER_TEMPLATE_DEDUPE_AUDIT_SOURCE = 'local-migration-starter-dedupe';
const LOCAL_BACKUP_CLEANUP_AUDIT_SOURCE = 'local-migration-cleanup';
const starterSeedCategories = createSeedCategories({
  timestamp: '2026-06-01T00:00:00.000Z',
});
const starterSeedCategoryById = new Map(starterSeedCategories.map((category) => [category.id, category]));

function hashStringToUuid(source: string): string {
  const bytes = new Uint8Array(16);
  let hashA = 0x811c9dc5;
  let hashB = 0x9e3779b9;
  let hashC = 0x85ebca6b;
  let hashD = 0xc2b2ae35;

  for (let index = 0; index < source.length; index += 1) {
    const charCode = source.charCodeAt(index);
    hashA ^= charCode;
    hashA = Math.imul(hashA, 0x01000193);
    hashB ^= charCode + index;
    hashB = Math.imul(hashB, 0x85ebca6b);
    hashC ^= charCode << (index % 8);
    hashC = Math.imul(hashC, 0xc2b2ae35);
    hashD ^= charCode + hashA;
    hashD = Math.imul(hashD, 0x27d4eb2d);
  }

  [hashA, hashB, hashC, hashD].forEach((hash, hashIndex) => {
    const offset = hashIndex * 4;
    bytes[offset] = hash >>> 24;
    bytes[offset + 1] = hash >>> 16;
    bytes[offset + 2] = hash >>> 8;
    bytes[offset + 3] = hash;
  });

  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function createDeterministicMigrationId(userId: string, sourceType: string, sourceKey: string): string {
  return hashStringToUuid(`${DETERMINISTIC_UUID_NAMESPACE}:${userId}:${sourceType}:${sourceKey}`);
}

const normalizeActionType = (entry: StoredAuditLogEntry): AuditActionType =>
  actionTypeMap[entry.actionType ?? entry.action ?? ''] ?? 'category_updated';

const normalizeEntityType = (entityType: StoredAuditLogEntry['entityType']): AuditEntityType =>
  entityType === 'subComponent' ? 'habit' : entityType;

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(',')}}`;
};

export const checksumSnapshot = (snapshot: AppStateSnapshot): string => {
  const { dailyPlans, ...legacySnapshot } = snapshot;
  const checksumValue = dailyPlans && Object.keys(dailyPlans).length > 0
    ? snapshot
    : legacySnapshot;
  const source = stableStringify(checksumValue);
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }

  return `local-${Math.abs(hash).toString(16).padStart(8, '0')}`;
};

export const hasMigratableLocalData = (snapshot: AppStateSnapshot): boolean =>
  snapshot.categories.length > 0
  || Object.keys(snapshot.dailyEntries).length > 0
  || Object.keys(snapshot.journalEntries).length > 0
  || snapshot.auditLogs.length > 0
  || Object.keys(snapshot.dailyPlans ?? {}).length > 0;

export function hasMeaningfulLocalMigrationData(snapshot: AppStateSnapshot): boolean {
  const hasCustomCategories = snapshot.categories.some((category) => !isStarterTemplateCategory(category));
  const dailyEntries = Object.values(snapshot.dailyEntries);

  return hasCustomCategories
    || dailyEntries.length > 0
    || dailyEntries.some((entry) => Object.keys(entry.completions).length > 0)
    || Object.keys(snapshot.journalEntries).length > 0
    || Object.keys(snapshot.dailyPlans ?? {}).length > 0
    || snapshot.auditLogs.some((entry) => !isStarterOnlyAuditLog(entry));
}

export function createLocalMigrationPreview(snapshot: AppStateSnapshot): LocalMigrationPreview {
  const customCategoryNames = snapshot.categories
    .filter((category) => !category.isArchived && !isStarterTemplateCategory(category))
    .map((category) => category.name);
  const starterCategoryCount = snapshot.categories.filter(isStarterTemplateCategory).length;
  const dailyEntries = Object.values(snapshot.dailyEntries);
  const summary: LocalMigrationSummary = {
    categories: snapshot.categories.length,
    habits: snapshot.categories.reduce((total, category) => total + category.subComponents.length, 0),
    dailyEntries: dailyEntries.length,
    dailyHabitEntries: dailyEntries.reduce((total, entry) => total + Object.keys(entry.completions).length, 0),
    journalEntries: Object.keys(snapshot.journalEntries).length,
    auditLogs: snapshot.auditLogs.length,
    totalRows: 0,
  };
  const dailyPlanCount = Object.keys(snapshot.dailyPlans ?? {}).length;
  if (dailyPlanCount > 0) summary.dailyPlans = dailyPlanCount;
  summary.totalRows = summary.categories
    + summary.habits
    + summary.dailyEntries
    + summary.dailyHabitEntries
    + summary.journalEntries
    + summary.auditLogs;
  summary.totalRows += summary.dailyPlans ?? 0;

  return {
    checksum: checksumSnapshot(snapshot),
    summary,
    customCategoryNames,
    starterCategoryCount,
    hasPracticeHistory: dailyEntries.length > 0 || dailyEntries.some((entry) => Object.keys(entry.completions).length > 0),
    hasJournalEntries: Object.keys(snapshot.journalEntries).length > 0,
  };
}

export function hasCloudUserContent(snapshot: AppStateSnapshot): boolean {
  return snapshot.categories.some((category) => !category.isArchived && !isStarterTemplateCategory(category))
    || Object.keys(snapshot.dailyEntries).length > 0
    || Object.keys(snapshot.journalEntries).length > 0
    || Object.keys(snapshot.dailyPlans ?? {}).length > 0;
}

export function findCopiedLocalCustomCategories(
  localSnapshot: AppStateSnapshot,
  userId: string,
  cloudSnapshot: AppStateSnapshot,
): CopiedLocalCategory[] {
  const idMap = createMigrationIdMap(localSnapshot, userId, {
    existingCloudSnapshot: cloudSnapshot,
  });
  const cloudCategoriesById = new Map(cloudSnapshot.categories.map((category) => [category.id, category]));

  return localSnapshot.categories.flatMap((localCategory) => {
    if (localCategory.isArchived || isStarterTemplateCategory(localCategory)) {
      return [];
    }

    const cloudCategoryId = idMap.categoryIds.get(localCategory.id);
    const cloudCategory = cloudCategoryId ? cloudCategoriesById.get(cloudCategoryId) : null;

    if (!cloudCategory || cloudCategory.isArchived) {
      return [];
    }

    return [{
      id: cloudCategory.id,
      name: cloudCategory.name,
    }];
  });
}

export function archiveCopiedLocalCustomCategories(
  snapshot: AppStateSnapshot,
  categoriesToArchive: CopiedLocalCategory[],
  options: { timestamp?: string; auditIdFactory?: () => string } = {},
): StarterTemplateDuplicateRepairResult {
  const now = options.timestamp ?? new Date().toISOString();
  const archivedCategoryIds = new Set(categoriesToArchive.map((category) => category.id));
  const archivedHabitIds = new Set<string>();
  const auditLogs: StoredAuditLogEntry[] = [];

  if (archivedCategoryIds.size === 0) {
    return {
      snapshot,
      archivedCategoryIds: [],
      archivedHabitIds: [],
      addedAuditLogs: [],
    };
  }

  const repairedCategories = snapshot.categories.map((category) => {
    if (!archivedCategoryIds.has(category.id) || category.isArchived) {
      return category;
    }

    category.subComponents.forEach((habit) => {
      if (!habit.isArchived) {
        archivedHabitIds.add(habit.id);
      }
    });
    auditLogs.push({
      id: options.auditIdFactory?.() ?? crypto.randomUUID(),
      timestamp: now,
      actionType: 'category_archived',
      entityType: 'category',
      entityId: category.id,
      oldValue: category,
      newValue: {
        ...category,
        isArchived: true,
        updatedAt: now,
        source: LOCAL_BACKUP_CLEANUP_AUDIT_SOURCE,
      },
      note: LOCAL_BACKUP_CLEANUP_AUDIT_NOTE,
    });

    return {
      ...category,
      isArchived: true,
      updatedAt: now,
      subComponents: category.subComponents.map((habit) => ({
        ...habit,
        isArchived: true,
        updatedAt: now,
      })),
    };
  });

  return {
    snapshot: {
      ...snapshot,
      categories: repairedCategories,
      auditLogs: [...snapshot.auditLogs, ...auditLogs],
    },
    archivedCategoryIds: [...archivedCategoryIds],
    archivedHabitIds: [...archivedHabitIds],
    addedAuditLogs: auditLogs,
  };
}

export function getLocalMigrationCompletion(checksum: string): LocalMigrationCompletion | null {
  return getLocalMigrationCompletions().find((completion) => completion.checksum === checksum) ?? null;
}

export function recordLocalMigrationCompletion(input: LocalMigrationCompletion): void {
  const completions = getLocalMigrationCompletions();
  const nextCompletions = [
    input,
    ...completions.filter((completion) => completion.checksum !== input.checksum),
  ].slice(0, 20);

  setItem(LOCAL_MIGRATION_COMPLETIONS_KEY, nextCompletions);
}

function getLocalMigrationCompletions(): LocalMigrationCompletion[] {
  const completions = getItem<LocalMigrationCompletion[]>(LOCAL_MIGRATION_COMPLETIONS_KEY, []);
  return Array.isArray(completions) ? completions : [];
}

interface MigrationIdMap {
  categoryIds: Map<string, string>;
  habitIds: Map<string, string>;
}

function createMigrationIdMap(
  snapshot: AppStateSnapshot,
  userId: string,
  options: LocalMigrationPlanOptions = {},
): MigrationIdMap {
  const existingStarterIdMap = createExistingCloudStarterIdMap(snapshot, options.existingCloudSnapshot);
  const categoryIds = new Map<string, string>();
  const habitIds = new Map<string, string>();

  snapshot.categories.forEach((category) => {
    categoryIds.set(
      category.id,
      existingStarterIdMap.categoryIds.get(category.id)
        ?? createDeterministicMigrationId(userId, 'category', category.id),
    );
    category.subComponents.forEach((habit) => {
      habitIds.set(
        habit.id,
        existingStarterIdMap.habitIds.get(habit.id)
          ?? createDeterministicMigrationId(userId, 'habit', habit.id),
      );
    });
  });

  return { categoryIds, habitIds };
}

const remapIdReference = (value: string, idMap: MigrationIdMap): string =>
  idMap.categoryIds.get(value) ?? idMap.habitIds.get(value) ?? value;

function remapScoreRecordKeys(record: Record<string, number>, idMap: Map<string, string>): Record<string, number> {
  return Object.entries(record).reduce<Record<string, number>>((result, [key, value]) => {
    const remappedKey = idMap.get(key) ?? key;
    const currentValue = result[remappedKey];
    result[remappedKey] = currentValue === undefined ? value : Math.max(currentValue, value);
    return result;
  }, {});
}

function remapAuditValue(value: unknown, idMap: MigrationIdMap): unknown {
  if (typeof value === 'string') {
    return remapIdReference(value, idMap);
  }

  if (Array.isArray(value)) {
    return value.map((item) => remapAuditValue(item, idMap));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        remapIdReference(key, idMap),
        remapAuditValue(item, idMap),
      ]),
    );
  }

  return value;
}

function remapAuditEntityId(entry: StoredAuditLogEntry, idMap: MigrationIdMap): string {
  const entityType = normalizeEntityType(entry.entityType);

  if (entityType === 'category') {
    return idMap.categoryIds.get(entry.entityId) ?? entry.entityId;
  }

  if (entityType === 'habit') {
    return idMap.habitIds.get(entry.entityId) ?? entry.entityId;
  }

  return entry.entityId;
}

export function createLocalMigrationPlan(
  snapshot: AppStateSnapshot,
  userId: string,
  options: LocalMigrationPlanOptions = {},
): LocalMigrationPlan {
  const idMap = createMigrationIdMap(snapshot, userId, options);
  const categories = snapshot.categories.map((category): CloudCategoryRow => ({
    id: idMap.categoryIds.get(category.id) ?? category.id,
    user_id: userId,
    name: category.name,
    icon: category.icon,
    color: category.color,
    display_order: category.displayOrder,
    is_archived: category.isArchived,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  }));

  const habits = snapshot.categories.flatMap((category) =>
    category.subComponents.map((habit): CloudHabitRow => ({
      id: idMap.habitIds.get(habit.id) ?? habit.id,
      user_id: userId,
      category_id: idMap.categoryIds.get(category.id) ?? category.id,
      name: habit.name,
      tracking_type: habit.trackingType,
      display_order: habit.displayOrder,
      is_archived: habit.isArchived,
      created_at: habit.createdAt,
      updated_at: habit.updatedAt,
    })),
  );

  const dailyEntries = Object.values(snapshot.dailyEntries).map((entry): CloudDailyEntryRow => ({
    id: createDeterministicMigrationId(userId, 'daily-entry', entry.date),
    user_id: userId,
    entry_date: entry.date,
    overall_score: entry.overallScore,
    category_scores: remapScoreRecordKeys(entry.categoryScores, idMap.categoryIds),
    created_at: entry.updatedAt,
    updated_at: entry.updatedAt,
  }));

  const dailyHabitEntries = Object.values(snapshot.dailyEntries).flatMap((entry) =>
    mapDailyHabitRows(entry, userId, idMap),
  );

  const journalEntries = Object.values(snapshot.journalEntries).map((entry): CloudJournalEntryRow => ({
    id: createDeterministicMigrationId(userId, 'journal-entry', entry.date),
    user_id: userId,
    entry_date: entry.date,
    mood: entry.mood ?? null,
    gratitude: entry.gratitude ?? null,
    spiritual_insight: entry.spiritualInsight ?? null,
    trigger_observed: entry.triggerObserved ?? null,
    lesson_learned: entry.lessonLearned ?? null,
    content: entry.content,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  }));

  const auditLogs = snapshot.auditLogs.map((entry): CloudAuditLogEntryRow => ({
    id: createDeterministicMigrationId(userId, 'audit-log', entry.id),
    user_id: userId,
    timestamp: entry.timestamp,
    action_type: normalizeActionType(entry),
    entity_type: normalizeEntityType(entry.entityType),
    entity_id: remapAuditEntityId(entry, idMap),
    old_value: remapAuditValue('oldValue' in entry ? entry.oldValue ?? null : entry.before ?? null, idMap),
    new_value: remapAuditValue('newValue' in entry ? entry.newValue ?? null : entry.after ?? null, idMap),
    note: entry.note ?? entry.description ?? null,
    source: 'migration',
  }));

  const dailyPlans = Object.values(snapshot.dailyPlans ?? {}).map(
    (plan): CloudDailySadhanaPlanRow => ({
      id: createDeterministicMigrationId(userId, 'daily-plan', plan.date),
      user_id: userId,
      plan_date: plan.date,
      mode: plan.mode,
      status: plan.status,
      available_minutes: plan.availableMinutes,
      energy_level: plan.energyLevel,
      focus_category_ids: plan.focusCategoryIds.map(
        (categoryId) => idMap.categoryIds.get(categoryId) ?? categoryId,
      ),
      intention: plan.intention ?? null,
      items: plan.items.map((item) => ({
        ...item,
        habitId: idMap.habitIds.get(item.habitId) ?? item.habitId,
        categoryId: idMap.categoryIds.get(item.categoryId) ?? item.categoryId,
      })),
      excluded_habit_ids: plan.excludedHabitIds.map(
        (habitId) => idMap.habitIds.get(habitId) ?? habitId,
      ),
      engine_version: plan.engineVersion,
      created_at: plan.createdAt,
      updated_at: plan.updatedAt,
    }),
  );

  const rows = normalizeMigrationRows({
    categories,
    habits,
    dailyEntries,
    dailyHabitEntries,
    journalEntries,
    auditLogs,
    dailyPlans,
  });
  const summary = summarizeRows(rows);

  return {
    userId,
    sourceSchemaVersion: snapshot.version,
    checksum: checksumSnapshot(snapshot),
    summary,
    rows,
  };
}

function normalizeMigrationRows(rows: LocalMigrationPlan['rows']): LocalMigrationPlan['rows'] {
  return {
    categories: uniqueRowsByKey(rows.categories, (row) => `${row.user_id}:${row.id}`, chooseLatestTimestampedRow),
    habits: uniqueRowsByKey(rows.habits, (row) => `${row.user_id}:${row.id}`, chooseLatestTimestampedRow),
    dailyEntries: uniqueRowsByKey(
      rows.dailyEntries,
      (row) => `${row.user_id}:${row.entry_date}`,
      chooseLatestTimestampedRow,
    ),
    dailyHabitEntries: uniqueRowsByKey(
      rows.dailyHabitEntries,
      (row) => `${row.user_id}:${row.entry_date}:${row.habit_id}`,
      chooseDailyHabitEntryRow,
    ),
    journalEntries: uniqueRowsByKey(
      rows.journalEntries,
      (row) => `${row.user_id}:${row.entry_date}`,
      chooseLatestTimestampedRow,
    ),
    auditLogs: uniqueRowsByKey(rows.auditLogs, (row) => `${row.user_id}:${row.id}`, chooseLatestAuditRow),
    dailyPlans: uniqueRowsByKey(
      rows.dailyPlans ?? [],
      (row) => `${row.user_id}:${row.plan_date}`,
      chooseLatestTimestampedRow,
    ),
  };
}

function uniqueRowsByKey<T>(
  rows: T[],
  keyFactory: (row: T) => string,
  chooseRow: (current: T, next: T) => T,
): T[] {
  const rowsByKey = new Map<string, T>();

  rows.forEach((row) => {
    const key = keyFactory(row);
    const current = rowsByKey.get(key);
    rowsByKey.set(key, current ? chooseRow(current, row) : row);
  });

  return [...rowsByKey.values()];
}

function chooseLatestTimestampedRow<T extends { updated_at: string; created_at?: string }>(current: T, next: T): T {
  return getRowTimestamp(next) >= getRowTimestamp(current) ? next : current;
}

function chooseLatestAuditRow(current: CloudAuditLogEntryRow, next: CloudAuditLogEntryRow): CloudAuditLogEntryRow {
  return Date.parse(next.timestamp) >= Date.parse(current.timestamp) ? next : current;
}

function chooseDailyHabitEntryRow(
  current: CloudDailyHabitEntryRow,
  next: CloudDailyHabitEntryRow,
): CloudDailyHabitEntryRow {
  const currentValueWeight = getTrackingValueWeight(current.value);
  const nextValueWeight = getTrackingValueWeight(next.value);

  if (nextValueWeight !== currentValueWeight) {
    return nextValueWeight > currentValueWeight ? next : current;
  }

  return chooseLatestTimestampedRow(current, next);
}

function getRowTimestamp(row: { updated_at: string; created_at?: string }): number {
  const updatedAt = Date.parse(row.updated_at);
  if (Number.isFinite(updatedAt)) return updatedAt;

  const createdAt = row.created_at ? Date.parse(row.created_at) : NaN;
  return Number.isFinite(createdAt) ? createdAt : 0;
}

function getTrackingValueWeight(value: TrackingValue): number {
  if (value === true) return 3;
  if (typeof value === 'number' && value > 0) return 2;
  if (typeof value === 'string' && value.trim().length > 0) return 2;
  return 0;
}

export function archiveDuplicateStarterTemplateRows(
  snapshot: AppStateSnapshot,
  options: { timestamp?: string; auditIdFactory?: () => string } = {},
): StarterTemplateDuplicateRepairResult {
  const now = options.timestamp ?? new Date().toISOString();
  const archivedCategoryIds = new Set<string>();
  const archivedHabitIds = new Set<string>();
  const auditLogs: StoredAuditLogEntry[] = [];
  const categoriesBySeedId = createStarterLikeCategoryGroups(snapshot.categories);

  categoriesBySeedId.forEach((categories) => {
    if (categories.length < 2) return;

    const canonicalCategory = chooseCanonicalStarterCategory(categories, snapshot);
    categories
      .filter((category) => category.id !== canonicalCategory.id && !category.isArchived)
      .forEach((category) => {
        archivedCategoryIds.add(category.id);
        category.subComponents.forEach((habit) => {
          if (!habit.isArchived) {
            archivedHabitIds.add(habit.id);
          }
        });
        auditLogs.push({
          id: options.auditIdFactory?.() ?? crypto.randomUUID(),
          timestamp: now,
          actionType: 'category_archived',
          entityType: 'category',
          entityId: category.id,
          oldValue: category,
          newValue: {
            ...category,
            isArchived: true,
            updatedAt: now,
          },
          note: STARTER_DEDUPE_AUDIT_NOTE,
        });
      });
  });

  if (archivedCategoryIds.size === 0) {
    return {
      snapshot,
      archivedCategoryIds: [],
      archivedHabitIds: [],
      addedAuditLogs: [],
    };
  }

  const repairedCategories = snapshot.categories.map((category) => {
    if (!archivedCategoryIds.has(category.id)) return category;

    return {
      ...category,
      isArchived: true,
      updatedAt: now,
      subComponents: category.subComponents.map((habit) => ({
        ...habit,
        isArchived: true,
        updatedAt: now,
      })),
    };
  });

  return {
    snapshot: {
      ...snapshot,
      categories: repairedCategories,
      auditLogs: [
        ...snapshot.auditLogs,
        ...auditLogs.map((entry) => ({
          ...entry,
          newValue: {
            ...(entry.newValue as Record<string, unknown>),
            source: STARTER_TEMPLATE_DEDUPE_AUDIT_SOURCE,
          },
        })),
      ],
    },
    archivedCategoryIds: [...archivedCategoryIds],
    archivedHabitIds: [...archivedHabitIds],
    addedAuditLogs: auditLogs,
  };
}

function mapDailyHabitRows(
  entry: DailyEntry,
  userId: string,
  idMap: MigrationIdMap,
): CloudDailyHabitEntryRow[] {
  return Object.entries(entry.completions).map(([habitId, value]) => ({
    id: createDeterministicMigrationId(userId, 'daily-habit-entry', `${entry.date}:${habitId}`),
    user_id: userId,
    entry_date: entry.date,
    habit_id: idMap.habitIds.get(habitId) ?? habitId,
    value,
    created_at: entry.updatedAt,
    updated_at: entry.updatedAt,
  }));
}

function createExistingCloudStarterIdMap(
  localSnapshot: AppStateSnapshot,
  existingCloudSnapshot?: AppStateSnapshot | null,
): MigrationIdMap {
  const categoryIds = new Map<string, string>();
  const habitIds = new Map<string, string>();

  if (!existingCloudSnapshot) {
    return { categoryIds, habitIds };
  }

  localSnapshot.categories.forEach((localCategory) => {
    const seedCategory = starterSeedCategoryById.get(localCategory.id);
    if (!seedCategory || !categoryMatchesStarterTemplate(localCategory, seedCategory)) {
      return;
    }

    const existingCategory = findStarterCategory(existingCloudSnapshot.categories, seedCategory);
    if (!existingCategory) {
      return;
    }

    categoryIds.set(localCategory.id, existingCategory.id);
    localCategory.subComponents.forEach((localHabit) => {
      const seedHabit = seedCategory.subComponents.find((habit) => habit.id === localHabit.id);
      if (!seedHabit || !habitMatchesStarterTemplate(localHabit, seedHabit)) {
        return;
      }

      const existingHabit = findStarterHabit(existingCategory, seedHabit);
      if (existingHabit) {
        habitIds.set(localHabit.id, existingHabit.id);
      }
    });
  });

  return { categoryIds, habitIds };
}

function createStarterLikeCategoryGroups(categories: Category[]): Map<string, Category[]> {
  const groups = new Map<string, Category[]>();

  starterSeedCategories.forEach((seedCategory) => {
    const matches = categories.filter((category) =>
      !category.isArchived && categoryMatchesStarterTemplate(category, seedCategory),
    );

    if (matches.length > 0) {
      groups.set(seedCategory.id, matches);
    }
  });

  return groups;
}

function chooseCanonicalStarterCategory(categories: Category[], snapshot: AppStateSnapshot): Category {
  return [...categories].sort((a, b) => {
    const usageDifference = getCategoryUsageScore(b, snapshot) - getCategoryUsageScore(a, snapshot);
    if (usageDifference !== 0) return usageDifference;

    const habitDifference = getActiveHabitCount(b) - getActiveHabitCount(a);
    if (habitDifference !== 0) return habitDifference;

    const createdDifference = Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (Number.isFinite(createdDifference) && createdDifference !== 0) return createdDifference;

    return a.id.localeCompare(b.id);
  })[0]!;
}

function getCategoryUsageScore(category: Category, snapshot: AppStateSnapshot): number {
  const habitIds = new Set(category.subComponents.map((habit) => habit.id));

  return Object.values(snapshot.dailyEntries).reduce((score, entry) => {
    const categoryScore = Object.prototype.hasOwnProperty.call(entry.categoryScores, category.id) ? 10 : 0;
    const habitScore = Object.keys(entry.completions).filter((habitId) => habitIds.has(habitId)).length;
    return score + categoryScore + habitScore;
  }, 0);
}

function getActiveHabitCount(category: Category): number {
  return category.subComponents.filter((habit) => !habit.isArchived).length;
}

function findStarterCategory(categories: Category[], seedCategory: Category): Category | null {
  const matches = categories.filter((category) =>
    !category.isArchived && categoryMatchesStarterTemplate(category, seedCategory),
  );

  if (matches.length === 0) return null;

  return chooseCanonicalStarterCategory(matches, {
    version: '0.2',
    categories,
    dailyEntries: {},
    journalEntries: {},
    auditLogs: [],
  });
}

function findStarterHabit(category: Category, seedHabit: Category['subComponents'][number]) {
  return category.subComponents.find((habit) =>
    !habit.isArchived && habitMatchesStarterTemplate(habit, seedHabit),
  ) ?? null;
}

export function isStarterTemplateCategory(category: Category): boolean {
  return starterSeedCategories.some((seedCategory) => categoryMatchesStarterTemplate(category, seedCategory));
}

function categoryMatchesStarterTemplate(category: Category, seedCategory: Category): boolean {
  if (normalizeText(category.name) !== normalizeText(seedCategory.name)) return false;
  if (category.icon !== seedCategory.icon) return false;
  if (category.color.toLowerCase() !== seedCategory.color.toLowerCase()) return false;

  return seedCategory.subComponents.every((seedHabit) =>
    category.subComponents.some((habit) => habitMatchesStarterTemplate(habit, seedHabit)),
  );
}

function habitMatchesStarterTemplate(
  habit: Category['subComponents'][number],
  seedHabit: Category['subComponents'][number],
): boolean {
  return normalizeText(habit.name) === normalizeText(seedHabit.name)
    && habit.trackingType === seedHabit.trackingType;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function isStarterOnlyAuditLog(entry: StoredAuditLogEntry): boolean {
  const actionType = entry.actionType ?? entry.action;
  const note = normalizeText(entry.note ?? entry.description ?? '');
  const isSystemSeedEvent = actionType === 'data_imported'
    && entry.entityType === 'system'
    && entry.entityId === 'system';

  if (!isSystemSeedEvent) {
    return false;
  }

  if (
    note === 'initial seed data'
    || note === normalizeText(`Applied starter template ${STARTER_TEMPLATE_VERSION}`)
    || note.startsWith('migrated schema from 1.0 to 1.1')
  ) {
    return true;
  }

  const importedValue = 'newValue' in entry ? entry.newValue : entry.after;
  return Boolean(
    importedValue
    && typeof importedValue === 'object'
    && (importedValue as Record<string, unknown>).starterTemplateVersion === STARTER_TEMPLATE_VERSION,
  );
}

function summarizeRows(rows: LocalMigrationPlan['rows']): LocalMigrationSummary {
  const summary: LocalMigrationSummary = {
    categories: rows.categories.length,
    habits: rows.habits.length,
    dailyEntries: rows.dailyEntries.length,
    dailyHabitEntries: rows.dailyHabitEntries.length,
    journalEntries: rows.journalEntries.length,
    auditLogs: rows.auditLogs.length,
    totalRows: 0,
  };
  const dailyPlanCount = rows.dailyPlans?.length ?? 0;
  if (dailyPlanCount > 0) summary.dailyPlans = dailyPlanCount;

  summary.totalRows = summary.categories
    + summary.habits
    + summary.dailyEntries
    + summary.dailyHabitEntries
    + summary.journalEntries
    + summary.auditLogs;
  summary.totalRows += summary.dailyPlans ?? 0;

  return summary;
}

export async function uploadLocalMigrationPlan(
  client: SupabaseClient,
  plan: LocalMigrationPlan,
): Promise<LocalMigrationResult> {
  const importJobId = createId();
  const startedSummary = {
    ...plan.summary,
    checksum: plan.checksum,
    sourceSchemaVersion: plan.sourceSchemaVersion,
  };

  const { error: importJobError } = await client.from('import_jobs').insert({
    id: importJobId,
    user_id: plan.userId,
    source: 'localStorage',
    mode: 'merge',
    status: 'running',
    summary: startedSummary,
  });

  if (importJobError) {
    throw importJobError;
  }

  try {
    await upsertRows(client, 'categories', plan.rows.categories, 'user_id,id');
    await upsertRows(client, 'habits', plan.rows.habits, 'user_id,id');
    await upsertRows(client, 'daily_entries', plan.rows.dailyEntries, 'user_id,entry_date');
    await upsertRows(
      client,
      'daily_habit_entries',
      plan.rows.dailyHabitEntries,
      'user_id,entry_date,habit_id',
    );
    await upsertRows(client, 'journal_entries', plan.rows.journalEntries, 'user_id,entry_date');
    await upsertRows(client, 'audit_log_entries', plan.rows.auditLogs, 'user_id,id', {
      ignoreDuplicates: true,
    });
    await upsertRows(
      client,
      'daily_sadhana_plans',
      plan.rows.dailyPlans ?? [],
      'user_id,plan_date',
    );

    const completedAt = new Date().toISOString();
    const { error: updateError } = await client
      .from('import_jobs')
      .update({
        status: 'succeeded',
        completed_at: completedAt,
        summary: startedSummary,
      })
      .eq('id', importJobId);

    if (updateError) {
      throw updateError;
    }

    return {
      importJobId,
      completedAt,
      checksum: plan.checksum,
      summary: plan.summary,
    };
  } catch (error) {
    await client
      .from('import_jobs')
      .update({
        status: 'failed',
        error_message: getMigrationErrorMessage(error),
        summary: startedSummary,
      })
      .eq('id', importJobId);

    throw error;
  }
}

async function upsertRows(
  client: SupabaseClient,
  table: string,
  rows: unknown[],
  onConflict: string,
  options: UpsertOptions = {},
): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await client.from(table).upsert(rows, {
    onConflict,
    ignoreDuplicates: options.ignoreDuplicates,
  });
  if (error) {
    throw error;
  }
}

export function getMigrationErrorMessage(error: unknown, fallback = 'Migration failed.'): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const parts = ['message', 'details', 'hint']
      .map((key) => record[key])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  return fallback;
}
