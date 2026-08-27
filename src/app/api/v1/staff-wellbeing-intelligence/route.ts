import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";
import {
  computeStaffWellbeing,
  type StaffWellbeingInput,
  type StaffMemberInput,
  type ShiftInput,
  type SupervisionInput,
  type SicknessInput,
  type WellbeingCheckInput,
  type DebriefInput,
  type RecognitionInput,
  type GrievanceInput,
  type IncidentInvolvementInput,
  type LeaveRequestInput,
} from "@/lib/engines/staff-wellbeing-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const [incidentsList, leaveRequestsList, shiftsList, staffList, staffDebriefRecordsList, staffGrievanceRecordsList, staffRecognitionRecordsList, staffSicknessRecordsList, staffWellbeingRecordsList, supervisionsList, homeRec] = await Promise.all([dal.incidents.findAll(), dal.leaveRequests.findAll(), dal.shifts.findAll(), dal.staff.findAll(), dal.staffDebriefRecords.findAll(), dal.staffGrievanceRecords.findAll(), dal.staffRecognitionRecords.findAll(), dal.staffSicknessRecords.findAll(), dal.staffWellbeingRecords.findAll(), dal.supervisions.findAll(), dal.home.get()]);
  const today = todayStr();

  // ── Staff ─────────────────────────────────────────────────────────────────
  const staffMembers: StaffMemberInput[] = (staffList ?? []).map((s) => ({
    id: s.id,
    name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.name || "Unknown",
    role: s.role ?? s.job_title ?? "Residential Care Worker",
    start_date: s.start_date ?? s.joined_date ?? s.created_at ?? "2024-01-01",
    contracted_hours: s.contracted_hours ?? 37.5,
    is_active: s.is_active !== false,
  }));

  // ── Shifts ────────────────────────────────────────────────────────────────
  const shifts: ShiftInput[] = (shiftsList ?? []).map((s) => ({
    staff_id: s.staff_id,
    date: (s.date ?? s.shift_date ?? "").slice(0, 10),
    shift_type: s.shift_type ?? "day",
    start_time: s.start_time ?? "07:00",
    end_time: s.end_time ?? "15:00",
    overtime_minutes: s.overtime_minutes ?? 0,
    status: s.status ?? "completed",
  }));

  // ── Leave Requests ────────────────────────────────────────────────────────
  const leaveRequests: LeaveRequestInput[] = (leaveRequestsList ?? []).map((lr) => ({
    staff_id: lr.staff_id,
    leave_type: lr.leave_type ?? "annual",
    start_date: (lr.start_date ?? "").slice(0, 10),
    end_date: (lr.end_date ?? "").slice(0, 10),
    total_days: lr.total_days ?? 1,
    status: lr.status ?? "approved",
  }));

  // ── Supervisions ──────────────────────────────────────────────────────────
  const supervisions: SupervisionInput[] = (supervisionsList ?? []).map((sv) => ({
    staff_id: sv.staff_id,
    scheduled_date: (sv.scheduled_date ?? sv.date ?? "").slice(0, 10),
    actual_date: sv.actual_date ? sv.actual_date.slice(0, 10) : null,
    status: sv.status ?? "scheduled",
    wellbeing_score: sv.wellbeing_score ?? null,
    duration_minutes: sv.duration_minutes ?? null,
  }));

  // ── Sickness Records ──────────────────────────────────────────────────────
  const sicknessRecords: SicknessInput[] = (staffSicknessRecordsList ?? []).map((s) => ({
    staff_id: s.staff_id,
    date_started: (s.date_started ?? "").slice(0, 10),
    date_ended: s.date_ended ? s.date_ended.slice(0, 10) : null,
    total_days: s.total_days ?? 1,
    category: s.category ?? "unspecified",
    reason: s.reason ?? s.reason_detail ?? "",
    rtw_status: s.rtw_status ?? "not_required",
    occupational_health_referral: s.occupational_health_referral ?? false,
    trigger_points: s.trigger_points ?? [],
  }));

  // ── Wellbeing Checks ──────────────────────────────────────────────────────
  const wellbeingChecks: WellbeingCheckInput[] = (staffWellbeingRecordsList ?? []).map((w) => ({
    staff_id: w.staff_id,
    date: (w.date ?? "").slice(0, 10),
    overall_score: w.overall_score ?? 5,
    workload_score: w.workload_score ?? 5,
    support_score: w.support_score ?? 5,
    moral_score: w.moral_score ?? 5,
    stressors: w.stressors ?? [],
    action_agreed: w.action_agreed ?? "",
    follow_up_date: w.follow_up_date ? w.follow_up_date.slice(0, 10) : null,
  }));

  // ── Debriefs ──────────────────────────────────────────────────────────────
  const debriefRecords: DebriefInput[] = (staffDebriefRecordsList ?? []).map((d) => ({
    date: (d.date ?? "").slice(0, 10),
    staff_involved: d.staff_involved ?? [],
    emotional_impact: d.emotional_impact ?? "moderate",
    key_themes: d.key_themes ?? [],
    support_offered: d.support_offered ?? [],
    follow_up_needed: d.follow_up_needed ?? false,
  }));

  // ── Recognition ───────────────────────────────────────────────────────────
  const recognitionRecords: RecognitionInput[] = (staffRecognitionRecordsList ?? []).map((r) => ({
    staff_id: r.staff_member ?? "",
    date: (r.date ?? "").slice(0, 10),
    type: r.recognition_type ?? "peer",
  }));

  // ── Grievances ────────────────────────────────────────────────────────────
  const grievanceRecords: GrievanceInput[] = (staffGrievanceRecordsList ?? []).map((g) => ({
    staff_id: g.raised_by ?? "",
    date: (g.raised_date ?? "").slice(0, 10),
    status: g.status ?? "open",
    category: g.category ?? "other",
  }));

  // ── Incident Involvement ──────────────────────────────────────────────────
  // Incident has no staff_id/staff_involved fields (the old reads matched
  // nothing, so this input was permanently empty and incident exposure never
  // registered). The reporting staff member is id-keyed; witnesses mix free-text
  // names with staff ids, so a witness counts only when it matches a real staff
  // record.
  const staffIds = new Set((staffList ?? []).map((s) => s.id));
  const incidents: IncidentInvolvementInput[] = [];
  for (const i of incidentsList ?? []) {
    const involved = new Set<string>();
    if (i.reported_by && staffIds.has(i.reported_by)) involved.add(i.reported_by);
    for (const w of i.witnesses ?? []) {
      if (staffIds.has(w)) involved.add(w);
    }
    for (const sid of involved) {
      incidents.push({
        staff_id: sid,
        date: (i.date ?? "").slice(0, 10),
        severity: i.severity ?? "medium",
        type: i.type ?? "incident",
      });
    }
  }

  const input: StaffWellbeingInput = {
    today,
    home_name: homeRec?.name?.trim() || "This home",
    staff: staffMembers,
    shifts,
    leave_requests: leaveRequests,
    supervisions,
    sickness_records: sicknessRecords,
    wellbeing_checks: wellbeingChecks,
    debrief_records: debriefRecords,
    recognition_records: recognitionRecords,
    grievance_records: grievanceRecords,
    incidents,
  };

  const result = computeStaffWellbeing(input);
  return NextResponse.json({ data: result });
}
