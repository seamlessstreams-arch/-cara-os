// ==============================================================================
// CORNERSTONE -- HOME SAFEGUARDING PREVENTION INTELLIGENCE API ROUTE
// GET /api/v1/home-safeguarding-prevention-intelligence
// Bullying incidents, hate incidents, Prevent duty, court attendance.
// CHR 2015 Reg 12/13.
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeSafeguardingPrevention,
  type BullyingInput,
  type HateIncidentInput,
  type PreventScreeningInput,
  type PreventRecordInput,
  type CourtAttendanceInput,
} from "@/lib/engines/home-safeguarding-prevention-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // -- Children ---------------------------------------------------------------
  const childIds = new Set<string>();
  for (const c of (store.youngPeople ?? []) as any[]) {
    if (c.id) childIds.add(c.id.toString());
  }
  const total_children = childIds.size;

  // -- Bullying Incidents -----------------------------------------------------
  const bullying_incidents: BullyingInput[] = (
    (store.bullyingIncidents ?? []) as any[]
  ).map((b: any) => ({
    id: (b.id ?? "").toString(),
    child_id: (b.child_id ?? "").toString(),
    date: (b.date ?? "").toString().slice(0, 10),
    school_notified: !!(b.school_notified),
    police_notified: !!(b.police_notified),
    restorative_attempted: !!(b.restorative_approach_attempted && b.restorative_approach_attempted !== ""),
    support_provided_count: Array.isArray(b.support_provided) ? b.support_provided.length : 0,
    // Translate the store's BullyingStatus enum to the values this engine scores
    // against ("resolved"/"open"/"investigating"/"monitoring").
    status: (b.status === "closed_resolved"
      ? "resolved"
      : b.status === "open_investigating" || b.status === "escalated"
        ? "open"
        : (b.status ?? "open")).toString() as any,
    follow_up_date: (b.follow_up_date ?? "").toString().slice(0, 10),
  }));

  // -- Hate Incidents ---------------------------------------------------------
  const hate_incidents: HateIncidentInput[] = (
    (store.hateIncidents ?? []) as any[]
  ).map((h: any) => ({
    id: (h.id ?? "").toString(),
    date: (h.date ?? "").toString().slice(0, 10),
    reported_to_police: !!(h.reported_to_police),
    reported_to_ofsted: !!(h.reported_to_ofsted),
    reported_to_la: !!(h.reported_to_la),
    prevention_measures_count: Array.isArray(h.prevention_measures_added) ? h.prevention_measures_added.length : 0,
    status: (h.status ?? "open").toString() as any,
    follow_up_date: (h.follow_up_date ?? "").toString().slice(0, 10),
  }));

  // -- Prevent Screenings -----------------------------------------------------
  const prevent_screenings: PreventScreeningInput[] = (
    (store.preventScreenings ?? []) as any[]
  ).map((p: any) => ({
    id: (p.id ?? "").toString(),
    child_id: (p.child_id ?? "").toString(),
    recorded_date: (p.recorded_date ?? "").toString().slice(0, 10),
    screening_outcome: (p.screening_outcome ?? "").toString(),
    child_voice_consulted: !!(p.child_voice_consulted),
    review_date: (p.review_date ?? "").toString().slice(0, 10),
    online_flags_count: Array.isArray(p.online_activity_flags) ? p.online_activity_flags.length : 0,
  }));

  // -- Prevent Records --------------------------------------------------------
  const prevent_records: PreventRecordInput[] = (
    (store.preventRecords ?? []) as any[]
  ).map((p: any) => ({
    id: (p.id ?? "").toString(),
    child_id_present: !!(p.child_id),
    date: (p.date ?? "").toString().slice(0, 10),
    risk_level: (p.risk_level ?? "").toString(),
    status: (p.status ?? "").toString(),
    training_completed: !!(p.training_completed),
    multi_agency_count: Array.isArray(p.multi_agency) ? p.multi_agency.length : 0,
  }));

  // -- Court Attendance Records -----------------------------------------------
  const court_attendance_records: CourtAttendanceInput[] = (
    (store.courtAttendanceRecords ?? []) as any[]
  ).map((c: any) => ({
    id: (c.id ?? "").toString(),
    child_id: (c.child_id ?? "").toString(),
    recorded_date: (c.recorded_date ?? "").toString().slice(0, 10),
    risk_assessment_done: !!(c.risk_assessment_done),
    pre_hearing_prep_count: Array.isArray(c.pre_hearing_prep) ? c.pre_hearing_prep.length : 0,
    post_hearing_support_count: Array.isArray(c.post_hearing_support) ? c.post_hearing_support.length : 0,
    special_measures_count: Array.isArray(c.special_measures_agreed) ? c.special_measures_agreed.length : 0,
    child_voice_provided: !!(c.child_voice && c.child_voice !== ""),
  }));

  const result = computeHomeSafeguardingPrevention({
    today,
    bullying_incidents,
    hate_incidents,
    prevent_screenings,
    prevent_records,
    court_attendance_records,
    total_children,
  });

  return NextResponse.json({ data: result });
}
