// ══════════════════════════════════════════════════════════════════════════════
// CARA — INDIVIDUAL RISK ASSESSMENT SERVICE
// Tracks individual child risk assessments, covering safeguarding,
// self-harm, absconding, exploitation, aggression, and vulnerability
// risks specific to each child. Distinct from the organisational
// risk register — this is per-child, dynamic, and intervention-led.
// CHR 2015 Reg 12 (protection of children),
// Reg 13 (leadership and management — risk management),
// Reg 34 (placement plans — risk assessment).
//
// SCCIF: Helped & Protected — "Individual risks are identified,
// assessed, and managed with clear plans." "Staff understand each
// child's specific risks."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type RiskDomain =
  | "self_harm"
  | "suicide"
  | "absconding"
  | "cse"
  | "cce"
  | "radicalisation"
  | "substance_misuse"
  | "aggression_to_others"
  | "aggression_to_property"
  | "bullying"
  | "online_risk"
  | "fire_setting"
  | "sexual_behaviour"
  | "gang_involvement"
  | "trafficking"
  | "other";

export type RiskRating =
  | "very_high"
  | "high"
  | "medium"
  | "low"
  | "minimal";

export type AssessmentStatus =
  | "current"
  | "under_review"
  | "expired"
  | "superseded"
  | "draft";

export type ReviewTrigger =
  | "scheduled"
  | "incident"
  | "placement_change"
  | "disclosure"
  | "professional_request"
  | "escalation"
  | "improvement"
  | "initial";

export interface IndividualRiskAssessment {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  risk_domain: RiskDomain;
  risk_rating: RiskRating;
  assessment_status: AssessmentStatus;
  assessed_by: string;
  assessment_date: string;
  review_date: string | null;
  review_trigger: ReviewTrigger;
  risk_indicators: string[];
  protective_factors: string[];
  management_strategies: string[];
  triggers: string[];
  staff_aware: boolean;
  staff_briefed_date: string | null;
  multi_agency_involved: boolean;
  social_worker_informed: boolean;
  child_involved_in_plan: boolean;
  parent_informed: boolean;
  linked_incident_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RISK_DOMAINS: { domain: RiskDomain; label: string }[] = [
  { domain: "self_harm", label: "Self-Harm" },
  { domain: "suicide", label: "Suicide" },
  { domain: "absconding", label: "Absconding" },
  { domain: "cse", label: "CSE" },
  { domain: "cce", label: "CCE" },
  { domain: "radicalisation", label: "Radicalisation" },
  { domain: "substance_misuse", label: "Substance Misuse" },
  { domain: "aggression_to_others", label: "Aggression to Others" },
  { domain: "aggression_to_property", label: "Aggression to Property" },
  { domain: "bullying", label: "Bullying" },
  { domain: "online_risk", label: "Online Risk" },
  { domain: "fire_setting", label: "Fire Setting" },
  { domain: "sexual_behaviour", label: "Sexual Behaviour" },
  { domain: "gang_involvement", label: "Gang Involvement" },
  { domain: "trafficking", label: "Trafficking" },
  { domain: "other", label: "Other" },
];

export const RISK_RATINGS: { rating: RiskRating; label: string }[] = [
  { rating: "very_high", label: "Very High" },
  { rating: "high", label: "High" },
  { rating: "medium", label: "Medium" },
  { rating: "low", label: "Low" },
  { rating: "minimal", label: "Minimal" },
];

export const ASSESSMENT_STATUSES: { status: AssessmentStatus; label: string }[] = [
  { status: "current", label: "Current" },
  { status: "under_review", label: "Under Review" },
  { status: "expired", label: "Expired" },
  { status: "superseded", label: "Superseded" },
  { status: "draft", label: "Draft" },
];

export const REVIEW_TRIGGERS: { trigger: ReviewTrigger; label: string }[] = [
  { trigger: "scheduled", label: "Scheduled" },
  { trigger: "incident", label: "Incident" },
  { trigger: "placement_change", label: "Placement Change" },
  { trigger: "disclosure", label: "Disclosure" },
  { trigger: "professional_request", label: "Professional Request" },
  { trigger: "escalation", label: "Escalation" },
  { trigger: "improvement", label: "Improvement" },
  { trigger: "initial", label: "Initial" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeIndividualRiskMetrics(
  assessments: IndividualRiskAssessment[],
  totalChildren: number,
): {
  total_assessments: number;
  children_assessed: number;
  assessment_coverage: number | null;
  current_count: number;
  expired_count: number;
  under_review_count: number;
  very_high_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  staff_aware_rate: number | null;
  multi_agency_rate: number | null;
  child_involved_rate: number | null;
  parent_informed_rate: number | null;
  review_overdue_count: number;
  average_per_child: number | null;
  average_strategies_per_assessment: number | null;
  by_risk_domain: Record<string, number>;
  by_risk_rating: Record<string, number>;
  by_assessment_status: Record<string, number>;
  by_review_trigger: Record<string, number>;
} {
  const uniqueChildren = new Set(assessments.map((a) => a.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const current = assessments.filter((a) => a.assessment_status === "current").length;
  const expired = assessments.filter((a) => a.assessment_status === "expired").length;
  const underReview = assessments.filter((a) => a.assessment_status === "under_review").length;

  const veryHigh = assessments.filter((a) => a.risk_rating === "very_high").length;
  const high = assessments.filter((a) => a.risk_rating === "high").length;
  const medium = assessments.filter((a) => a.risk_rating === "medium").length;
  const low = assessments.filter((a) => a.risk_rating === "low").length;

  const staffAware = assessments.filter((a) => a.staff_aware).length;
  const staffRate =
    assessments.length > 0
      ? Math.round((staffAware / assessments.length) * 1000) / 10
      : null;

  const multiAgency = assessments.filter((a) => a.multi_agency_involved).length;
  const maRate =
    assessments.length > 0
      ? Math.round((multiAgency / assessments.length) * 1000) / 10
      : null;

  const childInvolved = assessments.filter((a) => a.child_involved_in_plan).length;
  const childRate =
    assessments.length > 0
      ? Math.round((childInvolved / assessments.length) * 1000) / 10
      : null;

  const parentInformed = assessments.filter((a) => a.parent_informed).length;
  const parentRate =
    assessments.length > 0
      ? Math.round((parentInformed / assessments.length) * 1000) / 10
      : null;

  const now = new Date();
  const reviewOverdue = assessments.filter(
    (a) => a.review_date && new Date(a.review_date) < now && a.assessment_status === "current",
  ).length;

  const avgPerChild =
    uniqueChildren > 0
      ? Math.round((assessments.length / uniqueChildren) * 10) / 10
      : null;

  const totalStrategies = assessments.reduce((sum, a) => sum + a.management_strategies.length, 0);
  const avgStrategies =
    assessments.length > 0
      ? Math.round((totalStrategies / assessments.length) * 10) / 10
      : null;

  const byDomain: Record<string, number> = {};
  for (const a of assessments) byDomain[a.risk_domain] = (byDomain[a.risk_domain] ?? 0) + 1;

  const byRating: Record<string, number> = {};
  for (const a of assessments) byRating[a.risk_rating] = (byRating[a.risk_rating] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const a of assessments) byStatus[a.assessment_status] = (byStatus[a.assessment_status] ?? 0) + 1;

  const byTrigger: Record<string, number> = {};
  for (const a of assessments) byTrigger[a.review_trigger] = (byTrigger[a.review_trigger] ?? 0) + 1;

  return {
    total_assessments: assessments.length,
    children_assessed: uniqueChildren,
    assessment_coverage: coverage,
    current_count: current,
    expired_count: expired,
    under_review_count: underReview,
    very_high_count: veryHigh,
    high_count: high,
    medium_count: medium,
    low_count: low,
    staff_aware_rate: staffRate,
    multi_agency_rate: maRate,
    child_involved_rate: childRate,
    parent_informed_rate: parentRate,
    review_overdue_count: reviewOverdue,
    average_per_child: avgPerChild,
    average_strategies_per_assessment: avgStrategies,
    by_risk_domain: byDomain,
    by_risk_rating: byRating,
    by_assessment_status: byStatus,
    by_review_trigger: byTrigger,
  };
}

export function identifyIndividualRiskAlerts(
  assessments: IndividualRiskAssessment[],
  totalChildren: number,
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

  // Very high risk assessments
  for (const a of assessments) {
    if (a.risk_rating === "very_high" && a.assessment_status === "current") {
      alerts.push({
        type: "very_high_risk",
        severity: "critical",
        message: `Very high ${a.risk_domain.replace(/_/g, " ")} risk for ${a.child_name} — requires enhanced monitoring and multi-agency response`,
        id: a.id,
      });
    }
  }

  // Expired risk assessments
  for (const a of assessments) {
    if (a.assessment_status === "expired" && (a.risk_rating === "very_high" || a.risk_rating === "high")) {
      alerts.push({
        type: "expired_high_risk",
        severity: "critical",
        message: `${a.risk_rating.replace(/_/g, " ")} risk assessment for ${a.child_name} (${a.risk_domain.replace(/_/g, " ")}) has expired — reassess immediately`,
        id: a.id,
      });
    }
  }

  // Staff not aware of current high risks
  for (const a of assessments) {
    if (!a.staff_aware && a.assessment_status === "current" && (a.risk_rating === "very_high" || a.risk_rating === "high")) {
      alerts.push({
        type: "staff_not_aware",
        severity: "high",
        message: `Staff not aware of ${a.child_name}'s ${a.risk_domain.replace(/_/g, " ")} risk (${a.risk_rating.replace(/_/g, " ")}) — brief all staff immediately`,
        id: a.id,
      });
    }
  }

  // No management strategies
  for (const a of assessments) {
    if (a.management_strategies.length === 0 && a.assessment_status === "current") {
      alerts.push({
        type: "no_strategies",
        severity: "high",
        message: `No management strategies for ${a.child_name}'s ${a.risk_domain.replace(/_/g, " ")} risk — develop and implement risk management plan`,
        id: a.id,
      });
    }
  }

  // Children without any risk assessment
  const childrenAssessed = new Set(assessments.map((a) => a.child_id)).size;
  if (totalChildren > 0 && childrenAssessed < totalChildren) {
    const gap = totalChildren - childrenAssessed;
    alerts.push({
      type: "no_assessment",
      severity: "medium",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no individual risk assessment — all children should have assessed risks documented`,
      id: "assessment_gap",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listAssessments(
  homeId: string,
  filters?: {
    childId?: string;
    riskDomain?: RiskDomain;
    riskRating?: RiskRating;
    assessmentStatus?: AssessmentStatus;
    limit?: number;
  },
): Promise<ServiceResult<IndividualRiskAssessment[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_individual_risk_assessments") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.riskDomain) q = q.eq("risk_domain", filters.riskDomain);
  if (filters?.riskRating) q = q.eq("risk_rating", filters.riskRating);
  if (filters?.assessmentStatus) q = q.eq("assessment_status", filters.assessmentStatus);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAssessment(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    riskDomain: RiskDomain;
    riskRating: RiskRating;
    assessmentStatus: AssessmentStatus;
    assessedBy: string;
    assessmentDate: string;
    reviewDate?: string;
    reviewTrigger: ReviewTrigger;
    riskIndicators: string[];
    protectiveFactors: string[];
    managementStrategies: string[];
    triggers: string[];
    staffAware: boolean;
    staffBriefedDate?: string;
    multiAgencyInvolved: boolean;
    socialWorkerInformed: boolean;
    childInvolvedInPlan: boolean;
    parentInformed: boolean;
    linkedIncidentIds: string[];
    notes?: string;
  },
): Promise<ServiceResult<IndividualRiskAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_individual_risk_assessments") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      risk_domain: input.riskDomain,
      risk_rating: input.riskRating,
      assessment_status: input.assessmentStatus,
      assessed_by: input.assessedBy,
      assessment_date: input.assessmentDate,
      review_date: input.reviewDate ?? null,
      review_trigger: input.reviewTrigger,
      risk_indicators: input.riskIndicators,
      protective_factors: input.protectiveFactors,
      management_strategies: input.managementStrategies,
      triggers: input.triggers,
      staff_aware: input.staffAware,
      staff_briefed_date: input.staffBriefedDate ?? null,
      multi_agency_involved: input.multiAgencyInvolved,
      social_worker_informed: input.socialWorkerInformed,
      child_involved_in_plan: input.childInvolvedInPlan,
      parent_informed: input.parentInformed,
      linked_incident_ids: input.linkedIncidentIds,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAssessment(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<IndividualRiskAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_individual_risk_assessments") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeIndividualRiskMetrics,
  identifyIndividualRiskAlerts,
};
