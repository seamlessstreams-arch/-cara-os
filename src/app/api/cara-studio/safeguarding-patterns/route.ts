// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/safeguarding-patterns — Safeguarding pattern engine
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { scanSafeguardingPatterns, listSafeguardingPatterns } from "@/lib/cara-studio/safeguarding-patterns.service";

function hId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const patterns = await listSafeguardingPatterns(hId(), childId, status);
    return NextResponse.json({ data: patterns });
  } catch (err) {
    console.error("[cara-studio/safeguarding-patterns] GET error:", err);
    return NextResponse.json({ error: "Failed to list patterns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const patterns = await scanSafeguardingPatterns(hId(), body.child_id);
    return NextResponse.json({ data: patterns }, { status: 201 });
  } catch (err) {
    console.error("[cara-studio/safeguarding-patterns] POST error:", err);
    return NextResponse.json({ error: "Failed to scan patterns" }, { status: 500 });
  }
}
