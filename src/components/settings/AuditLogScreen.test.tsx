import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AuditLogEntry } from '../../types';
import { setItem } from '../../lib/storage';
import AuditLogScreen from './AuditLogScreen';

const createEntry = (
  id: string,
  timestamp: string,
  actionType: AuditLogEntry['actionType'],
  note: string,
): AuditLogEntry => ({
  id,
  timestamp,
  actionType,
  entityType: actionType.startsWith('category') ? 'category' : 'habit',
  entityId: `${id}-entity`,
  oldValue: { name: `Old ${id}` },
  newValue: { name: `New ${id}` },
  note,
});

describe('AuditLogScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders audit entries newest first', () => {
    setItem('audit', [
      createEntry('old', '2026-05-14T01:00:00.000Z', 'category_created', 'Created old'),
      createEntry('new', '2026-05-14T02:00:00.000Z', 'habit_updated', 'Updated new'),
    ]);

    render(<AuditLogScreen />);

    const entries = screen.getAllByRole('button', { name: /audit entry/i });
    expect(entries).toHaveLength(2);
    expect(entries[0]).toHaveTextContent('Updated new');
    expect(entries[1]).toHaveTextContent('Created old');
  });

  it('expands an entry to show old and new JSON values', () => {
    setItem('audit', [
      createEntry('entry-1', '2026-05-14T01:00:00.000Z', 'category_updated', 'Updated category'),
    ]);

    render(<AuditLogScreen />);
    fireEvent.click(screen.getByRole('button', { name: /audit entry/i }));

    expect(screen.getByText('Old Value')).toBeInTheDocument();
    expect(screen.getByText('New Value')).toBeInTheDocument();
    expect(screen.getByText(/Old entry-1/)).toBeInTheDocument();
    expect(screen.getByText(/New entry-1/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no audit entries', () => {
    render(<AuditLogScreen />);

    expect(screen.getByText('No audit entries yet')).toBeInTheDocument();
  });

  it('uses action tone badges for audit actions', () => {
    setItem('audit', [
      createEntry('created', '2026-05-14T01:00:00.000Z', 'category_created', 'Created category'),
      createEntry('archived', '2026-05-14T02:00:00.000Z', 'habit_archived', 'Archived habit'),
    ]);

    render(<AuditLogScreen />);

    const createdEntry = screen.getByRole('button', { name: /Created category/i });
    const archivedEntry = screen.getByRole('button', { name: /Archived habit/i });

    expect(within(createdEntry).getByText('category created')).toHaveAttribute('data-tone', 'created');
    expect(within(archivedEntry).getByText('habit archived')).toHaveAttribute('data-tone', 'archived');
  });
});
