// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SENSORY DIET & REGULATION INTELLIGENCE ENGINE
// Monitors sensory diet plan coverage, regulation strategy effectiveness,
// sensory break scheduling, occupational therapy integration, and child
// self-regulation progress across the home.
// Measures diet plan coverage, strategy effectiveness, break scheduling,
// therapy integration, self-regulation progress, and child progress rates.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging with the wider system), Reg 14 (Care planning).
// SCCIF: "Children's experiences and progress."
// Store keys: sensoryDietPlanRecords, regulationStrategyRecords,
//             sensoryBreakRecords, occupationalTherapyRecords,
//             selfRegulationRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SensoryDietPlanInput {
  id: string;
  child_id: string;
  plan_created_date: string;
  plan_type: "full" | "targeted" | "maintenance" | "crisis";
  created_by: string;
  ot_involved: boolean;
  activities_prescribed: number;
  activities_implemented: number;
  review_date: string | null;
  review_overdue: boolean;
  child_participated_in_planning: boolean;
  parent_carer_informed: boolean;
  staff_trained_on_plan: boolean;
  plan_accessible_to_staff: boolean;
  last_updated: string;
  active: boolean;
  created_at: string;
}

export interface RegulationStrategyInput {
  id: string;
  child_id: string;
  strategy_name: string;
  strategy_type: "calming" | "alerting" | "organising" | "grounding" | "proprioceptive" | "vestibular" | "oral_motor" | "combined";
  date_introduced: string;
  effectiveness_rating: number; // 1-5
  child_engagement_rating: number; // 1-5
  used_independently_by_child: boolean;
  staff_consistency_rating: number; // 1-5
  times_used_last_30_days: number;
  positive_outcome_count: number;
  negative_outcome_count: number;
  neutral_outcome_count: number;
  active: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface SensoryBreakInput {
  id: string;
  child_id: string;
  break_date: string;
  scheduled: boolean;
  break_type: "movement" | "quiet" | "tactile" | "proprioceptive" | "vestibular" | "combined" | "child_chosen";
  duration_minutes: number;
  timing_appropriate: boolean;
  child_requested: boolean;
  staff_initiated: boolean;
  outcome_rating: number; // 1-5
  returned_to_activity: boolean;
  regulation_improved: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface OccupationalTherapyInput {
  id: string;
  child_id: string;
  therapist_name: string;
  session_date: string;
  session_type: "assessment" | "direct_therapy" | "consultation" | "review" | "training" | "home_visit";
  goals_set: number;
  goals_progressed: number;
  goals_achieved: number;
  recommendations_made: number;
  recommendations_implemented: number;
  staff_training_provided: boolean;
  next_session_date: string | null;
  session_overdue: boolean;
  report_provided: boolean;
  care_plan_updated: boolean;
  child_present: boolean;
  active: boolean;
  created_at: string;
}

export interface SelfRegulationInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor: string;
  baseline_score: number; // 1-10
  current_score: number; // 1-10
  target_score: number; // 1-10
  emotional_regulation_score: number; // 1-10
  sensory_regulation_score: number; // 1-10
  behavioural_regulation_score: number; // 1-10
  can_identify_triggers: boolean;
  can_request_help: boolean;
  can_use_strategies_independently: boolean;
  strategies_known_count: number;
  strategies_used_count: number;
  progress_trend: "improving" | "stable" | "declining" | "fluctuating";
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface SensoryDietInput {
  today: string;
  total_children: number;
  sensory_diet_plan_records: SensoryDietPlanInput[];
  regulation_strategy_records: RegulationStrategyInput[];
  sensory_break_records: SensoryBreakInput[];
  occupational_therapy_records: OccupationalTherapyInput[];
  self_regulation_records: SelfRegulationInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SensoryDietRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SensoryDietInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SensoryDietRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SensoryDietResult {
  sensory_diet_rating: SensoryDietRating;
  sensory_diet_score: number;
  headline: string;
  total_diet_plans: number;
  diet_plan_coverage_rate: number;
  strategy_effectiveness_rate: number;
  break_scheduling_rate: number;
  therapy_integration_rate: number;
  self_regulation_rate: number;
  child_progress_rate: number;
  strategy_effectiveness_avg: number;
  self_regulation_progress_avg: number;
  strengths: string[];
  concerns: string[];
  recommendations: SensoryDietRecommendation[];
  insights: SensoryDietInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SensoryDietRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: SensoryDietRating,
  score: number,
  headline: string,
): SensoryDietResult {
  return {
    sensory_diet_rating: rating,
    sensory_diet_score: score,
    headline,
    total_diet_plans: 0,
    diet_plan_coverage_rate: 0,
    strategy_effectiveness_rate: 0,
    break_scheduling_rate: 0,
    therapy_integration_rate: 0,
    self_regulation_rate: 0,
    child_progress_rate: 0,
    strategy_effectiveness_avg: 0,
    self_regulation_progress_avg: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeSensoryDietRegulation(
  input: SensoryDietInput,
): SensoryDietResult {
  const {
    total_children,
    sensory_diet_plan_records,
    regulation_strategy_records,
    sensory_break_records,
    occupational_therapy_records,
    self_regulation_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    sensory_diet_plan_records.length === 0 &&
    regulation_strategy_records.length === 0 &&
    sensory_break_records.length === 0 &&
    occupational_therapy_records.length === 0 &&
    self_regulation_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess sensory diet and regulation quality.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No sensory diet or regulation data recorded despite children on placement — sensory diet planning and regulation support require urgent attention.",
      ),
      concerns: [
        "No sensory diet plans, regulation strategies, sensory breaks, occupational therapy records, or self-regulation assessments exist despite children being on placement — the home cannot evidence individualised sensory diet and regulation support.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured sensory diet plans for all children to ensure each child has an individualised programme of sensory activities that supports their regulation needs throughout the day.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Care planning",
        },
        {
          rank: 2,
          recommendation:
            "Establish regulation strategy tracking and sensory break scheduling to ensure staff deliver consistent, evidence-based sensory support and that children's regulation progress is monitored and reviewed.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
        },
      ],
      insights: [
        {
          text: "The complete absence of sensory diet and regulation records means the home cannot demonstrate that children's sensory regulation needs are identified, planned for, or supported. Ofsted expects evidence that care planning addresses each child's individual needs, including sensory regulation, and that the home engages with occupational therapy and other specialist services where needed.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // ================================================================
  // SENSORY DIET PLAN COVERAGE
  // ================================================================

  const activeDietPlans = sensory_diet_plan_records.filter((p) => p.active);
  const totalDietPlans = sensory_diet_plan_records.length;
  const uniqueChildrenWithPlans = new Set(
    activeDietPlans.map((p) => p.child_id),
  ).size;
  const dietPlanCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithPlans, total_children) : 0;

  // --- Plan quality metrics ---
  const plansWithOT = activeDietPlans.filter((p) => p.ot_involved).length;
  const otInvolvementInPlanningRate = pct(plansWithOT, activeDietPlans.length);

  const plansChildParticipated = activeDietPlans.filter(
    (p) => p.child_participated_in_planning,
  ).length;
  const childParticipationInPlanningRate = pct(plansChildParticipated, activeDietPlans.length);

  const plansStaffTrained = activeDietPlans.filter(
    (p) => p.staff_trained_on_plan,
  ).length;
  const staffTrainedOnPlanRate = pct(plansStaffTrained, activeDietPlans.length);

  const plansAccessible = activeDietPlans.filter(
    (p) => p.plan_accessible_to_staff,
  ).length;
  const planAccessibilityRate = pct(plansAccessible, activeDietPlans.length);

  const totalActivitiesPrescribed = activeDietPlans.reduce(
    (sum, p) => sum + p.activities_prescribed,
    0,
  );
  const totalActivitiesImplemented = activeDietPlans.reduce(
    (sum, p) => sum + p.activities_implemented,
    0,
  );
  const activityImplementationRate = pct(totalActivitiesImplemented, totalActivitiesPrescribed);

  const overduePlanReviews = activeDietPlans.filter(
    (p) => p.review_overdue,
  ).length;
  const planReviewComplianceRate = activeDietPlans.length > 0
    ? pct(activeDietPlans.length - overduePlanReviews, activeDietPlans.length)
    : 0;

  const plansWithParentInfo = activeDietPlans.filter(
    (p) => p.parent_carer_informed,
  ).length;
  const parentInformedRate = pct(plansWithParentInfo, activeDietPlans.length);

  // ================================================================
  // REGULATION STRATEGY EFFECTIVENESS
  // ================================================================

  const totalStrategies = regulation_strategy_records.length;
  const activeStrategies = regulation_strategy_records.filter(
    (s) => s.active,
  );
  const totalActiveStrategies = activeStrategies.length;

  const effectiveStrategies = regulation_strategy_records.filter(
    (s) => s.effectiveness_rating >= 3,
  ).length;
  const strategyEffectivenessRate = pct(effectiveStrategies, totalStrategies);

  const strategyEffectivenessSum = regulation_strategy_records.reduce(
    (sum, s) => sum + s.effectiveness_rating,
    0,
  );
  const strategyEffectivenessAvg =
    totalStrategies > 0
      ? Math.round((strategyEffectivenessSum / totalStrategies) * 100) / 100
      : 0;

  const strategiesUsedIndependently = regulation_strategy_records.filter(
    (s) => s.used_independently_by_child && s.active,
  ).length;
  const independentUseRate = pct(strategiesUsedIndependently, totalActiveStrategies);

  const childEngagementSum = regulation_strategy_records.reduce(
    (sum, s) => sum + s.child_engagement_rating,
    0,
  );
  const childEngagementAvg =
    totalStrategies > 0
      ? Math.round((childEngagementSum / totalStrategies) * 100) / 100
      : 0;

  const staffConsistencySum = regulation_strategy_records.reduce(
    (sum, s) => sum + s.staff_consistency_rating,
    0,
  );
  const staffConsistencyAvg =
    totalStrategies > 0
      ? Math.round((staffConsistencySum / totalStrategies) * 100) / 100
      : 0;

  const totalOutcomes = regulation_strategy_records.reduce(
    (sum, s) => sum + s.positive_outcome_count + s.negative_outcome_count + s.neutral_outcome_count,
    0,
  );
  const totalPositiveOutcomes = regulation_strategy_records.reduce(
    (sum, s) => sum + s.positive_outcome_count,
    0,
  );
  const positiveOutcomeRate = pct(totalPositiveOutcomes, totalOutcomes);

  const overdueStrategyReviews = regulation_strategy_records.filter(
    (s) => s.review_overdue && s.active,
  ).length;

  const uniqueChildrenWithStrategies = new Set(
    activeStrategies.map((s) => s.child_id),
  ).size;
  const strategyChildCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithStrategies, total_children) : 0;

  // ================================================================
  // SENSORY BREAK SCHEDULING
  // ================================================================

  const totalBreaks = sensory_break_records.length;
  const scheduledBreaks = sensory_break_records.filter(
    (b) => b.scheduled,
  ).length;
  const breakSchedulingRate = pct(scheduledBreaks, totalBreaks);

  const breaksTimingAppropriate = sensory_break_records.filter(
    (b) => b.timing_appropriate,
  ).length;
  const timingAppropriateRate = pct(breaksTimingAppropriate, totalBreaks);

  const childRequestedBreaks = sensory_break_records.filter(
    (b) => b.child_requested,
  ).length;
  const childRequestedBreakRate = pct(childRequestedBreaks, totalBreaks);

  const breaksWithImprovement = sensory_break_records.filter(
    (b) => b.regulation_improved,
  ).length;
  const breakEffectivenessRate = pct(breaksWithImprovement, totalBreaks);

  const breaksReturnedToActivity = sensory_break_records.filter(
    (b) => b.returned_to_activity,
  ).length;
  const returnToActivityRate = pct(breaksReturnedToActivity, totalBreaks);

  const breakOutcomeSum = sensory_break_records.reduce(
    (sum, b) => sum + b.outcome_rating,
    0,
  );
  const breakOutcomeAvg =
    totalBreaks > 0
      ? Math.round((breakOutcomeSum / totalBreaks) * 100) / 100
      : 0;

  const breaksDocumented = sensory_break_records.filter(
    (b) => b.notes_recorded,
  ).length;
  const breakDocumentationRate = pct(breaksDocumented, totalBreaks);

  const uniqueChildrenWithBreaks = new Set(
    sensory_break_records.map((b) => b.child_id),
  ).size;
  const breakChildCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithBreaks, total_children) : 0;

  // ================================================================
  // OCCUPATIONAL THERAPY INTEGRATION
  // ================================================================

  const totalOTSessions = occupational_therapy_records.length;
  const activeOTRecords = occupational_therapy_records.filter(
    (o) => o.active,
  );

  const uniqueChildrenWithOT = new Set(
    occupational_therapy_records.map((o) => o.child_id),
  ).size;
  const therapyIntegrationRate =
    total_children > 0 ? pct(uniqueChildrenWithOT, total_children) : 0;

  const totalGoalsSet = occupational_therapy_records.reduce(
    (sum, o) => sum + o.goals_set,
    0,
  );
  const totalGoalsProgressed = occupational_therapy_records.reduce(
    (sum, o) => sum + o.goals_progressed,
    0,
  );
  const totalGoalsAchieved = occupational_therapy_records.reduce(
    (sum, o) => sum + o.goals_achieved,
    0,
  );
  const goalProgressRate = pct(totalGoalsProgressed + totalGoalsAchieved, totalGoalsSet);
  const goalAchievementRate = pct(totalGoalsAchieved, totalGoalsSet);

  const totalRecommendationsMade = occupational_therapy_records.reduce(
    (sum, o) => sum + o.recommendations_made,
    0,
  );
  const totalRecommendationsImplemented = occupational_therapy_records.reduce(
    (sum, o) => sum + o.recommendations_implemented,
    0,
  );
  const recommendationImplementationRate = pct(totalRecommendationsImplemented, totalRecommendationsMade);

  const sessionsWithStaffTraining = occupational_therapy_records.filter(
    (o) => o.staff_training_provided,
  ).length;
  const staffTrainingRate = pct(sessionsWithStaffTraining, totalOTSessions);

  const sessionsWithReport = occupational_therapy_records.filter(
    (o) => o.report_provided,
  ).length;
  const reportProvisionRate = pct(sessionsWithReport, totalOTSessions);

  const sessionsCarePlanUpdated = occupational_therapy_records.filter(
    (o) => o.care_plan_updated,
  ).length;
  const carePlanUpdateRate = pct(sessionsCarePlanUpdated, totalOTSessions);

  const sessionsChildPresent = occupational_therapy_records.filter(
    (o) => o.child_present,
  ).length;
  const childPresentRate = pct(sessionsChildPresent, totalOTSessions);

  const overdueOTSessions = occupational_therapy_records.filter(
    (o) => o.session_overdue && o.active,
  ).length;

  // ================================================================
  // SELF-REGULATION PROGRESS
  // ================================================================

  const totalSelfRegAssessments = self_regulation_records.length;

  const uniqueChildrenWithSelfReg = new Set(
    self_regulation_records.map((r) => r.child_id),
  ).size;

  // Self-regulation rate: children showing improvement (current > baseline)
  const childrenImproving = self_regulation_records.filter(
    (r) => r.current_score > r.baseline_score,
  ).length;
  const selfRegulationRate = pct(childrenImproving, totalSelfRegAssessments);

  // Progress toward target
  const selfRegProgressValues = self_regulation_records
    .filter((r) => r.target_score > r.baseline_score)
    .map((r) => {
      const range = r.target_score - r.baseline_score;
      const progress = r.current_score - r.baseline_score;
      return clamp(Math.round((progress / range) * 100), 0, 100);
    });
  const selfRegulationProgressAvg =
    selfRegProgressValues.length > 0
      ? Math.round(
          selfRegProgressValues.reduce((sum, v) => sum + v, 0) /
            selfRegProgressValues.length,
        )
      : 0;

  // Emotional, sensory, behavioural sub-scores
  const emotionalRegSum = self_regulation_records.reduce(
    (sum, r) => sum + r.emotional_regulation_score,
    0,
  );
  const emotionalRegAvg =
    totalSelfRegAssessments > 0
      ? Math.round((emotionalRegSum / totalSelfRegAssessments) * 100) / 100
      : 0;

  const sensoryRegSum = self_regulation_records.reduce(
    (sum, r) => sum + r.sensory_regulation_score,
    0,
  );
  const sensoryRegAvg =
    totalSelfRegAssessments > 0
      ? Math.round((sensoryRegSum / totalSelfRegAssessments) * 100) / 100
      : 0;

  const behaviouralRegSum = self_regulation_records.reduce(
    (sum, r) => sum + r.behavioural_regulation_score,
    0,
  );
  const behaviouralRegAvg =
    totalSelfRegAssessments > 0
      ? Math.round((behaviouralRegSum / totalSelfRegAssessments) * 100) / 100
      : 0;

  // Skills acquisition
  const canIdentifyTriggers = self_regulation_records.filter(
    (r) => r.can_identify_triggers,
  ).length;
  const triggerIdentificationRate = pct(canIdentifyTriggers, totalSelfRegAssessments);

  const canRequestHelp = self_regulation_records.filter(
    (r) => r.can_request_help,
  ).length;
  const helpRequestRate = pct(canRequestHelp, totalSelfRegAssessments);

  const canUseIndependently = self_regulation_records.filter(
    (r) => r.can_use_strategies_independently,
  ).length;
  const independentStrategyUseRate = pct(canUseIndependently, totalSelfRegAssessments);

  // Strategy knowledge vs usage
  const totalStrategiesKnown = self_regulation_records.reduce(
    (sum, r) => sum + r.strategies_known_count,
    0,
  );
  const totalStrategiesUsed = self_regulation_records.reduce(
    (sum, r) => sum + r.strategies_used_count,
    0,
  );
  const strategyUtilisationRate = pct(totalStrategiesUsed, totalStrategiesKnown);

  // Progress trend analysis
  const improvingChildren = self_regulation_records.filter(
    (r) => r.progress_trend === "improving",
  ).length;
  const stableChildren = self_regulation_records.filter(
    (r) => r.progress_trend === "stable",
  ).length;
  const decliningChildren = self_regulation_records.filter(
    (r) => r.progress_trend === "declining",
  ).length;
  const fluctuatingChildren = self_regulation_records.filter(
    (r) => r.progress_trend === "fluctuating",
  ).length;

  const overdueSelfRegReviews = self_regulation_records.filter(
    (r) => r.review_overdue,
  ).length;

  // ================================================================
  // CHILD PROGRESS RATE (composite)
  // ================================================================

  // Composite: children improving in self-reg + positive OT goal progress + strategy effectiveness
  const childProgressNumerator =
    childrenImproving +
    (totalGoalsAchieved > 0 ? Math.min(totalGoalsAchieved, totalGoalsSet) : 0) +
    effectiveStrategies;
  const childProgressDenominator =
    totalSelfRegAssessments + totalGoalsSet + totalStrategies;
  const childProgressRate = pct(childProgressNumerator, childProgressDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: dietPlanCoverageRate (>=100: +4, >=80: +2) ---
  if (dietPlanCoverageRate >= 100) score += 4;
  else if (dietPlanCoverageRate >= 80) score += 2;

  // --- Bonus 2: strategyEffectivenessRate (>=90: +5, >=70: +3) ---
  if (strategyEffectivenessRate >= 90) score += 5;
  else if (strategyEffectivenessRate >= 70) score += 3;

  // --- Bonus 3: breakSchedulingRate (>=80: +3, >=60: +1) ---
  if (breakSchedulingRate >= 80) score += 3;
  else if (breakSchedulingRate >= 60) score += 1;

  // --- Bonus 4: therapyIntegrationRate (>=80: +4, >=60: +2) ---
  if (therapyIntegrationRate >= 80) score += 4;
  else if (therapyIntegrationRate >= 60) score += 2;

  // --- Bonus 5: selfRegulationRate (>=90: +4, >=70: +2) ---
  if (selfRegulationRate >= 90) score += 4;
  else if (selfRegulationRate >= 70) score += 2;

  // --- Bonus 6: childProgressRate (>=80: +3, >=60: +1) ---
  if (childProgressRate >= 80) score += 3;
  else if (childProgressRate >= 60) score += 1;

  // --- Bonus 7: activityImplementationRate (>=90: +3, >=70: +1) ---
  if (activityImplementationRate >= 90) score += 3;
  else if (activityImplementationRate >= 70) score += 1;

  // --- Bonus 8: recommendationImplementationRate (>=90: +2, >=70: +1) ---
  if (recommendationImplementationRate >= 90) score += 2;
  else if (recommendationImplementationRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: dietPlanCoverageRate < 50 → -5
  if (dietPlanCoverageRate < 50 && sensory_diet_plan_records.length > 0) score -= 5;

  // Penalty 2: strategyEffectivenessRate < 40 → -5
  if (strategyEffectivenessRate < 40 && regulation_strategy_records.length > 0) score -= 5;

  // Penalty 3: therapyIntegrationRate < 30 → -4
  if (therapyIntegrationRate < 30 && occupational_therapy_records.length > 0) score -= 4;

  // Penalty 4: selfRegulationRate < 40 → -4
  if (selfRegulationRate < 40 && self_regulation_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const sensory_diet_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (dietPlanCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has an active sensory diet plan — the home demonstrates comprehensive planning for each child's sensory regulation needs throughout the day.",
    );
  } else if (dietPlanCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${dietPlanCoverageRate}% of children have active sensory diet plans — strong coverage ensuring the majority of children have individualised sensory programmes.`,
    );
  }

  if (strategyEffectivenessRate >= 90 && totalStrategies > 0) {
    strengths.push(
      `${strategyEffectivenessRate}% of regulation strategies are effective — the home's approach to supporting children's regulation is highly successful.`,
    );
  } else if (strategyEffectivenessRate >= 70 && totalStrategies > 0) {
    strengths.push(
      `${strategyEffectivenessRate}% of regulation strategies rated as effective — the majority of strategies are achieving positive regulation outcomes for children.`,
    );
  }

  if (breakSchedulingRate >= 80 && totalBreaks > 0) {
    strengths.push(
      `${breakSchedulingRate}% of sensory breaks are pre-scheduled — proactive scheduling demonstrates that the home anticipates and plans for children's regulation needs.`,
    );
  } else if (breakSchedulingRate >= 60 && totalBreaks > 0) {
    strengths.push(
      `${breakSchedulingRate}% of sensory breaks scheduled — good levels of proactive break planning to support children's regulation.`,
    );
  }

  if (therapyIntegrationRate >= 80 && total_children > 0) {
    strengths.push(
      `${therapyIntegrationRate}% of children have occupational therapy involvement — strong integration of specialist therapy into children's sensory support.`,
    );
  } else if (therapyIntegrationRate >= 60 && total_children > 0) {
    strengths.push(
      `${therapyIntegrationRate}% occupational therapy integration — good engagement with specialist services to inform sensory diet planning.`,
    );
  }

  if (selfRegulationRate >= 90 && totalSelfRegAssessments > 0) {
    strengths.push(
      `${selfRegulationRate}% of children showing improvement in self-regulation — children are making excellent progress in managing their own sensory and emotional regulation.`,
    );
  } else if (selfRegulationRate >= 70 && totalSelfRegAssessments > 0) {
    strengths.push(
      `${selfRegulationRate}% of children improving in self-regulation — the majority of children are developing greater capacity to manage their own regulation.`,
    );
  }

  if (childProgressRate >= 80) {
    strengths.push(
      `${childProgressRate}% overall child progress rate — children are making strong progress across sensory diet, therapy goals, and regulation strategies.`,
    );
  } else if (childProgressRate >= 60) {
    strengths.push(
      `${childProgressRate}% overall child progress — good levels of measurable improvement across sensory regulation domains.`,
    );
  }

  if (activityImplementationRate >= 90 && totalActivitiesPrescribed > 0) {
    strengths.push(
      `${activityImplementationRate}% of prescribed sensory diet activities are implemented — the home reliably delivers the sensory activities that have been planned for each child.`,
    );
  } else if (activityImplementationRate >= 70 && totalActivitiesPrescribed > 0) {
    strengths.push(
      `${activityImplementationRate}% activity implementation — the home generally delivers the sensory activities prescribed in children's diet plans.`,
    );
  }

  if (breakEffectivenessRate >= 80 && totalBreaks > 0) {
    strengths.push(
      `${breakEffectivenessRate}% of sensory breaks result in improved regulation — breaks are achieving their intended purpose of helping children return to a regulated state.`,
    );
  } else if (breakEffectivenessRate >= 60 && totalBreaks > 0) {
    strengths.push(
      `${breakEffectivenessRate}% break effectiveness — the majority of sensory breaks lead to measurable improvement in children's regulation.`,
    );
  }

  if (recommendationImplementationRate >= 90 && totalRecommendationsMade > 0) {
    strengths.push(
      `${recommendationImplementationRate}% of OT recommendations implemented — the home follows through comprehensively on professional guidance.`,
    );
  } else if (recommendationImplementationRate >= 70 && totalRecommendationsMade > 0) {
    strengths.push(
      `${recommendationImplementationRate}% OT recommendation implementation — good compliance with professional guidance from occupational therapy.`,
    );
  }

  if (independentUseRate >= 70 && totalActiveStrategies > 0) {
    strengths.push(
      `${independentUseRate}% of active strategies are used independently by children — children are developing genuine self-regulation skills, not just relying on staff support.`,
    );
  } else if (independentUseRate >= 50 && totalActiveStrategies > 0) {
    strengths.push(
      `${independentUseRate}% of strategies used independently — children are beginning to internalise regulation strategies and use them without prompting.`,
    );
  }

  if (childParticipationInPlanningRate >= 90 && activeDietPlans.length > 0) {
    strengths.push(
      "Children participate in planning their own sensory diets in the vast majority of cases — plans are genuinely co-produced and child-centred.",
    );
  } else if (childParticipationInPlanningRate >= 70 && activeDietPlans.length > 0) {
    strengths.push(
      `${childParticipationInPlanningRate}% child participation in sensory diet planning — good practice in involving children in decisions about their own sensory support.`,
    );
  }

  if (staffTrainedOnPlanRate >= 90 && activeDietPlans.length > 0) {
    strengths.push(
      "Staff are trained on sensory diet plans for nearly all children — consistent, informed delivery of sensory support across the team.",
    );
  }

  if (triggerIdentificationRate >= 80 && totalSelfRegAssessments > 0) {
    strengths.push(
      `${triggerIdentificationRate}% of children can identify their own sensory triggers — strong evidence that children are developing self-awareness about their regulation needs.`,
    );
  }

  if (positiveOutcomeRate >= 80 && totalOutcomes > 0) {
    strengths.push(
      `${positiveOutcomeRate}% positive outcome rate across all regulation strategy uses — strategies are consistently producing positive results in real-world situations.`,
    );
  }

  if (planReviewComplianceRate >= 100 && activeDietPlans.length > 0) {
    strengths.push(
      "All sensory diet plan reviews are up to date — the home ensures plans remain current and responsive to children's changing needs.",
    );
  } else if (planReviewComplianceRate >= 80 && activeDietPlans.length > 0) {
    strengths.push(
      `${planReviewComplianceRate}% of plan reviews on schedule — strong compliance with review timescales for sensory diet plans.`,
    );
  }

  if (carePlanUpdateRate >= 90 && totalOTSessions > 0) {
    strengths.push(
      `${carePlanUpdateRate}% of OT sessions result in care plan updates — therapy findings are consistently integrated into day-to-day care planning.`,
    );
  }

  if (childRequestedBreakRate >= 40 && totalBreaks > 0) {
    strengths.push(
      `${childRequestedBreakRate}% of sensory breaks are child-requested — children feel empowered and able to advocate for their own regulation needs.`,
    );
  }

  if (goalAchievementRate >= 70 && totalGoalsSet > 0) {
    strengths.push(
      `${goalAchievementRate}% of OT goals achieved — occupational therapy is delivering tangible outcomes for children's sensory development.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (dietPlanCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${dietPlanCoverageRate}% of children have active sensory diet plans — the majority of children lack individualised sensory programmes, meaning their regulation needs may go unsupported throughout the day.`,
    );
  } else if (dietPlanCoverageRate < 80 && dietPlanCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `Sensory diet plan coverage at ${dietPlanCoverageRate}% — some children still lack individualised sensory diet plans, which may result in inconsistent or inadequate sensory support.`,
    );
  }

  if (strategyEffectivenessRate < 40 && totalStrategies > 0) {
    concerns.push(
      `Only ${strategyEffectivenessRate}% of regulation strategies rated as effective — the majority of strategies are not achieving the desired regulation outcomes, suggesting a need for fundamental reassessment of the approach.`,
    );
  } else if (strategyEffectivenessRate < 70 && strategyEffectivenessRate >= 40 && totalStrategies > 0) {
    concerns.push(
      `Regulation strategy effectiveness at ${strategyEffectivenessRate}% — a significant proportion of strategies are not meeting children's regulation needs effectively.`,
    );
  }

  if (breakSchedulingRate < 40 && totalBreaks > 0) {
    concerns.push(
      `Only ${breakSchedulingRate}% of sensory breaks are pre-scheduled — most breaks are reactive rather than proactive, indicating the home is not anticipating children's regulation needs as part of daily planning.`,
    );
  } else if (breakSchedulingRate < 60 && breakSchedulingRate >= 40 && totalBreaks > 0) {
    concerns.push(
      `Break scheduling rate at ${breakSchedulingRate}% — many sensory breaks are not planned in advance, reducing their effectiveness as a proactive regulation tool.`,
    );
  }

  if (therapyIntegrationRate < 30 && total_children > 0 && totalOTSessions > 0) {
    concerns.push(
      `Only ${therapyIntegrationRate}% of children have occupational therapy involvement — most children are not receiving specialist sensory assessment and guidance, limiting the quality and appropriateness of sensory diet planning.`,
    );
  } else if (therapyIntegrationRate < 60 && therapyIntegrationRate >= 30 && total_children > 0) {
    concerns.push(
      `Occupational therapy integration at ${therapyIntegrationRate}% — not all children who may benefit from specialist sensory input are receiving it.`,
    );
  }

  if (selfRegulationRate < 40 && totalSelfRegAssessments > 0) {
    concerns.push(
      `Only ${selfRegulationRate}% of children showing self-regulation improvement — the majority of children are not making measurable progress in managing their own regulation, suggesting current approaches are insufficient.`,
    );
  } else if (selfRegulationRate < 70 && selfRegulationRate >= 40 && totalSelfRegAssessments > 0) {
    concerns.push(
      `Self-regulation improvement at ${selfRegulationRate}% — not all children are making expected progress in developing self-regulation skills.`,
    );
  }

  if (activityImplementationRate < 50 && totalActivitiesPrescribed > 0) {
    concerns.push(
      `Only ${activityImplementationRate}% of prescribed sensory diet activities implemented — the majority of planned sensory activities are not being delivered, undermining the effectiveness of sensory diet plans.`,
    );
  } else if (activityImplementationRate < 70 && activityImplementationRate >= 50 && totalActivitiesPrescribed > 0) {
    concerns.push(
      `Activity implementation at ${activityImplementationRate}% — some prescribed sensory diet activities are not being delivered, reducing plan effectiveness.`,
    );
  }

  if (recommendationImplementationRate < 50 && totalRecommendationsMade > 0) {
    concerns.push(
      `Only ${recommendationImplementationRate}% of OT recommendations implemented — the majority of professional guidance is not being followed through, wasting specialist input and leaving children without recommended support.`,
    );
  } else if (recommendationImplementationRate < 70 && recommendationImplementationRate >= 50 && totalRecommendationsMade > 0) {
    concerns.push(
      `OT recommendation implementation at ${recommendationImplementationRate}% — some professional recommendations are not being followed through, potentially leaving gaps in children's sensory support.`,
    );
  }

  if (breakEffectivenessRate < 40 && totalBreaks > 0) {
    concerns.push(
      `Only ${breakEffectivenessRate}% of sensory breaks result in improved regulation — most breaks are not achieving their purpose, suggesting break types, timing, or duration may not match children's needs.`,
    );
  } else if (breakEffectivenessRate < 60 && breakEffectivenessRate >= 40 && totalBreaks > 0) {
    concerns.push(
      `Sensory break effectiveness at ${breakEffectivenessRate}% — a notable proportion of breaks do not lead to improved regulation. Review break types and timing for individual children.`,
    );
  }

  if (overduePlanReviews > 0 && activeDietPlans.length > 0) {
    concerns.push(
      `${overduePlanReviews} sensory diet plan review${overduePlanReviews !== 1 ? "s are" : " is"} overdue — without timely reviews, plans may not reflect children's current sensory needs and regulation progress.`,
    );
  }

  if (overdueStrategyReviews > 0 && totalActiveStrategies > 0) {
    concerns.push(
      `${overdueStrategyReviews} active regulation strategy review${overdueStrategyReviews !== 1 ? "s are" : " is"} overdue — strategies must be reviewed regularly to confirm they remain appropriate and effective.`,
    );
  }

  if (overdueOTSessions > 0 && activeOTRecords.length > 0) {
    concerns.push(
      `${overdueOTSessions} occupational therapy session${overdueOTSessions !== 1 ? "s are" : " is"} overdue — delays in specialist input can stall children's progress and leave staff without updated guidance.`,
    );
  }

  if (overdueSelfRegReviews > 0 && totalSelfRegAssessments > 0) {
    concerns.push(
      `${overdueSelfRegReviews} self-regulation assessment review${overdueSelfRegReviews !== 1 ? "s are" : " is"} overdue — without current assessments, the home may not recognise changes in children's regulation capacity.`,
    );
  }

  if (staffConsistencyAvg < 3.0 && totalStrategies > 0) {
    concerns.push(
      `Staff consistency in delivering regulation strategies averages ${staffConsistencyAvg}/5 — inconsistent delivery undermines children's ability to rely on and internalise strategies.`,
    );
  }

  if (staffTrainedOnPlanRate < 60 && activeDietPlans.length > 0) {
    concerns.push(
      `Only ${staffTrainedOnPlanRate}% of sensory diet plans have staff trained to deliver them — without adequate staff training, plans cannot be implemented consistently or effectively.`,
    );
  }

  if (decliningChildren > 0 && totalSelfRegAssessments > 0) {
    concerns.push(
      `${decliningChildren} child${decliningChildren !== 1 ? "ren show" : " shows"} declining self-regulation — active deterioration in regulation capacity requires immediate review and potentially revised intervention.`,
    );
  }

  if (breakDocumentationRate < 60 && totalBreaks > 0) {
    concerns.push(
      `Sensory break documentation at only ${breakDocumentationRate}% — poor recording makes it difficult to evidence the purpose and effectiveness of sensory breaks or to identify patterns.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: SensoryDietRecommendation[] = [];
  let rank = 0;

  if (dietPlanCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently develop sensory diet plans for all children — every child must have an individualised programme of sensory activities that supports their regulation needs throughout the day. Engage occupational therapy to inform plan development.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (strategyEffectivenessRate < 40 && totalStrategies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and redesign regulation strategies that are not achieving positive outcomes — when the majority of strategies are ineffective, the home's approach needs fundamental reassessment with specialist occupational therapy input.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (selfRegulationRate < 40 && totalSelfRegAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review the sensory regulation programme — most children are not progressing in self-regulation, indicating the current approach requires fundamental change. Seek specialist assessment and revised intervention planning.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (therapyIntegrationRate < 30 && total_children > 0 && occupational_therapy_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase occupational therapy involvement across the home — most children lack specialist sensory assessment, which is essential for developing effective, evidence-based sensory diet plans. Review referral pathways and commissioning arrangements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (activityImplementationRate < 50 && totalActivitiesPrescribed > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the gap between prescribed and delivered sensory diet activities — less than half of planned activities are being implemented. Review staffing, training, and scheduling barriers to consistent delivery.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (recommendationImplementationRate < 50 && totalRecommendationsMade > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement outstanding OT recommendations as a priority — professional guidance that is not followed through represents wasted specialist input and leaves children without recommended support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (decliningChildren > 0 && totalSelfRegAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Immediately review support for ${decliningChildren} child${decliningChildren !== 1 ? "ren" : ""} with declining self-regulation — active deterioration requires urgent reassessment, revised strategies, and potentially increased specialist input.`,
      urgency: "immediate",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (staffConsistencyAvg < 3.0 && totalStrategies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve staff consistency in delivering regulation strategies — provide targeted training, visual prompts, and supervision to ensure all staff implement strategies reliably. Inconsistent delivery prevents children from developing trust in regulation approaches.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (staffTrainedOnPlanRate < 60 && activeDietPlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train all staff on each child's sensory diet plan — staff who are not trained on a child's plan cannot deliver it consistently or respond appropriately to the child's sensory needs. Include sensory diet training in induction and ongoing development.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (overduePlanReviews > 0 && activeDietPlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue sensory diet plan reviews — children's sensory needs evolve and plans must be kept current to ensure activities remain appropriate and effective.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (overdueOTSessions > 0 && activeOTRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reschedule overdue occupational therapy sessions — delays in specialist input may stall children's progress and leave staff without updated guidance on sensory diet delivery.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (dietPlanCoverageRate >= 50 && dietPlanCoverageRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend sensory diet plan coverage to all children — aim for 100% coverage to ensure every child has an individualised sensory programme that supports their daily regulation needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (strategyEffectivenessRate >= 40 && strategyEffectivenessRate < 70 && totalStrategies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review regulation strategies that are not achieving positive outcomes — consider whether different strategies, increased frequency, or better matching to individual sensory profiles would improve effectiveness.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (selfRegulationRate >= 40 && selfRegulationRate < 70 && totalSelfRegAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review self-regulation support for children not making expected progress — consider whether current strategies, frequency of sensory breaks, and therapy input are sufficient and appropriate for each individual child.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (breakSchedulingRate < 60 && totalBreaks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase proactive scheduling of sensory breaks — build breaks into children's daily routines based on their sensory diet plans rather than relying on reactive responses to dysregulation.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (therapyIntegrationRate >= 30 && therapyIntegrationRate < 60 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase occupational therapy access for children who may benefit — review each child's sensory profile and regulation progress to identify those who would benefit from specialist assessment and input.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (activityImplementationRate >= 50 && activityImplementationRate < 70 && totalActivitiesPrescribed > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve delivery of prescribed sensory diet activities — review barriers to implementation including staffing, time, resources, and staff confidence. Aim for at least 90% implementation to maximise plan effectiveness.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (breakDocumentationRate < 70 && totalBreaks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve documentation of sensory breaks — each break should have recorded notes detailing the trigger, type of break, duration, and outcome to evidence purposeful sensory support and identify patterns.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Care planning",
    });
  }

  if (childParticipationInPlanningRate < 70 && activeDietPlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child participation in sensory diet planning — children should be active partners in identifying what sensory activities help them regulate, ensuring plans are meaningful and motivating.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (recommendationImplementationRate >= 50 && recommendationImplementationRate < 70 && totalRecommendationsMade > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve follow-through on OT recommendations — establish a tracking system to ensure all professional recommendations are implemented within agreed timescales and their impact monitored.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (parentInformedRate < 70 && activeDietPlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure parents and carers are informed about children's sensory diet plans — sharing plans supports consistency between home and family contact, and demonstrates partnership working under Reg 5.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: SensoryDietInsight[] = [];

  // -- Critical insights --

  if (dietPlanCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${dietPlanCoverageRate}% of children have sensory diet plans. Without individualised sensory programmes, the home cannot demonstrate that each child's regulation needs are proactively planned for and supported throughout the day. Ofsted expects evidence that care planning addresses sensory needs under Reg 14.`,
      severity: "critical",
    });
  }

  if (strategyEffectivenessRate < 40 && totalStrategies > 0) {
    insights.push({
      text: `Only ${strategyEffectivenessRate}% of regulation strategies rated as effective. When the majority of strategies fail to support children's regulation, this indicates a systemic issue — strategies may not be appropriately matched to individual sensory profiles, staff may lack training in delivery, or the strategies may need specialist occupational therapy review.`,
      severity: "critical",
    });
  }

  if (selfRegulationRate < 40 && totalSelfRegAssessments > 0) {
    insights.push({
      text: `Only ${selfRegulationRate}% of children showing self-regulation improvement. Most children are not developing greater capacity to manage their own sensory and emotional regulation, which is a fundamental concern for their progress and long-term outcomes. The SCCIF explicitly evaluates whether children make progress in areas including self-regulation.`,
      severity: "critical",
    });
  }

  if (therapyIntegrationRate < 30 && total_children > 0 && occupational_therapy_records.length > 0) {
    insights.push({
      text: `Only ${therapyIntegrationRate}% of children have occupational therapy involvement. Children in residential care frequently have sensory processing differences that require specialist assessment and intervention. Without adequate OT input, sensory diet plans lack professional foundation and are less likely to be effective.`,
      severity: "critical",
    });
  }

  if (activityImplementationRate < 50 && totalActivitiesPrescribed > 0) {
    insights.push({
      text: `Only ${activityImplementationRate}% of prescribed sensory diet activities implemented. A significant gap between what is planned and what is delivered means children are not receiving the sensory input their plans identify as necessary. This undermines the purpose of care planning and may result in increased dysregulation.`,
      severity: "critical",
    });
  }

  if (decliningChildren > 0 && totalSelfRegAssessments > 0) {
    const decliningPct = pct(decliningChildren, totalSelfRegAssessments);
    insights.push({
      text: `${decliningChildren} child${decliningChildren !== 1 ? "ren" : ""} (${decliningPct}%) showing declining self-regulation. Active deterioration in regulation capacity is a serious concern that may be linked to placement instability, unmet sensory needs, or inadequate intervention. Each declining child requires immediate individual review.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (dietPlanCoverageRate >= 50 && dietPlanCoverageRate < 80 && total_children > 0) {
    insights.push({
      text: `Sensory diet plan coverage at ${dietPlanCoverageRate}% — improving but some children still lack a structured sensory programme. Each child without a plan may have unmet regulation needs that affect their behaviour, learning, and wellbeing throughout the day.`,
      severity: "warning",
    });
  }

  if (strategyEffectivenessRate >= 40 && strategyEffectivenessRate < 70 && totalStrategies > 0) {
    insights.push({
      text: `Strategy effectiveness at ${strategyEffectivenessRate}% — some strategies are not achieving the desired regulation outcomes. Consider whether strategies are appropriately matched to each child's sensory profile and whether staff are delivering them consistently.`,
      severity: "warning",
    });
  }

  if (selfRegulationRate >= 40 && selfRegulationRate < 70 && totalSelfRegAssessments > 0) {
    insights.push({
      text: `Self-regulation improvement at ${selfRegulationRate}% — not all children are making expected progress. Review whether interventions are appropriately intensive, whether OT goals are realistic, and whether staff are supporting children to practise strategies throughout the day.`,
      severity: "warning",
    });
  }

  if (breakSchedulingRate >= 40 && breakSchedulingRate < 60 && totalBreaks > 0) {
    insights.push({
      text: `Break scheduling at ${breakSchedulingRate}% — many breaks are reactive rather than proactive. Proactively scheduling sensory breaks based on each child's sensory diet plan helps prevent dysregulation rather than responding to it after the fact.`,
      severity: "warning",
    });
  }

  if (therapyIntegrationRate >= 30 && therapyIntegrationRate < 60 && total_children > 0) {
    insights.push({
      text: `Occupational therapy integration at ${therapyIntegrationRate}% — some children who may benefit from specialist sensory input are not receiving it. OT involvement is critical for evidence-based sensory diet planning and regulation strategy development.`,
      severity: "warning",
    });
  }

  if (staffConsistencyAvg >= 3.0 && staffConsistencyAvg < 4.0 && totalStrategies > 0) {
    insights.push({
      text: `Staff consistency in strategy delivery averages ${staffConsistencyAvg}/5 — room for improvement. Children need reliable, predictable delivery of regulation strategies to build trust in the approaches and internalise them over time.`,
      severity: "warning",
    });
  }

  if (overduePlanReviews > 0 && activeDietPlans.length > 0) {
    insights.push({
      text: `${overduePlanReviews} sensory diet plan review${overduePlanReviews !== 1 ? "s" : ""} overdue. Children's sensory needs change over time, and plans that are not regularly reviewed may prescribe activities that are no longer appropriate or sufficient.`,
      severity: "warning",
    });
  }

  if (overdueOTSessions > 0 && activeOTRecords.length > 0) {
    insights.push({
      text: `${overdueOTSessions} occupational therapy session${overdueOTSessions !== 1 ? "s" : ""} overdue. Gaps in specialist input can stall children's progress and leave staff without updated guidance on how to adapt sensory diet activities as children develop.`,
      severity: "warning",
    });
  }

  if (overdueSelfRegReviews > 0 && totalSelfRegAssessments > 0) {
    insights.push({
      text: `${overdueSelfRegReviews} self-regulation review${overdueSelfRegReviews !== 1 ? "s" : ""} overdue. Without current assessments, the home may not recognise improvements that could inform reduced support, or deterioration that requires intensified intervention.`,
      severity: "warning",
    });
  }

  if (recommendationImplementationRate >= 50 && recommendationImplementationRate < 70 && totalRecommendationsMade > 0) {
    insights.push({
      text: `OT recommendation implementation at ${recommendationImplementationRate}% — some professional guidance is not being followed through. Each unimplemented recommendation represents a missed opportunity to improve children's sensory support based on expert assessment.`,
      severity: "warning",
    });
  }

  if (fluctuatingChildren > 0 && totalSelfRegAssessments > 0) {
    const fluctuatingPct = pct(fluctuatingChildren, totalSelfRegAssessments);
    insights.push({
      text: `${fluctuatingChildren} child${fluctuatingChildren !== 1 ? "ren" : ""} (${fluctuatingPct}%) showing fluctuating self-regulation. Inconsistency in regulation progress may indicate environmental triggers, inconsistent strategy delivery, or the need for more intensive support during periods of instability.`,
      severity: "warning",
    });
  }

  if (activityImplementationRate >= 50 && activityImplementationRate < 70 && totalActivitiesPrescribed > 0) {
    insights.push({
      text: `Activity implementation at ${activityImplementationRate}% — some prescribed sensory activities are not being delivered. The gap between plan and delivery may be due to staffing, training, or resource barriers that need to be addressed to ensure plans are effective.`,
      severity: "warning",
    });
  }

  // Analysis of strategy types
  const strategyTypeCounts: Record<string, number> = {};
  for (const s of activeStrategies) {
    strategyTypeCounts[s.strategy_type] = (strategyTypeCounts[s.strategy_type] ?? 0) + 1;
  }
  const topStrategyTypes = Object.entries(strategyTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topStrategyTypes.length > 0 && totalActiveStrategies >= 3) {
    const typeStr = topStrategyTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Active regulation strategy types: ${typeStr}. A diverse strategy portfolio suggests the home matches approaches to individual children's sensory profiles rather than using a one-size-fits-all model.`,
      severity: "warning",
    });
  }

  // Analysis of break types
  const breakTypeCounts: Record<string, number> = {};
  for (const b of sensory_break_records) {
    breakTypeCounts[b.break_type] = (breakTypeCounts[b.break_type] ?? 0) + 1;
  }
  const topBreakTypes = Object.entries(breakTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topBreakTypes.length > 0 && totalBreaks >= 5) {
    const btStr = topBreakTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Most common sensory break types: ${btStr}. Ensure the range of break types available matches the diversity of children's sensory preferences and regulation needs.`,
      severity: "warning",
    });
  }

  // Analysis of OT session types
  const otSessionTypeCounts: Record<string, number> = {};
  for (const o of occupational_therapy_records) {
    otSessionTypeCounts[o.session_type] = (otSessionTypeCounts[o.session_type] ?? 0) + 1;
  }
  const topOTTypes = Object.entries(otSessionTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topOTTypes.length > 0 && totalOTSessions >= 3) {
    const otStr = topOTTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `OT session types: ${otStr}. A balanced mix of assessment, direct therapy, consultation, and training sessions indicates the home uses OT input strategically to build staff capacity alongside direct child support.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (sensory_diet_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding sensory diet and regulation intelligence — children have individualised sensory programmes, regulation strategies are effective, occupational therapy is well-integrated, and children are making strong progress in self-regulation. This is compelling evidence of high-quality, child-centred care planning under Reg 14.",
      severity: "positive",
    });
  }

  if (
    dietPlanCoverageRate >= 100 &&
    childParticipationInPlanningRate >= 90 &&
    total_children > 0 &&
    activeDietPlans.length > 0
  ) {
    insights.push({
      text: "Every child has a sensory diet plan with high levels of child participation — plans are genuinely co-produced, ensuring children feel ownership of their sensory regulation programme and are more likely to engage with prescribed activities.",
      severity: "positive",
    });
  }

  if (
    strategyEffectivenessRate >= 90 &&
    positiveOutcomeRate >= 80 &&
    totalStrategies > 0
  ) {
    insights.push({
      text: `${strategyEffectivenessRate}% strategy effectiveness with ${positiveOutcomeRate}% positive outcomes — regulation strategies are highly effective and consistently producing positive results. This level of effectiveness suggests strategies are well-matched to individual sensory profiles with consistent staff delivery.`,
      severity: "positive",
    });
  }

  if (
    selfRegulationRate >= 90 &&
    independentStrategyUseRate >= 70 &&
    totalSelfRegAssessments > 0
  ) {
    insights.push({
      text: `${selfRegulationRate}% of children improving in self-regulation with ${independentStrategyUseRate}% able to use strategies independently — children are not just receiving sensory support but genuinely developing the skills to regulate themselves. This is a powerful indicator of long-term positive outcomes.`,
      severity: "positive",
    });
  }

  if (
    therapyIntegrationRate >= 80 &&
    recommendationImplementationRate >= 90 &&
    total_children > 0 &&
    totalRecommendationsMade > 0
  ) {
    insights.push({
      text: `${therapyIntegrationRate}% OT integration with ${recommendationImplementationRate}% recommendation implementation — the home engages comprehensively with occupational therapy and follows through on professional guidance. This demonstrates strong multi-agency working under Reg 5.`,
      severity: "positive",
    });
  }

  if (
    breakSchedulingRate >= 80 &&
    breakEffectivenessRate >= 80 &&
    totalBreaks > 0
  ) {
    insights.push({
      text: `${breakSchedulingRate}% of breaks scheduled with ${breakEffectivenessRate}% effectiveness — sensory breaks are proactively planned and consistently achieve improved regulation. This demonstrates that the home anticipates children's sensory needs rather than simply reacting to dysregulation.`,
      severity: "positive",
    });
  }

  if (
    activityImplementationRate >= 90 &&
    staffTrainedOnPlanRate >= 90 &&
    totalActivitiesPrescribed > 0 &&
    activeDietPlans.length > 0
  ) {
    insights.push({
      text: `${activityImplementationRate}% of sensory diet activities delivered with ${staffTrainedOnPlanRate}% staff trained — the home translates plans into practice with high fidelity because staff are equipped with the knowledge to deliver each child's programme consistently.`,
      severity: "positive",
    });
  }

  if (
    triggerIdentificationRate >= 80 &&
    helpRequestRate >= 80 &&
    totalSelfRegAssessments > 0
  ) {
    insights.push({
      text: `${triggerIdentificationRate}% of children can identify triggers and ${helpRequestRate}% can request help — children are developing strong self-awareness and the confidence to advocate for their regulation needs. This reflects empowering, child-centred practice.`,
      severity: "positive",
    });
  }

  if (
    goalAchievementRate >= 70 &&
    carePlanUpdateRate >= 90 &&
    totalGoalsSet > 0 &&
    totalOTSessions > 0
  ) {
    insights.push({
      text: `${goalAchievementRate}% OT goal achievement with ${carePlanUpdateRate}% care plan integration — therapy goals are being achieved and findings are consistently fed back into day-to-day care planning, creating a virtuous cycle of specialist input and practical application.`,
      severity: "positive",
    });
  }

  if (
    staffConsistencyAvg >= 4.0 &&
    totalStrategies > 0
  ) {
    insights.push({
      text: `Staff consistency in strategy delivery averages ${staffConsistencyAvg}/5 — high consistency means children experience predictable, reliable regulation support from all staff, which is essential for building trust in sensory strategies and internalising them over time.`,
      severity: "positive",
    });
  }

  if (
    childRequestedBreakRate >= 40 &&
    independentUseRate >= 50 &&
    totalBreaks > 0 &&
    totalActiveStrategies > 0
  ) {
    insights.push({
      text: `${childRequestedBreakRate}% child-requested breaks and ${independentUseRate}% independent strategy use — children are becoming active agents in their own regulation, requesting support when needed and using strategies without adult prompting. This is excellent evidence of growing independence.`,
      severity: "positive",
    });
  }

  if (
    improvingChildren > 0 &&
    stableChildren > 0 &&
    decliningChildren === 0 &&
    totalSelfRegAssessments > 0
  ) {
    const improvingPct = pct(improvingChildren, totalSelfRegAssessments);
    const stablePct = pct(stableChildren, totalSelfRegAssessments);
    insights.push({
      text: `${improvingPct}% of children improving and ${stablePct}% stable with no children declining — the self-regulation trajectory across the home is entirely positive, with children either making gains or maintaining their current level. Zero decline is a strong indicator of effective, sustained sensory support.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (sensory_diet_rating === "outstanding") {
    headline =
      "Outstanding sensory diet and regulation support — children have individualised sensory programmes, effective regulation strategies, strong OT integration, and measurable self-regulation progress.";
  } else if (sensory_diet_rating === "good") {
    headline = `Good sensory diet and regulation support — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (sensory_diet_rating === "adequate") {
    headline = `Adequate sensory diet and regulation support — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's sensory regulation needs are fully met.`;
  } else {
    headline = `Sensory diet and regulation support is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children receive effective sensory regulation support.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    sensory_diet_rating,
    sensory_diet_score: score,
    headline,
    total_diet_plans: totalDietPlans,
    diet_plan_coverage_rate: dietPlanCoverageRate,
    strategy_effectiveness_rate: strategyEffectivenessRate,
    break_scheduling_rate: breakSchedulingRate,
    therapy_integration_rate: therapyIntegrationRate,
    self_regulation_rate: selfRegulationRate,
    child_progress_rate: childProgressRate,
    strategy_effectiveness_avg: strategyEffectivenessAvg,
    self_regulation_progress_avg: selfRegulationProgressAvg,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
