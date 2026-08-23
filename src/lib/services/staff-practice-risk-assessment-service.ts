// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PRACTICE RISK ASSESSMENT SERVICE
// Protective, not punitive. Creates staff-specific practice risk assessments
// where concerns exist around lone working, medication, driving, allegations,
// boundaries, conflict with children, repeated errors, emotional resilience,
// unsafe practice, stress-related sickness, or team conflict.
//
// CRITICAL PRINCIPLES:
// — Not punitive — protective
// — Strengths-based, fair, contextual, evidence-led
// — Cara suggests. Humans decide. Cara evidences.
// — Every insight includes evidence source, confidence, context,
//   alternative explanations, manager approval, staff right to comment
//
// CHR 2015 Reg 13 (leadership), Reg 33 (employment of staff),
// Reg 34 (fitness of workers), Reg 35 (supervision and training).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type RiskArea =
  | "lone_working"
  | "medication"
  | "driving"
  | "allegations"
  | "boundaries"
  | "child_conflict"
  | "repeated_errors"
  | "emotional_resilience"
  | "unsafe_practice"
  | "stress_sickness";

export type Likelihood =
  | "very_unlikely"
  | "unlikely"
  | "possible"
  | "likely"
  | "very_likely";

export type ImpactSeverity =
  | "minimal"
  | "minor"
  | "moderate"
  | "major"
  | "severe";

export type AssessmentStatus =
  | "draft"
  | "active"
  | "under_review"
  | "closed"
  | "superseded";

export interface StaffPracticeRiskAssessmentRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  risk_area: RiskArea;
  likelihood: Likelihood;
  impact_severity: ImpactSeverity;
  assessment_status: AssessmentStatus;
  session_date: string;
  assessed_by: string;
  identified_concern: string;
  evidence_summary: string;
  children_affected: string | null;
  protective_factors: string | null;
  support_controls: string | null;
  management_controls: string | null;
  restrictions: string | null;
  decision_rationale: string | null;
  staff_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  evidence_verified: boolean;
  staff_notified: boolean;
  staff_commented: boolean;
  protective_factors_identified: boolean;
  support_controls_set: boolean;
  management_controls_set: boolean;
  review_date_set: boolean;
  approved_by_senior: boolean;
  children_safeguarded: boolean;
  alternative_explanations_considered: boolean;
  proportionate_response: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

export const RISK_AREAS: { area: RiskArea; label: string }[] = [
  { area: "lone_working", label: "Lone Working" },
  { area: "medication", label: "Medication" },
  { area: "driving", label: "Driving" },
  { area: "allegations", label: "Allegations" },
  { area: "boundaries", label: "Boundaries" },
  { area: "child_conflict", label: "Child Conflict" },
  { area: "repeated_errors", label: "Repeated Errors" },
  { area: "emotional_resilience", label: "Emotional Resilience" },
  { area: "unsafe_practice", label: "Unsafe Practice" },
  { area: "stress_sickness", label: "Stress-Related Sickness" },
];

export const LIKELIHOODS: { likelihood: Likelihood; label: string }[] = [
  { likelihood: "very_unlikely", label: "Very Unlikely" },
  { likelihood: "unlikely", label: "Unlikely" },
  { likelihood: "possible", label: "Possible" },
  { likelihood: "likely", label: "Likely" },
  { likelihood: "very_likely", label: "Very Likely" },
];

export const IMPACT_SEVERITIES: { severity: ImpactSeverity; label: string }[] = [
  { severity: "minimal", label: "Minimal" },
  { severity: "minor", label: "Minor" },
  { severity: "moderate", label: "Moderate" },
  { severity: "major", label: "Major" },
  { severity: "severe", label: "Severe" },
];

export const ASSESSMENT_STATUSES: { status: AssessmentStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "active", label: "Active" },
  { status: "under_review", label: "Under Review" },
  { status: "closed", label: "Closed" },
  { status: "superseded", label: "Superseded" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computePracticeRiskMetrics(records: StaffPracticeRiskAssessmentRecord[]): {
  total_assessments: number;
  high_risk_count: number;
  severe_impact_count: number;
  active_count: number;
  unapproved_count: number;
  evidence_verified_rate: number | null;
  staff_notified_rate: number | null;
  staff_commented_rate: number | null;
  protective_factors_rate: number | null;
  support_controls_rate: number | null;
  management_controls_rate: number | null;
  review_date_rate: number | null;
  approved_rate: number | null;
  children_safeguarded_rate: number | null;
  alternatives_considered_rate: number | null;
  proportionate_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_risk_area: Record<string, number>;
  by_likelihood: Record<string, number>;
  by_impact_severity: Record<string, number>;
  by_assessment_status: Record<string, number>;
} {
  const highRisk = records.filter((r) => r.likelihood === "likely" || r.likelihood === "very_likely").length;
  const severeImpact = records.filter((r) => r.impact_severity === "major" || r.impact_severity === "severe").length;
  const active = records.filter((r) => r.assessment_status === "active").length;
  const unapproved = records.filter((r) => r.approved_by_senior === false).length;

  const boolRate = (field: keyof StaffPracticeRiskAssessmentRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.risk_area] = (byArea[r.risk_area] ?? 0) + 1;

  const byLikelihood: Record<string, number> = {};
  for (const r of records) byLikelihood[r.likelihood] = (byLikelihood[r.likelihood] ?? 0) + 1;

  const byImpact: Record<string, number> = {};
  for (const r of records) byImpact[r.impact_severity] = (byImpact[r.impact_severity] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.assessment_status] = (byStatus[r.assessment_status] ?? 0) + 1;

  return {
    total_assessments: records.length,
    high_risk_count: highRisk,
    severe_impact_count: severeImpact,
    active_count: active,
    unapproved_count: unapproved,
    evidence_verified_rate: boolRate("evidence_verified"),
    staff_notified_rate: boolRate("staff_notified"),
    staff_commented_rate: boolRate("staff_commented"),
    protective_factors_rate: boolRate("protective_factors_identified"),
    support_controls_rate: boolRate("support_controls_set"),
    management_controls_rate: boolRate("management_controls_set"),
    review_date_rate: boolRate("review_date_set"),
    approved_rate: boolRate("approved_by_senior"),
    children_safeguarded_rate: boolRate("children_safeguarded"),
    alternatives_considered_rate: boolRate("alternative_explanations_considered"),
    proportionate_rate: boolRate("proportionate_response"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: new Set(records.map((r) => r.staff_name)).size,
    by_risk_area: byArea,
    by_likelihood: byLikelihood,
    by_impact_severity: byImpact,
    by_assessment_status: byStatus,
  };
}

// ── Alerts ──────────────────────────────────────────────────────────────

export interface PracticeRiskAlert {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}

export function identifyPracticeRiskAlerts(records: StaffPracticeRiskAssessmentRecord[]): PracticeRiskAlert[] {
  const alerts: PracticeRiskAlert[] = [];

  // Critical: high likelihood + severe impact (per-record)
  for (const r of records) {
    if (
      (r.likelihood === "likely" || r.likelihood === "very_likely") &&
      (r.impact_severity === "major" || r.impact_severity === "severe")
    ) {
      alerts.push({
        type: "high_risk_severe_impact",
        severity: "critical",
        message: `${r.staff_name} has a high-likelihood, severe-impact practice risk in ${r.risk_area.replace(/_/g, " ")} — immediate review required.`,
        record_id: r.id,
      });
    }
  }

  // High: staff not notified (>= 1)
  const noNotified = records.filter((r) => r.staff_notified === false).length;
  if (noNotified > 0) {
    alerts.push({
      type: "staff_not_notified",
      severity: "high",
      message: `${noNotified} assessment${noNotified === 1 ? " has" : "s have"} staff not yet notified.`,
    });
  }

  // High: children not safeguarded (>= 1)
  const noSafeguarded = records.filter((r) => r.children_safeguarded === false).length;
  if (noSafeguarded > 0) {
    alerts.push({
      type: "children_not_safeguarded",
      severity: "high",
      message: `${noSafeguarded} assessment${noSafeguarded === 1 ? " has" : "s have"} children safeguarding not confirmed.`,
    });
  }

  // Medium: no protective factors (>= 2)
  const noProtective = records.filter((r) => r.protective_factors_identified === false).length;
  if (noProtective >= 2) {
    alerts.push({
      type: "no_protective_factors",
      severity: "medium",
      message: `${noProtective} assessments have no protective factors identified.`,
    });
  }

  // Medium: not proportionate (>= 2)
  const notProportionate = records.filter((r) => r.proportionate_response === false).length;
  if (notProportionate >= 2) {
    alerts.push({
      type: "not_proportionate",
      severity: "medium",
      message: `${notProportionate} assessments have proportionality not confirmed.`,
    });
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────

export async function listPracticeRiskAssessments(
  homeId: string,
): Promise<ServiceResult<StaffPracticeRiskAssessmentRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_practice_risk_assessments") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffPracticeRiskAssessmentRecord[] };
}

export async function createPracticeRiskAssessment(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  riskArea: RiskArea;
  likelihood: Likelihood;
  impactSeverity: ImpactSeverity;
  assessmentStatus: AssessmentStatus;
  sessionDate: string;
  assessedBy: string;
  identifiedConcern: string;
  evidenceSummary: string;
  childrenAffected?: string | null;
  protectiveFactors?: string | null;
  supportControls?: string | null;
  managementControls?: string | null;
  restrictions?: string | null;
  decisionRationale?: string | null;
  staffComment?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  evidenceVerified: boolean;
  staffNotified: boolean;
  staffCommented: boolean;
  protectiveFactorsIdentified: boolean;
  supportControlsSet: boolean;
  managementControlsSet: boolean;
  reviewDateSet: boolean;
  approvedBySenior: boolean;
  childrenSafeguarded: boolean;
  alternativeExplanationsConsidered: boolean;
  proportionateResponse: boolean;
  recordedPromptly: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffPracticeRiskAssessmentRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_practice_risk_assessments") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      risk_area: input.riskArea,
      likelihood: input.likelihood,
      impact_severity: input.impactSeverity,
      assessment_status: input.assessmentStatus,
      session_date: input.sessionDate,
      assessed_by: input.assessedBy,
      identified_concern: input.identifiedConcern,
      evidence_summary: input.evidenceSummary,
      children_affected: input.childrenAffected ?? null,
      protective_factors: input.protectiveFactors ?? null,
      support_controls: input.supportControls ?? null,
      management_controls: input.managementControls ?? null,
      restrictions: input.restrictions ?? null,
      decision_rationale: input.decisionRationale ?? null,
      staff_comment: input.staffComment ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      evidence_verified: input.evidenceVerified,
      staff_notified: input.staffNotified,
      staff_commented: input.staffCommented,
      protective_factors_identified: input.protectiveFactorsIdentified,
      support_controls_set: input.supportControlsSet,
      management_controls_set: input.managementControlsSet,
      review_date_set: input.reviewDateSet,
      approved_by_senior: input.approvedBySenior,
      children_safeguarded: input.childrenSafeguarded,
      alternative_explanations_considered: input.alternativeExplanationsConsidered,
      proportionate_response: input.proportionateResponse,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffPracticeRiskAssessmentRecord };
}

export async function updatePracticeRiskAssessment(
  id: string,
  updates: Partial<Omit<StaffPracticeRiskAssessmentRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffPracticeRiskAssessmentRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_practice_risk_assessments") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffPracticeRiskAssessmentRecord };
}

// ── Testing export ─────────────────────────────────────────────────────

export const _testing = { computePracticeRiskMetrics, identifyPracticeRiskAlerts };
