# Task 053 - Premium Empty/Error/Loading State Polish

## Goal

Upgrade Sadhana OS empty, error, success, warning, and loading feedback so the app feels intentional during quiet states, failed operations, and first-run analytics.

## Scope

- Add a reusable premium feedback surface for empty panels and compact banners.
- Apply it to settings, data backup/import, account, privacy, journal history, and dashboard no-data chart states.
- Preserve existing business logic, persistence, cloud sync, auth, export/import, and privacy behavior.
- Keep messages mobile-friendly, calm, and trust-oriented.

## Non-Goals

- No schema changes.
- No auth or cloud sync behavior changes.
- No import/export logic changes.
- No new production dependencies.
- No broad redesign of Today, Journal, Dashboard, History, or Settings beyond state feedback surfaces.

## Acceptance Criteria

- Empty states use an icon, title, concise supporting copy, and premium surface treatment.
- Error and warning feedback use consistent visual treatment and accessible roles.
- Existing tests continue to pass.
- New shared feedback behavior has unit coverage.
- Typecheck, lint, unit tests, build, and Playwright regression pass before merge.

## Validation Notes

- Data export/import messages remain text-compatible with existing tests.
- Account and Privacy screens keep `role="status"` for existing non-interruptive feedback expectations.
- Warning/error banners default to `role="alert"` unless a caller explicitly overrides this.
