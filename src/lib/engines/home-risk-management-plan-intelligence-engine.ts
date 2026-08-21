// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RISK MANAGEMENT PLAN INTELLIGENCE ENGINE
// Pure deterministic engine: risk plan coverage, risk level governance,
// trigger identification, strategy effectiveness, emergency planning,
// multi-agency input, child voice, review compliance, and approval governance.
// CHR 2015 Reg 12 (Protection) / Reg 13 (Behaviour management).
// SCCIF: Helped and protected; Leadership and management.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RiskManagementPlanRecordInput {
  id: string;
  child_id: string;
  risk_category: string; // "self_harm"|"absconding"|"aggression"|"exploitation"|"substance_misuse"|"sexualised_behaviour"|"online_risk"|"radicalisation"|"trafficking"|"other"
  current_risk_level: string; // "low"|"medium"|"high"|"very_high"
  previous_risk_level: string; // "low"|"medium"|"high"|"very_high"
  has_risk_description: boolean;
  trigger_count: number;
  high_likelihood_trigger_count: number;
  warning_signal_count: number;
  strategy_count: number;
  effective_strategy_count: number; // "effective" rated strategies
  has_emergency_plan: boolean;
  protective_factor_count: number;
  has_escalation_procedure: boolean;
  has_review_date: boolean;
  review_date: string; // ISO date
  has_last_reviewed: boolean;
  has_approved_by: boolean;
  multi_agency_input_count: number;
  has_child_views: boolean;
  status: string; // "active"|"under_review"|"archived"|"draft"
}

export interface RiskManagementPlanInput {
  today: string;
  total_children: number;
  plans: RiskManagementPlanRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RiskManagementPlanRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RiskManagementPlanResult {
  rmp_rating: RiskManagementPlanRating;
  rmp_score: number;
  headline: string;
  total_plans: number;
  children_with_plan_rate: number;
  active_plan_rate: number;
  trigger_identification_rate: number;
  strategy_effectiveness_rate: number;
  emergency_plan_rate: number;
  child_voice_rate: number;
  approval_rate: number;
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

function toRating(score: number): RiskManagementPlanRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeRiskManagementPlan(
  input: RiskManagementPlanInput,
): RiskManagementPlanResult {
  const { plans, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      rmp_rating: "insufficient_data",
      rmp_score: 0,
      headline: "No data available for risk management plan intelligence analysis",
      total_plans: 0,
      children_with_plan_rate: 0,
      active_plan_rate: 0,
      trigger_identification_rate: 0,
      strategy_effectiveness_rate: 0,
      emergency_plan_rate: 0,
      child_voice_rate: 0,
      approval_rate: 0,
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

  const activePlans = plans.filter(p => p.status === "active" || p.status === "under_review");
  const activePlanRate = pct(activePlans.length, total);

  // Trigger identification: plans with triggers AND warning signals
  const withTriggerIdentification = plans.filter(p => p.trigger_count > 0 && p.warning_signal_count > 0);
  const triggerIdentificationRate = pct(withTriggerIdentification.length, total);

  // Strategy effectiveness
  const totalStrategies = plans.reduce((s, p) => s + p.strategy_count, 0);
  const totalEffective = plans.reduce((s, p) => s + p.effective_strategy_count, 0);
  const strategyEffectivenessRate = pct(totalEffective, totalStrategies);

  // Emergency plans
  const withEmergencyPlan = plans.filter(p => p.has_emergency_plan).length;
  const emergencyPlanRate = pct(withEmergencyPlan, total);

  // Child voice
  const withChildVoice = plans.filter(p => p.has_child_views).length;
  const childVoiceRate = pct(withChildVoice, total);

  // Approval governance
  const withApproval = plans.filter(p => p.has_approved_by).length;
  const approvalRate = pct(withApproval, total);

  // Multi-agency input
  const withMultiAgency = plans.filter(p => p.multi_agency_input_count > 0).length;

  // High-risk plans
  const highRiskPlans = plans.filter(p => p.current_risk_level === "high" || p.current_risk_level === "very_high");

  // Risk escalation: plans where current > previous
  const riskLevels: Record<string, number> = { low: 1, medium: 2, high: 3, very_high: 4 };
  const escalatedRisks = plans.filter(
    p => (riskLevels[p.current_risk_level] ?? 0) > (riskLevels[p.previous_risk_level] ?? 0),
  );

  // De-escalated risks: plans where current < previous
  const deEscalatedRisks = plans.filter(
    p => (riskLevels[p.current_risk_level] ?? 0) < (riskLevels[p.previous_risk_level] ?? 0),
  );

  // Escalation procedure
  const withEscalationProcedure = plans.filter(p => p.has_escalation_procedure).length;

  // Protective factors
  const withProtectiveFactors = plans.filter(p => p.protective_factor_count > 0).length;

  // Risk category diversity
  const uniqueCategories = new Set(plans.map(p => p.risk_category)).size;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Trigger identification and warning signals
  if (total === 0) {
    score -= 3;
  } else {
    if (triggerIdentificationRate >= 80) score += 6;
    else if (triggerIdentificationRate >= 50) score += 2;
    else if (triggerIdentificationRate < 25) score -= 5;
  }

  // Modifier 2: Strategy effectiveness
  if (total === 0) {
    score -= 1;
  } else {
    if (totalStrategies === 0) score -= 1;
    else if (strategyEffectivenessRate >= 70) score += 5;
    else if (strategyEffectivenessRate >= 40) score += 2;
    else if (strategyEffectivenessRate < 20) score -= 5;
  }

  // Modifier 3: Emergency planning and escalation procedures
  if (total === 0) {
    score -= 1;
  } else {
    const escalationRate = pct(withEscalationProcedure, total);
    if (emergencyPlanRate >= 80 && escalationRate >= 75) score += 5;
    else if (emergencyPlanRate >= 50 || escalationRate >= 50) score += 2;
    else if (emergencyPlanRate < 25 && escalationRate < 25) score -= 4;
  }

  // Modifier 4: Child voice
  if (total === 0) {
    // no adjustment
  } else {
    if (childVoiceRate >= 80) score += 5;
    else if (childVoiceRate >= 50) score += 2;
    else if (childVoiceRate < 20) score -= 4;
  }

  // Modifier 5: Approval governance
  if (total === 0) {
    score -= 1;
  } else {
    if (approvalRate >= 85) score += 4;
    else if (approvalRate >= 50) score += 1;
    else if (approvalRate < 25) score -= 4;
  }

  // Modifier 6: Multi-agency input and protective factors
  if (total === 0) {
    score -= 2;
  } else {
    const multiAgencyRate = pct(withMultiAgency, total);
    const protectiveRate = pct(withProtectiveFactors, total);
    if (multiAgencyRate >= 70 && protectiveRate >= 70) score += 5;
    else if (multiAgencyRate >= 40 || protectiveRate >= 40) score += 2;
    else if (multiAgencyRate < 20 && protectiveRate < 20) score -= 3;
  }

  score = clamp(score, 0, 100);

  const rmp_rating = total === 0 && plans.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (triggerIdentificationRate >= 80 && total > 0)
    strengths.push("Triggers and warning signals are thoroughly identified — staff can anticipate and prevent risk escalation");
  if (strategyEffectivenessRate >= 70 && totalStrategies > 0)
    strengths.push("Management strategies are demonstrably effective — evidence-based approaches are reducing risk");
  if (emergencyPlanRate >= 80 && total > 0)
    strengths.push("Emergency plans are in place for high-risk scenarios — the home is prepared to respond to crisis situations");
  if (childVoiceRate >= 80 && total > 0)
    strengths.push("Children's views inform risk management — their perspective shapes how risks are understood and managed");
  if (approvalRate >= 85 && total > 0)
    strengths.push("Risk plans are formally approved — governance and accountability structures are strong");
  if (deEscalatedRisks.length > 0 && total > 0)
    strengths.push("Risk de-escalation is evident — management strategies are successfully reducing risk levels over time");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No risk management plans — the home cannot demonstrate systematic risk identification and mitigation");
  if (triggerIdentificationRate < 25 && total > 0)
    concerns.push("Triggers and warning signals are poorly identified — staff cannot anticipate risk escalation");
  if (strategyEffectivenessRate < 20 && totalStrategies > 0)
    concerns.push("Management strategies are largely ineffective — current approaches are not reducing risk");
  if (emergencyPlanRate < 25 && total > 0)
    concerns.push("Emergency plans are absent from most risk plans — the home is unprepared for crisis scenarios");
  if (childVoiceRate < 20 && total > 0)
    concerns.push("Children's views are absent from risk planning — risks are being managed without the child's input");
  if (approvalRate < 25 && total > 0)
    concerns.push("Risk plans lack formal approval — governance oversight is insufficient");
  if (escalatedRisks.length > 3)
    concerns.push("Multiple risks have escalated — current management strategies may be failing to contain identified risks");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: RiskManagementPlanResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Conduct risk assessments for all children and create formal risk management plans for identified risks", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  if (triggerIdentificationRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Complete trigger analysis for all risk plans — identify triggers, likelihood and warning signals", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 13" });
  if (emergencyPlanRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Develop emergency response plans for all high-risk scenarios including escalation procedures", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  if (childVoiceRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure children's views about their own risks are captured and used to shape management strategies", urgency: "soon", regulatory_ref: "SCCIF Helped & Protected" });
  if (approvalRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Establish formal approval processes for all risk management plans to ensure governance oversight", urgency: "soon", regulatory_ref: "SCCIF Leaders" });
  if (pct(withMultiAgency, total) < 40 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Seek multi-agency input for risk plans — specialist perspectives strengthen risk understanding and management", urgency: "planned", regulatory_ref: "CHR 2015 Reg 12" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: RiskManagementPlanResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No risk management plans means Ofsted cannot verify the home has systematic risk governance", severity: "critical" });
  if (total > 0 && triggerIdentificationRate >= 80 && strategyEffectivenessRate >= 70)
    insights.push({ text: "Thorough trigger identification combined with effective strategies demonstrates proactive, evidence-based risk management", severity: "positive" });
  if (escalatedRisks.length > 3)
    insights.push({ text: "Escalating risk levels across multiple plans suggest systemic issues requiring strategic review of risk management approach", severity: "warning" });
  if (deEscalatedRisks.length > 2 && total > 0)
    insights.push({ text: "Multiple risk de-escalations demonstrate that management strategies are successfully reducing risk over time", severity: "positive" });
  if (uniqueCategories >= 5 && total > 0)
    insights.push({ text: "Diverse risk categories show the home takes a comprehensive approach to identifying the full spectrum of risks children face", severity: "positive" });
  if (highRiskPlans.length > 0 && pct(highRiskPlans.filter(p => p.has_emergency_plan).length, highRiskPlans.length) < 50)
    insights.push({ text: "High-risk plans without emergency plans leave the home exposed — crisis preparedness for the highest risks is essential", severity: "warning" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (rmp_rating === "insufficient_data") {
    headline = "No data available for risk management plan intelligence analysis";
  } else if (rmp_rating === "outstanding") {
    headline = "Outstanding risk management — triggers identified, strategies effective, plans governed and risks reducing";
  } else if (rmp_rating === "good") {
    headline = "Good risk management with clear trigger analysis and effective mitigation strategies";
  } else if (rmp_rating === "adequate") {
    headline = "Risk plans exist but trigger analysis, strategy effectiveness or governance needs strengthening";
  } else {
    headline = "Inadequate risk management — risks are not being systematically identified, mitigated or governed";
  }

  return {
    rmp_rating,
    rmp_score: score,
    headline,
    total_plans: total,
    children_with_plan_rate: childrenWithPlanRate,
    active_plan_rate: activePlanRate,
    trigger_identification_rate: triggerIdentificationRate,
    strategy_effectiveness_rate: strategyEffectivenessRate,
    emergency_plan_rate: emergencyPlanRate,
    child_voice_rate: childVoiceRate,
    approval_rate: approvalRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
