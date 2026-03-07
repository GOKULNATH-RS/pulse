import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/metrics";

export async function GET() {
  try {
    const metrics = await getMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[Metrics API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
