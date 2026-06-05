# Task 026.6.1 - Local Migration Starter Template De-Dupe, Retry Hardening, And Ownership Guard

## Status

Implemented

## Problem

After signing in to a new cloud account, Sadhana OS creates a cloud starter template with user-unique random IDs.

The legacy local MVP data also contains the same starter template, but with stable local seed IDs.

The local-to-cloud migration previously remapped those local stable IDs to deterministic migration UUIDs. That made retries safe, but it did not recognize that the same starter-template categories already existed in cloud under different IDs.

Result: migrating local data into an account that already had the cloud starter template inserted duplicate default categories such as `8 Limbs of Yoga`, `Speech / Vaani Control`, and others.

During live retry testing, the migration could also fail after a partial upload because audit log rows are intentionally append-only in RLS. The previous retry path used normal upsert for audit rows, which can attempt an update when the same migrated audit ID already exists.

During live multi-account testing, the same root legacy localStorage backup could also be copied into multiple signed-in accounts. This added old local custom groups such as test categories into another user's cloud account.

## Root Cause

The migration was idempotent by source ID, not by semantic starter-template identity.

This prevented duplicates across repeated retries of the same migration, but not across:

- Cloud starter rows created with random IDs.
- Legacy local starter rows migrated with deterministic IDs.

The migration failure was a separate client retry bug: audit history was treated like mutable product data. RLS correctly rejected update attempts on existing audit rows.

The multi-account custom category issue was a missing UX and ownership guard. Root localStorage is a single shared legacy device backup and has no owner metadata. The app was exposing it to every signed-in user as a one-click merge.

## Fix

- When planning migration, load the existing cloud snapshot.
- If an unchanged legacy starter category already exists in cloud, map local starter category and habit IDs to the existing cloud starter IDs.
- Preserve deterministic IDs for custom local categories and custom local habits.
- Collapse duplicate migration conflict keys before sending Supabase upsert batches.
- Insert missing migrated audit rows with duplicate-ignore semantics instead of updating existing audit rows.
- Require review before upload; the first click loads cloud state and does not write rows.
- Show custom local group names during review.
- Warn when the destination cloud account already has user-created practice data.
- Block local backup upload when the destination cloud account already has user-created practice data.
- Detect custom categories that were already copied from this local backup.
- Offer explicit archive-only cleanup for copied local custom categories.
- Record a local completion marker by backup checksum and cloud user ID after success.
- Block the same backup from being copied into a different cloud account after success.
- After upload, scan the cloud snapshot for already-created duplicate starter-template categories.
- Also scan and repair duplicate starter-template categories before upload, so already-duplicated accounts can be repaired even before a migration retry succeeds.
- Archive duplicate starter rows instead of hard-deleting them.
- Keep the duplicate copy with the strongest daily usage signal so existing practice history remains visible.
- Add audit entries for archived duplicate categories.
- Refresh the active cloud-backed local cache after repair.

## Acceptance Criteria

- [x] Migrating unchanged legacy starter rows into a cloud account with starter rows does not create a second active starter set.
- [x] Daily entries and habit completions for legacy starter rows remap to existing cloud starter IDs.
- [x] Duplicate upload conflict keys are collapsed before Supabase upsert batches.
- [x] Retried migration does not try to update existing audit log rows.
- [x] First migration action reviews only and does not upload.
- [x] Review blocks upload when the cloud account already has user-created practice data.
- [x] Previously copied local custom groups can be explicitly archived.
- [x] Successful migration records a local completion marker.
- [x] The same backup is blocked from being copied into another account after success.
- [x] Previously-created duplicate starter categories are archived, not deleted.
- [x] Existing duplicate starter categories are repaired before migration upload.
- [x] The duplicate category with daily usage is preserved as the active one.
- [x] Duplicate repairs create audit log entries.
- [x] Custom categories and custom habits still migrate.
- [x] No Supabase schema or RLS changes are introduced.

## Limitations

- This repairs starter-template duplicates only.
- It does not merge arbitrary user-created categories with similar names.
- Migration remains client-orchestrated and not server-transactional.
- Existing duplicate rows are archived through normal user-owned update policies, not hard-deleted.
