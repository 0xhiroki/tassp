# Task: Home Screen Redesign

**Status:** Completed  
**Updated:** 2025-11-23  
**Scope:** `frontend/app/(tabs)/index.tsx`, shared components/styles, `docs/design/home_design_00{1,2}.png`

## Objective
Refresh the Home screen UI/UX to mirror the new design references (`docs/design/home_design_001.png` and `_002.png`), improving hierarchy, card styling, and interaction affordances while keeping data wiring intact.

## Prerequisites / Dependencies
- Latest backend + frontend data layers already functioning (Tasks 11–14 completed).
- Design assets accessible under `docs/design/` for spacing/color/typography guidance.
- Expo dev server running for rapid preview (`cd frontend && npm run start`).

## Summary of Work
1. Introduced metrics fetching + context wiring so the hero card and progress module show live data.
2. Replaced the legacy layout with the new design: hero summary card, segmented Today/Week control, horizontal suggestion carousel (Accept/Adjust), pill-style session rows, and progress card inspired by the reference.
3. Enhanced the session modal to accept pre-filled defaults, enabling “Adjust” flows straight from suggestions.
4. Cleaned up spacing, typography, and buttons to match the provided mocks, including hiding scroll indicators and consolidating CTAs.

## Validation
- `cd frontend && npm run lint`
- Manual verification on simulator/device: hero card renders, suggestions horizontally scrollable (per design), sessions list matches style, modal triggers still work.

## Completion Criteria
- Home screen matches the new references with hero card, suggestion carousel, refreshed session list, and progress module. ✅
- Interactions (refresh, accept/adjust suggestions, mark complete, edit/create) continue to work with the new UI. ✅
- Validation (`npm run lint`) completed. ✅

## Notes / Follow-ups
- Consider promoting the hero/suggestion card styles into shared components for reuse on other tabs.
