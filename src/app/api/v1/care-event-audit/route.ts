// ══════════════════════════════════════════════════════════════════════════════
// API: GET /api/v1/care-event-audit
//
// The care-event audit log, newest first — what the Audit Trail page and the
// care-event detail page render.
//
// HISTORY, because it explains why this file exists again. A dedicated route
// with exactly this contract was deleted in 87f338bb ("consolidate 434 v1 API
// routes into single catch-all to fix Vercel deployment") — a workaround for
// Vercel's serverless-function limit. The catch-all mapped the slug to the
// `careEvents` collection and returned `{ data: CareEvent[] }`; the page reads
// `{ entries: AuditLogEntry[], meta }`. The shapes never matched, so the Audit
// Trail has rendered empty in BOTH modes since that commit — and on a live
// tenant the store it read from is emptied anyway. No error was ever raised.
// Northflank runs a container, not per-route functions, so the constraint that
// forced the consolidation no longer applies.
//
// Reads through careEventsDb, which is Supabase-backed in activated mode
// (care_event_audit_log) and in-memory in demo, so both modes work.
//
// Query params: care_event_id, action, actor_staff_id, from_date, to_date,
//               limit (default 200, max 500)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { careEventsDb, dal } from "@/lib/db";
import { AUDIT_ACTION_VALUES, type AuditAction } from "@/types/care-events";

export const dynamic = "force-dynamic";

const ACTIONS: ReadonlySet<string> = new Set(AUDIT_ACTION_VALUES);

function isAuditAction(value: string): value is AuditAction {
  return ACTIONS.has(value);
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const { searchParams } = req.nextUrl;
    const careEventId = searchParams.get("care_event_id");
    const actionParam = searchParams.get("action");
    const actorId     = searchParams.get("actor_staff_id");
    const fromDate    = searchParams.get("from_date");
    const toDate      = searchParams.get("to_date");
    const limitStr    = searchParams.get("limit");
    const parsedLimit = limitStr ? Number.parseInt(limitStr, 10) : Number.NaN;
    const limit       = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 500) : 200;

    if (actionParam && !isAuditAction(actionParam)) {
      return NextResponse.json({ error: "Invalid action filter" }, { status: 400 });
    }
    const action = actionParam as AuditAction | null;

    let entries = await careEventsDb.careEventAuditLog.findAll();

    // Home scoping. In activated mode the identity carries the session's
    // staff_members.home_id; the Supabase read above is not itself home-scoped,
    // so apply it here. In demo mode homeId is null and the store is single-home.
    if (identity.homeId) entries = entries.filter((a) => a.home_id === identity.homeId);

    if (careEventId) entries = entries.filter((a) => a.care_event_id === careEventId);
    if (action)      entries = entries.filter((a) => a.action === action);
    if (actorId)     entries = entries.filter((a) => a.actor_staff_id === actorId);
    if (fromDate)    entries = entries.filter((a) => a.created_at >= fromDate);
    if (toDate)      entries = entries.filter((a) => a.created_at <= toDate);

    entries.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const paged = entries.slice(0, limit);

    // Enrich each row with the care event it belongs to and the actor's name.
    // Look each id up once rather than per row: a 200-row page over a handful of
    // events must not issue 400 queries against Postgres.
    const eventIds = [...new Set(paged.map((e) => e.care_event_id))];
    const actorIds = [...new Set(paged.map((e) => e.actor_staff_id).filter((x): x is string => Boolean(x)))];
    const [events, actors] = await Promise.all([
      Promise.all(eventIds.map((id) => careEventsDb.careEvents.findById(id))),
      Promise.all(actorIds.map((id) => dal.staff.findById(id))),
    ]);
    const eventById = new Map(eventIds.map((id, i) => [id, events[i]]));
    const actorById = new Map(actorIds.map((id, i) => [id, actors[i]]));

    const enriched = paged.map((entry) => {
      const ce = eventById.get(entry.care_event_id) ?? null;
      const actor = entry.actor_staff_id ? actorById.get(entry.actor_staff_id) ?? null : null;
      return {
        ...entry,
        care_event: ce
          ? { id: ce.id, title: ce.title, category: ce.category, status: ce.status, child_id: ce.child_id ?? null }
          : null,
        actor_staff_name: actor ? `${actor.first_name} ${actor.last_name}` : null,
      };
    });

    const actionCounts: Record<string, number> = {};
    for (const entry of entries) actionCounts[entry.action] = (actionCounts[entry.action] ?? 0) + 1;

    return NextResponse.json({
      entries: enriched,
      meta: {
        total: entries.length,
        returned: paged.length,
        action_counts: actionCounts,
        unique_events: new Set(entries.map((e) => e.care_event_id)).size,
        unique_actors: new Set(entries.map((e) => e.actor_staff_id).filter(Boolean)).size,
      },
    });
  } catch (err) {
    console.error("[care-event-audit GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
