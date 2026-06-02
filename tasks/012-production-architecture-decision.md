# Task 012 - Production Architecture Decision

## Goal

Create the v0.2 production architecture source of truth before implementation work begins.

This task translates the approved product direction into concrete architecture decisions, constraints, and follow-up implementation tasks.

## Prerequisites

- Tasks 001-011 completed.
- Existing MVP functionality preserved.

## Scope

- Document the production target architecture.
- Decide whether to keep Vite React or migrate to Next.js.
- Decide the preferred cloud storage/auth platform.
- Define user-owned data isolation principles.
- Define the first production data model proposal.
- Define migration principles from localStorage to cloud storage.
- Define PWA and future Expo/native posture.
- Define the v0.2 follow-up task sequence.

## Non-Goals

- Do not add Supabase/Firebase/custom backend code.
- Do not add authentication UI.
- Do not change localStorage behavior.
- Do not change app navigation.
- Do not change export/import.
- Do not add production dependencies.
- Do not modify React components, hooks, or tests.

## Files

Create:

```text
docs/11-production-architecture.md
tasks/012-production-architecture-decision.md
```

Modify:

```text
None
```

## Steps

1. Create `docs/11-production-architecture.md`.
2. Capture the decision to keep Vite React for v0.2.
3. Capture the decision to use Supabase Postgres + Supabase Auth for v0.2.
4. Include an unbiased comparison of Supabase, Firebase/Firestore, and custom backend + Postgres.
5. Include a target architecture diagram in text.
6. Propose the production data model.
7. Define RLS and user-owned data isolation requirements.
8. Define local cache and offline strategy.
9. Define localStorage-to-cloud migration flow and failure handling.
10. Define B2C onboarding, premium UX, PWA, Expo/native, testing, observability, privacy, deployment, and risks.
11. List v0.2 implementation tasks 013-021.
12. Run verification.

## Acceptance Criteria

- [ ] Architecture recommendation is documented.
- [ ] Supabase vs Firebase vs custom backend comparison is documented.
- [ ] Target architecture diagram is documented in text.
- [ ] Proposed production data model is documented.
- [ ] Migration plan from current local MVP to production cloud app is documented.
- [ ] v0.2 task breakdown is documented.
- [ ] Risks and mitigations are documented.
- [ ] Exact next docs/tasks are identified.
- [ ] No app code is changed.
- [ ] Typecheck passes.
- [ ] Unit/integration tests pass.
- [ ] Production build passes.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Playwright is not required for this docs-only task unless unrelated UI changes are made.

## References

- `docs/01-product-vision.md`
- `docs/02-requirements.md`
- `docs/04-data-model.md`
- `docs/05-ux-flows.md`
- `docs/08-audit-history.md`
- `docs/09-test-plan.md`
- `docs/10-acceptance-criteria.md`
- `docs/11-production-architecture.md`
