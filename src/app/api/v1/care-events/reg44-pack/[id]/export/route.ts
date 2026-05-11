// ══════════════════════════════════════════════════════════════════════════════
// API — Export Reg 44 Visit Evidence Pack  (Milestone 36)
//
// POST /api/v1/care-events/reg44-pack/:id/export
//   { reason? } → returns the full pack payload AND records the export in
//   the immutable export history. Required permission: aria.export.
//   Marked safeguarding-sensitive.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { getPersistedReg44Pack } from "@/lib/care-events/reg44-pack";
import { recordExport } from "@/lib/care-events/export-history";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const row = getPersistedReg44Pack(id);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: { reason?: string } = {};
  try { body = await req.json(); } catch { /* allow empty body */ }

  const guard = requireAriaStudioPermission(
    req,
    body as Record<string, unknown>,
    {
      permission: "aria.export",
      homeId: row.home_id,
      intent: "export Reg 44 visit evidence pack",
      isSafeguardingSensitive: true,
    },
  );
  if (!guard.ok) return guard.response;

  const json = JSON.stringify(row.payload);
  const entry = recordExport({
    homeId: row.home_id,
    kind: "reg44_pack",
    artifactId: row.id,
    format: "json",
    exportedBy: guard.actor.userId,
    exportedByRole: guard.actor.role,
    isSafeguardingSensitive: true,
    byteSize: json.length,
    reason: body.reason ?? null,
  });

  appendAriaAudit({
    homeId: row.home_id,
    actorId: guard.actor.userId,
    actionType: "artifact_committed",
    artifactId: row.id,
    sourceIds: [entry.id],
    summary: `Reg 44 visit evidence pack exported (${json.length} bytes${body.reason ? `, reason: ${body.reason.slice(0, 80)}` : ""})`,
    after: { export_id: entry.id, format: entry.format },
  });

  return NextResponse.json({ data: { export: entry, payload: row.payload } });
}
