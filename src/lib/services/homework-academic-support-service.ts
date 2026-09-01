// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOMEWORK ACADEMIC SUPPORT SERVICE
// Tracks homework completion, academic tutoring, school liaison,
// learning support, and educational progress monitoring.
// CHR 2015 Reg 8(2)(a) (education — academic achievement),
// Reg 8(1) (promotion of educational development).
//
// Covers: subject area, support type, engagement level,
// progress outcome, and school communication.
//
// SCCIF: Experiences — "Children are supported with their education."
// "Academic achievement is prioritised and progress tracked."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SubjectArea =
  | "english"
  | "maths"
  | "science"
  | "humanities"
  | "languages"
  | "creative_arts"
  | "technology"
  | "physical_education"
  | "life_skills"
  | "other";

export type SupportType =
  | "homework_help"
  | "one_to_one_tutoring"
  | "group_study"
  | "revision_support"
  | "exam_preparation";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "partially_engaged"
  | "disengaged"
  | "refused";

export type ProgressOutcome =
  | "exceeded_expectations"
  | "met_expectations"
  | "some_progress"
  | "no_progress"
  | "regression";

export interface HomeworkAcademicSupportRecord {
  id: string;
  home_id: string;
  subject_area: SubjectArea;
  support_type: SupportType;
  engagement_level: EngagementLevel;
  progress_outcome: ProgressOutcome;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  homework_completed: boolean;
  quiet_space_provided: boolean;
  resources_available: boolean;
  school_liaison_made: boolean;
  learning_needs_met: boolean;
  positive_encouragement: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  pep_updated: boolean;
  attendance_checked: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SUBJECT_AREAS: { area: SubjectArea; label: string }[] = [
  { area: "english", label: "English" },
  { area: "maths", label: "Maths" },
  { area: "science", label: "Science" },
  { area: "humanities", label: "Humanities" },
  { area: "languages", label: "Languages" },
  { area: "creative_arts", label: "Creative Arts" },
  { area: "technology", label: "Technology" },
  { area: "physical_education", label: "Physical Education" },
  { area: "life_skills", label: "Life Skills" },
  { area: "other", label: "Other" },
];

export const SUPPORT_TYPES: { type: SupportType; label: string }[] = [
  { type: "homework_help", label: "Homework Help" },
  { type: "one_to_one_tutoring", label: "One-to-One Tutoring" },
  { type: "group_study", label: "Group Study" },
  { type: "revision_support", label: "Revision Support" },
  { type: "exam_preparation", label: "Exam Preparation" },
];

export const ENGAGEMENT_LEVELS: { level: EngagementLevel; label: string }[] = [
  { level: "highly_engaged", label: "Highly Engaged" },
  { level: "engaged", label: "Engaged" },
  { level: "partially_engaged", label: "Partially Engaged" },
  { level: "disengaged", label: "Disengaged" },
  { level: "refused", label: "Refused" },
];

export const PROGRESS_OUTCOMES: { outcome: ProgressOutcome; label: string }[] = [
  { outcome: "exceeded_expectations", label: "Exceeded Expectations" },
  { outcome: "met_expectations", label: "Met Expectations" },
  { outcome: "some_progress", label: "Some Progress" },
  { outcome: "no_progress", label: "No Progress" },
  { outcome: "regression", label: "Regression" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeHomeworkAcademicMetrics(
  records: HomeworkAcademicSupportRecord[],
): {
  total_sessions: number;
  disengaged_count: number;
  refused_count: number;
  no_progress_count: number;
  regression_count: number;
  homework_completed_rate: number | null;
  quiet_space_rate: number | null;
  resources_rate: number | null;
  school_liaison_rate: number | null;
  learning_needs_rate: number | null;
  encouragement_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  pep_updated_rate: number | null;
  attendance_checked_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_subject_area: Record<string, number>;
  by_support_type: Record<string, number>;
  by_engagement_level: Record<string, number>;
  by_progress_outcome: Record<string, number>;
} {
  const disengaged = records.filter((r) => r.engagement_level === "disengaged").length;
  const refused = records.filter((r) => r.engagement_level === "refused").length;
  const noProgress = records.filter((r) => r.progress_outcome === "no_progress").length;
  const regression = records.filter((r) => r.progress_outcome === "regression").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof HomeworkAcademicSupportRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const bySubject: Record<string, number> = {};
  for (const r of records) bySubject[r.subject_area] = (bySubject[r.subject_area] ?? 0) + 1;

  const bySupport: Record<string, number> = {};
  for (const r of records) bySupport[r.support_type] = (bySupport[r.support_type] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.engagement_level] = (byEngagement[r.engagement_level] ?? 0) + 1;

  const byProgress: Record<string, number> = {};
  for (const r of records) byProgress[r.progress_outcome] = (byProgress[r.progress_outcome] ?? 0) + 1;

  return {
    total_sessions: records.length,
    disengaged_count: disengaged,
    refused_count: refused,
    no_progress_count: noProgress,
    regression_count: regression,
    homework_completed_rate: boolRate("homework_completed"),
    quiet_space_rate: boolRate("quiet_space_provided"),
    resources_rate: boolRate("resources_available"),
    school_liaison_rate: boolRate("school_liaison_made"),
    learning_needs_rate: boolRate("learning_needs_met"),
    encouragement_rate: boolRate("positive_encouragement"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    pep_updated_rate: boolRate("pep_updated"),
    attendance_checked_rate: boolRate("attendance_checked"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_subject_area: bySubject,
    by_support_type: bySupport,
    by_engagement_level: byEngagement,
    by_progress_outcome: byProgress,
  };
}

export function identifyHomeworkAcademicAlerts(
  records: HomeworkAcademicSupportRecord[],
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

  // Refused and regressing — per-record critical
  for (const r of records) {
    if (r.engagement_level === "refused" && r.progress_outcome === "regression") {
      alerts.push({
        type: "refused_regressing",
        severity: "critical",
        message: `${r.child_name} refusing ${r.subject_area.replace(/_/g, " ")} support and regressing academically — urgent educational intervention needed`,
        id: r.id,
      });
    }
  }

  // No school liaison
  const noLiaison = records.filter((r) => !r.school_liaison_made).length;
  if (noLiaison >= 1) {
    alerts.push({
      type: "no_school_liaison",
      severity: "high",
      message: `${noLiaison} ${noLiaison === 1 ? "session has" : "sessions have"} no school liaison — ensure joined-up educational support`,
      id: "no_school_liaison",
    });
  }

  // PEP not updated
  const noPep = records.filter((r) => !r.pep_updated).length;
  if (noPep >= 1) {
    alerts.push({
      type: "pep_not_updated",
      severity: "high",
      message: `${noPep} ${noPep === 1 ? "session has" : "sessions have"} PEP not updated — Personal Education Plan must reflect progress`,
      id: "pep_not_updated",
    });
  }

  // No quiet space
  const noSpace = records.filter((r) => !r.quiet_space_provided).length;
  if (noSpace >= 2) {
    alerts.push({
      type: "no_quiet_space",
      severity: "medium",
      message: `${noSpace} sessions without quiet study space — ensure suitable learning environment`,
      id: "no_quiet_space",
    });
  }

  // No resources
  const noResources = records.filter((r) => !r.resources_available).length;
  if (noResources >= 2) {
    alerts.push({
      type: "no_resources",
      severity: "medium",
      message: `${noResources} sessions without adequate resources — review learning material provision`,
      id: "no_resources",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    subjectArea?: SubjectArea;
    supportType?: SupportType;
    engagementLevel?: EngagementLevel;
    progressOutcome?: ProgressOutcome;
    limit?: number;
  },
): Promise<ServiceResult<HomeworkAcademicSupportRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_homework_academic_support") as SB).select("*").eq("home_id", homeId);
  if (filters?.subjectArea) q = q.eq("subject_area", filters.subjectArea);
  if (filters?.supportType) q = q.eq("support_type", filters.supportType);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);
  if (filters?.progressOutcome) q = q.eq("progress_outcome", filters.progressOutcome);
  q = q.order("session_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as HomeworkAcademicSupportRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  subjectArea: SubjectArea;
  supportType: SupportType;
  engagementLevel: EngagementLevel;
  progressOutcome: ProgressOutcome;
  sessionDate: string;
  childName: string;
  childId?: string | null;
  supportedBy: string;
  homeworkCompleted?: boolean;
  quietSpaceProvided?: boolean;
  resourcesAvailable?: boolean;
  schoolLiaisonMade?: boolean;
  learningNeedsMet?: boolean;
  positiveEncouragement?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  pepUpdated?: boolean;
  attendanceChecked?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<HomeworkAcademicSupportRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_homework_academic_support") as SB)
    .insert({
      home_id: payload.homeId,
      subject_area: payload.subjectArea,
      support_type: payload.supportType,
      engagement_level: payload.engagementLevel,
      progress_outcome: payload.progressOutcome,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      supported_by: payload.supportedBy,
      homework_completed: payload.homeworkCompleted ?? true,
      quiet_space_provided: payload.quietSpaceProvided ?? true,
      resources_available: payload.resourcesAvailable ?? true,
      school_liaison_made: payload.schoolLiaisonMade ?? true,
      learning_needs_met: payload.learningNeedsMet ?? true,
      positive_encouragement: payload.positiveEncouragement ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
      pep_updated: payload.pepUpdated ?? true,
      attendance_checked: payload.attendanceChecked ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as HomeworkAcademicSupportRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    subjectArea: SubjectArea;
    supportType: SupportType;
    engagementLevel: EngagementLevel;
    progressOutcome: ProgressOutcome;
    sessionDate: string;
    childName: string;
    childId: string | null;
    supportedBy: string;
    homeworkCompleted: boolean;
    quietSpaceProvided: boolean;
    resourcesAvailable: boolean;
    schoolLiaisonMade: boolean;
    learningNeedsMet: boolean;
    positiveEncouragement: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    pepUpdated: boolean;
    attendanceChecked: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<HomeworkAcademicSupportRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.subjectArea !== undefined) mapped.subject_area = updates.subjectArea;
  if (updates.supportType !== undefined) mapped.support_type = updates.supportType;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.progressOutcome !== undefined) mapped.progress_outcome = updates.progressOutcome;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.homeworkCompleted !== undefined) mapped.homework_completed = updates.homeworkCompleted;
  if (updates.quietSpaceProvided !== undefined) mapped.quiet_space_provided = updates.quietSpaceProvided;
  if (updates.resourcesAvailable !== undefined) mapped.resources_available = updates.resourcesAvailable;
  if (updates.schoolLiaisonMade !== undefined) mapped.school_liaison_made = updates.schoolLiaisonMade;
  if (updates.learningNeedsMet !== undefined) mapped.learning_needs_met = updates.learningNeedsMet;
  if (updates.positiveEncouragement !== undefined) mapped.positive_encouragement = updates.positiveEncouragement;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.pepUpdated !== undefined) mapped.pep_updated = updates.pepUpdated;
  if (updates.attendanceChecked !== undefined) mapped.attendance_checked = updates.attendanceChecked;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_homework_academic_support") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as HomeworkAcademicSupportRecord };
}

export const _testing = { computeHomeworkAcademicMetrics, identifyHomeworkAcademicAlerts };
