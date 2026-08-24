// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PRACTICE OBSERVATION & COMPETENCY INTELLIGENCE ENGINE
// Pure deterministic engine: practice observation quality, outcomes, domain
// coverage, sign-off rates, development tracking, and competency assurance.
// CHR 2015 Reg 33: "Fitness of staff." SCCIF: "Staff competency."
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PracticeObservationInput {
  id: string;
  staff_id: string;
  outcome: string; // "outstanding"|"meets_standard"|"developing"|"requires_support"
  domains_observed_count: number;
  strengths_count: number;
  development_areas_count: number;
  signed_off_by_staff: boolean;
  has_staff_response: boolean;
  has_linked_development_plan: boolean;
}

export interface PracticeObservationCompetencyInput {
  today: string;
  total_staff: number;
  observations: PracticeObservationInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PracticeObservationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PracticeObservationResult {
  observation_rating: PracticeObservationRating;
  observation_score: number;
  headline: string;
  total_observations: number;
  /** null when the population is empty — nothing measured, not 0%. */
  outstanding_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  meets_standard_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  sign_off_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  development_plan_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staff_response_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staff_observed_rate: number | null;
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

function toRating(score: number): PracticeObservationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computePracticeObservationCompetency(
  input: PracticeObservationCompetencyInput,
): PracticeObservationResult {
  const { observations, total_staff } = input;

  // Insufficient data guard
  if (total_staff === 0) {
    return {
      observation_rating: "insufficient_data",
      observation_score: 0,
      headline: "No data available for practice observation analysis",
      total_observations: 0,
      outstanding_rate: null,
      meets_standard_rate: null,
      sign_off_rate: null,
      development_plan_rate: null,
      staff_response_rate: null,
      staff_observed_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = observations.length;

  const outstanding = observations.filter(o => o.outcome === "outstanding").length;
  const outstandingRate = rate(outstanding, total);

  const meetsStandard = observations.filter(o =>
    o.outcome === "outstanding" || o.outcome === "meets_standard"
  ).length;
  const meetsStandardRate = rate(meetsStandard, total);

  const signedOff = observations.filter(o => o.signed_off_by_staff).length;
  const signOffRate = rate(signedOff, total);

  const withDevPlan = observations.filter(o => o.has_linked_development_plan).length;
  const devPlanRate = rate(withDevPlan, total);

  const withResponse = observations.filter(o => o.has_staff_response).length;
  const staffResponseRate = rate(withResponse, total);

  const uniqueStaffObserved = new Set(observations.map(o => o.staff_id)).size;
  const staffObservedRate = rate(uniqueStaffObserved, total_staff);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Quality outcomes (meets standard or above)
  if (total === 0) {
    score -= 3;
  } else {
    if (meets(meetsStandardRate, 90)) score += 5;
    else if (meets(meetsStandardRate, 70)) score += 2;
    else if (below(meetsStandardRate, 50)) score -= 5;
  }

  // Modifier 2: Staff coverage (% of team observed)
  if (total === 0) {
    // already penalised above
  } else {
    if (meets(staffObservedRate, 80)) score += 6;
    else if (meets(staffObservedRate, 50)) score += 2;
    else if (below(staffObservedRate, 30)) score -= 5;
  }

  // Modifier 3: Sign-off rate (staff acknowledged)
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(signOffRate, 90)) score += 5;
    else if (meets(signOffRate, 70)) score += 2;
    else if (below(signOffRate, 50)) score -= 4;
  }

  // Modifier 4: Staff response engagement
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(staffResponseRate, 80)) score += 5;
    else if (meets(staffResponseRate, 50)) score += 2;
    else if (below(staffResponseRate, 30)) score -= 5;
  }

  // Modifier 5: Development plan linkage
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(devPlanRate, 80)) score += 4;
    else if (meets(devPlanRate, 50)) score += 1;
    else if (below(devPlanRate, 30)) score -= 4;
  }

  // Modifier 6: Observation frequency (per staff ratio)
  const obsPerStaff = total_staff > 0 ? total / total_staff : 0;
  if (obsPerStaff >= 2) score += 5;
  else if (obsPerStaff >= 1) score += 2;
  else if (total === 0) score -= 5;
  else score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Practice observations are thorough, regular and drive staff development effectively";
      break;
    case "good":
      headline = "Good practice observation programme with effective feedback and development linkage";
      break;
    case "adequate":
      headline = "Practice observation programme is adequate but needs more coverage and follow-through";
      break;
    case "inadequate":
      headline = "Practice observation programme is inadequate — staff competency is not being assured";
      break;
    default:
      headline = "No data available for practice observation analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(meetsStandardRate, 90) && total > 0) strengths.push("All observed staff meet or exceed practice standards — strong evidence of competency");
  if (meets(staffObservedRate, 80) && total > 0) strengths.push("Comprehensive staff coverage ensures no team member's practice goes unobserved");
  if (meets(signOffRate, 90) && total > 0) strengths.push("Staff consistently acknowledge and engage with observation feedback");
  if (meets(staffResponseRate, 80) && total > 0) strengths.push("Staff actively reflect on observations — demonstrating a learning culture");
  if (meets(devPlanRate, 80) && total > 0) strengths.push("Observations are systematically linked to development plans — learning is structured");
  if (meets(outstandingRate, 50) && total > 0) strengths.push("High proportion of outstanding practice observed — staff deliver exceptional care");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No practice observations recorded — staff competency cannot be evidenced");
  if (below(meetsStandardRate, 50) && total > 0) concerns.push("Majority of observations identify staff not yet meeting expected standards");
  if (below(staffObservedRate, 30) && total > 0) concerns.push("Most staff have not been observed — competency assurance has significant gaps");
  if (below(signOffRate, 50) && total > 0) concerns.push("Staff are not signing off observations — feedback loop is broken");
  if (below(staffResponseRate, 30) && total > 0) concerns.push("Staff rarely respond to observations — reflective practice is absent");
  if (below(devPlanRate, 30) && total > 0) concerns.push("Observations are not linked to development plans — learning is not structured");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: PracticeObservationResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Establish a regular practice observation schedule covering all staff", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 33" });
  }
  if (below(staffObservedRate, 50) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Extend observation programme to cover all team members within a rolling cycle", urgency: "soon", regulatory_ref: "CHR 2015 Reg 33" });
  }
  if (below(meetsStandardRate, 70) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Provide targeted support for staff whose observations identify development needs", urgency: "immediate", regulatory_ref: "SCCIF Competency" });
  }
  if (below(signOffRate, 70) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure all observations are formally acknowledged and signed off by staff", urgency: "soon", regulatory_ref: "CHR 2015 Reg 33" });
  }
  if (below(devPlanRate, 50) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Link observation outcomes to individual development plans for actionable learning", urgency: "planned", regulatory_ref: "SCCIF Staff Development" });
  }
  if (obsPerStaff < 1 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Increase observation frequency to at least one per staff member per review period", urgency: "soon", regulatory_ref: "CHR 2015 Reg 33" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: PracticeObservationResult["insights"] = [];

  if (meets(meetsStandardRate, 90) && meets(staffObservedRate, 80) && total > 0) {
    insights.push({ text: "Comprehensive observation programme with consistently high standards — robust competency evidence for Ofsted", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "Without practice observations, the home cannot demonstrate staff are competent — a critical gap for regulators", severity: "critical" });
  }
  if (below(meetsStandardRate, 50) && total > 0) {
    insights.push({ text: "Low competency rates suggest systemic workforce development needs — consider targeted training investment", severity: "warning" });
  }
  if (meets(staffResponseRate, 80) && meets(signOffRate, 90) && total > 0) {
    insights.push({ text: "Strong staff engagement with observations indicates a genuine learning culture — care quality benefits directly", severity: "positive" });
  }
  if (meets(outstandingRate, 50) && total > 0) {
    insights.push({ text: "Over half of observations rate as outstanding — this team delivers exceptional practice worthy of recognition", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    observation_rating: rating,
    observation_score: score,
    headline,
    total_observations: total,
    outstanding_rate: outstandingRate,
    meets_standard_rate: meetsStandardRate,
    sign_off_rate: signOffRate,
    development_plan_rate: devPlanRate,
    staff_response_rate: staffResponseRate,
    staff_observed_rate: staffObservedRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
