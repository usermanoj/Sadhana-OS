# Task 038 - Production Observability Foundation

## Goal

Create a privacy-safe production observability foundation for Sadhana OS before adding a real monitoring or analytics vendor.

## Scope

- Strengthen the existing vendor-neutral observability helper.
- Keep all telemetry payloads privacy-safe by default.
- Add a root React error boundary so render failures do not leave users with a blank screen.
- Capture global browser runtime errors and unhandled promise rejections.
- Add a client adapter seam for future Sentry, PostHog, or similar integrations.
- Document production setup expectations and data boundaries.

## Non-Goals

- Do not add a Sentry, PostHog, LogRocket, or other vendor SDK.
- Do not add production secrets or vendor project keys.
- Do not change Supabase schema, RLS, auth, export/import, or sync behavior.
- Do not record journal text, habit names, category names, practice values, emails, user IDs, tokens, or session data.

## Files

- `src/lib/observability.ts`
- `src/lib/observability.test.ts`
- `src/components/layout/AppErrorBoundary.tsx`
- `src/components/layout/AppErrorBoundary.test.tsx`
- `src/main.tsx`
- `src/auth/AuthProvider.tsx`
- `src/components/settings/DataScreen.tsx`
- `src/components/settings/LocalMigrationPanel.tsx`
- `src/lib/pwa.ts`
- `docs/33-production-observability-foundation.md`
- `docs/16-deployment-observability.md`
- `tasks/038-production-observability-foundation.md`

## Acceptance Criteria

- [x] Analytics events pass through an approved event-name allowlist.
- [x] Telemetry payloads redact or remove private practice and account fields.
- [x] Runtime errors and unhandled promise rejections are captured after app startup.
- [x] React render failures show a calm recovery screen and report a sanitized error.
- [x] Future vendor integration can plug into one client adapter without spreading SDK calls across the app.
- [x] Documentation explains allowed telemetry, forbidden data, vendor setup, and production validation.
- [x] `npm run lint` passes.
- [x] `npm run typecheck` passes.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run test:e2e` passes.

## Result

Implemented and validated. Task 038 adds a privacy-safe frontend observability foundation without adding a third-party vendor SDK or secrets.
