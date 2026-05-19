// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Care Graph
// GET  → load current persisted graph (filterable by child_id)
// POST → rebuild graph (RBAC: aria.generate_drafts)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { buildCareGraph, loadCareGraph } from "@/lib/aria/aria-care-graph";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  const childId = searchParams.get("child_id");
  const snapshot = loadCareGraph(homeId, childId ?? null);
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

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.generate_drafts",
    homeId,
    intent: "rebuild care_graph",
  });
  if (!guard.ok) return guard.response;

  const snapshot = buildCareGraph(homeId, {
    lookbackDays,
    childId,
    persist: true,
  });
  return NextResponse.json({ data: snapshot }, { status: 201 });
}
