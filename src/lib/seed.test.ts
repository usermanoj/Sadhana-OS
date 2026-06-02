import { describe, expect, it, beforeEach } from 'vitest';
import type { Category, AuditLogEntry } from '../types';
import {
  APP_SCHEMA_VERSION,
  STARTER_TEMPLATE_VERSION,
  createStarterTemplateSnapshot,
  seedIfNeeded,
  shouldApplyStarterTemplate,
} from './seed';
import { getItem } from './storage';

describe('seed data', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('seeds 9 categories with correct sub-components on first launch', () => {
    seedIfNeeded();

    const version = getItem<string | null>('version', null);
    expect(version).toBe(APP_SCHEMA_VERSION);

    const categories = getItem<Category[]>('categories', []);
    expect(categories).toHaveLength(9);
    expect(categories[0]!.name).toBe('8 Limbs of Yoga');
    expect(categories[0]!.subComponents).toHaveLength(8);
    expect(categories[0]!.subComponents[0]!.name).toBe('Yama');
  });

  it('creates an audit log entry on seed', () => {
    seedIfNeeded();

    const audit = getItem<AuditLogEntry[]>('audit', []);
    expect(audit).toHaveLength(1);
    expect(audit[0]!.actionType).toBe('data_imported');
    expect(audit[0]!.note).toBe('Initial seed data');
  });

  it('does not re-seed on subsequent launches', () => {
    seedIfNeeded();

    const categories1 = getItem<Category[]>('categories', []);

    // Change version slightly to simulate existing data
    localStorage.setItem('sadhana:version', '1.1');
    
    // Attempt to seed again
    seedIfNeeded();

    const audit2 = getItem<AuditLogEntry[]>('audit', []);
    expect(audit2).toHaveLength(1); // Still 1 entry
    
    // Verify categories didn't change
    const categories2 = getItem<Category[]>('categories', []);
    expect(categories2).toEqual(categories1);
  });

  it('creates a cloud starter template snapshot with user-unique ids and an audit entry', () => {
    const snapshot = createStarterTemplateSnapshot({
      timestamp: '2026-06-02T00:00:00.000Z',
      auditIdFactory: () => '00000000-0000-4000-8000-999999999999',
    });

    expect(snapshot.version).toBe('0.2');
    expect(snapshot.categories).toHaveLength(9);
    expect(snapshot.categories[0]!.name).toBe('8 Limbs of Yoga');
    expect(snapshot.categories[0]!.id).not.toBe('00000000-0000-4000-8000-000000000001');
    expect(snapshot.categories[0]!.subComponents[0]!.categoryId).toBe(snapshot.categories[0]!.id);
    expect(snapshot.auditLogs).toEqual([
      expect.objectContaining({
        id: '00000000-0000-4000-8000-999999999999',
        actionType: 'data_imported',
        entityType: 'system',
        note: `Applied starter template ${STARTER_TEMPLATE_VERSION}`,
      }),
    ]);
  });

  it('applies the starter template only to completely empty snapshots', () => {
    expect(shouldApplyStarterTemplate({
      version: '0.2',
      categories: [],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [],
    })).toBe(true);

    expect(shouldApplyStarterTemplate({
      version: '0.2',
      categories: [],
      dailyEntries: {},
      journalEntries: {},
      auditLogs: [{
        id: 'audit-1',
        timestamp: '2026-06-02T00:00:00.000Z',
        actionType: 'data_imported',
        entityType: 'system',
        entityId: 'system',
        oldValue: null,
        newValue: null,
      }],
    })).toBe(false);
  });
});
