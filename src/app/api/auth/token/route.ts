import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret } = body;

    // Simple credential validation for demo purposes
    // In production, validate against a database
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "clientId and clientSecret are required" },
        { status: 400 }
      );
    }

    // Demo: accept any non-empty credentials
    const token = generateToken({
      sub: clientId,
      role: "api_client",
    });

    return NextResponse.json({
      token,
      expiresIn: "24h",
      tokenType: "Bearer",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
