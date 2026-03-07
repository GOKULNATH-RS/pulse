"use client";

import { MetricsSnapshot } from "@/lib/types";
import { useTheme } from "@/components/theme-provider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface ChartProps {
  history: MetricsSnapshot[];
}

function ChartCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div className="card p-5 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <h3
        className="text-[13px] font-medium uppercase tracking-[0.06em] mb-5"
        style={{ color: "var(--text-tertiary)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function useChartColors() {
  const { theme } = useTheme();
  return {
    grid: theme === "dark" ? "#262626" : "#f0f0f0",
    axis: theme === "dark" ? "#525252" : "#b0b0b0",
    tooltipBg: theme === "dark" ? "#1a1a1a" : "#ffffff",
    tooltipBorder: theme === "dark" ? "#262626" : "#e5e5e5",
    tooltipText: theme === "dark" ? "#fafafa" : "#0a0a0a",
  };
}

export function EventRateChart({ history }: ChartProps) {
  const colors = useChartColors();
  const data = history.map((m, i) => ({
    time: i,
    value: m.eventsPerMinute,
  }));

  return (
    <ChartCard title="Event Throughput" delay={300}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            stroke={colors.axis}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke={colors.axis}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: "8px",
              color: colors.tooltipText,
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              padding: "8px 12px",
            }}
            labelFormatter={() => ""}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#f97316"
            fill="url(#eventGradient)"
            strokeWidth={1.5}
            name="Events/min"
            dot={false}
            activeDot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function EmailPerformanceChart({ history }: ChartProps) {
  const colors = useChartColors();
  const data = history.map((m, i) => ({
    time: i,
    sent: m.emailsSent,
    failed: m.emailsFailed,
  }));

  return (
    <ChartCard title="Email Delivery" delay={360}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            stroke={colors.axis}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke={colors.axis}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: "8px",
              color: colors.tooltipText,
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              padding: "8px 12px",
            }}
            labelFormatter={() => ""}
          />
          <Line
            type="monotone"
            dataKey="sent"
            stroke="#22c55e"
            strokeWidth={1.5}
            dot={false}
            name="Sent"
            activeDot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="failed"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={false}
            name="Failed"
            activeDot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function LatencyChart({ history }: ChartProps) {
  const colors = useChartColors();
  const data = history.map((m, i) => ({
    time: i,
    value: m.avgProcessingLatency,
  }));

  return (
    <ChartCard title="Processing Latency" delay={420}>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            stroke={colors.axis}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke={colors.axis}
            tickLine={false}
            axisLine={false}
            width={40}
            unit="ms"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: "8px",
              color: colors.tooltipText,
              fontSize: "12px",
              boxShadow: "var(--shadow-md)",
              padding: "8px 12px",
            }}
            labelFormatter={() => ""}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            fill="url(#latencyGradient)"
            strokeWidth={1.5}
            name="Latency (ms)"
            dot={false}
            activeDot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
