import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function GET() {
  try {
    const redis = getRedis();
    const raw = await redis.lrange("events:recent", 0, 29);
    const events = raw.map((s) => JSON.parse(s));
    return NextResponse.json({ events });
  } catch (error) {
    console.error("[Events API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
