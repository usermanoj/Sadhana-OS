# Task 026.5 - Server-Side Idempotency And Mutation Tracking

## Status

Implemented

## Goal

Add an RLS-protected cloud mutation record so queued client writes have a stable server-side idempotency key and operational status history.

## Scope

- Add a Supabase migration for `sync_mutations`.
- Enforce user ownership with RLS.
- Add unique `(user_id, client_mutation_id)` idempotency protection.
- Record queued replay statuses from the frontend:
  - `failed`
  - `running`
  - `succeeded`
  - `conflict`
- Keep mutation metadata operational only; do not store snapshot contents, journal text, tracker names, or habit values.
- Keep product data sync working even if mutation-status tracking fails.
- Extend the live RLS validation script to cover `sync_mutations`.

## Out Of Scope

- Do not add per-row mutation application.
- Do not add a server-side RPC for transactional snapshot replacement.
- Do not add merge/conflict-resolution UI.
- Do not add retry backoff.
- Do not change existing product table RLS policies.
- Do not add dependencies.
- Do not remove local queueing.

## Files

Created:

```text
supabase/migrations/20260603000000_add_sync_mutations.sql
tasks/026-server-side-idempotency-mutation-tracking.md
```

Modified:

```text
scripts/validate-cloud-rls.mjs
src/cloud/CloudSyncProvider.tsx
src/cloud/CloudSyncProvider.test.tsx
src/lib/cloudRepository.ts
src/lib/cloudRepository.test.ts
src/lib/cloudSync.test.ts
src/lib/supabaseSchema.test.ts
docs/12-cloud-data-model.md
docs/14-sync-and-migration.md
docs/26-cloud-persistence-validation-audit.md
```

## Data Model

`sync_mutations` stores one row per user-owned client mutation ID.

Important columns:

```text
user_id
client_mutation_id
mutation_type
status
attempt_count
last_error
metadata
completed_at
```

Unique key:

```text
(user_id, client_mutation_id)
```

Normal users can select, insert, and update only their own rows. No normal-user delete policy exists.

## Frontend Behavior

When a cloud write fails, the existing durable local queue still stores one coalesced `replaceSnapshot` mutation.

The app now also attempts to record:

- `failed` when the original cloud write is queued after failure.
- `running` when a queued replay starts.
- `succeeded` when queued replay finishes.
- `conflict` when replay is blocked because cloud changed since the queued base snapshot.

Mutation tracking is best-effort. If the tracking write fails, product data replay can still complete and the queue can still clear after product data sync succeeds.

## Acceptance Criteria

- [x] `sync_mutations` table exists in a forward migration.
- [x] `sync_mutations.user_id` references the authenticated user.
- [x] RLS is enabled for `sync_mutations`.
- [x] Own-row select, insert, and update policies exist.
- [x] No normal-user delete policy exists.
- [x] `(user_id, client_mutation_id)` is unique.
- [x] Queued replay records `running` and `succeeded` when tracking is available.
- [x] Failed cloud writes record `failed` when tracking is available.
- [x] Conflict detection records `conflict` when tracking is available.
- [x] Tracking failure does not break product data replay.
- [x] Tests cover schema, mapping, and provider replay behavior.

## Limitations

- This is mutation tracking, not transactional server-side mutation application.
- The client still performs product table upserts directly.
- The durable queue still stores one coalesced snapshot mutation per user.
- There is no per-row conflict merge.
- There is no automatic retry backoff.
- The development Supabase project has been updated and live validation passed for `sync_mutations`.
- Other Supabase environments must apply the new migration before they can validate `sync_mutations`.
