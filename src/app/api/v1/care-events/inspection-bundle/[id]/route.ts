// ══════════════════════════════════════════════════════════════════════════════
// API — Persisted Inspection Bundle (detail)  (Milestone 43)
//
// GET /api/v1/care-events/inspection-bundle/:id → full payload
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { getPersistedInspectionBundle } from "@/lib/care-events/inspection-bundle";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const row = getPersistedInspectionBundle(id);
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId: row.home_id,
    intent: "view inspection bundle",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: row });
}
