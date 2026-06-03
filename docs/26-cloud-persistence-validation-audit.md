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

The original audit was documentation-only. Later sections now track hardening tasks implemented after the audit.

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
- Failed cloud writes can temporarily leave local cache ahead of cloud state.
- Visible sync status, queued-write status, manual retry, and reconnect replay now exist.
- The durable queue has client mutation IDs, snapshot-level conflict detection, and RLS-safe server-side mutation tracking.
- The durable queue does not yet provide transactional server-side mutation application or per-row merge semantics.
- Local migration success does not appear to refresh the active user-scoped cache immediately.

Task 026.1 live RLS/User A-User B validation is now complete and passed against a real Supabase development/staging project with 38 passing checks.
Task 026.2 visible sync status is implemented.
Task 026.3 durable queued-write replay is implemented for one coalesced user-scoped snapshot.
Task 026.4 cross-device conflict and idempotency baseline is implemented for queued snapshot replay.
Task 026.5 server-side idempotency and mutation tracking is implemented as a best-effort `sync_mutations` status record.

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
sync_mutations
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
| `sync_mutations` | `user_id` | Client mutation idempotency and sync status tracking |

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

Task 026.1 is **COMPLETE / PASSED** for the current cloud schema.

The live validation script was run successfully against the Supabase development/staging project:

```text
Command: npm run validate:cloud-rls
Result: PASS
Total checks: 38 passing checks
Key type: Supabase anon/publishable key only
Service-role key: Not used
Credentials: Local environment variables only
```

The live run validated:

- User A and User B authenticated as distinct real Supabase users.
- User A could create own settings/product data.
- User B could not read User A profile, settings, category, habit, daily entry, daily habit entry, journal, or audit rows.
- User B could not read User A sync mutation rows.
- User B could not insert rows with User A ownership.
- Cross-user habit/category foreign-key relationships were rejected.
- User B could not update or delete User A category data.
- User B could not update User A sync mutation rows.
- Normal users could not hard-delete protected journal rows.
- Normal users could not hard-delete sync mutation rows.
- Normal users could not update or delete audit log rows.
- Temporary validation category and habit rows were archived, not hard-deleted.

This closes the prior gap where RLS was verified only by SQL text checks and mocks.

Task 026.5 extends the live validation script to include `sync_mutations`, and the updated script passed after applying `supabase/migrations/20260603000000_add_sync_mutations.sql`.

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
- A user-scoped queued `replaceSnapshot` mutation is persisted.
- Repeated failed writes coalesce into the latest local snapshot.
- Manual retry replays the queued snapshot.
- Browser `online` events replay queued changes.

Current handling now reports telemetry and console errors through `reportError` and surfaces user-facing sync health in the app shell and Account screen.

Remaining limitations:

- The queue is snapshot-level, not per-row.
- Replay checks whether cloud changed since the queued write base snapshot.
- Cross-device changes block replay and keep the local queued snapshot.
- A server-side `sync_mutations` row records the queued mutation status when tracking is available.
- The unique `(user_id, client_mutation_id)` key prevents duplicate mutation tracking rows.
- There is no transactional server-side mutation application function yet.
- There is no merge/conflict-resolution UI.

### Initial Hydration Has A Soft Failure Path

On signed-in startup, `CloudSyncProvider` tries to hydrate from Supabase or create a starter template.

If hydration fails:

- The error is reported.
- The app is allowed to continue mounting.
- The user may see stale or empty user-scoped local cache.
- The app shows a visible cloud sync failure state and an in-memory retry action.

This avoids blocking the user forever and no longer fails silently. It still needs browser-level validation and guided conflict resolution before production launch.

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

Current conflict handling exists for JSON import through `ConflictDialog` and for queued cloud replay through snapshot-level base/current-cloud comparison.

There is no general cross-device merge strategy for:

- Two devices editing trackers simultaneously.
- Merging a queued stale local snapshot with newer cloud rows.
- Same-day daily values edited from multiple sessions.

Queued replay now blocks overwrite when cloud changed since the queued write base snapshot. Normal online upsert behavior still trends toward last client write.

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

### Durable Sync Guarantees

Task 026.2 added visible sync health for:

- Initial hydration failure.
- Background cloud write failure.
- Offline or unreachable Supabase.
- Last successful sync time.

Still missing:

- Per-row mutation persistence.
- Transactional server-side mutation application.
- Guided cross-device conflict resolution.

### Durable Mutation Queue

Task 026.3 added a durable user-scoped queued-write layer.

Implemented:

- Failed cloud writes persist one coalesced `replaceSnapshot` mutation per user.
- Pending queued writes survive provider remount/browser refresh.
- Manual retry replays queued changes.
- Browser `online` events replay queued changes.
- App shell and Account screen show queued pending changes.

Still missing:

- Per-row pending mutation persistence.
- Retry with backoff.
- Transactional server-side mutation application.
- Merge/conflict-resolution UI.

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

Task 026.1 now validates User A/User B isolation against real Supabase Auth sessions with 38 passing checks. Remaining validation should cover full browser/app account switching and cross-device behavior.

### 7. Whether local-to-cloud migration is exposed through UX

Yes. `LocalMigrationPanel` appears in Settings > Account for signed-in users with legacy local data.

### 8. Whether duplicate imports are prevented

Partially.

- Local migration product rows are retry-safe through deterministic IDs and upserts.
- JSON import merge mode avoids duplicate category/audit IDs locally.
- There is no server-side global import checksum or JSON import job deduplication.

### 9. Whether sync errors are visible to the user

Partially yes.

Migration/import form errors are visible. Task 026.2 adds app-shell and Account-screen visibility for initial hydration failures, background cloud write failures, offline status, syncing, retrying, and last successful sync time.

### 10. Whether retry/conflict handling exists

Partially.

- Migration retry for product rows exists.
- Latest in-memory cloud sync failure can be retried from the UI.
- JSON import conflict summary exists.
- Durable cloud write queue exists.
- Queued cloud replay detects base/current-cloud conflicts and blocks overwrite.
- Baseline server-side mutation tracking exists through `sync_mutations`.
- Transactional server-side mutation application and guided conflict resolution do not exist yet.

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
- Attempt to read or update User B `sync_mutations` rows; expect no rows visible or policy failure.
- Attempt to delete User A product rows as normal user; expect failure because no delete policy exists.
- Attempt to delete User A `sync_mutations` rows as normal user; expect failure because no delete policy exists.
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

The app now has a visible sync failure state and in-memory retry path. This checklist still needs manual browser validation against a real Supabase development/staging project.

## Recommended Hardening Tasks

### Task 026.1 - Live RLS/User Isolation Test Script

Status: **Complete / Passed**.

The live validation script uses real authenticated Supabase sessions for User A and User B, runs with the anon/publishable key only, and passed against the development/staging Supabase project with 38 checks.

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

Status: **Implemented**.

Task 026.2 adds sync state to the app shell/account area.

States:

- Preparing cloud data.
- Synced.
- Syncing.
- Offline.
- Sync failed.
- Retrying.

Acceptance:

- Background write failures are visible. Completed.
- Initial hydration failure is visible. Completed.
- User can retry or understand next action. Completed for the latest in-memory sync failure.

Remaining related work is durable queueing, reconnect replay, and conflict resolution.

### Task 026.3 - Durable Mutation Queue

Status: **Implemented**.

Task 026.3 adds a durable local queue for cloud mutations using the current local persistence layer.

Acceptance:

- Failed mutations are stored. Completed for one coalesced snapshot mutation per user.
- Mutations replay after reconnect. Completed for browser `online` events.
- Mutations have idempotency keys. Completed for one coalesced snapshot mutation per user.
- Queue is user-scoped. Completed.

Remaining related work is an IndexedDB-backed per-row queue, retry backoff, transactional server-side mutation application, and guided conflict resolution.

### Task 026.4 - Cross-Device Conflict And Idempotency Baseline

Status: **Implemented**.

Task 026.4 adds client-side mutation IDs and snapshot-level conflict detection for queued cloud replay.

Acceptance:

- Queued mutations have stable `clientMutationId` values. Completed.
- Queued mutations store a base cloud snapshot when available. Completed.
- Replay checks the current cloud snapshot before writing. Completed.
- Replay is blocked when cloud changed since the queued write base snapshot. Completed.
- Conflict state is visible in the app shell and Account screen. Completed.
- Queued local changes remain stored after conflict detection. Completed.

Remaining related work is per-row mutation metadata, transactional mutation application, and guided merge/conflict-resolution UX.

### Task 026.5 - Server-Side Idempotency And Mutation Tracking

Status: **Implemented**.

Task 026.5 adds an RLS-protected `sync_mutations` table and records queued mutation status from the frontend.

Acceptance:

- `sync_mutations` exists in a forward migration. Completed.
- `(user_id, client_mutation_id)` is unique. Completed.
- Own-row select, insert, and update policies exist. Completed.
- No normal-user delete policy exists. Completed.
- Queued replay records `failed`, `running`, `succeeded`, and `conflict` statuses when tracking is available. Completed.
- Tracking failure does not block product data replay. Completed.

Remaining related work is server-side transactional mutation application and per-row merge semantics.

### Task 026.6 - Migration Cache Refresh

After successful local-to-cloud migration:

- Refresh cloud snapshot.
- Replace the active user-scoped local cache.
- Update visible UI without requiring sign-out or refresh.

Acceptance:

- User sees migrated data immediately after success.
- Retry remains duplicate-safe.

### Task 026.7 - Cloud Import Job Tracking

Record JSON imports in `import_jobs`, not only local audit.

Acceptance:

- JSON import creates running/succeeded/failed job rows.
- Summary includes counts and conflict mode.
- Repeated imports can be diagnosed.

### Task 026.8 - Export Freshness Guarantee

Before cloud-mode export:

- Either export latest confirmed cloud snapshot.
- Or clearly label export as local cache backup with last sync status.

Acceptance:

- User understands whether export includes cloud-confirmed data.

### Task 026.9 - Guided Conflict Resolution

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
| RLS design | Strong and live-validated | 38 live checks passed with anon/publishable key only, including `sync_mutations` |
| Frontend repository boundary | Strong foundation | App uses `appRepository` consistently |
| Cloud write confidence | Partial | Failed writes are queued/replayed with snapshot conflict detection and best-effort server mutation tracking |
| Local cache isolation | Partial to strong | User-scoped keys exist; live switching validation needed |
| Migration retry safety | Good for product rows | Not transactional; cache refresh missing |
| Export/import cloud awareness | Partial | Active repo used, but sync completion not guaranteed |
| Sync error UX | Partial | App shell and Account screen show failure/offline/queued/conflict/retry state |
| Conflict handling | Partial | Import conflicts and queued replay conflicts are visible; merge UX still missing |
| Production readiness | Not yet | RLS, visible sync status, queued replay, conflict detection, and mutation tracking are improved; needs browser switching validation, transactional mutation application, merge UX, and migration/import hardening |

## Summary

Sadhana OS has a good authenticated cloud persistence foundation. The schema and RLS design are sensible, the frontend has a repository boundary, user-scoped local cache is in place, and local migration is retry-safe for product rows.

Task 026.1 live RLS/User A-User B isolation validation is complete and passed with 32 checks. This materially improves confidence that the Supabase development/staging project enforces core user isolation using normal authenticated sessions and the public anon/publishable key.

Task 026.2 visible sync status and in-memory retry are implemented. Hydration and background write failures now have user-facing status instead of remaining console-only.

Task 026.3 durable queued-write replay is implemented. Failed cloud writes now persist as a user-scoped coalesced snapshot and replay on retry or browser reconnect.

Task 026.4 cross-device conflict and idempotency baseline is implemented. Queued writes now carry stable client mutation IDs, compare base/current cloud snapshots before replay, and block overwrite when another device changed cloud data.

Task 026.5 server-side idempotency and mutation tracking is implemented. Queued snapshot mutations now have an RLS-protected `sync_mutations` status record keyed by `(user_id, client_mutation_id)`.

The remaining work is about end-to-end product confidence and operational safety: live browser account-switching validation, transactional mutation application, guided conflict resolution, cloud/local reconciliation, and production-grade migration/import diagnostics.

Task 026 should remain open until the full cloud persistence experience is validated through the app UI and users can recover from sync failures and conflicts across browser restarts and cross-device edits.
