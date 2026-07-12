// ══════════════════════════════════════════════════════════════════════════════
// API — Promote Care Events → Annex A Evidence  (Milestone 21)
//
// POST /api/v1/care-events/annex-a/promote
//   body: { home_id? }
//
// Permission: cara.generate_drafts. Audited as artifact_generated when new
// chips are created.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";
import { promoteCareEventsToAnnexA } from "@/lib/care-events/care-event-annex-a-bridge";
import { readJsonBody } from "@/lib/http/read-json";

const DEFAULT_HOME_ID = "home_oak";

export async function POST(req: NextRequest) {
  let body: { home_id?: string } = {};
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    body = {};
  }

  const homeId = body.home_id ?? DEFAULT_HOME_ID;
  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.generate_drafts",
    homeId,
    intent: "promote care events to Annex A evidence",
  });
  if (!guard.ok) return guard.response;

  const result = promoteCareEventsToAnnexA(homeId);

  if (result.created > 0) {
    appendCaraAudit({
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
