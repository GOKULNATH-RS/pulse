"use client";

import { useState, useEffect, useCallback } from "react";

interface SentEmail {
  to: string;
  userName: string;
  subject: string;
  triggerType: string;
  sentAt?: number;
  failedAt?: number;
  error?: string;
}

interface CampaignData {
  sent: SentEmail[];
  failed: SentEmail[];
  pendingCount: number;
}

const triggerLabels: Record<string, string> = {
  abandoned_cart: "Cart",
  browse_abandonment: "Browse",
  post_purchase_crosssell: "Cross-sell",
  re_engagement: "Re-engage",
  high_churn_risk: "Churn",
};

function TriggerBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    abandoned_cart: { bg: "var(--warning-soft)", text: "var(--warning)" },
    browse_abandonment: { bg: "var(--accent-soft)", text: "var(--accent)" },
    post_purchase_crosssell: { bg: "var(--success-soft)", text: "var(--success)" },
    re_engagement: { bg: "#f3e8ff", text: "#8b5cf6" },
    high_churn_risk: { bg: "var(--danger-soft)", text: "var(--danger)" },
  };

  const c = colors[type] || { bg: "var(--bg-inset)", text: "var(--text-tertiary)" };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-[0.04em]"
      style={{ background: c.bg, color: c.text }}
    >
      {triggerLabels[type] || type}
    </span>
  );
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function CampaignFeed() {
  const [campaigns, setCampaigns] = useState<CampaignData | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 3000);
    return () => clearInterval(interval);
  }, [fetchCampaigns]);

  return (
    <div className="card p-5 animate-fade-in" style={{ animationDelay: "540ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[13px] font-medium uppercase tracking-[0.06em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Campaign Activity
        </h3>
        {campaigns && campaigns.pendingCount > 0 && (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-md"
            style={{ background: "var(--warning-soft)", color: "var(--warning)" }}
          >
            {campaigns.pendingCount} pending
          </span>
        )}
      </div>

      {!campaigns ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="skeleton w-6 h-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.sent.length === 0 && campaigns.failed.length === 0 ? (
        <div
          className="text-center py-10 text-[13px]"
          style={{ color: "var(--text-quaternary)" }}
        >
          <p>No campaigns yet</p>
          <p className="text-[12px] mt-1">Start the simulation to generate activity</p>
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[360px] overflow-y-auto -mx-1 px-1">
          {campaigns.sent.slice(0, 12).map((email, i) => (
            <div
              key={`s-${i}`}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150"
              style={{ cursor: "default" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-tertiary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Status dot */}
              <div
                className="w-[7px] h-[7px] rounded-full mt-1.5 shrink-0"
                style={{ background: "var(--success)" }}
              />

              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-medium truncate leading-snug"
                  style={{ color: "var(--text-primary)" }}
                >
                  {email.subject}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <TriggerBadge type={email.triggerType} />
                  <span
                    className="text-[11px] truncate"
                    style={{ color: "var(--text-quaternary)" }}
                  >
                    {email.to}
                  </span>
                  {email.sentAt && (
                    <span
                      className="text-[11px] shrink-0"
                      style={{ color: "var(--text-quaternary)" }}
                    >
                      {timeAgo(email.sentAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {campaigns.failed.slice(0, 5).map((email, i) => (
            <div
              key={`f-${i}`}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: "var(--danger-soft)" }}
            >
              <div
                className="w-[7px] h-[7px] rounded-full mt-1.5 shrink-0"
                style={{ background: "var(--danger)" }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-medium truncate"
                  style={{ color: "var(--danger)" }}
                >
                  {email.subject}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--danger)" }}
                >
                  {email.error || "Delivery failed"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
