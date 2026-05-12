# Task 003 — Scoring Engine

## Goal

Implement the scoring engine that computes per-category scores, overall daily score, and streak count.

## Prerequisites

- Task 002 completed (storage + seed data).

## Steps

1. **Create scoring module** (`src/lib/scoring.ts`)
   - `computeCategoryScore(categoryId, completions, categories): number` — returns 0–100.
   - `computeOverallScore(completions, categories): number` — average of active category scores.
   - `computeAllScores(completions, categories): { categoryScores, overallScore }`.
   - `computeStreak(entries): number` — consecutive days ending today/yesterday.

2. **Create scoring tests** (`src/lib/scoring.test.ts`)
   - All sub-components done → 100 %.
   - No sub-components done → 0 %.
   - Partial → correct percentage (e.g., 3/8 = 37.5).
   - Category with 0 active sub-components → 0 %.
   - Archived categories excluded from overall.
   - Streak: 5 consecutive days → 5.
   - Streak: gap on day 3 → counts from day 4 onward.
   - Streak: no entries → 0.
   - Streak: today has no entry, yesterday does → counts from yesterday.

3. **Verify**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all tests pass.

## Acceptance Criteria

- [ ] Category score formula matches `docs/07-scoring-logic.md`.
- [ ] Overall score formula matches spec.
- [ ] Streak logic handles all edge cases.
- [ ] All unit tests pass.

## References

- `docs/07-scoring-logic.md` — scoring rules
- `docs/04-data-model.md` — DailyEntry interface
