# Task 029 - Staging Environment And Deployment Readiness

Status: Implemented

Date: 2026-06-07

## Goal

Create the foundation for separating local development, staging, and production so Sadhana OS can be tested in a production-like environment before real customer launch.

## Scope

Implemented:

- Documented the local, staging, and production environment model.
- Documented required frontend environment variables per environment.
- Documented Supabase project separation requirements.
- Documented staging deployment checklist and manual dashboard settings.
- Added `VITE_SADHANA_APP_ENV` to the environment contract.
- Added a typed runtime environment helper.
- Added a small non-production environment badge.
- Added tests for environment detection and badge visibility.

## Non-Goals

- Do not create or deploy a staging site from this task.
- Do not create a Supabase staging project from this task.
- Do not configure production SMTP.
- Do not configure Google OAuth dashboard settings.
- Do not add Apple OAuth.
- Do not change Supabase schema or RLS policies.
- Do not change auth, cloud sync, migration, export, or import behavior.
- Do not add deployment secrets.
- Do not add production dependencies.

## Files

Created:

```text
docs/30-staging-environment-deployment-readiness.md
src/components/layout/EnvironmentBadge.tsx
src/components/layout/EnvironmentBadge.test.tsx
tasks/029-staging-environment-deployment-readiness.md
```

Modified:

```text
.env.example
docs/16-deployment-observability.md
src/components/layout/AppShell.tsx
src/lib/env.ts
src/lib/env.test.ts
```

## Environment Contract

Frontend builds should set:

```text
VITE_SADHANA_APP_ENV=local | development | staging | production
VITE_SUPABASE_URL=<environment-specific Supabase URL>
VITE_SUPABASE_ANON_KEY=<environment-specific Supabase anon or publishable key>
```

`VITE_SADHANA_FORCE_LOCAL=true` remains available only for deterministic local and Playwright testing.

## Acceptance Criteria

- [x] Environment separation is documented.
- [x] Deployment readiness checklist is documented.
- [x] Staging Supabase setup requirements are documented.
- [x] Runtime environment helper exists and is typed.
- [x] Non-production builds can show an environment badge.
- [x] Production builds do not show the environment badge.
- [x] No secrets are committed.
- [x] No schema, RLS, auth provider, migration, export, or import behavior changes are introduced.
- [x] Typecheck passes.
- [x] Unit/integration tests pass.
- [x] Production build passes.
- [x] E2E tests pass.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Manual validation:

- Run the app locally and confirm a small `Local` badge is visible.
- Deploy staging with `VITE_SADHANA_APP_ENV=staging` and confirm a small `Staging` badge is visible.
- Deploy production with `VITE_SADHANA_APP_ENV=production` and confirm no environment badge is visible.

## Remaining Manual Inputs

The owner still needs to choose and configure:

- Hosting provider: Vercel, Netlify, or Cloudflare Pages.
- Staging domain or preview URL.
- Staging Supabase project.
- Production Supabase project.
- Google OAuth dashboard entries for staging and production.
- SMTP provider and sending domain before public launch.
