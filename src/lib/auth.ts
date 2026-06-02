import type { Provider, Session, SupabaseClient, User } from '@supabase/supabase-js';

export type SupportedOAuthProvider = Extract<Provider, 'google'>;

export interface AuthProfile {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  onboardingCompletedAt: string | null;
  weekStartsOn: number;
}

export interface CompleteOnboardingInput {
  displayName?: string;
  timezone: string;
  weekStartsOn: number;
}

export const authRedirectTo = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.location.origin;
};

export const mapSessionUser = (session: Session | null): User | null => session?.user ?? null;

export async function signInWithMagicLink(
  client: SupabaseClient,
  email: string,
): Promise<void> {
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: authRedirectTo(),
    },
  });

  if (error) {
    throw error;
  }
}

export async function signInWithPassword(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<void> {
  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signUpWithPassword(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<void> {
  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authRedirectTo(),
    },
  });

  if (error) {
    throw error;
  }
}

export async function sendPasswordResetEmail(
  client: SupabaseClient,
  email: string,
): Promise<void> {
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: authRedirectTo(),
  });

  if (error) {
    throw error;
  }
}

export async function updateAccountPassword(
  client: SupabaseClient,
  password: string,
): Promise<void> {
  const { error } = await client.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}

export async function signInWithOAuth(
  client: SupabaseClient,
  provider: SupportedOAuthProvider,
): Promise<void> {
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: authRedirectTo(),
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut(client: SupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function fetchAuthProfile(
  client: SupabaseClient,
  user: User,
): Promise<AuthProfile> {
  const [{ data: profile, error: profileError }, { data: settings, error: settingsError }] =
    await Promise.all([
      client
        .from('profiles')
        .select('id, display_name, timezone, onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle(),
      client
        .from('user_settings')
        .select('week_starts_on')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  if (profileError) {
    throw profileError;
  }
  if (settingsError) {
    throw settingsError;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    displayName: profile?.display_name ?? '',
    timezone: profile?.timezone ?? 'UTC',
    onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
    weekStartsOn: settings?.week_starts_on ?? 1,
  };
}

export async function completeCloudOnboarding(
  client: SupabaseClient,
  userId: string,
  input: CompleteOnboardingInput,
): Promise<void> {
  const [{ error: profileError }, { error: settingsError }] = await Promise.all([
    client
      .from('profiles')
      .update({
        display_name: input.displayName?.trim() || null,
        timezone: input.timezone,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', userId),
    client
      .from('user_settings')
      .update({
        week_starts_on: input.weekStartsOn,
      })
      .eq('user_id', userId),
  ]);

  if (profileError) {
    throw profileError;
  }
  if (settingsError) {
    throw settingsError;
  }
}
