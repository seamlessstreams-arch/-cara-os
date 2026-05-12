// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria-studio/audit — Get audit trail
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getAuditTrail } from "@/lib/aria-studio/audit.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const artifactId = searchParams.get("artifact_id");
    if (!artifactId) return NextResponse.json({ error: "artifact_id is required" }, { status: 400 });

    const trail = await getAuditTrail(artifactId);
    return NextResponse.json({ data: trail });
  } catch (err) {
    console.error("[aria-studio/audit] Error:", err);
    return NextResponse.json({ error: "Failed to get audit trail" }, { status: 500 });
  }
}
