// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Care Event Bridge (Milestone 12)
//
// POST → manually trigger ARIA to draft suggested records from verified
//        care events that haven't yet been bridged. Idempotent.
//
// Body:
//   { home_id?, care_event_id?, limit? }
//   - care_event_id present → bridge that specific event
//   - else                  → backfill latest verified events (up to limit)
//
// Permission: aria.generate_drafts. Each successful proposal is audited.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";
import {
  proposeRecordsFromCareEvent,
  backfillSuggestedRecordsFromCareEvents,
  type BridgeResult,
} from "@/lib/aria/aria-care-event-bridge";

const DEFAULT_HOME_ID = "home_oak";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const homeId = typeof body.home_id === "string" ? body.home_id : DEFAULT_HOME_ID;
  const careEventId = typeof body.care_event_id === "string" ? body.care_event_id : null;
  const limitRaw = Number(body.limit);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 25;

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.generate_drafts",
    homeId,
    intent: careEventId
      ? `bridge care_event:${careEventId}`
      : `backfill care_event suggestions (limit ${limit})`,
  });
  if (!guard.ok) return guard.response;

  let results: BridgeResult[];

  if (careEventId) {
    const event = db.careEvents.findById(careEventId);
    if (!event) {
      return NextResponse.json({ error: "Care event not found" }, { status: 404 });
    }
    if (event.home_id !== homeId) {
      return NextResponse.json(
        { error: "Care event does not belong to this home" },
        { status: 403 },
      );
    }
    if (event.status !== "verified" && event.status !== "locked") {
      return NextResponse.json(
        { error: `Care event must be verified or locked (got '${event.status}')` },
        { status: 422 },
      );
    }
    results = [proposeRecordsFromCareEvent(event, guard.actor.userId)];
  } else {
    results = backfillSuggestedRecordsFromCareEvents(homeId, guard.actor.userId, limit);
  }

  // Audit only the freshly proposed suggestions (not reused).
  for (const r of results) {
    for (const rec of r.proposed) {
      appendAriaAudit({
        homeId,
        actorId: guard.actor.userId,
        actionType: "artifact_generated",
        artifactId: rec.id,
        sourceIds: [r.careEventId],
        summary: `ARIA drafted ${rec.record_type} from care event ${r.careEventId}`,
        after: { record_type: rec.record_type },
      });
    }
  }

  const totals = results.reduce(
    (acc, r) => ({
      proposed: acc.proposed + r.proposed.length,
      reused: acc.reused + r.reused.length,
      skipped: acc.skipped + (r.skipped ? 1 : 0),
    }),
    { proposed: 0, reused: 0, skipped: 0 },
  );

  return NextResponse.json({ data: { totals, results } });
}
