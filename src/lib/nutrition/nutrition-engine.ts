// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Nutrition & Dietary Compliance Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// Regulatory framework:
//   CHR 2015 Reg 9      — Quality of care (nutrition, mealtimes)
//   CHR 2015 Reg 5      — Engaging with quality & purpose of care
//   CHR 2015 Reg 11     — Cultural/religious dietary needs
//   SCCIF               — "Children enjoy healthy, nutritious food"
//   UNCRC Article 24    — Right to the highest attainable standard of health
//   UNCRC Article 27    — Right to adequate standard of living
//   Eatwell Guide (PHE) — Government nutrition standards
//
// Key requirements:
//   1. Nutritious, well-balanced meals provided at regular times
//   2. Dietary requirements met (religious, medical, cultural, ethical)
//   3. Children involved in meal planning and preparation
//   4. Mealtimes used as positive social occasions
//   5. Special dietary needs properly documented and accommodated
//   6. Food safety compliance (hygiene ratings, storage, allergen management)
//   7. Snacks and drinks available between meals
//   8. Cooking skills taught as part of independence
//   9. No deprivation of food as punishment (Reg 19)
//   10. Fresh fruit and vegetables available daily
//
// Scoring breakdown (0–100):
//   Dietary needs accommodation:   25  — All needs documented and met
//   Meal quality & variety:        20  — Balanced, varied menu
//   Child involvement:             20  — Planning, preparation, choice
//   Food safety compliance:        15  — Allergens, storage, hygiene
//   Mealtime quality:              10  — Social experience, routine
//   Independence skills:           10  — Cooking skills development
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type DietaryRequirementType =
  | "halal"
  | "kosher"
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "dairy_free"
  | "nut_allergy"
  | "egg_allergy"
  | "soy_allergy"
  | "shellfish_allergy"
  | "diabetic"
  | "low_sugar"
  | "lactose_intolerant"
  | "cultural_preference"
  | "medical_diet"
  | "other_allergy";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodGroup =
  | "fruit_vegetables"
  | "carbohydrates"
  | "protein"
  | "dairy_alternatives"
  | "fats_oils";

export type MealtimeQualityFactor =
  | "staff_ate_with_children"
  | "positive_conversation"
  | "children_helped_set_table"
  | "children_helped_cook"
  | "children_chose_menu"
  | "no_rushing"
  | "cultural_celebration_meal"
  | "family_style_serving";

export type CookingSkillLevel = 1 | 2 | 3 | 4 | 5;
// 1 = No experience, 2 = Can prepare simple snacks,
// 3 = Can cook basic meals with support, 4 = Can cook independently,
// 5 = Confident cook (multiple cuisines)

// ── Data Models ───────────────────────────────────────────────────────────────

export interface NutritionChild {
  id: string;
  name: string;
  dateOfBirth: string;
  currentPlacement: boolean;
  dietaryRequirements: DietaryRequirementType[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
  cookingSkillLevel: CookingSkillLevel;
}

export interface MealRecord {
  id: string;
  date: string;
  mealType: MealType;
  description: string;
  foodGroupsCovered: FoodGroup[];
  freshFruitVegIncluded: boolean;
  dietaryRequirementsMet: boolean;
  allergensSafelyManaged: boolean;
  childrenPresent: string[]; // childIds
  qualityFactors: MealtimeQualityFactor[];
  notes?: string;
}

export interface MenuPlan {
  id: string;
  weekCommencing: string;
  createdBy: string;
  childrenContributed: boolean;
  contributingChildIds: string[];
  mealsPlanned: number;
  dietaryVariety: number; // unique dishes across the week
  culturalMealsIncluded: number;
  freshCookingDays: number; // vs. ready meals
  totalDays: number;
}

export interface FoodSafetyRecord {
  id: string;
  date: string;
  checkType:
    | "fridge_temperature"
    | "freezer_temperature"
    | "food_hygiene_audit"
    | "allergen_labelling"
    | "use_by_date_check"
    | "cleaning_schedule"
    | "hand_hygiene";
  compliant: boolean;
  correctionNeeded?: string;
  correctedDate?: string;
}

export interface CookingSession {
  id: string;
  date: string;
  childId: string;
  description: string;
  skillsPractised: string[];
  supportLevel: "full_support" | "some_support" | "independent";
  childEngaged: boolean;
  childInitiated: boolean;
  linkedToIndependencePlan: boolean;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface DietaryAccommodationResult {
  totalChildren: number;
  childrenWithRequirements: number;
  requirementsMet: number;
  requirementsNotMet: number;
  metRate: number;
  allergyManagementRate: number;
  requirementBreakdown: { type: DietaryRequirementType; count: number }[];
}

export interface MealQualityResult {
  totalMeals: number;
  mealsPerDay: number;
  freshFruitVegRate: number;
  averageFoodGroupsCovered: number;
  varietyScore: number; // unique dishes / total meals × 100
  culturalMealRate: number;
  freshCookingRate: number;
  qualityFactorFrequency: { factor: MealtimeQualityFactor; count: number; rate: number }[];
}

export interface ChildInvolvementResult {
  menuContributionRate: number;
  cookingSessionsTotal: number;
  cookingSessionsPerChild: number;
  childInitiatedRate: number;
  engagementRate: number;
  staffAteWithChildrenRate: number;
  childrenHelpedCookRate: number;
  childrenChoseMenuRate: number;
}

export interface FoodSafetyResult {
  totalChecks: number;
  compliantChecks: number;
  complianceRate: number;
  correctionsNeeded: number;
  correctionsMade: number;
  correctionRate: number;
  checkTypeBreakdown: { checkType: string; total: number; compliant: number }[];
}

export interface ChildNutritionProfile {
  childId: string;
  childName: string;
  dietaryRequirements: DietaryRequirementType[];
  allergies: string[];
  requirementsMet: boolean;
  mealsAttended: number;
  cookingSessions: number;
  cookingSkillLevel: CookingSkillLevel;
  cookingSkillProgress: boolean;
  menuContributions: number;
  primaryConcern?: string;
}

export interface NutritionIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  dietaryAccommodation: DietaryAccommodationResult;
  mealQuality: MealQualityResult;
  childInvolvement: ChildInvolvementResult;
  foodSafety: FoodSafetyResult;
  childProfiles: ChildNutritionProfile[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Labels ────────────────────────────────────────────────────────────────────

const DIETARY_LABELS: Record<DietaryRequirementType, string> = {
  halal: "Halal",
  kosher: "Kosher",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  gluten_free: "Gluten Free",
  dairy_free: "Dairy Free",
  nut_allergy: "Nut Allergy",
  egg_allergy: "Egg Allergy",
  soy_allergy: "Soy Allergy",
  shellfish_allergy: "Shellfish Allergy",
  diabetic: "Diabetic Diet",
  low_sugar: "Low Sugar",
  lactose_intolerant: "Lactose Intolerant",
  cultural_preference: "Cultural Preference",
  medical_diet: "Medical Diet",
  other_allergy: "Other Allergy",
};

const QUALITY_FACTOR_LABELS: Record<MealtimeQualityFactor, string> = {
  staff_ate_with_children: "Staff Ate with Children",
  positive_conversation: "Positive Conversation",
  children_helped_set_table: "Children Set Table",
  children_helped_cook: "Children Helped Cook",
  children_chose_menu: "Children Chose Menu",
  no_rushing: "No Rushing",
  cultural_celebration_meal: "Cultural Celebration Meal",
  family_style_serving: "Family-Style Serving",
};

export function getDietaryLabel(d: DietaryRequirementType): string {
  return DIETARY_LABELS[d] ?? d.replace(/_/g, " ");
}

export function getQualityFactorLabel(f: MealtimeQualityFactor): string {
  return QUALITY_FACTOR_LABELS[f] ?? f.replace(/_/g, " ");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

// ── Core Functions ────────────────────────────────────────────────────────────

export function evaluateDietaryAccommodation(
  children: NutritionChild[],
  meals: MealRecord[],
  periodStart: string,
  periodEnd: string,
): DietaryAccommodationResult {
  const placed = children.filter((c) => c.currentPlacement);
  const totalChildren = placed.length;
  const childrenWithRequirements = placed.filter(
    (c) => c.dietaryRequirements.length > 0 || c.allergies.length > 0,
  ).length;

  const periodMeals = meals.filter((m) => inPeriod(m.date, periodStart, periodEnd));

  // Check dietary requirements met across meals
  const mealsWithRequirements = periodMeals.filter(
    (m) =>
      m.childrenPresent.some((cid) => {
        const child = placed.find((c) => c.id === cid);
        return child && (child.dietaryRequirements.length > 0 || child.allergies.length > 0);
      }),
  );
  const requirementsMet = mealsWithRequirements.filter(
    (m) => m.dietaryRequirementsMet,
  ).length;
  const requirementsNotMet = mealsWithRequirements.length - requirementsMet;
  const metRate = pct(requirementsMet, mealsWithRequirements.length);

  // Allergen management
  const mealsWithAllergens = periodMeals.filter(
    (m) =>
      m.childrenPresent.some((cid) => {
        const child = placed.find((c) => c.id === cid);
        return child && child.allergies.length > 0;
      }),
  );
  const allergenSafe = mealsWithAllergens.filter(
    (m) => m.allergensSafelyManaged,
  ).length;
  const allergyManagementRate = pct(allergenSafe, mealsWithAllergens.length);

  // Requirement breakdown
  const reqCounts = new Map<DietaryRequirementType, number>();
  for (const child of placed) {
    for (const req of child.dietaryRequirements) {
      reqCounts.set(req, (reqCounts.get(req) ?? 0) + 1);
    }
  }
  const requirementBreakdown = Array.from(reqCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalChildren,
    childrenWithRequirements,
    requirementsMet,
    requirementsNotMet,
    metRate,
    allergyManagementRate,
    requirementBreakdown,
  };
}

export function evaluateMealQuality(
  meals: MealRecord[],
  menuPlans: MenuPlan[],
  periodStart: string,
  periodEnd: string,
): MealQualityResult {
  const periodMeals = meals.filter((m) => inPeriod(m.date, periodStart, periodEnd));
  const totalMeals = periodMeals.length;

  const periodDays = Math.max(
    1,
    Math.floor(
      (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) /
        86_400_000,
    ),
  );
  const mealsPerDay = totalMeals === 0 ? 0 : Math.round((totalMeals / periodDays) * 10) / 10;

  const freshFruitVeg = periodMeals.filter(
    (m) => m.freshFruitVegIncluded,
  ).length;
  const freshFruitVegRate = pct(freshFruitVeg, totalMeals);

  const totalFoodGroups = periodMeals.reduce(
    (sum, m) => sum + m.foodGroupsCovered.length,
    0,
  );
  const averageFoodGroupsCovered =
    totalMeals === 0
      ? 0
      : Math.round((totalFoodGroups / totalMeals) * 10) / 10;

  // Variety — unique descriptions (rough proxy for variety)
  const uniqueDescriptions = new Set(
    periodMeals.map((m) => m.description.toLowerCase().trim()),
  );
  const varietyScore = pct(uniqueDescriptions.size, totalMeals);

  // Menu plans: cultural meals and fresh cooking
  const periodPlans = menuPlans.filter((p) =>
    inPeriod(p.weekCommencing, periodStart, periodEnd),
  );
  const totalCulturalMeals = periodPlans.reduce(
    (sum, p) => sum + p.culturalMealsIncluded,
    0,
  );
  const totalPlannedMeals = periodPlans.reduce(
    (sum, p) => sum + p.mealsPlanned,
    0,
  );
  const culturalMealRate = pct(totalCulturalMeals, totalPlannedMeals);

  const totalFreshDays = periodPlans.reduce(
    (sum, p) => sum + p.freshCookingDays,
    0,
  );
  const totalPlanDays = periodPlans.reduce(
    (sum, p) => sum + p.totalDays,
    0,
  );
  const freshCookingRate = pct(totalFreshDays, totalPlanDays);

  // Quality factor frequency
  const factorCounts = new Map<MealtimeQualityFactor, number>();
  for (const m of periodMeals) {
    for (const f of m.qualityFactors) {
      factorCounts.set(f, (factorCounts.get(f) ?? 0) + 1);
    }
  }
  const qualityFactorFrequency = Array.from(factorCounts.entries())
    .map(([factor, count]) => ({
      factor,
      count,
      rate: pct(count, totalMeals),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalMeals,
    mealsPerDay,
    freshFruitVegRate,
    averageFoodGroupsCovered,
    varietyScore,
    culturalMealRate,
    freshCookingRate,
    qualityFactorFrequency,
  };
}

export function evaluateChildInvolvement(
  children: NutritionChild[],
  meals: MealRecord[],
  menuPlans: MenuPlan[],
  cookingSessions: CookingSession[],
  periodStart: string,
  periodEnd: string,
): ChildInvolvementResult {
  const placed = children.filter((c) => c.currentPlacement);
  const periodMeals = meals.filter((m) => inPeriod(m.date, periodStart, periodEnd));
  const periodPlans = menuPlans.filter((p) =>
    inPeriod(p.weekCommencing, periodStart, periodEnd),
  );
  const periodSessions = cookingSessions.filter(
    (s) =>
      inPeriod(s.date, periodStart, periodEnd) &&
      placed.some((c) => c.id === s.childId),
  );

  // Menu contribution rate
  const plansWithContribution = periodPlans.filter(
    (p) => p.childrenContributed,
  ).length;
  const menuContributionRate = pct(plansWithContribution, periodPlans.length);

  // Cooking sessions
  const cookingSessionsTotal = periodSessions.length;
  const cookingSessionsPerChild =
    placed.length === 0
      ? 0
      : Math.round((cookingSessionsTotal / placed.length) * 10) / 10;
  const childInitiated = periodSessions.filter(
    (s) => s.childInitiated,
  ).length;
  const childInitiatedRate = pct(childInitiated, cookingSessionsTotal);
  const engaged = periodSessions.filter((s) => s.childEngaged).length;
  const engagementRate = pct(engaged, cookingSessionsTotal);

  // Staff ate with children
  const staffAteWithChildren = periodMeals.filter((m) =>
    m.qualityFactors.includes("staff_ate_with_children"),
  ).length;
  const staffAteWithChildrenRate = pct(
    staffAteWithChildren,
    periodMeals.length,
  );

  // Children helped cook
  const childrenHelpedCook = periodMeals.filter((m) =>
    m.qualityFactors.includes("children_helped_cook"),
  ).length;
  const childrenHelpedCookRate = pct(childrenHelpedCook, periodMeals.length);

  // Children chose menu
  const childrenChoseMenu = periodMeals.filter((m) =>
    m.qualityFactors.includes("children_chose_menu"),
  ).length;
  const childrenChoseMenuRate = pct(childrenChoseMenu, periodMeals.length);

  return {
    menuContributionRate,
    cookingSessionsTotal,
    cookingSessionsPerChild,
    childInitiatedRate,
    engagementRate,
    staffAteWithChildrenRate,
    childrenHelpedCookRate,
    childrenChoseMenuRate,
  };
}

export function evaluateFoodSafety(
  checks: FoodSafetyRecord[],
  periodStart: string,
  periodEnd: string,
): FoodSafetyResult {
  const periodChecks = checks.filter((c) =>
    inPeriod(c.date, periodStart, periodEnd),
  );
  const totalChecks = periodChecks.length;
  const compliantChecks = periodChecks.filter((c) => c.compliant).length;
  const complianceRate = pct(compliantChecks, totalChecks);

  const correctionsNeeded = periodChecks.filter(
    (c) => !c.compliant,
  ).length;
  const correctionsMade = periodChecks.filter(
    (c) => !c.compliant && c.correctedDate,
  ).length;
  const correctionRate = pct(correctionsMade, correctionsNeeded);

  // Check type breakdown
  const typeMap = new Map<string, { total: number; compliant: number }>();
  for (const c of periodChecks) {
    const existing = typeMap.get(c.checkType) ?? { total: 0, compliant: 0 };
    typeMap.set(c.checkType, {
      total: existing.total + 1,
      compliant: existing.compliant + (c.compliant ? 1 : 0),
    });
  }
  const checkTypeBreakdown = Array.from(typeMap.entries())
    .map(([checkType, { total, compliant }]) => ({
      checkType,
      total,
      compliant,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalChecks,
    compliantChecks,
    complianceRate,
    correctionsNeeded,
    correctionsMade,
    correctionRate,
    checkTypeBreakdown,
  };
}

export function buildChildNutritionProfiles(
  children: NutritionChild[],
  meals: MealRecord[],
  menuPlans: MenuPlan[],
  cookingSessions: CookingSession[],
  periodStart: string,
  periodEnd: string,
): ChildNutritionProfile[] {
  const placed = children.filter((c) => c.currentPlacement);
  const periodMeals = meals.filter((m) => inPeriod(m.date, periodStart, periodEnd));
  const periodPlans = menuPlans.filter((p) =>
    inPeriod(p.weekCommencing, periodStart, periodEnd),
  );
  const periodSessions = cookingSessions.filter((s) =>
    inPeriod(s.date, periodStart, periodEnd),
  );

  return placed.map((child) => {
    const mealsAttended = periodMeals.filter((m) =>
      m.childrenPresent.includes(child.id),
    ).length;

    // Were dietary requirements met for this child?
    const childMeals = periodMeals.filter((m) =>
      m.childrenPresent.includes(child.id),
    );
    const requirementsMet =
      child.dietaryRequirements.length === 0 && child.allergies.length === 0
        ? true
        : childMeals.length === 0
          ? true
          : childMeals.every(
              (m) => m.dietaryRequirementsMet && m.allergensSafelyManaged,
            );

    const childSessions = periodSessions.filter(
      (s) => s.childId === child.id,
    );
    const cookingSes = childSessions.length;

    // Cooking skill progress — any session at higher support level than before
    const cookingSkillProgress =
      childSessions.some((s) => s.supportLevel === "independent") ||
      (childSessions.length >= 3 &&
        childSessions.filter((s) => s.childEngaged).length ===
          childSessions.length);

    // Menu contributions
    const menuContributions = periodPlans.filter((p) =>
      p.contributingChildIds.includes(child.id),
    ).length;

    // Primary concern
    let primaryConcern: string | undefined;
    if (!requirementsMet) {
      primaryConcern = "Dietary requirements not consistently met";
    } else if (
      child.allergies.length > 0 &&
      childMeals.some((m) => !m.allergensSafelyManaged)
    ) {
      primaryConcern = "Allergen management failure detected";
    } else if (cookingSes === 0 && child.cookingSkillLevel <= 2) {
      primaryConcern = "No cooking skills sessions — independence gap";
    } else if (mealsAttended === 0) {
      primaryConcern = "No meal attendance recorded in period";
    }

    return {
      childId: child.id,
      childName: child.name,
      dietaryRequirements: child.dietaryRequirements,
      allergies: child.allergies,
      requirementsMet,
      mealsAttended,
      cookingSessions: cookingSes,
      cookingSkillLevel: child.cookingSkillLevel,
      cookingSkillProgress,
      menuContributions,
      primaryConcern,
    };
  });
}

// ── Main Intelligence Function ────────────────────────────────────────────────

export function generateNutritionIntelligence(
  children: NutritionChild[],
  meals: MealRecord[],
  menuPlans: MenuPlan[],
  foodSafetyChecks: FoodSafetyRecord[],
  cookingSessions: CookingSession[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): NutritionIntelligenceResult {
  const dietaryAccommodation = evaluateDietaryAccommodation(
    children, meals, periodStart, periodEnd,
  );
  const mealQuality = evaluateMealQuality(
    meals, menuPlans, periodStart, periodEnd,
  );
  const childInvolvement = evaluateChildInvolvement(
    children, meals, menuPlans, cookingSessions, periodStart, periodEnd,
  );
  const foodSafety = evaluateFoodSafety(
    foodSafetyChecks, periodStart, periodEnd,
  );
  const childProfiles = buildChildNutritionProfiles(
    children, meals, menuPlans, cookingSessions, periodStart, periodEnd,
  );

  // ── Scoring ──────────────────────────────────────────────────────────────

  // 1. Dietary needs accommodation (25)
  let dietaryScore = 0;
  if (dietaryAccommodation.metRate === 100) dietaryScore += 15;
  else if (dietaryAccommodation.metRate >= 90) dietaryScore += 12;
  else if (dietaryAccommodation.metRate >= 75) dietaryScore += 8;
  else if (dietaryAccommodation.metRate >= 50) dietaryScore += 4;

  if (dietaryAccommodation.allergyManagementRate === 100) dietaryScore += 10;
  else if (dietaryAccommodation.allergyManagementRate >= 90) dietaryScore += 7;
  else if (dietaryAccommodation.allergyManagementRate >= 75) dietaryScore += 4;
  dietaryScore = Math.min(dietaryScore, 25);

  // 2. Meal quality (20)
  let qualityScore = 0;
  if (mealQuality.freshFruitVegRate >= 80) qualityScore += 5;
  else if (mealQuality.freshFruitVegRate >= 60) qualityScore += 3;

  if (mealQuality.averageFoodGroupsCovered >= 3.5) qualityScore += 5;
  else if (mealQuality.averageFoodGroupsCovered >= 2.5) qualityScore += 3;

  if (mealQuality.varietyScore >= 60) qualityScore += 4;
  else if (mealQuality.varietyScore >= 40) qualityScore += 2;

  if (mealQuality.freshCookingRate >= 80) qualityScore += 3;
  else if (mealQuality.freshCookingRate >= 60) qualityScore += 2;

  if (mealQuality.culturalMealRate >= 10) qualityScore += 3;
  else if (mealQuality.culturalMealRate >= 5) qualityScore += 1;

  qualityScore = Math.min(qualityScore, 20);

  // 3. Child involvement (20)
  let involvementScore = 0;
  if (childInvolvement.menuContributionRate >= 80) involvementScore += 5;
  else if (childInvolvement.menuContributionRate >= 50) involvementScore += 3;

  if (childInvolvement.staffAteWithChildrenRate >= 60) involvementScore += 4;
  else if (childInvolvement.staffAteWithChildrenRate >= 30) involvementScore += 2;

  if (childInvolvement.childrenHelpedCookRate >= 20) involvementScore += 3;
  else if (childInvolvement.childrenHelpedCookRate >= 10) involvementScore += 1;

  if (childInvolvement.cookingSessionsPerChild >= 3) involvementScore += 4;
  else if (childInvolvement.cookingSessionsPerChild >= 1) involvementScore += 2;

  if (childInvolvement.engagementRate >= 80) involvementScore += 4;
  else if (childInvolvement.engagementRate >= 60) involvementScore += 2;

  involvementScore = Math.min(involvementScore, 20);

  // 4. Food safety (15)
  let safetyScore = 0;
  if (foodSafety.complianceRate === 100) safetyScore += 10;
  else if (foodSafety.complianceRate >= 90) safetyScore += 7;
  else if (foodSafety.complianceRate >= 75) safetyScore += 4;

  if (foodSafety.correctionRate === 100 || foodSafety.correctionsNeeded === 0)
    safetyScore += 5;
  else if (foodSafety.correctionRate >= 80) safetyScore += 3;

  safetyScore = Math.min(safetyScore, 15);

  // 5. Mealtime quality (10)
  let mealtimeScore = 0;
  const positiveConvoRate =
    mealQuality.qualityFactorFrequency.find(
      (f) => f.factor === "positive_conversation",
    )?.rate ?? 0;
  if (positiveConvoRate >= 60) mealtimeScore += 4;
  else if (positiveConvoRate >= 30) mealtimeScore += 2;

  const familyStyleRate =
    mealQuality.qualityFactorFrequency.find(
      (f) => f.factor === "family_style_serving",
    )?.rate ?? 0;
  if (familyStyleRate >= 50) mealtimeScore += 3;
  else if (familyStyleRate >= 25) mealtimeScore += 1;

  const noRushingRate =
    mealQuality.qualityFactorFrequency.find(
      (f) => f.factor === "no_rushing",
    )?.rate ?? 0;
  if (noRushingRate >= 70) mealtimeScore += 3;
  else if (noRushingRate >= 40) mealtimeScore += 1;

  mealtimeScore = Math.min(mealtimeScore, 10);

  // 6. Independence (10)
  let independenceScore = 0;
  if (childInvolvement.cookingSessionsPerChild >= 4) independenceScore += 5;
  else if (childInvolvement.cookingSessionsPerChild >= 2) independenceScore += 3;
  else if (childInvolvement.cookingSessionsPerChild >= 1) independenceScore += 1;

  const skillProgress = childProfiles.filter(
    (p) => p.cookingSkillProgress,
  ).length;
  if (skillProgress === childProfiles.length && childProfiles.length > 0)
    independenceScore += 5;
  else if (skillProgress > 0) independenceScore += 3;

  independenceScore = Math.min(independenceScore, 10);

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      dietaryScore +
        qualityScore +
        involvementScore +
        safetyScore +
        mealtimeScore +
        independenceScore,
    ),
  );

  const rating: NutritionIntelligenceResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ─────────────────────────────────────────
  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  if (dietaryAccommodation.metRate === 100) {
    strengths.push("All dietary requirements consistently met");
  }
  if (dietaryAccommodation.allergyManagementRate === 100) {
    strengths.push("Excellent allergen management — 100% compliance");
  }
  if (mealQuality.freshFruitVegRate >= 80) {
    strengths.push("Fresh fruit and vegetables included in majority of meals");
  }
  if (childInvolvement.menuContributionRate >= 80) {
    strengths.push("Children regularly contribute to menu planning");
  }
  if (childInvolvement.staffAteWithChildrenRate >= 60) {
    strengths.push("Staff regularly eat meals with children — positive social model");
  }
  if (foodSafety.complianceRate === 100) {
    strengths.push("Perfect food safety compliance record");
  }
  if (mealQuality.culturalMealRate >= 10) {
    strengths.push("Cultural meals regularly included in menu");
  }
  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — nutrition improvement needed");
  }

  if (dietaryAccommodation.requirementsNotMet > 0) {
    areasForDevelopment.push(
      `${dietaryAccommodation.requirementsNotMet} meal${dietaryAccommodation.requirementsNotMet !== 1 ? "s" : ""} did not meet dietary requirements`,
    );
  }
  if (mealQuality.freshFruitVegRate < 60) {
    areasForDevelopment.push(
      `Fresh fruit/veg included in only ${mealQuality.freshFruitVegRate}% of meals (target: 80%+)`,
    );
  }
  if (childInvolvement.cookingSessionsPerChild < 2) {
    areasForDevelopment.push("Increase cooking skills sessions for independence development");
  }
  if (foodSafety.complianceRate < 90) {
    areasForDevelopment.push(
      `Food safety compliance at ${foodSafety.complianceRate}% — target 100%`,
    );
  }
  if (childInvolvement.menuContributionRate < 50) {
    areasForDevelopment.push("Increase children's involvement in menu planning");
  }
  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified");
  }

  // Immediate actions
  const allergenFailures = childProfiles.filter(
    (p) => p.allergies.length > 0 && !p.requirementsMet,
  );
  if (allergenFailures.length > 0) {
    immediateActions.push(
      `URGENT: Allergen management failure for ${allergenFailures.map((p) => p.childName).join(", ")} — review allergen protocols immediately`,
    );
  }
  if (dietaryAccommodation.metRate < 80) {
    immediateActions.push(
      "HIGH: Dietary requirements not consistently met — review meal planning processes",
    );
  }
  if (foodSafety.complianceRate < 80) {
    immediateActions.push(
      "HIGH: Food safety compliance below acceptable threshold — conduct full kitchen audit",
    );
  }
  const noSessions = childProfiles.filter(
    (p) => p.cookingSessions === 0 && p.cookingSkillLevel <= 2,
  );
  if (noSessions.length > 0) {
    immediateActions.push(
      `MEDIUM: Schedule cooking sessions for ${noSessions.map((p) => p.childName).join(", ")} — independence skills gap`,
    );
  }
  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — nutrition standards are well maintained",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 9 — Quality of care (nutritious food, mealtimes)",
    "CHR 2015 Reg 11 — Cultural, religious and linguistic dietary needs",
    "CHR 2015 Reg 19 — No deprivation of food as punishment",
    "UNCRC Article 24 — Right to highest attainable standard of health",
    "Eatwell Guide (PHE) — Government nutrition standards",
    "Food Safety Act 1990 — Safe food handling and storage",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    dietaryAccommodation,
    mealQuality,
    childInvolvement,
    foodSafety,
    childProfiles,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
