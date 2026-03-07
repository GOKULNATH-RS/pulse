import { getRedis, KEYS } from "./redis";
import { UserEvent } from "./types";

export async function processEvent(event: UserEvent): Promise<void> {
  const redis = getRedis();
  const pipeline = redis.pipeline();
  const now = Date.now();

  // Store event in stream
  pipeline.xadd(
    KEYS.EVENT_STREAM,
    "MAXLEN",
    "~",
    "100000",
    "*",
    "data",
    JSON.stringify(event)
  );

  // Track active users (60-second window)
  pipeline.zadd(KEYS.ACTIVE_USERS, now, event.userId);
  pipeline.zremrangebyscore(KEYS.ACTIVE_USERS, "-inf", String(now - 60000));

  // Increment global metrics
  pipeline.hincrby(KEYS.METRICS, "totalEvents", 1);

  // Store event timestamp for rate tracking
  pipeline.zadd(KEYS.METRICS_TIMESERIES, now, `${event.eventId}`);
  pipeline.zremrangebyscore(KEYS.METRICS_TIMESERIES, "-inf", String(now - 60000));

  await pipeline.exec();

  // Update user profile based on event type
  await updateUserProfile(event);
}

async function updateUserProfile(event: UserEvent): Promise<void> {
  const redis = getRedis();
  const profileKey = KEYS.USER_PROFILE(event.userId);
  const pipeline = redis.pipeline();

  // Update last activity
  pipeline.hset(profileKey, "lastActivity", String(event.timestamp));

  // Increment session count on page view
  if (event.eventType === "page_view") {
    pipeline.hincrby(profileKey, "sessionCount", 1);
    pipeline.hincrby(profileKey, "engagementScore", 1);
  }

  // Track product views
  if (event.eventType === "product_view" && event.data.productId) {
    pipeline.lpush(KEYS.USER_VIEWED(event.userId), JSON.stringify({
      productId: event.data.productId,
      productName: event.data.productName,
      price: event.data.productPrice,
      category: event.data.productCategory,
      viewedAt: event.timestamp,
    }));
    pipeline.ltrim(KEYS.USER_VIEWED(event.userId), 0, 49);
    pipeline.hincrby(profileKey, "engagementScore", 2);
  }

  // Track cart operations
  if (event.eventType === "add_to_cart" && event.data.productId) {
    const cartItem = JSON.stringify({
      productId: event.data.productId,
      productName: event.data.productName,
      price: event.data.productPrice,
      quantity: event.data.quantity || 1,
      addedAt: event.timestamp,
    });
    pipeline.hset(KEYS.USER_CART(event.userId), event.data.productId, cartItem);
    pipeline.hincrby(profileKey, "engagementScore", 3);
  }

  if (event.eventType === "remove_from_cart" && event.data.productId) {
    pipeline.hdel(KEYS.USER_CART(event.userId), event.data.productId);
  }

  // Track purchases
  if (event.eventType === "purchase" && event.data.productId) {
    const purchaseItem = JSON.stringify({
      productId: event.data.productId,
      productName: event.data.productName,
      price: event.data.productPrice,
      quantity: event.data.quantity || 1,
      purchasedAt: event.timestamp,
    });
    pipeline.lpush(KEYS.USER_PURCHASES(event.userId), purchaseItem);
    pipeline.ltrim(KEYS.USER_PURCHASES(event.userId), 0, 99);
    // Remove from cart after purchase
    pipeline.hdel(KEYS.USER_CART(event.userId), event.data.productId);
    // Update total spent
    pipeline.hincrbyfloat(profileKey, "totalSpent", String(event.data.productPrice || 0));
    pipeline.hincrby(profileKey, "engagementScore", 5);
  }

  // Search events
  if (event.eventType === "search") {
    pipeline.hincrby(profileKey, "engagementScore", 1);
  }

  await pipeline.exec();

  // Set profile expiry (30 days)
  await redis.expire(profileKey, 30 * 24 * 3600);
}

export async function getEventRate(): Promise<number> {
  const redis = getRedis();
  const now = Date.now();
  return redis.zcount(KEYS.METRICS_TIMESERIES, now - 60000, now);
}
