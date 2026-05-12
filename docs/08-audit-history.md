# 08 — Audit History

## Purpose

Every configuration change is recorded in an immutable audit log. Users never lose track of what changed, when, and why. This supports the project's "preserve history" and "non-destructive" principles.

## What Gets Logged

| Action | Trigger |
|--------|---------|
| `category_created` | User adds a new category |
| `category_updated` | User edits name, icon, color, or display order |
| `category_archived` | User archives a category |
| `category_restored` | User restores an archived category |
| `subcomponent_created` | User adds a sub-component |
| `subcomponent_updated` | User edits name or display order |
| `subcomponent_archived` | User archives a sub-component |
| `subcomponent_restored` | User restores a sub-component |
| `data_imported` | User imports a JSON backup |
| `data_exported` | User exports data (JSON or CSV) |

## Export Audit Timing

- JSON export must create the `data_exported` audit entry before the export payload is gathered, so the downloaded JSON includes the export event.
- CSV export must also create a `data_exported` audit entry before download, but the CSV file remains limited to daily-entry rows.
- If a browser download is cancelled after payload generation, keep the audit entry; the user initiated the export action.

## What Does NOT Get Logged

- Daily toggle actions (too noisy; these are stored in `DailyEntry`).
- Journal edits.
- Navigation events.

## Audit Entry Schema

```typescript
interface AuditLogEntry {
  id: string;            // UUID v4
  timestamp: string;     // ISO 8601
  action: AuditAction;
  entityType: "category" | "subComponent" | "system";
  entityId: string;
  before: unknown | null;
  after: unknown | null;
  description: string;   // e.g., "Renamed category 'Yoga' to '8 Limbs of Yoga'"
}
```

## Storage

- Stored as a JSON array in `sadhana:audit`.
- Entries are append-only; never modified or deleted.
- Array grows unbounded in v1.0 (pagination in UI, not in storage).

## UI Requirements

- **Audit Log Screen** (under Settings).
- Sorted newest-first.
- Each row: timestamp (relative, e.g. "2 hours ago"), action badge, description.
- Tap to expand: show `before` and `after` as formatted JSON diff.
- Search/filter by action type (stretch).

## Implementation Notes

- Create a reusable `addAuditEntry(action, entityType, entityId, before, after, description)` utility.
- Call this utility inside every category/sub-component mutation function.
- The utility generates the `id` and `timestamp` automatically.
