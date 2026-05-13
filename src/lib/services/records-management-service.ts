// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDS MANAGEMENT SERVICE
// Manages children's case records, record retention, access requests,
// data protection compliance, and archival processes.
// CHR 2015 Reg 39 (records — maintenance and availability),
// Reg 40 (retention and destruction), Reg 36 (notification),
// Data Protection Act 2018, UK GDPR.
//
// Tracks record completeness, access requests (Subject Access Requests),
// retention schedules, data quality audits, and ensures children's records
// are accurate, up-to-date, and securely maintained.
//
// SCCIF: Well-Led — "Records are clear, up to date, and stored securely."
// "Case records accurately reflect children's day-to-day experiences."
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

export type RecordCategory =
  | "placement_plan"
  | "care_plan"
  | "risk_assessment"
  | "health_record"
  | "education_record"
  | "contact_record"
  | "safeguarding"
  | "incident_record"
  | "daily_record"
  | "key_work_session"
  | "medication_record"
  | "financial_record"
  | "correspondence"
  | "legal_document"
  | "other";

export type RecordStatus =
  | "active"
  | "archived"
  | "pending_review"
  | "pending_destruction"
  | "destroyed";

export type AccessRequestStatus =
  | "received"
  | "acknowledged"
  | "in_progress"
  | "redacting"
  | "completed"
  | "refused";

export type RetentionPeriod =
  | "until_25th_birthday"
  | "until_75th_birthday"
  | "35_years_from_closure"
  | "75_years_from_closure"
  | "permanent"
  | "7_years"
  | "3_years"
  | "other";

export type DataQualityRating =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "not_assessed";

export interface RecordAudit {
  id: string;
  home_id: string;
  audit_date: string;
  audited_by: string;
  child_id: string;
  child_name: string;
  records_reviewed: number;
  records_complete: number;
  records_incomplete: number;
  missing_records: string[];
  data_quality_rating: DataQualityRating;
  chronology_up_to_date: boolean;
  sensitive_data_secure: boolean;
  third_party_data_redacted: boolean;
  findings: string | null;
  actions_required: string | null;
  next_audit_date: string | null;
  created_at: string;
}

export interface AccessRequest {
  id: string;
  home_id: string;
  request_date: string;
  requester_name: string;
  requester_relationship: string;
  child_id: string;
  child_name: string;
  request_type: "subject_access" | "third_party" | "court_order" | "ofsted" | "social_worker";
  status: AccessRequestStatus;
  records_requested: string;
  date_acknowledged: string | null;
  date_due: string | null;
  date_completed: string | null;
  redaction_required: boolean;
  redaction_notes: string | null;
  outcome: string | null;
  handled_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RECORD_CATEGORIES: { category: RecordCategory; label: string }[] = [
  { category: "placement_plan", label: "Placement Plan" },
  { category: "care_plan", label: "Care Plan" },
  { category: "risk_assessment", label: "Risk Assessment" },
  { category: "health_record", label: "Health Record" },
  { category: "education_record", label: "Education Record" },
  { category: "contact_record", label: "Contact Record" },
  { category: "safeguarding", label: "Safeguarding" },
  { category: "incident_record", label: "Incident Record" },
  { category: "daily_record", label: "Daily Record" },
  { category: "key_work_session", label: "Key Work Session" },
  { category: "medication_record", label: "Medication Record" },
  { category: "financial_record", label: "Financial Record" },
  { category: "correspondence", label: "Correspondence" },
  { category: "legal_document", label: "Legal Document" },
  { category: "other", label: "Other" },
];

export const RECORD_STATUSES: { status: RecordStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "archived", label: "Archived" },
  { status: "pending_review", label: "Pending Review" },
  { status: "pending_destruction", label: "Pending Destruction" },
  { status: "destroyed", label: "Destroyed" },
];

export const ACCESS_REQUEST_STATUSES: { status: AccessRequestStatus; label: string }[] = [
  { status: "received", label: "Received" },
  { status: "acknowledged", label: "Acknowledged" },
  { status: "in_progress", label: "In Progress" },
  { status: "redacting", label: "Redacting" },
  { status: "completed", label: "Completed" },
  { status: "refused", label: "Refused" },
];

export const RETENTION_PERIODS: { period: RetentionPeriod; label: string }[] = [
  { period: "until_25th_birthday", label: "Until 25th Birthday" },
  { period: "until_75th_birthday", label: "Until 75th Birthday" },
  { period: "35_years_from_closure", label: "35 Years from Closure" },
  { period: "75_years_from_closure", label: "75 Years from Closure" },
  { period: "permanent", label: "Permanent" },
  { period: "7_years", label: "7 Years" },
  { period: "3_years", label: "3 Years" },
  { period: "other", label: "Other" },
];

export const DATA_QUALITY_RATINGS: { rating: DataQualityRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "adequate", label: "Adequate" },
  { rating: "poor", label: "Poor" },
  { rating: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute records management metrics.
 */
export function computeRecordsMetrics(
  audits: RecordAudit[],
  accessRequests: AccessRequest[],
  totalChildren: number,
): {
  children_audited: number;
  avg_completeness_rate: number;
  avg_data_quality: number;
  children_with_poor_quality: number;
  total_access_requests: number;
  open_access_requests: number;
  avg_response_days: number;
  overdue_access_requests: number;
  overdue_audits: number;
  by_quality_rating: Record<string, number>;
  by_request_type: Record<string, number>;
  chronology_compliance: number;
} {
  const now = new Date();

  // Children audited (unique)
  const auditedChildren = new Set(audits.map((a) => a.child_id));

  // Average completeness
  let totalComplete = 0;
  let totalReviewed = 0;
  for (const a of audits) {
    totalComplete += a.records_complete;
    totalReviewed += a.records_reviewed;
  }
  const avgCompleteness =
    totalReviewed > 0
      ? Math.round((totalComplete / totalReviewed) * 1000) / 10
      : 0;

  // Quality rating score (excellent=5, good=4, adequate=3, poor=2, not_assessed=0)
  const qualityScores: Record<string, number> = {
    excellent: 5,
    good: 4,
    adequate: 3,
    poor: 2,
    not_assessed: 0,
  };
  let totalQuality = 0;
  let assessedCount = 0;
  const byQualityRating: Record<string, number> = {};
  let poorCount = 0;

  for (const a of audits) {
    byQualityRating[a.data_quality_rating] =
      (byQualityRating[a.data_quality_rating] ?? 0) + 1;
    if (a.data_quality_rating !== "not_assessed") {
      totalQuality += qualityScores[a.data_quality_rating] ?? 0;
      assessedCount++;
    }
    if (a.data_quality_rating === "poor") poorCount++;
  }
  const avgDataQuality =
    assessedCount > 0
      ? Math.round((totalQuality / assessedCount) * 10) / 10
      : 0;

  // Access requests
  const openStatuses = new Set(["received", "acknowledged", "in_progress", "redacting"]);
  let openRequests = 0;
  let overdueRequests = 0;
  let totalResponseDays = 0;
  let completedResponses = 0;
  const byRequestType: Record<string, number> = {};

  for (const r of accessRequests) {
    byRequestType[r.request_type] = (byRequestType[r.request_type] ?? 0) + 1;

    if (openStatuses.has(r.status)) {
      openRequests++;
      if (r.date_due && new Date(r.date_due) < now) {
        overdueRequests++;
      }
    }

    if (r.date_completed && r.request_date) {
      const days = Math.round(
        (new Date(r.date_completed).getTime() - new Date(r.request_date).getTime()) / 86400000,
      );
      totalResponseDays += days;
      completedResponses++;
    }
  }
  const avgResponseDays =
    completedResponses > 0
      ? Math.round(totalResponseDays / completedResponses)
      : 0;

  // Overdue audits
  let overdueAudits = 0;
  for (const a of audits) {
    if (a.next_audit_date && new Date(a.next_audit_date) < now) {
      overdueAudits++;
    }
  }

  // Chronology compliance
  let chronologyCount = 0;
  for (const a of audits) {
    if (a.chronology_up_to_date) chronologyCount++;
  }
  const chronologyCompliance =
    audits.length > 0
      ? Math.round((chronologyCount / audits.length) * 1000) / 10
      : 0;

  return {
    children_audited: auditedChildren.size,
    avg_completeness_rate: avgCompleteness,
    avg_data_quality: avgDataQuality,
    children_with_poor_quality: poorCount,
    total_access_requests: accessRequests.length,
    open_access_requests: openRequests,
    avg_response_days: avgResponseDays,
    overdue_access_requests: overdueRequests,
    overdue_audits: overdueAudits,
    by_quality_rating: byQualityRating,
    by_request_type: byRequestType,
    chronology_compliance: chronologyCompliance,
  };
}

/**
 * Identify records management alerts.
 */
export function identifyRecordsAlerts(
  audits: RecordAudit[],
  accessRequests: AccessRequest[],
  totalChildren: number,
  now: Date = new Date(),
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

  // ── Audit alerts ────────────────────────────────────────────────────

  for (const a of audits) {
    // Poor data quality
    if (a.data_quality_rating === "poor") {
      alerts.push({
        type: "poor_data_quality",
        severity: "high",
        message: `${a.child_name}'s records rated 'poor' quality — Reg 39 requires accurate and up-to-date records`,
        id: a.id,
      });
    }

    // Incomplete records
    if (a.records_reviewed > 0 && a.records_incomplete > 0) {
      const rate = Math.round(
        (a.records_incomplete / a.records_reviewed) * 100,
      );
      if (rate > 20) {
        alerts.push({
          type: "high_incompleteness",
          severity: "high",
          message: `${a.child_name}'s records: ${rate}% incomplete (${a.records_incomplete}/${a.records_reviewed}) — review and complete`,
          id: a.id,
        });
      }
    }

    // Chronology not up to date
    if (!a.chronology_up_to_date) {
      alerts.push({
        type: "chronology_outdated",
        severity: "medium",
        message: `${a.child_name}'s chronology is not up to date — essential for placement planning and reviews`,
        id: a.id,
      });
    }

    // Sensitive data not secure
    if (!a.sensitive_data_secure) {
      alerts.push({
        type: "sensitive_data_insecure",
        severity: "critical",
        message: `${a.child_name}'s records — sensitive data not securely stored. Data Protection Act breach risk`,
        id: a.id,
      });
    }

    // Overdue next audit
    if (a.next_audit_date && new Date(a.next_audit_date) < now) {
      alerts.push({
        type: "audit_overdue",
        severity: "medium",
        message: `Records audit for ${a.child_name} is overdue — next audit was due ${a.next_audit_date}`,
        id: a.id,
      });
    }
  }

  // ── Access request alerts ───────────────────────────────────────────

  for (const r of accessRequests) {
    // Overdue SAR
    if (r.date_due && new Date(r.date_due) < now && r.status !== "completed" && r.status !== "refused") {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(r.date_due).getTime()) / 86400000,
      );
      alerts.push({
        type: "access_request_overdue",
        severity: daysOverdue > 30 ? "critical" : "high",
        message: `Subject access request from ${r.requester_name} for ${r.child_name} is ${daysOverdue} days overdue — legal deadline breach`,
        id: r.id,
      });
    }

    // Not acknowledged within 2 days
    if (r.status === "received" && !r.date_acknowledged) {
      const daysSince = Math.round(
        (now.getTime() - new Date(r.request_date).getTime()) / 86400000,
      );
      if (daysSince > 2) {
        alerts.push({
          type: "access_request_not_acknowledged",
          severity: "medium",
          message: `Access request from ${r.requester_name} has not been acknowledged after ${daysSince} days`,
          id: r.id,
        });
      }
    }
  }

  // ── Children without audits ─────────────────────────────────────────

  const auditedChildren = new Set(audits.map((a) => a.child_id));
  if (totalChildren > 0 && auditedChildren.size < totalChildren) {
    const missing = totalChildren - auditedChildren.size;
    alerts.push({
      type: "children_not_audited",
      severity: "medium",
      message: `${missing} child(ren) have not had a records audit — ensure all records are reviewed regularly`,
      id: audits.length > 0 ? audits[0].id : "system",
    });
  }

  return alerts;
}

// ── CRUD — Record Audits ────────────────────────────────────────────────

export async function listAudits(
  homeId: string,
  filters?: {
    childId?: string;
    qualityRating?: DataQualityRating;
    limit?: number;
  },
): Promise<ServiceResult<RecordAudit[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_record_audits") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.qualityRating) q = q.eq("data_quality_rating", filters.qualityRating);
  q = q.order("audit_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAudit(
  input: {
    homeId: string;
    auditDate: string;
    auditedBy: string;
    childId: string;
    childName: string;
    recordsReviewed: number;
    recordsComplete: number;
    recordsIncomplete?: number;
    missingRecords?: string[];
    dataQualityRating?: DataQualityRating;
    chronologyUpToDate?: boolean;
    sensitiveDataSecure?: boolean;
    thirdPartyDataRedacted?: boolean;
    findings?: string;
    actionsRequired?: string;
    nextAuditDate?: string;
  },
): Promise<ServiceResult<RecordAudit>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_record_audits") as SB)
    .insert({
      home_id: input.homeId,
      audit_date: input.auditDate,
      audited_by: input.auditedBy,
      child_id: input.childId,
      child_name: input.childName,
      records_reviewed: input.recordsReviewed,
      records_complete: input.recordsComplete,
      records_incomplete: input.recordsIncomplete ?? 0,
      missing_records: input.missingRecords ?? [],
      data_quality_rating: input.dataQualityRating ?? "not_assessed",
      chronology_up_to_date: input.chronologyUpToDate ?? true,
      sensitive_data_secure: input.sensitiveDataSecure ?? true,
      third_party_data_redacted: input.thirdPartyDataRedacted ?? true,
      findings: input.findings ?? null,
      actions_required: input.actionsRequired ?? null,
      next_audit_date: input.nextAuditDate ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Access Requests ──────────────────────────────────────────────

export async function listAccessRequests(
  homeId: string,
  filters?: {
    childId?: string;
    status?: AccessRequestStatus;
    limit?: number;
  },
): Promise<ServiceResult<AccessRequest[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_access_requests") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("request_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAccessRequest(
  input: {
    homeId: string;
    requestDate: string;
    requesterName: string;
    requesterRelationship: string;
    childId: string;
    childName: string;
    requestType: "subject_access" | "third_party" | "court_order" | "ofsted" | "social_worker";
    recordsRequested: string;
    dateDue?: string;
    redactionRequired?: boolean;
    handledBy: string;
    notes?: string;
  },
): Promise<ServiceResult<AccessRequest>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_access_requests") as SB)
    .insert({
      home_id: input.homeId,
      request_date: input.requestDate,
      requester_name: input.requesterName,
      requester_relationship: input.requesterRelationship,
      child_id: input.childId,
      child_name: input.childName,
      request_type: input.requestType,
      status: "received",
      records_requested: input.recordsRequested,
      date_acknowledged: null,
      date_due: input.dateDue ?? null,
      date_completed: null,
      redaction_required: input.redactionRequired ?? false,
      redaction_notes: null,
      outcome: null,
      handled_by: input.handledBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAccessRequest(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<AccessRequest>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_access_requests") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeRecordsMetrics,
  identifyRecordsAlerts,
};
