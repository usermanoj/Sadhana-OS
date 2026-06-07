# Task 030 - Staging Environment Setup Guide And Manual Execution Support

Status: Implemented

Date: 2026-06-07

## Goal

Create a practical, step-by-step staging setup guide and local validation support so Sadhana OS can be deployed and tested against a separate staging Supabase project before production launch.

## Scope

Implemented:

- Added a staging setup runbook with Supabase, hosting, environment variable, auth, migration, and validation steps.
- Added a staging environment example file with placeholders only.
- Added a safe staging environment validation script.
- Added an npm script for running the staging env validation.
- Documented what manual inputs are required from the owner.
- Documented staging acceptance criteria.

## Non-Goals

- Do not create external hosting resources from code.
- Do not create a Supabase staging project from code.
- Do not configure Google Cloud, Supabase Auth, custom SMTP, or DNS from code.
- Do not add secrets.
- Do not change app runtime behavior.
- Do not change Supabase schema or RLS policies.
- Do not change auth, cloud sync, migration, export, or import behavior.
- Do not add dependencies.

## Files

Created:

```text
.env.staging.example
docs/31-staging-environment-setup-guide.md
scripts/validate-staging-env.mjs
tasks/030-staging-environment-setup-guide.md
```

Modified:

```text
docs/30-staging-environment-deployment-readiness.md
package.json
```

## Acceptance Criteria

- [x] Staging setup guide exists.
- [x] Guide includes Supabase staging project setup.
- [x] Guide includes hosting setup recommendation.
- [x] Guide includes environment variable setup.
- [x] Guide includes Supabase Auth redirect setup.
- [x] Guide includes migration application steps.
- [x] Guide includes validation commands.
- [x] Guide includes manual owner inputs.
- [x] Staging env example uses placeholders only.
- [x] Validation script does not print secrets.
- [x] Validation script rejects obvious staging foot-guns.
- [x] No app behavior changes are introduced.
- [x] No schema or RLS changes are introduced.
- [x] Typecheck passes.
- [x] Unit/integration tests pass.
- [x] Production build passes.
- [x] E2E tests pass.

## Verification

Run:

```bash
node scripts/validate-staging-env.mjs --help
npm run validate:staging-env
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run validate:staging-env` requires staging environment variables. Use placeholders only in committed files.

## Manual Execution Required

The owner still needs to perform the external setup:

- Create the staging Supabase project.
- Choose the staging app URL.
- Choose and configure the hosting provider.
- Add environment variables in the hosting provider.
- Apply migrations to the staging Supabase project.
- Configure Supabase Auth Site URL and redirect URLs.
- Create staging test users.
- Run live RLS validation.
- Run browser validation against staging.

Recommended default:

```text
Hosting: Vercel
Staging Supabase project: sadhana-os-staging
Staging URL: Vercel deployment URL first, custom staging subdomain later
```
