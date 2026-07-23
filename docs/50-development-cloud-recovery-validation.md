# Development Cloud Recovery And Live Revalidation

Task 055 restores the Supabase development environment and replaces historical cloud-validation evidence with a current, repeatable validation record.

## Status

Status: **Passed**  
Validation date: 2026-07-23  
Git branch: `task/055-development-cloud-recovery-validation`

## Confirmed Diagnosis

The ignored local configuration contains a Supabase project URL and a publishable key, but the configured project hostname does not resolve in public DNS.

Observed result:

```text
DNS lookup: NXDOMAIN (DNS name does not exist)
```

This prevents Supabase Auth, profile loading, cloud sync, and live RLS validation from reaching the service. It is an environment availability/configuration failure rather than evidence of an application, schema, or RLS regression.

The project owner confirmed that the development project had been automatically paused and resumed it through the Supabase dashboard. DNS propagation completed shortly afterward. The configured project reference and publishable key remained valid, so `.env.local` did not require replacement.

Recovered connectivity:

```text
DNS lookup: resolved
Supabase Auth health with publishable key: HTTP 200
```

The repository remains protected:

- `.env.local` is ignored by Git.
- No key value is recorded in this report.
- No service-role key is required or permitted for live client/RLS validation.
- No `SADHANA_RLS_USER_*` credentials were present in the validation shell.

## Recovery Procedure Used

1. Confirmed the configured host initially returned DNS `NXDOMAIN`.
2. Confirmed the development project was automatically paused.
3. Resumed the existing project through the Supabase dashboard.
4. Waited for DNS restoration instead of rotating a still-valid project reference.
5. Confirmed Auth health with the ignored local publishable key.
6. Ran live RLS validation through normal authenticated sessions.
7. Revalidated cloud-backed browser journeys.

## Required Migrations

Apply and verify these committed migrations in order:

1. `supabase/migrations/20260601000000_initial_schema.sql`
2. `supabase/migrations/20260603000000_add_sync_mutations.sql`

Do not alter the schema or RLS policies merely to make the validation script pass. Any failure must first be classified as configuration, missing migration, test-data, script/schema mismatch, or a genuine policy defect.

## Live Validation Checklist

### Connectivity

- [x] Project hostname resolves.
- [x] HTTPS connection succeeds.
- [x] Supabase Auth health endpoint responds.
- [x] Project URL and publishable key belong to the same project.

### Dashboard And Schema

- [x] Required migrations are applied.
- [x] All expected user-owned tables are present.
- [x] RLS remains enabled on user-owned tables.
- [x] No service-role credential is exposed to the frontend.

### Authentication

- [x] Email/password provider is enabled for development.
- [x] Two disposable test users can sign in.
- [x] Session restoration works after reload.
- [x] Sign-out returns to the auth screen.

### RLS And Persistence

- [x] `npm run validate:cloud-rls` completes successfully.
- [x] User A can create and read owned data.
- [x] User B cannot read or mutate User A data.
- [x] Audit history cannot be changed or hard-deleted by a normal user.
- [x] Journal data cannot be hard-deleted by a normal user.
- [x] Sync mutation ownership and immutability checks pass.

### Browser Journey

- [x] A fresh user completes onboarding.
- [x] Starter practices are materialized once.
- [x] A completion persists after reload.
- [x] A journal reflection persists after reload.
- [x] A custom category/practice persists after reload.
- [x] Account switching clears private in-memory and local cached state.
- [x] User A data is absent when signed in as User B.
- [x] Cloud sync status returns to `Synced` after mutations.

### Recovery Regression

- [x] Invalid Supabase credentials leave private content locked.
- [x] The startup screen transitions to the recovery state within the configured timeout.
- [x] Restarting with valid local configuration restores the persisted session and route.

## Evidence Record

| Check | Status | Evidence |
|---|---|---|
| Initial configured hostname | Failed, recovered | Public DNS returned `NXDOMAIN` while the project was paused, then resolved after resume |
| `.env.local` ignored | Passed | Confirmed by `git check-ignore` |
| Publishable key present locally | Passed | Presence checked without printing the value |
| Service-role key required | Passed | Not required; validation uses publishable key and normal sessions |
| Supabase project status | Passed | Project owner resumed the existing development project |
| Auth health | Passed | Auth health endpoint returned HTTP 200 with the publishable key |
| Live RLS validation | Passed | 38 checks passed with two normal authenticated users |
| Existing-user browser isolation | Passed | User A reflection persisted; User B could not see it; User A recovered it after switching back |
| Fresh-user browser journey | Passed | Signup, onboarding, 9 groups, 42 practices, completion, custom group/practice, reload |
| Recovery privacy lock | Passed | Invalid public credentials produced a locked recovery screen with no private navigation |
| Journal autosave console | Passed after fix | React render-time provider update reproduced, corrected, regression-tested, and live-retested |
| Local quality gates | Passed | Lint, typecheck, 310 unit tests, production build, and 9 Playwright tests passed |

## Live RLS Result

`npm run validate:cloud-rls` completed with 38 passing checks using two disposable development users, normal email/password sessions, and the publishable key only.

Covered controls included:

- User-owned inserts across categories, habits, daily entries, journal entries, audit logs, and sync mutations.
- User B receiving zero rows when selecting User A data.
- Rejection of cross-user ownership and foreign-key attempts.
- No cross-user update or delete effects.
- No normal-user hard deletion of journal entries or sync mutations.
- No normal-user update or hard deletion of audit history.
- Safe archival of temporary validation records.

On this Windows environment, the Node validation process required `NODE_OPTIONS=--use-system-ca` so Node trusted the system certificate chain. This was a workstation TLS configuration detail, not a Supabase or RLS failure.

## Live Browser Result

### Existing users

1. Signed in as disposable User A.
2. Created a dated Journal reflection and waited for `Saved`.
3. Reloaded and confirmed the reflection persisted.
4. Confirmed cloud status returned to `Synced`.
5. Signed out and signed in as disposable User B.
6. Confirmed User B's current entry was empty and User A's reflection text was absent.
7. Switched back to User A and confirmed the reflection returned.

### Fresh user

1. Created a new disposable account through the app.
2. Completed onboarding with a display name, UTC timezone, and Monday week start.
3. Confirmed exactly 9 starter groups and 42 starter practices.
4. Reloaded and confirmed starter materialization did not duplicate data.
5. Completed `Yama`, reloaded, and confirmed the completion remained checked.
6. Created `Task 055 Validation` with one toggle practice named `Recovery check`.
7. Reloaded and confirmed 10 groups, 43 practices, and the custom group on Today.

Passwords and user IDs are intentionally omitted. The disposable development records remain in the development project for auditability.

## Defect Found And Fixed

Live Journal autosave produced this React warning:

```text
Cannot update a component (CloudSyncProvider) while rendering a different component (JournalScreen).
```

Root cause:

- `useJournal.saveEntry` called repository persistence from inside a React state updater.
- The cloud-backed repository synchronously notified `CloudSyncProvider` that synchronization started.
- That notification updated provider state while React was calculating Journal state.

Resolution:

- Journal computes the next entry from a stable current-state reference.
- Repository persistence occurs outside the React state updater.
- The Journal state is then committed with the same next snapshot.
- Autosave delay, timestamps, local persistence, cloud persistence, and history behavior remain unchanged.

A `StrictMode` integration test reproduces the original provider/journal interaction and asserts that no render-time update warning occurs. A fresh live browser tab then saved a cloud Journal entry with no browser warnings or errors.

## Local Quality Baseline

The following checks passed before changing the development cloud environment:

```text
npm run lint       passed
npm run typecheck  passed
npm test           53 files, 310 tests passed
npm run build      passed
npm run test:e2e   9 tests passed
```

The complete suite was rerun after the Journal fix. These results complement, rather than replace, the live Supabase evidence above.

## Remaining Limitations

- Validation used the development project, not an independent staging or production project.
- Google OAuth, magic link, password reset, custom SMTP, and Apple OAuth were not exercised.
- Cross-user browser validation used account switching in one browser origin rather than two physical devices or browser profiles.
- Export/import was covered by existing automated regression, not repeated with the disposable cloud account during this recovery task.
- A free-tier development project may auto-pause again after inactivity; this is an operational availability limitation, not an application retry defect.
- The resumed project is suitable for development validation only and must not be treated as production infrastructure.

## Completion Standard

Task 055 is complete only when connectivity, migrations, live RLS validation, and the critical browser journey are all evidenced against a reachable development project. A passing local mock/unit suite alone is not sufficient.

If a replacement development project is not approved or available, the task remains explicitly blocked at environment recovery rather than being reported as production-ready.
