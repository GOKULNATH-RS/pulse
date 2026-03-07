"use client";

import { MetricsSnapshot } from "@/lib/types";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "default" | "success" | "warning" | "danger";
  delay?: number;
}

function MetricCard({ label, value, sub, accent = "default", delay = 0 }: MetricCardProps) {
  const accentColors: Record<string, string> = {
    default: "var(--accent)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
  };

  return (
    <div
      className="card px-5 py-4 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p
        className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className="text-[28px] font-semibold tracking-tight leading-none"
          style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {sub && (
          <span
            className="text-[12px] font-medium"
            style={{ color: accentColors[accent] }}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card px-5 py-4">
      <div className="skeleton h-3 w-20 mb-3" />
      <div className="skeleton h-7 w-16" />
    </div>
  );
}

export function MetricsGrid({ metrics }: { metrics: MetricsSnapshot | null }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        label="Total Events"
        value={metrics.totalEvents.toLocaleString()}
        sub={`${metrics.eventsPerMinute}/min`}
        delay={0}
      />
      <MetricCard
        label="Throughput"
        value={metrics.eventsPerSecond.toFixed(1)}
        sub="events/s"
        delay={40}
      />
      <MetricCard
        label="Active Users"
        value={metrics.activeUsers}
        sub="60s window"
        accent="success"
        delay={80}
      />
      <MetricCard
        label="Campaigns"
        value={metrics.campaignsTriggered.toLocaleString()}
        sub="triggered"
        delay={120}
      />
      <MetricCard
        label="Pending"
        value={metrics.emailsPending}
        accent={metrics.emailsPending > 10 ? "warning" : "default"}
        delay={160}
      />
      <MetricCard
        label="Emails Sent"
        value={metrics.emailsSent.toLocaleString()}
        accent="success"
        delay={200}
      />
      <MetricCard
        label="Success Rate"
        value={`${metrics.emailSuccessRate}%`}
        accent={metrics.emailSuccessRate >= 90 ? "success" : "danger"}
        delay={240}
      />
      <MetricCard
        label="Latency"
        value={`${metrics.avgProcessingLatency}ms`}
        accent={metrics.avgProcessingLatency < 50 ? "success" : "danger"}
        delay={280}
      />
    </div>
  );
}
