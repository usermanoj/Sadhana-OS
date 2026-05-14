import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedIfNeeded } from '../../lib/seed';
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
});
