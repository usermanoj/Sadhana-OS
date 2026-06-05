# 28 - Production-Grade B2C Next Steps

Date: 2026-06-06

Purpose: record the recommended next steps for taking Sadhana OS from the current v0.2 pre-production cloud-readiness state toward a production-grade premium B2C web application.

This document is a planning and execution artifact. It does not mark the application production-ready.

## Current State

Sadhana OS is currently a v0.2 pre-production cloud-readiness app.

Implemented foundations include:

- Core MVP functionality: Today tracker, tracker management, dashboard, journal, history, audit log, settings, JSON export/import, and CSV export.
- Supabase Auth integration.
- Email/password sign in and sign up.
- Google OAuth frontend wiring.
- Magic link retained as fallback only.
- Password reset and session persistence.
- Supabase Postgres user-owned tables.
- Row Level Security policies.
- Live RLS validation with two real Supabase users.
- Cloud repository boundary.
- User-scoped local cache.
- Visible sync status.
- Durable queued-write baseline.
- Cross-device conflict detection baseline.
- `sync_mutations` tracking.
- Guarded local-to-cloud migration.
- Starter-template duplicate prevention and repair.
- Migration review flow.
- Migration ownership guard.
- Documentation for cloud persistence and current system state.

The app is suitable for continued hardening and staging preparation. It should not yet be considered ready for paying B2C users.

## Recommended Sequence

### Step 1 - Clean Live Browser Validation

Priority: highest.

Before implementing new features, validate the actual browser application flow against Supabase using two fresh users.

Validate:

- New user signup creates `profiles` and `user_settings`.
- New user onboarding completes successfully.
- Starter categories and habits appear in the app.
- Starter categories and habits are persisted to Supabase.
- User A can create a custom category, practice, daily entry, journal entry, and audit-generating change.
- User B cannot see User A data.
- User B can create independent data.
- User A cannot see User B data.
- Same-browser sign-out/sign-in account switching does not leak user-scoped local cache.
- Refresh, sign out, and sign back in preserve cloud-backed state.

Recommended artifact after validation:

```text
docs/29-live-browser-cloud-validation-results.md
```

Acceptance:

- The expected rows appear in Supabase for each user.
- The app shows correct data after refresh and account switching.
- No test-only category from one user appears for another user.

### Step 2 - Fix New-User Cloud Materialization If Needed

Only implement this if Step 1 proves that new users see starter data in the app but Supabase `categories` or `habits` remain empty.

Potential task:

```text
Task 027 - New-user starter template cloud materialization hardening
```

Goal:

- Guarantee that empty cloud accounts get starter categories and habits persisted to Supabase.
- Keep legacy root localStorage migration separate from normal new-user starter onboarding.
- Avoid copying shared-device local backup data into a new account.
- Preserve migration review safeguards.

Acceptance:

- Clean new users consistently get starter rows in Supabase.
- Existing users are not overwritten.
- Legacy migration still requires explicit review.

### Step 3 - Production Auth Setup

Configure Supabase Auth for a real B2C environment.

Required:

- Enable email/password auth.
- Confirm email/password signups are enabled.
- Configure Google OAuth.
- Add production site URL.
- Add production redirect URLs.
- Keep magic link as fallback only.
- Confirm password reset redirect flow.
- Confirm session persistence.
- Confirm friendly auth error handling.

Recommended:

- Avoid relying on Supabase default email delivery for production.
- Use magic link sparingly because it is email-volume sensitive.
- Prefer Google OAuth and email/password as primary login paths.

Acceptance:

- Users can sign up and sign in without hitting development email limits.
- Google OAuth works in staging and production.
- Password reset works end to end.

### Step 4 - Custom SMTP And Email Infrastructure

Set up production-grade transactional email before public launch.

Recommended providers:

- Postmark: strong transactional deliverability and simple operational model.
- Resend: modern developer experience and good fit for early SaaS/B2C products.
- AWS SES: low cost at scale, but more operational setup.
- SendGrid or Brevo: viable alternatives, especially if broader email tooling is needed.

Required DNS setup:

- SPF
- DKIM
- DMARC
- Verified sending domain
- Branded sender address

Supabase setup:

- Configure SMTP under Supabase Auth settings.
- Test signup confirmation if enabled.
- Test password reset.
- Test magic link fallback.
- Customize email templates.

Acceptance:

- Auth emails are delivered reliably.
- Rate-limit behavior is acceptable for expected beta usage.
- Email templates look trustworthy and match Sadhana OS tone.

### Step 5 - Server-Side Migration Hardening

The current migration flow is safer than a blind upload, but it is still client-orchestrated.

Production-grade migration should eventually move to a server-assisted flow.

Recommended implementation:

- Supabase Edge Function or Postgres RPC.
- Transactional import operation where practical.
- Server-side source checksum.
- Import source metadata.
- Strong `import_jobs` lifecycle.
- Idempotent retry behavior.
- Clear failure diagnostics.

Acceptance:

- A repeated migration cannot duplicate product rows.
- Partial migration failures are diagnosable.
- Migration status is visible to the user.
- Support can inspect import job state without exposing private content.

### Step 6 - Import And Export Hardening

Preserve existing export/import functionality, but make it cloud-aware.

Add:

- Export freshness messaging.
- Last confirmed cloud sync timestamp before export.
- Option to refresh from cloud before export.
- JSON import `import_jobs` tracking.
- Import success only after cloud sync succeeds or clearly states that changes are queued.
- Failure recovery path.

Acceptance:

- Users understand whether an export is cloud-confirmed or local-cache-backed.
- JSON imports are auditable.
- Failed imports do not create confusing silent divergence.

### Step 7 - Conflict Resolution UX

Current sync has a conflict baseline, but a premium B2C app needs a clearer user recovery path.

Recommended v0.2.1 behavior:

- Show a calm conflict state when cloud data changed on another device.
- Offer explicit choices:
  - Keep cloud version.
  - Keep this device version.
  - Export this device backup first.
- Avoid automatic destructive merge behavior.

Acceptance:

- User can recover from a conflict without losing confidence.
- Local queued data is not silently discarded.
- Cloud data is not silently overwritten after conflict detection.

### Step 8 - Privacy And Account Lifecycle

Complete the privacy lifecycle before public beta.

Validate:

- Account deletion Edge Function deployment.
- Account deletion authorization.
- Data retention policy.
- Export-before-delete option.
- Local browser cache handling.
- Privacy copy in Settings.
- No accidental hard delete of audit history outside approved account deletion flow.

Acceptance:

- User can understand how to export and delete account data.
- Account deletion is tested in staging.
- Retention behavior is documented.

### Step 9 - Observability

Add production monitoring before real customer usage.

Recommended:

- Error monitoring: Sentry or equivalent.
- Product analytics: PostHog, Plausible, or equivalent.
- Sync failure events.
- Migration failure events.
- Auth funnel events.
- Account deletion request events.

Privacy rule:

- Do not log journal content.
- Do not log private practice details.
- Avoid recording raw user-generated text.

Acceptance:

- Production failures are visible.
- Sensitive wellness content is not leaked into telemetry.
- Sync and auth failures can be diagnosed.

### Step 10 - Staging Deployment

Create a controlled staging environment before production.

Recommended environments:

- Local development Supabase project.
- Staging Supabase project.
- Production Supabase project.

Staging checklist:

- Apply migrations.
- Configure Auth.
- Configure SMTP or staging email provider.
- Configure Google OAuth staging redirect URL.
- Run typecheck.
- Run unit tests.
- Run production build.
- Run Playwright tests.
- Run live RLS validation.
- Run live browser User A/User B validation.

Acceptance:

- Staging behaves like production.
- No secrets are committed.
- Environment variables are separated cleanly.

### Step 11 - Premium Mobile And PWA Polish

Before a public beta, polish the experience on mobile and installed PWA contexts.

Validate:

- Mobile layout at common widths.
- Tap targets.
- Bottom spacing and safe areas.
- Loading states.
- Empty states.
- Offline/queued states.
- Installable PWA behavior.
- Browser refresh behavior.
- Auth screen on mobile.
- Onboarding screen on mobile.

Acceptance:

- The app feels calm, premium, spiritual, and uncluttered on mobile.
- The user can complete core workflows on a phone without friction.

### Step 12 - Beta Launch Gate

Only consider Sadhana OS beta-ready after the following pass:

- Clean two-user browser validation.
- New-user starter data materializes correctly.
- Email/password auth works.
- Google OAuth works.
- Magic link is only fallback.
- Cloud sync failures are visible and recoverable.
- Migration is safe and reviewed.
- Export/import are cloud-aware.
- Account deletion is validated.
- Monitoring is live.
- Staging checklist passes.
- Privacy and retention behavior are documented.

## Immediate Recommendation

The next immediate task should be Step 1: clean live browser validation.

If Step 1 passes, continue to production auth and email setup.

If Step 1 fails, fix the exact failing cloud materialization, isolation, or account-switching issue before adding new features.

## Non-Goals For The Next Step

Do not start these until validation passes:

- Payment/subscription implementation.
- Native mobile app.
- Apple OAuth.
- Advanced analytics dashboards.
- Major redesign.
- Large new product features.

The priority is confidence, safety, and production readiness.
