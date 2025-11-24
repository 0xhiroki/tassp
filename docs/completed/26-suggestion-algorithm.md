# Task: Document Smart Suggestion Algorithm

- **Status:** Completed
- **Updated:** 2025-11-24
- **Related:** `backend/lib/suggestion-engine.ts`, `backend/app/api/suggestions/route.ts`, `docs/PRD.md`

## Objective
Describe the non-trivial scheduling/suggestion algorithm powering `/api/suggestions` so future contributors understand the heuristics for availability, priorities, and fatigue spacing.

## Prerequisites / Dependencies
- Backend stack set up per `AGENTS.md` (Node 20, Next.js API).
- Prisma schema with `SessionType`, `AvailabilityWindow`, `Session`, and `Suggestion` models.
- Demo data or real user data loaded so the algorithm has session types, availability, and existing sessions to evaluate.

## Implementation Steps
1. **Candidate generation**
   - Load session types, availability windows, and existing sessions for the user.
   - Group availability by weekday and scan up to `maxDayLookahead` days ahead.
   - Within each window, propose slots starting at the window start (rounded) and skip those in the past.
2. **Dynamic duration & spacing**
   - Map priorities (1–5) to preferred durations (30–90 min) and clamp to the available window while rounding to 15-minute increments.
   - Track the latest session timestamp per session type; enforce minimum spacing gaps (8–30 hours based on priority).
3. **Fatigue heuristic**
   - Count existing high-priority (priority ≥4) sessions per day and cap new high-priority suggestions at two per day.
4. **Scoring**
   - Score candidates with: `priorityWeight * 2 + spacingBoost + durationBonus - loadPenalty`.
   - `spacingBoost` rewards large gaps, `durationBonus` rewards ≥75-minute blocks, `loadPenalty` discourages stacking high-priority slots when the day is already heavy.
5. **Selection & persistence**
   - Sort candidates by score and greedily pick until `targetCount`, rechecking spacing, overlap, and daily high-priority caps against the evolving plan.
   - Persist suggestions and generate AI-authored descriptions highlighting availability fit, balance, and spacing rationale.

## Validation
- `cd backend && npm run test` (ensures `lib/suggestion-engine.test.ts` passes with spacing, duration, and high-priority balancing cases).
- `cd backend && npm run lint`.

## Completion Criteria
- Document captures candidate generation, duration logic, spacing heuristics, high-priority caps, scoring formula, and selection flow.
- Validation commands above run successfully at least once after changes.

## Notes / Follow-ups
- Future iterations could incorporate user-configurable durations per session type and fairness toward low-priority types when high-priority windows dominate.
