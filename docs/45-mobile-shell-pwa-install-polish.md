# 45 - Mobile Shell / PWA Install Polish

Task 050 improves the outer app shell so Sadhana OS feels more ready for mobile and installed PWA usage.

## What Changed

- Manifest now includes:
  - stable app `id`
  - Today start route
  - health/lifestyle/productivity categories
  - Today, Journal, and Dashboard shortcuts
  - explicit standalone display override
- HTML shell now includes:
  - `viewport-fit=cover`
  - light theme color
  - mobile and Apple web app metadata
  - clean ASCII description text
- Service worker cache version was bumped and private-data boundaries were tightened.
- A small install prompt appears only after the browser fires `beforeinstallprompt`.
- The mobile shell now accounts for top, side, and bottom safe-area insets.
- Bottom navigation has slightly more installed-app home-indicator breathing room.

## Preserved Behavior

- Core navigation is unchanged.
- Existing tab labels and routes are unchanged.
- Supabase responses remain excluded from service-worker caching.
- Auth, cloud sync, export/import, and data model behavior are unchanged.
- No new dependencies were added.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```
