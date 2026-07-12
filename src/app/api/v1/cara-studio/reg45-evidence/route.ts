// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Reg 45 Live Evidence Bank
// GET  → load themed snapshot (filter period_start/period_end)
// POST → run evidence build (RBAC: cara.generate_drafts)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  loadReg45Evidence,
  runReg45EvidenceBuild,
} from "@/lib/cara/cara-reg45-evidence";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { readJsonBody } from "@/lib/http/read-json";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  const periodStart = searchParams.get("period_start") ?? undefined;
  const periodEnd = searchParams.get("period_end") ?? undefined;
  const snapshot = loadReg45Evidence(homeId, {
    periodStart: periodStart ?? undefined,
    periodEnd: periodEnd ?? undefined,
  });
  return NextResponse.json({ data: snapshot });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
  } catch {
    body = {};
  }

  const homeId = typeof body.home_id === "string" ? body.home_id : DEFAULT_HOME_ID;
  const periodStart = typeof body.period_start === "string" ? body.period_start : undefined;
  const periodEnd = typeof body.period_end === "string" ? body.period_end : undefined;

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.generate_drafts",
    homeId,
    intent: "run reg45_evidence_build",
  });
  if (!guard.ok) return guard.response;

  const snapshot = runReg45EvidenceBuild(homeId, { periodStart, periodEnd });
  return NextResponse.json({ data: snapshot }, { status: 201 });
}
