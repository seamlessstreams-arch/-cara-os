// ==============================================================================
// Food Nutrition Quality Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well a children's residential home provides nutritious meals,
// respects dietary needs, and promotes healthy eating:
//   1. Meal Quality (nutrition rating, dietary needs, child choice, fresh ingredients)
//   2. Nutrition Compliance (portions, documentation, satisfaction, diversity)
//   3. Nutrition Policy (7 boolean policy dimensions)
//   4. Staff Nutrition Readiness (6 training competencies)
//
// Regulatory: CHR 2015 Regulation 6, CHR 2015 Regulation 9, SCCIF,
//             NMS 10, Food Standards Agency, Children Act 1989,
//             Healthy eating guidance for residential care
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "special_dietary"
  | "cultural_meal"
  | "celebration"
  | "packed_lunch";

export type NutritionRating =
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

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  special_dietary: "Special Dietary",
  cultural_meal: "Cultural Meal",
  celebration: "Celebration",
  packed_lunch: "Packed Lunch",
};

const nutritionRatingLabels: Record<NutritionRating, string> = {
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

export function getMealTypeLabel(t: MealType): string {
  return mealTypeLabels[t] ?? t;
}
export function getNutritionRatingLabel(r: NutritionRating): string {
  return nutritionRatingLabels[r] ?? r;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface MealRecord {
  id: string;
  childId: string;
  childName: string;
  mealDate: string;
  mealType: MealType;
  nutritionRating: NutritionRating;
  dietaryNeedsMet: boolean;
  childChoiceOffered: boolean;
  portionAppropriate: boolean;
  freshIngredientsUsed: boolean;
  documentedInRecord: boolean;
  childSatisfied: boolean;
}

export interface NutritionPolicy {
  id: string;
  mealPlanningFramework: boolean;
  dietaryAssessmentProcess: boolean;
  allergyManagement: boolean;
  culturalDietaryRespect: boolean;
  foodHygieneStandards: boolean;
  childParticipation: boolean;
  regularReview: boolean;
}

export interface StaffNutritionTraining {
  id: string;
  staffId: string;
  staffName: string;
  foodHygiene: boolean;
  nutritionalPlanning: boolean;
  allergyAwareness: boolean;
  culturalDietaryNeeds: boolean;
  portionControl: boolean;
  mealPreparation: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface MealQualityResult {
  overallScore: number;
  totalRecords: number;
  nutritionRate: number;
  dietaryNeedsMetRate: number;
  childChoiceRate: number;
  freshIngredientsRate: number;
}

export interface NutritionComplianceResult {
  overallScore: number;
  totalRecords: number;
  portionAppropriateRate: number;
  documentedRate: number;
  childSatisfiedRate: number;
  mealTypeDiversity: number;
}

export interface NutritionPolicyResult {
  overallScore: number;
  mealPlanningFrameworkMet: boolean;
  dietaryAssessmentProcessMet: boolean;
  allergyManagementMet: boolean;
  culturalDietaryRespectMet: boolean;
  foodHygieneStandardsMet: boolean;
  childParticipationMet: boolean;
  regularReviewMet: boolean;
}

export interface StaffNutritionReadinessResult {
  overallScore: number;
  totalStaff: number;
  foodHygieneRate: number;
  nutritionalPlanningRate: number;
  allergyAwarenessRate: number;
  culturalDietaryNeedsRate: number;
  portionControlRate: number;
  mealPreparationRate: number;
}

export interface ChildNutritionProfile {
  childId: string;
  childName: string;
  totalMeals: number;
  nutritionRate: number;
  dietaryNeedsMetRate: number;
  uniqueMealTypes: number;
  overallScore: number;
}

export interface FoodNutritionQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  mealQuality: MealQualityResult;
  nutritionCompliance: NutritionComplianceResult;
  nutritionPolicy: NutritionPolicyResult;
  staffNutritionReadiness: StaffNutritionReadinessResult;
  childProfiles: ChildNutritionProfile[];
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
 * Evaluates meal quality across all records.
 * PRESENCE pattern: empty records = 0 (no evidence).
 *
 *   nutritionRate (excellent+good)  -> 0-7
 *   dietaryNeedsMetRate             -> 0-6
 *   childChoiceRate                 -> 0-6
 *   freshIngredientsRate            -> 0-6
 */
export function evaluateMealQuality(
  records: MealRecord[],
): MealQualityResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      nutritionRate: 0,
      dietaryNeedsMetRate: 0,
      childChoiceRate: 0,
      freshIngredientsRate: 0,
    };
  }

  let score = 0;

  const excellentGood = records.filter(
    (r) => r.nutritionRating === "excellent" || r.nutritionRating === "good",
  ).length;
  const nutritionRate = pct(excellentGood, records.length);
  if (nutritionRate >= 90) score += 7;
  else if (nutritionRate >= 70) score += 5;
  else if (nutritionRate >= 50) score += 3;
  else if (nutritionRate > 0) score += 1;

  const dietaryMet = records.filter((r) => r.dietaryNeedsMet).length;
  const dietaryNeedsMetRate = pct(dietaryMet, records.length);
  if (dietaryNeedsMetRate >= 90) score += 6;
  else if (dietaryNeedsMetRate >= 70) score += 4;
  else if (dietaryNeedsMetRate >= 50) score += 3;
  else if (dietaryNeedsMetRate > 0) score += 1;

  const childChoice = records.filter((r) => r.childChoiceOffered).length;
  const childChoiceRate = pct(childChoice, records.length);
  if (childChoiceRate >= 90) score += 6;
  else if (childChoiceRate >= 70) score += 4;
  else if (childChoiceRate >= 50) score += 3;
  else if (childChoiceRate > 0) score += 1;

  const freshIngredients = records.filter((r) => r.freshIngredientsUsed).length;
  const freshIngredientsRate = pct(freshIngredients, records.length);
  if (freshIngredientsRate >= 90) score += 6;
  else if (freshIngredientsRate >= 70) score += 4;
  else if (freshIngredientsRate >= 50) score += 3;
  else if (freshIngredientsRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    nutritionRate,
    dietaryNeedsMetRate,
    childChoiceRate,
    freshIngredientsRate,
  };
}

/**
 * Evaluates nutrition compliance across all records.
 * PRESENCE pattern: empty records = 0 (no evidence).
 *
 *   portionAppropriateRate  -> 0-8
 *   documentedRate          -> 0-7
 *   childSatisfiedRate      -> 0-5
 *   mealTypeDiversity       -> 0-5
 */
export function evaluateNutritionCompliance(
  records: MealRecord[],
): NutritionComplianceResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      portionAppropriateRate: 0,
      documentedRate: 0,
      childSatisfiedRate: 0,
      mealTypeDiversity: 0,
    };
  }

  let score = 0;

  const portionOk = records.filter((r) => r.portionAppropriate).length;
  const portionAppropriateRate = pct(portionOk, records.length);
  if (portionAppropriateRate >= 90) score += 8;
  else if (portionAppropriateRate >= 70) score += 6;
  else if (portionAppropriateRate >= 50) score += 4;
  else if (portionAppropriateRate > 0) score += 2;

  const documented = records.filter((r) => r.documentedInRecord).length;
  const documentedRate = pct(documented, records.length);
  if (documentedRate >= 90) score += 7;
  else if (documentedRate >= 70) score += 5;
  else if (documentedRate >= 50) score += 3;
  else if (documentedRate > 0) score += 1;

  const satisfied = records.filter((r) => r.childSatisfied).length;
  const childSatisfiedRate = pct(satisfied, records.length);
  if (childSatisfiedRate >= 90) score += 5;
  else if (childSatisfiedRate >= 70) score += 3;
  else if (childSatisfiedRate >= 50) score += 2;
  else if (childSatisfiedRate > 0) score += 1;

  const uniqueTypes = new Set(records.map((r) => r.mealType));
  const mealTypeDiversity = Math.round((uniqueTypes.size / 8) * 100);
  if (uniqueTypes.size >= 7) score += 5;
  else if (uniqueTypes.size >= 5) score += 4;
  else if (uniqueTypes.size >= 3) score += 3;
  else if (uniqueTypes.size >= 1) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    portionAppropriateRate,
    documentedRate,
    childSatisfiedRate,
    mealTypeDiversity,
  };
}

/**
 * Evaluates nutrition policy compliance.
 * null = 0 (no policy = no evidence of governance).
 *
 *   mealPlanningFramework    -> 0-4
 *   dietaryAssessmentProcess -> 0-4
 *   allergyManagement        -> 0-4
 *   culturalDietaryRespect   -> 0-4
 *   foodHygieneStandards     -> 0-3
 *   childParticipation       -> 0-3
 *   regularReview            -> 0-3
 */
export function evaluateNutritionPolicy(
  policy: NutritionPolicy | null,
): NutritionPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      mealPlanningFrameworkMet: false,
      dietaryAssessmentProcessMet: false,
      allergyManagementMet: false,
      culturalDietaryRespectMet: false,
      foodHygieneStandardsMet: false,
      childParticipationMet: false,
      regularReviewMet: false,
    };
  }

  let score = 0;

  if (policy.mealPlanningFramework) score += 4;
  if (policy.dietaryAssessmentProcess) score += 4;
  if (policy.allergyManagement) score += 4;
  if (policy.culturalDietaryRespect) score += 4;
  if (policy.foodHygieneStandards) score += 3;
  if (policy.childParticipation) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(score, 25),
    mealPlanningFrameworkMet: policy.mealPlanningFramework,
    dietaryAssessmentProcessMet: policy.dietaryAssessmentProcess,
    allergyManagementMet: policy.allergyManagement,
    culturalDietaryRespectMet: policy.culturalDietaryRespect,
    foodHygieneStandardsMet: policy.foodHygieneStandards,
    childParticipationMet: policy.childParticipation,
    regularReviewMet: policy.regularReview,
  };
}

/**
 * Evaluates staff nutrition readiness from training records.
 * PRESENCE pattern: empty training = 0 (no evidence of competence).
 *
 * Each skill rate = pct(trained, total).
 * Partial score = Math.round(rate / 100 * weight).
 *
 *   foodHygiene           -> weight 6
 *   nutritionalPlanning   -> weight 5
 *   allergyAwareness      -> weight 5
 *   culturalDietaryNeeds  -> weight 4
 *   portionControl        -> weight 3
 *   mealPreparation       -> weight 2
 */
export function evaluateStaffNutritionReadiness(
  training: StaffNutritionTraining[],
): StaffNutritionReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      foodHygieneRate: 0,
      nutritionalPlanningRate: 0,
      allergyAwarenessRate: 0,
      culturalDietaryNeedsRate: 0,
      portionControlRate: 0,
      mealPreparationRate: 0,
    };
  }

  const total = training.length;

  const foodHygieneRate = pct(training.filter((t) => t.foodHygiene).length, total);
  const nutritionalPlanningRate = pct(training.filter((t) => t.nutritionalPlanning).length, total);
  const allergyAwarenessRate = pct(training.filter((t) => t.allergyAwareness).length, total);
  const culturalDietaryNeedsRate = pct(training.filter((t) => t.culturalDietaryNeeds).length, total);
  const portionControlRate = pct(training.filter((t) => t.portionControl).length, total);
  const mealPreparationRate = pct(training.filter((t) => t.mealPreparation).length, total);

  const score =
    Math.round((foodHygieneRate / 100) * 6) +
    Math.round((nutritionalPlanningRate / 100) * 5) +
    Math.round((allergyAwarenessRate / 100) * 5) +
    Math.round((culturalDietaryNeedsRate / 100) * 4) +
    Math.round((portionControlRate / 100) * 3) +
    Math.round((mealPreparationRate / 100) * 2);

  return {
    overallScore: Math.min(score, 25),
    totalStaff: total,
    foodHygieneRate,
    nutritionalPlanningRate,
    allergyAwarenessRate,
    culturalDietaryNeedsRate,
    portionControlRate,
    mealPreparationRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildNutritionProfiles(
  records: MealRecord[],
): ChildNutritionProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const r of records) {
    childIds.add(r.childId);
    childNames.set(r.childId, r.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childRecords = records.filter((r) => r.childId === childId);
    const childName = childNames.get(childId) ?? childId;

    const excellentGood = childRecords.filter(
      (r) => r.nutritionRating === "excellent" || r.nutritionRating === "good",
    ).length;
    const nutritionRate = pct(excellentGood, childRecords.length);

    const dietaryMet = childRecords.filter((r) => r.dietaryNeedsMet).length;
    const dietaryNeedsMetRate = pct(dietaryMet, childRecords.length);

    const uniqueTypes = new Set(childRecords.map((r) => r.mealType));
    const uniqueMealTypes = uniqueTypes.size;

    // Score 0-10
    let score = 0;

    // Frequency (0-2): >=10 meals -> 2, >=5 -> 1
    if (childRecords.length >= 10) score += 2;
    else if (childRecords.length >= 5) score += 1;

    // Nutrition rate (0-3): >=80% -> 3, >=60% -> 2, >=40% -> 1
    if (nutritionRate >= 80) score += 3;
    else if (nutritionRate >= 60) score += 2;
    else if (nutritionRate >= 40) score += 1;

    // Dietary needs met (0-3): >=80% -> 3, >=60% -> 2, >=40% -> 1
    if (dietaryNeedsMetRate >= 80) score += 3;
    else if (dietaryNeedsMetRate >= 60) score += 2;
    else if (dietaryNeedsMetRate >= 40) score += 1;

    // Diversity (0-2): >=4 unique meal types -> 2, >=2 -> 1
    if (uniqueMealTypes >= 4) score += 2;
    else if (uniqueMealTypes >= 2) score += 1;

    return {
      childId,
      childName,
      totalMeals: childRecords.length,
      nutritionRate,
      dietaryNeedsMetRate,
      uniqueMealTypes,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateFoodNutritionQualityIntelligence(
  records: MealRecord[],
  policy: NutritionPolicy | null,
  training: StaffNutritionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): FoodNutritionQualityIntelligence {
  const mealQuality = evaluateMealQuality(records);
  const nutritionCompliance = evaluateNutritionCompliance(records);
  const nutritionPolicy = evaluateNutritionPolicy(policy);
  const staffNutritionReadiness = evaluateStaffNutritionReadiness(training);

  const rawScore =
    mealQuality.overallScore +
    nutritionCompliance.overallScore +
    nutritionPolicy.overallScore +
    staffNutritionReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildNutritionProfiles(records);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (mealQuality.nutritionRate >= 80) {
    strengths.push(
      "Strong nutritional quality across meals",
    );
  }
  if (mealQuality.dietaryNeedsMetRate >= 80) {
    strengths.push(
      "Dietary needs consistently met for all children",
    );
  }
  if (mealQuality.childChoiceRate >= 80) {
    strengths.push(
      "Children's food choices are regularly offered and respected",
    );
  }
  if (nutritionCompliance.documentedRate >= 80) {
    strengths.push(
      "Excellent meal documentation and record-keeping",
    );
  }
  if (mealQuality.freshIngredientsRate >= 80) {
    strengths.push(
      "Fresh ingredients used consistently across meals",
    );
  }
  if (nutritionCompliance.portionAppropriateRate >= 80) {
    strengths.push(
      "Portions are appropriate and well-managed for children",
    );
  }
  if (nutritionPolicy.overallScore >= 22) {
    strengths.push(
      "Comprehensive nutrition policies in place with regular review",
    );
  }
  if (staffNutritionReadiness.overallScore >= 22) {
    strengths.push(
      "Staff team well-trained across food hygiene, nutrition, and dietary awareness",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (mealQuality.nutritionRate < 60 && records.length > 0) {
    areasForImprovement.push(
      "Nutritional quality of meals needs improvement — too few meals rated good or excellent",
    );
  }
  if (mealQuality.dietaryNeedsMetRate < 80 && records.length > 0) {
    areasForImprovement.push(
      "Dietary needs are not consistently met — review individual dietary requirements",
    );
  }
  if (mealQuality.freshIngredientsRate < 60 && records.length > 0) {
    areasForImprovement.push(
      "Use of fresh ingredients is below expectations — increase fresh food in meal preparation",
    );
  }
  if (nutritionCompliance.childSatisfiedRate < 60 && records.length > 0) {
    areasForImprovement.push(
      "Children's satisfaction with meals is low — review menu choices and meal quality",
    );
  }
  if (nutritionCompliance.documentedRate < 70 && records.length > 0) {
    areasForImprovement.push(
      "Meal documentation needs strengthening — ensure all meals are properly recorded",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push(
      "No meal records found — ensure meals are recorded and nutritional quality tracked",
    );
  }
  if (policy === null) {
    actions.push(
      "URGENT: No nutrition policy in place — develop and implement a comprehensive food and nutrition policy",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff nutrition training records — deliver food hygiene, nutritional planning, and allergy awareness training to all staff",
    );
  }
  if (nutritionCompliance.childSatisfiedRate < 60 && records.length > 0) {
    actions.push(
      "Address children's satisfaction with meals",
    );
  }
  if (mealQuality.freshIngredientsRate < 60 && records.length > 0) {
    actions.push(
      "Increase use of fresh ingredients",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 6 — Health care standard including nutritional needs",
    "CHR 2015 Regulation 9 — Quality of care standard",
    "SCCIF — Health and well-being outcomes for children",
    "NMS 10 — Health: nutrition and healthy eating",
    "Food Standards Agency requirements for residential settings",
    "Children Act 1989 — Welfare of the child including adequate nutrition",
    "Healthy eating guidance for residential care settings",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    mealQuality,
    nutritionCompliance,
    nutritionPolicy,
    staffNutritionReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
