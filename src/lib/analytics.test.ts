import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, DailyEntry } from '../types';
import {
  buildDashboardAnalytics,
  computeAverageScore,
  getCategoryAverages,
  getPastDates,
} from './analytics';

const categories: Category[] = [
  {
    id: 'cat-yoga',
    name: 'Yoga',
    icon: 'sparkles',
    color: '#7C3AED',
    displayOrder: 0,
    isArchived: false,
    createdAt: '',
    updatedAt: '',
    subComponents: [
      {
        id: 'habit-yama',
        categoryId: 'cat-yoga',
        name: 'Yama',
        trackingType: 'boolean',
        displayOrder: 0,
        isArchived: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'habit-meditation',
        categoryId: 'cat-yoga',
        name: 'Meditation',
        trackingType: 'duration',
        displayOrder: 1,
        isArchived: false,
        createdAt: '',
        updatedAt: '',
      },
    ],
  },
  {
    id: 'cat-service',
    name: 'Service',
    icon: 'hand-heart',
    color: '#10B981',
    displayOrder: 1,
    isArchived: false,
    createdAt: '',
    updatedAt: '',
    subComponents: [
      {
        id: 'habit-charity',
        categoryId: 'cat-service',
        name: 'Charity',
        trackingType: 'boolean',
        displayOrder: 0,
        isArchived: false,
        createdAt: '',
        updatedAt: '',
      },
    ],
  },
];

const entries: Record<string, DailyEntry> = {
  '2026-05-13': {
    date: '2026-05-13',
    completions: {
      'habit-yama': true,
      'habit-meditation': 30,
      'habit-charity': false,
    },
    categoryScores: {
      'cat-yoga': 100,
      'cat-service': 0,
    },
    overallScore: 50,
    updatedAt: '',
  },
  '2026-05-14': {
    date: '2026-05-14',
    completions: {
      'habit-yama': true,
      'habit-meditation': 0,
      'habit-charity': false,
    },
    categoryScores: {
      'cat-yoga': 50,
      'cat-service': 0,
    },
    overallScore: 25,
    updatedAt: '',
  },
};

describe('analytics utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 14, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds local calendar date ranges including today', () => {
    expect(getPastDates(3)).toEqual([
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
    ]);
  });

  it('returns an empty date range for non-positive ranges', () => {
    expect(getPastDates(0)).toEqual([]);
    expect(getPastDates(-7)).toEqual([]);
  });

  it('averages only present scores', () => {
    expect(computeAverageScore([null, 50, 100])).toBe(75);
  });

  it('returns null average when no score exists', () => {
    expect(computeAverageScore([null, null])).toBeNull();
  });

  it('calculates category averages from persisted daily scores', () => {
    expect(getCategoryAverages(entries, categories, 2)).toEqual([
      expect.objectContaining({ categoryId: 'cat-yoga', averageScore: 75, entryCount: 2 }),
      expect.objectContaining({ categoryId: 'cat-service', averageScore: 0, entryCount: 2 }),
    ]);
  });

  it('builds dashboard analytics for scores, categories, and habits', () => {
    const analytics = buildDashboardAnalytics(entries, categories, 2, 2);

    expect(analytics.todayScore).toBe(25);
    expect(analytics.weeklyAverage).toBe(38);
    expect(analytics.monthlyAverage).toBe(38);
    expect(analytics.bestCategory?.name).toBe('Yoga');
    expect(analytics.weakestCategory?.name).toBe('Service');
    expect(analytics.mostCompletedHabit?.habitName).toBe('Yama');
    expect(analytics.mostCompletedHabit?.completedCount).toBe(2);
    expect(analytics.mostMissedHabit?.habitName).toBe('Charity');
    expect(analytics.mostMissedHabit?.missedCount).toBe(2);
  });
});
