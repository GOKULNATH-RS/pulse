import { NextRequest, NextResponse } from "next/server";
import { generateBatch } from "@/lib/event-simulator";
import { processEvent } from "@/lib/event-processor";
import { evaluateCampaignTriggers } from "@/lib/campaign-triggers";
import { generatePersonalization } from "@/lib/personalization";
import { sendEmail } from "@/lib/email-engine";
import { setUserBasicInfo } from "@/lib/user-profile";
import { SIMULATED_USERS } from "@/lib/event-simulator";

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let currentRate = 100; // events per minute

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, rate } = body;

    if (action === "start") {
      if (isRunning) {
        return NextResponse.json({ status: "already_running", rate: currentRate });
      }

      currentRate = Math.min(Math.max(rate || 5000, 100), 10000);
      const intervalMs = Math.max(Math.floor(60000 / currentRate), 10);
      const batchSize = Math.max(1, Math.floor(currentRate / (60000 / intervalMs)));

      // Initialize simulated user profiles
      for (const user of SIMULATED_USERS.slice(0, 20)) {
        await setUserBasicInfo(user.userId, user.email, user.name);
      }

      isRunning = true;
      simulationInterval = setInterval(async () => {
        if (!isRunning) return;
        const events = generateBatch(batchSize);
        for (const event of events) {
          try {
            await processEvent(event);
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

    return NextResponse.json(
      { error: "Invalid action. Use 'start', 'stop', or 'status'" },
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
  });
}

export const dynamic = "force-dynamic";
