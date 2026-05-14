// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CLEANING SCHEDULE SERVICE
// Tracks cleaning schedules, hygiene audits, deep cleans, infection
// prevention measures, and environmental cleanliness standards.
// CHR 2015 Reg 25 (premises — maintained to appropriate standard),
// Reg 15 (quality standards — hygienic environment),
// Reg 36 (fitness of premises — clean and well-maintained).
//
// Covers: daily cleaning routines, deep cleaning schedules, hygiene
// audits, laundry hygiene, kitchen cleanliness, bathroom standards,
// and infection prevention protocols.
//
// SCCIF: Overall Experiences — "The home is clean and hygienic."
// "Standards of cleanliness protect children's health."
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

export type CleaningType =
  | "daily_routine"
  | "weekly_deep_clean"
  | "monthly_deep_clean"
  | "quarterly_audit"
  | "kitchen_clean"
  | "bathroom_clean"
  | "bedroom_clean"
  | "communal_area"
  | "infection_clean"
  | "other";

export type CleaningStandard =
  | "excellent"
  | "good"
  | "acceptable"
  | "below_standard"
  | "unacceptable";

export type AreaCleaned =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "lounge"
  | "dining_room"
  | "hallway"
  | "office"
  | "laundry_room"
  | "garden"
  | "other";

export type HygieneRisk =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface CleaningScheduleRecord {
  id: string;
  home_id: string;
  cleaning_type: CleaningType;
  cleaning_standard: CleaningStandard;
  area_cleaned: AreaCleaned;
  hygiene_risk: HygieneRisk;
  cleaning_date: string;
  area_name: string;
  cleaning_products_safe: boolean;
  products_stored_safely: boolean;
  coshh_compliant: boolean;
  children_involved: boolean;
  gloves_worn: boolean;
  ventilation_adequate: boolean;
  surfaces_sanitised: boolean;
  waste_disposed_correctly: boolean;
  sharps_disposed_safely: boolean;
  hand_washing_available: boolean;
  issues_found: string[];
  actions_taken: string[];
  cleaned_by: string;
  inspected_by: string | null;
  next_clean_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CLEANING_TYPES: { type: CleaningType; label: string }[] = [
  { type: "daily_routine", label: "Daily Routine" },
  { type: "weekly_deep_clean", label: "Weekly Deep Clean" },
  { type: "monthly_deep_clean", label: "Monthly Deep Clean" },
  { type: "quarterly_audit", label: "Quarterly Audit" },
  { type: "kitchen_clean", label: "Kitchen Clean" },
  { type: "bathroom_clean", label: "Bathroom Clean" },
  { type: "bedroom_clean", label: "Bedroom Clean" },
  { type: "communal_area", label: "Communal Area" },
  { type: "infection_clean", label: "Infection Clean" },
  { type: "other", label: "Other" },
];

export const CLEANING_STANDARDS: { standard: CleaningStandard; label: string }[] = [
  { standard: "excellent", label: "Excellent" },
  { standard: "good", label: "Good" },
  { standard: "acceptable", label: "Acceptable" },
  { standard: "below_standard", label: "Below Standard" },
  { standard: "unacceptable", label: "Unacceptable" },
];

export const AREAS_CLEANED: { area: AreaCleaned; label: string }[] = [
  { area: "kitchen", label: "Kitchen" },
  { area: "bathroom", label: "Bathroom" },
  { area: "bedroom", label: "Bedroom" },
  { area: "lounge", label: "Lounge" },
  { area: "dining_room", label: "Dining Room" },
  { area: "hallway", label: "Hallway" },
  { area: "office", label: "Office" },
  { area: "laundry_room", label: "Laundry Room" },
  { area: "garden", label: "Garden" },
  { area: "other", label: "Other" },
];

export const HYGIENE_RISKS: { risk: HygieneRisk; label: string }[] = [
  { risk: "none", label: "None" },
  { risk: "low", label: "Low" },
  { risk: "medium", label: "Medium" },
  { risk: "high", label: "High" },
  { risk: "critical", label: "Critical" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeCleaningMetrics(
  records: CleaningScheduleRecord[],
): {
  total_cleans: number;
  excellent_count: number;
  good_count: number;
  below_standard_count: number;
  unacceptable_count: number;
  acceptable_rate: number;
  daily_routine_count: number;
  deep_clean_count: number;
  coshh_compliant_rate: number;
  products_safe_rate: number;
  surfaces_sanitised_rate: number;
  waste_disposed_rate: number;
  hand_washing_rate: number;
  ventilation_rate: number;
  high_risk_count: number;
  children_involved_count: number;
  by_cleaning_type: Record<string, number>;
  by_cleaning_standard: Record<string, number>;
  by_area_cleaned: Record<string, number>;
  by_hygiene_risk: Record<string, number>;
} {
  const excellent = records.filter((r) => r.cleaning_standard === "excellent").length;
  const good = records.filter((r) => r.cleaning_standard === "good").length;
  const belowStd = records.filter((r) => r.cleaning_standard === "below_standard").length;
  const unacceptable = records.filter((r) => r.cleaning_standard === "unacceptable").length;

  const acceptable = records.filter(
    (r) =>
      r.cleaning_standard === "excellent" ||
      r.cleaning_standard === "good" ||
      r.cleaning_standard === "acceptable",
  ).length;
  const acceptableRate =
    records.length > 0
      ? Math.round((acceptable / records.length) * 1000) / 10
      : 0;

  const dailyRoutine = records.filter((r) => r.cleaning_type === "daily_routine").length;
  const deepClean = records.filter(
    (r) => r.cleaning_type === "weekly_deep_clean" || r.cleaning_type === "monthly_deep_clean",
  ).length;

  const boolRate = (field: keyof CleaningScheduleRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const highRisk = records.filter(
    (r) => r.hygiene_risk === "high" || r.hygiene_risk === "critical",
  ).length;

  const childrenInvolved = records.filter((r) => r.children_involved).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.cleaning_type] = (byType[r.cleaning_type] ?? 0) + 1;

  const byStandard: Record<string, number> = {};
  for (const r of records) byStandard[r.cleaning_standard] = (byStandard[r.cleaning_standard] ?? 0) + 1;

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.area_cleaned] = (byArea[r.area_cleaned] ?? 0) + 1;

  const byRisk: Record<string, number> = {};
  for (const r of records) byRisk[r.hygiene_risk] = (byRisk[r.hygiene_risk] ?? 0) + 1;

  return {
    total_cleans: records.length,
    excellent_count: excellent,
    good_count: good,
    below_standard_count: belowStd,
    unacceptable_count: unacceptable,
    acceptable_rate: acceptableRate,
    daily_routine_count: dailyRoutine,
    deep_clean_count: deepClean,
    coshh_compliant_rate: boolRate("coshh_compliant"),
    products_safe_rate: boolRate("cleaning_products_safe"),
    surfaces_sanitised_rate: boolRate("surfaces_sanitised"),
    waste_disposed_rate: boolRate("waste_disposed_correctly"),
    hand_washing_rate: boolRate("hand_washing_available"),
    ventilation_rate: boolRate("ventilation_adequate"),
    high_risk_count: highRisk,
    children_involved_count: childrenInvolved,
    by_cleaning_type: byType,
    by_cleaning_standard: byStandard,
    by_area_cleaned: byArea,
    by_hygiene_risk: byRisk,
  };
}

export function identifyCleaningAlerts(
  records: CleaningScheduleRecord[],
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

  // Critical hygiene risk
  for (const r of records) {
    if (r.hygiene_risk === "critical") {
      alerts.push({
        type: "critical_hygiene",
        severity: "critical",
        message: `Critical hygiene risk in ${r.area_name} on ${r.cleaning_date} — immediate deep clean required`,
        id: r.id,
      });
    }
  }

  // Unacceptable standard
  const unacceptable = records.filter((r) => r.cleaning_standard === "unacceptable").length;
  if (unacceptable >= 1) {
    alerts.push({
      type: "unacceptable_standard",
      severity: "high",
      message: `${unacceptable} ${unacceptable === 1 ? "area has" : "areas have"} unacceptable cleanliness — reclean immediately`,
      id: "unacceptable_standard",
    });
  }

  // COSHH non-compliance
  const nonCoshh = records.filter((r) => !r.coshh_compliant).length;
  if (nonCoshh >= 2) {
    alerts.push({
      type: "coshh_non_compliant",
      severity: "high",
      message: `${nonCoshh} cleans not COSHH compliant — review chemical safety procedures`,
      id: "coshh_non_compliant",
    });
  }

  // Products not stored safely
  const unsafeProducts = records.filter((r) => !r.products_stored_safely).length;
  if (unsafeProducts >= 2) {
    alerts.push({
      type: "unsafe_storage",
      severity: "medium",
      message: `${unsafeProducts} instances of cleaning products not stored safely — secure immediately`,
      id: "unsafe_storage",
    });
  }

  // Surfaces not sanitised
  const notSanitised = records.filter((r) => !r.surfaces_sanitised).length;
  if (notSanitised >= 3) {
    alerts.push({
      type: "surfaces_not_sanitised",
      severity: "medium",
      message: `${notSanitised} cleans without surfaces sanitised — review cleaning protocol`,
      id: "surfaces_not_sanitised",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    cleaningType?: CleaningType;
    cleaningStandard?: CleaningStandard;
    hygieneRisk?: HygieneRisk;
    limit?: number;
  },
): Promise<ServiceResult<CleaningScheduleRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_cleaning_schedule") as SB).select("*").eq("home_id", homeId);
  if (filters?.cleaningType) q = q.eq("cleaning_type", filters.cleaningType);
  if (filters?.cleaningStandard) q = q.eq("cleaning_standard", filters.cleaningStandard);
  if (filters?.hygieneRisk) q = q.eq("hygiene_risk", filters.hygieneRisk);
  q = q.order("cleaning_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    cleaningType: CleaningType;
    cleaningStandard: CleaningStandard;
    areaCleaned: AreaCleaned;
    hygieneRisk: HygieneRisk;
    cleaningDate: string;
    areaName: string;
    cleaningProductsSafe: boolean;
    productsStoredSafely: boolean;
    coshhCompliant: boolean;
    childrenInvolved: boolean;
    glovesWorn: boolean;
    ventilationAdequate: boolean;
    surfacesSanitised: boolean;
    wasteDisposedCorrectly: boolean;
    sharpsDisposedSafely: boolean;
    handWashingAvailable: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    cleanedBy: string;
    inspectedBy?: string;
    nextCleanDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<CleaningScheduleRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_cleaning_schedule") as SB)
    .insert({
      home_id: input.homeId,
      cleaning_type: input.cleaningType,
      cleaning_standard: input.cleaningStandard,
      area_cleaned: input.areaCleaned,
      hygiene_risk: input.hygieneRisk,
      cleaning_date: input.cleaningDate,
      area_name: input.areaName,
      cleaning_products_safe: input.cleaningProductsSafe,
      products_stored_safely: input.productsStoredSafely,
      coshh_compliant: input.coshhCompliant,
      children_involved: input.childrenInvolved,
      gloves_worn: input.glovesWorn,
      ventilation_adequate: input.ventilationAdequate,
      surfaces_sanitised: input.surfacesSanitised,
      waste_disposed_correctly: input.wasteDisposedCorrectly,
      sharps_disposed_safely: input.sharpsDisposedSafely,
      hand_washing_available: input.handWashingAvailable,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      cleaned_by: input.cleanedBy,
      inspected_by: input.inspectedBy ?? null,
      next_clean_date: input.nextCleanDate ?? null,
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
): Promise<ServiceResult<CleaningScheduleRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_cleaning_schedule") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeCleaningMetrics,
  identifyCleaningAlerts,
};
