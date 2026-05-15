// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LEGIONELLA RISK ASSESSMENT SERVICE
// Tracks legionella risk assessments, water system testing, temperature
// monitoring, flushing regimes, water treatment, and compliance for the
// residential home.
// HSE Approved Code of Practice L8 (Legionnaires' disease),
// HSG274 (Legionella technical guidance),
// CHR 2015 Reg 25 (health and safety — water safety),
// CHR 2015 Reg 36 (fitness of premises — water systems).
//
// Covers: legionella risk assessments, water system type audits,
// temperature compliance, flushing regime compliance, water treatment,
// legionella testing, remedial actions, and compliance status tracking.
//
// SCCIF: Helped & Protected — "Water systems are safe."
// "Children are protected from legionella risks under ACOP L8."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const WATER_SYSTEM_TYPES = [
  "Hot Water",
  "Cold Water",
  "Cooling Tower",
  "Spa/Pool",
  "Shower",
  "Dead Leg",
  "Other",
] as const;
export type WaterSystemType = (typeof WATER_SYSTEM_TYPES)[number];

export const RISK_LEVELS = [
  "Low",
  "Medium",
  "Significant",
  "High",
  "Intolerable",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const LEGIONELLA_TEST_RESULTS = [
  "Negative",
  "Low Count",
  "Action Level",
  "Immediate Action",
] as const;
export type LegionellaTestResult = (typeof LEGIONELLA_TEST_RESULTS)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Minor Non-Compliance",
  "Major Non-Compliance",
  "Critical Non-Compliance",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeLegionellaRiskAssessmentRow {
  id: string;
  home_id: string;
  assessment_date: string;
  assessor_name: string;
  water_system_type: WaterSystemType;
  risk_level: RiskLevel;
  temperature_compliant: boolean;
  hot_water_temp_celsius: number | null;
  cold_water_temp_celsius: number | null;
  flushing_regime_compliant: boolean;
  water_treatment_in_place: boolean;
  legionella_test_completed: boolean;
  legionella_test_result: LegionellaTestResult | null;
  remedial_action_required: boolean;
  remedial_action_details: string | null;
  next_assessment_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Supabase helpers ─────────────────────────────────────────────────────

function isSupabaseEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listHomeLegionellaRiskAssessments(
  homeId: string,
): Promise<ServiceResult<HomeLegionellaRiskAssessmentRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = sb();
  if (!client) return { ok: true, data: [] };

  const { data, error } = await (client.from("cs_home_legionella_risk_assessments") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("assessment_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeLegionellaRiskAssessment(input: {
  homeId: string;
  assessmentDate: string;
  assessorName: string;
  waterSystemType: WaterSystemType;
  riskLevel: RiskLevel;
  temperatureCompliant: boolean;
  hotWaterTempCelsius?: number | null;
  coldWaterTempCelsius?: number | null;
  flushingRegimeCompliant: boolean;
  waterTreatmentInPlace: boolean;
  legionellaTestCompleted: boolean;
  legionellaTestResult?: LegionellaTestResult | null;
  remedialActionRequired: boolean;
  remedialActionDetails?: string | null;
  nextAssessmentDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeLegionellaRiskAssessmentRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_home_legionella_risk_assessments") as any)
    .insert({
      home_id: input.homeId,
      assessment_date: input.assessmentDate,
      assessor_name: input.assessorName,
      water_system_type: input.waterSystemType,
      risk_level: input.riskLevel,
      temperature_compliant: input.temperatureCompliant,
      hot_water_temp_celsius: input.hotWaterTempCelsius ?? null,
      cold_water_temp_celsius: input.coldWaterTempCelsius ?? null,
      flushing_regime_compliant: input.flushingRegimeCompliant,
      water_treatment_in_place: input.waterTreatmentInPlace,
      legionella_test_completed: input.legionellaTestCompleted,
      legionella_test_result: input.legionellaTestResult ?? null,
      remedial_action_required: input.remedialActionRequired,
      remedial_action_details: input.remedialActionDetails ?? null,
      next_assessment_date: input.nextAssessmentDate ?? null,
      compliance_status: input.complianceStatus,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHomeLegionellaRiskAssessment(
  id: string,
  homeId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HomeLegionellaRiskAssessmentRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_home_legionella_risk_assessments") as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("home_id", homeId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: HomeLegionellaRiskAssessmentRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  intolerable_count: number;
  non_compliant_count: number;
  temperature_compliance_rate: number;
  flushing_compliance_rate: number;
  water_treatment_rate: number;
  legionella_test_rate: number;
  remedial_action_count: number;
  negative_test_rate: number;
  unique_assessors: number;
  risk_breakdown: Record<string, number>;
  system_type_breakdown: Record<string, number>;
  compliance_breakdown: Record<string, number>;
} {
  const total = rows.length;

  const highRisk = rows.filter((r) => r.risk_level === "High").length;
  const intolerable = rows.filter((r) => r.risk_level === "Intolerable").length;
  const nonCompliant = rows.filter((r) => r.compliance_status !== "Compliant").length;

  const boolRate = (field: keyof HomeLegionellaRiskAssessmentRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const remedialActionCount = rows.filter((r) => r.remedial_action_required === true).length;

  // negative_test_rate: % of tested rows where result is "Negative"
  const testedRows = rows.filter((r) => r.legionella_test_completed === true);
  const negativeTests = testedRows.filter((r) => r.legionella_test_result === "Negative").length;
  const negativeTestRate =
    testedRows.length > 0
      ? Math.round((negativeTests / testedRows.length) * 1000) / 10
      : 0;

  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  const riskBreakdown: Record<string, number> = {};
  for (const r of rows) riskBreakdown[r.risk_level] = (riskBreakdown[r.risk_level] ?? 0) + 1;

  const systemTypeBreakdown: Record<string, number> = {};
  for (const r of rows) systemTypeBreakdown[r.water_system_type] = (systemTypeBreakdown[r.water_system_type] ?? 0) + 1;

  const complianceBreakdown: Record<string, number> = {};
  for (const r of rows) complianceBreakdown[r.compliance_status] = (complianceBreakdown[r.compliance_status] ?? 0) + 1;

  return {
    total_assessments: total,
    high_risk_count: highRisk,
    intolerable_count: intolerable,
    non_compliant_count: nonCompliant,
    temperature_compliance_rate: boolRate("temperature_compliant"),
    flushing_compliance_rate: boolRate("flushing_regime_compliant"),
    water_treatment_rate: boolRate("water_treatment_in_place"),
    legionella_test_rate: boolRate("legionella_test_completed"),
    remedial_action_count: remedialActionCount,
    negative_test_rate: negativeTestRate,
    unique_assessors: uniqueAssessors,
    risk_breakdown: riskBreakdown,
    system_type_breakdown: systemTypeBreakdown,
    compliance_breakdown: complianceBreakdown,
  };
}

export function computeAlerts(
  rows: HomeLegionellaRiskAssessmentRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: "Immediate Action" legionella test result
  for (const r of rows) {
    if (r.legionella_test_result === "Immediate Action") {
      alerts.push({
        type: "immediate_action_test_result",
        severity: "critical",
        message: `Legionella test result "Immediate Action" for ${r.water_system_type} system assessed on ${r.assessment_date} — immediate remedial action required under ACOP L8`,
        record_id: r.id,
      });
    }
  }

  // Critical: "Intolerable" risk level
  for (const r of rows) {
    if (r.risk_level === "Intolerable") {
      alerts.push({
        type: "intolerable_risk",
        severity: "critical",
        message: `Intolerable legionella risk level for ${r.water_system_type} system assessed on ${r.assessment_date} — immediate action required under ACOP L8`,
        record_id: r.id,
      });
    }
  }

  // High: "High" risk level without remedial action required
  for (const r of rows) {
    if (r.risk_level === "High" && !r.remedial_action_required) {
      alerts.push({
        type: "high_risk_no_remedial",
        severity: "high",
        message: `High legionella risk level for ${r.water_system_type} system assessed on ${r.assessment_date} but no remedial action has been recorded — remedial action should be planned`,
        record_id: r.id,
      });
    }
  }

  // Medium: temperature not compliant
  for (const r of rows) {
    if (!r.temperature_compliant) {
      alerts.push({
        type: "temperature_non_compliant",
        severity: "medium",
        message: `Water temperature non-compliant for ${r.water_system_type} system assessed on ${r.assessment_date} — temperatures must be maintained within safe limits to prevent legionella growth`,
        record_id: r.id,
      });
    }
  }

  // Medium: flushing regime not compliant
  for (const r of rows) {
    if (!r.flushing_regime_compliant) {
      alerts.push({
        type: "flushing_non_compliant",
        severity: "medium",
        message: `Flushing regime non-compliant for ${r.water_system_type} system assessed on ${r.assessment_date} — regular flushing is required to prevent stagnation and legionella growth`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function computeAriaInsights(
  metrics: ReturnType<typeof computeMetrics>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `${metrics.total_assessments} legionella risk ${metrics.total_assessments === 1 ? "assessment" : "assessments"} recorded across ${metrics.unique_assessors} ${metrics.unique_assessors === 1 ? "assessor" : "assessors"}. ` +
      `Temperature compliance at ${metrics.temperature_compliance_rate}%, flushing compliance at ${metrics.flushing_compliance_rate}%, ` +
      `and legionella testing completed in ${metrics.legionella_test_rate}% of assessments.`,
  );

  // Insight 2: Priority items from alerts
  const criticalCount = metrics.intolerable_count;
  const highRiskCount = metrics.high_risk_count;
  if (criticalCount > 0 || highRiskCount > 0) {
    insights.push(
      `${criticalCount} intolerable and ${highRiskCount} high-risk ${highRiskCount === 1 ? "finding" : "findings"} identified. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "assessment" : "assessments"} with non-compliant status. ` +
        `${metrics.remedial_action_count} remedial ${metrics.remedial_action_count === 1 ? "action" : "actions"} required.`,
    );
  } else {
    insights.push(
      `No intolerable or high-risk findings currently recorded. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "assessment" : "assessments"} with non-compliant status and ${metrics.remedial_action_count} remedial ${metrics.remedial_action_count === 1 ? "action" : "actions"} required. ` +
        `Continue regular monitoring to maintain ACOP L8 compliance.`,
    );
  }

  // Insight 3: Reflective question about water safety and ACOP L8
  if (criticalCount > 0 || highRiskCount > 0) {
    insights.push(
      `${criticalCount + highRiskCount} ${(criticalCount + highRiskCount) === 1 ? "assessment has" : "assessments have"} an intolerable or high legionella risk level. ` +
        `What immediate steps are being taken to reduce risk to an acceptable level, ` +
        `and is the home's written scheme for legionella control under ACOP L8 up to date?`,
    );
  } else if (metrics.temperature_compliance_rate < 100 || metrics.flushing_compliance_rate < 100) {
    insights.push(
      `Temperature compliance is at ${metrics.temperature_compliance_rate}% and flushing compliance is at ${metrics.flushing_compliance_rate}%. ` +
        `How can the home improve water safety monitoring routines to ensure full compliance with ACOP L8, ` +
        `and are all staff aware of the legionella control procedures?`,
    );
  } else {
    insights.push(
      `All assessments show compliant temperatures and flushing regimes with no high or intolerable risk levels. ` +
        `How can the home build on this strong water safety culture to continually improve, ` +
        `and is the written scheme under ACOP L8 reviewed at least every two years?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMetrics,
  computeAlerts,
  computeAriaInsights,
};
