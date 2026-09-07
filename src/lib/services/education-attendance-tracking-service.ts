// ══════════════════════════════════════════════════════════════════════════════
// CARA — EDUCATION ATTENDANCE TRACKING SERVICE
// Tracks school attendance, exclusions, absence reasons, and
// educational engagement for children in residential care.
// CHR 2015 Reg 8 (education — promoting attendance),
// Reg 25 (education records — maintaining attendance data).
//
// Covers: attendance status, absence reason, exclusion type,
// school engagement level, and PEP compliance.
//
// SCCIF: Experiences — "Children attend school regularly."
// "Exclusions are minimised and alternatives are found."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AttendanceStatus =
  | "present"
  | "authorised_absence"
  | "unauthorised_absence"
  | "fixed_term_exclusion"
  | "permanent_exclusion"
  | "internal_exclusion"
  | "part_time_timetable"
  | "alternative_provision"
  | "school_holiday"
  | "other";

export type AbsenceReason =
  | "illness"
  | "medical_appointment"
  | "therapy_session"
  | "contact_visit"
  | "emotional_wellbeing"
  | "refused_to_attend"
  | "transport_issue"
  | "exclusion"
  | "none"
  | "other";

export type SchoolEngagement =
  | "fully_engaged"
  | "mostly_engaged"
  | "partially_engaged"
  | "disengaged"
  | "not_assessed";

export type EducationSetting =
  | "mainstream_school"
  | "special_school"
  | "alternative_provision"
  | "pru"
  | "home_education";

export interface EducationAttendanceTrackingRecord {
  id: string;
  home_id: string;
  attendance_status: AttendanceStatus;
  absence_reason: AbsenceReason;
  school_engagement: SchoolEngagement;
  education_setting: EducationSetting;
  attendance_date: string;
  child_name: string;
  child_id: string | null;
  recorded_by: string;
  school_contacted: boolean;
  reason_documented: boolean;
  return_plan_in_place: boolean;
  pep_up_to_date: boolean;
  virtual_school_informed: boolean;
  social_worker_informed: boolean;
  child_views_sought: boolean;
  alternative_education_arranged: boolean;
  homework_supported: boolean;
  achievement_celebrated: boolean;
  parent_informed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  sessions_attended: number;
  sessions_possible: number;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ATTENDANCE_STATUSES: { status: AttendanceStatus; label: string }[] = [
  { status: "present", label: "Present" },
  { status: "authorised_absence", label: "Authorised Absence" },
  { status: "unauthorised_absence", label: "Unauthorised Absence" },
  { status: "fixed_term_exclusion", label: "Fixed-Term Exclusion" },
  { status: "permanent_exclusion", label: "Permanent Exclusion" },
  { status: "internal_exclusion", label: "Internal Exclusion" },
  { status: "part_time_timetable", label: "Part-Time Timetable" },
  { status: "alternative_provision", label: "Alternative Provision" },
  { status: "school_holiday", label: "School Holiday" },
  { status: "other", label: "Other" },
];

export const ABSENCE_REASONS: { reason: AbsenceReason; label: string }[] = [
  { reason: "illness", label: "Illness" },
  { reason: "medical_appointment", label: "Medical Appointment" },
  { reason: "therapy_session", label: "Therapy Session" },
  { reason: "contact_visit", label: "Contact Visit" },
  { reason: "emotional_wellbeing", label: "Emotional Wellbeing" },
  { reason: "refused_to_attend", label: "Refused to Attend" },
  { reason: "transport_issue", label: "Transport Issue" },
  { reason: "exclusion", label: "Exclusion" },
  { reason: "none", label: "None" },
  { reason: "other", label: "Other" },
];

export const SCHOOL_ENGAGEMENTS: { engagement: SchoolEngagement; label: string }[] = [
  { engagement: "fully_engaged", label: "Fully Engaged" },
  { engagement: "mostly_engaged", label: "Mostly Engaged" },
  { engagement: "partially_engaged", label: "Partially Engaged" },
  { engagement: "disengaged", label: "Disengaged" },
  { engagement: "not_assessed", label: "Not Assessed" },
];

export const EDUCATION_SETTINGS: { setting: EducationSetting; label: string }[] = [
  { setting: "mainstream_school", label: "Mainstream School" },
  { setting: "special_school", label: "Special School" },
  { setting: "alternative_provision", label: "Alternative Provision" },
  { setting: "pru", label: "PRU" },
  { setting: "home_education", label: "Home Education" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeEducationAttendanceMetrics(
  records: EducationAttendanceTrackingRecord[],
): {
  total_records: number;
  present_count: number;
  unauthorised_count: number;
  exclusion_count: number;
  refused_count: number;
  school_contacted_rate: number | null;
  reason_documented_rate: number | null;
  return_plan_rate: number | null;
  pep_up_to_date_rate: number | null;
  virtual_school_rate: number | null;
  social_worker_informed_rate: number | null;
  child_views_rate: number | null;
  alternative_education_rate: number | null;
  homework_supported_rate: number | null;
  achievement_celebrated_rate: number | null;
  parent_informed_rate: number | null;
  recorded_promptly_rate: number | null;
  attendance_percentage: number | null;
  unique_children: number;
  by_attendance_status: Record<string, number>;
  by_absence_reason: Record<string, number>;
  by_school_engagement: Record<string, number>;
  by_education_setting: Record<string, number>;
} {
  const present = records.filter((r) => r.attendance_status === "present").length;
  const unauthorised = records.filter((r) => r.attendance_status === "unauthorised_absence").length;
  const exclusion = records.filter((r) => r.attendance_status === "fixed_term_exclusion" || r.attendance_status === "permanent_exclusion" || r.attendance_status === "internal_exclusion").length;
  const refused = records.filter((r) => r.absence_reason === "refused_to_attend").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof EducationAttendanceTrackingRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const totalSessions = records.reduce((sum, r) => sum + r.sessions_possible, 0);
  const attendedSessions = records.reduce((sum, r) => sum + r.sessions_attended, 0);
  const attendancePct = totalSessions > 0
    ? Math.round((attendedSessions / totalSessions) * 1000) / 10
    : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.attendance_status] = (byStatus[r.attendance_status] ?? 0) + 1;

  const byReason: Record<string, number> = {};
  for (const r of records) byReason[r.absence_reason] = (byReason[r.absence_reason] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.school_engagement] = (byEngagement[r.school_engagement] ?? 0) + 1;

  const bySetting: Record<string, number> = {};
  for (const r of records) bySetting[r.education_setting] = (bySetting[r.education_setting] ?? 0) + 1;

  return {
    total_records: records.length,
    present_count: present,
    unauthorised_count: unauthorised,
    exclusion_count: exclusion,
    refused_count: refused,
    school_contacted_rate: boolRate("school_contacted"),
    reason_documented_rate: boolRate("reason_documented"),
    return_plan_rate: boolRate("return_plan_in_place"),
    pep_up_to_date_rate: boolRate("pep_up_to_date"),
    virtual_school_rate: boolRate("virtual_school_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    child_views_rate: boolRate("child_views_sought"),
    alternative_education_rate: boolRate("alternative_education_arranged"),
    homework_supported_rate: boolRate("homework_supported"),
    achievement_celebrated_rate: boolRate("achievement_celebrated"),
    parent_informed_rate: boolRate("parent_informed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    attendance_percentage: attendancePct,
    unique_children: uniqueChildren,
    by_attendance_status: byStatus,
    by_absence_reason: byReason,
    by_school_engagement: byEngagement,
    by_education_setting: bySetting,
  };
}

export function identifyEducationAttendanceAlerts(
  records: EducationAttendanceTrackingRecord[],
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

  // Permanent exclusion
  for (const r of records) {
    if (r.attendance_status === "permanent_exclusion") {
      alerts.push({
        type: "permanent_exclusion",
        severity: "critical",
        message: `${r.child_name} has a permanent exclusion from ${r.education_setting.replace(/_/g, " ")} — ensure alternative provision and advocacy`,
        id: r.id,
      });
    }
  }

  // PEP not up to date
  const noPep = records.filter((r) => !r.pep_up_to_date).length;
  if (noPep >= 1) {
    alerts.push({
      type: "pep_not_current",
      severity: "high",
      message: `${noPep} ${noPep === 1 ? "record shows" : "records show"} PEP not up to date — update personal education plans`,
      id: "pep_not_current",
    });
  }

  // School not contacted for absence
  const noContact = records.filter((r) => r.attendance_status !== "present" && r.attendance_status !== "school_holiday" && !r.school_contacted).length;
  if (noContact >= 1) {
    alerts.push({
      type: "school_not_contacted",
      severity: "high",
      message: `${noContact} ${noContact === 1 ? "absence has" : "absences have"} school not contacted — ensure communication with schools`,
      id: "school_not_contacted",
    });
  }

  // Child views not sought
  const noViews = records.filter((r) => !r.child_views_sought).length;
  if (noViews >= 2) {
    alerts.push({
      type: "child_views_not_sought",
      severity: "medium",
      message: `${noViews} attendance records without child views sought — ensure child participation`,
      id: "child_views_not_sought",
    });
  }

  // Achievement not celebrated
  const noAchievement = records.filter((r) => !r.achievement_celebrated).length;
  if (noAchievement >= 3) {
    alerts.push({
      type: "achievement_not_celebrated",
      severity: "medium",
      message: `${noAchievement} records without achievement celebrated — strengthen positive reinforcement`,
      id: "achievement_not_celebrated",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    attendanceStatus?: AttendanceStatus;
    absenceReason?: AbsenceReason;
    schoolEngagement?: SchoolEngagement;
    educationSetting?: EducationSetting;
    limit?: number;
  },
): Promise<ServiceResult<EducationAttendanceTrackingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_education_attendance_tracking") as SB).select("*").eq("home_id", homeId);
  if (filters?.attendanceStatus) q = q.eq("attendance_status", filters.attendanceStatus);
  if (filters?.absenceReason) q = q.eq("absence_reason", filters.absenceReason);
  if (filters?.schoolEngagement) q = q.eq("school_engagement", filters.schoolEngagement);
  if (filters?.educationSetting) q = q.eq("education_setting", filters.educationSetting);
  q = q.order("attendance_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    attendanceStatus: AttendanceStatus;
    absenceReason: AbsenceReason;
    schoolEngagement: SchoolEngagement;
    educationSetting: EducationSetting;
    attendanceDate: string;
    childName: string;
    childId?: string | null;
    recordedBy: string;
    schoolContacted?: boolean;
    reasonDocumented?: boolean;
    returnPlanInPlace?: boolean;
    pepUpToDate?: boolean;
    virtualSchoolInformed?: boolean;
    socialWorkerInformed?: boolean;
    childViewsSought?: boolean;
    alternativeEducationArranged?: boolean;
    homeworkSupported?: boolean;
    achievementCelebrated?: boolean;
    parentInformed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    sessionsAttended: number;
    sessionsPossible: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<EducationAttendanceTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_education_attendance_tracking") as SB)
    .insert({
      home_id: payload.homeId,
      attendance_status: payload.attendanceStatus,
      absence_reason: payload.absenceReason,
      school_engagement: payload.schoolEngagement,
      education_setting: payload.educationSetting,
      attendance_date: payload.attendanceDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      recorded_by: payload.recordedBy,
      school_contacted: payload.schoolContacted ?? true,
      reason_documented: payload.reasonDocumented ?? true,
      return_plan_in_place: payload.returnPlanInPlace ?? false,
      pep_up_to_date: payload.pepUpToDate ?? true,
      virtual_school_informed: payload.virtualSchoolInformed ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      child_views_sought: payload.childViewsSought ?? true,
      alternative_education_arranged: payload.alternativeEducationArranged ?? false,
      homework_supported: payload.homeworkSupported ?? true,
      achievement_celebrated: payload.achievementCelebrated ?? true,
      parent_informed: payload.parentInformed ?? false,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      sessions_attended: payload.sessionsAttended,
      sessions_possible: payload.sessionsPossible,
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    attendanceStatus: AttendanceStatus;
    absenceReason: AbsenceReason;
    schoolEngagement: SchoolEngagement;
    educationSetting: EducationSetting;
    attendanceDate: string;
    childName: string;
    childId: string | null;
    recordedBy: string;
    schoolContacted: boolean;
    reasonDocumented: boolean;
    returnPlanInPlace: boolean;
    pepUpToDate: boolean;
    virtualSchoolInformed: boolean;
    socialWorkerInformed: boolean;
    childViewsSought: boolean;
    alternativeEducationArranged: boolean;
    homeworkSupported: boolean;
    achievementCelebrated: boolean;
    parentInformed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    sessionsAttended: number;
    sessionsPossible: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<EducationAttendanceTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.attendanceStatus !== undefined) mapped.attendance_status = updates.attendanceStatus;
  if (updates.absenceReason !== undefined) mapped.absence_reason = updates.absenceReason;
  if (updates.schoolEngagement !== undefined) mapped.school_engagement = updates.schoolEngagement;
  if (updates.educationSetting !== undefined) mapped.education_setting = updates.educationSetting;
  if (updates.attendanceDate !== undefined) mapped.attendance_date = updates.attendanceDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.schoolContacted !== undefined) mapped.school_contacted = updates.schoolContacted;
  if (updates.reasonDocumented !== undefined) mapped.reason_documented = updates.reasonDocumented;
  if (updates.returnPlanInPlace !== undefined) mapped.return_plan_in_place = updates.returnPlanInPlace;
  if (updates.pepUpToDate !== undefined) mapped.pep_up_to_date = updates.pepUpToDate;
  if (updates.virtualSchoolInformed !== undefined) mapped.virtual_school_informed = updates.virtualSchoolInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.alternativeEducationArranged !== undefined) mapped.alternative_education_arranged = updates.alternativeEducationArranged;
  if (updates.homeworkSupported !== undefined) mapped.homework_supported = updates.homeworkSupported;
  if (updates.achievementCelebrated !== undefined) mapped.achievement_celebrated = updates.achievementCelebrated;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.sessionsAttended !== undefined) mapped.sessions_attended = updates.sessionsAttended;
  if (updates.sessionsPossible !== undefined) mapped.sessions_possible = updates.sessionsPossible;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_education_attendance_tracking") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEducationAttendanceMetrics,
  identifyEducationAttendanceAlerts,
};
