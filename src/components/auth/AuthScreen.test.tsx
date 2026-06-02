import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import {
  AuthContext,
  defaultAuthContext,
  type AuthContextValue,
} from '../../auth/AuthProvider';
import AuthScreen from './AuthScreen';

function createAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    ...defaultAuthContext,
    isCloudConfigured: true,
    missingConfigKeys: [],
    status: 'signedOut',
    signInWithProvider: vi.fn(async () => undefined),
    signInWithPassword: vi.fn(async () => undefined),
    signUpWithPassword: vi.fn(async () => undefined),
    sendMagicLink: vi.fn(async () => undefined),
    sendPasswordReset: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderAuthScreen(auth = createAuthContext()): AuthContextValue {
  render(
    <AuthContext.Provider value={auth}>
      <AuthScreen />
    </AuthContext.Provider>,
  );

  return auth;
}

describe('AuthScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('presents provider and password sign-in before magic link fallback', () => {
    renderAuthScreen();

    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Sign In' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Send Magic Link' })).not.toBeInTheDocument();
  });

  it('starts Google OAuth from the primary provider action', async () => {
    const auth = renderAuthScreen();

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => {
      expect(auth.signInWithProvider).toHaveBeenCalledWith('google');
    });
  });

  it('shows a clear fallback message when Google OAuth is not configured', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderAuthScreen(
      createAuthContext({
        signInWithProvider: vi.fn(async () => {
          throw new Error('provider google is not enabled');
        }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Google sign-in is not configured yet. Use email and password for now.',
      );
    });
  });

  it('signs in with email and password without sending a magic link', async () => {
    const auth = renderAuthScreen();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'practitioner@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'clear-mind-108' },
    });
    const signInButtons = screen.getAllByRole('button', { name: 'Sign In' });
    fireEvent.click(signInButtons[signInButtons.length - 1]!);

    await waitFor(() => {
      expect(auth.signInWithPassword).toHaveBeenCalledWith(
        'practitioner@example.com',
        'clear-mind-108',
      );
    });
    expect(auth.sendMagicLink).not.toHaveBeenCalled();
  });

  it('validates email format before password sign-in', () => {
    const auth = renderAuthScreen();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'clear-mind-108' },
    });
    const signInButtons = screen.getAllByRole('button', { name: 'Sign In' });
    fireEvent.click(signInButtons[signInButtons.length - 1]!);

    expect(screen.getByRole('status')).toHaveTextContent('Enter a valid email address.');
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('creates an email/password account and asks for email confirmation', async () => {
    const auth = renderAuthScreen();

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new-practitioner@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'steady-practice-108' },
    });
    const createAccountButtons = screen.getAllByRole('button', { name: 'Create Account' });
    fireEvent.click(createAccountButtons[createAccountButtons.length - 1]!);

    await waitFor(() => {
      expect(auth.signUpWithPassword).toHaveBeenCalledWith(
        'new-practitioner@example.com',
        'steady-practice-108',
      );
    });
    expect(screen.getByRole('status')).toHaveTextContent('Check your email to confirm your account.');
  });

  it('keeps magic link as a fallback with client-side cooldown', async () => {
    const auth = renderAuthScreen();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'link@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use magic link instead' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send Magic Link' }));

    await waitFor(() => {
      expect(auth.sendMagicLink).toHaveBeenCalledWith('link@example.com');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Check your email for the sign-in link.');
    expect(screen.getByRole('button', { name: /Wait \d+s/ })).toBeDisabled();
  });

  it('sends a password reset email from the forgot password panel', async () => {
    const auth = renderAuthScreen();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'reset@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(auth.sendPasswordReset).toHaveBeenCalledWith('reset@example.com');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Check your email for the password reset link.');
  });

  it('shows a friendly rate-limit error for email fallback failures', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const auth = renderAuthScreen(
      createAuthContext({
        sendMagicLink: vi.fn(async () => {
          throw new Error('email rate limit exceeded');
        }),
      }),
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'busy@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use magic link instead' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send Magic Link' }));

    await waitFor(() => {
      expect(auth.sendMagicLink).toHaveBeenCalledWith('busy@example.com');
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Too many sign-in emails were requested. Please wait a few minutes, or use Google / password login.',
    );
  });
});
