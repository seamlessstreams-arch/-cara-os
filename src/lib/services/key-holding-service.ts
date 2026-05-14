// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEY HOLDING REGISTER SERVICE
// Tracks key allocation, key audits, lost key incidents, and security
// protocols for children's residential homes.
// CHR 2015 Reg 25 (premises — safe and secure environment),
// Reg 12 (protection — physical security measures),
// Reg 36 (fitness of premises — security of the home).
//
// Covers: key allocation to staff, key return records, key audits,
// lost/stolen key incidents, lock changes, master key management,
// and secure storage access control.
//
// SCCIF: Safety — "The home is physically secure."
// "Keys are managed and accounted for at all times."
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

export type KeyEventType =
  | "key_issued"
  | "key_returned"
  | "key_audit"
  | "key_lost"
  | "key_stolen"
  | "lock_changed"
  | "key_cut"
  | "master_key_check"
  | "spare_key_audit"
  | "other";

export type KeyType =
  | "front_door"
  | "back_door"
  | "bedroom"
  | "office"
  | "medication_cabinet"
  | "secure_storage"
  | "vehicle"
  | "garden_shed"
  | "master_key"
  | "other";

export type KeyStatus =
  | "in_use"
  | "returned"
  | "lost"
  | "stolen"
  | "destroyed"
  | "spare";

export type AuditResult =
  | "all_accounted"
  | "discrepancy_found"
  | "keys_missing"
  | "not_audited"
  | "partial_audit";

export interface KeyHoldingRecord {
  id: string;
  home_id: string;
  key_event_type: KeyEventType;
  key_type: KeyType;
  key_status: KeyStatus;
  audit_result: AuditResult;
  event_date: string;
  key_number: string;
  holder_name: string;
  holder_role: string;
  all_keys_accounted: boolean;
  register_updated: boolean;
  lock_changed_after_loss: boolean;
  incident_reported: boolean;
  police_notified: boolean;
  manager_informed: boolean;
  spare_keys_secure: boolean;
  medication_keys_separate: boolean;
  keys_checked_count: number;
  keys_missing_count: number;
  issues_found: string[];
  actions_taken: string[];
  recorded_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const KEY_EVENT_TYPES: { type: KeyEventType; label: string }[] = [
  { type: "key_issued", label: "Key Issued" },
  { type: "key_returned", label: "Key Returned" },
  { type: "key_audit", label: "Key Audit" },
  { type: "key_lost", label: "Key Lost" },
  { type: "key_stolen", label: "Key Stolen" },
  { type: "lock_changed", label: "Lock Changed" },
  { type: "key_cut", label: "Key Cut" },
  { type: "master_key_check", label: "Master Key Check" },
  { type: "spare_key_audit", label: "Spare Key Audit" },
  { type: "other", label: "Other" },
];

export const KEY_TYPES: { type: KeyType; label: string }[] = [
  { type: "front_door", label: "Front Door" },
  { type: "back_door", label: "Back Door" },
  { type: "bedroom", label: "Bedroom" },
  { type: "office", label: "Office" },
  { type: "medication_cabinet", label: "Medication Cabinet" },
  { type: "secure_storage", label: "Secure Storage" },
  { type: "vehicle", label: "Vehicle" },
  { type: "garden_shed", label: "Garden Shed" },
  { type: "master_key", label: "Master Key" },
  { type: "other", label: "Other" },
];

export const KEY_STATUSES: { status: KeyStatus; label: string }[] = [
  { status: "in_use", label: "In Use" },
  { status: "returned", label: "Returned" },
  { status: "lost", label: "Lost" },
  { status: "stolen", label: "Stolen" },
  { status: "destroyed", label: "Destroyed" },
  { status: "spare", label: "Spare" },
];

export const AUDIT_RESULTS: { result: AuditResult; label: string }[] = [
  { result: "all_accounted", label: "All Accounted" },
  { result: "discrepancy_found", label: "Discrepancy Found" },
  { result: "keys_missing", label: "Keys Missing" },
  { result: "not_audited", label: "Not Audited" },
  { result: "partial_audit", label: "Partial Audit" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeKeyHoldingMetrics(
  records: KeyHoldingRecord[],
): {
  total_events: number;
  keys_issued_count: number;
  keys_returned_count: number;
  keys_lost_count: number;
  keys_stolen_count: number;
  audits_count: number;
  all_accounted_rate: number;
  discrepancy_count: number;
  register_updated_rate: number;
  lock_changed_rate: number;
  spare_keys_secure_rate: number;
  medication_keys_separate_rate: number;
  total_keys_checked: number;
  total_keys_missing: number;
  by_key_event_type: Record<string, number>;
  by_key_type: Record<string, number>;
  by_key_status: Record<string, number>;
  by_audit_result: Record<string, number>;
} {
  const issued = records.filter((r) => r.key_event_type === "key_issued").length;
  const returned = records.filter((r) => r.key_event_type === "key_returned").length;
  const lost = records.filter((r) => r.key_event_type === "key_lost").length;
  const stolen = records.filter((r) => r.key_event_type === "key_stolen").length;
  const audits = records.filter((r) => r.key_event_type === "key_audit").length;

  const allAccounted = records.filter((r) => r.all_keys_accounted).length;
  const allAccountedRate =
    records.length > 0
      ? Math.round((allAccounted / records.length) * 1000) / 10
      : 0;

  const discrepancy = records.filter((r) => r.audit_result === "discrepancy_found").length;

  const boolRate = (field: keyof KeyHoldingRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const totalChecked = records.reduce((a, r) => a + r.keys_checked_count, 0);
  const totalMissing = records.reduce((a, r) => a + r.keys_missing_count, 0);

  const byEvent: Record<string, number> = {};
  for (const r of records) byEvent[r.key_event_type] = (byEvent[r.key_event_type] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.key_type] = (byType[r.key_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.key_status] = (byStatus[r.key_status] ?? 0) + 1;

  const byAudit: Record<string, number> = {};
  for (const r of records) byAudit[r.audit_result] = (byAudit[r.audit_result] ?? 0) + 1;

  return {
    total_events: records.length,
    keys_issued_count: issued,
    keys_returned_count: returned,
    keys_lost_count: lost,
    keys_stolen_count: stolen,
    audits_count: audits,
    all_accounted_rate: allAccountedRate,
    discrepancy_count: discrepancy,
    register_updated_rate: boolRate("register_updated"),
    lock_changed_rate: boolRate("lock_changed_after_loss"),
    spare_keys_secure_rate: boolRate("spare_keys_secure"),
    medication_keys_separate_rate: boolRate("medication_keys_separate"),
    total_keys_checked: totalChecked,
    total_keys_missing: totalMissing,
    by_key_event_type: byEvent,
    by_key_type: byType,
    by_key_status: byStatus,
    by_audit_result: byAudit,
  };
}

export function identifyKeyHoldingAlerts(
  records: KeyHoldingRecord[],
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

  // Key stolen
  for (const r of records) {
    if (r.key_event_type === "key_stolen") {
      alerts.push({
        type: "key_stolen",
        severity: "critical",
        message: `${r.key_type.replace(/_/g, " ")} key stolen on ${r.event_date} — change locks immediately and notify police`,
        id: r.id,
      });
    }
  }

  // Keys lost without lock change
  const lostNoChange = records.filter(
    (r) => r.key_event_type === "key_lost" && !r.lock_changed_after_loss,
  ).length;
  if (lostNoChange >= 1) {
    alerts.push({
      type: "lost_no_lock_change",
      severity: "high",
      message: `${lostNoChange} lost ${lostNoChange === 1 ? "key has" : "keys have"} not had locks changed — address security risk`,
      id: "lost_no_lock_change",
    });
  }

  // Audit discrepancies
  const discrepancies = records.filter((r) => r.audit_result === "discrepancy_found").length;
  if (discrepancies >= 1) {
    alerts.push({
      type: "audit_discrepancy",
      severity: "high",
      message: `${discrepancies} key ${discrepancies === 1 ? "audit has" : "audits have"} found discrepancies — investigate and reconcile`,
      id: "audit_discrepancy",
    });
  }

  // Medication keys not separate
  const medNotSeparate = records.filter((r) => !r.medication_keys_separate).length;
  if (medNotSeparate >= 2) {
    alerts.push({
      type: "medication_keys_not_separate",
      severity: "medium",
      message: `${medNotSeparate} records with medication keys not stored separately — review secure storage`,
      id: "medication_keys_not_separate",
    });
  }

  // Register not updated
  const notUpdated = records.filter((r) => !r.register_updated).length;
  if (notUpdated >= 3) {
    alerts.push({
      type: "register_not_updated",
      severity: "medium",
      message: `${notUpdated} key events without register updated — maintain accurate records`,
      id: "register_not_updated",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    keyEventType?: KeyEventType;
    keyType?: KeyType;
    keyStatus?: KeyStatus;
    limit?: number;
  },
): Promise<ServiceResult<KeyHoldingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_key_holding") as SB).select("*").eq("home_id", homeId);
  if (filters?.keyEventType) q = q.eq("key_event_type", filters.keyEventType);
  if (filters?.keyType) q = q.eq("key_type", filters.keyType);
  if (filters?.keyStatus) q = q.eq("key_status", filters.keyStatus);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    keyEventType: KeyEventType;
    keyType: KeyType;
    keyStatus: KeyStatus;
    auditResult: AuditResult;
    eventDate: string;
    keyNumber: string;
    holderName: string;
    holderRole: string;
    allKeysAccounted: boolean;
    registerUpdated: boolean;
    lockChangedAfterLoss: boolean;
    incidentReported: boolean;
    policeNotified: boolean;
    managerInformed: boolean;
    spareKeysSecure: boolean;
    medicationKeysSeparate: boolean;
    keysCheckedCount: number;
    keysMissingCount: number;
    issuesFound: string[];
    actionsTaken: string[];
    recordedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<KeyHoldingRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_key_holding") as SB)
    .insert({
      home_id: input.homeId,
      key_event_type: input.keyEventType,
      key_type: input.keyType,
      key_status: input.keyStatus,
      audit_result: input.auditResult,
      event_date: input.eventDate,
      key_number: input.keyNumber,
      holder_name: input.holderName,
      holder_role: input.holderRole,
      all_keys_accounted: input.allKeysAccounted,
      register_updated: input.registerUpdated,
      lock_changed_after_loss: input.lockChangedAfterLoss,
      incident_reported: input.incidentReported,
      police_notified: input.policeNotified,
      manager_informed: input.managerInformed,
      spare_keys_secure: input.spareKeysSecure,
      medication_keys_separate: input.medicationKeysSeparate,
      keys_checked_count: input.keysCheckedCount,
      keys_missing_count: input.keysMissingCount,
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
): Promise<ServiceResult<KeyHoldingRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_key_holding") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeKeyHoldingMetrics,
  identifyKeyHoldingAlerts,
};
