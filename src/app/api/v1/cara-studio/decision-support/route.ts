// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Decision Support
// GET  → list formulations + recommendations (filter by child_id)
// POST → run engine (RBAC: cara.generate_drafts)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  runDecisionSupport,
  loadDecisionSupport,
} from "@/lib/cara/cara-decision-support";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  const childId = searchParams.get("child_id");
  const snapshot = loadDecisionSupport(homeId, childId ?? null);
  return NextResponse.json({ data: snapshot });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const homeId = typeof body.home_id === "string" ? body.home_id : DEFAULT_HOME_ID;
  const childId = typeof body.child_id === "string" ? body.child_id : null;
  const lookbackDays =
    typeof body.lookback_days === "number" ? body.lookback_days : undefined;

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.generate_drafts",
    homeId,
    intent: "run decision_support",
  });
  if (!guard.ok) return guard.response;

  const snapshot = runDecisionSupport(homeId, {
    childId,
    lookbackDays,
    generatedBy: guard.actor.userId,
  });
  return NextResponse.json({ data: snapshot }, { status: 201 });
}
