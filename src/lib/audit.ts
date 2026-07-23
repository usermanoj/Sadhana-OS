import type { AuditActionType, AuditEntityType } from '../types';
import { recordAuditEntry } from './auditService';

type LegacyAuditAction =
  | AuditActionType
  | 'subcomponent_created'
  | 'subcomponent_updated'
  | 'subcomponent_archived'
  | 'subcomponent_restored';

const legacyActionMap: Record<LegacyAuditAction, AuditActionType> = {
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

const normalizeEntityType = (
  entityType: 'category' | 'subComponent' | 'habit' | 'daily_plan' | 'system',
): AuditEntityType => (entityType === 'subComponent' ? 'habit' : entityType);

export function addAuditEntry(
  action: LegacyAuditAction,
  entityType: 'category' | 'subComponent' | 'habit' | 'daily_plan' | 'system',
  entityId: string,
  before: unknown | null,
  after: unknown | null,
  description: string,
): void {
  recordAuditEntry({
    actionType: legacyActionMap[action],
    entityType: normalizeEntityType(entityType),
    entityId,
    oldValue: before,
    newValue: after,
    note: description,
  });
}
