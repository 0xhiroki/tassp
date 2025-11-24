## Status
- **Status:** Completed
- **Updated:** 2025-11-23
- **Related Docs:** [PRD](../PRD.md), [Data Model](../DATA_MODEL.md)

# Task: Enforce AI-driven session scheduling

## Objective
- Lock the session lifecycle so users only manage session types while AI suggestions remain the sole entry point for new sessions. Users may adjust suggestion descriptions via a constrained sheet but cannot touch timing.

## Prerequisites / Dependencies
- Backend + frontend dev env set up per [AGENTS](../AGENTS.md).
- Demo data + Prisma schema synced (`npm install`, `npm run dev` per package).
- Coordination with UX so CTA copy aligns with the new Adjust-only workflow.

## Implementation Steps
1. **Schema + Data Model**
   - Added optional `description` field to `Session` + `Suggestion` models; regenerated Prisma client.
   - Updated `docs/DATA_MODEL.md` Mermaid diagram to highlight suggestion-sourced sessions + description attribute.
2. **Backend APIs**
   - Disabled `POST /api/sessions`; manual creation now returns a descriptive 400.
   - Limited `PATCH /api/sessions/:id` to `{ description, completedAt }` edits.
   - Extended suggestion acceptance endpoint to accept an optional description payload and applied it to the created session.
   - Updated `app/api/sessions/route.test.ts` to cover the new rejection behavior.
3. **Frontend Data Layer & UI**
   - Updated `Session` types/services/context to remove manual session CRUD and support description display.
   - Replaced “Plan new session” affordances with suggestion-entry CTAs, surfaced descriptions in cards/calendar, and converted `SessionModal` into a description-only Adjust sheet reused by Home + Suggestions screens.
4. **Validation**
   - Backend: `cd backend && npm run lint && npm run test`.
   - Frontend: `cd frontend && npm run lint`.

## Validation
- `cd backend && npm run lint`
- `cd backend && npm run test`
- `cd frontend && npm run lint`
- Manual QA: Adjust sheet locks timing, accepts description, and Accept flows respect overrides while manual session creation UI is removed.

## Completion Criteria
- Session creation blocked outside suggestion acceptance.
- Description edits propagate end-to-end.
- Updated data model diagram merged.
- Task doc moved to `docs/completed/` with validation evidence.

## Notes / Follow-ups
- Future work: add AI prompt to help users request new suggestion batches if none fit.
