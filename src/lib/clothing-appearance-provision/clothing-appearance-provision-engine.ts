// Clothing Appearance Provision Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// -- Type unions ---------------------------------------------------------------

import { above, below, meanOf, meets, rate } from "@/lib/metrics/rate";

export type ClothingCategory =
  | "everyday_wear"
  | "school_uniform"
  | "seasonal_clothing"
  | "footwear"
  | "sleepwear"
  | "sportswear"
  | "formal_occasion"
  | "cultural_religious";

export type ProvisionQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "not_assessed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const clothingCategoryLabels: Record<ClothingCategory, string> = {
  everyday_wear: "Everyday Wear",
  school_uniform: "School Uniform",
  seasonal_clothing: "Seasonal Clothing",
  footwear: "Footwear",
  sleepwear: "Sleepwear",
  sportswear: "Sportswear",
  formal_occasion: "Formal Occasion",
  cultural_religious: "Cultural / Religious",
};

const provisionQualityLabels: Record<ProvisionQuality, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
  not_assessed: "Not Assessed",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getClothingCategoryLabel(c: ClothingCategory): string {
  return clothingCategoryLabels[c] ?? c;
}
export function getProvisionQualityLabel(q: ProvisionQuality): string {
  return provisionQualityLabels[q] ?? q;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface ClothingAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  clothingCategory: ClothingCategory;
  provisionQuality: ProvisionQuality;
  childChoiceRespected: boolean;
  ageAppropriate: boolean;
  culturalNeedsMet: boolean;
  documentedInPlan: boolean;
  staffAssessed: boolean;
  feedbackGiven: boolean;
}

export interface ClothingPolicy {
  id: string;
  clothingProvisionStrategy: boolean;
  clothingBudgetFramework: boolean;
  seasonalReviewProcedure: boolean;
  childChoiceGuidance: boolean;
  culturalAndReligiousAccommodation: boolean;
  laundryAndMaintenancePlan: boolean;
  regularReview: boolean;
}

export interface StaffClothingTraining {
  id: string;
  staffId: string;
  staffName: string;
  clothingAssessment: boolean;
  childChoiceFacilitation: boolean;
  budgetManagement: boolean;
  culturalAwareness: boolean;
  ageAppropriateGuidance: boolean;
  recordKeeping: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface QualityResult {
  overallScore: number;
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  qualityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childChoiceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  ageAppropriateRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  culturalRate: number | null;
}

export interface ComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffAssessedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  feedbackRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  categoryDiversityRatio: number | null;
}

export interface PolicyResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  clothingProvisionStrategyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  clothingBudgetFrameworkRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  seasonalReviewProcedureRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childChoiceGuidanceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  culturalAndReligiousAccommodationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  laundryAndMaintenancePlanRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  regularReviewRate: number | null;
}

export interface StaffReadinessResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  clothingAssessmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childChoiceFacilitationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  budgetManagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  culturalAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  ageAppropriateGuidanceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordKeepingRate: number | null;
}

export interface ChildProfile {
  childId: string;
  childName: string;
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  qualityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childChoiceRate: number | null;
  overallScore: number;
}

export interface ClothingAppearanceProvisionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  quality: QualityResult;
  compliance: ComplianceResult;
  policy: PolicyResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

// Was `if (den === 0) return 0;`: nothing recorded read as 0%.
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates clothing provision quality across all assessments.
 * Empty = 0 (no assessments = no evidence of provision).
 *
 *   Quality rate (excellent+good)          -> 0-7
 *   Child choice rate                      -> 0-6
 *   Age appropriate rate                   -> 0-6
 *   Cultural needs met rate                -> 0-6
 */
export function evaluateQuality(
  assessments: ClothingAssessment[],
): QualityResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      qualityRate: null,
      childChoiceRate: null,
      ageAppropriateRate: null,
      culturalRate: null,
    };
  }

  let score = 0;

  const highQuality = assessments.filter(
    (a) => a.provisionQuality === "excellent" || a.provisionQuality === "good",
  ).length;
  const qualityRate = rate(highQuality, assessments.length);
  if (meets(qualityRate, 90)) score += 7;
  else if (meets(qualityRate, 70)) score += 5;
  else if (meets(qualityRate, 50)) score += 3;
  else if (above(qualityRate, 0)) score += 1;

  const childChoice = assessments.filter((a) => a.childChoiceRespected).length;
  const childChoiceRate = rate(childChoice, assessments.length);
  if (meets(childChoiceRate, 90)) score += 6;
  else if (meets(childChoiceRate, 70)) score += 4;
  else if (meets(childChoiceRate, 50)) score += 3;
  else if (above(childChoiceRate, 0)) score += 1;

  const ageAppropriate = assessments.filter((a) => a.ageAppropriate).length;
  const ageAppropriateRate = rate(ageAppropriate, assessments.length);
  if (meets(ageAppropriateRate, 90)) score += 6;
  else if (meets(ageAppropriateRate, 70)) score += 4;
  else if (meets(ageAppropriateRate, 50)) score += 3;
  else if (above(ageAppropriateRate, 0)) score += 1;

  const cultural = assessments.filter((a) => a.culturalNeedsMet).length;
  const culturalRate = rate(cultural, assessments.length);
  if (meets(culturalRate, 90)) score += 6;
  else if (meets(culturalRate, 70)) score += 4;
  else if (meets(culturalRate, 50)) score += 3;
  else if (above(culturalRate, 0)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalAssessments: assessments.length,
    qualityRate,
    childChoiceRate,
    ageAppropriateRate,
    culturalRate,
  };
}

/**
 * Evaluates compliance across all assessments.
 * Empty = 0 (no assessments = no evidence of compliance).
 *
 *   Documented in plan rate               -> 0-8
 *   Staff assessed rate                   -> 0-7
 *   Feedback given rate                   -> 0-5
 *   Category diversity ratio              -> 0-5
 */
export function evaluateCompliance(
  assessments: ClothingAssessment[],
): ComplianceResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      documentedRate: null,
      staffAssessedRate: null,
      feedbackRate: null,
      categoryDiversityRatio: 0,
    };
  }

  let score = 0;

  const documented = assessments.filter((a) => a.documentedInPlan).length;
  const documentedRate = rate(documented, assessments.length);
  if (meets(documentedRate, 90)) score += 8;
  else if (meets(documentedRate, 70)) score += 6;
  else if (meets(documentedRate, 50)) score += 4;
  else if (above(documentedRate, 0)) score += 2;

  const staffAssessed = assessments.filter((a) => a.staffAssessed).length;
  const staffAssessedRate = rate(staffAssessed, assessments.length);
  if (meets(staffAssessedRate, 90)) score += 7;
  else if (meets(staffAssessedRate, 70)) score += 5;
  else if (meets(staffAssessedRate, 50)) score += 3;
  else if (above(staffAssessedRate, 0)) score += 1;

  const feedback = assessments.filter((a) => a.feedbackGiven).length;
  const feedbackRate = rate(feedback, assessments.length);
  if (meets(feedbackRate, 90)) score += 5;
  else if (meets(feedbackRate, 70)) score += 3;
  else if (meets(feedbackRate, 50)) score += 2;
  else if (above(feedbackRate, 0)) score += 1;

  const uniqueCategories = new Set(assessments.map((a) => a.clothingCategory)).size;
  const totalCategories = 8; // total ClothingCategory values
  const categoryDiversityRatio = rate(uniqueCategories, totalCategories);
  if (meets(categoryDiversityRatio, 90)) score += 5;
  else if (meets(categoryDiversityRatio, 70)) score += 3;
  else if (meets(categoryDiversityRatio, 50)) score += 2;
  else if (above(categoryDiversityRatio, 0)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    documentedRate,
    staffAssessedRate,
    feedbackRate,
    categoryDiversityRatio,
  };
}

/**
 * Evaluates clothing policy compliance.
 * Empty = 0 (no policies = no evidence of governance).
 *
 *   clothingProvisionStrategy             -> 0-4
 *   clothingBudgetFramework               -> 0-4
 *   seasonalReviewProcedure               -> 0-4
 *   childChoiceGuidance                   -> 0-4
 *   culturalAndReligiousAccommodation     -> 0-3
 *   laundryAndMaintenancePlan             -> 0-3
 *   regularReview                         -> 0-3
 */
export function evaluatePolicy(
  policies: ClothingPolicy[],
): PolicyResult {
  if (policies.length === 0) {
    return {
      overallScore: 0,
      clothingProvisionStrategyRate: null,
      clothingBudgetFrameworkRate: null,
      seasonalReviewProcedureRate: null,
      childChoiceGuidanceRate: null,
      culturalAndReligiousAccommodationRate: null,
      laundryAndMaintenancePlanRate: null,
      regularReviewRate: null,
    };
  }

  let score = 0;

  const strategy = policies.filter((p) => p.clothingProvisionStrategy).length;
  const clothingProvisionStrategyRate = rate(strategy, policies.length);
  if (meets(clothingProvisionStrategyRate, 90)) score += 4;
  else if (meets(clothingProvisionStrategyRate, 70)) score += 3;
  else if (meets(clothingProvisionStrategyRate, 50)) score += 2;
  else if (above(clothingProvisionStrategyRate, 0)) score += 1;

  const budget = policies.filter((p) => p.clothingBudgetFramework).length;
  const clothingBudgetFrameworkRate = rate(budget, policies.length);
  if (meets(clothingBudgetFrameworkRate, 90)) score += 4;
  else if (meets(clothingBudgetFrameworkRate, 70)) score += 3;
  else if (meets(clothingBudgetFrameworkRate, 50)) score += 2;
  else if (above(clothingBudgetFrameworkRate, 0)) score += 1;

  const seasonal = policies.filter((p) => p.seasonalReviewProcedure).length;
  const seasonalReviewProcedureRate = rate(seasonal, policies.length);
  if (meets(seasonalReviewProcedureRate, 90)) score += 4;
  else if (meets(seasonalReviewProcedureRate, 70)) score += 3;
  else if (meets(seasonalReviewProcedureRate, 50)) score += 2;
  else if (above(seasonalReviewProcedureRate, 0)) score += 1;

  const childChoice = policies.filter((p) => p.childChoiceGuidance).length;
  const childChoiceGuidanceRate = rate(childChoice, policies.length);
  if (meets(childChoiceGuidanceRate, 90)) score += 4;
  else if (meets(childChoiceGuidanceRate, 70)) score += 3;
  else if (meets(childChoiceGuidanceRate, 50)) score += 2;
  else if (above(childChoiceGuidanceRate, 0)) score += 1;

  const cultural = policies.filter((p) => p.culturalAndReligiousAccommodation).length;
  const culturalAndReligiousAccommodationRate = rate(cultural, policies.length);
  if (meets(culturalAndReligiousAccommodationRate, 90)) score += 3;
  else if (meets(culturalAndReligiousAccommodationRate, 70)) score += 2;
  else if (meets(culturalAndReligiousAccommodationRate, 50)) score += 1;

  const laundry = policies.filter((p) => p.laundryAndMaintenancePlan).length;
  const laundryAndMaintenancePlanRate = rate(laundry, policies.length);
  if (meets(laundryAndMaintenancePlanRate, 90)) score += 3;
  else if (meets(laundryAndMaintenancePlanRate, 70)) score += 2;
  else if (meets(laundryAndMaintenancePlanRate, 50)) score += 1;

  const review = policies.filter((p) => p.regularReview).length;
  const regularReviewRate = rate(review, policies.length);
  if (meets(regularReviewRate, 90)) score += 3;
  else if (meets(regularReviewRate, 70)) score += 2;
  else if (meets(regularReviewRate, 50)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    clothingProvisionStrategyRate,
    clothingBudgetFrameworkRate,
    seasonalReviewProcedureRate,
    childChoiceGuidanceRate,
    culturalAndReligiousAccommodationRate,
    laundryAndMaintenancePlanRate,
    regularReviewRate,
  };
}

/**
 * Evaluates staff readiness for clothing provision.
 * Empty = 0 (no training = no evidence of competence).
 *
 *   clothingAssessment        -> 0-6
 *   childChoiceFacilitation   -> 0-5
 *   budgetManagement          -> 0-5
 *   culturalAwareness         -> 0-4
 *   ageAppropriateGuidance    -> 0-3
 *   recordKeeping             -> 0-2
 */
export function evaluateStaffReadiness(
  training: StaffClothingTraining[],
): StaffReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      clothingAssessmentRate: null,
      childChoiceFacilitationRate: null,
      budgetManagementRate: null,
      culturalAwarenessRate: null,
      ageAppropriateGuidanceRate: null,
      recordKeepingRate: null,
    };
  }

  let score = 0;

  const clothingAssessment = training.filter((t) => t.clothingAssessment).length;
  const clothingAssessmentRate = rate(clothingAssessment, training.length);
  if (meets(clothingAssessmentRate, 90)) score += 6;
  else if (meets(clothingAssessmentRate, 70)) score += 4;
  else if (meets(clothingAssessmentRate, 50)) score += 3;
  else if (above(clothingAssessmentRate, 0)) score += 1;

  const childChoice = training.filter((t) => t.childChoiceFacilitation).length;
  const childChoiceFacilitationRate = rate(childChoice, training.length);
  if (meets(childChoiceFacilitationRate, 90)) score += 5;
  else if (meets(childChoiceFacilitationRate, 70)) score += 3;
  else if (meets(childChoiceFacilitationRate, 50)) score += 2;
  else if (above(childChoiceFacilitationRate, 0)) score += 1;

  const budgetMgmt = training.filter((t) => t.budgetManagement).length;
  const budgetManagementRate = rate(budgetMgmt, training.length);
  if (meets(budgetManagementRate, 90)) score += 5;
  else if (meets(budgetManagementRate, 70)) score += 3;
  else if (meets(budgetManagementRate, 50)) score += 2;
  else if (above(budgetManagementRate, 0)) score += 1;

  const cultural = training.filter((t) => t.culturalAwareness).length;
  const culturalAwarenessRate = rate(cultural, training.length);
  if (meets(culturalAwarenessRate, 90)) score += 4;
  else if (meets(culturalAwarenessRate, 70)) score += 3;
  else if (meets(culturalAwarenessRate, 50)) score += 2;
  else if (above(culturalAwarenessRate, 0)) score += 1;

  const ageApp = training.filter((t) => t.ageAppropriateGuidance).length;
  const ageAppropriateGuidanceRate = rate(ageApp, training.length);
  if (meets(ageAppropriateGuidanceRate, 90)) score += 3;
  else if (meets(ageAppropriateGuidanceRate, 70)) score += 2;
  else if (meets(ageAppropriateGuidanceRate, 50)) score += 1;

  const recordKeeping = training.filter((t) => t.recordKeeping).length;
  const recordKeepingRate = rate(recordKeeping, training.length);
  if (meets(recordKeepingRate, 90)) score += 2;
  else if (meets(recordKeepingRate, 70)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    clothingAssessmentRate,
    childChoiceFacilitationRate,
    budgetManagementRate,
    culturalAwarenessRate,
    ageAppropriateGuidanceRate,
    recordKeepingRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildProfiles(
  assessments: ClothingAssessment[],
): ChildProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const a of assessments) {
    childIds.add(a.childId);
    childNames.set(a.childId, a.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childAssessments = assessments.filter((a) => a.childId === childId);
    const childName = childNames.get(childId) ?? childId;

    const highQuality = childAssessments.filter(
      (a) => a.provisionQuality === "excellent" || a.provisionQuality === "good",
    ).length;
    const qualityRate = rate(highQuality, childAssessments.length);

    const childChoice = childAssessments.filter((a) => a.childChoiceRespected).length;
    const childChoiceRate = rate(childChoice, childAssessments.length);

    // Score 0-10
    let score = 0;

    // Quality (0-4)
    if (childAssessments.length === 0) {
      score += 0;
    } else if (meets(qualityRate, 80)) {
      score += 4;
    } else if (meets(qualityRate, 60)) {
      score += 3;
    } else if (meets(qualityRate, 40)) {
      score += 2;
    } else {
      score += 1;
    }

    // Child choice (0-3)
    if (childAssessments.length === 0) {
      score += 0;
    } else if (meets(childChoiceRate, 80)) {
      score += 3;
    } else if (meets(childChoiceRate, 60)) {
      score += 2;
    } else if (above(childChoiceRate, 0)) {
      score += 1;
    }

    // Cultural + age appropriate (0-3)
    const culturalMet = childAssessments.filter((a) => a.culturalNeedsMet).length;
    const culturalRate = rate(culturalMet, childAssessments.length);
    const ageApp = childAssessments.filter((a) => a.ageAppropriate).length;
    const ageRate = rate(ageApp, childAssessments.length);
    const combinedRate = meanOf([culturalRate, ageRate]);
    if (meets(combinedRate, 80)) score += 3;
    else if (meets(combinedRate, 60)) score += 2;
    else if (above(combinedRate, 0)) score += 1;

    return {
      childId,
      childName,
      totalAssessments: childAssessments.length,
      qualityRate,
      childChoiceRate,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateClothingAppearanceProvisionIntelligence(
  assessments: ClothingAssessment[],
  policies: ClothingPolicy[],
  training: StaffClothingTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ClothingAppearanceProvisionIntelligence {
  const quality = evaluateQuality(assessments);
  const compliance = evaluateCompliance(assessments);
  const policy = evaluatePolicy(policies);
  const staffReadiness = evaluateStaffReadiness(training);

  const rawScore =
    quality.overallScore +
    compliance.overallScore +
    policy.overallScore +
    staffReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildProfiles(assessments);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (meets(quality.qualityRate, 80)) {
    strengths.push(
      "Clothing provision consistently rated excellent or good across assessments",
    );
  }
  if (meets(quality.childChoiceRate, 80)) {
    strengths.push(
      "Children actively involved in choosing their own clothing — strong child voice",
    );
  }
  if (meets(quality.culturalRate, 90)) {
    strengths.push(
      "Cultural and religious clothing needs consistently recognised and met",
    );
  }
  if (meets(compliance.documentedRate, 90) && assessments.length > 0) {
    strengths.push(
      "Clothing provision thoroughly documented in care plans",
    );
  }
  if (meets(compliance.staffAssessedRate, 90) && assessments.length > 0) {
    strengths.push(
      "Staff consistently completing clothing assessments",
    );
  }
  if (meets(policy.clothingProvisionStrategyRate, 90) && policies.length > 0) {
    strengths.push(
      "Comprehensive clothing provision strategy in place",
    );
  }
  if (
    meets(staffReadiness.clothingAssessmentRate, 90) &&
    meets(staffReadiness.childChoiceFacilitationRate, 90)
  ) {
    strengths.push(
      "Staff team well-trained in clothing assessment and supporting child choice",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (below(quality.childChoiceRate, 70) && assessments.length > 0) {
    areasForImprovement.push(
      "Children's choice in clothing selection needs strengthening — ensure every child is offered meaningful choices",
    );
  }
  if (below(quality.culturalRate, 70) && assessments.length > 0) {
    areasForImprovement.push(
      "Cultural and religious clothing needs require greater attention",
    );
  }
  if (below(compliance.documentedRate, 70) && assessments.length > 0) {
    areasForImprovement.push(
      "Clothing provision documentation in care plans needs improvement",
    );
  }
  if (below(compliance.feedbackRate, 70) && assessments.length > 0) {
    areasForImprovement.push(
      "Feedback to children about clothing provision is inconsistent — strengthen feedback loops",
    );
  }
  if (below(policy.seasonalReviewProcedureRate, 70) && policies.length > 0) {
    areasForImprovement.push(
      "Seasonal clothing reviews not consistently scheduled — implement quarterly wardrobe assessments",
    );
  }
  if (below(staffReadiness.culturalAwarenessRate, 70) && training.length > 0) {
    areasForImprovement.push(
      "Staff cultural awareness training for clothing needs requires improvement",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (assessments.length === 0) {
    actions.push(
      "URGENT: No clothing assessments recorded — implement systematic clothing assessment process",
    );
  }
  if (policies.length === 0) {
    actions.push(
      "URGENT: No clothing policies in place — develop comprehensive clothing and appearance policy",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff clothing training records — deliver training on clothing standards and child choice",
    );
  }
  if (below(quality.qualityRate, 50) && assessments.length > 0) {
    actions.push(
      "URGENT: Less than half of clothing assessments rated good or above — conduct immediate wardrobe review for all children",
    );
  }
  if (below(compliance.staffAssessedRate, 50) && assessments.length > 0) {
    actions.push(
      "Review staff assessment completion — less than half of provisions have staff assessment recorded",
    );
  }
  if (below(policy.laundryAndMaintenancePlanRate, 50) && policies.length > 0) {
    actions.push(
      "Review laundry and maintenance arrangements — ensure children have access to clean clothing daily",
    );
  }
  if (below(compliance.categoryDiversityRatio, 50) && assessments.length > 0) {
    actions.push(
      "Broaden clothing category coverage — assessments only cover a narrow range of clothing types",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 6 — Health and well-being (clothing provision)",
    "CHR 2015 Regulation 10 — Dignity of children (appearance)",
    "SCCIF — Health and well-being of children (clothing)",
    "NMS 6 — Health and well-being (clothing and appearance)",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 27 — Adequate standard of living (clothing)",
    "Care Planning Regulations 2010 — Clothing provision",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    quality,
    compliance,
    policy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
