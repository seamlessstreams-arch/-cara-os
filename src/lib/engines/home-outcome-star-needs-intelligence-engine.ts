// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME OUTCOME STAR & NEEDS INTELLIGENCE ENGINE
// Tracks Outcome Star assessments, needs identification and response, KPI achievement,
// and improvement trajectories to evidence children's progress.
// Pure deterministic engine. CHR 2015 Reg 5/10.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface OutcomeStarInput {
  id: string;
  child_id: string;
  date: string;
  average_score: number;            // 1-10 average across domains
  previous_average_score: number | null;
  has_action_plan: boolean;
  child_participated: boolean;
}

export interface NeedsAssessmentInput {
  id: string;
  child_id: string;
  date: string;
  assessment_complete: boolean;
  needs_identified: number;
  needs_addressed: number;
}

export interface KpiInput {
  id: string;
  category: string;
  target: number;
  actual: number;
  met: boolean;
}

export interface OutcomeStarNeedsInput {
  today: string;
  total_children: number;
  outcome_stars: OutcomeStarInput[];
  needs_assessments: NeedsAssessmentInput[];
  kpis: KpiInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type OutcomeStarRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface OutcomeStarResult {
  outcome_rating: OutcomeStarRating;
  outcome_score: number;
  headline: string;
  children_assessed: number;
  average_outcome_score: number;
  children_improving: number;
  needs_addressed_rate: number;
  kpi_met_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): OutcomeStarRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeOutcomeStarNeeds(
  input: OutcomeStarNeedsInput,
): OutcomeStarResult {
  const { today, total_children, outcome_stars, needs_assessments, kpis } = input;

  // ── Insufficient data guard ────────────────────────────────────────
  if (total_children === 0) {
    return {
      outcome_rating: "insufficient_data",
      outcome_score: 0,
      headline: "No children recorded — Outcome Star and needs assessment cannot be evaluated.",
      children_assessed: 0,
      average_outcome_score: 0,
      children_improving: 0,
      needs_addressed_rate: 0,
      kpi_met_rate: 0,
      strengths: [],
      concerns: ["No children are recorded in the home — outcomes cannot be assessed."],
      recommendations: [{ rank: 1, recommendation: "Ensure child records are populated before Outcome Star assessments can be evaluated.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" }],
      insights: [{ text: "No children are recorded. Without an active cohort, Outcome Star assessments, needs tracking, and KPI achievement cannot be measured. This represents a fundamental data gap.", severity: "critical" }],
    };
  }

  // ── Derived metrics ────────────────────────────────────────────────
  const childIdsWithStars = new Set(outcome_stars.map(s => s.child_id));
  const childrenAssessed = childIdsWithStars.size;
  const assessmentCoverage = pct(childrenAssessed, total_children);

  // Average outcome score across all stars
  const avgOutcomeScore = outcome_stars.length > 0
    ? Math.round((outcome_stars.reduce((s, os) => s + os.average_score, 0) / outcome_stars.length) * 10) / 10
    : 0;

  // Improvement trajectory: children where current > previous (only those with previous)
  const starsWithPrevious = outcome_stars.filter(s => s.previous_average_score !== null);
  const childrenImproving = starsWithPrevious.filter(
    s => s.average_score > (s.previous_average_score as number),
  ).length;
  const improvementRate = pct(childrenImproving, starsWithPrevious.length);

  // Child participation
  const participatingStars = outcome_stars.filter(s => s.child_participated).length;
  const participationRate = pct(participatingStars, outcome_stars.length);

  // Needs addressed
  const totalNeedsIdentified = needs_assessments.reduce((s, n) => s + n.needs_identified, 0);
  const totalNeedsAddressed = needs_assessments.reduce((s, n) => s + n.needs_addressed, 0);
  const needsAddressedRate = pct(totalNeedsAddressed, totalNeedsIdentified);

  // KPI achievement
  const kpisMet = kpis.filter(k => k.met).length;
  const kpiMetRate = pct(kpisMet, kpis.length);

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 6 modifiers → max 81, clamped 0–100
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Mod 1: Assessment coverage (±6) ─────────────────────────────────
  if (assessmentCoverage >= 90) score += 6;
  else if (assessmentCoverage >= 70) score += 3;
  else if (assessmentCoverage >= 50) score += 0;
  else score -= 6;

  // ── Mod 2: Outcome score quality (±5) ───────────────────────────────
  if (outcome_stars.length > 0) {
    if (avgOutcomeScore >= 7) score += 5;
    else if (avgOutcomeScore >= 5) score += 2;
    else if (avgOutcomeScore >= 4) score += 0;
    else score -= 5;
  }
  // If no stars, +0

  // ── Mod 3: Improvement trajectory (±5) ──────────────────────────────
  if (starsWithPrevious.length > 0) {
    if (improvementRate >= 70) score += 5;
    else if (improvementRate >= 50) score += 2;
    else if (improvementRate >= 30) score += 0;
    else score -= 5;
  } else {
    score += 1;
  }

  // ── Mod 4: Child participation (±4) ─────────────────────────────────
  if (outcome_stars.length > 0) {
    if (participationRate >= 90) score += 4;
    else if (participationRate >= 70) score += 2;
    else if (participationRate >= 50) score += 0;
    else score -= 4;
  }
  // If no stars, +0

  // ── Mod 5: Needs addressed (±5) ────────────────────────────────────
  if (needs_assessments.length > 0) {
    if (needsAddressedRate >= 85) score += 5;
    else if (needsAddressedRate >= 70) score += 3;
    else if (needsAddressedRate >= 50) score += 0;
    else score -= 5;
  }
  // If no needs assessments, +0

  // ── Mod 6: KPI achievement (±4) ────────────────────────────────────
  if (kpis.length > 0) {
    if (kpiMetRate >= 80) score += 4;
    else if (kpiMetRate >= 60) score += 2;
    else if (kpiMetRate >= 40) score += 0;
    else score -= 4;
  } else {
    score += 1;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: OutcomeStarResult["recommendations"] = [];
  const insights: OutcomeStarResult["insights"] = [];
  let rank = 0;

  // ── Strengths ─────────────────────────────────────────────────────
  if (assessmentCoverage >= 90) {
    strengths.push(`${assessmentCoverage}% of children have Outcome Star assessments — comprehensive assessment coverage across the home.`);
  }
  if (avgOutcomeScore >= 7 && outcome_stars.length > 0) {
    strengths.push(`Average Outcome Star score of ${avgOutcomeScore} out of 10 — children are achieving strong outcomes across assessed domains.`);
  }
  if (starsWithPrevious.length > 0 && improvementRate >= 70) {
    strengths.push(`${improvementRate}% of children with previous assessments are improving — clear upward trajectory in outcomes.`);
  }
  if (participationRate >= 90 && outcome_stars.length > 0) {
    strengths.push(`${participationRate}% child participation in Outcome Star assessments — excellent child engagement in their own progress review.`);
  }
  if (needsAddressedRate >= 85 && needs_assessments.length > 0) {
    strengths.push(`${needsAddressedRate}% of identified needs are being addressed — responsive and effective needs management.`);
  }
  if (kpiMetRate >= 80 && kpis.length > 0) {
    strengths.push(`${kpiMetRate}% of KPIs met — the home is consistently achieving its outcome targets.`);
  }
  if (outcome_stars.length > 0) {
    const withActionPlan = outcome_stars.filter(s => s.has_action_plan).length;
    const actionPlanRate = pct(withActionPlan, outcome_stars.length);
    if (actionPlanRate >= 90) {
      strengths.push(`${actionPlanRate}% of Outcome Star assessments have associated action plans — strong planning discipline.`);
    }
  }

  // ── Concerns ──────────────────────────────────────────────────────
  if (assessmentCoverage < 50) {
    concerns.push(`Only ${assessmentCoverage}% of children have Outcome Star assessments — majority of children's outcomes are not being tracked.`);
  }
  if (avgOutcomeScore < 4 && outcome_stars.length > 0) {
    concerns.push(`Average Outcome Star score of ${avgOutcomeScore} out of 10 — children's outcomes are significantly below expectations.`);
  }
  if (starsWithPrevious.length > 0 && improvementRate < 30) {
    concerns.push(`Only ${improvementRate}% of children are improving — the majority are stagnating or declining in their outcomes.`);
  }
  if (participationRate < 50 && outcome_stars.length > 0) {
    concerns.push(`Only ${participationRate}% child participation in assessments — children's voices are not being heard in their own progress reviews.`);
  }
  if (needsAddressedRate < 50 && needs_assessments.length > 0) {
    concerns.push(`Only ${needsAddressedRate}% of identified needs are being addressed — significant unmet needs across the home.`);
  }
  if (kpiMetRate < 40 && kpis.length > 0) {
    concerns.push(`Only ${kpiMetRate}% of KPIs met — the home is failing to meet the majority of its outcome targets.`);
  }
  if (outcome_stars.length === 0 && total_children > 0) {
    concerns.push("No Outcome Star assessments have been completed — children's progress cannot be evidenced.");
  }

  // ── Recommendations ───────────────────────────────────────────────
  if (assessmentCoverage < 50 && total_children > 0) {
    const uncovered = total_children - childrenAssessed;
    recommendations.push({ rank: ++rank, recommendation: `${uncovered} child${uncovered > 1 ? "ren" : ""} ha${uncovered > 1 ? "ve" : "s"} no Outcome Star assessment — complete assessments for all children to evidence their progress and inform care planning.`, urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  }
  if (participationRate < 50 && outcome_stars.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Increase child participation in Outcome Star assessments — ensure every child has the opportunity to contribute to their own review.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 10" });
  }
  if (needsAddressedRate < 50 && needs_assessments.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Address the backlog of unmet needs — review care plans and allocate resources to close gaps in identified needs.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  }
  if (starsWithPrevious.length > 0 && improvementRate < 30) {
    recommendations.push({ rank: ++rank, recommendation: "Review intervention strategies for children not improving — consider multi-agency input and updated therapeutic approaches.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5" });
  }
  if (kpiMetRate < 40 && kpis.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review KPI targets and delivery plans — the majority of outcomes targets are not being met, which may indicate unrealistic targets or insufficient resource allocation.", urgency: "soon", regulatory_ref: null });
  }
  if (outcome_stars.length === 0 && total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Implement Outcome Star assessments for all children — this is essential for evidencing progress and meeting regulatory expectations under Reg 5.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  }
  if (outcome_stars.length > 0) {
    const withoutActionPlan = outcome_stars.filter(s => !s.has_action_plan).length;
    if (withoutActionPlan > 0) {
      recommendations.push({ rank: ++rank, recommendation: `${withoutActionPlan} Outcome Star assessment${withoutActionPlan > 1 ? "s lack" : " lacks"} an action plan — ensure every assessment results in a clear, actionable plan for the child.`, urgency: "soon", regulatory_ref: "CHR 2015 Reg 5" });
    }
  }

  // ── Insights ──────────────────────────────────────────────────────
  if (rating === "outstanding") {
    insights.push({ text: `Exemplary outcomes practice — ${childrenAssessed} children assessed with an average score of ${avgOutcomeScore}/10, ${improvementRate}% improving, and ${needsAddressedRate}% of needs addressed. Ofsted inspectors will find robust evidence that the home is making a measurable, sustained difference to children's lives.`, severity: "positive" });
  }
  if (rating === "good") {
    insights.push({ text: `Good outcomes framework in place — ${childrenAssessed} children assessed with ${improvementRate}% showing improvement. The home demonstrates consistent progress monitoring, though there may be opportunities to strengthen coverage or child participation further.`, severity: "positive" });
  }
  if (assessmentCoverage < 50 && total_children > 0) {
    insights.push({ text: `Only ${assessmentCoverage}% of children have Outcome Star assessments. Regulation 5 requires the registered person to ensure care is provided in a way that promotes each child's welfare. Without systematic outcome measurement, the home cannot demonstrate it is meeting this standard.`, severity: "critical" });
  }
  if (starsWithPrevious.length > 0 && improvementRate < 30) {
    insights.push({ text: `Only ${improvementRate}% of children are improving between assessments. Under SCCIF, inspectors specifically look for evidence that children are making progress. A low improvement rate across the home may indicate that care plans and interventions need fundamental review.`, severity: "critical" });
  }
  if (needsAddressedRate < 50 && needs_assessments.length > 0) {
    insights.push({ text: `Only ${needsAddressedRate}% of identified needs are being addressed. Unmet needs represent a safeguarding risk and demonstrate a gap between assessment and delivery. Inspectors will expect to see that identified needs result in action.`, severity: "critical" });
  }
  if (participationRate >= 90 && outcome_stars.length > 0 && starsWithPrevious.length > 0 && improvementRate >= 70) {
    insights.push({ text: `Strong correlation between high child participation (${participationRate}%) and strong improvement rates (${improvementRate}%) — children who are engaged in their own assessments are more likely to make progress. This evidences genuinely child-centred practice.`, severity: "positive" });
  }
  if (kpiMetRate >= 80 && kpis.length > 0 && needsAddressedRate >= 85 && needs_assessments.length > 0) {
    insights.push({ text: `KPI achievement of ${kpiMetRate}% aligns with ${needsAddressedRate}% needs addressed rate — the home's performance targets are translating into real improvements for children.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding outcomes practice — ${childrenAssessed} children assessed, average score ${avgOutcomeScore}/10, ${improvementRate}% improving with ${needsAddressedRate}% of needs addressed.`;
  } else if (rating === "good") {
    headline = `Good outcomes tracking — ${childrenAssessed} children assessed with ${improvementRate}% showing improvement across Outcome Star domains.`;
  } else if (rating === "adequate") {
    headline = `Adequate outcomes framework — progress is mixed with ${assessmentCoverage < 50 ? "limited assessment coverage" : "inconsistent improvement trajectories"} requiring attention.`;
  } else {
    headline = `Inadequate outcomes practice — ${assessmentCoverage < 50 ? "significant assessment gaps" : "poor improvement rates and unmet needs"} require urgent action.`;
  }

  return {
    outcome_rating: rating,
    outcome_score: score,
    headline,
    children_assessed: childrenAssessed,
    average_outcome_score: avgOutcomeScore,
    children_improving: childrenImproving,
    needs_addressed_rate: needsAddressedRate,
    kpi_met_rate: kpiMetRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
