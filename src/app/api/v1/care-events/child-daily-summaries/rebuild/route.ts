// ══════════════════════════════════════════════════════════════════════════════
// API — Rebuild Child Daily Summaries  (Milestone 20)
//
// POST /api/v1/care-events/child-daily-summaries/rebuild
//   body: { home_id?, child_id?, summary_date? }
//
// Permission: aria.generate_drafts. Audited as artifact_generated.
// Idempotent — store.upsert keys on (home_id, child_id, summary_date).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";
import {
  rebuildChildDailySummary,
  rebuildChildDailySummariesForHome,
} from "@/lib/care-events/child-daily-summary-builder";

const DEFAULT_HOME_ID = "home_oak";

export async function POST(req: NextRequest) {
  let body: { home_id?: string; child_id?: string; summary_date?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const homeId = body.home_id ?? DEFAULT_HOME_ID;
  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.generate_drafts",
    homeId,
    childId: body.child_id,
    intent: "rebuild child daily summaries",
  });
  if (!guard.ok) return guard.response;

  if (body.child_id && body.summary_date) {
    const summary = rebuildChildDailySummary(homeId, body.child_id, body.summary_date);
    if (summary) {
      appendAriaAudit({
        homeId,
        actorId: guard.actor.userId,
        actionType: "artifact_generated",
        artifactId: summary.id,
        summary: `Rebuilt child daily summary for ${body.child_id} on ${body.summary_date} (${summary.event_count} events).`,
      });
    }
    return NextResponse.json({
      data: { rebuilt: summary ? 1 : 0, skipped_no_events: summary ? 0 : 1, summaries: summary ? [summary] : [] },
    });
  }

  const result = rebuildChildDailySummariesForHome(homeId, {
    summaryDate: body.summary_date,
  });

  if (result.rebuilt > 0) {
    appendAriaAudit({
      homeId,
      actorId: guard.actor.userId,
      actionType: "artifact_generated",
      summary:
        `Rebuilt ${result.rebuilt} child daily summar${result.rebuilt === 1 ? "y" : "ies"}` +
        (body.summary_date ? ` for ${body.summary_date}` : "") + ".",
    });
  }

  return NextResponse.json({ data: result });
}
