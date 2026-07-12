// ══════════════════════════════════════════════════════════════════════════════
// API — Export Reg 44 Visit Evidence Pack  (Milestone 36)
//
// POST /api/v1/care-events/reg44-pack/:id/export
//   { reason? } → returns the full pack payload AND records the export in
//   the immutable export history. Required permission: cara.export.
//   Marked safeguarding-sensitive.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { getPersistedReg44Pack } from "@/lib/care-events/reg44-pack";
import { recordExport } from "@/lib/care-events/export-history";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";
import { readJsonBody } from "@/lib/http/read-json";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const row = getPersistedReg44Pack(id);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: { reason?: string } = {};
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; } catch { /* allow empty body */ }

  const guard = requireCaraStudioPermission(
    req,
    body as Record<string, unknown>,
    {
      permission: "cara.export",
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

  appendCaraAudit({
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
