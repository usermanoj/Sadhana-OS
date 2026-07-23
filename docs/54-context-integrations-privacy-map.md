# 54 - Context Integrations And Privacy Map

## Purpose

This document defines which external signals may support proactive guidance,
what each signal can and cannot prove, where the capability is technically
available, and the privacy conditions required before implementation.

Integration access is not a product objective by itself. Every requested
permission must support a user-understood benefit.

## Data Confidence Model

Every practice-related fact must have one of four states.

### Observed

A trusted integration or Sadhana OS session recorded an event.

Examples:

- a Sadhana timer completed;
- a workout exists in HealthKit;
- a calendar practice block elapsed.

Observation does not always prove intentional completion. A calendar event
passing, for example, is evidence of reserved time, not proof of practice.

### Confirmed

The user explicitly confirmed or corrected an event.

### Suggested

The system proposed a possible interpretation or action. Suggestions never
become historical facts without confirmation or direct observation.

### Unknown

No reliable information is available.

Unknown is not false, failed, incomplete, or zero.

## Source Provenance

Each stored contextual record should eventually support:

- source type;
- source identifier;
- observed timestamp;
- relevant time zone;
- confidence or certainty class;
- whether user confirmation occurred;
- permission scope;
- last synchronization time;
- correction history where appropriate.

This is a future data-model requirement, not part of Task 056 implementation.

## Integration Capability Matrix

| Signal or action | User benefit | Web/PWA | Native | Sensitivity | Initial decision |
| --- | --- | --- | --- | --- | --- |
| Google Calendar | Find and protect practice windows | Yes, OAuth/backend required | Yes | High | Validate first |
| Outlook Calendar | Same as Google for Microsoft users | Yes, OAuth/backend required | Yes | High | Validate after Google demand |
| Local notification | Reminder and recovery prompt | Limited/platform-dependent | Strong | Medium | Required |
| Push notification | Cross-device timely prompt | Yes with service worker/support | Strong | Medium | Required with consent |
| HealthKit sleep | Adapt plan intensity | No | iOS only | Very high | Native phase |
| HealthKit mindfulness | Confirm supported sessions | No | iOS only | Very high | Native phase |
| Health Connect sleep/activity | Adapt and prefill context | No | Android only | Very high | Native phase |
| Sadhana practice timer | Directly confirm session | Yes | Yes | Medium | Early |
| Apple Journaling Suggestions | User-selected reflection context | No | iOS only | Very high | Native phase |
| Voice reflection | Reduce writing friction | Browser support varies | Strong | Very high | Prototype locally, explicit action only |
| Location category | Offer transition/context suggestions | Possible, foreground permission | Stronger | Very high | Defer until proven need |
| Weather | Adapt outdoor suggestions | Yes | Yes | Low to medium | Optional |
| Screen-time intervention | Digital Pratyahara | No meaningful web control | Native, entitlement/platform limits | Very high | Later research |
| Wearable haptics | Guided pacing | No | Watch app required | Medium | Later |
| Camera/photo meal logging | Nutrition context | Possible | Strong | Very high | Outside initial wedge |
| Always-on microphone | Potential speech analysis | Technically constrained | Technically possible in narrow cases | Extreme | Prohibited |
| Email/message content | Infer commitments or relationships | Possible through broad scopes | Possible | Extreme | Prohibited for initial product |

## Platform Health Repositories

Apple HealthKit and Android Health Connect can provide user-permissioned sleep,
activity, workout, heart-rate, and mindfulness records:

- [Apple HealthKit](https://developer.apple.com/documentation/healthkit)
- [Apple sleep analysis](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis)
- [Android Health Connect](https://developer.android.com/health-and-fitness/health-connect)
- [Health Connect data types](https://developer.android.com/health-and-fitness/health-connect/data-types)

The preferred strategy is to begin with platform health repositories rather
than maintaining direct integrations with every wearable vendor. Direct
wearable APIs should be added only when platform data is insufficient and
customer demand is demonstrated.

## Calendar Access Model

### Minimum Scope

The first calendar prototype should request only what is necessary to:

- identify busy and available windows;
- place user-approved practice blocks;
- detect later scheduling conflicts;
- preserve chosen privacy labels.

### Privacy Modes

1. **Availability only** - consume busy/free intervals without titles.
2. **User-selected calendars** - access only explicitly chosen calendars.
3. **Context enhanced** - use limited event metadata for user-approved rules.

Availability only should be the default research proposition.

### Calendar Rules

- Never expose private practice names on a work calendar without explicit
  choice.
- Offer `Busy`, `Personal appointment`, or custom labels.
- Never invite attendees.
- Never move non-Sadhana events.
- Show every write before first activation.
- Provide disconnect and revoke instructions.

## Notifications And Intervention Budget

Notifications are an attention cost.

The user should control:

- allowed intervention types;
- quiet hours;
- maximum proactive prompts per day;
- calendar contexts where prompts may appear;
- whether missed-practice recovery prompts are allowed;
- sensitive content on lock screens;
- per-practice notification behavior.

Default proposal:

- no more than one morning plan prompt;
- no more than one user-configured practice reminder;
- one optional evening recap prompt;
- contextual interventions off until explicitly enabled.

The system must suppress duplicate or stale prompts across devices.

## Journaling And Voice

Apple Journaling Suggestions provides an example of privacy-preserving,
user-selected context: the app receives only the event a user chooses from the
system picker rather than unrestricted access to all source data.

Reference:
[Apple Journaling Suggestions](https://developer.apple.com/documentation/JournalingSuggestions).

Voice reflection rules:

- recording starts only after a clear user action;
- the interface visibly indicates recording;
- raw audio retention is off by default;
- transcript review occurs before saving;
- AI processing destination is disclosed;
- deletion covers transcript, audio, embeddings, and derived summaries;
- voice is not used for background emotion or speech surveillance.

## Prohibited Inference

Without explicit user confirmation, Sadhana OS must not claim:

- that a user is anxious, depressed, ill, addicted, or clinically stressed;
- that a relationship is healthy or unhealthy;
- that a person has achieved or regressed spiritually;
- that a calendar event was emotionally difficult;
- that a passed calendar block means a practice occurred;
- that low app engagement means low commitment;
- that heart rate alone reveals an emotional state;
- that correlation proves causation;
- that missed data means failure.

## AI Boundaries

An eventual Sadhana Advisor may:

- summarize user-confirmed patterns;
- explain observed changes;
- propose reversible practices;
- generate reflection questions;
- help create a personal experiment;
- cite the records behind its response.

It may not:

- diagnose;
- recommend medication changes;
- claim clinical efficacy;
- impersonate a therapist, physician, guru, or teacher;
- conceal that AI produced a response;
- persist memory without a visible control;
- train external models on private user content by default;
- use private journal content for advertising;
- send sensitive content to multiple processors without disclosure.

Memory controls must allow a user to view, correct, and delete remembered
information. Oura's public description of Advisor memories provides a useful
control pattern:
[Oura Advisor](https://ouraring.com/blog/oura-advisor/).

## Data Minimization

For every integration, record:

1. exact product benefit;
2. minimum scopes required;
3. fields read;
4. fields written;
5. storage location;
6. retention duration;
7. subprocessors;
8. user-visible controls;
9. behavior after disconnection;
10. export and deletion treatment.

If a field does not improve a validated user journey, do not collect it.

## Retention Hypotheses

These policies require legal review before launch:

- availability windows may be reduced to derived scheduling constraints after
  a short synchronization period;
- raw calendar titles should not be stored for availability-only mode;
- raw voice audio should be deleted immediately after an approved transcript
  unless the user intentionally keeps it;
- derived insights should retain links to source records and disappear when
  those records are deleted;
- revoked integrations stop new collection immediately;
- account deletion includes integrations, tokens, derived records, and AI
  memories;
- audit history remains protected during normal archive operations but follows
  the approved whole-account deletion policy.

## Security Requirements

- OAuth with PKCE where supported.
- Tokens stored server-side or in platform-secure storage, never localStorage.
- Narrow scopes and explicit redirect allowlists.
- Encryption in transit and at rest.
- Row Level Security for all user-owned integration metadata.
- No service-role key in a client.
- Token rotation and revocation handling.
- Replay-safe webhook processing.
- Signed webhook verification.
- Idempotent synchronization.
- Source-specific rate limiting.
- Observability without journal, token, or health payloads.
- Separate development, staging, and production credentials.

## Architecture Direction

### Existing Web Application

Retain React, TypeScript, Vite, Tailwind, Supabase, and the current web
dashboard for:

- desktop review and planning;
- account and privacy controls;
- manual and assisted tracking;
- calendar prototype;
- insights and Journal;
- cloud synchronization.

### Shared Domain Layer

Extract or preserve framework-independent TypeScript contracts for:

- practices and plans;
- observation provenance;
- recommendation explanations;
- recap resolution;
- experiments;
- integration permissions.

### Native Companion

Use Expo/React Native when validated requirements include:

- HealthKit or Health Connect;
- reliable background behavior;
- native notifications;
- widgets and Live Activities;
- wearable support;
- Screen Time or digital-attention capabilities;
- secure device token storage.

Do not migrate the web app to Next.js to obtain native capabilities. That would
not solve the platform-access requirement.

## Integration Priority

1. Sadhana-owned practice timer and explicit context.
2. Google Calendar availability and protected blocks.
3. Notification preferences and intervention budget.
4. Assisted recap provenance.
5. Expo/native foundation.
6. HealthKit and Health Connect.
7. Apple Journaling Suggestions.
8. Screen-time intervention research.
9. Direct wearable APIs only when necessary.
