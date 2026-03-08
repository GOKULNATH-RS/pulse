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

/* ── Build email HTML (exact mirror of Code.gs generateEmailHtml) ── */
function buildEmailHtml(email: SentEmail): string {
  const p = email.personalization;
  if (!p) return "<p>No email content available.</p>";

  const esc = (t: unknown): string =>
    String(t ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // ── Cart section
  let cartHtml = "";
  if (p.cartReminder?.length) {
    let total = 0;
    let cartRows = "";
    for (const item of p.cartReminder) {
      const lineTotal = item.price * item.quantity;
      total += lineTotal;
      cartRows += `<tr>`
        + `<td style="padding:12px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">${esc(item.productName)}</td>`
        + `<td style="padding:12px 16px;font-size:14px;color:#374151;text-align:center;border-top:1px solid #e5e7eb;width:60px;">${item.quantity}</td>`
        + `<td style="padding:12px 16px;font-size:14px;color:#374151;text-align:right;border-top:1px solid #e5e7eb;width:90px;">$${lineTotal.toFixed(2)}</td>`
        + `</tr>`;
    }
    cartHtml = `<p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Your cart</p>`
      + `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;margin-bottom:28px;">`
      + `<tr style="background:#f9fafb;">`
      + `<td style="padding:10px 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Product</td>`
      + `<td style="padding:10px 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;text-align:center;width:60px;">Qty</td>`
      + `<td style="padding:10px 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;text-align:right;width:90px;">Price</td>`
      + `</tr>`
      + cartRows
      + `<tr style="background:#f9fafb;">`
      + `<td colspan="2" style="padding:12px 16px;font-size:14px;font-weight:600;color:#111827;border-top:2px solid #e5e7eb;">Total</td>`
      + `<td style="padding:12px 16px;font-size:15px;font-weight:700;color:#111827;text-align:right;border-top:2px solid #e5e7eb;">$${total.toFixed(2)}</td>`
      + `</tr>`
      + `</table>`;
  }

  // ── Discount section
  let discountHtml = "";
  if (p.discount) {
    discountHtml = `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;margin-bottom:28px;">`
      + `<tr><td style="padding:24px 28px;">`
      + `<p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Special offer</p>`
      + `<p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827;line-height:1;">${p.discount.percentage}% off</p>`
      + `<p style="margin:0 0 16px;font-size:14px;color:#6b7280;">${esc(p.discount.description)}</p>`
      + `<span style="display:inline-block;background:#ffffff;border:1.5px dashed #d1d5db;padding:8px 16px;font-size:16px;font-weight:700;color:#111827;letter-spacing:0.1em;font-family:monospace;">${esc(p.discount.code)}</span>`
      + `</td></tr>`
      + `</table>`;
  }

  // ── Inventory alerts
  let inventoryHtml = "";
  if (p.inventoryAlerts?.length) {
    const alertLines = p.inventoryAlerts
      .map((a) => `<p style="margin:4px 0 0;font-size:13px;color:#c2410c;">${esc(a)}</p>`)
      .join("");
    inventoryHtml = `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff7ed;border:1px solid #fed7aa;margin-bottom:28px;">`
      + `<tr><td style="padding:14px 16px;">`
      + `<p style="margin:0 0 2px;font-size:12px;font-weight:600;color:#c2410c;text-transform:uppercase;letter-spacing:0.05em;">Low stock</p>`
      + alertLines
      + `</td></tr>`
      + `</table>`;
  }

  // ── Recommendations
  let recommendationsHtml = "";
  if (p.recommendations?.length) {
    const recCells = p.recommendations
      .map((rec, i) =>
        `${i > 0 ? '<td style="width:16px;font-size:0;line-height:0;">&nbsp;</td>' : ""}`
        + `<td valign="top" style="border:1px solid #e5e7eb;padding:16px;text-align:center;">`
        + `<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">${esc(rec.productName)}</p>`
        + `<p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">$${rec.price.toFixed(2)}</p>`
        + `<p style="margin:0;font-size:12px;color:#9ca3af;">${esc(rec.reason)}</p>`
        + `</td>`
      )
      .join("");
    recommendationsHtml = `<p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Picked for you</p>`
      + `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">`
      + `<tr>${recCells}</tr>`
      + `</table>`;
  }

  // ── Full template
  return `<!DOCTYPE html><html>`
    + `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>`
    + `<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">`
    + `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6;">`
    + `<tr><td align="center" style="padding:40px 16px;">`
    + `<table cellpadding="0" cellspacing="0" border="0" width="560" style="background:#ffffff;border:1px solid #e5e7eb;">`
    // Header
    + `<tr><td style="padding:28px 40px 20px;border-bottom:1px solid #f3f4f6;">`
    + `<p style="margin:0;font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Pulse</p>`
    + `</td></tr>`
    // Body
    + `<tr><td style="padding:36px 40px;">`
    + `<p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#374151;">${esc(p.greeting)}</p>`
    + cartHtml
    + discountHtml
    + inventoryHtml
    + recommendationsHtml
    // CTA
    + `<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center">`
    + `<a href="${esc(p.ctaUrl)}" style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;letter-spacing:0.01em;">`
    + esc(p.ctaText)
    + `</a>`
    + `</td></tr></table>`
    + `</td></tr>`
    // Footer
    + `<tr><td style="padding:20px 40px;border-top:1px solid #f3f4f6;">`
    + `<p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">You&#039;re receiving this because of your recent activity on Pulse. &copy; 2026 Pulse.</p>`
    + `</td></tr>`
    + `</table>`
    + `</td></tr></table>`
    + `</body></html>`;
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
