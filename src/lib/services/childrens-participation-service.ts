// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S PARTICIPATION SERVICE
// Manages children's participation in house meetings, children's councils,
// feedback sessions, and consultation processes. CHR 2015 Reg 7 (children's
// views, wishes and feelings), Reg 16(2)(c) (guide — how to find out rights),
// Reg 39 (complaints — children's voice), UN Convention on the Rights of the
// Child Article 12 (right to be heard).
//
// Tracks house meetings, individual consultation sessions, participation
// metrics, and ensures children's voices influence home management decisions
// as required by the SCCIF "Children's Experiences" quality standard.
//
// SCCIF: "Children's views and feelings are taken into account in all
// aspects of their care." "Children are consulted and involved in decisions
// about the home." "Children know how to complain and are listened to."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { todayStr, londonDayDiff } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type MeetingType =
  | "house_meeting"
  | "childrens_council"
  | "one_to_one_consultation"
  | "feedback_session"
  | "menu_planning"
  | "activity_planning"
  | "rules_review"
  | "complaints_forum";

export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type TopicCategory =
  | "daily_routines"
  | "food_menus"
  | "activities_outings"
  | "house_rules"
  | "safety_concerns"
  | "staffing"
  | "complaints"
  | "celebrations"
  | "improvements"
  | "individual_needs"
  | "rights_awareness"
  | "other";

export type ActionOutcome =
  | "implemented"
  | "partially_implemented"
  | "not_possible"
  | "in_progress"
  | "pending";

export interface ParticipationMeeting {
  id: string;
  home_id: string;
  meeting_type: MeetingType;
  meeting_date: string;
  scheduled_time: string | null;
  duration_minutes: number | null;
  facilitator: string;
  children_invited: string[];
  children_attended: string[];
  staff_present: string[];
  topics: {
    category: TopicCategory;
    description: string;
    raised_by: string;
    discussion_summary: string;
  }[];
  decisions_made: string[];
  actions: {
    action: string;
    assigned_to: string;
    due_date: string;
    status: ActionOutcome;
    feedback_to_children: string;
  }[];
  child_satisfaction_collected: boolean;
  overall_engagement: "high" | "moderate" | "low" | null;
  status: MeetingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildConsultation {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  consultation_date: string;
  consulted_by: string;
  topic: TopicCategory;
  context: string;
  child_views: string;
  child_preferences: string | null;
  outcome: string | null;
  action_taken: string | null;
  child_informed_of_outcome: boolean;
  child_satisfied_with_response: boolean | null;
  notes: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MEETING_TYPES: { type: MeetingType; label: string }[] = [
  { type: "house_meeting", label: "House Meeting" },
  { type: "childrens_council", label: "Children's Council" },
  { type: "one_to_one_consultation", label: "One-to-One Consultation" },
  { type: "feedback_session", label: "Feedback Session" },
  { type: "menu_planning", label: "Menu Planning" },
  { type: "activity_planning", label: "Activity Planning" },
  { type: "rules_review", label: "Rules Review" },
  { type: "complaints_forum", label: "Complaints Forum" },
];

export const MEETING_STATUSES: { status: MeetingStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
  { status: "rescheduled", label: "Rescheduled" },
];

export const TOPIC_CATEGORIES: { category: TopicCategory; label: string }[] = [
  { category: "daily_routines", label: "Daily Routines" },
  { category: "food_menus", label: "Food & Menus" },
  { category: "activities_outings", label: "Activities & Outings" },
  { category: "house_rules", label: "House Rules" },
  { category: "safety_concerns", label: "Safety Concerns" },
  { category: "staffing", label: "Staffing" },
  { category: "complaints", label: "Complaints" },
  { category: "celebrations", label: "Celebrations" },
  { category: "improvements", label: "Improvements" },
  { category: "individual_needs", label: "Individual Needs" },
  { category: "rights_awareness", label: "Rights Awareness" },
  { category: "other", label: "Other" },
];

export const ACTION_OUTCOMES: { outcome: ActionOutcome; label: string }[] = [
  { outcome: "implemented", label: "Implemented" },
  { outcome: "partially_implemented", label: "Partially Implemented" },
  { outcome: "not_possible", label: "Not Possible" },
  { outcome: "in_progress", label: "In Progress" },
  { outcome: "pending", label: "Pending" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute children's participation metrics.
 */
export function computeParticipationMetrics(
  meetings: ParticipationMeeting[],
  consultations: ChildConsultation[],
  totalChildren: number,
): {
  meetings_this_quarter: number;
  avg_attendance_rate: number | null;
  unique_children_participating: number;
  participation_rate: number | null;
  actions_implemented_rate: number | null;
  topics_raised: number;
  by_meeting_type: Record<string, number>;
  by_topic_category: Record<string, number>;
  satisfaction_rate: number | null;
  consultations_this_quarter: number;
} {
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  // Meetings this quarter
  const completedMeetings = meetings.filter((m) => m.status === "completed");
  const meetingsThisQuarter = completedMeetings.filter(
    (m) => new Date(m.meeting_date) >= quarterStart,
  ).length;

  // Average attendance rate
  let totalInvited = 0;
  let totalAttended = 0;
  for (const m of completedMeetings) {
    totalInvited += m.children_invited.length;
    totalAttended += m.children_attended.length;
  }
  const avgAttendanceRate =
    totalInvited > 0
      ? Math.round((totalAttended / totalInvited) * 1000) / 10
      : null;

  // Unique children participating (across meetings + consultations)
  const participatingChildren = new Set<string>();
  for (const m of completedMeetings) {
    for (const c of m.children_attended) {
      participatingChildren.add(c);
    }
  }
  for (const c of consultations) {
    participatingChildren.add(c.child_id);
  }
  const uniqueChildrenParticipating = participatingChildren.size;

  // Participation rate
  const participationRate =
    totalChildren > 0
      ? Math.round((uniqueChildrenParticipating / totalChildren) * 1000) / 10
      : null;

  // Actions implemented rate
  let totalActions = 0;
  let implementedActions = 0;
  for (const m of completedMeetings) {
    for (const a of m.actions) {
      totalActions++;
      if (a.status === "implemented" || a.status === "partially_implemented") {
        implementedActions++;
      }
    }
  }
  const actionsImplementedRate =
    totalActions > 0
      ? Math.round((implementedActions / totalActions) * 1000) / 10
      : null;

  // Total topics raised
  let topicsRaised = 0;
  for (const m of completedMeetings) {
    topicsRaised += m.topics.length;
  }

  // By meeting type
  const byMeetingType: Record<string, number> = {};
  for (const m of completedMeetings) {
    byMeetingType[m.meeting_type] = (byMeetingType[m.meeting_type] ?? 0) + 1;
  }

  // By topic category
  const byTopicCategory: Record<string, number> = {};
  for (const m of completedMeetings) {
    for (const t of m.topics) {
      byTopicCategory[t.category] = (byTopicCategory[t.category] ?? 0) + 1;
    }
  }
  for (const c of consultations) {
    byTopicCategory[c.topic] = (byTopicCategory[c.topic] ?? 0) + 1;
  }

  // Child satisfaction rate from consultations
  let satisfiedCount = 0;
  let responseCount = 0;
  for (const c of consultations) {
    if (c.child_satisfied_with_response != null) {
      responseCount++;
      if (c.child_satisfied_with_response) satisfiedCount++;
    }
  }
  const satisfactionRate =
    responseCount > 0
      ? Math.round((satisfiedCount / responseCount) * 1000) / 10
      : null;

  // Consultations this quarter
  const consultationsThisQuarter = consultations.filter(
    (c) => new Date(c.consultation_date) >= quarterStart,
  ).length;

  return {
    meetings_this_quarter: meetingsThisQuarter,
    avg_attendance_rate: avgAttendanceRate,
    unique_children_participating: uniqueChildrenParticipating,
    participation_rate: participationRate,
    actions_implemented_rate: actionsImplementedRate,
    topics_raised: topicsRaised,
    by_meeting_type: byMeetingType,
    by_topic_category: byTopicCategory,
    satisfaction_rate: satisfactionRate,
    consultations_this_quarter: consultationsThisQuarter,
  };
}

/**
 * Identify children's participation alerts.
 */
export function identifyParticipationAlerts(
  meetings: ParticipationMeeting[],
  consultations: ChildConsultation[],
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

  const thirtyDaysMs = 30 * 86400000;

  const completedMeetings = meetings.filter((m) => m.status === "completed");

  // ── No house meeting in last 30 days (high) ──────────────────────────
  const houseMeetings = completedMeetings.filter(
    (m) => m.meeting_type === "house_meeting",
  );
  if (houseMeetings.length > 0) {
    const latestHouse = houseMeetings.sort(
      (a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime(),
    )[0];
    if (now.getTime() - new Date(latestHouse.meeting_date).getTime() > thirtyDaysMs) {
      const daysSince = Math.round(
        -londonDayDiff(latestHouse.meeting_date, now),
      );
      alerts.push({
        type: "no_recent_house_meeting",
        severity: "high",
        message: `No house meeting in ${daysSince} days — Reg 7 requires regular opportunities for children to express views`,
        id: latestHouse.id,
      });
    }
  } else if (meetings.length > 0) {
    alerts.push({
      type: "no_house_meetings",
      severity: "high",
      message: "No house meetings recorded — Reg 7 requires regular opportunities for children to express views collectively",
      id: meetings[0].id,
    });
  }

  // ── Low attendance in recent meetings (medium) ───────────────────────
  const recentCompleted = completedMeetings
    .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime())
    .slice(0, 3);
  for (const m of recentCompleted) {
    if (m.children_invited.length > 0) {
      const rate = m.children_attended.length / m.children_invited.length;
      if (rate < 0.5) {
        alerts.push({
          type: "low_attendance",
          severity: "medium",
          message: `Low attendance at ${m.meeting_type.replace(/_/g, " ")} on ${m.meeting_date} — ${m.children_attended.length}/${m.children_invited.length} children attended. Consider barriers to participation`,
          id: m.id,
        });
      }
    }
  }

  // ── Actions not fed back to children (medium) ────────────────────────
  for (const m of completedMeetings) {
    for (const a of m.actions) {
      if (
        (a.status === "implemented" || a.status === "not_possible") &&
        !a.feedback_to_children
      ) {
        alerts.push({
          type: "no_feedback_to_children",
          severity: "medium",
          message: `Action from ${m.meeting_type.replace(/_/g, " ")} on ${m.meeting_date} — "${a.action}" — outcome not fed back to children`,
          id: m.id,
        });
      }
    }
  }

  // ── Children not participating at all (high) ─────────────────────────
  if (totalChildren > 0) {
    const participatingChildren = new Set<string>();
    for (const m of completedMeetings) {
      for (const c of m.children_attended) {
        participatingChildren.add(c);
      }
    }
    for (const c of consultations) {
      participatingChildren.add(c.child_id);
    }
    const nonParticipating = totalChildren - participatingChildren.size;
    if (nonParticipating > 0) {
      alerts.push({
        type: "children_not_participating",
        severity: "high",
        message: `${nonParticipating} child(ren) have not participated in any meetings or consultations — Reg 7 requires all children's views to be sought`,
        id: completedMeetings.length > 0 ? completedMeetings[0].id : "system",
      });
    }
  }

  // ── Consultations where child not informed of outcome (medium) ───────
  for (const c of consultations) {
    if (c.outcome && !c.child_informed_of_outcome) {
      alerts.push({
        type: "child_not_informed",
        severity: "medium",
        message: `${c.child_name} not informed of outcome for consultation on ${c.consultation_date} about ${c.topic.replace(/_/g, " ")}`,
        id: c.id,
      });
    }
  }

  // ── Child dissatisfied with response (medium) ────────────────────────
  for (const c of consultations) {
    if (c.child_satisfied_with_response === false) {
      alerts.push({
        type: "child_dissatisfied",
        severity: "medium",
        message: `${c.child_name} expressed dissatisfaction with response to consultation on ${c.consultation_date} — follow-up required`,
        id: c.id,
      });
    }
  }

  // ── Safety concern raised not actioned (critical) ────────────────────
  for (const m of completedMeetings) {
    for (const t of m.topics) {
      if (t.category === "safety_concerns") {
        const relatedActions = m.actions.filter(
          (a) => a.status === "pending" || a.status === "in_progress",
        );
        if (relatedActions.length === 0 && m.actions.length === 0) {
          alerts.push({
            type: "safety_concern_no_action",
            severity: "critical",
            message: `Safety concern raised in ${m.meeting_type.replace(/_/g, " ")} on ${m.meeting_date} — no actions recorded. Safeguarding response required`,
            id: m.id,
          });
        }
      }
    }
  }

  return alerts;
}

// ── CRUD — Participation Meetings ────────────────────────────────────────

export async function listMeetings(
  homeId: string,
  filters?: {
    meetingType?: MeetingType;
    status?: MeetingStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<ParticipationMeeting[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_participation_meetings") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.meetingType) q = q.eq("meeting_type", filters.meetingType);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("meeting_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("meeting_date", filters.dateTo);
  q = q.order("meeting_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMeeting(
  input: {
    homeId: string;
    meetingType: MeetingType;
    meetingDate: string;
    scheduledTime?: string;
    durationMinutes?: number;
    facilitator: string;
    childrenInvited?: string[];
    childrenAttended?: string[];
    staffPresent?: string[];
    topics?: { category: TopicCategory; description: string; raised_by: string; discussion_summary: string }[];
    decisionsMade?: string[];
    actions?: { action: string; assigned_to: string; due_date: string; status: ActionOutcome; feedback_to_children: string }[];
    childSatisfactionCollected?: boolean;
    overallEngagement?: "high" | "moderate" | "low";
    status?: MeetingStatus;
    notes?: string;
  },
): Promise<ServiceResult<ParticipationMeeting>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_participation_meetings") as SB)
    .insert({
      home_id: input.homeId,
      meeting_type: input.meetingType,
      meeting_date: input.meetingDate,
      scheduled_time: input.scheduledTime ?? null,
      duration_minutes: input.durationMinutes ?? null,
      facilitator: input.facilitator,
      children_invited: input.childrenInvited ?? [],
      children_attended: input.childrenAttended ?? [],
      staff_present: input.staffPresent ?? [],
      topics: input.topics ?? [],
      decisions_made: input.decisionsMade ?? [],
      actions: input.actions ?? [],
      child_satisfaction_collected: input.childSatisfactionCollected ?? false,
      overall_engagement: input.overallEngagement ?? null,
      status: input.status ?? "scheduled",
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
): Promise<ServiceResult<ParticipationMeeting>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_participation_meetings") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Child Consultations ───────────────────────────────────────────

export async function listConsultations(
  homeId: string,
  filters?: {
    childId?: string;
    topic?: TopicCategory;
    limit?: number;
  },
): Promise<ServiceResult<ChildConsultation[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_consultations") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.topic) q = q.eq("topic", filters.topic);
  q = q.order("consultation_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createConsultation(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    consultationDate?: string;
    consultedBy: string;
    topic: TopicCategory;
    context: string;
    childViews: string;
    childPreferences?: string;
    outcome?: string;
    actionTaken?: string;
    childInformedOfOutcome?: boolean;
    childSatisfiedWithResponse?: boolean;
    notes?: string;
  },
): Promise<ServiceResult<ChildConsultation>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_consultations") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      consultation_date: input.consultationDate ?? todayStr(),
      consulted_by: input.consultedBy,
      topic: input.topic,
      context: input.context,
      child_views: input.childViews,
      child_preferences: input.childPreferences ?? null,
      outcome: input.outcome ?? null,
      action_taken: input.actionTaken ?? null,
      child_informed_of_outcome: input.childInformedOfOutcome ?? false,
      child_satisfied_with_response: input.childSatisfiedWithResponse ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeParticipationMetrics,
  identifyParticipationAlerts,
};
