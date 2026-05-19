// ══════════════════════════════════════════════════════════════════════════════
// API — Inspection Readiness Score  (Milestone 22)
//
// GET ?home_id= → InspectionReadinessReport
// Permission: aria.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { computeInspectionReadiness } from "@/lib/care-events/inspection-readiness";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "view inspection readiness",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: computeInspectionReadiness(homeId) });
}
