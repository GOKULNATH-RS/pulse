"use client";

import { MetricsSnapshot } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface ChartProps {
  history: MetricsSnapshot[];
}

export function EventRateChart({ history }: ChartProps) {
  const data = history.map((m, i) => ({
    time: i,
    eventsPerMinute: m.eventsPerMinute,
    eventsPerSecond: m.eventsPerSecond,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Event Throughput</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#F9FAFB",
            }}
          />
          <Area
            type="monotone"
            dataKey="eventsPerMinute"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.15}
            strokeWidth={2}
            name="Events/min"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EmailPerformanceChart({ history }: ChartProps) {
  const data = history.map((m, i) => ({
    time: i,
    sent: m.emailsSent,
    failed: m.emailsFailed,
    successRate: m.emailSuccessRate,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Email Performance</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#F9FAFB",
            }}
          />
          <Line
            type="monotone"
            dataKey="sent"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            name="Sent"
          />
          <Line
            type="monotone"
            dataKey="failed"
            stroke="#EF4444"
            strokeWidth={2}
            dot={false}
            name="Failed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LatencyChart({ history }: ChartProps) {
  const data = history.map((m, i) => ({
    time: i,
    latency: m.avgProcessingLatency,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Processing Latency</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" unit="ms" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#F9FAFB",
            }}
          />
          <Area
            type="monotone"
            dataKey="latency"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.15}
            strokeWidth={2}
            name="Avg Latency (ms)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
