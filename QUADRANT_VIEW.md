# Quadrant View — Urban Yield AI

Analytical scatter plot panel implemented March 2026. No backend files were modified.

---

## Purpose

The Quadrant View reveals the two-dimensional relationship between **UVI Score** (current
urban condition, x-axis) and **Yield Score** (momentum direction, y-axis) across all 638
hexagons simultaneously. The map shows *where* things are happening spatially; the Quadrant
View shows *why* they matter analytically.

---

## Activation

An **"⬡ Analysis View"** toggle button is rendered as an absolute overlay at `top: 10px,
right: 10px` of the map canvas (desktop only, hidden on screens < 768px). Clicking it:

1. Splits the right panel: map contracts to 55% width, Quadrant View fills the remaining 45%
2. Calls `map.fitBounds()` over all hexagons so the contracted map still shows the full city
3. Schedules `map.resize()` at 310ms to let the MapLibre canvas recalculate after the CSS
   transition (300ms ease-in-out) completes

Clicking again restores the full-width map and calls `map.resize()` again.

---

## Quadrant Definitions

The chart is divided into four quadrants by two reference lines:
- **Vertical** at UVI = 50 (city median)
- **Horizontal** at Yield = 0.8 (Stagnating threshold)

| Quadrant | UVI | Yield | Name | Color | Interpretation |
|----------|-----|-------|------|-------|----------------|
| Q1 top-left | < 50 | ≥ 0.8, Accelerating | Priority Zones | `#DC2626` red | Low vitality but gaining — highest ROI for targeted investment |
| Q2 top-right | ≥ 50 | ≥ 0.8 | Thriving Zones | `#0D9488` teal | High vitality and growing — protect and sustain |
| Q3 bottom-left | < 50 | < 0.8 | Intervention Zones | `#7C3AED` purple | Low vitality and losing — systemic risk, needs intervention |
| Q4 bottom-right | ≥ 50 | < 0.8 | Watch Zones | `#D97706` amber | High vitality but slowing — monitor for reversal |

The **Priority** count is visually emphasized (bold, 13px) in the summary strip because
Q1 is the most actionable quadrant for city planners.

---

## Color Encoding

Points are colored by `yield_label` (same palette as the map symbol layer):

| yield_label | Color |
|-------------|-------|
| Accelerating | `#16A34A` green |
| Stable | `#D97706` amber |
| Stagnating | `#DC2626` red |
| Low Confidence | `#A8A29E` gray |
| Structurally Constrained (any) | `#7C3AED` purple |

**Point size:**
- Default: radius 4, fillOpacity 0.70
- Selected: radius 7, fillOpacity 1.0, stroke `#1C1917` 1.5px
- Enriched (Zillow data available): stroke `#D97706` 1.5px (can combine with selected)

**Y-axis clamping:** `yield_score` values above 2.5 are clamped to 2.5 for display purposes
only. The raw score is shown in the tooltip and used in all calculations.

---

## Map ↔ Chart Synchronization

The `selected` hex state is managed in `MapView.tsx` and flows down as props to both
`Map.tsx` and `QuadrantView.tsx`:

```
MapView.tsx
  └── selected: HexProperties | null        (state)
  └── handleSelectById(h3Id)                (shared callback)
        ├── Map.tsx          ← renders teal selection outline
        └── QuadrantView.tsx ← renders enlarged selected point
```

**Chart → Map:** Clicking a scatter point calls `onHexagonSelect(h3_index)`, which routes
to `handleSelectById` in `MapView`. This sets `selected` and `sheetOpen = true`, triggering:
- The map to fly to the hexagon (zoom 13, 600ms)
- The BottomSheet to open with full hex details

**Map → Chart:** Clicking a hex on the map calls `handleSelectHex`, which sets `selected`.
The same `selected.h3_index` prop flows into `QuadrantView.selectedHexId`, and the matching
scatter point is immediately rendered larger and outlined. No scroll-to-point is implemented.

---

## Component Architecture

```
MapView.tsx
  ├── mapInstanceRef: useRef<MapLibreMap>   — stores the live MapLibre instance
  ├── isAnalysisMode: boolean               — controls split layout
  ├── handleMapReady(map)                   — called once from Map.tsx after load
  ├── handleToggleAnalysis()                — fitBounds + resize orchestration
  │
  ├── Map.tsx (55% width when analysis mode)
  │     └── onMapReady prop → calls handleMapReady after all layers added
  │
  └── QuadrantView.tsx (45% width, desktop only)
        ├── ScatterChart (Recharts)
        │     ├── ReferenceArea × 4 (quadrant backgrounds + labels)
        │     ├── ReferenceLine × 2 (quadrant dividers)
        │     └── Scatter (custom shape + onClick)
        └── Summary strip (4 quadrant counts)
```

---

## Mobile Behavior

Analysis Mode is fully disabled on screens < 768px:
- The "⬡ Analysis View" button has `className="hidden md:flex"` — invisible on mobile
- The QuadrantView panel renders inside `className="hidden md:block"` — never shown
- No resize-observer or JS media query is used; pure CSS hiding is sufficient
