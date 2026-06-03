# 12 - Cloud Data Model

## Purpose

This document defines the v0.2 Supabase Postgres schema for authenticated, user-owned Sadhana OS data.

The MVP localStorage model remains supported during migration. Cloud persistence must preserve existing local IDs, archived records, audit history, daily scores, journal content, export/import behavior, and schema versioning.

## Design Principles

- Every user-owned row has an owner boundary.
- Row-level security is enabled before client access.
- Normal app users archive instead of delete.
- Audit rows are append-only.
- LocalStorage migration preserves existing IDs and timestamps where valid.
- JSON export remains a first-class portability feature.
- The schema favors relational integrity for categories, habits, daily entries, journals, and audit history.
- Flexible values, scores, and audit snapshots use `jsonb` where the product intentionally supports multiple shapes.

## Tables

### `profiles`

One row per authenticated user. The `id` equals `auth.users.id`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `display_name` | `text` | Optional |
| `timezone` | `text` | Defaults to `UTC`, confirmed during onboarding |
| `onboarding_completed_at` | `timestamptz` | Optional |
| `created_at` | `timestamptz` | Server default |
| `updated_at` | `timestamptz` | Trigger-maintained |

### `user_settings`

One row per authenticated user for app-level settings.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `uuid` | Primary key |
| `schema_version` | `text` | Starts at `0.2` |
| `week_starts_on` | `int` | 0-6 |
| `reminder_enabled` | `boolean` | Future-ready |
| `reminder_time` | `time` | Optional |
| `created_at` | `timestamptz` | Server default |
| `updated_at` | `timestamptz` | Trigger-maintained |

### `categories`

User-owned practice dimensions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Preserves local category IDs during migration |
| `user_id` | `uuid` | Owner |
| `name` | `text` | Required |
| `icon` | `text` | Lucide icon name |
| `color` | `text` | Hex color |
| `display_order` | `int` | User-defined order |
| `is_archived` | `boolean` | Archive instead of delete |
| `created_at` | `timestamptz` | Preserved on migration where valid |
| `updated_at` | `timestamptz` | Preserved on migration where valid |

### `habits`

User-owned practices inside categories.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Preserves local habit IDs during migration |
| `user_id` | `uuid` | Owner |
| `category_id` | `uuid` | Parent category |
| `name` | `text` | Required |
| `tracking_type` | `text` | Existing tracking type vocabulary |
| `display_order` | `int` | Order within category |
| `is_archived` | `boolean` | Archive instead of delete |
| `created_at` | `timestamptz` | Preserved on migration where valid |
| `updated_at` | `timestamptz` | Preserved on migration where valid |

### `daily_entries`

One aggregate row per user-local date.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `entry_date` | `date` | User-local day |
| `overall_score` | `numeric(5,2)` | 0-100 |
| `category_scores` | `jsonb` | Snapshot keyed by category ID |
| `created_at` | `timestamptz` | Server default |
| `updated_at` | `timestamptz` | Trigger-maintained |

Unique key: `(user_id, entry_date)`.

### `daily_habit_entries`

Normalized habit value rows for a user-local day.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `entry_date` | `date` | User-local day |
| `habit_id` | `uuid` | Practice being recorded |
| `value` | `jsonb` | Boolean, number, or string |
| `created_at` | `timestamptz` | Server default |
| `updated_at` | `timestamptz` | Trigger-maintained |

Unique key: `(user_id, entry_date, habit_id)`.

### `journal_entries`

One journal row per user-local date.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `entry_date` | `date` | User-local day |
| `mood` | `text` | Optional |
| `gratitude` | `text` | Optional |
| `spiritual_insight` | `text` | Optional |
| `trigger_observed` | `text` | Optional |
| `lesson_learned` | `text` | Optional |
| `content` | `text` | Required, may be empty |
| `created_at` | `timestamptz` | Preserved on migration where valid |
| `updated_at` | `timestamptz` | Preserved on migration where valid |

Unique key: `(user_id, entry_date)`.

### `audit_log_entries`

Append-only audit trail.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Preserves local audit IDs during migration where valid |
| `user_id` | `uuid` | Owner |
| `timestamp` | `timestamptz` | Event timestamp |
| `action_type` | `text` | Existing audit action vocabulary |
| `entity_type` | `text` | `category`, `habit`, or `system` |
| `entity_id` | `text` | Entity ID or `system` |
| `old_value` | `jsonb` | Optional |
| `new_value` | `jsonb` | Optional |
| `note` | `text` | Optional human context |
| `source` | `text` | `client`, `migration`, or `server` |
| `created_at` | `timestamptz` | Server default |

Normal users may select and insert their own audit rows. They may not update or delete audit rows.

### `import_jobs`

Tracks JSON imports and localStorage-to-cloud migrations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `source` | `text` | `localStorage` or `json` |
| `mode` | `text` | `merge` or `overwrite` |
| `status` | `text` | `pending`, `running`, `succeeded`, or `failed` |
| `summary` | `jsonb` | Counts, conflicts, checksums |
| `error_message` | `text` | Optional |
| `created_at` | `timestamptz` | Server default |
| `completed_at` | `timestamptz` | Optional |

### `sync_devices`

Future-ready device diagnostics for offline sync.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `device_label` | `text` | Optional |
| `last_seen_at` | `timestamptz` | Last active timestamp |
| `created_at` | `timestamptz` | Server default |

### `sync_mutations`

RLS-protected idempotency and status records for queued client cloud writes.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `client_mutation_id` | `text` | Stable client-generated idempotency key |
| `mutation_type` | `text` | Currently `replaceSnapshot` |
| `status` | `text` | `pending`, `running`, `succeeded`, `failed`, or `conflict` |
| `attempt_count` | `int` | Number of replay attempts observed by the client |
| `last_error` | `text` | Sanitized operational error message |
| `metadata` | `jsonb` | Operational metadata only; no snapshot contents or journal text |
| `created_at` | `timestamptz` | Server default |
| `updated_at` | `timestamptz` | Trigger-maintained |
| `completed_at` | `timestamptz` | Set when replay succeeds |

Unique key: `(user_id, client_mutation_id)`.

Normal users may select, insert, and update their own mutation rows. They may not delete mutation history.

## Row-Level Security

All user-owned tables have RLS enabled.

Policy pattern:

```sql
using (user_id = auth.uid())
with check (user_id = auth.uid())
```

`profiles` uses `id = auth.uid()` because the profile ID is the user ID.

Normal users do not receive delete policies. Account deletion will be handled by a privileged server-side workflow.

## Migration Notes

The localStorage migration should:

1. Validate local data before writing to cloud tables.
2. Preserve category, habit, and audit IDs where they are valid UUIDs.
3. Preserve dates and timestamps where they parse cleanly.
4. Insert aggregate daily rows into `daily_entries`.
5. Insert per-habit values into `daily_habit_entries`.
6. Insert journal rows into `journal_entries`.
7. Insert local audit history into `audit_log_entries` with `source = 'migration'`.
8. Insert an `import_jobs` row with counts and final status.
9. Keep localStorage untouched after migration unless the user explicitly clears it.

## Migration File

The initial migration is:

```text
supabase/migrations/20260601000000_initial_schema.sql
```

The sync mutation tracking migration is:

```text
supabase/migrations/20260603000000_add_sync_mutations.sql
```
