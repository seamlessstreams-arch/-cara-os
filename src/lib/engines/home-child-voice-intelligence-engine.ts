// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CHILD VOICE INTELLIGENCE ENGINE
// Home-level: synthesises children's house meetings, visitor engagement,
// child feedback, and action responsiveness to produce an overall child
// voice and participation intelligence score.
// CHR 2015 Reg 7, 11. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meanOf, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HouseMeetingInput {
  id: string;
  date: string;                           // YYYY-MM-DD
  children_present: number;
  children_absent: number;
  child_raised_topics: number;            // agenda items raised by children
  total_agenda_items: number;
  child_feedback_count: number;
  new_actions_count: number;
  previous_actions_completed: number;
  previous_actions_total: number;
  duration_minutes: number;
}

export interface VisitorInput {
  id: string;
  date: string;                           // YYYY-MM-DD
  category: string;                       // "professional" | "family" | "inspector" | "tradesperson"
  dbs_checked: boolean;
  id_verified: boolean;
  status: string;                         // "signed_in" | "signed_out"
  children_seen_count: number;
}

export interface HomeChildVoiceInput {
  today: string;
  total_children: number;
  house_meetings: HouseMeetingInput[];
  visitors: VisitorInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ChildVoiceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MeetingsProfile {
  total_meetings_90d: number;
  avg_attendance_rate: number | null;     // 0-100; null = no meeting recorded attendance
  full_attendance_count: number;          // meetings where all children attended
  child_raised_topic_rate: number | null; // % of agenda items raised by children; null = no agenda items
  avg_feedback_per_meeting: number | null;
  action_completion_rate: number | null;  // % of previous actions completed; null = no actions carried forward
  avg_duration_minutes: number | null;
  meeting_frequency_weeks: number | null; // avg weeks between meetings
  trend: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface VisitorProfile {
  total_90d: number;
  professional_count: number;
  family_count: number;
  inspector_count: number;
  dbs_compliance_rate: number | null;      // % of professionals with DBS; null = no professional visitors
  id_verification_rate: number | null;     // % with ID verified; null = no visitors recorded
  sign_out_compliance_rate: number | null; // % properly signed out; null = no visitors recorded
  children_seen_rate: number | null;       // % of visits where children were seen; null = no visitors recorded
  visitors_still_signed_in: number;
}

export interface ChildVoiceInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ChildVoiceRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeChildVoiceResult {
  child_voice_rating: ChildVoiceRating;
  child_voice_score: number;
  headline: string;
  meetings: MeetingsProfile;
  visitors: VisitorProfile;
  strengths: string[];
  concerns: string[];
  recommendations: ChildVoiceRecommendation[];
  insights: ChildVoiceInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ChildVoiceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeChildVoice(
  input: HomeChildVoiceInput,
): HomeChildVoiceResult {
  const { today, total_children, house_meetings, visitors } = input;

  const totalData = house_meetings.length + visitors.length;

  if (totalData < 2) {
    return {
      child_voice_rating: "insufficient_data",
      child_voice_score: 0,
      headline: "Insufficient data to assess child voice and participation.",
      meetings: emptyMeetings(),
      visitors: emptyVisitors(),
      strengths: [],
      concerns: [],
      recommendations: [{ rank: 1, recommendation: "Begin recording house meetings and visitor data to enable child voice analysis.", urgency: "immediate", regulatory_ref: "Reg 7, 11" }],
      insights: [{ text: "Not enough data to assess child voice. Ensure house meetings and visitor records are maintained.", severity: "warning" }],
    };
  }

  // ── Meetings Profile ────────────────────────────────────────────────────
  const meetings90d = house_meetings.filter(m => {
    const d = daysBetween(m.date, today);
    return d >= 0 && d <= 90;
  });
  const sorted = [...meetings90d].sort((a, b) => a.date.localeCompare(b.date));

  const attendanceRates = meetings90d
    .filter(m => m.children_present + m.children_absent > 0)
    .map(m => (m.children_present / (m.children_present + m.children_absent)) * 100);
  const avgAttendance = meanOf(attendanceRates);

  const fullAttendance = meetings90d.filter(m => m.children_absent === 0 && m.children_present > 0).length;

  const totalChildTopics = meetings90d.reduce((s, m) => s + m.child_raised_topics, 0);
  const totalTopics = meetings90d.reduce((s, m) => s + m.total_agenda_items, 0);
  const childTopicRate = rate(totalChildTopics, totalTopics);

  const totalFeedback = meetings90d.reduce((s, m) => s + m.child_feedback_count, 0);
  const avgFeedback = meetings90d.length > 0
    ? Math.round((totalFeedback / meetings90d.length) * 10) / 10
    : null;

  // Null when no previous actions were carried into the window — nothing to follow through on
  const totalPrevCompleted = meetings90d.reduce((s, m) => s + m.previous_actions_completed, 0);
  const totalPrevActions = meetings90d.reduce((s, m) => s + m.previous_actions_total, 0);
  const actionCompletionRate = rate(totalPrevCompleted, totalPrevActions);

  const totalDuration = meetings90d.reduce((s, m) => s + m.duration_minutes, 0);
  const avgDuration = meetings90d.length > 0 ? Math.round(totalDuration / meetings90d.length) : null;

  // Meeting frequency
  let meetingFrequency: number | null = null;
  if (sorted.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(daysBetween(sorted[i - 1].date, sorted[i].date));
    }
    meetingFrequency = Math.round((gaps.reduce((s, v) => s + v, 0) / gaps.length) / 7 * 10) / 10;
  }

  // Meeting trend: compare first half vs second half attendance
  let meetingTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (meetings90d.length >= 3) {
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const rateFirst = firstHalf.filter(m => m.children_present + m.children_absent > 0)
      .map(m => m.children_present / (m.children_present + m.children_absent));
    const rateSecond = secondHalf.filter(m => m.children_present + m.children_absent > 0)
      .map(m => m.children_present / (m.children_present + m.children_absent));

    const avgFirst = rateFirst.length > 0 ? rateFirst.reduce((s, v) => s + v, 0) / rateFirst.length : null;
    const avgSecond = rateSecond.length > 0 ? rateSecond.reduce((s, v) => s + v, 0) / rateSecond.length : null;

    // A half with no recorded attendance cannot be compared — silence is not a decline
    if (avgFirst !== null && avgSecond !== null) {
      if (avgSecond > avgFirst + 0.1) meetingTrend = "improving";
      else if (avgSecond < avgFirst - 0.1) meetingTrend = "declining";
      else meetingTrend = "stable";
    }
  }

  const meetingsProfile: MeetingsProfile = {
    total_meetings_90d: meetings90d.length,
    avg_attendance_rate: avgAttendance,
    full_attendance_count: fullAttendance,
    child_raised_topic_rate: childTopicRate,
    avg_feedback_per_meeting: avgFeedback,
    action_completion_rate: actionCompletionRate,
    avg_duration_minutes: avgDuration,
    meeting_frequency_weeks: meetingFrequency,
    trend: meetingTrend,
  };

  // ── Visitor Profile ─────────────────────────────────────────────────────
  const vis90d = visitors.filter(v => {
    const d = daysBetween(v.date, today);
    return d >= 0 && d <= 90;
  });

  const professional = vis90d.filter(v => v.category === "professional" || v.category === "inspector");
  const family = vis90d.filter(v => v.category === "family");
  const inspector = vis90d.filter(v => v.category === "inspector");

  // Null when no professional or inspector visited — nothing required a DBS check
  const dbsRequired = vis90d.filter(v => v.category === "professional" || v.category === "inspector");
  const dbsCompliant = dbsRequired.filter(v => v.dbs_checked);
  const dbsRate = rateOf(dbsCompliant, dbsRequired);

  const idVerified = vis90d.filter(v => v.id_verified);
  const idRate = rateOf(idVerified, vis90d);

  const signedOut = vis90d.filter(v => v.status === "signed_out");
  const signOutRate = rateOf(signedOut, vis90d);
  const stillSignedIn = vis90d.filter(v => v.status === "signed_in").length;

  const withChildren = vis90d.filter(v => v.children_seen_count > 0);
  const childrenSeenRate = rateOf(withChildren, vis90d);

  const visitorProfile: VisitorProfile = {
    total_90d: vis90d.length,
    professional_count: professional.length,
    family_count: family.length,
    inspector_count: inspector.length,
    dbs_compliance_rate: dbsRate,
    id_verification_rate: idRate,
    sign_out_compliance_rate: signOutRate,
    children_seen_rate: childrenSeenRate,
    visitors_still_signed_in: stillSignedIn,
  };

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 50;

  // Meetings frequency (±12)
  if (meetings90d.length > 0) {
    if (meetingFrequency !== null && meetingFrequency <= 1.5) score += 8;  // weekly
    else if (meetingFrequency !== null && meetingFrequency <= 2.5) score += 4;  // fortnightly
    else if (meetings90d.length >= 3) score += 2;
    else score -= 3;

    // Attendance (±8)
    if (meets(avgAttendance, 90)) score += 6;
    else if (meets(avgAttendance, 70)) score += 3;
    else if (below(avgAttendance, 50)) score -= 5;

    // Child voice quality (±8)
    if (meets(childTopicRate, 50)) score += 5;
    else if (meets(childTopicRate, 30)) score += 2;
    else if (below(childTopicRate, 30)) score -= 3;

    // Child feedback (±4)
    if (avgFeedback !== null && avgFeedback >= 2) score += 4;
    else if (avgFeedback !== null && avgFeedback >= 1) score += 2;

    // Action follow-through (±6)
    if (meets(actionCompletionRate, 90)) score += 5;
    else if (meets(actionCompletionRate, 70)) score += 2;
    else if (below(actionCompletionRate, 50)) score -= 4;
  } else {
    score -= 10;  // No meetings is a significant gap
  }

  // Visitors (±10)
  if (vis90d.length > 0) {
    if (meets(dbsRate, 100)) score += 3;
    else if (below(dbsRate, 80)) score -= 5;

    if (meets(idRate, 100)) score += 2;
    else if (below(idRate, 80)) score -= 3;

    if (meets(signOutRate, 100)) score += 2;
    else if (stillSignedIn > 0) score -= 2;

    if (family.length > 0) score += 2;  // family contact happening
  }

  // Meeting trend
  if (meetingTrend === "improving") score += 3;
  else if (meetingTrend === "declining") score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(avgAttendance, 90)) strengths.push(`${formatRate(avgAttendance)} average attendance at house meetings — children are engaged and participating.`);
  if (fullAttendance > 0 && meetings90d.length > 0) strengths.push(`${fullAttendance} of ${meetings90d.length} meetings had full attendance — every child's voice was heard.`);
  if (meets(childTopicRate, 50)) strengths.push(`${formatRate(childTopicRate)} of agenda items were raised by children — their voice genuinely shapes the home.`);
  if (avgFeedback !== null && avgFeedback >= 2) strengths.push("Children regularly provide feedback at meetings — evidence of a listening culture.");
  if (meets(actionCompletionRate, 90)) strengths.push(`${formatRate(actionCompletionRate)} of meeting actions completed — children see their input leads to change.`);
  if (meetingFrequency !== null && meetingFrequency <= 1.5 && meetings90d.length > 0) strengths.push("House meetings are held weekly — exceeding the minimum fortnightly expectation.");
  if (meets(dbsRate, 100)) strengths.push("100% DBS compliance for all professional visitors.");
  if (family.length > 0) strengths.push(`${family.length} family contact visits in 90 days — maintaining important relationships.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (meetings90d.length === 0) concerns.push("No house meetings recorded in 90 days — children's collective voice is not being heard.");
  if (below(avgAttendance, 70)) concerns.push(`Only ${formatRate(avgAttendance)} average attendance at house meetings — explore why children are not attending.`);
  if (below(childTopicRate, 20)) concerns.push(`Only ${formatRate(childTopicRate)} of agenda items raised by children — meetings may be staff-driven rather than child-led.`);
  if (below(actionCompletionRate, 60)) concerns.push(`Only ${formatRate(actionCompletionRate)} of meeting actions completed — children may feel their views aren't actioned.`);
  if (below(dbsRate, 100)) concerns.push(`DBS compliance for professional visitors is ${formatRate(dbsRate)} — non-compliant visitors pose a safeguarding risk.`);
  if (stillSignedIn > 0) concerns.push(`${stillSignedIn} visitor${stillSignedIn > 1 ? "s" : ""} still signed in — sign-out procedure not followed.`);
  if (meetingTrend === "declining") concerns.push("Meeting attendance is declining — investigate barriers to participation.");
  if (meetingFrequency !== null && meetingFrequency > 3) concerns.push(`Meetings are only every ${meetingFrequency} weeks — should be at least fortnightly.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: ChildVoiceRecommendation[] = [];
  let rank = 1;

  if (meetings90d.length === 0) {
    recs.push({ rank: rank++, recommendation: "Establish regular house meetings immediately — children must have a forum to express their views.", urgency: "immediate", regulatory_ref: "Reg 7" });
  }
  if (below(dbsRate, 100)) {
    recs.push({ rank: rank++, recommendation: "Ensure DBS checks are verified for all professional visitors before entry.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (stillSignedIn > 0) {
    recs.push({ rank: rank++, recommendation: "Review visitor sign-out procedures — ensure all visitors are accounted for.", urgency: "soon", regulatory_ref: "Reg 25" });
  }
  if (below(actionCompletionRate, 70)) {
    recs.push({ rank: rank++, recommendation: "Improve follow-through on meeting actions — children need to see their input makes a difference.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (below(childTopicRate, 30)) {
    recs.push({ rank: rank++, recommendation: "Encourage children to raise more agenda items — use suggestion boxes or pre-meeting prompts.", urgency: "planned", regulatory_ref: "Reg 7" });
  }
  if (below(avgAttendance, 80)) {
    recs.push({ rank: rank++, recommendation: "Explore barriers to meeting attendance — consider timing, format, or engagement approaches.", urgency: "planned", regulatory_ref: "Reg 7" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: ChildVoiceInsight[] = [];

  if (meetings90d.length === 0) {
    insights.push({ text: "No house meetings in 90 days is a significant gap. Ofsted will specifically look for evidence that children's views influence the running of the home.", severity: "critical" });
  }
  if (below(dbsRate, 100)) {
    insights.push({ text: `Professional visitors without DBS checks represent a safeguarding concern. ${dbsRequired.length - dbsCompliant.length} professional visit${dbsRequired.length - dbsCompliant.length > 1 ? "s" : ""} lacked DBS verification.`, severity: "critical" });
  }
  if (meets(childTopicRate, 50) && meets(avgAttendance, 80) && meets(actionCompletionRate, 80)) {
    insights.push({ text: `Strong child voice: ${formatRate(childTopicRate)} of agenda items child-raised, ${formatRate(avgAttendance)} attendance, ${formatRate(actionCompletionRate)} action follow-through. Ofsted will see this as evidence of a child-centred home.`, severity: "positive" });
  }
  if (meets(actionCompletionRate, 90)) {
    insights.push({ text: "Excellent action follow-through from meetings. When children see their ideas implemented, it reinforces that their voice matters.", severity: "positive" });
  }
  if (meetingTrend === "improving") {
    insights.push({ text: "Meeting attendance is improving — children are increasingly engaging with the forum.", severity: "positive" });
  }
  if (below(avgAttendance, 60)) {
    insights.push({ text: "Low meeting attendance may indicate children don't feel meetings are meaningful. Consider whether format changes could improve engagement.", severity: "warning" });
  }
  if (inspector.length > 0) {
    insights.push({ text: `${inspector.length} inspector visit${inspector.length > 1 ? "s" : ""} in 90 days with children seen — evidence that external scrutiny includes direct child consultation.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Child voice is outstanding — regular meetings, strong attendance, and children's views are shaping the home.";
  } else if (rating === "good") {
    headline = avgAttendance === null
      ? `Good child participation — ${meetings90d.length} meeting${meetings90d.length !== 1 ? "s" : ""} in 90 days; attendance not yet recorded.`
      : `Good child participation — ${meetings90d.length} meeting${meetings90d.length !== 1 ? "s" : ""} in 90 days with ${formatRate(avgAttendance)} attendance.`;
  } else if (rating === "adequate") {
    headline = "Adequate child voice — improvements needed in meeting frequency or quality of participation.";
  } else {
    headline = "Child voice is inadequate — children's views are not being adequately captured or acted upon.";
  }

  return {
    child_voice_rating: rating,
    child_voice_score: score,
    headline,
    meetings: meetingsProfile,
    visitors: visitorProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyMeetings(): MeetingsProfile {
  return { total_meetings_90d: 0, avg_attendance_rate: null, full_attendance_count: 0, child_raised_topic_rate: null, avg_feedback_per_meeting: null, action_completion_rate: null, avg_duration_minutes: null, meeting_frequency_weeks: null, trend: "insufficient_data" };
}

function emptyVisitors(): VisitorProfile {
  return { total_90d: 0, professional_count: 0, family_count: 0, inspector_count: 0, dbs_compliance_rate: null, id_verification_rate: null, sign_out_compliance_rate: null, children_seen_rate: null, visitors_still_signed_in: 0 };
}
