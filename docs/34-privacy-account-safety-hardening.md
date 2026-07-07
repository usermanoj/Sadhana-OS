# 34 - Privacy And Account Safety Hardening

## Purpose

Sadhana OS stores highly personal wellness and spiritual practice data. Account deletion must be clear, deliberate, and difficult to trigger accidentally.

Task 040 hardens the frontend account deletion experience. It does not change the existing Supabase Edge Function or database schema.

## Current Account Deletion Flow

Cloud account deletion is available in:

```text
Settings > Privacy
```

Signed-in users must now:

1. Read the export and retention warning.
2. Acknowledge that they exported a backup or intentionally want to continue without one.
3. Type:

```text
DELETE MY ACCOUNT
```

Only then can they request account deletion.

## Current Backend Behavior

The existing Supabase Edge Function is:

```text
supabase/functions/delete-account/index.ts
```

It:

- Requires an authenticated request.
- Uses the service-role key only inside the Edge Function.
- Calls Supabase Admin Auth deletion for the authenticated user.
- Returns `requestedAt`.

The service-role key must never be exposed to the browser.

## User-Facing Safety Copy

The Privacy screen now tells users:

- Export a JSON backup first if they want a copy.
- Cloud account data is removed by the server-side deletion flow.
- Provider backup and legal retention windows may still apply.
- Local browser data remains on the device until cleared separately.

## Important Limitation

This task does not create a formal retention workflow or deletion-request ledger. The current Edge Function performs the existing account deletion operation immediately after explicit confirmation.

Before production launch, decide whether Sadhana OS needs:

- A delayed deletion window.
- Email confirmation before deletion.
- A support-visible deletion request record.
- Legal hold or tax/accounting retention rules.
- Separate local browser data wipe controls.

## Production Checklist

- [ ] Validate account deletion in staging with a disposable user.
- [ ] Export JSON before deletion and confirm the export opens.
- [ ] Request account deletion.
- [ ] Confirm the user can no longer sign in.
- [ ] Confirm user-owned rows are no longer visible.
- [ ] Confirm local browser data behavior is documented and understood.
- [ ] Confirm privacy policy wording matches actual deletion and retention behavior.
- [ ] Confirm support process for accidental deletion requests.

## Non-Negotiables

- Never expose service-role keys in the browser.
- Never hide local-vs-cloud data behavior.
- Never remove export/import from the product.
- Never add analytics events that include journal content, habit names, category names, or practice values.
