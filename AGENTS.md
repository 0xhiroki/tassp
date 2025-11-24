# Repository Guidelines

The Smart Session Planner monorepo has two independently managed packages (`frontend/`, `backend/`) plus shared documentation under `docs/`. Use this guide whenever you touch the repo.

---

## 1. Structure & Ownership
- `frontend/`: Expo Router tabs app (screens in `app/(tabs)`, shared UI in `components/`, business helpers in `contexts/` + `services/`, constants in `constants/`).
- `backend/`: Next.js 16 App Router project exposing REST endpoints under `app/api/*`, Prisma schema in `prisma/schema.prisma`, scheduling logic in `lib/`, and utility scripts in `scripts/`.
- `docs/`: PRD, task docs (follow `docs/DOC_TEMPLATE.md`), architecture notes (`PLAN.md`, `ARCHITECTURE.md`).
- Root intentionally has no package.json—treat each package separately and lean on the Makefile for orchestration.

---

## 2. Tooling & Runtime Requirements
- Node **20.19.0** (`nvm use 20.19.0`). Do not install or build with other Node versions.
- Postgres 14+; default workflow uses Docker (`take-home-postgres` exposing port 5433). See README/Makefile for commands.
- pnpm/yarn are **not** used; stick with npm.
- Environment files are per package (`frontend/.env`, `backend/.env.local`). Copy from the provided `*.example` templates before running anything.

---

## 3. Core Commands (per package)
| Goal | Command |
| --- | --- |
| Install deps | `cd frontend && npm install`; `cd backend && npm install` |
| Start dev servers | `cd frontend && npm run start`; `cd backend && npm run dev` |
| Lint | `cd frontend && npm run lint`; `cd backend && npm run lint` |
| Tests | `cd frontend && npm run test` (Vitest); `cd backend && npm run test` (Vitest) |
| Seeds / suggestion refresh | `cd backend && npm run seed`; `cd backend && npm run refresh:suggestions` |
| Prisma helpers | `npm run db:generate`, `npm run db:migrate`, `npm run db:deploy`, `npm run db:studio` |
| Make targets | `make setup`, `make backend`, `make frontend`, `make frontend-ios`, `make clean-postgres` |

Always run the Makefile target from repo root; it handles env copying, Docker startup, and Prisma tasks in the proper order.

---

## 4. Coding Style & Conventions
- TypeScript everywhere with **2-space indentation**. Keep imports sorted (framework → modules → local aliases).
- Components/screens use `PascalCase`; hooks/utilities use `camelCase`.
- Keep UI-only code in `frontend/components/`; shared client logic belongs in `frontend/contexts` or `frontend/services`. On the backend prefer `backend/lib` for domain helpers and keep API handlers thin.
- Path alias `@/*` is configured in both packages—use it instead of deep relative imports.
- Avoid excessive inline comments; document behavior in code only when non-obvious.

---

## 5. Testing & Validation Policy
- **Mandatory before every commit/PR:**
  - `cd backend && npm run lint && npm run test`
  - `cd frontend && npm run lint && npm run test`
- Backend Vitest suites cover API routes (`app/api/**/route.test.ts`) plus scheduling helpers (`lib/suggestion-engine.test.ts`). Update or add tests when touching logic.
- Frontend Vitest currently focuses on time/scheduling helpers; add more coverage as UI state grows.
- CI isn’t configured, so local validation is the gatekeeper—never skip it unless the task owner explicitly waives it.

---

## 6. Git Workflow
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) with ≤72 char subjects; add optional scopes (`feat(frontend): …`).
- Stage only relevant files; keep Prisma migrations out of git (directory is ignored on purpose) and never commit `.env*` files.
- Pull requests should include: scope description, linked task doc, commands/tests executed, and screenshots/screencasts for UI work.
- Always update `PLAN.md`, `README.md`, or related docs when architecture, commands, or flows change.

---

## 7. Security & Configuration
- Secrets live only in local env files. Examples: `frontend/.env.example` (Exposed API URL), `backend/.env.local.example` (`DATABASE_URL`, `OPENAI_API_KEY`). Never hardcode credentials.
- Rotate any leaked keys immediately and scrub them from history before sharing the repo.
- Prisma migrations are generated locally but **not** committed; share schema changes via `prisma/schema.prisma` and describe migration steps in docs/PRs.
- Be aware that database connection strings in docs must use placeholders (`<user>:<password>`), not real credentials.

---

## 8. Documentation Expectations
- For every notable task, create/update docs using `docs/DOC_TEMPLATE.md`. Move files from `docs/planned/` to `docs/completed/` once validation passes.
- Keep `PLAN.md`, `README.md`, and `ARCHITECTURE.md` current—they are the reviewer-facing artifacts.
- When updating architecture or flows, mention the change in the PR description and ensure instructions remain consistent across docs.

Stay within these guidelines to keep the take-home reviewable, reproducible, and secure.
