// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PLACEMENT DISRUPTION PREVENTION INTELLIGENCE ENGINE
// Home-level: analyses disruption plans, placement endings, stability factors,
// child involvement, professional engagement, and review compliance to assess
// overall placement disruption prevention effectiveness.
// CHR 2015 Reg 5 (Engaging, activities, community), SCCIF: "Stability" /
// "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DisruptionPlanInput {
  id: string;
  child_id: string;
  risk_level: string; // "low"|"building"|"heightened"|"acute"
  child_aware: boolean;
  child_contribution_recorded: boolean;
  professionals_count: number;
  proactive_actions_count: number;
  support_network_count: number;
  warning_signs_count: number;
  signed_off_by_la: boolean;
  reviewed_recently: boolean; // true if reviewed within last 3 months
}

export interface PlacementEndInput {
  id: string;
  end_reason: string; // "planned_move_home"|"planned_step_down"|"planned_move_on_16_plus"|"adoption"|"family_reunification"|"placement_disruption"|"age_out"|"long_term_foster"
  duration_months: number;
  had_positive_outcomes: boolean;
}

export interface StabilityFactorInput {
  id: string;
  child_id: string;
  factor_type: string; // "key_worker_relationship"|"school_stability"|"family_contact"|"therapeutic_support"|"peer_relationships"|"environmental_comfort"
  strength: string; // "strong"|"moderate"|"fragile"|"absent"
}

export interface DisruptionPreventionInput {
  today: string;
  total_children: number;
  disruption_plans: DisruptionPlanInput[];
  placement_ends: PlacementEndInput[];
  stability_factors: StabilityFactorInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DisruptionPreventionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DisruptionPreventionResult {
  disruption_rating: DisruptionPreventionRating;
  disruption_score: number | null;
  headline: string;
  children_with_plans: number;
  planned_ending_rate: number | null;
  disruption_rate: number | null;
  average_placement_months: number | null;
  high_risk_children: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: {
    text: string;
    severity: "critical" | "warning" | "positive";
  }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): DisruptionPreventionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computePlacementDisruptionPrevention(
  input: DisruptionPreventionInput,
): DisruptionPreventionResult {
  const { total_children, disruption_plans, placement_ends, stability_factors } = input;

  // ── Insufficient data guard ──────────────────────────────────────
  if (total_children === 0) {
    return {
      disruption_rating: "insufficient_data",
      disruption_score: 0,
      headline: "No children recorded — disruption prevention cannot be assessed.",
      children_with_plans: 0,
      planned_ending_rate: null,
      disruption_rate: null,
      average_placement_months: 0,
      high_risk_children: 0,
      strengths: [],
      concerns: ["No children recorded in the home."],
      recommendations: [
        {
          rank: 1,
          recommendation: "Ensure all current children are recorded with accurate placement data before assessing disruption prevention.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5",
        },
      ],
      insights: [
        {
          text: "No child data available. Ofsted requires clear evidence that homes actively prevent placement disruption through proactive planning and multi-agency collaboration.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Metrics ──────────────────────────────────────────────────────

  // Children with plans — unique child_ids
  const uniqueChildIds = new Set(disruption_plans.map((p) => p.child_id));
  const childrenWithPlans = uniqueChildIds.size;

  // Placement ending rates
  const totalEndings = placement_ends.length;
  const disruptionEndings = placement_ends.filter(
    (e) => e.end_reason === "placement_disruption",
  ).length;
  const plannedEndings = totalEndings - disruptionEndings;
  const plannedEndingRate = rate(plannedEndings, totalEndings);
  const disruptionRate = rate(disruptionEndings, totalEndings);

  // Average placement months
  const averagePlacementMonths =
    totalEndings > 0
      ? Math.round(
          (placement_ends.reduce((s, e) => s + e.duration_months, 0) / totalEndings) * 10,
        ) / 10
      : null;

  // High risk children (heightened or acute)
  const highRiskChildIds = new Set(
    disruption_plans
      .filter((p) => p.risk_level === "heightened" || p.risk_level === "acute")
      .map((p) => p.child_id),
  );
  const highRiskChildren = highRiskChildIds.size;

  // ── Modifier inputs ──────────────────────────────────────────────

  // 1. Plan coverage
  const planCoveragePct = rate(childrenWithPlans, total_children);

  // 3. Child involvement (aware AND contributed)
  const involvedPlans = disruption_plans.filter(
    (p) => p.child_aware && p.child_contribution_recorded,
  ).length;
  const childInvolvementPct = rate(involvedPlans, disruption_plans.length);

  // 4. Stability factor strength
  const strongOrModerate = stability_factors.filter(
    (f) => f.strength === "strong" || f.strength === "moderate",
  ).length;
  const stabilityStrengthPct = rate(strongOrModerate, stability_factors.length);

  // 5. Professional engagement (plans with professionals_count >= 2)
  const professionalPlans = disruption_plans.filter(
    (p) => p.professionals_count >= 2,
  ).length;
  const professionalEngagementPct = rate(professionalPlans, disruption_plans.length);

  // 6. Review compliance
  const reviewedPlans = disruption_plans.filter((p) => p.reviewed_recently).length;
  const reviewCompliancePct = rate(reviewedPlans, disruption_plans.length);

  // ── Scoring ──────────────────────────────────────────────────────
  let score = 52;

  // 1. Plan coverage (±5)
  if (meets(planCoveragePct, 90)) score += 5;
  else if (meets(planCoveragePct, 60)) score += 2;
  else if (meets(planCoveragePct, 30)) score += 0;
  else score -= 5;

  // 2. Planned ending rate (+6/-5)
  if (totalEndings === 0) {
    score += 3;
  } else if (meets(plannedEndingRate, 90)) {
    score += 6;
  } else if (meets(plannedEndingRate, 70)) {
    score += 3;
  } else if (meets(plannedEndingRate, 50)) {
    score += 0;
  } else {
    score -= 5;
  }

  // 3. Child involvement (+5/-4)
  if (meets(childInvolvementPct, 90)) score += 5;
  else if (meets(childInvolvementPct, 60)) score += 2;
  else if (meets(childInvolvementPct, 30)) score += 0;
  else score -= 4;

  // 4. Stability factor strength (+5/-5)
  if (stability_factors.length === 0) {
    score -= 1;
  } else if (meets(stabilityStrengthPct, 80)) {
    score += 5;
  } else if (meets(stabilityStrengthPct, 60)) {
    score += 2;
  } else if (meets(stabilityStrengthPct, 40)) {
    score += 0;
  } else {
    score -= 5;
  }

  // 5. Professional engagement (+4/-4)
  if (meets(professionalEngagementPct, 80)) score += 4;
  else if (meets(professionalEngagementPct, 60)) score += 1;
  else if (meets(professionalEngagementPct, 30)) score += 0;
  else score -= 4;

  // 6. Review compliance (+5/-5)
  if (meets(reviewCompliancePct, 90)) score += 5;
  else if (meets(reviewCompliancePct, 70)) score += 2;
  else if (meets(reviewCompliancePct, 40)) score += 0;
  else score -= 5;

  // Clamp
  score = clamp(score, 0, 100);

  const rating = toRating(score);

  // ── Strengths ────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(planCoveragePct, 90)) {
    strengths.push("Excellent disruption plan coverage across the home — at least 90% of children have active plans.");
  }
  if (meets(plannedEndingRate, 90) && totalEndings > 0) {
    strengths.push("Over 90% of placement endings were planned, reflecting strong transition management.");
  }
  if (disruptionEndings === 0 && totalEndings > 0) {
    strengths.push("No placement disruptions recorded — all endings were managed and planned.");
  }
  if (meets(childInvolvementPct, 90) && disruption_plans.length > 0) {
    strengths.push("Children are meaningfully involved in their disruption plans with high awareness and recorded contributions.");
  }
  if (stability_factors.length > 0 && stability_factors.every((f) => f.strength === "strong" || f.strength === "moderate")) {
    strengths.push("All stability factors across children are strong or moderate, indicating a well-supported placement environment.");
  }
  if (meets(reviewCompliancePct, 90) && disruption_plans.length > 0) {
    strengths.push("Disruption plans are consistently reviewed within the required 3-month cycle.");
  }

  // ── Concerns ─────────────────────────────────────────────────────
  const concerns: string[] = [];

  const acuteChildren = disruption_plans.filter((p) => p.risk_level === "acute");
  if (acuteChildren.length > 0) {
    concerns.push(`${acuteChildren.length} child(ren) at acute risk level requiring immediate multi-agency intervention.`);
  }
  if (above(disruptionRate, 20)) {
    concerns.push(`Disruption rate of ${disruptionRate}% exceeds the 20% threshold — placement stability is under significant pressure.`);
  }
  if (below(planCoveragePct, 50)) {
    concerns.push("Fewer than half of children have active disruption prevention plans in place.");
  }
  const absentFactors = stability_factors.filter((f) => f.strength === "absent");
  if (absentFactors.length > 0) {
    concerns.push(`${absentFactors.length} stability factor(s) rated as absent — critical protective elements are missing for some children.`);
  }
  if (below(reviewCompliancePct, 50) && disruption_plans.length > 0) {
    concerns.push("Fewer than half of disruption plans have been reviewed within the required timeframe.");
  }

  // ── Recommendations ──────────────────────────────────────────────
  const recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[] = [];

  if (acuteChildren.length > 0) {
    recommendations.push({
      rank: recommendations.length + 1,
      recommendation: "Convene emergency multi-agency disruption meeting for all children at acute risk level within 48 hours.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5",
    });
  }

  if (above(disruptionRate, 20)) {
    recommendations.push({
      rank: recommendations.length + 1,
      recommendation: "Review all recent placement disruptions to identify systemic causes and implement preventative strategies.",
      urgency: "immediate",
      regulatory_ref: "SCCIF Stability",
    });
  }

  if (below(planCoveragePct, 50)) {
    recommendations.push({
      rank: recommendations.length + 1,
      recommendation: "Develop disruption prevention plans for all children without active plans, prioritising those with known risk factors.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5",
    });
  }

  if (absentFactors.length > 0) {
    recommendations.push({
      rank: recommendations.length + 1,
      recommendation: "Address absent stability factors by strengthening key worker relationships, school links, and therapeutic support pathways.",
      urgency: "soon",
      regulatory_ref: "SCCIF Stability",
    });
  }

  if (below(reviewCompliancePct, 50) && disruption_plans.length > 0) {
    recommendations.push({
      rank: recommendations.length + 1,
      recommendation: "Establish a review schedule to ensure all disruption plans are reviewed at least quarterly.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5",
    });
  }

  if (below(childInvolvementPct, 60) && disruption_plans.length > 0 && recommendations.length < 5) {
    recommendations.push({
      rank: recommendations.length + 1,
      recommendation: "Increase child participation in disruption planning by ensuring all children are informed and their contributions are recorded.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5",
    });
  }

  if (below(professionalEngagementPct, 60) && disruption_plans.length > 0 && recommendations.length < 5) {
    recommendations.push({
      rank: recommendations.length + 1,
      recommendation: "Strengthen multi-agency involvement in disruption plans to ensure at least two professionals are engaged per plan.",
      urgency: "planned",
      regulatory_ref: "SCCIF Stability",
    });
  }

  // Cap at 5
  const cappedRecommendations = recommendations.slice(0, 5);

  // ── Insights ─────────────────────────────────────────────────────
  const insights: {
    text: string;
    severity: "critical" | "warning" | "positive";
  }[] = [];

  if (disruptionEndings === 0 && totalEndings > 0) {
    insights.push({
      text: "No placement disruptions have occurred — the home is demonstrating effective stability support and proactive disruption prevention.",
      severity: "positive",
    });
  }

  if (highRiskChildren > 0) {
    insights.push({
      text: `${highRiskChildren} child(ren) are at heightened or acute risk of placement disruption. Immediate, coordinated intervention is essential to prevent breakdown.`,
      severity: "critical",
    });
  }

  const fragileFactors = stability_factors.filter((f) => f.strength === "fragile");
  if (fragileFactors.length >= 3) {
    insights.push({
      text: `${fragileFactors.length} stability factors are rated as fragile, suggesting underlying vulnerabilities that could escalate without targeted support.`,
      severity: "warning",
    });
  }

  // Cap at 3
  const cappedInsights = insights.slice(0, 3);

  // ── Headline ─────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Outstanding placement stability with no disruptions";
      break;
    case "good":
      headline = "Good stability — minor gaps in review cycles";
      break;
    case "adequate":
      headline = "Adequate — disruption risk needs active management";
      break;
    case "inadequate":
      headline = "Inadequate — placement stability at serious risk";
      break;
    default:
      headline = "No children recorded — disruption prevention cannot be assessed.";
  }

  return {
    disruption_rating: rating,
    disruption_score: score,
    headline,
    children_with_plans: childrenWithPlans,
    planned_ending_rate: plannedEndingRate,
    disruption_rate: disruptionRate,
    average_placement_months: averagePlacementMonths,
    high_risk_children: highRiskChildren,
    strengths,
    concerns,
    recommendations: cappedRecommendations,
    insights: cappedInsights,
  };
}
