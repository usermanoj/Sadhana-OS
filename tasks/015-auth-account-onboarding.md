# Task 015 - Auth, Account, And Onboarding

## Goal

Add the v0.2 authentication foundation using Supabase Auth while preserving local-only MVP behavior when Supabase is not configured.

## Prerequisites

- Task 012 completed.
- Task 013 completed.
- Task 014 completed.

## Scope

- Add Supabase JS client dependency.
- Add environment detection for Supabase URL and anon key.
- Add Supabase client factory.
- Add auth helper functions.
- Add `AuthProvider` and `AuthGate`.
- Add sign-in screen for configured cloud environments.
- Add onboarding screen for signed-in users without completed onboarding.
- Add Account settings screen.
- Keep local-only mode as the default when env vars are missing.
- Add tests for environment detection, auth gate, and account display states.

## Non-Goals

- Do not wire core app data to Supabase yet.
- Do not migrate localStorage data yet.
- Do not add payments.
- Do not add password auth.
- Do not add native mobile.
- Do not delete local data on sign-out.

## Files

Create:

```text
.env.example
docs/13-auth-security-privacy.md
src/lib/env.ts
src/lib/env.test.ts
src/lib/supabaseClient.ts
src/lib/auth.ts
src/auth/AuthProvider.tsx
src/auth/AuthProvider.test.tsx
src/components/auth/AuthScreen.tsx
src/components/onboarding/OnboardingScreen.tsx
src/components/settings/AccountScreen.tsx
src/components/settings/AccountScreen.test.tsx
tasks/015-auth-account-onboarding.md
```

Modify:

```text
package.json
package-lock.json
src/main.tsx
src/vite-env.d.ts
src/components/pages/SettingsScreen.tsx
```

## Acceptance Criteria

- [ ] App remains local-only when Supabase env vars are missing.
- [ ] Supabase client is only created when env vars are present.
- [ ] Auth provider exposes session, user, profile, sign-in, OAuth, sign-out, refresh, and onboarding actions.
- [ ] Configured signed-out users see a sign-in screen.
- [ ] Signed-in users without onboarding see onboarding.
- [ ] Settings includes Account.
- [ ] Account shows local-only status without env vars.
- [ ] Tests cover config and auth/account rendering.
- [ ] Typecheck passes.
- [ ] Unit/integration tests pass.
- [ ] Production build passes.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Run Playwright because the app shell and Settings UI changed:

```bash
npm run test:e2e
```

## References

- `docs/11-production-architecture.md`
- `docs/13-auth-security-privacy.md`
- `docs/12-cloud-data-model.md`
