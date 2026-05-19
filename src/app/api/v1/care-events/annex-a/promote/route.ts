// ══════════════════════════════════════════════════════════════════════════════
// API — Promote Care Events → Annex A Evidence  (Milestone 21)
//
// POST /api/v1/care-events/annex-a/promote
//   body: { home_id? }
//
// Permission: aria.generate_drafts. Audited as artifact_generated when new
// chips are created.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";
import { promoteCareEventsToAnnexA } from "@/lib/care-events/care-event-annex-a-bridge";

const DEFAULT_HOME_ID = "home_oak";

export async function POST(req: NextRequest) {
  let body: { home_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const homeId = body.home_id ?? DEFAULT_HOME_ID;
  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.generate_drafts",
    homeId,
    intent: "promote care events to Annex A evidence",
  });
  if (!guard.ok) return guard.response;

  const result = promoteCareEventsToAnnexA(homeId);

  if (result.created > 0) {
    appendAriaAudit({
      homeId,
      actorId: guard.actor.userId,
      actionType: "artifact_generated",
      summary:
        `Promoted ${result.created} verified care event${result.created === 1 ? "" : "s"} to Annex A evidence` +
        (result.refreshed ? ` (refreshed ${result.refreshed})` : "") +
        (result.skipped_locked ? ` (skipped ${result.skipped_locked} locked)` : "") + ".",
    });
  }

  return NextResponse.json({ data: result });
}
