## Status
- **Status:** Completed
- **Updated:** 2025-11-23
- **Related Docs:** [PRD](../PRD.md), [20-home-header-refresh](../completed/20-home-header-refresh.md)

# Task: Align Calendar tab UI with Home

## Objective
- Match the Calendar tab’s visual language to the refreshed Home screen, reusing the same session cell component, section labels, and typography (including a top-level “Calendar” title).

## Prerequisites / Dependencies
- Home tab refresh complete (see doc above).
- Frontend dev server available for visual QA.
- Shared `SessionModal` no longer supports editing, so Calendar should be read-only.

## Implementation Steps
1. **Layout & Title**
   - Add a “Calendar” page title + subtitle mirroring the Home header spacing.
   - Ensure safe-area padding matches Home.
2. **Section Labels**
   - Reuse the date label style from Home (blue-gray text, uppercase spacing) for SectionList headers.
3. **Session Cells**
   - Extract or reuse Home’s `renderSessionCard` styles for each entry in Calendar, showing description when available.
   - Remove tap-to-edit affordances since sessions aren’t manually editable.
4. **Styling Cleanup**
   - Update Calendar styles to share typography palette (colors, shadows) with Home.
5. **Validation**
   - Run `cd frontend && npm run lint`.
   - Simulator QA to confirm consistent appearance and proper spacing.

## Validation
- `cd frontend && npm run lint`
- Visual check comparing Calendar vs Home.

## Completion Criteria
- Calendar tab header matches Home style, using same section labels + cards.
- No edit modal remains; list purely informational.
- Lint passes and doc moved to `docs/completed/` post-validation.

## Notes / Follow-ups
- Consider future enhancement to add filters (e.g., by session type) once design provided.
- Calendar intentionally loads the full schedule at once; infinite scroll is out of scope for now.
