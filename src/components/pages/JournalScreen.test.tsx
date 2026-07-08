import { fireEvent, render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { JournalEntry } from '../../types';
import { getItem, setItem } from '../../lib/storage';
import { formatDateKey } from '../../hooks/useDailyEntry';
import JournalScreen from './JournalScreen';

describe('JournalScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders the journal UI with expected fields', () => {
    render(<JournalScreen />);
    
    expect(screen.getByRole('heading', { name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reflect without pressure' })).toBeInTheDocument();
    expect(screen.getByText('Daily Reflection')).toBeInTheDocument();
    expect(screen.getByText('Prompt for this day')).toBeInTheDocument();
    expect(screen.getByText('Entry depth')).toBeInTheDocument();
    expect(screen.getByText('0/6 sections')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('How are you feeling today?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your thoughts here...')).toBeInTheDocument();
    expect(screen.getAllByText('No History Yet')[0]).toBeInTheDocument();
  });

  it('shows an empty textarea for dates without an entry', () => {
    render(<JournalScreen />);

    expect(screen.getByLabelText('Free-form Notes')).toHaveValue('');
  });

  it('loads saved content when navigating to another date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);

    setItem('journal', {
      [yesterdayKey]: {
        date: yesterdayKey,
        content: 'A steady past reflection',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    });

    render(<JournalScreen />);
    fireEvent.click(screen.getByLabelText('Previous day'));

    expect(screen.getByLabelText('Free-form Notes')).toHaveValue('A steady past reflection');
  });

  it('autosaves input after debounce', async () => {
    render(<JournalScreen />);
    const dateKey = formatDateKey(new Date());
    const contentInput = screen.getByLabelText('Free-form Notes');
    
    act(() => {
      fireEvent.change(contentInput, { target: { value: 'This is my first entry.' } });
    });

    // Should say Saving... immediately (or after next tick)
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    // Fast-forward 2 seconds to trigger save
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Saved on this device.')).toBeInTheDocument();

    const journal = getItem<Record<string, JournalEntry>>('journal', {});
    expect(journal[dateKey]?.content).toBe('This is my first entry.');
  });

  it('updates reflection depth and word count while writing', () => {
    render(<JournalScreen />);

    act(() => {
      fireEvent.change(screen.getByLabelText('Mood & Energy'), { target: { value: 'Clear' } });
      fireEvent.change(screen.getByLabelText('Free-form Notes'), {
        target: { value: 'Attention felt quieter today' },
      });
    });

    expect(screen.getByText('2/6 sections')).toBeInTheDocument();
    expect(screen.getAllByText('4 words')[0]).toBeInTheDocument();
  });

  it('saves immediately on blur if saving is pending', () => {
    render(<JournalScreen />);
    const dateKey = formatDateKey(new Date());
    const moodInput = screen.getByLabelText('Mood & Energy');
    
    act(() => {
      fireEvent.change(moodInput, { target: { value: 'Great' } });
    });
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    act(() => {
      fireEvent.blur(moodInput);
    });

    expect(screen.getByText('Saved')).toBeInTheDocument();

    const journal = getItem<Record<string, JournalEntry>>('journal', {});
    expect(journal[dateKey]?.mood).toBe('Great');
  });

  it('shows recent saved reflections as accessible history actions', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);

    setItem('journal', {
      [yesterdayKey]: {
        date: yesterdayKey,
        mood: 'Calm',
        content: 'A steady past reflection',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    });

    render(<JournalScreen />);

    expect(screen.getAllByText('Recent Reflections')[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Open reflection for/i })[0]).toBeInTheDocument();
    expect(screen.getAllByText('Calm')[0]).toBeInTheDocument();
    expect(screen.getAllByText('2/6 sections')[0]).toBeInTheDocument();
  });
});
