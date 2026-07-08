import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppShell from './AppShell';

vi.mock('../cloud/CloudSyncStatusBanner', () => ({
  default: () => null,
}));

vi.mock('./EnvironmentBadge', () => ({
  default: () => null,
}));

vi.mock('./PwaInstallPrompt', () => ({
  default: () => null,
}));

describe('AppShell', () => {
  it('provides a keyboard skip link to the main content area', () => {
    render(
      <AppShell activeTab="today" onTabChange={vi.fn()}>
        <h1>Daily practice</h1>
      </AppShell>,
    );

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    const main = screen.getByRole('main');

    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('marks the active section in both desktop and mobile navigation', () => {
    render(
      <AppShell activeTab="journal" onTabChange={vi.fn()}>
        <h1>Journal</h1>
      </AppShell>,
    );

    const journalButtons = screen.getAllByRole('button', { name: 'Journal' });

    expect(journalButtons).toHaveLength(2);
    expect(journalButtons.every((button) => button.getAttribute('aria-current') === 'page')).toBe(true);
  });
});
