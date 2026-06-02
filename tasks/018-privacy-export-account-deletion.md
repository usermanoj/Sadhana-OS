# Task 018 - Privacy, Export, And Account Deletion

## Goal

Add privacy controls for portable export and cloud account deletion, while preserving the existing Data export/import flow.

## Prerequisites

- Task 015 completed.
- Task 017 completed.

## Scope

- Add Settings > Privacy.
- Surface JSON export from Privacy.
- Add cloud account deletion request UI.
- Add Supabase Edge Function artifact for account deletion.
- Add helper tests and screen tests.
- Document privacy boundaries.

## Non-Goals

- Do not clear localStorage automatically.
- Do not remove JSON/CSV export/import from Settings > Data.
- Do not add analytics.
- Do not implement retention automation beyond the deletion function artifact.

## Files

Create:

```text
src/lib/privacy.ts
src/lib/privacy.test.ts
src/components/settings/PrivacyScreen.tsx
src/components/settings/PrivacyScreen.test.tsx
supabase/functions/delete-account/index.ts
tasks/018-privacy-export-account-deletion.md
```

Modify:

```text
docs/13-auth-security-privacy.md
src/components/pages/SettingsScreen.tsx
```

## Acceptance Criteria

- [ ] Privacy screen exists in Settings.
- [ ] Privacy screen offers JSON export.
- [ ] Privacy screen explains local-only state when cloud is not configured.
- [ ] Signed-in users see deletion confirmation controls.
- [ ] Deletion button is disabled until explicit confirmation.
- [ ] Deletion request invokes `delete-account` Edge Function.
- [ ] Edge Function deletes the authenticated user through Supabase admin API.
- [ ] Existing Data export/import remains available.
- [ ] Typecheck passes.
- [ ] Unit/integration tests pass.
- [ ] Production build passes.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```
