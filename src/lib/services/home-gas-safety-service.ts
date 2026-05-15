// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME GAS SAFETY SERVICE
// Tracks gas safety inspections, CP12 certificates, boiler servicing,
// and compliance with Gas Safety (Installation and Use) Regulations 1998.
//
// Covers: Annual CP12 inspections, boiler servicing, appliance checks,
// flue inspections, emergency call-outs, installations,
// Gas Safe registration verification, defect tracking, remedial works,
// carbon monoxide alarm testing, and certificate management.
//
// SCCIF: Safety — "The premises are safe and well maintained."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const INSPECTION_TYPES = [
  "Annual CP12",
  "Boiler Service",
  "Appliance Check",
  "Flue Inspection",
  "Emergency Call-out",
  "Installation",
] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

export const RESULT_VALUES = [
  "Safe",
  "At Risk",
  "Immediately Dangerous",
  "Not Inspected",
] as const;
export type ResultValue = (typeof RESULT_VALUES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Conditional",
  "Expired",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeGasSafetyRow {
  id: string;
  home_id: string;
  inspection_date: string;
  engineer_name: string;
  gas_safe_registration: string;
  inspection_type: InspectionType;
  appliance_location: string;
  result: ResultValue;
  defects_found: number;
  remedial_completed: boolean;
  certificate_issued: boolean;
  certificate_number: string | null;
  carbon_monoxide_alarm_tested: boolean;
  next_inspection_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const INSPECTION_TYPE_LABELS: { type: InspectionType; label: string }[] = [
  { type: "Annual CP12", label: "Annual CP12" },
  { type: "Boiler Service", label: "Boiler Service" },
  { type: "Appliance Check", label: "Appliance Check" },
  { type: "Flue Inspection", label: "Flue Inspection" },
  { type: "Emergency Call-out", label: "Emergency Call-out" },
  { type: "Installation", label: "Installation" },
];

export const RESULT_LABELS: { value: ResultValue; label: string }[] = [
  { value: "Safe", label: "Safe" },
  { value: "At Risk", label: "At Risk" },
  { value: "Immediately Dangerous", label: "Immediately Dangerous" },
  { value: "Not Inspected", label: "Not Inspected" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Compliant", label: "Compliant" },
  { status: "Non-Compliant", label: "Non-Compliant" },
  { status: "Conditional", label: "Conditional" },
  { status: "Expired", label: "Expired" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeGasSafetyMetrics(
  rows: HomeGasSafetyRow[],
): {
  total_inspections: number;
  immediately_dangerous_count: number;
  at_risk_count: number;
  safe_count: number;
  certificate_rate: number;
  remedial_completion_rate: number;
  co_alarm_rate: number;
  next_inspection_scheduled_rate: number;
  non_compliant_count: number;
  defects_total: number;
  unique_engineers: number;
  by_inspection_type: Record<string, number>;
  by_result: Record<string, number>;
  by_compliance_status: Record<string, number>;
} {
  const total = rows.length;

  const immediatelyDangerous = rows.filter((r) => r.result === "Immediately Dangerous").length;
  const atRisk = rows.filter((r) => r.result === "At Risk").length;
  const safe = rows.filter((r) => r.result === "Safe").length;

  const certificateIssued = rows.filter((r) => r.certificate_issued).length;
  const certificateRate =
    total > 0
      ? Math.round((certificateIssued / total) * 1000) / 10
      : 0;

  const remedialApplicable = rows.filter((r) => r.defects_found > 0);
  const remedialCompleted = remedialApplicable.filter((r) => r.remedial_completed).length;
  const remedialRate =
    remedialApplicable.length > 0
      ? Math.round((remedialCompleted / remedialApplicable.length) * 1000) / 10
      : 0;

  const coTested = rows.filter((r) => r.carbon_monoxide_alarm_tested).length;
  const coAlarmRate =
    total > 0
      ? Math.round((coTested / total) * 1000) / 10
      : 0;

  const scheduled = rows.filter((r) => r.next_inspection_date !== null).length;
  const scheduledRate =
    total > 0
      ? Math.round((scheduled / total) * 1000) / 10
      : 0;

  const nonCompliant = rows.filter(
    (r) =>
      r.compliance_status === "Non-Compliant" ||
      r.compliance_status === "Expired",
  ).length;

  const defectsTotal = rows.reduce((sum, r) => sum + r.defects_found, 0);

  const uniqueEngineers = new Set(rows.map((r) => r.engineer_name)).size;

  const byType: Record<string, number> = {};
  for (const r of rows) byType[r.inspection_type] = (byType[r.inspection_type] ?? 0) + 1;

  const byResult: Record<string, number> = {};
  for (const r of rows) byResult[r.result] = (byResult[r.result] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of rows) byCompliance[r.compliance_status] = (byCompliance[r.compliance_status] ?? 0) + 1;

  return {
    total_inspections: total,
    immediately_dangerous_count: immediatelyDangerous,
    at_risk_count: atRisk,
    safe_count: safe,
    certificate_rate: certificateRate,
    remedial_completion_rate: remedialRate,
    co_alarm_rate: coAlarmRate,
    next_inspection_scheduled_rate: scheduledRate,
    non_compliant_count: nonCompliant,
    defects_total: defectsTotal,
    unique_engineers: uniqueEngineers,
    by_inspection_type: byType,
    by_result: byResult,
    by_compliance_status: byCompliance,
  };
}

export function identifyGasSafetyAlerts(
  rows: HomeGasSafetyRow[],
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

  // Critical: any "Immediately Dangerous" result — gas emergency
  for (const r of rows) {
    if (r.result === "Immediately Dangerous") {
      alerts.push({
        type: "immediately_dangerous",
        severity: "critical",
        message: `Immediately Dangerous result recorded during ${r.inspection_type} at ${r.appliance_location} on ${r.inspection_date} — gas emergency requiring immediate isolation under Gas Safety (Installation and Use) Regulations 1998`,
        record_id: r.id,
      });
    }
  }

  // Critical: any "At Risk" without remedial_completed
  for (const r of rows) {
    if (r.result === "At Risk" && !r.remedial_completed) {
      alerts.push({
        type: "at_risk_unremediated",
        severity: "critical",
        message: `At Risk result during ${r.inspection_type} at ${r.appliance_location} on ${r.inspection_date} with remedial work outstanding — appliance poses a risk to occupants`,
        record_id: r.id,
      });
    }
  }

  // High: any "Non-Compliant" or "Expired"
  for (const r of rows) {
    if (r.compliance_status === "Non-Compliant") {
      alerts.push({
        type: "non_compliant",
        severity: "high",
        message: `Non-Compliant gas safety status for ${r.inspection_type} at ${r.appliance_location} on ${r.inspection_date} — action required to meet Gas Safety Regulations`,
        record_id: r.id,
      });
    }
    if (r.compliance_status === "Expired") {
      alerts.push({
        type: "expired_compliance",
        severity: "high",
        message: `Expired gas safety compliance for ${r.inspection_type} at ${r.appliance_location} on ${r.inspection_date} — certificate renewal required urgently`,
        record_id: r.id,
      });
    }
  }

  // Medium: any !carbon_monoxide_alarm_tested
  for (const r of rows) {
    if (!r.carbon_monoxide_alarm_tested) {
      alerts.push({
        type: "co_alarm_not_tested",
        severity: "medium",
        message: `Carbon monoxide alarm not tested during ${r.inspection_type} at ${r.appliance_location} on ${r.inspection_date} — CO alarm verification required for occupant safety`,
        record_id: r.id,
      });
    }
  }

  // Medium: any next_inspection_date past
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  for (const r of rows) {
    if (r.next_inspection_date !== null && r.next_inspection_date < today) {
      alerts.push({
        type: "inspection_overdue",
        severity: "medium",
        message: `${r.inspection_type} inspection overdue since ${r.next_inspection_date} at ${r.appliance_location} — schedule inspection to maintain Gas Safe compliance`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateGasSafetyAriaInsights(
  rows: HomeGasSafetyRow[],
): string[] {
  const metrics = computeGasSafetyMetrics(rows);
  const alerts = identifyGasSafetyAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[red] ${metrics.total_inspections} gas safety inspections recorded across ${metrics.unique_engineers} ${metrics.unique_engineers === 1 ? "engineer" : "engineers"}. ` +
      `Safe rate is ${metrics.safe_count > 0 && metrics.total_inspections > 0 ? Math.round((metrics.safe_count / metrics.total_inspections) * 1000) / 10 : 0}%, with ${metrics.immediately_dangerous_count} Immediately Dangerous, ${metrics.at_risk_count} At Risk, and ${metrics.defects_total} total defects identified.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority gas safety alerts identified. ` +
        `Remedial completion rate is ${metrics.remedial_completion_rate}% for inspections with defects. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "inspection has" : "inspections have"} Non-Compliant or Expired status requiring urgent attention.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority gas safety alerts currently active. ` +
        `Certificate issuance rate is ${metrics.certificate_rate}% and CO alarm testing rate is ${metrics.co_alarm_rate}%. ` +
        `Continue regular inspections to maintain Gas Safety Regulations compliance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.immediately_dangerous_count > 0 || metrics.at_risk_count > 0) {
    insights.push(
      `[reflect] ${metrics.immediately_dangerous_count} Immediately Dangerous and ${metrics.at_risk_count} At Risk results have been recorded across all inspections. ` +
        `What steps are being taken to ensure all dangerous appliances are isolated or remediated promptly, ` +
        `and is there a clear process for verifying completed remedial work?`,
    );
  } else if (metrics.defects_total > 0 && metrics.remedial_completion_rate < 100) {
    insights.push(
      `[reflect] Remedial completion stands at ${metrics.remedial_completion_rate}% for inspections with defects. ` +
        `How can the home improve its tracking and completion of gas safety remedial works, ` +
        `and are Gas Safe registered engineers being engaged for timely follow-up?`,
    );
  } else {
    insights.push(
      `[reflect] All gas safety inspections show no Immediately Dangerous or At Risk results and remedial work is complete where required. ` +
        `How can the home continue to maintain this high standard of gas safety, ` +
        `and are staff aware of how to report gas safety concerns between formal inspections?`,
    );
  }

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    inspectionType?: InspectionType;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<HomeGasSafetyRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  let q = (sb.from("cs_home_gas_safety") as SB).select("*").eq("home_id", homeId);
  if (filters?.inspectionType) q = q.eq("inspection_type", filters.inspectionType);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  q = q.order("inspection_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(input: {
  homeId: string;
  inspectionDate: string;
  engineerName: string;
  gasSafeRegistration: string;
  inspectionType: InspectionType;
  applianceLocation: string;
  result: ResultValue;
  defectsFound: number;
  remedialCompleted: boolean;
  certificateIssued: boolean;
  certificateNumber?: string | null;
  carbonMonoxideAlarmTested: boolean;
  nextInspectionDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeGasSafetyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_gas_safety") as SB)
    .insert({
      home_id: input.homeId,
      inspection_date: input.inspectionDate,
      engineer_name: input.engineerName,
      gas_safe_registration: input.gasSafeRegistration,
      inspection_type: input.inspectionType,
      appliance_location: input.applianceLocation,
      result: input.result,
      defects_found: input.defectsFound,
      remedial_completed: input.remedialCompleted,
      certificate_issued: input.certificateIssued,
      certificate_number: input.certificateNumber ?? null,
      carbon_monoxide_alarm_tested: input.carbonMonoxideAlarmTested,
      next_inspection_date: input.nextInspectionDate ?? null,
      compliance_status: input.complianceStatus,
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
): Promise<ServiceResult<HomeGasSafetyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_gas_safety") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { error } = await (sb.from("cs_home_gas_safety") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeGasSafetyMetrics,
  identifyGasSafetyAlerts,
  generateGasSafetyAriaInsights,
};
