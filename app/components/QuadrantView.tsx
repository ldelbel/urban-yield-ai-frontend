"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Label,
} from "recharts";
import type { ScatterShapeProps } from "recharts";
import type { HexFeature, HexProperties } from "../types";

// ── Types ─────────────────────────────────────────────────────────────

type YieldLabel = HexProperties["yield_label"];

interface ScatterPoint {
  x: number;
  y: number;
  h3_index: string;
  yield_label: YieldLabel;
  uvi_score: number;
  uvi_rank: number;
  yield_score: number;
  census_coverage: boolean;
  census_median_income: number | null;
  zillow_avg_price_sqft: number | null;
}

interface Props {
  hexagons: HexFeature[];
  onHexagonSelect: (h3Id: string) => void;
  selectedHexId: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────

function getPointColor(label: YieldLabel): string {
  switch (label) {
    case "Accelerating":   return "#16A34A";
    case "Stable":         return "#D97706";
    case "Stagnating":     return "#DC2626";
    case "Low Confidence": return "#A8A29E";
    default:               return "#7C3AED"; // all Structurally Constrained variants
  }
}

// ── Custom dot (SVG circle, rendered via Recharts shape prop) ─────────

function renderScatterDot(
  dotProps: ScatterShapeProps,
  selectedHexId: string | null,
): React.ReactElement {
  const { cx, cy } = dotProps;
  const payload = (dotProps as unknown as { payload?: ScatterPoint }).payload;

  if (!payload || cx == null || cy == null) return <g />;

  const isSelected = selectedHexId === payload.h3_index;
  const isEnriched = payload.zillow_avg_price_sqft != null;
  const color = getPointColor(payload.yield_label);
  const r = isSelected ? 7 : 4;
  const stroke = isSelected ? "#1C1917" : isEnriched ? "#D97706" : "none";
  const strokeWidth = isSelected || isEnriched ? 1.5 : 0;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      fillOpacity={isSelected ? 1.0 : 0.7}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ cursor: "pointer" }}
    />
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScatterPoint }>;
}

function CustomTooltip({ active, payload }: TooltipProps): React.ReactElement | null {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const color = getPointColor(d.yield_label);

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E2D9CF",
      borderRadius: "6px",
      padding: "8px 12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <p style={{ fontFamily: "monospace", fontSize: "10px", color: "#78716C", marginBottom: "4px" }}>
        {d.h3_index}
      </p>
      <span style={{
        display: "inline-block",
        fontSize: "9px",
        fontWeight: 600,
        padding: "1px 5px",
        borderRadius: "3px",
        background: color + "22",
        color,
        marginBottom: "4px",
      }}>
        {d.yield_label ?? "Unknown"}
      </span>
      <p style={{ fontSize: "11px", color: "#1C1917" }}>
        UVI: {d.uvi_score.toFixed(1)} · #{d.uvi_rank} of 638
      </p>
      <p style={{ fontSize: "11px", color: "#1C1917" }}>
        Yield: {d.yield_score.toFixed(3)}
      </p>
      {d.census_coverage && d.census_median_income != null && (
        <p style={{ fontSize: "11px", color: "#78716C" }}>
          Income: {d.census_median_income.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          })}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export default function QuadrantView({ hexagons, onHexagonSelect, selectedHexId }: Props) {
  const points = useMemo<ScatterPoint[]>(() =>
    hexagons
      .filter(f => f.properties.uvi_score != null && f.properties.yield_score != null)
      .map(f => ({
        x: f.properties.uvi_score!,
        y: Math.min(f.properties.yield_score!, 2.5),
        h3_index: f.properties.h3_index,
        yield_label: f.properties.yield_label,
        uvi_score: f.properties.uvi_score!,
        uvi_rank: f.properties.uvi_rank,
        yield_score: f.properties.yield_score!,
        census_coverage: f.properties.census_coverage,
        census_median_income: f.properties.census_median_income,
        zillow_avg_price_sqft: f.properties.zillow_avg_price_sqft,
      })),
    [hexagons]
  );

  const counts = useMemo(() => {
    let priority = 0, thriving = 0, intervention = 0, watch = 0;
    for (const f of hexagons) {
      const uvi = f.properties.uvi_score;
      const y = f.properties.yield_score;
      if (uvi == null || y == null) continue;
      if (uvi < 50 && y >= 0.8 && f.properties.yield_label === "Accelerating") priority++;
      else if (uvi >= 50 && y >= 0.8) thriving++;
      else if (uvi < 50 && y < 0.8) intervention++;
      else if (uvi >= 50 && y < 0.8) watch++;
    }
    return { priority, thriving, intervention, watch };
  }, [hexagons]);

  const handleClick = (data: ScatterPoint) => {
    onHexagonSelect(data.h3_index);
  };

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#F8F6F2",
      borderLeft: "1px solid #E2D9CF",
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        background: "#F8F6F2",
        borderBottom: "1px solid #E2D9CF",
        padding: "12px 16px",
        flexShrink: 0,
      }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "#1C1917", marginBottom: "1px" }}>
          Urban Quadrant Analysis
        </p>
        <p style={{ fontSize: "11px", color: "#78716C", marginBottom: "6px" }}>
          UVI Score vs. Yield Momentum
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {([
            { label: "PRIORITY",     color: "#DC2626" },
            { label: "THRIVING",     color: "#0D9488" },
            { label: "INTERVENTION", color: "#7C3AED" },
            { label: "WATCH",        color: "#D97706" },
          ] as const).map(({ label, color }) => (
            <span key={label} style={{ fontSize: "9px", fontWeight: 700, color }}>
              ● {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Chart body ──────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: "16px", background: "#FFFFFF", minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 36, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE5" />

            {/* Quadrant background fills */}
            <ReferenceArea x1={0}  x2={50}  y1={0.8} y2={2.5} fill="rgba(220,38,38,0.04)">
              <Label value="PRIORITY" position="insideTopLeft"
                style={{ fontSize: "9px", fontWeight: 700, fill: "#DC2626" }} />
            </ReferenceArea>
            <ReferenceArea x1={50} x2={100} y1={0.8} y2={2.5} fill="rgba(13,148,136,0.04)">
              <Label value="THRIVING" position="insideTopRight"
                style={{ fontSize: "9px", fontWeight: 700, fill: "#0D9488" }} />
            </ReferenceArea>
            <ReferenceArea x1={0}  x2={50}  y1={0}   y2={0.8} fill="rgba(124,58,237,0.04)">
              <Label value="INTERVENTION" position="insideBottomLeft"
                style={{ fontSize: "9px", fontWeight: 700, fill: "#7C3AED" }} />
            </ReferenceArea>
            <ReferenceArea x1={50} x2={100} y1={0}   y2={0.8} fill="rgba(217,119,6,0.04)">
              <Label value="WATCH" position="insideBottomRight"
                style={{ fontSize: "9px", fontWeight: 700, fill: "#D97706" }} />
            </ReferenceArea>

            {/* Quadrant dividers */}
            <ReferenceLine x={50}  stroke="#E2D9CF" strokeDasharray="4 4" strokeWidth={1} />
            <ReferenceLine y={0.8} stroke="#E2D9CF" strokeDasharray="4 4" strokeWidth={1} />

            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 100]}
              tickCount={5}
              tick={{ fontSize: 9, fill: "#A8A29E" }}
            >
              <Label value="UVI Score →" position="insideBottomRight" offset={-8}
                style={{ fontSize: "10px", fill: "#78716C" }} />
            </XAxis>

            <YAxis
              dataKey="y"
              type="number"
              domain={[0, 2.5]}
              tickCount={5}
              tick={{ fontSize: 9, fill: "#A8A29E" }}
            >
              <Label value="Yield ↑" angle={-90} position="insideTopLeft" offset={16}
                style={{ fontSize: "10px", fill: "#78716C" }} />
            </YAxis>

            <Tooltip content={<CustomTooltip />} />

            <Scatter
              data={points}
              onClick={(data) => handleClick(data as unknown as ScatterPoint)}
              shape={(props: ScatterShapeProps) => renderScatterDot(props, selectedHexId)}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ── Quadrant summary stats ──────────────────────────────── */}
      <div style={{
        height: "64px",
        background: "#F8F6F2",
        borderTop: "1px solid #E2D9CF",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}>
        {([
          { label: "PRIORITY",     color: "#DC2626", count: counts.priority,     emphasis: true  },
          { label: "THRIVING",     color: "#0D9488", count: counts.thriving,     emphasis: false },
          { label: "INTERVENTION", color: "#7C3AED", count: counts.intervention, emphasis: false },
          { label: "WATCH",        color: "#D97706", count: counts.watch,        emphasis: false },
        ] as const).map(({ label, color, count, emphasis }) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontSize: "9px", fontWeight: 700, color, marginBottom: "2px" }}>
              ● {label}
            </p>
            <p style={{
              fontSize: emphasis ? "13px" : "11px",
              fontWeight: emphasis ? 700 : 400,
              color: "#1C1917",
            }}>
              {count}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
