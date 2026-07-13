// CARA — GET /api/v1/whereabouts
//
// Phase 5 · Module 1. The child in-out board: for every resident young person,
// are they IN, OUT (a scheduled appointment or family-time window happening now,
// with a due-back time), or MISSING (an active missing episode). A pure read-only
// projection over the existing movement collections — it is EXPECTED whereabouts
// from today's schedule + live missing status, not a physical sign-out register
// (the response carries that caveat in `as_of_note`).
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeInOutBoard,
  type WhereaboutsYoungPerson,
  type WhereaboutsAppointment,
  type WhereaboutsFamilyTime,
  type WhereaboutsMissing,
} from "@/lib/whereabouts/whereabouts-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore() as any;

  const board = computeInOutBoard({
    youngPeople: (store.youngPeople ?? []).map(
      (y: any): WhereaboutsYoungPerson => ({
        id: String(y.id),
        first_name: String(y.first_name ?? ""),
        last_name: String(y.last_name ?? ""),
        status: y.status,
      }),
    ),
    appointments: (store.appointments ?? []).map(
      (a: any): WhereaboutsAppointment => ({
        child_id: String(a.child_id ?? ""),
        date: String(a.date ?? ""),
        time: String(a.time ?? ""),
        type: a.type,
        location: a.location,
        status: a.status,
      }),
    ),
    familyTime: (store.familyTimeSessions ?? []).map(
      (f: any): WhereaboutsFamilyTime => ({
        child_id: String(f.child_id ?? ""),
        date: String(f.date ?? ""),
        time: String(f.time ?? ""),
        duration_minutes: typeof f.duration_minutes === "number" ? f.duration_minutes : undefined,
        location: f.location,
      }),
    ),
    missing: (store.missingEpisodes ?? []).map(
      (m: any): WhereaboutsMissing => ({
        child_id: String(m.child_id ?? ""),
        date_missing: String(m.date_missing ?? ""),
        time_missing: m.time_missing,
        date_returned: m.date_returned ?? null,
        status: m.status,
        location_last_seen: m.location_last_seen,
      }),
    ),
    nowIso: new Date().toISOString(),
  });

  return NextResponse.json({ data: board });
}
