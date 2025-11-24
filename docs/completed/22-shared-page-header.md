## Status
- **Status:** Completed
- **Updated:** 2025-11-23
- **Related Docs:** [20-home-header-refresh](../completed/20-home-header-refresh.md), [21-calendar-refresh](./21-calendar-refresh.md)

# Task: Extract shared page header component

## Objective
- Create a reusable header component (title + optional subtitle/controls) that matches the Home tab styling and apply it to Home and Calendar for consistent look/feel.

## Prerequisites / Dependencies
- Home + Calendar refreshes completed.
- Component library structure (`frontend/components/`) ready for new shared UI.

## Implementation Steps
1. **Component Creation**
   - Added `frontend/components/PageHeader.tsx` supporting `title`, optional `subtitle`, and child controls with standardized padding/margins matching the Home design.
2. **Home Tab Integration**
   - Replaced inline header JSX in `app/(tabs)/index.tsx` with `PageHeader`, passing the Today/Week segmented control as children.
   - Ensured summary card and subsequent sections follow the header spacing.
3. **Calendar Tab Integration**
   - Replaced its ad-hoc header with the shared component, so the tab mirrors Home’s typography and spacing while remaining minimal (just the title).
4. **Styling Cleanup**
   - Removed redundant header styles from both tabs and reused shared session list item component for consistent visuals.
5. **Validation**
   - `cd frontend && npm run lint`.
   - iOS simulator spot-check to confirm both tabs now share the same header look.

## Validation
- `cd frontend && npm run lint`
- Manual visual QA: Home + Calendar headers align.

## Completion Criteria
- Home and Calendar depend on `PageHeader`; duplicated styles removed.
- Lint passes.
- Planned doc moved to completed.

## Notes / Follow-ups
- When Stats/Settings adopt similar hero blocks, wire them into `PageHeader` for consistency.
