# 09 — Test Plan

## Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit tests + integration tests |
| **React Testing Library** | Component rendering + interaction |
| **Playwright** | End-to-end browser tests |
| **TypeScript** | Type checking (`tsc --noEmit`) |

## Test Pyramid

```
        ┌─────┐
        │ E2E │  ~10 tests (Playwright)
       ┌┴─────┴┐
       │ Integ │  ~20 tests (Vitest + RTL)
      ┌┴───────┴┐
      │  Unit   │  ~40 tests (Vitest)
      └─────────┘
```

## Unit Tests (Vitest)

### Scoring Engine (`src/lib/scoring.test.ts`)
- Computes correct category score (all done, none done, partial).
- Returns 0 when no active sub-components.
- Computes correct overall score across categories.
- Excludes archived categories from overall.
- Streak counts consecutive days correctly.
- Streak resets on gap days.

### Data Helpers (`src/lib/storage.test.ts`)
- Reads/writes to localStorage correctly.
- Returns defaults when key is missing.
- Version migration stub works.

### Audit Logger (`src/lib/audit.test.ts`)
- Creates entry with correct fields.
- Appends to existing log.
- Generates unique IDs and timestamps.

### Seed Data (`src/lib/seed.test.ts`)
- Seeds 9 categories with correct sub-components.
- Does not re-seed if version key exists.
- Creates audit entry on seed.

### Export/Import (`src/lib/export.test.ts`)
- Exports all data as valid JSON.
- CSV export has correct headers and rows.
- Import merges data correctly.
- Import detects conflicts.

## Integration Tests (Vitest + RTL)

### Today Tracker Component
- Renders all active categories and sub-components.
- Toggle updates completion state.
- Score bar updates after toggle.
- Date navigation loads correct entry.
- Archived categories/sub-components are hidden.

### Category Management Component
- Add category renders in list.
- Edit category updates display.
- Archive hides from tracker.
- Restore shows in tracker.
- Audit entry created on each action.

### Dashboard Component
- Chart renders with mock data.
- Range selector changes displayed data.
- Category filter works.

### Journal Component
- Saves text on blur.
- Loads correct entry for selected date.

## E2E Tests (Playwright)

### Happy Path (`e2e/happy-path.spec.ts`)
1. First launch seeds data and shows Today screen.
2. Toggle 3 sub-components → score updates.
3. Navigate to Dashboard → chart renders.
4. Write a journal entry → persists on reload.
5. Open History → calendar shows today's entry.
6. Export JSON → file downloads.

### Category Management (`e2e/category-management.spec.ts`)
1. Add a custom category with 2 sub-components.
2. Verify it appears on Today screen.
3. Archive it → disappears from Today.
4. Restore it → reappears.
5. Check audit log has 3 entries (create, archive, restore).

### Import Flow (`e2e/import.spec.ts`)
1. Export data.
2. Clear localStorage.
3. Import exported file.
4. Verify data restored correctly.

## CI Checklist (run before marking any task complete)

```bash
npx tsc --noEmit          # Type check
npx vitest run            # Unit + integration tests
npx playwright test       # E2E tests
npx vite build            # Production build
```
