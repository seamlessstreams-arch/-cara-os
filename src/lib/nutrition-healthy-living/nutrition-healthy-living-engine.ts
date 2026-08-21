// ══════════════════════════════════════════════════════════════════════════════
// Cara Nutrition & Healthy Living Intelligence Engine
//
// Evaluates meal quality, dietary compliance, physical activity, health
// promotion, and outcomes for children in residential care.
//
// Regulatory basis:
//   - CHR 2015 Reg 6 (quality of care standard — health & wellbeing)
//   - CHR 2015 Reg 7 (health & wellbeing standard)
//   - CHR 2015 Reg 14 (care planning — health needs)
//   - NMS 7 (leisure activities)
//   - NMS 10 (enjoying and achieving)
//   - NICE PH11 (maternal and child nutrition)
//   - NICE CG43 (obesity prevention)
//   - UNCRC Article 24 (right to health)
//   - UNCRC Article 27 (adequate standard of living)
//   - SCCIF — health and wellbeing outcomes
//
// Pure deterministic engine — no AI, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Definitions ─────────────────────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type DietaryRequirement =
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "gluten_free"
  | "dairy_free"
  | "nut_free"
  | "egg_free"
  | "diabetic"
  | "low_sugar"
  | "high_calorie"
  | "texture_modified"
  | "none";

export type MealQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor";

export type ActivityType =
  | "sports"
  | "swimming"
  | "walking"
  | "cycling"
  | "gym"
  | "dance"
  | "outdoor_play"
  | "gardening"
  | "yoga"
  | "martial_arts"
  | "team_games"
  | "other";

export type ActivityIntensity = "vigorous" | "moderate" | "light";

export type HealthOutcome =
  | "improved"
  | "maintained"
  | "declined"
  | "not_assessed";

export type HydrationStatus =
  | "well_hydrated"
  | "adequate"
  | "needs_improvement"
  | "concern";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface MealRecord {
  id: string;
  childId: string;
  date: string;
  mealType: MealType;
  quality: MealQuality;
  dietaryRequirementsMet: boolean;
  freshFruitVegIncluded: boolean;
  childInvolvedInPreparation: boolean;
  childEnjoyed: boolean;
  portionAppropriate: boolean;
}

export interface ChildDietaryProfile {
  id: string;
  childId: string;
  childName: string;
  dietaryRequirements: DietaryRequirement[];
  allergies: string[];
  preferences: string[];
  lastReviewedDate: string;
  reviewedBy: string;
  weightHealthy: boolean;
  bmiPercentile?: number;
  dietaryPlanInPlace: boolean;
}

export interface PhysicalActivity {
  id: string;
  childId: string;
  date: string;
  activityType: ActivityType;
  intensity: ActivityIntensity;
  durationMinutes: number;
  childEnjoyment: boolean;
  staffSupervised: boolean;
}

export interface HealthPromotion {
  id: string;
  childId: string;
  hydrationStatus: HydrationStatus;
  sleepQualityGood: boolean;
  dentalCheckUpToDate: boolean;
  opticalCheckUpToDate: boolean;
  annualHealthAssessmentComplete: boolean;
  cookingSkillsDeveloping: boolean;
  nutritionEducationProvided: boolean;
  mentalWellbeingSupported: boolean;
  substanceMisuseEducation: boolean;
  sexualHealthEducation: boolean;
  assessedDate: string;
}

export interface MenuPlan {
  id: string;
  weekStartDate: string;
  mealsPlanned: number;
  balancedMeals: number;
  childrenConsulted: boolean;
  culturalDiversityReflected: boolean;
  budgetAppropriate: boolean;
  seasonalIngredientsUsed: boolean;
  specialDietsCatered: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface MealQualityResult {
  overallScore: number; // 0-25
  totalMeals: number;
  excellentGoodRate: number;
  dietaryComplianceRate: number;
  freshFruitVegRate: number;
  childInvolvementRate: number;
  childEnjoymentRate: number;
  portionAppropriateRate: number;
  mealTypeBreakdown: Record<MealType, number>;
}

export interface PhysicalActivityResult {
  overallScore: number; // 0-25
  totalActivities: number;
  averageMinutesPerChildPerWeek: number;
  activeChildrenRate: number;
  vigorousModerateRate: number;
  childEnjoymentRate: number;
  activityVariety: number;
  meetsNHSGuidelines: boolean;
}

export interface HealthPromotionResult {
  overallScore: number; // 0-25
  hydrationGoodRate: number;
  sleepQualityRate: number;
  dentalUpToDateRate: number;
  opticalUpToDateRate: number;
  annualHealthAssessmentRate: number;
  cookingSkillsRate: number;
  nutritionEducationRate: number;
  mentalWellbeingRate: number;
}

export interface MenuPlanningResult {
  overallScore: number; // 0-25
  totalMenuPlans: number;
  balancedMealRate: number;
  childConsultationRate: number;
  culturalDiversityRate: number;
  specialDietsCateredRate: number;
  seasonalIngredientRate: number;
}

export interface ChildNutritionProfile {
  childId: string;
  childName: string;
  dietaryRequirements: DietaryRequirement[];
  dietaryComplianceRate: number;
  weeklyActivityMinutes: number;
  healthChecksUpToDate: boolean;
  overallScore: number; // 0-10
}

export interface NutritionHealthyLivingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  mealQuality: MealQualityResult;
  physicalActivity: PhysicalActivityResult;
  healthPromotion: HealthPromotionResult;
  menuPlanning: MenuPlanningResult;
  childProfiles: ChildNutritionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Functions ──────────────────────────────────────────────────────────

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const DIETARY_REQUIREMENT_LABELS: Record<DietaryRequirement, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  halal: "Halal",
  kosher: "Kosher",
  gluten_free: "Gluten Free",
  dairy_free: "Dairy Free",
  nut_free: "Nut Free",
  egg_free: "Egg Free",
  diabetic: "Diabetic",
  low_sugar: "Low Sugar",
  high_calorie: "High Calorie",
  texture_modified: "Texture Modified",
  none: "None",
};

const MEAL_QUALITY_LABELS: Record<MealQuality, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
};

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  sports: "Sports",
  swimming: "Swimming",
  walking: "Walking",
  cycling: "Cycling",
  gym: "Gym",
  dance: "Dance",
  outdoor_play: "Outdoor Play",
  gardening: "Gardening",
  yoga: "Yoga",
  martial_arts: "Martial Arts",
  team_games: "Team Games",
  other: "Other",
};

const ACTIVITY_INTENSITY_LABELS: Record<ActivityIntensity, string> = {
  vigorous: "Vigorous",
  moderate: "Moderate",
  light: "Light",
};

const HEALTH_OUTCOME_LABELS: Record<HealthOutcome, string> = {
  improved: "Improved",
  maintained: "Maintained",
  declined: "Declined",
  not_assessed: "Not Assessed",
};

const HYDRATION_STATUS_LABELS: Record<HydrationStatus, string> = {
  well_hydrated: "Well Hydrated",
  adequate: "Adequate",
  needs_improvement: "Needs Improvement",
  concern: "Concern",
};

export function getMealTypeLabel(t: MealType): string {
  return MEAL_TYPE_LABELS[t] ?? t;
}

export function getDietaryRequirementLabel(d: DietaryRequirement): string {
  return DIETARY_REQUIREMENT_LABELS[d] ?? d;
}

export function getMealQualityLabel(q: MealQuality): string {
  return MEAL_QUALITY_LABELS[q] ?? q;
}

export function getActivityTypeLabel(t: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[t] ?? t;
}

export function getActivityIntensityLabel(i: ActivityIntensity): string {
  return ACTIVITY_INTENSITY_LABELS[i] ?? i;
}

export function getHealthOutcomeLabel(o: HealthOutcome): string {
  return HEALTH_OUTCOME_LABELS[o] ?? o;
}

export function getHydrationStatusLabel(s: HydrationStatus): string {
  return HYDRATION_STATUS_LABELS[s] ?? s;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function weeksBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const weeks = ms / (1000 * 60 * 60 * 24 * 7);
  return Math.max(weeks, 1);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluation Functions ─────────────────────────────────────────────────────

/**
 * Evaluates meal quality and dietary compliance.
 * Max score: 25
 */
export function evaluateMealQuality(
  meals: MealRecord[],
  _profiles: ChildDietaryProfile[],
): MealQualityResult {
  const mealTypeBreakdown = {} as Record<MealType, number>;
  for (const m of meals) {
    mealTypeBreakdown[m.mealType] = (mealTypeBreakdown[m.mealType] || 0) + 1;
  }

  if (meals.length === 0) {
    return {
      overallScore: 0,
      totalMeals: 0,
      excellentGoodRate: 0,
      dietaryComplianceRate: 0,
      freshFruitVegRate: 0,
      childInvolvementRate: 0,
      childEnjoymentRate: 0,
      portionAppropriateRate: 0,
      mealTypeBreakdown,
    };
  }

  let score = 0;

  const excellentGood = meals.filter(
    (m) => m.quality === "excellent" || m.quality === "good",
  ).length;
  const excellentGoodRate = pct(excellentGood, meals.length);
  // +7 for ≥ 90%, +5 for ≥ 70%, +3 for ≥ 50%
  if (excellentGoodRate >= 90) score += 7;
  else if (excellentGoodRate >= 70) score += 5;
  else if (excellentGoodRate >= 50) score += 3;

  const dietaryMet = meals.filter((m) => m.dietaryRequirementsMet).length;
  const dietaryComplianceRate = pct(dietaryMet, meals.length);
  // +5 for 100%, +3 for ≥ 90%
  if (dietaryComplianceRate >= 100) score += 5;
  else if (dietaryComplianceRate >= 90) score += 3;
  else if (dietaryComplianceRate >= 70) score += 1;

  const freshFV = meals.filter((m) => m.freshFruitVegIncluded).length;
  const freshFruitVegRate = pct(freshFV, meals.length);
  // +4 for ≥ 80%
  if (freshFruitVegRate >= 80) score += 4;
  else if (freshFruitVegRate >= 60) score += 2;

  const childInvolved = meals.filter(
    (m) => m.childInvolvedInPreparation,
  ).length;
  const childInvolvementRate = pct(childInvolved, meals.length);
  // +3 for ≥ 30% (children involved in preparation is positive but not expected every meal)
  if (childInvolvementRate >= 30) score += 3;
  else if (childInvolvementRate >= 15) score += 2;
  else if (childInvolvementRate > 0) score += 1;

  const enjoyed = meals.filter((m) => m.childEnjoyed).length;
  const childEnjoymentRate = pct(enjoyed, meals.length);
  // +3 for ≥ 80%
  if (childEnjoymentRate >= 80) score += 3;
  else if (childEnjoymentRate >= 60) score += 2;

  const portionOk = meals.filter((m) => m.portionAppropriate).length;
  const portionAppropriateRate = pct(portionOk, meals.length);
  // +3 for ≥ 90%
  if (portionAppropriateRate >= 90) score += 3;
  else if (portionAppropriateRate >= 70) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalMeals: meals.length,
    excellentGoodRate,
    dietaryComplianceRate,
    freshFruitVegRate,
    childInvolvementRate,
    childEnjoymentRate,
    portionAppropriateRate,
    mealTypeBreakdown,
  };
}

/**
 * Evaluates physical activity levels.
 * Max score: 25
 */
export function evaluatePhysicalActivity(
  activities: PhysicalActivity[],
  childIds: string[],
  periodStart: string,
  periodEnd: string,
): PhysicalActivityResult {
  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      averageMinutesPerChildPerWeek: 0,
      activeChildrenRate: 0,
      vigorousModerateRate: 0,
      childEnjoymentRate: 0,
      activityVariety: 0,
      meetsNHSGuidelines: false,
    };
  }

  let score = 0;
  const weeks = weeksBetween(periodStart, periodEnd);
  const totalChildren = Math.max(childIds.length, 1);

  // Total minutes per child per week
  const totalMinutes = activities.reduce(
    (sum, a) => sum + a.durationMinutes,
    0,
  );
  const avgMinutesPerChildPerWeek = Math.round(
    totalMinutes / totalChildren / weeks,
  );

  // NHS guidelines: children should be active for 60 min/day = 420 min/week
  const meetsNHSGuidelines = avgMinutesPerChildPerWeek >= 420;

  // +7 if meets NHS guidelines (420 min/week), +5 for ≥ 300, +3 for ≥ 180
  if (avgMinutesPerChildPerWeek >= 420) score += 7;
  else if (avgMinutesPerChildPerWeek >= 300) score += 5;
  else if (avgMinutesPerChildPerWeek >= 180) score += 3;
  else if (avgMinutesPerChildPerWeek >= 60) score += 1;

  // Active children rate (% with any activity)
  const activeChildren = new Set(activities.map((a) => a.childId));
  const activeChildrenRate = pct(activeChildren.size, totalChildren);
  // +5 for 100%, +3 for ≥ 80%
  if (activeChildrenRate >= 100) score += 5;
  else if (activeChildrenRate >= 80) score += 3;
  else if (activeChildrenRate >= 60) score += 1;

  // Vigorous/moderate rate
  const vigorousMod = activities.filter(
    (a) => a.intensity === "vigorous" || a.intensity === "moderate",
  ).length;
  const vigorousModerateRate = pct(vigorousMod, activities.length);
  // +4 for ≥ 70%
  if (vigorousModerateRate >= 70) score += 4;
  else if (vigorousModerateRate >= 50) score += 2;

  // Child enjoyment
  const enjoyed = activities.filter((a) => a.childEnjoyment).length;
  const childEnjoymentRate = pct(enjoyed, activities.length);
  // +4 for ≥ 80%
  if (childEnjoymentRate >= 80) score += 4;
  else if (childEnjoymentRate >= 60) score += 2;

  // Activity variety (unique types)
  const uniqueTypes = new Set(activities.map((a) => a.activityType));
  const activityVariety = uniqueTypes.size;
  // +5 for ≥ 5 types, +3 for ≥ 3
  if (activityVariety >= 5) score += 5;
  else if (activityVariety >= 3) score += 3;
  else if (activityVariety >= 1) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalActivities: activities.length,
    averageMinutesPerChildPerWeek: avgMinutesPerChildPerWeek,
    activeChildrenRate,
    vigorousModerateRate,
    childEnjoymentRate,
    activityVariety,
    meetsNHSGuidelines,
  };
}

/**
 * Evaluates health promotion practices.
 * Max score: 25
 */
export function evaluateHealthPromotion(
  healthRecords: HealthPromotion[],
): HealthPromotionResult {
  if (healthRecords.length === 0) {
    return {
      overallScore: 0,
      hydrationGoodRate: 0,
      sleepQualityRate: 0,
      dentalUpToDateRate: 0,
      opticalUpToDateRate: 0,
      annualHealthAssessmentRate: 0,
      cookingSkillsRate: 0,
      nutritionEducationRate: 0,
      mentalWellbeingRate: 0,
    };
  }

  let score = 0;
  const total = healthRecords.length;

  const hydrationGood = healthRecords.filter(
    (h) =>
      h.hydrationStatus === "well_hydrated" ||
      h.hydrationStatus === "adequate",
  ).length;
  const hydrationGoodRate = pct(hydrationGood, total);
  // +3 for ≥ 90%
  if (hydrationGoodRate >= 90) score += 3;
  else if (hydrationGoodRate >= 70) score += 2;

  const sleepGood = healthRecords.filter((h) => h.sleepQualityGood).length;
  const sleepQualityRate = pct(sleepGood, total);
  // +3 for ≥ 80%
  if (sleepQualityRate >= 80) score += 3;
  else if (sleepQualityRate >= 60) score += 2;

  const dentalOk = healthRecords.filter(
    (h) => h.dentalCheckUpToDate,
  ).length;
  const dentalUpToDateRate = pct(dentalOk, total);
  // +3 for ≥ 90%
  if (dentalUpToDateRate >= 90) score += 3;
  else if (dentalUpToDateRate >= 70) score += 2;

  const opticalOk = healthRecords.filter(
    (h) => h.opticalCheckUpToDate,
  ).length;
  const opticalUpToDateRate = pct(opticalOk, total);
  // +3 for ≥ 90%
  if (opticalUpToDateRate >= 90) score += 3;
  else if (opticalUpToDateRate >= 70) score += 2;

  const annualHA = healthRecords.filter(
    (h) => h.annualHealthAssessmentComplete,
  ).length;
  const annualHealthAssessmentRate = pct(annualHA, total);
  // +4 for 100%, +2 for ≥ 80%
  if (annualHealthAssessmentRate >= 100) score += 4;
  else if (annualHealthAssessmentRate >= 80) score += 2;

  const cookingSkills = healthRecords.filter(
    (h) => h.cookingSkillsDeveloping,
  ).length;
  const cookingSkillsRate = pct(cookingSkills, total);
  // +3 for ≥ 80%
  if (cookingSkillsRate >= 80) score += 3;
  else if (cookingSkillsRate >= 50) score += 2;

  const nutritionEd = healthRecords.filter(
    (h) => h.nutritionEducationProvided,
  ).length;
  const nutritionEducationRate = pct(nutritionEd, total);
  // +3 for ≥ 80%
  if (nutritionEducationRate >= 80) score += 3;
  else if (nutritionEducationRate >= 50) score += 2;

  const mentalWB = healthRecords.filter(
    (h) => h.mentalWellbeingSupported,
  ).length;
  const mentalWellbeingRate = pct(mentalWB, total);
  // +3 for ≥ 90%
  if (mentalWellbeingRate >= 90) score += 3;
  else if (mentalWellbeingRate >= 70) score += 2;

  return {
    overallScore: Math.min(score, 25),
    hydrationGoodRate,
    sleepQualityRate,
    dentalUpToDateRate,
    opticalUpToDateRate,
    annualHealthAssessmentRate,
    cookingSkillsRate,
    nutritionEducationRate,
    mentalWellbeingRate,
  };
}

/**
 * Evaluates menu planning quality.
 * Max score: 25
 */
export function evaluateMenuPlanning(
  menuPlans: MenuPlan[],
): MenuPlanningResult {
  if (menuPlans.length === 0) {
    return {
      overallScore: 0,
      totalMenuPlans: 0,
      balancedMealRate: 0,
      childConsultationRate: 0,
      culturalDiversityRate: 0,
      specialDietsCateredRate: 0,
      seasonalIngredientRate: 0,
    };
  }

  let score = 0;
  const total = menuPlans.length;

  // Balanced meal rate
  const totalPlanned = menuPlans.reduce((s, m) => s + m.mealsPlanned, 0);
  const totalBalanced = menuPlans.reduce((s, m) => s + m.balancedMeals, 0);
  const balancedMealRate = pct(totalBalanced, totalPlanned);
  // +6 for ≥ 90%, +4 for ≥ 70%
  if (balancedMealRate >= 90) score += 6;
  else if (balancedMealRate >= 70) score += 4;
  else if (balancedMealRate >= 50) score += 2;

  // Child consultation rate
  const consulted = menuPlans.filter((m) => m.childrenConsulted).length;
  const childConsultationRate = pct(consulted, total);
  // +5 for ≥ 90%
  if (childConsultationRate >= 90) score += 5;
  else if (childConsultationRate >= 70) score += 3;
  else if (childConsultationRate >= 50) score += 1;

  // Cultural diversity
  const culturalDiv = menuPlans.filter(
    (m) => m.culturalDiversityReflected,
  ).length;
  const culturalDiversityRate = pct(culturalDiv, total);
  // +4 for ≥ 80%
  if (culturalDiversityRate >= 80) score += 4;
  else if (culturalDiversityRate >= 50) score += 2;

  // Special diets catered
  const specialDiets = menuPlans.filter(
    (m) => m.specialDietsCatered,
  ).length;
  const specialDietsCateredRate = pct(specialDiets, total);
  // +5 for 100%
  if (specialDietsCateredRate >= 100) score += 5;
  else if (specialDietsCateredRate >= 80) score += 3;
  else if (specialDietsCateredRate >= 60) score += 1;

  // Seasonal ingredients
  const seasonal = menuPlans.filter(
    (m) => m.seasonalIngredientsUsed,
  ).length;
  const seasonalIngredientRate = pct(seasonal, total);
  // +5 for ≥ 80%
  if (seasonalIngredientRate >= 80) score += 5;
  else if (seasonalIngredientRate >= 50) score += 3;

  return {
    overallScore: Math.min(score, 25),
    totalMenuPlans: total,
    balancedMealRate,
    childConsultationRate,
    culturalDiversityRate,
    specialDietsCateredRate,
    seasonalIngredientRate,
  };
}

// ── Child Profiles ───────────────────────────────────────────────────────────

export function buildChildNutritionProfiles(
  profiles: ChildDietaryProfile[],
  meals: MealRecord[],
  activities: PhysicalActivity[],
  healthRecords: HealthPromotion[],
  periodStart: string,
  periodEnd: string,
): ChildNutritionProfile[] {
  const weeks = weeksBetween(periodStart, periodEnd);

  return profiles.map((profile) => {
    const childMeals = meals.filter((m) => m.childId === profile.childId);
    const childActivities = activities.filter(
      (a) => a.childId === profile.childId,
    );
    const childHealth = healthRecords.filter(
      (h) => h.childId === profile.childId,
    );

    // Dietary compliance
    const dietaryMet = childMeals.filter(
      (m) => m.dietaryRequirementsMet,
    ).length;
    const dietaryComplianceRate = pct(dietaryMet, childMeals.length);

    // Weekly activity minutes
    const totalMinutes = childActivities.reduce(
      (sum, a) => sum + a.durationMinutes,
      0,
    );
    const weeklyActivityMinutes = Math.round(totalMinutes / weeks);

    // Health checks
    const latestHealth = childHealth.length > 0 ? childHealth[0] : null;
    const healthChecksUpToDate = latestHealth
      ? latestHealth.dentalCheckUpToDate &&
        latestHealth.opticalCheckUpToDate &&
        latestHealth.annualHealthAssessmentComplete
      : false;

    // Profile score 0-10
    let profileScore = 3;
    if (dietaryComplianceRate >= 95) profileScore += 2;
    else if (dietaryComplianceRate >= 80) profileScore += 1;
    if (weeklyActivityMinutes >= 420) profileScore += 2;
    else if (weeklyActivityMinutes >= 180) profileScore += 1;
    if (healthChecksUpToDate) profileScore += 2;
    if (profile.dietaryPlanInPlace) profileScore += 1;
    // Penalties
    if (dietaryComplianceRate < 50 && childMeals.length > 0) profileScore -= 1;
    if (weeklyActivityMinutes < 60) profileScore -= 1;

    return {
      childId: profile.childId,
      childName: profile.childName,
      dietaryRequirements: profile.dietaryRequirements,
      dietaryComplianceRate,
      weeklyActivityMinutes,
      healthChecksUpToDate,
      overallScore: Math.max(0, Math.min(profileScore, 10)),
    };
  });
}

// ── Strengths / Areas / Actions ──────────────────────────────────────────────

function generateStrengths(
  meal: MealQualityResult,
  activity: PhysicalActivityResult,
  health: HealthPromotionResult,
  menu: MenuPlanningResult,
): string[] {
  const strengths: string[] = [];

  if (meal.excellentGoodRate >= 90) {
    strengths.push(
      "Excellent meal quality — the majority of meals are rated good or excellent",
    );
  }

  if (meal.dietaryComplianceRate >= 95) {
    strengths.push(
      "Outstanding dietary compliance — individual dietary needs consistently met",
    );
  }

  if (meal.childInvolvementRate >= 25) {
    strengths.push(
      "Children actively involved in meal preparation — promoting independence and life skills",
    );
  }

  if (activity.meetsNHSGuidelines) {
    strengths.push(
      "Physical activity meets NHS guidelines — children are active for recommended duration",
    );
  }

  if (activity.activityVariety >= 5) {
    strengths.push(
      "Excellent variety of physical activities offered — supporting different interests and abilities",
    );
  }

  if (activity.childEnjoymentRate >= 85) {
    strengths.push(
      "High child enjoyment rate in physical activities — children genuinely engaged",
    );
  }

  if (health.annualHealthAssessmentRate >= 100) {
    strengths.push(
      "All children have completed annual health assessments — comprehensive health monitoring",
    );
  }

  if (health.cookingSkillsRate >= 80) {
    strengths.push(
      "Cooking skills development embedded for most children — supporting independence",
    );
  }

  if (menu.childConsultationRate >= 90) {
    strengths.push(
      "Children consistently consulted on menu planning — strong participation and choice",
    );
  }

  if (menu.culturalDiversityRate >= 80) {
    strengths.push(
      "Menus reflect cultural diversity — celebrating children's backgrounds through food",
    );
  }

  if (meal.freshFruitVegRate >= 85) {
    strengths.push(
      "Fresh fruit and vegetables included in the majority of meals — 5-a-day commitment evident",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  meal: MealQualityResult,
  activity: PhysicalActivityResult,
  health: HealthPromotionResult,
  menu: MenuPlanningResult,
): string[] {
  const areas: string[] = [];

  if (meal.dietaryComplianceRate < 90 && meal.totalMeals > 0) {
    areas.push(
      `Dietary compliance at ${meal.dietaryComplianceRate}% — all meals should meet individual dietary requirements`,
    );
  }

  if (meal.excellentGoodRate < 70 && meal.totalMeals > 0) {
    areas.push(
      `Only ${meal.excellentGoodRate}% of meals rated good or excellent — meal quality needs attention`,
    );
  }

  if (meal.freshFruitVegRate < 60 && meal.totalMeals > 0) {
    areas.push(
      `Fresh fruit and vegetables included in only ${meal.freshFruitVegRate}% of meals`,
    );
  }

  if (!activity.meetsNHSGuidelines && activity.totalActivities > 0) {
    areas.push(
      `Average ${activity.averageMinutesPerChildPerWeek} minutes activity per week — below NHS guideline of 420 minutes`,
    );
  }

  if (activity.activeChildrenRate < 100 && activity.totalActivities > 0) {
    areas.push(
      `Only ${activity.activeChildrenRate}% of children participating in physical activity`,
    );
  }

  if (health.dentalUpToDateRate < 90) {
    areas.push(
      `Dental checks up to date for only ${health.dentalUpToDateRate}% of children`,
    );
  }

  if (health.annualHealthAssessmentRate < 100) {
    areas.push(
      `Annual health assessments not complete for all children — ${health.annualHealthAssessmentRate}% completed`,
    );
  }

  if (menu.childConsultationRate < 70 && menu.totalMenuPlans > 0) {
    areas.push(
      `Children consulted on menu planning in only ${menu.childConsultationRate}% of weeks`,
    );
  }

  if (menu.specialDietsCateredRate < 100 && menu.totalMenuPlans > 0) {
    areas.push(
      `Special dietary needs catered in only ${menu.specialDietsCateredRate}% of menu plans`,
    );
  }

  if (activity.totalActivities === 0) {
    areas.push(
      "No physical activity records — all children should have regular access to physical activity",
    );
  }

  return areas;
}

function generateActions(
  meal: MealQualityResult,
  activity: PhysicalActivityResult,
  health: HealthPromotionResult,
  menu: MenuPlanningResult,
): string[] {
  const actions: string[] = [];

  if (meal.dietaryComplianceRate < 90 && meal.totalMeals > 0) {
    actions.push(
      "Review and update all children's dietary profiles — ensure kitchen staff have current information",
    );
  }

  if (meal.totalMeals === 0) {
    actions.push(
      "URGENT: Implement meal recording system — Reg 7 requires attention to children's nutritional needs",
    );
  }

  if (activity.totalActivities === 0) {
    actions.push(
      "URGENT: Implement physical activity programme — all children need regular exercise per NHS guidelines",
    );
  }

  if (!activity.meetsNHSGuidelines && activity.totalActivities > 0) {
    actions.push(
      "Increase physical activity opportunities to meet NHS 60-minutes-per-day guideline",
    );
  }

  if (activity.activityVariety < 3 && activity.totalActivities > 0) {
    actions.push(
      "Broaden the range of physical activities — offer swimming, cycling, dance, team sports alongside current options",
    );
  }

  if (health.annualHealthAssessmentRate < 100) {
    actions.push(
      "Schedule outstanding annual health assessments — statutory requirement for looked after children",
    );
  }

  if (health.dentalUpToDateRate < 90) {
    actions.push(
      "Arrange dental appointments for children overdue — dental health is a priority health need",
    );
  }

  if (health.cookingSkillsRate < 50) {
    actions.push(
      "Develop cooking skills programme — involve children in meal preparation as part of independence planning",
    );
  }

  if (menu.totalMenuPlans === 0) {
    actions.push(
      "Implement weekly menu planning with child consultation — Reg 7 expects nutritious, varied meals",
    );
  }

  if (menu.culturalDiversityRate < 50 && menu.totalMenuPlans > 0) {
    actions.push(
      "Increase cultural diversity in menu planning — reflect children's cultural backgrounds through food choices",
    );
  }

  return actions;
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateNutritionHealthyLivingIntelligence(
  meals: MealRecord[],
  profiles: ChildDietaryProfile[],
  activities: PhysicalActivity[],
  healthRecords: HealthPromotion[],
  menuPlans: MenuPlan[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): NutritionHealthyLivingIntelligence {
  const childIds = [...new Set(profiles.map((p) => p.childId))];

  const mealResult = evaluateMealQuality(meals, profiles);
  const activityResult = evaluatePhysicalActivity(
    activities,
    childIds,
    periodStart,
    periodEnd,
  );
  const healthResult = evaluateHealthPromotion(healthRecords);
  const menuResult = evaluateMenuPlanning(menuPlans);

  const overallScore =
    mealResult.overallScore +
    activityResult.overallScore +
    healthResult.overallScore +
    menuResult.overallScore;

  const childProfiles = buildChildNutritionProfiles(
    profiles,
    meals,
    activities,
    healthRecords,
    periodStart,
    periodEnd,
  );

  const strengths = generateStrengths(
    mealResult,
    activityResult,
    healthResult,
    menuResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    mealResult,
    activityResult,
    healthResult,
    menuResult,
  );
  const actions = generateActions(
    mealResult,
    activityResult,
    healthResult,
    menuResult,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 6 — quality of care standard including health and wellbeing",
    "CHR 2015 Reg 7 — health and wellbeing standard for children's homes",
    "CHR 2015 Reg 14 — care planning standard including health needs",
    "NMS 7 — leisure activities to support physical and emotional wellbeing",
    "NMS 10 — enjoying and achieving with access to positive activities",
    "NICE PH11 — maternal and child nutrition guidance",
    "NICE CG43 — obesity prevention in children and young people",
    "UNCRC Article 24 — right to the highest attainable standard of health",
    "UNCRC Article 27 — right to an adequate standard of living",
    "SCCIF — inspection of health and wellbeing outcomes for children",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore: Math.min(overallScore, 100),
    rating: getRating(overallScore),
    mealQuality: mealResult,
    physicalActivity: activityResult,
    healthPromotion: healthResult,
    menuPlanning: menuResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
