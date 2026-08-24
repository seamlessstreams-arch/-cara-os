// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME COOKING & BAKING LIFE SKILLS INTELLIGENCE ENGINE
// Pure deterministic engine: cooking competency progression, independence,
// hygiene awareness, cultural exploration, and child voice in food skills.
// CHR 2015 Reg 9: "Promoting good health and well-being." SCCIF: Independence.
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CookingRecordInput {
  id: string;
  child_id: string;
  competency_level: string; // "not_yet_introduced"|"observed_staff"|"assisted"|"did_with_prompts"|"did_independently"|"can_teach_others"
  recipes_attempted_count: number;
  recipes_good_or_better_count: number;
  cuisines_explored_count: number;
  has_child_voice: boolean;
  hygiene_certificate: boolean;
  led_family_meal: boolean;
  category: string; // "knife_skills"|"hob_cooking"|"oven_baking"|"microwave"|"recipe_planning"|"shopping_list"|"budgeting"|"food_hygiene"|"allergens_awareness"|"cultural_cooking"
}

export interface CookingLifeSkillsInput {
  today: string;
  total_children: number;
  records: CookingRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type CookingSkillsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CookingLifeSkillsResult {
  cooking_rating: CookingSkillsRating;
  cooking_score: number;
  headline: string;
  total_records: number;
  /** null when the population is empty — nothing measured, not 0%. */
  independence_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  hygiene_certificate_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_voice_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recipe_success_rate: number | null;
  category_variety: number;
  /** null when the population is empty — nothing measured, not 0%. */
  children_engaged_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): CookingSkillsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeCookingLifeSkills(
  input: CookingLifeSkillsInput,
): CookingLifeSkillsResult {
  const { records, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      cooking_rating: "insufficient_data",
      cooking_score: 0,
      headline: "No data available for cooking life skills analysis",
      total_records: 0,
      independence_rate: 0,
      hygiene_certificate_rate: 0,
      child_voice_rate: 0,
      recipe_success_rate: 0,
      category_variety: 0,
      children_engaged_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = records.length;

  const independent = records.filter(r =>
    r.competency_level === "did_independently" || r.competency_level === "can_teach_others"
  ).length;
  const independenceRate = rate(independent, total);

  const withHygiene = records.filter(r => r.hygiene_certificate).length;
  const hygieneCertRate = rate(withHygiene, total);

  const withVoice = records.filter(r => r.has_child_voice).length;
  const childVoiceRate = rate(withVoice, total);

  const totalRecipes = records.reduce((s, r) => s + r.recipes_attempted_count, 0);
  const goodRecipes = records.reduce((s, r) => s + r.recipes_good_or_better_count, 0);
  const recipeSuccessRate = rate(goodRecipes, totalRecipes);

  const uniqueCategories = new Set(records.map(r => r.category)).size;

  const uniqueChildren = new Set(records.map(r => r.child_id)).size;
  const childrenEngagedRate = rate(uniqueChildren, total_children);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Independence rate
  if (total === 0) {
    score -= 3;
  } else {
    if (meets(independenceRate, 60)) score += 5;
    else if (meets(independenceRate, 30)) score += 2;
    else if (below(independenceRate, 15)) score -= 5;
  }

  // Modifier 2: Children engaged (coverage)
  if (total === 0) {
    // already penalised
  } else {
    if (meets(childrenEngagedRate, 90)) score += 6;
    else if (meets(childrenEngagedRate, 60)) score += 2;
    else if (below(childrenEngagedRate, 40)) score -= 5;
  }

  // Modifier 3: Child voice
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(childVoiceRate, 80)) score += 5;
    else if (meets(childVoiceRate, 50)) score += 2;
    else if (below(childVoiceRate, 30)) score -= 4;
  }

  // Modifier 4: Recipe success rate
  if (totalRecipes === 0 && total > 0) {
    score -= 1;
  } else if (totalRecipes === 0) {
    // no records
  } else {
    if (meets(recipeSuccessRate, 80)) score += 5;
    else if (meets(recipeSuccessRate, 50)) score += 2;
    else if (below(recipeSuccessRate, 30)) score -= 5;
  }

  // Modifier 5: Category variety (breadth of skills)
  if (total === 0) {
    score -= 1;
  } else {
    if (uniqueCategories >= 6) score += 4;
    else if (uniqueCategories >= 3) score += 1;
    else if (uniqueCategories <= 1) score -= 4;
  }

  // Modifier 6: Hygiene certificate uptake
  if (total === 0) {
    score -= 2;
  } else {
    if (meets(hygieneCertRate, 50)) score += 5;
    else if (meets(hygieneCertRate, 20)) score += 2;
    else if (hygieneCertRate === 0) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Cooking and life skills programme is comprehensive — children are developing real independence";
      break;
    case "good":
      headline = "Good cooking skills development with effective progression and child engagement";
      break;
    case "adequate":
      headline = "Cooking skills programme exists but needs broader coverage and deeper progression";
      break;
    case "inadequate":
      headline = "Cooking and life skills provision is inadequate — children are not being prepared for independence";
      break;
    default:
      headline = "No data available for cooking life skills analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(independenceRate, 60) && total > 0) strengths.push("Strong independence progression — children are cooking confidently on their own");
  if (meets(childrenEngagedRate, 90) && total > 0) strengths.push("All children are engaged in cooking skills development");
  if (meets(childVoiceRate, 80) && total > 0) strengths.push("Children's views and preferences are central to cooking activities");
  if (meets(recipeSuccessRate, 80) && totalRecipes > 0) strengths.push("High recipe success rate shows effective teaching and growing confidence");
  if (uniqueCategories >= 6 && total > 0) strengths.push("Broad range of cooking categories covered — from knife skills to cultural cooking");
  if (meets(hygieneCertRate, 50) && total > 0) strengths.push("Good uptake of food hygiene certification — embedding safety knowledge");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No cooking or life skills records — children are not being taught essential independence skills");
  if (below(independenceRate, 15) && total > 0) concerns.push("Very few children can cook independently — progression is too slow");
  if (below(childrenEngagedRate, 40) && total > 0) concerns.push("Most children are not engaged in cooking activities — opportunity to build skills is being missed");
  if (below(childVoiceRate, 30) && total > 0) concerns.push("Children's voice is largely absent from cooking activities");
  if (hygieneCertRate === 0 && total > 0) concerns.push("No children have food hygiene certification — basic safety knowledge is not evidenced");
  if (uniqueCategories <= 1 && total > 0) concerns.push("Cooking skills are limited to a single category — programme lacks breadth");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: CookingLifeSkillsResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Establish a structured cooking and life skills programme for all children", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (below(childrenEngagedRate, 60) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Extend cooking programme to include all children with age-appropriate activities", urgency: "soon", regulatory_ref: "SCCIF Independence" });
  }
  if (below(independenceRate, 30) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Focus on progression pathways to move children from assisted to independent cooking", urgency: "soon", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (below(childVoiceRate, 50) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Capture children's views and meal preferences as part of every cooking session", urgency: "planned", regulatory_ref: "SCCIF Voice of Child" });
  }
  if (uniqueCategories < 3 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Broaden the cooking curriculum to include budgeting, cultural cooking, and allergen awareness", urgency: "planned", regulatory_ref: "SCCIF Independence" });
  }
  if (below(hygieneCertRate, 20) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Introduce basic food hygiene certification for all children as a life skill milestone", urgency: "planned", regulatory_ref: "CHR 2015 Reg 9" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: CookingLifeSkillsResult["insights"] = [];

  if (meets(independenceRate, 60) && meets(childrenEngagedRate, 90) && uniqueCategories >= 6) {
    insights.push({ text: "Exemplary life skills programme — children are gaining real-world independence through cooking", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "Without cooking skills evidence, Ofsted will question how children are being prepared for adulthood", severity: "critical" });
  }
  if (below(independenceRate, 15) && total > 0) {
    insights.push({ text: "Low independence in cooking suggests over-reliance on staff — children need supported opportunities to lead", severity: "warning" });
  }
  if (meets(childVoiceRate, 80) && total > 0) {
    insights.push({ text: "Children's voices drive the cooking programme — meals reflect their culture, preferences and identity", severity: "positive" });
  }
  if (meets(hygieneCertRate, 50) && total > 0) {
    insights.push({ text: "Hygiene certification shows children understand food safety — a tangible achievement they can be proud of", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    cooking_rating: rating,
    cooking_score: score,
    headline,
    total_records: total,
    independence_rate: independenceRate,
    hygiene_certificate_rate: hygieneCertRate,
    child_voice_rate: childVoiceRate,
    recipe_success_rate: recipeSuccessRate,
    category_variety: uniqueCategories,
    children_engaged_rate: childrenEngagedRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
