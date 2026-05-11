// ══════════════════════════════════════════════════════════════════════════════
// API — Amendment Review Queue  (Milestone 19)
//
// GET ?home_id= → AmendmentReviewSummary
//
// Read-only oversight queue. Permission: aria.view_audit_logs. Re-verification
// is performed via the existing care-event verify endpoint.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { loadAmendmentReviewQueue } from "@/lib/care-events/amendment-review";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "view amendment review queue",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadAmendmentReviewQueue(homeId) });
}
