// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD SUBSTANCE MISUSE SCREENING SERVICE
// Tracks substance misuse screenings, interventions, and referrals
// for children in residential care. Monitors risk levels, safety
// planning, and multi-agency coordination.
// CHR 2015 Reg 10 (health and wellbeing),
// CHR 2015 Reg 12 (protection of children),
// CHR 2015 Reg 34 (placement plans — risk assessment).
//
// Covers: substance screening, risk assessment, intervention types,
// referral tracking, safety planning, and follow-up scheduling.
//
// SCCIF: Helped & Protected — "Children at risk of substance misuse
// are identified early and supported through effective intervention."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export const SUBSTANCE_TYPES = [
  "Alcohol",
  "Cannabis",
  "Tobacco",
  "Solvents",
  "NPS",
  "Prescription",
  "Other",
] as const;
export type SubstanceType = (typeof SUBSTANCE_TYPES)[number];

export const SCREENING_OUTCOMES = [
  "No Concern",
  "Low Risk",
  "Moderate Risk",
  "High Risk",
  "Immediate Intervention",
] as const;
export type ScreeningOutcome = (typeof SCREENING_OUTCOMES)[number];

export const INTERVENTION_TYPES = [
  "Education",
  "Counselling",
  "CAMHS Referral",
  "Specialist Service",
  "Multi-Agency",
  "None Required",
] as const;
export type InterventionType = (typeof INTERVENTION_TYPES)[number];

export interface ChildSubstanceMisuseScreeningRow {
  id: string;
  home_id: string;
  child_name: string;
  screening_date: string;
  substance_type: SubstanceType;
  screening_outcome: ScreeningOutcome;
  intervention_type: InterventionType | null;
  referral_made: boolean;
  referral_agency: string | null;
  risk_assessment_completed: boolean;
  safety_plan_in_place: boolean;
  parental_notification: boolean;
  social_worker_notified: boolean;
  follow_up_date: string | null;
  assessor_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: ChildSubstanceMisuseScreeningRow[],
): {
  total_screenings: number;
  high_risk_count: number;
  immediate_intervention_count: number;
  no_concern_count: number;
  referral_rate: number;
  risk_assessment_rate: number;
  safety_plan_rate: number;
  parental_notification_rate: number;
  social_worker_rate: number;
  follow_up_rate: number;
  unique_children: number;
  unique_assessors: number;
  substance_type_breakdown: Record<string, number>;
  screening_outcome_breakdown: Record<string, number>;
  intervention_type_breakdown: Record<string, number>;
} {
  const highRisk = rows.filter((r) => r.screening_outcome === "High Risk").length;
  const immediateIntervention = rows.filter((r) => r.screening_outcome === "Immediate Intervention").length;
  const noConcern = rows.filter((r) => r.screening_outcome === "No Concern").length;

  const boolRate = (fn: (r: ChildSubstanceMisuseScreeningRow) => boolean) => {
    const count = rows.filter(fn).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const referralRate = boolRate((r) => r.referral_made);
  const riskAssessmentRate = boolRate((r) => r.risk_assessment_completed);
  const safetyPlanRate = boolRate((r) => r.safety_plan_in_place);
  const parentalNotificationRate = boolRate((r) => r.parental_notification);
  const socialWorkerRate = boolRate((r) => r.social_worker_notified);
  const followUpRate = boolRate((r) => r.follow_up_date !== null);

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  const substanceTypeBreakdown: Record<string, number> = {};
  for (const r of rows) substanceTypeBreakdown[r.substance_type] = (substanceTypeBreakdown[r.substance_type] ?? 0) + 1;

  const screeningOutcomeBreakdown: Record<string, number> = {};
  for (const r of rows) screeningOutcomeBreakdown[r.screening_outcome] = (screeningOutcomeBreakdown[r.screening_outcome] ?? 0) + 1;

  const interventionTypeBreakdown: Record<string, number> = {};
  for (const r of rows) {
    if (r.intervention_type !== null) {
      interventionTypeBreakdown[r.intervention_type] = (interventionTypeBreakdown[r.intervention_type] ?? 0) + 1;
    }
  }

  return {
    total_screenings: rows.length,
    high_risk_count: highRisk,
    immediate_intervention_count: immediateIntervention,
    no_concern_count: noConcern,
    referral_rate: referralRate,
    risk_assessment_rate: riskAssessmentRate,
    safety_plan_rate: safetyPlanRate,
    parental_notification_rate: parentalNotificationRate,
    social_worker_rate: socialWorkerRate,
    follow_up_rate: followUpRate,
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
    substance_type_breakdown: substanceTypeBreakdown,
    screening_outcome_breakdown: screeningOutcomeBreakdown,
    intervention_type_breakdown: interventionTypeBreakdown,
  };
}

export function computeAlerts(
  rows: ChildSubstanceMisuseScreeningRow[],
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

  // Critical: Immediate Intervention without safety plan
  for (const r of rows) {
    if (r.screening_outcome === "Immediate Intervention" && !r.safety_plan_in_place) {
      alerts.push({
        type: "immediate_intervention_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} requires immediate intervention for ${r.substance_type} misuse without a safety plan in place — implement safety plan urgently`,
        record_id: r.id,
      });
    }
  }

  // High: High Risk without referral
  for (const r of rows) {
    if (r.screening_outcome === "High Risk" && !r.referral_made) {
      alerts.push({
        type: "high_risk_no_referral",
        severity: "high",
        message: `${r.child_name} screened as High Risk for ${r.substance_type} misuse without referral — arrange referral to appropriate service`,
        record_id: r.id,
      });
    }
  }

  // Medium: Screening without risk assessment completed
  for (const r of rows) {
    if (!r.risk_assessment_completed) {
      alerts.push({
        type: "no_risk_assessment",
        severity: "medium",
        message: `Risk assessment not completed for ${r.child_name} (${r.substance_type} screening) — complete risk assessment promptly`,
        record_id: r.id,
      });
    }
  }

  // Medium: Social worker not notified when outcome is not "No Concern"
  for (const r of rows) {
    if (r.screening_outcome !== "No Concern" && !r.social_worker_notified) {
      alerts.push({
        type: "social_worker_not_notified",
        severity: "medium",
        message: `Social worker not notified for ${r.child_name} with ${r.screening_outcome} outcome — notify social worker as required`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function computeCaraInsights(
  metrics: ReturnType<typeof computeMetrics>,
  alerts?: ReturnType<typeof computeAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[red] ${metrics.total_screenings} substance misuse screenings recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} high risk, ${metrics.immediate_intervention_count} immediate intervention, ${metrics.no_concern_count} no concern. ` +
      `Referral rate: ${metrics.referral_rate}%. Risk assessment rate: ${metrics.risk_assessment_rate}%.`,
  );

  // Insight 2: Priority actions from alerts
  const alertList = alerts ?? [];
  const criticalAlerts = alertList.filter((a) => a.severity === "critical");
  const highAlerts = alertList.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Parental notification rate: ${metrics.parental_notification_rate}%. ` +
        `Social worker notification rate: ${metrics.social_worker_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Parental notification rate: ${metrics.parental_notification_rate}%. ` +
        `Social worker notification rate: ${metrics.social_worker_rate}%.`,
    );
  }

  // Insight 3: Reflective question
  insights.push(
    `[reflect] Are substance misuse screenings being used proactively to identify early warning signs, and is each child receiving ` +
      `tailored support that addresses the root causes of substance misuse rather than just the presenting behaviour?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildSubstanceMisuseScreenings(
  homeId: string,
): Promise<ServiceResult<ChildSubstanceMisuseScreeningRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_substance_misuse_screenings") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("screening_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildSubstanceMisuseScreening(input: {
  homeId: string;
  childName: string;
  screeningDate: string;
  substanceType: SubstanceType;
  screeningOutcome: ScreeningOutcome;
  interventionType?: InterventionType | null;
  referralMade?: boolean;
  referralAgency?: string | null;
  riskAssessmentCompleted?: boolean;
  safetyPlanInPlace?: boolean;
  parentalNotification?: boolean;
  socialWorkerNotified?: boolean;
  followUpDate?: string | null;
  assessorName: string;
  notes?: string | null;
}): Promise<ServiceResult<ChildSubstanceMisuseScreeningRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_substance_misuse_screenings") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      screening_date: input.screeningDate,
      substance_type: input.substanceType,
      screening_outcome: input.screeningOutcome,
      intervention_type: input.interventionType ?? null,
      referral_made: input.referralMade ?? false,
      referral_agency: input.referralAgency ?? null,
      risk_assessment_completed: input.riskAssessmentCompleted ?? false,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      parental_notification: input.parentalNotification ?? false,
      social_worker_notified: input.socialWorkerNotified ?? false,
      follow_up_date: input.followUpDate ?? null,
      assessor_name: input.assessorName,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateChildSubstanceMisuseScreening(
  id: string,
  homeId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ChildSubstanceMisuseScreeningRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_substance_misuse_screenings") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("home_id", homeId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
};
