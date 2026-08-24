// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME OUTCOME STAR ASSESSMENT INTELLIGENCE ENGINE
// Pure deterministic engine: assessment coverage, score progression,
// domain balance, action plan quality, child voice, staff alignment,
// and multi-domain trend analysis.
// CHR 2015 Reg 6 (Health) / Reg 9 (Promoting contact).
// SCCIF: Experiences and progress; Health and well-being.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface OutcomeStarRecordInput {
  id: string;
  child_id: string;
  date: string; // ISO date
  domain_count: number; // how many domains were scored (out of 10)
  average_score: number | null; // average across scored domains (1-10)
  lowest_domain_score: number | null; // min score across domains
  highest_domain_score: number | null; // max score across domains
  domains_improved_count: number; // domains where score > previous_score
  domains_declined_count: number; // domains where score < previous_score
  domains_stable_count: number; // domains unchanged
  has_previous_scores: boolean;
  action_plan_count: number;
  has_child_views: boolean;
  has_staff_views: boolean;
}

export interface OutcomeStarInput {
  today: string;
  total_children: number;
  assessments: OutcomeStarRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type OutcomeStarRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface OutcomeStarResult {
  star_rating: OutcomeStarRating;
  star_score: number | null;
  headline: string;
  total_assessments: number;
  children_assessed_rate: number | null;
  repeat_assessment_rate: number | null;
  average_score_across_home: number | null;
  improvement_rate: number | null;
  action_plan_rate: number | null;
  child_voice_rate: number | null;
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

function toRating(score: number): OutcomeStarRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeOutcomeStarAssessment(
  input: OutcomeStarInput,
): OutcomeStarResult {
  const { assessments, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      star_rating: "insufficient_data",
      star_score: 0,
      headline: "No data available for Outcome Star intelligence analysis",
      total_assessments: 0,
      children_assessed_rate: null,
      repeat_assessment_rate: null,
      average_score_across_home: 0,
      improvement_rate: null,
      action_plan_rate: null,
      child_voice_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = assessments.length;
  const uniqueChildren = new Set(assessments.map(a => a.child_id)).size;
  const childrenAssessedRate = pct(uniqueChildren, total_children);

  // Repeat assessments: children with previous scores
  const withPrevious = assessments.filter(a => a.has_previous_scores);
  const repeatAssessmentRate = pct(withPrevious.length, total);

  // Average score across all assessments
  const avgScoreSum = assessments.reduce((s, a) => s + (a.average_score ?? 0), 0);
  const averageScoreAcrossHome = total > 0 ? Math.round((avgScoreSum / total) * 10) / 10 : null;

  // Improvement rate: assessments where domains_improved > domains_declined
  const improving = withPrevious.filter(a => a.domains_improved_count > a.domains_declined_count);
  const improvementRate = pct(improving.length, withPrevious.length);

  // Action plan coverage
  const withActionPlans = assessments.filter(a => a.action_plan_count > 0).length;
  const actionPlanRate = pct(withActionPlans, total);

  // Child voice
  const withChildVoice = assessments.filter(a => a.has_child_views).length;
  const childVoiceRate = pct(withChildVoice, total);

  // Staff views
  const withStaffViews = assessments.filter(a => a.has_staff_views).length;

  // Domain completeness
  const fullDomainAssessments = assessments.filter(a => a.domain_count >= 10).length;

  // Declining assessments
  const declining = withPrevious.filter(a => a.domains_declined_count > a.domains_improved_count);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Assessment coverage
  if (total === 0) {
    score -= 3;
  } else {
    if (childrenAssessedRate >= 80) score += 6;
    else if (childrenAssessedRate >= 50) score += 2;
    else if (childrenAssessedRate < 30) score -= 5;
  }

  // Modifier 2: Repeat assessments (tracking progress over time)
  if (total === 0) {
    score -= 1;
  } else {
    if (repeatAssessmentRate >= 70) score += 5;
    else if (repeatAssessmentRate >= 40) score += 2;
    else if (repeatAssessmentRate < 20) score -= 5;
  }

  // Modifier 3: Improvement trajectory
  if (total === 0) {
    score -= 1;
  } else {
    if (withPrevious.length === 0) score -= 1;
    else if (improvementRate >= 70) score += 5;
    else if (improvementRate >= 40) score += 2;
    else if (improvementRate < 20) score -= 4;
  }

  // Modifier 4: Action plan quality
  if (total === 0) {
    // no adjustment
  } else {
    if (actionPlanRate >= 80) score += 5;
    else if (actionPlanRate >= 50) score += 2;
    else if (actionPlanRate < 25) score -= 4;
  }

  // Modifier 5: Child voice captured
  if (total === 0) {
    score -= 1;
  } else {
    if (childVoiceRate >= 80) score += 4;
    else if (childVoiceRate >= 50) score += 1;
    else if (childVoiceRate < 20) score -= 4;
  }

  // Modifier 6: Domain completeness and staff alignment
  if (total === 0) {
    score -= 2;
  } else {
    const fullDomainRate = pct(fullDomainAssessments, total);
    const staffViewRate = pct(withStaffViews, total);
    if (fullDomainRate >= 80 && staffViewRate >= 70) score += 5;
    else if (fullDomainRate >= 50 || staffViewRate >= 50) score += 2;
    else if (fullDomainRate < 25 && staffViewRate < 25) score -= 3;
  }

  score = clamp(score, 0, 100);

  const star_rating = total === 0 && assessments.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenAssessedRate >= 80 && total > 0)
    strengths.push("Most children have Outcome Star assessments — progress is systematically measured across the home");
  if (repeatAssessmentRate >= 70 && total > 0)
    strengths.push("Regular repeat assessments track progress over time — the home can demonstrate measurable outcomes");
  if (improvementRate >= 70 && withPrevious.length > 0)
    strengths.push("Strong improvement trajectory — children are progressing across multiple Outcome Star domains");
  if (actionPlanRate >= 80 && total > 0)
    strengths.push("Action plans are consistently linked to assessments — identified needs translate into planned interventions");
  if (childVoiceRate >= 80 && total > 0)
    strengths.push("Children's views are captured in assessments — their perspective shapes understanding of their own progress");
  if (pct(fullDomainAssessments, total) >= 80 && total > 0)
    strengths.push("Assessments cover all 10 domains comprehensively — no area of the child's life is overlooked");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No Outcome Star assessments — the home cannot demonstrate measurable progress for any child");
  if (childrenAssessedRate < 50 && total > 0)
    concerns.push("Fewer than half of children have been assessed — progress measurement is incomplete");
  if (repeatAssessmentRate < 20 && total > 0)
    concerns.push("Very few repeat assessments — the home cannot track progress trajectories over time");
  if (improvementRate < 20 && withPrevious.length > 0)
    concerns.push("Most children are not improving across domains — current interventions may not be effective");
  if (actionPlanRate < 25 && total > 0)
    concerns.push("Action plans are rarely linked to assessments — identified needs are not translating into action");
  if (childVoiceRate < 20 && total > 0)
    concerns.push("Children's views are rarely captured — assessments lack the child's own perspective on their progress");
  if (declining.length > 2 && withPrevious.length > 0)
    concerns.push("Multiple children are declining across Outcome Star domains — urgent review of care plans is needed");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: OutcomeStarResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Implement Outcome Star assessments for all children to establish baseline measurements and track progress", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 6" });
  if (childrenAssessedRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Extend Outcome Star assessments to all children — prioritise those without any baseline measurement", urgency: "immediate", regulatory_ref: "SCCIF Experiences" });
  if (repeatAssessmentRate < 40 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Schedule regular repeat assessments to track progress trajectories and demonstrate outcomes over time", urgency: "soon", regulatory_ref: "CHR 2015 Reg 6" });
  if (actionPlanRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure every Outcome Star assessment generates a targeted action plan addressing the lowest-scoring domains", urgency: "soon", regulatory_ref: "SCCIF Experiences" });
  if (childVoiceRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Capture children's views in every assessment — their self-perception is essential to accurate progress measurement", urgency: "soon", regulatory_ref: "SCCIF Experiences" });
  if (improvementRate < 40 && withPrevious.length > 0)
    recommendations.push({ rank: ++rank, recommendation: "Review care plans for children showing limited improvement — consider whether current interventions align with assessed needs", urgency: "planned", regulatory_ref: "CHR 2015 Reg 9" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: OutcomeStarResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No Outcome Star data means Ofsted cannot verify the home measures and tracks children's progress", severity: "critical" });
  if (total > 0 && improvementRate >= 70 && actionPlanRate >= 80)
    insights.push({ text: "Strong improvement trajectory combined with action plans demonstrates that interventions are driving measurable progress", severity: "positive" });
  if (declining.length > 2 && withPrevious.length > 0)
    insights.push({ text: "Children declining across domains may indicate unmet needs, placement instability or inadequate therapeutic support", severity: "warning" });
  if (total > 0 && childVoiceRate >= 80 && pct(withStaffViews, total) >= 80)
    insights.push({ text: "Both child and staff perspectives are captured — assessments provide a rounded view of each child's progress", severity: "positive" });
  if (pct(fullDomainAssessments, total) >= 80 && total > 0)
    insights.push({ text: "Full 10-domain assessments show the home takes a holistic approach to understanding each child's needs", severity: "positive" });
  if (total > 0 && (averageScoreAcrossHome ?? 0) < 4)
    insights.push({ text: "Low average scores across the home suggest children have significant unmet needs requiring intensive support", severity: "warning" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (star_rating === "insufficient_data") {
    headline = "No data available for Outcome Star intelligence analysis";
  } else if (star_rating === "outstanding") {
    headline = "Outstanding Outcome Star practice — children's progress is systematically measured, tracked and improving";
  } else if (star_rating === "good") {
    headline = "Good progress measurement with regular assessments and positive improvement trends";
  } else if (star_rating === "adequate") {
    headline = "Outcome Star assessments exist but coverage, tracking or action planning needs strengthening";
  } else {
    headline = "Inadequate progress measurement — children's outcomes are not being systematically tracked or improved";
  }

  return {
    star_rating,
    star_score: score,
    headline,
    total_assessments: total,
    children_assessed_rate: childrenAssessedRate,
    repeat_assessment_rate: repeatAssessmentRate,
    average_score_across_home: averageScoreAcrossHome,
    improvement_rate: improvementRate,
    action_plan_rate: actionPlanRate,
    child_voice_rate: childVoiceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
