# Task: Smart suggestions card refresh

**Status:** Completed  
**Updated:** 2025-11-23  
**Related:** `docs/design/home_design_001.png`, `frontend/app/(tabs)/index.tsx`, `frontend/app/suggestions.tsx`

## Objective
Align the Smart Suggestions UI across the home dashboard carousel and the dedicated suggestions list with the Figma reference by adding the date label and priority gauge, keeping session cells limited to completion indicators only.

## Prerequisites / Dependencies
- Frontend dependencies installed (`cd frontend && npm install`).
- Active simulator or Expo Go session for visual verification.
- Access to the new priority indicator component (or create one if missing).

## Implementation Steps
1. Extended the session type lookup maps on both screens to expose priority values for each suggestion card.
2. Updated the home dashboard Smart Suggestions carousel with a header row (title + dots), short-date caption, and refined time range while keeping session cells limited to the completion icon.
3. Mirrored the same layout in `app/suggestions.tsx`, introducing the date line, range/duration row, and shared priority gauge component.
4. Tweaked spacing/styles (header row, caption colors) and aligned helper formatters for consistent copy across both screens.
5. Ran `cd frontend && npm run lint` to ensure the TypeScript/ESLint surface stayed clean.

## Validation
- `cd frontend && npm run lint`
- Manual Expo preview: verify both suggestion surfaces match the design (date label, priority gauge, completion icon untouched on session rows).

## Completion Criteria
- Home screen Smart Suggestions cards display the short date, full time range, and priority gauge exactly as specified. ✅
- Suggestions screen cards use the same content hierarchy and spacing, with no extra safe-area padding at the top. ✅
- Session cells continue to show only the completion icon (no gauge), and lint passes with no TypeScript issues. ✅

## Notes / Follow-ups
- If future designs add more metadata (e.g., energy level), consider extracting a `<SuggestionCard />` shared component.
