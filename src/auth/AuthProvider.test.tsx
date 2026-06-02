import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { vi } from 'vitest';
import { AuthContext, AuthGate, defaultAuthContext } from './AuthProvider';

describe('AuthGate', () => {
  it('renders the local app when cloud accounts are not configured', () => {
    render(
      <AuthContext.Provider value={defaultAuthContext}>
        <AuthGate>
          <div>Local app content</div>
        </AuthGate>
      </AuthContext.Provider>,
    );

    expect(screen.getByText('Local app content')).toBeInTheDocument();
  });

  it('shows the password recovery screen before the signed-in app', () => {
    render(
      <AuthContext.Provider
        value={{
          ...defaultAuthContext,
          isCloudConfigured: true,
          missingConfigKeys: [],
          status: 'passwordRecovery',
        }}
      >
        <AuthGate>
          <div>Signed-in app content</div>
        </AuthGate>
      </AuthContext.Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Set New Password' })).toBeInTheDocument();
    expect(screen.queryByText('Signed-in app content')).not.toBeInTheDocument();
  });

  it('renders the app for an active signed-in session without sending auth email', () => {
    const sendMagicLink = vi.fn(async () => undefined);

    render(
      <AuthContext.Provider
        value={{
          ...defaultAuthContext,
          isCloudConfigured: true,
          missingConfigKeys: [],
          status: 'signedIn',
          user: {
            id: 'user-1',
            email: 'active@example.com',
          } as User,
          profile: {
            id: 'user-1',
            email: 'active@example.com',
            displayName: 'Active User',
            timezone: 'Asia/Singapore',
            onboardingCompletedAt: '2026-06-01T00:00:00.000Z',
            weekStartsOn: 1,
          },
          sendMagicLink,
        }}
      >
        <AuthGate>
          <div>Signed-in app content</div>
        </AuthGate>
      </AuthContext.Provider>,
    );

    expect(screen.getByText('Signed-in app content')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
    expect(sendMagicLink).not.toHaveBeenCalled();
  });
});
