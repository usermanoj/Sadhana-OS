# Task 054 - Auth And Cloud Bootstrap Resilience

## Goal

Prevent an unavailable Supabase project or stalled account-profile request from leaving Sadhana OS on an indefinite startup screen.

## Scope

- Bound session restoration and profile loading with an eight-second timeout.
- Replace indefinite startup loading with a calm recovery screen.
- Add an explicit retry action that starts a fresh auth bootstrap attempt.
- Keep private app content locked when an authenticated profile cannot be confirmed.
- Record privacy-safe bootstrap failures and retry events through the observability boundary.
- Preserve local-only startup when Supabase is intentionally not configured.

## Non-Goals

- No Supabase schema or RLS changes.
- No cloud sync, migration, import, or export changes.
- No automatic fallback from a cloud account to unscoped local data.
- No production Supabase, OAuth, or SMTP configuration.
- No changes to sign-in methods or session persistence settings.

## Files

- `src/auth/AuthProvider.tsx`
- `src/auth/AuthProvider.test.tsx`
- `src/auth/AuthProvider.bootstrap.test.tsx`
- `src/components/auth/AuthBootstrapScreen.tsx`
- `src/lib/authBootstrap.ts`
- `src/lib/authBootstrap.test.ts`
- `src/lib/observability.ts`
- `src/lib/observability.test.ts`
- `docs/49-auth-cloud-bootstrap-resilience.md`
- `tasks/054-auth-cloud-bootstrap-resilience.md`

## Acceptance Criteria

- [x] Session restoration cannot remain pending indefinitely.
- [x] Profile loading cannot remain pending indefinitely.
- [x] A stalled bootstrap reaches a friendly recovery state.
- [x] Retry starts a fresh bootstrap attempt.
- [x] Signed-in app content stays locked if cloud identity data cannot be confirmed.
- [x] Local-only mode remains unchanged.
- [x] Timeout, recovery, privacy-lock, and retry behavior have unit coverage.
- [x] Lint, typecheck, unit tests, build, and Playwright regression pass.
