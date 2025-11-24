## Status
- **Status:** Completed
- **Updated:** 2025-11-23
- **Related Docs:** [PRD](../PRD.md), [20-home-header-refresh](../completed/20-home-header-refresh.md)

# Task: Refresh Stats Tab UI & Metrics

## Objective
- Bring the Stats tab up to parity with the redesigned Home screen by adding the PageHeader, Today/Week toggle, richer metric grid, and the shared ProgressOverview component.

## Prerequisites / Dependencies
- Home dashboard refresh complete (toggle + summary cards available for reference).
- `ProgressOverview` component extracted for reuse.
- Backend demo data seeded so both Today and Week scopes surface content.

## Implementation Steps
1. **Header + Scope Toggle**
   - Add `PageHeader` with subtitle + description.
   - Introduce segmented control to switch between Today and Week scopes.
2. **Metric Grid**
   - Compute scoped stats (scheduled, completed, focus hours, average spacing) and render as cards.
3. **Shared ProgressOverview**
   - Create `components/ProgressOverview.tsx` encapsulating bullseye header, stats trio, breakdown bar, and spacing tile.
   - Reuse component on both Home and Stats screens with scope-aware labels.
4. **Data Logic**
   - Derive scope-specific session collections, breakdown by type, and average spacing helper.
   - Ensure pull-to-refresh delegates to `useDataContext.refresh`.
5. **Validation**
   - Run `cd frontend && npm run lint`.
   - Simulator QA for toggle states + layout.

## Validation
- `cd frontend && npm run lint`
- Manual QA verifying metric updates when toggling scopes.

## Completion Criteria
- Stats tab mirrors Home styling (header, toggle, cards, shared progress block).
- Metrics and breakdown respond to Today/Week selection.
- ProgressOverview reused across screens with consistent typography.
- Lint passes.

## Notes / Follow-ups
- Future work: add historical charts once analytics APIs are available.
- Consider persisting last-selected scope between app launches.
