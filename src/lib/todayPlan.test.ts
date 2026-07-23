import { describe, expect, it } from 'vitest';
import { createSeedCategories } from './seed';
import { buildTodayPlan } from './todayPlan';

describe('buildTodayPlan', () => {
  it('selects incomplete practices in category and practice display order', () => {
    const categories = createSeedCategories();
    const yoga = categories[0]!;
    const speech = categories[1]!;
    const completions = {
      [yoga.subComponents[0]!.id]: true,
      [yoga.subComponents[1]!.id]: true,
    };

    const plan = buildTodayPlan(categories, completions, 'balanced');

    expect(plan.totalRemaining).toBe(40);
    expect(plan.items).toHaveLength(3);
    expect(plan.focus?.habit.name).toBe('Asana');
    expect(plan.items.map((item) => item.habit.name)).toEqual([
      'Asana',
      'Pranayama',
      'Pratyahara',
    ]);
    expect(plan.items[0]?.category.id).toBe(yoga.id);
    expect(plan.items.every((item) => item.category.id !== speech.id)).toBe(true);
  });

  it.each([
    ['minimum', 1],
    ['balanced', 3],
    ['full', 42],
  ] as const)('uses the expected %s plan depth', (mode, expectedCount) => {
    const plan = buildTodayPlan(createSeedCategories(), {}, mode);

    expect(plan.items).toHaveLength(expectedCount);
  });

  it('excludes archived categories, archived practices, and completed values', () => {
    const categories = createSeedCategories();
    categories[0] = { ...categories[0]!, isArchived: true };
    categories[1] = {
      ...categories[1]!,
      subComponents: categories[1]!.subComponents.map((habit, index) =>
        index === 0 ? { ...habit, isArchived: true } : habit,
      ),
    };
    const firstAvailable = categories[1]!.subComponents[1]!;
    const secondAvailable = categories[1]!.subComponents[2]!;

    const plan = buildTodayPlan(
      categories,
      { [firstAvailable.id]: true },
      'minimum',
    );

    expect(plan.focus?.habit.id).toBe(secondAvailable.id);
    expect(plan.totalRemaining).toBe(32);
  });

  it('returns an empty completed plan when no active practice remains', () => {
    const categories = createSeedCategories();
    const completions = Object.fromEntries(
      categories.flatMap((category) =>
        category.subComponents.map((habit) => [
          habit.id,
          habit.trackingType === 'text'
            ? 'Recorded'
            : habit.trackingType === 'boolean'
              ? true
              : 1,
        ]),
      ),
    );

    const plan = buildTodayPlan(categories, completions, 'balanced');

    expect(plan.focus).toBeNull();
    expect(plan.items).toEqual([]);
    expect(plan.totalRemaining).toBe(0);
  });
});
