# Task 021 - Premium Mobile UX Pass

## Goal

Polish the v0.2 production-readiness surfaces for mobile ergonomics and a calm premium feel.

## Prerequisites

- Tasks 012-020 completed.

## Scope

- Keep Settings section navigation usable with the added Account and Privacy sections.
- Reduce mobile wrapping/clutter in Settings.
- Keep touch targets at least 44px.
- Add coverage for Account and Privacy navigation.
- Visually verify the local app on a mobile viewport.

## Non-Goals

- Do not add new product features.
- Do not change data behavior.
- Do not add dependencies.
- Do not build native mobile.

## Files

Create:

```text
tasks/021-premium-mobile-ux-pass.md
```

Modify:

```text
src/components/pages/SettingsScreen.tsx
src/components/settings/AccountScreen.tsx
src/components/settings/PrivacyScreen.tsx
src/components/pages/SettingsScreen.test.tsx
```

## Acceptance Criteria

- [ ] Settings section navigation remains mobile-friendly with five sections.
- [ ] Account section is reachable from Settings.
- [ ] Privacy section is reachable from Settings.
- [ ] Touch targets remain at least 44px.
- [ ] Typecheck passes.
- [ ] Unit/integration tests pass.
- [ ] Production build passes.
- [ ] E2E tests pass.
- [ ] Browser mobile visual check is performed.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```
