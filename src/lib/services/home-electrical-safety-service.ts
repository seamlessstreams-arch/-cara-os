// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ELECTRICAL SAFETY SERVICE
// Tracks EICR inspections, PAT testing, emergency lighting checks,
// fire alarm testing, lightning protection, and visual inspections.
// BS 7671 Wiring Regulations compliance,
// CHR 2015 Reg 25 (premises safety — electrical installations),
// Electricity at Work Regulations 1989.
//
// Covers: EICR inspections, PAT testing, emergency lighting,
// fire alarm electrical systems, lightning protection, visual inspections,
// defect classification (C1/C2/C3/FI), remedial tracking, and compliance.
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
  "EICR",
  "PAT Testing",
  "Emergency Lighting",
  "Fire Alarm",
  "Lightning Protection",
  "Visual Inspection",
] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

export const RESULT_VALUES = [
  "Satisfactory",
  "Unsatisfactory",
  "Further Investigation",
  "Not Tested",
] as const;
export type ResultValue = (typeof RESULT_VALUES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Minor Non-Compliance",
  "Major Non-Compliance",
  "Critical Non-Compliance",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeElectricalSafetyRow {
  id: string;
  home_id: string;
  inspection_date: string;
  inspector_name: string;
  inspection_type: InspectionType;
  result: ResultValue;
  certificate_number: string | null;
  defects_found: number;
  c1_defects: number;
  c2_defects: number;
  c3_defects: number;
  fi_defects: number;
  remedial_completed: boolean;
  next_inspection_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const INSPECTION_TYPE_LABELS: { type: InspectionType; label: string }[] = [
  { type: "EICR", label: "EICR" },
  { type: "PAT Testing", label: "PAT Testing" },
  { type: "Emergency Lighting", label: "Emergency Lighting" },
  { type: "Fire Alarm", label: "Fire Alarm" },
  { type: "Lightning Protection", label: "Lightning Protection" },
  { type: "Visual Inspection", label: "Visual Inspection" },
];

export const RESULT_LABELS: { value: ResultValue; label: string }[] = [
  { value: "Satisfactory", label: "Satisfactory" },
  { value: "Unsatisfactory", label: "Unsatisfactory" },
  { value: "Further Investigation", label: "Further Investigation" },
  { value: "Not Tested", label: "Not Tested" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Compliant", label: "Compliant" },
  { status: "Minor Non-Compliance", label: "Minor Non-Compliance" },
  { status: "Major Non-Compliance", label: "Major Non-Compliance" },
  { status: "Critical Non-Compliance", label: "Critical Non-Compliance" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeElectricalSafetyMetrics(
  rows: HomeElectricalSafetyRow[],
): {
  total_inspections: number;
  unsatisfactory_count: number;
  c1_total: number;
  c2_total: number;
  c3_total: number;
  fi_total: number;
  remedial_completion_rate: number;
  satisfactory_rate: number;
  next_inspection_scheduled_rate: number;
  non_compliant_count: number;
  unique_inspectors: number;
  by_inspection_type: Record<string, number>;
  by_result: Record<string, number>;
  by_compliance_status: Record<string, number>;
} {
  const total = rows.length;

  const unsatisfactory = rows.filter((r) => r.result === "Unsatisfactory").length;

  const c1Total = rows.reduce((sum, r) => sum + r.c1_defects, 0);
  const c2Total = rows.reduce((sum, r) => sum + r.c2_defects, 0);
  const c3Total = rows.reduce((sum, r) => sum + r.c3_defects, 0);
  const fiTotal = rows.reduce((sum, r) => sum + r.fi_defects, 0);

  const remedialApplicable = rows.filter(
    (r) => r.defects_found > 0,
  );
  const remedialCompleted = remedialApplicable.filter((r) => r.remedial_completed).length;
  const remedialRate =
    remedialApplicable.length > 0
      ? Math.round((remedialCompleted / remedialApplicable.length) * 1000) / 10
      : 0;

  const satisfactory = rows.filter((r) => r.result === "Satisfactory").length;
  const satisfactoryRate =
    total > 0
      ? Math.round((satisfactory / total) * 1000) / 10
      : 0;

  const scheduled = rows.filter((r) => r.next_inspection_date !== null).length;
  const scheduledRate =
    total > 0
      ? Math.round((scheduled / total) * 1000) / 10
      : 0;

  const nonCompliant = rows.filter(
    (r) =>
      r.compliance_status === "Major Non-Compliance" ||
      r.compliance_status === "Critical Non-Compliance",
  ).length;

  const uniqueInspectors = new Set(rows.map((r) => r.inspector_name)).size;

  const byType: Record<string, number> = {};
  for (const r of rows) byType[r.inspection_type] = (byType[r.inspection_type] ?? 0) + 1;

  const byResult: Record<string, number> = {};
  for (const r of rows) byResult[r.result] = (byResult[r.result] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of rows) byCompliance[r.compliance_status] = (byCompliance[r.compliance_status] ?? 0) + 1;

  return {
    total_inspections: total,
    unsatisfactory_count: unsatisfactory,
    c1_total: c1Total,
    c2_total: c2Total,
    c3_total: c3Total,
    fi_total: fiTotal,
    remedial_completion_rate: remedialRate,
    satisfactory_rate: satisfactoryRate,
    next_inspection_scheduled_rate: scheduledRate,
    non_compliant_count: nonCompliant,
    unique_inspectors: uniqueInspectors,
    by_inspection_type: byType,
    by_result: byResult,
    by_compliance_status: byCompliance,
  };
}

export function identifyElectricalSafetyAlerts(
  rows: HomeElectricalSafetyRow[],
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

  // Critical: any C1 defects (danger present — immediate risk of injury)
  for (const r of rows) {
    if (r.c1_defects > 0) {
      alerts.push({
        type: "c1_danger_present",
        severity: "critical",
        message: `${r.c1_defects} C1 (danger present) ${r.c1_defects === 1 ? "defect" : "defects"} found during ${r.inspection_type} on ${r.inspection_date} — immediate disconnection or remedial action required under BS 7671`,
        record_id: r.id,
      });
    }
  }

  // Critical: Unsatisfactory result without remedial completed
  for (const r of rows) {
    if (r.result === "Unsatisfactory" && !r.remedial_completed) {
      alerts.push({
        type: "unsatisfactory_unremediated",
        severity: "critical",
        message: `Unsatisfactory ${r.inspection_type} result on ${r.inspection_date} with remedial work outstanding — installation may pose a risk to occupants`,
        record_id: r.id,
      });
    }
  }

  // High: C2 defects without remedial completed
  for (const r of rows) {
    if (r.c2_defects > 0 && !r.remedial_completed) {
      alerts.push({
        type: "c2_potentially_dangerous",
        severity: "high",
        message: `${r.c2_defects} C2 (potentially dangerous) ${r.c2_defects === 1 ? "defect" : "defects"} found during ${r.inspection_type} on ${r.inspection_date} with remedial work incomplete — urgent attention required`,
        record_id: r.id,
      });
    }
  }

  // High: Critical or Major Non-Compliance
  for (const r of rows) {
    if (r.compliance_status === "Critical Non-Compliance") {
      alerts.push({
        type: "critical_non_compliance",
        severity: "high",
        message: `Critical non-compliance identified in ${r.inspection_type} on ${r.inspection_date} — immediate action required to meet BS 7671 Wiring Regulations`,
        record_id: r.id,
      });
    }
    if (r.compliance_status === "Major Non-Compliance") {
      alerts.push({
        type: "major_non_compliance",
        severity: "high",
        message: `Major non-compliance identified in ${r.inspection_type} on ${r.inspection_date} — remedial action required to meet regulatory standards`,
        record_id: r.id,
      });
    }
  }

  // Medium: next_inspection_date overdue
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  for (const r of rows) {
    if (r.next_inspection_date !== null && r.next_inspection_date < today) {
      alerts.push({
        type: "inspection_overdue",
        severity: "medium",
        message: `${r.inspection_type} inspection overdue since ${r.next_inspection_date} — schedule inspection to maintain compliance`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateElectricalSafetyCaraInsights(
  rows: HomeElectricalSafetyRow[],
): string[] {
  const metrics = computeElectricalSafetyMetrics(rows);
  const alerts = identifyElectricalSafetyAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[red] ${metrics.total_inspections} electrical safety inspections recorded across ${metrics.unique_inspectors} ${metrics.unique_inspectors === 1 ? "inspector" : "inspectors"}. ` +
      `Satisfactory rate is ${metrics.satisfactory_rate}%, with ${metrics.c1_total} C1, ${metrics.c2_total} C2, ${metrics.c3_total} C3, and ${metrics.fi_total} FI defects identified in total.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority electrical safety alerts identified. ` +
        `Remedial completion rate is ${metrics.remedial_completion_rate}% for inspections with defects. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "inspection has" : "inspections have"} major or critical non-compliance requiring urgent attention.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority electrical safety alerts currently active. ` +
        `Remedial completion rate is ${metrics.remedial_completion_rate}% and ${metrics.next_inspection_scheduled_rate}% of inspections have a next inspection date scheduled. ` +
        `Continue regular inspections to maintain BS 7671 compliance.`,
    );
  }

  // Insight 3: Reflective question
  const hasDefectiveRecords = rows.some((r) => r.defects_found > 0);
  if (metrics.c1_total > 0 || metrics.c2_total > 0) {
    insights.push(
      `[reflect] ${metrics.c1_total} C1 and ${metrics.c2_total} C2 defects have been identified across all inspections. ` +
        `What steps are being taken to ensure all dangerous and potentially dangerous defects are remediated promptly, ` +
        `and is there a clear process for verifying completed remedial work?`,
    );
  } else if (hasDefectiveRecords && metrics.remedial_completion_rate < 100) {
    insights.push(
      `[reflect] Remedial completion stands at ${metrics.remedial_completion_rate}% for inspections with defects. ` +
        `How can the home improve its tracking and completion of remedial works, ` +
        `and are contractors being held accountable for timely completion?`,
    );
  } else {
    insights.push(
      `[reflect] All electrical inspections show no C1 or C2 defects and remedial work is complete where required. ` +
        `How can the home continue to maintain this high standard of electrical safety, ` +
        `and are staff aware of how to report electrical concerns between formal inspections?`,
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
): Promise<ServiceResult<HomeElectricalSafetyRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  let q = (sb.from("cs_home_electrical_safety") as SB).select("*").eq("home_id", homeId);
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
  inspectionType: InspectionType;
  result: ResultValue;
  certificateNumber?: string | null;
  defectsFound: number;
  c1Defects: number;
  c2Defects: number;
  c3Defects: number;
  fiDefects: number;
  remedialCompleted: boolean;
  nextInspectionDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeElectricalSafetyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_electrical_safety") as SB)
    .insert({
      home_id: input.homeId,
      inspection_date: input.inspectionDate,
      inspector_name: input.inspectorName,
      inspection_type: input.inspectionType,
      result: input.result,
      certificate_number: input.certificateNumber ?? null,
      defects_found: input.defectsFound,
      c1_defects: input.c1Defects,
      c2_defects: input.c2Defects,
      c3_defects: input.c3Defects,
      fi_defects: input.fiDefects,
      remedial_completed: input.remedialCompleted,
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
): Promise<ServiceResult<HomeElectricalSafetyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_electrical_safety") as SB)
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

  const { error } = await (sb.from("cs_home_electrical_safety") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeElectricalSafetyMetrics,
  identifyElectricalSafetyAlerts,
  generateElectricalSafetyCaraInsights,
};
