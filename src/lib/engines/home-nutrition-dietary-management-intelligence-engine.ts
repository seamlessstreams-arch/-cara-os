// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NUTRITION & DIETARY MANAGEMENT INTELLIGENCE ENGINE
// Evaluates nutrition and dietary management: meal planning compliance,
// dietary requirement tracking, nutrition assessments, food hygiene standards,
// and special diet management for children in care.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 9 (Promoting good health), Reg 6 (Quality of care),
// Reg 7 (Children's plans), Reg 13 (Leadership and management).
// SCCIF: "Children's health and well-being".
// Store keys: mealPlanRecords, dietaryRequirementRecords,
//             nutritionAssessmentRecords, foodHygieneRecords, specialDietRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MealPlanRecordInput {
  id: string;
  child_id: string;
  plan_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  planned: boolean;
  delivered: boolean;
  meets_nutritional_guidelines: boolean;
  child_involved_in_choice: boolean;
  child_feedback_positive: boolean | null;
  portion_appropriate: boolean;
  fresh_ingredients_used: boolean;
  cultural_dietary_needs_met: boolean;
  allergen_check_completed: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface DietaryRequirementRecordInput {
  id: string;
  child_id: string;
  requirement_type: "allergy" | "intolerance" | "medical" | "cultural" | "religious" | "preference" | "vegan" | "vegetarian";
  description: string;
  severity: "life_threatening" | "severe" | "moderate" | "mild";
  documented: boolean;
  care_plan_updated: boolean;
  all_staff_informed: boolean;
  kitchen_notified: boolean;
  emergency_plan_in_place: boolean;
  last_reviewed_date: string | null;
  review_due_date: string | null;
  active: boolean;
  created_at: string;
}

export interface NutritionAssessmentRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor: string;
  assessment_type: "initial" | "periodic" | "annual" | "concern_led";
  bmi_recorded: boolean;
  height_recorded: boolean;
  weight_recorded: boolean;
  dietary_intake_reviewed: boolean;
  nutritional_goals_set: boolean;
  goals_met: boolean;
  referral_to_dietitian: boolean;
  referral_completed: boolean;
  concerns_identified: string[];
  recommendations: string[];
  next_review_date: string | null;
  created_at: string;
}

export interface FoodHygieneRecordInput {
  id: string;
  inspection_date: string;
  inspector: string;
  inspection_type: "routine" | "environmental_health" | "internal_audit" | "spot_check";
  food_storage_compliant: boolean;
  temperature_records_maintained: boolean;
  preparation_area_clean: boolean;
  hand_hygiene_compliant: boolean;
  allergen_labelling_correct: boolean;
  waste_disposal_compliant: boolean;
  pest_control_adequate: boolean;
  staff_food_hygiene_trained: boolean;
  overall_score: number; // 0-100
  corrective_actions_required: number;
  corrective_actions_completed: number;
  next_inspection_due: string | null;
  created_at: string;
}

export interface SpecialDietRecordInput {
  id: string;
  child_id: string;
  diet_type: "therapeutic" | "medical" | "weight_management" | "eating_disorder" | "cultural" | "religious" | "allergy_based" | "texture_modified";
  prescribed_by: string;
  start_date: string;
  active: boolean;
  plan_documented: boolean;
  meals_compliant: number;
  meals_total: number;
  child_adherence_willing: boolean;
  staff_trained: boolean;
  monitoring_frequency: "daily" | "weekly" | "monthly";
  last_monitored_date: string | null;
  outcomes_positive: boolean | null;
  review_date: string | null;
  created_at: string;
}

export interface NutritionDietaryManagementInput {
  today: string;
  total_children: number;
  meal_plan_records: MealPlanRecordInput[];
  dietary_requirement_records: DietaryRequirementRecordInput[];
  nutrition_assessment_records: NutritionAssessmentRecordInput[];
  food_hygiene_records: FoodHygieneRecordInput[];
  special_diet_records: SpecialDietRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type NutritionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface NutritionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface NutritionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface NutritionDietaryManagementResult {
  nutrition_rating: NutritionRating;
  nutrition_score: number;
  headline: string;
  total_meal_plans: number;
  total_dietary_requirements: number;
  total_nutrition_assessments: number;
  total_food_hygiene_inspections: number;
  total_special_diets: number;
  meal_plan_compliance_rate: number;
  dietary_requirement_coverage_rate: number;
  nutrition_assessment_rate: number;
  food_hygiene_score: number;
  special_diet_adherence_rate: number;
  child_choice_rate: number;
  meal_nutritional_guideline_rate: number;
  allergen_check_rate: number;
  fresh_ingredient_rate: number;
  cultural_needs_met_rate: number;
  staff_food_hygiene_training_rate: number;
  corrective_action_completion_rate: number;
  dietary_documentation_rate: number;
  dietary_staff_informed_rate: number;
  emergency_plan_rate: number;
  nutrition_goals_met_rate: number;
  dietitian_referral_completion_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: NutritionRecommendation[];
  insights: NutritionInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): NutritionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function avgScore(records: FoodHygieneRecordInput[]): number {
  if (records.length === 0) return 0;
  const total = records.reduce((sum, r) => sum + r.overall_score, 0);
  return Math.round(total / records.length);
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(dueDate: string | null, today: string): boolean {
  if (!dueDate) return false;
  return dueDate < today;
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: NutritionRating,
  score: number,
  headline: string,
): NutritionDietaryManagementResult {
  return {
    nutrition_rating: rating,
    nutrition_score: score,
    headline,
    total_meal_plans: 0,
    total_dietary_requirements: 0,
    total_nutrition_assessments: 0,
    total_food_hygiene_inspections: 0,
    total_special_diets: 0,
    meal_plan_compliance_rate: 0,
    dietary_requirement_coverage_rate: 0,
    nutrition_assessment_rate: 0,
    food_hygiene_score: 0,
    special_diet_adherence_rate: 0,
    child_choice_rate: 0,
    meal_nutritional_guideline_rate: 0,
    allergen_check_rate: 0,
    fresh_ingredient_rate: 0,
    cultural_needs_met_rate: 0,
    staff_food_hygiene_training_rate: 0,
    corrective_action_completion_rate: 0,
    dietary_documentation_rate: 0,
    dietary_staff_informed_rate: 0,
    emergency_plan_rate: 0,
    nutrition_goals_met_rate: 0,
    dietitian_referral_completion_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeNutritionDietaryManagement(
  input: NutritionDietaryManagementInput,
): NutritionDietaryManagementResult {
  const {
    today,
    total_children,
    meal_plan_records,
    dietary_requirement_records,
    nutrition_assessment_records,
    food_hygiene_records,
    special_diet_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    meal_plan_records.length === 0 &&
    dietary_requirement_records.length === 0 &&
    nutrition_assessment_records.length === 0 &&
    food_hygiene_records.length === 0 &&
    special_diet_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess nutrition and dietary management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No nutrition or dietary management data recorded despite children on placement — meal planning, dietary requirements, and food hygiene require urgent attention.",
      ),
      concerns: [
        "No meal plan records, dietary requirements, nutrition assessments, food hygiene inspections, or special diet records exist despite children being on placement — the home cannot evidence safe and adequate nutrition and dietary management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of meal plans, dietary requirements, nutrition assessments, food hygiene inspections, and special diets to evidence the home's compliance with nutrition and dietary management standards.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all children have documented dietary requirements and that meal plans are recorded showing compliance with nutritional guidelines and individual dietary needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 6 — Quality of care",
        },
      ],
      insights: [
        {
          text: "The complete absence of nutrition and dietary management records means Ofsted cannot verify that children receive adequate nutrition, that dietary requirements are met, or that food hygiene standards are maintained. This represents a fundamental gap in Reg 9 compliance and children's health and well-being.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // ─── Meal Plan Metrics ────────────────────────────────────────────────

  const totalMealPlans = meal_plan_records.length;

  // Meal plan compliance: meals that were both planned AND delivered
  const plannedAndDelivered = meal_plan_records.filter(
    (m) => m.planned && m.delivered,
  ).length;
  const mealPlanComplianceRate = pct(plannedAndDelivered, totalMealPlans);

  // Nutritional guideline compliance
  const meetsNutritionalGuidelines = meal_plan_records.filter(
    (m) => m.meets_nutritional_guidelines,
  ).length;
  const mealNutritionalGuidelineRate = pct(
    meetsNutritionalGuidelines,
    totalMealPlans,
  );

  // Child involvement in choice
  const childInvolvedInChoice = meal_plan_records.filter(
    (m) => m.child_involved_in_choice,
  ).length;
  const childChoiceRate = pct(childInvolvedInChoice, totalMealPlans);

  // Positive child feedback (only among those who gave feedback)
  const feedbackGiven = meal_plan_records.filter(
    (m) => m.child_feedback_positive !== null,
  );
  const positiveFeedback = feedbackGiven.filter(
    (m) => m.child_feedback_positive === true,
  ).length;
  const childFeedbackPositiveRate = pct(positiveFeedback, feedbackGiven.length);

  // Portion appropriateness
  const portionAppropriate = meal_plan_records.filter(
    (m) => m.portion_appropriate,
  ).length;
  const portionAppropriateRate = pct(portionAppropriate, totalMealPlans);

  // Fresh ingredients usage
  const freshIngredients = meal_plan_records.filter(
    (m) => m.fresh_ingredients_used,
  ).length;
  const freshIngredientRate = pct(freshIngredients, totalMealPlans);

  // Cultural dietary needs met
  const culturalNeedsMet = meal_plan_records.filter(
    (m) => m.cultural_dietary_needs_met,
  ).length;
  const culturalNeedsMetRate = pct(culturalNeedsMet, totalMealPlans);

  // Allergen checks completed
  const allergenChecks = meal_plan_records.filter(
    (m) => m.allergen_check_completed,
  ).length;
  const allergenCheckRate = pct(allergenChecks, totalMealPlans);

  // Meal delivery rate (planned meals that were actually delivered)
  const plannedMeals = meal_plan_records.filter((m) => m.planned).length;
  const deliveredOfPlanned = meal_plan_records.filter(
    (m) => m.planned && m.delivered,
  ).length;
  const mealDeliveryRate = pct(deliveredOfPlanned, plannedMeals);

  // ─── Dietary Requirement Metrics ──────────────────────────────────────

  const totalDietaryRequirements = dietary_requirement_records.length;
  const activeDietaryRequirements = dietary_requirement_records.filter(
    (d) => d.active,
  );
  const totalActiveDietaryReqs = activeDietaryRequirements.length;

  // Children with documented dietary requirements vs total children
  const uniqueChildrenWithDietaryReqs = new Set(
    activeDietaryRequirements.map((d) => d.child_id),
  ).size;
  const dietaryRequirementCoverageRate =
    total_children > 0
      ? pct(uniqueChildrenWithDietaryReqs, total_children)
      : 0;

  // Documentation completeness
  const documentedRequirements = activeDietaryRequirements.filter(
    (d) => d.documented,
  ).length;
  const dietaryDocumentationRate = pct(
    documentedRequirements,
    totalActiveDietaryReqs,
  );

  // Care plan updated
  const carePlanUpdated = activeDietaryRequirements.filter(
    (d) => d.care_plan_updated,
  ).length;
  const carePlanUpdateRate = pct(carePlanUpdated, totalActiveDietaryReqs);

  // All staff informed
  const allStaffInformed = activeDietaryRequirements.filter(
    (d) => d.all_staff_informed,
  ).length;
  const dietaryStaffInformedRate = pct(
    allStaffInformed,
    totalActiveDietaryReqs,
  );

  // Kitchen notified
  const kitchenNotified = activeDietaryRequirements.filter(
    (d) => d.kitchen_notified,
  ).length;
  const kitchenNotifiedRate = pct(kitchenNotified, totalActiveDietaryReqs);

  // Emergency plans for severe/life-threatening requirements
  const severeRequirements = activeDietaryRequirements.filter(
    (d) => d.severity === "life_threatening" || d.severity === "severe",
  );
  const severeWithEmergencyPlan = severeRequirements.filter(
    (d) => d.emergency_plan_in_place,
  ).length;
  const emergencyPlanRate = pct(
    severeWithEmergencyPlan,
    severeRequirements.length,
  );

  // Overdue reviews
  const dietaryReviewsOverdue = activeDietaryRequirements.filter((d) =>
    isOverdue(d.review_due_date, today),
  ).length;
  const dietaryReviewOverdueRate = pct(
    dietaryReviewsOverdue,
    totalActiveDietaryReqs,
  );

  // Life-threatening requirements without emergency plans
  const lifeThreatening = activeDietaryRequirements.filter(
    (d) => d.severity === "life_threatening",
  );
  const lifeThreateningWithoutPlan = lifeThreatening.filter(
    (d) => !d.emergency_plan_in_place,
  ).length;

  // ─── Nutrition Assessment Metrics ─────────────────────────────────────

  const totalNutritionAssessments = nutrition_assessment_records.length;

  // Assessment coverage: unique children assessed vs total children
  const uniqueChildrenAssessed = new Set(
    nutrition_assessment_records.map((a) => a.child_id),
  ).size;
  const nutritionAssessmentRate =
    total_children > 0
      ? pct(uniqueChildrenAssessed, total_children)
      : 0;

  // BMI recorded
  const bmiRecorded = nutrition_assessment_records.filter(
    (a) => a.bmi_recorded,
  ).length;
  const bmiRecordingRate = pct(bmiRecorded, totalNutritionAssessments);

  // Goals set
  const goalsSet = nutrition_assessment_records.filter(
    (a) => a.nutritional_goals_set,
  ).length;
  const goalsSetRate = pct(goalsSet, totalNutritionAssessments);

  // Goals met
  const goalsMet = nutrition_assessment_records.filter(
    (a) => a.nutritional_goals_set && a.goals_met,
  ).length;
  const assessmentsWithGoals = nutrition_assessment_records.filter(
    (a) => a.nutritional_goals_set,
  ).length;
  const nutritionGoalsMetRate = pct(goalsMet, assessmentsWithGoals);

  // Dietitian referrals completed
  const referralsNeeded = nutrition_assessment_records.filter(
    (a) => a.referral_to_dietitian,
  );
  const referralsCompleted = referralsNeeded.filter(
    (a) => a.referral_completed,
  ).length;
  const dietitianReferralCompletionRate = pct(
    referralsCompleted,
    referralsNeeded.length,
  );

  // Dietary intake reviewed
  const dietaryIntakeReviewed = nutrition_assessment_records.filter(
    (a) => a.dietary_intake_reviewed,
  ).length;
  const dietaryIntakeReviewRate = pct(
    dietaryIntakeReviewed,
    totalNutritionAssessments,
  );

  // Height and weight recorded
  const heightWeightRecorded = nutrition_assessment_records.filter(
    (a) => a.height_recorded && a.weight_recorded,
  ).length;
  const heightWeightRecordingRate = pct(
    heightWeightRecorded,
    totalNutritionAssessments,
  );

  // Concerns identified across assessments
  const totalConcernsIdentified = nutrition_assessment_records.reduce(
    (sum, a) => sum + a.concerns_identified.length,
    0,
  );

  // Overdue nutrition reviews
  const nutritionReviewsOverdue = nutrition_assessment_records.filter((a) =>
    isOverdue(a.next_review_date, today),
  ).length;

  // ─── Food Hygiene Metrics ─────────────────────────────────────────────

  const totalFoodHygieneInspections = food_hygiene_records.length;

  // Average food hygiene score
  const foodHygieneScore = avgScore(food_hygiene_records);

  // Individual compliance areas
  const foodStorageCompliant = food_hygiene_records.filter(
    (f) => f.food_storage_compliant,
  ).length;
  const foodStorageRate = pct(
    foodStorageCompliant,
    totalFoodHygieneInspections,
  );

  const tempRecordsMaintained = food_hygiene_records.filter(
    (f) => f.temperature_records_maintained,
  ).length;
  const tempRecordsRate = pct(
    tempRecordsMaintained,
    totalFoodHygieneInspections,
  );

  const prepAreaClean = food_hygiene_records.filter(
    (f) => f.preparation_area_clean,
  ).length;
  const prepAreaCleanRate = pct(prepAreaClean, totalFoodHygieneInspections);

  const handHygieneCompliant = food_hygiene_records.filter(
    (f) => f.hand_hygiene_compliant,
  ).length;
  const handHygieneRate = pct(
    handHygieneCompliant,
    totalFoodHygieneInspections,
  );

  const allergenLabellingCorrect = food_hygiene_records.filter(
    (f) => f.allergen_labelling_correct,
  ).length;
  const allergenLabellingRate = pct(
    allergenLabellingCorrect,
    totalFoodHygieneInspections,
  );

  const wasteDisposalCompliant = food_hygiene_records.filter(
    (f) => f.waste_disposal_compliant,
  ).length;
  const wasteDisposalRate = pct(
    wasteDisposalCompliant,
    totalFoodHygieneInspections,
  );

  const pestControlAdequate = food_hygiene_records.filter(
    (f) => f.pest_control_adequate,
  ).length;
  const pestControlRate = pct(
    pestControlAdequate,
    totalFoodHygieneInspections,
  );

  const staffFoodHygieneTrained = food_hygiene_records.filter(
    (f) => f.staff_food_hygiene_trained,
  ).length;
  const staffFoodHygieneTrainingRate = pct(
    staffFoodHygieneTrained,
    totalFoodHygieneInspections,
  );

  // Corrective actions
  const totalCorrectiveActionsRequired = food_hygiene_records.reduce(
    (sum, f) => sum + f.corrective_actions_required,
    0,
  );
  const totalCorrectiveActionsCompleted = food_hygiene_records.reduce(
    (sum, f) => sum + f.corrective_actions_completed,
    0,
  );
  const correctiveActionCompletionRate = pct(
    totalCorrectiveActionsCompleted,
    totalCorrectiveActionsRequired,
  );

  // Overdue food hygiene inspections
  const hygieneInspectionsOverdue = food_hygiene_records.filter((f) =>
    isOverdue(f.next_inspection_due, today),
  ).length;

  // Most recent food hygiene score
  const sortedHygieneRecords = [...food_hygiene_records].sort(
    (a, b) => b.inspection_date.localeCompare(a.inspection_date),
  );
  const mostRecentHygieneScore =
    sortedHygieneRecords.length > 0
      ? sortedHygieneRecords[0].overall_score
      : 0;

  // ─── Special Diet Metrics ─────────────────────────────────────────────

  const totalSpecialDiets = special_diet_records.length;
  const activeSpecialDiets = special_diet_records.filter(
    (s) => s.active,
  );
  const totalActiveSpecialDiets = activeSpecialDiets.length;

  // Special diet adherence: compliant meals / total meals
  const totalSpecialDietMeals = activeSpecialDiets.reduce(
    (sum, s) => sum + s.meals_total,
    0,
  );
  const totalSpecialDietCompliantMeals = activeSpecialDiets.reduce(
    (sum, s) => sum + s.meals_compliant,
    0,
  );
  const specialDietAdherenceRate = pct(
    totalSpecialDietCompliantMeals,
    totalSpecialDietMeals,
  );

  // Special diet documentation
  const specialDietDocumented = activeSpecialDiets.filter(
    (s) => s.plan_documented,
  ).length;
  const specialDietDocumentationRate = pct(
    specialDietDocumented,
    totalActiveSpecialDiets,
  );

  // Staff trained for special diets
  const specialDietStaffTrained = activeSpecialDiets.filter(
    (s) => s.staff_trained,
  ).length;
  const specialDietStaffTrainedRate = pct(
    specialDietStaffTrained,
    totalActiveSpecialDiets,
  );

  // Child willingness/adherence
  const childAdherenceWilling = activeSpecialDiets.filter(
    (s) => s.child_adherence_willing,
  ).length;
  const childWillingnessRate = pct(
    childAdherenceWilling,
    totalActiveSpecialDiets,
  );

  // Positive outcomes
  const outcomesRecorded = activeSpecialDiets.filter(
    (s) => s.outcomes_positive !== null,
  );
  const positiveOutcomes = outcomesRecorded.filter(
    (s) => s.outcomes_positive === true,
  ).length;
  const positiveOutcomeRate = pct(positiveOutcomes, outcomesRecorded.length);

  // Overdue special diet reviews
  const specialDietReviewsOverdue = activeSpecialDiets.filter((s) =>
    isOverdue(s.review_date, today),
  ).length;

  // Monitoring compliance (special diets monitored within expected frequency)
  const specialDietsMonitored = activeSpecialDiets.filter((s) => {
    if (!s.last_monitored_date) return false;
    const daysSinceMonitored = daysBetween(s.last_monitored_date, today);
    if (s.monitoring_frequency === "daily") return daysSinceMonitored <= 2;
    if (s.monitoring_frequency === "weekly") return daysSinceMonitored <= 10;
    if (s.monitoring_frequency === "monthly") return daysSinceMonitored <= 35;
    return false;
  }).length;
  const specialDietMonitoringRate = pct(
    specialDietsMonitored,
    totalActiveSpecialDiets,
  );

  // Unique children on special diets
  const uniqueChildrenOnSpecialDiet = new Set(
    activeSpecialDiets.map((s) => s.child_id),
  ).size;

  // ── Scoring: base 52, 9 bonus categories summing to 28 ───────────────

  let score = 52;

  // --- Bonus 1: mealPlanComplianceRate (>=95: +4, >=80: +2) ---
  if (mealPlanComplianceRate >= 95) score += 4;
  else if (mealPlanComplianceRate >= 80) score += 2;

  // --- Bonus 2: mealNutritionalGuidelineRate (>=90: +3, >=70: +1) ---
  if (mealNutritionalGuidelineRate >= 90) score += 3;
  else if (mealNutritionalGuidelineRate >= 70) score += 1;

  // --- Bonus 3: dietaryDocumentationRate (>=100: +3, >=80: +1) ---
  if (dietaryDocumentationRate >= 100) score += 3;
  else if (dietaryDocumentationRate >= 80) score += 1;

  // --- Bonus 4: nutritionAssessmentRate (>=100: +4, >=80: +2) ---
  if (nutritionAssessmentRate >= 100) score += 4;
  else if (nutritionAssessmentRate >= 80) score += 2;

  // --- Bonus 5: foodHygieneScore (>=90: +3, >=70: +1) ---
  if (foodHygieneScore >= 90) score += 3;
  else if (foodHygieneScore >= 70) score += 1;

  // --- Bonus 6: specialDietAdherenceRate (>=95: +3, >=80: +1) ---
  if (specialDietAdherenceRate >= 95) score += 3;
  else if (specialDietAdherenceRate >= 80) score += 1;

  // --- Bonus 7: childChoiceRate (>=90: +3, >=70: +1) ---
  if (childChoiceRate >= 90) score += 3;
  else if (childChoiceRate >= 70) score += 1;

  // --- Bonus 8: allergenCheckRate (>=100: +3, >=80: +1) ---
  if (allergenCheckRate >= 100) score += 3;
  else if (allergenCheckRate >= 80) score += 1;

  // --- Bonus 9: emergencyPlanRate (>=100: +2, >=80: +1) ---
  if (emergencyPlanRate >= 100) score += 2;
  else if (emergencyPlanRate >= 80) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: mealPlanComplianceRate < 50 → -5 (guard: totalMealPlans > 0)
  if (mealPlanComplianceRate < 50 && totalMealPlans > 0) score -= 5;

  // Penalty 2: foodHygieneScore < 50 → -5 (guard: totalFoodHygieneInspections > 0)
  if (foodHygieneScore < 50 && totalFoodHygieneInspections > 0) score -= 5;

  // Penalty 3: specialDietAdherenceRate < 50 → -5 (guard: totalSpecialDietMeals > 0)
  if (specialDietAdherenceRate < 50 && totalSpecialDietMeals > 0) score -= 5;

  // Penalty 4: lifeThreateningWithoutPlan > 0 → -3 (guard: lifeThreatening.length > 0)
  if (lifeThreateningWithoutPlan > 0 && lifeThreatening.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const nutrition_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // Meal plan compliance strengths
  if (mealPlanComplianceRate >= 95 && totalMealPlans > 0) {
    strengths.push(
      `${mealPlanComplianceRate}% meal plan compliance — virtually all planned meals are delivered as intended, demonstrating excellent meal planning and delivery processes.`,
    );
  } else if (mealPlanComplianceRate >= 80 && totalMealPlans > 0) {
    strengths.push(
      `${mealPlanComplianceRate}% meal plan compliance — the majority of planned meals are delivered effectively.`,
    );
  }

  // Nutritional guideline compliance
  if (mealNutritionalGuidelineRate >= 90 && totalMealPlans > 0) {
    strengths.push(
      `${mealNutritionalGuidelineRate}% of meals meet nutritional guidelines — the home consistently provides nutritionally balanced meals for children.`,
    );
  } else if (mealNutritionalGuidelineRate >= 70 && totalMealPlans > 0) {
    strengths.push(
      `${mealNutritionalGuidelineRate}% of meals meet nutritional guidelines — good nutritional standards are maintained across meal provision.`,
    );
  }

  // Child choice and involvement
  if (childChoiceRate >= 90 && totalMealPlans > 0) {
    strengths.push(
      `${childChoiceRate}% child involvement in meal choices — children are genuinely empowered to influence their diet and meal preferences.`,
    );
  } else if (childChoiceRate >= 70 && totalMealPlans > 0) {
    strengths.push(
      `${childChoiceRate}% child involvement in meal choices — the home regularly involves children in selecting their meals.`,
    );
  }

  // Fresh ingredients
  if (freshIngredientRate >= 90 && totalMealPlans > 0) {
    strengths.push(
      `${freshIngredientRate}% of meals prepared with fresh ingredients — the home prioritises quality, fresh food for children.`,
    );
  } else if (freshIngredientRate >= 70 && totalMealPlans > 0) {
    strengths.push(
      `${freshIngredientRate}% of meals use fresh ingredients — good use of fresh produce in meal preparation.`,
    );
  }

  // Allergen checks
  if (allergenCheckRate >= 100 && totalMealPlans > 0) {
    strengths.push(
      "Allergen checks completed for every meal — the home demonstrates exemplary allergen management, ensuring children's safety at every mealtime.",
    );
  } else if (allergenCheckRate >= 90 && totalMealPlans > 0) {
    strengths.push(
      `${allergenCheckRate}% allergen check completion — strong allergen management practice protecting children with dietary requirements.`,
    );
  }

  // Cultural dietary needs
  if (culturalNeedsMetRate >= 95 && totalMealPlans > 0) {
    strengths.push(
      `${culturalNeedsMetRate}% cultural dietary needs met — the home respects and accommodates children's cultural and religious dietary needs consistently.`,
    );
  } else if (culturalNeedsMetRate >= 80 && totalMealPlans > 0) {
    strengths.push(
      `${culturalNeedsMetRate}% cultural dietary needs met — good practice in meeting children's cultural and religious dietary requirements.`,
    );
  }

  // Dietary documentation
  if (dietaryDocumentationRate >= 100 && totalActiveDietaryReqs > 0) {
    strengths.push(
      "All dietary requirements fully documented — the home maintains comprehensive records of every child's dietary needs.",
    );
  } else if (dietaryDocumentationRate >= 80 && totalActiveDietaryReqs > 0) {
    strengths.push(
      `${dietaryDocumentationRate}% dietary requirements documented — the majority of children's dietary needs are well-recorded.`,
    );
  }

  // Staff informed of dietary requirements
  if (dietaryStaffInformedRate >= 100 && totalActiveDietaryReqs > 0) {
    strengths.push(
      "All staff informed of every child's dietary requirements — excellent communication ensuring consistent dietary management.",
    );
  } else if (dietaryStaffInformedRate >= 80 && totalActiveDietaryReqs > 0) {
    strengths.push(
      `${dietaryStaffInformedRate}% staff awareness of dietary requirements — strong communication of children's dietary needs across the team.`,
    );
  }

  // Emergency plans for severe requirements
  if (emergencyPlanRate >= 100 && severeRequirements.length > 0) {
    strengths.push(
      "Emergency plans in place for all severe and life-threatening dietary requirements — the home is prepared to respond to allergic reactions and dietary emergencies.",
    );
  } else if (emergencyPlanRate >= 80 && severeRequirements.length > 0) {
    strengths.push(
      `${emergencyPlanRate}% of severe dietary requirements have emergency plans — good preparedness for dietary emergencies.`,
    );
  }

  // Nutrition assessment coverage
  if (nutritionAssessmentRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has received a nutrition assessment — the home ensures comprehensive nutritional monitoring for all children on placement.",
    );
  } else if (nutritionAssessmentRate >= 80 && total_children > 0) {
    strengths.push(
      `${nutritionAssessmentRate}% nutrition assessment coverage — the majority of children have received nutritional assessments.`,
    );
  }

  // Nutrition goals met
  if (nutritionGoalsMetRate >= 90 && assessmentsWithGoals > 0) {
    strengths.push(
      `${nutritionGoalsMetRate}% of nutritional goals met — children's nutrition is improving in line with professional recommendations.`,
    );
  } else if (nutritionGoalsMetRate >= 70 && assessmentsWithGoals > 0) {
    strengths.push(
      `${nutritionGoalsMetRate}% of nutritional goals met — good progress towards achieving children's nutritional targets.`,
    );
  }

  // Dietitian referral completion
  if (dietitianReferralCompletionRate >= 100 && referralsNeeded.length > 0) {
    strengths.push(
      "All dietitian referrals completed — children requiring specialist nutritional input receive timely access to professional support.",
    );
  } else if (dietitianReferralCompletionRate >= 80 && referralsNeeded.length > 0) {
    strengths.push(
      `${dietitianReferralCompletionRate}% of dietitian referrals completed — strong follow-through on specialist nutritional referrals.`,
    );
  }

  // Food hygiene score
  if (foodHygieneScore >= 90 && totalFoodHygieneInspections > 0) {
    strengths.push(
      `Food hygiene score averaging ${foodHygieneScore}% — outstanding food hygiene standards are maintained across the home.`,
    );
  } else if (foodHygieneScore >= 70 && totalFoodHygieneInspections > 0) {
    strengths.push(
      `Food hygiene score averaging ${foodHygieneScore}% — good food hygiene standards are in place.`,
    );
  }

  // Staff food hygiene training
  if (staffFoodHygieneTrainingRate >= 100 && totalFoodHygieneInspections > 0) {
    strengths.push(
      "All food hygiene inspections confirm staff are trained — the home ensures everyone involved in food preparation has appropriate food hygiene qualifications.",
    );
  } else if (staffFoodHygieneTrainingRate >= 80 && totalFoodHygieneInspections > 0) {
    strengths.push(
      `${staffFoodHygieneTrainingRate}% of inspections confirm staff food hygiene training — strong staff competency in food handling and safety.`,
    );
  }

  // Corrective action completion
  if (correctiveActionCompletionRate >= 100 && totalCorrectiveActionsRequired > 0) {
    strengths.push(
      "All corrective actions from food hygiene inspections completed — the home promptly addresses any food safety concerns identified.",
    );
  } else if (correctiveActionCompletionRate >= 80 && totalCorrectiveActionsRequired > 0) {
    strengths.push(
      `${correctiveActionCompletionRate}% of food hygiene corrective actions completed — good responsiveness to food safety improvement requirements.`,
    );
  }

  // Special diet adherence
  if (specialDietAdherenceRate >= 95 && totalSpecialDietMeals > 0) {
    strengths.push(
      `${specialDietAdherenceRate}% special diet adherence — prescribed and therapeutic diets are delivered with exceptional consistency.`,
    );
  } else if (specialDietAdherenceRate >= 80 && totalSpecialDietMeals > 0) {
    strengths.push(
      `${specialDietAdherenceRate}% special diet adherence — the home generally maintains compliance with prescribed dietary plans.`,
    );
  }

  // Special diet documentation
  if (specialDietDocumentationRate >= 100 && totalActiveSpecialDiets > 0) {
    strengths.push(
      "All special diets fully documented — clear plans exist for every child's specialist dietary needs.",
    );
  } else if (specialDietDocumentationRate >= 80 && totalActiveSpecialDiets > 0) {
    strengths.push(
      `${specialDietDocumentationRate}% of special diets documented — good documentation of specialist dietary plans.`,
    );
  }

  // Special diet monitoring
  if (specialDietMonitoringRate >= 90 && totalActiveSpecialDiets > 0) {
    strengths.push(
      `${specialDietMonitoringRate}% of special diets monitored within expected frequency — strong ongoing oversight of children's specialist dietary needs.`,
    );
  } else if (specialDietMonitoringRate >= 70 && totalActiveSpecialDiets > 0) {
    strengths.push(
      `${specialDietMonitoringRate}% of special diets monitored on schedule — regular monitoring of specialist dietary plans.`,
    );
  }

  // Positive child feedback
  if (childFeedbackPositiveRate >= 90 && feedbackGiven.length > 0) {
    strengths.push(
      `${childFeedbackPositiveRate}% positive child feedback on meals — children are satisfied with the food they receive.`,
    );
  } else if (childFeedbackPositiveRate >= 70 && feedbackGiven.length > 0) {
    strengths.push(
      `${childFeedbackPositiveRate}% positive meal feedback from children — the majority of children are happy with their meals.`,
    );
  }

  // Portion appropriateness
  if (portionAppropriateRate >= 95 && totalMealPlans > 0) {
    strengths.push(
      `${portionAppropriateRate}% portion appropriateness — meals are consistently served in age-appropriate and individually suitable portions.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // Meal plan compliance concerns
  if (mealPlanComplianceRate < 50 && totalMealPlans > 0) {
    concerns.push(
      `Only ${mealPlanComplianceRate}% meal plan compliance — the majority of planned meals are not being delivered as intended, meaning children may not receive adequate or consistent nutrition.`,
    );
  } else if (mealPlanComplianceRate < 80 && mealPlanComplianceRate >= 50 && totalMealPlans > 0) {
    concerns.push(
      `Meal plan compliance at ${mealPlanComplianceRate}% — some planned meals are not being delivered, affecting consistency of children's nutrition.`,
    );
  }

  // Nutritional guideline concerns
  if (mealNutritionalGuidelineRate < 50 && totalMealPlans > 0) {
    concerns.push(
      `Only ${mealNutritionalGuidelineRate}% of meals meet nutritional guidelines — the majority of meals do not meet recommended nutritional standards, which may impact children's health and development.`,
    );
  } else if (mealNutritionalGuidelineRate < 70 && mealNutritionalGuidelineRate >= 50 && totalMealPlans > 0) {
    concerns.push(
      `Nutritional guideline compliance at ${mealNutritionalGuidelineRate}% — a significant proportion of meals do not meet recommended nutritional standards.`,
    );
  }

  // Child choice concerns
  if (childChoiceRate < 50 && totalMealPlans > 0) {
    concerns.push(
      `Only ${childChoiceRate}% child involvement in meal choices — children are not being given sufficient opportunity to influence their diet and meal preferences.`,
    );
  } else if (childChoiceRate < 70 && childChoiceRate >= 50 && totalMealPlans > 0) {
    concerns.push(
      `Child meal choice involvement at ${childChoiceRate}% — not all children are regularly involved in choosing their meals.`,
    );
  }

  // Allergen check concerns
  if (allergenCheckRate < 80 && totalMealPlans > 0) {
    concerns.push(
      `Allergen check completion at ${allergenCheckRate}% — incomplete allergen checks pose a direct safety risk to children with allergies and intolerances.`,
    );
  }

  // Cultural needs concerns
  if (culturalNeedsMetRate < 80 && totalMealPlans > 0) {
    concerns.push(
      `Cultural dietary needs met in only ${culturalNeedsMetRate}% of meals — children's cultural and religious dietary requirements are not being consistently respected.`,
    );
  }

  // Dietary documentation concerns
  if (dietaryDocumentationRate < 80 && totalActiveDietaryReqs > 0) {
    concerns.push(
      `Only ${dietaryDocumentationRate}% of dietary requirements documented — incomplete documentation creates risks of dietary needs being missed or ignored.`,
    );
  }

  // Staff informed concerns
  if (dietaryStaffInformedRate < 80 && totalActiveDietaryReqs > 0) {
    concerns.push(
      `Only ${dietaryStaffInformedRate}% of dietary requirements communicated to all staff — gaps in staff awareness create direct risks of children receiving inappropriate food.`,
    );
  }

  // Emergency plan concerns
  if (emergencyPlanRate < 80 && severeRequirements.length > 0) {
    concerns.push(
      `Only ${emergencyPlanRate}% of severe/life-threatening dietary requirements have emergency plans — this is a critical safety gap that could endanger children's lives.`,
    );
  }

  // Life-threatening without plan
  if (lifeThreateningWithoutPlan > 0) {
    concerns.push(
      `${lifeThreateningWithoutPlan} life-threatening dietary requirement${lifeThreateningWithoutPlan !== 1 ? "s" : ""} without emergency plans — this poses an immediate risk to children's safety and requires urgent rectification.`,
    );
  }

  // Nutrition assessment coverage concerns
  if (nutritionAssessmentRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${nutritionAssessmentRate}% of children have received a nutrition assessment — the majority of children's nutritional needs have not been formally assessed.`,
    );
  } else if (nutritionAssessmentRate < 80 && nutritionAssessmentRate >= 50 && total_children > 0) {
    concerns.push(
      `Nutrition assessment coverage at ${nutritionAssessmentRate}% — some children have not received a nutritional assessment.`,
    );
  }

  // Nutrition goals met concerns
  if (nutritionGoalsMetRate < 50 && assessmentsWithGoals > 0) {
    concerns.push(
      `Only ${nutritionGoalsMetRate}% of nutritional goals met — the majority of children are not achieving their nutrition targets, suggesting interventions may be ineffective.`,
    );
  } else if (nutritionGoalsMetRate < 70 && nutritionGoalsMetRate >= 50 && assessmentsWithGoals > 0) {
    concerns.push(
      `Nutritional goals met at ${nutritionGoalsMetRate}% — some children are not meeting their nutritional targets.`,
    );
  }

  // Dietitian referral concerns
  if (dietitianReferralCompletionRate < 80 && referralsNeeded.length > 0) {
    concerns.push(
      `Only ${dietitianReferralCompletionRate}% of dietitian referrals completed — children requiring specialist nutritional input are not receiving timely access to professional support.`,
    );
  }

  // Food hygiene score concerns
  if (foodHygieneScore < 50 && totalFoodHygieneInspections > 0) {
    concerns.push(
      `Food hygiene score averaging only ${foodHygieneScore}% — food hygiene standards are dangerously low, posing a direct health risk to children.`,
    );
  } else if (foodHygieneScore < 70 && foodHygieneScore >= 50 && totalFoodHygieneInspections > 0) {
    concerns.push(
      `Food hygiene score averaging ${foodHygieneScore}% — food hygiene standards require improvement to ensure children's safety.`,
    );
  }

  // Staff food hygiene training concerns
  if (staffFoodHygieneTrainingRate < 80 && totalFoodHygieneInspections > 0) {
    concerns.push(
      `Staff food hygiene training confirmed in only ${staffFoodHygieneTrainingRate}% of inspections — untrained staff preparing food creates unacceptable food safety risks.`,
    );
  }

  // Corrective action completion concerns
  if (correctiveActionCompletionRate < 80 && totalCorrectiveActionsRequired > 0) {
    concerns.push(
      `Only ${correctiveActionCompletionRate}% of food hygiene corrective actions completed — outstanding corrective actions represent unresolved food safety risks.`,
    );
  }

  // Special diet adherence concerns
  if (specialDietAdherenceRate < 50 && totalSpecialDietMeals > 0) {
    concerns.push(
      `Only ${specialDietAdherenceRate}% special diet adherence — the majority of prescribed diet meals are not compliant, which may harm children's health.`,
    );
  } else if (specialDietAdherenceRate < 80 && specialDietAdherenceRate >= 50 && totalSpecialDietMeals > 0) {
    concerns.push(
      `Special diet adherence at ${specialDietAdherenceRate}% — some prescribed dietary plans are not being followed consistently.`,
    );
  }

  // Special diet documentation concerns
  if (specialDietDocumentationRate < 80 && totalActiveSpecialDiets > 0) {
    concerns.push(
      `Only ${specialDietDocumentationRate}% of special diets documented — incomplete documentation risks children's specialist dietary needs being missed.`,
    );
  }

  // Special diet monitoring concerns
  if (specialDietMonitoringRate < 50 && totalActiveSpecialDiets > 0) {
    concerns.push(
      `Only ${specialDietMonitoringRate}% of special diets monitored within expected frequency — children on prescribed diets are not receiving adequate ongoing oversight.`,
    );
  } else if (specialDietMonitoringRate < 70 && specialDietMonitoringRate >= 50 && totalActiveSpecialDiets > 0) {
    concerns.push(
      `Special diet monitoring compliance at ${specialDietMonitoringRate}% — some children's specialist diets are not being monitored with sufficient regularity.`,
    );
  }

  // Overdue reviews concerns
  if (dietaryReviewsOverdue > 0) {
    concerns.push(
      `${dietaryReviewsOverdue} dietary requirement review${dietaryReviewsOverdue !== 1 ? "s" : ""} overdue — out-of-date dietary information may lead to children's needs being unmet or meals posing safety risks.`,
    );
  }

  if (nutritionReviewsOverdue > 0) {
    concerns.push(
      `${nutritionReviewsOverdue} nutrition assessment review${nutritionReviewsOverdue !== 1 ? "s" : ""} overdue — children's nutritional progress is not being monitored as required.`,
    );
  }

  if (hygieneInspectionsOverdue > 0) {
    concerns.push(
      `${hygieneInspectionsOverdue} food hygiene inspection${hygieneInspectionsOverdue !== 1 ? "s" : ""} overdue — the home cannot evidence current food hygiene compliance.`,
    );
  }

  if (specialDietReviewsOverdue > 0) {
    concerns.push(
      `${specialDietReviewsOverdue} special diet review${specialDietReviewsOverdue !== 1 ? "s" : ""} overdue — prescribed dietary plans may no longer be appropriate or effective without timely review.`,
    );
  }

  // No meal plans recorded despite children on placement
  if (totalMealPlans === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No meal plan records exist despite children being on placement — the home cannot evidence that children receive planned, nutritious meals.",
    );
  }

  // No food hygiene inspections despite having meal records
  if (totalFoodHygieneInspections === 0 && totalMealPlans > 0) {
    concerns.push(
      "No food hygiene inspection records exist despite meal delivery records — the home cannot evidence food safety compliance.",
    );
  }

  // Negative child feedback
  if (childFeedbackPositiveRate < 50 && feedbackGiven.length > 0) {
    concerns.push(
      `Only ${childFeedbackPositiveRate}% positive child meal feedback — the majority of children are not satisfied with the food they receive.`,
    );
  }

  // Fresh ingredients concerns
  if (freshIngredientRate < 50 && totalMealPlans > 0) {
    concerns.push(
      `Only ${freshIngredientRate}% of meals use fresh ingredients — heavy reliance on processed or non-fresh food may impact children's health and nutritional intake.`,
    );
  }

  // Kitchen notification concerns
  if (kitchenNotifiedRate < 80 && totalActiveDietaryReqs > 0) {
    concerns.push(
      `Kitchen notified of only ${kitchenNotifiedRate}% of dietary requirements — gaps in kitchen awareness create direct risks of dietary errors during meal preparation.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: NutritionRecommendation[] = [];
  let rank = 0;

  // IMMEDIATE recommendations

  if (lifeThreateningWithoutPlan > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently create emergency response plans for all life-threatening dietary requirements — every child with a life-threatening allergy or dietary condition must have an accessible, up-to-date emergency plan known to all staff.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (foodHygieneScore < 50 && totalFoodHygieneInspections > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address food hygiene failings — the current score indicates serious food safety risks. Commission an immediate deep clean, retrain all food-handling staff, and implement daily monitoring until standards improve.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care",
    });
  }

  if (mealPlanComplianceRate < 50 && totalMealPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review meal planning and delivery processes — the majority of planned meals are not being delivered, meaning children may not receive adequate nutrition. Implement daily meal delivery verification.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (allergenCheckRate < 80 && totalMealPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory allergen checks before every meal service — incomplete allergen checks pose a direct safety risk. Introduce a pre-service allergen verification checklist signed off by the responsible staff member.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (emergencyPlanRate < 80 && severeRequirements.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure emergency plans are in place for all severe and life-threatening dietary requirements — staff must know how to respond to anaphylaxis and other dietary emergencies without delay.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (specialDietAdherenceRate < 50 && totalSpecialDietMeals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and improve special diet adherence — prescribed diets are not being followed in the majority of meals, which may directly harm children's health. Retrain kitchen and care staff on special diet requirements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (dietaryStaffInformedRate < 80 && totalActiveDietaryReqs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all staff are informed of every child's dietary requirements — implement a mandatory dietary briefing at shift handovers and maintain visible dietary requirement displays in the kitchen and staff areas.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (staffFoodHygieneTrainingRate < 80 && totalFoodHygieneInspections > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all staff involved in food preparation hold current food hygiene certificates — untrained staff handling food is a direct health risk and potential Environmental Health enforcement issue.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (dietaryDocumentationRate < 80 && totalActiveDietaryReqs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children's dietary requirements are fully documented — incomplete records create risks of dietary needs being overlooked during meal preparation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (nutritionAssessmentRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule nutrition assessments for all children who have not yet been assessed — every child on placement should have a baseline nutritional assessment to identify needs and set goals.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  // SOON recommendations

  if (correctiveActionCompletionRate < 80 && totalCorrectiveActionsRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all outstanding food hygiene corrective actions — unresolved corrective actions represent ongoing food safety risks that must be addressed before the next inspection.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care",
    });
  }

  if (mealNutritionalGuidelineRate < 70 && totalMealPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve nutritional content of meals — consider consulting a nutritionist to develop meal plans that consistently meet recommended guidelines for children.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (childChoiceRate < 70 && totalMealPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's involvement in meal planning and choices — involve children in weekly menu planning, shopping, and cooking to promote independence and ensure meals reflect their preferences.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's health and well-being",
    });
  }

  if (culturalNeedsMetRate < 80 && totalMealPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve provision for cultural and religious dietary needs — ensure all staff understand each child's cultural dietary requirements and that menus reflect diverse needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (dietitianReferralCompletionRate < 80 && referralsNeeded.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Chase and complete outstanding dietitian referrals — children identified as needing specialist nutritional input must receive timely access to professional support.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (specialDietMonitoringRate < 70 && totalActiveSpecialDiets > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve monitoring compliance for children on special diets — ensure monitoring occurs at the prescribed frequency and outcomes are recorded to evidence ongoing dietary management.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (nutritionGoalsMetRate < 70 && assessmentsWithGoals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review nutritional interventions for children not meeting their goals — adapt dietary plans, increase monitoring, or seek specialist input to improve goal attainment.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (kitchenNotifiedRate < 80 && totalActiveDietaryReqs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the kitchen is notified of all dietary requirements — implement a standardised notification process whenever a child's dietary needs are identified or updated.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care",
    });
  }

  if (freshIngredientRate < 50 && totalMealPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the use of fresh ingredients in meal preparation — reduce reliance on processed food and explore partnerships with local suppliers to improve ingredient quality.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's health and well-being",
    });
  }

  // PLANNED recommendations

  if (
    mealPlanComplianceRate >= 50 &&
    mealPlanComplianceRate < 80 &&
    totalMealPlans > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve meal plan compliance to at least 80% — review barriers to meal delivery and implement processes to ensure planned meals are consistently provided to children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (
    nutritionAssessmentRate >= 50 &&
    nutritionAssessmentRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend nutrition assessment coverage to all children — schedule assessments for any child not yet assessed and establish a regular review cycle.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (
    foodHygieneScore >= 50 &&
    foodHygieneScore < 70 &&
    totalFoodHygieneInspections > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop an improvement plan to raise food hygiene scores to at least 70% — address specific compliance gaps identified in inspections and establish regular internal audits.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care",
    });
  }

  if (
    specialDietAdherenceRate >= 50 &&
    specialDietAdherenceRate < 80 &&
    totalSpecialDietMeals > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve special diet adherence to at least 80% — identify barriers to compliance and provide additional staff training and resources for specialist dietary management.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (
    childChoiceRate >= 50 &&
    childChoiceRate < 70 &&
    totalMealPlans > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child involvement in meal choices to at least 70% — explore weekly menu planning sessions with children and offer regular opportunities for children to suggest meals.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children's health and well-being",
    });
  }

  if (totalMealPlans === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording meal plans for all children — documented meal plans are essential evidence that children receive planned, nutritious meals as part of their care.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (totalFoodHygieneInspections === 0 && totalMealPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule and conduct food hygiene inspections — food safety compliance cannot be evidenced without regular inspection records.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care",
    });
  }

  if (dietaryReviewsOverdue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Complete ${dietaryReviewsOverdue} overdue dietary requirement review${dietaryReviewsOverdue !== 1 ? "s" : ""} — out-of-date dietary information may lead to safety risks or unmet needs.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (nutritionReviewsOverdue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Complete ${nutritionReviewsOverdue} overdue nutrition assessment review${nutritionReviewsOverdue !== 1 ? "s" : ""} — children's nutritional progress must be monitored at agreed intervals.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (specialDietReviewsOverdue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Complete ${specialDietReviewsOverdue} overdue special diet review${specialDietReviewsOverdue !== 1 ? "s" : ""} — prescribed diets may need adjusting and cannot be left without timely professional review.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting good health",
    });
  }

  if (hygieneInspectionsOverdue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Schedule ${hygieneInspectionsOverdue} overdue food hygiene inspection${hygieneInspectionsOverdue !== 1 ? "s" : ""} — without current inspection records the home cannot demonstrate food safety compliance.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality of care",
    });
  }

  if (childFeedbackPositiveRate < 50 && feedbackGiven.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult children about meal quality and preferences — negative feedback suggests meals are not meeting children's expectations. Use children's input to redesign menus and improve meal satisfaction.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's health and well-being",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: NutritionInsight[] = [];

  // -- Critical insights --

  if (lifeThreateningWithoutPlan > 0) {
    insights.push({
      text: `${lifeThreateningWithoutPlan} life-threatening dietary requirement${lifeThreateningWithoutPlan !== 1 ? "s" : ""} without emergency plans. This is a critical safeguarding concern — a child could suffer a life-threatening reaction without staff knowing how to respond. Ofsted would view this as a serious failure in Reg 9 compliance.`,
      severity: "critical",
    });
  }

  if (foodHygieneScore < 50 && totalFoodHygieneInspections > 0) {
    insights.push({
      text: `Food hygiene score averaging only ${foodHygieneScore}%. Ofsted and Environmental Health would view this as evidence that children's health is being put at risk through poor food safety practices. Immediate remedial action is required.`,
      severity: "critical",
    });
  }

  if (mealPlanComplianceRate < 50 && totalMealPlans > 0) {
    insights.push({
      text: `Only ${mealPlanComplianceRate}% of planned meals are being delivered. Children are not consistently receiving the meals planned for them, which directly undermines the home's ability to evidence adequate nutrition under Reg 9.`,
      severity: "critical",
    });
  }

  if (specialDietAdherenceRate < 50 && totalSpecialDietMeals > 0) {
    insights.push({
      text: `Special diet adherence at only ${specialDietAdherenceRate}%. Prescribed diets are not being followed for the majority of meals, which may directly harm children's health and constitutes a failure to follow professional medical or dietary advice.`,
      severity: "critical",
    });
  }

  if (allergenCheckRate < 50 && totalMealPlans > 0) {
    insights.push({
      text: `Allergen checks completed for only ${allergenCheckRate}% of meals. Children with allergies are being served meals without confirmed allergen safety checks, creating an immediate risk of allergic reactions including anaphylaxis.`,
      severity: "critical",
    });
  }

  if (dietaryStaffInformedRate < 50 && totalActiveDietaryReqs > 0) {
    insights.push({
      text: `Staff informed of only ${dietaryStaffInformedRate}% of dietary requirements. When staff are unaware of children's dietary needs, meals may be served that cause allergic reactions, religious offence, or health complications.`,
      severity: "critical",
    });
  }

  if (totalMealPlans === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No meal plan records exist despite children being on placement. Without meal planning records, the home cannot demonstrate that children receive adequate, nutritious, and planned meals — Ofsted expects clear evidence of nutrition management under Reg 9.",
      severity: "critical",
    });
  }

  if (nutritionAssessmentRate < 30 && total_children > 0 && totalNutritionAssessments > 0) {
    insights.push({
      text: `Nutrition assessment coverage at only ${nutritionAssessmentRate}% — the vast majority of children have not had their nutritional needs formally assessed. Without assessments, the home cannot set or monitor nutritional goals.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    mealPlanComplianceRate >= 50 &&
    mealPlanComplianceRate < 80 &&
    totalMealPlans > 0
  ) {
    insights.push({
      text: `Meal plan compliance at ${mealPlanComplianceRate}% — improving but some children are not consistently receiving planned meals. Each missed meal represents a gap in the home's nutritional provision.`,
      severity: "warning",
    });
  }

  if (
    mealNutritionalGuidelineRate >= 50 &&
    mealNutritionalGuidelineRate < 70 &&
    totalMealPlans > 0
  ) {
    insights.push({
      text: `Only ${mealNutritionalGuidelineRate}% of meals meet nutritional guidelines — children may not be receiving sufficient nutritional variety and balance to support their growth and development.`,
      severity: "warning",
    });
  }

  if (
    foodHygieneScore >= 50 &&
    foodHygieneScore < 70 &&
    totalFoodHygieneInspections > 0
  ) {
    insights.push({
      text: `Food hygiene score averaging ${foodHygieneScore}% — while not critically low, this falls below the standard expected in a children's home and may attract scrutiny from Environmental Health or Ofsted.`,
      severity: "warning",
    });
  }

  if (
    specialDietAdherenceRate >= 50 &&
    specialDietAdherenceRate < 80 &&
    totalSpecialDietMeals > 0
  ) {
    insights.push({
      text: `Special diet adherence at ${specialDietAdherenceRate}% — while most meals comply, inconsistent adherence to prescribed diets may undermine children's health outcomes and confidence in the care they receive.`,
      severity: "warning",
    });
  }

  if (
    childChoiceRate >= 50 &&
    childChoiceRate < 70 &&
    totalMealPlans > 0
  ) {
    insights.push({
      text: `Child meal choice involvement at ${childChoiceRate}% — while some children influence their diet, not all are regularly consulted. Ofsted values children's agency in daily decisions including food.`,
      severity: "warning",
    });
  }

  if (
    allergenCheckRate >= 50 &&
    allergenCheckRate < 80 &&
    totalMealPlans > 0
  ) {
    insights.push({
      text: `Allergen checks completed for ${allergenCheckRate}% of meals — while the majority are checked, any gap in allergen verification poses a safety risk to children with allergies.`,
      severity: "warning",
    });
  }

  if (
    nutritionAssessmentRate >= 50 &&
    nutritionAssessmentRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Nutrition assessment coverage at ${nutritionAssessmentRate}% — while improving, some children have not been assessed. Every child should have a baseline nutritional assessment.`,
      severity: "warning",
    });
  }

  if (
    nutritionGoalsMetRate >= 50 &&
    nutritionGoalsMetRate < 70 &&
    assessmentsWithGoals > 0
  ) {
    insights.push({
      text: `Nutritional goals met at ${nutritionGoalsMetRate}% — while some children are making progress, others are not achieving their nutrition targets. Interventions may need strengthening.`,
      severity: "warning",
    });
  }

  if (
    dietitianReferralCompletionRate >= 50 &&
    dietitianReferralCompletionRate < 80 &&
    referralsNeeded.length > 0
  ) {
    insights.push({
      text: `Dietitian referral completion at ${dietitianReferralCompletionRate}% — some children referred for specialist nutritional support have not yet received it, potentially delaying improvements in their nutrition.`,
      severity: "warning",
    });
  }

  if (
    correctiveActionCompletionRate >= 50 &&
    correctiveActionCompletionRate < 80 &&
    totalCorrectiveActionsRequired > 0
  ) {
    insights.push({
      text: `Food hygiene corrective action completion at ${correctiveActionCompletionRate}% — outstanding actions from previous inspections need resolving to maintain and improve food safety standards.`,
      severity: "warning",
    });
  }

  if (
    specialDietMonitoringRate >= 50 &&
    specialDietMonitoringRate < 70 &&
    totalActiveSpecialDiets > 0
  ) {
    insights.push({
      text: `Special diet monitoring at ${specialDietMonitoringRate}% — some children's prescribed diets are not being monitored as frequently as required, reducing the ability to track outcomes and adjust plans.`,
      severity: "warning",
    });
  }

  if (dietaryReviewsOverdue > 0) {
    insights.push({
      text: `${dietaryReviewsOverdue} dietary requirement review${dietaryReviewsOverdue !== 1 ? "s" : ""} overdue — children's dietary needs change over time and out-of-date records may no longer reflect current requirements.`,
      severity: "warning",
    });
  }

  if (nutritionReviewsOverdue > 0) {
    insights.push({
      text: `${nutritionReviewsOverdue} nutrition assessment review${nutritionReviewsOverdue !== 1 ? "s" : ""} overdue — without timely reviews, children's nutritional progress cannot be tracked and goals cannot be adjusted.`,
      severity: "warning",
    });
  }

  if (totalConcernsIdentified > 0) {
    const avgConcernsPerAssessment =
      totalNutritionAssessments > 0
        ? Math.round((totalConcernsIdentified / totalNutritionAssessments) * 10) / 10
        : 0;
    if (avgConcernsPerAssessment >= 2) {
      insights.push({
        text: `An average of ${avgConcernsPerAssessment} nutritional concerns identified per assessment — a high concern density may indicate systemic nutritional issues requiring strategic intervention.`,
        severity: "warning",
      });
    }
  }

  if (childFeedbackPositiveRate < 50 && feedbackGiven.length >= 5) {
    insights.push({
      text: `Only ${childFeedbackPositiveRate}% positive child feedback on meals — children are dissatisfied with the food they receive. This affects their daily quality of life and Ofsted would view poor meal satisfaction as a concern.`,
      severity: "warning",
    });
  }

  // Count dietary requirement types
  const reqTypeCount: Record<string, number> = {};
  for (const req of activeDietaryRequirements) {
    reqTypeCount[req.requirement_type] = (reqTypeCount[req.requirement_type] ?? 0) + 1;
  }
  const topReqTypes = Object.entries(reqTypeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topReqTypes.length > 0 && totalActiveDietaryReqs >= 3) {
    insights.push({
      text: `Dietary requirement profile: ${topReqTypes.map(([t, c]) => `${t} (${c})`).join(", ")}. Understanding the dietary requirement landscape helps the home plan menus and allocate resources effectively.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (nutrition_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding nutrition and dietary management — meals are planned and delivered effectively, dietary requirements are comprehensively documented and managed, food hygiene standards are high, and special diets are followed with excellent adherence. This is strong evidence for Reg 9 compliance and children's health and well-being.",
      severity: "positive",
    });
  }

  if (
    mealPlanComplianceRate >= 95 &&
    mealNutritionalGuidelineRate >= 90 &&
    totalMealPlans > 0
  ) {
    insights.push({
      text: `${mealPlanComplianceRate}% meal compliance with ${mealNutritionalGuidelineRate}% meeting nutritional guidelines — the home delivers consistently nutritious meals to children, demonstrating excellent food provision under Reg 9.`,
      severity: "positive",
    });
  }

  if (
    allergenCheckRate >= 100 &&
    emergencyPlanRate >= 100 &&
    totalMealPlans > 0 &&
    severeRequirements.length > 0
  ) {
    insights.push({
      text: "Every meal undergoes allergen checks and all severe dietary requirements have emergency plans — the home operates an exemplary allergen safety framework that protects children from dietary harm.",
      severity: "positive",
    });
  }

  if (
    foodHygieneScore >= 90 &&
    staffFoodHygieneTrainingRate >= 100 &&
    totalFoodHygieneInspections > 0
  ) {
    insights.push({
      text: `Food hygiene averaging ${foodHygieneScore}% with all staff trained — the home maintains exceptional food safety standards, ensuring children eat in a clean and safe environment.`,
      severity: "positive",
    });
  }

  if (
    specialDietAdherenceRate >= 95 &&
    specialDietDocumentationRate >= 100 &&
    totalSpecialDietMeals > 0 &&
    totalActiveSpecialDiets > 0
  ) {
    insights.push({
      text: `${specialDietAdherenceRate}% special diet adherence with complete documentation — prescribed and therapeutic diets are managed with exceptional consistency and rigour.`,
      severity: "positive",
    });
  }

  if (
    childChoiceRate >= 90 &&
    childFeedbackPositiveRate >= 90 &&
    totalMealPlans > 0 &&
    feedbackGiven.length > 0
  ) {
    insights.push({
      text: `${childChoiceRate}% child involvement in meal choices with ${childFeedbackPositiveRate}% positive feedback — children are empowered to shape their diet and are satisfied with the food they receive.`,
      severity: "positive",
    });
  }

  if (
    dietaryDocumentationRate >= 100 &&
    dietaryStaffInformedRate >= 100 &&
    totalActiveDietaryReqs > 0
  ) {
    insights.push({
      text: "All dietary requirements fully documented and communicated to all staff — the home maintains comprehensive dietary records ensuring every member of the team can safely meet children's needs.",
      severity: "positive",
    });
  }

  if (
    nutritionAssessmentRate >= 100 &&
    nutritionGoalsMetRate >= 90 &&
    total_children > 0 &&
    assessmentsWithGoals > 0
  ) {
    insights.push({
      text: `Every child assessed with ${nutritionGoalsMetRate}% of nutritional goals met — the home demonstrates that nutrition assessments translate into genuine improvements in children's nutritional outcomes.`,
      severity: "positive",
    });
  }

  if (
    correctiveActionCompletionRate >= 100 &&
    totalCorrectiveActionsRequired > 0
  ) {
    insights.push({
      text: "All food hygiene corrective actions completed — the home responds promptly and completely to food safety improvement requirements, demonstrating a proactive approach to food safety management.",
      severity: "positive",
    });
  }

  if (
    freshIngredientRate >= 90 &&
    portionAppropriateRate >= 95 &&
    totalMealPlans > 0
  ) {
    insights.push({
      text: `${freshIngredientRate}% fresh ingredients with ${portionAppropriateRate}% appropriate portions — the home provides high-quality, fresh, appropriately portioned meals that support children's health and development.`,
      severity: "positive",
    });
  }

  if (
    culturalNeedsMetRate >= 95 &&
    totalMealPlans > 0
  ) {
    insights.push({
      text: `${culturalNeedsMetRate}% cultural dietary needs met — the home consistently respects and accommodates children's cultural and religious dietary requirements, supporting their identity and well-being.`,
      severity: "positive",
    });
  }

  if (
    dietitianReferralCompletionRate >= 100 &&
    referralsNeeded.length > 0
  ) {
    insights.push({
      text: "All dietitian referrals completed — children requiring specialist nutritional input receive timely access to professional support, ensuring their dietary needs are managed by appropriately qualified professionals.",
      severity: "positive",
    });
  }

  if (
    specialDietMonitoringRate >= 90 &&
    totalActiveSpecialDiets > 0
  ) {
    insights.push({
      text: `${specialDietMonitoringRate}% of special diets monitored within expected frequency — the home provides consistent, robust oversight of children's specialist dietary needs.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (nutrition_rating === "outstanding") {
    headline =
      "Outstanding nutrition and dietary management — meals are planned and delivered effectively, dietary requirements are met, food hygiene standards are high, and special diets are managed with excellent adherence.";
  } else if (nutrition_rating === "good") {
    headline = `Good nutrition and dietary management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (nutrition_rating === "adequate") {
    headline = `Adequate nutrition and dietary management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children receive safe, nutritious, and well-managed meals.`;
  } else {
    headline = `Nutrition and dietary management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's nutritional needs are met safely and consistently.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    nutrition_rating,
    nutrition_score: score,
    headline,
    total_meal_plans: totalMealPlans,
    total_dietary_requirements: totalDietaryRequirements,
    total_nutrition_assessments: totalNutritionAssessments,
    total_food_hygiene_inspections: totalFoodHygieneInspections,
    total_special_diets: totalSpecialDiets,
    meal_plan_compliance_rate: mealPlanComplianceRate,
    dietary_requirement_coverage_rate: dietaryRequirementCoverageRate,
    nutrition_assessment_rate: nutritionAssessmentRate,
    food_hygiene_score: foodHygieneScore,
    special_diet_adherence_rate: specialDietAdherenceRate,
    child_choice_rate: childChoiceRate,
    meal_nutritional_guideline_rate: mealNutritionalGuidelineRate,
    allergen_check_rate: allergenCheckRate,
    fresh_ingredient_rate: freshIngredientRate,
    cultural_needs_met_rate: culturalNeedsMetRate,
    staff_food_hygiene_training_rate: staffFoodHygieneTrainingRate,
    corrective_action_completion_rate: correctiveActionCompletionRate,
    dietary_documentation_rate: dietaryDocumentationRate,
    dietary_staff_informed_rate: dietaryStaffInformedRate,
    emergency_plan_rate: emergencyPlanRate,
    nutrition_goals_met_rate: nutritionGoalsMetRate,
    dietitian_referral_completion_rate: dietitianReferralCompletionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
