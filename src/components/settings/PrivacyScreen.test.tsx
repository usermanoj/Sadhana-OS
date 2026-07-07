import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { vi } from 'vitest';
import {
  AuthContext,
  defaultAuthContext,
  type AuthContextValue,
} from '../../auth/AuthProvider';
import { ACCOUNT_DELETION_CONFIRMATION_PHRASE } from '../../lib/privacy';
import PrivacyScreen from './PrivacyScreen';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn<() => { client: string } | null>(() => ({ client: 'supabase' })),
  requestCloudAccountDeletion: vi.fn(async () => ({
    requestedAt: '2026-06-01T00:00:00.000Z',
  })),
  reportError: vi.fn(),
  trackEvent: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}));

vi.mock('../../lib/privacy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/privacy')>();

  return {
    ...actual,
    requestCloudAccountDeletion: mocks.requestCloudAccountDeletion,
  };
});

vi.mock('../../lib/observability', () => ({
  reportError: mocks.reportError,
  trackEvent: mocks.trackEvent,
}));

function createSignedInAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
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
    signOut: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderSignedInPrivacy(auth: AuthContextValue = createSignedInAuthContext()) {
  render(
    <AuthContext.Provider value={auth}>
      <PrivacyScreen />
    </AuthContext.Provider>,
  );

  return auth;
}

describe('PrivacyScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseClient.mockReturnValue({ client: 'supabase' });
    mocks.requestCloudAccountDeletion.mockResolvedValue({
      requestedAt: '2026-06-01T00:00:00.000Z',
    });
  });

  it('shows local-only deletion copy when cloud accounts are not configured', () => {
    render(<PrivacyScreen />);

    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export JSON Backup' })).toBeInTheDocument();
    expect(screen.getByText('Cloud accounts are not configured in this environment.')).toBeInTheDocument();
  });

  it('shows cloud account deletion controls for signed-in users', () => {
    renderSignedInPrivacy();

    expect(screen.getByText(/Export a backup before account deletion/i)).toBeInTheDocument();
    expect(screen.getByText(/retention windows may still apply/i)).toBeInTheDocument();
    expect(screen.getByLabelText('I have exported a backup, or I intentionally want to continue without one.')).toBeInTheDocument();
    expect(screen.getByLabelText(`Type ${ACCOUNT_DELETION_CONFIRMATION_PHRASE} to confirm`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Account Deletion' })).toBeDisabled();
  });

  it('requires backup acknowledgement and exact typed confirmation before deletion', () => {
    renderSignedInPrivacy();

    const checkbox = screen.getByLabelText('I have exported a backup, or I intentionally want to continue without one.');
    const confirmation = screen.getByLabelText(`Type ${ACCOUNT_DELETION_CONFIRMATION_PHRASE} to confirm`);
    const button = screen.getByRole('button', { name: 'Request Account Deletion' });

    fireEvent.change(confirmation, { target: { value: ACCOUNT_DELETION_CONFIRMATION_PHRASE } });
    expect(button).toBeDisabled();

    fireEvent.change(confirmation, { target: { value: 'delete my account' } });
    fireEvent.click(checkbox);
    expect(button).toBeDisabled();

    fireEvent.change(confirmation, { target: { value: ACCOUNT_DELETION_CONFIRMATION_PHRASE } });
    expect(button).toBeEnabled();
  });

  it('requests deletion through the cloud function and signs out after explicit confirmation', async () => {
    const auth = renderSignedInPrivacy();

    fireEvent.click(screen.getByLabelText('I have exported a backup, or I intentionally want to continue without one.'));
    fireEvent.change(screen.getByLabelText(`Type ${ACCOUNT_DELETION_CONFIRMATION_PHRASE} to confirm`), {
      target: { value: ACCOUNT_DELETION_CONFIRMATION_PHRASE },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Request Account Deletion' }));

    await waitFor(() => {
      expect(mocks.requestCloudAccountDeletion).toHaveBeenCalledWith({ client: 'supabase' });
    });
    expect(mocks.trackEvent).toHaveBeenCalledWith('account_deletion_requested');
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('status')).toHaveTextContent('Account deletion requested');
  });

  it('shows a safe error when cloud deletion is unavailable', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);
    renderSignedInPrivacy();

    fireEvent.click(screen.getByLabelText('I have exported a backup, or I intentionally want to continue without one.'));
    fireEvent.change(screen.getByLabelText(`Type ${ACCOUNT_DELETION_CONFIRMATION_PHRASE} to confirm`), {
      target: { value: ACCOUNT_DELETION_CONFIRMATION_PHRASE },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Request Account Deletion' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Cloud account deletion is not configured.');
    expect(mocks.requestCloudAccountDeletion).not.toHaveBeenCalled();
  });
});
