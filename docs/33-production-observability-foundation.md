# 33 - Production Observability Foundation

## Purpose

Sadhana OS needs production observability before public B2C launch so errors, sync failures, auth friction, and import/export issues are visible without exposing private spiritual practice data.

Task 038 adds the foundation only. It does not install or configure a paid vendor SDK.

## Current Implementation

The app now has a vendor-neutral observability layer in:

```text
src/lib/observability.ts
```

It provides:

- Approved analytics event names.
- Payload sanitization.
- Error report sanitization.
- A future vendor adapter via `setObservabilityClient`.
- Global browser error capture through `initializeObservability`.
- Browser events for local inspection:
  - `sadhana:analytics`
  - `sadhana:error`

The app root is wrapped by:

```text
src/components/layout/AppErrorBoundary.tsx
```

If a render failure occurs, users see a calm recovery screen instead of a blank app.

## Allowed Analytics Events

Only these event names are accepted in code:

```text
sign_in_succeeded
onboarding_completed
local_migration_started
local_migration_succeeded
local_migration_failed
sync_error_seen
export_json_started
account_deletion_requested
```

Additions to this list require review against the privacy rules below.

## Forbidden Telemetry Data

Never send:

- Email addresses.
- User IDs.
- Supabase JWTs, session tokens, refresh tokens, anon keys, or service-role keys.
- Journal content.
- Habit names.
- Category names.
- Practice values.
- Reflections, gratitude, insights, triggers, lessons, or other spiritual notes.
- Full localStorage snapshots.
- Full Supabase rows.
- Raw export/import payloads.

The observability helper removes private keys and redacts obvious emails, UUIDs, bearer tokens, JWT-like strings, and URL query values. This is a defense-in-depth layer, not permission to send sensitive payloads.

## Error Reporting Rules

Use:

```ts
reportError(error, 'stable_context_name', {
  severity: 'error',
  tags: {
    area: 'cloud_sync',
  },
});
```

Do not include user text, emails, object IDs, category names, habit names, or raw file names in the context or tags.

Preferred context examples:

```text
cloud_sync_failed
cloud_hydration_failed
json_import_parse_failed
react_render_error
pwa_service_worker_registration_failed
```

## Vendor Integration Pattern

Future vendor SDK calls should be isolated behind:

```ts
setObservabilityClient({
  trackEvent(event) {
    // vendor analytics call
  },
  captureError(report) {
    // vendor error reporting call
  },
});
```

Do not import vendor SDKs directly in screens, hooks, repositories, auth modules, or sync modules.

## Recommended Vendor Approach

For production B2C launch:

1. Use an error monitoring provider such as Sentry for frontend runtime errors.
2. Use a privacy-aware product analytics provider such as PostHog, Plausible, or a self-hosted equivalent only after consent and retention requirements are clear.
3. Keep analytics sparse until the privacy policy and consent model are finalized.
4. Use separate vendor projects for staging and production.
5. Do not enable session replay by default. It can capture sensitive UI text unless heavily masked and legally reviewed.

## Environment Expectations

No new environment variable is required by Task 038.

When a vendor is approved later, use public browser-safe variables only:

```text
VITE_SADHANA_OBSERVABILITY_PROVIDER
VITE_SADHANA_SENTRY_DSN
VITE_SADHANA_ANALYTICS_KEY
```

Never expose server-only keys in Vite variables.

## Manual Validation

In local or staging browser dev tools:

1. Open the app.
2. Run:

```js
window.addEventListener('sadhana:analytics', (event) => console.log(event.detail));
window.addEventListener('sadhana:error', (event) => console.log(event.detail));
```

3. Export JSON from Settings > Data.
4. Confirm an `export_json_started` analytics event appears.
5. Trigger an invalid JSON import.
6. Confirm a sanitized `json_import_parse_failed` error appears.
7. Confirm no email, user ID, journal content, category names, habit names, or practice values appear.

## Production Readiness Checklist

Before launch:

- [ ] Choose error monitoring provider.
- [ ] Create separate staging and production observability projects.
- [ ] Add vendor SDK behind `setObservabilityClient`.
- [ ] Verify no vendor call includes forbidden data.
- [ ] Confirm retention settings.
- [ ] Confirm privacy policy wording.
- [ ] Confirm cookie/consent requirements for target launch countries.
- [ ] Confirm DSNs/keys are public browser-safe keys only.
- [ ] Verify source maps are uploaded securely if using Sentry or equivalent.

## Limitations

- Task 038 does not send data to an external vendor yet.
- Error messages are sanitized, but developers must still avoid passing sensitive text to telemetry.
- The app does not yet include consent-aware analytics controls.
- Backend and Supabase Edge Function observability are not covered by this frontend-only task.
