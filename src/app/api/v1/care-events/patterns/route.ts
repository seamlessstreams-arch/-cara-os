// ══════════════════════════════════════════════════════════════════════════════
// API — Care Event Patterns  (Milestone 17)
//
// GET ?home_id=&lookback_days=&min_cluster=&time_band_hours=
//   → CareEventPatternSummary
//
// Read-only observational scan. Permission: cara.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { loadCareEventPatterns } from "@/lib/care-events/pattern-detection";

const DEFAULT_HOME_ID = "home_oak";

function parsePosInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "scan care event patterns",
  });
  if (!guard.ok) return guard.response;

  const summary = loadCareEventPatterns(homeId, {
    lookbackDays: parsePosInt(searchParams.get("lookback_days")),
    minClusterSize: parsePosInt(searchParams.get("min_cluster")),
    timeBandHours: parsePosInt(searchParams.get("time_band_hours")),
  });
  return NextResponse.json({ data: summary });
}
