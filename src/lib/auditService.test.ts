import { beforeEach, describe, expect, it } from 'vitest';
import type { AuditActionType, AuditLogEntry } from '../types';
import { getItem } from './storage';
import { getAuditLogs, recordAuditEntry } from './auditService';

describe('auditService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates an audit record with the Task 006 field names', () => {
    const entry = recordAuditEntry({
      actionType: 'category_created',
      entityType: 'category',
      entityId: 'category-1',
      oldValue: null,
      newValue: { name: 'Practice' },
      note: 'Created category',
    });

    expect(entry.id).toEqual(expect.any(String));
    expect(entry.timestamp).toEqual(expect.any(String));
    expect(entry.actionType).toBe('category_created');
    expect(entry.entityType).toBe('category');
    expect(entry.entityId).toBe('category-1');
    expect(entry.oldValue).toBeNull();
    expect(entry.newValue).toEqual({ name: 'Practice' });
    expect(entry.note).toBe('Created category');

    const stored = getItem<AuditLogEntry[]>('audit', []);
    expect(stored).toEqual([entry]);
  });

  it('can record every required configuration action type', () => {
    const actionTypes: AuditActionType[] = [
      'category_created',
      'category_updated',
      'category_archived',
      'category_restored',
      'habit_created',
      'habit_updated',
      'habit_archived',
      'habit_restored',
      'tracking_type_changed',
      'smart_goal_changed',
      'target_value_changed',
      'frequency_changed',
      'weight_changed',
    ];

    for (const actionType of actionTypes) {
      recordAuditEntry({
        actionType,
        entityType: actionType.startsWith('category') ? 'category' : 'habit',
        entityId: `${actionType}-id`,
        oldValue: { before: actionType },
        newValue: { after: actionType },
      });
    }

    expect(getAuditLogs().map((entry) => entry.actionType)).toEqual(actionTypes);
  });

  it('returns audit logs newest first without mutating storage order', () => {
    const first = recordAuditEntry({
      actionType: 'category_created',
      entityType: 'category',
      entityId: 'category-1',
      oldValue: null,
      newValue: { name: 'First' },
    });
    const second = recordAuditEntry({
      actionType: 'habit_created',
      entityType: 'habit',
      entityId: 'habit-1',
      oldValue: null,
      newValue: { name: 'Second' },
    });

    expect(getAuditLogs({ newestFirst: true }).map((entry) => entry.id)).toEqual([
      second.id,
      first.id,
    ]);
    expect(getItem<AuditLogEntry[]>('audit', []).map((entry) => entry.id)).toEqual([
      first.id,
      second.id,
    ]);
  });
});
