# 24 - Auth Unblock Dev

## Purpose

Phase A unblocks local development and testing from Supabase magic-link email rate limits.

The app should let developers and early testers sign in without repeatedly sending magic-link emails.

## Implemented Frontend Behavior

- Google OAuth is the primary provider button.
- Email/password sign-in is available on the main auth screen.
- Email/password account creation is available from the same screen.
- Magic link is still supported, but only behind `Use magic link instead`.
- Magic-link resend is disabled for 60 seconds after a send request.
- The magic-link fallback shows a countdown while blocked.
- The app does not auto-send magic links on page load.
- Existing Supabase sessions are preserved across refreshes.
- Active sessions enter the app without requiring another email.
- Raw Supabase auth errors are mapped to customer-friendly messages.

Rate-limit errors show:

```text
Too many sign-in emails were requested. Please wait a few minutes, or use Google / password login.
```

## Manual Supabase Dashboard Settings

Open the Supabase project dashboard and configure Auth before local testing.

### Email Auth

Enable:

- Email provider.
- Email/password signups.

Magic link may remain enabled, but it is no longer the primary app sign-in action.

### Google Auth

Enable Google provider in:

```text
Authentication -> Providers -> Google
```

Use Google Cloud OAuth credentials. Do not place Google OAuth secrets in frontend code.

### URL Configuration

In:

```text
Authentication -> URL Configuration
```

Set Site URL:

```text
http://localhost:5173
```

Add Redirect URLs:

```text
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
http://127.0.0.1:5173/
```

If Vite runs on another local port, add that exact port too.

## Frontend Environment

The app uses only public Supabase browser values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Do not expose service-role keys or OAuth client secrets in Vite environment variables.

## Not In This Task

- Custom SMTP.
- Apple OAuth.
- Database schema changes.
- Row Level Security policy changes.
- Production email templates.
- Account deletion.
- Payment or subscription logic.
- Production launch hardening.

## Validation Checklist

- Sign up with email and password.
- Sign in with email and password.
- Click Google and confirm Supabase starts the OAuth redirect.
- Open magic-link fallback and send once.
- Confirm the magic-link button enters a 60-second countdown.
- Refresh with an active session and confirm the app opens without sending email.
