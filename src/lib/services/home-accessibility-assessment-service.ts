// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ACCESSIBILITY ASSESSMENT SERVICE
// Manages disability access assessments, reasonable adjustments, mobility aids,
// sensory needs accommodation, and DDA/Equality Act compliance within
// the residential home setting.
// CHR 2015 Reg 25 (premises — suitable for each child's needs),
// Equality Act 2010 (reasonable adjustments duty),
// CHR 2015 Reg 10 (health and wellbeing — meeting individual needs).
//
// Covers: accessibility areas (entrance/exit, ground floor, upper floors,
// bathrooms, kitchens, bedrooms, outdoor spaces, communal areas),
// compliance levels, adjustment tracking, need types (mobility, visual,
// hearing, cognitive, sensory), physical feature audits, cost estimation,
// child consultation, and emergency egress accessibility.
//
// SCCIF: Overall Experiences — "The environment is adapted to children's needs."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const ACCESSIBILITY_AREAS = [
  "entrance_exit",
  "ground_floor",
  "upper_floors",
  "bathroom",
  "kitchen",
  "bedroom",
  "outdoor_spaces",
  "communal_areas",
] as const;
export type AccessibilityArea = (typeof ACCESSIBILITY_AREAS)[number];

export const COMPLIANCE_LEVELS = [
  "fully_accessible",
  "partially_accessible",
  "adjustments_needed",
  "not_accessible",
  "not_applicable",
] as const;
export type ComplianceLevel = (typeof COMPLIANCE_LEVELS)[number];

export const ADJUSTMENT_STATUSES = [
  "not_required",
  "identified",
  "approved",
  "in_progress",
  "completed",
  "deferred",
] as const;
export type AdjustmentStatus = (typeof ADJUSTMENT_STATUSES)[number];

export const NEED_TYPES = [
  "mobility",
  "visual",
  "hearing",
  "cognitive",
  "sensory",
  "multiple",
  "other",
] as const;
export type NeedType = (typeof NEED_TYPES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeAccessibilityAssessmentRow {
  id: string;
  home_id: string;
  assessor_name: string;
  assessor_id: string | null;
  assessment_date: string;
  accessibility_area: AccessibilityArea;
  compliance_level: ComplianceLevel;
  adjustment_status: AdjustmentStatus;
  need_type: NeedType;
  wheelchair_accessible: boolean;
  ramp_installed: boolean;
  grab_rails_fitted: boolean;
  visual_aids_provided: boolean;
  hearing_loop_available: boolean;
  signage_accessible: boolean;
  lighting_adequate: boolean;
  emergency_egress_accessible: boolean;
  cost_estimate: number | null;
  child_consulted: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listHomeAccessibilityAssessments(
  homeId: string,
): Promise<ServiceResult<HomeAccessibilityAssessmentRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_home_accessibility_assessments") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("assessment_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeAccessibilityAssessment(input: {
  homeId: string;
  assessorName: string;
  assessorId?: string | null;
  assessmentDate: string;
  accessibilityArea: AccessibilityArea;
  complianceLevel: ComplianceLevel;
  adjustmentStatus: AdjustmentStatus;
  needType: NeedType;
  wheelchairAccessible: boolean;
  rampInstalled: boolean;
  grabRailsFitted: boolean;
  visualAidsProvided: boolean;
  hearingLoopAvailable: boolean;
  signageAccessible: boolean;
  lightingAdequate: boolean;
  emergencyEgressAccessible: boolean;
  costEstimate?: number | null;
  childConsulted?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<HomeAccessibilityAssessmentRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_accessibility_assessments") as any)
    .insert({
      home_id: input.homeId,
      assessor_name: input.assessorName,
      assessor_id: input.assessorId ?? null,
      assessment_date: input.assessmentDate,
      accessibility_area: input.accessibilityArea,
      compliance_level: input.complianceLevel,
      adjustment_status: input.adjustmentStatus,
      need_type: input.needType,
      wheelchair_accessible: input.wheelchairAccessible,
      ramp_installed: input.rampInstalled,
      grab_rails_fitted: input.grabRailsFitted,
      visual_aids_provided: input.visualAidsProvided,
      hearing_loop_available: input.hearingLoopAvailable,
      signage_accessible: input.signageAccessible,
      lighting_adequate: input.lightingAdequate,
      emergency_egress_accessible: input.emergencyEgressAccessible,
      cost_estimate: input.costEstimate ?? null,
      child_consulted: input.childConsulted ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeAccessibilityMetrics(
  rows: HomeAccessibilityAssessmentRow[],
): {
  total_assessments: number;
  not_accessible_count: number;
  adjustments_needed_count: number;
  completed_count: number;
  deferred_count: number;
  wheelchair_accessible_rate: number;
  ramp_installed_rate: number;
  grab_rails_fitted_rate: number;
  visual_aids_provided_rate: number;
  hearing_loop_available_rate: number;
  signage_accessible_rate: number;
  lighting_adequate_rate: number;
  emergency_egress_accessible_rate: number;
  total_cost: number;
  area_breakdown: Record<string, number>;
  compliance_breakdown: Record<string, number>;
  unique_assessors: number;
} {
  const total = rows.length;

  const notAccessible = rows.filter((r) => r.compliance_level === "not_accessible").length;
  const adjustmentsNeeded = rows.filter((r) => r.compliance_level === "adjustments_needed").length;
  const completed = rows.filter((r) => r.adjustment_status === "completed").length;
  const deferred = rows.filter((r) => r.adjustment_status === "deferred").length;

  const boolRate = (field: keyof HomeAccessibilityAssessmentRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const totalCost = rows.reduce((sum, r) => sum + (r.cost_estimate ?? 0), 0);

  const areaBreakdown: Record<string, number> = {};
  for (const r of rows) areaBreakdown[r.accessibility_area] = (areaBreakdown[r.accessibility_area] ?? 0) + 1;

  const complianceBreakdown: Record<string, number> = {};
  for (const r of rows) complianceBreakdown[r.compliance_level] = (complianceBreakdown[r.compliance_level] ?? 0) + 1;

  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: total,
    not_accessible_count: notAccessible,
    adjustments_needed_count: adjustmentsNeeded,
    completed_count: completed,
    deferred_count: deferred,
    wheelchair_accessible_rate: boolRate("wheelchair_accessible"),
    ramp_installed_rate: boolRate("ramp_installed"),
    grab_rails_fitted_rate: boolRate("grab_rails_fitted"),
    visual_aids_provided_rate: boolRate("visual_aids_provided"),
    hearing_loop_available_rate: boolRate("hearing_loop_available"),
    signage_accessible_rate: boolRate("signage_accessible"),
    lighting_adequate_rate: boolRate("lighting_adequate"),
    emergency_egress_accessible_rate: boolRate("emergency_egress_accessible"),
    total_cost: totalCost,
    area_breakdown: areaBreakdown,
    compliance_breakdown: complianceBreakdown,
    unique_assessors: uniqueAssessors,
  };
}

export function computeAccessibilityAlerts(
  rows: HomeAccessibilityAssessmentRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: not_accessible in entrance_exit or emergency-related area
  for (const r of rows) {
    if (r.compliance_level === "not_accessible" && (r.accessibility_area === "entrance_exit" || r.accessibility_area === "communal_areas")) {
      alerts.push({
        type: "not_accessible_critical_area",
        severity: "critical",
        message: `${r.accessibility_area.replace(/_/g, " ")} assessed as not accessible — immediate action required under Equality Act 2010 reasonable adjustments duty`,
        record_id: r.id,
      });
    }
  }

  // High: adjustments_needed but status is deferred
  for (const r of rows) {
    if (r.compliance_level === "adjustments_needed" && r.adjustment_status === "deferred") {
      alerts.push({
        type: "adjustments_deferred",
        severity: "high",
        message: `${r.accessibility_area.replace(/_/g, " ")} requires adjustments but work has been deferred — review timeline to ensure compliance`,
        record_id: r.id,
      });
    }
  }

  // High: emergency egress not accessible
  for (const r of rows) {
    if (!r.emergency_egress_accessible) {
      alerts.push({
        type: "emergency_egress_not_accessible",
        severity: "high",
        message: `Emergency egress not accessible in ${r.accessibility_area.replace(/_/g, " ")} — fire safety and evacuation plans must account for all children's needs`,
        record_id: r.id,
      });
    }
  }

  // Medium: child not consulted on accessibility
  const noConsultation = rows.filter((r) => !r.child_consulted);
  if (noConsultation.length > 0) {
    alerts.push({
      type: "child_not_consulted",
      severity: "medium",
      message: `${noConsultation.length} ${noConsultation.length === 1 ? "assessment has" : "assessments have"} not recorded child consultation — children's views on accessibility must inform adjustments`,
    });
  }

  // Medium: lighting not adequate
  const lightingInadequate = rows.filter((r) => !r.lighting_adequate);
  if (lightingInadequate.length > 0) {
    alerts.push({
      type: "lighting_not_adequate",
      severity: "medium",
      message: `${lightingInadequate.length} ${lightingInadequate.length === 1 ? "area has" : "areas have"} inadequate lighting — this can impact safety and accessibility for children with visual or sensory needs`,
    });
  }

  return alerts;
}

export function generateAccessibilityAriaInsights(
  metrics: ReturnType<typeof computeAccessibilityMetrics>,
  alerts: ReturnType<typeof computeAccessibilityAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (teal-themed)
  insights.push(
    `[teal] ${metrics.total_assessments} accessibility assessments recorded across ${metrics.unique_assessors} ${metrics.unique_assessors === 1 ? "assessor" : "assessors"}. ` +
      `Wheelchair accessible rate: ${metrics.wheelchair_accessible_rate}%, emergency egress accessible rate: ${metrics.emergency_egress_accessible_rate}%. ` +
      `Total estimated adjustment cost: £${metrics.total_cost.toLocaleString("en-GB")}.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority accessibility alerts identified. ` +
        `${metrics.not_accessible_count} areas not accessible, ${metrics.adjustments_needed_count} needing adjustments, ` +
        `and ${metrics.deferred_count} adjustments deferred.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority accessibility alerts currently active. ` +
        `${metrics.not_accessible_count} areas not accessible and ${metrics.adjustments_needed_count} needing adjustments. ` +
        `Continue regular accessibility assessments to maintain Equality Act compliance.`,
    );
  }

  // Insight 3: Reflective question about accessibility and children's experience
  if (metrics.not_accessible_count > 0) {
    insights.push(
      `[reflect] ${metrics.not_accessible_count} ${metrics.not_accessible_count === 1 ? "area has" : "areas have"} been assessed as not accessible. ` +
        `What barriers are preventing full accessibility, and how can the home prioritise reasonable adjustments ` +
        `to ensure every child can move freely and safely throughout their home?`,
    );
  } else if (metrics.deferred_count > 0) {
    insights.push(
      `[reflect] ${metrics.deferred_count} ${metrics.deferred_count === 1 ? "adjustment has" : "adjustments have"} been deferred. ` +
        `Are there interim measures in place to support children's accessibility needs while adjustments are pending, ` +
        `and what can be done to expedite completion?`,
    );
  } else {
    insights.push(
      `[reflect] No areas are currently assessed as not accessible and no adjustments have been deferred. ` +
        `How can the home continue to proactively identify and address accessibility needs as children's ` +
        `requirements evolve over time?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAccessibilityMetrics,
  computeAccessibilityAlerts,
  generateAccessibilityAriaInsights,
};
