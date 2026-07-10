// ==============================================================================
// CARA -- HOME EMERGENCY LIGHTING SERVICE
// Tracks emergency lighting testing and compliance including monthly function
// tests, annual duration tests, quarterly inspections, battery condition
// monitoring, escape route coverage, and signage visibility for children's
// residential homes.
//
// Covers: Test scheduling and tracking, luminaire type classification,
// battery condition assessment, illumination adequacy, escape route
// coverage verification, signage visibility checks, fault identification
// and rectification, compliance status management.
//
// SCCIF: Safety -- "Leaders and managers ensure emergency lighting systems
// are regularly tested and maintained to protect children and staff in
// the event of power failure."
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const TEST_TYPES = [
  "Monthly Function Test",
  "Annual Duration Test",
  "Quarterly Inspection",
  "Post-Fault Retest",
  "Commissioning",
  "Replacement",
] as const;
export type TestType = (typeof TEST_TYPES)[number];

export const LUMINAIRE_TYPES = [
  "Self-Contained",
  "Central Battery",
  "Maintained",
  "Non-Maintained",
  "Combined",
  "Exit Sign",
] as const;
export type LuminaireType = (typeof LUMINAIRE_TYPES)[number];

export const TEST_RESULTS = [
  "Pass",
  "Fail",
  "Partial",
  "Not Tested",
] as const;
export type TestResult = (typeof TEST_RESULTS)[number];

export const BATTERY_CONDITIONS = [
  "Good",
  "Fair",
  "Poor",
  "Failed",
  "Replaced",
  "N/A",
] as const;
export type BatteryCondition = (typeof BATTERY_CONDITIONS)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Remedial Required",
  "Overdue",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// -- Row type -----------------------------------------------------------------

export interface HomeEmergencyLightingRow {
  id: string;
  home_id: string;
  test_date: string;
  tester_name: string;
  test_type: TestType;
  location: string;
  luminaire_type: LuminaireType;
  test_result: TestResult;
  battery_condition: BatteryCondition;
  duration_minutes: number | null;
  illumination_adequate: boolean;
  escape_route_covered: boolean;
  signage_visible: boolean;
  fault_identified: boolean;
  fault_rectified: boolean;
  next_test_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Constants ----------------------------------------------------------------

export const TEST_TYPE_LABELS: { type: TestType; label: string }[] = [
  { type: "Monthly Function Test", label: "Monthly Function Test" },
  { type: "Annual Duration Test", label: "Annual Duration Test" },
  { type: "Quarterly Inspection", label: "Quarterly Inspection" },
  { type: "Post-Fault Retest", label: "Post-Fault Retest" },
  { type: "Commissioning", label: "Commissioning" },
  { type: "Replacement", label: "Replacement" },
];

export const LUMINAIRE_TYPE_LABELS: { type: LuminaireType; label: string }[] = [
  { type: "Self-Contained", label: "Self-Contained" },
  { type: "Central Battery", label: "Central Battery" },
  { type: "Maintained", label: "Maintained" },
  { type: "Non-Maintained", label: "Non-Maintained" },
  { type: "Combined", label: "Combined" },
  { type: "Exit Sign", label: "Exit Sign" },
];

export const TEST_RESULT_LABELS: { result: TestResult; label: string }[] = [
  { result: "Pass", label: "Pass" },
  { result: "Fail", label: "Fail" },
  { result: "Partial", label: "Partial" },
  { result: "Not Tested", label: "Not Tested" },
];

export const BATTERY_CONDITION_LABELS: { condition: BatteryCondition; label: string }[] = [
  { condition: "Good", label: "Good" },
  { condition: "Fair", label: "Fair" },
  { condition: "Poor", label: "Poor" },
  { condition: "Failed", label: "Failed" },
  { condition: "Replaced", label: "Replaced" },
  { condition: "N/A", label: "N/A" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Compliant", label: "Compliant" },
  { status: "Non-Compliant", label: "Non-Compliant" },
  { status: "Remedial Required", label: "Remedial Required" },
  { status: "Overdue", label: "Overdue" },
];

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: HomeEmergencyLightingRow[],
): {
  total_tests: number;
  pass_count: number;
  fail_count: number;
  partial_count: number;
  pass_rate: number;
  battery_good_rate: number;
  battery_poor_rate: number;
  escape_route_rate: number;
  signage_rate: number;
  illumination_rate: number;
  fault_count: number;
  fault_rectified_rate: number;
  avg_duration: number;
  non_compliant_count: number;
  remedial_count: number;
  unique_locations: number;
  unique_testers: number;
} {
  const total = rows.length;

  const passCount = rows.filter((r) => r.test_result === "Pass").length;
  const failCount = rows.filter((r) => r.test_result === "Fail").length;
  const partialCount = rows.filter((r) => r.test_result === "Partial").length;

  const passRate =
    total > 0
      ? Math.round((passCount / total) * 1000) / 10
      : 0;

  const batteryGood = rows.filter(
    (r) => r.battery_condition === "Good" || r.battery_condition === "Fair",
  ).length;
  const batteryGoodRate =
    total > 0
      ? Math.round((batteryGood / total) * 1000) / 10
      : 0;

  const batteryPoor = rows.filter(
    (r) => r.battery_condition === "Poor" || r.battery_condition === "Failed",
  ).length;
  const batteryPoorRate =
    total > 0
      ? Math.round((batteryPoor / total) * 1000) / 10
      : 0;

  const escapeRouteCovered = rows.filter((r) => r.escape_route_covered).length;
  const escapeRouteRate =
    total > 0
      ? Math.round((escapeRouteCovered / total) * 1000) / 10
      : 0;

  const signageVisible = rows.filter((r) => r.signage_visible).length;
  const signageRate =
    total > 0
      ? Math.round((signageVisible / total) * 1000) / 10
      : 0;

  const illuminationAdequate = rows.filter((r) => r.illumination_adequate).length;
  const illuminationRate =
    total > 0
      ? Math.round((illuminationAdequate / total) * 1000) / 10
      : 0;

  const faultCount = rows.filter((r) => r.fault_identified).length;

  const faultIdentifiedRows = rows.filter((r) => r.fault_identified);
  const faultRectifiedCount = faultIdentifiedRows.filter(
    (r) => r.fault_rectified,
  ).length;
  const faultRectifiedRate =
    faultIdentifiedRows.length > 0
      ? Math.round((faultRectifiedCount / faultIdentifiedRows.length) * 1000) / 10
      : 0;

  const durationRows = rows.filter((r) => r.duration_minutes !== null);
  const totalDuration = durationRows.reduce(
    (sum, r) => sum + (r.duration_minutes as number),
    0,
  );
  const avgDuration =
    durationRows.length > 0
      ? Math.round((totalDuration / durationRows.length) * 10) / 10
      : 0;

  const nonCompliantCount = rows.filter(
    (r) => r.compliance_status === "Non-Compliant",
  ).length;

  const remedialCount = rows.filter(
    (r) => r.compliance_status === "Remedial Required",
  ).length;

  const uniqueLocations = new Set(rows.map((r) => r.location)).size;
  const uniqueTesters = new Set(rows.map((r) => r.tester_name)).size;

  return {
    total_tests: total,
    pass_count: passCount,
    fail_count: failCount,
    partial_count: partialCount,
    pass_rate: passRate,
    battery_good_rate: batteryGoodRate,
    battery_poor_rate: batteryPoorRate,
    escape_route_rate: escapeRouteRate,
    signage_rate: signageRate,
    illumination_rate: illuminationRate,
    fault_count: faultCount,
    fault_rectified_rate: faultRectifiedRate,
    avg_duration: avgDuration,
    non_compliant_count: nonCompliantCount,
    remedial_count: remedialCount,
    unique_locations: uniqueLocations,
    unique_testers: uniqueTesters,
  };
}

export function computeAlerts(
  rows: HomeEmergencyLightingRow[],
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

  // Critical: fail on escape route (test_result Fail AND escape_route_covered false)
  for (const r of rows) {
    if (r.test_result === "Fail" && !r.escape_route_covered) {
      alerts.push({
        type: "fail_escape_route",
        severity: "critical",
        message: `Emergency lighting failed at ${r.location} tested on ${r.test_date} with escape route not covered — immediate action is required to ensure safe evacuation routes for children and staff`,
        record_id: r.id,
      });
    }
  }

  // Critical: failed battery
  for (const r of rows) {
    if (r.battery_condition === "Failed") {
      alerts.push({
        type: "failed_battery",
        severity: "critical",
        message: `Battery has failed for emergency lighting at ${r.location} tested on ${r.test_date} — the luminaire will not function during a power failure and must be replaced urgently`,
        record_id: r.id,
      });
    }
  }

  // High: non-compliant status
  for (const r of rows) {
    if (r.compliance_status === "Non-Compliant") {
      alerts.push({
        type: "non_compliant_status",
        severity: "high",
        message: `Emergency lighting at ${r.location} tested on ${r.test_date} has been marked as Non-Compliant — immediate remedial action is required to restore compliance`,
        record_id: r.id,
      });
    }
  }

  // High: fault not rectified
  for (const r of rows) {
    if (r.fault_identified && !r.fault_rectified) {
      alerts.push({
        type: "fault_not_rectified",
        severity: "high",
        message: `Fault identified but not rectified for emergency lighting at ${r.location} tested on ${r.test_date} — unresolved faults compromise the safety of the emergency lighting system`,
        record_id: r.id,
      });
    }
  }

  // Medium: partial result
  for (const r of rows) {
    if (r.test_result === "Partial") {
      alerts.push({
        type: "partial_result",
        severity: "medium",
        message: `Emergency lighting at ${r.location} tested on ${r.test_date} returned a partial test result — further investigation and retesting is recommended to confirm full functionality`,
        record_id: r.id,
      });
    }
  }

  // Medium: illumination inadequate
  for (const r of rows) {
    if (!r.illumination_adequate) {
      alerts.push({
        type: "illumination_inadequate",
        severity: "medium",
        message: `Illumination is inadequate for emergency lighting at ${r.location} tested on ${r.test_date} — insufficient illumination may hinder safe evacuation during an emergency`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: HomeEmergencyLightingRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[yellow] ${metrics.total_tests} emergency lighting ${metrics.total_tests === 1 ? "test" : "tests"} recorded across ${metrics.unique_locations} ${metrics.unique_locations === 1 ? "location" : "locations"} by ${metrics.unique_testers} ${metrics.unique_testers === 1 ? "tester" : "testers"}. ` +
      `Pass rate is ${metrics.pass_rate}%, battery good rate is ${metrics.battery_good_rate}%, ` +
      `and escape route coverage rate is ${metrics.escape_route_rate}%.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority emergency lighting alerts identified. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "test is" : "tests are"} non-compliant. ` +
        `${metrics.remedial_count} ${metrics.remedial_count === 1 ? "test requires" : "tests require"} remedial action and ${metrics.fault_count} ${metrics.fault_count === 1 ? "fault has" : "faults have"} been identified.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority emergency lighting alerts currently active. ` +
        `Illumination adequacy rate is ${metrics.illumination_rate}% and signage visibility rate is ${metrics.signage_rate}%. ` +
        `Continue regular emergency lighting testing to maintain fire safety standards.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.non_compliant_count > 0) {
    insights.push(
      `[reflect] ${metrics.non_compliant_count} emergency lighting ${metrics.non_compliant_count === 1 ? "test has" : "tests have"} been recorded as non-compliant across testing records. ` +
        `What immediate remedial actions have been taken to address non-compliance, ` +
        `and is the emergency lighting testing schedule adequate for the home's needs?`,
    );
  } else if (metrics.remedial_count > 0 || metrics.fault_count > 0) {
    insights.push(
      `[reflect] ${metrics.remedial_count} ${metrics.remedial_count === 1 ? "test requires" : "tests require"} remedial action and ${metrics.fault_count} ${metrics.fault_count === 1 ? "fault has" : "faults have"} been identified. ` +
        `How can the home improve its emergency lighting maintenance processes, ` +
        `and are battery conditions and illumination levels being consistently monitored across all locations?`,
    );
  } else {
    insights.push(
      `[reflect] All emergency lighting tests show no non-compliant results and no outstanding faults. ` +
        `How can the home continue to maintain this high standard of emergency lighting compliance, ` +
        `and are staff aware of the testing schedule and procedures for reporting lighting faults?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listHomeEmergencyLighting(
  homeId: string,
  filters?: {
    testType?: TestType;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<HomeEmergencyLightingRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  let q = (sb.from("cs_home_emergency_lighting") as SB).select("*").eq("home_id", homeId);
  if (filters?.testType) q = q.eq("test_type", filters.testType);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  q = q.order("test_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeEmergencyLighting(input: {
  homeId: string;
  testDate: string;
  testerName: string;
  testType: TestType;
  location: string;
  luminaireType: LuminaireType;
  testResult: TestResult;
  batteryCondition: BatteryCondition;
  durationMinutes?: number | null;
  illuminationAdequate: boolean;
  escapeRouteCovered: boolean;
  signageVisible: boolean;
  faultIdentified: boolean;
  faultRectified: boolean;
  nextTestDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeEmergencyLightingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_emergency_lighting") as SB)
    .insert({
      home_id: input.homeId,
      test_date: input.testDate,
      tester_name: input.testerName,
      test_type: input.testType,
      location: input.location,
      luminaire_type: input.luminaireType,
      test_result: input.testResult,
      battery_condition: input.batteryCondition,
      duration_minutes: input.durationMinutes ?? null,
      illumination_adequate: input.illuminationAdequate,
      escape_route_covered: input.escapeRouteCovered,
      signage_visible: input.signageVisible,
      fault_identified: input.faultIdentified,
      fault_rectified: input.faultRectified,
      next_test_date: input.nextTestDate ?? null,
      compliance_status: input.complianceStatus,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHomeEmergencyLighting(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HomeEmergencyLightingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_emergency_lighting") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteHomeEmergencyLighting(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { error } = await (sb.from("cs_home_emergency_lighting") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// -- Testing exports ----------------------------------------------------------

export const _testing = {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
};
