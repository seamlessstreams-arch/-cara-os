import { NextRequest, NextResponse } from "next/server";
import { runCaraIntelligence } from "@/lib/cara/engine";

export async function POST(req: NextRequest) {
  try {
    if ((process.env.CARA_AI_ENABLED ?? process.env.CARA_AI_ENABLED) !== "true") {
      return NextResponse.json({ error: "Cara AI is disabled. Set CARA_AI_ENABLED=true in your environment." }, { status: 403 });
    }

    // Use Cara's existing auth — for now fall back to x-user-id header
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthenticated request." }, { status: 401 });
    }

    const body = await req.json();
    const result = await runCaraIntelligence(body, userId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
