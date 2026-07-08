# Task 049 - Premium Settings And Trust Center Experience

## Goal

Upgrade Settings from an MVP utility panel into a premium control center for practice setup, backup trust, account sync, privacy, and audit history.

## Scope

- Keep all existing Settings routes and behavior.
- Preserve category/practice archive and restore flows.
- Preserve export/import, cloud sync, local migration, privacy, and audit behavior.
- Improve the Settings shell with a premium hero, control-area navigation, and summary metrics.
- Make Practice Setup clearer and more polished without changing data logic.
- Align Data, Account, Privacy, and Audit copy with a trust-center model.

## Non-Goals

- No schema changes.
- No authentication changes.
- No cloud sync logic changes.
- No export/import logic changes.
- No hard-delete behavior.
- No new production dependencies.

## Acceptance Criteria

- Settings still supports Categories, Data, Account, Privacy, and Audit Log sections.
- Existing hash routes such as `#/settings/data` still work.
- Category add/edit/archive/restore behavior remains intact.
- Data export/import controls remain available.
- Account and privacy controls remain available.
- Tests, typecheck, build, and e2e pass.
