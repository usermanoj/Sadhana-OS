# AGENTS.md

## Project
Sadhana OS is a premium spiritual wellness habit tracker based on SMART principles, Yoga, speech discipline, senses control, physical health, mental health, family, society, and professional life.

## Source of Truth
- Product requirements live in docs/.
- Implementation tasks live in tasks/.
- Work one task at a time.
- Do not implement future tasks unless explicitly asked.

## Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Vitest
- Playwright
- localStorage for MVP persistence

## Development Rules
- Preserve history.
- Prefer archive/restore over hard delete.
- Every configuration change must create audit log entry.
- Mobile-first UI is mandatory.
- UI must feel calm, premium, spiritual, and uncluttered.
- Do not add production dependencies without explaining why.

## Testing Rules
- Use TDD where practical.
- Add or update tests with each feature.
- Run typecheck, unit tests, and build before marking complete.
- Do not mark task complete if tests fail.

## Review Rules
- Summarize changed files.
- Mention tests run.
- Mention limitations honestly.
- Keep changes scoped to the current task.