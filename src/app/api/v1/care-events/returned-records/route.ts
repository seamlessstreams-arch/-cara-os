// ══════════════════════════════════════════════════════════════════════════════
// API — Returned Records Queue  (Milestone 23)
//
// GET ?home_id= → ReturnedRecordsSummary (read-only).
// Permission: cara.view_audit_logs. Re-submission still happens through
// the existing care-event endpoints.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { loadReturnedRecordsQueue } from "@/lib/care-events/returned-records";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view returned records queue",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadReturnedRecordsQueue(homeId) });
}
