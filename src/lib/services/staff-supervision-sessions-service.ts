// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF SUPERVISION SESSIONS SERVICE
// Tracks individual supervision sessions, case discussions,
// action items, wellbeing checks, and professional development.
// CHR 2015 Reg 33 (employment of staff — supervision),
// Reg 16 (providing suitable staff — ongoing support).
//
// Covers: supervision records, frequency compliance, case discussions,
// action tracking, emotional wellbeing, and safeguarding awareness.
//
// SCCIF: Leadership & Management — "Staff receive regular supervision
// that supports them to practice effectively." "Supervision explores
// how to improve outcomes for children."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SupervisionType =
  | "formal_scheduled"
  | "informal"
  | "group"
  | "peer"
  | "clinical"
  | "management"
  | "safeguarding"
  | "probation"
  | "other";

export type SessionStatus =
  | "scheduled"
  | "completed"
  | "cancelled_by_supervisor"
  | "cancelled_by_supervisee"
  | "rescheduled"
  | "overdue";

export type WellbeingRating =
  | "excellent"
  | "good"
  | "satisfactory"
  | "struggling"
  | "crisis";

export type ActionPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export interface SupervisionSession {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string;
  supervisor_name: string;
  supervision_type: SupervisionType;
  session_status: SessionStatus;
  session_date: string;
  next_session_date: string | null;
  duration_minutes: number;
  children_discussed: string[];
  cases_discussed_count: number;
  safeguarding_discussed: boolean;
  wellbeing_rating: WellbeingRating;
  wellbeing_concerns_raised: boolean;
  actions_set: number;
  actions_completed_from_last: number;
  actions_outstanding_from_last: number;
  training_needs_identified: boolean;
  reflective_practice_included: boolean;
  signed_by_supervisee: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SUPERVISION_TYPES: { type: SupervisionType; label: string }[] = [
  { type: "formal_scheduled", label: "Formal Scheduled" },
  { type: "informal", label: "Informal" },
  { type: "group", label: "Group" },
  { type: "peer", label: "Peer" },
  { type: "clinical", label: "Clinical" },
  { type: "management", label: "Management" },
  { type: "safeguarding", label: "Safeguarding" },
  { type: "probation", label: "Probation" },
  { type: "other", label: "Other" },
];

export const SESSION_STATUSES: { status: SessionStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "completed", label: "Completed" },
  { status: "cancelled_by_supervisor", label: "Cancelled by Supervisor" },
  { status: "cancelled_by_supervisee", label: "Cancelled by Supervisee" },
  { status: "rescheduled", label: "Rescheduled" },
  { status: "overdue", label: "Overdue" },
];

export const WELLBEING_RATINGS: { rating: WellbeingRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "satisfactory", label: "Satisfactory" },
  { rating: "struggling", label: "Struggling" },
  { rating: "crisis", label: "Crisis" },
];

export const ACTION_PRIORITIES: { priority: ActionPriority; label: string }[] = [
  { priority: "urgent", label: "Urgent" },
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeSupervisionSessionMetrics(
  sessions: SupervisionSession[],
  totalStaff: number,
): {
  total_sessions: number;
  staff_supervised: number;
  supervision_coverage: number | null;
  completed_count: number;
  cancelled_count: number;
  overdue_count: number;
  completion_rate: number | null;
  average_duration: number | null;
  safeguarding_discussed_rate: number | null;
  reflective_practice_rate: number | null;
  training_needs_rate: number | null;
  signed_rate: number | null;
  total_actions_set: number;
  total_actions_completed: number;
  action_completion_rate: number | null;
  wellbeing_concerns_count: number;
  struggling_or_crisis_count: number;
  by_supervision_type: Record<string, number>;
  by_session_status: Record<string, number>;
  by_wellbeing_rating: Record<string, number>;
} {
  const uniqueStaff = new Set(sessions.map((s) => s.staff_id)).size;
  const coverage =
    totalStaff > 0
      ? Math.round((uniqueStaff / totalStaff) * 1000) / 10
      : null;

  const completed = sessions.filter((s) => s.session_status === "completed").length;
  const cancelled = sessions.filter(
    (s) => s.session_status === "cancelled_by_supervisor" || s.session_status === "cancelled_by_supervisee",
  ).length;
  const overdue = sessions.filter((s) => s.session_status === "overdue").length;

  const completionRate =
    sessions.length > 0
      ? Math.round((completed / sessions.length) * 1000) / 10
      : null;

  const completedSessions = sessions.filter((s) => s.session_status === "completed");
  const avgDuration =
    completedSessions.length > 0
      ? Math.round((completedSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / completedSessions.length) * 10) / 10
      : null;

  const sgDiscussed = completedSessions.filter((s) => s.safeguarding_discussed).length;
  const sgRate =
    completedSessions.length > 0
      ? Math.round((sgDiscussed / completedSessions.length) * 1000) / 10
      : null;

  const reflective = completedSessions.filter((s) => s.reflective_practice_included).length;
  const reflectiveRate =
    completedSessions.length > 0
      ? Math.round((reflective / completedSessions.length) * 1000) / 10
      : null;

  const trainingNeeds = completedSessions.filter((s) => s.training_needs_identified).length;
  const trainingRate =
    completedSessions.length > 0
      ? Math.round((trainingNeeds / completedSessions.length) * 1000) / 10
      : null;

  const signed = completedSessions.filter((s) => s.signed_by_supervisee).length;
  const signedRate =
    completedSessions.length > 0
      ? Math.round((signed / completedSessions.length) * 1000) / 10
      : null;

  const totalActionsSet = sessions.reduce((sum, s) => sum + s.actions_set, 0);
  const totalActionsCompleted = sessions.reduce((sum, s) => sum + s.actions_completed_from_last, 0);
  const actionRate =
    totalActionsSet > 0
      ? Math.round((totalActionsCompleted / totalActionsSet) * 1000) / 10
      : null;

  const wellbeingConcerns = sessions.filter((s) => s.wellbeing_concerns_raised).length;
  const strugglingOrCrisis = sessions.filter(
    (s) => s.wellbeing_rating === "struggling" || s.wellbeing_rating === "crisis",
  ).length;

  const byType: Record<string, number> = {};
  for (const s of sessions) byType[s.supervision_type] = (byType[s.supervision_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const s of sessions) byStatus[s.session_status] = (byStatus[s.session_status] ?? 0) + 1;

  const byWellbeing: Record<string, number> = {};
  for (const s of sessions) byWellbeing[s.wellbeing_rating] = (byWellbeing[s.wellbeing_rating] ?? 0) + 1;

  return {
    total_sessions: sessions.length,
    staff_supervised: uniqueStaff,
    supervision_coverage: coverage,
    completed_count: completed,
    cancelled_count: cancelled,
    overdue_count: overdue,
    completion_rate: completionRate,
    average_duration: avgDuration,
    safeguarding_discussed_rate: sgRate,
    reflective_practice_rate: reflectiveRate,
    training_needs_rate: trainingRate,
    signed_rate: signedRate,
    total_actions_set: totalActionsSet,
    total_actions_completed: totalActionsCompleted,
    action_completion_rate: actionRate,
    wellbeing_concerns_count: wellbeingConcerns,
    struggling_or_crisis_count: strugglingOrCrisis,
    by_supervision_type: byType,
    by_session_status: byStatus,
    by_wellbeing_rating: byWellbeing,
  };
}

export function identifySupervisionSessionAlerts(
  sessions: SupervisionSession[],
  totalStaff: number,
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

  // Staff in crisis
  for (const s of sessions) {
    if (s.wellbeing_rating === "crisis" && s.session_status === "completed") {
      alerts.push({
        type: "staff_crisis",
        severity: "critical",
        message: `${s.staff_name} reported crisis-level wellbeing in supervision — provide immediate support and consider referral`,
        id: s.id,
      });
    }
  }

  // Overdue supervisions
  const overdue = sessions.filter((s) => s.session_status === "overdue").length;
  if (overdue >= 1) {
    alerts.push({
      type: "overdue_sessions",
      severity: "high",
      message: `${overdue} supervision ${overdue === 1 ? "session is" : "sessions are"} overdue — staff must receive regular supervision per Reg 33`,
      id: "overdue_sessions",
    });
  }

  // Staff not supervised
  const staffSupervised = new Set(sessions.map((s) => s.staff_id)).size;
  if (totalStaff > 0 && staffSupervised < totalStaff) {
    const gap = totalStaff - staffSupervised;
    alerts.push({
      type: "not_supervised",
      severity: "high",
      message: `${gap} staff ${gap === 1 ? "member has" : "members have"} no supervision record — all staff must receive supervision`,
      id: "not_supervised",
    });
  }

  const cancelled = sessions.filter(
    (s) => s.session_status === "cancelled_by_supervisor" || s.session_status === "cancelled_by_supervisee",
  ).length;
  if (sessions.length >= 4 && cancelled / sessions.length > 0.3) {
    alerts.push({
      type: "high_cancellation",
      severity: "medium",
      message: `${cancelled}/${sessions.length} supervisions cancelled (${Math.round((cancelled / sessions.length) * 100)}%) — review scheduling and prioritisation`,
      id: "high_cancellation",
    });
  }

  // Safeguarding not discussed
  const completedSessions = sessions.filter((s) => s.session_status === "completed");
  const sgNotDiscussed = completedSessions.filter((s) => !s.safeguarding_discussed).length;
  if (sgNotDiscussed >= 3) {
    alerts.push({
      type: "safeguarding_not_discussed",
      severity: "medium",
      message: `Safeguarding not discussed in ${sgNotDiscussed} completed supervisions — should be a standing agenda item`,
      id: "safeguarding_not_discussed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listSessions(
  homeId: string,
  filters?: {
    staffId?: string;
    supervisionType?: SupervisionType;
    sessionStatus?: SessionStatus;
    limit?: number;
  },
): Promise<ServiceResult<SupervisionSession[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_supervision_sessions") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.supervisionType) q = q.eq("supervision_type", filters.supervisionType);
  if (filters?.sessionStatus) q = q.eq("session_status", filters.sessionStatus);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSession(
  input: {
    homeId: string;
    staffName: string;
    staffId: string;
    supervisorName: string;
    supervisionType: SupervisionType;
    sessionStatus: SessionStatus;
    sessionDate: string;
    nextSessionDate?: string;
    durationMinutes: number;
    childrenDiscussed: string[];
    casesDiscussedCount: number;
    safeguardingDiscussed: boolean;
    wellbeingRating: WellbeingRating;
    wellbeingConcernsRaised: boolean;
    actionsSet: number;
    actionsCompletedFromLast: number;
    actionsOutstandingFromLast: number;
    trainingNeedsIdentified: boolean;
    reflectivePracticeIncluded: boolean;
    signedBySupervisee: boolean;
    notes?: string;
  },
): Promise<ServiceResult<SupervisionSession>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_supervision_sessions") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId,
      supervisor_name: input.supervisorName,
      supervision_type: input.supervisionType,
      session_status: input.sessionStatus,
      session_date: input.sessionDate,
      next_session_date: input.nextSessionDate ?? null,
      duration_minutes: input.durationMinutes,
      children_discussed: input.childrenDiscussed,
      cases_discussed_count: input.casesDiscussedCount,
      safeguarding_discussed: input.safeguardingDiscussed,
      wellbeing_rating: input.wellbeingRating,
      wellbeing_concerns_raised: input.wellbeingConcernsRaised,
      actions_set: input.actionsSet,
      actions_completed_from_last: input.actionsCompletedFromLast,
      actions_outstanding_from_last: input.actionsOutstandingFromLast,
      training_needs_identified: input.trainingNeedsIdentified,
      reflective_practice_included: input.reflectivePracticeIncluded,
      signed_by_supervisee: input.signedBySupervisee,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSession(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<SupervisionSession>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_supervision_sessions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSupervisionSessionMetrics,
  identifySupervisionSessionAlerts,
};
