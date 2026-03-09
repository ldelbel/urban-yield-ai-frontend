import type { HexGeoJSON, AlertsResponse, HexProperties } from "../types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchHexagons(): Promise<HexGeoJSON> {
  const res = await fetch(`${API}/api/hexagons`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch hexagons");
  return res.json();
}

export async function fetchAlerts(): Promise<AlertsResponse> {
  const res = await fetch(`${API}/api/alerts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function fetchInsight(h3Id: string): Promise<string> {
  const res = await fetch(`${API}/api/insights/${h3Id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch insight");
  const data = await res.json();
  return data.narrative as string;
}

export async function fetchHealth(): Promise<{ timestamp?: string } | null> {
  try {
    const res = await fetch(`${API}/health`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function fmtMillions(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${Math.round(val / 1_000)}K`;
  return `$${val}`;
}

export function fmt(val: number | null | undefined, prefix = "", suffix = "", decimals = 0): string {
  if (val == null) return "Data pending city review";
  return `${prefix}${val.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}

export function getYieldSymbol(yieldLabel: string | null | undefined): string {
  // ▲/▼ (Geometric Shapes, U+25B2/U+25BC) are not in Open Sans's glyph coverage
  // as served by Carto's SDF font CDN. Use ↑/↓ (Arrows block, U+2191/U+2193)
  // which map tile fonts include for one-way street rendering.
  if (yieldLabel === "Accelerating") return "↑";
  if (yieldLabel === "Stable") return "–";
  if (yieldLabel === "Stagnating") return "↓";
  if (yieldLabel?.startsWith("Structurally Constrained")) return "!";
  return "?";
}

export function yieldColor(label: HexProperties["yield_label"], enriched: boolean): string {
  if (enriched) return "#D97706"; // amber — enriched (higher contrast on light basemap)
  switch (label) {
    case "Accelerating": return "#16A34A"; // darker green — readable on light bg
    case "Stable":       return "#2563EB"; // blue
    case "Stagnating":   return "#DC2626"; // red
    case "Low Confidence": return "#A8A29E"; // warm gray
    case "Structurally Constrained — Flood Zone":
    case "Structurally Constrained — Historic District":
    case "Structurally Constrained — Flood + Historic":
      return "#7C3AED"; // purple — unchanged
    default: return "#A8A29E";
  }
}
