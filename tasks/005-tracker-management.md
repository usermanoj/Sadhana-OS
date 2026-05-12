# Task 005 — Tracker Management (Categories & Sub-Components)

## Goal

Build the settings screen for CRUD operations on categories and sub-components, with audit logging.

## Prerequisites

- Task 004 completed (Today tracker renders categories).

## Steps

1. **Create category management hook** (`src/hooks/useCategories.ts`)
   - `addCategory(data)` → creates category, audit entry.
   - `updateCategory(id, data)` → updates, logs before/after.
   - `archiveCategory(id)` → sets `isArchived = true`, audit entry.
   - `restoreCategory(id)` → sets `isArchived = false`, audit entry.
   - `reorderCategories(orderedIds)` → updates display orders.
   - Same CRUD for sub-components within a category.

2. **Create CategoryListScreen** (`src/components/CategoryListScreen.tsx`)
   - Two sections: "Active" and "Archived".
   - Each item: icon, name, sub-component count, action menu.
   - "+ Add Category" button.
   - Tap item → navigate to edit form.

3. **Create CategoryForm** (`src/components/CategoryForm.tsx`)
   - Fields: name (required), icon picker (Lucide subset), colour picker.
   - Sub-component list with inline add/edit/archive/reorder.
   - Save and Cancel buttons.

4. **Create IconPicker and ColourPicker** sub-components
   - IconPicker: grid of ~30 curated Lucide icons.
   - ColourPicker: palette of ~12 predefined colours from design system.

5. **Write tests**
   - Adding a category appears in list and on Today screen.
   - Editing name updates display.
   - Archiving removes from Today, shows in Archived section.
   - Restoring moves back to Active.
   - Each action creates an audit entry with correct before/after.
   - Sub-component CRUD works within a category.

6. **Wire into Settings tab**
   - Settings tab shows "Categories" as first option.

7. **Verify**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all tests pass.
   - `npx vite build` — succeeds.

## Acceptance Criteria

- [ ] Full CRUD on categories (add, edit, archive, restore).
- [ ] Full CRUD on sub-components.
- [ ] Audit log entry for every mutation.
- [ ] Before/after snapshots in audit entries.
- [ ] Archive hides from tracker; restore brings back.
- [ ] Form validation (name required).

## References

- `docs/05-ux-flows.md` — Flow 6
- `docs/08-audit-history.md` — audit requirements
