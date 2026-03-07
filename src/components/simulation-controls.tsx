"use client";

import { useSimulation } from "@/hooks/use-metrics";

export function SimulationControls() {
  const { isRunning, rate, setRate, start, stop, loading } = useSimulation();

  return (
    <div className="card p-5 animate-fade-in" style={{ animationDelay: "480ms" }}>
      <h3
        className="text-[13px] font-medium uppercase tracking-[0.06em] mb-5"
        style={{ color: "var(--text-tertiary)" }}
      >
        Simulation
      </h3>

      <div className="space-y-5">
        {/* Rate display */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
              Event Rate
            </span>
            <span
              className="text-[20px] font-semibold tracking-tight"
              style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
            >
              {rate.toLocaleString()}
              <span className="text-[12px] font-normal ml-1" style={{ color: "var(--text-tertiary)" }}>
                /min
              </span>
            </span>
          </div>

          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={rate}
            onChange={(e) => setRate(parseInt(e.target.value))}
            disabled={isRunning}
            className="w-full"
            style={{ opacity: isRunning ? 0.4 : 1 }}
          />

          <div
            className="flex justify-between text-[10px] mt-1.5"
            style={{ color: "var(--text-quaternary)" }}
          >
            <span>100</span>
            <span>5,000</span>
            <span>10,000</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => start(rate)}
            disabled={isRunning || loading}
            className="flex-1 h-9 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: isRunning || loading ? "var(--bg-inset)" : "var(--accent)",
              color: isRunning || loading ? "var(--text-quaternary)" : "#fff",
              border: "none",
            }}
          >
            {loading && !isRunning ? "Starting…" : "Start"}
          </button>
          <button
            onClick={stop}
            disabled={!isRunning || loading}
            className="flex-1 h-9 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: !isRunning || loading ? "var(--bg-inset)" : "var(--bg-tertiary)",
              color: !isRunning || loading ? "var(--text-quaternary)" : "var(--text-primary)",
              border: `1px solid ${!isRunning || loading ? "transparent" : "var(--border-primary)"}`,
            }}
          >
            {loading && isRunning ? "Stopping…" : "Stop"}
          </button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div
            className="w-[6px] h-[6px] rounded-full"
            style={{
              background: isRunning ? "var(--success)" : "var(--text-quaternary)",
              animation: isRunning ? "pulse-dot 2s ease-in-out infinite" : "none",
            }}
          />
          <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            {isRunning ? `Generating ${rate.toLocaleString()} events/min` : "Idle"}
          </span>
        </div>
      </div>
    </div>
  );
}
