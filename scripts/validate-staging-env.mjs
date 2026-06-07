#!/usr/bin/env node

const usage = `Sadhana OS staging environment validation

Required environment variables:
  VITE_SADHANA_APP_ENV=staging
  VITE_SUPABASE_URL=https://<staging-project-ref>.supabase.co
  VITE_SUPABASE_ANON_KEY=<staging anon or publishable key>

Optional manual checklist variables:
  SADHANA_STAGING_SITE_URL=https://<staging-app-url>
  SADHANA_STAGING_REDIRECT_URLS=https://<staging-app-url>,https://<staging-app-url>/

PowerShell example:
  $env:VITE_SADHANA_APP_ENV="staging"
  $env:VITE_SUPABASE_URL="https://<staging-project-ref>.supabase.co"
  $env:VITE_SUPABASE_ANON_KEY="<anon-or-publishable-key>"
  $env:SADHANA_STAGING_SITE_URL="https://staging.sadhanaos.com"
  npm run validate:staging-env

Notes:
  - This script validates configuration shape only.
  - It does not contact Supabase.
  - It never prints the Supabase key value.
  - It must not be run with frontend service-role variables.
`;

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(usage);
  process.exit(0);
}

const checks = [];

function pass(name, detail = '') {
  checks.push({ status: 'pass', name, detail });
  console.log(`PASS ${name}${detail ? ` - ${detail}` : ''}`);
}

function warn(name, detail) {
  checks.push({ status: 'warn', name, detail });
  console.warn(`WARN ${name} - ${detail}`);
}

function fail(name, detail) {
  checks.push({ status: 'fail', name, detail });
  console.error(`FAIL ${name} - ${detail}`);
}

function value(key) {
  return process.env[key]?.trim() ?? '';
}

function parseUrl(rawValue) {
  try {
    return new URL(rawValue);
  } catch {
    return null;
  }
}

function isPlaceholder(rawValue) {
  const lower = rawValue.toLowerCase();
  return (
    lower.includes('<') ||
    lower.includes('>') ||
    lower.includes('your-') ||
    lower.includes('example') ||
    lower.includes('placeholder')
  );
}

const appEnv = value('VITE_SADHANA_APP_ENV');
const supabaseUrl = value('VITE_SUPABASE_URL');
const supabaseAnonKey = value('VITE_SUPABASE_ANON_KEY');
const stagingSiteUrl = value('SADHANA_STAGING_SITE_URL');
const redirectUrls = value('SADHANA_STAGING_REDIRECT_URLS');
const forceLocal = value('VITE_SADHANA_FORCE_LOCAL').toLowerCase();

console.log('Validating Sadhana OS staging environment.');
console.log('');

if (!appEnv) {
  fail('VITE_SADHANA_APP_ENV is set', 'Expected staging.');
} else if (appEnv !== 'staging') {
  fail('VITE_SADHANA_APP_ENV is staging', `Received ${appEnv}.`);
} else {
  pass('VITE_SADHANA_APP_ENV is staging');
}

if (forceLocal === 'true') {
  fail('VITE_SADHANA_FORCE_LOCAL is disabled', 'Do not force local-only mode in staging.');
} else {
  pass('VITE_SADHANA_FORCE_LOCAL is not enabled');
}

if (!supabaseUrl) {
  fail('VITE_SUPABASE_URL is set', 'Expected the staging Supabase project URL.');
} else if (isPlaceholder(supabaseUrl)) {
  fail('VITE_SUPABASE_URL is not a placeholder', 'Replace the placeholder with the staging project URL.');
} else {
  const parsed = parseUrl(supabaseUrl);
  if (!parsed) {
    fail('VITE_SUPABASE_URL is valid', 'Expected a valid URL.');
  } else {
    if (parsed.protocol !== 'https:') {
      fail('VITE_SUPABASE_URL uses HTTPS', `Received protocol ${parsed.protocol}.`);
    } else {
      pass('VITE_SUPABASE_URL uses HTTPS');
    }

    if (!parsed.hostname.endsWith('.supabase.co')) {
      warn('VITE_SUPABASE_URL host looks unusual', 'Expected a hosted Supabase project ending in .supabase.co.');
    } else {
      pass('VITE_SUPABASE_URL looks like a hosted Supabase project');
    }
  }
}

if (!supabaseAnonKey) {
  fail('VITE_SUPABASE_ANON_KEY is set', 'Expected the staging anon or publishable key.');
} else if (isPlaceholder(supabaseAnonKey)) {
  fail('VITE_SUPABASE_ANON_KEY is not a placeholder', 'Replace the placeholder with the staging key.');
} else if (supabaseAnonKey.toLowerCase().includes('service_role')) {
  fail('VITE_SUPABASE_ANON_KEY is not a service-role key', 'Use only the anon or publishable key in the browser.');
} else if (supabaseAnonKey.length < 20) {
  warn('VITE_SUPABASE_ANON_KEY length is short', 'Confirm this is the complete staging anon or publishable key.');
} else {
  pass('VITE_SUPABASE_ANON_KEY is present without printing it');
}

const frontendServiceRoleKeys = Object.keys(process.env).filter(
  (key) => key.startsWith('VITE_') && key.toLowerCase().includes('service_role'),
);
if (frontendServiceRoleKeys.length > 0) {
  fail(
    'No VITE service-role variables are present',
    `Remove ${frontendServiceRoleKeys.join(', ')} from frontend hosting settings.`,
  );
} else {
  pass('No VITE service-role variables are present');
}

if (!stagingSiteUrl) {
  warn('SADHANA_STAGING_SITE_URL is set', 'Optional but recommended for manual redirect checklist validation.');
} else {
  const parsed = parseUrl(stagingSiteUrl);
  if (!parsed) {
    fail('SADHANA_STAGING_SITE_URL is valid', 'Expected a valid staging app URL.');
  } else if (parsed.protocol !== 'https:') {
    fail('SADHANA_STAGING_SITE_URL uses HTTPS', `Received protocol ${parsed.protocol}.`);
  } else {
    pass('SADHANA_STAGING_SITE_URL uses HTTPS', parsed.origin);
  }
}

if (!redirectUrls) {
  warn('SADHANA_STAGING_REDIRECT_URLS is set', 'Optional; verify redirect URLs manually in Supabase Auth settings.');
} else {
  const redirects = redirectUrls
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (redirects.length === 0) {
    warn('SADHANA_STAGING_REDIRECT_URLS has entries', 'No usable redirect URLs found.');
  } else {
    redirects.forEach((redirect) => {
      const parsed = parseUrl(redirect);
      if (!parsed) {
        fail('Staging redirect URL is valid', redirect);
      } else if (parsed.protocol !== 'https:') {
        fail('Staging redirect URL uses HTTPS', redirect);
      }
    });

    if (stagingSiteUrl) {
      const required = [stagingSiteUrl.replace(/\/$/, ''), `${stagingSiteUrl.replace(/\/$/, '')}/`];
      const missing = required.filter((requiredUrl) => !redirects.includes(requiredUrl));
      if (missing.length > 0) {
        warn('Redirect URLs include staging site with and without trailing slash', `Missing ${missing.join(', ')}`);
      } else {
        pass('Redirect URLs include staging site with and without trailing slash');
      }
    }
  }
}

const failed = checks.filter((check) => check.status === 'fail');
const warnings = checks.filter((check) => check.status === 'warn');

console.log('');
console.log(`Completed ${checks.filter((check) => check.status === 'pass').length} passing checks.`);
if (warnings.length > 0) {
  console.log(`${warnings.length} warning(s) recorded. Review them before deploying staging.`);
}

if (failed.length > 0) {
  console.error(`${failed.length} failing check(s). Staging environment is not ready.`);
  process.exit(1);
}

console.log('Staging environment shape looks ready.');
