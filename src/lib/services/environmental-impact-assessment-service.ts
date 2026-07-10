// ══════════════════════════════════════════════════════════════════════════════
// CARA — ENVIRONMENTAL IMPACT ASSESSMENT SERVICE
// Manages Environmental Impact Assessments — energy efficiency,
// waste management, sustainability measures, carbon footprint reduction,
// and environmental responsibility for children's homes.
// CHR 2015 Reg 25 (premises — appropriate standard),
// Reg 6 (quality of care — sustainable living environment).
//
// Covers: energy efficiency, waste management, water conservation,
// carbon footprint, recycling compliance, food waste reduction,
// transport emissions, green spaces, sustainable procurement,
// and biodiversity.
//
// SCCIF: Overall Experiences — "The home operates responsibly."
// "Children learn about environmental responsibility."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const ASSESSMENT_AREAS = [
  "energy_efficiency",
  "waste_management",
  "water_conservation",
  "carbon_footprint",
  "recycling_compliance",
  "food_waste_reduction",
  "transport_emissions",
  "green_spaces",
  "sustainable_procurement",
  "biodiversity",
] as const;
export type AssessmentArea = (typeof ASSESSMENT_AREAS)[number];

export const PERFORMANCE_RATINGS = [
  "excellent",
  "good",
  "satisfactory",
  "below_standard",
  "poor",
] as const;
export type PerformanceRating = (typeof PERFORMANCE_RATINGS)[number];

export const IMPROVEMENT_STATUSES = [
  "not_started",
  "planning",
  "in_progress",
  "completed",
  "ongoing_monitoring",
] as const;
export type ImprovementStatus = (typeof IMPROVEMENT_STATUSES)[number];

export const MEASUREMENT_PERIODS = [
  "weekly",
  "monthly",
  "quarterly",
  "six_monthly",
  "annual",
  "ad_hoc",
  "seasonal",
  "post_improvement",
  "baseline",
  "target_review",
] as const;
export type MeasurementPeriod = (typeof MEASUREMENT_PERIODS)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface EnvironmentalImpactAssessmentRow {
  id: string;
  home_id: string;
  assessment_date: string;
  assessment_area: AssessmentArea;
  performance_rating: PerformanceRating;
  improvement_status: ImprovementStatus;
  measurement_period: MeasurementPeriod;
  assessor_name: string;
  baseline_value: number | null;
  current_value: number | null;
  target_value: number | null;
  children_involved: boolean;
  staff_trained: boolean;
  cost_saving_identified: boolean;
  action_plan_created: boolean;
  progress_monitored: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listEnvironmentalImpactAssessments(
  homeId: string,
): Promise<ServiceResult<EnvironmentalImpactAssessmentRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_environmental_impact_assessments") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("assessment_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createEnvironmentalImpactAssessment(input: {
  homeId: string;
  assessmentDate: string;
  assessmentArea: AssessmentArea;
  performanceRating: PerformanceRating;
  improvementStatus: ImprovementStatus;
  measurementPeriod: MeasurementPeriod;
  assessorName: string;
  baselineValue?: number | null;
  currentValue?: number | null;
  targetValue?: number | null;
  childrenInvolved: boolean;
  staffTrained: boolean;
  costSavingIdentified: boolean;
  actionPlanCreated: boolean;
  progressMonitored: boolean;
  notes?: string | null;
}): Promise<ServiceResult<EnvironmentalImpactAssessmentRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_environmental_impact_assessments") as any)
    .insert({
      home_id: input.homeId,
      assessment_date: input.assessmentDate,
      assessment_area: input.assessmentArea,
      performance_rating: input.performanceRating,
      improvement_status: input.improvementStatus,
      measurement_period: input.measurementPeriod,
      assessor_name: input.assessorName,
      baseline_value: input.baselineValue ?? null,
      current_value: input.currentValue ?? null,
      target_value: input.targetValue ?? null,
      children_involved: input.childrenInvolved,
      staff_trained: input.staffTrained,
      cost_saving_identified: input.costSavingIdentified,
      action_plan_created: input.actionPlanCreated,
      progress_monitored: input.progressMonitored,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeEnvironmentalImpactMetrics(
  rows: EnvironmentalImpactAssessmentRow[],
): {
  total_assessments: number;
  poor_count: number;
  below_standard_count: number;
  not_started_count: number;
  no_action_plan_count: number;
  children_involved_rate: number;
  staff_trained_rate: number;
  cost_saving_rate: number;
  action_plan_rate: number;
  progress_monitored_rate: number;
  area_breakdown: Record<string, number>;
  rating_breakdown: Record<string, number>;
  unique_assessors: number;
} {
  const total = rows.length;

  const poor = rows.filter((r) => r.performance_rating === "poor").length;
  const belowStandard = rows.filter((r) => r.performance_rating === "below_standard").length;
  const notStarted = rows.filter((r) => r.improvement_status === "not_started").length;
  const noActionPlan = rows.filter((r) => !r.action_plan_created).length;

  const boolRate = (field: keyof EnvironmentalImpactAssessmentRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const areaBreakdown: Record<string, number> = {};
  for (const r of rows) areaBreakdown[r.assessment_area] = (areaBreakdown[r.assessment_area] ?? 0) + 1;

  const ratingBreakdown: Record<string, number> = {};
  for (const r of rows) ratingBreakdown[r.performance_rating] = (ratingBreakdown[r.performance_rating] ?? 0) + 1;

  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: total,
    poor_count: poor,
    below_standard_count: belowStandard,
    not_started_count: notStarted,
    no_action_plan_count: noActionPlan,
    children_involved_rate: boolRate("children_involved"),
    staff_trained_rate: boolRate("staff_trained"),
    cost_saving_rate: boolRate("cost_saving_identified"),
    action_plan_rate: boolRate("action_plan_created"),
    progress_monitored_rate: boolRate("progress_monitored"),
    area_breakdown: areaBreakdown,
    rating_breakdown: ratingBreakdown,
    unique_assessors: uniqueAssessors,
  };
}

export function computeEnvironmentalImpactAlerts(
  rows: EnvironmentalImpactAssessmentRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: poor rating + no action plan
  for (const r of rows) {
    if (r.performance_rating === "poor" && !r.action_plan_created) {
      alerts.push({
        type: "poor_no_action_plan",
        severity: "critical",
        message: `Poor performance rating for ${r.assessment_area.replace(/_/g, " ")} with no action plan created — address immediately to meet environmental responsibilities`,
        record_id: r.id,
      });
    }
  }

  // High: below_standard + not started improvement
  for (const r of rows) {
    if (r.performance_rating === "below_standard" && r.improvement_status === "not_started") {
      alerts.push({
        type: "below_standard_not_started",
        severity: "high",
        message: `Below standard rating for ${r.assessment_area.replace(/_/g, " ")} with improvement not started — begin planning to raise performance`,
        record_id: r.id,
      });
    }
  }

  // High: multiple areas without progress monitoring
  const noProgressMonitoring = rows.filter((r) => !r.progress_monitored).length;
  if (noProgressMonitoring >= 2) {
    alerts.push({
      type: "multiple_no_progress_monitoring",
      severity: "high",
      message: `${noProgressMonitoring} assessment areas without progress monitoring — establish regular monitoring to track environmental improvements`,
    });
  }

  // Medium: children not involved in sustainability efforts
  const noChildrenInvolved = rows.filter((r) => !r.children_involved).length;
  if (noChildrenInvolved >= 2) {
    alerts.push({
      type: "children_not_involved",
      severity: "medium",
      message: `${noChildrenInvolved} assessments do not involve children in sustainability efforts — engage children in environmental responsibility activities`,
    });
  }

  return alerts;
}

export function generateEnvironmentalImpactCaraInsights(
  metrics: ReturnType<typeof computeEnvironmentalImpactMetrics>,
  alerts: ReturnType<typeof computeEnvironmentalImpactAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (cyan-themed)
  insights.push(
    `[cyan] ${metrics.total_assessments} environmental impact assessments recorded across ${metrics.unique_assessors} ${metrics.unique_assessors === 1 ? "assessor" : "assessors"}. ` +
      `Children involved in ${metrics.children_involved_rate}% of assessments, staff trained in ${metrics.staff_trained_rate}%, ` +
      `and cost savings identified in ${metrics.cost_saving_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.poor_count} poor ratings, ${metrics.below_standard_count} below standard, ` +
        `and ${metrics.no_action_plan_count} assessments without action plans.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.poor_count} poor and ${metrics.below_standard_count} below standard ratings. ` +
        `Continue regular environmental impact assessments to maintain sustainable practices.`,
    );
  }

  // Insight 3: Reflective question about environmental impact and children's involvement
  if (metrics.poor_count > 0) {
    insights.push(
      `[reflect] ${metrics.poor_count} ${metrics.poor_count === 1 ? "assessment has" : "assessments have"} rated environmental performance as poor. ` +
        `What underlying factors might be contributing to this, and how can the home team work together ` +
        `to develop sustainable practices that also teach children about environmental responsibility?`,
    );
  } else if (metrics.children_involved_rate < 100) {
    insights.push(
      `[reflect] Children are involved in ${metrics.children_involved_rate}% of environmental impact assessments. ` +
        `How can the home ensure every child has the opportunity to participate in sustainability efforts, ` +
        `and are there creative ways to engage children who find environmental topics less interesting?`,
    );
  } else {
    insights.push(
      `[reflect] All environmental impact assessments involve children and no poor ratings have been recorded. ` +
        `How can the home build on this positive foundation to continually strengthen its environmental practices, ` +
        `and what new sustainability initiatives could children help to champion?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEnvironmentalImpactMetrics,
  computeEnvironmentalImpactAlerts,
  generateEnvironmentalImpactCaraInsights,
};
