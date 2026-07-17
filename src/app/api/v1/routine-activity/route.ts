// ══════════════════════════════════════════════════════════════════════════════
// CARA — TIMES & PLACES (routine-activity lens, doctrine 2.2.10)
//
// GET /api/v1/routine-activity → when and where the home is thinnest, and
//                                whether anything clusters there
//
// Feeds risk-assessment review. It looks at times and places, never at people:
// of routine-activity's three legs, this computes only the one that points back
// at us — who was around. See the engine header for why the other two do not
// exist here and never will.
//
// Read-only. There is nothing to write.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  buildRoutineActivityView,
  type IncidentPoint,
  type ShiftPoint,
} from "@/lib/theory-lens/routine-activity-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    if (
      identity.role !== "registered_manager" &&
      identity.role !== "deputy_manager" &&
      identity.role !== "responsible_individual"
    ) {
      return NextResponse.json(
        { error: "Times and places is a manager's view — it feeds the risk assessment." },
        { status: 403 },
      );
    }

    const store = getStore();
    const homeId = identity.homeId;
    const scoped = <T extends { home_id?: string }>(rows: T[]): T[] =>
      homeId ? rows.filter((r) => r.home_id === homeId) : rows;

    const incidents: IncidentPoint[] = scoped(store.incidents ?? []).map((i) => ({
      id: i.id,
      date: i.date,
      time: i.time,
      location: i.location,
      severity: i.severity,
    }));

    const shifts: ShiftPoint[] = scoped(store.shifts ?? []).map((s) => ({
      id: s.id,
      staff_id: s.staff_id,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.status,
    }));

    const windowParam = Number(new URL(req.url).searchParams.get("days"));
    const windowDays = Number.isFinite(windowParam) && windowParam > 0 ? Math.min(windowParam, 365) : 90;

    const view = buildRoutineActivityView(incidents, shifts, new Date(), windowDays);

    return NextResponse.json({ data: view });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
