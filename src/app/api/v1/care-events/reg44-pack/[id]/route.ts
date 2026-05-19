// ══════════════════════════════════════════════════════════════════════════════
// API — Persisted Reg 44 Visit Evidence Pack by id  (Milestone 35)
// GET /api/v1/care-events/reg44-pack/:id → full payload (404 if missing)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { getPersistedReg44Pack } from "@/lib/care-events/reg44-pack";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const row = getPersistedReg44Pack(id);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId: row.home_id,
    intent: "view persisted Reg 44 visit evidence pack",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: row.payload });
}
