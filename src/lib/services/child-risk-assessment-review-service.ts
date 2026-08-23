// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD RISK ASSESSMENT REVIEW SERVICE
// Tracks periodic reviews of individual child risk assessments to
// ensure they remain current, accurate, and responsive to
// changing needs and circumstances.
// CHR 2015 Reg 13 (leadership and management — risk assessment),
// Reg 34 (care planning — risk management),
// Reg 12 (health and wellbeing — safety of children).
//
// Covers: risk assessment currency, review scheduling, multi-agency
// input, child participation, plan updates, dynamic risk factors,
// and escalation tracking.
//
// SCCIF: Safety — "Risk assessments are current and reviewed regularly."
// "Children contribute to their own risk assessments."
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
  | "harm_to_others"
  | "exploitation"
  | "missing_from_care"
  | "substance_misuse"
  | "online_safety"
  | "bullying"
  | "radicalisation"
  | "fire_setting"
  | "other";

export type ReviewOutcome =
  | "risk_reduced"
  | "risk_unchanged"
  | "risk_increased"
  | "new_risk_identified"
  | "risk_closed";

export type RiskLevel =
  | "very_high"
  | "high"
  | "medium"
  | "low"
  | "minimal";

export type ReviewFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "six_monthly";

export interface ChildRiskAssessmentReviewRecord {
  id: string;
  home_id: string;
  risk_domain: RiskDomain;
  review_outcome: ReviewOutcome;
  current_risk_level: RiskLevel;
  review_frequency: ReviewFrequency;
  review_date: string;
  child_name: string;
  child_id: string | null;
  reviewed_by: string;
  child_participated: boolean;
  social_worker_consulted: boolean;
  multi_agency_input: boolean;
  triggers_updated: boolean;
  protective_factors_reviewed: boolean;
  safety_plan_updated: boolean;
  staff_briefed: boolean;
  management_oversight: boolean;
  evidence_documented: boolean;
  dynamic_factors_assessed: boolean;
  historical_factors_reviewed: boolean;
  contingency_plan_current: boolean;
  issues_found: string[];
  actions_taken: string[];
  previous_risk_level: string | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RISK_DOMAINS: { domain: RiskDomain; label: string }[] = [
  { domain: "self_harm", label: "Self-Harm" },
  { domain: "harm_to_others", label: "Harm to Others" },
  { domain: "exploitation", label: "Exploitation" },
  { domain: "missing_from_care", label: "Missing from Care" },
  { domain: "substance_misuse", label: "Substance Misuse" },
  { domain: "online_safety", label: "Online Safety" },
  { domain: "bullying", label: "Bullying" },
  { domain: "radicalisation", label: "Radicalisation" },
  { domain: "fire_setting", label: "Fire Setting" },
  { domain: "other", label: "Other" },
];

export const REVIEW_OUTCOMES: { outcome: ReviewOutcome; label: string }[] = [
  { outcome: "risk_reduced", label: "Risk Reduced" },
  { outcome: "risk_unchanged", label: "Risk Unchanged" },
  { outcome: "risk_increased", label: "Risk Increased" },
  { outcome: "new_risk_identified", label: "New Risk Identified" },
  { outcome: "risk_closed", label: "Risk Closed" },
];

export const RISK_LEVELS: { level: RiskLevel; label: string }[] = [
  { level: "very_high", label: "Very High" },
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
  { level: "minimal", label: "Minimal" },
];

export const REVIEW_FREQUENCIES: { frequency: ReviewFrequency; label: string }[] = [
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "six_monthly", label: "Six Monthly" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeChildRiskReviewMetrics(
  records: ChildRiskAssessmentReviewRecord[],
): {
  total_reviews: number;
  risk_increased_count: number;
  new_risk_count: number;
  risk_reduced_count: number;
  very_high_count: number;
  child_participated_rate: number | null;
  social_worker_consulted_rate: number | null;
  multi_agency_rate: number | null;
  triggers_updated_rate: number | null;
  protective_factors_rate: number | null;
  safety_plan_updated_rate: number | null;
  staff_briefed_rate: number | null;
  management_oversight_rate: number | null;
  evidence_documented_rate: number | null;
  dynamic_factors_rate: number | null;
  historical_factors_rate: number | null;
  contingency_plan_rate: number | null;
  unique_children: number;
  by_risk_domain: Record<string, number>;
  by_review_outcome: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_review_frequency: Record<string, number>;
} {
  const riskIncreased = records.filter((r) => r.review_outcome === "risk_increased").length;
  const newRisk = records.filter((r) => r.review_outcome === "new_risk_identified").length;
  const riskReduced = records.filter((r) => r.review_outcome === "risk_reduced").length;
  const veryHigh = records.filter((r) => r.current_risk_level === "very_high").length;

  const boolRate = (field: keyof ChildRiskAssessmentReviewRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byDomain: Record<string, number> = {};
  for (const r of records) byDomain[r.risk_domain] = (byDomain[r.risk_domain] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.review_outcome] = (byOutcome[r.review_outcome] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.current_risk_level] = (byLevel[r.current_risk_level] ?? 0) + 1;

  const byFreq: Record<string, number> = {};
  for (const r of records) byFreq[r.review_frequency] = (byFreq[r.review_frequency] ?? 0) + 1;

  return {
    total_reviews: records.length,
    risk_increased_count: riskIncreased,
    new_risk_count: newRisk,
    risk_reduced_count: riskReduced,
    very_high_count: veryHigh,
    child_participated_rate: boolRate("child_participated"),
    social_worker_consulted_rate: boolRate("social_worker_consulted"),
    multi_agency_rate: boolRate("multi_agency_input"),
    triggers_updated_rate: boolRate("triggers_updated"),
    protective_factors_rate: boolRate("protective_factors_reviewed"),
    safety_plan_updated_rate: boolRate("safety_plan_updated"),
    staff_briefed_rate: boolRate("staff_briefed"),
    management_oversight_rate: boolRate("management_oversight"),
    evidence_documented_rate: boolRate("evidence_documented"),
    dynamic_factors_rate: boolRate("dynamic_factors_assessed"),
    historical_factors_rate: boolRate("historical_factors_reviewed"),
    contingency_plan_rate: boolRate("contingency_plan_current"),
    unique_children: uniqueChildren,
    by_risk_domain: byDomain,
    by_review_outcome: byOutcome,
    by_risk_level: byLevel,
    by_review_frequency: byFreq,
  };
}

export function identifyChildRiskReviewAlerts(
  records: ChildRiskAssessmentReviewRecord[],
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

  // Risk increased without safety plan update
  for (const r of records) {
    if (r.review_outcome === "risk_increased" && !r.safety_plan_updated) {
      alerts.push({
        type: "risk_increased_no_plan",
        severity: "critical",
        message: `${r.child_name} risk increased in ${r.risk_domain.replace(/_/g, " ")} on ${r.review_date} — safety plan not updated`,
        id: r.id,
      });
    }
  }

  // Child not participated
  const noChild = records.filter((r) => !r.child_participated).length;
  if (noChild >= 1) {
    alerts.push({
      type: "child_not_participated",
      severity: "high",
      message: `${noChild} ${noChild === 1 ? "review has" : "reviews have"} no child participation — ensure child voice in risk assessment`,
      id: "child_not_participated",
    });
  }

  // Staff not briefed
  const notBriefed = records.filter((r) => !r.staff_briefed).length;
  if (notBriefed >= 1) {
    alerts.push({
      type: "staff_not_briefed",
      severity: "high",
      message: `${notBriefed} ${notBriefed === 1 ? "review has" : "reviews have"} not briefed staff — ensure all staff aware of risk changes`,
      id: "staff_not_briefed",
    });
  }

  // Triggers not updated
  const noTriggers = records.filter((r) => !r.triggers_updated).length;
  if (noTriggers >= 2) {
    alerts.push({
      type: "triggers_not_updated",
      severity: "medium",
      message: `${noTriggers} reviews without triggers updated — keep risk triggers current`,
      id: "triggers_not_updated",
    });
  }

  // Contingency plan not current
  const noContingency = records.filter((r) => !r.contingency_plan_current).length;
  if (noContingency >= 2) {
    alerts.push({
      type: "contingency_not_current",
      severity: "medium",
      message: `${noContingency} reviews with contingency plans not current — update emergency responses`,
      id: "contingency_not_current",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    riskDomain?: RiskDomain;
    reviewOutcome?: ReviewOutcome;
    currentRiskLevel?: RiskLevel;
    reviewFrequency?: ReviewFrequency;
    limit?: number;
  },
): Promise<ServiceResult<ChildRiskAssessmentReviewRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_risk_assessment_reviews") as SB).select("*").eq("home_id", homeId);
  if (filters?.riskDomain) q = q.eq("risk_domain", filters.riskDomain);
  if (filters?.reviewOutcome) q = q.eq("review_outcome", filters.reviewOutcome);
  if (filters?.currentRiskLevel) q = q.eq("current_risk_level", filters.currentRiskLevel);
  if (filters?.reviewFrequency) q = q.eq("review_frequency", filters.reviewFrequency);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    riskDomain: RiskDomain;
    reviewOutcome: ReviewOutcome;
    currentRiskLevel: RiskLevel;
    reviewFrequency: ReviewFrequency;
    reviewDate: string;
    childName: string;
    childId?: string | null;
    reviewedBy: string;
    childParticipated?: boolean;
    socialWorkerConsulted?: boolean;
    multiAgencyInput?: boolean;
    triggersUpdated?: boolean;
    protectiveFactorsReviewed?: boolean;
    safetyPlanUpdated?: boolean;
    staffBriefed?: boolean;
    managementOversight?: boolean;
    evidenceDocumented?: boolean;
    dynamicFactorsAssessed?: boolean;
    historicalFactorsReviewed?: boolean;
    contingencyPlanCurrent?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    previousRiskLevel?: string | null;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ChildRiskAssessmentReviewRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_risk_assessment_reviews") as SB)
    .insert({
      home_id: payload.homeId,
      risk_domain: payload.riskDomain,
      review_outcome: payload.reviewOutcome,
      current_risk_level: payload.currentRiskLevel,
      review_frequency: payload.reviewFrequency,
      review_date: payload.reviewDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      reviewed_by: payload.reviewedBy,
      child_participated: payload.childParticipated ?? true,
      social_worker_consulted: payload.socialWorkerConsulted ?? true,
      multi_agency_input: payload.multiAgencyInput ?? false,
      triggers_updated: payload.triggersUpdated ?? true,
      protective_factors_reviewed: payload.protectiveFactorsReviewed ?? true,
      safety_plan_updated: payload.safetyPlanUpdated ?? true,
      staff_briefed: payload.staffBriefed ?? true,
      management_oversight: payload.managementOversight ?? true,
      evidence_documented: payload.evidenceDocumented ?? true,
      dynamic_factors_assessed: payload.dynamicFactorsAssessed ?? true,
      historical_factors_reviewed: payload.historicalFactorsReviewed ?? true,
      contingency_plan_current: payload.contingencyPlanCurrent ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      previous_risk_level: payload.previousRiskLevel ?? null,
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
    riskDomain: RiskDomain;
    reviewOutcome: ReviewOutcome;
    currentRiskLevel: RiskLevel;
    reviewFrequency: ReviewFrequency;
    reviewDate: string;
    childName: string;
    childId: string | null;
    reviewedBy: string;
    childParticipated: boolean;
    socialWorkerConsulted: boolean;
    multiAgencyInput: boolean;
    triggersUpdated: boolean;
    protectiveFactorsReviewed: boolean;
    safetyPlanUpdated: boolean;
    staffBriefed: boolean;
    managementOversight: boolean;
    evidenceDocumented: boolean;
    dynamicFactorsAssessed: boolean;
    historicalFactorsReviewed: boolean;
    contingencyPlanCurrent: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    previousRiskLevel: string | null;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildRiskAssessmentReviewRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.riskDomain !== undefined) mapped.risk_domain = updates.riskDomain;
  if (updates.reviewOutcome !== undefined) mapped.review_outcome = updates.reviewOutcome;
  if (updates.currentRiskLevel !== undefined) mapped.current_risk_level = updates.currentRiskLevel;
  if (updates.reviewFrequency !== undefined) mapped.review_frequency = updates.reviewFrequency;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.reviewedBy !== undefined) mapped.reviewed_by = updates.reviewedBy;
  if (updates.childParticipated !== undefined) mapped.child_participated = updates.childParticipated;
  if (updates.socialWorkerConsulted !== undefined) mapped.social_worker_consulted = updates.socialWorkerConsulted;
  if (updates.multiAgencyInput !== undefined) mapped.multi_agency_input = updates.multiAgencyInput;
  if (updates.triggersUpdated !== undefined) mapped.triggers_updated = updates.triggersUpdated;
  if (updates.protectiveFactorsReviewed !== undefined) mapped.protective_factors_reviewed = updates.protectiveFactorsReviewed;
  if (updates.safetyPlanUpdated !== undefined) mapped.safety_plan_updated = updates.safetyPlanUpdated;
  if (updates.staffBriefed !== undefined) mapped.staff_briefed = updates.staffBriefed;
  if (updates.managementOversight !== undefined) mapped.management_oversight = updates.managementOversight;
  if (updates.evidenceDocumented !== undefined) mapped.evidence_documented = updates.evidenceDocumented;
  if (updates.dynamicFactorsAssessed !== undefined) mapped.dynamic_factors_assessed = updates.dynamicFactorsAssessed;
  if (updates.historicalFactorsReviewed !== undefined) mapped.historical_factors_reviewed = updates.historicalFactorsReviewed;
  if (updates.contingencyPlanCurrent !== undefined) mapped.contingency_plan_current = updates.contingencyPlanCurrent;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.previousRiskLevel !== undefined) mapped.previous_risk_level = updates.previousRiskLevel;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_child_risk_assessment_reviews") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeChildRiskReviewMetrics,
  identifyChildRiskReviewAlerts,
};
