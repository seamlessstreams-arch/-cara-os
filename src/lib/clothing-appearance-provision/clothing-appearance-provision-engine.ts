// Clothing Appearance Provision Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// -- Type unions ---------------------------------------------------------------

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
  qualityRate: number;
  childChoiceRate: number;
  ageAppropriateRate: number;
  culturalRate: number;
}

export interface ComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffAssessedRate: number;
  feedbackRate: number;
  categoryDiversityRatio: number;
}

export interface PolicyResult {
  overallScore: number;
  clothingProvisionStrategyRate: number;
  clothingBudgetFrameworkRate: number;
  seasonalReviewProcedureRate: number;
  childChoiceGuidanceRate: number;
  culturalAndReligiousAccommodationRate: number;
  laundryAndMaintenancePlanRate: number;
  regularReviewRate: number;
}

export interface StaffReadinessResult {
  overallScore: number;
  clothingAssessmentRate: number;
  childChoiceFacilitationRate: number;
  budgetManagementRate: number;
  culturalAwarenessRate: number;
  ageAppropriateGuidanceRate: number;
  recordKeepingRate: number;
}

export interface ChildProfile {
  childId: string;
  childName: string;
  totalAssessments: number;
  qualityRate: number;
  childChoiceRate: number;
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
      qualityRate: 0,
      childChoiceRate: 0,
      ageAppropriateRate: 0,
      culturalRate: 0,
    };
  }

  let score = 0;

  const highQuality = assessments.filter(
    (a) => a.provisionQuality === "excellent" || a.provisionQuality === "good",
  ).length;
  const qualityRate = pct(highQuality, assessments.length);
  if (qualityRate >= 90) score += 7;
  else if (qualityRate >= 70) score += 5;
  else if (qualityRate >= 50) score += 3;
  else if (qualityRate > 0) score += 1;

  const childChoice = assessments.filter((a) => a.childChoiceRespected).length;
  const childChoiceRate = pct(childChoice, assessments.length);
  if (childChoiceRate >= 90) score += 6;
  else if (childChoiceRate >= 70) score += 4;
  else if (childChoiceRate >= 50) score += 3;
  else if (childChoiceRate > 0) score += 1;

  const ageAppropriate = assessments.filter((a) => a.ageAppropriate).length;
  const ageAppropriateRate = pct(ageAppropriate, assessments.length);
  if (ageAppropriateRate >= 90) score += 6;
  else if (ageAppropriateRate >= 70) score += 4;
  else if (ageAppropriateRate >= 50) score += 3;
  else if (ageAppropriateRate > 0) score += 1;

  const cultural = assessments.filter((a) => a.culturalNeedsMet).length;
  const culturalRate = pct(cultural, assessments.length);
  if (culturalRate >= 90) score += 6;
  else if (culturalRate >= 70) score += 4;
  else if (culturalRate >= 50) score += 3;
  else if (culturalRate > 0) score += 1;

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
      documentedRate: 0,
      staffAssessedRate: 0,
      feedbackRate: 0,
      categoryDiversityRatio: 0,
    };
  }

  let score = 0;

  const documented = assessments.filter((a) => a.documentedInPlan).length;
  const documentedRate = pct(documented, assessments.length);
  if (documentedRate >= 90) score += 8;
  else if (documentedRate >= 70) score += 6;
  else if (documentedRate >= 50) score += 4;
  else if (documentedRate > 0) score += 2;

  const staffAssessed = assessments.filter((a) => a.staffAssessed).length;
  const staffAssessedRate = pct(staffAssessed, assessments.length);
  if (staffAssessedRate >= 90) score += 7;
  else if (staffAssessedRate >= 70) score += 5;
  else if (staffAssessedRate >= 50) score += 3;
  else if (staffAssessedRate > 0) score += 1;

  const feedback = assessments.filter((a) => a.feedbackGiven).length;
  const feedbackRate = pct(feedback, assessments.length);
  if (feedbackRate >= 90) score += 5;
  else if (feedbackRate >= 70) score += 3;
  else if (feedbackRate >= 50) score += 2;
  else if (feedbackRate > 0) score += 1;

  const uniqueCategories = new Set(assessments.map((a) => a.clothingCategory)).size;
  const totalCategories = 8; // total ClothingCategory values
  const categoryDiversityRatio = pct(uniqueCategories, totalCategories);
  if (categoryDiversityRatio >= 90) score += 5;
  else if (categoryDiversityRatio >= 70) score += 3;
  else if (categoryDiversityRatio >= 50) score += 2;
  else if (categoryDiversityRatio > 0) score += 1;

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
      clothingProvisionStrategyRate: 0,
      clothingBudgetFrameworkRate: 0,
      seasonalReviewProcedureRate: 0,
      childChoiceGuidanceRate: 0,
      culturalAndReligiousAccommodationRate: 0,
      laundryAndMaintenancePlanRate: 0,
      regularReviewRate: 0,
    };
  }

  let score = 0;

  const strategy = policies.filter((p) => p.clothingProvisionStrategy).length;
  const clothingProvisionStrategyRate = pct(strategy, policies.length);
  if (clothingProvisionStrategyRate >= 90) score += 4;
  else if (clothingProvisionStrategyRate >= 70) score += 3;
  else if (clothingProvisionStrategyRate >= 50) score += 2;
  else if (clothingProvisionStrategyRate > 0) score += 1;

  const budget = policies.filter((p) => p.clothingBudgetFramework).length;
  const clothingBudgetFrameworkRate = pct(budget, policies.length);
  if (clothingBudgetFrameworkRate >= 90) score += 4;
  else if (clothingBudgetFrameworkRate >= 70) score += 3;
  else if (clothingBudgetFrameworkRate >= 50) score += 2;
  else if (clothingBudgetFrameworkRate > 0) score += 1;

  const seasonal = policies.filter((p) => p.seasonalReviewProcedure).length;
  const seasonalReviewProcedureRate = pct(seasonal, policies.length);
  if (seasonalReviewProcedureRate >= 90) score += 4;
  else if (seasonalReviewProcedureRate >= 70) score += 3;
  else if (seasonalReviewProcedureRate >= 50) score += 2;
  else if (seasonalReviewProcedureRate > 0) score += 1;

  const childChoice = policies.filter((p) => p.childChoiceGuidance).length;
  const childChoiceGuidanceRate = pct(childChoice, policies.length);
  if (childChoiceGuidanceRate >= 90) score += 4;
  else if (childChoiceGuidanceRate >= 70) score += 3;
  else if (childChoiceGuidanceRate >= 50) score += 2;
  else if (childChoiceGuidanceRate > 0) score += 1;

  const cultural = policies.filter((p) => p.culturalAndReligiousAccommodation).length;
  const culturalAndReligiousAccommodationRate = pct(cultural, policies.length);
  if (culturalAndReligiousAccommodationRate >= 90) score += 3;
  else if (culturalAndReligiousAccommodationRate >= 70) score += 2;
  else if (culturalAndReligiousAccommodationRate >= 50) score += 1;

  const laundry = policies.filter((p) => p.laundryAndMaintenancePlan).length;
  const laundryAndMaintenancePlanRate = pct(laundry, policies.length);
  if (laundryAndMaintenancePlanRate >= 90) score += 3;
  else if (laundryAndMaintenancePlanRate >= 70) score += 2;
  else if (laundryAndMaintenancePlanRate >= 50) score += 1;

  const review = policies.filter((p) => p.regularReview).length;
  const regularReviewRate = pct(review, policies.length);
  if (regularReviewRate >= 90) score += 3;
  else if (regularReviewRate >= 70) score += 2;
  else if (regularReviewRate >= 50) score += 1;

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
      clothingAssessmentRate: 0,
      childChoiceFacilitationRate: 0,
      budgetManagementRate: 0,
      culturalAwarenessRate: 0,
      ageAppropriateGuidanceRate: 0,
      recordKeepingRate: 0,
    };
  }

  let score = 0;

  const clothingAssessment = training.filter((t) => t.clothingAssessment).length;
  const clothingAssessmentRate = pct(clothingAssessment, training.length);
  if (clothingAssessmentRate >= 90) score += 6;
  else if (clothingAssessmentRate >= 70) score += 4;
  else if (clothingAssessmentRate >= 50) score += 3;
  else if (clothingAssessmentRate > 0) score += 1;

  const childChoice = training.filter((t) => t.childChoiceFacilitation).length;
  const childChoiceFacilitationRate = pct(childChoice, training.length);
  if (childChoiceFacilitationRate >= 90) score += 5;
  else if (childChoiceFacilitationRate >= 70) score += 3;
  else if (childChoiceFacilitationRate >= 50) score += 2;
  else if (childChoiceFacilitationRate > 0) score += 1;

  const budgetMgmt = training.filter((t) => t.budgetManagement).length;
  const budgetManagementRate = pct(budgetMgmt, training.length);
  if (budgetManagementRate >= 90) score += 5;
  else if (budgetManagementRate >= 70) score += 3;
  else if (budgetManagementRate >= 50) score += 2;
  else if (budgetManagementRate > 0) score += 1;

  const cultural = training.filter((t) => t.culturalAwareness).length;
  const culturalAwarenessRate = pct(cultural, training.length);
  if (culturalAwarenessRate >= 90) score += 4;
  else if (culturalAwarenessRate >= 70) score += 3;
  else if (culturalAwarenessRate >= 50) score += 2;
  else if (culturalAwarenessRate > 0) score += 1;

  const ageApp = training.filter((t) => t.ageAppropriateGuidance).length;
  const ageAppropriateGuidanceRate = pct(ageApp, training.length);
  if (ageAppropriateGuidanceRate >= 90) score += 3;
  else if (ageAppropriateGuidanceRate >= 70) score += 2;
  else if (ageAppropriateGuidanceRate >= 50) score += 1;

  const recordKeeping = training.filter((t) => t.recordKeeping).length;
  const recordKeepingRate = pct(recordKeeping, training.length);
  if (recordKeepingRate >= 90) score += 2;
  else if (recordKeepingRate >= 70) score += 1;

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
    const qualityRate = pct(highQuality, childAssessments.length);

    const childChoice = childAssessments.filter((a) => a.childChoiceRespected).length;
    const childChoiceRate = pct(childChoice, childAssessments.length);

    // Score 0-10
    let score = 0;

    // Quality (0-4)
    if (childAssessments.length === 0) {
      score += 0;
    } else if (qualityRate >= 80) {
      score += 4;
    } else if (qualityRate >= 60) {
      score += 3;
    } else if (qualityRate >= 40) {
      score += 2;
    } else {
      score += 1;
    }

    // Child choice (0-3)
    if (childAssessments.length === 0) {
      score += 0;
    } else if (childChoiceRate >= 80) {
      score += 3;
    } else if (childChoiceRate >= 60) {
      score += 2;
    } else if (childChoiceRate > 0) {
      score += 1;
    }

    // Cultural + age appropriate (0-3)
    const culturalMet = childAssessments.filter((a) => a.culturalNeedsMet).length;
    const culturalRate = pct(culturalMet, childAssessments.length);
    const ageApp = childAssessments.filter((a) => a.ageAppropriate).length;
    const ageRate = pct(ageApp, childAssessments.length);
    const combinedRate = Math.round((culturalRate + ageRate) / 2);
    if (combinedRate >= 80) score += 3;
    else if (combinedRate >= 60) score += 2;
    else if (combinedRate > 0) score += 1;

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

  if (quality.qualityRate >= 80) {
    strengths.push(
      "Clothing provision consistently rated excellent or good across assessments",
    );
  }
  if (quality.childChoiceRate >= 80) {
    strengths.push(
      "Children actively involved in choosing their own clothing — strong child voice",
    );
  }
  if (quality.culturalRate >= 90) {
    strengths.push(
      "Cultural and religious clothing needs consistently recognised and met",
    );
  }
  if (compliance.documentedRate >= 90 && assessments.length > 0) {
    strengths.push(
      "Clothing provision thoroughly documented in care plans",
    );
  }
  if (compliance.staffAssessedRate >= 90 && assessments.length > 0) {
    strengths.push(
      "Staff consistently completing clothing assessments",
    );
  }
  if (policy.clothingProvisionStrategyRate >= 90 && policies.length > 0) {
    strengths.push(
      "Comprehensive clothing provision strategy in place",
    );
  }
  if (
    staffReadiness.clothingAssessmentRate >= 90 &&
    staffReadiness.childChoiceFacilitationRate >= 90
  ) {
    strengths.push(
      "Staff team well-trained in clothing assessment and supporting child choice",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (quality.childChoiceRate < 70 && assessments.length > 0) {
    areasForImprovement.push(
      "Children's choice in clothing selection needs strengthening — ensure every child is offered meaningful choices",
    );
  }
  if (quality.culturalRate < 70 && assessments.length > 0) {
    areasForImprovement.push(
      "Cultural and religious clothing needs require greater attention",
    );
  }
  if (compliance.documentedRate < 70 && assessments.length > 0) {
    areasForImprovement.push(
      "Clothing provision documentation in care plans needs improvement",
    );
  }
  if (compliance.feedbackRate < 70 && assessments.length > 0) {
    areasForImprovement.push(
      "Feedback to children about clothing provision is inconsistent — strengthen feedback loops",
    );
  }
  if (policy.seasonalReviewProcedureRate < 70 && policies.length > 0) {
    areasForImprovement.push(
      "Seasonal clothing reviews not consistently scheduled — implement quarterly wardrobe assessments",
    );
  }
  if (staffReadiness.culturalAwarenessRate < 70 && training.length > 0) {
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
  if (quality.qualityRate < 50 && assessments.length > 0) {
    actions.push(
      "URGENT: Less than half of clothing assessments rated good or above — conduct immediate wardrobe review for all children",
    );
  }
  if (compliance.staffAssessedRate < 50 && assessments.length > 0) {
    actions.push(
      "Review staff assessment completion — less than half of provisions have staff assessment recorded",
    );
  }
  if (policy.laundryAndMaintenancePlanRate < 50 && policies.length > 0) {
    actions.push(
      "Review laundry and maintenance arrangements — ensure children have access to clean clothing daily",
    );
  }
  if (compliance.categoryDiversityRatio < 50 && assessments.length > 0) {
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
