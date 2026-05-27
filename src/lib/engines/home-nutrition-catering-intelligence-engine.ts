// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NUTRITION & CATERING INTELLIGENCE ENGINE
// Home-level: aggregates meal planning, dietary plans, food hygiene,
// kitchen checks, eating support plans, and food budgets.
// CHR 2015 Reg 9: "Promoting good health — including nutrition."
// CHR 2015 Reg 10: "Health & wellbeing standard."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface MealPlanInput {
  id: string;
  date: string;
  meal: string;                    // breakfast | lunch | dinner | snack
  dietary_flags_count: number;     // allergen/dietary labels applied
  child_preferences_count: number; // per-child preferences considered
  budget: number;
}

export interface DietaryPlanInput {
  id: string;
  child_id: string;
  allergies_count: number;
  medical_dietary_needs_count: number;
  sensory_food_needs_count: number;
  reviewed_date: string;
  next_review_date: string;
  reviewed_with_child: boolean;
  child_agreed: boolean;
  signed_off_by_dietitian: boolean;
}

export interface FoodHygieneRecordInput {
  id: string;
  date: string;
  check_type: string;              // fridge_temp | freezer_temp | cooking_temp | cleaning_record | allergen_check | delivery_check | date_label_check | deep_clean | pest_check | hand_hygiene_audit
  compliance: string;              // pass | fail | action_required | n_a
  action_required: boolean;        // from action_required !== ""
  action_completed: boolean;
}

export interface KitchenHygieneCheckInput {
  id: string;
  date: string;
  fridge_within_range: boolean;
  freezer_within_range: boolean;
  surfaces_cleaned: boolean;
  handwashing_observed: boolean;
  cutting_board_segregation: boolean;
  allergen_labelling: boolean;
  overall_verdict: string;         // pass | minor_actions | fail
  immediate_actions_count: number;
  follow_up_actions_count: number;
  expired_items_found_count: number;
}

export interface EatingSupportPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  review_date: string;
  child_chose: boolean;
  flags_for_review_count: number;
  safe_foods_count: number;
  staff_strategies_count: number;  // do + do_not strategies
}

export interface FoodBudgetWeekInput {
  id: string;
  week_starting: string;
  weekly_budget: number;
  total_spent: number;
  variance: number;
  cultural_ingredients_included: boolean;
  sensory_friendly_options_included: boolean;
  cook_from_scratch_proportion: number;  // 0-100
  child_meal_requests_honoured_count: number;
}

export interface HomeNutritionCateringInput {
  today: string;
  meal_plans: MealPlanInput[];
  dietary_plans: DietaryPlanInput[];
  food_hygiene_records: FoodHygieneRecordInput[];
  kitchen_hygiene_checks: KitchenHygieneCheckInput[];
  eating_support_plans: EatingSupportPlanInput[];
  food_budgets: FoodBudgetWeekInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type NutritionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MealPlanProfile {
  total_plans_30d: number;
  unique_meals_covered: number;
  avg_dietary_flags: number;
  avg_child_preferences: number;
}

export interface DietaryPlanProfile {
  total_plans: number;
  child_coverage: number;         // pct of total_children
  reviewed_with_child_rate: number;
  child_agreed_rate: number;
  dietitian_sign_off_rate: number;
  overdue_reviews: number;
}

export interface FoodHygieneProfile {
  total_checks_30d: number;
  pass_rate: number;
  fail_count: number;
  action_completion_rate: number;
  check_type_diversity: number;
}

export interface KitchenProfile {
  total_checks_30d: number;
  pass_rate: number;
  temperature_compliance_rate: number;
  allergen_labelling_rate: number;
  expired_items_total: number;
}

export interface EatingSupportProfile {
  total_plans: number;
  child_choice_rate: number;
  overdue_reviews: number;
  flags_for_review_total: number;
}

export interface BudgetProfile {
  weeks_tracked_90d: number;
  avg_variance: number;
  within_budget_rate: number;
  cultural_inclusion_rate: number;
  sensory_options_rate: number;
  avg_scratch_proportion: number;
}

export interface HomeNutritionCateringResult {
  nutrition_rating: NutritionRating;
  nutrition_score: number;
  headline: string;
  meal_plans: MealPlanProfile;
  dietary_plans: DietaryPlanProfile;
  food_hygiene: FoodHygieneProfile;
  kitchen: KitchenProfile;
  eating_support: EatingSupportProfile;
  budget: BudgetProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeNutritionCatering(
  input: HomeNutritionCateringInput,
): HomeNutritionCateringResult {
  const {
    today, meal_plans, dietary_plans, food_hygiene_records,
    kitchen_hygiene_checks, eating_support_plans, food_budgets, total_children,
  } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (
    total_children === 0 &&
    meal_plans.length === 0 &&
    food_hygiene_records.length === 0 &&
    kitchen_hygiene_checks.length === 0
  ) {
    return {
      nutrition_rating: "insufficient_data",
      nutrition_score: 0,
      headline: "No nutrition or catering data available for analysis.",
      meal_plans: { total_plans_30d: 0, unique_meals_covered: 0, avg_dietary_flags: 0, avg_child_preferences: 0 },
      dietary_plans: { total_plans: 0, child_coverage: 0, reviewed_with_child_rate: 0, child_agreed_rate: 0, dietitian_sign_off_rate: 0, overdue_reviews: 0 },
      food_hygiene: { total_checks_30d: 0, pass_rate: 0, fail_count: 0, action_completion_rate: 0, check_type_diversity: 0 },
      kitchen: { total_checks_30d: 0, pass_rate: 0, temperature_compliance_rate: 0, allergen_labelling_rate: 0, expired_items_total: 0 },
      eating_support: { total_plans: 0, child_choice_rate: 0, overdue_reviews: 0, flags_for_review_total: 0 },
      budget: { weeks_tracked_90d: 0, avg_variance: 0, within_budget_rate: 0, cultural_inclusion_rate: 0, sensory_options_rate: 0, avg_scratch_proportion: 0 },
      strengths: [],
      concerns: ["No nutrition or catering data — food safety and dietary care cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Meal Plans (30d) ──────────────────────────────────────────────────
  const mealPlans30d = meal_plans.filter(m => {
    const d = daysBetween(m.date, today);
    return d >= 0 && d <= 30;
  });

  const uniqueMeals = new Set(mealPlans30d.map(m => m.meal));
  const avgDietaryFlags = mealPlans30d.length > 0
    ? Math.round((mealPlans30d.reduce((s, m) => s + m.dietary_flags_count, 0) / mealPlans30d.length) * 10) / 10
    : 0;
  const avgChildPrefs = mealPlans30d.length > 0
    ? Math.round((mealPlans30d.reduce((s, m) => s + m.child_preferences_count, 0) / mealPlans30d.length) * 10) / 10
    : 0;

  const mealPlanProfile: MealPlanProfile = {
    total_plans_30d: mealPlans30d.length,
    unique_meals_covered: uniqueMeals.size,
    avg_dietary_flags: avgDietaryFlags,
    avg_child_preferences: avgChildPrefs,
  };

  // ── Dietary Plans ─────────────────────────────────────────────────────
  const uniqueDietaryChildren = new Set(dietary_plans.map(d => d.child_id));
  const dietaryCoverage = pct(uniqueDietaryChildren.size, total_children);
  const reviewedWithChildRate = pct(
    dietary_plans.filter(d => d.reviewed_with_child).length,
    dietary_plans.length,
  );
  const childAgreedRate = pct(
    dietary_plans.filter(d => d.child_agreed).length,
    dietary_plans.length,
  );
  const dietitianRate = pct(
    dietary_plans.filter(d => d.signed_off_by_dietitian).length,
    dietary_plans.length,
  );
  const overdueDietaryReviews = dietary_plans.filter(d =>
    daysBetween(d.next_review_date, today) > 0,
  ).length;

  const dietaryPlanProfile: DietaryPlanProfile = {
    total_plans: dietary_plans.length,
    child_coverage: dietaryCoverage,
    reviewed_with_child_rate: reviewedWithChildRate,
    child_agreed_rate: childAgreedRate,
    dietitian_sign_off_rate: dietitianRate,
    overdue_reviews: overdueDietaryReviews,
  };

  // ── Food Hygiene (30d) ────────────────────────────────────────────────
  const foodHygiene30d = food_hygiene_records.filter(r => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 30;
  });

  const hygieneNonNA = foodHygiene30d.filter(r => r.compliance !== "n_a");
  const hygienePassRate = pct(
    hygieneNonNA.filter(r => r.compliance === "pass").length,
    hygieneNonNA.length,
  );
  const hygieneFailCount = foodHygiene30d.filter(r => r.compliance === "fail").length;
  const hygieneWithAction = foodHygiene30d.filter(r => r.action_required);
  const hygieneActionCompletionRate = pct(
    hygieneWithAction.filter(r => r.action_completed).length,
    hygieneWithAction.length,
  );
  const checkTypeDiversity = new Set(foodHygiene30d.map(r => r.check_type)).size;

  const foodHygieneProfile: FoodHygieneProfile = {
    total_checks_30d: foodHygiene30d.length,
    pass_rate: hygienePassRate,
    fail_count: hygieneFailCount,
    action_completion_rate: hygieneActionCompletionRate,
    check_type_diversity: checkTypeDiversity,
  };

  // ── Kitchen Hygiene (30d) ─────────────────────────────────────────────
  const kitchenChecks30d = kitchen_hygiene_checks.filter(k => {
    const d = daysBetween(k.date, today);
    return d >= 0 && d <= 30;
  });

  const kitchenPassRate = pct(
    kitchenChecks30d.filter(k => k.overall_verdict === "pass").length,
    kitchenChecks30d.length,
  );
  const tempCompliance = pct(
    kitchenChecks30d.filter(k => k.fridge_within_range && k.freezer_within_range).length,
    kitchenChecks30d.length,
  );
  const allergenLabellingRate = pct(
    kitchenChecks30d.filter(k => k.allergen_labelling).length,
    kitchenChecks30d.length,
  );
  const totalExpiredItems = kitchenChecks30d.reduce((s, k) => s + k.expired_items_found_count, 0);

  const kitchenProfile: KitchenProfile = {
    total_checks_30d: kitchenChecks30d.length,
    pass_rate: kitchenPassRate,
    temperature_compliance_rate: tempCompliance,
    allergen_labelling_rate: allergenLabellingRate,
    expired_items_total: totalExpiredItems,
  };

  // ── Eating Support Plans ──────────────────────────────────────────────
  const childChoiceRate = pct(
    eating_support_plans.filter(e => e.child_chose).length,
    eating_support_plans.length,
  );
  const overdueEatingReviews = eating_support_plans.filter(e =>
    daysBetween(e.review_date, today) > 0,
  ).length;
  const flagsTotal = eating_support_plans.reduce((s, e) => s + e.flags_for_review_count, 0);

  const eatingSupportProfile: EatingSupportProfile = {
    total_plans: eating_support_plans.length,
    child_choice_rate: childChoiceRate,
    overdue_reviews: overdueEatingReviews,
    flags_for_review_total: flagsTotal,
  };

  // ── Food Budget (90d) ─────────────────────────────────────────────────
  const budgets90d = food_budgets.filter(b => {
    const d = daysBetween(b.week_starting, today);
    return d >= 0 && d <= 90;
  });

  const avgVariance = budgets90d.length > 0
    ? Math.round((budgets90d.reduce((s, b) => s + b.variance, 0) / budgets90d.length) * 100) / 100
    : 0;
  const withinBudgetRate = pct(
    budgets90d.filter(b => b.variance >= 0).length,
    budgets90d.length,
  );
  const culturalRate = pct(
    budgets90d.filter(b => b.cultural_ingredients_included).length,
    budgets90d.length,
  );
  const sensoryRate = pct(
    budgets90d.filter(b => b.sensory_friendly_options_included).length,
    budgets90d.length,
  );
  const avgScratch = budgets90d.length > 0
    ? Math.round(budgets90d.reduce((s, b) => s + b.cook_from_scratch_proportion, 0) / budgets90d.length)
    : 0;

  const budgetProfile: BudgetProfile = {
    weeks_tracked_90d: budgets90d.length,
    avg_variance: avgVariance,
    within_budget_rate: withinBudgetRate,
    cultural_inclusion_rate: culturalRate,
    sensory_options_rate: sensoryRate,
    avg_scratch_proportion: avgScratch,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80
  let score = 52;

  // mod1: Food hygiene pass rate (±5) — food safety compliance
  if (foodHygiene30d.length === 0 && kitchenChecks30d.length === 0) {
    score += 0;
  } else {
    const combinedPassCount =
      hygieneNonNA.filter(r => r.compliance === "pass").length +
      kitchenChecks30d.filter(k => k.overall_verdict === "pass").length;
    const combinedTotal = hygieneNonNA.length + kitchenChecks30d.length;
    const combinedPassRate = pct(combinedPassCount, combinedTotal);
    if (combinedPassRate >= 95) score += 5;
    else if (combinedPassRate >= 80) score += 3;
    else if (combinedPassRate >= 60) score += 0;
    else score -= 5;
  }

  // mod2: Dietary plan coverage (±4) — every child's needs documented
  if (dietary_plans.length === 0 && total_children === 0) {
    score += 0;
  } else if (dietary_plans.length === 0 && total_children > 0) {
    score -= 4;
  } else {
    if (dietaryCoverage >= 90) score += 4;
    else if (dietaryCoverage >= 70) score += 2;
    else if (dietaryCoverage >= 50) score += 0;
    else score -= 4;
  }

  // mod3: Temperature compliance (±4) — fridge/freezer governance
  if (kitchenChecks30d.length === 0) {
    score += (foodHygiene30d.length > 0 ? 1 : 0);
  } else {
    if (tempCompliance >= 100) score += 4;
    else if (tempCompliance >= 90) score += 2;
    else if (tempCompliance >= 70) score += 0;
    else score -= 4;
  }

  // mod4: Child voice in dietary plans (±3) — reviewed with child & agreed
  if (dietary_plans.length === 0) {
    score += 0;
  } else {
    const combinedVoice = pct(
      dietary_plans.filter(d => d.reviewed_with_child && d.child_agreed).length,
      dietary_plans.length,
    );
    if (combinedVoice >= 90) score += 3;
    else if (combinedVoice >= 70) score += 1;
    else if (combinedVoice >= 50) score += 0;
    else score -= 3;
  }

  // mod5: Allergen labelling (±3) — protecting children with allergies
  if (kitchenChecks30d.length === 0) {
    score += 0;
  } else {
    if (allergenLabellingRate >= 100) score += 3;
    else if (allergenLabellingRate >= 80) score += 1;
    else if (allergenLabellingRate >= 60) score += 0;
    else score -= 3;
  }

  // mod6: Meal planning regularity (±3) — consistent, planned nutrition
  if (mealPlans30d.length === 0) {
    score += (total_children === 0 ? 0 : -3);
  } else {
    if (mealPlans30d.length >= 20) score += 3;
    else if (mealPlans30d.length >= 10) score += 1;
    else score += 0;
  }

  // mod7: Budget management (±3) — financial governance of food
  if (budgets90d.length === 0) {
    score += 0;
  } else {
    if (withinBudgetRate >= 90 && avgScratch >= 50) score += 3;
    else if (withinBudgetRate >= 70) score += 1;
    else if (withinBudgetRate >= 50) score += 0;
    else score -= 3;
  }

  // mod8: Cultural and sensory inclusion (±3) — Reg 9 cultural dietary needs
  if (budgets90d.length === 0) {
    score += 0;
  } else {
    if (culturalRate >= 80 && sensoryRate >= 80) score += 3;
    else if (culturalRate >= 60 || sensoryRate >= 60) score += 1;
    else if (culturalRate >= 30 || sensoryRate >= 30) score += 0;
    else score -= 3;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let nutrition_rating: NutritionRating;
  if (score >= 80) nutrition_rating = "outstanding";
  else if (score >= 65) nutrition_rating = "good";
  else if (score >= 45) nutrition_rating = "adequate";
  else nutrition_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (hygienePassRate >= 95 && foodHygiene30d.length > 0) strengths.push(`${hygienePassRate}% food hygiene pass rate — excellent food safety standards.`);
  if (kitchenPassRate >= 95 && kitchenChecks30d.length > 0) strengths.push(`${kitchenPassRate}% kitchen hygiene pass rate — consistently high standards.`);
  if (tempCompliance >= 100 && kitchenChecks30d.length > 0) strengths.push("100% temperature compliance — fridge and freezer storage is exemplary.");
  if (dietaryCoverage >= 90 && dietary_plans.length > 0) strengths.push(`${dietaryCoverage}% dietary plan coverage — every child's nutritional needs are documented.`);
  if (allergenLabellingRate >= 100 && kitchenChecks30d.length > 0) strengths.push("100% allergen labelling compliance — protecting children with allergies.");
  if (culturalRate >= 80 && budgets90d.length > 0) strengths.push(`${culturalRate}% of weeks include cultural ingredients — dietary diversity is valued.`);
  if (avgScratch >= 70 && budgets90d.length > 0) strengths.push(`${avgScratch}% average cook-from-scratch rate — promoting healthy, home-cooked meals.`);

  // Concerns
  if (hygieneFailCount >= 3) concerns.push(`${hygieneFailCount} food hygiene failures in 30 days — food safety requires immediate review.`);
  if (totalExpiredItems >= 3) concerns.push(`${totalExpiredItems} expired items found in kitchen checks — stock rotation needs attention.`);
  if (tempCompliance < 80 && kitchenChecks30d.length > 0) concerns.push(`Temperature compliance only ${tempCompliance}% — children's food may not be stored safely.`);
  if (dietaryCoverage < 50 && total_children > 0 && dietary_plans.length > 0) concerns.push(`Only ${dietaryCoverage}% of children have dietary plans — nutritional needs may be unmet.`);
  if (dietaryCoverage === 0 && total_children > 0) concerns.push("No dietary plans for any children — Reg 9 requires documented nutritional care.");
  if (overdueDietaryReviews >= 2) concerns.push(`${overdueDietaryReviews} overdue dietary plan reviews — children's changing needs may not be reflected.`);
  if (allergenLabellingRate < 60 && kitchenChecks30d.length > 0) concerns.push(`Allergen labelling only ${allergenLabellingRate}% — children with allergies may be at risk.`);

  // Recommendations
  if (hygieneFailCount >= 2) {
    recommendations.push({ rank: ++rank, recommendation: "Review and address food hygiene failures immediately — failed checks may indicate systemic kitchen safety issues.", urgency: "immediate", regulatory_ref: "Reg 9" });
  }
  if (allergenLabellingRate < 80 && kitchenChecks30d.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve allergen labelling to protect children with allergies — this is a fundamental food safety requirement.", urgency: "immediate", regulatory_ref: "Reg 9" });
  }
  if (dietaryCoverage < 70 && total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure every child has a dietary plan capturing allergies, preferences, and cultural needs.", urgency: "soon", regulatory_ref: "Reg 9" });
  }
  if (reviewedWithChildRate < 70 && dietary_plans.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review dietary plans with children and obtain their agreement — their voice should shape their nutrition.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (mealPlans30d.length < 10 && total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Increase meal planning frequency — regular planned menus support consistent nutrition and reduce waste.", urgency: "planned", regulatory_ref: "Reg 9" });
  }

  // ARIA Insights
  if (hygienePassRate >= 95 && kitchenPassRate >= 95 && tempCompliance >= 100 && allergenLabellingRate >= 100) {
    insights.push({ text: "Nutrition and catering governance is exemplary. Food safety, temperature control, allergen management, and kitchen hygiene all exceed thresholds. Ofsted will recognise this as outstanding nutritional care.", severity: "positive" });
  }
  if (hygieneFailCount >= 3 && totalExpiredItems >= 3) {
    insights.push({ text: `${hygieneFailCount} hygiene failures and ${totalExpiredItems} expired items suggest systemic food safety weaknesses. This would be a serious concern during inspection.`, severity: "critical" });
  }
  if (culturalRate >= 80 && reviewedWithChildRate >= 80 && childAgreedRate >= 80) {
    insights.push({ text: "Children's cultural dietary needs are being met and their voices are shaping meal planning — this demonstrates genuinely child-centred nutritional care.", severity: "positive" });
  }
  if (avgScratch < 30 && budgets90d.length >= 4) {
    insights.push({ text: `Only ${avgScratch}% of meals cooked from scratch on average. Over-reliance on pre-prepared food may not promote healthy eating or life skills development.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (nutrition_rating === "outstanding") {
    headline = `Outstanding nutritional care — ${hygienePassRate}% hygiene pass rate, ${dietaryCoverage}% dietary plan coverage.`;
  } else if (nutrition_rating === "good") {
    headline = `Good nutrition standards — ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement." : "well-managed food safety and planning."}`;
  } else if (nutrition_rating === "adequate") {
    headline = `Nutrition and catering needs improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Nutrition and catering is inadequate — significant gaps in food safety, dietary planning, or hygiene compliance.`;
  }

  return {
    nutrition_rating,
    nutrition_score: score,
    headline,
    meal_plans: mealPlanProfile,
    dietary_plans: dietaryPlanProfile,
    food_hygiene: foodHygieneProfile,
    kitchen: kitchenProfile,
    eating_support: eatingSupportProfile,
    budget: budgetProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
