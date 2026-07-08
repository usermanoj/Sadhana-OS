# Task 044 - Premium Onboarding Experience

## Goal

Upgrade first-run onboarding from a plain setup form into a premium B2C welcome journey that explains the product promise, builds trust, and captures the account rhythm needed by the existing auth/profile model.

## Scope

- Redesign the onboarding screen shown after a signed-in user has no `onboardingCompletedAt`.
- Add a stronger welcome hero and Sadhana OS positioning.
- Add selectable starting-focus cards for first-run orientation:
  - Steady Practice
  - Inner Clarity
  - Life Balance
- Add trust/value cues for privacy, cloud readiness, and daily rhythm.
- Keep the existing supported onboarding payload:
  - `displayName`
  - `timezone`
  - `weekStartsOn`
- Improve the week-start picker with touch-friendly segmented controls.
- Preserve the existing `completeOnboarding` flow and signed-in routing behavior.
- Add focused unit tests for the onboarding journey.

## Non-Goals

- No Supabase schema changes.
- No new persisted onboarding fields.
- No auth behavior changes.
- No cloud sync behavior changes.
- No starter data changes.
- No payment/subscription implementation.
- No production email or OAuth configuration changes.
- No new production dependencies.

## Acceptance Criteria

- New users see a premium first-run onboarding journey before entering the app.
- Focus cards are selectable and accessible.
- Onboarding completion still calls the existing `completeOnboarding` API with only supported fields.
- Week-start selection is touch-friendly.
- Error state remains friendly and visible.
- Existing auth, cloud, and app behavior remain intact.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` pass.
