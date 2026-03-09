"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { HexGeoJSON, HexProperties, AlertsResponse, MapMode } from "../types";
import { fetchHexagons, fetchAlerts, getYieldSymbol } from "../lib/api";
import Sidebar from "./Sidebar";
import BottomSheet from "./BottomSheet";
import SplashBanner from "./SplashBanner";

// Map and QuadrantView must be client-only (no SSR)
const Map = dynamic(() => import("./Map"), { ssr: false });
const QuadrantView = dynamic(() => import("./QuadrantView"), { ssr: false });

export default function MapView() {
  const [geojson, setGeojson] = useState<HexGeoJSON | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [selected, setSelected] = useState<HexProperties | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("uvi+yield");
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    Promise.all([fetchHexagons(), fetchAlerts()])
      .then(([geo, al]) => {
        // Graceful fallback: if uvi_rank is missing from the API response,
        // compute it client-side by sorting features by uvi_score descending.
        const hasMissingRank = geo.features.some(
          f => f.properties.uvi_rank == null || f.properties.uvi_rank === 0
        );
        if (hasMissingRank) {
          console.warn(
            "uvi_rank missing from API response — computing fallback client-side. " +
            "Ensure the backend scoring pipeline has been updated."
          );
          const total = geo.features.length;
          const sorted = [...geo.features].sort(
            (a, b) => (b.properties.uvi_score ?? 0) - (a.properties.uvi_score ?? 0)
          );
          sorted.forEach((f, i) => {
            f.properties.uvi_rank = i + 1;
            f.properties.uvi_percentile = Math.round(((total - (i + 1)) / total) * 1000) / 10;
          });
        }
        // Annotate each feature with the computed yield_symbol before passing to MapLibre
        geo.features.forEach(f => {
          f.properties.yield_symbol = getYieldSymbol(f.properties.yield_label);
        });
        // Diagnostic: confirm symbol assignment. Remove after verifying in browser console.
        console.log("Symbol distribution:", geo.features.reduce<Record<string, number>>((acc, f) => {
          const s = f.properties.yield_symbol ?? "(none)";
          acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        }, {}));
        setGeojson(geo);
        setAlerts(al);
      })
      .catch(e => setError(String(e)));
  }, []);

  const handleSelectHex = useCallback((props: HexProperties) => {
    setSelected(props);
    setSheetOpen(true);
    setSidebarOpen(false); // close mobile sidebar when a hex is selected
  }, []);

  const handleSelectById = useCallback((h3Id: string) => {
    if (!geojson) return;
    const feature = geojson.features.find(f => f.properties.h3_index === h3Id);
    if (feature) {
      setSelected(feature.properties);
      setSheetOpen(true);
      setSidebarOpen(false);
    }
  }, [geojson]);

  const handleClose = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const handleMapBackgroundClick = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const handleMapReady = useCallback((map: MapLibreMap) => {
    mapInstanceRef.current = map;
  }, []);

  const handleToggleAnalysis = useCallback(() => {
    setIsAnalysisMode(prev => {
      const next = !prev;
      if (next && geojson && mapInstanceRef.current) {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
        for (const f of geojson.features) {
          for (const c of f.geometry.coordinates[0]) {
            if (c[0] < minLng) minLng = c[0];
            if (c[1] < minLat) minLat = c[1];
            if (c[0] > maxLng) maxLng = c[0];
            if (c[1] > maxLat) maxLat = c[1];
          }
        }
        mapInstanceRef.current.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 40, duration: 600 }
        );
      }
      // Resize after layout transition completes (300ms + buffer)
      setTimeout(() => mapInstanceRef.current?.resize(), 310);
      return next;
    });
  }, [geojson]);

  const handleCycleMode = useCallback(() => {
    const cycle: Record<MapMode, MapMode> = { "uvi": "uvi+yield", "uvi+yield": "yield", "yield": "uvi" };
    setMapMode(prev => cycle[prev]);
  }, []);

  const totalDeclaredValue = useMemo(() =>
    geojson?.features.reduce((sum, f) => sum + (f.properties.total_declared_value ?? 0), 0) ?? 0,
    [geojson]
  );

  const infillCount = alerts?.infill_opportunities.length ?? 0;

  const chronicMap = useMemo<Record<string, number>>(() => {
    if (!geojson) return {};
    return Object.fromEntries(
      geojson.features.map(f => [f.properties.h3_index, f.properties.chronic_case_count ?? 0])
    );
  }, [geojson]);

  // Lookup map for UVI rank, census income, and zoning — used by Sidebar alert cards
  const hexMap = useMemo<Record<string, { uvi_rank: number; census_median_income: number | null; primary_zoning: string | null }>>(() => {
    if (!geojson) return {};
    return Object.fromEntries(
      geojson.features.map(f => [
        f.properties.h3_index,
        {
          uvi_rank: f.properties.uvi_rank,
          census_median_income: f.properties.census_median_income,
          primary_zoning: f.properties.primary_zoning,
        },
      ])
    );
  }, [geojson]);

  // ── Error state ──────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: "#F5F0EB" }}
      >
        <div className="text-center">
          <p className="font-semibold mb-2" style={{ color: "#DC2626" }}>
            Could not connect to backend
          </p>
          <p className="text-sm" style={{ color: "#78716C" }}>{error}</p>
          <p className="text-xs mt-2" style={{ color: "#A8A29E" }}>
            Make sure the FastAPI server is running on port 8000
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────
  if (!geojson) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: "#F5F0EB" }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "#D97706", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "#78716C" }}>Loading hexagon data…</p>
        </div>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────
  return (
    <>
      {/* Mobile backdrop — closes sidebar when tapped */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <Sidebar
        alerts={alerts}
        totalDeclaredValue={totalDeclaredValue}
        infillCount={infillCount}
        chronicMap={chronicMap}
        hexMap={hexMap}
        mapMode={mapMode}
        onSelectHex={handleSelectById}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* RIGHT: MAP + optional QUADRANT PANEL */}
      <div className="flex-1 flex overflow-hidden">

        {/* Map area — shrinks to 55% when Analysis Mode is active */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{
            width: isAnalysisMode ? "55%" : "100%",
            transition: "width 300ms ease-in-out",
          }}
        >
          <Map
            geojson={geojson}
            selectedHexId={selected?.h3_index ?? null}
            onSelectHex={handleSelectHex}
            onMapBackgroundClick={handleMapBackgroundClick}
            mapMode={mapMode}
            onCycleMode={handleCycleMode}
            onMapReady={handleMapReady}
          />

          {/* Bottom sheet — centered in map area, slides up on hex select */}
          <BottomSheet
            cell={selected}
            isOpen={sheetOpen}
            onClose={handleClose}
          />

          {/* Splash banner — hidden when sheet is open (z-10 < sheet z-20) */}
          {!sheetOpen && (
            <SplashBanner totalCount={geojson.features.length} />
          )}

          {/* Analysis Mode toggle — top-right overlay, desktop only */}
          <button
            className="hidden md:flex"
            onClick={handleToggleAnalysis}
            title={isAnalysisMode ? "Exit Analysis View" : "Open Analysis View"}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: isAnalysisMode ? "#0D9488" : "#FFFFFF",
              color: isAnalysisMode ? "#FFFFFF" : "#1C1917",
              border: isAnalysisMode ? "none" : "1px solid #E2D9CF",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              zIndex: 10,
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              userSelect: "none",
            }}
          >
            ⬡ Analysis View
          </button>
        </div>

        {/* Quadrant panel — fills remaining 45%, desktop only */}
        {isAnalysisMode && (
          <div className="hidden md:block flex-1 overflow-hidden">
            <QuadrantView
              hexagons={geojson.features}
              onHexagonSelect={handleSelectById}
              selectedHexId={selected?.h3_index ?? null}
            />
          </div>
        )}
      </div>

      {/* Mobile: floating alerts toggle (hidden on md+) */}
      <button
        className="md:hidden fixed bottom-6 left-4 z-40 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg"
        style={{ background: "#1C1917" }}
        onClick={() => setSidebarOpen(o => !o)}
      >
        ☰ Alerts ({alerts?.infrastructure_priority.length ?? 0})
      </button>
    </>
  );
}
