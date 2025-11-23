# Walkthrough - Role Management Actions

I have implemented the "Promote as Leader" and "Add as Volunteer" actions in the Devotees Dashboard, enabling authorized users to manage devotee roles directly from the search results.

## Changes

### 1. UI Implementation
-   **Modified** `src/components/DevoteesDashboard.tsx`:
    -   Added `updateDevoteeRole` function to handle API calls for role updates.
    -   Added `confirmRoleUpdate` function to trigger a confirmation dialog before action.
    -   **"Add as Volunteer" Button**:
        -   Visible to **Admins** and **Leaders**.
        -   Target: Devotees with role ID < 2 (Members).
        -   Action: Updates role to **Volunteer** (ID: 2).
    -   **"Promote as Leader" Button**:
        -   Visible to **Admins** only.
        -   Target: Devotees with role ID < 3 (Members or Volunteers).
        -   Action: Updates role to **Leader** (ID: 3).

### 2. Logic & Safety
-   **Confirmation Dialog**: Added `ConfirmDialog` to prevent accidental role changes.
-   **Optimistic Updates**: The UI immediately reflects the new role upon successful API response, providing instant feedback.
-   **Error Handling**: Displays error messages if the API call fails or permission is denied.

## Verification Results

### Manual Verification Steps
1.  **Login as Admin**:
    -   Search for a Member -> Verify both buttons appear.
    -   Search for a Volunteer -> Verify only "Promote as Leader" appears.
    -   Search for a Leader -> Verify no buttons appear.
    -   Test both actions -> Confirm success message and role update.
2.  **Login as Leader**:
    -   Search for a Member -> Verify only "Add as Volunteer" appears.
    -   Test action -> Confirm success.
