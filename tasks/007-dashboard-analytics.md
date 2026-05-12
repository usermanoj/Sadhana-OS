# Task 007 — Dashboard & Analytics

## Goal

Build the analytics dashboard with Recharts line/area charts, range selector, category filter, and streak counter.

## Prerequisites

- Task 004 completed (daily entries exist to chart).

## Steps

1. **Create DashboardScreen** (`src/components/DashboardScreen.tsx`)
   - Range selector: 7 / 30 / 90 day toggle buttons (default 7).
   - Category filter: dropdown with "Overall" + all active categories.
   - Chart area: Recharts `AreaChart` or `LineChart`.
   - Streak counter card below chart.

2. **Create chart data helper** (`src/lib/chartData.ts`)
   - `buildChartData(entries, categories, range, categoryFilter): ChartPoint[]`
   - Each point: `{ date: string, score: number }`.
   - Fill missing dates with `null` (gap in line).

3. **Create StreakCard** sub-component
   - Displays current streak number with flame icon.
   - Subtitle: "consecutive days".

4. **Style according to design system**
   - Chart line colour: `--accent-primary`.
   - Chart area fill: `--accent-primary` at 10 % opacity.
   - Grid lines: `--border`.
   - Tooltip: surface card style.

5. **Write tests**
   - Chart renders with mock data.
   - Range selector changes data points count.
   - Category filter shows correct scores.
   - Streak card shows correct count.
   - Empty state when no entries.

6. **Wire into App shell**
   - Dashboard tab renders this screen.

7. **Verify**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all tests pass.
   - `npx vite build` — succeeds.

## Acceptance Criteria

- [ ] Line chart renders overall score trend.
- [ ] Range selector switches between 7/30/90 days.
- [ ] Category filter shows per-category trend.
- [ ] Streak counter is accurate.
- [ ] Responsive on mobile.

## References

- `docs/05-ux-flows.md` — Flow 3
- `docs/07-scoring-logic.md` — streak calculation
