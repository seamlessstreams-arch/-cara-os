// ══════════════════════════════════════════════════════════════════════════════
// CARA — WATER SAFETY & LEGIONELLA SERVICE
// Tracks water temperature monitoring, legionella risk assessments,
// flushing schedules, shower head cleaning, and dead-leg management.
// CHR 2015 Reg 25 (health and safety — water safety),
// Reg 36 (fitness of premises — water systems),
// HSE Approved Code of Practice L8, HSG274.
//
// Covers: temperature checks, flushing records, legionella assessments,
// scalding prevention, TMV checks, and water system maintenance.
//
// SCCIF: Helped & Protected — "Water systems are safe."
// "Children are protected from scalding and legionella risks."
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

export type WaterCheckType =
  | "temperature_check"
  | "legionella_risk_assessment"
  | "flushing_record"
  | "shower_head_clean"
  | "tmv_check"
  | "dead_leg_flush"
  | "water_tank_inspection"
  | "scalding_risk_assessment"
  | "water_quality_test"
  | "other";

export type WaterLocation =
  | "bathroom_1"
  | "bathroom_2"
  | "en_suite"
  | "kitchen"
  | "utility_room"
  | "downstairs_toilet"
  | "staff_bathroom"
  | "laundry"
  | "other";

export type TemperatureCompliance =
  | "compliant"
  | "too_hot"
  | "too_cold"
  | "not_tested"
  | "tmv_fault";

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "very_high"
  | "not_assessed";

export interface WaterSafetyRecord {
  id: string;
  home_id: string;
  check_type: WaterCheckType;
  check_date: string;
  location: WaterLocation;
  hot_water_temp: number | null;
  cold_water_temp: number | null;
  temperature_compliance: TemperatureCompliance;
  risk_level: RiskLevel;
  tmv_fitted: boolean;
  tmv_operational: boolean;
  flushing_completed: boolean;
  legionella_assessment_current: boolean;
  scalding_risk_mitigated: boolean;
  issues_found: string[];
  actions_taken: string[];
  checked_by: string;
  next_check_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const WATER_CHECK_TYPES: { type: WaterCheckType; label: string }[] = [
  { type: "temperature_check", label: "Temperature Check" },
  { type: "legionella_risk_assessment", label: "Legionella Risk Assessment" },
  { type: "flushing_record", label: "Flushing Record" },
  { type: "shower_head_clean", label: "Shower Head Clean" },
  { type: "tmv_check", label: "TMV Check" },
  { type: "dead_leg_flush", label: "Dead Leg Flush" },
  { type: "water_tank_inspection", label: "Water Tank Inspection" },
  { type: "scalding_risk_assessment", label: "Scalding Risk Assessment" },
  { type: "water_quality_test", label: "Water Quality Test" },
  { type: "other", label: "Other" },
];

export const WATER_LOCATIONS: { location: WaterLocation; label: string }[] = [
  { location: "bathroom_1", label: "Bathroom 1" },
  { location: "bathroom_2", label: "Bathroom 2" },
  { location: "en_suite", label: "En Suite" },
  { location: "kitchen", label: "Kitchen" },
  { location: "utility_room", label: "Utility Room" },
  { location: "downstairs_toilet", label: "Downstairs Toilet" },
  { location: "staff_bathroom", label: "Staff Bathroom" },
  { location: "laundry", label: "Laundry" },
  { location: "other", label: "Other" },
];

export const TEMPERATURE_COMPLIANCES: { status: TemperatureCompliance; label: string }[] = [
  { status: "compliant", label: "Compliant" },
  { status: "too_hot", label: "Too Hot" },
  { status: "too_cold", label: "Too Cold" },
  { status: "not_tested", label: "Not Tested" },
  { status: "tmv_fault", label: "TMV Fault" },
];

export const RISK_LEVELS: { level: RiskLevel; label: string }[] = [
  { level: "low", label: "Low" },
  { level: "medium", label: "Medium" },
  { level: "high", label: "High" },
  { level: "very_high", label: "Very High" },
  { level: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeWaterSafetyMetrics(
  records: WaterSafetyRecord[],
): {
  total_records: number;
  temperature_check_count: number;
  legionella_assessment_count: number;
  flushing_count: number;
  tmv_check_count: number;
  compliant_rate: number | null;
  too_hot_count: number;
  too_cold_count: number;
  tmv_fault_count: number;
  tmv_fitted_rate: number | null;
  tmv_operational_rate: number | null;
  flushing_completed_rate: number | null;
  legionella_assessment_current_rate: number | null;
  scalding_risk_mitigated_rate: number | null;
  high_risk_count: number;
  very_high_risk_count: number;
  average_hot_temp: number | null;
  average_cold_temp: number | null;
  check_overdue_count: number;
  by_check_type: Record<string, number>;
  by_location: Record<string, number>;
  by_temperature_compliance: Record<string, number>;
  by_risk_level: Record<string, number>;
} {
  const tempCheck = records.filter((r) => r.check_type === "temperature_check").length;
  const legionella = records.filter((r) => r.check_type === "legionella_risk_assessment").length;
  const flushing = records.filter((r) => r.check_type === "flushing_record").length;
  const tmvCheck = records.filter((r) => r.check_type === "tmv_check").length;

  const compliant = records.filter((r) => r.temperature_compliance === "compliant").length;
  const compliantRate =
    records.length > 0
      ? Math.round((compliant / records.length) * 1000) / 10
      : null;

  const tooHot = records.filter((r) => r.temperature_compliance === "too_hot").length;
  const tooCold = records.filter((r) => r.temperature_compliance === "too_cold").length;
  const tmvFault = records.filter((r) => r.temperature_compliance === "tmv_fault").length;

  const tmvFitted = records.filter((r) => r.tmv_fitted).length;
  const tmvFittedRate =
    records.length > 0
      ? Math.round((tmvFitted / records.length) * 1000) / 10
      : null;

  const tmvOp = records.filter((r) => r.tmv_operational).length;
  const tmvOpRate =
    records.length > 0
      ? Math.round((tmvOp / records.length) * 1000) / 10
      : null;

  const flushDone = records.filter((r) => r.flushing_completed).length;
  const flushRate =
    records.length > 0
      ? Math.round((flushDone / records.length) * 1000) / 10
      : null;

  const legionellaCurrent = records.filter((r) => r.legionella_assessment_current).length;
  const legionellaRate =
    records.length > 0
      ? Math.round((legionellaCurrent / records.length) * 1000) / 10
      : null;

  const scaldMit = records.filter((r) => r.scalding_risk_mitigated).length;
  const scaldRate =
    records.length > 0
      ? Math.round((scaldMit / records.length) * 1000) / 10
      : null;

  const highRisk = records.filter((r) => r.risk_level === "high").length;
  const veryHighRisk = records.filter((r) => r.risk_level === "very_high").length;

  const hotTemps = records.filter((r) => r.hot_water_temp !== null).map((r) => r.hot_water_temp!);
  const avgHot =
    hotTemps.length > 0
      ? Math.round((hotTemps.reduce((a, b) => a + b, 0) / hotTemps.length) * 10) / 10
      : null;

  const coldTemps = records.filter((r) => r.cold_water_temp !== null).map((r) => r.cold_water_temp!);
  const avgCold =
    coldTemps.length > 0
      ? Math.round((coldTemps.reduce((a, b) => a + b, 0) / coldTemps.length) * 10) / 10
      : null;

  const now = new Date();
  const checkOverdue = records.filter((r) => {
    if (!r.next_check_date) return false;
    return new Date(r.next_check_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.check_type] = (byType[r.check_type] ?? 0) + 1;

  const byLocation: Record<string, number> = {};
  for (const r of records) byLocation[r.location] = (byLocation[r.location] ?? 0) + 1;

  const byTemp: Record<string, number> = {};
  for (const r of records) byTemp[r.temperature_compliance] = (byTemp[r.temperature_compliance] ?? 0) + 1;

  const byRisk: Record<string, number> = {};
  for (const r of records) byRisk[r.risk_level] = (byRisk[r.risk_level] ?? 0) + 1;

  return {
    total_records: records.length,
    temperature_check_count: tempCheck,
    legionella_assessment_count: legionella,
    flushing_count: flushing,
    tmv_check_count: tmvCheck,
    compliant_rate: compliantRate,
    too_hot_count: tooHot,
    too_cold_count: tooCold,
    tmv_fault_count: tmvFault,
    tmv_fitted_rate: tmvFittedRate,
    tmv_operational_rate: tmvOpRate,
    flushing_completed_rate: flushRate,
    legionella_assessment_current_rate: legionellaRate,
    scalding_risk_mitigated_rate: scaldRate,
    high_risk_count: highRisk,
    very_high_risk_count: veryHighRisk,
    average_hot_temp: avgHot,
    average_cold_temp: avgCold,
    check_overdue_count: checkOverdue,
    by_check_type: byType,
    by_location: byLocation,
    by_temperature_compliance: byTemp,
    by_risk_level: byRisk,
  };
}

export function identifyWaterSafetyAlerts(
  records: WaterSafetyRecord[],
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

  // Scalding risk — too hot water
  for (const r of records) {
    if (r.temperature_compliance === "too_hot") {
      alerts.push({
        type: "scalding_risk",
        severity: "critical",
        message: `Scalding risk at ${r.location.replace(/_/g, " ")} on ${r.check_date} — water too hot, immediate action required`,
        id: r.id,
      });
    }
  }

  // Very high risk
  for (const r of records) {
    if (r.risk_level === "very_high") {
      alerts.push({
        type: "very_high_risk",
        severity: "critical",
        message: `Very high water safety risk at ${r.location.replace(/_/g, " ")} on ${r.check_date} — escalate immediately`,
        id: r.id,
      });
    }
  }

  // TMV fault
  const tmvFaults = records.filter((r) => r.temperature_compliance === "tmv_fault").length;
  if (tmvFaults >= 1) {
    alerts.push({
      type: "tmv_fault",
      severity: "high",
      message: `${tmvFaults} TMV ${tmvFaults === 1 ? "fault" : "faults"} detected — arrange repair to prevent scalding`,
      id: "tmv_fault",
    });
  }

  // Legionella assessment not current
  const legionellaLapsed = records.filter((r) => !r.legionella_assessment_current).length;
  if (legionellaLapsed >= 2) {
    alerts.push({
      type: "legionella_lapsed",
      severity: "high",
      message: `${legionellaLapsed} records without current legionella assessment — arrange assessment urgently`,
      id: "legionella_lapsed",
    });
  }

  // Check overdue
  const now = new Date();
  const checkOverdue = records.filter((r) => {
    if (!r.next_check_date) return false;
    return new Date(r.next_check_date) < now;
  }).length;
  if (checkOverdue >= 1) {
    alerts.push({
      type: "check_overdue",
      severity: "medium",
      message: `${checkOverdue} water safety ${checkOverdue === 1 ? "check is" : "checks are"} overdue — schedule promptly`,
      id: "check_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    checkType?: WaterCheckType;
    location?: WaterLocation;
    temperatureCompliance?: TemperatureCompliance;
    limit?: number;
  },
): Promise<ServiceResult<WaterSafetyRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_water_safety") as SB).select("*").eq("home_id", homeId);
  if (filters?.checkType) q = q.eq("check_type", filters.checkType);
  if (filters?.location) q = q.eq("location", filters.location);
  if (filters?.temperatureCompliance) q = q.eq("temperature_compliance", filters.temperatureCompliance);
  q = q.order("check_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    checkType: WaterCheckType;
    checkDate: string;
    location: WaterLocation;
    hotWaterTemp?: number;
    coldWaterTemp?: number;
    temperatureCompliance: TemperatureCompliance;
    riskLevel: RiskLevel;
    tmvFitted: boolean;
    tmvOperational: boolean;
    flushingCompleted: boolean;
    legionellaAssessmentCurrent: boolean;
    scaldingRiskMitigated: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    checkedBy: string;
    nextCheckDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<WaterSafetyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_water_safety") as SB)
    .insert({
      home_id: input.homeId,
      check_type: input.checkType,
      check_date: input.checkDate,
      location: input.location,
      hot_water_temp: input.hotWaterTemp ?? null,
      cold_water_temp: input.coldWaterTemp ?? null,
      temperature_compliance: input.temperatureCompliance,
      risk_level: input.riskLevel,
      tmv_fitted: input.tmvFitted,
      tmv_operational: input.tmvOperational,
      flushing_completed: input.flushingCompleted,
      legionella_assessment_current: input.legionellaAssessmentCurrent,
      scalding_risk_mitigated: input.scaldingRiskMitigated,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      checked_by: input.checkedBy,
      next_check_date: input.nextCheckDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<WaterSafetyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_water_safety") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeWaterSafetyMetrics,
  identifyWaterSafetyAlerts,
};
