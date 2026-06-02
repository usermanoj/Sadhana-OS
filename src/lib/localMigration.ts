import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditActionType, AuditEntityType, DailyEntry, TrackingValue } from '../types';
import type { AppStateSnapshot, StoredAuditLogEntry } from './repository';

export interface LocalMigrationSummary {
  categories: number;
  habits: number;
  dailyEntries: number;
  dailyHabitEntries: number;
  journalEntries: number;
  auditLogs: number;
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
  };
}

export interface LocalMigrationResult {
  importJobId: string;
  completedAt: string;
  checksum: string;
  summary: LocalMigrationSummary;
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
};

const createId = (): string => crypto.randomUUID();
const DETERMINISTIC_UUID_NAMESPACE = 'sadhana-os:v0.2:local-migration';

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
  const source = stableStringify(snapshot);
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
  || snapshot.auditLogs.length > 0;

interface MigrationIdMap {
  categoryIds: Map<string, string>;
  habitIds: Map<string, string>;
}

function createMigrationIdMap(snapshot: AppStateSnapshot, userId: string): MigrationIdMap {
  const categoryIds = new Map<string, string>();
  const habitIds = new Map<string, string>();

  snapshot.categories.forEach((category) => {
    categoryIds.set(category.id, createDeterministicMigrationId(userId, 'category', category.id));
    category.subComponents.forEach((habit) => {
      habitIds.set(habit.id, createDeterministicMigrationId(userId, 'habit', habit.id));
    });
  });

  return { categoryIds, habitIds };
}

const remapIdReference = (value: string, idMap: MigrationIdMap): string =>
  idMap.categoryIds.get(value) ?? idMap.habitIds.get(value) ?? value;

function remapRecordKeys<T>(record: Record<string, T>, idMap: Map<string, string>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [idMap.get(key) ?? key, value]),
  );
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
): LocalMigrationPlan {
  const idMap = createMigrationIdMap(snapshot, userId);
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
    category_scores: remapRecordKeys(entry.categoryScores, idMap.categoryIds),
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

  const summary = summarizeRows({
    categories,
    habits,
    dailyEntries,
    dailyHabitEntries,
    journalEntries,
    auditLogs,
  });

  return {
    userId,
    sourceSchemaVersion: snapshot.version,
    checksum: checksumSnapshot(snapshot),
    summary,
    rows: {
      categories,
      habits,
      dailyEntries,
      dailyHabitEntries,
      journalEntries,
      auditLogs,
    },
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

function summarizeRows(rows: LocalMigrationPlan['rows']): LocalMigrationSummary {
  const summary = {
    categories: rows.categories.length,
    habits: rows.habits.length,
    dailyEntries: rows.dailyEntries.length,
    dailyHabitEntries: rows.dailyHabitEntries.length,
    journalEntries: rows.journalEntries.length,
    auditLogs: rows.auditLogs.length,
    totalRows: 0,
  };

  summary.totalRows = summary.categories
    + summary.habits
    + summary.dailyEntries
    + summary.dailyHabitEntries
    + summary.journalEntries
    + summary.auditLogs;

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
    await upsertRows(client, 'audit_log_entries', plan.rows.auditLogs, 'user_id,id');

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
        error_message: error instanceof Error ? error.message : 'Migration failed.',
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
): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await client.from(table).upsert(rows, { onConflict });
  if (error) {
    throw error;
  }
}
