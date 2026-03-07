"use client";

import { useState, useEffect, useCallback } from "react";

interface UserEvent {
  eventId: string;
  userId: string;
  eventType: string;
  timestamp: number;
  data: {
    productId?: string;
    productName?: string;
    productCategory?: string;
    productPrice?: number;
    quantity?: number;
    searchQuery?: string;
    pageUrl?: string;
    sessionId?: string;
  };
}

const eventIcons: Record<string, string> = {
  page_view: "🔍",
  product_view: "👁",
  add_to_cart: "🛒",
  remove_from_cart: "❌",
  purchase: "💳",
  search: "🔎",
  wishlist: "❤️",
};

const eventColors: Record<string, { bg: string; text: string }> = {
  page_view: { bg: "var(--bg-tertiary)", text: "var(--text-tertiary)" },
  product_view: { bg: "var(--accent-soft)", text: "var(--accent)" },
  add_to_cart: { bg: "var(--warning-soft)", text: "var(--warning)" },
  remove_from_cart: { bg: "var(--danger-soft)", text: "var(--danger)" },
  purchase: { bg: "var(--success-soft)", text: "var(--success)" },
  search: { bg: "#f3e8ff", text: "#8b5cf6" },
  wishlist: { bg: "#fce7f3", text: "#ec4899" },
};

function eventLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function eventDetail(event: UserEvent): string {
  const d = event.data;
  switch (event.eventType) {
    case "page_view":
      return d.pageUrl || "/";
    case "product_view":
    case "add_to_cart":
    case "remove_from_cart":
    case "wishlist":
      return d.productName
        ? `${d.productName}${d.productPrice ? ` — $${d.productPrice.toFixed(2)}` : ""}`
        : "";
    case "purchase":
      return d.productName
        ? `${d.productName} ×${d.quantity || 1} — $${((d.productPrice || 0) * (d.quantity || 1)).toFixed(2)}`
        : "";
    case "search":
      return d.searchQuery ? `"${d.searchQuery}"` : "";
    default:
      return "";
  }
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 3) return "now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export function EventFeed() {
  const [events, setEvents] = useState<UserEvent[]>([]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events/recent");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 2000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <div className="card p-5 animate-fade-in" style={{ animationDelay: "360ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[13px] font-medium uppercase tracking-[0.06em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Incoming Events
        </h3>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-md"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-quaternary)" }}
        >
          {events.length} recent
        </span>
      </div>

      {events.length === 0 ? (
        <div
          className="text-center py-8 text-[13px]"
          style={{ color: "var(--text-quaternary)" }}
        >
          <p>No events yet</p>
          <p className="text-[12px] mt-1">Start the simulation to see events flow in</p>
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[400px] overflow-y-auto -mx-1 px-1">
          {events.slice(0, 20).map((event, i) => {
            const c = eventColors[event.eventType] || eventColors.page_view;
            const detail = eventDetail(event);
            return (
              <div
                key={`${event.eventId}-${i}`}
                className="flex items-start gap-3 px-3 py-2 rounded-lg transition-colors duration-150"
                style={{
                  animation: i < 3 ? `fadeIn 300ms ease ${i * 80}ms both` : undefined,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-tertiary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {/* Icon */}
                <span className="text-[14px] mt-0.5 shrink-0">
                  {eventIcons[event.eventType] || "📌"}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: c.bg, color: c.text }}
                    >
                      {eventLabel(event.eventType)}
                    </span>
                    <span
                      className="text-[11px] truncate"
                      style={{ color: "var(--text-quaternary)" }}
                    >
                      {event.userId}
                    </span>
                  </div>
                  {detail && (
                    <p
                      className="text-[12px] mt-0.5 truncate"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {detail}
                    </p>
                  )}
                </div>

                {/* Time */}
                <span
                  className="text-[10px] shrink-0 mt-0.5"
                  style={{
                    color: "var(--text-quaternary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {timeAgo(event.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
