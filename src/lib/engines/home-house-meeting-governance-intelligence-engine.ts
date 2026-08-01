// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME HOUSE MEETING & CHILDREN'S GOVERNANCE INTELLIGENCE ENGINE
// Pure deterministic engine: house meeting frequency, child attendance,
// action tracking, agenda breadth, child-raised topics, and participation.
// CHR 2015 Reg 7: "Children's wishes and feelings." SCCIF: "Voice of child."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HouseMeetingInput {
  id: string;
  meeting_type: string; // "regular"|"special"|"emergency"|"welcome"|"feedback"
  children_present_count: number;
  children_absent_count: number;
  staff_present_count: number;
  agenda_items_count: number;
  child_feedback_count: number;
  previous_actions_total: number;
  previous_actions_completed: number;
  new_actions_count: number;
  duration_minutes: number;
}

export interface HouseMeetingGovernanceInput {
  today: string;
  total_children: number;
  meetings: HouseMeetingInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HouseMeetingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HouseMeetingGovernanceResult {
  meeting_rating: HouseMeetingRating;
  meeting_score: number | null;
  headline: string;
  total_meetings: number;
  child_attendance_rate: number | null;
  action_completion_rate: number | null;
  child_feedback_rate: number | null;
  average_agenda_items: number | null;
  average_duration: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HouseMeetingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHouseMeetingGovernance(
  input: HouseMeetingGovernanceInput,
): HouseMeetingGovernanceResult {
  const { meetings, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      meeting_rating: "insufficient_data",
      meeting_score: 0,
      headline: "No data available for house meeting analysis",
      total_meetings: 0,
      child_attendance_rate: 0,
      action_completion_rate: 0,
      child_feedback_rate: 0,
      average_agenda_items: 0,
      average_duration: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = meetings.length;

  const totalPresent = meetings.reduce((s, m) => s + m.children_present_count, 0);
  const totalPossible = meetings.reduce((s, m) => s + m.children_present_count + m.children_absent_count, 0);
  const childAttendanceRate = pct(totalPresent, totalPossible);

  const totalPrevActions = meetings.reduce((s, m) => s + m.previous_actions_total, 0);
  const completedPrevActions = meetings.reduce((s, m) => s + m.previous_actions_completed, 0);
  const actionCompletionRate = pct(completedPrevActions, totalPrevActions);

  const withChildFeedback = meetings.filter(m => m.child_feedback_count > 0).length;
  const childFeedbackRate = pct(withChildFeedback, total);

  const totalAgendaItems = meetings.reduce((s, m) => s + m.agenda_items_count, 0);
  const avgAgendaItems = total > 0 ? Math.round((totalAgendaItems / total) * 10) / 10 : null;

  const totalDuration = meetings.reduce((s, m) => s + m.duration_minutes, 0);
  const avgDuration = total > 0 ? Math.round(totalDuration / total) : null;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Meeting frequency
  if (total >= 4) score += 5;
  else if (total >= 2) score += 2;
  else if (total === 0) score -= 5;

  // Modifier 2: Child attendance
  if (total === 0) {
    // already penalised
  } else {
    if (childAttendanceRate >= 85) score += 6;
    else if (childAttendanceRate >= 65) score += 2;
    else if (childAttendanceRate < 40) score -= 5;
  }

  // Modifier 3: Action completion from previous meetings
  if (totalPrevActions === 0 && total > 0) {
    score += 2;
  } else if (totalPrevActions === 0) {
    // no meetings
  } else {
    if (actionCompletionRate >= 90) score += 5;
    else if (actionCompletionRate >= 70) score += 2;
    else if (actionCompletionRate < 50) score -= 4;
  }

  // Modifier 4: Child feedback captured
  if (total === 0) {
    // no adjustment
  } else {
    if (childFeedbackRate >= 90) score += 5;
    else if (childFeedbackRate >= 60) score += 2;
    else if (childFeedbackRate < 40) score -= 5;
  }

  // Modifier 5: Agenda breadth (more items = richer discussions)
  if (total === 0) {
    score -= 1;
  } else {
    if ((avgAgendaItems ?? 0) >= 3) score += 4;
    else if ((avgAgendaItems ?? 0) >= 2) score += 1;
    else if ((avgAgendaItems ?? 0) < 1) score -= 4;
  }

  // Modifier 6: Meeting duration (adequate time for meaningful participation)
  if (total === 0) {
    score -= 2;
  } else {
    if ((avgDuration ?? 0) >= 30) score += 5;
    else if ((avgDuration ?? 0) >= 20) score += 2;
    else if ((avgDuration ?? 0) < 10) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "House meetings are regular, well-attended and give children genuine influence over their home";
      break;
    case "good":
      headline = "Good house meeting practice with strong child participation and effective action tracking";
      break;
    case "adequate":
      headline = "House meetings are adequate but children's influence and follow-through need strengthening";
      break;
    case "inadequate":
      headline = "House meeting practice is inadequate — children lack meaningful voice in how their home runs";
      break;
    default:
      headline = "No data available for house meeting analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (total >= 4) strengths.push("Regular meeting schedule ensures children have consistent opportunities to share views");
  if (childAttendanceRate >= 85 && total > 0) strengths.push("High child attendance demonstrates meaningful engagement — children want to participate");
  if (actionCompletionRate >= 90 && totalPrevActions > 0) strengths.push("Actions from meetings are completed reliably — children see their input makes a difference");
  if (childFeedbackRate >= 90 && total > 0) strengths.push("Children's feedback is routinely captured and recorded at every meeting");
  if ((avgAgendaItems ?? 0) >= 3 && total > 0) strengths.push("Meetings cover a broad range of topics — children influence many aspects of home life");
  if ((avgDuration ?? 0) >= 30 && total > 0) strengths.push("Meetings are given adequate time for meaningful discussion and child participation");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No house meetings recorded — children have no formal mechanism to influence their home");
  if (childAttendanceRate < 40 && total > 0) concerns.push("Low child attendance suggests meetings are not engaging or accessible to children");
  if (actionCompletionRate < 50 && totalPrevActions > 0) concerns.push("Actions from meetings are not followed through — children's requests are ignored in practice");
  if (childFeedbackRate < 40 && total > 0) concerns.push("Children's feedback is rarely captured in meeting records");
  if ((avgAgendaItems ?? 0) < 1 && total > 0) concerns.push("Meetings have minimal agenda items — discussions lack substance");
  if ((avgDuration ?? 0) < 10 && total > 0) concerns.push("Meetings are too brief for meaningful participation — they appear tokenistic");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: HouseMeetingGovernanceResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Establish weekly house meetings to give children a regular voice in home governance", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (childAttendanceRate < 65 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Review meeting format to make it more engaging and accessible for all children", urgency: "soon", regulatory_ref: "SCCIF Voice of Child" });
  }
  if (actionCompletionRate < 70 && totalPrevActions > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Implement visible action tracking so children can see their requests being acted upon", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (childFeedbackRate < 60 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Record children's individual feedback at each meeting as evidence of their voice", urgency: "planned", regulatory_ref: "SCCIF Voice of Child" });
  }
  if ((avgDuration ?? 0) < 20 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Allow more time for meetings to enable genuine discussion rather than rushed updates", urgency: "planned", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (total > 0 && total < 2) {
    recs.push({ rank: recs.length + 1, recommendation: "Increase meeting frequency to at least fortnightly for consistent child engagement", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: HouseMeetingGovernanceResult["insights"] = [];

  if (childAttendanceRate >= 85 && actionCompletionRate >= 90 && total >= 4) {
    insights.push({ text: "Children genuinely shape their home through well-run meetings — exemplary participation practice", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "Without house meetings, Ofsted cannot see evidence of children influencing their care environment", severity: "critical" });
  }
  if (actionCompletionRate < 50 && totalPrevActions > 0) {
    insights.push({ text: "Unfulfilled meeting actions erode children's trust — they learn their voice doesn't matter", severity: "warning" });
  }
  if (childFeedbackRate >= 90 && childAttendanceRate >= 85 && total > 0) {
    insights.push({ text: "Children attend, contribute and see their feedback recorded — this is authentic participation", severity: "positive" });
  }
  if ((avgDuration ?? 0) < 10 && total > 0) {
    insights.push({ text: "Meetings under 10 minutes cannot accommodate meaningful child participation — consider restructuring", severity: "warning" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    meeting_rating: rating,
    meeting_score: score,
    headline,
    total_meetings: total,
    child_attendance_rate: childAttendanceRate,
    action_completion_rate: actionCompletionRate,
    child_feedback_rate: childFeedbackRate,
    average_agenda_items: avgAgendaItems,
    average_duration: avgDuration,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
