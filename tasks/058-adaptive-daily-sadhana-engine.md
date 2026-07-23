# Task 058 - Adaptive Daily Sadhana Engine

## Goal

Replace the ordered-list recommendation from Task 057 with a deterministic,
explainable daily plan that adapts to the day the user actually has.

## Scope

- Generate a daily plan from:
  - available practice time;
  - self-reported energy;
  - up to two user-selected focus areas;
  - recent recorded practice history.
- Keep Minimum, Balanced, and Full plan depths.
- Explain why each recommended practice appears.
- Let the user shorten or replace a recommendation.
- Keep generated plans as suggestions until explicitly confirmed.
- Persist saved plans in the user-scoped local cache and Supabase.
- Include saved plans in cloud sync, conflict detection, and JSON backup/import.
- Audit plan generation, adjustment, and confirmation.
- Add a user-owned Supabase table with Row Level Security and no client delete
  policy.

## Recommendation Semantics

- The engine is deterministic and rule-based. It does not use AI.
- Missing history is unknown, not failure.
- A recovery signal is used only when a practice has at least two explicit
  records in the seven preceding days.
- Completed, archived, and explicitly replaced practices are not recommended.
- Available time is a planning budget, not a completion target.
- Suggested and confirmed plans never mark a practice complete.
- Current recording and scoring semantics remain unchanged.

## Non-Goals

- No calendar integration or automatic scheduling.
- No notifications, health data, location, microphone, or wearable data.
- No guided practice player.
- No automatic completion inference.
- No subscription or payment work.
- No new production dependency.
- No changes to authentication or existing user-data isolation policies.

## Files

- `src/types/index.ts`
- `src/lib/adaptiveDailyPlan.ts`
- `src/lib/adaptiveDailyPlan.test.ts`
- `src/lib/repository.ts`
- `src/lib/cloudRepository.ts`
- `src/lib/cloudSync.ts`
- `src/lib/export.ts`
- `src/lib/import.ts`
- `src/hooks/useAdaptiveDailyPlan.ts`
- `src/components/today/AdaptivePlanTuner.tsx`
- `src/components/today/NextPracticePanel.tsx`
- `src/components/today/PlanModeSelector.tsx`
- `src/components/pages/TodayScreen.tsx`
- Related unit, component, schema, and Playwright tests
- `supabase/migrations/20260723000000_add_daily_sadhana_plans.sql`

## Acceptance Criteria

- [x] Recommendations are deterministic for identical inputs.
- [x] Time, energy, focus areas, and recorded history affect ranking.
- [x] Missing records are not treated as failed practices.
- [x] The recommendation reason is visible in Today.
- [x] Users can tune, shorten, replace, and confirm the plan.
- [x] Suggested and confirmed states are clearly distinguished.
- [x] Plans persist through refresh and user-scoped cloud sync.
- [x] Plans are included in JSON export/import without breaking older backups.
- [x] RLS restricts plans to their authenticated owner.
- [x] No client hard-delete policy is added.
- [x] Existing tracking, scoring, journal, history, and settings behavior passes
      regression tests.
- [x] Lint, typecheck, unit tests, build, and Playwright pass.
