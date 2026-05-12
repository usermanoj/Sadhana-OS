# Task 010 — Export / Import

## Goal

Implement JSON export/import and CSV export with audit logging.

## Prerequisites

- Task 006 completed (audit log viewer exists).

## Steps

1. **Create export utilities** (`src/lib/export.ts`)
   - `exportJSON(): ExportPayload` — gathers all localStorage data.
   - `downloadJSON(payload)` — triggers browser download as `.json` file.
   - `exportCSV(): string` — flattens daily entries to CSV rows.
   - `downloadCSV(csv)` — triggers browser download as `.csv` file.
   - CSV columns: `date, categoryName, subComponentName, completed`.

2. **Create import utilities** (`src/lib/import.ts`)
   - `parseImport(file): ExportPayload` — parse and validate JSON.
   - `detectConflicts(incoming, existing): ConflictSummary` — list what will be overwritten.
   - `applyImport(payload, mode: 'merge' | 'overwrite'): void`.
   - Merge: keep existing entries, add new ones, update categories.
   - Overwrite: replace all data.
   - Both modes create an audit entry.

3. **Create DataScreen** (`src/components/DataScreen.tsx`)
   - "Export JSON" button.
   - "Export CSV" button.
   - "Import JSON" button → file input.
   - On import: show conflict dialog before applying.

4. **Create ConflictDialog** sub-component
   - Lists: X categories, Y entries, Z journal entries to be affected.
   - "Merge" and "Overwrite" buttons + "Cancel".

5. **Write tests**
   - JSON export contains all data keys.
   - CSV has correct headers and row count.
   - Import merge adds new data without erasing existing.
   - Import overwrite replaces all data.
   - Audit entry created on import and export.
   - Invalid file shows error.

6. **Wire into Settings**
   - Settings tab shows "Data" option.

7. **Verify**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all tests pass.

## Acceptance Criteria

- [ ] JSON export downloads valid file with all data.
- [ ] CSV export downloads flat daily entries.
- [ ] Import with merge preserves existing data.
- [ ] Import with overwrite replaces all data.
- [ ] Conflict dialog shown before import.
- [ ] Audit entries created for export and import.

## References

- `docs/05-ux-flows.md` — Flow 7
- `docs/04-data-model.md` — ExportPayload interface
- `docs/08-audit-history.md` — audit for import/export
