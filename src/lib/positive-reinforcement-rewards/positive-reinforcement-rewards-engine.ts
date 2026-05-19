// ==============================================================================
// Positive Reinforcement & Rewards Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home uses positive reinforcement strategies:
//   1. Praise & Recognition (frequency, quality, consistency)
//   2. Reward Systems (fairness, variety, child involvement)
//   3. Behavioural Impact (positive behaviour trends, de-escalation)
//   4. Staff Readiness (training, therapeutic awareness, consistency)
//
// Regulatory: CHR 2015 Reg 12 (positive behaviour), CHR 2015 Reg 13
//             (restraint & discipline), SCCIF, UNCRC Article 12,
//             Children Act 1989, NMS 3, Working Together 2023
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type PraiseType =
  | "verbal"
  | "written"
  | "public_recognition"
  | "reward_token"
  | "special_privilege"
  | "activity_reward"
  | "certificate"
  | "other";

export type RewardCategory =
  | "daily_behaviour"
  | "weekly_target"
  | "achievement"
  | "effort"
  | "kindness"
  | "responsibility"
  | "progress"
  | "other";

export type BehaviourTrend =
  | "significantly_improved"
  | "improved"
  | "stable"
  | "declined"
  | "significantly_declined";

export type ChildResponse =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "not_recorded";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const praiseTypeLabels: Record<PraiseType, string> = {
  verbal: "Verbal Praise",
  written: "Written Praise",
  public_recognition: "Public Recognition",
  reward_token: "Reward Token",
  special_privilege: "Special Privilege",
  activity_reward: "Activity Reward",
  certificate: "Certificate",
  other: "Other",
};

const rewardCategoryLabels: Record<RewardCategory, string> = {
  daily_behaviour: "Daily Behaviour",
  weekly_target: "Weekly Target",
  achievement: "Achievement",
  effort: "Effort",
  kindness: "Kindness",
  responsibility: "Responsibility",
  progress: "Progress",
  other: "Other",
};

const behaviourTrendLabels: Record<BehaviourTrend, string> = {
  significantly_improved: "Significantly Improved",
  improved: "Improved",
  stable: "Stable",
  declined: "Declined",
  significantly_declined: "Significantly Declined",
};

const childResponseLabels: Record<ChildResponse, string> = {
  very_positive: "Very Positive",
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  not_recorded: "Not Recorded",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getPraiseTypeLabel(t: PraiseType): string {
  return praiseTypeLabels[t] ?? t;
}
export function getRewardCategoryLabel(c: RewardCategory): string {
  return rewardCategoryLabels[c] ?? c;
}
export function getBehaviourTrendLabel(t: BehaviourTrend): string {
  return behaviourTrendLabels[t] ?? t;
}
export function getChildResponseLabel(r: ChildResponse): string {
  return childResponseLabels[r] ?? r;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface PraiseRecord {
  id: string;
  childId: string;
  childName: string;
  praiseDate: string;
  praiseType: PraiseType;
  givenBy: string;
  reason: string;
  childResponse: ChildResponse;
  specificAndDescriptive: boolean;
  linkedToValues: boolean;
}

export interface RewardRecord {
  id: string;
  childId: string;
  childName: string;
  rewardDate: string;
  rewardCategory: RewardCategory;
  description: string;
  childChosenReward: boolean;
  fairAndConsistent: boolean;
  linkedToBehaviourPlan: boolean;
  childResponse: ChildResponse;
}

export interface BehaviourOutcome {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  behaviourTrend: BehaviourTrend;
  positiveIncidentsCount: number;
  negativeIncidentsCount: number;
  restraintCount: number;
  deEscalationSuccessful: boolean;
  childReportedFeeling: ChildResponse;
}

export interface StaffReinforcementTraining {
  id: string;
  staffId: string;
  staffName: string;
  positiveBehaviourSupport: boolean;
  therapeuticCareApproach: boolean;
  deEscalationTechniques: boolean;
  rewardSystemDesign: boolean;
  traumaInformedPraise: boolean;
  consistencyInApproach: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface PraiseRecognitionResult {
  overallScore: number;
  totalPraise: number;
  positiveResponseRate: number;
  specificRate: number;
  linkedToValuesRate: number;
  praiseTypeVariety: number;
}

export interface RewardSystemResult {
  overallScore: number;
  totalRewards: number;
  childChosenRate: number;
  fairConsistentRate: number;
  linkedToPlanRate: number;
  positiveResponseRate: number;
}

export interface BehaviouralImpactResult {
  overallScore: number;
  totalAssessments: number;
  improvedTrendRate: number;
  deEscalationRate: number;
  lowRestraintRate: number;
  positiveChildFeelingRate: number;
}

export interface StaffReinforcementReadinessResult {
  overallScore: number;
  totalStaff: number;
  positiveBehaviourRate: number;
  therapeuticCareRate: number;
  deEscalationRate: number;
  rewardDesignRate: number;
  traumaInformedRate: number;
  consistencyRate: number;
}

export interface ChildReinforcementProfile {
  childId: string;
  childName: string;
  totalPraise: number;
  totalRewards: number;
  behaviourTrend: BehaviourTrend | "not_assessed";
  positiveResponseRate: number;
  overallScore: number;
}

export interface PositiveReinforcementRewardsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  praiseRecognition: PraiseRecognitionResult;
  rewardSystem: RewardSystemResult;
  behaviouralImpact: BehaviouralImpactResult;
  staffReinforcementReadiness: StaffReinforcementReadinessResult;
  childProfiles: ChildReinforcementProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates praise and recognition quality.
 * Empty = 0 (no praise = no evidence of positive reinforcement).
 *
 *   Positive response rate (very_positive + positive)  → 0-7
 *   Specific & descriptive rate                        → 0-6
 *   Linked to values rate                              → 0-6
 *   Praise type variety                                → 0-6
 */
export function evaluatePraiseRecognition(
  records: PraiseRecord[],
): PraiseRecognitionResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalPraise: 0,
      positiveResponseRate: 0,
      specificRate: 0,
      linkedToValuesRate: 0,
      praiseTypeVariety: 0,
    };
  }

  let score = 0;

  const positive = records.filter(
    (r) => r.childResponse === "very_positive" || r.childResponse === "positive",
  ).length;
  const positiveResponseRate = pct(positive, records.length);
  if (positiveResponseRate >= 80) score += 7;
  else if (positiveResponseRate >= 60) score += 5;
  else if (positiveResponseRate >= 40) score += 3;
  else if (positiveResponseRate > 0) score += 1;

  const specific = records.filter((r) => r.specificAndDescriptive).length;
  const specificRate = pct(specific, records.length);
  if (specificRate >= 90) score += 6;
  else if (specificRate >= 70) score += 4;
  else if (specificRate >= 50) score += 3;
  else if (specificRate > 0) score += 1;

  const linked = records.filter((r) => r.linkedToValues).length;
  const linkedToValuesRate = pct(linked, records.length);
  if (linkedToValuesRate >= 90) score += 6;
  else if (linkedToValuesRate >= 70) score += 4;
  else if (linkedToValuesRate >= 50) score += 3;
  else if (linkedToValuesRate > 0) score += 1;

  const uniqueTypes = new Set(records.map((r) => r.praiseType)).size;
  const praiseTypeVariety = uniqueTypes;
  if (uniqueTypes >= 5) score += 6;
  else if (uniqueTypes >= 4) score += 4;
  else if (uniqueTypes >= 3) score += 3;
  else if (uniqueTypes >= 2) score += 2;
  else if (uniqueTypes >= 1) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalPraise: records.length,
    positiveResponseRate,
    specificRate,
    linkedToValuesRate,
    praiseTypeVariety: uniqueTypes,
  };
}

/**
 * Evaluates reward system quality.
 * Empty = 0 (no rewards = no evidence of reward system).
 *
 *   Child chosen reward rate       → 0-7
 *   Fair & consistent rate         → 0-6
 *   Linked to behaviour plan rate  → 0-6
 *   Positive response rate         → 0-6
 */
export function evaluateRewardSystem(
  records: RewardRecord[],
): RewardSystemResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRewards: 0,
      childChosenRate: 0,
      fairConsistentRate: 0,
      linkedToPlanRate: 0,
      positiveResponseRate: 0,
    };
  }

  let score = 0;

  const childChosen = records.filter((r) => r.childChosenReward).length;
  const childChosenRate = pct(childChosen, records.length);
  if (childChosenRate >= 90) score += 7;
  else if (childChosenRate >= 70) score += 5;
  else if (childChosenRate >= 50) score += 3;
  else if (childChosenRate > 0) score += 1;

  const fair = records.filter((r) => r.fairAndConsistent).length;
  const fairConsistentRate = pct(fair, records.length);
  if (fairConsistentRate >= 90) score += 6;
  else if (fairConsistentRate >= 70) score += 4;
  else if (fairConsistentRate >= 50) score += 3;
  else if (fairConsistentRate > 0) score += 1;

  const linkedToPlan = records.filter((r) => r.linkedToBehaviourPlan).length;
  const linkedToPlanRate = pct(linkedToPlan, records.length);
  if (linkedToPlanRate >= 90) score += 6;
  else if (linkedToPlanRate >= 70) score += 4;
  else if (linkedToPlanRate >= 50) score += 3;
  else if (linkedToPlanRate > 0) score += 1;

  const positive = records.filter(
    (r) => r.childResponse === "very_positive" || r.childResponse === "positive",
  ).length;
  const positiveResponseRate = pct(positive, records.length);
  if (positiveResponseRate >= 80) score += 6;
  else if (positiveResponseRate >= 60) score += 4;
  else if (positiveResponseRate >= 40) score += 3;
  else if (positiveResponseRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRewards: records.length,
    childChosenRate,
    fairConsistentRate,
    linkedToPlanRate,
    positiveResponseRate,
  };
}

/**
 * Evaluates behavioural impact of reinforcement strategies.
 * Empty = 0 (no assessments = no evidence of impact).
 *
 *   Improved trend rate (significantly_improved + improved)  → 0-7
 *   De-escalation success rate                               → 0-6
 *   Low restraint rate (restraintCount === 0)                → 0-6
 *   Positive child feeling rate                              → 0-6
 */
export function evaluateBehaviouralImpact(
  outcomes: BehaviourOutcome[],
): BehaviouralImpactResult {
  if (outcomes.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      improvedTrendRate: 0,
      deEscalationRate: 0,
      lowRestraintRate: 0,
      positiveChildFeelingRate: 0,
    };
  }

  let score = 0;

  const improved = outcomes.filter(
    (o) =>
      o.behaviourTrend === "significantly_improved" ||
      o.behaviourTrend === "improved",
  ).length;
  const improvedTrendRate = pct(improved, outcomes.length);
  if (improvedTrendRate >= 80) score += 7;
  else if (improvedTrendRate >= 60) score += 5;
  else if (improvedTrendRate >= 40) score += 3;
  else if (improvedTrendRate > 0) score += 1;

  const deEscalation = outcomes.filter(
    (o) => o.deEscalationSuccessful,
  ).length;
  const deEscalationRate = pct(deEscalation, outcomes.length);
  if (deEscalationRate >= 90) score += 6;
  else if (deEscalationRate >= 70) score += 4;
  else if (deEscalationRate >= 50) score += 3;
  else if (deEscalationRate > 0) score += 1;

  const lowRestraint = outcomes.filter(
    (o) => o.restraintCount === 0,
  ).length;
  const lowRestraintRate = pct(lowRestraint, outcomes.length);
  if (lowRestraintRate >= 90) score += 6;
  else if (lowRestraintRate >= 70) score += 4;
  else if (lowRestraintRate >= 50) score += 3;
  else if (lowRestraintRate > 0) score += 1;

  const positiveFeelings = outcomes.filter(
    (o) =>
      o.childReportedFeeling === "very_positive" ||
      o.childReportedFeeling === "positive",
  ).length;
  const positiveChildFeelingRate = pct(positiveFeelings, outcomes.length);
  if (positiveChildFeelingRate >= 80) score += 6;
  else if (positiveChildFeelingRate >= 60) score += 4;
  else if (positiveChildFeelingRate >= 40) score += 3;
  else if (positiveChildFeelingRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalAssessments: outcomes.length,
    improvedTrendRate,
    deEscalationRate,
    lowRestraintRate,
    positiveChildFeelingRate,
  };
}

/**
 * Evaluates staff training on positive reinforcement.
 * Empty = 0 (no trained staff = no readiness).
 *
 *   Positive behaviour support rate  → 0-6
 *   Therapeutic care approach rate   → 0-5
 *   De-escalation techniques rate    → 0-5
 *   Reward system design rate        → 0-4
 *   Trauma-informed praise rate      → 0-3
 *   Consistency in approach rate     → 0-2
 */
export function evaluateStaffReinforcementReadiness(
  training: StaffReinforcementTraining[],
): StaffReinforcementReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      positiveBehaviourRate: 0,
      therapeuticCareRate: 0,
      deEscalationRate: 0,
      rewardDesignRate: 0,
      traumaInformedRate: 0,
      consistencyRate: 0,
    };
  }

  let score = 0;

  const pbs = training.filter((t) => t.positiveBehaviourSupport).length;
  const positiveBehaviourRate = pct(pbs, training.length);
  if (positiveBehaviourRate >= 90) score += 6;
  else if (positiveBehaviourRate >= 70) score += 4;
  else if (positiveBehaviourRate >= 50) score += 3;
  else if (positiveBehaviourRate > 0) score += 1;

  const therapeutic = training.filter((t) => t.therapeuticCareApproach).length;
  const therapeuticCareRate = pct(therapeutic, training.length);
  if (therapeuticCareRate >= 90) score += 5;
  else if (therapeuticCareRate >= 70) score += 3;
  else if (therapeuticCareRate >= 50) score += 2;
  else if (therapeuticCareRate > 0) score += 1;

  const deEscalation = training.filter((t) => t.deEscalationTechniques).length;
  const deEscalationRate = pct(deEscalation, training.length);
  if (deEscalationRate >= 90) score += 5;
  else if (deEscalationRate >= 70) score += 3;
  else if (deEscalationRate >= 50) score += 2;
  else if (deEscalationRate > 0) score += 1;

  const rewardDesign = training.filter((t) => t.rewardSystemDesign).length;
  const rewardDesignRate = pct(rewardDesign, training.length);
  if (rewardDesignRate >= 90) score += 4;
  else if (rewardDesignRate >= 70) score += 3;
  else if (rewardDesignRate >= 50) score += 2;
  else if (rewardDesignRate > 0) score += 1;

  const traumaInformed = training.filter((t) => t.traumaInformedPraise).length;
  const traumaInformedRate = pct(traumaInformed, training.length);
  if (traumaInformedRate >= 90) score += 3;
  else if (traumaInformedRate >= 70) score += 2;
  else if (traumaInformedRate >= 50) score += 1;

  const consistency = training.filter((t) => t.consistencyInApproach).length;
  const consistencyRate = pct(consistency, training.length);
  if (consistencyRate >= 90) score += 2;
  else if (consistencyRate >= 70) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    positiveBehaviourRate,
    therapeuticCareRate,
    deEscalationRate,
    rewardDesignRate,
    traumaInformedRate,
    consistencyRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildReinforcementProfiles(
  praise: PraiseRecord[],
  rewards: RewardRecord[],
  outcomes: BehaviourOutcome[],
): ChildReinforcementProfile[] {
  const childMap = new Map<
    string,
    {
      childId: string;
      childName: string;
      praise: PraiseRecord[];
      rewards: RewardRecord[];
      outcomes: BehaviourOutcome[];
    }
  >();

  for (const p of praise) {
    if (!childMap.has(p.childId)) {
      childMap.set(p.childId, {
        childId: p.childId,
        childName: p.childName,
        praise: [],
        rewards: [],
        outcomes: [],
      });
    }
    childMap.get(p.childId)!.praise.push(p);
  }

  for (const r of rewards) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, {
        childId: r.childId,
        childName: r.childName,
        praise: [],
        rewards: [],
        outcomes: [],
      });
    }
    childMap.get(r.childId)!.rewards.push(r);
  }

  for (const o of outcomes) {
    if (!childMap.has(o.childId)) {
      childMap.set(o.childId, {
        childId: o.childId,
        childName: o.childName,
        praise: [],
        rewards: [],
        outcomes: [],
      });
    }
    childMap.get(o.childId)!.outcomes.push(o);
  }

  return Array.from(childMap.values()).map((entry) => {
    let score = 0;

    // Praise received (0-3)
    if (entry.praise.length >= 5) score += 3;
    else if (entry.praise.length >= 3) score += 2;
    else if (entry.praise.length >= 1) score += 1;

    // Positive response to praise/rewards (0-3)
    const allInteractions = [
      ...entry.praise.map((p) => p.childResponse),
      ...entry.rewards.map((r) => r.childResponse),
    ];
    const positiveInteractions = allInteractions.filter(
      (r) => r === "very_positive" || r === "positive",
    ).length;
    const interactionRate = pct(positiveInteractions, allInteractions.length);
    if (interactionRate >= 80) score += 3;
    else if (interactionRate >= 50) score += 2;
    else if (interactionRate > 0) score += 1;

    // Behaviour trend (0-2)
    const latestOutcome =
      entry.outcomes.length > 0
        ? entry.outcomes[entry.outcomes.length - 1]
        : null;
    const trend = latestOutcome?.behaviourTrend ?? "not_assessed";
    if (
      trend === "significantly_improved" ||
      trend === "improved"
    ) {
      score += 2;
    } else if (trend === "stable") {
      score += 1;
    }

    // Rewards received (0-2)
    if (entry.rewards.length >= 3) score += 2;
    else if (entry.rewards.length >= 1) score += 1;

    return {
      childId: entry.childId,
      childName: entry.childName,
      totalPraise: entry.praise.length,
      totalRewards: entry.rewards.length,
      behaviourTrend: trend,
      positiveResponseRate: interactionRate,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generatePositiveReinforcementRewardsIntelligence(
  praise: PraiseRecord[],
  rewards: RewardRecord[],
  outcomes: BehaviourOutcome[],
  training: StaffReinforcementTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PositiveReinforcementRewardsIntelligence {
  const praiseRecognition = evaluatePraiseRecognition(praise);
  const rewardSystem = evaluateRewardSystem(rewards);
  const behaviouralImpact = evaluateBehaviouralImpact(outcomes);
  const staffReinforcementReadiness =
    evaluateStaffReinforcementReadiness(training);

  const rawScore =
    praiseRecognition.overallScore +
    rewardSystem.overallScore +
    behaviouralImpact.overallScore +
    staffReinforcementReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildReinforcementProfiles(
    praise,
    rewards,
    outcomes,
  );

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (praiseRecognition.positiveResponseRate >= 80 && praise.length > 0) {
    strengths.push(
      "Children responding very positively to praise and recognition strategies",
    );
  }
  if (praiseRecognition.specificRate >= 90 && praise.length > 0) {
    strengths.push(
      "Praise consistently specific and descriptive — high quality reinforcement",
    );
  }
  if (rewardSystem.childChosenRate >= 90 && rewards.length > 0) {
    strengths.push(
      "Reward system child-led — children choosing their own rewards",
    );
  }
  if (rewardSystem.fairConsistentRate >= 90 && rewards.length > 0) {
    strengths.push(
      "Reward system applied fairly and consistently across all children",
    );
  }
  if (behaviouralImpact.improvedTrendRate >= 80 && outcomes.length > 0) {
    strengths.push(
      "Strong evidence of improved behaviour trends linked to positive reinforcement",
    );
  }
  if (behaviouralImpact.lowRestraintRate >= 90 && outcomes.length > 0) {
    strengths.push(
      "Very low restraint rate — positive approaches reducing need for physical intervention",
    );
  }
  if (behaviouralImpact.deEscalationRate >= 90 && outcomes.length > 0) {
    strengths.push(
      "De-escalation strategies highly effective across the team",
    );
  }
  if (
    staffReinforcementReadiness.positiveBehaviourRate >= 90 &&
    training.length > 0
  ) {
    strengths.push(
      "Staff team fully trained in positive behaviour support",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (praiseRecognition.specificRate < 70 && praise.length > 0) {
    areasForImprovement.push(
      "Praise not consistently specific and descriptive — risk of generic reinforcement",
    );
  }
  if (praiseRecognition.linkedToValuesRate < 70 && praise.length > 0) {
    areasForImprovement.push(
      "Praise not consistently linked to home values and expectations",
    );
  }
  if (rewardSystem.childChosenRate < 70 && rewards.length > 0) {
    areasForImprovement.push(
      "Children not consistently involved in choosing their rewards",
    );
  }
  if (rewardSystem.linkedToPlanRate < 70 && rewards.length > 0) {
    areasForImprovement.push(
      "Rewards not consistently linked to individual behaviour plans",
    );
  }
  if (behaviouralImpact.deEscalationRate < 70 && outcomes.length > 0) {
    areasForImprovement.push(
      "De-escalation success rate below expected standard",
    );
  }
  if (
    staffReinforcementReadiness.traumaInformedRate < 70 &&
    training.length > 0
  ) {
    areasForImprovement.push(
      "Staff awareness of trauma-informed praise needs strengthening",
    );
  }
  if (
    behaviouralImpact.positiveChildFeelingRate < 50 &&
    outcomes.length > 0
  ) {
    areasForImprovement.push(
      "Children not reporting positive feelings about behaviour management approach",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (praise.length === 0) {
    actions.push(
      "URGENT: No praise or recognition records — implement positive reinforcement tracking immediately",
    );
  }
  if (rewards.length === 0) {
    actions.push(
      "URGENT: No reward system records — develop and implement reward strategy",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff training records for positive reinforcement — deliver comprehensive training",
    );
  }
  if (outcomes.length === 0) {
    actions.push(
      "No behavioural outcome assessments — begin tracking impact of reinforcement strategies",
    );
  }
  const declining = outcomes.filter(
    (o) =>
      o.behaviourTrend === "declined" ||
      o.behaviourTrend === "significantly_declined",
  );
  if (declining.length > 0) {
    actions.push(
      `${declining.length} child(ren) showing declining behaviour trends — review and adapt reinforcement strategies`,
    );
  }
  const highRestraint = outcomes.filter((o) => o.restraintCount > 0);
  if (highRestraint.length > 0) {
    actions.push(
      `${highRestraint.length} assessment(s) recording restraint use — review alternatives and de-escalation approach`,
    );
  }
  if (
    rewardSystem.fairConsistentRate < 50 &&
    rewards.length > 0
  ) {
    actions.push(
      "Reward system not being applied fairly — review for consistency and equity",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 12 — The positive relationships standard",
    "CHR 2015 Reg 13 — The protection of children standard (behaviour management)",
    "SCCIF — Social Care Common Inspection Framework (behaviour & attitudes)",
    "UNCRC Article 12 — Right of the child to express views",
    "Children Act 1989 — Welfare of the child",
    "NMS 3 — National Minimum Standards (positive behaviour)",
    "Working Together 2023 — Multi-agency safeguarding",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    praiseRecognition,
    rewardSystem,
    behaviouralImpact,
    staffReinforcementReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
