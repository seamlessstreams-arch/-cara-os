// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CONTEXTUAL SAFEGUARDING INTELLIGENCE ENGINE
// Pure deterministic engine: contextual risk identification, multi-agency
// response, protective actions, review timeliness, and resolution tracking.
// CHR 2015 Reg 12: "The protection of children standard." SCCIF: Safeguarding.
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ContextualRiskInput {
  id: string;
  context_type: string; // "location"|"peer_group"|"online_space"|"transport_route"|"school"|"community_facility"
  risk_level: string; // "low"|"medium"|"high"|"very_high"
  status: string; // "active"|"monitoring"|"resolved"|"escalated"
  children_affected_count: number;
  risk_factors_count: number;
  protective_actions_count: number;
  multi_agency_actions_count: number;
  has_police_intelligence: boolean;
  has_community_mapping: boolean;
  needs_review: boolean; // derived: review_date < today
}

export interface ContextualSafeguardingInput {
  today: string;
  total_children: number;
  risks: ContextualRiskInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ContextualSafeguardingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ContextualSafeguardingResult {
  safeguarding_rating: ContextualSafeguardingRating;
  safeguarding_score: number;
  headline: string;
  total_risks: number;
  active_risks: number;
  high_risk_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  protective_actions_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multi_agency_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  resolution_rate: number | null;
  review_overdue_count: number;
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

function toRating(score: number): ContextualSafeguardingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeContextualSafeguarding(
  input: ContextualSafeguardingInput,
): ContextualSafeguardingResult {
  const { risks, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      safeguarding_rating: "insufficient_data",
      safeguarding_score: 0,
      headline: "No data available for contextual safeguarding analysis",
      total_risks: 0,
      active_risks: 0,
      high_risk_count: 0,
      protective_actions_rate: 0,
      multi_agency_rate: 0,
      resolution_rate: 0,
      review_overdue_count: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = risks.length;

  const activeRisks = risks.filter(r => r.status === "active" || r.status === "escalated").length;
  const highRiskCount = risks.filter(r => r.risk_level === "high" || r.risk_level === "very_high").length;

  const withProtective = risks.filter(r => r.protective_actions_count > 0).length;
  const protectiveRate = rate(withProtective, total);

  const withMultiAgency = risks.filter(r => r.multi_agency_actions_count > 0).length;
  const multiAgencyRate = rate(withMultiAgency, total);

  const resolved = risks.filter(r => r.status === "resolved").length;
  const resolutionRate = rate(resolved, total);

  const overdue = risks.filter(r => r.needs_review).length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Risk identification (having records shows awareness)
  if (total >= 5) score += 5;
  else if (total >= 2) score += 2;
  else if (total === 0) score -= 3;

  // Modifier 2: Protective actions in place
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(protectiveRate, 90)) score += 6;
    else if (meets(protectiveRate, 70)) score += 2;
    else if (below(protectiveRate, 50)) score -= 5;
  }

  // Modifier 3: Multi-agency engagement
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(multiAgencyRate, 80)) score += 5;
    else if (meets(multiAgencyRate, 50)) score += 2;
    else if (below(multiAgencyRate, 30)) score -= 4;
  }

  // Modifier 4: Resolution rate
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(resolutionRate, 60)) score += 5;
    else if (meets(resolutionRate, 30)) score += 2;
    else if (resolutionRate === 0 && total > 2) score -= 5;
  }

  // Modifier 5: Review timeliness
  if (total === 0) {
    score -= 1;
  } else {
    if (overdue === 0) score += 4;
    else if (overdue <= 1) score += 1;
    else if (overdue >= 3) score -= 4;
  }

  // Modifier 6: High risk management
  if (total === 0) {
    score -= 2;
  } else {
    const highWithProtective = risks.filter(r =>
      (r.risk_level === "high" || r.risk_level === "very_high") && r.protective_actions_count > 0
    ).length;
    const highProtectedRate = rate(highWithProtective, highRiskCount);
    if (highRiskCount === 0) score += 5;
    else if (meets(highProtectedRate, 90)) score += 3;
    else if (meets(highProtectedRate, 70)) score += 1;
    else score -= 5;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Contextual safeguarding is proactive — risks are identified, managed and resolved through multi-agency work";
      break;
    case "good":
      headline = "Good contextual safeguarding practice with effective risk identification and protective planning";
      break;
    case "adequate":
      headline = "Contextual safeguarding is adequate but needs stronger multi-agency engagement and follow-through";
      break;
    case "inadequate":
      headline = "Contextual safeguarding practice is inadequate — children face unmanaged environmental risks";
      break;
    default:
      headline = "No data available for contextual safeguarding analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (total >= 5) strengths.push("Comprehensive contextual risk mapping shows the home is actively scanning the environment");
  if (meets(protectiveRate, 90) && total > 0) strengths.push("Protective actions are in place for virtually all identified contextual risks");
  if (meets(multiAgencyRate, 80) && total > 0) strengths.push("Strong multi-agency engagement ensures risks are tackled collaboratively");
  if (meets(resolutionRate, 60) && total > 0) strengths.push("Good resolution rate shows contextual risks are being effectively managed down");
  if (overdue === 0 && total > 0) strengths.push("All contextual risk reviews are up to date — oversight is current");
  if (highRiskCount === 0 && total > 0) strengths.push("No high or very high contextual risks identified — children's environments are safe");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No contextual safeguarding risks assessed — the home may be unaware of environmental threats");
  if (below(protectiveRate, 50) && total > 0) concerns.push("Most contextual risks lack protective actions — children are exposed without mitigation");
  if (below(multiAgencyRate, 30) && total > 0) concerns.push("Multi-agency engagement is absent from most contextual risks — the home is working in isolation");
  if (overdue >= 3) concerns.push(`${overdue} contextual risk reviews are overdue — risks may have escalated unnoticed`);
  if (highRiskCount >= 3 && total > 0) concerns.push(`${highRiskCount} high or very high contextual risks identified — significant environmental threats to children`);
  if (resolutionRate === 0 && total > 2) concerns.push("No contextual risks have been resolved — intervention is not achieving outcomes");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: ContextualSafeguardingResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Conduct a contextual safeguarding mapping exercise covering locations, peers and online spaces", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (below(protectiveRate, 70) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Develop protective action plans for all identified contextual risks", urgency: "immediate", regulatory_ref: "SCCIF Safeguarding" });
  }
  if (below(multiAgencyRate, 50) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Strengthen multi-agency partnerships to address contextual risks collaboratively", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (overdue >= 2) {
    recs.push({ rank: recs.length + 1, recommendation: `Complete ${overdue} overdue contextual risk reviews to ensure risks are current`, urgency: "immediate", regulatory_ref: "SCCIF Safeguarding" });
  }
  if (highRiskCount >= 2 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Escalate high-risk contextual concerns to senior management and relevant agencies", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (below(resolutionRate, 30) && total > 2) {
    recs.push({ rank: recs.length + 1, recommendation: "Review intervention strategies to improve contextual risk resolution outcomes", urgency: "soon", regulatory_ref: "SCCIF Safeguarding" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: ContextualSafeguardingResult["insights"] = [];

  if (meets(protectiveRate, 90) && meets(multiAgencyRate, 80) && overdue === 0 && total >= 3) {
    insights.push({ text: "Contextual safeguarding is exemplary — risks are mapped, managed and reviewed through active partnership working", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No contextual mapping leaves children vulnerable to unseen risks — exploitation, county lines and peer influence go undetected", severity: "critical" });
  }
  if (highRiskCount >= 3) {
    insights.push({ text: "Multiple high-risk contextual threats require immediate strategic response — escalate to RI and relevant agencies", severity: "critical" });
  }
  if (meets(multiAgencyRate, 80) && total > 0) {
    insights.push({ text: "Strong multi-agency engagement means risks are shared and addressed collectively — children are better protected", severity: "positive" });
  }
  if (meets(resolutionRate, 60) && total > 0) {
    insights.push({ text: "Healthy resolution rate shows interventions are working — risks are being actively managed down over time", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    safeguarding_rating: rating,
    safeguarding_score: score,
    headline,
    total_risks: total,
    active_risks: activeRisks,
    high_risk_count: highRiskCount,
    protective_actions_rate: protectiveRate,
    multi_agency_rate: multiAgencyRate,
    resolution_rate: resolutionRate,
    review_overdue_count: overdue,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
