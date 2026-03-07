"use client";

import { useMetrics } from "@/hooks/use-metrics";
import { MetricsGrid } from "@/components/metrics-grid";
import { EventRateChart, EmailPerformanceChart, LatencyChart } from "@/components/charts";
import { SimulationControls } from "@/components/simulation-controls";
import { CampaignFeed } from "@/components/campaign-feed";
import { Zap } from "lucide-react";

export default function Dashboard() {
  const { metrics, history } = useMetrics(2000);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pulse</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-Time Email Campaign Optimizer
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${metrics ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {metrics ? "Connected" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metrics Grid */}
        <MetricsGrid metrics={metrics} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EventRateChart history={history} />
          <EmailPerformanceChart history={history} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SimulationControls />
          <div className="lg:col-span-2">
            <CampaignFeed />
          </div>
        </div>

        {/* Latency Chart */}
        <LatencyChart history={history} />
      </main>
    </div>
  );
}
