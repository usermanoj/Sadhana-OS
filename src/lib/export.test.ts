import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AuditLogEntry,
  Category,
  DailyEntry,
  DailySadhanaPlan,
  JournalEntry,
} from '../types';
import { getItem, setItem } from './storage';
import { exportCSV, exportJSON } from './export';

const category: Category = {
  id: 'cat-yoga',
  name: 'Yoga',
  icon: 'lotus',
  color: '#7C3AED',
  displayOrder: 0,
  isArchived: false,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  subComponents: [
    {
      id: 'habit-yama',
      categoryId: 'cat-yoga',
      name: 'Yama',
      trackingType: 'boolean',
      displayOrder: 0,
      isArchived: false,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    },
    {
      id: 'habit-reflect',
      categoryId: 'cat-yoga',
      name: 'Reflection',
      trackingType: 'text',
      displayOrder: 1,
      isArchived: false,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    },
  ],
};

const dailyEntry: DailyEntry = {
  date: '2026-05-14',
  completions: {
    'habit-yama': true,
    'habit-reflect': 'Clear speech',
  },
  categoryScores: { 'cat-yoga': 100 },
  overallScore: 100,
  updatedAt: '2026-05-14T08:00:00.000Z',
};

const journalEntry: JournalEntry = {
  date: '2026-05-14',
  content: 'A steady day',
  createdAt: '2026-05-14T07:00:00.000Z',
  updatedAt: '2026-05-14T07:30:00.000Z',
};

const dailyPlan: DailySadhanaPlan = {
  date: '2026-05-14',
  mode: 'balanced',
  status: 'confirmed',
  availableMinutes: 15,
  energyLevel: 3,
  focusCategoryIds: ['cat-yoga'],
  items: [],
  excludedHabitIds: [],
  engineVersion: '1.0',
  createdAt: '2026-05-14T06:00:00.000Z',
  updatedAt: '2026-05-14T06:00:00.000Z',
};

describe('export utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    setItem('version', '1.1');
    setItem('categories', [category]);
    setItem('entries', { [dailyEntry.date]: dailyEntry });
    setItem('journal', { [journalEntry.date]: journalEntry });
    setItem('audit', []);
    setItem('daily-plans', { [dailyPlan.date]: dailyPlan });
  });

  it('exports complete app state as JSON backup and records export audit', () => {
    const payload = exportJSON();

    expect(payload.categories).toEqual([category]);
    expect(payload.habits).toEqual(category.subComponents);
    expect(payload.dailyEntries).toEqual({ [dailyEntry.date]: dailyEntry });
    expect(payload.journalEntries).toEqual({ [journalEntry.date]: journalEntry });
    expect(payload.settings).toEqual({ schemaVersion: '1.1' });
    expect(payload.dailyPlans).toEqual({ [dailyPlan.date]: dailyPlan });
    expect(payload.auditLogs[payload.auditLogs.length - 1]?.actionType).toBe('data_exported');

    const audit = getItem<AuditLogEntry[]>('audit', []);
    expect(audit[audit.length - 1]?.actionType).toBe('data_exported');
  });

  it('exports CSV with required headers and daily tracking rows', () => {
    const csv = exportCSV();

    expect(csv.split('\n')).toEqual([
      'date,categoryName,subComponentName,completed',
      '2026-05-14,Yoga,Yama,true',
      '2026-05-14,Yoga,Reflection,Clear speech',
    ]);
  });

  it('escapes CSV values safely', () => {
    setItem('categories', [{
      ...category,
      name: 'Yoga, Speech',
      subComponents: [{
        ...category.subComponents[0]!,
        name: 'Truth "practice"',
      }],
    }]);
    setItem('entries', {
      [dailyEntry.date]: {
        ...dailyEntry,
        completions: { 'habit-yama': true },
      },
    });

    const csv = exportCSV();

    expect(csv).toContain('"Yoga, Speech","Truth ""practice""",true');
  });
});
