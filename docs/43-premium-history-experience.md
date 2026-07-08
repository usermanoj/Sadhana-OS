# Premium History Experience

Task 048 upgrades History from a basic record list into a calmer premium archive surface.

## What Changed

- Added a premium "Practice Archive" hero.
- Added summary counts for:
  - practice records
  - journal records
  - audit records
  - archived records
- Replaced compact section tabs with larger card-style section controls.
- Added clearer filter framing and a "Clear filters" action.
- Refined practice cards with score, recorded value, and note treatment.
- Refined journal cards with saved reflection titles and metadata.
- Refined audit cards with preserved status and old/new value panels.
- Refined archived item cards while preserving restore actions.

## Preserved Behavior

- Practice history still comes from existing daily entries.
- Journal history still comes from existing journal entries.
- Audit history remains preserved and visible.
- Archived categories and habits remain restorable.
- Date and category filters continue to work.
- No data model, cloud sync, RLS, auth, migration, export, or import logic changed.

## Validation

The implementation should continue to pass:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`
