# Task: Makefile-based local bootstrap

- **Status:** Completed
- **Updated:** 2025-11-24
- **Related:** README onboarding, scripts/setup-dev.ts

## Objective
Provide a top-level Makefile so developers can set up, run, and clean local environments with a single command, including Postgres via Docker, Prisma migrations, and Expo platform launches.

## Prerequisites / Dependencies
- Docker CLI installed (optional if using hosted Postgres, but targets support it).
- Existing backend/frontend npm scripts (`npm run dev`, `npm run start`, `npm run ios`, etc.).
- Seed script (`scripts/reset-demo-data.ts`) available.

## Implementation Steps
1. Added `Makefile` with helper targets to copy env templates, install dependencies, ensure Docker Postgres is running, and execute Prisma generate/migrate/seed.
2. Created user-facing targets: `help`, `setup`, `backend`, `frontend`, `frontend-ios`, and `clean-postgres`.
3. Updated `README.md` with a “Makefile Shortcuts” section describing how to run the new commands alongside the tsx setup script option.

## Validation
- `make setup` (with Docker installed) provisions env files, installs dependencies, starts Postgres, runs Prisma commands, and seeds demo data without errors.
- `make backend` starts the Next.js dev server.
- `make frontend-ios` launches the Expo iOS simulator (requires Xcode). 
- `cd frontend && npm run lint` ensures no lint regressions after README updates.

## Completion Criteria
- Makefile checked into repo with described targets.
- README documents Makefile usage.
- Lint command executed successfully after changes.
