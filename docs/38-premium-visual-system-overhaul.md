# Premium Visual System Overhaul

## Summary

Task 043 establishes a stronger visual foundation for Sadhana OS without changing application behavior. The work focuses on premium B2C interface quality: consistent surfaces, clearer touch targets, calmer shadows, sharper focus states, and a more cohesive laptop/mobile presentation.

The first implementation pass created the shared visual language. The second pass upgraded the Today screen into a more opinionated daily ritual surface, because Today is the emotional core of the product and the first screen users judge.

## Visual System Changes

- Refined the app palette away from flat MVP neutrals into warmer premium surfaces with stronger text contrast.
- Reduced default card radius for a sleeker product feel.
- Added richer but restrained shadow tokens for cards, lifted states, and navigation.
- Added shared CSS primitives:
  - `sadhana-surface`
  - `sadhana-surface-soft`
  - `sadhana-interactive-surface`
  - `sadhana-icon-tile`
  - `sadhana-button-primary`
  - `sadhana-button-secondary`
  - `sadhana-button-ghost`
  - `sadhana-input`
- Applied the primitives across Today, Dashboard, Journal, History, Settings, Auth, Onboarding, Privacy, Audit, Migration, and recovery surfaces.

## Today Experience Changes

- Replaced the plain page header with a Daily Sadhana hero.
- Added a circular daily progress meter beside the date and focus area.
- Preserved the existing Daily Score bar and completion count for continuity and tests.
- Added concise ritual tone copy based on current progress.
- Added completion, remaining, and group metrics.
- Upgraded practice group cards with:
  - category accent strips,
  - larger icon tiles,
  - clearer count badges,
  - status labels such as Ready, In progress, and Complete,
  - richer expanded-state treatment.
- Preserved existing category expansion, daily scoring, toggle, numeric, text, date navigation, and persistence behavior.

## Product Rationale

Premium wellness software should feel trustworthy before it feels decorative. This pass prioritizes consistency, clarity, keyboard focus, touch comfort, and laptop readability over flashy motion or ornamental visuals.

## Not Changed

- Authentication behavior.
- Supabase schema or RLS policies.
- Cloud sync behavior.
- Local migration behavior.
- Export/import semantics.
- Routing behavior.
- Dependencies.
- Framework choice.

## Validation

The task should be considered complete only when:

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm test` passes.
- `npm run build` passes.
- `npm run test:e2e` passes.
- Browser smoke checks pass on laptop and mobile widths.
