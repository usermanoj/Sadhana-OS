# Task 014 - Supabase Schema, RLS, And Migrations

## Goal

Create the committed Supabase database foundation for v0.2 production persistence.

This task defines the cloud data model, initial SQL migration, row-level security policies, and tests that guard the migration file.

## Prerequisites

- Task 012 completed.
- Task 013 completed.

## Scope

- Create a cloud data model document.
- Create Supabase migration folder and README.
- Create the initial SQL migration for user-owned data.
- Enable RLS on every user-owned table.
- Add owner-scoped policies.
- Keep audit logs append-only for normal users.
- Add tests that inspect the migration artifact.

## Non-Goals

- Do not connect the app to Supabase yet.
- Do not add Supabase client dependency yet.
- Do not add auth UI.
- Do not change localStorage behavior.
- Do not change user workflows.
- Do not run a live Supabase project migration in this task.

## Files

Create:

```text
docs/12-cloud-data-model.md
supabase/README.md
supabase/migrations/20260601000000_initial_schema.sql
src/lib/supabaseSchema.test.ts
tasks/014-supabase-schema-rls-migrations.md
```

Modify:

```text
None
```

## Acceptance Criteria

- [ ] Cloud data model is documented.
- [ ] Initial Supabase migration is committed.
- [ ] Migration creates all production tables.
- [ ] RLS is enabled on every user-owned table.
- [ ] Policies scope access to `auth.uid()`.
- [ ] Normal users cannot update/delete audit rows.
- [ ] Normal users do not get delete policies for product data.
- [ ] Profile and settings bootstrap trigger exists.
- [ ] Migration guard tests exist.
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

## References

- `docs/11-production-architecture.md`
- `docs/12-cloud-data-model.md`
- `supabase/migrations/20260601000000_initial_schema.sql`
