"use client";

import { useState, useEffect, useCallback } from "react";

interface SimUser {
  userId: string;
  email: string;
  name: string;
  preferredCategories: string[];
  purchaseProbability: number;
  cartProbability: number;
  browsingIntensity: number;
}

function formatCooldown(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60 > 0 ? `${s % 60}s` : ""}`.trim();
}

export function SimulationControls() {
  const [isRunning, setIsRunning] = useState(false);
  const [rate, setRate] = useState(10);
  const [emailCooldown, setEmailCooldown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SimUser[]>([]);
  const [tab, setTab] = useState<"controls" | "users">("controls");
  const [saving, setSaving] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/simulation");
      const data = await res.json();
      setIsRunning(data.isRunning);
      setRate(data.rate);
      if (data.emailCooldown) setEmailCooldown(data.emailCooldown);
      if (data.users) setUsers(data.users);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", rate, emailCooldown }),
      });
      const data = await res.json();
      setIsRunning(data.status === "started" || data.status === "already_running");
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

  const saveUsers = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_users", users }),
      });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } finally {
      setSaving(false);
    }
  };

  const updateUser = (index: number, field: keyof SimUser, value: string) => {
    setUsers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addUser = () => {
    const id = `user-${Date.now()}`;
    setUsers((prev) => [
      ...prev,
      {
        userId: id,
        email: "",
        name: "",
        preferredCategories: ["Electronics"],
        purchaseProbability: 0.1,
        cartProbability: 0.2,
        browsingIntensity: 0.7,
      },
    ]);
  };

  const removeUser = (index: number) => {
    setUsers((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="card p-5 animate-fade-in" style={{ animationDelay: "0ms" }}>
      {/* Tab bar */}
      <div className="flex gap-1 mb-5">
        {(["controls", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors cursor-pointer capitalize"
            style={{
              background: tab === t ? "var(--accent)" : "var(--bg-tertiary)",
              color: tab === t ? "#fff" : "var(--text-tertiary)",
            }}
          >
            {t === "controls" ? "Simulation" : "Test Users"}
          </button>
        ))}
      </div>

      {tab === "controls" ? (
        <div className="space-y-5">
          {/* Event Rate */}
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
              type="range" min="1" max="60" step="1" value={rate}
              onChange={(e) => setRate(parseInt(e.target.value))}
              disabled={isRunning} className="w-full"
              style={{ opacity: isRunning ? 0.4 : 1 }}
            />
            <div className="flex justify-between text-[10px] mt-1.5" style={{ color: "var(--text-quaternary)" }}>
              <span>1</span><span>30</span><span>60</span>
            </div>
          </div>

          {/* Email Cooldown */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                Email Cooldown
              </span>
              <span
                className="text-[20px] font-semibold tracking-tight"
                style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
              >
                {formatCooldown(emailCooldown)}
              </span>
            </div>
            <input
              type="range" min="5" max="300" step="5" value={emailCooldown}
              onChange={(e) => setEmailCooldown(parseInt(e.target.value))}
              disabled={isRunning} className="w-full"
              style={{ opacity: isRunning ? 0.4 : 1 }}
            />
            <div className="flex justify-between text-[10px] mt-1.5" style={{ color: "var(--text-quaternary)" }}>
              <span>5s (fast)</span><span>2.5m</span><span>5m (slow)</span>
            </div>
            <p className="text-[11px] mt-2" style={{ color: "var(--text-quaternary)" }}>
              Min time between emails of the same type per user.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={start}
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
              {isRunning ? `${rate}/min · email every ${formatCooldown(emailCooldown)}` : "Idle"}
            </span>
          </div>
        </div>
      ) : (
        /* ── Users Tab ── */
        <div className="space-y-3">
          <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
            Add your email to receive real campaign emails during testing. Changes apply on next simulation start.
          </p>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {users.map((u, i) => (
              <div
                key={u.userId}
                className="rounded-lg p-3 space-y-2"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-quaternary)" }}>
                    {u.userId}
                  </span>
                  <button
                    onClick={() => removeUser(i)}
                    className="text-[11px] cursor-pointer px-1.5 py-0.5 rounded"
                    style={{ color: "var(--danger)", background: "var(--danger-soft)" }}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={u.name}
                    onChange={(e) => updateUser(i, "name", e.target.value)}
                    placeholder="Name"
                    className="h-8 px-2.5 rounded-md text-[13px] w-full outline-none"
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <input
                    type="email"
                    value={u.email}
                    onChange={(e) => updateUser(i, "email", e.target.value)}
                    placeholder="Email"
                    className="h-8 px-2.5 rounded-md text-[13px] w-full outline-none"
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={addUser}
              className="flex-1 h-8 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
              style={{
                background: "var(--bg-inset)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              + Add User
            </button>
            <button
              onClick={saveUsers}
              disabled={saving}
              className="flex-1 h-8 rounded-lg text-[12px] font-medium cursor-pointer transition-colors disabled:cursor-not-allowed"
              style={{
                background: saving ? "var(--bg-inset)" : "var(--accent)",
                color: saving ? "var(--text-quaternary)" : "#fff",
                border: "none",
              }}
            >
              {saving ? "Saving…" : "Save Users"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
