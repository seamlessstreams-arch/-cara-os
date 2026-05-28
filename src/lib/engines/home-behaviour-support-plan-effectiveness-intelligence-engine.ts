// ==============================================================================
// CORNERSTONE -- HOME BEHAVIOUR SUPPORT PLAN EFFECTIVENESS INTELLIGENCE ENGINE
// Measures how effectively the home creates, implements, and reviews BSPs for
// children, tracks intervention success, de-escalation outcomes, positive
// behaviour reinforcement, and restrictive practice minimisation.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 12 (The protection of children), Reg 13 (Leadership and
// management), Reg 35 (Behaviour management), Reg 20 (Restraint).
// SCCIF: "Children who display the most challenging behaviour benefit from
// individual strategies that are effective and regularly reviewed."
// Store keys: behaviourSupportPlans, interventionRecords, deescalationRecords,
//             positiveReinforcementRecords, restrictivePracticeRecords
// ==============================================================================

// -- Input Types -------------------------------------------------------------

export interface BehaviourSupportPlanInput {
  id: string;
  child_id: string;
  plan_name: string;
  status: "active" | "draft" | "archived" | "expired";
  created_date: string;
  last_reviewed_date: string | null;
  review_due_date: string | null;
  triggers_documented: boolean;
  strategies_documented: boolean;
  de_escalation_strategies_included: boolean;
  positive_reinforcement_included: boolean;
  child_involved_in_creation: boolean;
  child_signed_off: boolean;
  staff_trained_on_plan: boolean;
  multi_agency_input: boolean;
  risk_assessment_linked: boolean;
  created_at: string;
}

export interface InterventionRecordInput {
  id: string;
  child_id: string;
  bsp_id: string | null;
  intervention_date: string;
  intervention_type: "proactive" | "reactive" | "de_escalation" | "physical" | "environmental";
  strategy_used: string;
  outcome: "successful" | "partially_successful" | "unsuccessful";
  duration_minutes: number;
  staff_involved: number;
  follow_up_completed: boolean;
  child_debriefed: boolean;
  incident_prevented: boolean;
  created_at: string;
}

export interface DeescalationRecordInput {
  id: string;
  child_id: string;
  date: string;
  technique_used: string;
  situation_severity: "low" | "medium" | "high" | "critical";
  outcome: "fully_deescalated" | "partially_deescalated" | "escalated" | "physical_intervention_required";
  time_to_calm_minutes: number;
  child_debriefed: boolean;
  staff_debriefed: boolean;
  learning_recorded: boolean;
  restrictive_practice_avoided: boolean;
  created_at: string;
}

export interface PositiveReinforcementRecordInput {
  id: string;
  child_id: string;
  date: string;
  reinforcement_type: "verbal_praise" | "reward" | "privilege" | "activity" | "token" | "recognition";
  behaviour_targeted: string;
  child_response: "positive" | "neutral" | "negative";
  consistent_with_bsp: boolean;
  documented_in_daily_log: boolean;
  created_at: string;
}

export interface RestrictivePracticeRecordInput {
  id: string;
  child_id: string;
  date: string;
  practice_type: "physical_restraint" | "seclusion" | "environmental_restriction" | "chemical_restraint" | "mechanical_restraint";
  duration_minutes: number;
  justified: boolean;
  proportionate: boolean;
  last_resort: boolean;
  child_debriefed: boolean;
  staff_debriefed: boolean;
  post_incident_review_completed: boolean;
  body_map_completed: boolean;
  notified_authorities: boolean;
  reduction_plan_in_place: boolean;
  bsp_reviewed_after: boolean;
  created_at: string;
}

export interface BehaviourSupportPlanEffectivenessInput {
  today: string;
  total_children: number;
  behaviour_support_plans: BehaviourSupportPlanInput[];
  intervention_records: InterventionRecordInput[];
  deescalation_records: DeescalationRecordInput[];
  positive_reinforcement_records: PositiveReinforcementRecordInput[];
  restrictive_practice_records: RestrictivePracticeRecordInput[];
}

// -- Output Types ------------------------------------------------------------

export type BehaviourSupportRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BehaviourSupportInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface BehaviourSupportRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface BehaviourSupportPlanEffectivenessResult {
  behaviour_rating: BehaviourSupportRating;
  behaviour_score: number;
  headline: string;
  total_bsps: number;
  bsp_coverage_rate: number;
  intervention_success_rate: number;
  deescalation_effectiveness_rate: number;
  positive_reinforcement_rate: number;
  restrictive_practice_reduction_rate: number;
  child_involvement_rate: number;
  bsp_review_compliance_rate: number;
  staff_training_rate: number;
  child_debrief_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: BehaviourSupportRecommendation[];
  insights: BehaviourSupportInsight[];
}

// -- Helpers -----------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): BehaviourSupportRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  if (isNaN(msA) || isNaN(msB)) return 0;
  return Math.floor(Math.abs(msB - msA) / 86_400_000);
}

// -- Empty Result Factory ----------------------------------------------------

function emptyResult(
  rating: BehaviourSupportRating,
  score: number,
  headline: string,
): BehaviourSupportPlanEffectivenessResult {
  return {
    behaviour_rating: rating,
    behaviour_score: score,
    headline,
    total_bsps: 0,
    bsp_coverage_rate: 0,
    intervention_success_rate: 0,
    deescalation_effectiveness_rate: 0,
    positive_reinforcement_rate: 0,
    restrictive_practice_reduction_rate: 0,
    child_involvement_rate: 0,
    bsp_review_compliance_rate: 0,
    staff_training_rate: 0,
    child_debrief_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute ------------------------------------------------------------

export function computeBehaviourSupportPlanEffectiveness(
  input: BehaviourSupportPlanEffectivenessInput,
): BehaviourSupportPlanEffectivenessResult {
  const {
    today,
    total_children,
    behaviour_support_plans,
    intervention_records,
    deescalation_records,
    positive_reinforcement_records,
    restrictive_practice_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data -----------
  const allEmpty =
    behaviour_support_plans.length === 0 &&
    intervention_records.length === 0 &&
    deescalation_records.length === 0 &&
    positive_reinforcement_records.length === 0 &&
    restrictive_practice_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess behaviour support plan effectiveness.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate ----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No behaviour support data recorded despite children on placement -- BSP coverage, intervention tracking, and behaviour management require urgent attention.",
      ),
      concerns: [
        "No behaviour support plans, intervention records, de-escalation records, positive reinforcement records, or restrictive practice records exist despite children being on placement -- the home cannot evidence effective behaviour management or individualised support.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Create individualised behaviour support plans for every child with documented triggers, strategies, de-escalation techniques, and positive reinforcement approaches. Ensure each plan involves the child in its creation.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
        },
        {
          rank: 2,
          recommendation:
            "Implement structured recording of all behavioural interventions, de-escalation attempts, positive reinforcement, and any restrictive practices to evidence the home's approach to behaviour support and Reg 35 compliance.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 -- Protection of children",
        },
      ],
      insights: [
        {
          text: "The complete absence of behaviour support records means Ofsted cannot verify that children receive individualised behaviour management, that interventions are effective, or that restrictive practices are minimised. This represents a fundamental gap in Reg 35 and Reg 12 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics ------------------------------------------------

  // --- BSP coverage: unique children with active BSPs vs total_children ---
  const activeBSPs = behaviour_support_plans.filter((b) => b.status === "active");
  const totalBSPs = behaviour_support_plans.length;
  const uniqueChildrenWithActiveBSP = new Set(activeBSPs.map((b) => b.child_id)).size;
  const bspCoverageRate = total_children > 0 ? pct(uniqueChildrenWithActiveBSP, total_children) : 0;

  // --- BSP review compliance: active BSPs reviewed within schedule ---
  const activeBSPsWithReviewDue = activeBSPs.filter(
    (b) => b.review_due_date !== null,
  );
  const bspsReviewedOnTime = activeBSPsWithReviewDue.filter((b) => {
    if (!b.last_reviewed_date || !b.review_due_date) return false;
    return b.last_reviewed_date >= b.review_due_date || daysBetween(b.last_reviewed_date, today) <= 90;
  }).length;
  // Also count BSPs whose review date is in the future as compliant
  const bspsNotYetDue = activeBSPsWithReviewDue.filter(
    (b) => b.review_due_date !== null && b.review_due_date > today,
  ).length;
  const bspsOverdue = activeBSPsWithReviewDue.filter(
    (b) => b.review_due_date !== null && b.review_due_date <= today && (!b.last_reviewed_date || b.last_reviewed_date < b.review_due_date),
  ).length;
  const bspReviewCompliant = activeBSPsWithReviewDue.length - bspsOverdue;
  const bspReviewComplianceRate = pct(bspReviewCompliant, activeBSPsWithReviewDue.length > 0 ? activeBSPsWithReviewDue.length : activeBSPs.length > 0 ? activeBSPs.length : 1);

  // --- BSP quality indicators ---
  const bspsWithTriggers = activeBSPs.filter((b) => b.triggers_documented).length;
  const bspsWithStrategies = activeBSPs.filter((b) => b.strategies_documented).length;
  const bspsWithDeescalation = activeBSPs.filter((b) => b.de_escalation_strategies_included).length;
  const bspsWithPositiveReinforcement = activeBSPs.filter((b) => b.positive_reinforcement_included).length;
  const bspsWithChildInvolvement = activeBSPs.filter((b) => b.child_involved_in_creation).length;
  const bspsWithChildSignOff = activeBSPs.filter((b) => b.child_signed_off).length;
  const bspsWithStaffTrained = activeBSPs.filter((b) => b.staff_trained_on_plan).length;
  const bspsWithMultiAgency = activeBSPs.filter((b) => b.multi_agency_input).length;
  const bspsWithRiskLink = activeBSPs.filter((b) => b.risk_assessment_linked).length;

  const childInvolvementRate = pct(bspsWithChildInvolvement, activeBSPs.length);
  const staffTrainingRate = pct(bspsWithStaffTrained, activeBSPs.length);

  // --- Intervention success rate ---
  const totalInterventions = intervention_records.length;
  const successfulInterventions = intervention_records.filter(
    (i) => i.outcome === "successful",
  ).length;
  const partiallySuccessful = intervention_records.filter(
    (i) => i.outcome === "partially_successful",
  ).length;
  // Weight: successful=1.0, partially=0.5
  const interventionSuccessWeighted = successfulInterventions + partiallySuccessful * 0.5;
  const interventionSuccessRate = totalInterventions > 0
    ? Math.round((interventionSuccessWeighted / totalInterventions) * 100)
    : 0;

  const proactiveInterventions = intervention_records.filter(
    (i) => i.intervention_type === "proactive",
  ).length;
  const reactiveInterventions = intervention_records.filter(
    (i) => i.intervention_type === "reactive" || i.intervention_type === "physical",
  ).length;

  const interventionsWithDebrief = intervention_records.filter(
    (i) => i.child_debriefed,
  ).length;
  const interventionsWithFollowUp = intervention_records.filter(
    (i) => i.follow_up_completed,
  ).length;
  const incidentsPrevented = intervention_records.filter(
    (i) => i.incident_prevented,
  ).length;

  // --- De-escalation effectiveness ---
  const totalDeescalations = deescalation_records.length;
  const fullyDeescalated = deescalation_records.filter(
    (d) => d.outcome === "fully_deescalated",
  ).length;
  const partiallyDeescalated = deescalation_records.filter(
    (d) => d.outcome === "partially_deescalated",
  ).length;
  const deescalationEffectivenessWeighted = fullyDeescalated + partiallyDeescalated * 0.5;
  const deescalationEffectivenessRate = totalDeescalations > 0
    ? Math.round((deescalationEffectivenessWeighted / totalDeescalations) * 100)
    : 0;

  const deescalationsAvoidingRestraint = deescalation_records.filter(
    (d) => d.restrictive_practice_avoided,
  ).length;
  const deescalationRestraintAvoidanceRate = pct(deescalationsAvoidingRestraint, totalDeescalations);

  const deescalationsWithChildDebrief = deescalation_records.filter(
    (d) => d.child_debriefed,
  ).length;
  const deescalationsWithStaffDebrief = deescalation_records.filter(
    (d) => d.staff_debriefed,
  ).length;
  const deescalationsWithLearning = deescalation_records.filter(
    (d) => d.learning_recorded,
  ).length;

  // --- Positive reinforcement rate ---
  const totalPositiveRecords = positive_reinforcement_records.length;
  const positiveResponseRecords = positive_reinforcement_records.filter(
    (p) => p.child_response === "positive",
  ).length;
  const positiveReinforcementRate = pct(positiveResponseRecords, totalPositiveRecords);

  const consistentWithBSP = positive_reinforcement_records.filter(
    (p) => p.consistent_with_bsp,
  ).length;
  const consistencyRate = pct(consistentWithBSP, totalPositiveRecords);

  const documentedInLog = positive_reinforcement_records.filter(
    (p) => p.documented_in_daily_log,
  ).length;

  // --- Restrictive practice minimisation ---
  const totalRestrictive = restrictive_practice_records.length;
  const justifiedRestrictive = restrictive_practice_records.filter(
    (r) => r.justified,
  ).length;
  const proportionateRestrictive = restrictive_practice_records.filter(
    (r) => r.proportionate,
  ).length;
  const lastResortRestrictive = restrictive_practice_records.filter(
    (r) => r.last_resort,
  ).length;
  const restrictiveWithChildDebrief = restrictive_practice_records.filter(
    (r) => r.child_debriefed,
  ).length;
  const restrictiveWithStaffDebrief = restrictive_practice_records.filter(
    (r) => r.staff_debriefed,
  ).length;
  const restrictiveWithPostIncident = restrictive_practice_records.filter(
    (r) => r.post_incident_review_completed,
  ).length;
  const restrictiveWithBodyMap = restrictive_practice_records.filter(
    (r) => r.body_map_completed,
  ).length;
  const restrictiveWithNotification = restrictive_practice_records.filter(
    (r) => r.notified_authorities,
  ).length;
  const restrictiveWithReductionPlan = restrictive_practice_records.filter(
    (r) => r.reduction_plan_in_place,
  ).length;
  const restrictiveWithBSPReview = restrictive_practice_records.filter(
    (r) => r.bsp_reviewed_after,
  ).length;

  // Restrictive practice reduction rate: proportion with reduction plans in place
  const restrictivePracticeReductionRate = pct(restrictiveWithReductionPlan, totalRestrictive);

  // Compliance composite for restrictive practices
  const restrictiveComplianceItems = totalRestrictive > 0
    ? (pct(justifiedRestrictive, totalRestrictive) +
       pct(proportionateRestrictive, totalRestrictive) +
       pct(lastResortRestrictive, totalRestrictive) +
       pct(restrictiveWithPostIncident, totalRestrictive) +
       pct(restrictiveWithBodyMap, totalRestrictive)) / 5
    : 100; // no restrictive practices is ideal

  // --- Child debrief rate across all record types ---
  const totalDebriefOpportunities =
    totalInterventions + totalDeescalations + totalRestrictive;
  const totalDebriefsDone =
    interventionsWithDebrief + deescalationsWithChildDebrief + restrictiveWithChildDebrief;
  const childDebriefRate = pct(totalDebriefsDone, totalDebriefOpportunities);

  // -- Scoring: base 52 ---------------------------------------------------

  let score = 52;

  // --- Bonus 1: bspCoverageRate (>=100: +4, >=80: +2) ---
  if (bspCoverageRate >= 100) score += 4;
  else if (bspCoverageRate >= 80) score += 2;

  // --- Bonus 2: interventionSuccessRate (>=90: +3, >=70: +1) ---
  if (interventionSuccessRate >= 90) score += 3;
  else if (interventionSuccessRate >= 70) score += 1;

  // --- Bonus 3: deescalationEffectivenessRate (>=90: +4, >=70: +2) ---
  if (deescalationEffectivenessRate >= 90) score += 4;
  else if (deescalationEffectivenessRate >= 70) score += 2;

  // --- Bonus 4: positiveReinforcementRate (>=90: +3, >=70: +1) ---
  if (positiveReinforcementRate >= 90) score += 3;
  else if (positiveReinforcementRate >= 70) score += 1;

  // --- Bonus 5: restrictivePracticeReductionRate (>=90: +3, >=70: +1) OR no restrictive practices (+3) ---
  if (totalRestrictive === 0 && totalInterventions > 0) {
    score += 3; // no restrictive practices used at all is ideal
  } else if (restrictivePracticeReductionRate >= 90) {
    score += 3;
  } else if (restrictivePracticeReductionRate >= 70) {
    score += 1;
  }

  // --- Bonus 6: childInvolvementRate (>=90: +3, >=70: +1) ---
  if (childInvolvementRate >= 90) score += 3;
  else if (childInvolvementRate >= 70) score += 1;

  // --- Bonus 7: staffTrainingRate (>=100: +2, >=80: +1) ---
  if (staffTrainingRate >= 100) score += 2;
  else if (staffTrainingRate >= 80) score += 1;

  // --- Bonus 8: childDebriefRate (>=90: +3, >=70: +1) ---
  if (childDebriefRate >= 90) score += 3;
  else if (childDebriefRate >= 70) score += 1;

  // --- Bonus 9: bspReviewComplianceRate (>=90: +3, >=70: +1) ---
  if (bspReviewComplianceRate >= 90) score += 3;
  else if (bspReviewComplianceRate >= 70) score += 1;

  // -- Penalties (4 penalties with guards) ---------------------------------

  // bspCoverageRate < 50 -> -5 (guard: total_children > 0)
  if (bspCoverageRate < 50 && total_children > 0) score -= 5;

  // interventionSuccessRate < 40 -> -5 (guard: totalInterventions > 0)
  if (interventionSuccessRate < 40 && totalInterventions > 0) score -= 5;

  // deescalationEffectivenessRate < 40 -> -5 (guard: totalDeescalations > 0)
  if (deescalationEffectivenessRate < 40 && totalDeescalations > 0) score -= 5;

  // restrictive compliance composite < 50 -> -3 (guard: totalRestrictive > 0)
  if (restrictiveComplianceItems < 50 && totalRestrictive > 0) score -= 3;

  score = clamp(score, 0, 100);

  const behaviour_rating = toRating(score);

  // -- Strengths -----------------------------------------------------------

  const strengths: string[] = [];

  if (bspCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has an active behaviour support plan -- the home demonstrates comprehensive, individualised behaviour management for all children.",
    );
  } else if (bspCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${bspCoverageRate}% BSP coverage -- the majority of children have individualised behaviour support plans in place.`,
    );
  }

  if (interventionSuccessRate >= 90 && totalInterventions > 0) {
    strengths.push(
      `${interventionSuccessRate}% intervention success rate -- behavioural interventions are highly effective, demonstrating well-matched strategies to children's needs.`,
    );
  } else if (interventionSuccessRate >= 70 && totalInterventions > 0) {
    strengths.push(
      `${interventionSuccessRate}% intervention success rate -- interventions are generally effective in managing behaviour.`,
    );
  }

  if (deescalationEffectivenessRate >= 90 && totalDeescalations > 0) {
    strengths.push(
      `${deescalationEffectivenessRate}% de-escalation effectiveness -- staff are highly skilled at de-escalating situations before they reach crisis point.`,
    );
  } else if (deescalationEffectivenessRate >= 70 && totalDeescalations > 0) {
    strengths.push(
      `${deescalationEffectivenessRate}% de-escalation effectiveness -- staff demonstrate competent de-escalation practice.`,
    );
  }

  if (positiveReinforcementRate >= 90 && totalPositiveRecords > 0) {
    strengths.push(
      `${positiveReinforcementRate}% positive response to reinforcement strategies -- children are responding well to the home's positive behaviour approach.`,
    );
  } else if (positiveReinforcementRate >= 70 && totalPositiveRecords > 0) {
    strengths.push(
      `${positiveReinforcementRate}% positive response rate -- reinforcement strategies are generally effective for most children.`,
    );
  }

  if (totalRestrictive === 0 && totalInterventions > 0) {
    strengths.push(
      "No restrictive practices used -- the home manages behaviour entirely through positive, proactive, and de-escalation strategies without resorting to restriction.",
    );
  } else if (restrictivePracticeReductionRate >= 90 && totalRestrictive > 0) {
    strengths.push(
      `${restrictivePracticeReductionRate}% of restrictive practice incidents have reduction plans in place -- the home is actively working to minimise restriction.`,
    );
  } else if (restrictivePracticeReductionRate >= 70 && totalRestrictive > 0) {
    strengths.push(
      `${restrictivePracticeReductionRate}% of restrictive practices have reduction plans -- good progress toward minimising restrictive interventions.`,
    );
  }

  if (childInvolvementRate >= 90 && activeBSPs.length > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in BSP creation -- children are active participants in designing their own behaviour support strategies.`,
    );
  } else if (childInvolvementRate >= 70 && activeBSPs.length > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in BSP creation -- most children participate in shaping their behaviour support plans.`,
    );
  }

  if (staffTrainingRate >= 100 && activeBSPs.length > 0) {
    strengths.push(
      "All staff are trained on every active BSP -- consistent, informed implementation of behaviour support strategies across the team.",
    );
  } else if (staffTrainingRate >= 80 && activeBSPs.length > 0) {
    strengths.push(
      `${staffTrainingRate}% of BSPs have associated staff training completed -- strong training coverage supporting consistent implementation.`,
    );
  }

  if (childDebriefRate >= 90 && totalDebriefOpportunities > 0) {
    strengths.push(
      `${childDebriefRate}% child debrief rate across interventions -- children are consistently supported to reflect on and process behavioural incidents.`,
    );
  } else if (childDebriefRate >= 70 && totalDebriefOpportunities > 0) {
    strengths.push(
      `${childDebriefRate}% child debrief rate -- good practice in debriefing children after behavioural incidents.`,
    );
  }

  if (bspReviewComplianceRate >= 90 && activeBSPs.length > 0) {
    strengths.push(
      `${bspReviewComplianceRate}% BSP review compliance -- plans are regularly reviewed and updated to reflect children's changing needs.`,
    );
  } else if (bspReviewComplianceRate >= 70 && activeBSPs.length > 0) {
    strengths.push(
      `${bspReviewComplianceRate}% BSP review compliance -- the majority of plans are reviewed on schedule.`,
    );
  }

  if (proactiveInterventions > reactiveInterventions && totalInterventions > 0) {
    strengths.push(
      `Proactive interventions (${proactiveInterventions}) outnumber reactive (${reactiveInterventions}) -- the home takes a preventative approach to behaviour management.`,
    );
  }

  if (deescalationRestraintAvoidanceRate >= 90 && totalDeescalations > 0) {
    strengths.push(
      `${deescalationRestraintAvoidanceRate}% of de-escalation attempts avoided restrictive practices -- demonstrating skilled, non-restrictive approaches to behaviour management.`,
    );
  }

  if (consistencyRate >= 90 && totalPositiveRecords > 0) {
    strengths.push(
      `${consistencyRate}% of positive reinforcement is consistent with BSP strategies -- the team implements behaviour plans faithfully.`,
    );
  }

  if (pct(incidentsPrevented, totalInterventions) >= 70 && totalInterventions > 0) {
    strengths.push(
      `${pct(incidentsPrevented, totalInterventions)}% of interventions prevented escalation to a formal incident -- proactive strategies are effective at maintaining safety.`,
    );
  }

  // -- Concerns ------------------------------------------------------------

  const concerns: string[] = [];

  if (bspCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${bspCoverageRate}% of children have an active BSP -- the majority of children lack individualised behaviour support, which is a fundamental Reg 35 requirement.`,
    );
  } else if (bspCoverageRate < 80 && bspCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `BSP coverage at ${bspCoverageRate}% -- some children do not have an active behaviour support plan, risking inconsistent behaviour management.`,
    );
  }

  if (interventionSuccessRate < 40 && totalInterventions > 0) {
    concerns.push(
      `Intervention success rate at only ${interventionSuccessRate}% -- the majority of behavioural interventions are not achieving their intended outcomes, indicating strategies may not be appropriately matched to children's needs.`,
    );
  } else if (interventionSuccessRate < 70 && interventionSuccessRate >= 40 && totalInterventions > 0) {
    concerns.push(
      `Intervention success rate at ${interventionSuccessRate}% -- a significant proportion of interventions are not fully effective, suggesting BSP strategies may need review.`,
    );
  }

  if (deescalationEffectivenessRate < 40 && totalDeescalations > 0) {
    concerns.push(
      `De-escalation effectiveness at only ${deescalationEffectivenessRate}% -- most de-escalation attempts are not resolving situations, which may be leading to unnecessary escalation and restrictive practices.`,
    );
  } else if (deescalationEffectivenessRate < 70 && deescalationEffectivenessRate >= 40 && totalDeescalations > 0) {
    concerns.push(
      `De-escalation effectiveness at ${deescalationEffectivenessRate}% -- a notable proportion of situations are not being de-escalated successfully.`,
    );
  }

  if (positiveReinforcementRate < 50 && totalPositiveRecords > 0) {
    concerns.push(
      `Only ${positiveReinforcementRate}% positive response to reinforcement -- most children are not responding positively to current reinforcement strategies, which may indicate poorly matched or inconsistently applied approaches.`,
    );
  } else if (positiveReinforcementRate < 70 && positiveReinforcementRate >= 50 && totalPositiveRecords > 0) {
    concerns.push(
      `Positive reinforcement response rate at ${positiveReinforcementRate}% -- reinforcement strategies are not consistently effective for all children.`,
    );
  }

  if (restrictiveComplianceItems < 50 && totalRestrictive > 0) {
    concerns.push(
      "Restrictive practice compliance is critically low -- not all instances are documented as justified, proportionate, used as last resort, or properly reviewed. This poses significant regulatory and safeguarding risks.",
    );
  } else if (restrictiveComplianceItems < 70 && restrictiveComplianceItems >= 50 && totalRestrictive > 0) {
    concerns.push(
      "Restrictive practice compliance needs improvement -- some instances lack full documentation of justification, proportionality, or post-incident review.",
    );
  }

  if (childInvolvementRate < 50 && activeBSPs.length > 0) {
    concerns.push(
      `Only ${childInvolvementRate}% of BSPs involve the child in creation -- children are not being given meaningful input into their own behaviour support strategies.`,
    );
  } else if (childInvolvementRate < 70 && childInvolvementRate >= 50 && activeBSPs.length > 0) {
    concerns.push(
      `Child involvement in BSP creation at ${childInvolvementRate}% -- not all children are participating in designing their behaviour support plans.`,
    );
  }

  if (staffTrainingRate < 50 && activeBSPs.length > 0) {
    concerns.push(
      `Only ${staffTrainingRate}% of BSPs have associated staff training -- staff may not understand or consistently implement children's behaviour support strategies.`,
    );
  } else if (staffTrainingRate < 80 && staffTrainingRate >= 50 && activeBSPs.length > 0) {
    concerns.push(
      `Staff training coverage at ${staffTrainingRate}% -- some BSPs lack associated staff training, risking inconsistent implementation.`,
    );
  }

  if (childDebriefRate < 50 && totalDebriefOpportunities > 0) {
    concerns.push(
      `Only ${childDebriefRate}% of children debriefed after behavioural incidents -- children are not being supported to process and reflect on incidents, which undermines therapeutic recovery and learning.`,
    );
  } else if (childDebriefRate < 70 && childDebriefRate >= 50 && totalDebriefOpportunities > 0) {
    concerns.push(
      `Child debrief rate at ${childDebriefRate}% -- not all children are debriefed after incidents, missing opportunities for reflection and recovery.`,
    );
  }

  if (bspReviewComplianceRate < 50 && activeBSPs.length > 0) {
    concerns.push(
      `Only ${bspReviewComplianceRate}% of BSPs reviewed on schedule -- plans may be outdated and no longer reflect children's current needs, triggers, or effective strategies.`,
    );
  } else if (bspReviewComplianceRate < 70 && bspReviewComplianceRate >= 50 && activeBSPs.length > 0) {
    concerns.push(
      `BSP review compliance at ${bspReviewComplianceRate}% -- some plans are overdue for review, risking misalignment with children's evolving needs.`,
    );
  }

  if (reactiveInterventions > proactiveInterventions && totalInterventions > 0) {
    concerns.push(
      `Reactive interventions (${reactiveInterventions}) outnumber proactive (${proactiveInterventions}) -- the home's behaviour management is predominantly crisis-driven rather than preventative.`,
    );
  }

  if (totalRestrictive > 0 && restrictivePracticeReductionRate < 50) {
    concerns.push(
      `Only ${restrictivePracticeReductionRate}% of restrictive practices have reduction plans -- the home is not systematically working to minimise restriction.`,
    );
  }

  if (totalRestrictive > 0 && pct(restrictiveWithBSPReview, totalRestrictive) < 50) {
    concerns.push(
      `Only ${pct(restrictiveWithBSPReview, totalRestrictive)}% of restrictive practices triggered a BSP review -- the home is missing opportunities to update behaviour support strategies after significant incidents.`,
    );
  }

  // -- Recommendations -----------------------------------------------------

  const recommendations: BehaviourSupportRecommendation[] = [];
  let rank = 0;

  if (bspCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently create individualised behaviour support plans for every child without one -- BSPs are a fundamental Reg 35 requirement and must document triggers, strategies, de-escalation approaches, and positive reinforcement tailored to each child.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (interventionSuccessRate < 40 && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and revise intervention strategies -- the low success rate indicates current approaches are not meeting children's needs. Conduct multi-disciplinary review of each child's BSP to identify more effective strategies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (deescalationEffectivenessRate < 40 && totalDeescalations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide additional de-escalation training and supervision for all staff -- the low effectiveness rate suggests staff need enhanced skills and confidence in de-escalation techniques.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (restrictiveComplianceItems < 50 && totalRestrictive > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an urgent audit of all restrictive practice incidents to ensure each is fully documented as justified, proportionate, used as last resort, with completed body maps, post-incident reviews, and authority notifications.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 20 -- Restraint and deprivation of liberty",
    });
  }

  if (childInvolvementRate < 50 && activeBSPs.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children in the creation and review of their BSPs -- children must be active participants in designing strategies that work for them. Use age-appropriate methods to capture their views and preferences.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Voice of the child",
    });
  }

  if (childDebriefRate < 50 && totalDebriefOpportunities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement consistent post-incident debriefing for all children -- every behavioural incident should be followed by a supportive, reflective conversation that helps the child process the experience and identify alternative strategies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 -- Protection of children",
    });
  }

  if (staffTrainingRate < 50 && activeBSPs.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all staff receive training on each child's active BSP -- without training, staff cannot consistently implement the strategies designed to support each child's behaviour.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 -- Leadership and management",
    });
  }

  if (positiveReinforcementRate < 50 && totalPositiveRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review positive reinforcement strategies with each child to identify what motivates and rewards them -- current approaches are not achieving positive responses and may need to be individualised further.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (bspReviewComplianceRate < 50 && activeBSPs.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all overdue BSP reviews up to date and implement a tracking system to ensure reviews happen on schedule -- outdated plans may not reflect children's current needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (bspCoverageRate >= 50 && bspCoverageRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend BSP coverage to all children -- aim for 100% coverage so every child benefits from an individualised behaviour support plan.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (interventionSuccessRate >= 40 && interventionSuccessRate < 70 && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Analyse unsuccessful interventions to identify patterns -- review whether strategy selection, timing, or staff approach can be improved to increase success rates.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (deescalationEffectivenessRate >= 40 && deescalationEffectivenessRate < 70 && totalDeescalations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance de-escalation approaches through reflective practice sessions and peer learning -- identify which techniques work best for each child and document these in BSPs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (reactiveInterventions > proactiveInterventions && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Shift the balance from reactive to proactive intervention -- analyse triggers and patterns to develop preventative strategies that address behaviour before it escalates.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (totalRestrictive > 0 && restrictivePracticeReductionRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop individual restrictive practice reduction plans for every child who has experienced restriction -- each plan should set measurable targets for reducing frequency and duration.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 20 -- Restraint and deprivation of liberty",
    });
  }

  if (childInvolvementRate >= 50 && childInvolvementRate < 70 && activeBSPs.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child participation in BSP creation to at least 90% -- use creative, child-friendly methods to ensure every child has meaningful input into their behaviour support strategies.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Voice of the child",
    });
  }

  if (staffTrainingRate >= 50 && staffTrainingRate < 80 && activeBSPs.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend BSP-specific training to cover all staff working with each child -- consistent implementation requires universal understanding of each child's plan.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 13 -- Leadership and management",
    });
  }

  if (consistencyRate < 70 && totalPositiveRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve alignment between positive reinforcement and BSP strategies -- ensure staff consistently apply the reinforcement approaches documented in each child's plan.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  // -- Insights ------------------------------------------------------------

  const insights: BehaviourSupportInsight[] = [];

  // --- Critical insights ---

  if (bspCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${bspCoverageRate}% of children have an active BSP. Ofsted expects every child to have an individualised behaviour support plan -- without this, the home cannot evidence that it understands and responds to each child's behavioural needs as required by Reg 35.`,
      severity: "critical",
    });
  }

  if (interventionSuccessRate < 40 && totalInterventions > 0) {
    insights.push({
      text: `Intervention success rate at only ${interventionSuccessRate}%. When the majority of interventions fail, children experience repeated unsuccessful attempts to manage their behaviour, which can increase distress and undermine trust. BSP strategies require urgent multi-disciplinary review.`,
      severity: "critical",
    });
  }

  if (deescalationEffectivenessRate < 40 && totalDeescalations > 0) {
    insights.push({
      text: `De-escalation effectiveness at only ${deescalationEffectivenessRate}%. Failed de-escalation often leads to restrictive practices or crisis situations. Ofsted will question whether staff have sufficient skills, training, and confidence in de-escalation, and whether the home's behaviour management approach is fundamentally effective.`,
      severity: "critical",
    });
  }

  if (restrictiveComplianceItems < 50 && totalRestrictive > 0) {
    insights.push({
      text: "Restrictive practice compliance is critically low. Ofsted will view incomplete documentation of justification, proportionality, post-incident reviews, and body maps as evidence that the home may be using restriction inappropriately or failing to safeguard children during these incidents.",
      severity: "critical",
    });
  }

  if (childDebriefRate < 30 && totalDebriefOpportunities > 0) {
    insights.push({
      text: `Child debrief rate at only ${childDebriefRate}%. Without debriefing, children are left to process distressing behavioural incidents alone. Ofsted views consistent post-incident support as essential to children's emotional wellbeing and Reg 12 compliance.`,
      severity: "critical",
    });
  }

  if (totalRestrictive > 5 && pct(lastResortRestrictive, totalRestrictive) < 50) {
    insights.push({
      text: `Fewer than half of restrictive practices documented as a last resort. This raises serious questions about whether the home is exhausting all other options before using restriction, as required by Reg 20.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (bspCoverageRate >= 50 && bspCoverageRate < 80 && total_children > 0) {
    insights.push({
      text: `BSP coverage at ${bspCoverageRate}% -- improving but some children still lack individualised plans. Every child benefits from a documented approach to behaviour support, even those without significant behavioural challenges.`,
      severity: "warning",
    });
  }

  if (interventionSuccessRate >= 40 && interventionSuccessRate < 70 && totalInterventions > 0) {
    insights.push({
      text: `Intervention success rate at ${interventionSuccessRate}% -- while some interventions work, a significant proportion do not achieve intended outcomes. Regular BSP review and strategy adaptation could improve this.`,
      severity: "warning",
    });
  }

  if (deescalationEffectivenessRate >= 40 && deescalationEffectivenessRate < 70 && totalDeescalations > 0) {
    insights.push({
      text: `De-escalation effectiveness at ${deescalationEffectivenessRate}% -- staff are having mixed results with de-escalation. Reflective practice sessions and technique-specific supervision could help improve consistency.`,
      severity: "warning",
    });
  }

  if (positiveReinforcementRate < 70 && positiveReinforcementRate >= 50 && totalPositiveRecords > 0) {
    insights.push({
      text: `Positive reinforcement response rate at ${positiveReinforcementRate}% -- not all children are responding to current approaches. Reinforcement strategies may need to be more individually tailored to each child's interests and motivations.`,
      severity: "warning",
    });
  }

  if (bspReviewComplianceRate < 70 && bspReviewComplianceRate >= 50 && activeBSPs.length > 0) {
    insights.push({
      text: `BSP review compliance at ${bspReviewComplianceRate}% -- some plans are not being reviewed on schedule. Out-of-date BSPs may contain strategies that no longer reflect a child's needs or triggers.`,
      severity: "warning",
    });
  }

  if (reactiveInterventions > proactiveInterventions * 2 && totalInterventions > 0) {
    insights.push({
      text: `Reactive interventions significantly outnumber proactive ones (${reactiveInterventions} reactive vs ${proactiveInterventions} proactive). This pattern suggests the home is predominantly in crisis management mode rather than preventing behavioural escalation through early intervention.`,
      severity: "warning",
    });
  }

  if (staffTrainingRate < 70 && staffTrainingRate >= 50 && activeBSPs.length > 0) {
    insights.push({
      text: `Staff training on BSPs at ${staffTrainingRate}% -- not all staff understand each child's behaviour support strategies. Inconsistent implementation can confuse children and reduce the effectiveness of planned approaches.`,
      severity: "warning",
    });
  }

  if (childInvolvementRate < 70 && childInvolvementRate >= 50 && activeBSPs.length > 0) {
    insights.push({
      text: `Child involvement in BSP creation at ${childInvolvementRate}% -- plans created without the child's input may lack the insight needed to identify what truly helps that child manage their behaviour.`,
      severity: "warning",
    });
  }

  if (consistencyRate < 70 && consistencyRate >= 50 && totalPositiveRecords > 0) {
    insights.push({
      text: `Positive reinforcement consistency with BSPs at ${consistencyRate}% -- staff are not always following the reinforcement strategies documented in children's plans, which can undermine the structured approach.`,
      severity: "warning",
    });
  }

  if (totalRestrictive > 0 && restrictivePracticeReductionRate < 70 && restrictivePracticeReductionRate >= 50) {
    insights.push({
      text: `Restrictive practice reduction plans in place for ${restrictivePracticeReductionRate}% of incidents -- while some progress is being made, the home should aim for reduction plans following every instance of restriction.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (behaviour_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding behaviour support plan effectiveness -- BSPs are comprehensive, well-reviewed, and child-centred. Interventions are successful, de-escalation is effective, positive reinforcement drives genuine progress, and restrictive practices are minimised. This is strong evidence for Reg 35 and Reg 12 compliance.",
      severity: "positive",
    });
  }

  if (bspCoverageRate >= 100 && childInvolvementRate >= 90 && total_children > 0 && activeBSPs.length > 0) {
    insights.push({
      text: `Every child has an active BSP with ${childInvolvementRate}% child involvement -- the home ensures behaviour support is both comprehensive and genuinely child-centred, reflecting each child's own understanding of their needs and preferences.`,
      severity: "positive",
    });
  }

  if (interventionSuccessRate >= 90 && deescalationEffectivenessRate >= 90 && totalInterventions > 0 && totalDeescalations > 0) {
    insights.push({
      text: `Intervention success at ${interventionSuccessRate}% and de-escalation effectiveness at ${deescalationEffectivenessRate}% -- the home's behaviour management strategies are highly effective, demonstrating well-matched, evidence-based approaches that genuinely support children.`,
      severity: "positive",
    });
  }

  if (totalRestrictive === 0 && totalInterventions > 0) {
    insights.push({
      text: "No restrictive practices used across the assessment period -- the home manages all behaviour through positive, proactive, and de-escalation strategies. This is an exemplary outcome that Ofsted will view very favourably under Reg 20 and Reg 35.",
      severity: "positive",
    });
  }

  if (deescalationRestraintAvoidanceRate >= 95 && totalDeescalations > 0) {
    insights.push({
      text: `${deescalationRestraintAvoidanceRate}% of de-escalation attempts avoided restrictive practice -- the home's commitment to non-restrictive approaches is consistently demonstrated in practice, not just in policy.`,
      severity: "positive",
    });
  }

  if (childDebriefRate >= 90 && totalDebriefOpportunities > 0) {
    insights.push({
      text: `${childDebriefRate}% child debrief rate -- the home consistently supports children to reflect on and learn from behavioural incidents, contributing to emotional recovery and long-term behaviour change.`,
      severity: "positive",
    });
  }

  if (proactiveInterventions > reactiveInterventions * 2 && totalInterventions > 0) {
    insights.push({
      text: `Proactive interventions (${proactiveInterventions}) significantly outnumber reactive (${reactiveInterventions}) -- the home takes a genuinely preventative approach, intervening early to support children before situations escalate.`,
      severity: "positive",
    });
  }

  if (staffTrainingRate >= 100 && bspReviewComplianceRate >= 90 && activeBSPs.length > 0) {
    insights.push({
      text: `All staff trained on BSPs with ${bspReviewComplianceRate}% review compliance -- the home ensures behaviour support strategies are not only documented but understood by all staff and kept current. This supports consistent, high-quality implementation.`,
      severity: "positive",
    });
  }

  if (positiveReinforcementRate >= 90 && consistencyRate >= 90 && totalPositiveRecords > 0) {
    insights.push({
      text: `${positiveReinforcementRate}% positive response with ${consistencyRate}% BSP consistency -- the home's positive reinforcement approach is both effective and faithfully implemented according to each child's plan.`,
      severity: "positive",
    });
  }

  // -- Headline ------------------------------------------------------------

  let headline: string;

  if (behaviour_rating === "outstanding") {
    headline =
      "Outstanding behaviour support plan effectiveness -- BSPs are comprehensive, interventions succeed, de-escalation is effective, and restrictive practices are minimised.";
  } else if (behaviour_rating === "good") {
    headline = `Good behaviour support plan effectiveness -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (behaviour_rating === "adequate") {
    headline = `Adequate behaviour support plan effectiveness -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children receive effective, individualised behaviour support.`;
  } else {
    headline = `Behaviour support plan effectiveness is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's behaviour is managed safely and effectively.`;
  }

  // -- Return --------------------------------------------------------------

  return {
    behaviour_rating,
    behaviour_score: score,
    headline,
    total_bsps: totalBSPs,
    bsp_coverage_rate: bspCoverageRate,
    intervention_success_rate: interventionSuccessRate,
    deescalation_effectiveness_rate: deescalationEffectivenessRate,
    positive_reinforcement_rate: positiveReinforcementRate,
    restrictive_practice_reduction_rate: restrictivePracticeReductionRate,
    child_involvement_rate: childInvolvementRate,
    bsp_review_compliance_rate: bspReviewComplianceRate,
    staff_training_rate: staffTrainingRate,
    child_debrief_rate: childDebriefRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
