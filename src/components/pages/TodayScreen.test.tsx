import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import TodayScreen from './TodayScreen';
import { seedIfNeeded } from '../../lib/seed';
import { getItem } from '../../lib/storage';
import type { Category, DailyEntry } from '../../types';

describe('TodayScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    seedIfNeeded();
  });

  it('renders all 9 default categories', () => {
    render(<TodayScreen />);

    const categoryNames = [
      '8 Limbs of Yoga',
      'Speech / Vaani Control',
      'Six Senses Control',
      'Spiritual',
      'Physical',
      'Mental',
      'Society',
      'Professional',
      'Family',
    ];

    for (const name of categoryNames) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('shows overall score bar and daily score heading', () => {
    render(<TodayScreen />);

    expect(screen.getByText('Daily Score')).toBeInTheDocument();
    // Multiple progressbars: overall + one per category
    const bars = screen.getAllByRole('progressbar');
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });

  it('shows date navigator with prev/next buttons', () => {
    render(<TodayScreen />);

    expect(screen.getByLabelText('Previous day')).toBeInTheDocument();
    expect(screen.getByLabelText('Next day')).toBeInTheDocument();
  });

  it('keeps practice lists collapsed by default', () => {
    render(<TodayScreen />);

    expect(screen.getByRole('button', { name: 'Expand 8 Limbs of Yoga' })).toBeInTheDocument();
    expect(screen.queryByText('Yama')).not.toBeInTheDocument();
  });

  it('next day button is disabled when viewing today', () => {
    render(<TodayScreen />);

    const nextBtn = screen.getByLabelText('Next day');
    expect(nextBtn).toBeDisabled();
  });

  it('toggles a boolean sub-component and updates scores', () => {
    render(<TodayScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand 8 Limbs of Yoga' }));

    // Find the first toggle (Yama) by its specific ID
    const yamaToggle = document.getElementById('toggle-00000000-0000-4000-8000-000000000101');
    expect(yamaToggle).toBeInTheDocument();
    expect(yamaToggle).toHaveAttribute('aria-checked', 'false');

    // Toggle it on
    fireEvent.click(yamaToggle!);
    expect(yamaToggle).toHaveAttribute('aria-checked', 'true');

    // Verify it persisted to localStorage
    const entries = getItem<Record<string, DailyEntry>>('entries', {});
    const todayKey = Object.keys(entries)[0];
    expect(todayKey).toBeDefined();
    expect(Object.values(entries[todayKey!]!.completions).some(v => v === true)).toBe(true);
  });

  it('does not render archived categories', () => {
    // Modify seed data to archive a category
    const categories = getItem<Category[]>('categories', []);
    const updated = categories.map(c =>
      c.name === 'Family' ? { ...c, isArchived: true } : c
    );
    localStorage.setItem('sadhana:categories', JSON.stringify(updated));

    render(<TodayScreen />);

    expect(screen.queryByText('Family')).not.toBeInTheDocument();
  });

  it('does not render archived sub-components', () => {
    const categories = getItem<Category[]>('categories', []);
    const updated = categories.map((category) =>
      category.name === '8 Limbs of Yoga'
        ? {
            ...category,
            subComponents: category.subComponents.map((sub) =>
              sub.name === 'Yama' ? { ...sub, isArchived: true } : sub,
            ),
          }
        : category,
    );
    localStorage.setItem('sadhana:categories', JSON.stringify(updated));

    render(<TodayScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand 8 Limbs of Yoga' }));

    expect(screen.queryByText('Yama')).not.toBeInTheDocument();
    expect(screen.getByText('0/7')).toBeInTheDocument();
  });

  it('renders numeric tracking controls and persists their values', () => {
    render(<TodayScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand Physical' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase Exercise' }));

    expect(screen.getByRole('spinbutton', { name: 'Exercise value' })).toHaveValue(1);
    expect(screen.getByText('1/42 practices')).toBeInTheDocument();

    const entries = getItem<Record<string, DailyEntry>>('entries', {});
    const todayKey = Object.keys(entries)[0];
    expect(todayKey).toBeDefined();
    expect(Object.values(entries[todayKey!]!.completions).some(v => v === 1)).toBe(true);
  });

  it('navigates to previous day', () => {
    render(<TodayScreen />);

    const prevBtn = screen.getByLabelText('Previous day');
    fireEvent.click(prevBtn);

    // Date should no longer say "Today"
    const dateText = screen.getByText(/\w+ \d+, \d{4}/);
    expect(dateText).toBeInTheDocument();

    // Next button should now be enabled
    const nextBtn = screen.getByLabelText('Next day');
    expect(nextBtn).not.toBeDisabled();
  });

  it('shows completion count in total', () => {
    render(<TodayScreen />);

    // Total sub-components: 8+4+6+4+4+4+4+4+4 = 42
    // After Task 004 seed, there should be a "practices" label
    expect(screen.getByText(/practices/i)).toBeInTheDocument();
  });
});
