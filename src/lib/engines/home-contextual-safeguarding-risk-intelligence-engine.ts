// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CONTEXTUAL SAFEGUARDING RISK INTELLIGENCE ENGINE
// Pure deterministic engine: risk identification coverage, context diversity,
// multi-agency response, protective action completeness, review compliance,
// community mapping, and risk level distribution.
// CHR 2015 Reg 12 (Protection) / Reg 34 (Safeguarding).
// SCCIF: Helped and protected; Leadership and management.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ContextualSafeguardingRecordInput {
  id: string;
  date_identified: string; // ISO date
  last_reviewed: string; // ISO date
  context_type: string; // "location"|"peer_group"|"online_space"|"transport_route"|"school"|"community_facility"
  risk_level: string; // "low"|"medium"|"high"|"very_high"
  status: string; // "active"|"monitoring"|"resolved"|"escalated"
  children_affected_count: number;
  risk_factor_count: number;
  protective_action_count: number;
  multi_agency_action_count: number;
  has_police_intelligence: boolean;
  has_community_mapping: boolean;
  has_review_date: boolean;
  review_date: string; // ISO date
}

export interface ContextualSafeguardingInput {
  today: string;
  total_children: number;
  risks: ContextualSafeguardingRecordInput[];
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
  active_risk_count: number;
  high_risk_count: number;
  context_diversity: number;
  /** null when the population is empty — nothing measured, not 0%. */
  protective_action_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multi_agency_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  community_mapping_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  review_compliance_rate: number | null;
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
  const { risks, total_children, today } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      safeguarding_rating: "insufficient_data",
      safeguarding_score: 0,
      headline: "No data available for contextual safeguarding intelligence analysis",
      total_risks: 0,
      active_risk_count: 0,
      high_risk_count: 0,
      context_diversity: 0,
      protective_action_rate: null,
      multi_agency_rate: null,
      community_mapping_rate: null,
      review_compliance_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = risks.length;

  const activeRisks = risks.filter(r => r.status === "active" || r.status === "escalated");
  const resolvedRisks = risks.filter(r => r.status === "resolved");
  const highRisks = risks.filter(r => r.risk_level === "high" || r.risk_level === "very_high");

  // Context diversity
  const uniqueContextTypes = new Set(risks.map(r => r.context_type)).size;

  // Protective actions
  const withProtectiveActions = risks.filter(r => r.protective_action_count > 0).length;
  const protectiveActionRate = rate(withProtectiveActions, total);

  // Multi-agency response
  const withMultiAgency = risks.filter(r => r.multi_agency_action_count > 0).length;
  const multiAgencyRate = rate(withMultiAgency, total);

  // Community mapping
  const withCommunityMapping = risks.filter(r => r.has_community_mapping).length;
  const communityMappingRate = rate(withCommunityMapping, total);

  // Review compliance
  const todayMs = new Date(today).getTime();
  const withCurrentReview = risks.filter(r => {
    if (!r.has_review_date || !r.review_date) return false;
    const reviewMs = new Date(r.review_date).getTime();
    return reviewMs >= todayMs;
  }).length;
  const reviewComplianceRate = rate(withCurrentReview, total);

  // Police intelligence
  const withPoliceIntelligence = risks.filter(r => r.has_police_intelligence).length;

  // High-risk with protective actions
  const highRiskWithProtection = highRisks.filter(r => r.protective_action_count > 0).length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Protective action coverage
  if (total === 0) {
    score -= 3;
  } else {
    if (meets(protectiveActionRate, 85)) score += 6;
    else if (meets(protectiveActionRate, 60)) score += 2;
    else if (below(protectiveActionRate, 35)) score -= 5;
  }

  // Modifier 2: Multi-agency response
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(multiAgencyRate, 75)) score += 5;
    else if (meets(multiAgencyRate, 45)) score += 2;
    else if (below(multiAgencyRate, 20)) score -= 5;
  }

  // Modifier 3: Review compliance
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(reviewComplianceRate, 80)) score += 5;
    else if (meets(reviewComplianceRate, 50)) score += 2;
    else if (below(reviewComplianceRate, 25)) score -= 4;
  }

  // Modifier 4: Context diversity and community mapping
  if (total === 0) {
    // no adjustment
  } else {
    if (uniqueContextTypes >= 4 && meets(communityMappingRate, 60)) score += 5;
    else if (uniqueContextTypes >= 2 || meets(communityMappingRate, 40)) score += 2;
    else if (uniqueContextTypes < 2 && below(communityMappingRate, 20)) score -= 4;
  }

  // Modifier 5: High-risk management
  if (total === 0) {
    score -= 1;
  } else {
    if (highRisks.length === 0) score += 2; // no high risks is positive
    else {
      const highProtectionRate = rate(highRiskWithProtection, highRisks.length);
      if (meets(highProtectionRate, 100)) score += 4;
      else if (meets(highProtectionRate, 75)) score += 1;
      else if (below(highProtectionRate, 50)) score -= 4;
    }
  }

  // Modifier 6: Resolution and escalation governance
  if (total === 0) {
    score -= 2;
  } else {
    const resolutionRate = rate(resolvedRisks.length, total);
    const escalatedCount = risks.filter(r => r.status === "escalated").length;
    if (meets(resolutionRate, 40) && escalatedCount === 0) score += 5;
    else if (meets(resolutionRate, 20)) score += 2;
    else if (below(resolutionRate, 10) && total > 3) score -= 3;
  }

  score = clamp(score, 0, 100);

  const safeguarding_rating = total === 0 && risks.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(protectiveActionRate, 85) && total > 0)
    strengths.push("Protective actions are in place for virtually all identified contextual risks — children are actively safeguarded");
  if (meets(multiAgencyRate, 75) && total > 0)
    strengths.push("Multi-agency responses are consistently engaged — safeguarding is a shared responsibility with partners");
  if (meets(reviewComplianceRate, 80) && total > 0)
    strengths.push("Risk reviews are current — the home maintains up-to-date awareness of contextual threats");
  if (uniqueContextTypes >= 4 && total > 0)
    strengths.push("Risks are identified across diverse contexts — the home takes a comprehensive view of children's external environments");
  if (meets(communityMappingRate, 60) && total > 0)
    strengths.push("Community mapping informs risk understanding — the home actively maps the landscape of contextual threats");
  if (resolvedRisks.length > 0 && meets(rate(resolvedRisks.length, total), 40))
    strengths.push("Significant proportion of risks have been resolved — the home demonstrates effective risk reduction over time");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No contextual safeguarding risks identified — the home may not be assessing children's external vulnerability");
  if (below(protectiveActionRate, 35) && total > 0)
    concerns.push("Protective actions are absent for many identified risks — children may be exposed to unmitigated contextual threats");
  if (below(multiAgencyRate, 20) && total > 0)
    concerns.push("Multi-agency responses are rarely engaged — contextual risks require partnership working to manage effectively");
  if (below(reviewComplianceRate, 25) && total > 0)
    concerns.push("Risk reviews are overdue — the home may be working with outdated risk information");
  if (highRisks.length > 0 && highRiskWithProtection < highRisks.length)
    concerns.push("High-risk contextual threats exist without full protective action coverage — urgent mitigation is needed");
  if (below(communityMappingRate, 20) && total > 0)
    concerns.push("Community mapping is largely absent — the home lacks contextual intelligence about children's environments");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: ContextualSafeguardingResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Conduct contextual safeguarding assessments covering all environments where children spend time", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  if (below(protectiveActionRate, 60) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Implement protective actions for all identified contextual risks — prioritise high and very-high risk items", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 34" });
  if (below(multiAgencyRate, 45) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Engage multi-agency partners in contextual safeguarding — police, schools and community services should inform risk responses", urgency: "soon", regulatory_ref: "SCCIF Helped & Protected" });
  if (below(reviewComplianceRate, 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Review all overdue contextual risk assessments and update protective actions accordingly", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  if (below(communityMappingRate, 40) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Develop community mapping for all risk contexts to build intelligence about environmental threats", urgency: "planned", regulatory_ref: "SCCIF Leaders" });
  if (uniqueContextTypes < 3 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Broaden contextual assessment to cover online spaces, peer groups and transport routes alongside physical locations", urgency: "planned", regulatory_ref: "CHR 2015 Reg 34" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: ContextualSafeguardingResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No contextual safeguarding data means Ofsted cannot verify the home assesses external risks to children", severity: "critical" });
  if (total > 0 && meets(protectiveActionRate, 85) && meets(multiAgencyRate, 75))
    insights.push({ text: "Strong protective actions combined with multi-agency engagement demonstrate robust contextual safeguarding practice", severity: "positive" });
  if (highRisks.length > 3)
    insights.push({ text: "Multiple high or very-high risk contexts require intensive monitoring and urgent protective action", severity: "warning" });
  if (total > 0 && meets(rate(withPoliceIntelligence, total), 50))
    insights.push({ text: "Police intelligence informs contextual risk assessment — information-sharing with law enforcement is well-established", severity: "positive" });
  if (uniqueContextTypes >= 4 && total > 0)
    insights.push({ text: "Diverse context types show the home looks beyond physical location to assess peer, online and community risks", severity: "positive" });
  if (risks.filter(r => r.status === "escalated").length > 2)
    insights.push({ text: "Multiple escalated risks suggest contextual threats are intensifying — review strategic safeguarding response", severity: "warning" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (safeguarding_rating === "insufficient_data") {
    headline = "No data available for contextual safeguarding intelligence analysis";
  } else if (safeguarding_rating === "outstanding") {
    headline = "Outstanding contextual safeguarding — risks are identified, assessed, mitigated and reviewed through multi-agency working";
  } else if (safeguarding_rating === "good") {
    headline = "Good contextual safeguarding with protective actions and multi-agency engagement";
  } else if (safeguarding_rating === "adequate") {
    headline = "Contextual risks are identified but protective actions, reviews or multi-agency working needs strengthening";
  } else {
    headline = "Inadequate contextual safeguarding — children's external vulnerability is not being systematically assessed or mitigated";
  }

  return {
    safeguarding_rating,
    safeguarding_score: score,
    headline,
    total_risks: total,
    active_risk_count: activeRisks.length,
    high_risk_count: highRisks.length,
    context_diversity: uniqueContextTypes,
    protective_action_rate: protectiveActionRate,
    multi_agency_rate: multiAgencyRate,
    community_mapping_rate: communityMappingRate,
    review_compliance_rate: reviewComplianceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
