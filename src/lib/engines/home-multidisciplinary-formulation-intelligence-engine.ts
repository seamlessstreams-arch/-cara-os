// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MULTI-DISCIPLINARY FORMULATION INTELLIGENCE ENGINE
// Pure deterministic engine: therapeutic formulation quality, 4P model
// completeness, multi-agency participation, child contribution, intervention
// planning, risk identification, review currency and model diversity.
// CHR 2015 Reg 15: "Health and well-being standard." SCCIF: Therapeutic care.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FormulationRecordInput {
  id: string;
  child_id: string;
  version: number;
  formulation_date: string; // ISO date
  model_used: string; // "5ps"|"cognitive_behavioural"|"attachment_based"|"trauma_informed"|"systemic"|"integrated"
  participant_count: number;
  presenting_difficulty_count: number;
  predisposing_count: number;
  precipitating_count: number;
  perpetuating_count: number;
  protective_count: number;
  key_hypothesis_count: number;
  agreed_intervention_count: number;
  risk_factor_count: number;
  has_child_contribution: boolean;
  has_next_review_date: boolean;
  has_shareable_summary: boolean;
}

export interface MultidisciplinaryFormulationInput {
  today: string;
  total_children: number;
  formulations: FormulationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FormulationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FormulationResult {
  formulation_rating: FormulationRating;
  formulation_score: number;
  headline: string;
  total_formulations: number;
  children_with_formulation_rate: number;
  four_p_completeness_rate: number;
  child_contribution_rate: number;
  intervention_planning_rate: number;
  multi_agency_rate: number;
  review_scheduled_rate: number;
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

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FormulationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeMultidisciplinaryFormulation(
  input: MultidisciplinaryFormulationInput,
): FormulationResult {
  const { formulations, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      formulation_rating: "insufficient_data",
      formulation_score: 0,
      headline: "No data available for multi-disciplinary formulation analysis",
      total_formulations: 0,
      children_with_formulation_rate: 0,
      four_p_completeness_rate: 0,
      child_contribution_rate: 0,
      intervention_planning_rate: 0,
      multi_agency_rate: 0,
      review_scheduled_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = formulations.length;
  const uniqueChildren = new Set(formulations.map(f => f.child_id)).size;
  const childrenWithFormulationRate = pct(uniqueChildren, total_children);

  // 4P completeness: each formulation scores 0-4 based on having predisposing, precipitating, perpetuating, protective factors
  const fourPScores = formulations.map(f => {
    let count = 0;
    if (f.predisposing_count > 0) count++;
    if (f.precipitating_count > 0) count++;
    if (f.perpetuating_count > 0) count++;
    if (f.protective_count > 0) count++;
    return count;
  });
  const totalFourPPoints = fourPScores.reduce((s, v) => s + v, 0);
  const fourPCompletenessRate = pct(totalFourPPoints, total * 4);

  const withChildContribution = formulations.filter(f => f.has_child_contribution).length;
  const childContributionRate = pct(withChildContribution, total);

  const withInterventions = formulations.filter(f => f.agreed_intervention_count > 0).length;
  const interventionPlanningRate = pct(withInterventions, total);

  const withMultipleParticipants = formulations.filter(f => f.participant_count >= 3).length;
  const multiAgencyRate = pct(withMultipleParticipants, total);

  const withReviewDate = formulations.filter(f => f.has_next_review_date).length;
  const reviewScheduledRate = pct(withReviewDate, total);

  const uniqueModels = new Set(formulations.map(f => f.model_used)).size;
  const withRiskFactors = formulations.filter(f => f.risk_factor_count > 0).length;
  const withShareableSummary = formulations.filter(f => f.has_shareable_summary).length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Children with formulations (coverage)
  if (total === 0) {
    score -= 3;
  } else {
    if (childrenWithFormulationRate >= 80) score += 6;
    else if (childrenWithFormulationRate >= 50) score += 2;
    else if (childrenWithFormulationRate < 30) score -= 5;
  }

  // Modifier 2: 4P model completeness
  if (total === 0) {
    score -= 1;
  } else {
    if (fourPCompletenessRate >= 85) score += 5;
    else if (fourPCompletenessRate >= 60) score += 2;
    else if (fourPCompletenessRate < 30) score -= 5;
  }

  // Modifier 3: Child contribution to formulation
  if (total === 0) {
    score -= 1;
  } else {
    if (childContributionRate >= 90) score += 5;
    else if (childContributionRate >= 60) score += 2;
    else if (childContributionRate < 30) score -= 4;
  }

  // Modifier 4: Agreed interventions from formulation
  if (total === 0) {
    // no adjustment
  } else {
    if (interventionPlanningRate >= 90) score += 5;
    else if (interventionPlanningRate >= 60) score += 2;
    else if (interventionPlanningRate < 30) score -= 4;
  }

  // Modifier 5: Multi-agency participation (3+ participants)
  if (total === 0) {
    score -= 1;
  } else {
    if (multiAgencyRate >= 80) score += 4;
    else if (multiAgencyRate >= 50) score += 1;
    else if (multiAgencyRate < 20) score -= 4;
  }

  // Modifier 6: Review scheduling
  if (total === 0) {
    score -= 2;
  } else {
    if (reviewScheduledRate >= 80) score += 5;
    else if (reviewScheduledRate >= 50) score += 2;
    else if (reviewScheduledRate < 30) score -= 3;
  }

  score = clamp(score, 0, 100);

  const formulation_rating = total === 0 && formulations.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenWithFormulationRate >= 80 && total > 0)
    strengths.push("Most children have multi-disciplinary formulations — the home provides structured therapeutic understanding for each child");
  if (fourPCompletenessRate >= 85 && total > 0)
    strengths.push("Formulations demonstrate thorough 4P analysis — predisposing, precipitating, perpetuating and protective factors are consistently explored");
  if (childContributionRate >= 90 && total > 0)
    strengths.push("Children actively contribute to their own formulations — their voice shapes therapeutic understanding");
  if (interventionPlanningRate >= 90 && total > 0)
    strengths.push("Formulations consistently translate into agreed interventions — therapeutic planning is action-oriented");
  if (multiAgencyRate >= 80 && total > 0)
    strengths.push("Multi-agency participation is strong — formulations benefit from diverse professional perspectives");
  if (reviewScheduledRate >= 80 && total > 0)
    strengths.push("Review dates are scheduled — formulations are treated as living documents that evolve with the child");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No multi-disciplinary formulations — the home lacks structured therapeutic understanding of children's needs");
  if (childrenWithFormulationRate < 50 && total > 0)
    concerns.push("Fewer than half of children have formulations — therapeutic care is not universally applied");
  if (fourPCompletenessRate < 30 && total > 0)
    concerns.push("4P model analysis is incomplete — formulations lack the depth needed for effective therapeutic planning");
  if (childContributionRate < 30 && total > 0)
    concerns.push("Children rarely contribute to their formulations — therapeutic understanding is being done to them, not with them");
  if (interventionPlanningRate < 30 && total > 0)
    concerns.push("Formulations do not translate into agreed interventions — the therapeutic process stops at assessment");
  if (multiAgencyRate < 20 && total > 0)
    concerns.push("Formulations lack multi-agency input — professional perspectives are too narrow");
  if (reviewScheduledRate < 30 && total > 0)
    concerns.push("Formulation reviews are not scheduled — therapeutic understanding may become stale");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: FormulationResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Commission multi-disciplinary formulations for every child using a recognised therapeutic model", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 15" });
  if (childrenWithFormulationRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Extend formulation coverage to all children to ensure universal therapeutic understanding", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 15" });
  if (fourPCompletenessRate < 60 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure all four domains (predisposing, precipitating, perpetuating, protective) are explored in every formulation", urgency: "soon", regulatory_ref: "SCCIF Therapeutic Care" });
  if (childContributionRate < 60 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Involve children in their formulation process using age-appropriate therapeutic tools", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  if (interventionPlanningRate < 60 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure every formulation generates specific, agreed therapeutic interventions with named leads", urgency: "soon", regulatory_ref: "CHR 2015 Reg 15" });
  if (multiAgencyRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Invite external professionals (CAMHS, education, social work) to formulation meetings for richer perspectives", urgency: "planned", regulatory_ref: "SCCIF Experiences" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: FormulationResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No formulations means Ofsted cannot verify trauma-informed practice — this is a significant gap for any therapeutic home", severity: "critical" });
  if (total > 0 && fourPCompletenessRate >= 85 && childContributionRate >= 80)
    insights.push({ text: "Comprehensive formulations with strong child voice demonstrate outstanding therapeutic practice", severity: "positive" });
  if (uniqueModels >= 3 && total > 0)
    insights.push({ text: "Multiple formulation models in use shows the home tailors therapeutic approaches to individual children's needs", severity: "positive" });
  if (total > 0 && withRiskFactors >= total * 0.8)
    insights.push({ text: "Risk factors are consistently identified in formulations — the home integrates safeguarding into therapeutic understanding", severity: "positive" });
  if (total > 0 && withShareableSummary >= total * 0.7)
    insights.push({ text: "Shareable summaries enable other professionals to understand children's therapeutic formulations — supporting multi-agency working", severity: "positive" });
  if (total > 0 && interventionPlanningRate < 50)
    insights.push({ text: "Formulations without agreed interventions suggest a disconnect between therapeutic assessment and day-to-day care practice", severity: "warning" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (formulation_rating === "insufficient_data") {
    headline = "No data available for multi-disciplinary formulation analysis";
  } else if (formulation_rating === "outstanding") {
    headline = "Outstanding therapeutic formulations — children's needs are deeply understood through structured multi-agency analysis";
  } else if (formulation_rating === "good") {
    headline = "Good formulation practice with comprehensive 4P analysis and child contribution";
  } else if (formulation_rating === "adequate") {
    headline = "Formulations exist but completeness, child voice or intervention planning needs strengthening";
  } else {
    headline = "Inadequate formulation practice — children's therapeutic needs are not systematically understood";
  }

  return {
    formulation_rating,
    formulation_score: score,
    headline,
    total_formulations: total,
    children_with_formulation_rate: childrenWithFormulationRate,
    four_p_completeness_rate: fourPCompletenessRate,
    child_contribution_rate: childContributionRate,
    intervention_planning_rate: interventionPlanningRate,
    multi_agency_rate: multiAgencyRate,
    review_scheduled_rate: reviewScheduledRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
