// ==============================================================================
// Cornerstone Environmental Sustainability Intelligence Engine
//
// Evaluates how well a children's residential home promotes environmental
// awareness and sustainable practices, including recycling, energy
// conservation, and sustainability education.
//
// Regulatory basis:
//   - CHR 2015 Reg 10 (the health and well-being standard)
//   - CHR 2015 Reg 12 (the leadership and management standard)
//   - SCCIF (experiences and progress of children)
//   - NMS 10 (enjoying and achieving)
//   - Children Act 1989
//   - UNCRC Article 29 (education directed to the development of respect for the natural environment)
//   - Environment Act 2021
//
// Pure deterministic engine — no AI, no external calls.
// ==============================================================================

// -- Type Definitions ---------------------------------------------------------

export type ActivityType =
  | "recycling"
  | "energy_saving"
  | "gardening"
  | "composting"
  | "water_conservation"
  | "sustainable_shopping"
  | "nature_walk"
  | "environmental_project";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "partially_engaged"
  | "reluctant"
  | "refused";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface SustainabilityActivity {
  id: string;
  childId: string;
  childName: string;
  activityDate: string;
  activityType: ActivityType;
  engagementLevel: EngagementLevel;
  childInitiated: boolean;
  learningOutcomeRecorded: boolean;
  staffSupported: boolean;
}

export interface SustainabilityPolicy {
  id: string;
  recyclingScheme: boolean;
  energyReductionPlan: boolean;
  sustainableProcurement: boolean;
  environmentalEducation: boolean;
  gardenAccess: boolean;
  waterConservation: boolean;
  regularAudit: boolean;
}

export interface StaffSustainabilityTraining {
  id: string;
  staffId: string;
  staffName: string;
  environmentalAwareness: boolean;
  recyclingProcedures: boolean;
  energyConservation: boolean;
  sustainableLiving: boolean;
  childEngagement: boolean;
  outdoorLearning: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface ActivityEngagementResult {
  overallScore: number; // 0-25
  totalActivities: number;
  engagementRate: number; // pct
  childInitiatedRate: number; // pct
  learningRecordedRate: number; // pct
  staffSupportedRate: number; // pct
  engagementDistribution: Record<EngagementLevel, number>;
}

export interface EnvironmentalPracticeResult {
  overallScore: number; // 0-25
  totalActivities: number;
  activityTypeDiversity: number; // count of distinct types used
  activityTypeDistribution: Record<ActivityType, number>;
  frequencyScore: number; // activities per child
  sustainedEngagementRate: number; // pct of highly_engaged or engaged
}

export interface SustainabilityPolicyResult {
  overallScore: number; // 0-25
  recyclingScheme: boolean;
  energyReductionPlan: boolean;
  sustainableProcurement: boolean;
  environmentalEducation: boolean;
  gardenAccess: boolean;
  waterConservation: boolean;
  regularAudit: boolean;
  policiesInPlace: number;
}

export interface StaffReadinessResult {
  overallScore: number; // 0-25
  totalStaff: number;
  environmentalAwarenessRate: number; // pct
  recyclingProceduresRate: number; // pct
  energyConservationRate: number; // pct
  sustainableLivingRate: number; // pct
  childEngagementRate: number; // pct
  outdoorLearningRate: number; // pct
}

export interface ChildSustainabilityProfile {
  childId: string;
  childName: string;
  totalActivities: number;
  engagementScore: number; // 0-10
  childInitiatedRate: number; // pct
  learningRecordedRate: number; // pct
  activityTypeDiversity: number;
  overallScore: number; // 0-10
}

export interface EnvironmentalSustainabilityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100, capped
  rating: Rating;
  activityEngagement: ActivityEngagementResult;
  environmentalPractice: EnvironmentalPracticeResult;
  sustainabilityPolicy: SustainabilityPolicyResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildSustainabilityProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Label Maps ---------------------------------------------------------------

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  recycling: "Recycling",
  energy_saving: "Energy Saving",
  gardening: "Gardening",
  composting: "Composting",
  water_conservation: "Water Conservation",
  sustainable_shopping: "Sustainable Shopping",
  nature_walk: "Nature Walk",
  environmental_project: "Environmental Project",
};

const ENGAGEMENT_LEVEL_LABELS: Record<EngagementLevel, string> = {
  highly_engaged: "Highly Engaged",
  engaged: "Engaged",
  partially_engaged: "Partially Engaged",
  reluctant: "Reluctant",
  refused: "Refused",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label Functions ----------------------------------------------------------

export function getActivityTypeLabel(t: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[t] ?? t;
}

export function getEngagementLevelLabel(e: EngagementLevel): string {
  return ENGAGEMENT_LEVEL_LABELS[e] ?? e;
}

export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r] ?? r;
}

// -- Utility ------------------------------------------------------------------

export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluation Functions -----------------------------------------------------

/**
 * Evaluates activity engagement across children.
 * Scoring: engagement rate (0-7), child-initiated rate (0-6),
 * learning outcome recorded (0-6), staff supported (0-6).
 * Max score: 25. Empty data = 0.
 */
export function evaluateActivityEngagement(
  activities: SustainabilityActivity[],
): ActivityEngagementResult {
  const emptyEngagementDist: Record<EngagementLevel, number> = {
    highly_engaged: 0,
    engaged: 0,
    partially_engaged: 0,
    reluctant: 0,
    refused: 0,
  };

  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      engagementRate: 0,
      childInitiatedRate: 0,
      learningRecordedRate: 0,
      staffSupportedRate: 0,
      engagementDistribution: { ...emptyEngagementDist },
    };
  }

  const total = activities.length;

  // Engagement distribution
  const engagementDistribution = { ...emptyEngagementDist };
  for (const a of activities) {
    engagementDistribution[a.engagementLevel]++;
  }

  // Engagement rate: highly_engaged or engaged
  const engagedCount =
    engagementDistribution.highly_engaged + engagementDistribution.engaged;
  const engagementRate = pct(engagedCount, total);

  // Child-initiated rate
  const childInitiatedCount = activities.filter((a) => a.childInitiated).length;
  const childInitiatedRate = pct(childInitiatedCount, total);

  // Learning outcome recorded rate
  const learningRecordedCount = activities.filter(
    (a) => a.learningOutcomeRecorded,
  ).length;
  const learningRecordedRate = pct(learningRecordedCount, total);

  // Staff supported rate
  const staffSupportedCount = activities.filter(
    (a) => a.staffSupported,
  ).length;
  const staffSupportedRate = pct(staffSupportedCount, total);

  // Scoring
  let score = 0;

  // Engagement rate (0-7)
  if (engagementRate >= 80) score += 7;
  else if (engagementRate >= 60) score += 5;
  else if (engagementRate >= 40) score += 3;
  else if (engagementRate >= 20) score += 1;

  // Child-initiated rate (0-6)
  if (childInitiatedRate >= 80) score += 6;
  else if (childInitiatedRate >= 60) score += 4;
  else if (childInitiatedRate >= 40) score += 3;
  else if (childInitiatedRate >= 20) score += 1;

  // Learning outcome recorded (0-6)
  if (learningRecordedRate >= 80) score += 6;
  else if (learningRecordedRate >= 60) score += 4;
  else if (learningRecordedRate >= 40) score += 3;
  else if (learningRecordedRate >= 20) score += 1;

  // Staff supported (0-6)
  if (staffSupportedRate >= 80) score += 6;
  else if (staffSupportedRate >= 60) score += 4;
  else if (staffSupportedRate >= 40) score += 3;
  else if (staffSupportedRate >= 20) score += 1;

  return {
    overallScore: Math.max(0, Math.min(score, 25)),
    totalActivities: total,
    engagementRate,
    childInitiatedRate,
    learningRecordedRate,
    staffSupportedRate,
    engagementDistribution,
  };
}

/**
 * Evaluates environmental practice breadth and depth.
 * Scoring: activity type diversity (0-8), frequency (0-9),
 * sustained engagement (0-8).
 * Max score: 25. Empty data = 0.
 */
export function evaluateEnvironmentalPractice(
  activities: SustainabilityActivity[],
): EnvironmentalPracticeResult {
  const emptyTypeDist: Record<ActivityType, number> = {
    recycling: 0,
    energy_saving: 0,
    gardening: 0,
    composting: 0,
    water_conservation: 0,
    sustainable_shopping: 0,
    nature_walk: 0,
    environmental_project: 0,
  };

  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      activityTypeDiversity: 0,
      activityTypeDistribution: { ...emptyTypeDist },
      frequencyScore: 0,
      sustainedEngagementRate: 0,
    };
  }

  const total = activities.length;

  // Activity type distribution
  const activityTypeDistribution = { ...emptyTypeDist };
  for (const a of activities) {
    activityTypeDistribution[a.activityType]++;
  }

  // Diversity: count of distinct types used
  const activityTypeDiversity = Object.values(activityTypeDistribution).filter(
    (count) => count > 0,
  ).length;

  // Frequency: activities per unique child
  const uniqueChildren = new Set(activities.map((a) => a.childId));
  const frequencyScore =
    uniqueChildren.size > 0
      ? Math.round((total / uniqueChildren.size) * 10) / 10
      : 0;

  // Sustained engagement: pct of highly_engaged or engaged
  const sustainedCount = activities.filter(
    (a) =>
      a.engagementLevel === "highly_engaged" ||
      a.engagementLevel === "engaged",
  ).length;
  const sustainedEngagementRate = pct(sustainedCount, total);

  // Scoring
  let score = 0;

  // Activity type diversity (0-8) — 8 possible types
  if (activityTypeDiversity >= 7) score += 8;
  else if (activityTypeDiversity >= 5) score += 6;
  else if (activityTypeDiversity >= 3) score += 4;
  else if (activityTypeDiversity >= 1) score += 2;

  // Frequency: activities per child (0-9)
  if (frequencyScore >= 6) score += 9;
  else if (frequencyScore >= 4) score += 7;
  else if (frequencyScore >= 3) score += 5;
  else if (frequencyScore >= 2) score += 3;
  else if (frequencyScore >= 1) score += 1;

  // Sustained engagement (0-8)
  if (sustainedEngagementRate >= 80) score += 8;
  else if (sustainedEngagementRate >= 60) score += 6;
  else if (sustainedEngagementRate >= 40) score += 4;
  else if (sustainedEngagementRate >= 20) score += 2;

  return {
    overallScore: Math.max(0, Math.min(score, 25)),
    totalActivities: total,
    activityTypeDiversity,
    activityTypeDistribution,
    frequencyScore,
    sustainedEngagementRate,
  };
}

/**
 * Evaluates sustainability policy provisions.
 * Scoring: 7 booleans weighted 4+4+4+4+3+3+3 = 25.
 * Null policy = 0.
 */
export function evaluateSustainabilityPolicy(
  policy: SustainabilityPolicy | null,
): SustainabilityPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      recyclingScheme: false,
      energyReductionPlan: false,
      sustainableProcurement: false,
      environmentalEducation: false,
      gardenAccess: false,
      waterConservation: false,
      regularAudit: false,
      policiesInPlace: 0,
    };
  }

  let score = 0;

  // 4 points each (16 total)
  if (policy.recyclingScheme) score += 4;
  if (policy.energyReductionPlan) score += 4;
  if (policy.sustainableProcurement) score += 4;
  if (policy.environmentalEducation) score += 4;

  // 3 points each (9 total)
  if (policy.gardenAccess) score += 3;
  if (policy.waterConservation) score += 3;
  if (policy.regularAudit) score += 3;

  const policiesInPlace = [
    policy.recyclingScheme,
    policy.energyReductionPlan,
    policy.sustainableProcurement,
    policy.environmentalEducation,
    policy.gardenAccess,
    policy.waterConservation,
    policy.regularAudit,
  ].filter(Boolean).length;

  return {
    overallScore: Math.min(score, 25),
    recyclingScheme: policy.recyclingScheme,
    energyReductionPlan: policy.energyReductionPlan,
    sustainableProcurement: policy.sustainableProcurement,
    environmentalEducation: policy.environmentalEducation,
    gardenAccess: policy.gardenAccess,
    waterConservation: policy.waterConservation,
    regularAudit: policy.regularAudit,
    policiesInPlace,
  };
}

/**
 * Evaluates staff sustainability training readiness.
 * Scoring: 6 weighted booleans across all staff — averages then thresholds.
 * environmentalAwareness (0-6), recyclingProcedures (0-5),
 * energyConservation (0-5), sustainableLiving (0-4),
 * childEngagement (0-3), outdoorLearning (0-2). Total = 25.
 * Empty data = 0.
 */
export function evaluateStaffSustainabilityReadiness(
  training: StaffSustainabilityTraining[],
): StaffReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      environmentalAwarenessRate: 0,
      recyclingProceduresRate: 0,
      energyConservationRate: 0,
      sustainableLivingRate: 0,
      childEngagementRate: 0,
      outdoorLearningRate: 0,
    };
  }

  const total = training.length;

  const environmentalAwarenessCount = training.filter(
    (s) => s.environmentalAwareness,
  ).length;
  const environmentalAwarenessRate = pct(environmentalAwarenessCount, total);

  const recyclingProceduresCount = training.filter(
    (s) => s.recyclingProcedures,
  ).length;
  const recyclingProceduresRate = pct(recyclingProceduresCount, total);

  const energyConservationCount = training.filter(
    (s) => s.energyConservation,
  ).length;
  const energyConservationRate = pct(energyConservationCount, total);

  const sustainableLivingCount = training.filter(
    (s) => s.sustainableLiving,
  ).length;
  const sustainableLivingRate = pct(sustainableLivingCount, total);

  const childEngagementCount = training.filter(
    (s) => s.childEngagement,
  ).length;
  const childEngagementRate = pct(childEngagementCount, total);

  const outdoorLearningCount = training.filter(
    (s) => s.outdoorLearning,
  ).length;
  const outdoorLearningRate = pct(outdoorLearningCount, total);

  // Scoring
  let score = 0;

  // Environmental awareness (0-6)
  if (environmentalAwarenessRate >= 90) score += 6;
  else if (environmentalAwarenessRate >= 70) score += 4;
  else if (environmentalAwarenessRate >= 50) score += 3;
  else if (environmentalAwarenessRate >= 25) score += 1;

  // Recycling procedures (0-5)
  if (recyclingProceduresRate >= 90) score += 5;
  else if (recyclingProceduresRate >= 70) score += 4;
  else if (recyclingProceduresRate >= 50) score += 2;
  else if (recyclingProceduresRate >= 25) score += 1;

  // Energy conservation (0-5)
  if (energyConservationRate >= 90) score += 5;
  else if (energyConservationRate >= 70) score += 4;
  else if (energyConservationRate >= 50) score += 2;
  else if (energyConservationRate >= 25) score += 1;

  // Sustainable living (0-4)
  if (sustainableLivingRate >= 80) score += 4;
  else if (sustainableLivingRate >= 60) score += 3;
  else if (sustainableLivingRate >= 40) score += 2;
  else if (sustainableLivingRate >= 20) score += 1;

  // Child engagement (0-3)
  if (childEngagementRate >= 80) score += 3;
  else if (childEngagementRate >= 60) score += 2;
  else if (childEngagementRate >= 30) score += 1;

  // Outdoor learning (0-2)
  if (outdoorLearningRate >= 70) score += 2;
  else if (outdoorLearningRate >= 40) score += 1;

  return {
    overallScore: Math.max(0, Math.min(score, 25)),
    totalStaff: total,
    environmentalAwarenessRate,
    recyclingProceduresRate,
    energyConservationRate,
    sustainableLivingRate,
    childEngagementRate,
    outdoorLearningRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildSustainabilityProfiles(
  activities: SustainabilityActivity[],
): ChildSustainabilityProfile[] {
  const childMap = new Map<string, { id: string; name: string }>();
  for (const a of activities) {
    childMap.set(a.childId, { id: a.childId, name: a.childName });
  }

  return [...childMap.values()].map((child) => {
    const childActivities = activities.filter(
      (a) => a.childId === child.id,
    );

    const totalActivities = childActivities.length;

    // Engagement score (0-10)
    let engagementScore = 0;
    if (totalActivities > 0) {
      const highly = childActivities.filter(
        (a) => a.engagementLevel === "highly_engaged",
      ).length;
      const engaged = childActivities.filter(
        (a) => a.engagementLevel === "engaged",
      ).length;
      const partial = childActivities.filter(
        (a) => a.engagementLevel === "partially_engaged",
      ).length;

      // Weighted: highly_engaged=10, engaged=7, partially_engaged=4, reluctant=1, refused=0
      const weightedSum =
        highly * 10 + engaged * 7 + partial * 4 +
        childActivities.filter((a) => a.engagementLevel === "reluctant").length * 1;
      engagementScore =
        Math.round((weightedSum / totalActivities) * 10) / 10;
      engagementScore = Math.min(engagementScore, 10);
    }

    // Child-initiated rate
    const childInitiatedCount = childActivities.filter(
      (a) => a.childInitiated,
    ).length;
    const childInitiatedRate = pct(childInitiatedCount, totalActivities);

    // Learning recorded rate
    const learningCount = childActivities.filter(
      (a) => a.learningOutcomeRecorded,
    ).length;
    const learningRecordedRate = pct(learningCount, totalActivities);

    // Activity type diversity
    const types = new Set(childActivities.map((a) => a.activityType));
    const activityTypeDiversity = types.size;

    // Overall score (0-10)
    let overallScore = 0;

    // Activity count (up to 2 points)
    if (totalActivities >= 5) overallScore += 2;
    else if (totalActivities >= 2) overallScore += 1;

    // Engagement (up to 3 points)
    if (engagementScore >= 7) overallScore += 3;
    else if (engagementScore >= 4) overallScore += 2;
    else if (engagementScore >= 1) overallScore += 1;

    // Child initiated (up to 2 points)
    if (childInitiatedRate >= 60) overallScore += 2;
    else if (childInitiatedRate >= 30) overallScore += 1;

    // Activity diversity (up to 3 points)
    if (activityTypeDiversity >= 5) overallScore += 3;
    else if (activityTypeDiversity >= 3) overallScore += 2;
    else if (activityTypeDiversity >= 1) overallScore += 1;

    return {
      childId: child.id,
      childName: child.name,
      totalActivities,
      engagementScore,
      childInitiatedRate,
      learningRecordedRate,
      activityTypeDiversity,
      overallScore: Math.max(0, Math.min(overallScore, 10)),
    };
  });
}

// -- Strengths / Areas / Actions ----------------------------------------------

function generateStrengths(
  activity: ActivityEngagementResult,
  practice: EnvironmentalPracticeResult,
  policy: SustainabilityPolicyResult,
  staff: StaffReadinessResult,
): string[] {
  const strengths: string[] = [];

  if (activity.engagementRate >= 70) {
    strengths.push(
      "High engagement in sustainability activities — children are actively participating in environmental practices",
    );
  }

  if (activity.childInitiatedRate >= 60) {
    strengths.push(
      "Strong child-initiated sustainability — children are proactively engaging in environmental activities",
    );
  }

  if (activity.learningRecordedRate >= 70) {
    strengths.push(
      "Good recording of learning outcomes — environmental learning is being captured and built upon",
    );
  }

  if (activity.staffSupportedRate >= 70) {
    strengths.push(
      "Excellent staff support for sustainability activities — children benefit from guided environmental learning",
    );
  }

  if (practice.activityTypeDiversity >= 6) {
    strengths.push(
      "Broad range of sustainability activities — children experience diverse environmental practices",
    );
  }

  if (practice.sustainedEngagementRate >= 70) {
    strengths.push(
      "Sustained engagement levels are high — children are consistently motivated in environmental activities",
    );
  }

  if (policy.policiesInPlace >= 6) {
    strengths.push(
      "Comprehensive sustainability policies in place — the home demonstrates strong environmental commitment",
    );
  }

  if (policy.recyclingScheme && policy.energyReductionPlan) {
    strengths.push(
      "Core environmental policies established — recycling and energy reduction are embedded in home practice",
    );
  }

  if (policy.environmentalEducation && policy.gardenAccess) {
    strengths.push(
      "Environmental education is supported by garden access — children learn through hands-on experience",
    );
  }

  if (staff.environmentalAwarenessRate >= 80) {
    strengths.push(
      "High staff environmental awareness — team is well-equipped to model sustainable behaviour",
    );
  }

  if (staff.childEngagementRate >= 70) {
    strengths.push(
      "Staff are skilled in engaging children in sustainability — promoting active participation",
    );
  }

  if (staff.outdoorLearningRate >= 70) {
    strengths.push(
      "Good outdoor learning capability among staff — supporting nature-based environmental education",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  activity: ActivityEngagementResult,
  practice: EnvironmentalPracticeResult,
  policy: SustainabilityPolicyResult,
  staff: StaffReadinessResult,
): string[] {
  const areas: string[] = [];

  if (activity.totalActivities === 0) {
    areas.push(
      "No sustainability activities recorded — children must have regular access to environmental learning",
    );
  }

  if (activity.engagementRate < 50 && activity.totalActivities > 0) {
    areas.push(
      `Engagement rate at ${activity.engagementRate}% — more children need to be actively participating in sustainability activities`,
    );
  }

  if (activity.childInitiatedRate < 30 && activity.totalActivities > 0) {
    areas.push(
      `Child-initiated rate at ${activity.childInitiatedRate}% — encourage children to lead their own environmental projects`,
    );
  }

  if (activity.learningRecordedRate < 50 && activity.totalActivities > 0) {
    areas.push(
      `Learning outcomes recorded for only ${activity.learningRecordedRate}% of activities — ensure environmental learning is captured`,
    );
  }

  if (activity.staffSupportedRate < 50 && activity.totalActivities > 0) {
    areas.push(
      `Staff supported only ${activity.staffSupportedRate}% of activities — increase staff involvement in sustainability sessions`,
    );
  }

  if (practice.activityTypeDiversity < 4 && practice.totalActivities > 0) {
    areas.push(
      `Only ${practice.activityTypeDiversity} activity types used — broaden the range of environmental practices offered`,
    );
  }

  if (practice.sustainedEngagementRate < 50 && practice.totalActivities > 0) {
    areas.push(
      `Sustained engagement at ${practice.sustainedEngagementRate}% — consider how to maintain children's interest over time`,
    );
  }

  if (policy.policiesInPlace < 4) {
    areas.push(
      `Only ${policy.policiesInPlace} sustainability policies in place — develop a comprehensive environmental framework`,
    );
  }

  if (!policy.recyclingScheme) {
    areas.push(
      "No recycling scheme in place — implement a structured recycling programme for the home",
    );
  }

  if (!policy.energyReductionPlan) {
    areas.push(
      "No energy reduction plan — develop a plan to reduce the home's energy consumption",
    );
  }

  if (!policy.environmentalEducation) {
    areas.push(
      "No environmental education programme — embed sustainability learning into daily routines",
    );
  }

  if (staff.totalStaff === 0) {
    areas.push(
      "No staff sustainability training records found — training must be tracked and maintained",
    );
  }

  if (staff.environmentalAwarenessRate < 50 && staff.totalStaff > 0) {
    areas.push(
      `Environmental awareness training at ${staff.environmentalAwarenessRate}% — more staff need sustainability training`,
    );
  }

  if (staff.recyclingProceduresRate < 50 && staff.totalStaff > 0) {
    areas.push(
      `Recycling procedures training at ${staff.recyclingProceduresRate}% — ensure all staff understand recycling protocols`,
    );
  }

  if (staff.childEngagementRate < 50 && staff.totalStaff > 0) {
    areas.push(
      `Child engagement training at ${staff.childEngagementRate}% — staff need skills to involve children in sustainability`,
    );
  }

  return areas;
}

function generateActions(
  activity: ActivityEngagementResult,
  practice: EnvironmentalPracticeResult,
  policy: SustainabilityPolicyResult,
  staff: StaffReadinessResult,
): string[] {
  const actions: string[] = [];

  if (activity.totalActivities === 0) {
    actions.push(
      "URGENT: Develop and implement a sustainability activity programme — children must experience environmental learning regularly",
    );
  }

  if (policy.policiesInPlace === 0) {
    actions.push(
      "URGENT: Create an environmental sustainability policy — the home needs a clear framework for sustainable practices",
    );
  }

  if (staff.totalStaff === 0) {
    actions.push(
      "URGENT: Establish staff sustainability training records — environmental competencies must be tracked",
    );
  }

  if (!policy.recyclingScheme) {
    actions.push(
      "Implement a recycling scheme — set up clearly labelled bins and educate children about waste separation",
    );
  }

  if (!policy.energyReductionPlan) {
    actions.push(
      "Develop an energy reduction plan — identify areas for energy saving and involve children in monitoring usage",
    );
  }

  if (!policy.environmentalEducation) {
    actions.push(
      "Establish an environmental education programme — integrate sustainability learning into the weekly schedule",
    );
  }

  if (!policy.gardenAccess) {
    actions.push(
      "Provide garden access for children — create outdoor growing spaces for hands-on environmental learning",
    );
  }

  if (activity.childInitiatedRate < 30 && activity.totalActivities > 0) {
    actions.push(
      "Encourage child-led environmental projects — support children in designing and running their own sustainability initiatives",
    );
  }

  if (activity.learningRecordedRate < 50 && activity.totalActivities > 0) {
    actions.push(
      "Improve learning outcome recording — use simple templates to capture what children learn from each activity",
    );
  }

  if (practice.activityTypeDiversity < 4 && practice.totalActivities > 0) {
    actions.push(
      "Diversify sustainability activities — introduce composting, water conservation, and nature walks alongside existing practices",
    );
  }

  if (staff.environmentalAwarenessRate < 50 && staff.totalStaff > 0) {
    actions.push(
      "URGENT: Arrange environmental awareness training for all staff — sustainability competence is essential",
    );
  }

  if (staff.recyclingProceduresRate < 50 && staff.totalStaff > 0) {
    actions.push(
      "Train staff in recycling procedures — ensure consistent practice across all shifts",
    );
  }

  if (staff.childEngagementRate < 50 && staff.totalStaff > 0) {
    actions.push(
      "Develop staff skills in engaging children with sustainability — use workshops and peer learning",
    );
  }

  if (staff.outdoorLearningRate < 40 && staff.totalStaff > 0) {
    actions.push(
      "Invest in outdoor learning training for staff — equip the team to deliver nature-based activities confidently",
    );
  }

  return actions;
}

// -- Main Intelligence Function -----------------------------------------------

export function generateEnvironmentalSustainabilityIntelligence(
  activities: SustainabilityActivity[],
  policy: SustainabilityPolicy | null,
  training: StaffSustainabilityTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EnvironmentalSustainabilityIntelligence {
  const activityEngagement = evaluateActivityEngagement(activities);
  const environmentalPractice = evaluateEnvironmentalPractice(activities);
  const sustainabilityPolicy = evaluateSustainabilityPolicy(policy);
  const staffReadiness = evaluateStaffSustainabilityReadiness(training);

  const rawScore =
    activityEngagement.overallScore +
    environmentalPractice.overallScore +
    sustainabilityPolicy.overallScore +
    staffReadiness.overallScore;
  const overallScore = Math.max(0, Math.min(rawScore, 100));

  const childProfiles = buildChildSustainabilityProfiles(activities);

  const strengths = generateStrengths(
    activityEngagement,
    environmentalPractice,
    sustainabilityPolicy,
    staffReadiness,
  );
  const areasForImprovement = generateAreasForImprovement(
    activityEngagement,
    environmentalPractice,
    sustainabilityPolicy,
    staffReadiness,
  );
  const actions = generateActions(
    activityEngagement,
    environmentalPractice,
    sustainabilityPolicy,
    staffReadiness,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 10 — the health and well-being standard, including environmental factors affecting children's welfare",
    "CHR 2015 Reg 12 — the leadership and management standard, ensuring sustainability is embedded in home governance",
    "SCCIF — experiences and progress of children, including environmental awareness and sustainable living skills",
    "NMS 10 — enjoying and achieving, with environmental activities contributing to holistic development",
    "Children Act 1989 — duty to safeguard and promote the welfare of looked-after children, including a healthy environment",
    "UNCRC Article 29 — education directed to the development of respect for the natural environment",
    "Environment Act 2021 — national framework for environmental improvement, relevant to institutional sustainability",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating: getRating(overallScore),
    activityEngagement,
    environmentalPractice,
    sustainabilityPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
