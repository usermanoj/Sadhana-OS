import { getSadhanaEnvironment, getSupabaseEnvironment } from './env';

describe('getSadhanaEnvironment', () => {
  it('defaults to local when no explicit app environment is provided', () => {
    const env = getSadhanaEnvironment({});

    expect(env).toEqual({
      name: 'local',
      label: 'Local',
      isProduction: false,
      showBadge: true,
    });
  });

  it('uses an explicit staging app environment', () => {
    const env = getSadhanaEnvironment({
      VITE_SADHANA_APP_ENV: ' staging ',
      MODE: 'production',
      PROD: true,
    });

    expect(env).toEqual({
      name: 'staging',
      label: 'Staging',
      isProduction: false,
      showBadge: true,
    });
  });

  it('hides the visible badge in production', () => {
    const env = getSadhanaEnvironment({
      VITE_SADHANA_APP_ENV: 'production',
    });

    expect(env.isProduction).toBe(true);
    expect(env.showBadge).toBe(false);
  });

  it('falls back to production for production-mode builds without an explicit app environment', () => {
    const env = getSadhanaEnvironment({
      MODE: 'production',
    });

    expect(env.name).toBe('production');
    expect(env.showBadge).toBe(false);
  });

  it('treats unknown app environment values as local unless the build is production', () => {
    const env = getSadhanaEnvironment({
      VITE_SADHANA_APP_ENV: 'qa',
    });

    expect(env.name).toBe('local');
    expect(env.showBadge).toBe(true);
  });
});

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
