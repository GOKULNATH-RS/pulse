import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/auth";
import { processEvent } from "@/lib/event-processor";
import { evaluateCampaignTriggers } from "@/lib/campaign-triggers";
import { generatePersonalization } from "@/lib/personalization";
import { sendEmail } from "@/lib/email-engine";
import { recordLatency } from "@/lib/metrics";
import { UserEvent } from "@/lib/types";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // JWT Authentication
  const token = extractToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization header" },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Support single event or batch
    const events: UserEvent[] = Array.isArray(body) ? body : [body];

    // Validate events
    for (const event of events) {
      if (!event.userId || !event.eventType || !event.timestamp) {
        return NextResponse.json(
          { error: "Each event must have userId, eventType, and timestamp" },
          { status: 400 }
        );
      }

      const validEventTypes = ["page_view", "product_view", "add_to_cart", "remove_from_cart", "purchase", "search", "wishlist"];
      if (!validEventTypes.includes(event.eventType)) {
        return NextResponse.json(
          { error: `Invalid eventType: ${event.eventType}` },
          { status: 400 }
        );
      }
    }

    // Process all events
    const results = [];
    for (const event of events) {
      await processEvent(event);

      // Evaluate campaign triggers
      const trigger = await evaluateCampaignTriggers(event.userId);
      if (trigger) {
        const emailPayload = await generatePersonalization(trigger);
        if (emailPayload) {
          // Send email asynchronously (fire and forget for low latency)
          sendEmail(emailPayload).catch(console.error);
          results.push({
            eventId: event.eventId,
            campaignTriggered: true,
            triggerType: trigger.triggerType,
          });
          continue;
        }
      }
      results.push({ eventId: event.eventId, campaignTriggered: false });
    }

    const latency = Date.now() - startTime;
    await recordLatency(latency);

    return NextResponse.json({
      processed: events.length,
      results,
      latencyMs: latency,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
