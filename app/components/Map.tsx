"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { HexGeoJSON, HexProperties, MapMode } from "../types";

const SOURCE_ID = "hexagons";
const LAYER_FILL = "hex-fill";
const LAYER_OUTLINE = "hex-outline";
const LAYER_ENRICHED = "hex-enriched-border";
const LAYER_SELECTED = "hex-selected-outline";
const LAYER_SYMBOLS = "hex-yield-symbols";

const TEAL = "#0D9488";
const BASEMAP_PRIMARY = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const BASEMAP_FALLBACK = "https://demotiles.maplibre.org/style.json";

// ── MapLibre paint expressions ────────────────────────────────────────
// Defined as unknown[] — setPaintProperty accepts unknown for its value param.

const UVI_OPACITY_EXPR: unknown[] = [
  "step", ["get", "uvi_percentile"],
  0.12, 20, 0.28, 40, 0.45, 60, 0.65, 80, 0.85,
];

const YIELD_COLOR_EXPR: unknown[] = [
  "match", ["get", "yield_label"],
  "Accelerating",  "#059669",
  "Stable",        "#CA8A04",
  "Stagnating",    "#E11D48",
  "Low Confidence","#94A3B8",
  "#7C3AED", // fallback — all Structurally Constrained variants
];

// ── Mode metadata ──────────────────────────────────────────────────────

interface ModeInfo { label: string; hint: string; dotColor: string; dotColor2?: string }
const MODE_INFO: Record<MapMode, ModeInfo> = {
  "uvi":      { label: "UVI Only",    hint: "click: add Yield",   dotColor: "#0D9488" },
  "uvi+yield":{ label: "UVI + Yield", hint: "click: Yield Only",  dotColor: "#0D9488", dotColor2: "#059669" },
  "yield":    { label: "Yield Only",  hint: "click: UVI Only",    dotColor: "#059669" },
};

const MODE_CYCLE: Record<MapMode, MapMode> = {
  "uvi": "uvi+yield",
  "uvi+yield": "yield",
  "yield": "uvi",
};

interface Props {
  geojson: HexGeoJSON | null;
  selectedHexId: string | null;
  onSelectHex: (props: HexProperties) => void;
  onMapBackgroundClick?: () => void;
  mapMode: MapMode;
  onCycleMode: () => void;
  onMapReady?: (map: maplibregl.Map) => void;
}

export default function Map({
  geojson,
  selectedHexId,
  onSelectHex,
  onMapBackgroundClick,
  mapMode,
  onCycleMode,
  onMapReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Ref so the load handler can read current mapMode without stale closure
  const mapModeRef = useRef(mapMode);

  // Keep ref in sync with prop
  useEffect(() => {
    mapModeRef.current = mapMode;
  }, [mapMode]);

  // ── Initialize map once ───────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_PRIMARY,
      center: [-86.2911, 32.3617], // Montgomery, AL
      zoom: 11,
    });
    mapRef.current = map;

    map.on("error", (e) => {
      const msg = String((e as { error?: { message?: string } }).error?.message ?? "");
      if (msg.includes("style") || msg.includes("Failed to fetch")) {
        map.setStyle(BASEMAP_FALLBACK);
      }
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      if (!geojson) return;

      map.addSource(SOURCE_ID, { type: "geojson", data: geojson });

      // ── Layer 1: Fill — teal percentile bands (default) ──
      map.addLayer({
        id: LAYER_FILL,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": TEAL,
          "fill-opacity": [
            "step",
            ["get", "uvi_percentile"],
            0.12,       // < 20  → bottom quintile
            20, 0.28,   // 20–40
            40, 0.45,   // 40–60
            60, 0.65,   // 60–80
            80, 0.85,   // ≥ 80  → top quintile
          ],
        },
      });

      // ── Layer 2: Outline — subtle teal border ──
      map.addLayer({
        id: LAYER_OUTLINE,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": TEAL,
          "line-opacity": 0.35,
          "line-width": 0.8,
        },
      });

      // ── Layer 3: Enriched hexagons — amber ring where Zillow data exists ──
      map.addLayer({
        id: LAYER_ENRICHED,
        type: "line",
        source: SOURCE_ID,
        filter: ["==", ["typeof", ["get", "zillow_avg_price_sqft"]], "number"],
        paint: {
          "line-color": "#D97706",
          "line-width": 2.5,
          "line-opacity": 0.9,
        },
      });

      // ── Layer 4: Selected hex — strong teal outline ──
      map.addLayer({
        id: LAYER_SELECTED,
        type: "line",
        source: SOURCE_ID,
        filter: ["==", ["get", "h3_index"], ""],
        paint: {
          "line-color": TEAL,
          "line-width": 3,
          "line-opacity": 1,
        },
      });

      // ── Layer 5: Yield symbols — text on top of all other layers ──
      map.addLayer({
        id: LAYER_SYMBOLS,
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "text-field": ["get", "yield_symbol"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,  10,
            10, 14,
            12, 20,
            14, 28,
            16, 38,
          ],
          "text-anchor": "center",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-letter-spacing": 0,
          "text-font": ["literal", ["Noto Sans Bold", "Arial Unicode MS Bold"]],
          "visibility": mapModeRef.current === "uvi+yield" ? "visible" : "none",
        },
        paint: {
          "text-color": [
            "match",
            ["get", "yield_label"],
            "Accelerating",  "#16A34A",
            "Stable",        "#D97706",
            "Stagnating",    "#DC2626",
            "Low Confidence","#A8A29E",
            "#7C3AED",
          ],
          "text-halo-color": "rgba(255, 255, 255, 0.80)",
          "text-halo-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,  1.5,
            12, 3,
            16, 5,
          ],
          "text-halo-blur": 1,
        },
      });

      // ── Click: hex or background ──
      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [LAYER_FILL] });
        if (features.length > 0) {
          const props = features[0].properties as HexProperties;
          onSelectHex(props);
        } else {
          onMapBackgroundClick?.();
        }
      });

      map.on("mouseenter", LAYER_FILL, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", LAYER_FILL, () => { map.getCanvas().style.cursor = ""; });

      onMapReady?.(map);
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update selected hex filter ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (!map.getLayer(LAYER_SELECTED)) return;
    map.setFilter(LAYER_SELECTED, ["==", ["get", "h3_index"], selectedHexId ?? ""]);
  }, [selectedHexId]);

  // ── Fly to selected hexagon ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedHexId || !geojson) return;
    const feature = geojson.features.find(f => f.properties.h3_index === selectedHexId);
    if (!feature) return;
    const coords = feature.geometry.coordinates[0];
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    map.flyTo({ center: [centerLng, centerLat], zoom: 13, duration: 600 });
  }, [selectedHexId, geojson]);

  // ── Three-mode effect: sync fill color, opacity, symbol visibility ─
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (!map.getLayer(LAYER_FILL) || !map.getLayer(LAYER_SYMBOLS)) return;

    if (mapMode === "yield") {
      map.setPaintProperty(LAYER_FILL, "fill-color", YIELD_COLOR_EXPR);
      map.setPaintProperty(LAYER_FILL, "fill-opacity", 0.55);
      map.setLayoutProperty(LAYER_SYMBOLS, "visibility", "none");
    } else {
      map.setPaintProperty(LAYER_FILL, "fill-color", TEAL);
      map.setPaintProperty(LAYER_FILL, "fill-opacity", UVI_OPACITY_EXPR);
      map.setLayoutProperty(
        LAYER_SYMBOLS,
        "visibility",
        mapMode === "uvi+yield" ? "visible" : "none"
      );
    }
  }, [mapMode]);

  const info = MODE_INFO[mapMode];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Three-mode cycle toggle — top-right of map canvas */}
      <button
        onClick={onCycleMode}
        title={`Current: ${info.label} — click to cycle to ${MODE_INFO[MODE_CYCLE[mapMode]].label}`}
        style={{
          position: "absolute",
          top: "46px",
          right: "10px",
          width: "130px",
          background: "#FFFFFF",
          border: "1px solid #E2D9CF",
          borderRadius: "6px",
          padding: "5px 10px",
          cursor: "pointer",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          userSelect: "none",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#1C1917" }}>
            {info.label} →
          </span>
          <span style={{ fontSize: "10px", lineHeight: 1 }}>
            <span style={{ color: info.dotColor }}>●</span>
            {info.dotColor2 && <span style={{ color: info.dotColor2 }}>●</span>}
          </span>
        </div>
        <div style={{ fontSize: "9px", color: "#A8A29E", marginTop: "1px" }}>
          {info.hint}
        </div>
      </button>
    </div>
  );
}
