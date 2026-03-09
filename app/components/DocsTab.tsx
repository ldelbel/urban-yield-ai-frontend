"use client";

import { useState } from "react";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

function AccordionItem({
  section,
  open,
  onToggle,
}: {
  section: Section;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "#fff", border: "1px solid #E2D9CF" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ background: "none", cursor: "pointer" }}
      >
        <span style={{ fontWeight: 600, fontSize: 15, color: "#1C1917" }}>
          {section.title}
        </span>
        <span style={{ fontSize: 18, color: "#78716C", lineHeight: 1 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5" style={{ borderTop: "1px solid #E2D9CF" }}>
          <div className="pt-4">{section.content}</div>
        </div>
      )}
    </div>
  );
}

const SIGNAL_ROWS = [
  { signal: "Investment", weight: "0.30", source: "total_declared_value (fallback: permit_count)", detail: "Min-max normalized" },
  { signal: "Sentiment", weight: "0.20", source: "gmaps_avg_rating + review_count + closed_count", detail: "Review-volume weighted; −0.15 penalty for closed businesses" },
  { signal: "Market", weight: "0.20", source: "zillow_avg_price_sqft + days_on_market + price_reduction_count", detail: "0.60×price + 0.25×liquidity + 0.15×reduction_pressure" },
  { signal: "Risk (inverted)", weight: "0.15", source: "service_request_count + chronic_case_count", detail: "0.6×volume + 0.4×chronicity, then inverted" },
  { signal: "SocioEconomic", weight: "0.10", source: "Census income (B19013) + home value (B25077)", detail: "0.6×income + 0.4×home_value" },
  { signal: "Density", weight: "0.05", source: "Census population (B01003) + vacancy_rate", detail: "0.5×pop + 0.5×(1 − vacancy_rate)" },
];

const DATA_SOURCE_ROWS = [
  { name: "Building Permits", type: "ArcGIS FeatureServer", detail: "Montgomery AL — Building_Permit_viewlayer" },
  { name: "Business Licenses", type: "ArcGIS FeatureServer", detail: "Montgomery AL — Business_view" },
  { name: "311 / Code Enforcement", type: "ArcGIS FeatureServer", detail: "Code_Enforcement_view + Received_311_Service_Request (fallback)" },
  { name: "Vacant Properties", type: "ArcGIS FeatureServer", detail: "Vacant_Properties/FeatureServer/2" },
  { name: "Zoning", type: "ArcGIS FeatureServer", detail: "Zoning_HN/FeatureServer/0 (async batched spatial queries)" },
  { name: "Census ACS (5-yr)", type: "Census Bureau API", detail: "2022 ACS — income, home value, rent, population, vacancy rate" },
  { name: "Census Tract Boundaries", type: "TIGERweb REST", detail: "EPSG:4326, 100 records/page, used for spatial join" },
];

const sections: Section[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <div style={{ color: "#44403C", fontSize: 14, lineHeight: 1.7 }}>
        <p>
          <strong>Urban Yield AI</strong> is a geospatial intelligence platform for the{" "}
          <strong>City of Montgomery, Alabama</strong>. It ingests real-time municipal data,
          aggregates it into <strong>H3 hexagonal tiles (resolution 8)</strong>, and computes two
          composite scores per tile:
        </p>
        <ul className="mt-3 ml-5 list-disc space-y-1">
          <li>
            <strong>Urban Vitality Index (UVI)</strong> — a 0–100 composite of investment,
            sentiment, market, risk, socioeconomic, and density signals.
          </li>
          <li>
            <strong>Yield Score</strong> — momentum relative to a permit-activity baseline,
            labelled Accelerating / Stable / Stagnating / Low Confidence.
          </li>
        </ul>
        <p className="mt-3">
          The platform surfaces <strong>Infrastructure Priority</strong> alerts (growth zones under
          disproportionate 311 pressure) and <strong>Infill Opportunity</strong> alerts (vacant
          commercial parcels with stagnating yield). AI-generated narratives explain each
          hexagon's situation, root cause, and recommended action.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Active Hexagons", value: "638" },
            { label: "Census Tracts", value: "~70" },
            { label: "H3 Resolution", value: "8" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg p-3 text-center"
              style={{ background: "#F5F0EB" }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: "#D97706" }}>{value}</div>
              <div style={{ fontSize: 12, color: "#78716C" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "data-sources",
    title: "Data Sources",
    content: (
      <div>
        <p style={{ color: "#44403C", fontSize: 14, marginBottom: 12 }}>
          9 ingestors run concurrently in Phase 1 of the pipeline via{" "}
          <code style={{ background: "#F8F6F2", padding: "1px 4px", borderRadius: 3, fontSize: 12 }}>
            asyncio.gather
          </code>
          .
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F5F0EB" }}>
                {["Source", "Type", "Detail"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#44403C",
                      borderBottom: "1px solid #E2D9CF",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATA_SOURCE_ROWS.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F0EDE8" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1C1917" }}>
                    {row.name}
                  </td>
                  <td style={{ padding: "8px 12px", color: "#78716C" }}>{row.type}</td>
                  <td style={{ padding: "8px 12px", color: "#44403C" }}>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "uvi",
    title: "UVI Score",
    content: (
      <div>
        <p style={{ color: "#44403C", fontSize: 14, marginBottom: 12 }}>
          All signals are min-max normalized to [0, 1] across all active hexagons. UVI is stored
          on a 0–100 scale.
        </p>
        <pre
          className="font-mono rounded"
          style={{
            background: "#F8F6F2",
            border: "1px solid #E2D9CF",
            padding: 12,
            fontSize: 13,
            overflowX: "auto",
            color: "#1C1917",
          }}
        >{`UVI = 0.30 × Investment
    + 0.20 × Sentiment
    + 0.20 × Market
    + 0.15 × Risk (inverted)
    + 0.10 × SocioEconomic
    + 0.05 × Density

UVI stored as UVI × 100  →  range: 0–100`}</pre>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F5F0EB" }}>
                {["Signal", "Weight", "Source", "Detail"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#44403C",
                      borderBottom: "1px solid #E2D9CF",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIGNAL_ROWS.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F0EDE8" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1C1917" }}>
                    {row.signal}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      fontWeight: 700,
                      color: "#D97706",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {row.weight}
                  </td>
                  <td style={{ padding: "8px 12px", color: "#78716C", fontSize: 12 }}>
                    {row.source}
                  </td>
                  <td style={{ padding: "8px 12px", color: "#44403C" }}>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "yield",
    title: "Yield Score",
    content: (
      <div>
        <p style={{ color: "#44403C", fontSize: 14, marginBottom: 12 }}>
          Yield measures investment momentum relative to the permit-activity baseline.
        </p>
        <pre
          className="font-mono rounded"
          style={{
            background: "#F8F6F2",
            border: "1px solid #E2D9CF",
            padding: 12,
            fontSize: 13,
            overflowX: "auto",
            color: "#1C1917",
          }}
        >{`momentum    = 0.30×Investment + 0.20×Sentiment + 0.10×SocioEconomic
baseline    = normalized permit_count  (min 0.01)
yield_score = momentum / baseline

Low-confidence penalty: if permit_count < 5 → yield_score × 0.2`}</pre>
        <div className="grid grid-cols-2 gap-3 mt-4" style={{ fontSize: 13 }}>
          {[
            { label: "Accelerating", condition: "yield_score > 1.1", color: "#16A34A", bg: "#F0FDF4" },
            { label: "Stable", condition: "0.8 ≤ yield_score ≤ 1.1", color: "#2563EB", bg: "#EFF6FF" },
            { label: "Stagnating", condition: "yield_score < 0.8", color: "#DC2626", bg: "#FEF2F2" },
            { label: "Low Confidence", condition: "permit_count < 5", color: "#78716C", bg: "#F5F5F4" },
          ].map(({ label, condition, color, bg }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: bg }}>
              <div style={{ fontWeight: 700, color }}>{label}</div>
              <div style={{ color: "#78716C", fontSize: 12, marginTop: 2 }}>{condition}</div>
            </div>
          ))}
        </div>
        <div
          className="rounded-lg p-3 mt-4"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 13 }}
        >
          <strong style={{ color: "#92400E" }}>Structural Override:</strong>{" "}
          <span style={{ color: "#78350F" }}>
            Stagnating cells in flood zones or historic districts receive a "Structurally
            Constrained" label and are excluded from infill opportunity alerts.
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "flags",
    title: "Strategic Flags",
    content: (
      <div className="grid grid-cols-1 gap-4" style={{ fontSize: 14 }}>
        {[
          {
            title: "Infrastructure Priority",
            icon: "⚠️",
            condition:
              'yield_label == "Accelerating" AND service_request_count > avg_service_requests × 1.4',
            desc: "Growth zones under disproportionate 311 / code-enforcement pressure. Signals that infrastructure investment is needed to sustain momentum.",
            color: "#D97706",
            bg: "#FFFBEB",
            border: "#FDE68A",
          },
          {
            title: "Infill Opportunity",
            icon: "🏗",
            condition:
              'primary_zoning ∈ {B-1-a … B-5} AND yield_label == "Stagnating" AND vacant_count > 0',
            desc: "Commercially-zoned parcels with existing vacancies and stagnating yield — high-priority targets for infill development incentives.",
            color: "#2563EB",
            bg: "#EFF6FF",
            border: "#BFDBFE",
          },
        ].map(({ title, icon, condition, desc, color, bg, border }) => (
          <div
            key={title}
            className="rounded-lg p-4"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div style={{ fontWeight: 700, color, fontSize: 15 }}>
              {icon} {title}
            </div>
            <pre
              className="font-mono mt-2 rounded"
              style={{
                background: "#F8F6F2",
                border: "1px solid #E2D9CF",
                padding: 8,
                fontSize: 12,
                whiteSpace: "pre-wrap",
                color: "#1C1917",
              }}
            >
              {condition}
            </pre>
            <p className="mt-2" style={{ color: "#44403C", lineHeight: 1.6 }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "interpretation",
    title: "Interpretation Guide",
    content: (
      <div style={{ fontSize: 14, color: "#44403C", lineHeight: 1.7 }}>
        <div
          className="rounded-lg p-4 mb-4"
          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
        >
          <strong style={{ color: "#15803D" }}>High UVI + Accelerating Yield</strong>
          <p className="mt-1" style={{ color: "#166534" }}>
            Strong investment momentum backed by real economic activity. These hexagons are
            delivering results. Watch for infrastructure strain (is_infrastructure_priority flag).
          </p>
        </div>
        <div
          className="rounded-lg p-4 mb-4"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <strong style={{ color: "#DC2626" }}>Low UVI + Stagnating Yield</strong>
          <p className="mt-1" style={{ color: "#991B1B" }}>
            These areas are underperforming relative to their permit baseline. Check for
            commercial vacancies (is_infill_opportunity flag) and 311 complaint clustering.
          </p>
        </div>
        <div
          className="rounded-lg p-4 mb-4"
          style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
        >
          <strong style={{ color: "#1D4ED8" }}>High UVI + Stagnating Yield</strong>
          <p className="mt-1" style={{ color: "#1E40AF" }}>
            Structurally sound but underutilised. Often historic districts or transitional zones.
            Good candidates for targeted zoning or density incentives.
          </p>
        </div>
        <div
          className="rounded-lg p-4"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <strong style={{ color: "#92400E" }}>Low Confidence label</strong>
          <p className="mt-1" style={{ color: "#78350F" }}>
            Fewer than 5 building permits in the aggregation window. Yield score is penalised
            ×0.2. Treat these hexagons as data-sparse rather than definitively stagnating.
          </p>
        </div>
      </div>
    ),
  },
];

export default function DocsTab() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F5F0EB" }}>
      <div className="mx-auto px-6 py-8" style={{ maxWidth: 800 }}>
        <h1
          style={{ fontSize: 24, fontWeight: 700, color: "#1C1917", marginBottom: 4 }}
        >
          Technical Reference
        </h1>
        <p style={{ color: "#78716C", fontSize: 14, marginBottom: 24 }}>
          Urban Yield AI — geospatial intelligence for Montgomery, AL
        </p>
        <div className="flex flex-col gap-3">
          {sections.map((section) => (
            <AccordionItem
              key={section.id}
              section={section}
              open={openId === section.id}
              onToggle={() => toggle(section.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
