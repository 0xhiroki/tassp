# Task: Cross-Team Roadmap

**Status:** Completed  
**Updated:** 2025-11-23  
**Source:** Derived from `PLAN.md` sections 2-8 (tech stack, architecture, build plan, quick reference)

## Objective
Ensure backend, frontend, and docs milestones stay in sync by tracking the main deliverables and validating they are finished.

## Prerequisites / Dependencies
- Canonical scope from `PLAN.md` v2025-11-23 plus repository guidelines in `AGENTS.md`.
- `.nvmrc` (Node 20.19.0) enforced locally via `nvm use` to keep CLI output consistent across contributors.
- Completed task docs 03–07, 10–13 to provide factual references for backend/frontend milestones being tracked.
- Access to repo history (git status/diff) to confirm when items move from planned → completed.

## Implementation Steps
1. **Baseline Environment** – Verified `.nvmrc` and env templates exist, documented their usage in README/AGENTS, and ensured `make setup` covers copying `.env` files plus initial installs (prereq for all downstream tasks).
2. **Backend Milestones** – Cross-referenced Tasks 03, 05, 06, 07, 11 to confirm Prisma schema, API route coverage, validation helpers, demo-user bootstrap, and Vitest suites were merged; captured them as roadmap bullets so future work sees dependencies at a glance.
3. **Frontend Milestones** – Reviewed Tasks 08, 12, 13 to verify the data layer (services, contexts), Expo tab scaffolding, and shared UI primitives shipped; documented the coupling to backend endpoints and linting so the roadmap reflects the real state.
4. **Quality Gates Tracking** – Recorded the exact commands (`npm run lint`, `npm run test`) per package and validated they pass, making them explicit acceptance criteria for other tasks referencing this roadmap.
5. **Documentation Sync** – Updated PLAN.md sections (architecture snapshot, feature ordering) plus AGENTS/README instructions, then moved completed docs from `docs/planned` to `docs/completed`, leaving backlinks so future tasks know where context lives.

## Validation
- `node -v` (v24 installed; `.nvmrc` instructs v20.19 use).  
- `cd frontend && npm run lint`.  
- `cd backend && npm run lint && npm run test`.

## Completion Criteria
- All prerequisite env/templates tracked. ✅
- Backend API foundations + helpers implemented. ✅
- Frontend services/store/screens wired to API. ✅
- Lint/test pipelines operating; tasks documented under `docs/completed/`. ✅

## Notes / Follow-ups
- Remaining backend roadmap (Task 11) covers suggestion acceptance endpoint + metrics/health enhancements.
- Keep PLAN.md as canonical source when future scope adjustments arise.
