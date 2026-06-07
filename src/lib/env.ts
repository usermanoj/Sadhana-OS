export interface SupabaseEnvironment {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  missingKeys: string[];
}

export type SadhanaRuntimeEnvironment = 'local' | 'development' | 'staging' | 'production';

export interface SadhanaEnvironment {
  name: SadhanaRuntimeEnvironment;
  label: string;
  isProduction: boolean;
  showBadge: boolean;
}

type EnvSource = {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SADHANA_FORCE_LOCAL?: string;
  readonly VITE_SADHANA_APP_ENV?: string;
  readonly MODE?: string;
  readonly PROD?: boolean;
};

const normalizeEnvValue = (value: string | undefined): string => value?.trim() ?? '';

const runtimeEnvironmentLabels: Record<SadhanaRuntimeEnvironment, string> = {
  local: 'Local',
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
};

const isRuntimeEnvironment = (value: string): value is SadhanaRuntimeEnvironment =>
  value === 'local' || value === 'development' || value === 'staging' || value === 'production';

export function getSadhanaEnvironment(env: EnvSource = import.meta.env): SadhanaEnvironment {
  const configuredEnvironment = normalizeEnvValue(env.VITE_SADHANA_APP_ENV).toLowerCase();
  let name: SadhanaRuntimeEnvironment;

  if (isRuntimeEnvironment(configuredEnvironment)) {
    name = configuredEnvironment;
  } else if (env.PROD === true || normalizeEnvValue(env.MODE).toLowerCase() === 'production') {
    name = 'production';
  } else {
    name = 'local';
  }

  return {
    name,
    label: runtimeEnvironmentLabels[name],
    isProduction: name === 'production',
    showBadge: name !== 'production',
  };
}

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
