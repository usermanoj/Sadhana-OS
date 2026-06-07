# 30 - Staging Environment And Deployment Readiness

Date: 2026-06-07

Purpose: define the environment and deployment readiness model for moving Sadhana OS from local development toward a production-grade premium B2C application.

This document does not mark the app production-ready. It creates the environment contract and checklist required before staging and production validation.

## Recommendation

Use three separate runtime environments:

| Environment | Purpose | Supabase Project | User Data |
| --- | --- | --- | --- |
| Local | Developer work and Playwright tests | Development project or forced local mode | Disposable test data |
| Staging | Production-like validation before launch | Separate staging project | Test-only staging data |
| Production | Real customer usage | Separate production project | Real customer data |

Do not share the same Supabase project across staging and production.

## Hosting Recommendation

Use one static hosting provider for the Vite app:

| Provider | Fit |
| --- | --- |
| Vercel | Strong default for fast staging/production setup and preview deployments |
| Netlify | Strong static hosting and form/deployment ergonomics |
| Cloudflare Pages | Strong global edge hosting and cost profile |

Recommended default: Vercel for the first staging deployment because it is simple, fast, and works well for a Vite React app.

No hosting provider is configured by this task.

## Frontend Environment Variables

Every deployed frontend environment should set:

```text
VITE_SADHANA_APP_ENV=local | development | staging | production
VITE_SUPABASE_URL=<environment-specific Supabase URL>
VITE_SUPABASE_ANON_KEY=<environment-specific Supabase anon or publishable key>
```

Local deterministic tests may also set:

```text
VITE_SADHANA_FORCE_LOCAL=true
```

Do not set `VITE_SADHANA_FORCE_LOCAL=true` in staging or production.

Never expose the Supabase service-role key to the browser.

## Runtime Environment Badge

The app shows a small environment badge in non-production environments:

- `Local`
- `Development`
- `Staging`

Production intentionally shows no badge.

This is a safety affordance. It helps avoid confusing staging and production while keeping the real customer app visually clean.

## Supabase Project Separation

Create separate Supabase projects for:

```text
sadhana-os-dev
sadhana-os-staging
sadhana-os-production
```

Recommended rules:

- Apply the same committed migrations to each project in order.
- Use separate Auth users per environment.
- Use separate Google OAuth redirect configuration per environment.
- Use separate SMTP credentials per environment when SMTP is configured.
- Never copy production customer data into local or staging.
- Never use the service-role key in frontend environment variables.

## Migration Application

Apply migrations in order:

```text
supabase/migrations/20260601000000_initial_schema.sql
supabase/migrations/20260603000000_add_sync_mutations.sql
```

After applying migrations, run live RLS validation against staging using normal test users and the anon or publishable key.

## Staging Auth Settings

In Supabase staging Auth settings:

- Enable email provider.
- Enable email/password signup.
- Configure Google OAuth if staging Google login will be tested.
- Keep magic link as fallback only.
- Configure staging Site URL to the staging app URL.
- Add staging redirect URLs.
- Add local redirect URLs only if the staging Supabase project is intentionally used for local development.

Example staging redirect URLs:

```text
https://staging.sadhanaos.com
https://staging.sadhanaos.com/
```

Local development redirect URLs:

```text
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
http://127.0.0.1:5173/
```

## Staging Deployment Checklist

Before calling staging ready:

- Create a separate Supabase staging project.
- Apply all committed migrations.
- Configure staging environment variables in the hosting provider.
- Configure Supabase Auth Site URL and redirect URLs.
- Configure Google OAuth for staging, if used.
- Run `npm run typecheck`.
- Run `npm test`.
- Run `npm run build`.
- Run `npm run test:e2e`.
- Run `npm run validate:cloud-rls` against staging with two staging-only test users.
- Run live browser validation with two fresh staging users.
- Confirm starter categories and habits persist to Supabase for new users.
- Confirm User A data is not visible to User B.
- Confirm sign out and sign in do not leak user-scoped local cache.
- Confirm local migration prompt behavior remains correct.
- Confirm JSON export/import still works.
- Confirm mobile layout remains usable.
- Confirm no secrets are committed.

## Production Gate

Before production launch:

- Create a separate Supabase production project.
- Apply migrations to production.
- Configure production Site URL and redirect URLs.
- Configure custom SMTP.
- Verify sending domain, SPF, DKIM, and DMARC.
- Validate Google OAuth in production.
- Validate password reset in production.
- Validate account deletion in staging before enabling for real users.
- Add production error monitoring.
- Add privacy-safe analytics only after event payload review.
- Complete privacy, retention, and support documentation.

## Manual Decisions Needed

The product owner still needs to choose:

- Hosting provider.
- Staging URL.
- Production domain.
- SMTP provider.
- Google OAuth project structure.
- Whether staging uses a branded subdomain or provider preview URL.

Recommended first choice:

```text
Hosting: Vercel
Staging URL: staging.sadhanaos.com, or a Vercel staging deployment URL temporarily
SMTP: Postmark for production, Resend acceptable for early staging
```

## Acceptance Criteria

Task 029 is complete when:

- The environment contract is documented.
- The runtime environment badge exists for non-production environments.
- Production hides the environment badge.
- `.env.example` includes the app environment variable.
- Staging setup and validation steps are documented.
- No secrets or production credentials are committed.
- No Supabase schema or RLS changes are introduced.
- Typecheck, tests, build, and E2E pass.
