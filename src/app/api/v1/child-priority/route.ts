// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD PRIORITY (UNIFIED RISK) API ROUTE
// GET /api/v1/child-priority
//
// Meta-intelligence: fuses placement-breakdown risk, complaints↔incident
// correlation, and medication-error involvement into one ranked list of which
// children need attention most — and why. A child flagged across multiple
// streams rises to the top.
//
// CHR 2015 Reg 12/13 (protection & leadership oversight), Reg 5. SCCIF: leaders
// hold an accurate, joined-up view of each child's risks and act on them.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeChildPriority,
  type PriorityIncidentInput,
  type PriorityMedErrorInput,
} from "@/lib/child-priority/child-priority-engine";
import type {
  ChildInput, MissingInput, RestraintInput, SanctionInput,
  BehaviourInput, EducationInput, KeyworkingInput,
} from "@/lib/placement-breakdown-forecast/placement-breakdown-forecast-engine";
import type { ComplaintCorrInput } from "@/lib/complaints-incident-correlation/complaints-incident-correlation-engine";
import type { ContinuityStaffInput, ContinuitySessionInput } from "@/lib/staff-child-continuity/staff-child-continuity-engine";
import type { KeyWorkerLink } from "@/lib/child-priority/child-priority-engine";

const d = (v: unknown, fallback = ""): string => (v == null ? fallback : v.toString().slice(0, 10));

export async function GET() {
  const [behaviourLogList, complaintsList, educationRecordsList, incidentsList, keyWorkingSessionsList, medicationErrorsList, missingEpisodesList, restraintsList, sanctionRewardsList, staffList, youngPeopleList] = await Promise.all([
      dal.behaviourLog.findAll(),
      dal.complaints.findAll(),
      dal.educationRecords.findAll(),
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.medicationErrors.findAll(),
      dal.missingEpisodes.findAll(),
      dal.restraints.findAll(),
      dal.sanctionRewards.findAll(),
      dal.staff.findAll(),
      dal.youngPeople.findAll(),
    ]);

  const children: ChildInput[] = (((youngPeopleList ?? [])))
    .filter((yp) => yp.status === "current")
    .map((yp) => ({
      id: yp.id,
      name: yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id,
      date_of_birth: d(yp.date_of_birth),
      placement_start: d(yp.placement_start),
      placement_type: yp.placement_type ?? "unknown",
      risk_flags: Array.isArray(yp.risk_flags) ? yp.risk_flags : [],
    }));

  const incidents: PriorityIncidentInput[] = (((incidentsList ?? [])))
    .filter((i): i is typeof i & { child_id: string } => !!i.child_id)
    .map((i) => ({
      child_id: i.child_id,
      date: d(i.date ?? i.created_at),
      type: i.type ?? "other",
      severity: i.severity ?? "low",
    }));

  const complaints: ComplaintCorrInput[] = (((complaintsList ?? [])))
    .filter((c): c is typeof c & { child_id: string } => !!c.child_id)
    .map((c) => ({
      child_id: c.child_id,
      date: d(c.date_received ?? c.created_at),
      category: c.category ?? "other",
      includes_safeguarding_element: !!c.includes_safeguarding_element,
      status: c.status ?? "received",
    }));

  const medicationErrors: PriorityMedErrorInput[] = (((medicationErrorsList ?? [])))
    .filter((e): e is typeof e & { child_id: string } => !!e.child_id)
    .map((e) => ({
      child_id: e.child_id,
      date: d(e.date_occurred ?? e.created_at),
      severity: e.severity ?? "no_harm",
    }));

  const missingEpisodes: MissingInput[] = (((missingEpisodesList ?? []))).map((m) => ({
    child_id: m.child_id ?? "",
    date_missing: d(m.date_missing ?? m.created_at),
    risk_level: m.risk_level ?? "low",
    return_interview_completed: !!m.return_interview_completed,
  }));
  const restraints: RestraintInput[] = (((restraintsList ?? []))).map((r) => ({
    child_id: r.child_id ?? "", date: d(r.date ?? r.created_at),
  }));
  const sanctions: SanctionInput[] = (((sanctionRewardsList ?? []))).map((s) => ({
    child_id: s.child_id ?? "", date: d(s.date ?? s.created_at),
    direction: s.direction ?? "sanction", proportionate: s.proportionate !== false,
  }));
  const behaviour: BehaviourInput[] = (((behaviourLogList ?? []))).map((b) => ({
    child_id: b.child_id ?? "", date: d(b.date ?? b.created_at),
    direction: b.direction ?? "concern", intensity: b.intensity ?? "low",
  }));
  const education: EducationInput[] = (((educationRecordsList ?? []))).map((e) => ({
    child_id: e.child_id ?? "", date: d(e.date ?? e.created_at),
    attendance_status: e.attendance_status ?? null,
  }));
  const keyworking: KeyworkingInput[] = (((keyWorkingSessionsList ?? []))).map((k) => ({
    child_id: k.child_id ?? "", date: d(k.date ?? k.created_at),
    mood_before: typeof k.mood_before === "number" ? k.mood_before : 3,
    mood_after: typeof k.mood_after === "number" ? k.mood_after : 3,
  }));

  // ── Relational-continuity inputs (4th stream) ──────────────────────────
  const staff: ContinuityStaffInput[] = (((staffList ?? []))).map((s) => ({
    id: s.id,
    name: s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id,
    active: s.is_active ?? (s.employment_status ? s.employment_status === "active" : true),
  }));
  const keyWorkingSessions: ContinuitySessionInput[] = (((keyWorkingSessionsList ?? [])))
    .filter((k) => k.child_id && k.staff_id)
    .map((k) => ({ child_id: k.child_id, staff_id: k.staff_id, date: d(k.date ?? k.created_at) }));
  const keyWorkers: KeyWorkerLink[] = (((youngPeopleList ?? [])))
    .filter((yp) => yp.status === "current")
    .map((yp) => ({ child_id: yp.id, key_worker_id: yp.key_worker_id ?? null, secondary_worker_id: yp.secondary_worker_id ?? null }));

  const result = computeChildPriority({
    children, incidents, complaints, medicationErrors,
    missingEpisodes, restraints, sanctions, behaviour, education, keyworking,
    staff, keyWorkingSessions, keyWorkers,
  });

  return NextResponse.json({ data: result });
}
