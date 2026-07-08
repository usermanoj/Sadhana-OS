# Premium Journal Reflection Experience

Task 046 upgrades Journal from a plain form into a guided reflection space.

## What Changed

- Added a premium hero that frames journaling as calm daily reflection.
- Added reflection metrics for section depth, word count, and saved history count.
- Added a deterministic date-based prompt so each day has a gentle starting point.
- Redesigned the editor into guided cards for mood, gratitude, insight, lesson, triggers, and free-form notes.
- Preserved existing autosave behavior, including debounce and blur-save.
- Added save helper copy that distinguishes local-only, cloud-ready, syncing, and cloud-attention states.
- Polished recent journal history with accessible date actions and section counts.

## Data And Privacy

The task does not change the journal data model. Existing fields remain:

- `mood`
- `gratitude`
- `spiritualInsight`
- `triggerObserved`
- `lessonLearned`
- `content`

Journal content remains private app data. It is saved through the existing repository layer and is exported only through the existing user-controlled export flow.

## Validation

The implementation should continue to pass:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`
