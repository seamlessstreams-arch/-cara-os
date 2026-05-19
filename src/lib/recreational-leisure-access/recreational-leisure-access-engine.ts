// ══════════════════════════════════════════════════════════════════════════════
// RECREATIONAL & LEISURE ACCESS INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well a children's residential
// home provides access to recreational activities, hobbies, sports clubs, and
// leisure opportunities for looked-after children.
//
// Regulatory basis:
//   - CHR 2015 Regulation 10 — Enjoyment and achievement
//   - CHR 2015 Regulation 12 — Health and wellbeing
//   - SCCIF — Experiences and progress of children
//   - NMS 10 — Leisure activities
//   - Children Act 1989 — Welfare of the child
//   - UNCRC Article 31 — Right to play and leisure
//   - Ofsted ILACS — Experiences of children in care
//
// No AI. No external calls. No randomness. No Date.now(). Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ActivityType =
  | "sports"
  | "arts_crafts"
  | "music"
  | "drama"
  | "outdoor_adventure"
  | "swimming"
  | "clubs_groups"
  | "cultural_visits";

export type ParticipationLevel =
  | "enthusiastic"
  | "willing"
  | "reluctant"
  | "refused"
  | "unable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ──────────────────────────────────────────────────

const activityTypeLabels: Record<ActivityType, string> = {
  sports: "Sports",
  arts_crafts: "Arts & Crafts",
  music: "Music",
  drama: "Drama",
  outdoor_adventure: "Outdoor Adventure",
  swimming: "Swimming",
  clubs_groups: "Clubs & Groups",
  cultural_visits: "Cultural Visits",
};

const participationLevelLabels: Record<ParticipationLevel, string> = {
  enthusiastic: "Enthusiastic",
  willing: "Willing",
  reluctant: "Reluctant",
  refused: "Refused",
  unable: "Unable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getActivityTypeLabel(type: ActivityType): string {
  return activityTypeLabels[type];
}

export function getParticipationLevelLabel(level: ParticipationLevel): string {
  return participationLevelLabels[level];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface LeisureActivity {
  id: string;
  childId: string;
  childName: string;
  activityDate: string; // ISO date
  activityType: ActivityType;
  participationLevel: ParticipationLevel;
  childEnjoyed: boolean;
  newSkillDeveloped: boolean;
  socialInteraction: boolean;
  staffSupported: boolean;
  accessBarrierFree: boolean;
  recordedInPlan: boolean;
}

export interface LeisurePolicy {
  id: string;
  activityProgramme: boolean;
  individualInterestPlans: boolean;
  inclusiveAccess: boolean;
  budgetAllocated: boolean;
  communityPartnerships: boolean;
  riskAssessmentProcess: boolean;
  regularReview: boolean;
}

export interface StaffLeisureTraining {
  id: string;
  staffId: string;
  staffName: string;
  activityPlanning: boolean;
  safeguardingInActivities: boolean;
  inclusionAwareness: boolean;
  firstAidOutdoors: boolean;
  youthEngagement: boolean;
  communityResources: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ActivityEngagementResult {
  totalActivities: number;
  enjoymentCount: number;
  enjoymentRate: number;
  participationCount: number;
  participationRate: number;
  socialInteractionCount: number;
  socialInteractionRate: number;
  newSkillCount: number;
  newSkillRate: number;
  recordedInPlanCount: number;
  recordedInPlanRate: number;
  score: number; // 0-25
}

export interface ActivityDiversityResult {
  totalActivities: number;
  uniqueActivityTypes: number;
  uniqueActivityTypeRatio: number;
  accessBarrierFreeCount: number;
  accessBarrierFreeRate: number;
  staffSupportCount: number;
  staffSupportRate: number;
  activityTypeBreakdown: Record<ActivityType, number>;
  score: number; // 0-25
}

export interface LeisurePolicyResult {
  policyProvided: boolean;
  activityProgramme: boolean;
  individualInterestPlans: boolean;
  inclusiveAccess: boolean;
  budgetAllocated: boolean;
  communityPartnerships: boolean;
  riskAssessmentProcess: boolean;
  regularReview: boolean;
  score: number; // 0-25
}

export interface StaffLeisureReadinessResult {
  totalStaff: number;
  activityPlanningCount: number;
  activityPlanningRate: number;
  safeguardingInActivitiesCount: number;
  safeguardingInActivitiesRate: number;
  inclusionAwarenessCount: number;
  inclusionAwarenessRate: number;
  firstAidOutdoorsCount: number;
  firstAidOutdoorsRate: number;
  youthEngagementCount: number;
  youthEngagementRate: number;
  communityResourcesCount: number;
  communityResourcesRate: number;
  score: number; // 0-25
}

export interface ChildLeisureProfile {
  childId: string;
  childName: string;
  totalActivities: number;
  enjoymentCount: number;
  participationCount: number;
  uniqueActivityTypes: number;
  score: number; // 0-10
}

export interface RecreationalLeisureAccessIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  activityEngagement: ActivityEngagementResult;
  activityDiversity: ActivityDiversityResult;
  leisurePolicy: LeisurePolicyResult;
  staffLeisureReadiness: StaffLeisureReadinessResult;

  childProfiles: ChildLeisureProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Core Function 1: Evaluate Activity Engagement (0-25) ─────────────────

export function evaluateActivityEngagement(
  activities: LeisureActivity[],
): ActivityEngagementResult {
  const totalActivities = activities.length;

  if (totalActivities === 0) {
    return {
      totalActivities: 0,
      enjoymentCount: 0,
      enjoymentRate: 0,
      participationCount: 0,
      participationRate: 0,
      socialInteractionCount: 0,
      socialInteractionRate: 0,
      newSkillCount: 0,
      newSkillRate: 0,
      recordedInPlanCount: 0,
      recordedInPlanRate: 0,
      score: 0,
    };
  }

  const enjoymentCount = activities.filter((a) => a.childEnjoyed).length;
  const enjoymentRate = pct(enjoymentCount, totalActivities);

  const participationCount = activities.filter(
    (a) => a.participationLevel === "enthusiastic" || a.participationLevel === "willing",
  ).length;
  const participationRate = pct(participationCount, totalActivities);

  const socialInteractionCount = activities.filter((a) => a.socialInteraction).length;
  const socialInteractionRate = pct(socialInteractionCount, totalActivities);

  const newSkillCount = activities.filter((a) => a.newSkillDeveloped).length;
  const newSkillRate = pct(newSkillCount, totalActivities);

  const recordedInPlanCount = activities.filter((a) => a.recordedInPlan).length;
  const recordedInPlanRate = pct(recordedInPlanCount, totalActivities);

  // Score (out of 25)
  // Enjoyment rate: max 7
  // Participation rate (enthusiastic+willing): max 6
  // Social interaction rate: max 6
  // Combined newSkill + recordedInPlan: max 6
  let score = 0;
  score += (enjoymentRate / 100) * 7;
  score += (participationRate / 100) * 6;
  score += (socialInteractionRate / 100) * 6;

  const combinedSkillPlanRate = pct(newSkillCount + recordedInPlanCount, totalActivities * 2);
  score += (combinedSkillPlanRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalActivities,
    enjoymentCount,
    enjoymentRate,
    participationCount,
    participationRate,
    socialInteractionCount,
    socialInteractionRate,
    newSkillCount,
    newSkillRate,
    recordedInPlanCount,
    recordedInPlanRate,
    score,
  };
}

// ── Core Function 2: Evaluate Activity Diversity (0-25) ──────────────────

export function evaluateActivityDiversity(
  activities: LeisureActivity[],
): ActivityDiversityResult {
  const totalActivities = activities.length;

  const emptyBreakdown: Record<ActivityType, number> = {
    sports: 0,
    arts_crafts: 0,
    music: 0,
    drama: 0,
    outdoor_adventure: 0,
    swimming: 0,
    clubs_groups: 0,
    cultural_visits: 0,
  };

  if (totalActivities === 0) {
    return {
      totalActivities: 0,
      uniqueActivityTypes: 0,
      uniqueActivityTypeRatio: 0,
      accessBarrierFreeCount: 0,
      accessBarrierFreeRate: 0,
      staffSupportCount: 0,
      staffSupportRate: 0,
      activityTypeBreakdown: emptyBreakdown,
      score: 0,
    };
  }

  // Activity type breakdown
  const activityTypeBreakdown: Record<ActivityType, number> = { ...emptyBreakdown };
  for (const a of activities) {
    activityTypeBreakdown[a.activityType]++;
  }

  const uniqueActivityTypes = Object.values(activityTypeBreakdown).filter((v) => v > 0).length;
  const totalPossibleTypes = 8;
  const uniqueActivityTypeRatio = pct(uniqueActivityTypes, totalPossibleTypes);

  const accessBarrierFreeCount = activities.filter((a) => a.accessBarrierFree).length;
  const accessBarrierFreeRate = pct(accessBarrierFreeCount, totalActivities);

  const staffSupportCount = activities.filter((a) => a.staffSupported).length;
  const staffSupportRate = pct(staffSupportCount, totalActivities);

  // Score (out of 25)
  // Unique activity types ratio (types out of 8): max 8
  // Access barrier free rate: max 9
  // Staff support rate: max 8
  let score = 0;
  score += (uniqueActivityTypeRatio / 100) * 8;
  score += (accessBarrierFreeRate / 100) * 9;
  score += (staffSupportRate / 100) * 8;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalActivities,
    uniqueActivityTypes,
    uniqueActivityTypeRatio,
    accessBarrierFreeCount,
    accessBarrierFreeRate,
    staffSupportCount,
    staffSupportRate,
    activityTypeBreakdown,
    score,
  };
}

// ── Core Function 3: Evaluate Leisure Policy (0-25) ──────────────────────

export function evaluateLeisurePolicy(
  policy: LeisurePolicy | null,
): LeisurePolicyResult {
  if (!policy) {
    return {
      policyProvided: false,
      activityProgramme: false,
      individualInterestPlans: false,
      inclusiveAccess: false,
      budgetAllocated: false,
      communityPartnerships: false,
      riskAssessmentProcess: false,
      regularReview: false,
      score: 0,
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.activityProgramme) score += 4;
  if (policy.individualInterestPlans) score += 4;
  if (policy.inclusiveAccess) score += 4;
  if (policy.budgetAllocated) score += 4;
  if (policy.communityPartnerships) score += 3;
  if (policy.riskAssessmentProcess) score += 3;
  if (policy.regularReview) score += 3;

  score = clamp(score, 0, 25);

  return {
    policyProvided: true,
    activityProgramme: policy.activityProgramme,
    individualInterestPlans: policy.individualInterestPlans,
    inclusiveAccess: policy.inclusiveAccess,
    budgetAllocated: policy.budgetAllocated,
    communityPartnerships: policy.communityPartnerships,
    riskAssessmentProcess: policy.riskAssessmentProcess,
    regularReview: policy.regularReview,
    score,
  };
}

// ── Core Function 4: Evaluate Staff Leisure Readiness (0-25) ─────────────

export function evaluateStaffLeisureReadiness(
  training: StaffLeisureTraining[],
): StaffLeisureReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      activityPlanningCount: 0,
      activityPlanningRate: 0,
      safeguardingInActivitiesCount: 0,
      safeguardingInActivitiesRate: 0,
      inclusionAwarenessCount: 0,
      inclusionAwarenessRate: 0,
      firstAidOutdoorsCount: 0,
      firstAidOutdoorsRate: 0,
      youthEngagementCount: 0,
      youthEngagementRate: 0,
      communityResourcesCount: 0,
      communityResourcesRate: 0,
      score: 0,
    };
  }

  const activityPlanningCount = training.filter((t) => t.activityPlanning).length;
  const activityPlanningRate = pct(activityPlanningCount, totalStaff);

  const safeguardingInActivitiesCount = training.filter((t) => t.safeguardingInActivities).length;
  const safeguardingInActivitiesRate = pct(safeguardingInActivitiesCount, totalStaff);

  const inclusionAwarenessCount = training.filter((t) => t.inclusionAwareness).length;
  const inclusionAwarenessRate = pct(inclusionAwarenessCount, totalStaff);

  const firstAidOutdoorsCount = training.filter((t) => t.firstAidOutdoors).length;
  const firstAidOutdoorsRate = pct(firstAidOutdoorsCount, totalStaff);

  const youthEngagementCount = training.filter((t) => t.youthEngagement).length;
  const youthEngagementRate = pct(youthEngagementCount, totalStaff);

  const communityResourcesCount = training.filter((t) => t.communityResources).length;
  const communityResourcesRate = pct(communityResourcesCount, totalStaff);

  // Score (out of 25)
  // 6 skills weighted: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (activityPlanningRate / 100) * 6;
  score += (safeguardingInActivitiesRate / 100) * 5;
  score += (inclusionAwarenessRate / 100) * 5;
  score += (firstAidOutdoorsRate / 100) * 4;
  score += (youthEngagementRate / 100) * 3;
  score += (communityResourcesRate / 100) * 2;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    totalStaff,
    activityPlanningCount,
    activityPlanningRate,
    safeguardingInActivitiesCount,
    safeguardingInActivitiesRate,
    inclusionAwarenessCount,
    inclusionAwarenessRate,
    firstAidOutdoorsCount,
    firstAidOutdoorsRate,
    youthEngagementCount,
    youthEngagementRate,
    communityResourcesCount,
    communityResourcesRate,
    score,
  };
}

// ── Build Child Leisure Profiles ────────────────────────────────────────

export function buildChildLeisureProfiles(
  activities: LeisureActivity[],
): ChildLeisureProfile[] {
  const childMap = new Map<string, { childId: string; childName: string }>();

  for (const a of activities) {
    if (!childMap.has(a.childId)) {
      childMap.set(a.childId, { childId: a.childId, childName: a.childName });
    }
  }

  return Array.from(childMap.values()).map((child) => {
    const childActivities = activities.filter((a) => a.childId === child.childId);
    const totalActivities = childActivities.length;

    const enjoymentCount = childActivities.filter((a) => a.childEnjoyed).length;
    const participationCount = childActivities.filter(
      (a) => a.participationLevel === "enthusiastic" || a.participationLevel === "willing",
    ).length;

    const uniqueTypes = new Set(childActivities.map((a) => a.activityType));
    const uniqueActivityTypes = uniqueTypes.size;

    // Score 0-10:
    // frequency (0-2): >=10 -> 2, >=5 -> 1, else 0
    // enjoyment (0-3): rate-based
    // participation (0-3): rate-based
    // diversity (0-2): >=5 unique types -> 2, >=3 -> 1, else 0
    let score = 0;

    // Frequency
    if (totalActivities >= 10) score += 2;
    else if (totalActivities >= 5) score += 1;

    // Enjoyment (0-3)
    if (totalActivities > 0) {
      score += (enjoymentCount / totalActivities) * 3;
    }

    // Participation (0-3)
    if (totalActivities > 0) {
      score += (participationCount / totalActivities) * 3;
    }

    // Diversity
    if (uniqueActivityTypes >= 5) score += 2;
    else if (uniqueActivityTypes >= 3) score += 1;

    score = clamp(Math.round(score * 10) / 10, 0, 10);

    return {
      childId: child.childId,
      childName: child.childName,
      totalActivities,
      enjoymentCount,
      participationCount,
      uniqueActivityTypes,
      score,
    };
  });
}

// ── Generate Recreational Leisure Access Intelligence ────────────────────

export function generateRecreationalLeisureAccessIntelligence(
  activities: LeisureActivity[],
  policy: LeisurePolicy | null,
  training: StaffLeisureTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): RecreationalLeisureAccessIntelligence {
  const assessedAt = new Date().toISOString();

  // Evaluate each layer
  const activityEngagement = evaluateActivityEngagement(activities);
  const activityDiversity = evaluateActivityDiversity(activities);
  const leisurePolicy = evaluateLeisurePolicy(policy);
  const staffLeisureReadiness = evaluateStaffLeisureReadiness(training);

  // Build child profiles
  const childProfiles = buildChildLeisureProfiles(activities);

  // Overall score (100 points)
  const rawScore =
    activityEngagement.score +
    activityDiversity.score +
    leisurePolicy.score +
    staffLeisureReadiness.score;
  const overallScore = clamp(Math.round(rawScore), 0, 100);

  const rating = getRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(
    activityEngagement,
    activityDiversity,
    activities,
    overallScore,
  );
  const areasForImprovement = aggregateAreasForImprovement(
    activityEngagement,
    activityDiversity,
    activities,
  );
  const actions = generateActions(
    activities,
    policy,
    training,
    activityEngagement,
  );
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    activityEngagement,
    activityDiversity,
    leisurePolicy,
    staffLeisureReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ────────────────────────────────────────────────────

function aggregateStrengths(
  engagement: ActivityEngagementResult,
  diversity: ActivityDiversityResult,
  activities: LeisureActivity[],
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall recreational and leisure access rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall recreational and leisure access rated Good (" + overallScore + "/100)");
  }

  if (engagement.enjoymentRate >= 80) {
    strengths.push("High enjoyment rate: " + engagement.enjoymentRate + "% of children enjoyed their activities");
  }

  if (engagement.participationRate >= 80) {
    strengths.push("Strong participation: " + engagement.participationRate + "% of activities had enthusiastic or willing participation");
  }

  if (diversity.uniqueActivityTypes >= 6) {
    strengths.push("Excellent activity diversity: " + diversity.uniqueActivityTypes + " different activity types offered");
  }

  if (engagement.socialInteractionRate >= 80) {
    strengths.push("Good social interaction: " + engagement.socialInteractionRate + "% of activities involved social engagement");
  }

  if (diversity.accessBarrierFreeRate >= 90) {
    strengths.push("Inclusive access: " + diversity.accessBarrierFreeRate + "% of activities are barrier-free");
  }

  if (diversity.staffSupportRate >= 90) {
    strengths.push("Consistent staff support: " + diversity.staffSupportRate + "% of activities had staff support");
  }

  return strengths;
}

// ── Aggregate Areas for Improvement ────────────────────────────────────────

function aggregateAreasForImprovement(
  engagement: ActivityEngagementResult,
  diversity: ActivityDiversityResult,
  activities: LeisureActivity[],
): string[] {
  const areas: string[] = [];

  if (engagement.totalActivities > 0 && engagement.enjoymentRate < 60) {
    areas.push("Enjoyment rate at " + engagement.enjoymentRate + "% — children may not be engaged in activities that match their interests");
  }

  if (engagement.totalActivities > 0 && engagement.participationRate < 60) {
    areas.push("Participation rate at " + engagement.participationRate + "% — many children are reluctant or refusing to participate");
  }

  if (diversity.uniqueActivityTypes < 4 && diversity.totalActivities > 0) {
    areas.push("Limited activity diversity: only " + diversity.uniqueActivityTypes + " activity type(s) offered — children need a wider range of opportunities");
  }

  if (engagement.totalActivities > 0 && engagement.socialInteractionRate < 50) {
    areas.push("Low social interaction rate (" + engagement.socialInteractionRate + "%) — activities should promote more peer engagement");
  }

  if (diversity.totalActivities > 0 && diversity.accessBarrierFreeRate < 70) {
    areas.push("Access barriers present in " + (100 - diversity.accessBarrierFreeRate) + "% of activities — review inclusivity");
  }

  return areas;
}

// ── Generate Actions ──────────────────────────────────────────────────────

function generateActions(
  activities: LeisureActivity[],
  policy: LeisurePolicy | null,
  training: StaffLeisureTraining[],
  engagement: ActivityEngagementResult,
): string[] {
  const actions: string[] = [];

  if (activities.length === 0) {
    actions.push("No leisure activity records found — begin recording all recreational activities immediately");
  }

  if (!policy) {
    actions.push("URGENT: No leisure activity policy in place — develop and implement a comprehensive recreational access policy");
  }

  if (training.length === 0) {
    actions.push("URGENT: No staff leisure training records — arrange leisure activity training for all staff");
  }

  if (engagement.totalActivities > 0 && engagement.enjoymentRate < 60) {
    actions.push("Review activity offerings: enjoyment rate at " + engagement.enjoymentRate + "% — consult children about their preferences");
  }

  if (engagement.totalActivities > 0 && engagement.participationRate < 60) {
    actions.push("Address participation barriers: only " + engagement.participationRate + "% of activities had willing participation");
  }

  if (actions.length === 0) {
    actions.push("Continue current recreational programme. Review individual interest plans quarterly.");
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 10 — Enjoyment and achievement",
    "CHR 2015 Regulation 12 — Health and wellbeing",
    "SCCIF — Experiences and progress of children",
    "NMS 10 — Leisure activities",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 31 — Right to play and leisure",
    "Ofsted ILACS — Experiences of children in care",
  ];
}
