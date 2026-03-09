"use client";

import { useState, useEffect } from "react";
import type { HexProperties } from "../types";
import { fmt, fetchInsight } from "../lib/api";

interface Props {
  cell: HexProperties | null;
  isOpen: boolean;
  onClose: () => void;
}

const PENDING = "Data pending city review";

// ── Sub-components ────────────────────────────────────────────────

function DiagnosisBadge({ label }: { label: HexProperties["yield_label"] }) {
  const colors: Record<string, string> = {
    "Accelerating": "#16A34A",
    "Stable": "#2563EB",
    "Stagnating": "#DC2626",
    "Low Confidence": "#A8A29E",
    "Structurally Constrained — Flood Zone": "#7C3AED",
    "Structurally Constrained — Historic District": "#7C3AED",
    "Structurally Constrained — Flood + Historic": "#7C3AED",
  };
  const bg = colors[label ?? ""] ?? "#A8A29E";
  return (
    <div style={{
      background: bg,
      color: "#FFFFFF",
      padding: "6px 8px",
      borderRadius: "6px",
      fontSize: "11px",
      fontWeight: 700,
      textAlign: "center",
      lineHeight: 1.3,
    }}>
      {label ?? "Unknown"}
    </div>
  );
}

function SmallBadge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 6px",
      borderRadius: "4px",
      fontSize: "10px",
      fontWeight: 600,
      background: bg,
      color: fg,
    }}>
      {label}
    </span>
  );
}

function FlagBadge({ active, label, bg, fg }: { active: boolean; label: string; bg: string; fg: string }) {
  if (!active) return null;
  return <SmallBadge label={label} bg={bg} fg={fg} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "10px",
      fontWeight: 600,
      color: "#78716C",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      marginBottom: "4px",
    }}>
      {children}
    </p>
  );
}

function DataRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value == null ? PENDING : String(value);
  const isPending = display === PENDING;
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      padding: "3px 0",
      borderBottom: "1px solid #F5F0EB",
      gap: "8px",
    }}>
      <span style={{ fontSize: "11px", color: "#78716C", flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: "11px",
        fontWeight: 500,
        textAlign: "right",
        color: isPending ? "#A8A29E" : "#1C1917",
        fontStyle: isPending ? "italic" : "normal",
      }}>
        {display}
      </span>
    </div>
  );
}

// ── dominant_311_type_breakdown parser ────────────────────────────
// MapLibre GL serialises nested objects as JSON strings when returning
// feature.properties. We receive either the raw object (sidebar/quadrant
// selection path) or a JSON string (map-click path). Handle both.
function parseBreakdown(
  raw: Record<string, number> | string | null | undefined,
): Record<string, number> | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, number>;
      }
      return null;
    } catch {
      return null;
    }
  }
  return raw;
}

// ── Census formatting helpers ──────────────────────────────────────

function fmtCurrency(val: number | null | undefined): string {
  if (val == null) return "—";
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtPop(val: number | null | undefined): string {
  if (val == null) return "—";
  return val.toLocaleString("en-US");
}

function fmtVacancy(val: number | null | undefined): string {
  if (val == null) return "—";
  return `${(val * 100).toFixed(1)}%`;
}

function CensusRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      padding: "3px 0",
      borderBottom: "1px solid #F5F0EB",
      gap: "8px",
    }}>
      <span style={{ fontSize: "11px", color: "#78716C", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "11px", fontWeight: 500, textAlign: "right", color: "#1C1917" }}>
        {value}
      </span>
    </div>
  );
}

function NarrativeView({ text }: { text: string }) {
  const sections = [
    { key: "SITUATION:", isAction: false },
    { key: "ROOT CAUSE:", isAction: false },
    { key: "RECOMMENDED ACTION:", isAction: true },
  ];

  const parts: { label: string; content: string; isAction: boolean }[] = [];
  let remaining = text;
  for (const { key, isAction } of sections) {
    const idx = remaining.indexOf(key);
    if (idx === -1) continue;
    const afterKey = remaining.slice(idx + key.length).trim();
    const nextIdx = sections
      .map(s => afterKey.indexOf(s.key))
      .filter(i => i > 0)
      .reduce((min, i) => Math.min(min, i), Infinity);
    const content = isFinite(nextIdx) ? afterKey.slice(0, nextIdx).trim() : afterKey;
    parts.push({ label: key.replace(":", ""), content, isAction });
    remaining = remaining.slice(idx + key.length);
  }

  if (parts.length === 0) {
    return <p style={{ fontSize: "11px", color: "#1C1917", lineHeight: 1.5 }}>{text}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {parts.map(({ label, content, isAction }) => (
        <div
          key={label}
          style={isAction ? {
            borderLeft: "2px solid #D97706",
            paddingLeft: "8px",
            background: "#FFFBEB",
            borderRadius: "0 4px 4px 0",
            padding: "4px 4px 4px 8px",
          } : undefined}
        >
          <p style={{ fontSize: "9px", fontWeight: 600, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
            {label}
          </p>
          <p style={{ fontSize: "11px", color: "#1C1917", lineHeight: 1.4, margin: 0 }}>{content}</p>
        </div>
      ))}
    </div>
  );
}

function extractSection(text: string, key: string): string {
  const ALL_KEYS = ["SITUATION:", "ROOT CAUSE:", "RECOMMENDED ACTION:"];
  const idx = text.indexOf(key);
  if (idx === -1) return "";
  const after = text.slice(idx + key.length).trim();
  const nextIdx = ALL_KEYS
    .filter(k => k !== key)
    .map(k => after.indexOf(k))
    .filter(i => i > 0)
    .reduce((min, i) => Math.min(min, i), Infinity);
  return isFinite(nextIdx) ? after.slice(0, nextIdx).trim() : after;
}

// ── Main component ────────────────────────────────────────────────

export default function BottomSheet({ cell, isOpen, onClose }: Props) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  // Reset narrative and fade content when switching hexes
  useEffect(() => {
    if (!cell) return;
    setNarrative(null);
    setContentVisible(false);
    const t = setTimeout(() => setContentVisible(true), 150);
    return () => clearTimeout(t);
  }, [cell?.h3_index]);

  // Escape key closes the sheet
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function loadInsight() {
    if (!cell) return;
    setLoading(true);
    try {
      const text = await fetchInsight(cell.h3_index);
      setNarrative(text);
    } catch {
      setNarrative("Insight unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyBrief() {
    if (!narrative || !cell) return;
    const actionText = extractSection(narrative, "RECOMMENDED ACTION:");
    if (!actionText) return;
    const brief = [
      "URBAN YIELD AI — ACTION BRIEF",
      `Zone: ${cell.h3_index}`,
      `Zoning: ${cell.primary_zoning ?? "N/A"}`,
      `Status: ${cell.yield_label ?? "N/A"}`,
      `UVI Score: ${cell.uvi_score?.toFixed(1) ?? "—"} | Yield Score: ${cell.yield_score?.toFixed(3) ?? "—"}`,
      "",
      "RECOMMENDED ACTION:",
      actionText,
      "",
      "Generated by Urban Yield AI · City of Montgomery, AL",
    ].join("\n");
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!cell) return null;

  const isEnriched = cell.zillow_avg_price_sqft != null || cell.gmaps_avg_rating != null;

  return (
    <div
      className="bottom-sheet"
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: isOpen
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(100%)",
        width: "80%",
        background: "#FFFFFF",
        borderRadius: "16px 16px 0 0",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        zIndex: 20,
        transition: "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Drag handle */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "10px", flexShrink: 0 }}>
        <div style={{ width: "32px", height: "4px", borderRadius: "2px", background: "#D1C7BC" }} />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "8px",
          right: "12px",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#78716C",
          fontSize: "20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          lineHeight: 1,
        }}
        aria-label="Close"
      >
        ×
      </button>

      {/* Three-column content area */}
      <div
        className="flex flex-col md:flex-row overflow-y-auto md:overflow-hidden flex-1"
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: "opacity 150ms ease",
          padding: "8px 16px 14px",
          gap: "12px",
        }}
      >
        {/* ── Column A: Diagnosis (25% on desktop, full width on mobile) ── */}
        <div className="md:w-1/4 w-full flex-shrink-0 flex flex-col gap-2 md:overflow-y-auto">
          <DiagnosisBadge label={cell.yield_label} />

          {/* UVI rank indicator */}
          {cell.uvi_rank > 0 && (
            <p style={{ fontSize: "11px", color: "#78716C", textAlign: "center", marginTop: "-4px" }}>
              #{cell.uvi_rank} of 638
              {" · "}
              {cell.uvi_percentile >= 50
                ? `Top ${Math.round(100 - cell.uvi_percentile)}%`
                : `Bottom ${Math.round(cell.uvi_percentile)}%`}
            </p>
          )}

          {/* UVI + Yield scores */}
          <div className="flex gap-2">
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "#1C1917", lineHeight: 1 }}>
                {cell.uvi_score?.toFixed(1) ?? "—"}
              </p>
              <p style={{ fontSize: "10px", color: "#78716C" }}>UVI Score</p>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "#1C1917", lineHeight: 1.1 }}>
                {cell.yield_score?.toFixed(3) ?? "—"}
              </p>
              <p style={{ fontSize: "10px", color: "#78716C" }}>Yield Score</p>
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-1">
            {isEnriched && <SmallBadge label="Market Data" bg="#D97706" fg="#FFFFFF" />}
            <FlagBadge active={cell.is_infrastructure_priority} label="⚠ Priority"  bg="#FEF3C7" fg="#92400E" />
            <FlagBadge active={cell.is_infill_opportunity}      label="◆ Infill"    bg="#EDE9FE" fg="#4C1D95" />
            <FlagBadge active={cell.is_flood_zone}              label="Flood Zone"  bg="#FFEDD5" fg="#7C2D12" />
            <FlagBadge active={cell.is_historic_district}       label="🏛 Historic" bg="#EFF6FF" fg="#1E40AF" />
          </div>

          {/* Hex ID */}
          <p style={{ fontFamily: "monospace", fontSize: "10px", color: "#A8A29E", marginTop: "auto" }}>
            {cell.h3_index}
          </p>
        </div>

        {/* Vertical divider (desktop only) */}
        <div className="hidden md:block" style={{ width: "1px", background: "#E2D9CF", flexShrink: 0 }} />
        {/* Horizontal divider (mobile only) */}
        <div className="block md:hidden" style={{ height: "1px", background: "#E2D9CF" }} />

        {/* ── Column B: Signals & Activity (40% on desktop) ── */}
        <div className="md:w-[40%] w-full flex-shrink-0 flex flex-col md:overflow-y-auto">
          <SectionLabel>Market Signals</SectionLabel>
          <DataRow label="Price / sqft" value={cell.zillow_avg_price_sqft != null ? `$${cell.zillow_avg_price_sqft.toFixed(0)}` : null} />
          <DataRow label="GMaps Rating" value={cell.gmaps_avg_rating != null ? `${cell.gmaps_avg_rating.toFixed(2)} ★` : null} />
          <DataRow label="Zoning" value={cell.primary_zoning} />

          <div style={{ height: "1px", background: "#E2D9CF", margin: "6px 0" }} />

          {/* ── NEIGHBORHOOD CONTEXT ── */}
          <div style={{ marginBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <SectionLabel>Neighborhood Context</SectionLabel>
              {cell.census_coverage
                ? <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "10px", background: "#CCFBF1", color: "#0F766E", fontWeight: 600, flexShrink: 0 }}>● Census Data</span>
                : <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "10px", background: "#F5F0EB", color: "#A8A29E", fontWeight: 600, flexShrink: 0 }}>○ No Census Data</span>
              }
            </div>
            <CensusRow label="Median Income"     value={fmtCurrency(cell.census_median_income)} />
            <CensusRow label="Median Home Value"  value={fmtCurrency(cell.census_median_home_value)} />
            <CensusRow label="Median Rent"        value={cell.census_median_rent != null ? `${fmtCurrency(cell.census_median_rent)} / mo` : "—"} />
            <CensusRow label="Population"         value={fmtPop(cell.census_total_population)} />
            <CensusRow label="Vacancy Rate"       value={fmtVacancy(cell.census_vacancy_rate)} />
            <CensusRow label="UVI Rank"           value={cell.uvi_rank > 0 ? `#${cell.uvi_rank} of 638` : "—"} />
            <CensusRow label="UVI Percentile"     value={cell.uvi_rank > 0 ? `Top ${Math.round(100 - cell.uvi_percentile)}%` : "—"} />
          </div>

          <div style={{ height: "1px", background: "#E2D9CF", margin: "4px 0 6px" }} />

          <details>
            <summary style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#78716C",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: "pointer",
              userSelect: "none",
              padding: "2px 0",
              marginBottom: "2px",
            }}>
              Activity ▸
            </summary>
            <DataRow label="Permits" value={`${cell.permit_count} (${cell.active_permit_count} active)`} />
            <DataRow label="Businesses" value={cell.business_count} />
            <DataRow label="Vacant Parcels" value={cell.vacant_count} />
            <DataRow label="311 Cases" value={cell.service_request_count} />
            <DataRow label="Chronic (180d+)" value={cell.chronic_case_count > 0 ? cell.chronic_case_count : null} />
            {(() => {
              const breakdown = parseBreakdown(
                cell.dominant_311_type_breakdown as unknown as Record<string, number> | string | null
              );
              if (!breakdown || Object.keys(breakdown).length === 0) return null;
              return (
                <div style={{ paddingTop: "4px" }}>
                  {Object.entries(breakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([type, count]) => (
                      <div key={type} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#78716C", padding: "1px 0" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>{type}</span>
                        <span style={{ fontWeight: 500, color: "#1C1917", flexShrink: 0 }}>{count}</span>
                      </div>
                    ))}
                </div>
              );
            })()}
            <DataRow label="Declared Investment" value={cell.total_declared_value != null ? fmt(cell.total_declared_value, "$") : null} />
          </details>
        </div>

        {/* Vertical divider (desktop only) */}
        <div className="hidden md:block" style={{ width: "1px", background: "#E2D9CF", flexShrink: 0 }} />
        {/* Horizontal divider (mobile only) */}
        <div className="block md:hidden" style={{ height: "1px", background: "#E2D9CF" }} />

        {/* ── Column C: AI Briefing (remaining width) ── */}
        <div className="flex-1 flex flex-col md:overflow-y-auto">
          <SectionLabel>AI Briefing</SectionLabel>
          {narrative ? (
            <>
              <NarrativeView text={narrative} />
              {extractSection(narrative, "RECOMMENDED ACTION:") && (
                <button
                  onClick={handleCopyBrief}
                  style={{
                    marginTop: "8px",
                    alignSelf: "flex-start",
                    fontSize: "11px",
                    border: "1px solid #D97706",
                    color: "#92400E",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    background: copied ? "#FEF3C7" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {copied ? "✓ Copied!" : "📋 Copy Action Brief"}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={loadInsight}
              disabled={loading}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                background: loading ? "#E2D9CF" : "#D97706",
                color: "#FFFFFF",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Generating insight…" : "View AI Briefing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
