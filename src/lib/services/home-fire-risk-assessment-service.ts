// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FIRE RISK ASSESSMENT SERVICE
// Manages fire risk assessments, escape routes, fire detection systems,
// compartmentation, evacuation plans, and fire safety compliance.
// Regulatory Reform (Fire Safety) Order 2005,
// CHR 2015 Reg 25 (premises — fire safety),
// CHR 2015 Reg 40 (notifications — fire incidents).
//
// Covers: means of escape, fire detection, fire fighting equipment,
// compartmentation, emergency lighting, signage, housekeeping,
// electrical safety, evacuation plans, PEEPs, and staff training.
//
// SCCIF: Safety — "The premises are safe."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const RISK_RATINGS = ["low", "medium", "significant", "high", "intolerable"] as const;
export type RiskRating = (typeof RISK_RATINGS)[number];

export const ASSESSMENT_AREAS = [
  "means_of_escape",
  "fire_detection",
  "fire_fighting_equipment",
  "compartmentation",
  "emergency_lighting",
  "signage",
  "housekeeping",
  "electrical_safety",
] as const;
export type AssessmentArea = (typeof ASSESSMENT_AREAS)[number];

export const COMPLIANCE_STATUSES = [
  "compliant",
  "minor_deficiency",
  "major_deficiency",
  "non_compliant",
  "not_assessed",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const ACTION_PRIORITIES = [
  "immediate",
  "within_24_hours",
  "within_1_week",
  "within_1_month",
  "routine",
  "completed",
] as const;
export type ActionPriority = (typeof ACTION_PRIORITIES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeFireRiskAssessmentRow {
  id: string;
  home_id: string;
  assessor_name: string;
  assessor_id: string | null;
  assessment_date: string;
  risk_rating: RiskRating;
  assessment_area: AssessmentArea;
  compliance_status: ComplianceStatus;
  action_priority: ActionPriority;
  escape_routes_clear: boolean;
  fire_doors_functional: boolean;
  detection_system_tested: boolean;
  extinguishers_serviced: boolean;
  evacuation_plan_current: boolean;
  staff_fire_trained: boolean;
  fire_drills_completed: boolean;
  compartmentation_intact: boolean;
  emergency_lighting_tested: boolean;
  signage_adequate: boolean;
  electrical_safety_tested: boolean;
  peep_in_place: boolean;
  next_review_date: string | null;
  action_details: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listHomeFireRiskAssessments(
  homeId: string,
): Promise<ServiceResult<HomeFireRiskAssessmentRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_home_fire_risk_assessments") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("assessment_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeFireRiskAssessment(input: {
  homeId: string;
  assessorName: string;
  assessorId?: string | null;
  assessmentDate: string;
  riskRating: RiskRating;
  assessmentArea: AssessmentArea;
  complianceStatus: ComplianceStatus;
  actionPriority: ActionPriority;
  escapeRoutesClear: boolean;
  fireDoorsFunctional: boolean;
  detectionSystemTested: boolean;
  extinguishersServiced: boolean;
  evacuationPlanCurrent: boolean;
  staffFireTrained: boolean;
  fireDrillsCompleted: boolean;
  compartmentationIntact: boolean;
  emergencyLightingTested: boolean;
  signageAdequate: boolean;
  electricalSafetyTested: boolean;
  peepInPlace: boolean;
  nextReviewDate?: string | null;
  actionDetails?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<HomeFireRiskAssessmentRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_fire_risk_assessments") as any)
    .insert({
      home_id: input.homeId,
      assessor_name: input.assessorName,
      assessor_id: input.assessorId ?? null,
      assessment_date: input.assessmentDate,
      risk_rating: input.riskRating,
      assessment_area: input.assessmentArea,
      compliance_status: input.complianceStatus,
      action_priority: input.actionPriority,
      escape_routes_clear: input.escapeRoutesClear,
      fire_doors_functional: input.fireDoorsFunctional,
      detection_system_tested: input.detectionSystemTested,
      extinguishers_serviced: input.extinguishersServiced,
      evacuation_plan_current: input.evacuationPlanCurrent,
      staff_fire_trained: input.staffFireTrained,
      fire_drills_completed: input.fireDrillsCompleted,
      compartmentation_intact: input.compartmentationIntact,
      emergency_lighting_tested: input.emergencyLightingTested,
      signage_adequate: input.signageAdequate,
      electrical_safety_tested: input.electricalSafetyTested,
      peep_in_place: input.peepInPlace,
      next_review_date: input.nextReviewDate ?? null,
      action_details: input.actionDetails ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHomeFireRiskAssessment(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HomeFireRiskAssessmentRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_fire_risk_assessments") as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeFireRiskMetrics(
  rows: HomeFireRiskAssessmentRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  intolerable_count: number;
  non_compliant_count: number;
  major_deficiency_count: number;
  escape_routes_clear_rate: number;
  fire_doors_functional_rate: number;
  detection_system_tested_rate: number;
  extinguishers_serviced_rate: number;
  evacuation_plan_current_rate: number;
  staff_fire_trained_rate: number;
  fire_drills_completed_rate: number;
  compartmentation_intact_rate: number;
  emergency_lighting_tested_rate: number;
  signage_adequate_rate: number;
  electrical_safety_tested_rate: number;
  peep_in_place_rate: number;
  risk_breakdown: Record<string, number>;
  area_breakdown: Record<string, number>;
  unique_assessors: number;
} {
  const total = rows.length;

  const highRisk = rows.filter((r) => r.risk_rating === "high").length;
  const intolerable = rows.filter((r) => r.risk_rating === "intolerable").length;
  const nonCompliant = rows.filter((r) => r.compliance_status === "non_compliant").length;
  const majorDeficiency = rows.filter((r) => r.compliance_status === "major_deficiency").length;

  const boolRate = (field: keyof HomeFireRiskAssessmentRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const riskBreakdown: Record<string, number> = {};
  for (const r of rows) riskBreakdown[r.risk_rating] = (riskBreakdown[r.risk_rating] ?? 0) + 1;

  const areaBreakdown: Record<string, number> = {};
  for (const r of rows) areaBreakdown[r.assessment_area] = (areaBreakdown[r.assessment_area] ?? 0) + 1;

  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: total,
    high_risk_count: highRisk,
    intolerable_count: intolerable,
    non_compliant_count: nonCompliant,
    major_deficiency_count: majorDeficiency,
    escape_routes_clear_rate: boolRate("escape_routes_clear"),
    fire_doors_functional_rate: boolRate("fire_doors_functional"),
    detection_system_tested_rate: boolRate("detection_system_tested"),
    extinguishers_serviced_rate: boolRate("extinguishers_serviced"),
    evacuation_plan_current_rate: boolRate("evacuation_plan_current"),
    staff_fire_trained_rate: boolRate("staff_fire_trained"),
    fire_drills_completed_rate: boolRate("fire_drills_completed"),
    compartmentation_intact_rate: boolRate("compartmentation_intact"),
    emergency_lighting_tested_rate: boolRate("emergency_lighting_tested"),
    signage_adequate_rate: boolRate("signage_adequate"),
    electrical_safety_tested_rate: boolRate("electrical_safety_tested"),
    peep_in_place_rate: boolRate("peep_in_place"),
    risk_breakdown: riskBreakdown,
    area_breakdown: areaBreakdown,
    unique_assessors: uniqueAssessors,
  };
}

export function computeFireRiskAlerts(
  rows: HomeFireRiskAssessmentRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: intolerable or high risk rating
  for (const r of rows) {
    if (r.risk_rating === "intolerable") {
      alerts.push({
        type: "intolerable_risk",
        severity: "critical",
        message: `Intolerable fire risk rating for ${r.assessment_area.replace(/_/g, " ")} assessment on ${r.assessment_date} — immediate action required under the Fire Safety Order 2005`,
        record_id: r.id,
      });
    }
    if (r.risk_rating === "high") {
      alerts.push({
        type: "high_risk",
        severity: "critical",
        message: `High fire risk rating for ${r.assessment_area.replace(/_/g, " ")} assessment on ${r.assessment_date} — urgent remedial action required`,
        record_id: r.id,
      });
    }
  }

  // Critical: non_compliant in means_of_escape or fire_detection
  for (const r of rows) {
    if (
      r.compliance_status === "non_compliant" &&
      (r.assessment_area === "means_of_escape" || r.assessment_area === "fire_detection")
    ) {
      alerts.push({
        type: "non_compliant_critical_area",
        severity: "critical",
        message: `Non-compliant finding in ${r.assessment_area.replace(/_/g, " ")} on ${r.assessment_date} — this is a life-safety critical area requiring immediate rectification`,
        record_id: r.id,
      });
    }
  }

  // High: escape routes not clear
  for (const r of rows) {
    if (!r.escape_routes_clear) {
      alerts.push({
        type: "escape_routes_not_clear",
        severity: "high",
        message: `Escape routes not clear in ${r.assessment_area.replace(/_/g, " ")} assessment on ${r.assessment_date} — obstructed escape routes endanger all occupants`,
        record_id: r.id,
      });
    }
  }

  // High: fire doors not functional
  for (const r of rows) {
    if (!r.fire_doors_functional) {
      alerts.push({
        type: "fire_doors_not_functional",
        severity: "high",
        message: `Fire doors not functional in ${r.assessment_area.replace(/_/g, " ")} assessment on ${r.assessment_date} — fire doors are essential for compartmentation and safe evacuation`,
        record_id: r.id,
      });
    }
  }

  // Medium: fire drills not completed
  for (const r of rows) {
    if (!r.fire_drills_completed) {
      alerts.push({
        type: "fire_drills_not_completed",
        severity: "medium",
        message: `Fire drills not completed in ${r.assessment_area.replace(/_/g, " ")} assessment on ${r.assessment_date} — regular fire drills are required under the Fire Safety Order 2005`,
        record_id: r.id,
      });
    }
  }

  // Medium: PEEP not in place
  for (const r of rows) {
    if (!r.peep_in_place) {
      alerts.push({
        type: "peep_not_in_place",
        severity: "medium",
        message: `Personal Emergency Evacuation Plan not in place in ${r.assessment_area.replace(/_/g, " ")} assessment on ${r.assessment_date} — PEEPs are required for any person needing assistance during evacuation`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateFireRiskCaraInsights(
  rows: HomeFireRiskAssessmentRow[],
): string[] {
  const metrics = computeFireRiskMetrics(rows);
  const alerts = computeFireRiskAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (red-themed)
  insights.push(
    `[red] ${metrics.total_assessments} fire risk assessments recorded across ${metrics.unique_assessors} ${metrics.unique_assessors === 1 ? "assessor" : "assessors"}. ` +
      `Escape routes clear in ${metrics.escape_routes_clear_rate}% of assessments, fire doors functional in ${metrics.fire_doors_functional_rate}%, ` +
      `and detection systems tested in ${metrics.detection_system_tested_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority fire risk alerts identified. ` +
        `${metrics.intolerable_count} intolerable risk findings, ${metrics.high_risk_count} high risk findings, ` +
        `and ${metrics.non_compliant_count} non-compliant areas requiring urgent attention.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority fire risk alerts currently active. ` +
        `${metrics.non_compliant_count} non-compliant areas and ${metrics.major_deficiency_count} major deficiencies. ` +
        `Continue regular fire risk assessments to maintain compliance with the Fire Safety Order 2005.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.intolerable_count > 0 || metrics.high_risk_count > 0) {
    insights.push(
      `[reflect] ${metrics.intolerable_count + metrics.high_risk_count} ${(metrics.intolerable_count + metrics.high_risk_count) === 1 ? "assessment has" : "assessments have"} an intolerable or high fire risk rating. ` +
        `What immediate steps are being taken to reduce fire risk to an acceptable level, ` +
        `and are all children and staff aware of the current evacuation procedures?`,
    );
  } else if (metrics.fire_drills_completed_rate < 100) {
    insights.push(
      `[reflect] Fire drills are completed in ${metrics.fire_drills_completed_rate}% of assessments. ` +
        `How can the home ensure all staff and children regularly practise evacuation, ` +
        `and are Personal Emergency Evacuation Plans up to date for every child who needs one?`,
    );
  } else {
    insights.push(
      `[reflect] All assessments show fire drills completed and no high or intolerable risk ratings. ` +
        `How can the home build on this strong fire safety culture to continually improve, ` +
        `and are there opportunities to involve children in fire safety awareness activities?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeFireRiskMetrics,
  computeFireRiskAlerts,
  generateFireRiskCaraInsights,
};
