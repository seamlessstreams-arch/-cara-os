// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MISSING EPISODE INTELLIGENCE ENGINE
// Home-level: analyses missing from care episodes across all children to produce
// frequency, compliance, timeliness, notification, pattern analysis, and
// duration/resolution intelligence.
// CHR 2015 Reg 12 (Protection), Reg 34 (Safeguarding).
// SCCIF: "Helped and protected", "Leadership and management."
// DfE Statutory Guidance on Children Who Run Away or Go Missing from Home or
// Care (2014).
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MissingEpisodeRecordInput {
  id: string;
  child_id: string;
  date_missing: string;                      // ISO date YYYY-MM-DD
  date_returned: string;                     // ISO date or empty string
  duration_hours: number;
  risk_level: string;                        // "low" | "medium" | "high"
  reported_to_police: boolean;
  reported_to_la: boolean;
  return_interview_completed: boolean;
  return_interview_within_72hrs: boolean;    // pre-computed: return_interview_date - date_returned <= 3 days
  has_contextual_safeguarding_risk: boolean;
  has_pattern_notes: boolean;
  status: string;                            // "closed" | "open"
  still_missing: boolean;                    // date_returned is null/empty
}

export interface MissingEpisodeInput {
  today: string;
  total_children: number;
  episodes: MissingEpisodeRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MissingEpisodeRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MissingEpisodeInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface MissingEpisodeRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface MissingEpisodeResult {
  missing_rating: MissingEpisodeRating;
  missing_score: number | null;
  headline: string;
  total_episodes: number;
  unique_children_missing: number;
  episodes_last_90_days: number;
  high_risk_count: number;
  still_missing_count: number;
  return_interview_rate: number | null;
  return_interview_timeliness_rate: number | null;
  la_notification_rate: number | null;
  police_report_rate_high_risk: number;
  contextual_safeguarding_flag_rate: number | null;
  pattern_analysis_rate: number | null;
  average_duration_hours: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: MissingEpisodeRecommendation[];
  insights: MissingEpisodeInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const pct = (n: number, d: number): number =>
  d === 0 ? 0 : Math.round((n / d) * 100);

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MissingEpisodeRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeMissingEpisode(
  input: MissingEpisodeInput,
): MissingEpisodeResult {
  const { today, total_children, episodes } = input;

  // ── Guard: no children ────────────────────────────────────────────────
  if (total_children === 0) {
    return {
      missing_rating: "insufficient_data",
      missing_score: 0,
      headline: "No children placed — missing episode analysis is not applicable.",
      total_episodes: 0,
      unique_children_missing: 0,
      episodes_last_90_days: 0,
      high_risk_count: 0,
      still_missing_count: 0,
      return_interview_rate: null,
      return_interview_timeliness_rate: null,
      la_notification_rate: null,
      police_report_rate_high_risk: 0,
      contextual_safeguarding_flag_rate: null,
      pattern_analysis_rate: null,
      average_duration_hours: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [
        {
          text: "No children are currently placed. Missing episode analysis requires at least one child in placement.",
          severity: "warning",
        },
      ],
    };
  }

  // ── Special case: children exist but zero episodes = POSITIVE ─────────
  if (episodes.length === 0) {
    return {
      missing_rating: "outstanding",
      missing_score: 82,
      headline:
        "No missing from care episodes recorded — children are safe, settled, and accounted for.",
      total_episodes: 0,
      unique_children_missing: 0,
      episodes_last_90_days: 0,
      high_risk_count: 0,
      still_missing_count: 0,
      return_interview_rate: 100,
      return_interview_timeliness_rate: 100,
      la_notification_rate: 100,
      police_report_rate_high_risk: 100,
      contextual_safeguarding_flag_rate: 100,
      pattern_analysis_rate: 100,
      average_duration_hours: 0,
      strengths: [
        "No missing from care episodes — children are safe, settled, and accounted for.",
        "Zero missing episodes is the strongest possible indicator of placement stability and child safety.",
      ],
      concerns: [],
      recommendations: [],
      insights: [
        {
          text: "Zero missing episodes across all children. Ofsted will view this as an outstanding indicator of placement stability, effective relationships, and proactive safeguarding.",
          severity: "positive",
        },
      ],
    };
  }

  // ── Derive metrics ────────────────────────────────────────────────────

  const totalEpisodes = episodes.length;
  const uniqueChildSet: Record<string, boolean> = {};
  for (const e of episodes) uniqueChildSet[e.child_id] = true;
  const uniqueChildren = Object.keys(uniqueChildSet).length;

  const episodesLast90 = episodes.filter((e) => {
    const d = daysBetween(e.date_missing, today);
    return d >= 0 && d <= 90;
  }).length;

  const highRiskCount = episodes.filter(
    (e) => e.risk_level === "high",
  ).length;

  const stillMissingCount = episodes.filter((e) => e.still_missing).length;

  // Return interview rate: exclude still_missing children (no return yet)
  const returnedEpisodes = episodes.filter((e) => !e.still_missing);
  const returnInterviewCompleted = returnedEpisodes.filter(
    (e) => e.return_interview_completed,
  ).length;
  const returnInterviewRate = pct(
    returnInterviewCompleted,
    returnedEpisodes.length,
  );

  // Return interview timeliness: among those with completed interviews
  const completedInterviews = returnedEpisodes.filter(
    (e) => e.return_interview_completed,
  );
  const timelyInterviews = completedInterviews.filter(
    (e) => e.return_interview_within_72hrs,
  ).length;
  const timelinessRate = pct(timelyInterviews, completedInterviews.length);

  // LA notification rate
  const laNotified = episodes.filter((e) => e.reported_to_la).length;
  const laRate = pct(laNotified, totalEpisodes);

  // Police report rate for high-risk episodes
  const highRiskEpisodes = episodes.filter(
    (e) => e.risk_level === "high",
  );
  const policeReportedHigh = highRiskEpisodes.filter(
    (e) => e.reported_to_police,
  ).length;
  const policeHighRate = pct(policeReportedHigh, highRiskEpisodes.length);

  // Contextual safeguarding flag rate among high-risk episodes
  const csFlags = highRiskEpisodes.filter(
    (e) => e.has_contextual_safeguarding_risk,
  ).length;
  const csRate = pct(csFlags, highRiskEpisodes.length);

  // Pattern analysis rate
  const withPatternNotes = episodes.filter(
    (e) => e.has_pattern_notes,
  ).length;
  const patternRate = pct(withPatternNotes, totalEpisodes);

  // Average duration
  const totalDuration = episodes.reduce(
    (sum, e) => sum + e.duration_hours,
    0,
  );
  const avgDuration =
    totalEpisodes > 0
      ? Math.round((totalDuration / totalEpisodes) * 10) / 10
      : null;

  // ── Per-child episode counts (for pattern detection) ──────────────────
  const childCounts: Record<string, number> = {};
  for (const e of episodes) {
    childCounts[e.child_id] = (childCounts[e.child_id] || 0) + 1;
  }
  const childrenWith3Plus = Object.values(childCounts).filter(
    (c) => c >= 3,
  ).length;

  // ── Scoring: base 52, 6 modifiers ────────────────────────────────────
  let score = 52;

  // Modifier 1: Episode frequency
  const episodesPerChild =
    total_children > 0 ? episodesLast90 / total_children : 0;
  if (episodesLast90 === 0) {
    score += 6;
  } else if (total_children === 0) {
    score -= 3;
  } else if (episodesPerChild <= 1) {
    score += 3;
  } else if (episodesPerChild > 2) {
    score -= 5;
  }

  // Modifier 2: Return interview compliance
  if (returnedEpisodes.length === 0) {
    score -= 1;
  } else if (returnInterviewRate >= 95) {
    score += 5;
  } else if (returnInterviewRate >= 80) {
    score += 2;
  } else if (returnInterviewRate < 50) {
    score -= 5;
  }

  // Modifier 3: Return interview timeliness
  if (completedInterviews.length === 0) {
    score -= 1;
  } else if (timelinessRate >= 90) {
    score += 5;
  } else if (timelinessRate >= 70) {
    score += 2;
  } else if (timelinessRate < 40) {
    score -= 4;
  }

  // Modifier 4: LA/Police notification
  if (laRate >= 95 && policeHighRate >= 90) {
    score += 5;
  } else if (laRate >= 75 || policeHighRate >= 75) {
    score += 2;
  } else if (laRate < 50 || policeHighRate < 50) {
    score -= 4;
  }

  // Modifier 5: Pattern analysis + contextual safeguarding
  if (totalEpisodes === 0) {
    score -= 1;
  } else if (patternRate >= 80 && csRate >= 80) {
    score += 4;
  } else if (patternRate >= 60 || csRate >= 60) {
    score += 2;
  } else if (patternRate < 30 && csRate < 30) {
    score -= 4;
  }

  // Modifier 6: Duration + resolution
  if (totalEpisodes === 0) {
    score -= 2;
  } else if ((avgDuration ?? 0) <= 3 && stillMissingCount === 0) {
    score += 5;
  } else if ((avgDuration ?? 0) <= 6 || stillMissingCount === 0) {
    score += 2;
  } else if ((avgDuration ?? 0) > 12 || stillMissingCount > 0) {
    score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (episodesLast90 === 0 && totalEpisodes > 0) {
    strengths.push(
      "No missing episodes in the last 90 days — frequency has reduced to zero.",
    );
  }
  if (returnInterviewRate >= 95 && returnedEpisodes.length > 0) {
    strengths.push(
      `Return interview completion at ${returnInterviewRate}% — robust follow-up after every episode.`,
    );
  }
  if (timelinessRate >= 90 && completedInterviews.length > 0) {
    strengths.push(
      `${timelinessRate}% of return interviews completed within 72 hours — timely engagement with children post-episode.`,
    );
  }
  if (laRate >= 95 && totalEpisodes > 0) {
    strengths.push(
      `LA notification rate at ${laRate}% — placing authorities consistently informed.`,
    );
  }
  if (
    policeHighRate >= 90 &&
    highRiskEpisodes.length > 0
  ) {
    strengths.push(
      `${policeHighRate}% of high-risk episodes reported to police — appropriate escalation in place.`,
    );
  }
  if (patternRate >= 80 && totalEpisodes > 0) {
    strengths.push(
      `Pattern analysis documented for ${patternRate}% of episodes — evidence of analytical practice.`,
    );
  }
  if ((avgDuration ?? 0) <= 3 && totalEpisodes > 0) {
    strengths.push(
      `Average episode duration is ${avgDuration} hours — children return quickly.`,
    );
  }
  if (stillMissingCount === 0 && totalEpisodes > 0) {
    strengths.push(
      "All missing episodes resolved — no children currently unaccounted for.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (stillMissingCount > 0) {
    concerns.push(
      `${stillMissingCount} child${stillMissingCount > 1 ? "ren" : ""} currently missing — immediate safeguarding response required.`,
    );
  }
  if (childrenWith3Plus > 0) {
    concerns.push(
      `${childrenWith3Plus} child${childrenWith3Plus > 1 ? "ren" : ""} with 3 or more missing episodes — repeat pattern indicates unresolved triggers requiring urgent intervention.`,
    );
  }
  if (highRiskCount > totalEpisodes / 3 && totalEpisodes > 0) {
    concerns.push(
      `${highRiskCount} of ${totalEpisodes} episodes are high risk (${pct(highRiskCount, totalEpisodes)}%) — disproportionate escalation level requires strategic review.`,
    );
  }
  if (returnInterviewRate < 80 && returnedEpisodes.length > 0) {
    concerns.push(
      `Return interview completion at ${returnInterviewRate}% — statutory guidance requires an interview after every episode.`,
    );
  }
  if (timelinessRate < 70 && completedInterviews.length > 0) {
    concerns.push(
      `Only ${timelinessRate}% of return interviews completed within 72 hours — delays reduce effectiveness and evidence quality.`,
    );
  }
  if (laRate < 80 && totalEpisodes > 0) {
    concerns.push(
      `LA notification rate at ${laRate}% — placing authorities must be notified of every missing episode.`,
    );
  }
  if (policeHighRate < 80 && highRiskEpisodes.length > 0) {
    concerns.push(
      `Only ${policeHighRate}% of high-risk episodes reported to police — all high-risk episodes must be reported.`,
    );
  }
  if ((avgDuration ?? 0) > 12 && totalEpisodes > 0) {
    concerns.push(
      `Average episode duration is ${avgDuration} hours — prolonged absences significantly increase safeguarding risk.`,
    );
  }
  if (patternRate < 50 && totalEpisodes > 0) {
    concerns.push(
      `Pattern analysis documented for only ${patternRate}% of episodes — insufficient analytical approach to understanding triggers.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: MissingEpisodeRecommendation[] = [];
  let rank = 1;

  if (stillMissingCount > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Activate missing from care protocol for all currently missing children — ensure police referral, LA notification, and senior management oversight are in place.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34; DfE Missing Guidance 2014",
    });
  }

  if (returnInterviewRate < 80 && returnedEpisodes.length > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Complete all outstanding return interviews — DfE guidance requires an independent return interview within 72 hours of every missing episode.",
      urgency: "immediate",
      regulatory_ref: "DfE Missing Guidance 2014; CHR 2015 Reg 34",
    });
  }

  if (childrenWith3Plus > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Convene a multi-agency strategy meeting for children with repeat missing episodes — identify root causes, update risk assessments, and review placement suitability.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12; SCCIF Leadership and management",
    });
  }

  if (laRate < 80 && totalEpisodes > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Review LA notification procedures — every missing episode must be reported to the placing authority without delay.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34",
    });
  }

  if (policeHighRate < 80 && highRiskEpisodes.length > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Ensure all high-risk missing episodes are reported to police — failure to do so is a significant safeguarding gap.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34; DfE Missing Guidance 2014",
    });
  }

  if (timelinessRate < 70 && completedInterviews.length > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Improve return interview timeliness — arrange independent interviews within 72 hours of return to maximise intelligence gathering and child engagement.",
      urgency: "soon",
      regulatory_ref: "DfE Missing Guidance 2014",
    });
  }

  if (patternRate < 60 && totalEpisodes > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Strengthen pattern analysis documentation — each episode should include analysis of triggers, timing, locations, and associations to identify exploitation risk.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12; SCCIF Helped and protected",
    });
  }

  if (
    highRiskCount > totalEpisodes / 3 &&
    totalEpisodes > 0
  ) {
    recs.push({
      rank: rank++,
      recommendation:
        "Review contextual safeguarding strategy — high proportion of high-risk episodes suggests external exploitation factors require multi-agency response.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12; SCCIF Helped and protected",
    });
  }

  if ((avgDuration ?? 0) > 12 && totalEpisodes > 0) {
    recs.push({
      rank: rank++,
      recommendation:
        "Investigate prolonged absence durations — consider whether response protocols, police engagement, and communication strategies need improvement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34; DfE Missing Guidance 2014",
    });
  }

  if (
    episodesLast90 > 0 &&
    total_children > 0 &&
    episodesPerChild > 1
  ) {
    recs.push({
      rank: rank++,
      recommendation:
        "Review home-level missing from care strategy — episode frequency per child exceeds acceptable levels, consider targeted interventions and staff training.",
      urgency: "planned",
      regulatory_ref: "SCCIF Leadership and management",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: MissingEpisodeInsight[] = [];

  if (stillMissingCount > 0) {
    insights.push({
      text: `${stillMissingCount} child${stillMissingCount > 1 ? "ren are" : " is"} currently missing. This is a live safeguarding situation requiring immediate action. Ofsted will expect evidence of real-time escalation, police engagement, and senior management oversight.`,
      severity: "critical",
    });
  }

  if (childrenWith3Plus > 0) {
    const maxCount = Math.max(...Object.values(childCounts));
    insights.push({
      text: `${childrenWith3Plus} child${childrenWith3Plus > 1 ? "ren have" : " has"} 3 or more missing episodes (highest: ${maxCount}). Repeat patterns strongly suggest unresolved push/pull factors. Ofsted will ask what the home has done differently after each episode.`,
      severity: "critical",
    });
  }

  if (
    highRiskCount > totalEpisodes / 3 &&
    totalEpisodes >= 3
  ) {
    insights.push({
      text: `${pct(highRiskCount, totalEpisodes)}% of episodes are high risk. This level of escalation indicates potential exploitation, county lines involvement, or significant relationship breakdown. Multi-agency response is essential.`,
      severity: "critical",
    });
  }

  if (returnInterviewRate < 50 && returnedEpisodes.length > 0) {
    insights.push({
      text: `Return interview rate is critically low at ${returnInterviewRate}%. Without return interviews, the home cannot gather intelligence about where children go, who they are with, or what risks they face. This is a regulatory breach.`,
      severity: "critical",
    });
  }

  if (laRate < 50 && totalEpisodes > 0) {
    insights.push({
      text: `LA notification rate is ${laRate}% — less than half of missing episodes are reported to placing authorities. This is a serious regulatory and safeguarding failure.`,
      severity: "critical",
    });
  }

  if ((avgDuration ?? 0) > 12) {
    insights.push({
      text: `Average absence duration of ${avgDuration} hours indicates children are missing for extended periods. This significantly increases exposure to exploitation, harm, and substance misuse.`,
      severity: "warning",
    });
  }

  if (
    timelinessRate < 70 &&
    timelinessRate >= 40 &&
    completedInterviews.length > 0
  ) {
    insights.push({
      text: `Only ${timelinessRate}% of return interviews are conducted within 72 hours. DfE guidance is clear that timeliness is critical — delayed interviews yield less reliable intelligence and signal to children that the home's response is not urgent.`,
      severity: "warning",
    });
  }

  if (
    patternRate < 50 &&
    totalEpisodes >= 3
  ) {
    insights.push({
      text: `Pattern analysis is documented for only ${patternRate}% of episodes. Without systematic analysis of triggers, timing, and associations, the home cannot demonstrate an intelligence-led approach to preventing further episodes.`,
      severity: "warning",
    });
  }

  if (
    episodesLast90 === 0 &&
    totalEpisodes > 0
  ) {
    insights.push({
      text: "No missing episodes in the last 90 days despite historical episodes. This suggests interventions are effective — document what has changed for Ofsted evidence.",
      severity: "positive",
    });
  }

  if (
    returnInterviewRate >= 95 &&
    timelinessRate >= 90 &&
    returnedEpisodes.length > 0
  ) {
    insights.push({
      text: `Excellent return interview practice: ${returnInterviewRate}% completion with ${timelinessRate}% within 72 hours. This demonstrates a robust, child-centred response that maximises intelligence gathering.`,
      severity: "positive",
    });
  }

  if (
    laRate >= 95 &&
    policeHighRate >= 90 &&
    totalEpisodes > 0
  ) {
    insights.push({
      text: "Strong notification compliance — LA and police reporting rates are both excellent. This evidences a well-embedded missing from care protocol with clear escalation pathways.",
      severity: "positive",
    });
  }

  if (
    (avgDuration ?? 0) <= 3 &&
    stillMissingCount === 0 &&
    totalEpisodes > 0
  ) {
    insights.push({
      text: `Average episode duration of ${avgDuration} hours with all children safely returned. Short durations suggest effective early response, good relationships with children, and robust communication with police.`,
      severity: "positive",
    });
  }

  if (
    patternRate >= 80 &&
    csRate >= 80 &&
    highRiskEpisodes.length > 0
  ) {
    insights.push({
      text: "Strong analytical practice — pattern analysis and contextual safeguarding assessments are consistently completed. This intelligence-led approach is essential for identifying and disrupting exploitation.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline =
      episodesLast90 === 0
        ? "Outstanding missing episode management — no recent episodes with excellent compliance and safeguarding response."
        : `Outstanding missing episode management — ${totalEpisodes} episode${totalEpisodes !== 1 ? "s" : ""} with ${returnInterviewRate}% return interview completion and strong notification compliance.`;
  } else if (rating === "good") {
    headline = `Good missing episode management — ${episodesLast90} episode${episodesLast90 !== 1 ? "s" : ""} in 90 days with ${returnInterviewRate}% return interview completion.`;
  } else if (rating === "adequate") {
    headline =
      "Adequate missing episode management — improvements needed in frequency, compliance, or safeguarding response.";
  } else {
    headline =
      "Missing episode management is inadequate — frequency, compliance, or safeguarding response requires urgent attention.";
  }

  return {
    missing_rating: rating,
    missing_score: score,
    headline,
    total_episodes: totalEpisodes,
    unique_children_missing: uniqueChildren,
    episodes_last_90_days: episodesLast90,
    high_risk_count: highRiskCount,
    still_missing_count: stillMissingCount,
    return_interview_rate: returnInterviewRate,
    return_interview_timeliness_rate: timelinessRate,
    la_notification_rate: laRate,
    police_report_rate_high_risk: policeHighRate,
    contextual_safeguarding_flag_rate: csRate,
    pattern_analysis_rate: patternRate,
    average_duration_hours: avgDuration,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
