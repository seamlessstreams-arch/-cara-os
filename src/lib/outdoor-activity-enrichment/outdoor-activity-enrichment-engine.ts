import { above, below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// Cara Outdoor Activity & Enrichment Intelligence Engine
//
// Evaluates the quality, breadth, and safety of outdoor activities and
// enrichment experiences provided to children in residential care.
//
// Regulatory basis:
//   - CHR 2015 Reg 6 (quality of care)
//   - CHR 2015 Reg 9 (enjoyment and achievement)
//   - NMS 12 (promoting positive behaviour through activity)
//   - SCCIF (experiences and progress of children)
//   - UNCRC Article 31 (right to rest, leisure, play)
//   - Working Together 2023
//   - CA 1989 s22(3)(a)
//
// Pure deterministic engine — no AI, no external calls.
// ==============================================================================

// -- Type Definitions ---------------------------------------------------------

export type ActivityCategory =
  | "outdoor_adventure"
  | "sports"
  | "creative_arts"
  | "cultural_visit"
  | "nature_environment"
  | "community_service"
  | "educational_trip"
  | "social_event"
  | "therapeutic_activity"
  | "life_skill_practice";

export type RiskBenefitOutcome =
  | "excellent"
  | "good"
  | "adequate"
  | "poor";

export type ChildEngagement =
  | "enthusiastic"
  | "willing"
  | "reluctant"
  | "refused"
  | "not_offered";

export type ActivityFrequency =
  | "daily"
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "termly"
  | "one_off";

export type WeatherCondition =
  | "good"
  | "mixed"
  | "poor"
  | "extreme";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface ActivityRecord {
  id: string;
  childId: string;
  childName: string;
  category: ActivityCategory;
  date: string;
  description: string;
  duration: number; // minutes
  location: string;
  staffLed: boolean;
  childChose: boolean;
  riskBenefitAssessed: boolean;
  riskBenefitOutcome: RiskBenefitOutcome | null;
  childEngagement: ChildEngagement;
  outdoors: boolean;
  communityBased: boolean;
  newExperience: boolean;
  peersInvolved: boolean;
}

export interface EnrichmentPlan {
  id: string;
  childId: string;
  childName: string;
  planDate: string;
  reviewDate: string | null;
  interestsIdentified: string[];
  activitiesPlanned: number;
  activitiesCompleted: number;
  childContributed: boolean;
  diverseRange: boolean;
  barrierIdentified: string | null;
  barrierAddressed: boolean | null;
}

export interface RiskBenefitAssessment {
  id: string;
  activityId: string;
  assessedBy: string;
  assessDate: string;
  hazardsIdentified: number;
  controlMeasures: number;
  benefitsArticulated: boolean;
  childViewSought: boolean;
  dynamicAssessment: boolean;
  outcome: RiskBenefitOutcome;
}

export interface StaffActivityTraining {
  id: string;
  staffId: string;
  staffName: string;
  firstAidCurrent: boolean;
  outdoorQualifications: string[];
  activityLeaderTrained: boolean;
  riskAssessmentTrained: boolean;
  safeguardingCurrent: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface ActivityParticipationResult {
  overallScore: number; // 0-25
  totalActivities: number;
  /** null when the population is empty — nothing measured, not 0%. */
  outdoorRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  communityRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  childChoiceRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  newExperienceRate: number | null; // pct
  averageDuration: number; // minutes
  categoryDistribution: Record<ActivityCategory, number>;
  engagementDistribution: Record<ChildEngagement, number>;
}

export interface EnrichmentQualityResult {
  overallScore: number; // 0-25
  totalPlans: number;
  /** null when the population is empty — nothing measured, not 0%. */
  currentPlanRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  completionRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  childContributionRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  diverseRangeRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  barriersAddressedRate: number | null; // pct
  averageActivitiesPlanned: number;
}

export interface RiskManagementResult {
  overallScore: number; // 0-25
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  assessmentRate: number | null; // pct of activities with risk assessments
  /** null when the population is empty — nothing measured, not 0%. */
  goodOrExcellentRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  childViewRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  dynamicAssessmentRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  benefitsArticulatedRate: number | null; // pct
  averageHazards: number;
}

export interface StaffReadinessResult {
  overallScore: number; // 0-25
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  firstAidRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  activityLeaderRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessmentTrainedRate: number | null; // pct
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingRate: number | null; // pct
  averageQualifications: number;
}

export interface ChildEnrichmentProfile {
  childId: string;
  childName: string;
  totalActivities: number;
  outdoorRate: number | null;
  choiceRate: number | null;
  engagementScore: number; // 0-10 based on engagement distribution
  planCompletionRate: number | null;
  overallScore: number; // 0-10
}

export interface OutdoorActivityEnrichmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100, capped
  rating: Rating;
  activityParticipation: ActivityParticipationResult;
  enrichmentQuality: EnrichmentQualityResult;
  riskManagement: RiskManagementResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildEnrichmentProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Label Maps ---------------------------------------------------------------

const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  outdoor_adventure: "Outdoor Adventure",
  sports: "Sports",
  creative_arts: "Creative Arts",
  cultural_visit: "Cultural Visit",
  nature_environment: "Nature & Environment",
  community_service: "Community Service",
  educational_trip: "Educational Trip",
  social_event: "Social Event",
  therapeutic_activity: "Therapeutic Activity",
  life_skill_practice: "Life Skill Practice",
};

const RISK_BENEFIT_OUTCOME_LABELS: Record<RiskBenefitOutcome, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
};

const CHILD_ENGAGEMENT_LABELS: Record<ChildEngagement, string> = {
  enthusiastic: "Enthusiastic",
  willing: "Willing",
  reluctant: "Reluctant",
  refused: "Refused",
  not_offered: "Not Offered",
};

const ACTIVITY_FREQUENCY_LABELS: Record<ActivityFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  termly: "Termly",
  one_off: "One-off",
};

const WEATHER_CONDITION_LABELS: Record<WeatherCondition, string> = {
  good: "Good",
  mixed: "Mixed",
  poor: "Poor",
  extreme: "Extreme",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label Functions ----------------------------------------------------------

export function getActivityCategoryLabel(c: ActivityCategory): string {
  return ACTIVITY_CATEGORY_LABELS[c] ?? c;
}

export function getRiskBenefitOutcomeLabel(o: RiskBenefitOutcome): string {
  return RISK_BENEFIT_OUTCOME_LABELS[o] ?? o;
}

export function getChildEngagementLabel(e: ChildEngagement): string {
  return CHILD_ENGAGEMENT_LABELS[e] ?? e;
}

export function getActivityFrequencyLabel(f: ActivityFrequency): string {
  return ACTIVITY_FREQUENCY_LABELS[f] ?? f;
}

export function getWeatherConditionLabel(w: WeatherCondition): string {
  return WEATHER_CONDITION_LABELS[w] ?? w;
}

export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r] ?? r;
}

// -- Utility ------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluation Functions -----------------------------------------------------

/**
 * Evaluates activity participation across children.
 * Scoring: outdoor rate (0-7), child choice rate (0-6), community rate (0-5),
 * new experience rate (0-4), engagement adjustments (max +3, -2 per refused where not_offered).
 * Max score: 25. Empty data = 0.
 */
export function evaluateActivityParticipation(
  activities: ActivityRecord[],
): ActivityParticipationResult {
  const emptyCategoryDist: Record<ActivityCategory, number> = {
    outdoor_adventure: 0, sports: 0, creative_arts: 0, cultural_visit: 0,
    nature_environment: 0, community_service: 0, educational_trip: 0,
    social_event: 0, therapeutic_activity: 0, life_skill_practice: 0,
  };
  const emptyEngagementDist: Record<ChildEngagement, number> = {
    enthusiastic: 0, willing: 0, reluctant: 0, refused: 0, not_offered: 0,
  };

  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      outdoorRate: null,
      communityRate: null,
      childChoiceRate: null,
      newExperienceRate: null,
      averageDuration: 0,
      categoryDistribution: { ...emptyCategoryDist },
      engagementDistribution: { ...emptyEngagementDist },
    };
  }

  const total = activities.length;

  // Rates
  const outdoorCount = activities.filter((a) => a.outdoors).length;
  const outdoorRate = rate(outdoorCount, total);

  const communityCount = activities.filter((a) => a.communityBased).length;
  const communityRate = rate(communityCount, total);

  const childChoiceCount = activities.filter((a) => a.childChose).length;
  const childChoiceRate = rate(childChoiceCount, total);

  const newExpCount = activities.filter((a) => a.newExperience).length;
  const newExperienceRate = rate(newExpCount, total);

  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
  const averageDuration = Math.round(totalDuration / total);

  // Category distribution
  const categoryDistribution = { ...emptyCategoryDist };
  for (const a of activities) {
    categoryDistribution[a.category]++;
  }

  // Engagement distribution
  const engagementDistribution = { ...emptyEngagementDist };
  for (const a of activities) {
    engagementDistribution[a.childEngagement]++;
  }

  // Scoring
  let score = 0;

  // Outdoor rate (0-7)
  if (meets(outdoorRate, 80)) score += 7;
  else if (meets(outdoorRate, 60)) score += 5;
  else if (meets(outdoorRate, 40)) score += 3;
  else if (meets(outdoorRate, 20)) score += 1;

  // Child choice rate (0-6)
  if (meets(childChoiceRate, 80)) score += 6;
  else if (meets(childChoiceRate, 60)) score += 4;
  else if (meets(childChoiceRate, 40)) score += 3;
  else if (meets(childChoiceRate, 20)) score += 1;

  // Community rate (0-5)
  if (meets(communityRate, 80)) score += 5;
  else if (meets(communityRate, 60)) score += 3;
  else if (meets(communityRate, 40)) score += 2;
  else if (meets(communityRate, 20)) score += 1;

  // New experience rate (0-4)
  if (meets(newExperienceRate, 60)) score += 4;
  else if (meets(newExperienceRate, 40)) score += 3;
  else if (meets(newExperienceRate, 20)) score += 2;
  else if (above(newExperienceRate, 0)) score += 1;

  // Engagement adjustments: -2 per refused (not not_offered), +1 per enthusiastic (max 3)
  const refusedCount = engagementDistribution.refused;
  score -= refusedCount * 2;

  const enthusiasticCount = engagementDistribution.enthusiastic;
  score += Math.min(enthusiasticCount, 3);

  return {
    overallScore: Math.max(0, Math.min(score, 25)),
    totalActivities: total,
    outdoorRate,
    communityRate,
    childChoiceRate,
    newExperienceRate,
    averageDuration,
    categoryDistribution,
    engagementDistribution,
  };
}

/**
 * Evaluates enrichment planning quality.
 * Scoring: plan completion rate (0-8), child contribution (0-6),
 * diverse range (0-5), barriers addressed (0-4), current plans (0-2).
 * Max score: 25. Empty data = 0.
 */
export function evaluateEnrichmentQuality(
  plans: EnrichmentPlan[],
): EnrichmentQualityResult {
  if (plans.length === 0) {
    return {
      overallScore: 0,
      totalPlans: 0,
      currentPlanRate: null,
      completionRate: null,
      childContributionRate: null,
      diverseRangeRate: null,
      barriersAddressedRate: null,
      averageActivitiesPlanned: 0,
    };
  }

  const total = plans.length;

  // Current plan rate (has a reviewDate)
  const currentPlans = plans.filter((p) => p.reviewDate !== null).length;
  const currentPlanRate = rate(currentPlans, total);

  // Completion rate (activitiesCompleted / activitiesPlanned across all plans)
  const totalPlanned = plans.reduce((sum, p) => sum + p.activitiesPlanned, 0);
  const totalCompleted = plans.reduce(
    (sum, p) => sum + p.activitiesCompleted,
    0,
  );
  const completionRate = rate(totalCompleted, totalPlanned);

  // Child contribution rate
  const childContrib = plans.filter((p) => p.childContributed).length;
  const childContributionRate = rate(childContrib, total);

  // Diverse range rate
  const diverseCount = plans.filter((p) => p.diverseRange).length;
  const diverseRangeRate = rate(diverseCount, total);

  // Barriers addressed rate (only among plans with barriers)
  const plansWithBarriers = plans.filter(
    (p) => p.barrierIdentified !== null,
  );
  const barriersAddressed = plansWithBarriers.filter(
    (p) => p.barrierAddressed === true,
  ).length;
  const barriersAddressedRate = rate(
    barriersAddressed,
    plansWithBarriers.length,
  );

  // Average activities planned
  const averageActivitiesPlanned = Math.round(totalPlanned / total);

  // Scoring
  let score = 0;

  // Plan completion rate (0-8)
  if (meets(completionRate, 90)) score += 8;
  else if (meets(completionRate, 75)) score += 6;
  else if (meets(completionRate, 50)) score += 4;
  else if (meets(completionRate, 25)) score += 2;

  // Child contribution (0-6)
  if (meets(childContributionRate, 90)) score += 6;
  else if (meets(childContributionRate, 70)) score += 4;
  else if (meets(childContributionRate, 50)) score += 3;
  else if (meets(childContributionRate, 25)) score += 1;

  // Diverse range (0-5)
  if (meets(diverseRangeRate, 80)) score += 5;
  else if (meets(diverseRangeRate, 60)) score += 3;
  else if (meets(diverseRangeRate, 40)) score += 2;
  else if (meets(diverseRangeRate, 20)) score += 1;

  // Barriers addressed (0-4)
  if (plansWithBarriers.length === 0) {
    // No barriers = full marks for this dimension
    score += 4;
  } else if (meets(barriersAddressedRate, 80)) {
    score += 4;
  } else if (meets(barriersAddressedRate, 60)) {
    score += 3;
  } else if (meets(barriersAddressedRate, 40)) {
    score += 2;
  } else if (meets(barriersAddressedRate, 20)) {
    score += 1;
  }

  // Current plans (0-2)
  if (meets(currentPlanRate, 80)) score += 2;
  else if (meets(currentPlanRate, 50)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalPlans: total,
    currentPlanRate,
    completionRate,
    childContributionRate,
    diverseRangeRate,
    barriersAddressedRate,
    averageActivitiesPlanned,
  };
}

/**
 * Evaluates risk management quality.
 * Scoring: assessment rate (0-8), good/excellent outcome (0-6),
 * child view sought (0-4), dynamic assessment (0-4), benefits articulated (0-3).
 * Max score: 25. Empty data = 0 (no assessments = bad).
 */
export function evaluateRiskManagement(
  assessments: RiskBenefitAssessment[],
  activities: ActivityRecord[],
): RiskManagementResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      assessmentRate: null,
      goodOrExcellentRate: null,
      childViewRate: null,
      dynamicAssessmentRate: null,
      benefitsArticulatedRate: null,
      averageHazards: 0,
    };
  }

  const total = assessments.length;

  // Assessment rate (pct of activities that have a risk assessment)
  const activitiesWithAssessment = activities.filter((a) =>
    a.riskBenefitAssessed,
  ).length;
  const assessmentRate = rate(activitiesWithAssessment, activities.length);

  // Good or excellent outcome rate
  const goodOrExcellent = assessments.filter(
    (a) => a.outcome === "good" || a.outcome === "excellent",
  ).length;
  const goodOrExcellentRate = rate(goodOrExcellent, total);

  // Child view sought rate
  const childView = assessments.filter((a) => a.childViewSought).length;
  const childViewRate = rate(childView, total);

  // Dynamic assessment rate
  const dynamic = assessments.filter((a) => a.dynamicAssessment).length;
  const dynamicAssessmentRate = rate(dynamic, total);

  // Benefits articulated rate
  const benefits = assessments.filter((a) => a.benefitsArticulated).length;
  const benefitsArticulatedRate = rate(benefits, total);

  // Average hazards
  const totalHazards = assessments.reduce(
    (sum, a) => sum + a.hazardsIdentified,
    0,
  );
  const averageHazards = Math.round((totalHazards / total) * 10) / 10;

  // Scoring
  let score = 0;

  // Assessment rate (0-8)
  if (meets(assessmentRate, 90)) score += 8;
  else if (meets(assessmentRate, 75)) score += 6;
  else if (meets(assessmentRate, 50)) score += 4;
  else if (meets(assessmentRate, 25)) score += 2;

  // Good/excellent outcome rate (0-6)
  if (meets(goodOrExcellentRate, 90)) score += 6;
  else if (meets(goodOrExcellentRate, 70)) score += 4;
  else if (meets(goodOrExcellentRate, 50)) score += 3;
  else if (meets(goodOrExcellentRate, 30)) score += 1;

  // Child view sought (0-4)
  if (meets(childViewRate, 80)) score += 4;
  else if (meets(childViewRate, 60)) score += 3;
  else if (meets(childViewRate, 40)) score += 2;
  else if (meets(childViewRate, 20)) score += 1;

  // Dynamic assessment (0-4)
  if (meets(dynamicAssessmentRate, 80)) score += 4;
  else if (meets(dynamicAssessmentRate, 60)) score += 3;
  else if (meets(dynamicAssessmentRate, 40)) score += 2;
  else if (meets(dynamicAssessmentRate, 20)) score += 1;

  // Benefits articulated (0-3)
  if (meets(benefitsArticulatedRate, 80)) score += 3;
  else if (meets(benefitsArticulatedRate, 60)) score += 2;
  else if (meets(benefitsArticulatedRate, 40)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalAssessments: total,
    assessmentRate,
    goodOrExcellentRate,
    childViewRate,
    dynamicAssessmentRate,
    benefitsArticulatedRate,
    averageHazards,
  };
}

/**
 * Evaluates staff readiness for outdoor and enrichment activities.
 * Scoring: first aid (0-8), activity leader trained (0-7),
 * risk assessment trained (0-5), safeguarding current (0-5).
 * Max score: 25. Empty data = 0.
 */
export function evaluateStaffReadiness(
  staff: StaffActivityTraining[],
): StaffReadinessResult {
  if (staff.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      firstAidRate: null,
      activityLeaderRate: null,
      riskAssessmentTrainedRate: null,
      safeguardingRate: null,
      averageQualifications: 0,
    };
  }

  const total = staff.length;

  // First aid rate
  const firstAidCount = staff.filter((s) => s.firstAidCurrent).length;
  const firstAidRate = rate(firstAidCount, total);

  // Activity leader rate
  const leaderCount = staff.filter((s) => s.activityLeaderTrained).length;
  const activityLeaderRate = rate(leaderCount, total);

  // Risk assessment trained rate
  const riskTrainedCount = staff.filter(
    (s) => s.riskAssessmentTrained,
  ).length;
  const riskAssessmentTrainedRate = rate(riskTrainedCount, total);

  // Safeguarding rate
  const safeguardingCount = staff.filter(
    (s) => s.safeguardingCurrent,
  ).length;
  const safeguardingRate = rate(safeguardingCount, total);

  // Average qualifications
  const totalQuals = staff.reduce(
    (sum, s) => sum + s.outdoorQualifications.length,
    0,
  );
  const averageQualifications =
    Math.round((totalQuals / total) * 10) / 10;

  // Scoring
  let score = 0;

  // First aid (0-8)
  if (meets(firstAidRate, 90)) score += 8;
  else if (meets(firstAidRate, 70)) score += 6;
  else if (meets(firstAidRate, 50)) score += 4;
  else if (meets(firstAidRate, 25)) score += 2;

  // Activity leader trained (0-7)
  if (meets(activityLeaderRate, 80)) score += 7;
  else if (meets(activityLeaderRate, 60)) score += 5;
  else if (meets(activityLeaderRate, 40)) score += 3;
  else if (meets(activityLeaderRate, 20)) score += 1;

  // Risk assessment trained (0-5)
  if (meets(riskAssessmentTrainedRate, 80)) score += 5;
  else if (meets(riskAssessmentTrainedRate, 60)) score += 3;
  else if (meets(riskAssessmentTrainedRate, 40)) score += 2;
  else if (meets(riskAssessmentTrainedRate, 20)) score += 1;

  // Safeguarding current (0-5)
  if (meets(safeguardingRate, 90)) score += 5;
  else if (meets(safeguardingRate, 70)) score += 3;
  else if (meets(safeguardingRate, 50)) score += 2;
  else if (meets(safeguardingRate, 25)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: total,
    firstAidRate,
    activityLeaderRate,
    riskAssessmentTrainedRate,
    safeguardingRate,
    averageQualifications,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildEnrichmentProfiles(
  activities: ActivityRecord[],
  plans: EnrichmentPlan[],
): ChildEnrichmentProfile[] {
  // Collect unique children from activities and plans
  const childMap = new Map<string, { id: string; name: string }>();
  for (const a of activities) {
    childMap.set(a.childId, { id: a.childId, name: a.childName });
  }
  for (const p of plans) {
    childMap.set(p.childId, { id: p.childId, name: p.childName });
  }

  return [...childMap.values()].map((child) => {
    const childActivities = activities.filter(
      (a) => a.childId === child.id,
    );
    const childPlans = plans.filter((p) => p.childId === child.id);

    const totalActivities = childActivities.length;

    // Outdoor rate
    const outdoorCount = childActivities.filter((a) => a.outdoors).length;
    const outdoorRate = rate(outdoorCount, totalActivities);

    // Choice rate
    const choiceCount = childActivities.filter((a) => a.childChose).length;
    const choiceRate = rate(choiceCount, totalActivities);

    // Engagement score (0-10 based on engagement distribution)
    let engagementScore = 0;
    if (totalActivities > 0) {
      const enthusiastic = childActivities.filter(
        (a) => a.childEngagement === "enthusiastic",
      ).length;
      const willing = childActivities.filter(
        (a) => a.childEngagement === "willing",
      ).length;
      const reluctant = childActivities.filter(
        (a) => a.childEngagement === "reluctant",
      ).length;
      const refused = childActivities.filter(
        (a) => a.childEngagement === "refused",
      ).length;

      // Weighted: enthusiastic=10, willing=7, reluctant=3, refused=0, not_offered=0
      const weightedSum =
        enthusiastic * 10 + willing * 7 + reluctant * 3 + refused * 0;
      engagementScore = Math.round((weightedSum / totalActivities) * 10) / 10;
      engagementScore = Math.min(engagementScore, 10);
    }

    // Plan completion rate
    const totalPlanned = childPlans.reduce(
      (sum, p) => sum + p.activitiesPlanned,
      0,
    );
    const totalCompleted = childPlans.reduce(
      (sum, p) => sum + p.activitiesCompleted,
      0,
    );
    const planCompletionRate = rate(totalCompleted, totalPlanned);

    // Overall score (0-10)
    let overallScore = 0;

    // Activity count (up to 2 points)
    if (totalActivities >= 5) overallScore += 2;
    else if (totalActivities >= 2) overallScore += 1;

    // Outdoor rate (up to 2 points)
    if (meets(outdoorRate, 60)) overallScore += 2;
    else if (meets(outdoorRate, 30)) overallScore += 1;

    // Choice rate (up to 2 points)
    if (meets(choiceRate, 60)) overallScore += 2;
    else if (meets(choiceRate, 30)) overallScore += 1;

    // Engagement (up to 2 points)
    if (engagementScore >= 7) overallScore += 2;
    else if (engagementScore >= 4) overallScore += 1;

    // Plan completion (up to 2 points)
    if (meets(planCompletionRate, 75)) overallScore += 2;
    else if (meets(planCompletionRate, 40)) overallScore += 1;

    return {
      childId: child.id,
      childName: child.name,
      totalActivities,
      outdoorRate,
      choiceRate,
      engagementScore,
      planCompletionRate,
      overallScore: Math.max(0, Math.min(overallScore, 10)),
    };
  });
}

// -- Strengths / Areas / Actions ----------------------------------------------

function generateStrengths(
  activity: ActivityParticipationResult,
  enrichment: EnrichmentQualityResult,
  risk: RiskManagementResult,
  staff: StaffReadinessResult,
): string[] {
  const strengths: string[] = [];

  if (meets(activity.outdoorRate, 70)) {
    strengths.push(
      "Strong outdoor activity provision — children regularly experience the outdoors",
    );
  }

  if (meets(activity.childChoiceRate, 70)) {
    strengths.push(
      "Excellent child choice rate — children are actively involved in selecting their activities",
    );
  }

  if (meets(activity.communityRate, 70)) {
    strengths.push(
      "High proportion of community-based activities — promoting genuine community integration",
    );
  }

  if (meets(activity.newExperienceRate, 50)) {
    strengths.push(
      "Good exposure to new experiences — children are being offered diverse opportunities",
    );
  }

  if (activity.engagementDistribution.enthusiastic > activity.engagementDistribution.reluctant + activity.engagementDistribution.refused) {
    strengths.push(
      "Positive engagement levels — most children are enthusiastic about their activities",
    );
  }

  if (meets(enrichment.completionRate, 80)) {
    strengths.push(
      "High enrichment plan completion rate — planned activities are being delivered consistently",
    );
  }

  if (meets(enrichment.childContributionRate, 80)) {
    strengths.push(
      "Children actively contribute to their enrichment plans — strong voice of the child",
    );
  }

  if (meets(enrichment.diverseRangeRate, 80)) {
    strengths.push(
      "Enrichment plans include a diverse range of activities — promoting holistic development",
    );
  }

  if (meets(risk.assessmentRate, 80)) {
    strengths.push(
      "Excellent risk-benefit assessment coverage — activities are properly assessed before delivery",
    );
  }

  if (meets(risk.goodOrExcellentRate, 80)) {
    strengths.push(
      "Risk-benefit outcomes are predominantly good or excellent — effective risk management in place",
    );
  }

  if (meets(risk.childViewRate, 70)) {
    strengths.push(
      "Children's views are sought in risk assessments — child-centred approach to safety",
    );
  }

  if (meets(risk.dynamicAssessmentRate, 70)) {
    strengths.push(
      "Dynamic risk assessment is well-embedded — staff adapt to changing conditions effectively",
    );
  }

  if (meets(staff.firstAidRate, 80)) {
    strengths.push(
      "High first aid coverage among staff — children's safety is well-supported",
    );
  }

  if (meets(staff.activityLeaderRate, 70)) {
    strengths.push(
      "Good proportion of activity-leader-trained staff — capable of leading a range of activities",
    );
  }

  if (meets(staff.safeguardingRate, 90)) {
    strengths.push(
      "All staff have current safeguarding training — robust safeguarding framework",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  activity: ActivityParticipationResult,
  enrichment: EnrichmentQualityResult,
  risk: RiskManagementResult,
  staff: StaffReadinessResult,
): string[] {
  const areas: string[] = [];

  if (activity.totalActivities === 0) {
    areas.push(
      "No activity records found — children must have regular access to enrichment activities",
    );
  }

  if (below(activity.outdoorRate, 40) && activity.totalActivities > 0) {
    areas.push(
      `Outdoor activity rate at ${activity.outdoorRate}% — more outdoor experiences are needed`,
    );
  }

  if (below(activity.childChoiceRate, 50) && activity.totalActivities > 0) {
    areas.push(
      `Child choice rate at ${activity.childChoiceRate}% — children should have greater say in activity selection`,
    );
  }

  if (below(activity.communityRate, 40) && activity.totalActivities > 0) {
    areas.push(
      `Only ${activity.communityRate}% of activities are community-based — more activities should take place outside the home`,
    );
  }

  if (below(activity.newExperienceRate, 20) && activity.totalActivities > 0) {
    areas.push(
      `New experience rate at ${activity.newExperienceRate}% — children need more exposure to new activities`,
    );
  }

  if (activity.engagementDistribution.refused > 0) {
    areas.push(
      `${activity.engagementDistribution.refused} activity refusal(s) recorded — explore underlying reasons and adapt provision`,
    );
  }

  if (enrichment.totalPlans === 0) {
    areas.push(
      "No enrichment plans recorded — each child should have an individualised enrichment plan",
    );
  }

  if (below(enrichment.completionRate, 50) && enrichment.totalPlans > 0) {
    areas.push(
      `Enrichment plan completion rate at ${enrichment.completionRate}% — planned activities need to be consistently delivered`,
    );
  }

  if (below(enrichment.childContributionRate, 50) && enrichment.totalPlans > 0) {
    areas.push(
      `Child contribution to plans at ${enrichment.childContributionRate}% — children should co-create their enrichment plans`,
    );
  }

  if (below(enrichment.diverseRangeRate, 50) && enrichment.totalPlans > 0) {
    areas.push(
      `Only ${enrichment.diverseRangeRate}% of plans include diverse activities — broader range of experiences needed`,
    );
  }

  if (risk.totalAssessments === 0) {
    areas.push(
      "No risk-benefit assessments recorded — all activities require proper risk-benefit assessment",
    );
  }

  if (below(risk.assessmentRate, 50) && risk.totalAssessments > 0) {
    areas.push(
      `Risk assessment coverage at ${risk.assessmentRate}% — more activities need formal risk-benefit assessment`,
    );
  }

  if (below(risk.childViewRate, 50) && risk.totalAssessments > 0) {
    areas.push(
      `Children's views sought in only ${risk.childViewRate}% of risk assessments — child voice must be central to risk management`,
    );
  }

  if (below(risk.dynamicAssessmentRate, 50) && risk.totalAssessments > 0) {
    areas.push(
      `Dynamic assessment used in only ${risk.dynamicAssessmentRate}% of cases — staff need to routinely adapt to changing conditions`,
    );
  }

  if (staff.totalStaff === 0) {
    areas.push(
      "No staff training records found — activity training must be tracked",
    );
  }

  if (below(staff.firstAidRate, 50) && staff.totalStaff > 0) {
    areas.push(
      `First aid coverage at ${staff.firstAidRate}% — more staff need current first aid certification`,
    );
  }

  if (below(staff.activityLeaderRate, 40) && staff.totalStaff > 0) {
    areas.push(
      `Activity leader training at ${staff.activityLeaderRate}% — more staff should be trained to lead activities`,
    );
  }

  if (below(staff.safeguardingRate, 80) && staff.totalStaff > 0) {
    areas.push(
      `Safeguarding currency at ${staff.safeguardingRate}% — all staff must have current safeguarding training`,
    );
  }

  return areas;
}

function generateActions(
  activity: ActivityParticipationResult,
  enrichment: EnrichmentQualityResult,
  risk: RiskManagementResult,
  staff: StaffReadinessResult,
): string[] {
  const actions: string[] = [];

  if (activity.totalActivities === 0) {
    actions.push(
      "URGENT: Develop and implement an activity programme — Reg 9 requires enrichment opportunities for every child",
    );
  }

  if (enrichment.totalPlans === 0) {
    actions.push(
      "URGENT: Create individualised enrichment plans for each child — plans must reflect interests and needs",
    );
  }

  if (risk.totalAssessments === 0) {
    actions.push(
      "URGENT: Implement risk-benefit assessment framework — all activities must be assessed before delivery",
    );
  }

  if (staff.totalStaff === 0) {
    actions.push(
      "URGENT: Establish staff activity training records — qualifications and currency must be tracked",
    );
  }

  if (below(staff.firstAidRate, 50) && staff.totalStaff > 0) {
    actions.push(
      "URGENT: Arrange first aid training — at least 50% of staff should hold current first aid certification",
    );
  }

  if (below(staff.safeguardingRate, 80) && staff.totalStaff > 0) {
    actions.push(
      "URGENT: Update safeguarding training — all staff leading activities must have current safeguarding certification",
    );
  }

  if (below(activity.outdoorRate, 40) && activity.totalActivities > 0) {
    actions.push(
      "Increase outdoor activity provision — schedule regular outdoor experiences each week",
    );
  }

  if (below(activity.childChoiceRate, 50) && activity.totalActivities > 0) {
    actions.push(
      "Enhance child choice — introduce activity menus and regular feedback sessions",
    );
  }

  if (below(activity.communityRate, 40) && activity.totalActivities > 0) {
    actions.push(
      "Expand community-based activities — identify local clubs, groups, and venues",
    );
  }

  if (below(enrichment.completionRate, 50) && enrichment.totalPlans > 0) {
    actions.push(
      "Improve enrichment plan delivery — review barriers to completion and allocate dedicated activity time",
    );
  }

  if (below(enrichment.childContributionRate, 50) && enrichment.totalPlans > 0) {
    actions.push(
      "Increase child participation in planning — use key-working sessions to co-create enrichment plans",
    );
  }

  if (below(risk.assessmentRate, 50) && risk.totalAssessments > 0) {
    actions.push(
      "Improve risk assessment coverage — embed risk-benefit assessment into the activity planning workflow",
    );
  }

  if (below(risk.childViewRate, 50) && risk.totalAssessments > 0) {
    actions.push(
      "Include children in risk assessments — seek their views on hazards, benefits, and controls",
    );
  }

  if (below(risk.dynamicAssessmentRate, 50) && risk.totalAssessments > 0) {
    actions.push(
      "Train staff in dynamic risk assessment — adapt to conditions on the day of activities",
    );
  }

  if (below(staff.activityLeaderRate, 40) && staff.totalStaff > 0) {
    actions.push(
      "Invest in activity leader training — equip staff to confidently lead outdoor and enrichment activities",
    );
  }

  return actions;
}

// -- Main Intelligence Function -----------------------------------------------

export function generateOutdoorActivityEnrichmentIntelligence(
  activities: ActivityRecord[],
  plans: EnrichmentPlan[],
  riskAssessments: RiskBenefitAssessment[],
  staff: StaffActivityTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): OutdoorActivityEnrichmentIntelligence {
  const activityResult = evaluateActivityParticipation(activities);
  const enrichmentResult = evaluateEnrichmentQuality(plans);
  const riskResult = evaluateRiskManagement(riskAssessments, activities);
  const staffResult = evaluateStaffReadiness(staff);

  const rawScore =
    activityResult.overallScore +
    enrichmentResult.overallScore +
    riskResult.overallScore +
    staffResult.overallScore;
  const overallScore = Math.max(0, Math.min(rawScore, 100));

  const childProfiles = buildChildEnrichmentProfiles(activities, plans);

  const strengths = generateStrengths(
    activityResult,
    enrichmentResult,
    riskResult,
    staffResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    activityResult,
    enrichmentResult,
    riskResult,
    staffResult,
  );
  const actions = generateActions(
    activityResult,
    enrichmentResult,
    riskResult,
    staffResult,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 6 — quality of care standard including enrichment and outdoor activities",
    "CHR 2015 Reg 9 — enjoyment and achievement through diverse activity provision",
    "NMS 12 — promoting positive behaviour and development through structured activity",
    "SCCIF — experiences and progress of children in enrichment and outdoor activity",
    "UNCRC Article 31 — right to rest, leisure, play, and recreational activities",
    "Working Together 2023 — multi-agency guidance supporting safe activity provision",
    "CA 1989 s22(3)(a) — duty to safeguard and promote the welfare of looked-after children",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating: getRating(overallScore),
    activityParticipation: activityResult,
    enrichmentQuality: enrichmentResult,
    riskManagement: riskResult,
    staffReadiness: staffResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
