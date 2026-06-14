// ==============================================================================
// CARA -- HOME PEST CONTROL MANAGEMENT SERVICE
// Tracks pest inspections, treatments, proofing checks, hygiene assessments,
// and re-inspection scheduling for children's residential homes.
//
// Covers: Pest type identification, severity assessment, treatment methods,
// treatment completion tracking, proofing adequacy, hygiene and food storage
// checks, waste management compliance, and re-inspection scheduling.
//
// SCCIF: Safety -- "The premises are safe and well maintained."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const PEST_TYPES = [
  "Rodents",
  "Cockroaches",
  "Bed Bugs",
  "Ants",
  "Flies",
  "Wasps",
  "Moths",
  "Birds",
  "Fleas",
  "Stored Product Insects",
  "Other",
] as const;
export type PestType = (typeof PEST_TYPES)[number];

export const SEVERITY_LEVELS = [
  "None Found",
  "Low",
  "Moderate",
  "High",
  "Infestation",
] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const TREATMENT_METHODS = [
  "Baiting",
  "Trapping",
  "Spray Treatment",
  "Fumigation",
  "Heat Treatment",
  "Proofing",
  "Environmental Control",
  "Monitoring Only",
] as const;
export type TreatmentMethod = (typeof TREATMENT_METHODS)[number];

export const COMPLIANCE_STATUSES = [
  "Clear",
  "Active Issue",
  "Under Treatment",
  "Resolved",
  "Re-Inspection Due",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// -- Row type -----------------------------------------------------------------

export interface HomePestControlManagementRow {
  id: string;
  home_id: string;
  inspection_date: string;
  inspector_name: string;
  pest_type: PestType;
  location: string;
  severity: SeverityLevel;
  treatment_required: boolean;
  treatment_method: TreatmentMethod | null;
  treatment_date: string | null;
  treatment_completed: boolean;
  proofing_adequate: boolean;
  hygiene_satisfactory: boolean;
  food_storage_adequate: boolean;
  waste_management_ok: boolean;
  re_inspection_required: boolean;
  re_inspection_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Constants ----------------------------------------------------------------

export const PEST_TYPE_LABELS: { type: PestType; label: string }[] = [
  { type: "Rodents", label: "Rodents" },
  { type: "Cockroaches", label: "Cockroaches" },
  { type: "Bed Bugs", label: "Bed Bugs" },
  { type: "Ants", label: "Ants" },
  { type: "Flies", label: "Flies" },
  { type: "Wasps", label: "Wasps" },
  { type: "Moths", label: "Moths" },
  { type: "Birds", label: "Birds" },
  { type: "Fleas", label: "Fleas" },
  { type: "Stored Product Insects", label: "Stored Product Insects" },
  { type: "Other", label: "Other" },
];

export const SEVERITY_LEVEL_LABELS: { value: SeverityLevel; label: string }[] = [
  { value: "None Found", label: "None Found" },
  { value: "Low", label: "Low" },
  { value: "Moderate", label: "Moderate" },
  { value: "High", label: "High" },
  { value: "Infestation", label: "Infestation" },
];

export const TREATMENT_METHOD_LABELS: { value: TreatmentMethod; label: string }[] = [
  { value: "Baiting", label: "Baiting" },
  { value: "Trapping", label: "Trapping" },
  { value: "Spray Treatment", label: "Spray Treatment" },
  { value: "Fumigation", label: "Fumigation" },
  { value: "Heat Treatment", label: "Heat Treatment" },
  { value: "Proofing", label: "Proofing" },
  { value: "Environmental Control", label: "Environmental Control" },
  { value: "Monitoring Only", label: "Monitoring Only" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Clear", label: "Clear" },
  { status: "Active Issue", label: "Active Issue" },
  { status: "Under Treatment", label: "Under Treatment" },
  { status: "Resolved", label: "Resolved" },
  { status: "Re-Inspection Due", label: "Re-Inspection Due" },
];

// -- Pure functions (no DB) ---------------------------------------------------

export function computePestControlManagementMetrics(
  rows: HomePestControlManagementRow[],
): {
  total_inspections: number;
  active_issue_count: number;
  infestation_count: number;
  treatment_required_count: number;
  treatment_completion_rate: number;
  proofing_rate: number;
  hygiene_rate: number;
  food_storage_rate: number;
  waste_management_rate: number;
  re_inspection_due_count: number;
  unique_locations: number;
  unique_inspectors: number;
} {
  const total = rows.length;

  const activeIssues = rows.filter(
    (r) => r.compliance_status === "Active Issue",
  ).length;

  const infestations = rows.filter(
    (r) => r.severity === "Infestation",
  ).length;

  const treatmentRequired = rows.filter((r) => r.treatment_required).length;

  const treatmentRequiredRows = rows.filter((r) => r.treatment_required);
  const treatmentCompleted = treatmentRequiredRows.filter(
    (r) => r.treatment_completed,
  ).length;
  const treatmentCompletionRate =
    treatmentRequiredRows.length > 0
      ? Math.round((treatmentCompleted / treatmentRequiredRows.length) * 1000) / 10
      : 0;

  const proofingAdequate = rows.filter((r) => r.proofing_adequate).length;
  const proofingRate =
    total > 0
      ? Math.round((proofingAdequate / total) * 1000) / 10
      : 0;

  const hygieneSatisfactory = rows.filter((r) => r.hygiene_satisfactory).length;
  const hygieneRate =
    total > 0
      ? Math.round((hygieneSatisfactory / total) * 1000) / 10
      : 0;

  const foodStorageAdequate = rows.filter((r) => r.food_storage_adequate).length;
  const foodStorageRate =
    total > 0
      ? Math.round((foodStorageAdequate / total) * 1000) / 10
      : 0;

  const wasteManagementOk = rows.filter((r) => r.waste_management_ok).length;
  const wasteManagementRate =
    total > 0
      ? Math.round((wasteManagementOk / total) * 1000) / 10
      : 0;

  const reInspectionDue = rows.filter(
    (r) => r.re_inspection_required,
  ).length;

  const uniqueLocations = new Set(rows.map((r) => r.location)).size;
  const uniqueInspectors = new Set(rows.map((r) => r.inspector_name)).size;

  return {
    total_inspections: total,
    active_issue_count: activeIssues,
    infestation_count: infestations,
    treatment_required_count: treatmentRequired,
    treatment_completion_rate: treatmentCompletionRate,
    proofing_rate: proofingRate,
    hygiene_rate: hygieneRate,
    food_storage_rate: foodStorageRate,
    waste_management_rate: wasteManagementRate,
    re_inspection_due_count: reInspectionDue,
    unique_locations: uniqueLocations,
    unique_inspectors: uniqueInspectors,
  };
}

export function identifyPestControlManagementAlerts(
  rows: HomePestControlManagementRow[],
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

  // Critical: infestation found
  for (const r of rows) {
    if (r.severity === "Infestation") {
      alerts.push({
        type: "infestation_found",
        severity: "critical",
        message: `Infestation of ${r.pest_type} found at ${r.location} on ${r.inspection_date} — immediate pest control intervention required to protect occupant health and safety`,
        record_id: r.id,
      });
    }
  }

  // Critical: food storage inadequate with active pests
  for (const r of rows) {
    if (
      !r.food_storage_adequate &&
      r.compliance_status === "Active Issue"
    ) {
      alerts.push({
        type: "food_storage_active_pest",
        severity: "critical",
        message: `Food storage inadequate with active pest issue at ${r.location} on ${r.inspection_date} — risk of contamination requires urgent remediation to protect children's health`,
        record_id: r.id,
      });
    }
  }

  // High: hygiene unsatisfactory
  for (const r of rows) {
    if (!r.hygiene_satisfactory) {
      alerts.push({
        type: "hygiene_unsatisfactory",
        severity: "high",
        message: `Hygiene unsatisfactory at ${r.location} on ${r.inspection_date} — poor hygiene conditions can attract and sustain pest populations`,
        record_id: r.id,
      });
    }
  }

  // High: active issue without treatment
  for (const r of rows) {
    if (
      r.compliance_status === "Active Issue" &&
      !r.treatment_required
    ) {
      alerts.push({
        type: "active_issue_no_treatment",
        severity: "high",
        message: `Active pest issue at ${r.location} on ${r.inspection_date} without treatment scheduled — treatment should be arranged to resolve the issue`,
        record_id: r.id,
      });
    }
  }

  // Medium: re-inspection overdue
  for (const r of rows) {
    if (
      r.re_inspection_required &&
      r.re_inspection_date !== null &&
      r.re_inspection_date < new Date().toISOString().slice(0, 10)
    ) {
      alerts.push({
        type: "re_inspection_overdue",
        severity: "medium",
        message: `Re-inspection overdue at ${r.location} — was due on ${r.re_inspection_date} and has not been completed`,
        record_id: r.id,
      });
    }
  }

  // Medium: proofing inadequate
  for (const r of rows) {
    if (!r.proofing_adequate) {
      alerts.push({
        type: "proofing_inadequate",
        severity: "medium",
        message: `Proofing inadequate at ${r.location} on ${r.inspection_date} — gaps in proofing allow pest entry and should be addressed`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generatePestControlManagementCaraInsights(
  rows: HomePestControlManagementRow[],
): string[] {
  const metrics = computePestControlManagementMetrics(rows);
  const alerts = identifyPestControlManagementAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[lime] ${metrics.total_inspections} pest control ${metrics.total_inspections === 1 ? "inspection" : "inspections"} recorded across ${metrics.unique_locations} ${metrics.unique_locations === 1 ? "location" : "locations"} by ${metrics.unique_inspectors} ${metrics.unique_inspectors === 1 ? "inspector" : "inspectors"}. ` +
      `Proofing adequacy rate is ${metrics.proofing_rate}%, hygiene satisfactory rate is ${metrics.hygiene_rate}%, ` +
      `and food storage adequacy rate is ${metrics.food_storage_rate}%.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority pest control alerts identified. ` +
        `${metrics.infestation_count} ${metrics.infestation_count === 1 ? "infestation has" : "infestations have"} been found. ` +
        `${metrics.active_issue_count} ${metrics.active_issue_count === 1 ? "active issue remains" : "active issues remain"} and ${metrics.re_inspection_due_count} ${metrics.re_inspection_due_count === 1 ? "re-inspection is" : "re-inspections are"} due.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority pest control alerts currently active. ` +
        `Treatment completion rate is ${metrics.treatment_completion_rate}% and waste management compliance is ${metrics.waste_management_rate}%. ` +
        `Continue regular inspections to maintain pest-free premises.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.infestation_count > 0) {
    insights.push(
      `[reflect] ${metrics.infestation_count} ${metrics.infestation_count === 1 ? "infestation has" : "infestations have"} been recorded across pest control inspections. ` +
        `What immediate remedial actions have been taken following infestation findings, ` +
        `and is the pest control contract and schedule adequate for the home's needs?`,
    );
  } else if (metrics.active_issue_count > 0 || metrics.re_inspection_due_count > 0) {
    insights.push(
      `[reflect] ${metrics.active_issue_count} active ${metrics.active_issue_count === 1 ? "issue" : "issues"} and ${metrics.re_inspection_due_count} ${metrics.re_inspection_due_count === 1 ? "re-inspection is" : "re-inspections are"} due. ` +
        `How can the home improve its pest prevention measures, ` +
        `and are proofing and hygiene standards being consistently maintained across all areas?`,
    );
  } else {
    insights.push(
      `[reflect] All pest control inspections show no infestations and no active issues. ` +
        `How can the home continue to maintain this high standard of pest prevention, ` +
        `and are staff aware of how to report pest sightings or concerns between formal inspections?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listHomePestControlManagement(
  homeId: string,
  filters?: {
    pestType?: PestType;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<HomePestControlManagementRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  let q = (sb.from("cs_home_pest_control_management") as SB).select("*").eq("home_id", homeId);
  if (filters?.pestType) q = q.eq("pest_type", filters.pestType);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  q = q.order("inspection_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomePestControlManagement(input: {
  homeId: string;
  inspectionDate: string;
  inspectorName: string;
  pestType: PestType;
  location: string;
  severity: SeverityLevel;
  treatmentRequired: boolean;
  treatmentMethod?: TreatmentMethod | null;
  treatmentDate?: string | null;
  treatmentCompleted: boolean;
  proofingAdequate: boolean;
  hygieneSatisfactory: boolean;
  foodStorageAdequate: boolean;
  wasteManagementOk: boolean;
  reInspectionRequired: boolean;
  reInspectionDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomePestControlManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_pest_control_management") as SB)
    .insert({
      home_id: input.homeId,
      inspection_date: input.inspectionDate,
      inspector_name: input.inspectorName,
      pest_type: input.pestType,
      location: input.location,
      severity: input.severity,
      treatment_required: input.treatmentRequired,
      treatment_method: input.treatmentMethod ?? null,
      treatment_date: input.treatmentDate ?? null,
      treatment_completed: input.treatmentCompleted,
      proofing_adequate: input.proofingAdequate,
      hygiene_satisfactory: input.hygieneSatisfactory,
      food_storage_adequate: input.foodStorageAdequate,
      waste_management_ok: input.wasteManagementOk,
      re_inspection_required: input.reInspectionRequired,
      re_inspection_date: input.reInspectionDate ?? null,
      compliance_status: input.complianceStatus,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHomePestControlManagement(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HomePestControlManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_pest_control_management") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteHomePestControlManagement(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { error } = await (sb.from("cs_home_pest_control_management") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// -- Testing exports ----------------------------------------------------------

export const _testing = {
  computePestControlManagementMetrics,
  identifyPestControlManagementAlerts,
  generatePestControlManagementCaraInsights,
};
