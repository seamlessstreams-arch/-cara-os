// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WATER HYGIENE MANAGEMENT SERVICE
// Tracks water temperature monitoring, flushing regimes, TMV servicing,
// showerhead descaling, dead leg checks, water sampling, and Legionella
// compliance in accordance with HSG274 and ACOP L8.
//
// Covers: Temperature monitoring (hot/cold/return), weekly and monthly
// flushing, quarterly reviews, showerhead descaling, TMV servicing,
// dead leg identification, water sampling and results, annual reviews,
// and compliance status tracking.
//
// SCCIF: Safety — "The premises are safe and well maintained."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const CHECK_TYPES = [
  "Temperature Monitoring",
  "Weekly Flushing",
  "Monthly Flushing",
  "Quarterly Review",
  "Showerhead Descale",
  "TMV Service",
  "Dead Leg Check",
  "Water Sampling",
  "Annual Review",
] as const;
export type CheckType = (typeof CHECK_TYPES)[number];

export const SAMPLE_RESULTS = [
  "Clear",
  "Legionella Detected",
  "Elevated Count",
  "Acceptable",
] as const;
export type SampleResult = (typeof SAMPLE_RESULTS)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Action Required",
  "Overdue",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeWaterHygieneManagementRow {
  id: string;
  home_id: string;
  check_date: string;
  checker_name: string;
  check_type: CheckType;
  location: string;
  hot_water_temp: number | null;
  cold_water_temp: number | null;
  return_temp: number | null;
  hot_temp_compliant: boolean;
  cold_temp_compliant: boolean;
  flushing_completed: boolean;
  tmv_functioning: boolean | null;
  showerhead_descaled: boolean | null;
  dead_legs_identified: boolean;
  sample_taken: boolean;
  sample_result: SampleResult | null;
  next_check_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CHECK_TYPE_LABELS: { type: CheckType; label: string }[] = [
  { type: "Temperature Monitoring", label: "Temperature Monitoring" },
  { type: "Weekly Flushing", label: "Weekly Flushing" },
  { type: "Monthly Flushing", label: "Monthly Flushing" },
  { type: "Quarterly Review", label: "Quarterly Review" },
  { type: "Showerhead Descale", label: "Showerhead Descale" },
  { type: "TMV Service", label: "TMV Service" },
  { type: "Dead Leg Check", label: "Dead Leg Check" },
  { type: "Water Sampling", label: "Water Sampling" },
  { type: "Annual Review", label: "Annual Review" },
];

export const SAMPLE_RESULT_LABELS: { value: SampleResult; label: string }[] = [
  { value: "Clear", label: "Clear" },
  { value: "Legionella Detected", label: "Legionella Detected" },
  { value: "Elevated Count", label: "Elevated Count" },
  { value: "Acceptable", label: "Acceptable" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Compliant", label: "Compliant" },
  { status: "Non-Compliant", label: "Non-Compliant" },
  { status: "Action Required", label: "Action Required" },
  { status: "Overdue", label: "Overdue" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeWaterHygieneManagementMetrics(
  rows: HomeWaterHygieneManagementRow[],
): {
  total_checks: number;
  hot_temp_compliant_rate: number;
  cold_temp_compliant_rate: number;
  flushing_rate: number;
  sample_taken_rate: number;
  legionella_detected_count: number;
  non_compliant_count: number;
  action_required_count: number;
  dead_legs_count: number;
  avg_hot_temp: number;
  avg_cold_temp: number;
  unique_locations: number;
  unique_checkers: number;
} {
  const total = rows.length;

  const hotCompliant = rows.filter((r) => r.hot_temp_compliant).length;
  const hotCompliantRate =
    total > 0
      ? Math.round((hotCompliant / total) * 1000) / 10
      : 0;

  const coldCompliant = rows.filter((r) => r.cold_temp_compliant).length;
  const coldCompliantRate =
    total > 0
      ? Math.round((coldCompliant / total) * 1000) / 10
      : 0;

  const flushingCompleted = rows.filter((r) => r.flushing_completed).length;
  const flushingRate =
    total > 0
      ? Math.round((flushingCompleted / total) * 1000) / 10
      : 0;

  const samplesTaken = rows.filter((r) => r.sample_taken).length;
  const sampleTakenRate =
    total > 0
      ? Math.round((samplesTaken / total) * 1000) / 10
      : 0;

  const legionellaDetected = rows.filter(
    (r) => r.sample_result === "Legionella Detected",
  ).length;

  const nonCompliant = rows.filter(
    (r) => r.compliance_status === "Non-Compliant",
  ).length;

  const actionRequired = rows.filter(
    (r) => r.compliance_status === "Action Required",
  ).length;

  const deadLegs = rows.filter((r) => r.dead_legs_identified).length;

  const hotTemps = rows
    .map((r) => r.hot_water_temp)
    .filter((t): t is number => t !== null);
  const avgHot =
    hotTemps.length > 0
      ? Math.round((hotTemps.reduce((s, t) => s + t, 0) / hotTemps.length) * 10) / 10
      : 0;

  const coldTemps = rows
    .map((r) => r.cold_water_temp)
    .filter((t): t is number => t !== null);
  const avgCold =
    coldTemps.length > 0
      ? Math.round((coldTemps.reduce((s, t) => s + t, 0) / coldTemps.length) * 10) / 10
      : 0;

  const uniqueLocations = new Set(rows.map((r) => r.location)).size;
  const uniqueCheckers = new Set(rows.map((r) => r.checker_name)).size;

  return {
    total_checks: total,
    hot_temp_compliant_rate: hotCompliantRate,
    cold_temp_compliant_rate: coldCompliantRate,
    flushing_rate: flushingRate,
    sample_taken_rate: sampleTakenRate,
    legionella_detected_count: legionellaDetected,
    non_compliant_count: nonCompliant,
    action_required_count: actionRequired,
    dead_legs_count: deadLegs,
    avg_hot_temp: avgHot,
    avg_cold_temp: avgCold,
    unique_locations: uniqueLocations,
    unique_checkers: uniqueCheckers,
  };
}

export function identifyWaterHygieneManagementAlerts(
  rows: HomeWaterHygieneManagementRow[],
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

  // Critical: Legionella detected in sample
  for (const r of rows) {
    if (r.sample_result === "Legionella Detected") {
      alerts.push({
        type: "legionella_detected",
        severity: "critical",
        message: `Legionella detected in water sample at ${r.location} on ${r.check_date} — immediate action required under HSG274 and ACOP L8 to protect occupant health`,
        record_id: r.id,
      });
    }
  }

  // Critical: hot water below 50 degrees C (proliferation risk)
  for (const r of rows) {
    if (r.hot_water_temp !== null && r.hot_water_temp < 50) {
      alerts.push({
        type: "hot_water_low",
        severity: "critical",
        message: `Hot water temperature of ${r.hot_water_temp}°C recorded at ${r.location} on ${r.check_date} is below 50°C — Legionella proliferation risk under HSG274`,
        record_id: r.id,
      });
    }
  }

  // High: cold water above 20 degrees C
  for (const r of rows) {
    if (r.cold_water_temp !== null && r.cold_water_temp > 20) {
      alerts.push({
        type: "cold_water_high",
        severity: "high",
        message: `Cold water temperature of ${r.cold_water_temp}°C recorded at ${r.location} on ${r.check_date} exceeds 20°C — risk of bacterial growth in cold water system`,
        record_id: r.id,
      });
    }
  }

  // High: Non-Compliant status
  for (const r of rows) {
    if (r.compliance_status === "Non-Compliant") {
      alerts.push({
        type: "non_compliant",
        severity: "high",
        message: `Non-Compliant water hygiene status at ${r.location} on ${r.check_date} — action required to meet HSG274 and ACOP L8 requirements`,
        record_id: r.id,
      });
    }
  }

  // Medium: flushing not completed
  for (const r of rows) {
    if (!r.flushing_completed) {
      alerts.push({
        type: "flushing_incomplete",
        severity: "medium",
        message: `Flushing not completed at ${r.location} on ${r.check_date} — regular flushing is required to prevent water stagnation and bacterial growth`,
        record_id: r.id,
      });
    }
  }

  // Medium: dead legs identified
  for (const r of rows) {
    if (r.dead_legs_identified) {
      alerts.push({
        type: "dead_legs_found",
        severity: "medium",
        message: `Dead legs identified in water system at ${r.location} on ${r.check_date} — dead legs create stagnation points that increase Legionella risk`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateWaterHygieneManagementCaraInsights(
  rows: HomeWaterHygieneManagementRow[],
): string[] {
  const metrics = computeWaterHygieneManagementMetrics(rows);
  const alerts = identifyWaterHygieneManagementAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[cyan] ${metrics.total_checks} water hygiene checks recorded across ${metrics.unique_locations} ${metrics.unique_locations === 1 ? "location" : "locations"} by ${metrics.unique_checkers} ${metrics.unique_checkers === 1 ? "checker" : "checkers"}. ` +
      `Hot water compliance rate is ${metrics.hot_temp_compliant_rate}%, cold water compliance rate is ${metrics.cold_temp_compliant_rate}%. ` +
      `Average hot water temperature is ${metrics.avg_hot_temp}°C and average cold water temperature is ${metrics.avg_cold_temp}°C.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority water hygiene alerts identified. ` +
        `${metrics.legionella_detected_count} ${metrics.legionella_detected_count === 1 ? "sample has" : "samples have"} detected Legionella. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "check is" : "checks are"} Non-Compliant and ${metrics.action_required_count} require action.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority water hygiene alerts currently active. ` +
        `Flushing completion rate is ${metrics.flushing_rate}% and sample collection rate is ${metrics.sample_taken_rate}%. ` +
        `Continue regular monitoring to maintain HSG274 and ACOP L8 compliance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.legionella_detected_count > 0) {
    insights.push(
      `[reflect] ${metrics.legionella_detected_count} Legionella ${metrics.legionella_detected_count === 1 ? "detection has" : "detections have"} been recorded across water hygiene checks. ` +
        `What immediate remedial actions have been taken following positive Legionella results, ` +
        `and is the water management risk assessment up to date?`,
    );
  } else if (metrics.dead_legs_count > 0 || metrics.non_compliant_count > 0) {
    insights.push(
      `[reflect] ${metrics.dead_legs_count} dead ${metrics.dead_legs_count === 1 ? "leg has" : "legs have"} been identified and ${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "check is" : "checks are"} Non-Compliant. ` +
        `How can the home address identified dead legs and improve compliance rates, ` +
        `and are flushing regimes being consistently followed across all outlets?`,
    );
  } else {
    insights.push(
      `[reflect] All water hygiene checks show no Legionella detections and no dead legs identified. ` +
        `How can the home continue to maintain this high standard of water hygiene management, ` +
        `and are staff aware of how to report water temperature or quality concerns between formal checks?`,
    );
  }

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listHomeWaterHygieneManagement(
  homeId: string,
  filters?: {
    checkType?: CheckType;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<HomeWaterHygieneManagementRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  let q = (sb.from("cs_home_water_hygiene_management") as SB).select("*").eq("home_id", homeId);
  if (filters?.checkType) q = q.eq("check_type", filters.checkType);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  q = q.order("check_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeWaterHygieneManagement(input: {
  homeId: string;
  checkDate: string;
  checkerName: string;
  checkType: CheckType;
  location: string;
  hotWaterTemp?: number | null;
  coldWaterTemp?: number | null;
  returnTemp?: number | null;
  hotTempCompliant: boolean;
  coldTempCompliant: boolean;
  flushingCompleted: boolean;
  tmvFunctioning?: boolean | null;
  showerheadDescaled?: boolean | null;
  deadLegsIdentified: boolean;
  sampleTaken: boolean;
  sampleResult?: SampleResult | null;
  nextCheckDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeWaterHygieneManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_water_hygiene_management") as SB)
    .insert({
      home_id: input.homeId,
      check_date: input.checkDate,
      checker_name: input.checkerName,
      check_type: input.checkType,
      location: input.location,
      hot_water_temp: input.hotWaterTemp ?? null,
      cold_water_temp: input.coldWaterTemp ?? null,
      return_temp: input.returnTemp ?? null,
      hot_temp_compliant: input.hotTempCompliant,
      cold_temp_compliant: input.coldTempCompliant,
      flushing_completed: input.flushingCompleted,
      tmv_functioning: input.tmvFunctioning ?? null,
      showerhead_descaled: input.showerheadDescaled ?? null,
      dead_legs_identified: input.deadLegsIdentified,
      sample_taken: input.sampleTaken,
      sample_result: input.sampleResult ?? null,
      next_check_date: input.nextCheckDate ?? null,
      compliance_status: input.complianceStatus,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHomeWaterHygieneManagement(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HomeWaterHygieneManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_water_hygiene_management") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteHomeWaterHygieneManagement(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { error } = await (sb.from("cs_home_water_hygiene_management") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeWaterHygieneManagementMetrics,
  identifyWaterHygieneManagementAlerts,
  generateWaterHygieneManagementCaraInsights,
};
