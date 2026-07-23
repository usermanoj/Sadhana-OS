import type { AuditActionType, AuditEntityType, AuditLogEntry } from '../types';
import { appRepository } from './repository';

interface RecordAuditEntryInput {
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  oldValue: unknown | null;
  newValue: unknown | null;
  note?: string;
}

interface GetAuditLogsOptions {
  newestFirst?: boolean;
}

interface LegacyAuditLogEntry {
  id: string;
  timestamp: string;
  action?: string;
  actionType?: AuditActionType;
  entityType: 'category' | 'subComponent' | 'habit' | 'daily_plan' | 'system';
  entityId: string;
  before?: unknown | null;
  after?: unknown | null;
  oldValue?: unknown | null;
  newValue?: unknown | null;
  description?: string;
  note?: string;
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

const normalizeEntityType = (entityType: LegacyAuditLogEntry['entityType']): AuditEntityType =>
  entityType === 'subComponent' ? 'habit' : entityType;

const normalizeActionType = (action: string | undefined): AuditActionType =>
  actionTypeMap[action ?? ''] ?? 'category_updated';

const normalizeAuditEntry = (entry: LegacyAuditLogEntry): AuditLogEntry => ({
  id: entry.id,
  timestamp: entry.timestamp,
  actionType: entry.actionType ?? normalizeActionType(entry.action),
  entityType: normalizeEntityType(entry.entityType),
  entityId: entry.entityId,
  oldValue: 'oldValue' in entry ? entry.oldValue ?? null : entry.before ?? null,
  newValue: 'newValue' in entry ? entry.newValue ?? null : entry.after ?? null,
  note: entry.note ?? entry.description,
});

export function getAuditLogs(options: GetAuditLogsOptions = {}): AuditLogEntry[] {
  const logs = appRepository.getAuditLogs().map((entry) =>
    normalizeAuditEntry(entry as LegacyAuditLogEntry),
  );

  if (!options.newestFirst) {
    return logs;
  }

  return logs
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const timestampSort = b.entry.timestamp.localeCompare(a.entry.timestamp);
      return timestampSort === 0 ? b.index - a.index : timestampSort;
    })
    .map(({ entry }) => entry);
}

export function recordAuditEntry(input: RecordAuditEntryInput): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: input.entityId,
    oldValue: input.oldValue,
    newValue: input.newValue,
    note: input.note,
  };

  const auditLog = getAuditLogs();
  auditLog.push(entry);
  appRepository.setAuditLogs(auditLog);

  return entry;
}
