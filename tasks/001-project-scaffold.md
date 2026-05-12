# Task 001 — Project Scaffold

## Goal

Set up the Vite + React + TypeScript project with all dev tooling configured and a blank app shell rendering.

## Prerequisites

None — this is the first task.

## Steps

1. **Initialize Vite project**
   - `npx -y create-vite@latest ./ --template react-ts`
   - Verify `package.json` has React 18+, TypeScript 5+.

2. **Install dev dependencies**
   - `tailwindcss`, `postcss`, `autoprefixer` — styling.
   - `recharts` — analytics charts.
   - `lucide-react` — icon library.
   - `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` — unit tests.
   - `playwright`, `@playwright/test` — E2E tests.
   - `eslint`, `prettier` — linting.

3. **Configure Tailwind**
   - `npx tailwindcss init -p`
   - Set `content` paths.
   - Add design system tokens to `tailwind.config.ts` (colours, fonts, radii, shadows from `docs/06-design-system.md`).

4. **Configure TypeScript**
   - Enable `strict: true` in `tsconfig.json`.
   - Set `"jsx": "react-jsx"`.

5. **Configure Vitest**
   - Add `vitest.config.ts` with `jsdom` environment.
   - Add `test` script to `package.json`.

6. **Configure Playwright**
   - `npx playwright install --with-deps chromium`
   - Create `playwright.config.ts` with base URL `http://localhost:5173`.

7. **Create folder structure**
   ```
   src/
     components/     # React components
     lib/            # Business logic, helpers
     hooks/          # Custom React hooks
     types/          # TypeScript interfaces (from docs/04-data-model.md)
     assets/         # Static assets
     App.tsx         # App shell with router placeholder
     main.tsx        # Entry point
   e2e/              # Playwright test files
   ```

8. **Create type definitions**
   - `src/types/index.ts` — all interfaces from `docs/04-data-model.md`.

9. **Create App shell**
   - `App.tsx`: bottom tab bar (mobile) / sidebar (desktop) with 5 placeholder tabs.
   - Apply design system background colour and font.

10. **Add Google Fonts**
    - Add Inter font via `<link>` in `index.html`.

11. **Verify**
    - `npx tsc --noEmit` — passes.
    - `npx vitest run` — passes (0 tests is OK for now).
    - `npx vite build` — succeeds.
    - Dev server shows the app shell.

## Acceptance Criteria

- [ ] Vite dev server starts and renders the app shell.
- [ ] TypeScript strict mode passes.
- [ ] Tailwind classes apply correctly.
- [ ] Folder structure matches spec.
- [ ] Type definitions match `docs/04-data-model.md`.
- [ ] Build succeeds with no errors.

## References

- `docs/04-data-model.md` — type interfaces
- `docs/06-design-system.md` — design tokens
