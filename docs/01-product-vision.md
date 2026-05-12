# 01 — Product Vision

## What Is Sadhana OS?

Sadhana OS is a **premium, mobile-first spiritual wellness habit tracker** that helps practitioners measure, reflect on, and improve nine life dimensions rooted in Vedic and yogic philosophy, guided by SMART goal-setting principles.

## Problem Statement

Modern habit trackers focus on productivity and fitness but ignore the holistic, inner-growth dimensions that spiritual seekers need — yoga limbs, speech discipline, sense control, and community contribution. Practitioners currently rely on paper journals with no analytics, no audit trail, and no ability to customise their practice framework.

## Target Users

| Persona | Description |
|---------|-------------|
| **Daily Practitioner** | Follows a structured sadhana; wants streak tracking and daily check-ins |
| **Yoga Student** | Studies Ashtanga (8-limb) yoga; needs sub-component tracking per limb |
| **Mindful Professional** | Balances career, family, and inner growth; values quick mobile entry |
| **Spiritual Mentor** | Reviews exported data with students; needs JSON/CSV export |

## Core Principles

1. **Calm & Premium UI** — uncluttered, spiritual aesthetic; no gamification noise.
2. **Mobile-First** — designed for phones; works on desktop.
3. **Privacy-First** — all data stays in the browser (localStorage). No server.
4. **Configurable** — categories and sub-components are fully editable.
5. **Auditable** — every configuration change is logged.
6. **Non-Destructive** — archive/restore instead of hard delete.
7. **SMART Goals** — each tracked item can have a Specific, Measurable, Achievable, Relevant, Time-bound target.

## Nine Default Categories

| # | Category | Example Sub-Components |
|---|----------|------------------------|
| 1 | 8 Limbs of Yoga | Yama, Niyama, Asana, Pranayama, Pratyahara, Dharana, Dhyana, Samadhi |
| 2 | Speech / Vaani Control | Truthfulness, Non-gossip, Kind words, Silence practice |
| 3 | Six Senses Control | Sight, Sound, Smell, Taste, Touch, Mind |
| 4 | Spiritual | Prayer, Mantra, Satsang, Scripture study |
| 5 | Physical | Exercise, Diet, Sleep, Hydration |
| 6 | Mental | Meditation, Journaling, Gratitude, Focus time |
| 7 | Society | Volunteering, Charity, Environmental care, Community service |
| 8 | Professional | Deep work, Learning, Mentoring, Planning |
| 9 | Family | Quality time, Support, Communication, Shared rituals |

## North-Star Metrics (Product Success)

- Daily active tracking sessions ≥ 1 per user per day.
- 7-day streak retention ≥ 60 %.
- Config-change audit log coverage = 100 %.

## MVP Scope (v1.0)

- Daily tracker with configurable categories and sub-components.
- Scoring engine (percentage per category + overall).
- Analytics dashboard (7 / 30 / 90-day trends via Recharts).
- Journal (free-text, date-linked).
- History view (calendar + date picker).
- Audit log viewer.
- JSON export/import, CSV export.
- Fully offline — localStorage only.

## Out of Scope (v1.0)

- Server / cloud sync.
- Multi-user / auth.
- Push notifications.
- Native mobile app.
- Detailed SMART target fields and goal-progress workflows (planned for v1.1).
