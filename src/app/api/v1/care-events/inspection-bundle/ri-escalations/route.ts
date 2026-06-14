// ══════════════════════════════════════════════════════════════════════════════
// API — Trajectory RI escalations (Milestone 52)
//
// GET ?home_id=  → current (unacknowledged) RI escalations + recent acks
// Permission: cara.view_audit_logs (read-only signal).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import {
  detectTrajectoryRiEscalations,
  listTrajectoryRiEscalationAcks,
} from "@/lib/care-events/inspection-trajectory";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id");
  if (!homeId) {
    return NextResponse.json({ error: "home_id is required" }, { status: 400 });
  }

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view trajectory RI escalations",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({
    data: {
      escalations: detectTrajectoryRiEscalations(homeId),
      acks_recent: listTrajectoryRiEscalationAcks(homeId).slice(0, 25),
    },
  });
}
