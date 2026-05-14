import { beforeEach, describe, expect, it } from 'vitest';
import type { AuditLogEntry, Category, DailyEntry, ExportPayload, JournalEntry } from '../types';
import { getItem, setItem } from './storage';
import { applyImport, detectConflicts, parseImport } from './import';

const existingCategory: Category = {
  id: 'cat-existing',
  name: 'Existing',
  icon: 'sparkles',
  color: '#7C3AED',
  displayOrder: 0,
  isArchived: false,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  subComponents: [{
    id: 'habit-existing',
    categoryId: 'cat-existing',
    name: 'Existing habit',
    trackingType: 'boolean',
    displayOrder: 0,
    isArchived: false,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  }],
};

const incomingCategory: Category = {
  id: 'cat-incoming',
  name: 'Incoming',
  icon: 'heart',
  color: '#10B981',
  displayOrder: 1,
  isArchived: false,
  createdAt: '2026-05-02T00:00:00.000Z',
  updatedAt: '2026-05-02T00:00:00.000Z',
  subComponents: [{
    id: 'habit-incoming',
    categoryId: 'cat-incoming',
    name: 'Incoming habit',
    trackingType: 'count',
    displayOrder: 0,
    isArchived: false,
    createdAt: '2026-05-02T00:00:00.000Z',
    updatedAt: '2026-05-02T00:00:00.000Z',
  }],
};

const existingEntry: DailyEntry = {
  date: '2026-05-13',
  completions: { 'habit-existing': true },
  categoryScores: { 'cat-existing': 100 },
  overallScore: 100,
  updatedAt: '2026-05-13T00:00:00.000Z',
};

const incomingEntry: DailyEntry = {
  date: '2026-05-14',
  completions: { 'habit-incoming': 3 },
  categoryScores: { 'cat-incoming': 100 },
  overallScore: 100,
  updatedAt: '2026-05-14T00:00:00.000Z',
};

const incomingJournal: JournalEntry = {
  date: '2026-05-14',
  content: 'Imported reflection',
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
};

const importedAudit: AuditLogEntry = {
  id: 'audit-incoming',
  timestamp: '2026-05-14T00:00:00.000Z',
  actionType: 'category_created',
  entityType: 'category',
  entityId: 'cat-incoming',
  oldValue: null,
  newValue: incomingCategory,
  note: 'Incoming category created',
};

const makePayload = (): ExportPayload => ({
  version: '1.1',
  exportedAt: '2026-05-14T01:00:00.000Z',
  categories: [incomingCategory],
  habits: incomingCategory.subComponents,
  dailyEntries: { [incomingEntry.date]: incomingEntry },
  journalEntries: { [incomingJournal.date]: incomingJournal },
  auditLogs: [importedAudit],
  settings: { schemaVersion: '1.1' },
  entries: { [incomingEntry.date]: incomingEntry },
  journal: { [incomingJournal.date]: incomingJournal },
  audit: [importedAudit],
});

describe('import utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    setItem('version', '1.1');
    setItem('categories', [existingCategory]);
    setItem('entries', { [existingEntry.date]: existingEntry });
    setItem('journal', {});
    setItem('audit', []);
  });

  it('parses and validates a JSON backup payload', async () => {
    const payload = await parseImport(JSON.stringify(makePayload()));

    expect(payload.categories[0]?.name).toBe('Incoming');
    expect(payload.dailyEntries[incomingEntry.date]).toEqual(incomingEntry);
    expect(payload.auditLogs[0]?.id).toBe('audit-incoming');
  });

  it('rejects invalid JSON without modifying existing data', async () => {
    await expect(parseImport('{not valid json')).rejects.toThrow('Invalid JSON backup');

    expect(getItem<Category[]>('categories', [])).toEqual([existingCategory]);
    expect(getItem<Record<string, DailyEntry>>('entries', {})).toEqual({ [existingEntry.date]: existingEntry });
  });

  it('overwrites/restores state safely and appends an import audit entry', () => {
    applyImport(makePayload(), 'overwrite');

    expect(getItem<Category[]>('categories', [])).toEqual([incomingCategory]);
    expect(getItem<Record<string, DailyEntry>>('entries', {})).toEqual({ [incomingEntry.date]: incomingEntry });
    expect(getItem<Record<string, JournalEntry>>('journal', {})).toEqual({ [incomingJournal.date]: incomingJournal });

    const audit = getItem<AuditLogEntry[]>('audit', []);
    expect(audit.map((entry) => entry.id)).toContain('audit-incoming');
    expect(audit[audit.length - 1]?.actionType).toBe('data_imported');
  });

  it('merge import preserves existing records and adds incoming records', () => {
    applyImport(makePayload(), 'merge');

    expect(getItem<Category[]>('categories', []).map((category) => category.id)).toEqual([
      'cat-existing',
      'cat-incoming',
    ]);
    expect(getItem<Record<string, DailyEntry>>('entries', {})).toEqual({
      [existingEntry.date]: existingEntry,
      [incomingEntry.date]: incomingEntry,
    });
    const audit = getItem<AuditLogEntry[]>('audit', []);
    expect(audit[audit.length - 1]?.actionType).toBe('data_imported');
  });

  it('detects import conflicts without changing state', () => {
    const payload = {
      ...makePayload(),
      categories: [existingCategory],
      dailyEntries: { [existingEntry.date]: incomingEntry },
      journalEntries: { [existingEntry.date]: incomingJournal },
    };

    const conflicts = detectConflicts(payload);

    expect(conflicts).toMatchObject({
      categories: 1,
      dailyEntries: 1,
      journalEntries: 0,
    });
    expect(getItem<Category[]>('categories', [])).toEqual([existingCategory]);
  });
});
