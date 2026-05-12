# 10 — Acceptance Criteria

Each criterion maps to a requirement or user story. All must pass before MVP is considered complete.

## Daily Tracker

- [ ] **AC-01**: On first launch, 9 default categories with sub-components are visible on the Today screen.
- [ ] **AC-02**: Toggling a sub-component immediately updates the completion state in localStorage.
- [ ] **AC-03**: Per-category score displays as `completed/total` and a percentage bar.
- [ ] **AC-04**: Overall score at top recalculates in real time on each toggle.
- [ ] **AC-05**: User can navigate to a past date and toggle sub-components for that date.

## Category Management

- [ ] **AC-06**: User can add a new category with name, icon, and color.
- [ ] **AC-07**: User can edit an existing category's name, icon, and color.
- [ ] **AC-08**: User can add, edit, reorder, and archive sub-components.
- [ ] **AC-09**: Archiving a category hides it from the Today screen but preserves historical data.
- [ ] **AC-10**: Restoring an archived category makes it reappear on the Today screen.
- [ ] **AC-11**: Every category/sub-component mutation creates an audit log entry.

## Scoring

- [ ] **AC-12**: Category score = (completed / active sub-components) × 100.
- [ ] **AC-13**: Overall score = average of all active category scores.
- [ ] **AC-14**: Streak counts consecutive days with at least 1 completion.

## Analytics Dashboard

- [ ] **AC-15**: Line chart displays overall score trend for selected range (7/30/90 days).
- [ ] **AC-16**: Category filter shows per-category trend.
- [ ] **AC-17**: Streak counter is displayed and accurate.

## Journal

- [ ] **AC-18**: User can write and save a free-text journal entry for any date.
- [ ] **AC-19**: Journal auto-saves on blur or after debounce.
- [ ] **AC-20**: Past journal entries load correctly via date navigation.

## History

- [ ] **AC-21**: Calendar view shows colour-coded days (green ≥ 80%, amber 40–79%, red < 40%, grey = no entry).
- [ ] **AC-22**: Tapping a date navigates to the Today screen for that date.

## Audit Log

- [ ] **AC-23**: Audit log screen displays all entries newest-first.
- [ ] **AC-24**: Each entry shows timestamp, action, and description.
- [ ] **AC-25**: Expanding an entry shows before/after diff.

## Export / Import

- [ ] **AC-26**: JSON export downloads a file containing all app data.
- [ ] **AC-27**: CSV export downloads daily entries as flat rows.
- [ ] **AC-28**: JSON import restores data with merge/overwrite option.
- [ ] **AC-29**: Import creates an audit log entry.

## Mobile & UX

- [ ] **AC-30**: UI is fully functional at 360 px width with 44 px touch targets.
- [ ] **AC-31**: Bottom tab navigation works on mobile; sidebar on desktop.
- [ ] **AC-32**: No layout jank or horizontal scroll on mobile.
- [ ] **AC-33**: Page transitions are smooth (≤ 200 ms).

## Technical

- [ ] **AC-34**: TypeScript strict mode passes with zero errors.
- [ ] **AC-35**: All Vitest unit/integration tests pass.
- [ ] **AC-36**: All Playwright E2E tests pass.
- [ ] **AC-37**: Production build succeeds with no warnings.
- [ ] **AC-38**: localStorage data includes a version key for future migrations.
