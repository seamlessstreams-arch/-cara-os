// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SELF-HARM SAFETY PLAN INTELLIGENCE ENGINE
// Pure deterministic engine: safety plan coverage, co-production quality,
// warning sign identification, coping strategy breadth, contact network,
// means restriction, review compliance, and child voice in safety planning.
// CHR 2015 Reg 12 (Protection) / Reg 13 (Behaviour management).
// SCCIF: Helped and protected; Health and well-being.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SelfHarmSafetyPlanRecordInput {
  id: string;
  child_id: string;
  plan_date: string; // ISO date
  status: string; // "not_currently_needed"|"active_preventive"|"active_recent_incident"|"in_review"
  co_produced_with_count: number;
  warning_signs_external_count: number;
  warning_signs_internal_count: number;
  early_trigger_count: number;
  internal_coping_strategy_count: number;
  social_distraction_count: number;
  people_to_contact_count: number;
  professional_contact_count: number;
  means_restriction_count: number;
  reasons_to_live_count: number;
  reasons_for_hope_count: number;
  child_signed_off: boolean;
  professionals_informed_count: number;
  review_frequency: string; // "weekly"|"fortnightly"|"monthly"|"quarterly"|"after_incident"
  has_next_review_date: boolean;
  next_review_date: string; // ISO date
  has_child_voice: boolean;
  has_staff_observation: boolean;
  flag_for_review_count: number;
}

export interface SelfHarmSafetyPlanInput {
  today: string;
  total_children: number;
  plans: SelfHarmSafetyPlanRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SelfHarmSafetyPlanRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SelfHarmSafetyPlanResult {
  plan_rating: SelfHarmSafetyPlanRating;
  plan_score: number;
  headline: string;
  total_plans: number;
  children_with_plan_rate: number;
  active_plan_rate: number;
  co_production_rate: number;
  warning_sign_coverage_rate: number;
  coping_strategy_rate: number;
  contact_network_rate: number;
  child_voice_rate: number;
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

function toRating(score: number): SelfHarmSafetyPlanRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeSelfHarmSafetyPlan(
  input: SelfHarmSafetyPlanInput,
): SelfHarmSafetyPlanResult {
  const { plans, total_children, today } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      plan_rating: "insufficient_data",
      plan_score: 0,
      headline: "No data available for self-harm safety plan intelligence analysis",
      total_plans: 0,
      children_with_plan_rate: 0,
      active_plan_rate: 0,
      co_production_rate: 0,
      warning_sign_coverage_rate: 0,
      coping_strategy_rate: 0,
      contact_network_rate: 0,
      child_voice_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = plans.length;
  const uniqueChildren = new Set(plans.map(p => p.child_id)).size;
  const childrenWithPlanRate = pct(uniqueChildren, total_children);

  const activePlans = plans.filter(
    p => p.status === "active_preventive" || p.status === "active_recent_incident" || p.status === "in_review",
  );
  const activePlanRate = pct(activePlans.length, total);

  // Co-production: plans where co_produced_with > 0 AND child_signed_off
  const coProducedPlans = plans.filter(p => p.co_produced_with_count > 0 && p.child_signed_off);
  const coProductionRate = pct(coProducedPlans.length, total);

  // Warning sign coverage: plans with BOTH internal AND external warning signs
  const withWarningCoverage = plans.filter(
    p => p.warning_signs_external_count > 0 && p.warning_signs_internal_count > 0,
  );
  const warningSignCoverageRate = pct(withWarningCoverage.length, total);

  // Coping strategies: plans with internal coping + social distractions
  const withCopingStrategies = plans.filter(
    p => p.internal_coping_strategy_count > 0 && p.social_distraction_count > 0,
  );
  const copingStrategyRate = pct(withCopingStrategies.length, total);

  // Contact network: plans with people to contact + professional contacts
  const withContactNetwork = plans.filter(
    p => p.people_to_contact_count > 0 && p.professional_contact_count > 0,
  );
  const contactNetworkRate = pct(withContactNetwork.length, total);

  // Child voice
  const withChildVoice = plans.filter(p => p.has_child_voice).length;
  const childVoiceRate = pct(withChildVoice, total);

  // Means restriction
  const withMeansRestriction = plans.filter(p => p.means_restriction_count > 0).length;

  // Review compliance
  const todayMs = new Date(today).getTime();
  const withCurrentReview = plans.filter(p => {
    if (!p.has_next_review_date || !p.next_review_date) return false;
    const reviewMs = new Date(p.next_review_date).getTime();
    return reviewMs >= todayMs; // review date is in the future or today
  }).length;

  // Flags for review
  const totalFlags = plans.reduce((s, p) => s + p.flag_for_review_count, 0);

  // Reasons to live / hope
  const withReasons = plans.filter(p => p.reasons_to_live_count > 0 || p.reasons_for_hope_count > 0).length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Co-production quality
  if (total === 0) {
    score -= 3;
  } else {
    if (coProductionRate >= 80) score += 6;
    else if (coProductionRate >= 50) score += 2;
    else if (coProductionRate < 25) score -= 5;
  }

  // Modifier 2: Warning sign identification
  if (total === 0) {
    score -= 1;
  } else {
    if (warningSignCoverageRate >= 80) score += 5;
    else if (warningSignCoverageRate >= 50) score += 2;
    else if (warningSignCoverageRate < 25) score -= 5;
  }

  // Modifier 3: Coping strategy breadth
  if (total === 0) {
    score -= 1;
  } else {
    if (copingStrategyRate >= 75) score += 5;
    else if (copingStrategyRate >= 40) score += 2;
    else if (copingStrategyRate < 20) score -= 4;
  }

  // Modifier 4: Contact network completeness
  if (total === 0) {
    // no adjustment
  } else {
    if (contactNetworkRate >= 80) score += 5;
    else if (contactNetworkRate >= 50) score += 2;
    else if (contactNetworkRate < 25) score -= 4;
  }

  // Modifier 5: Child voice in safety planning
  if (total === 0) {
    score -= 1;
  } else {
    if (childVoiceRate >= 80) score += 4;
    else if (childVoiceRate >= 50) score += 1;
    else if (childVoiceRate < 20) score -= 4;
  }

  // Modifier 6: Review compliance and means restriction
  if (total === 0) {
    score -= 2;
  } else {
    const reviewRate = pct(withCurrentReview, total);
    const meansRate = pct(withMeansRestriction, total);
    if (reviewRate >= 75 && meansRate >= 60) score += 5;
    else if (reviewRate >= 50 || meansRate >= 40) score += 2;
    else if (reviewRate < 25 && meansRate < 20) score -= 3;
  }

  score = clamp(score, 0, 100);

  const plan_rating = total === 0 && plans.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (coProductionRate >= 80 && total > 0)
    strengths.push("Safety plans are genuinely co-produced with children — plans reflect their voice and ownership");
  if (warningSignCoverageRate >= 80 && total > 0)
    strengths.push("Warning signs are comprehensively identified — both internal and external indicators are documented");
  if (copingStrategyRate >= 75 && total > 0)
    strengths.push("Children have diverse coping strategies available — internal techniques and social distractions are well-planned");
  if (contactNetworkRate >= 80 && total > 0)
    strengths.push("Contact networks are complete — children know who to reach out to in personal and professional circles");
  if (childVoiceRate >= 80 && total > 0)
    strengths.push("Children's voices are consistently present in safety planning — their perspective shapes protective measures");
  if (pct(withMeansRestriction, total) >= 60 && total > 0)
    strengths.push("Means restriction agreements are in place — practical steps reduce access to methods of self-harm");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No self-harm safety plans exist — children at risk may lack structured protective measures");
  if (coProductionRate < 25 && total > 0)
    concerns.push("Safety plans are rarely co-produced — children may not feel ownership or engagement with their safety plan");
  if (warningSignCoverageRate < 25 && total > 0)
    concerns.push("Warning signs are poorly identified — staff may miss early indicators of escalating risk");
  if (copingStrategyRate < 20 && total > 0)
    concerns.push("Coping strategies are inadequate — children lack practical alternatives when experiencing urges");
  if (contactNetworkRate < 25 && total > 0)
    concerns.push("Contact networks are incomplete — children may not know who to reach in crisis");
  if (childVoiceRate < 20 && total > 0)
    concerns.push("Children's voices are absent from safety planning — plans may not reflect their actual needs");
  if (totalFlags > 5)
    concerns.push("Multiple flags for review across plans suggest safety plans may be outdated or insufficient");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: SelfHarmSafetyPlanResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Assess all children for self-harm risk and create co-produced safety plans for those identified as at risk", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  if (coProductionRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure all safety plans are co-produced with children, with their input documented and sign-off obtained", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 13" });
  if (warningSignCoverageRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Review all safety plans to ensure both internal and external warning signs are identified for each child", urgency: "soon", regulatory_ref: "SCCIF Helped & Protected" });
  if (copingStrategyRate < 40 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Work with each child to develop a broader range of coping strategies including internal techniques and social activities", urgency: "soon", regulatory_ref: "SCCIF Health" });
  if (contactNetworkRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Complete contact networks in all plans — ensure children have both personal and professional contacts identified", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  if (pct(withCurrentReview, total) < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Schedule and complete overdue safety plan reviews to ensure plans remain current and responsive", urgency: "planned", regulatory_ref: "CHR 2015 Reg 13" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: SelfHarmSafetyPlanResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No safety plans means Ofsted cannot verify the home has structured responses to self-harm risk", severity: "critical" });
  if (total > 0 && coProductionRate >= 80 && childVoiceRate >= 80)
    insights.push({ text: "Co-produced plans with strong child voice demonstrate genuine partnership in safety planning", severity: "positive" });
  if (total > 0 && copingStrategyRate >= 75 && contactNetworkRate >= 80)
    insights.push({ text: "Comprehensive coping strategies combined with complete contact networks provide robust crisis support", severity: "positive" });
  const recentIncidentPlans = plans.filter(p => p.status === "active_recent_incident").length;
  if (recentIncidentPlans > 0)
    insights.push({ text: "Active plans following recent incidents require heightened monitoring and more frequent review", severity: "warning" });
  if (totalFlags > 3 && total > 0)
    insights.push({ text: "Flagged plans may indicate changing risk levels — prioritise review of flagged safety plans", severity: "warning" });
  if (pct(withReasons, total) >= 75 && total > 0)
    insights.push({ text: "Reasons to live and reasons for hope are documented — children's protective narratives strengthen resilience", severity: "positive" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (plan_rating === "insufficient_data") {
    headline = "No data available for self-harm safety plan intelligence analysis";
  } else if (plan_rating === "outstanding") {
    headline = "Outstanding safety planning — co-produced plans with comprehensive warning signs, coping strategies and support networks";
  } else if (plan_rating === "good") {
    headline = "Good safety planning with clear co-production and structured crisis support";
  } else if (plan_rating === "adequate") {
    headline = "Safety plans exist but co-production, completeness or review currency needs improvement";
  } else {
    headline = "Inadequate safety planning — children at risk lack structured, co-produced protective measures";
  }

  return {
    plan_rating,
    plan_score: score,
    headline,
    total_plans: total,
    children_with_plan_rate: childrenWithPlanRate,
    active_plan_rate: activePlanRate,
    co_production_rate: coProductionRate,
    warning_sign_coverage_rate: warningSignCoverageRate,
    coping_strategy_rate: copingStrategyRate,
    contact_network_rate: contactNetworkRate,
    child_voice_rate: childVoiceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
