# Task 056 - Proactive Product Definition, Experience North Star, And Validation

## Goal

Define and validate the next product generation of Sadhana OS before changing
the application from a reactive tracker into a proactive personal practice
coach.

## Problem

The `v0.2.0-alpha.3` baseline is a dependable, premium tracker with cloud
persistence, history, reflection, analytics, privacy controls, and production
foundations. Its primary value loop still depends on users remembering to
record what happened.

The next generation must reduce manual effort and help users:

- decide which practices matter today;
- protect realistic time for those practices;
- receive useful guidance at appropriate moments;
- recover gracefully when the plan is disrupted;
- reflect without reconstructing the entire day; and
- learn which practices are associated with meaningful improvements.

## Scope

- Define the first paying customer and their jobs to be done.
- Establish positioning, category, value proposition, and competitive wedge.
- Specify the proactive morning, daytime, evening, and weekly product loop.
- Define the premium experience north star and responsive information
  architecture.
- Define observed, confirmed, suggested, and unknown data semantics.
- Map calendar, health, journaling, notification, and native integration
  opportunities.
- Define consent, privacy, AI, and inference boundaries.
- Specify customer research, prototype testing, pricing validation, and
  measurable decision gates.
- Produce screen-level conceptual wireframes for the flagship journeys.
- Prioritize implementation tasks after validation.

## Non-Goals

- No application code changes.
- No database schema or migration changes.
- No Supabase, authentication, RLS, sync, or deployment changes.
- No production API integrations.
- No Expo or native application implementation.
- No AI model or chatbot implementation.
- No final pricing commitment.
- No medical, clinical, diagnostic, or therapeutic positioning.
- No claim that documented ideas have been validated before customer research.

## Deliverables

- `docs/52-proactive-product-strategy.md`
- `docs/53-proactive-experience-north-star.md`
- `docs/54-context-integrations-privacy-map.md`
- `docs/55-customer-validation-plan.md`
- `docs/56-proactive-experience-wireframes.md`
- `tasks/056-proactive-product-definition-validation.md`

## Key Decisions

### Beachhead Customer

Busy professionals, founders, parents, and knowledge workers who already value
meditation, yoga, reflection, or intentional living, but struggle to sustain
those practices when work and family schedules become demanding.

### Product Category

Proactive personal practice coach.

Sadhana OS is not positioned as another habit checklist, clinical mental-health
service, meditation-content library, or general-purpose productivity manager.

### Product Promise

Sadhana OS protects and adapts the practices that keep a person grounded in
real life.

### Signature Loop

1. Sense only consented context.
2. Interpret the user's present constraints.
3. Propose a small, realistic daily practice plan.
4. Protect time and offer timely interventions.
5. Assist reflection with transparent, prefilled context.
6. Learn from patterns and propose one experiment at a time.

### Initial Product Wedge

The first proactive release should validate three connected capabilities:

1. Adaptive Daily Sadhana.
2. Calendar-Protected Practice.
3. Assisted Evening Recap.

## Validation Standard

Product hypotheses remain hypotheses until the research plan produces recorded
evidence. Implementation should not begin merely because a feature is
technically feasible or visually attractive.

## Acceptance Criteria

- [x] The primary paying customer is explicit and narrow enough to recruit.
- [x] The customer problem and jobs to be done are documented.
- [x] Product positioning distinguishes Sadhana OS from tracker, meditation,
      journaling, wearable, and productivity products.
- [x] The proactive daily and weekly loop is specified.
- [x] Premium experience principles and responsive behavior are defined.
- [x] Data confidence and missing-data behavior are defined.
- [x] Integration opportunities are separated by web and native feasibility.
- [x] Sensitive-data, inference, AI, and notification boundaries are defined.
- [x] Prototype journeys and conceptual wireframes are documented.
- [x] Customer interview and usability-test plans are executable.
- [x] Pricing hypotheses and decision gates are documented without becoming
      commitments.
- [x] The next implementation sequence is prioritized.
- [x] Existing application behavior remains unchanged.

## Recommended Decision Gate

Do not start the complete proactive roadmap until customer discovery and
prototype testing pass the gates in `docs/55-customer-validation-plan.md`.

It is acceptable to build a disposable prototype to run those tests. It is not
acceptable to represent prototype feedback as evidence of sustained retention
or willingness to pay.
