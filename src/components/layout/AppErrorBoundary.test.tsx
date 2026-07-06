import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import AppErrorBoundary from './AppErrorBoundary';
import { reportError } from '../../lib/observability';

vi.mock('../../lib/observability', () => ({
  reportError: vi.fn(),
}));

function BrokenChild(): ReactElement {
  throw new Error('Render failed for person@example.com');
}

describe('AppErrorBoundary', () => {
  it('shows a recovery screen and reports render failures', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenChild />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /sadhana os needs a refresh/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh app/i })).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledWith(
      expect.any(Error),
      'react_render_error',
      expect.objectContaining({
        severity: 'fatal',
        tags: expect.objectContaining({
          boundary: 'root',
        }),
      }),
    );

    consoleError.mockRestore();
  });
});
