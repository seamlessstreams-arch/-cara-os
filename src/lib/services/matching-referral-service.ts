// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MATCHING & REFERRAL SERVICE
// Manages referral intake, matching assessments, and admission decisions.
// CHR 2015 Reg 8 (placement plans — matching considerations),
// Reg 9 (quality of care — matching),
// Reg 14 (healthcare — matching health needs).
//
// Tracks referrals from placing authorities, matching criteria,
// impact assessments on existing children, and admission decisions.
//
// SCCIF: Overall Experiences — "Children are carefully matched
// to the home." "Impact on existing children is considered."
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

export type ReferralStatus =
  | "received"
  | "under_assessment"
  | "matching_in_progress"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "on_hold"
  | "admitted";

export type DeclineReason =
  | "no_vacancy"
  | "matching_concerns"
  | "impact_on_current"
  | "needs_beyond_capability"
  | "age_inappropriate"
  | "safeguarding_risk"
  | "location_unsuitable"
  | "other";

export type MatchingCriteria =
  | "age_range"
  | "gender"
  | "emotional_needs"
  | "behavioural_needs"
  | "educational_needs"
  | "health_needs"
  | "cultural_background"
  | "language"
  | "religion"
  | "peer_dynamics"
  | "risk_compatibility"
  | "family_contact_needs"
  | "therapeutic_needs"
  | "location_proximity";

export type ImpactLevel =
  | "positive"
  | "neutral"
  | "minor_concern"
  | "significant_concern"
  | "not_assessed";

export interface Referral {
  id: string;
  home_id: string;
  child_name: string;
  child_age: number;
  placing_authority: string;
  social_worker_name: string;
  referral_date: string;
  status: ReferralStatus;
  decline_reason: DeclineReason | null;
  matching_criteria_met: MatchingCriteria[];
  matching_criteria_concerns: MatchingCriteria[];
  impact_on_existing: ImpactLevel;
  impact_assessment_completed: boolean;
  existing_children_consulted: boolean;
  staff_views_sought: boolean;
  trial_visit_completed: boolean;
  decision_date: string | null;
  decision_by: string | null;
  admission_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REFERRAL_STATUSES: { status: ReferralStatus; label: string }[] = [
  { status: "received", label: "Received" },
  { status: "under_assessment", label: "Under Assessment" },
  { status: "matching_in_progress", label: "Matching in Progress" },
  { status: "accepted", label: "Accepted" },
  { status: "declined", label: "Declined" },
  { status: "withdrawn", label: "Withdrawn" },
  { status: "on_hold", label: "On Hold" },
  { status: "admitted", label: "Admitted" },
];

export const DECLINE_REASONS: { reason: DeclineReason; label: string }[] = [
  { reason: "no_vacancy", label: "No Vacancy" },
  { reason: "matching_concerns", label: "Matching Concerns" },
  { reason: "impact_on_current", label: "Impact on Current Children" },
  { reason: "needs_beyond_capability", label: "Needs Beyond Capability" },
  { reason: "age_inappropriate", label: "Age Inappropriate" },
  { reason: "safeguarding_risk", label: "Safeguarding Risk" },
  { reason: "location_unsuitable", label: "Location Unsuitable" },
  { reason: "other", label: "Other" },
];

export const MATCHING_CRITERIA: { criteria: MatchingCriteria; label: string }[] = [
  { criteria: "age_range", label: "Age Range" },
  { criteria: "gender", label: "Gender" },
  { criteria: "emotional_needs", label: "Emotional Needs" },
  { criteria: "behavioural_needs", label: "Behavioural Needs" },
  { criteria: "educational_needs", label: "Educational Needs" },
  { criteria: "health_needs", label: "Health Needs" },
  { criteria: "cultural_background", label: "Cultural Background" },
  { criteria: "language", label: "Language" },
  { criteria: "religion", label: "Religion" },
  { criteria: "peer_dynamics", label: "Peer Dynamics" },
  { criteria: "risk_compatibility", label: "Risk Compatibility" },
  { criteria: "family_contact_needs", label: "Family Contact Needs" },
  { criteria: "therapeutic_needs", label: "Therapeutic Needs" },
  { criteria: "location_proximity", label: "Location Proximity" },
];

export const IMPACT_LEVELS: { level: ImpactLevel; label: string }[] = [
  { level: "positive", label: "Positive" },
  { level: "neutral", label: "Neutral" },
  { level: "minor_concern", label: "Minor Concern" },
  { level: "significant_concern", label: "Significant Concern" },
  { level: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute matching & referral metrics.
 */
export function computeReferralMetrics(
  referrals: Referral[],
): {
  total_referrals: number;
  received_count: number;
  under_assessment_count: number;
  accepted_count: number;
  declined_count: number;
  withdrawn_count: number;
  admitted_count: number;
  acceptance_rate: number;
  impact_assessments_completed: number;
  impact_assessment_rate: number;
  existing_children_consulted_rate: number;
  staff_views_sought_rate: number;
  trial_visits_completed: number;
  matching_concerns_count: number;
  by_status: Record<string, number>;
  by_decline_reason: Record<string, number>;
  by_impact_level: Record<string, number>;
  by_placing_authority: Record<string, number>;
} {
  const received = referrals.filter((r) => r.status === "received").length;
  const underAssessment = referrals.filter((r) => r.status === "under_assessment").length;
  const accepted = referrals.filter((r) => r.status === "accepted" || r.status === "admitted").length;
  const declined = referrals.filter((r) => r.status === "declined").length;
  const withdrawn = referrals.filter((r) => r.status === "withdrawn").length;
  const admitted = referrals.filter((r) => r.status === "admitted").length;

  const decided = accepted + declined;
  const acceptanceRate =
    decided > 0
      ? Math.round((accepted / decided) * 1000) / 10
      : 0;

  const impactCompleted = referrals.filter((r) => r.impact_assessment_completed).length;
  const impactRate =
    referrals.length > 0
      ? Math.round((impactCompleted / referrals.length) * 1000) / 10
      : 0;

  const consulted = referrals.filter((r) => r.existing_children_consulted).length;
  const consultedRate =
    referrals.length > 0
      ? Math.round((consulted / referrals.length) * 1000) / 10
      : 0;

  const staffViews = referrals.filter((r) => r.staff_views_sought).length;
  const staffRate =
    referrals.length > 0
      ? Math.round((staffViews / referrals.length) * 1000) / 10
      : 0;

  const trialVisits = referrals.filter((r) => r.trial_visit_completed).length;

  const matchingConcerns = referrals.filter(
    (r) => r.matching_criteria_concerns.length > 0,
  ).length;

  // By status
  const byStatus: Record<string, number> = {};
  for (const r of referrals) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }

  // By decline reason
  const byDeclineReason: Record<string, number> = {};
  for (const r of referrals) {
    if (r.decline_reason) {
      byDeclineReason[r.decline_reason] = (byDeclineReason[r.decline_reason] ?? 0) + 1;
    }
  }

  // By impact level
  const byImpactLevel: Record<string, number> = {};
  for (const r of referrals) {
    byImpactLevel[r.impact_on_existing] = (byImpactLevel[r.impact_on_existing] ?? 0) + 1;
  }

  // By placing authority
  const byPlacingAuthority: Record<string, number> = {};
  for (const r of referrals) {
    byPlacingAuthority[r.placing_authority] = (byPlacingAuthority[r.placing_authority] ?? 0) + 1;
  }

  return {
    total_referrals: referrals.length,
    received_count: received,
    under_assessment_count: underAssessment,
    accepted_count: accepted,
    declined_count: declined,
    withdrawn_count: withdrawn,
    admitted_count: admitted,
    acceptance_rate: acceptanceRate,
    impact_assessments_completed: impactCompleted,
    impact_assessment_rate: impactRate,
    existing_children_consulted_rate: consultedRate,
    staff_views_sought_rate: staffRate,
    trial_visits_completed: trialVisits,
    matching_concerns_count: matchingConcerns,
    by_status: byStatus,
    by_decline_reason: byDeclineReason,
    by_impact_level: byImpactLevel,
    by_placing_authority: byPlacingAuthority,
  };
}

/**
 * Identify referral and matching alerts.
 */
export function identifyReferralAlerts(
  referrals: Referral[],
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

  // Accepted without impact assessment
  for (const r of referrals) {
    if ((r.status === "accepted" || r.status === "admitted") && !r.impact_assessment_completed) {
      alerts.push({
        type: "no_impact_assessment",
        severity: "critical",
        message: `${r.child_name} accepted/admitted without impact assessment on existing children — complete assessment immediately`,
        id: r.id,
      });
    }
  }

  // Significant concern impact but still accepted
  for (const r of referrals) {
    if (
      (r.status === "accepted" || r.status === "admitted") &&
      r.impact_on_existing === "significant_concern"
    ) {
      alerts.push({
        type: "significant_concern_accepted",
        severity: "high",
        message: `${r.child_name} admitted despite significant concern about impact on existing children — ensure mitigations are in place`,
        id: r.id,
      });
    }
  }

  // Referral pending too long (received but not progressed)
  for (const r of referrals) {
    if (r.status === "received") {
      alerts.push({
        type: "referral_pending",
        severity: "medium",
        message: `Referral for ${r.child_name} (age ${r.child_age}) from ${r.placing_authority} received ${r.referral_date} — begin assessment`,
        id: r.id,
      });
    }
  }

  // Matching concerns flagged
  for (const r of referrals) {
    if (r.matching_criteria_concerns.length > 0 && r.status !== "declined") {
      alerts.push({
        type: "matching_concerns",
        severity: "high",
        message: `${r.child_name} has ${r.matching_criteria_concerns.length} matching ${r.matching_criteria_concerns.length === 1 ? "concern" : "concerns"}: ${r.matching_criteria_concerns.map((c) => c.replace(/_/g, " ")).join(", ")}`,
        id: r.id,
      });
    }
  }

  // Existing children not consulted
  for (const r of referrals) {
    if ((r.status === "accepted" || r.status === "admitted") && !r.existing_children_consulted) {
      alerts.push({
        type: "children_not_consulted",
        severity: "medium",
        message: `Existing children not consulted about admission of ${r.child_name} — their views should be sought`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listReferrals(
  homeId: string,
  filters?: {
    status?: ReferralStatus;
    placingAuthority?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<Referral[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_referrals") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.placingAuthority) q = q.eq("placing_authority", filters.placingAuthority);
  if (filters?.dateFrom) q = q.gte("referral_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("referral_date", filters.dateTo);
  q = q.order("referral_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReferral(
  input: {
    homeId: string;
    childName: string;
    childAge: number;
    placingAuthority: string;
    socialWorkerName: string;
    referralDate: string;
    status: ReferralStatus;
    matchingCriteriaMet: MatchingCriteria[];
    matchingCriteriaConcerns: MatchingCriteria[];
    impactOnExisting: ImpactLevel;
    impactAssessmentCompleted: boolean;
    existingChildrenConsulted: boolean;
    staffViewsSought: boolean;
    trialVisitCompleted: boolean;
    notes?: string;
  },
): Promise<ServiceResult<Referral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_referrals") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_age: input.childAge,
      placing_authority: input.placingAuthority,
      social_worker_name: input.socialWorkerName,
      referral_date: input.referralDate,
      status: input.status,
      decline_reason: null,
      matching_criteria_met: input.matchingCriteriaMet,
      matching_criteria_concerns: input.matchingCriteriaConcerns,
      impact_on_existing: input.impactOnExisting,
      impact_assessment_completed: input.impactAssessmentCompleted,
      existing_children_consulted: input.existingChildrenConsulted,
      staff_views_sought: input.staffViewsSought,
      trial_visit_completed: input.trialVisitCompleted,
      decision_date: null,
      decision_by: null,
      admission_date: null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReferral(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<Referral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_referrals") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeReferralMetrics,
  identifyReferralAlerts,
};
