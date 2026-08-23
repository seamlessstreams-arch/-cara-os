// ══════════════════════════════════════════════════════════════════════════════
// CARA — NOTIFICATIONS REGISTER SERVICE
// Tracks all statutory notifications to Ofsted, the local authority,
// LADO, police, and other regulatory bodies as required by law.
// CHR 2015 Reg 40 (notification of serious events),
// Reg 41 (notification to local authority),
// Reg 44 (independent person — notification requirements),
// Reg 45 (review of quality of care — notification evidence).
//
// Covers: serious injury, death, missing child, police involvement,
// restraint, child protection, deprivation of liberty, allegations,
// absconding, serious illness, and all Schedule 5 events.
//
// SCCIF: Leadership — "Notifications are made promptly and accurately."
// "The home notifies the appropriate authorities without delay."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type NotificationType =
  | "serious_injury"
  | "death"
  | "missing_child"
  | "police_involvement"
  | "restraint"
  | "child_protection"
  | "deprivation_of_liberty"
  | "allegation_against_staff"
  | "absconding"
  | "serious_illness"
  | "outbreak"
  | "significant_event"
  | "other";

export type NotifiedBody =
  | "ofsted"
  | "local_authority"
  | "lado"
  | "police"
  | "placing_authority"
  | "parent_carer"
  | "dfe"
  | "other";

export type NotificationStatus =
  | "draft"
  | "submitted"
  | "acknowledged"
  | "follow_up_requested"
  | "closed";

export type TimelinessMet =
  | "within_24_hours"
  | "within_48_hours"
  | "late"
  | "significantly_late"
  | "not_assessed";

export interface NotificationRecord {
  id: string;
  home_id: string;
  notification_type: NotificationType;
  event_date: string;
  notification_date: string;
  notified_bodies: NotifiedBody[];
  notification_status: NotificationStatus;
  timeliness_met: TimelinessMet;
  child_name: string | null;
  child_id: string | null;
  staff_name: string | null;
  ofsted_reference: string | null;
  description: string;
  outcome: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  evidence_attached: boolean;
  reg40_applicable: boolean;
  reg41_applicable: boolean;
  submitted_by: string;
  approved_by: string | null;
  issues_found: string[];
  actions_taken: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES: { type: NotificationType; label: string }[] = [
  { type: "serious_injury", label: "Serious Injury" },
  { type: "death", label: "Death" },
  { type: "missing_child", label: "Missing Child" },
  { type: "police_involvement", label: "Police Involvement" },
  { type: "restraint", label: "Restraint" },
  { type: "child_protection", label: "Child Protection" },
  { type: "deprivation_of_liberty", label: "Deprivation of Liberty" },
  { type: "allegation_against_staff", label: "Allegation Against Staff" },
  { type: "absconding", label: "Absconding" },
  { type: "serious_illness", label: "Serious Illness" },
  { type: "outbreak", label: "Outbreak" },
  { type: "significant_event", label: "Significant Event" },
  { type: "other", label: "Other" },
];

export const NOTIFIED_BODIES: { body: NotifiedBody; label: string }[] = [
  { body: "ofsted", label: "Ofsted" },
  { body: "local_authority", label: "Local Authority" },
  { body: "lado", label: "LADO" },
  { body: "police", label: "Police" },
  { body: "placing_authority", label: "Placing Authority" },
  { body: "parent_carer", label: "Parent/Carer" },
  { body: "dfe", label: "DfE" },
  { body: "other", label: "Other" },
];

export const NOTIFICATION_STATUSES: { status: NotificationStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "submitted", label: "Submitted" },
  { status: "acknowledged", label: "Acknowledged" },
  { status: "follow_up_requested", label: "Follow-Up Requested" },
  { status: "closed", label: "Closed" },
];

export const TIMELINESS_OPTIONS: { timeliness: TimelinessMet; label: string }[] = [
  { timeliness: "within_24_hours", label: "Within 24 Hours" },
  { timeliness: "within_48_hours", label: "Within 48 Hours" },
  { timeliness: "late", label: "Late" },
  { timeliness: "significantly_late", label: "Significantly Late" },
  { timeliness: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeNotificationMetrics(
  records: NotificationRecord[],
): {
  total_notifications: number;
  serious_injury_count: number;
  missing_child_count: number;
  restraint_count: number;
  allegation_count: number;
  police_involvement_count: number;
  submitted_rate: number | null;
  draft_count: number;
  acknowledged_count: number;
  follow_up_pending_count: number;
  within_24_hours_rate: number | null;
  late_count: number;
  significantly_late_count: number;
  evidence_attached_rate: number | null;
  reg40_count: number;
  reg41_count: number;
  follow_up_overdue_count: number;
  unique_children: number;
  by_notification_type: Record<string, number>;
  by_notification_status: Record<string, number>;
  by_timeliness: Record<string, number>;
  by_notified_body: Record<string, number>;
} {
  const seriousInjury = records.filter((r) => r.notification_type === "serious_injury").length;
  const missingChild = records.filter((r) => r.notification_type === "missing_child").length;
  const restraint = records.filter((r) => r.notification_type === "restraint").length;
  const allegation = records.filter((r) => r.notification_type === "allegation_against_staff").length;
  const policeInvolvement = records.filter((r) => r.notification_type === "police_involvement").length;

  const submitted = records.filter((r) => r.notification_status !== "draft").length;
  const submittedRate =
    records.length > 0
      ? Math.round((submitted / records.length) * 1000) / 10
      : null;

  const draft = records.filter((r) => r.notification_status === "draft").length;
  const acknowledged = records.filter((r) => r.notification_status === "acknowledged").length;

  const followUpPending = records.filter(
    (r) => r.follow_up_required && !r.follow_up_completed,
  ).length;

  const within24 = records.filter((r) => r.timeliness_met === "within_24_hours").length;
  const within24Rate =
    records.length > 0
      ? Math.round((within24 / records.length) * 1000) / 10
      : null;

  const late = records.filter((r) => r.timeliness_met === "late").length;
  const sigLate = records.filter((r) => r.timeliness_met === "significantly_late").length;

  const evidenceAttached = records.filter((r) => r.evidence_attached).length;
  const evidenceRate =
    records.length > 0
      ? Math.round((evidenceAttached / records.length) * 1000) / 10
      : null;

  const reg40 = records.filter((r) => r.reg40_applicable).length;
  const reg41 = records.filter((r) => r.reg41_applicable).length;

  const now = new Date();
  const followUpOverdue = records.filter((r) => {
    if (!r.follow_up_date || r.follow_up_completed) return false;
    return new Date(r.follow_up_date) < now;
  }).length;

  const childNames = records.filter((r) => r.child_name !== null).map((r) => r.child_name!);
  const uniqueChildren = new Set(childNames).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.notification_type] = (byType[r.notification_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.notification_status] = (byStatus[r.notification_status] ?? 0) + 1;

  const byTimeliness: Record<string, number> = {};
  for (const r of records) byTimeliness[r.timeliness_met] = (byTimeliness[r.timeliness_met] ?? 0) + 1;

  const byBody: Record<string, number> = {};
  for (const r of records) {
    for (const body of r.notified_bodies) {
      byBody[body] = (byBody[body] ?? 0) + 1;
    }
  }

  return {
    total_notifications: records.length,
    serious_injury_count: seriousInjury,
    missing_child_count: missingChild,
    restraint_count: restraint,
    allegation_count: allegation,
    police_involvement_count: policeInvolvement,
    submitted_rate: submittedRate,
    draft_count: draft,
    acknowledged_count: acknowledged,
    follow_up_pending_count: followUpPending,
    within_24_hours_rate: within24Rate,
    late_count: late,
    significantly_late_count: sigLate,
    evidence_attached_rate: evidenceRate,
    reg40_count: reg40,
    reg41_count: reg41,
    follow_up_overdue_count: followUpOverdue,
    unique_children: uniqueChildren,
    by_notification_type: byType,
    by_notification_status: byStatus,
    by_timeliness: byTimeliness,
    by_notified_body: byBody,
  };
}

export function identifyNotificationAlerts(
  records: NotificationRecord[],
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

  // Significantly late notification — regulatory breach
  for (const r of records) {
    if (r.timeliness_met === "significantly_late") {
      alerts.push({
        type: "significantly_late",
        severity: "critical",
        message: `${r.notification_type.replace(/_/g, " ")} notification on ${r.notification_date} was significantly late — review notification procedures`,
        id: r.id,
      });
    }
  }

  // Draft notifications not submitted
  const drafts = records.filter((r) => r.notification_status === "draft").length;
  if (drafts >= 1) {
    alerts.push({
      type: "draft_not_submitted",
      severity: "high",
      message: `${drafts} ${drafts === 1 ? "notification is" : "notifications are"} still in draft — submit without delay`,
      id: "draft_not_submitted",
    });
  }

  // Late notifications
  const late = records.filter((r) => r.timeliness_met === "late").length;
  if (late >= 1) {
    alerts.push({
      type: "late_notification",
      severity: "high",
      message: `${late} ${late === 1 ? "notification was" : "notifications were"} submitted late — improve timeliness`,
      id: "late_notification",
    });
  }

  // Follow-up overdue
  const now = new Date();
  const followUpOverdue = records.filter((r) => {
    if (!r.follow_up_date || r.follow_up_completed) return false;
    return new Date(r.follow_up_date) < now;
  }).length;
  if (followUpOverdue >= 1) {
    alerts.push({
      type: "follow_up_overdue",
      severity: "high",
      message: `${followUpOverdue} notification ${followUpOverdue === 1 ? "follow-up is" : "follow-ups are"} overdue — complete promptly`,
      id: "follow_up_overdue",
    });
  }

  // Evidence not attached
  const noEvidence = records.filter(
    (r) => !r.evidence_attached && r.notification_status !== "draft",
  ).length;
  if (noEvidence >= 2) {
    alerts.push({
      type: "no_evidence",
      severity: "medium",
      message: `${noEvidence} submitted notifications without evidence attached — gather and attach documentation`,
      id: "no_evidence",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    notificationType?: NotificationType;
    notificationStatus?: NotificationStatus;
    timelinessMet?: TimelinessMet;
    limit?: number;
  },
): Promise<ServiceResult<NotificationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_notifications_register") as SB).select("*").eq("home_id", homeId);
  if (filters?.notificationType) q = q.eq("notification_type", filters.notificationType);
  if (filters?.notificationStatus) q = q.eq("notification_status", filters.notificationStatus);
  if (filters?.timelinessMet) q = q.eq("timeliness_met", filters.timelinessMet);
  q = q.order("notification_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    notificationType: NotificationType;
    eventDate: string;
    notificationDate: string;
    notifiedBodies: NotifiedBody[];
    notificationStatus: NotificationStatus;
    timelinessMet: TimelinessMet;
    childName?: string;
    childId?: string;
    staffName?: string;
    ofstedReference?: string;
    description: string;
    outcome?: string;
    followUpRequired: boolean;
    followUpDate?: string;
    followUpCompleted: boolean;
    evidenceAttached: boolean;
    reg40Applicable: boolean;
    reg41Applicable: boolean;
    submittedBy: string;
    approvedBy?: string;
    issuesFound: string[];
    actionsTaken: string[];
    notes?: string;
  },
): Promise<ServiceResult<NotificationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_notifications_register") as SB)
    .insert({
      home_id: input.homeId,
      notification_type: input.notificationType,
      event_date: input.eventDate,
      notification_date: input.notificationDate,
      notified_bodies: input.notifiedBodies,
      notification_status: input.notificationStatus,
      timeliness_met: input.timelinessMet,
      child_name: input.childName ?? null,
      child_id: input.childId ?? null,
      staff_name: input.staffName ?? null,
      ofsted_reference: input.ofstedReference ?? null,
      description: input.description,
      outcome: input.outcome ?? null,
      follow_up_required: input.followUpRequired,
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: input.followUpCompleted,
      evidence_attached: input.evidenceAttached,
      reg40_applicable: input.reg40Applicable,
      reg41_applicable: input.reg41Applicable,
      submitted_by: input.submittedBy,
      approved_by: input.approvedBy ?? null,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
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
): Promise<ServiceResult<NotificationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_notifications_register") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeNotificationMetrics,
  identifyNotificationAlerts,
};
