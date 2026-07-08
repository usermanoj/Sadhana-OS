# 47 - Release Readiness Checklist And Version Baseline

Task 052 records the current Sadhana OS release baseline after the premium UX, cloud-readiness, PWA, and QA hardening work through Task 051.

This document does not mark Sadhana OS production-ready. It defines the current release-candidate posture and the remaining gates before staging and production.

## Recommended Version Baseline

Use this internal version label for the current milestone:

```text
v0.2.0-alpha
```

Rationale:

- The app has moved well beyond the local v0.1 MVP.
- Auth, cloud persistence, RLS validation, local migration hardening, premium UX, PWA shell, and responsive QA foundations exist.
- A real staging deployment and staging Supabase project are still pending.
- Production SMTP, production OAuth/domain setup, production observability vendor wiring, and legal/privacy launch assets are still pending.

Do not use `v0.2.0-rc.1` yet. Reserve release-candidate labels for after a real staging environment passes live validation.

## Current Completed Capabilities

- React, TypeScript, Vite, Tailwind, Recharts, Lucide stack is stable.
- Local-only mode still works.
- User-owned cloud persistence foundation exists with Supabase/Postgres.
- Supabase schema, user-owned tables, RLS policies, and live RLS validation script exist.
- Live User A/User B RLS validation passed against a real development/staging Supabase project.
- Email/password auth flow exists.
- Google OAuth wiring exists, pending dashboard/provider configuration.
- Magic link is secondary and rate-limit protected.
- Active session persistence is preserved.
- LocalStorage repository boundary and user-scoped local cache exist.
- Local-to-cloud migration flow exists with starter-only suppression and safer merge review.
- Migration ID remapping, duplicate starter cleanup, and cache refresh hardening exist.
- Durable mutation queue, reconnect replay, conflict baseline, and sync mutation tracking exist.
- Cloud sync status, retry/error UX, environment badge, and Account status surfaces exist.
- Today, onboarding, completion feedback, Journal, Dashboard, History, and Settings received premium UX passes.
- Export/import is cloud-aware and communicates trust state.
- PWA manifest, app-shell service worker, install prompt foundation, and safe-area shell polish exist.
- Privacy and account deletion request UX exists with safety checks.
- Production observability abstraction exists without committing vendor secrets.
- GitHub Actions CI quality gate exists.
- Accessibility and responsive QA coverage exists for app shell and key viewports.

## Known Limitations

- No real staging Supabase project has been fully created and signed off in this repo workflow.
- No deployed staging URL has been fully validated end to end in this repo workflow.
- Production Supabase project is not configured.
- Production transactional email provider is not configured.
- Production Google OAuth credentials and verified app domain are not configured.
- Apple OAuth is deferred.
- Account deletion server-side implementation must be validated in staging before real users.
- Production observability vendor/project is not connected.
- Legal assets such as public privacy policy, terms, support contact, and data retention language are not launch-ready.
- Full server-transactional migration/import flow is not implemented; migration remains client-orchestrated.
- Advanced cross-device merge/conflict UX remains limited.
- Native mobile app is not started; Expo/React Native remains future optional work.
- Payments/subscriptions are not implemented.
- Product landing/waitlist funnel is not implemented.

## Local Release Readiness Checklist

Before tagging or sharing `v0.2.0-alpha` internally:

- [ ] Confirm latest `main` GitHub CI is green.
- [ ] Run `npm install` on a clean checkout.
- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:e2e`.
- [ ] Launch the app locally on desktop.
- [ ] Launch the app on a real mobile browser over the local network.
- [ ] Validate Today, Dashboard, Journal, History, Settings.
- [ ] Validate export/import with a safe test file.
- [ ] Validate local-only mode still works.
- [ ] Validate app shell has no horizontal scroll at 390px, 430px, tablet, and desktop widths.
- [ ] Confirm no secrets are committed.

## Staging Readiness Checklist

Before calling staging ready:

- [ ] Create a separate Supabase staging project.
- [ ] Apply committed Supabase migrations to staging.
- [ ] Configure staging Site URL and redirect URLs.
- [ ] Configure staging Vercel deployment or equivalent static host.
- [ ] Set staging environment variables in the host.
- [ ] Run `npm run validate:staging-env` with staging variables.
- [ ] Create staging-only User A and User B accounts.
- [ ] Run `npm run validate:cloud-rls` against staging using staging-only test users.
- [ ] Validate email/password auth against staging.
- [ ] Validate Google OAuth if enabled for staging.
- [ ] Validate fresh-user default starter state.
- [ ] Validate User A/User B browser isolation manually.
- [ ] Validate local migration with a disposable staging user.
- [ ] Validate export/import against cloud-backed staging state.
- [ ] Validate account deletion request flow with a disposable staging user only.
- [ ] Create a staging verification report using the existing staging report script.

## Production Readiness Checklist

Before real customer launch:

- [ ] Create a separate Supabase production project.
- [ ] Apply migrations to production.
- [ ] Configure production domain and redirect URLs.
- [ ] Configure production Google OAuth.
- [ ] Configure Apple OAuth if launching seriously on iOS/PWA audiences.
- [ ] Configure production transactional SMTP provider.
- [ ] Configure branded auth email templates.
- [ ] Configure production observability vendor/project.
- [ ] Define privacy-safe analytics events.
- [ ] Publish privacy policy, terms, support contact, and deletion/retention language.
- [ ] Validate account deletion server-side path in staging before enabling for production users.
- [ ] Validate backups and restore procedures.
- [ ] Validate production RLS with disposable internal users.
- [ ] Run a production smoke test without real customer data.
- [ ] Decide pricing/subscription approach before paid launch.

## Next Recommended Work

If staying cost-light:

1. Task 053 - Premium Empty/Error/Loading State Polish.
2. Task 054 - Product Landing/Waitlist Page.
3. Task 055 - Manual Beta Test Plan And Feedback Capture.

If ready to create staging infrastructure:

1. Task 053 - Staging Supabase And Vercel Execution.
2. Task 054 - Staging Auth/OAuth/Email Configuration.
3. Task 055 - Staging Verification Report.

## Release Decision

Current state:

```text
Internal alpha baseline: acceptable
Staging-ready: not yet, pending infrastructure execution
Production-ready: no
Recommended next label: v0.2.0-alpha
```
