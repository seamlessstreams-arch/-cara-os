// ══════════════════════════════════════════════════════════════════════════════
// API — Filing Cabinet Live Index  (Milestone 25)
//
// GET ?home_id= → FilingCabinetIndex
// Permission: aria.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { loadFilingCabinetIndex } from "@/lib/care-events/filing-cabinet-index";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "view filing cabinet index",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadFilingCabinetIndex(homeId) });
}
