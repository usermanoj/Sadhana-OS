# Task 035 - Clarify Environment Badge vs Cloud Storage Status

Status: Implemented

Date: 2026-07-06

## Goal

Make the small runtime environment badge clearly describe the app environment, not the user's cloud storage or backup status.

## Problem

The UI could show a `LOCAL` badge while Settings > Data showed `Cloud-confirmed backup`. That was technically correct because the badge meant local development environment, but it was easy to misread as local-only storage.

## Scope

Implemented:

- Renamed the local environment label from `Local` to `Local Dev`.
- Added environment descriptions that explicitly say they do not describe cloud sync status.
- Updated the visible badge to include an `ENV` prefix.
- Made local/development environment badges quieter and less like a primary product/storage state.
- Updated the badge accessible label and tooltip.
- Updated unit tests for environment labels and badge rendering.

## Non-Goals

- Do not change Supabase/cloud configuration behavior.
- Do not change cloud sync, backup, import, export, or account status logic.
- Do not show a production environment badge to end users.
- Do not add dependencies.

## Files

Modified:

```text
src/lib/env.ts
src/lib/env.test.ts
src/components/layout/EnvironmentBadge.tsx
src/components/layout/EnvironmentBadge.test.tsx
```

Created:

```text
tasks/035-clarify-environment-badge.md
```

## Acceptance Criteria

- [x] Local development badge reads as app environment, not storage state.
- [x] Local environment label is `Local Dev`.
- [x] Badge has accessible copy explaining it is not cloud sync status.
- [x] Cloud storage and backup status surfaces remain unchanged.
- [x] Tests cover the revised badge wording.

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```
