import { getRedis, KEYS } from "./redis";
import { UserProfile, CartItem, PurchaseItem } from "./types";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const redis = getRedis();
  const profileKey = KEYS.USER_PROFILE(userId);

  const profileData = await redis.hgetall(profileKey);
  if (!profileData || Object.keys(profileData).length === 0) return null;

  // Get recently viewed
  const viewedRaw = await redis.lrange(KEYS.USER_VIEWED(userId), 0, 9);
  const recentlyViewed = viewedRaw.map((v) => {
    const parsed = JSON.parse(v);
    return parsed.productId;
  });

  // Get cart items
  const cartRaw = await redis.hgetall(KEYS.USER_CART(userId));
  const cartItems: CartItem[] = Object.values(cartRaw).map((v) => JSON.parse(v));

  // Get purchase history
  const purchasesRaw = await redis.lrange(KEYS.USER_PURCHASES(userId), 0, 19);
  const purchaseHistory: PurchaseItem[] = purchasesRaw.map((v) => JSON.parse(v));

  return {
    userId,
    email: profileData.email || `${userId}@example.com`,
    name: profileData.name || `User ${userId}`,
    recentlyViewed,
    cartItems,
    purchaseHistory,
    sessionCount: parseInt(profileData.sessionCount || "0"),
    engagementScore: parseInt(profileData.engagementScore || "0"),
    lastActivity: parseInt(profileData.lastActivity || "0"),
    totalSpent: parseFloat(profileData.totalSpent || "0"),
    churnRisk: profileData.churnRisk ? parseFloat(profileData.churnRisk) : undefined,
    createdAt: parseInt(profileData.createdAt || String(Date.now())),
  };
}

export async function setUserBasicInfo(
  userId: string,
  email: string,
  name: string
): Promise<void> {
  const redis = getRedis();
  const profileKey = KEYS.USER_PROFILE(userId);
  await redis.hset(profileKey, {
    email,
    name,
    createdAt: String(Date.now()),
  });
}

export async function getActiveUserCount(): Promise<number> {
  const redis = getRedis();
  const now = Date.now();
  return redis.zcount(KEYS.ACTIVE_USERS, now - 60000, now);
}

export async function getAllActiveUserIds(): Promise<string[]> {
  const redis = getRedis();
  const now = Date.now();
  return redis.zrangebyscore(KEYS.ACTIVE_USERS, now - 300000, now);
}
