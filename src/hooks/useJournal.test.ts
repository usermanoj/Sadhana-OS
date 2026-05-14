import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useJournal } from './useJournal';
import { formatDateKey } from './useDailyEntry';
import { getItem } from '../lib/storage';
import type { JournalEntry } from '../types';

describe('useJournal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with the current date', () => {
    const { result } = renderHook(() => useJournal());
    expect(result.current.dateKey).toBe(formatDateKey(new Date()));
    expect(result.current.entry).toEqual({
      date: result.current.dateKey,
      content: '',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });

  it('saves an entry and updates history', () => {
    const { result } = renderHook(() => useJournal());

    act(() => {
      result.current.saveEntry({
        ...result.current.entry,
        content: 'Testing journal',
        mood: 'Happy'
      });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]!.content).toBe('Testing journal');
    expect(result.current.history[0]!.mood).toBe('Happy');
  });

  it('persists saved entries to localStorage', () => {
    const { result } = renderHook(() => useJournal());
    const date = result.current.dateKey;

    act(() => {
      result.current.saveEntry(date, 'Stored reflection');
    });

    const journal = getItem<Record<string, JournalEntry>>('journal', {});

    expect(journal[date]?.content).toBe('Stored reflection');
    expect(journal[date]?.createdAt).toEqual(expect.any(String));
    expect(journal[date]?.updatedAt).toEqual(expect.any(String));
  });

  it('loads an existing entry for a date', () => {
    const { result } = renderHook(() => useJournal());
    const date = '2026-05-10';

    act(() => {
      result.current.saveEntry(date, 'Past reflection');
    });

    expect(result.current.loadEntry(date)?.content).toBe('Past reflection');
  });

  it('updates the same date without changing createdAt', () => {
    const { result } = renderHook(() => useJournal());
    const date = result.current.dateKey;

    act(() => {
      result.current.saveEntry({
        ...result.current.entry,
        content: 'First version',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      });
    });

    act(() => {
      result.current.saveEntry(date, 'Edited version');
    });

    const journal = getItem<Record<string, JournalEntry>>('journal', {});

    expect(journal[date]?.content).toBe('Edited version');
    expect(journal[date]?.createdAt).toBe('2026-05-01T00:00:00.000Z');
  });

  it('can navigate to a different date', () => {
    const { result } = renderHook(() => useJournal());

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    act(() => {
      result.current.goToDate(yesterday);
    });

    expect(result.current.dateKey).toBe(formatDateKey(yesterday));
    expect(result.current.entry.content).toBe('');
  });

  it('filters empty entries from history', () => {
    const { result } = renderHook(() => useJournal());

    act(() => {
      result.current.saveEntry({
        ...result.current.entry,
        content: 'Valid content',
      });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = formatDateKey(yesterday);

      result.current.saveEntry({
        date: yesterdayKey,
        content: '   ',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]!.content).toBe('Valid content');
  });
});
