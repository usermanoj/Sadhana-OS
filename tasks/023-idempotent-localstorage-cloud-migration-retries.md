# Task 023 - Idempotent localStorage Cloud Migration Retries

## Status

Completed

## Goal

Make localStorage-to-cloud migration retry-safe after partial upload failures without changing the Supabase schema.

## Scope

- Generate deterministic user-scoped cloud UUIDs for migrated product rows.
- Preserve the Task 022 cross-user collision fix.
- Keep cloud IDs stable when the same user retries the same local migration.
- Keep IDs different when different users migrate identical local data.
- Preserve remapped relationships for categories, habits, daily entries, journal entries, and audit logs.
- Keep per-attempt `import_jobs` rows auditable.

## Out Of Scope

- Server-side transactional migration orchestration.
- Supabase schema changes.
- UI changes.
- Auth/email changes.
- Local browser backup mutation.

## Verification

- Added tests proving same-user retry ID stability.
- Added tests proving relationship mapping stability across retries.
- Preserved tests proving cross-user ID separation.
- Ran full typecheck, unit, build, e2e, and audit checks.
