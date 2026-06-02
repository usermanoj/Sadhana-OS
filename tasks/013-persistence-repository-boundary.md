# Task 013 - Persistence Repository Boundary

## Goal

Introduce a persistence repository boundary while preserving the current localStorage-backed MVP behavior.

This task prepares Sadhana OS for cloud persistence by moving application data access behind a repository interface. The first repository implementation remains localStorage-backed and must keep all existing behavior unchanged.

## Prerequisites

- Task 012 completed.
- Existing MVP tests passing.

## Scope

- Add a typed repository contract for app persistence.
- Add a localStorage repository adapter.
- Refactor app data services/hooks/screens to use the repository instead of direct localStorage helpers.
- Keep `src/lib/storage.ts` as the low-level localStorage utility used by the adapter and existing low-level tests.
- Add repository tests.

## Non-Goals

- Do not add Supabase.
- Do not add authentication.
- Do not add cloud persistence.
- Do not add IndexedDB yet.
- Do not change UI behavior.
- Do not change export/import semantics.
- Do not remove or rewrite audit history.
- Do not hard-delete user data.

## Files

Create:

```text
src/lib/repository.ts
src/lib/repository.test.ts
tasks/013-persistence-repository-boundary.md
```

Modify:

```text
src/lib/auditService.ts
src/lib/export.ts
src/lib/import.ts
src/lib/seed.ts
src/hooks/useCategories.ts
src/hooks/useDailyEntry.ts
src/hooks/useJournal.ts
src/components/pages/DashboardScreen.tsx
src/components/pages/HistoryScreen.tsx
```

## Steps

1. Define `AppRepository`, `AppStateSnapshot`, and `StoredAuditLogEntry`.
2. Implement `createLocalStorageRepository()`.
3. Export a default `appRepository` singleton.
4. Add unit tests for version, categories, daily entries, journal entries, audit logs, snapshots, and snapshot replacement.
5. Refactor production code to use `appRepository`.
6. Keep direct `getItem` / `setItem` use in low-level storage tests and existing tests that inspect storage state.
7. Verify all current behavior.

## Acceptance Criteria

- [ ] Repository interface exists.
- [ ] localStorage adapter exists.
- [ ] App data services/hooks/screens use repository boundary for app state reads/writes.
- [ ] Existing `sadhana:*` storage keys are preserved.
- [ ] Export/import still works.
- [ ] Audit logging still works.
- [ ] Seed behavior still works.
- [ ] Tests cover the repository.
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

Playwright is not required unless UI behavior changes.

## References

- `docs/11-production-architecture.md`
- `src/lib/storage.ts`
- `src/types/index.ts`
