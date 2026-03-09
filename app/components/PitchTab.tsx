"use client";

import { useState, useEffect, useCallback } from "react";

const NAVY = "#1E3A5F";
const AMBER = "#D97706";
const WHITE = "#FFFFFF";

/* ─── Slide data ────────────────────────────────────────────────────── */

interface Slide {
  id: number;
  dark?: boolean; // navy bg
  title: string;
  content: React.ReactNode;
}

function MontgomeryBadge({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: NAVY,
          border: `2px solid ${AMBER}`,
        }}
      >
        <span style={{ fontSize: 20 }}>🏛</span>
      </div>
      <div>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>City of Montgomery, AL</div>
        <div style={{ color: "#78716C", fontSize: 12 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function SlideHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        background: NAVY,
        margin: "-24px -24px 24px -24px",
        padding: "16px 24px",
        minHeight: 72,
        display: "flex",
        alignItems: "center",
        borderRadius: "12px 12px 0 0",
      }}
    >
      <h2 style={{ color: WHITE, fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
    </div>
  );
}

const SLIDES: Slide[] = [
  /* 1 — Cover */
  {
    id: 1,
    dark: true,
    title: "Urban Yield AI",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center gap-6">
        <div style={{ fontSize: 56 }}>🏙</div>
        <div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: WHITE, margin: 0 }}>
            Urban Yield AI
          </h1>
          <p style={{ color: "#93C5FD", fontSize: 16, marginTop: 8 }}>
            Geospatial Intelligence for Municipal Investment
          </p>
        </div>
        <div
          className="rounded-full px-5 py-2"
          style={{ background: AMBER, color: WHITE, fontWeight: 700, fontSize: 14 }}
        >
          City of Montgomery, Alabama
        </div>
        <p style={{ color: "#CBD5E1", fontSize: 13, maxWidth: 480 }}>
          Real-time data · H3 hexagonal scoring · AI-powered narrative briefings
        </p>
      </div>
    ),
  },

  /* 2 — The Problem */
  {
    id: 2,
    title: "The Problem",
    content: (
      <div>
        <SlideHeader title="The Problem" />
        <MontgomeryBadge subtitle="Urban planning & economic development" />
        <div className="grid grid-cols-1 gap-3" style={{ fontSize: 14 }}>
          {[
            {
              icon: "📂",
              text: "City data lives in siloed ArcGIS layers — permits, 311 calls, vacancies, zoning — with no unified view.",
            },
            {
              icon: "⏳",
              text: "Planners spend days assembling spreadsheets to answer: \"Where should we invest next?\"",
            },
            {
              icon: "📉",
              text: "Investment decisions lag reality by months, missing momentum windows and over-serving already-healthy zones.",
            },
            {
              icon: "🔇",
              text: "No early-warning system for infrastructure strain in high-growth corridors before it becomes a crisis.",
            },
          ].map(({ icon, text }, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg p-3"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
            >
              <span style={{ fontSize: 20, lineHeight: 1.4 }}>{icon}</span>
              <p style={{ color: "#7F1D1D", lineHeight: 1.6, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  /* 3 — Solution: The Quadrant */
  {
    id: 3,
    title: "The Solution",
    content: (
      <div>
        <SlideHeader title="The Solution: Two Scores, One Map" />
        <p style={{ color: "#44403C", fontSize: 13, marginBottom: 16 }}>
          Every H3 hex gets a <strong>UVI</strong> (Urban Vitality Index, 0–100) and a{" "}
          <strong>Yield Score</strong> (momentum ratio). Together they define an action quadrant.
        </p>
        {/* 2×2 Quadrant */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
          {[
            {
              label: "LEVERAGE",
              sub: "High UVI · Accelerating",
              bg: "#F0FDF4",
              border: "#86EFAC",
              color: "#15803D",
              icon: "🚀",
              desc: "Sustain momentum. Watch for infrastructure strain.",
            },
            {
              label: "UNLOCK",
              sub: "Low UVI · Accelerating",
              bg: "#FFFBEB",
              border: "#FDE68A",
              color: "#B45309",
              icon: "🔑",
              desc: "Rising tide with structural gaps. Targeted investment.",
            },
            {
              label: "INVESTIGATE",
              sub: "High UVI · Stagnating",
              bg: "#EFF6FF",
              border: "#93C5FD",
              color: "#1D4ED8",
              icon: "🔍",
              desc: "Healthy fundamentals, under-utilised. Zoning review.",
            },
            {
              label: "INTERVENE",
              sub: "Low UVI · Stagnating",
              bg: "#FEF2F2",
              border: "#FECACA",
              color: "#DC2626",
              icon: "🚨",
              desc: "Structural decline. Infill opportunities identified.",
            },
          ].map(({ label, sub, bg, border, color, icon, desc }) => (
            <div
              key={label}
              className="rounded-lg p-3"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div style={{ fontWeight: 800, color, fontSize: 13 }}>
                {icon} {label}
              </div>
              <div style={{ color: "#78716C", fontSize: 11, marginTop: 2 }}>{sub}</div>
              <p style={{ color: "#44403C", fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
        <div
          className="rounded-lg p-3 mt-3 text-center"
          style={{ background: "#F5F0EB", fontSize: 12, color: "#78716C" }}
        >
          ← Low UVI &nbsp;&nbsp;|&nbsp;&nbsp; High UVI → &nbsp;·&nbsp; ↑ Accelerating &nbsp;|&nbsp;↓ Stagnating
        </div>
      </div>
    ),
  },

  /* 4 — Data Pipeline */
  {
    id: 4,
    title: "Data Pipeline",
    content: (
      <div>
        <SlideHeader title="6-Phase Real-Time Pipeline" />
        <div className="flex flex-col gap-2" style={{ fontSize: 13 }}>
          {[
            { phase: "1", label: "Ingest", desc: "9 sources concurrently — ArcGIS permits, licenses, 311, vacancies, zoning + Census ACS + TIGERweb" },
            { phase: "2", label: "Aggregate", desc: "Point data → H3 resolution-8 hexagons (638 tiles covering Montgomery County)" },
            { phase: "3", label: "Spatial Join", desc: "Zoning assignment via async ArcGIS polygon queries + Census tract join via Shapely" },
            { phase: "4", label: "Score", desc: "UVI formula (6 signals) + Yield Score + derived flags computed across all hexagons" },
            { phase: "5", label: "Enrich", desc: "BrightData MCP: Zillow price/sqft + Google Maps ratings via Claude Haiku (cache-first)" },
            { phase: "6", label: "Narrate", desc: "Claude Sonnet generates hex-level AI briefings: Situation · Root Cause · Recommended Action" },
          ].map(({ phase, label, desc }) => (
            <div key={phase} className="flex items-start gap-3 rounded-lg p-3" style={{ background: "#F8F6F2", border: "1px solid #E2D9CF" }}>
              <div
                className="shrink-0 flex items-center justify-center rounded-full"
                style={{ width: 28, height: 28, background: NAVY, color: WHITE, fontWeight: 700, fontSize: 12 }}
              >
                {phase}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#1C1917" }}>{label}</div>
                <div style={{ color: "#78716C", marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  /* 5 — Alerts */
  {
    id: 5,
    title: "Actionable Alerts",
    content: (
      <div>
        <SlideHeader title="Two Actionable Alert Types" />
        <div className="grid grid-cols-1 gap-4" style={{ fontSize: 14 }}>
          {[
            {
              title: "Infrastructure Priority",
              icon: "⚠️",
              color: AMBER,
              bg: "#FFFBEB",
              border: "#FDE68A",
              bullets: [
                "Triggered when a growth zone (Accelerating yield) has 311 + code enforcement volume > 1.4× city average",
                "Signals physical infrastructure must scale with economic momentum",
                "Shown in sidebar sorted by chronic case count",
              ],
            },
            {
              title: "Infill Opportunity",
              icon: "🏗",
              color: "#2563EB",
              bg: "#EFF6FF",
              border: "#BFDBFE",
              bullets: [
                "Commercial zoning (B-1-a through B-5) + stagnating yield + at least 1 vacant parcel",
                "High-ROI targets for incentive programs or developer outreach",
                "Structurally constrained sites (flood / historic) automatically excluded",
              ],
            },
          ].map(({ title, icon, color, bg, border, bullets }) => (
            <div key={title} className="rounded-lg p-4" style={{ background: bg, border: `1px solid ${border}` }}>
              <div style={{ fontWeight: 700, color, fontSize: 15, marginBottom: 10 }}>
                {icon} {title}
              </div>
              <ul className="ml-4 list-disc space-y-1" style={{ color: "#44403C", lineHeight: 1.6 }}>
                {bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  /* 6 — UVI deep dive */
  {
    id: 6,
    title: "UVI Score Deep Dive",
    content: (
      <div>
        <SlideHeader title="Urban Vitality Index — 6 Signals" />
        <p style={{ fontSize: 13, color: "#44403C", marginBottom: 16 }}>
          All signals normalised to [0, 1] across the city. Final score 0–100.
        </p>
        {/* Weighted bar */}
        <div className="flex rounded overflow-hidden mb-4" style={{ height: 28, fontSize: 11, fontWeight: 700 }}>
          {[
            { label: "Investment", pct: 30, color: "#1D4ED8" },
            { label: "Sentiment", pct: 20, color: "#7C3AED" },
            { label: "Market", pct: 20, color: "#0891B2" },
            { label: "Risk⁻¹", pct: 15, color: "#DC2626" },
            { label: "SocioEc", pct: 10, color: "#16A34A" },
            { label: "Density", pct: 5, color: "#D97706" },
          ].map(({ label, pct, color }) => (
            <div
              key={label}
              className="flex items-center justify-center"
              style={{ width: `${pct}%`, background: color, color: WHITE }}
            >
              {pct >= 15 ? `${label} ${pct}%` : `${pct}%`}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2" style={{ fontSize: 12 }}>
          {[
            { signal: "Investment (30%)", src: "Permit declared value → economic activity proxy" },
            { signal: "Sentiment (20%)", src: "Google Maps ratings × review volume" },
            { signal: "Market (20%)", src: "Zillow $/sqft · days on market · price cuts" },
            { signal: "Risk inverted (15%)", src: "311 volume + chronic case chronicity" },
            { signal: "SocioEconomic (10%)", src: "Census ACS median income + home value" },
            { signal: "Density (5%)", src: "Census population + city vacancy rate" },
          ].map(({ signal, src }) => (
            <div key={signal} className="rounded p-2" style={{ background: "#F5F0EB", border: "1px solid #E2D9CF" }}>
              <div style={{ fontWeight: 700, color: "#1C1917" }}>{signal}</div>
              <div style={{ color: "#78716C", marginTop: 2 }}>{src}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  /* 7 — AI Narratives */
  {
    id: 7,
    title: "AI-Powered Briefings",
    content: (
      <div>
        <SlideHeader title="AI Narrative Briefings" />
        <p style={{ color: "#44403C", fontSize: 13, marginBottom: 16 }}>
          Every hexagon gets a Claude-generated briefing answering three questions a planner actually needs:
        </p>
        <div className="flex flex-col gap-3" style={{ fontSize: 13 }}>
          {[
            { label: "SITUATION", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", desc: "What is happening in this area right now? Synthesises permit activity, 311 data, and market signals." },
            { label: "ROOT CAUSE", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", desc: "Why is the area performing this way? Structural, demographic, or market-driven explanation." },
            { label: "RECOMMENDED ACTION", color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", desc: "What should the city do? Specific intervention — zoning change, infrastructure spend, incentive program." },
          ].map(({ label, color, bg, border, desc }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: bg, border: `1px solid ${border}` }}>
              <div style={{ fontWeight: 800, color, letterSpacing: "0.05em", fontSize: 11 }}>{label}</div>
              <p style={{ color: "#44403C", margin: "4px 0 0 0", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
        <div
          className="rounded-lg p-3 mt-3"
          style={{ background: "#F8F6F2", border: "1px solid #E2D9CF", fontSize: 12, color: "#78716C" }}
        >
          Narratives cached server-side (schema v3). Regenerated on-demand via{" "}
          <code style={{ background: "#EEE", padding: "0 3px", borderRadius: 2 }}>
            POST /api/admin/enrich
          </code>
          .
        </div>
      </div>
    ),
  },

  /* 8 — Tech Stack */
  {
    id: 8,
    title: "Technology Stack",
    content: (
      <div>
        <SlideHeader title="Technology Stack" />
        <div className="grid grid-cols-2 gap-3" style={{ fontSize: 13 }}>
          {[
            { layer: "Frontend", items: ["Next.js 15 (App Router)", "MapLibre GL JS", "Tailwind CSS v4", "TypeScript"] },
            { layer: "Backend", items: ["FastAPI (Python 3.11)", "H3-py (Uber H3)", "Shapely (spatial joins)", "Pydantic v2 settings"] },
            { layer: "AI / Enrichment", items: ["Claude Sonnet (narratives)", "Claude Haiku (enrichment)", "BrightData MCP Server", "Anthropic SDK (async)"] },
            { layer: "Data", items: ["ArcGIS REST FeatureServer", "Census Bureau ACS API", "TIGERweb boundaries", "JSON enrichment cache"] },
          ].map(({ layer, items }) => (
            <div key={layer} className="rounded-lg p-3" style={{ background: "#F8F6F2", border: "1px solid #E2D9CF" }}>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>{layer}</div>
              <ul className="space-y-1" style={{ color: "#44403C", paddingLeft: 16, listStyle: "disc" }}>
                {items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="rounded-lg p-3 mt-3"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 12, color: "#78350F" }}
        >
          <strong>No new infrastructure required.</strong> Fully serverless-compatible. Reads
          directly from Montgomery's existing ArcGIS and Census APIs.
        </div>
      </div>
    ),
  },

  /* 9 — Traction & Next Steps */
  {
    id: 9,
    title: "Traction & Roadmap",
    content: (
      <div>
        <SlideHeader title="Traction & Roadmap" />
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { value: "638", label: "Hexagons scored", color: "#16A34A" },
            { value: "9", label: "Live data sources", color: "#2563EB" },
            { value: "6", label: "Pipeline phases", color: AMBER },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-lg p-3 text-center" style={{ background: "#F5F0EB" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: "#78716C" }}>{label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2" style={{ fontSize: 13 }}>
          {[
            { phase: "v1", label: "Live (Now)", items: ["638 hexagons scored, map live", "Infrastructure + infill alerts", "AI briefings cached for 10 hexagons"] },
            { phase: "v2", label: "30 days", items: ["Full BrightData enrichment (all 638 cells)", "Trend tracking (week-over-week delta)", "CSV/PDF export for planners"] },
            { phase: "v3", label: "90 days", items: ["Multi-city support (Birmingham, Huntsville)", "Custom alert thresholds per zoning code", "GIS integration (ArcGIS Online, QGIS plugin)"] },
          ].map(({ phase, label, items }) => (
            <div key={phase} className="flex items-start gap-3 rounded-lg p-3" style={{ background: "#F8F6F2", border: "1px solid #E2D9CF" }}>
              <div
                className="shrink-0 rounded px-2 py-0.5"
                style={{ background: NAVY, color: WHITE, fontSize: 11, fontWeight: 700 }}
              >
                {phase}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#1C1917" }}>{label}</div>
                <ul className="mt-1 ml-4 list-disc space-y-0.5" style={{ color: "#78716C" }}>
                  {items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  /* 10 — CTA */
  {
    id: 10,
    dark: true,
    title: "Get Started",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center gap-6">
        <div style={{ fontSize: 48 }}>🎯</div>
        <div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: WHITE, margin: 0 }}>
            Ready to put your city data to work?
          </h2>
          <p style={{ color: "#93C5FD", marginTop: 10, fontSize: 15 }}>
            Urban Yield AI turns Montgomery's existing ArcGIS, Census, and 311 data
            into a real-time investment intelligence layer — no new infrastructure required.
          </p>
        </div>
        <div className="flex flex-col gap-3" style={{ maxWidth: 420, width: "100%" }}>
          {[
            { icon: "🗺", text: "Live map — running right now on the Map tab" },
            { icon: "🤖", text: "AI briefings on 10 hexagons in the enrichment cache" },
            { icon: "📡", text: "Full enrichment available via POST /api/admin/enrich" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-lg p-3"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ color: "#E2E8F0", fontSize: 14 }}>{text}</span>
            </div>
          ))}
        </div>
        <div style={{ color: "#64748B", fontSize: 13 }}>
          Urban Yield AI · Montgomery, Alabama · 2025
        </div>
      </div>
    ),
  },
];

/* ─── PitchTab ──────────────────────────────────────────────────────── */

export default function PitchTab() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(SLIDES.length - 1, c + 1)), []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const slide = SLIDES[current];

  return (
    <div
      className="h-full overflow-y-auto flex items-start justify-center py-8 px-4"
      style={{ background: "#F5F0EB" }}
    >
      {/* Outer card container */}
      <div style={{ width: "100%", maxWidth: 900, position: "relative" }}>
        {/* Top controls */}
        <div
          className="flex items-center justify-between mb-3"
          style={{ fontSize: 13, color: "#78716C" }}
        >
          <div style={{ fontWeight: 600 }}>
            Urban Yield AI — Investor Deck
          </div>
          <div className="flex items-center gap-3">
            <span>
              {current + 1} / {SLIDES.length}
            </span>
            <button
              onClick={toggleFullscreen}
              style={{
                background: "none",
                border: "1px solid #E2D9CF",
                borderRadius: 6,
                padding: "3px 8px",
                cursor: "pointer",
                color: "#44403C",
                fontSize: 13,
              }}
            >
              {isFullscreen ? "⊠ Exit" : "⛶ Fullscreen"}
            </button>
          </div>
        </div>

        {/* Slide card */}
        <div
          style={{
            position: "relative",
            background: slide.dark ? NAVY : WHITE,
            borderRadius: 12,
            border: "1px solid #E2D9CF",
            minHeight: 520,
            padding: 24,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            transition: "opacity 200ms",
          }}
        >
          {/* Prev arrow */}
          {current > 0 && (
            <button
              onClick={prev}
              style={{
                position: "absolute",
                left: -48,
                top: "50%",
                transform: "translateY(-50%)",
                background: WHITE,
                border: "1px solid #E2D9CF",
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              aria-label="Previous slide"
            >
              ‹
            </button>
          )}

          {/* Next arrow */}
          {current < SLIDES.length - 1 && (
            <button
              onClick={next}
              style={{
                position: "absolute",
                right: -48,
                top: "50%",
                transform: "translateY(-50%)",
                background: WHITE,
                border: "1px solid #E2D9CF",
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              aria-label="Next slide"
            >
              ›
            </button>
          )}

          {/* Slide content */}
          <div style={{ minHeight: 472 }}>{slide.content}</div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? AMBER : "#D6D3D1",
                border: "none",
                cursor: "pointer",
                transition: "all 200ms",
                padding: 0,
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Keyboard hint */}
        <div className="text-center mt-3" style={{ fontSize: 11, color: "#A8A29E" }}>
          Use ← → arrow keys to navigate
        </div>
      </div>
    </div>
  );
}
