# 27 - Current System State Assessment

Date: 2026-06-06

Purpose: record the current factual state of Sadhana OS after the v0.2 cloud, auth, sync, migration, and hardening work. This is an intermediate artifact for review and future git inclusion. It is not a production readiness sign-off.

## Executive Assessment

Sadhana OS is currently in a v0.2 pre-production cloud-readiness state.

The app has moved meaningfully beyond the original local-only MVP. It now includes Supabase-backed authentication, user-owned cloud data, RLS validation, user-scoped local caching, cloud sync status, durable mutation queue foundations, and a guarded local-to-cloud migration flow.

The current architecture direction is sound for a premium B2C wellness app. The main remaining risks are not basic app functionality, but production-grade operational readiness: transactional migration, mature cross-device conflict resolution, production auth/email setup, monitoring, staged deployment validation, and a few remaining hardening checks.

## Current Stack

- React, TypeScript, Vite
- Tailwind CSS
- Recharts
- Lucide React
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- localStorage for local cache and legacy data migration
- Vitest unit/component tests
- Playwright end-to-end tests

## Implemented Product Functionality

The following core MVP functionality is present and preserved:

- Today practice tracker
- Starter practice categories and practices
- Custom tracker/category management
- Archive and restore behavior instead of hard delete for user-facing configuration
- Daily score and practice completion tracking
- Dashboard analytics
- Journal
- History views
- Audit log
- Settings sections for categories, audit log, data, account, and privacy
- JSON export/import support
- CSV export support
- Mobile-first responsive UI foundation
- Calm, uncluttered visual direction

## Implemented Authentication Functionality

The current app includes:

- Supabase Auth integration
- Email and password sign in
- Email and password sign up
- Google OAuth frontend wiring
- Magic link retained as a secondary fallback
- Magic-link resend cooldown
- Friendly rate-limit messaging for magic-link email limits
- Password reset support
- Session persistence across refreshes
- Authenticated account area
- User profile/settings initialization

Manual Supabase dashboard configuration is still required for production-grade use, especially for Google OAuth, redirect URLs, and email infrastructure.

## Implemented Cloud Persistence Functionality

The repository includes a Supabase-backed data model and cloud repository layer for user-owned data.

Known user-owned tables include:

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

The app uses a repository boundary so signed-in users can operate against cloud-backed state while localStorage remains available for cache, offline resilience, and legacy migration.

## Row Level Security State

Live Supabase RLS validation has passed using normal authenticated users and the anon/publishable key only.

The most recent reported live validation completed 38 passing checks, including:

- User A and User B sign in separately.
- User A can insert own categories, habits, daily entries, daily habit entries, journal entries, audit logs, and sync mutations.
- User B cannot select User A profile, settings, categories, habits, daily entries, daily habit entries, journal entries, audit logs, or sync mutations.
- User B cannot insert rows owned by User A.
- Cross-user habit/category foreign-key misuse is rejected.
- User B cannot update or delete User A rows.
- Normal users cannot hard-delete protected journal, sync mutation, or audit-log rows.

This supports the conclusion that basic user isolation is working in the development Supabase project used for validation.

## Implemented Sync and Offline Foundations

The current implementation includes:

- Cloud sync provider
- Visible cloud sync status
- User-scoped local repository/cache
- Durable mutation queue foundation
- Reconnect replay support
- Sync mutation tracking table
- RLS-safe mutation tracking validation
- Conflict baseline for cross-device changes
- User-visible sync errors in relevant account/settings surfaces

This is a strong foundation, but it is not yet a mature full offline-first conflict-resolution system.

## Implemented Local-to-Cloud Migration Hardening

The app includes a guarded migration path from legacy localStorage data to the signed-in cloud account.

Current migration protections include:

- Deterministic local-to-cloud ID remapping
- Preservation of audit history
- Starter-template duplicate detection
- Starter-template duplicate archive repair
- Append-only audit retry handling
- Review-before-copy UX
- Blocking migration into a non-empty cloud account by default
- Detection of copied local custom groups
- Archive-only cleanup for copied local custom groups
- Migration completion marker for the local browser backup
- Protection against copying the same local backup into another cloud account after successful migration

This addresses the observed category duplication and cross-account local-backup copying problems more safely than a blind upload button.

## Known Limitations

The following limitations remain:

- Migration upload is still client-orchestrated, not server-transactional.
- Full idempotent server-side import job orchestration is not complete.
- Cross-device conflict detection exists, but guided conflict-resolution UX is still limited.
- localStorage remains part of the runtime as cache and migration source.
- JSON import/export is preserved, but production-grade cloud import job tracking still needs stronger validation.
- Account deletion depends on Supabase Edge Function deployment and configuration.
- Production SMTP/custom email infrastructure is not configured in code.
- Apple OAuth is not implemented.
- Production observability/error monitoring is not configured with a vendor.
- Staging deployment validation remains required before production launch.

## Recent Manual Validation Notes

Recent manual testing with fresh users indicated that basic functionality works.

The category named `RLS Test 76aa581f` was visible only for older test users because it was a prior RLS validation artifact associated with those users. New users not seeing that category is expected and is evidence of user-owned data isolation, not a missing default category.

Starter categories are expected for new users. Test-only or user-created categories from older users should not appear for fresh users.

## Current Git Context

Recent committed baseline:

- `c1f40dd Refresh cloud cache after migration`
- `fb6fbdf Add sync mutation tracking and RLS validation`
- `47a0d18 Add cloud sync queue and conflict baseline`

Current uncommitted work at the time of this assessment includes migration-safety and documentation changes in:

- `docs/14-sync-and-migration.md`
- `docs/26-cloud-persistence-validation-audit.md`
- `src/components/settings/LocalMigrationPanel.test.tsx`
- `src/components/settings/LocalMigrationPanel.tsx`
- `src/lib/cloudRepository.ts`
- `src/lib/localMigration.test.ts`
- `src/lib/localMigration.ts`
- `tasks/026-local-migration-starter-dedupe.md`

This document should be committed together with the relevant migration-safety changes once the user approves.

## Latest Reported Verification

The latest full local verification reported for the current hardening patch passed:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`

The latest reported unit test run covered 43 test files and 249 tests.

## Production Readiness Position

The current system is suitable for continued development, staging preparation, and structured manual validation.

It should not yet be considered production-ready for paying B2C customers until the following are complete:

- Clean two-user browser validation with fresh accounts
- Confirmed Supabase Auth dashboard configuration
- Google OAuth production configuration
- Production email strategy decision and setup
- Staging deployment
- Monitoring/error tracking setup
- Account deletion Edge Function validation
- Stronger import/export cloud-state validation
- Conflict-resolution UX hardening
- Final privacy and data-retention review

## Recommended Next Actions

1. Commit the current migration-safety patch and this assessment artifact after final review.
2. Perform a clean two-user validation with fresh users and no legacy local backup contamination.
3. Document the validation result in a follow-up task or QA artifact.
4. Configure production-ready auth settings in Supabase for the development/staging project.
5. Decide whether to implement custom SMTP now or defer until staging.
6. Proceed to the next hardening task only after the migration flow is stable in manual browser validation.

## Bottom Line

The system is progressing in the right architectural direction. Core functionality appears intact, RLS validation has passed, and the most serious migration duplicate/cross-account risks have been addressed with safer guardrails.

The next milestone should be controlled staging readiness, not new feature expansion.
