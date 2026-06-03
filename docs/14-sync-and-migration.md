# 14 - Sync And Migration

## Purpose

This document defines the v0.2 path from localStorage-only MVP data to authenticated cloud persistence.

## Migration Principles

- Migration is explicit, never automatic.
- LocalStorage is never deleted during migration.
- Existing export/import remains available.
- Existing timestamps are preserved where valid.
- Local tracker IDs are treated as source IDs and remapped into deterministic user-scoped cloud UUIDs.
- Audit history is preserved.
- The first client-side migration mode is merge/upsert.
- Hard deletion and destructive overwrite are not part of client migration.

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

1. Create an `import_jobs` row with `status = running`.
2. Upsert categories.
3. Upsert habits.
4. Upsert daily aggregate entries.
5. Upsert daily habit value entries.
6. Upsert journal entries.
7. Upsert audit log entries with `source = migration`.
8. Update the import job to `status = succeeded`.

If any write fails:

1. Update the import job to `status = failed` when possible.
2. Keep localStorage untouched.
3. Show a recoverable error message.

Retry behavior:

- Product rows target the same deterministic IDs on retry.
- Merge/upsert writes update the same cloud rows instead of creating duplicates.
- Each retry still creates a new `import_jobs` row so attempts remain auditable.

## Conflict Model

v0.2 migration uses merge/upsert by cloud keys:

- Categories: `(user_id, id)`
- Habits: `(user_id, id)`
- Daily entries: `(user_id, entry_date)`
- Daily habit entries: `(user_id, entry_date, habit_id)`
- Journal entries: `(user_id, entry_date)`
- Audit logs: `(user_id, id)`

Destructive overwrite is deferred because normal users intentionally do not have delete policies on product data.

Client-side migration is resumable for product rows after a partially completed upload because row IDs are deterministic for a given user and source snapshot. A later server-assisted migration can still add richer source-ID metadata and transactional orchestration if needed.

## Future Offline Sync

Task 017 introduced a cloud repository. Task 026.3 adds the first durable reconnect replay layer.
Task 026.4 adds the first cross-device conflict detection and client-side idempotency baseline.

Current Task 026.3 behavior:

- Failed cloud writes are stored in a user-scoped durable queue.
- The queue coalesces repeated writes into the latest local snapshot.
- Manual retry replays the queued snapshot through `replaceSnapshot`.
- Browser `online` events replay queued changes automatically.
- The app shell and Account screen show queued pending changes.
- Successful replay clears the queued mutation.

Current limitations:

- The queue stores one `replaceSnapshot` mutation per user instead of per-row mutations.
- Storage currently uses the existing localStorage persistence layer.
- Replay checks the current cloud snapshot before writing when a base snapshot is available.
- Cross-device changes block replay and keep local changes queued.
- Server-side idempotency keys are not yet enforced.
- Conflict resolution UI is not yet implemented.

Later offline sync should add:

- IndexedDB cache.
- `client_mutation_id`.
- Server-side idempotency table or columns.
- Conflict diagnostics.
- Last-write-wins for daily habit values.
- Explicit conflict prompts for tracker configuration changes.
