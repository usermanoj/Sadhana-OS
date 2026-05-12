# Task 011 — Mobile Polish & E2E Tests

## Goal

Final responsive polish, accessibility pass, and Playwright E2E tests across all features.

## Prerequisites

- Tasks 001–010 completed.

## Steps

1. **Responsive audit**
   - Test every screen at 360 px, 640 px, and 1024 px.
   - Fix any overflow, truncation, or touch-target issues.
   - Verify bottom tabs on mobile, sidebar on desktop.

2. **Accessibility pass**
   - Add `aria-label` to all interactive elements.
   - Verify keyboard navigation (Tab, Enter, Escape).
   - Check colour contrast ≥ 4.5:1 for all text.
   - Screen reader test with at least one screen.

3. **Transitions & animations**
   - Accordion expand/collapse: smooth 200 ms.
   - Page transitions: 150 ms fade.
   - Toggle switch: 150 ms ease.
   - No layout jank or CLS.

4. **Write E2E tests**

   **`e2e/happy-path.spec.ts`**
   1. First launch → 9 categories visible.
   2. Toggle 3 sub-components → score updates.
   3. Navigate to Dashboard → chart renders.
   4. Write journal entry → persists after reload.
   5. Open History → today's entry shows colour.
   6. Export JSON → file downloads.

   **`e2e/category-management.spec.ts`**
   1. Add custom category with 2 sub-components.
   2. Verify appears on Today screen.
   3. Archive → disappears from Today.
   4. Restore → reappears.
   5. Audit log shows 3 entries.

   **`e2e/import.spec.ts`**
   1. Export data.
   2. Clear localStorage.
   3. Import exported file.
   4. Verify data restored.

5. **Performance check**
   - `npx vite build` and check bundle size.
   - Lighthouse mobile score ≥ 90.

6. **Final verification**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all unit/integration tests pass.
   - `npx playwright test` — all E2E tests pass.
   - `npx vite build` — succeeds with no warnings.

## Acceptance Criteria

- [ ] All screens usable at 360 px width.
- [ ] Touch targets ≥ 44 × 44 px everywhere.
- [ ] No horizontal scroll on any mobile screen.
- [ ] Smooth transitions (≤ 200 ms).
- [ ] ARIA labels on all interactive elements.
- [ ] All E2E tests pass.
- [ ] Production build succeeds.
- [ ] All acceptance criteria from `docs/10-acceptance-criteria.md` met.

## References

- `docs/06-design-system.md` — breakpoints, motion, components
- `docs/09-test-plan.md` — E2E test specs
- `docs/10-acceptance-criteria.md` — full checklist
