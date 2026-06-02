# Task 022 - Legacy localStorage Cloud Migration ID Remapping

## Status

Completed

## Goal

Prevent primary-key collisions when multiple users migrate identical v0.1 localStorage/default seed data into Supabase.

## Scope

- Remap local category IDs to fresh cloud UUIDs during migration planning.
- Remap local habit IDs to fresh cloud UUIDs during migration planning.
- Preserve parent/child relationships after remapping.
- Remap daily completion habit references.
- Remap daily category score references.
- Remap audit log row IDs and category/habit entity references.
- Keep the user's local browser backup untouched.

## Out Of Scope

- Supabase schema changes.
- Auth or email infrastructure changes.
- UI redesign.
- Export/import changes.
- Full server-side resumable migration.

## Verification

- Added regression tests for category/habit remapping.
- Added regression tests for daily entry reference remapping.
- Added regression tests for audit entity and snapshot remapping.
- Added regression test proving two users migrating identical local data get non-overlapping cloud IDs.
