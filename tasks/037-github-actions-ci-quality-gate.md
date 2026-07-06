# Task 037 - GitHub Actions CI Quality Gate

Status: Implemented

Date: 2026-07-06

## Goal

Enforce the Sadhana OS quality gate automatically on GitHub for pull requests and pushes to `main`.

## Existing State

The repository already had a CI workflow, but it did not fully match the current local quality gate:

- `npm run lint` was not run.
- Playwright installed Chromium while the project config runs Chrome.
- E2E test artifacts were not uploaded on failure.

## Scope

Implemented:

- Updated `.github/workflows/ci.yml`.
- CI runs on:

```text
pull_request
push to main
```

- CI installs dependencies with:

```bash
npm ci
```

- CI now runs:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

- CI installs the Playwright Chrome browser used by the current Playwright config.
- CI uploads Playwright artifacts on failure:

```text
playwright-report/
test-results/
```

- CI keeps npm dependency caching through `actions/setup-node`.

## Non-Goals

- Do not add deployment steps.
- Do not add secrets.
- Do not add staging or production environment validation to CI in this task.
- Do not change Playwright test behavior.
- Do not change application code.

## Files

Modified:

```text
.github/workflows/ci.yml
```

Created:

```text
tasks/037-github-actions-ci-quality-gate.md
```

## Acceptance Criteria

- [x] CI runs on pull requests.
- [x] CI runs on pushes to `main`.
- [x] CI includes lint.
- [x] CI includes typecheck, tests, build, and E2E.
- [x] CI installs the browser expected by the Playwright config.
- [x] CI uploads Playwright failure artifacts.
- [x] No secrets are committed.

## Verification

Local equivalent:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Remote verification:

- Push this branch or merge to `main`.
- Confirm the GitHub Actions `CI` workflow passes.
