# 04 — Data Model

All data lives in localStorage. Each entity type is stored under a namespaced key prefixed with `sadhana:`.

## localStorage Keys

| Key | Value Type | Description |
|-----|-----------|-------------|
| `sadhana:version` | `string` | Schema version for future migrations (e.g., `"1.0"`) |
| `sadhana:categories` | `Category[]` | All categories (active + archived) |
| `sadhana:entries` | `Record<DateKey, DailyEntry>` | Daily tracking data keyed by `YYYY-MM-DD` |
| `sadhana:journal` | `Record<DateKey, JournalEntry>` | Journal entries keyed by `YYYY-MM-DD` |
| `sadhana:audit` | `AuditLogEntry[]` | Immutable audit trail |

---

## TypeScript Interfaces

### Category

```typescript
interface Category {
  id: string;               // UUID v4
  name: string;             // e.g., "8 Limbs of Yoga"
  icon: string;             // Lucide icon name, e.g., "lotus"
  color: string;            // Hex or Tailwind class, e.g., "#7C3AED"
  displayOrder: number;     // Sort position (0-based)
  isArchived: boolean;      // true = hidden from tracker
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  subComponents: SubComponent[];
}
```

### SubComponent

```typescript
interface SubComponent {
  id: string;               // UUID v4
  categoryId: string;       // FK → Category.id
  name: string;             // e.g., "Yama"
  displayOrder: number;
  isArchived: boolean;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}
```

### DailyEntry

```typescript
type DateKey = string;      // "YYYY-MM-DD"

interface DailyEntry {
  date: DateKey;
  completions: Record<string, boolean>;  // subComponentId → done
  categoryScores: Record<string, number>; // categoryId → 0–100
  overallScore: number;                   // 0–100
  updatedAt: string;        // ISO 8601
}
```

### JournalEntry

```typescript
interface JournalEntry {
  date: DateKey;
  content: string;          // Free-text (plain or markdown)
  createdAt: string;
  updatedAt: string;
}
```

### AuditLogEntry

```typescript
type AuditAction =
  | "category_created"
  | "category_updated"
  | "category_archived"
  | "category_restored"
  | "subcomponent_created"
  | "subcomponent_updated"
  | "subcomponent_archived"
  | "subcomponent_restored"
  | "data_imported"
  | "data_exported";

interface AuditLogEntry {
  id: string;               // UUID v4
  timestamp: string;        // ISO 8601
  action: AuditAction;
  entityType: "category" | "subComponent" | "system";
  entityId: string;         // ID of affected entity (or "system")
  before: unknown | null;   // Snapshot before change
  after: unknown | null;    // Snapshot after change
  description: string;      // Human-readable summary
}
```

### ExportPayload

```typescript
interface ExportPayload {
  version: string;
  exportedAt: string;       // ISO 8601
  categories: Category[];
  entries: Record<DateKey, DailyEntry>;
  journal: Record<DateKey, JournalEntry>;
  audit: AuditLogEntry[];
}
```

---

## Seed Data

On first launch (when `sadhana:version` is absent), the app seeds the 9 default categories with their sub-components as defined in `01-product-vision.md`, writes `sadhana:version = "1.0"`, and logs a `data_imported` audit entry with description `"Initial seed data"`.
