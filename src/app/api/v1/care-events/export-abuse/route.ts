// ══════════════════════════════════════════════════════════════════════════════
// API — Export Abuse Detection  (Milestone 40)
//
// GET ?home_id= → ExportAbuseReport
// Permission: cara.view_audit_logs (read-only oversight signal).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { detectExportAbuse } from "@/lib/care-events/export-abuse";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view export abuse report",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: detectExportAbuse(homeId) });
}
