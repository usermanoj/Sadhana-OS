import type { Category, DailyEntry } from '../types';

export const computeCategoryScore = (
  categoryId: string,
  completions: Record<string, boolean>,
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
    (sub) => completions[sub.id] === true,
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
  completions: Record<string, boolean>,
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

  // A day counts if overallScore > 0 OR if any completion is true
  const dayCounts = (dateStr: string): boolean => {
    const entry = entries[dateStr];
    if (!entry) return false;
    
    // According to docs, "A day counts only if at least 1 sub-component has completions[subId] === true."
    return Object.values(entry.completions).some((val) => val === true);
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
