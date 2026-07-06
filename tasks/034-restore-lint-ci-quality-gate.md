# Task 034 - Restore Lint / CI Quality Gate

Status: Implemented

Date: 2026-07-06

## Goal

Restore `npm run lint` as a working engineering quality gate for the React, TypeScript, Vite, Playwright, and service worker codebase.

## Problem

The project used ESLint 9 but did not have the required flat config file. Running `npm run lint` failed before checking source code.

## Scope

Implemented:

- Added ESLint 9 flat config.
- Covered TypeScript, React hooks, browser code, Vitest tests, Playwright tests, Node config files, scripts, and the service worker.
- Ignored generated and runtime output folders.
- Fixed lint errors in the service worker environment configuration and history row projection.
- Fixed React hook dependency warnings in auth, journal, and history code.
- Tuned the React Refresh component-export rule off because the current architecture intentionally exports contexts/constants beside providers.

## Non-Goals

- Do not add dependencies.
- Do not redesign auth, journal, history, or cloud sync.
- Do not change TypeScript compiler settings.
- Do not add CI provider workflow changes in this task.

## Files

Created:

```text
eslint.config.js
tasks/034-restore-lint-ci-quality-gate.md
```

Modified:

```text
src/auth/AuthProvider.tsx
src/components/journal/JournalForm.tsx
src/components/pages/HistoryScreen.tsx
src/lib/history.ts
```

## Acceptance Criteria

- [x] `npm run lint` executes under ESLint 9.
- [x] Lint completes with zero errors.
- [x] Lint completes without warning noise.
- [x] No new dependencies are added.
- [x] Typecheck, tests, build, and E2E remain green.

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```
