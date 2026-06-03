# Task 026.4 - Cross-Device Conflict And Idempotency Baseline

## Status

Implemented

## Goal

Prevent queued local replay from overwriting newer cloud data when another device changed the account after the queued write was created.

## Scope

- Add stable client-side mutation IDs to queued cloud writes.
- Store the last confirmed cloud snapshot as the queued write base.
- Load the current cloud snapshot before replaying a queued write.
- Block queued replay when cloud changed since the queued write base snapshot.
- Show a conflict state in the app shell and Account screen.
- Keep the queued local snapshot intact when conflict is detected.

## Out Of Scope

- Do not change Supabase schema or RLS policies.
- Do not add a server-side idempotency table.
- Do not add `client_mutation_id` database columns.
- Do not implement merge/conflict-resolution UI.
- Do not overwrite newer cloud data after conflict detection.
- Do not add dependencies.

## Files

Created:

```text
src/lib/cloudConflict.ts
src/lib/cloudConflict.test.ts
tasks/026-cross-device-conflict-idempotency-baseline.md
```

Modified:

```text
src/lib/cloudMutationQueue.ts
src/lib/cloudMutationQueue.test.ts
src/cloud/CloudSyncProvider.tsx
src/cloud/CloudSyncProvider.test.tsx
src/components/cloud/CloudSyncStatusBanner.tsx
src/components/cloud/CloudSyncStatusBanner.test.tsx
src/components/settings/AccountScreen.tsx
src/components/settings/AccountScreen.test.tsx
docs/14-sync-and-migration.md
docs/26-cloud-persistence-validation-audit.md
```

## Acceptance Criteria

- [x] Queued mutations have a stable `clientMutationId`.
- [x] Queued mutations store a base cloud snapshot when available.
- [x] Replay succeeds when current cloud still matches the base snapshot.
- [x] Replay is blocked when current cloud differs from the base snapshot.
- [x] Conflict state is visible in app shell and Account screen.
- [x] Queued local changes remain stored after conflict detection.
- [x] No Supabase schema/RLS changes are introduced.

## Limitations

- Conflict detection is snapshot-level.
- There is no merge UI yet.
- There is no server-side `client_mutation_id` enforcement yet.
- There is no idempotency table yet.
- Users can see conflict, but guided resolution remains future work.
