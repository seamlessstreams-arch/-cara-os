// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Menu Planning & Nutrition Intelligence Engine
//
// Evaluates weekly menu quality, child satisfaction with meals, child
// involvement in food-related activities, and nutrition audit compliance
// for children in residential care.
//
// Regulatory basis:
//   - CHR 2015 Reg 10 (the health and wellbeing standard — nutrition)
//   - SCCIF (Social Care Common Inspection Framework — health outcomes)
//   - NMS 4 (National Minimum Standards — food and nutrition)
//   - Food Standards Agency guidance (food safety and nutrition in care)
//   - Eatwell Guide 2016 (balanced diet guidance)
//   - UNCRC Article 24 (right to the highest attainable standard of health)
//   - UNCRC Article 27 (right to an adequate standard of living)
//
// Pure deterministic engine — no AI, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Definitions ─────────────────────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "supper";

export type NutritionalBalance = "excellent" | "good" | "adequate" | "poor";

export type CulturalAccommodation =
  | "fully_met"
  | "partially_met"
  | "not_met"
  | "not_applicable";

export type MenuVariety = "highly_varied" | "varied" | "limited" | "repetitive";

export type ChildParticipation =
  | "menu_planning"
  | "cooking_activity"
  | "food_shopping"
  | "growing_food"
  | "none";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface WeeklyMenu {
  id: string;
  weekCommencing: string;
  mealsPlanned: number;
  mealsServed: number;
  nutritionalBalance: NutritionalBalance;
  culturalAccommodation: CulturalAccommodation;
  childrenConsulted: boolean;
  menuVariety: MenuVariety;
  specialDietaryMet: boolean;
}

export interface MealFeedback {
  id: string;
  menuId: string;
  childId: string;
  childName: string;
  mealType: MealType;
  enjoymentRating: number; // 1-5
  portionSatisfactory: boolean;
  comments: string | null;
}

export interface ChildParticipationRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  participationType: ChildParticipation;
  staffSupported: string;
  childEnjoyed: boolean;
}

export interface NutritionAudit {
  id: string;
  auditDate: string;
  auditor: string;
  fiveADayEvidence: boolean;
  sugarLimitsFollowed: boolean;
  freshFoodUsed: boolean;
  portionGuidanceFollowed: boolean;
  overallCompliant: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface MenuQualityResult {
  overallScore: number; // 0-25
  totalMenus: number;
  nutritionalBalanceRate: number;
  varietyRate: number;
  culturalAccommodationRate: number;
  childrenConsultedRate: number;
  specialDietaryMetRate: number;
}

export interface ChildSatisfactionResult {
  overallScore: number; // 0-25
  totalFeedback: number;
  averageEnjoyment: number;
  portionSatisfactoryRate: number;
  positiveFeedbackRate: number;
  responseRate: number;
}

export interface ChildInvolvementResult {
  overallScore: number; // 0-25
  totalRecords: number;
  participationRate: number;
  activityVariety: number;
  childEnjoyedRate: number;
  cookingActivityRate: number;
  staffSupportRate: number;
}

export interface NutritionComplianceResult {
  overallScore: number; // 0-25
  totalAudits: number;
  fiveADayRate: number;
  freshFoodRate: number;
  sugarLimitsRate: number;
  portionGuidanceRate: number;
  overallCompliantRate: number;
}

export interface ChildNutritionProfile {
  childId: string;
  childName: string;
  averageEnjoyment: number;
  feedbackCount: number;
  portionSatisfactoryRate: number;
  participationCount: number;
  overallScore: number; // 0-10
}

export interface MenuPlanningNutritionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  menuQuality: MenuQualityResult;
  childSatisfaction: ChildSatisfactionResult;
  childInvolvement: ChildInvolvementResult;
  nutritionCompliance: NutritionComplianceResult;
  childProfiles: ChildNutritionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Maps ───────────────────────────────────────────────────────────────

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  supper: "Supper",
};

const NUTRITIONAL_BALANCE_LABELS: Record<NutritionalBalance, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
};

const CULTURAL_ACCOMMODATION_LABELS: Record<CulturalAccommodation, string> = {
  fully_met: "Fully Met",
  partially_met: "Partially Met",
  not_met: "Not Met",
  not_applicable: "Not Applicable",
};

const MENU_VARIETY_LABELS: Record<MenuVariety, string> = {
  highly_varied: "Highly Varied",
  varied: "Varied",
  limited: "Limited",
  repetitive: "Repetitive",
};

const CHILD_PARTICIPATION_LABELS: Record<ChildParticipation, string> = {
  menu_planning: "Menu Planning",
  cooking_activity: "Cooking Activity",
  food_shopping: "Food Shopping",
  growing_food: "Growing Food",
  none: "None",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getMealTypeLabel(t: MealType): string {
  return MEAL_TYPE_LABELS[t] ?? t;
}

export function getNutritionalBalanceLabel(b: NutritionalBalance): string {
  return NUTRITIONAL_BALANCE_LABELS[b] ?? b;
}

export function getCulturalAccommodationLabel(c: CulturalAccommodation): string {
  return CULTURAL_ACCOMMODATION_LABELS[c] ?? c;
}

export function getMenuVarietyLabel(v: MenuVariety): string {
  return MENU_VARIETY_LABELS[v] ?? v;
}

export function getChildParticipationLabel(p: ChildParticipation): string {
  return CHILD_PARTICIPATION_LABELS[p] ?? p;
}

export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r] ?? r;
}

// ── Utility ──────────────────────────────────────────────────────────────────

export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Menu Quality (0-25) ────────────────────────────────────────

/**
 * Evaluates the quality of weekly menus.
 *
 * Scoring breakdown:
 *   - Nutritional balance excellent/good rate: 0-7
 *   - Menu variety (highly varied / varied rate): 0-6
 *   - Cultural accommodation (fully met rate): 0-5
 *   - Children consulted rate: 0-4
 *   - Special dietary needs met rate: 0-3
 */
export function evaluateMenuQuality(menus: WeeklyMenu[]): MenuQualityResult {
  if (menus.length === 0) {
    return {
      overallScore: 0,
      totalMenus: 0,
      nutritionalBalanceRate: 0,
      varietyRate: 0,
      culturalAccommodationRate: 0,
      childrenConsultedRate: 0,
      specialDietaryMetRate: 0,
    };
  }

  let score = 0;
  const total = menus.length;

  // Nutritional balance: % of menus rated excellent or good (0-7)
  const nutritionalGood = menus.filter(
    (m) => m.nutritionalBalance === "excellent" || m.nutritionalBalance === "good",
  ).length;
  const nutritionalBalanceRate = pct(nutritionalGood, total);
  if (nutritionalBalanceRate >= 90) score += 7;
  else if (nutritionalBalanceRate >= 75) score += 5;
  else if (nutritionalBalanceRate >= 50) score += 3;
  else if (nutritionalBalanceRate > 0) score += 1;

  // Variety: % of menus rated highly_varied or varied (0-6)
  const varied = menus.filter(
    (m) => m.menuVariety === "highly_varied" || m.menuVariety === "varied",
  ).length;
  const varietyRate = pct(varied, total);
  if (varietyRate >= 90) score += 6;
  else if (varietyRate >= 75) score += 4;
  else if (varietyRate >= 50) score += 2;
  else if (varietyRate > 0) score += 1;

  // Cultural accommodation: % fully met (excluding not_applicable) (0-5)
  const applicable = menus.filter(
    (m) => m.culturalAccommodation !== "not_applicable",
  );
  const fullyMet = applicable.filter(
    (m) => m.culturalAccommodation === "fully_met",
  ).length;
  const culturalAccommodationRate = pct(fullyMet, applicable.length);
  if (culturalAccommodationRate >= 90) score += 5;
  else if (culturalAccommodationRate >= 75) score += 3;
  else if (culturalAccommodationRate >= 50) score += 2;
  else if (culturalAccommodationRate > 0) score += 1;

  // Children consulted (0-4)
  const consulted = menus.filter((m) => m.childrenConsulted).length;
  const childrenConsultedRate = pct(consulted, total);
  if (childrenConsultedRate >= 90) score += 4;
  else if (childrenConsultedRate >= 75) score += 3;
  else if (childrenConsultedRate >= 50) score += 2;
  else if (childrenConsultedRate > 0) score += 1;

  // Special dietary met (0-3)
  const specialMet = menus.filter((m) => m.specialDietaryMet).length;
  const specialDietaryMetRate = pct(specialMet, total);
  if (specialDietaryMetRate >= 100) score += 3;
  else if (specialDietaryMetRate >= 80) score += 2;
  else if (specialDietaryMetRate >= 50) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalMenus: total,
    nutritionalBalanceRate,
    varietyRate,
    culturalAccommodationRate,
    childrenConsultedRate,
    specialDietaryMetRate,
  };
}

// ── Evaluator 2: Child Satisfaction (0-25) ──────────────────────────────────

/**
 * Evaluates child satisfaction from meal feedback.
 *
 * Scoring breakdown:
 *   - Average enjoyment score (0-8)
 *   - Portion satisfactory rate (0-6)
 *   - Positive feedback rate (comments that are non-null/non-empty) (0-5)
 *   - Response rate / coverage (0-6)
 */
export function evaluateChildSatisfaction(
  feedback: MealFeedback[],
  totalChildCount: number,
): ChildSatisfactionResult {
  if (feedback.length === 0) {
    return {
      overallScore: 0,
      totalFeedback: 0,
      averageEnjoyment: 0,
      portionSatisfactoryRate: 0,
      positiveFeedbackRate: 0,
      responseRate: 0,
    };
  }

  let score = 0;

  // Average enjoyment (1-5 scale) -> (0-8)
  const totalEnjoyment = feedback.reduce((sum, f) => sum + f.enjoymentRating, 0);
  const averageEnjoyment = Math.round((totalEnjoyment / feedback.length) * 10) / 10;
  if (averageEnjoyment >= 4.5) score += 8;
  else if (averageEnjoyment >= 4.0) score += 6;
  else if (averageEnjoyment >= 3.5) score += 4;
  else if (averageEnjoyment >= 3.0) score += 2;
  else if (averageEnjoyment >= 2.0) score += 1;

  // Portion satisfactory (0-6)
  const portionOk = feedback.filter((f) => f.portionSatisfactory).length;
  const portionSatisfactoryRate = pct(portionOk, feedback.length);
  if (portionSatisfactoryRate >= 90) score += 6;
  else if (portionSatisfactoryRate >= 75) score += 4;
  else if (portionSatisfactoryRate >= 50) score += 2;
  else if (portionSatisfactoryRate > 0) score += 1;

  // Positive feedback rate (comments provided and non-empty) (0-5)
  const withComments = feedback.filter(
    (f) => f.comments !== null && f.comments.trim().length > 0,
  ).length;
  const positiveFeedbackRate = pct(withComments, feedback.length);
  if (positiveFeedbackRate >= 80) score += 5;
  else if (positiveFeedbackRate >= 60) score += 3;
  else if (positiveFeedbackRate >= 30) score += 2;
  else if (positiveFeedbackRate > 0) score += 1;

  // Response rate / coverage: unique children who gave feedback vs total (0-6)
  const uniqueChildren = new Set(feedback.map((f) => f.childId)).size;
  const responseRate = pct(uniqueChildren, totalChildCount);
  if (responseRate >= 100) score += 6;
  else if (responseRate >= 80) score += 4;
  else if (responseRate >= 50) score += 2;
  else if (responseRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalFeedback: feedback.length,
    averageEnjoyment,
    portionSatisfactoryRate,
    positiveFeedbackRate,
    responseRate,
  };
}

// ── Evaluator 3: Child Involvement (0-25) ───────────────────────────────────

/**
 * Evaluates children's involvement in food-related activities.
 *
 * Scoring breakdown:
 *   - Participation rate (children who participated vs total) (0-7)
 *   - Variety of activities (unique participation types, excl. "none") (0-6)
 *   - Child enjoyed rate (0-5)
 *   - Cooking activity rate (0-4)
 *   - Staff support rate (non-empty staffSupported) (0-3)
 */
export function evaluateChildInvolvement(
  records: ChildParticipationRecord[],
  totalChildCount: number,
): ChildInvolvementResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      participationRate: 0,
      activityVariety: 0,
      childEnjoyedRate: 0,
      cookingActivityRate: 0,
      staffSupportRate: 0,
    };
  }

  let score = 0;

  // Participation rate: unique children who participated (excl. "none") (0-7)
  const activeRecords = records.filter((r) => r.participationType !== "none");
  const activeChildren = new Set(activeRecords.map((r) => r.childId)).size;
  const participationRate = pct(activeChildren, totalChildCount);
  if (participationRate >= 100) score += 7;
  else if (participationRate >= 80) score += 5;
  else if (participationRate >= 50) score += 3;
  else if (participationRate > 0) score += 1;

  // Variety of activities (unique types excl. "none") (0-6)
  const uniqueTypes = new Set(
    activeRecords.map((r) => r.participationType),
  ).size;
  if (uniqueTypes >= 4) score += 6;
  else if (uniqueTypes >= 3) score += 4;
  else if (uniqueTypes >= 2) score += 3;
  else if (uniqueTypes >= 1) score += 1;

  // Child enjoyed rate (0-5)
  const enjoyed = activeRecords.filter((r) => r.childEnjoyed).length;
  const childEnjoyedRate = pct(enjoyed, activeRecords.length);
  if (childEnjoyedRate >= 90) score += 5;
  else if (childEnjoyedRate >= 75) score += 3;
  else if (childEnjoyedRate >= 50) score += 2;
  else if (childEnjoyedRate > 0) score += 1;

  // Cooking activity rate (0-4)
  const cookingRecords = activeRecords.filter(
    (r) => r.participationType === "cooking_activity",
  ).length;
  const cookingActivityRate = pct(cookingRecords, activeRecords.length);
  if (cookingActivityRate >= 40) score += 4;
  else if (cookingActivityRate >= 25) score += 3;
  else if (cookingActivityRate >= 10) score += 2;
  else if (cookingActivityRate > 0) score += 1;

  // Staff support rate (0-3)
  const staffSupported = activeRecords.filter(
    (r) => r.staffSupported.trim().length > 0,
  ).length;
  const staffSupportRate = pct(staffSupported, activeRecords.length);
  if (staffSupportRate >= 90) score += 3;
  else if (staffSupportRate >= 70) score += 2;
  else if (staffSupportRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    participationRate,
    activityVariety: uniqueTypes,
    childEnjoyedRate,
    cookingActivityRate,
    staffSupportRate,
  };
}

// ── Evaluator 4: Nutrition Compliance (0-25) ────────────────────────────────

/**
 * Evaluates nutrition audit compliance.
 *
 * Scoring breakdown:
 *   - Five a day evidence (0-7)
 *   - Fresh food used (0-6)
 *   - Sugar limits followed (0-5)
 *   - Portion guidance followed (0-4)
 *   - Overall compliant (0-3)
 */
export function evaluateNutritionCompliance(
  audits: NutritionAudit[],
): NutritionComplianceResult {
  if (audits.length === 0) {
    return {
      overallScore: 0,
      totalAudits: 0,
      fiveADayRate: 0,
      freshFoodRate: 0,
      sugarLimitsRate: 0,
      portionGuidanceRate: 0,
      overallCompliantRate: 0,
    };
  }

  let score = 0;
  const total = audits.length;

  // Five a day (0-7)
  const fiveADay = audits.filter((a) => a.fiveADayEvidence).length;
  const fiveADayRate = pct(fiveADay, total);
  if (fiveADayRate >= 100) score += 7;
  else if (fiveADayRate >= 80) score += 5;
  else if (fiveADayRate >= 50) score += 3;
  else if (fiveADayRate > 0) score += 1;

  // Fresh food (0-6)
  const freshFood = audits.filter((a) => a.freshFoodUsed).length;
  const freshFoodRate = pct(freshFood, total);
  if (freshFoodRate >= 100) score += 6;
  else if (freshFoodRate >= 80) score += 4;
  else if (freshFoodRate >= 50) score += 2;
  else if (freshFoodRate > 0) score += 1;

  // Sugar limits (0-5)
  const sugarOk = audits.filter((a) => a.sugarLimitsFollowed).length;
  const sugarLimitsRate = pct(sugarOk, total);
  if (sugarLimitsRate >= 100) score += 5;
  else if (sugarLimitsRate >= 80) score += 3;
  else if (sugarLimitsRate >= 50) score += 2;
  else if (sugarLimitsRate > 0) score += 1;

  // Portion guidance (0-4)
  const portionOk = audits.filter((a) => a.portionGuidanceFollowed).length;
  const portionGuidanceRate = pct(portionOk, total);
  if (portionGuidanceRate >= 100) score += 4;
  else if (portionGuidanceRate >= 80) score += 3;
  else if (portionGuidanceRate >= 50) score += 2;
  else if (portionGuidanceRate > 0) score += 1;

  // Overall compliant (0-3)
  const compliant = audits.filter((a) => a.overallCompliant).length;
  const overallCompliantRate = pct(compliant, total);
  if (overallCompliantRate >= 100) score += 3;
  else if (overallCompliantRate >= 80) score += 2;
  else if (overallCompliantRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalAudits: total,
    fiveADayRate,
    freshFoodRate,
    sugarLimitsRate,
    portionGuidanceRate,
    overallCompliantRate,
  };
}

// ── Child Nutrition Profiles ────────────────────────────────────────────────

/**
 * Builds a per-child nutrition profile with a 0-10 score.
 */
export function buildChildNutritionProfiles(
  feedback: MealFeedback[],
  participationRecords: ChildParticipationRecord[],
  childIds: string[],
  childNames: Record<string, string>,
): ChildNutritionProfile[] {
  return childIds.map((childId) => {
    const childFeedback = feedback.filter((f) => f.childId === childId);
    const childParticipation = participationRecords.filter(
      (r) => r.childId === childId && r.participationType !== "none",
    );

    // Average enjoyment
    const totalEnjoyment = childFeedback.reduce(
      (sum, f) => sum + f.enjoymentRating,
      0,
    );
    const averageEnjoyment =
      childFeedback.length > 0
        ? Math.round((totalEnjoyment / childFeedback.length) * 10) / 10
        : 0;

    // Portion satisfactory
    const portionOk = childFeedback.filter((f) => f.portionSatisfactory).length;
    const portionSatisfactoryRate = pct(portionOk, childFeedback.length);

    // Build score 0-10
    let profileScore = 2; // base

    // Enjoyment (0-3)
    if (averageEnjoyment >= 4.5) profileScore += 3;
    else if (averageEnjoyment >= 3.5) profileScore += 2;
    else if (averageEnjoyment >= 2.5) profileScore += 1;

    // Portion satisfaction (0-2)
    if (portionSatisfactoryRate >= 90) profileScore += 2;
    else if (portionSatisfactoryRate >= 60) profileScore += 1;

    // Participation (0-2)
    if (childParticipation.length >= 3) profileScore += 2;
    else if (childParticipation.length >= 1) profileScore += 1;

    // Feedback engagement (0-1)
    if (childFeedback.length >= 3) profileScore += 1;

    // Penalties
    if (childFeedback.length === 0 && childParticipation.length === 0) {
      profileScore -= 1;
    }
    if (averageEnjoyment > 0 && averageEnjoyment < 2.0) {
      profileScore -= 1;
    }

    return {
      childId,
      childName: childNames[childId] ?? childId,
      averageEnjoyment,
      feedbackCount: childFeedback.length,
      portionSatisfactoryRate,
      participationCount: childParticipation.length,
      overallScore: Math.max(0, Math.min(profileScore, 10)),
    };
  });
}

// ── Strengths / Areas / Actions ─────────────────────────────────────────────

function generateStrengths(
  menu: MenuQualityResult,
  satisfaction: ChildSatisfactionResult,
  involvement: ChildInvolvementResult,
  compliance: NutritionComplianceResult,
): string[] {
  const strengths: string[] = [];

  if (menu.nutritionalBalanceRate >= 90) {
    strengths.push(
      "Excellent nutritional balance across weekly menus — children receiving well-balanced meals consistently",
    );
  }

  if (menu.childrenConsultedRate >= 90) {
    strengths.push(
      "Children consistently consulted on menu planning — strong participation and voice in food choices",
    );
  }

  if (menu.varietyRate >= 90) {
    strengths.push(
      "Highly varied menus — children experience a wide range of foods and cuisines",
    );
  }

  if (menu.culturalAccommodationRate >= 90) {
    strengths.push(
      "Cultural dietary needs fully accommodated — menus reflect and celebrate children's backgrounds",
    );
  }

  if (satisfaction.averageEnjoyment >= 4.0) {
    strengths.push(
      "High child satisfaction with meals — average enjoyment rating demonstrates children enjoy the food provided",
    );
  }

  if (satisfaction.portionSatisfactoryRate >= 90) {
    strengths.push(
      "Portion sizes consistently satisfactory — children's individual needs being met",
    );
  }

  if (involvement.participationRate >= 80) {
    strengths.push(
      "Strong child involvement in food-related activities — supporting independence and life skills",
    );
  }

  if (involvement.activityVariety >= 3) {
    strengths.push(
      "Good variety of food-related activities — children engaged in planning, cooking, shopping, and growing food",
    );
  }

  if (compliance.fiveADayRate >= 100) {
    strengths.push(
      "Five-a-day fruit and vegetable evidence met in all audits — children's nutritional intake well-supported",
    );
  }

  if (compliance.overallCompliantRate >= 100) {
    strengths.push(
      "Full nutrition audit compliance — all audits demonstrate adherence to nutritional standards",
    );
  }

  if (compliance.freshFoodRate >= 100) {
    strengths.push(
      "Fresh food used consistently — avoiding over-reliance on processed or convenience foods",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  menu: MenuQualityResult,
  satisfaction: ChildSatisfactionResult,
  involvement: ChildInvolvementResult,
  compliance: NutritionComplianceResult,
): string[] {
  const areas: string[] = [];

  if (menu.nutritionalBalanceRate < 75 && menu.totalMenus > 0) {
    areas.push(
      `Nutritional balance rated good or excellent in only ${menu.nutritionalBalanceRate}% of menus — needs improvement to meet Eatwell Guide standards`,
    );
  }

  if (menu.childrenConsultedRate < 75 && menu.totalMenus > 0) {
    areas.push(
      `Children consulted on menu planning in only ${menu.childrenConsultedRate}% of weeks — their voice should be central to food choices`,
    );
  }

  if (menu.specialDietaryMetRate < 100 && menu.totalMenus > 0) {
    areas.push(
      `Special dietary needs met in only ${menu.specialDietaryMetRate}% of menus — all dietary requirements must be consistently accommodated`,
    );
  }

  if (satisfaction.averageEnjoyment < 3.5 && satisfaction.totalFeedback > 0) {
    areas.push(
      `Average meal enjoyment rating of ${satisfaction.averageEnjoyment}/5 — children's preferences need greater consideration`,
    );
  }

  if (satisfaction.responseRate < 80 && satisfaction.totalFeedback > 0) {
    areas.push(
      `Only ${satisfaction.responseRate}% of children providing feedback — broader consultation needed to capture all voices`,
    );
  }

  if (involvement.participationRate < 50) {
    areas.push(
      `Only ${involvement.participationRate}% of children actively involved in food activities — all children should have opportunities to participate`,
    );
  }

  if (involvement.cookingActivityRate < 20 && involvement.totalRecords > 0) {
    areas.push(
      `Cooking activities represent only ${involvement.cookingActivityRate}% of food involvement — more practical cooking opportunities needed`,
    );
  }

  if (compliance.fiveADayRate < 80 && compliance.totalAudits > 0) {
    areas.push(
      `Five-a-day evidence found in only ${compliance.fiveADayRate}% of audits — fruit and vegetable provision needs strengthening`,
    );
  }

  if (compliance.sugarLimitsRate < 80 && compliance.totalAudits > 0) {
    areas.push(
      `Sugar limits followed in only ${compliance.sugarLimitsRate}% of audits — review sugar content across menus`,
    );
  }

  if (compliance.freshFoodRate < 80 && compliance.totalAudits > 0) {
    areas.push(
      `Fresh food used in only ${compliance.freshFoodRate}% of audits — reduce reliance on processed food`,
    );
  }

  return areas;
}

function generateActions(
  menu: MenuQualityResult,
  satisfaction: ChildSatisfactionResult,
  involvement: ChildInvolvementResult,
  compliance: NutritionComplianceResult,
): string[] {
  const actions: string[] = [];

  if (menu.totalMenus === 0) {
    actions.push(
      "URGENT: Implement weekly menu planning — Reg 10 requires nutritious, varied meals planned in advance",
    );
  }

  if (menu.childrenConsultedRate < 50 && menu.totalMenus > 0) {
    actions.push(
      "Establish regular menu consultation with children — use house meetings or individual key-work sessions to gather food preferences",
    );
  }

  if (menu.specialDietaryMetRate < 100 && menu.totalMenus > 0) {
    actions.push(
      "Review all children's dietary requirements and ensure kitchen staff have current profiles — zero tolerance for unmet dietary needs",
    );
  }

  if (satisfaction.totalFeedback === 0) {
    actions.push(
      "URGENT: Implement meal feedback system — children's views on food must be sought and acted upon per SCCIF guidance",
    );
  }

  if (satisfaction.averageEnjoyment < 3.0 && satisfaction.totalFeedback > 0) {
    actions.push(
      "Review menu choices with children who rated meals poorly — adapt menus to better reflect preferences while maintaining nutrition",
    );
  }

  if (involvement.totalRecords === 0) {
    actions.push(
      "URGENT: Create food involvement programme — include cooking, shopping, menu planning, and food growing activities",
    );
  }

  if (involvement.cookingActivityRate < 15 && involvement.totalRecords > 0) {
    actions.push(
      "Increase cooking activity opportunities — practical cooking supports independence and life skills per NMS 4",
    );
  }

  if (compliance.totalAudits === 0) {
    actions.push(
      "URGENT: Implement nutrition audit programme — regular audits needed to ensure Food Standards Agency compliance",
    );
  }

  if (compliance.fiveADayRate < 100 && compliance.totalAudits > 0) {
    actions.push(
      "Strengthen five-a-day provision — ensure fresh fruit and vegetables are available at every meal and as snacks",
    );
  }

  if (compliance.sugarLimitsRate < 100 && compliance.totalAudits > 0) {
    actions.push(
      "Audit sugar content across all menus and snacks — align with Eatwell Guide 2016 recommendations",
    );
  }

  if (compliance.freshFoodRate < 100 && compliance.totalAudits > 0) {
    actions.push(
      "Increase fresh food usage — source seasonal, local produce where possible to improve nutritional quality",
    );
  }

  return actions;
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateMenuPlanningNutritionIntelligence(
  menus: WeeklyMenu[],
  feedback: MealFeedback[],
  participationRecords: ChildParticipationRecord[],
  audits: NutritionAudit[],
  childIds: string[],
  childNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): MenuPlanningNutritionIntelligence {
  const totalChildCount = Math.max(childIds.length, 1);

  const menuResult = evaluateMenuQuality(menus);
  const satisfactionResult = evaluateChildSatisfaction(feedback, totalChildCount);
  const involvementResult = evaluateChildInvolvement(
    participationRecords,
    totalChildCount,
  );
  const complianceResult = evaluateNutritionCompliance(audits);

  const overallScore =
    menuResult.overallScore +
    satisfactionResult.overallScore +
    involvementResult.overallScore +
    complianceResult.overallScore;

  const childProfiles = buildChildNutritionProfiles(
    feedback,
    participationRecords,
    childIds,
    childNames,
  );

  const strengths = generateStrengths(
    menuResult,
    satisfactionResult,
    involvementResult,
    complianceResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    menuResult,
    satisfactionResult,
    involvementResult,
    complianceResult,
  );
  const actions = generateActions(
    menuResult,
    satisfactionResult,
    involvementResult,
    complianceResult,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 10 — the health and wellbeing standard including nutrition and meals",
    "SCCIF — Social Care Common Inspection Framework, health and wellbeing outcomes",
    "NMS 4 — National Minimum Standards for children's homes, food and nutrition",
    "Food Standards Agency guidance — food safety and nutrition standards in care settings",
    "Eatwell Guide 2016 — government guidance on balanced diet and healthy eating",
    "UNCRC Article 24 — the right to the highest attainable standard of health",
    "UNCRC Article 27 — the right to an adequate standard of living including nutrition",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore: Math.min(overallScore, 100),
    rating: getRating(overallScore),
    menuQuality: menuResult,
    childSatisfaction: satisfactionResult,
    childInvolvement: involvementResult,
    nutritionCompliance: complianceResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
