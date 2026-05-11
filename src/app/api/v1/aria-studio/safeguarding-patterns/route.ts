// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Safeguarding Patterns
// GET  → list patterns (filterable by status/severity/child)
// POST → run scan (RBAC: aria.generate_drafts)
// PATCH → update status (acknowledge / dismiss / mark actioned)
//        (RBAC: aria.approve_outputs)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { runSafeguardingScan } from "@/lib/aria/aria-safeguarding-patterns";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import type { AriaSafeguardingPattern } from "@/types/aria-studio";

const DEFAULT_HOME_ID = "home_oak";

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const childId = searchParams.get("child_id");

  let items: AriaSafeguardingPattern[] = db.ariaSafeguardingPatterns.findAll(homeId);
  if (status) items = items.filter((p) => p.status === status);
  if (severity) items = items.filter((p) => p.severity === severity);
  if (childId) items = items.filter((p) => p.child_id === childId);

  items = items.slice().sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
      b.detected_at.localeCompare(a.detected_at),
  );

  return NextResponse.json({
    data: items,
    meta: {
      total: items.length,
      open: items.filter((p) => p.status === "open").length,
      critical: items.filter((p) => p.severity === "critical").length,
      high: items.filter((p) => p.severity === "high").length,
    },
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
  const lookbackDays =
    typeof body.lookback_days === "number" ? body.lookback_days : undefined;
  const asOf = typeof body.as_of === "string" ? body.as_of : undefined;

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.generate_drafts",
    homeId,
    intent: "scan safeguarding_patterns",
  });
  if (!guard.ok) return guard.response;

  const result = runSafeguardingScan(homeId, {
    lookbackDays,
    asOf,
    detectedBy: guard.actor.userId,
  });

  return NextResponse.json({ data: result }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  const status = typeof body.status === "string" ? body.status : null;
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  const ALLOWED = ["open", "acknowledged", "actioned", "dismissed"] as const;
  if (!ALLOWED.includes(status as (typeof ALLOWED)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const existing = db.ariaSafeguardingPatterns.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.approve_outputs",
    homeId: existing.home_id,
    intent: `update safeguarding_pattern ${status}`,
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const updated = db.ariaSafeguardingPatterns.patch(id, {
    status: status as AriaSafeguardingPattern["status"],
    acknowledged_by:
      status === "acknowledged" || status === "actioned"
        ? guard.actor.userId
        : existing.acknowledged_by,
    acknowledged_at:
      status === "acknowledged" || status === "actioned"
        ? new Date().toISOString()
        : existing.acknowledged_at,
    resolution_note:
      typeof body.resolution_note === "string"
        ? body.resolution_note
        : existing.resolution_note,
  });

  return NextResponse.json({ data: updated });
}
