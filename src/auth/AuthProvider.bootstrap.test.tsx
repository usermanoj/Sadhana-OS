import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const bootstrapMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('../lib/env', () => ({
  getSupabaseEnvironment: () => ({
    url: 'https://example.supabase.co',
    anonKey: 'publishable-test-key',
    isConfigured: true,
    missingKeys: [],
  }),
}));

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession: bootstrapMocks.getSession,
      onAuthStateChange: bootstrapMocks.onAuthStateChange,
    },
  }),
}));

import { AuthGate, AuthProvider } from './AuthProvider';

describe('AuthProvider bootstrap resilience', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    bootstrapMocks.getSession.mockImplementation(() => new Promise(() => undefined));
    bootstrapMocks.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: bootstrapMocks.unsubscribe,
        },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('recovers from a stalled session check with a fresh retry attempt', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AuthProvider bootstrapTimeoutMs={100}>
        <AuthGate>
          <div>Private account content</div>
        </AuthGate>
      </AuthProvider>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Opening your practice space');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByRole('heading', {
      name: "We couldn't open your practice space.",
    })).toBeInTheDocument();
    expect(screen.queryByText('Private account content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry connection' }));

    expect(bootstrapMocks.getSession).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('Opening your practice space');
  });
});
