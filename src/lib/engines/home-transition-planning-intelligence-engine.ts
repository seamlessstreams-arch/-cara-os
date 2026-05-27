// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TRANSITION PLANNING INTELLIGENCE ENGINE
// Pure deterministic engine: pathway planning, independence preparation,
// goal achievement, area coverage for children approaching transition.
// CHR 2015 Reg 14: "The care and independence planning standard."
// SCCIF: "Children are well prepared for their future."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TransitionGoalInput {
  id: string;
  child_id: string;
  area: string; // independent_living | education_employment | financial | health_wellbeing | housing | relationships | legal_rights | identity
  goal: string;
  description: string;
  status: string; // not_started | in_progress | on_track | at_risk | achieved | paused
  target_date: string; // YYYY-MM-DD
  start_date: string;
  key_worker: string;
  actions: string[];
  progress: string;
  percent_complete: number; // 0-100
  review_date: string; // YYYY-MM-DD or ""
  notes: string;
}

export interface HomeTransitionPlanningInput {
  today: string; // YYYY-MM-DD
  transition_goals: TransitionGoalInput[];
  total_children: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TransitionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface GoalStatusProfile {
  total_goals: number;
  not_started: number;
  in_progress: number;
  on_track: number;
  at_risk: number;
  achieved: number;
  paused: number;
  achievement_rate: number; // % achieved of total
  active_rate: number; // % in_progress + on_track of total
}

export interface AreaCoverageProfile {
  areas_covered: number;
  total_possible_areas: number;
  coverage_rate: number; // %
  area_distribution: Record<string, number>; // area → count
  gaps: string[]; // areas with 0 goals
}

export interface ChildCoverageProfile {
  children_with_goals: number;
  total_children: number;
  coverage_rate: number;
  goals_per_child: Record<string, number>; // child_id → goal count
  children_without_goals: number;
}

export interface ProgressProfile {
  avg_percent_complete: number;
  goals_overdue: number; // target_date past and not achieved
  goals_with_reviews: number;
  review_rate: number; // % with review_date populated
  reviews_overdue: number; // review_date > 30 days ago
  goals_with_actions: number;
  action_coverage_rate: number; // % with at least 1 action
}

export interface Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface Recommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface HomeTransitionPlanningResult {
  transition_rating: TransitionRating;
  transition_score: number;
  headline: string;
  goal_status: GoalStatusProfile;
  area_coverage: AreaCoverageProfile;
  child_coverage: ChildCoverageProfile;
  progress: ProgressProfile;
  strengths: string[];
  concerns: string[];
  recommendations: Recommendation[];
  insights: Insight[];
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

function ratingFromScore(score: number): TransitionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

const ALL_AREAS = [
  "independent_living",
  "education_employment",
  "financial",
  "health_wellbeing",
  "housing",
  "relationships",
  "legal_rights",
  "identity",
];

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeTransitionPlanning(
  input: HomeTransitionPlanningInput,
): HomeTransitionPlanningResult {
  const { today, transition_goals, total_children } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0 || transition_goals.length === 0) {
    return {
      transition_rating: "insufficient_data",
      transition_score: 0,
      headline: total_children === 0
        ? "No children registered in the home."
        : "No transition planning goals recorded.",
      goal_status: {
        total_goals: 0, not_started: 0, in_progress: 0, on_track: 0,
        at_risk: 0, achieved: 0, paused: 0, achievement_rate: 0, active_rate: 0,
      },
      area_coverage: {
        areas_covered: 0, total_possible_areas: ALL_AREAS.length,
        coverage_rate: 0, area_distribution: {}, gaps: [...ALL_AREAS],
      },
      child_coverage: {
        children_with_goals: 0, total_children: 0,
        coverage_rate: 0, goals_per_child: {}, children_without_goals: 0,
      },
      progress: {
        avg_percent_complete: 0, goals_overdue: 0, goals_with_reviews: 0,
        review_rate: 0, reviews_overdue: 0, goals_with_actions: 0,
        action_coverage_rate: 0,
      },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  const todayDate = today.slice(0, 10);

  // ── Goal Status Profile ───────────────────────────────────────────────
  const statusCounts = {
    not_started: 0,
    in_progress: 0,
    on_track: 0,
    at_risk: 0,
    achieved: 0,
    paused: 0,
  };
  for (const g of transition_goals) {
    const s = g.status as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  }

  const goal_status: GoalStatusProfile = {
    total_goals: transition_goals.length,
    ...statusCounts,
    achievement_rate: pct(statusCounts.achieved, transition_goals.length),
    active_rate: pct(
      statusCounts.in_progress + statusCounts.on_track,
      transition_goals.length,
    ),
  };

  // ── Area Coverage Profile ─────────────────────────────────────────────
  const areaDistribution: Record<string, number> = {};
  for (const g of transition_goals) {
    areaDistribution[g.area] = (areaDistribution[g.area] || 0) + 1;
  }
  const areasCovered = ALL_AREAS.filter((a) => (areaDistribution[a] || 0) > 0);
  const gaps = ALL_AREAS.filter((a) => !areaDistribution[a]);

  const area_coverage: AreaCoverageProfile = {
    areas_covered: areasCovered.length,
    total_possible_areas: ALL_AREAS.length,
    coverage_rate: pct(areasCovered.length, ALL_AREAS.length),
    area_distribution: areaDistribution,
    gaps,
  };

  // ── Child Coverage Profile ────────────────────────────────────────────
  const goalsPerChild: Record<string, number> = {};
  for (const g of transition_goals) {
    goalsPerChild[g.child_id] = (goalsPerChild[g.child_id] || 0) + 1;
  }
  const childrenWithGoals = Object.keys(goalsPerChild).length;

  const child_coverage: ChildCoverageProfile = {
    children_with_goals: childrenWithGoals,
    total_children,
    coverage_rate: pct(childrenWithGoals, total_children),
    goals_per_child: goalsPerChild,
    children_without_goals: Math.max(0, total_children - childrenWithGoals),
  };

  // ── Progress Profile ──────────────────────────────────────────────────
  const percentages = transition_goals.map((g) => g.percent_complete);
  const avgPercent =
    percentages.length > 0
      ? Math.round(percentages.reduce((s, n) => s + n, 0) / percentages.length)
      : 0;

  // Overdue: target_date is past AND status is not achieved/paused
  const overdue = transition_goals.filter(
    (g) =>
      g.target_date &&
      daysBetween(g.target_date, todayDate) > 0 &&
      g.status !== "achieved" &&
      g.status !== "paused",
  );

  const withReview = transition_goals.filter(
    (g) => g.review_date && g.review_date.length >= 10,
  );
  const reviewsOverdue = withReview.filter(
    (g) => daysBetween(g.review_date, todayDate) > 30,
  );

  const withActions = transition_goals.filter(
    (g) => Array.isArray(g.actions) && g.actions.length > 0,
  );

  const progress: ProgressProfile = {
    avg_percent_complete: avgPercent,
    goals_overdue: overdue.length,
    goals_with_reviews: withReview.length,
    review_rate: pct(withReview.length, transition_goals.length),
    reviews_overdue: reviewsOverdue.length,
    goals_with_actions: withActions.length,
    action_coverage_rate: pct(withActions.length, transition_goals.length),
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Child coverage (±5)
  // All children should have transition goals
  const mod1 =
    child_coverage.coverage_rate >= 100 ? 5 :
    child_coverage.coverage_rate >= 75 ? 3 :
    child_coverage.coverage_rate >= 50 ? 1 :
    child_coverage.coverage_rate > 0 ? -2 : -5;
  score += mod1;

  // mod2: Area coverage breadth (±4)
  // Covering multiple life areas shows holistic planning
  const mod2 =
    area_coverage.areas_covered >= 6 ? 4 :
    area_coverage.areas_covered >= 4 ? 2 :
    area_coverage.areas_covered >= 2 ? 0 : -3;
  score += mod2;

  // mod3: Goal achievement rate (±4)
  const mod3 =
    goal_status.achievement_rate >= 40 ? 4 :
    goal_status.achievement_rate >= 20 ? 2 :
    goal_status.achievement_rate >= 10 ? 0 : -2;
  score += mod3;

  // mod4: Active engagement (±4)
  // High proportion of goals actively being worked on
  const mod4 =
    goal_status.active_rate >= 50 ? 4 :
    goal_status.active_rate >= 30 ? 2 :
    goal_status.active_rate >= 15 ? 0 : -3;
  score += mod4;

  // mod5: At-risk goals (±3)
  const atRiskRate = pct(statusCounts.at_risk, transition_goals.length);
  const mod5 =
    atRiskRate === 0 ? 3 :
    atRiskRate <= 15 ? 1 :
    atRiskRate <= 30 ? -1 : -3;
  score += mod5;

  // mod6: Review compliance (±3)
  // Goals should have recent reviews
  const mod6 =
    progress.review_rate >= 80 ? 3 :
    progress.review_rate >= 60 ? 1 :
    progress.review_rate >= 40 ? 0 : -2;
  score += mod6;

  // mod7: Action planning (±3)
  // Every goal should have concrete actions
  const mod7 =
    progress.action_coverage_rate >= 90 ? 3 :
    progress.action_coverage_rate >= 70 ? 1 :
    progress.action_coverage_rate >= 50 ? 0 : -2;
  score += mod7;

  // mod8: Overdue goals (±4)
  const overdueRate = pct(overdue.length, transition_goals.length);
  const mod8 =
    overdueRate === 0 ? 4 :
    overdueRate <= 10 ? 2 :
    overdueRate <= 25 ? 0 : -4;
  score += mod8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const transition_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (child_coverage.coverage_rate >= 100)
    strengths.push("All children have transition planning goals in place — excellent Reg 14 compliance.");
  if (area_coverage.areas_covered >= 6)
    strengths.push(`Transition planning covers ${area_coverage.areas_covered} of ${ALL_AREAS.length} life areas — holistic approach.`);
  if (goal_status.achievement_rate >= 30 && statusCounts.achieved > 0)
    strengths.push(`${statusCounts.achieved} goal(s) achieved (${goal_status.achievement_rate}%) — tangible progress towards independence.`);
  if (progress.action_coverage_rate >= 90)
    strengths.push("All goals have concrete action plans — clear pathways to achievement.");
  if (progress.review_rate >= 80)
    strengths.push(`${progress.review_rate}% of goals have been reviewed — strong oversight.`);
  if (overdueRate === 0 && transition_goals.length > 0)
    strengths.push("No overdue goals — all transition targets remain on schedule.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (child_coverage.children_without_goals > 0)
    concerns.push(`${child_coverage.children_without_goals} child(ren) have no transition planning goals — Reg 14 requires preparation for all children.`);
  if (statusCounts.at_risk > 0)
    concerns.push(`${statusCounts.at_risk} goal(s) flagged as at-risk — intervention needed to prevent drift.`);
  if (overdue.length > 0)
    concerns.push(`${overdue.length} goal(s) overdue past target date — review urgently.`);
  if (reviewsOverdue.length > 0)
    concerns.push(`${reviewsOverdue.length} goal(s) haven't been reviewed in over 30 days.`);
  if (gaps.length >= 4)
    concerns.push(`${gaps.length} life areas have no transition goals — significant gaps in holistic preparation.`);
  if (statusCounts.not_started > 0 && pct(statusCounts.not_started, transition_goals.length) > 30)
    concerns.push(`${statusCounts.not_started} goal(s) not yet started (${pct(statusCounts.not_started, transition_goals.length)}%) — planning without action risks drift.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 1;

  if (child_coverage.children_without_goals > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Create transition planning goals for the ${child_coverage.children_without_goals} child(ren) currently without any.`,
      urgency: "immediate",
      regulatory_ref: "Reg 14",
    });

  if (overdue.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Review ${overdue.length} overdue goal(s) and update target dates or escalate support.`,
      urgency: "immediate",
      regulatory_ref: "Reg 14(2)(b)",
    });

  if (statusCounts.at_risk > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Provide targeted support for ${statusCounts.at_risk} at-risk goal(s) to prevent them becoming overdue.`,
      urgency: "soon",
      regulatory_ref: "Reg 14",
    });

  if (gaps.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Add transition goals covering: ${gaps.join(", ").replace(/_/g, " ")}.`,
      urgency: gaps.length >= 4 ? "soon" : "planned",
      regulatory_ref: "SCCIF 36",
    });

  if (reviewsOverdue.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Update reviews for ${reviewsOverdue.length} goal(s) not reviewed in 30+ days.`,
      urgency: "soon",
      regulatory_ref: "Reg 14(2)(b)",
    });

  if (progress.action_coverage_rate < 90)
    recommendations.push({
      rank: rank++,
      recommendation: "Ensure all goals have documented action steps for accountability.",
      urgency: "planned",
      regulatory_ref: null,
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (child_coverage.children_without_goals > 0)
    insights.push({
      text: `${child_coverage.children_without_goals} child(ren) currently have no transition plan. Reg 14 requires that all children are prepared for independence regardless of age — earlier planning leads to better outcomes.`,
      severity: "critical",
    });

  if (statusCounts.at_risk > 0)
    insights.push({
      text: `${statusCounts.at_risk} goal(s) flagged at-risk. Ofsted will examine whether the home is proactive in addressing barriers. Consider a keyworker-led review within 7 days.`,
      severity: "warning",
    });

  if (avgPercent >= 40 && statusCounts.achieved > 0)
    insights.push({
      text: `Average goal completion is ${avgPercent}% with ${statusCounts.achieved} achieved. This demonstrates meaningful, evidence-based progress towards independence.`,
      severity: "positive",
    });

  if (area_coverage.areas_covered >= 5)
    insights.push({
      text: `Transition planning spans ${area_coverage.areas_covered} life areas — this holistic approach reflects best practice under Reg 14 and aligns with Pathway Plan expectations.`,
      severity: "positive",
    });

  if (overdue.length > 0 && overdue.length >= 2)
    insights.push({
      text: `${overdue.length} goals are past their target date. A pattern of overdue targets can suggest systemic drift — consider whether staffing or complexity is a factor.`,
      severity: "warning",
    });

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    transition_rating === "outstanding"
      ? `Excellent transition planning: ${statusCounts.achieved} goals achieved, ${area_coverage.areas_covered} life areas covered.`
      : transition_rating === "good"
        ? `Good transition framework with ${goal_status.active_rate}% of goals actively progressing.`
        : transition_rating === "adequate"
          ? `Transition planning in place but ${concerns.length > 0 ? concerns.length + " concern(s) identified" : "needs strengthening"}.`
          : `Transition planning requires urgent attention — ${overdue.length} overdue, ${child_coverage.children_without_goals} child(ren) without goals.`;

  return {
    transition_rating,
    transition_score: score,
    headline,
    goal_status,
    area_coverage,
    child_coverage,
    progress,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
