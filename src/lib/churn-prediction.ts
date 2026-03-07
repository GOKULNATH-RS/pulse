import { getRedis, KEYS } from "./redis";
import { getUserProfile } from "./user-profile";
import { getAllActiveUserIds } from "./user-profile";

/**
 * Simple ML-inspired churn prediction model.
 * Uses a logistic-regression-style scoring of user features.
 */
export async function predictChurnRisk(userId: string): Promise<number> {
  const profile = await getUserProfile(userId);
  if (!profile) return 0.5;

  const now = Date.now();
  const daysSinceLastActivity = (now - profile.lastActivity) / (24 * 60 * 60 * 1000);
  const daysSinceCreation = (now - profile.createdAt) / (24 * 60 * 60 * 1000);

  // Feature weights (simulating trained model coefficients)
  const features = {
    inactivityDays: Math.min(daysSinceLastActivity / 30, 1),        // 0-1: higher = more inactive
    lowEngagement: 1 - Math.min(profile.engagementScore / 100, 1),  // 0-1: higher = less engaged
    fewSessions: 1 - Math.min(profile.sessionCount / 20, 1),        // 0-1: higher = fewer sessions
    noRecentPurchase: profile.purchaseHistory.length === 0 ? 0.8 : 0.2,
    emptyCart: profile.cartItems.length === 0 ? 0.3 : 0.0,
    lowSpend: 1 - Math.min(profile.totalSpent / 500, 1),
    accountAge: Math.min(daysSinceCreation / 90, 1) * 0.2,          // Newer accounts have slight risk
  };

  const weights = {
    inactivityDays: 0.30,
    lowEngagement: 0.20,
    fewSessions: 0.15,
    noRecentPurchase: 0.15,
    emptyCart: 0.05,
    lowSpend: 0.10,
    accountAge: 0.05,
  };

  // Weighted sum
  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (features as Record<string, number>)[key] * weight;
  }

  // Apply sigmoid-like transformation for better distribution
  const churnRisk = 1 / (1 + Math.exp(-6 * (score - 0.5)));
  const roundedRisk = Math.round(churnRisk * 100) / 100;

  // Store churn risk in profile
  const redis = getRedis();
  await redis.hset(KEYS.USER_PROFILE(userId), "churnRisk", String(roundedRisk));

  return roundedRisk;
}

export async function runChurnPredictionBatch(): Promise<Record<string, number>> {
  const userIds = await getAllActiveUserIds();
  const results: Record<string, number> = {};

  for (const userId of userIds.slice(0, 100)) {
    results[userId] = await predictChurnRisk(userId);
  }

  return results;
}
