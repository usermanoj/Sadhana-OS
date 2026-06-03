# Task 026.3 - Durable Mutation Queue And Reconnect Replay

## Status

Implemented

## Goal

Persist failed cloud writes so signed-in users do not lose unsynced local changes when the browser refreshes, closes, or reconnects later.

## Scope

- Add a user-scoped durable cloud mutation queue.
- Coalesce failed writes into the latest local snapshot.
- Replay queued writes through `CloudDataGateway.replaceSnapshot`.
- Replay manually through the existing retry action.
- Replay automatically when the browser emits an `online` event.
- Surface queued pending changes in the app shell and Account screen.

## Out Of Scope

- Do not change Supabase schema or RLS policies.
- Do not add service-role access.
- Do not implement cross-device conflict resolution.
- Do not implement per-row merge semantics.
- Do not change export/import behavior.
- Do not add dependencies.

## Files

Created:

```text
src/lib/cloudMutationQueue.ts
src/lib/cloudMutationQueue.test.ts
tasks/026-durable-mutation-queue-reconnect-replay.md
```

Modified:

```text
src/lib/storage.ts
src/lib/storage.test.ts
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

- [x] Failed background cloud writes are stored durably by user ID.
- [x] Repeated failed writes coalesce into the latest snapshot.
- [x] Queued writes survive provider remount/browser refresh.
- [x] Manual retry replays the queued snapshot and clears the queue on success.
- [x] Browser `online` event replays queued changes.
- [x] App shell and Account screen show queued pending changes.
- [x] Existing local-first behavior is preserved.

## Limitations

- The queue stores one coalesced `replaceSnapshot` mutation per user.
- Storage currently uses the existing localStorage persistence layer, not IndexedDB.
- Task 026.4 adds snapshot-level conflict detection before replay.
- Cross-device conflicts are not merged yet.
- Server-side idempotency keys are not enforced yet.
