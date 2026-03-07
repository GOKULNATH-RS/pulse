"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, MailCheck, MailX, Clock } from "lucide-react";

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

export function CampaignFeed() {
  const [campaigns, setCampaigns] = useState<CampaignData | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 3000);
    return () => clearInterval(interval);
  }, [fetchCampaigns]);

  const triggerLabels: Record<string, string> = {
    abandoned_cart: "Cart Abandonment",
    browse_abandonment: "Browse Abandonment",
    post_purchase_crosssell: "Cross-Sell",
    re_engagement: "Re-engagement",
    high_churn_risk: "Churn Risk",
  };

  const triggerColors: Record<string, string> = {
    abandoned_cart: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    browse_abandonment: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    post_purchase_crosssell: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    re_engagement: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    high_churn_risk: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5" />
        Campaign Activity
      </h3>

      {!campaigns ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-750">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {campaigns.pendingCount > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-sm">
              <Clock className="w-4 h-4" />
              {campaigns.pendingCount} campaigns pending
            </div>
          )}

          {campaigns.sent.length === 0 && campaigns.failed.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              No campaigns yet. Start the simulation to generate activity.
            </p>
          ) : null}

          {campaigns.sent.slice(0, 10).map((email, i) => (
            <div
              key={`sent-${i}`}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MailCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {email.subject}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${triggerColors[email.triggerType] || "bg-gray-100 text-gray-700"}`}>
                    {triggerLabels[email.triggerType] || email.triggerType}
                  </span>
                  <span className="text-xs text-gray-400">
                    to {email.to}
                  </span>
                </div>
                {email.sentAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(email.sentAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}

          {campaigns.failed.slice(0, 5).map((email, i) => (
            <div
              key={`failed-${i}`}
              className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20"
            >
              <MailX className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 truncate">
                  Failed: {email.subject}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {email.error || "Unknown error"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
