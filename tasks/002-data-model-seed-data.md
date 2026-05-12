# Task 002 — Data Model & Seed Data

## Goal

Implement localStorage persistence layer and seed the 9 default categories on first launch.

## Prerequisites

- Task 001 completed (project scaffold, type definitions).

## Steps

1. **Create storage utilities** (`src/lib/storage.ts`)
   - `getItem<T>(key: string, fallback: T): T` — parse JSON from localStorage.
   - `setItem(key: string, value: unknown): void` — serialize and write.
   - All keys prefixed with `sadhana:`.

2. **Create storage tests** (`src/lib/storage.test.ts`)
   - Reads/writes correctly.
   - Returns fallback when key missing.
   - Handles invalid JSON gracefully.

3. **Create seed data** (`src/lib/seed.ts`)
   - Define 9 default categories with sub-components (from `docs/01-product-vision.md`).
   - `seedIfNeeded(): void` — checks `sadhana:version`; if absent, writes seed data + version `"1.0"`.
   - Creates audit entry: `{ action: "data_imported", description: "Initial seed data" }`.

4. **Create seed tests** (`src/lib/seed.test.ts`)
   - Seeds 9 categories with correct sub-component counts.
   - Does not re-seed if version key exists.
   - Creates audit log entry on seed.
   - Each category has a unique ID, correct name, and display order.

5. **Create audit logger** (`src/lib/audit.ts`)
   - `addAuditEntry(action, entityType, entityId, before, after, description): void`
   - Generates UUID and ISO timestamp.
   - Appends to `sadhana:audit` array.

6. **Create audit tests** (`src/lib/audit.test.ts`)
   - Creates entry with correct fields.
   - Appends to existing log.
   - IDs are unique.

7. **Wire seed into app startup**
   - Call `seedIfNeeded()` in `main.tsx` or `App.tsx` before render.

8. **Verify**
   - `npx tsc --noEmit` — passes.
   - `npx vitest run` — all new tests pass.
   - `npx vite build` — succeeds.
   - Open dev server → localStorage shows seeded data.

## Acceptance Criteria

- [ ] 9 categories seeded with correct sub-components.
- [ ] Version key `"1.0"` set on seed.
- [ ] Audit entry created on first seed.
- [ ] No re-seeding on subsequent launches.
- [ ] All unit tests pass.

## References

- `docs/01-product-vision.md` — default categories
- `docs/04-data-model.md` — interfaces
- `docs/08-audit-history.md` — audit schema
