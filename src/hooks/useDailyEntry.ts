import { useState, useCallback, useMemo } from 'react';
import type { Category, DailyEntry, DateKey, TrackingValue } from '../types';
import { getItem, setItem } from '../lib/storage';
import { computeAllScores, isCompleted } from '../lib/scoring';

/** Format a Date to YYYY-MM-DD using local timezone */
export const formatDateKey = (date: Date): DateKey => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addCalendarDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Friendly label for a date: "Today - May 13, 2026" */
export const formatDisplayDate = (date: Date): string => {
  const todayKey = formatDateKey(new Date());
  const dateKey = formatDateKey(date);
  const formatted = date.toLocaleDateString('en-US', {
    weekday: undefined,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  if (dateKey === todayKey) return `Today - ${formatted}`;
  return formatted;
};

/** True when viewing the current calendar day */
export const isToday = (date: Date): boolean =>
  formatDateKey(date) === formatDateKey(new Date());

// ---------------------------------------------------------------------------

function loadCategories(): Category[] {
  return getItem<Category[]>('categories', []);
}

function loadEntries(): Record<DateKey, DailyEntry> {
  return getItem<Record<DateKey, DailyEntry>>('entries', {});
}

function saveEntries(entries: Record<DateKey, DailyEntry>): void {
  setItem('entries', entries);
}

function createEmptyEntry(dateKey: DateKey): DailyEntry {
  return {
    date: dateKey,
    completions: {},
    categoryScores: {},
    overallScore: 0,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface CategoryStats {
  completed: number;
  total: number;
  score: number;
}

export function useDailyEntry() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categories] = useState<Category[]>(() => loadCategories());
  const [entries, setEntries] = useState<Record<DateKey, DailyEntry>>(() => loadEntries());

  const dateKey = formatDateKey(selectedDate);

  const entry: DailyEntry = useMemo(
    () => entries[dateKey] ?? createEmptyEntry(dateKey),
    [entries, dateKey],
  );

  // ---- date navigation ----

  const goToPrev = useCallback(() => {
    setSelectedDate((d) => addCalendarDays(d, -1));
  }, []);

  const goToNext = useCallback(() => {
    setSelectedDate((d) => {
      const next = addCalendarDays(d, 1);
      return formatDateKey(next) > formatDateKey(new Date()) ? d : next;
    });
  }, []);

  const goToDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // ---- active categories / subs ----

  const activeCategories = useMemo(
    () => categories
      .filter((c) => !c.isArchived)
      .sort((a, b) => a.displayOrder - b.displayOrder),
    [categories],
  );

  // ---- per-category stats ----

  const categoryStats = useMemo((): Record<string, CategoryStats> => {
    const stats: Record<string, CategoryStats> = {};
    for (const cat of activeCategories) {
      const activeSubs = cat.subComponents.filter((s) => !s.isArchived);
      const total = activeSubs.length;
      const completed = activeSubs.filter((s) =>
        isCompleted(entry.completions[s.id], s.trackingType),
      ).length;
      stats[cat.id] = {
        completed,
        total,
        score: entry.categoryScores[cat.id] ?? 0,
      };
    }
    return stats;
  }, [activeCategories, entry]);

  // ---- overall completion ----

  const totalCompleted = useMemo(
    () => Object.values(categoryStats).reduce((s, c) => s + c.completed, 0),
    [categoryStats],
  );
  const totalHabits = useMemo(
    () => Object.values(categoryStats).reduce((s, c) => s + c.total, 0),
    [categoryStats],
  );

  // ---- mutations ----

  const persistEntry = useCallback(
    (updatedEntry: DailyEntry) => {
      const next = { ...entries, [updatedEntry.date]: updatedEntry };
      saveEntries(next);
      setEntries(next);
    },
    [entries],
  );

  /** Toggle a boolean sub-component */
  const toggleSubComponent = useCallback(
    (subId: string) => {
      const current = entry.completions[subId];
      const newVal = current === true ? false : true;
      const newCompletions = { ...entry.completions, [subId]: newVal };
      const { categoryScores, overallScore } = computeAllScores(newCompletions, categories);
      const updated: DailyEntry = {
        ...entry,
        completions: newCompletions,
        categoryScores,
        overallScore,
        updatedAt: new Date().toISOString(),
      };
      persistEntry(updated);
    },
    [entry, categories, persistEntry],
  );

  /** Set a tracking value (for non-boolean types) */
  const setTrackingValue = useCallback(
    (subId: string, value: TrackingValue) => {
      const newCompletions = { ...entry.completions, [subId]: value };
      const { categoryScores, overallScore } = computeAllScores(newCompletions, categories);
      const updated: DailyEntry = {
        ...entry,
        completions: newCompletions,
        categoryScores,
        overallScore,
        updatedAt: new Date().toISOString(),
      };
      persistEntry(updated);
    },
    [entry, categories, persistEntry],
  );

  return {
    // state
    selectedDate,
    dateKey,
    entry,
    categories: activeCategories,
    categoryStats,
    totalCompleted,
    totalHabits,
    overallScore: entry.overallScore,

    // actions
    goToPrev,
    goToNext,
    goToDate,
    toggleSubComponent,
    setTrackingValue,
  };
}
