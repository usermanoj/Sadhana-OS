# Task 004 — Today Tracker Screen

## Goal

Build the main daily tracking screen where users toggle sub-components and see real-time scores.

## Prerequisites

- Task 003 completed (scoring engine).

## Steps

1. **Create DailyEntry hook** (`src/hooks/useDailyEntry.ts`)
   - Loads or initialises a `DailyEntry` for the selected date.
   - Provides `toggleSubComponent(subId)` that updates completions, recomputes scores, and saves.
   - Provides `selectedDate`, `goToDate(date)`, `goToPrev()`, `goToNext()`.

2. **Create TodayScreen component** (`src/components/TodayScreen.tsx`)
   - Date navigation bar at top (< date >), with "today" as default.
   - Overall score bar below date.
   - List of active categories as collapsible accordions.
   - Each accordion header: icon, name, `completed/total` badge, score bar.
   - Each accordion body: sub-component list with toggle switches.
   - Smooth accordion expand/collapse animation.

3. **Create sub-components**
   - `DateNavigator` — prev/next arrows + date display.
   - `ScoreBar` — gradient-filled progress bar.
   - `CategoryAccordion` — collapsible section.
   - `SubComponentToggle` — labelled toggle switch.

4. **Style according to design system**
   - Warm ivory background.
   - Card-style accordions with border and shadow.
   - Touch-friendly toggle size (44 × 24 px).
   - Mobile-first layout.

5. **Write integration tests**
   - Renders all 9 default categories.
   - Toggling a sub-component updates score display.
   - Archived items are not shown.
   - Date navigation loads correct day's data.

6. **Wire into App shell**
   - TodayScreen renders when "Today" tab is active.

7. **Verify**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all tests pass.
   - `npx vite build` — succeeds.
   - Manual check: open dev server, toggle items, scores update.

## Acceptance Criteria

- [ ] All 9 categories render with their sub-components.
- [ ] Toggle updates score in real time.
- [ ] Overall score recalculates correctly.
- [ ] Date navigation works for past dates.
- [ ] Archived categories/sub-components hidden.
- [ ] Mobile-friendly layout with 44 px touch targets.

## References

- `docs/05-ux-flows.md` — Flow 2 (Daily Tracking), screen layout
- `docs/06-design-system.md` — component specs
- `docs/07-scoring-logic.md` — score computation
