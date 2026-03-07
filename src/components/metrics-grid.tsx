"use client";

import { MetricsSnapshot } from "@/lib/types";
import {
  Activity,
  Mail,
  MailCheck,
  MailX,
  Users,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function MetricCard({ title, value, icon, color, subtitle }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace("text-", "bg-")}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function MetricsGrid({ metrics }: { metrics: MetricsSnapshot | null }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Events"
        value={metrics.totalEvents.toLocaleString()}
        icon={<Activity className="w-6 h-6 text-blue-500" />}
        color="text-blue-600"
        subtitle={`${metrics.eventsPerMinute} events/min`}
      />
      <MetricCard
        title="Events/Second"
        value={metrics.eventsPerSecond.toFixed(1)}
        icon={<Zap className="w-6 h-6 text-yellow-500" />}
        color="text-yellow-600"
      />
      <MetricCard
        title="Active Users"
        value={metrics.activeUsers}
        icon={<Users className="w-6 h-6 text-green-500" />}
        color="text-green-600"
        subtitle="Last 60 seconds"
      />
      <MetricCard
        title="Campaigns Triggered"
        value={metrics.campaignsTriggered.toLocaleString()}
        icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
        color="text-purple-600"
      />
      <MetricCard
        title="Emails Pending"
        value={metrics.emailsPending}
        icon={<Mail className="w-6 h-6 text-orange-500" />}
        color="text-orange-600"
      />
      <MetricCard
        title="Emails Sent"
        value={metrics.emailsSent.toLocaleString()}
        icon={<MailCheck className="w-6 h-6 text-emerald-500" />}
        color="text-emerald-600"
      />
      <MetricCard
        title="Success Rate"
        value={`${metrics.emailSuccessRate}%`}
        icon={<MailX className="w-6 h-6 text-red-500" />}
        color={metrics.emailSuccessRate >= 90 ? "text-emerald-600" : "text-red-600"}
      />
      <MetricCard
        title="Avg Latency"
        value={`${metrics.avgProcessingLatency}ms`}
        icon={<Clock className="w-6 h-6 text-indigo-500" />}
        color={metrics.avgProcessingLatency < 50 ? "text-indigo-600" : "text-red-600"}
      />
    </div>
  );
}
