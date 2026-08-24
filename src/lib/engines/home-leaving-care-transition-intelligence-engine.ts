// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LEAVING CARE / TRANSITION INTELLIGENCE ENGINE
// Pure deterministic engine: pathway plan coverage, goal achievement,
// aspiration engagement, independent travel readiness, financial readiness,
// and pathway plan quality for children approaching independence.
// CHR 2015 Reg 5: "Engaging children in their own care planning."
// Children (Leaving Care) Act 2000: Pathway plans and support entitlements.
// SCCIF: "Children are well prepared for adulthood."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TransitionGoalInput {
  id: string;
  child_id: string;
  area: string; // "independent_living" | "education_employment" | "financial" | "health_wellbeing" | "housing" | "relationships" | "legal_rights" | "identity"
  status: string; // "not_started" | "in_progress" | "on_track" | "at_risk" | "achieved" | "paused"
  percent_complete: number; // 0-100
  has_review_date: boolean;
}

export interface PathwayPlanInput {
  id: string;
  child_id: string;
  status: string; // "active_16_18" | "active_18_plus" | "draft" | "expired"
  has_personal_advisor: boolean;
  has_accommodation_plan: boolean;
  has_eet_plan: boolean; // education, employment, training
  last_review_within_6_months: boolean;
}

export interface AspirationInput {
  id: string;
  child_id: string;
  child_chose: boolean;
  has_steps_taken: boolean;
  has_support_identified: boolean;
}

export interface IndependentTravelInput {
  id: string;
  child_id: string;
  routes_mastered: number;
  routes_learning: number;
  has_travel_card: boolean;
  has_safety_plan: boolean;
}

export interface LeavingCarePackageInput {
  id: string;
  child_id: string;
  has_junior_isa: boolean;
  savings_on_track: boolean;
  setting_up_home_allowance_confirmed: boolean;
  financial_literacy_progressing: boolean;
}

export interface LeavingCareTransitionInput {
  today: string;
  total_children: number;
  transition_goals: TransitionGoalInput[];
  pathway_plans: PathwayPlanInput[];
  aspirations: AspirationInput[];
  independent_travel: IndependentTravelInput[];
  leaving_care_packages: LeavingCarePackageInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type LeavingCareRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface LeavingCareResult {
  leaving_care_rating: LeavingCareRating;
  leaving_care_score: number;
  headline: string;
  children_with_pathway_plans: number;
  /** null when the population is empty — nothing measured, not 0%. */
  goal_achievement_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  aspiration_recording_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  travel_readiness_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  financial_readiness_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ratingFromScore(score: number): LeavingCareRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeLeavingCareTransition(
  input: LeavingCareTransitionInput,
): LeavingCareResult {
  const {
    total_children,
    transition_goals,
    pathway_plans,
    aspirations,
    independent_travel,
    leaving_care_packages,
  } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0) {
    return {
      leaving_care_rating: "insufficient_data",
      leaving_care_score: 0,
      headline: "No children registered — unable to assess leaving care readiness.",
      children_with_pathway_plans: 0,
      goal_achievement_rate: null,
      aspiration_recording_rate: null,
      travel_readiness_rate: null,
      financial_readiness_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metric: Pathway plan coverage (Mod 1) ────────────────────────────
  // Real PathwayPlanStatus 18+ value is "active_18plus_formerly_looked_after"
  // (NOT "active_18_plus") — using the wrong literal dropped every 18-25
  // former-relevant care leaver from coverage/quality.
  const activePlanStatuses = ["active_16_18", "active_18plus_formerly_looked_after"];
  const activePlans = pathway_plans.filter((p) =>
    activePlanStatuses.includes(p.status),
  );
  const childrenWithActivePlans = new Set(
    activePlans.map((p) => p.child_id),
  ).size;
  const pathwayCoverageRate = rate(childrenWithActivePlans, total_children);

  const mod1 =
    meets(pathwayCoverageRate, 80) ? 5 :
    meets(pathwayCoverageRate, 50) ? 2 :
    meets(pathwayCoverageRate, 30) ? 0 : -5;

  // ── Metric: Goal achievement (Mod 2) ─────────────────────────────────
  const achievedOrOnTrack = transition_goals.filter(
    (g) => g.status === "achieved" || g.status === "on_track",
  ).length;
  const goalAchievementRate = rate(achievedOrOnTrack, transition_goals.length);

  const mod2 =
    meets(goalAchievementRate, 75) ? 6 :
    meets(goalAchievementRate, 50) ? 3 :
    meets(goalAchievementRate, 30) ? 0 : -5;

  // ── Metric: Aspiration engagement (Mod 3) ─────────────────────────────
  const engagedAspirations = aspirations.filter(
    (a) => a.child_chose && a.has_steps_taken,
  ).length;
  const aspirationEngagementRate = rate(engagedAspirations, aspirations.length);

  const mod3 =
    meets(aspirationEngagementRate, 80) ? 5 :
    meets(aspirationEngagementRate, 50) ? 2 :
    meets(aspirationEngagementRate, 30) ? 0 : -5;

  // ── Metric: Travel readiness (Mod 4) ──────────────────────────────────
  const travelReady = independent_travel.filter(
    (t) => t.routes_mastered >= 2 && t.has_safety_plan,
  ).length;
  const travelReadinessRate = rate(travelReady, independent_travel.length);

  const mod4 =
    meets(travelReadinessRate, 70) ? 5 :
    meets(travelReadinessRate, 40) ? 2 :
    meets(travelReadinessRate, 20) ? 0 : -4;

  // ── Metric: Financial readiness (Mod 5) ───────────────────────────────
  const financiallyReady = leaving_care_packages.filter(
    (p) => p.savings_on_track && p.financial_literacy_progressing,
  ).length;
  const financialReadinessRate = rate(financiallyReady, leaving_care_packages.length);

  const mod5 =
    meets(financialReadinessRate, 70) ? 4 :
    meets(financialReadinessRate, 40) ? 1 :
    meets(financialReadinessRate, 20) ? 0 : -4;

  // ── Metric: Pathway plan quality (Mod 6) ──────────────────────────────
  const qualityPlans = activePlans.filter(
    (p) =>
      p.has_personal_advisor &&
      p.has_accommodation_plan &&
      p.has_eet_plan &&
      p.last_review_within_6_months,
  ).length;
  const planQualityRate = rate(qualityPlans, activePlans.length);

  const mod6 =
    meets(planQualityRate, 80) ? 5 :
    meets(planQualityRate, 50) ? 2 :
    meets(planQualityRate, 30) ? 0 : -5;

  // ── Score calculation ─────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE + mod1 + mod2 + mod3 + mod4 + mod5 + mod6;
  score = Math.max(0, Math.min(100, score));

  const leaving_care_rating = ratingFromScore(score);

  // ── Derived metrics for output ────────────────────────────────────────
  const aspirationRecordingRate = rate(aspirations.length, total_children);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(goalAchievementRate, 75))
    strengths.push(
      `${formatRate(goalAchievementRate)} of transition goals are achieved or on track — excellent progress towards independence.`,
    );

  if (meets(aspirationEngagementRate, 80))
    strengths.push(
      `${formatRate(aspirationEngagementRate)} of aspirations are child-chosen with steps taken — strong voice and engagement under Reg 5.`,
    );

  if (meets(travelReadinessRate, 70))
    strengths.push(
      `${formatRate(travelReadinessRate)} of children with travel records demonstrate independent travel readiness with safety plans.`,
    );

  if (meets(pathwayCoverageRate, 80))
    strengths.push(
      `${childrenWithActivePlans} of ${total_children} children have active pathway plans — comprehensive leaving care coverage.`,
    );

  if (meets(planQualityRate, 80))
    strengths.push(
      "Pathway plans are high quality with personal advisors, accommodation plans, EET plans, and recent reviews.",
    );

  if (meets(financialReadinessRate, 70))
    strengths.push(
      `${formatRate(financialReadinessRate)} of leaving care packages show savings on track with financial literacy progressing.`,
    );

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (below(pathwayCoverageRate, 50))
    concerns.push(
      `Only ${childrenWithActivePlans} of ${total_children} children have active pathway plans — Leaving Care Act 2000 requires plans for all eligible children.`,
    );

  if (below(financialReadinessRate, 40))
    concerns.push(
      `Financial readiness is low at ${formatRate(financialReadinessRate)} — children may not be financially prepared for independence.`,
    );

  if (aspirations.length === 0)
    concerns.push(
      "No aspirations recorded for any child — Reg 5 requires meaningful engagement with children about their futures.",
    );

  if (below(goalAchievementRate, 30) && transition_goals.length > 0)
    concerns.push(
      `Only ${formatRate(goalAchievementRate)} of transition goals are achieved or on track — risk of children being unprepared for adulthood.`,
    );

  if (below(travelReadinessRate, 20) && independent_travel.length > 0)
    concerns.push(
      `Travel readiness is critically low at ${formatRate(travelReadinessRate)} — children may lack independent mobility skills.`,
    );

  if (below(planQualityRate, 30) && activePlans.length > 0)
    concerns.push(
      "Active pathway plans lack key components (personal advisor, accommodation, EET, or recent review).",
    );

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 1;

  if (below(pathwayCoverageRate, 80))
    recommendations.push({
      rank: rank++,
      recommendation: `Ensure all eligible children have active pathway plans — currently ${childrenWithActivePlans} of ${total_children} covered.`,
      urgency: "immediate",
      regulatory_ref: "Leaving Care Act 2000",
    });

  if (aspirations.length === 0 || below(aspirationEngagementRate, 50))
    recommendations.push({
      rank: rank++,
      recommendation: "Record child-chosen aspirations with concrete steps for each young person to evidence Reg 5 engagement.",
      urgency: aspirations.length === 0 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 5",
    });

  if (below(financialReadinessRate, 40))
    recommendations.push({
      rank: rank++,
      recommendation: "Review leaving care financial packages — ensure savings plans and financial literacy programmes are in place.",
      urgency: "soon",
      regulatory_ref: "Leaving Care Act 2000",
    });

  if (below(travelReadinessRate, 40) && independent_travel.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Increase independent travel training — focus on route mastery and safety plans for each child.",
      urgency: "soon",
      regulatory_ref: null,
    });

  if (below(planQualityRate, 50) && activePlans.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Improve pathway plan quality — ensure each plan has a personal advisor, accommodation plan, EET plan, and recent review.",
      urgency: "soon",
      regulatory_ref: "Leaving Care Act 2000",
    });

  if (below(goalAchievementRate, 50) && transition_goals.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Accelerate transition goal progress — review at-risk and stalled goals with keyworkers.",
      urgency: transition_goals.some((g) => g.status === "at_risk") ? "immediate" : "planned",
      regulatory_ref: "CHR 2015 Reg 5",
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (below(pathwayCoverageRate, 30))
    insights.push({
      text: `Only ${formatRate(pathwayCoverageRate)} of children have active pathway plans. Ofsted will view this as a significant gap in leaving care preparation — the Leaving Care Act 2000 requires plans for all eligible young people.`,
      severity: "critical",
    });

  if (aspirations.length === 0)
    insights.push({
      text: "No aspirations have been recorded. Reg 5 requires that children's views, wishes, and aspirations are actively sought and recorded. Inspectors will look for evidence of meaningful engagement.",
      severity: "critical",
    });

  if (below(financialReadinessRate, 20) && leaving_care_packages.length > 0)
    insights.push({
      text: `Financial readiness is at ${formatRate(financialReadinessRate)}. Without savings plans and financial literacy, young people face heightened risk of financial hardship after leaving care.`,
      severity: "critical",
    });

  if (below(goalAchievementRate, 30) && transition_goals.length > 0)
    insights.push({
      text: `Only ${formatRate(goalAchievementRate)} of transition goals are on track or achieved. A pattern of unmet goals suggests systemic barriers to independence preparation.`,
      severity: "warning",
    });

  if (below(travelReadinessRate, 40) && independent_travel.length > 0)
    insights.push({
      text: `Travel readiness is ${formatRate(travelReadinessRate)}. Independent mobility is foundational to employment, education, and social participation after care.`,
      severity: "warning",
    });

  if (meets(goalAchievementRate, 75))
    insights.push({
      text: `${formatRate(goalAchievementRate)} of transition goals are achieved or on track — this demonstrates strong, evidence-based preparation for adulthood.`,
      severity: "positive",
    });

  if (meets(aspirationEngagementRate, 80))
    insights.push({
      text: `${formatRate(aspirationEngagementRate)} of aspirations are child-chosen with steps taken — children's voices are central to planning, as required by Reg 5.`,
      severity: "positive",
    });

  if (meets(pathwayCoverageRate, 80) && meets(planQualityRate, 80))
    insights.push({
      text: "Pathway plan coverage and quality are both strong. This provides Ofsted with clear evidence of planned, purposeful transitions.",
      severity: "positive",
    });

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    leaving_care_rating === "outstanding"
      ? `Excellent leaving care preparation: ${formatRate(goalAchievementRate)} goals on track, ${childrenWithActivePlans} of ${total_children} with pathway plans.`
      : leaving_care_rating === "good"
        ? `Good transition planning with ${formatRate(goalAchievementRate)} goal achievement and ${childrenWithActivePlans} active pathway plans.`
        : leaving_care_rating === "adequate"
          ? `Leaving care preparation in place but ${concerns.length > 0 ? concerns.length + " concern(s) identified" : "needs strengthening"}.`
          : `Leaving care preparation requires urgent attention — ${concerns.length} concern(s) across transition planning.`;

  return {
    leaving_care_rating,
    leaving_care_score: score,
    headline,
    children_with_pathway_plans: childrenWithActivePlans,
    goal_achievement_rate: goalAchievementRate,
    aspiration_recording_rate: aspirationRecordingRate,
    travel_readiness_rate: travelReadinessRate,
    financial_readiness_rate: financialReadinessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
