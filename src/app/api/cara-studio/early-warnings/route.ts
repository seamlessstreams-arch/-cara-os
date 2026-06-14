// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/early-warnings — Early warning indicators
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { runEarlyWarningChecks, listEarlyWarnings } from "@/lib/cara-studio/early-warning.service";

function hId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const warnings = await listEarlyWarnings(hId(), childId, status);
    return NextResponse.json({ data: warnings });
  } catch (err) {
    console.error("[cara-studio/early-warnings] GET error:", err);
    return NextResponse.json({ error: "Failed to list warnings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const warnings = await runEarlyWarningChecks(hId(), body.child_id);
    return NextResponse.json({ data: warnings }, { status: 201 });
  } catch (err) {
    console.error("[cara-studio/early-warnings] POST error:", err);
    return NextResponse.json({ error: "Failed to run warning checks" }, { status: 500 });
  }
}
