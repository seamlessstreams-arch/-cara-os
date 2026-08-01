// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PARTICIPATION & ENGAGEMENT INTELLIGENCE ENGINE
// Home-level: synthesises house meeting data to assess children's participation,
// attendance, topic diversity, action completion, and voice-in-care practice.
// CHR 2015 Reg 7, 9. SCCIF: "Overall experiences", "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HouseMeetingInput {
  id: string;
  date: string;                              // YYYY-MM-DD
  meeting_type: string;                      // regular | emergency | themed
  children_present: string[];
  children_absent: string[];
  total_agenda_items: number;
  child_raised_items: number;                // agenda items raised by children
  feedback_count: number;                    // child feedback entries
  previous_actions_total: number;
  previous_actions_completed: number;
  new_actions_count: number;
  duration_minutes: number;
}

export interface HomeParticipationInput {
  today: string;
  total_children: number;
  child_ids: string[];
  house_meetings: HouseMeetingInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ParticipationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MeetingProfile {
  total_meetings_90d: number;
  avg_attendance_rate: number | null;               // % children attending
  avg_child_raised_rate: number | null;             // % agenda items raised by children
  avg_feedback_per_meeting: number;
  action_completion_rate: number | null;            // % previous actions completed
  avg_duration: number;                      // minutes
  meetings_per_month: number;                // rate
  children_never_attended: string[];
}

export interface EngagementProfile {
  total_agenda_items: number;
  total_child_raised: number;
  total_feedback: number;
  total_new_actions: number;
  child_voice_score: number | null;                 // 0–100 composite
}

export interface ParticipationInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ParticipationRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeParticipationResult {
  participation_rating: ParticipationRating;
  participation_score: number | null;
  headline: string;
  meeting_profile: MeetingProfile;
  engagement_profile: EngagementProfile;
  strengths: string[];
  concerns: string[];
  recommendations: ParticipationRecommendation[];
  insights: ParticipationInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ParticipationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeParticipation(
  input: HomeParticipationInput,
): HomeParticipationResult {
  const { today, total_children, child_ids, house_meetings } = input;

  // Filter to 90-day window
  const meetings90d = house_meetings.filter(m => daysBetween(m.date, today) <= 90);

  // Insufficient data
  if (meetings90d.length === 0) {
    return {
      participation_rating: "insufficient_data",
      participation_score: 0,
      headline: "No house meetings recorded in the past 90 days — regular participation forums are essential.",
      meeting_profile: emptyMeetingProfile(child_ids),
      engagement_profile: emptyEngagementProfile(),
      strengths: [],
      concerns: ["No house meetings in the past 90 days — children should have regular opportunities to participate in the running of their home."],
      recommendations: [{ rank: 1, recommendation: "Establish regular house meetings — Ofsted expects children to have a voice in how the home is run.", urgency: "immediate", regulatory_ref: "Reg 7" }],
      insights: [{ text: "House meetings are a key mechanism for children's voice. Without regular meetings, the home cannot evidence participatory care practice.", severity: "critical" }],
    };
  }

  // ── Meeting Profile ───────────────────────────────────────────────────
  const attendanceRates = meetings90d.map(m => {
    const totalAttendees = m.children_present.length + m.children_absent.length;
    return totalAttendees > 0
       ? Math.round((m.children_present.length / totalAttendees) * 100)
       : null;
});
  const attendanceRatesNumeric = attendanceRates.filter((r): r is number => r !== null);
  const avgAttendance = attendanceRatesNumeric.length > 0 ? Math.round(
    attendanceRatesNumeric.reduce((s, r) => s + r, 0) / attendanceRatesNumeric.length,
  ) : null;

  const childRaisedRates = meetings90d.map(m =>
    m.total_agenda_items > 0
      ? Math.round((m.child_raised_items / m.total_agenda_items) * 100)
      : null,
  );
  const childRaisedRatesNumeric = childRaisedRates.filter((r): r is number => r !== null);
  const avgChildRaised = childRaisedRatesNumeric.length > 0 ? Math.round(
    childRaisedRatesNumeric.reduce((s, r) => s + r, 0) / childRaisedRatesNumeric.length,
  ) : null;

  const avgFeedback = Math.round(
    (meetings90d.reduce((s, m) => s + m.feedback_count, 0) / meetings90d.length) * 10,
  ) / 10;

  const totalPrevActions = meetings90d.reduce((s, m) => s + m.previous_actions_total, 0);
  const completedPrevActions = meetings90d.reduce((s, m) => s + m.previous_actions_completed, 0);
  const actionCompletionRate = totalPrevActions > 0
    ? Math.round((completedPrevActions / totalPrevActions) * 100)
    : 100;

  const avgDuration = Math.round(
    meetings90d.reduce((s, m) => s + m.duration_minutes, 0) / meetings90d.length,
  );

  const daysInWindow = 90;
  const meetingsPerMonth = Math.round((meetings90d.length / daysInWindow) * 30 * 10) / 10;

  // Children who never attended any meeting in the window
  const allPresent = new Set(meetings90d.flatMap(m => m.children_present));
  const neverAttended = child_ids.filter(id => !allPresent.has(id));

  const meetingProfile: MeetingProfile = {
    total_meetings_90d: meetings90d.length,
    avg_attendance_rate: avgAttendance,
    avg_child_raised_rate: avgChildRaised,
    avg_feedback_per_meeting: avgFeedback,
    action_completion_rate: actionCompletionRate,
    avg_duration: avgDuration,
    meetings_per_month: meetingsPerMonth,
    children_never_attended: neverAttended,
  };

  // ── Engagement Profile ────────────────────────────────────────────────
  const totalAgenda = meetings90d.reduce((s, m) => s + m.total_agenda_items, 0);
  const totalChildRaised = meetings90d.reduce((s, m) => s + m.child_raised_items, 0);
  const totalFeedback = meetings90d.reduce((s, m) => s + m.feedback_count, 0);
  const totalNewActions = meetings90d.reduce((s, m) => s + m.new_actions_count, 0);

  // Child voice composite: attendance + child-raised + feedback weighting
  const voiceScore = clamp(
    Math.round(((avgAttendance ?? 0) * 0.4) + ((avgChildRaised ?? 0) * 0.3) + (Math.min(avgFeedback / 3, 1) * 30)),
    0,
    100,
  );

  const engagementProfile: EngagementProfile = {
    total_agenda_items: totalAgenda,
    total_child_raised: totalChildRaised,
    total_feedback: totalFeedback,
    total_new_actions: totalNewActions,
    child_voice_score: voiceScore,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // Meeting frequency (±10)
  if (meetingsPerMonth >= 4) score += 6;
  else if (meetingsPerMonth >= 2) score += 3;
  else if (meetingsPerMonth < 1) score -= 6;
  else score -= 2;

  // Attendance (±10)
  if ((avgAttendance ?? 0) >= 90) score += 6;
  else if ((avgAttendance ?? 0) >= 70) score += 3;
  else if ((avgAttendance ?? 0) < 50) score -= 6;
  else score -= 2;

  // Child-raised agenda (±8)
  if ((avgChildRaised ?? 0) >= 50) score += 5;
  else if ((avgChildRaised ?? 0) >= 25) score += 2;
  else if (avgChildRaised === 0) score -= 5;
  else score -= 1;

  // Feedback (±6)
  if (avgFeedback >= 2) score += 4;
  else if (avgFeedback >= 1) score += 2;
  else score -= 3;

  // Action completion (±6)
  if (actionCompletionRate >= 80) score += 4;
  else if (actionCompletionRate >= 50) score += 1;
  else if (totalPrevActions > 0) score -= 4;

  // Children never attending (±6)
  if (neverAttended.length === 0 && total_children > 0) score += 4;
  else if (neverAttended.length >= 2) score -= 4;
  else if (neverAttended.length === 1) score -= 2;

  // Duration quality (±4)
  if (avgDuration >= 20 && avgDuration <= 60) score += 2;
  else if (avgDuration < 10) score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meetingsPerMonth >= 4) strengths.push(`House meetings held weekly (${meetingsPerMonth}/month) — excellent regularity.`);
  else if (meetingsPerMonth >= 2) strengths.push(`House meetings held regularly (${meetingsPerMonth}/month).`);
  if ((avgAttendance ?? 0) >= 85) strengths.push(`${(avgAttendance ?? 0)}% average attendance — children are well engaged in meetings.`);
  if ((avgChildRaised ?? 0) >= 40) strengths.push(`${(avgChildRaised ?? 0)}% of agenda items raised by children — their voice shapes the home.`);
  if (neverAttended.length === 0 && total_children > 0) strengths.push("All children have attended at least one meeting in the past 90 days.");
  if (actionCompletionRate >= 80 && totalPrevActions > 0) strengths.push(`${actionCompletionRate}% action completion — the home follows through on children's requests.`);
  if (avgFeedback >= 2) strengths.push("Strong feedback from children — average of " + avgFeedback + " feedback entries per meeting.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (meetingsPerMonth < 2) concerns.push(`House meetings only ${meetingsPerMonth}/month — regularity is below expectations for good practice.`);
  if ((avgAttendance ?? 0) < 60) concerns.push(`Low average attendance (${(avgAttendance ?? 0)}%) — barriers to participation need investigating.`);
  if (neverAttended.length > 0) concerns.push(`${neverAttended.length} child${neverAttended.length > 1 ? "ren have" : " has"} never attended a meeting — every child's voice matters.`);
  if ((avgChildRaised ?? 0) < 20 && totalAgenda > 0) concerns.push("Very few agenda items raised by children — meetings may be staff-dominated.");
  if (actionCompletionRate < 50 && totalPrevActions > 0) concerns.push(`Only ${actionCompletionRate}% of actions completed — follow-through is essential for children to trust the process.`);
  if (avgFeedback < 1) concerns.push("Low feedback from children — consider using creative methods to gather views.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: ParticipationRecommendation[] = [];
  let rank = 1;

  if (meetingsPerMonth < 2) {
    recs.push({ rank: rank++, recommendation: "Increase meeting frequency to at least weekly — regular forums are essential for children's participation.", urgency: "immediate", regulatory_ref: "Reg 7" });
  }
  if (neverAttended.length > 0) {
    recs.push({ rank: rank++, recommendation: `Engage ${neverAttended.length} child${neverAttended.length > 1 ? "ren" : ""} who have not attended — explore barriers and alternative participation methods.`, urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if ((avgChildRaised ?? 0) < 25 && totalAgenda > 0) {
    recs.push({ rank: rank++, recommendation: "Encourage children to set agenda items — use suggestion boxes or pre-meeting prompts.", urgency: "soon", regulatory_ref: "Reg 9" });
  }
  if (actionCompletionRate < 60 && totalPrevActions > 0) {
    recs.push({ rank: rank++, recommendation: "Improve action follow-through — children need to see their contributions make a difference.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (avgFeedback < 1) {
    recs.push({ rank: rank++, recommendation: "Introduce creative feedback methods — stickers, rating scales, or anonymous forms.", urgency: "planned", regulatory_ref: "Reg 7" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: ParticipationInsight[] = [];

  if (neverAttended.length > 0 && total_children > 0) {
    insights.push({ text: `${neverAttended.length} child${neverAttended.length > 1 ? "ren have" : " has"} not attended any house meeting. Ofsted will examine whether every child's voice is heard in the running of the home.`, severity: "critical" });
  }
  if (meetingsPerMonth < 1) {
    insights.push({ text: "Fewer than 1 meeting per month. Ofsted expects regular children's meetings as evidence of participatory care practice.", severity: "critical" });
  }
  if ((avgChildRaised ?? 0) >= 40 && (avgAttendance ?? 0) >= 80) {
    insights.push({ text: `${avgChildRaised}% of agenda items raised by children with ${avgAttendance}% attendance — this demonstrates genuine child-led participation.`, severity: "positive" });
  }
  if (actionCompletionRate >= 80 && totalPrevActions > 0) {
    insights.push({ text: `${actionCompletionRate}% action completion demonstrates that the home listens to children and follows through — excellent evidence of responsive care.`, severity: "positive" });
  }
  if ((voiceScore ?? 0) >= 70) {
    insights.push({ text: `Child voice score of ${voiceScore}% indicates strong participatory practice — children are influencing decisions in their home.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Outstanding participation — regular meetings, strong attendance, and genuine child-led engagement.";
  } else if (rating === "good") {
    headline = `Good participation — ${meetings90d.length} meetings in 90 days with ${avgAttendance}% attendance.`;
  } else if (rating === "adequate") {
    headline = "Adequate participation — improvements needed in meeting frequency, attendance, or child engagement.";
  } else {
    headline = "Participation is inadequate — children's voice in the running of the home needs urgent attention.";
  }

  return {
    participation_rating: rating,
    participation_score: score,
    headline,
    meeting_profile: meetingProfile,
    engagement_profile: engagementProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyMeetingProfile(childIds: string[]): MeetingProfile {
  return {
    total_meetings_90d: 0, avg_attendance_rate: null, avg_child_raised_rate: null,
    avg_feedback_per_meeting: 0, action_completion_rate: null, avg_duration: 0,
    meetings_per_month: 0, children_never_attended: childIds,
  };
}

function emptyEngagementProfile(): EngagementProfile {
  return {
    total_agenda_items: 0, total_child_raised: 0,
    total_feedback: 0, total_new_actions: 0, child_voice_score: 0,
  };
}
