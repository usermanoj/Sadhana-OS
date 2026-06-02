# Task 016 - LocalStorage To Cloud Migration

## Goal

Add an explicit localStorage-to-cloud migration path for signed-in users.

This task builds migration planning, cloud row mapping, upload orchestration, and a Settings > Account migration panel. It must preserve local data and must not switch the app's core screens to cloud data yet.

## Prerequisites

- Task 013 completed.
- Task 014 completed.
- Task 015 completed.

## Scope

- Document sync and migration rules.
- Build a local migration planner from the repository snapshot.
- Map local categories, habits, entries, journals, and audit logs to cloud table rows.
- Compute summary counts and a stable checksum.
- Add an upload function that writes via Supabase using merge/upsert.
- Add a signed-in Account-screen migration panel.
- Add tests for migration planning and panel rendering.

## Non-Goals

- Do not automatically migrate.
- Do not delete localStorage data.
- Do not switch app screens to cloud data.
- Do not implement offline sync queue yet.
- Do not implement destructive overwrite from the client.

## Files

Create:

```text
docs/14-sync-and-migration.md
src/lib/localMigration.ts
src/lib/localMigration.test.ts
src/components/settings/LocalMigrationPanel.tsx
src/components/settings/LocalMigrationPanel.test.tsx
tasks/016-localstorage-to-cloud-migration.md
```

Modify:

```text
src/components/settings/AccountScreen.tsx
```

## Acceptance Criteria

- [ ] Migration plan preserves local category, habit, and audit IDs where valid.
- [ ] Migration plan maps daily completion values to normalized cloud rows.
- [ ] Migration summary counts rows by type.
- [ ] Migration checksum is stable for the same snapshot.
- [ ] Upload writes an `import_jobs` row.
- [ ] Upload upserts cloud rows in merge mode.
- [ ] LocalStorage is not cleared by migration.
- [ ] Account screen exposes migration only for signed-in cloud users with local data.
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

Run Playwright because Account UI changed:

```bash
npm run test:e2e
```

## References

- `docs/14-sync-and-migration.md`
- `docs/12-cloud-data-model.md`
- `src/lib/repository.ts`
