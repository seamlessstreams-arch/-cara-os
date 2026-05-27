// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME COMPETENCY LANDSCAPE INTELLIGENCE ENGINE
// Assesses the overall competency profile of the staff team: readiness
// scores, progression pathways, development plan engagement, and team
// capability gaps. Combines competencyProfiles + developmentPlans.
// CHR 2015 Reg 32 (Fitness of workers), Reg 33 (Employment of staff).
// SCCIF: "The effectiveness of leaders and managers."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CompetencyProfileInput {
  id: string;
  staff_id: string;
  current_stage: string;
  target_stage: string | null;
  readiness_score: number;
  strengths_count: number;
  development_areas_count: number;
  last_assessed_date: string;
  next_review_date: string;
}

export interface DevelopmentPlanInput {
  id: string;
  staff_id: string;
  status: string; // active | completed | paused
  total_actions: number;
  completed_actions: number;
  overdue_actions: number;
}

export interface HomeCompetencyLandscapeInput {
  today: string;
  profiles: CompetencyProfileInput[];
  development_plans: DevelopmentPlanInput[];
  total_staff: number;
}

// ── Result Types ────────────────────────────────────────────────────────────

export type CompetencyLandscapeRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ReadinessProfile {
  avg_readiness_score: number;
  highest_readiness: number;
  lowest_readiness: number;
  staff_above_70: number;
  staff_above_70_rate: number;
  staff_with_target: number;
  staff_with_target_rate: number;
}

export interface StageDistribution {
  stage: string;
  count: number;
}

export interface ProgressionProfile {
  active_plans: number;
  completed_plans: number;
  paused_plans: number;
  plan_coverage_rate: number;
  total_actions: number;
  completed_actions: number;
  overdue_actions: number;
  action_completion_rate: number;
  overdue_action_rate: number;
}

export interface CurrencyProfile {
  overdue_assessments: number;
  overdue_assessment_rate: number;
  avg_days_since_assessment: number;
}

export interface CompLandscapeRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref?: string;
}

export interface CompLandscapeInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HomeCompetencyLandscapeResult {
  competency_score: number;
  competency_rating: CompetencyLandscapeRating;
  headline: string;

  readiness: ReadinessProfile;
  stage_distribution: StageDistribution[];
  progression: ProgressionProfile;
  currency: CurrencyProfile;

  strengths: string[];
  concerns: string[];
  recommendations: CompLandscapeRecommendation[];
  insights: CompLandscapeInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function ratingFromScore(score: number): CompetencyLandscapeRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeCompetencyLandscape(
  input: HomeCompetencyLandscapeInput,
): HomeCompetencyLandscapeResult {
  const { today, profiles, development_plans, total_staff } = input;

  // ── Insufficient data ────────────────────────────────────────────────────
  if (total_staff === 0 || (profiles.length === 0 && development_plans.length === 0)) {
    return emptyResult();
  }

  // ── Readiness Profile ────────────────────────────────────────────────────
  const scores = profiles.map((p) => p.readiness_score);
  const staffAbove70 = profiles.filter((p) => p.readiness_score >= 70).length;
  const staffWithTarget = profiles.filter((p) => p.target_stage !== null).length;

  const readiness: ReadinessProfile = {
    avg_readiness_score: avg(scores),
    highest_readiness: scores.length > 0 ? Math.max(...scores) : 0,
    lowest_readiness: scores.length > 0 ? Math.min(...scores) : 0,
    staff_above_70: staffAbove70,
    staff_above_70_rate: pct(staffAbove70, profiles.length),
    staff_with_target: staffWithTarget,
    staff_with_target_rate: pct(staffWithTarget, profiles.length),
  };

  // ── Stage Distribution ───────────────────────────────────────────────────
  const stageMap = new Map<string, number>();
  for (const p of profiles) {
    stageMap.set(p.current_stage, (stageMap.get(p.current_stage) ?? 0) + 1);
  }
  const stageDistribution: StageDistribution[] = [...stageMap.entries()]
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  const uniqueStages = stageMap.size;

  // ── Progression Profile ──────────────────────────────────────────────────
  const activePlans = development_plans.filter((p) => p.status === "active");
  const completedPlans = development_plans.filter((p) => p.status === "completed");
  const pausedPlans = development_plans.filter((p) => p.status === "paused");

  const totalActions = development_plans.reduce((s, p) => s + p.total_actions, 0);
  const completedActions = development_plans.reduce((s, p) => s + p.completed_actions, 0);
  const overdueActions = development_plans.reduce((s, p) => s + p.overdue_actions, 0);

  const staffWithPlans = new Set(development_plans.map((p) => p.staff_id)).size;

  const progression: ProgressionProfile = {
    active_plans: activePlans.length,
    completed_plans: completedPlans.length,
    paused_plans: pausedPlans.length,
    plan_coverage_rate: pct(staffWithPlans, total_staff),
    total_actions: totalActions,
    completed_actions: completedActions,
    overdue_actions: overdueActions,
    action_completion_rate: pct(completedActions, totalActions),
    overdue_action_rate: pct(overdueActions, totalActions),
  };

  // ── Currency Profile ─────────────────────────────────────────────────────
  const overdueAssessments = profiles.filter(
    (p) => p.next_review_date < today,
  ).length;

  const daysSinceValues = profiles.map((p) =>
    daysBetween(p.last_assessed_date, today),
  );

  const currencyProfile: CurrencyProfile = {
    overdue_assessments: overdueAssessments,
    overdue_assessment_rate: pct(overdueAssessments, profiles.length),
    avg_days_since_assessment: avg(daysSinceValues),
  };

  // ── Development balance ──────────────────────────────────────────────────
  const avgStrengths = avg(profiles.map((p) => p.strengths_count));
  const avgDevAreas = avg(profiles.map((p) => p.development_areas_count));

  // ── Scoring (base 52, max bonuses 28 = 80 for outstanding) ───────────────
  const BASE = 52;
  let bonuses = 0;

  // Modifier 1: Average readiness score (±5)
  if (profiles.length === 0) {
    // no profiles → neutral
  } else if (readiness.avg_readiness_score >= 75) {
    bonuses += 5;
  } else if (readiness.avg_readiness_score >= 65) {
    bonuses += 3;
  } else if (readiness.avg_readiness_score >= 55) {
    // +0
  } else {
    bonuses -= 4;
  }

  // Modifier 2: Pathway coverage — staff with target stage (±3)
  if (profiles.length === 0) {
    // neutral
  } else if (readiness.staff_with_target_rate >= 80) {
    bonuses += 3;
  } else if (readiness.staff_with_target_rate >= 60) {
    bonuses += 1;
  } else if (readiness.staff_with_target_rate >= 40) {
    // +0
  } else {
    bonuses -= 2;
  }

  // Modifier 3: Development plan engagement (±4)
  if (total_staff === 0) {
    // neutral
  } else if (progression.plan_coverage_rate >= 60) {
    bonuses += 4;
  } else if (progression.plan_coverage_rate >= 40) {
    bonuses += 2;
  } else if (progression.plan_coverage_rate >= 20) {
    // +0
  } else {
    bonuses -= 3;
  }

  // Modifier 4: Overdue development actions (±3)
  if (development_plans.length === 0) {
    // neutral — no plans to have overdue actions
  } else if (overdueActions === 0) {
    bonuses += 3;
  } else if (progression.overdue_action_rate <= 15) {
    bonuses += 1;
  } else if (progression.overdue_action_rate <= 30) {
    // +0
  } else {
    bonuses -= 2;
  }

  // Modifier 5: Assessment currency (±3)
  if (profiles.length === 0) {
    // neutral
  } else if (overdueAssessments === 0) {
    bonuses += 3;
  } else if (currencyProfile.overdue_assessment_rate <= 25) {
    bonuses += 1;
  } else if (currencyProfile.overdue_assessment_rate <= 50) {
    // +0
  } else {
    bonuses -= 2;
  }

  // Modifier 6: Stage diversity (±3)
  if (uniqueStages >= 3) {
    bonuses += 3;
  } else if (uniqueStages >= 2) {
    bonuses += 1;
  } else if (uniqueStages === 1) {
    // +0
  } else {
    bonuses -= 2;
  }

  // Modifier 7: Development balance (±4)
  if (profiles.length === 0) {
    // neutral
  } else if (avgDevAreas <= 2 && avgStrengths >= 2) {
    bonuses += 4;
  } else if (avgDevAreas <= 3) {
    bonuses += 2;
  } else if (avgDevAreas <= 4) {
    // +0
  } else {
    bonuses -= 3;
  }

  // Modifier 8: High-readiness staff rate (±3)
  if (profiles.length === 0) {
    // neutral
  } else if (readiness.staff_above_70_rate >= 50) {
    bonuses += 3;
  } else if (readiness.staff_above_70_rate >= 30) {
    bonuses += 1;
  } else if (readiness.staff_above_70_rate >= 15) {
    // +0
  } else {
    bonuses -= 2;
  }

  const score = Math.max(0, Math.min(100, BASE + bonuses));
  const rating = ratingFromScore(score);

  // ── Headline ─────────────────────────────────────────────────────────────
  const headline = buildHeadline(rating, readiness, progression, profiles.length);

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (readiness.avg_readiness_score >= 70 && profiles.length > 0)
    strengths.push(
      `Team average readiness score is ${readiness.avg_readiness_score}/100 — indicating a capable and well-prepared workforce.`,
    );
  if (overdueAssessments === 0 && profiles.length > 0)
    strengths.push(
      "All competency assessments are current — no overdue reviews, demonstrating proactive workforce management.",
    );
  if (readiness.staff_with_target_rate >= 80 && profiles.length > 0)
    strengths.push(
      `${readiness.staff_with_target_rate}% of staff have a defined progression target — strong workforce development ambition.`,
    );
  if (progression.active_plans > 0 && overdueActions === 0)
    strengths.push(
      `${progression.active_plans} active development plan${progression.active_plans > 1 ? "s" : ""} with no overdue actions — plans are being followed and on track.`,
    );
  if (uniqueStages >= 3)
    strengths.push(
      "Team has staff across multiple role stages — providing a healthy succession pipeline and mentoring capability.",
    );
  if (avgStrengths >= 2.5 && profiles.length > 0)
    strengths.push(
      `Staff average ${avgStrengths} recognised strengths each — a well-balanced and capable team.`,
    );

  // ── Concerns ─────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (readiness.avg_readiness_score < 60 && profiles.length > 0)
    concerns.push(
      `Average readiness score is ${readiness.avg_readiness_score}/100 — below the expected standard. Focused development needed.`,
    );
  if (overdueAssessments > 0)
    concerns.push(
      `${overdueAssessments} competency assessment${overdueAssessments > 1 ? "s are" : " is"} overdue — profiles may not reflect current capability.`,
    );
  if (progression.plan_coverage_rate < 40 && total_staff > 0)
    concerns.push(
      `Only ${progression.plan_coverage_rate}% of staff have development plans — limited structured progression in place.`,
    );
  if (overdueActions > 0)
    concerns.push(
      `${overdueActions} development plan action${overdueActions > 1 ? "s are" : " is"} overdue — may indicate stalled progression or insufficient management oversight.`,
    );
  if (readiness.staff_above_70_rate < 30 && profiles.length > 0)
    concerns.push(
      `Only ${readiness.staff_above_70_rate}% of staff have readiness scores above 70 — team capability may be insufficient for complex work.`,
    );
  if (avgDevAreas > 3 && profiles.length > 0)
    concerns.push(
      `Staff average ${avgDevAreas} development areas each — significant competency gaps exist across the team.`,
    );

  // ── Recommendations ──────────────────────────────────────────────────────
  const recommendations: CompLandscapeRecommendation[] = [];
  let rank = 0;

  if (overdueAssessments > 0)
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete ${overdueAssessments} overdue competency assessment${overdueAssessments > 1 ? "s" : ""} to ensure staff profiles reflect current capability and development needs.`,
      urgency: "soon",
      regulatory_ref: "Reg 32",
    });

  if (overdueActions > 0)
    recommendations.push({
      rank: ++rank,
      recommendation: `Address ${overdueActions} overdue development plan action${overdueActions > 1 ? "s" : ""}. Review with staff to reschedule or escalate barriers.`,
      urgency: "immediate",
      regulatory_ref: "Reg 33",
    });

  if (progression.plan_coverage_rate < 60 && total_staff > 0)
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create development plans for additional staff members to ensure structured progression pathways are in place for the majority of the team.",
      urgency: "planned",
      regulatory_ref: "Reg 33",
    });

  if (readiness.staff_with_target_rate < 60 && profiles.length > 0)
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Define progression targets for staff who currently lack a target stage. This demonstrates investment in workforce development at inspection.",
      urgency: "planned",
      regulatory_ref: "Reg 33",
    });

  if (readiness.avg_readiness_score < 65 && profiles.length > 0)
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement targeted training and mentoring to raise team readiness. Focus on staff with the lowest readiness scores first.",
      urgency: "soon",
      regulatory_ref: "Reg 32",
    });

  // ── Insights ─────────────────────────────────────────────────────────────
  const insights: CompLandscapeInsight[] = [];

  if (readiness.avg_readiness_score >= 70 && uniqueStages >= 3)
    insights.push({
      text: `The team's average readiness of ${readiness.avg_readiness_score}/100 across ${uniqueStages} role stages demonstrates a mature, multi-level workforce — an inspector would view this as evidence of effective succession planning.`,
      severity: "positive",
    });

  if (progression.active_plans > 0 && overdueActions === 0 && progression.completed_actions > 0)
    insights.push({
      text: `${progression.completed_actions} development action${progression.completed_actions > 1 ? "s" : ""} completed with zero overdue — staff are actively progressing through structured pathways.`,
      severity: "positive",
    });

  if (
    readiness.lowest_readiness < 50 &&
    profiles.length > 0
  )
    insights.push({
      text: `The lowest readiness score in the team is ${readiness.lowest_readiness}/100 — this staff member may need intensive support or supervised practice adjustments.`,
      severity: "warning",
    });

  if (
    readiness.highest_readiness >= 85 &&
    readiness.lowest_readiness < 55 &&
    profiles.length > 1
  )
    insights.push({
      text: `Significant readiness gap: highest score ${readiness.highest_readiness} vs lowest ${readiness.lowest_readiness}. Consider pairing high-readiness staff with developing colleagues as mentors.`,
      severity: "warning",
    });

  if (
    progression.plan_coverage_rate >= 60 &&
    readiness.staff_with_target_rate >= 80
  )
    insights.push({
      text: "Strong alignment between target-setting and development planning — the home demonstrates a structured approach to workforce progression that would evidence Reg 33 compliance.",
      severity: "positive",
    });

  return {
    competency_score: score,
    competency_rating: rating,
    headline,
    readiness,
    stage_distribution: stageDistribution,
    progression,
    currency: currencyProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

// ── Empty Result ────────────────────────────────────────────────────────────

function emptyResult(): HomeCompetencyLandscapeResult {
  return {
    competency_score: 0,
    competency_rating: "insufficient_data",
    headline: "No competency data available — workforce capability cannot be assessed.",
    readiness: {
      avg_readiness_score: 0,
      highest_readiness: 0,
      lowest_readiness: 0,
      staff_above_70: 0,
      staff_above_70_rate: 0,
      staff_with_target: 0,
      staff_with_target_rate: 0,
    },
    stage_distribution: [],
    progression: {
      active_plans: 0,
      completed_plans: 0,
      paused_plans: 0,
      plan_coverage_rate: 0,
      total_actions: 0,
      completed_actions: 0,
      overdue_actions: 0,
      action_completion_rate: 0,
      overdue_action_rate: 0,
    },
    currency: {
      overdue_assessments: 0,
      overdue_assessment_rate: 0,
      avg_days_since_assessment: 0,
    },
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Headline Builder ────────────────────────────────────────────────────────

function buildHeadline(
  rating: CompetencyLandscapeRating,
  readiness: ReadinessProfile,
  progression: ProgressionProfile,
  profileCount: number,
): string {
  switch (rating) {
    case "outstanding":
      return `Workforce capability is outstanding — ${profileCount} staff profiled with average readiness ${readiness.avg_readiness_score}/100 and strong development engagement.`;
    case "good":
      return `Workforce capability is good — ${profileCount} staff profiled with ${progression.active_plans} active development plan${progression.active_plans !== 1 ? "s" : ""} progressing well.`;
    case "adequate":
      return `Workforce capability is adequate — readiness averages ${readiness.avg_readiness_score}/100 with room for improvement in development planning.`;
    case "inadequate":
      return `Workforce capability needs urgent attention — significant gaps in readiness, development engagement, or assessment currency.`;
    default:
      return "Insufficient data to assess workforce competency landscape.";
  }
}
