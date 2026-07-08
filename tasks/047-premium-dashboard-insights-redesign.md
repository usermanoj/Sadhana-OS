# Task 047 - Premium Dashboard Insights Redesign

## Goal

Turn Dashboard from a chart-heavy analytics page into a premium insight surface that helps users understand rhythm, consistency, strongest areas, and areas needing attention.

## Scope

- Add a premium insight hero for the selected range.
- Add range summary metrics: range average, active days, completed practices, and current streak.
- Add insight cards for strongest area, attention area, and practice rhythm.
- Preserve existing analytics helpers, scoring, persistence, and Recharts usage.
- Polish chart empty states, tooltip styling, grid lines, and spacing.
- Keep period switching and category filtering.
- Add/update tests for empty states, insight summary, range switching, category filters, and existing analytics sections.

## Non-Goals

- No AI-generated insights.
- No new charting library.
- No database, Supabase, auth, RLS, sync, import/export, or scoring changes.
- No subscription or monetization work.

## Acceptance Criteria

- Dashboard renders useful premium insights with and without data.
- Existing score, streak, category, trend, balance, and category-average sections remain available.
- Range selector still switches between 7, 30, and 90 days.
- Mobile layout remains readable and touch-friendly.
- Lint, typecheck, unit tests, build, and E2E pass.
