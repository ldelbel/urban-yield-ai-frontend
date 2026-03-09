"use client";

import { useState } from "react";
import MapView from "./MapView";
import DocsTab from "./DocsTab";
import PitchTab from "./PitchTab";

type Tab = "map" | "docs" | "pitch";

const TABS: { id: Tab; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "docs", label: "Docs" },
  { id: "pitch", label: "Pitch" },
];

export default function AppShell() {
  const [tab, setTab] = useState<Tab>("map");

  return (
    <div className="flex flex-col h-screen" style={{ background: "#F5F0EB" }}>
      {/* Tab Bar */}
      <nav
        className="flex items-center gap-6 px-6 shrink-0"
        style={{ height: 44, background: "#F5F0EB", borderBottom: "1px solid #E2D9CF" }}
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: tab === id ? "#1C1917" : "#78716C",
              borderBottom: tab === id ? "2px solid #D97706" : "2px solid transparent",
              paddingBottom: 2,
              background: "none",
              border: "none",
              borderBottomStyle: "solid",
              borderBottomWidth: 2,
              borderBottomColor: tab === id ? "#D97706" : "transparent",
              cursor: "pointer",
              lineHeight: "44px",
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* MapView: always mounted, hidden when not active */}
        <div style={{ display: tab === "map" ? "flex" : "none", height: "100%", width: "100%" }}>
          <MapView />
        </div>

        {tab === "docs" && <DocsTab />}
        {tab === "pitch" && <PitchTab />}
      </div>
    </div>
  );
}
