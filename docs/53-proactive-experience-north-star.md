# 53 - Proactive Experience North Star

## Experience Promise

Sadhana OS should feel like a calm, intelligent guide that understands what
matters now, not a dashboard waiting to be updated.

The premium experience is produced by relevance, restraint, trust, and
continuity. It is not produced by adding more cards, gradients, animations, or
decorative spirituality.

## Desired Emotional Sequence

| Moment | User should feel | Product responsibility |
| --- | --- | --- |
| Opening the day | Oriented | Reduce the day to a realistic practice plan |
| Seeing a recommendation | Understood | Explain the context and allow adjustment |
| Beginning practice | Settled | Remove navigation and distraction |
| Missing a plan | Supported | Offer recovery without shame |
| Reviewing the day | Recognized | Prefill reliable context and ask less |
| Reading an insight | Curious | Show evidence and uncertainty |
| Managing data | In control | Make sources, consent, and deletion visible |

## Experience Architecture

The long-term primary navigation should be tested as:

1. **Today** - current context, adaptive plan, and next action.
2. **Practice** - practice library, programs, and guided sessions.
3. **Insights** - weekly stories, patterns, and experiments.
4. **Journal** - assisted reflection and personal history.
5. **You** - profile, integrations, privacy, data, and account.

This is a product hypothesis. Existing navigation remains unchanged until
prototype tests show that the new model is more understandable.

## Today 2.0

Today becomes an adaptive plan, not a list of every trackable practice.

### First Viewport

- time-appropriate greeting;
- one chosen intention;
- current plan mode: Full, Balanced, or Minimum;
- next recommended practice;
- duration and timing;
- concise reason for the recommendation;
- Start, Schedule, Shorten, and Replace actions.

### Supporting Context

- a quiet daily rhythm showing earlier and upcoming practices;
- any unresolved context requiring confirmation;
- one recovery option when the plan has slipped;
- expandable access to the complete practice library.

### What Moves Out Of The First Viewport

- every category and sub-practice;
- historical charts;
- setup controls;
- detailed sync state unless attention is required;
- secondary achievements;
- configuration explanations.

## Sadhana Compass

The Compass is a directional aid, not a life score.

It can show:

- where the user explicitly wants attention;
- which domains have received little intentional time;
- whether today's plan is balanced against the user's stated priorities;
- a short explanation of the evidence.

It must not:

- rank moral or spiritual quality;
- compare users;
- label a person as balanced or unbalanced;
- infer inner attainment;
- treat high completion as virtue.

## Adaptive Plan Modes

### Full

Used when the user has sufficient time and energy. It contains the complete
priority practice sequence for the day.

### Balanced

The default plan. It protects the most valuable practices while fitting normal
constraints.

### Minimum

A deliberately complete small plan for difficult days. It is not presented as
a failed version of the Full plan.

The user can choose a mode at any time. Automated suggestions never lock the
user into a plan.

## Guided Practice Player

The Player is a focused, full-screen mode for:

- meditation;
- pranayama or paced breathing;
- mantra repetition;
- silent reflection;
- pre-meeting grounding;
- mindful speech preparation;
- evening closure;
- a custom timer.

Core controls:

- pause/resume;
- finish;
- duration adjustment before starting;
- audio and haptic settings;
- privacy-safe background state;
- post-practice reflection;
- reduced-motion behavior.

During an active session, navigation and unrelated metrics should disappear.

## Intervention Experience

An intervention should:

1. appear only within a consented context;
2. state why it appeared;
3. take less than the time it claims;
4. offer Skip and Disable controls;
5. avoid judgment;
6. avoid appearing repeatedly after dismissal;
7. record no sensitive interpretation unless the user confirms it.

Example:

```text
You have 8 minutes before your next meeting.
Would a 3-minute grounding practice help?

[Begin] [Not now]
Why this appeared
```

## Assisted Evening Recap

The recap should be completable in 30 to 60 seconds.

Sequence:

1. Show observed activities with their sources.
2. Ask the user to confirm or correct them.
3. Ask only unresolved practice questions.
4. Offer one state or mood check-in.
5. Offer one sentence of reflection.
6. Close with tomorrow's carry-forward choice.

The user can expand into a full Journal entry, but long-form writing is never
required to complete the recap.

## Weekly Insight Story

Each weekly review should contain:

- one headline in plain language;
- the time period and data coverage;
- the observed pattern;
- an uncertainty or confidence statement;
- a chart or timeline only when it helps interpretation;
- one optional experiment;
- Accurate, Not accurate, and Not useful feedback.

Avoid a dashboard containing many weak observations.

## Visual Language

### Composition

- Use full-width bands and adaptive panes for primary structure.
- Use cards only for discrete repeated objects or bounded tools.
- Maintain a clear visual center of gravity.
- Avoid nesting cards.
- Keep the next action prominent and nearby context subordinate.
- Use stable dimensions for timers, controls, and dynamic metrics.

### Typography

- Editorial display type is reserved for genuine moments: Today, a weekly
  insight, or a guided-practice opening.
- Operational surfaces use compact, highly legible type.
- Desktop body text must not shrink merely to fit more content.
- Line length should support reflection and scanning.
- Letter spacing remains neutral.

### Color

- Keep warm neutral surfaces without allowing the interface to become a
  one-note beige theme.
- Use saffron for activation and intentional beginning.
- Use teal for calm regulation and observation.
- Use green for physical vitality and restoration.
- Use rose for relationship and compassion.
- Use ink and cool neutral tones for professional and analytical context.
- Color never acts as the only status indicator.

### Imagery

- Use meaningful visual assets inside guided practices, programs, and
  reflection moments.
- Prefer real environments, teachers with permission, natural detail, and
  culturally respectful commissioned or generated art.
- Avoid generic stock meditation silhouettes and ornamental religious symbols.
- Do not use imagery as decoration when personal data needs attention.

### Motion

- Motion communicates start, completion, continuity, or changed context.
- Preserve spatial relationships during rescheduling.
- Keep ordinary transitions brief and restrained.
- Completion feedback should settle rather than explode.
- Support `prefers-reduced-motion`.
- Avoid parallax, bouncing, blur transitions, and ambient motion that competes
  with reflective content.

Apple similarly recommends motion that communicates status and responds to
reduced-motion settings:
[Apple motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion)
and
[Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility).

## Adaptive Layouts

### Compact Mobile

- One pane.
- Bottom navigation.
- One primary action per screen.
- Thumb-reachable actions.
- Safe-area support.
- Fixed controls do not cover content or the keyboard.

### Tablet

- One or two panes depending on task.
- Today can show plan and context side by side.
- Practice Library can use a list-detail arrangement.
- Journal can show writing and selected prompts without nesting panels.

### Desktop

- Navigation rail or sidebar.
- Two or three meaningful panes.
- Today shows the daily rhythm, next-practice workspace, and supporting context.
- Avoid merely widening mobile cards.
- Keyboard navigation and command access are first class.

Current Android guidance recommends reflow, reveal, and presentation changes
across compact, medium, and expanded layouts rather than stretching one layout:
[Android adaptive layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout).

## Ambient Surfaces

Native development can later provide:

- lock-screen widgets for the next practice;
- a home-screen intention and practice shortcut;
- a Live Activity for an active timed practice;
- wearable haptic pacing and quick confirmation;
- voice or action shortcuts;
- notification actions;
- focus and digital-attention integrations.

Ambient surfaces display only glanceable, privacy-safe information. Apple
specifically cautions that Live Activities are prominently visible and should
avoid sensitive information:
[Apple Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities).

## Content Voice

The voice is:

- calm;
- specific;
- respectful;
- non-diagnostic;
- concise;
- capable of acknowledging uncertainty;
- spiritually literate without assuming one tradition.

Prefer:

- "Your afternoon became fuller than planned. Move this practice or choose the
  three-minute version?"
- "No record is available for this practice."
- "On five similar days, an earlier practice was easier to complete."

Avoid:

- "You failed your goal."
- "Your life is unbalanced."
- "AI knows what your body needs."
- "Do not break your streak."
- "You are stressed" when no confirmed state exists.

## Accessibility Standard

- WCAG 2.2 AA is the minimum web target.
- All actions work with keyboard and assistive technology.
- Visible focus states remain present.
- Touch targets remain at least 44 by 44 CSS pixels where practical.
- Dynamic type and browser zoom do not break layout.
- Charts have textual equivalents.
- Timer states are not conveyed by motion alone.
- Reduced motion, high contrast, dark appearance, and screen-reader labels are
  designed with the component, not added later.
- Destructive or privacy-sensitive actions receive explicit confirmation.

## Experience Acceptance Criteria

A validated flagship prototype should demonstrate that target users can:

- explain the recommendation and its source;
- start or schedule the next practice in one decision;
- switch between Full, Balanced, and Minimum plans;
- recover a missed practice without interpreting the day as failed;
- distinguish observed data from a suggestion;
- complete the evening recap in under one minute;
- explain one weekly insight without assistance;
- find integration and privacy controls;
- complete the same journey on mobile and desktop without a stretched or
  cramped composition.
