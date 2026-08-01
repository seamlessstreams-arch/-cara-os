// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PLACEMENT STABILITY DEPTH INTELLIGENCE ENGINE
// Home-level DEPTH: analyses disruption prevention plans, placement end
// summaries, impact assessments, stability records, and stability meetings.
// CHR 2015 Reg 36 "Placement stability."
// ══════════════════════════════════════════════════════════════════════════════

// ── Slim Input Types ───────────────────────────────────────────────────────

export interface StabilityRecordInput {
  id: string;
  child_id: string;
  days_in_placement: number;
  previous_placements: number;
  stability_risk: string;   // "low" | "medium" | "high" | "critical"
  trend: string;            // "improving" | "stable" | "declining"
  next_review: string;
  strengths_count: number;
  concerns_count: number;
}

export interface StabilityMeetingInput {
  id: string;
  child_id: string;
  meeting_date: string;
  risk_level: string;       // "high" | "medium" | "low"
  status: string;           // "placement_stable" | "at_risk" | "stabilised" | "ended"
  agreements_count: number;
  child_view_provided: boolean;
}

export interface DisruptionPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  risk_of_disruption_level: string;  // "low" | "moderate" | "high" | "critical"
  next_review_date: string;
  child_aware_of_plan: boolean;
  child_contribution_provided: boolean;
  signed_off_by_la: boolean;
  proactive_actions_count: number;
}

export interface PlacementEndInput {
  id: string;
  end_date: string;
  end_reason: string;
  duration_months: number;
  child_reflection_provided: boolean;
  avg_outcome_rating: number | null;
}

export interface ImpactAssessmentInput {
  id: string;
  assessment_date: string;
  status: string;             // "approved" | "declined" | "pending" | "approved_with_conditions"
  overall_risk: string;       // "low" | "medium" | "high"
  impact_on_existing_count: number;
  conditions_count: number;
}

export interface MatchingReferralInput {
  id: string;
  referral_date: string;
  status: string;
  overall_match: string;      // "strong" | "good" | "moderate" | "poor" | "not_assessed"
  concerns_count: number;
}

export interface HomePlacementStabilityDepthInput {
  today: string;
  stability_records: StabilityRecordInput[];
  stability_meetings: StabilityMeetingInput[];
  disruption_plans: DisruptionPlanInput[];
  placement_ends: PlacementEndInput[];
  impact_assessments: ImpactAssessmentInput[];
  matching_referrals: MatchingReferralInput[];
  total_children: number;
}

// ── Output Types ───────────────────────────────────────────────────────────

export type PlacementStabilityDepthRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StabilityRiskProfile {
  total_records: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  critical_risk_count: number;
  low_risk_rate: number | null;
}

export interface DisruptionPlanProfile {
  total_plans: number;
  child_coverage: number;
  child_aware_rate: number | null;
  la_sign_off_rate: number | null;
  avg_proactive_actions: number | null;
}

export interface MeetingProfile {
  total_meetings: number;
  avg_agreements: number | null;
  child_view_rate: number | null;
  stabilised_rate: number | null;
}

export interface PlacementEndProfile {
  total_ends: number;
  planned_rate: number | null;
  avg_outcome_rating: number | null;
  avg_duration_months: number | null;
  child_reflection_rate: number | null;
}

export interface ImpactAssessmentProfile {
  total_assessments: number;
  completion_rate: number | null;
  low_risk_rate: number | null;
  conditions_adherence_rate: number | null;
}

export interface MatchingProfile {
  total_referrals: number;
  strong_good_match_rate: number | null;
  low_concerns_rate: number | null;
}

export interface DepthInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DepthRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomePlacementStabilityDepthResult {
  depth_rating: PlacementStabilityDepthRating;
  depth_score: number | null;
  headline: string;
  stability_risk_profile: StabilityRiskProfile;
  disruption_plan_profile: DisruptionPlanProfile;
  meeting_profile: MeetingProfile;
  placement_end_profile: PlacementEndProfile;
  impact_assessment_profile: ImpactAssessmentProfile;
  matching_profile: MatchingProfile;
  strengths: string[];
  concerns: string[];
  recommendations: DepthRecommendation[];
  insights: DepthInsight[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PlacementStabilityDepthRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

const PLANNED_END_REASONS = new Set([
  "planned_move_home", "planned_step_down", "planned_move_on_16_plus",
  "adoption", "family_reunification", "age_out", "long_term_foster",
]);

// ── Main Compute ───────────────────────────────────────────────────────────

export function computeHomePlacementStabilityDepth(
  input: HomePlacementStabilityDepthInput,
): HomePlacementStabilityDepthResult {
  const {
    today, stability_records, stability_meetings, disruption_plans,
    placement_ends, impact_assessments, matching_referrals, total_children,
  } = input;

  // ── Insufficient data check ────────────────────────────────────
  const hasData = stability_records.length > 0
    || stability_meetings.length > 0
    || disruption_plans.length > 0
    || placement_ends.length > 0
    || impact_assessments.length > 0
    || matching_referrals.length > 0;

  if (!hasData) {
    return {
      depth_rating: "insufficient_data",
      depth_score: 0,
      headline: "No placement stability depth data — assessment cannot be completed.",
      stability_risk_profile: emptyRiskProfile(),
      disruption_plan_profile: emptyDisruptionProfile(),
      meeting_profile: emptyMeetingProfile(),
      placement_end_profile: emptyEndProfile(),
      impact_assessment_profile: emptyImpactProfile(),
      matching_profile: emptyMatchingProfile(),
      strengths: [],
      concerns: ["No placement stability depth data recorded."],
      recommendations: [{ rank: 1, recommendation: "Establish stability records, disruption prevention plans, and impact assessments for all children in placement.", urgency: "immediate", regulatory_ref: "Reg 36" }],
      insights: [{ text: "No depth data exists. Ofsted expects clear evidence of proactive placement stability work including disruption prevention, stability monitoring, and impact assessments.", severity: "critical" }],
    };
  }

  // ── Stability Risk Profile ─────────────────────────────────────
  const lowRiskCount = stability_records.filter(r => r.stability_risk === "low").length;
  const mediumRiskCount = stability_records.filter(r => r.stability_risk === "medium").length;
  const highRiskCount = stability_records.filter(r => r.stability_risk === "high").length;
  const criticalRiskCount = stability_records.filter(r => r.stability_risk === "critical").length;
  const lowRiskRate = pct(lowRiskCount, stability_records.length);

  const stabilityRiskProfile: StabilityRiskProfile = {
    total_records: stability_records.length,
    low_risk_count: lowRiskCount,
    medium_risk_count: mediumRiskCount,
    high_risk_count: highRiskCount,
    critical_risk_count: criticalRiskCount,
    low_risk_rate: lowRiskRate,
  };

  // ── Disruption Plan Profile ────────────────────────────────────
  const uniqueChildrenWithPlans = new Set(disruption_plans.map(p => p.child_id)).size;
  const disruptionChildCoverage = pct(uniqueChildrenWithPlans, total_children);
  const childAwareCount = disruption_plans.filter(p => p.child_aware_of_plan).length;
  const childAwareRate = pct(childAwareCount, disruption_plans.length);
  const laSignOffCount = disruption_plans.filter(p => p.signed_off_by_la).length;
  const laSignOffRate = pct(laSignOffCount, disruption_plans.length);
  const avgProactiveActions = disruption_plans.length > 0
    ? Math.round((disruption_plans.reduce((s, p) => s + p.proactive_actions_count, 0) / disruption_plans.length) * 10) / 10
    : null;

  const disruptionPlanProfile: DisruptionPlanProfile = {
    total_plans: disruption_plans.length,
    child_coverage: disruptionChildCoverage,
    child_aware_rate: childAwareRate,
    la_sign_off_rate: laSignOffRate,
    avg_proactive_actions: avgProactiveActions,
  };

  // ── Meeting Profile ────────────────────────────────────────────
  const totalMeetings = stability_meetings.length;
  const avgAgreements = totalMeetings > 0
    ? Math.round((stability_meetings.reduce((s, m) => s + m.agreements_count, 0) / totalMeetings) * 10) / 10
    : null;
  const childViewCount = stability_meetings.filter(m => m.child_view_provided).length;
  const childViewRate = pct(childViewCount, totalMeetings);
  const stabilisedCount = stability_meetings.filter(m => m.status === "placement_stable" || m.status === "stabilised").length;
  const stabilisedRate = pct(stabilisedCount, totalMeetings);

  const meetingProfile: MeetingProfile = {
    total_meetings: totalMeetings,
    avg_agreements: avgAgreements,
    child_view_rate: childViewRate,
    stabilised_rate: stabilisedRate,
  };

  // ── Placement End Profile ──────────────────────────────────────
  const totalEnds = placement_ends.length;
  const plannedEnds = placement_ends.filter(e => PLANNED_END_REASONS.has(e.end_reason)).length;
  const plannedRate = pct(plannedEnds, totalEnds);
  const avgOutcomeRating = totalEnds > 0
    ? Math.round((placement_ends.reduce((s, e) => s + (e.avg_outcome_rating ?? 0), 0) / totalEnds) * 10) / 10
    : null;
  const avgDuration = totalEnds > 0
    ? Math.round((placement_ends.reduce((s, e) => s + e.duration_months, 0) / totalEnds) * 10) / 10
    : null;
  const childReflectionCount = placement_ends.filter(e => e.child_reflection_provided).length;
  const childReflectionRate = pct(childReflectionCount, totalEnds);

  const placementEndProfile: PlacementEndProfile = {
    total_ends: totalEnds,
    planned_rate: plannedRate,
    avg_outcome_rating: avgOutcomeRating,
    avg_duration_months: avgDuration,
    child_reflection_rate: childReflectionRate,
  };

  // ── Impact Assessment Profile ──────────────────────────────────
  const totalAssessments = impact_assessments.length;
  const completedAssessments = impact_assessments.filter(
    a => a.status === "approved" || a.status === "approved_with_conditions" || a.status === "declined",
  ).length;
  const completionRate = pct(completedAssessments, totalAssessments);
  const lowRiskAssessments = impact_assessments.filter(a => a.overall_risk === "low").length;
  const impactLowRiskRate = pct(lowRiskAssessments, totalAssessments);
  const withConditions = impact_assessments.filter(a => a.status === "approved_with_conditions").length;
  const conditionsAdherenceRate = totalAssessments > 0
    ? pct(totalAssessments - withConditions, totalAssessments)
    : null;

  const impactAssessmentProfile: ImpactAssessmentProfile = {
    total_assessments: totalAssessments,
    completion_rate: completionRate,
    low_risk_rate: impactLowRiskRate,
    conditions_adherence_rate: conditionsAdherenceRate,
  };

  // ── Matching Profile ───────────────────────────────────────────
  const totalReferrals = matching_referrals.length;
  const strongGoodCount = matching_referrals.filter(
    r => r.overall_match === "strong" || r.overall_match === "good",
  ).length;
  const strongGoodMatchRate = pct(strongGoodCount, totalReferrals);
  const lowConcernsCount = matching_referrals.filter(r => r.concerns_count <= 1).length;
  const lowConcernsRate = pct(lowConcernsCount, totalReferrals);

  const matchingProfileData: MatchingProfile = {
    total_referrals: totalReferrals,
    strong_good_match_rate: strongGoodMatchRate,
    low_concerns_rate: lowConcernsRate,
  };

  // ── Scoring ────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52 + 28 = 80 (outstanding threshold)
  let score = 52;

  // 1. Stability risk profile (±5): low risk rate high → +, critical → −
  if (stability_records.length > 0) {
    if (lowRiskRate >= 80 && criticalRiskCount === 0) score += 5;
    else if (lowRiskRate >= 60 && criticalRiskCount === 0) score += 3;
    else if (lowRiskRate >= 40) score += 1;
    else if (criticalRiskCount >= 2) score -= 5;
    else score -= 2;
  }
  // No records → no modifier (0)

  // 2. Disruption prevention planning (±4): child coverage, child-aware, LA sign-off
  if (disruption_plans.length > 0) {
    if (disruptionChildCoverage >= 80 && childAwareRate >= 80 && laSignOffRate >= 80) score += 4;
    else if (disruptionChildCoverage >= 60 && childAwareRate >= 60) score += 2;
    else if (disruptionChildCoverage >= 40) score += 0;
    else score -= 4;
  }
  // No plans → no modifier (0)

  // 3. Stability meeting responsiveness (±3): agreements tracked, child views
  if (totalMeetings > 0) {
    if ((avgAgreements ?? 0) >= 3 && childViewRate >= 80) score += 3;
    else if ((avgAgreements ?? 0) >= 2 && childViewRate >= 60) score += 1;
    else if (childViewRate < 40) score -= 3;
    else score -= 1;
  }
  // No meetings → no modifier (0)

  // 4. Placement end quality (±4): planned endings rate, good outcome ratings
  if (totalEnds > 0) {
    if (plannedRate >= 80 && (avgOutcomeRating ?? 0) >= 4) score += 4;
    else if (plannedRate >= 60 && (avgOutcomeRating ?? 0) >= 3) score += 2;
    else if (plannedRate >= 40) score += 0;
    else score -= 4;
  }
  // No ends → no modifier (0)

  // 5. Impact assessment thoroughness (±3): completion rate, conditions adherence
  if (totalAssessments > 0) {
    if (completionRate >= 90 && (conditionsAdherenceRate ?? 0) >= 80) score += 3;
    else if (completionRate >= 70) score += 1;
    else if (completionRate < 50) score -= 3;
    else score -= 1;
  }
  // No assessments → no modifier (0)

  // 6. Matching quality (±3): strong/good match rate, low concerns
  if (totalReferrals > 0) {
    if (strongGoodMatchRate >= 80 && lowConcernsRate >= 80) score += 3;
    else if (strongGoodMatchRate >= 60) score += 1;
    else if (strongGoodMatchRate < 40) score -= 3;
    else score -= 1;
  }
  // No referrals → no modifier (0)

  // 7. Trend trajectory (±3): improving trends → +, declining → −
  if (stability_records.length > 0) {
    const improvingCount = stability_records.filter(r => r.trend === "improving").length;
    const decliningCount = stability_records.filter(r => r.trend === "declining").length;
    const improvingRate = pct(improvingCount, stability_records.length);
    const decliningRate = pct(decliningCount, stability_records.length);
    if (improvingRate >= 60) score += 3;
    else if (improvingRate >= 40 && decliningRate <= 20) score += 1;
    else if (decliningRate >= 50) score -= 3;
    else score -= 1;
  }
  // No records → no modifier (0)

  // 8. Review compliance (±3): reviews on time → +, overdue → −
  if (stability_records.length > 0) {
    const overdueCount = stability_records.filter(r => r.next_review <= today).length;
    const overdueRate = pct(overdueCount, stability_records.length);
    if (overdueRate === 0) score += 3;
    else if (overdueRate <= 20) score += 1;
    else if (overdueRate >= 60) score -= 3;
    else score -= 1;
  }
  // No records → no modifier (0)

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ──────────────────────────────────────────────────
  const strengths: string[] = [];
  if (lowRiskRate >= 80 && stability_records.length > 0) strengths.push(`${lowRiskRate}% of stability records show low risk — children are settled and secure.`);
  if (disruptionChildCoverage >= 80 && disruption_plans.length > 0) strengths.push(`Disruption prevention plans cover ${disruptionChildCoverage}% of children — proactive stability work.`);
  if (childAwareRate >= 80 && disruption_plans.length > 0) strengths.push(`${childAwareRate}% of children are aware of their disruption prevention plans — strong participation.`);
  if (laSignOffRate >= 80 && disruption_plans.length > 0) strengths.push(`${laSignOffRate}% of plans signed off by LA — multi-agency collaboration.`);
  if (childViewRate >= 80 && totalMeetings > 0) strengths.push(`Child views captured in ${childViewRate}% of stability meetings — children's voices are heard.`);
  if (plannedRate >= 80 && totalEnds > 0) strengths.push(`${plannedRate}% of placement endings were planned — minimal disruption to children.`);
  if (completionRate >= 90 && totalAssessments > 0) strengths.push(`${completionRate}% impact assessment completion rate — thorough decision-making.`);
  if (strongGoodMatchRate >= 80 && totalReferrals > 0) strengths.push(`${strongGoodMatchRate}% of referrals show strong/good matching — careful placement decisions.`);

  // ── Concerns ───────────────────────────────────────────────────
  const concerns: string[] = [];
  if (criticalRiskCount >= 2) concerns.push(`${criticalRiskCount} children at critical stability risk — urgent intervention required.`);
  if (disruptionChildCoverage < 50 && total_children > 0 && disruption_plans.length > 0) concerns.push(`Disruption prevention plans cover only ${disruptionChildCoverage}% of children — many children lack proactive support.`);
  if (childViewRate < 50 && totalMeetings > 0) concerns.push(`Child views captured in only ${childViewRate}% of stability meetings — Ofsted expects children's voices at the centre.`);
  if (plannedRate < 50 && totalEnds > 0) concerns.push(`Only ${plannedRate}% of placement endings were planned — high disruption rate.`);
  if (completionRate < 50 && totalAssessments > 0) concerns.push(`Impact assessment completion is only ${completionRate}% — decisions being made without full assessment.`);
  if (strongGoodMatchRate < 40 && totalReferrals > 0) concerns.push(`Only ${strongGoodMatchRate}% of referrals show strong/good match — placement quality at risk.`);
  if (stability_records.length > 0) {
    const decliningCount = stability_records.filter(r => r.trend === "declining").length;
    const decliningRate = pct(decliningCount, stability_records.length);
    if (decliningRate >= 50) concerns.push(`${decliningRate}% of stability records show declining trend — systematic issues.`);
  }
  if (stability_records.length > 0) {
    const overdueCount = stability_records.filter(r => r.next_review <= today).length;
    const overdueRate = pct(overdueCount, stability_records.length);
    if (overdueRate >= 50) concerns.push(`${overdueRate}% of stability reviews are overdue — compliance failure.`);
  }

  // ── Recommendations ────────────────────────────────────────────
  const recs: DepthRecommendation[] = [];
  let rank = 1;

  if (criticalRiskCount >= 2) {
    recs.push({ rank: rank++, recommendation: `${criticalRiskCount} children at critical risk — convene emergency multi-agency stability meetings and review all care plans.`, urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (disruption_plans.length === 0 && total_children > 0) {
    recs.push({ rank: rank++, recommendation: "No disruption prevention plans exist — create plans for all children, especially those with previous placement breakdowns.", urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (childViewRate < 50 && totalMeetings > 0) {
    recs.push({ rank: rank++, recommendation: `Child views captured in only ${childViewRate}% of meetings — ensure all stability meetings include the child's perspective.`, urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (completionRate < 70 && totalAssessments > 0) {
    recs.push({ rank: rank++, recommendation: `Impact assessment completion is ${completionRate}% — ensure all assessments are completed before placement decisions.`, urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (stability_records.length > 0) {
    const overdueCount = stability_records.filter(r => r.next_review <= today).length;
    if (overdueCount > 0) {
      recs.push({ rank: rank++, recommendation: `${overdueCount} stability reviews overdue — schedule immediately and ensure compliance.`, urgency: "soon", regulatory_ref: "Reg 36" });
    }
  }

  // ── Insights ───────────────────────────────────────────────────
  const insights: DepthInsight[] = [];

  if (rating === "outstanding") {
    insights.push({ text: `Placement stability depth work is exemplary across all domains. Disruption prevention, stability monitoring, impact assessment, and matching are all operating at the highest standard. Ofsted will recognise a home with embedded, proactive placement stability practice.`, severity: "positive" });
  }
  if (criticalRiskCount >= 2) {
    insights.push({ text: `${criticalRiskCount} children at critical stability risk demands urgent multi-agency intervention. Ofsted will scrutinise whether the home has identified triggers and implemented preventive strategies for each child.`, severity: "critical" });
  }
  if (plannedRate < 50 && totalEnds > 0) {
    insights.push({ text: `A high proportion of unplanned placement endings indicates systemic issues with placement stability. Ofsted will examine disruption prevention planning, early warning systems, and multi-agency response.`, severity: "critical" });
  }
  if (stability_records.length > 0) {
    const improvingCount = stability_records.filter(r => r.trend === "improving").length;
    const improvingRate = pct(improvingCount, stability_records.length);
    if (improvingRate >= 60) {
      insights.push({ text: `${improvingRate}% of stability records show improving trends — evidence of effective intervention and support. This trajectory demonstrates responsive care.`, severity: "positive" });
    }
  }

  // ── Headline ───────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding placement stability depth — proactive disruption prevention, strong matching, and comprehensive stability monitoring.`;
  } else if (rating === "good") {
    headline = "Good placement stability depth — effective practice with minor areas for development.";
  } else if (rating === "adequate") {
    headline = "Adequate placement stability depth — disruption prevention, meeting quality, or assessment thoroughness need improvement.";
  } else {
    headline = "Placement stability depth is inadequate — significant gaps in disruption prevention, stability monitoring, or placement outcomes.";
  }

  return {
    depth_rating: rating,
    depth_score: score,
    headline,
    stability_risk_profile: stabilityRiskProfile,
    disruption_plan_profile: disruptionPlanProfile,
    meeting_profile: meetingProfile,
    placement_end_profile: placementEndProfile,
    impact_assessment_profile: impactAssessmentProfile,
    matching_profile: matchingProfileData,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ─────────────────────────────────────────────────────────

function emptyRiskProfile(): StabilityRiskProfile {
  return { total_records: 0, low_risk_count: 0, medium_risk_count: 0, high_risk_count: 0, critical_risk_count: 0, low_risk_rate: 0 };
}

function emptyDisruptionProfile(): DisruptionPlanProfile {
  return { total_plans: 0, child_coverage: 0, child_aware_rate: 0, la_sign_off_rate: 0, avg_proactive_actions: 0 };
}

function emptyMeetingProfile(): MeetingProfile {
  return { total_meetings: 0, avg_agreements: 0, child_view_rate: 0, stabilised_rate: 0 };
}

function emptyEndProfile(): PlacementEndProfile {
  return { total_ends: 0, planned_rate: 0, avg_outcome_rating: 0, avg_duration_months: 0, child_reflection_rate: 0 };
}

function emptyImpactProfile(): ImpactAssessmentProfile {
  return { total_assessments: 0, completion_rate: 0, low_risk_rate: 0, conditions_adherence_rate: 0 };
}

function emptyMatchingProfile(): MatchingProfile {
  return { total_referrals: 0, strong_good_match_rate: 0, low_concerns_rate: 0 };
}
