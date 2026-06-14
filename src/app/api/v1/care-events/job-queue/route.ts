// ══════════════════════════════════════════════════════════════════════════════
// API — Background Job Queue Status  (Milestone 26)
//
// GET ?home_id= → JobQueueStatus
// Permission: cara.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { loadJobQueueStatus } from "@/lib/care-events/job-queue-status";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view background job queue status",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadJobQueueStatus(homeId) });
}
