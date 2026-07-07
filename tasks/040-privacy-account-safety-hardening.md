# Task 040 - Privacy And Account Safety Hardening

## Goal

Make Sadhana OS account deletion and privacy controls safer, clearer, and more production-ready before broader B2C testing.

## Scope

- Strengthen Settings > Privacy deletion confirmation UX.
- Add explicit export-before-delete guidance.
- Add a typed confirmation phrase for account deletion.
- Require explicit backup/no-backup acknowledgement before enabling deletion.
- Keep local browser data behavior clear.
- Keep deletion request routed through the existing Supabase Edge Function.
- Add tests for account deletion safety states.
- Document current behavior and remaining production limitations.

## Non-Goals

- Do not change Supabase schema.
- Do not change RLS policies.
- Do not change the `delete-account` Edge Function behavior.
- Do not add retention automation.
- Do not implement payment/subscription.
- Do not remove existing export/import.
- Do not clear localStorage automatically.

## Files

- `src/components/settings/PrivacyScreen.tsx`
- `src/components/settings/PrivacyScreen.test.tsx`
- `src/lib/privacy.ts`
- `src/lib/privacy.test.ts`
- `docs/13-auth-security-privacy.md`
- `docs/34-privacy-account-safety-hardening.md`
- `tasks/040-privacy-account-safety-hardening.md`

## Acceptance Criteria

- [x] Privacy screen still shows local-only cloud state when Supabase is not configured.
- [x] Signed-in users see clear export-before-delete guidance.
- [x] Signed-in users see local browser data warning.
- [x] Signed-in users see retention/backups warning.
- [x] Account deletion button is disabled by default.
- [x] Account deletion requires backup/no-backup acknowledgement.
- [x] Account deletion requires exact typed phrase.
- [x] Confirmed deletion invokes the existing Edge Function helper.
- [x] Confirmed deletion signs the user out after successful request.
- [x] Deletion failures show a safe error.
- [x] Existing JSON export remains available.
- [x] `npm run lint` passes.
- [x] `npm run typecheck` passes.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run test:e2e` passes.

## Result

Implemented and validated. Task 040 hardens the frontend account deletion UX without changing backend deletion behavior, Supabase schema, or local data clearing behavior.
