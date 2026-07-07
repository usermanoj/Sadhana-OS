#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const defaultOutputPath = 'docs/36-staging-deployment-verification-results.md';

const usage = `Create a Sadhana OS staging verification report template.

Usage:
  node scripts/create-staging-verification-report.mjs [options]

Options:
  --output <path>    Markdown output path. Defaults to ${defaultOutputPath}
  --status <value>   pending, pass, or fail. Defaults to pending.
  --force            Overwrite output file if it already exists.
  --dry-run          Print report to stdout instead of writing a file.
  --help             Show this help.

Optional environment metadata:
  SADHANA_STAGING_SITE_URL
  SADHANA_STAGING_SUPABASE_PROJECT
  SADHANA_STAGING_DEPLOYMENT_PROVIDER
  SADHANA_STAGING_BUILD_URL
  SADHANA_STAGING_VALIDATOR

This script never reads or prints Supabase keys, passwords, tokens, or service-role values.
`;

const allowedStatuses = new Set(['pending', 'pass', 'fail']);

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(usage);
  process.exit(0);
}

const options = parseArgs(process.argv.slice(2));
const report = createReport({
  status: options.status,
  siteUrl: safeUrl(process.env.SADHANA_STAGING_SITE_URL),
  supabaseProject: safeText(process.env.SADHANA_STAGING_SUPABASE_PROJECT),
  deploymentProvider: safeText(process.env.SADHANA_STAGING_DEPLOYMENT_PROVIDER),
  buildUrl: safeUrl(process.env.SADHANA_STAGING_BUILD_URL),
  validator: safeText(process.env.SADHANA_STAGING_VALIDATOR),
});

if (options.dryRun) {
  console.log(report);
  process.exit(0);
}

const outputPath = resolve(process.cwd(), options.output);

if (existsSync(outputPath) && !options.force) {
  console.error(`Report already exists: ${options.output}`);
  console.error('Use --force to overwrite it, or pass --output with a new path.');
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, report, 'utf8');
console.log(`Created staging verification report: ${options.output}`);

function parseArgs(args) {
  const parsed = {
    output: defaultOutputPath,
    status: 'pending',
    force: false,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--output') {
      parsed.output = requireValue(args, index, '--output');
      index += 1;
      continue;
    }

    if (arg === '--status') {
      const status = requireValue(args, index, '--status');
      if (!allowedStatuses.has(status)) {
        console.error(`Invalid --status value: ${status}`);
        process.exit(1);
      }
      parsed.status = status;
      index += 1;
      continue;
    }

    if (arg === '--force') {
      parsed.force = true;
      continue;
    }

    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    console.error(`Unknown option: ${arg}`);
    console.error('Run with --help for usage.');
    process.exit(1);
  }

  return parsed;
}

function requireValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${option}.`);
    process.exit(1);
  }
  return value;
}

function createReport({
  status,
  siteUrl,
  supabaseProject,
  deploymentProvider,
  buildUrl,
  validator,
}) {
  const now = new Date().toISOString();
  const statusLabel = {
    pending: 'Pending',
    pass: 'Pass',
    fail: 'Fail',
  }[status];

  return `# 36 - Staging Deployment Verification Results

Generated: ${now}

Overall status: ${statusLabel}

## Environment

| Field | Value |
| --- | --- |
| Staging app URL | ${siteUrl} |
| Supabase project | ${supabaseProject} |
| Deployment provider | ${deploymentProvider} |
| Build/deploy URL | ${buildUrl} |
| Validator | ${validator} |

Do not add Supabase keys, passwords, tokens, OAuth secrets, service-role keys, or real customer data to this file.

## Command Validation

| Check | Result | Notes |
| --- | --- | --- |
| \`npm run validate:staging-env\` | Pending | Run with staging public env values only |
| \`npm run lint\` | Pending | Required before staging sign-off |
| \`npm run typecheck\` | Pending | Required before staging sign-off |
| \`npm test\` | Pending | Required before staging sign-off |
| \`npm run build\` | Pending | Required before staging sign-off |
| \`npm run test:e2e\` | Pending | Required before staging sign-off |
| \`npm run validate:cloud-rls\` | Pending | Run against staging with two staging-only test users |

## Browser Validation Checklist

- [ ] Staging app loads over HTTPS.
- [ ] Non-production environment badge shows \`Staging\`.
- [ ] Email/password sign-up works for User A.
- [ ] User A completes onboarding.
- [ ] Starter categories and practices appear.
- [ ] User A creates a custom category.
- [ ] User A creates a custom practice.
- [ ] User A records a Today value.
- [ ] User A creates a journal entry.
- [ ] Refresh keeps User A data.
- [ ] Sign out works.
- [ ] User B signs up or signs in separately.
- [ ] User B does not see User A data.
- [ ] User B can create User B data.
- [ ] User A signs back in and sees only User A data.
- [ ] Settings > Data JSON export works.
- [ ] Settings > Data JSON import confirmation works with a safe test file.
- [ ] Settings > Privacy deletion safeguards are visible.
- [ ] Account deletion is validated with a disposable staging user only.
- [ ] Mobile viewport remains usable.

## Supabase Validation Checklist

- [ ] Staging project is separate from development and production.
- [ ] Committed migrations are applied.
- [ ] RLS is enabled on user-owned tables.
- [ ] Auth Site URL matches staging app URL.
- [ ] Redirect URLs include staging URL with and without trailing slash.
- [ ] Browser uses anon or publishable key only.
- [ ] No service-role key is exposed through frontend env vars.
- [ ] User A/User B rows use different \`user_id\` values.

## Issues Found

| Severity | Area | Issue | Follow-up |
| --- | --- | --- | --- |
| Pending | Pending | No staging execution recorded yet | Complete this report during staging validation |

## Sign-Off

| Role | Name | Date | Status |
| --- | --- | --- | --- |
| Product/QA | Pending | Pending | Pending |
| Engineering | Pending | Pending | Pending |
`;
}

function safeText(value) {
  const trimmed = value?.trim();
  if (!trimmed) return 'Pending';

  return redact(trimmed);
}

function safeUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return 'Pending';

  try {
    const url = new URL(trimmed);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return redact(url.toString());
  } catch {
    return redact(trimmed);
  }
}

function redact(value) {
  return value
    .replace(/\bservice[_-]?role\b/gi, '[redacted-service-role]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-token]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, 'Bearer [redacted-token]');
}
