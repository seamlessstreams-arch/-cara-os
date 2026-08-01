// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF SUPPORT ACTION SERVICE
// Records specific support actions taken for staff — training, mentoring,
// supervision adjustments, reasonable adjustments, wellbeing interventions,
// team support, and more. Part of the Cara Staff Development, Support and
// Risk Intelligence layer.
//
// CHR 2015 Reg 33 (employment of staff — support and development),
// Reg 34 (fitness of workers), Reg 13 (leadership and management),
// Reg 35 (behaviour management — supporting staff who manage behaviour).
//
// Strengths-based, fair, contextual, evidence-led.
//
// SCCIF: Well-Led — "Leaders support staff to improve practice."
// "Staff feel valued and are helped to develop their skills."
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

export type ActionType =
  | "training_course"
  | "mentoring_session"
  | "supervision_adjustment"
  | "reasonable_adjustment"
  | "wellbeing_intervention"
  | "peer_support"
  | "workload_review"
  | "occupational_health"
  | "coaching"
  | "other";

export type ActionOutcome =
  | "very_positive"
  | "positive"
  | "neutral"
  | "limited"
  | "no_change";

export type CompletionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "overdue";

export type ActionPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low"
  | "routine";

export interface StaffSupportActionRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  action_type: ActionType;
  action_outcome: ActionOutcome;
  completion_status: CompletionStatus;
  action_priority: ActionPriority;
  session_date: string;
  recorded_by: string;
  action_description: string;
  evidence_of_need: string;
  expected_outcome: string | null;
  actual_outcome: string | null;
  staff_feedback: string | null;
  manager_observation: string | null;
  barriers_encountered: string | null;
  follow_up_plan: string | null;
  linked_plan_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  next_review_date: string | null;
  notes: string | null;
  evidence_based: boolean;
  staff_consulted: boolean;
  staff_agreed: boolean;
  action_proportionate: boolean;
  cost_considered: boolean;
  timeline_set: boolean;
  success_criteria_set: boolean;
  follow_up_scheduled: boolean;
  manager_approved: boolean;
  impact_assessed: boolean;
  linked_to_plan: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ACTION_TYPES: { type: ActionType; label: string }[] = [
  { type: "training_course", label: "Training Course" },
  { type: "mentoring_session", label: "Mentoring Session" },
  { type: "supervision_adjustment", label: "Supervision Adjustment" },
  { type: "reasonable_adjustment", label: "Reasonable Adjustment" },
  { type: "wellbeing_intervention", label: "Wellbeing Intervention" },
  { type: "peer_support", label: "Peer Support" },
  { type: "workload_review", label: "Workload Review" },
  { type: "occupational_health", label: "Occupational Health" },
  { type: "coaching", label: "Coaching" },
  { type: "other", label: "Other" },
];

export const ACTION_OUTCOMES: { outcome: ActionOutcome; label: string }[] = [
  { outcome: "very_positive", label: "Very Positive" },
  { outcome: "positive", label: "Positive" },
  { outcome: "neutral", label: "Neutral" },
  { outcome: "limited", label: "Limited" },
  { outcome: "no_change", label: "No Change" },
];

export const COMPLETION_STATUSES: { status: CompletionStatus; label: string }[] = [
  { status: "planned", label: "Planned" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
  { status: "overdue", label: "Overdue" },
];

export const ACTION_PRIORITIES: { priority: ActionPriority; label: string }[] = [
  { priority: "urgent", label: "Urgent" },
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
  { priority: "routine", label: "Routine" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute staff support action metrics.
 */
export function computeSupportActionMetrics(
  records: StaffSupportActionRecord[],
): {
  total_actions: number;
  overdue_count: number;
  urgent_count: number;
  completed_count: number;
  no_change_count: number;
  evidence_based_rate: number | null;
  staff_consulted_rate: number | null;
  staff_agreed_rate: number | null;
  proportionate_rate: number | null;
  cost_considered_rate: number | null;
  timeline_rate: number | null;
  success_criteria_rate: number | null;
  follow_up_rate: number | null;
  manager_approved_rate: number | null;
  impact_assessed_rate: number | null;
  linked_to_plan_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_action_type: Record<string, number>;
  by_action_outcome: Record<string, number>;
  by_completion_status: Record<string, number>;
  by_action_priority: Record<string, number>;
} {
  const overdueCount = records.filter((r) => r.completion_status === "overdue").length;
  const urgentCount = records.filter((r) => r.action_priority === "urgent").length;
  const completedCount = records.filter((r) => r.completion_status === "completed").length;
  const noChangeCount = records.filter((r) => r.action_outcome === "no_change").length;

  const boolRate = (field: keyof StaffSupportActionRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byActionType: Record<string, number> = {};
  for (const r of records) byActionType[r.action_type] = (byActionType[r.action_type] ?? 0) + 1;

  const byActionOutcome: Record<string, number> = {};
  for (const r of records) byActionOutcome[r.action_outcome] = (byActionOutcome[r.action_outcome] ?? 0) + 1;

  const byCompletionStatus: Record<string, number> = {};
  for (const r of records) byCompletionStatus[r.completion_status] = (byCompletionStatus[r.completion_status] ?? 0) + 1;

  const byActionPriority: Record<string, number> = {};
  for (const r of records) byActionPriority[r.action_priority] = (byActionPriority[r.action_priority] ?? 0) + 1;

  return {
    total_actions: records.length,
    overdue_count: overdueCount,
    urgent_count: urgentCount,
    completed_count: completedCount,
    no_change_count: noChangeCount,
    evidence_based_rate: boolRate("evidence_based"),
    staff_consulted_rate: boolRate("staff_consulted"),
    staff_agreed_rate: boolRate("staff_agreed"),
    proportionate_rate: boolRate("action_proportionate"),
    cost_considered_rate: boolRate("cost_considered"),
    timeline_rate: boolRate("timeline_set"),
    success_criteria_rate: boolRate("success_criteria_set"),
    follow_up_rate: boolRate("follow_up_scheduled"),
    manager_approved_rate: boolRate("manager_approved"),
    impact_assessed_rate: boolRate("impact_assessed"),
    linked_to_plan_rate: boolRate("linked_to_plan"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: uniqueStaff,
    by_action_type: byActionType,
    by_action_outcome: byActionOutcome,
    by_completion_status: byCompletionStatus,
    by_action_priority: byActionPriority,
  };
}

/**
 * Identify staff support action alerts requiring management attention.
 */
export function identifySupportActionAlerts(
  records: StaffSupportActionRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Overdue urgent — per-record, critical
  for (const r of records) {
    if (r.completion_status === "overdue" && r.action_priority === "urgent") {
      alerts.push({
        type: "overdue_urgent",
        severity: "critical",
        message: `${r.staff_name} has an overdue urgent support action — immediate attention needed.`,
        record_id: r.id,
      });
    }
  }

  // Staff not consulted — high, count >= 1
  const notConsultedCount = records.filter((r) => r.staff_consulted === false).length;
  if (notConsultedCount >= 1) {
    alerts.push({
      type: "staff_not_consulted",
      severity: "high",
      message: `${notConsultedCount} action${notConsultedCount === 1 ? " has" : "s have"} staff not consulted.`,
    });
  }

  // No success criteria — high, count >= 1
  const noSuccessCriteriaCount = records.filter((r) => r.success_criteria_set === false).length;
  if (noSuccessCriteriaCount >= 1) {
    alerts.push({
      type: "no_success_criteria",
      severity: "high",
      message: `${noSuccessCriteriaCount} action${noSuccessCriteriaCount === 1 ? " has" : "s have"} no success criteria set.`,
    });
  }

  // No follow-up — medium, count >= 2
  const noFollowUpCount = records.filter((r) => r.follow_up_scheduled === false).length;
  if (noFollowUpCount >= 2) {
    alerts.push({
      type: "no_follow_up",
      severity: "medium",
      message: `${noFollowUpCount} actions have no follow-up scheduled.`,
    });
  }

  // No impact assessed — medium, count >= 2
  const noImpactCount = records.filter((r) => r.impact_assessed === false).length;
  if (noImpactCount >= 2) {
    alerts.push({
      type: "no_impact_assessed",
      severity: "medium",
      message: `${noImpactCount} actions have no impact assessment completed.`,
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listSupportActions(
  homeId: string,
): Promise<ServiceResult<StaffSupportActionRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_support_actions") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffSupportActionRecord[] };
}

export async function createSupportAction(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  actionType: ActionType;
  actionOutcome: ActionOutcome;
  completionStatus: CompletionStatus;
  actionPriority: ActionPriority;
  sessionDate: string;
  recordedBy: string;
  actionDescription: string;
  evidenceOfNeed: string;
  expectedOutcome?: string | null;
  actualOutcome?: string | null;
  staffFeedback?: string | null;
  managerObservation?: string | null;
  barriersEncountered?: string | null;
  followUpPlan?: string | null;
  linkedPlanId?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  nextReviewDate?: string | null;
  notes?: string | null;
  evidenceBased: boolean;
  staffConsulted: boolean;
  staffAgreed: boolean;
  actionProportionate: boolean;
  costConsidered: boolean;
  timelineSet: boolean;
  successCriteriaSet: boolean;
  followUpScheduled: boolean;
  managerApproved: boolean;
  impactAssessed: boolean;
  linkedToPlan: boolean;
  recordedPromptly: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
}): Promise<ServiceResult<StaffSupportActionRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_support_actions") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      action_type: input.actionType,
      action_outcome: input.actionOutcome,
      completion_status: input.completionStatus,
      action_priority: input.actionPriority,
      session_date: input.sessionDate,
      recorded_by: input.recordedBy,
      action_description: input.actionDescription,
      evidence_of_need: input.evidenceOfNeed,
      expected_outcome: input.expectedOutcome ?? null,
      actual_outcome: input.actualOutcome ?? null,
      staff_feedback: input.staffFeedback ?? null,
      manager_observation: input.managerObservation ?? null,
      barriers_encountered: input.barriersEncountered ?? null,
      follow_up_plan: input.followUpPlan ?? null,
      linked_plan_id: input.linkedPlanId ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
      evidence_based: input.evidenceBased,
      staff_consulted: input.staffConsulted,
      staff_agreed: input.staffAgreed,
      action_proportionate: input.actionProportionate,
      cost_considered: input.costConsidered,
      timeline_set: input.timelineSet,
      success_criteria_set: input.successCriteriaSet,
      follow_up_scheduled: input.followUpScheduled,
      manager_approved: input.managerApproved,
      impact_assessed: input.impactAssessed,
      linked_to_plan: input.linkedToPlan,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffSupportActionRecord };
}

export async function updateSupportAction(
  id: string,
  updates: Partial<Omit<StaffSupportActionRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffSupportActionRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_support_actions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffSupportActionRecord };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = { computeSupportActionMetrics, identifySupportActionAlerts };
