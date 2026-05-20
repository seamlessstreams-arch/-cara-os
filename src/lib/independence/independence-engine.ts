// ==============================================================================
// Independence Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well a children's residential home prepares looked-after
// children for independent living — life skills, self-care, money management,
// cooking, travel, health, social skills, and education/employment readiness.
//
//   1. Independence Quality     (quality of independence assessments)
//   2. Independence Compliance  (documentation, pathway alignment, diversity)
//   3. Independence Policy      (7 boolean policy dimensions)
//   4. Staff Independence Readiness (6 training competencies)
//
// Regulatory: CHR 2015 Reg 5, CHR 2015 Reg 9, Children (Leaving Care) Act 2000,
//             SCCIF, Care Leavers Strategy 2013, Children Act 1989 s.23C,
//             DfE Guide to Children's Homes Regulations: Independence
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type IndependenceCategory =
  | "cooking_nutrition"
  | "money_management"
  | "personal_hygiene"
  | "household_tasks"
  | "travel_skills"
  | "health_management"
  | "social_skills"
  | "education_employment";

export type IndependenceOutcome =
  | "mastered"
  | "progressing"
  | "developing"
  | "not_started"
  | "regressed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Constants -----------------------------------------------------------------

const ALL_CATEGORIES: IndependenceCategory[] = [
  "cooking_nutrition",
  "money_management",
  "personal_hygiene",
  "household_tasks",
  "travel_skills",
  "health_management",
  "social_skills",
  "education_employment",
];

// -- Label maps ----------------------------------------------------------------

const categoryLabels: Record<IndependenceCategory, string> = {
  cooking_nutrition: "Cooking & Nutrition",
  money_management: "Money Management",
  personal_hygiene: "Personal Hygiene",
  household_tasks: "Household Tasks",
  travel_skills: "Travel Skills",
  health_management: "Health Management",
  social_skills: "Social Skills",
  education_employment: "Education & Employment",
};

const outcomeLabels: Record<IndependenceOutcome, string> = {
  mastered: "Mastered",
  progressing: "Progressing",
  developing: "Developing",
  not_started: "Not Started",
  regressed: "Regressed",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getCategoryLabel(cat: IndependenceCategory): string {
  return categoryLabels[cat] ?? cat;
}
export function getOutcomeLabel(outcome: IndependenceOutcome): string {
  return outcomeLabels[outcome] ?? outcome;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface IndependenceRecord {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  category: IndependenceCategory;
  outcome: IndependenceOutcome;
  individualPlanInPlace: boolean;
  ageAppropriate: boolean;
  childEngaged: boolean;
  progressRecorded: boolean;
  documentationComplete: boolean;
  pathwayPlanAligned: boolean;
}

export interface IndependencePolicy {
  id: string;
  independencePolicy: boolean;
  pathwayPlanningGuidance: boolean;
  lifeSkillsFramework: boolean;
  transitionProtocol: boolean;
  leavingCarePreparation: boolean;
  partnershipWorkingPolicy: boolean;
  reviewSchedule: boolean;
}

export interface StaffIndependenceTraining {
  id: string;
  staffId: string;
  staffName: string;
  independencePlanning: boolean;
  lifeSkillsTeaching: boolean;
  pathwayKnowledge: boolean;
  motivationalSkills: boolean;
  communityResources: boolean;
  transitionSupport: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface IndependenceQualityResult {
  overallScore: number;
  totalRecords: number;
  individualPlanRate: number;
  ageAppropriateRate: number;
  childEngagedRate: number;
  progressRecordedRate: number;
}

export interface IndependenceComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  pathwayPlanAlignedRate: number;
  positiveOutcomeRate: number;
  categoryDiversityRate: number;
}

export interface IndependencePolicyResult {
  overallScore: number;
  independencePolicyMet: boolean;
  pathwayPlanningGuidanceMet: boolean;
  lifeSkillsFrameworkMet: boolean;
  transitionProtocolMet: boolean;
  leavingCarePreparationMet: boolean;
  partnershipWorkingPolicyMet: boolean;
  reviewScheduleMet: boolean;
}

export interface StaffIndependenceReadinessResult {
  overallScore: number;
  totalStaff: number;
  independencePlanningRate: number;
  lifeSkillsTeachingRate: number;
  pathwayKnowledgeRate: number;
  motivationalSkillsRate: number;
  communityResourcesRate: number;
  transitionSupportRate: number;
}

export interface ChildIndependenceProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  individualPlanRate: number;
  childEngagedRate: number;
  uniqueCategories: number;
  overallScore: number;
}

export interface IndependenceIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  independenceQuality: IndependenceQualityResult;
  independenceCompliance: IndependenceComplianceResult;
  independencePolicy: IndependencePolicyResult;
  staffIndependenceReadiness: StaffIndependenceReadinessResult;
  childProfiles: ChildIndependenceProfile[];
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
 * Evaluates independence quality across all assessment records.
 * Empty = 0 (no records = no evidence of quality).
 *
 *   Individual plan in place rate        -> 0-7
 *   Age appropriate rate                 -> 0-6
 *   Child engaged rate                   -> 0-6
 *   Progress recorded rate               -> 0-6
 */
export function evaluateIndependenceQuality(
  records: IndependenceRecord[],
): IndependenceQualityResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      individualPlanRate: 0,
      ageAppropriateRate: 0,
      childEngagedRate: 0,
      progressRecordedRate: 0,
    };
  }

  let score = 0;

  const planCount = records.filter((r) => r.individualPlanInPlace).length;
  const individualPlanRate = pct(planCount, records.length);
  if (individualPlanRate >= 90) score += 7;
  else if (individualPlanRate >= 70) score += 5;
  else if (individualPlanRate >= 50) score += 3;
  else if (individualPlanRate > 0) score += 1;

  const ageCount = records.filter((r) => r.ageAppropriate).length;
  const ageAppropriateRate = pct(ageCount, records.length);
  if (ageAppropriateRate >= 90) score += 6;
  else if (ageAppropriateRate >= 70) score += 4;
  else if (ageAppropriateRate >= 50) score += 3;
  else if (ageAppropriateRate > 0) score += 1;

  const engagedCount = records.filter((r) => r.childEngaged).length;
  const childEngagedRate = pct(engagedCount, records.length);
  if (childEngagedRate >= 90) score += 6;
  else if (childEngagedRate >= 70) score += 4;
  else if (childEngagedRate >= 50) score += 3;
  else if (childEngagedRate > 0) score += 1;

  const progressCount = records.filter((r) => r.progressRecorded).length;
  const progressRecordedRate = pct(progressCount, records.length);
  if (progressRecordedRate >= 90) score += 6;
  else if (progressRecordedRate >= 70) score += 4;
  else if (progressRecordedRate >= 50) score += 3;
  else if (progressRecordedRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    individualPlanRate,
    ageAppropriateRate,
    childEngagedRate,
    progressRecordedRate,
  };
}

/**
 * Evaluates independence compliance across all assessment records.
 * Empty = 0 (no records = no evidence of compliance).
 *
 *   Documentation complete rate           -> 0-8
 *   Pathway plan aligned rate             -> 0-7
 *   Positive outcome rate (mastered/progressing) -> 0-5
 *   Category diversity (unique / 8)       -> 0-5
 */
export function evaluateIndependenceCompliance(
  records: IndependenceRecord[],
): IndependenceComplianceResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      documentationCompleteRate: 0,
      pathwayPlanAlignedRate: 0,
      positiveOutcomeRate: 0,
      categoryDiversityRate: 0,
    };
  }

  let score = 0;

  const docCount = records.filter((r) => r.documentationComplete).length;
  const documentationCompleteRate = pct(docCount, records.length);
  if (documentationCompleteRate >= 90) score += 8;
  else if (documentationCompleteRate >= 70) score += 6;
  else if (documentationCompleteRate >= 50) score += 4;
  else if (documentationCompleteRate > 0) score += 2;

  const pathwayCount = records.filter((r) => r.pathwayPlanAligned).length;
  const pathwayPlanAlignedRate = pct(pathwayCount, records.length);
  if (pathwayPlanAlignedRate >= 90) score += 7;
  else if (pathwayPlanAlignedRate >= 70) score += 5;
  else if (pathwayPlanAlignedRate >= 50) score += 3;
  else if (pathwayPlanAlignedRate > 0) score += 1;

  const positiveCount = records.filter(
    (r) => r.outcome === "mastered" || r.outcome === "progressing",
  ).length;
  const positiveOutcomeRate = pct(positiveCount, records.length);
  if (positiveOutcomeRate >= 90) score += 5;
  else if (positiveOutcomeRate >= 70) score += 4;
  else if (positiveOutcomeRate >= 50) score += 3;
  else if (positiveOutcomeRate > 0) score += 1;

  const uniqueCategories = new Set(records.map((r) => r.category));
  const categoryDiversityRate = pct(uniqueCategories.size, ALL_CATEGORIES.length);
  if (categoryDiversityRate >= 90) score += 5;
  else if (categoryDiversityRate >= 70) score += 4;
  else if (categoryDiversityRate >= 50) score += 3;
  else if (categoryDiversityRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    documentationCompleteRate,
    pathwayPlanAlignedRate,
    positiveOutcomeRate,
    categoryDiversityRate,
  };
}

/**
 * Evaluates independence policy compliance.
 * null = 0 (no policy = no evidence of governance).
 *
 *   independencePolicy         -> 0-4
 *   pathwayPlanningGuidance    -> 0-4
 *   lifeSkillsFramework       -> 0-4
 *   transitionProtocol        -> 0-4
 *   leavingCarePreparation    -> 0-3
 *   partnershipWorkingPolicy  -> 0-3
 *   reviewSchedule            -> 0-3
 */
export function evaluateIndependencePolicy(
  policy: IndependencePolicy | null,
): IndependencePolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      independencePolicyMet: false,
      pathwayPlanningGuidanceMet: false,
      lifeSkillsFrameworkMet: false,
      transitionProtocolMet: false,
      leavingCarePreparationMet: false,
      partnershipWorkingPolicyMet: false,
      reviewScheduleMet: false,
    };
  }

  let score = 0;

  if (policy.independencePolicy) score += 4;
  if (policy.pathwayPlanningGuidance) score += 4;
  if (policy.lifeSkillsFramework) score += 4;
  if (policy.transitionProtocol) score += 4;
  if (policy.leavingCarePreparation) score += 3;
  if (policy.partnershipWorkingPolicy) score += 3;
  if (policy.reviewSchedule) score += 3;

  return {
    overallScore: Math.min(score, 25),
    independencePolicyMet: policy.independencePolicy,
    pathwayPlanningGuidanceMet: policy.pathwayPlanningGuidance,
    lifeSkillsFrameworkMet: policy.lifeSkillsFramework,
    transitionProtocolMet: policy.transitionProtocol,
    leavingCarePreparationMet: policy.leavingCarePreparation,
    partnershipWorkingPolicyMet: policy.partnershipWorkingPolicy,
    reviewScheduleMet: policy.reviewSchedule,
  };
}

/**
 * Evaluates staff independence readiness from training records.
 * Empty = 0 (no training = no evidence of competence).
 *
 *   independencePlanning  -> 0-6
 *   lifeSkillsTeaching    -> 0-5
 *   pathwayKnowledge      -> 0-5
 *   motivationalSkills    -> 0-4
 *   communityResources    -> 0-3
 *   transitionSupport     -> 0-2
 */
export function evaluateStaffIndependenceReadiness(
  staff: StaffIndependenceTraining[],
): StaffIndependenceReadinessResult {
  if (staff.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      independencePlanningRate: 0,
      lifeSkillsTeachingRate: 0,
      pathwayKnowledgeRate: 0,
      motivationalSkillsRate: 0,
      communityResourcesRate: 0,
      transitionSupportRate: 0,
    };
  }

  let score = 0;

  const planningCount = staff.filter((s) => s.independencePlanning).length;
  const independencePlanningRate = pct(planningCount, staff.length);
  if (independencePlanningRate >= 90) score += 6;
  else if (independencePlanningRate >= 70) score += 4;
  else if (independencePlanningRate >= 50) score += 3;
  else if (independencePlanningRate > 0) score += 1;

  const teachingCount = staff.filter((s) => s.lifeSkillsTeaching).length;
  const lifeSkillsTeachingRate = pct(teachingCount, staff.length);
  if (lifeSkillsTeachingRate >= 90) score += 5;
  else if (lifeSkillsTeachingRate >= 70) score += 3;
  else if (lifeSkillsTeachingRate >= 50) score += 2;
  else if (lifeSkillsTeachingRate > 0) score += 1;

  const pathwayCount = staff.filter((s) => s.pathwayKnowledge).length;
  const pathwayKnowledgeRate = pct(pathwayCount, staff.length);
  if (pathwayKnowledgeRate >= 90) score += 5;
  else if (pathwayKnowledgeRate >= 70) score += 3;
  else if (pathwayKnowledgeRate >= 50) score += 2;
  else if (pathwayKnowledgeRate > 0) score += 1;

  const motivationalCount = staff.filter((s) => s.motivationalSkills).length;
  const motivationalSkillsRate = pct(motivationalCount, staff.length);
  if (motivationalSkillsRate >= 90) score += 4;
  else if (motivationalSkillsRate >= 70) score += 3;
  else if (motivationalSkillsRate >= 50) score += 2;
  else if (motivationalSkillsRate > 0) score += 1;

  const communityCount = staff.filter((s) => s.communityResources).length;
  const communityResourcesRate = pct(communityCount, staff.length);
  if (communityResourcesRate >= 90) score += 3;
  else if (communityResourcesRate >= 70) score += 2;
  else if (communityResourcesRate >= 50) score += 1;

  const transitionCount = staff.filter((s) => s.transitionSupport).length;
  const transitionSupportRate = pct(transitionCount, staff.length);
  if (transitionSupportRate >= 90) score += 2;
  else if (transitionSupportRate >= 70) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: staff.length,
    independencePlanningRate,
    lifeSkillsTeachingRate,
    pathwayKnowledgeRate,
    motivationalSkillsRate,
    communityResourcesRate,
    transitionSupportRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildIndependenceProfiles(
  records: IndependenceRecord[],
): ChildIndependenceProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const r of records) {
    childIds.add(r.childId);
    childNames.set(r.childId, r.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childRecords = records.filter((r) => r.childId === childId);
    const childName = childNames.get(childId) ?? childId;

    const planCount = childRecords.filter((r) => r.individualPlanInPlace).length;
    const individualPlanRate = pct(planCount, childRecords.length);

    const engagedCount = childRecords.filter((r) => r.childEngaged).length;
    const childEngagedRate = pct(engagedCount, childRecords.length);

    const uniqueCategories = new Set(childRecords.map((r) => r.category)).size;

    // Score 0-10
    let score = 0;

    // Frequency (0-2): >=10 records -> 2, >=5 -> 1
    if (childRecords.length >= 10) score += 2;
    else if (childRecords.length >= 5) score += 1;

    // Individual plan rate (0-3)
    if (individualPlanRate >= 80) score += 3;
    else if (individualPlanRate >= 60) score += 2;
    else if (individualPlanRate > 0) score += 1;

    // Child engaged rate (0-3)
    if (childEngagedRate >= 80) score += 3;
    else if (childEngagedRate >= 60) score += 2;
    else if (childEngagedRate > 0) score += 1;

    // Diversity (0-2): >=4 unique categories -> 2, >=2 -> 1
    if (uniqueCategories >= 4) score += 2;
    else if (uniqueCategories >= 2) score += 1;

    return {
      childId,
      childName,
      totalRecords: childRecords.length,
      individualPlanRate,
      childEngagedRate,
      uniqueCategories,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateIndependenceIntelligence(
  records: IndependenceRecord[],
  policy: IndependencePolicy | null,
  staff: StaffIndependenceTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): IndependenceIntelligence {
  const independenceQuality = evaluateIndependenceQuality(records);
  const independenceCompliance = evaluateIndependenceCompliance(records);
  const independencePolicy = evaluateIndependencePolicy(policy);
  const staffIndependenceReadiness = evaluateStaffIndependenceReadiness(staff);

  const rawScore =
    independenceQuality.overallScore +
    independenceCompliance.overallScore +
    independencePolicy.overallScore +
    staffIndependenceReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildIndependenceProfiles(records);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (independenceQuality.individualPlanRate >= 80) {
    strengths.push(
      "Strong individual independence planning — children consistently have personalised plans in place",
    );
  }
  if (independenceQuality.childEngagedRate >= 80) {
    strengths.push(
      "Excellent child engagement — children are actively participating in their independence development",
    );
  }
  if (independenceQuality.ageAppropriateRate >= 80) {
    strengths.push(
      "Independence activities are consistently age-appropriate and tailored to individual needs",
    );
  }
  if (independenceCompliance.documentationCompleteRate >= 80) {
    strengths.push(
      "Documentation standards are high — independence assessments are thoroughly recorded",
    );
  }
  if (independenceCompliance.pathwayPlanAlignedRate >= 80) {
    strengths.push(
      "Independence work is well-aligned with pathway planning and transition goals",
    );
  }
  if (independencePolicy.overallScore >= 22) {
    strengths.push(
      "Comprehensive independence policies in place supporting preparation for adulthood",
    );
  }
  if (staffIndependenceReadiness.overallScore >= 22) {
    strengths.push(
      "Staff team well-trained across independence planning, life skills teaching, and transition support",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (independenceQuality.childEngagedRate < 60 && records.length > 0) {
    areasForImprovement.push(
      "Child engagement in independence activities is below expectations — review how activities are structured and whether children have meaningful choice",
    );
  }
  if (independenceCompliance.documentationCompleteRate < 60 && records.length > 0) {
    areasForImprovement.push(
      "Documentation of independence assessments needs strengthening — ensure all assessments are fully recorded",
    );
  }
  if (independenceCompliance.pathwayPlanAlignedRate < 60 && records.length > 0) {
    areasForImprovement.push(
      "Independence work is insufficiently aligned with pathway plans — strengthen links between daily activities and transition goals",
    );
  }
  if (independenceCompliance.categoryDiversityRate < 60 && records.length > 0) {
    areasForImprovement.push(
      "Limited range of independence categories covered — broaden activities to include cooking, money, hygiene, travel, health, social, and education skills",
    );
  }
  if (staffIndependenceReadiness.motivationalSkillsRate < 60 && staff.length > 0) {
    areasForImprovement.push(
      "Motivational skills training needs improvement across the staff team to better support children's independence journey",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push(
      "No independence assessment records found — begin recording independence skill assessments for all children",
    );
  }
  if (policy === null || independencePolicy.overallScore === 0) {
    actions.push(
      "URGENT: No independence policy in place — develop and implement a comprehensive independence preparation and leaving care policy",
    );
  }
  if (staff.length === 0 || staffIndependenceReadiness.overallScore === 0) {
    actions.push(
      "URGENT: No staff independence training records — deliver independence planning, life skills teaching, and transition support training to all staff",
    );
  }
  if (independenceQuality.individualPlanRate < 50 && records.length > 0) {
    actions.push(
      "Review individual independence plans — too few children have personalised plans in place for their independence journey",
    );
  }
  if (independenceCompliance.positiveOutcomeRate < 50 && records.length > 0) {
    actions.push(
      "Positive outcome rate is low — review independence teaching methods and consider additional support or alternative approaches",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 5 — Quality and purpose of care (preparing for independence)",
    "CHR 2015 Regulation 9 — Promoting independence",
    "Children (Leaving Care) Act 2000 — Pathway planning",
    "SCCIF — Preparation for independence",
    "Care Leavers Strategy 2013",
    "Children Act 1989 s.23C — Continuing functions",
    "DfE Guide to Children's Homes Regulations: Independence",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    independenceQuality,
    independenceCompliance,
    independencePolicy,
    staffIndependenceReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
