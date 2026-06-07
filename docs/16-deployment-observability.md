# 16 - Deployment And Observability

## Purpose

This document defines v0.2 deployment, CI, monitoring, and privacy-safe observability expectations.

## Deployment Targets

Recommended web hosting:

- Vercel
- Netlify
- Cloudflare Pages

Recommended backend:

- Separate Supabase projects for development, staging, and production.

## Required Environment Variables

Frontend:

```text
VITE_SADHANA_APP_ENV
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Allowed `VITE_SADHANA_APP_ENV` values:

```text
local
development
staging
production
```

Non-production values show a small in-app environment badge. Production does not show the badge.

Supabase Edge Functions:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## CI Requirements

Every pull request should run:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The Playwright job installs Chromium before E2E tests.

## Database Deployment

Apply migrations in order:

```text
supabase/migrations/20260601000000_initial_schema.sql
supabase/migrations/20260603000000_add_sync_mutations.sql
```

Before production launch:

- Apply migrations to staging.
- Verify RLS policies with separate test users.
- Verify account deletion Edge Function in staging.
- Verify localStorage migration against staging.

## Observability Foundation

The app includes a small privacy-safe instrumentation layer in `src/lib/observability.ts`.

Allowed events:

- `sign_in_succeeded`
- `onboarding_completed`
- `local_migration_started`
- `local_migration_succeeded`
- `local_migration_failed`
- `sync_error_seen`
- `export_json_started`
- `account_deletion_requested`

Private content must never be sent:

- Journal content.
- Habit names.
- Category names.
- Practice values.
- Reflections, gratitude, insights, triggers, or lessons.

## Future Vendor Integration

Sentry, PostHog, or another provider can be added later behind the observability layer.

Do not add a vendor SDK until:

- Privacy policy copy is ready.
- Data retention is reviewed.
- Event payloads are audited.
- User consent requirements are understood for target launch regions.
