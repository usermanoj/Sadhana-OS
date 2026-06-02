# Task 019 - PWA Install And Cache Foundation

## Goal

Add PWA installation metadata and app-shell cache foundation without caching private cloud data.

## Prerequisites

- Task 015 completed.
- Task 017 completed.

## Scope

- Add web app manifest.
- Add app icons.
- Add service worker for app-shell assets.
- Register service worker only in production-capable browsers.
- Add tests for registration guard and PWA artifacts.

## Non-Goals

- Do not cache authenticated Supabase API responses.
- Do not implement offline mutation queue.
- Do not add push notifications.
- Do not build native mobile.

## Files

Create:

```text
public/manifest.webmanifest
public/sw.js
public/icons/icon.svg
public/icons/maskable.svg
src/lib/pwa.ts
src/lib/pwa.test.ts
tasks/019-pwa-install-cache-foundation.md
```

Modify:

```text
index.html
src/main.tsx
```

## Acceptance Criteria

- [ ] Manifest exists and uses standalone display.
- [ ] Icons exist.
- [ ] Service worker caches app-shell assets.
- [ ] Service worker does not cache Supabase API responses.
- [ ] Service worker registration is production-only.
- [ ] Typecheck passes.
- [ ] Unit/integration tests pass.
- [ ] Production build passes.
- [ ] E2E tests pass.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```
