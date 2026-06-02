export interface SupabaseEnvironment {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  missingKeys: string[];
}

type EnvSource = {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SADHANA_FORCE_LOCAL?: string;
};

const normalizeEnvValue = (value: string | undefined): string => value?.trim() ?? '';

export function getSupabaseEnvironment(env: EnvSource = import.meta.env): SupabaseEnvironment {
  if (normalizeEnvValue(env.VITE_SADHANA_FORCE_LOCAL).toLowerCase() === 'true') {
    return {
      url: '',
      anonKey: '',
      isConfigured: false,
      missingKeys: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
    };
  }

  const url = normalizeEnvValue(env.VITE_SUPABASE_URL);
  const anonKey = normalizeEnvValue(env.VITE_SUPABASE_ANON_KEY);
  const requiredValues: Array<[string, string]> = [
    ['VITE_SUPABASE_URL', url],
    ['VITE_SUPABASE_ANON_KEY', anonKey],
  ];
  const missingKeys = requiredValues
    .filter(([, value]) => value.length === 0)
    .map(([key]) => key);

  return {
    url,
    anonKey,
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
}
