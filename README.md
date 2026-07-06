# Sadhana OS

A premium spiritual wellness and good-life operating system for daily practice, reflection, habit tracking, and private cloud-backed personal growth.

## What Is Sadhana OS?

Sadhana OS is a spiritual wellness habit tracker and life operating system designed around daily practice, self-observation, and steady personal growth.

The product combines ideas from Yoga, Sadhana, SMART habit tracking, reflection, health, family life, professional discipline, speech discipline, senses control, and mental clarity. It is intended to help users track and improve body, mind, speech, senses, family, society, professional life, and spirituality in one calm, structured place.

The repository currently represents a v0.2 alpha / beta-hardening application. It has moved beyond the original local-only MVP into authenticated cloud-backed persistence, while still requiring staging, operational, and production-readiness work before real paying B2C launch.

## Feature Overview

- Today daily practice tracker
- SMART practice and sub-component tracking
- Editable categories and habits
- Starter practices for 8 Limbs of Yoga
- Speech / Vaani control
- Six senses control
- Spiritual, physical, mental, society, professional, and family dimensions
- Journal and daily reflection
- Dashboard analytics and trends
- History views
- Audit trail for configuration and data events
- JSON export/import
- CSV export
- Supabase Auth integration
- Email/password sign in and sign up
- Google OAuth frontend wiring
- Magic-link fallback with resend cooldown
- Password reset flow
- Supabase cloud persistence
- Supabase Postgres schema with Row Level Security
- User-scoped local cache and legacy localStorage migration path
- Cloud sync provider, sync status, durable mutation queue foundation, and reconnect replay baseline
- Local-to-cloud migration review safeguards
- PWA manifest and app-shell service worker foundation
- Live Supabase RLS validation script
- Vitest and Playwright test coverage

## Architecture Overview

Sadhana OS is a React + TypeScript + Vite frontend backed by Supabase Auth and Supabase Postgres.

The app keeps a repository boundary between UI screens and persistence. In local-only mode, the app can continue to use browser storage. In cloud mode, signed-in users operate through a user-scoped cloud-backed repository with a local cache and cloud sync provider.

High-level flow:

```text
User signs in
  -> Supabase Auth identifies the user
  -> AuthProvider initializes profile/settings
  -> CloudSyncProvider loads user-scoped data
  -> UI reads and writes through the repository boundary
  -> cloudRepository maps app data to Supabase rows
  -> Supabase RLS protects user-owned rows
```

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React

Backend / persistence:

- Supabase Auth
- Supabase Postgres
- Row Level Security policies
- Supabase cloud repository layer
- User-scoped local repository/cache layer
- Cloud sync provider
- localStorage for local cache, local-only mode, and legacy migration source

## Tech Stack

| Area | Technology |
| --- | --- |
| UI | React |
| Language | TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Auth client | Supabase JS |
| Database | Supabase Postgres |
| Data security | Supabase Row Level Security |
| Charts | Recharts |
| Icons | Lucide React |
| Unit/component tests | Vitest, Testing Library |
| E2E tests | Playwright |
| Linting | ESLint |
| PWA foundation | Web manifest, service worker |

## Supabase Setup

The frontend uses only public Supabase browser values:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

Create a local file:

```text
.env.local
```

Example:

```text
VITE_SADHANA_APP_ENV=local
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

Rules:

- Do not commit `.env.local`.
- Do not put the Supabase service-role key in frontend code.
- Do not create `VITE_` environment variables containing service-role secrets.
- Use placeholders in docs and examples.

Database migrations live under:

```text
supabase/migrations/
```

Current committed migrations:

```text
supabase/migrations/20260601000000_initial_schema.sql
supabase/migrations/20260603000000_add_sync_mutations.sql
```

Apply migrations to each Supabase environment in order.

## Auth Setup

Current supported auth paths:

- Email/password sign in
- Email/password sign up
- Google OAuth frontend wiring
- Magic link as secondary fallback only
- Password reset
- Session persistence across refreshes

Local Supabase Auth URL configuration should include:

```text
Site URL:
http://localhost:5173

Redirect URLs:
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
http://127.0.0.1:5173/
```

Google OAuth callback format:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Google OAuth Client ID and Client Secret belong only in the Supabase Dashboard. Do not commit them to the repository.

Production authentication still requires production/staging dashboard configuration, production redirect URLs, and production email infrastructure validation.

## Cloud Persistence And RLS Model

Authentication proves who the user is. Row Level Security proves what that user can access.

Sadhana OS stores private wellness data, including daily practice history, journal reflections, and personal discipline configuration. User isolation is therefore a core product and security requirement.

Current user-owned cloud tables include:

- `profiles`
- `user_settings`
- `categories`
- `habits`
- `daily_entries`
- `daily_habit_entries`
- `journal_entries`
- `audit_log_entries`
- `import_jobs`
- `sync_devices`
- `sync_mutations`

RLS expectations:

- User-owned rows are scoped by `user_id` or owner relationship.
- Normal users cannot read another user's private rows.
- Normal users cannot write rows owned by another user.
- Cross-user habit/category relationships are rejected.
- Audit logs are append-only from the normal-user perspective.
- Hard deletes are restricted where history should be preserved.

The latest documented live RLS validation passed with 38 checks using two normal Supabase Auth users and the anon/publishable key only. Browser-level User A/User B validation also completed successfully for signup, onboarding, cloud persistence, and user isolation.

These validations are significant hardening milestones, but they do not by themselves make the full product production-ready.

## Repository Structure

```text
src/                         Application source
src/auth/                    Supabase auth provider and auth gate
src/cloud/                   Cloud sync provider
src/components/              UI components and screens
src/components/auth/         Auth and password reset screens
src/components/layout/       App shell, navigation, environment badge
src/components/settings/     Settings, data, privacy, account, migration UI
src/hooks/                   Feature hooks
src/lib/                     Domain logic, repositories, sync, import/export, auth helpers
docs/                        Product, architecture, security, staging, and validation docs
tasks/                       Implementation task records
scripts/                     Validation scripts
supabase/                    SQL migrations and Edge Function artifact
e2e/                         Playwright tests
public/                      PWA manifest, icons, service worker
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Typecheck and build the production bundle |
| `npm run preview` | Preview the built Vite app locally |
| `npm run typecheck` | Run TypeScript checks for app and test projects |
| `npm test` | Run Vitest unit/component tests once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run validate:cloud-rls` | Run live Supabase RLS validation against development/staging |
| `npm run validate:staging-env` | Validate staging environment variable shape |
| `npm run lint` | Run ESLint |

## Validation Commands

Recommended local verification:

```powershell
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Live RLS validation:

```powershell
$env:VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="<publishable-or-anon-key>"
$env:SADHANA_RLS_USER_A_EMAIL="<test-user-a-email>"
$env:SADHANA_RLS_USER_A_PASSWORD="<test-user-a-password>"
$env:SADHANA_RLS_USER_B_EMAIL="<test-user-b-email>"
$env:SADHANA_RLS_USER_B_PASSWORD="<test-user-b-password>"

npm run validate:cloud-rls
```

Safety notes:

- Run live RLS validation only against development or staging.
- Test users must already exist.
- Use the anon/publishable key only.
- Do not use a service-role key.
- Do not commit credentials.
- Clear temporary shell environment variables after validation.

Staging environment shape validation:

```powershell
$env:VITE_SADHANA_APP_ENV="staging"
$env:VITE_SUPABASE_URL="https://<staging-project-ref>.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="<publishable-or-anon-key>"
$env:SADHANA_STAGING_SITE_URL="https://<staging-app-url>"
$env:SADHANA_STAGING_REDIRECT_URLS="https://<staging-app-url>,https://<staging-app-url>/"

npm run validate:staging-env
```

## Local Development

1. Clone the repository:

```powershell
git clone <repo-url>
cd Sadhana-OS
```

2. Install dependencies:

```powershell
npm install
```

3. Create `.env.local`:

```text
VITE_SADHANA_APP_ENV=local
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

4. Configure Supabase Auth local URLs:

```text
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
http://127.0.0.1:5173/
```

5. Configure Google OAuth if needed:

```text
Callback:
https://<project-ref>.supabase.co/auth/v1/callback
```

6. Start the app:

```powershell
npm run dev
```

7. Open:

```text
http://localhost:5173
```

Local-only mode for deterministic testing:

```text
VITE_SADHANA_FORCE_LOCAL=true
```

Do not set `VITE_SADHANA_FORCE_LOCAL=true` in staging or production.

## Staging

Staging setup is documented in:

```text
docs/30-staging-environment-deployment-readiness.md
docs/31-staging-environment-setup-guide.md
```

Recommended first staging setup:

```text
Hosting provider: Vercel
Supabase project: sadhana-os-staging
App env: VITE_SADHANA_APP_ENV=staging
Build command: npm run build
Output directory: dist
```

Staging should use a separate Supabase project from development and production.

## Testing

Sadhana OS uses several layers of validation:

- Vitest unit and component tests for domain logic, hooks, auth UI, settings, sync, import/export, and repository behavior.
- Playwright E2E tests for core mobile-sized workflows.
- Live Supabase RLS validation via `scripts/validate-cloud-rls.mjs`.
- Manual browser User A/User B validation for signup, onboarding, cloud persistence, and cross-user isolation.

The live validation scripts are security and readiness aids. They should be run only with test users and development/staging projects.

## Security Rules

Never commit:

```text
.env
.env.local
SadhanaOS-Supabase.txt
SadhanaOS-Supabase.local.txt
Google OAuth Client Secret
Supabase service-role key
test-user passwords
SMTP credentials
```

Additional rules:

- Use only the Supabase publishable/anon key in frontend environment variables.
- Service-role keys are server-side only.
- This frontend app does not need a service-role key.
- Store Google OAuth secrets only in Supabase Dashboard or the appropriate provider dashboard.
- Rotate any accidentally exposed secret immediately.
- Keep documentation examples as placeholders.

Secret sanity checks:

```powershell
git ls-files .env .env.local SadhanaOS-Supabase.txt SadhanaOS-Supabase.local.txt
git grep -n -I "GOCSPX"
git grep -n -I "service_role"
git grep -n -I "SADHANA_RLS_USER_A_PASSWORD"
git grep -n -I "SADHANA_RLS_USER_B_PASSWORD"
```

Expected behavior:

- Private env/config files should not be tracked.
- Any hits should be reviewed before committing.
- Placeholder references in docs/scripts may be acceptable.

## Roadmap

Completed foundations:

- MVP Today tracker
- Tracker/category/habit management
- Journal, dashboard, history, settings, audit log
- JSON export/import and CSV export
- Supabase Auth integration
- Email/password auth
- Google OAuth frontend wiring
- Magic-link fallback
- Password reset
- Supabase schema and RLS policies
- Cloud-backed repository and sync foundation
- User-scoped local cache
- Live RLS validation
- Browser User A/User B validation
- Guarded local-to-cloud migration flow
- Staging setup documentation and env validation script

Next:

- Execute staging deployment and validation
- Production auth/email readiness
- Cloud-aware export/import hardening
- Sync status, retry, and error UX hardening
- Local-to-cloud migration UX validation in staging
- Guided conflict resolution
- Premium onboarding polish
- Today ritual UX polish
- PWA/mobile polish
- Account deletion Edge Function deployment and validation
- Privacy and retention review

Later:

- Production SMTP
- Apple OAuth
- Production domain and redirect URLs
- Production observability/error monitoring
- Product analytics with privacy-safe event payloads
- AI insights, if product strategy supports them
- Native mobile app with Expo/React Native if needed

## Known Limitations

- Production SMTP is not configured yet.
- Apple OAuth is not configured yet.
- Staging/production environment setup must be executed and validated manually.
- Google OAuth dashboard configuration must be verified per environment.
- Advanced conflict resolution is still evolving.
- Migration upload is still client-orchestrated rather than server-transactional.
- Import/export cloud-confirmation hardening is still needed.
- Account deletion requires Supabase Edge Function deployment and staging validation.
- Production observability/error monitoring is not configured with a vendor.
- Performance and load testing are not complete.
- Public production launch readiness is not complete.

## Status

Sadhana OS is currently in a v0.2 alpha / beta-hardening stage with authenticated cloud persistence, Supabase RLS, live RLS validation, and browser-level User A/User B validation completed.

The app is suitable for continued development, staging setup, and production hardening. It should not yet be considered ready for paying B2C customers until staging, production auth/email, privacy lifecycle, monitoring, and final launch checks are complete.
