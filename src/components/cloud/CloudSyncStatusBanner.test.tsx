import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import {
  CloudSyncContext,
  type CloudSyncContextValue,
} from '../../cloud/CloudSyncProvider';
import CloudSyncStatusBanner from './CloudSyncStatusBanner';

const syncedContext: CloudSyncContextValue = {
  status: 'synced',
  message: null,
  lastSyncedAt: '2026-06-03T00:00:00.000Z',
  lastErrorAt: null,
  pendingWrites: 0,
  canRetry: false,
  retry: vi.fn(async () => undefined),
};

function renderBanner(overrides: Partial<CloudSyncContextValue> = {}) {
  const context = {
    ...syncedContext,
    ...overrides,
  };

  render(
    <CloudSyncContext.Provider value={context}>
      <CloudSyncStatusBanner />
    </CloudSyncContext.Provider>,
  );

  return context;
}

describe('CloudSyncStatusBanner', () => {
  it('stays hidden when cloud data is synced', () => {
    renderBanner();

    expect(screen.queryByLabelText('Cloud sync status')).not.toBeInTheDocument();
  });

  it('shows failed cloud sync state and calls retry', () => {
    const retry = vi.fn(async () => undefined);
    renderBanner({
      status: 'failed',
      message: 'A recent change was saved on this device but did not reach cloud storage.',
      lastSyncedAt: null,
      lastErrorAt: '2026-06-03T00:01:00.000Z',
      canRetry: true,
      retry,
    });

    expect(screen.getByRole('alert', { name: 'Cloud sync status' })).toHaveTextContent(
      'Cloud sync needs attention',
    );
    expect(screen.getByText(/did not reach cloud storage/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('shows queued pending changes', () => {
    renderBanner({
      status: 'queued',
      message: 'Unsynced changes are queued and will replay when cloud sync is available.',
      pendingWrites: 1,
      canRetry: true,
    });

    expect(screen.getByRole('alert', { name: 'Cloud sync status' })).toHaveTextContent(
      'Unsynced changes pending',
    );
    expect(screen.getByText('1 pending change')).toBeInTheDocument();
  });

  it('shows cloud conflict state without a retry button', () => {
    renderBanner({
      status: 'conflict',
      message: 'Cloud data changed on another device. Your local changes remain queued and will not overwrite newer cloud data.',
      pendingWrites: 1,
      canRetry: false,
    });

    expect(screen.getByRole('alert', { name: 'Cloud sync status' })).toHaveTextContent(
      'Cloud changes need review',
    );
    expect(screen.getByText(/will not overwrite newer cloud data/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });
});
