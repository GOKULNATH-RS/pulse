"use client";

import { useState } from "react";
import { useMetrics } from "@/hooks/use-metrics";
import { useTheme } from "@/components/theme-provider";
import { MetricsGrid } from "@/components/metrics-grid";
import {
  EventRateChart,
  EmailPerformanceChart,
  LatencyChart,
} from "@/components/charts";
import { SimulationControls } from "@/components/simulation-controls";
import { CampaignFeed } from "@/components/campaign-feed";
import { EventFeed } from "@/components/event-feed";
import { GuidePage } from "@/components/guide-page";

function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer"
      style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border-secondary)",
      }}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

/* ── Simulation FAB + Modal ── */
function SimulationFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform duration-200 hover:scale-110"
        style={{ background: "var(--accent)", color: "#fff" }}
        aria-label="Open simulation controls"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md animate-fade-in"
            style={{ animationDuration: "150ms" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[12px] font-medium" style={{ color: "var(--text-quaternary)" }}>Simulation Controls</span>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center cursor-pointer"
                style={{ color: "var(--text-quaternary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <SimulationControls />
          </div>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const { metrics, history } = useMetrics(2000);
  const { theme } = useTheme();
  const [showGuide, setShowGuide] = useState(false);

  if (showGuide) {
    return <GuidePage onBack={() => setShowGuide(false)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      {/* ─── Header ─── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
              alt="Pulse"
              width={72}
              height={36}
              className="rounded-lg"
            />
            <span
              className="text-[15px] font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Pulse
            </span>
            <span
              className="text-[11px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
            >
              beta
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* How it works */}
            <button
              onClick={() => setShowGuide(true)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              style={{
                color: "var(--accent)",
                background: "var(--accent-soft)",
                border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                boxShadow: "0 0 0 3px color-mix(in srgb, var(--accent) 8%, transparent)",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              How it works
            </button>
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-[6px] h-[6px] rounded-full"
                style={{
                  background: metrics ? "var(--success)" : "var(--text-quaternary)",
                  animation: metrics ? "pulse-dot 2s ease-in-out infinite" : "none",
                }}
              />
              <span className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                {metrics ? "Live" : "Connecting"}
              </span>
            </div>

            <div style={{ width: "1px", height: "16px", background: "var(--border-primary)" }} />

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="max-w-[1200px] mx-auto px-6 py-6 space-y-4">
        {/* Metrics */}
        <MetricsGrid metrics={metrics} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EventRateChart history={history} />
          <EmailPerformanceChart history={history} />
        </div>

        {/* Controls & Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SimulationControls />
          <div className="lg:col-span-2">
            <EventFeed />
          </div>
        </div>

        {/* Campaign Feed */}
        <CampaignFeed />

        {/* Latency */}
        <LatencyChart history={history} />
      </main>

      {/* ─── Footer ─── */}
      <footer className="max-w-[1200px] mx-auto px-6 py-6">
        <div
          className="flex items-center justify-between text-[11px]"
          style={{ color: "var(--text-quaternary)" }}
        >
          <span>Pulse — Real-Time Campaign Optimizer</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {metrics ? `${metrics.totalEvents.toLocaleString()} events processed` : "—"}
          </span>
        </div>
      </footer>
    </div>
  );
}
