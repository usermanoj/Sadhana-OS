# 11 - Production Architecture

## Purpose

This document defines the approved v0.2 target direction for moving Sadhana OS from a single-user local MVP to a production-ready B2C web application with secure accounts, persistent cloud storage, privacy controls, migration from local data, and PWA readiness.

This is the source of truth for v0.2 architecture decisions. Detailed implementation tasks live in `tasks/`.

## Decision Summary

| Area | Decision |
|------|----------|
| Frontend framework | Keep Vite + React for v0.2 |
| Routing | Add route support only when needed for auth/onboarding/app URLs |
| Cloud data platform | Supabase Postgres |
| Authentication | Supabase Auth |
| Authorization | Postgres row-level security (RLS) on every user-owned table |
| Primary persistence | Cloud Postgres after sign-in |
| Local cache | IndexedDB for v0.2+ cache and future offline queue |
| Legacy local data | Preserve and migrate from `sadhana:*` localStorage keys |
| Export/import | Keep JSON and CSV export/import |
| PWA | Add manifest and service-worker foundation after auth/storage boundaries |
| Native mobile | Prepare shared domain/sync code for future Expo app; do not build native app in v0.2 |

## Current MVP Assessment

### Strengths

- Clear product requirements and task history in `docs/` and `tasks/`.
- Strict TypeScript, Vitest, Playwright, and production build scripts already exist.
- Domain model is typed and already uses stable IDs.
- Audit history, archive/restore, JSON export/import, and CSV export are already present.
- Mobile-first layout exists with bottom tabs on mobile and sidebar on desktop.
- Scoring and analytics logic are mostly isolated in `src/lib/`.

### Weaknesses To Address

- Persistence is coupled to React hooks and components through direct localStorage calls.
- There is no user/account boundary.
- There is no route model for auth, onboarding, settings, or shareable app URLs.
- Audit entries are client-created only and are not server-trusted.
- localStorage is not sufficient for production privacy, durability, sync, or large history.
- No conflict model exists for multi-device edits.
- No database migrations, RLS tests, deployment environments, monitoring, or privacy operations exist yet.

## Vite React vs Next.js

### Recommendation

Keep Vite React for v0.2.

### Rationale

Sadhana OS is currently a private authenticated application with high client interactivity. The near-term work is not server rendering; it is data ownership, auth, migration, sync, privacy, and mobile UX. A Next.js migration would add framework churn before solving those risks.

### When To Reconsider Next.js

Revisit Next.js if any of these become P0:

- SEO-rich marketing pages maintained inside the same codebase.
- Server-rendered public content.
- Backend-for-frontend routes that should live in the app repo.
- Payment/webhook endpoints that should be colocated with frontend code.
- Heavy use of React Server Components.

For v0.2, Vite can continue to deploy as a static app backed by Supabase.

## Storage Platform Comparison

| Capability | Supabase Postgres | Firebase/Firestore | Custom Backend + Postgres |
|------------|-------------------|--------------------|---------------------------|
| Data fit | Strong fit for categories, habits, entries, journals, audit logs | Good for document-style data; relational queries need denormalization | Strongest fit if designed well |
| Auth | Built in with common providers | Built in with broad ecosystem | Must build or integrate |
| Authorization | Postgres RLS, SQL policies | Firestore security rules | Custom middleware and DB policies |
| Analytics queries | Strong with SQL | Weaker without exports/aggregation | Strong |
| Export/delete operations | Straightforward SQL | More custom traversal | Straightforward if implemented |
| Offline support | Requires custom app strategy | Strong built-in client persistence | Requires custom app strategy |
| Vendor lock-in | Moderate | Higher data-model lock-in | Lower |
| Time to production | Fast | Fastest for realtime/offline | Slowest |
| Operational burden | Low to medium | Low | High |
| Cost risk | Predictable enough for early B2C | Can surprise with reads/writes at scale | Infrastructure and engineering cost |

### Decision

Use Supabase Postgres for v0.2. It best matches the product's relational data, audit needs, privacy/export/delete requirements, and future analytics.

Firebase remains a credible alternative if offline-first sync becomes more important than relational analytics. A custom backend should wait until the product has constraints that justify the added operational weight.

## Target Architecture

```text
Browser / Installed PWA
  |
  | React + Vite app
  | - App routes and shell
  | - Today, Dashboard, Journal, History, Settings
  | - Onboarding, Auth, Account, Migration
  |
  | Domain layer
  | - scoring
  | - audit command helpers
  | - import/export
  | - validation and schema migrations
  |
  | Repository layer
  | - LocalRepository for legacy/local mode
  | - IndexedDbCache for local cloud cache
  | - CloudRepository for Supabase
  | - SyncQueue for future offline writes
  |
  | Supabase client
  |
  +--> Supabase Auth
  |
  +--> Supabase Postgres
       - profiles
       - user_settings
       - categories
       - habits
       - daily_entries
       - daily_habit_entries
       - journal_entries
       - audit_log_entries
       - import_jobs
       - sync_devices
       - RLS policies on user_id = auth.uid()
  |
  +--> Supabase Edge Functions
       - account deletion
       - future billing webhooks
       - future reminders/notifications
       - privileged maintenance operations
```

## Authentication Strategy

### v0.2 Auth Methods

- Email magic link.
- Google OAuth.
- Apple OAuth if configured before public launch.

### Later Auth Options

- Email/password if support demand is clear.
- Multi-factor authentication for users who want additional protection.

### Session Requirements

- Persist sessions across reloads.
- Provide sign out from account/settings.
- Clear sensitive local cache on sign out, while preserving pre-auth legacy localStorage unless the user explicitly removes it.
- Display a calm sync/account state in the UI.

## Data Ownership And RLS

Every user-owned table must include `user_id uuid not null references auth.users(id)`.

Baseline policy shape:

```sql
using (user_id = auth.uid())
with check (user_id = auth.uid())
```

Rules:

- Enable RLS before exposing a table to the client.
- Deny update/delete on audit rows.
- Prefer append-only audit events.
- Use server-side functions for privileged workflows such as account deletion.
- Never expose service-role keys in frontend code.
- Add tests proving User A cannot read or write User B data.

## Proposed Data Model

### profiles

User-facing identity metadata.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, equals `auth.users.id` |
| display_name | text | Nullable |
| timezone | text | Required after onboarding |
| onboarding_completed_at | timestamptz | Nullable |
| created_at | timestamptz | Server default |
| updated_at | timestamptz | Server maintained |

### user_settings

Per-user app settings.

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | Primary key |
| schema_version | text | App data schema, starts at v0.2 |
| week_starts_on | int | 0-6 |
| reminder_enabled | boolean | Future-ready |
| reminder_time | time | Nullable |
| created_at | timestamptz | Server default |
| updated_at | timestamptz | Server maintained |

### categories

Top-level tracking dimensions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Preserve local IDs during migration |
| user_id | uuid | RLS owner |
| name | text | Required |
| icon | text | Lucide icon name |
| color | text | Hex token |
| display_order | int | User-defined order |
| is_archived | boolean | Archive instead of delete |
| created_at | timestamptz | Preserve migrated timestamp when available |
| updated_at | timestamptz | Preserve migrated timestamp when available |

Unique index: `(user_id, display_order)` can be deferred until reorder semantics are finalized.

### habits

Sub-components/practices inside categories.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Preserve local IDs during migration |
| user_id | uuid | RLS owner |
| category_id | uuid | References categories |
| name | text | Required |
| tracking_type | text | `boolean`, `scale5`, `scale10`, `duration`, `count`, `numeric`, `text` |
| display_order | int | Order within category |
| is_archived | boolean | Archive instead of delete |
| created_at | timestamptz | Preserve migrated timestamp when available |
| updated_at | timestamptz | Preserve migrated timestamp when available |

### daily_entries

One daily aggregate row per user/date.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | RLS owner |
| entry_date | date | User-local date |
| overall_score | numeric | 0-100 |
| category_scores | jsonb | Snapshot by category ID |
| created_at | timestamptz | Server default or migrated |
| updated_at | timestamptz | Server maintained or migrated |

Unique index: `(user_id, entry_date)`.

### daily_habit_entries

Normalized habit values for a day.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | RLS owner |
| entry_date | date | User-local date |
| habit_id | uuid | References habits |
| value | jsonb | Boolean, number, or string payload |
| created_at | timestamptz | Server default |
| updated_at | timestamptz | Server maintained |

Unique index: `(user_id, entry_date, habit_id)`.

### journal_entries

One journal row per user/date.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | RLS owner |
| entry_date | date | User-local date |
| mood | text | Nullable |
| gratitude | text | Nullable |
| spiritual_insight | text | Nullable |
| trigger_observed | text | Nullable |
| lesson_learned | text | Nullable |
| content | text | Required, may be empty |
| created_at | timestamptz | Preserve migrated timestamp when available |
| updated_at | timestamptz | Preserve migrated timestamp when available |

Unique index: `(user_id, entry_date)`.

### audit_log_entries

Append-only audit history.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Preserve local IDs during migration where possible |
| user_id | uuid | RLS owner |
| timestamp | timestamptz | Event time |
| action_type | text | Existing action vocabulary |
| entity_type | text | `category`, `habit`, `system` |
| entity_id | text | ID or `system` |
| old_value | jsonb | Nullable |
| new_value | jsonb | Nullable |
| note | text | Nullable |
| source | text | `client`, `migration`, `server` |

No update/delete policies for normal users.

### import_jobs

Tracks localStorage-to-cloud migration and future import runs.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | RLS owner |
| source | text | `localStorage`, `json` |
| mode | text | `merge`, `overwrite` |
| status | text | `pending`, `running`, `succeeded`, `failed` |
| summary | jsonb | Counts, conflicts, checksums |
| error_message | text | Nullable |
| created_at | timestamptz | Server default |
| completed_at | timestamptz | Nullable |

### sync_devices

Future-ready device metadata for offline sync diagnostics.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | RLS owner |
| device_label | text | Nullable |
| last_seen_at | timestamptz | Updated on app use |
| created_at | timestamptz | Server default |

## Local Cache And Offline Strategy

### v0.2

- Keep app usable for signed-out local mode until migration.
- Add repository boundaries before introducing Supabase.
- Add IndexedDB cache for cloud-backed data after auth.
- Show sync state: signed out, local only, syncing, synced, offline, error.
- Use online-first reads and writes initially.

### v0.3+

- Add mutation queue with `client_mutation_id`.
- Use per-record `updated_at` for conflict detection.
- Resolve daily habit values with last-write-wins per `(entry_date, habit_id)`.
- Resolve category/habit configuration conflicts with explicit user choice when both sides changed.

## Migration From localStorage To Cloud

The app must never destroy local data during migration.

Flow:

1. User signs in.
2. App scans for `sadhana:*` localStorage data.
3. App validates local payload using the existing import validation path.
4. App shows a migration preview with counts for categories, habits, daily entries, journal entries, and audit events.
5. User chooses migrate now or skip for later.
6. App uploads data while preserving local IDs and timestamps where valid.
7. App creates an import job and a `data_imported` audit event.
8. App verifies uploaded counts and key checksums.
9. App switches to cloud repository only after verification succeeds.
10. App keeps the original localStorage backup unless the user explicitly clears it.

Failure handling:

- If validation fails, no cloud writes should happen.
- If upload partially fails, mark the import job failed and keep the local copy untouched.
- If verification fails, keep the user in local mode and show a recovery message.

## B2C Onboarding Journey

1. Welcome screen: clear promise, private spiritual practice tracking, no marketing clutter.
2. Account creation: magic link and OAuth.
3. Local data detection: migrate existing practice data or start fresh.
4. Practice setup: default 9 dimensions enabled, optional customization deferred.
5. Timezone confirmation.
6. Optional reminder preference.
7. First check-in on Today screen.

Tone: calm, premium, reassuring, privacy-forward.

## Premium UX Direction

- Keep Today as the first authenticated screen.
- Show a compact account/sync state without visual noise.
- Avoid gamified excess; frame streaks and scores as reflection, not pressure.
- Improve empty states with short human guidance.
- Keep touch targets at least 44px.
- Preserve one-handed mobile ergonomics.
- Keep Settings organized into Data, Account, Privacy, Categories, Audit.
- Make export, migration, and account deletion easy to find.

## PWA Strategy

Add after auth and repository boundaries:

- Web app manifest.
- Maskable icons.
- Theme color aligned to the design system.
- Service worker for app-shell assets.
- Offline fallback shell.
- Install prompt support.
- Cache versioning tied to app schema version.

Do not cache authenticated API responses in a service worker unless the cache is explicitly designed for private data and cleared on sign out.

## Future Expo / React Native Strategy

Do not build native mobile in v0.2.

Prepare for Expo by keeping these modules UI-agnostic:

- Domain types.
- Scoring.
- Import/export validation.
- Repository interfaces.
- Supabase data access.
- Sync queue and conflict resolution.

React Native should be considered after web retention, onboarding conversion, and paid-user demand justify the investment.

## Testing Strategy

Add coverage in layers:

- Unit tests for repository contracts and schema migration helpers.
- Vitest integration tests for auth state, migration preview, and cloud/local repository switching.
- SQL/RLS tests proving user data isolation.
- Playwright tests for sign-in, onboarding, migration, export/import, and mobile flows.
- Build/typecheck on every task.

Minimum verification per implementation task:

```bash
npm run typecheck
npm test
npm run build
```

Run Playwright when UI behavior, auth, navigation, migration, import/export, or PWA behavior changes:

```bash
npm run test:e2e
```

## Observability

Add production observability after auth foundation:

- Client error monitoring.
- Privacy-safe product analytics.
- Sync/import failure events.
- Build/deployment metadata.
- Supabase database logs and alerts.

Do not send journal content, habit names, category names, reflections, or raw practice values to analytics.

Recommended event examples:

- `sign_in_succeeded`
- `onboarding_completed`
- `local_migration_started`
- `local_migration_succeeded`
- `local_migration_failed`
- `sync_error_seen`
- `export_json_started`
- `account_deletion_requested`

## Privacy, Export, Deletion, And Retention

Required production capabilities:

- JSON export remains available.
- CSV export remains available.
- Account deletion is self-serve.
- Deletion should remove or anonymize all user-owned data.
- User should see what deletion means before confirming.
- Local cached private data should be cleared on sign out or account deletion.
- Privacy policy must describe storage, analytics, export, deletion, and retention.

Default retention:

- Active account data retained until user deletes account.
- Deleted account data removed from primary tables.
- Backups retained according to platform backup windows.
- Analytics must avoid private content so analytics deletion risk is lower.

## Deployment Strategy

v0.2 target:

- Static app on Vercel, Netlify, or Cloudflare Pages.
- Supabase hosted project for database/auth.
- Separate development, staging, and production environments.
- Environment variables scoped by environment.
- Database migrations committed to the repo.
- CI runs typecheck, unit tests, build, and migration validation.
- Production deploy requires passing checks.

## Cost And Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS policy mistake | Private data exposure | Deny by default, SQL policy tests, staging audits |
| Migration data loss | Severe trust damage | Validate first, keep local backup, verify counts/checksums |
| Offline conflict confusion | User frustration | Start online-first, add explicit queue/conflict rules later |
| Cost growth | Margin pressure | Monitor database size/API usage, add budgets and alerts |
| Auth friction | Lower conversion | Magic link and OAuth, defer password complexity |
| PWA private data leakage | Privacy issue | Do not service-worker-cache API data until designed |
| Overbuilding backend | Slower launch | Use Supabase first, defer custom backend |

## Phased v0.2 Roadmap

### Phase 1 - Specifications And Boundaries

- Production architecture doc.
- Cloud data model doc.
- Auth/security/privacy doc.
- Repository interfaces.
- Local repository adapter around current localStorage behavior.

### Phase 2 - Supabase Foundation

- Add Supabase dependency with explanation.
- Add environment configuration.
- Add SQL migrations.
- Add RLS policies and tests.
- Add Supabase repository implementation.

### Phase 3 - Auth And Onboarding

- Add auth UI and session state.
- Add profile/settings creation.
- Add onboarding screens.
- Add account/sync state.

### Phase 4 - Migration

- Detect local data.
- Preview migration.
- Upload to cloud.
- Verify migration.
- Preserve export/import.

### Phase 5 - Cloud-Backed App

- Wire Today, Dashboard, Journal, History, Settings to repository layer.
- Preserve audit history.
- Keep local fallback where appropriate.
- Add cloud-aware import/export.

### Phase 6 - Production Polish

- PWA manifest and app-shell cache.
- Error monitoring and privacy-safe analytics.
- Account deletion.
- Deployment and CI hardening.
- Premium mobile UX pass.

## v0.2 Task List

| Task | Title |
|------|-------|
| 012 | Production Architecture Decision |
| 013 | Persistence Repository Boundary |
| 014 | Supabase Schema, RLS, And Migrations |
| 015 | Auth, Account, And Onboarding |
| 016 | LocalStorage To Cloud Migration |
| 017 | Cloud-Backed Core Screens |
| 018 | Privacy, Export, And Account Deletion |
| 019 | PWA Install And Cache Foundation |
| 020 | Observability, Deployment, And CI |
| 021 | Premium Mobile UX Pass |

## Non-Goals For v0.2

- Native mobile app.
- Social/community features.
- Mentor dashboards.
- Payments/subscriptions unless separately approved.
- AI-generated spiritual guidance.
- Replacing export/import.
- Hard-deleting user data outside explicit account deletion.
