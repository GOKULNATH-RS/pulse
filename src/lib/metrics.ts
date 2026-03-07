import { getRedis, KEYS } from "./redis";
import { MetricsSnapshot } from "./types";
import { getActiveUserCount } from "./user-profile";

export async function getMetrics(): Promise<MetricsSnapshot> {
  const redis = getRedis();
  const now = Date.now();

  const [metrics, activeUsers, eventsLastMinute] = await Promise.all([
    redis.hgetall(KEYS.METRICS),
    getActiveUserCount(),
    redis.zcount(KEYS.METRICS_TIMESERIES, now - 60000, now),
  ]);

  const totalEvents = parseInt(metrics.totalEvents || "0");
  const emailsSent = parseInt(metrics.emailsSent || "0");
  const emailsFailed = parseInt(metrics.emailsFailed || "0");
  const emailsPending = parseInt(metrics.emailsPending || "0");
  const campaignsTriggered = parseInt(metrics.campaignsTriggered || "0");
  const totalEmailAttempts = emailsSent + emailsFailed;

  return {
    totalEvents,
    eventsPerSecond: Math.round(eventsLastMinute / 60 * 100) / 100,
    activeUsers,
    campaignsTriggered,
    emailsPending: Math.max(0, emailsPending),
    emailsSent,
    emailsFailed,
    emailSuccessRate: totalEmailAttempts > 0
      ? Math.round((emailsSent / totalEmailAttempts) * 10000) / 100
      : 100,
    avgProcessingLatency: parseFloat(metrics.avgLatency || "0"),
    eventsPerMinute: eventsLastMinute,
  };
}

export async function recordLatency(latencyMs: number): Promise<void> {
  const redis = getRedis();
  // Simple exponential moving average
  const current = await redis.hget(KEYS.METRICS, "avgLatency");
  const currentAvg = current ? parseFloat(current) : latencyMs;
  const newAvg = currentAvg * 0.9 + latencyMs * 0.1;
  await redis.hset(KEYS.METRICS, "avgLatency", String(Math.round(newAvg * 100) / 100));
}
