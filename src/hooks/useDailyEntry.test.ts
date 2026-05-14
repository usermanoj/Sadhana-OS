import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDailyEntry, formatDateKey } from './useDailyEntry';
import { seedIfNeeded } from '../lib/seed';
import { getItem } from '../lib/storage';
import type { DailyEntry } from '../types';

describe('useDailyEntry hook', () => {
  beforeEach(() => {
    localStorage.clear();
    seedIfNeeded();
  });

  it('loads initial state correctly', () => {
    const { result } = renderHook(() => useDailyEntry());

    expect(result.current.selectedDate.toDateString()).toBe(new Date().toDateString());
    expect(result.current.dateKey).toBe(formatDateKey(new Date()));
    expect(result.current.categories.length).toBe(9); // Default seeded categories
    expect(result.current.overallScore).toBe(0);
  });

  it('navigates to previous and next dates', () => {
    const { result } = renderHook(() => useDailyEntry());

    const initialDate = result.current.selectedDate;

    act(() => {
      result.current.goToPrev();
    });

    const prevDate = new Date(initialDate.getTime() - 86400000);
    expect(result.current.selectedDate.toDateString()).toBe(prevDate.toDateString());

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.selectedDate.toDateString()).toBe(initialDate.toDateString());
  });

  it('does not navigate to future dates via goToNext', () => {
    const { result } = renderHook(() => useDailyEntry());

    const initialDate = result.current.selectedDate;

    act(() => {
      result.current.goToNext();
    });

    // Should still be today
    expect(result.current.selectedDate.toDateString()).toBe(initialDate.toDateString());
  });

  it('toggles boolean sub-component and persists', () => {
    const { result } = renderHook(() => useDailyEntry());

    // Find a boolean habit ID from seed data
    const cat = result.current.categories.find(c => c.name === '8 Limbs of Yoga');
    const yamaId = cat!.subComponents.find(s => s.name === 'Yama')!.id;

    act(() => {
      result.current.toggleSubComponent(yamaId);
    });

    expect(result.current.entry.completions[yamaId]).toBe(true);

    const entries = getItem<Record<string, DailyEntry>>('entries', {});
    expect(entries[result.current.dateKey]?.completions[yamaId]).toBe(true);
  });

  it('sets non-boolean tracking values and persists', () => {
    const { result } = renderHook(() => useDailyEntry());

    // Find a duration habit ID
    const cat = result.current.categories.find(c => c.name === 'Physical');
    const exerciseId = cat!.subComponents.find(s => s.name === 'Exercise')!.id;

    act(() => {
      result.current.setTrackingValue(exerciseId, 30);
    });

    expect(result.current.entry.completions[exerciseId]).toBe(30);

    const entries = getItem<Record<string, DailyEntry>>('entries', {});
    expect(entries[result.current.dateKey]?.completions[exerciseId]).toBe(30);
  });

  it('keeps entries isolated by selected date', () => {
    const { result } = renderHook(() => useDailyEntry());

    const cat = result.current.categories.find(c => c.name === '8 Limbs of Yoga');
    const yamaId = cat!.subComponents.find(s => s.name === 'Yama')!.id;
    const todayKey = result.current.dateKey;

    act(() => {
      result.current.toggleSubComponent(yamaId);
    });

    expect(result.current.entry.completions[yamaId]).toBe(true);

    act(() => {
      result.current.goToPrev();
    });

    const previousKey = result.current.dateKey;
    expect(previousKey).not.toBe(todayKey);
    expect(result.current.entry.completions[yamaId]).toBeUndefined();
    expect(result.current.overallScore).toBe(0);

    act(() => {
      result.current.toggleSubComponent(yamaId);
    });

    expect(result.current.entry.completions[yamaId]).toBe(true);

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.dateKey).toBe(todayKey);
    expect(result.current.entry.completions[yamaId]).toBe(true);

    const entries = getItem<Record<string, DailyEntry>>('entries', {});
    expect(entries[todayKey]?.completions[yamaId]).toBe(true);
    expect(entries[previousKey]?.completions[yamaId]).toBe(true);
  });
});
