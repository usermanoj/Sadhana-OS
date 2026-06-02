import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnvironment } from './env';

let client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) {
    return client;
  }

  const env = getSupabaseEnvironment();
  if (!env.isConfigured) {
    client = null;
    return client;
  }

  client = createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return client;
}

export function resetSupabaseClientForTests(): void {
  client = undefined;
}
