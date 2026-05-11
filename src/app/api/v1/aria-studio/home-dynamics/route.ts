// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Studio Home Dynamics
// GET  → list snapshots for a home (newest first), or ?latest=1 for the latest
// POST → generate a new snapshot from live records (RBAC: aria.generate_drafts)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { generateHomeDynamicsSnapshot } from "@/lib/aria/aria-home-dynamics";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  const latestOnly = searchParams.get("latest") === "1";

  if (latestOnly) {
    const latest = db.ariaHomeDynamicsSnapshots.latestForHome(homeId);
    return NextResponse.json({ data: latest });
  }

  const items = db.ariaHomeDynamicsSnapshots
    .findAll(homeId)
    .slice()
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at));

  return NextResponse.json({
    data: items,
    meta: { total: items.length },
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const homeId =
    typeof body.home_id === "string" ? body.home_id : DEFAULT_HOME_ID;
  const windowDays =
    typeof body.window_days === "number" ? body.window_days : undefined;
  const asOf = typeof body.as_of === "string" ? body.as_of : undefined;

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.generate_drafts",
    homeId,
    intent: "generate home_dynamics_snapshot",
  });
  if (!guard.ok) return guard.response;

  const snapshot = generateHomeDynamicsSnapshot(homeId, {
    windowDays,
    asOf,
    generatedBy: guard.actor.userId,
  });

  return NextResponse.json({ data: snapshot }, { status: 201 });
}
