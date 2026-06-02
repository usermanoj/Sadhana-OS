import { getSupabaseEnvironment } from './env';

describe('getSupabaseEnvironment', () => {
  it('marks Supabase as unconfigured when keys are missing', () => {
    const env = getSupabaseEnvironment({});

    expect(env.isConfigured).toBe(false);
    expect(env.missingKeys).toEqual(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
  });

  it('trims configured values', () => {
    const env = getSupabaseEnvironment({
      VITE_SUPABASE_URL: ' https://example.supabase.co ',
      VITE_SUPABASE_ANON_KEY: ' anon-key ',
    });

    expect(env).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
      isConfigured: true,
      missingKeys: [],
    });
  });

  it('can force local-only mode for deterministic tests', () => {
    const env = getSupabaseEnvironment({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
      VITE_SADHANA_FORCE_LOCAL: 'true',
    });

    expect(env.isConfigured).toBe(false);
    expect(env.url).toBe('');
    expect(env.anonKey).toBe('');
  });
});
