# Task 026 - Live RLS User Isolation Validation

## Status

Completed / Passed

## Goal

Provide a repeatable live Supabase validation script for user-owned cloud persistence and Row Level Security.

## Scope

- Add a script that signs in two normal Supabase users with the anon key.
- Validate User A/User B row isolation across core user-owned tables.
- Validate that cross-user ownership writes fail.
- Validate that cross-user relationships fail.
- Validate that normal users cannot hard-delete product data.
- Validate that audit logs remain append-only.
- Document how to run the script safely.

## Out Of Scope

- Do not change app code.
- Do not change Supabase schema.
- Do not change RLS policies.
- Do not add dependencies.
- Do not use service-role keys.
- Do not commit test-user credentials.
- Do not implement sync health UI.
- Do not implement durable retry queues.

## Files

Created:

```text
scripts/validate-cloud-rls.mjs
docs/26-cloud-rls-live-validation.md
tasks/026-live-rls-user-isolation-validation.md
```

Modified:

```text
package.json
```

## Command

```powershell
npm run validate:cloud-rls
```

The command requires environment variables documented in:

```text
docs/26-cloud-rls-live-validation.md
```

## Acceptance Criteria

- [x] Script uses anon key, not service-role key.
- [x] Script requires credentials through environment variables only.
- [x] Script does not hard-delete data.
- [x] Script validates live User A/User B isolation.
- [x] Script validates blocked cross-user ownership writes.
- [x] Script validates blocked normal-user hard deletes.
- [x] Script validates audit logs are append-only.
- [x] Documentation explains setup, run command, expected result, and limitations.
- [x] Script has been run successfully against the real development Supabase project.

## Result Summary

Latest live validation:

```text
Date: 2026-06-03
Environment: Supabase development/staging project
Command: npm run validate:cloud-rls
Result: PASS
Total checks: 32 passing checks
Key type: Supabase anon/publishable key only
Service-role key: Not used
Credentials: Supplied through local environment variables only
```

Validated:

- User A and User B signed in as distinct real Supabase users.
- User A could create own product data.
- User B could not read User A private data.
- User B could not insert rows with User A ownership.
- User B could not update or delete User A category data.
- Cross-user habit/category FK writes were rejected.
- Normal users could not hard-delete protected journal rows.
- Normal users could not update or delete audit logs.
- Temporary validation category and habit rows were archived, not hard-deleted.

Recommended next tasks:

- Task 026.2 - Cloud Sync Status, Retry, and Error UX.
- Task 026.3 - Local-to-Cloud Migration UX.
- Task 026.4 - Cross-browser/cross-device cloud sync validation.
- Later - Production SMTP, Apple OAuth, account deletion/export hardening.

## Verification

Local verification:

```powershell
node scripts/validate-cloud-rls.mjs --help
```

Full live verification was completed against the development/staging Supabase project on 2026-06-03.
