// ══════════════════════════════════════════════════════════════════════════════
// API — Background Job Queue Status  (Milestone 26)
//
// GET ?home_id= → JobQueueStatus
// Permission: aria.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { loadJobQueueStatus } from "@/lib/care-events/job-queue-status";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "view background job queue status",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadJobQueueStatus(homeId) });
}
