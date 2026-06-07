# Task 027 - Suppress Starter-Only Local Migration Prompt

Status: Implemented

Date: 2026-06-06

## Problem

Fresh cloud users could see the Local Data Migration panel even when the root localStorage backup only contained unchanged MVP starter-template data.

This happened because the migration panel used a broad local-data check. The check correctly detected root localStorage categories and seed audit history, but it did not distinguish between meaningful legacy user data and starter-only bootstrap data.

## Goal

Hide the Local Data Migration prompt for fresh cloud users when the root local backup contains only unchanged starter-template data.

Keep the prompt visible when root localStorage contains meaningful legacy data, such as:

- Custom categories.
- Custom practices.
- Daily practice history.
- Journal entries.
- Non-bootstrap audit history.

## Scope

Implemented:

- Added a narrower local migration visibility predicate.
- Kept the broader `hasMigratableLocalData` behavior unchanged for cloud hydration and migration internals.
- Updated `LocalMigrationPanel` to render only when meaningful local migration data exists.
- Added unit/component coverage for starter-only suppression and meaningful legacy data detection.

Not changed:

- Supabase schema.
- RLS policies.
- Auth flows.
- Cloud sync queue.
- Migration upload behavior.
- JSON export/import.
- Existing guarded migration review flow.

## Acceptance Criteria

- Fresh users with only root starter-template local data do not see the migration prompt.
- Users with custom legacy local data still see the migration prompt.
- Users with legacy practice history still see the migration prompt.
- Existing migration safety checks remain intact.
- Typecheck, tests, and build pass.
