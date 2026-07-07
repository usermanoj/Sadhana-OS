# 13 - Auth, Security, And Privacy

## Purpose

This document defines the v0.2 authentication, account, onboarding, and privacy foundation for Sadhana OS.

## Authentication Decision

Sadhana OS uses Supabase Auth for production identity.

Production auth must not depend on email magic links as the only primary path. The recommended B2C sign-in order is:

1. Google OAuth.
2. Email and password.
3. Magic link fallback for users who cannot or do not want to use a password.

Apple OAuth is planned for a later production hardening phase and is not part of Phase A.

This keeps the app scalable during sign-in spikes, reduces transactional email pressure, and gives users familiar consumer login choices.

## Supported v0.2 Methods

| Method | Role | Notes |
|--------|------|-------|
| Google OAuth | Primary | Configure in Supabase and Google Cloud before production |
| Email/password | Primary fallback | Supports account creation, sign-in, and password recovery |
| Magic link | Secondary fallback | Protected by client cooldown and production SMTP limits |

MFA and passkeys remain future options. They should be introduced after the account model, support process, and recovery UX are mature.

## Environment Configuration

The frontend uses only public Supabase client values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

If either value is missing, the app remains in local-only MVP mode. This preserves development ergonomics and prevents partial cloud behavior.

Never place the Supabase service-role key in frontend code or in Vite environment variables.

## Supabase Auth Configuration

Production Supabase Auth settings must include:

- Site URL for the deployed app domain.
- Redirect URLs for deployed app, local development, preview deployments, and password recovery.
- Google provider enabled with approved OAuth redirect URI.
- Email/password enabled.
- Magic link enabled only as a fallback path.
- Custom SMTP configured before real customer launch.
- Email templates branded for Sadhana OS and written in calm, clear language.

Development settings may include:

```text
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
http://127.0.0.1:5173/
```

Use the current Vite port if development runs on a different port.

## Custom SMTP Strategy

Supabase's built-in email service is not suitable as the production email backbone for a B2C app. Before launch, configure Supabase Auth to send through a transactional email provider.

Recommended options:

| Provider | Strength | Tradeoff |
|----------|----------|----------|
| Postmark | Best transactional deliverability and simple setup | Higher entry cost than some alternatives |
| Resend | Developer-friendly setup and modern dashboard | Younger platform than Postmark |
| AWS SES | Very low cost at scale | More setup, deliverability, and support burden |
| SendGrid | Mature and widely used | Reputation can vary by plan/IP pool |
| Brevo | Good general-purpose option | Less premium transactional focus than Postmark |

Recommended default for Sadhana OS: Postmark for production, Resend for early staging if speed matters, AWS SES only when cost optimization becomes important.

Required DNS records:

- SPF.
- DKIM.
- DMARC.
- Optional custom return-path/bounce domain when provider supports it.

Use a sending subdomain such as:

```text
mail.sadhanaos.com
```

## Rate-Limit Strategy

Rate limits should be handled at multiple layers:

- Prefer OAuth and email/password so normal sign-in does not require sending an email every time.
- Keep magic link and password reset behind a client-side cooldown.
- Show a clear wait state after sending auth email.
- Use Supabase Auth and SMTP provider limits as server-side enforcement.
- Monitor email send failures and auth errors before broad launch.

Client cooldown is user-experience protection, not a security control. Production still requires provider-side limits.

## Friendly Error Messages

The client must avoid exposing raw provider errors to customers.

Required mappings:

- Rate limit: ask the user to wait before requesting another email.
- Invalid credentials: say the email or password did not match.
- Unconfirmed email: ask the user to confirm email first.
- Weak password: ask the user to choose a stronger password.
- Network failure: ask the user to check their connection.
- OAuth/provider failure: ask the user to try provider sign-in again.

Detailed errors belong in observability, not customer-facing UI.

## Session Persistence

The Supabase browser client uses:

- `persistSession: true`.
- `autoRefreshToken: true`.
- `detectSessionInUrl: true`.

The app must continue to:

- Keep Supabase session state separate from local legacy data.
- Preserve local v0.1 data on sign-out.
- Reload profile and settings after session changes.
- Enter password recovery state when Supabase emits `PASSWORD_RECOVERY`.

## Runtime Modes

| Mode | Behavior |
|------|----------|
| Local-only | Supabase env is missing; existing localStorage MVP opens normally |
| Signed out cloud | Supabase env exists; user sees production sign-in options |
| Password recovery | User follows a reset link and must set a new password before entering app |
| Signed in cloud | User has a Supabase session and can use cloud account features |
| Onboarding pending | Signed-in user must confirm profile details before entering the app |
| Error | Auth/profile sync failed; app shows recoverable account state |

## Account UX

The primary signed-out experience is the standalone auth screen.

It must show:

- Google sign-in first.
- Email/password sign-in and account creation.
- Password reset.
- Magic-link fallback behind an explicit secondary action.
- Friendly errors and cooldown labels.

The account surface in Settings remains a secondary cloud identity surface.

It must show:

- Local-only configuration state.
- Signed-in account identity.
- Timezone and week-start settings after onboarding.
- Sign-out action.
- Secondary magic-link fallback with cooldown only when reachable in a signed-out account state.

The experience should remain quiet, premium, mobile-first, and privacy-forward.

## Onboarding

After the first cloud sign-in, the user confirms:

- Display name.
- Timezone.
- Week start day.

Onboarding writes:

- `profiles.display_name`
- `profiles.timezone`
- `profiles.onboarding_completed_at`
- `user_settings.week_starts_on`

LocalStorage migration is intentionally separate and belongs to Task 016.

## Row-Level Security Assumptions

All user-owned cloud data is protected by Supabase RLS.

Required assumptions:

- Every user-owned table has a `user_id` or equivalent owner key.
- Policies compare row owner fields to `auth.uid()`.
- Browser clients use only the anon key and user session.
- Service-role access is restricted to Supabase Edge Functions and operational scripts.
- Account deletion uses a server-side flow, never direct browser service-role access.

## Privacy Requirements

- Do not send journal content, habit names, category names, or practice values to analytics.
- Export/import remains available.
- User must be able to request account deletion.
- Local-only mode must remain transparent.
- The app must clearly distinguish local-only state from cloud account state.

## Account Deletion

Cloud account deletion is requested from Settings > Privacy.

Deletion rules:

- The user must be signed in.
- The user must acknowledge backup/no-backup risk.
- The user must type the exact confirmation phrase before the deletion action is enabled.
- The browser client calls the `delete-account` Supabase Edge Function.
- The Edge Function uses the service-role key server-side.
- The service-role key must never be exposed to the browser.
- Deleting the Supabase Auth user cascades user-owned table rows through foreign keys.
- Local browser data is not cleared automatically; local deletion should be a separate explicit action.
- Provider backup and legal retention windows may still apply and must be described in the production privacy policy.

Task 040 documents the hardened frontend flow in:

```text
docs/34-privacy-account-safety-hardening.md
```

## Production vs Development

Development may use local ports, test OAuth applications, and local-only fallback.

Production must have:

- Deployed app URL configured as Site URL.
- Production OAuth apps.
- Custom SMTP with verified DNS.
- Branded auth email templates.
- Error monitoring enabled.
- Privacy policy and support contact available before public launch.

## Dependency Note

`@supabase/supabase-js` is required for:

- Supabase Auth session management.
- Email/password account creation and sign-in.
- Password reset and password update.
- Magic-link fallback.
- OAuth sign-in.
- Sign-out.
- Cloud data access through the repository layer.
