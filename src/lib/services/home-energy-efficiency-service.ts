// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ENERGY EFFICIENCY SERVICE
// Manages energy usage monitoring, carbon reduction tracking, utility costs,
// efficiency improvements, and sustainability measures for children's homes.
// CHR 2015 Reg 25 (premises — suitable, well-maintained, safe environment),
// Reg 13 (leadership — financial management of the home).
//
// Covers: heating, lighting, insulation, windows & doors, water heating,
// appliances, renewable energy, ventilation, EPC assessments,
// smart metering, carbon footprint tracking, and cost analysis.
//
// Energy Performance Certificates (EPC) requirements.
// SCCIF: Leadership & Management — "The home is well-managed as a business."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const ENERGY_AREAS = [
  "heating",
  "lighting",
  "insulation",
  "windows_doors",
  "water_heating",
  "appliances",
  "renewable_energy",
  "ventilation",
] as const;
export type EnergyArea = (typeof ENERGY_AREAS)[number];

export const EFFICIENCY_RATINGS = [
  "a_rating",
  "b_rating",
  "c_rating",
  "d_rating",
  "e_rating",
  "f_rating",
  "g_rating",
  "not_assessed",
] as const;
export type EfficiencyRating = (typeof EFFICIENCY_RATINGS)[number];

export const IMPROVEMENT_STATUSES = [
  "identified",
  "costed",
  "approved",
  "in_progress",
  "completed",
  "deferred",
] as const;
export type ImprovementStatus = (typeof IMPROVEMENT_STATUSES)[number];

export const ASSESSMENT_TYPES = [
  "epc_assessment",
  "utility_audit",
  "carbon_review",
  "cost_analysis",
  "improvement_check",
  "annual_review",
] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeEnergyEfficiencyRow {
  id: string;
  home_id: string;
  assessor_name: string;
  assessor_id: string | null;
  assessment_date: string;
  energy_area: EnergyArea;
  efficiency_rating: EfficiencyRating;
  improvement_status: ImprovementStatus;
  assessment_type: AssessmentType;
  current_epc_valid: boolean;
  smart_meter_installed: boolean;
  led_lighting_throughout: boolean;
  insulation_adequate: boolean;
  draught_proofing_done: boolean;
  renewable_energy_installed: boolean;
  energy_saving_measures_active: boolean;
  children_involved_in_saving: boolean;
  monthly_cost_estimate: number | null;
  carbon_footprint_tonnes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listHomeEnergyEfficiency(
  homeId: string,
): Promise<ServiceResult<HomeEnergyEfficiencyRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_home_energy_efficiency") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("assessment_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeEnergyEfficiency(input: {
  homeId: string;
  assessorName: string;
  assessorId?: string | null;
  assessmentDate: string;
  energyArea: EnergyArea;
  efficiencyRating: EfficiencyRating;
  improvementStatus: ImprovementStatus;
  assessmentType: AssessmentType;
  currentEpcValid: boolean;
  smartMeterInstalled: boolean;
  ledLightingThroughout: boolean;
  insulationAdequate: boolean;
  draughtProofingDone: boolean;
  renewableEnergyInstalled: boolean;
  energySavingMeasuresActive: boolean;
  childrenInvolvedInSaving: boolean;
  monthlyCostEstimate?: number | null;
  carbonFootprintTonnes?: number | null;
  notes?: string | null;
}): Promise<ServiceResult<HomeEnergyEfficiencyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_energy_efficiency") as any)
    .insert({
      home_id: input.homeId,
      assessor_name: input.assessorName,
      assessor_id: input.assessorId ?? null,
      assessment_date: input.assessmentDate,
      energy_area: input.energyArea,
      efficiency_rating: input.efficiencyRating,
      improvement_status: input.improvementStatus,
      assessment_type: input.assessmentType,
      current_epc_valid: input.currentEpcValid,
      smart_meter_installed: input.smartMeterInstalled,
      led_lighting_throughout: input.ledLightingThroughout,
      insulation_adequate: input.insulationAdequate,
      draught_proofing_done: input.draughtProofingDone,
      renewable_energy_installed: input.renewableEnergyInstalled,
      energy_saving_measures_active: input.energySavingMeasuresActive,
      children_involved_in_saving: input.childrenInvolvedInSaving,
      monthly_cost_estimate: input.monthlyCostEstimate ?? null,
      carbon_footprint_tonnes: input.carbonFootprintTonnes ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeEnergyEfficiencyMetrics(
  rows: HomeEnergyEfficiencyRow[],
): {
  total_assessments: number;
  poor_rating_count: number;
  improvement_identified_count: number;
  completed_count: number;
  deferred_count: number;
  epc_valid_rate: number;
  smart_meter_rate: number;
  led_lighting_rate: number;
  insulation_rate: number;
  draught_proofing_rate: number;
  renewable_rate: number;
  energy_saving_rate: number;
  children_involved_rate: number;
  total_monthly_cost: number;
  total_carbon: number;
  energy_area_breakdown: Record<string, number>;
  rating_breakdown: Record<string, number>;
  unique_assessors: number;
} {
  const total = rows.length;

  const poorRating = rows.filter(
    (r) =>
      r.efficiency_rating === "e_rating" ||
      r.efficiency_rating === "f_rating" ||
      r.efficiency_rating === "g_rating",
  ).length;

  const improvementIdentified = rows.filter((r) => r.improvement_status === "identified").length;
  const completed = rows.filter((r) => r.improvement_status === "completed").length;
  const deferred = rows.filter((r) => r.improvement_status === "deferred").length;

  const boolRate = (field: keyof HomeEnergyEfficiencyRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const totalMonthlyCost = rows
    .filter((r) => r.monthly_cost_estimate !== null)
    .reduce((sum, r) => sum + r.monthly_cost_estimate!, 0);

  const totalCarbon = rows
    .filter((r) => r.carbon_footprint_tonnes !== null)
    .reduce((sum, r) => sum + r.carbon_footprint_tonnes!, 0);

  const energyAreaBreakdown: Record<string, number> = {};
  for (const r of rows) energyAreaBreakdown[r.energy_area] = (energyAreaBreakdown[r.energy_area] ?? 0) + 1;

  const ratingBreakdown: Record<string, number> = {};
  for (const r of rows) ratingBreakdown[r.efficiency_rating] = (ratingBreakdown[r.efficiency_rating] ?? 0) + 1;

  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: total,
    poor_rating_count: poorRating,
    improvement_identified_count: improvementIdentified,
    completed_count: completed,
    deferred_count: deferred,
    epc_valid_rate: boolRate("current_epc_valid"),
    smart_meter_rate: boolRate("smart_meter_installed"),
    led_lighting_rate: boolRate("led_lighting_throughout"),
    insulation_rate: boolRate("insulation_adequate"),
    draught_proofing_rate: boolRate("draught_proofing_done"),
    renewable_rate: boolRate("renewable_energy_installed"),
    energy_saving_rate: boolRate("energy_saving_measures_active"),
    children_involved_rate: boolRate("children_involved_in_saving"),
    total_monthly_cost: Math.round(totalMonthlyCost * 100) / 100,
    total_carbon: Math.round(totalCarbon * 100) / 100,
    energy_area_breakdown: energyAreaBreakdown,
    rating_breakdown: ratingBreakdown,
    unique_assessors: uniqueAssessors,
  };
}

export function computeEnergyEfficiencyAlerts(
  rows: HomeEnergyEfficiencyRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: EPC not valid (expired)
  for (const r of rows) {
    if (!r.current_epc_valid) {
      alerts.push({
        type: "epc_not_valid",
        severity: "critical",
        message: `Energy Performance Certificate not valid for ${r.energy_area.replace(/_/g, " ")} assessment — an up-to-date EPC is a legal requirement`,
        record_id: r.id,
      });
    }
  }

  // High: poor rating (e/f/g) with no improvement identified
  for (const r of rows) {
    if (
      (r.efficiency_rating === "e_rating" ||
        r.efficiency_rating === "f_rating" ||
        r.efficiency_rating === "g_rating") &&
      r.improvement_status !== "identified" &&
      r.improvement_status !== "costed" &&
      r.improvement_status !== "approved" &&
      r.improvement_status !== "in_progress" &&
      r.improvement_status !== "completed"
    ) {
      alerts.push({
        type: "poor_rating_no_improvement",
        severity: "high",
        message: `Poor efficiency rating (${r.efficiency_rating.replace(/_/g, " ")}) for ${r.energy_area.replace(/_/g, " ")} with no improvement action — plan improvements to reduce energy waste`,
        record_id: r.id,
      });
    }
  }

  // High: insulation not adequate in heating area
  for (const r of rows) {
    if (r.energy_area === "heating" && !r.insulation_adequate) {
      alerts.push({
        type: "insulation_inadequate_heating",
        severity: "high",
        message: `Insulation not adequate for heating area — poor insulation increases costs and reduces comfort for children`,
        record_id: r.id,
      });
    }
  }

  // Medium: smart meter not installed
  const noSmartMeter = rows.filter((r) => !r.smart_meter_installed).length;
  if (noSmartMeter >= 1) {
    alerts.push({
      type: "smart_meter_not_installed",
      severity: "medium",
      message: `${noSmartMeter} ${noSmartMeter === 1 ? "assessment" : "assessments"} without smart meter installed — smart meters help monitor and reduce energy usage`,
    });
  }

  // Medium: children not involved in energy saving
  const noChildrenInvolved = rows.filter((r) => !r.children_involved_in_saving).length;
  if (noChildrenInvolved >= 1) {
    alerts.push({
      type: "children_not_involved",
      severity: "medium",
      message: `${noChildrenInvolved} ${noChildrenInvolved === 1 ? "assessment" : "assessments"} where children are not involved in energy saving — involving children builds life skills and environmental awareness`,
    });
  }

  return alerts;
}

export function generateEnergyEfficiencyCaraInsights(
  rows: HomeEnergyEfficiencyRow[],
): string[] {
  const metrics = computeEnergyEfficiencyMetrics(rows);
  const alerts = computeEnergyEfficiencyAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (orange-themed)
  insights.push(
    `[orange] ${metrics.total_assessments} energy efficiency assessments recorded across ${metrics.unique_assessors} ${metrics.unique_assessors === 1 ? "assessor" : "assessors"}. ` +
      `EPC valid in ${metrics.epc_valid_rate}% of assessments, smart meters installed in ${metrics.smart_meter_rate}%, ` +
      `and LED lighting throughout in ${metrics.led_lighting_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.poor_rating_count} poor ratings (E/F/G), ${metrics.deferred_count} deferred improvements, ` +
        `and total estimated monthly cost of £${metrics.total_monthly_cost.toFixed(2)}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.poor_rating_count} poor ratings and ${metrics.deferred_count} deferred improvements. ` +
        `Continue regular energy efficiency assessments to maintain sustainable practices.`,
    );
  }

  // Insight 3: Reflective question about energy efficiency and children's involvement
  if (metrics.poor_rating_count > 0) {
    insights.push(
      `[reflect] ${metrics.poor_rating_count} ${metrics.poor_rating_count === 1 ? "assessment has" : "assessments have"} a poor energy efficiency rating (E/F/G). ` +
        `What steps can the home take to improve energy performance in these areas, ` +
        `and how can children be involved in understanding and reducing the home's energy consumption?`,
    );
  } else if (metrics.children_involved_rate < 100) {
    insights.push(
      `[reflect] Children are involved in energy saving in ${metrics.children_involved_rate}% of assessments. ` +
        `How can the home ensure every child has the opportunity to participate in energy-saving activities, ` +
        `and are there creative ways to make sustainability engaging for young people?`,
    );
  } else {
    insights.push(
      `[reflect] All assessments involve children in energy saving and no poor ratings have been recorded. ` +
        `How can the home build on this positive foundation to continually improve its energy efficiency, ` +
        `and what new sustainability initiatives could children help to champion?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEnergyEfficiencyMetrics,
  computeEnergyEfficiencyAlerts,
  generateEnergyEfficiencyCaraInsights,
};
