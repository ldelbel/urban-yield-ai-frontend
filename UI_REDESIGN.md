# UI Redesign — Urban Yield AI

Complete visual redesign of the frontend, implemented March 2026. No backend files were modified.

---

## Layout Structure

```
<main style="display:flex; height:100vh; overflow:hidden; background:#F5F0EB">
  │
  ├── <Sidebar>  ← 280px fixed width, full height, overflow-y:auto
  │      Desktop: static flex child (in document flow)
  │      Mobile:  fixed overlay, slides in via translateX
  │
  └── <div class="flex-1 relative overflow-hidden">  ← map container
         │
         ├── <Map>          fills 100% width × 100% height
         ├── <BottomSheet>  absolute bottom-center, z-index 20
         └── <SplashBanner> absolute bottom-0 full width, z-index 10
                            hidden when BottomSheet is open
```

The key principle is that the sidebar and map container are **flex siblings** — the sidebar takes its 280px and the map fills the rest. On mobile the sidebar collapses to a fixed overlay so the map gets full width.

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| App background | `#F5F0EB` | `<main>` and loading/error states |
| Sidebar background | `#F8F6F2` | Sidebar, sticky header, SplashBanner |
| Border / divider | `#E2D9CF` | All dividers, card borders, SplashBanner top |
| Primary text | `#1C1917` | Headings, data values, hex IDs |
| Secondary text | `#78716C` | Labels, subtitles, section titles |
| Muted text | `#A8A29E` | Pending data, empty states |
| Accent / amber | `#D97706` | Buttons, hover borders, enriched hex outlines |
| Amber dark | `#92400E` | "Copy Action Brief" text, investment stat |
| Accelerating | `#16A34A` | Hex fill + legend |
| Stable | `#2563EB` | Hex fill + legend |
| Stagnating | `#DC2626` | Hex fill + legend |
| Low Confidence | `#A8A29E` | Hex fill + legend |
| Constrained | `#7C3AED` | Hex fill + legend |

---

## Part 1 — Global Light Theme

- Basemap changed from Carto Dark Matter to **Carto Positron** (`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`) — cream/white background with soft gray roads.
- Fallback to `https://demotiles.maplibre.org/style.json` if Positron errors (handled via `map.on("error")`).
- All hexagon colors shifted for readability on light background (see table above).
- Hex border line color changed from `#1f2937` to `#78716C` (warm gray), opacity 0.5.
- MapLibre navigation controls restyled via `globals.css` overrides: white background, `#E2D9CF` border, amber hover.

---

## Part 2 — Fixed Sidebar

- **Desktop**: The sidebar is a `position: static` flex child (`md:static`). Width 280px, `flex-shrink-0`. Right border `1px solid #E2D9CF`.
- **Mobile**: The sidebar uses `position: fixed; top: 0; left: 0` and slides in via `translateX(-100% → 0)` with a 300ms ease transition. A backdrop overlay (`bg-black/50`) closes it on tap.
- The sticky header block (app name, stats, dividers) uses `position: sticky; top: 0` within the sidebar's scroll container so the title/stats stay visible when scrolling the alerts list.
- Alert cards: white background, 6px border-radius, `#E2D9CF` border. On hover, border shifts to amber `#D97706`.
- Alert list sorted by `chronic_case_count` descending. Chronicity dots: red (≥20), amber (≥10), yellow (>0).

---

## Part 3 — Bottom Sheet

- Rendered **inside the map container** (`position: relative`), so it does not cover the sidebar.
- Position: `position: absolute; bottom: 0; left: 50%; transform: translateX(-50%) translateY(...)` — centers horizontally within the map area.
- Width: 80% of map container. Max-height: 320px desktop / 70vh mobile (CSS class `.bottom-sheet` in `globals.css`).
- Animation: `transform 280ms cubic-bezier(0.32, 0.72, 0, 1)` — spring-like feel.
- **Three-column layout** (desktop, `md:flex-row`):
  - Column A (25%): Diagnosis badge, UVI/Yield scores, flags
  - Column B (40%): Market signals + collapsible Activity `<details>`
  - Column C (flex-1): AI Briefing with "View AI Briefing" button or rendered narrative + Copy Brief button
- **Mobile** (`flex-col`): columns stack vertically (A → B → C), separated by horizontal dividers.
- Content fade: when a different hex is selected while the sheet is open, content opacity briefly drops to 0 then fades back over 150ms.
- Dismiss: × button, Escape key, or clicking the map background (empty area).

---

## Part 4 — Map Controls

- MapLibre `NavigationControl` kept at `"bottom-right"` position within the map container.
- Restyled via `globals.css` `.maplibregl-ctrl-group` overrides: white background, `#E2D9CF` border, rounded corners, amber hover, `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`.

---

## Part 5 — Mobile

- Sidebar: fixed overlay, slide-in from left, backdrop closes it.
- Bottom sheet: `flex-col` layout, max-height `70vh`, internal scroll.
- Floating "☰ Alerts" button at `bottom: 24px, left: 16px` (hidden on `md+`).
- Bottom sheet closes when a hex is selected from the sidebar (sidebar also closes simultaneously).

---

## Browser Workarounds

- **Transform composition**: CSS `transform` is not additive. The bottom sheet requires both `translateX(-50%)` and `translateY(...)` simultaneously. Tailwind's `-translate-x-1/2` and `translate-y-full` cannot be composed via separate classes. Solution: use a single inline `style.transform` that combines both values.
- **MapLibre style error**: Positron style occasionally fails to load in network-restricted environments. The `map.on("error")` handler detects style fetch failures and calls `map.setStyle(BASEMAP_FALLBACK)`.
- **Sidebar flex vs fixed**: `md:static` in Tailwind overrides `position: fixed` at the md breakpoint, making the sidebar a proper flex child on desktop without any JavaScript layout switching.
