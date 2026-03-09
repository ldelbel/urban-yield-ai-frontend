# UI Visualization — Urban Yield AI

Visual encoding system implemented March 2026. No backend files were modified.

---

## Two-Layer Reading Logic

The map uses two independent visual channels that answer two different questions:

| Channel | Visual Element | Question answered |
|---------|---------------|-------------------|
| UVI Intensity | Teal fill opacity (5 bands) | How vibrant is this zone overall? |
| Yield Direction | Directional symbol overlay (▲—▼⚠?) | Which way is momentum moving? |

A dark teal hexagon with ▲ means: **high vitality and growing**.
A dark teal hexagon with ▼ means: **high vitality but losing momentum** — the most actionable signal.
A pale teal hexagon with ▲ means: **low vitality but emerging** — candidate for early intervention.

---

## Part 1 — UVI Intensity Fill

### Color and Opacity

All hexagons use a single teal fill color (`#0D9488`) at five opacity levels determined by `uvi_percentile` rank. The percentile is computed by the backend scoring pipeline and represents each hexagon's position relative to all 638 hexagons in Montgomery, AL.

| Percentile band | Fill opacity | Meaning |
|----------------|-------------|---------|
| ≥ 80 (top 20%) | 0.85 | Highest urban vitality |
| 60–80 | 0.65 | Above average |
| 40–60 | 0.45 | Around median |
| 20–40 | 0.28 | Below average |
| < 20 (bottom 20%) | 0.12 | Lowest urban vitality |

MapLibre paint expression used:
```json
"fill-opacity": ["step", ["get", "uvi_percentile"], 0.12, 20, 0.28, 40, 0.45, 60, 0.65, 80, 0.85]
"fill-color": "#0D9488"
```

### Outline Layers

- **All hexagons**: `line-color: #0D9488`, `line-opacity: 0.35`, `line-width: 0.8`
- **Enriched hexagons** (Zillow market data available): amber ring `#D97706`, `line-width: 2.5`, `line-opacity: 0.9`
- **Selected hexagon**: stronger teal outline `#0D9488`, `line-width: 3`, `line-opacity: 1`

The enriched hexagon ring is applied via a second MapLibre line layer (`hex-enriched-border`) filtered by:
```json
["==", ["typeof", ["get", "zillow_avg_price_sqft"]], "number"]
```
This uses MapLibre's `typeof` expression operator (returns "null" for missing/null properties) rather than maintaining a hardcoded ID list, ensuring the filter stays correct across data refreshes.

---

## Part 2 — Yield Direction Symbols

### Layer Order

MapLibre layers are added in this order (later = renders on top):
1. `hex-fill` — teal fill
2. `hex-outline` — teal border
3. `hex-enriched-border` — amber ring for enriched cells
4. `hex-selected-outline` — selection indicator
5. `hex-yield-symbols` — text symbols on top

The symbol layer must be added last. Adding it earlier causes it to render below the fill layer and disappear.

### Symbol Mapping

The `yield_symbol` property is computed on the frontend in `MapView.tsx` before the GeoJSON is passed to MapLibre. It is **not** returned by the backend — it is a frontend-only derived field.

| yield_label | Symbol | Color |
|-------------|--------|-------|
| Accelerating | ▲ | `#16A34A` green |
| Stable | — | `#D97706` amber |
| Stagnating | ▼ | `#DC2626` red |
| Low Confidence | ? | `#A8A29E` gray |
| Structurally Constrained (any) | ⚠ | `#7C3AED` purple |

Symbol color is driven by a MapLibre `match` expression on `yield_label`, not on `yield_symbol`. This is required because the same Unicode glyph can appear in different colors for different semantic meanings (e.g., ▲ appears in both green for Accelerating and gray if a hypothetical high-confidence Low Confidence existed).

### Font Stack Workaround

MapLibre GL renders text via its glyph protocol, which serves pre-rasterized SDF (Signed Distance Field) glyphs from the style's configured glyph URL. The geometric shape characters used here (▲ U+25B2, ▼ U+25BC, ⚠ U+26A0) require a font that covers Unicode blocks beyond Basic Latin.

Font stack used:
```json
["literal", ["Noto Sans Regular", "Open Sans Regular"]]
```

- **Noto Sans Regular** covers Geometric Shapes (U+25A0–25FF) and Miscellaneous Symbols (U+2600–26FF).
- **Open Sans Regular** is the Carto Positron baseline font and covers Basic Latin (—, ?).

If the Carto glyph CDN does not serve Noto Sans glyphs for a specific character, MapLibre will silently omit that symbol. In that case, the functional toggle and layer controls still work — only the specific glyph is missing visually.

**Alternative**: If symbol rendering is unreliable in a deployment environment, switch to a simpler ASCII representation by updating `getYieldSymbol()` in `api.ts`:
```ts
"Accelerating" → "^"  // instead of ▲
"Stable"       → "-"  // instead of —
"Stagnating"   → "v"  // instead of ▼
```
These characters are guaranteed to render in all font stacks.

### Text Halo

A white halo (`text-halo-color: #FFFFFF`, `text-halo-width: 1.5px`) is applied to all symbols to ensure readability over the teal fill, especially in low-zoom views where hexagons are smaller and the fill is prominent.

### `text-allow-overlap: false`

At zoom levels where hexagons are small, MapLibre will suppress some symbols to prevent overlap. This is intentional — showing a cluttered symbol at every hex at low zoom is less readable than showing a curated subset. Symbols become more visible as the user zooms in.

---

## Part 3 — Yield Toggle

A toggle button is rendered as an absolute-positioned React element overlaid on the map canvas (not a MapLibre control). It is positioned at `top: 10px, right: 10px` within the map container div.

Toggle state (`isYieldVisible: boolean`) is managed in `MapView.tsx` and passed as a prop to both:
- `Map.tsx` — to update layer visibility via `map.setLayoutProperty()`
- `Sidebar.tsx` — to show/hide Legend Section 2

When toggled off, `map.setLayoutProperty("hex-yield-symbols", "visibility", "none")` is called via a `useEffect` dependency on the prop.

**Startup race condition**: If the toggle is set to `false` before the MapLibre `load` event fires, the `useEffect` runs but finds no layer and silently no-ops. To handle this, the initial visibility in the `map.addLayer()` call is read from `isYieldVisibleRef.current` (a ref that stays in sync with the prop), not from the stale closure value. Since the default is `true`, this edge case is benign in normal usage.

---

## Part 4 — Legend

The legend in `Sidebar.tsx` has two sections:

**Section 1 — UVI Intensity** (always visible): Five swatches at 14×10px with `#0D9488` background at the five opacity levels. An additional amber outline swatch indicates enriched hexagons with market data.

**Section 2 — Yield Direction** (conditional): Four rows with Unicode symbols colored by semantic meaning. This section is hidden when the yield toggle is inactive, using a CSS transition on `maxHeight` and `opacity`:
```css
max-height: 0 → 120px;  opacity: 0 → 1;  transition: 200ms ease;
```
The `maxHeight` animation is a standard CSS trick for collapsing elements of unknown height without JavaScript layout measurement.

---

## Part 5 — Bottom Sheet: Neighborhood Context

A new "NEIGHBORHOOD CONTEXT" section is added to Column B of the bottom sheet, between "Market Signals" and the collapsible "Activity" details block.

Fields displayed (formatted values, "—" for null):

| Field | Format |
|-------|--------|
| Median Income | `$XX,XXX` — `toLocaleString` with `style: "currency"` |
| Median Home Value | `$XXX,XXX` |
| Median Rent | `$X,XXX / mo` |
| Population | `X,XXX` — `toLocaleString` |
| Vacancy Rate | `X.X%` — vacancy_rate × 100, one decimal |
| UVI Rank | `#N of 638` |
| UVI Percentile | `Top X%` — `Math.round(100 - uvi_percentile)` |

A census data badge (teal "● Census Data" or gray "○ No Census Data") appears in the top-right of the section header, derived from `census_coverage` boolean.

---

## Part 6 — Tier 1 Diagnosis Block

Below the `DiagnosisBadge` in Column A, a rank indicator line is rendered:
```
#12 of 638 · Top 2%
```
- If `uvi_percentile >= 50`: shows `Top X%` where X = `Math.round(100 - uvi_percentile)`
- If `uvi_percentile < 50`: shows `Bottom X%` where X = `Math.round(uvi_percentile)`

This dual-label approach ensures the number is always small and meaningful (e.g., "Top 2%" rather than "98th percentile", and "Bottom 24%" rather than "23.7th percentile").

---

## Fallback Behavior

If `uvi_rank` or `uvi_percentile` are missing from the API response (e.g., backend not yet updated), `MapView.tsx` detects `uvi_rank === 0` and computes the fallback client-side by sorting all features by `uvi_score` descending. A `console.warn` is emitted. This fallback does not affect the visual output — the map will render correctly with client-computed ranks.
