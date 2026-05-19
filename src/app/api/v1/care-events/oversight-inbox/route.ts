// ══════════════════════════════════════════════════════════════════════════════
// API — Manager Oversight Inbox  (Milestone 24)
//
// GET ?home_id= → OversightSummary
// Permission: aria.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { loadOversightInbox } from "@/lib/care-events/oversight-inbox";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "view manager oversight inbox",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadOversightInbox(homeId) });
}
