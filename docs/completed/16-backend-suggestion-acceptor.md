# Task: Backend Suggestion Acceptor Fix

**Status:** Planned  
**Updated:** 2025-11-23  
**Scope:** `backend/app/api/suggestions/[id]/accept/route.ts`

## Objective
Resolve the runtime error thrown by Next.js App Router when hitting `POST /api/suggestions/[id]/accept` by awaiting the `params` promise before accessing `id`, ensuring the handler works with the latest Next.js 16 conventions.

## Prerequisites / Dependencies
- Backend dev server running (`cd backend && npm run dev`).
- Existing suggestion endpoints + Prisma schema already in place.
- Familiarity with Next.js App Router dynamic route params and TypeScript `RouteHandler` signatures.

## Implementation Steps
1. Update `app/api/suggestions/[id]/accept/route.ts` so the handler signature awaits `params` (e.g., `const { id } = await params`).
2. Ensure TypeScript types reflect the async signature (use `Promise<{ id: string }>` if needed) per Next.js 16 docs.
3. Add defensive handling when `id` is missing (return 400) before querying Prisma.
4. Verify the accepting flow still ensures demo user seeding and overlap checks.

## Validation
- `cd backend && npm run lint`
- `cd backend && npm run test`
- Manual POST to `/api/suggestions/:id/accept` (e.g., via `curl`) returns 200 with session payload when suggestion exists.

## Completion Criteria
- No more `params is a Promise` runtime errors when accepting suggestions.
- Endpoint gracefully handles missing/invalid IDs.
- Validation commands pass.

## Notes / Follow-ups
- Consider adding integration tests for suggestion acceptance once Prisma test harness is expanded.
