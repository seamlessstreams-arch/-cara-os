// ══════════════════════════════════════════════════════════════════════════════
// NUTRITION & HYDRATION MONITORING INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how effectively a home monitors
// and supports children's nutrition and hydration — meal quality, hydration
// standards, nutrition policy, and staff readiness.
//
// Regulatory basis:
//   - CHR 2015, Reg 10 — Health and wellbeing: adequate nutrition and hydration
//   - SCCIF — How well children are helped and protected
//   - NMS 10 — Healthcare: nutrition and dietary needs
//   - Children Act 1989 — Duty of care for children's physical welfare
//   - Food Safety Act 1990 — Food hygiene and safety standards
//   - NICE PH11 — Maternal and child nutrition
//   - Healthy Child Programme — Nutritional guidance for looked-after children
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "supper";

export type DietaryRequirement =
  | "halal"
  | "kosher"
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "dairy_free"
  | "nut_free"
  | "medical_diet"
  | "other";

export type HydrationLevel =
  | "excellent"
  | "good"
  | "adequate"
  | "poor";

export type NutritionQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "concern";

export type PortionConsumed =
  | "full"
  | "most"
  | "half"
  | "little"
  | "none";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  supper: "Supper",
};

const DIETARY_REQUIREMENT_LABELS: Record<DietaryRequirement, string> = {
  halal: "Halal",
  kosher: "Kosher",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  gluten_free: "Gluten Free",
  dairy_free: "Dairy Free",
  nut_free: "Nut Free",
  medical_diet: "Medical Diet",
  other: "Other",
};

const HYDRATION_LEVEL_LABELS: Record<HydrationLevel, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
};

const NUTRITION_QUALITY_LABELS: Record<NutritionQuality, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
  concern: "Concern",
};

const PORTION_CONSUMED_LABELS: Record<PortionConsumed, string> = {
  full: "Full",
  most: "Most",
  half: "Half",
  little: "Little",
  none: "None",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Getters ──────────────────────────────────────────────────────────

export function getMealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABELS[type];
}

export function getDietaryRequirementLabel(req: DietaryRequirement): string {
  return DIETARY_REQUIREMENT_LABELS[req];
}

export function getHydrationLevelLabel(level: HydrationLevel): string {
  return HYDRATION_LEVEL_LABELS[level];
}

export function getNutritionQualityLabel(quality: NutritionQuality): string {
  return NUTRITION_QUALITY_LABELS[quality];
}

export function getPortionConsumedLabel(portion: PortionConsumed): string {
  return PORTION_CONSUMED_LABELS[portion];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MealRecord {
  id: string;
  childId: string;
  childName: string;
  mealDate: string; // ISO date
  mealType: MealType;
  nutritionQuality: NutritionQuality;
  portionConsumed: PortionConsumed;
  dietaryRequirementsMet: boolean;
  childSatisfied: boolean;
}

export interface HydrationRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string; // ISO date
  hydrationLevel: HydrationLevel;
  cupsConsumed: number;
  targetCups: number;
  encouragementGiven: boolean;
}

export interface NutritionPolicy {
  id: string;
  menuRotationWeeks: number;
  dietaryNeedsDocumented: boolean;
  allergyProtocolInPlace: boolean;
  mealTimeSupervised: boolean;
  nutritionTrainingProvided: boolean;
  culturalDietaryAccommodation: boolean;
  snackAvailability: boolean;
}

export interface StaffNutritionTraining {
  id: string;
  staffId: string;
  staffName: string;
  foodHygiene: boolean;
  dietaryRequirements: boolean;
  allergyAwareness: boolean;
  mealPreparation: boolean;
  nutritionGuidance: boolean;
  hydrationMonitoring: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface MealQualityResult {
  totalMeals: number;
  nutritionQualityGoodPlusCount: number;
  nutritionQualityGoodPlusRate: number;
  portionConsumedFullMostCount: number;
  portionConsumedFullMostRate: number;
  dietaryRequirementsMetCount: number;
  dietaryRequirementsMetRate: number;
  childSatisfiedCount: number;
  childSatisfiedRate: number;
  qualityBreakdown: Record<NutritionQuality, number>;
  portionBreakdown: Record<PortionConsumed, number>;
  mealTypeBreakdown: Record<MealType, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface HydrationStandardsResult {
  totalRecords: number;
  hydrationGoodPlusCount: number;
  hydrationGoodPlusRate: number;
  targetMetCount: number;
  targetMetRate: number;
  encouragementGivenCount: number;
  encouragementGivenRate: number;
  averageCupsConsumed: number;
  averageTargetCups: number;
  averageCupsVsTargetRate: number;
  hydrationBreakdown: Record<HydrationLevel, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface NutritionPolicyResult {
  hasPolicy: boolean;
  menuRotationWeeks: number;
  menuRotationAdequate: boolean;
  dietaryNeedsDocumented: boolean;
  allergyProtocolInPlace: boolean;
  mealTimeSupervised: boolean;
  nutritionTrainingProvided: boolean;
  culturalDietaryAccommodation: boolean;
  snackAvailability: boolean;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface StaffNutritionReadinessResult {
  totalStaff: number;
  foodHygieneCount: number;
  foodHygieneRate: number;
  dietaryRequirementsCount: number;
  dietaryRequirementsRate: number;
  allergyAwarenessCount: number;
  allergyAwarenessRate: number;
  mealPreparationCount: number;
  mealPreparationRate: number;
  nutritionGuidanceCount: number;
  nutritionGuidanceRate: number;
  hydrationMonitoringCount: number;
  hydrationMonitoringRate: number;
  overallTrainedCount: number;
  overallTrainedRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ChildNutritionProfile {
  childId: string;
  childName: string;
  totalMeals: number;
  averageNutritionScore: number;
  portionFullMostRate: number;
  satisfactionRate: number;
  dietaryRequirementsMetRate: number;
  hydrationRecords: number;
  averageHydrationCups: number;
  hydrationTargetMetRate: number;
  overallScore: number; // 0-10
}

export interface NutritionHydrationMonitoringIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  mealQuality: MealQualityResult;
  hydrationStandards: HydrationStandardsResult;
  nutritionPolicy: NutritionPolicyResult;
  staffNutritionReadiness: StaffNutritionReadinessResult;

  childProfiles: ChildNutritionProfile[];

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

// ── Rating ─────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Core Function 1: Evaluate Meal Quality (0-25) ──────────────────────────

export function evaluateMealQuality(
  meals: MealRecord[],
): MealQualityResult {
  const totalMeals = meals.length;

  // Empty = 0 (no meal records = no evidence of quality)
  if (totalMeals === 0) {
    return {
      totalMeals: 0,
      nutritionQualityGoodPlusCount: 0,
      nutritionQualityGoodPlusRate: 0,
      portionConsumedFullMostCount: 0,
      portionConsumedFullMostRate: 0,
      dietaryRequirementsMetCount: 0,
      dietaryRequirementsMetRate: 0,
      childSatisfiedCount: 0,
      childSatisfiedRate: 0,
      qualityBreakdown: { excellent: 0, good: 0, adequate: 0, poor: 0, concern: 0 },
      portionBreakdown: { full: 0, most: 0, half: 0, little: 0, none: 0 },
      mealTypeBreakdown: { breakfast: 0, lunch: 0, dinner: 0, snack: 0, supper: 0 },
      score: 0,
      strengths: [],
      concerns: ["No meal records available — nutrition quality cannot be assessed"],
    };
  }

  // Nutrition quality good+
  const nutritionQualityGoodPlusCount = meals.filter(
    (m) => m.nutritionQuality === "excellent" || m.nutritionQuality === "good",
  ).length;
  const nutritionQualityGoodPlusRate = pct(nutritionQualityGoodPlusCount, totalMeals);

  // Portion consumed full/most
  const portionConsumedFullMostCount = meals.filter(
    (m) => m.portionConsumed === "full" || m.portionConsumed === "most",
  ).length;
  const portionConsumedFullMostRate = pct(portionConsumedFullMostCount, totalMeals);

  // Dietary requirements met
  const dietaryRequirementsMetCount = meals.filter((m) => m.dietaryRequirementsMet).length;
  const dietaryRequirementsMetRate = pct(dietaryRequirementsMetCount, totalMeals);

  // Child satisfied
  const childSatisfiedCount = meals.filter((m) => m.childSatisfied).length;
  const childSatisfiedRate = pct(childSatisfiedCount, totalMeals);

  // Breakdowns
  const qualityBreakdown: Record<NutritionQuality, number> = {
    excellent: 0, good: 0, adequate: 0, poor: 0, concern: 0,
  };
  for (const m of meals) {
    qualityBreakdown[m.nutritionQuality]++;
  }

  const portionBreakdown: Record<PortionConsumed, number> = {
    full: 0, most: 0, half: 0, little: 0, none: 0,
  };
  for (const m of meals) {
    portionBreakdown[m.portionConsumed]++;
  }

  const mealTypeBreakdown: Record<MealType, number> = {
    breakfast: 0, lunch: 0, dinner: 0, snack: 0, supper: 0,
  };
  for (const m of meals) {
    mealTypeBreakdown[m.mealType]++;
  }

  // Score (out of 25)
  let score = 0;
  // Nutrition quality good+ rate: max 7
  score += (nutritionQualityGoodPlusRate / 100) * 7;
  // Portion consumed full/most rate: max 6
  score += (portionConsumedFullMostRate / 100) * 6;
  // Dietary requirements met rate: max 6
  score += (dietaryRequirementsMetRate / 100) * 6;
  // Child satisfied rate: max 6
  score += (childSatisfiedRate / 100) * 6;

  score = Math.min(Math.round(score * 10) / 10, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (nutritionQualityGoodPlusRate >= 90) {
    strengths.push("Excellent nutrition quality: " + nutritionQualityGoodPlusRate + "% of meals rated good or above");
  } else if (nutritionQualityGoodPlusRate < 70) {
    concerns.push("Nutrition quality at " + nutritionQualityGoodPlusRate + "% good or above — meal planning review needed");
  }

  if (portionConsumedFullMostRate >= 90) {
    strengths.push("Strong portion consumption: " + portionConsumedFullMostRate + "% of meals with full or most eaten");
  } else if (portionConsumedFullMostRate < 70) {
    concerns.push("Portion consumption at " + portionConsumedFullMostRate + "% — children may not be eating enough at mealtimes");
  }

  if (dietaryRequirementsMetRate >= 95) {
    strengths.push("Dietary requirements met in " + dietaryRequirementsMetRate + "% of meals — excellent compliance");
  } else if (dietaryRequirementsMetRate < 80) {
    concerns.push("Dietary requirements met in only " + dietaryRequirementsMetRate + "% of meals — regulatory breach risk");
  }

  if (childSatisfiedRate >= 90) {
    strengths.push("High child satisfaction: " + childSatisfiedRate + "% of children satisfied with meals");
  } else if (childSatisfiedRate < 70) {
    concerns.push("Child meal satisfaction at " + childSatisfiedRate + "% — children's preferences may not be adequately considered");
  }

  if (qualityBreakdown.concern > 0) {
    concerns.push(qualityBreakdown.concern + " meal(s) flagged as concern — immediate review of meal provision required");
  }

  return {
    totalMeals,
    nutritionQualityGoodPlusCount,
    nutritionQualityGoodPlusRate,
    portionConsumedFullMostCount,
    portionConsumedFullMostRate,
    dietaryRequirementsMetCount,
    dietaryRequirementsMetRate,
    childSatisfiedCount,
    childSatisfiedRate,
    qualityBreakdown,
    portionBreakdown,
    mealTypeBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 2: Evaluate Hydration Standards (0-25) ────────────────────

export function evaluateHydrationStandards(
  records: HydrationRecord[],
): HydrationStandardsResult {
  const totalRecords = records.length;

  // Empty = 0 (no records = no evidence of hydration monitoring)
  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      hydrationGoodPlusCount: 0,
      hydrationGoodPlusRate: 0,
      targetMetCount: 0,
      targetMetRate: 0,
      encouragementGivenCount: 0,
      encouragementGivenRate: 0,
      averageCupsConsumed: 0,
      averageTargetCups: 0,
      averageCupsVsTargetRate: 0,
      hydrationBreakdown: { excellent: 0, good: 0, adequate: 0, poor: 0 },
      score: 0,
      strengths: [],
      concerns: ["No hydration records available — hydration monitoring cannot be assessed"],
    };
  }

  // Hydration level good+
  const hydrationGoodPlusCount = records.filter(
    (r) => r.hydrationLevel === "excellent" || r.hydrationLevel === "good",
  ).length;
  const hydrationGoodPlusRate = pct(hydrationGoodPlusCount, totalRecords);

  // Target met (cupsConsumed >= targetCups)
  const targetMetCount = records.filter((r) => r.cupsConsumed >= r.targetCups).length;
  const targetMetRate = pct(targetMetCount, totalRecords);

  // Encouragement given
  const encouragementGivenCount = records.filter((r) => r.encouragementGiven).length;
  const encouragementGivenRate = pct(encouragementGivenCount, totalRecords);

  // Average cups consumed and target
  const totalCupsConsumed = records.reduce((sum, r) => sum + r.cupsConsumed, 0);
  const totalTargetCups = records.reduce((sum, r) => sum + r.targetCups, 0);
  const averageCupsConsumed = Math.round((totalCupsConsumed / totalRecords) * 10) / 10;
  const averageTargetCups = Math.round((totalTargetCups / totalRecords) * 10) / 10;
  const averageCupsVsTargetRate = totalTargetCups > 0
    ? Math.round((totalCupsConsumed / totalTargetCups) * 100)
    : 0;

  // Hydration breakdown
  const hydrationBreakdown: Record<HydrationLevel, number> = {
    excellent: 0, good: 0, adequate: 0, poor: 0,
  };
  for (const r of records) {
    hydrationBreakdown[r.hydrationLevel]++;
  }

  // Score (out of 25)
  let score = 0;
  // Hydration good+ rate: max 7
  score += (hydrationGoodPlusRate / 100) * 7;
  // Target met rate: max 6
  score += (targetMetRate / 100) * 6;
  // Encouragement rate: max 6
  score += (encouragementGivenRate / 100) * 6;
  // Average cups vs target: max 6
  const cupsRatio = Math.min(averageCupsVsTargetRate / 100, 1);
  score += cupsRatio * 6;

  score = Math.min(Math.round(score * 10) / 10, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (hydrationGoodPlusRate >= 90) {
    strengths.push("Excellent hydration levels: " + hydrationGoodPlusRate + "% of records at good or above");
  } else if (hydrationGoodPlusRate < 70) {
    concerns.push("Hydration levels at " + hydrationGoodPlusRate + "% good or above — hydration support needs improvement");
  }

  if (targetMetRate >= 90) {
    strengths.push("Strong hydration target achievement: " + targetMetRate + "% of children meeting daily targets");
  } else if (targetMetRate < 70) {
    concerns.push("Only " + targetMetRate + "% of children meeting hydration targets — increased encouragement needed");
  }

  if (encouragementGivenRate >= 90) {
    strengths.push("Consistent hydration encouragement: " + encouragementGivenRate + "% of records show staff encouragement");
  } else if (encouragementGivenRate < 70) {
    concerns.push("Hydration encouragement at " + encouragementGivenRate + "% — staff should actively promote fluid intake");
  }

  if (averageCupsVsTargetRate >= 90) {
    strengths.push("Average fluid intake at " + averageCupsVsTargetRate + "% of target — children well-hydrated");
  } else if (averageCupsVsTargetRate < 70) {
    concerns.push("Average fluid intake at " + averageCupsVsTargetRate + "% of target — dehydration risk");
  }

  if (hydrationBreakdown.poor > 0) {
    concerns.push(hydrationBreakdown.poor + " record(s) with poor hydration — individual hydration plans may be needed");
  }

  return {
    totalRecords,
    hydrationGoodPlusCount,
    hydrationGoodPlusRate,
    targetMetCount,
    targetMetRate,
    encouragementGivenCount,
    encouragementGivenRate,
    averageCupsConsumed,
    averageTargetCups,
    averageCupsVsTargetRate,
    hydrationBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 3: Evaluate Nutrition Policy (0-25) ───────────────────────

export function evaluateNutritionPolicy(
  policy: NutritionPolicy | null,
): NutritionPolicyResult {
  // Empty = 0 (no policy = no evidence of nutrition governance)
  if (!policy) {
    return {
      hasPolicy: false,
      menuRotationWeeks: 0,
      menuRotationAdequate: false,
      dietaryNeedsDocumented: false,
      allergyProtocolInPlace: false,
      mealTimeSupervised: false,
      nutritionTrainingProvided: false,
      culturalDietaryAccommodation: false,
      snackAvailability: false,
      score: 0,
      strengths: [],
      concerns: ["No nutrition policy documented — CHR 2015 Reg 10 requires documented nutrition arrangements"],
    };
  }

  const menuRotationAdequate = policy.menuRotationWeeks >= 4;

  // Score (out of 25)
  let score = 0;
  // Each boolean field scored
  if (policy.dietaryNeedsDocumented) score += 4;
  if (policy.allergyProtocolInPlace) score += 4;
  if (policy.mealTimeSupervised) score += 3;
  if (policy.nutritionTrainingProvided) score += 3;
  if (policy.culturalDietaryAccommodation) score += 3;
  if (policy.snackAvailability) score += 3;
  // Menu rotation: 4 weeks+ = 5 points, otherwise proportional
  if (menuRotationAdequate) {
    score += 5;
  } else if (policy.menuRotationWeeks > 0) {
    score += Math.round((policy.menuRotationWeeks / 4) * 5 * 10) / 10;
  }

  score = Math.min(Math.round(score * 10) / 10, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (policy.dietaryNeedsDocumented && policy.allergyProtocolInPlace) {
    strengths.push("Dietary needs documented and allergy protocols in place — strong safeguarding of dietary requirements");
  }
  if (!policy.dietaryNeedsDocumented) {
    concerns.push("Dietary needs not documented — all children's dietary requirements must be recorded per NMS 10");
  }
  if (!policy.allergyProtocolInPlace) {
    concerns.push("No allergy protocol in place — risk of allergen exposure, Food Safety Act 1990 compliance at risk");
  }

  if (menuRotationAdequate) {
    strengths.push("Menu rotation of " + policy.menuRotationWeeks + " weeks — provides variety and balanced nutrition");
  } else {
    concerns.push("Menu rotation at " + policy.menuRotationWeeks + " week(s) — increase to at least 4 weeks for adequate variety");
  }

  if (policy.mealTimeSupervised) {
    strengths.push("Mealtimes are supervised — supporting children's eating habits and social interaction");
  } else {
    concerns.push("Mealtimes not supervised — missed opportunity for monitoring intake and social development");
  }

  if (policy.culturalDietaryAccommodation) {
    strengths.push("Cultural and religious dietary needs accommodated — inclusive practice");
  } else {
    concerns.push("Cultural dietary accommodation not evidenced — potential breach of Equality Act 2010");
  }

  if (policy.snackAvailability) {
    strengths.push("Healthy snacks available between meals — supporting children's growth and energy needs");
  } else {
    concerns.push("Snacks not routinely available — children may experience hunger between meals");
  }

  if (policy.nutritionTrainingProvided) {
    strengths.push("Nutrition training provided to staff — supports evidence-based meal planning");
  } else {
    concerns.push("No nutrition training provided — staff may lack knowledge to plan balanced meals");
  }

  return {
    hasPolicy: true,
    menuRotationWeeks: policy.menuRotationWeeks,
    menuRotationAdequate,
    dietaryNeedsDocumented: policy.dietaryNeedsDocumented,
    allergyProtocolInPlace: policy.allergyProtocolInPlace,
    mealTimeSupervised: policy.mealTimeSupervised,
    nutritionTrainingProvided: policy.nutritionTrainingProvided,
    culturalDietaryAccommodation: policy.culturalDietaryAccommodation,
    snackAvailability: policy.snackAvailability,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 4: Evaluate Staff Nutrition Readiness (0-25) ──────────────

export function evaluateStaffNutritionReadiness(
  training: StaffNutritionTraining[],
): StaffNutritionReadinessResult {
  const totalStaff = training.length;

  // Empty = 0 (no training records = no evidence of readiness)
  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      foodHygieneCount: 0,
      foodHygieneRate: 0,
      dietaryRequirementsCount: 0,
      dietaryRequirementsRate: 0,
      allergyAwarenessCount: 0,
      allergyAwarenessRate: 0,
      mealPreparationCount: 0,
      mealPreparationRate: 0,
      nutritionGuidanceCount: 0,
      nutritionGuidanceRate: 0,
      hydrationMonitoringCount: 0,
      hydrationMonitoringRate: 0,
      overallTrainedCount: 0,
      overallTrainedRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff nutrition training records — staff readiness cannot be assessed"],
    };
  }

  // Individual field counts
  const foodHygieneCount = training.filter((t) => t.foodHygiene).length;
  const foodHygieneRate = pct(foodHygieneCount, totalStaff);

  const dietaryRequirementsCount = training.filter((t) => t.dietaryRequirements).length;
  const dietaryRequirementsRate = pct(dietaryRequirementsCount, totalStaff);

  const allergyAwarenessCount = training.filter((t) => t.allergyAwareness).length;
  const allergyAwarenessRate = pct(allergyAwarenessCount, totalStaff);

  const mealPreparationCount = training.filter((t) => t.mealPreparation).length;
  const mealPreparationRate = pct(mealPreparationCount, totalStaff);

  const nutritionGuidanceCount = training.filter((t) => t.nutritionGuidance).length;
  const nutritionGuidanceRate = pct(nutritionGuidanceCount, totalStaff);

  const hydrationMonitoringCount = training.filter((t) => t.hydrationMonitoring).length;
  const hydrationMonitoringRate = pct(hydrationMonitoringCount, totalStaff);

  // Overall trained (all six fields)
  const overallTrainedCount = training.filter(
    (t) =>
      t.foodHygiene &&
      t.dietaryRequirements &&
      t.allergyAwareness &&
      t.mealPreparation &&
      t.nutritionGuidance &&
      t.hydrationMonitoring,
  ).length;
  const overallTrainedRate = pct(overallTrainedCount, totalStaff);

  // Score (out of 25) — weighted fields
  // foodHygiene=6, dietaryRequirements=5, allergyAwareness=5, mealPreparation=4, nutritionGuidance=3, hydrationMonitoring=2
  let score = 0;
  score += (foodHygieneRate / 100) * 6;
  score += (dietaryRequirementsRate / 100) * 5;
  score += (allergyAwarenessRate / 100) * 5;
  score += (mealPreparationRate / 100) * 4;
  score += (nutritionGuidanceRate / 100) * 3;
  score += (hydrationMonitoringRate / 100) * 2;

  score = Math.min(Math.round(score * 10) / 10, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (foodHygieneRate >= 90) {
    strengths.push("Excellent food hygiene training: " + foodHygieneRate + "% of staff trained — Food Safety Act 1990 compliant");
  } else if (foodHygieneRate < 70) {
    concerns.push("Food hygiene training at " + foodHygieneRate + "% — all food-handling staff must be trained per Food Safety Act 1990");
  }

  if (allergyAwarenessRate >= 90) {
    strengths.push("Strong allergy awareness: " + allergyAwarenessRate + "% of staff trained in allergen management");
  } else if (allergyAwarenessRate < 70) {
    concerns.push("Allergy awareness at " + allergyAwarenessRate + "% — risk of allergen incidents without adequate training");
  }

  if (dietaryRequirementsRate >= 90) {
    strengths.push("Dietary requirements training at " + dietaryRequirementsRate + "% — staff can support diverse dietary needs");
  } else if (dietaryRequirementsRate < 70) {
    concerns.push("Dietary requirements training at " + dietaryRequirementsRate + "% — staff may not adequately support children's dietary needs");
  }

  if (mealPreparationRate >= 90) {
    strengths.push("Meal preparation training at " + mealPreparationRate + "% — staff equipped to prepare nutritious meals");
  } else if (mealPreparationRate < 70) {
    concerns.push("Meal preparation training at " + mealPreparationRate + "% — quality of meals may be compromised");
  }

  if (overallTrainedRate === 100) {
    strengths.push("100% of staff fully trained across all nutrition competencies");
  } else if (overallTrainedRate < 50) {
    concerns.push("Only " + overallTrainedRate + "% of staff have complete nutrition training — significant training gap");
  }

  return {
    totalStaff,
    foodHygieneCount,
    foodHygieneRate,
    dietaryRequirementsCount,
    dietaryRequirementsRate,
    allergyAwarenessCount,
    allergyAwarenessRate,
    mealPreparationCount,
    mealPreparationRate,
    nutritionGuidanceCount,
    nutritionGuidanceRate,
    hydrationMonitoringCount,
    hydrationMonitoringRate,
    overallTrainedCount,
    overallTrainedRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Nutrition Profiles ──────────────────────────────────────────

export function buildChildNutritionProfiles(
  meals: MealRecord[],
  hydrationRecords: HydrationRecord[],
): ChildNutritionProfile[] {
  // Collect all unique children
  const childMap = new Map<string, { childId: string; childName: string }>();

  for (const meal of meals) {
    if (!childMap.has(meal.childId)) {
      childMap.set(meal.childId, { childId: meal.childId, childName: meal.childName });
    }
  }
  for (const record of hydrationRecords) {
    if (!childMap.has(record.childId)) {
      childMap.set(record.childId, { childId: record.childId, childName: record.childName });
    }
  }

  return Array.from(childMap.values()).map((child) => {
    const childMeals = meals.filter((m) => m.childId === child.childId);
    const childHydration = hydrationRecords.filter((r) => r.childId === child.childId);

    const totalMeals = childMeals.length;

    // Average nutrition score: excellent=4, good=3, adequate=2, poor=1, concern=0
    const nutritionScoreMap: Record<NutritionQuality, number> = {
      excellent: 4, good: 3, adequate: 2, poor: 1, concern: 0,
    };
    const averageNutritionScore = totalMeals > 0
      ? Math.round((childMeals.reduce((sum, m) => sum + nutritionScoreMap[m.nutritionQuality], 0) / totalMeals) * 10) / 10
      : 0;

    // Portion full/most rate
    const portionFullMostCount = childMeals.filter(
      (m) => m.portionConsumed === "full" || m.portionConsumed === "most",
    ).length;
    const portionFullMostRate = pct(portionFullMostCount, totalMeals);

    // Satisfaction rate
    const satisfiedCount = childMeals.filter((m) => m.childSatisfied).length;
    const satisfactionRate = pct(satisfiedCount, totalMeals);

    // Dietary requirements met rate
    const dietaryMetCount = childMeals.filter((m) => m.dietaryRequirementsMet).length;
    const dietaryRequirementsMetRate = pct(dietaryMetCount, totalMeals);

    // Hydration
    const hydrationRecordsCount = childHydration.length;
    const averageHydrationCups = hydrationRecordsCount > 0
      ? Math.round((childHydration.reduce((sum, r) => sum + r.cupsConsumed, 0) / hydrationRecordsCount) * 10) / 10
      : 0;
    const hydrationTargetMetCount = childHydration.filter((r) => r.cupsConsumed >= r.targetCups).length;
    const hydrationTargetMetRate = pct(hydrationTargetMetCount, hydrationRecordsCount);

    // Overall score 0-10
    let overallScore = 0;
    // Nutrition quality contribution (0-3): averageNutritionScore out of 4, scaled to 3
    overallScore += (averageNutritionScore / 4) * 3;
    // Portion consumption (0-2)
    overallScore += (portionFullMostRate / 100) * 2;
    // Satisfaction (0-2)
    overallScore += (satisfactionRate / 100) * 2;
    // Dietary requirements met (0-1.5)
    overallScore += (dietaryRequirementsMetRate / 100) * 1.5;
    // Hydration target met (0-1.5)
    overallScore += (hydrationTargetMetRate / 100) * 1.5;

    overallScore = clamp(Math.round(overallScore * 10) / 10, 0, 10);

    return {
      childId: child.childId,
      childName: child.childName,
      totalMeals,
      averageNutritionScore,
      portionFullMostRate,
      satisfactionRate,
      dietaryRequirementsMetRate,
      hydrationRecords: hydrationRecordsCount,
      averageHydrationCups,
      hydrationTargetMetRate,
      overallScore,
    };
  });
}

// ── Generate Nutrition Hydration Monitoring Intelligence ────────────────────

export function generateNutritionHydrationMonitoringIntelligence(
  meals: MealRecord[],
  hydrationRecords: HydrationRecord[],
  policy: NutritionPolicy | null,
  training: StaffNutritionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): NutritionHydrationMonitoringIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter meals and hydration to period
  const periodMeals = meals.filter(
    (m) => withinPeriod(m.mealDate, periodStart, periodEnd),
  );
  const periodHydration = hydrationRecords.filter(
    (r) => withinPeriod(r.recordDate, periodStart, periodEnd),
  );

  // Evaluate each layer
  const mealQuality = evaluateMealQuality(periodMeals);
  const hydrationStandards = evaluateHydrationStandards(periodHydration);
  const nutritionPolicyResult = evaluateNutritionPolicy(policy);
  const staffNutritionReadiness = evaluateStaffNutritionReadiness(training);

  // Build child profiles
  const childProfiles = buildChildNutritionProfiles(periodMeals, periodHydration);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      mealQuality.score +
      hydrationStandards.score +
      nutritionPolicyResult.score +
      staffNutritionReadiness.score,
    ),
    0,
    100,
  );

  const rating = getRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(
    mealQuality, hydrationStandards, nutritionPolicyResult, staffNutritionReadiness, overallScore,
  );
  const areasForImprovement = aggregateAreasForImprovement(
    mealQuality, hydrationStandards, nutritionPolicyResult, staffNutritionReadiness, overallScore,
  );
  const actions = generateActions(
    mealQuality, hydrationStandards, nutritionPolicyResult, staffNutritionReadiness, childProfiles,
  );
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    mealQuality,
    hydrationStandards,
    nutritionPolicy: nutritionPolicyResult,
    staffNutritionReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ────────────────────────────────────────────────────

function aggregateStrengths(
  mealQuality: MealQualityResult,
  hydration: HydrationStandardsResult,
  policy: NutritionPolicyResult,
  staff: StaffNutritionReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall nutrition and hydration monitoring rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall nutrition and hydration monitoring rated Good (" + overallScore + "/100)");
  }

  // Pick top strengths from each area (max 2 per area)
  strengths.push(...mealQuality.strengths.slice(0, 2));
  strengths.push(...hydration.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ────────────────────────────────────────

function aggregateAreasForImprovement(
  mealQuality: MealQualityResult,
  hydration: HydrationStandardsResult,
  policy: NutritionPolicyResult,
  staff: StaffNutritionReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall nutrition and hydration monitoring rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall nutrition and hydration monitoring Requires Improvement (" + overallScore + "/100)");
  }

  areas.push(...mealQuality.concerns);
  areas.push(...hydration.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ──────────────────────────────────────────────────────

function generateActions(
  mealQuality: MealQualityResult,
  hydration: HydrationStandardsResult,
  policy: NutritionPolicyResult,
  staff: StaffNutritionReadinessResult,
  childProfiles: ChildNutritionProfile[],
): string[] {
  const actions: string[] = [];

  // Concern meals
  if (mealQuality.qualityBreakdown.concern > 0) {
    actions.push("URGENT: " + mealQuality.qualityBreakdown.concern + " meal(s) flagged as concern — review meal provision and investigate causes immediately");
  }

  // Poor hydration records
  if (hydration.hydrationBreakdown.poor > 0) {
    actions.push("URGENT: " + hydration.hydrationBreakdown.poor + " hydration record(s) rated poor — implement individual hydration plans");
  }

  // Children at nutritional risk (low overall score)
  const atRiskChildren = childProfiles.filter((p) => p.overallScore <= 4);
  if (atRiskChildren.length > 0) {
    actions.push("URGENT: " + atRiskChildren.length + " child(ren) with low nutrition scores — arrange dietary assessment and individualised meal planning");
  }

  // No allergy protocol
  if (!policy.allergyProtocolInPlace) {
    actions.push("URGENT: No allergy protocol in place — implement allergen management procedures per Food Safety Act 1990");
  }

  // Low dietary requirements met
  if (mealQuality.dietaryRequirementsMetRate < 80 && mealQuality.totalMeals > 0) {
    actions.push("HIGH: Dietary requirements met in only " + mealQuality.dietaryRequirementsMetRate + "% of meals — review and update dietary plans for all children");
  }

  // Low hydration targets
  if (hydration.targetMetRate < 70 && hydration.totalRecords > 0) {
    actions.push("HIGH: Only " + hydration.targetMetRate + "% of children meeting hydration targets — increase fluid availability and staff encouragement");
  }

  // Staff training gaps
  if (staff.overallTrainedRate < 50 && staff.totalStaff > 0) {
    actions.push("HIGH: Only " + staff.overallTrainedRate + "% of staff fully trained in nutrition — schedule comprehensive training programme");
  }

  // Food hygiene gap
  if (staff.foodHygieneRate < 70 && staff.totalStaff > 0) {
    actions.push("HIGH: Food hygiene training at " + staff.foodHygieneRate + "% — all food-handling staff require Level 2 food hygiene certification");
  }

  // Low child satisfaction
  if (mealQuality.childSatisfiedRate < 70 && mealQuality.totalMeals > 0) {
    actions.push("MEDIUM: Child meal satisfaction at " + mealQuality.childSatisfiedRate + "% — conduct menu review with children's input");
  }

  // No policy
  if (!policy.hasPolicy) {
    actions.push("MEDIUM: No nutrition policy documented — develop and implement a comprehensive nutrition policy");
  }

  // Menu rotation
  if (policy.hasPolicy && !policy.menuRotationAdequate) {
    actions.push("MEDIUM: Menu rotation at " + policy.menuRotationWeeks + " week(s) — extend to at least 4 weeks for nutritional variety");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Nutrition and hydration monitoring systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015, Reg 10 — Health and wellbeing: adequate nutrition and hydration",
    "SCCIF — How well children are helped and protected",
    "NMS 10 — Healthcare: nutrition and dietary needs",
    "Children Act 1989 — Duty of care for children's physical welfare",
    "Food Safety Act 1990 — Food hygiene and safety standards",
    "NICE PH11 — Maternal and child nutrition",
    "Healthy Child Programme — Nutritional guidance for looked-after children",
  ];
}
