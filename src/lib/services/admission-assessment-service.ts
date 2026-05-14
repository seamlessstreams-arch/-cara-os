// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADMISSION ASSESSMENT SERVICE
// Tracks pre-admission assessments, matching evaluations, and initial
// placement reviews for children entering residential care.
// CHR 2015 Reg 14 (the care planning standard — placement plan),
// Reg 36 (fitness of premises — suitability for child),
// Reg 5 (engaging with the wider system — matching).
//
// Covers: impact risk assessments, matching criteria evaluation,
// pre-admission visits, initial care planning, and suitability
// determinations.
//
// SCCIF: Leadership — "Admissions are well planned."
// "Matching considers the needs of existing residents."
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

export type AssessmentStage =
  | "pre_referral_screening"
  | "referral_received"
  | "initial_assessment"
  | "matching_review"
  | "pre_admission_visit"
  | "panel_decision"
  | "admission_day"
  | "72_hour_review"
  | "initial_care_plan"
  | "other";

export type SuitabilityDecision =
  | "suitable"
  | "suitable_with_conditions"
  | "unsuitable"
  | "further_assessment"
  | "pending";

export type MatchingOutcome =
  | "excellent_match"
  | "good_match"
  | "acceptable_match"
  | "poor_match"
  | "not_assessed";

export type ReferralSource =
  | "local_authority"
  | "other_provider"
  | "emergency_placement"
  | "court_directed"
  | "step_down"
  | "step_up"
  | "sibling_placement"
  | "parent_request"
  | "secure_transfer"
  | "other";

export interface AdmissionAssessmentRecord {
  id: string;
  home_id: string;
  assessment_stage: AssessmentStage;
  suitability_decision: SuitabilityDecision;
  matching_outcome: MatchingOutcome;
  referral_source: ReferralSource;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  placing_authority: string;
  impact_risk_completed: boolean;
  matching_criteria_met: boolean;
  existing_children_consulted: boolean;
  pre_admission_visit_completed: boolean;
  care_plan_received: boolean;
  health_assessment_available: boolean;
  education_info_received: boolean;
  risk_assessments_reviewed: boolean;
  safeguarding_info_shared: boolean;
  placement_plan_agreed: boolean;
  key_worker_allocated: boolean;
  bedroom_prepared: boolean;
  issues_found: string[];
  actions_taken: string[];
  assessed_by: string;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ASSESSMENT_STAGES: { stage: AssessmentStage; label: string }[] = [
  { stage: "pre_referral_screening", label: "Pre-Referral Screening" },
  { stage: "referral_received", label: "Referral Received" },
  { stage: "initial_assessment", label: "Initial Assessment" },
  { stage: "matching_review", label: "Matching Review" },
  { stage: "pre_admission_visit", label: "Pre-Admission Visit" },
  { stage: "panel_decision", label: "Panel Decision" },
  { stage: "admission_day", label: "Admission Day" },
  { stage: "72_hour_review", label: "72-Hour Review" },
  { stage: "initial_care_plan", label: "Initial Care Plan" },
  { stage: "other", label: "Other" },
];

export const SUITABILITY_DECISIONS: { decision: SuitabilityDecision; label: string }[] = [
  { decision: "suitable", label: "Suitable" },
  { decision: "suitable_with_conditions", label: "Suitable with Conditions" },
  { decision: "unsuitable", label: "Unsuitable" },
  { decision: "further_assessment", label: "Further Assessment" },
  { decision: "pending", label: "Pending" },
];

export const MATCHING_OUTCOMES: { outcome: MatchingOutcome; label: string }[] = [
  { outcome: "excellent_match", label: "Excellent Match" },
  { outcome: "good_match", label: "Good Match" },
  { outcome: "acceptable_match", label: "Acceptable Match" },
  { outcome: "poor_match", label: "Poor Match" },
  { outcome: "not_assessed", label: "Not Assessed" },
];

export const REFERRAL_SOURCES: { source: ReferralSource; label: string }[] = [
  { source: "local_authority", label: "Local Authority" },
  { source: "other_provider", label: "Other Provider" },
  { source: "emergency_placement", label: "Emergency Placement" },
  { source: "court_directed", label: "Court Directed" },
  { source: "step_down", label: "Step Down" },
  { source: "step_up", label: "Step Up" },
  { source: "sibling_placement", label: "Sibling Placement" },
  { source: "parent_request", label: "Parent Request" },
  { source: "secure_transfer", label: "Secure Transfer" },
  { source: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeAdmissionAssessmentMetrics(
  records: AdmissionAssessmentRecord[],
): {
  total_assessments: number;
  suitable_count: number;
  unsuitable_count: number;
  pending_count: number;
  excellent_match_count: number;
  poor_match_count: number;
  impact_risk_rate: number;
  matching_criteria_rate: number;
  existing_children_consulted_rate: number;
  pre_admission_visit_rate: number;
  care_plan_received_rate: number;
  health_assessment_rate: number;
  education_info_rate: number;
  risk_assessments_rate: number;
  safeguarding_shared_rate: number;
  placement_plan_rate: number;
  key_worker_rate: number;
  bedroom_prepared_rate: number;
  unique_children: number;
  by_assessment_stage: Record<string, number>;
  by_suitability_decision: Record<string, number>;
  by_matching_outcome: Record<string, number>;
  by_referral_source: Record<string, number>;
} {
  const suitable = records.filter((r) => r.suitability_decision === "suitable").length;
  const unsuitable = records.filter((r) => r.suitability_decision === "unsuitable").length;
  const pending = records.filter((r) => r.suitability_decision === "pending").length;
  const excellentMatch = records.filter((r) => r.matching_outcome === "excellent_match").length;
  const poorMatch = records.filter((r) => r.matching_outcome === "poor_match").length;

  const boolRate = (field: keyof AdmissionAssessmentRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byStage: Record<string, number> = {};
  for (const r of records) byStage[r.assessment_stage] = (byStage[r.assessment_stage] ?? 0) + 1;

  const byDecision: Record<string, number> = {};
  for (const r of records) byDecision[r.suitability_decision] = (byDecision[r.suitability_decision] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.matching_outcome] = (byOutcome[r.matching_outcome] ?? 0) + 1;

  const bySource: Record<string, number> = {};
  for (const r of records) bySource[r.referral_source] = (bySource[r.referral_source] ?? 0) + 1;

  return {
    total_assessments: records.length,
    suitable_count: suitable,
    unsuitable_count: unsuitable,
    pending_count: pending,
    excellent_match_count: excellentMatch,
    poor_match_count: poorMatch,
    impact_risk_rate: boolRate("impact_risk_completed"),
    matching_criteria_rate: boolRate("matching_criteria_met"),
    existing_children_consulted_rate: boolRate("existing_children_consulted"),
    pre_admission_visit_rate: boolRate("pre_admission_visit_completed"),
    care_plan_received_rate: boolRate("care_plan_received"),
    health_assessment_rate: boolRate("health_assessment_available"),
    education_info_rate: boolRate("education_info_received"),
    risk_assessments_rate: boolRate("risk_assessments_reviewed"),
    safeguarding_shared_rate: boolRate("safeguarding_info_shared"),
    placement_plan_rate: boolRate("placement_plan_agreed"),
    key_worker_rate: boolRate("key_worker_allocated"),
    bedroom_prepared_rate: boolRate("bedroom_prepared"),
    unique_children: uniqueChildren,
    by_assessment_stage: byStage,
    by_suitability_decision: byDecision,
    by_matching_outcome: byOutcome,
    by_referral_source: bySource,
  };
}

export function identifyAdmissionAssessmentAlerts(
  records: AdmissionAssessmentRecord[],
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

  // Poor match admitted
  for (const r of records) {
    if (r.matching_outcome === "poor_match" && r.suitability_decision === "suitable") {
      alerts.push({
        type: "poor_match_admitted",
        severity: "critical",
        message: `Poor match for ${r.child_name} assessed as suitable on ${r.assessment_date} — review matching decision`,
        id: r.id,
      });
    }
  }

  // Impact risk not completed
  const noImpact = records.filter((r) => !r.impact_risk_completed).length;
  if (noImpact >= 1) {
    alerts.push({
      type: "impact_risk_incomplete",
      severity: "high",
      message: `${noImpact} ${noImpact === 1 ? "assessment has" : "assessments have"} no impact risk assessment — complete before admission`,
      id: "impact_risk_incomplete",
    });
  }

  // Existing children not consulted
  const noConsult = records.filter((r) => !r.existing_children_consulted).length;
  if (noConsult >= 1) {
    alerts.push({
      type: "children_not_consulted",
      severity: "high",
      message: `${noConsult} ${noConsult === 1 ? "assessment has" : "assessments have"} existing children not consulted — review participation`,
      id: "children_not_consulted",
    });
  }

  // Care plan not received
  const noPlan = records.filter((r) => !r.care_plan_received).length;
  if (noPlan >= 2) {
    alerts.push({
      type: "care_plan_missing",
      severity: "medium",
      message: `${noPlan} admissions without care plan received — request from placing authority`,
      id: "care_plan_missing",
    });
  }

  // Key worker not allocated
  const noKeyWorker = records.filter((r) => !r.key_worker_allocated).length;
  if (noKeyWorker >= 2) {
    alerts.push({
      type: "key_worker_not_allocated",
      severity: "medium",
      message: `${noKeyWorker} admissions without key worker allocated — assign promptly`,
      id: "key_worker_not_allocated",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    assessmentStage?: AssessmentStage;
    suitabilityDecision?: SuitabilityDecision;
    matchingOutcome?: MatchingOutcome;
    referralSource?: ReferralSource;
    limit?: number;
  },
): Promise<ServiceResult<AdmissionAssessmentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_admission_assessments") as SB).select("*").eq("home_id", homeId);
  if (filters?.assessmentStage) q = q.eq("assessment_stage", filters.assessmentStage);
  if (filters?.suitabilityDecision) q = q.eq("suitability_decision", filters.suitabilityDecision);
  if (filters?.matchingOutcome) q = q.eq("matching_outcome", filters.matchingOutcome);
  if (filters?.referralSource) q = q.eq("referral_source", filters.referralSource);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    assessmentStage: AssessmentStage;
    suitabilityDecision: SuitabilityDecision;
    matchingOutcome: MatchingOutcome;
    referralSource: ReferralSource;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    placingAuthority: string;
    impactRiskCompleted?: boolean;
    matchingCriteriaMet?: boolean;
    existingChildrenConsulted?: boolean;
    preAdmissionVisitCompleted?: boolean;
    carePlanReceived?: boolean;
    healthAssessmentAvailable?: boolean;
    educationInfoReceived?: boolean;
    riskAssessmentsReviewed?: boolean;
    safeguardingInfoShared?: boolean;
    placementPlanAgreed?: boolean;
    keyWorkerAllocated?: boolean;
    bedroomPrepared?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    assessedBy: string;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<AdmissionAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_admission_assessments") as SB)
    .insert({
      home_id: payload.homeId,
      assessment_stage: payload.assessmentStage,
      suitability_decision: payload.suitabilityDecision,
      matching_outcome: payload.matchingOutcome,
      referral_source: payload.referralSource,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      placing_authority: payload.placingAuthority,
      impact_risk_completed: payload.impactRiskCompleted ?? false,
      matching_criteria_met: payload.matchingCriteriaMet ?? false,
      existing_children_consulted: payload.existingChildrenConsulted ?? false,
      pre_admission_visit_completed: payload.preAdmissionVisitCompleted ?? false,
      care_plan_received: payload.carePlanReceived ?? false,
      health_assessment_available: payload.healthAssessmentAvailable ?? false,
      education_info_received: payload.educationInfoReceived ?? false,
      risk_assessments_reviewed: payload.riskAssessmentsReviewed ?? false,
      safeguarding_info_shared: payload.safeguardingInfoShared ?? false,
      placement_plan_agreed: payload.placementPlanAgreed ?? false,
      key_worker_allocated: payload.keyWorkerAllocated ?? false,
      bedroom_prepared: payload.bedroomPrepared ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      assessed_by: payload.assessedBy,
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
    assessmentStage: AssessmentStage;
    suitabilityDecision: SuitabilityDecision;
    matchingOutcome: MatchingOutcome;
    referralSource: ReferralSource;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    placingAuthority: string;
    impactRiskCompleted: boolean;
    matchingCriteriaMet: boolean;
    existingChildrenConsulted: boolean;
    preAdmissionVisitCompleted: boolean;
    carePlanReceived: boolean;
    healthAssessmentAvailable: boolean;
    educationInfoReceived: boolean;
    riskAssessmentsReviewed: boolean;
    safeguardingInfoShared: boolean;
    placementPlanAgreed: boolean;
    keyWorkerAllocated: boolean;
    bedroomPrepared: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    assessedBy: string;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<AdmissionAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.assessmentStage !== undefined) mapped.assessment_stage = updates.assessmentStage;
  if (updates.suitabilityDecision !== undefined) mapped.suitability_decision = updates.suitabilityDecision;
  if (updates.matchingOutcome !== undefined) mapped.matching_outcome = updates.matchingOutcome;
  if (updates.referralSource !== undefined) mapped.referral_source = updates.referralSource;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.placingAuthority !== undefined) mapped.placing_authority = updates.placingAuthority;
  if (updates.impactRiskCompleted !== undefined) mapped.impact_risk_completed = updates.impactRiskCompleted;
  if (updates.matchingCriteriaMet !== undefined) mapped.matching_criteria_met = updates.matchingCriteriaMet;
  if (updates.existingChildrenConsulted !== undefined) mapped.existing_children_consulted = updates.existingChildrenConsulted;
  if (updates.preAdmissionVisitCompleted !== undefined) mapped.pre_admission_visit_completed = updates.preAdmissionVisitCompleted;
  if (updates.carePlanReceived !== undefined) mapped.care_plan_received = updates.carePlanReceived;
  if (updates.healthAssessmentAvailable !== undefined) mapped.health_assessment_available = updates.healthAssessmentAvailable;
  if (updates.educationInfoReceived !== undefined) mapped.education_info_received = updates.educationInfoReceived;
  if (updates.riskAssessmentsReviewed !== undefined) mapped.risk_assessments_reviewed = updates.riskAssessmentsReviewed;
  if (updates.safeguardingInfoShared !== undefined) mapped.safeguarding_info_shared = updates.safeguardingInfoShared;
  if (updates.placementPlanAgreed !== undefined) mapped.placement_plan_agreed = updates.placementPlanAgreed;
  if (updates.keyWorkerAllocated !== undefined) mapped.key_worker_allocated = updates.keyWorkerAllocated;
  if (updates.bedroomPrepared !== undefined) mapped.bedroom_prepared = updates.bedroomPrepared;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_admission_assessments") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAdmissionAssessmentMetrics,
  identifyAdmissionAssessmentAlerts,
};
