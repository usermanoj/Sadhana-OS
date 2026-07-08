# Task 050 - Mobile Shell / PWA Install Polish

## Goal

Improve Sadhana OS install readiness and mobile app-shell polish without changing core product workflows or cloud/data behavior.

## Scope

- Improve web app manifest identity, start route, categories, and shortcuts.
- Add mobile and installed-app metadata to the HTML shell.
- Keep the service worker app-shell cache conservative and private-data safe.
- Add a browser-driven install prompt that only appears when the platform exposes install eligibility.
- Improve safe-area spacing for mobile and installed PWA contexts.
- Preserve bottom navigation labels, routes, and behavior.

## Non-Goals

- No Supabase schema changes.
- No auth changes.
- No export/import logic changes.
- No cloud sync or offline queue changes.
- No native mobile implementation.
- No new dependencies.

## Acceptance Criteria

- Manifest remains installable and includes maskable icon support.
- Installed/mobile shell uses `viewport-fit=cover` and app-capable metadata.
- Service worker does not cache Supabase or auth/private API traffic.
- Install prompt is dismissible and only appears after `beforeinstallprompt`.
- Mobile bottom navigation remains usable with safe-area spacing.
- Lint, typecheck, unit tests, build, and e2e pass.
