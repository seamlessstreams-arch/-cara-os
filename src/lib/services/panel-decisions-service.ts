// ══════════════════════════════════════════════════════════════════════════════
// CARA — PANEL DECISIONS SERVICE
// Tracks placement panel decisions, matching panel outcomes,
// disruption meetings, and management oversight panels.
// CHR 2015 Reg 13 (leadership and management),
// Reg 14 (children's plan — placement decisions),
// Reg 36 (fitness of premises — capacity decisions).
//
// Covers: admission panels, matching panels, disruption meetings,
// discharge panels, capacity reviews, and quality panels.
//
// SCCIF: Leadership — "Placement decisions are robust and evidence-based."
// "Panels ensure thorough matching and risk assessment."
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

export type PanelType =
  | "admission_panel"
  | "matching_panel"
  | "disruption_meeting"
  | "discharge_panel"
  | "capacity_review"
  | "quality_panel"
  | "safeguarding_panel"
  | "risk_panel"
  | "placement_review"
  | "other";

export type PanelDecision =
  | "approved"
  | "approved_with_conditions"
  | "deferred"
  | "declined"
  | "further_info_required"
  | "not_applicable";

export type PanelQuorum =
  | "full_quorum"
  | "quorum_met"
  | "quorum_not_met"
  | "not_applicable";

export type FollowUpStatus =
  | "all_completed"
  | "in_progress"
  | "not_started"
  | "overdue"
  | "not_required";

export interface PanelDecisionRecord {
  id: string;
  home_id: string;
  panel_type: PanelType;
  panel_date: string;
  panel_decision: PanelDecision;
  panel_quorum: PanelQuorum;
  follow_up_status: FollowUpStatus;
  child_name: string | null;
  child_id: string | null;
  panel_chair: string;
  panel_members: string[];
  child_views_considered: boolean;
  risk_assessment_reviewed: boolean;
  matching_criteria_assessed: boolean;
  impact_on_group_assessed: boolean;
  safeguarding_discussed: boolean;
  minutes_recorded: boolean;
  actions_agreed: string[];
  conditions: string[];
  follow_up_date: string | null;
  issues_found: string[];
  actions_taken: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PANEL_TYPES: { type: PanelType; label: string }[] = [
  { type: "admission_panel", label: "Admission Panel" },
  { type: "matching_panel", label: "Matching Panel" },
  { type: "disruption_meeting", label: "Disruption Meeting" },
  { type: "discharge_panel", label: "Discharge Panel" },
  { type: "capacity_review", label: "Capacity Review" },
  { type: "quality_panel", label: "Quality Panel" },
  { type: "safeguarding_panel", label: "Safeguarding Panel" },
  { type: "risk_panel", label: "Risk Panel" },
  { type: "placement_review", label: "Placement Review" },
  { type: "other", label: "Other" },
];

export const PANEL_DECISIONS: { decision: PanelDecision; label: string }[] = [
  { decision: "approved", label: "Approved" },
  { decision: "approved_with_conditions", label: "Approved With Conditions" },
  { decision: "deferred", label: "Deferred" },
  { decision: "declined", label: "Declined" },
  { decision: "further_info_required", label: "Further Info Required" },
  { decision: "not_applicable", label: "Not Applicable" },
];

export const PANEL_QUORUMS: { quorum: PanelQuorum; label: string }[] = [
  { quorum: "full_quorum", label: "Full Quorum" },
  { quorum: "quorum_met", label: "Quorum Met" },
  { quorum: "quorum_not_met", label: "Quorum Not Met" },
  { quorum: "not_applicable", label: "Not Applicable" },
];

export const FOLLOW_UP_STATUSES: { status: FollowUpStatus; label: string }[] = [
  { status: "all_completed", label: "All Completed" },
  { status: "in_progress", label: "In Progress" },
  { status: "not_started", label: "Not Started" },
  { status: "overdue", label: "Overdue" },
  { status: "not_required", label: "Not Required" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePanelMetrics(
  records: PanelDecisionRecord[],
): {
  total_panels: number;
  admission_panel_count: number;
  matching_panel_count: number;
  disruption_meeting_count: number;
  discharge_panel_count: number;
  approved_rate: number | null;
  approved_with_conditions_count: number;
  declined_count: number;
  deferred_count: number;
  full_quorum_rate: number | null;
  quorum_not_met_count: number;
  child_views_considered_rate: number | null;
  risk_assessment_reviewed_rate: number | null;
  matching_criteria_rate: number | null;
  impact_assessed_rate: number | null;
  safeguarding_discussed_rate: number | null;
  minutes_recorded_rate: number | null;
  all_follow_up_completed_rate: number | null;
  follow_up_overdue_count: number;
  follow_up_not_started_count: number;
  unique_children: number;
  by_panel_type: Record<string, number>;
  by_panel_decision: Record<string, number>;
  by_panel_quorum: Record<string, number>;
  by_follow_up_status: Record<string, number>;
} {
  const admissionPanel = records.filter((r) => r.panel_type === "admission_panel").length;
  const matchingPanel = records.filter((r) => r.panel_type === "matching_panel").length;
  const disruptionMeeting = records.filter((r) => r.panel_type === "disruption_meeting").length;
  const dischargePanel = records.filter((r) => r.panel_type === "discharge_panel").length;

  const approved = records.filter((r) => r.panel_decision === "approved").length;
  const approvedRate =
    records.length > 0
      ? Math.round((approved / records.length) * 1000) / 10
      : null;

  const approvedConditions = records.filter((r) => r.panel_decision === "approved_with_conditions").length;
  const declined = records.filter((r) => r.panel_decision === "declined").length;
  const deferred = records.filter((r) => r.panel_decision === "deferred").length;

  const fullQuorum = records.filter((r) => r.panel_quorum === "full_quorum").length;
  const fullQuorumRate =
    records.length > 0
      ? Math.round((fullQuorum / records.length) * 1000) / 10
      : null;

  const quorumNotMet = records.filter((r) => r.panel_quorum === "quorum_not_met").length;

  const boolRate = (field: keyof PanelDecisionRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const allCompleted = records.filter((r) => r.follow_up_status === "all_completed").length;
  const allCompletedRate =
    records.length > 0
      ? Math.round((allCompleted / records.length) * 1000) / 10
      : null;

  const followUpOverdue = records.filter((r) => r.follow_up_status === "overdue").length;
  const followUpNotStarted = records.filter((r) => r.follow_up_status === "not_started").length;

  const childNames = records.filter((r) => r.child_name !== null).map((r) => r.child_name!);
  const uniqueChildren = new Set(childNames).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.panel_type] = (byType[r.panel_type] ?? 0) + 1;

  const byDecision: Record<string, number> = {};
  for (const r of records) byDecision[r.panel_decision] = (byDecision[r.panel_decision] ?? 0) + 1;

  const byQuorum: Record<string, number> = {};
  for (const r of records) byQuorum[r.panel_quorum] = (byQuorum[r.panel_quorum] ?? 0) + 1;

  const byFollowUp: Record<string, number> = {};
  for (const r of records) byFollowUp[r.follow_up_status] = (byFollowUp[r.follow_up_status] ?? 0) + 1;

  return {
    total_panels: records.length,
    admission_panel_count: admissionPanel,
    matching_panel_count: matchingPanel,
    disruption_meeting_count: disruptionMeeting,
    discharge_panel_count: dischargePanel,
    approved_rate: approvedRate,
    approved_with_conditions_count: approvedConditions,
    declined_count: declined,
    deferred_count: deferred,
    full_quorum_rate: fullQuorumRate,
    quorum_not_met_count: quorumNotMet,
    child_views_considered_rate: boolRate("child_views_considered"),
    risk_assessment_reviewed_rate: boolRate("risk_assessment_reviewed"),
    matching_criteria_rate: boolRate("matching_criteria_assessed"),
    impact_assessed_rate: boolRate("impact_on_group_assessed"),
    safeguarding_discussed_rate: boolRate("safeguarding_discussed"),
    minutes_recorded_rate: boolRate("minutes_recorded"),
    all_follow_up_completed_rate: allCompletedRate,
    follow_up_overdue_count: followUpOverdue,
    follow_up_not_started_count: followUpNotStarted,
    unique_children: uniqueChildren,
    by_panel_type: byType,
    by_panel_decision: byDecision,
    by_panel_quorum: byQuorum,
    by_follow_up_status: byFollowUp,
  };
}

export function identifyPanelAlerts(
  records: PanelDecisionRecord[],
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

  // Quorum not met
  for (const r of records) {
    if (r.panel_quorum === "quorum_not_met") {
      alerts.push({
        type: "quorum_not_met",
        severity: "critical",
        message: `${r.panel_type.replace(/_/g, " ")} on ${r.panel_date} did not meet quorum — decision may not be valid`,
        id: r.id,
      });
    }
  }

  // Follow-up overdue
  const followUpOverdue = records.filter((r) => r.follow_up_status === "overdue").length;
  if (followUpOverdue >= 1) {
    alerts.push({
      type: "follow_up_overdue",
      severity: "high",
      message: `${followUpOverdue} panel ${followUpOverdue === 1 ? "follow-up is" : "follow-ups are"} overdue — complete actions promptly`,
      id: "follow_up_overdue",
    });
  }

  // Child views not considered
  const noViews = records.filter((r) => !r.child_views_considered && r.child_name !== null).length;
  if (noViews >= 1) {
    alerts.push({
      type: "child_views_not_considered",
      severity: "high",
      message: `${noViews} ${noViews === 1 ? "panel" : "panels"} where child views not considered — ensure participation`,
      id: "child_views_not_considered",
    });
  }

  // Minutes not recorded
  const noMinutes = records.filter((r) => !r.minutes_recorded).length;
  if (noMinutes >= 1) {
    alerts.push({
      type: "minutes_not_recorded",
      severity: "medium",
      message: `${noMinutes} ${noMinutes === 1 ? "panel" : "panels"} without minutes recorded — document decisions`,
      id: "minutes_not_recorded",
    });
  }

  // Follow-up not started
  const notStarted = records.filter((r) => r.follow_up_status === "not_started").length;
  if (notStarted >= 2) {
    alerts.push({
      type: "follow_up_not_started",
      severity: "medium",
      message: `${notStarted} panel follow-ups not started — begin actions promptly`,
      id: "follow_up_not_started",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    panelType?: PanelType;
    panelDecision?: PanelDecision;
    panelQuorum?: PanelQuorum;
    limit?: number;
  },
): Promise<ServiceResult<PanelDecisionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_panel_decisions") as SB).select("*").eq("home_id", homeId);
  if (filters?.panelType) q = q.eq("panel_type", filters.panelType);
  if (filters?.panelDecision) q = q.eq("panel_decision", filters.panelDecision);
  if (filters?.panelQuorum) q = q.eq("panel_quorum", filters.panelQuorum);
  q = q.order("panel_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    panelType: PanelType;
    panelDate: string;
    panelDecision: PanelDecision;
    panelQuorum: PanelQuorum;
    followUpStatus: FollowUpStatus;
    childName?: string;
    childId?: string;
    panelChair: string;
    panelMembers: string[];
    childViewsConsidered: boolean;
    riskAssessmentReviewed: boolean;
    matchingCriteriaAssessed: boolean;
    impactOnGroupAssessed: boolean;
    safeguardingDiscussed: boolean;
    minutesRecorded: boolean;
    actionsAgreed: string[];
    conditions: string[];
    followUpDate?: string;
    issuesFound: string[];
    actionsTaken: string[];
    notes?: string;
  },
): Promise<ServiceResult<PanelDecisionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_panel_decisions") as SB)
    .insert({
      home_id: input.homeId,
      panel_type: input.panelType,
      panel_date: input.panelDate,
      panel_decision: input.panelDecision,
      panel_quorum: input.panelQuorum,
      follow_up_status: input.followUpStatus,
      child_name: input.childName ?? null,
      child_id: input.childId ?? null,
      panel_chair: input.panelChair,
      panel_members: input.panelMembers,
      child_views_considered: input.childViewsConsidered,
      risk_assessment_reviewed: input.riskAssessmentReviewed,
      matching_criteria_assessed: input.matchingCriteriaAssessed,
      impact_on_group_assessed: input.impactOnGroupAssessed,
      safeguarding_discussed: input.safeguardingDiscussed,
      minutes_recorded: input.minutesRecorded,
      actions_agreed: input.actionsAgreed,
      conditions: input.conditions,
      follow_up_date: input.followUpDate ?? null,
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
): Promise<ServiceResult<PanelDecisionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_panel_decisions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePanelMetrics,
  identifyPanelAlerts,
};
