# 35 - Staging Deployment Verification

## Purpose

This runbook turns the staging setup guide into a repeatable verification process. It is used after a staging Supabase project and staging web deployment exist.

This task does not create or deploy the staging environment automatically. It defines the checks and provides a safe results-report generator.

## When To Run

Run this verification when:

- A new staging deployment is created.
- Supabase migrations are applied to staging.
- Auth configuration changes.
- Cloud persistence or migration code changes.
- Privacy/account deletion code changes.
- Before declaring staging ready for internal product testing.

## Required Inputs

Keep these outside Git:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SADHANA_RLS_USER_A_EMAIL
SADHANA_RLS_USER_A_PASSWORD
SADHANA_RLS_USER_B_EMAIL
SADHANA_RLS_USER_B_PASSWORD
```

Optional non-secret metadata for the report generator:

```text
SADHANA_STAGING_SITE_URL
SADHANA_STAGING_SUPABASE_PROJECT
SADHANA_STAGING_DEPLOYMENT_PROVIDER
SADHANA_STAGING_BUILD_URL
SADHANA_STAGING_VALIDATOR
```

Do not record Supabase keys, passwords, tokens, service-role keys, OAuth secrets, or real customer data in any report.

## Step 1 - Generate A Results Report

Create a safe report template:

```powershell
npm run create:staging-report
```

Default output:

```text
docs/36-staging-deployment-verification-results.md
```

Preview without writing:

```powershell
npm run create:staging-report -- --dry-run
```

Use a different output path:

```powershell
npm run create:staging-report -- --output docs/36-staging-deployment-verification-results-2026-07-07.md
```

Overwrite an existing report only when intentional:

```powershell
npm run create:staging-report -- --force
```

## Step 2 - Validate Staging Environment Shape

Set only public frontend-safe values:

```powershell
$env:VITE_SADHANA_APP_ENV="staging"
$env:VITE_SUPABASE_URL="https://<staging-project-ref>.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="<anon-or-publishable-key>"
$env:SADHANA_STAGING_SITE_URL="https://<staging-app-url>"
$env:SADHANA_STAGING_REDIRECT_URLS="https://<staging-app-url>,https://<staging-app-url>/"

npm run validate:staging-env
```

Expected:

```text
Staging environment shape looks ready.
```

Warnings are not always blockers, but they must be reviewed before staging sign-off.

## Step 3 - Run Repository Quality Gate

Run the same local quality gate used by CI:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

All checks must pass before browser staging validation.

## Step 4 - Run Live RLS Validation

Use staging-only users:

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

Record pass/fail in the generated results report. Do not paste credentials into the report.

## Step 5 - Browser Validation

Open the staging app URL and validate:

- App loads over HTTPS.
- Non-production badge shows `Staging`.
- Email/password sign-up works.
- User A completes onboarding.
- Starter categories and practices appear.
- User A creates custom category and practice data.
- User A records Today data.
- User A creates a journal entry.
- Refresh keeps User A data.
- Sign out works.
- User B signs in separately.
- User B does not see User A data.
- User A signs back in and sees only User A data.
- Settings > Data JSON export works.
- Settings > Data JSON import confirmation works with a safe staging test file.
- Settings > Privacy deletion safeguards are visible.
- Account deletion is validated only with a disposable staging user.
- Mobile viewport remains usable.

## Step 6 - Supabase Dashboard Spot Checks

In the staging Supabase dashboard:

- Confirm User A/User B rows have different `user_id` values.
- Confirm User B cannot see User A data through the app.
- Confirm RLS policies are enabled on user-owned tables.
- Confirm Auth Site URL and redirects match staging.
- Confirm frontend hosting does not contain service-role keys.

Do not use the service-role key to "prove" user isolation. The live RLS script validates isolation with normal authenticated users.

## Step 7 - Cleanup

Clear temporary shell variables:

```powershell
Remove-Item Env:VITE_SUPABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:VITE_SUPABASE_ANON_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SADHANA_RLS_USER_A_EMAIL -ErrorAction SilentlyContinue
Remove-Item Env:SADHANA_RLS_USER_A_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:SADHANA_RLS_USER_B_EMAIL -ErrorAction SilentlyContinue
Remove-Item Env:SADHANA_RLS_USER_B_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:SADHANA_STAGING_SITE_URL -ErrorAction SilentlyContinue
Remove-Item Env:SADHANA_STAGING_REDIRECT_URLS -ErrorAction SilentlyContinue
```

## Sign-Off Rules

Staging is considered verified only when:

- The generated results report is completed.
- Environment shape validation passes.
- Local quality gate passes.
- GitHub Actions CI passes on the staged commit.
- Live RLS validation passes against staging.
- Browser User A/User B isolation passes.
- Privacy/account deletion is tested with disposable staging data.
- Issues found are either fixed or explicitly deferred.

## Known Deferred Items

These are not required for first internal staging verification:

- Production custom SMTP.
- Production branded email templates.
- Apple OAuth.
- Payment/subscription.
- Native mobile app.
- Production customer data import.
