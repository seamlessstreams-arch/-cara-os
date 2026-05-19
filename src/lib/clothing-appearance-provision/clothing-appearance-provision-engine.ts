// ==============================================================================
// Clothing & Appearance Provision Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates quality of clothing and appearance provision for children in care:
//   1. Clothing Provision Quality (category coverage, child choice, fit, culture)
//   2. Budget Management (adequacy, child involvement, transparency)
//   3. Clothing Policy Compliance (individual lists, reviews, protocols)
//   4. Staff Clothing Readiness (training on standards, choice, culture, budget)
//
// Regulatory: CHR 2015 Reg 10, CHR 2015 Reg 12, SCCIF, NMS 10,
//             Children Act 1989, UNCRC Article 27, Care Planning Regulations 2010
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type ClothingCategory =
  | "everyday"
  | "school_uniform"
  | "outdoor"
  | "sleepwear"
  | "underwear"
  | "footwear"
  | "special_occasion"
  | "sports";

export type ProvisionStatus =
  | "fully_met"
  | "mostly_met"
  | "partially_met"
  | "not_met";

export type SeasonalReadiness =
  | "fully_ready"
  | "mostly_ready"
  | "not_ready";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const clothingCategoryLabels: Record<ClothingCategory, string> = {
  everyday: "Everyday",
  school_uniform: "School Uniform",
  outdoor: "Outdoor",
  sleepwear: "Sleepwear",
  underwear: "Underwear",
  footwear: "Footwear",
  special_occasion: "Special Occasion",
  sports: "Sports",
};

const provisionStatusLabels: Record<ProvisionStatus, string> = {
  fully_met: "Fully Met",
  mostly_met: "Mostly Met",
  partially_met: "Partially Met",
  not_met: "Not Met",
};

const seasonalReadinessLabels: Record<SeasonalReadiness, string> = {
  fully_ready: "Fully Ready",
  mostly_ready: "Mostly Ready",
  not_ready: "Not Ready",
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
export function getProvisionStatusLabel(s: ProvisionStatus): string {
  return provisionStatusLabels[s] ?? s;
}
export function getSeasonalReadinessLabel(r: SeasonalReadiness): string {
  return seasonalReadinessLabels[r] ?? r;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface ClothingProvisionRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string;
  clothingCategory: ClothingCategory;
  provisionStatus: ProvisionStatus;
  childChoice: boolean;
  ageAppropriate: boolean;
  fitCorrect: boolean;
  culturallyAppropriate: boolean;
}

export interface ClothingBudgetRecord {
  id: string;
  childId: string;
  childName: string;
  periodStart: string;
  periodEnd: string;
  budgetAllocated: number;
  budgetSpent: number;
  childInvolved: boolean;
  receiptsRecorded: boolean;
}

export interface ClothingPolicy {
  id: string;
  individualClothingList: boolean;
  seasonalReviewScheduled: boolean;
  childChoiceRespected: boolean;
  culturalNeedsMet: boolean;
  labellingProtocol: boolean;
  laundryArrangements: boolean;
  budgetTransparency: boolean;
}

export interface StaffClothingTraining {
  id: string;
  staffId: string;
  staffName: string;
  clothingStandards: boolean;
  childChoice: boolean;
  culturalAwareness: boolean;
  budgetManagement: boolean;
  ageAppropriateness: boolean;
  dignityAndPrivacy: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface ClothingProvisionResult {
  overallScore: number;
  totalRecords: number;
  fullyMetRate: number;
  childChoiceRate: number;
  ageAppropriateRate: number;
  fitCorrectRate: number;
  culturallyAppropriateRate: number;
}

export interface BudgetManagementResult {
  overallScore: number;
  totalRecords: number;
  budgetAdequacyRate: number;
  childInvolvedRate: number;
  receiptsRecordedRate: number;
  averageSpendRatio: number;
}

export interface ClothingPolicyResult {
  overallScore: number;
  totalPolicies: number;
  individualClothingListRate: number;
  seasonalReviewRate: number;
  childChoiceRate: number;
  culturalNeedsRate: number;
  labellingProtocolRate: number;
  laundryArrangementsRate: number;
  budgetTransparencyRate: number;
}

export interface StaffClothingReadinessResult {
  overallScore: number;
  totalStaff: number;
  clothingStandardsRate: number;
  childChoiceRate: number;
  culturalAwarenessRate: number;
  budgetManagementRate: number;
  ageAppropriatenessRate: number;
  dignityAndPrivacyRate: number;
}

export interface ChildClothingProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  fullyMetRate: number;
  childChoiceRate: number;
  fitCorrectRate: number;
  budgetAdequacy: boolean;
  overallScore: number;
}

export interface ClothingAppearanceProvisionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  clothingProvision: ClothingProvisionResult;
  budgetManagement: BudgetManagementResult;
  clothingPolicy: ClothingPolicyResult;
  staffClothingReadiness: StaffClothingReadinessResult;
  childProfiles: ChildClothingProfile[];
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
 * Evaluates clothing provision quality across all records.
 * Empty = 0 (no records = no evidence of provision).
 *
 *   Fully met rate                       -> 0-7
 *   Child choice rate                    -> 0-6
 *   Age appropriate rate                 -> 0-6
 *   Fit correct + culturally appropriate -> 0-6
 */
export function evaluateClothingProvision(
  records: ClothingProvisionRecord[],
): ClothingProvisionResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      fullyMetRate: 0,
      childChoiceRate: 0,
      ageAppropriateRate: 0,
      fitCorrectRate: 0,
      culturallyAppropriateRate: 0,
    };
  }

  let score = 0;

  const fullyMet = records.filter(
    (r) => r.provisionStatus === "fully_met",
  ).length;
  const fullyMetRate = pct(fullyMet, records.length);
  if (fullyMetRate >= 90) score += 7;
  else if (fullyMetRate >= 70) score += 5;
  else if (fullyMetRate >= 50) score += 3;
  else if (fullyMetRate > 0) score += 1;

  const childChoice = records.filter((r) => r.childChoice).length;
  const childChoiceRate = pct(childChoice, records.length);
  if (childChoiceRate >= 90) score += 6;
  else if (childChoiceRate >= 70) score += 4;
  else if (childChoiceRate >= 50) score += 3;
  else if (childChoiceRate > 0) score += 1;

  const ageAppropriate = records.filter((r) => r.ageAppropriate).length;
  const ageAppropriateRate = pct(ageAppropriate, records.length);
  if (ageAppropriateRate >= 90) score += 6;
  else if (ageAppropriateRate >= 70) score += 4;
  else if (ageAppropriateRate >= 50) score += 3;
  else if (ageAppropriateRate > 0) score += 1;

  const fitCorrect = records.filter((r) => r.fitCorrect).length;
  const fitCorrectRate = pct(fitCorrect, records.length);
  const culturallyAppropriate = records.filter(
    (r) => r.culturallyAppropriate,
  ).length;
  const culturallyAppropriateRate = pct(culturallyAppropriate, records.length);
  const combinedRate = Math.round((fitCorrectRate + culturallyAppropriateRate) / 2);
  if (combinedRate >= 90) score += 6;
  else if (combinedRate >= 70) score += 4;
  else if (combinedRate >= 50) score += 3;
  else if (combinedRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    fullyMetRate,
    childChoiceRate,
    ageAppropriateRate,
    fitCorrectRate,
    culturallyAppropriateRate,
  };
}

/**
 * Evaluates budget management for clothing.
 * Empty = 0 (no budget records = no evidence of management).
 *
 *   Budget adequacy (spent <= allocated) rate -> 0-7
 *   Child involved rate                       -> 0-6
 *   Receipts recorded rate                    -> 0-6
 *   Average spend ratio (utilisation)         -> 0-6
 */
export function evaluateBudgetManagement(
  records: ClothingBudgetRecord[],
): BudgetManagementResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      budgetAdequacyRate: 0,
      childInvolvedRate: 0,
      receiptsRecordedRate: 0,
      averageSpendRatio: 0,
    };
  }

  let score = 0;

  const adequate = records.filter(
    (r) => r.budgetSpent <= r.budgetAllocated,
  ).length;
  const budgetAdequacyRate = pct(adequate, records.length);
  if (budgetAdequacyRate >= 90) score += 7;
  else if (budgetAdequacyRate >= 70) score += 5;
  else if (budgetAdequacyRate >= 50) score += 3;
  else if (budgetAdequacyRate > 0) score += 1;

  const childInvolved = records.filter((r) => r.childInvolved).length;
  const childInvolvedRate = pct(childInvolved, records.length);
  if (childInvolvedRate >= 90) score += 6;
  else if (childInvolvedRate >= 70) score += 4;
  else if (childInvolvedRate >= 50) score += 3;
  else if (childInvolvedRate > 0) score += 1;

  const receipts = records.filter((r) => r.receiptsRecorded).length;
  const receiptsRecordedRate = pct(receipts, records.length);
  if (receiptsRecordedRate >= 90) score += 6;
  else if (receiptsRecordedRate >= 70) score += 4;
  else if (receiptsRecordedRate >= 50) score += 3;
  else if (receiptsRecordedRate > 0) score += 1;

  // Average spend ratio — higher utilisation (without overspending) is better
  const totalAllocated = records.reduce((sum, r) => sum + r.budgetAllocated, 0);
  const totalSpent = records.reduce((sum, r) => sum + r.budgetSpent, 0);
  const averageSpendRatio =
    totalAllocated > 0
      ? Math.round((totalSpent / totalAllocated) * 100)
      : 0;
  // Good utilisation: 70-100% of budget used (not overspent)
  if (averageSpendRatio >= 70 && averageSpendRatio <= 100) score += 6;
  else if (averageSpendRatio >= 50 && averageSpendRatio <= 110) score += 4;
  else if (averageSpendRatio >= 30 && averageSpendRatio <= 120) score += 2;
  else if (averageSpendRatio > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    budgetAdequacyRate,
    childInvolvedRate,
    receiptsRecordedRate,
    averageSpendRatio,
  };
}

/**
 * Evaluates clothing policy compliance.
 * Empty = 0 (no policies = no evidence of governance).
 *
 *   individualClothingList   -> 0-4
 *   seasonalReviewScheduled  -> 0-4
 *   childChoiceRespected     -> 0-4
 *   culturalNeedsMet         -> 0-4
 *   labellingProtocol        -> 0-3
 *   laundryArrangements      -> 0-3
 *   budgetTransparency       -> 0-3
 */
export function evaluateClothingPolicy(
  policies: ClothingPolicy[],
): ClothingPolicyResult {
  if (policies.length === 0) {
    return {
      overallScore: 0,
      totalPolicies: 0,
      individualClothingListRate: 0,
      seasonalReviewRate: 0,
      childChoiceRate: 0,
      culturalNeedsRate: 0,
      labellingProtocolRate: 0,
      laundryArrangementsRate: 0,
      budgetTransparencyRate: 0,
    };
  }

  let score = 0;

  const individualList = policies.filter(
    (p) => p.individualClothingList,
  ).length;
  const individualClothingListRate = pct(individualList, policies.length);
  if (individualClothingListRate >= 90) score += 4;
  else if (individualClothingListRate >= 70) score += 3;
  else if (individualClothingListRate >= 50) score += 2;
  else if (individualClothingListRate > 0) score += 1;

  const seasonal = policies.filter(
    (p) => p.seasonalReviewScheduled,
  ).length;
  const seasonalReviewRate = pct(seasonal, policies.length);
  if (seasonalReviewRate >= 90) score += 4;
  else if (seasonalReviewRate >= 70) score += 3;
  else if (seasonalReviewRate >= 50) score += 2;
  else if (seasonalReviewRate > 0) score += 1;

  const childChoice = policies.filter(
    (p) => p.childChoiceRespected,
  ).length;
  const childChoiceRate = pct(childChoice, policies.length);
  if (childChoiceRate >= 90) score += 4;
  else if (childChoiceRate >= 70) score += 3;
  else if (childChoiceRate >= 50) score += 2;
  else if (childChoiceRate > 0) score += 1;

  const cultural = policies.filter(
    (p) => p.culturalNeedsMet,
  ).length;
  const culturalNeedsRate = pct(cultural, policies.length);
  if (culturalNeedsRate >= 90) score += 4;
  else if (culturalNeedsRate >= 70) score += 3;
  else if (culturalNeedsRate >= 50) score += 2;
  else if (culturalNeedsRate > 0) score += 1;

  const labelling = policies.filter(
    (p) => p.labellingProtocol,
  ).length;
  const labellingProtocolRate = pct(labelling, policies.length);
  if (labellingProtocolRate >= 90) score += 3;
  else if (labellingProtocolRate >= 70) score += 2;
  else if (labellingProtocolRate >= 50) score += 1;

  const laundry = policies.filter(
    (p) => p.laundryArrangements,
  ).length;
  const laundryArrangementsRate = pct(laundry, policies.length);
  if (laundryArrangementsRate >= 90) score += 3;
  else if (laundryArrangementsRate >= 70) score += 2;
  else if (laundryArrangementsRate >= 50) score += 1;

  const budget = policies.filter(
    (p) => p.budgetTransparency,
  ).length;
  const budgetTransparencyRate = pct(budget, policies.length);
  if (budgetTransparencyRate >= 90) score += 3;
  else if (budgetTransparencyRate >= 70) score += 2;
  else if (budgetTransparencyRate >= 50) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalPolicies: policies.length,
    individualClothingListRate,
    seasonalReviewRate,
    childChoiceRate,
    culturalNeedsRate,
    labellingProtocolRate,
    laundryArrangementsRate,
    budgetTransparencyRate,
  };
}

/**
 * Evaluates staff readiness for clothing provision.
 * Empty = 0 (no training = no evidence of competence).
 *
 *   clothingStandards   -> 0-6
 *   childChoice         -> 0-5
 *   culturalAwareness   -> 0-5
 *   budgetManagement    -> 0-4
 *   ageAppropriateness  -> 0-3
 *   dignityAndPrivacy   -> 0-2
 */
export function evaluateStaffClothingReadiness(
  training: StaffClothingTraining[],
): StaffClothingReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      clothingStandardsRate: 0,
      childChoiceRate: 0,
      culturalAwarenessRate: 0,
      budgetManagementRate: 0,
      ageAppropriatenessRate: 0,
      dignityAndPrivacyRate: 0,
    };
  }

  let score = 0;

  const clothingStandards = training.filter(
    (t) => t.clothingStandards,
  ).length;
  const clothingStandardsRate = pct(clothingStandards, training.length);
  if (clothingStandardsRate >= 90) score += 6;
  else if (clothingStandardsRate >= 70) score += 4;
  else if (clothingStandardsRate >= 50) score += 3;
  else if (clothingStandardsRate > 0) score += 1;

  const childChoice = training.filter((t) => t.childChoice).length;
  const childChoiceRate = pct(childChoice, training.length);
  if (childChoiceRate >= 90) score += 5;
  else if (childChoiceRate >= 70) score += 3;
  else if (childChoiceRate >= 50) score += 2;
  else if (childChoiceRate > 0) score += 1;

  const cultural = training.filter(
    (t) => t.culturalAwareness,
  ).length;
  const culturalAwarenessRate = pct(cultural, training.length);
  if (culturalAwarenessRate >= 90) score += 5;
  else if (culturalAwarenessRate >= 70) score += 3;
  else if (culturalAwarenessRate >= 50) score += 2;
  else if (culturalAwarenessRate > 0) score += 1;

  const budgetMgmt = training.filter(
    (t) => t.budgetManagement,
  ).length;
  const budgetManagementRate = pct(budgetMgmt, training.length);
  if (budgetManagementRate >= 90) score += 4;
  else if (budgetManagementRate >= 70) score += 3;
  else if (budgetManagementRate >= 50) score += 2;
  else if (budgetManagementRate > 0) score += 1;

  const ageApp = training.filter(
    (t) => t.ageAppropriateness,
  ).length;
  const ageAppropriatenessRate = pct(ageApp, training.length);
  if (ageAppropriatenessRate >= 90) score += 3;
  else if (ageAppropriatenessRate >= 70) score += 2;
  else if (ageAppropriatenessRate >= 50) score += 1;

  const dignity = training.filter(
    (t) => t.dignityAndPrivacy,
  ).length;
  const dignityAndPrivacyRate = pct(dignity, training.length);
  if (dignityAndPrivacyRate >= 90) score += 2;
  else if (dignityAndPrivacyRate >= 70) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    clothingStandardsRate,
    childChoiceRate,
    culturalAwarenessRate,
    budgetManagementRate,
    ageAppropriatenessRate,
    dignityAndPrivacyRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildClothingProfiles(
  provisions: ClothingProvisionRecord[],
  budgets: ClothingBudgetRecord[],
): ChildClothingProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const p of provisions) {
    childIds.add(p.childId);
    childNames.set(p.childId, p.childName);
  }
  for (const b of budgets) {
    childIds.add(b.childId);
    childNames.set(b.childId, b.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childProvisions = provisions.filter((p) => p.childId === childId);
    const childBudgets = budgets.filter((b) => b.childId === childId);
    const childName = childNames.get(childId) ?? childId;

    const fullyMet = childProvisions.filter(
      (p) => p.provisionStatus === "fully_met",
    ).length;
    const fullyMetRate = pct(fullyMet, childProvisions.length);

    const childChoice = childProvisions.filter((p) => p.childChoice).length;
    const childChoiceRate = pct(childChoice, childProvisions.length);

    const fitCorrect = childProvisions.filter((p) => p.fitCorrect).length;
    const fitCorrectRate = pct(fitCorrect, childProvisions.length);

    // Budget adequacy — all budget periods within allocation
    const budgetAdequacy =
      childBudgets.length > 0 &&
      childBudgets.every((b) => b.budgetSpent <= b.budgetAllocated);

    // Score 0-10
    let score = 0;

    // Provision quality (0-4)
    if (childProvisions.length === 0) {
      score += 0;
    } else if (fullyMetRate >= 80) {
      score += 4;
    } else if (fullyMetRate >= 60) {
      score += 3;
    } else if (fullyMetRate >= 40) {
      score += 2;
    } else {
      score += 1;
    }

    // Child choice (0-3)
    if (childProvisions.length === 0) {
      score += 0;
    } else if (childChoiceRate >= 80) {
      score += 3;
    } else if (childChoiceRate >= 60) {
      score += 2;
    } else if (childChoiceRate > 0) {
      score += 1;
    }

    // Fit + budget (0-3)
    if (childProvisions.length > 0 && fitCorrectRate >= 80) score += 2;
    else if (childProvisions.length > 0 && fitCorrectRate >= 50) score += 1;
    if (budgetAdequacy) score += 1;

    return {
      childId,
      childName,
      totalRecords: childProvisions.length,
      fullyMetRate,
      childChoiceRate,
      fitCorrectRate,
      budgetAdequacy,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateClothingAppearanceProvisionIntelligence(
  provisions: ClothingProvisionRecord[],
  budgets: ClothingBudgetRecord[],
  policies: ClothingPolicy[],
  training: StaffClothingTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ClothingAppearanceProvisionIntelligence {
  const clothingProvision = evaluateClothingProvision(provisions);
  const budgetManagement = evaluateBudgetManagement(budgets);
  const clothingPolicy = evaluateClothingPolicy(policies);
  const staffClothingReadiness = evaluateStaffClothingReadiness(training);

  const rawScore =
    clothingProvision.overallScore +
    budgetManagement.overallScore +
    clothingPolicy.overallScore +
    staffClothingReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildClothingProfiles(provisions, budgets);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (clothingProvision.fullyMetRate >= 80) {
    strengths.push(
      "Clothing needs consistently fully met across all categories",
    );
  }
  if (clothingProvision.childChoiceRate >= 80) {
    strengths.push(
      "Children actively involved in choosing their own clothing — strong child voice",
    );
  }
  if (budgetManagement.budgetAdequacyRate >= 90 && budgets.length > 0) {
    strengths.push(
      "Excellent budget management — clothing spend within allocation across all periods",
    );
  }
  if (budgetManagement.childInvolvedRate >= 80 && budgets.length > 0) {
    strengths.push(
      "Children meaningfully involved in clothing budget decisions",
    );
  }
  if (clothingPolicy.individualClothingListRate >= 90 && policies.length > 0) {
    strengths.push(
      "Individual clothing lists maintained for all children — personalised approach",
    );
  }
  if (
    staffClothingReadiness.clothingStandardsRate >= 90 &&
    staffClothingReadiness.childChoiceRate >= 90
  ) {
    strengths.push(
      "Staff team well-trained in clothing standards and supporting child choice",
    );
  }
  if (clothingProvision.culturallyAppropriateRate >= 90) {
    strengths.push(
      "Cultural clothing needs consistently recognised and met",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (clothingProvision.childChoiceRate < 70 && provisions.length > 0) {
    areasForImprovement.push(
      "Children's choice in clothing selection needs strengthening — ensure every child is offered meaningful choices",
    );
  }
  if (clothingProvision.fitCorrectRate < 70 && provisions.length > 0) {
    areasForImprovement.push(
      "Clothing fit issues identified — review sizing and replacement processes",
    );
  }
  if (budgetManagement.receiptsRecordedRate < 70 && budgets.length > 0) {
    areasForImprovement.push(
      "Receipt recording inconsistent — strengthen financial record-keeping for clothing purchases",
    );
  }
  if (clothingPolicy.seasonalReviewRate < 70 && policies.length > 0) {
    areasForImprovement.push(
      "Seasonal clothing reviews not consistently scheduled — implement quarterly wardrobe assessments",
    );
  }
  if (staffClothingReadiness.culturalAwarenessRate < 70 && training.length > 0) {
    areasForImprovement.push(
      "Staff cultural awareness training for clothing needs requires improvement",
    );
  }
  if (clothingProvision.culturallyAppropriateRate < 70 && provisions.length > 0) {
    areasForImprovement.push(
      "Cultural appropriateness of clothing provision needs attention — ensure diverse needs are met",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (provisions.length === 0) {
    actions.push(
      "URGENT: No clothing provision records — implement systematic recording of clothing needs and provision",
    );
  }
  if (budgets.length === 0) {
    actions.push(
      "URGENT: No clothing budget records — establish transparent clothing budget tracking for each child",
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
  if (clothingProvision.fullyMetRate < 50 && provisions.length > 0) {
    actions.push(
      "URGENT: Less than half of clothing needs fully met — conduct immediate wardrobe review for all children",
    );
  }
  if (budgetManagement.budgetAdequacyRate < 50 && budgets.length > 0) {
    actions.push(
      "Review clothing budget allocations — over half of periods show overspend",
    );
  }
  if (clothingPolicy.laundryArrangementsRate < 50 && policies.length > 0) {
    actions.push(
      "Review laundry arrangements — ensure children have access to clean clothing daily",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and well-being standard (adequate clothing provision)",
    "CHR 2015 Reg 12 — The protection of children standard (dignity in appearance)",
    "SCCIF — Social Care Common Inspection Framework (quality of care, personalisation)",
    "NMS 10 — National Minimum Standards (clothing and personal possessions)",
    "Children Act 1989 — Duty of care including adequate clothing provision",
    "UNCRC Article 27 — Right to a standard of living adequate for physical and social development",
    "Care Planning Regulations 2010 — Individual care planning including clothing needs",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    clothingProvision,
    budgetManagement,
    clothingPolicy,
    staffClothingReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
