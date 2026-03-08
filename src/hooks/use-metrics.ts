"use client";

import { useState, useEffect, useCallback } from "react";
import { MetricsSnapshot } from "@/lib/types";

export function useMetrics(intervalMs = 2000) {
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [history, setHistory] = useState<MetricsSnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics");
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const data: MetricsSnapshot = await res.json();
      setMetrics(data);
      setHistory((prev) => [...prev.slice(-59), data]);
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, intervalMs);
    return () => clearInterval(interval);
  }, [fetchMetrics, intervalMs]);

  return { metrics, history, error };
}

export function useSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [rate, setRate] = useState(10);
  const [emailCooldown, setEmailCooldown] = useState(30); // seconds between emails
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/simulation");
      const data = await res.json();
      setIsRunning(data.isRunning);
      setRate(data.rate);
      if (data.emailCooldown) setEmailCooldown(data.emailCooldown);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const start = async (newRate?: number, newCooldown?: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          rate: newRate ?? rate,
          emailCooldown: newCooldown ?? emailCooldown,
        }),
      });
      const data = await res.json();
      setIsRunning(data.status === "started" || data.status === "already_running");
      if (data.rate) setRate(data.rate);
      if (data.emailCooldown) setEmailCooldown(data.emailCooldown);
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    setLoading(true);
    try {
      await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      setIsRunning(false);
    } finally {
      setLoading(false);
    }
  };

  return { isRunning, rate, setRate, emailCooldown, setEmailCooldown, start, stop, loading };
}
