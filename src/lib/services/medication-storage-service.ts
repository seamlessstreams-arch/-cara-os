// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION STORAGE SERVICE
// Tracks medication storage conditions, controlled drug cupboard checks,
// fridge temperature monitoring, and secure storage compliance.
// CHR 2015 Reg 23 (health — safe medication storage),
// Reg 25 (premises — safe storage facilities),
// Reg 36 (fitness of premises — appropriate medication storage).
//
// Covers: controlled drug cupboard checks, fridge temperature logs,
// storage condition audits, lock checks, key security, expiry
// monitoring, and medication disposal records.
//
// SCCIF: Health — "Medication is stored securely and appropriately."
// "Controlled drugs are managed in accordance with regulations."
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

export type StorageType =
  | "controlled_drug_cupboard"
  | "general_medication_cabinet"
  | "fridge_storage"
  | "topical_storage"
  | "liquid_storage"
  | "inhaler_storage"
  | "emergency_medication"
  | "disposal_bin"
  | "returns_box"
  | "other";

export type CheckType =
  | "daily_check"
  | "weekly_check"
  | "monthly_audit"
  | "temperature_check"
  | "stock_count"
  | "expiry_check"
  | "lock_check"
  | "key_check"
  | "deep_clean"
  | "other";

export type StorageCondition =
  | "satisfactory"
  | "minor_issues"
  | "major_issues"
  | "unsatisfactory"
  | "not_checked";

export type TemperatureStatus =
  | "in_range"
  | "above_range"
  | "below_range"
  | "not_recorded"
  | "equipment_fault";

export interface MedicationStorageRecord {
  id: string;
  home_id: string;
  storage_type: StorageType;
  check_type: CheckType;
  storage_condition: StorageCondition;
  temperature_status: TemperatureStatus;
  check_date: string;
  storage_location: string;
  temperature_reading: number | null;
  min_temperature: number | null;
  max_temperature: number | null;
  cabinet_locked: boolean;
  keys_secure: boolean;
  controlled_drugs_counted: boolean;
  all_drugs_accounted: boolean;
  expired_items_found: boolean;
  items_in_date: boolean;
  storage_clean: boolean;
  labels_legible: boolean;
  correct_storage_conditions: boolean;
  ventilation_adequate: boolean;
  access_restricted: boolean;
  disposal_needed: boolean;
  items_checked: number;
  discrepancies_found: number;
  issues_found: string[];
  actions_taken: string[];
  checked_by: string;
  witnessed_by: string | null;
  next_check_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const STORAGE_TYPES: { type: StorageType; label: string }[] = [
  { type: "controlled_drug_cupboard", label: "Controlled Drug Cupboard" },
  { type: "general_medication_cabinet", label: "General Medication Cabinet" },
  { type: "fridge_storage", label: "Fridge Storage" },
  { type: "topical_storage", label: "Topical Storage" },
  { type: "liquid_storage", label: "Liquid Storage" },
  { type: "inhaler_storage", label: "Inhaler Storage" },
  { type: "emergency_medication", label: "Emergency Medication" },
  { type: "disposal_bin", label: "Disposal Bin" },
  { type: "returns_box", label: "Returns Box" },
  { type: "other", label: "Other" },
];

export const CHECK_TYPES: { type: CheckType; label: string }[] = [
  { type: "daily_check", label: "Daily Check" },
  { type: "weekly_check", label: "Weekly Check" },
  { type: "monthly_audit", label: "Monthly Audit" },
  { type: "temperature_check", label: "Temperature Check" },
  { type: "stock_count", label: "Stock Count" },
  { type: "expiry_check", label: "Expiry Check" },
  { type: "lock_check", label: "Lock Check" },
  { type: "key_check", label: "Key Check" },
  { type: "deep_clean", label: "Deep Clean" },
  { type: "other", label: "Other" },
];

export const STORAGE_CONDITIONS: { condition: StorageCondition; label: string }[] = [
  { condition: "satisfactory", label: "Satisfactory" },
  { condition: "minor_issues", label: "Minor Issues" },
  { condition: "major_issues", label: "Major Issues" },
  { condition: "unsatisfactory", label: "Unsatisfactory" },
  { condition: "not_checked", label: "Not Checked" },
];

export const TEMPERATURE_STATUSES: { status: TemperatureStatus; label: string }[] = [
  { status: "in_range", label: "In Range" },
  { status: "above_range", label: "Above Range" },
  { status: "below_range", label: "Below Range" },
  { status: "not_recorded", label: "Not Recorded" },
  { status: "equipment_fault", label: "Equipment Fault" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMedicationStorageMetrics(
  records: MedicationStorageRecord[],
): {
  total_checks: number;
  satisfactory_count: number;
  unsatisfactory_count: number;
  satisfactory_rate: number;
  in_range_count: number;
  out_of_range_count: number;
  temperature_in_range_rate: number;
  cabinet_locked_rate: number;
  keys_secure_rate: number;
  all_drugs_accounted_rate: number;
  items_in_date_rate: number;
  storage_clean_rate: number;
  correct_conditions_rate: number;
  access_restricted_rate: number;
  expired_items_count: number;
  disposal_needed_count: number;
  total_items_checked: number;
  total_discrepancies: number;
  average_temperature: number;
  by_storage_type: Record<string, number>;
  by_check_type: Record<string, number>;
  by_storage_condition: Record<string, number>;
  by_temperature_status: Record<string, number>;
} {
  const satisfactory = records.filter((r) => r.storage_condition === "satisfactory").length;
  const unsatisfactory = records.filter((r) => r.storage_condition === "unsatisfactory").length;
  const satisfactoryRate =
    records.length > 0
      ? Math.round((satisfactory / records.length) * 1000) / 10
      : 0;

  const inRange = records.filter((r) => r.temperature_status === "in_range").length;
  const outOfRange = records.filter(
    (r) => r.temperature_status === "above_range" || r.temperature_status === "below_range",
  ).length;
  const tempRecords = records.filter(
    (r) => r.temperature_status !== "not_recorded" && r.temperature_status !== "equipment_fault",
  );
  const tempInRangeRate =
    tempRecords.length > 0
      ? Math.round((inRange / tempRecords.length) * 1000) / 10
      : 0;

  const boolRate = (field: keyof MedicationStorageRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const expiredItems = records.filter((r) => r.expired_items_found).length;
  const disposalNeeded = records.filter((r) => r.disposal_needed).length;
  const totalChecked = records.reduce((a, r) => a + r.items_checked, 0);
  const totalDiscrepancies = records.reduce((a, r) => a + r.discrepancies_found, 0);

  const tempReadings = records
    .filter((r) => r.temperature_reading !== null)
    .map((r) => r.temperature_reading!);
  const avgTemp =
    tempReadings.length > 0
      ? Math.round((tempReadings.reduce((a, t) => a + t, 0) / tempReadings.length) * 10) / 10
      : 0;

  const byStorage: Record<string, number> = {};
  for (const r of records) byStorage[r.storage_type] = (byStorage[r.storage_type] ?? 0) + 1;

  const byCheck: Record<string, number> = {};
  for (const r of records) byCheck[r.check_type] = (byCheck[r.check_type] ?? 0) + 1;

  const byCondition: Record<string, number> = {};
  for (const r of records) byCondition[r.storage_condition] = (byCondition[r.storage_condition] ?? 0) + 1;

  const byTemp: Record<string, number> = {};
  for (const r of records) byTemp[r.temperature_status] = (byTemp[r.temperature_status] ?? 0) + 1;

  return {
    total_checks: records.length,
    satisfactory_count: satisfactory,
    unsatisfactory_count: unsatisfactory,
    satisfactory_rate: satisfactoryRate,
    in_range_count: inRange,
    out_of_range_count: outOfRange,
    temperature_in_range_rate: tempInRangeRate,
    cabinet_locked_rate: boolRate("cabinet_locked"),
    keys_secure_rate: boolRate("keys_secure"),
    all_drugs_accounted_rate: boolRate("all_drugs_accounted"),
    items_in_date_rate: boolRate("items_in_date"),
    storage_clean_rate: boolRate("storage_clean"),
    correct_conditions_rate: boolRate("correct_storage_conditions"),
    access_restricted_rate: boolRate("access_restricted"),
    expired_items_count: expiredItems,
    disposal_needed_count: disposalNeeded,
    total_items_checked: totalChecked,
    total_discrepancies: totalDiscrepancies,
    average_temperature: avgTemp,
    by_storage_type: byStorage,
    by_check_type: byCheck,
    by_storage_condition: byCondition,
    by_temperature_status: byTemp,
  };
}

export function identifyMedicationStorageAlerts(
  records: MedicationStorageRecord[],
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

  // Cabinet unlocked — controlled drugs
  for (const r of records) {
    if (r.storage_type === "controlled_drug_cupboard" && !r.cabinet_locked) {
      alerts.push({
        type: "controlled_drug_unlocked",
        severity: "critical",
        message: `Controlled drug cupboard at ${r.storage_location} found unlocked on ${r.check_date} — secure immediately`,
        id: r.id,
      });
    }
  }

  // Drugs not accounted for
  const notAccounted = records.filter(
    (r) => r.storage_type === "controlled_drug_cupboard" && !r.all_drugs_accounted,
  ).length;
  if (notAccounted >= 1) {
    alerts.push({
      type: "drugs_not_accounted",
      severity: "critical",
      message: `${notAccounted} controlled drug ${notAccounted === 1 ? "check has" : "checks have"} drugs not accounted for — investigate immediately`,
      id: "drugs_not_accounted",
    });
  }

  // Temperature out of range
  const outOfRange = records.filter(
    (r) => r.temperature_status === "above_range" || r.temperature_status === "below_range",
  ).length;
  if (outOfRange >= 1) {
    alerts.push({
      type: "temperature_out_of_range",
      severity: "high",
      message: `${outOfRange} storage ${outOfRange === 1 ? "check has" : "checks have"} temperature out of range — review medication safety`,
      id: "temperature_out_of_range",
    });
  }

  // Expired items found
  const expired = records.filter((r) => r.expired_items_found).length;
  if (expired >= 1) {
    alerts.push({
      type: "expired_items",
      severity: "high",
      message: `${expired} ${expired === 1 ? "check has" : "checks have"} found expired items — remove and dispose safely`,
      id: "expired_items",
    });
  }

  // Storage not clean
  const notClean = records.filter((r) => !r.storage_clean).length;
  if (notClean >= 3) {
    alerts.push({
      type: "storage_not_clean",
      severity: "medium",
      message: `${notClean} checks found storage not clean — review cleaning schedule`,
      id: "storage_not_clean",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    storageType?: StorageType;
    checkType?: CheckType;
    storageCondition?: StorageCondition;
    temperatureStatus?: TemperatureStatus;
    limit?: number;
  },
): Promise<ServiceResult<MedicationStorageRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_medication_storage") as SB).select("*").eq("home_id", homeId);
  if (filters?.storageType) q = q.eq("storage_type", filters.storageType);
  if (filters?.checkType) q = q.eq("check_type", filters.checkType);
  if (filters?.storageCondition) q = q.eq("storage_condition", filters.storageCondition);
  if (filters?.temperatureStatus) q = q.eq("temperature_status", filters.temperatureStatus);
  q = q.order("check_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    storageType: StorageType;
    checkType: CheckType;
    storageCondition: StorageCondition;
    temperatureStatus: TemperatureStatus;
    checkDate: string;
    storageLocation: string;
    temperatureReading?: number | null;
    minTemperature?: number | null;
    maxTemperature?: number | null;
    cabinetLocked?: boolean;
    keysSecure?: boolean;
    controlledDrugsCounted?: boolean;
    allDrugsAccounted?: boolean;
    expiredItemsFound?: boolean;
    itemsInDate?: boolean;
    storageClean?: boolean;
    labelsLegible?: boolean;
    correctStorageConditions?: boolean;
    ventilationAdequate?: boolean;
    accessRestricted?: boolean;
    disposalNeeded?: boolean;
    itemsChecked?: number;
    discrepanciesFound?: number;
    issuesFound?: string[];
    actionsTaken?: string[];
    checkedBy: string;
    witnessedBy?: string | null;
    nextCheckDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<MedicationStorageRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_storage") as SB)
    .insert({
      home_id: payload.homeId,
      storage_type: payload.storageType,
      check_type: payload.checkType,
      storage_condition: payload.storageCondition,
      temperature_status: payload.temperatureStatus,
      check_date: payload.checkDate,
      storage_location: payload.storageLocation,
      temperature_reading: payload.temperatureReading ?? null,
      min_temperature: payload.minTemperature ?? null,
      max_temperature: payload.maxTemperature ?? null,
      cabinet_locked: payload.cabinetLocked ?? true,
      keys_secure: payload.keysSecure ?? true,
      controlled_drugs_counted: payload.controlledDrugsCounted ?? false,
      all_drugs_accounted: payload.allDrugsAccounted ?? true,
      expired_items_found: payload.expiredItemsFound ?? false,
      items_in_date: payload.itemsInDate ?? true,
      storage_clean: payload.storageClean ?? true,
      labels_legible: payload.labelsLegible ?? true,
      correct_storage_conditions: payload.correctStorageConditions ?? true,
      ventilation_adequate: payload.ventilationAdequate ?? true,
      access_restricted: payload.accessRestricted ?? true,
      disposal_needed: payload.disposalNeeded ?? false,
      items_checked: payload.itemsChecked ?? 0,
      discrepancies_found: payload.discrepanciesFound ?? 0,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      checked_by: payload.checkedBy,
      witnessed_by: payload.witnessedBy ?? null,
      next_check_date: payload.nextCheckDate ?? null,
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
    storageType: StorageType;
    checkType: CheckType;
    storageCondition: StorageCondition;
    temperatureStatus: TemperatureStatus;
    checkDate: string;
    storageLocation: string;
    temperatureReading: number | null;
    minTemperature: number | null;
    maxTemperature: number | null;
    cabinetLocked: boolean;
    keysSecure: boolean;
    controlledDrugsCounted: boolean;
    allDrugsAccounted: boolean;
    expiredItemsFound: boolean;
    itemsInDate: boolean;
    storageClean: boolean;
    labelsLegible: boolean;
    correctStorageConditions: boolean;
    ventilationAdequate: boolean;
    accessRestricted: boolean;
    disposalNeeded: boolean;
    itemsChecked: number;
    discrepanciesFound: number;
    issuesFound: string[];
    actionsTaken: string[];
    checkedBy: string;
    witnessedBy: string | null;
    nextCheckDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<MedicationStorageRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.storageType !== undefined) mapped.storage_type = updates.storageType;
  if (updates.checkType !== undefined) mapped.check_type = updates.checkType;
  if (updates.storageCondition !== undefined) mapped.storage_condition = updates.storageCondition;
  if (updates.temperatureStatus !== undefined) mapped.temperature_status = updates.temperatureStatus;
  if (updates.checkDate !== undefined) mapped.check_date = updates.checkDate;
  if (updates.storageLocation !== undefined) mapped.storage_location = updates.storageLocation;
  if (updates.temperatureReading !== undefined) mapped.temperature_reading = updates.temperatureReading;
  if (updates.minTemperature !== undefined) mapped.min_temperature = updates.minTemperature;
  if (updates.maxTemperature !== undefined) mapped.max_temperature = updates.maxTemperature;
  if (updates.cabinetLocked !== undefined) mapped.cabinet_locked = updates.cabinetLocked;
  if (updates.keysSecure !== undefined) mapped.keys_secure = updates.keysSecure;
  if (updates.controlledDrugsCounted !== undefined) mapped.controlled_drugs_counted = updates.controlledDrugsCounted;
  if (updates.allDrugsAccounted !== undefined) mapped.all_drugs_accounted = updates.allDrugsAccounted;
  if (updates.expiredItemsFound !== undefined) mapped.expired_items_found = updates.expiredItemsFound;
  if (updates.itemsInDate !== undefined) mapped.items_in_date = updates.itemsInDate;
  if (updates.storageClean !== undefined) mapped.storage_clean = updates.storageClean;
  if (updates.labelsLegible !== undefined) mapped.labels_legible = updates.labelsLegible;
  if (updates.correctStorageConditions !== undefined) mapped.correct_storage_conditions = updates.correctStorageConditions;
  if (updates.ventilationAdequate !== undefined) mapped.ventilation_adequate = updates.ventilationAdequate;
  if (updates.accessRestricted !== undefined) mapped.access_restricted = updates.accessRestricted;
  if (updates.disposalNeeded !== undefined) mapped.disposal_needed = updates.disposalNeeded;
  if (updates.itemsChecked !== undefined) mapped.items_checked = updates.itemsChecked;
  if (updates.discrepanciesFound !== undefined) mapped.discrepancies_found = updates.discrepanciesFound;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.checkedBy !== undefined) mapped.checked_by = updates.checkedBy;
  if (updates.witnessedBy !== undefined) mapped.witnessed_by = updates.witnessedBy;
  if (updates.nextCheckDate !== undefined) mapped.next_check_date = updates.nextCheckDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_medication_storage") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMedicationStorageMetrics,
  identifyMedicationStorageAlerts,
};
