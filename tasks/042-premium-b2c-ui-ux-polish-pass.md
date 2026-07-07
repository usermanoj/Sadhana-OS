# Task 042 - Premium B2C UI/UX Polish Pass

## Goal

Refine the current Sadhana OS interface so the authenticated web app feels calmer, more consistent, and more premium without changing product behavior, persistence, authentication, or cloud sync semantics.

## Scope

- Normalize primary screen headers across Today, Analytics, Journal, History, and Settings.
- Tighten application shell spacing and desktop content width.
- Improve desktop sidebar and mobile bottom navigation focus/touch affordances.
- Improve Today category cards and tracking controls.
- Improve Settings section navigation as a segmented control.
- Improve action-card focus states in Data and cloud sync surfaces.
- Remove viewport-dependent typography scaling and use fixed design tokens.
- Increase the fixed typography scale so laptop and desktop screens remain readable.
- Anchor desktop content beside the sidebar instead of centering it inside an overly wide canvas.
- Keep all existing MVP and cloud functionality intact.

## Non-Goals

- No Supabase schema changes.
- No authentication behavior changes.
- No cloud sync behavior changes.
- No local migration behavior changes.
- No export/import semantic changes.
- No new production dependencies.
- No native mobile implementation.

## Acceptance Criteria

- Existing navigation, tracking, journal, history, settings, export/import, auth, and cloud sync flows continue to work.
- UI remains mobile-first and touch-friendly.
- Text does not depend on viewport-width font scaling.
- Primary screen headers and section navigation feel visually consistent.
- Typecheck, lint, unit tests, build, and E2E tests pass.
