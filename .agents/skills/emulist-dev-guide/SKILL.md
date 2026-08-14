---
name: emulist-dev-guide
description: Repository-specific guidelines, architecture constraints, and learned lessons for emuList-M-S-G
---

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
- **Modals**:
  - Global Modals (`DetailModal`, `EditModal`, `SeriesProgressModal`) must use `z-[9999]` and `fixed inset-0` to safely float above all other fixed UI components like `BottomNavBar`. 

## 4. Modal Design & Mobile Adaptability
- **Scrollable Modals**:
  - All modal dialogs (Detail Modal, Edit Modal, Series Progress) must feature a container with `max-h-[90vh] flex flex-col` and a dedicated `overflow-y-auto` scrollable body content area.
  - Action footers and headers should be `sticky` (or fixed within the flex layout) to avoid content overflow on smaller viewports. Do not rely solely on body overflow without flex wrapping.
- **Hero Images on Mobile**:
  - Avoid using fixed `min-h-[400px]` for hero images inside mobile modals to prevent vertical space blowout. Use `h-48 md:h-auto` and keep text elements compact.

## 5. Calendar & Planner Logic
- **Match Display**:
  - Do not aggressively purge past matches with strict `isAfter(now)` filters in calendar views. Allow users to view all matches for the currently displayed month.

## 6. TV Series Tracking
- Use `episodeTrackingService.ts` for all series manipulation (`markSeriesFullyWatched`, `toggleEpisodeWatched`).
- Ensure UI accurately distinguishes between completely watched (`watched: true`), in progress, and unwatched states.
