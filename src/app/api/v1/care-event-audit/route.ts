import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import type { AuditAction } from "@/types/care-events";

// ── GET /api/v1/care-event-audit ──────────────────────────────────────────────
// Returns the care event audit log, newest first.
// Query params: care_event_id, action, actor_staff_id, from_date, to_date, limit

const VALID_ACTIONS: AuditAction[] = [
  "care_event_created",
  "care_event_submitted",
  "care_event_routed",
  "care_event_route_failed",
  "care_event_route_retried",
  "care_event_verified",
  "care_event_returned",
  "care_event_amended",
  "care_event_locked",
  "evidence_prompt_completed",
  "manager_review_completed",
  "reg45_evidence_suggested",
  "reg45_evidence_accepted",
  "reg45_evidence_rejected",
  "annex_a_evidence_suggested",
  "annex_a_snapshot_generated",
  "export_generated",
  "permission_denied",
  "validation_failed",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const careEventId = searchParams.get("care_event_id");
    const action      = searchParams.get("action") as AuditAction | null;
    const actorId     = searchParams.get("actor_staff_id");
    const fromDate    = searchParams.get("from_date");
    const toDate      = searchParams.get("to_date");
    const limitStr    = searchParams.get("limit");
    const limit       = limitStr ? Math.min(parseInt(limitStr, 10), 500) : 200;

    if (action && !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action filter" }, { status: 400 });
    }

    let entries = db.careEventAuditLog
      .findAll()
      .filter((a) => a.home_id === "home_oak");

    if (careEventId) entries = entries.filter((a) => a.care_event_id === careEventId);
    if (action)      entries = entries.filter((a) => a.action === action);
    if (actorId)     entries = entries.filter((a) => a.actor_staff_id === actorId);
    if (fromDate)    entries = entries.filter((a) => a.created_at >= fromDate);
    if (toDate)      entries = entries.filter((a) => a.created_at <= toDate);

    // Sort newest first, then apply limit
    entries.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const paged = entries.slice(0, limit);

    // Enrich with care event title
    const enriched = paged.map((entry) => {
      const careEvent = db.careEvents.findById(entry.care_event_id);
      return {
        ...entry,
        care_event: careEvent
          ? {
              id: careEvent.id,
              title: careEvent.title,
              category: careEvent.category,
              status: careEvent.status,
              child_id: careEvent.child_id,
            }
          : null,
      };
    });

    // Action counts
    const actionCounts: Record<string, number> = {};
    for (const entry of entries) {
      actionCounts[entry.action] = (actionCounts[entry.action] ?? 0) + 1;
    }

    return NextResponse.json({
      entries: enriched,
      meta: {
        total: entries.length,
        returned: paged.length,
        action_counts: actionCounts,
        unique_events: [...new Set(entries.map((e) => e.care_event_id))].length,
        unique_actors: [...new Set(entries.map((e) => e.actor_staff_id).filter(Boolean))].length,
      },
    });
  } catch (err) {
    console.error("[care-event-audit GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
