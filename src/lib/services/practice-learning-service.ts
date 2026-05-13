// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PRACTICE LEARNING SERVICE
// Manages learning from incidents, serious case reviews, near misses,
// practice reviews, and continuous improvement tracking.
// CHR 2015 Reg 45 (review of quality of care — learning from events),
// Reg 13 (leadership — learning culture),
// Reg 40 (notifications — learning from notifiable events).
//
// Captures learning outcomes from all significant events, tracks
// implementation of recommended changes, and embeds a culture of
// continuous learning and practice improvement.
//
// SCCIF: Well-Led — "Leaders create a learning culture." "Learning
// from incidents, complaints and feedback drives continuous improvement."
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

export type LearningSource =
  | "incident"
  | "complaint"
  | "safeguarding_concern"
  | "near_miss"
  | "serious_case_review"
  | "reg44_visit"
  | "reg45_review"
  | "ofsted_inspection"
  | "staff_feedback"
  | "child_feedback"
  | "audit"
  | "training"
  | "external_review"
  | "other";

export type LearningPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type ActionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "overdue"
  | "cancelled";

export type ImpactLevel =
  | "transformational"
  | "significant"
  | "moderate"
  | "minor"
  | "not_yet_assessed";

export interface LearningEvent {
  id: string;
  home_id: string;
  title: string;
  source: LearningSource;
  event_date: string;
  identified_by: string;
  description: string;
  root_cause: string | null;
  learning_points: string[];
  priority: LearningPriority;
  linked_event_id: string | null;
  children_affected: number;
  staff_involved: string[];
  shared_with_team: boolean;
  date_shared: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningAction {
  id: string;
  home_id: string;
  learning_event_id: string;
  action: string;
  responsible_person: string;
  target_date: string;
  status: ActionStatus;
  evidence_of_completion: string | null;
  impact_assessment: ImpactLevel;
  impact_notes: string | null;
  date_completed: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const LEARNING_SOURCES: { source: LearningSource; label: string }[] = [
  { source: "incident", label: "Incident" },
  { source: "complaint", label: "Complaint" },
  { source: "safeguarding_concern", label: "Safeguarding Concern" },
  { source: "near_miss", label: "Near Miss" },
  { source: "serious_case_review", label: "Serious Case Review" },
  { source: "reg44_visit", label: "Reg 44 Visit" },
  { source: "reg45_review", label: "Reg 45 Review" },
  { source: "ofsted_inspection", label: "Ofsted Inspection" },
  { source: "staff_feedback", label: "Staff Feedback" },
  { source: "child_feedback", label: "Child Feedback" },
  { source: "audit", label: "Audit" },
  { source: "training", label: "Training" },
  { source: "external_review", label: "External Review" },
  { source: "other", label: "Other" },
];

export const LEARNING_PRIORITIES: { priority: LearningPriority; label: string }[] = [
  { priority: "critical", label: "Critical" },
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
];

export const ACTION_STATUSES: { status: ActionStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "overdue", label: "Overdue" },
  { status: "cancelled", label: "Cancelled" },
];

export const IMPACT_LEVELS: { level: ImpactLevel; label: string }[] = [
  { level: "transformational", label: "Transformational" },
  { level: "significant", label: "Significant" },
  { level: "moderate", label: "Moderate" },
  { level: "minor", label: "Minor" },
  { level: "not_yet_assessed", label: "Not Yet Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute practice learning metrics.
 */
export function computeLearningMetrics(
  events: LearningEvent[],
  actions: LearningAction[],
  now: Date = new Date(),
): {
  total_events: number;
  events_this_quarter: number;
  critical_events: number;
  total_actions: number;
  actions_completed: number;
  actions_overdue: number;
  actions_in_progress: number;
  completion_rate: number;
  shared_with_team_rate: number;
  avg_learning_points: number;
  impact_positive: number;
  impact_not_assessed: number;
  by_source: Record<string, number>;
  by_priority: Record<string, number>;
  by_action_status: Record<string, number>;
  by_impact: Record<string, number>;
} {
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Event metrics
  const eventsThisQuarter = events.filter(
    (e) => new Date(e.event_date) >= ninetyDaysAgo && new Date(e.event_date) <= now,
  ).length;
  const criticalEvents = events.filter((e) => e.priority === "critical").length;

  // Action metrics
  const completed = actions.filter((a) => a.status === "completed").length;
  const overdue = actions.filter((a) => a.status === "overdue").length;
  const inProgress = actions.filter((a) => a.status === "in_progress").length;

  // Also check for actions that are past target date but not marked overdue
  for (const a of actions) {
    if (
      (a.status === "not_started" || a.status === "in_progress") &&
      new Date(a.target_date) < now
    ) {
      // Count as overdue even if not explicitly marked
    }
  }

  const activeActions = actions.filter((a) => a.status !== "cancelled").length;
  const completionRate =
    activeActions > 0
      ? Math.round((completed / activeActions) * 1000) / 10
      : 0;

  // Shared with team
  const sharedRate =
    events.length > 0
      ? Math.round((events.filter((e) => e.shared_with_team).length / events.length) * 1000) / 10
      : 0;

  // Avg learning points
  const avgLearningPoints =
    events.length > 0
      ? Math.round(
          (events.reduce((sum, e) => sum + e.learning_points.length, 0) / events.length) * 10,
        ) / 10
      : 0;

  // Impact
  const impactPositive = actions.filter(
    (a) =>
      a.impact_assessment === "transformational" ||
      a.impact_assessment === "significant" ||
      a.impact_assessment === "moderate",
  ).length;
  const impactNotAssessed = actions.filter(
    (a) => a.impact_assessment === "not_yet_assessed",
  ).length;

  // By source
  const bySource: Record<string, number> = {};
  for (const e of events) {
    bySource[e.source] = (bySource[e.source] ?? 0) + 1;
  }

  // By priority
  const byPriority: Record<string, number> = {};
  for (const e of events) {
    byPriority[e.priority] = (byPriority[e.priority] ?? 0) + 1;
  }

  // By action status
  const byActionStatus: Record<string, number> = {};
  for (const a of actions) {
    byActionStatus[a.status] = (byActionStatus[a.status] ?? 0) + 1;
  }

  // By impact
  const byImpact: Record<string, number> = {};
  for (const a of actions) {
    byImpact[a.impact_assessment] = (byImpact[a.impact_assessment] ?? 0) + 1;
  }

  return {
    total_events: events.length,
    events_this_quarter: eventsThisQuarter,
    critical_events: criticalEvents,
    total_actions: actions.length,
    actions_completed: completed,
    actions_overdue: overdue,
    actions_in_progress: inProgress,
    completion_rate: completionRate,
    shared_with_team_rate: sharedRate,
    avg_learning_points: avgLearningPoints,
    impact_positive: impactPositive,
    impact_not_assessed: impactNotAssessed,
    by_source: bySource,
    by_priority: byPriority,
    by_action_status: byActionStatus,
    by_impact: byImpact,
  };
}

/**
 * Identify practice learning alerts.
 */
export function identifyLearningAlerts(
  events: LearningEvent[],
  actions: LearningAction[],
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

  // Overdue actions
  for (const a of actions) {
    if (a.status === "overdue") {
      alerts.push({
        type: "action_overdue",
        severity: "high",
        message: `Learning action "${a.action}" is overdue — target date was ${a.target_date}. Assigned to: ${a.responsible_person}`,
        id: a.id,
      });
    }
    // Also catch not_started/in_progress past target
    if (
      (a.status === "not_started" || a.status === "in_progress") &&
      new Date(a.target_date) < now
    ) {
      alerts.push({
        type: "action_past_target",
        severity: "medium",
        message: `Learning action "${a.action}" is past its target date (${a.target_date}) but status is ${a.status}`,
        id: a.id,
      });
    }
  }

  // Critical events not shared with team
  for (const e of events) {
    if ((e.priority === "critical" || e.priority === "high") && !e.shared_with_team) {
      alerts.push({
        type: "learning_not_shared",
        severity: e.priority === "critical" ? "critical" as const : "high" as const,
        message: `${e.priority === "critical" ? "Critical" : "High priority"} learning from "${e.title}" has not been shared with the team`,
        id: e.id,
      });
    }
  }

  // Completed actions with no impact assessment
  for (const a of actions) {
    if (a.status === "completed" && a.impact_assessment === "not_yet_assessed") {
      alerts.push({
        type: "no_impact_assessment",
        severity: "medium",
        message: `Completed action "${a.action}" has not had its impact assessed — review whether the change has improved practice`,
        id: a.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Learning Events ──────────────────────────────────────────────

export async function listEvents(
  homeId: string,
  filters?: {
    source?: LearningSource;
    priority?: LearningPriority;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<LearningEvent[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_learning_events") as SB).select("*").eq("home_id", homeId);
  if (filters?.source) q = q.eq("source", filters.source);
  if (filters?.priority) q = q.eq("priority", filters.priority);
  if (filters?.dateFrom) q = q.gte("event_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("event_date", filters.dateTo);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createEvent(
  input: {
    homeId: string;
    title: string;
    source: LearningSource;
    eventDate: string;
    identifiedBy: string;
    description: string;
    rootCause?: string;
    learningPoints: string[];
    priority: LearningPriority;
    linkedEventId?: string;
    childrenAffected: number;
    staffInvolved: string[];
  },
): Promise<ServiceResult<LearningEvent>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_learning_events") as SB)
    .insert({
      home_id: input.homeId,
      title: input.title,
      source: input.source,
      event_date: input.eventDate,
      identified_by: input.identifiedBy,
      description: input.description,
      root_cause: input.rootCause ?? null,
      learning_points: input.learningPoints,
      priority: input.priority,
      linked_event_id: input.linkedEventId ?? null,
      children_affected: input.childrenAffected,
      staff_involved: input.staffInvolved,
      shared_with_team: false,
      date_shared: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateEvent(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<LearningEvent>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_learning_events") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Learning Actions ─────────────────────────────────────────────

export async function listActions(
  homeId: string,
  filters?: {
    learningEventId?: string;
    status?: ActionStatus;
    limit?: number;
  },
): Promise<ServiceResult<LearningAction[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_learning_actions") as SB).select("*").eq("home_id", homeId);
  if (filters?.learningEventId) q = q.eq("learning_event_id", filters.learningEventId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("target_date", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAction(
  input: {
    homeId: string;
    learningEventId: string;
    action: string;
    responsiblePerson: string;
    targetDate: string;
  },
): Promise<ServiceResult<LearningAction>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_learning_actions") as SB)
    .insert({
      home_id: input.homeId,
      learning_event_id: input.learningEventId,
      action: input.action,
      responsible_person: input.responsiblePerson,
      target_date: input.targetDate,
      status: "not_started",
      evidence_of_completion: null,
      impact_assessment: "not_yet_assessed",
      impact_notes: null,
      date_completed: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAction(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<LearningAction>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_learning_actions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeLearningMetrics,
  identifyLearningAlerts,
};
