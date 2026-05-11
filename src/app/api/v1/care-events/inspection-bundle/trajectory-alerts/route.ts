// ══════════════════════════════════════════════════════════════════════════════
// API — Trajectory alerts (Milestone 48)
//
// GET ?home_id=  → current (unacknowledged) trajectory alerts for the home
// Permission: aria.view_audit_logs (read-only signal).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import {
  detectTrajectoryAlerts,
  listTrajectoryAlertAcks,
} from "@/lib/care-events/inspection-trajectory";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id");
  if (!homeId) {
    return NextResponse.json({ error: "home_id is required" }, { status: 400 });
  }

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "view trajectory alerts",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({
    data: {
      alerts: detectTrajectoryAlerts(homeId),
      acks_recent: listTrajectoryAlertAcks(homeId).slice(0, 25),
    },
  });
}
