// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LIFT EQUIPMENT SAFETY SERVICE
// Tracks LOLER inspections, lift testing, stairlift maintenance,
// and compliance with Lifting Operations and Lifting Equipment Regulations 1998.
//
// Covers: Passenger lifts, stairlifts, platform lifts, hoists,
// bath hoists, ceiling track hoists, LOLER thorough examinations,
// 6-monthly services, annual services, maintenance calls,
// emergency repairs, defect tracking, remedial works,
// safe working load confirmation, and certificate management.
//
// SCCIF: Safety — "The premises are safe and well maintained."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const EQUIPMENT_TYPES = [
  "Passenger Lift",
  "Stairlift",
  "Platform Lift",
  "Hoist",
  "Bath Hoist",
  "Ceiling Track Hoist",
] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const INSPECTION_TYPES = [
  "LOLER Thorough Examination",
  "6-Monthly Service",
  "Annual Service",
  "Maintenance Call",
  "Emergency Repair",
] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

export const RESULT_VALUES = [
  "Satisfactory",
  "Minor Defects",
  "Major Defects",
  "Prohibited Use",
  "Not Tested",
] as const;
export type ResultValue = (typeof RESULT_VALUES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Conditional",
  "Prohibited",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeLiftEquipmentSafetyRow {
  id: string;
  home_id: string;
  inspection_date: string;
  inspector_name: string;
  equipment_type: EquipmentType;
  equipment_location: string;
  inspection_type: InspectionType;
  result: ResultValue;
  defects_found: number;
  remedial_completed: boolean;
  certificate_issued: boolean;
  safe_working_load_confirmed: boolean;
  next_inspection_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const EQUIPMENT_TYPE_LABELS: { type: EquipmentType; label: string }[] = [
  { type: "Passenger Lift", label: "Passenger Lift" },
  { type: "Stairlift", label: "Stairlift" },
  { type: "Platform Lift", label: "Platform Lift" },
  { type: "Hoist", label: "Hoist" },
  { type: "Bath Hoist", label: "Bath Hoist" },
  { type: "Ceiling Track Hoist", label: "Ceiling Track Hoist" },
];

export const INSPECTION_TYPE_LABELS: { type: InspectionType; label: string }[] = [
  { type: "LOLER Thorough Examination", label: "LOLER Thorough Examination" },
  { type: "6-Monthly Service", label: "6-Monthly Service" },
  { type: "Annual Service", label: "Annual Service" },
  { type: "Maintenance Call", label: "Maintenance Call" },
  { type: "Emergency Repair", label: "Emergency Repair" },
];

export const RESULT_LABELS: { value: ResultValue; label: string }[] = [
  { value: "Satisfactory", label: "Satisfactory" },
  { value: "Minor Defects", label: "Minor Defects" },
  { value: "Major Defects", label: "Major Defects" },
  { value: "Prohibited Use", label: "Prohibited Use" },
  { value: "Not Tested", label: "Not Tested" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Compliant", label: "Compliant" },
  { status: "Non-Compliant", label: "Non-Compliant" },
  { status: "Conditional", label: "Conditional" },
  { status: "Prohibited", label: "Prohibited" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeLiftEquipmentSafetyMetrics(
  rows: HomeLiftEquipmentSafetyRow[],
): {
  total_inspections: number;
  prohibited_count: number;
  major_defects_count: number;
  minor_defects_count: number;
  remedial_completion_rate: number;
  certificate_rate: number;
  swl_confirmed_rate: number;
  next_inspection_rate: number;
  non_compliant_count: number;
  defects_total: number;
  unique_inspectors: number;
  by_equipment_type: Record<string, number>;
  by_inspection_type: Record<string, number>;
  by_result: Record<string, number>;
  by_compliance_status: Record<string, number>;
} {
  const total = rows.length;

  const prohibited = rows.filter((r) => r.result === "Prohibited Use").length;
  const majorDefects = rows.filter((r) => r.result === "Major Defects").length;
  const minorDefects = rows.filter((r) => r.result === "Minor Defects").length;

  const remedialApplicable = rows.filter((r) => r.defects_found > 0);
  const remedialCompleted = remedialApplicable.filter((r) => r.remedial_completed).length;
  const remedialRate =
    remedialApplicable.length > 0
      ? Math.round((remedialCompleted / remedialApplicable.length) * 1000) / 10
      : 0;

  const certificateIssued = rows.filter((r) => r.certificate_issued).length;
  const certificateRate =
    total > 0
      ? Math.round((certificateIssued / total) * 1000) / 10
      : 0;

  const swlConfirmed = rows.filter((r) => r.safe_working_load_confirmed).length;
  const swlRate =
    total > 0
      ? Math.round((swlConfirmed / total) * 1000) / 10
      : 0;

  const scheduled = rows.filter((r) => r.next_inspection_date !== null).length;
  const scheduledRate =
    total > 0
      ? Math.round((scheduled / total) * 1000) / 10
      : 0;

  const nonCompliant = rows.filter(
    (r) =>
      r.compliance_status === "Non-Compliant" ||
      r.compliance_status === "Prohibited",
  ).length;

  const defectsTotal = rows.reduce((sum, r) => sum + r.defects_found, 0);

  const uniqueInspectors = new Set(rows.map((r) => r.inspector_name)).size;

  const byEquipment: Record<string, number> = {};
  for (const r of rows) byEquipment[r.equipment_type] = (byEquipment[r.equipment_type] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of rows) byType[r.inspection_type] = (byType[r.inspection_type] ?? 0) + 1;

  const byResult: Record<string, number> = {};
  for (const r of rows) byResult[r.result] = (byResult[r.result] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of rows) byCompliance[r.compliance_status] = (byCompliance[r.compliance_status] ?? 0) + 1;

  return {
    total_inspections: total,
    prohibited_count: prohibited,
    major_defects_count: majorDefects,
    minor_defects_count: minorDefects,
    remedial_completion_rate: remedialRate,
    certificate_rate: certificateRate,
    swl_confirmed_rate: swlRate,
    next_inspection_rate: scheduledRate,
    non_compliant_count: nonCompliant,
    defects_total: defectsTotal,
    unique_inspectors: uniqueInspectors,
    by_equipment_type: byEquipment,
    by_inspection_type: byType,
    by_result: byResult,
    by_compliance_status: byCompliance,
  };
}

export function identifyLiftEquipmentSafetyAlerts(
  rows: HomeLiftEquipmentSafetyRow[],
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

  // Critical: any "Prohibited Use" — equipment must not be used
  for (const r of rows) {
    if (r.result === "Prohibited Use") {
      alerts.push({
        type: "prohibited_use",
        severity: "critical",
        message: `Prohibited Use result recorded for ${r.equipment_type} at ${r.equipment_location} on ${r.inspection_date} — equipment must not be used until remedial work is completed under LOLER 1998`,
        record_id: r.id,
      });
    }
  }

  // Critical: any "Major Defects" without remedial_completed
  for (const r of rows) {
    if (r.result === "Major Defects" && !r.remedial_completed) {
      alerts.push({
        type: "major_defects_unremediated",
        severity: "critical",
        message: `Major Defects found on ${r.equipment_type} at ${r.equipment_location} on ${r.inspection_date} with remedial work outstanding — equipment may pose a risk to users`,
        record_id: r.id,
      });
    }
  }

  // High: any "Non-Compliant" or "Prohibited" compliance status
  for (const r of rows) {
    if (r.compliance_status === "Non-Compliant") {
      alerts.push({
        type: "non_compliant",
        severity: "high",
        message: `Non-Compliant status for ${r.equipment_type} at ${r.equipment_location} on ${r.inspection_date} — action required to meet Lifting Operations and Lifting Equipment Regulations 1998`,
        record_id: r.id,
      });
    }
    if (r.compliance_status === "Prohibited") {
      alerts.push({
        type: "prohibited_compliance",
        severity: "high",
        message: `Prohibited compliance status for ${r.equipment_type} at ${r.equipment_location} on ${r.inspection_date} — equipment use is prohibited until compliance is restored`,
        record_id: r.id,
      });
    }
  }

  // Medium: any !safe_working_load_confirmed
  for (const r of rows) {
    if (!r.safe_working_load_confirmed) {
      alerts.push({
        type: "swl_not_confirmed",
        severity: "medium",
        message: `Safe working load not confirmed for ${r.equipment_type} at ${r.equipment_location} on ${r.inspection_date} — SWL verification required for occupant safety`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateLiftEquipmentSafetyCaraInsights(
  rows: HomeLiftEquipmentSafetyRow[],
): string[] {
  const metrics = computeLiftEquipmentSafetyMetrics(rows);
  const alerts = identifyLiftEquipmentSafetyAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[red] ${metrics.total_inspections} lift equipment safety inspections recorded across ${metrics.unique_inspectors} ${metrics.unique_inspectors === 1 ? "inspector" : "inspectors"}. ` +
      `${metrics.prohibited_count} Prohibited Use, ${metrics.major_defects_count} Major Defects, ${metrics.minor_defects_count} Minor Defects, and ${metrics.defects_total} total defects identified.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority lift equipment safety alerts identified. ` +
        `Remedial completion rate is ${metrics.remedial_completion_rate}% for inspections with defects. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "inspection has" : "inspections have"} Non-Compliant or Prohibited status requiring urgent attention.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority lift equipment safety alerts currently active. ` +
        `Certificate issuance rate is ${metrics.certificate_rate}% and SWL confirmation rate is ${metrics.swl_confirmed_rate}%. ` +
        `Continue regular inspections to maintain LOLER 1998 compliance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.prohibited_count > 0 || metrics.major_defects_count > 0) {
    insights.push(
      `[reflect] ${metrics.prohibited_count} Prohibited Use and ${metrics.major_defects_count} Major Defects results have been recorded across all inspections. ` +
        `What steps are being taken to ensure all prohibited equipment is taken out of service and major defects are remediated promptly, ` +
        `and is there a clear process for verifying completed remedial work?`,
    );
  } else if (metrics.defects_total > 0 && metrics.remedial_completion_rate < 100) {
    insights.push(
      `[reflect] Remedial completion stands at ${metrics.remedial_completion_rate}% for inspections with defects. ` +
        `How can the home improve its tracking and completion of lift equipment remedial works, ` +
        `and are competent persons being engaged for timely follow-up?`,
    );
  } else {
    insights.push(
      `[reflect] All lift equipment inspections show no Prohibited Use or Major Defects results and remedial work is complete where required. ` +
        `How can the home continue to maintain this high standard of lift equipment safety, ` +
        `and are staff aware of how to report lift equipment concerns between formal inspections?`,
    );
  }

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    equipmentType?: EquipmentType;
    inspectionType?: InspectionType;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<HomeLiftEquipmentSafetyRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  let q = (sb.from("cs_home_lift_equipment_safety") as SB).select("*").eq("home_id", homeId);
  if (filters?.equipmentType) q = q.eq("equipment_type", filters.equipmentType);
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
  inspectorName: string;
  equipmentType: EquipmentType;
  equipmentLocation: string;
  inspectionType: InspectionType;
  result: ResultValue;
  defectsFound: number;
  remedialCompleted: boolean;
  certificateIssued: boolean;
  safeWorkingLoadConfirmed: boolean;
  nextInspectionDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeLiftEquipmentSafetyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_lift_equipment_safety") as SB)
    .insert({
      home_id: input.homeId,
      inspection_date: input.inspectionDate,
      inspector_name: input.inspectorName,
      equipment_type: input.equipmentType,
      equipment_location: input.equipmentLocation,
      inspection_type: input.inspectionType,
      result: input.result,
      defects_found: input.defectsFound,
      remedial_completed: input.remedialCompleted,
      certificate_issued: input.certificateIssued,
      safe_working_load_confirmed: input.safeWorkingLoadConfirmed,
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
): Promise<ServiceResult<HomeLiftEquipmentSafetyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_lift_equipment_safety") as SB)
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

  const { error } = await (sb.from("cs_home_lift_equipment_safety") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeLiftEquipmentSafetyMetrics,
  identifyLiftEquipmentSafetyAlerts,
  generateLiftEquipmentSafetyCaraInsights,
};
