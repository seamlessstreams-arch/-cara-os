// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/gaps — List and detect evidence gaps
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { detectGaps } from "@/lib/cara-studio/gap-detection.service";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id") ?? undefined;
    const gaps = await detectGaps(homeId(), childId);
    return NextResponse.json({ data: gaps });
  } catch (err) {
    console.error("[cara-studio/gaps] Error:", err);
    return NextResponse.json({ error: "Failed to detect gaps" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gaps = await detectGaps(homeId(), body.child_id);
    return NextResponse.json({ data: gaps }, { status: 201 });
  } catch (err) {
    console.error("[cara-studio/gaps] POST error:", err);
    return NextResponse.json({ error: "Failed to run gap detection" }, { status: 500 });
  }
}
