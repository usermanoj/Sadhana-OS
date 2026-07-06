# Task 032 - Cloud-Aware Export/Import Hardening

Status: Implemented

Date: 2026-07-06

## Goal

Improve user trust in Settings > Data by making export/import behavior explicit about whether the backup is cloud-confirmed or based on the local cache.

## Scope

Implemented:

- Added cloud-aware backup confidence messaging to Settings > Data.
- Shows whether exports are local-only, cloud-confirmed, or local-cache-backed with unconfirmed cloud changes.
- Shows last confirmed cloud sync time when available.
- Added a manual `Refresh cloud data` action before export when cloud sync is available.
- Disables cloud refresh when queued/offline/conflict/in-progress states make refresh misleading or unsafe.
- Updated JSON/CSV export success messages to distinguish cloud-confirmed exports from local-cache exports.
- Updated import success messages to distinguish local-only import, cloud-confirmation-pending import, and cloud-sync-confirming import.
- Added component coverage for local-only, cloud-confirmed, refresh, pending-write, import, and invalid-import flows.

## Non-Goals

- Do not change JSON export schema.
- Do not change CSV export format.
- Do not change import merge or overwrite semantics.
- Do not add Supabase schema or RLS changes.
- Do not add server-side import jobs in this task.
- Do not add dependencies.
- Do not remove local export/import.
- Do not block local-only export/import.

## Files

Created:

```text
docs/32-cloud-aware-export-import-hardening.md
tasks/032-cloud-aware-export-import-hardening.md
```

Modified:

```text
src/components/settings/DataScreen.tsx
src/components/settings/DataScreen.test.tsx
```

## Acceptance Criteria

- [x] Local-only users see that exports come from this device.
- [x] Synced cloud users see cloud-confirmed backup status.
- [x] Synced cloud users can refresh cloud data before export.
- [x] Users with queued/offline/conflict/in-progress cloud states see that exports are local-cache-backed.
- [x] Export success messages distinguish cloud-confirmed data from local cache.
- [x] Import success messages clarify whether cloud confirmation is pending.
- [x] Existing JSON import/export remains available.
- [x] Existing CSV export remains available.
- [x] Typecheck passes.
- [x] Unit/integration tests pass.
- [x] Production build passes.
- [x] E2E tests pass.

## Verification

Run:

```bash
npm test -- src/components/settings/DataScreen.test.tsx
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Remaining Hardening

Future production-grade import/export work should add:

- Server-side import job orchestration.
- Transactional or resumable import processing.
- Cloud-confirmed export metadata in the JSON payload.
- Optional refresh-before-export workflow that blocks export until refresh succeeds.
- Operator/support visibility into import job state without exposing private content.
