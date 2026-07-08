import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedIfNeeded } from '../../lib/seed';
import { getItem, setItem } from '../../lib/storage';
import type { Category, DailyEntry } from '../../types';
import DashboardScreen from './DashboardScreen';

const createEntry = (
  date: string,
  overallScore: number,
  categoryId: string,
  habitId: string,
): DailyEntry => ({
  date,
  completions: { [habitId]: true },
  categoryScores: { [categoryId]: overallScore },
  overallScore,
  updatedAt: '',
});

describe('DashboardScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 14, 12));
    localStorage.clear();
    seedIfNeeded();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an empty state when there are no entries', () => {
    render(<DashboardScreen />);

    expect(screen.getByText('Practice Intelligence')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Insight for the last 7 days' })).toBeInTheDocument();
    expect(screen.getByText('Begin with one day')).toBeInTheDocument();
    expect(screen.getByText('Range Avg')).toBeInTheDocument();
    expect(screen.getByText('Active Days')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('No entries in this range')).toBeInTheDocument();
    expect(screen.getByText('Balance wheel is waiting')).toBeInTheDocument();
    expect(screen.getByText('No category comparison yet')).toBeInTheDocument();
    expect(screen.getByText('Today Good Life Score')).toBeInTheDocument();
    expect(screen.getAllByText('Not enough entries yet').length).toBeGreaterThan(0);
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
  });

  it('switches date ranges', () => {
    render(<DashboardScreen />);

    const sevenDays = screen.getByRole('button', { name: '7 days' });
    const thirtyDays = screen.getByRole('button', { name: '30 days' });

    expect(sevenDays).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(thirtyDays);

    expect(thirtyDays).toHaveAttribute('aria-pressed', 'true');
    expect(sevenDays).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: 'Insight for the last 30 days' })).toBeInTheDocument();
  });

  it('renders active categories in the category filter', () => {
    const categories = getItem<Category[]>('categories', []);
    const firstCategory = categories[0]!;

    render(<DashboardScreen />);

    expect(screen.getByRole('option', { name: firstCategory.name })).toBeInTheDocument();
  });

  it('renders the requested dashboard analytics sections with entry data', () => {
    const categories = getItem<Category[]>('categories', []);
    const firstCategory = categories[0]!;
    const firstHabit = firstCategory.subComponents[0]!;

    setItem('entries', {
      '2026-05-13': createEntry('2026-05-13', 60, firstCategory.id, firstHabit.id),
      '2026-05-14': createEntry('2026-05-14', 80, firstCategory.id, firstHabit.id),
    });

    render(<DashboardScreen />);

    expect(screen.getByText('Practice Intelligence')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Insight for the last 7 days' })).toBeInTheDocument();
    expect(screen.getByText('Current focus')).toBeInTheDocument();
    expect(screen.getByText('Strongest Area')).toBeInTheDocument();
    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    expect(screen.getByText('Practice Rhythm')).toBeInTheDocument();
    expect(screen.getByText('2/7')).toBeInTheDocument();
    expect(screen.getByText('Today Good Life Score')).toBeInTheDocument();
    expect(screen.getByText('Weekly Average')).toBeInTheDocument();
    expect(screen.getByText('Monthly Average')).toBeInTheDocument();
    expect(screen.getByText('Best Performing Category')).toBeInTheDocument();
    expect(screen.getByText('Weakest Category')).toBeInTheDocument();
    expect(screen.getByText('Most Completed Habit')).toBeInTheDocument();
    expect(screen.getByText('Most Missed Habit')).toBeInTheDocument();
    expect(screen.getByText('9-Category Balance Wheel')).toBeInTheDocument();
    expect(screen.getByText('Good Life Score Over Time')).toBeInTheDocument();
    expect(screen.getByText('Category Scores')).toBeInTheDocument();
    expect(screen.getByText('Category Average Scores')).toBeInTheDocument();
    expect(screen.getAllByText('80%').length).toBeGreaterThan(0);
  });
});
