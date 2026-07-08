# Premium Dashboard Insights Redesign

Task 047 upgrades Dashboard into a clearer B2C insight surface.

## What Changed

- Added a premium dashboard hero labeled "Practice Intelligence".
- Added selected-range summary metrics:
  - range average
  - active days
  - completed practices
  - current streak
- Added a current-focus narrative that changes based on available data.
- Added three insight cards:
  - strongest area
  - area needing attention
  - practice rhythm
- Polished chart empty states so new users get useful guidance instead of blank chart panels.
- Refined Recharts presentation with softer grid lines, tighter margins, and calmer tooltip styling.

## Preserved Behavior

- Existing score calculations remain unchanged.
- Existing local/cloud repository reads remain unchanged.
- Existing Recharts components remain in use.
- Existing range switching and category filtering remain available.
- No schema, auth, sync, export/import, or migration logic changed.

## Validation

The implementation should continue to pass:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`
