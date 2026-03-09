"use client";
import { useState, useEffect } from "react";
import { fetchHealth } from "../lib/api";

interface Props { totalCount: number }

export default function SplashBanner({ totalCount }: Props) {
  const [visible, setVisible] = useState(true);
  const [timestamp, setTimestamp] = useState<string>("Live");

  useEffect(() => {
    fetchHealth().then(data => {
      if (data?.timestamp) {
        setTimestamp(new Date(data.timestamp).toLocaleTimeString());
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        background: "rgba(248, 246, 242, 0.92)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid #E2D9CF",
        minHeight: "48px",
      }}
    >
      {/* Left */}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#1C1917" }}>
          Montgomery, AL — City Intelligence Platform
        </p>
        <p className="hidden md:block" style={{ fontSize: "11px", color: "#78716C", marginTop: "1px" }}>
          {totalCount} zones monitored · Real-time municipal data
        </p>
      </div>

      {/* Center */}
      <p className="hidden md:block" style={{ fontSize: "11px", color: "#78716C", flexShrink: 0, margin: "0 16px" }}>
        Last refreshed: {timestamp}
      </p>

      {/* Close */}
      <button
        onClick={() => setVisible(false)}
        style={{
          color: "#78716C",
          fontSize: "20px",
          lineHeight: 1,
          background: "none",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
          marginLeft: "8px",
        }}
        aria-label="Close banner"
      >
        ×
      </button>
    </div>
  );
}
