// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMOTIONAL WELLBEING OUTCOME SERVICE
// Tracks validated outcome measures (SDQ, RCADS, Goodman strengths),
// wellbeing scores over time, clinical thresholds, and trend analysis
// for children in residential care.
// CHR 2015 Reg 12 (health and wellbeing — emotional and mental health),
// Reg 7 (individual child — understanding emotional needs).
//
// Covers: outcome measure type, raw scores, clinical banding, trend
// direction, assessment context, child voice, and care plan linkage.
//
// SCCIF: Experiences — "Children's emotional wellbeing is understood
// and supported." "Outcomes measures inform care planning."
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

// ── Enums ─────────────────────────────────────────────────────────────────

export const OUTCOME_MEASURES = [
  "sdq_total",
  "sdq_emotional",
  "sdq_conduct",
  "sdq_hyperactivity",
  "sdq_peer_problems",
  "sdq_prosocial",
  "rcads_anxiety",
  "rcads_depression",
  "wellbeing_scale",
  "self_report",
] as const;
export type OutcomeMeasure = (typeof OUTCOME_MEASURES)[number];

export const CLINICAL_BANDS = [
  "normal",
  "borderline",
  "clinical",
  "high_clinical",
  "crisis",
] as const;
export type ClinicalBand = (typeof CLINICAL_BANDS)[number];

export const TREND_DIRECTIONS = [
  "improving",
  "stable",
  "declining",
  "fluctuating",
  "insufficient_data",
] as const;
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];

export const ASSESSMENT_CONTEXTS = [
  "routine_review",
  "admission",
  "placement_change",
  "post_incident",
  "therapy_review",
  "lac_review",
  "annual_health",
  "self_initiated",
  "crisis_response",
  "discharge",
] as const;
export type AssessmentContext = (typeof ASSESSMENT_CONTEXTS)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface EmotionalWellbeingOutcomeRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  assessment_date: string;
  outcome_measure: string;
  raw_score: number;
  clinical_band: string;
  trend_direction: string;
  assessment_context: string;
  previous_score: number | null;
  clinician_name: string | null;
  child_self_reported: boolean;
  discussed_with_child: boolean;
  informed_care_plan: boolean;
  referral_made: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeEmotionalWellbeingMetrics(
  rows: EmotionalWellbeingOutcomeRow[],
): {
  total_assessments: number;
  clinical_count: number;
  crisis_count: number;
  declining_count: number;
  improving_count: number;
  child_self_reported_rate: number;
  discussed_with_child_rate: number;
  informed_care_plan_rate: number;
  referral_made_rate: number;
  clinical_band_breakdown: Record<string, number>;
  measure_breakdown: Record<string, number>;
  unique_children: number;
} {
  const clinicalCount = rows.filter(
    (r) =>
      r.clinical_band === "clinical" ||
      r.clinical_band === "high_clinical" ||
      r.clinical_band === "crisis",
  ).length;
  const crisisCount = rows.filter((r) => r.clinical_band === "crisis").length;
  const decliningCount = rows.filter((r) => r.trend_direction === "declining").length;
  const improvingCount = rows.filter((r) => r.trend_direction === "improving").length;

  const boolRate = (field: keyof EmotionalWellbeingOutcomeRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  const bandBreakdown: Record<string, number> = {};
  for (const r of rows) bandBreakdown[r.clinical_band] = (bandBreakdown[r.clinical_band] ?? 0) + 1;

  const measureBreakdown: Record<string, number> = {};
  for (const r of rows) measureBreakdown[r.outcome_measure] = (measureBreakdown[r.outcome_measure] ?? 0) + 1;

  return {
    total_assessments: rows.length,
    clinical_count: clinicalCount,
    crisis_count: crisisCount,
    declining_count: decliningCount,
    improving_count: improvingCount,
    child_self_reported_rate: boolRate("child_self_reported"),
    discussed_with_child_rate: boolRate("discussed_with_child"),
    informed_care_plan_rate: boolRate("informed_care_plan"),
    referral_made_rate: boolRate("referral_made"),
    clinical_band_breakdown: bandBreakdown,
    measure_breakdown: measureBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeEmotionalWellbeingAlerts(
  rows: EmotionalWellbeingOutcomeRow[],
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

  // Critical: crisis band + no referral made
  for (const r of rows) {
    if (r.clinical_band === "crisis" && !r.referral_made) {
      alerts.push({
        type: "crisis_no_referral",
        severity: "critical",
        message: `${r.child_name} scored in crisis band on ${r.outcome_measure.replace(/_/g, " ")} without a referral made — immediate clinical escalation required`,
        record_id: r.id,
      });
    }
  }

  // High: clinical/high_clinical + declining trend
  const clinicalDeclining = rows.filter(
    (r) =>
      (r.clinical_band === "clinical" || r.clinical_band === "high_clinical") &&
      r.trend_direction === "declining",
  ).length;
  if (clinicalDeclining >= 1) {
    alerts.push({
      type: "clinical_declining",
      severity: "high",
      message: `${clinicalDeclining} ${clinicalDeclining === 1 ? "assessment shows" : "assessments show"} clinical/high-clinical scores with declining trend — review therapeutic support`,
    });
  }

  // High: child views not discussed in multiple assessments
  const notDiscussed = rows.filter((r) => !r.discussed_with_child).length;
  if (notDiscussed >= 2) {
    alerts.push({
      type: "child_views_not_discussed",
      severity: "high",
      message: `${notDiscussed} assessments completed without discussing results with the child — ensure child participation in outcome reviews`,
    });
  }

  // Medium: care plan not informed by multiple assessments
  const notInformed = rows.filter((r) => !r.informed_care_plan).length;
  if (notInformed >= 2) {
    alerts.push({
      type: "care_plan_not_informed",
      severity: "medium",
      message: `${notInformed} assessments have not informed the care plan — ensure outcome measures feed into care planning`,
    });
  }

  return alerts;
}

export function generateEmotionalWellbeingCaraInsights(
  metrics: ReturnType<typeof computeEmotionalWellbeingMetrics>,
  alerts: ReturnType<typeof computeEmotionalWellbeingAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (pink-themed)
  const clinicalPct =
    metrics.total_assessments > 0
      ? Math.round((metrics.clinical_count / metrics.total_assessments) * 1000) / 10
      : 0;
  insights.push(
    `[pink] ${metrics.total_assessments} emotional wellbeing assessments recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.clinical_count} (${clinicalPct}%) scored in clinical/high-clinical/crisis bands. ` +
      `${metrics.improving_count} improving, ${metrics.declining_count} declining. ` +
      `Child self-reported rate: ${metrics.child_self_reported_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Discussed-with-child rate: ${metrics.discussed_with_child_rate}%. ` +
        `Informed-care-plan rate: ${metrics.informed_care_plan_rate}%. ` +
        `Referral-made rate: ${metrics.referral_made_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns. ` +
        `Discussed-with-child rate: ${metrics.discussed_with_child_rate}%. ` +
        `Informed-care-plan rate: ${metrics.informed_care_plan_rate}%. ` +
        `Referral-made rate: ${metrics.referral_made_rate}%.`,
    );
  }

  // Insight 3: Reflective question about emotional wellbeing and child voice
  insights.push(
    `[reflect] Are outcome measures being used meaningfully to shape each child's emotional wellbeing support, ` +
      `and are children genuinely involved in understanding and discussing their own results?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listEmotionalWellbeingOutcomes(
  homeId: string,
): Promise<ServiceResult<EmotionalWellbeingOutcomeRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_emotional_wellbeing_outcomes") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createEmotionalWellbeingOutcome(payload: {
  homeId: string;
  childName: string;
  childId?: string | null;
  assessmentDate: string;
  outcomeMeasure: OutcomeMeasure;
  rawScore: number;
  clinicalBand: ClinicalBand;
  trendDirection: TrendDirection;
  assessmentContext: AssessmentContext;
  previousScore?: number | null;
  clinicianName?: string | null;
  childSelfReported?: boolean;
  discussedWithChild?: boolean;
  informedCarePlan?: boolean;
  referralMade?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<EmotionalWellbeingOutcomeRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_emotional_wellbeing_outcomes") as SB)
    .insert({
      home_id: payload.homeId,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessment_date: payload.assessmentDate,
      outcome_measure: payload.outcomeMeasure,
      raw_score: payload.rawScore,
      clinical_band: payload.clinicalBand,
      trend_direction: payload.trendDirection,
      assessment_context: payload.assessmentContext,
      previous_score: payload.previousScore ?? null,
      clinician_name: payload.clinicianName ?? null,
      child_self_reported: payload.childSelfReported ?? false,
      discussed_with_child: payload.discussedWithChild ?? true,
      informed_care_plan: payload.informedCarePlan ?? true,
      referral_made: payload.referralMade ?? false,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEmotionalWellbeingMetrics,
  computeEmotionalWellbeingAlerts,
  generateEmotionalWellbeingCaraInsights,
};
