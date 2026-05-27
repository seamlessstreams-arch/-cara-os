// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INDEPENDENCE & LIFE SKILLS INTELLIGENCE ENGINE
// Home-level: aggregates independence living assessments, cooking & baking,
// laundry & self-care, money management, and household tasks across all
// children to evaluate life skills readiness and development quality.
// CHR 2015 Reg 12: "Promoting independence."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface IndependenceAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;
  next_assessment_due: string;
  overall_readiness: string; // "not_ready" | "emerging" | "developing" | "competent" | "independent"
  child_agreed: boolean;
  domain_assessment_count: number;
  child_aspirations_present: boolean;
  child_worries_count: number;
  priority_skills_count: number;
  resources_allocated_count: number;
}

export interface CookingInput {
  id: string;
  child_id: string;
  recorded_date: string;
  review_date: string;
  competency_level: string; // "observer" | "assisted" | "supervised" | "independent" | "teaching_others"
  hygiene_certificate: boolean;
  led_family_meal: boolean;
  child_voice_present: boolean;
  recipes_attempted_count: number;
  cuisines_explored: string[];
}

export interface LaundryInput {
  id: string;
  child_id: string;
  recorded_date: string;
  review_date: string;
  overall_stage: string; // "full_support" | "learning_steps" | "supervised" | "independent" | "mastered"
  owns_basket: boolean;
  knows_care_symbols: boolean;
  iron_competent: boolean;
  child_voice_present: boolean;
}

export interface MoneyInput {
  id: string;
  child_id: string;
  recorded_date: string;
  review_date: string;
  competency: string; // "not_started" | "learning" | "practising" | "confident" | "independent"
  real_world_application_count: number;
  child_voice_present: boolean;
}

export interface HouseholdTaskInput {
  id: string;
  child_id: string;
  reviewed_date: string;
  support_level: string; // "full_support" | "moderate_support" | "light_support" | "independent" | "role_model"
  child_chose: boolean;
  completion_recent: number; // 0-100
  child_voice_present: boolean;
}

export interface HomeIndependenceLifeSkillsInput {
  today: string;
  independence_assessments: IndependenceAssessmentInput[];
  cooking_records: CookingInput[];
  laundry_records: LaundryInput[];
  money_records: MoneyInput[];
  household_tasks: HouseholdTaskInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type IndependenceLifeSkillsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AssessmentSummary {
  total_assessments: number;
  child_coverage: number;
  competent_or_independent_rate: number;
  child_agreed_rate: number;
  overdue_assessments: number;
}

export interface CookingSummary {
  total_records: number;
  child_coverage: number;
  independent_or_teaching_rate: number;
  hygiene_certificate_rate: number;
  led_family_meal_rate: number;
  child_voice_rate: number;
}

export interface LaundrySummary {
  total_records: number;
  child_coverage: number;
  independent_or_mastered_rate: number;
  owns_basket_rate: number;
  knows_care_symbols_rate: number;
  iron_competent_rate: number;
}

export interface MoneySummary {
  total_records: number;
  child_coverage: number;
  confident_or_independent_rate: number;
  real_world_application_rate: number;
  child_voice_rate: number;
}

export interface HouseholdSummary {
  total_tasks: number;
  child_coverage: number;
  avg_completion: number;
  child_chose_rate: number;
  independent_or_role_model_rate: number;
}

export interface HomeIndependenceLifeSkillsResult {
  independence_rating: IndependenceLifeSkillsRating;
  independence_score: number;
  headline: string;
  assessments: AssessmentSummary;
  cooking: CookingSummary;
  laundry: LaundrySummary;
  money: MoneySummary;
  household: HouseholdSummary;
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

export function computeHomeIndependenceLifeSkills(
  input: HomeIndependenceLifeSkillsInput,
): HomeIndependenceLifeSkillsResult {
  const {
    today, independence_assessments, cooking_records, laundry_records,
    money_records, household_tasks, total_children,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (
    total_children === 0 &&
    independence_assessments.length === 0 &&
    cooking_records.length === 0 &&
    laundry_records.length === 0 &&
    money_records.length === 0 &&
    household_tasks.length === 0
  ) {
    return {
      independence_rating: "insufficient_data",
      independence_score: 0,
      headline: "No independence and life skills data available for analysis.",
      assessments: { total_assessments: 0, child_coverage: 0, competent_or_independent_rate: 0, child_agreed_rate: 0, overdue_assessments: 0 },
      cooking: { total_records: 0, child_coverage: 0, independent_or_teaching_rate: 0, hygiene_certificate_rate: 0, led_family_meal_rate: 0, child_voice_rate: 0 },
      laundry: { total_records: 0, child_coverage: 0, independent_or_mastered_rate: 0, owns_basket_rate: 0, knows_care_symbols_rate: 0, iron_competent_rate: 0 },
      money: { total_records: 0, child_coverage: 0, confident_or_independent_rate: 0, real_world_application_rate: 0, child_voice_rate: 0 },
      household: { total_tasks: 0, child_coverage: 0, avg_completion: 0, child_chose_rate: 0, independent_or_role_model_rate: 0 },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Independence Assessment analysis ─────────────────────────────────
  const iaChildIds = new Set(independence_assessments.map(a => a.child_id));
  const iaCoverage = pct(iaChildIds.size, total_children);
  const iaCompetentIndep = independence_assessments.filter(a =>
    a.overall_readiness === "competent" || a.overall_readiness === "independent",
  ).length;
  const iaCompetentIndepRate = pct(iaCompetentIndep, independence_assessments.length);
  const iaAgreed = independence_assessments.filter(a => a.child_agreed).length;
  const iaAgreedRate = pct(iaAgreed, independence_assessments.length);
  const iaOverdue = independence_assessments.filter(a => daysBetween(a.next_assessment_due, today) > 0).length;

  const assessments: AssessmentSummary = {
    total_assessments: independence_assessments.length,
    child_coverage: iaCoverage,
    competent_or_independent_rate: iaCompetentIndepRate,
    child_agreed_rate: iaAgreedRate,
    overdue_assessments: iaOverdue,
  };

  // ── Cooking & Baking analysis ────────────────────────────────────────
  const ckChildIds = new Set(cooking_records.map(r => r.child_id));
  const ckCoverage = pct(ckChildIds.size, total_children);
  const ckIndepTeach = cooking_records.filter(r =>
    r.competency_level === "independent" || r.competency_level === "teaching_others",
  ).length;
  const ckIndepTeachRate = pct(ckIndepTeach, cooking_records.length);
  const ckHygiene = cooking_records.filter(r => r.hygiene_certificate).length;
  const ckHygieneRate = pct(ckHygiene, cooking_records.length);
  const ckFamilyMeal = cooking_records.filter(r => r.led_family_meal).length;
  const ckFamilyMealRate = pct(ckFamilyMeal, cooking_records.length);
  const ckVoice = cooking_records.filter(r => r.child_voice_present).length;
  const ckVoiceRate = pct(ckVoice, cooking_records.length);

  const cooking: CookingSummary = {
    total_records: cooking_records.length,
    child_coverage: ckCoverage,
    independent_or_teaching_rate: ckIndepTeachRate,
    hygiene_certificate_rate: ckHygieneRate,
    led_family_meal_rate: ckFamilyMealRate,
    child_voice_rate: ckVoiceRate,
  };

  // ── Laundry & Self-Care analysis ─────────────────────────────────────
  const lyChildIds = new Set(laundry_records.map(r => r.child_id));
  const lyCoverage = pct(lyChildIds.size, total_children);
  const lyIndepMastered = laundry_records.filter(r =>
    r.overall_stage === "independent" || r.overall_stage === "mastered",
  ).length;
  const lyIndepMasteredRate = pct(lyIndepMastered, laundry_records.length);
  const lyBasket = laundry_records.filter(r => r.owns_basket).length;
  const lyBasketRate = pct(lyBasket, laundry_records.length);
  const lyCareSymbols = laundry_records.filter(r => r.knows_care_symbols).length;
  const lyCareSymbolsRate = pct(lyCareSymbols, laundry_records.length);
  const lyIron = laundry_records.filter(r => r.iron_competent).length;
  const lyIronRate = pct(lyIron, laundry_records.length);

  const laundry: LaundrySummary = {
    total_records: laundry_records.length,
    child_coverage: lyCoverage,
    independent_or_mastered_rate: lyIndepMasteredRate,
    owns_basket_rate: lyBasketRate,
    knows_care_symbols_rate: lyCareSymbolsRate,
    iron_competent_rate: lyIronRate,
  };

  // ── Money Management analysis ────────────────────────────────────────
  const mnChildIds = new Set(money_records.map(r => r.child_id));
  const mnCoverage = pct(mnChildIds.size, total_children);
  const mnConfIndep = money_records.filter(r =>
    r.competency === "confident" || r.competency === "independent",
  ).length;
  const mnConfIndepRate = pct(mnConfIndep, money_records.length);
  const mnRealWorld = money_records.filter(r => r.real_world_application_count > 0).length;
  const mnRealWorldRate = pct(mnRealWorld, money_records.length);
  const mnVoice = money_records.filter(r => r.child_voice_present).length;
  const mnVoiceRate = pct(mnVoice, money_records.length);

  const money: MoneySummary = {
    total_records: money_records.length,
    child_coverage: mnCoverage,
    confident_or_independent_rate: mnConfIndepRate,
    real_world_application_rate: mnRealWorldRate,
    child_voice_rate: mnVoiceRate,
  };

  // ── Household Task analysis ──────────────────────────────────────────
  const htChildIds = new Set(household_tasks.map(t => t.child_id));
  const htCoverage = pct(htChildIds.size, total_children);
  const htAvgCompletion = household_tasks.length > 0
    ? Math.round(household_tasks.reduce((s, t) => s + t.completion_recent, 0) / household_tasks.length)
    : 0;
  const htChose = household_tasks.filter(t => t.child_chose).length;
  const htChoseRate = pct(htChose, household_tasks.length);
  const htIndepRole = household_tasks.filter(t =>
    t.support_level === "independent" || t.support_level === "role_model",
  ).length;
  const htIndepRoleRate = pct(htIndepRole, household_tasks.length);

  const household: HouseholdSummary = {
    total_tasks: household_tasks.length,
    child_coverage: htCoverage,
    avg_completion: htAvgCompletion,
    child_chose_rate: htChoseRate,
    independent_or_role_model_rate: htIndepRoleRate,
  };

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 8 modifiers (max +28) -> max 80
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Mod 1: Independence Assessment Coverage & Quality (+-5) ─────────
  {
    let m = 0;
    if (independence_assessments.length > 0) {
      // Coverage
      if (iaCoverage >= 80) m += 2;
      else if (iaCoverage >= 50) m += 1;
      else m -= 1;

      // Readiness levels
      if (iaCompetentIndepRate >= 60) m += 1;
      else if (iaCompetentIndepRate < 20) m -= 1;

      // Child agreed
      if (iaAgreedRate >= 80) m += 1;
      else if (iaAgreedRate < 40) m -= 1;

      // Overdue penalties
      if (iaOverdue === 0) m += 1;
      else if (iaOverdue >= 3) m -= 2;
    } else {
      if (total_children >= 3) m -= 3;
    }
    score += Math.max(-5, Math.min(5, m));
  }

  // ── Mod 2: Cooking & Baking Skills (+-4) ────────────────────────────
  {
    let m = 0;
    if (cooking_records.length > 0) {
      // Coverage
      if (ckCoverage >= 80) m += 1;
      else if (ckCoverage < 40) m -= 1;

      // Competency progression
      if (ckIndepTeachRate >= 60) m += 1;
      else if (ckIndepTeachRate < 20) m -= 1;

      // Hygiene certificate
      if (ckHygieneRate >= 60) m += 1;
      else if (ckHygieneRate < 20) m -= 1;

      // Family meal
      if (ckFamilyMealRate >= 50) m += 1;
      else if (ckFamilyMealRate < 10) m -= 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 3: Laundry & Self-Care Progress (+-3) ──────────────────────
  {
    let m = 0;
    if (laundry_records.length > 0) {
      // Coverage
      if (lyCoverage >= 80) m += 1;
      else if (lyCoverage < 40) m -= 1;

      // Stage progression
      if (lyIndepMasteredRate >= 60) m += 1;
      else if (lyIndepMasteredRate < 20) m -= 1;

      // Knowledge markers: basket + care symbols + iron
      const knowledgeScore = (lyBasketRate >= 60 ? 1 : 0) + (lyCareSymbolsRate >= 60 ? 1 : 0) + (lyIronRate >= 60 ? 1 : 0);
      if (knowledgeScore >= 2) m += 1;
      else if (knowledgeScore === 0) m -= 1;
    } else {
      if (total_children >= 2) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 4: Money Management Skills (+-4) ────────────────────────────
  {
    let m = 0;
    if (money_records.length > 0) {
      // Coverage
      if (mnCoverage >= 80) m += 1;
      else if (mnCoverage < 40) m -= 1;

      // Competency
      if (mnConfIndepRate >= 60) m += 1;
      else if (mnConfIndepRate < 20) m -= 1;

      // Real-world application
      if (mnRealWorldRate >= 80) m += 1;
      else if (mnRealWorldRate < 30) m -= 1;

      // Child voice
      if (mnVoiceRate >= 80) m += 1;
      else if (mnVoiceRate < 30) m -= 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 5: Household Task Engagement (+-3) ──────────────────────────
  {
    let m = 0;
    if (household_tasks.length > 0) {
      // Completion average
      if (htAvgCompletion >= 80) m += 1;
      else if (htAvgCompletion < 40) m -= 1;

      // Child chose
      if (htChoseRate >= 70) m += 1;
      else if (htChoseRate < 30) m -= 1;

      // Independence level
      if (htIndepRoleRate >= 60) m += 1;
      else if (htIndepRoleRate < 20) m -= 1;
    } else {
      if (total_children >= 2) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 6: Child Voice Across Life Skills (+-3) ─────────────────────
  {
    let m = 0;
    const voiceSources: number[] = [];
    if (independence_assessments.length > 0) voiceSources.push(iaAgreedRate);
    if (cooking_records.length > 0) voiceSources.push(ckVoiceRate);
    if (laundry_records.length > 0) {
      const lyVoice = laundry_records.filter(r => r.child_voice_present).length;
      const lyVoiceRate = pct(lyVoice, laundry_records.length);
      voiceSources.push(lyVoiceRate);
    }
    if (money_records.length > 0) voiceSources.push(mnVoiceRate);
    if (household_tasks.length > 0) {
      const htVoice = household_tasks.filter(t => t.child_voice_present).length;
      const htVoiceRate = pct(htVoice, household_tasks.length);
      voiceSources.push(htVoiceRate);
    }

    if (voiceSources.length > 0) {
      const avgVoice = Math.round(voiceSources.reduce((s, v) => s + v, 0) / voiceSources.length);
      if (avgVoice >= 90) m += 3;
      else if (avgVoice >= 70) m += 2;
      else if (avgVoice >= 50) m += 1;
      else if (avgVoice < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 7: Review Compliance (+-3) ──────────────────────────────────
  {
    let m = 0;
    let overdueCount = 0;
    let totalReviewable = 0;

    // Assessment overdue (next_assessment_due)
    overdueCount += iaOverdue;
    totalReviewable += independence_assessments.length;

    // Cooking review_date overdue
    const ckOverdue = cooking_records.filter(r => daysBetween(r.review_date, today) > 0).length;
    overdueCount += ckOverdue;
    totalReviewable += cooking_records.length;

    // Laundry review_date overdue
    const lyOverdue = laundry_records.filter(r => daysBetween(r.review_date, today) > 0).length;
    overdueCount += lyOverdue;
    totalReviewable += laundry_records.length;

    // Money review_date overdue
    const mnOverdue = money_records.filter(r => daysBetween(r.review_date, today) > 0).length;
    overdueCount += mnOverdue;
    totalReviewable += money_records.length;

    // Household reviewed_date: overdue if > 90 days ago
    const htOverdue = household_tasks.filter(t => daysBetween(t.reviewed_date, today) > 90).length;
    overdueCount += htOverdue;
    totalReviewable += household_tasks.length;

    if (totalReviewable > 0) {
      if (overdueCount === 0) m += 3;
      else if (overdueCount <= 2) m += 1;
      else if (overdueCount >= 5) m -= 3;
      else m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 8: Skill Breadth & Diversity (+-3) ──────────────────────────
  {
    let m = 0;
    // Count distinct domains with data
    let domainsWithData = 0;
    if (independence_assessments.length > 0) domainsWithData++;
    if (cooking_records.length > 0) domainsWithData++;
    if (laundry_records.length > 0) domainsWithData++;
    if (money_records.length > 0) domainsWithData++;
    if (household_tasks.length > 0) domainsWithData++;

    if (domainsWithData >= 5) m += 1;
    else if (domainsWithData <= 2) m -= 1;

    // Cuisines explored breadth
    const allCuisines = new Set(cooking_records.flatMap(r => r.cuisines_explored));
    if (allCuisines.size >= 4) m += 1;
    else if (cooking_records.length > 0 && allCuisines.size === 0) m -= 1;

    // Recipes attempted
    const totalRecipes = cooking_records.reduce((s, r) => s + r.recipes_attempted_count, 0);
    if (totalRecipes >= 10) m += 1;
    else if (cooking_records.length > 0 && totalRecipes === 0) m -= 1;
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Clamp ────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let independence_rating: IndependenceLifeSkillsRating;
  if (score >= 80) independence_rating = "outstanding";
  else if (score >= 65) independence_rating = "good";
  else if (score >= 45) independence_rating = "adequate";
  else independence_rating = "inadequate";

  // ══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: HomeIndependenceLifeSkillsResult["recommendations"] = [];
  const insights: HomeIndependenceLifeSkillsResult["insights"] = [];
  let rank = 0;

  // Independence assessments
  if (independence_assessments.length > 0 && iaCoverage >= 80 && iaOverdue === 0) {
    strengths.push(`Comprehensive independence assessment coverage — ${iaCoverage}% of children assessed with all reviews current.`);
  }
  if (independence_assessments.length > 0 && iaCompetentIndepRate >= 60) {
    strengths.push(`Strong readiness levels — ${iaCompetentIndepRate}% of assessments show competent or independent readiness.`);
  }
  if (independence_assessments.length > 0 && iaAgreedRate >= 80) {
    strengths.push(`Excellent child participation — ${iaAgreedRate}% of children agreed to their independence assessment.`);
  }
  if (iaOverdue >= 3) {
    concerns.push(`${iaOverdue} independence assessments are overdue — children may not have current transition plans.`);
    recommendations.push({ rank: ++rank, recommendation: "Schedule overdue independence assessments to ensure all children have current transition plans.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (independence_assessments.length === 0 && total_children >= 3) {
    concerns.push("No independence assessments in place — life skills readiness cannot be evidenced.");
    recommendations.push({ rank: ++rank, recommendation: "Implement independence living assessments for all children to evidence life skills development.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // Cooking
  if (cooking_records.length > 0 && ckIndepTeachRate >= 60) {
    strengths.push(`Strong cooking competency — ${ckIndepTeachRate}% of records show independent or teaching-others level.`);
  }
  if (cooking_records.length > 0 && ckHygieneRate >= 60) {
    strengths.push(`Good food hygiene awareness — ${ckHygieneRate}% hold hygiene certificates.`);
  }
  if (cooking_records.length === 0 && total_children >= 2) {
    concerns.push("No cooking and baking records — a key life skill is not being tracked.");
    recommendations.push({ rank: ++rank, recommendation: "Introduce cooking and baking skill tracking to develop independence in meal preparation.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (cooking_records.length > 0 && ckIndepTeachRate < 20) {
    concerns.push(`Low cooking independence — only ${ckIndepTeachRate}% of cooking records show independent competency.`);
  }

  // Laundry
  if (laundry_records.length > 0 && lyIndepMasteredRate >= 60) {
    strengths.push(`Good laundry and self-care skills — ${lyIndepMasteredRate}% at independent or mastered stage.`);
  }
  if (laundry_records.length === 0 && total_children >= 2) {
    concerns.push("No laundry and self-care records — basic self-care skills are not being tracked.");
  }

  // Money
  if (money_records.length > 0 && mnConfIndepRate >= 60) {
    strengths.push(`Strong money management — ${mnConfIndepRate}% of records show confident or independent competency.`);
  }
  if (money_records.length === 0 && total_children >= 2) {
    concerns.push("No money management records — financial literacy development is not being evidenced.");
    recommendations.push({ rank: ++rank, recommendation: "Implement money management tracking to develop children's financial independence.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (money_records.length > 0 && mnRealWorldRate < 30) {
    concerns.push(`Low real-world money application — only ${mnRealWorldRate}% of records show practical application.`);
  }

  // Household tasks
  if (household_tasks.length > 0 && htAvgCompletion >= 80 && htChoseRate >= 70) {
    strengths.push(`Excellent household task engagement — ${htAvgCompletion}% average completion with ${htChoseRate}% child-chosen.`);
  }
  if (household_tasks.length > 0 && htAvgCompletion < 40) {
    concerns.push(`Low household task completion — average only ${htAvgCompletion}%.`);
    recommendations.push({ rank: ++rank, recommendation: "Review household task expectations and motivation strategies — completion rates are low.", urgency: "soon", regulatory_ref: null });
  }

  // ── ARIA Insights ────────────────────────────────────────────────────
  // Cross-domain skill gaps
  if (independence_assessments.length > 0) {
    const notReady = independence_assessments.filter(a => a.overall_readiness === "not_ready").length;
    const notReadyRate = pct(notReady, independence_assessments.length);
    if (notReadyRate >= 40) {
      insights.push({ text: `${notReadyRate}% of children assessed as not ready for independent living — review support intensity and skill-building programmes.`, severity: "warning" });
    }
  }

  if (cooking_records.length > 0 && ckFamilyMealRate >= 50 && ckHygieneRate >= 60) {
    insights.push({ text: "Children are leading family meals and hold hygiene certificates — outstanding practical cooking development.", severity: "positive" });
  }

  const allCuisinesInsight = new Set(cooking_records.flatMap(r => r.cuisines_explored));
  if (allCuisinesInsight.size >= 6) {
    insights.push({ text: `Children have explored ${allCuisinesInsight.size} different cuisines — excellent cultural breadth in cooking education.`, severity: "positive" });
  }

  if (money_records.length > 0 && mnRealWorldRate >= 80 && mnConfIndepRate >= 60) {
    insights.push({ text: `Strong money management with ${mnRealWorldRate}% real-world application — children are developing practical financial independence.`, severity: "positive" });
  }

  if (household_tasks.length > 0 && htChoseRate >= 80 && htIndepRoleRate >= 60) {
    insights.push({ text: "Children are choosing their own household tasks and performing independently — excellent ownership of daily living skills.", severity: "positive" });
  }

  // ── Headline ─────────────────────────────────────────────────────────
  let headline: string;
  if (independence_rating === "outstanding") {
    headline = "Life skills development is comprehensive and child-led across all domains.";
  } else if (independence_rating === "good") {
    headline = "Good life skills foundations with opportunities to strengthen specific domains.";
  } else if (independence_rating === "adequate") {
    headline = "Life skills development is progressing but coverage gaps and compliance issues need attention.";
  } else {
    headline = "Significant life skills gaps — children may not be developing the independence they need for transition.";
  }

  return {
    independence_rating,
    independence_score: score,
    headline,
    assessments,
    cooking,
    laundry,
    money,
    household,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
