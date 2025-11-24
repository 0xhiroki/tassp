# Smart Session Planner

Smart Session Planner take-home: Expo frontend, Next.js + Prisma backend, and supporting docs/scripts.

---

## 1. Repository Layout
| Path | What lives here |
| --- | --- |
| `frontend/` | Expo Router tabs app (screens, shared components, contexts, services, constants). |
| `backend/` | Next.js 16 API routes, Prisma schema, suggestion engine, scripts. |
| `docs/` | PRD + task docs (see `docs/DOC_TEMPLATE.md`). |
| `PLAN.md` | Current architecture & operations playbook. |
| `AGENTS.md` | Instructions for AI coding agents (tooling rules, workflow, validation requirements). |
| `.factory/` | Factory/Droid automation configs, cached specs, and artifacts (leave untouched). |
| `ARCHITECTURE.md` | Detailed system diagram, API surface, and domain model reference. |

---

## 2. Quick Start
1. **Prerequisites**
   - Install Node `20.19.0` (`nvm use 20.19.0`).
   - Install Docker Desktop (or have a Postgres 14+/compatible instance ready).
2. **One-command setup**
   ```bash
   make setup
   ```
   Does: copy env templates, install dependencies (frontend + backend), launch `take-home-postgres` container, run Prisma generate/migrate, seed demo data.
3. **Start dev servers**
   ```bash
   make backend      # Next.js API + Prisma
   make frontend     # Expo dev server (Metro / QR)
   make frontend-ios # Shortcut to Expo iOS simulator
   ```

---

## 3. Environment Variables
| Location | Key | Default / Purpose |
| --- | --- | --- |
| `frontend/.env` | `EXPO_PUBLIC_API_URL` | `http://localhost:3000/api` (points Expo app at backend). |
| `backend/.env.local` | `DATABASE_URL` | Postgres connection string targeting your local instance (see Prisma docs). |
|  | `OPENAI_API_KEY` | Optional – enables AI-written suggestion blurbs. Add it to `backend/.env.local` (and `backend/.env` if you also run Dockerized scripts); deterministic reasons work without it. |

---

## 4. Local Database (Docker + Prisma)
```bash
docker run --name take-home-postgres \
  -e POSTGRES_USER=<user> \
  -e POSTGRES_PASSWORD=<password> \
  -e POSTGRES_DB=<database> \
  -p 5433:5432 -d postgres:16

cd backend
npx prisma migrate dev --name init   # once
npm run seed                         # demo data
npm run refresh:suggestions          # optional refresher
npx prisma studio                    # optional browser GUI
```
Use `make clean-postgres` (or `docker stop take-home-postgres && docker rm take-home-postgres`) to reset.

---

## 5. Useful Commands
| Area | Command |
| --- | --- |
| Frontend dev | `cd frontend && npm run start`
| Frontend lint/tests | `cd frontend && npm run lint && npm run test`
| Backend dev | `cd backend && npm run dev`
| Backend lint/tests | `cd backend && npm run lint && npm run test`
| Backend seed/suggestions | `cd backend && npm run seed && npm run refresh:suggestions`
| Prisma helpers | `npm run db:generate`, `npm run db:migrate`, `npm run db:deploy`, `npm run db:studio`
| Makefile shortcuts | `make setup`, `make backend`, `make frontend`, `make frontend-ios`, `make clean-postgres`

---

## 6. Suggestion Algorithm Snapshot

`backend/lib/suggestion-engine.ts` plans future sessions in four passes:
1. **Normalize inputs** – sort session types by priority, bucket availability by weekday, seed last-session per type + high-priority counters.
2. **Generate candidates** – iterate next 21 days, size slots via `PRIORITY_DURATION`, round to 15-minute increments, and discard overlaps or spacing violations.
3. **Score & select** – score = `priorityWeight * 2 + spacingBoost + durationBonus - loadPenalty`; greedily pick the top slots while re-checking per-type spacing, capping high-priority blocks (≤2/day), and preventing overlaps.
4. **Explain** – persist selected candidates for `/api/suggestions` with a deterministic reason string (availability window, balance note, spacing hours). `backend/lib/ai.ts` may add an optional OpenAI-generated blurb.

---

## 7. Assumptions & Limitations
- **Single demo user:** API routes force `DEMO_USER_ID`; multi-user/login flows are out of scope.
- **Postgres backed:** Prisma + suggestion engine require a running Postgres DB (default Docker recipe above).
- **Suggestion-first flow:** Manual sessions exist but the intended flow is: request suggestions → accept into the schedule; constraints (availability, 15‑minute buffers) apply in both paths.
- **Optional AI:** Without `OPENAI_API_KEY`, you still get deterministic scheduling reasons; the AI description is additive only.
- **No infinite scrolling:** Lists (sessions, suggestions, stats) load the current dataset in one shot; virtualized/infinite loading is intentionally out of scope for this take-home.
- **Availability deletes are destructive:** Removing an availability window automatically deletes any sessions scheduled during that weekly slot.
- **Session type deletes cascade:** Removing a session type also deletes its associated sessions and suggestions.

Need the full system breakdown? See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for diagrams, API tables, domain model details, and workflow notes—review [`AGENTS.md`](./AGENTS.md) for the AI-agent playbook—and leave the [`./.factory`](./.factory) directory intact so Droid/Factory keeps its cached specs, automation configs, and skill definitions (see `.factory/skills/*/SKILL.md` for available skills such as `doc-writer`).
