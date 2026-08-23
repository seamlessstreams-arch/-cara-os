// ══════════════════════════════════════════════════════════════════════════════
// CARA — IMPACT & RISK ASSESSMENT SERVICE
// Manages placement impact risk assessments, compatibility assessments,
// and admission risk evaluations for new placements.
// CHR 2015 Reg 12 (children receive care from appropriate staff),
// Reg 14 (care planning — placement matching), Reg 36 (notifications).
//
// Tracks impact assessments for each new placement, evaluating the effect
// on existing children, compatibility factors, risk mitigations, and
// ensuring placements are in the best interests of all children.
//
// SCCIF: Helped & Protected — "Impact risk assessments are thorough."
// "The impact of new admissions on existing children is carefully assessed."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AssessmentStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "approved"
  | "rejected";

export type RiskLevel =
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export type CompatibilityFactor =
  | "age_range"
  | "gender_dynamics"
  | "behavioural_needs"
  | "emotional_needs"
  | "safeguarding_history"
  | "education_needs"
  | "health_needs"
  | "cultural_background"
  | "language"
  | "family_contact_patterns"
  | "peer_relationships"
  | "substance_misuse_risk"
  | "exploitation_risk"
  | "other";

export type ImpactArea =
  | "existing_children_safety"
  | "existing_children_wellbeing"
  | "staffing_capacity"
  | "bedroom_availability"
  | "therapeutic_environment"
  | "education_provision"
  | "group_dynamics"
  | "regulatory_compliance"
  | "community_impact"
  | "financial_viability";

export type MitigationStatus =
  | "identified"
  | "in_progress"
  | "implemented"
  | "reviewed";

export interface ImpactAssessment {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  referral_date: string;
  assessment_date: string;
  assessed_by: string;
  status: AssessmentStatus;
  overall_risk_level: RiskLevel;
  compatibility_factors: {
    factor: CompatibilityFactor;
    rating: RiskLevel;
    notes: string;
  }[];
  impact_areas: {
    area: ImpactArea;
    impact_level: RiskLevel;
    description: string;
  }[];
  mitigations: {
    risk: string;
    mitigation: string;
    responsible_person: string;
    status: MitigationStatus;
    review_date: string;
  }[];
  existing_children_consulted: boolean;
  existing_children_views: string | null;
  staff_consulted: boolean;
  staff_views: string | null;
  recommendation: "accept" | "reject" | "accept_with_conditions" | "defer";
  conditions: string | null;
  approved_by: string | null;
  approval_date: string | null;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ASSESSMENT_STATUSES: { status: AssessmentStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
];

export const RISK_LEVELS: { level: RiskLevel; label: string }[] = [
  { level: "very_low", label: "Very Low" },
  { level: "low", label: "Low" },
  { level: "medium", label: "Medium" },
  { level: "high", label: "High" },
  { level: "very_high", label: "Very High" },
];

export const COMPATIBILITY_FACTORS: { factor: CompatibilityFactor; label: string }[] = [
  { factor: "age_range", label: "Age Range" },
  { factor: "gender_dynamics", label: "Gender Dynamics" },
  { factor: "behavioural_needs", label: "Behavioural Needs" },
  { factor: "emotional_needs", label: "Emotional Needs" },
  { factor: "safeguarding_history", label: "Safeguarding History" },
  { factor: "education_needs", label: "Education Needs" },
  { factor: "health_needs", label: "Health Needs" },
  { factor: "cultural_background", label: "Cultural Background" },
  { factor: "language", label: "Language" },
  { factor: "family_contact_patterns", label: "Family Contact Patterns" },
  { factor: "peer_relationships", label: "Peer Relationships" },
  { factor: "substance_misuse_risk", label: "Substance Misuse Risk" },
  { factor: "exploitation_risk", label: "Exploitation Risk" },
  { factor: "other", label: "Other" },
];

export const IMPACT_AREAS: { area: ImpactArea; label: string }[] = [
  { area: "existing_children_safety", label: "Existing Children — Safety" },
  { area: "existing_children_wellbeing", label: "Existing Children — Wellbeing" },
  { area: "staffing_capacity", label: "Staffing Capacity" },
  { area: "bedroom_availability", label: "Bedroom Availability" },
  { area: "therapeutic_environment", label: "Therapeutic Environment" },
  { area: "education_provision", label: "Education Provision" },
  { area: "group_dynamics", label: "Group Dynamics" },
  { area: "regulatory_compliance", label: "Regulatory Compliance" },
  { area: "community_impact", label: "Community Impact" },
  { area: "financial_viability", label: "Financial Viability" },
];

export const MITIGATION_STATUSES: { status: MitigationStatus; label: string }[] = [
  { status: "identified", label: "Identified" },
  { status: "in_progress", label: "In Progress" },
  { status: "implemented", label: "Implemented" },
  { status: "reviewed", label: "Reviewed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute impact risk assessment metrics.
 */
export function computeAssessmentMetrics(
  assessments: ImpactAssessment[],
): {
  total_assessments: number;
  completed_assessments: number;
  pending_assessments: number;
  accepted: number;
  rejected: number;
  accepted_with_conditions: number;
  avg_risk_level: number | null;
  high_risk_count: number;
  children_consulted_rate: number | null;
  staff_consulted_rate: number | null;
  open_mitigations: number;
  by_risk_level: Record<string, number>;
  by_recommendation: Record<string, number>;
} {
  let completedCount = 0;
  let pendingCount = 0;
  let acceptedCount = 0;
  let rejectedCount = 0;
  let conditionsCount = 0;
  let highRiskCount = 0;
  let childrenConsulted = 0;
  let staffConsulted = 0;
  let openMitigations = 0;
  const byRiskLevel: Record<string, number> = {};
  const byRecommendation: Record<string, number> = {};

  const riskScores: Record<string, number> = {
    very_low: 1,
    low: 2,
    medium: 3,
    high: 4,
    very_high: 5,
  };
  let totalRisk = 0;
  let riskCount = 0;

  for (const a of assessments) {
    // Status
    if (a.status === "completed" || a.status === "approved" || a.status === "rejected") {
      completedCount++;
    } else {
      pendingCount++;
    }

    // Recommendation
    byRecommendation[a.recommendation] =
      (byRecommendation[a.recommendation] ?? 0) + 1;
    if (a.recommendation === "accept") acceptedCount++;
    if (a.recommendation === "reject") rejectedCount++;
    if (a.recommendation === "accept_with_conditions") conditionsCount++;

    // Risk level
    byRiskLevel[a.overall_risk_level] =
      (byRiskLevel[a.overall_risk_level] ?? 0) + 1;
    if (a.overall_risk_level === "high" || a.overall_risk_level === "very_high") {
      highRiskCount++;
    }
    if (riskScores[a.overall_risk_level] != null) {
      totalRisk += riskScores[a.overall_risk_level];
      riskCount++;
    }

    // Consultation
    if (a.existing_children_consulted) childrenConsulted++;
    if (a.staff_consulted) staffConsulted++;

    // Open mitigations
    for (const m of a.mitigations) {
      if (m.status === "identified" || m.status === "in_progress") {
        openMitigations++;
      }
    }
  }

  const avgRiskLevel =
    riskCount > 0
      ? Math.round((totalRisk / riskCount) * 10) / 10
      : null;

  const childrenConsultedRate =
    assessments.length > 0
      ? Math.round((childrenConsulted / assessments.length) * 1000) / 10
      : null;

  const staffConsultedRate =
    assessments.length > 0
      ? Math.round((staffConsulted / assessments.length) * 1000) / 10
      : null;

  return {
    total_assessments: assessments.length,
    completed_assessments: completedCount,
    pending_assessments: pendingCount,
    accepted: acceptedCount,
    rejected: rejectedCount,
    accepted_with_conditions: conditionsCount,
    avg_risk_level: avgRiskLevel,
    high_risk_count: highRiskCount,
    children_consulted_rate: childrenConsultedRate,
    staff_consulted_rate: staffConsultedRate,
    open_mitigations: openMitigations,
    by_risk_level: byRiskLevel,
    by_recommendation: byRecommendation,
  };
}

/**
 * Identify impact risk assessment alerts.
 */
export function identifyAssessmentAlerts(
  assessments: ImpactAssessment[],
  now: Date = new Date(),
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

  for (const a of assessments) {
    // High/very high risk
    if (a.overall_risk_level === "very_high") {
      alerts.push({
        type: "very_high_risk",
        severity: "critical",
        message: `Impact assessment for ${a.child_name} rated 'very high' risk — ensure all mitigations are in place before proceeding`,
        id: a.id,
      });
    } else if (a.overall_risk_level === "high") {
      alerts.push({
        type: "high_risk",
        severity: "high",
        message: `Impact assessment for ${a.child_name} rated 'high' risk — review mitigations carefully`,
        id: a.id,
      });
    }

    // Children not consulted
    if (!a.existing_children_consulted && a.status !== "draft") {
      alerts.push({
        type: "children_not_consulted",
        severity: "high",
        message: `Existing children not consulted for ${a.child_name}'s placement assessment — Reg 7 requires children's views`,
        id: a.id,
      });
    }

    // Staff not consulted
    if (!a.staff_consulted && a.status !== "draft") {
      alerts.push({
        type: "staff_not_consulted",
        severity: "medium",
        message: `Staff not consulted for ${a.child_name}'s placement assessment — staff views should inform decisions`,
        id: a.id,
      });
    }

    // Review overdue
    if (a.review_date && new Date(a.review_date) < now && a.status !== "rejected") {
      alerts.push({
        type: "review_overdue",
        severity: "medium",
        message: `Impact assessment review for ${a.child_name} is overdue — was due ${a.review_date}`,
        id: a.id,
      });
    }

    // Unimplemented mitigations for approved assessments
    if (a.status === "approved") {
      const unimplemented = a.mitigations.filter(
        (m) => m.status === "identified" || m.status === "in_progress",
      );
      if (unimplemented.length > 0) {
        alerts.push({
          type: "mitigations_outstanding",
          severity: "high",
          message: `${a.child_name}'s approved placement has ${unimplemented.length} outstanding mitigation(s) — implement before or during placement`,
          id: a.id,
        });
      }
    }
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────

export async function listAssessments(
  homeId: string,
  filters?: {
    status?: AssessmentStatus;
    riskLevel?: RiskLevel;
    limit?: number;
  },
): Promise<ServiceResult<ImpactAssessment[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_impact_assessments") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.riskLevel) q = q.eq("overall_risk_level", filters.riskLevel);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAssessment(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    referralDate: string;
    assessmentDate: string;
    assessedBy: string;
    status?: AssessmentStatus;
    overallRiskLevel?: RiskLevel;
    compatibilityFactors?: ImpactAssessment["compatibility_factors"];
    impactAreas?: ImpactAssessment["impact_areas"];
    mitigations?: ImpactAssessment["mitigations"];
    existingChildrenConsulted?: boolean;
    existingChildrenViews?: string;
    staffConsulted?: boolean;
    staffViews?: string;
    recommendation?: "accept" | "reject" | "accept_with_conditions" | "defer";
    conditions?: string;
    reviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<ImpactAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_impact_assessments") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      referral_date: input.referralDate,
      assessment_date: input.assessmentDate,
      assessed_by: input.assessedBy,
      status: input.status ?? "draft",
      overall_risk_level: input.overallRiskLevel ?? "medium",
      compatibility_factors: input.compatibilityFactors ?? [],
      impact_areas: input.impactAreas ?? [],
      mitigations: input.mitigations ?? [],
      existing_children_consulted: input.existingChildrenConsulted ?? false,
      existing_children_views: input.existingChildrenViews ?? null,
      staff_consulted: input.staffConsulted ?? false,
      staff_views: input.staffViews ?? null,
      recommendation: input.recommendation ?? "defer",
      conditions: input.conditions ?? null,
      approved_by: null,
      approval_date: null,
      review_date: input.reviewDate ?? null,
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
): Promise<ServiceResult<ImpactAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_impact_assessments") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAssessmentMetrics,
  identifyAssessmentAlerts,
};
