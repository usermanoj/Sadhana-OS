# 26 - Cloud Persistence Validation Audit

## Purpose

This document audits whether Sadhana OS authenticated cloud persistence is production-ready or only partially complete.

Scope of this audit:

- Supabase schema and RLS posture.
- Frontend repository and sync architecture.
- localStorage cache behavior.
- Local-to-cloud migration behavior.
- User A/User B data isolation coverage.
- Export/import behavior with cloud-backed state.
- Error visibility, retry, and conflict handling.

No app code, schema, dependencies, or Supabase configuration were changed for this audit.

## Executive Assessment

Cloud persistence is **partially complete**.

The foundation is solid:

- User-owned Supabase tables exist.
- RLS is enabled across the intended user-owned tables.
- The app has a repository boundary.
- Signed-in users get a user-scoped local cache.
- Core app mutations flow through a cloud-backed repository.
- Local-to-cloud migration is exposed in Settings.

However, the full cloud persistence system should **not yet be marked production-ready** because:

- Cloud writes are asynchronous fire-and-forget after local writes.
- Failed cloud writes can leave local cache ahead of cloud state.
- Sync errors are reported to telemetry/console, not clearly visible in the UI.
- There is no durable mutation queue or replay mechanism.
- There is no cross-device conflict model beyond simple upsert/last-write behavior.
- Local migration success does not appear to refresh the active user-scoped cache immediately.

Task 026.1 live RLS/User A-User B validation is now complete and passed against a real Supabase development/staging project with 32 passing checks.

## What Is Complete

### User-Owned Tables

The initial Supabase migration defines the expected user-owned tables:

```text
profiles
user_settings
categories
habits
daily_entries
daily_habit_entries
journal_entries
audit_log_entries
import_jobs
sync_devices
```

Owner columns:

| Table | Owner Column | Notes |
|-------|--------------|-------|
| `profiles` | `id` | Equals `auth.users.id` |
| `user_settings` | `user_id` | One row per user |
| `categories` | `user_id` | Product data |
| `habits` | `user_id` | Product data; category FK includes owner |
| `daily_entries` | `user_id` | One aggregate row per date |
| `daily_habit_entries` | `user_id` | Per-habit daily values |
| `journal_entries` | `user_id` | One row per date |
| `audit_log_entries` | `user_id` | Append-only audit trail |
| `import_jobs` | `user_id` | Migration/import attempt tracking |
| `sync_devices` | `user_id` | Future sync diagnostics |

Result: all audited user-owned tables have an owner boundary. `profiles` uses `id = auth.uid()` instead of `user_id = auth.uid()`, which is appropriate for a profile keyed by auth user ID.

### RLS Policies

RLS is enabled for every audited table.

The product tables use owner-scoped policies:

```sql
using (user_id = auth.uid())
with check (user_id = auth.uid())
```

`profiles` uses:

```sql
id = auth.uid()
```

Normal users do not receive delete policies. This aligns with the product rule to archive rather than hard-delete and to preserve audit history.

`audit_log_entries` has select and insert policies only. No update/delete policy is present for normal users, so audit logs are append-only from the browser perspective.

### Live RLS/User Isolation Validation

Task 026.1 is **COMPLETE / PASSED**.

The live validation script was run successfully against the Supabase development/staging project:

```text
Command: npm run validate:cloud-rls
Result: PASS
Total checks: 32 passing checks
Key type: Supabase anon/publishable key only
Service-role key: Not used
Credentials: Local environment variables only
```

The live run validated:

- User A and User B authenticated as distinct real Supabase users.
- User A could create own settings/product data.
- User B could not read User A profile, settings, category, habit, daily entry, daily habit entry, journal, or audit rows.
- User B could not insert rows with User A ownership.
- Cross-user habit/category foreign-key relationships were rejected.
- User B could not update or delete User A category data.
- Normal users could not hard-delete protected journal rows.
- Normal users could not update or delete audit log rows.
- Temporary validation category and habit rows were archived, not hard-deleted.

This closes the prior gap where RLS was verified only by SQL text checks and mocks.

### Referential Ownership

The schema protects cross-user relationships:

- `habits` has a composite FK from `(user_id, category_id)` to `categories(user_id, id)`.
- `daily_habit_entries` references daily entries and habits through owner-scoped composite keys.
- Product tables use unique owner-scoped keys such as `(user_id, id)` and `(user_id, entry_date)`.

This is a good B2C multi-tenant posture.

### Frontend Cloud Gateway

`src/lib/cloudRepository.ts` maps Supabase rows to the local app snapshot shape and writes:

- Categories to `categories`.
- Habits to `habits`.
- Daily aggregates to `daily_entries`.
- Daily habit values to `daily_habit_entries`.
- Journal entries to `journal_entries`.
- Audit logs to `audit_log_entries`.

Reads are filtered by the authenticated user ID passed into the gateway.

### Cloud-Backed Repository Boundary

`src/lib/cloudSync.ts` wraps a local repository and cloud gateway.

For signed-in users, writes are:

1. Applied to a user-scoped localStorage repository.
2. Forwarded asynchronously to Supabase.

Core hooks use `appRepository`, so app actions can flow through the cloud-backed repository once `CloudSyncProvider` activates it.

Covered app surfaces include:

- Tracker/category management through `useCategories`.
- Habits/sub-components through `useCategories`.
- Today entries through `useDailyEntry`.
- Journal entries through `useJournal`.
- Audit logs through `auditService`.
- Export/import through `export.ts` and `import.ts`.

### User-Scoped Local Cache

Signed-in cloud mode uses keys prefixed by authenticated user ID:

```text
users:<user-id>:categories
users:<user-id>:entries
users:<user-id>:journal
users:<user-id>:audit
users:<user-id>:version
```

This reduces the risk that User B sees User A's local cache after account switching.

### Local Migration Planning

`src/lib/localMigration.ts` creates deterministic user-scoped cloud IDs for migrated local records.

This is strong:

- Same user + same local data maps to the same cloud IDs on retry.
- Different users migrating identical local data get different cloud IDs.
- Category/habit references are remapped.
- Daily score maps and completion maps are remapped.
- Audit entity IDs and known ID references inside audit JSON are remapped.

### Migration UX Exists

`LocalMigrationPanel` is shown in Settings > Account when:

- Cloud is configured.
- A user is signed in.
- Legacy root localStorage data exists.

It shows summary counts and exposes `Migrate Local Data`.

### JSON Export/Import Remains Available

Export/import still uses the active `appRepository`.

When cloud-backed mode is active, JSON export reads the user-scoped local cache. JSON import writes through `replaceSnapshot`, which forwards the snapshot to the cloud gateway asynchronously.

## What Is Partially Complete

### localStorage Is More Than A Passive Cache

In cloud mode, localStorage is the immediate source of truth for the mounted React hooks.

Cloud writes are asynchronous and fire-and-forget:

```text
local write -> UI updates -> async cloud write
```

This gives a responsive offline-friendly feel, but it means local cache can be ahead of cloud.

### Cloud Can Diverge From Local Cache

If a Supabase write fails:

- Local cache still contains the new state.
- UI keeps showing the new state.
- The cloud may not have the write.
- There is no persisted pending mutation queue.
- There is no automatic retry once connectivity or auth recovers.
- There is no visible "not synced" state in the app.

Current handling reports telemetry and console errors through `reportError`, but does not give a user-facing sync health banner.

### Initial Hydration Has A Soft Failure Path

On signed-in startup, `CloudSyncProvider` tries to hydrate from Supabase or create a starter template.

If hydration fails:

- The error is reported.
- The app is allowed to continue mounting.
- The user may see stale or empty user-scoped local cache.

This avoids blocking the user forever, but it is not enough for production-grade data confidence without visible sync state.

### Migration Upload Is Retry-Friendly But Not Transactional

Migration uploads an `import_jobs` row and then upserts product rows table by table.

Strengths:

- Product row IDs are deterministic.
- Retrying the same migration does not create duplicate product rows.
- Failed attempts are auditable through separate `import_jobs` rows.

Limitations:

- The upload is not server-side transactional.
- Partial uploads can occur before a later table fails.
- There is no source-ID metadata table.
- There is no server-assisted migration function.
- Success does not appear to refresh the active user-scoped cache immediately after upload.

### Duplicate Imports Are Only Partially Prevented

LocalStorage migration:

- Product rows are protected against duplicate creation by deterministic IDs and owner-scoped upserts.
- Each retry creates a new `import_jobs` row by design.

JSON import:

- Merge mode prevents duplicate categories/audit rows by matching local IDs in the client.
- Existing daily/journal records win during merge.
- Overwrite mode replaces the active snapshot locally and forwards to cloud.
- There is no server-side `import_jobs` record for JSON import in the current frontend flow.
- There is no global import checksum table to block accidental repeated JSON imports.

### Conflict Handling Is Limited

Current conflict handling exists for JSON import only through `ConflictDialog`.

There is no general cross-device conflict strategy for:

- Two devices editing trackers simultaneously.
- A stale local cache overwriting newer cloud rows.
- Offline edits queued and replayed later.
- Same-day daily values edited from multiple sessions.

Current upsert behavior effectively trends toward last client write, but without a visible conflict model.

### Logout/Switching Is Safer But Still Needs Live Browser Validation

`CloudSyncProvider` resets the active repository when the user signs out or cloud mode is inactive.

The test suite verifies that User B does not mount the app with root User A local data in a mocked provider scenario.

The direct Supabase RLS validation is complete. Still missing:

- Live browser test with two real Supabase auth users.
- Verification that private user-scoped local caches are never surfaced after rapid account switching.
- Explicit UX for clearing private local caches from a shared device.

## What Is Missing

### Live Browser Cloud Persistence Validation

Direct live Supabase RLS validation now passes. The remaining gap is an end-to-end browser/app validation that proves the React app, user-scoped cache, and Supabase persistence behave correctly together.

Still needed:

- User A signs in through the app.
- User A creates tracker, daily, journal, and audit-generating data.
- User B signs in through the app in the same browser and a separate browser profile.
- User B does not see User A data.
- User A data returns after switching back.
- User-scoped local cache keys remain isolated through the full browser flow.

### User-Facing Sync Status

There is no visible sync health indicator for:

- Initial hydration failure.
- Background cloud write failure.
- Offline or unreachable Supabase.
- Pending unsynced changes.
- Last successful sync time.

### Durable Mutation Queue

There is no IndexedDB or durable queue for pending cloud writes.

Missing:

- `client_mutation_id`.
- Pending mutation persistence.
- Retry with backoff.
- Replay after reconnect.
- Idempotent mutation application.
- User-visible queue status.

### Server-Assisted Migration

Migration is currently client-orchestrated.

Missing production hardening:

- Server-side transactional migration function.
- Migration source metadata.
- Import checksum uniqueness policy.
- Stronger resumability guarantees.
- Admin/support diagnostics for migration runs.

### End-To-End Cloud Persistence Tests

Missing automated or scripted tests against a real Supabase project:

- Sign in User A.
- Create tracker data.
- Verify rows exist with User A ID.
- Sign in User B.
- Verify User B cannot see User A data.
- Create User B data.
- Switch back to User A.
- Verify User A data returns.
- Validate local cache keys after switching.

### Cloud-Aware Export/Import Confirmation

Export/import works through the active repository, but production readiness needs stronger confirmation:

- Confirm export contains the latest successfully synced cloud state, not only local cache.
- Confirm import cloud write completed before showing final success.
- Record JSON import jobs in Supabase.
- Surface import sync failure to the user.

## Review Questions Answered

### 1. Whether all user-owned tables have `user_id`

Yes, except `profiles`, which correctly uses `id = auth.users.id`.

### 2. Whether RLS policies exist for all user-owned tables

Yes. RLS is enabled for the audited tables. Own-row select/insert/update policies exist where expected. Audit logs are append-only. Delete policies are intentionally absent.

### 3. Whether frontend reads/writes core data to Supabase

Mostly yes through the cloud-backed repository after signed-in cloud hydration:

- Categories: yes.
- Habits: yes.
- Daily entries: yes.
- Daily habit values: yes.
- Journal entries: yes.
- Audit logs: yes.

But cloud writes are asynchronous and not confirmed before UI success.

### 4. Whether app still depends on localStorage as source of truth

Yes. In both local-only and cloud mode, React hooks read from `appRepository`, which is backed by localStorage. In cloud mode, this is user-scoped localStorage with async Supabase sync.

### 5. Whether localStorage is only a cache or can diverge from cloud

It can diverge from cloud after write failures, hydration failures, stale cache, or concurrent device edits.

### 6. Whether User A/User B isolation is tested with real Supabase or only mocks

Task 026.1 now validates User A/User B isolation against real Supabase Auth sessions with 32 passing checks. Remaining validation should cover full browser/app account switching and cross-device behavior.

### 7. Whether local-to-cloud migration is exposed through UX

Yes. `LocalMigrationPanel` appears in Settings > Account for signed-in users with legacy local data.

### 8. Whether duplicate imports are prevented

Partially.

- Local migration product rows are retry-safe through deterministic IDs and upserts.
- JSON import merge mode avoids duplicate category/audit IDs locally.
- There is no server-side global import checksum or JSON import job deduplication.

### 9. Whether sync errors are visible to the user

Mostly no.

Migration/import form errors are visible. Background cloud sync errors are telemetry/console only.

### 10. Whether retry/conflict handling exists

Partially.

- Migration retry for product rows exists.
- JSON import conflict summary exists.
- General cloud write retry, durable queue, and cross-device conflict handling do not exist.

### 11. Whether export/import works with cloud-backed state

Partially yes.

Export/import use the active repository, so signed-in cloud mode exports/imports the user-scoped local cache and forwards imports to cloud asynchronously. It does not prove the exported data is cloud-confirmed or that imported data finished syncing.

### 12. Whether logout clears/switches private local state safely

Partially.

The active repository resets on sign-out and signed-in users use user-scoped local cache keys. Private caches are preserved, not cleared. Live rapid switching and shared-device scenarios still need validation.

## Manual Supabase Validation Checklist

Run these checks before marking cloud persistence production-ready.

### Setup

- Create two real Supabase Auth users: User A and User B.
- Use a clean browser profile for each or use incognito/private windows.
- Confirm both users complete onboarding.
- Confirm both users have distinct `auth.users.id` values.

### RLS Select Isolation

As User A:

- Create one category, one habit, one daily entry, one journal entry.
- Confirm rows have User A `user_id`.

As User B:

- Confirm User A category is not returned in the app.
- Confirm User A journal text is not returned.
- Confirm User A daily history is not returned.
- Confirm User B starts with empty/default starter data only.

### RLS Write Protection

Using Supabase SQL editor or API client with User A session:

- Attempt to insert a category with User B `user_id`; expect failure.
- Attempt to update User B category; expect no row updated or policy failure.
- Attempt to update User B journal entry; expect no row updated or policy failure.
- Attempt to delete User A product rows as normal user; expect failure because no delete policy exists.
- Attempt to update an audit log row; expect failure.
- Attempt to delete an audit log row; expect failure.

### Cloud Persistence

As User A:

- Create category and habit.
- Toggle a daily habit value.
- Save a journal entry.
- Create a setting/configuration change that records audit history.
- Refresh browser.
- Confirm data remains.
- Sign out and sign back in.
- Confirm data remains.

### Account Switching

- Sign in User A and confirm User A data.
- Sign out.
- Sign in User B in same browser.
- Confirm User B does not see User A custom data.
- Sign out.
- Sign back into User A.
- Confirm User A data returns.

### Migration

- Seed legacy root localStorage data while signed out/local-only.
- Sign in to a clean cloud account.
- Confirm Local Data Migration panel appears.
- Run migration.
- Confirm product rows exist in Supabase.
- Refresh/sign in again.
- Confirm migrated data appears in app.
- Run migration retry.
- Confirm product rows are not duplicated.
- Confirm a new `import_jobs` attempt row may exist by design.

### Sync Failure

- Simulate network failure or invalid Supabase URL.
- Make a local change.
- Confirm the app shows a clear sync failure state.
- Confirm retry behavior is understandable.

This last item is expected to fail today and should become a hardening task.

## Recommended Hardening Tasks

### Task 026.1 - Live RLS/User Isolation Test Script

Status: **Complete / Passed**.

The live validation script uses real authenticated Supabase sessions for User A and User B, runs with the anon/publishable key only, and passed against the development/staging Supabase project with 32 checks.

Implementation reference:

```text
scripts/validate-cloud-rls.mjs
docs/26-cloud-rls-live-validation.md
tasks/026-live-rls-user-isolation-validation.md
```

Acceptance:

- Proves select isolation. Completed.
- Proves insert/update owner checks. Completed.
- Proves normal users cannot delete protected product rows. Completed.
- Proves audit logs are append-only. Completed.

Remaining related work is browser-level validation of the complete app flow, not direct database RLS validation.

### Task 026.2 - User-Facing Sync Health

Add sync state to the app shell/account area.

States:

- Preparing cloud data.
- Synced.
- Syncing.
- Offline.
- Sync failed.
- Unsynced changes pending.

Acceptance:

- Background write failures are visible.
- Initial hydration failure is visible.
- User can retry or understand next action.

### Task 026.3 - Durable Mutation Queue

Add a durable local queue for cloud mutations.

Recommended storage: IndexedDB, not localStorage, once production offline support is prioritized.

Acceptance:

- Failed mutations are stored.
- Mutations replay after reconnect.
- Mutations have idempotency keys.
- Queue is user-scoped.

### Task 026.4 - Migration Cache Refresh

After successful local-to-cloud migration:

- Refresh cloud snapshot.
- Replace the active user-scoped local cache.
- Update visible UI without requiring sign-out or refresh.

Acceptance:

- User sees migrated data immediately after success.
- Retry remains duplicate-safe.

### Task 026.5 - Cloud Import Job Tracking

Record JSON imports in `import_jobs`, not only local audit.

Acceptance:

- JSON import creates running/succeeded/failed job rows.
- Summary includes counts and conflict mode.
- Repeated imports can be diagnosed.

### Task 026.6 - Export Freshness Guarantee

Before cloud-mode export:

- Either export latest confirmed cloud snapshot.
- Or clearly label export as local cache backup with last sync status.

Acceptance:

- User understands whether export includes cloud-confirmed data.

### Task 026.7 - Conflict Model

Define conflict rules for multi-device use.

Recommended v0.2.1 default:

- Daily habit values: last-write-wins with timestamps.
- Journal entries: last-write-wins plus conflict backup if content differs.
- Tracker configuration: warn when stale update may overwrite newer cloud row.

Acceptance:

- Behavior is documented and tested.

## Acceptance Criteria For Marking Task 026 Complete

Task 026 should be marked complete only when all of the following are true:

- All user-owned tables are verified to have owner boundaries.
- RLS is enabled and live-tested for every user-owned table.
- User A/User B isolation is validated against a real Supabase project.
- Core app screens read/write cloud-backed state while signed in.
- localStorage is documented and treated as a user-scoped cache, not an invisible permanent source of truth.
- Background sync failures are visible to users.
- Initial cloud hydration failures are visible to users.
- Failed writes can be retried or queued.
- Local-to-cloud migration is visible, retry-safe, and refreshes active app state after success.
- Duplicate product rows are prevented on migration retry.
- JSON import behavior is cloud-aware and auditable.
- Export behavior communicates whether data is cloud-confirmed or local-cache-backed.
- Sign-out and account switching are manually validated for same-browser safety.
- Audit history remains append-only.
- No normal-user hard-delete policies are introduced.

## Current Readiness Rating

| Area | Rating | Notes |
|------|--------|-------|
| Schema ownership | Strong | Owner keys and composite FKs exist |
| RLS design | Strong and live-validated | 32 live checks passed with anon/publishable key only |
| Frontend repository boundary | Strong foundation | App uses `appRepository` consistently |
| Cloud write confidence | Partial | Async fire-and-forget writes can fail silently |
| Local cache isolation | Partial to strong | User-scoped keys exist; live switching validation needed |
| Migration retry safety | Good for product rows | Not transactional; cache refresh missing |
| Export/import cloud awareness | Partial | Active repo used, but sync completion not guaranteed |
| Sync error UX | Weak | Telemetry/console only for background sync |
| Conflict handling | Weak | Import conflicts only |
| Production readiness | Not yet | RLS is live-validated; needs sync health, retries, browser switching validation, and migration/import hardening |

## Summary

Sadhana OS has a good authenticated cloud persistence foundation. The schema and RLS design are sensible, the frontend has a repository boundary, user-scoped local cache is in place, and local migration is retry-safe for product rows.

Task 026.1 live RLS/User A-User B isolation validation is complete and passed with 32 checks. This materially improves confidence that the Supabase development/staging project enforces core user isolation using normal authenticated sessions and the public anon/publishable key.

The remaining work is about end-to-end product confidence and operational safety: live browser account-switching validation, visible sync state, durable retries, cloud/local reconciliation, and production-grade migration/import diagnostics.

Task 026 should remain open until the full cloud persistence experience is validated through the app UI and users can understand and recover from sync failures.
