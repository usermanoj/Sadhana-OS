# Auth And Cloud Bootstrap Resilience

Task 054 hardens application startup when the configured Supabase project is unavailable, slow, paused, deleted, or incorrectly configured.

## Behavior

Cloud-configured startup now follows this sequence:

1. Restore the persisted Supabase session.
2. If a user exists, load the user's profile and settings.
3. Allow either operation up to eight seconds.
4. Open the signed-in app only after account data is confirmed.
5. Show a recovery screen if the operation fails or times out.
6. Start a fresh session and profile check when the user selects **Retry connection**.

Local-only mode is unchanged and does not perform a Supabase bootstrap.

## Privacy Boundary

The app does not automatically fall back to root or unscoped local data when a cloud account cannot be confirmed. If a known session exists but profile loading fails, private app content remains locked until the retry succeeds.

This prevents stale data from a previous account or shared browser session from appearing under an unconfirmed identity.

## User-Facing Errors

Raw Supabase and network errors are sent only through the privacy-safe observability boundary. The recovery screen shows stable, non-technical guidance and confirms that no data was changed.

## Manual Validation

1. Configure a valid Supabase development project and confirm normal startup.
2. Replace the URL locally with an unreachable test host.
3. Start the app in cloud mode.
4. Confirm loading changes to the recovery screen within eight seconds.
5. Confirm Today, Dashboard, Journal, History, and Settings are not visible.
6. Restore the valid URL and restart the dev server.
7. Select **Retry connection** and confirm the app opens normally.
8. Start with `VITE_SADHANA_FORCE_LOCAL=true` and confirm local mode still opens directly.

## Limitations

- A timeout releases the user interface but cannot guarantee cancellation of every browser network request already in progress.
- Retry cannot repair an invalid or deleted Supabase project; the environment URL and publishable key must still be corrected.
- This task does not add offline access to authenticated cloud accounts. That requires a separately designed encrypted, identity-bound offline unlock policy.

