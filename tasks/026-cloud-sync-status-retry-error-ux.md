# Task 026.2 - Cloud Sync Status, Retry, And Error UX

## Status

Implemented

## Goal

Make cloud sync state visible to signed-in users so hydration failures and background write failures do not remain console-only.

## Scope

- Add a typed cloud sync status context.
- Show sync status in the app shell for active sync, offline, retrying, and failed states.
- Show detailed sync status in Settings > Account.
- Add a retry action for the latest in-memory sync failure.
- Preserve the current local-first repository behavior.

## Out Of Scope

- Do not change Supabase schema or RLS policies.
- Do not add a durable offline mutation queue.
- Do not implement conflict resolution.
- Do not implement server-assisted migration.
- Do not change authentication providers.
- Do not change export/import behavior.
- Do not add dependencies.

## Files

Modified:

```text
src/lib/cloudSync.ts
src/lib/cloudSync.test.ts
src/cloud/CloudSyncProvider.tsx
src/cloud/CloudSyncProvider.test.tsx
src/components/layout/AppShell.tsx
src/components/settings/AccountScreen.tsx
src/components/settings/AccountScreen.test.tsx
```

Created:

```text
src/components/cloud/CloudSyncStatusBanner.tsx
src/components/cloud/CloudSyncStatusBanner.test.tsx
tasks/026-cloud-sync-status-retry-error-ux.md
```

## Acceptance Criteria

- [x] Initial cloud hydration failure is visible to the user.
- [x] Background cloud write failure is visible to the user.
- [x] User can retry the latest in-memory cloud sync failure.
- [x] App shell shows a calm sync status banner for failed/offline/syncing/retrying states.
- [x] Account screen shows detailed sync status and retry action.
- [x] Local-first writes continue to preserve existing app behavior.
- [x] No Supabase schema, RLS, dependency, auth, export, or import changes are introduced.

## Limitations

- Retry is in-memory only.
- Failed changes are not persisted as a durable mutation queue.
- Cross-device conflict resolution is not implemented.
- Task 026.3 adds a dedicated queued retry record for failed cloud writes.

These limitations are expected and should be addressed by the next hardening tasks.
