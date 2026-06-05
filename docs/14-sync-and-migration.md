# 14 - Sync And Migration

## Purpose

This document defines the v0.2 path from localStorage-only MVP data to authenticated cloud persistence.

## Migration Principles

- Migration is explicit, never automatic.
- Migration requires review before upload; the first action must not write cloud rows.
- LocalStorage is never deleted during migration.
- Existing export/import remains available.
- Existing timestamps are preserved where valid.
- Local tracker IDs are treated as source IDs and remapped into deterministic user-scoped cloud UUIDs.
- Audit history is preserved.
- The first client-side migration mode is merge/upsert.
- Hard deletion and destructive overwrite are not part of client migration.
- Root legacy localStorage is a shared device backup with no owner metadata. After a backup is successfully copied to one cloud account, the same backup is not offered to another account by default.
- Migration into a cloud account that already has practice data is blocked by default to prevent accidental account mixing.
- If copied local custom groups are detected after an earlier accidental migration, the app may offer an archive-only cleanup action.

## Local Data Detection

The migration planner reads the repository snapshot:

- `version`
- `categories`
- `dailyEntries`
- `journalEntries`
- `auditLogs`

Local data exists when any of these contain user-owned content:

- One or more categories.
- One or more daily entries.
- One or more journal entries.
- One or more audit entries.

The default seed data counts as local data because it represents the user's current tracker configuration.

## Migration Plan

The app builds a deterministic migration plan with:

- User ID.
- Source schema version.
- Summary counts.
- Local data checksum.
- Cloud table rows for categories, habits, daily entries, daily habit entries, journal entries, and audit log entries.

The local checksum is deterministic for the source snapshot. Cloud primary keys are also deterministic per user and local source record so a failed migration can be retried without creating duplicate cloud rows. The same local source record maps to different cloud IDs for different users.

When migrating unchanged legacy starter-template rows, the planner first checks the existing cloud snapshot. If the same starter category already exists in cloud under cloud-generated starter IDs, the legacy local starter category and habit IDs are mapped to the existing cloud IDs. This prevents duplicate active copies of default categories such as `8 Limbs of Yoga`.

## Cloud Mapping

| Local Data | Cloud Table |
|------------|-------------|
| `Category[]` | `categories` |
| `Category.subComponents[]` | `habits` |
| `DailyEntry` aggregate | `daily_entries` |
| `DailyEntry.completions` | `daily_habit_entries` |
| `JournalEntry` | `journal_entries` |
| `AuditLogEntry[]` | `audit_log_entries` |
| Migration run | `import_jobs` |

## ID Remapping

During client migration, local category, habit, daily, journal, and audit row IDs are remapped to deterministic cloud UUIDs derived from:

- A fixed migration namespace.
- The authenticated user ID.
- The source record type.
- The local source key.

The migration plan preserves relationships by translating:

- Category IDs in `categories`.
- Habit IDs and parent category IDs in `habits`.
- `DailyEntry.categoryScores` category keys.
- `DailyEntry.completions` habit keys.
- Audit `entity_id` values for categories and habits.
- Known ID references inside audit `old_value` and `new_value` JSON.

The local browser backup remains untouched. Remapping only affects cloud rows created by the migration plan.

This strategy keeps retries idempotent for the same user and keeps migrated rows collision-resistant across users.

## Upload Flow

1. User reviews the local backup summary.
2. The app loads the current cloud snapshot for the signed-in account.
3. The app blocks migration when the target cloud account already has user-created practice data.
4. If previously copied local custom groups are detected, the app can archive those groups without hard deletion.
5. If the target account has no user-created practice data, the user explicitly confirms copying the reviewed local backup.
6. Create an `import_jobs` row with `status = running`.
7. Upsert categories.
8. Upsert habits.
9. Upsert daily aggregate entries.
10. Upsert daily habit value entries.
11. Upsert journal entries.
12. Insert missing audit log entries with `source = migration`; duplicate audit IDs are ignored because audit rows are append-only.
13. Update the import job to `status = succeeded`.
14. Record a local completion marker keyed by backup checksum and cloud user ID.
15. Refresh the active user-scoped cloud cache from Supabase.
16. Rerender the app so migrated data is visible without sign-out or browser refresh.

If any write fails:

1. Update the import job to `status = failed` when possible.
2. Keep localStorage untouched.
3. Show a recoverable error message.

Retry behavior:

- Product rows target the same deterministic IDs on retry.
- Merge/upsert writes update the same cloud rows instead of creating duplicates.
- Audit log rows are append-only. Retries use duplicate-ignore semantics instead of updating existing audit rows, which keeps the browser aligned with RLS.
- Each retry still creates a new `import_jobs` row so attempts remain auditable.
- A successful migration records a local completion marker. If the same root backup checksum was already copied to a different cloud user, the panel blocks copying it again to avoid mixing accounts on a shared browser/device.
- A successful retry refreshes the active user-scoped cache after upload.
- Accidental copied local custom groups are archived, not hard-deleted, and generate audit history.

Starter-template duplicate repair:

- If a prior migration already created duplicate active starter categories, the repair step archives duplicate starter rows before upload and checks again after upload.
- The active copy with daily usage is kept to preserve visible practice history.
- Duplicate rows are archived, not hard-deleted.
- Repair writes audit log entries for archived duplicate categories.
- Repair audit rows are inserted with duplicate-ignore semantics so retries do not try to update audit history.

## Conflict Model

v0.2 migration uses merge/upsert by cloud keys:

- Categories: `(user_id, id)`
- Habits: `(user_id, id)`
- Daily entries: `(user_id, entry_date)`
- Daily habit entries: `(user_id, entry_date, habit_id)`
- Journal entries: `(user_id, entry_date)`
- Audit logs: `(user_id, id)` with duplicate conflicts ignored instead of updated

Destructive overwrite is deferred because normal users intentionally do not have delete policies on product data.

Client-side migration is resumable for product rows after a partially completed upload because row IDs are deterministic for a given user and source snapshot. Audit history remains append-only on retry. A later server-assisted migration can still add richer source-ID metadata and transactional orchestration if needed.

## Future Offline Sync

Task 017 introduced a cloud repository. Task 026.3 adds the first durable reconnect replay layer.
Task 026.4 adds the first cross-device conflict detection and client-side idempotency baseline.
Task 026.5 adds RLS-safe server-side mutation tracking through `sync_mutations`.
Task 026.6 refreshes the active user-scoped cache after local-to-cloud migration succeeds.
Task 026.6.1 prevents and repairs duplicate starter-template rows during local-to-cloud migration.

Current Task 026.3 behavior:

- Failed cloud writes are stored in a user-scoped durable queue.
- The queue coalesces repeated writes into the latest local snapshot.
- Manual retry replays the queued snapshot through `replaceSnapshot`.
- Browser `online` events replay queued changes automatically.
- The app shell and Account screen show queued pending changes.
- Successful replay clears the queued mutation.
- Queued mutations are recorded in `sync_mutations` when tracking is available.
- The server-side idempotency key is `(user_id, client_mutation_id)`.

Current limitations:

- The queue stores one `replaceSnapshot` mutation per user instead of per-row mutations.
- Storage currently uses the existing localStorage persistence layer.
- Replay checks the current cloud snapshot before writing when a base snapshot is available.
- Cross-device changes block replay and keep local changes queued.
- Server-side mutation tracking is best-effort and records status, not transactional mutation application.
- Conflict resolution UI is not yet implemented.

Later offline sync should add:

- IndexedDB cache.
- Per-row mutation records.
- Server-side transactional mutation application.
- Conflict diagnostics.
- Last-write-wins for daily habit values.
- Explicit conflict prompts for tracker configuration changes.
