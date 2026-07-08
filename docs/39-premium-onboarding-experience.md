# Premium Onboarding Experience

## Summary

Task 044 upgrades onboarding into a more premium first-run experience while preserving the existing authentication and profile model. The screen now introduces Sadhana OS as a daily practice operating system, invites the user to choose a starting focus, and captures only the setup fields already supported by the backend.

## Product Changes

- Replaced the plain onboarding form with a two-panel welcome journey.
- Added a stronger headline: `Shape Your Daily Sadhana`.
- Added three selectable starting-focus cards:
  - Steady Practice
  - Inner Clarity
  - Life Balance
- Added trust cues:
  - Private by design
  - Cloud ready
  - Daily rhythm
- Reworked the setup form with clearer hierarchy, better mobile touch targets, and a segmented week-start picker.
- Trimmed the display name before saving.
- Preserved the existing `Begin Practice` completion action.

## Technical Notes

- The selected starting focus is intentionally local UI state only.
- No new database columns or profile fields were added.
- The saved payload remains:
  - `displayName`
  - `timezone`
  - `weekStartsOn`
- AuthGate behavior is unchanged: onboarding appears only for signed-in users whose profile has no `onboardingCompletedAt`.

## Limitations

Starting focus is not yet persisted or used to personalize starter categories. That should be a separate product/schema decision if we want true adaptive onboarding later.

## Validation

Task 044 adds focused onboarding tests for:

- premium first-run content,
- focus card selection,
- existing onboarding payload shape,
- timezone and week-start saving,
- friendly save error handling.
