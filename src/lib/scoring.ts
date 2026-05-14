import type { Category, DailyEntry, TrackingType, TrackingValue } from '../types';

/**
 * Determines whether a tracking value counts as "completed" for scoring.
 *
 * - boolean  → must be `true`
 * - scale5 / scale10 / duration / count / numeric → must be a number > 0
 * - text     → must be a non-empty string
 *
 * Falls back to boolean check if trackingType is missing (old seed data).
 */
export const isCompleted = (
  value: TrackingValue | undefined,
  trackingType: TrackingType = 'boolean',
): boolean => {
  if (value === undefined || value === null) return false;

  switch (trackingType) {
    case 'boolean':
      return value === true;
    case 'scale5':
    case 'scale10':
    case 'duration':
    case 'count':
    case 'numeric':
      return typeof value === 'number' && value > 0;
    case 'text':
      return typeof value === 'string' && value.trim().length > 0;
    default:
      return value === true;
  }
};

export const computeCategoryScore = (
  categoryId: string,
  completions: Record<string, TrackingValue>,
  categories: Category[],
): number => {
  const category = categories.find((c) => c.id === categoryId);
  if (!category || category.isArchived) {
    return 0;
  }

  const activeSubComponents = category.subComponents.filter((sub) => !sub.isArchived);
  const totalActive = activeSubComponents.length;

  if (totalActive === 0) {
    return 0;
  }

  const completed = activeSubComponents.filter(
    (sub) => isCompleted(completions[sub.id], sub.trackingType),
  ).length;

  return (completed / totalActive) * 100;
};

export const computeOverallScore = (
  categoryScores: Record<string, number>,
  categories: Category[],
): number => {
  const activeCategories = categories.filter((c) => !c.isArchived);
  const numberOfActiveCategories = activeCategories.length;

  if (numberOfActiveCategories === 0) {
    return 0;
  }

  const sum = activeCategories.reduce((acc, cat) => {
    return acc + (categoryScores[cat.id] || 0);
  }, 0);

  return sum / numberOfActiveCategories;
};

export const computeAllScores = (
  completions: Record<string, TrackingValue>,
  categories: Category[],
): { categoryScores: Record<string, number>; overallScore: number } => {
  const categoryScores: Record<string, number> = {};

  for (const category of categories) {
    if (!category.isArchived) {
      categoryScores[category.id] = computeCategoryScore(
        category.id,
        completions,
        categories,
      );
    }
  }

  const overallScore = computeOverallScore(categoryScores, categories);

  return { categoryScores, overallScore };
};

export const computeStreak = (entries: Record<string, DailyEntry>): number => {
  const MS_PER_DAY = 86_400_000;
  const now = new Date();
  
  // Format local date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(now);
  const yesterdayDate = new Date(now.getTime() - MS_PER_DAY);
  const yesterdayStr = formatDate(yesterdayDate);

  // A day counts if at least 1 sub-component has a truthy completion
  // For backwards compatibility, we check both boolean `true` and any truthy value
  const dayCounts = (dateStr: string): boolean => {
    const entry = entries[dateStr];
    if (!entry) return false;
    
    return Object.values(entry.completions).some((val) => {
      if (typeof val === 'boolean') return val === true;
      if (typeof val === 'number') return val > 0;
      if (typeof val === 'string') return val.trim().length > 0;
      return false;
    });
  };

  let streak = 0;
  
  // Determine starting point (today or yesterday)
  let currentDate = now;
  if (!dayCounts(todayStr)) {
    if (!dayCounts(yesterdayStr)) {
      return 0; // neither today nor yesterday counts, streak broken
    }
    currentDate = yesterdayDate;
  }

  // Count backwards
  while (true) {
    const dateStr = formatDate(currentDate);
    if (dayCounts(dateStr)) {
      streak++;
      currentDate = new Date(currentDate.getTime() - MS_PER_DAY);
    } else {
      break;
    }
  }

  return streak;
};
