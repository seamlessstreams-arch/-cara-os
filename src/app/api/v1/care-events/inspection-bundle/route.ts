// ══════════════════════════════════════════════════════════════════════════════
// API — Persisted Inspection Bundles  (Milestone 43)
//
// GET  ?home_id=  → list of header rows, newest first
// POST { home_id } → builds + persists a new bundle (does NOT export it).
//                    For the combined "build + export" path use
//                    /api/v1/care-events/inspection-bundle/export.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import {
  buildInspectionBundle,
  persistInspectionBundle,
  listPersistedInspectionBundles,
} from "@/lib/care-events/inspection-bundle";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, {}, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "list inspection bundles",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: listPersistedInspectionBundles(homeId) });
}

export async function POST(req: NextRequest) {
  let body: { home_id?: string } = {};
  try { body = await req.json(); } catch { /* empty allowed */ }
  const homeId = body.home_id ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(
    req,
    body as Record<string, unknown>,
    {
      permission: "aria.commit_to_records",
      homeId,
      intent: "persist inspection bundle",
      isSafeguardingSensitive: true,
    },
  );
  if (!guard.ok) return guard.response;

  const bundle = buildInspectionBundle(homeId, { generatedBy: guard.actor.userId });
  persistInspectionBundle(bundle);

  appendAriaAudit({
    homeId,
    actorId: guard.actor.userId,
    actionType: "artifact_committed",
    artifactId: bundle.bundle_id,
    sourceIds: [],
    summary:
      `Inspection bundle persisted (${bundle.headline.reg44_packs_included} Reg 44 packs, ` +
      `${bundle.headline.filing_total} filings)`,
    after: { headline: bundle.headline },
  });

  return NextResponse.json({ data: bundle });
}
