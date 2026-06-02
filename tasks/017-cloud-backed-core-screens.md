# Task 017 - Cloud-Backed Core Screens

## Goal

Add the cloud-backed repository layer needed for core screens to work from a local cache while syncing signed-in user changes to Supabase.

The current UI remains synchronous and stable. In cloud mode, the active repository delegates local writes to the local cache and forwards supported writes to Supabase.

## Prerequisites

- Task 013 completed.
- Task 014 completed.
- Task 015 completed.
- Task 016 completed.

## Scope

- Add Supabase cloud row mapping.
- Add cloud gateway for loading and saving app data.
- Add cloud-backed repository wrapper.
- Allow the active app repository to be swapped at runtime.
- Add provider that activates cloud-backed repository for signed-in users.
- Keep local-only behavior unchanged when cloud is not configured or user is signed out.
- Preserve local cache/localStorage.

## Non-Goals

- Do not implement a durable offline mutation queue yet.
- Do not delete cloud or local data.
- Do not redesign core screens.
- Do not auto-migrate localStorage data.
- Do not resolve multi-device conflicts yet.

## Files

Create:

```text
src/lib/cloudRepository.ts
src/lib/cloudRepository.test.ts
src/lib/cloudSync.ts
src/lib/cloudSync.test.ts
src/cloud/CloudSyncProvider.tsx
tasks/017-cloud-backed-core-screens.md
```

Modify:

```text
src/lib/repository.ts
src/main.tsx
```

## Acceptance Criteria

- [ ] Cloud rows can map into the local app snapshot shape.
- [ ] Cloud gateway can load categories, habits, entries, journal entries, audit logs, and settings.
- [ ] Cloud gateway can upsert categories, habits, entries, journal entries, and audit logs.
- [ ] App repository supports runtime delegation.
- [ ] Cloud-backed repository writes to local cache first.
- [ ] Cloud-backed repository forwards writes to cloud gateway.
- [ ] Signed-in users activate cloud-backed repository.
- [ ] Local-only users keep the localStorage repository.
- [ ] Typecheck passes.
- [ ] Unit/integration tests pass.
- [ ] Production build passes.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Run Playwright because app bootstrap changed:

```bash
npm run test:e2e
```
