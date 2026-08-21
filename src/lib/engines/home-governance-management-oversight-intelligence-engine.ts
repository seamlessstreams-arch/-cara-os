// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME GOVERNANCE & MANAGEMENT OVERSIGHT INTELLIGENCE ENGINE
// Home-level: assesses quality of governance and management oversight —
// walkrounds, governance meetings, board reporting, operational meetings,
// and commissioning feedback.
// CHR 2015 Reg 40 (Standards) / Reg 45 (Review of Quality of Care).
// SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface WalkroundInput {
  id: string;
  date: string;
  areas_visited_count: number;
  positive_observations: number;
  improvements_identified: number;
  child_interactions: number;
  staff_interactions: number;
  immediate_actions_taken: number;
  follow_up_actions_logged: number;
}

export interface GovernanceMeetingInput {
  id: string;
  date: string;
  attendees_count: number;
  key_decisions_count: number;
  actions_count: number;
  children_discussed_count: number;
  regulatory_topics_discussed: boolean;
  risk_items_count: number;
}

export interface BoardReportInput {
  id: string;
  submitted_date: string;
  risk_rag: string; // "green" | "amber" | "red"
  board_response_received: boolean;
  actions_agreed_count: number;
  areas_of_concern_count: number;
}

export interface OperationalMeetingInput {
  id: string;
  date: string;
  attendees_count: number;
  key_decisions_count: number;
  child_updates_count: number;
  risks_identified_count: number;
  actions_agreed_count: number;
  positive_moments_shared: number;
}

export interface CommissioningFeedbackInput {
  id: string;
  date: string;
  overall_rating: number; // 1-5
  has_strengths: boolean;
  has_development_areas: boolean;
  action_plan_in_place: boolean;
}

export interface GovernanceOversightInput {
  today: string;
  total_children: number;
  walkrounds: WalkroundInput[];
  governance_meetings: GovernanceMeetingInput[];
  board_reports: BoardReportInput[];
  operational_meetings: OperationalMeetingInput[];
  commissioning_feedback: CommissioningFeedbackInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type GovernanceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface GovernanceOversightResult {
  governance_rating: GovernanceRating;
  governance_score: number;
  headline: string;
  total_walkrounds: number;
  total_governance_meetings: number;
  total_board_reports: number;
  operational_meeting_rate: number;
  commissioning_satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): GovernanceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeGovernanceManagementOversight(
  input: GovernanceOversightInput,
): GovernanceOversightResult {
  const {
    total_children,
    walkrounds,
    governance_meetings,
    board_reports,
    operational_meetings,
    commissioning_feedback,
  } = input;

  // ── Insufficient data guard ───────────────────────────────────────
  if (total_children === 0) {
    return {
      governance_rating: "insufficient_data",
      governance_score: 0,
      headline: "No children placed — governance oversight cannot be assessed.",
      total_walkrounds: 0,
      total_governance_meetings: 0,
      total_board_reports: 0,
      operational_meeting_rate: 0,
      commissioning_satisfaction_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [{ text: "No children are currently placed at the home. Governance oversight assessment requires an active placement cohort.", severity: "warning" }],
    };
  }

  // ── Metrics ───────────────────────────────────────────────────────
  const totalWalkrounds = walkrounds.length;
  const totalGovMeetings = governance_meetings.length;
  const totalBoardReports = board_reports.length;
  const totalOpsMeetings = operational_meetings.length;
  const totalCommFeedback = commissioning_feedback.length;

  // Walkround quality
  const avgChildInteractions = totalWalkrounds > 0
    ? walkrounds.reduce((s, w) => s + w.child_interactions, 0) / totalWalkrounds
    : 0;

  // Governance meeting engagement: meetings where regulatory_topics_discussed AND children_discussed_count > 0
  const engagedGovMeetings = governance_meetings.filter(
    m => m.regulatory_topics_discussed && m.children_discussed_count > 0,
  ).length;
  const govEngagementPct = pct(engagedGovMeetings, totalGovMeetings);

  // Board responsiveness: reports where board_response_received
  const respondedReports = board_reports.filter(r => r.board_response_received).length;
  const boardResponsePct = pct(respondedReports, totalBoardReports);

  // Operational meeting effectiveness: meetings with key_decisions_count > 0 AND actions_agreed_count > 0
  const effectiveOpsMeetings = operational_meetings.filter(
    m => m.key_decisions_count > 0 && m.actions_agreed_count > 0,
  ).length;
  const opsEffectivenessPct = pct(effectiveOpsMeetings, totalOpsMeetings);

  // Commissioning satisfaction: feedback with overall_rating >= 4
  const satisfiedComm = commissioning_feedback.filter(f => f.overall_rating >= 4).length;
  const commSatisfactionPct = pct(satisfiedComm, totalCommFeedback);

  // Risk governance: governance meetings with risk_items_count > 0
  const riskGovMeetings = governance_meetings.filter(m => m.risk_items_count > 0).length;
  const riskGovPct = pct(riskGovMeetings, totalGovMeetings);

  // ── Scoring ───────────────────────────────────────────────────────
  let score = 52;

  // Mod 1: Walkround frequency & quality
  if (totalWalkrounds >= 4 && avgChildInteractions >= 2) {
    score += 5;
  } else if (totalWalkrounds >= 4) {
    score += 2;
  } else if (totalWalkrounds >= 2) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 2: Governance meeting engagement
  if (govEngagementPct >= 80) {
    score += 6;
  } else if (govEngagementPct >= 50) {
    score += 3;
  } else if (govEngagementPct >= 30) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 3: Board reporting & responsiveness
  if (boardResponsePct >= 80) {
    score += 5;
  } else if (boardResponsePct >= 50) {
    score += 2;
  } else if (boardResponsePct >= 30) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 4: Operational meeting effectiveness
  if (opsEffectivenessPct >= 80) {
    score += 5;
  } else if (opsEffectivenessPct >= 50) {
    score += 2;
  } else if (opsEffectivenessPct >= 30) {
    score += 0;
  } else {
    score -= 4;
  }

  // Mod 5: Commissioning satisfaction
  if (commSatisfactionPct >= 80) {
    score += 5;
  } else if (commSatisfactionPct >= 50) {
    score += 2;
  } else if (commSatisfactionPct >= 30) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 6: Risk governance
  if (totalGovMeetings === 0) {
    score -= 1;
  } else if (riskGovPct >= 70) {
    score += 4;
  } else if (riskGovPct >= 40) {
    score += 1;
  } else if (riskGovPct >= 20) {
    score += 0;
  } else {
    score -= 4;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (totalWalkrounds >= 4 && avgChildInteractions >= 2) {
    strengths.push(`${totalWalkrounds} management walkrounds completed with meaningful child engagement (avg ${Math.round(avgChildInteractions * 10) / 10} interactions per walkround).`);
  }
  if (boardResponsePct >= 80 && totalBoardReports > 0) {
    strengths.push(`${boardResponsePct}% of board reports received a response — strong governance accountability loop.`);
  }
  if (opsEffectivenessPct >= 80 && totalOpsMeetings > 0) {
    strengths.push(`${opsEffectivenessPct}% of operational meetings resulted in clear decisions and actions — effective management oversight.`);
  }
  if (govEngagementPct >= 80 && totalGovMeetings > 0) {
    strengths.push(`${govEngagementPct}% of governance meetings addressed regulatory topics and discussed individual children — child-centred governance.`);
  }
  if (commSatisfactionPct >= 80 && totalCommFeedback > 0) {
    strengths.push(`${commSatisfactionPct}% commissioning satisfaction rate — external stakeholders view the home positively.`);
  }
  if (riskGovPct >= 70 && totalGovMeetings > 0) {
    strengths.push(`${riskGovPct}% of governance meetings actively addressed risk items — proactive risk management culture.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (totalWalkrounds < 2) {
    concerns.push(`Only ${totalWalkrounds} management walkround(s) recorded — managers should be visibly present and actively monitoring the home.`);
  }
  if (totalBoardReports > 0 && boardResponsePct < 30) {
    concerns.push(`Only ${boardResponsePct}% of board reports received a response — governance structures are not providing accountability.`);
  }
  if (totalCommFeedback > 0 && commSatisfactionPct < 30) {
    concerns.push(`Only ${commSatisfactionPct}% commissioning satisfaction — external stakeholder confidence is critically low.`);
  }
  if (totalGovMeetings > 0 && govEngagementPct < 30) {
    concerns.push(`Only ${govEngagementPct}% of governance meetings discussed both regulatory topics and children — governance may be detached from practice.`);
  }
  if (totalOpsMeetings > 0 && opsEffectivenessPct < 30) {
    concerns.push(`Only ${opsEffectivenessPct}% of operational meetings produced decisions and actions — meetings may lack purpose or follow-through.`);
  }
  if (totalGovMeetings > 0 && riskGovPct < 20) {
    concerns.push(`Only ${riskGovPct}% of governance meetings addressed risk items — risk may not be adequately overseen at governance level.`);
  }

  // ── Recommendations ───────────────────────────────────────────────
  const recs: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 1;

  if (totalWalkrounds < 2) {
    recs.push({
      rank: rank++,
      recommendation: "Increase management walkround frequency to at least monthly — active monitoring demonstrates visible leadership and identifies practice quality issues early.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (totalBoardReports > 0 && boardResponsePct < 50) {
    recs.push({
      rank: rank++,
      recommendation: `Improve board engagement with submitted reports — only ${boardResponsePct}% received a response. Governance bodies must demonstrate active scrutiny.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 45",
    });
  }
  if (totalGovMeetings > 0 && govEngagementPct < 50) {
    recs.push({
      rank: rank++,
      recommendation: `Ensure governance meetings routinely discuss regulatory compliance and individual children — currently only ${govEngagementPct}% of meetings cover both.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 45",
    });
  }
  if (totalOpsMeetings > 0 && opsEffectivenessPct < 50) {
    recs.push({
      rank: rank++,
      recommendation: `Strengthen operational meeting outcomes — only ${opsEffectivenessPct}% produce clear decisions and actions. Use structured agendas with action tracking.`,
      urgency: "planned",
      regulatory_ref: null,
    });
  }
  if (totalCommFeedback > 0 && commSatisfactionPct < 50) {
    recs.push({
      rank: rank++,
      recommendation: `Address commissioning concerns — only ${commSatisfactionPct}% satisfaction rate. Develop an improvement plan with commissioning partners.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 45",
    });
  }
  if (totalGovMeetings === 0) {
    recs.push({
      rank: rank++,
      recommendation: "Establish a regular governance meeting schedule — there is no evidence of governance meetings taking place.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 45",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (rating === "outstanding") {
    insights.push({
      text: `Governance and management oversight is exemplary. ${totalWalkrounds} walkrounds, ${totalGovMeetings} governance meetings, and ${boardResponsePct}% board responsiveness demonstrate a home where leadership actively monitors quality, holds itself accountable, and drives continuous improvement. Ofsted will see clear evidence of a well-led home under Reg 40 and Reg 45.`,
      severity: "positive",
    });
  }

  if (totalWalkrounds >= 4 && avgChildInteractions >= 2) {
    insights.push({
      text: `Management walkrounds show genuine engagement — ${totalWalkrounds} completed with an average of ${Math.round(avgChildInteractions * 10) / 10} child interactions each. This demonstrates managers who are visible, approachable, and actively monitoring the lived experience of children.`,
      severity: "positive",
    });
  }

  if (totalWalkrounds < 2) {
    insights.push({
      text: `Only ${totalWalkrounds} management walkround(s) recorded. Managers must be visibly present in the home, observing practice, interacting with children, and identifying improvements. Without regular walkrounds, Ofsted will question whether managers truly understand the day-to-day quality of care.`,
      severity: "critical",
    });
  }

  if (totalBoardReports > 0 && boardResponsePct < 30) {
    insights.push({
      text: `Board responsiveness is critically low at ${boardResponsePct}%. When submitted reports go unanswered, governance structures fail to provide the accountability required under Reg 45. This represents a systemic oversight gap that Ofsted will view seriously.`,
      severity: "critical",
    });
  }

  if (totalGovMeetings > 0 && govEngagementPct < 30) {
    insights.push({
      text: `Only ${govEngagementPct}% of governance meetings discussed both regulatory topics and individual children. Governance that does not connect regulatory requirements to outcomes for children risks becoming a tick-box exercise rather than meaningful oversight.`,
      severity: "warning",
    });
  }

  if (totalCommFeedback > 0 && commSatisfactionPct < 30) {
    insights.push({
      text: `Commissioning satisfaction is only ${commSatisfactionPct}%. Low external confidence signals potential quality concerns that may lead to reduced referrals or enhanced monitoring from placing authorities.`,
      severity: "warning",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding governance and management oversight — ${totalWalkrounds} walkrounds, ${totalGovMeetings} governance meetings, ${boardResponsePct}% board responsiveness.`;
  } else if (rating === "good") {
    headline = `Good governance oversight — active management monitoring with minor gaps in some oversight areas.`;
  } else if (rating === "adequate") {
    headline = "Adequate governance oversight — management structures exist but lack consistency or depth in key areas.";
  } else if (rating === "inadequate") {
    headline = "Governance and management oversight is inadequate — significant gaps in monitoring, accountability, or responsiveness.";
  } else {
    headline = "No children placed — governance oversight cannot be assessed.";
  }

  return {
    governance_rating: rating,
    governance_score: score,
    headline,
    total_walkrounds: totalWalkrounds,
    total_governance_meetings: totalGovMeetings,
    total_board_reports: totalBoardReports,
    operational_meeting_rate: opsEffectivenessPct,
    commissioning_satisfaction_rate: commSatisfactionPct,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
