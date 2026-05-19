// ==============================================================================
// Cultural Identity Celebration Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well a children's residential home celebrates and supports
// children's cultural identity, heritage, and diversity:
//   1. Cultural Engagement (engagement quality, child-led choice, identity)
//   2. Cultural Diversity (area coverage, staff facilitation, community)
//   3. Cultural Policy (7 boolean policy dimensions)
//   4. Staff Cultural Readiness (6 training competencies)
//
// Regulatory: CHR 2015 Reg 10, CHR 2015 Reg 12, SCCIF, NMS 7,
//             Children Act 1989, UNCRC Article 30, Equality Act 2010
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type CulturalArea =
  | "heritage_exploration"
  | "language_support"
  | "food_traditions"
  | "religious_observance"
  | "cultural_events"
  | "identity_work"
  | "community_connections"
  | "arts_expression";

export type EngagementLevel =
  | "enthusiastic"
  | "willing"
  | "neutral"
  | "reluctant"
  | "refused";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const culturalAreaLabels: Record<CulturalArea, string> = {
  heritage_exploration: "Heritage Exploration",
  language_support: "Language Support",
  food_traditions: "Food Traditions",
  religious_observance: "Religious Observance",
  cultural_events: "Cultural Events",
  identity_work: "Identity Work",
  community_connections: "Community Connections",
  arts_expression: "Arts Expression",
};

const engagementLevelLabels: Record<EngagementLevel, string> = {
  enthusiastic: "Enthusiastic",
  willing: "Willing",
  neutral: "Neutral",
  reluctant: "Reluctant",
  refused: "Refused",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getCulturalAreaLabel(a: CulturalArea): string {
  return culturalAreaLabels[a] ?? a;
}
export function getEngagementLevelLabel(e: EngagementLevel): string {
  return engagementLevelLabels[e] ?? e;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface CulturalActivity {
  id: string;
  childId: string;
  childName: string;
  activityDate: string;
  culturalArea: CulturalArea;
  engagementLevel: EngagementLevel;
  childLedChoice: boolean;
  identityAffirmed: boolean;
  documentedInPlan: boolean;
  staffFacilitated: boolean;
  communityInvolved: boolean;
  reflectionCompleted: boolean;
}

export interface CulturalPolicy {
  id: string;
  culturalIdentityPolicy: boolean;
  diversityCelebration: boolean;
  religiousObservanceSupport: boolean;
  languageSupportProvision: boolean;
  foodTraditionsRespected: boolean;
  communityPartnership: boolean;
  regularReview: boolean;
}

export interface StaffCulturalTraining {
  id: string;
  staffId: string;
  staffName: string;
  culturalCompetence: boolean;
  diversityAwareness: boolean;
  religiousLiteracy: boolean;
  antiRacismPractice: boolean;
  identitySupport: boolean;
  communityEngagement: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface CulturalEngagementResult {
  overallScore: number;
  totalActivities: number;
  engagementRate: number;
  childLedChoiceRate: number;
  identityAffirmedRate: number;
  documentedInPlanRate: number;
  reflectionCompletedRate: number;
}

export interface CulturalDiversityResult {
  overallScore: number;
  totalActivities: number;
  uniqueCulturalAreas: number;
  culturalAreaRatio: number;
  staffFacilitatedRate: number;
  communityInvolvedRate: number;
}

export interface CulturalPolicyResult {
  overallScore: number;
  culturalIdentityPolicyMet: boolean;
  diversityCelebrationMet: boolean;
  religiousObservanceSupportMet: boolean;
  languageSupportProvisionMet: boolean;
  foodTraditionsRespectedMet: boolean;
  communityPartnershipMet: boolean;
  regularReviewMet: boolean;
}

export interface StaffCulturalReadinessResult {
  overallScore: number;
  totalStaff: number;
  culturalCompetenceRate: number;
  diversityAwarenessRate: number;
  religiousLiteracyRate: number;
  antiRacismPracticeRate: number;
  identitySupportRate: number;
  communityEngagementRate: number;
}

export interface ChildCulturalProfile {
  childId: string;
  childName: string;
  totalActivities: number;
  engagementRate: number;
  identityAffirmedRate: number;
  uniqueCulturalAreas: number;
  overallScore: number;
}

export interface CulturalIdentityCelebrationIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  culturalEngagement: CulturalEngagementResult;
  culturalDiversity: CulturalDiversityResult;
  culturalPolicy: CulturalPolicyResult;
  staffCulturalReadiness: StaffCulturalReadinessResult;
  childProfiles: ChildCulturalProfile[];
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
 * Evaluates cultural engagement quality across all activities.
 * Empty = 0 (no activities = no evidence of engagement).
 *
 *   Engagement rate (enthusiastic + willing)       -> 0-7
 *   Child-led choice rate                          -> 0-6
 *   Identity affirmed rate                         -> 0-6
 *   Combined documentedInPlan + reflectionCompleted -> 0-6
 */
export function evaluateCulturalEngagement(
  activities: CulturalActivity[],
): CulturalEngagementResult {
  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      engagementRate: 0,
      childLedChoiceRate: 0,
      identityAffirmedRate: 0,
      documentedInPlanRate: 0,
      reflectionCompletedRate: 0,
    };
  }

  let score = 0;

  const engaged = activities.filter(
    (a) => a.engagementLevel === "enthusiastic" || a.engagementLevel === "willing",
  ).length;
  const engagementRate = pct(engaged, activities.length);
  if (engagementRate >= 90) score += 7;
  else if (engagementRate >= 70) score += 5;
  else if (engagementRate >= 50) score += 3;
  else if (engagementRate > 0) score += 1;

  const childLed = activities.filter((a) => a.childLedChoice).length;
  const childLedChoiceRate = pct(childLed, activities.length);
  if (childLedChoiceRate >= 90) score += 6;
  else if (childLedChoiceRate >= 70) score += 4;
  else if (childLedChoiceRate >= 50) score += 3;
  else if (childLedChoiceRate > 0) score += 1;

  const affirmed = activities.filter((a) => a.identityAffirmed).length;
  const identityAffirmedRate = pct(affirmed, activities.length);
  if (identityAffirmedRate >= 90) score += 6;
  else if (identityAffirmedRate >= 70) score += 4;
  else if (identityAffirmedRate >= 50) score += 3;
  else if (identityAffirmedRate > 0) score += 1;

  const documented = activities.filter((a) => a.documentedInPlan).length;
  const documentedInPlanRate = pct(documented, activities.length);
  const reflected = activities.filter((a) => a.reflectionCompleted).length;
  const reflectionCompletedRate = pct(reflected, activities.length);
  const combinedRate = Math.round((documentedInPlanRate + reflectionCompletedRate) / 2);
  if (combinedRate >= 90) score += 6;
  else if (combinedRate >= 70) score += 4;
  else if (combinedRate >= 50) score += 3;
  else if (combinedRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalActivities: activities.length,
    engagementRate,
    childLedChoiceRate,
    identityAffirmedRate,
    documentedInPlanRate,
    reflectionCompletedRate,
  };
}

/**
 * Evaluates cultural diversity across activities.
 * Empty = 0 (no activities = no evidence of diversity).
 *
 *   Unique cultural areas ratio (areas / 8)  -> 0-8
 *   Staff facilitated rate                   -> 0-9
 *   Community involved rate                  -> 0-8
 */
export function evaluateCulturalDiversity(
  activities: CulturalActivity[],
): CulturalDiversityResult {
  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      uniqueCulturalAreas: 0,
      culturalAreaRatio: 0,
      staffFacilitatedRate: 0,
      communityInvolvedRate: 0,
    };
  }

  let score = 0;

  const uniqueAreas = new Set(activities.map((a) => a.culturalArea));
  const uniqueCulturalAreas = uniqueAreas.size;
  const culturalAreaRatio = Math.round((uniqueCulturalAreas / 8) * 100);
  // Score based on how many of the 8 cultural areas are covered
  if (uniqueCulturalAreas >= 7) score += 8;
  else if (uniqueCulturalAreas >= 5) score += 6;
  else if (uniqueCulturalAreas >= 3) score += 4;
  else if (uniqueCulturalAreas >= 1) score += 2;

  const staffFacilitated = activities.filter((a) => a.staffFacilitated).length;
  const staffFacilitatedRate = pct(staffFacilitated, activities.length);
  if (staffFacilitatedRate >= 90) score += 9;
  else if (staffFacilitatedRate >= 70) score += 7;
  else if (staffFacilitatedRate >= 50) score += 5;
  else if (staffFacilitatedRate > 0) score += 2;

  const communityInvolved = activities.filter((a) => a.communityInvolved).length;
  const communityInvolvedRate = pct(communityInvolved, activities.length);
  if (communityInvolvedRate >= 90) score += 8;
  else if (communityInvolvedRate >= 70) score += 6;
  else if (communityInvolvedRate >= 50) score += 4;
  else if (communityInvolvedRate > 0) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalActivities: activities.length,
    uniqueCulturalAreas,
    culturalAreaRatio,
    staffFacilitatedRate,
    communityInvolvedRate,
  };
}

/**
 * Evaluates cultural policy compliance.
 * null = 0 (no policy = no evidence of governance).
 *
 *   culturalIdentityPolicy     -> 0-4
 *   diversityCelebration       -> 0-4
 *   religiousObservanceSupport -> 0-4
 *   languageSupportProvision   -> 0-4
 *   foodTraditionsRespected    -> 0-3
 *   communityPartnership       -> 0-3
 *   regularReview              -> 0-3
 */
export function evaluateCulturalPolicy(
  policy: CulturalPolicy | null,
): CulturalPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      culturalIdentityPolicyMet: false,
      diversityCelebrationMet: false,
      religiousObservanceSupportMet: false,
      languageSupportProvisionMet: false,
      foodTraditionsRespectedMet: false,
      communityPartnershipMet: false,
      regularReviewMet: false,
    };
  }

  let score = 0;

  if (policy.culturalIdentityPolicy) score += 4;
  if (policy.diversityCelebration) score += 4;
  if (policy.religiousObservanceSupport) score += 4;
  if (policy.languageSupportProvision) score += 4;
  if (policy.foodTraditionsRespected) score += 3;
  if (policy.communityPartnership) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(score, 25),
    culturalIdentityPolicyMet: policy.culturalIdentityPolicy,
    diversityCelebrationMet: policy.diversityCelebration,
    religiousObservanceSupportMet: policy.religiousObservanceSupport,
    languageSupportProvisionMet: policy.languageSupportProvision,
    foodTraditionsRespectedMet: policy.foodTraditionsRespected,
    communityPartnershipMet: policy.communityPartnership,
    regularReviewMet: policy.regularReview,
  };
}

/**
 * Evaluates staff cultural readiness from training records.
 * Empty = 0 (no training = no evidence of competence).
 *
 *   culturalCompetence   -> 0-6
 *   diversityAwareness   -> 0-5
 *   religiousLiteracy    -> 0-5
 *   antiRacismPractice   -> 0-4
 *   identitySupport      -> 0-3
 *   communityEngagement  -> 0-2
 */
export function evaluateStaffCulturalReadiness(
  training: StaffCulturalTraining[],
): StaffCulturalReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      culturalCompetenceRate: 0,
      diversityAwarenessRate: 0,
      religiousLiteracyRate: 0,
      antiRacismPracticeRate: 0,
      identitySupportRate: 0,
      communityEngagementRate: 0,
    };
  }

  let score = 0;

  const culturalCompetence = training.filter((t) => t.culturalCompetence).length;
  const culturalCompetenceRate = pct(culturalCompetence, training.length);
  if (culturalCompetenceRate >= 90) score += 6;
  else if (culturalCompetenceRate >= 70) score += 4;
  else if (culturalCompetenceRate >= 50) score += 3;
  else if (culturalCompetenceRate > 0) score += 1;

  const diversityAwareness = training.filter((t) => t.diversityAwareness).length;
  const diversityAwarenessRate = pct(diversityAwareness, training.length);
  if (diversityAwarenessRate >= 90) score += 5;
  else if (diversityAwarenessRate >= 70) score += 3;
  else if (diversityAwarenessRate >= 50) score += 2;
  else if (diversityAwarenessRate > 0) score += 1;

  const religiousLiteracy = training.filter((t) => t.religiousLiteracy).length;
  const religiousLiteracyRate = pct(religiousLiteracy, training.length);
  if (religiousLiteracyRate >= 90) score += 5;
  else if (religiousLiteracyRate >= 70) score += 3;
  else if (religiousLiteracyRate >= 50) score += 2;
  else if (religiousLiteracyRate > 0) score += 1;

  const antiRacism = training.filter((t) => t.antiRacismPractice).length;
  const antiRacismPracticeRate = pct(antiRacism, training.length);
  if (antiRacismPracticeRate >= 90) score += 4;
  else if (antiRacismPracticeRate >= 70) score += 3;
  else if (antiRacismPracticeRate >= 50) score += 2;
  else if (antiRacismPracticeRate > 0) score += 1;

  const identitySupport = training.filter((t) => t.identitySupport).length;
  const identitySupportRate = pct(identitySupport, training.length);
  if (identitySupportRate >= 90) score += 3;
  else if (identitySupportRate >= 70) score += 2;
  else if (identitySupportRate >= 50) score += 1;

  const communityEngagement = training.filter((t) => t.communityEngagement).length;
  const communityEngagementRate = pct(communityEngagement, training.length);
  if (communityEngagementRate >= 90) score += 2;
  else if (communityEngagementRate >= 70) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    culturalCompetenceRate,
    diversityAwarenessRate,
    religiousLiteracyRate,
    antiRacismPracticeRate,
    identitySupportRate,
    communityEngagementRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildCulturalProfiles(
  activities: CulturalActivity[],
): ChildCulturalProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const a of activities) {
    childIds.add(a.childId);
    childNames.set(a.childId, a.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childActivities = activities.filter((a) => a.childId === childId);
    const childName = childNames.get(childId) ?? childId;

    const engaged = childActivities.filter(
      (a) => a.engagementLevel === "enthusiastic" || a.engagementLevel === "willing",
    ).length;
    const engagementRate = pct(engaged, childActivities.length);

    const affirmed = childActivities.filter((a) => a.identityAffirmed).length;
    const identityAffirmedRate = pct(affirmed, childActivities.length);

    const uniqueAreas = new Set(childActivities.map((a) => a.culturalArea));
    const uniqueCulturalAreas = uniqueAreas.size;

    // Score 0-10
    let score = 0;

    // Frequency (0-2): >=10 activities -> 2, >=5 -> 1
    if (childActivities.length >= 10) score += 2;
    else if (childActivities.length >= 5) score += 1;

    // Engagement (0-3)
    if (engagementRate >= 80) score += 3;
    else if (engagementRate >= 60) score += 2;
    else if (engagementRate > 0) score += 1;

    // Identity affirmed (0-3)
    if (identityAffirmedRate >= 80) score += 3;
    else if (identityAffirmedRate >= 60) score += 2;
    else if (identityAffirmedRate > 0) score += 1;

    // Diversity (0-2): >=5 unique areas -> 2, >=3 -> 1
    if (uniqueCulturalAreas >= 5) score += 2;
    else if (uniqueCulturalAreas >= 3) score += 1;

    return {
      childId,
      childName,
      totalActivities: childActivities.length,
      engagementRate,
      identityAffirmedRate,
      uniqueCulturalAreas,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateCulturalIdentityCelebrationIntelligence(
  activities: CulturalActivity[],
  policy: CulturalPolicy | null,
  training: StaffCulturalTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): CulturalIdentityCelebrationIntelligence {
  const culturalEngagement = evaluateCulturalEngagement(activities);
  const culturalDiversity = evaluateCulturalDiversity(activities);
  const culturalPolicy = evaluateCulturalPolicy(policy);
  const staffCulturalReadiness = evaluateStaffCulturalReadiness(training);

  const rawScore =
    culturalEngagement.overallScore +
    culturalDiversity.overallScore +
    culturalPolicy.overallScore +
    staffCulturalReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildCulturalProfiles(activities);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (culturalEngagement.engagementRate >= 80) {
    strengths.push(
      "Strong cultural engagement — children consistently enthusiastic or willing participants",
    );
  }
  if (culturalEngagement.childLedChoiceRate >= 80) {
    strengths.push(
      "Excellent child-led identity work — children actively choosing their own cultural activities",
    );
  }
  if (culturalEngagement.identityAffirmedRate >= 80) {
    strengths.push(
      "Identity affirmation embedded in practice — children's cultural identity consistently celebrated",
    );
  }
  if (culturalDiversity.staffFacilitatedRate >= 90) {
    strengths.push(
      "Staff team consistently facilitating and supporting cultural activities",
    );
  }
  if (culturalDiversity.communityInvolvedRate >= 80) {
    strengths.push(
      "Strong community partnerships enriching cultural experiences for children",
    );
  }
  if (culturalPolicy.overallScore >= 22) {
    strengths.push(
      "Comprehensive cultural identity policies in place with regular review",
    );
  }
  if (staffCulturalReadiness.overallScore >= 22) {
    strengths.push(
      "Staff team well-trained across cultural competence, diversity, and anti-racism practice",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (culturalEngagement.engagementRate < 60 && activities.length > 0) {
    areasForImprovement.push(
      "Cultural engagement levels below expectations — review how activities are offered and whether they reflect children's interests",
    );
  }
  if (culturalDiversity.communityInvolvedRate < 40 && activities.length > 0) {
    areasForImprovement.push(
      "Community involvement in cultural activities is low — develop partnerships with local cultural organisations and community groups",
    );
  }
  if (culturalEngagement.childLedChoiceRate < 60 && activities.length > 0) {
    areasForImprovement.push(
      "Child-led cultural choice needs strengthening — ensure children have meaningful say in cultural activities",
    );
  }
  if (culturalDiversity.uniqueCulturalAreas < 4 && activities.length > 0) {
    areasForImprovement.push(
      "Limited range of cultural areas explored — broaden activities to cover heritage, language, food, religion, arts, and community",
    );
  }
  if (staffCulturalReadiness.antiRacismPracticeRate < 60 && training.length > 0) {
    areasForImprovement.push(
      "Anti-racism practice training needs improvement across the staff team",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (activities.length === 0) {
    actions.push(
      "No cultural activity records found — begin recording cultural identity activities for all children",
    );
  }
  if (policy === null) {
    actions.push(
      "URGENT: No cultural identity policy in place — develop and implement a comprehensive cultural identity and diversity policy",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff cultural training records — deliver cultural competence, diversity awareness, and anti-racism training to all staff",
    );
  }
  if (culturalEngagement.engagementRate < 60 && activities.length > 0) {
    actions.push(
      "Review cultural activity programme — engagement levels suggest activities may not reflect children's cultural backgrounds and interests",
    );
  }
  if (culturalDiversity.communityInvolvedRate < 40 && activities.length > 0) {
    actions.push(
      "Develop community partnerships to support children's cultural identity — contact local cultural organisations, faith groups, and heritage centres",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 10 — Enjoyment and achievement",
    "CHR 2015 Regulation 12 — Health and wellbeing",
    "SCCIF — Experiences and progress of children",
    "NMS 7 — Promoting positive behaviour and relationships",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 30 — Right to cultural identity",
    "Equality Act 2010 — Protected characteristics",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    culturalEngagement,
    culturalDiversity,
    culturalPolicy,
    staffCulturalReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
