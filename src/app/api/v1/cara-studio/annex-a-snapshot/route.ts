// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Annex A Live Snapshot
// GET  → list snapshots for a home (latest first)
// POST → run snapshot build (RBAC: cara.generate_drafts)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  loadAnnexASnapshots,
  runAnnexASnapshot,
} from "@/lib/cara/cara-annex-a-snapshot";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  const snapshots = loadAnnexASnapshots(homeId);
  return NextResponse.json({ data: snapshots });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const homeId = typeof body.home_id === "string" ? body.home_id : DEFAULT_HOME_ID;
  const periodStart = typeof body.period_start === "string" ? body.period_start : undefined;
  const periodEnd = typeof body.period_end === "string" ? body.period_end : undefined;

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.generate_drafts",
    homeId,
    intent: "run annex_a_snapshot",
  });
  if (!guard.ok) return guard.response;

  const snapshot = runAnnexASnapshot(homeId, { periodStart, periodEnd });
  return NextResponse.json({ data: snapshot }, { status: 201 });
}
