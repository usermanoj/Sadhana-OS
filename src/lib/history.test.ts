import { describe, expect, it } from 'vitest';
import type { Category, DailyEntry, JournalEntry } from '../types';
import {
  buildArchivedItems,
  buildJournalHistory,
  buildPracticeHistory,
} from './history';

const categories: Category[] = [
  {
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
        isArchived: true,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-02T00:00:00.000Z',
      },
    ],
  },
  {
    id: 'cat-service',
    name: 'Service',
    icon: 'heart',
    color: '#10B981',
    displayOrder: 1,
    isArchived: true,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-03T00:00:00.000Z',
    subComponents: [
      {
        id: 'habit-help',
        categoryId: 'cat-service',
        name: 'Help someone',
        trackingType: 'count',
        displayOrder: 0,
        isArchived: false,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ],
  },
];

describe('history helpers', () => {
  it('builds practice rows with date, category, habit, value, score, and notes', () => {
    const entries: Record<string, DailyEntry> = {
      '2026-05-14': {
        date: '2026-05-14',
        completions: {
          'habit-yama': true,
          'habit-reflect': 'Observed impatience and softened speech',
        },
        categoryScores: { 'cat-yoga': 75 },
        overallScore: 75,
        updatedAt: '2026-05-14T10:00:00.000Z',
      },
    };

    const rows = buildPracticeHistory(entries, categories);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      date: '2026-05-14',
      categoryName: 'Yoga',
      habitName: 'Yama',
      value: 'Completed',
      score: 75,
      notes: '',
    });
    expect(rows[1]).toMatchObject({
      habitName: 'Reflection',
      value: 'Observed impatience and softened speech',
      notes: 'Observed impatience and softened speech',
    });
  });

  it('filters practice rows by date and category', () => {
    const entries: Record<string, DailyEntry> = {
      '2026-05-13': {
        date: '2026-05-13',
        completions: { 'habit-help': 2 },
        categoryScores: { 'cat-service': 100 },
        overallScore: 100,
        updatedAt: '2026-05-13T10:00:00.000Z',
      },
      '2026-05-14': {
        date: '2026-05-14',
        completions: { 'habit-yama': true },
        categoryScores: { 'cat-yoga': 100 },
        overallScore: 100,
        updatedAt: '2026-05-14T10:00:00.000Z',
      },
    };

    const rows = buildPracticeHistory(entries, categories, {
      date: '2026-05-13',
      categoryId: 'cat-service',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.habitName).toBe('Help someone');
  });

  it('builds newest-first journal history and skips blank entries', () => {
    const journal: Record<string, JournalEntry> = {
      '2026-05-13': {
        date: '2026-05-13',
        content: '   ',
        createdAt: '2026-05-13T00:00:00.000Z',
        updatedAt: '2026-05-13T00:00:00.000Z',
      },
      '2026-05-14': {
        date: '2026-05-14',
        content: 'A useful reflection',
        createdAt: '2026-05-14T00:00:00.000Z',
        updatedAt: '2026-05-14T00:00:00.000Z',
      },
    };

    const rows = buildJournalHistory(journal);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.date).toBe('2026-05-14');
  });

  it('finds archived categories and habits without hard deleting them', () => {
    const archived = buildArchivedItems(categories);

    expect(archived.map((item) => item.name)).toEqual(['Service', 'Reflection']);
    expect(archived.map((item) => item.type)).toEqual(['category', 'habit']);
  });
});
