# Task 046 - Premium Journal Reflection Experience

## Goal

Make the Journal screen feel like a premium B2C reflection space while preserving existing autosave, date navigation, local/cloud persistence, export/import compatibility, and journal history behavior.

## Scope

- Add a premium journal hero with reflection metrics.
- Redesign the daily journal editor into a guided reflection surface.
- Add deterministic daily prompts tied to the selected date.
- Show entry depth and word-count feedback while writing.
- Preserve debounced autosave and blur-save behavior.
- Add sync-aware save helper copy without changing cloud sync logic.
- Polish recent journal history and empty state for desktop and mobile.
- Add tests for the new reflection UI, autosave status, metrics, and history actions.

## Non-Goals

- No database schema changes.
- No auth, Supabase, RLS, or migration changes.
- No new production dependencies.
- No AI-generated prompt service or remote journaling analysis.
- No change to export/import shape.

## Acceptance Criteria

- Journal autosave still persists entries after debounce and on blur.
- Existing journal fields still load and save under the same `JournalEntry` shape.
- Users see a daily prompt, section depth, and word count.
- Saved state remains visible and communicates local/cloud status honestly.
- Recent reflections remain selectable and accessible.
- Typecheck, tests, build, and E2E pass.
