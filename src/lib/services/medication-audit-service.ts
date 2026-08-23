// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION AUDIT SERVICE
// Tracks controlled drug counts, medication storage audits, fridge
// temperature checks, pharmacy audits, and stock reconciliation.
// CHR 2015 Reg 23 (health — safe medication management),
// Reg 12 (protection — safe storage of controlled substances),
// Reg 40 (standards of conduct — medication governance).
//
// Covers: controlled drug registers, storage condition audits,
// fridge temperature monitoring, expiry date checks, stock counts,
// pharmacy inspections, and disposal records.
//
// SCCIF: Safety — "Medication is stored and managed safely."
// "Controlled drugs are accurately recorded and audited."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AuditType =
  | "controlled_drug_count"
  | "storage_audit"
  | "fridge_temperature"
  | "expiry_check"
  | "stock_reconciliation"
  | "pharmacy_inspection"
  | "disposal_record"
  | "mar_chart_audit"
  | "self_administration_review"
  | "other";

export type AuditOutcome =
  | "satisfactory"
  | "minor_issues"
  | "major_issues"
  | "failed"
  | "not_completed";

export type StorageCondition =
  | "appropriate"
  | "temperature_issue"
  | "security_issue"
  | "organisation_issue"
  | "multiple_issues";

export type DiscrepancyLevel =
  | "none"
  | "minor"
  | "significant"
  | "critical"
  | "under_investigation";

export interface MedicationAuditRecord {
  id: string;
  home_id: string;
  audit_type: AuditType;
  audit_date: string;
  audit_outcome: AuditOutcome;
  storage_condition: StorageCondition;
  discrepancy_level: DiscrepancyLevel;
  controlled_drugs_checked: boolean;
  all_drugs_accounted: boolean;
  fridge_temperature_in_range: boolean;
  cabinet_locked: boolean;
  keys_secure: boolean;
  mar_charts_accurate: boolean;
  expiry_dates_checked: boolean;
  expired_items_found: boolean;
  disposal_witnessed: boolean;
  pharmacy_contacted: boolean;
  gp_informed: boolean;
  stock_count_accurate: boolean;
  items_checked: number;
  discrepancies_found: number;
  fridge_temperature: number | null;
  audited_by: string;
  witnessed_by: string | null;
  issues_found: string[];
  actions_taken: string[];
  next_audit_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const AUDIT_TYPES: { type: AuditType; label: string }[] = [
  { type: "controlled_drug_count", label: "Controlled Drug Count" },
  { type: "storage_audit", label: "Storage Audit" },
  { type: "fridge_temperature", label: "Fridge Temperature" },
  { type: "expiry_check", label: "Expiry Check" },
  { type: "stock_reconciliation", label: "Stock Reconciliation" },
  { type: "pharmacy_inspection", label: "Pharmacy Inspection" },
  { type: "disposal_record", label: "Disposal Record" },
  { type: "mar_chart_audit", label: "MAR Chart Audit" },
  { type: "self_administration_review", label: "Self-Administration Review" },
  { type: "other", label: "Other" },
];

export const AUDIT_OUTCOMES: { outcome: AuditOutcome; label: string }[] = [
  { outcome: "satisfactory", label: "Satisfactory" },
  { outcome: "minor_issues", label: "Minor Issues" },
  { outcome: "major_issues", label: "Major Issues" },
  { outcome: "failed", label: "Failed" },
  { outcome: "not_completed", label: "Not Completed" },
];

export const STORAGE_CONDITIONS: { condition: StorageCondition; label: string }[] = [
  { condition: "appropriate", label: "Appropriate" },
  { condition: "temperature_issue", label: "Temperature Issue" },
  { condition: "security_issue", label: "Security Issue" },
  { condition: "organisation_issue", label: "Organisation Issue" },
  { condition: "multiple_issues", label: "Multiple Issues" },
];

export const DISCREPANCY_LEVELS: { level: DiscrepancyLevel; label: string }[] = [
  { level: "none", label: "None" },
  { level: "minor", label: "Minor" },
  { level: "significant", label: "Significant" },
  { level: "critical", label: "Critical" },
  { level: "under_investigation", label: "Under Investigation" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMedicationAuditMetrics(
  records: MedicationAuditRecord[],
): {
  total_audits: number;
  satisfactory_rate: number | null;
  failed_count: number;
  major_issues_count: number;
  controlled_drug_count: number;
  storage_audit_count: number;
  fridge_check_count: number;
  all_drugs_accounted_rate: number | null;
  fridge_in_range_rate: number | null;
  cabinet_locked_rate: number | null;
  keys_secure_rate: number | null;
  mar_charts_accurate_rate: number | null;
  stock_count_accurate_rate: number | null;
  expired_items_found_count: number;
  total_discrepancies: number;
  average_items_checked: number | null;
  no_discrepancy_rate: number | null;
  by_audit_type: Record<string, number>;
  by_audit_outcome: Record<string, number>;
  by_storage_condition: Record<string, number>;
  by_discrepancy_level: Record<string, number>;
} {
  const satisfactory = records.filter((r) => r.audit_outcome === "satisfactory").length;
  const satisfactoryRate =
    records.length > 0
      ? Math.round((satisfactory / records.length) * 1000) / 10
      : null;

  const failed = records.filter((r) => r.audit_outcome === "failed").length;
  const majorIssues = records.filter((r) => r.audit_outcome === "major_issues").length;

  const controlledDrug = records.filter((r) => r.audit_type === "controlled_drug_count").length;
  const storageAudit = records.filter((r) => r.audit_type === "storage_audit").length;
  const fridgeCheck = records.filter((r) => r.audit_type === "fridge_temperature").length;

  const boolRate = (field: keyof MedicationAuditRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const expiredFound = records.filter((r) => r.expired_items_found).length;

  const totalDiscrepancies = records.reduce((a, r) => a + r.discrepancies_found, 0);
  const totalItems = records.reduce((a, r) => a + r.items_checked, 0);
  const avgItems =
    records.length > 0
      ? Math.round((totalItems / records.length) * 10) / 10
      : null;

  const noDiscrepancy = records.filter((r) => r.discrepancy_level === "none").length;
  const noDiscrepancyRate =
    records.length > 0
      ? Math.round((noDiscrepancy / records.length) * 1000) / 10
      : null;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.audit_type] = (byType[r.audit_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.audit_outcome] = (byOutcome[r.audit_outcome] ?? 0) + 1;

  const byCondition: Record<string, number> = {};
  for (const r of records) byCondition[r.storage_condition] = (byCondition[r.storage_condition] ?? 0) + 1;

  const byDiscrepancy: Record<string, number> = {};
  for (const r of records) byDiscrepancy[r.discrepancy_level] = (byDiscrepancy[r.discrepancy_level] ?? 0) + 1;

  return {
    total_audits: records.length,
    satisfactory_rate: satisfactoryRate,
    failed_count: failed,
    major_issues_count: majorIssues,
    controlled_drug_count: controlledDrug,
    storage_audit_count: storageAudit,
    fridge_check_count: fridgeCheck,
    all_drugs_accounted_rate: boolRate("all_drugs_accounted"),
    fridge_in_range_rate: boolRate("fridge_temperature_in_range"),
    cabinet_locked_rate: boolRate("cabinet_locked"),
    keys_secure_rate: boolRate("keys_secure"),
    mar_charts_accurate_rate: boolRate("mar_charts_accurate"),
    stock_count_accurate_rate: boolRate("stock_count_accurate"),
    expired_items_found_count: expiredFound,
    total_discrepancies: totalDiscrepancies,
    average_items_checked: avgItems,
    no_discrepancy_rate: noDiscrepancyRate,
    by_audit_type: byType,
    by_audit_outcome: byOutcome,
    by_storage_condition: byCondition,
    by_discrepancy_level: byDiscrepancy,
  };
}

export function identifyMedicationAuditAlerts(
  records: MedicationAuditRecord[],
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

  // Critical discrepancy in controlled drugs
  for (const r of records) {
    if (r.discrepancy_level === "critical" && r.audit_type === "controlled_drug_count") {
      alerts.push({
        type: "controlled_drug_discrepancy",
        severity: "critical",
        message: `Critical controlled drug discrepancy on ${r.audit_date} — investigate immediately and notify pharmacy`,
        id: r.id,
      });
    }
  }

  // Failed audits
  const failedCount = records.filter((r) => r.audit_outcome === "failed").length;
  if (failedCount >= 1) {
    alerts.push({
      type: "failed_audit",
      severity: "high",
      message: `${failedCount} medication ${failedCount === 1 ? "audit has" : "audits have"} failed — take corrective action immediately`,
      id: "failed_audit",
    });
  }

  // Cabinet not locked
  const unlocked = records.filter((r) => !r.cabinet_locked).length;
  if (unlocked >= 1) {
    alerts.push({
      type: "cabinet_unlocked",
      severity: "high",
      message: `${unlocked} ${unlocked === 1 ? "audit found" : "audits found"} medication cabinet unlocked — secure immediately`,
      id: "cabinet_unlocked",
    });
  }

  // Expired items found
  const expiredCount = records.filter((r) => r.expired_items_found).length;
  if (expiredCount >= 1) {
    alerts.push({
      type: "expired_medication",
      severity: "high",
      message: `${expiredCount} ${expiredCount === 1 ? "audit found" : "audits found"} expired medication — dispose safely and reorder`,
      id: "expired_medication",
    });
  }

  // Fridge out of range
  const fridgeOut = records.filter(
    (r) => r.audit_type === "fridge_temperature" && !r.fridge_temperature_in_range,
  ).length;
  if (fridgeOut >= 2) {
    alerts.push({
      type: "fridge_out_of_range",
      severity: "medium",
      message: `${fridgeOut} fridge temperature checks out of range — recalibrate or repair fridge`,
      id: "fridge_out_of_range",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    auditType?: AuditType;
    auditOutcome?: AuditOutcome;
    discrepancyLevel?: DiscrepancyLevel;
    limit?: number;
  },
): Promise<ServiceResult<MedicationAuditRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_medication_audits") as SB).select("*").eq("home_id", homeId);
  if (filters?.auditType) q = q.eq("audit_type", filters.auditType);
  if (filters?.auditOutcome) q = q.eq("audit_outcome", filters.auditOutcome);
  if (filters?.discrepancyLevel) q = q.eq("discrepancy_level", filters.discrepancyLevel);
  q = q.order("audit_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    auditType: AuditType;
    auditDate: string;
    auditOutcome: AuditOutcome;
    storageCondition: StorageCondition;
    discrepancyLevel: DiscrepancyLevel;
    controlledDrugsChecked: boolean;
    allDrugsAccounted: boolean;
    fridgeTemperatureInRange: boolean;
    cabinetLocked: boolean;
    keysSecure: boolean;
    marChartsAccurate: boolean;
    expiryDatesChecked: boolean;
    expiredItemsFound: boolean;
    disposalWitnessed: boolean;
    pharmacyContacted: boolean;
    gpInformed: boolean;
    stockCountAccurate: boolean;
    itemsChecked: number;
    discrepanciesFound: number;
    fridgeTemperature?: number;
    auditedBy: string;
    witnessedBy?: string;
    issuesFound: string[];
    actionsTaken: string[];
    nextAuditDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<MedicationAuditRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_audits") as SB)
    .insert({
      home_id: input.homeId,
      audit_type: input.auditType,
      audit_date: input.auditDate,
      audit_outcome: input.auditOutcome,
      storage_condition: input.storageCondition,
      discrepancy_level: input.discrepancyLevel,
      controlled_drugs_checked: input.controlledDrugsChecked,
      all_drugs_accounted: input.allDrugsAccounted,
      fridge_temperature_in_range: input.fridgeTemperatureInRange,
      cabinet_locked: input.cabinetLocked,
      keys_secure: input.keysSecure,
      mar_charts_accurate: input.marChartsAccurate,
      expiry_dates_checked: input.expiryDatesChecked,
      expired_items_found: input.expiredItemsFound,
      disposal_witnessed: input.disposalWitnessed,
      pharmacy_contacted: input.pharmacyContacted,
      gp_informed: input.gpInformed,
      stock_count_accurate: input.stockCountAccurate,
      items_checked: input.itemsChecked,
      discrepancies_found: input.discrepanciesFound,
      fridge_temperature: input.fridgeTemperature ?? null,
      audited_by: input.auditedBy,
      witnessed_by: input.witnessedBy ?? null,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      next_audit_date: input.nextAuditDate ?? null,
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
): Promise<ServiceResult<MedicationAuditRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_audits") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMedicationAuditMetrics,
  identifyMedicationAuditAlerts,
};
