// ══════════════════════════════════════════════════════════════════════════════
// CARA — DATA PROTECTION SERVICE
// Tracks GDPR compliance, subject access requests, data retention reviews,
// privacy impact assessments, and data breach reporting.
// CHR 2015 Reg 37 (privacy and confidentiality),
// UK GDPR / Data Protection Act 2018,
// ICO guidance on children's data.
//
// Covers: DSARs, data breach notifications, retention schedules,
// privacy impact assessments, consent records, and data audits.
//
// SCCIF: Leadership — "Data is handled lawfully and securely."
// "Children's information is protected and shared appropriately."
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

export type DataEventType =
  | "dsar_received"
  | "dsar_completed"
  | "data_breach"
  | "privacy_impact_assessment"
  | "retention_review"
  | "consent_review"
  | "data_audit"
  | "ico_notification"
  | "training_completed"
  | "other";

export type ComplianceStatus =
  | "compliant"
  | "partially_compliant"
  | "non_compliant"
  | "under_review"
  | "not_assessed";

export type BreachSeverity =
  | "high"
  | "medium"
  | "low"
  | "not_applicable";

export type ResponseTimeliness =
  | "within_deadline"
  | "near_deadline"
  | "overdue"
  | "significantly_overdue"
  | "not_applicable";

export interface DataProtectionRecord {
  id: string;
  home_id: string;
  event_type: DataEventType;
  event_date: string;
  compliance_status: ComplianceStatus;
  breach_severity: BreachSeverity;
  response_timeliness: ResponseTimeliness;
  requester_name: string | null;
  child_involved: boolean;
  staff_involved: boolean;
  ico_notified: boolean;
  dpo_consulted: boolean;
  deadline_date: string | null;
  completed_date: string | null;
  data_categories_affected: string[];
  remedial_actions: string[];
  issues_found: string[];
  actions_taken: string[];
  handled_by: string;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DATA_EVENT_TYPES: { type: DataEventType; label: string }[] = [
  { type: "dsar_received", label: "DSAR Received" },
  { type: "dsar_completed", label: "DSAR Completed" },
  { type: "data_breach", label: "Data Breach" },
  { type: "privacy_impact_assessment", label: "Privacy Impact Assessment" },
  { type: "retention_review", label: "Retention Review" },
  { type: "consent_review", label: "Consent Review" },
  { type: "data_audit", label: "Data Audit" },
  { type: "ico_notification", label: "ICO Notification" },
  { type: "training_completed", label: "Training Completed" },
  { type: "other", label: "Other" },
];

export const COMPLIANCE_STATUSES: { status: ComplianceStatus; label: string }[] = [
  { status: "compliant", label: "Compliant" },
  { status: "partially_compliant", label: "Partially Compliant" },
  { status: "non_compliant", label: "Non-Compliant" },
  { status: "under_review", label: "Under Review" },
  { status: "not_assessed", label: "Not Assessed" },
];

export const BREACH_SEVERITIES: { severity: BreachSeverity; label: string }[] = [
  { severity: "high", label: "High" },
  { severity: "medium", label: "Medium" },
  { severity: "low", label: "Low" },
  { severity: "not_applicable", label: "Not Applicable" },
];

export const RESPONSE_TIMELINESS_OPTIONS: { timeliness: ResponseTimeliness; label: string }[] = [
  { timeliness: "within_deadline", label: "Within Deadline" },
  { timeliness: "near_deadline", label: "Near Deadline" },
  { timeliness: "overdue", label: "Overdue" },
  { timeliness: "significantly_overdue", label: "Significantly Overdue" },
  { timeliness: "not_applicable", label: "Not Applicable" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeDataProtectionMetrics(
  records: DataProtectionRecord[],
): {
  total_events: number;
  dsar_received_count: number;
  dsar_completed_count: number;
  data_breach_count: number;
  privacy_impact_count: number;
  retention_review_count: number;
  compliant_rate: number | null;
  non_compliant_count: number;
  under_review_count: number;
  high_breach_count: number;
  medium_breach_count: number;
  within_deadline_rate: number | null;
  overdue_count: number;
  significantly_overdue_count: number;
  ico_notified_count: number;
  dpo_consulted_rate: number | null;
  child_involved_count: number;
  staff_involved_count: number;
  deadline_overdue_count: number;
  by_event_type: Record<string, number>;
  by_compliance_status: Record<string, number>;
  by_breach_severity: Record<string, number>;
  by_response_timeliness: Record<string, number>;
} {
  const dsarReceived = records.filter((r) => r.event_type === "dsar_received").length;
  const dsarCompleted = records.filter((r) => r.event_type === "dsar_completed").length;
  const dataBreach = records.filter((r) => r.event_type === "data_breach").length;
  const privacyImpact = records.filter((r) => r.event_type === "privacy_impact_assessment").length;
  const retentionReview = records.filter((r) => r.event_type === "retention_review").length;

  const compliant = records.filter((r) => r.compliance_status === "compliant").length;
  const compliantRate =
    records.length > 0
      ? Math.round((compliant / records.length) * 1000) / 10
      : null;

  const nonCompliant = records.filter((r) => r.compliance_status === "non_compliant").length;
  const underReview = records.filter((r) => r.compliance_status === "under_review").length;

  const highBreach = records.filter((r) => r.breach_severity === "high").length;
  const mediumBreach = records.filter((r) => r.breach_severity === "medium").length;

  const withinDeadline = records.filter((r) => r.response_timeliness === "within_deadline").length;
  const withinRate =
    records.length > 0
      ? Math.round((withinDeadline / records.length) * 1000) / 10
      : null;

  const overdue = records.filter((r) => r.response_timeliness === "overdue").length;
  const sigOverdue = records.filter((r) => r.response_timeliness === "significantly_overdue").length;

  const icoNotified = records.filter((r) => r.ico_notified).length;

  const dpoConsulted = records.filter((r) => r.dpo_consulted).length;
  const dpoRate =
    records.length > 0
      ? Math.round((dpoConsulted / records.length) * 1000) / 10
      : null;

  const childInvolved = records.filter((r) => r.child_involved).length;
  const staffInvolved = records.filter((r) => r.staff_involved).length;

  const now = new Date();
  const deadlineOverdue = records.filter((r) => {
    if (!r.deadline_date || r.completed_date) return false;
    return new Date(r.deadline_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_status] = (byCompliance[r.compliance_status] ?? 0) + 1;

  const byBreach: Record<string, number> = {};
  for (const r of records) byBreach[r.breach_severity] = (byBreach[r.breach_severity] ?? 0) + 1;

  const byTimeliness: Record<string, number> = {};
  for (const r of records) byTimeliness[r.response_timeliness] = (byTimeliness[r.response_timeliness] ?? 0) + 1;

  return {
    total_events: records.length,
    dsar_received_count: dsarReceived,
    dsar_completed_count: dsarCompleted,
    data_breach_count: dataBreach,
    privacy_impact_count: privacyImpact,
    retention_review_count: retentionReview,
    compliant_rate: compliantRate,
    non_compliant_count: nonCompliant,
    under_review_count: underReview,
    high_breach_count: highBreach,
    medium_breach_count: mediumBreach,
    within_deadline_rate: withinRate,
    overdue_count: overdue,
    significantly_overdue_count: sigOverdue,
    ico_notified_count: icoNotified,
    dpo_consulted_rate: dpoRate,
    child_involved_count: childInvolved,
    staff_involved_count: staffInvolved,
    deadline_overdue_count: deadlineOverdue,
    by_event_type: byType,
    by_compliance_status: byCompliance,
    by_breach_severity: byBreach,
    by_response_timeliness: byTimeliness,
  };
}

export function identifyDataProtectionAlerts(
  records: DataProtectionRecord[],
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

  // High severity data breach
  for (const r of records) {
    if (r.event_type === "data_breach" && r.breach_severity === "high") {
      alerts.push({
        type: "high_severity_breach",
        severity: "critical",
        message: `High severity data breach on ${r.event_date} — notify ICO within 72 hours and implement remedial actions`,
        id: r.id,
      });
    }
  }

  // Non-compliant
  const nonCompliant = records.filter((r) => r.compliance_status === "non_compliant").length;
  if (nonCompliant >= 1) {
    alerts.push({
      type: "non_compliant",
      severity: "high",
      message: `${nonCompliant} data protection ${nonCompliant === 1 ? "event is" : "events are"} non-compliant — rectify immediately`,
      id: "non_compliant",
    });
  }

  // Significantly overdue responses
  const sigOverdue = records.filter((r) => r.response_timeliness === "significantly_overdue").length;
  if (sigOverdue >= 1) {
    alerts.push({
      type: "significantly_overdue",
      severity: "high",
      message: `${sigOverdue} ${sigOverdue === 1 ? "response is" : "responses are"} significantly overdue — escalate to DPO`,
      id: "significantly_overdue",
    });
  }

  // Deadline overdue
  const now = new Date();
  const deadlineOverdue = records.filter((r) => {
    if (!r.deadline_date || r.completed_date) return false;
    return new Date(r.deadline_date) < now;
  }).length;
  if (deadlineOverdue >= 1) {
    alerts.push({
      type: "deadline_overdue",
      severity: "high",
      message: `${deadlineOverdue} data protection ${deadlineOverdue === 1 ? "deadline is" : "deadlines are"} overdue — action urgently`,
      id: "deadline_overdue",
    });
  }

  // DPO not consulted
  const noDpo = records.filter(
    (r) => !r.dpo_consulted && r.event_type !== "training_completed",
  ).length;
  if (noDpo >= 3) {
    alerts.push({
      type: "dpo_not_consulted",
      severity: "medium",
      message: `${noDpo} events without DPO consultation — ensure data protection officer is involved`,
      id: "dpo_not_consulted",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    eventType?: DataEventType;
    complianceStatus?: ComplianceStatus;
    breachSeverity?: BreachSeverity;
    limit?: number;
  },
): Promise<ServiceResult<DataProtectionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_data_protection") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  if (filters?.breachSeverity) q = q.eq("breach_severity", filters.breachSeverity);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    eventType: DataEventType;
    eventDate: string;
    complianceStatus: ComplianceStatus;
    breachSeverity: BreachSeverity;
    responseTimeliness: ResponseTimeliness;
    requesterName?: string;
    childInvolved: boolean;
    staffInvolved: boolean;
    icoNotified: boolean;
    dpoConsulted: boolean;
    deadlineDate?: string;
    completedDate?: string;
    dataCategoriesAffected: string[];
    remedialActions: string[];
    issuesFound: string[];
    actionsTaken: string[];
    handledBy: string;
    approvedBy?: string;
    notes?: string;
  },
): Promise<ServiceResult<DataProtectionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_data_protection") as SB)
    .insert({
      home_id: input.homeId,
      event_type: input.eventType,
      event_date: input.eventDate,
      compliance_status: input.complianceStatus,
      breach_severity: input.breachSeverity,
      response_timeliness: input.responseTimeliness,
      requester_name: input.requesterName ?? null,
      child_involved: input.childInvolved,
      staff_involved: input.staffInvolved,
      ico_notified: input.icoNotified,
      dpo_consulted: input.dpoConsulted,
      deadline_date: input.deadlineDate ?? null,
      completed_date: input.completedDate ?? null,
      data_categories_affected: input.dataCategoriesAffected,
      remedial_actions: input.remedialActions,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      handled_by: input.handledBy,
      approved_by: input.approvedBy ?? null,
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
): Promise<ServiceResult<DataProtectionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_data_protection") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDataProtectionMetrics,
  identifyDataProtectionAlerts,
};
