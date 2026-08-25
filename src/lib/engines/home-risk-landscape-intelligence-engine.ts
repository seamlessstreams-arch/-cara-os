import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RISK LANDSCAPE INTELLIGENCE ENGINE
// Home-level: synthesises risk assessments across all children — risk
// distribution, trend analysis, mitigation effectiveness, review currency,
// child voice coverage, and domain gaps.
// CHR 2015 Reg 12 (Health & Comfort), Reg 35 (Behaviour), Reg 36.
// SCCIF: "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RiskMitigationInput {
  strategy: string;
  effectiveness: string;         // effective | partially_effective | not_effective
}

export interface RiskAssessmentInput {
  id: string;
  child_id: string;
  domain: string;
  current_level: string;         // low | medium | high | very_high
  previous_level: string;
  trend: string;                 // increasing | stable | decreasing
  status: string;                // current | under_review | superseded | draft
  assessed_date: string;         // YYYY-MM-DD
  review_date: string;           // YYYY-MM-DD
  mitigations: RiskMitigationInput[];
  has_child_views: boolean;
  has_contingency: boolean;
  linked_incident_count: number;
}

export interface HomeRiskLandscapeInput {
  today: string;
  assessments: RiskAssessmentInput[];
  total_children: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RiskLandscapeRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RiskDistributionProfile {
  total_assessments: number;
  current_count: number;
  high_or_very_high_count: number;
  medium_count: number;
  low_count: number;
  domains_covered: string[];
  unique_domains: number;
}

export interface TrendProfile {
  decreasing_count: number;
  stable_count: number;
  increasing_count: number;
  decreasing_rate: number | null;
  increasing_rate: number | null;
}

export interface MitigationProfile {
  total_mitigations: number;
  effective_count: number;
  partially_effective_count: number;
  not_effective_count: number;
  effectiveness_rate: number | null;    // % effective
  avg_mitigations_per_assessment: number | null;
}

export interface CurrencyProfile {
  overdue_reviews: number;
  overdue_rate: number | null;
  upcoming_reviews_7d: number;
  avg_days_since_assessment: number | null;
}

export interface CoverageProfile {
  children_with_assessments: number;
  children_without_assessments: number;
  child_coverage_rate: number | null;
  child_voice_rate: number | null;      // % of assessments with child views
  contingency_rate: number | null;      // % with contingency plan
}

export interface RiskLandscapeInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RiskLandscapeRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeRiskLandscapeResult {
  risk_rating: RiskLandscapeRating;
  risk_score: number | null;
  headline: string;
  distribution_profile: RiskDistributionProfile;
  trend_profile: TrendProfile;
  mitigation_profile: MitigationProfile;
  currency_profile: CurrencyProfile;
  coverage_profile: CoverageProfile;
  strengths: string[];
  concerns: string[];
  recommendations: RiskLandscapeRecommendation[];
  insights: RiskLandscapeInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const ALL_RISK_DOMAINS = [
  "self_harm", "absconding", "aggression", "exploitation",
  "substance_use", "online_safety", "fire_setting",
  "sexual_behaviour", "self_neglect", "emotional_harm",
];

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): RiskLandscapeRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function emptyDistribution(): RiskDistributionProfile {
  return { total_assessments: 0, current_count: 0, high_or_very_high_count: 0, medium_count: 0, low_count: 0, domains_covered: [], unique_domains: 0 };
}

function emptyTrend(): TrendProfile {
  return { decreasing_count: 0, stable_count: 0, increasing_count: 0, decreasing_rate: null, increasing_rate: null };
}

function emptyMitigation(): MitigationProfile {
  return { total_mitigations: 0, effective_count: 0, partially_effective_count: 0, not_effective_count: 0, effectiveness_rate: null, avg_mitigations_per_assessment: 0 };
}

function emptyCurrency(): CurrencyProfile {
  return { overdue_reviews: 0, overdue_rate: null, upcoming_reviews_7d: 0, avg_days_since_assessment: 0 };
}

function emptyCoverage(): CoverageProfile {
  return { children_with_assessments: 0, children_without_assessments: 0, child_coverage_rate: null, child_voice_rate: null, contingency_rate: null };
}

// ── Main Function ──────────────────────────────────────────────────────────

export function computeHomeRiskLandscape(
  input: HomeRiskLandscapeInput,
): HomeRiskLandscapeResult {
  const { today, assessments, total_children } = input;

  // Filter to current assessments only
  const current = assessments.filter(a => a.status === "current");

  if (current.length === 0) {
    return {
      risk_rating: "insufficient_data",
      risk_score: 0,
      headline: "No current risk assessments — the home's risk landscape cannot be evaluated.",
      distribution_profile: emptyDistribution(),
      trend_profile: emptyTrend(),
      mitigation_profile: emptyMitigation(),
      currency_profile: emptyCurrency(),
      coverage_profile: emptyCoverage(),
      strengths: [],
      concerns: ["No current risk assessments are in place."],
      recommendations: [{ rank: 1, recommendation: "Complete risk assessments for all identified risk domains for every child. Each assessment must include triggers, indicators, mitigations, and the child's own views.", urgency: "immediate", regulatory_ref: "Reg 12" }],
      insights: [{ text: "No current risk assessments found. Under Regulation 12, the registered person must ensure that children's health, comfort and wellbeing needs are met, which requires robust and current risk assessment. Ofsted inspectors will expect to see risk assessments that are regularly reviewed and that actively inform day-to-day practice.", severity: "critical" }],
    };
  }

  // ── Distribution Profile ──────────────────────────────────────
  const highOrVeryHigh = current.filter(
    a => a.current_level === "high" || a.current_level === "very_high",
  ).length;
  const medium = current.filter(a => a.current_level === "medium").length;
  const low = current.filter(a => a.current_level === "low").length;
  const domainSet = new Set(current.map(a => a.domain));
  const domainsCovered = ALL_RISK_DOMAINS.filter(d => domainSet.has(d));

  const distributionProfile: RiskDistributionProfile = {
    total_assessments: current.length,
    current_count: current.length,
    high_or_very_high_count: highOrVeryHigh,
    medium_count: medium,
    low_count: low,
    domains_covered: domainsCovered,
    unique_domains: domainsCovered.length,
  };

  // ── Trend Profile ─────────────────────────────────────────────
  const decreasing = current.filter(a => a.trend === "decreasing").length;
  const stable = current.filter(a => a.trend === "stable").length;
  const increasing = current.filter(a => a.trend === "increasing").length;

  const trendProfile: TrendProfile = {
    decreasing_count: decreasing,
    stable_count: stable,
    increasing_count: increasing,
    decreasing_rate: rate(decreasing, current.length),
    increasing_rate: rate(increasing, current.length),
  };

  // ── Mitigation Profile ────────────────────────────────────────
  const allMitigations = current.flatMap(a => a.mitigations);
  const effectiveCount = allMitigations.filter(m => m.effectiveness === "effective").length;
  const partialCount = allMitigations.filter(m => m.effectiveness === "partially_effective").length;
  const notEffective = allMitigations.filter(m => m.effectiveness === "not_effective").length;
  const avgMitPerAssessment = current.length > 0
    ? Math.round((allMitigations.length / current.length) * 10) / 10
    : null;

  const mitigationProfile: MitigationProfile = {
    total_mitigations: allMitigations.length,
    effective_count: effectiveCount,
    partially_effective_count: partialCount,
    not_effective_count: notEffective,
    effectiveness_rate: rate(effectiveCount, allMitigations.length),
    avg_mitigations_per_assessment: avgMitPerAssessment,
  };

  // ── Currency Profile ──────────────────────────────────────────
  const overdue = current.filter(a => a.review_date < today).length;
  const overdueRate = rate(overdue, current.length);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysStr = sevenDaysFromNow.toISOString().slice(0, 10);
  const upcoming7d = current.filter(
    a => a.review_date >= today && a.review_date <= sevenDaysStr,
  ).length;

  const daysSinceAssessments = current.map(a => Math.max(0, daysBetween(a.assessed_date, today)));
  const avgDaysSince = daysSinceAssessments.length > 0
    ? Math.round(daysSinceAssessments.reduce((s, d) => s + d, 0) / daysSinceAssessments.length)
    : null;

  const currencyProfile: CurrencyProfile = {
    overdue_reviews: overdue,
    overdue_rate: overdueRate,
    upcoming_reviews_7d: upcoming7d,
    avg_days_since_assessment: avgDaysSince,
  };

  // ── Coverage Profile ──────────────────────────────────────────
  const childSet = new Set(current.map(a => a.child_id));
  const childrenWithAssessments = childSet.size;
  const childrenWithout = Math.max(0, total_children - childrenWithAssessments);
  const childCoverageRate = total_children > 0
    ? rate(childrenWithAssessments, total_children)
    : (childrenWithAssessments > 0 ? 100 : 0);

  const withChildViews = current.filter(a => a.has_child_views).length;
  const childVoiceRate = rate(withChildViews, current.length);
  const withContingency = current.filter(a => a.has_contingency).length;
  const contingencyRate = rate(withContingency, current.length);

  const coverageProfile: CoverageProfile = {
    children_with_assessments: childrenWithAssessments,
    children_without_assessments: childrenWithout,
    child_coverage_rate: childCoverageRate,
    child_voice_rate: childVoiceRate,
    contingency_rate: contingencyRate,
  };

  // ── Scoring ──────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52 + 28 = 80
  let score = 52;

  // 1. Risk trend (±5) — most important: are risks decreasing?
  const decreasingRate = rate(decreasing, current.length);
  const increasingRate = rate(increasing, current.length);
  if (meets(decreasingRate, 50) && increasing === 0) score += 5;
  else if (meets(decreasingRate, 30) && increasing === 0) score += 3;
  else if (increasing === 0) score += 1;
  else if (increasingRate! <= 25) score += 0;
  else score -= 4;

  // 2. Mitigation effectiveness (±4)
  const effectivenessRate = rate(effectiveCount, allMitigations.length);
  if (allMitigations.length === 0) score -= 3;
  else if (meets(effectivenessRate, 70)) score += 4;
  else if (meets(effectivenessRate, 50)) score += 2;
  else if (meets(effectivenessRate, 30)) score += 0;
  else score -= 3;

  // 3. Review currency (±3)
  if (overdueRate !== null) {
    // unmeasured review currency (no current risks) is neutral, not a penalty
    if (overdueRate === 0) score += 3;
    else if (overdueRate <= 20) score += 1;
    else if (overdueRate <= 50) score += 0;
    else score -= 2;
  }

  // 4. Child voice (±4)
  if (meets(childVoiceRate, 90)) score += 4;
  else if (meets(childVoiceRate, 70)) score += 2;
  else if (meets(childVoiceRate, 50)) score += 0;
  else score -= 3;

  // 5. Contingency plans (±3)
  if (meets(contingencyRate, 90)) score += 3;
  else if (meets(contingencyRate, 70)) score += 1;
  else if (meets(contingencyRate, 50)) score += 0;
  else score -= 2;

  // 6. Child coverage (±3)
  if (meets(childCoverageRate, 100)) score += 3;
  else if (meets(childCoverageRate, 75)) score += 1;
  else if (meets(childCoverageRate, 50)) score += 0;
  else score -= 2;

  // 7. High risk concentration (±3) — fewer high/very_high is better
  const highRate = rate(highOrVeryHigh, current.length);
  if (highOrVeryHigh === 0) score += 3;
  else if (highRate! <= 25) score += 1;
  else if (highRate! <= 50) score += 0;
  else score -= 2;

  // 8. Mitigation depth (±3) — avg mitigations per assessment
  if ((avgMitPerAssessment ?? 0) >= 2.5) score += 3;
  else if ((avgMitPerAssessment ?? 0) >= 2.0) score += 1;
  else if ((avgMitPerAssessment ?? 0) >= 1.0) score += 0;
  else score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(decreasingRate, 50)) strengths.push(`${decreasingRate}% of risk assessments show decreasing trends — interventions are working.`);
  if (meets(effectivenessRate, 70) && allMitigations.length > 0) strengths.push(`${effectivenessRate}% of mitigations rated effective — risk management strategies are well-targeted.`);
  if (meets(childVoiceRate, 90)) strengths.push(`${childVoiceRate}% of assessments include child views — children's perspectives inform risk management.`);
  if (meets(contingencyRate, 90)) strengths.push(`${contingencyRate}% of assessments have contingency plans — staff know what to do in escalation.`);
  if (increasing === 0) strengths.push("No risk assessments show increasing trends — the home is managing risk effectively.");
  if (meets(childCoverageRate, 100) && total_children > 0) strengths.push("All children have current risk assessments — comprehensive safeguarding coverage.");

  // ── Concerns ──────────────────────────────────────────────────
  const concerns: string[] = [];
  if (increasing > 0) concerns.push(`${increasing} risk assessment${increasing > 1 ? "s show" : " shows"} an increasing trend — risks are escalating.`);
  if (highOrVeryHigh > 0 && above(highRate, 50)) concerns.push(`${highOrVeryHigh} of ${current.length} assessments are high or very high risk — concentrated risk profile.`);
  if (above(overdueRate, 50)) concerns.push(`${overdueRate}% of risk assessment reviews are overdue — currency has lapsed.`);
  if (below(childVoiceRate, 50)) concerns.push(`Only ${childVoiceRate}% of assessments include child views — their perspectives are missing from risk planning.`);
  if (notEffective > 0) concerns.push(`${notEffective} mitigation${notEffective > 1 ? "s are" : " is"} rated not effective — strategies need revision.`);
  if (childrenWithout > 0 && total_children > 0) concerns.push(`${childrenWithout} child${childrenWithout > 1 ? "ren have" : " has"} no current risk assessment.`);

  // ── Recommendations ───────────────────────────────────────────
  const recs: RiskLandscapeRecommendation[] = [];
  let rank = 1;

  if (increasing > 0) {
    recs.push({ rank: rank++, recommendation: `${increasing} risk${increasing > 1 ? "s are" : " is"} increasing — convene multi-disciplinary review to reassess triggers and strengthen mitigations.`, urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (above(overdueRate, 20)) {
    recs.push({ rank: rank++, recommendation: `${overdue} risk review${overdue > 1 ? "s are" : " is"} overdue — schedule within 7 days to maintain assessment currency.`, urgency: above(overdueRate, 50) ? "immediate" : "soon", regulatory_ref: "Reg 36" });
  }
  if (notEffective > 0) {
    recs.push({ rank: rank++, recommendation: `${notEffective} mitigation${notEffective > 1 ? "s are" : " is"} rated not effective — review and replace with evidence-based alternatives.`, urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (below(childVoiceRate, 70)) {
    recs.push({ rank: rank++, recommendation: `Child views recorded in only ${childVoiceRate}% of assessments — ensure each child's perspective is captured at every risk review.`, urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (childrenWithout > 0 && total_children > 0) {
    recs.push({ rank: rank++, recommendation: `${childrenWithout} child${childrenWithout > 1 ? "ren" : ""} ha${childrenWithout > 1 ? "ve" : "s"} no risk assessment — complete initial assessments covering all relevant domains.`, urgency: "immediate", regulatory_ref: "Reg 12" });
  }

  // ── Insights ──────────────────────────────────────────────────
  const insights: RiskLandscapeInsight[] = [];

  if (rating === "outstanding") {
    insights.push({ text: `Exemplary risk management — ${current.length} current assessments across ${domainsCovered.length} domains with ${formatRate(decreasingRate)} decreasing trends, ${formatRate(effectivenessRate)} mitigation effectiveness, and ${formatRate(childVoiceRate)} child voice. Ofsted inspectors will find strong evidence that risks are actively managed and reducing.`, severity: "positive" });
  }
  if (increasing > 0) {
    insights.push({ text: `${increasing} risk assessment${increasing > 1 ? "s show" : " shows"} increasing trends. Under SCCIF, inspectors evaluate whether 'risks to children are identified, understood and reduced.' Escalating risk without management response is a significant concern.`, severity: above(increasingRate, 25) ? "critical" : "warning" });
  }
  if (above(overdueRate, 50)) {
    insights.push({ text: `${overdueRate}% of risk reviews are overdue. Risk assessments must be 'regularly reviewed' (Reg 36). Outdated assessments mean staff may be working with inaccurate risk information, directly impacting children's safety.`, severity: "critical" });
  }
  if (childrenWithout > 0 && total_children > 0) {
    insights.push({ text: `${childrenWithout} of ${total_children} children have no current risk assessment. Regulation 12 requires that every child's needs are assessed and met — unassessed risk represents a safeguarding gap.`, severity: "critical" });
  }
  if (notEffective > 0) {
    insights.push({ text: `${notEffective} mitigation strateg${notEffective > 1 ? "ies are" : "y is"} rated not effective. Maintaining ineffective mitigations without revision suggests a lack of reflective practice in risk management.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding risk management — ${current.length} assessments, ${formatRate(decreasingRate)} decreasing, ${formatRate(effectivenessRate)} effective mitigations.`;
  } else if (rating === "good") {
    headline = `Good risk landscape — ${current.length} assessments with manageable risk profile and active mitigation.`;
  } else if (rating === "adequate") {
    headline = `Adequate risk management — ${increasing > 0 ? `${increasing} increasing trend${increasing > 1 ? "s" : ""}` : "gaps in coverage or review currency"} need attention.`;
  } else {
    headline = `Inadequate risk landscape — ${increasing > 0 ? "escalating risks" : "significant gaps in assessment, review, or mitigation"} require urgent action.`;
  }

  return {
    risk_rating: rating,
    risk_score: score,
    headline,
    distribution_profile: distributionProfile,
    trend_profile: trendProfile,
    mitigation_profile: mitigationProfile,
    currency_profile: currencyProfile,
    coverage_profile: coverageProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
