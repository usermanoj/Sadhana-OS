import { getFriendlyAuthError } from './authErrors';

describe('getFriendlyAuthError', () => {
  it('maps email rate limit errors to calm user-facing copy', () => {
    expect(getFriendlyAuthError(new Error('email rate limit exceeded'))).toBe(
      'Too many sign-in emails were requested. Please wait a few minutes, or use Google / password login.',
    );
  });

  it('maps disabled Google provider errors to password fallback copy', () => {
    expect(getFriendlyAuthError(new Error('provider google is not enabled'))).toBe(
      'Google sign-in is not configured yet. Use email and password for now.',
    );
  });

  it('maps invalid credentials without exposing account existence', () => {
    expect(getFriendlyAuthError(new Error('Invalid login credentials'))).toBe(
      'The email or password did not match.',
    );
  });

  it('maps unconfirmed email errors', () => {
    expect(getFriendlyAuthError(new Error('Email not confirmed'))).toBe(
      'Please confirm your email before signing in.',
    );
  });

  it('uses a safe fallback for unknown errors', () => {
    expect(getFriendlyAuthError(new Error('Something internal'))).toBe(
      'Sign-in failed. Please try again.',
    );
  });
});
