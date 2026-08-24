// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SELF-EVALUATION & IMPROVEMENT INTELLIGENCE ENGINE
// Pure deterministic engine: self-evaluation grades, evidence quality, action
// completion, development areas addressed, and continuous improvement culture.
// CHR 2015 Reg 45: "Review of quality of care." SCCIF: Quality & improvement.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SelfEvaluationAreaInput {
  id: string;
  area: string;
  self_grade: string; // "outstanding"|"good"|"requires_improvement"|"inadequate"
  strengths_count: number;
  evidence_count: number;
  development_areas_count: number;
  actions_total: number;
  actions_completed: number;
}

export interface SelfEvaluationInput {
  today: string;
  total_children: number;
  areas: SelfEvaluationAreaInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SelfEvaluationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SelfEvaluationResult {
  evaluation_rating: SelfEvaluationRating;
  evaluation_score: number | null;
  headline: string;
  total_areas: number;
  good_or_outstanding_rate: number | null;
  action_completion_rate: number | null;
  evidence_coverage_rate: number | null;
  areas_with_development_plans: number;
  average_strengths_per_area: number | null;
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

function toRating(score: number): SelfEvaluationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeSelfEvaluationImprovement(
  input: SelfEvaluationInput,
): SelfEvaluationResult {
  const { areas, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      evaluation_rating: "insufficient_data",
      evaluation_score: 0,
      headline: "No data available for self-evaluation analysis",
      total_areas: 0,
      good_or_outstanding_rate: 0,
      action_completion_rate: 0,
      evidence_coverage_rate: 0,
      areas_with_development_plans: 0,
      average_strengths_per_area: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = areas.length;

  const goodOrOutstanding = areas.filter(a =>
    a.self_grade === "outstanding" || a.self_grade === "good"
  ).length;
  const goodRate = rate(goodOrOutstanding, total);

  const totalActions = areas.reduce((s, a) => s + a.actions_total, 0);
  const completedActions = areas.reduce((s, a) => s + a.actions_completed, 0);
  const actionCompletionRate = rate(completedActions, totalActions);

  const withEvidence = areas.filter(a => a.evidence_count > 0).length;
  const evidenceCoverageRate = rate(withEvidence, total);

  const withDevAreas = areas.filter(a => a.development_areas_count > 0).length;

  const totalStrengths = areas.reduce((s, a) => s + a.strengths_count, 0);
  const avgStrengths = total > 0 ? Math.round((totalStrengths / total) * 10) / 10 : null;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Self-grading quality (% good/outstanding)
  if (total === 0) {
    score -= 5;
  } else {
    if (meets(goodRate, 80)) score += 5;
    else if (meets(goodRate, 60)) score += 2;
    else if (below(goodRate, 40)) score -= 5;
  }

  // Modifier 2: Action completion rate
  if (totalActions === 0 && total > 0) {
    score += 2;
  } else if (totalActions === 0) {
    // no areas at all
  } else {
    if (meets(actionCompletionRate, 90)) score += 6;
    else if (meets(actionCompletionRate, 70)) score += 2;
    else if (below(actionCompletionRate, 50)) score -= 5;
  }

  // Modifier 3: Evidence coverage
  if (total === 0) {
    // already penalised
  } else {
    if (meets(evidenceCoverageRate, 90)) score += 5;
    else if (meets(evidenceCoverageRate, 70)) score += 2;
    else if (below(evidenceCoverageRate, 50)) score -= 4;
  }

  // Modifier 4: Development areas identified (honest self-reflection)
  if (total === 0) {
    // no adjustment
  } else {
    if (withDevAreas >= total) score += 5;
    else if (withDevAreas >= Math.ceil(total * 0.5)) score += 2;
    else if (withDevAreas === 0) score -= 5;
  }

  // Modifier 5: Strengths documentation depth
  if (total === 0) {
    score -= 1;
  } else {
    if ((avgStrengths ?? 0) >= 5) score += 4;
    else if ((avgStrengths ?? 0) >= 3) score += 1;
    else if ((avgStrengths ?? 0) < 1) score -= 4;
  }

  // Modifier 6: Area coverage breadth
  if (total >= 5) score += 5;
  else if (total >= 3) score += 2;
  else if (total === 0) score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Self-evaluation is rigorous, evidence-based and drives continuous improvement across the home";
      break;
    case "good":
      headline = "Good self-evaluation practice with honest reflection and effective action planning";
      break;
    case "adequate":
      headline = "Self-evaluation exists but needs more depth, evidence and follow-through on actions";
      break;
    case "inadequate":
      headline = "Self-evaluation practice is inadequate — the home cannot demonstrate a culture of improvement";
      break;
    default:
      headline = "No data available for self-evaluation analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(goodRate, 80) && total > 0) strengths.push("Self-evaluation consistently rates the home as good or outstanding across key areas");
  if (meets(actionCompletionRate, 90) && totalActions > 0) strengths.push("Improvement actions are completed promptly — self-evaluation drives real change");
  if (meets(evidenceCoverageRate, 90) && total > 0) strengths.push("Every evaluated area is supported by documented evidence");
  if (withDevAreas >= total && total > 0) strengths.push("All areas include honest identification of development needs — a mature improvement culture");
  if ((avgStrengths ?? 0) >= 5 && total > 0) strengths.push("Strengths are richly documented with detailed examples of good practice");
  if (total >= 5) strengths.push("Comprehensive self-evaluation covers all key domains of children's home practice");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No self-evaluation recorded — the home has no framework for continuous improvement");
  if (below(goodRate, 40) && total > 0) concerns.push("Majority of self-evaluated areas are below good — significant quality concerns");
  if (below(actionCompletionRate, 50) && totalActions > 0) concerns.push("Improvement actions are not being completed — self-evaluation lacks follow-through");
  if (below(evidenceCoverageRate, 50) && total > 0) concerns.push("Most evaluated areas lack evidence — self-grades cannot be substantiated");
  if (withDevAreas === 0 && total > 0) concerns.push("No development areas identified — this suggests complacency rather than genuine reflection");
  if ((avgStrengths ?? 0) < 1 && total > 0) concerns.push("Strengths are poorly documented — good practice is not being captured");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: SelfEvaluationResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Develop a comprehensive self-evaluation framework covering all SCCIF domains", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 45" });
  }
  if (below(actionCompletionRate, 70) && totalActions > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Implement tracking to ensure all self-evaluation actions are completed within timescales", urgency: "soon", regulatory_ref: "SCCIF Quality" });
  }
  if (below(evidenceCoverageRate, 70) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure every self-evaluated area is supported by specific, verifiable evidence", urgency: "soon", regulatory_ref: "CHR 2015 Reg 45" });
  }
  if (withDevAreas < Math.ceil(total * 0.5) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Conduct honest reflection to identify development areas in every domain", urgency: "soon", regulatory_ref: "SCCIF Quality" });
  }
  if (below(goodRate, 60) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Develop targeted improvement plans for areas self-graded below good", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 45" });
  }
  if (total > 0 && total < 3) {
    recs.push({ rank: recs.length + 1, recommendation: "Expand self-evaluation to cover additional SCCIF domains for comprehensive assurance", urgency: "planned", regulatory_ref: "SCCIF Quality" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: SelfEvaluationResult["insights"] = [];

  if (meets(goodRate, 80) && meets(actionCompletionRate, 90) && meets(evidenceCoverageRate, 90) && total >= 3) {
    insights.push({ text: "Self-evaluation is exemplary — rigorous, evidence-based and drives tangible improvement across the home", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No self-evaluation means Ofsted cannot see continuous improvement — this is a significant regulatory gap", severity: "critical" });
  }
  if (below(actionCompletionRate, 50) && totalActions > 0) {
    insights.push({ text: "Self-evaluation without action completion is a paper exercise — it must drive actual change", severity: "warning" });
  }
  if (withDevAreas >= total && total > 0) {
    insights.push({ text: "Honest self-reflection across all areas shows maturity — the home knows its strengths and its gaps", severity: "positive" });
  }
  if (below(goodRate, 40) && total > 0) {
    insights.push({ text: "Low self-grades suggest the home is struggling across multiple domains — strategic intervention needed", severity: "warning" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    evaluation_rating: rating,
    evaluation_score: score,
    headline,
    total_areas: total,
    good_or_outstanding_rate: goodRate,
    action_completion_rate: actionCompletionRate,
    evidence_coverage_rate: evidenceCoverageRate,
    areas_with_development_plans: withDevAreas,
    average_strengths_per_area: avgStrengths,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
