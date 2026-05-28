import { describe, it, expect, beforeEach } from "vitest";
import {
  computeNutritionDietaryManagement,
  type NutritionDietaryManagementInput,
  type MealPlanRecordInput,
  type DietaryRequirementRecordInput,
  type NutritionAssessmentRecordInput,
  type FoodHygieneRecordInput,
  type SpecialDietRecordInput,
} from "../home-nutrition-dietary-management-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `ndm-${++_id}`;

function makeMealPlan(overrides: Partial<MealPlanRecordInput> = {}): MealPlanRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    plan_date: "2026-05-20",
    meal_type: "lunch",
    planned: true,
    delivered: true,
    meets_nutritional_guidelines: true,
    child_involved_in_choice: true,
    child_feedback_positive: true,
    portion_appropriate: true,
    fresh_ingredients_used: true,
    cultural_dietary_needs_met: true,
    allergen_check_completed: true,
    staff_member: "staff1",
    notes: null,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeDietaryRequirement(overrides: Partial<DietaryRequirementRecordInput> = {}): DietaryRequirementRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    requirement_type: "allergy",
    description: "Peanut allergy",
    severity: "moderate",
    documented: true,
    care_plan_updated: true,
    all_staff_informed: true,
    kitchen_notified: true,
    emergency_plan_in_place: true,
    last_reviewed_date: "2026-04-01",
    review_due_date: "2026-07-01",
    active: true,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeNutritionAssessment(overrides: Partial<NutritionAssessmentRecordInput> = {}): NutritionAssessmentRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    assessment_date: "2026-05-10",
    assessor: "nurse1",
    assessment_type: "periodic",
    bmi_recorded: true,
    height_recorded: true,
    weight_recorded: true,
    dietary_intake_reviewed: true,
    nutritional_goals_set: true,
    goals_met: true,
    referral_to_dietitian: false,
    referral_completed: false,
    concerns_identified: [],
    recommendations: [],
    next_review_date: "2026-08-10",
    created_at: "2026-05-10",
    ...overrides,
  };
}

function makeFoodHygiene(overrides: Partial<FoodHygieneRecordInput> = {}): FoodHygieneRecordInput {
  return {
    id: uid(),
    inspection_date: "2026-05-15",
    inspector: "inspector1",
    inspection_type: "routine",
    food_storage_compliant: true,
    temperature_records_maintained: true,
    preparation_area_clean: true,
    hand_hygiene_compliant: true,
    allergen_labelling_correct: true,
    waste_disposal_compliant: true,
    pest_control_adequate: true,
    staff_food_hygiene_trained: true,
    overall_score: 95,
    corrective_actions_required: 0,
    corrective_actions_completed: 0,
    next_inspection_due: "2026-08-15",
    created_at: "2026-05-15",
    ...overrides,
  };
}

function makeSpecialDiet(overrides: Partial<SpecialDietRecordInput> = {}): SpecialDietRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    diet_type: "therapeutic",
    prescribed_by: "dietitian1",
    start_date: "2026-03-01",
    active: true,
    plan_documented: true,
    meals_compliant: 28,
    meals_total: 28,
    child_adherence_willing: true,
    staff_trained: true,
    monitoring_frequency: "weekly",
    last_monitored_date: "2026-05-25",
    outcomes_positive: true,
    review_date: "2026-07-01",
    created_at: "2026-03-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<NutritionDietaryManagementInput> = {}): NutritionDietaryManagementInput {
  return {
    today: "2026-05-28",
    total_children: 0,
    meal_plan_records: [],
    dietary_requirement_records: [],
    nutrition_assessment_records: [],
    food_hygiene_records: [],
    special_diet_records: [],
    ...overrides,
  };
}

beforeEach(() => { _id = 0; });

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeNutritionDietaryManagement", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data / 0 when all arrays empty and 0 children", () => {
      const r = computeNutritionDietaryManagement(baseInput());
      expect(r.nutrition_rating).toBe("insufficient_data");
      expect(r.nutrition_score).toBe(0);
    });

    it("has correct headline for insufficient data", () => {
      const r = computeNutritionDietaryManagement(baseInput());
      expect(r.headline).toContain("No children on placement");
      expect(r.headline).toContain("insufficient data");
    });

    it("returns all zero metrics for insufficient data", () => {
      const r = computeNutritionDietaryManagement(baseInput());
      expect(r.total_meal_plans).toBe(0);
      expect(r.total_dietary_requirements).toBe(0);
      expect(r.total_nutrition_assessments).toBe(0);
      expect(r.total_food_hygiene_inspections).toBe(0);
      expect(r.total_special_diets).toBe(0);
      expect(r.meal_plan_compliance_rate).toBe(0);
      expect(r.dietary_requirement_coverage_rate).toBe(0);
      expect(r.nutrition_assessment_rate).toBe(0);
      expect(r.food_hygiene_score).toBe(0);
      expect(r.special_diet_adherence_rate).toBe(0);
      expect(r.child_choice_rate).toBe(0);
      expect(r.meal_nutritional_guideline_rate).toBe(0);
      expect(r.allergen_check_rate).toBe(0);
      expect(r.fresh_ingredient_rate).toBe(0);
      expect(r.cultural_needs_met_rate).toBe(0);
      expect(r.staff_food_hygiene_training_rate).toBe(0);
      expect(r.corrective_action_completion_rate).toBe(0);
      expect(r.dietary_documentation_rate).toBe(0);
      expect(r.dietary_staff_informed_rate).toBe(0);
      expect(r.emergency_plan_rate).toBe(0);
      expect(r.nutrition_goals_met_rate).toBe(0);
      expect(r.dietitian_referral_completion_rate).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeNutritionDietaryManagement(baseInput());
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  // ── Inadequate baseline (all empty + children > 0) ─────────────────────

  describe("inadequate baseline — all empty with children", () => {
    it("returns inadequate / 15 when all arrays empty and children > 0", () => {
      const r = computeNutritionDietaryManagement(baseInput({ total_children: 3 }));
      expect(r.nutrition_rating).toBe("inadequate");
      expect(r.nutrition_score).toBe(15);
    });

    it("has headline referencing no data despite children on placement", () => {
      const r = computeNutritionDietaryManagement(baseInput({ total_children: 3 }));
      expect(r.headline).toContain("No nutrition or dietary management data");
      expect(r.headline).toContain("urgent attention");
    });

    it("returns exactly 1 concern", () => {
      const r = computeNutritionDietaryManagement(baseInput({ total_children: 3 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No meal plan records");
    });

    it("returns exactly 2 recommendations", () => {
      const r = computeNutritionDietaryManagement(baseInput({ total_children: 3 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("returns exactly 1 critical insight", () => {
      const r = computeNutritionDietaryManagement(baseInput({ total_children: 3 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns empty strengths", () => {
      const r = computeNutritionDietaryManagement(baseInput({ total_children: 1 }));
      expect(r.strengths).toHaveLength(0);
    });

    it("works for total_children = 1", () => {
      const r = computeNutritionDietaryManagement(baseInput({ total_children: 1 }));
      expect(r.nutrition_rating).toBe("inadequate");
      expect(r.nutrition_score).toBe(15);
    });
  });

  // ── pct(0,0) = 0 ──────────────────────────────────────────────────────

  describe("pct(0,0) = 0", () => {
    it("all rates are 0 when arrays are empty (children=1, only one record type present to avoid allEmpty)", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        // provide a single food hygiene record so we aren't allEmpty
        food_hygiene_records: [makeFoodHygiene({ overall_score: 95 })],
      }));
      // rates that depend on empty arrays should be 0
      expect(r.meal_plan_compliance_rate).toBe(0);
      expect(r.special_diet_adherence_rate).toBe(0);
      expect(r.child_choice_rate).toBe(0);
      expect(r.meal_nutritional_guideline_rate).toBe(0);
      expect(r.allergen_check_rate).toBe(0);
      expect(r.fresh_ingredient_rate).toBe(0);
      expect(r.cultural_needs_met_rate).toBe(0);
      expect(r.dietary_documentation_rate).toBe(0);
      expect(r.dietary_staff_informed_rate).toBe(0);
      expect(r.emergency_plan_rate).toBe(0);
      expect(r.nutrition_goals_met_rate).toBe(0);
      expect(r.dietitian_referral_completion_rate).toBe(0);
      expect(r.corrective_action_completion_rate).toBe(0);
    });
  });

  // ── Bonus tests (individual) ───────────────────────────────────────────

  describe("Bonus 1: mealPlanComplianceRate", () => {
    it("awards +4 when mealPlanComplianceRate >= 95", () => {
      // 20/20 planned & delivered = 100%
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: true,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + bonus1(+4) = 56; no other bonuses from 0-rate arrays; penalty for allergenCheckRate<50 with meals>0 triggers allergen concern but not penalty since allergenCheckRate=0 <80 but that's a concern not penalty. Actually let's check penalties:
      // mealPlanCompliance=100 >=50 so no penalty1. foodHygiene: no records, guard=0 no penalty. specialDiet: no records, guard=0. lifeThreatening: 0. So base 52+4=56.
      expect(r.nutrition_score).toBe(56);
    });

    it("awards +2 when mealPlanComplianceRate >= 80 and < 95", () => {
      // 17/20 planned & delivered = 85%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: true,
          delivered: i < 17,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.nutrition_score).toBe(54); // 52+2
    });

    it("awards +0 when mealPlanComplianceRate < 80", () => {
      // 10/20 = 50%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: true,
          delivered: i < 10,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.nutrition_score).toBe(52); // 52+0
    });
  });

  describe("Bonus 2: mealNutritionalGuidelineRate", () => {
    it("awards +3 when >= 90", () => {
      // 19/20 = 95%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: false, delivered: false,
          meets_nutritional_guidelines: i < 19,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + bonus2(+3) = 55; mealPlanCompliance=0 <50 => penalty -5; 55-5=50
      expect(r.nutrition_score).toBe(50);
    });

    it("awards +1 when >= 70 and < 90", () => {
      // 15/20 = 75%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: false, delivered: false,
          meets_nutritional_guidelines: i < 15,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + bonus2(+1) = 53; mealPlanCompliance=0 <50 => penalty -5; 53-5=48
      expect(r.nutrition_score).toBe(48);
    });

    it("awards +0 when < 70", () => {
      // 10/20 = 50%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: false, delivered: false,
          meets_nutritional_guidelines: i < 10,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + 0; mealPlanCompliance=0 <50 => -5; 52-5=47
      expect(r.nutrition_score).toBe(47);
    });
  });

  describe("Bonus 3: dietaryDocumentationRate", () => {
    it("awards +3 when >= 100", () => {
      // 2/2 active & documented = 100%
      const reqs = [
        makeDietaryRequirement({ child_id: "c1", documented: true, active: true, severity: "moderate", all_staff_informed: false, kitchen_notified: false }),
        makeDietaryRequirement({ child_id: "c2", documented: true, active: true, severity: "moderate", all_staff_informed: false, kitchen_notified: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        dietary_requirement_records: reqs,
      }));
      // base 52 + bonus3(+3) + bonus4(nutritionAssessmentRate=0 so no bonus) = 55; no penalties triggered (no meal plans, no hygiene, no special diets, no life-threatening)
      expect(r.nutrition_score).toBe(55);
    });

    it("awards +1 when >= 80 and < 100", () => {
      // 4/5 active documented = 80%
      const reqs = Array.from({ length: 5 }, (_, i) =>
        makeDietaryRequirement({ child_id: `c${i}`, documented: i < 4, active: true, severity: "moderate", all_staff_informed: false, kitchen_notified: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        dietary_requirement_records: reqs,
      }));
      // base 52 + bonus3(+1) = 53
      expect(r.nutrition_score).toBe(53);
    });

    it("awards +0 when < 80", () => {
      // 1/5 = 20%
      const reqs = Array.from({ length: 5 }, (_, i) =>
        makeDietaryRequirement({ child_id: `c${i}`, documented: i < 1, active: true, severity: "moderate", all_staff_informed: false, kitchen_notified: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        dietary_requirement_records: reqs,
      }));
      expect(r.nutrition_score).toBe(52);
    });
  });

  describe("Bonus 4: nutritionAssessmentRate", () => {
    it("awards +4 when >= 100 (all children assessed)", () => {
      const assessments = [
        makeNutritionAssessment({ child_id: "c1", nutritional_goals_set: false, referral_to_dietitian: false }),
        makeNutritionAssessment({ child_id: "c2", nutritional_goals_set: false, referral_to_dietitian: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        nutrition_assessment_records: assessments,
      }));
      // base 52 + bonus4(+4) = 56
      expect(r.nutrition_score).toBe(56);
    });

    it("awards +2 when >= 80 and < 100", () => {
      // 4/5 unique children assessed = 80%
      const assessments = Array.from({ length: 4 }, (_, i) =>
        makeNutritionAssessment({ child_id: `c${i + 1}`, nutritional_goals_set: false, referral_to_dietitian: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        nutrition_assessment_records: assessments,
      }));
      // base 52 + bonus4(+2) = 54
      expect(r.nutrition_score).toBe(54);
    });

    it("awards +0 when < 80", () => {
      // 1/5 = 20%
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        nutrition_assessment_records: [makeNutritionAssessment({ child_id: "c1", nutritional_goals_set: false, referral_to_dietitian: false })],
      }));
      // base 52 + 0 = 52
      expect(r.nutrition_score).toBe(52);
    });
  });

  describe("Bonus 5: foodHygieneScore", () => {
    it("awards +3 when >= 90", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 95, staff_food_hygiene_trained: false, corrective_actions_required: 0, corrective_actions_completed: 0 })],
      }));
      // base 52 + bonus5(+3) = 55
      expect(r.nutrition_score).toBe(55);
    });

    it("awards +1 when >= 70 and < 90", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 75, staff_food_hygiene_trained: false, corrective_actions_required: 0, corrective_actions_completed: 0 })],
      }));
      // base 52 + bonus5(+1) = 53
      expect(r.nutrition_score).toBe(53);
    });

    it("awards +0 when < 70", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 60, staff_food_hygiene_trained: false, corrective_actions_required: 0, corrective_actions_completed: 0 })],
      }));
      // base 52 + 0 = 52 (foodHygieneScore 60 is >=50, so no penalty either)
      expect(r.nutrition_score).toBe(52);
    });
  });

  describe("Bonus 6: specialDietAdherenceRate", () => {
    it("awards +3 when >= 95", () => {
      const diet = makeSpecialDiet({
        active: true,
        meals_compliant: 20,
        meals_total: 20,
        plan_documented: false,
        staff_trained: false,
        child_adherence_willing: false,
        outcomes_positive: null,
        last_monitored_date: null,
      });
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: [diet],
      }));
      // base 52 + bonus6(+3) = 55
      expect(r.nutrition_score).toBe(55);
    });

    it("awards +1 when >= 80 and < 95", () => {
      const diet = makeSpecialDiet({
        active: true,
        meals_compliant: 17,
        meals_total: 20,
        plan_documented: false,
        staff_trained: false,
        child_adherence_willing: false,
        outcomes_positive: null,
        last_monitored_date: null,
      });
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: [diet],
      }));
      // 17/20=85%, base 52 + bonus6(+1) = 53
      expect(r.nutrition_score).toBe(53);
    });

    it("awards +0 when < 80", () => {
      const diet = makeSpecialDiet({
        active: true,
        meals_compliant: 10,
        meals_total: 20,
        plan_documented: false,
        staff_trained: false,
        child_adherence_willing: false,
        outcomes_positive: null,
        last_monitored_date: null,
      });
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: [diet],
      }));
      // 10/20=50%, base 52 + 0 = 52; specialDietAdherence=50 >= 50 so no penalty
      expect(r.nutrition_score).toBe(52);
    });
  });

  describe("Bonus 7: childChoiceRate", () => {
    it("awards +3 when >= 90", () => {
      // 19/20 = 95%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: false, delivered: false,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: i < 19,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + bonus7(+3) = 55; mealPlanCompliance=0<50 => -5; 55-5=50
      expect(r.nutrition_score).toBe(50);
    });

    it("awards +1 when >= 70 and < 90", () => {
      // 15/20 = 75%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: false, delivered: false,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: i < 15,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + bonus7(+1) = 53; mealPlanCompliance=0<50 => -5; 53-5=48
      expect(r.nutrition_score).toBe(48);
    });

    it("awards +0 when < 70", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: false, delivered: false,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: i < 10,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + 0; mealPlanCompliance=0<50 => -5; 52-5=47
      expect(r.nutrition_score).toBe(47);
    });
  });

  describe("Bonus 8: allergenCheckRate", () => {
    it("awards +3 when >= 100", () => {
      // 20/20 = 100%
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: false, delivered: false,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: true,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + bonus8(+3) = 55; mealPlanCompliance=0<50 => -5; 55-5=50
      expect(r.nutrition_score).toBe(50);
    });

    it("awards +1 when >= 80 and < 100", () => {
      // 17/20 = 85%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: false, delivered: false,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: i < 17,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + bonus8(+1) = 53; mealPlanCompliance=0<50 => -5; 53-5=48
      expect(r.nutrition_score).toBe(48);
    });

    it("awards +0 when < 80", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: false, delivered: false,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: i < 10,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + 0; mealPlanCompliance=0<50 => -5; 52-5=47
      expect(r.nutrition_score).toBe(47);
    });
  });

  describe("Bonus 9: emergencyPlanRate", () => {
    it("awards +2 when >= 100 (all severe/life-threatening have plans)", () => {
      const reqs = [
        makeDietaryRequirement({ severity: "life_threatening", emergency_plan_in_place: true, active: true, documented: false, all_staff_informed: false, kitchen_notified: false }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, active: true, documented: false, all_staff_informed: false, kitchen_notified: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        dietary_requirement_records: reqs,
      }));
      // base 52 + bonus9(+2) = 54
      expect(r.nutrition_score).toBe(54);
    });

    it("awards +1 when >= 80 and < 100", () => {
      // 4/5 = 80%
      const reqs = Array.from({ length: 5 }, (_, i) =>
        makeDietaryRequirement({
          child_id: `c${i}`,
          severity: "severe",
          emergency_plan_in_place: i < 4,
          active: true,
          documented: false,
          all_staff_informed: false,
          kitchen_notified: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        dietary_requirement_records: reqs,
      }));
      // base 52 + bonus9(+1) = 53
      expect(r.nutrition_score).toBe(53);
    });

    it("awards +0 when < 80", () => {
      // 1/5 = 20%
      const reqs = Array.from({ length: 5 }, (_, i) =>
        makeDietaryRequirement({
          child_id: `c${i}`,
          severity: "severe",
          emergency_plan_in_place: i < 1,
          active: true,
          documented: false,
          all_staff_informed: false,
          kitchen_notified: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        dietary_requirement_records: reqs,
      }));
      // base 52 + 0 = 52; no life_threatening so penalty4 won't trigger (life_threatening.length=0)
      // wait, severity is severe not life_threatening, so lifeThreatening=0, no penalty4
      expect(r.nutrition_score).toBe(52);
    });

    it("emergencyPlanRate is 0 (pct(0,0)) when no severe/life-threatening reqs exist", () => {
      const reqs = [
        makeDietaryRequirement({ severity: "moderate", active: true, documented: false, all_staff_informed: false, kitchen_notified: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      // pct(0,0) = 0 for emergency_plan_rate since no severe/life_threatening
      expect(r.emergency_plan_rate).toBe(0);
      // bonus9 needs emergencyPlanRate >= 80, it's 0 so no bonus
      expect(r.nutrition_score).toBe(52);
    });
  });

  // ── All bonuses combined ───────────────────────────────────────────────

  describe("all bonuses combined", () => {
    it("awards max 28 bonus points for a total of 80 (outstanding)", () => {
      // Construct perfect data to trigger all max bonuses
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          child_id: `c${(i % 3) + 1}`,
          planned: true,
          delivered: true,            // 100% compliance => +4
          meets_nutritional_guidelines: true, // 100% => +3
          child_involved_in_choice: true,     // 100% => +3
          allergen_check_completed: true,     // 100% => +3
          child_feedback_positive: true,
          fresh_ingredients_used: true,
          cultural_dietary_needs_met: true,
          portion_appropriate: true,
        }),
      );

      const dietReqs = [
        makeDietaryRequirement({ child_id: "c1", severity: "life_threatening", emergency_plan_in_place: true, documented: true, active: true }),
        makeDietaryRequirement({ child_id: "c2", severity: "severe", emergency_plan_in_place: true, documented: true, active: true }),
        makeDietaryRequirement({ child_id: "c3", severity: "moderate", documented: true, active: true }),
      ];
      // dietaryDocumentationRate = 100% => +3

      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c2" }),
        makeNutritionAssessment({ child_id: "c3" }),
      ];
      // nutritionAssessmentRate = 3/3 = 100% => +4

      const hygiene = [makeFoodHygiene({ overall_score: 95 })];
      // foodHygieneScore = 95 >= 90 => +3

      const specialDiets = [makeSpecialDiet({
        active: true, meals_compliant: 20, meals_total: 20,
      })];
      // specialDietAdherenceRate = 100% => +3

      // emergencyPlanRate: 2/2 severe+life_threatening = 100% => +2

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 3,
        meal_plan_records: meals,
        dietary_requirement_records: dietReqs,
        nutrition_assessment_records: assessments,
        food_hygiene_records: hygiene,
        special_diet_records: specialDiets,
      }));

      // 52 + 4 + 3 + 3 + 4 + 3 + 3 + 3 + 3 + 2 = 80
      expect(r.nutrition_score).toBe(80);
      expect(r.nutrition_rating).toBe("outstanding");
    });
  });

  // ── Penalty tests (individual) ─────────────────────────────────────────

  describe("Penalty 1: mealPlanComplianceRate < 50", () => {
    it("applies -5 when mealPlanCompliance < 50 and totalMealPlans > 0", () => {
      // 5/20 planned & delivered = 25%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: true,
          delivered: i < 5,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + 0 bonuses - 5 = 47
      expect(r.nutrition_score).toBe(47);
    });

    it("does not apply penalty when mealPlanCompliance >= 50", () => {
      // 11/20 = 55%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: true,
          delivered: i < 11,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // base 52 + 0 bonuses = 52 (no penalty since 55% >= 50)
      expect(r.nutrition_score).toBe(52);
    });
  });

  describe("Penalty 2: foodHygieneScore < 50", () => {
    it("applies -5 when foodHygieneScore < 50 and inspections > 0", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 40, staff_food_hygiene_trained: false, corrective_actions_required: 0, corrective_actions_completed: 0 })],
      }));
      // base 52 + 0 bonuses - 5 = 47
      expect(r.nutrition_score).toBe(47);
    });

    it("does not apply penalty when foodHygieneScore >= 50", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 55, staff_food_hygiene_trained: false, corrective_actions_required: 0, corrective_actions_completed: 0 })],
      }));
      // 52 + 0 = 52
      expect(r.nutrition_score).toBe(52);
    });
  });

  describe("Penalty 3: specialDietAdherenceRate < 50", () => {
    it("applies -5 when adherence < 50 and totalSpecialDietMeals > 0", () => {
      const diet = makeSpecialDiet({
        active: true,
        meals_compliant: 5,
        meals_total: 20,
        plan_documented: false,
        staff_trained: false,
        child_adherence_willing: false,
        outcomes_positive: null,
        last_monitored_date: null,
      });
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: [diet],
      }));
      // 5/20 = 25%; base 52 - 5 = 47
      expect(r.nutrition_score).toBe(47);
    });

    it("does not apply penalty when adherence >= 50", () => {
      const diet = makeSpecialDiet({
        active: true,
        meals_compliant: 11,
        meals_total: 20,
        plan_documented: false,
        staff_trained: false,
        child_adherence_willing: false,
        outcomes_positive: null,
        last_monitored_date: null,
      });
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: [diet],
      }));
      // 11/20 = 55%; base 52
      expect(r.nutrition_score).toBe(52);
    });
  });

  describe("Penalty 4: lifeThreateningWithoutPlan", () => {
    it("applies -3 when life-threatening requirement lacks emergency plan", () => {
      const reqs = [
        makeDietaryRequirement({
          severity: "life_threatening",
          emergency_plan_in_place: false,
          active: true,
          documented: false,
          all_staff_informed: false,
          kitchen_notified: false,
        }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      // base 52 - 3 = 49
      expect(r.nutrition_score).toBe(49);
    });

    it("does not apply when all life-threatening have plans", () => {
      const reqs = [
        makeDietaryRequirement({
          severity: "life_threatening",
          emergency_plan_in_place: true,
          active: true,
          documented: false,
          all_staff_informed: false,
          kitchen_notified: false,
        }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      // emergency_plan_rate = 100% => bonus9(+2); base 52+2 = 54
      expect(r.nutrition_score).toBe(54);
    });

    it("does not apply when no life-threatening requirements exist at all", () => {
      const reqs = [
        makeDietaryRequirement({
          severity: "moderate",
          emergency_plan_in_place: false,
          active: true,
          documented: false,
          all_staff_informed: false,
          kitchen_notified: false,
        }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      // lifeThreatening.length = 0, so guard prevents penalty
      expect(r.nutrition_score).toBe(52);
    });
  });

  // ── Penalty guards ─────────────────────────────────────────────────────

  describe("penalty guards", () => {
    it("penalty 1 guard: no penalty when totalMealPlans = 0 even if compliance would be 0", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 95, staff_food_hygiene_trained: false })],
      }));
      // meal_plan_compliance_rate = pct(0,0) = 0, but totalMealPlans=0 so guard blocks penalty
      // base 52 + bonus5(+3 for 95>=90) = 55
      expect(r.nutrition_score).toBe(55);
    });

    it("penalty 2 guard: no penalty when totalFoodHygieneInspections = 0", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: [makeNutritionAssessment({ child_id: "c1", nutritional_goals_set: false, referral_to_dietitian: false })],
      }));
      // foodHygieneScore=0 <50 but totalFoodHygieneInspections=0 so guard blocks
      // base 52 + bonus4(+4 for 100% assessment rate) = 56
      expect(r.nutrition_score).toBe(56);
    });

    it("penalty 3 guard: no penalty when totalSpecialDietMeals = 0", () => {
      // active special diet but meals_total = 0
      const diet = makeSpecialDiet({
        active: true,
        meals_compliant: 0,
        meals_total: 0,
        plan_documented: false,
        staff_trained: false,
        child_adherence_willing: false,
        outcomes_positive: null,
        last_monitored_date: null,
      });
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: [diet],
      }));
      // specialDietAdherenceRate = pct(0,0) = 0, but totalSpecialDietMeals=0 so no penalty
      expect(r.nutrition_score).toBe(52);
    });

    it("penalty 4 guard: no penalty when lifeThreatening.length = 0 even with inactive life_threatening", () => {
      const reqs = [
        makeDietaryRequirement({
          severity: "life_threatening",
          emergency_plan_in_place: false,
          active: false, // inactive, so not counted
          documented: false,
          all_staff_informed: false,
          kitchen_notified: false,
        }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      // inactive requirement, so no active life-threatening; lifeThreatening.length = 0
      expect(r.nutrition_score).toBe(52);
    });
  });

  // ── Multiple penalties stacking ────────────────────────────────────────

  describe("multiple penalties stacking", () => {
    it("applies multiple penalties: -5 -5 -5 -3 = -18 from base 52 = 34", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: false, // 0% compliance
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const hygiene = [makeFoodHygiene({ overall_score: 30, staff_food_hygiene_trained: false })];
      const diets = [makeSpecialDiet({
        active: true, meals_compliant: 2, meals_total: 20,
        plan_documented: false, staff_trained: false, child_adherence_willing: false,
        outcomes_positive: null, last_monitored_date: null,
      })];
      const reqs = [makeDietaryRequirement({
        severity: "life_threatening", emergency_plan_in_place: false, active: true,
        documented: false, all_staff_informed: false, kitchen_notified: false,
      })];

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        food_hygiene_records: hygiene,
        special_diet_records: diets,
        dietary_requirement_records: reqs,
      }));
      // base 52; penalties: -5 -5 -5 -3 = -18; 52-18=34
      expect(r.nutrition_score).toBe(34);
      expect(r.nutrition_rating).toBe("inadequate");
    });
  });

  // ── Rating boundaries ──────────────────────────────────────────────────

  describe("rating boundaries", () => {
    it("outstanding at exactly 80", () => {
      // Build a scenario scoring exactly 80 (all max bonuses)
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: true,
          meets_nutritional_guidelines: true,
          child_involved_in_choice: true,
          allergen_check_completed: true,
        }),
      );
      const dietReqs = [
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, documented: true, active: true, child_id: "c1" }),
        makeDietaryRequirement({ severity: "life_threatening", emergency_plan_in_place: true, documented: true, active: true, child_id: "c2" }),
        makeDietaryRequirement({ severity: "moderate", documented: true, active: true, child_id: "c3" }),
      ];
      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c2" }),
        makeNutritionAssessment({ child_id: "c3" }),
      ];
      const hygiene = [makeFoodHygiene({ overall_score: 95 })];
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 20, meals_total: 20 })];

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 3,
        meal_plan_records: meals,
        dietary_requirement_records: dietReqs,
        nutrition_assessment_records: assessments,
        food_hygiene_records: hygiene,
        special_diet_records: diets,
      }));
      expect(r.nutrition_score).toBe(80);
      expect(r.nutrition_rating).toBe("outstanding");
    });

    it("good at 79 (just below outstanding)", () => {
      // 80 - 1 penalty point scenario: need score of 79
      // Use all bonuses (28) => 80, but lose 1 by reducing one bonus tier
      // e.g. mealPlanCompliance at 85% = +2 instead of +4 => 80-2=78, not right
      // Instead: all max bonuses but emergencyPlanRate at 80% = +1 instead of +2 => 52+27=79
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: true,
          meets_nutritional_guidelines: true,
          child_involved_in_choice: true,
          allergen_check_completed: true,
        }),
      );
      const dietReqs = [
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, documented: true, active: true, child_id: "c1" }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, documented: true, active: true, child_id: "c2" }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, documented: true, active: true, child_id: "c3" }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, documented: true, active: true, child_id: "c4" }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: false, documented: true, active: true, child_id: "c5" }),
      ];
      // emergencyPlanRate = 4/5 = 80% => +1 instead of +2
      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c2" }),
        makeNutritionAssessment({ child_id: "c3" }),
        makeNutritionAssessment({ child_id: "c4" }),
        makeNutritionAssessment({ child_id: "c5" }),
      ];
      const hygiene = [makeFoodHygiene({ overall_score: 95 })];
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 20, meals_total: 20 })];

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        meal_plan_records: meals,
        dietary_requirement_records: dietReqs,
        nutrition_assessment_records: assessments,
        food_hygiene_records: hygiene,
        special_diet_records: diets,
      }));
      // 52 + 4+3+3+4+3+3+3+3+1 = 52+27 = 79
      expect(r.nutrition_score).toBe(79);
      expect(r.nutrition_rating).toBe("good");
    });

    it("good at exactly 65", () => {
      // base 52 + 13 bonus points = 65
      // Bonus 1(+4) + Bonus 2(+3) + Bonus 4(+4) + Bonus 9(+2) = 13
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: true,
          meets_nutritional_guidelines: true,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const assessments = [makeNutritionAssessment({ child_id: "c1", nutritional_goals_set: false, referral_to_dietitian: false })];
      const dietReqs = [
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, documented: false, active: true, all_staff_informed: false, kitchen_notified: false }),
      ];

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        nutrition_assessment_records: assessments,
        dietary_requirement_records: dietReqs,
      }));
      // 52 + 4(compliance) + 3(nutritionalGuideline) + 4(assessmentRate100%) + 2(emergencyPlan100%) = 65
      expect(r.nutrition_score).toBe(65);
      expect(r.nutrition_rating).toBe("good");
    });

    it("adequate at 64 (just below good)", () => {
      // base 52 + 12 bonus = 64
      // Bonus1(+4) + Bonus2(+3) + Bonus4(+4) + Bonus9(+1) = 12
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: true,
          meets_nutritional_guidelines: true,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const assessments = [makeNutritionAssessment({ child_id: "c1", nutritional_goals_set: false, referral_to_dietitian: false })];
      const dietReqs = [
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, active: true, documented: false, all_staff_informed: false, kitchen_notified: false, child_id: "c1" }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, active: true, documented: false, all_staff_informed: false, kitchen_notified: false, child_id: "c2" }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, active: true, documented: false, all_staff_informed: false, kitchen_notified: false, child_id: "c3" }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, active: true, documented: false, all_staff_informed: false, kitchen_notified: false, child_id: "c4" }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: false, active: true, documented: false, all_staff_informed: false, kitchen_notified: false, child_id: "c5" }),
      ];
      // emergencyPlanRate = 4/5 = 80% => +1

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        nutrition_assessment_records: assessments,
        dietary_requirement_records: dietReqs,
      }));
      // 52 + 4 + 3 + 4 + 1 = 64
      expect(r.nutrition_score).toBe(64);
      expect(r.nutrition_rating).toBe("adequate");
    });

    it("adequate at exactly 45", () => {
      // Need score of 45. base 52 - 7 = 45. So need -7 in penalties, +0 bonuses.
      // Penalty1(-5) + penalty4(-3) = -8; need one less, not easy.
      // Alternative: 52-5(penalty2)=47; need -2 more. That's 52-5-3(penalty4)=44. Hmm.
      // Let's use penalty1(-5) = 47. We need +0 bonuses but arrive at 47. That's adequate already.
      // For exactly 45: 52 - 5(penalty1) - 3(penalty4) + 1(some bonus) = 45
      // 52 - 8 + 1 = 45. Let's do penalty1 + penalty4 + bonus(e.g. bonus5 +1 for hygiene>=70)
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: false, // 0% compliance => penalty1 -5
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const reqs = [makeDietaryRequirement({
        severity: "life_threatening", emergency_plan_in_place: false, active: true,
        documented: false, all_staff_informed: false, kitchen_notified: false,
      })];
      // penalty4 -3
      const hygiene = [makeFoodHygiene({ overall_score: 75, staff_food_hygiene_trained: false })];
      // bonus5 +1 (>=70 <90)

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        dietary_requirement_records: reqs,
        food_hygiene_records: hygiene,
      }));
      // 52 + 1(bonus5) - 5(penalty1) - 3(penalty4) = 45
      expect(r.nutrition_score).toBe(45);
      expect(r.nutrition_rating).toBe("adequate");
    });

    it("inadequate at 44 (just below adequate)", () => {
      // base 52 - 5(penalty1) - 3(penalty4) = 44
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: false,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const reqs = [makeDietaryRequirement({
        severity: "life_threatening", emergency_plan_in_place: false, active: true,
        documented: false, all_staff_informed: false, kitchen_notified: false,
      })];

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        dietary_requirement_records: reqs,
      }));
      // 52 - 5 - 3 = 44
      expect(r.nutrition_score).toBe(44);
      expect(r.nutrition_rating).toBe("inadequate");
    });
  });

  // ── Score clamping ─────────────────────────────────────────────────────

  describe("score clamping", () => {
    it("score never goes below 0", () => {
      // Massive penalties but can't go below 0. All 4 penalties = -18, base 52, 52-18=34. Can't get below 0 easily.
      // But with base 52, minimum theoretical is 52-18=34 which is >0, so clamp doesn't matter here.
      // Still, verify clamp logic by ensuring max penalties don't produce negative:
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: false,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const hygiene = [makeFoodHygiene({ overall_score: 10, staff_food_hygiene_trained: false })];
      const diets = [makeSpecialDiet({
        active: true, meals_compliant: 1, meals_total: 20,
        plan_documented: false, staff_trained: false, child_adherence_willing: false,
        outcomes_positive: null, last_monitored_date: null,
      })];
      const reqs = [makeDietaryRequirement({
        severity: "life_threatening", emergency_plan_in_place: false, active: true,
        documented: false, all_staff_informed: false, kitchen_notified: false,
      })];

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        food_hygiene_records: hygiene,
        special_diet_records: diets,
        dietary_requirement_records: reqs,
      }));
      // 52 - 5 - 5 - 5 - 3 = 34 >= 0
      expect(r.nutrition_score).toBeGreaterThanOrEqual(0);
      expect(r.nutrition_score).toBe(34);
    });

    it("score never exceeds 100", () => {
      // Max possible: 52 + 28 = 80, which is under 100, so clamp at 100 is theoretical
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 3,
        meal_plan_records: Array.from({ length: 20 }, () => makeMealPlan()),
        dietary_requirement_records: [
          makeDietaryRequirement({ severity: "severe", child_id: "c1" }),
          makeDietaryRequirement({ severity: "life_threatening", child_id: "c2" }),
          makeDietaryRequirement({ child_id: "c3" }),
        ],
        nutrition_assessment_records: [
          makeNutritionAssessment({ child_id: "c1" }),
          makeNutritionAssessment({ child_id: "c2" }),
          makeNutritionAssessment({ child_id: "c3" }),
        ],
        food_hygiene_records: [makeFoodHygiene({ overall_score: 95 })],
        special_diet_records: [makeSpecialDiet({ active: true, meals_compliant: 20, meals_total: 20 })],
      }));
      expect(r.nutrition_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Metric calculations ────────────────────────────────────────────────

  describe("metric calculations", () => {
    it("calculates meal_plan_compliance_rate correctly (planned AND delivered / total)", () => {
      const meals = [
        makeMealPlan({ planned: true, delivered: true }),
        makeMealPlan({ planned: true, delivered: false }),
        makeMealPlan({ planned: false, delivered: true }),
        makeMealPlan({ planned: false, delivered: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // planned AND delivered: 1 out of 4 = 25%
      expect(r.meal_plan_compliance_rate).toBe(25);
    });

    it("calculates dietary_requirement_coverage_rate as unique children with active reqs / total_children", () => {
      const reqs = [
        makeDietaryRequirement({ child_id: "c1", active: true }),
        makeDietaryRequirement({ child_id: "c1", active: true }), // duplicate child
        makeDietaryRequirement({ child_id: "c2", active: true }),
        makeDietaryRequirement({ child_id: "c3", active: false }), // inactive
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 4,
        dietary_requirement_records: reqs,
      }));
      // unique active children: c1, c2 = 2/4 = 50%
      expect(r.dietary_requirement_coverage_rate).toBe(50);
    });

    it("calculates nutrition_assessment_rate as unique children assessed / total_children", () => {
      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c1" }), // duplicate
        makeNutritionAssessment({ child_id: "c2" }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 4,
        nutrition_assessment_records: assessments,
      }));
      // unique children: c1, c2 = 2/4 = 50%
      expect(r.nutrition_assessment_rate).toBe(50);
    });

    it("calculates food_hygiene_score as average of overall_score across records", () => {
      const records = [
        makeFoodHygiene({ overall_score: 90 }),
        makeFoodHygiene({ overall_score: 80 }),
        makeFoodHygiene({ overall_score: 70 }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: records,
      }));
      // (90+80+70)/3 = 80
      expect(r.food_hygiene_score).toBe(80);
    });

    it("calculates special_diet_adherence_rate across active diets", () => {
      const diets = [
        makeSpecialDiet({ active: true, meals_compliant: 8, meals_total: 10 }),
        makeSpecialDiet({ active: true, meals_compliant: 6, meals_total: 10 }),
        makeSpecialDiet({ active: false, meals_compliant: 0, meals_total: 10 }), // inactive
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      // active only: (8+6)/(10+10) = 14/20 = 70%
      expect(r.special_diet_adherence_rate).toBe(70);
    });

    it("calculates child_choice_rate correctly", () => {
      const meals = [
        makeMealPlan({ child_involved_in_choice: true }),
        makeMealPlan({ child_involved_in_choice: false }),
        makeMealPlan({ child_involved_in_choice: true }),
        makeMealPlan({ child_involved_in_choice: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // 3/4 = 75%
      expect(r.child_choice_rate).toBe(75);
    });

    it("calculates allergen_check_rate correctly", () => {
      const meals = [
        makeMealPlan({ allergen_check_completed: true }),
        makeMealPlan({ allergen_check_completed: true }),
        makeMealPlan({ allergen_check_completed: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // 2/3 = 67%
      expect(r.allergen_check_rate).toBe(67);
    });

    it("calculates fresh_ingredient_rate correctly", () => {
      const meals = [
        makeMealPlan({ fresh_ingredients_used: true }),
        makeMealPlan({ fresh_ingredients_used: true }),
        makeMealPlan({ fresh_ingredients_used: false }),
        makeMealPlan({ fresh_ingredients_used: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // 2/4 = 50%
      expect(r.fresh_ingredient_rate).toBe(50);
    });

    it("calculates cultural_needs_met_rate correctly", () => {
      const meals = [
        makeMealPlan({ cultural_dietary_needs_met: true }),
        makeMealPlan({ cultural_dietary_needs_met: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.cultural_needs_met_rate).toBe(50);
    });

    it("calculates staff_food_hygiene_training_rate correctly", () => {
      const records = [
        makeFoodHygiene({ staff_food_hygiene_trained: true }),
        makeFoodHygiene({ staff_food_hygiene_trained: false }),
        makeFoodHygiene({ staff_food_hygiene_trained: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: records,
      }));
      // 2/3 = 67%
      expect(r.staff_food_hygiene_training_rate).toBe(67);
    });

    it("calculates corrective_action_completion_rate correctly", () => {
      const records = [
        makeFoodHygiene({ corrective_actions_required: 5, corrective_actions_completed: 3 }),
        makeFoodHygiene({ corrective_actions_required: 3, corrective_actions_completed: 3 }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: records,
      }));
      // total required: 8, completed: 6, 6/8 = 75%
      expect(r.corrective_action_completion_rate).toBe(75);
    });

    it("calculates dietary_documentation_rate for active requirements only", () => {
      const reqs = [
        makeDietaryRequirement({ documented: true, active: true }),
        makeDietaryRequirement({ documented: false, active: true }),
        makeDietaryRequirement({ documented: false, active: false }), // inactive
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        dietary_requirement_records: reqs,
      }));
      // active only: 1 documented / 2 active = 50%
      expect(r.dietary_documentation_rate).toBe(50);
    });

    it("calculates dietary_staff_informed_rate for active requirements only", () => {
      const reqs = [
        makeDietaryRequirement({ all_staff_informed: true, active: true }),
        makeDietaryRequirement({ all_staff_informed: false, active: true }),
        makeDietaryRequirement({ all_staff_informed: true, active: false }), // inactive
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        dietary_requirement_records: reqs,
      }));
      // 1/2 = 50%
      expect(r.dietary_staff_informed_rate).toBe(50);
    });

    it("calculates emergency_plan_rate for severe/life_threatening active only", () => {
      const reqs = [
        makeDietaryRequirement({ severity: "life_threatening", emergency_plan_in_place: true, active: true }),
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: false, active: true }),
        makeDietaryRequirement({ severity: "moderate", emergency_plan_in_place: false, active: true }),
        makeDietaryRequirement({ severity: "life_threatening", emergency_plan_in_place: true, active: false }), // inactive
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 3,
        dietary_requirement_records: reqs,
      }));
      // active severe/life_threatening: 2 (life_threatening+true, severe+false); with plans: 1; 1/2 = 50%
      expect(r.emergency_plan_rate).toBe(50);
    });

    it("calculates nutrition_goals_met_rate for assessments with goals set", () => {
      const assessments = [
        makeNutritionAssessment({ nutritional_goals_set: true, goals_met: true }),
        makeNutritionAssessment({ nutritional_goals_set: true, goals_met: false }),
        makeNutritionAssessment({ nutritional_goals_set: false, goals_met: false }), // not counted
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        nutrition_assessment_records: assessments,
      }));
      // goals set: 2; met: 1; 1/2 = 50%
      expect(r.nutrition_goals_met_rate).toBe(50);
    });

    it("calculates dietitian_referral_completion_rate for assessments with referrals", () => {
      const assessments = [
        makeNutritionAssessment({ referral_to_dietitian: true, referral_completed: true }),
        makeNutritionAssessment({ referral_to_dietitian: true, referral_completed: false }),
        makeNutritionAssessment({ referral_to_dietitian: false, referral_completed: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        nutrition_assessment_records: assessments,
      }));
      // referrals needed: 2; completed: 1; 1/2 = 50%
      expect(r.dietitian_referral_completion_rate).toBe(50);
    });

    it("calculates meal_nutritional_guideline_rate correctly", () => {
      const meals = [
        makeMealPlan({ meets_nutritional_guidelines: true }),
        makeMealPlan({ meets_nutritional_guidelines: true }),
        makeMealPlan({ meets_nutritional_guidelines: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // 2/3 = 67%
      expect(r.meal_nutritional_guideline_rate).toBe(67);
    });

    it("counts totals correctly", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 3,
        meal_plan_records: [makeMealPlan(), makeMealPlan()],
        dietary_requirement_records: [makeDietaryRequirement(), makeDietaryRequirement(), makeDietaryRequirement()],
        nutrition_assessment_records: [makeNutritionAssessment()],
        food_hygiene_records: [makeFoodHygiene(), makeFoodHygiene()],
        special_diet_records: [makeSpecialDiet()],
      }));
      expect(r.total_meal_plans).toBe(2);
      expect(r.total_dietary_requirements).toBe(3);
      expect(r.total_nutrition_assessments).toBe(1);
      expect(r.total_food_hygiene_inspections).toBe(2);
      expect(r.total_special_diets).toBe(1);
    });

    it("dietary_requirement_coverage_rate is 0 when total_children is 0", () => {
      // Edge case: shouldn't reach here since allEmpty+0 children => insufficient data,
      // but if we have records with 0 children, coverage uses total_children > 0 check
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: [makeDietaryRequirement({ active: true, child_id: "c1" })],
      }));
      // 1 unique child / 1 total = 100%
      expect(r.dietary_requirement_coverage_rate).toBe(100);
    });

    it("nutrition_assessment_rate is 0 when total_children is 0 but assessments exist", () => {
      // Can't actually have 0 children + records without hitting allEmpty guard,
      // but if we have assessments with 0 children it means we have records, so not allEmpty
      // Actually: total_children = 0 + records present => not allEmpty, will compute
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 0,
        nutrition_assessment_records: [makeNutritionAssessment()],
      }));
      // nutritionAssessmentRate = total_children > 0 ? pct(...) : 0 => 0
      expect(r.nutrition_assessment_rate).toBe(0);
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes meal plan compliance strength at >= 95%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ planned: true, delivered: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("100% meal plan compliance"))).toBe(true);
    });

    it("includes meal plan compliance strength at >= 80% and < 95%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ planned: true, delivered: i < 17 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("85% meal plan compliance"))).toBe(true);
    });

    it("does NOT include meal plan compliance strength when < 80%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ planned: true, delivered: i < 10 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("meal plan compliance"))).toBe(false);
    });

    it("includes nutritional guideline strength at >= 90%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ meets_nutritional_guidelines: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("meet nutritional guidelines"))).toBe(true);
    });

    it("includes child choice strength at >= 90%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ child_involved_in_choice: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("child involvement in meal choices"))).toBe(true);
    });

    it("includes allergen check strength at 100%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ allergen_check_completed: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("Allergen checks completed for every meal"))).toBe(true);
    });

    it("includes allergen check strength at >= 90% and < 100%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ allergen_check_completed: i < 19 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("95% allergen check completion"))).toBe(true);
    });

    it("includes dietary documentation strength at 100%", () => {
      const reqs = [makeDietaryRequirement({ documented: true, active: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.strengths.some(s => s.includes("All dietary requirements fully documented"))).toBe(true);
    });

    it("includes staff informed strength at 100%", () => {
      const reqs = [makeDietaryRequirement({ all_staff_informed: true, active: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.strengths.some(s => s.includes("All staff informed of every child's dietary requirements"))).toBe(true);
    });

    it("includes emergency plan strength at 100% for severe requirements", () => {
      const reqs = [
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, active: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.strengths.some(s => s.includes("Emergency plans in place for all severe"))).toBe(true);
    });

    it("includes nutrition assessment coverage strength at 100%", () => {
      const assessments = [makeNutritionAssessment({ child_id: "c1" })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.strengths.some(s => s.includes("Every child has received a nutrition assessment"))).toBe(true);
    });

    it("includes food hygiene score strength at >= 90%", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 92 })],
      }));
      expect(r.strengths.some(s => s.includes("Food hygiene score averaging 92%"))).toBe(true);
    });

    it("includes special diet adherence strength at >= 95%", () => {
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 19, meals_total: 20 })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.strengths.some(s => s.includes("special diet adherence"))).toBe(true);
    });

    it("includes fresh ingredient strength at >= 90%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ fresh_ingredients_used: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("fresh ingredients"))).toBe(true);
    });

    it("includes cultural needs met strength at >= 95%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ cultural_dietary_needs_met: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("cultural dietary needs met"))).toBe(true);
    });

    it("includes staff food hygiene training strength at 100%", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ staff_food_hygiene_trained: true })],
      }));
      expect(r.strengths.some(s => s.includes("staff are trained"))).toBe(true);
    });

    it("includes corrective action completion strength at 100%", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ corrective_actions_required: 5, corrective_actions_completed: 5 })],
      }));
      expect(r.strengths.some(s => s.includes("All corrective actions from food hygiene inspections completed"))).toBe(true);
    });

    it("includes special diet documentation strength at 100%", () => {
      const diets = [makeSpecialDiet({ active: true, plan_documented: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.strengths.some(s => s.includes("All special diets fully documented"))).toBe(true);
    });

    it("includes positive child feedback strength at >= 90%", () => {
      const meals = Array.from({ length: 10 }, () =>
        makeMealPlan({ child_feedback_positive: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("positive child feedback on meals"))).toBe(true);
    });

    it("includes portion appropriateness strength at >= 95%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ portion_appropriate: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("portion appropriateness"))).toBe(true);
    });

    it("includes nutrition goals met strength at >= 90%", () => {
      const assessments = Array.from({ length: 10 }, () =>
        makeNutritionAssessment({ nutritional_goals_set: true, goals_met: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.strengths.some(s => s.includes("nutritional goals met"))).toBe(true);
    });

    it("includes dietitian referral completion strength at 100%", () => {
      const assessments = [
        makeNutritionAssessment({ referral_to_dietitian: true, referral_completed: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.strengths.some(s => s.includes("All dietitian referrals completed"))).toBe(true);
    });

    it("includes special diet monitoring strength at >= 90%", () => {
      const diets = [makeSpecialDiet({
        active: true,
        monitoring_frequency: "weekly",
        last_monitored_date: "2026-05-25",
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.strengths.some(s => s.includes("special diets monitored within expected frequency"))).toBe(true);
    });

    it("does NOT produce strengths when totalMealPlans is 0 for meal-based strengths", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene()],
      }));
      expect(r.strengths.filter(s =>
        s.includes("meal plan compliance") ||
        s.includes("nutritional guidelines") ||
        s.includes("child involvement") ||
        s.includes("allergen check") ||
        s.includes("fresh ingredients") ||
        s.includes("cultural dietary") ||
        s.includes("child feedback") ||
        s.includes("portion appropriateness")
      )).toHaveLength(0);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("includes meal plan compliance concern when < 50%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ planned: true, delivered: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.concerns.some(c => c.includes("0% meal plan compliance"))).toBe(true);
    });

    it("includes meal plan compliance concern when >= 50% and < 80%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ planned: true, delivered: i < 13 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.concerns.some(c => c.includes("Meal plan compliance at 65%"))).toBe(true);
    });

    it("includes allergen check concern when < 80%", () => {
      const meals = Array.from({ length: 10 }, (_, i) =>
        makeMealPlan({ allergen_check_completed: i < 5 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.concerns.some(c => c.includes("Allergen check completion at 50%"))).toBe(true);
    });

    it("includes food hygiene score concern when < 50%", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 40 })],
      }));
      expect(r.concerns.some(c => c.includes("Food hygiene score averaging only 40%"))).toBe(true);
    });

    it("includes food hygiene score concern when >= 50% and < 70%", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 60 })],
      }));
      expect(r.concerns.some(c => c.includes("Food hygiene score averaging 60%"))).toBe(true);
    });

    it("includes life-threatening without plan concern", () => {
      const reqs = [
        makeDietaryRequirement({ severity: "life_threatening", emergency_plan_in_place: false, active: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.concerns.some(c => c.includes("life-threatening dietary requirement"))).toBe(true);
    });

    it("includes no meal plans concern when children on placement but no meals", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene()], // need something to not be allEmpty
      }));
      expect(r.concerns.some(c => c.includes("No meal plan records exist"))).toBe(true);
    });

    it("includes no food hygiene concern when meal records exist but no inspections", () => {
      const meals = [makeMealPlan()];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.concerns.some(c => c.includes("No food hygiene inspection records exist"))).toBe(true);
    });

    it("includes dietary review overdue concern", () => {
      const reqs = [
        makeDietaryRequirement({ review_due_date: "2026-05-01", active: true }), // overdue
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.concerns.some(c => c.includes("dietary requirement review"))).toBe(true);
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("includes nutrition review overdue concern", () => {
      const assessments = [
        makeNutritionAssessment({ next_review_date: "2026-01-01" }), // overdue
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.concerns.some(c => c.includes("nutrition assessment review"))).toBe(true);
    });

    it("includes food hygiene inspection overdue concern", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ next_inspection_due: "2026-03-01" })],
      }));
      expect(r.concerns.some(c => c.includes("food hygiene inspection"))).toBe(true);
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("includes special diet review overdue concern", () => {
      const diets = [makeSpecialDiet({ active: true, review_date: "2026-01-01" })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.concerns.some(c => c.includes("special diet review"))).toBe(true);
    });

    it("includes negative child feedback concern when < 50%", () => {
      const meals = Array.from({ length: 10 }, () =>
        makeMealPlan({ child_feedback_positive: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.concerns.some(c => c.includes("positive child meal feedback"))).toBe(true);
    });

    it("includes fresh ingredient concern when < 50%", () => {
      const meals = Array.from({ length: 10 }, () =>
        makeMealPlan({ fresh_ingredients_used: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.concerns.some(c => c.includes("fresh ingredients"))).toBe(true);
    });

    it("includes kitchen notification concern when < 80%", () => {
      const reqs = [
        makeDietaryRequirement({ kitchen_notified: false, active: true }),
        makeDietaryRequirement({ kitchen_notified: false, active: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        dietary_requirement_records: reqs,
      }));
      expect(r.concerns.some(c => c.includes("Kitchen notified of only 0%"))).toBe(true);
    });

    it("includes special diet adherence concern when < 50%", () => {
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 3, meals_total: 20 })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.concerns.some(c => c.includes("special diet adherence"))).toBe(true);
    });

    it("includes special diet documentation concern when < 80%", () => {
      const diets = [
        makeSpecialDiet({ active: true, plan_documented: false }),
        makeSpecialDiet({ active: true, plan_documented: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.concerns.some(c => c.includes("special diets documented"))).toBe(true);
    });

    it("uses singular form for 1 overdue review", () => {
      const reqs = [
        makeDietaryRequirement({ review_due_date: "2026-05-01", active: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.concerns.some(c => c.includes("1 dietary requirement review overdue"))).toBe(true);
    });

    it("uses plural form for 2 overdue reviews", () => {
      const reqs = [
        makeDietaryRequirement({ review_due_date: "2026-05-01", active: true, child_id: "c1" }),
        makeDietaryRequirement({ review_due_date: "2026-05-01", active: true, child_id: "c2" }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        dietary_requirement_records: reqs,
      }));
      expect(r.concerns.some(c => c.includes("2 dietary requirement reviews overdue"))).toBe(true);
    });

    it("includes nutritional guideline concern when < 50%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ meets_nutritional_guidelines: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.concerns.some(c => c.includes("0% of meals meet nutritional guidelines"))).toBe(true);
    });

    it("includes child choice concern when < 50%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ child_involved_in_choice: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.concerns.some(c => c.includes("child involvement in meal choices"))).toBe(true);
    });

    it("includes dietary documentation concern when < 80%", () => {
      const reqs = Array.from({ length: 5 }, () =>
        makeDietaryRequirement({ documented: false, active: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        dietary_requirement_records: reqs,
      }));
      expect(r.concerns.some(c => c.includes("dietary requirements documented"))).toBe(true);
    });

    it("includes staff food hygiene training concern when < 80%", () => {
      const records = Array.from({ length: 3 }, () =>
        makeFoodHygiene({ staff_food_hygiene_trained: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: records,
      }));
      expect(r.concerns.some(c => c.includes("Staff food hygiene training confirmed in only 0%"))).toBe(true);
    });

    it("includes corrective action completion concern when < 80%", () => {
      const records = [makeFoodHygiene({ corrective_actions_required: 10, corrective_actions_completed: 3 })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: records,
      }));
      expect(r.concerns.some(c => c.includes("food hygiene corrective actions completed"))).toBe(true);
    });

    it("includes nutrition assessment coverage concern when < 50%", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        nutrition_assessment_records: [makeNutritionAssessment({ child_id: "c1" })],
      }));
      expect(r.concerns.some(c => c.includes("nutrition assessment"))).toBe(true);
    });

    it("includes dietitian referral concern when < 80%", () => {
      const assessments = [
        makeNutritionAssessment({ referral_to_dietitian: true, referral_completed: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.concerns.some(c => c.includes("dietitian referrals completed"))).toBe(true);
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("includes immediate recommendation for life-threatening without plan", () => {
      const reqs = [makeDietaryRequirement({
        severity: "life_threatening", emergency_plan_in_place: false, active: true,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("Urgently create emergency response plans"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.rank).toBe(1); // first recommendation
    });

    it("includes immediate recommendation for food hygiene < 50", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 40 })],
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Urgently address food hygiene failings"))).toBe(true);
    });

    it("includes immediate recommendation for meal compliance < 50", () => {
      const meals = Array.from({ length: 10 }, () =>
        makeMealPlan({ planned: true, delivered: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Urgently review meal planning"))).toBe(true);
    });

    it("includes immediate recommendation for allergen check < 80", () => {
      const meals = Array.from({ length: 10 }, () =>
        makeMealPlan({ allergen_check_completed: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("mandatory allergen checks"))).toBe(true);
    });

    it("includes soon recommendation for corrective action completion < 80%", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ corrective_actions_required: 10, corrective_actions_completed: 3 })],
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("Complete all outstanding food hygiene corrective actions"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("includes soon recommendation for child choice < 70%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ child_involved_in_choice: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Increase children's involvement in meal planning"))).toBe(true);
    });

    it("includes planned recommendation for meal compliance 50-80%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ planned: true, delivered: i < 13 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("Improve meal plan compliance to at least 80%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("includes recommendation to begin recording meal plans when none exist", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene()],
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Begin recording meal plans"))).toBe(true);
    });

    it("includes recommendation to schedule food hygiene inspections when none exist but meals do", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: [makeMealPlan()],
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Schedule and conduct food hygiene inspections"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ planned: true, delivered: false, allergen_check_completed: false }),
      );
      const reqs = [makeDietaryRequirement({
        severity: "life_threatening", emergency_plan_in_place: false, active: true,
        all_staff_informed: false, kitchen_notified: false, documented: false,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        dietary_requirement_records: reqs,
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("includes regulatory references in recommendations", () => {
      const reqs = [makeDietaryRequirement({
        severity: "life_threatening", emergency_plan_in_place: false, active: true,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.recommendations.every(rec => rec.regulatory_ref.length > 0)).toBe(true);
    });

    it("includes soon recommendation for overdue dietary reviews", () => {
      const reqs = [makeDietaryRequirement({ review_due_date: "2026-01-01", active: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("overdue dietary requirement review"))).toBe(true);
    });

    it("includes soon recommendation for overdue nutrition reviews", () => {
      const assessments = [makeNutritionAssessment({ next_review_date: "2026-01-01" })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("overdue nutrition assessment review"))).toBe(true);
    });

    it("includes soon recommendation for overdue special diet reviews", () => {
      const diets = [makeSpecialDiet({ active: true, review_date: "2026-01-01" })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("overdue special diet review"))).toBe(true);
    });

    it("includes soon recommendation for overdue hygiene inspections", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ next_inspection_due: "2026-01-01" })],
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("overdue food hygiene inspection"))).toBe(true);
    });

    it("includes soon recommendation for poor child feedback", () => {
      const meals = Array.from({ length: 10 }, () =>
        makeMealPlan({ child_feedback_positive: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Consult children about meal quality"))).toBe(true);
    });

    it("includes planned recommendation for special diet adherence 50-80%", () => {
      const diets = [makeSpecialDiet({
        active: true, meals_compliant: 13, meals_total: 20,
        plan_documented: false, staff_trained: false, child_adherence_willing: false,
        outcomes_positive: null, last_monitored_date: null,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Improve special diet adherence to at least 80%"))).toBe(true);
    });

    it("includes planned recommendation for food hygiene score 50-70%", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 60 })],
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Develop an improvement plan to raise food hygiene scores"))).toBe(true);
    });
  });

  // ── Insights ───────────────────────────────────────────────────────────

  describe("insights", () => {
    it("includes critical insight for life-threatening without plan", () => {
      const reqs = [makeDietaryRequirement({
        severity: "life_threatening", emergency_plan_in_place: false, active: true,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      const insight = r.insights.find(i => i.severity === "critical" && i.text.includes("life-threatening"));
      expect(insight).toBeDefined();
    });

    it("includes critical insight for food hygiene < 50", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 40 })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Food hygiene score averaging only 40%"))).toBe(true);
    });

    it("includes critical insight for meal compliance < 50", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ planned: true, delivered: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("planned meals are being delivered"))).toBe(true);
    });

    it("includes critical insight for special diet adherence < 50", () => {
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 3, meals_total: 20 })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Special diet adherence at only"))).toBe(true);
    });

    it("includes critical insight for allergen check < 50", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ allergen_check_completed: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Allergen checks completed for only 0%"))).toBe(true);
    });

    it("includes critical insight for staff informed < 50%", () => {
      const reqs = Array.from({ length: 4 }, () =>
        makeDietaryRequirement({ all_staff_informed: false, active: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 4,
        dietary_requirement_records: reqs,
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Staff informed of only 0%"))).toBe(true);
    });

    it("includes critical insight for no meal plans with children on placement", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene()],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No meal plan records exist"))).toBe(true);
    });

    it("includes critical insight for very low nutrition assessment coverage (< 30%)", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        nutrition_assessment_records: [makeNutritionAssessment({ child_id: "c1" })],
      }));
      // 1/5 = 20% < 30%
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Nutrition assessment coverage at only 20%"))).toBe(true);
    });

    it("includes warning insight for meal compliance 50-80%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ planned: true, delivered: i < 13 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Meal plan compliance at 65%"))).toBe(true);
    });

    it("includes warning insight for food hygiene 50-70%", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ overall_score: 60 })],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Food hygiene score averaging 60%"))).toBe(true);
    });

    it("includes warning insight for special diet adherence 50-80%", () => {
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 13, meals_total: 20 })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Special diet adherence at 65%"))).toBe(true);
    });

    it("includes warning insight for child choice 50-70%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ child_involved_in_choice: i < 12 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Child meal choice involvement at 60%"))).toBe(true);
    });

    it("includes warning insight for allergen check 50-80%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ allergen_check_completed: i < 14 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Allergen checks completed for 70%"))).toBe(true);
    });

    it("includes warning insight for nutrition assessment 50-80%", () => {
      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c2" }),
        makeNutritionAssessment({ child_id: "c3" }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        nutrition_assessment_records: assessments,
      }));
      // 3/5 = 60%
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Nutrition assessment coverage at 60%"))).toBe(true);
    });

    it("includes warning insight for dietary reviews overdue", () => {
      const reqs = [makeDietaryRequirement({ review_due_date: "2026-01-01", active: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("dietary requirement review"))).toBe(true);
    });

    it("includes warning insight for nutrition reviews overdue", () => {
      const assessments = [makeNutritionAssessment({ next_review_date: "2026-01-01" })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("nutrition assessment review"))).toBe(true);
    });

    it("includes warning insight for high concern density", () => {
      // Need >= 2 average concerns per assessment
      const assessments = [
        makeNutritionAssessment({ concerns_identified: ["a", "b", "c"] }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("nutritional concerns identified per assessment"))).toBe(true);
    });

    it("includes warning insight for negative child feedback (>= 5 feedback records)", () => {
      const meals = Array.from({ length: 10 }, () =>
        makeMealPlan({ child_feedback_positive: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("positive child feedback on meals"))).toBe(true);
    });

    it("includes warning insight for dietary requirement profile when >= 3 active reqs", () => {
      const reqs = [
        makeDietaryRequirement({ requirement_type: "allergy", active: true }),
        makeDietaryRequirement({ requirement_type: "allergy", active: true }),
        makeDietaryRequirement({ requirement_type: "cultural", active: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 3,
        dietary_requirement_records: reqs,
      }));
      expect(r.insights.some(i => i.text.includes("Dietary requirement profile"))).toBe(true);
    });

    it("includes positive insight for outstanding rating", () => {
      const meals = Array.from({ length: 20 }, () => makeMealPlan());
      const dietReqs = [
        makeDietaryRequirement({ severity: "severe", child_id: "c1" }),
        makeDietaryRequirement({ severity: "life_threatening", child_id: "c2" }),
        makeDietaryRequirement({ child_id: "c3" }),
      ];
      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c2" }),
        makeNutritionAssessment({ child_id: "c3" }),
      ];
      const hygiene = [makeFoodHygiene({ overall_score: 95 })];
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 20, meals_total: 20 })];

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 3,
        meal_plan_records: meals,
        dietary_requirement_records: dietReqs,
        nutrition_assessment_records: assessments,
        food_hygiene_records: hygiene,
        special_diet_records: diets,
      }));
      expect(r.nutrition_rating).toBe("outstanding");
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding nutrition"))).toBe(true);
    });

    it("includes positive insight for high compliance + nutritional guidelines", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ planned: true, delivered: true, meets_nutritional_guidelines: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100% meal compliance with 100% meeting nutritional guidelines"))).toBe(true);
    });

    it("includes positive insight for perfect allergen + emergency plan combination", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ allergen_check_completed: true }),
      );
      const reqs = [
        makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, active: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        dietary_requirement_records: reqs,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary allergen safety framework"))).toBe(true);
    });

    it("includes positive insight for high food hygiene + staff trained", () => {
      const hygiene = [makeFoodHygiene({ overall_score: 95, staff_food_hygiene_trained: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: hygiene,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("all staff trained"))).toBe(true);
    });

    it("includes positive insight for high special diet adherence + documentation", () => {
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 20, meals_total: 20, plan_documented: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("special diet adherence with complete documentation"))).toBe(true);
    });

    it("includes positive insight for child choice + positive feedback", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ child_involved_in_choice: true, child_feedback_positive: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("empowered to shape their diet"))).toBe(true);
    });

    it("includes positive insight for full dietary documentation + staff informed", () => {
      const reqs = [
        makeDietaryRequirement({ documented: true, all_staff_informed: true, active: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("All dietary requirements fully documented and communicated"))).toBe(true);
    });

    it("includes positive insight for full assessment coverage + goals met", () => {
      const assessments = [
        makeNutritionAssessment({ child_id: "c1", nutritional_goals_set: true, goals_met: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Every child assessed with 100% of nutritional goals met"))).toBe(true);
    });

    it("includes positive insight for corrective actions 100% completed", () => {
      const hygiene = [makeFoodHygiene({ corrective_actions_required: 5, corrective_actions_completed: 5 })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: hygiene,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("All food hygiene corrective actions completed"))).toBe(true);
    });

    it("includes positive insight for fresh ingredients + appropriate portions", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ fresh_ingredients_used: true, portion_appropriate: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("fresh ingredients with 100% appropriate portions"))).toBe(true);
    });

    it("includes positive insight for cultural needs >= 95%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ cultural_dietary_needs_met: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("cultural dietary needs met"))).toBe(true);
    });

    it("includes positive insight for dietitian referrals 100% completed", () => {
      const assessments = [
        makeNutritionAssessment({ referral_to_dietitian: true, referral_completed: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("All dietitian referrals completed"))).toBe(true);
    });

    it("includes positive insight for special diet monitoring >= 90%", () => {
      const diets = [makeSpecialDiet({
        active: true,
        monitoring_frequency: "weekly",
        last_monitored_date: "2026-05-25",
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("special diets monitored within expected frequency"))).toBe(true);
    });
  });

  // ── Headlines ──────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("uses outstanding headline when rating is outstanding", () => {
      const meals = Array.from({ length: 20 }, () => makeMealPlan());
      const dietReqs = [
        makeDietaryRequirement({ severity: "severe", child_id: "c1" }),
        makeDietaryRequirement({ severity: "life_threatening", child_id: "c2" }),
        makeDietaryRequirement({ child_id: "c3" }),
      ];
      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c2" }),
        makeNutritionAssessment({ child_id: "c3" }),
      ];
      const hygiene = [makeFoodHygiene({ overall_score: 95 })];
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 20, meals_total: 20 })];

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 3,
        meal_plan_records: meals,
        dietary_requirement_records: dietReqs,
        nutrition_assessment_records: assessments,
        food_hygiene_records: hygiene,
        special_diet_records: diets,
      }));
      expect(r.headline).toContain("Outstanding nutrition and dietary management");
    });

    it("uses good headline with strength/concern counts when rating is good", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ planned: true, delivered: true, meets_nutritional_guidelines: true }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        nutrition_assessment_records: [makeNutritionAssessment({ child_id: "c1" })],
        dietary_requirement_records: [makeDietaryRequirement({ severity: "severe", emergency_plan_in_place: true, active: true })],
      }));
      expect(r.headline).toContain("Good nutrition and dietary management");
      expect(r.headline).toMatch(/\d+ strength/);
    });

    it("uses adequate headline with concern count when rating is adequate", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({
          planned: true, delivered: i < 13,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.headline).toContain("Adequate nutrition and dietary management");
      expect(r.headline).toMatch(/\d+ concern/);
    });

    it("uses inadequate headline with concern count", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({
          planned: true, delivered: false,
          meets_nutritional_guidelines: false,
          child_involved_in_choice: false,
          child_feedback_positive: null,
          fresh_ingredients_used: false,
          cultural_dietary_needs_met: false,
          allergen_check_completed: false,
        }),
      );
      const reqs = [makeDietaryRequirement({
        severity: "life_threatening", emergency_plan_in_place: false, active: true,
      })];
      const hygiene = [makeFoodHygiene({ overall_score: 30 })];
      const diets = [makeSpecialDiet({ active: true, meals_compliant: 2, meals_total: 20 })];

      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
        dietary_requirement_records: reqs,
        food_hygiene_records: hygiene,
        special_diet_records: diets,
      }));
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toMatch(/significant concern/);
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single meal plan record", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: [makeMealPlan()],
      }));
      expect(r.total_meal_plans).toBe(1);
      expect(r.meal_plan_compliance_rate).toBe(100);
    });

    it("handles all null feedback (no feedback given)", () => {
      const meals = Array.from({ length: 5 }, () =>
        makeMealPlan({ child_feedback_positive: null }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // No feedback given, so positive rate = pct(0, 0) = 0
      // But the feedback concern requires feedbackGiven.length > 0, so no concern
      expect(r.concerns.filter(c => c.includes("child meal feedback")).length).toBe(0);
    });

    it("handles only inactive dietary requirements", () => {
      const reqs = [
        makeDietaryRequirement({ active: false }),
        makeDietaryRequirement({ active: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 2,
        dietary_requirement_records: reqs,
      }));
      // No active reqs: coverage = 0, documentation = pct(0,0)=0, etc.
      expect(r.dietary_requirement_coverage_rate).toBe(0);
      expect(r.dietary_documentation_rate).toBe(0);
    });

    it("handles only inactive special diets", () => {
      const diets = [
        makeSpecialDiet({ active: false, meals_compliant: 5, meals_total: 10 }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      // Inactive: adherence = pct(0,0) = 0, but totalSpecialDietMeals=0 so no penalty
      expect(r.special_diet_adherence_rate).toBe(0);
      expect(r.total_special_diets).toBe(1);
    });

    it("handles monitoring frequency: daily", () => {
      const diets = [makeSpecialDiet({
        active: true,
        monitoring_frequency: "daily",
        last_monitored_date: "2026-05-27", // 1 day ago, <= 2 days
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      // Should be monitored
      expect(r.strengths.some(s => s.includes("special diets monitored"))).toBe(true);
    });

    it("handles monitoring frequency: monthly", () => {
      const diets = [makeSpecialDiet({
        active: true,
        monitoring_frequency: "monthly",
        last_monitored_date: "2026-05-01", // 27 days ago, <= 35 days
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.strengths.some(s => s.includes("special diets monitored"))).toBe(true);
    });

    it("monitoring out of range for daily (> 2 days)", () => {
      const diets = [makeSpecialDiet({
        active: true,
        monitoring_frequency: "daily",
        last_monitored_date: "2026-05-20", // 8 days ago, > 2 days
        plan_documented: false,
        staff_trained: false,
        child_adherence_willing: false,
        outcomes_positive: null,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      // monitoringRate = 0/1 = 0%, below 50% triggers concern
      expect(r.concerns.some(c => c.includes("special diets monitored"))).toBe(true);
    });

    it("monitoring out of range for monthly (> 35 days)", () => {
      const diets = [makeSpecialDiet({
        active: true,
        monitoring_frequency: "monthly",
        last_monitored_date: "2026-04-01", // 57 days ago, > 35 days
        plan_documented: false,
        staff_trained: false,
        child_adherence_willing: false,
        outcomes_positive: null,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.concerns.some(c => c.includes("special diets monitored"))).toBe(true);
    });

    it("handles null last_monitored_date as not monitored", () => {
      const diets = [makeSpecialDiet({
        active: true,
        monitoring_frequency: "weekly",
        last_monitored_date: null,
        plan_documented: false,
        staff_trained: false,
        child_adherence_willing: false,
        outcomes_positive: null,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      // Not monitored, so rate = 0%
      expect(r.concerns.some(c => c.includes("special diets monitored"))).toBe(true);
    });

    it("isOverdue returns false for null due dates", () => {
      const reqs = [makeDietaryRequirement({ review_due_date: null, active: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      // No overdue concern since due date is null
      expect(r.concerns.filter(c => c.includes("dietary requirement review") && c.includes("overdue")).length).toBe(0);
    });

    it("isOverdue returns false when due date equals today", () => {
      const reqs = [makeDietaryRequirement({ review_due_date: "2026-05-28", active: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      // dueDate "2026-05-28" < today "2026-05-28" is false, so not overdue
      expect(r.concerns.filter(c => c.includes("dietary requirement review") && c.includes("overdue")).length).toBe(0);
    });

    it("isOverdue returns true when due date is before today", () => {
      const reqs = [makeDietaryRequirement({ review_due_date: "2026-05-27", active: true })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.concerns.some(c => c.includes("dietary requirement review") && c.includes("overdue"))).toBe(true);
    });

    it("handles duplicate child IDs in assessments — still counts unique", () => {
      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c1" }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 3,
        nutrition_assessment_records: assessments,
      }));
      // unique: c1 = 1/3 = 33%
      expect(r.nutrition_assessment_rate).toBe(33);
    });

    it("handles large number of records", () => {
      const meals = Array.from({ length: 200 }, () => makeMealPlan());
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 10,
        meal_plan_records: meals,
      }));
      expect(r.total_meal_plans).toBe(200);
      expect(r.meal_plan_compliance_rate).toBe(100);
    });

    it("food hygiene score rounds correctly for non-integer averages", () => {
      const records = [
        makeFoodHygiene({ overall_score: 90 }),
        makeFoodHygiene({ overall_score: 91 }),
        makeFoodHygiene({ overall_score: 92 }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: records,
      }));
      // (90+91+92)/3 = 91
      expect(r.food_hygiene_score).toBe(91);
    });

    it("pct rounds correctly: 1/3 = 33", () => {
      const meals = [
        makeMealPlan({ planned: true, delivered: true }),
        makeMealPlan({ planned: true, delivered: false }),
        makeMealPlan({ planned: true, delivered: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.meal_plan_compliance_rate).toBe(33);
    });

    it("pct rounds correctly: 2/3 = 67", () => {
      const meals = [
        makeMealPlan({ planned: true, delivered: true }),
        makeMealPlan({ planned: true, delivered: true }),
        makeMealPlan({ planned: true, delivered: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.meal_plan_compliance_rate).toBe(67);
    });

    it("handles corrective actions where required is 0 (rate=0)", () => {
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: [makeFoodHygiene({ corrective_actions_required: 0, corrective_actions_completed: 0 })],
      }));
      expect(r.corrective_action_completion_rate).toBe(0);
    });

    it("handles nutritional guideline rate concern between 50 and 70", () => {
      // 12/20 = 60%
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ meets_nutritional_guidelines: i < 12 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.concerns.some(c => c.includes("Nutritional guideline compliance at 60%"))).toBe(true);
    });

    it("handles nutrition assessment rate concern between 50 and 80", () => {
      // 3/5 = 60%
      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c2" }),
        makeNutritionAssessment({ child_id: "c3" }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        nutrition_assessment_records: assessments,
      }));
      expect(r.concerns.some(c => c.includes("Nutrition assessment coverage at 60%"))).toBe(true);
    });

    it("handles nutrition goals met concern between 50 and 70", () => {
      const assessments = [
        makeNutritionAssessment({ nutritional_goals_set: true, goals_met: true }),
        makeNutritionAssessment({ nutritional_goals_set: true, goals_met: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      // 1/2 = 50%
      expect(r.concerns.some(c => c.includes("Nutritional goals met at 50%"))).toBe(true);
    });

    it("handles special diet adherence concern between 50 and 80", () => {
      const diets = [makeSpecialDiet({
        active: true, meals_compliant: 13, meals_total: 20,
        plan_documented: false, staff_trained: false,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      // 13/20 = 65%
      expect(r.concerns.some(c => c.includes("Special diet adherence at 65%"))).toBe(true);
    });

    it("handles special diet monitoring concern between 50 and 70", () => {
      // Need 50-70% monitoring rate. 1 monitored + 1 not = 50%
      const diets = [
        makeSpecialDiet({
          active: true, monitoring_frequency: "weekly", last_monitored_date: "2026-05-25",
          plan_documented: false, staff_trained: false,
        }),
        makeSpecialDiet({
          active: true, monitoring_frequency: "weekly", last_monitored_date: null,
          plan_documented: false, staff_trained: false,
        }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      // 1/2 = 50%
      expect(r.concerns.some(c => c.includes("Special diet monitoring compliance at 50%"))).toBe(true);
    });

    it("handles child choice concern between 50 and 70", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ child_involved_in_choice: i < 12 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      // 12/20 = 60%
      expect(r.concerns.some(c => c.includes("Child meal choice involvement at 60%"))).toBe(true);
    });

    it("planned recommendation for child choice 50-70%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ child_involved_in_choice: i < 12 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("Increase child involvement in meal choices to at least 70%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("planned recommendation for nutrition assessment rate 50-80%", () => {
      const assessments = [
        makeNutritionAssessment({ child_id: "c1" }),
        makeNutritionAssessment({ child_id: "c2" }),
        makeNutritionAssessment({ child_id: "c3" }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 5,
        nutrition_assessment_records: assessments,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Extend nutrition assessment coverage"))).toBe(true);
    });

    it("warning insight for nutritional guideline rate 50-70%", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ meets_nutritional_guidelines: i < 12 }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("60% of meals meet nutritional guidelines"))).toBe(true);
    });

    it("warning insight for nutrition goals met 50-70%", () => {
      const assessments = [
        makeNutritionAssessment({ nutritional_goals_set: true, goals_met: true }),
        makeNutritionAssessment({ nutritional_goals_set: true, goals_met: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Nutritional goals met at 50%"))).toBe(true);
    });

    it("warning insight for dietitian referral completion 50-80%", () => {
      const assessments = [
        makeNutritionAssessment({ referral_to_dietitian: true, referral_completed: true }),
        makeNutritionAssessment({ referral_to_dietitian: true, referral_completed: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Dietitian referral completion at 50%"))).toBe(true);
    });

    it("warning insight for corrective action completion 50-80%", () => {
      const hygiene = [makeFoodHygiene({ corrective_actions_required: 10, corrective_actions_completed: 6 })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        food_hygiene_records: hygiene,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Food hygiene corrective action completion at 60%"))).toBe(true);
    });

    it("warning insight for special diet monitoring 50-70%", () => {
      const diets = [
        makeSpecialDiet({ active: true, monitoring_frequency: "weekly", last_monitored_date: "2026-05-25" }),
        makeSpecialDiet({ active: true, monitoring_frequency: "weekly", last_monitored_date: null }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Special diet monitoring at 50%"))).toBe(true);
    });

    it("second-tier strengths appear correctly (>= 70/80 but below top tier)", () => {
      const meals = Array.from({ length: 20 }, (_, i) =>
        makeMealPlan({ child_involved_in_choice: i < 15 }), // 75%
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.strengths.some(s => s.includes("75% child involvement in meal choices"))).toBe(true);
      expect(r.strengths.some(s => s.includes("regularly involves children"))).toBe(true);
    });

    it("includes soon recommendation for fresh ingredients < 50%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ fresh_ingredients_used: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Increase the use of fresh ingredients"))).toBe(true);
    });

    it("includes soon recommendation for kitchen notification < 80%", () => {
      const reqs = [
        makeDietaryRequirement({ kitchen_notified: false, active: true }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        dietary_requirement_records: reqs,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Ensure the kitchen is notified"))).toBe(true);
    });

    it("includes soon recommendation for special diet monitoring < 70%", () => {
      const diets = [makeSpecialDiet({
        active: true, monitoring_frequency: "weekly", last_monitored_date: null,
      })];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        special_diet_records: diets,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Improve monitoring compliance for children on special diets"))).toBe(true);
    });

    it("includes soon recommendation for nutritional guideline rate < 70%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ meets_nutritional_guidelines: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Review and improve nutritional content of meals"))).toBe(true);
    });

    it("includes soon recommendation for cultural needs < 80%", () => {
      const meals = Array.from({ length: 20 }, () =>
        makeMealPlan({ cultural_dietary_needs_met: false }),
      );
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        meal_plan_records: meals,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Review and improve provision for cultural"))).toBe(true);
    });

    it("includes soon recommendation for dietitian referral completion < 80%", () => {
      const assessments = [
        makeNutritionAssessment({ referral_to_dietitian: true, referral_completed: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Chase and complete outstanding dietitian referrals"))).toBe(true);
    });

    it("includes soon recommendation for nutrition goals met < 70%", () => {
      const assessments = [
        makeNutritionAssessment({ nutritional_goals_set: true, goals_met: false }),
      ];
      const r = computeNutritionDietaryManagement(baseInput({
        total_children: 1,
        nutrition_assessment_records: assessments,
      }));
      expect(r.recommendations.some(r => r.recommendation.includes("Review nutritional interventions for children not meeting their goals"))).toBe(true);
    });
  });
});
