// ══════════════════════════════════════════════════════════════════════════════
// CARA — PEST CONTROL SERVICE
// Tracks pest inspections, treatments, prevention measures, and compliance
// for children's residential homes.
// CHR 2015 Reg 25 (premises — health and safety),
// Reg 36 (fitness of premises — habitable conditions),
// Reg 15 (quality standards — suitable environment).
//
// Covers: routine inspections, pest sightings, treatments,
// prevention measures, contractor visits, and follow-up.
//
// SCCIF: Overall Experiences — "The home is clean and well-maintained."
// "Children live in a safe, hygienic environment."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type InspectionType =
  | "routine_inspection"
  | "reactive_call"
  | "follow_up"
  | "annual_contract"
  | "emergency_treatment"
  | "prevention_visit"
  | "complaint_investigation"
  | "post_treatment_check"
  | "seasonal_check"
  | "other";

export type PestType =
  | "rodents"
  | "insects"
  | "birds"
  | "wasps_bees"
  | "ants"
  | "cockroaches"
  | "bed_bugs"
  | "fleas"
  | "moths"
  | "none_found";

export type TreatmentOutcome =
  | "resolved"
  | "partially_resolved"
  | "ongoing"
  | "no_treatment_needed"
  | "referred_to_specialist";

export type RiskLevel =
  | "no_risk"
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface PestControlRecord {
  id: string;
  home_id: string;
  inspection_type: InspectionType;
  inspection_date: string;
  pest_type: PestType;
  treatment_outcome: TreatmentOutcome;
  risk_level: RiskLevel;
  location_in_home: string;
  contractor_name: string | null;
  contractor_certified: boolean;
  children_informed: boolean;
  children_relocated: boolean;
  chemicals_used: boolean;
  chemical_safety_sheet_obtained: boolean;
  area_ventilated: boolean;
  food_areas_affected: boolean;
  entry_points_sealed: boolean;
  prevention_measures_implemented: boolean;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  environmental_health_notified: boolean;
  issues_found: string[];
  actions_taken: string[];
  inspected_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const INSPECTION_TYPES: { type: InspectionType; label: string }[] = [
  { type: "routine_inspection", label: "Routine Inspection" },
  { type: "reactive_call", label: "Reactive Call" },
  { type: "follow_up", label: "Follow Up" },
  { type: "annual_contract", label: "Annual Contract" },
  { type: "emergency_treatment", label: "Emergency Treatment" },
  { type: "prevention_visit", label: "Prevention Visit" },
  { type: "complaint_investigation", label: "Complaint Investigation" },
  { type: "post_treatment_check", label: "Post-Treatment Check" },
  { type: "seasonal_check", label: "Seasonal Check" },
  { type: "other", label: "Other" },
];

export const PEST_TYPES: { type: PestType; label: string }[] = [
  { type: "rodents", label: "Rodents" },
  { type: "insects", label: "Insects" },
  { type: "birds", label: "Birds" },
  { type: "wasps_bees", label: "Wasps/Bees" },
  { type: "ants", label: "Ants" },
  { type: "cockroaches", label: "Cockroaches" },
  { type: "bed_bugs", label: "Bed Bugs" },
  { type: "fleas", label: "Fleas" },
  { type: "moths", label: "Moths" },
  { type: "none_found", label: "None Found" },
];

export const TREATMENT_OUTCOMES: { outcome: TreatmentOutcome; label: string }[] = [
  { outcome: "resolved", label: "Resolved" },
  { outcome: "partially_resolved", label: "Partially Resolved" },
  { outcome: "ongoing", label: "Ongoing" },
  { outcome: "no_treatment_needed", label: "No Treatment Needed" },
  { outcome: "referred_to_specialist", label: "Referred to Specialist" },
];

export const RISK_LEVELS: { level: RiskLevel; label: string }[] = [
  { level: "no_risk", label: "No Risk" },
  { level: "low", label: "Low" },
  { level: "medium", label: "Medium" },
  { level: "high", label: "High" },
  { level: "critical", label: "Critical" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePestControlMetrics(
  records: PestControlRecord[],
): {
  total_inspections: number;
  routine_count: number;
  reactive_count: number;
  emergency_count: number;
  follow_up_count: number;
  resolved_rate: number | null;
  ongoing_count: number;
  no_pest_found_rate: number | null;
  high_risk_count: number;
  critical_risk_count: number;
  contractor_certified_rate: number | null;
  children_informed_rate: number | null;
  chemicals_used_count: number;
  safety_sheet_obtained_rate: number | null;
  food_areas_affected_count: number;
  entry_points_sealed_rate: number | null;
  prevention_implemented_rate: number | null;
  follow_up_required_count: number;
  follow_up_overdue_count: number;
  env_health_notified_count: number;
  by_inspection_type: Record<string, number>;
  by_pest_type: Record<string, number>;
  by_treatment_outcome: Record<string, number>;
  by_risk_level: Record<string, number>;
} {
  const routine = records.filter((r) => r.inspection_type === "routine_inspection").length;
  const reactive = records.filter((r) => r.inspection_type === "reactive_call").length;
  const emergency = records.filter((r) => r.inspection_type === "emergency_treatment").length;
  const followUp = records.filter((r) => r.inspection_type === "follow_up").length;

  const resolved = records.filter((r) => r.treatment_outcome === "resolved").length;
  const resolvedRate =
    records.length > 0
      ? Math.round((resolved / records.length) * 1000) / 10
      : null;

  const ongoing = records.filter((r) => r.treatment_outcome === "ongoing").length;

  const noPest = records.filter((r) => r.pest_type === "none_found").length;
  const noPestRate =
    records.length > 0
      ? Math.round((noPest / records.length) * 1000) / 10
      : null;

  const highRisk = records.filter((r) => r.risk_level === "high").length;
  const criticalRisk = records.filter((r) => r.risk_level === "critical").length;

  const boolRate = (field: keyof PestControlRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const chemUsed = records.filter((r) => r.chemicals_used).length;

  const chemRecords = records.filter((r) => r.chemicals_used);
  const safetySheetRate =
    chemRecords.length > 0
      ? Math.round(
          (chemRecords.filter((r) => r.chemical_safety_sheet_obtained).length /
            chemRecords.length) *
            1000,
        ) / 10
      : null;

  const foodAffected = records.filter((r) => r.food_areas_affected).length;

  const followUpRequired = records.filter((r) => r.follow_up_required).length;

  const now = new Date();
  const followUpOverdue = records.filter((r) => {
    if (!r.follow_up_required || r.follow_up_completed) return false;
    if (!r.follow_up_date) return false;
    return new Date(r.follow_up_date) < now;
  }).length;

  const envNotified = records.filter((r) => r.environmental_health_notified).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.inspection_type] = (byType[r.inspection_type] ?? 0) + 1;

  const byPest: Record<string, number> = {};
  for (const r of records) byPest[r.pest_type] = (byPest[r.pest_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.treatment_outcome] = (byOutcome[r.treatment_outcome] ?? 0) + 1;

  const byRisk: Record<string, number> = {};
  for (const r of records) byRisk[r.risk_level] = (byRisk[r.risk_level] ?? 0) + 1;

  return {
    total_inspections: records.length,
    routine_count: routine,
    reactive_count: reactive,
    emergency_count: emergency,
    follow_up_count: followUp,
    resolved_rate: resolvedRate,
    ongoing_count: ongoing,
    no_pest_found_rate: noPestRate,
    high_risk_count: highRisk,
    critical_risk_count: criticalRisk,
    contractor_certified_rate: boolRate("contractor_certified"),
    children_informed_rate: boolRate("children_informed"),
    chemicals_used_count: chemUsed,
    safety_sheet_obtained_rate: safetySheetRate,
    food_areas_affected_count: foodAffected,
    entry_points_sealed_rate: boolRate("entry_points_sealed"),
    prevention_implemented_rate: boolRate("prevention_measures_implemented"),
    follow_up_required_count: followUpRequired,
    follow_up_overdue_count: followUpOverdue,
    env_health_notified_count: envNotified,
    by_inspection_type: byType,
    by_pest_type: byPest,
    by_treatment_outcome: byOutcome,
    by_risk_level: byRisk,
  };
}

export function identifyPestControlAlerts(
  records: PestControlRecord[],
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

  // Critical risk pest issue
  for (const r of records) {
    if (r.risk_level === "critical") {
      alerts.push({
        type: "critical_risk",
        severity: "critical",
        message: `Critical pest risk in ${r.location_in_home} — ${r.pest_type.replace(/_/g, " ")} found on ${r.inspection_date}`,
        id: r.id,
      });
    }
  }

  // Food areas affected
  const foodAffected = records.filter((r) => r.food_areas_affected).length;
  if (foodAffected >= 1) {
    alerts.push({
      type: "food_area_affected",
      severity: "high",
      message: `${foodAffected} ${foodAffected === 1 ? "inspection has" : "inspections have"} found pests in food areas — urgent action required`,
      id: "food_area_affected",
    });
  }

  // Ongoing treatment
  const ongoingCount = records.filter((r) => r.treatment_outcome === "ongoing").length;
  if (ongoingCount >= 1) {
    alerts.push({
      type: "ongoing_treatment",
      severity: "high",
      message: `${ongoingCount} pest ${ongoingCount === 1 ? "treatment is" : "treatments are"} ongoing — monitor progress`,
      id: "ongoing_treatment",
    });
  }

  // Follow-up overdue
  const now = new Date();
  const followUpOverdue = records.filter((r) => {
    if (!r.follow_up_required || r.follow_up_completed) return false;
    if (!r.follow_up_date) return false;
    return new Date(r.follow_up_date) < now;
  }).length;
  if (followUpOverdue >= 1) {
    alerts.push({
      type: "follow_up_overdue",
      severity: "high",
      message: `${followUpOverdue} pest control ${followUpOverdue === 1 ? "follow-up is" : "follow-ups are"} overdue — schedule promptly`,
      id: "follow_up_overdue",
    });
  }

  // Chemicals used without safety sheet
  const noSafetySheet = records.filter(
    (r) => r.chemicals_used && !r.chemical_safety_sheet_obtained,
  ).length;
  if (noSafetySheet >= 1) {
    alerts.push({
      type: "no_safety_sheet",
      severity: "medium",
      message: `${noSafetySheet} ${noSafetySheet === 1 ? "treatment" : "treatments"} used chemicals without safety data sheet — obtain documentation`,
      id: "no_safety_sheet",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    inspectionType?: InspectionType;
    pestType?: PestType;
    treatmentOutcome?: TreatmentOutcome;
    limit?: number;
  },
): Promise<ServiceResult<PestControlRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_pest_control") as SB).select("*").eq("home_id", homeId);
  if (filters?.inspectionType) q = q.eq("inspection_type", filters.inspectionType);
  if (filters?.pestType) q = q.eq("pest_type", filters.pestType);
  if (filters?.treatmentOutcome) q = q.eq("treatment_outcome", filters.treatmentOutcome);
  q = q.order("inspection_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    inspectionType: InspectionType;
    inspectionDate: string;
    pestType: PestType;
    treatmentOutcome: TreatmentOutcome;
    riskLevel: RiskLevel;
    locationInHome: string;
    contractorName?: string;
    contractorCertified: boolean;
    childrenInformed: boolean;
    childrenRelocated: boolean;
    chemicalsUsed: boolean;
    chemicalSafetySheetObtained: boolean;
    areaVentilated: boolean;
    foodAreasAffected: boolean;
    entryPointsSealed: boolean;
    preventionMeasuresImplemented: boolean;
    followUpRequired: boolean;
    followUpDate?: string;
    followUpCompleted: boolean;
    environmentalHealthNotified: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    inspectedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<PestControlRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_pest_control") as SB)
    .insert({
      home_id: input.homeId,
      inspection_type: input.inspectionType,
      inspection_date: input.inspectionDate,
      pest_type: input.pestType,
      treatment_outcome: input.treatmentOutcome,
      risk_level: input.riskLevel,
      location_in_home: input.locationInHome,
      contractor_name: input.contractorName ?? null,
      contractor_certified: input.contractorCertified,
      children_informed: input.childrenInformed,
      children_relocated: input.childrenRelocated,
      chemicals_used: input.chemicalsUsed,
      chemical_safety_sheet_obtained: input.chemicalSafetySheetObtained,
      area_ventilated: input.areaVentilated,
      food_areas_affected: input.foodAreasAffected,
      entry_points_sealed: input.entryPointsSealed,
      prevention_measures_implemented: input.preventionMeasuresImplemented,
      follow_up_required: input.followUpRequired,
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: input.followUpCompleted,
      environmental_health_notified: input.environmentalHealthNotified,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      inspected_by: input.inspectedBy,
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
): Promise<ServiceResult<PestControlRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_pest_control") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePestControlMetrics,
  identifyPestControlAlerts,
};
