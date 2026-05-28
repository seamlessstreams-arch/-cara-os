// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NUTRITION & DIETARY MANAGEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-nutrition-dietary-management-intelligence
// Cross-domain composite: mealPlanRecords + dietaryRequirementRecords +
// nutritionAssessmentRecords + foodHygieneRecords + specialDietRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeNutritionDietaryManagement,
  type MealPlanRecordInput,
  type DietaryRequirementRecordInput,
  type NutritionAssessmentRecordInput,
  type FoodHygieneRecordInput,
  type SpecialDietRecordInput,
} from "@/lib/engines/home-nutrition-dietary-management-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawMealPlans = (store.mealPlanRecords ?? []) as any[];
    const meal_plan_records: MealPlanRecordInput[] = rawMealPlans.map((m: any) => ({
      id: m.id ?? "",
      child_id: m.child_id ?? "",
      plan_date: (m.plan_date ?? today).toString(),
      meal_type: m.meal_type ?? "dinner",
      planned: m.planned !== false,
      delivered: !!m.delivered,
      meets_nutritional_guidelines: !!m.meets_nutritional_guidelines,
      child_involved_in_choice: !!m.child_involved_in_choice,
      child_feedback_positive: m.child_feedback_positive ?? null,
      portion_appropriate: m.portion_appropriate !== false,
      fresh_ingredients_used: !!m.fresh_ingredients_used,
      cultural_dietary_needs_met: m.cultural_dietary_needs_met !== false,
      allergen_check_completed: !!m.allergen_check_completed,
      staff_member: m.staff_member ?? "",
      notes: m.notes ?? null,
      created_at: (m.created_at ?? today).toString(),
    }));

    const rawDietaryRequirements = (store.dietaryRequirementRecords ?? []) as any[];
    const dietary_requirement_records: DietaryRequirementRecordInput[] = rawDietaryRequirements.map((d: any) => ({
      id: d.id ?? "",
      child_id: d.child_id ?? "",
      requirement_type: d.requirement_type ?? "allergy",
      description: d.description ?? "",
      severity: d.severity ?? "moderate",
      documented: !!d.documented,
      care_plan_updated: !!d.care_plan_updated,
      all_staff_informed: !!d.all_staff_informed,
      kitchen_notified: !!d.kitchen_notified,
      emergency_plan_in_place: !!d.emergency_plan_in_place,
      last_reviewed_date: d.last_reviewed_date ?? null,
      review_due_date: d.review_due_date ?? null,
      active: d.active !== false,
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawNutritionAssessments = (store.nutritionAssessmentRecords ?? []) as any[];
    const nutrition_assessment_records: NutritionAssessmentRecordInput[] = rawNutritionAssessments.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      assessment_date: (a.assessment_date ?? today).toString(),
      assessor: a.assessor ?? "",
      assessment_type: a.assessment_type ?? "periodic",
      bmi_recorded: !!a.bmi_recorded,
      height_recorded: !!a.height_recorded,
      weight_recorded: !!a.weight_recorded,
      dietary_intake_reviewed: !!a.dietary_intake_reviewed,
      nutritional_goals_set: !!a.nutritional_goals_set,
      goals_met: !!a.goals_met,
      referral_to_dietitian: !!a.referral_to_dietitian,
      referral_completed: !!a.referral_completed,
      concerns_identified: Array.isArray(a.concerns_identified) ? a.concerns_identified : [],
      recommendations: Array.isArray(a.recommendations) ? a.recommendations : [],
      next_review_date: a.next_review_date ?? null,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawFoodHygiene = (store.foodHygieneRecords ?? []) as any[];
    const food_hygiene_records: FoodHygieneRecordInput[] = rawFoodHygiene.map((f: any) => ({
      id: f.id ?? "",
      inspection_date: (f.inspection_date ?? today).toString(),
      inspector: f.inspector ?? "",
      inspection_type: f.inspection_type ?? "routine",
      food_storage_compliant: !!f.food_storage_compliant,
      temperature_records_maintained: !!f.temperature_records_maintained,
      preparation_area_clean: !!f.preparation_area_clean,
      hand_hygiene_compliant: !!f.hand_hygiene_compliant,
      allergen_labelling_correct: !!f.allergen_labelling_correct,
      waste_disposal_compliant: !!f.waste_disposal_compliant,
      pest_control_adequate: !!f.pest_control_adequate,
      staff_food_hygiene_trained: !!f.staff_food_hygiene_trained,
      overall_score: f.overall_score ?? 0,
      corrective_actions_required: f.corrective_actions_required ?? 0,
      corrective_actions_completed: f.corrective_actions_completed ?? 0,
      next_inspection_due: f.next_inspection_due ?? null,
      created_at: (f.created_at ?? today).toString(),
    }));

    const rawSpecialDiets = (store.specialDietRecords ?? []) as any[];
    const special_diet_records: SpecialDietRecordInput[] = rawSpecialDiets.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      diet_type: s.diet_type ?? "medical",
      prescribed_by: s.prescribed_by ?? "",
      start_date: (s.start_date ?? today).toString(),
      active: s.active !== false,
      plan_documented: !!s.plan_documented,
      meals_compliant: s.meals_compliant ?? 0,
      meals_total: s.meals_total ?? 0,
      child_adherence_willing: !!s.child_adherence_willing,
      staff_trained: !!s.staff_trained,
      monitoring_frequency: s.monitoring_frequency ?? "weekly",
      last_monitored_date: s.last_monitored_date ?? null,
      outcomes_positive: s.outcomes_positive ?? null,
      review_date: s.review_date ?? null,
      created_at: (s.created_at ?? today).toString(),
    }));

    const result = computeNutritionDietaryManagement({
      today,
      total_children,
      meal_plan_records,
      dietary_requirement_records,
      nutrition_assessment_records,
      food_hygiene_records,
      special_diet_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
