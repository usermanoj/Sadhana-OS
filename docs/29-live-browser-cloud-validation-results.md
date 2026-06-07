# 29 - Live Browser Cloud Validation Results

Date: 2026-06-06

Environment:

- Local app: `http://localhost:5173`
- Supabase project: development project configured in `.env.local`
- Browser path: in-app browser, same browser session account switching
- Direct Supabase checks: anon/publishable key with normal user sessions

Purpose: validate the full Sadhana OS browser flow for new authenticated users, cloud starter materialization, user-owned persistence, and User A/User B isolation.

## Result

Status: **Passed**.

The validation confirmed:

- Fresh email/password signup works without email confirmation blocking local validation.
- New users get `profiles` and `user_settings` rows.
- New users get starter categories and habits persisted to Supabase.
- User activity from the browser persists to Supabase.
- User A and User B data stay isolated in the app and in direct RLS-filtered Supabase queries.
- Same-browser sign-out/sign-in switching did not leak Today or Journal data.
- User A custom category/practice did not appear for User B.

Follow-up resolution:

- Task 027 now suppresses the Local Data Migration panel for fresh users when the only root local backup is unchanged starter-template data. The original migration review flow remains available for meaningful custom legacy data.

## Test Users

Generated validation users:

| User | Email | Supabase User ID |
|------|-------|------------------|
| User A | `sadhana.live.a.20260605233834@example.com` | `ae5b142f-e88d-45a9-a766-35329c12c491` |
| User B | `sadhana.live.b.20260605233834@example.com` | `1946d541-1965-44f0-b302-1d6b72c8d48b` |

Passwords were used only during validation and are not recorded in this artifact.

## Browser Validation Steps

### User A Signup And Onboarding

Actions:

1. Opened `http://localhost:5173`.
2. Created User A through the auth UI.
3. Completed onboarding with display name `Live User A 20260605233834`.
4. Reached Today screen.

Observed:

- Today screen loaded after cloud preparation.
- Starter template displayed 9 groups and 42 practices.
- Daily score started at `0/42 practices`.

Initial Supabase counts after onboarding:

| Table | Count |
|-------|------:|
| `profiles` | 1 |
| `user_settings` | 1 |
| `categories` | 9 |
| `habits` | 42 |
| `daily_entries` | 0 |
| `daily_habit_entries` | 0 |
| `journal_entries` | 0 |
| `audit_log_entries` | 1 |
| `sync_mutations` | 0 |

Conclusion:

- New-user starter template cloud materialization worked.

### User A Daily And Journal Persistence

Actions:

1. Expanded `8 Limbs of Yoga`.
2. Checked `Yama`.
3. Opened Journal.
4. Added free-form journal note:

```text
Live validation journal A sadhana.live.a.20260605233834@example.com
```

Observed:

- Today score updated to `1/42 practices`.
- Journal showed `Saved`.
- Journal recent entries showed User A note.
- Account screen showed `Cloud Sync` as `Synced`.

Supabase counts after activity:

| Table | Count |
|-------|------:|
| `profiles` | 1 |
| `user_settings` | 1 |
| `categories` | 9 |
| `habits` | 42 |
| `daily_entries` | 1 |
| `daily_habit_entries` | 1 |
| `journal_entries` | 1 |
| `audit_log_entries` | 1 |
| `sync_mutations` | 0 |

Conclusion:

- Browser-created daily and journal data persisted to Supabase.

### User B Signup And Initial Isolation

Actions:

1. Signed out User A in the same browser.
2. Created User B through the auth UI.
3. Completed onboarding with display name `Live User B 20260605233834`.
4. Reached Today screen.

Observed:

- User B Today screen loaded cleanly.
- User B showed `0/42 practices`.
- User A `Yama` completion did not appear.
- User B Journal initially showed `No History Yet`.
- User A journal text was absent.

Conclusion:

- Same-browser account switching did not leak User A Today or Journal state into User B.

### User B Daily And Journal Persistence

Actions:

1. Expanded `8 Limbs of Yoga`.
2. Checked `Niyama`.
3. Opened Journal.
4. Added free-form journal note:

```text
Live validation journal B sadhana.live.b.20260605233834@example.com
```

Observed:

- User B Today score updated to `1/42 practices`.
- Journal showed `Saved`.
- Account screen showed `Cloud Sync` as `Synced`.

Supabase counts after activity:

| Table | Count |
|-------|------:|
| `profiles` | 1 |
| `user_settings` | 1 |
| `categories` | 9 |
| `habits` | 42 |
| `daily_entries` | 1 |
| `daily_habit_entries` | 1 |
| `journal_entries` | 1 |
| `audit_log_entries` | 1 |
| `sync_mutations` | 0 |

Conclusion:

- User B browser-created daily and journal data persisted independently.

### Direct User Isolation Probes

Direct Supabase checks used normal authenticated sessions with the anon/publishable key.

Authenticated User B querying User A owner IDs returned:

| Probe | Visible Rows |
|-------|-------------:|
| `profiles` | 0 |
| `categories` | 0 |
| `daily_entries` | 0 |
| `journal_entries` | 0 |
| `audit_log_entries` | 0 |

Authenticated User A querying User B owner IDs returned:

| Probe | Visible Rows |
|-------|-------------:|
| `profiles` | 0 |
| `categories` | 0 |
| `daily_entries` | 0 |
| `journal_entries` | 0 |
| `audit_log_entries` | 0 |

Conclusion:

- RLS user isolation held for the validation users.

### User A Switchback

Actions:

1. Signed out User B.
2. Signed in User A again in the same browser.
3. Opened Today.
4. Opened Journal.

Observed:

- User A Today score returned to `1/42 practices`.
- User A journal text returned.
- User B journal text was absent.

Conclusion:

- Same-browser account switching restored the correct user-scoped cache/cloud state.

### User A Custom Tracker Persistence

Actions:

1. Opened Settings > Categories as User A.
2. Added category:

```text
Live Validation 20260605233834
```

3. Added practice:

```text
Live Practice 20260605233834
```

4. Saved category.
5. Checked Account sync status.

Observed:

- Active category count increased from 9 to 10.
- Custom category showed `1/1 practices`.
- Account screen showed `Cloud Sync` as `Synced`.

Supabase counts for User A after custom tracker creation:

| Table | Count |
|-------|------:|
| `profiles` | 1 |
| `user_settings` | 1 |
| `categories` | 10 |
| `habits` | 43 |
| `daily_entries` | 1 |
| `daily_habit_entries` | 1 |
| `journal_entries` | 1 |
| `audit_log_entries` | 4 |

Direct lookup confirmed one User A category named `Live Validation 20260605233834`.

Conclusion:

- Custom category and practice persisted to Supabase.
- Audit log count increased from configuration changes.

### User B After User A Custom Tracker

Actions:

1. Signed out User A.
2. Signed in User B again in the same browser.
3. Checked Today.
4. Checked Journal.
5. Ran direct Supabase lookup for User A custom category name under User B session.

Observed:

- User B Today remained `1/42 practices`.
- User A custom category was absent from User B Today.
- User B Journal showed User B note.
- User A Journal text was absent.
- Direct Supabase lookup as User B for `Live Validation 20260605233834` returned zero visible rows.
- User B still had 9 visible categories.

Conclusion:

- User A custom tracker data did not leak into User B app state or direct Supabase session.

## Notable Observation Resolved By Task 027

The Account screen showed the Local Data Migration panel for fresh cloud users because root localStorage still contains starter-template MVP data from the local app bootstrap.

Observed panel summary:

| Field | Value |
|-------|------:|
| Categories | 9 |
| Practices | 42 |
| Daily Entries | 0 |
| Daily Values | 0 |
| Journal Entries | 0 |
| Audit Events | 1 |
| Starter Groups | 9 |
| Custom Groups | 0 |

Original assessment:

- This did not cause data leakage.
- Migration is now review-gated.
- It is still a confusing production UX for fresh users.

Implemented follow-up:

```text
Task 027 - Suppress starter-only root local migration prompt for fresh cloud users
```

Acceptance:

- Fresh cloud users should not see a migration prompt when the only legacy root data is unchanged starter-template data.
- Users with real custom legacy local data should still see migration review.

Task 027 browser smoke check confirmed:

- Signed-in fresh cloud user reached `Cloud Sync: Synced`.
- `Local Data Migration` region count was `0`.
- `Review Local Data` was absent.

## Validation Caveats

- This validation used same-browser account switching and direct authenticated Supabase probes.
- It did not validate a second physical browser profile/incognito profile.
- It did not validate Google OAuth.
- It did not validate magic link or password reset.
- It did not validate production SMTP.
- It did not validate account deletion.
- It did not validate cross-device conflict recovery.
- Direct Node Supabase checks required `node --use-system-ca` in this Windows environment because the default Node process did not trust the local certificate chain.

## Final Assessment

Clean live browser validation passed for:

- New-user signup.
- Onboarding.
- Starter-template cloud materialization.
- Daily tracking persistence.
- Journal persistence.
- Custom category/practice persistence.
- Audit-generating configuration changes.
- Same-browser User A/User B switching.
- User A/User B data isolation in app state.
- User A/User B data isolation through direct RLS-filtered Supabase queries.

The Task 027 follow-up has been implemented. The next recommended hardening track is production auth/email setup or server-assisted migration, depending on launch sequencing.
