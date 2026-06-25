import { NextRequest, NextResponse } from "next/server";
import { runCaraIntelligence } from "@/lib/cara/engine";
import { isAiGloballyEnabled } from "@/lib/cara/ai-availability";

export async function POST(req: NextRequest) {
  try {
    if (!isAiGloballyEnabled()) {
      return NextResponse.json({ error: "Cara AI is disabled (CARA_AI_ENABLED=false)." }, { status: 403 });
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
