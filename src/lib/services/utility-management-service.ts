// ══════════════════════════════════════════════════════════════════════════════
// CARA — UTILITY MANAGEMENT SERVICE
// Tracks energy usage, meter readings, utility costs, sustainability
// measures, and environmental compliance for children's homes.
// CHR 2015 Reg 25 (premises — safe and comfortable environment),
// Reg 36 (fitness of premises — adequate heating and utilities),
// Reg 15 (quality standards — suitable living conditions).
//
// Covers: gas, electricity, water meter readings, cost tracking,
// energy efficiency measures, supplier management, and sustainability.
//
// SCCIF: Overall Experiences — "The home is warm and comfortable."
// "Resources are managed efficiently and sustainably."
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

export type UtilityType =
  | "electricity"
  | "gas"
  | "water"
  | "oil"
  | "lpg"
  | "solar"
  | "waste_collection"
  | "recycling"
  | "broadband"
  | "other";

export type ReadingType =
  | "meter_reading"
  | "bill_received"
  | "efficiency_audit"
  | "supplier_change"
  | "tariff_review"
  | "maintenance"
  | "fault_report"
  | "smart_meter_install"
  | "sustainability_measure"
  | "other";

export type CostStatus =
  | "within_budget"
  | "over_budget"
  | "under_budget"
  | "pending_review"
  | "disputed";

export type EnergyRating =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "not_assessed";

export interface UtilityRecord {
  id: string;
  home_id: string;
  utility_type: UtilityType;
  reading_type: ReadingType;
  reading_date: string;
  cost_status: CostStatus;
  energy_rating: EnergyRating;
  meter_reading: number | null;
  previous_reading: number | null;
  cost_amount: number | null;
  budget_amount: number | null;
  supplier_name: string;
  contract_end_date: string | null;
  smart_meter_installed: boolean;
  heating_adequate: boolean;
  hot_water_available: boolean;
  children_comfortable: boolean;
  energy_saving_measures: boolean;
  renewable_energy_used: boolean;
  carbon_offset: boolean;
  issues_found: string[];
  actions_taken: string[];
  recorded_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const UTILITY_TYPES: { type: UtilityType; label: string }[] = [
  { type: "electricity", label: "Electricity" },
  { type: "gas", label: "Gas" },
  { type: "water", label: "Water" },
  { type: "oil", label: "Oil" },
  { type: "lpg", label: "LPG" },
  { type: "solar", label: "Solar" },
  { type: "waste_collection", label: "Waste Collection" },
  { type: "recycling", label: "Recycling" },
  { type: "broadband", label: "Broadband" },
  { type: "other", label: "Other" },
];

export const READING_TYPES: { type: ReadingType; label: string }[] = [
  { type: "meter_reading", label: "Meter Reading" },
  { type: "bill_received", label: "Bill Received" },
  { type: "efficiency_audit", label: "Efficiency Audit" },
  { type: "supplier_change", label: "Supplier Change" },
  { type: "tariff_review", label: "Tariff Review" },
  { type: "maintenance", label: "Maintenance" },
  { type: "fault_report", label: "Fault Report" },
  { type: "smart_meter_install", label: "Smart Meter Install" },
  { type: "sustainability_measure", label: "Sustainability Measure" },
  { type: "other", label: "Other" },
];

export const COST_STATUSES: { status: CostStatus; label: string }[] = [
  { status: "within_budget", label: "Within Budget" },
  { status: "over_budget", label: "Over Budget" },
  { status: "under_budget", label: "Under Budget" },
  { status: "pending_review", label: "Pending Review" },
  { status: "disputed", label: "Disputed" },
];

export const ENERGY_RATINGS: { rating: EnergyRating; label: string }[] = [
  { rating: "a", label: "A" },
  { rating: "b", label: "B" },
  { rating: "c", label: "C" },
  { rating: "d", label: "D" },
  { rating: "e", label: "E" },
  { rating: "f", label: "F" },
  { rating: "g", label: "G" },
  { rating: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeUtilityMetrics(
  records: UtilityRecord[],
): {
  total_records: number;
  electricity_count: number;
  gas_count: number;
  water_count: number;
  meter_reading_count: number;
  bill_count: number;
  within_budget_rate: number | null;
  over_budget_count: number;
  disputed_count: number;
  total_cost: number;
  average_cost: number | null;
  smart_meter_rate: number | null;
  heating_adequate_rate: number | null;
  hot_water_rate: number | null;
  children_comfortable_rate: number | null;
  energy_saving_rate: number | null;
  renewable_rate: number | null;
  fault_count: number;
  by_utility_type: Record<string, number>;
  by_reading_type: Record<string, number>;
  by_cost_status: Record<string, number>;
  by_energy_rating: Record<string, number>;
} {
  const electricity = records.filter((r) => r.utility_type === "electricity").length;
  const gas = records.filter((r) => r.utility_type === "gas").length;
  const water = records.filter((r) => r.utility_type === "water").length;

  const meterReading = records.filter((r) => r.reading_type === "meter_reading").length;
  const bill = records.filter((r) => r.reading_type === "bill_received").length;

  const withinBudget = records.filter((r) => r.cost_status === "within_budget").length;
  const withinBudgetRate =
    records.length > 0
      ? Math.round((withinBudget / records.length) * 1000) / 10
      : null;

  const overBudget = records.filter((r) => r.cost_status === "over_budget").length;
  const disputed = records.filter((r) => r.cost_status === "disputed").length;

  const costs = records.filter((r) => r.cost_amount !== null).map((r) => r.cost_amount!);
  const totalCost = Math.round(costs.reduce((a, b) => a + b, 0) * 100) / 100;
  const avgCost =
    costs.length > 0
      ? Math.round((totalCost / costs.length) * 100) / 100
      : null;

  const boolRate = (field: keyof UtilityRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const faults = records.filter((r) => r.reading_type === "fault_report").length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.utility_type] = (byType[r.utility_type] ?? 0) + 1;

  const byReading: Record<string, number> = {};
  for (const r of records) byReading[r.reading_type] = (byReading[r.reading_type] ?? 0) + 1;

  const byCost: Record<string, number> = {};
  for (const r of records) byCost[r.cost_status] = (byCost[r.cost_status] ?? 0) + 1;

  const byEnergy: Record<string, number> = {};
  for (const r of records) byEnergy[r.energy_rating] = (byEnergy[r.energy_rating] ?? 0) + 1;

  return {
    total_records: records.length,
    electricity_count: electricity,
    gas_count: gas,
    water_count: water,
    meter_reading_count: meterReading,
    bill_count: bill,
    within_budget_rate: withinBudgetRate,
    over_budget_count: overBudget,
    disputed_count: disputed,
    total_cost: totalCost,
    average_cost: avgCost,
    smart_meter_rate: boolRate("smart_meter_installed"),
    heating_adequate_rate: boolRate("heating_adequate"),
    hot_water_rate: boolRate("hot_water_available"),
    children_comfortable_rate: boolRate("children_comfortable"),
    energy_saving_rate: boolRate("energy_saving_measures"),
    renewable_rate: boolRate("renewable_energy_used"),
    fault_count: faults,
    by_utility_type: byType,
    by_reading_type: byReading,
    by_cost_status: byCost,
    by_energy_rating: byEnergy,
  };
}

export function identifyUtilityAlerts(
  records: UtilityRecord[],
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

  // Heating not adequate
  for (const r of records) {
    if (!r.heating_adequate) {
      alerts.push({
        type: "heating_inadequate",
        severity: "critical",
        message: `Heating inadequate on ${r.reading_date} — children must have adequate warmth`,
        id: r.id,
      });
    }
  }

  // Over budget
  const overBudget = records.filter((r) => r.cost_status === "over_budget").length;
  if (overBudget >= 1) {
    alerts.push({
      type: "over_budget",
      severity: "high",
      message: `${overBudget} ${overBudget === 1 ? "utility is" : "utilities are"} over budget — review spending`,
      id: "over_budget",
    });
  }

  // Fault reports
  const faults = records.filter((r) => r.reading_type === "fault_report").length;
  if (faults >= 1) {
    alerts.push({
      type: "utility_fault",
      severity: "high",
      message: `${faults} utility ${faults === 1 ? "fault has" : "faults have"} been reported — resolve promptly`,
      id: "utility_fault",
    });
  }

  // Disputed bills
  const disputed = records.filter((r) => r.cost_status === "disputed").length;
  if (disputed >= 1) {
    alerts.push({
      type: "disputed_bill",
      severity: "medium",
      message: `${disputed} ${disputed === 1 ? "bill is" : "bills are"} disputed — follow up with supplier`,
      id: "disputed_bill",
    });
  }

  // Low energy efficiency
  const noSaving = records.filter((r) => !r.energy_saving_measures).length;
  if (noSaving >= 3) {
    alerts.push({
      type: "low_efficiency",
      severity: "medium",
      message: `${noSaving} records without energy saving measures — review sustainability`,
      id: "low_efficiency",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    utilityType?: UtilityType;
    readingType?: ReadingType;
    costStatus?: CostStatus;
    limit?: number;
  },
): Promise<ServiceResult<UtilityRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_utility_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.utilityType) q = q.eq("utility_type", filters.utilityType);
  if (filters?.readingType) q = q.eq("reading_type", filters.readingType);
  if (filters?.costStatus) q = q.eq("cost_status", filters.costStatus);
  q = q.order("reading_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    utilityType: UtilityType;
    readingType: ReadingType;
    readingDate: string;
    costStatus: CostStatus;
    energyRating: EnergyRating;
    meterReading?: number;
    previousReading?: number;
    costAmount?: number;
    budgetAmount?: number;
    supplierName: string;
    contractEndDate?: string;
    smartMeterInstalled: boolean;
    heatingAdequate: boolean;
    hotWaterAvailable: boolean;
    childrenComfortable: boolean;
    energySavingMeasures: boolean;
    renewableEnergyUsed: boolean;
    carbonOffset: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    recordedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<UtilityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_utility_records") as SB)
    .insert({
      home_id: input.homeId,
      utility_type: input.utilityType,
      reading_type: input.readingType,
      reading_date: input.readingDate,
      cost_status: input.costStatus,
      energy_rating: input.energyRating,
      meter_reading: input.meterReading ?? null,
      previous_reading: input.previousReading ?? null,
      cost_amount: input.costAmount ?? null,
      budget_amount: input.budgetAmount ?? null,
      supplier_name: input.supplierName,
      contract_end_date: input.contractEndDate ?? null,
      smart_meter_installed: input.smartMeterInstalled,
      heating_adequate: input.heatingAdequate,
      hot_water_available: input.hotWaterAvailable,
      children_comfortable: input.childrenComfortable,
      energy_saving_measures: input.energySavingMeasures,
      renewable_energy_used: input.renewableEnergyUsed,
      carbon_offset: input.carbonOffset,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      recorded_by: input.recordedBy,
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
): Promise<ServiceResult<UtilityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_utility_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeUtilityMetrics,
  identifyUtilityAlerts,
};
