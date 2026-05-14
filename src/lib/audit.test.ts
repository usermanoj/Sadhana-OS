import { describe, expect, it, beforeEach } from 'vitest';
import { addAuditEntry } from './audit';
import { getItem } from './storage';
import type { AuditLogEntry } from '../types';

describe('Audit Logger', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates entry with correct fields', () => {
    addAuditEntry('data_imported', 'system', 'system', null, null, 'Test description');

    const auditLog = getItem<AuditLogEntry[]>('audit', []);
    expect(auditLog).toHaveLength(1);
    
    const entry = auditLog[0]!;
    expect(entry.id).toBeDefined();
    expect(typeof entry.id).toBe('string');
    expect(entry.timestamp).toBeDefined();
    expect(typeof entry.timestamp).toBe('string');
    expect(entry.actionType).toBe('data_imported');
    expect(entry.entityType).toBe('system');
    expect(entry.entityId).toBe('system');
    expect(entry.oldValue).toBeNull();
    expect(entry.newValue).toBeNull();
    expect(entry.note).toBe('Test description');
  });

  it('appends to existing log', () => {
    addAuditEntry('category_created', 'category', 'cat-1', null, { name: 'Test' }, 'Created cat 1');
    addAuditEntry('category_updated', 'category', 'cat-1', { name: 'Test' }, { name: 'Updated' }, 'Updated cat 1');

    const auditLog = getItem<AuditLogEntry[]>('audit', []);
    expect(auditLog).toHaveLength(2);
    expect(auditLog[0]!.actionType).toBe('category_created');
    expect(auditLog[1]!.actionType).toBe('category_updated');
  });

  it('IDs are unique', () => {
    addAuditEntry('data_imported', 'system', 'sys-1', null, null, 'Test 1');
    addAuditEntry('data_imported', 'system', 'sys-2', null, null, 'Test 2');

    const auditLog = getItem<AuditLogEntry[]>('audit', []);
    expect(auditLog[0]!.id).not.toBe(auditLog[1]!.id);
  });
});
