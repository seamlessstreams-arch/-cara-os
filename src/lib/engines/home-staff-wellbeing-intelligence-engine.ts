// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF WELLBEING INTELLIGENCE ENGINE
// Pure deterministic engine: staff wellbeing checks, morale, stressors, support.
// CHR 2015 Reg 33: "The registered person must ensure that staff are supported."
// SCCIF: "How well does the leadership team support staff wellbeing?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface WellbeingCheckInput {
  id: string;
  staff_id: string;
  date: string;                        // YYYY-MM-DD
  type: string;                        // monthly_checkin | post_incident | supervision_wellbeing | return_from_absence | self_referral | manager_concern
  overall_score: number;               // 1-10
  workload_score: number;              // 1-10
  support_score: number;               // 1-10
  moral_score: number;                 // 1-10
  stressors: string[];
  positives: string[];
  support_needed: string;
  action_agreed: string;
  follow_up_date: string | null;       // YYYY-MM-DD
  conducted_by: string;
  confidential: boolean;
}

export interface HomeStaffWellbeingInput {
  today: string;                       // YYYY-MM-DD
  wellbeing_checks: WellbeingCheckInput[];
  total_staff: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffWellbeingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MoraleProfile {
  avg_overall: number;
  avg_workload: number;
  avg_support: number;
  avg_moral: number;
  lowest_overall: number;
  highest_overall: number;
  at_risk_count: number;               // overall_score <= 4
  thriving_count: number;              // overall_score >= 7
}

export interface CoverageProfile {
  total_checks: number;
  unique_staff_checked: number;
  coverage_rate: number;               // % of total_staff with at least 1 check
  checks_last_30_days: number;
  checks_last_90_days: number;
}

export interface CheckTypeDistribution {
  monthly_checkin: number;
  post_incident: number;
  supervision_wellbeing: number;
  return_from_absence: number;
  self_referral: number;
  manager_concern: number;
}

export interface StressorProfile {
  total_stressors: number;
  unique_stressors: number;
  total_positives: number;
  checks_with_support_needed: number;
  checks_with_action_agreed: number;
}

export interface FollowUpProfile {
  total_follow_ups_due: number;
  overdue_follow_ups: number;
  upcoming_follow_ups: number;
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

export interface HomeStaffWellbeingResult {
  wellbeing_rating: StaffWellbeingRating;
  wellbeing_score: number;
  headline: string;
  morale: MoraleProfile;
  coverage: CoverageProfile;
  check_types: CheckTypeDistribution;
  stressor_profile: StressorProfile;
  follow_ups: FollowUpProfile;
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

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

function ratingFromScore(score: number): StaffWellbeingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeStaffWellbeing(
  input: HomeStaffWellbeingInput,
): HomeStaffWellbeingResult {
  const { today, wellbeing_checks, total_staff } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_staff === 0 || wellbeing_checks.length === 0) {
    return {
      wellbeing_rating: "insufficient_data",
      wellbeing_score: 0,
      headline: total_staff === 0
        ? "No active staff registered."
        : "No staff wellbeing checks recorded.",
      morale: {
        avg_overall: 0, avg_workload: 0, avg_support: 0, avg_moral: 0,
        lowest_overall: 0, highest_overall: 0,
        at_risk_count: 0, thriving_count: 0,
      },
      coverage: {
        total_checks: 0, unique_staff_checked: 0, coverage_rate: 0,
        checks_last_30_days: 0, checks_last_90_days: 0,
      },
      check_types: {
        monthly_checkin: 0, post_incident: 0, supervision_wellbeing: 0,
        return_from_absence: 0, self_referral: 0, manager_concern: 0,
      },
      stressor_profile: {
        total_stressors: 0, unique_stressors: 0, total_positives: 0,
        checks_with_support_needed: 0, checks_with_action_agreed: 0,
      },
      follow_ups: {
        total_follow_ups_due: 0, overdue_follow_ups: 0, upcoming_follow_ups: 0,
      },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Morale Profile ────────────────────────────────────────────────────
  const overalls = wellbeing_checks.map((c) => c.overall_score);
  const workloads = wellbeing_checks.map((c) => c.workload_score);
  const supports = wellbeing_checks.map((c) => c.support_score);
  const morals = wellbeing_checks.map((c) => c.moral_score);

  const morale: MoraleProfile = {
    avg_overall: avg(overalls),
    avg_workload: avg(workloads),
    avg_support: avg(supports),
    avg_moral: avg(morals),
    lowest_overall: Math.min(...overalls),
    highest_overall: Math.max(...overalls),
    at_risk_count: wellbeing_checks.filter((c) => c.overall_score <= 4).length,
    thriving_count: wellbeing_checks.filter((c) => c.overall_score >= 7).length,
  };

  // ── Coverage Profile ──────────────────────────────────────────────────
  const uniqueStaff = new Set(wellbeing_checks.map((c) => c.staff_id));
  const last30 = wellbeing_checks.filter(
    (c) => daysBetween(c.date, today) >= 0 && daysBetween(c.date, today) <= 30,
  );
  const last90 = wellbeing_checks.filter(
    (c) => daysBetween(c.date, today) >= 0 && daysBetween(c.date, today) <= 90,
  );

  const coverage: CoverageProfile = {
    total_checks: wellbeing_checks.length,
    unique_staff_checked: uniqueStaff.size,
    coverage_rate: pct(uniqueStaff.size, total_staff),
    checks_last_30_days: last30.length,
    checks_last_90_days: last90.length,
  };

  // ── Check Type Distribution ───────────────────────────────────────────
  const check_types: CheckTypeDistribution = {
    monthly_checkin: wellbeing_checks.filter((c) => c.type === "monthly_checkin").length,
    post_incident: wellbeing_checks.filter((c) => c.type === "post_incident").length,
    supervision_wellbeing: wellbeing_checks.filter((c) => c.type === "supervision_wellbeing").length,
    return_from_absence: wellbeing_checks.filter((c) => c.type === "return_from_absence").length,
    self_referral: wellbeing_checks.filter((c) => c.type === "self_referral").length,
    manager_concern: wellbeing_checks.filter((c) => c.type === "manager_concern").length,
  };

  // ── Stressor Profile ──────────────────────────────────────────────────
  const allStressors = wellbeing_checks.flatMap((c) => c.stressors);
  const allPositives = wellbeing_checks.flatMap((c) => c.positives);

  const stressor_profile: StressorProfile = {
    total_stressors: allStressors.length,
    unique_stressors: new Set(allStressors).size,
    total_positives: allPositives.length,
    checks_with_support_needed: wellbeing_checks.filter(
      (c) => c.support_needed && c.support_needed.trim().length > 0,
    ).length,
    checks_with_action_agreed: wellbeing_checks.filter(
      (c) => c.action_agreed && c.action_agreed.trim().length > 0,
    ).length,
  };

  // ── Follow-Up Profile ─────────────────────────────────────────────────
  const withFollowUp = wellbeing_checks.filter((c) => c.follow_up_date);
  const overdue = withFollowUp.filter(
    (c) => c.follow_up_date && daysBetween(c.follow_up_date, today) > 0,
  );
  const upcoming = withFollowUp.filter(
    (c) => c.follow_up_date && daysBetween(c.follow_up_date, today) <= 0,
  );

  const follow_ups: FollowUpProfile = {
    total_follow_ups_due: withFollowUp.length,
    overdue_follow_ups: overdue.length,
    upcoming_follow_ups: upcoming.length,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Average morale (±5)
  // High average overall score = positive culture
  const mod1 =
    morale.avg_overall >= 7 ? 5 :
    morale.avg_overall >= 6 ? 3 :
    morale.avg_overall >= 5 ? 0 :
    morale.avg_overall >= 4 ? -3 : -5;
  score += mod1;

  // mod2: Staff coverage (±4)
  // What proportion of staff have had a wellbeing check
  const mod2 =
    coverage.coverage_rate >= 80 ? 4 :
    coverage.coverage_rate >= 60 ? 2 :
    coverage.coverage_rate >= 40 ? 0 : -3;
  score += mod2;

  // mod3: At-risk staff (±4)
  // Staff scoring <= 4 overall
  const atRiskRate = pct(morale.at_risk_count, wellbeing_checks.length);
  const mod3 =
    morale.at_risk_count === 0 ? 4 :
    atRiskRate <= 15 ? 1 :
    atRiskRate <= 30 ? -1 : -4;
  score += mod3;

  // mod4: Action responsiveness (±3)
  // Checks with support needed should have actions agreed
  const supportNeeded = stressor_profile.checks_with_support_needed;
  const actionRate = supportNeeded === 0 ? 100 : pct(stressor_profile.checks_with_action_agreed, supportNeeded);
  const mod4 =
    actionRate >= 90 ? 3 :
    actionRate >= 70 ? 1 :
    actionRate >= 50 ? 0 : -2;
  score += mod4;

  // mod5: Follow-up compliance (±3)
  // Overdue follow-ups indicate lack of care
  const mod5 =
    follow_ups.total_follow_ups_due === 0 ? 0 :
    follow_ups.overdue_follow_ups === 0 ? 3 :
    pct(follow_ups.overdue_follow_ups, follow_ups.total_follow_ups_due) <= 25 ? 1 :
    pct(follow_ups.overdue_follow_ups, follow_ups.total_follow_ups_due) <= 50 ? -1 : -3;
  score += mod5;

  // mod6: Check type diversity (±3)
  // Using multiple check types shows proactive culture
  const typesUsed = Object.values(check_types).filter((v) => v > 0).length;
  const mod6 =
    typesUsed >= 4 ? 3 :
    typesUsed >= 3 ? 2 :
    typesUsed >= 2 ? 0 : -2;
  score += mod6;

  // mod7: Frequency of checks (±3)
  // Regular recent checks show commitment
  const checksPerStaffMonth = total_staff > 0
    ? (coverage.checks_last_30_days / total_staff)
    : 0;
  const mod7 =
    checksPerStaffMonth >= 0.5 ? 3 :
    checksPerStaffMonth >= 0.3 ? 1 :
    checksPerStaffMonth >= 0.1 ? 0 : -2;
  score += mod7;

  // mod8: Positives vs stressors balance (±3)
  // More positives than stressors = healthy culture
  const mod8 =
    stressor_profile.total_positives > stressor_profile.total_stressors ? 3 :
    stressor_profile.total_positives === stressor_profile.total_stressors ? 1 :
    stressor_profile.total_positives >= stressor_profile.total_stressors * 0.5 ? 0 : -3;
  score += mod8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const wellbeing_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (morale.avg_overall >= 7) strengths.push("Average staff morale is high, indicating a supportive working environment.");
  if (coverage.coverage_rate >= 80) strengths.push(`${coverage.coverage_rate}% of staff have had a wellbeing check — excellent coverage.`);
  if (morale.at_risk_count === 0) strengths.push("No staff members are currently flagged as at-risk.");
  if (actionRate >= 90 && supportNeeded > 0) strengths.push("Management responds to wellbeing concerns with agreed actions in almost all cases.");
  if (follow_ups.overdue_follow_ups === 0 && follow_ups.total_follow_ups_due > 0) strengths.push("All scheduled wellbeing follow-ups are on track — none overdue.");
  if (typesUsed >= 4) strengths.push(`${typesUsed} different check types used, showing a proactive and varied approach to staff support.`);
  if (stressor_profile.total_positives > stressor_profile.total_stressors) strengths.push("Staff report more positives than stressors — healthy cultural indicator.");
  if (morale.thriving_count > 0) strengths.push(`${morale.thriving_count} check(s) show staff scoring 7+ overall — thriving.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (morale.avg_overall < 5) concerns.push(`Average staff morale is low (${morale.avg_overall}/10) — urgent leadership attention needed.`);
  if (morale.at_risk_count > 0) concerns.push(`${morale.at_risk_count} staff member(s) scored ≤4 overall — at risk of burnout or disengagement.`);
  if (coverage.coverage_rate < 50) concerns.push(`Only ${coverage.coverage_rate}% of staff have had a wellbeing check — significant gaps in monitoring.`);
  if (follow_ups.overdue_follow_ups > 0) concerns.push(`${follow_ups.overdue_follow_ups} wellbeing follow-up(s) are overdue — support commitments not being met.`);
  if (actionRate < 70 && supportNeeded > 0) concerns.push("Staff requesting support are not consistently receiving agreed actions.");
  if (morale.avg_workload < 5) concerns.push(`Average workload score is low (${morale.avg_workload}/10) — staff feeling overburdened.`);
  if (stressor_profile.total_stressors > stressor_profile.total_positives * 2) concerns.push("Stressors significantly outweigh positives — team culture may be deteriorating.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 0;

  if (morale.at_risk_count > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Prioritise 1:1 support sessions for ${morale.at_risk_count} staff member(s) scoring ≤4 on wellbeing checks.`,
      urgency: "immediate",
      regulatory_ref: "Reg 33(4)(a)",
    });
  }
  if (follow_ups.overdue_follow_ups > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete ${follow_ups.overdue_follow_ups} overdue wellbeing follow-up(s) to demonstrate duty of care.`,
      urgency: "immediate",
      regulatory_ref: "Reg 33",
    });
  }
  if (coverage.coverage_rate < 60) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Extend wellbeing checks to all staff — aim for 100% coverage within 30 days.",
      urgency: "soon",
      regulatory_ref: "Reg 33(4)(a)",
    });
  }
  if (morale.avg_workload < 5) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review workload distribution and consider additional staffing or task reallocation.",
      urgency: "soon",
      regulatory_ref: "Reg 33(4)(c)",
    });
  }
  if (typesUsed < 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Introduce additional wellbeing check types (e.g., post-incident, self-referral) to broaden support culture.",
      urgency: "planned",
      regulatory_ref: null,
    });
  }
  if (stressor_profile.total_positives <= stressor_profile.total_stressors && wellbeing_checks.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Focus on building staff positives through recognition, team events, and professional development.",
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (morale.lowest_overall <= 3) {
    insights.push({
      text: `Lowest wellbeing score recorded is ${morale.lowest_overall}/10 — potential burnout risk requiring immediate intervention.`,
      severity: "critical",
    });
  }
  if (check_types.manager_concern > 0) {
    insights.push({
      text: `${check_types.manager_concern} manager-initiated concern check(s) recorded — proactive leadership identifying staff at risk.`,
      severity: check_types.manager_concern >= 2 ? "warning" : "positive",
    });
  }
  if (check_types.post_incident > 0) {
    insights.push({
      text: `${check_types.post_incident} post-incident wellbeing check(s) completed — evidence of reflective practice and staff support.`,
      severity: "positive",
    });
  }
  if (morale.avg_support >= 7) {
    insights.push({
      text: `Staff rate support at ${morale.avg_support}/10 on average — the team feels well-supported by management.`,
      severity: "positive",
    });
  }
  if (morale.avg_support < 5) {
    insights.push({
      text: `Average support score is only ${morale.avg_support}/10 — staff do not feel adequately supported.`,
      severity: "critical",
    });
  }
  if (follow_ups.overdue_follow_ups >= 3) {
    insights.push({
      text: `${follow_ups.overdue_follow_ups} follow-ups overdue — systemic failure to honour wellbeing commitments.`,
      severity: "critical",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    wellbeing_rating === "outstanding"
      ? "Exceptional staff wellbeing culture — proactive support, high morale, and comprehensive monitoring."
      : wellbeing_rating === "good"
      ? "Good staff wellbeing practices in place with minor areas for improvement."
      : wellbeing_rating === "adequate"
      ? "Staff wellbeing monitoring is adequate but gaps in coverage or follow-through need attention."
      : "Significant concerns about staff wellbeing — morale low, checks insufficient, or follow-ups overdue.";

  return {
    wellbeing_rating,
    wellbeing_score: score,
    headline,
    morale,
    coverage,
    check_types,
    stressor_profile,
    follow_ups,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
