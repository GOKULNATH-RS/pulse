import { NextRequest, NextResponse } from "next/server";
import { generateBatch, getSimulatedUsers, setSimulatedUsers } from "@/lib/event-simulator";
import { processEvent } from "@/lib/event-processor";
import { evaluateCampaignTriggers } from "@/lib/campaign-triggers";
import { generatePersonalization } from "@/lib/personalization";
import { sendEmail } from "@/lib/email-engine";
import { setUserBasicInfo } from "@/lib/user-profile";
import { getRedis } from "@/lib/redis";
import { setEmailCooldown } from "@/lib/campaign-triggers";

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let currentRate = 10;      // events per minute
let currentCooldown = 30; // email cooldown seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, rate, emailCooldown } = body;

    if (action === "start") {
      if (isRunning) {
        return NextResponse.json({ status: "already_running", rate: currentRate, emailCooldown: currentCooldown });
      }

      currentRate = Math.min(Math.max(rate || 10, 1), 10000);
      currentCooldown = Math.min(Math.max(emailCooldown || 30, 5), 3600);
      setEmailCooldown(currentCooldown);
      const intervalMs = Math.max(Math.floor(60000 / currentRate), 100);
      const batchSize = 1; // one event at a time for clarity

      // Initialize simulated user profile
      for (const user of getSimulatedUsers()) {
        await setUserBasicInfo(user.userId, user.email, user.name);
      }

      isRunning = true;
      simulationInterval = setInterval(async () => {
        if (!isRunning) return;
        const events = generateBatch(batchSize);
        for (const event of events) {
          try {
            await processEvent(event);

            // Store recent event for UI feed
            const redis = getRedis();
            await redis.lpush("events:recent", JSON.stringify(event));
            await redis.ltrim("events:recent", 0, 49);

            const trigger = await evaluateCampaignTriggers(event.userId);
            if (trigger) {
              const emailPayload = await generatePersonalization(trigger);
              if (emailPayload) {
                sendEmail(emailPayload).catch(console.error);
              }
            }
          } catch (err) {
            console.error("[Simulation] Error processing event:", err);
          }
        }
      }, intervalMs);

      return NextResponse.json({
        status: "started",
        rate: currentRate,
        emailCooldown: currentCooldown,
        batchSize,
        intervalMs,
      });
    }

    if (action === "stop") {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      isRunning = false;
      return NextResponse.json({ status: "stopped" });
    }

    if (action === "status") {
      return NextResponse.json({
        isRunning,
        rate: currentRate,
      });
    }

    if (action === "update_users") {
      const { users } = body;
      if (Array.isArray(users) && users.length > 0) {
        setSimulatedUsers(users);
        return NextResponse.json({ status: "users_updated", users: getSimulatedUsers() });
      }
      return NextResponse.json({ error: "Provide a non-empty users array" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'start', 'stop', 'status', or 'update_users'" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    isRunning,
    rate: currentRate,
    emailCooldown: currentCooldown,
    users: getSimulatedUsers(),
  });
}

export const dynamic = "force-dynamic";
