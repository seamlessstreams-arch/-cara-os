// ══════════════════════════════════════════════════════════════════════════════
// API — Export Filing Cabinet Index  (Milestone 37)
//
// POST /api/v1/care-events/filing-cabinet/export
//   { home_id, category?, reason? }
//   → builds a snapshot of the live filing cabinet (optionally filtered to a
//     single category), records the export in the immutable export history,
//     and returns the snapshot payload. Permission: cara.export.
//
// The Filing Cabinet is a derived live index, so each export is a
// point-in-time snapshot. The snapshot's "artifact_id" is synthesised from
// the home + category + timestamp so the immutable export row stays unique.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { loadFilingCabinetIndex } from "@/lib/care-events/filing-cabinet-index";
import { recordExport } from "@/lib/care-events/export-history";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";
import type { FilingCategory } from "@/types/care-events";
import { readJsonBody } from "@/lib/http/read-json";

interface Body {
  home_id?: string;
  category?: FilingCategory;
  reason?: string;
}

export async function POST(req: NextRequest) {
  let body: Body = {};
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; } catch { /* empty allowed */ }

  const homeId = body.home_id ?? "home_oak";

  const guard = requireCaraStudioPermission(
    req,
    body as unknown as Record<string, unknown>,
    {
      permission: "cara.export",
      homeId,
      intent: "export filing cabinet index",
    },
  );
  if (!guard.ok) return guard.response;

  const fullIndex = loadFilingCabinetIndex(homeId);
  const payload = body.category
    ? {
        ...fullIndex,
        categories: fullIndex.categories.filter((c) => c.category === body.category),
        recent_filings: fullIndex.recent_filings.filter((f) => f.category === body.category),
        filtered_to_category: body.category,
      }
    : fullIndex;

  const json = JSON.stringify(payload);
  const generatedAt = new Date().toISOString();
  const slug = body.category ?? "all";
  const artifactId = `filing_index_${homeId}_${slug}_${generatedAt.replace(/[:.]/g, "")}`;

  const entry = recordExport({
    homeId,
    kind: "filing_cabinet_index",
    artifactId,
    format: "json",
    exportedBy: guard.actor.userId,
    exportedByRole: guard.actor.role,
    isSafeguardingSensitive: body.category === "safeguarding",
    byteSize: json.length,
    reason: body.reason ?? null,
  });

  appendCaraAudit({
    homeId,
    actorId: guard.actor.userId,
    actionType: "artifact_committed",
    artifactId,
    sourceIds: [entry.id],
    summary: `Filing cabinet index exported (${slug}, ${json.length} bytes${body.reason ? `, reason: ${body.reason.slice(0, 80)}` : ""})`,
    after: { export_id: entry.id, format: entry.format, category: body.category ?? null },
  });

  return NextResponse.json({ data: { export: entry, payload } });
}
