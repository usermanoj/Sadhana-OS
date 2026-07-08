# Task 043 - Premium Visual System Overhaul

## Goal

Move Sadhana OS from page-level polish into a coherent premium visual system that feels calm, modern, trustworthy, and consistent across mobile and laptop screens.

## Scope

- Refine core visual tokens: color, radius, shadow, and fixed typography rhythm.
- Add shared CSS component primitives for surfaces, interactive surfaces, buttons, inputs, and icon tiles.
- Redesign the Today screen as a daily ritual experience with:
  - a stronger Daily Sadhana hero,
  - a circular daily progress meter,
  - clearer completion, remaining, and group metrics,
  - a richer date/focus area,
  - premium practice group cards with status language and category accent treatment.
- Apply the shared visual primitives across high-traffic and high-trust surfaces:
  - App shell navigation
  - Today tracker cards and controls
  - Dashboard cards and chart panels
  - Journal editor and history
  - Settings tabs, tracker management, data, account, privacy, audit, and migration panels
  - Auth, onboarding, password reset, error, and import conflict surfaces
- Preserve mobile-first behavior while improving laptop visual quality.
- Keep the visual system restrained, readable, and suitable for a premium B2C wellness app.

## Non-Goals

- No Supabase schema changes.
- No auth behavior changes.
- No cloud sync behavior changes.
- No local migration behavior changes.
- No export/import behavior changes.
- No route/navigation behavior changes.
- No new production dependencies.
- No framework migration.

## Acceptance Criteria

- The app uses consistent surface, button, and input language across primary screens.
- The Today screen feels like a premium daily ritual dashboard rather than a plain tracker list.
- Laptop layout remains readable and premium.
- Mobile layout remains touch-friendly with no horizontal overflow.
- Existing functionality and tests continue to pass.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` pass.
