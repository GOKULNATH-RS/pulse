import { EmailPayload } from "./types";
import { getRedis, KEYS } from "./redis";

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const redis = getRedis();
  const gasUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!gasUrl) {
    // Simulate email sending when no GAS URL is configured
    console.log(`[Email Simulation] Sending email to ${payload.to}: ${payload.subject}`);
    await simulateEmailSend(payload);
    return true;
  }

  try {
    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      await redis.hincrby(KEYS.METRICS, "emailsSent", 1);
      await redis.hincrby(KEYS.METRICS, "emailsPending", -1);
      await redis.lpush(KEYS.EMAIL_SENT, JSON.stringify({
        ...payload,
        sentAt: Date.now(),
      }));
      await redis.ltrim(KEYS.EMAIL_SENT, 0, 199); // keep last 200
      return true;
    } else {
      throw new Error(`GAS responded with ${response.status}`);
    }
  } catch (error) {
    console.error("[Email Engine] Failed to send email:", error);
    await redis.hincrby(KEYS.METRICS, "emailsFailed", 1);
    await redis.hincrby(KEYS.METRICS, "emailsPending", -1);
    await redis.lpush(KEYS.EMAIL_FAILED, JSON.stringify({
      ...payload,
      failedAt: Date.now(),
      error: String(error),
    }));
    await redis.ltrim(KEYS.EMAIL_FAILED, 0, 99); // keep last 100
    return false;
  }
}

async function simulateEmailSend(payload: EmailPayload): Promise<void> {
  const redis = getRedis();
  // Simulate 50ms processing delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  // 95% success rate simulation
  const success = Math.random() < 0.95;

  if (success) {
    await redis.hincrby(KEYS.METRICS, "emailsSent", 1);
    await redis.hincrby(KEYS.METRICS, "emailsPending", -1);
    await redis.lpush(KEYS.EMAIL_SENT, JSON.stringify({
      ...payload,
      sentAt: Date.now(),
    }));
    await redis.ltrim(KEYS.EMAIL_SENT, 0, 199); // keep last 200
  } else {
    await redis.hincrby(KEYS.METRICS, "emailsFailed", 1);
    await redis.hincrby(KEYS.METRICS, "emailsPending", -1);
    await redis.lpush(KEYS.EMAIL_FAILED, JSON.stringify({
      ...payload,
      failedAt: Date.now(),
      error: "Simulated failure",
    }));
    await redis.ltrim(KEYS.EMAIL_FAILED, 0, 99); // keep last 100
  }
}

export async function processEmailQueue(): Promise<number> {
  const redis = getRedis();
  let processed = 0;

  for (let i = 0; i < 10; i++) {
    const raw = await redis.rpop(KEYS.EMAIL_PENDING);
    if (!raw) break;

    const payload: EmailPayload = JSON.parse(raw);
    await sendEmail(payload);
    processed++;
  }

  return processed;
}
