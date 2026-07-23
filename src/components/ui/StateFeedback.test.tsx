import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StateBanner, StatePanel } from './StateFeedback';

describe('StateFeedback', () => {
  it('renders an accessible panel for empty states', () => {
    render(
      <StatePanel title="No records yet">
        Add one entry to begin seeing insight.
      </StatePanel>,
    );

    expect(screen.getByRole('note')).toHaveTextContent('No records yet');
    expect(screen.getByText('Add one entry to begin seeing insight.')).toBeInTheDocument();
  });

  it('uses alert semantics for warning and error banners by default', () => {
    render(
      <StateBanner tone="warning" title="Cloud confirmation pending">
        Refresh when connection is restored.
      </StateBanner>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Cloud confirmation pending');
    expect(screen.getByText('Refresh when connection is restored.')).toBeInTheDocument();
  });

  it('allows status semantics when a screen needs non-interruptive feedback', () => {
    render(
      <StateBanner role="status" tone="error" title="Import needs attention">
        Invalid JSON backup.
      </StateBanner>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Invalid JSON backup.');
  });
});
