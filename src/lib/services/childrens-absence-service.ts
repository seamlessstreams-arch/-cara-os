// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S ABSENCE SERVICE
// Tracks school absences, authorised/unauthorised absences, patterns,
// interventions, and educational engagement for looked-after children.
// CHR 2015 Reg 8 (education — promoting educational achievement),
// Reg 7 (welfare — meeting needs including education),
// Reg 25 (premises — study environment).
//
// Covers: school attendance monitoring, absence reasons, intervention
// plans, communication with schools, PEP (Personal Education Plan)
// compliance, and exclusion tracking.
//
// SCCIF: Education — "Children attend school regularly."
// "Unauthorised absences are addressed swiftly."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AbsenceType =
  | "illness"
  | "medical_appointment"
  | "exclusion"
  | "unauthorised"
  | "authorised_other"
  | "family_contact"
  | "court_appearance"
  | "religious_observance"
  | "bereavement"
  | "other";

export type AbsenceDuration =
  | "half_day_am"
  | "half_day_pm"
  | "full_day"
  | "multiple_days"
  | "part_session";

export type InterventionStatus =
  | "none_needed"
  | "planned"
  | "in_progress"
  | "completed"
  | "escalated";

export type AttendanceRisk =
  | "on_track"
  | "at_risk"
  | "persistent_absence"
  | "severe_absence"
  | "excluded";

export interface ChildrensAbsenceRecord {
  id: string;
  home_id: string;
  absence_type: AbsenceType;
  absence_duration: AbsenceDuration;
  intervention_status: InterventionStatus;
  attendance_risk: AttendanceRisk;
  absence_date: string;
  return_date: string | null;
  child_name: string;
  child_id: string | null;
  school_name: string;
  authorised: boolean;
  school_notified: boolean;
  social_worker_informed: boolean;
  parents_informed: boolean;
  medical_evidence_provided: boolean;
  pep_reviewed: boolean;
  catch_up_plan_in_place: boolean;
  pattern_identified: boolean;
  days_missed: number;
  cumulative_days_missed: number;
  attendance_percentage: number;
  reason_details: string;
  issues_found: string[];
  actions_taken: string[];
  recorded_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ABSENCE_TYPES: { type: AbsenceType; label: string }[] = [
  { type: "illness", label: "Illness" },
  { type: "medical_appointment", label: "Medical Appointment" },
  { type: "exclusion", label: "Exclusion" },
  { type: "unauthorised", label: "Unauthorised" },
  { type: "authorised_other", label: "Authorised Other" },
  { type: "family_contact", label: "Family Contact" },
  { type: "court_appearance", label: "Court Appearance" },
  { type: "religious_observance", label: "Religious Observance" },
  { type: "bereavement", label: "Bereavement" },
  { type: "other", label: "Other" },
];

export const ABSENCE_DURATIONS: { duration: AbsenceDuration; label: string }[] = [
  { duration: "half_day_am", label: "Half Day (AM)" },
  { duration: "half_day_pm", label: "Half Day (PM)" },
  { duration: "full_day", label: "Full Day" },
  { duration: "multiple_days", label: "Multiple Days" },
  { duration: "part_session", label: "Part Session" },
];

export const INTERVENTION_STATUSES: { status: InterventionStatus; label: string }[] = [
  { status: "none_needed", label: "None Needed" },
  { status: "planned", label: "Planned" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "escalated", label: "Escalated" },
];

export const ATTENDANCE_RISKS: { risk: AttendanceRisk; label: string }[] = [
  { risk: "on_track", label: "On Track" },
  { risk: "at_risk", label: "At Risk" },
  { risk: "persistent_absence", label: "Persistent Absence" },
  { risk: "severe_absence", label: "Severe Absence" },
  { risk: "excluded", label: "Excluded" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeAbsenceMetrics(
  records: ChildrensAbsenceRecord[],
): {
  total_absences: number;
  authorised_count: number;
  unauthorised_count: number;
  authorised_rate: number | null;
  exclusion_count: number;
  illness_count: number;
  total_days_missed: number;
  average_days_missed: number | null;
  average_attendance_percentage: number | null;
  school_notified_rate: number | null;
  social_worker_informed_rate: number | null;
  parents_informed_rate: number | null;
  pep_reviewed_rate: number | null;
  catch_up_plan_rate: number | null;
  pattern_identified_count: number;
  persistent_absence_count: number;
  unique_children: number;
  by_absence_type: Record<string, number>;
  by_absence_duration: Record<string, number>;
  by_intervention_status: Record<string, number>;
  by_attendance_risk: Record<string, number>;
} {
  const authorised = records.filter((r) => r.authorised).length;
  const unauthorised = records.filter((r) => !r.authorised).length;
  const authorisedRate =
    records.length > 0
      ? Math.round((authorised / records.length) * 1000) / 10
      : null;

  const exclusions = records.filter((r) => r.absence_type === "exclusion").length;
  const illness = records.filter((r) => r.absence_type === "illness").length;

  const totalDays = records.reduce((a, r) => a + r.days_missed, 0);
  const avgDays =
    records.length > 0
      ? Math.round((totalDays / records.length) * 10) / 10
      : null;

  const attendancePercentages = records.map((r) => r.attendance_percentage);
  const avgAttendance =
    attendancePercentages.length > 0
      ? Math.round(
          (attendancePercentages.reduce((a, b) => a + b, 0) / attendancePercentages.length) * 10,
        ) / 10
      : null;

  const boolRate = (field: keyof ChildrensAbsenceRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const patternCount = records.filter((r) => r.pattern_identified).length;
  const persistentAbsence = records.filter(
    (r) => r.attendance_risk === "persistent_absence" || r.attendance_risk === "severe_absence",
  ).length;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.absence_type] = (byType[r.absence_type] ?? 0) + 1;

  const byDuration: Record<string, number> = {};
  for (const r of records) byDuration[r.absence_duration] = (byDuration[r.absence_duration] ?? 0) + 1;

  const byIntervention: Record<string, number> = {};
  for (const r of records) byIntervention[r.intervention_status] = (byIntervention[r.intervention_status] ?? 0) + 1;

  const byRisk: Record<string, number> = {};
  for (const r of records) byRisk[r.attendance_risk] = (byRisk[r.attendance_risk] ?? 0) + 1;

  return {
    total_absences: records.length,
    authorised_count: authorised,
    unauthorised_count: unauthorised,
    authorised_rate: authorisedRate,
    exclusion_count: exclusions,
    illness_count: illness,
    total_days_missed: totalDays,
    average_days_missed: avgDays,
    average_attendance_percentage: avgAttendance,
    school_notified_rate: boolRate("school_notified"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    parents_informed_rate: boolRate("parents_informed"),
    pep_reviewed_rate: boolRate("pep_reviewed"),
    catch_up_plan_rate: boolRate("catch_up_plan_in_place"),
    pattern_identified_count: patternCount,
    persistent_absence_count: persistentAbsence,
    unique_children: uniqueChildren,
    by_absence_type: byType,
    by_absence_duration: byDuration,
    by_intervention_status: byIntervention,
    by_attendance_risk: byRisk,
  };
}

export function identifyAbsenceAlerts(
  records: ChildrensAbsenceRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Exclusion
  for (const r of records) {
    if (r.absence_type === "exclusion") {
      alerts.push({
        type: "exclusion",
        severity: "critical",
        message: `${r.child_name} excluded from ${r.school_name} on ${r.absence_date} — review placement support and PEP`,
        id: r.id,
      });
    }
  }

  // Persistent absence
  const persistent = records.filter(
    (r) => r.attendance_risk === "persistent_absence" || r.attendance_risk === "severe_absence",
  ).length;
  if (persistent >= 1) {
    alerts.push({
      type: "persistent_absence",
      severity: "high",
      message: `${persistent} ${persistent === 1 ? "child has" : "children have"} persistent or severe absence — implement intervention plan`,
      id: "persistent_absence",
    });
  }

  // Unauthorised absences
  const unauth = records.filter((r) => !r.authorised).length;
  if (unauth >= 3) {
    alerts.push({
      type: "unauthorised_absences",
      severity: "high",
      message: `${unauth} unauthorised absences recorded — review with school and social worker`,
      id: "unauthorised_absences",
    });
  }

  // School not notified
  const notNotified = records.filter((r) => !r.school_notified).length;
  if (notNotified >= 2) {
    alerts.push({
      type: "school_not_notified",
      severity: "medium",
      message: `${notNotified} absences without school notification — ensure schools are informed promptly`,
      id: "school_not_notified",
    });
  }

  // Pattern identified
  const patterns = records.filter((r) => r.pattern_identified).length;
  if (patterns >= 2) {
    alerts.push({
      type: "absence_pattern",
      severity: "medium",
      message: `${patterns} absences with identified patterns — analyse triggers and plan support`,
      id: "absence_pattern",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    absenceType?: AbsenceType;
    interventionStatus?: InterventionStatus;
    attendanceRisk?: AttendanceRisk;
    limit?: number;
  },
): Promise<ServiceResult<ChildrensAbsenceRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_childrens_absences") as SB).select("*").eq("home_id", homeId);
  if (filters?.absenceType) q = q.eq("absence_type", filters.absenceType);
  if (filters?.interventionStatus) q = q.eq("intervention_status", filters.interventionStatus);
  if (filters?.attendanceRisk) q = q.eq("attendance_risk", filters.attendanceRisk);
  q = q.order("absence_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    absenceType: AbsenceType;
    absenceDuration: AbsenceDuration;
    interventionStatus: InterventionStatus;
    attendanceRisk: AttendanceRisk;
    absenceDate: string;
    returnDate?: string;
    childName: string;
    childId?: string;
    schoolName: string;
    authorised: boolean;
    schoolNotified: boolean;
    socialWorkerInformed: boolean;
    parentsInformed: boolean;
    medicalEvidenceProvided: boolean;
    pepReviewed: boolean;
    catchUpPlanInPlace: boolean;
    patternIdentified: boolean;
    daysMissed: number;
    cumulativeDaysMissed: number;
    attendancePercentage: number;
    reasonDetails: string;
    issuesFound: string[];
    actionsTaken: string[];
    recordedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<ChildrensAbsenceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_absences") as SB)
    .insert({
      home_id: input.homeId,
      absence_type: input.absenceType,
      absence_duration: input.absenceDuration,
      intervention_status: input.interventionStatus,
      attendance_risk: input.attendanceRisk,
      absence_date: input.absenceDate,
      return_date: input.returnDate ?? null,
      child_name: input.childName,
      child_id: input.childId ?? null,
      school_name: input.schoolName,
      authorised: input.authorised,
      school_notified: input.schoolNotified,
      social_worker_informed: input.socialWorkerInformed,
      parents_informed: input.parentsInformed,
      medical_evidence_provided: input.medicalEvidenceProvided,
      pep_reviewed: input.pepReviewed,
      catch_up_plan_in_place: input.catchUpPlanInPlace,
      pattern_identified: input.patternIdentified,
      days_missed: input.daysMissed,
      cumulative_days_missed: input.cumulativeDaysMissed,
      attendance_percentage: input.attendancePercentage,
      reason_details: input.reasonDetails,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      recorded_by: input.recordedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ChildrensAbsenceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_absences") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAbsenceMetrics,
  identifyAbsenceAlerts,
};
