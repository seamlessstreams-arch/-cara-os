// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINT RESOLUTION TRACKING SERVICE
// Tracks complaint resolutions, timelines, outcomes, and
// complainant satisfaction through the resolution process.
// CHR 2015 Reg 39 (complaints — handling and resolution),
// Reg 40 (notification of complaints to Ofsted).
//
// Covers: complaint category, resolution status, outcome type,
// response timeline, and satisfaction monitoring.
//
// SCCIF: Leadership — "Complaints are handled promptly and transparently."
// "Learning from complaints drives improvement."
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

export type ComplaintCategory =
  | "care_quality"
  | "staff_conduct"
  | "safeguarding"
  | "medication"
  | "environment"
  | "food_nutrition"
  | "education"
  | "contact_arrangements"
  | "discrimination"
  | "other";

export type ResolutionStatus =
  | "received"
  | "investigating"
  | "resolved"
  | "escalated"
  | "withdrawn";

export type OutcomeType =
  | "upheld"
  | "partially_upheld"
  | "not_upheld"
  | "withdrawn"
  | "pending";

export type ResponseTimeline =
  | "within_24h"
  | "within_3_days"
  | "within_7_days"
  | "within_28_days"
  | "overdue";

export interface ComplaintResolutionTrackingRecord {
  id: string;
  home_id: string;
  complaint_category: ComplaintCategory;
  resolution_status: ResolutionStatus;
  outcome_type: OutcomeType;
  response_timeline: ResponseTimeline;
  complaint_date: string;
  complainant_name: string;
  handled_by: string;
  acknowledged_promptly: boolean;
  investigation_thorough: boolean;
  child_views_sought: boolean;
  complainant_updated: boolean;
  ofsted_notified: boolean;
  learning_identified: boolean;
  action_plan_created: boolean;
  outcome_communicated: boolean;
  satisfaction_assessed: boolean;
  appeal_offered: boolean;
  records_updated: boolean;
  manager_oversight: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  resolution_days: number;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const COMPLAINT_CATEGORIES: { category: ComplaintCategory; label: string }[] = [
  { category: "care_quality", label: "Care Quality" },
  { category: "staff_conduct", label: "Staff Conduct" },
  { category: "safeguarding", label: "Safeguarding" },
  { category: "medication", label: "Medication" },
  { category: "environment", label: "Environment" },
  { category: "food_nutrition", label: "Food & Nutrition" },
  { category: "education", label: "Education" },
  { category: "contact_arrangements", label: "Contact Arrangements" },
  { category: "discrimination", label: "Discrimination" },
  { category: "other", label: "Other" },
];

export const RESOLUTION_STATUSES: { status: ResolutionStatus; label: string }[] = [
  { status: "received", label: "Received" },
  { status: "investigating", label: "Investigating" },
  { status: "resolved", label: "Resolved" },
  { status: "escalated", label: "Escalated" },
  { status: "withdrawn", label: "Withdrawn" },
];

export const OUTCOME_TYPES: { outcome: OutcomeType; label: string }[] = [
  { outcome: "upheld", label: "Upheld" },
  { outcome: "partially_upheld", label: "Partially Upheld" },
  { outcome: "not_upheld", label: "Not Upheld" },
  { outcome: "withdrawn", label: "Withdrawn" },
  { outcome: "pending", label: "Pending" },
];

export const RESPONSE_TIMELINES: { timeline: ResponseTimeline; label: string }[] = [
  { timeline: "within_24h", label: "Within 24 Hours" },
  { timeline: "within_3_days", label: "Within 3 Days" },
  { timeline: "within_7_days", label: "Within 7 Days" },
  { timeline: "within_28_days", label: "Within 28 Days" },
  { timeline: "overdue", label: "Overdue" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeComplaintResolutionMetrics(
  records: ComplaintResolutionTrackingRecord[],
): {
  total_complaints: number;
  upheld_count: number;
  escalated_count: number;
  overdue_count: number;
  pending_count: number;
  acknowledged_rate: number;
  investigation_rate: number;
  child_views_rate: number;
  complainant_updated_rate: number;
  ofsted_notified_rate: number;
  learning_identified_rate: number;
  action_plan_rate: number;
  outcome_communicated_rate: number;
  satisfaction_rate: number;
  appeal_offered_rate: number;
  records_updated_rate: number;
  manager_oversight_rate: number;
  recorded_promptly_rate: number;
  average_resolution_days: number;
  by_complaint_category: Record<string, number>;
  by_resolution_status: Record<string, number>;
  by_outcome_type: Record<string, number>;
  by_response_timeline: Record<string, number>;
} {
  const upheld = records.filter((r) => r.outcome_type === "upheld").length;
  const escalated = records.filter((r) => r.resolution_status === "escalated").length;
  const overdue = records.filter((r) => r.response_timeline === "overdue").length;
  const pending = records.filter((r) => r.outcome_type === "pending").length;

  const boolRate = (field: keyof ComplaintResolutionTrackingRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const avgDays =
    records.length > 0
      ? Math.round(
          (records.reduce((sum, r) => sum + r.resolution_days, 0) / records.length) * 10,
        ) / 10
      : 0;

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.complaint_category] = (byCategory[r.complaint_category] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.resolution_status] = (byStatus[r.resolution_status] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.outcome_type] = (byOutcome[r.outcome_type] ?? 0) + 1;

  const byTimeline: Record<string, number> = {};
  for (const r of records) byTimeline[r.response_timeline] = (byTimeline[r.response_timeline] ?? 0) + 1;

  return {
    total_complaints: records.length,
    upheld_count: upheld,
    escalated_count: escalated,
    overdue_count: overdue,
    pending_count: pending,
    acknowledged_rate: boolRate("acknowledged_promptly"),
    investigation_rate: boolRate("investigation_thorough"),
    child_views_rate: boolRate("child_views_sought"),
    complainant_updated_rate: boolRate("complainant_updated"),
    ofsted_notified_rate: boolRate("ofsted_notified"),
    learning_identified_rate: boolRate("learning_identified"),
    action_plan_rate: boolRate("action_plan_created"),
    outcome_communicated_rate: boolRate("outcome_communicated"),
    satisfaction_rate: boolRate("satisfaction_assessed"),
    appeal_offered_rate: boolRate("appeal_offered"),
    records_updated_rate: boolRate("records_updated"),
    manager_oversight_rate: boolRate("manager_oversight"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    average_resolution_days: avgDays,
    by_complaint_category: byCategory,
    by_resolution_status: byStatus,
    by_outcome_type: byOutcome,
    by_response_timeline: byTimeline,
  };
}

export function identifyComplaintResolutionAlerts(
  records: ComplaintResolutionTrackingRecord[],
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

  // Safeguarding complaint not escalated
  for (const r of records) {
    if (r.complaint_category === "safeguarding" && r.resolution_status !== "escalated" && r.resolution_status !== "resolved") {
      alerts.push({
        type: "safeguarding_complaint_open",
        severity: "critical",
        message: `Safeguarding complaint from ${r.complainant_name} is ${r.resolution_status.replace(/_/g, " ")} — ensure immediate escalation`,
        id: r.id,
      });
    }
  }

  // Overdue responses
  const overdueCount = records.filter((r) => r.response_timeline === "overdue").length;
  if (overdueCount >= 1) {
    alerts.push({
      type: "response_overdue",
      severity: "high",
      message: `${overdueCount} ${overdueCount === 1 ? "complaint has" : "complaints have"} overdue response — ensure timely resolution`,
      id: "response_overdue",
    });
  }

  // Learning not identified
  const noLearning = records.filter((r) => !r.learning_identified).length;
  if (noLearning >= 1) {
    alerts.push({
      type: "no_learning_identified",
      severity: "high",
      message: `${noLearning} ${noLearning === 1 ? "complaint has" : "complaints have"} no learning identified — review improvement opportunities`,
      id: "no_learning_identified",
    });
  }

  // Satisfaction not assessed
  const noSatisfaction = records.filter((r) => !r.satisfaction_assessed).length;
  if (noSatisfaction >= 2) {
    alerts.push({
      type: "satisfaction_not_assessed",
      severity: "medium",
      message: `${noSatisfaction} complaints without satisfaction assessment — strengthen follow-up process`,
      id: "satisfaction_not_assessed",
    });
  }

  // Appeal not offered
  const noAppeal = records.filter((r) => !r.appeal_offered).length;
  if (noAppeal >= 2) {
    alerts.push({
      type: "appeal_not_offered",
      severity: "medium",
      message: `${noAppeal} complaints without appeal offered — ensure compliance with procedure`,
      id: "appeal_not_offered",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    complaintCategory?: ComplaintCategory;
    resolutionStatus?: ResolutionStatus;
    outcomeType?: OutcomeType;
    responseTimeline?: ResponseTimeline;
    limit?: number;
  },
): Promise<ServiceResult<ComplaintResolutionTrackingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_complaint_resolution_tracking") as SB).select("*").eq("home_id", homeId);
  if (filters?.complaintCategory) q = q.eq("complaint_category", filters.complaintCategory);
  if (filters?.resolutionStatus) q = q.eq("resolution_status", filters.resolutionStatus);
  if (filters?.outcomeType) q = q.eq("outcome_type", filters.outcomeType);
  if (filters?.responseTimeline) q = q.eq("response_timeline", filters.responseTimeline);
  q = q.order("complaint_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    complaintCategory: ComplaintCategory;
    resolutionStatus: ResolutionStatus;
    outcomeType: OutcomeType;
    responseTimeline: ResponseTimeline;
    complaintDate: string;
    complainantName: string;
    handledBy: string;
    acknowledgedPromptly?: boolean;
    investigationThorough?: boolean;
    childViewsSought?: boolean;
    complainantUpdated?: boolean;
    ofstedNotified?: boolean;
    learningIdentified?: boolean;
    actionPlanCreated?: boolean;
    outcomeCommunicated?: boolean;
    satisfactionAssessed?: boolean;
    appealOffered?: boolean;
    recordsUpdated?: boolean;
    managerOversight?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    resolutionDays: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ComplaintResolutionTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_complaint_resolution_tracking") as SB)
    .insert({
      home_id: payload.homeId,
      complaint_category: payload.complaintCategory,
      resolution_status: payload.resolutionStatus,
      outcome_type: payload.outcomeType,
      response_timeline: payload.responseTimeline,
      complaint_date: payload.complaintDate,
      complainant_name: payload.complainantName,
      handled_by: payload.handledBy,
      acknowledged_promptly: payload.acknowledgedPromptly ?? true,
      investigation_thorough: payload.investigationThorough ?? true,
      child_views_sought: payload.childViewsSought ?? true,
      complainant_updated: payload.complainantUpdated ?? true,
      ofsted_notified: payload.ofstedNotified ?? false,
      learning_identified: payload.learningIdentified ?? true,
      action_plan_created: payload.actionPlanCreated ?? true,
      outcome_communicated: payload.outcomeCommunicated ?? true,
      satisfaction_assessed: payload.satisfactionAssessed ?? true,
      appeal_offered: payload.appealOffered ?? true,
      records_updated: payload.recordsUpdated ?? true,
      manager_oversight: payload.managerOversight ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      resolution_days: payload.resolutionDays,
      next_review_date: payload.nextReviewDate ?? null,
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
    complaintCategory: ComplaintCategory;
    resolutionStatus: ResolutionStatus;
    outcomeType: OutcomeType;
    responseTimeline: ResponseTimeline;
    complaintDate: string;
    complainantName: string;
    handledBy: string;
    acknowledgedPromptly: boolean;
    investigationThorough: boolean;
    childViewsSought: boolean;
    complainantUpdated: boolean;
    ofstedNotified: boolean;
    learningIdentified: boolean;
    actionPlanCreated: boolean;
    outcomeCommunicated: boolean;
    satisfactionAssessed: boolean;
    appealOffered: boolean;
    recordsUpdated: boolean;
    managerOversight: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    resolutionDays: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ComplaintResolutionTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.complaintCategory !== undefined) mapped.complaint_category = updates.complaintCategory;
  if (updates.resolutionStatus !== undefined) mapped.resolution_status = updates.resolutionStatus;
  if (updates.outcomeType !== undefined) mapped.outcome_type = updates.outcomeType;
  if (updates.responseTimeline !== undefined) mapped.response_timeline = updates.responseTimeline;
  if (updates.complaintDate !== undefined) mapped.complaint_date = updates.complaintDate;
  if (updates.complainantName !== undefined) mapped.complainant_name = updates.complainantName;
  if (updates.handledBy !== undefined) mapped.handled_by = updates.handledBy;
  if (updates.acknowledgedPromptly !== undefined) mapped.acknowledged_promptly = updates.acknowledgedPromptly;
  if (updates.investigationThorough !== undefined) mapped.investigation_thorough = updates.investigationThorough;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.complainantUpdated !== undefined) mapped.complainant_updated = updates.complainantUpdated;
  if (updates.ofstedNotified !== undefined) mapped.ofsted_notified = updates.ofstedNotified;
  if (updates.learningIdentified !== undefined) mapped.learning_identified = updates.learningIdentified;
  if (updates.actionPlanCreated !== undefined) mapped.action_plan_created = updates.actionPlanCreated;
  if (updates.outcomeCommunicated !== undefined) mapped.outcome_communicated = updates.outcomeCommunicated;
  if (updates.satisfactionAssessed !== undefined) mapped.satisfaction_assessed = updates.satisfactionAssessed;
  if (updates.appealOffered !== undefined) mapped.appeal_offered = updates.appealOffered;
  if (updates.recordsUpdated !== undefined) mapped.records_updated = updates.recordsUpdated;
  if (updates.managerOversight !== undefined) mapped.manager_oversight = updates.managerOversight;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.resolutionDays !== undefined) mapped.resolution_days = updates.resolutionDays;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_complaint_resolution_tracking") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeComplaintResolutionMetrics,
  identifyComplaintResolutionAlerts,
};
