// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEETINGS & CHILDREN'S VOICE INTELLIGENCE ENGINE
// Pure deterministic engine for house meetings and children's participation.
// Reg 7 (wishes & feelings), Reg 16 (consultation with children), SCCIF
// Experiences & Progress, Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

export interface MeetingActionInput {
  action: string;
  owner: string;
  completed: boolean;
}

export interface NewActionInput {
  action: string;
  owner: string;
  due_date: string;
}

export interface HouseMeetingInput {
  id: string;
  date: string;
  meeting_type: string;
  chair_person: string;
  children_present: string[];
  children_absent: string[];
  staff_present: string[];
  child_feedback: string[];
  actions_from_previous: MeetingActionInput[];
  new_actions: NewActionInput[];
  duration: number;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface MeetingsOverview {
  total_meetings: number;
  meetings_last_30_days: number;
  avg_attendance_rate: number;
  total_actions: number;
  actions_completed: number;
  actions_overdue: number;
  action_completion_rate: number;
  avg_duration_minutes: number;
  children_never_attended: number;
}

export interface MeetingTypeBreakdown {
  meeting_type: string;
  type_label: string;
  count: number;
}

export interface ChildParticipationProfile {
  child_id: string;
  child_name: string;
  meetings_attended: number;
  meetings_absent: number;
  attendance_rate: number;
  feedback_given: number;
  risk_flags: string[];
}

export interface MeetingsAlert {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaMeetingsInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface MeetingsIntelligenceResult {
  overview: MeetingsOverview;
  type_breakdown: MeetingTypeBreakdown[];
  child_participation: ChildParticipationProfile[];
  alerts: MeetingsAlert[];
  insights: AriaMeetingsInsight[];
}

interface EngineInput {
  meetings: HouseMeetingInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const TYPE_LABELS: Record<string, string> = {
  regular: "Regular",
  special: "Special",
  emergency: "Emergency",
  welcome: "Welcome",
  feedback: "Feedback",
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeMeetingsIntelligence(input: EngineInput): MeetingsIntelligenceResult {
  const { meetings, children, staff, today = new Date().toISOString().slice(0, 10) } = input;

  if (meetings.length === 0) {
    return {
      overview: {
        total_meetings: 0, meetings_last_30_days: 0, avg_attendance_rate: 0,
        total_actions: 0, actions_completed: 0, actions_overdue: 0,
        action_completion_rate: 0, avg_duration_minutes: 0,
        children_never_attended: children.length,
      },
      type_breakdown: [],
      child_participation: [],
      alerts: [],
      insights: [],
    };
  }

  const childMap = new Map(children.map((c) => [c.id, c.name]));

  // ── Overview ────────────────────────────────────────────────────────────
  const last30 = meetings.filter((m) => {
    const d = daysBetween(m.date, today);
    return d >= 0 && d <= 30;
  });

  // Attendance rate: children_present / (children_present + children_absent)
  let totalPresent = 0;
  let totalExpected = 0;
  for (const m of meetings) {
    totalPresent += m.children_present.length;
    totalExpected += m.children_present.length + m.children_absent.length;
  }
  const avgAttendanceRate = totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0;

  // Actions
  let totalActions = 0;
  let actionsCompleted = 0;
  for (const m of meetings) {
    totalActions += m.actions_from_previous.length;
    actionsCompleted += m.actions_from_previous.filter((a) => a.completed).length;
  }

  // Overdue new actions (due_date < today and we assume not completed if they appear as new_actions)
  let actionsOverdue = 0;
  for (const m of meetings) {
    for (const a of m.new_actions) {
      if (daysBetween(a.due_date, today) > 0) {
        actionsOverdue++;
      }
    }
  }

  const actionCompletionRate = totalActions > 0 ? Math.round((actionsCompleted / totalActions) * 100) : 100;

  const avgDuration = meetings.length > 0
    ? Math.round(meetings.reduce((sum, m) => sum + m.duration, 0) / meetings.length)
    : 0;

  // Children who never attended any meeting
  const allAttendees = new Set<string>();
  for (const m of meetings) {
    for (const cid of m.children_present) allAttendees.add(cid);
  }
  const neverAttended = children.filter((c) => !allAttendees.has(c.id));

  const overview: MeetingsOverview = {
    total_meetings: meetings.length,
    meetings_last_30_days: last30.length,
    avg_attendance_rate: avgAttendanceRate,
    total_actions: totalActions,
    actions_completed: actionsCompleted,
    actions_overdue: actionsOverdue,
    action_completion_rate: actionCompletionRate,
    avg_duration_minutes: avgDuration,
    children_never_attended: neverAttended.length,
  };

  // ── Type breakdown ──────────────────────────────────────────────────────
  const typeCounts = new Map<string, number>();
  for (const m of meetings) {
    typeCounts.set(m.meeting_type, (typeCounts.get(m.meeting_type) ?? 0) + 1);
  }
  const type_breakdown: MeetingTypeBreakdown[] = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      meeting_type: type,
      type_label: typeLabel(type),
      count,
    }));

  // ── Child participation profiles ────────────────────────────────────────
  const childStats = new Map<string, { attended: number; absent: number; feedback: number }>();
  for (const c of children) {
    childStats.set(c.id, { attended: 0, absent: 0, feedback: 0 });
  }
  for (const m of meetings) {
    for (const cid of m.children_present) {
      const stat = childStats.get(cid);
      if (stat) stat.attended++;
    }
    for (const cid of m.children_absent) {
      const stat = childStats.get(cid);
      if (stat) stat.absent++;
    }
  }

  // Count feedback per child (we attribute meeting feedback equally since we can't tie to individual)
  // Instead count meetings attended as proxy for feedback opportunity
  // For more precise tracking, count meetings where child_feedback has entries and child was present
  for (const m of meetings) {
    if (m.child_feedback.length > 0) {
      for (const cid of m.children_present) {
        const stat = childStats.get(cid);
        if (stat) stat.feedback++;
      }
    }
  }

  const child_participation: ChildParticipationProfile[] = [...childStats.entries()]
    .map(([childId, stat]) => {
      const total = stat.attended + stat.absent;
      const attendanceRate = total > 0 ? Math.round((stat.attended / total) * 100) : 0;

      const risk_flags: string[] = [];
      if (stat.attended === 0 && meetings.length > 0) risk_flags.push("never_attended");
      if (attendanceRate < 50 && total > 0) risk_flags.push("low_attendance");
      if (stat.feedback === 0 && meetings.length > 0) risk_flags.push("no_feedback");

      return {
        child_id: childId,
        child_name: childMap.get(childId) ?? childId,
        meetings_attended: stat.attended,
        meetings_absent: stat.absent,
        attendance_rate: attendanceRate,
        feedback_given: stat.feedback,
        risk_flags,
      };
    })
    .sort((a, b) => b.meetings_attended - a.meetings_attended);

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: MeetingsAlert[] = [];

  // High: children who never attended
  if (neverAttended.length > 0) {
    alerts.push({
      type: "never_attended",
      severity: "high",
      message: `${neverAttended.map((c) => c.name).join(", ")} ha${neverAttended.length > 1 ? "ve" : "s"} never attended a house meeting. Reg 7 requires seeking each child's wishes and feelings.`,
    });
  }

  // Medium: overdue actions
  if (actionsOverdue > 0) {
    alerts.push({
      type: "overdue_actions",
      severity: "medium",
      message: `${actionsOverdue} meeting action${actionsOverdue > 1 ? "s" : ""} overdue. Children may perceive their views are not being acted upon.`,
    });
  }

  // Medium: low action completion rate
  if (actionCompletionRate < 70 && totalActions > 0) {
    alerts.push({
      type: "low_completion",
      severity: "medium",
      message: `Action completion rate is ${actionCompletionRate}% (${actionsCompleted}/${totalActions}). Review whether actions are realistic and time-bound.`,
    });
  }

  // Low: no meeting in last 14 days
  const recentMeetings = meetings.filter((m) => daysBetween(m.date, today) >= 0 && daysBetween(m.date, today) <= 14);
  if (recentMeetings.length === 0 && meetings.length > 0) {
    alerts.push({
      type: "no_recent_meeting",
      severity: "low",
      message: "No house meeting in the last 14 days. Regular meetings ensure children's voices are heard per Reg 16.",
    });
  }

  // ── ARIA Insights ──────────────────────────────────────────────────────
  const insights: AriaMeetingsInsight[] = [];

  // Warning: children never attended
  if (neverAttended.length > 0) {
    insights.push({
      severity: "warning",
      text: `${neverAttended.map((c) => c.name).join(" and ")} ha${neverAttended.length > 1 ? "ve" : "s"} not attended any house meeting. Cross-reference with key work sessions — if their voice is also absent from daily logs, this is a significant Reg 7 gap.`,
    });
  }

  // Warning: low attendance rate
  if (avgAttendanceRate < 70 && meetings.length > 0) {
    insights.push({
      severity: "warning",
      text: `Average attendance rate is ${avgAttendanceRate}%. Review barriers to participation — timing, engagement, or relationship issues may be affecting children's willingness to attend.`,
    });
  }

  // Warning: overdue actions
  if (actionsOverdue >= 3) {
    insights.push({
      severity: "warning",
      text: `${actionsOverdue} meeting actions overdue. Action completion dropped to ${actionCompletionRate}%. Children's council feedback shows they notice when promises aren't kept.`,
    });
  }

  // Positive: high attendance
  if (avgAttendanceRate >= 80 && meetings.length > 0) {
    insights.push({
      severity: "positive",
      text: `${avgAttendanceRate}% attendance rate at house meetings. Children are actively engaging with consultation processes. Reg 16 participation requirements met.`,
    });
  }

  // Positive: all children attended
  if (neverAttended.length === 0 && children.length > 0 && meetings.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children have attended at least one house meeting. Children's voices are being actively sought per Reg 7.`,
    });
  }

  // Positive: high action completion
  if (actionCompletionRate >= 80 && totalActions > 0) {
    insights.push({
      severity: "positive",
      text: `${actionCompletionRate}% action completion rate (${actionsCompleted}/${totalActions}). Demonstrates that children's views lead to tangible outcomes.`,
    });
  }

  // Positive: regular meetings
  if (last30.length >= 2) {
    insights.push({
      severity: "positive",
      text: `${last30.length} meetings in the last 30 days. Regular consultation schedule maintained per Reg 16.`,
    });
  }

  // Positive: child feedback recorded
  const meetingsWithFeedback = meetings.filter((m) => m.child_feedback.length > 0);
  if (meetingsWithFeedback.length === meetings.length && meetings.length > 0) {
    insights.push({
      severity: "positive",
      text: `Children's feedback recorded at all ${meetings.length} meetings. Evidence of child voice in decision-making.`,
    });
  }

  return {
    overview,
    type_breakdown,
    child_participation,
    alerts,
    insights,
  };
}
