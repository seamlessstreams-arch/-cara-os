// ══════════════════════════════════════════════════════════════════════════════
// API — Filing Cabinet Live Index  (Milestone 25)
//
// GET ?home_id= → FilingCabinetIndex
// Permission: cara.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { loadFilingCabinetIndex } from "@/lib/care-events/filing-cabinet-index";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view filing cabinet index",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadFilingCabinetIndex(homeId) });
}
