## Status
- **Status:** Completed
- **Updated:** 2025-11-24
- **Related Docs:** [PRD](../PRD.md), [22-shared-page-header](../completed/22-shared-page-header.md)

# Task: Refresh Settings Tab Layout

## Objective
- Align the Settings screen with the rest of the app by adding the shared `PageHeader`, consistent section headers with circular add buttons, clearer creation affordances for session types/availability, and (as a follow-up) migrate creation flows into the shared bottom sheet.

## Prerequisites / Dependencies
- Home tab styling complete (reuse section header styles + add button treatment).
- Session type modal + availability CRUD already implemented via `data-context` hooks.

## Implementation Steps
1. Added `PageHeader` and standardized section header rows with circular add buttons.
2. Replaced inline add/edit UIs with new `SessionTypeSheet` and `AvailabilitySheet` components built on the shared BottomSheet for consistent UX.
3. Ensured availability list/form state updates via `replaceAvailability`, and session type creation still flows through `addSessionType`.
4. Synced styling (typography, cards, borders) with Home/Stats screens.
5. Validated via `cd frontend && npm run lint` plus simulator smoke test for add/delete flows.

## Validation
- `cd frontend && npm run lint`
- Manual QA: add/delete a session type and availability window via the new buttons.

## Completion Criteria
- Settings tab displays `PageHeader` and two section headers (“Session Types”, “Availability”) with plus buttons mirroring Home styling.
- Session type modal still works via the new button.
- Availability creation gated behind the plus button, and the inline form hides when not in use.
- Lint passes.

## Notes / Follow-ups
- Future: consider editing/deleting availability via dedicated sheets (currently add/remove only).
