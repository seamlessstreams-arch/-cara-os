// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ENVIRONMENT INSPECTION SERVICE
// Tracks regular inspections of home environment quality,
// safety, cleanliness, maintenance, and suitability.
// CHR 2015 Reg 25 (premises — safe and suitable),
// Reg 10 (accommodation — home-like environment).
//
// Covers: inspection area, condition rating, hazard level,
// compliance status, and maintenance tracking.
//
// SCCIF: Experiences — "The home environment is safe and well-maintained."
// "Living spaces are clean, comfortable, and homely."
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

export type InspectionArea =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "communal_area"
  | "garden"
  | "entrance"
  | "laundry"
  | "office"
  | "storage"
  | "other";

export type ConditionRating =
  | "excellent"
  | "good"
  | "satisfactory"
  | "poor"
  | "unacceptable";

export type HazardLevel =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "immediate";

export type ComplianceStatus =
  | "fully_compliant"
  | "minor_issues"
  | "significant_issues"
  | "non_compliant"
  | "not_assessed";

export interface HomeEnvironmentInspectionRecord {
  id: string;
  home_id: string;
  inspection_area: InspectionArea;
  condition_rating: ConditionRating;
  hazard_level: HazardLevel;
  compliance_status: ComplianceStatus;
  inspection_date: string;
  inspected_by: string;
  cleanliness_acceptable: boolean;
  fire_safety_checked: boolean;
  electrical_safety_checked: boolean;
  water_safety_checked: boolean;
  ventilation_adequate: boolean;
  lighting_adequate: boolean;
  maintenance_up_to_date: boolean;
  child_friendly: boolean;
  accessibility_adequate: boolean;
  security_adequate: boolean;
  pest_free: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const INSPECTION_AREAS: { area: InspectionArea; label: string }[] = [
  { area: "kitchen", label: "Kitchen" },
  { area: "bathroom", label: "Bathroom" },
  { area: "bedroom", label: "Bedroom" },
  { area: "communal_area", label: "Communal Area" },
  { area: "garden", label: "Garden" },
  { area: "entrance", label: "Entrance" },
  { area: "laundry", label: "Laundry" },
  { area: "office", label: "Office" },
  { area: "storage", label: "Storage" },
  { area: "other", label: "Other" },
];

export const CONDITION_RATINGS: { rating: ConditionRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "satisfactory", label: "Satisfactory" },
  { rating: "poor", label: "Poor" },
  { rating: "unacceptable", label: "Unacceptable" },
];

export const HAZARD_LEVELS: { level: HazardLevel; label: string }[] = [
  { level: "none", label: "None" },
  { level: "low", label: "Low" },
  { level: "medium", label: "Medium" },
  { level: "high", label: "High" },
  { level: "immediate", label: "Immediate" },
];

export const COMPLIANCE_STATUSES: { status: ComplianceStatus; label: string }[] = [
  { status: "fully_compliant", label: "Fully Compliant" },
  { status: "minor_issues", label: "Minor Issues" },
  { status: "significant_issues", label: "Significant Issues" },
  { status: "non_compliant", label: "Non-Compliant" },
  { status: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeHomeEnvironmentMetrics(
  records: HomeEnvironmentInspectionRecord[],
): {
  total_inspections: number;
  poor_condition_count: number;
  unacceptable_condition_count: number;
  high_hazard_count: number;
  immediate_hazard_count: number;
  cleanliness_rate: number | null;
  fire_safety_rate: number | null;
  electrical_safety_rate: number | null;
  water_safety_rate: number | null;
  ventilation_rate: number | null;
  lighting_rate: number | null;
  maintenance_rate: number | null;
  child_friendly_rate: number | null;
  accessibility_rate: number | null;
  security_rate: number | null;
  pest_free_rate: number | null;
  recorded_promptly_rate: number | null;
  by_inspection_area: Record<string, number>;
  by_condition_rating: Record<string, number>;
  by_hazard_level: Record<string, number>;
  by_compliance_status: Record<string, number>;
} {
  const poorCondition = records.filter((r) => r.condition_rating === "poor").length;
  const unacceptableCondition = records.filter((r) => r.condition_rating === "unacceptable").length;
  const highHazard = records.filter((r) => r.hazard_level === "high").length;
  const immediateHazard = records.filter((r) => r.hazard_level === "immediate").length;

  const boolRate = (field: keyof HomeEnvironmentInspectionRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.inspection_area] = (byArea[r.inspection_area] ?? 0) + 1;

  const byCondition: Record<string, number> = {};
  for (const r of records) byCondition[r.condition_rating] = (byCondition[r.condition_rating] ?? 0) + 1;

  const byHazard: Record<string, number> = {};
  for (const r of records) byHazard[r.hazard_level] = (byHazard[r.hazard_level] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_status] = (byCompliance[r.compliance_status] ?? 0) + 1;

  return {
    total_inspections: records.length,
    poor_condition_count: poorCondition,
    unacceptable_condition_count: unacceptableCondition,
    high_hazard_count: highHazard,
    immediate_hazard_count: immediateHazard,
    cleanliness_rate: boolRate("cleanliness_acceptable"),
    fire_safety_rate: boolRate("fire_safety_checked"),
    electrical_safety_rate: boolRate("electrical_safety_checked"),
    water_safety_rate: boolRate("water_safety_checked"),
    ventilation_rate: boolRate("ventilation_adequate"),
    lighting_rate: boolRate("lighting_adequate"),
    maintenance_rate: boolRate("maintenance_up_to_date"),
    child_friendly_rate: boolRate("child_friendly"),
    accessibility_rate: boolRate("accessibility_adequate"),
    security_rate: boolRate("security_adequate"),
    pest_free_rate: boolRate("pest_free"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    by_inspection_area: byArea,
    by_condition_rating: byCondition,
    by_hazard_level: byHazard,
    by_compliance_status: byCompliance,
  };
}

export function identifyHomeEnvironmentAlerts(
  records: HomeEnvironmentInspectionRecord[],
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

  // Immediate hazard
  for (const r of records) {
    if (r.hazard_level === "immediate") {
      alerts.push({
        type: "immediate_hazard",
        severity: "critical",
        message: `Immediate hazard identified in ${r.inspection_area.replace(/_/g, " ")} — take urgent action to ensure safety`,
        id: r.id,
      });
    }
  }

  // Fire safety not checked
  const noFire = records.filter((r) => !r.fire_safety_checked).length;
  if (noFire >= 1) {
    alerts.push({
      type: "fire_safety_not_checked",
      severity: "high",
      message: `${noFire} ${noFire === 1 ? "inspection has" : "inspections have"} fire safety not checked — ensure compliance`,
      id: "fire_safety_not_checked",
    });
  }

  // Maintenance not up to date
  const noMaintenance = records.filter((r) => !r.maintenance_up_to_date).length;
  if (noMaintenance >= 1) {
    alerts.push({
      type: "maintenance_overdue",
      severity: "high",
      message: `${noMaintenance} ${noMaintenance === 1 ? "inspection shows" : "inspections show"} maintenance not up to date — schedule repairs`,
      id: "maintenance_overdue",
    });
  }

  // Cleanliness not acceptable
  const noCleanliness = records.filter((r) => !r.cleanliness_acceptable).length;
  if (noCleanliness >= 2) {
    alerts.push({
      type: "cleanliness_issues",
      severity: "medium",
      message: `${noCleanliness} inspections with cleanliness not acceptable — review cleaning schedules`,
      id: "cleanliness_issues",
    });
  }

  // Security not adequate
  const noSecurity = records.filter((r) => !r.security_adequate).length;
  if (noSecurity >= 2) {
    alerts.push({
      type: "security_inadequate",
      severity: "medium",
      message: `${noSecurity} inspections with security not adequate — review security measures`,
      id: "security_inadequate",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    inspectionArea?: InspectionArea;
    conditionRating?: ConditionRating;
    hazardLevel?: HazardLevel;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<HomeEnvironmentInspectionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_home_environment_inspection") as SB).select("*").eq("home_id", homeId);
  if (filters?.inspectionArea) q = q.eq("inspection_area", filters.inspectionArea);
  if (filters?.conditionRating) q = q.eq("condition_rating", filters.conditionRating);
  if (filters?.hazardLevel) q = q.eq("hazard_level", filters.hazardLevel);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  q = q.order("inspection_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    inspectionArea: InspectionArea;
    conditionRating: ConditionRating;
    hazardLevel: HazardLevel;
    complianceStatus: ComplianceStatus;
    inspectionDate: string;
    inspectedBy: string;
    cleanlinessAcceptable?: boolean;
    fireSafetyChecked?: boolean;
    electricalSafetyChecked?: boolean;
    waterSafetyChecked?: boolean;
    ventilationAdequate?: boolean;
    lightingAdequate?: boolean;
    maintenanceUpToDate?: boolean;
    childFriendly?: boolean;
    accessibilityAdequate?: boolean;
    securityAdequate?: boolean;
    pestFree?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<HomeEnvironmentInspectionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_home_environment_inspection") as SB)
    .insert({
      home_id: payload.homeId,
      inspection_area: payload.inspectionArea,
      condition_rating: payload.conditionRating,
      hazard_level: payload.hazardLevel,
      compliance_status: payload.complianceStatus,
      inspection_date: payload.inspectionDate,
      inspected_by: payload.inspectedBy,
      cleanliness_acceptable: payload.cleanlinessAcceptable ?? true,
      fire_safety_checked: payload.fireSafetyChecked ?? true,
      electrical_safety_checked: payload.electricalSafetyChecked ?? true,
      water_safety_checked: payload.waterSafetyChecked ?? true,
      ventilation_adequate: payload.ventilationAdequate ?? true,
      lighting_adequate: payload.lightingAdequate ?? true,
      maintenance_up_to_date: payload.maintenanceUpToDate ?? true,
      child_friendly: payload.childFriendly ?? true,
      accessibility_adequate: payload.accessibilityAdequate ?? true,
      security_adequate: payload.securityAdequate ?? true,
      pest_free: payload.pestFree ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    inspectionArea: InspectionArea;
    conditionRating: ConditionRating;
    hazardLevel: HazardLevel;
    complianceStatus: ComplianceStatus;
    inspectionDate: string;
    inspectedBy: string;
    cleanlinessAcceptable: boolean;
    fireSafetyChecked: boolean;
    electricalSafetyChecked: boolean;
    waterSafetyChecked: boolean;
    ventilationAdequate: boolean;
    lightingAdequate: boolean;
    maintenanceUpToDate: boolean;
    childFriendly: boolean;
    accessibilityAdequate: boolean;
    securityAdequate: boolean;
    pestFree: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<HomeEnvironmentInspectionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.inspectionArea !== undefined) mapped.inspection_area = updates.inspectionArea;
  if (updates.conditionRating !== undefined) mapped.condition_rating = updates.conditionRating;
  if (updates.hazardLevel !== undefined) mapped.hazard_level = updates.hazardLevel;
  if (updates.complianceStatus !== undefined) mapped.compliance_status = updates.complianceStatus;
  if (updates.inspectionDate !== undefined) mapped.inspection_date = updates.inspectionDate;
  if (updates.inspectedBy !== undefined) mapped.inspected_by = updates.inspectedBy;
  if (updates.cleanlinessAcceptable !== undefined) mapped.cleanliness_acceptable = updates.cleanlinessAcceptable;
  if (updates.fireSafetyChecked !== undefined) mapped.fire_safety_checked = updates.fireSafetyChecked;
  if (updates.electricalSafetyChecked !== undefined) mapped.electrical_safety_checked = updates.electricalSafetyChecked;
  if (updates.waterSafetyChecked !== undefined) mapped.water_safety_checked = updates.waterSafetyChecked;
  if (updates.ventilationAdequate !== undefined) mapped.ventilation_adequate = updates.ventilationAdequate;
  if (updates.lightingAdequate !== undefined) mapped.lighting_adequate = updates.lightingAdequate;
  if (updates.maintenanceUpToDate !== undefined) mapped.maintenance_up_to_date = updates.maintenanceUpToDate;
  if (updates.childFriendly !== undefined) mapped.child_friendly = updates.childFriendly;
  if (updates.accessibilityAdequate !== undefined) mapped.accessibility_adequate = updates.accessibilityAdequate;
  if (updates.securityAdequate !== undefined) mapped.security_adequate = updates.securityAdequate;
  if (updates.pestFree !== undefined) mapped.pest_free = updates.pestFree;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_home_environment_inspection") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeHomeEnvironmentMetrics,
  identifyHomeEnvironmentAlerts,
};
