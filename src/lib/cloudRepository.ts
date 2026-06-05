import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AuditActionType,
  AuditEntityType,
  Category,
  DailyEntry,
  DateKey,
  JournalEntry,
  TrackingType,
  TrackingValue,
} from '../types';
import type { AppStateSnapshot, StoredAuditLogEntry } from './repository';

interface CloudCategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  display_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface CloudHabitRow {
  id: string;
  category_id: string;
  name: string;
  tracking_type: TrackingType;
  display_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface CloudDailyEntryRow {
  entry_date: string;
  overall_score: number;
  category_scores: Record<string, number>;
  updated_at: string;
}

interface CloudDailyHabitEntryRow {
  entry_date: string;
  habit_id: string;
  value: TrackingValue;
}

interface CloudJournalEntryRow {
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

interface CloudAuditLogEntryRow {
  id: string;
  timestamp: string;
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string;
  old_value: unknown | null;
  new_value: unknown | null;
  note: string | null;
}

interface CloudSettingsRow {
  schema_version: string;
}

export type CloudMutationType = 'replaceSnapshot';
export type CloudMutationStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'conflict';

export interface CloudMutationStatusInput {
  clientMutationId: string;
  mutationType: CloudMutationType;
  status: CloudMutationStatus;
  attemptCount: number;
  lastErrorMessage?: string | null;
  metadata?: Record<string, unknown>;
  completedAt?: string | null;
}

interface CloudSyncMutationRow {
  user_id: string;
  client_mutation_id: string;
  mutation_type: CloudMutationType;
  status: CloudMutationStatus;
  attempt_count: number;
  last_error: string | null;
  metadata: Record<string, unknown>;
  completed_at: string | null;
}

export interface CloudSnapshotRows {
  settings: CloudSettingsRow | null;
  categories: CloudCategoryRow[];
  habits: CloudHabitRow[];
  dailyEntries: CloudDailyEntryRow[];
  dailyHabitEntries: CloudDailyHabitEntryRow[];
  journalEntries: CloudJournalEntryRow[];
  auditLogs: CloudAuditLogEntryRow[];
}

export interface CloudDataGateway {
  loadSnapshot(): Promise<AppStateSnapshot>;
  saveCategories(categories: Category[]): Promise<void>;
  saveDailyEntries(entries: Record<DateKey, DailyEntry>): Promise<void>;
  saveJournalEntries(entries: Record<DateKey, JournalEntry>): Promise<void>;
  saveAuditLogs(auditLogs: StoredAuditLogEntry[]): Promise<void>;
  replaceSnapshot(snapshot: AppStateSnapshot): Promise<void>;
  recordMutationStatus(input: CloudMutationStatusInput): Promise<void>;
}

interface UpsertOptions {
  ignoreDuplicates?: boolean;
}

export function mapCloudRowsToSnapshot(rows: CloudSnapshotRows): AppStateSnapshot {
  const habitsByCategory = new Map<string, CloudHabitRow[]>();
  rows.habits.forEach((habit) => {
    const current = habitsByCategory.get(habit.category_id) ?? [];
    current.push(habit);
    habitsByCategory.set(habit.category_id, current);
  });

  const categories = rows.categories
    .map((category): Category => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      displayOrder: category.display_order,
      isArchived: category.is_archived,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
      subComponents: (habitsByCategory.get(category.id) ?? [])
        .sort((a, b) => a.display_order - b.display_order)
        .map((habit) => ({
          id: habit.id,
          categoryId: habit.category_id,
          name: habit.name,
          trackingType: habit.tracking_type,
          displayOrder: habit.display_order,
          isArchived: habit.is_archived,
          createdAt: habit.created_at,
          updatedAt: habit.updated_at,
        })),
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const completionsByDate = new Map<string, Record<string, TrackingValue>>();
  rows.dailyHabitEntries.forEach((entry) => {
    const current = completionsByDate.get(entry.entry_date) ?? {};
    current[entry.habit_id] = entry.value;
    completionsByDate.set(entry.entry_date, current);
  });

  const dailyEntries = Object.fromEntries(
    rows.dailyEntries.map((entry) => [
      entry.entry_date,
      {
        date: entry.entry_date,
        completions: completionsByDate.get(entry.entry_date) ?? {},
        categoryScores: entry.category_scores ?? {},
        overallScore: entry.overall_score,
        updatedAt: entry.updated_at,
      } satisfies DailyEntry,
    ]),
  );

  const journalEntries = Object.fromEntries(
    rows.journalEntries.map((entry) => [
      entry.entry_date,
      {
        date: entry.entry_date,
        mood: entry.mood ?? undefined,
        gratitude: entry.gratitude ?? undefined,
        spiritualInsight: entry.spiritual_insight ?? undefined,
        triggerObserved: entry.trigger_observed ?? undefined,
        lessonLearned: entry.lesson_learned ?? undefined,
        content: entry.content,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      } satisfies JournalEntry,
    ]),
  );

  const auditLogs: StoredAuditLogEntry[] = rows.auditLogs.map((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    actionType: entry.action_type,
    entityType: entry.entity_type,
    entityId: entry.entity_id,
    oldValue: entry.old_value,
    newValue: entry.new_value,
    note: entry.note ?? undefined,
  }));

  return {
    version: rows.settings?.schema_version ?? '0.2',
    categories,
    dailyEntries,
    journalEntries,
    auditLogs,
  };
}

export function createSupabaseCloudGateway(
  client: SupabaseClient,
  userId: string,
): CloudDataGateway {
  return {
    async loadSnapshot() {
      const [
        settings,
        categories,
        habits,
        dailyEntries,
        dailyHabitEntries,
        journalEntries,
        auditLogs,
      ] = await Promise.all([
        selectMaybeSingle<CloudSettingsRow>(client, 'user_settings', 'schema_version', 'user_id', userId),
        selectRows<CloudCategoryRow>(client, 'categories', '*', userId),
        selectRows<CloudHabitRow>(client, 'habits', '*', userId),
        selectRows<CloudDailyEntryRow>(client, 'daily_entries', '*', userId),
        selectRows<CloudDailyHabitEntryRow>(client, 'daily_habit_entries', '*', userId),
        selectRows<CloudJournalEntryRow>(client, 'journal_entries', '*', userId),
        selectRows<CloudAuditLogEntryRow>(client, 'audit_log_entries', '*', userId),
      ]);

      return mapCloudRowsToSnapshot({
        settings,
        categories,
        habits,
        dailyEntries,
        dailyHabitEntries,
        journalEntries,
        auditLogs,
      });
    },
    async saveCategories(categories) {
      await upsertRows(client, 'categories', flattenCategoryRows(categories, userId), 'user_id,id');
      await upsertRows(client, 'habits', flattenHabitRows(categories, userId), 'user_id,id');
    },
    async saveDailyEntries(entries) {
      await upsertRows(client, 'daily_entries', mapDailyEntryRows(entries, userId), 'user_id,entry_date');
      await upsertRows(
        client,
        'daily_habit_entries',
        mapDailyHabitRows(entries, userId),
        'user_id,entry_date,habit_id',
      );
    },
    async saveJournalEntries(entries) {
      await upsertRows(client, 'journal_entries', mapJournalRows(entries, userId), 'user_id,entry_date');
    },
    async saveAuditLogs(auditLogs) {
      await upsertRows(client, 'audit_log_entries', mapAuditRows(auditLogs, userId), 'user_id,id', {
        ignoreDuplicates: true,
      });
    },
    async replaceSnapshot(snapshot) {
      await this.saveCategories(snapshot.categories);
      await this.saveDailyEntries(snapshot.dailyEntries);
      await this.saveJournalEntries(snapshot.journalEntries);
      await this.saveAuditLogs(snapshot.auditLogs);
    },
    async recordMutationStatus(input) {
      await upsertRows(
        client,
        'sync_mutations',
        [mapCloudMutationStatusToRow(input, userId)],
        'user_id,client_mutation_id',
      );
    },
  };
}

export function mapCloudMutationStatusToRow(
  input: CloudMutationStatusInput,
  userId: string,
): CloudSyncMutationRow {
  return {
    user_id: userId,
    client_mutation_id: input.clientMutationId,
    mutation_type: input.mutationType,
    status: input.status,
    attempt_count: input.attemptCount,
    last_error: input.lastErrorMessage ?? null,
    metadata: input.metadata ?? {},
    completed_at: input.completedAt ?? null,
  };
}

async function selectRows<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  userId: string,
): Promise<T[]> {
  const { data, error } = await client.from(table).select(columns).eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as T[];
}

async function selectMaybeSingle<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  column: string,
  value: string,
): Promise<T | null> {
  const { data, error } = await client.from(table).select(columns).eq(column, value).maybeSingle();
  if (error) throw error;
  return data as T | null;
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
  if (error) throw error;
}

function flattenCategoryRows(categories: Category[], userId: string) {
  return categories.map((category) => ({
    id: category.id,
    user_id: userId,
    name: category.name,
    icon: category.icon,
    color: category.color,
    display_order: category.displayOrder,
    is_archived: category.isArchived,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  }));
}

function flattenHabitRows(categories: Category[], userId: string) {
  return categories.flatMap((category) =>
    category.subComponents.map((habit) => ({
      id: habit.id,
      user_id: userId,
      category_id: category.id,
      name: habit.name,
      tracking_type: habit.trackingType,
      display_order: habit.displayOrder,
      is_archived: habit.isArchived,
      created_at: habit.createdAt,
      updated_at: habit.updatedAt,
    })),
  );
}

function mapDailyEntryRows(entries: Record<DateKey, DailyEntry>, userId: string) {
  return Object.values(entries).map((entry) => ({
    user_id: userId,
    entry_date: entry.date,
    overall_score: entry.overallScore,
    category_scores: entry.categoryScores,
    updated_at: entry.updatedAt,
  }));
}

function mapDailyHabitRows(entries: Record<DateKey, DailyEntry>, userId: string) {
  return Object.values(entries).flatMap((entry) =>
    Object.entries(entry.completions).map(([habitId, value]) => ({
      user_id: userId,
      entry_date: entry.date,
      habit_id: habitId,
      value,
      updated_at: entry.updatedAt,
    })),
  );
}

function mapJournalRows(entries: Record<DateKey, JournalEntry>, userId: string) {
  return Object.values(entries).map((entry) => ({
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
}

function mapAuditRows(auditLogs: StoredAuditLogEntry[], userId: string) {
  return auditLogs.map((entry) => ({
    id: entry.id,
    user_id: userId,
    timestamp: entry.timestamp,
    action_type: entry.actionType ?? entry.action,
    entity_type: entry.entityType === 'subComponent' ? 'habit' : entry.entityType,
    entity_id: entry.entityId,
    old_value: 'oldValue' in entry ? entry.oldValue ?? null : entry.before ?? null,
    new_value: 'newValue' in entry ? entry.newValue ?? null : entry.after ?? null,
    note: entry.note ?? entry.description ?? null,
    source: 'client',
  }));
}
