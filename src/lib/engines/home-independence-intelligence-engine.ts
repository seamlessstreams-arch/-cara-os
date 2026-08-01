// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME INDEPENDENCE & TRANSITION INTELLIGENCE ENGINE
// Home-level: synthesises independence pathway assessments across all children
// to assess readiness, life skills development, pathway plan linkage, domain
// gaps, and transition preparation quality.
// CHR 2015 Reg 7, 8. SCCIF: "Outcomes", "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface IndependencePathwayInput {
  id: string;
  child_id: string;
  assessment_date: string;                   // YYYY-MM-DD
  review_date: string;                       // YYYY-MM-DD
  overall_readiness: number;                 // 0–100
  status: string;                            // on_track | attention_needed | not_started | completed
  pathway_plan_linked: boolean;
  domain_count: number;
  domain_avg_score: number | null;                  // 0–10 scale
  lowest_domain_score: number | null;               // 0–10
  highest_domain_score: number | null;              // 0–10
  low_scoring_domains: number;               // count of domains scoring <= 3
  has_evidence: boolean;                     // all domains have evidence
  has_next_steps: boolean;                   // all domains have next_steps
}

export interface HomeIndependenceInput {
  today: string;
  total_children: number;
  child_ids: string[];
  pathways: IndependencePathwayInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type IndependenceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface IndependenceProfile {
  total_assessments: number;
  children_with_assessments: string[];
  children_without_assessments: string[];
  avg_readiness: number;
  on_track_count: number;
  attention_needed_count: number;
  pathway_plan_linkage_rate: number | null;         // % pathways linked
  overdue_reviews: number;
  evidence_rate: number | null;                     // % with all evidence
  next_steps_rate: number | null;                   // % with all next_steps
}

export interface DomainAnalysis {
  avg_domain_score: number | null;                  // average across all children (0–10)
  low_scoring_total: number;                 // total low-scoring domains across all pathways
  lowest_pathway_avg: number | null;                // lowest domain avg among pathways
  highest_pathway_avg: number | null;               // highest domain avg among pathways
  readiness_gap: number;                     // highest - lowest overall_readiness
}

export interface IndependenceInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface IndependenceRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeIndependenceResult {
  independence_rating: IndependenceRating;
  independence_score: number | null;
  headline: string;
  independence_profile: IndependenceProfile;
  domain_analysis: DomainAnalysis;
  strengths: string[];
  concerns: string[];
  recommendations: IndependenceRecommendation[];
  insights: IndependenceInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): IndependenceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeIndependence(
  input: HomeIndependenceInput,
): HomeIndependenceResult {
  const { today, total_children, child_ids, pathways } = input;

  // Insufficient data
  if (pathways.length === 0) {
    return {
      independence_rating: "insufficient_data",
      independence_score: 0,
      headline: "No independence pathway assessments documented — preparation for adulthood is a regulatory requirement.",
      independence_profile: emptyProfile(child_ids),
      domain_analysis: emptyDomainAnalysis(),
      strengths: [],
      concerns: ["No independence pathway assessments — every child should have a documented independence assessment."],
      recommendations: [{ rank: 1, recommendation: "Complete independence pathway assessments for all children — this is required under Regulation 7.", urgency: "immediate", regulatory_ref: "Reg 7" }],
      insights: [{ text: "Ofsted expects to see children being prepared for independence. Without pathway assessments, the home cannot evidence this work.", severity: "critical" }],
    };
  }

  // ── Independence Profile ──────────────────────────────────────────────
  const childrenWithAssessment = [...new Set(pathways.map(p => p.child_id))];
  const childrenWithoutAssessment = child_ids.filter(id => !childrenWithAssessment.includes(id));

  const avgReadiness = Math.round(
    pathways.reduce((s, p) => s + p.overall_readiness, 0) / pathways.length,
  );

  const onTrack = pathways.filter(p => p.status === "on_track" || p.status === "completed").length;
  const attentionNeeded = pathways.filter(p => p.status === "attention_needed").length;

  const linkedCount = pathways.filter(p => p.pathway_plan_linked).length;
  const linkageRate = Math.round((linkedCount / pathways.length) * 100);

  const overdueReviews = pathways.filter(p => p.review_date < today).length;

  const withEvidence = pathways.filter(p => p.has_evidence).length;
  const evidenceRate = Math.round((withEvidence / pathways.length) * 100);

  const withNextSteps = pathways.filter(p => p.has_next_steps).length;
  const nextStepsRate = Math.round((withNextSteps / pathways.length) * 100);

  const profile: IndependenceProfile = {
    total_assessments: pathways.length,
    children_with_assessments: childrenWithAssessment,
    children_without_assessments: childrenWithoutAssessment,
    avg_readiness: avgReadiness,
    on_track_count: onTrack,
    attention_needed_count: attentionNeeded,
    pathway_plan_linkage_rate: linkageRate,
    overdue_reviews: overdueReviews,
    evidence_rate: evidenceRate,
    next_steps_rate: nextStepsRate,
  };

  // ── Domain Analysis ───────────────────────────────────────────────────
  const avgDomainScore = Math.round(
    (pathways.reduce((s, p) => s + (p.domain_avg_score ?? 0), 0) / pathways.length) * 10,
  ) / 10;

  const lowScoringTotal = pathways.reduce((s, p) => s + p.low_scoring_domains, 0);

  const domainAvgs = pathways.map(p => p.domain_avg_score).filter((v): v is number => v !== null);
  const lowestAvg = domainAvgs.length > 0 ? Math.min(...domainAvgs) : null;
  const highestAvg = domainAvgs.length > 0 ? Math.max(...domainAvgs) : null;

  const readinessScores = pathways.map(p => p.overall_readiness);
  const readinessGap = Math.max(...readinessScores) - Math.min(...readinessScores);

  const domainAnalysis: DomainAnalysis = {
    avg_domain_score: avgDomainScore,
    low_scoring_total: lowScoringTotal,
    lowest_pathway_avg: lowestAvg !== null ? Math.round(lowestAvg * 10) / 10 : null,
    highest_pathway_avg: highestAvg !== null ? Math.round(highestAvg * 10) / 10 : null,
    readiness_gap: readinessGap,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // Coverage (±10)
  if (childrenWithoutAssessment.length === 0 && total_children > 0) score += 6;
  else if (childrenWithoutAssessment.length >= 2) score -= 8;
  else if (childrenWithoutAssessment.length === 1) score -= 3;

  // Readiness (±10)
  if (avgReadiness >= 70) score += 6;
  else if (avgReadiness >= 50) score += 3;
  else if (avgReadiness < 30) score -= 6;
  else score -= 2;

  // Status distribution (±8)
  const onTrackRate = Math.round((onTrack / pathways.length) * 100);
  if (onTrackRate === 100) score += 5;
  else if (onTrackRate >= 60) score += 2;
  else if (attentionNeeded > pathways.length / 2) score -= 4;

  // Pathway plan linkage (±6)
  if (linkageRate === 100) score += 4;
  else if (linkageRate === 0) score -= 4;
  else score += 1;

  // Review compliance (±6)
  if (overdueReviews === 0) score += 4;
  else if (overdueReviews >= 2) score -= 4;
  else score -= 2;

  // Domain quality (±8)
  if (avgDomainScore >= 7) score += 5;
  else if (avgDomainScore >= 5) score += 2;
  else if (avgDomainScore < 3) score -= 5;
  else score -= 2;

  if (lowScoringTotal > 3) score -= 3;

  // Evidence & next steps (±6)
  if (evidenceRate === 100 && nextStepsRate === 100) score += 4;
  else if (evidenceRate >= 80 && nextStepsRate >= 80) score += 2;
  else if (evidenceRate < 50 || nextStepsRate < 50) score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenWithoutAssessment.length === 0 && total_children > 0) strengths.push("All children have independence pathway assessments — comprehensive transition planning in place.");
  if (avgReadiness >= 60) strengths.push(`Average readiness score of ${avgReadiness}% — children are progressing well towards independence.`);
  if (onTrackRate === 100) strengths.push("All pathways on track — consistent progress across all children.");
  if (linkageRate === 100) strengths.push("All assessments linked to pathway plans — integrated planning approach.");
  if (overdueReviews === 0 && pathways.length > 0) strengths.push("All pathway reviews up to date — timely monitoring of progress.");
  if (evidenceRate === 100 && pathways.length > 0) strengths.push("All domains evidenced across all assessments — strong documentation quality.");
  if (avgDomainScore >= 6) strengths.push(`Average domain score of ${avgDomainScore}/10 — good progress across life skills areas.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (childrenWithoutAssessment.length > 0) concerns.push(`${childrenWithoutAssessment.length} child${childrenWithoutAssessment.length > 1 ? "ren" : ""} without independence assessments — all children need transition planning.`);
  if (avgReadiness < 40) concerns.push(`Low average readiness score (${avgReadiness}%) — children are not being adequately prepared for independence.`);
  if (attentionNeeded > 0) concerns.push(`${attentionNeeded} pathway${attentionNeeded > 1 ? "s" : ""} flagged as needing attention — targeted intervention required.`);
  if (linkageRate < 50) concerns.push("Low pathway plan linkage — assessments should be connected to formal pathway plans.");
  if (overdueReviews > 0) concerns.push(`${overdueReviews} overdue pathway review${overdueReviews > 1 ? "s" : ""} — regular reviews ensure timely progress monitoring.`);
  if (lowScoringTotal > 3) concerns.push(`${lowScoringTotal} low-scoring domains across pathways — systematic skills gaps need addressing.`);
  if (readinessGap > 30 && pathways.length >= 2) concerns.push(`Large readiness gap (${readinessGap} points) between children — ensure equitable support across all young people.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: IndependenceRecommendation[] = [];
  let rank = 1;

  if (childrenWithoutAssessment.length > 0) {
    recs.push({ rank: rank++, recommendation: "Complete independence pathway assessments for all children without them.", urgency: "immediate", regulatory_ref: "Reg 7" });
  }
  if (linkageRate < 100) {
    recs.push({ rank: rank++, recommendation: "Link all independence assessments to formal pathway plans — ensures integrated transition planning.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (overdueReviews > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueReviews} overdue pathway review${overdueReviews > 1 ? "s" : ""} — assessments must be reviewed within agreed timescales.`, urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (attentionNeeded > 0) {
    recs.push({ rank: rank++, recommendation: `Develop targeted intervention plans for ${attentionNeeded} pathway${attentionNeeded > 1 ? "s" : ""} needing attention — focus on weakest domains.`, urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (lowScoringTotal > 0) {
    recs.push({ rank: rank++, recommendation: "Address low-scoring life skills domains with structured learning opportunities and practical experiences.", urgency: "planned", regulatory_ref: "Reg 8" });
  }
  if (evidenceRate < 100 || nextStepsRate < 100) {
    recs.push({ rank: rank++, recommendation: "Ensure all domains have documented evidence and clear next steps — this strengthens Ofsted evidence.", urgency: "planned", regulatory_ref: "Reg 7" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: IndependenceInsight[] = [];

  if (childrenWithoutAssessment.length > 0) {
    insights.push({ text: `${childrenWithoutAssessment.length} child${childrenWithoutAssessment.length > 1 ? "ren" : ""} without independence assessments. Ofsted will view this as a failure to prepare children for adulthood under Regulation 7.`, severity: "critical" });
  }
  if (avgReadiness < 40 && pathways.length > 0) {
    insights.push({ text: `Average readiness score is ${avgReadiness}%. This suggests children are not yet well-prepared for independence — Ofsted will examine what the home is doing to accelerate progress.`, severity: "critical" });
  }
  if (avgReadiness >= 60 && childrenWithoutAssessment.length === 0) {
    insights.push({ text: `Average independence readiness of ${avgReadiness}% across all children evidences strong transition preparation. This aligns with Ofsted expectations for outstanding homes.`, severity: "positive" });
  }
  if (readinessGap > 30 && pathways.length >= 2) {
    insights.push({ text: `Readiness gap of ${readinessGap} points between children suggests uneven support. Ofsted expects equitable preparation for all young people.`, severity: "warning" });
  }
  if (lowScoringTotal === 0 && pathways.length > 0) {
    insights.push({ text: "No critically low-scoring domains — all children have at least basic competency across life skills areas.", severity: "positive" });
  }
  if (linkageRate === 100 && pathways.length > 0) {
    insights.push({ text: "All assessments linked to pathway plans — this integrated approach demonstrates coordinated transition planning.", severity: "positive" });
  }
  if (evidenceRate === 100 && nextStepsRate === 100 && pathways.length > 0) {
    insights.push({ text: "All domains fully evidenced with clear next steps — excellent documentation quality for Ofsted inspection.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Outstanding independence preparation — all children assessed, strong readiness, and comprehensive pathway plans.";
  } else if (rating === "good") {
    headline = `Good independence preparation — ${pathways.length} assessments with average readiness of ${avgReadiness}%.`;
  } else if (rating === "adequate") {
    headline = "Adequate independence preparation — some improvements needed in coverage, readiness, or pathway linkage.";
  } else {
    headline = "Independence preparation is inadequate — significant gaps in assessments, low readiness, or missing pathway plans.";
  }

  return {
    independence_rating: rating,
    independence_score: score,
    headline,
    independence_profile: profile,
    domain_analysis: domainAnalysis,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyProfile(childIds: string[]): IndependenceProfile {
  return {
    total_assessments: 0, children_with_assessments: [], children_without_assessments: childIds,
    avg_readiness: 0, on_track_count: 0, attention_needed_count: 0,
    pathway_plan_linkage_rate: 0, overdue_reviews: 0,
    evidence_rate: 0, next_steps_rate: 0,
  };
}

function emptyDomainAnalysis(): DomainAnalysis {
  return {
    avg_domain_score: 0, low_scoring_total: 0,
    lowest_pathway_avg: null, highest_pathway_avg: null, readiness_gap: 0,
  };
}
