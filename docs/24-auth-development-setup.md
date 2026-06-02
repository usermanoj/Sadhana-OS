# 24 - Auth Development Setup

## Purpose

This document records the current Sadhana OS authentication setup for local development and separates it from future production authentication and email infrastructure work.

It exists to:

- Keep the local development auth setup clear and repeatable.
- Prevent future confusion between development and production settings.
- Avoid committing secrets or provider credentials.
- Document what is intentionally deferred until production hardening.

## Current Auth Methods

Sadhana OS currently uses Supabase Auth.

Current local development auth supports:

- Email/password sign up.
- Email/password sign in.
- Google OAuth through Supabase.
- Magic-link fallback as a secondary option only.
- Supabase session persistence across refreshes.
- Sign out from the account screen.
- Friendly handling for email rate-limit errors.
- A 60-second magic-link resend cooldown when magic-link fallback is used.

Magic link is no longer the primary/default login action.

Not configured in the current development unblock:

- Apple OAuth.
- Custom SMTP.
- Branded production auth email templates.
- Production domain redirect URLs.
- Native mobile auth.
- Payment or subscription auth gates.

## Supabase Local Development Settings

Local app URL:

```text
http://localhost:5173
```

Supabase Auth URL configuration:

```text
Site URL:
http://localhost:5173
```

Redirect URLs:

```text
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
http://127.0.0.1:5173/
```

Required local Auth settings:

- Email provider enabled.
- Email/password signups enabled.
- Confirm email may be OFF for local development only if the team chooses faster testing.
- Confirm email must be ON before production.
- Minimum password length: 8.
- If configured in Supabase, require stronger password rules such as uppercase, lowercase, and number.
- Magic link may remain enabled, but it must not be the primary app login path.

Do not rely on Supabase's default email provider for production. It is acceptable only for early development and limited testing.

## Google OAuth Setup

Google OAuth credentials are created in Google Cloud Console.

The Google OAuth Client ID and Client Secret are pasted into Supabase Dashboard only:

```text
Authentication -> Providers -> Google
```

The Google OAuth Client Secret must never be committed to the repository.

Google Authorized JavaScript origins for local development:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Google Authorized redirect URI:

```text
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Supabase handles the Google callback and then redirects the user back to the app using the configured Site URL or redirect URL.

## Magic-Link Fallback

Magic link remains useful as a backup/passwordless option, but it should not be the primary login method.

Magic-link emails can trigger Supabase email rate limits during development, especially when repeatedly testing new accounts or sign-in links.

Rules for development:

- Use email/password or Google for normal testing.
- Use magic link only as a fallback.
- Do not repeatedly test magic-link emails.
- After sending a magic link, disable resend for 60 seconds.
- Show countdown text while resend is disabled.

Rate-limit errors should show:

```text
Too many sign-in emails were requested. Please wait a few minutes, or use Google / password login.
```

Raw provider errors may be logged for debugging, but customer-facing UI should stay calm and clear.

## Security Rules And Secret Handling

Never commit files containing real credentials or provider secrets.

Files that must never be committed:

```text
.env
.env.local
SadhanaOS-Supabase.txt
SadhanaOS-Supabase.local.txt
```

Also never commit any file containing:

- Real Google OAuth Client ID.
- Real Google OAuth Client Secret.
- Real Supabase anon key.
- Supabase service role key.
- Supabase project credentials.
- SMTP credentials.

Safe example files:

```text
.env.example
SadhanaOS-Supabase.example.txt
```

Notes:

- Supabase anon key may be used in frontend environment variables, but still manage it carefully.
- Supabase service role key must never be used in frontend code.
- Google OAuth Client Secret must only be stored in Supabase Dashboard.
- If a secret is accidentally committed, rotate it immediately and treat the old secret as compromised.

## Current Local Validation Checklist

Use this checklist after changing auth or Supabase local development settings:

- Email/password signup works.
- Email/password sign in works.
- Google login works.
- Sign out works.
- Refresh preserves session.
- Magic-link fallback is secondary.
- Magic-link cooldown works.
- App loads after login.
- No secrets are tracked in Git.

Useful commands:

```powershell
git ls-files .env .env.local SadhanaOS-Supabase.txt SadhanaOS-Supabase.local.txt
git grep -n -I "GOCSPX"
git grep -n -I "apps.googleusercontent.com"
npm run typecheck
npm test
npm run build
```

## Future Apple OAuth Integration

Apple OAuth is important for premium B2C and iPhone-oriented users, but it is not required for the current development unblock.

Add Apple OAuth later before serious iOS, PWA, or public production launch.

Apple OAuth requires:

- Apple Developer account setup.
- Services ID configuration.
- Domain and callback configuration.
- Supabase Apple provider setup.
- Additional validation on web and iOS-oriented browsers.

Keep Apple OAuth as a future task after Google, email/password, and production email infrastructure are stable.

## Future Production Email Infrastructure

Production email infrastructure is deferred until the app is more complete, polished, and closer to launch.

Production auth email will be needed for:

- Signup confirmation.
- Password reset.
- Email change confirmation.
- Magic-link fallback.
- Security and account emails.

Do not use Supabase's default email provider as the long-term production email system.

| Provider | Strengths | Tradeoffs | Recommended Use |
|----------|-----------|-----------|-----------------|
| Postmark | Strong deliverability, excellent transactional email focus, reliable production default | Slightly higher cost than ultra-low-cost options | Best Sadhana OS production default when reliability matters most |
| Resend | Fast developer-friendly setup, modern DX, good for early product testing | Less mature than older transactional email providers | Best if speed matters more than deep deliverability maturity |
| AWS SES | Lowest cost at scale, powerful AWS integration | More setup, more operational complexity, requires stronger bounce/complaint and domain reputation handling | Better later when volume and cost optimization matter |

Recommendation:

- Sadhana OS production default: Postmark.
- Fastest early setup: Resend.
- Later high-scale cost optimization: AWS SES.

## Future Production Auth Checklist

Before public production launch:

- Set production Site URL.
- Add production Redirect URLs.
- Turn Confirm Email ON.
- Configure custom SMTP.
- Brand auth email templates.
- Add Google production OAuth origin/domain.
- Add Apple OAuth.
- Validate password reset.
- Validate signup confirmation.
- Validate User A/User B data isolation.
- Validate RLS policies.
- Validate account export/delete later.
- Add monitoring/logging for auth failures.

## Deferred Items

Not implemented or configured yet:

- Custom SMTP.
- Branded production auth email templates.
- Apple OAuth.
- Production domain redirect URLs.
- Account deletion.
- Full production RLS validation.
- Subscription/payment auth integration.
- Native mobile auth.

## Summary

Current development auth is email/password plus Google OAuth, with magic link retained only as a fallback.

No real secrets should be committed. Use placeholders in documentation and example files, and keep real provider credentials in Supabase Dashboard or secure environment configuration only.

Production email infrastructure is intentionally deferred until the app is more complete and closer to launch. Postmark is the recommended production email provider later, with Resend as a fast early option and AWS SES as a future scale/cost option.

Apple OAuth should be added later for premium B2C and iOS readiness.
