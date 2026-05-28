// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME COMPLAINT & ADVOCACY RESPONSIVENESS INTELLIGENCE ENGINE
// Monitors how well the home responds to complaints, ensures children have
// access to advocacy, and tracks the quality of complaint resolution.
// Measures complaint handling timeliness, advocacy access, child participation,
// and feedback loop completion.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 39 (Complaints), Reg 7 (Child's plan).
// SCCIF: "Voice of the child".
// Store keys: complaintOutcomeRecords, complaintTrends, advocacyRecords,
//             childFeedbackLoops, participationEntries
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ComplaintOutcomeInput {
  id: string;
  child_id: string;
  complaint_date: string;
  complaint_type: "formal" | "informal" | "anonymous";
  category: string;
  acknowledged: boolean;
  acknowledged_date: string | null;
  resolved: boolean;
  resolution_date: string | null;
  resolution_description: string | null;
  child_satisfied: boolean;
  learning_actions_identified: number;
  learning_actions_implemented: number;
  target_resolution_days: number;
  actual_resolution_days: number | null;
  created_at: string;
}

export interface ComplaintTrendInput {
  id: string;
  period_start: string;
  period_end: string;
  total_complaints: number;
  resolved_count: number;
  average_resolution_days: number;
  recurring_themes: string[];
  actions_taken: string;
  reviewed_by: string;
  created_at: string;
}

export interface AdvocacyRecordInput {
  id: string;
  child_id: string;
  advocacy_type: "independent" | "internal" | "peer";
  provider_name: string;
  start_date: string;
  active: boolean;
  meetings_held: number;
  quality_rating: number; // 1-5
  child_voice_captured: boolean;
  outcomes_documented: boolean;
  created_at: string;
}

export interface ChildFeedbackLoopInput {
  id: string;
  child_id: string;
  feedback_date: string;
  feedback_type: "survey" | "meeting" | "informal" | "suggestion_box";
  feedback_recorded: boolean;
  response_given: boolean;
  response_date: string | null;
  child_acknowledged_response: boolean;
  loop_closed: boolean;
  created_at: string;
}

export interface ParticipationEntryInput {
  id: string;
  child_id: string;
  date: string;
  participation_type: "house_meeting" | "menu_planning" | "activity_planning" | "review" | "consultation";
  attended: boolean;
  voice_heard: boolean;
  outcome_influenced: boolean;
  created_at: string;
}

export interface ComplaintAdvocacyResponsivenessInput {
  today: string;
  total_children: number;
  complaint_outcomes: ComplaintOutcomeInput[];
  complaint_trends: ComplaintTrendInput[];
  advocacy_records: AdvocacyRecordInput[];
  child_feedback_loops: ChildFeedbackLoopInput[];
  participation_entries: ParticipationEntryInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ComplaintAdvocacyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ComplaintAdvocacyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ComplaintAdvocacyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ComplaintAdvocacyResponsivenessResult {
  responsiveness_rating: ComplaintAdvocacyRating;
  responsiveness_score: number;
  headline: string;
  total_complaints: number;
  complaint_resolution_rate: number;
  complaint_timeliness_rate: number;
  advocacy_access_rate: number;
  child_satisfaction_rate: number;
  feedback_loop_completion_rate: number;
  participation_rate: number;
  complaint_acknowledgement_rate: number;
  learning_implemented_rate: number;
  advocacy_quality_avg: number;
  strengths: string[];
  concerns: string[];
  recommendations: ComplaintAdvocacyRecommendation[];
  insights: ComplaintAdvocacyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ComplaintAdvocacyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: ComplaintAdvocacyRating,
  score: number,
  headline: string,
): ComplaintAdvocacyResponsivenessResult {
  return {
    responsiveness_rating: rating,
    responsiveness_score: score,
    headline,
    total_complaints: 0,
    complaint_resolution_rate: 0,
    complaint_timeliness_rate: 0,
    advocacy_access_rate: 0,
    child_satisfaction_rate: 0,
    feedback_loop_completion_rate: 0,
    participation_rate: 0,
    complaint_acknowledgement_rate: 0,
    learning_implemented_rate: 0,
    advocacy_quality_avg: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeComplaintAdvocacyResponsiveness(
  input: ComplaintAdvocacyResponsivenessInput,
): ComplaintAdvocacyResponsivenessResult {
  const {
    total_children,
    complaint_outcomes,
    complaint_trends,
    advocacy_records,
    child_feedback_loops,
    participation_entries,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    complaint_outcomes.length === 0 &&
    complaint_trends.length === 0 &&
    advocacy_records.length === 0 &&
    child_feedback_loops.length === 0 &&
    participation_entries.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess complaint and advocacy responsiveness.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No complaint or advocacy data recorded despite children on placement — complaint handling and advocacy access require urgent attention.",
      ),
      concerns: [
        "No complaint outcomes, advocacy records, feedback loops, or participation entries exist despite children being on placement — the home cannot evidence responsive complaint handling or advocacy access.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of complaint outcomes, advocacy provision, child feedback loops, and participation to evidence the home's responsiveness to children's concerns and voices.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 39 — Complaints",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all children have documented access to an independent advocate and that advocacy meetings are recorded with quality ratings.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
        },
      ],
      insights: [
        {
          text: "The complete absence of complaint and advocacy records means Ofsted cannot verify that children's voices are heard, complaints are resolved, or advocacy is accessible. This represents a fundamental gap in Reg 39 compliance and the voice of the child.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Complaint metrics ---
  const totalComplaints = complaint_outcomes.length;

  const resolvedComplaints = complaint_outcomes.filter((c) => c.resolved).length;
  const complaintResolutionRate = pct(resolvedComplaints, totalComplaints);

  const resolvedWithinTarget = complaint_outcomes.filter(
    (c) =>
      c.resolved &&
      c.actual_resolution_days !== null &&
      c.actual_resolution_days <= c.target_resolution_days,
  ).length;
  const complaintTimelinessRate = pct(resolvedWithinTarget, totalComplaints);

  const acknowledgedComplaints = complaint_outcomes.filter((c) => c.acknowledged).length;
  const complaintAcknowledgementRate = pct(acknowledgedComplaints, totalComplaints);

  const satisfiedChildren = complaint_outcomes.filter((c) => c.child_satisfied).length;
  const childSatisfactionRate = pct(satisfiedChildren, totalComplaints);

  const totalLearningIdentified = complaint_outcomes.reduce(
    (sum, c) => sum + c.learning_actions_identified,
    0,
  );
  const totalLearningImplemented = complaint_outcomes.reduce(
    (sum, c) => sum + c.learning_actions_implemented,
    0,
  );
  const learningImplementedRate = pct(totalLearningImplemented, totalLearningIdentified);

  // --- Advocacy metrics ---
  const uniqueChildrenWithAdvocacy = new Set(
    advocacy_records.filter((a) => a.active).map((a) => a.child_id),
  ).size;
  const advocacyAccessRate =
    total_children > 0 ? pct(uniqueChildrenWithAdvocacy, total_children) : 0;

  const advocacyQualitySum = advocacy_records.reduce(
    (sum, a) => sum + a.quality_rating,
    0,
  );
  const advocacyQualityAvg =
    advocacy_records.length > 0
      ? Math.round((advocacyQualitySum / advocacy_records.length) * 100) / 100
      : 0;

  // --- Feedback loop metrics ---
  const totalFeedbackLoops = child_feedback_loops.length;
  const closedFeedbackLoops = child_feedback_loops.filter((f) => f.loop_closed).length;
  const feedbackLoopCompletionRate = pct(closedFeedbackLoops, totalFeedbackLoops);

  // --- Participation metrics ---
  const totalParticipationOpportunities = participation_entries.length;
  const attendedEntries = participation_entries.filter((p) => p.attended).length;
  const participationRate = pct(attendedEntries, totalParticipationOpportunities);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus: complaintResolutionRate (>=100: +4, >=80: +2) ---
  if (complaintResolutionRate >= 100) score += 4;
  else if (complaintResolutionRate >= 80) score += 2;

  // --- Bonus: complaintTimelinessRate (>=90: +3, >=70: +1) ---
  if (complaintTimelinessRate >= 90) score += 3;
  else if (complaintTimelinessRate >= 70) score += 1;

  // --- Bonus: advocacyAccessRate (>=100: +4, >=80: +2) ---
  if (advocacyAccessRate >= 100) score += 4;
  else if (advocacyAccessRate >= 80) score += 2;

  // --- Bonus: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (childSatisfactionRate >= 90) score += 3;
  else if (childSatisfactionRate >= 70) score += 1;

  // --- Bonus: feedbackLoopCompletionRate (>=100: +3, >=80: +1) ---
  if (feedbackLoopCompletionRate >= 100) score += 3;
  else if (feedbackLoopCompletionRate >= 80) score += 1;

  // --- Bonus: participationRate (>=90: +3, >=70: +1) ---
  if (participationRate >= 90) score += 3;
  else if (participationRate >= 70) score += 1;

  // --- Bonus: complaintAcknowledgementRate (>=100: +2, >=80: +1) ---
  if (complaintAcknowledgementRate >= 100) score += 2;
  else if (complaintAcknowledgementRate >= 80) score += 1;

  // --- Bonus: learningImplementedRate (>=90: +3, >=70: +1) ---
  if (learningImplementedRate >= 90) score += 3;
  else if (learningImplementedRate >= 70) score += 1;

  // --- Bonus: advocacyQualityAvg (>=4.0: +3, >=3.0: +1) ---
  if (advocacyQualityAvg >= 4.0) score += 3;
  else if (advocacyQualityAvg >= 3.0) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // complaintResolutionRate < 50 → -5
  if (complaintResolutionRate < 50 && totalComplaints > 0) score -= 5;

  // advocacyAccessRate < 50 → -5
  if (advocacyAccessRate < 50 && total_children > 0) score -= 5;

  // feedbackLoopCompletionRate < 50 → -5
  if (feedbackLoopCompletionRate < 50 && totalFeedbackLoops > 0) score -= 5;

  // participationRate < 30 → -3
  if (participationRate < 30 && totalParticipationOpportunities > 0) score -= 3;

  score = clamp(score, 0, 100);

  const responsiveness_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (complaintResolutionRate >= 100 && totalComplaints > 0) {
    strengths.push(
      "Every complaint has been resolved — the home demonstrates complete commitment to addressing children's concerns.",
    );
  } else if (complaintResolutionRate >= 80 && totalComplaints > 0) {
    strengths.push(
      `${complaintResolutionRate}% complaint resolution rate — the home resolves the majority of complaints effectively.`,
    );
  }

  if (complaintTimelinessRate >= 90 && totalComplaints > 0) {
    strengths.push(
      `${complaintTimelinessRate}% of complaints resolved within target timeframes — strong timeliness in complaint handling.`,
    );
  } else if (complaintTimelinessRate >= 70 && totalComplaints > 0) {
    strengths.push(
      `${complaintTimelinessRate}% of complaints resolved within target — generally timely complaint resolution.`,
    );
  }

  if (advocacyAccessRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has access to an active advocate — advocacy provision is comprehensive.",
    );
  } else if (advocacyAccessRate >= 80 && total_children > 0) {
    strengths.push(
      `${advocacyAccessRate}% of children have advocacy access — strong advocacy provision across the home.`,
    );
  }

  if (childSatisfactionRate >= 90 && totalComplaints > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction with complaint outcomes — children feel their concerns are taken seriously and resolved well.`,
    );
  } else if (childSatisfactionRate >= 70 && totalComplaints > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction rate — most children are satisfied with how their complaints are handled.`,
    );
  }

  if (feedbackLoopCompletionRate >= 100 && totalFeedbackLoops > 0) {
    strengths.push(
      "All feedback loops are closed — every piece of child feedback receives a documented response and acknowledgement.",
    );
  } else if (feedbackLoopCompletionRate >= 80 && totalFeedbackLoops > 0) {
    strengths.push(
      `${feedbackLoopCompletionRate}% of feedback loops closed — strong practice in responding to and closing out child feedback.`,
    );
  }

  if (participationRate >= 90 && totalParticipationOpportunities > 0) {
    strengths.push(
      `${participationRate}% participation rate — children are actively engaged in decisions that affect their lives.`,
    );
  } else if (participationRate >= 70 && totalParticipationOpportunities > 0) {
    strengths.push(
      `${participationRate}% participation rate — good levels of child engagement in home activities and decisions.`,
    );
  }

  if (complaintAcknowledgementRate >= 100 && totalComplaints > 0) {
    strengths.push(
      "Every complaint acknowledged promptly — children know their concerns are heard from the outset.",
    );
  } else if (complaintAcknowledgementRate >= 80 && totalComplaints > 0) {
    strengths.push(
      `${complaintAcknowledgementRate}% complaint acknowledgement rate — most complaints are acknowledged promptly.`,
    );
  }

  if (learningImplementedRate >= 90 && totalLearningIdentified > 0) {
    strengths.push(
      `${learningImplementedRate}% of complaint learning actions implemented — the home translates complaints into genuine practice improvements.`,
    );
  } else if (learningImplementedRate >= 70 && totalLearningIdentified > 0) {
    strengths.push(
      `${learningImplementedRate}% of learning actions implemented — the home generally acts on lessons identified through complaints.`,
    );
  }

  if (advocacyQualityAvg >= 4.0 && advocacy_records.length > 0) {
    strengths.push(
      `Advocacy quality averages ${advocacyQualityAvg}/5 — high-quality advocacy provision that effectively represents children's voices.`,
    );
  } else if (advocacyQualityAvg >= 3.0 && advocacy_records.length > 0) {
    strengths.push(
      `Advocacy quality averages ${advocacyQualityAvg}/5 — competent advocacy provision supporting children's voices.`,
    );
  }

  const independentAdvocacy = advocacy_records.filter(
    (a) => a.advocacy_type === "independent" && a.active,
  ).length;
  if (independentAdvocacy > 0) {
    strengths.push(
      `${independentAdvocacy} active independent advocacy arrangement${independentAdvocacy !== 1 ? "s" : ""} — children have access to external, impartial support.`,
    );
  }

  const voiceCapturedAdvocacy = advocacy_records.filter((a) => a.child_voice_captured).length;
  if (pct(voiceCapturedAdvocacy, advocacy_records.length) >= 90 && advocacy_records.length > 0) {
    strengths.push(
      "Child voice captured in the vast majority of advocacy sessions — advocacy is genuinely child-centred.",
    );
  }

  const outcomeInfluenced = participation_entries.filter((p) => p.outcome_influenced).length;
  if (pct(outcomeInfluenced, totalParticipationOpportunities) >= 70 && totalParticipationOpportunities > 0) {
    strengths.push(
      "Children's participation is genuinely influencing outcomes — their voices are not just heard but acted upon.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (complaintResolutionRate < 50 && totalComplaints > 0) {
    concerns.push(
      `Only ${complaintResolutionRate}% of complaints resolved — the majority of children's complaints remain unaddressed, undermining trust in the complaints process.`,
    );
  } else if (complaintResolutionRate < 80 && complaintResolutionRate >= 50 && totalComplaints > 0) {
    concerns.push(
      `Complaint resolution rate at ${complaintResolutionRate}% — some complaints are not being resolved, which may leave children feeling unheard.`,
    );
  }

  if (complaintTimelinessRate < 70 && totalComplaints > 0) {
    concerns.push(
      `Only ${complaintTimelinessRate}% of complaints resolved within target timeframes — delays in complaint handling may cause frustration and erode children's confidence in the process.`,
    );
  }

  if (advocacyAccessRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${advocacyAccessRate}% of children have access to advocacy — the majority of children lack an independent voice to represent their interests.`,
    );
  } else if (advocacyAccessRate < 80 && advocacyAccessRate >= 50 && total_children > 0) {
    concerns.push(
      `Advocacy access at ${advocacyAccessRate}% — not all children have an advocate to support them in expressing their views.`,
    );
  }

  if (childSatisfactionRate < 50 && totalComplaints > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% of children satisfied with complaint outcomes — the complaints process is not delivering outcomes that children find acceptable.`,
    );
  } else if (childSatisfactionRate < 70 && childSatisfactionRate >= 50 && totalComplaints > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not satisfied with how their complaints are resolved.`,
    );
  }

  if (feedbackLoopCompletionRate < 50 && totalFeedbackLoops > 0) {
    concerns.push(
      `Only ${feedbackLoopCompletionRate}% of feedback loops closed — children are giving feedback but not receiving responses, undermining the value of seeking their views.`,
    );
  } else if (feedbackLoopCompletionRate < 80 && feedbackLoopCompletionRate >= 50 && totalFeedbackLoops > 0) {
    concerns.push(
      `Feedback loop completion at ${feedbackLoopCompletionRate}% — some child feedback is not being responded to or closed out.`,
    );
  }

  if (participationRate < 30 && totalParticipationOpportunities > 0) {
    concerns.push(
      `Only ${participationRate}% participation rate — children are not engaging in activities and decisions that affect their daily lives.`,
    );
  } else if (participationRate < 70 && participationRate >= 30 && totalParticipationOpportunities > 0) {
    concerns.push(
      `Participation rate at ${participationRate}% — not all children are actively involved in the home's decision-making processes.`,
    );
  }

  if (complaintAcknowledgementRate < 80 && totalComplaints > 0) {
    concerns.push(
      `Complaint acknowledgement rate at ${complaintAcknowledgementRate}% — some children are not receiving prompt acknowledgement when they raise concerns.`,
    );
  }

  if (learningImplementedRate < 50 && totalLearningIdentified > 0) {
    concerns.push(
      `Only ${learningImplementedRate}% of complaint learning actions implemented — identified improvements are not being followed through, meaning complaints are not driving genuine change.`,
    );
  } else if (learningImplementedRate < 70 && learningImplementedRate >= 50 && totalLearningIdentified > 0) {
    concerns.push(
      `Learning implementation rate at ${learningImplementedRate}% — some complaint-driven improvements are not being acted upon.`,
    );
  }

  if (advocacyQualityAvg < 3.0 && advocacy_records.length > 0) {
    concerns.push(
      `Advocacy quality averaging only ${advocacyQualityAvg}/5 — the quality of advocacy provision may not be adequately serving children's interests.`,
    );
  }

  if (totalComplaints === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No complaints recorded despite children being on placement — this may indicate children do not feel empowered or safe to raise concerns, rather than an absence of issues.",
    );
  }

  if (participation_entries.length > 0) {
    const voiceHeard = participation_entries.filter((p) => p.voice_heard).length;
    const voiceHeardRate = pct(voiceHeard, totalParticipationOpportunities);
    if (voiceHeardRate < 50) {
      concerns.push(
        `Children's voices heard in only ${voiceHeardRate}% of participation opportunities — attendance alone is insufficient if children do not feel listened to.`,
      );
    }
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: ComplaintAdvocacyRecommendation[] = [];
  let rank = 0;

  if (complaintResolutionRate < 50 && totalComplaints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and resolve all outstanding complaints — children must see that raising concerns leads to action and resolution. Implement a complaint tracker with escalation timelines.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 39 — Complaints",
    });
  }

  if (advocacyAccessRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child has access to an independent advocate — advocacy is a fundamental right and Ofsted expects evidence of accessible, quality advocacy provision for all children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan, SCCIF voice of the child",
    });
  }

  if (feedbackLoopCompletionRate < 50 && totalFeedbackLoops > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Close all open feedback loops — every piece of feedback from a child must receive a documented response. Failure to close loops teaches children that their voice does not matter.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (complaintAcknowledgementRate < 80 && totalComplaints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a prompt acknowledgement process for all complaints — children should receive acknowledgement within 24 hours of raising a concern to demonstrate the home takes their voice seriously.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 39 — Complaints",
    });
  }

  if (participationRate < 30 && totalParticipationOpportunities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review participation opportunities and barriers to engagement — explore why children are not attending house meetings, reviews, and consultations, and adapt approaches to increase involvement.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (childSatisfactionRate < 50 && totalComplaints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review complaint resolution quality with children — understand why satisfaction is low and involve children in designing a more responsive complaints process.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 39 — Complaints",
    });
  }

  if (learningImplementedRate < 50 && totalLearningIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a learning action tracker to ensure complaint-driven improvements are followed through — without implementation, the complaints process fails to drive change.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 39 — Complaints",
    });
  }

  if (complaintTimelinessRate < 70 && totalComplaints > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review complaint handling timescales and identify bottlenecks — implement escalation procedures for complaints approaching their target resolution date.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 39 — Complaints",
    });
  }

  if (advocacyQualityAvg < 3.0 && advocacy_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the quality of advocacy provision — consider changing providers or supplementing with additional advocacy support to better serve children's needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (
    advocacyAccessRate >= 50 &&
    advocacyAccessRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend advocacy access to all children — aim for 100% coverage to ensure every child has an independent voice representing their interests.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (
    complaintResolutionRate >= 50 &&
    complaintResolutionRate < 80 &&
    totalComplaints > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve complaint resolution rate to at least 80% — unresolved complaints erode children's trust in the process and the home's ability to evidence responsive practice.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 39 — Complaints",
    });
  }

  if (
    feedbackLoopCompletionRate >= 50 &&
    feedbackLoopCompletionRate < 80 &&
    totalFeedbackLoops > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase feedback loop closure to at least 80% — consistent closure demonstrates that children's views lead to documented responses and outcomes.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    participationRate >= 30 &&
    participationRate < 70 &&
    totalParticipationOpportunities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop creative approaches to increase participation — consider children's preferences and barriers when planning house meetings, activity planning, and consultations.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    childSatisfactionRate >= 50 &&
    childSatisfactionRate < 70 &&
    totalComplaints > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore ways to improve child satisfaction with complaint outcomes — involve children in reviewing the complaints process and identifying improvements.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 39 — Complaints",
    });
  }

  if (totalComplaints === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Actively promote the complaints process to children — ensure children know how to complain, feel safe doing so, and understand complaints are welcomed as a means of improving the home.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 39 — Complaints",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: ComplaintAdvocacyInsight[] = [];

  // -- Critical insights --

  if (complaintResolutionRate < 50 && totalComplaints > 0) {
    insights.push({
      text: `Only ${complaintResolutionRate}% of complaints resolved. Ofsted will view unresolved complaints as evidence that children's concerns are not taken seriously, which directly undermines Reg 39 compliance and the home's ability to demonstrate responsive care.`,
      severity: "critical",
    });
  }

  if (advocacyAccessRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${advocacyAccessRate}% of children have advocacy access. Without an independent voice, children cannot effectively challenge decisions or raise concerns about their care. This is a fundamental gap in the home's voice of the child framework.`,
      severity: "critical",
    });
  }

  if (feedbackLoopCompletionRate < 50 && totalFeedbackLoops > 0) {
    insights.push({
      text: `Only ${feedbackLoopCompletionRate}% of feedback loops closed. When children share their views but receive no response, it teaches them that their voice does not matter — the opposite of what Ofsted expects under the voice of the child framework.`,
      severity: "critical",
    });
  }

  if (participationRate < 30 && totalParticipationOpportunities > 0) {
    insights.push({
      text: `Participation rate at only ${participationRate}%. Children are not engaged in decisions about their daily lives, which Ofsted views as a failure to promote the voice of the child. Low participation may indicate children feel disempowered or disengaged.`,
      severity: "critical",
    });
  }

  if (totalComplaints === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No complaints recorded despite children being on placement. While this could indicate excellent care, Ofsted may interpret the absence of complaints as evidence that children do not feel safe or empowered to raise concerns — the home should actively promote and facilitate the complaints process.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    complaintResolutionRate >= 50 &&
    complaintResolutionRate < 80 &&
    totalComplaints > 0
  ) {
    insights.push({
      text: `Complaint resolution rate at ${complaintResolutionRate}% — improving but some children's complaints remain unresolved. Each unresolved complaint represents a child whose concern has not been fully addressed.`,
      severity: "warning",
    });
  }

  if (complaintTimelinessRate < 70 && complaintTimelinessRate > 0 && totalComplaints > 0) {
    insights.push({
      text: `Only ${complaintTimelinessRate}% of complaints resolved within target timeframes — delays in resolving complaints may cause children to lose confidence in the process and stop raising concerns.`,
      severity: "warning",
    });
  }

  if (
    advocacyAccessRate >= 50 &&
    advocacyAccessRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Advocacy access at ${advocacyAccessRate}% — while improving, some children still lack an independent voice. Every child should have access to advocacy support, particularly those who may find it harder to express their views.`,
      severity: "warning",
    });
  }

  if (
    childSatisfactionRate >= 50 &&
    childSatisfactionRate < 70 &&
    totalComplaints > 0
  ) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not satisfied with complaint outcomes. This may indicate the resolution process is not sufficiently child-centred or responsive.`,
      severity: "warning",
    });
  }

  if (
    feedbackLoopCompletionRate >= 50 &&
    feedbackLoopCompletionRate < 80 &&
    totalFeedbackLoops > 0
  ) {
    insights.push({
      text: `Feedback loop completion at ${feedbackLoopCompletionRate}% — some feedback from children goes without a documented response. Consistent closure is essential to maintaining children's trust in sharing their views.`,
      severity: "warning",
    });
  }

  if (
    participationRate >= 30 &&
    participationRate < 70 &&
    totalParticipationOpportunities > 0
  ) {
    insights.push({
      text: `Participation rate at ${participationRate}% — while some children engage, many are not participating in house meetings, planning, and reviews. Consider whether the format, timing, or approach needs adapting.`,
      severity: "warning",
    });
  }

  if (learningImplementedRate < 70 && learningImplementedRate >= 50 && totalLearningIdentified > 0) {
    insights.push({
      text: `Learning implementation rate at ${learningImplementedRate}% — identified improvements from complaints are not consistently followed through, reducing the value of the complaints process as a driver of change.`,
      severity: "warning",
    });
  }

  if (
    advocacyQualityAvg >= 3.0 &&
    advocacyQualityAvg < 4.0 &&
    advocacy_records.length > 0
  ) {
    insights.push({
      text: `Advocacy quality averaging ${advocacyQualityAvg}/5 — competent provision but not yet consistently delivering the depth of support needed for children to feel genuinely represented.`,
      severity: "warning",
    });
  }

  // Recurring themes insight from complaint trends
  const allThemes = complaint_trends.flatMap((t) => t.recurring_themes);
  const themeCounts: Record<string, number> = {};
  for (const theme of allThemes) {
    themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
  }
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topThemes.length > 0) {
    insights.push({
      text: `Recurring complaint themes identified: ${topThemes.map(([t, c]) => `"${t}" (${c} period${c !== 1 ? "s" : ""})`).join(", ")}. Persistent themes indicate systemic issues that require targeted action plans rather than individual complaint resolution.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (responsiveness_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding complaint and advocacy responsiveness — children's complaints are resolved promptly, advocacy is accessible and high-quality, and feedback loops are consistently closed. This is strong evidence for Reg 39 compliance and the voice of the child.",
      severity: "positive",
    });
  }

  if (
    complaintResolutionRate >= 100 &&
    complaintAcknowledgementRate >= 100 &&
    totalComplaints > 0
  ) {
    insights.push({
      text: "Every complaint acknowledged and resolved — the home operates an exemplary complaints process where children's concerns are heard, addressed, and closed. This demonstrates genuine commitment to Reg 39.",
      severity: "positive",
    });
  }

  if (
    advocacyAccessRate >= 100 &&
    advocacyQualityAvg >= 4.0 &&
    total_children > 0 &&
    advocacy_records.length > 0
  ) {
    insights.push({
      text: `Every child has advocacy access with quality averaging ${advocacyQualityAvg}/5 — the home ensures all children have high-quality independent support to express their views and influence decisions about their care.`,
      severity: "positive",
    });
  }

  if (
    feedbackLoopCompletionRate >= 100 &&
    totalFeedbackLoops > 0
  ) {
    insights.push({
      text: "All feedback loops closed — every piece of child feedback receives a documented response. This teaches children that their voice matters and that sharing views leads to acknowledged outcomes.",
      severity: "positive",
    });
  }

  if (
    participationRate >= 90 &&
    totalParticipationOpportunities > 0
  ) {
    const influenceRate = pct(outcomeInfluenced, totalParticipationOpportunities);
    if (influenceRate >= 70) {
      insights.push({
        text: `${participationRate}% participation with ${influenceRate}% of outcomes influenced by children's input — participation is genuinely empowering and child-centred, not tokenistic.`,
        severity: "positive",
      });
    } else {
      insights.push({
        text: `${participationRate}% participation rate — children are consistently engaged in decisions about their daily lives, demonstrating the home's commitment to the voice of the child.`,
        severity: "positive",
      });
    }
  }

  if (
    childSatisfactionRate >= 90 &&
    totalComplaints > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction with complaint outcomes — children feel their concerns are taken seriously and resolved to their satisfaction, which builds trust in the complaints process.`,
      severity: "positive",
    });
  }

  if (
    learningImplementedRate >= 90 &&
    totalLearningIdentified > 0
  ) {
    insights.push({
      text: `${learningImplementedRate}% of complaint learning actions implemented — the home uses complaints as a genuine driver of continuous improvement. Ofsted will view this as evidence of a learning culture.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (responsiveness_rating === "outstanding") {
    headline =
      "Outstanding complaint and advocacy responsiveness — children's concerns are resolved promptly, advocacy is accessible, and feedback loops are consistently closed.";
  } else if (responsiveness_rating === "good") {
    headline = `Good complaint and advocacy responsiveness — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (responsiveness_rating === "adequate") {
    headline = `Adequate complaint and advocacy responsiveness — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's voices are heard and complaints are resolved effectively.`;
  } else {
    headline = `Complaint and advocacy responsiveness is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children can raise concerns and access advocacy.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    responsiveness_rating,
    responsiveness_score: score,
    headline,
    total_complaints: totalComplaints,
    complaint_resolution_rate: complaintResolutionRate,
    complaint_timeliness_rate: complaintTimelinessRate,
    advocacy_access_rate: advocacyAccessRate,
    child_satisfaction_rate: childSatisfactionRate,
    feedback_loop_completion_rate: feedbackLoopCompletionRate,
    participation_rate: participationRate,
    complaint_acknowledgement_rate: complaintAcknowledgementRate,
    learning_implemented_rate: learningImplementedRate,
    advocacy_quality_avg: advocacyQualityAvg,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
