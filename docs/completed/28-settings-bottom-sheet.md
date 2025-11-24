# Task: Settings bottom sheet reuse

- **Status:** Completed
- **Updated:** 2025-11-24
- **Related:** Settings page refresh (25), shared BottomSheet component

## Objective
Align the Settings tab with the rest of the app by replacing the bespoke modal + inline availability form with the shared bottom sheet UI for adding session types and availability windows.

## Prerequisites / Dependencies
- BottomSheet component + gesture handler stack already wired (used by manual session flows).
- Existing `addSessionType` and `replaceAvailability` mutations exposed via `useDataContext`.
- Session icon/color constants for sheet UI.

## Implementation Steps
1. Created `SessionTypeSheet` and `AvailabilitySheet` components wrapping form inputs inside the shared BottomSheet, including validation/error states.
2. Refactored `app/(tabs)/settings.tsx` to open these sheets from the plus buttons and removed the old react-native `Modal` + inline form code.
3. Added edit mode to both sheets so tapping existing cells pre-fills data and exposes delete actions, allowing inline “Delete” links to be removed from list cells.
4. Ensured sheet submissions call the existing data actions, reset local state, and close upon success.
5. Added newline fix for `expo-env.d.ts` per lint warning.
6. Ran `cd frontend && npm run lint` to confirm everything passes.

## Validation
- `cd frontend && npm run lint`
- Manual verification: opening the session type/availability sheets, submitting valid data, and seeing lists refresh.

## Completion Criteria
- Both add flows now rely on the shared BottomSheet UI.
- Legacy modal/inline forms removed from Settings screen.
- Validators run cleanly.
