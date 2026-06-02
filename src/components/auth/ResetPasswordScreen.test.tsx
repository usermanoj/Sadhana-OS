import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import {
  AuthContext,
  defaultAuthContext,
  type AuthContextValue,
} from '../../auth/AuthProvider';
import ResetPasswordScreen from './ResetPasswordScreen';

function renderResetPasswordScreen(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  const auth: AuthContextValue = {
    ...defaultAuthContext,
    isCloudConfigured: true,
    missingConfigKeys: [],
    status: 'passwordRecovery',
    updatePassword: vi.fn(async () => undefined),
    ...overrides,
  };

  render(
    <AuthContext.Provider value={auth}>
      <ResetPasswordScreen />
    </AuthContext.Provider>,
  );

  return auth;
}

describe('ResetPasswordScreen', () => {
  it('requires a strong enough password before update', () => {
    const auth = renderResetPasswordScreen();

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(screen.getByRole('status')).toHaveTextContent('Use at least 8 characters.');
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('requires matching password confirmation', () => {
    const auth = renderResetPasswordScreen();

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'steady-practice-108' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'steady-practice-109' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(screen.getByRole('status')).toHaveTextContent('Passwords do not match.');
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('updates the password after successful recovery', async () => {
    const auth = renderResetPasswordScreen();

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'steady-practice-108' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'steady-practice-108' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    await waitFor(() => {
      expect(auth.updatePassword).toHaveBeenCalledWith('steady-practice-108');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Password updated.');
  });
});
