import { useState, useCallback, useMemo } from 'react';
import type { JournalEntry, DateKey } from '../types';
import { appRepository } from '../lib/repository';
import { formatDateKey } from './useDailyEntry';

function loadJournalEntries(): Record<DateKey, JournalEntry> {
  return appRepository.getJournalEntries();
}

function saveJournalEntries(entries: Record<DateKey, JournalEntry>): void {
  appRepository.setJournalEntries(entries);
}

function createEmptyEntry(date: DateKey): JournalEntry {
  const now = new Date().toISOString();

  return {
    date,
    content: '',
    createdAt: now,
    updatedAt: now,
  };
}

function hasJournalContent(entry: JournalEntry): boolean {
  return [
    entry.content,
    entry.mood,
    entry.gratitude,
    entry.spiritualInsight,
    entry.triggerObserved,
    entry.lessonLearned,
  ].some((value) => typeof value === 'string' && value.trim() !== '');
}

export function useJournal() {
  const [entries, setEntries] = useState<Record<DateKey, JournalEntry>>(() => loadJournalEntries());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateKey = formatDateKey(selectedDate);

  const entry: JournalEntry = useMemo(
    () => entries[dateKey] ?? createEmptyEntry(dateKey),
    [entries, dateKey]
  );

  const history = useMemo(() => {
    return Object.values(entries)
      .filter(hasJournalContent)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  const loadEntry = useCallback((date: Date | DateKey): JournalEntry | null => {
    const key = typeof date === 'string' ? date : formatDateKey(date);

    return entries[key] ?? null;
  }, [entries]);

  const goToDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const saveEntry = useCallback((entryOrDate: JournalEntry | DateKey, content?: string) => {
    setEntries((currentEntries) => {
      const savedAt = new Date().toISOString();
      const date = typeof entryOrDate === 'string' ? entryOrDate : entryOrDate.date;
      const existingEntry = currentEntries[date];
      const updatedEntry: JournalEntry = typeof entryOrDate === 'string'
        ? {
            ...existingEntry,
            date,
            content: content ?? existingEntry?.content ?? '',
            createdAt: existingEntry?.createdAt ?? savedAt,
            updatedAt: savedAt,
          }
        : entryOrDate;

      const nextEntry: JournalEntry = {
        ...updatedEntry,
        createdAt: existingEntry?.createdAt ?? updatedEntry.createdAt ?? savedAt,
        updatedAt: savedAt,
      };
      const nextEntries = {
        ...currentEntries,
        [nextEntry.date]: nextEntry,
      };

      saveJournalEntries(nextEntries);

      return nextEntries;
    });
  }, []);

  return {
    selectedDate,
    dateKey,
    entry,
    history,
    loadEntry,
    goToDate,
    saveEntry
  };
}
