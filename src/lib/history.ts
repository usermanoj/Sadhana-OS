import type { Category, DailyEntry, DateKey, JournalEntry, TrackingType, TrackingValue } from '../types';

export interface HistoryFilters {
  date?: DateKey;
  categoryId?: string;
}

export interface PracticeHistoryRow {
  id: string;
  date: DateKey;
  categoryId: string;
  categoryName: string;
  habitId: string;
  habitName: string;
  value: string;
  score: number | null;
  notes: string;
}

export interface ArchivedHistoryItem {
  id: string;
  type: 'category' | 'habit';
  name: string;
  categoryId: string;
  categoryName: string;
  habitId?: string;
  updatedAt: string;
}

interface HabitContext {
  category: Category;
  habit: Category['subComponents'][number];
}

interface PracticeHistorySortRow extends PracticeHistoryRow {
  categoryOrder: number;
  habitOrder: number;
}

const hasText = (value: string | undefined): boolean =>
  typeof value === 'string' && value.trim() !== '';

const matchesDateFilter = (date: DateKey, filterDate?: DateKey): boolean =>
  !filterDate || date === filterDate;

const matchesCategoryFilter = (categoryId: string, filterCategoryId?: string): boolean =>
  !filterCategoryId || categoryId === filterCategoryId;

const buildHabitIndex = (categories: Category[]): Map<string, HabitContext> => {
  const index = new Map<string, HabitContext>();

  categories.forEach((category) => {
    category.subComponents.forEach((habit) => {
      index.set(habit.id, { category, habit });
    });
  });

  return index;
};

export function formatTrackingValue(value: TrackingValue, trackingType?: TrackingType): string {
  if (typeof value === 'boolean') {
    return value ? 'Completed' : 'Not completed';
  }

  if (typeof value === 'number') {
    if (trackingType === 'duration') return `${value} min`;
    if (trackingType === 'count') return `${value} count`;
    return String(value);
  }

  return value.trim() || 'Blank';
}

export function buildPracticeHistory(
  entries: Record<DateKey, DailyEntry>,
  categories: Category[],
  filters: HistoryFilters = {},
): PracticeHistoryRow[] {
  const habitIndex = buildHabitIndex(categories);

  return Object.values(entries)
    .filter((entry) => matchesDateFilter(entry.date, filters.date))
    .flatMap((entry) =>
      Object.entries(entry.completions).map(([habitId, rawValue]) => {
        const context = habitIndex.get(habitId);
        const category = context?.category;
        const habit = context?.habit;
        const categoryId = category?.id ?? 'unknown';
        const trackingType = habit?.trackingType;

        return {
          id: `${entry.date}-${habitId}`,
          date: entry.date,
          categoryId,
          categoryName: category?.name ?? 'Unknown category',
          habitId,
          habitName: habit?.name ?? 'Unknown habit',
          value: formatTrackingValue(rawValue, trackingType),
          score: category ? entry.categoryScores[category.id] ?? null : null,
          notes: typeof rawValue === 'string' ? rawValue : '',
          categoryOrder: category?.displayOrder ?? Number.MAX_SAFE_INTEGER,
          habitOrder: habit?.displayOrder ?? Number.MAX_SAFE_INTEGER,
        } satisfies PracticeHistorySortRow;
      }),
    )
    .filter((row) => matchesCategoryFilter(row.categoryId, filters.categoryId))
    .sort((a, b) => {
      const dateSort = b.date.localeCompare(a.date);
      if (dateSort !== 0) return dateSort;
      const categorySort = a.categoryOrder - b.categoryOrder;
      if (categorySort !== 0) return categorySort;
      return a.habitOrder - b.habitOrder;
    })
    .map((row) => ({
      id: row.id,
      date: row.date,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      habitId: row.habitId,
      habitName: row.habitName,
      value: row.value,
      score: row.score,
      notes: row.notes,
    }));
}

export function buildJournalHistory(
  journal: Record<DateKey, JournalEntry>,
  filters: Pick<HistoryFilters, 'date'> = {},
): JournalEntry[] {
  return Object.values(journal)
    .filter((entry) => matchesDateFilter(entry.date, filters.date))
    .filter((entry) =>
      hasText(entry.content)
      || hasText(entry.mood)
      || hasText(entry.gratitude)
      || hasText(entry.spiritualInsight)
      || hasText(entry.triggerObserved)
      || hasText(entry.lessonLearned),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function buildArchivedItems(
  categories: Category[],
  filters: Pick<HistoryFilters, 'categoryId'> = {},
): ArchivedHistoryItem[] {
  return categories
    .flatMap((category) => {
      const categoryItem: ArchivedHistoryItem[] = category.isArchived
        ? [{
            id: `category-${category.id}`,
            type: 'category',
            name: category.name,
            categoryId: category.id,
            categoryName: category.name,
            updatedAt: category.updatedAt,
          }]
        : [];

      const habitItems = category.subComponents
        .filter((habit) => habit.isArchived)
        .map((habit): ArchivedHistoryItem => ({
          id: `habit-${habit.id}`,
          type: 'habit',
          name: habit.name,
          categoryId: category.id,
          categoryName: category.name,
          habitId: habit.id,
          updatedAt: habit.updatedAt,
        }));

      return [...habitItems, ...categoryItem];
    })
    .filter((item) => matchesCategoryFilter(item.categoryId, filters.categoryId))
    .sort((a, b) => {
      const timeSort = b.updatedAt.localeCompare(a.updatedAt);
      return timeSort !== 0 ? timeSort : a.name.localeCompare(b.name);
    });
}
