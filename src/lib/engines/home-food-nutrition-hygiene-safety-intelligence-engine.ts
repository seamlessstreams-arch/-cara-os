// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FOOD, NUTRITION, HYGIENE & SAFETY INTELLIGENCE ENGINE
// Home-level: aggregates food budgets, hygiene checks, meal plans,
// scratch cooking, cultural/sensory inclusion, and action completion.
// CHR 2015 Reg 9: "Promoting good health — including nutrition."
// HACCP: Hazard Analysis and Critical Control Points food safety.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface FoodBudgetInput {
  id: string;
  weekly_budget: number;
  total_spent: number;
  cook_from_scratch_proportion: number; // 0-100
  cultural_ingredients_included: boolean;
  sensory_friendly_options: boolean;
  child_requests_honoured_count: number;
  waste_noted: boolean;
}

export interface FoodHygieneCheckInput {
  id: string;
  check_type: string; // fridge_temp, freezer_temp, cooking_temp, cleaning_record, allergen_check, etc.
  compliance: string; // "pass"|"fail"|"action_required"|"n_a"
  action_required: boolean;
  action_completed: boolean;
}

export interface MealPlanInput {
  id: string;
  child_id: string;
  dietary_needs_met: boolean;
  balanced_nutrition: boolean;
  child_choice_offered: boolean;
}

export interface FoodHygieneSafetyInput {
  today: string;
  total_children: number;
  budgets: FoodBudgetInput[];
  hygiene_checks: FoodHygieneCheckInput[];
  meal_plans: MealPlanInput[];
}

// ── Output types ────────────────────────────────────────────────────────────

export type FoodHygieneSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FoodHygieneSafetyResult {
  food_rating: FoodHygieneSafetyRating;
  food_score: number;
  headline: string;
  hygiene_pass_rate: number;
  budget_adherence_rate: number;
  scratch_cooking_rate: number;
  dietary_compliance_rate: number;
  cultural_inclusion_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref: string }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeFoodNutritionHygieneSafety(
  input: FoodHygieneSafetyInput,
): FoodHygieneSafetyResult {
  const { total_children, budgets, hygiene_checks, meal_plans } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0) {
    return {
      food_rating: "insufficient_data",
      food_score: 0,
      headline: "No children on roll — food, nutrition, and hygiene safety cannot be assessed.",
      hygiene_pass_rate: 0,
      budget_adherence_rate: 0,
      scratch_cooking_rate: 0,
      dietary_compliance_rate: 0,
      cultural_inclusion_rate: 0,
      strengths: [],
      concerns: ["No children on roll — unable to assess food and hygiene safety standards."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ───────────────────────────────────────────────────────────

  // Hygiene pass rate: pass / total non-n_a checks
  const nonNAChecks = hygiene_checks.filter(c => c.compliance !== "n_a");
  const passChecks = nonNAChecks.filter(c => c.compliance === "pass");
  const hygienePassRate = pct(passChecks.length, nonNAChecks.length);

  // Budget adherence: budgets where total_spent <= weekly_budget
  const withinBudget = budgets.filter(b => b.total_spent <= b.weekly_budget);
  const budgetAdherenceRate = pct(withinBudget.length, budgets.length);

  // Scratch cooking: average cook_from_scratch_proportion
  const scratchCookingRate = budgets.length > 0
    ? Math.round(budgets.reduce((s, b) => s + b.cook_from_scratch_proportion, 0) / budgets.length)
    : 0;

  // Dietary compliance: meal_plans with dietary_needs_met
  const dietaryMetPlans = meal_plans.filter(m => m.dietary_needs_met);
  const dietaryComplianceRate = pct(dietaryMetPlans.length, meal_plans.length);

  // Cultural inclusion: budgets with cultural_ingredients_included
  const culturalBudgets = budgets.filter(b => b.cultural_ingredients_included);
  const culturalInclusionRate = pct(culturalBudgets.length, budgets.length);

  // Action completion: action_completed where action_required
  const actionsRequired = hygiene_checks.filter(c => c.action_required);
  const actionsCompleted = actionsRequired.filter(c => c.action_completed);
  const actionCompletionRate = pct(actionsCompleted.length, actionsRequired.length);

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max ~30 from 6 modifiers
  let score = 52;

  // mod1: Hygiene pass rate (±5)
  if (nonNAChecks.length === 0) {
    score -= 1;
  } else if (hygienePassRate >= 95) {
    score += 5;
  } else if (hygienePassRate >= 80) {
    score += 2;
  } else if (hygienePassRate >= 60) {
    score += 0;
  } else {
    score -= 5;
  }

  // mod2: Budget adherence (±6/-5)
  if (budgets.length === 0) {
    score += 0;
  } else if (budgetAdherenceRate >= 90) {
    score += 6;
  } else if (budgetAdherenceRate >= 70) {
    score += 3;
  } else if (budgetAdherenceRate >= 50) {
    score += 0;
  } else {
    score -= 5;
  }

  // mod3: Scratch cooking (+5/-4)
  if (budgets.length === 0) {
    score += 0;
  } else if (scratchCookingRate >= 70) {
    score += 5;
  } else if (scratchCookingRate >= 50) {
    score += 2;
  } else if (scratchCookingRate >= 30) {
    score += 0;
  } else {
    score -= 4;
  }

  // mod4: Dietary compliance (+5/-5)
  if (meal_plans.length === 0) {
    score -= 1;
  } else if (dietaryComplianceRate >= 90) {
    score += 5;
  } else if (dietaryComplianceRate >= 70) {
    score += 2;
  } else if (dietaryComplianceRate >= 40) {
    score += 0;
  } else {
    score -= 5;
  }

  // mod5: Cultural & sensory inclusion (+4/-4)
  if (budgets.length === 0) {
    score -= 1;
  } else if (culturalInclusionRate >= 80) {
    score += 4;
  } else if (culturalInclusionRate >= 50) {
    score += 1;
  } else if (culturalInclusionRate >= 20) {
    score += 0;
  } else {
    score -= 4;
  }

  // mod6: Action completion (+5/-5)
  if (actionsRequired.length === 0) {
    score += 3;
  } else if (actionCompletionRate >= 90) {
    score += 5;
  } else if (actionCompletionRate >= 70) {
    score += 2;
  } else if (actionCompletionRate >= 40) {
    score += 0;
  } else {
    score -= 5;
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let food_rating: FoodHygieneSafetyRating;
  if (score >= 80) food_rating = "outstanding";
  else if (score >= 65) food_rating = "good";
  else if (score >= 45) food_rating = "adequate";
  else food_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref: string }[] = [];
  const insights: { text: string; severity: "critical" | "warning" | "positive" }[] = [];
  let rank = 0;

  // Strengths
  if (hygienePassRate >= 95 && nonNAChecks.length > 0) {
    strengths.push(`${hygienePassRate}% hygiene pass rate — excellent food safety compliance.`);
  }
  if (budgetAdherenceRate >= 90 && budgets.length > 0) {
    strengths.push(`${budgetAdherenceRate}% of weeks within food budget — strong financial governance.`);
  }
  if (scratchCookingRate >= 70 && budgets.length > 0) {
    strengths.push(`${scratchCookingRate}% scratch cooking rate — children receive freshly prepared, home-cooked meals.`);
  }
  if (dietaryComplianceRate >= 90 && meal_plans.length > 0) {
    strengths.push(`${dietaryComplianceRate}% dietary compliance — every child's nutritional needs are being met.`);
  }
  if (culturalInclusionRate >= 80 && budgets.length > 0) {
    strengths.push(`${culturalInclusionRate}% cultural ingredient inclusion — dietary diversity is celebrated.`);
  }
  if (actionCompletionRate >= 90 && actionsRequired.length > 0) {
    strengths.push(`${actionCompletionRate}% action completion rate — hygiene actions are resolved promptly.`);
  }
  if (actionsRequired.length === 0 && nonNAChecks.length > 0) {
    strengths.push("No hygiene actions required — proactive food safety management.");
  }

  // Concerns
  const failChecks = nonNAChecks.filter(c => c.compliance === "fail");
  if (hygienePassRate < 60 && nonNAChecks.length > 0) {
    concerns.push(`Hygiene pass rate is only ${hygienePassRate}% — food safety standards are significantly below acceptable levels.`);
  }
  if (failChecks.length >= 3) {
    concerns.push(`${failChecks.length} hygiene checks failed — systematic food safety failures require urgent attention.`);
  }
  if (budgetAdherenceRate < 50 && budgets.length > 0) {
    concerns.push(`Only ${budgetAdherenceRate}% of weeks within budget — food spending is poorly controlled.`);
  }
  if (scratchCookingRate < 30 && budgets.length > 0) {
    concerns.push(`Scratch cooking rate is only ${scratchCookingRate}% — over-reliance on pre-prepared foods.`);
  }
  if (dietaryComplianceRate < 40 && meal_plans.length > 0) {
    concerns.push(`Only ${dietaryComplianceRate}% dietary compliance — children's nutritional needs are not being met.`);
  }
  if (culturalInclusionRate < 20 && budgets.length > 0) {
    concerns.push(`Cultural ingredient inclusion is only ${culturalInclusionRate}% — cultural dietary needs may be neglected.`);
  }
  if (actionCompletionRate < 40 && actionsRequired.length > 0) {
    concerns.push(`Only ${actionCompletionRate}% of required hygiene actions completed — outstanding safety actions are not being resolved.`);
  }
  if (meal_plans.length === 0) {
    concerns.push("No meal plans recorded — dietary planning and child nutritional monitoring cannot be evidenced.");
  }
  if (hygiene_checks.length === 0) {
    concerns.push("No hygiene checks recorded — food safety compliance cannot be demonstrated.");
  }

  // Recommendations (up to 5)
  if (failChecks.length >= 2 && rank < 5) {
    recommendations.push({ rank: ++rank, recommendation: "Conduct an immediate review of hygiene check failures and implement corrective actions to restore food safety standards.", urgency: "immediate", regulatory_ref: "HACCP" });
  }
  if (actionCompletionRate < 40 && actionsRequired.length > 0 && rank < 5) {
    recommendations.push({ rank: ++rank, recommendation: "Clear outstanding hygiene actions urgently — incomplete actions indicate food safety risks are not being managed.", urgency: "immediate", regulatory_ref: "HACCP" });
  }
  if (dietaryComplianceRate < 70 && meal_plans.length > 0 && rank < 5) {
    recommendations.push({ rank: ++rank, recommendation: "Review meal planning to ensure every child's dietary needs are consistently met — this is a fundamental requirement of Reg 9.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (scratchCookingRate < 50 && budgets.length > 0 && rank < 5) {
    recommendations.push({ rank: ++rank, recommendation: "Increase the proportion of meals cooked from scratch to promote healthier eating and life skills development.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (culturalInclusionRate < 50 && budgets.length > 0 && rank < 5) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure cultural and dietary diversity is reflected in food purchasing and meal planning to meet each child's identity needs.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (budgetAdherenceRate < 70 && budgets.length > 0 && rank < 5) {
    recommendations.push({ rank: ++rank, recommendation: "Improve food budget governance — consistent overspending may indicate poor planning or waste.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (meal_plans.length === 0 && rank < 5) {
    recommendations.push({ rank: ++rank, recommendation: "Introduce structured meal planning to evidence dietary care and ensure balanced nutrition for every child.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (hygiene_checks.length === 0 && rank < 5) {
    recommendations.push({ rank: ++rank, recommendation: "Establish a regular food hygiene checking regime covering fridge/freezer temperatures, cleaning, and allergen management.", urgency: "immediate", regulatory_ref: "HACCP" });
  }

  // Insights (up to 3)
  if (hygienePassRate >= 95 && dietaryComplianceRate >= 90 && scratchCookingRate >= 70 && culturalInclusionRate >= 80) {
    insights.push({ text: "Food safety, nutrition, cultural inclusion, and scratch cooking are all at exemplary levels. This demonstrates outstanding child-centred nutritional care that Ofsted would recognise.", severity: "positive" });
  }
  if (failChecks.length >= 3 && actionCompletionRate < 50) {
    insights.push({ text: `${failChecks.length} hygiene failures with only ${actionCompletionRate}% action completion — this indicates systemic food safety governance failure that would be a serious regulatory concern.`, severity: "critical" });
  }
  if (scratchCookingRate < 30 && budgets.length > 0 && dietaryComplianceRate < 70 && meal_plans.length > 0) {
    insights.push({ text: `Low scratch cooking (${scratchCookingRate}%) combined with poor dietary compliance (${dietaryComplianceRate}%) suggests children are not receiving adequate nutritional care.`, severity: "warning" });
  }
  if (budgetAdherenceRate >= 90 && scratchCookingRate >= 70 && budgets.length > 0) {
    insights.push({ text: "Strong budget discipline alongside high scratch cooking rates shows effective food governance — resources are being well managed to benefit children.", severity: "positive" });
  }
  if (hygienePassRate < 60 && nonNAChecks.length >= 5) {
    insights.push({ text: `Hygiene pass rate of ${hygienePassRate}% across ${nonNAChecks.length} checks indicates persistent food safety non-compliance that must be addressed before any inspection.`, severity: "critical" });
  }

  // Trim to max 3 insights
  const trimmedInsights = insights.slice(0, 3);

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (food_rating === "outstanding") {
    headline = `Outstanding food and hygiene safety — ${hygienePassRate}% hygiene pass rate, ${dietaryComplianceRate}% dietary compliance.`;
  } else if (food_rating === "good") {
    headline = `Good food and hygiene standards — ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement." : "well-managed food safety and nutrition."}`;
  } else if (food_rating === "adequate") {
    headline = `Food and hygiene safety needs improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Food and hygiene safety is inadequate — significant gaps in food safety, nutrition, or hygiene compliance.`;
  }

  return {
    food_rating,
    food_score: score,
    headline,
    hygiene_pass_rate: hygienePassRate,
    budget_adherence_rate: budgetAdherenceRate,
    scratch_cooking_rate: scratchCookingRate,
    dietary_compliance_rate: dietaryComplianceRate,
    cultural_inclusion_rate: culturalInclusionRate,
    strengths,
    concerns,
    recommendations: recommendations.slice(0, 5),
    insights: trimmedInsights,
  };
}
