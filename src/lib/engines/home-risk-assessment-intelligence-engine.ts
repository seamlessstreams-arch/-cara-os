// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RISK ASSESSMENT INTELLIGENCE ENGINE
// Home-level: synthesises risk assessments and behaviour support plans across
// all children to assess risk management quality, trend analysis, review
// compliance, and mitigation effectiveness.
// CHR 2015 Reg 12, 13. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { meets, below } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RiskAssessmentInput {
  id: string;
  child_id: string;
  domain: string;                          // aggression | absconding | self_harm | exploitation | etc.
  current_level: string;                   // low | medium | high | very_high
  previous_level: string;
  trend: string;                           // increasing | stable | decreasing
  status: string;                          // current | archived
  assessed_date: string;                   // YYYY-MM-DD
  review_date: string;                     // YYYY-MM-DD
  has_child_views: boolean;
  mitigation_count: number;
  effective_mitigations: number;            // mitigations with effectiveness "effective"
}

export interface BehaviourSupportPlanInput {
  id: string;
  child_id: string;
  status: string;                          // active | archived
  last_reviewed: string;                   // YYYY-MM-DD
  review_date: string;                     // YYYY-MM-DD
  has_child_views: boolean;
  primary_behaviour_count: number;
  improving_behaviours: number;
  positive_strategy_count: number;
  de_escalation_stages: number;
  has_safety_plan: boolean;
}

export interface HomeRiskAssessmentInput {
  today: string;
  total_children: number;
  child_ids: string[];
  risk_assessments: RiskAssessmentInput[];
  behaviour_support_plans: BehaviourSupportPlanInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RiskAssessmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RiskProfile {
  total_assessments: number;
  children_with_assessments: string[];
  children_without_assessments: string[];
  high_risk_count: number;
  very_high_risk_count: number;
  domains: Record<string, number>;
  decreasing_trend_count: number;
  increasing_trend_count: number;
  stable_trend_count: number;
  overdue_reviews: number;
  // fab-0: null when no current RAs.
  child_views_rate: number | null;
  mitigation_effectiveness_rate: number | null;
}

export interface BSPProfile {
  total_plans: number;
  active_plans: number;
  children_with_plans: string[];
  overdue_reviews: number;
  // fab-0: null when no active BSPs / no behaviours tracked.
  child_views_rate: number | null;
  improving_behaviour_rate: number | null;
  avg_strategies_per_plan: number | null;
  safety_plan_coverage: number | null;            // % plans with safety plan
}

export interface RiskInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RiskRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeRiskAssessmentResult {
  risk_rating: RiskAssessmentRating;
  risk_score: number;
  headline: string;
  risk_profile: RiskProfile;
  bsp_profile: BSPProfile;
  strengths: string[];
  concerns: string[];
  recommendations: RiskRecommendation[];
  insights: RiskInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): RiskAssessmentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeRiskAssessment(
  input: HomeRiskAssessmentInput,
): HomeRiskAssessmentResult {
  const { today, total_children, child_ids, risk_assessments, behaviour_support_plans } = input;

  const currentRAs = risk_assessments.filter(r => r.status === "current");
  const activeBSPs = behaviour_support_plans.filter(b => b.status === "active");

  // Insufficient data
  if (currentRAs.length === 0 && activeBSPs.length === 0) {
    return {
      risk_rating: "insufficient_data",
      risk_score: 0,
      headline: "No risk assessments or behaviour support plans documented — risk management is essential.",
      risk_profile: emptyRiskProfile(child_ids),
      bsp_profile: emptyBSPProfile(),
      strengths: [],
      concerns: ["No risk assessments or behaviour support plans — every child should have documented risk assessments."],
      recommendations: [{ rank: 1, recommendation: "Complete risk assessments for all children — this is a regulatory requirement.", urgency: "immediate", regulatory_ref: "Reg 12" }],
      insights: [{ text: "Ofsted expects comprehensive risk assessments for every child. Without these, the home cannot evidence safe, individualised care.", severity: "critical" }],
    };
  }

  // ── Risk Profile ──────────────────────────────────────────────────────
  const childrenWithRA = [...new Set(currentRAs.map(r => r.child_id))];
  const childrenWithoutRA = child_ids.filter(id => !childrenWithRA.includes(id));

  const highRisk = currentRAs.filter(r => r.current_level === "high").length;
  const veryHighRisk = currentRAs.filter(r => r.current_level === "very_high").length;

  const domains: Record<string, number> = {};
  for (const r of currentRAs) {
    domains[r.domain] = (domains[r.domain] || 0) + 1;
  }

  const decreasing = currentRAs.filter(r => r.trend === "decreasing").length;
  const increasing = currentRAs.filter(r => r.trend === "increasing").length;
  const stable = currentRAs.filter(r => r.trend === "stable").length;

  const overdueRAReviews = currentRAs.filter(r => r.review_date < today).length;

  const raWithViews = currentRAs.filter(r => r.has_child_views).length;
  // fab-0: null when no current RAs.
  const raViewsRate: number | null = currentRAs.length > 0
    ? Math.round((raWithViews / currentRAs.length) * 100)
    : null;

  const totalMitigations = currentRAs.reduce((s, r) => s + r.mitigation_count, 0);
  const effectiveMitigations = currentRAs.reduce((s, r) => s + r.effective_mitigations, 0);
  // fab-0: null when no mitigations to evaluate.
  const mitigationEffRate: number | null = totalMitigations > 0
    ? Math.round((effectiveMitigations / totalMitigations) * 100)
    : null;

  const riskProfile: RiskProfile = {
    total_assessments: currentRAs.length,
    children_with_assessments: childrenWithRA,
    children_without_assessments: childrenWithoutRA,
    high_risk_count: highRisk,
    very_high_risk_count: veryHighRisk,
    domains,
    decreasing_trend_count: decreasing,
    increasing_trend_count: increasing,
    stable_trend_count: stable,
    overdue_reviews: overdueRAReviews,
    child_views_rate: raViewsRate,
    mitigation_effectiveness_rate: mitigationEffRate,
  };

  // ── BSP Profile ───────────────────────────────────────────────────────
  const childrenWithBSP = [...new Set(activeBSPs.map(b => b.child_id))];
  const overdueBSPReviews = activeBSPs.filter(b => b.review_date < today).length;

  const bspWithViews = activeBSPs.filter(b => b.has_child_views).length;
  // fab-0: null when no active BSPs.
  const bspViewsRate: number | null = activeBSPs.length > 0
    ? Math.round((bspWithViews / activeBSPs.length) * 100)
    : null;

  const totalBehaviours = activeBSPs.reduce((s, b) => s + b.primary_behaviour_count, 0);
  const improvingBehaviours = activeBSPs.reduce((s, b) => s + b.improving_behaviours, 0);
  // fab-0: null when no behaviours tracked.
  const improvingRate: number | null = totalBehaviours > 0
    ? Math.round((improvingBehaviours / totalBehaviours) * 100)
    : null;

  const totalStrategies = activeBSPs.reduce((s, b) => s + b.positive_strategy_count, 0);
  // fab-0: null when no active BSPs.
  const avgStrategies: number | null = activeBSPs.length > 0
    ? Math.round((totalStrategies / activeBSPs.length) * 10) / 10
    : null;

  const withSafetyPlan = activeBSPs.filter(b => b.has_safety_plan).length;
  // fab-0: null when no active BSPs.
  const safetyPlanRate: number | null = activeBSPs.length > 0
    ? Math.round((withSafetyPlan / activeBSPs.length) * 100)
    : null;

  const bspProfile: BSPProfile = {
    total_plans: behaviour_support_plans.length,
    active_plans: activeBSPs.length,
    children_with_plans: childrenWithBSP,
    overdue_reviews: overdueBSPReviews,
    child_views_rate: bspViewsRate,
    improving_behaviour_rate: improvingRate,
    avg_strategies_per_plan: avgStrategies,
    safety_plan_coverage: safetyPlanRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // Coverage (±10)
  if (childrenWithoutRA.length === 0 && total_children > 0) score += 6;
  else if (childrenWithoutRA.length >= 2) score -= 8;
  else if (childrenWithoutRA.length === 1) score -= 3;

  // Risk trends (±10)
  if (increasing === 0 && decreasing > 0) score += 6;
  else if (increasing === 0) score += 3;
  else if (increasing >= 2) score -= 6;
  else score -= 3;

  // Very high / high risk (±6)
  if (veryHighRisk > 0) score -= 4;
  if (highRisk >= 3) score -= 2;

  // Overdue reviews (±8)
  const totalOverdue = overdueRAReviews + overdueBSPReviews;
  if (totalOverdue === 0) score += 4;
  else if (totalOverdue >= 3) score -= 6;
  else score -= 2;

  // Child views (±6) — fab-0: null when no RAs or BSPs.
  const combinedViewsRate: number | null = currentRAs.length + activeBSPs.length > 0
    ? Math.round(((raWithViews + bspWithViews) / (currentRAs.length + activeBSPs.length)) * 100)
    : null;
  if (combinedViewsRate === 100) score += 4;
  else if (meets(combinedViewsRate, 80)) score += 2;
  else if (below(combinedViewsRate, 50)) score -= 4;

  // Mitigation effectiveness (±6)
  if (meets(mitigationEffRate, 80)) score += 4;
  else if (meets(mitigationEffRate, 50)) score += 1;
  else if (totalMitigations > 0) score -= 3;

  // BSP quality (±8)
  if (activeBSPs.length > 0) {
    if (meets(improvingRate, 60)) score += 3;
    else if (below(improvingRate, 30) && totalBehaviours > 0) score -= 3;

    if (safetyPlanRate === 100) score += 3;
    else if (below(safetyPlanRate, 50) && activeBSPs.length > 0) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenWithoutRA.length === 0 && total_children > 0) strengths.push("All children have documented risk assessments — comprehensive risk management in place.");
  if (increasing === 0 && currentRAs.length > 0) strengths.push("No increasing risk trends — current strategies are maintaining or reducing risk levels.");
  if (decreasing > 0) strengths.push(`${decreasing} risk assessment${decreasing > 1 ? "s" : ""} showing decreasing trends — interventions are working.`);
  if (combinedViewsRate === 100 && (currentRAs.length + activeBSPs.length) > 0) strengths.push("Child views captured in all risk assessments and BSPs — child-centred risk management.");
  if (totalMitigations > 0 && meets(mitigationEffRate, 80)) strengths.push(`${mitigationEffRate}% mitigation effectiveness — strategies are working well.`);
  if (totalBehaviours > 0 && meets(improvingRate, 60)) strengths.push(`${improvingRate}% of behaviours improving — behaviour support plans are effective.`);
  if (totalOverdue === 0 && (currentRAs.length + activeBSPs.length) > 0) strengths.push("All risk assessments and BSPs reviewed within timescales.");
  if (safetyPlanRate === 100 && activeBSPs.length > 0) strengths.push("Safety plans in place for all behaviour support plans.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (childrenWithoutRA.length > 0) concerns.push(`${childrenWithoutRA.length} child${childrenWithoutRA.length > 1 ? "ren" : ""} without risk assessments — all children require documented risk management.`);
  if (veryHighRisk > 0) concerns.push(`${veryHighRisk} very high risk assessment${veryHighRisk > 1 ? "s" : ""} — these require enhanced monitoring and multi-agency input.`);
  if (increasing > 0) concerns.push(`${increasing} risk assessment${increasing > 1 ? "s" : ""} with increasing trends — current strategies may not be effective.`);
  if (totalOverdue > 0) concerns.push(`${totalOverdue} overdue review${totalOverdue > 1 ? "s" : ""} — risk assessments and BSPs must be reviewed within agreed timescales.`);
  if (totalMitigations > 0 && below(mitigationEffRate, 50)) concerns.push(`Only ${mitigationEffRate}% mitigation effectiveness — strategies need reviewing and strengthening.`);
  if ((currentRAs.length + activeBSPs.length) > 0 && below(combinedViewsRate, 50)) concerns.push("Child views missing from many risk documents — the child's perspective is essential for effective risk management.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: RiskRecommendation[] = [];
  let rank = 1;

  if (childrenWithoutRA.length > 0) {
    recs.push({ rank: rank++, recommendation: "Complete risk assessments for all children without them — individualised risk management is required.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (increasing > 0) {
    recs.push({ rank: rank++, recommendation: "Review strategies for risk assessments with increasing trends — convene a multi-agency risk meeting if needed.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (totalOverdue > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${totalOverdue} overdue risk assessment/BSP review${totalOverdue > 1 ? "s" : ""} — ensure all are within review date.`, urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (veryHighRisk > 0) {
    recs.push({ rank: rank++, recommendation: "Ensure enhanced monitoring plans are in place for very high risk assessments — multi-agency involvement should be evidenced.", urgency: "soon", regulatory_ref: "Reg 13" });
  }
  if (totalMitigations > 0 && below(mitigationEffRate, 50)) {
    recs.push({ rank: rank++, recommendation: "Review and update mitigation strategies that are not proving effective.", urgency: "planned", regulatory_ref: "Reg 12" });
  }
  if (activeBSPs.length > 0 && safetyPlanRate !== 100) {
    recs.push({ rank: rank++, recommendation: "Ensure all behaviour support plans include a safety plan for crisis scenarios.", urgency: "planned", regulatory_ref: "Reg 13" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: RiskInsight[] = [];

  if (veryHighRisk > 0) {
    insights.push({ text: `${veryHighRisk} very high risk assessment${veryHighRisk > 1 ? "s" : ""} present. Ofsted will examine the home's response, multi-agency involvement, and whether monitoring is proportionate to the risk level.`, severity: "critical" });
  }
  if (increasing >= 2) {
    insights.push({ text: `${increasing} risks are increasing. This pattern suggests current strategies need urgent review — Ofsted will assess whether the home is responding proactively.`, severity: "critical" });
  }
  if (childrenWithoutRA.length > 0) {
    insights.push({ text: `${childrenWithoutRA.length} child${childrenWithoutRA.length > 1 ? "ren" : ""} without risk assessments. Ofsted will view this as a failure to assess and manage risk under Regulation 12.`, severity: "critical" });
  }
  if (decreasing > 0 && increasing === 0 && currentRAs.length >= 2) {
    insights.push({ text: "All risk trends are stable or decreasing — this evidences effective risk management and responsive care practice.", severity: "positive" });
  }
  if (totalMitigations > 0 && meets(mitigationEffRate, 80)) {
    insights.push({ text: `${mitigationEffRate}% mitigation effectiveness is excellent. This demonstrates that the home's strategies are working and children are being kept safe.`, severity: "positive" });
  }
  if (totalBehaviours > 0 && meets(improvingRate, 60)) {
    insights.push({ text: `${improvingRate}% of target behaviours are improving. Behaviour support plans are having a positive impact — excellent evidence of therapeutically informed care.`, severity: "positive" });
  }
  if (combinedViewsRate === 100 && (currentRAs.length + activeBSPs.length) > 0) {
    insights.push({ text: "Child views captured in all risk documents. This is outstanding practice — the child's voice should always inform risk management.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Outstanding risk management — comprehensive assessments, effective mitigations, and decreasing risk trends.";
  } else if (rating === "good") {
    headline = `Good risk management — ${currentRAs.length} assessments across ${childrenWithRA.length} children with ${mitigationEffRate}% mitigation effectiveness.`;
  } else if (rating === "adequate") {
    headline = "Adequate risk management — some improvements needed in coverage, reviews, or strategy effectiveness.";
  } else {
    headline = "Risk management is inadequate — significant gaps in assessments, overdue reviews, or increasing risk trends.";
  }

  return {
    risk_rating: rating,
    risk_score: score,
    headline,
    risk_profile: riskProfile,
    bsp_profile: bspProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyRiskProfile(childIds: string[]): RiskProfile {
  return {
    total_assessments: 0, children_with_assessments: [], children_without_assessments: childIds,
    high_risk_count: 0, very_high_risk_count: 0, domains: {},
    decreasing_trend_count: 0, increasing_trend_count: 0, stable_trend_count: 0,
    overdue_reviews: 0, child_views_rate: null, mitigation_effectiveness_rate: null,
  };
}

function emptyBSPProfile(): BSPProfile {
  return {
    total_plans: 0, active_plans: 0, children_with_plans: [],
    overdue_reviews: 0, child_views_rate: null, improving_behaviour_rate: null,
    avg_strategies_per_plan: null, safety_plan_coverage: null,
  };
}
