// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PLACEMENT IMPACT ASSESSMENT INTELLIGENCE ENGINE
// Pure deterministic engine: matching rigour, risk assessment quality,
// impact on existing children, compatibility analysis, safeguarding
// considerations, staffing implications, and decision documentation.
// CHR 2015 Reg 12(3)(d): "Before making a decision to offer a placement,
// the registered person assesses the impact on existing children."
// SCCIF: How well children and young people are helped and protected.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PlacementImpactRecordInput {
  id: string;
  status: string; // "approved"|"declined"|"pending"|"approved_with_conditions"
  overall_risk: string; // "low"|"medium"|"high"
  has_decision_rationale: boolean;
  impact_on_existing_count: number;
  impact_high_risk_count: number;
  impact_with_child_view_count: number;
  impact_with_mitigation_count: number;
  compatibility_factor_count: number;
  compatibility_positive_count: number;
  compatibility_concern_count: number;
  staffing_implication_count: number;
  environmental_consideration_count: number;
  safeguarding_consideration_count: number;
  condition_count: number;
  has_review_date: boolean;
  has_notes: boolean;
}

export interface PlacementImpactInput {
  today: string;
  total_children: number;
  assessments: PlacementImpactRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PlacementImpactRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PlacementImpactResult {
  impact_rating: PlacementImpactRating;
  impact_score: number;
  headline: string;
  total_assessments: number;
  decision_documented_rate: number;
  child_view_capture_rate: number;
  mitigation_rate: number;
  compatibility_positive_rate: number;
  safeguarding_coverage_rate: number;
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

function toRating(score: number): PlacementImpactRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computePlacementImpactAssessment(
  input: PlacementImpactInput,
): PlacementImpactResult {
  const { assessments, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      impact_rating: "insufficient_data",
      impact_score: 0,
      headline: "No data available for placement impact assessment analysis",
      total_assessments: 0,
      decision_documented_rate: 0,
      child_view_capture_rate: 0,
      mitigation_rate: 0,
      compatibility_positive_rate: 0,
      safeguarding_coverage_rate: 0,
      review_scheduled_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = assessments.length;

  const withDecisionRationale = assessments.filter(a => a.has_decision_rationale).length;
  const decisionDocumentedRate = pct(withDecisionRationale, total);

  const totalImpacts = assessments.reduce((s, a) => s + a.impact_on_existing_count, 0);
  const totalChildViews = assessments.reduce((s, a) => s + a.impact_with_child_view_count, 0);
  const childViewCaptureRate = pct(totalChildViews, totalImpacts);

  const totalMitigations = assessments.reduce((s, a) => s + a.impact_with_mitigation_count, 0);
  const mitigationRate = pct(totalMitigations, totalImpacts);

  const totalCompatFactors = assessments.reduce((s, a) => s + a.compatibility_factor_count, 0);
  const totalCompatPositive = assessments.reduce((s, a) => s + a.compatibility_positive_count, 0);
  const compatibilityPositiveRate = pct(totalCompatPositive, totalCompatFactors);

  const withSafeguarding = assessments.filter(a => a.safeguarding_consideration_count > 0).length;
  const safeguardingCoverageRate = pct(withSafeguarding, total);

  const withReviewDate = assessments.filter(a => a.has_review_date).length;
  const reviewScheduledRate = pct(withReviewDate, total);

  const highRiskAssessments = assessments.filter(a => a.overall_risk === "high").length;
  const declined = assessments.filter(a => a.status === "declined").length;
  const approvedWithConditions = assessments.filter(a => a.status === "approved_with_conditions").length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Decision documentation quality
  if (total === 0) {
    score -= 3;
  } else {
    if (decisionDocumentedRate >= 90) score += 6;
    else if (decisionDocumentedRate >= 60) score += 2;
    else if (decisionDocumentedRate < 30) score -= 5;
  }

  // Modifier 2: Child views in impact assessments
  if (total === 0) {
    score -= 1;
  } else {
    if (totalImpacts === 0 && total > 0) score += 2;
    else if (childViewCaptureRate >= 80) score += 5;
    else if (childViewCaptureRate >= 50) score += 2;
    else if (childViewCaptureRate < 20) score -= 5;
  }

  // Modifier 3: Mitigation plans for identified risks
  if (total === 0) {
    score -= 1;
  } else {
    if (totalImpacts === 0 && total > 0) score += 2;
    else if (mitigationRate >= 80) score += 5;
    else if (mitigationRate >= 50) score += 2;
    else if (mitigationRate < 30) score -= 4;
  }

  // Modifier 4: Compatibility analysis quality
  if (total === 0) {
    // no adjustment
  } else {
    if (totalCompatFactors === 0 && total > 0) score -= 2;
    else if (compatibilityPositiveRate >= 70) score += 5;
    else if (compatibilityPositiveRate >= 40) score += 2;
    else if (compatibilityPositiveRate < 20) score -= 4;
  }

  // Modifier 5: Safeguarding consideration coverage
  if (total === 0) {
    score -= 1;
  } else {
    if (safeguardingCoverageRate >= 90) score += 4;
    else if (safeguardingCoverageRate >= 60) score += 1;
    else if (safeguardingCoverageRate < 30) score -= 4;
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

  const impact_rating = total === 0 && assessments.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (decisionDocumentedRate >= 90 && total > 0)
    strengths.push("Placement decisions are thoroughly documented with clear rationale — the home demonstrates rigorous matching");
  if (childViewCaptureRate >= 80 && totalImpacts > 0)
    strengths.push("Existing children's views are consistently sought before new admissions — child voice drives placement decisions");
  if (mitigationRate >= 80 && totalImpacts > 0)
    strengths.push("Risk mitigations are documented for identified impacts — the home plans proactively to protect existing residents");
  if (compatibilityPositiveRate >= 70 && totalCompatFactors > 0)
    strengths.push("Compatibility analysis shows predominantly positive factors — the home makes well-matched placements");
  if (safeguardingCoverageRate >= 90 && total > 0)
    strengths.push("Safeguarding considerations are addressed in every assessment — child protection is central to matching decisions");
  if (reviewScheduledRate >= 80 && total > 0)
    strengths.push("Post-placement reviews are scheduled — the home monitors whether matching decisions prove effective");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No placement impact assessments — the home cannot demonstrate Reg 12(3)(d) compliance for matching decisions");
  if (decisionDocumentedRate < 50 && total > 0)
    concerns.push("Many placement decisions lack documented rationale — Ofsted will question the rigour of matching");
  if (childViewCaptureRate < 30 && totalImpacts > 0)
    concerns.push("Existing children's views are rarely captured in impact assessments — their welfare may be compromised by new admissions");
  if (mitigationRate < 30 && totalImpacts > 0)
    concerns.push("Identified risks lack documented mitigations — the home is not planning how to manage placement impacts");
  if (highRiskAssessments > 0 && declined === 0)
    concerns.push("High-risk assessments have not led to any declined placements — the home may be accepting unsuitable referrals");
  if (safeguardingCoverageRate < 30 && total > 0)
    concerns.push("Safeguarding considerations are absent from most assessments — child protection is not embedded in matching");
  if (reviewScheduledRate < 30 && total > 0)
    concerns.push("Post-placement reviews are not scheduled — the home cannot verify whether matching decisions were correct");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: PlacementImpactResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Implement placement impact assessments for all admissions with documented rationale and child views", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12(3)(d)" });
  if (childViewCaptureRate < 50 && totalImpacts > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure every existing child is consulted before new admissions and their views are formally recorded", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 7" });
  if (mitigationRate < 50 && totalImpacts > 0)
    recommendations.push({ rank: ++rank, recommendation: "Document specific mitigations for every identified risk impact to protect existing residents", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  if (safeguardingCoverageRate < 60 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Include safeguarding considerations in every placement impact assessment", urgency: "soon", regulatory_ref: "CHR 2015 Reg 14" });
  if (reviewScheduledRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Schedule post-placement reviews within 4 weeks of each admission to assess matching effectiveness", urgency: "planned", regulatory_ref: "SCCIF Helped & Protected" });
  if (decisionDocumentedRate < 60 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Strengthen decision documentation to include full rationale for every placement decision", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12(3)(d)" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: PlacementImpactResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No placement impact assessments means Ofsted cannot verify how the home protects existing residents during admissions", severity: "critical" });
  if (total > 0 && decisionDocumentedRate >= 90 && childViewCaptureRate >= 80)
    insights.push({ text: "Thorough impact assessments with child voice demonstrate outstanding matching practice", severity: "positive" });
  if (highRiskAssessments > 0)
    insights.push({ text: `${highRiskAssessments} high-risk assessment${highRiskAssessments > 1 ? "s" : ""} identified — the home is managing complex referrals requiring enhanced scrutiny`, severity: "warning" });
  if (declined > 0)
    insights.push({ text: `${declined} referral${declined > 1 ? "s" : ""} declined — demonstrates the home prioritises existing children's welfare over occupancy`, severity: "positive" });
  if (approvedWithConditions > 0 && total > 0)
    insights.push({ text: "Conditional approvals show the home applies proportionate safeguards rather than blanket decisions", severity: "positive" });
  if (total > 0 && safeguardingCoverageRate < 50)
    insights.push({ text: "Insufficient safeguarding analysis in matching decisions leaves existing children potentially exposed", severity: "warning" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (impact_rating === "insufficient_data") {
    headline = "No data available for placement impact assessment analysis";
  } else if (impact_rating === "outstanding") {
    headline = "Outstanding placement matching — rigorous assessments protect existing children and ensure compatibility";
  } else if (impact_rating === "good") {
    headline = "Good placement impact assessment practice with documented decisions and child views";
  } else if (impact_rating === "adequate") {
    headline = "Placement assessments exist but matching rigour, child views or risk mitigation needs improvement";
  } else {
    headline = "Inadequate placement matching — existing children's welfare is not sufficiently protected during admissions";
  }

  return {
    impact_rating,
    impact_score: score,
    headline,
    total_assessments: total,
    decision_documented_rate: decisionDocumentedRate,
    child_view_capture_rate: childViewCaptureRate,
    mitigation_rate: mitigationRate,
    compatibility_positive_rate: compatibilityPositiveRate,
    safeguarding_coverage_rate: safeguardingCoverageRate,
    review_scheduled_rate: reviewScheduledRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
