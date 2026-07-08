# Task 048 - Premium History Experience

## Goal

Upgrade History into a premium record and archive experience while preserving practice history, journal history, audit history, archived records, and restore behavior.

## Scope

- Add a premium History hero and summary counts for practice, journal, audit, and archived records.
- Replace simple tabs with larger, touch-friendly section cards.
- Polish filters with clearer framing and a reset action.
- Improve practice, journal, audit, and archived item cards.
- Preserve audit history and archive/restore behavior.
- Keep all data loading through the existing repository and history helper functions.
- Add tests for premium summary, section navigation, filters, and restore behavior.

## Non-Goals

- No hard deletion.
- No schema, Supabase, auth, RLS, cloud sync, import/export, or migration changes.
- No new dependencies.
- No changes to history helper semantics unless required by tests.

## Acceptance Criteria

- Practice, journal, audit, and archived sections remain accessible.
- Existing filters continue to work by date and category.
- Archived categories and habits can still be restored.
- Empty states remain clear and useful.
- Lint, typecheck, unit tests, build, and E2E pass.
