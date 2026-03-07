import { getRedis, KEYS } from "./redis";
import { getUserProfile } from "./user-profile";
import { predictChurnRisk } from "./churn-prediction";
import { CampaignTrigger } from "./types";
import { v4 as uuidv4 } from "uuid";

export async function evaluateCampaignTriggers(userId: string): Promise<CampaignTrigger | null> {
  const profile = await getUserProfile(userId);
  if (!profile) return null;

  const now = Date.now();

  // 1. Cart Abandonment: user has items in cart and has been browsing (not just added)
  if (
    profile.cartItems.length > 0 &&
    profile.recentlyViewed.length >= 2
  ) {
    return createTrigger(userId, "abandoned_cart", {
      cartItems: profile.cartItems,
      cartValue: profile.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    });
  }

  // 2. Browse Abandonment: viewed 3+ products without adding to cart
  if (
    profile.recentlyViewed.length >= 3 &&
    profile.cartItems.length === 0 &&
    profile.purchaseHistory.length === 0
  ) {
    return createTrigger(userId, "browse_abandonment", {
      viewedProducts: profile.recentlyViewed.slice(0, 5),
    });
  }

  // 3. Post-Purchase Cross-sell: recent purchase with recommendations
  if (profile.purchaseHistory.length > 0) {
    const lastPurchase = profile.purchaseHistory[0];
    if (now - lastPurchase.purchasedAt < 24 * 60 * 60 * 1000) {
      return createTrigger(userId, "post_purchase_crosssell", {
        lastPurchase,
      });
    }
  }

  // 4. Re-engagement: high session count but low engagement per session
  if (
    profile.sessionCount > 10 &&
    profile.engagementScore / profile.sessionCount < 3
  ) {
    return createTrigger(userId, "re_engagement", {
      sessionCount: profile.sessionCount,
      previousEngagement: profile.engagementScore,
    });
  }

  // 5. High Churn Risk: compute churn score on the fly
  const churnRisk = await predictChurnRisk(userId);
  if (churnRisk > 0.6) {
    return createTrigger(userId, "high_churn_risk", {
      churnRisk,
      engagementScore: profile.engagementScore,
    });
  }

  return null;
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

  // Store trigger and set dedup key (1 hour TTL)
  await redis.lpush(KEYS.CAMPAIGN_QUEUE, JSON.stringify(trigger));
  await redis.hincrby(KEYS.METRICS, "campaignsTriggered", 1);
  await redis.set(dedupKey, "1", "EX", 3600);

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
