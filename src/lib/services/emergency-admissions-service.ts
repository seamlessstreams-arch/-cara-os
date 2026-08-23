// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY ADMISSIONS SERVICE
// Tracks emergency placements, matching assessments, impact evaluations,
// and admission compliance for unplanned admissions.
// CHR 2015 Reg 35 (admissions — emergency placements),
// Reg 14 (care planning — placement matching),
// Reg 12 (protection — impact on existing children).
//
// Covers: emergency admissions, matching assessments, impact on
// existing children, referral sources, and placement stability.
//
// SCCIF: Helped & Protected — "Emergency placements are managed
// safely." "Impact on existing children is considered."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AdmissionType =
  | "planned"
  | "emergency"
  | "crisis"
  | "respite"
  | "step_down"
  | "transfer"
  | "other";

export type ReferralSource =
  | "local_authority"
  | "police"
  | "hospital"
  | "court"
  | "another_home"
  | "foster_carer"
  | "family"
  | "other";

export type MatchingOutcome =
  | "good_match"
  | "acceptable_match"
  | "poor_match"
  | "not_assessed"
  | "overridden_by_la";

export type ImpactAssessment =
  | "no_impact"
  | "minimal_impact"
  | "moderate_impact"
  | "significant_impact"
  | "not_assessed";

export interface EmergencyAdmission {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  admission_date: string;
  admission_type: AdmissionType;
  referral_source: ReferralSource;
  matching_outcome: MatchingOutcome;
  impact_on_existing_children: ImpactAssessment;
  risk_assessment_completed: boolean;
  placement_plan_within_24h: boolean;
  social_worker_contacted: boolean;
  ofsted_notified: boolean;
  existing_children_consulted: boolean;
  staff_briefed: boolean;
  child_needs_identified: boolean;
  child_views_captured: boolean;
  disruption_to_placement: boolean;
  admission_approved_by: string;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ADMISSION_TYPES: { type: AdmissionType; label: string }[] = [
  { type: "planned", label: "Planned" },
  { type: "emergency", label: "Emergency" },
  { type: "crisis", label: "Crisis" },
  { type: "respite", label: "Respite" },
  { type: "step_down", label: "Step Down" },
  { type: "transfer", label: "Transfer" },
  { type: "other", label: "Other" },
];

export const REFERRAL_SOURCES: { source: ReferralSource; label: string }[] = [
  { source: "local_authority", label: "Local Authority" },
  { source: "police", label: "Police" },
  { source: "hospital", label: "Hospital" },
  { source: "court", label: "Court" },
  { source: "another_home", label: "Another Home" },
  { source: "foster_carer", label: "Foster Carer" },
  { source: "family", label: "Family" },
  { source: "other", label: "Other" },
];

export const MATCHING_OUTCOMES: { outcome: MatchingOutcome; label: string }[] = [
  { outcome: "good_match", label: "Good Match" },
  { outcome: "acceptable_match", label: "Acceptable Match" },
  { outcome: "poor_match", label: "Poor Match" },
  { outcome: "not_assessed", label: "Not Assessed" },
  { outcome: "overridden_by_la", label: "Overridden by LA" },
];

export const IMPACT_ASSESSMENTS: { assessment: ImpactAssessment; label: string }[] = [
  { assessment: "no_impact", label: "No Impact" },
  { assessment: "minimal_impact", label: "Minimal Impact" },
  { assessment: "moderate_impact", label: "Moderate Impact" },
  { assessment: "significant_impact", label: "Significant Impact" },
  { assessment: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeAdmissionMetrics(
  admissions: EmergencyAdmission[],
): {
  total_admissions: number;
  emergency_count: number;
  crisis_count: number;
  planned_count: number;
  risk_assessment_rate: number | null;
  placement_plan_rate: number | null;
  social_worker_contacted_rate: number | null;
  ofsted_notified_rate: number | null;
  existing_children_consulted_rate: number | null;
  staff_briefed_rate: number | null;
  child_views_captured_rate: number | null;
  good_match_rate: number | null;
  poor_match_count: number;
  significant_impact_count: number;
  disruption_count: number;
  by_admission_type: Record<string, number>;
  by_referral_source: Record<string, number>;
  by_matching_outcome: Record<string, number>;
  by_impact_assessment: Record<string, number>;
} {
  const emergency = admissions.filter((a) => a.admission_type === "emergency").length;
  const crisis = admissions.filter((a) => a.admission_type === "crisis").length;
  const planned = admissions.filter((a) => a.admission_type === "planned").length;

  const riskDone = admissions.filter((a) => a.risk_assessment_completed).length;
  const riskRate =
    admissions.length > 0
      ? Math.round((riskDone / admissions.length) * 1000) / 10
      : null;

  const planDone = admissions.filter((a) => a.placement_plan_within_24h).length;
  const planRate =
    admissions.length > 0
      ? Math.round((planDone / admissions.length) * 1000) / 10
      : null;

  const swContacted = admissions.filter((a) => a.social_worker_contacted).length;
  const swRate =
    admissions.length > 0
      ? Math.round((swContacted / admissions.length) * 1000) / 10
      : null;

  const ofstedNotified = admissions.filter((a) => a.ofsted_notified).length;
  const ofstedRate =
    admissions.length > 0
      ? Math.round((ofstedNotified / admissions.length) * 1000) / 10
      : null;

  const consulted = admissions.filter((a) => a.existing_children_consulted).length;
  const consultedRate =
    admissions.length > 0
      ? Math.round((consulted / admissions.length) * 1000) / 10
      : null;

  const briefed = admissions.filter((a) => a.staff_briefed).length;
  const briefedRate =
    admissions.length > 0
      ? Math.round((briefed / admissions.length) * 1000) / 10
      : null;

  const viewsCaptured = admissions.filter((a) => a.child_views_captured).length;
  const viewsRate =
    admissions.length > 0
      ? Math.round((viewsCaptured / admissions.length) * 1000) / 10
      : null;

  const assessed = admissions.filter((a) => a.matching_outcome !== "not_assessed");
  const goodMatch = assessed.filter((a) => a.matching_outcome === "good_match").length;
  const goodMatchRate =
    assessed.length > 0
      ? Math.round((goodMatch / assessed.length) * 1000) / 10
      : null;

  const poorMatch = admissions.filter((a) => a.matching_outcome === "poor_match").length;
  const sigImpact = admissions.filter((a) => a.impact_on_existing_children === "significant_impact").length;
  const disruption = admissions.filter((a) => a.disruption_to_placement).length;

  const byType: Record<string, number> = {};
  for (const a of admissions) byType[a.admission_type] = (byType[a.admission_type] ?? 0) + 1;

  const bySource: Record<string, number> = {};
  for (const a of admissions) bySource[a.referral_source] = (bySource[a.referral_source] ?? 0) + 1;

  const byMatch: Record<string, number> = {};
  for (const a of admissions) byMatch[a.matching_outcome] = (byMatch[a.matching_outcome] ?? 0) + 1;

  const byImpact: Record<string, number> = {};
  for (const a of admissions) byImpact[a.impact_on_existing_children] = (byImpact[a.impact_on_existing_children] ?? 0) + 1;

  return {
    total_admissions: admissions.length,
    emergency_count: emergency,
    crisis_count: crisis,
    planned_count: planned,
    risk_assessment_rate: riskRate,
    placement_plan_rate: planRate,
    social_worker_contacted_rate: swRate,
    ofsted_notified_rate: ofstedRate,
    existing_children_consulted_rate: consultedRate,
    staff_briefed_rate: briefedRate,
    child_views_captured_rate: viewsRate,
    good_match_rate: goodMatchRate,
    poor_match_count: poorMatch,
    significant_impact_count: sigImpact,
    disruption_count: disruption,
    by_admission_type: byType,
    by_referral_source: bySource,
    by_matching_outcome: byMatch,
    by_impact_assessment: byImpact,
  };
}

export function identifyAdmissionAlerts(
  admissions: EmergencyAdmission[],
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

  // Significant impact on existing children
  for (const a of admissions) {
    if (a.impact_on_existing_children === "significant_impact") {
      alerts.push({
        type: "significant_impact",
        severity: "critical",
        message: `Admission of ${a.child_name} causing significant impact on existing children — review placement suitability`,
        id: a.id,
      });
    }
  }

  // Emergency/crisis without risk assessment
  for (const a of admissions) {
    if ((a.admission_type === "emergency" || a.admission_type === "crisis") && !a.risk_assessment_completed) {
      alerts.push({
        type: "no_risk_assessment",
        severity: "high",
        message: `${a.admission_type.replace(/_/g, " ")} admission of ${a.child_name} without risk assessment — conduct retrospective assessment`,
        id: a.id,
      });
    }
  }

  // Poor match
  for (const a of admissions) {
    if (a.matching_outcome === "poor_match") {
      alerts.push({
        type: "poor_match",
        severity: "high",
        message: `Poor matching outcome for ${a.child_name} — monitor placement stability and review with placing authority`,
        id: a.id,
      });
    }
  }

  // Existing children not consulted
  const notConsulted = admissions.filter(
    (a) => !a.existing_children_consulted && a.admission_type !== "planned",
  ).length;
  if (notConsulted >= 1) {
    alerts.push({
      type: "children_not_consulted",
      severity: "medium",
      message: `${notConsulted} ${notConsulted === 1 ? "admission was" : "admissions were"} made without consulting existing children — their views should be sought`,
      id: "children_not_consulted",
    });
  }

  // No placement plan within 24h
  const noPlan = admissions.filter((a) => !a.placement_plan_within_24h).length;
  if (noPlan >= 1) {
    alerts.push({
      type: "no_placement_plan",
      severity: "medium",
      message: `${noPlan} ${noPlan === 1 ? "admission" : "admissions"} without placement plan within 24 hours — ensure plans are in place`,
      id: "no_placement_plan",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listAdmissions(
  homeId: string,
  filters?: {
    admissionType?: AdmissionType;
    referralSource?: ReferralSource;
    matchingOutcome?: MatchingOutcome;
    limit?: number;
  },
): Promise<ServiceResult<EmergencyAdmission[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_emergency_admissions") as SB).select("*").eq("home_id", homeId);
  if (filters?.admissionType) q = q.eq("admission_type", filters.admissionType);
  if (filters?.referralSource) q = q.eq("referral_source", filters.referralSource);
  if (filters?.matchingOutcome) q = q.eq("matching_outcome", filters.matchingOutcome);
  q = q.order("admission_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAdmission(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    admissionDate: string;
    admissionType: AdmissionType;
    referralSource: ReferralSource;
    matchingOutcome: MatchingOutcome;
    impactOnExistingChildren: ImpactAssessment;
    riskAssessmentCompleted: boolean;
    placementPlanWithin24h: boolean;
    socialWorkerContacted: boolean;
    ofstedNotified: boolean;
    existingChildrenConsulted: boolean;
    staffBriefed: boolean;
    childNeedsIdentified: boolean;
    childViewsCaptured: boolean;
    disruptionToPlacement: boolean;
    admissionApprovedBy: string;
    reviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<EmergencyAdmission>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_emergency_admissions") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      admission_date: input.admissionDate,
      admission_type: input.admissionType,
      referral_source: input.referralSource,
      matching_outcome: input.matchingOutcome,
      impact_on_existing_children: input.impactOnExistingChildren,
      risk_assessment_completed: input.riskAssessmentCompleted,
      placement_plan_within_24h: input.placementPlanWithin24h,
      social_worker_contacted: input.socialWorkerContacted,
      ofsted_notified: input.ofstedNotified,
      existing_children_consulted: input.existingChildrenConsulted,
      staff_briefed: input.staffBriefed,
      child_needs_identified: input.childNeedsIdentified,
      child_views_captured: input.childViewsCaptured,
      disruption_to_placement: input.disruptionToPlacement,
      admission_approved_by: input.admissionApprovedBy,
      review_date: input.reviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAdmission(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<EmergencyAdmission>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_emergency_admissions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAdmissionMetrics,
  identifyAdmissionAlerts,
};
