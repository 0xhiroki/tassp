# Task: Backend API Routes

## Objective
Implement App Router endpoints for session types, sessions (with overlap checks), availability, and suggestions.

## Steps
1) Create shared libs: Prisma client, error handler for Prisma codes, validation helpers, scheduling util.
2) Routes:
   - `api/session-types`: GET, POST, PATCH, DELETE; validate color hex; scope to demo user.
   - `api/sessions`: GET (filters), POST, PATCH, DELETE; detect overlaps; allow accept suggestion to create session.
   - `api/availability`: GET, PUT to replace windows for user.
   - `api/suggestions`: GET/POST placeholder returning generated suggestions from backend scheduling helper.
3) Add request schema validation (zod or manual) for payloads.
4) Add integration tests for sessions overlap and happy path.

## Completion Criteria
- All routes present and wired to Prisma.
- Overlap detection enforced on create/update.
- Basic tests in place under `backend/`.
