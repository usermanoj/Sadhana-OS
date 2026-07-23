# Empty/Error/Loading State Polish

Task 053 adds a small shared feedback pattern for premium B2C trust surfaces.

## What Changed

- Introduced `StatePanel` for empty or larger contextual states.
- Introduced `StateBanner` for compact success, warning, error, and loading feedback.
- Introduced `EmptyDataPanel` as a convenience wrapper for quiet empty states.
- Applied the pattern to:
  - Settings category empty states.
  - Audit log empty state.
  - Data import/export status messages.
  - Account local-only and magic-link status messages.
  - Privacy deletion and backup status messages.
  - Journal history empty state.
  - Dashboard chart and category-average no-data states.

## Product Principle

Empty and error states should not feel like broken pages. They should explain what is happening, preserve user trust, and offer the next calm step without clutter.

## Accessibility Notes

- Empty panels use `role="note"` by default.
- Warning and error banners use `role="alert"` by default.
- Screens that already relied on non-interruptive status messaging can override banners to `role="status"`.

## Out of Scope

- No cloud sync behavior changes.
- No auth behavior changes.
- No database or RLS changes.
- No export/import data contract changes.
