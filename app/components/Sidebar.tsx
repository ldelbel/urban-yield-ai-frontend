"use client";

import type { AlertsResponse, MapMode } from "../types";
import { fmtMillions } from "../lib/api";

interface HexMeta {
  uvi_rank: number;
  census_median_income: number | null;
  primary_zoning: string | null;
}

interface Props {
  alerts: AlertsResponse | null;
  totalDeclaredValue: number;
  infillCount: number;
  chronicMap: Record<string, number>;
  hexMap: Record<string, HexMeta>;
  mapMode: MapMode;
  onSelectHex: (h3Id: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const TEAL = "#0D9488";

function ChronicDot({ count }: { count: number }) {
  if (count >= 20) return <span style={{ color: "#DC2626" }} title="20+ chronic cases">●</span>;
  if (count >= 10) return <span style={{ color: "#D97706" }} title="10+ chronic cases">●</span>;
  if (count > 0)   return <span style={{ color: "#CA8A04" }} title="Chronic cases present">●</span>;
  return null;
}

function fmtIncome(val: number | null | undefined): string {
  if (val == null) return "—";
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ── Legend data ─────────────────────────────────────────────────────

const UVI_BANDS = [
  { opacity: 0.85, label: "Top 20%" },
  { opacity: 0.65, label: "60–80%" },
  { opacity: 0.45, label: "40–60%" },
  { opacity: 0.28, label: "20–40%" },
  { opacity: 0.12, label: "Bottom 20%" },
];

// In "uvi+yield" mode: show directional symbols with symbol colors
const YIELD_SYMBOLS = [
  { symbol: "↑", color: "#16A34A", label: "Accelerating" },
  { symbol: "–", color: "#D97706", label: "Stable" },
  { symbol: "↓", color: "#DC2626", label: "Stagnating" },
  { symbol: "!",  color: "#7C3AED", label: "Constrained" },
];

// In "yield" mode: show fill colors (no symbols — color communicates yield)
const YIELD_FILL_COLORS = [
  { color: "#059669", label: "Accelerating" },
  { color: "#CA8A04", label: "Stable" },
  { color: "#E11D48", label: "Stagnating" },
  { color: "#94A3B8", label: "Low Confidence" },
  { color: "#7C3AED", label: "Constrained" },
];

// ── Main component ───────────────────────────────────────────────────

export default function Sidebar({
  alerts,
  totalDeclaredValue,
  infillCount,
  chronicMap,
  hexMap,
  mapMode,
  onSelectHex,
  mobileOpen,
  onMobileClose,
}: Props) {
  // Primary: chronic_case_count desc. Secondary: uvi_rank asc (lower = higher UVI = higher priority)
  const sortedInfra = [...(alerts?.infrastructure_priority ?? [])].sort((a, b) => {
    const chronicDiff = (chronicMap[b.h3_index] ?? 0) - (chronicMap[a.h3_index] ?? 0);
    if (chronicDiff !== 0) return chronicDiff;
    return (hexMap[a.h3_index]?.uvi_rank ?? 9999) - (hexMap[b.h3_index]?.uvi_rank ?? 9999);
  });
  const sortedInfill = [...(alerts?.infill_opportunities ?? [])].sort((a, b) => {
    const chronicDiff = (chronicMap[b.h3_index] ?? 0) - (chronicMap[a.h3_index] ?? 0);
    if (chronicDiff !== 0) return chronicDiff;
    return (hexMap[a.h3_index]?.uvi_rank ?? 9999) - (hexMap[b.h3_index]?.uvi_rank ?? 9999);
  });

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 600,
    color: "#78716C",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "8px",
  };

  return (
    <div
      className={[
        "md:static md:translate-x-0 md:z-auto md:h-full",
        "fixed top-0 left-0 h-full z-50",
        "w-[280px] flex-shrink-0 overflow-y-auto flex flex-col",
        "transition-transform duration-300 md:transition-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
      style={{ background: "#F8F6F2", borderRight: "1px solid #E2D9CF" }}
    >
      {/* ── Mobile close ─────────────────────────────────────────── */}
      <button
        className="md:hidden self-end m-3 text-lg leading-none"
        style={{ color: "#78716C" }}
        onClick={onMobileClose}
        aria-label="Close sidebar"
      >
        ✕
      </button>

      {/* ── HEADER (sticky) ──────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 px-4 pt-4 pb-3 flex flex-col gap-0"
        style={{ background: "#F8F6F2", borderBottom: "1px solid #E2D9CF" }}
      >
        <h1 style={{ fontSize: "15px", fontWeight: 700, color: "#1C1917", letterSpacing: "-0.01em" }}>
          Urban Yield AI
        </h1>
        <p style={{ fontSize: "11px", color: "#78716C", marginTop: "1px" }}>
          Montgomery, AL — City Intelligence Platform
        </p>

        <div style={{ height: "1px", background: "#E2D9CF", margin: "10px 0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <p
            className="animate-pulse-opacity"
            style={{ fontSize: "13px", fontWeight: 700, color: "#D97706" }}
          >
            {alerts?.infrastructure_priority.length ?? "—"} critical zones identified
          </p>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#92400E" }}>
            {fmtMillions(totalDeclaredValue)} in mapped investment
          </p>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#16A34A" }}>
            {infillCount} redevelopment opportunities
          </p>
        </div>

        <div style={{ height: "1px", background: "#E2D9CF", margin: "10px 0 0" }} />
      </div>

      {/* ── LEGEND ───────────────────────────────────────────────── */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #E2D9CF" }}>

        {/* Section 1: UVI Intensity — visible in "uvi" and "uvi+yield" modes */}
        {mapMode !== "yield" && (
          <>
            <p style={sectionLabelStyle}>UVI Intensity</p>
            {UVI_BANDS.map(({ opacity, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                <span style={{
                  width: "14px",
                  height: "10px",
                  borderRadius: "2px",
                  background: TEAL,
                  opacity,
                  flexShrink: 0,
                  display: "inline-block",
                }} />
                <span style={{ fontSize: "11px", color: "#1C1917" }}>{label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", marginBottom: "6px" }}>
              <span style={{ width: "14px", height: "10px", borderRadius: "2px", border: "2px solid #D97706", flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: "11px", color: "#1C1917" }}>Market Data Available</span>
            </div>
          </>
        )}

        {/* Section 2: Yield Direction — visible in "uvi+yield" and "yield" modes */}
        {mapMode !== "uvi" && (
          <div style={{ marginTop: mapMode === "yield" ? "0" : "8px" }}>
            <p style={{ ...sectionLabelStyle, marginBottom: "6px" }}>Yield Direction</p>

            {mapMode === "uvi+yield"
              ? YIELD_SYMBOLS.map(({ symbol, color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                    <span style={{ fontSize: "13px", color, fontWeight: 700, width: "14px", textAlign: "center", flexShrink: 0 }}>
                      {symbol}
                    </span>
                    <span style={{ fontSize: "11px", color: "#1C1917" }}>{label}</span>
                  </div>
                ))
              : YIELD_FILL_COLORS.map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                    <span style={{
                      width: "14px",
                      height: "10px",
                      borderRadius: "2px",
                      background: color,
                      flexShrink: 0,
                      display: "inline-block",
                    }} />
                    <span style={{ fontSize: "11px", color: "#1C1917" }}>{label}</span>
                  </div>
                ))
            }
          </div>
        )}
      </div>

      {/* ── ALERTS LIST ──────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-col gap-2 flex-1">
        <p style={{ fontSize: "10px", fontWeight: 600, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
          Flagged Zones
        </p>

        {/* Infrastructure Priority */}
        {sortedInfra.length > 0 && (
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, color: "#B45309", marginBottom: "6px" }}>
              ⚠ Infrastructure Priority ({sortedInfra.length})
            </p>
            {sortedInfra.slice(0, 8).map((a) => {
              const meta = hexMap[a.h3_index];
              const zoning = meta?.primary_zoning ?? a.primary_zoning ?? "—";
              const income = fmtIncome(meta?.census_median_income);
              const rank = meta?.uvi_rank;
              return (
                <button
                  key={a.h3_index}
                  onClick={() => onSelectHex(a.h3_index)}
                  className="group w-full text-left"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2D9CF",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    marginBottom: "6px",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#D97706")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#E2D9CF")}
                >
                  {/* Line 1: hex ID + chronicity dot */}
                  <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#1C1917", display: "flex", alignItems: "center", gap: "4px" }}>
                    <ChronicDot count={chronicMap[a.h3_index] ?? 0} />
                    {a.h3_index}
                  </p>
                  {/* Line 2: yield label badge */}
                  {a.yield_label && (
                    <span style={{
                      display: "inline-block",
                      fontSize: "9px",
                      fontWeight: 600,
                      padding: "1px 5px",
                      borderRadius: "3px",
                      marginTop: "3px",
                      background: a.yield_label === "Accelerating" ? "#DCFCE7" : "#FEF3C7",
                      color: a.yield_label === "Accelerating" ? "#166534" : "#92400E",
                    }}>
                      {a.yield_label}
                    </span>
                  )}
                  {/* Line 3: UVI rank · zoning · income */}
                  <p style={{ fontSize: "10px", color: "#78716C", marginTop: "3px" }}>
                    {rank ? `UVI #${rank}` : "—"} · {zoning} · {income}
                  </p>
                </button>
              );
            })}
            <p style={{ fontSize: "10px", color: "#A8A29E", marginTop: "4px" }}>
              <span style={{ color: "#DC2626" }}>●</span> 20+ &nbsp;
              <span style={{ color: "#D97706" }}>●</span> 10+ &nbsp;
              <span style={{ color: "#CA8A04" }}>●</span> &gt;0 chronic cases
            </p>
          </div>
        )}

        {/* Infill Opportunities */}
        {sortedInfill.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, color: "#6D28D9", marginBottom: "6px" }}>
              ◆ Infill Opportunities ({sortedInfill.length})
            </p>
            {sortedInfill.slice(0, 6).map((a) => {
              const meta = hexMap[a.h3_index];
              const zoning = a.primary_zoning ?? meta?.primary_zoning ?? "—";
              const income = fmtIncome(meta?.census_median_income);
              const rank = meta?.uvi_rank;
              return (
                <button
                  key={a.h3_index}
                  onClick={() => onSelectHex(a.h3_index)}
                  className="w-full text-left"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2D9CF",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    marginBottom: "6px",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#D97706")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#E2D9CF")}
                >
                  {/* Line 1: hex ID + chronicity dot */}
                  <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#1C1917", display: "flex", alignItems: "center", gap: "4px" }}>
                    <ChronicDot count={chronicMap[a.h3_index] ?? 0} />
                    {a.h3_index}
                  </p>
                  {/* Line 2: stagnating badge */}
                  <span style={{
                    display: "inline-block",
                    fontSize: "9px",
                    fontWeight: 600,
                    padding: "1px 5px",
                    borderRadius: "3px",
                    marginTop: "3px",
                    background: "#FEE2E2",
                    color: "#991B1B",
                  }}>
                    Stagnating
                  </span>
                  {/* Line 3: UVI rank · zoning · income */}
                  <p style={{ fontSize: "10px", color: "#78716C", marginTop: "3px" }}>
                    {rank ? `UVI #${rank}` : "—"} · {zoning} · {income}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {sortedInfra.length === 0 && sortedInfill.length === 0 && (
          <p style={{ fontSize: "12px", color: "#A8A29E" }}>No alerts available.</p>
        )}
      </div>
    </div>
  );
}
