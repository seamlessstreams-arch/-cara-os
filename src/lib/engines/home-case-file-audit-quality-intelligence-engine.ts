// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CASE FILE AUDIT & QUALITY INTELLIGENCE ENGINE
// Tracks case file audit quality, handover audits, policy currency, and Ofsted
// engagement preparedness to ensure robust internal quality assurance.
// Pure deterministic engine. CHR 2015 Reg 40/45.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CaseFileAuditInput {
  id: string;
  child_id: string;
  date: string;
  overall_rag: string;            // "green" | "amber" | "red"
  overall_score: number;           // 0-100
  gaps_found: number;
  child_contributed: boolean;
}

export interface HandoverAuditInput {
  id: string;
  date: string;
  quality_score: number;           // 0-100
  actions_completed: boolean;
  issues_found: number;
}

export interface PolicyReviewInput {
  id: string;
  policy_name: string;
  last_reviewed: string;
  is_current: boolean;
  staff_aware: boolean;
}

export interface OfstedEngagementInput {
  id: string;
  date: string;
  type: string;                    // "self_evaluation" | "mock_inspection" | "action_plan_review" | "evidence_collation"
  completed: boolean;
  actions_arising: number;
  actions_resolved: number;
}

export interface CaseFileAuditQualityInput {
  today: string;
  total_children: number;
  case_file_audits: CaseFileAuditInput[];
  handover_audits: HandoverAuditInput[];
  policy_reviews: PolicyReviewInput[];
  ofsted_engagement: OfstedEngagementInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type CaseFileAuditRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CaseFileAuditResult {
  audit_rating: CaseFileAuditRating;
  audit_score: number;
  headline: string;
  children_audited: number;
  average_audit_score: number;
  green_rag_rate: number;
  policy_currency_rate: number;
  ofsted_readiness_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): CaseFileAuditRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeCaseFileAuditQuality(
  input: CaseFileAuditQualityInput,
): CaseFileAuditResult {
  const { total_children, case_file_audits, handover_audits, policy_reviews, ofsted_engagement } = input;

  // Insufficient data: 0 children
  if (total_children === 0) {
    return {
      audit_rating: "insufficient_data",
      audit_score: 0,
      headline: "No children in placement — case file audit quality cannot be assessed.",
      children_audited: 0,
      average_audit_score: 0,
      green_rag_rate: 0,
      policy_currency_rate: 0,
      ofsted_readiness_rate: 0,
      strengths: [],
      concerns: ["No children in placement — unable to assess case file audit quality."],
      recommendations: [{ rank: 1, recommendation: "Ensure case file audits are scheduled as soon as children are in placement.", urgency: "planned", regulatory_ref: "Reg 40" }],
      insights: [{ text: "No children in placement. Case file audit quality assessment requires active placements to evaluate.", severity: "critical" }],
    };
  }

  // ── Case File Audit Metrics ─────────────────────────────────────────
  const audits = case_file_audits;
  const childrenAudited = new Set(audits.map(a => a.child_id)).size;
  const coverageRate = pct(childrenAudited, total_children);
  const greenCount = audits.filter(a => a.overall_rag === "green").length;
  const greenRate = audits.length > 0 ? pct(greenCount, audits.length) : 0;
  const avgScore = audits.length > 0
    ? Math.round((audits.reduce((sum, a) => sum + a.overall_score, 0) / audits.length) * 10) / 10
    : 0;
  const childContribCount = audits.filter(a => a.child_contributed).length;
  const childContribRate = audits.length > 0 ? pct(childContribCount, audits.length) : 0;

  // ── Handover Audit Metrics ──────────────────────────────────────────
  const avgHandoverScore = handover_audits.length > 0
    ? Math.round((handover_audits.reduce((sum, h) => sum + h.quality_score, 0) / handover_audits.length) * 10) / 10
    : 0;

  // ── Policy Review Metrics ───────────────────────────────────────────
  const currentPolicies = policy_reviews.filter(p => p.is_current).length;
  const policyCurrencyRate = policy_reviews.length > 0 ? pct(currentPolicies, policy_reviews.length) : 0;

  // ── Ofsted Engagement Metrics ───────────────────────────────────────
  const completedEngagements = ofsted_engagement.filter(e => e.completed).length;
  const ofstedCompletedRate = ofsted_engagement.length > 0 ? pct(completedEngagements, ofsted_engagement.length) : 0;

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52, 6 modifiers, max 52+5+7+4+4+5+5 = 82
  let score = 52;

  // Mod 1: Case file audit coverage (±5)
  if (coverageRate >= 90) score += 5;
  else if (coverageRate >= 70) score += 3;
  else if (coverageRate >= 50) score += 0;
  else score -= 5;

  // Mod 2: Audit quality (±6, +1 bonus)
  if (audits.length > 0) {
    if (greenRate >= 80) score += 6;
    else if (greenRate >= 60) score += 3;
    else if (greenRate >= 40) score += 0;
    else score -= 6;

    if (avgScore >= 85) score += 1;
  }

  // Mod 3: Child involvement in audits (±4)
  if (audits.length > 0) {
    if (childContribRate >= 80) score += 4;
    else if (childContribRate >= 60) score += 2;
    else if (childContribRate >= 40) score += 0;
    else score -= 4;
  }

  // Mod 4: Handover audit quality (±4)
  if (handover_audits.length > 0) {
    if (avgHandoverScore >= 85) score += 4;
    else if (avgHandoverScore >= 70) score += 2;
    else if (avgHandoverScore >= 50) score += 0;
    else score -= 4;
  }

  // Mod 5: Policy currency (±5)
  if (policy_reviews.length > 0) {
    if (policyCurrencyRate >= 95) score += 5;
    else if (policyCurrencyRate >= 80) score += 3;
    else if (policyCurrencyRate >= 60) score += 0;
    else score -= 5;
  } else {
    score -= 1;
  }

  // Mod 6: Ofsted engagement (±5)
  if (ofsted_engagement.length > 0) {
    if (ofstedCompletedRate >= 90) score += 5;
    else if (ofstedCompletedRate >= 70) score += 3;
    else if (ofstedCompletedRate >= 50) score += 0;
    else score -= 5;
  } else {
    score -= 1;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (coverageRate >= 90) strengths.push(`${coverageRate}% of children's case files audited — comprehensive audit coverage.`);
  if (greenRate >= 80 && audits.length > 0) strengths.push(`${greenRate}% of audits rated green — consistently high case file quality.`);
  if (avgScore >= 85 && audits.length > 0) strengths.push(`Average audit score ${avgScore}/100 — case files are well-maintained.`);
  if (childContribRate >= 80 && audits.length > 0) strengths.push(`${childContribRate}% of audits include child contribution — children's voices are central to the audit process.`);
  if (avgHandoverScore >= 85 && handover_audits.length > 0) strengths.push(`Handover audit quality score ${avgHandoverScore}/100 — strong continuity of care.`);
  if (policyCurrencyRate >= 95 && policy_reviews.length > 0) strengths.push(`${policyCurrencyRate}% of policies current — robust policy governance.`);
  if (ofstedCompletedRate >= 90 && ofsted_engagement.length > 0) strengths.push(`${ofstedCompletedRate}% of Ofsted engagement activities completed — excellent inspection preparedness.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (coverageRate < 50 && audits.length > 0) concerns.push(`Only ${coverageRate}% of children's case files audited — significant gaps in audit coverage.`);
  if (coverageRate < 50 && audits.length === 0) concerns.push("No case file audits conducted — Ofsted expects regular case file auditing under Reg 40.");
  if (greenRate < 40 && audits.length > 0) concerns.push(`Only ${greenRate}% of audits rated green — case file quality needs urgent improvement.`);
  if (childContribRate < 40 && audits.length > 0) concerns.push(`Only ${childContribRate}% of audits include child contribution — children must be involved in reviewing their own records.`);
  if (avgHandoverScore < 50 && handover_audits.length > 0) concerns.push(`Handover audit quality score ${avgHandoverScore}/100 — handover quality is inadequate.`);
  if (policyCurrencyRate < 60 && policy_reviews.length > 0) concerns.push(`Only ${policyCurrencyRate}% of policies current — policy review schedule has lapsed.`);
  if (policy_reviews.length === 0) concerns.push("No policy reviews recorded — Ofsted expects policies to be regularly reviewed and current.");
  if (ofstedCompletedRate < 50 && ofsted_engagement.length > 0) concerns.push(`Only ${ofstedCompletedRate}% of Ofsted engagement activities completed — inspection preparedness is weak.`);
  if (ofsted_engagement.length === 0) concerns.push("No Ofsted engagement activities recorded — the home should be actively preparing for inspection.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 1;

  if (audits.length === 0) {
    recs.push({ rank: rank++, recommendation: "Implement a regular case file audit programme covering all children in placement.", urgency: "immediate", regulatory_ref: "Reg 40" });
  }
  if (coverageRate < 50 && audits.length > 0) {
    recs.push({ rank: rank++, recommendation: "Extend case file audit coverage to ensure all children's files are audited regularly.", urgency: "immediate", regulatory_ref: "Reg 40" });
  }
  if (greenRate < 40 && audits.length > 0) {
    recs.push({ rank: rank++, recommendation: "Address case file quality issues identified in audits — focus on completeness, accuracy, and child-centred recording.", urgency: "immediate", regulatory_ref: "Reg 40" });
  }
  if (childContribRate < 40 && audits.length > 0) {
    recs.push({ rank: rank++, recommendation: "Ensure children contribute to their case file audits — their views on records about them should be sought and recorded.", urgency: "soon", regulatory_ref: "Reg 45" });
  }
  if (avgHandoverScore < 50 && handover_audits.length > 0) {
    recs.push({ rank: rank++, recommendation: "Improve handover audit quality — ensure critical information is transferred accurately between shifts.", urgency: "soon", regulatory_ref: "Reg 40" });
  }
  if (policy_reviews.length === 0 || policyCurrencyRate < 60) {
    recs.push({ rank: rank++, recommendation: "Review and update all policies to ensure they are current and reflect practice.", urgency: "soon", regulatory_ref: "Reg 40" });
  }
  if (ofsted_engagement.length === 0) {
    recs.push({ rank: rank++, recommendation: "Establish a regular Ofsted engagement programme including self-evaluation, mock inspections, and evidence collation.", urgency: "planned", regulatory_ref: "Reg 45" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (rating === "outstanding") {
    insights.push({ text: `Outstanding quality assurance with ${coverageRate}% audit coverage, ${greenRate}% green-rated audits, and ${ofstedCompletedRate}% Ofsted engagement completion. This demonstrates a home with a systematic, child-centred approach to quality monitoring that Ofsted will view very favourably.`, severity: "positive" });
  }
  if (greenRate < 40 && audits.length > 0) {
    insights.push({ text: `Only ${greenRate}% of case file audits rated green. Ofsted expects case files to be complete, accurate, and up to date (Reg 40). Low green rates indicate systemic recording or practice issues that need addressing before inspection.`, severity: "critical" });
  }
  if (childContribRate < 40 && audits.length > 0) {
    insights.push({ text: `Only ${childContribRate}% of audits involve the child. Reg 45 requires that children's views are sought and acted upon. Including children in case file audits demonstrates respect for their rights and improves recording quality.`, severity: "warning" });
  }
  if (audits.length === 0) {
    insights.push({ text: "No case file audits conducted. Without regular auditing, the home cannot evidence that it monitors and improves the quality of care records. Ofsted will expect to see a structured audit programme.", severity: "critical" });
  }
  if (policyCurrencyRate >= 95 && policy_reviews.length > 0 && ofstedCompletedRate >= 90 && ofsted_engagement.length > 0) {
    insights.push({ text: `Policy currency at ${policyCurrencyRate}% with ${ofstedCompletedRate}% Ofsted engagement completion demonstrates strong governance and inspection readiness. The home is well-positioned to evidence continuous improvement.`, severity: "positive" });
  }
  if (policy_reviews.length === 0 && ofsted_engagement.length === 0) {
    insights.push({ text: "No policy reviews or Ofsted engagement activities recorded. The home lacks evidence of governance oversight and inspection preparedness, which Ofsted will consider a leadership and management concern.", severity: "critical" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding case file audit quality — ${coverageRate}% coverage, ${greenRate}% green-rated, ${ofstedCompletedRate}% Ofsted readiness.`;
  } else if (rating === "good") {
    headline = `Good case file audit quality — ${childrenAudited} of ${total_children} children audited with ${greenRate}% green rate.`;
  } else if (rating === "adequate") {
    headline = "Adequate case file audit quality — gaps in coverage, quality, or governance need addressing.";
  } else {
    headline = "Case file audit quality is inadequate — significant gaps in audit coverage, quality, or inspection preparedness.";
  }

  return {
    audit_rating: rating,
    audit_score: score,
    headline,
    children_audited: childrenAudited,
    average_audit_score: avgScore,
    green_rag_rate: greenRate,
    policy_currency_rate: policyCurrencyRate,
    ofsted_readiness_rate: ofstedCompletedRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
