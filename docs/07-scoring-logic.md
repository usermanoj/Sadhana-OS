# 07 — Scoring Logic

## Per-Category Score

```
categoryScore(categoryId, date) =
  (completedSubComponents / totalActiveSubComponents) × 100
```

- `completedSubComponents` = count of sub-components where `completions[subId] === true`.
- `totalActiveSubComponents` = count of sub-components in this category where `isArchived === false`.
- If a category has 0 active sub-components → score = 0 (not NaN).

## Overall Daily Score

```
overallScore(date) =
  sum(allCategoryScores) / numberOfActiveCategories
```

- Only active (non-archived) categories contribute.
- If 0 active categories → score = 0.

## Score Thresholds (UI Colour)

| Range | Label | Colour Token |
|-------|-------|-------------|
| 80–100 % | Excellent | `--accent-success` (green) |
| 40–79 % | Progressing | `--accent-warning` (amber) |
| 0–39 % | Needs Attention | `--accent-danger` (red) |

## Streak Calculation

```
streak = count of consecutive days (ending today or yesterday)
         where a DailyEntry exists with overallScore > 0
```

- A day "counts" if at least 1 sub-component was toggled.
- Streak resets to 0 if there's a gap day with no entry.
- If today has no entry yet, streak is counted from yesterday backward.

## Recomputation Rules

- Scores recompute on every toggle (real-time in UI).
- Scores are persisted in `DailyEntry.categoryScores` and `DailyEntry.overallScore`.
- When categories/sub-components are archived, past scores are NOT retroactively recalculated (historical snapshot preserved).

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Category archived mid-day | Tracker hides it; today's overall recalculates excluding it |
| Sub-component archived after being toggled | Toggle data preserved; score recalculates with reduced denominator |
| All sub-components archived in a category | Category shows 0 % (no toggles possible) |
| Import overwrites entries | Scores from imported data used as-is |
