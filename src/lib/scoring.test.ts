import { describe, expect, it } from 'vitest';
import type { Category, DailyEntry } from '../types';
import {
  computeCategoryScore,
  computeOverallScore,
  computeAllScores,
  computeStreak,
} from './scoring';

describe('scoring engine', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Category 1',
      icon: 'icon',
      color: '#fff',
      displayOrder: 0,
      isArchived: false,
      createdAt: '',
      updatedAt: '',
      subComponents: [
        { id: 'sub-1', categoryId: 'cat-1', name: 'Sub 1', displayOrder: 0, isArchived: false, createdAt: '', updatedAt: '' },
        { id: 'sub-2', categoryId: 'cat-1', name: 'Sub 2', displayOrder: 1, isArchived: false, createdAt: '', updatedAt: '' },
        { id: 'sub-3', categoryId: 'cat-1', name: 'Sub 3', displayOrder: 2, isArchived: true, createdAt: '', updatedAt: '' }, // Archived sub should be ignored
      ],
    },
    {
      id: 'cat-2',
      name: 'Category 2',
      icon: 'icon',
      color: '#fff',
      displayOrder: 1,
      isArchived: false,
      createdAt: '',
      updatedAt: '',
      subComponents: [
        { id: 'sub-4', categoryId: 'cat-2', name: 'Sub 4', displayOrder: 0, isArchived: false, createdAt: '', updatedAt: '' },
      ],
    },
    {
      id: 'cat-archived',
      name: 'Archived Category',
      icon: 'icon',
      color: '#fff',
      displayOrder: 2,
      isArchived: true,
      createdAt: '',
      updatedAt: '',
      subComponents: [
        { id: 'sub-5', categoryId: 'cat-archived', name: 'Sub 5', displayOrder: 0, isArchived: false, createdAt: '', updatedAt: '' },
      ],
    },
    {
      id: 'cat-empty',
      name: 'Empty Category',
      icon: 'icon',
      color: '#fff',
      displayOrder: 3,
      isArchived: false,
      createdAt: '',
      updatedAt: '',
      subComponents: [
        { id: 'sub-6', categoryId: 'cat-empty', name: 'Sub 6', displayOrder: 0, isArchived: true, createdAt: '', updatedAt: '' },
      ],
    }
  ];

  describe('computeCategoryScore', () => {
    it('returns 100% when all active sub-components are done', () => {
      const completions = { 'sub-1': true, 'sub-2': true }; // sub-3 is archived
      expect(computeCategoryScore('cat-1', completions, mockCategories)).toBe(100);
    });

    it('returns 0% when no sub-components are done', () => {
      const completions = { 'sub-1': false, 'sub-2': false };
      expect(computeCategoryScore('cat-1', completions, mockCategories)).toBe(0);
    });

    it('returns partial percentage correctly', () => {
      const completions = { 'sub-1': true, 'sub-2': false };
      expect(computeCategoryScore('cat-1', completions, mockCategories)).toBe(50);
    });

    it('returns 0% for category with 0 active sub-components', () => {
      expect(computeCategoryScore('cat-empty', {}, mockCategories)).toBe(0);
    });

    it('returns 0% for archived categories', () => {
      const completions = { 'sub-5': true };
      expect(computeCategoryScore('cat-archived', completions, mockCategories)).toBe(0);
    });
    
    it('treats missing values as false', () => {
      const completions = { 'sub-1': true }; // sub-2 is missing
      expect(computeCategoryScore('cat-1', completions, mockCategories)).toBe(50);
    });
  });

  describe('computeOverallScore', () => {
    it('averages active categories correctly', () => {
      const categoryScores = {
        'cat-1': 50,
        'cat-2': 100,
        'cat-empty': 0, // It is active but has 0% score
        'cat-archived': 100, // Should be ignored
      };
      // 3 active categories: (50 + 100 + 0) / 3 = 50
      expect(computeOverallScore(categoryScores, mockCategories)).toBe(50);
    });

    it('returns 0 if no active categories', () => {
      const allArchived = mockCategories.map(c => ({ ...c, isArchived: true }));
      expect(computeOverallScore({}, allArchived)).toBe(0);
    });
  });

  describe('computeAllScores', () => {
    it('computes category and overall scores simultaneously', () => {
      const completions = {
        'sub-1': true, // cat-1 -> 50%
        'sub-4': true, // cat-2 -> 100%
      };
      
      const { categoryScores, overallScore } = computeAllScores(completions, mockCategories);
      
      expect(categoryScores['cat-1']).toBe(50);
      expect(categoryScores['cat-2']).toBe(100);
      expect(categoryScores['cat-empty']).toBe(0);
      expect(categoryScores['cat-archived']).toBeUndefined();
      
      expect(overallScore).toBe(50); // (50 + 100 + 0) / 3
    });
  });

  describe('computeStreak', () => {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const MS_PER_DAY = 86_400_000;
    const now = new Date();
    const today = formatDate(now);
    const yesterday = formatDate(new Date(now.getTime() - MS_PER_DAY));
    const dayBefore = formatDate(new Date(now.getTime() - 2 * MS_PER_DAY));
    const day3Before = formatDate(new Date(now.getTime() - 3 * MS_PER_DAY));
    const day4Before = formatDate(new Date(now.getTime() - 4 * MS_PER_DAY));

    const createEntry = (date: string, hasCompletion: boolean): DailyEntry => ({
      date,
      completions: hasCompletion ? { 'sub-1': true } : {},
      categoryScores: {},
      overallScore: hasCompletion ? 100 : 0,
      updatedAt: '',
    });

    it('counts 5 consecutive days ending today', () => {
      const entries: Record<string, DailyEntry> = {
        [today]: createEntry(today, true),
        [yesterday]: createEntry(yesterday, true),
        [dayBefore]: createEntry(dayBefore, true),
        [day3Before]: createEntry(day3Before, true),
        [day4Before]: createEntry(day4Before, true),
      };
      expect(computeStreak(entries)).toBe(5);
    });

    it('counts from yesterday if today has no entry', () => {
      const entries: Record<string, DailyEntry> = {
        [yesterday]: createEntry(yesterday, true),
        [dayBefore]: createEntry(dayBefore, true),
      };
      expect(computeStreak(entries)).toBe(2);
    });

    it('returns 0 if neither today nor yesterday counts', () => {
      const entries: Record<string, DailyEntry> = {
        [dayBefore]: createEntry(dayBefore, true),
        [day3Before]: createEntry(day3Before, true),
      };
      expect(computeStreak(entries)).toBe(0);
    });

    it('resets streak if there is a gap', () => {
      const entries: Record<string, DailyEntry> = {
        [today]: createEntry(today, true),
        [yesterday]: createEntry(yesterday, true),
        // Gap on dayBefore
        [day3Before]: createEntry(day3Before, true),
      };
      expect(computeStreak(entries)).toBe(2);
    });

    it('returns 0 if no entries at all', () => {
      expect(computeStreak({})).toBe(0);
    });

    it('does not count a day if all completions are false', () => {
      const entries: Record<string, DailyEntry> = {
        [today]: createEntry(today, true),
        [yesterday]: createEntry(yesterday, false), // Has an entry, but no completions
        [dayBefore]: createEntry(dayBefore, true),
      };
      // Streak breaks at yesterday
      expect(computeStreak(entries)).toBe(1);
    });
  });
});
