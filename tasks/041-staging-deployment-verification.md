# Task 041 - Staging Deployment Verification

## Goal

Add repeatable staging deployment verification support so Sadhana OS can move from local confidence to production-like staging evidence.

## Scope

- Add a staging verification runbook.
- Add a safe staging verification report generator.
- Add an npm script for generating the report.
- Update existing staging setup docs to point to the verification runbook.
- Keep all secrets and disposable test credentials outside Git.

## Non-Goals

- Do not create a Supabase staging project automatically.
- Do not deploy to Vercel automatically.
- Do not add staging credentials or secrets.
- Do not change app functionality.
- Do not change Supabase schema or RLS.
- Do not change authentication behavior.
- Do not run destructive account deletion against non-disposable users.

## Files

- `docs/31-staging-environment-setup-guide.md`
- `docs/35-staging-deployment-verification.md`
- `scripts/create-staging-verification-report.mjs`
- `package.json`
- `tasks/041-staging-deployment-verification.md`

## Acceptance Criteria

- [x] Staging verification runbook exists.
- [x] Report generator exists and does not require secrets.
- [x] Report generator redacts obvious secrets if accidental metadata includes them.
- [x] `npm run create:staging-report -- --help` works.
- [x] `npm run create:staging-report -- --dry-run` works.
- [x] Existing staging setup guide references the new verification runbook.
- [x] No app behavior changes are introduced.
- [x] `npm run lint` passes.
- [x] `npm run typecheck` passes.
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run test:e2e` passes.

## Result

Implemented and validated locally. Actual staging execution remains pending until a staging Supabase project, staging deployment URL, and staging-only test users are available.
