// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME YOUNG PERSON DAILY WELLBEING INTELLIGENCE ENGINE
// Home-level: aggregates daily recording patterns, mood tracking, behaviour
// documentation quality, de-escalation practice, follow-up responsiveness,
// and child coverage equity across all young people in the home.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (duty of care), Reg 36 (records),
// Reg 5 (quality of care).
// SCCIF: "Experiences and progress of children", "Helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DailySummaryInput {
  id: string;
  child_id: string;
  date: string;
  event_count: number;
  significant_count: number;
  avg_mood_score: number;           // 0-10
  category_count: number;           // number of distinct categories
  requires_followup: boolean;
}

export interface DailyLogEntryInput {
  id: string;
  child_id: string;
  date: string;
  has_content: boolean;
  mood_score: number;               // 1-10
  is_significant: boolean;
}

export interface BehaviourLogEntryInput {
  id: string;
  child_id: string;
  date: string;
  severity: string;                 // "low" | "medium" | "high" | "critical"
  de_escalation_used: boolean;
  has_antecedent: boolean;          // antecedent non-empty
  has_consequence: boolean;         // consequence non-empty
  has_outcome: boolean;             // outcome non-empty
}

export interface YoungPersonDailyWellbeingInput {
  today: string;
  total_children: number;
  summaries: DailySummaryInput[];
  daily_logs: DailyLogEntryInput[];
  behaviour_logs: BehaviourLogEntryInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type YPDailyWellbeingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface WellbeingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface WellbeingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface YoungPersonDailyWellbeingResult {
  wellbeing_rating: YPDailyWellbeingRating;
  wellbeing_score: number;
  headline: string;
  total_daily_logs: number;
  logs_last_30_days: number;
  total_behaviour_logs: number;
  behaviour_logs_last_30_days: number;
  total_summaries: number;
  average_mood_score: number;
  daily_coverage_rate: number;
  mood_tracking_rate: number;
  behaviour_documentation_rate: number;
  de_escalation_rate: number;
  child_coverage_rate: number;
  high_severity_count: number;
  strengths: string[];
  concerns: string[];
  recommendations: WellbeingRecommendation[];
  insights: WellbeingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeYoungPersonDailyWellbeing(
  input: YoungPersonDailyWellbeingInput,
): YoungPersonDailyWellbeingResult {
  const { today, total_children, summaries, daily_logs, behaviour_logs } = input;

  // ── Special case: no children ───────────────────────────────────────
  if (total_children === 0) {
    return {
      wellbeing_rating: "insufficient_data",
      wellbeing_score: 0,
      headline: "No children registered — daily wellbeing cannot be assessed.",
      total_daily_logs: daily_logs.length,
      logs_last_30_days: 0,
      total_behaviour_logs: behaviour_logs.length,
      behaviour_logs_last_30_days: 0,
      total_summaries: summaries.length,
      average_mood_score: 0,
      daily_coverage_rate: 0,
      mood_tracking_rate: 0,
      behaviour_documentation_rate: 0,
      de_escalation_rate: 0,
      child_coverage_rate: 0,
      high_severity_count: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Filter to last 30 days ──────────────────────────────────────────
  const logs30d = daily_logs.filter(l => {
    const d = daysBetween(l.date, today);
    return d >= 0 && d <= 30;
  });

  const beh30d = behaviour_logs.filter(b => {
    const d = daysBetween(b.date, today);
    return d >= 0 && d <= 30;
  });

  const sum30d = summaries.filter(s => {
    const d = daysBetween(s.date, today);
    return d >= 0 && d <= 30;
  });

  // ── Special case: 0 data with children ─────────────────────────────
  if (logs30d.length === 0 && beh30d.length === 0 && sum30d.length === 0) {
    return {
      wellbeing_rating: "inadequate",
      wellbeing_score: 20,
      headline: "No daily wellbeing recording in the last 30 days — immediate action required.",
      total_daily_logs: daily_logs.length,
      logs_last_30_days: 0,
      total_behaviour_logs: behaviour_logs.length,
      behaviour_logs_last_30_days: 0,
      total_summaries: summaries.length,
      average_mood_score: 0,
      daily_coverage_rate: 0,
      mood_tracking_rate: 0,
      behaviour_documentation_rate: 0,
      de_escalation_rate: 0,
      child_coverage_rate: 0,
      high_severity_count: 0,
      strengths: [],
      concerns: ["No daily recording of any kind in the last 30 days. Children's daily experiences, mood, and wellbeing are not being captured. This is a significant safeguarding and regulatory concern."],
      recommendations: [{
        rank: 1,
        recommendation: "Implement daily recording immediately — every child must have daily logs capturing mood, activities, and significant events.",
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 36",
      }],
      insights: [{
        text: "Complete absence of daily wellbeing recording. Ofsted would view this as a fundamental failure of care practice. Without daily records, safeguarding concerns may go undetected and children's experiences are invisible.",
        severity: "critical",
      }],
    };
  }

  // ── Computed metrics ────────────────────────────────────────────────

  // Daily log coverage: unique days with logs / 30
  const uniqueLogDays = new Set(logs30d.map(l => l.date)).size;
  const dailyCoverageRate = pct(uniqueLogDays, 30);

  // Mood tracking quality: logs with mood_score > 0
  const logsWithMood = logs30d.filter(l => l.mood_score > 0);
  const moodTrackingRate = pct(logsWithMood.length, logs30d.length);

  // Average mood score across all daily logs with mood
  const averageMoodScore = logsWithMood.length > 0
    ? Math.round((logsWithMood.reduce((sum, l) => sum + l.mood_score, 0) / logsWithMood.length) * 10) / 10
    : 0;

  // Behaviour documentation: has_antecedent AND has_consequence AND has_outcome
  const fullyDocBeh = beh30d.filter(b => b.has_antecedent && b.has_consequence && b.has_outcome);
  const behaviourDocRate = pct(fullyDocBeh.length, beh30d.length);

  // De-escalation practice: de_escalation_used rate in medium/high/critical
  const qualifyingBeh = beh30d.filter(b =>
    b.severity === "medium" || b.severity === "high" || b.severity === "critical",
  );
  const deEscUsed = qualifyingBeh.filter(b => b.de_escalation_used);
  const deEscalationRate = pct(deEscUsed.length, qualifyingBeh.length);

  // Child coverage equity: children with daily log entries
  const childrenWithLogs = new Set(logs30d.map(l => l.child_id)).size;
  const childCoverageRate = pct(childrenWithLogs, total_children);

  // High severity count
  const highSeverityCount = beh30d.filter(b =>
    b.severity === "high" || b.severity === "critical",
  ).length;

  // ── Scoring: base 52 + 6 modifiers ─────────────────────────────────
  let score = 52;

  // Modifier 1: Daily log coverage (unique days with logs / 30)
  if (logs30d.length === 0) {
    score -= 3;
  } else if (dailyCoverageRate >= 90) {
    score += 6;
  } else if (dailyCoverageRate >= 70) {
    score += 3;
  } else if (dailyCoverageRate >= 50) {
    // no change
  } else if (dailyCoverageRate >= 30) {
    score -= 5;
    score -= 3; // extra penalty for <50%
  } else {
    score -= 5;
    score -= 3; // <50% penalty
    // Note: <30% already captured since <50% triggers -5 and <30% triggers -3 extra
  }

  // Modifier 2: Mood tracking quality
  if (logs30d.length === 0) {
    score -= 1;
  } else if (moodTrackingRate >= 90) {
    score += 5;
  } else if (moodTrackingRate >= 70) {
    score += 2;
  } else if (moodTrackingRate >= 50) {
    // no change
  } else {
    score -= 5;
  }

  // Modifier 3: Behaviour documentation
  if (beh30d.length === 0) {
    score -= 1;
  } else if (behaviourDocRate >= 90) {
    score += 5;
  } else if (behaviourDocRate >= 70) {
    score += 2;
  } else if (behaviourDocRate >= 50) {
    // no change
  } else {
    score -= 4;
  }

  // Modifier 4: De-escalation practice
  if (qualifyingBeh.length === 0) {
    score += 1;
  } else if (deEscalationRate >= 90) {
    score += 5;
  } else if (deEscalationRate >= 70) {
    score += 2;
  } else if (deEscalationRate >= 50) {
    // no change
  } else {
    score -= 4;
  }

  // Modifier 5: Follow-up responsiveness
  const followupSummaries = sum30d.filter(s => s.requires_followup);
  if (sum30d.length === 0) {
    score -= 1;
  } else if (followupSummaries.length === 0) {
    score += 1; // no followups needed is fine
  } else {
    // Check if followup summaries have subsequent logs (log dated after summary date for same child)
    const followedUp = followupSummaries.filter(s => {
      return logs30d.some(l =>
        l.child_id === s.child_id &&
        daysBetween(s.date, l.date) > 0,
      );
    });
    const followupRate = pct(followedUp.length, followupSummaries.length);
    if (followupRate >= 80) {
      score += 4;
    } else if (followupRate >= 50) {
      score += 2;
    } else {
      score -= 4;
    }
  }

  // Modifier 6: Child coverage equity
  if (logs30d.length === 0) {
    score -= 2;
  } else if (childCoverageRate >= 100) {
    score += 5;
  } else if (childCoverageRate >= 80) {
    score += 2;
  } else if (childCoverageRate >= 60) {
    // no change
  } else {
    score -= 3;
  }

  // Clamp
  score = clamp(score, 0, 100);

  // ── Rating ──────────────────────────────────────────────────────────
  let wellbeing_rating: YPDailyWellbeingRating;
  if (score >= 80) wellbeing_rating = "outstanding";
  else if (score >= 65) wellbeing_rating = "good";
  else if (score >= 45) wellbeing_rating = "adequate";
  else wellbeing_rating = "inadequate";

  // ── Strengths ───────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (dailyCoverageRate >= 90) {
    strengths.push(`Daily logs recorded on ${uniqueLogDays} of the last 30 days (${dailyCoverageRate}%) — consistent daily recording demonstrates embedded practice.`);
  }
  if (moodTrackingRate >= 90 && logs30d.length > 0) {
    strengths.push(`Mood tracked in ${moodTrackingRate}% of daily log entries — strong emotional monitoring supports early identification of wellbeing concerns.`);
  }
  if (behaviourDocRate >= 90 && beh30d.length > 0) {
    strengths.push(`${behaviourDocRate}% of behaviour incidents fully documented with antecedent, consequence, and outcome — thorough recording supports pattern analysis.`);
  }
  if (deEscalationRate >= 90 && qualifyingBeh.length > 0) {
    strengths.push(`De-escalation used in ${deEscalationRate}% of medium/high/critical incidents — staff are prioritising therapeutic responses over restrictive practice.`);
  }
  if (childCoverageRate >= 100 && logs30d.length > 0) {
    strengths.push("Every child has daily log entries — no child is invisible in the recording system.");
  }
  if (averageMoodScore >= 7 && logsWithMood.length >= 5) {
    strengths.push(`Average mood score of ${averageMoodScore}/10 across the home — children are reporting positive wellbeing.`);
  }
  if (followupSummaries.length > 0) {
    const followedUp = followupSummaries.filter(s =>
      logs30d.some(l => l.child_id === s.child_id && daysBetween(s.date, l.date) > 0),
    );
    if (pct(followedUp.length, followupSummaries.length) >= 80) {
      strengths.push("Strong follow-up responsiveness — flagged concerns are being actioned promptly through subsequent daily logs.");
    }
  }

  // ── Concerns ────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (dailyCoverageRate < 50 && logs30d.length > 0) {
    concerns.push(`Daily logs recorded on only ${uniqueLogDays} of the last 30 days (${dailyCoverageRate}%) — significant recording gaps could hide safeguarding concerns.`);
  }
  if (moodTrackingRate < 50 && logs30d.length > 0) {
    concerns.push(`Mood tracked in only ${moodTrackingRate}% of daily log entries — emotional wellbeing is not being consistently monitored.`);
  }
  if (behaviourDocRate < 50 && beh30d.length > 0) {
    concerns.push(`Only ${behaviourDocRate}% of behaviour incidents fully documented — incomplete recording undermines pattern analysis and regulatory compliance.`);
  }
  if (deEscalationRate < 50 && qualifyingBeh.length > 0) {
    concerns.push(`De-escalation used in only ${deEscalationRate}% of medium/high/critical incidents — staff may be over-relying on restrictive practices.`);
  }
  if (childCoverageRate < 60 && logs30d.length > 0) {
    concerns.push(`Only ${childCoverageRate}% of children have daily log entries — ${total_children - childrenWithLogs} child${(total_children - childrenWithLogs) > 1 ? "ren" : ""} missing from daily recording.`);
  }
  if (highSeverityCount >= 5) {
    concerns.push(`${highSeverityCount} high/critical severity behaviour incidents in 30 days — escalating behaviour patterns require review of care plans and risk assessments.`);
  }
  if (averageMoodScore > 0 && averageMoodScore < 4 && logsWithMood.length >= 3) {
    concerns.push(`Average mood score of ${averageMoodScore}/10 — persistently low mood across the home suggests unmet emotional needs.`);
  }
  if (followupSummaries.length > 0) {
    const followedUp = followupSummaries.filter(s =>
      logs30d.some(l => l.child_id === s.child_id && daysBetween(s.date, l.date) > 0),
    );
    if (pct(followedUp.length, followupSummaries.length) < 50) {
      concerns.push("Poor follow-up on flagged concerns — summaries requiring action are not being followed through in subsequent daily logs.");
    }
  }

  // ── Recommendations ─────────────────────────────────────────────────
  const recommendations: WellbeingRecommendation[] = [];
  let rank = 0;

  if (dailyCoverageRate < 50 && logs30d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Embed daily recording into shift routines — every shift must produce at least one entry per child to maintain regulatory compliance.",
      urgency: dailyCoverageRate < 30 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }
  if (logs30d.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Implement daily recording immediately — children's daily experiences must be captured to comply with record-keeping requirements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }
  if (moodTrackingRate < 50 && logs30d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Include mood scores in all daily log entries to build emotional wellbeing baselines and identify emerging patterns.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (behaviourDocRate < 50 && beh30d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure all behaviour incidents are documented with antecedent, consequence, and outcome to support effective behaviour analysis.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }
  if (deEscalationRate < 50 && qualifyingBeh.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Provide de-escalation training refresher for all staff — therapeutic responses should be the first approach for medium/high severity incidents.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (childCoverageRate < 80 && logs30d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure all children have daily log entries — use handover checklists to verify every child's day has been recorded.",
      urgency: childCoverageRate < 60 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 5",
    });
  }
  if (highSeverityCount >= 5) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review care plans and risk assessments for children involved in high severity incidents — consider multi-agency strategy discussion.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (followupSummaries.length > 0) {
    const followedUp = followupSummaries.filter(s =>
      logs30d.some(l => l.child_id === s.child_id && daysBetween(s.date, l.date) > 0),
    );
    if (pct(followedUp.length, followupSummaries.length) < 50) {
      recommendations.push({
        rank: ++rank,
        recommendation: "Establish a follow-up tracking system — flagged concerns from daily summaries must be actioned and recorded within 24 hours.",
        urgency: "soon",
        regulatory_ref: "CHR 2015 Reg 12",
      });
    }
  }

  // ── Insights ────────────────────────────────────────────────────────
  const insights: WellbeingInsight[] = [];

  if (wellbeing_rating === "outstanding") {
    insights.push({
      text: `Outstanding daily wellbeing recording practice (score: ${score}%). Consistent daily logs, strong mood tracking, thorough behaviour documentation, and equitable child coverage. Ofsted will recognise this as exemplary care recording.`,
      severity: "positive",
    });
  }
  if (dailyCoverageRate >= 90 && moodTrackingRate >= 90 && childCoverageRate >= 100) {
    insights.push({
      text: "Comprehensive daily recording with mood tracking across all children — this creates a rich longitudinal picture of every child's daily experience and emotional wellbeing.",
      severity: "positive",
    });
  }
  if (deEscalationRate >= 90 && qualifyingBeh.length >= 3) {
    insights.push({
      text: `De-escalation used in ${deEscalationRate}% of ${qualifyingBeh.length} qualifying incidents. Staff are consistently applying therapeutic approaches — this reduces the need for restrictive intervention and supports children's emotional regulation.`,
      severity: "positive",
    });
  }

  if (dailyCoverageRate < 30 && logs30d.length > 0) {
    insights.push({
      text: `Daily recording coverage is critically low at ${dailyCoverageRate}%. Ofsted inspectors will view sparse recording as a leadership and management failure — children's daily experiences must be visible in the record.`,
      severity: "critical",
    });
  }
  if (highSeverityCount >= 5) {
    insights.push({
      text: `${highSeverityCount} high/critical severity incidents in 30 days represents an escalating pattern. This should trigger a multi-agency review and consideration of whether current placements and care approaches are meeting children's needs.`,
      severity: "critical",
    });
  }
  if (childCoverageRate < 60 && logs30d.length > 0) {
    insights.push({
      text: `${total_children - childrenWithLogs} of ${total_children} children have no daily log entries. These children are invisible in the recording system — their wellbeing cannot be tracked, and safeguarding concerns may go undetected.`,
      severity: "critical",
    });
  }
  if (moodTrackingRate < 50 && logs30d.length > 0 && averageMoodScore > 0 && averageMoodScore < 4) {
    insights.push({
      text: `Low mood tracking rate (${moodTrackingRate}%) combined with low average mood (${averageMoodScore}/10) suggests both poor monitoring and concerning emotional wellbeing. Immediate therapeutic intervention and enhanced monitoring are needed.`,
      severity: "critical",
    });
  }
  if (behaviourDocRate < 50 && beh30d.length >= 5) {
    insights.push({
      text: `Behaviour documentation is incomplete in ${100 - behaviourDocRate}% of incidents. Without full antecedent-behaviour-consequence recording, the home cannot identify triggers or evaluate intervention effectiveness.`,
      severity: "warning",
    });
  }
  if (deEscalationRate < 50 && qualifyingBeh.length >= 3) {
    insights.push({
      text: `De-escalation techniques used in only ${deEscalationRate}% of medium/high/critical incidents. Ofsted expects to see evidence that staff prioritise therapeutic de-escalation before any restrictive practice.`,
      severity: "warning",
    });
  }

  // ── Headline ────────────────────────────────────────────────────────
  let headline: string;
  if (wellbeing_rating === "outstanding") {
    headline = `Outstanding daily wellbeing practice — ${logs30d.length} logs across ${uniqueLogDays} days covering ${childrenWithLogs} children with ${moodTrackingRate}% mood tracking.`;
  } else if (wellbeing_rating === "good") {
    headline = `Good daily wellbeing recording — ${logs30d.length} logs in 30 days.${concerns.length > 0 ? ` ${concerns.length} area${concerns.length > 1 ? "s" : ""} for improvement.` : ""}`;
  } else if (wellbeing_rating === "adequate") {
    headline = `Daily wellbeing recording requires improvement — ${logs30d.length} logs with ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Daily wellbeing recording is inadequate — significant gaps in recording practice require immediate attention.`;
  }

  return {
    wellbeing_rating,
    wellbeing_score: score,
    headline,
    total_daily_logs: daily_logs.length,
    logs_last_30_days: logs30d.length,
    total_behaviour_logs: behaviour_logs.length,
    behaviour_logs_last_30_days: beh30d.length,
    total_summaries: summaries.length,
    average_mood_score: averageMoodScore,
    daily_coverage_rate: dailyCoverageRate,
    mood_tracking_rate: moodTrackingRate,
    behaviour_documentation_rate: behaviourDocRate,
    de_escalation_rate: deEscalationRate,
    child_coverage_rate: childCoverageRate,
    high_severity_count: highSeverityCount,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
