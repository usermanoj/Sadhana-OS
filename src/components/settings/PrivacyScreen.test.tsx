import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import {
  AuthContext,
  defaultAuthContext,
  type AuthContextValue,
} from '../../auth/AuthProvider';
import PrivacyScreen from './PrivacyScreen';

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
};

describe('PrivacyScreen', () => {
  it('shows local-only deletion copy when cloud accounts are not configured', () => {
    render(<PrivacyScreen />);

    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export JSON Backup' })).toBeInTheDocument();
    expect(screen.getByText('Cloud accounts are not configured in this environment.')).toBeInTheDocument();
  });

  it('shows cloud account deletion controls for signed-in users', () => {
    render(
      <AuthContext.Provider value={signedInAuthContext}>
        <PrivacyScreen />
      </AuthContext.Provider>,
    );

    expect(screen.getByLabelText('I understand this deletes my cloud account.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Account Deletion' })).toBeDisabled();
  });
});
