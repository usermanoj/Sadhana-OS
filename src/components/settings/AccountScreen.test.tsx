import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { vi } from 'vitest';
import {
  AuthContext,
  defaultAuthContext,
  type AuthContextValue,
} from '../../auth/AuthProvider';
import {
  CloudSyncContext,
  type CloudSyncContextValue,
} from '../../cloud/CloudSyncProvider';
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

const syncedCloudContext: CloudSyncContextValue = {
  status: 'synced',
  message: null,
  lastSyncedAt: '2026-06-03T00:00:00.000Z',
  lastErrorAt: null,
  pendingWrites: 0,
  canRetry: false,
  retry: vi.fn(async () => undefined),
  refreshFromCloud: vi.fn(async () => undefined),
};

function renderSignedInAccount(syncOverrides: Partial<CloudSyncContextValue> = {}) {
  const sync = {
    ...syncedCloudContext,
    ...syncOverrides,
  };

  render(
    <AuthContext.Provider value={signedInAuthContext}>
      <CloudSyncContext.Provider value={sync}>
        <AccountScreen />
      </CloudSyncContext.Provider>
    </AuthContext.Provider>,
  );

  return sync;
}

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
    renderSignedInAccount();

    expect(screen.getByText('Mira')).toBeInTheDocument();
    expect(screen.getByText('practitioner@example.com')).toBeInTheDocument();
    expect(screen.getByText('Asia/Singapore')).toBeInTheDocument();
    expect(screen.getByText('Synced')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('shows failed cloud sync details and retry action for signed-in users', () => {
    const retry = vi.fn(async () => undefined);

    renderSignedInAccount({
      status: 'failed',
      message: 'A recent change was saved on this device but did not reach cloud storage.',
      lastSyncedAt: null,
      lastErrorAt: '2026-06-03T00:01:00.000Z',
      canRetry: true,
      retry,
    });

    expect(screen.getByRole('alert', { name: 'Cloud sync' })).toHaveTextContent('Sync failed');
    expect(screen.getByText(/did not reach cloud storage/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry cloud sync' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('shows queued cloud sync details for signed-in users', () => {
    renderSignedInAccount({
      status: 'queued',
      message: 'Unsynced changes are queued and will replay when cloud sync is available.',
      pendingWrites: 1,
      canRetry: true,
    });

    expect(screen.getByRole('alert', { name: 'Cloud sync' })).toHaveTextContent(
      'Unsynced changes pending',
    );
    expect(screen.getByText('1 pending change')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry cloud sync' })).toBeInTheDocument();
  });

  it('shows conflict cloud sync details for signed-in users', () => {
    renderSignedInAccount({
      status: 'conflict',
      message: 'Cloud data changed on another device. Your local changes remain queued and will not overwrite newer cloud data.',
      pendingWrites: 1,
      canRetry: false,
    });

    expect(screen.getByRole('alert', { name: 'Cloud sync' })).toHaveTextContent(
      'Cloud changes need review',
    );
    expect(screen.getByText(/will not overwrite newer cloud data/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry cloud sync' })).not.toBeInTheDocument();
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
