import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MISSING PERSON & ABSENT WITHOUT AUTHORITY INTELLIGENCE ENGINE
// Monitors missing person protocol adherence, return interview completion,
// risk assessment updates, police liaison, and pattern analysis across the home.
// Measures protocol compliance rates, return interview timeliness, risk update
// cadence, police liaison effectiveness, pattern analysis coverage, and
// prevention strategy implementation.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 34 (Safeguarding — missing children), Reg 5 (Engaging with
// the wider system). SCCIF: "Children who go missing from care are protected."
// Store keys: missingProtocolRecords, returnInterviewRecords,
//             riskAssessmentUpdateRecords, policeLiaisonRecords,
//             patternAnalysisRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MissingProtocolRecordInput {
  id: string;
  child_id: string;
  episode_date: string;
  episode_type: "missing" | "absent_without_authority" | "away_from_placement";
  risk_level: "low" | "medium" | "high" | "very_high";
  duration_hours: number;
  protocol_followed: boolean;
  notification_within_timeframe: boolean;
  police_notified: boolean;
  local_authority_notified: boolean;
  designated_safeguarding_lead_informed: boolean;
  search_actions_documented: boolean;
  trigger_factors_recorded: boolean;
  outcome: "returned_self" | "found_by_staff" | "found_by_police" | "found_by_other" | "ongoing";
  return_date: string | null;
  debriefing_completed: boolean;
  created_at: string;
}

export interface ReturnInterviewRecordInput {
  id: string;
  child_id: string;
  episode_id: string;
  interview_date: string;
  interviewer_independent: boolean;
  completed_within_72_hours: boolean;
  child_views_captured: boolean;
  push_pull_factors_explored: boolean;
  safeguarding_concerns_identified: boolean;
  referrals_made: boolean;
  actions_agreed: boolean;
  actions_followed_up: boolean;
  quality_rating: number; // 1-5
  information_shared_with_placing_authority: boolean;
  created_at: string;
}

export interface RiskAssessmentUpdateRecordInput {
  id: string;
  child_id: string;
  episode_id: string;
  update_date: string;
  risk_level_before: "low" | "medium" | "high" | "very_high";
  risk_level_after: "low" | "medium" | "high" | "very_high";
  contextual_safeguarding_considered: boolean;
  exploitation_screening_completed: boolean;
  safety_plan_updated: boolean;
  care_plan_updated: boolean;
  multi_agency_input: boolean;
  triggers_updated: boolean;
  protective_factors_reviewed: boolean;
  updated_within_48_hours: boolean;
  created_at: string;
}

export interface PoliceLiaisonRecordInput {
  id: string;
  child_id: string;
  episode_id: string;
  liaison_date: string;
  liaison_type: "initial_report" | "update" | "strategy_discussion" | "safe_and_well_check" | "intelligence_sharing" | "debrief";
  police_reference_obtained: boolean;
  response_timely: boolean;
  information_quality_rating: number; // 1-5
  joint_risk_assessment: boolean;
  outcome_documented: boolean;
  follow_up_actions_agreed: boolean;
  follow_up_completed: boolean;
  created_at: string;
}

export interface PatternAnalysisRecordInput {
  id: string;
  child_id: string;
  analysis_date: string;
  period_covered_days: number;
  episodes_in_period: number;
  pattern_identified: boolean;
  pattern_type: "time_of_day" | "day_of_week" | "trigger_related" | "location" | "peer_influence" | "exploitation_indicator" | "seasonal" | "none";
  prevention_strategy_developed: boolean;
  prevention_strategy_implemented: boolean;
  prevention_effective: boolean;
  multi_agency_mapping_completed: boolean;
  contextual_safeguarding_mapping: boolean;
  shared_with_placing_authority: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface MissingPersonInput {
  today: string;
  total_children: number;
  missing_protocol_records: MissingProtocolRecordInput[];
  return_interview_records: ReturnInterviewRecordInput[];
  risk_assessment_update_records: RiskAssessmentUpdateRecordInput[];
  police_liaison_records: PoliceLiaisonRecordInput[];
  pattern_analysis_records: PatternAnalysisRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MissingPersonRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MissingPersonInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface MissingPersonRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface MissingPersonResult {
  missing_rating: MissingPersonRating;
  missing_score: number | null;
  headline: string;
  total_episodes: number;
  protocol_adherence_rate: number | null;
  return_interview_rate: number | null;
  risk_update_rate: number | null;
  police_liaison_rate: number | null;
  pattern_analysis_rate: number | null;
  prevention_rate: number | null;
  notification_timeliness_rate: number | null;
  return_interview_quality_avg: number | null;
  risk_assessment_timeliness_rate: number | null;
  exploitation_screening_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: MissingPersonRecommendation[];
  insights: MissingPersonInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MissingPersonRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: MissingPersonRating,
  score: number,
  headline: string,
): MissingPersonResult {
  return {
    missing_rating: rating,
    missing_score: score,
    headline,
    total_episodes: 0,
    protocol_adherence_rate: null,
    return_interview_rate: null,
    risk_update_rate: null,
    police_liaison_rate: null,
    pattern_analysis_rate: null,
    prevention_rate: null,
    notification_timeliness_rate: null,
    return_interview_quality_avg: 0,
    risk_assessment_timeliness_rate: null,
    exploitation_screening_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeMissingPersonAbsentAuthority(
  input: MissingPersonInput,
): MissingPersonResult {
  const {
    total_children,
    missing_protocol_records,
    return_interview_records,
    risk_assessment_update_records,
    police_liaison_records,
    pattern_analysis_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    missing_protocol_records.length === 0 &&
    return_interview_records.length === 0 &&
    risk_assessment_update_records.length === 0 &&
    police_liaison_records.length === 0 &&
    pattern_analysis_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess missing person and absent without authority management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No missing person or absent without authority data recorded despite children on placement — missing person protocols, return interviews, and risk management require urgent attention.",
      ),
      concerns: [
        "No missing protocol records, return interview records, risk assessment updates, police liaison records, or pattern analysis records exist despite children being on placement — the home cannot evidence compliance with missing person procedures or safeguarding obligations.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured missing person and absent without authority recording protocols for all episodes to ensure regulatory compliance and safeguarding evidence under Reg 34.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
        },
        {
          rank: 2,
          recommendation:
            "Establish a return interview framework ensuring every child who goes missing or is absent without authority receives a timely, independent return interview with documented outcomes.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
        },
      ],
      insights: [
        {
          text: "The complete absence of missing person and absent without authority records means the home cannot demonstrate compliance with Reg 34 safeguarding obligations. Ofsted expects robust systems for recording, responding to, and learning from missing episodes. Without this evidence, the home cannot show it protects children who go missing or are absent without authority.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  const totalEpisodes = missing_protocol_records.length;

  // --- Protocol adherence ---
  const protocolFollowed = missing_protocol_records.filter(
    (p) => p.protocol_followed,
  ).length;
  const protocolAdherenceRate = rate(protocolFollowed, totalEpisodes);

  // --- Notification timeliness ---
  const notifiedWithinTimeframe = missing_protocol_records.filter(
    (p) => p.notification_within_timeframe,
  ).length;
  const notificationTimelinessRate = rate(notifiedWithinTimeframe, totalEpisodes);

  // --- Police notification rate (for high/very_high risk) ---
  const highRiskEpisodes = missing_protocol_records.filter(
    (p) => p.risk_level === "high" || p.risk_level === "very_high",
  );
  const highRiskPoliceNotified = highRiskEpisodes.filter(
    (p) => p.police_notified,
  ).length;
  const highRiskPoliceNotificationRate = rate(highRiskPoliceNotified, highRiskEpisodes.length);

  // --- Trigger factors recorded ---
  const triggersRecorded = missing_protocol_records.filter(
    (p) => p.trigger_factors_recorded,
  ).length;
  const triggersRecordedRate = rate(triggersRecorded, totalEpisodes);

  // --- Debriefing completion ---
  const debriefCompleted = missing_protocol_records.filter(
    (p) => p.debriefing_completed,
  ).length;
  const debriefCompletionRate = rate(debriefCompleted, totalEpisodes);

  // --- Episode types ---
  const missingEpisodes = missing_protocol_records.filter(
    (p) => p.episode_type === "missing",
  ).length;
  const absentEpisodes = missing_protocol_records.filter(
    (p) => p.episode_type === "absent_without_authority",
  ).length;
  const awayEpisodes = missing_protocol_records.filter(
    (p) => p.episode_type === "away_from_placement",
  ).length;

  // --- Unique children with episodes ---
  const uniqueChildrenWithEpisodes = new Set(
    missing_protocol_records.map((p) => p.child_id),
  ).size;

  // --- Ongoing episodes ---
  const ongoingEpisodes = missing_protocol_records.filter(
    (p) => p.outcome === "ongoing",
  ).length;

  // ── Return Interview Metrics ──────────────────────────────────────────

  const totalReturnInterviews = return_interview_records.length;

  // --- Return interview coverage ---
  const closedEpisodes = missing_protocol_records.filter(
    (p) => p.outcome !== "ongoing",
  ).length;
  const episodesWithInterviews = new Set(
    return_interview_records.map((r) => r.episode_id),
  ).size;
  const returnInterviewRate = rate(episodesWithInterviews, closedEpisodes);

  // --- Interview timeliness ---
  const interviewsWithin72 = return_interview_records.filter(
    (r) => r.completed_within_72_hours,
  ).length;
  const interviewTimelinessRate = rate(interviewsWithin72, totalReturnInterviews);

  // --- Independence ---
  const independentInterviews = return_interview_records.filter(
    (r) => r.interviewer_independent,
  ).length;
  const independentInterviewRate = rate(independentInterviews, totalReturnInterviews);

  // --- Child views captured ---
  const childViewsCaptured = return_interview_records.filter(
    (r) => r.child_views_captured,
  ).length;
  const childViewsRate = rate(childViewsCaptured, totalReturnInterviews);

  // --- Push/pull factors explored ---
  const pushPullExplored = return_interview_records.filter(
    (r) => r.push_pull_factors_explored,
  ).length;
  const pushPullRate = rate(pushPullExplored, totalReturnInterviews);

  // --- Actions follow-up ---
  const interviewsWithActions = return_interview_records.filter(
    (r) => r.actions_agreed,
  );
  const actionsFollowedUp = interviewsWithActions.filter(
    (r) => r.actions_followed_up,
  ).length;
  const actionsFollowUpRate = rate(actionsFollowedUp, interviewsWithActions.length);

  // --- Quality rating ---
  const qualitySum = return_interview_records.reduce(
    (sum, r) => sum + r.quality_rating,
    0,
  );
  const returnInterviewQualityAvg =
    totalReturnInterviews > 0
      ? Math.round((qualitySum / totalReturnInterviews) * 100) / 100
      : null;

  // ── Risk Assessment Update Metrics ────────────────────────────────────

  const totalRiskUpdates = risk_assessment_update_records.length;

  // --- Risk update coverage ---
  const episodesWithRiskUpdate = new Set(
    risk_assessment_update_records.map((r) => r.episode_id),
  ).size;
  const riskUpdateRate = rate(episodesWithRiskUpdate, totalEpisodes);

  // --- Timeliness ---
  const updatedWithin48 = risk_assessment_update_records.filter(
    (r) => r.updated_within_48_hours,
  ).length;
  const riskAssessmentTimelinessRate = rate(updatedWithin48, totalRiskUpdates);

  // --- Contextual safeguarding ---
  const contextualConsidered = risk_assessment_update_records.filter(
    (r) => r.contextual_safeguarding_considered,
  ).length;
  const contextualSafeguardingRate = rate(contextualConsidered, totalRiskUpdates);

  // --- Exploitation screening ---
  const exploitationScreened = risk_assessment_update_records.filter(
    (r) => r.exploitation_screening_completed,
  ).length;
  const exploitationScreeningRate = rate(exploitationScreened, totalRiskUpdates);

  // --- Safety plan updated ---
  const safetyPlanUpdated = risk_assessment_update_records.filter(
    (r) => r.safety_plan_updated,
  ).length;
  const safetyPlanUpdateRate = rate(safetyPlanUpdated, totalRiskUpdates);

  // --- Care plan updated ---
  const carePlanUpdated = risk_assessment_update_records.filter(
    (r) => r.care_plan_updated,
  ).length;
  const carePlanUpdateRate = rate(carePlanUpdated, totalRiskUpdates);

  // --- Risk escalation/de-escalation tracking ---
  const riskEscalated = risk_assessment_update_records.filter(
    (r) => riskLevelToNum(r.risk_level_after) > riskLevelToNum(r.risk_level_before),
  ).length;
  const riskDeescalated = risk_assessment_update_records.filter(
    (r) => riskLevelToNum(r.risk_level_after) < riskLevelToNum(r.risk_level_before),
  ).length;

  // ── Police Liaison Metrics ────────────────────────────────────────────

  const totalPoliceLiaisons = police_liaison_records.length;

  // --- Police liaison coverage ---
  const episodesWithPoliceLiaison = new Set(
    police_liaison_records.map((r) => r.episode_id),
  ).size;
  const policeLiaisonRate = rate(episodesWithPoliceLiaison, totalEpisodes);

  // --- Reference obtained ---
  const referenceObtained = police_liaison_records.filter(
    (r) => r.police_reference_obtained,
  ).length;
  const referenceObtainedRate = rate(referenceObtained, totalPoliceLiaisons);

  // ── Pattern Analysis Metrics ──────────────────────────────────────────

  const totalPatternAnalyses = pattern_analysis_records.length;

  // --- Pattern analysis coverage ---
  const uniqueChildrenWithAnalysis = new Set(
    pattern_analysis_records.map((r) => r.child_id),
  ).size;
  const patternAnalysisRate =
    uniqueChildrenWithEpisodes > 0
      ? rate(uniqueChildrenWithAnalysis, uniqueChildrenWithEpisodes)
      : null;

  // --- Patterns identified ---
  const patternsIdentified = pattern_analysis_records.filter(
    (r) => r.pattern_identified,
  ).length;

  // --- Prevention effectiveness ---
  const preventionEffective = pattern_analysis_records.filter(
    (r) => r.prevention_effective,
  ).length;
  const preventionRate = totalPatternAnalyses > 0
    ? rate(preventionEffective, totalPatternAnalyses)
    : null;

  // --- Multi-agency mapping ---
  const multiAgencyMapping = pattern_analysis_records.filter(
    (r) => r.multi_agency_mapping_completed,
  ).length;
  const multiAgencyMappingRate = rate(multiAgencyMapping, totalPatternAnalyses);

  // --- Shared with placing authority ---
  const sharedWithPA = pattern_analysis_records.filter(
    (r) => r.shared_with_placing_authority,
  ).length;
  const sharedWithPARate = rate(sharedWithPA, totalPatternAnalyses);

  // --- Overdue reviews ---
  const overduePatternReviews = pattern_analysis_records.filter(
    (r) => r.review_overdue,
  ).length;

  // --- Pattern types distribution ---
  const patternTypeCounts: Record<string, number> = {};
  for (const pa of pattern_analysis_records.filter((r) => r.pattern_identified)) {
    patternTypeCounts[pa.pattern_type] = (patternTypeCounts[pa.pattern_type] ?? 0) + 1;
  }

  // --- Repeat children (children with 2+ episodes) ---
  const childEpisodeCounts: Record<string, number> = {};
  for (const ep of missing_protocol_records) {
    childEpisodeCounts[ep.child_id] = (childEpisodeCounts[ep.child_id] ?? 0) + 1;
  }
  const repeatChildren = Object.entries(childEpisodeCounts).filter(
    ([, count]) => count >= 2,
  );
  const repeatChildCount = repeatChildren.length;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: protocolAdherenceRate (>=95: +5, >=80: +3) ---
  if (meets(protocolAdherenceRate, 95)) score += 5;
  else if (meets(protocolAdherenceRate, 80)) score += 3;

  // --- Bonus 2: returnInterviewRate (>=95: +5, >=80: +3) ---
  if (meets(returnInterviewRate, 95)) score += 5;
  else if (meets(returnInterviewRate, 80)) score += 3;

  // --- Bonus 3: riskUpdateRate (>=90: +4, >=70: +2) ---
  if (meets(riskUpdateRate, 90)) score += 4;
  else if (meets(riskUpdateRate, 70)) score += 2;

  // --- Bonus 4: policeLiaisonRate (>=90: +4, >=70: +2) ---
  if (meets(policeLiaisonRate, 90)) score += 4;
  else if (meets(policeLiaisonRate, 70)) score += 2;

  // --- Bonus 5: patternAnalysisRate (>=90: +3, >=70: +1) ---
  if ((patternAnalysisRate ?? 0) >= 90) score += 3;
  else if ((patternAnalysisRate ?? 0) >= 70) score += 1;

  // --- Bonus 6: preventionRate (>=80: +3, >=60: +1) ---
  if ((preventionRate ?? 0) >= 80) score += 3;
  else if ((preventionRate ?? 0) >= 60) score += 1;

  // --- Bonus 7: returnInterviewQualityAvg (>=4.0: +2, >=3.0: +1) ---
  if ((returnInterviewQualityAvg ?? 0) >= 4.0) score += 2;
  else if ((returnInterviewQualityAvg ?? 0) >= 3.0) score += 1;

  // --- Bonus 8: exploitationScreeningRate (>=90: +2, >=70: +1) ---
  if (meets(exploitationScreeningRate, 90)) score += 2;
  else if (meets(exploitationScreeningRate, 70)) score += 1;

  // ── Penalties (4 penalties, guarded by array.length > 0) ──────────────

  // Penalty 1: protocolAdherenceRate < 50
  if (below(protocolAdherenceRate, 50) && missing_protocol_records.length > 0) score -= 6;

  // Penalty 2: returnInterviewRate < 50
  if (below(returnInterviewRate, 50) && return_interview_records.length > 0) score -= 6;

  // Penalty 3: riskUpdateRate < 40
  if (below(riskUpdateRate, 40) && risk_assessment_update_records.length > 0) score -= 4;

  // Penalty 4: exploitationScreeningRate < 40
  if (below(exploitationScreeningRate, 40) && risk_assessment_update_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const missing_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(protocolAdherenceRate, 95) && totalEpisodes > 0) {
    strengths.push(
      "Missing person protocols followed in virtually every episode — the home demonstrates exemplary adherence to statutory procedures and ensures every missing or absent episode is managed consistently and safely.",
    );
  } else if (meets(protocolAdherenceRate, 80) && totalEpisodes > 0) {
    strengths.push(
      `${protocolAdherenceRate}% protocol adherence — strong compliance with missing person procedures across the majority of episodes.`,
    );
  }

  if (meets(returnInterviewRate, 95) && closedEpisodes > 0) {
    strengths.push(
      "Return interviews completed for virtually every closed episode — the home ensures that every child who goes missing or is absent without authority receives a structured return discussion to explore safeguarding concerns.",
    );
  } else if (meets(returnInterviewRate, 80) && closedEpisodes > 0) {
    strengths.push(
      `${returnInterviewRate}% return interview coverage — the home demonstrates strong commitment to understanding children's experiences when they go missing.`,
    );
  }

  if (meets(riskUpdateRate, 90) && totalEpisodes > 0) {
    strengths.push(
      `${riskUpdateRate}% of episodes have triggered risk assessment updates — the home consistently reviews and updates risk following missing or absent episodes, ensuring care plans reflect current risk levels.`,
    );
  } else if (meets(riskUpdateRate, 70) && totalEpisodes > 0) {
    strengths.push(
      `${riskUpdateRate}% risk assessment update rate — the majority of episodes result in updated risk assessments, supporting responsive safeguarding.`,
    );
  }

  if (meets(policeLiaisonRate, 90) && totalEpisodes > 0) {
    strengths.push(
      `${policeLiaisonRate}% police liaison rate — the home maintains strong partnerships with the police across nearly all missing and absent episodes, supporting multi-agency safeguarding.`,
    );
  } else if (meets(policeLiaisonRate, 70) && totalEpisodes > 0) {
    strengths.push(
      `${policeLiaisonRate}% police liaison coverage — the home engages effectively with the police for the majority of episodes.`,
    );
  }

  if ((patternAnalysisRate ?? 0) >= 90 && uniqueChildrenWithEpisodes > 0) {
    strengths.push(
      `Pattern analysis completed for ${patternAnalysisRate}% of children with episodes — the home proactively analyses missing and absent patterns to inform prevention strategies and identify exploitation risks.`,
    );
  } else if ((patternAnalysisRate ?? 0) >= 70 && uniqueChildrenWithEpisodes > 0) {
    strengths.push(
      `${patternAnalysisRate}% pattern analysis coverage — the home analyses patterns for the majority of children who go missing or are absent without authority.`,
    );
  }

  if ((preventionRate ?? 0) >= 80 && totalPatternAnalyses > 0) {
    strengths.push(
      `${preventionRate}% of pattern analyses have led to effective prevention — the home demonstrates strong evidence that analysis translates into reduced missing and absent episodes for children.`,
    );
  } else if ((preventionRate ?? 0) >= 60 && totalPatternAnalyses > 0) {
    strengths.push(
      `${preventionRate}% prevention effectiveness — pattern analysis is delivering measurable reductions in missing and absent episodes for the majority of children analysed.`,
    );
  }

  if ((returnInterviewQualityAvg ?? 0) >= 4.0 && totalReturnInterviews > 0) {
    strengths.push(
      `Return interview quality averages ${returnInterviewQualityAvg}/5 — interviews are conducted to a high standard, ensuring children's voices are meaningfully heard and safeguarding concerns are thoroughly explored.`,
    );
  } else if ((returnInterviewQualityAvg ?? 0) >= 3.0 && totalReturnInterviews > 0) {
    strengths.push(
      `Return interview quality averages ${returnInterviewQualityAvg}/5 — competent interview practice with scope for further development.`,
    );
  }

  if (meets(exploitationScreeningRate, 90) && totalRiskUpdates > 0) {
    strengths.push(
      `${exploitationScreeningRate}% exploitation screening rate — the home systematically screens for criminal and sexual exploitation following missing and absent episodes, a critical safeguarding practice.`,
    );
  } else if (meets(exploitationScreeningRate, 70) && totalRiskUpdates > 0) {
    strengths.push(
      `${exploitationScreeningRate}% exploitation screening — good practice in screening for exploitation risks following missing or absent episodes.`,
    );
  }

  if (meets(notificationTimelinessRate, 95) && totalEpisodes > 0) {
    strengths.push(
      "Notifications are made within required timeframes in virtually every episode — the home ensures that the police, local authority, and other agencies are informed promptly, supporting rapid safeguarding responses.",
    );
  } else if (meets(notificationTimelinessRate, 80) && totalEpisodes > 0) {
    strengths.push(
      `${notificationTimelinessRate}% notification timeliness — strong performance in alerting agencies within required timeframes.`,
    );
  }

  if (meets(independentInterviewRate, 90) && totalReturnInterviews > 0) {
    strengths.push(
      `${independentInterviewRate}% of return interviews conducted by independent interviewers — the home ensures children can speak freely to someone outside the home, supporting disclosure of safeguarding concerns.`,
    );
  } else if (meets(independentInterviewRate, 70) && totalReturnInterviews > 0) {
    strengths.push(
      `${independentInterviewRate}% independent return interviews — good practice in providing children with independent return interview access.`,
    );
  }

  if (meets(contextualSafeguardingRate, 90) && totalRiskUpdates > 0) {
    strengths.push(
      `Contextual safeguarding is considered in ${contextualSafeguardingRate}% of risk updates — the home looks beyond the child to understand the environmental and social contexts that contribute to missing and absent episodes.`,
    );
  } else if (meets(contextualSafeguardingRate, 70) && totalRiskUpdates > 0) {
    strengths.push(
      `${contextualSafeguardingRate}% contextual safeguarding consideration — good awareness of wider contextual factors in risk assessment.`,
    );
  }

  if (meets(childViewsRate, 90) && totalReturnInterviews > 0) {
    strengths.push(
      "Children's views are captured in the vast majority of return interviews — the home ensures that children's own perspectives on why they went missing or were absent are central to safeguarding analysis.",
    );
  }

  if (meets(actionsFollowUpRate, 90) && interviewsWithActions.length > 0) {
    strengths.push(
      `${actionsFollowUpRate}% of return interview actions followed up — the home demonstrates that agreed actions translate into real change, not just documentation.`,
    );
  }

  if (meets(safetyPlanUpdateRate, 90) && totalRiskUpdates > 0) {
    strengths.push(
      `Safety plans updated in ${safetyPlanUpdateRate}% of risk reviews — the home ensures that safety planning remains dynamic and responsive to each episode.`,
    );
  }

  if (meets(referenceObtainedRate, 90) && totalPoliceLiaisons > 0) {
    strengths.push(
      `Police reference numbers obtained in ${referenceObtainedRate}% of liaison contacts — robust record-keeping supporting evidenced police engagement.`,
    );
  }

  if (meets(multiAgencyMappingRate, 80) && totalPatternAnalyses > 0) {
    strengths.push(
      `${multiAgencyMappingRate}% of pattern analyses include multi-agency mapping — the home collaborates with partner agencies to build a comprehensive picture of risks and patterns.`,
    );
  }

  if (meets(debriefCompletionRate, 90) && totalEpisodes > 0) {
    strengths.push(
      `Debriefing completed in ${debriefCompletionRate}% of episodes — the home uses debriefing to support both staff and children following missing or absent episodes.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(protocolAdherenceRate, 50) && totalEpisodes > 0) {
    concerns.push(
      `Protocol adherence at only ${protocolAdherenceRate}% — the majority of missing and absent episodes are not managed in accordance with the home's procedures, creating significant safeguarding risk and regulatory non-compliance.`,
    );
  } else if (below(protocolAdherenceRate, 80) && meets(protocolAdherenceRate, 50) && totalEpisodes > 0) {
    concerns.push(
      `Protocol adherence at ${protocolAdherenceRate}% — not all episodes are managed in accordance with missing person procedures, leaving gaps in safeguarding response.`,
    );
  }

  if (below(returnInterviewRate, 50) && closedEpisodes > 0) {
    concerns.push(
      `Return interview rate at only ${returnInterviewRate}% — the majority of children who go missing or are absent without authority do not receive a return interview, meaning safeguarding concerns, exploitation risks, and push/pull factors are not being identified.`,
    );
  } else if (below(returnInterviewRate, 80) && meets(returnInterviewRate, 50) && closedEpisodes > 0) {
    concerns.push(
      `Return interview coverage at ${returnInterviewRate}% — some children are missing return interviews, reducing the home's ability to identify and respond to underlying safeguarding concerns.`,
    );
  }

  if (below(riskUpdateRate, 40) && totalEpisodes > 0) {
    concerns.push(
      `Risk assessment updates follow only ${riskUpdateRate}% of episodes — the majority of missing and absent episodes do not trigger risk assessment review, meaning risk levels and safety plans may not reflect the child's current situation.`,
    );
  } else if (below(riskUpdateRate, 70) && meets(riskUpdateRate, 40) && totalEpisodes > 0) {
    concerns.push(
      `Risk update rate at ${riskUpdateRate}% — not all episodes trigger appropriate risk assessment review, potentially leaving outdated risk assessments in place.`,
    );
  }

  if (below(policeLiaisonRate, 50) && totalEpisodes > 0) {
    concerns.push(
      `Police liaison recorded for only ${policeLiaisonRate}% of episodes — inadequate engagement with the police undermines multi-agency safeguarding and may mean that intelligence about exploitation or harm is not being shared.`,
    );
  } else if (below(policeLiaisonRate, 70) && meets(policeLiaisonRate, 50) && totalEpisodes > 0) {
    concerns.push(
      `Police liaison at ${policeLiaisonRate}% — engagement with the police is inconsistent, which may result in missed opportunities for joint safeguarding action.`,
    );
  }

  if ((patternAnalysisRate ?? 0) < 50 && uniqueChildrenWithEpisodes > 0) {
    concerns.push(
      `Pattern analysis covers only ${patternAnalysisRate}% of children with episodes — without systematic analysis, the home cannot identify trends, triggers, or exploitation indicators that would inform prevention.`,
    );
  } else if ((patternAnalysisRate ?? 0) < 70 && (patternAnalysisRate ?? 0) >= 50 && uniqueChildrenWithEpisodes > 0) {
    concerns.push(
      `Pattern analysis coverage at ${patternAnalysisRate}% — some children who go missing or are absent without authority do not have their patterns formally analysed.`,
    );
  }

  if (below(exploitationScreeningRate, 40) && totalRiskUpdates > 0) {
    concerns.push(
      `Exploitation screening completed in only ${exploitationScreeningRate}% of risk updates — the majority of missing and absent episodes are not being screened for exploitation, a fundamental gap in safeguarding under Reg 34.`,
    );
  } else if (below(exploitationScreeningRate, 70) && meets(exploitationScreeningRate, 40) && totalRiskUpdates > 0) {
    concerns.push(
      `Exploitation screening at ${exploitationScreeningRate}% — not all risk updates include exploitation screening, which may mean exploitation indicators are being missed.`,
    );
  }

  if (below(highRiskPoliceNotificationRate, 100) && highRiskEpisodes.length > 0) {
    const notNotified = highRiskEpisodes.length - highRiskPoliceNotified;
    concerns.push(
      `${notNotified} high/very-high risk episode${notNotified !== 1 ? "s" : ""} without police notification — failure to notify the police of high-risk missing episodes represents a critical safeguarding failure.`,
    );
  }

  if (below(notificationTimelinessRate, 70) && totalEpisodes > 0) {
    concerns.push(
      `Only ${notificationTimelinessRate}% of notifications made within required timeframes — delayed notifications reduce the effectiveness of search and safeguarding responses and may breach regulatory requirements.`,
    );
  }

  if (ongoingEpisodes > 0) {
    concerns.push(
      `${ongoingEpisodes} episode${ongoingEpisodes !== 1 ? "s" : ""} currently ongoing — the home has ${ongoingEpisodes === 1 ? "a child" : "children"} currently missing or absent without authority, requiring active management and escalation.`,
    );
  }

  if (repeatChildCount > 0 && totalEpisodes > 0) {
    const maxEpisodes = repeatChildren.reduce(
      (max, [, count]) => Math.max(max, count),
      0,
    );
    concerns.push(
      `${repeatChildCount} child${repeatChildCount !== 1 ? "ren" : ""} with repeat episodes (up to ${maxEpisodes} episodes) — repeat missing or absent patterns indicate that current interventions and safety plans are insufficient.`,
    );
  }

  if (below(independentInterviewRate, 50) && totalReturnInterviews > 0) {
    concerns.push(
      `Only ${independentInterviewRate}% of return interviews conducted independently — children may not feel safe disclosing concerns to staff from the home, reducing the effectiveness of return interviews as a safeguarding tool.`,
    );
  }

  if (below(childViewsRate, 70) && totalReturnInterviews > 0) {
    concerns.push(
      `Children's views captured in only ${childViewsRate}% of return interviews — interviews that do not capture the child's perspective fail to meet their primary purpose of understanding the child's experience.`,
    );
  }

  if (below(actionsFollowUpRate, 60) && interviewsWithActions.length > 0) {
    concerns.push(
      `Only ${actionsFollowUpRate}% of return interview actions followed up — agreed actions are not translating into change, undermining the purpose of return interviews and the home's ability to prevent recurrence.`,
    );
  }

  if (below(contextualSafeguardingRate, 50) && totalRiskUpdates > 0) {
    concerns.push(
      `Contextual safeguarding considered in only ${contextualSafeguardingRate}% of risk updates — the home is not systematically examining the wider context in which children go missing, potentially missing environmental risks and exploitation indicators.`,
    );
  }

  if (overduePatternReviews > 0 && totalPatternAnalyses > 0) {
    concerns.push(
      `${overduePatternReviews} pattern analysis review${overduePatternReviews !== 1 ? "s are" : " is"} overdue — without timely review, pattern analyses may not reflect current risks and prevention strategies may become stale.`,
    );
  }

  if ((preventionRate ?? 0) < 30 && totalPatternAnalyses > 0) {
    concerns.push(
      `Prevention strategies effective in only ${preventionRate}% of cases — pattern analysis is not translating into effective prevention, questioning whether the right interventions are being deployed.`,
    );
  }

  if (below(debriefCompletionRate, 50) && totalEpisodes > 0) {
    concerns.push(
      `Debriefing completed in only ${debriefCompletionRate}% of episodes — children and staff are not routinely debriefed following missing or absent episodes, missing opportunities for learning and emotional support.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: MissingPersonRecommendation[] = [];
  let rank = 0;

  if (below(protocolAdherenceRate, 50) && totalEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and reinforce missing person and absent without authority protocols — staff must follow established procedures for every episode to ensure children's safety and regulatory compliance. Consider mandatory refresher training for all staff.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
    });
  }

  if (below(returnInterviewRate, 50) && closedEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently establish a return interview process that ensures every child who goes missing or is absent without authority receives a timely, structured interview. Prioritise independent interviewers and ensure safeguarding concerns are systematically explored.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
    });
  }

  if (below(exploitationScreeningRate, 40) && totalRiskUpdates > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory exploitation screening for every missing or absent episode — the absence of systematic exploitation screening represents a critical gap in the home's ability to identify children at risk of criminal or sexual exploitation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (exploitation)",
    });
  }

  if (below(highRiskPoliceNotificationRate, 100) && highRiskEpisodes.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure police notification for every high and very-high risk missing episode without exception — failure to notify the police of high-risk episodes is a serious safeguarding failure that must be addressed immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
    });
  }

  if (below(riskUpdateRate, 40) && totalEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a mandatory post-episode risk assessment review process — every missing or absent episode must trigger a review of the child's risk assessment to ensure safety plans and care plans reflect current risks.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (risk management)",
    });
  }

  if (below(notificationTimelinessRate, 70) && totalEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review notification procedures to ensure agencies are alerted within required timeframes — late notifications reduce the effectiveness of search responses and may breach statutory requirements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (notifications)",
    });
  }

  if (below(contextualSafeguardingRate, 50) && totalRiskUpdates > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed contextual safeguarding in all post-episode risk assessments — understanding the environmental and social factors contributing to missing and absent episodes is essential for effective prevention.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (contextual)",
    });
  }

  if (below(independentInterviewRate, 50) && totalReturnInterviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the proportion of return interviews conducted by independent interviewers — children are more likely to disclose safeguarding concerns to someone outside the home. Commission independent return interview services where necessary.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (return interviews)",
    });
  }

  if (
    meets(protocolAdherenceRate, 50) &&
    below(protocolAdherenceRate, 80) &&
    totalEpisodes > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve protocol adherence to at least 80% — review episodes where protocols were not followed, identify barriers and training needs, and implement staff support measures to ensure consistency.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
    });
  }

  if (
    meets(returnInterviewRate, 50) &&
    below(returnInterviewRate, 80) &&
    closedEpisodes > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase return interview coverage to at least 80% — ensure that robust systems are in place to trigger and track return interviews for every child who goes missing or is absent without authority.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (return interviews)",
    });
  }

  if (
    meets(riskUpdateRate, 40) &&
    below(riskUpdateRate, 70) &&
    totalEpisodes > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve post-episode risk assessment update rate — aim for every episode to trigger a risk review within 48 hours. Implement automated prompts or checklists to ensure no episode is missed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (risk management)",
    });
  }

  if (
    meets(policeLiaisonRate, 50) &&
    below(policeLiaisonRate, 70) &&
    totalEpisodes > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen police liaison for all missing and absent episodes — consider establishing a named police liaison contact and ensure that all liaison contacts are documented with reference numbers and agreed actions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (below(policeLiaisonRate, 50) && totalEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve police liaison — fewer than half of episodes have documented police engagement. Establish protocols for routine police liaison for every episode and consider regular multi-agency strategy meetings.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (below(actionsFollowUpRate, 60) && interviewsWithActions.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a tracking system for return interview actions — agreed actions must be followed up systematically to ensure return interviews lead to tangible changes in care, safety, and prevention.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (return interviews)",
    });
  }

  if (
    (patternAnalysisRate ?? 0) >= 50 &&
    (patternAnalysisRate ?? 0) < 70 &&
    uniqueChildrenWithEpisodes > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend pattern analysis to all children with missing or absent episodes — systematic analysis of every child's pattern of missing and absence is essential for informed prevention strategies.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
    });
  }

  if ((patternAnalysisRate ?? 0) < 50 && uniqueChildrenWithEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement pattern analysis for all children with missing or absent episodes — without analysis, the home cannot identify trends, escalation, exploitation indicators, or inform prevention.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
    });
  }

  if (
    meets(exploitationScreeningRate, 40) &&
    below(exploitationScreeningRate, 70) &&
    totalRiskUpdates > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase exploitation screening to at least 70% of risk updates — any missing or absent episode could indicate exploitation, and screening must be routine to ensure no child at risk is missed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (exploitation)",
    });
  }

  if (overduePatternReviews > 0 && totalPatternAnalyses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue pattern analysis reviews — patterns and risks evolve, and analysis must be kept current to support effective prevention and safeguarding responses.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
    });
  }

  if (below(childViewsRate, 70) && totalReturnInterviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's views are captured in every return interview — the child's perspective is the most valuable source of information about why they went missing and what would help prevent recurrence.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(multiAgencyMappingRate, 50) && totalPatternAnalyses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase multi-agency mapping in pattern analyses — working with the police, social workers, and other agencies to map patterns builds a more complete picture and supports coordinated prevention.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (below(debriefCompletionRate, 70) && totalEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve debriefing completion rates following missing and absent episodes — debriefing supports staff learning, emotional processing, and identification of practice improvements.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
    });
  }

  if (below(triggersRecordedRate, 70) && totalEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure trigger factors are recorded for every missing and absent episode — understanding triggers is essential for prevention and for tailoring individual safety plans.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding (missing children)",
    });
  }

  if (below(sharedWithPARate, 70) && totalPatternAnalyses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve information sharing with placing authorities — pattern analysis and prevention strategies should be routinely shared with placing authorities to support coordinated safeguarding.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: MissingPersonInsight[] = [];

  // -- Critical insights --

  if (below(protocolAdherenceRate, 50) && totalEpisodes > 0) {
    insights.push({
      text: `Protocol adherence at only ${protocolAdherenceRate}%. When protocols are not followed, children's safety during missing and absent episodes cannot be assured. Ofsted will view systematic protocol failure as evidence that the home is not meeting its safeguarding obligations under Reg 34. Urgent staff training and management oversight is needed.`,
      severity: "critical",
    });
  }

  if (below(returnInterviewRate, 50) && closedEpisodes > 0) {
    insights.push({
      text: `Return interviews completed for only ${returnInterviewRate}% of closed episodes. Return interviews are a critical safeguarding tool — they are the primary means of identifying exploitation, abuse, and other safeguarding concerns following missing episodes. Without them, the home has a significant blind spot in its safeguarding framework.`,
      severity: "critical",
    });
  }

  if (below(exploitationScreeningRate, 40) && totalRiskUpdates > 0) {
    insights.push({
      text: `Exploitation screening at only ${exploitationScreeningRate}%. Missing and absent episodes are a key indicator of criminal and sexual exploitation. Without systematic screening, children being exploited may not be identified, leaving them at continued risk. This is a critical gap that Ofsted will scrutinise under Reg 34.`,
      severity: "critical",
    });
  }

  if (below(highRiskPoliceNotificationRate, 100) && highRiskEpisodes.length > 0) {
    insights.push({
      text: `Not all high/very-high risk episodes have police notification. Failure to notify the police of high-risk missing episodes is a serious safeguarding failure — the police are a key partner in locating and safeguarding missing children. Every high-risk episode must trigger immediate police notification.`,
      severity: "critical",
    });
  }

  if (below(riskUpdateRate, 40) && totalEpisodes > 0) {
    insights.push({
      text: `Risk assessments updated for only ${riskUpdateRate}% of episodes. Without post-episode risk review, the home's risk assessments and safety plans may be based on outdated information, potentially leaving children at unrecognised risk. Each episode should automatically trigger a risk review cycle.`,
      severity: "critical",
    });
  }

  if (ongoingEpisodes > 1) {
    insights.push({
      text: `${ongoingEpisodes} episodes currently ongoing. Multiple concurrent missing or absent episodes place significant strain on the home's safeguarding capacity and may indicate systemic issues with supervision, relationships, or the home environment. Immediate management review and escalation is needed.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(protocolAdherenceRate, 50) &&
    below(protocolAdherenceRate, 80) &&
    totalEpisodes > 0
  ) {
    insights.push({
      text: `Protocol adherence at ${protocolAdherenceRate}% — improving but not yet consistent. Each episode where protocols are not followed creates a risk that the child's safety is compromised and the home cannot evidence its safeguarding response.`,
      severity: "warning",
    });
  }

  if (
    meets(returnInterviewRate, 50) &&
    below(returnInterviewRate, 80) &&
    closedEpisodes > 0
  ) {
    insights.push({
      text: `Return interview coverage at ${returnInterviewRate}%. While the majority of children receive interviews, each missed interview is a lost opportunity to identify safeguarding concerns, exploitation risks, and inform prevention strategies.`,
      severity: "warning",
    });
  }

  if (
    meets(riskUpdateRate, 40) &&
    below(riskUpdateRate, 70) &&
    totalEpisodes > 0
  ) {
    insights.push({
      text: `Risk updates follow ${riskUpdateRate}% of episodes — some episodes do not trigger risk assessment review. Without consistent post-episode risk review, the home may not recognise escalating risk patterns or emerging exploitation indicators.`,
      severity: "warning",
    });
  }

  if (
    meets(policeLiaisonRate, 50) &&
    below(policeLiaisonRate, 70) &&
    totalEpisodes > 0
  ) {
    insights.push({
      text: `Police liaison at ${policeLiaisonRate}% — engagement is inconsistent. Effective police partnership is essential for safeguarding children who go missing, particularly for intelligence sharing, strategy discussions, and joint risk assessment.`,
      severity: "warning",
    });
  }

  if (
    (patternAnalysisRate ?? 0) >= 50 &&
    (patternAnalysisRate ?? 0) < 70 &&
    uniqueChildrenWithEpisodes > 0
  ) {
    insights.push({
      text: `Pattern analysis covers ${patternAnalysisRate}% of children with episodes. Without comprehensive pattern analysis, the home may miss escalation patterns, exploitation indicators, or trigger factors that could inform prevention.`,
      severity: "warning",
    });
  }

  if (
    meets(exploitationScreeningRate, 40) &&
    below(exploitationScreeningRate, 70) &&
    totalRiskUpdates > 0
  ) {
    insights.push({
      text: `Exploitation screening at ${exploitationScreeningRate}%. While screening is happening for some episodes, inconsistent screening means that children being exploited may not be identified through every relevant risk assessment.`,
      severity: "warning",
    });
  }

  if (repeatChildCount > 0 && totalEpisodes > 0) {
    const repeatInfo = repeatChildren
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([, count]) => `${count} episodes`)
      .join(", ");
    insights.push({
      text: `${repeatChildCount} child${repeatChildCount !== 1 ? "ren" : ""} with repeat episodes (${repeatInfo}). Repeat missing and absent patterns are a significant safeguarding concern — they may indicate exploitation, relationship breakdown, or unmet needs. Each repeat child requires a targeted prevention strategy with multi-agency input.`,
      severity: "warning",
    });
  }

  if (riskEscalated > 0 && totalRiskUpdates > 0) {
    insights.push({
      text: `Risk escalated in ${riskEscalated} assessment${riskEscalated !== 1 ? "s" : ""} following episodes. Risk escalation indicates that children's vulnerability is increasing — this requires enhanced safety planning, increased monitoring, and potentially multi-agency strategy discussions.`,
      severity: "warning",
    });
  }

  if (
    meets(independentInterviewRate, 50) &&
    below(independentInterviewRate, 70) &&
    totalReturnInterviews > 0
  ) {
    insights.push({
      text: `${independentInterviewRate}% independent return interviews. Research shows children are more likely to disclose safeguarding concerns to independent interviewers. Increasing independence of interviews improves the quality of safeguarding intelligence gathered.`,
      severity: "warning",
    });
  }

  if (below(riskAssessmentTimelinessRate, 70) && totalRiskUpdates > 0) {
    insights.push({
      text: `Only ${riskAssessmentTimelinessRate}% of risk assessments updated within 48 hours. Timely risk review is essential to ensure that safety plans reflect the current situation — delayed updates may leave children at unrecognised risk between episodes.`,
      severity: "warning",
    });
  }

  if (below(interviewTimelinessRate, 70) && totalReturnInterviews > 0) {
    insights.push({
      text: `Only ${interviewTimelinessRate}% of return interviews completed within 72 hours. Timely interviews capture more reliable information while the child's experience is fresh. Delayed interviews reduce the quality of safeguarding intelligence gathered.`,
      severity: "warning",
    });
  }

  // Analysis of pattern types
  const topPatternTypes = Object.entries(patternTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topPatternTypes.length > 0 && patternsIdentified >= 3) {
    const ptStr = topPatternTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Identified pattern types: ${ptStr}. The distribution of pattern types can indicate whether missing and absent episodes are driven by internal factors (triggers, relationships) or external factors (exploitation, peer influence). Prevention strategies should target the predominant pattern types.`,
      severity: "warning",
    });
  }

  // Analysis of episode types
  if (totalEpisodes >= 3) {
    const episodeTypeStr = [
      missingEpisodes > 0 ? `missing (${missingEpisodes})` : null,
      absentEpisodes > 0 ? `absent without authority (${absentEpisodes})` : null,
      awayEpisodes > 0 ? `away from placement (${awayEpisodes})` : null,
    ]
      .filter(Boolean)
      .join(", ");
    insights.push({
      text: `Episode type distribution: ${episodeTypeStr}. Understanding the balance between missing, absent without authority, and away from placement episodes helps the home calibrate its response — missing episodes require the most intensive safeguarding response.`,
      severity: "warning",
    });
  }

  if (overduePatternReviews > 0 && totalPatternAnalyses > 0) {
    insights.push({
      text: `${overduePatternReviews} pattern analysis review${overduePatternReviews !== 1 ? "s" : ""} overdue. Patterns evolve as children's circumstances change — reviews that are not completed on time may mean that prevention strategies are based on outdated analysis.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (missing_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding missing person and absent without authority management — protocols are consistently followed, return interviews are comprehensive, risk assessments are responsive, police liaison is strong, and pattern analysis drives effective prevention. This is compelling evidence of robust safeguarding practice under Reg 34.",
      severity: "positive",
    });
  }

  if (
    meets(protocolAdherenceRate, 95) &&
    meets(notificationTimelinessRate, 95) &&
    totalEpisodes > 0
  ) {
    insights.push({
      text: `${protocolAdherenceRate}% protocol adherence with ${notificationTimelinessRate}% timely notifications. The home's missing person response is exemplary — protocols are followed consistently and agencies are notified promptly, ensuring that safeguarding responses begin without delay.`,
      severity: "positive",
    });
  }

  if (
    meets(returnInterviewRate, 95) &&
    (returnInterviewQualityAvg ?? 0) >= 4.0 &&
    closedEpisodes > 0 &&
    totalReturnInterviews > 0
  ) {
    insights.push({
      text: `${returnInterviewRate}% return interview coverage with quality averaging ${returnInterviewQualityAvg}/5. The home excels at using return interviews to understand children's experiences, identify safeguarding concerns, and inform prevention — this is outstanding practice.`,
      severity: "positive",
    });
  }

  if (
    meets(exploitationScreeningRate, 90) &&
    meets(contextualSafeguardingRate, 90) &&
    totalRiskUpdates > 0
  ) {
    insights.push({
      text: `${exploitationScreeningRate}% exploitation screening and ${contextualSafeguardingRate}% contextual safeguarding consideration in risk updates. The home demonstrates sophisticated safeguarding analysis — systematically screening for exploitation and considering the wider context in which children go missing.`,
      severity: "positive",
    });
  }

  if (
    (patternAnalysisRate ?? 0) >= 90 &&
    (preventionRate ?? 0) >= 80 &&
    uniqueChildrenWithEpisodes > 0 &&
    totalPatternAnalyses > 0
  ) {
    insights.push({
      text: `${patternAnalysisRate}% pattern analysis coverage with ${preventionRate}% prevention effectiveness. The home demonstrates that systematic pattern analysis translates into measurable reductions in missing and absent episodes — prevention strategies are evidenced and effective.`,
      severity: "positive",
    });
  }

  if (
    meets(policeLiaisonRate, 90) &&
    meets(referenceObtainedRate, 90) &&
    totalEpisodes > 0 &&
    totalPoliceLiaisons > 0
  ) {
    insights.push({
      text: `${policeLiaisonRate}% police liaison with ${referenceObtainedRate}% reference numbers obtained. The home maintains exemplary partnership with the police — every liaison contact is documented with references and outcomes, supporting evidenced multi-agency safeguarding.`,
      severity: "positive",
    });
  }

  if (
    meets(childViewsRate, 90) &&
    meets(pushPullRate, 90) &&
    totalReturnInterviews > 0
  ) {
    insights.push({
      text: "Children's views and push/pull factors are explored in the vast majority of return interviews. The home places children's perspectives at the centre of its safeguarding response, ensuring that interventions are informed by children's own understanding of why they go missing.",
      severity: "positive",
    });
  }

  if (
    meets(safetyPlanUpdateRate, 90) &&
    meets(carePlanUpdateRate, 90) &&
    totalRiskUpdates > 0
  ) {
    insights.push({
      text: `Safety and care plans updated in ${safetyPlanUpdateRate}% and ${carePlanUpdateRate}% of risk reviews respectively. The home ensures that each missing or absent episode leads to practical changes in how the child is supported and safeguarded — plans are living documents that evolve with the child's circumstances.`,
      severity: "positive",
    });
  }

  if (riskDeescalated > riskEscalated && totalRiskUpdates > 0 && riskDeescalated > 0) {
    insights.push({
      text: `Risk de-escalated in ${riskDeescalated} assessment${riskDeescalated !== 1 ? "s" : ""} versus ${riskEscalated} escalation${riskEscalated !== 1 ? "s" : ""}. The overall trend of risk reduction suggests that the home's interventions and prevention strategies are having a positive impact on children's safety.`,
      severity: "positive",
    });
  }

  if (
    meets(actionsFollowUpRate, 90) &&
    interviewsWithActions.length > 0
  ) {
    insights.push({
      text: `${actionsFollowUpRate}% of return interview actions followed up. The home demonstrates that return interviews lead to tangible change — agreed actions are tracked and completed, ensuring that learning from each episode translates into improved care and safety.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (missing_rating === "outstanding") {
    headline =
      "Outstanding missing person and absent without authority management — protocols are consistently followed, return interviews are comprehensive, and pattern analysis drives effective prevention.";
  } else if (missing_rating === "good") {
    headline = `Good missing person and absent without authority management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (missing_rating === "adequate") {
    headline = `Adequate missing person and absent without authority management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children are safeguarded effectively.`;
  } else {
    headline = `Missing person and absent without authority management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children who go missing are protected.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    missing_rating,
    missing_score: score,
    headline,
    total_episodes: totalEpisodes,
    protocol_adherence_rate: protocolAdherenceRate,
    return_interview_rate: returnInterviewRate,
    risk_update_rate: riskUpdateRate,
    police_liaison_rate: policeLiaisonRate,
    pattern_analysis_rate: patternAnalysisRate,
    prevention_rate: preventionRate,
    notification_timeliness_rate: notificationTimelinessRate,
    return_interview_quality_avg: returnInterviewQualityAvg,
    risk_assessment_timeliness_rate: riskAssessmentTimelinessRate,
    exploitation_screening_rate: exploitationScreeningRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

// ── Risk Level Helper ───────────────────────────────────────────────────────

function riskLevelToNum(level: string): number {
  switch (level) {
    case "very_high":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}
