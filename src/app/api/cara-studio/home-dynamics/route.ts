// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/home-dynamics — Home dynamics snapshots
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { generateHomeDynamicsSnapshot, getLatestSnapshot, listSnapshots } from "@/lib/cara-studio/home-dynamics.service";

function hId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") ?? "latest";

    if (view === "trend") {
      const days = parseInt(searchParams.get("days") ?? "30", 10);
      const snapshots = await listSnapshots(hId(), days);
      return NextResponse.json({ data: snapshots });
    }

    const snapshot = await getLatestSnapshot(hId());
    return NextResponse.json({ data: snapshot });
  } catch (err) {
    console.error("[cara-studio/home-dynamics] GET error:", err);
    return NextResponse.json({ error: "Failed to get home dynamics" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const snapshot = await generateHomeDynamicsSnapshot(hId(), body.snapshot_date);
    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (err) {
    console.error("[cara-studio/home-dynamics] POST error:", err);
    return NextResponse.json({ error: "Failed to generate snapshot" }, { status: 500 });
  }
}
