// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME QUALITY OF CARE REVIEW INTELLIGENCE ENGINE
// Pure deterministic engine: quality of care reviews, domain assessments,
// action completion, timeliness, and improvement tracking.
// CHR 2015 Reg 45/46: Quality of care reviews. SCCIF: Quality & improvement.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface QocReviewInput {
  id: string;
  type: string; // "monthly"|"quarterly"|"annual"|"ofsted_prep"|"post_incident"|"reg44_response"
  overall_rating: string; // "outstanding"|"good"|"requires_improvement"|"inadequate"
  domains_count: number;
  domains_good_or_outstanding: number;
  actions_total: number;
  actions_completed: number;
  has_children_feedback: boolean;
  has_staff_feedback: boolean;
  has_strengths: boolean;
  has_improvements: boolean;
}

export interface QualityOfCareReviewInput {
  today: string;
  total_children: number;
  reviews: QocReviewInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type QocIntelligenceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface QualityOfCareReviewResult {
  qoc_rating: QocIntelligenceRating;
  qoc_score: number;
  headline: string;
  total_reviews: number;
  good_or_outstanding_rate: number;
  action_completion_rate: number;
  children_feedback_rate: number;
  staff_feedback_rate: number;
  domain_quality_rate: number;
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

function toRating(score: number): QocIntelligenceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeQualityOfCareReview(
  input: QualityOfCareReviewInput,
): QualityOfCareReviewResult {
  const { reviews, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      qoc_rating: "insufficient_data",
      qoc_score: 0,
      headline: "No data available for quality of care analysis",
      total_reviews: 0,
      good_or_outstanding_rate: 0,
      action_completion_rate: 0,
      children_feedback_rate: 0,
      staff_feedback_rate: 0,
      domain_quality_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const totalReviews = reviews.length;

  const goodOrOutstanding = reviews.filter(r =>
    r.overall_rating === "outstanding" || r.overall_rating === "good"
  ).length;
  const goodRate = pct(goodOrOutstanding, totalReviews);

  const totalActions = reviews.reduce((sum, r) => sum + r.actions_total, 0);
  const completedActions = reviews.reduce((sum, r) => sum + r.actions_completed, 0);
  const actionCompletionRate = pct(completedActions, totalActions);

  const withChildFeedback = reviews.filter(r => r.has_children_feedback).length;
  const childFeedbackRate = pct(withChildFeedback, totalReviews);

  const withStaffFeedback = reviews.filter(r => r.has_staff_feedback).length;
  const staffFeedbackRate = pct(withStaffFeedback, totalReviews);

  const totalDomains = reviews.reduce((sum, r) => sum + r.domains_count, 0);
  const goodDomains = reviews.reduce((sum, r) => sum + r.domains_good_or_outstanding, 0);
  const domainQualityRate = pct(goodDomains, totalDomains);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Review rating quality (% good/outstanding)
  if (totalReviews === 0) {
    score -= 3;
  } else {
    if (goodRate >= 90) score += 5;
    else if (goodRate >= 70) score += 2;
    else if (goodRate < 50) score -= 5;
  }

  // Modifier 2: Action completion rate
  if (totalActions === 0 && totalReviews > 0) {
    score += 2;
  } else if (totalActions === 0) {
    // no reviews → no adjustment
  } else {
    if (actionCompletionRate >= 90) score += 6;
    else if (actionCompletionRate >= 70) score += 2;
    else if (actionCompletionRate < 50) score -= 5;
  }

  // Modifier 3: Children's feedback included
  if (totalReviews === 0) {
    // no adjustment
  } else {
    if (childFeedbackRate >= 90) score += 5;
    else if (childFeedbackRate >= 70) score += 2;
    else if (childFeedbackRate < 50) score -= 4;
  }

  // Modifier 4: Staff feedback included
  if (totalReviews === 0) {
    // no adjustment
  } else {
    if (staffFeedbackRate >= 90) score += 5;
    else if (staffFeedbackRate >= 70) score += 2;
    else if (staffFeedbackRate < 50) score -= 5;
  }

  // Modifier 5: Domain quality rate
  if (totalDomains === 0) {
    score -= 1;
  } else {
    if (domainQualityRate >= 90) score += 4;
    else if (domainQualityRate >= 70) score += 1;
    else if (domainQualityRate < 50) score -= 4;
  }

  // Modifier 6: Review frequency (reviews per quarter-equivalent)
  if (totalReviews >= 4) score += 5;
  else if (totalReviews >= 2) score += 2;
  else if (totalReviews === 0) score -= 5;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Quality of care reviews are comprehensive, action-driven and consistently high-rated";
      break;
    case "good":
      headline = "Good quality review practice with effective feedback loops and action tracking";
      break;
    case "adequate":
      headline = "Quality review processes are adequate but need strengthening in key areas";
      break;
    case "inadequate":
      headline = "Quality of care review practices are inadequate — immediate improvement required";
      break;
    default:
      headline = "No data available for quality of care analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (goodRate >= 90 && totalReviews > 0) strengths.push("Quality reviews consistently rate the home as good or outstanding");
  if (actionCompletionRate >= 90 && totalActions > 0) strengths.push("Excellent action completion rate — improvements are implemented promptly");
  if (childFeedbackRate >= 90 && totalReviews > 0) strengths.push("Children's feedback is systematically included in quality reviews");
  if (staffFeedbackRate >= 90 && totalReviews > 0) strengths.push("Staff feedback is consistently gathered as part of the review process");
  if (domainQualityRate >= 90 && totalDomains > 0) strengths.push("Domain assessments show high quality across all reviewed areas");
  if (totalReviews >= 4) strengths.push("Regular review schedule with strong frequency of quality assessments");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (totalReviews === 0) concerns.push("No quality of care reviews have been conducted — regulatory compliance at risk");
  if (goodRate < 50 && totalReviews > 0) concerns.push("Majority of quality reviews are not rated good or outstanding");
  if (actionCompletionRate < 50 && totalActions > 0) concerns.push("Poor action completion rate — improvements identified are not being implemented");
  if (childFeedbackRate < 50 && totalReviews > 0) concerns.push("Children's voices are missing from quality review processes");
  if (staffFeedbackRate < 50 && totalReviews > 0) concerns.push("Staff feedback is not routinely included in quality reviews");
  if (domainQualityRate < 50 && totalDomains > 0) concerns.push("Domain assessments show widespread areas requiring improvement");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: QualityOfCareReviewResult["recommendations"] = [];

  if (totalReviews === 0) {
    recs.push({ rank: 1, recommendation: "Establish a regular quality of care review schedule as required under Regulation 45", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 45" });
  }
  if (actionCompletionRate < 70 && totalActions > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Implement action tracking system to ensure review findings are acted upon", urgency: "soon", regulatory_ref: "CHR 2015 Reg 46" });
  }
  if (childFeedbackRate < 70 && totalReviews > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure children's views are systematically gathered for every quality review", urgency: "soon", regulatory_ref: "SCCIF Quality" });
  }
  if (staffFeedbackRate < 70 && totalReviews > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Include staff consultation as a standard element of all quality reviews", urgency: "planned", regulatory_ref: "SCCIF Quality" });
  }
  if (goodRate < 70 && totalReviews > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Develop targeted improvement plan to address areas rated below good", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 45" });
  }
  if (domainQualityRate < 70 && totalDomains > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Address domain-level weaknesses identified in quality assessments", urgency: "soon", regulatory_ref: "CHR 2015 Reg 46" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: QualityOfCareReviewResult["insights"] = [];

  if (goodRate >= 90 && actionCompletionRate >= 90 && totalReviews > 0) {
    insights.push({ text: "Quality review framework is mature and effective — high ratings combined with strong action follow-through", severity: "positive" });
  }
  if (totalReviews === 0) {
    insights.push({ text: "Absence of quality reviews means the home cannot demonstrate continuous improvement to regulators", severity: "critical" });
  }
  if (actionCompletionRate < 50 && totalActions > 0) {
    insights.push({ text: "Low action completion undermines the purpose of quality reviews — a review without follow-through adds no value", severity: "critical" });
  }
  if (childFeedbackRate >= 90 && staffFeedbackRate >= 90 && totalReviews > 0) {
    insights.push({ text: "Inclusive review process — both children and staff voices inform quality improvement", severity: "positive" });
  }
  if (goodRate < 50 && totalReviews > 0) {
    insights.push({ text: "Persistent low ratings in quality reviews suggest systemic issues requiring strategic intervention", severity: "warning" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    qoc_rating: rating,
    qoc_score: score,
    headline,
    total_reviews: totalReviews,
    good_or_outstanding_rate: goodRate,
    action_completion_rate: actionCompletionRate,
    children_feedback_rate: childFeedbackRate,
    staff_feedback_rate: staffFeedbackRate,
    domain_quality_rate: domainQualityRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
