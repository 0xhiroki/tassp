# Task: Backend API-Only Cleanup

## Objective
Strip the scaffolded Next.js UI and public assets, keeping the backend focused on API routes.

## Steps
1) Remove `backend/public` scaffold assets (next/vercel svgs, favicon).
2) Replace `backend/app/page.tsx` with a minimal API placeholder (no marketing UI).
3) Optionally add `/api/health` stub for uptime checks.

## Completion Criteria
- No unused scaffold UI or public assets remain.
- Root page is minimal and documents API entry points.
