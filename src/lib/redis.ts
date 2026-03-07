import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    });
  }
  return redis;
}

// Key patterns
export const KEYS = {
  EVENT_STREAM: "events:stream",
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_VIEWED: (userId: string) => `user:viewed:${userId}`,
  USER_CART: (userId: string) => `user:cart:${userId}`,
  USER_PURCHASES: (userId: string) => `user:purchases:${userId}`,
  USER_SESSIONS: (userId: string) => `user:sessions:${userId}`,
  CAMPAIGN_QUEUE: "campaigns:queue",
  CAMPAIGN_SENT: "campaigns:sent",
  CAMPAIGN_FAILED: "campaigns:failed",
  METRICS: "metrics:global",
  METRICS_TIMESERIES: "metrics:timeseries",
  ACTIVE_USERS: "users:active",
  PRODUCT_CATALOG: "products:catalog",
  PRODUCT_INVENTORY: (productId: string) => `product:inventory:${productId}`,
  CAMPAIGN_TRIGGERS: "campaigns:triggers",
  EMAIL_PENDING: "emails:pending",
  EMAIL_SENT: "emails:sent",
  EMAIL_FAILED: "emails:failed",
};
