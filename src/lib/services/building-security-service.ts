// ══════════════════════════════════════════════════════════════════════════════
// CARA — BUILDING SECURITY SERVICE
// Tracks physical security measures, access controls, alarm systems,
// perimeter checks, and security incidents.
// CHR 2015 Reg 36 (fitness of premises — security),
// Reg 25 (health and safety — premises security),
// Reg 12 (protection — physical safety).
//
// Covers: security checks, access control logs, alarm testing,
// window/door locks, perimeter inspections, and key management.
//
// SCCIF: Helped & Protected — "The home is secure."
// "Appropriate security measures protect children."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SecurityEventType =
  | "routine_check"
  | "alarm_test"
  | "key_audit"
  | "perimeter_inspection"
  | "lock_check"
  | "security_incident"
  | "access_control_review"
  | "lighting_check"
  | "cctv_check"
  | "other";

export type SecurityStatus =
  | "secure"
  | "minor_issue"
  | "major_issue"
  | "breach"
  | "not_checked";

export type AlarmStatus =
  | "operational"
  | "fault_detected"
  | "disabled"
  | "not_installed"
  | "not_tested";

export type KeyManagement =
  | "all_accounted"
  | "key_missing"
  | "key_replaced"
  | "audit_due"
  | "not_checked";

export interface SecurityRecord {
  id: string;
  home_id: string;
  event_type: SecurityEventType;
  event_date: string;
  security_status: SecurityStatus;
  alarm_status: AlarmStatus;
  key_management: KeyManagement;
  all_doors_secure: boolean;
  all_windows_secure: boolean;
  external_lighting_working: boolean;
  perimeter_secure: boolean;
  visitors_log_checked: boolean;
  children_accounted_for: boolean;
  issues_found: string[];
  actions_taken: string[];
  checked_by: string;
  next_check_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SECURITY_EVENT_TYPES: { type: SecurityEventType; label: string }[] = [
  { type: "routine_check", label: "Routine Check" },
  { type: "alarm_test", label: "Alarm Test" },
  { type: "key_audit", label: "Key Audit" },
  { type: "perimeter_inspection", label: "Perimeter Inspection" },
  { type: "lock_check", label: "Lock Check" },
  { type: "security_incident", label: "Security Incident" },
  { type: "access_control_review", label: "Access Control Review" },
  { type: "lighting_check", label: "Lighting Check" },
  { type: "cctv_check", label: "CCTV Check" },
  { type: "other", label: "Other" },
];

export const SECURITY_STATUSES: { status: SecurityStatus; label: string }[] = [
  { status: "secure", label: "Secure" },
  { status: "minor_issue", label: "Minor Issue" },
  { status: "major_issue", label: "Major Issue" },
  { status: "breach", label: "Breach" },
  { status: "not_checked", label: "Not Checked" },
];

export const ALARM_STATUSES: { status: AlarmStatus; label: string }[] = [
  { status: "operational", label: "Operational" },
  { status: "fault_detected", label: "Fault Detected" },
  { status: "disabled", label: "Disabled" },
  { status: "not_installed", label: "Not Installed" },
  { status: "not_tested", label: "Not Tested" },
];

export const KEY_MANAGEMENT_STATUSES: { status: KeyManagement; label: string }[] = [
  { status: "all_accounted", label: "All Accounted" },
  { status: "key_missing", label: "Key Missing" },
  { status: "key_replaced", label: "Key Replaced" },
  { status: "audit_due", label: "Audit Due" },
  { status: "not_checked", label: "Not Checked" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeSecurityMetrics(
  records: SecurityRecord[],
): {
  total_records: number;
  routine_check_count: number;
  security_incident_count: number;
  secure_rate: number | null;
  breach_count: number;
  major_issue_count: number;
  alarm_operational_rate: number | null;
  alarm_fault_count: number;
  keys_accounted_rate: number | null;
  key_missing_count: number;
  doors_secure_rate: number | null;
  windows_secure_rate: number | null;
  lighting_working_rate: number | null;
  perimeter_secure_rate: number | null;
  children_accounted_rate: number | null;
  check_overdue_count: number;
  by_event_type: Record<string, number>;
  by_security_status: Record<string, number>;
  by_alarm_status: Record<string, number>;
  by_key_management: Record<string, number>;
} {
  const routineCheck = records.filter((r) => r.event_type === "routine_check").length;
  const incident = records.filter((r) => r.event_type === "security_incident").length;

  const secure = records.filter((r) => r.security_status === "secure").length;
  const secureRate =
    records.length > 0
      ? Math.round((secure / records.length) * 1000) / 10
      : null;

  const breach = records.filter((r) => r.security_status === "breach").length;
  const majorIssue = records.filter((r) => r.security_status === "major_issue").length;

  const alarmOp = records.filter((r) => r.alarm_status === "operational").length;
  const alarmRate =
    records.length > 0
      ? Math.round((alarmOp / records.length) * 1000) / 10
      : null;

  const alarmFault = records.filter((r) => r.alarm_status === "fault_detected").length;

  const keysOk = records.filter((r) => r.key_management === "all_accounted").length;
  const keysRate =
    records.length > 0
      ? Math.round((keysOk / records.length) * 1000) / 10
      : null;

  const keyMissing = records.filter((r) => r.key_management === "key_missing").length;

  const doorsSec = records.filter((r) => r.all_doors_secure).length;
  const doorsRate =
    records.length > 0
      ? Math.round((doorsSec / records.length) * 1000) / 10
      : null;

  const windowsSec = records.filter((r) => r.all_windows_secure).length;
  const windowsRate =
    records.length > 0
      ? Math.round((windowsSec / records.length) * 1000) / 10
      : null;

  const lightingOk = records.filter((r) => r.external_lighting_working).length;
  const lightingRate =
    records.length > 0
      ? Math.round((lightingOk / records.length) * 1000) / 10
      : null;

  const perimeterOk = records.filter((r) => r.perimeter_secure).length;
  const perimeterRate =
    records.length > 0
      ? Math.round((perimeterOk / records.length) * 1000) / 10
      : null;

  const childrenOk = records.filter((r) => r.children_accounted_for).length;
  const childrenRate =
    records.length > 0
      ? Math.round((childrenOk / records.length) * 1000) / 10
      : null;

  const now = new Date();
  const checkOverdue = records.filter((r) => {
    if (!r.next_check_date) return false;
    return new Date(r.next_check_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.security_status] = (byStatus[r.security_status] ?? 0) + 1;

  const byAlarm: Record<string, number> = {};
  for (const r of records) byAlarm[r.alarm_status] = (byAlarm[r.alarm_status] ?? 0) + 1;

  const byKey: Record<string, number> = {};
  for (const r of records) byKey[r.key_management] = (byKey[r.key_management] ?? 0) + 1;

  return {
    total_records: records.length,
    routine_check_count: routineCheck,
    security_incident_count: incident,
    secure_rate: secureRate,
    breach_count: breach,
    major_issue_count: majorIssue,
    alarm_operational_rate: alarmRate,
    alarm_fault_count: alarmFault,
    keys_accounted_rate: keysRate,
    key_missing_count: keyMissing,
    doors_secure_rate: doorsRate,
    windows_secure_rate: windowsRate,
    lighting_working_rate: lightingRate,
    perimeter_secure_rate: perimeterRate,
    children_accounted_rate: childrenRate,
    check_overdue_count: checkOverdue,
    by_event_type: byType,
    by_security_status: byStatus,
    by_alarm_status: byAlarm,
    by_key_management: byKey,
  };
}

export function identifySecurityAlerts(
  records: SecurityRecord[],
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

  // Security breach
  for (const r of records) {
    if (r.security_status === "breach") {
      alerts.push({
        type: "security_breach",
        severity: "critical",
        message: `Security breach on ${r.event_date} — investigate immediately and ensure children are safe`,
        id: r.id,
      });
    }
  }

  // Children not accounted for
  for (const r of records) {
    if (!r.children_accounted_for) {
      alerts.push({
        type: "children_not_accounted",
        severity: "critical",
        message: `Children not accounted for during security check on ${r.event_date} — verify immediately`,
        id: r.id,
      });
    }
  }

  // Key missing
  const keyMissing = records.filter((r) => r.key_management === "key_missing").length;
  if (keyMissing >= 1) {
    alerts.push({
      type: "key_missing",
      severity: "high",
      message: `${keyMissing} missing ${keyMissing === 1 ? "key" : "keys"} identified — replace locks if necessary`,
      id: "key_missing",
    });
  }

  // Alarm fault
  const alarmFault = records.filter((r) => r.alarm_status === "fault_detected").length;
  if (alarmFault >= 1) {
    alerts.push({
      type: "alarm_fault",
      severity: "high",
      message: `${alarmFault} alarm ${alarmFault === 1 ? "fault" : "faults"} detected — arrange repair`,
      id: "alarm_fault",
    });
  }

  // Check overdue
  const now = new Date();
  const checkOverdue = records.filter((r) => {
    if (!r.next_check_date) return false;
    return new Date(r.next_check_date) < now;
  }).length;
  if (checkOverdue >= 1) {
    alerts.push({
      type: "check_overdue",
      severity: "medium",
      message: `${checkOverdue} security ${checkOverdue === 1 ? "check is" : "checks are"} overdue — schedule promptly`,
      id: "check_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    eventType?: SecurityEventType;
    securityStatus?: SecurityStatus;
    alarmStatus?: AlarmStatus;
    limit?: number;
  },
): Promise<ServiceResult<SecurityRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_building_security") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.securityStatus) q = q.eq("security_status", filters.securityStatus);
  if (filters?.alarmStatus) q = q.eq("alarm_status", filters.alarmStatus);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    eventType: SecurityEventType;
    eventDate: string;
    securityStatus: SecurityStatus;
    alarmStatus: AlarmStatus;
    keyManagement: KeyManagement;
    allDoorsSecure: boolean;
    allWindowsSecure: boolean;
    externalLightingWorking: boolean;
    perimeterSecure: boolean;
    visitorsLogChecked: boolean;
    childrenAccountedFor: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    checkedBy: string;
    nextCheckDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<SecurityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_building_security") as SB)
    .insert({
      home_id: input.homeId,
      event_type: input.eventType,
      event_date: input.eventDate,
      security_status: input.securityStatus,
      alarm_status: input.alarmStatus,
      key_management: input.keyManagement,
      all_doors_secure: input.allDoorsSecure,
      all_windows_secure: input.allWindowsSecure,
      external_lighting_working: input.externalLightingWorking,
      perimeter_secure: input.perimeterSecure,
      visitors_log_checked: input.visitorsLogChecked,
      children_accounted_for: input.childrenAccountedFor,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      checked_by: input.checkedBy,
      next_check_date: input.nextCheckDate ?? null,
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
): Promise<ServiceResult<SecurityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_building_security") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSecurityMetrics,
  identifySecurityAlerts,
};
