// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SECURE STORAGE & RECORDS ACCESS SERVICE
// Tracks secure record storage, access logs, data retention,
// GDPR compliance, and information governance.
// CHR 2015 Reg 39 (records — secure storage and access),
// Reg 40 (notifications — record-keeping requirements),
// GDPR / UK DPA 2018 (data protection obligations).
//
// Covers: storage audits, access logs, retention schedules,
// subject access requests, data breaches, and GDPR compliance.
//
// SCCIF: Leadership & Management — "Records are stored securely
// and information governance is robust."
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

export type RecordEventType =
  | "storage_audit"
  | "access_log"
  | "retention_review"
  | "subject_access_request"
  | "data_breach"
  | "destruction"
  | "transfer"
  | "backup_check"
  | "other";

export type StorageLocation =
  | "locked_cabinet"
  | "secure_room"
  | "encrypted_digital"
  | "cloud_storage"
  | "offsite_storage"
  | "other";

export type ComplianceRating =
  | "fully_compliant"
  | "mostly_compliant"
  | "partially_compliant"
  | "non_compliant";

export type AccessDecision =
  | "granted"
  | "denied"
  | "partial"
  | "referred"
  | "not_applicable";

export interface SecureStorageRecord {
  id: string;
  home_id: string;
  event_type: RecordEventType;
  event_date: string;
  storage_location: StorageLocation;
  compliance_rating: ComplianceRating;
  access_decision: AccessDecision;
  requested_by: string | null;
  authorised_by: string;
  records_affected: number;
  gdpr_compliant: boolean;
  encryption_verified: boolean;
  retention_schedule_followed: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RECORD_EVENT_TYPES: { type: RecordEventType; label: string }[] = [
  { type: "storage_audit", label: "Storage Audit" },
  { type: "access_log", label: "Access Log" },
  { type: "retention_review", label: "Retention Review" },
  { type: "subject_access_request", label: "Subject Access Request" },
  { type: "data_breach", label: "Data Breach" },
  { type: "destruction", label: "Destruction" },
  { type: "transfer", label: "Transfer" },
  { type: "backup_check", label: "Backup Check" },
  { type: "other", label: "Other" },
];

export const STORAGE_LOCATIONS: { location: StorageLocation; label: string }[] = [
  { location: "locked_cabinet", label: "Locked Cabinet" },
  { location: "secure_room", label: "Secure Room" },
  { location: "encrypted_digital", label: "Encrypted Digital" },
  { location: "cloud_storage", label: "Cloud Storage" },
  { location: "offsite_storage", label: "Offsite Storage" },
  { location: "other", label: "Other" },
];

export const COMPLIANCE_RATINGS: { rating: ComplianceRating; label: string }[] = [
  { rating: "fully_compliant", label: "Fully Compliant" },
  { rating: "mostly_compliant", label: "Mostly Compliant" },
  { rating: "partially_compliant", label: "Partially Compliant" },
  { rating: "non_compliant", label: "Non-Compliant" },
];

export const ACCESS_DECISIONS: { decision: AccessDecision; label: string }[] = [
  { decision: "granted", label: "Granted" },
  { decision: "denied", label: "Denied" },
  { decision: "partial", label: "Partial" },
  { decision: "referred", label: "Referred" },
  { decision: "not_applicable", label: "Not Applicable" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeSecureStorageMetrics(
  records: SecureStorageRecord[],
): {
  total_events: number;
  storage_audits: number;
  access_logs: number;
  subject_access_requests: number;
  data_breaches: number;
  fully_compliant_rate: number;
  non_compliant_count: number;
  gdpr_compliant_rate: number;
  encryption_verified_rate: number;
  retention_followed_rate: number;
  access_granted_count: number;
  access_denied_count: number;
  total_records_affected: number;
  review_overdue_count: number;
  by_event_type: Record<string, number>;
  by_storage_location: Record<string, number>;
  by_compliance_rating: Record<string, number>;
  by_access_decision: Record<string, number>;
} {
  const audits = records.filter((r) => r.event_type === "storage_audit").length;
  const accessLogs = records.filter((r) => r.event_type === "access_log").length;
  const sars = records.filter((r) => r.event_type === "subject_access_request").length;
  const breaches = records.filter((r) => r.event_type === "data_breach").length;

  const fullyCompliant = records.filter((r) => r.compliance_rating === "fully_compliant").length;
  const fcRate =
    records.length > 0
      ? Math.round((fullyCompliant / records.length) * 1000) / 10
      : 0;

  const nonCompliant = records.filter((r) => r.compliance_rating === "non_compliant").length;

  const gdprCompliant = records.filter((r) => r.gdpr_compliant).length;
  const gdprRate =
    records.length > 0
      ? Math.round((gdprCompliant / records.length) * 1000) / 10
      : 0;

  const encryptionVerified = records.filter((r) => r.encryption_verified).length;
  const encRate =
    records.length > 0
      ? Math.round((encryptionVerified / records.length) * 1000) / 10
      : 0;

  const retentionFollowed = records.filter((r) => r.retention_schedule_followed).length;
  const retRate =
    records.length > 0
      ? Math.round((retentionFollowed / records.length) * 1000) / 10
      : 0;

  const granted = records.filter((r) => r.access_decision === "granted").length;
  const denied = records.filter((r) => r.access_decision === "denied").length;

  const totalAffected = records.reduce((sum, r) => sum + r.records_affected, 0);

  const now = new Date();
  const reviewOverdue = records.filter(
    (r) => r.next_review_date && new Date(r.next_review_date) < now,
  ).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;

  const byLocation: Record<string, number> = {};
  for (const r of records) byLocation[r.storage_location] = (byLocation[r.storage_location] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_rating] = (byCompliance[r.compliance_rating] ?? 0) + 1;

  const byDecision: Record<string, number> = {};
  for (const r of records) byDecision[r.access_decision] = (byDecision[r.access_decision] ?? 0) + 1;

  return {
    total_events: records.length,
    storage_audits: audits,
    access_logs: accessLogs,
    subject_access_requests: sars,
    data_breaches: breaches,
    fully_compliant_rate: fcRate,
    non_compliant_count: nonCompliant,
    gdpr_compliant_rate: gdprRate,
    encryption_verified_rate: encRate,
    retention_followed_rate: retRate,
    access_granted_count: granted,
    access_denied_count: denied,
    total_records_affected: totalAffected,
    review_overdue_count: reviewOverdue,
    by_event_type: byType,
    by_storage_location: byLocation,
    by_compliance_rating: byCompliance,
    by_access_decision: byDecision,
  };
}

export function identifySecureStorageAlerts(
  records: SecureStorageRecord[],
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

  // Data breach
  for (const r of records) {
    if (r.event_type === "data_breach") {
      alerts.push({
        type: "data_breach",
        severity: "critical",
        message: `Data breach recorded on ${r.event_date} affecting ${r.records_affected} ${r.records_affected === 1 ? "record" : "records"} — ensure ICO notification and remediation`,
        id: r.id,
      });
    }
  }

  // Non-compliant finding
  for (const r of records) {
    if (r.compliance_rating === "non_compliant") {
      alerts.push({
        type: "non_compliant",
        severity: "high",
        message: `Non-compliant records storage finding on ${r.event_date} (${r.event_type.replace(/_/g, " ")}) — address immediately per Reg 39`,
        id: r.id,
      });
    }
  }

  // GDPR non-compliance
  const gdprNon = records.filter((r) => !r.gdpr_compliant).length;
  if (gdprNon >= 2) {
    alerts.push({
      type: "gdpr_non_compliant",
      severity: "high",
      message: `${gdprNon} records events not GDPR compliant — review data protection practices`,
      id: "gdpr_non_compliant",
    });
  }

  // Encryption not verified
  const noEncryption = records.filter(
    (r) => !r.encryption_verified && (r.storage_location === "encrypted_digital" || r.storage_location === "cloud_storage"),
  ).length;
  if (noEncryption >= 1) {
    alerts.push({
      type: "encryption_not_verified",
      severity: "medium",
      message: `${noEncryption} digital/cloud storage ${noEncryption === 1 ? "record has" : "records have"} unverified encryption — verify encryption status`,
      id: "encryption_not_verified",
    });
  }

  // Review overdue
  const now = new Date();
  const reviewOverdue = records.filter(
    (r) => r.next_review_date && new Date(r.next_review_date) < now,
  ).length;
  if (reviewOverdue >= 1) {
    alerts.push({
      type: "review_overdue",
      severity: "medium",
      message: `${reviewOverdue} records storage ${reviewOverdue === 1 ? "review is" : "reviews are"} overdue — schedule review`,
      id: "review_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    eventType?: RecordEventType;
    complianceRating?: ComplianceRating;
    limit?: number;
  },
): Promise<ServiceResult<SecureStorageRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_secure_storage") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.complianceRating) q = q.eq("compliance_rating", filters.complianceRating);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    eventType: RecordEventType;
    eventDate: string;
    storageLocation: StorageLocation;
    complianceRating: ComplianceRating;
    accessDecision: AccessDecision;
    requestedBy?: string;
    authorisedBy: string;
    recordsAffected: number;
    gdprCompliant: boolean;
    encryptionVerified: boolean;
    retentionScheduleFollowed: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<SecureStorageRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_secure_storage") as SB)
    .insert({
      home_id: input.homeId,
      event_type: input.eventType,
      event_date: input.eventDate,
      storage_location: input.storageLocation,
      compliance_rating: input.complianceRating,
      access_decision: input.accessDecision,
      requested_by: input.requestedBy ?? null,
      authorised_by: input.authorisedBy,
      records_affected: input.recordsAffected,
      gdpr_compliant: input.gdprCompliant,
      encryption_verified: input.encryptionVerified,
      retention_schedule_followed: input.retentionScheduleFollowed,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      next_review_date: input.nextReviewDate ?? null,
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
): Promise<ServiceResult<SecureStorageRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_secure_storage") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSecureStorageMetrics,
  identifySecureStorageAlerts,
};
