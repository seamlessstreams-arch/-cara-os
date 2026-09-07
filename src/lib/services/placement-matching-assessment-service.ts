// ══════════════════════════════════════════════════════════════════════════════
// CARA — PLACEMENT MATCHING ASSESSMENT SERVICE
// Structured assessment of how well a child's placement matches their needs —
// considering peer dynamics, location, education access, specialist provision,
// cultural match, and the capacity of the home to meet the child's specific needs.
// CHR 2015 Reg 12 (the protection of children),
// Reg 5 (quality and purpose of care),
// Reg 14 (care planning).
//
// SCCIF: "Matching of children is well considered."
// "The impact of a new admission on existing children is assessed."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type MatchingDomain =
  | "peer_dynamics"
  | "location_access"
  | "education_provision"
  | "health_provision"
  | "cultural_match"
  | "identity_needs"
  | "risk_compatibility"
  | "staff_skills_match"
  | "family_contact"
  | "other";

export type MatchQuality =
  | "excellent_match"
  | "good_match"
  | "adequate_match"
  | "poor_match"
  | "unsuitable";

export type AssessmentTiming =
  | "pre_admission"
  | "72_hour_review"
  | "2_week_review"
  | "monthly_review"
  | "quarterly_review"
  | "triggered_review"
  | "annual_review"
  | "disruption_review"
  | "transition_review"
  | "other";

export type ImpactLevel =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

export interface PlacementMatchingAssessmentRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  matching_domain: MatchingDomain;
  match_quality: MatchQuality;
  assessment_timing: AssessmentTiming;
  impact_level: ImpactLevel;
  session_date: string;
  assessed_by: string;
  matching_rationale: string;
  evidence_summary: string;
  peer_group_analysis: string | null;
  risk_assessment_summary: string | null;
  child_views_on_placement: string | null;
  existing_children_views: string | null;
  staff_views: string | null;
  improvements_needed: string | null;
  contingency_plan: string | null;
  escalation_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  next_review_date: string | null;
  notes: string | null;
  child_views_sought: boolean;
  existing_children_consulted: boolean;
  staff_consulted: boolean;
  risk_assessment_completed: boolean;
  impact_on_others_assessed: boolean;
  cultural_needs_considered: boolean;
  education_access_confirmed: boolean;
  health_access_confirmed: boolean;
  family_contact_feasible: boolean;
  matching_panel_agreed: boolean;
  contingency_planned: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MATCHING_DOMAINS: { domain: MatchingDomain; label: string }[] = [
  { domain: "peer_dynamics", label: "Peer Dynamics" },
  { domain: "location_access", label: "Location Access" },
  { domain: "education_provision", label: "Education Provision" },
  { domain: "health_provision", label: "Health Provision" },
  { domain: "cultural_match", label: "Cultural Match" },
  { domain: "identity_needs", label: "Identity Needs" },
  { domain: "risk_compatibility", label: "Risk Compatibility" },
  { domain: "staff_skills_match", label: "Staff Skills Match" },
  { domain: "family_contact", label: "Family Contact" },
  { domain: "other", label: "Other" },
];

export const MATCH_QUALITIES: { quality: MatchQuality; label: string }[] = [
  { quality: "excellent_match", label: "Excellent Match" },
  { quality: "good_match", label: "Good Match" },
  { quality: "adequate_match", label: "Adequate Match" },
  { quality: "poor_match", label: "Poor Match" },
  { quality: "unsuitable", label: "Unsuitable" },
];

export const ASSESSMENT_TIMINGS: { timing: AssessmentTiming; label: string }[] = [
  { timing: "pre_admission", label: "Pre-Admission" },
  { timing: "72_hour_review", label: "72-Hour Review" },
  { timing: "2_week_review", label: "2-Week Review" },
  { timing: "monthly_review", label: "Monthly Review" },
  { timing: "quarterly_review", label: "Quarterly Review" },
  { timing: "triggered_review", label: "Triggered Review" },
  { timing: "annual_review", label: "Annual Review" },
  { timing: "disruption_review", label: "Disruption Review" },
  { timing: "transition_review", label: "Transition Review" },
  { timing: "other", label: "Other" },
];

export const IMPACT_LEVELS: { level: ImpactLevel; label: string }[] = [
  { level: "very_positive", label: "Very Positive" },
  { level: "positive", label: "Positive" },
  { level: "neutral", label: "Neutral" },
  { level: "negative", label: "Negative" },
  { level: "very_negative", label: "Very Negative" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePlacementMatchingMetrics(
  records: PlacementMatchingAssessmentRecord[],
): {
  total_assessments: number;
  poor_match_count: number;
  negative_impact_count: number;
  unsuitable_count: number;
  pre_admission_count: number;
  child_views_rate: number | null;
  existing_children_rate: number | null;
  staff_consulted_rate: number | null;
  risk_assessment_rate: number | null;
  impact_assessed_rate: number | null;
  cultural_needs_rate: number | null;
  education_access_rate: number | null;
  health_access_rate: number | null;
  family_contact_rate: number | null;
  matching_panel_rate: number | null;
  contingency_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_matching_domain: Record<string, number>;
  by_match_quality: Record<string, number>;
  by_assessment_timing: Record<string, number>;
  by_impact_level: Record<string, number>;
} {
  const poorMatchCount = records.filter(
    (r) => r.match_quality === "poor_match" || r.match_quality === "unsuitable",
  ).length;
  const negativeImpactCount = records.filter(
    (r) => r.impact_level === "negative" || r.impact_level === "very_negative",
  ).length;
  const unsuitableCount = records.filter(
    (r) => r.match_quality === "unsuitable",
  ).length;
  const preAdmissionCount = records.filter(
    (r) => r.assessment_timing === "pre_admission",
  ).length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof PlacementMatchingAssessmentRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byDomain: Record<string, number> = {};
  for (const r of records) byDomain[r.matching_domain] = (byDomain[r.matching_domain] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.match_quality] = (byQuality[r.match_quality] ?? 0) + 1;

  const byTiming: Record<string, number> = {};
  for (const r of records) byTiming[r.assessment_timing] = (byTiming[r.assessment_timing] ?? 0) + 1;

  const byImpact: Record<string, number> = {};
  for (const r of records) byImpact[r.impact_level] = (byImpact[r.impact_level] ?? 0) + 1;

  return {
    total_assessments: records.length,
    poor_match_count: poorMatchCount,
    negative_impact_count: negativeImpactCount,
    unsuitable_count: unsuitableCount,
    pre_admission_count: preAdmissionCount,
    child_views_rate: boolRate("child_views_sought"),
    existing_children_rate: boolRate("existing_children_consulted"),
    staff_consulted_rate: boolRate("staff_consulted"),
    risk_assessment_rate: boolRate("risk_assessment_completed"),
    impact_assessed_rate: boolRate("impact_on_others_assessed"),
    cultural_needs_rate: boolRate("cultural_needs_considered"),
    education_access_rate: boolRate("education_access_confirmed"),
    health_access_rate: boolRate("health_access_confirmed"),
    family_contact_rate: boolRate("family_contact_feasible"),
    matching_panel_rate: boolRate("matching_panel_agreed"),
    contingency_rate: boolRate("contingency_planned"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_matching_domain: byDomain,
    by_match_quality: byQuality,
    by_assessment_timing: byTiming,
    by_impact_level: byImpact,
  };
}

export function identifyPlacementMatchingAlerts(
  records: PlacementMatchingAssessmentRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical per-record: unsuitable match with negative impact
  for (const r of records) {
    if (
      r.match_quality === "unsuitable" &&
      (r.impact_level === "negative" || r.impact_level === "very_negative")
    ) {
      alerts.push({
        type: "unsuitable_negative",
        severity: "critical",
        message: `${r.child_name} has an unsuitable placement match with negative impact — immediate review required.`,
        record_id: r.id,
      });
    }
  }

  // High: child views not sought
  const childViewsNotSought = records.filter((r) => !r.child_views_sought).length;
  if (childViewsNotSought >= 1) {
    alerts.push({
      type: "child_views_not_sought",
      severity: "high",
      message: `${childViewsNotSought} assessment${childViewsNotSought === 1 ? " has" : "s have"} child views not sought.`,
    });
  }

  // High: existing children not consulted
  const existingNotConsulted = records.filter((r) => !r.existing_children_consulted).length;
  if (existingNotConsulted >= 1) {
    alerts.push({
      type: "existing_children_not_consulted",
      severity: "high",
      message: `${existingNotConsulted} assessment${existingNotConsulted === 1 ? " has" : "s have"} existing children not consulted.`,
    });
  }

  // Medium: no contingency planned (threshold >= 2)
  const noContingency = records.filter((r) => !r.contingency_planned).length;
  if (noContingency >= 2) {
    alerts.push({
      type: "no_contingency_planned",
      severity: "medium",
      message: `${noContingency} assessments have no contingency planned.`,
    });
  }

  // Medium: no risk assessment (threshold >= 2)
  const noRiskAssessment = records.filter((r) => !r.risk_assessment_completed).length;
  if (noRiskAssessment >= 2) {
    alerts.push({
      type: "no_risk_assessment",
      severity: "medium",
      message: `${noRiskAssessment} assessments have no risk assessment completed.`,
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listPlacementMatchingAssessments(
  homeId: string,
): Promise<ServiceResult<PlacementMatchingAssessmentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_placement_matching_assessments") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPlacementMatchingAssessment(
  input: {
    homeId: string;
    childName: string;
    childId?: string | null;
    matchingDomain: MatchingDomain;
    matchQuality: MatchQuality;
    assessmentTiming: AssessmentTiming;
    impactLevel: ImpactLevel;
    sessionDate: string;
    assessedBy: string;
    matchingRationale: string;
    evidenceSummary: string;
    peerGroupAnalysis?: string | null;
    riskAssessmentSummary?: string | null;
    childViewsOnPlacement?: string | null;
    existingChildrenViews?: string | null;
    staffViews?: string | null;
    improvementsNeeded?: string | null;
    contingencyPlan?: string | null;
    escalationNotes?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    nextReviewDate?: string | null;
    notes?: string | null;
    childViewsSought: boolean;
    existingChildrenConsulted: boolean;
    staffConsulted: boolean;
    riskAssessmentCompleted: boolean;
    impactOnOthersAssessed: boolean;
    culturalNeedsConsidered: boolean;
    educationAccessConfirmed: boolean;
    healthAccessConfirmed: boolean;
    familyContactFeasible: boolean;
    matchingPanelAgreed: boolean;
    contingencyPlanned: boolean;
    recordedPromptly: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
  },
): Promise<ServiceResult<PlacementMatchingAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_placement_matching_assessments") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      matching_domain: input.matchingDomain,
      match_quality: input.matchQuality,
      assessment_timing: input.assessmentTiming,
      impact_level: input.impactLevel,
      session_date: input.sessionDate,
      assessed_by: input.assessedBy,
      matching_rationale: input.matchingRationale,
      evidence_summary: input.evidenceSummary,
      peer_group_analysis: input.peerGroupAnalysis ?? null,
      risk_assessment_summary: input.riskAssessmentSummary ?? null,
      child_views_on_placement: input.childViewsOnPlacement ?? null,
      existing_children_views: input.existingChildrenViews ?? null,
      staff_views: input.staffViews ?? null,
      improvements_needed: input.improvementsNeeded ?? null,
      contingency_plan: input.contingencyPlan ?? null,
      escalation_notes: input.escalationNotes ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
      child_views_sought: input.childViewsSought,
      existing_children_consulted: input.existingChildrenConsulted,
      staff_consulted: input.staffConsulted,
      risk_assessment_completed: input.riskAssessmentCompleted,
      impact_on_others_assessed: input.impactOnOthersAssessed,
      cultural_needs_considered: input.culturalNeedsConsidered,
      education_access_confirmed: input.educationAccessConfirmed,
      health_access_confirmed: input.healthAccessConfirmed,
      family_contact_feasible: input.familyContactFeasible,
      matching_panel_agreed: input.matchingPanelAgreed,
      contingency_planned: input.contingencyPlanned,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePlacementMatchingAssessment(
  id: string,
  updates: Partial<Omit<PlacementMatchingAssessmentRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<PlacementMatchingAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.child_name !== undefined) mapped.child_name = updates.child_name;
  if (updates.child_id !== undefined) mapped.child_id = updates.child_id;
  if (updates.matching_domain !== undefined) mapped.matching_domain = updates.matching_domain;
  if (updates.match_quality !== undefined) mapped.match_quality = updates.match_quality;
  if (updates.assessment_timing !== undefined) mapped.assessment_timing = updates.assessment_timing;
  if (updates.impact_level !== undefined) mapped.impact_level = updates.impact_level;
  if (updates.session_date !== undefined) mapped.session_date = updates.session_date;
  if (updates.assessed_by !== undefined) mapped.assessed_by = updates.assessed_by;
  if (updates.matching_rationale !== undefined) mapped.matching_rationale = updates.matching_rationale;
  if (updates.evidence_summary !== undefined) mapped.evidence_summary = updates.evidence_summary;
  if (updates.peer_group_analysis !== undefined) mapped.peer_group_analysis = updates.peer_group_analysis;
  if (updates.risk_assessment_summary !== undefined) mapped.risk_assessment_summary = updates.risk_assessment_summary;
  if (updates.child_views_on_placement !== undefined) mapped.child_views_on_placement = updates.child_views_on_placement;
  if (updates.existing_children_views !== undefined) mapped.existing_children_views = updates.existing_children_views;
  if (updates.staff_views !== undefined) mapped.staff_views = updates.staff_views;
  if (updates.improvements_needed !== undefined) mapped.improvements_needed = updates.improvements_needed;
  if (updates.contingency_plan !== undefined) mapped.contingency_plan = updates.contingency_plan;
  if (updates.escalation_notes !== undefined) mapped.escalation_notes = updates.escalation_notes;
  if (updates.approved_by !== undefined) mapped.approved_by = updates.approved_by;
  if (updates.approved_at !== undefined) mapped.approved_at = updates.approved_at;
  if (updates.next_review_date !== undefined) mapped.next_review_date = updates.next_review_date;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  if (updates.child_views_sought !== undefined) mapped.child_views_sought = updates.child_views_sought;
  if (updates.existing_children_consulted !== undefined) mapped.existing_children_consulted = updates.existing_children_consulted;
  if (updates.staff_consulted !== undefined) mapped.staff_consulted = updates.staff_consulted;
  if (updates.risk_assessment_completed !== undefined) mapped.risk_assessment_completed = updates.risk_assessment_completed;
  if (updates.impact_on_others_assessed !== undefined) mapped.impact_on_others_assessed = updates.impact_on_others_assessed;
  if (updates.cultural_needs_considered !== undefined) mapped.cultural_needs_considered = updates.cultural_needs_considered;
  if (updates.education_access_confirmed !== undefined) mapped.education_access_confirmed = updates.education_access_confirmed;
  if (updates.health_access_confirmed !== undefined) mapped.health_access_confirmed = updates.health_access_confirmed;
  if (updates.family_contact_feasible !== undefined) mapped.family_contact_feasible = updates.family_contact_feasible;
  if (updates.matching_panel_agreed !== undefined) mapped.matching_panel_agreed = updates.matching_panel_agreed;
  if (updates.contingency_planned !== undefined) mapped.contingency_planned = updates.contingency_planned;
  if (updates.recorded_promptly !== undefined) mapped.recorded_promptly = updates.recorded_promptly;
  if (updates.issues_found !== undefined) mapped.issues_found = updates.issues_found;
  if (updates.actions_taken !== undefined) mapped.actions_taken = updates.actions_taken;
  if (updates.updated_at !== undefined) mapped.updated_at = updates.updated_at;

  const { data, error } = await (s.from("cs_placement_matching_assessments") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePlacementMatchingMetrics,
  identifyPlacementMatchingAlerts,
};
