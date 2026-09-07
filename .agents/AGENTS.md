# Project Rules & Learned Knowledge for emuList-M-S-G

This file contains repository-specific guidelines, architecture constraints, and learned lessons from past user interactions. Always consult these rules when developing features or fixing bugs in this repository.

---

## 1. External Data Resilience & Fallbacks
- **ICS Calendar Feeds (Galatasaray Fixture)**:
  - External CORS proxies (e.g., `allorigins.win`, `corsproxy.io`) are inherently unreliable or may block requests in browser environments.
  - ALWAYS maintain a local static fallback (e.g., `/gs_fallback.ics` in the `public/` directory) at the end of the proxy chain in `galatasarayService.ts`.
  - NEVER leave external data fetches without a local fallback that guarantees 100% availability for the user interface.

## 2. API Selection & Search Logic
- **Strict Media API Search**:
  - When the user selects an API (OMDb vs TMDb), respect their choice strictly.
  - DO NOT silently fall back to another API if no results are found. Respect user preference and report "no results" accurately for the active API.

## 3. Responsive Layout & Z-Index Layering
- **Mobile Bottom Navigation (`BottomNavBar`)**:
  - `BottomNavBar` sits fixed at `bottom-0` with `z-[100]` and height ~72px on mobile devices (`md:hidden`).
  - Floating action bars (such as the bottom save bar on `CreatePage`) MUST use `z-[110]` and `bottom-24 md:bottom-6` so they float safely above `BottomNavBar` on mobile without overlapping or getting hidden underneath.
- **Search Dropdowns & Overlays**:
  - Auto-complete search result dropdowns must specify `z-50` or higher and ensure parent containers do not truncate them with `overflow-hidden`.

## 4. Modal Design & Mobile Adaptability (MANDATORY STANDARD)
- **Unified Modal Architecture**:
  - All modal dialogs (Add/Edit forms, settings, selection sheets, detail views) MUST follow the standardized modal pattern:
    1. **Container & Backdrop**: Darkened backdrop with blur (`bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm z-[120]`).
    2. **Card Structure**: Rounded corners (`rounded-3xl` or `rounded-2xl`), responsive max-width (`w-full max-w-lg sm:max-w-xl`), subtle border and shadow.
    3. **Header**: Clean title with contextual icon, badge if needed, and prominent top-right `✕` dismiss button.
    4. **Scrollable Body**: Body content MUST be constrained (`max-h-[75vh] sm:max-h-[80vh] overflow-y-auto custom-scrollbar px-6 py-4`) so inputs never get clipped on mobile viewports or virtual keyboards.
    5. **Sticky / Fixed Action Footer**: Action buttons (Cancel, Save/Submit, Delete) MUST sit in a separate, fixed/sticky footer at the bottom of the modal (`px-6 py-3.5 bg-stone-50 dark:bg-zinc-900/80 border-t border-stone-200 dark:border-zinc-800`), NEVER scroll out of view.
  - **Confirmation Dialogs**: Always reuse `ConfirmDialog.tsx` instead of native `window.confirm()` or ad-hoc custom confirm popups.

## 5. Unified Pagination & "Load More" Standard
- **Standard `LoadMoreButton` Component**:
  - NEVER write custom or ad-hoc "Daha Fazla Gör", "Daha Fazla Yükle", or pagination buttons across any list or page.
  - ALWAYS import and use [`LoadMoreButton.tsx`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/components/ui/LoadMoreButton.tsx).
  - Supply `onClick`, `loading`, and optional `remainingCount` props.
  - Mobile containers wrapping lists with `LoadMoreButton` MUST NOT have artificial fixed heights (`max-h-[600px] overflow-y-auto`) that trap scroll or hide the button behind mobile navigation bars.

## 6. Feature Access & Admin Panel Integration
- **Strict Registration of New Pages & Modules**:
  - When creating ANY new page, feature, or tool in the system:
    1. Register the new `FeatureKey` in [`featureAccessService.ts`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/services/featureAccessService.ts).
    2. Define its default access state in `DEFAULT_ACCESS` and label/icon in `FEATURE_LABELS`.
    3. Add routing and navigation guards in `App.tsx` and ensure it appears in `MobileMenu.tsx`, `Sidebar.tsx`, and Admin Panel (`AdminPage.tsx`).
    4. Use `useFeatureAccess` hook to gate access so admins can toggle it per user.

## 7. Calendar & Planner Logic
- **Match Display**:
  - Do not aggressively purge past matches with strict `isAfter(now)` filters in calendar views. Allow users to view all matches for the currently displayed month.

## 8. Development Verification Protocol
- Before finalizing ANY task:
  1. Verify changes against these 8 core rules.
  2. Run `npm run build` (`tsc -b && vite build`) to guarantee zero TypeScript or build regression.
