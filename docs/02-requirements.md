# 02 — Requirements

## Functional Requirements

### FR-01  Daily Tracker
- Display all active categories with their sub-components for the selected date.
- Each sub-component has a boolean (done / not-done) toggle.
- Default date is today; user can navigate to past dates.
- Saving a day's data writes to localStorage immediately.

### FR-02  Category & Sub-Component Management
- CRUD operations on categories (name, icon, display order, color).
- CRUD operations on sub-components (name, parent category, display order).
- Archive instead of delete; archived items hidden from daily tracker.
- Restore archived items.
- Seed 9 default categories with sub-components on first launch.

### FR-03  Scoring Engine
- Per-category score = (completed sub-components / total active sub-components) × 100.
- Overall daily score = average of all category scores.
- Scores recompute on every toggle.

### FR-04  Analytics Dashboard
- Line/area charts for overall and per-category scores over 7 / 30 / 90 days.
- Built with Recharts.
- Category selector to filter view.
- Show streak count (consecutive days with ≥ 1 entry).

### FR-05  Journal
- Free-text entry linked to a date.
- Create, edit, view journal entries.
- Markdown rendering (optional stretch).

### FR-06  History View
- Calendar grid showing days with entries (color-coded by score).
- Click a date to load that day's tracker data.

### FR-07  Audit Log
- Every configuration change (add/edit/archive/restore category or sub-component) creates an immutable audit entry.
- Audit entry fields: `id`, `timestamp`, `action`, `entityType`, `entityId`, `before`, `after`, `description`.
- Audit log viewer with chronological list and detail expansion.

### FR-08  Export / Import
- **JSON Export**: full data dump (categories, sub-components, daily entries, journal, audit log).
- **JSON Import**: merge or overwrite with conflict detection dialog.
- Import files must be schema-validated before any localStorage writes.
- Conflict detection must compare stable IDs for categories, sub-components, daily entries, journal entries, and audit entries.
- Merge mode preserves existing local records when IDs conflict, adds non-conflicting incoming records, and reports skipped conflicts in the dialog.
- Overwrite mode replaces categories, entries, journal, and imported audit history, then appends a new `data_imported` audit entry describing the overwrite.
- Invalid or partial import files must fail without changing existing local data.
- **CSV Export**: daily entries as flat CSV (date, category, sub-component, completed).

### FR-09  Persistence
- All data stored in localStorage under namespaced keys.
- Version key for future migration support.

---

## Non-Functional Requirements

### NFR-01  Performance
- First meaningful paint < 2 s on 3G throttle.
- Interactions respond within 100 ms.

### NFR-02  Mobile-First
- Breakpoints: mobile (< 640 px), tablet (640–1024 px), desktop (> 1024 px).
- Touch targets ≥ 44 × 44 px.

### NFR-03  Accessibility
- Semantic HTML, ARIA labels, keyboard navigation.
- Colour contrast ratio ≥ 4.5 : 1.

### NFR-04  Browser Support
- Latest 2 versions of Chrome, Firefox, Safari, Edge.

### NFR-05  Code Quality
- TypeScript strict mode.
- ESLint + Prettier.
- Unit tests via Vitest; E2E via Playwright.
- TDD where practical.

### NFR-06  Aesthetic
- Calm, premium, spiritual feel.
- Consistent design system (see `06-design-system.md`).
