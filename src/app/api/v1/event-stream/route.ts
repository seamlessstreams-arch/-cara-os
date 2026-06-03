// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — UNIFIED EVENT STREAM API ROUTE
// GET /api/v1/event-stream
//
// Projects the home's domain collections into one normalised CornerstoneEvent
// stream — the "capture once, surface everywhere" backbone. Returns the unified
// timeline plus an overview (counts by type/risk, pending approvals, ARIA
// compliance flags).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildEventStream } from "@/lib/event-stream/event-projector";

const d = (v: unknown, fallback = ""): string => (v == null ? fallback : v.toString().slice(0, 10));

export async function GET() {
  const store = getStore();

  const result = buildEventStream({
    homeId: "home_oak",
    incidents: ((store.incidents ?? []) as any[]).map((i: any) => ({
      id: i.id, child_id: i.child_id, reference: i.reference, type: i.type, severity: i.severity,
      date: d(i.date ?? i.created_at), time: i.time, description: i.description, status: i.status,
      requires_oversight: i.requires_oversight, body_map_required: i.body_map_required, body_map_completed: i.body_map_completed,
      outcome: i.outcome, reported_by: i.reported_by, linked_task_ids: i.linked_task_ids, linked_document_ids: i.linked_document_ids,
      home_id: i.home_id, created_at: i.created_at, updated_at: i.updated_at,
    })),
    missingEpisodes: ((store.missingEpisodes ?? []) as any[]).map((m: any) => ({
      id: m.id, child_id: m.child_id, reference: m.reference, date_missing: d(m.date_missing ?? m.created_at), time_missing: m.time_missing,
      date_returned: m.date_returned, risk_level: m.risk_level, reported_to_police: m.reported_to_police, reported_to_la: m.reported_to_la,
      return_interview_completed: m.return_interview_completed, status: m.status, home_id: m.home_id, created_at: m.created_at, created_by: m.created_by,
    })),
    restraints: ((store.restraints ?? []) as any[]).map((r: any) => ({
      id: r.id, child_id: r.child_id, date: d(r.date ?? r.created_at), start_time: r.start_time, restraint_type: r.restraint_type,
      injuries_count: Array.isArray(r.injuries) ? r.injuries.length : 0, child_debriefed: r.child_debriefed, staff_debriefed: r.staff_debriefed,
      linked_incident_id: r.linked_incident_id, recorded_by: r.recorded_by, created_at: r.created_at,
    })),
    medicationErrors: ((store.medicationErrors ?? []) as any[]).map((e: any) => ({
      id: e.id, child_id: e.child_id, date_occurred: d(e.date_occurred ?? e.created_at), time_occurred: e.time_occurred, error_type: e.error_type,
      severity: e.severity, medication: e.medication, duty_of_candour: e.duty_of_candour, duty_of_candour_completed: e.duty_of_candour_completed,
      status: e.status, reported_by: e.reported_by, created_at: e.created_at,
    })),
    dailyLogs: ((store.dailyLog ?? []) as any[]).map((l: any) => ({
      id: l.id, child_id: l.child_id, staff_id: l.staff_id, date: d(l.date ?? l.created_at), time: l.time, entry_type: l.entry_type,
      content: l.content, is_significant: l.is_significant, linked_incident_id: l.linked_incident_id, home_id: l.home_id,
      created_at: l.created_at, updated_at: l.updated_at, created_by: l.created_by,
    })),
    keyworkSessions: ((store.keyWorkingSessions ?? []) as any[]).map((k: any) => ({
      id: k.id, child_id: k.child_id, staff_id: k.staff_id, date: d(k.date ?? k.created_at), type: k.type,
      mood_before: k.mood_before, mood_after: k.mood_after, home_id: k.home_id, created_at: k.created_at,
    })),
    educationRecords: ((store.educationRecords ?? []) as any[]).map((e: any) => ({
      id: e.id, child_id: e.child_id, staff_id: e.staff_id, date: d(e.date ?? e.created_at), record_type: e.record_type,
      attendance_status: e.attendance_status, title: e.title, status: e.status, home_id: e.home_id, created_at: e.created_at,
    })),
    supervisions: ((store.supervisions ?? []) as any[]).map((s: any) => ({
      id: s.id, staff_id: s.staff_id, supervisor_id: s.supervisor_id, type: s.type, scheduled_date: d(s.scheduled_date),
      actual_date: s.actual_date ? d(s.actual_date) : null, status: s.status, home_id: s.home_id, created_at: s.created_at, updated_at: s.updated_at,
    })),
  });

  return NextResponse.json({ data: result });
}
