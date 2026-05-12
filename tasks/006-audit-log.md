# Task 006 — Audit Log Viewer

## Goal

Build the audit log viewer screen under Settings.

## Prerequisites

- Task 005 completed (mutations create audit entries).

## Steps

1. **Create AuditLogScreen** (`src/components/AuditLogScreen.tsx`)
   - Fetch all entries from `sadhana:audit`.
   - Display newest-first as a scrollable list.
   - Each row: relative timestamp, action badge (coloured chip), description.
   - Tap row to expand → show `before` and `after` as formatted JSON.

2. **Create AuditEntryCard** sub-component
   - Collapsed: timestamp + badge + description (single line).
   - Expanded: `before` / `after` JSON blocks with syntax highlighting or diff view.
   - Smooth expand/collapse animation.

3. **Create action badge colour map**
   - `created` → green.
   - `updated` → blue.
   - `archived` → amber.
   - `restored` → violet.
   - `imported/exported` → grey.

4. **Write tests**
   - Renders correct number of entries.
   - Entries are in reverse chronological order.
   - Expanding shows before/after data.
   - Empty state message when no entries.

5. **Wire into Settings**
   - Settings tab shows "Audit Log" as an option.

6. **Verify**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all tests pass.

## Acceptance Criteria

- [ ] All audit entries displayed newest-first.
- [ ] Action badges with correct colours.
- [ ] Expand shows before/after JSON.
- [ ] Empty state handled.

## References

- `docs/08-audit-history.md` — full audit spec
- `docs/05-ux-flows.md` — Flow 8
