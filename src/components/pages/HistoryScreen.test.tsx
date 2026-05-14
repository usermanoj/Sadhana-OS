import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AuditLogEntry, Category, DailyEntry, JournalEntry } from '../../types';
import { getItem, setItem } from '../../lib/storage';
import HistoryScreen from './HistoryScreen';

const categories: Category[] = [
  {
    id: 'cat-yoga',
    name: 'Yoga',
    icon: 'lotus',
    color: '#7C3AED',
    displayOrder: 0,
    isArchived: false,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    subComponents: [
      {
        id: 'habit-yama',
        categoryId: 'cat-yoga',
        name: 'Yama',
        trackingType: 'boolean',
        displayOrder: 0,
        isArchived: false,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
      {
        id: 'habit-journal',
        categoryId: 'cat-yoga',
        name: 'Journal reflection',
        trackingType: 'text',
        displayOrder: 1,
        isArchived: true,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-03T00:00:00.000Z',
      },
    ],
  },
  {
    id: 'cat-family',
    name: 'Family',
    icon: 'home',
    color: '#F59E0B',
    displayOrder: 1,
    isArchived: true,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-04T00:00:00.000Z',
    subComponents: [
      {
        id: 'habit-call',
        categoryId: 'cat-family',
        name: 'Call parents',
        trackingType: 'boolean',
        displayOrder: 0,
        isArchived: false,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ],
  },
];

const entries: Record<string, DailyEntry> = {
  '2026-05-14': {
    date: '2026-05-14',
    completions: {
      'habit-yama': true,
      'habit-journal': 'Noticed calmer speech',
    },
    categoryScores: { 'cat-yoga': 80 },
    overallScore: 80,
    updatedAt: '2026-05-14T12:00:00.000Z',
  },
  '2026-05-13': {
    date: '2026-05-13',
    completions: { 'habit-call': false },
    categoryScores: { 'cat-family': 20 },
    overallScore: 20,
    updatedAt: '2026-05-13T12:00:00.000Z',
  },
};

const journal: Record<string, JournalEntry> = {
  '2026-05-14': {
    date: '2026-05-14',
    content: 'Journal history entry',
    createdAt: '2026-05-14T08:00:00.000Z',
    updatedAt: '2026-05-14T08:30:00.000Z',
  },
};

const audit: AuditLogEntry[] = [
  {
    id: 'audit-1',
    timestamp: '2026-05-14T09:00:00.000Z',
    actionType: 'category_updated',
    entityType: 'category',
    entityId: 'cat-yoga',
    oldValue: { name: 'Old Yoga' },
    newValue: { name: 'Yoga' },
    note: 'Renamed Yoga',
  },
];

describe('HistoryScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    setItem('categories', categories);
    setItem('entries', entries);
    setItem('journal', journal);
    setItem('audit', audit);
  });

  it('renders the requested history sections as tabs', () => {
    render(<HistoryScreen />);

    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practice History' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Journal History' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Audit Log' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archived Items' })).toBeInTheDocument();
  });

  it('shows practice history with date, category, habit, value, score, and notes', () => {
    render(<HistoryScreen />);

    const section = screen.getByRole('region', { name: 'Practice History' });

    expect(within(section).getAllByText('2026-05-14')[0]).toBeInTheDocument();
    expect(within(section).getAllByText('Yoga')[0]).toBeInTheDocument();
    expect(within(section).getByText('Yama')).toBeInTheDocument();
    expect(within(section).getByText('Completed')).toBeInTheDocument();
    expect(within(section).getAllByText('80%')[0]).toBeInTheDocument();
    expect(within(section).getAllByText('Noticed calmer speech')[0]).toBeInTheDocument();
  });

  it('filters practice history by date and category', () => {
    render(<HistoryScreen />);

    fireEvent.change(screen.getByLabelText('Filter by date'), {
      target: { value: '2026-05-13' },
    });
    fireEvent.change(screen.getByLabelText('Filter by category'), {
      target: { value: 'cat-family' },
    });

    const section = screen.getByRole('region', { name: 'Practice History' });

    expect(within(section).getByText('Family')).toBeInTheDocument();
    expect(within(section).getByText('Call parents')).toBeInTheDocument();
    expect(within(section).queryByText('Yama')).not.toBeInTheDocument();
  });

  it('shows journal history entries', () => {
    render(<HistoryScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Journal History' }));

    expect(screen.getByText('Journal history entry')).toBeInTheDocument();
    expect(screen.getByText('2026-05-14')).toBeInTheDocument();
  });

  it('shows audit logs with entity and old/new values', () => {
    render(<HistoryScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Audit Log' }));

    expect(screen.getByText('category updated')).toBeInTheDocument();
    expect(screen.getByText(/category .* cat-yoga/)).toBeInTheDocument();
    expect(screen.getByText(/Old Yoga/)).toBeInTheDocument();
    expect(screen.getAllByText(/Yoga/).length).toBeGreaterThan(0);
  });

  it('shows archived categories and habits and restores supported items', () => {
    render(<HistoryScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Archived Items' }));
    const section = screen.getByRole('region', { name: 'Archived Items' });

    expect(within(section).getByText('Family')).toBeInTheDocument();
    expect(within(section).getByText('Journal reflection')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restore category Family' }));

    const stored = getItem<Category[]>('categories', []);
    expect(stored.find((category) => category.id === 'cat-family')?.isArchived).toBe(false);
    expect(within(section).queryByText('Family')).not.toBeInTheDocument();
  });
});
