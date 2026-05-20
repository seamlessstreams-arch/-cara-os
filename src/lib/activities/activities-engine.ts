/* ──────────────────────────────────────────────────────────────
   Activities & Enrichment Intelligence Engine

   Pure deterministic engine for evaluating how well a children's
   residential home supports enrichment activities — sports, arts,
   cultural, educational, and social participation for looked-after
   children, ensuring normalised childhood experiences.

   Regulatory basis:
     - CHR 2015 Reg 9  — Leisure, recreational and cultural activities
     - CHR 2015 Reg 5  — Quality and purpose of care (normalcy)
     - SCCIF            — Experiences and progress of children
     - Children Act 1989 — Welfare and development
     - UNCRC Article 31 — Right to rest, leisure, play, recreation, culture
     - DfE Guidance     — Promoting positive outcomes through activities
     - NMS 9            — Leisure activities

   No AI. No external calls. Pure input -> output.

   Scoring breakdown (0-100):
     Activity quality:       25 — choice, age-appropriateness, inclusion, enjoyment
     Activity compliance:    25 — documentation, risk assessment, child choice, diversity
     Activity policy:        25 — 7 policy components weighted 4+4+4+4+3+3+3
     Staff activity readiness: 25 — 6 skills weighted 6+5+5+4+3+2
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type ActivityCategory =
  | "sport_physical"
  | "creative_arts"
  | "cultural_heritage"
  | "educational_enrichment"
  | "social_recreational"
  | "outdoor_adventure"
  | "community_involvement"
  | "therapeutic_activity";

export type ActivityOutcome =
  | "completed"
  | "partially_completed"
  | "not_completed"
  | "cancelled"
  | "rescheduled";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const activityCategoryLabels: Record<ActivityCategory, string> = {
  sport_physical: "Sport & Physical",
  creative_arts: "Creative Arts",
  cultural_heritage: "Cultural & Heritage",
  educational_enrichment: "Educational Enrichment",
  social_recreational: "Social & Recreational",
  outdoor_adventure: "Outdoor & Adventure",
  community_involvement: "Community Involvement",
  therapeutic_activity: "Therapeutic Activity",
};

const activityOutcomeLabels: Record<ActivityOutcome, string> = {
  completed: "Completed",
  partially_completed: "Partially Completed",
  not_completed: "Not Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getActivityCategoryLabel(category: ActivityCategory): string {
  return activityCategoryLabels[category];
}

export function getActivityOutcomeLabel(outcome: ActivityOutcome): string {
  return activityOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ActivityRecord {
  id: string;
  childId: string;
  childName: string;
  activityDate: string;
  category: ActivityCategory;
  childChoiceOffered: boolean;
  ageAppropriate: boolean;
  inclusiveParticipation: boolean;
  enjoymentRecorded: boolean;
  documentationComplete: boolean;
  riskAssessed: boolean;
}

export interface ActivityPolicy {
  id: string;
  activitiesPolicy: boolean;
  inclusionFramework: boolean;
  riskAssessmentProtocol: boolean;
  childParticipationGuidance: boolean;
  communityEngagementStrategy: boolean;
  budgetAllocationPolicy: boolean;
  reviewSchedule: boolean;
}

export interface StaffActivityTraining {
  id: string;
  staffId: string;
  staffName: string;
  activityPlanning: boolean;
  safeguardingAwareness: boolean;
  inclusionSkills: boolean;
  riskManagement: boolean;
  communityLinks: boolean;
  firstAid: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ActivityQualityResult {
  totalRecords: number;
  childChoiceRate: number;
  ageAppropriateRate: number;
  inclusiveRate: number;
  enjoymentRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ActivityComplianceResult {
  totalRecords: number;
  documentationRate: number;
  riskAssessedRate: number;
  childChoiceRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ActivityPolicyResult {
  activitiesPolicy: boolean;
  inclusionFramework: boolean;
  riskAssessmentProtocol: boolean;
  childParticipationGuidance: boolean;
  communityEngagementStrategy: boolean;
  budgetAllocationPolicy: boolean;
  reviewSchedule: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface StaffActivityReadinessResult {
  totalStaff: number;
  activityPlanningRate: number;
  safeguardingAwarenessRate: number;
  inclusionSkillsRate: number;
  riskManagementRate: number;
  communityLinksRate: number;
  firstAidRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildActivityProfile {
  childId: string;
  childName: string;
  totalActivities: number;
  childChoiceRate: number;
  enjoymentRate: number;
  uniqueCategories: number;
  activityScore: number;
}

export interface ActivitiesIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  activityQuality: ActivityQualityResult;
  activityCompliance: ActivityComplianceResult;
  activityPolicy: ActivityPolicyResult;
  staffReadiness: StaffActivityReadinessResult;
  childProfiles: ChildActivityProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────

const ALL_CATEGORIES: ActivityCategory[] = [
  "sport_physical",
  "creative_arts",
  "cultural_heritage",
  "educational_enrichment",
  "social_recreational",
  "outdoor_adventure",
  "community_involvement",
  "therapeutic_activity",
];

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Evaluator 1: Activity Quality (0-25) ─────────────────────────────────

export function evaluateActivityQuality(
  records: ActivityRecord[],
): ActivityQualityResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      childChoiceRate: 0,
      ageAppropriateRate: 0,
      inclusiveRate: 0,
      enjoymentRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No activity records — quality cannot be assessed"],
    };
  }

  const childChoiceCount = records.filter((r) => r.childChoiceOffered).length;
  const childChoiceRate = pct(childChoiceCount, totalRecords);

  const ageAppropriateCount = records.filter((r) => r.ageAppropriate).length;
  const ageAppropriateRate = pct(ageAppropriateCount, totalRecords);

  const inclusiveCount = records.filter((r) => r.inclusiveParticipation).length;
  const inclusiveRate = pct(inclusiveCount, totalRecords);

  const enjoymentCount = records.filter((r) => r.enjoymentRecorded).length;
  const enjoymentRate = pct(enjoymentCount, totalRecords);

  // Weights: childChoiceRate 7 + ageAppropriateRate 6 + inclusiveRate 6 + enjoymentRate 6 = 25
  let score = 0;
  score += (childChoiceRate / 100) * 7;
  score += (ageAppropriateRate / 100) * 6;
  score += (inclusiveRate / 100) * 6;
  score += (enjoymentRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (childChoiceRate >= 80) {
    strengths.push("Strong child choice: " + childChoiceRate + "% of activities offered child choice");
  } else if (childChoiceRate < 50) {
    concerns.push("Child choice rate at " + childChoiceRate + "% — children not consistently offered choice in activities");
  }

  if (ageAppropriateRate >= 80) {
    strengths.push("Excellent age-appropriateness: " + ageAppropriateRate + "% of activities age-appropriate");
  } else if (ageAppropriateRate < 50) {
    concerns.push("Age-appropriateness at " + ageAppropriateRate + "% — activities may not suit children's developmental stage");
  }

  if (inclusiveRate >= 80) {
    strengths.push("Strong inclusive participation: " + inclusiveRate + "% of activities inclusive");
  } else if (inclusiveRate < 50) {
    concerns.push("Inclusive participation at " + inclusiveRate + "% — barriers to participation may exist");
  }

  if (enjoymentRate >= 80) {
    strengths.push("Good enjoyment recording: " + enjoymentRate + "% of activities have enjoyment recorded");
  } else if (enjoymentRate < 50) {
    concerns.push("Enjoyment recording at " + enjoymentRate + "% — child voice in activities not captured consistently");
  }

  return {
    totalRecords,
    childChoiceRate,
    ageAppropriateRate,
    inclusiveRate,
    enjoymentRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Activity Compliance (0-25) ──────────────────────────────

export function evaluateActivityCompliance(
  records: ActivityRecord[],
): ActivityComplianceResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      documentationRate: 0,
      riskAssessedRate: 0,
      childChoiceRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
      score: 0,
      strengths: [],
      concerns: ["No activity records — compliance cannot be assessed"],
    };
  }

  const documentationCount = records.filter((r) => r.documentationComplete).length;
  const documentationRate = pct(documentationCount, totalRecords);

  const riskAssessedCount = records.filter((r) => r.riskAssessed).length;
  const riskAssessedRate = pct(riskAssessedCount, totalRecords);

  const childChoiceCount = records.filter((r) => r.childChoiceOffered).length;
  const childChoiceRate = pct(childChoiceCount, totalRecords);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weights: documentationRate 8 + riskAssessedRate 7 + childChoiceRate 5 + categoryDiversityRatio 5 = 25
  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (riskAssessedRate / 100) * 7;
  score += (childChoiceRate / 100) * 5;
  score += (categoryDiversityRatio / 100) * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (documentationRate >= 90) {
    strengths.push("Thorough documentation: " + documentationRate + "% of activities fully documented");
  } else if (documentationRate < 60) {
    concerns.push("Documentation rate at " + documentationRate + "% — activity records incomplete");
  }

  if (riskAssessedRate >= 90) {
    strengths.push("Excellent risk assessment: " + riskAssessedRate + "% of activities risk-assessed");
  } else if (riskAssessedRate < 60) {
    concerns.push("Risk assessment at " + riskAssessedRate + "% — not all activities have been risk-assessed");
  }

  if (childChoiceRate >= 80) {
    strengths.push("Strong child participation: " + childChoiceRate + "% of activities offered child choice");
  } else if (childChoiceRate < 50) {
    concerns.push("Child choice at " + childChoiceRate + "% — children not consistently involved in activity selection");
  }

  if (uniqueCategories >= 6) {
    strengths.push("Comprehensive activity coverage: " + uniqueCategories + " of " + ALL_CATEGORIES.length + " categories represented");
  } else if (uniqueCategories <= 2) {
    concerns.push("Only " + uniqueCategories + " activity category(ies) covered — limited diversity of enrichment");
  }

  return {
    totalRecords,
    documentationRate,
    riskAssessedRate,
    childChoiceRate,
    categoryDiversityRatio,
    uniqueCategories,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Activity Policy (0-25) ──────────────────────────────────

export function evaluateActivityPolicy(
  policy: ActivityPolicy | null,
): ActivityPolicyResult {
  if (policy === null) {
    return {
      activitiesPolicy: false,
      inclusionFramework: false,
      riskAssessmentProtocol: false,
      childParticipationGuidance: false,
      communityEngagementStrategy: false,
      budgetAllocationPolicy: false,
      reviewSchedule: false,
      score: 0,
      strengths: [],
      concerns: ["No activities policy in place — URGENT: develop comprehensive activities policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.activitiesPolicy) score += 4;
  if (policy.inclusionFramework) score += 4;
  if (policy.riskAssessmentProtocol) score += 4;
  if (policy.childParticipationGuidance) score += 4;
  if (policy.communityEngagementStrategy) score += 3;
  if (policy.budgetAllocationPolicy) score += 3;
  if (policy.reviewSchedule) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.activitiesPolicy,
    policy.inclusionFramework,
    policy.riskAssessmentProtocol,
    policy.childParticipationGuidance,
    policy.communityEngagementStrategy,
    policy.budgetAllocationPolicy,
    policy.reviewSchedule,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete activities policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 activities policy components in place");
  }

  if (!policy.activitiesPolicy) {
    concerns.push("No activities policy — staff may lack clear guidance on activity provision");
  }
  if (!policy.inclusionFramework) {
    concerns.push("No inclusion framework — barriers to participation may not be addressed");
  }
  if (!policy.riskAssessmentProtocol) {
    concerns.push("No risk assessment protocol — activities may not be properly risk-assessed");
  }
  if (!policy.childParticipationGuidance) {
    concerns.push("No child participation guidance — children may not be involved in activity planning");
  }
  if (!policy.communityEngagementStrategy) {
    concerns.push("No community engagement strategy — community integration may be limited");
  }
  if (!policy.budgetAllocationPolicy) {
    concerns.push("No budget allocation policy — activity funding may be inequitable");
  }
  if (!policy.reviewSchedule) {
    concerns.push("No review schedule — activities provision may not be regularly evaluated");
  }

  return {
    activitiesPolicy: policy.activitiesPolicy,
    inclusionFramework: policy.inclusionFramework,
    riskAssessmentProtocol: policy.riskAssessmentProtocol,
    childParticipationGuidance: policy.childParticipationGuidance,
    communityEngagementStrategy: policy.communityEngagementStrategy,
    budgetAllocationPolicy: policy.budgetAllocationPolicy,
    reviewSchedule: policy.reviewSchedule,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Activity Readiness (0-25) ─────────────────────────

export function evaluateStaffActivityReadiness(
  training: StaffActivityTraining[],
): StaffActivityReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      activityPlanningRate: 0,
      safeguardingAwarenessRate: 0,
      inclusionSkillsRate: 0,
      riskManagementRate: 0,
      communityLinksRate: 0,
      firstAidRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule activity training for all staff"],
    };
  }

  const planningCount = training.filter((t) => t.activityPlanning).length;
  const activityPlanningRate = pct(planningCount, totalStaff);

  const safeguardingCount = training.filter((t) => t.safeguardingAwareness).length;
  const safeguardingAwarenessRate = pct(safeguardingCount, totalStaff);

  const inclusionCount = training.filter((t) => t.inclusionSkills).length;
  const inclusionSkillsRate = pct(inclusionCount, totalStaff);

  const riskCount = training.filter((t) => t.riskManagement).length;
  const riskManagementRate = pct(riskCount, totalStaff);

  const communityCount = training.filter((t) => t.communityLinks).length;
  const communityLinksRate = pct(communityCount, totalStaff);

  const firstAidCount = training.filter((t) => t.firstAid).length;
  const firstAidRate = pct(firstAidCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (activityPlanningRate / 100) * 6;
  score += (safeguardingAwarenessRate / 100) * 5;
  score += (inclusionSkillsRate / 100) * 5;
  score += (riskManagementRate / 100) * 4;
  score += (communityLinksRate / 100) * 3;
  score += (firstAidRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (activityPlanningRate >= 80) {
    strengths.push("Strong activity planning skills: " + activityPlanningRate + "% of staff");
  } else if (activityPlanningRate < 50) {
    concerns.push("Activity planning at " + activityPlanningRate + "% — staff may lack skills to plan enrichment activities");
  }

  if (safeguardingAwarenessRate >= 80) {
    strengths.push("Good safeguarding awareness: " + safeguardingAwarenessRate + "% of staff");
  } else if (safeguardingAwarenessRate < 50) {
    concerns.push("Safeguarding awareness at " + safeguardingAwarenessRate + "% — safeguarding in activity contexts needs attention");
  }

  if (inclusionSkillsRate >= 80) {
    strengths.push("Strong inclusion skills: " + inclusionSkillsRate + "% of staff skilled in inclusive participation");
  } else if (inclusionSkillsRate < 50) {
    concerns.push("Inclusion skills at " + inclusionSkillsRate + "% — staff may not support all children to participate");
  }

  if (riskManagementRate >= 80) {
    strengths.push("Good risk management skills: " + riskManagementRate + "% of staff competent in activity risk management");
  } else if (riskManagementRate < 50) {
    concerns.push("Risk management at " + riskManagementRate + "% — activity risk assessments may be inadequate");
  }

  if (communityLinksRate >= 80) {
    strengths.push("Strong community links: " + communityLinksRate + "% of staff have community connections for activities");
  } else if (communityLinksRate < 50) {
    concerns.push("Community links at " + communityLinksRate + "% — community activity options may be limited");
  }

  if (firstAidRate >= 80) {
    strengths.push("Good first aid coverage: " + firstAidRate + "% of staff first-aid trained");
  } else if (firstAidRate < 50) {
    concerns.push("First aid at " + firstAidRate + "% — safety during activities may be compromised");
  }

  return {
    totalStaff,
    activityPlanningRate,
    safeguardingAwarenessRate,
    inclusionSkillsRate,
    riskManagementRate,
    communityLinksRate,
    firstAidRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Activity Profiles ────────────────────────────────────────

export function buildChildActivityProfiles(
  records: ActivityRecord[],
): ChildActivityProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: ActivityRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalActivities = child.records.length;

    const choiceCount = child.records.filter((r) => r.childChoiceOffered).length;
    const childChoiceRate = pct(choiceCount, totalActivities);

    const enjoymentCount = child.records.filter((r) => r.enjoymentRecorded).length;
    const enjoymentRate = pct(enjoymentCount, totalActivities);

    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const uniqueCategories = uniqueCategoriesSet.size;

    // frequency: >=10 activities -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (totalActivities >= 10) frequencyScore = 2;
    else if (totalActivities >= 5) frequencyScore = 1;

    // rate1 (childChoiceRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (childChoiceRate >= 80) rate1Score = 3;
    else if (childChoiceRate >= 60) rate1Score = 2;
    else if (childChoiceRate >= 40) rate1Score = 1;

    // rate2 (enjoymentRate): same thresholds
    let rate2Score = 0;
    if (enjoymentRate >= 80) rate2Score = 3;
    else if (enjoymentRate >= 60) rate2Score = 2;
    else if (enjoymentRate >= 40) rate2Score = 1;

    // diversity (unique categories): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (uniqueCategories >= 4) diversityBonus = 2;
    else if (uniqueCategories >= 2) diversityBonus = 1;

    const activityScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalActivities,
      childChoiceRate,
      enjoymentRate,
      uniqueCategories,
      activityScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateActivitiesIntelligence(
  records: ActivityRecord[],
  policy: ActivityPolicy | null,
  training: StaffActivityTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ActivitiesIntelligence {
  const assessedAt = new Date().toISOString();

  // Evaluate each layer
  const activityQuality = evaluateActivityQuality(records);
  const activityCompliance = evaluateActivityCompliance(records);
  const activityPolicy = evaluateActivityPolicy(policy);
  const staffReadiness = evaluateStaffActivityReadiness(training);

  // Build child profiles
  const childProfiles = buildChildActivityProfiles(records);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      activityQuality.score +
      activityCompliance.score +
      activityPolicy.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    activityQuality, activityCompliance, activityPolicy, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    activityQuality, activityCompliance, activityPolicy, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    activityQuality, activityCompliance, activityPolicy, staffReadiness,
  );

  // Regulatory links
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    activityQuality,
    activityCompliance,
    activityPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ──────────────────────────────────────────────────

function aggregateStrengths(
  quality: ActivityQualityResult,
  compliance: ActivityComplianceResult,
  policy: ActivityPolicyResult,
  staff: StaffActivityReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall activities management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall activities management rated Good (" + overallScore + "/100)");
  }

  // Include evaluators with score >= 20
  if (quality.score >= 20) {
    strengths.push("Activity quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Activity compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Activities policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff activity readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: ActivityQualityResult,
  compliance: ActivityComplianceResult,
  policy: ActivityPolicyResult,
  staff: StaffActivityReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall activities management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall activities management Requires Improvement (" + overallScore + "/100)");
  }

  // Include evaluators with score < 15
  if (quality.score < 15) {
    areas.push("Activity quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Activity compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Activities policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff activity readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: ActivityQualityResult,
  compliance: ActivityComplianceResult,
  policy: ActivityPolicyResult,
  staff: StaffActivityReadinessResult,
): string[] {
  const actions: string[] = [];

  // URGENT when policy score = 0
  if (policy.score === 0) {
    actions.push("URGENT: No activities policy in place — develop and implement comprehensive activities policy immediately");
  }

  // URGENT when staff score = 0
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff activity training records — schedule activity training for all staff immediately");
  }

  // Conditional on rates < 50
  if (quality.totalRecords > 0 && quality.childChoiceRate < 50) {
    actions.push("HIGH: Child choice rate at " + quality.childChoiceRate + "% — embed child participation in all activity planning");
  }

  if (quality.totalRecords > 0 && quality.ageAppropriateRate < 50) {
    actions.push("HIGH: Age-appropriateness at " + quality.ageAppropriateRate + "% — review activity suitability for children's developmental stages");
  }

  if (quality.totalRecords > 0 && quality.inclusiveRate < 50) {
    actions.push("HIGH: Inclusive participation at " + quality.inclusiveRate + "% — address barriers to participation");
  }

  if (quality.totalRecords > 0 && quality.enjoymentRate < 50) {
    actions.push("HIGH: Enjoyment recording at " + quality.enjoymentRate + "% — ensure child voice is captured for all activities");
  }

  if (compliance.totalRecords > 0 && compliance.documentationRate < 50) {
    actions.push("MEDIUM: Documentation rate at " + compliance.documentationRate + "% — improve activity recording practices");
  }

  if (compliance.totalRecords > 0 && compliance.riskAssessedRate < 50) {
    actions.push("MEDIUM: Risk assessment at " + compliance.riskAssessedRate + "% — ensure all activities are properly risk-assessed");
  }

  if (staff.totalStaff > 0 && staff.activityPlanningRate < 50) {
    actions.push("MEDIUM: Staff activity planning at " + staff.activityPlanningRate + "% — schedule enrichment planning training");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Activities and enrichment systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ─────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 9 — Leisure, recreational and cultural activities",
    "CHR 2015 Regulation 5 — Quality and purpose of care (normalcy principle)",
    "SCCIF — Experiences and progress: children enjoy a range of activities",
    "Children Act 1989 — Welfare and development of the child",
    "UNCRC Article 31 — Right to rest, leisure, play, recreation, and cultural life",
    "DfE Guidance — Promoting positive outcomes through activities and enrichment",
    "NMS 9 — Leisure activities provision in children's homes",
  ];
}
