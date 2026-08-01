// ══════════════════════════════════════════════════════════════════════════════
// Cara — Return Home Interview Quality Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses the quality and timeliness of Return Home Interviews (RHIs)
// conducted after children go missing from care, along with strategy meeting
// responses and prevention measures.
//
// Maps to: CHR 2015 Reg 12 (safeguarding), CHR 2015 Reg 34 (notification of
// missing), SCCIF, NMS 5, Working Together 2023, UNCRC Article 19,
// Statutory guidance on children who go missing (2022)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type MissingEpisodeCategory =
  | "absent_without_permission"
  | "missing"
  | "runaway"
  | "absconder"
  | "failed_to_return";

export type RHITimeliness =
  | "within_72h"
  | "late"
  | "not_completed"
  | "declined";

export type InterviewQuality =
  | "thorough"
  | "adequate"
  | "superficial"
  | "not_completed";

export type PushPullFactor =
  | "peer_influence"
  | "family_contact"
  | "exploitation_concern"
  | "substance_misuse"
  | "placement_unhappy"
  | "mental_health"
  | "relationship_conflict"
  | "thrill_seeking"
  | "unknown";

export type SafetyPlanStatus =
  | "created"
  | "updated"
  | "existing_adequate"
  | "not_created";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface MissingEpisode {
  id: string;
  childId: string;
  childName: string;
  category: MissingEpisodeCategory;
  dateReported: string;
  dateReturned: string | null;
  duration: number | null; // hours
  policeNotified: boolean;
  riskAssessmentUpdated: boolean;
  socialWorkerNotified: boolean;
}

export interface ReturnHomeInterview {
  id: string;
  episodeId: string;
  childId: string;
  childName: string;
  interviewDate: string;
  interviewedBy: string;
  timeliness: RHITimeliness;
  quality: InterviewQuality;
  childViewsSought: boolean;
  pushFactorsIdentified: PushPullFactor[];
  pullFactorsIdentified: PushPullFactor[];
  safetyPlanStatus: SafetyPlanStatus;
  referralsMade: number;
  informationSharedWithPolice: boolean;
  independentInterviewer: boolean;
}

export interface StrategyMeeting {
  id: string;
  childId: string;
  childName: string;
  meetingDate: string;
  attendees: number;
  multiAgencyAttendance: boolean;
  actionPlanCreated: boolean;
  actionPlanReviewed: boolean | null;
  triggerPatternDiscussed: boolean;
}

export interface PreventionMeasure {
  id: string;
  childId: string;
  childName: string;
  measureDate: string;
  measureDescription: string;
  implementedBy: string;
  effective: boolean | null;
  reviewedDate: string | null;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface InterviewComplianceResult {
  overallScore: number; // 0-25
  totalEpisodes: number;
  rhiCompletedRate: number; // %
  within72hRate: number; // %
  declinedCount: number;
  independentRate: number; // %
  qualityDistribution: Record<InterviewQuality, number>;
}

export interface InterviewDepthResult {
  overallScore: number; // 0-25
  totalInterviews: number;
  childViewsRate: number; // %
  pushFactorsRate: number; // %
  pullFactorsRate: number; // %
  safetyPlanCreatedRate: number; // %
  referralsMadeCount: number;
  policeInfoSharedRate: number; // %
}

export interface StrategyResponseResult {
  overallScore: number; // 0-25
  totalMeetings: number;
  multiAgencyRate: number; // %
  actionPlanRate: number; // %
  actionReviewedRate: number; // %
  triggerPatternRate: number; // %
  averageAttendees: number;
}

export interface PreventionEffectivenessResult {
  overallScore: number; // 0-25
  totalMeasures: number;
  effectiveRate: number; // %
  reviewedRate: number; // %
  uniqueChildren: number;
  // Note: frequencyBonus is internal to scoring
}

export interface ChildMissingProfile {
  childId: string;
  childName: string;
  episodeCount: number;
  rhiCompletedRate: number; // %
  averageDuration: number | null; // hours
  commonFactors: PushPullFactor[];
  hasSafetyPlan: boolean;
  overallScore: number; // 0-10
}

export interface ReturnHomeInterviewQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100
  rating: Rating;
  interviewCompliance: InterviewComplianceResult;
  interviewDepth: InterviewDepthResult;
  strategyResponse: StrategyResponseResult;
  preventionEffectiveness: PreventionEffectivenessResult;
  childProfiles: ChildMissingProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Calculate percentage, returning 0 if denominator is 0. */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Map overall score (0-100) to Ofsted-style rating. */
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getMissingEpisodeCategoryLabel(category: MissingEpisodeCategory): string {
  const labels: Record<MissingEpisodeCategory, string> = {
    absent_without_permission: "Absent Without Permission",
    missing: "Missing",
    runaway: "Runaway",
    absconder: "Absconder",
    failed_to_return: "Failed to Return",
  };
  return labels[category] || category;
}

export function getRHITimelinessLabel(timeliness: RHITimeliness): string {
  const labels: Record<RHITimeliness, string> = {
    within_72h: "Within 72 Hours",
    late: "Late",
    not_completed: "Not Completed",
    declined: "Declined",
  };
  return labels[timeliness] || timeliness;
}

export function getInterviewQualityLabel(quality: InterviewQuality): string {
  const labels: Record<InterviewQuality, string> = {
    thorough: "Thorough",
    adequate: "Adequate",
    superficial: "Superficial",
    not_completed: "Not Completed",
  };
  return labels[quality] || quality;
}

export function getPushPullFactorLabel(factor: PushPullFactor): string {
  const labels: Record<PushPullFactor, string> = {
    peer_influence: "Peer Influence",
    family_contact: "Family Contact",
    exploitation_concern: "Exploitation Concern",
    substance_misuse: "Substance Misuse",
    placement_unhappy: "Unhappy with Placement",
    mental_health: "Mental Health",
    relationship_conflict: "Relationship Conflict",
    thrill_seeking: "Thrill Seeking",
    unknown: "Unknown",
  };
  return labels[factor] || factor;
}

export function getSafetyPlanStatusLabel(status: SafetyPlanStatus): string {
  const labels: Record<SafetyPlanStatus, string> = {
    created: "Created",
    updated: "Updated",
    existing_adequate: "Existing Adequate",
    not_created: "Not Created",
  };
  return labels[status] || status;
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] || rating;
}

// ── Evaluators ──────────────────────────────────────────────────────────────

/**
 * Evaluate interview compliance (0-25).
 *
 * Empty episodes = 25 (no missing episodes is excellent).
 * Score from: RHI completed rate (0-8), within 72h rate (0-6),
 * independent interviewer (0-5), quality average (0-6).
 */
export function evaluateInterviewCompliance(
  episodes: MissingEpisode[],
  interviews: ReturnHomeInterview[],
): InterviewComplianceResult {
  const qualityDistribution: Record<InterviewQuality, number> = {
    thorough: 0,
    adequate: 0,
    superficial: 0,
    not_completed: 0,
  };

  if (episodes.length === 0) {
    return {
      overallScore: 25,
      totalEpisodes: 0,
      rhiCompletedRate: 0,
      within72hRate: 0,
      declinedCount: 0,
      independentRate: 0,
      qualityDistribution,
    };
  }

  // Match interviews to episodes
  const episodeIds = new Set(episodes.map((e) => e.id));
  const relevantInterviews = interviews.filter((i) => episodeIds.has(i.episodeId));

  // RHI completed = not "not_completed"
  const completed = relevantInterviews.filter(
    (i) => i.timeliness !== "not_completed",
  );
  const within72h = relevantInterviews.filter(
    (i) => i.timeliness === "within_72h",
  );
  const declined = relevantInterviews.filter(
    (i) => i.timeliness === "declined",
  );
  const independent = relevantInterviews.filter(
    (i) => i.independentInterviewer,
  );

  // Quality distribution
  for (const interview of relevantInterviews) {
    qualityDistribution[interview.quality]++;
  }

  const rhiCompletedRate = pct(completed.length, episodes.length);
  const within72hRate = pct(within72h.length, episodes.length);
  const independentRate = pct(independent.length, relevantInterviews.length);

  // Scoring
  // RHI completed rate: 0-8
  const completedScore = Math.round((rhiCompletedRate / 100) * 8);
  // Within 72h rate: 0-6
  const timelyScore = Math.round((within72hRate / 100) * 6);
  // Independent interviewer: 0-5
  const independentScore = relevantInterviews.length > 0
    ? Math.round((independentRate / 100) * 5)
    : null;
  // Quality average: thorough=3, adequate=2, superficial=1, not_completed=0 -> average -> scale 0-6
  let qualityScore = 0;
  if (relevantInterviews.length > 0) {
    const qualityMap: Record<InterviewQuality, number> = {
      thorough: 3,
      adequate: 2,
      superficial: 1,
      not_completed: 0,
    };
    let totalQuality = 0;
    for (const interview of relevantInterviews) {
      totalQuality += qualityMap[interview.quality];
    }
    const avgQuality = totalQuality / relevantInterviews.length;
    qualityScore = Math.round((avgQuality / 3) * 6);
  }

  const score = Math.min(25, Math.max(0, completedScore + timelyScore + (independentScore ?? 0) + qualityScore));

  return {
    overallScore: score,
    totalEpisodes: episodes.length,
    rhiCompletedRate,
    within72hRate,
    declinedCount: declined.length,
    independentRate,
    qualityDistribution,
  };
}

/**
 * Evaluate interview depth (0-25).
 *
 * Empty = 25 if no episodes. Score from: child views (0-7),
 * push/pull factors (0-5), safety plan (0-5), police info (0-4),
 * referrals (0-4).
 */
export function evaluateInterviewDepth(
  interviews: ReturnHomeInterview[],
  hasEpisodes: boolean,
): InterviewDepthResult {
  if (interviews.length === 0) {
    return {
      overallScore: hasEpisodes ? 0 : 25,
      totalInterviews: 0,
      childViewsRate: 0,
      pushFactorsRate: 0,
      pullFactorsRate: 0,
      safetyPlanCreatedRate: 0,
      referralsMadeCount: 0,
      policeInfoSharedRate: 0,
    };
  }

  const childViewsSought = interviews.filter((i) => i.childViewsSought);
  const withPushFactors = interviews.filter(
    (i) => i.pushFactorsIdentified.length > 0,
  );
  const withPullFactors = interviews.filter(
    (i) => i.pullFactorsIdentified.length > 0,
  );
  const safetyPlanCreated = interviews.filter(
    (i) =>
      i.safetyPlanStatus === "created" ||
      i.safetyPlanStatus === "updated" ||
      i.safetyPlanStatus === "existing_adequate",
  );
  const policeInfoShared = interviews.filter(
    (i) => i.informationSharedWithPolice,
  );

  let totalReferrals = 0;
  for (const interview of interviews) {
    totalReferrals += interview.referralsMade;
  }

  const childViewsRate = pct(childViewsSought.length, interviews.length);
  const pushFactorsRate = pct(withPushFactors.length, interviews.length);
  const pullFactorsRate = pct(withPullFactors.length, interviews.length);
  const safetyPlanCreatedRate = pct(safetyPlanCreated.length, interviews.length);
  const policeInfoSharedRate = pct(policeInfoShared.length, interviews.length);

  // Scoring
  // Child views: 0-7
  const childViewsScore = Math.round((childViewsRate / 100) * 7);
  // Push/pull factors: 0-5 (combined: average of push and pull)
  const factorsAvg = (pushFactorsRate + pullFactorsRate) / 2;
  const factorsScore = Math.round((factorsAvg / 100) * 5);
  // Safety plan: 0-5
  const safetyPlanScore = Math.round((safetyPlanCreatedRate / 100) * 5);
  // Police info shared: 0-4
  const policeScore = Math.round((policeInfoSharedRate / 100) * 4);
  // Referrals made: 0-4 (bonus: any referrals made scores proportionally)
  const referralsScore = totalReferrals > 0
    ? Math.min(4, Math.round((totalReferrals / interviews.length) * 2))
    : null;

  const score = Math.min(
    25,
    Math.max(0, childViewsScore + factorsScore + safetyPlanScore + policeScore + (referralsScore ?? 0)),
  );

  return {
    overallScore: score,
    totalInterviews: interviews.length,
    childViewsRate,
    pushFactorsRate,
    pullFactorsRate,
    safetyPlanCreatedRate,
    referralsMadeCount: totalReferrals,
    policeInfoSharedRate,
  };
}

/**
 * Evaluate strategy response (0-25).
 *
 * Empty = 25 (no missing episodes requiring meetings is fine).
 * Score from: multi-agency (0-7), action plan (0-6), trigger pattern (0-5),
 * action reviewed (0-4), average attendees bonus (0-3).
 */
export function evaluateStrategyResponse(
  meetings: StrategyMeeting[],
): StrategyResponseResult {
  if (meetings.length === 0) {
    return {
      overallScore: 25,
      totalMeetings: 0,
      multiAgencyRate: 0,
      actionPlanRate: 0,
      actionReviewedRate: 0,
      triggerPatternRate: 0,
      averageAttendees: 0,
    };
  }

  const multiAgency = meetings.filter((m) => m.multiAgencyAttendance);
  const actionPlan = meetings.filter((m) => m.actionPlanCreated);
  const reviewable = meetings.filter((m) => m.actionPlanReviewed !== null);
  const actionReviewed = reviewable.filter((m) => m.actionPlanReviewed === true);
  const triggerPattern = meetings.filter((m) => m.triggerPatternDiscussed);

  let totalAttendees = 0;
  for (const m of meetings) {
    totalAttendees += m.attendees;
  }

  const multiAgencyRate = pct(multiAgency.length, meetings.length);
  const actionPlanRate = pct(actionPlan.length, meetings.length);
  const actionReviewedRate = pct(actionReviewed.length, reviewable.length);
  const triggerPatternRate = pct(triggerPattern.length, meetings.length);
  const averageAttendees =
    Math.round((totalAttendees / meetings.length) * 10) / 10;

  // Scoring
  // Multi-agency: 0-7
  const multiAgencyScore = Math.round((multiAgencyRate / 100) * 7);
  // Action plan: 0-6
  const actionPlanScore = Math.round((actionPlanRate / 100) * 6);
  // Trigger pattern: 0-5
  const triggerPatternScore = Math.round((triggerPatternRate / 100) * 5);
  // Action reviewed: 0-4
  const actionReviewedScore = reviewable.length > 0
    ? Math.round((actionReviewedRate / 100) * 4)
    : null;
  // Average attendees bonus: 0-3 (>=5 attendees = 3, 3-4 = 2, 2 = 1, <2 = 0)
  let attendeesBonus = 0;
  if (averageAttendees >= 5) attendeesBonus = 3;
  else if (averageAttendees >= 3) attendeesBonus = 2;
  else if (averageAttendees >= 2) attendeesBonus = 1;

  const score = Math.min(
    25,
    Math.max(0, multiAgencyScore + actionPlanScore + triggerPatternScore + (actionReviewedScore ?? 0) + attendeesBonus),
  );

  return {
    overallScore: score,
    totalMeetings: meetings.length,
    multiAgencyRate,
    actionPlanRate,
    actionReviewedRate,
    triggerPatternRate,
    averageAttendees,
  };
}

/**
 * Evaluate prevention effectiveness (0-25).
 *
 * Empty = 25 if no episodes (nothing to prevent), 0 if episodes but no measures.
 * Score from: effective rate (0-8), reviewed rate (0-7), coverage (0-5),
 * frequency bonus (0-5).
 */
export function evaluatePreventionEffectiveness(
  measures: PreventionMeasure[],
  hasEpisodes: boolean,
): PreventionEffectivenessResult {
  if (measures.length === 0) {
    return {
      overallScore: hasEpisodes ? 0 : 25,
      totalMeasures: 0,
      effectiveRate: 0,
      reviewedRate: 0,
      uniqueChildren: 0,
    };
  }

  const withEffectiveness = measures.filter((m) => m.effective !== null);
  const effective = withEffectiveness.filter((m) => m.effective === true);
  const reviewed = measures.filter((m) => m.reviewedDate !== null);
  const uniqueChildIds = new Set(measures.map((m) => m.childId));

  const effectiveRate = pct(effective.length, withEffectiveness.length);
  const reviewedRate = pct(reviewed.length, measures.length);

  // Scoring
  // Effective rate: 0-8
  const effectiveScore = withEffectiveness.length > 0
    ? Math.round((effectiveRate / 100) * 8)
    : null;
  // Reviewed rate: 0-7
  const reviewedScore = Math.round((reviewedRate / 100) * 7);
  // Coverage: 0-5 (based on unique children covered)
  const coverageScore = Math.min(5, uniqueChildIds.size);
  // Frequency bonus: 0-5 (more measures = better prevention effort)
  const frequencyBonus = Math.min(5, Math.round(measures.length / 2));

  const score = Math.min(
    25,
    Math.max(0, (effectiveScore ?? 0) + reviewedScore + coverageScore + frequencyBonus),
  );

  return {
    overallScore: score,
    totalMeasures: measures.length,
    effectiveRate,
    reviewedRate,
    uniqueChildren: uniqueChildIds.size,
  };
}

// ── Build Child Profiles ────────────────────────────────────────────────────

export function buildChildMissingProfiles(
  episodes: MissingEpisode[],
  interviews: ReturnHomeInterview[],
  childIds: string[],
  childNames: Record<string, string>,
): ChildMissingProfile[] {
  return childIds.map((childId) => {
    const childName = childNames[childId] || childId;

    const childEpisodes = episodes.filter((e) => e.childId === childId);
    const childInterviews = interviews.filter((i) => i.childId === childId);

    const episodeCount = childEpisodes.length;

    // RHI completed rate
    const completedInterviews = childInterviews.filter(
      (i) => i.timeliness !== "not_completed",
    );
    const rhiCompletedRate = pct(completedInterviews.length, episodeCount);

    // Average duration
    const durations = childEpisodes
      .map((e) => e.duration)
      .filter((d): d is number => d !== null);
    const averageDuration =
      durations.length > 0
        ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
        : null;

    // Common factors — collect all push and pull, find most frequent
    const allFactors: PushPullFactor[] = [];
    for (const interview of childInterviews) {
      allFactors.push(...interview.pushFactorsIdentified);
      allFactors.push(...interview.pullFactorsIdentified);
    }
    const factorCounts = new Map<PushPullFactor, number>();
    for (const f of allFactors) {
      factorCounts.set(f, (factorCounts.get(f) || 0) + 1);
    }
    const commonFactors = Array.from(factorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([factor]) => factor);

    // Has safety plan
    const hasSafetyPlan = childInterviews.some(
      (i) =>
        i.safetyPlanStatus === "created" ||
        i.safetyPlanStatus === "updated" ||
        i.safetyPlanStatus === "existing_adequate",
    );

    // Score (0-10)
    let score = 5; // baseline for children with no episodes
    if (episodeCount > 0) {
      // RHI completion contributes 0-4
      const rhiScore = Math.round((rhiCompletedRate / 100) * 4);
      // Safety plan contributes 0-3
      const safetyScore = hasSafetyPlan ? 3 : 0;
      // Factors identified contributes 0-3
      const factorsScore: number | null = commonFactors.length > 0 ? Math.min(3, commonFactors.length) : null;
      score = Math.min(10, rhiScore + safetyScore + (factorsScore ?? 0));
    }

    return {
      childId,
      childName,
      episodeCount,
      rhiCompletedRate,
      averageDuration,
      commonFactors,
      hasSafetyPlan,
      overallScore: Math.min(10, Math.max(0, score)),
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateReturnHomeInterviewQualityIntelligence(
  episodes: MissingEpisode[],
  interviews: ReturnHomeInterview[],
  meetings: StrategyMeeting[],
  measures: PreventionMeasure[],
  childIds: string[],
  childNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ReturnHomeInterviewQualityIntelligence {
  const hasEpisodes = episodes.length > 0;

  const interviewCompliance = evaluateInterviewCompliance(episodes, interviews);
  const interviewDepth = evaluateInterviewDepth(interviews, hasEpisodes);
  const strategyResponse = evaluateStrategyResponse(meetings);
  const preventionEffectiveness = evaluatePreventionEffectiveness(measures, hasEpisodes);

  const childProfiles = buildChildMissingProfiles(
    episodes,
    interviews,
    childIds,
    childNames,
  );

  // Overall score: sum of 4 evaluators (each 0-25) = 0-100
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      interviewCompliance.overallScore +
        interviewDepth.overallScore +
        strategyResponse.overallScore +
        preventionEffectiveness.overallScore,
    ),
  );

  const rating = getRating(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];

  if (episodes.length === 0) {
    strengths.push(
      "No missing episodes recorded during the period, indicating effective preventive care",
    );
  }
  if (interviewCompliance.overallScore >= 20 && episodes.length > 0) {
    strengths.push(
      "Strong RHI compliance with high completion rates and timely interviews",
    );
  }
  if (interviewDepth.overallScore >= 20 && interviews.length > 0) {
    strengths.push(
      "RHIs demonstrate thorough exploration of push and pull factors with children's views actively sought",
    );
  }
  if (strategyResponse.overallScore >= 20 && meetings.length > 0) {
    strengths.push(
      "Strategy meetings are well-attended with multi-agency participation and action plans created",
    );
  }
  if (preventionEffectiveness.overallScore >= 20 && measures.length > 0) {
    strengths.push(
      "Prevention measures are effective and regularly reviewed",
    );
  }
  if (interviewCompliance.rhiCompletedRate === 100 && episodes.length > 0) {
    strengths.push(
      "All missing episodes have had RHIs completed, demonstrating consistent practice",
    );
  }
  if (interviewCompliance.within72hRate === 100 && episodes.length > 0) {
    strengths.push(
      "All RHIs completed within the statutory 72-hour timeframe",
    );
  }
  if (interviewCompliance.independentRate === 100 && interviews.length > 0) {
    strengths.push(
      "All interviews conducted by independent interviewers, ensuring impartiality",
    );
  }
  if (interviewDepth.childViewsRate === 100 && interviews.length > 0) {
    strengths.push(
      "Children's views are consistently sought in all return home interviews",
    );
  }
  if (interviewDepth.safetyPlanCreatedRate === 100 && interviews.length > 0) {
    strengths.push(
      "Safety plans are in place for all children following missing episodes",
    );
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];

  if (interviewCompliance.rhiCompletedRate < 80 && episodes.length > 0) {
    areasForImprovement.push(
      `Only ${interviewCompliance.rhiCompletedRate}% of missing episodes have completed RHIs — all episodes require an interview`,
    );
  }
  if (interviewCompliance.within72hRate < 80 && episodes.length > 0) {
    areasForImprovement.push(
      `Only ${interviewCompliance.within72hRate}% of RHIs completed within 72 hours — statutory guidance requires interviews within this timeframe`,
    );
  }
  if (interviewCompliance.independentRate < 80 && interviews.length > 0) {
    areasForImprovement.push(
      `Only ${interviewCompliance.independentRate}% of interviews conducted by independent interviewers`,
    );
  }
  if (interviewDepth.childViewsRate < 80 && interviews.length > 0) {
    areasForImprovement.push(
      `Only ${interviewDepth.childViewsRate}% of interviews sought children's views — the child's voice must be central`,
    );
  }
  if (interviewDepth.safetyPlanCreatedRate < 80 && interviews.length > 0) {
    areasForImprovement.push(
      `Only ${interviewDepth.safetyPlanCreatedRate}% of interviews resulted in a safety plan — all children need a plan to reduce risk`,
    );
  }
  if (interviewDepth.pushFactorsRate < 60 && interviews.length > 0) {
    areasForImprovement.push(
      `Push factors identified in only ${interviewDepth.pushFactorsRate}% of interviews — understanding why children leave is essential`,
    );
  }
  if (interviewDepth.pullFactorsRate < 60 && interviews.length > 0) {
    areasForImprovement.push(
      `Pull factors identified in only ${interviewDepth.pullFactorsRate}% of interviews — understanding what draws children away needs improvement`,
    );
  }
  if (strategyResponse.multiAgencyRate < 80 && meetings.length > 0) {
    areasForImprovement.push(
      `Only ${strategyResponse.multiAgencyRate}% of strategy meetings had multi-agency attendance`,
    );
  }
  if (strategyResponse.actionPlanRate < 80 && meetings.length > 0) {
    areasForImprovement.push(
      `Only ${strategyResponse.actionPlanRate}% of strategy meetings resulted in action plans`,
    );
  }
  if (preventionEffectiveness.totalMeasures === 0 && episodes.length > 0) {
    areasForImprovement.push(
      "No prevention measures recorded despite missing episodes — proactive prevention work is essential",
    );
  }
  if (preventionEffectiveness.effectiveRate < 60 && measures.length > 0) {
    areasForImprovement.push(
      `Only ${preventionEffectiveness.effectiveRate}% of prevention measures assessed as effective`,
    );
  }
  if (interviewCompliance.declinedCount > 0) {
    areasForImprovement.push(
      `${interviewCompliance.declinedCount} RHI(s) declined by children — consider creative engagement approaches`,
    );
  }

  // ── Actions ──
  const actions: string[] = [];

  if (interviewCompliance.rhiCompletedRate < 100 && episodes.length > 0) {
    actions.push(
      "Ensure all missing episodes result in a return home interview, following up where children decline",
    );
  }
  if (interviewCompliance.within72hRate < 100 && episodes.length > 0) {
    actions.push(
      "Implement tracking to ensure all RHIs are completed within 72 hours of the child's return",
    );
  }
  if (interviewCompliance.independentRate < 100 && interviews.length > 0) {
    actions.push(
      "Arrange independent interviewers for all return home interviews to ensure impartiality",
    );
  }
  if (interviewDepth.childViewsRate < 100 && interviews.length > 0) {
    actions.push(
      "Ensure children's views are actively sought in every return home interview using age-appropriate methods",
    );
  }
  if (interviewDepth.safetyPlanCreatedRate < 100 && interviews.length > 0) {
    actions.push(
      "Create or update safety plans for all children following missing episodes",
    );
  }
  if (interviewDepth.pushFactorsRate < 80 && interviews.length > 0) {
    actions.push(
      "Train staff to explore push factors (reasons for leaving) more thoroughly during RHIs",
    );
  }
  if (interviewDepth.pullFactorsRate < 80 && interviews.length > 0) {
    actions.push(
      "Train staff to explore pull factors (what draws children away) more thoroughly during RHIs",
    );
  }
  if (strategyResponse.multiAgencyRate < 100 && meetings.length > 0) {
    actions.push(
      "Ensure multi-agency attendance at all strategy meetings, including police, social care and health",
    );
  }
  if (strategyResponse.actionPlanRate < 100 && meetings.length > 0) {
    actions.push(
      "Ensure all strategy meetings produce clear, time-bound action plans",
    );
  }
  if (preventionEffectiveness.totalMeasures === 0 && episodes.length > 0) {
    actions.push(
      "Develop and implement prevention measures for children with missing episodes",
    );
  }
  if (preventionEffectiveness.reviewedRate < 80 && measures.length > 0) {
    actions.push(
      "Review all prevention measures to assess effectiveness and update where needed",
    );
  }
  if (interviewCompliance.declinedCount > 0) {
    actions.push(
      "Develop creative engagement strategies for children who decline RHIs, including preferred adults and informal settings",
    );
  }

  const regulatoryLinks = [
    "CHR 2015 Reg 12 — The protection of children standard: safeguarding arrangements for missing children",
    "CHR 2015 Reg 34 — Notification of events: duty to notify when a child goes missing",
    "SCCIF — Social Care Common Inspection Framework: safety and protection of children",
    "NMS 5 — National Minimum Standards: enjoying and achieving, staying safe",
    "Working Together 2023 — Inter-agency working to safeguard and promote welfare of children",
    "UNCRC Article 19 — Protection from all forms of violence, abuse, neglect and exploitation",
    "Statutory guidance on children who go missing from home or care (2022) — Return home interview requirements",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    interviewCompliance,
    interviewDepth,
    strategyResponse,
    preventionEffectiveness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
