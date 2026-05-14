import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, DailyEntry } from '../types';
import {
  buildBalanceWheelData,
  buildCategoryBarData,
  buildChartData,
  hasCategoryScores,
  hasChartScores,
} from './chartData';

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
    subComponents: [],
  },
];

const createEntry = (
  date: string,
  overallScore: number,
  categoryScore?: number,
): DailyEntry => ({
  date,
  completions: {},
  categoryScores: categoryScore === undefined ? {} : { 'cat-yoga': categoryScore },
  overallScore,
  updatedAt: '',
});

describe('chart data helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 14, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fills missing dates with null scores', () => {
    const data = buildChartData(
      {
        '2026-05-13': createEntry('2026-05-13', 60),
      },
      categories,
      3,
      'overall',
    );

    expect(data.map((point) => point.dateKey)).toEqual([
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
    ]);
    expect(data.map((point) => point.score)).toEqual([null, 60, null]);
  });

  it('uses category scores for category filters', () => {
    const data = buildChartData(
      {
        '2026-05-14': createEntry('2026-05-14', 80, 25),
      },
      categories,
      1,
      'cat-yoga',
    );

    expect(data[0]?.score).toBe(25);
  });

  it('uses null for category scores that are absent rather than treating them as zero', () => {
    const data = buildChartData(
      {
        '2026-05-14': createEntry('2026-05-14', 80),
      },
      categories,
      1,
      'cat-yoga',
    );

    expect(data[0]?.score).toBeNull();
  });

  it('detects whether chart data contains at least one score', () => {
    expect(hasChartScores([{ date: 'May 14', dateKey: '2026-05-14', score: null }])).toBe(false);
    expect(hasChartScores([{ date: 'May 14', dateKey: '2026-05-14', score: 0 }])).toBe(true);
  });

  it('builds category bar data from scored category averages', () => {
    const data = buildCategoryBarData([
      { categoryId: 'cat-yoga', name: 'Yoga', color: '#7C3AED', averageScore: 75, entryCount: 2 },
      { categoryId: 'cat-empty', name: 'Empty', color: '#000000', averageScore: null, entryCount: 0 },
    ]);

    expect(data).toEqual([
      expect.objectContaining({ categoryId: 'cat-yoga', name: 'Yoga', score: 75 }),
    ]);
  });

  it('builds balance wheel data for all active categories', () => {
    const data = buildBalanceWheelData(categories, [
      { categoryId: 'cat-yoga', name: 'Yoga', color: '#7C3AED', averageScore: 75, entryCount: 2 },
    ]);

    expect(data).toEqual([
      expect.objectContaining({ categoryId: 'cat-yoga', category: 'Yoga', score: 75 }),
    ]);
  });

  it('detects whether category averages contain scores', () => {
    expect(hasCategoryScores([
      { categoryId: 'cat-yoga', name: 'Yoga', color: '#7C3AED', averageScore: null, entryCount: 0 },
    ])).toBe(false);
    expect(hasCategoryScores([
      { categoryId: 'cat-yoga', name: 'Yoga', color: '#7C3AED', averageScore: 0, entryCount: 1 },
    ])).toBe(true);
  });
});
