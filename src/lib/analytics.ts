import type { Category, DailyEntry, DateKey, Habit } from '../types';
import { isCompleted } from './scoring';

export const formatDateKey = (date: Date): DateKey => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPastDates = (days: number, endDate = new Date()): DateKey[] => {
  const dates: DateKey[] = [];
  const safeDays = Math.max(0, Math.floor(days));

  for (let i = safeDays - 1; i >= 0; i--) {
    dates.push(formatDateKey(new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - i,
    )));
  }

  return dates;
};

export const computeAverageScore = (scores: Array<number | null>): number | null => {
  const validScores = scores.filter((score): score is number => score !== null);

  if (validScores.length === 0) {
    return null;
  }

  return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
};

export interface CategoryAverage {
  categoryId: string;
  name: string;
  color: string;
  averageScore: number | null;
  entryCount: number;
}

export interface HabitPerformance {
  habitId: string;
  categoryId: string;
  habitName: string;
  categoryName: string;
  completedCount: number;
  missedCount: number;
  trackedDays: number;
}

export interface DashboardAnalytics {
  todayScore: number | null;
  weeklyAverage: number | null;
  monthlyAverage: number | null;
  currentStreak: number;
  categoryAverages: CategoryAverage[];
  bestCategory: CategoryAverage | null;
  weakestCategory: CategoryAverage | null;
  mostCompletedHabit: HabitPerformance | null;
  mostMissedHabit: HabitPerformance | null;
}

const clampScore = (score: number): number => Math.min(100, Math.max(0, score));

const roundScore = (score: number): number => Math.round(score);

const getEntryScoresForRange = (
  entries: Record<DateKey, DailyEntry>,
  range: number,
): Array<number | null> => {
  return getPastDates(range).map((dateKey) => {
    const score = entries[dateKey]?.overallScore;
    return typeof score === 'number' ? clampScore(score) : null;
  });
};

export const getTodayScore = (
  entries: Record<DateKey, DailyEntry>,
  today = new Date(),
): number | null => {
  const score = entries[formatDateKey(today)]?.overallScore;
  return typeof score === 'number' ? clampScore(score) : null;
};

export const getAverageScoreForRange = (
  entries: Record<DateKey, DailyEntry>,
  range: number,
): number | null => {
  const average = computeAverageScore(getEntryScoresForRange(entries, range));
  return average === null ? null : roundScore(average);
};

export const getCategoryAverages = (
  entries: Record<DateKey, DailyEntry>,
  categories: Category[],
  range: number,
): CategoryAverage[] => {
  const activeCategories = categories.filter((category) => !category.isArchived);
  const dateKeys = getPastDates(range);

  return activeCategories.map((category) => {
    const scores = dateKeys.map((dateKey) => {
      const score = entries[dateKey]?.categoryScores[category.id];
      return typeof score === 'number' ? clampScore(score) : null;
    });
    const averageScore = computeAverageScore(scores);

    return {
      categoryId: category.id,
      name: category.name,
      color: category.color,
      averageScore: averageScore === null ? null : roundScore(averageScore),
      entryCount: scores.filter((score) => score !== null).length,
    };
  });
};

export const getBestCategory = (averages: CategoryAverage[]): CategoryAverage | null => {
  const scored = averages.filter((category) => category.averageScore !== null);
  if (scored.length === 0) return null;

  return scored.reduce((best, category) => {
    if ((category.averageScore ?? 0) > (best.averageScore ?? 0)) return category;
    return best;
  });
};

export const getWeakestCategory = (averages: CategoryAverage[]): CategoryAverage | null => {
  const scored = averages.filter((category) => category.averageScore !== null);
  if (scored.length === 0) return null;

  return scored.reduce((weakest, category) => {
    if ((category.averageScore ?? 100) < (weakest.averageScore ?? 100)) return category;
    return weakest;
  });
};

const createHabitPerformance = (
  habit: Habit,
  category: Category,
): HabitPerformance => ({
  habitId: habit.id,
  categoryId: category.id,
  habitName: habit.name,
  categoryName: category.name,
  completedCount: 0,
  missedCount: 0,
  trackedDays: 0,
});

export const getHabitPerformance = (
  entries: Record<DateKey, DailyEntry>,
  categories: Category[],
  range: number,
): HabitPerformance[] => {
  const activeHabits = categories
    .filter((category) => !category.isArchived)
    .flatMap((category) =>
      category.subComponents
        .filter((habit) => !habit.isArchived)
        .map((habit) => createHabitPerformance(habit, category)),
    );

  const byHabitId = new Map(activeHabits.map((habit) => [habit.habitId, habit]));
  const entriesInRange = getPastDates(range)
    .map((dateKey) => entries[dateKey])
    .filter((entry): entry is DailyEntry => Boolean(entry));

  for (const entry of entriesInRange) {
    for (const category of categories) {
      if (category.isArchived) continue;

      for (const habit of category.subComponents) {
        if (habit.isArchived) continue;

        const performance = byHabitId.get(habit.id);
        if (!performance) continue;

        performance.trackedDays += 1;
        if (isCompleted(entry.completions[habit.id], habit.trackingType)) {
          performance.completedCount += 1;
        } else {
          performance.missedCount += 1;
        }
      }
    }
  }

  return activeHabits;
};

export const getMostCompletedHabit = (
  habits: HabitPerformance[],
): HabitPerformance | null => {
  const tracked = habits.filter((habit) => habit.trackedDays > 0);
  if (tracked.length === 0) return null;

  return tracked.reduce((best, habit) => {
    if (habit.completedCount > best.completedCount) return habit;
    if (habit.completedCount === best.completedCount && habit.missedCount < best.missedCount) {
      return habit;
    }
    return best;
  });
};

export const getMostMissedHabit = (
  habits: HabitPerformance[],
): HabitPerformance | null => {
  const tracked = habits.filter((habit) => habit.trackedDays > 0);
  if (tracked.length === 0) return null;

  return tracked.reduce((mostMissed, habit) => {
    if (habit.missedCount > mostMissed.missedCount) return habit;
    if (habit.missedCount === mostMissed.missedCount && habit.completedCount < mostMissed.completedCount) {
      return habit;
    }
    return mostMissed;
  });
};

export const buildDashboardAnalytics = (
  entries: Record<DateKey, DailyEntry>,
  categories: Category[],
  currentStreak: number,
  range = 30,
): DashboardAnalytics => {
  const categoryAverages = getCategoryAverages(entries, categories, range);
  const habitPerformance = getHabitPerformance(entries, categories, range);

  return {
    todayScore: getTodayScore(entries),
    weeklyAverage: getAverageScoreForRange(entries, 7),
    monthlyAverage: getAverageScoreForRange(entries, 30),
    currentStreak,
    categoryAverages,
    bestCategory: getBestCategory(categoryAverages),
    weakestCategory: getWeakestCategory(categoryAverages),
    mostCompletedHabit: getMostCompletedHabit(habitPerformance),
    mostMissedHabit: getMostMissedHabit(habitPerformance),
  };
};
