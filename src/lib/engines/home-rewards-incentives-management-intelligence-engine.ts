import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME REWARDS & INCENTIVES MANAGEMENT INTELLIGENCE ENGINE
// Monitors reward scheme fairness, positive reinforcement consistency,
// incentive programme effectiveness, child participation in reward design,
// and equity across children in the home.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Positive relationships), Reg 7 (Protection of children),
// Reg 12 (Health and wellbeing).
// SCCIF: "Children's experiences and progress" — positive reinforcement
// used effectively to support children's self-esteem and development.
// Store keys: rewardSchemeRecords, reinforcementRecords,
//             incentiveProgrammeRecords, childParticipationRecords,
//             equityReviewRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RewardSchemeRecordInput {
  id: string;
  child_id: string;
  scheme_name: string;
  scheme_type: "points_based" | "token_economy" | "star_chart" | "privilege_based" | "experiential" | "collaborative" | "individual" | "other";
  start_date: string;
  review_date: string | null;
  reviewed: boolean;
  criteria_clear: boolean;
  criteria_achievable: boolean;
  criteria_age_appropriate: boolean;
  criteria_individualised: boolean;
  reward_meaningful_to_child: boolean;
  reward_proportionate: boolean;
  child_consulted_on_design: boolean;
  child_understands_scheme: boolean;
  scheme_active: boolean;
  outcomes_documented: boolean;
  positive_outcomes_achieved: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface ReinforcementRecordInput {
  id: string;
  child_id: string;
  date: string;
  reinforcement_type: "verbal_praise" | "written_acknowledgement" | "reward_given" | "privilege_granted" | "activity_reward" | "peer_recognition" | "certificate" | "other";
  context: string;
  behaviour_recognised: string;
  timely: boolean;
  specific: boolean;
  genuine: boolean;
  consistent_with_plan: boolean;
  child_response_positive: boolean;
  staff_member: string;
  witnessed_by_peers: boolean;
  notes: string | null;
  created_at: string;
}

export interface IncentiveProgrammeRecordInput {
  id: string;
  programme_name: string;
  programme_type: "home_wide" | "group_based" | "individual" | "collaborative" | "seasonal" | "achievement_based" | "other";
  start_date: string;
  end_date: string | null;
  active: boolean;
  total_children_eligible: number;
  total_children_participating: number;
  goals_clearly_defined: boolean;
  progress_tracked: boolean;
  milestones_celebrated: boolean;
  children_involved_in_design: boolean;
  effectiveness_reviewed: boolean;
  effectiveness_rating: number; // 1-5
  adjustments_made: boolean;
  outcomes_documented: boolean;
  positive_outcomes_achieved: boolean;
  staff_lead: string;
  notes: string | null;
  created_at: string;
}

export interface ChildParticipationRecordInput {
  id: string;
  child_id: string;
  date: string;
  participation_type: "scheme_design" | "reward_choice" | "criteria_setting" | "programme_feedback" | "peer_nomination" | "review_involvement" | "suggestion_made" | "other";
  child_voice_captured: boolean;
  child_views_acted_upon: boolean;
  child_satisfied_with_outcome: boolean;
  participation_voluntary: boolean;
  support_provided_to_participate: boolean;
  age_appropriate_method: boolean;
  feedback_documented: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface EquityReviewRecordInput {
  id: string;
  review_date: string;
  reviewer: string;
  total_children_assessed: number;
  children_receiving_rewards_count: number;
  children_excluded_from_schemes_count: number;
  exclusion_reasons_documented: boolean;
  reward_distribution_fair: boolean;
  cultural_sensitivity_considered: boolean;
  disability_adjustments_made: boolean;
  age_adjustments_made: boolean;
  gender_bias_reviewed: boolean;
  no_discriminatory_patterns: boolean;
  children_consulted_on_fairness: boolean;
  action_plan_created: boolean;
  action_plan_completed: boolean;
  overall_equity_rating: number; // 1-5
  findings_documented: boolean;
  notes: string | null;
  created_at: string;
}

export interface RewardsIncentivesInput {
  today: string;
  total_children: number;
  reward_scheme_records: RewardSchemeRecordInput[];
  reinforcement_records: ReinforcementRecordInput[];
  incentive_programme_records: IncentiveProgrammeRecordInput[];
  child_participation_records: ChildParticipationRecordInput[];
  equity_review_records: EquityReviewRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RewardsIncentivesRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RewardsIncentivesInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RewardsIncentivesRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface RewardsIncentivesResult {
  rewards_rating: RewardsIncentivesRating;
  rewards_score: number | null;
  headline: string;
  total_scheme_records: number;
  total_reinforcement_records: number;
  total_programme_records: number;
  total_participation_records: number;
  total_equity_reviews: number;
  reward_fairness_rate: number | null;
  reinforcement_consistency_rate: number | null;
  programme_effectiveness_rate: number | null;
  child_participation_rate: number | null;
  equity_rate: number | null;
  child_satisfaction_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: RewardsIncentivesRecommendation[];
  insights: RewardsIncentivesInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): RewardsIncentivesRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: RewardsIncentivesRating,
  score: number,
  headline: string,
): RewardsIncentivesResult {
  return {
    rewards_rating: rating,
    rewards_score: score,
    headline,
    total_scheme_records: 0,
    total_reinforcement_records: 0,
    total_programme_records: 0,
    total_participation_records: 0,
    total_equity_reviews: 0,
    reward_fairness_rate: null,
    reinforcement_consistency_rate: null,
    programme_effectiveness_rate: null,
    child_participation_rate: null,
    equity_rate: null,
    child_satisfaction_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeRewardsIncentivesManagement(
  input: RewardsIncentivesInput,
): RewardsIncentivesResult {
  const {
    total_children,
    reward_scheme_records,
    reinforcement_records,
    incentive_programme_records,
    child_participation_records,
    equity_review_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    reward_scheme_records.length === 0 &&
    reinforcement_records.length === 0 &&
    incentive_programme_records.length === 0 &&
    child_participation_records.length === 0 &&
    equity_review_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess rewards and incentives management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No rewards or incentives management data recorded despite children on placement — positive reinforcement and reward scheme management requires urgent attention.",
      ),
      concerns: [
        "No reward scheme records, reinforcement records, incentive programme records, child participation records, or equity reviews exist despite children being on placement — the home cannot evidence that positive reinforcement is used effectively or that reward schemes are fair and inclusive.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of reward schemes, positive reinforcement, incentive programmes, child participation in reward design, and equity reviews to evidence the home's approach to motivating and celebrating children's achievements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has access to meaningful, individualised reward schemes designed with their input, and that positive reinforcement is delivered consistently and equitably across all children in the home.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 — Health and wellbeing",
        },
      ],
      insights: [
        {
          text: "The complete absence of rewards and incentives management records means Ofsted cannot verify that positive reinforcement is used effectively, that reward schemes are fair, or that children participate in designing their own incentives. This represents a fundamental gap in Reg 5 and Reg 12 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Reward scheme metrics ---
  const totalSchemeRecords = reward_scheme_records.length;

  const schemeFairnessChecks = [
    (r: RewardSchemeRecordInput) => r.criteria_clear,
    (r: RewardSchemeRecordInput) => r.criteria_achievable,
    (r: RewardSchemeRecordInput) => r.criteria_age_appropriate,
    (r: RewardSchemeRecordInput) => r.criteria_individualised,
    (r: RewardSchemeRecordInput) => r.reward_meaningful_to_child,
    (r: RewardSchemeRecordInput) => r.reward_proportionate,
    (r: RewardSchemeRecordInput) => r.child_consulted_on_design,
    (r: RewardSchemeRecordInput) => r.child_understands_scheme,
  ];
  const totalFairnessChecksPossible = totalSchemeRecords * schemeFairnessChecks.length;
  let totalFairnessChecksPassed = 0;
  for (const rec of reward_scheme_records) {
    for (const check of schemeFairnessChecks) {
      if (check(rec)) totalFairnessChecksPassed++;
    }
  }
  const rewardFairnessRate = rate(totalFairnessChecksPassed, totalFairnessChecksPossible);

  const schemesAchievable = reward_scheme_records.filter((r) => r.criteria_achievable).length;
  const achievableCriteriaRate = rate(schemesAchievable, totalSchemeRecords);

  const meaningfulRewards = reward_scheme_records.filter((r) => r.reward_meaningful_to_child).length;
  const meaningfulRewardRate = rate(meaningfulRewards, totalSchemeRecords);

  const childConsultedOnDesign = reward_scheme_records.filter((r) => r.child_consulted_on_design).length;
  const childConsultedRate = rate(childConsultedOnDesign, totalSchemeRecords);

  const schemesReviewed = reward_scheme_records.filter((r) => r.reviewed).length;
  const schemeReviewRate = rate(schemesReviewed, totalSchemeRecords);

  const positiveOutcomesAchieved = reward_scheme_records.filter((r) => r.positive_outcomes_achieved).length;
  const schemePositiveOutcomeRate = rate(positiveOutcomesAchieved, totalSchemeRecords);

  const uniqueChildrenWithSchemes = new Set(
    reward_scheme_records.filter((r) => r.scheme_active).map((r) => r.child_id),
  ).size;
  const schemeCoverageRate = total_children > 0 ? rate(uniqueChildrenWithSchemes, total_children) : 0;

  // --- Reinforcement metrics ---
  const totalReinforcementRecords = reinforcement_records.length;

  const reinforcementQualityChecks = [
    (r: ReinforcementRecordInput) => r.timely,
    (r: ReinforcementRecordInput) => r.specific,
    (r: ReinforcementRecordInput) => r.genuine,
    (r: ReinforcementRecordInput) => r.consistent_with_plan,
  ];
  const totalReinforcementChecksPossible = totalReinforcementRecords * reinforcementQualityChecks.length;
  let totalReinforcementChecksPassed = 0;
  for (const rec of reinforcement_records) {
    for (const check of reinforcementQualityChecks) {
      if (check(rec)) totalReinforcementChecksPassed++;
    }
  }
  const reinforcementConsistencyRate = rate(totalReinforcementChecksPassed, totalReinforcementChecksPossible);

  const childResponsePositive = reinforcement_records.filter((r) => r.child_response_positive).length;
  const reinforcementPositiveResponseRate = rate(childResponsePositive, totalReinforcementRecords);

  // --- Incentive programme metrics ---
  const totalProgrammeRecords = incentive_programme_records.length;

  const goalsCleared = incentive_programme_records.filter((p) => p.goals_clearly_defined).length;

  const progressTracked = incentive_programme_records.filter((p) => p.progress_tracked).length;

  const milestonesCelebrated = incentive_programme_records.filter((p) => p.milestones_celebrated).length;
  const milestonesCelebratedRate = rate(milestonesCelebrated, totalProgrammeRecords);

  const effectivenessReviewed = incentive_programme_records.filter((p) => p.effectiveness_reviewed).length;

  const effectivenessSum = incentive_programme_records.reduce((sum, p) => sum + p.effectiveness_rating, 0);
  const avgEffectivenessRating =
    totalProgrammeRecords > 0
      ? Math.round((effectivenessSum / totalProgrammeRecords) * 100) / 100
      : null;

  const programmePositiveOutcomes = incentive_programme_records.filter((p) => p.positive_outcomes_achieved).length;

  // Programme effectiveness composite: goals + tracked + reviewed + positive outcomes
  const programmeEffectivenessNumerator = goalsCleared + progressTracked + effectivenessReviewed + programmePositiveOutcomes;
  const programmeEffectivenessDenominator = totalProgrammeRecords * 4;
  const programmeEffectivenessRate = rate(programmeEffectivenessNumerator, programmeEffectivenessDenominator);

  // Total participation across programmes
  const totalEligibleAcrossProgrammes = incentive_programme_records.reduce((sum, p) => sum + p.total_children_eligible, 0);
  const totalParticipatingAcrossProgrammes = incentive_programme_records.reduce((sum, p) => sum + p.total_children_participating, 0);
  const programmeParticipationRate = rate(totalParticipatingAcrossProgrammes, totalEligibleAcrossProgrammes);

  // --- Child participation metrics ---
  const totalParticipationRecords = child_participation_records.length;

  const voiceCaptured = child_participation_records.filter((p) => p.child_voice_captured).length;

  const viewsActedUpon = child_participation_records.filter((p) => p.child_views_acted_upon).length;
  const viewsActedUponRate = rate(viewsActedUpon, totalParticipationRecords);

  const satisfiedWithOutcome = child_participation_records.filter((p) => p.child_satisfied_with_outcome).length;
  const childSatisfactionRate = rate(satisfiedWithOutcome, totalParticipationRecords);

  const participationVoluntary = child_participation_records.filter((p) => p.participation_voluntary).length;

  // Child participation composite: voice captured + views acted upon + satisfied + voluntary
  const childParticipationNumerator = voiceCaptured + viewsActedUpon + satisfiedWithOutcome + participationVoluntary;
  const childParticipationDenominator = totalParticipationRecords * 4;
  const childParticipationRate = rate(childParticipationNumerator, childParticipationDenominator);

  // --- Equity review metrics ---
  const totalEquityReviews = equity_review_records.length;

  const equityChecks = [
    (e: EquityReviewRecordInput) => e.reward_distribution_fair,
    (e: EquityReviewRecordInput) => e.cultural_sensitivity_considered,
    (e: EquityReviewRecordInput) => e.disability_adjustments_made,
    (e: EquityReviewRecordInput) => e.age_adjustments_made,
    (e: EquityReviewRecordInput) => e.gender_bias_reviewed,
    (e: EquityReviewRecordInput) => e.no_discriminatory_patterns,
    (e: EquityReviewRecordInput) => e.children_consulted_on_fairness,
  ];
  const totalEquityChecksPossible = totalEquityReviews * equityChecks.length;
  let totalEquityChecksPassed = 0;
  for (const rec of equity_review_records) {
    for (const check of equityChecks) {
      if (check(rec)) totalEquityChecksPassed++;
    }
  }
  const equityRate = rate(totalEquityChecksPassed, totalEquityChecksPossible);

  const noDiscriminatoryPatterns = equity_review_records.filter((e) => e.no_discriminatory_patterns).length;
  const noDiscriminatoryPatternsRate = rate(noDiscriminatoryPatterns, totalEquityReviews);

  const actionPlansCreated = equity_review_records.filter((e) => e.action_plan_created).length;

  const actionPlansCompleted = equity_review_records.filter((e) => e.action_plan_created && e.action_plan_completed).length;
  const actionPlanCompletionRate = rate(actionPlansCompleted, actionPlansCreated);

  const totalChildrenExcluded = equity_review_records.reduce(
    (sum, e) => sum + e.children_excluded_from_schemes_count,
    0,
  );
  const totalChildrenAssessed = equity_review_records.reduce(
    (sum, e) => sum + e.total_children_assessed,
    0,
  );
  const exclusionRate = rate(totalChildrenExcluded, totalChildrenAssessed);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: rewardFairnessRate (>=90: +4, >=70: +2) ---
  if (meets(rewardFairnessRate, 90)) score += 4;
  else if (meets(rewardFairnessRate, 70)) score += 2;

  // --- Bonus 2: reinforcementConsistencyRate (>=90: +4, >=70: +2) ---
  if (meets(reinforcementConsistencyRate, 90)) score += 4;
  else if (meets(reinforcementConsistencyRate, 70)) score += 2;

  // --- Bonus 3: programmeEffectivenessRate (>=85: +3, >=65: +1) ---
  if (meets(programmeEffectivenessRate, 85)) score += 3;
  else if (meets(programmeEffectivenessRate, 65)) score += 1;

  // --- Bonus 4: childParticipationRate (>=90: +4, >=70: +2) ---
  if (meets(childParticipationRate, 90)) score += 4;
  else if (meets(childParticipationRate, 70)) score += 2;

  // --- Bonus 5: equityRate (>=90: +4, >=70: +2) ---
  if (meets(equityRate, 90)) score += 4;
  else if (meets(equityRate, 70)) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (meets(childSatisfactionRate, 90)) score += 3;
  else if (meets(childSatisfactionRate, 70)) score += 1;

  // --- Bonus 7: schemeReviewRate (>=90: +3, >=70: +1) ---
  if (meets(schemeReviewRate, 90)) score += 3;
  else if (meets(schemeReviewRate, 70)) score += 1;

  // --- Bonus 8: schemeCoverageRate (>=80: +3, >=50: +1) ---
  if (meets(schemeCoverageRate, 80)) score += 3;
  else if (meets(schemeCoverageRate, 50)) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // rewardFairnessRate < 50 → -5
  if (below(rewardFairnessRate, 50) && totalSchemeRecords > 0) score -= 5;

  // reinforcementConsistencyRate < 50 → -5
  if (below(reinforcementConsistencyRate, 50) && totalReinforcementRecords > 0) score -= 5;

  // equityRate < 50 → -5
  if (below(equityRate, 50) && totalEquityReviews > 0) score -= 5;

  // childParticipationRate < 40 → -3
  if (below(childParticipationRate, 40) && totalParticipationRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const rewards_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(rewardFairnessRate, 90) && totalSchemeRecords > 0) {
    strengths.push(
      `${rewardFairnessRate}% reward scheme fairness — schemes have clear, achievable, age-appropriate criteria with meaningful rewards that children helped design and understand.`,
    );
  } else if (meets(rewardFairnessRate, 70) && totalSchemeRecords > 0) {
    strengths.push(
      `${rewardFairnessRate}% reward scheme fairness — the home generally maintains well-designed, fair reward schemes for children.`,
    );
  }

  if (meets(reinforcementConsistencyRate, 90) && totalReinforcementRecords > 0) {
    strengths.push(
      `${reinforcementConsistencyRate}% positive reinforcement consistency — praise and rewards are delivered in a timely, specific, genuine manner consistent with children's individual plans.`,
    );
  } else if (meets(reinforcementConsistencyRate, 70) && totalReinforcementRecords > 0) {
    strengths.push(
      `${reinforcementConsistencyRate}% reinforcement consistency — positive reinforcement is generally delivered effectively across the home.`,
    );
  }

  if (meets(programmeEffectivenessRate, 85) && totalProgrammeRecords > 0) {
    strengths.push(
      `${programmeEffectivenessRate}% incentive programme effectiveness — programmes have clear goals, tracked progress, reviewed effectiveness, and achieve positive outcomes for children.`,
    );
  } else if (meets(programmeEffectivenessRate, 65) && totalProgrammeRecords > 0) {
    strengths.push(
      `${programmeEffectivenessRate}% programme effectiveness — the home's incentive programmes generally meet their goals and benefit children.`,
    );
  }

  if (meets(childParticipationRate, 90) && totalParticipationRecords > 0) {
    strengths.push(
      `${childParticipationRate}% child participation quality — children's voices are captured, their views are acted upon, participation is voluntary, and children are satisfied with outcomes.`,
    );
  } else if (meets(childParticipationRate, 70) && totalParticipationRecords > 0) {
    strengths.push(
      `${childParticipationRate}% child participation — children are generally involved in shaping their reward and incentive experiences.`,
    );
  }

  if (meets(equityRate, 90) && totalEquityReviews > 0) {
    strengths.push(
      `${equityRate}% equity across reward schemes — reward distribution is fair, culturally sensitive, adjusted for disability and age, with no discriminatory patterns and children consulted on fairness.`,
    );
  } else if (meets(equityRate, 70) && totalEquityReviews > 0) {
    strengths.push(
      `${equityRate}% equity rate — the home generally ensures fair and inclusive reward distribution across all children.`,
    );
  }

  if (meets(childSatisfactionRate, 90) && totalParticipationRecords > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction with reward outcomes — children feel that the reward and incentive system works for them and reflects their input.`,
    );
  } else if (meets(childSatisfactionRate, 70) && totalParticipationRecords > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction — most children report positive experiences with the home's reward system.`,
    );
  }

  if (meets(schemeReviewRate, 90) && totalSchemeRecords > 0) {
    strengths.push(
      `${schemeReviewRate}% scheme review rate — reward schemes are actively monitored and adapted to remain meaningful and effective for each child.`,
    );
  } else if (meets(schemeReviewRate, 70) && totalSchemeRecords > 0) {
    strengths.push(
      `${schemeReviewRate}% scheme review rate — the home generally reviews reward schemes to ensure they remain appropriate.`,
    );
  }

  if (meets(schemeCoverageRate, 80) && total_children > 0) {
    strengths.push(
      `${schemeCoverageRate}% reward scheme coverage — the majority of children have active, individualised reward schemes in place.`,
    );
  } else if (meets(schemeCoverageRate, 60) && total_children > 0) {
    strengths.push(
      `${schemeCoverageRate}% of children have active reward schemes — good coverage with room to extend to remaining children.`,
    );
  }

  if (meets(reinforcementPositiveResponseRate, 90) && totalReinforcementRecords > 0) {
    strengths.push(
      `${reinforcementPositiveResponseRate}% positive child response to reinforcement — children respond well to praise and rewards, suggesting reinforcement is meaningful and delivered with sensitivity.`,
    );
  } else if (meets(reinforcementPositiveResponseRate, 70) && totalReinforcementRecords > 0) {
    strengths.push(
      `${reinforcementPositiveResponseRate}% positive child response — most children respond positively to the reinforcement they receive.`,
    );
  }

  if (meets(schemePositiveOutcomeRate, 85) && totalSchemeRecords > 0) {
    strengths.push(
      `${schemePositiveOutcomeRate}% of reward schemes achieve positive outcomes — the home's reward approach is effective in supporting children's progress and self-esteem.`,
    );
  }

  if (meets(milestonesCelebratedRate, 90) && totalProgrammeRecords > 0) {
    strengths.push(
      `${milestonesCelebratedRate}% of programme milestones celebrated — the home actively marks children's achievements, building confidence and a sense of accomplishment.`,
    );
  }

  if (meets(meaningfulRewardRate, 90) && totalSchemeRecords > 0) {
    strengths.push(
      `${meaningfulRewardRate}% of rewards are meaningful to children — rewards reflect children's individual interests and preferences, making the incentive system genuinely motivating.`,
    );
  }

  if (meets(programmeParticipationRate, 90) && totalEligibleAcrossProgrammes > 0) {
    strengths.push(
      `${programmeParticipationRate}% programme participation — eligible children are actively engaged in incentive programmes, demonstrating inclusive design and appeal.`,
    );
  }

  if (meets(noDiscriminatoryPatternsRate, 90) && totalEquityReviews > 0) {
    strengths.push(
      `${noDiscriminatoryPatternsRate}% of equity reviews confirm no discriminatory patterns — the reward system operates without bias across protected characteristics.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(rewardFairnessRate, 50) && totalSchemeRecords > 0) {
    concerns.push(
      `Only ${rewardFairnessRate}% reward scheme fairness — the majority of schemes do not meet basic fairness standards (clear, achievable, age-appropriate, individualised criteria with meaningful rewards). This undermines children's trust in the reward system and may feel punitive rather than motivating.`,
    );
  } else if (below(rewardFairnessRate, 70) && meets(rewardFairnessRate, 50) && totalSchemeRecords > 0) {
    concerns.push(
      `Reward scheme fairness at ${rewardFairnessRate}% — some schemes do not fully meet fairness standards, which may leave some children feeling the system is unfair or inaccessible.`,
    );
  }

  if (below(reinforcementConsistencyRate, 50) && totalReinforcementRecords > 0) {
    concerns.push(
      `Only ${reinforcementConsistencyRate}% reinforcement consistency — positive reinforcement is not being delivered in a timely, specific, genuine, or plan-consistent manner. Inconsistent praise undermines children's motivation and can create confusion about expectations.`,
    );
  } else if (below(reinforcementConsistencyRate, 70) && meets(reinforcementConsistencyRate, 50) && totalReinforcementRecords > 0) {
    concerns.push(
      `Reinforcement consistency at ${reinforcementConsistencyRate}% — positive reinforcement is not consistently meeting quality standards across all interactions.`,
    );
  }

  if (below(programmeEffectivenessRate, 50) && totalProgrammeRecords > 0) {
    concerns.push(
      `Only ${programmeEffectivenessRate}% incentive programme effectiveness — programmes lack clear goals, progress tracking, or effectiveness reviews. Without these, incentive programmes cannot be demonstrated to benefit children.`,
    );
  } else if (below(programmeEffectivenessRate, 65) && meets(programmeEffectivenessRate, 50) && totalProgrammeRecords > 0) {
    concerns.push(
      `Programme effectiveness at ${programmeEffectivenessRate}% — some incentive programmes are not fully achieving their objectives or being regularly reviewed.`,
    );
  }

  if (below(childParticipationRate, 40) && totalParticipationRecords > 0) {
    concerns.push(
      `Child participation in reward design at only ${childParticipationRate}% — children are not meaningfully involved in shaping their reward and incentive experiences. This conflicts with the principle that children should have a voice in decisions affecting them.`,
    );
  } else if (below(childParticipationRate, 70) && meets(childParticipationRate, 40) && totalParticipationRecords > 0) {
    concerns.push(
      `Child participation rate at ${childParticipationRate}% — not all children are meaningfully involved in the design and review of reward schemes.`,
    );
  }

  if (below(equityRate, 50) && totalEquityReviews > 0) {
    concerns.push(
      `Only ${equityRate}% equity across reward schemes — reward distribution shows significant fairness issues including potential cultural insensitivity, lack of disability adjustments, or discriminatory patterns. This is a serious safeguarding and equality concern.`,
    );
  } else if (below(equityRate, 70) && meets(equityRate, 50) && totalEquityReviews > 0) {
    concerns.push(
      `Equity rate at ${equityRate}% — some aspects of reward distribution do not fully meet fairness and equality standards across all children.`,
    );
  }

  if (below(childSatisfactionRate, 50) && totalParticipationRecords > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction with reward outcomes — children do not feel the reward system works for them, suggesting rewards are not meaningful, criteria are unachievable, or children's input is being ignored.`,
    );
  } else if (below(childSatisfactionRate, 70) && meets(childSatisfactionRate, 50) && totalParticipationRecords > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not satisfied with how the reward system operates.`,
    );
  }

  if (above(exclusionRate, 30) && totalChildrenAssessed > 0) {
    concerns.push(
      `${exclusionRate}% of children assessed are excluded from reward schemes — high exclusion rates suggest the system may be inaccessible or discriminatory for some children.`,
    );
  } else if (above(exclusionRate, 15) && exclusionRate! <= 30 && totalChildrenAssessed > 0) {
    concerns.push(
      `${exclusionRate}% child exclusion from reward schemes — some children are not able to access the reward system, which requires investigation.`,
    );
  }

  if (below(schemeReviewRate, 50) && totalSchemeRecords > 0) {
    concerns.push(
      `Only ${schemeReviewRate}% of reward schemes reviewed — schemes that are not reviewed may become stale, meaningless, or inappropriate as children's needs evolve.`,
    );
  } else if (below(schemeReviewRate, 70) && meets(schemeReviewRate, 50) && totalSchemeRecords > 0) {
    concerns.push(
      `Scheme review rate at ${schemeReviewRate}% — not all reward schemes are being reviewed regularly to ensure continued relevance and effectiveness.`,
    );
  }

  if (totalSchemeRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No reward scheme records exist despite children being on placement — the home cannot evidence that structured reward approaches are in place to support children's positive behaviour and achievement.",
    );
  }

  if (totalReinforcementRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No positive reinforcement records exist — the home cannot evidence that children receive consistent praise and recognition for positive behaviour and achievements.",
    );
  }

  if (totalEquityReviews === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No equity reviews of reward schemes have been conducted — the home cannot evidence that reward distribution is fair and free from discrimination across all children.",
    );
  }

  if (totalParticipationRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child participation records for reward design — the home cannot evidence that children have a voice in shaping the reward and incentive systems that affect them.",
    );
  }

  if (below(viewsActedUponRate, 50) && totalParticipationRecords > 0) {
    concerns.push(
      `Only ${viewsActedUponRate}% of children's views about rewards are acted upon — capturing children's voices without responding to them undermines trust and tokenises participation.`,
    );
  }

  if (below(achievableCriteriaRate, 50) && totalSchemeRecords > 0) {
    concerns.push(
      `Only ${achievableCriteriaRate}% of reward schemes have achievable criteria — unachievable criteria can damage children's self-esteem and create a sense of failure rather than motivation.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: RewardsIncentivesRecommendation[] = [];
  let rank = 0;

  if (below(rewardFairnessRate, 50) && totalSchemeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all reward schemes for fairness — ensure criteria are clear, achievable, age-appropriate, and individualised with meaningful rewards. Involve children in redesigning schemes that do not meet these standards.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (below(reinforcementConsistencyRate, 50) && totalReinforcementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide urgent training for staff on delivering effective positive reinforcement — praise must be timely, specific, genuine, and consistent with children's individual plans. Inconsistent reinforcement erodes trust and motivation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (below(equityRate, 50) && totalEquityReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an immediate comprehensive equity review of all reward schemes — address discriminatory patterns, ensure cultural sensitivity, make disability and age adjustments, and consult children about fairness. Inequitable rewards undermine children's rights.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (below(childParticipationRate, 40) && totalParticipationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently increase child participation in reward design — use age-appropriate methods to capture children's views, act on their input, and ensure participation is voluntary and supported. Reward systems imposed without children's input are unlikely to be effective.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(childSatisfactionRate, 50) && totalParticipationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult children individually about their experiences of the reward system — low satisfaction indicates rewards are not meaningful, criteria are unachievable, or children feel excluded. Redesign with children's input.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (totalSchemeRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement individualised reward schemes for every child on placement — each scheme should have clear, achievable criteria designed with the child and offer rewards that are meaningful to them.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (totalReinforcementRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin systematic recording of positive reinforcement — document verbal praise, written acknowledgements, rewards, and privileges to evidence consistent use of positive reinforcement across the home.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (totalEquityReviews === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence regular equity reviews of reward and incentive schemes — assess whether reward distribution is fair, culturally sensitive, and free from discrimination across all protected characteristics.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (totalParticipationRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create structured opportunities for children to participate in reward and incentive design — capture their voices, act on their views, and document their satisfaction with outcomes.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (above(exclusionRate, 30) && totalChildrenAssessed > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review why a high proportion of children are excluded from reward schemes — identify and remove barriers to participation, adjust schemes to be accessible to all, and document reasons for any necessary exclusions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (below(programmeEffectivenessRate, 50) && totalProgrammeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and restructure incentive programmes to improve effectiveness — ensure programmes have clear goals, tracked progress, and regular effectiveness reviews. Programmes that do not benefit children should be redesigned or replaced.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (below(schemeReviewRate, 50) && totalSchemeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular schedule for reviewing all reward schemes — unreviewed schemes become stale and may no longer reflect children's interests, needs, or developmental stage.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (below(viewsActedUponRate, 50) && totalParticipationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's views about rewards are acted upon — capturing feedback without making changes tokenises participation. Create clear feedback loops showing children how their input has shaped the reward system.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(achievableCriteriaRate, 50) && totalSchemeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and adjust reward scheme criteria to ensure they are achievable — unachievable targets damage children's self-esteem and can make the reward system feel punitive rather than motivating.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (
    meets(rewardFairnessRate, 50) &&
    below(rewardFairnessRate, 70) &&
    totalSchemeRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve reward scheme fairness to at least 70% — review schemes where criteria are unclear, unachievable, or not individualised and work with children to address gaps.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (
    meets(reinforcementConsistencyRate, 50) &&
    below(reinforcementConsistencyRate, 70) &&
    totalReinforcementRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance positive reinforcement quality to above 70% — provide staff with coaching on delivering timely, specific, and genuine praise aligned with individual plans.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (
    meets(equityRate, 50) &&
    below(equityRate, 70) &&
    totalEquityReviews > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen equity in reward distribution — address specific areas where fairness, cultural sensitivity, or adjustments for disability and age are not fully met.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (
    meets(childParticipationRate, 40) &&
    below(childParticipationRate, 70) &&
    totalParticipationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child participation in reward design above 70% — use diverse, age-appropriate methods and ensure all children have supported opportunities to shape their incentive experiences.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    meets(programmeEffectivenessRate, 50) &&
    below(programmeEffectivenessRate, 65) &&
    totalProgrammeRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve incentive programme effectiveness through better goal-setting, progress tracking, and regular reviews — effective programmes should clearly demonstrate benefit to children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (
    below(schemeCoverageRate, 50) &&
    total_children > 0 &&
    totalSchemeRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend reward scheme coverage to all children — assess each child's needs and preferences, and create individualised schemes that are accessible and motivating for every child on placement.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  if (
    meets(childSatisfactionRate, 50) &&
    below(childSatisfactionRate, 70) &&
    totalParticipationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Seek regular child feedback on reward experiences and adapt schemes accordingly — aim to increase satisfaction above 70% by responding to children's preferences and concerns.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (below(milestonesCelebratedRate, 70) && totalProgrammeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure programme milestones are consistently celebrated — marking achievements builds children's confidence, self-esteem, and motivation to continue engaging.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive relationships",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: RewardsIncentivesInsight[] = [];

  // -- Critical insights --

  if (below(rewardFairnessRate, 50) && totalSchemeRecords > 0) {
    insights.push({
      text: `Only ${rewardFairnessRate}% reward scheme fairness. Ofsted expects reward systems to be fair, transparent, and designed with children's input. When schemes have unclear, unachievable, or non-individualised criteria, they can damage children's self-esteem and create a sense of exclusion rather than motivation.`,
      severity: "critical",
    });
  }

  if (below(reinforcementConsistencyRate, 50) && totalReinforcementRecords > 0) {
    insights.push({
      text: `Only ${reinforcementConsistencyRate}% reinforcement consistency. Positive reinforcement is a cornerstone of effective residential care — when it is inconsistent, untimely, or generic, children cannot develop a clear understanding of expectations and may feel their efforts go unrecognised.`,
      severity: "critical",
    });
  }

  if (below(equityRate, 50) && totalEquityReviews > 0) {
    insights.push({
      text: `Only ${equityRate}% equity across reward schemes. Inequitable reward distribution has significant safeguarding implications — children who are systematically excluded or disadvantaged by the reward system may experience discrimination, reduced self-esteem, and a sense of injustice that undermines their placement stability.`,
      severity: "critical",
    });
  }

  if (below(childParticipationRate, 40) && totalParticipationRecords > 0) {
    insights.push({
      text: `Child participation in reward design at only ${childParticipationRate}%. Reward systems designed without children's meaningful input are fundamentally flawed — they cannot reflect children's motivations, preferences, or sense of fairness. Ofsted views child participation in decisions affecting them as essential.`,
      severity: "critical",
    });
  }

  if (below(childSatisfactionRate, 50) && totalParticipationRecords > 0) {
    insights.push({
      text: `Only ${childSatisfactionRate}% child satisfaction with reward outcomes. When children are dissatisfied with the reward system, it suggests a fundamental disconnect between what the home provides and what children value. This requires a complete review of the reward approach with children at the centre.`,
      severity: "critical",
    });
  }

  if (totalSchemeRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No reward scheme records exist despite children being on placement. Without documented reward schemes, the home cannot evidence that positive reinforcement is structured, fair, or effective. This is a fundamental gap in the home's approach to building positive relationships with children.",
      severity: "critical",
    });
  }

  if (totalReinforcementRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No positive reinforcement records exist. The absence of documented praise and rewards means the home cannot evidence that staff consistently recognise and celebrate children's positive behaviour and achievements — a core expectation of Reg 5.",
      severity: "critical",
    });
  }

  if (totalEquityReviews === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No equity reviews have been conducted for reward schemes. Without equity monitoring, the home cannot identify or address discriminatory patterns in reward distribution. This leaves children vulnerable to unfair treatment and undermines the home's commitment to equality.",
      severity: "critical",
    });
  }

  if (above(exclusionRate, 30) && totalChildrenAssessed > 0) {
    insights.push({
      text: `${exclusionRate}% of children are excluded from reward schemes. High exclusion rates are a significant concern — children who cannot access the reward system are likely to feel marginalised, lose motivation, and may exhibit increased challenging behaviour as a result.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(rewardFairnessRate, 50) &&
    below(rewardFairnessRate, 70) &&
    totalSchemeRecords > 0
  ) {
    insights.push({
      text: `Reward scheme fairness at ${rewardFairnessRate}% — improving but not yet meeting expected standards. Some schemes still have unclear criteria, non-individualised approaches, or rewards that are not meaningful to children. Review specific gaps with children's input.`,
      severity: "warning",
    });
  }

  if (
    meets(reinforcementConsistencyRate, 50) &&
    below(reinforcementConsistencyRate, 70) &&
    totalReinforcementRecords > 0
  ) {
    insights.push({
      text: `Reinforcement consistency at ${reinforcementConsistencyRate}% — some positive reinforcement is not being delivered with the timeliness, specificity, or genuineness that children need to connect praise with their behaviour.`,
      severity: "warning",
    });
  }

  if (
    meets(programmeEffectivenessRate, 50) &&
    below(programmeEffectivenessRate, 65) &&
    totalProgrammeRecords > 0
  ) {
    insights.push({
      text: `Programme effectiveness at ${programmeEffectivenessRate}% — some incentive programmes lack clear goals, progress tracking, or regular effectiveness reviews. Without these, it is difficult to demonstrate that programmes benefit children.`,
      severity: "warning",
    });
  }

  if (
    meets(childParticipationRate, 40) &&
    below(childParticipationRate, 70) &&
    totalParticipationRecords > 0
  ) {
    insights.push({
      text: `Child participation rate at ${childParticipationRate}% — some children are not meaningfully involved in shaping their reward experiences. Consider whether participation methods are accessible, age-appropriate, and genuinely empowering.`,
      severity: "warning",
    });
  }

  if (
    meets(equityRate, 50) &&
    below(equityRate, 70) &&
    totalEquityReviews > 0
  ) {
    insights.push({
      text: `Equity rate at ${equityRate}% — while some equity standards are met, gaps remain in areas such as cultural sensitivity, disability adjustments, or children being consulted on fairness. Partial equity is not sufficient.`,
      severity: "warning",
    });
  }

  if (
    meets(childSatisfactionRate, 50) &&
    below(childSatisfactionRate, 70) &&
    totalParticipationRecords > 0
  ) {
    insights.push({
      text: `Child satisfaction with rewards at ${childSatisfactionRate}% — a notable proportion of children do not feel positive about the reward system. This may indicate that rewards are not aligned with their interests or that criteria feel unachievable.`,
      severity: "warning",
    });
  }

  if (
    meets(schemeReviewRate, 50) &&
    below(schemeReviewRate, 70) &&
    totalSchemeRecords > 0
  ) {
    insights.push({
      text: `Scheme review rate at ${schemeReviewRate}% — not all reward schemes are being regularly reviewed. Unreviewed schemes may become stale, irrelevant, or misaligned with children's current needs and developmental stage.`,
      severity: "warning",
    });
  }

  if (
    meets(viewsActedUponRate, 50) &&
    below(viewsActedUponRate, 70) &&
    totalParticipationRecords > 0
  ) {
    insights.push({
      text: `Only ${viewsActedUponRate}% of children's views are acted upon — capturing feedback without making changes risks tokenising participation. Children need to see that their input has a real impact on the reward system.`,
      severity: "warning",
    });
  }

  if (
    above(exclusionRate, 15) &&
    exclusionRate! <= 30 &&
    totalChildrenAssessed > 0
  ) {
    insights.push({
      text: `${exclusionRate}% of children excluded from reward schemes — while not at critical levels, any exclusion should be investigated to ensure it is justified, documented, and actively addressed.`,
      severity: "warning",
    });
  }

  if ((avgEffectivenessRating ?? 0) >= 2.5 && (avgEffectivenessRating ?? 0) < 3.5 && totalProgrammeRecords > 0) {
    insights.push({
      text: `Average programme effectiveness rating at ${avgEffectivenessRating}/5 — incentive programmes are performing at a mediocre level. Consider whether programme design, participation, or celebration of achievements needs strengthening.`,
      severity: "warning",
    });
  }

  // Reinforcement type analysis
  const reinforcementTypes: Record<string, number> = {};
  for (const r of reinforcement_records) {
    reinforcementTypes[r.reinforcement_type] = (reinforcementTypes[r.reinforcement_type] ?? 0) + 1;
  }
  const topReinforcementTypes = Object.entries(reinforcementTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topReinforcementTypes.length > 0) {
    const formatted = topReinforcementTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common reinforcement types: ${formatted}. A diverse range of reinforcement methods keeps the system fresh and ensures different children's preferences are met — consider whether the current mix serves all children well.`,
      severity: "warning",
    });
  }

  // Scheme type analysis
  const schemeTypes: Record<string, number> = {};
  for (const s of reward_scheme_records) {
    schemeTypes[s.scheme_type] = (schemeTypes[s.scheme_type] ?? 0) + 1;
  }
  const topSchemeTypes = Object.entries(schemeTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topSchemeTypes.length > 0) {
    const formatted = topSchemeTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common scheme types: ${formatted}. Different children respond to different reward approaches — a balanced mix of scheme types supports personalisation and prevents one-size-fits-all approaches.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (rewards_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding rewards and incentives management — reward schemes are fair and individualised, positive reinforcement is consistent and effective, children actively participate in reward design, and equity is maintained across all children. This is strong evidence for Reg 5 and Reg 12 compliance.",
      severity: "positive",
    });
  }

  if (
    meets(rewardFairnessRate, 90) &&
    meets(childConsultedRate, 90) &&
    totalSchemeRecords > 0
  ) {
    insights.push({
      text: `${rewardFairnessRate}% reward fairness with ${childConsultedRate}% child consultation on design — the combination of fair criteria and genuine child involvement demonstrates that the home has created a reward system children trust and value.`,
      severity: "positive",
    });
  }

  if (
    meets(reinforcementConsistencyRate, 90) &&
    meets(reinforcementPositiveResponseRate, 90) &&
    totalReinforcementRecords > 0
  ) {
    insights.push({
      text: `${reinforcementConsistencyRate}% reinforcement consistency with ${reinforcementPositiveResponseRate}% positive child response — staff deliver high-quality positive reinforcement that children genuinely appreciate and respond to, building self-esteem and motivation.`,
      severity: "positive",
    });
  }

  if (
    meets(equityRate, 90) &&
    meets(noDiscriminatoryPatternsRate, 90) &&
    totalEquityReviews > 0
  ) {
    insights.push({
      text: `${equityRate}% equity rate with ${noDiscriminatoryPatternsRate}% confirmed no discriminatory patterns — the reward system operates fairly across all protected characteristics, ensuring every child has equal opportunity to succeed.`,
      severity: "positive",
    });
  }

  if (
    meets(childParticipationRate, 90) &&
    meets(childSatisfactionRate, 90) &&
    totalParticipationRecords > 0
  ) {
    insights.push({
      text: `${childParticipationRate}% child participation with ${childSatisfactionRate}% satisfaction — children are meaningfully involved in shaping their reward experiences and are satisfied with the outcomes. This reflects genuinely child-centred practice.`,
      severity: "positive",
    });
  }

  if (
    meets(programmeEffectivenessRate, 85) &&
    totalProgrammeRecords > 0
  ) {
    insights.push({
      text: `${programmeEffectivenessRate}% programme effectiveness — incentive programmes have clear goals, tracked progress, reviewed effectiveness, and achieve positive outcomes. The home uses structured programmes to motivate and celebrate children's achievements.`,
      severity: "positive",
    });
  }

  if (
    meets(schemeCoverageRate, 80) &&
    total_children > 0
  ) {
    insights.push({
      text: `${schemeCoverageRate}% reward scheme coverage — the vast majority of children have active, individualised reward schemes, ensuring no child is left without structured positive reinforcement.`,
      severity: "positive",
    });
  }

  if (
    meets(schemeReviewRate, 90) &&
    meets(schemePositiveOutcomeRate, 85) &&
    totalSchemeRecords > 0
  ) {
    insights.push({
      text: `${schemeReviewRate}% scheme review rate with ${schemePositiveOutcomeRate}% positive outcomes — reward schemes are actively monitored and consistently deliver positive results for children. The home's reward approach is evidence-based and outcomes-focused.`,
      severity: "positive",
    });
  }

  if (
    meets(childSatisfactionRate, 90) &&
    totalParticipationRecords > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction with reward outcomes — children feel the reward system works for them, reflects their input, and recognises their achievements. This builds trust, self-esteem, and a positive home culture.`,
      severity: "positive",
    });
  }

  if (
    meets(meaningfulRewardRate, 90) &&
    totalSchemeRecords > 0
  ) {
    insights.push({
      text: `${meaningfulRewardRate}% of rewards are meaningful to children — the home ensures rewards align with individual children's interests and preferences, making the incentive system genuinely motivating rather than tokenistic.`,
      severity: "positive",
    });
  }

  if (
    meets(actionPlanCompletionRate, 90) &&
    actionPlansCreated > 0
  ) {
    insights.push({
      text: `${actionPlanCompletionRate}% of equity action plans completed — when fairness issues are identified, the home follows through with corrective actions, demonstrating a commitment to continuous improvement in equitable reward distribution.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (rewards_rating === "outstanding") {
    headline =
      "Outstanding rewards and incentives management — reward schemes are fair, positive reinforcement is consistent, children actively participate in design, and equity is maintained across all children.";
  } else if (rewards_rating === "good") {
    headline = `Good rewards and incentives management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (rewards_rating === "adequate") {
    headline = `Adequate rewards and incentives management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure fair, effective, and child-centred reward practices.`;
  } else {
    headline = `Rewards and incentives management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's reward experiences are fair, inclusive, and effective.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    rewards_rating,
    rewards_score: score,
    headline,
    total_scheme_records: totalSchemeRecords,
    total_reinforcement_records: totalReinforcementRecords,
    total_programme_records: totalProgrammeRecords,
    total_participation_records: totalParticipationRecords,
    total_equity_reviews: totalEquityReviews,
    reward_fairness_rate: rewardFairnessRate,
    reinforcement_consistency_rate: reinforcementConsistencyRate,
    programme_effectiveness_rate: programmeEffectivenessRate,
    child_participation_rate: childParticipationRate,
    equity_rate: equityRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
