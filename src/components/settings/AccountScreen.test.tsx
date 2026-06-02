import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { vi } from 'vitest';
import {
  AuthContext,
  defaultAuthContext,
  type AuthContextValue,
} from '../../auth/AuthProvider';
import AccountScreen from './AccountScreen';

const signedInAuthContext: AuthContextValue = {
  ...defaultAuthContext,
  isCloudConfigured: true,
  missingConfigKeys: [],
  status: 'signedIn',
  user: {
    id: 'user-1',
    email: 'practitioner@example.com',
  } as User,
  profile: {
    id: 'user-1',
    email: 'practitioner@example.com',
    displayName: 'Mira',
    timezone: 'Asia/Singapore',
    onboardingCompletedAt: '2026-06-01T00:00:00.000Z',
    weekStartsOn: 1,
  },
  signOut: async () => undefined,
};

const createSignedOutAuthContext = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  ...defaultAuthContext,
  isCloudConfigured: true,
  missingConfigKeys: [],
  status: 'signedOut',
  sendMagicLink: vi.fn(async () => undefined),
  ...overrides,
});

describe('AccountScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows local-only account state when Supabase is not configured', () => {
    render(<AccountScreen />);

    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByText('Local-only mode')).toBeInTheDocument();
    expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeInTheDocument();
  });

  it('shows signed-in account details', () => {
    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <AccountScreen />
      </AuthContext.Provider>,
    );

    expect(screen.getByText('Mira')).toBeInTheDocument();
    expect(screen.getByText('practitioner@example.com')).toBeInTheDocument();
    expect(screen.getByText('Asia/Singapore')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('sends a magic link from the secondary account sign-in surface', async () => {
    const auth = createSignedOutAuthContext();

    render(
      <AuthContext.Provider value={auth}>
        <AccountScreen />
      </AuthContext.Provider>,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'account@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Sign-In Link' }));

    await waitFor(() => {
      expect(auth.sendMagicLink).toHaveBeenCalledWith('account@example.com');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Check your email for the sign-in link.');
    expect(screen.getByRole('button', { name: /Wait \d+s/ })).toBeDisabled();
  });

  it('shows a friendly message for account magic-link rate limits', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const auth = createSignedOutAuthContext({
      sendMagicLink: vi.fn(async () => {
        throw new Error('email rate limit exceeded');
      }),
    });

    render(
      <AuthContext.Provider value={auth}>
        <AccountScreen />
      </AuthContext.Provider>,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'account@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Sign-In Link' }));

    await waitFor(() => {
      expect(auth.sendMagicLink).toHaveBeenCalledWith('account@example.com');
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Too many sign-in emails were requested. Please wait a few minutes, or use Google / password login.',
    );
  });
});
