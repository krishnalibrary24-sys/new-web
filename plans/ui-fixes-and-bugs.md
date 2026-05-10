# Implementation Plan: UI Enhancements & Bug Fixes

## Objective
Address the reported UI spacing issues, update specific text and statistics on the landing page, fix the scrolling issue in the admin panel, and resolve the enquiry submission bug.

## Key Files & Context
- `app/dashboard/layout.tsx`: Contains the admin panel layout where scrolling is currently disabled by Lenis.
- `app/page.tsx`: Contains the landing page sections, the statistics blocks, the "Inside the Zen" text, and the enquiry submission logic.

## Implementation Steps

### 1. Fix Admin Panel Scrolling
- Add the `data-lenis-prevent` attribute to the scrollable `<main>` and `<nav>` containers in `app/dashboard/layout.tsx`. This allows the native scroll to bypass Lenis' smooth scroll override, restoring full functionality to the admin and office panels.

### 2. Reduce Section Spacing & Remove Hard Breakers
- In `app/page.tsx`, locate the sections with excessive padding (`py-48`, `py-32`).
- Reduce these paddings to `py-16` or `py-20` to tighten the layout.
- Ensure the `section-mask-bottom` and global background gradients are cohesive, avoiding any abrupt color changes between the Branches, Gallery, Membership, and Enquiry sections.

### 3. Update Text and Statistics
- **Text Replacement:** Change `Inside the Zen.` to `The Intellectual Sanctuary.` in the Gallery section of `app/page.tsx`.
- **Stat Replacement:** Change the `Hours of Productivity` (12450) stat block to `Quiet Study Zones` with a static value of `2`.

### 4. Resolve Enquiry Submission Bug
- In `app/page.tsx`, update the `handleEnquirySubmit` function.
- Remove the manual insertion of `created_at: new Date().toISOString()`. Supabase handles timestamps automatically, and manually passing an ISO string can cause type mismatch errors.
- Enhance error handling to capture and display the specific Supabase error message in the UI (e.g., if the table is actually named `enquiries` instead of `leads` or if RLS policies are blocking the insert).

## Verification & Testing
- Visit the dashboard (`/dashboard`) and ensure the sidebar and main content scroll naturally.
- Inspect the landing page (`/`) to verify the reduced spacing and seamless transitions between the Branches and Gallery sections.
- Confirm that the Gallery section reads "The Intellectual Sanctuary." and the stats show "Quiet Study Zones: 2".
- Submit a test enquiry on the landing page and verify it appears in the Admin Panel under the Enquiries tab.