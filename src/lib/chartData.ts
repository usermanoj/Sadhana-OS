import type { Category, DailyEntry, DateKey } from '../types';
import type { CategoryAverage } from './analytics';
import { getPastDates } from './analytics';

export interface ChartPoint {
  date: string;
  dateKey: DateKey;
  score: number | null;
}

export interface CategoryBarPoint {
  categoryId: string;
  name: string;
  shortName: string;
  score: number;
  color: string;
}

export interface BalanceWheelPoint {
  categoryId: string;
  category: string;
  score: number;
}

const formatDisplayDate = (dateKey: DateKey): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const clampScore = (score: number): number => Math.min(100, Math.max(0, score));

const getScoreForEntry = (
  entry: DailyEntry,
  categories: Category[],
  categoryFilter: string,
): number | null => {
  if (categoryFilter === 'overall') {
    return clampScore(entry.overallScore);
  }

  const category = categories.find((item) => item.id === categoryFilter);
  if (!category || category.isArchived) {
    return null;
  }

  const score = entry.categoryScores[categoryFilter];
  return typeof score === 'number' ? clampScore(score) : null;
};

export const buildChartData = (
  entries: Record<DateKey, DailyEntry>,
  categories: Category[],
  range: number,
  categoryFilter = 'overall',
): ChartPoint[] => {
  return getPastDates(range).map((dateKey) => {
    const entry = entries[dateKey];

    return {
      date: formatDisplayDate(dateKey),
      dateKey,
      score: entry ? getScoreForEntry(entry, categories, categoryFilter) : null,
    };
  });
};

export const hasChartScores = (data: ChartPoint[]): boolean =>
  data.some((point) => point.score !== null);

const shortLabel = (name: string): string => {
  if (name.length <= 16) return name;
  return `${name.slice(0, 15)}...`;
};

export const buildCategoryBarData = (
  categoryAverages: CategoryAverage[],
): CategoryBarPoint[] => {
  return categoryAverages
    .filter((category) => category.averageScore !== null)
    .map((category) => ({
      categoryId: category.categoryId,
      name: category.name,
      shortName: shortLabel(category.name),
      score: category.averageScore ?? 0,
      color: category.color,
    }));
};

export const buildBalanceWheelData = (
  categories: Category[],
  categoryAverages: CategoryAverage[],
): BalanceWheelPoint[] => {
  const averageByCategory = new Map(
    categoryAverages.map((category) => [category.categoryId, category.averageScore]),
  );

  return categories
    .filter((category) => !category.isArchived)
    .map((category) => ({
      categoryId: category.id,
      category: shortLabel(category.name),
      score: averageByCategory.get(category.id) ?? 0,
    }));
};

export const hasCategoryScores = (categoryAverages: CategoryAverage[]): boolean =>
  categoryAverages.some((category) => category.averageScore !== null);
