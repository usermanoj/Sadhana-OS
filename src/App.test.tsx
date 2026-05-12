import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

const tabLabels = ['Today', 'Dashboard', 'Journal', 'History', 'Settings'] as const;

describe('App', () => {
  it('renders the app shell with the five Task 001 navigation tabs', () => {
    render(<App />);

    expect(screen.getAllByRole('navigation', { name: 'Main navigation' })).toHaveLength(2);

    for (const label of tabLabels) {
      expect(screen.getAllByRole('button', { name: label })).toHaveLength(2);
    }

    expect(screen.queryByRole('button', { name: 'Tracker' })).not.toBeInTheDocument();
  });

  it('renders the Today placeholder page by default', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText(/daily practice/i)).toBeInTheDocument();
  });

  it('switches between placeholder tabs', () => {
    render(<App />);

    const [journalButton] = screen.getAllByRole('button', { name: 'Journal' });
    if (!journalButton) {
      throw new Error('Journal tab not found');
    }

    fireEvent.click(journalButton);

    expect(screen.getByRole('heading', { name: 'Journal' })).toBeInTheDocument();
  });

  it('shows "Coming soon" badge', () => {
    render(<App />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
