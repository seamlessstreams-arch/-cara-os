// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME COOKING & KITCHEN SKILLS INTELLIGENCE ENGINE
// Pure deterministic engine: cooking session participation, kitchen safety
// compliance, meal preparation skill progression, nutritional understanding,
// and child independence in cooking.
// CHR 2015 Reg 5 (Engaging, activities, hobbies), Reg 7 (Safeguarding).
// SCCIF: Experiences and progress.
// Store keys: cookingSessionRecords, kitchenSafetyRecords,
//             mealPreparationRecords, nutritionalUnderstandingRecords,
//             cookingIndependenceRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CookingSessionRecordInput {
  id: string;
  child_id: string;
  date: string;
  session_type: "guided" | "supervised" | "independent" | "group" | "one_to_one" | "workshop";
  dish_category: "breakfast" | "lunch" | "dinner" | "snack" | "baking" | "dessert" | "cultural" | "other";
  attended: boolean;
  engaged: boolean;
  completed_dish: boolean;
  child_enjoyed: boolean;
  child_chose_recipe: boolean;
  staff_member: string;
  duration_minutes: number;
  skills_practised: string[];
  difficulty_level: "beginner" | "intermediate" | "advanced";
  dietary_requirements_met: boolean;
  allergen_awareness_demonstrated: boolean;
  hand_washing_before: boolean;
  apron_worn: boolean;
  notes: string;
  created_at: string;
}

export interface KitchenSafetyRecordInput {
  id: string;
  child_id: string;
  date: string;
  assessment_type: "observation" | "formal_assessment" | "incident_review" | "induction" | "refresher";
  knife_safety_competent: boolean;
  hob_safety_competent: boolean;
  oven_safety_competent: boolean;
  microwave_safety_competent: boolean;
  electrical_appliance_safety: boolean;
  food_hygiene_compliant: boolean;
  hand_washing_compliant: boolean;
  cleaning_after_cooking: boolean;
  fire_safety_awareness: boolean;
  first_aid_awareness: boolean;
  allergies_cross_contamination_aware: boolean;
  overall_safe: boolean;
  risk_assessment_completed: boolean;
  incident_reported: boolean;
  incident_description: string;
  assessor: string;
  notes: string;
  created_at: string;
}

export interface MealPreparationRecordInput {
  id: string;
  child_id: string;
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "packed_lunch" | "special_occasion";
  skill_area: "planning" | "shopping" | "budgeting" | "preparation" | "cooking" | "plating" | "cleaning_up" | "full_meal";
  competency_level: "not_introduced" | "observed_only" | "assisted" | "prompted" | "independent" | "can_teach";
  recipe_followed: boolean;
  portion_appropriate: boolean;
  presentation_good: boolean;
  time_management_good: boolean;
  waste_minimal: boolean;
  served_others: boolean;
  received_positive_feedback: boolean;
  staff_assessment_score: number | null; // 1-5
  progression_from_last: "improved" | "maintained" | "declined" | "first_assessment";
  notes: string;
  created_at: string;
}

export interface NutritionalUnderstandingRecordInput {
  id: string;
  child_id: string;
  date: string;
  topic: "food_groups" | "balanced_diet" | "hydration" | "portion_control" | "reading_labels" | "dietary_needs" | "sugar_awareness" | "healthy_snacking" | "meal_planning" | "cultural_foods";
  assessment_method: "quiz" | "discussion" | "practical" | "observation" | "project" | "menu_planning";
  understanding_demonstrated: boolean;
  can_apply_knowledge: boolean;
  engaged: boolean;
  child_feedback_positive: boolean;
  linked_to_cooking_session: boolean;
  staff_member: string;
  score_achieved: number; // 0-100
  notes: string;
  created_at: string;
}

export interface IndependenceRecordInput {
  id: string;
  child_id: string;
  date: string;
  independence_area: "menu_planning" | "shopping_list" | "budget_management" | "independent_cooking" | "kitchen_cleaning" | "food_storage" | "appliance_use" | "recipe_selection" | "hosting_meal" | "packed_lunch_preparation";
  current_level: "fully_dependent" | "needs_significant_support" | "needs_some_support" | "mostly_independent" | "fully_independent";
  goal_set: boolean;
  goal_met: boolean;
  progress_since_last: "significant_progress" | "some_progress" | "maintained" | "declined" | "first_assessment";
  age_appropriate: boolean;
  child_motivated: boolean;
  barriers_identified: string[];
  support_plan_in_place: boolean;
  transition_relevance: boolean;
  notes: string;
  created_at: string;
}

// ── Main Input / Output ────────────────────────────────────────────────────

export interface CookingKitchenInput {
  today: string;
  total_children: number;
  cooking_session_records: CookingSessionRecordInput[];
  kitchen_safety_records: KitchenSafetyRecordInput[];
  meal_preparation_records: MealPreparationRecordInput[];
  nutritional_understanding_records: NutritionalUnderstandingRecordInput[];
  independence_records: IndependenceRecordInput[];
}

export type CookingKitchenRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CookingKitchenInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface CookingKitchenRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface CookingKitchenResult {
  cooking_rating: CookingKitchenRating;
  cooking_score: number | null;
  headline: string;
  total_cooking_sessions: number;
  total_kitchen_safety_records: number;
  total_meal_preparation_records: number;
  total_nutritional_records: number;
  total_independence_records: number;
  cooking_participation_rate: number | null;
  kitchen_safety_rate: number | null;
  meal_preparation_rate: number | null;
  nutritional_understanding_rate: number | null;
  independence_rate: number | null;
  child_enjoyment_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: CookingKitchenRecommendation[];
  insights: CookingKitchenInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): CookingKitchenRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: CookingKitchenRating,
  score: number,
  headline: string,
): CookingKitchenResult {
  return {
    cooking_rating: rating,
    cooking_score: score,
    headline,
    total_cooking_sessions: 0,
    total_kitchen_safety_records: 0,
    total_meal_preparation_records: 0,
    total_nutritional_records: 0,
    total_independence_records: 0,
    cooking_participation_rate: 0,
    kitchen_safety_rate: 0,
    meal_preparation_rate: 0,
    nutritional_understanding_rate: 0,
    independence_rate: 0,
    child_enjoyment_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeCookingKitchenSkills(
  input: CookingKitchenInput,
): CookingKitchenResult {
  const {
    total_children,
    cooking_session_records,
    kitchen_safety_records,
    meal_preparation_records,
    nutritional_understanding_records,
    independence_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    cooking_session_records.length === 0 &&
    kitchen_safety_records.length === 0 &&
    meal_preparation_records.length === 0 &&
    nutritional_understanding_records.length === 0 &&
    independence_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess cooking and kitchen skills.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No cooking or kitchen skills data recorded despite children on placement — cooking session participation, kitchen safety, meal preparation, nutritional understanding, and independence development require urgent attention.",
      ),
      concerns: [
        "No cooking session records, kitchen safety assessments, meal preparation records, nutritional understanding assessments, or independence records exist despite children being on placement — the home cannot evidence cooking skills development or kitchen safety compliance.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of cooking sessions, kitchen safety assessments, meal preparation skills, nutritional understanding, and independence development to evidence children's cooking and kitchen skills progression.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities, hobbies",
        },
        {
          rank: 2,
          recommendation:
            "Develop a cooking and kitchen skills programme that enables every child to participate in age-appropriate cooking activities, learn kitchen safety, and develop independence in meal preparation as part of their personal development and transition planning.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Safeguarding",
        },
      ],
      insights: [
        {
          text: "The complete absence of cooking and kitchen skills records means the home cannot demonstrate that children are developing essential life skills in food preparation, kitchen safety, or nutritional awareness. This represents a significant gap in supporting children's independence and readiness for adult life.",
          severity: "critical",
        },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COOKING SESSION METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalCookingSessions = cooking_session_records.length;
  const attendedSessions = cooking_session_records.filter((s) => s.attended).length;
  const cookingParticipationRate = pct(attendedSessions, totalCookingSessions);

  const engagedSessions = cooking_session_records.filter((s) => s.attended && s.engaged).length;
  const cookingEngagementRate = pct(engagedSessions, totalCookingSessions);

  const completedDishes = cooking_session_records.filter((s) => s.attended && s.completed_dish).length;
  const dishCompletionRate = pct(completedDishes, totalCookingSessions);

  const enjoyedSessions = cooking_session_records.filter((s) => s.attended && s.child_enjoyed).length;
  const childEnjoymentRate = pct(enjoyedSessions, totalCookingSessions);

  const choseRecipeSessions = cooking_session_records.filter((s) => s.attended && s.child_chose_recipe).length;
  const recipeChoiceRate = pct(choseRecipeSessions, totalCookingSessions);

  const handWashingBefore = cooking_session_records.filter((s) => s.attended && s.hand_washing_before).length;
  const handWashingRate = pct(handWashingBefore, attendedSessions);

  const apronWorn = cooking_session_records.filter((s) => s.attended && s.apron_worn).length;
  const apronRate = pct(apronWorn, attendedSessions);

  const allergenAware = cooking_session_records.filter((s) => s.attended && s.allergen_awareness_demonstrated).length;
  const allergenAwarenessRate = pct(allergenAware, attendedSessions);

  const dietaryMet = cooking_session_records.filter((s) => s.attended && s.dietary_requirements_met).length;
  const dietaryComplianceRate = pct(dietaryMet, attendedSessions);

  // Session type distribution
  const independentSessions = cooking_session_records.filter(
    (s) => s.attended && s.session_type === "independent",
  ).length;
  const independentSessionRate = pct(independentSessions, attendedSessions);

  // Difficulty level distribution
  const advancedSessions = cooking_session_records.filter(
    (s) => s.attended && s.difficulty_level === "advanced",
  ).length;
  const intermediateSessions = cooking_session_records.filter(
    (s) => s.attended && s.difficulty_level === "intermediate",
  ).length;
  const advancedIntermediateRate = pct(advancedSessions + intermediateSessions, attendedSessions);

  // Dish category variety
  const uniqueDishCategories = new Set(
    cooking_session_records.filter((s) => s.attended).map((s) => s.dish_category),
  ).size;

  // Unique children in cooking sessions
  const uniqueChildrenCooking = new Set(
    cooking_session_records.filter((s) => s.attended).map((s) => s.child_id),
  ).size;
  const cookingChildCoverage = total_children > 0 ? pct(uniqueChildrenCooking, total_children) : 0;

  // Skills practised diversity
  const allSkillsPractised = new Set<string>();
  for (const s of cooking_session_records) {
    if (s.attended) {
      for (const skill of s.skills_practised) {
        allSkillsPractised.add(skill);
      }
    }
  }
  const totalUniqueSkills = allSkillsPractised.size;

  // ══════════════════════════════════════════════════════════════════════════
  // KITCHEN SAFETY METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalKitchenSafetyRecords = kitchen_safety_records.length;
  const overallSafe = kitchen_safety_records.filter((k) => k.overall_safe).length;
  const kitchenSafetyRate = pct(overallSafe, totalKitchenSafetyRecords);

  const knifeSafe = kitchen_safety_records.filter((k) => k.knife_safety_competent).length;
  const knifeSafetyRate = pct(knifeSafe, totalKitchenSafetyRecords);

  const hobSafe = kitchen_safety_records.filter((k) => k.hob_safety_competent).length;
  const hobSafetyRate = pct(hobSafe, totalKitchenSafetyRecords);

  const ovenSafe = kitchen_safety_records.filter((k) => k.oven_safety_competent).length;
  const ovenSafetyRate = pct(ovenSafe, totalKitchenSafetyRecords);

  const microwaveSafe = kitchen_safety_records.filter((k) => k.microwave_safety_competent).length;
  const microwaveSafetyRate = pct(microwaveSafe, totalKitchenSafetyRecords);

  const electricalSafe = kitchen_safety_records.filter((k) => k.electrical_appliance_safety).length;
  const electricalSafetyRate = pct(electricalSafe, totalKitchenSafetyRecords);

  const foodHygiene = kitchen_safety_records.filter((k) => k.food_hygiene_compliant).length;
  const foodHygieneRate = pct(foodHygiene, totalKitchenSafetyRecords);

  const handWashCompliant = kitchen_safety_records.filter((k) => k.hand_washing_compliant).length;
  const handWashComplianceRate = pct(handWashCompliant, totalKitchenSafetyRecords);

  const cleaningAfter = kitchen_safety_records.filter((k) => k.cleaning_after_cooking).length;
  const cleaningAfterRate = pct(cleaningAfter, totalKitchenSafetyRecords);

  const fireSafety = kitchen_safety_records.filter((k) => k.fire_safety_awareness).length;
  const fireSafetyRate = pct(fireSafety, totalKitchenSafetyRecords);

  const firstAid = kitchen_safety_records.filter((k) => k.first_aid_awareness).length;
  const firstAidRate = pct(firstAid, totalKitchenSafetyRecords);

  const crossContamAware = kitchen_safety_records.filter((k) => k.allergies_cross_contamination_aware).length;
  const crossContaminationRate = pct(crossContamAware, totalKitchenSafetyRecords);

  const riskAssessmentDone = kitchen_safety_records.filter((k) => k.risk_assessment_completed).length;
  const riskAssessmentRate = pct(riskAssessmentDone, totalKitchenSafetyRecords);

  const incidentsReported = kitchen_safety_records.filter((k) => k.incident_reported).length;
  const incidentRate = pct(incidentsReported, totalKitchenSafetyRecords);

  // Unique children assessed for safety
  const uniqueChildrenSafety = new Set(
    kitchen_safety_records.map((k) => k.child_id),
  ).size;
  const safetyChildCoverage = total_children > 0 ? pct(uniqueChildrenSafety, total_children) : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // MEAL PREPARATION METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalMealPrepRecords = meal_preparation_records.length;

  // Independence levels in meal prep
  const independentMealPrep = meal_preparation_records.filter(
    (m) => m.competency_level === "independent" || m.competency_level === "can_teach",
  ).length;
  const mealPrepIndependenceRate = pct(independentMealPrep, totalMealPrepRecords);

  const assistedOrAbove = meal_preparation_records.filter(
    (m) =>
      m.competency_level === "assisted" ||
      m.competency_level === "prompted" ||
      m.competency_level === "independent" ||
      m.competency_level === "can_teach",
  ).length;
  const mealPreparationRate = pct(assistedOrAbove, totalMealPrepRecords);

  const recipeFollowed = meal_preparation_records.filter((m) => m.recipe_followed).length;
  const recipeFollowRate = pct(recipeFollowed, totalMealPrepRecords);

  const portionAppropriate = meal_preparation_records.filter((m) => m.portion_appropriate).length;
  const portionRate = pct(portionAppropriate, totalMealPrepRecords);

  const presentationGood = meal_preparation_records.filter((m) => m.presentation_good).length;
  const presentationRate = pct(presentationGood, totalMealPrepRecords);

  const timeManagementGood = meal_preparation_records.filter((m) => m.time_management_good).length;
  const timeManagementRate = pct(timeManagementGood, totalMealPrepRecords);

  const wasteMinimal = meal_preparation_records.filter((m) => m.waste_minimal).length;
  const wasteMinimalRate = pct(wasteMinimal, totalMealPrepRecords);

  const servedOthers = meal_preparation_records.filter((m) => m.served_others).length;
  const servedOthersRate = pct(servedOthers, totalMealPrepRecords);

  const positiveFeedback = meal_preparation_records.filter((m) => m.received_positive_feedback).length;
  const positiveFeedbackRate = pct(positiveFeedback, totalMealPrepRecords);

  const staffScoreSum = meal_preparation_records.reduce((sum, m) => sum + (m.staff_assessment_score ?? 0), 0);
  const avgStaffScore = totalMealPrepRecords > 0
    ? Math.round((staffScoreSum / totalMealPrepRecords) * 100) / 100
    : null;

  // Progression tracking
  const improved = meal_preparation_records.filter((m) => m.progression_from_last === "improved").length;
  const declined = meal_preparation_records.filter((m) => m.progression_from_last === "declined").length;
  const progressionRate = pct(improved, totalMealPrepRecords);
  const declineRate = pct(declined, totalMealPrepRecords);

  // Skill area variety
  const uniqueSkillAreas = new Set(meal_preparation_records.map((m) => m.skill_area)).size;

  // Unique children in meal prep
  const uniqueChildrenMealPrep = new Set(
    meal_preparation_records.map((m) => m.child_id),
  ).size;
  const mealPrepChildCoverage = total_children > 0 ? pct(uniqueChildrenMealPrep, total_children) : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // NUTRITIONAL UNDERSTANDING METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalNutritionalRecords = nutritional_understanding_records.length;

  const demonstratedUnderstanding = nutritional_understanding_records.filter(
    (n) => n.understanding_demonstrated,
  ).length;
  const nutritionalUnderstandingRate = pct(demonstratedUnderstanding, totalNutritionalRecords);

  const canApplyKnowledge = nutritional_understanding_records.filter(
    (n) => n.understanding_demonstrated && n.can_apply_knowledge,
  ).length;
  const applicationRate = pct(canApplyKnowledge, totalNutritionalRecords);

  const nutritionalEngaged = nutritional_understanding_records.filter((n) => n.engaged).length;
  const nutritionalEngagementRate = pct(nutritionalEngaged, totalNutritionalRecords);

  const nutritionalPositive = nutritional_understanding_records.filter(
    (n) => n.engaged && n.child_feedback_positive,
  ).length;
  const nutritionalPositiveFeedbackRate = pct(nutritionalPositive, totalNutritionalRecords);

  const linkedToCooking = nutritional_understanding_records.filter(
    (n) => n.linked_to_cooking_session,
  ).length;
  const linkedToCookingRate = pct(linkedToCooking, totalNutritionalRecords);

  const avgNutritionalScore = totalNutritionalRecords > 0
    ? Math.round(
        nutritional_understanding_records.reduce((sum, n) => sum + n.score_achieved, 0) /
          totalNutritionalRecords,
      )
    : null;

  // Topic variety
  const uniqueTopics = new Set(nutritional_understanding_records.map((n) => n.topic)).size;

  // Unique children in nutritional understanding
  const uniqueChildrenNutrition = new Set(
    nutritional_understanding_records.map((n) => n.child_id),
  ).size;
  const nutritionChildCoverage = total_children > 0 ? pct(uniqueChildrenNutrition, total_children) : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // INDEPENDENCE METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalIndependenceRecords = independence_records.length;

  const mostlyOrFullyIndependent = independence_records.filter(
    (r) => r.current_level === "mostly_independent" || r.current_level === "fully_independent",
  ).length;
  const independenceRate = pct(mostlyOrFullyIndependent, totalIndependenceRecords);

  const fullyIndependent = independence_records.filter(
    (r) => r.current_level === "fully_independent",
  ).length;
  const fullyIndependentRate = pct(fullyIndependent, totalIndependenceRecords);

  const goalsSet = independence_records.filter((r) => r.goal_set).length;
  const goalSettingRate = pct(goalsSet, totalIndependenceRecords);

  const goalsMet = independence_records.filter((r) => r.goal_set && r.goal_met).length;
  const goalAchievementRate = pct(goalsMet, goalsSet);

  const significantProgress = independence_records.filter(
    (r) => r.progress_since_last === "significant_progress",
  ).length;
  const someProgress = independence_records.filter(
    (r) => r.progress_since_last === "some_progress",
  ).length;
  const indDeclined = independence_records.filter(
    (r) => r.progress_since_last === "declined",
  ).length;
  const progressMakingRate = pct(significantProgress + someProgress, totalIndependenceRecords);
  const indDeclineRate = pct(indDeclined, totalIndependenceRecords);

  const ageAppropriate = independence_records.filter((r) => r.age_appropriate).length;
  const ageAppropriateRate = pct(ageAppropriate, totalIndependenceRecords);

  const childMotivated = independence_records.filter((r) => r.child_motivated).length;
  const motivationRate = pct(childMotivated, totalIndependenceRecords);

  const supportPlan = independence_records.filter((r) => r.support_plan_in_place).length;
  const supportPlanRate = pct(supportPlan, totalIndependenceRecords);

  const transitionRelevant = independence_records.filter((r) => r.transition_relevance).length;
  const transitionRelevanceRate = pct(transitionRelevant, totalIndependenceRecords);

  // Barriers analysis
  const totalBarriers = independence_records.reduce(
    (sum, r) => sum + r.barriers_identified.length,
    0,
  );
  const recordsWithBarriers = independence_records.filter(
    (r) => r.barriers_identified.length > 0,
  ).length;
  const barriersRate = pct(recordsWithBarriers, totalIndependenceRecords);

  // Independence area variety
  const uniqueIndependenceAreas = new Set(
    independence_records.map((r) => r.independence_area),
  ).size;

  // Unique children in independence records
  const uniqueChildrenIndependence = new Set(
    independence_records.map((r) => r.child_id),
  ).size;
  const independenceChildCoverage = total_children > 0 ? pct(uniqueChildrenIndependence, total_children) : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // COMPOSITE CHILD ENJOYMENT RATE
  // ══════════════════════════════════════════════════════════════════════════

  // Enjoyment composite across cooking enjoyment + nutritional positive feedback + child motivation
  const enjoymentNumerators: number[] = [];
  const enjoymentDenominators: number[] = [];

  if (totalCookingSessions > 0) {
    enjoymentNumerators.push(enjoyedSessions);
    enjoymentDenominators.push(attendedSessions > 0 ? attendedSessions : totalCookingSessions);
  }
  if (totalNutritionalRecords > 0) {
    enjoymentNumerators.push(nutritionalPositive);
    enjoymentDenominators.push(totalNutritionalRecords);
  }
  if (totalIndependenceRecords > 0) {
    enjoymentNumerators.push(childMotivated);
    enjoymentDenominators.push(totalIndependenceRecords);
  }

  const totalEnjoymentNum = enjoymentNumerators.reduce((a, b) => a + b, 0);
  const totalEnjoymentDenom = enjoymentDenominators.reduce((a, b) => a + b, 0);
  const compositeEnjoymentRate = pct(totalEnjoymentNum, totalEnjoymentDenom);

  // ══════════════════════════════════════════════════════════════════════════
  // SCORING: base = 52, max bonuses = +28, 4 penalties guarded by length > 0
  // ══════════════════════════════════════════════════════════════════════════

  let score = 52;

  // --- Bonus 1: cookingParticipationRate (>=90: +4, >=70: +2) ---
  if (cookingParticipationRate >= 90) score += 4;
  else if (cookingParticipationRate >= 70) score += 2;

  // --- Bonus 2: kitchenSafetyRate (>=95: +4, >=80: +2) ---
  if (kitchenSafetyRate >= 95) score += 4;
  else if (kitchenSafetyRate >= 80) score += 2;

  // --- Bonus 3: mealPreparationRate (>=90: +4, >=70: +2) ---
  if (mealPreparationRate >= 90) score += 4;
  else if (mealPreparationRate >= 70) score += 2;

  // --- Bonus 4: nutritionalUnderstandingRate (>=90: +3, >=70: +1) ---
  if (nutritionalUnderstandingRate >= 90) score += 3;
  else if (nutritionalUnderstandingRate >= 70) score += 1;

  // --- Bonus 5: independenceRate (>=80: +3, >=60: +1) ---
  if (independenceRate >= 80) score += 3;
  else if (independenceRate >= 60) score += 1;

  // --- Bonus 6: compositeEnjoymentRate (>=90: +3, >=70: +1) ---
  if (compositeEnjoymentRate >= 90) score += 3;
  else if (compositeEnjoymentRate >= 70) score += 1;

  // --- Bonus 7: progressMakingRate (>=80: +3, >=60: +1) ---
  if (progressMakingRate >= 80) score += 3;
  else if (progressMakingRate >= 60) score += 1;

  // --- Bonus 8: goalAchievementRate (>=80: +2, >=60: +1) ---
  if (goalAchievementRate >= 80) score += 2;
  else if (goalAchievementRate >= 60) score += 1;

  // --- Bonus 9: avgStaffScore (>=4.0: +2, >=3.0: +1) ---
  if ((avgStaffScore ?? 0) >= 4.0) score += 2;
  else if ((avgStaffScore ?? 0) >= 3.0) score += 1;

  // ── Penalties (4 penalties, all guarded by array.length > 0) ──────────

  // Penalty 1: kitchenSafetyRate < 50 → -5 (guarded)
  if (kitchenSafetyRate < 50 && kitchen_safety_records.length > 0) score -= 5;

  // Penalty 2: cookingParticipationRate < 40 → -5 (guarded)
  if (cookingParticipationRate < 40 && cooking_session_records.length > 0) score -= 5;

  // Penalty 3: nutritionalUnderstandingRate < 30 → -4 (guarded)
  if (nutritionalUnderstandingRate < 30 && nutritional_understanding_records.length > 0) score -= 4;

  // Penalty 4: independenceRate < 20 → -4 (guarded)
  if (independenceRate < 20 && independence_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const cooking_rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  // Cooking participation strengths
  if (cookingParticipationRate >= 90 && totalCookingSessions > 0) {
    strengths.push(
      `${cookingParticipationRate}% cooking session participation — children are consistently attending and taking part in cooking activities, demonstrating strong engagement with kitchen skills development.`,
    );
  } else if (cookingParticipationRate >= 70 && totalCookingSessions > 0) {
    strengths.push(
      `${cookingParticipationRate}% cooking session participation rate — good levels of children's involvement in cooking activities across the home.`,
    );
  }

  // Kitchen safety strengths
  if (kitchenSafetyRate >= 95 && totalKitchenSafetyRecords > 0) {
    strengths.push(
      `${kitchenSafetyRate}% kitchen safety compliance — children demonstrate excellent safety awareness and competence in the kitchen environment.`,
    );
  } else if (kitchenSafetyRate >= 80 && totalKitchenSafetyRecords > 0) {
    strengths.push(
      `${kitchenSafetyRate}% kitchen safety compliance rate — strong safety standards are being maintained across kitchen activities.`,
    );
  }

  // Meal preparation strengths
  if (mealPreparationRate >= 90 && totalMealPrepRecords > 0) {
    strengths.push(
      `${mealPreparationRate}% of children are at assisted level or above in meal preparation — children are actively developing practical cooking competencies.`,
    );
  } else if (mealPreparationRate >= 70 && totalMealPrepRecords > 0) {
    strengths.push(
      `${mealPreparationRate}% meal preparation competency rate — the majority of children are progressing well through cooking skill levels.`,
    );
  }

  // Nutritional understanding strengths
  if (nutritionalUnderstandingRate >= 90 && totalNutritionalRecords > 0) {
    strengths.push(
      `${nutritionalUnderstandingRate}% nutritional understanding demonstrated — children have an excellent grasp of nutrition, healthy eating, and dietary awareness.`,
    );
  } else if (nutritionalUnderstandingRate >= 70 && totalNutritionalRecords > 0) {
    strengths.push(
      `${nutritionalUnderstandingRate}% nutritional understanding rate — good levels of children's knowledge about nutrition and healthy eating.`,
    );
  }

  // Independence strengths
  if (independenceRate >= 80 && totalIndependenceRecords > 0) {
    strengths.push(
      `${independenceRate}% of children are mostly or fully independent in cooking-related tasks — outstanding progress in building self-sufficiency and life skills.`,
    );
  } else if (independenceRate >= 60 && totalIndependenceRecords > 0) {
    strengths.push(
      `${independenceRate}% independence rate in cooking tasks — good progress toward children managing food preparation with minimal support.`,
    );
  }

  // Enjoyment strengths
  if (compositeEnjoymentRate >= 90 && totalEnjoymentDenom > 0) {
    strengths.push(
      `${compositeEnjoymentRate}% child enjoyment across cooking activities — children genuinely enjoy their cooking experiences, supporting sustained engagement and skill development.`,
    );
  } else if (compositeEnjoymentRate >= 70 && totalEnjoymentDenom > 0) {
    strengths.push(
      `${compositeEnjoymentRate}% child enjoyment rate — the majority of children find cooking activities enjoyable and motivating.`,
    );
  }

  // Progression strengths
  if (progressMakingRate >= 80 && totalIndependenceRecords > 0) {
    strengths.push(
      `${progressMakingRate}% of children are making progress in cooking independence — clear skill development trajectories are being supported.`,
    );
  } else if (progressMakingRate >= 60 && totalIndependenceRecords > 0) {
    strengths.push(
      `${progressMakingRate}% of children showing progress in cooking independence — the majority are developing their skills over time.`,
    );
  }

  // Goal achievement strengths
  if (goalAchievementRate >= 80 && goalsSet > 0) {
    strengths.push(
      `${goalAchievementRate}% of cooking independence goals achieved — children are meeting their personalised targets for kitchen skills development.`,
    );
  } else if (goalAchievementRate >= 60 && goalsSet > 0) {
    strengths.push(
      `${goalAchievementRate}% goal achievement rate — the majority of cooking independence goals are being met.`,
    );
  }

  // Staff assessment strengths
  if ((avgStaffScore ?? 0) >= 4.0 && totalMealPrepRecords > 0) {
    strengths.push(
      `Staff assessment scores averaging ${avgStaffScore}/5 — staff consistently rate children's meal preparation skills highly, reflecting genuine competency development.`,
    );
  } else if ((avgStaffScore ?? 0) >= 3.0 && totalMealPrepRecords > 0) {
    strengths.push(
      `Staff assessment scores averaging ${avgStaffScore}/5 — staff rate children's meal preparation skills positively.`,
    );
  }

  // Child coverage strengths
  if (cookingChildCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has participated in cooking sessions — cooking skills development is inclusive and accessible to all children in the home.",
    );
  } else if (cookingChildCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${cookingChildCoverage}% of children have participated in cooking sessions — strong coverage ensuring most children are developing kitchen skills.`,
    );
  }

  // Food hygiene strengths
  if (foodHygieneRate >= 95 && totalKitchenSafetyRecords > 0) {
    strengths.push(
      `${foodHygieneRate}% food hygiene compliance — children demonstrate excellent food hygiene practices in the kitchen.`,
    );
  }

  // Cross-contamination awareness strengths
  if (crossContaminationRate >= 90 && totalKitchenSafetyRecords > 0) {
    strengths.push(
      `${crossContaminationRate}% cross-contamination awareness — children understand allergen management and safe food handling to protect themselves and others.`,
    );
  }

  // Dish completion strengths
  if (dishCompletionRate >= 90 && totalCookingSessions > 0) {
    strengths.push(
      `${dishCompletionRate}% dish completion rate — children consistently complete their cooking tasks, building confidence and a sense of achievement.`,
    );
  }

  // Recipe choice strengths
  if (recipeChoiceRate >= 70 && totalCookingSessions > 0) {
    strengths.push(
      `${recipeChoiceRate}% of sessions where the child chose the recipe — children's voice and choice are embedded in cooking activities.`,
    );
  }

  // Dish variety strengths
  if (uniqueDishCategories >= 6 && totalCookingSessions > 0) {
    strengths.push(
      `Cooking sessions span ${uniqueDishCategories} different dish categories — children are gaining diverse culinary experience across breakfast, lunch, dinner, baking, and cultural cuisine.`,
    );
  }

  // Transition relevance strengths
  if (transitionRelevanceRate >= 80 && totalIndependenceRecords > 0) {
    strengths.push(
      `${transitionRelevanceRate}% of independence assessments are transition-relevant — cooking skills development is actively supporting children's preparation for independent living.`,
    );
  }

  // Nutritional application strengths
  if (applicationRate >= 80 && totalNutritionalRecords > 0) {
    strengths.push(
      `${applicationRate}% of children can apply their nutritional knowledge practically — understanding is translating into real dietary choices and cooking decisions.`,
    );
  }

  // Topic variety strengths
  if (uniqueTopics >= 7 && totalNutritionalRecords > 0) {
    strengths.push(
      `Nutritional education covers ${uniqueTopics} different topics — comprehensive coverage ensuring children develop a rounded understanding of nutrition.`,
    );
  }

  // Risk assessment strengths
  if (riskAssessmentRate >= 90 && totalKitchenSafetyRecords > 0) {
    strengths.push(
      `${riskAssessmentRate}% of kitchen safety records have completed risk assessments — robust risk management is embedded in cooking activities.`,
    );
  }

  // Waste minimal strengths
  if (wasteMinimalRate >= 80 && totalMealPrepRecords > 0) {
    strengths.push(
      `${wasteMinimalRate}% of meal preparations demonstrate minimal food waste — children are learning to cook efficiently and sustainably.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  // Cooking participation concerns
  if (cookingParticipationRate < 40 && totalCookingSessions > 0) {
    concerns.push(
      `Only ${cookingParticipationRate}% cooking session participation — the majority of children are not attending cooking sessions, undermining their development of essential life skills.`,
    );
  } else if (cookingParticipationRate < 70 && cookingParticipationRate >= 40 && totalCookingSessions > 0) {
    concerns.push(
      `Cooking session participation at ${cookingParticipationRate}% — not all children are regularly taking part in cooking activities.`,
    );
  }

  // Kitchen safety concerns
  if (kitchenSafetyRate < 50 && totalKitchenSafetyRecords > 0) {
    concerns.push(
      `Only ${kitchenSafetyRate}% kitchen safety compliance — the majority of safety assessments show non-compliance, indicating a serious risk to children's safety in the kitchen.`,
    );
  } else if (kitchenSafetyRate < 80 && kitchenSafetyRate >= 50 && totalKitchenSafetyRecords > 0) {
    concerns.push(
      `Kitchen safety compliance at ${kitchenSafetyRate}% — inconsistent safety practices in the kitchen require attention to protect children.`,
    );
  }

  // Meal preparation concerns
  if (mealPreparationRate < 40 && totalMealPrepRecords > 0) {
    concerns.push(
      `Only ${mealPreparationRate}% of children at assisted level or above in meal preparation — the majority remain at observation or not-introduced level, indicating insufficient opportunity to develop practical cooking skills.`,
    );
  } else if (mealPreparationRate < 70 && mealPreparationRate >= 40 && totalMealPrepRecords > 0) {
    concerns.push(
      `Meal preparation competency at ${mealPreparationRate}% — not all children are progressing through cooking skill levels at the expected rate.`,
    );
  }

  // Nutritional understanding concerns
  if (nutritionalUnderstandingRate < 30 && totalNutritionalRecords > 0) {
    concerns.push(
      `Only ${nutritionalUnderstandingRate}% of children demonstrate nutritional understanding — the majority lack basic knowledge about nutrition, healthy eating, and dietary awareness.`,
    );
  } else if (nutritionalUnderstandingRate < 70 && nutritionalUnderstandingRate >= 30 && totalNutritionalRecords > 0) {
    concerns.push(
      `Nutritional understanding at ${nutritionalUnderstandingRate}% — not all children are developing adequate knowledge about nutrition and healthy eating.`,
    );
  }

  // Independence concerns
  if (independenceRate < 20 && totalIndependenceRecords > 0) {
    concerns.push(
      `Only ${independenceRate}% of children are mostly or fully independent in cooking tasks — the vast majority remain dependent on staff support, limiting their preparation for independent living.`,
    );
  } else if (independenceRate < 60 && independenceRate >= 20 && totalIndependenceRecords > 0) {
    concerns.push(
      `Cooking independence rate at ${independenceRate}% — many children still require significant support with cooking-related tasks.`,
    );
  }

  // Enjoyment concerns
  if (compositeEnjoymentRate < 40 && totalEnjoymentDenom > 0) {
    concerns.push(
      `Only ${compositeEnjoymentRate}% child enjoyment across cooking activities — the majority of children are not finding cooking activities enjoyable, which may indicate poorly designed or inaccessible sessions.`,
    );
  } else if (compositeEnjoymentRate < 70 && compositeEnjoymentRate >= 40 && totalEnjoymentDenom > 0) {
    concerns.push(
      `Child enjoyment in cooking activities at ${compositeEnjoymentRate}% — not all children are finding cooking activities motivating or enjoyable.`,
    );
  }

  // Incident concern
  if (incidentRate >= 20 && totalKitchenSafetyRecords > 0) {
    concerns.push(
      `Kitchen incidents reported in ${incidentRate}% of safety records — a high rate of incidents indicates safety protocols may be inadequate or supervision insufficient.`,
    );
  } else if (incidentRate >= 10 && incidentRate < 20 && totalKitchenSafetyRecords > 0) {
    concerns.push(
      `Kitchen incidents reported in ${incidentRate}% of safety records — while not critical, the incident rate should be monitored and addressed through targeted safety training.`,
    );
  }

  // Decline concern
  if (declineRate >= 20 && totalMealPrepRecords > 0) {
    concerns.push(
      `${declineRate}% of meal preparation assessments show declining skills — some children's cooking abilities are regressing, suggesting insufficient practice or changing circumstances.`,
    );
  }

  if (indDeclineRate >= 20 && totalIndependenceRecords > 0) {
    concerns.push(
      `${indDeclineRate}% of independence assessments show declining progress — some children are losing cooking independence, which may indicate disengagement or inadequate support.`,
    );
  }

  // Child coverage concerns
  if (cookingChildCoverage < 50 && total_children > 0 && totalCookingSessions > 0) {
    concerns.push(
      `Only ${cookingChildCoverage}% of children have participated in cooking sessions — many children are missing out on essential kitchen skills development.`,
    );
  }

  // Safety coverage concerns
  if (safetyChildCoverage < 50 && total_children > 0 && totalKitchenSafetyRecords > 0) {
    concerns.push(
      `Only ${safetyChildCoverage}% of children have kitchen safety assessments — many children have not been formally assessed for kitchen safety competence.`,
    );
  }

  // Food hygiene concerns
  if (foodHygieneRate < 60 && totalKitchenSafetyRecords > 0) {
    concerns.push(
      `Food hygiene compliance at only ${foodHygieneRate}% — poor food hygiene practices in the kitchen pose a direct risk to children's health.`,
    );
  }

  // Cross-contamination concerns
  if (crossContaminationRate < 50 && totalKitchenSafetyRecords > 0) {
    concerns.push(
      `Only ${crossContaminationRate}% cross-contamination awareness — the majority of children do not demonstrate adequate understanding of allergen management and cross-contamination risks.`,
    );
  }

  // Risk assessment concerns
  if (riskAssessmentRate < 50 && totalKitchenSafetyRecords > 0) {
    concerns.push(
      `Only ${riskAssessmentRate}% of kitchen safety records have completed risk assessments — cooking activities are taking place without adequate risk management.`,
    );
  }

  // No cooking sessions despite other records
  if (totalCookingSessions === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No cooking session records exist despite children being on placement — children are not being given structured opportunities to develop cooking skills through supervised sessions.",
    );
  }

  // No safety records despite cooking sessions
  if (totalKitchenSafetyRecords === 0 && totalCookingSessions > 0) {
    concerns.push(
      "No kitchen safety assessments recorded despite cooking sessions taking place — children's safety competence in the kitchen is not being formally assessed or documented.",
    );
  }

  // No nutritional records despite cooking activity
  if (totalNutritionalRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No nutritional understanding assessments recorded — children's knowledge of nutrition and healthy eating is not being formally evaluated as part of their cooking skills development.",
    );
  }

  // No independence records despite children
  if (totalIndependenceRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No cooking independence records exist — children's progress toward self-sufficient food preparation is not being tracked or supported through structured independence planning.",
    );
  }

  // Goal setting concerns
  if (goalSettingRate < 50 && totalIndependenceRecords > 0) {
    concerns.push(
      `Only ${goalSettingRate}% of independence records have goals set — personalised targets for cooking independence are not being established for most children.`,
    );
  }

  // Barriers concern
  if (barriersRate >= 50 && totalIndependenceRecords > 0 && supportPlanRate < 50) {
    concerns.push(
      `${barriersRate}% of independence records identify barriers but only ${supportPlanRate}% have support plans in place — identified barriers to cooking independence are not being addressed with structured support.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  const recommendations: CookingKitchenRecommendation[] = [];
  let rank = 0;

  if (kitchenSafetyRate < 50 && totalKitchenSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review kitchen safety protocols — implement comprehensive safety training for all children before they participate in cooking, ensure risk assessments are completed for every session, and increase supervision ratios until safety compliance improves.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Safeguarding",
    });
  }

  if (cookingParticipationRate < 40 && totalCookingSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate barriers to cooking session participation and develop strategies to increase attendance — explore children's interests, adapt session formats, offer varied timing options, and ensure cooking activities are enjoyable and accessible to all abilities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities, hobbies",
    });
  }

  if (nutritionalUnderstandingRate < 30 && totalNutritionalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an age-appropriate nutritional education programme — use practical, hands-on approaches linked to cooking sessions to teach children about food groups, balanced diets, hydration, and reading food labels.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities, hobbies",
    });
  }

  if (independenceRate < 20 && totalIndependenceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop individual cooking independence plans for every child — set personalised, achievable goals with clear progression pathways from supported to independent cooking, particularly for children approaching transition age.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (totalCookingSessions === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a structured cooking session programme — create a weekly cooking schedule that offers every child the opportunity to participate in supervised cooking activities, building essential life skills.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities, hobbies",
    });
  }

  if (totalKitchenSafetyRecords === 0 && totalCookingSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement kitchen safety assessments for all children — every child who participates in cooking must have a documented safety competency assessment covering knife skills, appliance use, food hygiene, and fire safety awareness.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Safeguarding",
    });
  }

  if (foodHygieneRate < 60 && totalKitchenSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address poor food hygiene compliance through targeted training — ensure all children understand and practise hand washing, surface cleaning, correct food storage temperatures, and safe food handling before cooking sessions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Safeguarding",
    });
  }

  if (incidentRate >= 20 && totalKitchenSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review kitchen incident patterns and implement targeted safety interventions — analyse incident causes, increase supervision where needed, and ensure all children receive refresher safety training before resuming cooking activities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Safeguarding",
    });
  }

  if (crossContaminationRate < 50 && totalKitchenSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide comprehensive allergen and cross-contamination training — ensure every child understands the risks associated with food allergies, how to prevent cross-contamination, and the importance of checking dietary requirements before cooking.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Safeguarding",
    });
  }

  if (riskAssessmentRate < 50 && totalKitchenSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure risk assessments are completed for all cooking activities — risk assessments should cover the equipment used, the child's competency level, allergen considerations, and supervision requirements for each session.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Safeguarding",
    });
  }

  if (compositeEnjoymentRate < 40 && totalEnjoymentDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and redesign cooking activities to improve children's enjoyment — consult children about their food preferences and interests, offer culturally diverse recipes, introduce baking and fun cooking challenges, and celebrate achievements.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (totalNutritionalRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce nutritional understanding assessments linked to cooking sessions — assess children's knowledge of food groups, balanced diets, and healthy eating to support their health education and cooking development.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities, hobbies",
    });
  }

  if (totalIndependenceRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin tracking cooking independence for all children — establish baseline assessments and set personalised independence goals, particularly for older children and those approaching transition.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (goalSettingRate < 50 && totalIndependenceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child has personalised cooking independence goals — goals should be specific, measurable, and reviewed regularly, with clear pathways from support to independence in key kitchen skill areas.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (cookingChildCoverage < 50 && total_children > 0 && totalCookingSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend cooking session participation to all children — identify children who have not yet participated and create accessible, engaging opportunities tailored to their interests, abilities, and dietary requirements.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities, hobbies",
    });
  }

  if (
    cookingParticipationRate >= 40 &&
    cookingParticipationRate < 70 &&
    totalCookingSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop strategies to increase cooking session attendance to at least 70% — consider flexible scheduling, peer cooking partnerships, themed cooking days, and linking sessions to children's cultural backgrounds and food preferences.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities, hobbies",
    });
  }

  if (
    kitchenSafetyRate >= 50 &&
    kitchenSafetyRate < 80 &&
    totalKitchenSafetyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve kitchen safety compliance to at least 80% — review areas of non-compliance, provide refresher training on specific equipment and procedures, and implement a kitchen safety champion programme.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Safeguarding",
    });
  }

  if (
    nutritionalUnderstandingRate >= 30 &&
    nutritionalUnderstandingRate < 70 &&
    totalNutritionalRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance nutritional education through practical, cooking-linked activities — use meal preparation as an opportunity to teach nutrition, involve children in menu planning, and link nutritional topics to their own dietary choices.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities, hobbies",
    });
  }

  if (
    independenceRate >= 20 &&
    independenceRate < 60 &&
    totalIndependenceRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Accelerate cooking independence development through graduated responsibility — create a skill progression ladder from supported cooking to independent meal planning and preparation, with regular review of each child's progress.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (
    compositeEnjoymentRate >= 40 &&
    compositeEnjoymentRate < 70 &&
    totalEnjoymentDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's enjoyment of cooking activities by broadening the range of recipes, involving children in choosing what to cook, introducing cooking challenges or competitions, and celebrating achievements through family-style meals.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    barriersRate >= 50 &&
    supportPlanRate < 50 &&
    totalIndependenceRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address identified barriers to cooking independence with structured support plans — ensure every child with identified barriers has a plan in place with specific strategies, resources, and timescales for overcoming those barriers.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (linkedToCookingRate < 50 && totalNutritionalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen the link between nutritional education and cooking sessions — embed nutritional learning within practical cooking activities to help children apply their knowledge in real cooking situations.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, activities, hobbies",
    });
  }

  if (transitionRelevanceRate < 50 && totalIndependenceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure cooking independence assessments explicitly consider transition relevance — cooking is a critical life skill for independent living. Independence plans should align with pathway planning and transition timescales.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  const insights: CookingKitchenInsight[] = [];

  // -- Critical insights --

  if (kitchenSafetyRate < 50 && totalKitchenSafetyRecords > 0) {
    insights.push({
      text: `Only ${kitchenSafetyRate}% kitchen safety compliance. Widespread safety non-compliance in the kitchen poses a direct safeguarding risk. Ofsted inspectors will expect to see that children are safe and supervised appropriately during cooking activities — this level of non-compliance could result in regulatory action.`,
      severity: "critical",
    });
  }

  if (cookingParticipationRate < 40 && totalCookingSessions > 0) {
    insights.push({
      text: `Only ${cookingParticipationRate}% cooking session participation. Low participation means most children are not developing essential life skills in food preparation. Cooking is a fundamental independence skill — Reg 5 requires the home to promote children's development through engaging activities.`,
      severity: "critical",
    });
  }

  if (nutritionalUnderstandingRate < 30 && totalNutritionalRecords > 0) {
    insights.push({
      text: `Only ${nutritionalUnderstandingRate}% nutritional understanding demonstrated. The majority of children lack basic nutritional knowledge, limiting their ability to make healthy food choices. This undermines the home's responsibility to promote children's health and wellbeing under Reg 5.`,
      severity: "critical",
    });
  }

  if (independenceRate < 20 && totalIndependenceRecords > 0) {
    insights.push({
      text: `Only ${independenceRate}% cooking independence. The vast majority of children remain dependent on staff for food preparation. This represents a significant gap in preparing children for independent living and will be scrutinised in any assessment of the home's approach to developing life skills.`,
      severity: "critical",
    });
  }

  if (totalCookingSessions === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No cooking session records despite children being on placement. Cooking is one of the most important life skills for children preparing for independence — the absence of structured cooking opportunities is a significant gap in the home's programme of activities.",
      severity: "critical",
    });
  }

  if (foodHygieneRate < 40 && totalKitchenSafetyRecords > 0) {
    insights.push({
      text: `Food hygiene compliance at only ${foodHygieneRate}%. Poor food hygiene practices pose a direct health risk to children. This is a safeguarding concern that must be addressed before children continue to participate in cooking activities.`,
      severity: "critical",
    });
  }

  if (incidentRate >= 30 && totalKitchenSafetyRecords > 0) {
    insights.push({
      text: `Kitchen incidents reported in ${incidentRate}% of safety records. This high incident rate suggests fundamental problems with kitchen safety management — either supervision is inadequate, safety training is ineffective, or risk assessments are not being properly completed.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    cookingParticipationRate >= 40 &&
    cookingParticipationRate < 70 &&
    totalCookingSessions > 0
  ) {
    insights.push({
      text: `Cooking participation at ${cookingParticipationRate}% — improving but a significant number of children are still not regularly taking part in cooking sessions. Exploring barriers and adapting session formats could increase engagement.`,
      severity: "warning",
    });
  }

  if (
    kitchenSafetyRate >= 50 &&
    kitchenSafetyRate < 80 &&
    totalKitchenSafetyRecords > 0
  ) {
    insights.push({
      text: `Kitchen safety compliance at ${kitchenSafetyRate}% — while improving, inconsistent safety compliance means some children are cooking without demonstrating adequate safety awareness. Targeted training on specific areas of weakness would help.`,
      severity: "warning",
    });
  }

  if (
    mealPreparationRate >= 40 &&
    mealPreparationRate < 70 &&
    totalMealPrepRecords > 0
  ) {
    insights.push({
      text: `Meal preparation competency at ${mealPreparationRate}% — some children are progressing but many remain at early skill levels. Consider whether children are receiving enough hands-on practice and whether teaching methods suit different learning styles.`,
      severity: "warning",
    });
  }

  if (
    nutritionalUnderstandingRate >= 30 &&
    nutritionalUnderstandingRate < 70 &&
    totalNutritionalRecords > 0
  ) {
    insights.push({
      text: `Nutritional understanding at ${nutritionalUnderstandingRate}% — some children demonstrate knowledge but many do not. Linking nutritional education directly to cooking sessions and real food choices may improve understanding.`,
      severity: "warning",
    });
  }

  if (
    independenceRate >= 20 &&
    independenceRate < 60 &&
    totalIndependenceRecords > 0
  ) {
    insights.push({
      text: `Cooking independence at ${independenceRate}% — while some children are developing self-sufficiency, many still require significant support. Graduated responsibility programmes with clear milestones would help accelerate independence.`,
      severity: "warning",
    });
  }

  if (
    compositeEnjoymentRate >= 40 &&
    compositeEnjoymentRate < 70 &&
    totalEnjoymentDenom > 0
  ) {
    insights.push({
      text: `Child enjoyment across cooking activities at ${compositeEnjoymentRate}% — not all children are finding cooking engaging. Children who enjoy cooking are more likely to develop and maintain these skills into adulthood. Adapting activities to children's interests and cultural backgrounds may help.`,
      severity: "warning",
    });
  }

  if (
    declineRate >= 10 &&
    declineRate < 20 &&
    totalMealPrepRecords > 0
  ) {
    insights.push({
      text: `${declineRate}% of meal preparation assessments show declining skills — some regression in cooking abilities may indicate disruption, reduced practice opportunities, or changing circumstances that should be explored.`,
      severity: "warning",
    });
  }

  if (
    goalAchievementRate >= 40 &&
    goalAchievementRate < 60 &&
    goalsSet > 0
  ) {
    insights.push({
      text: `Goal achievement rate at ${goalAchievementRate}% — while some goals are being met, many are not. Review whether goals are realistic, appropriately supported, and regularly reviewed to ensure children are making meaningful progress.`,
      severity: "warning",
    });
  }

  if (
    safetyChildCoverage >= 50 &&
    safetyChildCoverage < 80 &&
    total_children > 0 &&
    totalKitchenSafetyRecords > 0
  ) {
    insights.push({
      text: `Kitchen safety assessments cover ${safetyChildCoverage}% of children — while most have been assessed, gaps in coverage mean some children's kitchen safety competence is unknown. All children who cook should have documented safety assessments.`,
      severity: "warning",
    });
  }

  if (
    linkedToCookingRate >= 30 &&
    linkedToCookingRate < 50 &&
    totalNutritionalRecords > 0
  ) {
    insights.push({
      text: `Only ${linkedToCookingRate}% of nutritional education is linked to cooking sessions — nutritional learning is most effective when integrated with practical cooking. Strengthening this link would improve both nutritional understanding and cooking confidence.`,
      severity: "warning",
    });
  }

  if (
    (avgStaffScore ?? 0) >= 2.0 &&
    (avgStaffScore ?? 0) < 3.0 &&
    totalMealPrepRecords > 0
  ) {
    insights.push({
      text: `Staff assessment scores averaging ${avgStaffScore}/5 — children's meal preparation skills are rated below the midpoint. More structured teaching, practice opportunities, and progression pathways may help improve competence.`,
      severity: "warning",
    });
  }

  // Skill area gaps
  const allSkillAreas = ["planning", "shopping", "budgeting", "preparation", "cooking", "plating", "cleaning_up", "full_meal"];
  const skillAreaCounts: Record<string, number> = {};
  for (const m of meal_preparation_records) {
    skillAreaCounts[m.skill_area] = (skillAreaCounts[m.skill_area] ?? 0) + 1;
  }
  const missingSkillAreas = allSkillAreas.filter(
    (a) => !skillAreaCounts[a] || skillAreaCounts[a] === 0,
  );
  if (missingSkillAreas.length >= 4 && totalMealPrepRecords > 3) {
    insights.push({
      text: `Meal preparation records concentrated in limited skill areas — no records for ${missingSkillAreas.join(", ")}. A comprehensive cooking programme should cover the full range from planning and shopping through to cooking, plating, and cleaning up.`,
      severity: "warning",
    });
  }

  // Independence area gaps
  const allIndAreas = ["menu_planning", "shopping_list", "budget_management", "independent_cooking", "kitchen_cleaning", "food_storage", "appliance_use", "recipe_selection", "hosting_meal", "packed_lunch_preparation"];
  const indAreaCounts: Record<string, number> = {};
  for (const r of independence_records) {
    indAreaCounts[r.independence_area] = (indAreaCounts[r.independence_area] ?? 0) + 1;
  }
  const missingIndAreas = allIndAreas.filter(
    (a) => !indAreaCounts[a] || indAreaCounts[a] === 0,
  );
  if (missingIndAreas.length >= 5 && totalIndependenceRecords > 3) {
    insights.push({
      text: `Cooking independence assessments concentrated in limited areas — no records for ${missingIndAreas.join(", ")}. Independence development should cover all aspects from menu planning and budgeting through to hosting meals and packed lunch preparation.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (cooking_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding cooking and kitchen skills development — children participate actively in cooking sessions, kitchen safety is well-managed, meal preparation skills are progressing strongly, nutritional understanding is evident, and cooking independence is being effectively supported. This contributes positively to children's life skills and preparation for adulthood.",
      severity: "positive",
    });
  }

  if (
    cookingParticipationRate >= 90 &&
    cookingEngagementRate >= 90 &&
    totalCookingSessions > 0
  ) {
    insights.push({
      text: `${cookingParticipationRate}% participation with ${cookingEngagementRate}% engagement in cooking sessions — children are not just attending but genuinely engaging with cooking activities, demonstrating that the programme is well-designed and motivating.`,
      severity: "positive",
    });
  }

  if (
    kitchenSafetyRate >= 95 &&
    foodHygieneRate >= 95 &&
    totalKitchenSafetyRecords > 0
  ) {
    insights.push({
      text: `${kitchenSafetyRate}% safety compliance with ${foodHygieneRate}% food hygiene — exemplary kitchen safety culture demonstrating that children can cook safely and hygienically. This reflects excellent staff teaching and supervision.`,
      severity: "positive",
    });
  }

  if (
    mealPrepIndependenceRate >= 60 &&
    totalMealPrepRecords > 0
  ) {
    insights.push({
      text: `${mealPrepIndependenceRate}% of children cooking independently or at teaching level — children are developing genuine self-sufficiency in meal preparation, a critical skill for independent living and transition from care.`,
      severity: "positive",
    });
  }

  if (
    nutritionalUnderstandingRate >= 90 &&
    applicationRate >= 80 &&
    totalNutritionalRecords > 0
  ) {
    insights.push({
      text: `${nutritionalUnderstandingRate}% nutritional understanding with ${applicationRate}% able to apply knowledge — children are not just learning about nutrition but translating that knowledge into practical food choices and cooking decisions.`,
      severity: "positive",
    });
  }

  if (
    compositeEnjoymentRate >= 90 &&
    totalEnjoymentDenom > 0
  ) {
    insights.push({
      text: `${compositeEnjoymentRate}% child enjoyment across cooking activities — children genuinely enjoy cooking, which strongly supports long-term skill retention and the development of healthy eating habits into adulthood.`,
      severity: "positive",
    });
  }

  if (
    independenceRate >= 80 &&
    transitionRelevanceRate >= 80 &&
    totalIndependenceRecords > 0
  ) {
    insights.push({
      text: `${independenceRate}% cooking independence with ${transitionRelevanceRate}% assessed as transition-relevant — the home is effectively using cooking skills development as a pathway to independence, directly supporting children's preparation for adult life.`,
      severity: "positive",
    });
  }

  if (
    goalAchievementRate >= 80 &&
    progressMakingRate >= 80 &&
    goalsSet > 0 &&
    totalIndependenceRecords > 0
  ) {
    insights.push({
      text: `${goalAchievementRate}% goal achievement with ${progressMakingRate}% making progress — personalised cooking independence targets are being set and met, demonstrating a structured and effective approach to building children's self-sufficiency.`,
      severity: "positive",
    });
  }

  if (
    cookingChildCoverage >= 100 &&
    total_children > 0 &&
    totalCookingSessions > 0
  ) {
    insights.push({
      text: "Every child has participated in cooking sessions — cooking skills development is truly inclusive, ensuring all children have the opportunity to learn essential life skills regardless of their background, abilities, or dietary requirements.",
      severity: "positive",
    });
  }

  if (
    uniqueDishCategories >= 6 &&
    recipeChoiceRate >= 70 &&
    totalCookingSessions > 0
  ) {
    insights.push({
      text: `Cooking sessions span ${uniqueDishCategories} dish categories with ${recipeChoiceRate}% child recipe choice — children are experiencing diverse cooking while having genuine voice in what they cook. This combination of variety and choice is excellent practice.`,
      severity: "positive",
    });
  }

  if (
    wasteMinimalRate >= 80 &&
    portionRate >= 80 &&
    totalMealPrepRecords > 0
  ) {
    insights.push({
      text: `${wasteMinimalRate}% minimal waste with ${portionRate}% appropriate portions — children are learning to cook efficiently and sustainably, developing awareness of food waste and portion management that will serve them well in independent living.`,
      severity: "positive",
    });
  }

  if (
    incidentRate === 0 &&
    totalKitchenSafetyRecords > 0
  ) {
    insights.push({
      text: "Zero kitchen incidents recorded — the combination of effective safety training, appropriate supervision, and children's growing competence has created a safe cooking environment where children can develop skills with confidence.",
      severity: "positive",
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════════════════════════

  let headline: string;

  if (cooking_rating === "outstanding") {
    headline =
      "Outstanding cooking and kitchen skills development — children participate actively, kitchen safety is strong, meal preparation skills are progressing well, nutritional understanding is evident, and independence in cooking is being effectively supported.";
  } else if (cooking_rating === "good") {
    headline = `Good cooking and kitchen skills development — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (cooking_rating === "adequate") {
    headline = `Adequate cooking and kitchen skills development — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children develop essential cooking skills, kitchen safety, and nutritional awareness.`;
  } else {
    headline = `Cooking and kitchen skills development is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve cooking participation, kitchen safety, meal preparation skills, and children's independence in the kitchen.`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════════

  return {
    cooking_rating,
    cooking_score: score,
    headline,
    total_cooking_sessions: totalCookingSessions,
    total_kitchen_safety_records: totalKitchenSafetyRecords,
    total_meal_preparation_records: totalMealPrepRecords,
    total_nutritional_records: totalNutritionalRecords,
    total_independence_records: totalIndependenceRecords,
    cooking_participation_rate: cookingParticipationRate,
    kitchen_safety_rate: kitchenSafetyRate,
    meal_preparation_rate: mealPreparationRate,
    nutritional_understanding_rate: nutritionalUnderstandingRate,
    independence_rate: independenceRate,
    child_enjoyment_rate: compositeEnjoymentRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
