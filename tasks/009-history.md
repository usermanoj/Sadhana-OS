# Task 009 — History Calendar

## Goal

Build a calendar view showing colour-coded days by score, with tap-to-navigate.

## Prerequisites

- Task 004 completed (daily entries exist).

## Steps

1. **Create HistoryScreen** (`src/components/HistoryScreen.tsx`)
   - Monthly calendar grid (Sun–Sat).
   - Month/year navigation (< May 2026 >).
   - Each day cell colour-coded by overall score:
     - Green: ≥ 80 %.
     - Amber: 40–79 %.
     - Red: < 40 %.
     - Grey: no entry.
   - Tap a day → navigate to Today screen with that date.

2. **Create CalendarGrid** sub-component
   - 7-column grid.
   - Day numbers with circular colour background.
   - Today highlighted with a ring/border.

3. **Create calendar helper** (`src/lib/calendar.ts`)
   - `getDaysInMonth(year, month): Date[]`.
   - `getMonthEntries(entries, year, month): Map<string, DailyEntry>`.

4. **Style according to design system**
   - Day cells: 44 × 44 px minimum (touch-friendly).
   - Rounded colour indicators.
   - Clean grid with subtle borders.

5. **Write tests**
   - Correct number of days rendered for a month.
   - Colour coding matches score thresholds.
   - Month navigation changes displayed month.
   - Tapping a day navigates correctly.
   - Days without entries show grey.

6. **Wire into App shell**
   - History tab renders this screen.

7. **Verify**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all tests pass.

## Acceptance Criteria

- [ ] Calendar displays correct days for each month.
- [ ] Days colour-coded by score threshold.
- [ ] Tapping a date loads that day in Today screen.
- [ ] Month navigation works.
- [ ] Mobile-friendly with 44 px touch targets.

## References

- `docs/05-ux-flows.md` — Flow 5
- `docs/07-scoring-logic.md` — score thresholds
