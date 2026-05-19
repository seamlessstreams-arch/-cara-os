// ==============================================================================
// Cornerstone Cultural Identity Support Intelligence Engine
//
// Evaluates how well the home supports children's cultural identity, heritage,
// religious needs, and identity development.
//
// Regulatory basis:
//   - CHR 2015 Reg 10 (duty relating to the child's cultural, linguistic,
//     religious, and racial needs)
//   - CHR 2015 Reg 14 (the care planning standard)
//   - SCCIF (experiences and progress of children)
//   - UNCRC Article 8 (right to preservation of identity)
//   - UNCRC Article 30 (minority culture, religion, and language rights)
//   - Equality Act 2010 (protection from discrimination)
//   - Children Act 1989 s22(5)(c)
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// ==============================================================================

// -- Type Definitions ---------------------------------------------------------

export type CulturalNeedType =
  | "language"
  | "religion"
  | "diet"
  | "clothing"
  | "festivals"
  | "heritage"
  | "hair_care"
  | "skin_care"
  | "music"
  | "community_links"
  | "other";

export type SupportStatus =
  | "fully_met"
  | "partially_met"
  | "not_met"
  | "under_review"
  | "not_assessed";

export type ActivityType =
  | "cultural_celebration"
  | "religious_observance"
  | "heritage_activity"
  | "language_support"
  | "community_visit"
  | "identity_workshop"
  | "mentoring"
  | "other";

export type EngagementLevel = "high" | "medium" | "low" | "refused";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface CulturalNeedsAssessment {
  id: string;
  childId: string;
  childName: string;
  needType: CulturalNeedType;
  description: string;
  supportStatus: SupportStatus;
  assessmentDate: string;
  reviewDate: string;
  reviewCurrent: boolean;
  childConsulted: boolean;
  familyConsulted: boolean;
}

export interface CulturalActivity {
  id: string;
  date: string;
  activityType: ActivityType;
  description: string;
  facilitatedBy: string;
  childrenParticipated: string[];
  engagement: EngagementLevel;
  resourcesProvided: boolean;
  childFeedbackPositive: boolean;
}

export interface IdentityPlan {
  id: string;
  childId: string;
  childName: string;
  planInPlace: boolean;
  lastReviewDate: string;
  identityNeedsDocumented: boolean;
  lifeStoryWorkActive: boolean;
  culturalMentorAssigned: boolean;
  communityLinksEstablished: boolean;
}

export interface StaffCulturalTraining {
  id: string;
  staffId: string;
  staffName: string;
  culturalAwareness: boolean;
  antiRacism: boolean;
  religiousLiteracy: boolean;
  identitySupport: boolean;
  lgbtqAwareness: boolean;
  communicationDiversity: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface NeedsAssessmentResult {
  overallScore: number; // 0-25
  totalAssessments: number;
  fullyMetRate: number;
  reviewCurrentRate: number;
  childConsultedRate: number;
  familyConsultedRate: number;
  needTypeCoverage: number;
}

export interface CulturalActivitiesResult {
  overallScore: number; // 0-25
  totalActivities: number;
  engagementRate: number;
  resourcesRate: number;
  positiveFeedbackRate: number;
  childrenReachedRate: number;
  activityVariety: number;
}

export interface IdentityPlanningResult {
  overallScore: number; // 0-25
  totalPlans: number;
  planInPlaceRate: number;
  identityDocumentedRate: number;
  lifeStoryRate: number;
  mentorRate: number;
  communityLinksRate: number;
}

export interface StaffCulturalReadinessResult {
  overallScore: number; // 0-25
  totalStaff: number;
  awarenessRate: number;
  antiRacismRate: number;
  religiousLiteracyRate: number;
  identitySupportRate: number;
  lgbtqAwarenessRate: number;
  communicationDiversityRate: number;
}

export interface CulturalIdentitySupportIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  needsAssessment: NeedsAssessmentResult;
  culturalActivities: CulturalActivitiesResult;
  identityPlanning: IdentityPlanningResult;
  staffReadiness: StaffCulturalReadinessResult;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Label Maps ---------------------------------------------------------------

const CULTURAL_NEED_TYPE_LABELS: Record<CulturalNeedType, string> = {
  language: "Language",
  religion: "Religion",
  diet: "Diet",
  clothing: "Clothing",
  festivals: "Festivals",
  heritage: "Heritage",
  hair_care: "Hair Care",
  skin_care: "Skin Care",
  music: "Music",
  community_links: "Community Links",
  other: "Other",
};

const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  fully_met: "Fully Met",
  partially_met: "Partially Met",
  not_met: "Not Met",
  under_review: "Under Review",
  not_assessed: "Not Assessed",
};

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  cultural_celebration: "Cultural Celebration",
  religious_observance: "Religious Observance",
  heritage_activity: "Heritage Activity",
  language_support: "Language Support",
  community_visit: "Community Visit",
  identity_workshop: "Identity Workshop",
  mentoring: "Mentoring",
  other: "Other",
};

const ENGAGEMENT_LEVEL_LABELS: Record<EngagementLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  refused: "Refused",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label Functions ----------------------------------------------------------

export function getCulturalNeedTypeLabel(t: CulturalNeedType): string {
  return CULTURAL_NEED_TYPE_LABELS[t] ?? t;
}

export function getSupportStatusLabel(s: SupportStatus): string {
  return SUPPORT_STATUS_LABELS[s] ?? s;
}

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

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluator 1: Needs Assessment (0-25) -------------------------------------

/**
 * Evaluates how well children's cultural needs are assessed and met.
 * Measures: fully met rate, review current rate, child consulted rate,
 * family consulted rate, need type coverage.
 * Max score: 25
 */
export function evaluateNeedsAssessment(
  assessments: CulturalNeedsAssessment[],
): NeedsAssessmentResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      fullyMetRate: 0,
      reviewCurrentRate: 0,
      childConsultedRate: 0,
      familyConsultedRate: 0,
      needTypeCoverage: 0,
    };
  }

  let score = 0;

  // Fully met rate
  const fullyMet = assessments.filter(
    (a) => a.supportStatus === "fully_met",
  ).length;
  const fullyMetRate = pct(fullyMet, assessments.length);
  if (fullyMetRate >= 80) score += 7;
  else if (fullyMetRate >= 60) score += 5;
  else if (fullyMetRate >= 40) score += 3;
  else if (fullyMetRate >= 20) score += 1;

  // Review current rate
  const reviewCurrent = assessments.filter((a) => a.reviewCurrent).length;
  const reviewCurrentRate = pct(reviewCurrent, assessments.length);
  if (reviewCurrentRate >= 90) score += 6;
  else if (reviewCurrentRate >= 70) score += 4;
  else if (reviewCurrentRate >= 50) score += 2;

  // Child consulted rate
  const childConsulted = assessments.filter((a) => a.childConsulted).length;
  const childConsultedRate = pct(childConsulted, assessments.length);
  if (childConsultedRate >= 90) score += 6;
  else if (childConsultedRate >= 70) score += 4;
  else if (childConsultedRate >= 50) score += 2;

  // Family consulted rate
  const familyConsulted = assessments.filter((a) => a.familyConsulted).length;
  const familyConsultedRate = pct(familyConsulted, assessments.length);
  if (familyConsultedRate >= 80) score += 6;
  else if (familyConsultedRate >= 60) score += 4;
  else if (familyConsultedRate >= 40) score += 2;

  // Need type coverage (unique types assessed)
  const uniqueTypes = new Set(assessments.map((a) => a.needType));
  const needTypeCoverage = uniqueTypes.size;

  return {
    overallScore: Math.min(score, 25),
    totalAssessments: assessments.length,
    fullyMetRate,
    reviewCurrentRate,
    childConsultedRate,
    familyConsultedRate,
    needTypeCoverage,
  };
}

// -- Evaluator 2: Cultural Activities (0-25) ----------------------------------

/**
 * Evaluates cultural activities provision.
 * Measures: engagement rate, resources rate, positive feedback rate,
 * children reached rate, activity variety.
 * Max score: 25
 */
export function evaluateCulturalActivities(
  activities: CulturalActivity[],
  totalChildren: number,
): CulturalActivitiesResult {
  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      engagementRate: 0,
      resourcesRate: 0,
      positiveFeedbackRate: 0,
      childrenReachedRate: 0,
      activityVariety: 0,
    };
  }

  let score = 0;

  // Engagement rate (high or medium)
  const engaged = activities.filter(
    (a) => a.engagement === "high" || a.engagement === "medium",
  ).length;
  const engagementRate = pct(engaged, activities.length);
  if (engagementRate >= 85) score += 6;
  else if (engagementRate >= 65) score += 4;
  else if (engagementRate >= 45) score += 2;

  // Resources provided rate
  const resourced = activities.filter((a) => a.resourcesProvided).length;
  const resourcesRate = pct(resourced, activities.length);
  if (resourcesRate >= 90) score += 5;
  else if (resourcesRate >= 70) score += 3;
  else if (resourcesRate >= 50) score += 1;

  // Positive feedback rate
  const positive = activities.filter((a) => a.childFeedbackPositive).length;
  const positiveFeedbackRate = pct(positive, activities.length);
  if (positiveFeedbackRate >= 85) score += 5;
  else if (positiveFeedbackRate >= 65) score += 3;
  else if (positiveFeedbackRate >= 45) score += 1;

  // Children reached rate (unique children across all activities / totalChildren)
  const uniqueChildren = new Set(activities.flatMap((a) => a.childrenParticipated));
  const childrenReachedRate =
    totalChildren > 0 ? pct(uniqueChildren.size, totalChildren) : 0;
  if (childrenReachedRate >= 90) score += 5;
  else if (childrenReachedRate >= 70) score += 3;
  else if (childrenReachedRate >= 50) score += 1;

  // Activity variety (unique types)
  const uniqueTypes = new Set(activities.map((a) => a.activityType));
  const activityVariety = uniqueTypes.size;
  if (activityVariety >= 5) score += 4;
  else if (activityVariety >= 3) score += 3;
  else if (activityVariety >= 1) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalActivities: activities.length,
    engagementRate,
    resourcesRate,
    positiveFeedbackRate,
    childrenReachedRate,
    activityVariety,
  };
}

// -- Evaluator 3: Identity Planning (0-25) ------------------------------------

/**
 * Evaluates identity planning across children.
 * Measures: plan in place rate, identity documented rate, life story rate,
 * mentor rate, community links rate.
 * Max score: 25
 */
export function evaluateIdentityPlanning(
  plans: IdentityPlan[],
): IdentityPlanningResult {
  if (plans.length === 0) {
    return {
      overallScore: 0,
      totalPlans: 0,
      planInPlaceRate: 0,
      identityDocumentedRate: 0,
      lifeStoryRate: 0,
      mentorRate: 0,
      communityLinksRate: 0,
    };
  }

  let score = 0;
  const total = plans.length;

  // Plan in place rate
  const hasPlans = plans.filter((p) => p.planInPlace).length;
  const planInPlaceRate = pct(hasPlans, total);
  if (planInPlaceRate >= 90) score += 6;
  else if (planInPlaceRate >= 70) score += 4;
  else if (planInPlaceRate >= 50) score += 2;

  // Identity needs documented rate
  const documented = plans.filter((p) => p.identityNeedsDocumented).length;
  const identityDocumentedRate = pct(documented, total);
  if (identityDocumentedRate >= 90) score += 6;
  else if (identityDocumentedRate >= 70) score += 4;
  else if (identityDocumentedRate >= 50) score += 2;

  // Life story work active rate
  const lifeStory = plans.filter((p) => p.lifeStoryWorkActive).length;
  const lifeStoryRate = pct(lifeStory, total);
  if (lifeStoryRate >= 80) score += 5;
  else if (lifeStoryRate >= 60) score += 3;
  else if (lifeStoryRate >= 40) score += 1;

  // Cultural mentor assigned rate
  const mentors = plans.filter((p) => p.culturalMentorAssigned).length;
  const mentorRate = pct(mentors, total);
  if (mentorRate >= 80) score += 4;
  else if (mentorRate >= 50) score += 2;
  else if (mentorRate >= 30) score += 1;

  // Community links established rate
  const communityLinks = plans.filter((p) => p.communityLinksEstablished).length;
  const communityLinksRate = pct(communityLinks, total);
  if (communityLinksRate >= 80) score += 4;
  else if (communityLinksRate >= 50) score += 2;
  else if (communityLinksRate >= 30) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalPlans: total,
    planInPlaceRate,
    identityDocumentedRate,
    lifeStoryRate,
    mentorRate,
    communityLinksRate,
  };
}

// -- Evaluator 4: Staff Cultural Readiness (0-25) -----------------------------

/**
 * Evaluates staff preparedness to support children's cultural identities.
 * Measures: cultural awareness, anti-racism, religious literacy,
 * identity support, LGBTQ awareness, communication diversity.
 * Max score: 25
 */
export function evaluateStaffCulturalReadiness(
  training: StaffCulturalTraining[],
): StaffCulturalReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      awarenessRate: 0,
      antiRacismRate: 0,
      religiousLiteracyRate: 0,
      identitySupportRate: 0,
      lgbtqAwarenessRate: 0,
      communicationDiversityRate: 0,
    };
  }

  let score = 0;
  const total = training.length;

  // Cultural awareness rate
  const awareness = training.filter((t) => t.culturalAwareness).length;
  const awarenessRate = pct(awareness, total);
  if (awarenessRate >= 90) score += 5;
  else if (awarenessRate >= 70) score += 3;
  else if (awarenessRate >= 50) score += 1;

  // Anti-racism rate
  const antiRacism = training.filter((t) => t.antiRacism).length;
  const antiRacismRate = pct(antiRacism, total);
  if (antiRacismRate >= 90) score += 5;
  else if (antiRacismRate >= 70) score += 3;
  else if (antiRacismRate >= 50) score += 1;

  // Religious literacy rate
  const religious = training.filter((t) => t.religiousLiteracy).length;
  const religiousLiteracyRate = pct(religious, total);
  if (religiousLiteracyRate >= 80) score += 4;
  else if (religiousLiteracyRate >= 60) score += 3;
  else if (religiousLiteracyRate >= 40) score += 1;

  // Identity support rate
  const identitySupport = training.filter((t) => t.identitySupport).length;
  const identitySupportRate = pct(identitySupport, total);
  if (identitySupportRate >= 80) score += 4;
  else if (identitySupportRate >= 60) score += 3;
  else if (identitySupportRate >= 40) score += 1;

  // LGBTQ awareness rate
  const lgbtq = training.filter((t) => t.lgbtqAwareness).length;
  const lgbtqAwarenessRate = pct(lgbtq, total);
  if (lgbtqAwarenessRate >= 80) score += 4;
  else if (lgbtqAwarenessRate >= 60) score += 3;
  else if (lgbtqAwarenessRate >= 40) score += 1;

  // Communication diversity rate
  const commDiversity = training.filter(
    (t) => t.communicationDiversity,
  ).length;
  const communicationDiversityRate = pct(commDiversity, total);
  if (communicationDiversityRate >= 80) score += 3;
  else if (communicationDiversityRate >= 60) score += 2;
  else if (communicationDiversityRate >= 40) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: total,
    awarenessRate,
    antiRacismRate,
    religiousLiteracyRate,
    identitySupportRate,
    lgbtqAwarenessRate,
    communicationDiversityRate,
  };
}

// -- Strengths ----------------------------------------------------------------

function generateStrengths(
  needs: NeedsAssessmentResult,
  activities: CulturalActivitiesResult,
  planning: IdentityPlanningResult,
  staff: StaffCulturalReadinessResult,
): string[] {
  const strengths: string[] = [];

  if (needs.fullyMetRate >= 80) {
    strengths.push(
      "Strong cultural needs provision — the majority of children's cultural needs are fully met",
    );
  }

  if (needs.childConsultedRate >= 90) {
    strengths.push(
      "Excellent practice in consulting children about their cultural identity and needs",
    );
  }

  if (needs.familyConsultedRate >= 80) {
    strengths.push(
      "Families are consistently consulted when assessing children's cultural needs",
    );
  }

  if (needs.reviewCurrentRate >= 90) {
    strengths.push(
      "Cultural needs assessments are kept up to date through regular review",
    );
  }

  if (activities.engagementRate >= 85) {
    strengths.push(
      "High engagement levels in cultural activities — children are actively participating",
    );
  }

  if (activities.positiveFeedbackRate >= 85) {
    strengths.push(
      "Children consistently report positive experiences from cultural activities",
    );
  }

  if (activities.childrenReachedRate >= 90) {
    strengths.push(
      "Cultural activities reach all or nearly all children in the home",
    );
  }

  if (activities.activityVariety >= 5) {
    strengths.push(
      "Excellent variety of cultural activities — children experience diverse forms of cultural engagement",
    );
  }

  if (activities.resourcesRate >= 90) {
    strengths.push(
      "Resources are consistently provided to support cultural activities",
    );
  }

  if (planning.planInPlaceRate >= 90) {
    strengths.push(
      "Identity plans are in place for all or nearly all children",
    );
  }

  if (planning.lifeStoryRate >= 80) {
    strengths.push(
      "Life story work is actively maintained for the majority of children",
    );
  }

  if (planning.mentorRate >= 80) {
    strengths.push(
      "Cultural mentors are assigned to the majority of children — providing consistent identity support",
    );
  }

  if (planning.communityLinksRate >= 80) {
    strengths.push(
      "Strong community links established — children are connected to their wider cultural communities",
    );
  }

  if (staff.awarenessRate >= 90) {
    strengths.push(
      "All staff have completed cultural awareness training",
    );
  }

  if (staff.antiRacismRate >= 90) {
    strengths.push(
      "Excellent anti-racism training coverage across the staff team",
    );
  }

  if (staff.lgbtqAwarenessRate >= 80) {
    strengths.push(
      "Strong LGBTQ+ awareness across the staff team — supporting inclusive identity work",
    );
  }

  return strengths;
}

// -- Areas for Improvement ----------------------------------------------------

function generateAreasForImprovement(
  needs: NeedsAssessmentResult,
  activities: CulturalActivitiesResult,
  planning: IdentityPlanningResult,
  staff: StaffCulturalReadinessResult,
): string[] {
  const areas: string[] = [];

  if (needs.totalAssessments === 0) {
    areas.push(
      "No cultural needs assessments recorded — children's cultural, religious, and heritage needs must be assessed and documented",
    );
  }

  if (needs.fullyMetRate < 60 && needs.totalAssessments > 0) {
    areas.push(
      `Only ${needs.fullyMetRate}% of cultural needs are fully met — more proactive provision is required`,
    );
  }

  if (needs.childConsultedRate < 70 && needs.totalAssessments > 0) {
    areas.push(
      `Children consulted in only ${needs.childConsultedRate}% of assessments — their voice must be central to cultural identity work`,
    );
  }

  if (needs.familyConsultedRate < 60 && needs.totalAssessments > 0) {
    areas.push(
      `Family consulted in only ${needs.familyConsultedRate}% of assessments — families are a key source of cultural knowledge`,
    );
  }

  if (needs.reviewCurrentRate < 70 && needs.totalAssessments > 0) {
    areas.push(
      `Only ${needs.reviewCurrentRate}% of cultural needs assessments are current — regular reviews are essential`,
    );
  }

  if (activities.totalActivities === 0) {
    areas.push(
      "No cultural activities recorded — children must have access to activities that celebrate and support their cultural identity",
    );
  }

  if (activities.engagementRate < 65 && activities.totalActivities > 0) {
    areas.push(
      `Engagement rate at ${activities.engagementRate}% — activities should better reflect children's interests and preferences`,
    );
  }

  if (activities.childrenReachedRate < 70 && activities.totalActivities > 0) {
    areas.push(
      `Only ${activities.childrenReachedRate}% of children reached through cultural activities — all children should be included`,
    );
  }

  if (activities.positiveFeedbackRate < 65 && activities.totalActivities > 0) {
    areas.push(
      `Positive feedback rate at ${activities.positiveFeedbackRate}% — activities should be tailored to children's genuine interests`,
    );
  }

  if (planning.totalPlans === 0) {
    areas.push(
      "No identity plans recorded — every child should have a documented identity plan",
    );
  }

  if (planning.planInPlaceRate < 70 && planning.totalPlans > 0) {
    areas.push(
      `Only ${planning.planInPlaceRate}% of children have identity plans in place — all children need a plan`,
    );
  }

  if (planning.lifeStoryRate < 60 && planning.totalPlans > 0) {
    areas.push(
      `Life story work active for only ${planning.lifeStoryRate}% of children — this is a key component of identity development`,
    );
  }

  if (planning.mentorRate < 50 && planning.totalPlans > 0) {
    areas.push(
      `Cultural mentors assigned to only ${planning.mentorRate}% of children — mentorship supports identity development`,
    );
  }

  if (planning.communityLinksRate < 50 && planning.totalPlans > 0) {
    areas.push(
      `Community links established for only ${planning.communityLinksRate}% of children — connections to cultural communities are essential`,
    );
  }

  if (staff.totalStaff === 0) {
    areas.push(
      "No staff cultural training records — all staff must receive cultural competence training",
    );
  }

  if (staff.awarenessRate < 70 && staff.totalStaff > 0) {
    areas.push(
      `Only ${staff.awarenessRate}% of staff have cultural awareness training — this should be universal`,
    );
  }

  if (staff.antiRacismRate < 70 && staff.totalStaff > 0) {
    areas.push(
      `Anti-racism training at ${staff.antiRacismRate}% — all staff should complete anti-racism training`,
    );
  }

  if (staff.religiousLiteracyRate < 60 && staff.totalStaff > 0) {
    areas.push(
      `Religious literacy at ${staff.religiousLiteracyRate}% — staff need better understanding of children's faith needs`,
    );
  }

  if (staff.lgbtqAwarenessRate < 60 && staff.totalStaff > 0) {
    areas.push(
      `LGBTQ+ awareness at ${staff.lgbtqAwarenessRate}% — training on gender identity and sexual orientation is needed`,
    );
  }

  return areas;
}

// -- Actions ------------------------------------------------------------------

function generateActions(
  needs: NeedsAssessmentResult,
  activities: CulturalActivitiesResult,
  planning: IdentityPlanningResult,
  staff: StaffCulturalReadinessResult,
): string[] {
  const actions: string[] = [];

  if (needs.totalAssessments === 0) {
    actions.push(
      "URGENT: Complete cultural needs assessments for all children — CHR 2015 Reg 10 requires the home to meet children's cultural needs",
    );
  }

  if (activities.totalActivities === 0) {
    actions.push(
      "URGENT: Establish a cultural activities programme — children must have regular access to activities celebrating their identity (UNCRC Article 30)",
    );
  }

  if (planning.totalPlans === 0) {
    actions.push(
      "URGENT: Create identity plans for all children — CHR 2015 Reg 14 requires care plans to address cultural identity",
    );
  }

  if (staff.totalStaff === 0) {
    actions.push(
      "URGENT: Record and assess staff cultural training — the team must be equipped to support children's diverse identities",
    );
  }

  if (needs.childConsultedRate < 70 && needs.totalAssessments > 0) {
    actions.push(
      "Consult children in all cultural needs assessments — use age-appropriate methods to understand their wishes and feelings",
    );
  }

  if (needs.familyConsultedRate < 60 && needs.totalAssessments > 0) {
    actions.push(
      "Increase family consultation — families hold essential cultural knowledge that should inform assessments",
    );
  }

  if (needs.reviewCurrentRate < 70 && needs.totalAssessments > 0) {
    actions.push(
      "Schedule regular reviews of cultural needs assessments — ensure all assessments are current and reflect changing needs",
    );
  }

  if (needs.fullyMetRate < 60 && needs.totalAssessments > 0) {
    actions.push(
      "Develop action plans to fully meet all identified cultural needs — partially met or unmet needs require immediate attention",
    );
  }

  if (activities.childrenReachedRate < 70 && activities.totalActivities > 0) {
    actions.push(
      "Ensure cultural activities include all children — tailor activities to each child's specific cultural background",
    );
  }

  if (activities.activityVariety < 3 && activities.totalActivities > 0) {
    actions.push(
      "Broaden the range of cultural activities — include celebrations, religious observance, heritage activities, and community visits",
    );
  }

  if (activities.resourcesRate < 70 && activities.totalActivities > 0) {
    actions.push(
      "Ensure adequate resources are provided for all cultural activities — budget allocation should reflect cultural provision needs",
    );
  }

  if (planning.planInPlaceRate < 70 && planning.totalPlans > 0) {
    actions.push(
      "Complete identity plans for all children — plans should document needs, goals, and support strategies",
    );
  }

  if (planning.lifeStoryRate < 60 && planning.totalPlans > 0) {
    actions.push(
      "Prioritise life story work — this is essential for children's identity development and understanding of their heritage",
    );
  }

  if (planning.mentorRate < 50 && planning.totalPlans > 0) {
    actions.push(
      "Assign cultural mentors to children — connect them with adults who share their cultural background",
    );
  }

  if (planning.communityLinksRate < 50 && planning.totalPlans > 0) {
    actions.push(
      "Establish community links for children — connect with local cultural groups, faith communities, and heritage organisations",
    );
  }

  if (staff.awarenessRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Deliver cultural awareness training to all staff — Equality Act 2010 requires proactive commitment to equality",
    );
  }

  if (staff.antiRacismRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Implement anti-racism training for all staff — this is a fundamental requirement for safe, inclusive care",
    );
  }

  if (staff.religiousLiteracyRate < 60 && staff.totalStaff > 0) {
    actions.push(
      "Deliver religious literacy training — staff must understand and respect children's faith and spiritual needs",
    );
  }

  if (staff.lgbtqAwarenessRate < 60 && staff.totalStaff > 0) {
    actions.push(
      "Provide LGBTQ+ awareness training — staff must be able to support children exploring gender identity and sexual orientation",
    );
  }

  if (staff.communicationDiversityRate < 60 && staff.totalStaff > 0) {
    actions.push(
      "Train staff in communication diversity — including supporting children with different languages and communication needs",
    );
  }

  return actions;
}

// -- Main Intelligence Function -----------------------------------------------

export function generateCulturalIdentitySupportIntelligence(
  assessments: CulturalNeedsAssessment[],
  activities: CulturalActivity[],
  plans: IdentityPlan[],
  training: StaffCulturalTraining[],
  totalChildren: number,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): CulturalIdentitySupportIntelligence {
  const needsResult = evaluateNeedsAssessment(assessments);
  const activitiesResult = evaluateCulturalActivities(activities, totalChildren);
  const planningResult = evaluateIdentityPlanning(plans);
  const staffResult = evaluateStaffCulturalReadiness(training);

  const rawScore =
    needsResult.overallScore +
    activitiesResult.overallScore +
    planningResult.overallScore +
    staffResult.overallScore;
  const overallScore = Math.min(rawScore, 100);

  const strengths = generateStrengths(
    needsResult,
    activitiesResult,
    planningResult,
    staffResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    needsResult,
    activitiesResult,
    planningResult,
    staffResult,
  );
  const actions = generateActions(
    needsResult,
    activitiesResult,
    planningResult,
    staffResult,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 10 — duty to meet children's cultural, linguistic, religious, and racial needs",
    "CHR 2015 Reg 14 — care planning standard including cultural identity",
    "SCCIF — experiences and progress of children including cultural identity",
    "UNCRC Article 8 — right to preservation of identity",
    "UNCRC Article 30 — right of minority children to enjoy their own culture, religion, and language",
    "Equality Act 2010 — protection from discrimination and promotion of equality",
    "Children Act 1989 s22(5)(c) — due consideration to religious, racial, cultural, and linguistic needs",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating: getRating(overallScore),
    needsAssessment: needsResult,
    culturalActivities: activitiesResult,
    identityPlanning: planningResult,
    staffReadiness: staffResult,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
