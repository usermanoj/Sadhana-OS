import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';
import { signInWithOAuth } from './auth';

describe('auth helpers', () => {
  it('starts Google OAuth through Supabase with the current origin redirect', async () => {
    const signInWithOAuthMock = vi.fn(async () => ({ error: null }));
    const client = {
      auth: {
        signInWithOAuth: signInWithOAuthMock,
      },
    } as unknown as SupabaseClient;

    await signInWithOAuth(client, 'google');

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  });
});
