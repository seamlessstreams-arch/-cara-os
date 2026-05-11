// ══════════════════════════════════════════════════════════════════════════════
// API — Saved-Time Live Dashboard  (Milestone 28)
//
// GET ?home_id= → SavedTimeDashboard
// Permission: aria.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { loadSavedTimeDashboard } from "@/lib/care-events/saved-time-dashboard";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "view saved-time dashboard",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadSavedTimeDashboard(homeId) });
}
