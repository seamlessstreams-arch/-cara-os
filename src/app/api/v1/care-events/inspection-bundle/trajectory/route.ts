// ══════════════════════════════════════════════════════════════════════════════
// API — Inspection Readiness Trajectory  (Milestone 45)
//
// GET /api/v1/care-events/inspection-bundle/trajectory?home_id=
// Permission: cara.view_audit_logs (read-only inspector / RI signal).
// Sensitive: based on persisted bundles → safeguarding adjacent.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { loadInspectionTrajectory } from "@/lib/care-events/inspection-trajectory";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id");
  if (!homeId) {
    return NextResponse.json({ error: "home_id is required" }, { status: 400 });
  }

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view inspection trajectory",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const data = loadInspectionTrajectory(homeId);
  return NextResponse.json({ data });
}
