import type { Category, DailyEntry } from '../types';
import {
  confirmDailySadhanaPlan,
  generateAdaptiveDailyPlan,
  getPlanReasonText,
  replaceDailyPlanItem,
  shortenDailyPlanItem,
} from './adaptiveDailyPlan';

const timestamp = '2026-07-23T07:00:00.000Z';

const categories: Category[] = [
  createCategory('inner', 0, [
    createHabit('meditate', 'inner', 0, 'duration'),
    createHabit('gratitude', 'inner', 1, 'text'),
  ]),
  createCategory('body', 1, [
    createHabit('water', 'body', 0, 'boolean'),
    createHabit('walk', 'body', 1, 'count'),
  ]),
];

const baseInput = {
  date: '2026-07-23',
  mode: 'balanced' as const,
  availableMinutes: 15,
  energyLevel: 3 as const,
  focusCategoryIds: [],
  categories,
  dailyEntries: {} as Record<string, DailyEntry>,
  currentCompletions: {},
  timestamp,
};

describe('generateAdaptiveDailyPlan', () => {
  it('is deterministic and stays within the selected time and depth', () => {
    const first = generateAdaptiveDailyPlan(baseInput);
    const second = generateAdaptiveDailyPlan(baseInput);

    expect(second).toEqual(first);
    expect(first.items).toHaveLength(2);
    expect(first.items.reduce((total, item) => total + item.plannedMinutes, 0)).toBeLessThanOrEqual(15);
    expect(first.items.map((item) => item.habitId)).toEqual(['meditate', 'gratitude']);
  });

  it('prioritizes explicitly selected focus areas', () => {
    const plan = generateAdaptiveDailyPlan({
      ...baseInput,
      focusCategoryIds: ['body'],
    });

    expect(plan.items[0]?.categoryId).toBe('body');
    expect(plan.items[0]?.reasons).toContain('focus_area');
    expect(getPlanReasonText(plan.items[0]!, 'Body')).toContain('chosen focus areas');
  });

  it('favors short practices when the user reports low energy', () => {
    const plan = generateAdaptiveDailyPlan({
      ...baseInput,
      mode: 'minimum',
      energyLevel: 1,
    });

    expect(plan.items[0]?.habitId).toBe('water');
    expect(plan.items[0]?.reasons).toContain('gentle_energy');
  });

  it('uses explicit recent records for a gentle growth edge', () => {
    const plan = generateAdaptiveDailyPlan({
      ...baseInput,
      mode: 'minimum',
      dailyEntries: {
        '2026-07-21': createEntry('2026-07-21', { walk: false }),
        '2026-07-22': createEntry('2026-07-22', { walk: false }),
      },
    });

    expect(plan.items[0]?.habitId).toBe('walk');
    expect(plan.items[0]?.reasons).toContain('growth_edge');
  });

  it('does not treat missing days as failed practice history', () => {
    const withNoHistory = generateAdaptiveDailyPlan(baseInput);
    const withUnrelatedHistory = generateAdaptiveDailyPlan({
      ...baseInput,
      dailyEntries: {
        '2026-07-22': createEntry('2026-07-22', { unrelated: false }),
      },
    });

    expect(withUnrelatedHistory.items).toEqual(withNoHistory.items);
    expect(withNoHistory.items.flatMap((item) => item.reasons)).not.toContain('growth_edge');
  });

  it('excludes completed, archived, and replaced practices', () => {
    const archivedCategories: Category[] = categories.map((category) => ({
      ...category,
      subComponents: category.subComponents.map((habit) => (
        habit.id === 'gratitude' ? { ...habit, isArchived: true } : habit
      )),
    }));
    const plan = generateAdaptiveDailyPlan({
      ...baseInput,
      categories: archivedCategories,
      currentCompletions: { meditate: 10 },
      excludedHabitIds: ['water'],
    });

    expect(plan.items.map((item) => item.habitId)).toEqual(['walk']);
  });
});

describe('daily plan adjustments', () => {
  it('shortens a recommendation without changing completion data', () => {
    const plan = generateAdaptiveDailyPlan(baseInput);
    const shortened = shortenDailyPlanItem(plan, 'meditate', '2026-07-23T08:00:00.000Z');

    expect(shortened.items[0]?.plannedMinutes).toBe(5);
    expect(shortened.status).toBe('suggested');
    expect(shortened.updatedAt).toBe('2026-07-23T08:00:00.000Z');
  });

  it('replaces only the selected item and remembers the exclusion', () => {
    const plan = generateAdaptiveDailyPlan(baseInput);
    const replaced = replaceDailyPlanItem(
      plan,
      'meditate',
      baseInput,
      '2026-07-23T08:00:00.000Z',
    );

    expect(replaced.items[0]?.habitId).toBe('water');
    expect(replaced.items[1]?.habitId).toBe('gratitude');
    expect(replaced.excludedHabitIds).toContain('meditate');
  });

  it('marks a plan confirmed only through an explicit action', () => {
    const plan = generateAdaptiveDailyPlan(baseInput);
    const confirmed = confirmDailySadhanaPlan(plan, '2026-07-23T09:00:00.000Z');

    expect(plan.status).toBe('suggested');
    expect(confirmed.status).toBe('confirmed');
  });
});

function createCategory(
  id: string,
  displayOrder: number,
  subComponents: Category['subComponents'],
): Category {
  return {
    id,
    name: id === 'inner' ? 'Inner practice' : 'Body',
    icon: 'sparkles',
    color: '#7C3AED',
    displayOrder,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    subComponents,
  };
}

function createHabit(
  id: string,
  categoryId: string,
  displayOrder: number,
  trackingType: Category['subComponents'][number]['trackingType'],
): Category['subComponents'][number] {
  return {
    id,
    categoryId,
    name: id,
    trackingType,
    displayOrder,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createEntry(date: string, completions: DailyEntry['completions']): DailyEntry {
  return {
    date,
    completions,
    categoryScores: {},
    overallScore: 0,
    updatedAt: timestamp,
  };
}
