import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, DailyEntry, ExportPayload } from '../../types';
import { getItem, setItem } from '../../lib/storage';
import DataScreen from './DataScreen';

const category: Category = {
  id: 'cat-yoga',
  name: 'Yoga',
  icon: 'lotus',
  color: '#7C3AED',
  displayOrder: 0,
  isArchived: false,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  subComponents: [{
    id: 'habit-yama',
    categoryId: 'cat-yoga',
    name: 'Yama',
    trackingType: 'boolean',
    displayOrder: 0,
    isArchived: false,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  }],
};

const importedCategory: Category = {
  ...category,
  id: 'cat-imported',
  name: 'Imported category',
  subComponents: [{
    ...category.subComponents[0]!,
    id: 'habit-imported',
    categoryId: 'cat-imported',
    name: 'Imported habit',
  }],
};

const importedEntry: DailyEntry = {
  date: '2026-05-14',
  completions: { 'habit-imported': true },
  categoryScores: { 'cat-imported': 100 },
  overallScore: 100,
  updatedAt: '2026-05-14T00:00:00.000Z',
};

const backup: ExportPayload = {
  version: '1.1',
  exportedAt: '2026-05-14T01:00:00.000Z',
  categories: [importedCategory],
  habits: importedCategory.subComponents,
  dailyEntries: { [importedEntry.date]: importedEntry },
  journalEntries: {},
  auditLogs: [],
  settings: { schemaVersion: '1.1' },
  entries: { [importedEntry.date]: importedEntry },
  journal: {},
  audit: [],
};

describe('DataScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    setItem('version', '1.1');
    setItem('categories', [category]);
    setItem('entries', {});
    setItem('journal', {});
    setItem('audit', []);
    vi.restoreAllMocks();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:backup'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('renders export/import controls', () => {
    render(<DataScreen />);

    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.getByLabelText('Import JSON file')).toBeInTheDocument();
  });

  it('exports JSON and shows a success message', () => {
    render(<DataScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(screen.getByText('JSON backup exported.')).toBeInTheDocument();
  });

  it('imports valid JSON after confirmation and shows success', async () => {
    render(<DataScreen />);
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });

    fireEvent.change(screen.getByLabelText('Import JSON file'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('dialog', { name: 'Import summary' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Overwrite' }));

    expect(screen.getByText('JSON backup imported.')).toBeInTheDocument();
    expect(getItem<Category[]>('categories', [])[0]?.name).toBe('Imported category');
  });

  it('rejects invalid JSON import and preserves existing data', async () => {
    render(<DataScreen />);
    const file = new File(['{bad json'], 'bad.json', { type: 'application/json' });

    fireEvent.change(screen.getByLabelText('Import JSON file'), {
      target: { files: [file] },
    });

    expect(await screen.findByText('Invalid JSON backup.')).toBeInTheDocument();
    expect(getItem<Category[]>('categories', [])[0]?.name).toBe('Yoga');
  });
});
