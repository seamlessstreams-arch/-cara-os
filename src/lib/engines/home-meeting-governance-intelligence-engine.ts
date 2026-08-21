// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MEETING GOVERNANCE INTELLIGENCE ENGINE
// Home-level: analyses house meeting regularity, action completion,
// child attendance, feedback quality, and governance structure.
// CHR 2015 Reg 45 (Review of Quality of Care). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MeetingActionInput {
  completed: boolean;
}

export interface HouseMeetingInput {
  id: string;
  date: string;
  meeting_type: string;                  // regular | extraordinary | emergency
  children_present_count: number;
  children_absent_count: number;
  staff_present_count: number;
  agenda_item_count: number;
  child_raised_count: number;            // agenda items raised by children
  feedback_count: number;                // child feedback entries
  actions_from_previous: MeetingActionInput[];
  new_actions_count: number;
  has_general_comments: boolean;
  duration_minutes: number;
}

export interface HomeMeetingGovernanceInput {
  today: string;
  meetings: HouseMeetingInput[];
  total_children: number;
  lookback_days?: number;                // default 90
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MeetingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RegularityProfile {
  total_meetings: number;
  meetings_per_month: number;
  avg_days_between: number | null;
  max_gap_days: number;
  regular_count: number;
  extraordinary_count: number;
}

export interface AttendanceProfile {
  avg_child_attendance_rate: number | null;
  full_attendance_count: number;         // meetings where all children present
  avg_staff_present: number | null;
  lowest_attendance_rate: number | null;
}

export interface ActionProfile {
  total_previous_actions: number;
  completed_count: number;
  completion_rate: number | null;
  total_new_actions: number;
  avg_new_per_meeting: number | null;
}

export interface EngagementProfile {
  avg_agenda_items: number | null;
  child_raised_rate: number | null;             // % of agenda items raised by children
  avg_feedback_count: number | null;
  meetings_with_feedback: number;
  avg_duration: number | null;
}

export interface MeetingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface MeetingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeMeetingGovernanceResult {
  meeting_rating: MeetingRating;
  meeting_score: number | null;
  headline: string;
  regularity_profile: RegularityProfile;
  attendance_profile: AttendanceProfile;
  action_profile: ActionProfile;
  engagement_profile: EngagementProfile;
  strengths: string[];
  concerns: string[];
  recommendations: MeetingRecommendation[];
  insights: MeetingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MeetingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeMeetingGovernance(
  input: HomeMeetingGovernanceInput,
): HomeMeetingGovernanceResult {
  const { today, lookback_days = 90 } = input;

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - lookback_days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const meetings = input.meetings.filter(m => m.date >= cutoffStr && m.date <= today);

  if (meetings.length === 0) {
    return {
      meeting_rating: "insufficient_data",
      meeting_score: 0,
      headline: "No house meetings recorded — governance cannot be assessed.",
      regularity_profile: emptyRegularity(),
      attendance_profile: emptyAttendance(),
      action_profile: emptyAction(),
      engagement_profile: emptyEngagement(),
      strengths: [],
      concerns: ["No house meetings recorded — children have a right to contribute to decisions about their home."],
      recommendations: [{ rank: 1, recommendation: "Establish regular house meetings to give children a voice in how the home is run.", urgency: "immediate", regulatory_ref: "Reg 45" }],
      insights: [{ text: "No house meetings found within the review period. House meetings are a fundamental mechanism for children to participate in decisions about their care and the running of the home. Ofsted views the absence of regular meetings as a serious governance gap that undermines children's rights.", severity: "critical" }],
    };
  }

  const sorted = [...meetings].sort((a, b) => a.date.localeCompare(b.date));

  // ── Regularity Profile ─────────────────────────────────────────────
  const months = lookback_days / 30;
  const meetingsPerMonth = Math.round((meetings.length / months) * 10) / 10;

  let totalGap = 0;
  let maxGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1].date, sorted[i].date);
    totalGap += gap;
    if (gap > maxGap) maxGap = gap;
  }
  // Also check gap from last meeting to today
  if (sorted.length > 0) {
    const gapToToday = daysBetween(sorted[sorted.length - 1].date, today);
    if (gapToToday > maxGap) maxGap = gapToToday;
  }
  const avgDaysBetween = sorted.length > 1
    ? Math.round(totalGap / (sorted.length - 1))
    : null;

  const regular = meetings.filter(m => m.meeting_type === "regular");
  const extraordinary = meetings.filter(m => m.meeting_type !== "regular");

  const regularityProfile: RegularityProfile = {
    total_meetings: meetings.length,
    meetings_per_month: meetingsPerMonth,
    avg_days_between: avgDaysBetween,
    max_gap_days: maxGap,
    regular_count: regular.length,
    extraordinary_count: extraordinary.length,
  };

  // ── Attendance Profile ─────────────────────────────────────────────
  const attendanceRates = meetings.map(m => {
    const total = m.children_present_count + m.children_absent_count;
    return total > 0 ? pct(m.children_present_count, total) : 100;
  });
  const avgAttendance = attendanceRates.length > 0
    ? Math.round(attendanceRates.reduce((s, r) => s + r, 0) / attendanceRates.length)
    : null;
  const fullAttendance = meetings.filter(m => m.children_absent_count === 0).length;
  const avgStaff = meetings.length > 0
    ? Math.round((meetings.reduce((s, m) => s + m.staff_present_count, 0) / meetings.length) * 10) / 10
    : null;
  const lowestRate = attendanceRates.length > 0 ? Math.min(...attendanceRates) : null;

  const attendanceProfile: AttendanceProfile = {
    avg_child_attendance_rate: avgAttendance,
    full_attendance_count: fullAttendance,
    avg_staff_present: avgStaff,
    lowest_attendance_rate: lowestRate,
  };

  // ── Action Profile ─────────────────────────────────────────────────
  const allPrevActions = meetings.flatMap(m => m.actions_from_previous);
  const completedActions = allPrevActions.filter(a => a.completed);
  const totalNewActions = meetings.reduce((s, m) => s + m.new_actions_count, 0);
  const avgNewPerMeeting = meetings.length > 0
    ? Math.round((totalNewActions / meetings.length) * 10) / 10
    : null;

  const actionProfile: ActionProfile = {
    total_previous_actions: allPrevActions.length,
    completed_count: completedActions.length,
    completion_rate: pct(completedActions.length, allPrevActions.length),
    total_new_actions: totalNewActions,
    avg_new_per_meeting: avgNewPerMeeting,
  };

  // ── Engagement Profile ─────────────────────────────────────────────
  const totalAgendaItems = meetings.reduce((s, m) => s + m.agenda_item_count, 0);
  const totalChildRaised = meetings.reduce((s, m) => s + m.child_raised_count, 0);
  const totalFeedback = meetings.reduce((s, m) => s + m.feedback_count, 0);
  const meetingsWithFeedback = meetings.filter(m => m.feedback_count > 0).length;
  const avgDuration = meetings.length > 0
    ? Math.round(meetings.reduce((s, m) => s + m.duration_minutes, 0) / meetings.length)
    : null;

  const engagementProfile: EngagementProfile = {
    avg_agenda_items: meetings.length > 0 ? Math.round((totalAgendaItems / meetings.length) * 10) / 10 : null,
    child_raised_rate: pct(totalChildRaised, totalAgendaItems),
    avg_feedback_count: meetings.length > 0 ? Math.round((totalFeedback / meetings.length) * 10) / 10 : null,
    meetings_with_feedback: meetingsWithFeedback,
    avg_duration: avgDuration,
  };

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Meeting frequency (±5)
  if (meetingsPerMonth >= 3) score += 5;
  else if (meetingsPerMonth >= 2) score += 3;
  else if (meetingsPerMonth >= 1) score += 1;
  else score -= 4;

  // 2. Child attendance (±4)
  if ((avgAttendance ?? 0) >= 90) score += 4;
  else if ((avgAttendance ?? 0) >= 70) score += 2;
  else if ((avgAttendance ?? 0) >= 50) score -= 1;
  else score -= 3;

  // 3. Action completion (±3)
  if (allPrevActions.length > 0) {
    if ((actionProfile.completion_rate ?? 0) >= 80) score += 3;
    else if ((actionProfile.completion_rate ?? 0) >= 50) score += 1;
    else score -= 2;
  } else {
    score += 1; // No previous actions = no concern
  }

  // 4. Child engagement / items raised by children (±4)
  if (totalAgendaItems > 0) {
    if ((engagementProfile.child_raised_rate ?? 0) >= 50) score += 4;
    else if ((engagementProfile.child_raised_rate ?? 0) >= 30) score += 2;
    else if ((engagementProfile.child_raised_rate ?? 0) >= 10) score += 0;
    else score -= 2;
  } else {
    score -= 2;
  }

  // 5. Feedback recording (±3)
  if (meetings.length > 0) {
    const feedbackRate = pct(meetingsWithFeedback, meetings.length);
    if (feedbackRate >= 80) score += 3;
    else if (feedbackRate >= 50) score += 1;
    else score -= 2;
  }

  // 6. Meeting regularity / gaps (±3)
  if (maxGap <= 10) score += 3;
  else if (maxGap <= 14) score += 1;
  else if (maxGap <= 21) score -= 1;
  else score -= 3;

  // 7. Duration quality (±3)
  if ((avgDuration ?? 0) >= 25 && (avgDuration ?? 0) <= 60) score += 3;
  else if ((avgDuration ?? 0) >= 15) score += 1;
  else score -= 2;

  // 8. Comments / documentation (±3)
  if (meetings.length > 0) {
    const withComments = meetings.filter(m => m.has_general_comments).length;
    const commentRate = pct(withComments, meetings.length);
    if (commentRate >= 80) score += 3;
    else if (commentRate >= 50) score += 1;
    else score -= 2;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meetingsPerMonth >= 3) strengths.push(`${meetingsPerMonth} meetings per month — frequent, regular engagement with children.`);
  if ((avgAttendance ?? 0) >= 90) strengths.push(`${(avgAttendance ?? 0)}% average child attendance — children are actively participating in meetings.`);
  if ((actionProfile.completion_rate ?? 0) >= 80 && allPrevActions.length > 0) strengths.push(`${(actionProfile.completion_rate ?? 0)}% action completion rate — children see their concerns followed through.`);
  if ((engagementProfile.child_raised_rate ?? 0) >= 50 && totalAgendaItems > 0) strengths.push(`${(engagementProfile.child_raised_rate ?? 0)}% of agenda items raised by children — child-led governance.`);
  if (meetingsWithFeedback === meetings.length && meetings.length > 0) strengths.push("Child feedback recorded at every meeting — views are systematically captured.");
  if (maxGap <= 10) strengths.push("No gap exceeds 10 days between meetings — consistent governance rhythm.");

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (meetingsPerMonth < 1) concerns.push(`Only ${meetingsPerMonth} meetings per month — house meetings should be held at least weekly.`);
  if ((avgAttendance ?? 0) < 70) concerns.push(`Only ${(avgAttendance ?? 0)}% average child attendance — many children are missing opportunities to have their voice heard.`);
  if (allPrevActions.length > 0 && (actionProfile.completion_rate ?? 0) < 50) concerns.push(`Only ${(actionProfile.completion_rate ?? 0)}% of actions completed — children may lose trust if their concerns are not followed through.`);
  if (maxGap > 21) concerns.push(`Longest gap between meetings is ${maxGap} days — regularity is essential for governance.`);
  if (meetingsWithFeedback === 0 && meetings.length > 0) concerns.push("No child feedback recorded at any meeting — children's views must be captured.");
  if (totalAgendaItems > 0 && (engagementProfile.child_raised_rate ?? 0) < 10) concerns.push(`Only ${(engagementProfile.child_raised_rate ?? 0)}% of items raised by children — meetings may be staff-driven rather than child-led.`);

  // ── Recommendations ───────────────────────────────────────────────
  const recs: MeetingRecommendation[] = [];
  let rank = 1;

  if (meetingsPerMonth < 1) {
    recs.push({ rank: rank++, recommendation: "Increase meeting frequency to at least weekly — children need regular opportunities to contribute.", urgency: "immediate", regulatory_ref: "Reg 45" });
  }
  if (allPrevActions.length > 0 && (actionProfile.completion_rate ?? 0) < 50) {
    recs.push({ rank: rank++, recommendation: `Improve action follow-through — only ${actionProfile.completion_rate}% of agreed actions completed. Review actions at every meeting.`, urgency: "soon", regulatory_ref: "Reg 45" });
  }
  if (meetingsWithFeedback === 0 && meetings.length > 0) {
    recs.push({ rank: rank++, recommendation: "Capture child feedback at every meeting — build a template with prompts for views.", urgency: "soon", regulatory_ref: "Reg 45" });
  }
  if ((avgAttendance ?? 0) < 70) {
    recs.push({ rank: rank++, recommendation: `Address low attendance (${avgAttendance}%) — seek individual views from absent children and make meetings more engaging.`, urgency: "planned", regulatory_ref: "Reg 45" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: MeetingInsight[] = [];

  if (meetingsPerMonth >= 3 && (avgAttendance ?? 0) >= 90 && (engagementProfile.child_raised_rate ?? 0) >= 50) {
    insights.push({ text: `House meeting governance is exemplary — ${meetingsPerMonth} meetings per month, ${avgAttendance}% attendance, and ${engagementProfile.child_raised_rate}% child-led agenda. Ofsted will recognise a home where children genuinely influence decisions and feel heard. This supports both participation rights and placement stability.`, severity: "positive" });
  }
  if (meetingsPerMonth < 1) {
    insights.push({ text: `Only ${meetingsPerMonth} meetings per month. Regular house meetings are a key mechanism for children to exercise their right to participate in decisions about their home. Without them, Ofsted will question whether the home listens to children and involves them in shaping their own care.`, severity: "critical" });
  }
  if (allPrevActions.length > 0 && (actionProfile.completion_rate ?? 0) < 50) {
    insights.push({ text: `Only ${actionProfile.completion_rate}% of meeting actions have been completed. When children raise concerns and see no follow-through, they learn that their voice doesn't matter. This damages trust and engagement. Ofsted will specifically check whether actions are completed.`, severity: "warning" });
  }
  if ((avgAttendance ?? 0) < 70) {
    insights.push({ text: `Average attendance is ${avgAttendance}%. Low attendance may indicate that meetings aren't engaging, aren't accessible, or that some children's views are being overlooked. Individual catch-ups should be offered to absent children.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding meeting governance — ${meetings.length} meetings, ${avgAttendance}% attendance, ${engagementProfile.child_raised_rate}% child-led.`;
  } else if (rating === "good") {
    headline = `Good meeting practice — regular meetings with minor engagement or follow-through gaps.`;
  } else if (rating === "adequate") {
    headline = "Adequate meeting governance — frequency, attendance, or action follow-through needs improvement.";
  } else {
    headline = "Meeting governance is inadequate — children's participation rights are not being met.";
  }

  return {
    meeting_rating: rating,
    meeting_score: score,
    headline,
    regularity_profile: regularityProfile,
    attendance_profile: attendanceProfile,
    action_profile: actionProfile,
    engagement_profile: engagementProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyRegularity(): RegularityProfile {
  return { total_meetings: 0, meetings_per_month: 0, avg_days_between: 0, max_gap_days: 0, regular_count: 0, extraordinary_count: 0 };
}

function emptyAttendance(): AttendanceProfile {
  return { avg_child_attendance_rate: 0, full_attendance_count: 0, avg_staff_present: 0, lowest_attendance_rate: 0 };
}

function emptyAction(): ActionProfile {
  return { total_previous_actions: 0, completed_count: 0, completion_rate: 0, total_new_actions: 0, avg_new_per_meeting: 0 };
}

function emptyEngagement(): EngagementProfile {
  return { avg_agenda_items: 0, child_raised_rate: 0, avg_feedback_count: 0, meetings_with_feedback: 0, avg_duration: 0 };
}
