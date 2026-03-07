import { NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";

export async function GET() {
  try {
    const redis = getRedis();
    
    // Get recent campaigns
    const [sentRaw, failedRaw, pendingCount] = await Promise.all([
      redis.lrange(KEYS.EMAIL_SENT, 0, 19),
      redis.lrange(KEYS.EMAIL_FAILED, 0, 9),
      redis.llen(KEYS.CAMPAIGN_QUEUE),
    ]);

    const sent = sentRaw.map((s) => JSON.parse(s));
    const failed = failedRaw.map((s) => JSON.parse(s));

    return NextResponse.json({
      sent,
      failed,
      pendingCount,
    });
  } catch (error) {
    console.error("[Campaigns API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
