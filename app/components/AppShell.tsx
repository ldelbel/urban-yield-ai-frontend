"use client";

import { useRouter, usePathname } from "next/navigation";
import MapView from "./MapView";
import DocsTab from "./DocsTab";
import PitchTab from "./PitchTab";

type Tab = "map" | "docs" | "pitch";

const TABS: { id: Tab; label: string; path: string }[] = [
  { id: "map",   label: "Map",   path: "/" },
  { id: "docs",  label: "Docs",  path: "/docs" },
  { id: "pitch", label: "Pitch", path: "/pitch" },
];

function pathnameToTab(pathname: string): Tab {
  if (pathname === "/docs")  return "docs";
  if (pathname === "/pitch") return "pitch";
  return "map";
}

export default function AppShell() {
  const router   = useRouter();
  const pathname = usePathname();
  const tab      = pathnameToTab(pathname);

  return (
    <div className="flex flex-col h-screen" style={{ background: "#F5F0EB" }}>
      {/* Tab Bar */}
      <nav
        className="flex items-center gap-6 px-6 shrink-0"
        style={{ height: 44, background: "#F5F0EB", borderBottom: "1px solid #E2D9CF" }}
      >
        {TABS.map(({ id, label, path }) => (
          <a
            key={id}
            href={path}
            onClick={(e) => { e.preventDefault(); router.push(path); }}
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: tab === id ? "#1C1917" : "#78716C",
              borderBottomStyle: "solid",
              borderBottomWidth: 2,
              borderBottomColor: tab === id ? "#D97706" : "transparent",
              paddingBottom: 2,
              textDecoration: "none",
              cursor: "pointer",
              lineHeight: "44px",
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* MapView: always mounted, hidden when not active */}
        <div style={{ display: tab === "map" ? "flex" : "none", height: "100%", width: "100%" }}>
          <MapView />
        </div>

        {tab === "docs"  && <DocsTab />}
        {tab === "pitch" && <PitchTab />}
      </div>
    </div>
  );
}
