const readErrorText = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; code?: unknown };
    return [maybeError.code, maybeError.message]
      .filter((value): value is string => typeof value === 'string')
      .join(' ');
  }

  return '';
};

export function getFriendlyAuthError(error: unknown): string {
  const text = readErrorText(error).toLowerCase();

  if (text.includes('rate limit') || text.includes('too many')) {
    return 'Too many sign-in emails were requested. Please wait a few minutes, or use Google / password login.';
  }

  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'The email or password did not match.';
  }

  if (text.includes('email not confirmed') || text.includes('not confirmed')) {
    return 'Please confirm your email before signing in.';
  }

  if (text.includes('password') && text.includes('weak')) {
    return 'Use a stronger password before continuing.';
  }

  if (text.includes('network') || text.includes('fetch')) {
    return 'We could not reach the sign-in service. Please check your connection.';
  }

  if (text.includes('oauth') || text.includes('provider') || text.includes('google')) {
    return 'Google sign-in is not configured yet. Use email and password for now.';
  }

  return 'Sign-in failed. Please try again.';
}
