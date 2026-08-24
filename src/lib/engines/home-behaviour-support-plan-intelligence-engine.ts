// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BEHAVIOUR SUPPORT PLAN INTELLIGENCE ENGINE
// Pure deterministic engine: BSP coverage, active plan currency, trigger
// analysis, de-escalation quality, positive strategy effectiveness,
// restrictive intervention governance, child voice, and review compliance.
// CHR 2015 Reg 13 (Behaviour management) / Reg 35 (Behaviour management).
// SCCIF: Helped and protected; Experiences and progress.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

import { below, meets, rate } from "@/lib/metrics/rate";

export interface BehaviourSupportPlanRecordInput {
  id: string;
  child_id: string;
  status: string; // "active"|"under_review"|"draft"|"archived"|"suspended"
  primary_behaviour_count: number;
  high_severity_behaviour_count: number;
  worsening_behaviour_count: number;
  known_trigger_count: number;
  high_likelihood_trigger_count: number;
  early_warning_count: number;
  de_escalation_stage_count: number; // how many of green/amber/red stages are populated
  positive_strategy_count: number;
  effective_strategy_count: number; // highly_effective or effective
  reward_count: number;
  boundary_count: number;
  safety_plan_item_count: number;
  has_communication_needs: boolean;
  has_sensory_considerations: boolean;
  has_child_views: boolean;
  has_parent_views: boolean;
  professional_input_count: number;
  staff_guidance_count: number;
  restrictive_intervention_count: number;
  restrictive_last_resort_count: number; // how many marked last_resort=true
  review_count: number;
  has_review_date: boolean;
  review_date: string; // ISO date
}

export interface BehaviourSupportPlanInput {
  today: string;
  total_children: number;
  plans: BehaviourSupportPlanRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type BehaviourSupportPlanRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BehaviourSupportPlanResult {
  bsp_rating: BehaviourSupportPlanRating;
  bsp_score: number;
  headline: string;
  total_plans: number;
  /** null when the population is empty — nothing measured, not 0%. */
  children_with_plan_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  active_plan_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  trigger_analysis_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  de_escalation_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  positive_strategy_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_voice_rate: number | null;
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

// Was `d === 0 ? 0 : …`: nothing recorded read as 0%, not as unmeasured.
function pct(n: number, d: number): number | null {
  return rate(n, d);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): BehaviourSupportPlanRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeBehaviourSupportPlan(
  input: BehaviourSupportPlanInput,
): BehaviourSupportPlanResult {
  const { plans, total_children, today } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      bsp_rating: "insufficient_data",
      bsp_score: 0,
      headline: "No data available for behaviour support plan intelligence analysis",
      total_plans: 0,
      children_with_plan_rate: null,
      active_plan_rate: null,
      trigger_analysis_rate: null,
      de_escalation_rate: null,
      positive_strategy_rate: null,
      child_voice_rate: null,
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

  // Review currency: an active plan whose next review_date has passed — or which
  // has no review scheduled — is overdue for review, so staff may be relying on
  // out-of-date guidance. (review_date is the NEXT-due date; date-only compare.)
  const overdueReviewPlans = activePlans.filter(
    p => !p.has_review_date || p.review_date.slice(0, 10) < today.slice(0, 10),
  );

  // Trigger analysis: plans with triggers AND early warnings
  const withTriggerAnalysis = plans.filter(p => p.known_trigger_count > 0 && p.early_warning_count > 0);
  const triggerAnalysisRate = pct(withTriggerAnalysis.length, total);

  // De-escalation: plans with all 3 stages (green/amber/red)
  const withFullDeEscalation = plans.filter(p => p.de_escalation_stage_count >= 3);
  const deEscalationRate = pct(withFullDeEscalation.length, total);

  // Positive strategies
  const withPositiveStrategies = plans.filter(p => p.positive_strategy_count > 0);
  const positiveStrategyRate = pct(withPositiveStrategies.length, total);

  // Strategy effectiveness
  const totalStrategies = plans.reduce((s, p) => s + p.positive_strategy_count, 0);
  const totalEffective = plans.reduce((s, p) => s + p.effective_strategy_count, 0);
  const effectivenessRate = pct(totalEffective, totalStrategies);

  // Child voice
  const withChildVoice = plans.filter(p => p.has_child_views).length;
  const childVoiceRate = pct(withChildVoice, total);

  // Restrictive interventions
  const totalRestrictive = plans.reduce((s, p) => s + p.restrictive_intervention_count, 0);
  const totalLastResort = plans.reduce((s, p) => s + p.restrictive_last_resort_count, 0);

  // Safety plans
  const withSafetyPlans = plans.filter(p => p.safety_plan_item_count > 0).length;

  // Professional input
  const withProfessionalInput = plans.filter(p => p.professional_input_count > 0).length;

  // Worsening behaviours
  const totalWorsening = plans.reduce((s, p) => s + p.worsening_behaviour_count, 0);

  // Staff guidance
  const withStaffGuidance = plans.filter(p => p.staff_guidance_count > 0).length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Coverage and active plans
  if (total === 0) {
    score -= 3;
  } else {
    if (meets(activePlanRate, 85)) score += 6;
    else if (meets(activePlanRate, 60)) score += 2;
    else if (below(activePlanRate, 40)) score -= 5;
  }

  // Modifier 2: Trigger analysis depth
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(triggerAnalysisRate, 80)) score += 5;
    else if (meets(triggerAnalysisRate, 50)) score += 2;
    else if (below(triggerAnalysisRate, 25)) score -= 5;
  }

  // Modifier 3: De-escalation completeness
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(deEscalationRate, 75)) score += 5;
    else if (meets(deEscalationRate, 40)) score += 2;
    else if (below(deEscalationRate, 20)) score -= 4;
  }

  // Modifier 4: Positive strategy approach
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(positiveStrategyRate, 80) && meets(effectivenessRate, 60)) score += 5;
    else if (meets(positiveStrategyRate, 50)) score += 2;
    else if (below(positiveStrategyRate, 25)) score -= 4;
  }

  // Modifier 5: Child voice
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(childVoiceRate, 80)) score += 4;
    else if (meets(childVoiceRate, 50)) score += 1;
    else if (below(childVoiceRate, 20)) score -= 4;
  }

  // Modifier 6: Safety planning and staff guidance
  if (total === 0) {
    score -= 2;
  } else {
    const safetyRate = pct(withSafetyPlans, total);
    const guidanceRate = pct(withStaffGuidance, total);
    if (meets(safetyRate, 75) && meets(guidanceRate, 75)) score += 5;
    else if (meets(safetyRate, 50) || meets(guidanceRate, 50)) score += 2;
    else if (below(safetyRate, 25) && below(guidanceRate, 25)) score -= 3;
  }

  score = clamp(score, 0, 100);

  const bsp_rating = total === 0 && plans.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(activePlanRate, 85) && total > 0)
    strengths.push("Behaviour support plans are actively maintained — staff have current, responsive guidance for each child");
  if (meets(triggerAnalysisRate, 80) && total > 0)
    strengths.push("Triggers and early warnings are thoroughly identified — staff can anticipate and prevent escalation");
  if (meets(deEscalationRate, 75) && total > 0)
    strengths.push("Full de-escalation pathways (green/amber/red) are in place — staff have staged responses at every level");
  if (meets(positiveStrategyRate, 80) && meets(effectivenessRate, 60) && total > 0)
    strengths.push("Positive strategies are embedded and effective — the home prioritises therapeutic responses over restrictive measures");
  if (meets(childVoiceRate, 80) && total > 0)
    strengths.push("Children's views are consistently captured in BSPs — their perspective informs how behaviour is understood and supported");
  if (meets(pct(withSafetyPlans, total), 75) && total > 0)
    strengths.push("Safety plans are in place for high-risk scenarios — the home is prepared to respond safely to crisis situations");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No behaviour support plans — the home cannot demonstrate structured, therapeutic responses to challenging behaviour");
  if (below(activePlanRate, 40) && total > 0)
    concerns.push("Most plans are not active — staff may be working without current behaviour support guidance");
  if (overdueReviewPlans.length > 0)
    concerns.push(`${overdueReviewPlans.length} active behaviour support plan${overdueReviewPlans.length > 1 ? "s are" : " is"} overdue for review — strategies may no longer match the child's evolving needs`);
  if (below(triggerAnalysisRate, 25) && total > 0)
    concerns.push("Triggers and early warnings are poorly identified — staff cannot anticipate or prevent behavioural escalation");
  if (below(deEscalationRate, 20) && total > 0)
    concerns.push("De-escalation pathways are incomplete — staff lack staged responses for managing escalating behaviour");
  if (below(positiveStrategyRate, 25) && total > 0)
    concerns.push("Positive strategies are rarely documented — the approach may over-rely on reactive or restrictive measures");
  if (below(childVoiceRate, 20) && total > 0)
    concerns.push("Children's voices are absent from BSPs — behaviour is being managed without understanding the child's perspective");
  if (totalRestrictive > 3 && totalLastResort < totalRestrictive)
    concerns.push("Restrictive interventions exist that are not marked as last resort — governance of restrictive practice may be insufficient");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: BehaviourSupportPlanResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Create behaviour support plans for all children with identified behavioural needs", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 13" });
  if (below(triggerAnalysisRate, 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Conduct thorough trigger analyses for all BSPs — identify triggers, early warnings and patterns", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 35" });
  if (overdueReviewPlans.length > 0)
    recommendations.push({ rank: ++rank, recommendation: `Review the ${overdueReviewPlans.length} overdue behaviour support plan${overdueReviewPlans.length > 1 ? "s" : ""} — BSPs must be kept current to remain effective`, urgency: "soon", regulatory_ref: "CHR 2015 Reg 13" });
  if (below(deEscalationRate, 40) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Complete de-escalation pathways with green/amber/red stages and specific strategies for each level", urgency: "soon", regulatory_ref: "CHR 2015 Reg 13" });
  if (below(childVoiceRate, 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure children's views about their behaviour and what helps them are captured in every BSP", urgency: "soon", regulatory_ref: "SCCIF Experiences" });
  if (below(positiveStrategyRate, 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Develop and document positive behaviour strategies for each child — reduce reliance on reactive approaches", urgency: "soon", regulatory_ref: "CHR 2015 Reg 35" });
  if (below(pct(withStaffGuidance, total), 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Add specific staff guidance to each BSP so carers can implement consistent, therapeutic responses", urgency: "planned", regulatory_ref: "CHR 2015 Reg 13" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: BehaviourSupportPlanResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No BSPs means Ofsted cannot verify the home has structured, therapeutic behaviour management", severity: "critical" });
  if (total > 0 && meets(triggerAnalysisRate, 80) && meets(deEscalationRate, 75))
    insights.push({ text: "Thorough trigger analysis combined with full de-escalation pathways demonstrates proactive, trauma-informed behaviour management", severity: "positive" });
  if (totalWorsening > 3 && total > 0)
    insights.push({ text: "Multiple worsening behaviour trends suggest current strategies may need revision or additional therapeutic input", severity: "warning" });
  if (totalRestrictive > 0 && meets(pct(totalLastResort, totalRestrictive), 100) && total > 0)
    insights.push({ text: "All restrictive interventions are documented as last resort — governance of restrictive practice is robust", severity: "positive" });
  if (meets(effectivenessRate, 60) && totalStrategies > 0)
    insights.push({ text: "Positive strategies are demonstrably effective — evidence-based approaches are driving improved outcomes", severity: "positive" });
  if (total > 0 && meets(pct(withProfessionalInput, total), 60))
    insights.push({ text: "Professional input informs BSPs — multi-disciplinary perspectives strengthen behaviour understanding", severity: "positive" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (bsp_rating === "insufficient_data") {
    headline = "No data available for behaviour support plan intelligence analysis";
  } else if (bsp_rating === "outstanding") {
    headline = "Outstanding behaviour support — thorough trigger analysis, staged de-escalation and effective positive strategies";
  } else if (bsp_rating === "good") {
    headline = "Good behaviour support with active plans, trigger awareness and positive approaches";
  } else if (bsp_rating === "adequate") {
    headline = "Behaviour support plans exist but trigger analysis, de-escalation or positive strategies need strengthening";
  } else {
    headline = "Inadequate behaviour support — children lack structured, therapeutic responses to challenging behaviour";
  }

  return {
    bsp_rating,
    bsp_score: score,
    headline,
    total_plans: total,
    children_with_plan_rate: childrenWithPlanRate,
    active_plan_rate: activePlanRate,
    trigger_analysis_rate: triggerAnalysisRate,
    de_escalation_rate: deEscalationRate,
    positive_strategy_rate: positiveStrategyRate,
    child_voice_rate: childVoiceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
