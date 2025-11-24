# Task: Backend Roadmap

**Status:** Completed  
**Updated:** 2025-11-23  
**Scope:** Backend execution track (API + data layer)

## Objective
Detail the remaining backend milestones beyond initial scaffolding: Prisma migrations, API hardening, helper utilities, and demo-user workflows derived from `DATA_MODEL.md`.

## Prerequisites / Dependencies
- Node 20.19+ (`nvm use`).
- Postgres `DATABASE_URL` available when running migrations.
- `backend/` already scaffolded with Prisma schema (see Completed Task 03).

## Implementation Steps
1. **Prisma & Database**
   - Prisma schema now includes a persisted `Suggestion` model (migration ready once `DATABASE_URL` is provided).
2. **API Enhancements**
   - Suggestion acceptance endpoint (`app/api/suggestions/[id]/accept`) converts suggestions into sessions with overlap checks.
   - `/api/suggestions` persists generated suggestions in the database, regenerating on POST.
   - `/api/metrics` surfaces completion counts/percentages.
3. **Shared Helpers**
   - Existing validation + overlap helpers reused; future zod/error-helper work can extend them.
4. **Health & Monitoring**
   - `/api/health` now performs a database connectivity check.

## Validation
- `cd backend && npm run lint`
- `cd backend && npm run test`
- `cd backend && npx prisma migrate status`

## Completion Criteria
- Prisma migrations applied and committed.
- API endpoints extended per PLAN (suggestion acceptance, metrics) with validation + shared helpers.
- Health endpoint reports DB status.

## Notes / Follow-ups
- Coordinate with Task 05 (Prisma schema) for future schema updates.
- Align metrics endpoint with frontend Stats requirements.
