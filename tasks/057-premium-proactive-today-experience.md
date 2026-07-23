# Task 057 - Premium Proactive Today Experience

## Goal

Turn Today from a tracker-first screen into a calm, premium daily practice
experience that presents one clear next action before the full practice
library.

## Scope

- Establish a restrained proactive visual hierarchy for the Today screen.
- Derive a transparent daily plan from the user's existing active practices,
  display order, and current completion state.
- Add Minimum, Balanced, and Full plan-depth controls.
- Present one next practice with a direct recording control.
- Advance the next practice immediately after completion.
- Keep daily progress, date navigation, completion feedback, and the complete
  practice library available.
- Preserve mobile and desktop accessibility and responsive behavior.

## Product Semantics

Task 057 does not introduce an adaptive recommendation engine. The proposed
practice is the first incomplete practice in the user's current ordered
library.

- **Minimum** includes one incomplete practice.
- **Balanced** includes the next three incomplete practices.
- **Full** includes every incomplete active practice.

The selected depth is an in-memory view preference for the current app
session. It does not change category configuration or create an audit event.

## Non-Goals

- No Supabase, schema, RLS, authentication, or sync changes.
- No calendar, wearable, health, location, notification, or native
  integration.
- No AI, inference, adaptive ranking, or generated guidance.
- No changes to scoring semantics.
- No changes to category, habit, journal, history, dashboard, settings,
  export, or import behavior.
- No new production dependency.

## Files

- `src/lib/todayPlan.ts`
- `src/lib/todayPlan.test.ts`
- `src/components/today/PlanModeSelector.tsx`
- `src/components/today/NextPracticePanel.tsx`
- `src/components/pages/TodayScreen.tsx`
- `src/components/pages/TodayScreen.test.tsx`
- `src/index.css`
- `e2e/happy-path.spec.ts`
- `e2e/accessibility-responsive.spec.ts`
- `tasks/057-premium-proactive-today-experience.md`

## Acceptance Criteria

- [x] The first viewport emphasizes one next practice rather than the complete
      tracker.
- [x] The next practice is derived only from active, incomplete practices in
      current display order.
- [x] Minimum, Balanced, and Full controls change plan depth predictably.
- [x] Recording the focused practice advances the focus without navigation.
- [x] Full-day completion remains clear and celebratory without being noisy.
- [x] Date navigation and all existing tracking controls continue to work.
- [x] The full practice library remains available below the proactive plan.
- [x] The screen has no horizontal overflow at supported mobile, tablet, and
      desktop viewports.
- [x] Reduced-motion behavior and keyboard focus remain supported.
- [x] Lint, typecheck, unit tests, build, and Playwright regression pass.
