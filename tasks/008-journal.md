# Task 008 — Journal

## Goal

Build the journal screen for free-text entries linked to dates, with auto-save.

## Prerequisites

- Task 001 completed (project scaffold).

## Steps

1. **Create journal hook** (`src/hooks/useJournal.ts`)
   - `loadEntry(date): JournalEntry | null`.
   - `saveEntry(date, content): void` — creates or updates.
   - Auto-save: debounce 2 seconds after last keystroke, also save on blur.

2. **Create JournalScreen** (`src/components/JournalScreen.tsx`)
   - Date navigator at top (same component as Today screen).
   - Textarea for free-text content.
   - "Saved" indicator (subtle checkmark that appears after save).
   - Word count at bottom (optional).

3. **Style according to design system**
   - Textarea: full width, min-height 300 px, border, radius-md.
   - Font: body size, comfortable line height.
   - Warm background, card-style container.

4. **Write tests**
   - Saving content persists to localStorage.
   - Loading a date shows correct content.
   - Empty date shows empty textarea.
   - Auto-save fires after debounce.

5. **Wire into App shell**
   - Journal tab renders this screen.

6. **Verify**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all tests pass.

## Acceptance Criteria

- [ ] User can write and save a journal entry.
- [ ] Auto-save on blur and after 2s debounce.
- [ ] Date navigation loads correct entry.
- [ ] Empty state for dates with no entry.
- [ ] Mobile-friendly layout.

## References

- `docs/05-ux-flows.md` — Flow 4
- `docs/04-data-model.md` — JournalEntry interface
