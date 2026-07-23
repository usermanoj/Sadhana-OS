import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import TodayScreen from './TodayScreen';
import { createSeedCategories, seedIfNeeded } from '../../lib/seed';
import { getItem } from '../../lib/storage';
import type { Category, DailyEntry } from '../../types';
import { appRepository } from '../../lib/repository';
import { computeAllScores } from '../../lib/scoring';
import { formatDateKey } from '../../hooks/useDailyEntry';

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
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });

  it('shows overall score bar and daily score heading', () => {
    render(<TodayScreen />);

    expect(screen.getByText('Daily Score')).toBeInTheDocument();
    // Multiple progressbars: overall + one per category
    const bars = screen.getAllByRole('progressbar');
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });

  it('opens with one clear next practice and a balanced three-practice plan', () => {
    render(<TodayScreen />);

    expect(screen.getByRole('heading', { name: 'Your next practice' })).toBeInTheDocument();
    expect(screen.getByText('Yama')).toBeInTheDocument();
    expect(screen.getByText('This practice fits the time you set aside.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Balanced plan' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(/3 practices - \d+ min/)).toBeInTheDocument();
  });

  it('changes plan depth without changing practice configuration', () => {
    render(<TodayScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Minimum plan' }));

    expect(screen.getByRole('button', { name: 'Minimum plan' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(/1 practice - \d+ min/)).toBeInTheDocument();
    expect(getItem<Category[]>('categories', [])).toHaveLength(9);
  });

  it('uses the daily check-in to prepare and persist an explainable plan', () => {
    render(<TodayScreen />);
    const categories = appRepository.getCategories();
    const physical = categories.find((category) => category.name === 'Physical');
    if (!physical) throw new Error('Physical category missing');

    fireEvent.click(screen.getByRole('button', { name: 'Tune plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Very low energy, 1 of 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Physical' }));
    fireEvent.change(screen.getByPlaceholderText('What should this practice protect today?'), {
      target: { value: 'Protect steady energy' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Prepare my plan' }));

    const saved = appRepository.getDailyPlans()[formatDateKey(new Date())];
    expect(saved?.energyLevel).toBe(1);
    expect(saved?.focusCategoryIds).toEqual([physical.id]);
    expect(saved?.intention).toBe('Protect steady energy');
    expect(saved?.items[0]?.categoryId).toBe(physical.id);
    expect(screen.getByText(/chosen focus areas today/)).toBeInTheDocument();
  });

  it('confirms, shortens, and replaces recommendations without recording completion', () => {
    render(<TodayScreen />);
    const date = formatDateKey(new Date());

    fireEvent.click(screen.getByRole('button', { name: 'Shorten' }));
    expect(appRepository.getDailyPlans()[date]?.items[0]?.plannedMinutes).toBe(2);
    expect(appRepository.getDailyEntries()[date]).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: 'Replace' }));
    expect(screen.queryByText('Yama')).not.toBeInTheDocument();
    expect(appRepository.getDailyPlans()[date]?.excludedHabitIds).toContain(
      '00000000-0000-4000-8000-000000000101',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use this plan' }));
    expect(appRepository.getDailyPlans()[date]?.status).toBe('confirmed');
    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });

  it('advances the focused practice immediately after recording it', () => {
    render(<TodayScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Complete Yama' }));

    expect(screen.getByRole('heading', { name: 'Your next practice' })).toBeInTheDocument();
    expect(screen.getByText('Niyama')).toBeInTheDocument();
    expect(screen.getByText('1/42 practices')).toBeInTheDocument();
  });

  it('shows date navigator with prev/next buttons', () => {
    render(<TodayScreen />);

    expect(screen.getByLabelText('Previous day')).toBeInTheDocument();
    expect(screen.getByLabelText('Next day')).toBeInTheDocument();
  });

  it('keeps practice lists collapsed by default', () => {
    render(<TodayScreen />);

    expect(screen.getByRole('button', { name: 'Expand 8 Limbs of Yoga' })).toBeInTheDocument();
    expect(document.getElementById('toggle-00000000-0000-4000-8000-000000000101')).not.toBeInTheDocument();
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
    expect(yamaToggle).toHaveAccessibleName('Yama completed');

    // Verify it persisted to localStorage
    const entries = getItem<Record<string, DailyEntry>>('entries', {});
    const todayKey = Object.keys(entries)[0];
    expect(todayKey).toBeDefined();
    expect(Object.values(entries[todayKey!]!.completions).some(v => v === true)).toBe(true);
  });

  it('shows premium feedback when a category is complete', () => {
    const categories = getItem<Category[]>('categories', []);
    const yoga = categories.find((category) => category.name === '8 Limbs of Yoga');
    if (!yoga) throw new Error('Yoga category missing');
    const completions = Object.fromEntries(
      yoga.subComponents.map((sub) => [sub.id, true]),
    );
    const { categoryScores, overallScore } = computeAllScores(completions, categories);
    appRepository.setDailyEntries({
      [formatDateKey(new Date())]: {
        date: formatDateKey(new Date()),
        completions,
        categoryScores,
        overallScore,
        updatedAt: new Date().toISOString(),
      },
    });

    render(<TodayScreen />);

    const category = document.getElementById(`category-${yoga.id}`);
    expect(category).toBeInTheDocument();
    expect(category).toHaveTextContent('Complete for today');
    expect(category).toHaveTextContent('Complete');
    expect(category).toHaveAttribute('data-complete', 'true');
  });

  it('shows a full-day completion moment when every active practice is complete', () => {
    const categories = createSeedCategories();
    const completions = Object.fromEntries(
      categories.flatMap((category) =>
        category.subComponents.map((sub) => [
          sub.id,
          sub.trackingType === 'text' ? 'Done' : sub.trackingType === 'boolean' ? true : 1,
        ]),
      ),
    );
    const { categoryScores, overallScore } = computeAllScores(completions, categories);
    appRepository.setCategories(categories);
    appRepository.setDailyEntries({
      [formatDateKey(new Date())]: {
        date: formatDateKey(new Date()),
        completions,
        categoryScores,
        overallScore,
        updatedAt: new Date().toISOString(),
      },
    });

    render(<TodayScreen />);

    expect(screen.getByText('Full Day Complete')).toBeInTheDocument();
    expect(screen.getByText('All groups complete')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar', { name: /Daily Score: 100%|Score: 100%/i }).length).toBeGreaterThan(0);
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
    expect(screen.getAllByText(/practices/i).length).toBeGreaterThan(0);
  });
});
