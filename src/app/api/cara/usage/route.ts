// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/usage
// GET — returns Cara usage details for a specific source record. Used by the
// CaraUsageBadge component to show what Cara commands were used on a record.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getCaraUsageForRecord } from "@/lib/cara/cara-smart-linking";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sourceTable = url.searchParams.get("sourceTable") ?? "";
  const recordId = url.searchParams.get("recordId") ?? "";

  if (!sourceTable || !recordId) {
    return NextResponse.json(
      { error: "sourceTable and recordId query params are required" },
      { status: 400 },
    );
  }

  const usages = await getCaraUsageForRecord(sourceTable, recordId);
  return NextResponse.json({ data: usages });
}
