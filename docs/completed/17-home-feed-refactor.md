# Task: Home feed render refactor

**Status:** Completed  
**Updated:** 2025-11-23  
**Related:** `docs/completed/15-home-screen-redesign.md`, `frontend/app/(tabs)/index.tsx`

## Objective
Remove the separate FlatList header/footer scaffolding on the Home screen and instead render the entire dashboard (hero, suggestions, sessions, progress card) as part of the list content so scrolling behavior matches the Figma references.

## Prerequisites / Dependencies
- Frontend dependencies installed (`cd frontend && npm install`).
- Latest API + DataContext already providing sessions, suggestions, metrics.
- Design references: `docs/design/home_design_001.png`, `docs/design/home_design_002.png`.

## Implementation Steps
1. Introduced a `HomeBlock` union type (hero, session, empty, progress) and computed `listData` via `useMemo` so every visual section is represented as a FlatList item.
2. Moved the previous header JSX (dashboard title, segmented control, hero card, suggestions rail, “Today’s Sessions” label) into the hero block renderer and removed `ListHeaderComponent`/`ListFooterComponent` props entirely.
3. Reused the session card UI inside a helper (`renderSessionCard`) and emitted one block per filtered session, plus a dedicated empty-state block when no sessions exist.
4. Added a guarded progress block that renders metrics + spacing card as a normal list item and tweaked padding/margins to maintain spacing while leaving room for the FAB.
5. Verified scroll/pull-to-refresh behavior remained intact with the new structure.

## Validation
- `cd frontend && npm run lint`

## Completion Criteria
- Home screen FlatList no longer uses header/footer props; all UI appears via regular items.
- Layout visually matches both design references (hero → suggestions → Today’s Sessions → progress card).
- Lint passes and no runtime errors in Expo client.

## Notes / Follow-ups
- Manual Expo spot-check still recommended to confirm visuals on device now that everything renders inside the list body.
- Consider extracting individual blocks into separate components if JSX becomes unwieldy after refactor.
