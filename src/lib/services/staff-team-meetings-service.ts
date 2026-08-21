// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF TEAM MEETINGS SERVICE
// Tracks team meeting attendance, agendas, actions, safeguarding
// discussions, and communication effectiveness.
// CHR 2015 Reg 13 (leadership — team communication),
// Reg 33 (employment — staff development),
// Reg 12 (protection — information sharing).
//
// Covers: meeting scheduling, attendance tracking, agenda items,
// action completion, safeguarding discussions, and minutes.
//
// SCCIF: Leadership & Management — "Staff meetings support
// effective communication." "Safeguarding is discussed regularly."
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

export type MeetingType =
  | "full_team"
  | "shift_handover"
  | "management"
  | "safeguarding"
  | "case_discussion"
  | "training_debrief"
  | "emergency"
  | "quality_improvement"
  | "other";

export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "postponed";

export type MinutesStatus =
  | "drafted"
  | "approved"
  | "distributed"
  | "not_taken"
  | "pending";

export type ActionPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export interface TeamMeeting {
  id: string;
  home_id: string;
  meeting_type: MeetingType;
  meeting_date: string;
  meeting_status: MeetingStatus;
  chaired_by: string;
  minutes_status: MinutesStatus;
  attendees_expected: number;
  attendees_present: number;
  duration_minutes: number | null;
  safeguarding_discussed: boolean;
  children_discussed: string[];
  agenda_items: string[];
  actions_set: number;
  actions_completed_from_last: number;
  actions_outstanding_from_last: number;
  key_decisions: string[];
  next_meeting_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MEETING_TYPES: { type: MeetingType; label: string }[] = [
  { type: "full_team", label: "Full Team" },
  { type: "shift_handover", label: "Shift Handover" },
  { type: "management", label: "Management" },
  { type: "safeguarding", label: "Safeguarding" },
  { type: "case_discussion", label: "Case Discussion" },
  { type: "training_debrief", label: "Training Debrief" },
  { type: "emergency", label: "Emergency" },
  { type: "quality_improvement", label: "Quality Improvement" },
  { type: "other", label: "Other" },
];

export const MEETING_STATUSES: { status: MeetingStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
  { status: "rescheduled", label: "Rescheduled" },
  { status: "postponed", label: "Postponed" },
];

export const MINUTES_STATUSES: { status: MinutesStatus; label: string }[] = [
  { status: "drafted", label: "Drafted" },
  { status: "approved", label: "Approved" },
  { status: "distributed", label: "Distributed" },
  { status: "not_taken", label: "Not Taken" },
  { status: "pending", label: "Pending" },
];

export const ACTION_PRIORITIES: { priority: ActionPriority; label: string }[] = [
  { priority: "urgent", label: "Urgent" },
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMeetingMetrics(
  meetings: TeamMeeting[],
  _totalStaff: number,
): {
  total_meetings: number;
  completed_count: number;
  cancelled_count: number;
  attendance_rate: number | null;
  average_attendance: number | null;
  average_duration: number | null;
  safeguarding_discussed_rate: number | null;
  minutes_distributed_rate: number | null;
  minutes_not_taken_count: number;
  total_actions_set: number;
  action_completion_rate: number | null;
  actions_outstanding: number;
  children_discussed_count: number;
  full_team_count: number;
  by_meeting_type: Record<string, number>;
  by_meeting_status: Record<string, number>;
  by_minutes_status: Record<string, number>;
} {
  const completed = meetings.filter((m) => m.meeting_status === "completed");
  const cancelled = meetings.filter(
    (m) => m.meeting_status === "cancelled",
  ).length;

  const totalExpected = completed.reduce((sum, m) => sum + m.attendees_expected, 0);
  const totalPresent = completed.reduce((sum, m) => sum + m.attendees_present, 0);
  const attendanceRate =
    totalExpected > 0
      ? Math.round((totalPresent / totalExpected) * 1000) / 10
      : null;

  const avgAttendance =
    completed.length > 0
      ? Math.round((totalPresent / completed.length) * 10) / 10
      : null;

  const withDuration = completed.filter((m) => m.duration_minutes !== null);
  const avgDuration =
    withDuration.length > 0
      ? Math.round((withDuration.reduce((sum, m) => sum + (m.duration_minutes ?? 0), 0) / withDuration.length) * 10) / 10
      : null;

  const sgDiscussed = completed.filter((m) => m.safeguarding_discussed).length;
  const sgRate =
    completed.length > 0
      ? Math.round((sgDiscussed / completed.length) * 1000) / 10
      : null;

  const minutesDistributed = completed.filter((m) => m.minutes_status === "distributed").length;
  const minutesRate =
    completed.length > 0
      ? Math.round((minutesDistributed / completed.length) * 1000) / 10
      : null;

  const minutesNotTaken = completed.filter((m) => m.minutes_status === "not_taken").length;

  const totalActionsSet = meetings.reduce((sum, m) => sum + m.actions_set, 0);
  const totalActionsCompletedFromLast = meetings.reduce((sum, m) => sum + m.actions_completed_from_last, 0);
  const totalActionsOutstanding = meetings.reduce((sum, m) => sum + m.actions_outstanding_from_last, 0);
  const actionCompletionRate =
    totalActionsSet > 0
      ? Math.round((totalActionsCompletedFromLast / totalActionsSet) * 1000) / 10
      : null;

  const childrenDiscussed = new Set(completed.flatMap((m) => m.children_discussed)).size;
  const fullTeam = meetings.filter((m) => m.meeting_type === "full_team").length;

  const byType: Record<string, number> = {};
  for (const m of meetings) byType[m.meeting_type] = (byType[m.meeting_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const m of meetings) byStatus[m.meeting_status] = (byStatus[m.meeting_status] ?? 0) + 1;

  const byMinutes: Record<string, number> = {};
  for (const m of meetings) byMinutes[m.minutes_status] = (byMinutes[m.minutes_status] ?? 0) + 1;

  return {
    total_meetings: meetings.length,
    completed_count: completed.length,
    cancelled_count: cancelled,
    attendance_rate: attendanceRate,
    average_attendance: avgAttendance,
    average_duration: avgDuration,
    safeguarding_discussed_rate: sgRate,
    minutes_distributed_rate: minutesRate,
    minutes_not_taken_count: minutesNotTaken,
    total_actions_set: totalActionsSet,
    action_completion_rate: actionCompletionRate,
    actions_outstanding: totalActionsOutstanding,
    children_discussed_count: childrenDiscussed,
    full_team_count: fullTeam,
    by_meeting_type: byType,
    by_meeting_status: byStatus,
    by_minutes_status: byMinutes,
  };
}

export function identifyMeetingAlerts(
  meetings: TeamMeeting[],
  _totalStaff: number,
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

  // No safeguarding discussion in completed meetings
  const completed = meetings.filter((m) => m.meeting_status === "completed");
  const noSg = completed.filter((m) => !m.safeguarding_discussed && m.meeting_type === "full_team").length;
  if (noSg >= 2) {
    alerts.push({
      type: "safeguarding_not_discussed",
      severity: "critical",
      message: `${noSg} full team meetings without safeguarding discussion — this must be a standing agenda item`,
      id: "safeguarding_not_discussed",
    });
  }

  // Poor attendance
  for (const m of completed) {
    if (m.attendees_expected > 0 && m.attendees_present / m.attendees_expected < 0.5) {
      alerts.push({
        type: "poor_attendance",
        severity: "high",
        message: `Meeting on ${m.meeting_date} had less than 50% attendance (${m.attendees_present}/${m.attendees_expected}) — reschedule or address`,
        id: m.id,
      });
    }
  }

  // Minutes not taken
  const notTaken = completed.filter((m) => m.minutes_status === "not_taken").length;
  if (notTaken >= 2) {
    alerts.push({
      type: "minutes_not_taken",
      severity: "high",
      message: `${notTaken} completed meetings without minutes taken — minutes are essential for accountability`,
      id: "minutes_not_taken",
    });
  }

  // High cancellation rate
  const cancelled = meetings.filter((m) => m.meeting_status === "cancelled").length;
  if (meetings.length >= 4 && cancelled / meetings.length > 0.3) {
    alerts.push({
      type: "high_cancellation",
      severity: "medium",
      message: `${cancelled} of ${meetings.length} meetings cancelled (${Math.round((cancelled / meetings.length) * 100)}%) — review scheduling`,
      id: "high_cancellation",
    });
  }

  // Outstanding actions
  const totalOutstanding = meetings.reduce((sum, m) => sum + m.actions_outstanding_from_last, 0);
  if (totalOutstanding >= 5) {
    alerts.push({
      type: "actions_outstanding",
      severity: "medium",
      message: `${totalOutstanding} actions outstanding from previous meetings — follow up and complete`,
      id: "actions_outstanding",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listMeetings(
  homeId: string,
  filters?: {
    meetingType?: MeetingType;
    meetingStatus?: MeetingStatus;
    limit?: number;
  },
): Promise<ServiceResult<TeamMeeting[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_team_meetings") as SB).select("*").eq("home_id", homeId);
  if (filters?.meetingType) q = q.eq("meeting_type", filters.meetingType);
  if (filters?.meetingStatus) q = q.eq("meeting_status", filters.meetingStatus);
  q = q.order("meeting_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMeeting(
  input: {
    homeId: string;
    meetingType: MeetingType;
    meetingDate: string;
    meetingStatus: MeetingStatus;
    chairedBy: string;
    minutesStatus: MinutesStatus;
    attendeesExpected: number;
    attendeesPresent: number;
    durationMinutes?: number;
    safeguardingDiscussed: boolean;
    childrenDiscussed: string[];
    agendaItems: string[];
    actionsSet: number;
    actionsCompletedFromLast: number;
    actionsOutstandingFromLast: number;
    keyDecisions: string[];
    nextMeetingDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<TeamMeeting>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_team_meetings") as SB)
    .insert({
      home_id: input.homeId,
      meeting_type: input.meetingType,
      meeting_date: input.meetingDate,
      meeting_status: input.meetingStatus,
      chaired_by: input.chairedBy,
      minutes_status: input.minutesStatus,
      attendees_expected: input.attendeesExpected,
      attendees_present: input.attendeesPresent,
      duration_minutes: input.durationMinutes ?? null,
      safeguarding_discussed: input.safeguardingDiscussed,
      children_discussed: input.childrenDiscussed,
      agenda_items: input.agendaItems,
      actions_set: input.actionsSet,
      actions_completed_from_last: input.actionsCompletedFromLast,
      actions_outstanding_from_last: input.actionsOutstandingFromLast,
      key_decisions: input.keyDecisions,
      next_meeting_date: input.nextMeetingDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateMeeting(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<TeamMeeting>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_team_meetings") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMeetingMetrics,
  identifyMeetingAlerts,
};
