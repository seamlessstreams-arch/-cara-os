// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BSP EFFECTIVENESS INTELLIGENCE ENGINE
// Cross-cutting analysis: behaviour support plans × behaviour log × restraints.
// Assesses BSP quality, currency, whether strategies are being used in practice,
// and whether restrictive practice is reducing for children with BSPs.
// CHR 2015 Reg 19 (Behaviour management), Reg 20 (Restraint and deprivation
// of liberty). SCCIF: "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

import { above, below, meets, rate } from "@/lib/metrics/rate";

export interface BSPPlanInput {
  id: string;
  child_id: string;
  status: string; // active | under_review | draft | archived | suspended
  review_date: string;
  last_reviewed: string | null;
  triggers_count: number;
  strategies_count: number;
  effective_strategies: number; // "highly_effective" + "effective"
  de_escalation_stages: number;
  has_child_views: boolean;
  has_professional_input: boolean;
  has_safety_plan: boolean;
  staff_guidance_count: number;
  review_count: number;
}

export interface BSPBehaviourInput {
  id: string;
  child_id: string;
  date: string;
  direction: string; // positive | concerning
  intensity: string; // low | medium | high | severe
  has_strategy_used: boolean;
}

export interface BSPRestraintInput {
  id: string;
  child_id: string;
  date: string;
  de_escalation_count: number;
  child_debriefed: boolean;
}

export interface HomeBSPEffectivenessInput {
  today: string;
  plans: BSPPlanInput[];
  behaviour_entries: BSPBehaviourInput[];
  restraints: BSPRestraintInput[];
  total_children: number;
}

// ── Result Types ────────────────────────────────────────────────────────────

export type BSPEffectivenessRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PlanQualityProfile {
  total_active: number;
  total_inactive: number;
  avg_triggers: number;
  avg_strategies: number;
  /** null when the population is empty — nothing measured, not 0%. */
  strategy_effectiveness_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_voice_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  professional_input_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safety_plan_rate: number | null;
  avg_de_escalation_stages: number;
  avg_guidance_points: number;
}

export interface CurrencyProfile {
  overdue_reviews: number;
  upcoming_reviews: number;
  avg_days_since_review: number;
  review_depth: number;
}

export interface BSPBehaviourProfile {
  total_entries: number;
  positive_count: number;
  concerning_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positive_rate: number | null;
  high_intensity_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  high_intensity_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  strategy_usage_rate: number | null;
}

export interface BSPRestraintProfile {
  total_restraints: number;
  avg_de_escalation: number;
  /** null when the population is empty — nothing measured, not 0%. */
  debrief_rate: number | null;
}

export interface BSPCoverageProfile {
  total_children: number;
  children_with_active_bsp: number;
  children_with_concerning_no_bsp: number;
  /** null when the population is empty — nothing measured, not 0%. */
  coverage_rate: number | null;
}

export interface BSPRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref?: string;
}

export interface BSPInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HomeBSPEffectivenessResult {
  bsp_score: number;
  bsp_rating: BSPEffectivenessRating;
  headline: string;

  plan_quality: PlanQualityProfile;
  currency: CurrencyProfile;
  behaviour: BSPBehaviourProfile;
  restraint: BSPRestraintProfile;
  coverage: BSPCoverageProfile;

  strengths: string[];
  concerns: string[];
  recommendations: BSPRecommendation[];
  insights: BSPInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Was `d === 0 ? 0 : …`: nothing recorded read as 0%, not as unmeasured.
function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function ratingFromScore(score: number): BSPEffectivenessRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeBSPEffectiveness(
  input: HomeBSPEffectivenessInput,
): HomeBSPEffectivenessResult {
  const { today, plans, behaviour_entries, restraints, total_children } = input;

  // ── Insufficient data ────────────────────────────────────────────────────
  if (total_children === 0) {
    return emptyResult();
  }

  // ── Active plans ─────────────────────────────────────────────────────────
  const activePlans = plans.filter(
    (p) => p.status === "active" || p.status === "under_review",
  );
  const inactivePlans = plans.filter(
    (p) => p.status !== "active" && p.status !== "under_review",
  );

  const bspChildIds = new Set(activePlans.map((p) => p.child_id));

  // ── Plan Quality Profile ─────────────────────────────────────────────────
  const planQuality: PlanQualityProfile = {
    total_active: activePlans.length,
    total_inactive: inactivePlans.length,
    avg_triggers: avg(activePlans.map((p) => p.triggers_count)),
    avg_strategies: avg(activePlans.map((p) => p.strategies_count)),
    strategy_effectiveness_rate: rate(
      activePlans.reduce((s, p) => s + p.effective_strategies, 0),
      activePlans.reduce((s, p) => s + p.strategies_count, 0),
    ),
    child_voice_rate: rate(
      activePlans.filter((p) => p.has_child_views).length,
      activePlans.length,
    ),
    professional_input_rate: rate(
      activePlans.filter((p) => p.has_professional_input).length,
      activePlans.length,
    ),
    safety_plan_rate: rate(
      activePlans.filter((p) => p.has_safety_plan).length,
      activePlans.length,
    ),
    avg_de_escalation_stages: avg(
      activePlans.map((p) => p.de_escalation_stages),
    ),
    avg_guidance_points: avg(activePlans.map((p) => p.staff_guidance_count)),
  };

  // ── Currency Profile ─────────────────────────────────────────────────────
  const overdueReviews = activePlans.filter(
    (p) => p.review_date < today,
  ).length;
  const upcomingReviews = activePlans.filter((p) => {
    const daysUntil = daysBetween(today, p.review_date);
    return daysUntil >= 0 && daysUntil <= 14;
  }).length;

  const reviewedPlans = activePlans.filter((p) => p.last_reviewed !== null);
  const daysSinceReviewValues = reviewedPlans.map((p) =>
    daysBetween(p.last_reviewed!, today),
  );

  const currency: CurrencyProfile = {
    overdue_reviews: overdueReviews,
    upcoming_reviews: upcomingReviews,
    avg_days_since_review: avg(daysSinceReviewValues),
    review_depth: avg(activePlans.map((p) => p.review_count)),
  };

  // ── Behaviour Profile (BSP children only) ────────────────────────────────
  const bspBeh = behaviour_entries.filter((b) => bspChildIds.has(b.child_id));
  const bspPositive = bspBeh.filter((b) => b.direction === "positive");
  const bspConcerning = bspBeh.filter((b) => b.direction === "concerning");
  const bspHighIntensity = bspConcerning.filter(
    (b) => b.intensity === "high" || b.intensity === "severe",
  );
  const bspWithStrategy = bspConcerning.filter((b) => b.has_strategy_used);

  const behaviour: BSPBehaviourProfile = {
    total_entries: bspBeh.length,
    positive_count: bspPositive.length,
    concerning_count: bspConcerning.length,
    positive_rate: rate(bspPositive.length, bspBeh.length),
    high_intensity_count: bspHighIntensity.length,
    high_intensity_rate: rate(bspHighIntensity.length, bspConcerning.length),
    strategy_usage_rate: rate(bspWithStrategy.length, bspConcerning.length),
  };

  // ── Restraint Profile (BSP children only) ────────────────────────────────
  const bspRestraints = restraints.filter((r) => bspChildIds.has(r.child_id));
  const restraintProfile: BSPRestraintProfile = {
    total_restraints: bspRestraints.length,
    avg_de_escalation: avg(bspRestraints.map((r) => r.de_escalation_count)),
    debrief_rate: rate(
      bspRestraints.filter((r) => r.child_debriefed).length,
      bspRestraints.length,
    ),
  };

  // ── Coverage Profile ─────────────────────────────────────────────────────
  const allConcerningChildIds = new Set(
    behaviour_entries
      .filter((b) => b.direction === "concerning")
      .map((b) => b.child_id),
  );
  const childrenWithConcerningNoBSP = [...allConcerningChildIds].filter(
    (cid) => !bspChildIds.has(cid),
  ).length;

  const childrenNeedingBSP = allConcerningChildIds.size; // all children with concerning behaviour
  const childrenCovered = [...allConcerningChildIds].filter((cid) =>
    bspChildIds.has(cid),
  ).length;

  const coverageProfile: BSPCoverageProfile = {
    total_children,
    children_with_active_bsp: bspChildIds.size,
    children_with_concerning_no_bsp: childrenWithConcerningNoBSP,
    coverage_rate: rate(childrenCovered, childrenNeedingBSP),
  };

  // ── Scoring (base 52, max bonuses 28 = 80 for outstanding) ───────────────
  const BASE = 52;
  let bonuses = 0;

  // Modifier 1: Strategy effectiveness (±4)
  if (activePlans.length === 0) {
    // no plans → neutral
  } else if (meets(planQuality.strategy_effectiveness_rate, 80)) {
    bonuses += 4;
  } else if (meets(planQuality.strategy_effectiveness_rate, 60)) {
    bonuses += 2;
  } else if (meets(planQuality.strategy_effectiveness_rate, 40)) {
    // +0
  } else {
    bonuses -= 3;
  }

  // Modifier 2: Review currency (±3)
  if (activePlans.length === 0) {
    // neutral
  } else {
    const overdueRate = rate(overdueReviews, activePlans.length);
    if (overdueReviews === 0) {
      bonuses += 3;
    } else if ((overdueRate !== null && overdueRate <= 25)) {
      bonuses += 1;
    } else if ((overdueRate !== null && overdueRate <= 50)) {
      // +0
    } else {
      bonuses -= 2;
    }
  }

  // Modifier 3: Child voice (±4)
  if (activePlans.length === 0) {
    // neutral
  } else if (meets(planQuality.child_voice_rate, 90)) {
    bonuses += 4;
  } else if (meets(planQuality.child_voice_rate, 70)) {
    bonuses += 2;
  } else if (meets(planQuality.child_voice_rate, 50)) {
    // +0
  } else {
    bonuses -= 3;
  }

  // Modifier 4: Professional input (±3)
  if (activePlans.length === 0) {
    // neutral
  } else if (meets(planQuality.professional_input_rate, 80)) {
    bonuses += 3;
  } else if (meets(planQuality.professional_input_rate, 50)) {
    bonuses += 1;
  } else if (meets(planQuality.professional_input_rate, 30)) {
    // +0
  } else {
    bonuses -= 2;
  }

  // Modifier 5: Strategy usage in practice (±4)
  if (bspConcerning.length === 0) {
    // no concerning behaviour for BSP children → excellent
    bonuses += 4;
  } else if (meets(behaviour.strategy_usage_rate, 80)) {
    bonuses += 4;
  } else if (meets(behaviour.strategy_usage_rate, 60)) {
    bonuses += 2;
  } else if (meets(behaviour.strategy_usage_rate, 40)) {
    // +0
  } else {
    bonuses -= 3;
  }

  // Modifier 6: Positive behaviour rate for BSP children (±3)
  if (bspBeh.length === 0) {
    // no data → neutral
  } else if (meets(behaviour.positive_rate, 70)) {
    bonuses += 3;
  } else if (meets(behaviour.positive_rate, 50)) {
    bonuses += 1;
  } else if (meets(behaviour.positive_rate, 30)) {
    // +0
  } else {
    bonuses -= 2;
  }

  // Modifier 7: Restraint alignment (±4)
  if (bspRestraints.length === 0) {
    bonuses += 4;
  } else if (meets(restraintProfile.debrief_rate, 90)) {
    bonuses += 2;
  } else if (meets(restraintProfile.debrief_rate, 60)) {
    // +0
  } else if (meets(restraintProfile.debrief_rate, 40)) {
    bonuses -= 1;
  } else {
    bonuses -= 3;
  }

  // Modifier 8: BSP coverage (±3)
  if (childrenNeedingBSP === 0) {
    // no concerning behaviour → full coverage
    bonuses += 3;
  } else if (meets(coverageProfile.coverage_rate, 100)) {
    bonuses += 3;
  } else if (meets(coverageProfile.coverage_rate, 75)) {
    bonuses += 1;
  } else if (meets(coverageProfile.coverage_rate, 50)) {
    // +0
  } else {
    bonuses -= 2;
  }

  const score = Math.max(0, Math.min(100, BASE + bonuses));
  const rating = ratingFromScore(score);

  // ── Headline ─────────────────────────────────────────────────────────────
  const headline = buildHeadline(rating, activePlans.length, behaviour, coverageProfile);

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (activePlans.length > 0 && meets(planQuality.child_voice_rate, 90))
    strengths.push(
      "Excellent child voice — all BSPs capture the child's own perspective on their behaviour and strategies.",
    );
  if (activePlans.length > 0 && meets(planQuality.strategy_effectiveness_rate, 80))
    strengths.push(
      "High strategy effectiveness — positive strategies within BSPs are rated as effective or highly effective.",
    );
  if (overdueReviews === 0 && activePlans.length > 0)
    strengths.push(
      "All BSP reviews are current — no overdue reviews, demonstrating proactive management oversight.",
    );
  if (bspConcerning.length > 0 && meets(behaviour.strategy_usage_rate, 80))
    strengths.push(
      "Staff consistently record strategy use during concerning behaviour, evidencing BSP adherence in practice.",
    );
  if (bspRestraints.length === 0 && bspChildIds.size > 0)
    strengths.push(
      "No physical interventions for children with BSPs — plans appear to be reducing restrictive practice effectively.",
    );
  if (meets(planQuality.safety_plan_rate, 90) && activePlans.length > 0)
    strengths.push(
      "All BSPs include robust safety plans for high-risk scenarios.",
    );
  if (planQuality.avg_de_escalation_stages >= 3)
    strengths.push(
      "BSPs include comprehensive de-escalation staging (green/amber/red), giving staff clear graduated responses.",
    );

  // ── Concerns ─────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (childrenWithConcerningNoBSP > 0)
    concerns.push(
      `${childrenWithConcerningNoBSP} child${childrenWithConcerningNoBSP > 1 ? "ren" : ""} with concerning behaviour ${childrenWithConcerningNoBSP > 1 ? "have" : "has"} no active BSP — coverage gap identified.`,
    );
  if (overdueReviews > 0)
    concerns.push(
      `${overdueReviews} BSP review${overdueReviews > 1 ? "s are" : " is"} overdue — plans may not reflect current needs.`,
    );
  if (
    bspRestraints.length > 0 &&
    below(restraintProfile.debrief_rate, 70)
  )
    concerns.push(
      `Child debrief rate following restraint is ${restraintProfile.debrief_rate}% for BSP children — below 70% threshold.`,
    );
  if (
    bspConcerning.length > 0 &&
    below(behaviour.strategy_usage_rate, 60)
  )
    concerns.push(
      `Strategy usage is only ${behaviour.strategy_usage_rate}% during concerning behaviour — BSP strategies may not be embedded in practice.`,
    );
  if (
    bspConcerning.length > 0 &&
    above(behaviour.high_intensity_rate, 40)
  )
    concerns.push(
      `${behaviour.high_intensity_rate}% of concerning behaviour for BSP children is high intensity or severe — plans may need strengthening.`,
    );
  if (below(planQuality.professional_input_rate, 50) && activePlans.length > 0)
    concerns.push(
      `Only ${planQuality.professional_input_rate}% of BSPs have professional input — consider requesting specialist guidance.`,
    );

  // ── Recommendations ──────────────────────────────────────────────────────
  const recommendations: BSPRecommendation[] = [];
  let rank = 0;

  if (childrenWithConcerningNoBSP > 0)
    recommendations.push({
      rank: ++rank,
      recommendation: `Develop BSPs for ${childrenWithConcerningNoBSP} child${childrenWithConcerningNoBSP > 1 ? "ren" : ""} with concerning behaviour but no active plan. Involve the child and key professionals.`,
      urgency: "soon",
      regulatory_ref: "Reg 19",
    });

  if (overdueReviews > 0)
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete ${overdueReviews} overdue BSP review${overdueReviews > 1 ? "s" : ""} urgently to ensure plans reflect current triggers, strategies and progress.`,
      urgency: "immediate",
      regulatory_ref: "Reg 19",
    });

  if (
    bspRestraints.length > 0 &&
    below(restraintProfile.debrief_rate, 90)
  )
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children with BSPs are debriefed following every restraint, using their BSP debrief guidance. Update BSPs with any new triggers identified.",
      urgency: "immediate",
      regulatory_ref: "Reg 20",
    });

  if (
    bspConcerning.length > 0 &&
    below(behaviour.strategy_usage_rate, 80)
  )
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reinforce with staff the importance of recording which BSP strategy was used during each concerning behaviour entry. This evidence demonstrates BSP adherence.",
      urgency: "soon",
      regulatory_ref: "Reg 19",
    });

  if (below(planQuality.professional_input_rate, 80) && activePlans.length > 0)
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Request professional input (CAMHS, EP, social worker) for BSPs lacking specialist guidance to strengthen evidence base and strategy quality.",
      urgency: "planned",
      regulatory_ref: "Reg 19",
    });

  if (below(behaviour.positive_rate, 50) && bspBeh.length > 0)
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase recording of positive behaviour for BSP children. Ensure strengths-based entries are captured to evidence progress and build therapeutic relationships.",
      urgency: "planned",
      regulatory_ref: "Reg 19",
    });

  // ── Insights ─────────────────────────────────────────────────────────────
  const insights: BSPInsight[] = [];

  if (
    activePlans.length > 0 &&
    bspConcerning.length > 0 &&
    meets(behaviour.strategy_usage_rate, 80)
  )
    insights.push({
      text: `Staff are recording BSP strategy use in ${behaviour.strategy_usage_rate}% of concerning entries — this demonstrates strong BSP-to-practice alignment and would evidence Reg 19 compliance to an inspector.`,
      severity: "positive",
    });

  if (
    bspRestraints.length > 0 &&
    activePlans.length > 0
  ) {
    const restraintRate = Math.round(
      (bspRestraints.length / bspChildIds.size) * 10,
    ) / 10;
    if (restraintRate > 1) {
      insights.push({
        text: `BSP children average ${restraintRate} restraints each — review whether BSPs need strengthening or whether restraint thresholds need re-evaluating.`,
        severity: "warning",
      });
    }
  }

  if (childrenWithConcerningNoBSP > 0)
    insights.push({
      text: `Coverage gap: ${childrenWithConcerningNoBSP} child${childrenWithConcerningNoBSP > 1 ? "ren display" : " displays"} concerning behaviour without a BSP. An inspector would expect every child with a pattern of concerning behaviour to have a BSP in place.`,
      severity: "warning",
    });

  if (
    activePlans.length > 0 &&
    planQuality.avg_de_escalation_stages >= 3 &&
    meets(planQuality.safety_plan_rate, 90)
  )
    insights.push({
      text: "BSP quality is strong — comprehensive de-escalation staging and safety planning demonstrates a robust, therapeutically informed approach to behaviour management.",
      severity: "positive",
    });

  if (
    bspBeh.length > 0 &&
    meets(behaviour.positive_rate, 60)
  )
    insights.push({
      text: `${behaviour.positive_rate}% of behaviour entries for BSP children are positive — indicating strategies may be working and the therapeutic relationship is intact.`,
      severity: "positive",
    });

  if (
    bspConcerning.length > 0 &&
    above(behaviour.high_intensity_rate, 50)
  )
    insights.push({
      text: `Over half of concerning behaviour for BSP children is high intensity or severe. Consider requesting a multi-disciplinary review of BSP strategies and trigger management.`,
      severity: "critical",
    });

  return {
    bsp_score: score,
    bsp_rating: rating,
    headline,
    plan_quality: planQuality,
    currency,
    behaviour,
    restraint: restraintProfile,
    coverage: coverageProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

// ── Empty Result ────────────────────────────────────────────────────────────

function emptyResult(): HomeBSPEffectivenessResult {
  return {
    bsp_score: 0,
    bsp_rating: "insufficient_data",
    headline: "No children in placement — BSP effectiveness cannot be assessed.",
    plan_quality: {
      total_active: 0,
      total_inactive: 0,
      avg_triggers: 0,
      avg_strategies: 0,
      strategy_effectiveness_rate: null,
      child_voice_rate: null,
      professional_input_rate: null,
      safety_plan_rate: null,
      avg_de_escalation_stages: 0,
      avg_guidance_points: 0,
    },
    currency: {
      overdue_reviews: 0,
      upcoming_reviews: 0,
      avg_days_since_review: 0,
      review_depth: 0,
    },
    behaviour: {
      total_entries: 0,
      positive_count: 0,
      concerning_count: 0,
      positive_rate: null,
      high_intensity_count: 0,
      high_intensity_rate: null,
      strategy_usage_rate: null,
    },
    restraint: {
      total_restraints: 0,
      avg_de_escalation: 0,
      debrief_rate: null,
    },
    coverage: {
      total_children: 0,
      children_with_active_bsp: 0,
      children_with_concerning_no_bsp: 0,
      coverage_rate: null,
    },
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Headline Builder ────────────────────────────────────────────────────────

function buildHeadline(
  rating: BSPEffectivenessRating,
  activePlanCount: number,
  beh: BSPBehaviourProfile,
  cov: BSPCoverageProfile,
): string {
  switch (rating) {
    case "outstanding":
      return `BSPs are highly effective — ${activePlanCount} active plan${activePlanCount > 1 ? "s" : ""} with strong strategy adherence and positive behaviour trends.`;
    case "good":
      return `BSPs are working well — ${activePlanCount} active plan${activePlanCount > 1 ? "s" : ""} with good strategy use${cov.children_with_concerning_no_bsp > 0 ? `, though ${cov.children_with_concerning_no_bsp} coverage gap${cov.children_with_concerning_no_bsp > 1 ? "s" : ""} noted` : ""}.`;
    case "adequate":
      return `BSP effectiveness is adequate — ${activePlanCount} active plan${activePlanCount > 1 ? "s" : ""} but improvements needed in ${below(beh.strategy_usage_rate, 60) ? "strategy adherence" : "coverage and review currency"}.`;
    case "inadequate":
      return `BSP effectiveness is inadequate — significant gaps in ${activePlanCount === 0 ? "BSP coverage" : "plan quality, strategy use, or review currency"} require urgent attention.`;
    default:
      return "Insufficient data to assess BSP effectiveness.";
  }
}
