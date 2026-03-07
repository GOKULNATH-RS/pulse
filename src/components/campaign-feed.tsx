"use client";

import { useState, useEffect, useCallback } from "react";

interface ProductRecommendation {
  productId: string;
  productName: string;
  price: number;
  category: string;
  reason: string;
}

interface DiscountOffer {
  code: string;
  percentage: number;
  validUntil: number;
  description: string;
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  addedAt: number;
}

interface EmailPersonalization {
  greeting: string;
  recommendations: ProductRecommendation[];
  discount?: DiscountOffer;
  inventoryAlerts: string[];
  cartReminder?: CartItem[];
  ctaUrl: string;
  ctaText: string;
}

interface SentEmail {
  to: string;
  userName: string;
  subject: string;
  triggerType: string;
  personalization?: EmailPersonalization;
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

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

/* ── Build email HTML (mirrors Code.gs template) ── */
function buildEmailHtml(email: SentEmail): string {
  const p = email.personalization;
  if (!p) return "<p>No email content available.</p>";

  const esc = (t: string) =>
    String(t ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  let recommendationsHtml = "";
  if (p.recommendations?.length) {
    recommendationsHtml =
      '<h2 style="color:#1a1a2e;font-size:20px;margin-top:30px;">Recommended For You</h2>';
    recommendationsHtml +=
      '<div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:16px;">';
    for (const rec of p.recommendations) {
      recommendationsHtml += `<div style="flex:1;min-width:200px;border:1px solid #e0e0e0;border-radius:12px;padding:16px;text-align:center;">
        <h3 style="color:#1a1a2e;font-size:16px;margin:8px 0;">${esc(rec.productName)}</h3>
        <p style="color:#16213e;font-size:18px;font-weight:bold;">$${rec.price.toFixed(2)}</p>
        <p style="color:#666;font-size:12px;">${esc(rec.reason)}</p></div>`;
    }
    recommendationsHtml += "</div>";
  }

  let discountHtml = "";
  if (p.discount) {
    discountHtml = `<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <h2 style="font-size:24px;margin:0 0 8px;">Special Offer!</h2>
      <p style="font-size:36px;font-weight:bold;margin:0;">${p.discount.percentage}% OFF</p>
      <p style="margin:8px 0 0;">${esc(p.discount.description)}</p>
      <p style="background:rgba(255,255,255,0.2);display:inline-block;padding:8px 16px;border-radius:8px;margin-top:12px;font-family:monospace;font-size:18px;">${esc(p.discount.code)}</p>
    </div>`;
  }

  let inventoryHtml = "";
  if (p.inventoryAlerts?.length) {
    inventoryHtml =
      '<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px;margin:16px 0;">';
    inventoryHtml +=
      '<strong style="color:#856404;">⚡ Limited Stock Alert</strong>';
    for (const alert of p.inventoryAlerts) {
      inventoryHtml += `<p style="color:#856404;margin:4px 0 0;font-size:14px;">${esc(alert)}</p>`;
    }
    inventoryHtml += "</div>";
  }

  let cartHtml = "";
  if (p.cartReminder?.length) {
    let total = 0;
    cartHtml =
      '<h2 style="color:#1a1a2e;font-size:20px;margin-top:30px;">Your Cart Items</h2>';
    cartHtml +=
      '<table style="width:100%;border-collapse:collapse;margin-top:12px;">';
    cartHtml +=
      '<tr style="background:#f8f9fa;"><th style="padding:10px;text-align:left;">Product</th><th style="padding:10px;text-align:center;">Qty</th><th style="padding:10px;text-align:right;">Price</th></tr>';
    for (const item of p.cartReminder) {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      cartHtml += `<tr><td style="padding:10px;border-top:1px solid #e0e0e0;">${esc(item.productName)}</td>
        <td style="padding:10px;border-top:1px solid #e0e0e0;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-top:1px solid #e0e0e0;text-align:right;">$${itemTotal.toFixed(2)}</td></tr>`;
    }
    cartHtml += `<tr style="font-weight:bold;"><td colspan="2" style="padding:10px;border-top:2px solid #1a1a2e;">Total</td>
      <td style="padding:10px;border-top:2px solid #1a1a2e;text-align:right;">$${total.toFixed(2)}</td></tr></table>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px;text-align:center;">
    <h1 style="color:white;font-size:28px;margin:0;">⚡ Pulse</h1>
    <p style="color:#a0aec0;margin:8px 0 0;">Your Personal Shopping Assistant</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;line-height:1.6;">${esc(p.greeting)}</p>
    ${cartHtml}${discountHtml}${inventoryHtml}${recommendationsHtml}
    <div style="text-align:center;margin-top:32px;">
      <a href="${esc(p.ctaUrl)}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">${esc(p.ctaText)}</a>
    </div>
  </div>
  <div style="background:#f8f9fa;padding:24px;text-align:center;color:#666;font-size:12px;">
    <p>Powered by Pulse Email Campaign Optimizer</p>
    <p>You received this because of your activity on our platform.</p>
  </div>
</div></body></html>`;
}

/* ── Email Detail Modal ── */
function EmailDetailModal({
  email,
  onClose,
}: {
  email: SentEmail;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"preview" | "details">("preview");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const emailHtml = buildEmailHtml(email);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in"
        style={{ animationDuration: "150ms" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-5 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <TriggerBadge type={email.triggerType} />
              {email.sentAt && (
                <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                  {timeAgo(email.sentAt)}
                </span>
              )}
              {email.failedAt && (
                <span className="text-[11px] font-medium" style={{ color: "var(--danger)" }}>
                  Failed
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
              {email.subject}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Meta bar */}
        <div
          className="px-5 py-3 border-b shrink-0 flex items-center justify-between"
          style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: "var(--text-quaternary)" }}>To</span>
              <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>{email.to}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: "var(--text-quaternary)" }}>From</span>
              <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>Pulse Campaign</span>
            </div>
          </div>
          {/* Tab toggle */}
          <div
            className="flex rounded-md overflow-hidden"
            style={{ border: "1px solid var(--border-primary)" }}
          >
            {(["preview", "details"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1 text-[11px] font-medium capitalize transition-colors cursor-pointer"
                style={{
                  background: tab === t ? "var(--accent)" : "transparent",
                  color: tab === t ? "#fff" : "var(--text-tertiary)",
                }}
              >
                {t === "preview" ? "Mail Preview" : "Data"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {tab === "preview" ? (
            <div className="p-4" style={{ background: "#e8e8e8" }}>
              <iframe
                srcDoc={emailHtml}
                title="Email preview"
                sandbox=""
                className="w-full rounded-lg border-0"
                style={{
                  height: "560px",
                  background: "#f5f5f5",
                  display: "block",
                }}
              />
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Envelope */}
              <div>
                <h4 className="text-[11px] font-medium uppercase tracking-[0.06em] mb-2" style={{ color: "var(--text-tertiary)" }}>Envelope</h4>
                <div className="space-y-1">
                  {[
                    ["To", email.to],
                    ["Name", email.userName],
                    ["Subject", email.subject],
                    ["Trigger", email.triggerType.replace(/_/g, " ")],
                    ["Status", email.sentAt ? "Delivered" : "Failed"],
                  ].map(([label, val]) => (
                    <div key={label} className="flex gap-3 text-[13px]">
                      <span className="w-16 shrink-0 font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</span>
                      <span style={{ color: "var(--text-primary)" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalization data */}
              {email.personalization && (
                <div>
                  <h4 className="text-[11px] font-medium uppercase tracking-[0.06em] mb-2" style={{ color: "var(--text-tertiary)" }}>Personalization Payload</h4>
                  <pre
                    className="text-[12px] leading-relaxed p-3 rounded-md overflow-x-auto"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {JSON.stringify(email.personalization, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error */}
              {email.error && (
                <div className="px-3 py-2.5 rounded-md text-[12px]" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                  Error: {email.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Campaign Feed ── */
export function CampaignFeed() {
  const [campaigns, setCampaigns] = useState<CampaignData | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);

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
    <>
      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}

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
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedEmail(email)}
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

                {/* Chevron */}
                <svg
                  className="shrink-0 mt-1.5"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  style={{ color: "var(--text-quaternary)" }}
                >
                  <path
                    d="M5 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}

            {campaigns.failed.slice(0, 5).map((email, i) => (
              <div
                key={`f-${i}`}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: "var(--danger-soft)", cursor: "pointer" }}
                onClick={() => setSelectedEmail(email)}
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
                <svg
                  className="shrink-0 mt-1.5"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  style={{ color: "var(--danger)" }}
                >
                  <path
                    d="M5 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
