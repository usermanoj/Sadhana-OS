# Task 039 - GitHub Actions Runtime Warning Cleanup

## Goal

Remove the GitHub Actions Node.js runtime deprecation warning seen after Task 038 while preserving the existing CI quality gate.

## Scope

- Update official GitHub Actions used by CI to versions that no longer trigger the Node 20 runtime warning.
- Keep the same Node version used for the Sadhana OS app build.
- Keep the existing CI sequence intact:
  - install dependencies
  - lint
  - typecheck
  - unit and integration tests
  - build
  - Playwright browser install
  - E2E tests
  - failure artifacts

## Non-Goals

- Do not change app code.
- Do not change Supabase configuration.
- Do not change deployment configuration.
- Do not change Playwright test coverage.
- Do not add dependencies.

## Files

- `.github/workflows/ci.yml`
- `e2e/import.spec.ts`
- `tasks/039-github-actions-runtime-warning-cleanup.md`

## Acceptance Criteria

- [x] `actions/checkout` uses v5.
- [x] `actions/setup-node` uses v5.
- [x] Local lint passes.
- [x] Local typecheck passes.
- [x] Local tests pass.
- [x] Local build passes.
- [x] Local E2E tests pass.
- [ ] GitHub Actions CI passes after merge to `main`.
- [ ] GitHub Actions no longer shows the Node 20 runtime deprecation warning for checkout/setup-node.

## Result

Implemented and locally validated. GitHub-hosted validation is pending merge and push to `main`.
