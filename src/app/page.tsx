"use client";

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

export default function Dashboard() {
  const { metrics, history } = useMetrics(2000);

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
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
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
            <CampaignFeed />
          </div>
        </div>

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
