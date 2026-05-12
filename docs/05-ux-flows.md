# 05 — UX Flows

## App Shell & Navigation

The app uses a **bottom tab bar** on mobile (≤ 640 px) and a **sidebar** on tablet/desktop.

### Primary Tabs

| Tab | Icon | Screen |
|-----|------|--------|
| Today | `check-circle` | Daily Tracker |
| Dashboard | `bar-chart-3` | Analytics |
| Journal | `book-open` | Journal |
| History | `calendar` | History Calendar |
| Settings | `settings` | Category Management, Audit Log, Export/Import |

---

## Flow 1 — First Launch

```
App opens
  → No `sadhana:version` found
  → Seed 9 default categories + sub-components
  → Write version key
  → Log audit entry ("Initial seed data")
  → Navigate to Today screen
```

## Flow 2 — Daily Tracking

```
User opens Today tab
  → Load today's DailyEntry (or create empty)
  → Display categories as collapsible accordions
    → Each accordion shows sub-components with toggle switches
  → User toggles a sub-component
    → Update completions map
    → Recompute category score + overall score
    → Save to localStorage
  → Score summary bar at top updates in real time
```

### Today Screen Layout (Mobile)

```
┌──────────────────────────┐
│  ☀ Today — May 12, 2026  │  ← Date nav (< today >)
│  Overall: ██████░░ 72%   │  ← Score bar
├──────────────────────────┤
│ ▼ 🧘 8 Limbs of Yoga  6/8│  ← Collapsible accordion
│   ☑ Yama                 │
│   ☑ Niyama               │
│   ☐ Asana                │
│   ☑ Pranayama            │
│   ...                    │
├──────────────────────────┤
│ ▶ 🗣 Speech Control   3/4│  ← Collapsed
├──────────────────────────┤
│ ▶ 👁 Six Senses       4/6│
│ ...                      │
├──────────────────────────┤
│  Today | Dash | Jrnl | Hist | ⚙ │
└──────────────────────────┘
```

## Flow 3 — Analytics Dashboard

```
User opens Dashboard tab
  → Default: Overall score line chart, 7-day range
  → User selects range (7 / 30 / 90 days)
  → User optionally selects a category filter
  → Chart re-renders with filtered data
  → Streak counter displayed below chart
```

## Flow 4 — Journal Entry

```
User opens Journal tab
  → Shows today's journal entry (or empty editor)
  → User types free-text
  → Auto-save on blur or after 2 s debounce
  → User can navigate to past dates via date picker
```

## Flow 5 — History Calendar

```
User opens History tab
  → Monthly calendar grid displayed
  → Days with entries are color-coded:
    - Green (≥ 80 %), Amber (40–79 %), Red (< 40 %), Grey (no entry)
  → User taps a date
    → Navigate to Today screen with that date loaded
```

## Flow 6 — Category Management (Settings)

```
User opens Settings > Categories
  → List of all categories (active + archived, separated)
  → Tap category → Edit form (name, icon, color, sub-components)
  → "+ Add Category" button at bottom
  → Swipe or menu → Archive / Restore
  → All changes → audit log entry created
```

## Flow 7 — Export / Import (Settings)

```
User opens Settings > Data
  → "Export JSON" button → downloads .json file
  → "Export CSV" button → downloads .csv file
  → "Import JSON" button → file picker
    → Parse file → show conflict summary dialog
    → User chooses Merge or Overwrite
    → Apply import → audit log entry created
```

## Flow 8 — Audit Log (Settings)

```
User opens Settings > Audit Log
  → Chronological list of audit entries (newest first)
  → Each entry shows: timestamp, action, description
  → Tap to expand: before/after diff view
```
