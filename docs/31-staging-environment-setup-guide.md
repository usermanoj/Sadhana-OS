# 31 - Staging Environment Setup Guide

Date: 2026-06-07

Purpose: provide the manual execution guide for creating and validating the first Sadhana OS staging environment.

This guide is for staging only. Do not use production customer data in staging.

After setup, run the verification checklist in:

```text
docs/35-staging-deployment-verification.md
```

## Recommended Outcome

At the end of this setup, Sadhana OS should have:

- A separate Supabase staging project.
- A staging web deployment.
- Staging-only frontend environment variables.
- Supabase Auth redirect URLs for staging.
- Committed migrations applied to staging.
- Live RLS validation passing against staging.
- Browser validation passing with two fresh staging users.

## Recommended Defaults

Use these unless you prefer a different hosting provider:

```text
Hosting provider: Vercel
Supabase project name: sadhana-os-staging
App environment: staging
Custom staging domain: defer until first staging deployment works
SMTP: defer until Task 028 production auth/email readiness
Google OAuth: configure after the basic staging deployment works
```

Vercel is the recommended first staging host because the app is a Vite React static application and Vercel gives a fast path to preview/staging deployments.

## Step 1 - Create Supabase Staging Project

In Supabase:

1. Open the Supabase Dashboard.
2. Select the same organization used for Sadhana OS.
3. Create a new project.
4. Use a clear project name:

```text
sadhana-os-staging
```

5. Choose a region close to the expected launch audience.
6. Save the database password in your password manager.
7. Wait for the project to finish provisioning.

Important:

- Do not reuse the development project as staging.
- Do not use the production project for staging tests.
- Do not put the database password or service-role key in the repository.

## Step 2 - Apply Database Migrations

Open the Supabase SQL editor for the staging project.

Apply the committed migrations in order:

```text
supabase/migrations/20260601000000_initial_schema.sql
supabase/migrations/20260603000000_add_sync_mutations.sql
```

Recommended manual method:

1. Open the first migration file locally.
2. Paste it into Supabase SQL Editor.
3. Run it.
4. Confirm success.
5. Repeat with the second migration file.

Expected result:

- Tables exist in `public`.
- RLS is enabled on user-owned tables.
- `sync_mutations` exists.
- Policies exist for user-owned access.

## Step 3 - Collect Staging Public Keys

In Supabase staging:

1. Go to Project Settings.
2. Open API Keys.
3. Copy the project URL.
4. Copy the anon or publishable key.

Use only these frontend-safe values:

```text
VITE_SUPABASE_URL=https://<staging-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

Never use:

```text
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_SERVICE_ROLE_KEY
```

## Step 4 - Choose Initial Staging URL

There are two good options:

| Option | Recommendation |
| --- | --- |
| Provider deployment URL | Best for first staging test |
| Custom subdomain, such as `staging.sadhanaos.com` | Best after first staging test passes |

Use the provider deployment URL first if you want to move quickly.

After the staging deployment is stable, add a branded staging domain.

## Step 5 - Configure Supabase Auth URLs

In Supabase staging:

1. Go to Authentication.
2. Open URL Configuration.
3. Set Site URL to the staging app URL.
4. Add redirect URLs.

For a Vercel staging URL, use the exact deployment URL shown by Vercel:

```text
https://<your-vercel-staging-url>
https://<your-vercel-staging-url>/
```

For a custom staging domain:

```text
https://staging.sadhanaos.com
https://staging.sadhanaos.com/
```

Local redirects are optional for staging. Add them only if you intentionally use the staging Supabase project from local development:

```text
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
http://127.0.0.1:5173/
```

## Step 6 - Configure Basic Staging Auth

In Supabase staging Authentication settings:

1. Enable Email provider.
2. Enable email/password signups.
3. Keep magic link available only as fallback.
4. Confirm email may remain off for early internal staging, but must be on before public launch.
5. Do not rely on Supabase default email delivery for production.

Google OAuth can be deferred until the basic email/password staging flow passes.

If configuring Google OAuth for staging:

1. Create or reuse a Google Cloud OAuth client.
2. Add Supabase callback URL:

```text
https://<staging-project-ref>.supabase.co/auth/v1/callback
```

3. Paste Google Client ID and Client Secret into Supabase Dashboard only.
4. Do not commit Google secrets.

## Step 7 - Configure Hosting

Recommended Vercel path:

1. Open Vercel.
2. Import the Sadhana OS Git repository.
3. Select the branch to deploy.
4. Framework preset should be Vite.
5. Build command:

```text
npm run build
```

6. Output directory:

```text
dist
```

7. Add staging environment variables:

```text
VITE_SADHANA_APP_ENV=staging
VITE_SUPABASE_URL=https://<staging-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

8. Do not add `VITE_SADHANA_FORCE_LOCAL`.
9. Do not add any service-role key.
10. Deploy.

For Netlify or Cloudflare Pages, use the same build command and output directory.

## Step 8 - Validate Staging Env Locally

Before deploying, validate the environment shape from PowerShell.

Example:

```powershell
$env:VITE_SADHANA_APP_ENV="staging"
$env:VITE_SUPABASE_URL="https://<staging-project-ref>.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="<anon-or-publishable-key>"
$env:SADHANA_STAGING_SITE_URL="https://<your-staging-app-url>"
$env:SADHANA_STAGING_REDIRECT_URLS="https://<your-staging-app-url>,https://<your-staging-app-url>/"

npm run validate:staging-env
```

The script checks:

- App environment is `staging`.
- Local-only force mode is not enabled.
- Supabase URL is HTTPS.
- Supabase URL looks like a hosted Supabase project.
- An anon or publishable key is present without printing it.
- No `VITE_` service-role variables are present.
- Optional staging URL and redirect URL shape.

Clear temporary shell values after validation:

```powershell
Remove-Item Env:VITE_SADHANA_APP_ENV
Remove-Item Env:VITE_SUPABASE_URL
Remove-Item Env:VITE_SUPABASE_ANON_KEY
Remove-Item Env:SADHANA_STAGING_SITE_URL
Remove-Item Env:SADHANA_STAGING_REDIRECT_URLS
```

## Step 9 - Run Repo Verification

Before deploying or after pulling staging changes:

```powershell
npm run typecheck
npm test
npm run build
npm run test:e2e
```

All must pass before treating staging as usable.

## Step 10 - Create Staging Test Users

Create two staging-only test users.

Example:

```text
sadhana.staging.a@example.com
sadhana.staging.b@example.com
```

Use real inboxes that you control if email confirmation or password reset will be tested.

Do not reuse production customer accounts.

## Step 11 - Run Live RLS Validation Against Staging

Set staging project URL and anon key in PowerShell:

```powershell
$env:VITE_SUPABASE_URL="https://<staging-project-ref>.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="<anon-or-publishable-key>"

$env:SADHANA_RLS_USER_A_EMAIL="sadhana.staging.a@example.com"
$env:SADHANA_RLS_USER_A_PASSWORD="<user-a-password>"

$env:SADHANA_RLS_USER_B_EMAIL="sadhana.staging.b@example.com"
$env:SADHANA_RLS_USER_B_PASSWORD="<user-b-password>"

npm run validate:cloud-rls
```

Expected:

```text
Live Supabase RLS validation passed.
```

After the run, clear credentials:

```powershell
Remove-Item Env:VITE_SUPABASE_URL
Remove-Item Env:VITE_SUPABASE_ANON_KEY
Remove-Item Env:SADHANA_RLS_USER_A_EMAIL
Remove-Item Env:SADHANA_RLS_USER_A_PASSWORD
Remove-Item Env:SADHANA_RLS_USER_B_EMAIL
Remove-Item Env:SADHANA_RLS_USER_B_PASSWORD
```

## Step 12 - Run Browser Validation On Staging

Using the staging URL:

1. Sign up as User A.
2. Complete onboarding.
3. Confirm starter categories and practices appear.
4. Create one custom category.
5. Create one custom practice.
6. Toggle one practice for today.
7. Add one journal entry.
8. Refresh the browser.
9. Confirm the data remains.
10. Sign out.
11. Sign in as User B.
12. Confirm User B does not see User A custom data.
13. Create one User B category or practice.
14. Sign out.
15. Sign back in as User A.
16. Confirm User A data is still present and User B data is not visible.

Also confirm:

- The app shows a small `Staging` badge.
- The Local Data Migration prompt is not shown for starter-only local data.
- Export/import still works.
- Mobile layout remains usable.

## Step 13 - Record Validation Results

Create a validation artifact after the first staging run.

Recommended generator:

```powershell
npm run create:staging-report
```

Default output:

```text
docs/36-staging-deployment-verification-results.md
```

Record:

- Staging URL.
- Supabase project name, not secrets.
- Date.
- Test users, preferably aliases only.
- Validation commands run.
- Browser flows tested.
- Pass/fail result.
- Issues found.
- Follow-up tasks.

## Acceptance Criteria For Staging Ready

Staging is ready when:

- Staging deploys successfully.
- `VITE_SADHANA_APP_ENV=staging`.
- The app shows the `Staging` badge.
- Supabase staging project is separate from dev and production.
- Migrations are applied.
- Email/password auth works.
- Session persistence works.
- Live RLS validation passes.
- Browser User A/User B validation passes.
- Starter categories and habits persist to Supabase.
- Local migration prompt behavior remains correct.
- Typecheck, tests, build, and E2E pass.

## What Can Still Be Deferred

These are not required for first internal staging:

- Custom SMTP.
- Branded production email templates.
- Apple OAuth.
- Payment/subscription.
- Native mobile app.
- Production analytics.

These become required before public beta or production launch.
