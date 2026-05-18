// ══════════════════════════════════════════════════════════════════════════════
// API: /api/nutrition
//
// Nutrition & Dietary Compliance Intelligence
//
// GET  — Returns nutrition intelligence with realistic Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateNutritionIntelligence,
  getDietaryLabel,
  getQualityFactorLabel,
} from "@/lib/nutrition";
import type {
  NutritionChild,
  MealRecord,
  MenuPlan,
  FoodSafetyRecord,
  CookingSession,
} from "@/lib/nutrition";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_CHILDREN: NutritionChild[] = [
  {
    id: "child-alex",
    name: "Alex",
    dateOfBirth: "2012-03-15",
    currentPlacement: true,
    dietaryRequirements: ["cultural_preference"],
    allergies: [],
    preferences: ["Caribbean food", "Jerk chicken", "Rice and peas", "Plantain"],
    dislikes: ["Mushrooms", "Olives"],
    cookingSkillLevel: 3,
  },
  {
    id: "child-jordan",
    name: "Jordan",
    dateOfBirth: "2013-07-22",
    currentPlacement: true,
    dietaryRequirements: [],
    allergies: ["nut_allergy"],
    preferences: ["Pasta", "Pizza", "Jacket potatoes"],
    dislikes: ["Spicy food", "Curry"],
    cookingSkillLevel: 2,
  },
  {
    id: "child-morgan",
    name: "Morgan",
    dateOfBirth: "2010-12-01",
    currentPlacement: true,
    dietaryRequirements: ["halal"],
    allergies: [],
    preferences: ["Biryani", "Curry", "Kebabs", "Naan bread"],
    dislikes: [],
    cookingSkillLevel: 4,
  },
];

const DEMO_MEALS: MealRecord[] = [
  // ── January ─────────────────────────────────────────────────────────────
  {
    id: "meal-001",
    date: "2026-01-15",
    mealType: "dinner",
    description: "Jerk chicken with rice and peas, coleslaw and plantain",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "positive_conversation", "family_style_serving", "no_rushing"],
    notes: "Alex helped prepare the marinade — cultural celebration meal linked to life story work",
  },
  {
    id: "meal-002",
    date: "2026-01-16",
    mealType: "lunch",
    description: "Halal chicken biryani with raita and naan bread",
    foodGroupsCovered: ["protein", "carbohydrates", "dairy_alternatives"],
    freshFruitVegIncluded: false,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "positive_conversation", "cultural_celebration_meal"],
    notes: "Morgan chose the recipe and helped cook — proud of the result",
  },
  {
    id: "meal-003",
    date: "2026-01-17",
    mealType: "breakfast",
    description: "Full English breakfast with halal sausages and toast",
    foodGroupsCovered: ["protein", "carbohydrates", "fats_oils"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-morgan"],
    qualityFactors: ["no_rushing", "positive_conversation"],
  },
  {
    id: "meal-004",
    date: "2026-01-20",
    mealType: "dinner",
    description: "Shepherd's pie with seasonal vegetables",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "family_style_serving", "positive_conversation", "no_rushing", "children_helped_set_table"],
  },
  // ── February ────────────────────────────────────────────────────────────
  {
    id: "meal-005",
    date: "2026-02-05",
    mealType: "dinner",
    description: "Pasta bolognese with garlic bread and salad",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "children_helped_cook", "positive_conversation", "family_style_serving", "no_rushing"],
    notes: "Jordan helped make the bolognese — first time using the hob",
  },
  {
    id: "meal-006",
    date: "2026-02-06",
    mealType: "lunch",
    description: "Homemade pizza with mixed salad — children chose toppings",
    foodGroupsCovered: ["carbohydrates", "dairy_alternatives", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["children_helped_cook", "children_chose_menu", "positive_conversation", "no_rushing"],
    notes: "All three children made their own pizzas — halal toppings for Morgan, nut-free for Jordan",
  },
  {
    id: "meal-007",
    date: "2026-02-14",
    mealType: "dinner",
    description: "Chicken stir-fry with noodles and vegetables",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "positive_conversation", "no_rushing"],
  },
  // ── March ───────────────────────────────────────────────────────────────
  {
    id: "meal-008",
    date: "2026-03-01",
    mealType: "dinner",
    description: "Lamb curry with naan bread, rice and mango chutney",
    foodGroupsCovered: ["protein", "carbohydrates", "fats_oils", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "positive_conversation", "cultural_celebration_meal", "family_style_serving", "no_rushing"],
    notes: "Morgan cooked the curry — staff and children all ate together. Jordan had a milder version",
  },
  {
    id: "meal-009",
    date: "2026-03-10",
    mealType: "dinner",
    description: "Fish and chips with mushy peas and tartare sauce",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "no_rushing"],
  },
  {
    id: "meal-010",
    date: "2026-03-15",
    mealType: "dinner",
    description: "Roast chicken with roast potatoes, carrots, broccoli and gravy",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables", "fats_oils"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "family_style_serving", "positive_conversation", "no_rushing", "children_helped_set_table"],
    notes: "Sunday roast — all children helped lay the table. Good family-style atmosphere",
  },
  {
    id: "meal-011",
    date: "2026-03-20",
    mealType: "lunch",
    description: "Chicken wraps with salad, hummus and sweet potato wedges",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["children_chose_menu", "positive_conversation", "no_rushing"],
  },
  // ── April ───────────────────────────────────────────────────────────────
  {
    id: "meal-012",
    date: "2026-04-01",
    mealType: "dinner",
    description: "Eid celebration meal — halal lamb biryani with raita, pakoras and mango lassi",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables", "dairy_alternatives"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "cultural_celebration_meal", "family_style_serving", "positive_conversation", "no_rushing", "children_helped_set_table", "children_helped_cook"],
    notes: "Morgan led the cooking for Eid — whole home celebrated together. Alex and Jordan helped with decoration and table setting",
  },
  {
    id: "meal-013",
    date: "2026-04-10",
    mealType: "breakfast",
    description: "Pancakes with fresh berries and maple syrup",
    foodGroupsCovered: ["carbohydrates", "fruit_vegetables", "fats_oils"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["children_helped_cook", "positive_conversation", "no_rushing"],
    notes: "Alex made pancakes for everyone — growing in confidence",
  },
  {
    id: "meal-014",
    date: "2026-04-15",
    mealType: "dinner",
    description: "Spaghetti carbonara with garlic bread",
    foodGroupsCovered: ["carbohydrates", "protein", "dairy_alternatives"],
    freshFruitVegIncluded: false,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan"],
    qualityFactors: ["positive_conversation", "no_rushing"],
  },
  // ── May ─────────────────────────────────────────────────────────────────
  {
    id: "meal-015",
    date: "2026-05-05",
    mealType: "dinner",
    description: "Full Sunday roast — Morgan cooked independently (chicken, roast potatoes, Yorkshire puddings, vegetables, gravy)",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables", "fats_oils"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "family_style_serving", "positive_conversation", "no_rushing", "children_helped_cook", "children_helped_set_table"],
    notes: "Morgan cooked the entire roast independently — outstanding achievement for independence. Staff and all children ate together",
  },
  {
    id: "meal-016",
    date: "2026-05-10",
    mealType: "lunch",
    description: "Caribbean patties with rice and coleslaw",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "cultural_celebration_meal", "positive_conversation", "no_rushing"],
    notes: "Alex's request — Caribbean food for the weekend. All children enjoyed it",
  },
];

const DEMO_MENU_PLANS: MenuPlan[] = [
  {
    id: "mp-001",
    weekCommencing: "2026-01-13",
    createdBy: "Sarah Johnson",
    childrenContributed: true,
    contributingChildIds: ["child-alex", "child-morgan"],
    mealsPlanned: 21,
    dietaryVariety: 14,
    culturalMealsIncluded: 3,
    freshCookingDays: 6,
    totalDays: 7,
  },
  {
    id: "mp-002",
    weekCommencing: "2026-02-03",
    createdBy: "Lisa Williams",
    childrenContributed: true,
    contributingChildIds: ["child-alex", "child-jordan", "child-morgan"],
    mealsPlanned: 21,
    dietaryVariety: 15,
    culturalMealsIncluded: 2,
    freshCookingDays: 7,
    totalDays: 7,
  },
  {
    id: "mp-003",
    weekCommencing: "2026-03-03",
    createdBy: "Sarah Johnson",
    childrenContributed: true,
    contributingChildIds: ["child-jordan"],
    mealsPlanned: 21,
    dietaryVariety: 12,
    culturalMealsIncluded: 2,
    freshCookingDays: 5,
    totalDays: 7,
  },
  {
    id: "mp-004",
    weekCommencing: "2026-03-31",
    createdBy: "Tom Richards",
    childrenContributed: true,
    contributingChildIds: ["child-alex", "child-jordan", "child-morgan"],
    mealsPlanned: 21,
    dietaryVariety: 16,
    culturalMealsIncluded: 4,
    freshCookingDays: 7,
    totalDays: 7,
  },
  {
    id: "mp-005",
    weekCommencing: "2026-04-14",
    createdBy: "Lisa Williams",
    childrenContributed: true,
    contributingChildIds: ["child-alex"],
    mealsPlanned: 21,
    dietaryVariety: 13,
    culturalMealsIncluded: 1,
    freshCookingDays: 6,
    totalDays: 7,
  },
  {
    id: "mp-006",
    weekCommencing: "2026-05-05",
    createdBy: "Sarah Johnson",
    childrenContributed: true,
    contributingChildIds: ["child-alex", "child-jordan", "child-morgan"],
    mealsPlanned: 21,
    dietaryVariety: 15,
    culturalMealsIncluded: 3,
    freshCookingDays: 7,
    totalDays: 7,
  },
];

const DEMO_FOOD_SAFETY: FoodSafetyRecord[] = [
  { id: "fs-001", date: "2026-01-15", checkType: "fridge_temperature", compliant: true },
  { id: "fs-002", date: "2026-01-15", checkType: "freezer_temperature", compliant: true },
  { id: "fs-003", date: "2026-01-20", checkType: "food_hygiene_audit", compliant: true },
  { id: "fs-004", date: "2026-02-01", checkType: "allergen_labelling", compliant: true },
  { id: "fs-005", date: "2026-02-10", checkType: "fridge_temperature", compliant: false, correctionNeeded: "Fridge at 7°C — adjusted to 4°C", correctedDate: "2026-02-10" },
  { id: "fs-006", date: "2026-02-15", checkType: "use_by_date_check", compliant: true },
  { id: "fs-007", date: "2026-03-01", checkType: "cleaning_schedule", compliant: true },
  { id: "fs-008", date: "2026-03-10", checkType: "hand_hygiene", compliant: true },
  { id: "fs-009", date: "2026-03-20", checkType: "fridge_temperature", compliant: true },
  { id: "fs-010", date: "2026-04-01", checkType: "allergen_labelling", compliant: true },
  { id: "fs-011", date: "2026-04-15", checkType: "food_hygiene_audit", compliant: true },
  { id: "fs-012", date: "2026-05-01", checkType: "fridge_temperature", compliant: true },
  { id: "fs-013", date: "2026-05-10", checkType: "hand_hygiene", compliant: true },
  { id: "fs-014", date: "2026-05-15", checkType: "use_by_date_check", compliant: true },
];

const DEMO_COOKING_SESSIONS: CookingSession[] = [
  {
    id: "cs-001",
    date: "2026-01-20",
    childId: "child-alex",
    description: "Made jerk chicken marinade and rice — family recipe from life story work",
    skillsPractised: ["measuring ingredients", "seasoning", "using hob", "timing"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-002",
    date: "2026-02-05",
    childId: "child-jordan",
    description: "Made cheese toasties and tomato soup from scratch",
    skillsPractised: ["using grill safely", "heating soup", "basic knife skills"],
    supportLevel: "full_support",
    childEngaged: true,
    childInitiated: false,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-003",
    date: "2026-02-10",
    childId: "child-morgan",
    description: "Cooked biryani from scratch for the whole home — independently",
    skillsPractised: ["rice preparation", "spice blending", "timing multiple elements", "batch cooking"],
    supportLevel: "independent",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-004",
    date: "2026-03-05",
    childId: "child-alex",
    description: "Baked banana bread — measured all ingredients independently",
    skillsPractised: ["measuring", "mixing", "using oven", "testing readiness"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: false,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-005",
    date: "2026-03-15",
    childId: "child-morgan",
    description: "Made fresh pasta from scratch with tomato and basil sauce",
    skillsPractised: ["pasta making", "dough handling", "sauce preparation", "timing"],
    supportLevel: "independent",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-006",
    date: "2026-03-25",
    childId: "child-jordan",
    description: "Made omelettes with cheese and vegetables for lunch",
    skillsPractised: ["cracking eggs", "using frying pan", "flipping", "food prep"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-007",
    date: "2026-04-01",
    childId: "child-morgan",
    description: "Eid celebration meal — halal lamb biryani with pakoras for the whole home",
    skillsPractised: ["full meal preparation", "batch cooking", "presentation", "cultural cooking"],
    supportLevel: "independent",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-008",
    date: "2026-04-10",
    childId: "child-alex",
    description: "Made pancakes for the whole home — growing confidence in the kitchen",
    skillsPractised: ["batter making", "using frying pan", "flipping", "serving"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-009",
    date: "2026-04-20",
    childId: "child-jordan",
    description: "Made sandwiches and fruit salad for packed lunch independently",
    skillsPractised: ["knife skills", "food preparation", "presentation"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: false,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-010",
    date: "2026-05-05",
    childId: "child-morgan",
    description: "Cooked a full Sunday roast independently — chicken, roast potatoes, Yorkshire puddings, vegetables, gravy",
    skillsPractised: ["roasting", "timing multiple dishes", "gravy making", "full meal management"],
    supportLevel: "independent",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-011",
    date: "2026-05-12",
    childId: "child-alex",
    description: "Made Caribbean patties with coleslaw — followed family recipe",
    skillsPractised: ["pastry making", "filling preparation", "oven use", "cultural cooking"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateNutritionIntelligence(
    DEMO_CHILDREN,
    DEMO_MEALS,
    DEMO_MENU_PLANS,
    DEMO_FOOD_SAFETY,
    DEMO_COOKING_SESSIONS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  // Enrich with labels
  const enrichedDietaryBreakdown = result.dietaryAccommodation.requirementBreakdown.map((r) => ({
    ...r,
    typeLabel: getDietaryLabel(r.type),
  }));
  const enrichedQualityFactors = result.mealQuality.qualityFactorFrequency.map((f) => ({
    ...f,
    factorLabel: getQualityFactorLabel(f.factor),
  }));

  return NextResponse.json({
    data: {
      ...result,
      dietaryAccommodation: {
        ...result.dietaryAccommodation,
        requirementBreakdown: enrichedDietaryBreakdown,
      },
      mealQuality: {
        ...result.mealQuality,
        qualityFactorFrequency: enrichedQualityFactors,
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    children, meals, menuPlans, foodSafetyChecks, cookingSessions,
    homeId, periodStart, periodEnd,
  } = body as {
    children?: NutritionChild[];
    meals?: MealRecord[];
    menuPlans?: MenuPlan[];
    foodSafetyChecks?: FoodSafetyRecord[];
    cookingSessions?: CookingSession[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!children || !Array.isArray(children) || children.length === 0) {
    return NextResponse.json({ error: "children array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateNutritionIntelligence(
    children,
    meals ?? [],
    menuPlans ?? [],
    foodSafetyChecks ?? [],
    cookingSessions ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
