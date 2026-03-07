"use client";

import { useSimulation } from "@/hooks/use-metrics";
import { Play, Square, Gauge } from "lucide-react";

export function SimulationControls() {
  const { isRunning, rate, setRate, start, stop, loading } = useSimulation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Gauge className="w-5 h-5" />
        Event Simulation
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Rate: {rate.toLocaleString()} events/min
          </label>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={rate}
            onChange={(e) => setRate(parseInt(e.target.value))}
            disabled={isRunning}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>100/min</span>
            <span>5,000/min</span>
            <span>10,000/min</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => start(rate)}
            disabled={isRunning || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            {loading ? "Starting..." : "Start"}
          </button>
          <button
            onClick={stop}
            disabled={!isRunning || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Square className="w-4 h-4" />
            {loading ? "Stopping..." : "Stop"}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          <span className="text-gray-600 dark:text-gray-400">
            {isRunning ? `Running at ${rate.toLocaleString()} events/min` : "Simulation stopped"}
          </span>
        </div>
      </div>
    </div>
  );
}
