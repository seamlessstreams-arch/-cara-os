// ══════════════════════════════════════════════════════════════════════════════
// API — Build & Export Inspection Bundle  (Milestone 42)
//
// POST /api/v1/care-events/inspection-bundle/export
//   { home_id?, reason? }
// → composes the live inspection bundle (snapshot + Reg 44 packs + filing
//   index + Reg 45 / Annex A evidence + recent export history), records the
//   export in the immutable export history (always safeguarding-sensitive),
//   and returns the bundle payload. Permission: cara.export.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import {
  buildInspectionBundle,
  persistInspectionBundle,
} from "@/lib/care-events/inspection-bundle";
import { recordExport } from "@/lib/care-events/export-history";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";

interface Body {
  home_id?: string;
  reason?: string;
}

export async function POST(req: NextRequest) {
  let body: Body = {};
  try { body = await req.json(); } catch { /* empty allowed */ }

  const homeId = body.home_id ?? "home_oak";

  const guard = requireCaraStudioPermission(
    req,
    body as unknown as Record<string, unknown>,
    {
      permission: "cara.export",
      homeId,
      intent: "build & export inspection bundle",
      isSafeguardingSensitive: true,
    },
  );
  if (!guard.ok) return guard.response;

  const bundle = buildInspectionBundle(homeId, { generatedBy: guard.actor.userId });
  persistInspectionBundle(bundle);
  const json = JSON.stringify(bundle);

  const entry = recordExport({
    homeId,
    kind: "inspection_bundle",
    artifactId: bundle.bundle_id,
    format: "json",
    exportedBy: guard.actor.userId,
    exportedByRole: guard.actor.role,
    isSafeguardingSensitive: true,
    byteSize: json.length,
    reason: body.reason ?? null,
  });

  appendCaraAudit({
    homeId,
    actorId: guard.actor.userId,
    actionType: "artifact_committed",
    artifactId: bundle.bundle_id,
    sourceIds: [entry.id],
    summary:
      `Inspection bundle exported (${bundle.headline.reg44_packs_included} Reg 44 packs, ` +
      `${bundle.headline.filing_total} filings, ${json.length} bytes` +
      `${body.reason ? `, reason: ${body.reason.slice(0, 80)}` : ""})`,
    after: {
      bundle_id: bundle.bundle_id,
      export_id: entry.id,
      headline: bundle.headline,
    },
  });

  return NextResponse.json({ data: { export: entry, bundle } });
}
