import { getRedis, KEYS } from "./redis";
import { getUserProfile } from "./user-profile";
import { predictChurnRisk } from "./churn-prediction";
import { CampaignTrigger } from "./types";
import { v4 as uuidv4 } from "uuid";

// Cooldown between emails of the same trigger type per user (default: 1 hour)
let emailCooldownSeconds = 3600;

export function setEmailCooldown(seconds: number): void {
  emailCooldownSeconds = Math.max(5, seconds);
}

export async function evaluateCampaignTriggers(userId: string): Promise<CampaignTrigger | null> {
  const profile = await getUserProfile(userId);
  if (!profile) return null;

  const redis = getRedis();
  const now = Date.now();

  // Build all candidate triggers based on behavioural conditions
  type Candidate = { type: CampaignTrigger["triggerType"]; data: Record<string, unknown> };
  const candidates: Candidate[] = [];

  // 1. Cart Abandonment: has items and has been browsing
  if (profile.cartItems.length > 0 && profile.recentlyViewed.length >= 2) {
    candidates.push({
      type: "abandoned_cart",
      data: {
        cartItems: profile.cartItems,
        cartValue: profile.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      },
    });
  }

  // 2. Browse Abandonment: viewed 3+ products (regardless of cart — may window-shop while browsing)
  if (profile.recentlyViewed.length >= 3) {
    candidates.push({
      type: "browse_abandonment",
      data: { viewedProducts: profile.recentlyViewed.slice(0, 5) },
    });
  }

  // 3. Post-Purchase Cross-sell: recent purchase (within 24 h)
  if (profile.purchaseHistory.length > 0) {
    const lastPurchase = profile.purchaseHistory[0];
    if (now - lastPurchase.purchasedAt < 24 * 60 * 60 * 1000) {
      candidates.push({ type: "post_purchase_crosssell", data: { lastPurchase } });
    }
  }

  // 4. Re-engagement: multiple sessions but below-average engagement per session
  if (profile.sessionCount > 5 && profile.engagementScore / profile.sessionCount < 3) {
    candidates.push({
      type: "re_engagement",
      data: { sessionCount: profile.sessionCount, previousEngagement: profile.engagementScore },
    });
  }

  // 5. High Churn Risk
  const churnRisk = await predictChurnRisk(userId);
  if (churnRisk > 0.6) {
    candidates.push({ type: "high_churn_risk", data: { churnRisk, engagementScore: profile.engagementScore } });
  }

  if (candidates.length === 0) return null;

  // Filter out any trigger types still in their dedup cooldown
  const dedupChecks = await Promise.all(
    candidates.map((c) => redis.get(`campaign:dedup:${userId}:${c.type}`))
  );
  const available = candidates.filter((_, i) => !dedupChecks[i]);

  if (available.length === 0) return null;

  // Randomly pick among all eligible triggers for variety
  const chosen = available[Math.floor(Math.random() * available.length)];
  return createTrigger(userId, chosen.type, chosen.data);
}

async function createTrigger(
  userId: string,
  triggerType: CampaignTrigger["triggerType"],
  triggerData: Record<string, unknown>
): Promise<CampaignTrigger> {
  const redis = getRedis();

  // Dedup: check if a trigger of this type was already sent in the last hour
  const dedupKey = `campaign:dedup:${userId}:${triggerType}`;
  const exists = await redis.get(dedupKey);
  if (exists) return null as unknown as CampaignTrigger;

  const trigger: CampaignTrigger = {
    triggerId: uuidv4(),
    userId,
    triggerType,
    triggerData,
    createdAt: Date.now(),
    status: "pending",
  };

  // Store trigger and set dedup key (configurable cooldown TTL)
  await redis.lpush(KEYS.CAMPAIGN_QUEUE, JSON.stringify(trigger));
  await redis.hincrby(KEYS.METRICS, "campaignsTriggered", 1);
  await redis.set(dedupKey, "1", "EX", emailCooldownSeconds);

  return trigger;
}

export async function processCampaignQueue(): Promise<CampaignTrigger[]> {
  const redis = getRedis();
  const processed: CampaignTrigger[] = [];
  
  // Process up to 10 campaigns at a time
  for (let i = 0; i < 10; i++) {
    const raw = await redis.rpop(KEYS.CAMPAIGN_QUEUE);
    if (!raw) break;
    processed.push(JSON.parse(raw));
  }

  return processed;
}
