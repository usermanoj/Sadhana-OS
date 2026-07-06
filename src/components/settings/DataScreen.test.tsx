import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, DailyEntry, ExportPayload } from '../../types';
import {
  CloudSyncContext,
  type CloudSyncContextValue,
} from '../../cloud/CloudSyncProvider';
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

const localOnlySyncContext: CloudSyncContextValue = {
  status: 'localOnly',
  message: 'Cloud sync is not active in this session.',
  lastSyncedAt: null,
  lastErrorAt: null,
  pendingWrites: 0,
  canRetry: false,
  retry: vi.fn(async () => undefined),
  refreshFromCloud: vi.fn(async () => undefined),
};

const syncedCloudContext: CloudSyncContextValue = {
  status: 'synced',
  message: null,
  lastSyncedAt: '2026-06-03T08:30:00.000Z',
  lastErrorAt: null,
  pendingWrites: 0,
  canRetry: false,
  retry: vi.fn(async () => undefined),
  refreshFromCloud: vi.fn(async () => undefined),
};

function renderDataScreen(syncOverrides: Partial<CloudSyncContextValue> = {}) {
  const context: CloudSyncContextValue = {
    ...localOnlySyncContext,
    ...syncOverrides,
  };

  render(
    <CloudSyncContext.Provider value={context}>
      <DataScreen />
    </CloudSyncContext.Provider>,
  );

  return context;
}

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
    renderDataScreen();

    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.getByLabelText('Import JSON file')).toBeInTheDocument();
    expect(screen.getByText('Local-only backup')).toBeInTheDocument();
  });

  it('exports JSON and shows a local-cache success message in local-only mode', () => {
    renderDataScreen();

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(screen.getByText('JSON backup exported from this device.')).toBeInTheDocument();
  });

  it('shows cloud-confirmed export status when sync is current', () => {
    renderDataScreen(syncedCloudContext);

    expect(screen.getByText('Cloud-confirmed backup')).toBeInTheDocument();
    expect(screen.getByText(/Last confirmed/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(screen.getByText('JSON backup exported from cloud-confirmed data.')).toBeInTheDocument();
  });

  it('refreshes from cloud before export on demand', async () => {
    const refreshFromCloud = vi.fn(async () => undefined);
    renderDataScreen({
      ...syncedCloudContext,
      refreshFromCloud,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Refresh cloud data' }));

    expect(await screen.findByText('Cloud data refreshed. Exports now use the latest confirmed cloud data.')).toBeInTheDocument();
    expect(refreshFromCloud).toHaveBeenCalledTimes(1);
  });

  it('warns when cloud changes are not confirmed yet', () => {
    renderDataScreen({
      status: 'queued',
      message: 'Unsynced changes are queued.',
      lastSyncedAt: '2026-06-03T08:30:00.000Z',
      pendingWrites: 1,
      canRetry: true,
    });

    expect(screen.getByText('Needs retry')).toBeInTheDocument();
    expect(screen.getByText('1 pending cloud change')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh cloud data' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(screen.getByText('CSV export created from local cache. Cloud confirmation is pending.')).toBeInTheDocument();
  });

  it('imports valid JSON after confirmation and shows success', async () => {
    renderDataScreen(syncedCloudContext);
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });

    fireEvent.change(screen.getByLabelText('Import JSON file'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('dialog', { name: 'Import summary' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Overwrite' }));

    expect(screen.getByText('JSON backup imported. Cloud sync will confirm the changes shortly.')).toBeInTheDocument();
    expect(getItem<Category[]>('categories', [])[0]?.name).toBe('Imported category');
  });

  it('is honest when import starts from an unconfirmed cloud state', async () => {
    renderDataScreen({
      status: 'offline',
      message: 'You are offline.',
      lastSyncedAt: null,
      pendingWrites: 0,
      canRetry: false,
    });
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });

    fireEvent.change(screen.getByLabelText('Import JSON file'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('dialog', { name: 'Import summary' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Overwrite' }));

    expect(screen.getByText('JSON backup imported into local cache. Cloud confirmation is pending.')).toBeInTheDocument();
  });

  it('rejects invalid JSON import and preserves existing data', async () => {
    renderDataScreen();
    const file = new File(['{bad json'], 'bad.json', { type: 'application/json' });

    fireEvent.change(screen.getByLabelText('Import JSON file'), {
      target: { files: [file] },
    });

    expect(await screen.findByText('Invalid JSON backup.')).toBeInTheDocument();
    expect(getItem<Category[]>('categories', [])[0]?.name).toBe('Yoga');
  });
});
