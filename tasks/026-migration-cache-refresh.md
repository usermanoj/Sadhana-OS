# Task 026.6 - Migration Cache Refresh

## Status

Implemented

## Goal

After a successful localStorage-to-cloud migration, refresh the active signed-in user's cloud-backed local cache so migrated data appears immediately without sign-out, reload, or a second manual sync action.

## Scope

- Expose a cloud sync refresh action through `useCloudSync`.
- Hydrate the active user-scoped local cache from Supabase after migration upload succeeds.
- Rerender the app after the refreshed snapshot is stored locally.
- Preserve localStorage legacy backup data.
- Keep migration success visible even if the post-upload cache refresh fails.
- Avoid overwriting queued unsynced local changes during refresh.

## Out Of Scope

- Do not change Supabase schema or RLS policies.
- Do not change migration ID remapping.
- Do not add server-side transactional migration.
- Do not add JSON import job tracking.
- Do not add conflict-resolution UI.
- Do not remove export/import.
- Do not add dependencies.

## Files

Created:

```text
tasks/026-migration-cache-refresh.md
```

Modified:

```text
src/cloud/CloudSyncProvider.tsx
src/cloud/CloudSyncProvider.test.tsx
src/components/settings/LocalMigrationPanel.tsx
src/components/settings/LocalMigrationPanel.test.tsx
src/components/settings/AccountScreen.test.tsx
src/components/cloud/CloudSyncStatusBanner.test.tsx
docs/14-sync-and-migration.md
docs/26-cloud-persistence-validation-audit.md
```

## Behavior

When `LocalMigrationPanel` finishes `uploadLocalMigrationPlan` successfully:

1. It calls `useCloudSync().refreshFromCloud()`.
2. `CloudSyncProvider` loads the latest cloud snapshot.
3. The active user-scoped local repository is replaced with that snapshot.
4. The app remounts through the existing repository revision key.
5. The user sees migrated data without logging out or refreshing the browser.

If refresh fails after upload:

- The migration is still reported as copied to cloud.
- A warning is logged.
- Cloud sync state moves to a retryable failure state.
- The user can use the existing Retry cloud sync action.

If queued unsynced local changes exist:

- Refresh is blocked to avoid hiding pending local work.
- Cloud sync remains in a queued/retryable state.

## Acceptance Criteria

- [x] Successful migration calls cloud cache refresh.
- [x] Cloud refresh replaces the active user-scoped local cache.
- [x] App rerenders with the refreshed cloud snapshot.
- [x] Migration success remains visible if post-upload refresh fails.
- [x] Refresh does not run over queued unsynced local changes.
- [x] Legacy localStorage backup remains untouched.
- [x] No schema or RLS changes are introduced.

## Limitations

- Migration upload remains client-orchestrated and non-transactional.
- Refresh relies on current Supabase reads and existing cloud repository mapping.
- Full browser validation with real User A/User B account switching is still recommended.
