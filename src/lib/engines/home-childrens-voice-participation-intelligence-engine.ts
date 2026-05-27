// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CHILDREN'S VOICE & PARTICIPATION INTELLIGENCE ENGINE
// Home-level: assesses how effectively children's voices are heard and
// participation is enabled. Tracks children's meetings, staff feedback from
// children, child-friendly policies, and children-as-experts opportunities.
// CHR 2015 Reg 7: "The children's views, wishes and feelings standard."
// CHR 2015 Reg 5: "Engaging with children — consultation and participation."
// Ofsted checks children are listened to and actively participate in the
// life of the home.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface ChildrensMeetingInput {
  id: string;
  date: string;
  yp_present_count: number;
  yp_total: number;
  child_chaired: boolean;
  actions_count: number;
  complaints_raised: boolean;
}

export interface ChildFeedbackInput {
  id: string;
  child_id: string;
  date: string;
  sentiment: string; // "positive" | "neutral" | "negative"
  staff_informed: boolean;
  action_taken: boolean;
}

export interface ChildFriendlyPolicyInput {
  id: string;
  shared_with_children: boolean;
  child_accessible_format: boolean;
}

export interface ChildExpertInput {
  id: string;
  child_id: string;
  date: string;
  impact_recorded: boolean;
  child_chose_to_participate: boolean;
}

export interface ChildrensVoiceInput {
  today: string;
  total_children: number;
  meetings: ChildrensMeetingInput[];
  feedback: ChildFeedbackInput[];
  policies: ChildFriendlyPolicyInput[];
  expert_entries: ChildExpertInput[];
}

// ── Output types ────────────────────────────────────────────────────────────

export type ChildrensVoiceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ChildrensVoiceResult {
  voice_rating: ChildrensVoiceRating;
  voice_score: number;
  headline: string;
  meeting_attendance_rate: number;
  feedback_response_rate: number;
  child_friendly_policy_rate: number;
  expert_participation_count: number;
  positive_feedback_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: string;
    regulatory_ref: string | null;
  }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeChildrensVoiceParticipation(
  input: ChildrensVoiceInput,
): ChildrensVoiceResult {
  const { total_children, meetings, feedback, policies, expert_entries } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (total_children === 0) {
    return {
      voice_rating: "insufficient_data",
      voice_score: 0,
      headline:
        "No children recorded — children's voice and participation cannot be assessed.",
      meeting_attendance_rate: 0,
      feedback_response_rate: 0,
      child_friendly_policy_rate: 0,
      expert_participation_count: 0,
      positive_feedback_rate: 0,
      strengths: [],
      concerns: [
        "No children recorded — compliance with Reg 7 (children's wishes) and Reg 5 (engaging with children) cannot be verified.",
      ],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metric calculations ─────────────────────────────────────────────

  // Meeting attendance rate: avg(yp_present_count / yp_total) across meetings
  const meetingAttendanceRate =
    meetings.length === 0
      ? 0
      : Math.round(
          (meetings.reduce(
            (sum, m) => sum + (m.yp_total === 0 ? 0 : m.yp_present_count / m.yp_total),
            0,
          ) /
            meetings.length) *
            100,
        );

  // Child chairing rate
  const childChairingRate = pct(
    meetings.filter((m) => m.child_chaired).length,
    meetings.length,
  );

  // Feedback response rate: staff_informed AND action_taken / total feedback
  const respondedFeedback = feedback.filter(
    (f) => f.staff_informed && f.action_taken,
  ).length;
  const feedbackResponseRate = pct(respondedFeedback, feedback.length);

  // Positive feedback rate
  const positiveFeedback = feedback.filter(
    (f) => f.sentiment === "positive",
  ).length;
  const positiveFeedbackRate = pct(positiveFeedback, feedback.length);

  // Policy accessibility rate: shared_with_children AND child_accessible_format
  const accessiblePolicies = policies.filter(
    (p) => p.shared_with_children && p.child_accessible_format,
  ).length;
  const childFriendlyPolicyRate = pct(accessiblePolicies, policies.length);

  // Expert participation: unique children who chose to participate
  const expertChildIds = new Set(
    expert_entries
      .filter((e) => e.child_chose_to_participate)
      .map((e) => e.child_id),
  );
  const expertParticipationCount = expertChildIds.size;
  const expertParticipationRate =
    total_children === 0
      ? 0
      : Math.round((expertParticipationCount / total_children) * 100);

  // ── Scoring ─────────────────────────────────────────────────────────
  // Base 52, 6 modifiers, max ~82
  let score = 52;

  // Mod 1: Meeting attendance rate
  if (meetings.length === 0) {
    score += 0;
  } else if (meetingAttendanceRate >= 80) {
    score += 5;
  } else if (meetingAttendanceRate >= 60) {
    score += 2;
  } else if (meetingAttendanceRate >= 40) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 2: Child chairing rate
  if (meetings.length === 0) {
    score += 0;
  } else if (childChairingRate >= 50) {
    score += 5;
  } else if (childChairingRate >= 25) {
    score += 2;
  } else if (childChairingRate >= 10) {
    score += 0;
  } else {
    score -= 4;
  }

  // Mod 3: Feedback response rate
  if (feedback.length === 0) {
    score += 0;
  } else if (feedbackResponseRate >= 85) {
    score += 6;
  } else if (feedbackResponseRate >= 60) {
    score += 3;
  } else if (feedbackResponseRate >= 40) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 4: Positive feedback rate
  if (feedback.length === 0) {
    score += 0;
  } else if (positiveFeedbackRate >= 80) {
    score += 5;
  } else if (positiveFeedbackRate >= 60) {
    score += 2;
  } else if (positiveFeedbackRate >= 40) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 5: Policy accessibility rate
  if (policies.length === 0) {
    score += 0;
  } else if (childFriendlyPolicyRate >= 80) {
    score += 5;
  } else if (childFriendlyPolicyRate >= 50) {
    score += 2;
  } else if (childFriendlyPolicyRate >= 30) {
    score += 0;
  } else {
    score -= 4;
  }

  // Mod 6: Expert participation rate
  if (expert_entries.length === 0 && total_children > 0) {
    score -= 1;
  } else if (expert_entries.length === 0) {
    score += 0;
  } else if (expertParticipationRate >= 50) {
    score += 4;
  } else if (expertParticipationRate >= 25) {
    score += 1;
  } else if (expertParticipationRate >= 10) {
    score += 0;
  } else {
    score -= 4;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ──────────────────────────────────────────────────────────
  let voice_rating: ChildrensVoiceRating;
  if (score >= 80) voice_rating = "outstanding";
  else if (score >= 65) voice_rating = "good";
  else if (score >= 45) voice_rating = "adequate";
  else voice_rating = "inadequate";

  // ── Headline ────────────────────────────────────────────────────────
  const headlines: Record<ChildrensVoiceRating, string> = {
    outstanding:
      "Exceptional children's voice and participation — children are genuinely heard and actively shape the life of the home.",
    good: "Strong children's voice — most children participate meaningfully and feedback is acted upon.",
    adequate:
      "Children's voice meets basic requirements but participation could be strengthened.",
    inadequate:
      "Critical gaps in children's voice and participation — urgent action required to meet Reg 7 and Reg 5.",
    insufficient_data:
      "No children recorded — children's voice and participation cannot be assessed.",
  };
  const headline = headlines[voice_rating];

  // ── Strengths ───────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meetingAttendanceRate >= 80 && meetings.length > 0)
    strengths.push(
      `Strong meeting attendance — ${meetingAttendanceRate}% average attendance across ${meetings.length} meeting${meetings.length > 1 ? "s" : ""}.`,
    );
  if (childChairingRate >= 50 && meetings.length > 0)
    strengths.push(
      `Children actively chairing meetings — ${childChairingRate}% of meetings child-chaired.`,
    );
  if (feedbackResponseRate >= 85 && feedback.length > 0)
    strengths.push(
      `Excellent feedback response — ${feedbackResponseRate}% of children's feedback informed to staff and acted upon.`,
    );
  if (positiveFeedbackRate >= 80 && feedback.length > 0)
    strengths.push(
      `High positive sentiment — ${positiveFeedbackRate}% of feedback is positive.`,
    );
  if (childFriendlyPolicyRate >= 80 && policies.length > 0)
    strengths.push(
      `Child-friendly policies — ${childFriendlyPolicyRate}% of policies shared in accessible formats.`,
    );
  if (expertParticipationRate >= 50 && expert_entries.length > 0)
    strengths.push(
      `Strong children-as-experts participation — ${expertParticipationCount} child${expertParticipationCount > 1 ? "ren" : ""} actively participating.`,
    );

  // ── Concerns ────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (meetings.length === 0 && total_children > 0)
    concerns.push(
      "No children's meetings recorded — children's collective voice is not being facilitated.",
    );
  if (meetingAttendanceRate < 40 && meetings.length > 0)
    concerns.push(
      `Low meeting attendance — only ${meetingAttendanceRate}% average, many children's voices may be missing.`,
    );
  if (childChairingRate < 10 && meetings.length > 0)
    concerns.push(
      `Minimal child chairing — only ${childChairingRate}% of meetings chaired by children.`,
    );
  if (feedbackResponseRate < 40 && feedback.length > 0)
    concerns.push(
      `Poor feedback response — only ${feedbackResponseRate}% of feedback both informed to staff and acted upon.`,
    );
  if (positiveFeedbackRate < 40 && feedback.length > 0)
    concerns.push(
      `Low positive sentiment — only ${positiveFeedbackRate}% of feedback is positive, indicating potential dissatisfaction.`,
    );
  if (childFriendlyPolicyRate < 30 && policies.length > 0)
    concerns.push(
      `Policies not child-accessible — only ${childFriendlyPolicyRate}% shared in child-friendly formats.`,
    );
  if (expert_entries.length === 0 && total_children > 0)
    concerns.push(
      "No children-as-experts entries — children are not being empowered as experts in their own care.",
    );
  if (expertParticipationRate < 10 && expert_entries.length > 0)
    concerns.push(
      `Very low expert participation — only ${expertParticipationCount} of ${total_children} children participating as experts.`,
    );
  const complaintsCount = meetings.filter((m) => m.complaints_raised).length;
  if (complaintsCount > 0)
    concerns.push(
      `${complaintsCount} meeting${complaintsCount > 1 ? "s" : ""} had complaints raised — children may feel unheard.`,
    );

  // ── Recommendations ─────────────────────────────────────────────────
  const recommendations: {
    rank: number;
    recommendation: string;
    urgency: string;
    regulatory_ref: string | null;
  }[] = [];
  let recRank = 0;

  if (meetings.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Establish regular children's meetings — Reg 7 requires children's views to inform the running of the home.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  if (meetingAttendanceRate < 40 && meetings.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Improve meeting attendance — explore barriers preventing children from attending and adapt meeting formats.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  if (feedbackResponseRate < 40 && feedback.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Strengthen feedback response processes — ensure all children's feedback is acknowledged and acted upon.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  if (childFriendlyPolicyRate < 30 && policies.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Make policies child-accessible — Reg 5 requires children to understand the home's policies in formats suited to them.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5",
    });
  }

  if (expert_entries.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Create children-as-experts opportunities — enable children to contribute as experts in their own care and home life.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  if (childChairingRate < 10 && meetings.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Encourage child chairing of meetings — supporting children to chair builds confidence and genuine participation.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5",
    });
  }

  if (positiveFeedbackRate < 40 && feedback.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Investigate low positive sentiment — review what children are saying and address underlying causes of dissatisfaction.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  // ── Insights ────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (
    meetingAttendanceRate >= 80 &&
    feedbackResponseRate >= 85 &&
    positiveFeedbackRate >= 80 &&
    childFriendlyPolicyRate >= 80 &&
    expertParticipationRate >= 50
  )
    insights.push({
      text: "ARIA recognises an embedded children's voice culture — children are heard, responded to, and empowered across all participation domains.",
      severity: "positive",
    });

  if (meetings.length > 0 && childChairingRate >= 50 && meetingAttendanceRate >= 80)
    insights.push({
      text: `ARIA detects strong child-led governance — ${childChairingRate}% of meetings child-chaired with ${meetingAttendanceRate}% attendance.`,
      severity: "positive",
    });

  if (
    feedback.length > 0 &&
    positiveFeedbackRate < 40 &&
    feedbackResponseRate < 40
  )
    insights.push({
      text: "ARIA flags a dual concern — both low positive sentiment and poor feedback response suggest children feel unheard.",
      severity: "critical",
    });

  if (meetings.length === 0 && feedback.length === 0 && total_children > 0)
    insights.push({
      text: "ARIA flags absence of both meetings and feedback — no formal mechanism exists for children's voices to be heard.",
      severity: "critical",
    });

  if (complaintsCount >= 2)
    insights.push({
      text: `ARIA notes complaints raised in ${complaintsCount} meetings — pattern may indicate systemic dissatisfaction.`,
      severity: "warning",
    });

  if (expert_entries.length > 0 && expertParticipationRate >= 50)
    insights.push({
      text: `${expertParticipationCount} children actively participating as experts — evidence of children shaping their own care.`,
      severity: "positive",
    });

  if (
    feedback.length >= 5 &&
    positiveFeedbackRate >= 80 &&
    feedbackResponseRate >= 85
  )
    insights.push({
      text: `Strong feedback loop — ${positiveFeedbackRate}% positive sentiment with ${feedbackResponseRate}% response rate across ${feedback.length} feedback entries.`,
      severity: "positive",
    });

  return {
    voice_rating,
    voice_score: score,
    headline,
    meeting_attendance_rate: meetingAttendanceRate,
    feedback_response_rate: feedbackResponseRate,
    child_friendly_policy_rate: childFriendlyPolicyRate,
    expert_participation_count: expertParticipationCount,
    positive_feedback_rate: positiveFeedbackRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
