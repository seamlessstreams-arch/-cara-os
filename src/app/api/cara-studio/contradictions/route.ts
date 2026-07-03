// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/contradictions — Contradiction detection
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { detectContradictions, listContradictions } from "@/lib/cara-studio/contradiction.service";

function hId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const contradictions = await listContradictions(hId(), childId, status);
    return NextResponse.json({ data: contradictions });
  } catch (err) {
    console.error("[cara-studio/contradictions] GET error:", err);
    return NextResponse.json({ error: "Failed to list contradictions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const contradictions = await detectContradictions(hId(), body.child_id);
    return NextResponse.json({ data: contradictions }, { status: 201 });
  } catch (err) {
    console.error("[cara-studio/contradictions] POST error:", err);
    return NextResponse.json({ error: "Failed to detect contradictions" }, { status: 500 });
  }
}
