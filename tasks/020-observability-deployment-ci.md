# Task 020 - Observability, Deployment, And CI

## Goal

Add production readiness foundations for CI, deployment documentation, and privacy-safe observability.

## Prerequisites

- Task 015 completed.
- Task 017 completed.
- Task 018 completed.

## Scope

- Add deployment and observability documentation.
- Add GitHub Actions CI workflow.
- Add privacy-safe observability helper.
- Add tests for event allowlist and private payload redaction.
- Use observability helper for cloud sync errors.

## Non-Goals

- Do not add Sentry/PostHog/etc. yet.
- Do not commit deployment secrets.
- Do not send private content to telemetry.
- Do not deploy infrastructure from CI yet.

## Files

Create:

```text
docs/16-deployment-observability.md
.github/workflows/ci.yml
src/lib/observability.ts
src/lib/observability.test.ts
tasks/020-observability-deployment-ci.md
```

Modify:

```text
src/cloud/CloudSyncProvider.tsx
```

## Acceptance Criteria

- [ ] CI workflow runs install, typecheck, tests, build, and E2E.
- [ ] Deployment environment variables are documented.
- [ ] Observability layer exists.
- [ ] Observability layer has an approved event allowlist.
- [ ] Observability layer redacts private practice content.
- [ ] Cloud sync errors use the error reporting helper.
- [ ] Typecheck passes.
- [ ] Unit/integration tests pass.
- [ ] Production build passes.
- [ ] E2E tests pass.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```
