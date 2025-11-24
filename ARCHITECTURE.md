# Smart Session Planner – Architecture Overview

This document is the canonical reference for how the take-home project is structured today. Pair it with `PLAN.md` (operations playbook) and `README.md` (quick start).

---

## 1. Goals & Principles
1. **End-to-end demo:** Deliver the PRD-mandated flow—create session types, define availability, plan sessions, accept smart suggestions, and inspect stats.
2. **Simple setup:** Two packages (`frontend/`, `backend/`) + Docker Postgres (`take-home-postgres`, port 5433) that can be brought up with `make setup`.
3. **Explainable automation:** Suggestions must be reproducible from heuristics (availability + spacing + priority) even when AI blurbs are disabled.
4. **Reviewer-friendly code:** Keep API handlers thin, isolate heuristics in `backend/lib/`, and share UI primitives in `frontend/components/` for easy inspection.

---

## 2. System Topology
```
┌────────────────┐     HTTPS JSON     ┌────────────────┐     Prisma ORM     ┌────────────────┐
│ Expo Frontend  │ ─────────────────▶ │ Next.js API    │ ─────────────────▶ │ Postgres (Docker)
│ (frontend/)    │                    │ (backend/)     │                    │ take-home-postgres
└────────────────┘     Sessions,      └────────────────┘     session types,  └────────────────┘
                      availability,                         sessions, availability,
                      stats, suggestions                    suggestions, metrics
```

- **Frontend:** Expo Router tabs app. `frontend/contexts/data-context.tsx` is the single source of truth for client data + mutations.
- **Backend:** Next.js 16 App Router. REST endpoints live in `backend/app/api/*/route.ts`; business logic in `backend/lib/*`.
- **Database:** PostgreSQL 16 container seeded by `backend/scripts/reset-demo-data.ts`. Prisma schema resides in `backend/prisma/schema.prisma`.

---

## 3. Domain Model (Prisma Snapshot)
| Entity | Key Fields | Notes |
| --- | --- | --- |
| `User` | `id`, `email` | Only one demo user; retrieved/created via `ensureDemoUser()` per request. |
| `SessionType` | `name`, `category`, `priority`, `color`, `icon`, `completedCount` | Category powers grouping on stats/settings; `priority` drives scheduling heuristics. |
| `AvailabilityWindow` | `dayOfWeek`, `startTime`, `endTime` | Recurring weekly windows. Times stored as `HH:mm` strings. |
| `Session` | `sessionTypeId`, `startTime`, `durationMinutes`, `status`, `description`, `completedAt?` | Overlap detection enforces 15-minute buffer. Completed sessions update `completedCount`. |
| `Suggestion` | `sessionTypeId`, `startTime`, `durationMinutes`, `reason`, `description` | Cache of ranked proposals; `description` optionally populated by OpenAI. |

Relationships: `User` ↔ `SessionType`/`Session`/`AvailabilityWindow`/`Suggestion` (1-to-many). `Session` references `SessionType` via foreign key with cascade delete.

---

## 4. Backend Architecture

### 4.1 API Surface
| Route | Methods | Responsibility |
| --- | --- | --- |
| `/api/session-types` | `GET`, `POST` | List/create session types. Validated via `backend/lib/validation.ts`. |
| `/api/session-types/[id]` | `PATCH`, `DELETE` | Update/delete types; maintains `completedCount`. |
| `/api/availability` | `GET`, `PUT` | Replace weekly availability windows in one shot. |
| `/api/sessions` | `GET`, `POST` | List sessions, create with overlap detection (see `backend/lib/overlap.ts`). |
| `/api/sessions/[id]` | `PATCH`, `DELETE` | Update status/description/duration; delete sessions. |
| `/api/suggestions` | `GET`, `POST` | Return cached suggestions or force regeneration. |
| `/api/suggestions/[id]/accept` | `POST` | Convert a suggestion into a session, re-checking conflicts. |
| `/api/metrics` | `GET` | Aggregate completion counts, spacing, per-type breakdowns. |
| `/api/health` | `GET` | Prisma/Postgres heartbeat used by ops scripts and monitors. |

All handlers call `ensureDemoUser()` to scope data, validate inputs, then interact with Prisma. Shared libs include:
- `backend/lib/prisma.ts` – singleton Prisma client.
- `backend/lib/validation.ts` – zod-style guards for payloads.
- `backend/lib/session-icons.ts` – canonical palette shared with the frontend.
- `backend/lib/suggestion-engine.ts` – heuristic scheduler (see Section 5).
- `backend/lib/ai.ts` – optional OpenAI integration for human-readable blurbs.

### 4.2 Scripts
- `scripts/reset-demo-data.ts` – Drops & re-seeds session types, sessions, availability.
- `scripts/refresh-suggestions.ts` – CLI entry point to rebuild suggestion cache (useful after data resets).

---

## 5. Suggestion Engine Lifecycle
1. **Input gathering:** Fetch session types, existing sessions, and availability windows; build lookup tables for last session per type and per-day high-priority load.
2. **Candidate generation:** For each availability window up to `MAX_DAY_LOOKAHEAD` (21 days), compute duration from `PRIORITY_DURATION`, snap to 15-minute increments, skip conflicts, and enforce per-type minimum spacing (`MIN_GAP_HOURS`).
3. **Scoring:** `score = priorityWeight * 2 + spacingBoost + durationBonus - loadPenalty` where load penalty activates for high-priority types when a day is already busy.
4. **Selection:** Sort candidates by score, greedily pick until `targetCount` while re-checking overlaps, spacing, and `MAX_HIGH_PRIORITY_PER_DAY` (2).
5. **Persistence & reasoning:** Store winners in the `Suggestion` table with deterministic reasons (availability window + spacing context). If `OPENAI_API_KEY` is set, `backend/lib/ai.ts` augments them with descriptive copy for the frontend.

The frontend fetches `/api/suggestions`, displays the cached rows, and calls `/api/suggestions/[id]/accept` to materialize one into an actual session.

---

## 6. Frontend Architecture
- **Navigation:** Expo Router tabs in `frontend/app/(tabs)` (`index`, `calendar`, `stats`, `settings`). Modal flows (session sheet, session-type sheet, availability sheet) live in `frontend/components/` and mount via shared BottomSheet primitives.
- **State & data:** `frontend/contexts/data-context.tsx` fetches session types, sessions, availability, suggestions, and metrics on mount using typed service wrappers from `frontend/services/*`. It exposes helper methods (e.g., `createSession`, `completeSession`, `replaceAvailability`, `acceptSuggestion`) that update local state optimistically.
- **UI building blocks:** Card, Chip, ProgressBar, SuggestionCard, SessionModal, SessionTypeSheet, AvailabilitySheet, etc., all live in `frontend/components/` and consume colors/icons defined in `frontend/constants/` (kept in sync with backend palettes).
- **Telemetry & testing:** Frontend tests currently target pure helpers (`frontend/lib/__tests__/time.test.ts`). The app relies on Expo’s Metro dev server for live reload.

---

## 7. Tooling & Developer Workflow
1. **Environment prep** – run `nvm use 20.19.0`; copy env templates (`frontend/.env`, `backend/.env.local`).
2. **Bootstrap** – `make setup` (handles npm install, Docker Postgres start, Prisma generate/migrate, seed data).
3. **Daily loop** – use `make backend` and `make frontend` (or run the npm scripts manually) to start servers.
4. **Validation** – before committing, always run:
   ```bash
   cd backend && npm run lint && npm run test
   cd frontend && npm run lint && npm run test
   ```
5. **Database resets** – `make clean-postgres` to stop/remove the Docker container, then `make setup` or rerun the Docker + Prisma commands outlined in the README.

---

## 8. Non-Goals / Constraints
- Single-user demo only (`DEMO_USER_ID`); authentication or multi-tenant support is intentionally omitted.
- Lists load finite data sets (no infinite scrolling/virtualization) to keep the UI simple for reviewers.
- Prisma migrations are not committed; share schema changes via `prisma/schema.prisma` and describe migration steps in docs/PRs.
- AI integration is optional—everything must continue working with deterministic heuristics alone.

This architecture is intentionally compact so reviewers can understand the entire system in minutes while still demonstrating full-stack competency.
