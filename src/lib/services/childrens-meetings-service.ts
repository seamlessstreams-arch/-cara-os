// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S MEETINGS SERVICE
// Tracks house meetings, children's council, young people's forums,
// and all group participation activities where children shape their care.
// CHR 2015 Reg 7 (children's plan — participation),
// Reg 10 (children's views — group settings),
// Reg 16 (statement of purpose — children's involvement).
//
// Covers: house meetings, children's council, menu planning meetings,
// activity planning meetings, rules review meetings, complaints forums.
//
// SCCIF: Voice of the Child — "Children influence how the home is run."
// "Regular meetings give children a genuine say in their care."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type MeetingType =
  | "house_meeting"
  | "childrens_council"
  | "menu_planning"
  | "activity_planning"
  | "rules_review"
  | "complaints_forum"
  | "welcome_meeting"
  | "goodbye_meeting"
  | "celebration"
  | "other";

export type ParticipationLevel =
  | "all_participated"
  | "most_participated"
  | "some_participated"
  | "minimal_participation"
  | "no_participation";

export type ActionOutcome =
  | "all_actions_completed"
  | "most_completed"
  | "some_completed"
  | "none_completed"
  | "no_actions_needed";

export type MeetingAtmosphere =
  | "very_positive"
  | "positive"
  | "neutral"
  | "tense"
  | "negative";

export interface ChildrensMeetingRecord {
  id: string;
  home_id: string;
  meeting_type: MeetingType;
  meeting_date: string;
  participation_level: ParticipationLevel;
  action_outcome: ActionOutcome;
  meeting_atmosphere: MeetingAtmosphere;
  children_invited: number;
  children_attended: number;
  agenda_shared_beforehand: boolean;
  children_set_agenda: boolean;
  minutes_recorded: boolean;
  actions_from_previous_reviewed: boolean;
  child_chair: boolean;
  food_provided: boolean;
  changes_implemented: boolean;
  children_feedback_positive: boolean;
  staff_facilitator: string;
  topics_discussed: string[];
  actions_agreed: string[];
  next_meeting_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MEETING_TYPES: { type: MeetingType; label: string }[] = [
  { type: "house_meeting", label: "House Meeting" },
  { type: "childrens_council", label: "Children's Council" },
  { type: "menu_planning", label: "Menu Planning" },
  { type: "activity_planning", label: "Activity Planning" },
  { type: "rules_review", label: "Rules Review" },
  { type: "complaints_forum", label: "Complaints Forum" },
  { type: "welcome_meeting", label: "Welcome Meeting" },
  { type: "goodbye_meeting", label: "Goodbye Meeting" },
  { type: "celebration", label: "Celebration" },
  { type: "other", label: "Other" },
];

export const PARTICIPATION_LEVELS: { level: ParticipationLevel; label: string }[] = [
  { level: "all_participated", label: "All Participated" },
  { level: "most_participated", label: "Most Participated" },
  { level: "some_participated", label: "Some Participated" },
  { level: "minimal_participation", label: "Minimal Participation" },
  { level: "no_participation", label: "No Participation" },
];

export const ACTION_OUTCOMES: { outcome: ActionOutcome; label: string }[] = [
  { outcome: "all_actions_completed", label: "All Actions Completed" },
  { outcome: "most_completed", label: "Most Completed" },
  { outcome: "some_completed", label: "Some Completed" },
  { outcome: "none_completed", label: "None Completed" },
  { outcome: "no_actions_needed", label: "No Actions Needed" },
];

export const MEETING_ATMOSPHERES: { atmosphere: MeetingAtmosphere; label: string }[] = [
  { atmosphere: "very_positive", label: "Very Positive" },
  { atmosphere: "positive", label: "Positive" },
  { atmosphere: "neutral", label: "Neutral" },
  { atmosphere: "tense", label: "Tense" },
  { atmosphere: "negative", label: "Negative" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMeetingMetrics(
  records: ChildrensMeetingRecord[],
): {
  total_meetings: number;
  house_meeting_count: number;
  childrens_council_count: number;
  menu_planning_count: number;
  activity_planning_count: number;
  all_participated_rate: number | null;
  no_participation_count: number;
  attendance_rate: number | null;
  agenda_shared_rate: number | null;
  children_set_agenda_rate: number | null;
  minutes_recorded_rate: number | null;
  previous_actions_reviewed_rate: number | null;
  child_chair_rate: number | null;
  changes_implemented_rate: number | null;
  children_feedback_positive_rate: number | null;
  all_actions_completed_rate: number | null;
  none_completed_count: number;
  very_positive_atmosphere_rate: number | null;
  negative_atmosphere_count: number;
  meeting_overdue_count: number;
  by_meeting_type: Record<string, number>;
  by_participation_level: Record<string, number>;
  by_action_outcome: Record<string, number>;
  by_meeting_atmosphere: Record<string, number>;
} {
  const houseMeeting = records.filter((r) => r.meeting_type === "house_meeting").length;
  const council = records.filter((r) => r.meeting_type === "childrens_council").length;
  const menuPlanning = records.filter((r) => r.meeting_type === "menu_planning").length;
  const activityPlanning = records.filter((r) => r.meeting_type === "activity_planning").length;

  const allParticipated = records.filter((r) => r.participation_level === "all_participated").length;
  const allParticipatedRate =
    records.length > 0
      ? Math.round((allParticipated / records.length) * 1000) / 10
      : null;

  const noParticipation = records.filter((r) => r.participation_level === "no_participation").length;

  const totalInvited = records.reduce((a, r) => a + r.children_invited, 0);
  const totalAttended = records.reduce((a, r) => a + r.children_attended, 0);
  const attendanceRate =
    totalInvited > 0
      ? Math.round((totalAttended / totalInvited) * 1000) / 10
      : null;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof ChildrensMeetingRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const allActionsCompleted = records.filter((r) => r.action_outcome === "all_actions_completed").length;
  const allActionsRate =
    records.length > 0
      ? Math.round((allActionsCompleted / records.length) * 1000) / 10
      : null;

  const noneCompleted = records.filter((r) => r.action_outcome === "none_completed").length;

  const veryPositive = records.filter((r) => r.meeting_atmosphere === "very_positive").length;
  const veryPositiveRate =
    records.length > 0
      ? Math.round((veryPositive / records.length) * 1000) / 10
      : null;

  const negative = records.filter((r) => r.meeting_atmosphere === "negative").length;

  const now = new Date();
  const meetingOverdue = records.filter((r) => {
    if (!r.next_meeting_date) return false;
    return new Date(r.next_meeting_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.meeting_type] = (byType[r.meeting_type] ?? 0) + 1;

  const byParticipation: Record<string, number> = {};
  for (const r of records) byParticipation[r.participation_level] = (byParticipation[r.participation_level] ?? 0) + 1;

  const byAction: Record<string, number> = {};
  for (const r of records) byAction[r.action_outcome] = (byAction[r.action_outcome] ?? 0) + 1;

  const byAtmosphere: Record<string, number> = {};
  for (const r of records) byAtmosphere[r.meeting_atmosphere] = (byAtmosphere[r.meeting_atmosphere] ?? 0) + 1;

  return {
    total_meetings: records.length,
    house_meeting_count: houseMeeting,
    childrens_council_count: council,
    menu_planning_count: menuPlanning,
    activity_planning_count: activityPlanning,
    all_participated_rate: allParticipatedRate,
    no_participation_count: noParticipation,
    attendance_rate: attendanceRate,
    agenda_shared_rate: boolRate("agenda_shared_beforehand"),
    children_set_agenda_rate: boolRate("children_set_agenda"),
    minutes_recorded_rate: boolRate("minutes_recorded"),
    previous_actions_reviewed_rate: boolRate("actions_from_previous_reviewed"),
    child_chair_rate: boolRate("child_chair"),
    changes_implemented_rate: boolRate("changes_implemented"),
    children_feedback_positive_rate: boolRate("children_feedback_positive"),
    all_actions_completed_rate: allActionsRate,
    none_completed_count: noneCompleted,
    very_positive_atmosphere_rate: veryPositiveRate,
    negative_atmosphere_count: negative,
    meeting_overdue_count: meetingOverdue,
    by_meeting_type: byType,
    by_participation_level: byParticipation,
    by_action_outcome: byAction,
    by_meeting_atmosphere: byAtmosphere,
  };
}

export function identifyMeetingAlerts(
  records: ChildrensMeetingRecord[],
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

  // No participation in meeting
  for (const r of records) {
    if (r.participation_level === "no_participation") {
      alerts.push({
        type: "no_participation",
        severity: "critical",
        message: `No children participated in ${r.meeting_type.replace(/_/g, " ")} on ${r.meeting_date} — investigate barriers to engagement`,
        id: r.id,
      });
    }
  }

  // Negative atmosphere
  for (const r of records) {
    if (r.meeting_atmosphere === "negative") {
      alerts.push({
        type: "negative_atmosphere",
        severity: "high",
        message: `${r.meeting_type.replace(/_/g, " ")} on ${r.meeting_date} had negative atmosphere — review facilitation approach`,
        id: r.id,
      });
    }
  }

  // Actions not completed
  const noneCompleted = records.filter((r) => r.action_outcome === "none_completed").length;
  if (noneCompleted >= 1) {
    alerts.push({
      type: "actions_not_completed",
      severity: "high",
      message: `${noneCompleted} ${noneCompleted === 1 ? "meeting has" : "meetings have"} no actions completed — children's voice not being acted on`,
      id: "actions_not_completed",
    });
  }

  // Children not setting agenda
  const noAgenda = records.filter((r) => !r.children_set_agenda).length;
  if (noAgenda >= 3) {
    alerts.push({
      type: "children_not_setting_agenda",
      severity: "medium",
      message: `${noAgenda} meetings where children did not set agenda — increase child-led participation`,
      id: "children_not_setting_agenda",
    });
  }

  // Meeting overdue
  const now = new Date();
  const meetingOverdue = records.filter((r) => {
    if (!r.next_meeting_date) return false;
    return new Date(r.next_meeting_date) < now;
  }).length;
  if (meetingOverdue >= 1) {
    alerts.push({
      type: "meeting_overdue",
      severity: "medium",
      message: `${meetingOverdue} children's ${meetingOverdue === 1 ? "meeting is" : "meetings are"} overdue — schedule promptly`,
      id: "meeting_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    meetingType?: MeetingType;
    participationLevel?: ParticipationLevel;
    meetingAtmosphere?: MeetingAtmosphere;
    limit?: number;
  },
): Promise<ServiceResult<ChildrensMeetingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_childrens_meetings") as SB).select("*").eq("home_id", homeId);
  if (filters?.meetingType) q = q.eq("meeting_type", filters.meetingType);
  if (filters?.participationLevel) q = q.eq("participation_level", filters.participationLevel);
  if (filters?.meetingAtmosphere) q = q.eq("meeting_atmosphere", filters.meetingAtmosphere);
  q = q.order("meeting_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    meetingType: MeetingType;
    meetingDate: string;
    participationLevel: ParticipationLevel;
    actionOutcome: ActionOutcome;
    meetingAtmosphere: MeetingAtmosphere;
    childrenInvited: number;
    childrenAttended: number;
    agendaSharedBeforehand: boolean;
    childrenSetAgenda: boolean;
    minutesRecorded: boolean;
    actionsFromPreviousReviewed: boolean;
    childChair: boolean;
    foodProvided: boolean;
    changesImplemented: boolean;
    childrenFeedbackPositive: boolean;
    staffFacilitator: string;
    topicsDiscussed: string[];
    actionsAgreed: string[];
    nextMeetingDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<ChildrensMeetingRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_meetings") as SB)
    .insert({
      home_id: input.homeId,
      meeting_type: input.meetingType,
      meeting_date: input.meetingDate,
      participation_level: input.participationLevel,
      action_outcome: input.actionOutcome,
      meeting_atmosphere: input.meetingAtmosphere,
      children_invited: input.childrenInvited,
      children_attended: input.childrenAttended,
      agenda_shared_beforehand: input.agendaSharedBeforehand,
      children_set_agenda: input.childrenSetAgenda,
      minutes_recorded: input.minutesRecorded,
      actions_from_previous_reviewed: input.actionsFromPreviousReviewed,
      child_chair: input.childChair,
      food_provided: input.foodProvided,
      changes_implemented: input.changesImplemented,
      children_feedback_positive: input.childrenFeedbackPositive,
      staff_facilitator: input.staffFacilitator,
      topics_discussed: input.topicsDiscussed,
      actions_agreed: input.actionsAgreed,
      next_meeting_date: input.nextMeetingDate ?? null,
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
): Promise<ServiceResult<ChildrensMeetingRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_meetings") as SB)
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
