# Task 024 - Production B2C Auth Flow

## Status

Completed

## Goal

Upgrade Sadhana OS authentication from magic-link-first to a scalable production B2C auth flow while preserving local-only MVP behavior and existing cloud account behavior.

## Scope

- Keep Supabase Auth as the identity provider.
- Make Google OAuth the primary visible provider sign-in method.
- Add email/password sign-in.
- Add email/password account creation.
- Add password reset email flow.
- Add password recovery screen for setting a new password.
- Keep magic link as an explicit fallback, not the primary path.
- Add client-side cooldown for magic link and password reset email requests.
- Map raw auth failures to friendly customer-facing messages.
- Preserve session persistence through the Supabase client.
- Preserve local-only mode when Supabase env vars are missing.
- Preserve export/import, audit history, cloud migration, and local legacy data.

## Out Of Scope

- Native mobile app.
- Passkeys.
- MFA.
- Payment/subscription auth gates.
- Server-side account deletion changes.
- SMTP provider account setup.
- OAuth provider console setup.

## Files

Created:

```text
src/lib/authErrors.ts
src/lib/authErrors.test.ts
src/lib/authCooldown.ts
src/lib/authCooldown.test.ts
src/components/auth/ResetPasswordScreen.tsx
src/components/auth/ResetPasswordScreen.test.tsx
src/components/auth/AuthScreen.test.tsx
tasks/024-production-b2c-auth-flow.md
```

Modified:

```text
docs/13-auth-security-privacy.md
src/lib/auth.ts
src/auth/AuthProvider.tsx
src/auth/AuthProvider.test.tsx
src/components/auth/AuthScreen.tsx
src/components/settings/AccountScreen.tsx
src/components/settings/AccountScreen.test.tsx
```

## Acceptance Criteria

- [x] Signed-out cloud users see Google before email/password.
- [x] Email/password sign-in calls Supabase password auth.
- [x] Email/password signup calls Supabase signup.
- [x] Password reset sends a reset email.
- [x] Password recovery links show a set-new-password screen.
- [x] Magic link remains available as a fallback.
- [x] Magic-link and password-reset requests show cooldown states.
- [x] Rate-limit and auth errors are customer-friendly.
- [x] Local-only mode still opens the MVP app.
- [x] Existing tests pass.
- [x] Typecheck passes.
- [x] Production build passes.
- [x] Playwright smoke tests pass.

## Verification

Completed:

```bash
npm run typecheck # passed
npm test # 39 files, 201 tests passed
npm run build # passed
npm run test:e2e # 3 passed
$env:NODE_OPTIONS='--use-system-ca'; npm audit # found 0 vulnerabilities
```

## References

- `docs/13-auth-security-privacy.md`
- `tasks/015-auth-account-onboarding.md`
- `tasks/020-observability-deployment-ci.md`
