// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF DEBRIEF & EMOTIONAL SUPPORT INTELLIGENCE ENGINE
// Pure deterministic engine: debrief completion, follow-up, learning capture,
// support provision, and staff wellbeing checks after critical events.
// CHR 2015 Reg 33: "The registered person must ensure that staff are supported."
// NICE Staff Wellbeing: emotional support and reflective debrief after incidents.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DebriefRecordInput {
  id: string;
  type: string; // "post_incident"|"post_restraint"|"post_missing"|"critical_event"|"emotional_support"|"tci_reflection"
  status: string; // "completed"|"scheduled"|"overdue"|"declined"
  emotional_impact: string; // "low"|"moderate"|"high"|"significant"
  follow_up_needed: boolean;
  follow_up_completed: boolean;
  learning_points_count: number;
  support_offered_count: number;
  staff_involved_count: number;
}

export interface StaffWellbeingCheckInput {
  id: string;
  staff_id: string;
  check_completed: boolean;
  concerns_raised: boolean;
  support_provided: boolean;
}

export interface StaffDebriefInput {
  today: string;
  total_staff: number;
  debriefs: DebriefRecordInput[];
  wellbeing_checks: StaffWellbeingCheckInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffDebriefRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StaffDebriefResult {
  debrief_rating: StaffDebriefRating;
  debrief_score: number;
  headline: string;
  total_debriefs: number;
  completion_rate: number;
  follow_up_completion_rate: number;
  high_impact_count: number;
  overdue_debriefs: number;
  wellbeing_check_rate: number;
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

function ratingFromScore(score: number): StaffDebriefRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeStaffDebriefEmotionalSupport(
  input: StaffDebriefInput,
): StaffDebriefResult {
  const { total_staff, debriefs, wellbeing_checks } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_staff === 0) {
    return {
      debrief_rating: "insufficient_data",
      debrief_score: 0,
      headline: "No active staff registered — unable to assess debrief and emotional support.",
      total_debriefs: 0,
      completion_rate: 0,
      follow_up_completion_rate: 0,
      high_impact_count: 0,
      overdue_debriefs: 0,
      wellbeing_check_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ───────────────────────────────────────────────────────────
  const totalDebriefs = debriefs.length;
  const completedDebriefs = debriefs.filter((d) => d.status === "completed").length;
  const completionRate = pct(completedDebriefs, totalDebriefs);

  const needingFollowUp = debriefs.filter((d) => d.follow_up_needed);
  const followUpCompleted = needingFollowUp.filter((d) => d.follow_up_completed).length;
  const followUpCompletionRate = pct(followUpCompleted, needingFollowUp.length);

  const highImpactCount = debriefs.filter(
    (d) => d.emotional_impact === "high" || d.emotional_impact === "significant",
  ).length;

  const overdueDebriefs = debriefs.filter((d) => d.status === "overdue").length;

  const checksCompleted = wellbeing_checks.filter((c) => c.check_completed).length;
  const wellbeingCheckRate = pct(checksCompleted, wellbeing_checks.length);

  const debriefsWithLearning = debriefs.filter((d) => d.learning_points_count > 0).length;
  const learningCaptureRate = pct(debriefsWithLearning, totalDebriefs);

  const debriefsWithSupport = debriefs.filter((d) => d.support_offered_count > 0).length;
  const supportProvisionRate = pct(debriefsWithSupport, totalDebriefs);

  const overdueRate = pct(overdueDebriefs, totalDebriefs);

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Debrief completion rate (±5)
  if (totalDebriefs === 0) {
    score += 2;
  } else if (completionRate >= 90) {
    score += 5;
  } else if (completionRate >= 70) {
    score += 2;
  } else if (completionRate >= 40) {
    score += 0;
  } else {
    score += -5;
  }

  // mod2: Follow-up completion (+6/-5)
  if (needingFollowUp.length === 0) {
    score += 3;
  } else if (followUpCompletionRate >= 90) {
    score += 6;
  } else if (followUpCompletionRate >= 70) {
    score += 3;
  } else if (followUpCompletionRate >= 40) {
    score += 0;
  } else {
    score += -5;
  }

  // mod3: Overdue control (+5/-4)
  if (totalDebriefs === 0) {
    score += 2;
  } else if (overdueRate === 0) {
    score += 5;
  } else if (overdueRate < 10) {
    score += 2;
  } else if (overdueRate < 25) {
    score += 0;
  } else {
    score += -4;
  }

  // mod4: Learning capture (+5/-5)
  if (totalDebriefs === 0) {
    score += 0;
  } else if (learningCaptureRate >= 90) {
    score += 5;
  } else if (learningCaptureRate >= 70) {
    score += 2;
  } else if (learningCaptureRate >= 40) {
    score += 0;
  } else {
    score += -5;
  }

  // mod5: Support provision (+4/-4)
  if (totalDebriefs === 0) {
    score += 0;
  } else if (supportProvisionRate >= 90) {
    score += 4;
  } else if (supportProvisionRate >= 70) {
    score += 1;
  } else if (supportProvisionRate >= 40) {
    score += 0;
  } else {
    score += -4;
  }

  // mod6: Wellbeing check coverage (+5/-5)
  if (wellbeing_checks.length === 0) {
    score += -1;
  } else if (wellbeingCheckRate >= 90) {
    score += 5;
  } else if (wellbeingCheckRate >= 70) {
    score += 2;
  } else if (wellbeingCheckRate >= 40) {
    score += 0;
  } else {
    score += -5;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const debrief_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (totalDebriefs > 0 && completionRate >= 90) {
    strengths.push(`${completionRate}% of debriefs completed — staff receive timely post-event support.`);
  }
  if (needingFollowUp.length > 0 && followUpCompletionRate >= 90) {
    strengths.push("Follow-up actions are being completed consistently after debriefs.");
  }
  if (totalDebriefs > 0 && overdueDebriefs === 0) {
    strengths.push("No overdue debriefs — events are processed promptly.");
  }
  if (totalDebriefs > 0 && learningCaptureRate >= 90) {
    strengths.push("Learning points captured in the vast majority of debriefs — strong reflective practice.");
  }
  if (totalDebriefs > 0 && supportProvisionRate >= 90) {
    strengths.push("Emotional support offered in almost all debriefs — staff feel cared for.");
  }
  if (wellbeing_checks.length > 0 && wellbeingCheckRate >= 90) {
    strengths.push(`${wellbeingCheckRate}% of wellbeing checks completed — comprehensive staff monitoring.`);
  }
  if (totalDebriefs > 0 && highImpactCount === 0) {
    strengths.push("No high or significant emotional impact debriefs recorded this period.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (totalDebriefs > 0 && completionRate < 70) {
    concerns.push(`Only ${completionRate}% of debriefs completed — staff may not be receiving adequate post-event support.`);
  }
  if (overdueDebriefs > 0) {
    concerns.push(`${overdueDebriefs} debrief(s) are overdue — timely emotional support is not being provided.`);
  }
  if (needingFollowUp.length > 0 && followUpCompletionRate < 70) {
    concerns.push(`Follow-up completion rate is ${followUpCompletionRate}% — commitments made during debriefs are not being honoured.`);
  }
  if (highImpactCount > 0) {
    concerns.push(`${highImpactCount} debrief(s) involved high or significant emotional impact — enhanced support may be needed.`);
  }
  if (totalDebriefs > 0 && learningCaptureRate < 40) {
    concerns.push("Learning points are not being captured in most debriefs — missed opportunity for organisational improvement.");
  }
  if (totalDebriefs > 0 && supportProvisionRate < 40) {
    concerns.push("Emotional support is not being offered in the majority of debriefs.");
  }
  if (wellbeing_checks.length > 0 && wellbeingCheckRate < 40) {
    concerns.push(`Only ${wellbeingCheckRate}% of wellbeing checks completed — staff wellbeing monitoring has significant gaps.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: StaffDebriefResult["recommendations"] = [];
  let rank = 0;

  if (overdueDebriefs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete ${overdueDebriefs} overdue debrief(s) immediately to ensure staff receive timely emotional support.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (needingFollowUp.length > 0 && followUpCompletionRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Prioritise outstanding follow-up actions from previous debriefs to demonstrate duty of care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (highImpactCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review enhanced support provision for ${highImpactCount} high-impact debrief(s) — consider external supervision or counselling referral.`,
      urgency: "soon",
      regulatory_ref: "NICE Staff Wellbeing",
    });
  }
  if (totalDebriefs > 0 && learningCaptureRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Embed learning capture into all debrief processes to strengthen organisational learning.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (wellbeing_checks.length > 0 && wellbeingCheckRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Improve wellbeing check completion rates to ensure all staff are monitored after critical events.",
      urgency: "soon",
      regulatory_ref: "NICE Staff Wellbeing",
    });
  }

  // Cap at 5
  recommendations.splice(5);

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: StaffDebriefResult["insights"] = [];

  if (overdueDebriefs >= 3) {
    insights.push({
      text: `${overdueDebriefs} debriefs are overdue — systemic failure to provide timely post-event support.`,
      severity: "critical",
    });
  } else if (overdueDebriefs > 0) {
    insights.push({
      text: `${overdueDebriefs} debrief(s) overdue — attention needed to prevent backlog.`,
      severity: "warning",
    });
  }

  if (highImpactCount >= 3) {
    insights.push({
      text: `${highImpactCount} debriefs with high or significant emotional impact — workforce under sustained emotional pressure.`,
      severity: "critical",
    });
  } else if (highImpactCount > 0) {
    insights.push({
      text: `${highImpactCount} debrief(s) involved high or significant emotional impact — monitor staff closely.`,
      severity: "warning",
    });
  }

  if (totalDebriefs > 0 && completionRate === 100) {
    insights.push({
      text: "All debriefs completed — demonstrates a strong culture of reflective practice and staff support.",
      severity: "positive",
    });
  }

  // Cap at 3
  insights.splice(3);

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    debrief_rating === "outstanding"
      ? "Exemplary debrief and emotional support culture — staff are well-supported after critical events."
      : debrief_rating === "good"
      ? "Good debrief practices with consistent emotional support — minor improvements possible."
      : debrief_rating === "adequate"
      ? "Debrief and emotional support arrangements are adequate but gaps in completion or follow-through require attention."
      : debrief_rating === "insufficient_data"
      ? "No active staff registered — unable to assess debrief and emotional support."
      : "Significant deficiencies in debrief completion and emotional support — staff welfare at risk.";

  return {
    debrief_rating,
    debrief_score: score,
    headline,
    total_debriefs: totalDebriefs,
    completion_rate: completionRate,
    follow_up_completion_rate: followUpCompletionRate,
    high_impact_count: highImpactCount,
    overdue_debriefs: overdueDebriefs,
    wellbeing_check_rate: wellbeingCheckRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
