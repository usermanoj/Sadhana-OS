import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import { seedIfNeeded } from './lib/seed';

const tabLabels = ['Today', 'Dashboard', 'Journal', 'History', 'Settings'] as const;

describe('App', () => {
  beforeEach(() => {
    window.location.hash = '';
    localStorage.clear();
    seedIfNeeded();
  });

  it('renders the app shell with the five navigation tabs', () => {
    render(<App />);

    expect(screen.getAllByRole('navigation', { name: 'Main navigation' })).toHaveLength(2);

    for (const label of tabLabels) {
      expect(screen.getAllByRole('button', { name: label })).toHaveLength(2);
    }

    expect(screen.queryByRole('button', { name: 'Tracker' })).not.toBeInTheDocument();
  });

  it('renders the TodayScreen with daily score by default', () => {
    render(<App />);

    // TodayScreen shows "Daily Score" heading
    expect(screen.getByText('Daily Score')).toBeInTheDocument();
    // Date navigator is present
    expect(screen.getByLabelText('Previous day')).toBeInTheDocument();
  });

  it('renders all 9 default categories', () => {
    render(<App />);

    const categories = [
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

    categories.forEach((category) => {
      expect(
        screen.getByRole('button', { name: `Expand ${category}` }),
      ).toBeInTheDocument();
    });
  });

  it('switches to Journal tab', () => {
    render(<App />);

    const [journalButton] = screen.getAllByRole('button', { name: 'Journal' });
    if (!journalButton) {
      throw new Error('Journal tab not found');
    }

    fireEvent.click(journalButton);

    expect(window.location.hash).toBe('#/journal');
    expect(screen.getByRole('heading', { name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByText('Daily Reflection')).toBeInTheDocument();
  });

  it('opens the route from the current hash on mount', () => {
    window.location.hash = '#/settings/data';

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Data' })).toBeInTheDocument();
  });

  it('switches to History tab', () => {
    render(<App />);

    const [historyButton] = screen.getAllByRole('button', { name: 'History' });
    fireEvent.click(historyButton!);

    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practice History' })).toBeInTheDocument();
  });

  it('switches back to TodayScreen from other tabs', () => {
    render(<App />);

    // Go to Dashboard
    const [dashboardButton] = screen.getAllByRole('button', { name: 'Dashboard' });
    fireEvent.click(dashboardButton!);
    expect(screen.getByText('Analytics')).toBeInTheDocument();

    // Go back to Today
    const [todayButton] = screen.getAllByRole('button', { name: 'Today' });
    fireEvent.click(todayButton!);
    expect(screen.getByText('Daily Score')).toBeInTheDocument();
  });

  it('shows category management on the Settings tab', () => {
    render(<App />);

    const [settingsButton] = screen.getAllByRole('button', { name: 'Settings' });
    fireEvent.click(settingsButton!);

    expect(window.location.hash).toBe('#/settings/categories');
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Category' })).toBeInTheDocument();
  });

  it('adds a category from Settings and shows it on Today', () => {
    render(<App />);

    const [settingsButton] = screen.getAllByRole('button', { name: 'Settings' });
    fireEvent.click(settingsButton!);
    fireEvent.click(screen.getByRole('button', { name: 'Add Category' }));
    fireEvent.change(screen.getByLabelText('Category name'), {
      target: { value: 'Devotion' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Category' }));

    expect(screen.getByText('Devotion')).toBeInTheDocument();

    const [todayButton] = screen.getAllByRole('button', { name: 'Today' });
    fireEvent.click(todayButton!);

    expect(screen.getByText('Devotion')).toBeInTheDocument();
  });
});
