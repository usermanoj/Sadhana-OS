import type { Category, Habit, TrackingValue } from '../types';
import { isCompleted } from './scoring';

export type DailyPlanMode = 'minimum' | 'balanced' | 'full';

export interface PlannedPractice {
  category: Category;
  habit: Habit;
}

export interface TodayPlan {
  focus: PlannedPractice | null;
  items: PlannedPractice[];
  totalActive: number;
  totalRemaining: number;
}

const PLAN_LIMITS: Record<DailyPlanMode, number> = {
  minimum: 1,
  balanced: 3,
  full: Number.POSITIVE_INFINITY,
};

export function buildTodayPlan(
  categories: Category[],
  completions: Record<string, TrackingValue>,
  mode: DailyPlanMode,
): TodayPlan {
  const activePractices = categories
    .filter((category) => !category.isArchived)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .flatMap((category) =>
      category.subComponents
        .filter((habit) => !habit.isArchived)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((habit) => ({ category, habit })),
    );

  const remaining = activePractices.filter(
    ({ habit }) => !isCompleted(completions[habit.id], habit.trackingType),
  );
  const items = remaining.slice(0, PLAN_LIMITS[mode]);

  return {
    focus: items[0] ?? null,
    items,
    totalActive: activePractices.length,
    totalRemaining: remaining.length,
  };
}
