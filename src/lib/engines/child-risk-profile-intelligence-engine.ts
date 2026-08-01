// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD RISK PROFILE INTELLIGENCE ENGINE
// Per-child engine analysing risk assessments across domains,
// risk trajectory, mitigation effectiveness, review compliance,
// and whether risks are being actively managed and reducing.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (safety), Reg 34 (safeguarding),
// Reg 5 (placement plan). SCCIF: "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type RiskDomain =
  | "self_harm" | "absconding" | "aggression" | "exploitation"
  | "substance_use" | "online_safety" | "fire_setting"
  | "sexual_behaviour" | "self_neglect" | "emotional_harm";

export type RiskLevel = "low" | "medium" | "high" | "very_high";
export type RiskTrend = "increasing" | "stable" | "decreasing";
export type MitigationEffectiveness = "effective" | "partially_effective" | "not_effective" | "not_yet_assessed";

export interface RiskMitigationInput {
  strategy: string;
  responsible: string;
  effectiveness: MitigationEffectiveness;
}

export interface RiskAssessmentInput {
  id: string;
  domain: RiskDomain;
  current_level: RiskLevel;
  previous_level: RiskLevel;
  trend: RiskTrend;
  status: string;             // current, under_review, superseded, draft
  assessed_date: string;
  review_date: string;
  triggers: string[];
  mitigations: RiskMitigationInput[];
  has_child_views: boolean;
  linked_incident_count: number;
}

export interface ChildRiskProfileInput {
  today: string;
  child_id: string;
  child_name: string;
  assessments: RiskAssessmentInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RiskManagementRating = "outstanding" | "good" | "adequate" | "inadequate" | "no_assessments";

export interface DomainRiskProfile {
  domain: RiskDomain;
  domain_label: string;
  current_level: RiskLevel;
  previous_level: RiskLevel;
  trend: RiskTrend;
  level_numeric: number;        // 1=low, 2=medium, 3=high, 4=very_high
  is_reducing: boolean;
  is_escalating: boolean;
  mitigation_count: number;
  effective_mitigations: number;
  has_child_views: boolean;
  review_overdue: boolean;
  days_until_review: number;
}

export interface RiskOverview {
  total_domains_assessed: number;
  high_or_very_high_count: number;
  medium_count: number;
  low_count: number;
  improving_count: number;
  stable_count: number;
  escalating_count: number;
  highest_risk_domain: string | null;
  highest_risk_level: RiskLevel | null;
}

export interface MitigationProfile {
  total_mitigations: number;
  effective_count: number;
  partially_effective_count: number;
  not_effective_count: number;
  effectiveness_rate: number | null;     // % effective or partially
  not_yet_assessed_count: number;
}

export interface ReviewComplianceProfile {
  total_current: number;
  overdue_count: number;
  reviews_with_child_views: number;
  child_views_rate: number | null;       // %
}

export interface RiskRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface RiskInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildRiskProfileResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  management_rating: RiskManagementRating;
  management_score: number | null;       // 0-100
  headline: string;
  overview: RiskOverview;
  domain_profiles: DomainRiskProfile[];
  mitigation_profile: MitigationProfile;
  review_compliance: ReviewComplianceProfile;
  strengths: string[];
  concerns: string[];
  recommendations: RiskRecommendation[];
  insights: RiskInsight[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<RiskDomain, string> = {
  self_harm:         "Self-Harm",
  absconding:        "Absconding",
  aggression:        "Aggression",
  exploitation:      "Exploitation",
  substance_use:     "Substance Use",
  online_safety:     "Online Safety",
  fire_setting:      "Fire Setting",
  sexual_behaviour:  "Sexual Behaviour",
  self_neglect:      "Self-Neglect",
  emotional_harm:    "Emotional Harm",
};

const LEVEL_NUMERIC: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function daysUntil(today: string, date: string): number {
  return -daysAgo(today, date);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number | null {
  return d > 0  ? Math.round((n / d) * 100)  : null;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildRiskProfile(
  input: ChildRiskProfileInput,
): ChildRiskProfileResult {
  const { today, child_id, child_name, assessments } = input;

  // Only current assessments (not superseded/draft)
  const current = assessments.filter((a) => a.status === "current" || a.status === "under_review");

  // ── Domain Profiles ───────────────────────────────────────────────────
  const domain_profiles: DomainRiskProfile[] = current.map((a) => {
    const dUntilReview = daysUntil(today, a.review_date);
    const effectiveMitigations = a.mitigations.filter(
      (m) => m.effectiveness === "effective",
    );

    return {
      domain: a.domain,
      domain_label: DOMAIN_LABELS[a.domain] ?? a.domain,
      current_level: a.current_level,
      previous_level: a.previous_level,
      trend: a.trend,
      level_numeric: LEVEL_NUMERIC[a.current_level] ?? 2,
      is_reducing: LEVEL_NUMERIC[a.current_level] < LEVEL_NUMERIC[a.previous_level],
      is_escalating: LEVEL_NUMERIC[a.current_level] > LEVEL_NUMERIC[a.previous_level],
      mitigation_count: a.mitigations.length,
      effective_mitigations: effectiveMitigations.length,
      has_child_views: a.has_child_views,
      review_overdue: dUntilReview < 0,
      days_until_review: dUntilReview,
    };
  }).sort((a, b) => b.level_numeric - a.level_numeric); // Highest risk first

  // ── Overview ──────────────────────────────────────────────────────────
  const highOrVH = current.filter((a) => a.current_level === "high" || a.current_level === "very_high");
  const mediumRisk = current.filter((a) => a.current_level === "medium");
  const lowRisk = current.filter((a) => a.current_level === "low");
  const improving = current.filter((a) => a.trend === "decreasing");
  const stable = current.filter((a) => a.trend === "stable");
  const escalating = current.filter((a) => a.trend === "increasing");

  const highestProfile = domain_profiles[0] ?? null;

  const overview: RiskOverview = {
    total_domains_assessed: current.length,
    high_or_very_high_count: highOrVH.length,
    medium_count: mediumRisk.length,
    low_count: lowRisk.length,
    improving_count: improving.length,
    stable_count: stable.length,
    escalating_count: escalating.length,
    highest_risk_domain: highestProfile?.domain_label ?? null,
    highest_risk_level: highestProfile?.current_level ?? null,
  };

  // ── Mitigation Profile ────────────────────────────────────────────────
  const allMitigations = current.flatMap((a) => a.mitigations);
  const effectiveM = allMitigations.filter((m) => m.effectiveness === "effective");
  const partiallyM = allMitigations.filter((m) => m.effectiveness === "partially_effective");
  const notEffectiveM = allMitigations.filter((m) => m.effectiveness === "not_effective");
  const notAssessedM = allMitigations.filter((m) => m.effectiveness === "not_yet_assessed");

  const mitigation_profile: MitigationProfile = {
    total_mitigations: allMitigations.length,
    effective_count: effectiveM.length,
    partially_effective_count: partiallyM.length,
    not_effective_count: notEffectiveM.length,
    effectiveness_rate: pct(effectiveM.length + partiallyM.length, allMitigations.length),
    not_yet_assessed_count: notAssessedM.length,
  };

  // ── Review Compliance ─────────────────────────────────────────────────
  const overdueReviews = domain_profiles.filter((d) => d.review_overdue);
  const withViews = current.filter((a) => a.has_child_views);

  const review_compliance: ReviewComplianceProfile = {
    total_current: current.length,
    overdue_count: overdueReviews.length,
    reviews_with_child_views: withViews.length,
    child_views_rate: pct(withViews.length, current.length),
  };

  // ── Score ─────────────────────────────────────────────────────────────
  let score = 50;

  if (assessments.length === 0) {
    score = 0;
  } else {
    // Risk trajectory
    const improvingRate = pct(improving.length, current.length);
    if ((improvingRate ?? 0) >= 60) score += 15;
    else if ((improvingRate ?? 0) >= 40) score += 8;
    if (escalating.length > 0) score -= escalating.length * 5;

    // Overall risk levels
    if (highOrVH.length === 0 && current.length >= 2) score += 10;
    if (highOrVH.length > 0) score -= highOrVH.length * 3;

    // Mitigation effectiveness
    if ((mitigation_profile.effectiveness_rate ?? 0) >= 80 && allMitigations.length >= 3) score += 10;
    else if ((mitigation_profile.effectiveness_rate ?? 0) >= 60) score += 5;
    if (notEffectiveM.length > 0) score -= notEffectiveM.length * 3;

    // Child views
    if (review_compliance.child_views_rate === 100 && current.length >= 2) score += 5;
    else if ((review_compliance.child_views_rate ?? 0) < 50 && current.length >= 2) score -= 5;

    // Review compliance
    if (overdueReviews.length > 0) score -= overdueReviews.length * 4;

    // Domain coverage breadth
    if (current.length >= 3) score += 3;

    // No very_high currently
    const veryHigh = current.filter((a) => a.current_level === "very_high");
    if (veryHigh.length > 0) score -= veryHigh.length * 5;
  }

  score = clamp(score, 0, 100);

  const management_rating: RiskManagementRating =
    assessments.length === 0 ? "no_assessments" :
    score >= 80 ? "outstanding" :
    score >= 65 ? "good" :
    score >= 45 ? "adequate" :
    "inadequate";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`Risk management: ${management_rating}`);
  if (current.length > 0) {
    parts.push(`${current.length} active risk domain${current.length !== 1 ? "s" : ""}`);
  }
  if (highOrVH.length > 0) {
    parts.push(`${highOrVH.length} high/very high`);
  }
  if (improving.length > 0) parts.push(`${improving.length} reducing`);
  if (escalating.length > 0) parts.push(`${escalating.length} ESCALATING`);
  if (overdueReviews.length > 0) parts.push(`${overdueReviews.length} review${overdueReviews.length !== 1 ? "s" : ""} overdue`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (management_rating === "outstanding" || management_rating === "good") {
    strengths.push(`Risk management rated ${management_rating} (${score}%). Risks are comprehensively assessed, mitigations are working, and ${child_name}'s risk profile is being actively managed and reduced.`);
  }

  if (improving.length > 0 && (pct(improving.length, current.length) ?? 0) >= 50) {
    const improvingNames = improving.map((a) => DOMAIN_LABELS[a.domain]).join(", ");
    strengths.push(`${improving.length} risk${improving.length !== 1 ? "s" : ""} reducing (${improvingNames}). Active risk reduction demonstrates that interventions are working and the child's safety is improving.`);
  }

  if ((mitigation_profile.effectiveness_rate ?? 0) >= 80 && allMitigations.length >= 3) {
    strengths.push(`${mitigation_profile.effectiveness_rate}% mitigation effectiveness. Strategies are being implemented and are making a measurable difference to risk levels — this is evidence of high-quality safeguarding practice.`);
  }

  if (review_compliance.child_views_rate === 100 && current.length >= 2) {
    strengths.push(`${child_name}'s views captured in 100% of risk assessments. The child understands their own risks and contributes to safety planning — a hallmark of truly child-centred safeguarding.`);
  }

  if (highOrVH.length === 0 && current.length >= 2) {
    strengths.push(`No high or very high risks currently. All risk domains are at manageable levels, suggesting that the care plan and safeguarding measures are keeping ${child_name} safe.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (assessments.length === 0) {
    concerns.push(`No risk assessments recorded for ${child_name}. Every looked-after child should have risks formally assessed across relevant domains. This is a serious safeguarding gap.`);
  }

  if (escalating.length > 0) {
    const escalatingNames = escalating.map((a) => DOMAIN_LABELS[a.domain]).join(", ");
    concerns.push(`${escalating.length} risk${escalating.length !== 1 ? "s" : ""} ESCALATING (${escalatingNames}). An escalating risk requires immediate review of mitigations and may need multi-agency intervention.`);
  }

  if (overdueReviews.length > 0) {
    concerns.push(`${overdueReviews.length} risk review${overdueReviews.length !== 1 ? "s" : ""} overdue. Risk assessments must be reviewed within agreed timescales — particularly for high-risk domains where circumstances can change rapidly.`);
  }

  if (notEffectiveM.length > 0) {
    concerns.push(`${notEffectiveM.length} mitigation${notEffectiveM.length !== 1 ? "s" : ""} assessed as not effective. Ineffective strategies must be replaced — continuing with strategies that don't work leaves the child exposed to known risks.`);
  }

  if ((review_compliance.child_views_rate ?? 0) < 100 && current.length >= 2) {
    const missing = current.length - withViews.length;
    concerns.push(`${child_name}'s views missing from ${missing} risk assessment${missing !== 1 ? "s" : ""}. The child's understanding of their own risks is essential for effective safety planning.`);
  }

  const veryHighCurrent = current.filter((a) => a.current_level === "very_high");
  if (veryHighCurrent.length > 0) {
    concerns.push(`${veryHighCurrent.length} risk domain${veryHighCurrent.length !== 1 ? "s" : ""} at VERY HIGH level. This requires enhanced monitoring, multi-agency involvement, and may need consideration of whether the current placement can safely manage this risk.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: RiskRecommendation[] = [];
  let rank = 0;

  if (escalating.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Urgently review the ${escalating.length} escalating risk${escalating.length !== 1 ? "s" : ""}. Convene a risk review meeting, update mitigations, and consider whether additional professional input is needed.`,
      urgency: "immediate",
      domain: "escalation",
      regulatory_ref: "Reg 12",
    });
  }

  if (overdueReviews.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete the ${overdueReviews.length} overdue risk review${overdueReviews.length !== 1 ? "s" : ""}. Risk assessments lose their value if not regularly updated — the child's circumstances may have changed significantly.`,
      urgency: "immediate",
      domain: "compliance",
      regulatory_ref: "Reg 12",
    });
  }

  if (assessments.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete risk assessments for ${child_name} across all relevant domains. Use the child's history, placement referral, and direct conversations to identify and assess risks.`,
      urgency: "immediate",
      domain: "assessment",
      regulatory_ref: "Reg 12",
    });
  }

  if (notEffectiveM.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Replace the ${notEffectiveM.length} ineffective mitigation${notEffectiveM.length !== 1 ? "s" : ""} with alternative strategies. Involve the child and multi-agency partners in identifying what might work better.`,
      urgency: "soon",
      domain: "mitigations",
      regulatory_ref: "Reg 34",
    });
  }

  if ((review_compliance.child_views_rate ?? 0) < 100 && current.length >= 1) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Capture ${child_name}'s views for all risk assessments. Use keywork sessions or direct conversations to explore the child's understanding of their risks and what helps them feel safe.`,
      urgency: "soon",
      domain: "participation",
      regulatory_ref: "Reg 7",
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: RiskInsight[] = [];

  if (management_rating === "inadequate") {
    insights.push({
      severity: "critical",
      text: `Risk management is inadequate (${score}%). Ofsted will examine whether risks are identified, assessed, and effectively managed. ${escalating.length > 0 ? `${escalating.length} escalating risks and ` : ""}${overdueReviews.length > 0 ? `${overdueReviews.length} overdue reviews ` : "current gaps "}represent a serious safeguarding concern.`,
    });
  }

  if (escalating.length > 0) {
    const worst = escalating[0];
    insights.push({
      severity: "critical",
      text: `${DOMAIN_LABELS[worst.domain]} risk is escalating (${worst.previous_level} → ${worst.current_level}). This means current mitigations are not containing the risk. Without intervention, the child's safety may be compromised.`,
    });
  }

  if (assessments.length === 0) {
    insights.push({
      severity: "critical",
      text: `No risk assessments on file. This would be a major finding at inspection — every child in care should have risks formally assessed and managed. It leaves the home unable to evidence that it knows and is managing this child's vulnerabilities.`,
    });
  }

  if (management_rating === "outstanding") {
    insights.push({
      severity: "positive",
      text: `Risk management is outstanding (${score}%). Comprehensive assessments across ${current.length} domains, effective mitigations, and the child's active participation in safety planning. This exemplifies the kind of risk-aware, child-centred practice that inspectors commend.`,
    });
  }

  if (improving.length >= 2 && (mitigation_profile.effectiveness_rate ?? 0) >= 80) {
    insights.push({
      severity: "positive",
      text: `${improving.length} risks reducing with ${mitigation_profile.effectiveness_rate}% mitigation effectiveness. This powerful combination shows that risk assessment isn't just paperwork — it's driving real improvements in ${child_name}'s safety and wellbeing.`,
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    management_rating,
    management_score: score,
    headline,
    overview,
    domain_profiles,
    mitigation_profile,
    review_compliance,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
