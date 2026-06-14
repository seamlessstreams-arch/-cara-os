// ══════════════════════════════════════════════════════════════════════════════
// API — Export History  (Milestone 36)
//
// GET ?home_id= → ExportHistorySummary (list of every recorded export of a
// persisted artifact for this home, newest-first, with by-kind/by-user
// counters). Permission: cara.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { loadExportHistory } from "@/lib/care-events/export-history";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view export history",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadExportHistory(homeId) });
}
