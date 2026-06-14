// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Early Warnings
// GET   → list warnings (filterable by status/severity)
// PATCH → acknowledge / escalate / close (RBAC: cara.approve_outputs)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import type { CaraEarlyWarning } from "@/types/cara-studio";

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

  let items: CaraEarlyWarning[] = db.caraEarlyWarnings.findAll(homeId);
  if (status) items = items.filter((w) => w.status === status);
  if (severity) items = items.filter((w) => w.severity === severity);

  items = items.slice().sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
      b.created_at.localeCompare(a.created_at),
  );

  return NextResponse.json({
    data: items,
    meta: {
      total: items.length,
      active: items.filter((w) => w.status === "active").length,
      critical: items.filter((w) => w.severity === "critical").length,
    },
  });
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
  const ALLOWED = ["active", "acknowledged", "escalated", "closed"] as const;
  if (!ALLOWED.includes(status as (typeof ALLOWED)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const existing = db.caraEarlyWarnings.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.approve_outputs",
    homeId: existing.home_id,
    intent: `update early_warning ${status}`,
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const now = new Date().toISOString();
  const updated = db.caraEarlyWarnings.patch(id, {
    status: status as CaraEarlyWarning["status"],
    acknowledged_by:
      status === "acknowledged" || status === "escalated"
        ? guard.actor.userId
        : existing.acknowledged_by,
    acknowledged_at:
      status === "acknowledged" || status === "escalated"
        ? now
        : existing.acknowledged_at,
    closed_by: status === "closed" ? guard.actor.userId : existing.closed_by,
    closed_at: status === "closed" ? now : existing.closed_at,
    closure_note:
      typeof body.closure_note === "string"
        ? body.closure_note
        : existing.closure_note,
  });

  return NextResponse.json({ data: updated });
}
