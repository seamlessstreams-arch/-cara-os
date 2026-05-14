// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF COMPETENCY ASSESSMENT SERVICE
// Tracks ongoing competency assessments for care staff including
// practical observations, knowledge checks, and skill evaluations.
// CHR 2015 Reg 32 (fitness of workers — competence maintained),
// Reg 33 (employment practices — ongoing competency),
// Reg 19 (staff qualifications and experience).
//
// Covers: medication competency, restraint competency, safeguarding
// knowledge, first aid, recording standards, communication,
// key working skills, and behaviour management.
//
// SCCIF: Leadership — "Staff are competent and well trained."
// "Practice competency is assessed regularly."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CompetencyArea =
  | "medication_administration"
  | "physical_intervention"
  | "safeguarding_knowledge"
  | "first_aid"
  | "recording_standards"
  | "communication_skills"
  | "key_working"
  | "behaviour_management"
  | "health_and_safety"
  | "other";

export type AssessmentMethod =
  | "direct_observation"
  | "knowledge_test"
  | "practical_demonstration"
  | "case_study"
  | "supervision_discussion"
  | "peer_review"
  | "self_assessment"
  | "portfolio_review"
  | "scenario_exercise"
  | "other";

export type CompetencyRating =
  | "exceeds_expectations"
  | "meets_expectations"
  | "developing"
  | "below_expectations"
  | "not_yet_competent";

export type ActionRequired =
  | "none"
  | "additional_training"
  | "mentoring"
  | "supervised_practice"
  | "reassessment";

export interface StaffCompetencyAssessmentRecord {
  id: string;
  home_id: string;
  competency_area: CompetencyArea;
  assessment_method: AssessmentMethod;
  competency_rating: CompetencyRating;
  action_required: ActionRequired;
  assessment_date: string;
  staff_name: string;
  staff_role: string;
  assessor_name: string;
  theory_demonstrated: boolean;
  practical_demonstrated: boolean;
  reflective_practice_shown: boolean;
  values_aligned: boolean;
  child_centred_approach: boolean;
  evidence_documented: boolean;
  development_plan_updated: boolean;
  staff_agreed_outcome: boolean;
  follow_up_date_set: boolean;
  competency_maintained: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_assessment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const COMPETENCY_AREAS: { area: CompetencyArea; label: string }[] = [
  { area: "medication_administration", label: "Medication Administration" },
  { area: "physical_intervention", label: "Physical Intervention" },
  { area: "safeguarding_knowledge", label: "Safeguarding Knowledge" },
  { area: "first_aid", label: "First Aid" },
  { area: "recording_standards", label: "Recording Standards" },
  { area: "communication_skills", label: "Communication Skills" },
  { area: "key_working", label: "Key Working" },
  { area: "behaviour_management", label: "Behaviour Management" },
  { area: "health_and_safety", label: "Health & Safety" },
  { area: "other", label: "Other" },
];

export const ASSESSMENT_METHODS: { method: AssessmentMethod; label: string }[] = [
  { method: "direct_observation", label: "Direct Observation" },
  { method: "knowledge_test", label: "Knowledge Test" },
  { method: "practical_demonstration", label: "Practical Demonstration" },
  { method: "case_study", label: "Case Study" },
  { method: "supervision_discussion", label: "Supervision Discussion" },
  { method: "peer_review", label: "Peer Review" },
  { method: "self_assessment", label: "Self-Assessment" },
  { method: "portfolio_review", label: "Portfolio Review" },
  { method: "scenario_exercise", label: "Scenario Exercise" },
  { method: "other", label: "Other" },
];

export const COMPETENCY_RATINGS: { rating: CompetencyRating; label: string }[] = [
  { rating: "exceeds_expectations", label: "Exceeds Expectations" },
  { rating: "meets_expectations", label: "Meets Expectations" },
  { rating: "developing", label: "Developing" },
  { rating: "below_expectations", label: "Below Expectations" },
  { rating: "not_yet_competent", label: "Not Yet Competent" },
];

export const ACTIONS_REQUIRED: { action: ActionRequired; label: string }[] = [
  { action: "none", label: "None" },
  { action: "additional_training", label: "Additional Training" },
  { action: "mentoring", label: "Mentoring" },
  { action: "supervised_practice", label: "Supervised Practice" },
  { action: "reassessment", label: "Reassessment" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffCompetencyMetrics(
  records: StaffCompetencyAssessmentRecord[],
): {
  total_assessments: number;
  exceeds_count: number;
  meets_count: number;
  developing_count: number;
  below_count: number;
  not_competent_count: number;
  competency_maintained_rate: number;
  theory_demonstrated_rate: number;
  practical_demonstrated_rate: number;
  reflective_practice_rate: number;
  values_aligned_rate: number;
  child_centred_rate: number;
  evidence_documented_rate: number;
  development_plan_rate: number;
  staff_agreed_rate: number;
  follow_up_set_rate: number;
  action_required_count: number;
  unique_staff: number;
  by_competency_area: Record<string, number>;
  by_assessment_method: Record<string, number>;
  by_competency_rating: Record<string, number>;
  by_action_required: Record<string, number>;
} {
  const exceeds = records.filter((r) => r.competency_rating === "exceeds_expectations").length;
  const meets = records.filter((r) => r.competency_rating === "meets_expectations").length;
  const developing = records.filter((r) => r.competency_rating === "developing").length;
  const below = records.filter((r) => r.competency_rating === "below_expectations").length;
  const notCompetent = records.filter((r) => r.competency_rating === "not_yet_competent").length;

  const boolRate = (field: keyof StaffCompetencyAssessmentRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const actionRequired = records.filter((r) => r.action_required !== "none").length;
  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.competency_area] = (byArea[r.competency_area] ?? 0) + 1;

  const byMethod: Record<string, number> = {};
  for (const r of records) byMethod[r.assessment_method] = (byMethod[r.assessment_method] ?? 0) + 1;

  const byRating: Record<string, number> = {};
  for (const r of records) byRating[r.competency_rating] = (byRating[r.competency_rating] ?? 0) + 1;

  const byAction: Record<string, number> = {};
  for (const r of records) byAction[r.action_required] = (byAction[r.action_required] ?? 0) + 1;

  return {
    total_assessments: records.length,
    exceeds_count: exceeds,
    meets_count: meets,
    developing_count: developing,
    below_count: below,
    not_competent_count: notCompetent,
    competency_maintained_rate: boolRate("competency_maintained"),
    theory_demonstrated_rate: boolRate("theory_demonstrated"),
    practical_demonstrated_rate: boolRate("practical_demonstrated"),
    reflective_practice_rate: boolRate("reflective_practice_shown"),
    values_aligned_rate: boolRate("values_aligned"),
    child_centred_rate: boolRate("child_centred_approach"),
    evidence_documented_rate: boolRate("evidence_documented"),
    development_plan_rate: boolRate("development_plan_updated"),
    staff_agreed_rate: boolRate("staff_agreed_outcome"),
    follow_up_set_rate: boolRate("follow_up_date_set"),
    action_required_count: actionRequired,
    unique_staff: uniqueStaff,
    by_competency_area: byArea,
    by_assessment_method: byMethod,
    by_competency_rating: byRating,
    by_action_required: byAction,
  };
}

export function identifyStaffCompetencyAlerts(
  records: StaffCompetencyAssessmentRecord[],
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

  // Not yet competent in medication
  for (const r of records) {
    if (r.competency_area === "medication_administration" && r.competency_rating === "not_yet_competent") {
      alerts.push({
        type: "medication_not_competent",
        severity: "critical",
        message: `${r.staff_name} not yet competent in medication administration on ${r.assessment_date} — remove from medication duties immediately`,
        id: r.id,
      });
    }
  }

  // Below expectations count
  const belowExpect = records.filter(
    (r) => r.competency_rating === "below_expectations" || r.competency_rating === "not_yet_competent",
  ).length;
  if (belowExpect >= 1) {
    alerts.push({
      type: "below_expectations",
      severity: "high",
      message: `${belowExpect} ${belowExpect === 1 ? "assessment is" : "assessments are"} below expectations — review development plans`,
      id: "below_expectations",
    });
  }

  // Evidence not documented
  const noEvidence = records.filter((r) => !r.evidence_documented).length;
  if (noEvidence >= 2) {
    alerts.push({
      type: "evidence_not_documented",
      severity: "high",
      message: `${noEvidence} assessments without evidence documented — maintain competency records`,
      id: "evidence_not_documented",
    });
  }

  // Development plan not updated
  const noPlan = records.filter((r) => !r.development_plan_updated).length;
  if (noPlan >= 3) {
    alerts.push({
      type: "development_plan_not_updated",
      severity: "medium",
      message: `${noPlan} assessments without development plan updated — review staff development`,
      id: "development_plan_not_updated",
    });
  }

  // Staff did not agree outcome
  const noAgreed = records.filter((r) => !r.staff_agreed_outcome).length;
  if (noAgreed >= 2) {
    alerts.push({
      type: "staff_not_agreed",
      severity: "medium",
      message: `${noAgreed} assessments where staff did not agree outcome — review assessment process`,
      id: "staff_not_agreed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    competencyArea?: CompetencyArea;
    assessmentMethod?: AssessmentMethod;
    competencyRating?: CompetencyRating;
    actionRequired?: ActionRequired;
    limit?: number;
  },
): Promise<ServiceResult<StaffCompetencyAssessmentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_competency_assessments") as SB).select("*").eq("home_id", homeId);
  if (filters?.competencyArea) q = q.eq("competency_area", filters.competencyArea);
  if (filters?.assessmentMethod) q = q.eq("assessment_method", filters.assessmentMethod);
  if (filters?.competencyRating) q = q.eq("competency_rating", filters.competencyRating);
  if (filters?.actionRequired) q = q.eq("action_required", filters.actionRequired);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    competencyArea: CompetencyArea;
    assessmentMethod: AssessmentMethod;
    competencyRating: CompetencyRating;
    actionRequired: ActionRequired;
    assessmentDate: string;
    staffName: string;
    staffRole: string;
    assessorName: string;
    theoryDemonstrated?: boolean;
    practicalDemonstrated?: boolean;
    reflectivePracticeShown?: boolean;
    valuesAligned?: boolean;
    childCentredApproach?: boolean;
    evidenceDocumented?: boolean;
    developmentPlanUpdated?: boolean;
    staffAgreedOutcome?: boolean;
    followUpDateSet?: boolean;
    competencyMaintained?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextAssessmentDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffCompetencyAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_competency_assessments") as SB)
    .insert({
      home_id: payload.homeId,
      competency_area: payload.competencyArea,
      assessment_method: payload.assessmentMethod,
      competency_rating: payload.competencyRating,
      action_required: payload.actionRequired,
      assessment_date: payload.assessmentDate,
      staff_name: payload.staffName,
      staff_role: payload.staffRole,
      assessor_name: payload.assessorName,
      theory_demonstrated: payload.theoryDemonstrated ?? false,
      practical_demonstrated: payload.practicalDemonstrated ?? false,
      reflective_practice_shown: payload.reflectivePracticeShown ?? false,
      values_aligned: payload.valuesAligned ?? false,
      child_centred_approach: payload.childCentredApproach ?? false,
      evidence_documented: payload.evidenceDocumented ?? false,
      development_plan_updated: payload.developmentPlanUpdated ?? false,
      staff_agreed_outcome: payload.staffAgreedOutcome ?? false,
      follow_up_date_set: payload.followUpDateSet ?? false,
      competency_maintained: payload.competencyMaintained ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_assessment_date: payload.nextAssessmentDate ?? null,
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
    competencyArea: CompetencyArea;
    assessmentMethod: AssessmentMethod;
    competencyRating: CompetencyRating;
    actionRequired: ActionRequired;
    assessmentDate: string;
    staffName: string;
    staffRole: string;
    assessorName: string;
    theoryDemonstrated: boolean;
    practicalDemonstrated: boolean;
    reflectivePracticeShown: boolean;
    valuesAligned: boolean;
    childCentredApproach: boolean;
    evidenceDocumented: boolean;
    developmentPlanUpdated: boolean;
    staffAgreedOutcome: boolean;
    followUpDateSet: boolean;
    competencyMaintained: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextAssessmentDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffCompetencyAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.competencyArea !== undefined) mapped.competency_area = updates.competencyArea;
  if (updates.assessmentMethod !== undefined) mapped.assessment_method = updates.assessmentMethod;
  if (updates.competencyRating !== undefined) mapped.competency_rating = updates.competencyRating;
  if (updates.actionRequired !== undefined) mapped.action_required = updates.actionRequired;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.staffRole !== undefined) mapped.staff_role = updates.staffRole;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.theoryDemonstrated !== undefined) mapped.theory_demonstrated = updates.theoryDemonstrated;
  if (updates.practicalDemonstrated !== undefined) mapped.practical_demonstrated = updates.practicalDemonstrated;
  if (updates.reflectivePracticeShown !== undefined) mapped.reflective_practice_shown = updates.reflectivePracticeShown;
  if (updates.valuesAligned !== undefined) mapped.values_aligned = updates.valuesAligned;
  if (updates.childCentredApproach !== undefined) mapped.child_centred_approach = updates.childCentredApproach;
  if (updates.evidenceDocumented !== undefined) mapped.evidence_documented = updates.evidenceDocumented;
  if (updates.developmentPlanUpdated !== undefined) mapped.development_plan_updated = updates.developmentPlanUpdated;
  if (updates.staffAgreedOutcome !== undefined) mapped.staff_agreed_outcome = updates.staffAgreedOutcome;
  if (updates.followUpDateSet !== undefined) mapped.follow_up_date_set = updates.followUpDateSet;
  if (updates.competencyMaintained !== undefined) mapped.competency_maintained = updates.competencyMaintained;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextAssessmentDate !== undefined) mapped.next_assessment_date = updates.nextAssessmentDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_competency_assessments") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffCompetencyMetrics,
  identifyStaffCompetencyAlerts,
};
