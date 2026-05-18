// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S MEETINGS & CONSULTATION SERVICE
// Manages house meetings, children's councils, consultation records, and
// feedback tracking. Evidence base for Reg 7 (children's wishes and feelings),
// Reg 16 (consultation with children), and SCCIF Overall Experiences judgment.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface HouseMeeting {
  id: string;
  home_id: string;
  meeting_date: string;
  meeting_type: string;
  facilitated_by: string;
  children_present: string[];
  children_absent: string[];
  agenda_items: AgendaItem[];
  actions: MeetingAction[];
  child_feedback_summary: string;
  staff_response: string;
  next_meeting_date?: string | null;
  minutes_approved: boolean;
  approved_by?: string | null;
  created_at: string;
}

export interface AgendaItem {
  topic: string;
  raised_by: string;
  discussion_summary: string;
  outcome: string;
}

export interface MeetingAction {
  description: string;
  assigned_to: string;
  due_date: string;
  status: "pending" | "completed" | "overdue";
}

export interface ConsultationRecord {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  consultation_date: string;
  consultation_type: string;
  topic: string;
  child_views: string;
  outcome: string;
  action_taken?: string | null;
  consulted_by: string;
  impact_rating: string;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const MEETING_TYPES: { type: string; label: string; frequency: string }[] = [
  { type: "house_meeting", label: "House Meeting", frequency: "Weekly" },
  { type: "childrens_council", label: "Children's Council", frequency: "Monthly" },
  { type: "menu_planning", label: "Menu Planning Meeting", frequency: "Weekly" },
  { type: "activities_planning", label: "Activities Planning", frequency: "Monthly" },
  { type: "complaints_review", label: "Complaints Review", frequency: "As needed" },
  { type: "rules_review", label: "House Rules Review", frequency: "Quarterly" },
];

export const CONSULTATION_TYPES: { type: string; label: string; regulation: string }[] = [
  { type: "care_plan", label: "Care Plan Consultation", regulation: "Reg 7(2)(a)" },
  { type: "placement_plan", label: "Placement Plan Review", regulation: "Reg 7(2)(a)" },
  { type: "daily_life", label: "Daily Living Arrangements", regulation: "Reg 7(2)(b)" },
  { type: "education", label: "Education Decisions", regulation: "Reg 8" },
  { type: "health", label: "Health Decisions", regulation: "Reg 10" },
  { type: "contact", label: "Contact Arrangements", regulation: "Reg 11" },
  { type: "behaviour_support", label: "Behaviour Support Approach", regulation: "Reg 19" },
  { type: "activities", label: "Activities & Hobbies", regulation: "Reg 9" },
  { type: "complaints", label: "Complaints Process", regulation: "Reg 39" },
  { type: "moving_on", label: "Leaving Care Planning", regulation: "Reg 14" },
];

export const IMPACT_RATINGS: string[] = [
  "no_impact", "minor_impact", "moderate_impact", "significant_impact", "transformative",
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute meeting compliance and participation metrics.
 */
function computeMeetingCompliance(
  meetings: HouseMeeting[],
  totalChildren: number,
): {
  total_meetings: number;
  by_type: Record<string, number>;
  avg_attendance: number;
  attendance_rate: number;
  total_actions: number;
  actions_completed: number;
  actions_overdue: number;
  action_completion_rate: number;
  minutes_approved_rate: number;
} {
  const total = meetings.length;

  // By type
  const byType: Record<string, number> = {};
  for (const m of meetings) {
    byType[m.meeting_type] = (byType[m.meeting_type] ?? 0) + 1;
  }

  // Attendance
  let totalAttendance = 0;
  for (const m of meetings) {
    totalAttendance += m.children_present.length;
  }
  const avgAttendance = total > 0
    ? Math.round((totalAttendance / total) * 10) / 10
    : 0;

  const attendanceRate = total > 0 && totalChildren > 0
    ? Math.round((totalAttendance / (total * totalChildren)) * 100)
    : 0;

  // Actions
  const allActions = meetings.flatMap((m) => m.actions);
  const actionsCompleted = allActions.filter((a) => a.status === "completed").length;
  const actionsOverdue = allActions.filter((a) => a.status === "overdue").length;
  const actionCompletionRate = allActions.length > 0
    ? Math.round((actionsCompleted / allActions.length) * 100)
    : 0;

  // Minutes approved
  const approved = meetings.filter((m) => m.minutes_approved).length;
  const minutesApprovedRate = total > 0
    ? Math.round((approved / total) * 100)
    : 0;

  return {
    total_meetings: total,
    by_type: byType,
    avg_attendance: avgAttendance,
    attendance_rate: attendanceRate,
    total_actions: allActions.length,
    actions_completed: actionsCompleted,
    actions_overdue: actionsOverdue,
    action_completion_rate: actionCompletionRate,
    minutes_approved_rate: minutesApprovedRate,
  };
}

/**
 * Compute consultation metrics — how well children are being consulted.
 */
function computeConsultationMetrics(
  consultations: ConsultationRecord[],
  totalChildren: number,
): {
  total_consultations: number;
  children_consulted: number;
  consultation_rate: number;
  by_type: Record<string, number>;
  avg_impact: number;
  with_action_taken: number;
  action_rate: number;
} {
  const total = consultations.length;

  // Unique children consulted
  const childrenConsulted = new Set(consultations.map((c) => c.child_id)).size;
  const consultationRate = totalChildren > 0
    ? Math.round((childrenConsulted / totalChildren) * 100)
    : 0;

  // By type
  const byType: Record<string, number> = {};
  for (const c of consultations) {
    byType[c.consultation_type] = (byType[c.consultation_type] ?? 0) + 1;
  }

  // Average impact
  let impactSum = 0;
  for (const c of consultations) {
    const idx = IMPACT_RATINGS.indexOf(c.impact_rating);
    impactSum += idx >= 0 ? idx : 0;
  }
  const avgImpact = total > 0
    ? Math.round((impactSum / total) * 100) / 100
    : 0;

  // With action taken
  const withAction = consultations.filter(
    (c) => c.action_taken && c.action_taken.trim().length > 0,
  ).length;
  const actionRate = total > 0
    ? Math.round((withAction / total) * 100)
    : 0;

  return {
    total_consultations: total,
    children_consulted: childrenConsulted,
    consultation_rate: consultationRate,
    by_type: byType,
    avg_impact: avgImpact,
    with_action_taken: withAction,
    action_rate: actionRate,
  };
}

/**
 * Identify alerts related to meetings and consultation.
 */
function identifyMeetingAlerts(
  meetings: HouseMeeting[],
  consultations: ConsultationRecord[],
  totalChildren: number,
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];

  // No meetings in last 14 days (compare at day granularity to avoid time-of-day drift)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const recentMeetings = meetings.filter((m) => {
    const meetingDate = new Date(m.meeting_date);
    const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
    return todayStart.getTime() - meetingDay.getTime() <= fourteenDaysMs;
  });
  if (recentMeetings.length === 0 && meetings.length > 0) {
    alerts.push({
      type: "no_recent_meeting",
      severity: "medium",
      message: "No house meeting recorded in the last 14 days — Reg 16 requires regular consultation with children.",
    });
  }

  // Overdue meeting actions
  const overdueActions = meetings.flatMap((m) => m.actions).filter((a) => a.status === "overdue");
  if (overdueActions.length > 0) {
    alerts.push({
      type: "overdue_actions",
      severity: "medium",
      message: `${overdueActions.length} meeting action${overdueActions.length > 1 ? "s" : ""} overdue — children may perceive their views are not being acted upon.`,
    });
  }

  // Children never consulted
  const consultedChildren = new Set(consultations.map((c) => c.child_id));
  const unconsultedCount = totalChildren - consultedChildren.size;
  if (unconsultedCount > 0 && totalChildren > 0) {
    alerts.push({
      type: "unconsulted_children",
      severity: "high",
      message: `${unconsultedCount} of ${totalChildren} children have no consultation records — Reg 7 requires seeking each child's wishes and feelings.`,
    });
  }

  // Low attendance rate
  if (meetings.length > 0 && totalChildren > 0) {
    let totalAttendance = 0;
    for (const m of meetings) totalAttendance += m.children_present.length;
    const rate = (totalAttendance / (meetings.length * totalChildren)) * 100;
    if (rate < 50) {
      alerts.push({
        type: "low_attendance",
        severity: "medium",
        message: `Meeting attendance rate is ${Math.round(rate)}% — consider whether meeting format engages all children.`,
      });
    }
  }

  // Unapproved minutes
  const unapproved = meetings.filter((m) => !m.minutes_approved);
  if (unapproved.length > 0) {
    alerts.push({
      type: "unapproved_minutes",
      severity: "low",
      message: `${unapproved.length} set${unapproved.length > 1 ? "s" : ""} of meeting minutes not yet approved.`,
    });
  }

  return alerts;
}

// ── CRUD — House Meetings ───────────────────────────────────────────────────

export async function listMeetings(
  homeId: string,
  filters?: {
    meetingType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<HouseMeeting[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<HouseMeeting[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<HouseMeeting[]>;

  let q = (s.from("cs_house_meetings") as SB).select("*").eq("home_id", homeId);
  if (filters?.meetingType) q = q.eq("meeting_type", filters.meetingType);
  if (filters?.dateFrom) q = q.gte("meeting_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("meeting_date", filters.dateTo);
  q = q.order("meeting_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMeeting(
  input: Omit<HouseMeeting, "id" | "created_at">,
): Promise<ServiceResult<HouseMeeting>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_house_meetings") as SB)
    .insert({
      home_id: input.home_id,
      meeting_date: input.meeting_date,
      meeting_type: input.meeting_type,
      facilitated_by: input.facilitated_by,
      children_present: input.children_present,
      children_absent: input.children_absent,
      agenda_items: input.agenda_items,
      actions: input.actions,
      child_feedback_summary: input.child_feedback_summary,
      staff_response: input.staff_response,
      next_meeting_date: input.next_meeting_date ?? null,
      minutes_approved: input.minutes_approved,
      approved_by: input.approved_by ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateMeeting(
  id: string,
  updates: Partial<HouseMeeting>,
): Promise<ServiceResult<HouseMeeting>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_house_meetings") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Consultation Records ─────────────────────────────────────────────

export async function listConsultations(
  homeId: string,
  filters?: {
    childId?: string;
    consultationType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<ConsultationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<ConsultationRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<ConsultationRecord[]>;

  let q = (s.from("cs_consultation_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.consultationType) q = q.eq("consultation_type", filters.consultationType);
  if (filters?.dateFrom) q = q.gte("consultation_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("consultation_date", filters.dateTo);
  q = q.order("consultation_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createConsultation(
  input: Omit<ConsultationRecord, "id" | "created_at">,
): Promise<ServiceResult<ConsultationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_consultation_records") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      consultation_date: input.consultation_date,
      consultation_type: input.consultation_type,
      topic: input.topic,
      child_views: input.child_views,
      outcome: input.outcome,
      action_taken: input.action_taken ?? null,
      consulted_by: input.consulted_by,
      impact_rating: input.impact_rating,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeMeetingCompliance,
  computeConsultationMetrics,
  identifyMeetingAlerts,
};
