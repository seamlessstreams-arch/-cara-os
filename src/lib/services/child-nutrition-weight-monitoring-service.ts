// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD NUTRITION & WEIGHT MONITORING SERVICE
// BMI tracking, dietary needs, weight management plans,
// nutritional assessments, growth monitoring.
// CHR 2015 Reg 10 (health and wellbeing),
// CHR 2015 Reg 9 (quality of care — nutrition).
// NICE guidelines on childhood obesity.
//
// Covers: BMI categories, dietary requirements, monitoring statuses,
// assessment types, clinical referrals, and weight management plans.
//
// SCCIF: Health — "Children's physical health needs are met."
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

export const BMI_CATEGORIES = [
  "underweight",
  "healthy_weight",
  "overweight",
  "obese",
  "severely_obese",
  "not_assessed",
] as const;
export type BmiCategory = (typeof BMI_CATEGORIES)[number];

export const DIETARY_NEEDS = [
  "none",
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "gluten_free",
  "dairy_free",
  "allergy_specific",
  "medical_diet",
  "cultural",
] as const;
export type DietaryNeed = (typeof DIETARY_NEEDS)[number];

export const MONITORING_STATUSES = [
  "routine",
  "concern_identified",
  "plan_in_place",
  "referral_made",
  "under_clinical_care",
  "resolved",
] as const;
export type MonitoringStatus = (typeof MONITORING_STATUSES)[number];

export const ASSESSMENT_TYPES = [
  "initial",
  "quarterly",
  "annual",
  "concern_triggered",
  "clinical_review",
  "follow_up",
] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildNutritionWeightMonitoringRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  assessment_date: string;
  bmi_category: BmiCategory;
  dietary_need: DietaryNeed;
  monitoring_status: MonitoringStatus;
  assessment_type: AssessmentType;
  weight_recorded: boolean;
  height_recorded: boolean;
  bmi_calculated: boolean;
  dietary_needs_met: boolean;
  portion_sizes_appropriate: boolean;
  hydration_adequate: boolean;
  clinical_referral_made: boolean;
  weight_management_plan: boolean;
  assessor_name: string | null;
  bmi_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeNutritionMetrics(
  rows: ChildNutritionWeightMonitoringRow[],
): {
  total_assessments: number;
  underweight_count: number;
  overweight_count: number;
  obese_count: number;
  concern_count: number;
  weight_recorded_rate: number;
  height_recorded_rate: number;
  bmi_calculated_rate: number;
  dietary_needs_met_rate: number;
  portion_sizes_appropriate_rate: number;
  hydration_adequate_rate: number;
  clinical_referral_made_rate: number;
  weight_management_plan_rate: number;
  bmi_breakdown: Record<string, number>;
  dietary_breakdown: Record<string, number>;
  unique_children: number;
} {
  const underweight = rows.filter((r) => r.bmi_category === "underweight").length;
  const overweight = rows.filter((r) => r.bmi_category === "overweight").length;
  const obese = rows.filter(
    (r) => r.bmi_category === "obese" || r.bmi_category === "severely_obese",
  ).length;
  const concern = rows.filter(
    (r) => r.monitoring_status === "concern_identified",
  ).length;

  const boolRate = (field: keyof ChildNutritionWeightMonitoringRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  const bmiBreakdown: Record<string, number> = {};
  for (const r of rows) bmiBreakdown[r.bmi_category] = (bmiBreakdown[r.bmi_category] ?? 0) + 1;

  const dietaryBreakdown: Record<string, number> = {};
  for (const r of rows) dietaryBreakdown[r.dietary_need] = (dietaryBreakdown[r.dietary_need] ?? 0) + 1;

  return {
    total_assessments: rows.length,
    underweight_count: underweight,
    overweight_count: overweight,
    obese_count: obese,
    concern_count: concern,
    weight_recorded_rate: boolRate("weight_recorded"),
    height_recorded_rate: boolRate("height_recorded"),
    bmi_calculated_rate: boolRate("bmi_calculated"),
    dietary_needs_met_rate: boolRate("dietary_needs_met"),
    portion_sizes_appropriate_rate: boolRate("portion_sizes_appropriate"),
    hydration_adequate_rate: boolRate("hydration_adequate"),
    clinical_referral_made_rate: boolRate("clinical_referral_made"),
    weight_management_plan_rate: boolRate("weight_management_plan"),
    bmi_breakdown: bmiBreakdown,
    dietary_breakdown: dietaryBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeNutritionAlerts(
  rows: ChildNutritionWeightMonitoringRow[],
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

  // Critical: obese or severely_obese without clinical referral
  for (const r of rows) {
    if (
      (r.bmi_category === "obese" || r.bmi_category === "severely_obese") &&
      !r.clinical_referral_made
    ) {
      alerts.push({
        type: "obese_no_clinical_referral",
        severity: "critical",
        message: `${r.child_name} is classified as ${r.bmi_category.replace(/_/g, " ")} without clinical referral — arrange referral urgently per NICE guidelines`,
        record_id: r.id,
      });
    }
  }

  // High: underweight without weight management plan
  for (const r of rows) {
    if (r.bmi_category === "underweight" && !r.weight_management_plan) {
      alerts.push({
        type: "underweight_no_plan",
        severity: "high",
        message: `${r.child_name} is underweight without a weight management plan — develop plan to address nutritional intake`,
        record_id: r.id,
      });
    }
  }

  // High: dietary needs not met
  for (const r of rows) {
    if (!r.dietary_needs_met) {
      alerts.push({
        type: "dietary_needs_not_met",
        severity: "high",
        message: `Dietary needs not met for ${r.child_name} — review meal provision and dietary accommodations`,
        record_id: r.id,
      });
    }
  }

  // Medium: BMI not calculated
  for (const r of rows) {
    if (!r.bmi_calculated) {
      alerts.push({
        type: "bmi_not_calculated",
        severity: "medium",
        message: `BMI not calculated for ${r.child_name} — ensure height and weight are recorded to enable BMI calculation`,
        record_id: r.id,
      });
    }
  }

  // Medium: hydration not adequate
  for (const r of rows) {
    if (!r.hydration_adequate) {
      alerts.push({
        type: "hydration_not_adequate",
        severity: "medium",
        message: `Hydration not adequate for ${r.child_name} — review fluid intake and encourage adequate hydration`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateNutritionCaraInsights(
  rows: ChildNutritionWeightMonitoringRow[],
): string[] {
  const metrics = computeNutritionMetrics(rows);
  const alerts = computeNutritionAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  const weightConcernCount = metrics.underweight_count + metrics.overweight_count + metrics.obese_count;
  insights.push(
    `[red] ${metrics.total_assessments} nutrition and weight monitoring assessments recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${weightConcernCount} with weight concerns (${metrics.underweight_count} underweight, ${metrics.overweight_count} overweight, ${metrics.obese_count} obese/severely obese). ` +
      `BMI calculated rate: ${metrics.bmi_calculated_rate}%. Dietary needs met rate: ${metrics.dietary_needs_met_rate}%.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Clinical referral rate: ${metrics.clinical_referral_made_rate}%. ` +
        `Weight management plan rate: ${metrics.weight_management_plan_rate}%. ` +
        `Hydration adequate rate: ${metrics.hydration_adequate_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `Clinical referral rate: ${metrics.clinical_referral_made_rate}%. ` +
        `Weight management plan rate: ${metrics.weight_management_plan_rate}%. ` +
        `Hydration adequate rate: ${metrics.hydration_adequate_rate}%.`,
    );
  }

  // Insight 3: Reflective health question
  insights.push(
    `[reflect] Are nutritional assessments being reviewed at appropriate intervals, and is each child's dietary plan ` +
      `informed by their health needs, cultural preferences, and up-to-date clinical guidance from health professionals?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildNutritionWeightMonitoring(
  homeId: string,
): Promise<ServiceResult<ChildNutritionWeightMonitoringRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_nutrition_weight_monitoring") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildNutritionWeightMonitoring(input: {
  homeId: string;
  childName: string;
  childId?: string | null;
  assessmentDate: string;
  bmiCategory: BmiCategory;
  dietaryNeed: DietaryNeed;
  monitoringStatus: MonitoringStatus;
  assessmentType: AssessmentType;
  weightRecorded?: boolean;
  heightRecorded?: boolean;
  bmiCalculated?: boolean;
  dietaryNeedsMet?: boolean;
  portionSizesAppropriate?: boolean;
  hydrationAdequate?: boolean;
  clinicalReferralMade?: boolean;
  weightManagementPlan?: boolean;
  assessorName?: string | null;
  bmiValue?: number | null;
  notes?: string | null;
}): Promise<ServiceResult<ChildNutritionWeightMonitoringRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_nutrition_weight_monitoring") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      assessment_date: input.assessmentDate,
      bmi_category: input.bmiCategory,
      dietary_need: input.dietaryNeed,
      monitoring_status: input.monitoringStatus,
      assessment_type: input.assessmentType,
      weight_recorded: input.weightRecorded ?? true,
      height_recorded: input.heightRecorded ?? true,
      bmi_calculated: input.bmiCalculated ?? true,
      dietary_needs_met: input.dietaryNeedsMet ?? true,
      portion_sizes_appropriate: input.portionSizesAppropriate ?? true,
      hydration_adequate: input.hydrationAdequate ?? true,
      clinical_referral_made: input.clinicalReferralMade ?? false,
      weight_management_plan: input.weightManagementPlan ?? false,
      assessor_name: input.assessorName ?? null,
      bmi_value: input.bmiValue ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeNutritionMetrics,
  computeNutritionAlerts,
  generateNutritionCaraInsights,
};
