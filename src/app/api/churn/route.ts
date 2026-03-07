import { NextRequest, NextResponse } from "next/server";
import { predictChurnRisk, runChurnPredictionBatch } from "@/lib/churn-prediction";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, batch } = body;

    if (batch) {
      const results = await runChurnPredictionBatch();
      return NextResponse.json({ results, count: Object.keys(results).length });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const churnRisk = await predictChurnRisk(userId);
    return NextResponse.json({ userId, churnRisk });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

export const dynamic = "force-dynamic";
