# UI Changes — Urban Yield AI

Six targeted frontend improvements implemented March 2026. No backend files were modified.

---

## 1. Impact-Oriented Header Stats

The sidebar title card now displays three executive-level KPIs instead of raw counts: critical zones identified (orange, pulsing), total declared investment (amber), and redevelopment opportunities (emerald). The pulse animation uses a custom `animate-pulse-opacity` keyframe defined in `globals.css`. Values are derived in `MapView.tsx` via `useMemo` and formatted with the new `fmtMillions` helper in `api.ts`.

## 2. Detail Panel Visual Hierarchy (Three-Tier)

The hex detail panel is restructured into three tiers:
- **Tier 1**: Full-width `DiagnosisBadge` (solid color, large font) + UVI/Yield scores at `text-4xl`, separated by an `<hr>`.
- **Tier 2**: Market Signals rows (Price/sqft, GMaps rating, Zoning) — always visible.
- **Tier 3**: Activity rows (permits, businesses, vacants, 311 cases, investment) wrapped in a `<details>` / `<summary>` element — collapsed by default to reduce visual noise.

## 3. "Copy Action Brief" Button

After the AI narrative renders, a button appears if the narrative contains a `RECOMMENDED ACTION:` section. Clicking it copies a structured text brief to the clipboard (zone ID, zoning, status, scores, and the recommended action). The button shows "✓ Copied!" for 2 seconds after a successful copy. The `extractSection` helper cleanly parses the narrative format.

## 4. Chronicity Urgency Indicators

The infrastructure priority and infill opportunity alert lists in the sidebar are now sorted by `chronic_case_count` descending (most chronic cases first). Each alert entry shows a colored dot: red (20+ cases), orange (10+), yellow (>0). A legend at the bottom of each list explains the color coding. The `chronicMap` lookup is built via `useMemo` in `MapView.tsx` from the geojson feature properties.

## 5. City Context Splash Banner

A fixed bottom banner (`SplashBanner.tsx`) shows the city name, total zones monitored, and last-refresh timestamp. The timestamp is fetched from the `/health` endpoint; if the endpoint is unavailable or returns a non-OK response, it gracefully falls back to "Live". The banner is dismissible for the session via an × button. It uses a semi-transparent dark background with `backdrop-filter: blur(8px)` for readability over the map.

## 6. Mobile Layout Stability

- **Sidebar**: On mobile, the sidebar slides in from the left as an overlay (z-50) via a CSS transform transition. A floating "☰ Alerts" button at `bottom-20 left-4` toggles it. A semi-transparent backdrop (`bg-black/50`) closes it on tap. On `md+` breakpoints the sidebar reverts to the standard absolute-positioned layout.
- **Detail panel**: The `HexPopup` uses responsive Tailwind classes — on desktop it stays as a top-right absolute panel (`md:absolute md:top-4 md:right-4 md:w-80`); on mobile it becomes a fixed bottom sheet (`fixed bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto rounded-t-xl`). No JavaScript is used to switch layouts — the breakpoint classes handle it entirely.
