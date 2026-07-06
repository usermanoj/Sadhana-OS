# 32 - Cloud-Aware Export/Import Hardening

Date: 2026-07-06

Purpose: record the Settings > Data hardening that makes backup and restore operations explicit about cloud-confirmation state.

This document does not mark export/import fully production-ready. It records the current client-side trust improvements and the next production-grade steps.

## Problem

Sadhana OS preserves JSON export/import and CSV export from the original local MVP.

After cloud persistence was added, those actions still worked through the repository boundary, but the Data screen did not clearly tell users whether the exported data was:

- Local-only device data.
- Cloud-confirmed data.
- Local-cache data with queued or failed cloud sync.

For a premium B2C wellness product, backup copy needs to be honest. Users should know when a backup is cloud-confirmed and when it may only reflect the current device cache.

## Implemented Behavior

Settings > Data now shows a backup confidence panel.

### Local-Only Mode

The app shows:

```text
Local-only backup
```

Exports are described as coming from the current device.

### Cloud Synced Mode

When cloud sync is confirmed, the app shows:

```text
Cloud-confirmed backup
```

If available, the last cloud confirmation time is shown. Users can refresh cloud data before exporting.

### Pending Or Problem Cloud States

When sync is queued, offline, failed, in conflict, preparing, syncing, or retrying, the app shows:

```text
Local cache has unconfirmed changes
```

or:

```text
Cloud sync in progress
```

Exports remain available, but success messages explain that the file was produced from local cache and cloud confirmation is pending.

## Refresh Before Export

Cloud users can use:

```text
Refresh cloud data
```

The action calls the existing `useCloudSync().refreshFromCloud()` path.

Refresh is disabled when:

- The app is local-only.
- The browser is offline.
- Cloud sync is already preparing, syncing, or retrying.
- There are pending queued writes.
- Cloud conflict state needs review first.

If refresh succeeds, the app tells the user exports now use the latest confirmed cloud data.

## Import Messaging

Import behavior remains unchanged:

- JSON import still uses existing parse/validate/conflict detection.
- Users still choose merge or overwrite through the existing confirmation dialog.
- Import still writes through the active repository.

The success message is now cloud-aware:

- Local-only: imported on this device.
- Cloud-confirmed start state: imported and cloud sync will confirm shortly.
- Pending/offline/problem state: imported into local cache and cloud confirmation is pending.

## What Did Not Change

This task did not change:

- JSON export schema.
- CSV format.
- Import merge behavior.
- Import overwrite behavior.
- Supabase schema.
- RLS policies.
- Cloud repository write semantics.
- Auth behavior.
- Dependencies.

## Current Trust Boundary

The current implementation improves user-facing clarity, but it is still client-orchestrated.

The Data screen can tell the user whether the active app state is cloud-confirmed according to the current sync status, but it does not yet attach cloud-confirmation metadata to the exported JSON file itself.

## Recommended Future Work

Production-grade import/export should eventually add:

- Export metadata that records cloud confirmation state and timestamp in the JSON payload.
- Refresh-before-export mode that can require a successful cloud refresh for cloud-confirmed exports.
- Server-side import jobs.
- Transactional or resumable import processing.
- Import job audit visibility.
- Clear support diagnostics without exposing journal or practice content.

## Validation

Added component coverage for:

- Local-only export copy.
- Cloud-confirmed export copy.
- Refresh-from-cloud action.
- Pending cloud-write warning.
- Cloud-aware CSV export message.
- Cloud-aware import success message.
- Offline/unconfirmed import message.
- Existing invalid JSON rejection.

Full verification should include:

```bash
npm test -- src/components/settings/DataScreen.test.tsx
npm run typecheck
npm test
npm run build
npm run test:e2e
```
