# 26 - Cloud RLS Live Validation

## Purpose

This document explains how Sadhana OS validates cloud persistence and Row Level Security against a real Supabase development or staging project.

It records:

- What the live validation script does.
- The latest successful live validation result.
- Why User A/User B isolation matters for a B2C spiritual wellness product.
- How to re-run validation safely.
- What this validation does and does not prove.

This validation is a hardening step after the schema/repository audit. It proves behavior that mocked tests and SQL text checks cannot prove.

## Latest Live Validation Result

| Field | Result |
|-------|--------|
| Date | 2026-06-03 |
| Environment | Supabase development/staging project |
| Command | `npm run validate:cloud-rls` |
| Result | PASS |
| Total checks | 38 passing checks |
| Auth method | Two real Supabase Auth users |
| Key used | Supabase anon/publishable key only |
| Service-role key used | No |
| Credential storage | Local terminal environment variables only |

No Supabase service-role key was used. No test passwords or secrets should be stored in the repository.

Successful checks:

- User A sign-in: PASS.
- User B sign-in: PASS.
- Distinct test users: PASS.
- User A has own settings row: PASS.
- User A can insert own category: PASS.
- User A can insert own habit: PASS.
- User A can insert own daily entry: PASS.
- User A can insert own daily habit entry: PASS.
- User A can insert own journal entry: PASS.
- User A can insert own audit log: PASS.
- User A can insert own sync mutation: PASS.
- User B cannot select User A profile: PASS.
- User B cannot select User A settings: PASS.
- User B cannot select User A category: PASS.
- User B cannot select User A habit: PASS.
- User B cannot select User A daily entry: PASS.
- User B cannot select User A daily habit entry: PASS.
- User B cannot select User A journal: PASS.
- User B cannot select User A audit log: PASS.
- User B cannot select User A sync mutation: PASS.
- User B cannot insert category with User A owner: PASS.
- Cross-user habit/category FK is rejected: PASS.
- User A category stayed unchanged after User B update attempt: PASS.
- User B cannot update User A category: PASS.
- User A sync mutation stayed unchanged after User B update attempt: PASS.
- User B cannot update User A sync mutation: PASS.
- User A category stayed present after User B delete attempt: PASS.
- User B cannot delete User A category: PASS.
- User A journal stayed present after own delete attempt: PASS.
- Normal user cannot hard-delete own journal entry: PASS.
- Sync mutation stayed present after own delete attempt: PASS.
- Normal user cannot hard-delete own sync mutation: PASS.
- Audit log stayed unchanged after own update attempt: PASS.
- Normal user cannot update own audit log: PASS.
- Audit log stayed present after own delete attempt: PASS.
- Normal user cannot hard-delete own audit log: PASS.
- Archive temporary habit: PASS.
- Archive temporary category: PASS.

Final output:

```text
Live Supabase RLS validation passed.
```

Task 026.5 `sync_mutations` checks are included in the latest successful run.

## What Was Validated

The live run validated the actual Supabase project, not only local mocks.

It proved:

- Two real Supabase users could authenticate with normal email/password sessions.
- User A could create User A-owned product data.
- User B could not read User A private rows.
- User B could not insert a row with User A ownership.
- User B could not modify or delete User A category data.
- User B could not read or modify User A sync mutation history.
- Cross-user habit/category relationships were rejected.
- A normal user could not hard-delete protected journal data.
- A normal user could not hard-delete sync mutation history.
- Audit logs behaved as append-only from the normal-user perspective.
- Temporary validation rows were archived instead of hard-deleted.

The validated tables included:

- `profiles`
- `user_settings`
- `categories`
- `habits`
- `daily_entries`
- `daily_habit_entries`
- `journal_entries`
- `audit_log_entries`
- `sync_mutations`

## Why This Matters

Authentication proves who the user is.

Row Level Security proves what that user can access.

For Sadhana OS, this matters because the product stores deeply private records:

- Daily practice history.
- Habit and discipline configuration.
- Journal reflections.
- Mental health and self-observation notes.
- Family, society, and professional-life practice records.
- Spiritual and personal growth data.

For a B2C wellness app, User A must never see or modify User B data, and User B must never see or modify User A data.

The successful live validation is a major production-readiness milestone because it proves the deployed Supabase development/staging project enforces core user isolation with real authenticated sessions and the public anon key.

## Script Location

```text
scripts/validate-cloud-rls.mjs
```

Package script:

```text
npm run validate:cloud-rls
```

## How To Re-run The Validation

Use a development or staging Supabase project only.

Set environment variables in your local terminal session. Use placeholders here; never commit real values.

```powershell
$env:VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="<publishable-or-anon-key>"
$env:SADHANA_RLS_USER_A_EMAIL="<test-user-a-email>"
$env:SADHANA_RLS_USER_A_PASSWORD="<test-user-a-password>"
$env:SADHANA_RLS_USER_B_EMAIL="<test-user-b-email>"
$env:SADHANA_RLS_USER_B_PASSWORD="<test-user-b-password>"
npm run validate:cloud-rls
```

Safety notes:

- Use development or staging only.
- Test users must already exist and be able to sign in.
- Do not use the Supabase service-role key.
- Do not commit environment variables or passwords.
- Do not paste real passwords into documentation, tasks, commits, or issue comments.
- Clear terminal environment variables after use.

Help:

```powershell
npm run validate:cloud-rls -- --help
```

## How To Clear Local Test Credentials

After running the validation, clear the temporary test-user environment variables:

```powershell
Remove-Item Env:SADHANA_RLS_USER_A_EMAIL
Remove-Item Env:SADHANA_RLS_USER_A_PASSWORD
Remove-Item Env:SADHANA_RLS_USER_B_EMAIL
Remove-Item Env:SADHANA_RLS_USER_B_PASSWORD
```

Optionally also clear Supabase connection variables for that terminal:

```powershell
Remove-Item Env:VITE_SUPABASE_URL
Remove-Item Env:VITE_SUPABASE_ANON_KEY
```

## Expected Result

The script should print passing checks and end with:

```text
Live Supabase RLS validation passed.
```

If it fails, do not mark cloud persistence production-ready. Inspect the failed check and verify:

- Supabase URL and anon key are correct.
- Both test users exist.
- Both passwords are correct.
- Email/password login is enabled.
- The latest migration has been applied.
- RLS is enabled in the target project.
- The script matches the current table schema.

## Data Created

The script creates temporary rows under User A.

It archives the temporary category and habit to reduce UI clutter. It also leaves non-sensitive audit and sync mutation validation history. It does not hard-delete rows because normal app users should not have delete policies.

The generated daily and journal rows use a far-future validation date to avoid normal customer data.

Run this script only against development or staging projects.

## Security And Secret Handling

Do not commit:

- Supabase anon/publishable key values.
- Supabase service-role key values.
- Test-user emails if they are private.
- Test-user passwords.
- Google OAuth secrets.
- SMTP secrets.

The script intentionally uses only the anon/publishable key and normal test-user credentials. This mirrors the browser client threat model and validates RLS from the normal-user perspective.

## What This Does Not Yet Prove

Passing this validation does not fully prove:

- Offline sync behavior.
- Sync retry behavior.
- Durable mutation queue behavior.
- Conflict handling.
- Cross-browser or cross-device cloud sync.
- Local-to-cloud migration UX.
- JSON import/export cloud completion.
- Production SMTP/email deliverability.
- Apple OAuth.
- Account deletion/export flows.
- Production performance at scale.

Those remain separate hardening tasks.

## Recommended Next Tasks

- Task 026.6 - Migration Cache Refresh.
- Task 026.7 - Cloud Import Job Tracking.
- Task 026.8 - Export Freshness Guarantee.
- Task 026.9 - Guided Conflict Resolution.
- Cross-browser/cross-device cloud sync validation.
- Later - Production SMTP.
- Later - Apple OAuth.
- Later - Account deletion/export hardening.

## Production Readiness Interpretation

Passing this script means:

- Basic live RLS isolation works for the core product tables.
- Cross-user reads are blocked.
- Cross-user ownership writes are blocked.
- Cross-user relationships are blocked.
- Audit logs are append-only from the browser client.
- Sync mutation history is user-isolated when the Task 026.5 migration has been applied and the updated script has passed.
- Normal-user hard deletes are blocked.

This is a major milestone, but it does not by itself make the full cloud persistence system production-ready. Sync health, retries, conflict handling, and migration UX still need hardening.
