import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedIfNeeded } from '../../lib/seed';
import { recordAuditEntry } from '../../lib/auditService';
import SettingsScreen from './SettingsScreen';

describe('SettingsScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    seedIfNeeded();
  });

  it('shows tracker categories and opens a category with its habits', () => {
    render(<SettingsScreen />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByText('8 Limbs of Yoga')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit 8 Limbs of Yoga' }));

    expect(screen.getByRole('heading', { name: 'Edit Category' })).toBeInTheDocument();
    expect(screen.getByLabelText('Category name')).toHaveValue('8 Limbs of Yoga');
    expect(screen.getByText('Yama')).toBeInTheDocument();
    expect(screen.getByText('Niyama')).toBeInTheDocument();
  });

  it('keeps archived categories out of the active list', () => {
    render(<SettingsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Archive Family' }));

    const activeSection = screen.getByLabelText('Active categories');
    const archivedSection = screen.getByLabelText('Archived categories');

    expect(within(activeSection).queryByText('Family')).not.toBeInTheDocument();
    expect(within(archivedSection).getByText('Family')).toBeInTheDocument();
  });

  it('shows the audit log section from Settings', () => {
    recordAuditEntry({
      actionType: 'category_created',
      entityType: 'category',
      entityId: 'category-1',
      oldValue: null,
      newValue: { name: 'Practice' },
      note: 'Created Practice',
    });

    render(<SettingsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Audit Log' }));

    expect(screen.getByRole('heading', { name: 'Audit Log' })).toBeInTheDocument();
    expect(screen.getByText('Created Practice')).toBeInTheDocument();
  });

  it('shows data export and import controls from Settings', () => {
    render(<SettingsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Data' }));

    expect(screen.getByRole('heading', { name: 'Data' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.getByLabelText('Import JSON file')).toBeInTheDocument();
  });

  it('shows account and privacy sections from Settings', () => {
    render(<SettingsScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByText('Local-only mode')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Privacy' }));
    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export JSON Backup' })).toBeInTheDocument();
  });
});
