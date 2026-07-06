# Task 036 - Cloud Sync Status Polish and Action Consistency

Status: Implemented

Date: 2026-07-06

## Goal

Make cloud sync status labels and actions consistent across the app without changing cloud sync behavior.

## Problem

Cloud sync surfaced through several UI areas:

- Global cloud sync banner
- Settings > Account cloud sync panel
- Settings > Data backup trust panel
- Local data migration panel

The underlying behavior worked, but some labels differed across surfaces, such as `Cloud sync needs attention`, `Sync failed`, `Unsynced changes pending`, and `Retry cloud sync`.

## Scope

Implemented:

- Added shared cloud sync status copy helpers.
- Standardized user-facing status labels:

```text
Synced
Syncing
Offline
Needs retry
Needs review
Local only
```

- Standardized action labels:

```text
Retry sync
Refresh cloud data
Review conflict
```

- Updated the global cloud sync banner to use shared labels.
- Updated Settings > Account cloud sync panel to use shared labels.
- Updated Settings > Data backup trust panel pending titles to use shared labels.
- Updated local migration retry guidance to use `Retry sync`.
- Added tests for shared cloud sync status copy and updated affected component tests.

## Non-Goals

- Do not change cloud sync engine behavior.
- Do not add conflict resolution UX.
- Do not change auth, Supabase schema, RLS, migration upload behavior, or export/import data formats.
- Do not redesign the status surfaces.
- Do not add dependencies.

## Files

Created:

```text
src/lib/cloudSyncStatusCopy.ts
src/lib/cloudSyncStatusCopy.test.ts
tasks/036-cloud-sync-status-polish.md
```

Modified:

```text
src/components/cloud/CloudSyncStatusBanner.tsx
src/components/cloud/CloudSyncStatusBanner.test.tsx
src/components/settings/AccountScreen.tsx
src/components/settings/AccountScreen.test.tsx
src/components/settings/DataScreen.tsx
src/components/settings/DataScreen.test.tsx
src/components/settings/LocalMigrationPanel.tsx
```

## Acceptance Criteria

- [x] Global banner uses standard cloud sync labels.
- [x] Account cloud sync panel uses the same labels and retry action.
- [x] Data backup trust panel uses the same pending-state labels while preserving backup-specific descriptions.
- [x] Local migration guidance references `Retry sync`.
- [x] Existing cloud sync behavior remains unchanged.
- [x] Tests cover status copy and updated UI labels.

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```
