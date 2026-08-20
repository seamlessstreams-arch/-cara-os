// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME YOUTH JUSTICE & OFFENDING INTELLIGENCE ENGINE
// Tracks youth justice engagement quality — YOT (Youth Offending Team) liaison,
// offending behaviour plan compliance, restorative justice participation,
// court order adherence, and reoffending prevention. Critical for Ofsted under
// Children's Homes Regulations 2015 (Reg 5 quality of care, Reg 12 positive
// relationships, SCCIF safety and experiences).
// HOME-LEVEL engine.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 12 (Positive relationships).
// SCCIF: "Children are safe and feel safe", "Children's experiences".
// Store keys: yotLiaisonRecords, behaviourPlanRecords,
//             restorativeJusticeRecords, courtOrderRecords,
//             preventionProgrammeRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface YotLiaisonRecordInput {
  id: string;
  child_id: string;
  date: string;
  yot_worker_name: string;
  meeting_type: "scheduled" | "ad_hoc" | "emergency" | "review" | "initial_assessment";
  meeting_attended: boolean;
  child_attended: boolean;
  home_staff_attended: boolean;
  key_issues_discussed: string[];
  actions_agreed: string[];
  actions_completed: boolean;
  actions_completion_date: string | null;
  information_shared_with_team: boolean;
  child_views_captured: boolean;
  next_meeting_date: string | null;
  quality_rating: number; // 1-5
  notes: string | null;
  created_at: string;
}

export interface BehaviourPlanRecordInput {
  id: string;
  child_id: string;
  plan_created_date: string;
  plan_type: "offending_behaviour" | "anger_management" | "substance_misuse" | "peer_influence" | "exploitation_prevention" | "general_behaviour" | "other";
  targets_set: string[];
  targets_met: number;
  total_targets: number;
  plan_reviewed: boolean;
  review_date: string | null;
  child_involved_in_planning: boolean;
  child_engaged_with_plan: boolean;
  professional_input_received: boolean;
  plan_active: boolean;
  progress_rating: number; // 1-5
  evidence_of_change: boolean;
  notes: string | null;
  created_at: string;
}

export interface RestorativeJusticeRecordInput {
  id: string;
  child_id: string;
  date: string;
  rj_type: "victim_conference" | "community_reparation" | "mediation" | "letter_of_apology" | "restorative_conversation" | "panel" | "other";
  child_participated: boolean;
  child_engaged: boolean;
  child_showed_empathy: boolean;
  victim_satisfied: boolean | null;
  outcome_achieved: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  staff_supported_child: boolean;
  child_reflection_documented: boolean;
  learning_identified: string | null;
  created_at: string;
}

export interface CourtOrderRecordInput {
  id: string;
  child_id: string;
  order_type: "referral_order" | "youth_rehabilitation_order" | "detention_training_order" | "supervision_order" | "community_order" | "bail_conditions" | "curfew" | "other";
  order_start_date: string;
  order_end_date: string | null;
  conditions: string[];
  conditions_complied_with: number;
  total_conditions: number;
  breach_occurred: boolean;
  breach_date: string | null;
  breach_reason: string | null;
  home_supported_compliance: boolean;
  monitoring_in_place: boolean;
  review_date: string | null;
  order_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface PreventionProgrammeRecordInput {
  id: string;
  child_id: string;
  programme_name: string;
  programme_type: "mentoring" | "education_engagement" | "employment_training" | "substance_awareness" | "victim_empathy" | "cognitive_behavioural" | "life_skills" | "anger_management" | "peer_resistance" | "other";
  start_date: string;
  end_date: string | null;
  sessions_planned: number;
  sessions_attended: number;
  child_engaged: boolean;
  child_progress_positive: boolean;
  measurable_outcomes_documented: boolean;
  professional_feedback_positive: boolean | null;
  programme_active: boolean;
  reoffending_since_start: boolean;
  notes: string | null;
  created_at: string;
}

export interface YouthJusticeInput {
  today: string;
  total_children: number;
  yot_liaison_records: YotLiaisonRecordInput[];
  behaviour_plan_records: BehaviourPlanRecordInput[];
  restorative_justice_records: RestorativeJusticeRecordInput[];
  court_order_records: CourtOrderRecordInput[];
  prevention_programme_records: PreventionProgrammeRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type YouthJusticeRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface YouthJusticeInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface YouthJusticeRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface YouthJusticeResult {
  justice_rating: YouthJusticeRating;
  justice_score: number | null;
  headline: string;
  total_yot_records: number;
  total_court_orders: number;
  total_prevention_programmes: number;
  yot_engagement_rate: number | null;
  behaviour_plan_compliance_rate: number | null;
  restorative_justice_rate: number | null;
  court_order_adherence_rate: number | null;
  prevention_effectiveness_rate: number | null;
  child_engagement_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: YouthJusticeRecommendation[];
  insights: YouthJusticeInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): YouthJusticeRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: YouthJusticeRating,
  score: number,
  headline: string,
): YouthJusticeResult {
  return {
    justice_rating: rating,
    justice_score: score,
    headline,
    total_yot_records: 0,
    total_court_orders: 0,
    total_prevention_programmes: 0,
    yot_engagement_rate: 0,
    behaviour_plan_compliance_rate: 0,
    restorative_justice_rate: 0,
    court_order_adherence_rate: 0,
    prevention_effectiveness_rate: 0,
    child_engagement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeYouthJusticeOffending(
  input: YouthJusticeInput,
): YouthJusticeResult {
  const {
    total_children,
    yot_liaison_records,
    behaviour_plan_records,
    restorative_justice_records,
    court_order_records,
    prevention_programme_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    yot_liaison_records.length === 0 &&
    behaviour_plan_records.length === 0 &&
    restorative_justice_records.length === 0 &&
    court_order_records.length === 0 &&
    prevention_programme_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess youth justice and offending intelligence.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No youth justice or offending data recorded despite children on placement — youth justice engagement requires urgent attention.",
      ),
      concerns: [
        "No YOT liaison records, behaviour plans, restorative justice records, court order records, or prevention programme records exist despite children being on placement — the home cannot evidence adequate youth justice engagement or offending prevention management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of YOT liaison meetings, offending behaviour plans, restorative justice activities, court order compliance, and prevention programmes to evidence the home's management of youth justice engagement.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child with youth justice involvement has documented YOT liaison arrangements, active behaviour plans, and monitored court order compliance with clear staff accountability.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
        },
      ],
      insights: [
        {
          text: "The complete absence of youth justice and offending records means Ofsted cannot verify that children's justice involvement is being managed, court orders are adhered to, or reoffending prevention is in place. This represents a fundamental gap in Reg 5 and Reg 12 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- YOT liaison metrics ---
  const totalYotRecords = yot_liaison_records.length;

  const yotMeetingsAttended = yot_liaison_records.filter((r) => r.meeting_attended).length;

  const childAttendedYot = yot_liaison_records.filter((r) => r.child_attended).length;

  const yotActionsCompleted = yot_liaison_records.filter((r) => r.actions_completed).length;
  const yotActionCompletionRate = pct(yotActionsCompleted, totalYotRecords);

  const yotInfoShared = yot_liaison_records.filter((r) => r.information_shared_with_team).length;

  const yotChildViewsCaptured = yot_liaison_records.filter((r) => r.child_views_captured).length;
  const yotChildViewsRate = pct(yotChildViewsCaptured, totalYotRecords);

  const yotQualitySum = yot_liaison_records.reduce((sum, r) => sum + r.quality_rating, 0);
  const avgYotQualityRating =
    totalYotRecords > 0
      ? Math.round((yotQualitySum / totalYotRecords) * 100) / 100
      : null;

  // YOT engagement composite: attended + actions completed + info shared + child views
  const yotEngagementNumerator = yotMeetingsAttended + yotActionsCompleted + yotInfoShared + yotChildViewsCaptured;
  const yotEngagementDenominator = totalYotRecords * 4;
  const yotEngagementRate = pct(yotEngagementNumerator, yotEngagementDenominator);

  // --- Behaviour plan metrics ---
  const totalBehaviourPlans = behaviour_plan_records.length;

  const totalTargetsSet = behaviour_plan_records.reduce((sum, p) => sum + p.total_targets, 0);
  const totalTargetsMet = behaviour_plan_records.reduce((sum, p) => sum + p.targets_met, 0);

  const plansReviewed = behaviour_plan_records.filter((p) => p.plan_reviewed).length;
  const planReviewRate = pct(plansReviewed, totalBehaviourPlans);

  const childInvolvedInPlanning = behaviour_plan_records.filter((p) => p.child_involved_in_planning).length;
  const childPlanInvolvementRate = pct(childInvolvedInPlanning, totalBehaviourPlans);

  const childEngagedWithPlan = behaviour_plan_records.filter((p) => p.child_engaged_with_plan).length;

  const evidenceOfChange = behaviour_plan_records.filter((p) => p.evidence_of_change).length;
  const evidenceOfChangeRate = pct(evidenceOfChange, totalBehaviourPlans);

  const progressSum = behaviour_plan_records.reduce((sum, p) => sum + p.progress_rating, 0);
  const avgProgressRating =
    totalBehaviourPlans > 0
      ? Math.round((progressSum / totalBehaviourPlans) * 100) / 100
      : null;

  // Behaviour plan compliance composite: targets met rate + reviewed + child engaged + evidence of change
  const bpComplianceNumerator = totalTargetsMet + plansReviewed + childEngagedWithPlan + evidenceOfChange;
  const bpComplianceDenominator = totalTargetsSet + totalBehaviourPlans + totalBehaviourPlans + totalBehaviourPlans;
  const behaviourPlanComplianceRate = pct(bpComplianceNumerator, bpComplianceDenominator);

  // --- Restorative justice metrics ---
  const totalRjRecords = restorative_justice_records.length;

  const rjParticipated = restorative_justice_records.filter((r) => r.child_participated).length;

  const rjEngaged = restorative_justice_records.filter((r) => r.child_engaged).length;

  const rjEmpathy = restorative_justice_records.filter((r) => r.child_showed_empathy).length;
  const rjEmpathyRate = pct(rjEmpathy, totalRjRecords);

  const rjOutcomeAchieved = restorative_justice_records.filter((r) => r.outcome_achieved).length;

  const rjFollowUpRequired = restorative_justice_records.filter((r) => r.follow_up_required).length;
  const rjFollowUpCompleted = restorative_justice_records.filter((r) => r.follow_up_required && r.follow_up_completed).length;
  const rjFollowUpCompletionRate = pct(rjFollowUpCompleted, rjFollowUpRequired);

  const rjReflectionDocumented = restorative_justice_records.filter((r) => r.child_reflection_documented).length;

  // RJ composite: participated + engaged + outcome achieved + reflection documented
  const rjCompositeNumerator = rjParticipated + rjEngaged + rjOutcomeAchieved + rjReflectionDocumented;
  const rjCompositeDenominator = totalRjRecords * 4;
  const restorativeJusticeRate = pct(rjCompositeNumerator, rjCompositeDenominator);

  // --- Court order metrics ---
  const totalCourtOrders = court_order_records.length;

  const totalConditionsCount = court_order_records.reduce((sum, o) => sum + o.total_conditions, 0);
  const totalConditionsComplied = court_order_records.reduce((sum, o) => sum + o.conditions_complied_with, 0);
  const conditionComplianceRate = pct(totalConditionsComplied, totalConditionsCount);

  const breachOccurred = court_order_records.filter((o) => o.breach_occurred).length;
  const breachRate = pct(breachOccurred, totalCourtOrders);

  const homeSupportedCompliance = court_order_records.filter((o) => o.home_supported_compliance).length;

  const monitoringInPlace = court_order_records.filter((o) => o.monitoring_in_place).length;

  // Court order adherence composite: conditions complied + home supported + monitoring
  const courtAdherenceNumerator = totalConditionsComplied + homeSupportedCompliance + monitoringInPlace;
  const courtAdherenceDenominator = totalConditionsCount + totalCourtOrders + totalCourtOrders;
  const courtOrderAdherenceRate = pct(courtAdherenceNumerator, courtAdherenceDenominator);

  // --- Prevention programme metrics ---
  const totalPreventionProgrammes = prevention_programme_records.length;

  const totalSessionsPlanned = prevention_programme_records.reduce((sum, p) => sum + p.sessions_planned, 0);
  const totalSessionsAttended = prevention_programme_records.reduce((sum, p) => sum + p.sessions_attended, 0);
  const sessionAttendanceRate = pct(totalSessionsAttended, totalSessionsPlanned);

  const preventionEngaged = prevention_programme_records.filter((p) => p.child_engaged).length;

  const preventionProgressPositive = prevention_programme_records.filter((p) => p.child_progress_positive).length;

  const measurableOutcomes = prevention_programme_records.filter((p) => p.measurable_outcomes_documented).length;
  const measurableOutcomesRate = pct(measurableOutcomes, totalPreventionProgrammes);

  const noReoffending = prevention_programme_records.filter((p) => !p.reoffending_since_start).length;
  const noReoffendingRate = pct(noReoffending, totalPreventionProgrammes);

  // Prevention effectiveness composite: attended sessions + engaged + progress + no reoffending
  const prevEffNumerator = totalSessionsAttended + preventionEngaged + preventionProgressPositive + noReoffending;
  const prevEffDenominator = totalSessionsPlanned + totalPreventionProgrammes + totalPreventionProgrammes + totalPreventionProgrammes;
  const preventionEffectivenessRate = pct(prevEffNumerator, prevEffDenominator);

  // --- Overall child engagement rate ---
  // Composite across: child YOT attendance + child plan engagement + RJ participation + prevention engagement
  const childEngTotal =
    childAttendedYot + childEngagedWithPlan + rjParticipated + preventionEngaged;
  const childEngDenom =
    totalYotRecords + totalBehaviourPlans + totalRjRecords + totalPreventionProgrammes;
  const childEngagementRate = pct(childEngTotal, childEngDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: yotEngagementRate (>=90: +4, >=70: +2) ---
  if (yotEngagementRate >= 90) score += 4;
  else if (yotEngagementRate >= 70) score += 2;

  // --- Bonus 2: behaviourPlanComplianceRate (>=85: +3, >=65: +1) ---
  if (behaviourPlanComplianceRate >= 85) score += 3;
  else if (behaviourPlanComplianceRate >= 65) score += 1;

  // --- Bonus 3: restorativeJusticeRate (>=90: +3, >=70: +1) ---
  if (restorativeJusticeRate >= 90) score += 3;
  else if (restorativeJusticeRate >= 70) score += 1;

  // --- Bonus 4: courtOrderAdherenceRate (>=90: +4, >=70: +2) ---
  if (courtOrderAdherenceRate >= 90) score += 4;
  else if (courtOrderAdherenceRate >= 70) score += 2;

  // --- Bonus 5: preventionEffectivenessRate (>=85: +3, >=65: +1) ---
  if (preventionEffectivenessRate >= 85) score += 3;
  else if (preventionEffectivenessRate >= 65) score += 1;

  // --- Bonus 6: childEngagementRate (>=90: +3, >=70: +1) ---
  if (childEngagementRate >= 90) score += 3;
  else if (childEngagementRate >= 70) score += 1;

  // --- Bonus 7: noReoffendingRate (>=90: +3, >=70: +1) ---
  if (noReoffendingRate >= 90) score += 3;
  else if (noReoffendingRate >= 70) score += 1;

  // --- Bonus 8: yotActionCompletionRate (>=90: +3, >=70: +1) ---
  if (yotActionCompletionRate >= 90) score += 3;
  else if (yotActionCompletionRate >= 70) score += 1;

  // --- Bonus 9: rjFollowUpCompletionRate (>=90: +2, >=70: +1) ---
  if (rjFollowUpCompletionRate >= 90) score += 2;
  else if (rjFollowUpCompletionRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // courtOrderAdherenceRate < 50 → -5
  if (courtOrderAdherenceRate < 50 && court_order_records.length > 0) score -= 5;

  // behaviourPlanComplianceRate < 40 → -5
  if (behaviourPlanComplianceRate < 40 && behaviour_plan_records.length > 0) score -= 5;

  // breachRate > 50 → -5
  if (breachRate > 50 && court_order_records.length > 0) score -= 5;

  // yotEngagementRate < 40 → -3
  if (yotEngagementRate < 40 && yot_liaison_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const justice_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (yotEngagementRate >= 90 && totalYotRecords > 0) {
    strengths.push(
      `${yotEngagementRate}% YOT engagement rate — the home demonstrates excellent liaison with Youth Offending Team professionals, ensuring meetings are attended, actions are completed, information is shared, and children's views are captured consistently.`,
    );
  } else if (yotEngagementRate >= 70 && totalYotRecords > 0) {
    strengths.push(
      `${yotEngagementRate}% YOT engagement rate — the home maintains good liaison with Youth Offending Team professionals across attendance, action completion, and information sharing.`,
    );
  }

  if (behaviourPlanComplianceRate >= 85 && totalBehaviourPlans > 0) {
    strengths.push(
      `${behaviourPlanComplianceRate}% behaviour plan compliance — offending behaviour plans are well-reviewed, children are engaged, targets are being met, and evidence of positive behavioural change is documented.`,
    );
  } else if (behaviourPlanComplianceRate >= 65 && totalBehaviourPlans > 0) {
    strengths.push(
      `${behaviourPlanComplianceRate}% behaviour plan compliance — the home generally maintains effective offending behaviour plans with reasonable target achievement and child engagement.`,
    );
  }

  if (restorativeJusticeRate >= 90 && totalRjRecords > 0) {
    strengths.push(
      `${restorativeJusticeRate}% restorative justice engagement — children participate actively in restorative processes, demonstrate empathy, achieve outcomes, and their reflections are documented, showing genuine developmental progress.`,
    );
  } else if (restorativeJusticeRate >= 70 && totalRjRecords > 0) {
    strengths.push(
      `${restorativeJusticeRate}% restorative justice engagement — children generally participate in and benefit from restorative justice processes.`,
    );
  }

  if (courtOrderAdherenceRate >= 90 && totalCourtOrders > 0) {
    strengths.push(
      `${courtOrderAdherenceRate}% court order adherence — the home proactively supports children to comply with court order conditions, with effective monitoring systems and staff accountability in place.`,
    );
  } else if (courtOrderAdherenceRate >= 70 && totalCourtOrders > 0) {
    strengths.push(
      `${courtOrderAdherenceRate}% court order adherence — the home supports children to comply with most court order conditions with monitoring in place.`,
    );
  }

  if (preventionEffectivenessRate >= 85 && totalPreventionProgrammes > 0) {
    strengths.push(
      `${preventionEffectivenessRate}% prevention programme effectiveness — children attend sessions, engage meaningfully, make positive progress, and reoffending rates remain low, demonstrating the home's commitment to diversion and rehabilitation.`,
    );
  } else if (preventionEffectivenessRate >= 65 && totalPreventionProgrammes > 0) {
    strengths.push(
      `${preventionEffectivenessRate}% prevention programme effectiveness — prevention programmes are generally effective with reasonable attendance and engagement.`,
    );
  }

  if (childEngagementRate >= 90 && childEngDenom > 0) {
    strengths.push(
      `${childEngagementRate}% overall child engagement across youth justice processes — children are actively involved in YOT meetings, behaviour planning, restorative justice, and prevention programmes, reflecting a child-centred approach.`,
    );
  } else if (childEngagementRate >= 70 && childEngDenom > 0) {
    strengths.push(
      `${childEngagementRate}% overall child engagement — children are generally involved in youth justice processes across the home.`,
    );
  }

  if (noReoffendingRate >= 90 && totalPreventionProgrammes > 0) {
    strengths.push(
      `${noReoffendingRate}% of children on prevention programmes have not reoffended — the home's interventions are successfully diverting children from further offending and supporting positive change.`,
    );
  } else if (noReoffendingRate >= 70 && totalPreventionProgrammes > 0) {
    strengths.push(
      `${noReoffendingRate}% of children on prevention programmes have not reoffended — programmes are contributing to reduced reoffending.`,
    );
  }

  if (yotActionCompletionRate >= 90 && totalYotRecords > 0) {
    strengths.push(
      `${yotActionCompletionRate}% YOT action completion rate — agreed actions from YOT meetings are consistently completed, demonstrating reliable follow-through and professional partnership.`,
    );
  } else if (yotActionCompletionRate >= 70 && totalYotRecords > 0) {
    strengths.push(
      `${yotActionCompletionRate}% YOT action completion — the home generally completes agreed actions from YOT meetings.`,
    );
  }

  if (rjFollowUpCompletionRate >= 90 && rjFollowUpRequired > 0) {
    strengths.push(
      `${rjFollowUpCompletionRate}% restorative justice follow-up completion — actions identified during restorative processes are consistently followed through, reinforcing the therapeutic value of the intervention.`,
    );
  } else if (rjFollowUpCompletionRate >= 70 && rjFollowUpRequired > 0) {
    strengths.push(
      `${rjFollowUpCompletionRate}% restorative justice follow-up completion — the home generally completes follow-up actions from restorative justice processes.`,
    );
  }

  if (rjEmpathyRate >= 90 && totalRjRecords > 0) {
    strengths.push(
      `${rjEmpathyRate}% of children demonstrated empathy during restorative justice — children are developing victim awareness and understanding the impact of their behaviour, a key indicator of reduced reoffending risk.`,
    );
  } else if (rjEmpathyRate >= 70 && totalRjRecords > 0) {
    strengths.push(
      `${rjEmpathyRate}% of children demonstrated empathy during restorative justice — the majority of children are showing developing awareness of the impact of their offending.`,
    );
  }

  if (conditionComplianceRate >= 90 && totalConditionsCount > 0) {
    strengths.push(
      `${conditionComplianceRate}% court order condition compliance — children are meeting the specific conditions of their orders, supported by proactive monitoring and staff engagement.`,
    );
  }

  if (yotChildViewsRate >= 90 && totalYotRecords > 0) {
    strengths.push(
      `${yotChildViewsRate}% of YOT meetings captured children's views — children's voices are consistently heard in youth justice processes, supporting their participation rights under SCCIF.`,
    );
  }

  if (evidenceOfChangeRate >= 80 && totalBehaviourPlans > 0) {
    strengths.push(
      `${evidenceOfChangeRate}% of behaviour plans show evidence of positive change — the home's interventions are demonstrably helping children modify their offending behaviour and make better choices.`,
    );
  }

  if (sessionAttendanceRate >= 90 && totalSessionsPlanned > 0) {
    strengths.push(
      `${sessionAttendanceRate}% prevention programme session attendance — children are consistently attending planned sessions, demonstrating commitment to their programmes and effective staff support.`,
    );
  }

  if ((avgYotQualityRating ?? 0) >= 4.0 && totalYotRecords > 0) {
    strengths.push(
      `Average YOT liaison quality rating of ${avgYotQualityRating}/5 — the quality of multi-agency working with Youth Offending Teams is consistently high, supporting effective case management.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (yotEngagementRate < 40 && totalYotRecords > 0) {
    concerns.push(
      `Only ${yotEngagementRate}% YOT engagement rate — the home is failing to maintain adequate liaison with Youth Offending Team professionals, undermining multi-agency working and children's access to specialist support.`,
    );
  } else if (yotEngagementRate < 70 && yotEngagementRate >= 40 && totalYotRecords > 0) {
    concerns.push(
      `YOT engagement rate at ${yotEngagementRate}% — liaison with Youth Offending Team professionals is inconsistent, with gaps in meeting attendance, action completion, or information sharing.`,
    );
  }

  if (behaviourPlanComplianceRate < 40 && totalBehaviourPlans > 0) {
    concerns.push(
      `Only ${behaviourPlanComplianceRate}% behaviour plan compliance — offending behaviour plans are not being effectively implemented, targets are not being met, and children are not demonstrating positive change. This undermines the home's ability to address offending behaviour.`,
    );
  } else if (behaviourPlanComplianceRate < 65 && behaviourPlanComplianceRate >= 40 && totalBehaviourPlans > 0) {
    concerns.push(
      `Behaviour plan compliance at ${behaviourPlanComplianceRate}% — some offending behaviour plans lack effective review, child engagement, or evidence of progress toward targets.`,
    );
  }

  if (restorativeJusticeRate < 50 && totalRjRecords > 0) {
    concerns.push(
      `Only ${restorativeJusticeRate}% restorative justice engagement — children are not participating meaningfully in restorative processes, limiting opportunities for victim empathy development, accountability, and conflict resolution skills.`,
    );
  } else if (restorativeJusticeRate < 70 && restorativeJusticeRate >= 50 && totalRjRecords > 0) {
    concerns.push(
      `Restorative justice engagement at ${restorativeJusticeRate}% — some children are not fully participating in or benefiting from restorative justice processes.`,
    );
  }

  if (courtOrderAdherenceRate < 50 && totalCourtOrders > 0) {
    concerns.push(
      `Only ${courtOrderAdherenceRate}% court order adherence — the home is not adequately supporting children to comply with court-imposed conditions, with insufficient monitoring and support systems. Non-compliance puts children at risk of further legal consequences.`,
    );
  } else if (courtOrderAdherenceRate < 70 && courtOrderAdherenceRate >= 50 && totalCourtOrders > 0) {
    concerns.push(
      `Court order adherence at ${courtOrderAdherenceRate}% — some children are not fully complying with court order conditions, and the home's monitoring and support needs strengthening.`,
    );
  }

  if (preventionEffectivenessRate < 50 && totalPreventionProgrammes > 0) {
    concerns.push(
      `Only ${preventionEffectivenessRate}% prevention programme effectiveness — children are not attending sessions, engaging with programmes, or making progress, undermining the home's reoffending prevention strategy.`,
    );
  } else if (preventionEffectivenessRate < 65 && preventionEffectivenessRate >= 50 && totalPreventionProgrammes > 0) {
    concerns.push(
      `Prevention programme effectiveness at ${preventionEffectivenessRate}% — attendance, engagement, or progress in prevention programmes needs improvement.`,
    );
  }

  if (breachRate > 50 && totalCourtOrders > 0) {
    concerns.push(
      `${breachRate}% of court orders have experienced breaches — a majority of children with court orders are breaching conditions, indicating that the home's compliance support and monitoring systems are failing. This has serious consequences for children's legal status and welfare.`,
    );
  } else if (breachRate > 25 && breachRate <= 50 && totalCourtOrders > 0) {
    concerns.push(
      `${breachRate}% of court orders have experienced breaches — a notable proportion of children are breaching court order conditions, requiring review of compliance support approaches.`,
    );
  }

  if (childEngagementRate < 50 && childEngDenom > 0) {
    concerns.push(
      `Only ${childEngagementRate}% overall child engagement across youth justice processes — children are not actively participating in the processes designed to support them, undermining the child-centred approach required by SCCIF.`,
    );
  } else if (childEngagementRate < 70 && childEngagementRate >= 50 && childEngDenom > 0) {
    concerns.push(
      `Overall child engagement at ${childEngagementRate}% — some children are not fully engaging with youth justice processes across the home.`,
    );
  }

  if (noReoffendingRate < 50 && totalPreventionProgrammes > 0) {
    concerns.push(
      `Only ${noReoffendingRate}% of children on prevention programmes have not reoffended — a majority of children are reoffending despite intervention, requiring urgent review of programme suitability and intensity.`,
    );
  } else if (noReoffendingRate < 70 && noReoffendingRate >= 50 && totalPreventionProgrammes > 0) {
    concerns.push(
      `${100 - noReoffendingRate}% reoffending rate among children on prevention programmes — some children are reoffending despite intervention, suggesting programmes may need to be adapted or intensified.`,
    );
  }

  if (yotActionCompletionRate < 50 && totalYotRecords > 0) {
    concerns.push(
      `Only ${yotActionCompletionRate}% of YOT meeting actions completed — agreed actions are not being followed through, damaging the home's professional credibility and potentially leaving children without needed support.`,
    );
  } else if (yotActionCompletionRate < 70 && yotActionCompletionRate >= 50 && totalYotRecords > 0) {
    concerns.push(
      `YOT action completion rate at ${yotActionCompletionRate}% — some agreed actions from YOT meetings are not being followed through.`,
    );
  }

  if (rjFollowUpCompletionRate < 50 && rjFollowUpRequired > 0) {
    concerns.push(
      `Only ${rjFollowUpCompletionRate}% of restorative justice follow-up actions completed — the therapeutic value of restorative processes is being undermined by failure to follow through on identified actions.`,
    );
  }

  if (totalYotRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No YOT liaison records exist despite children being on placement — the home cannot evidence any structured engagement with Youth Offending Team professionals.",
    );
  }

  if (totalCourtOrders === 0 && total_children > 0 && !allEmpty && totalBehaviourPlans > 0) {
    // Only flag if there are behaviour plans (indicating justice involvement) but no court orders tracked
    concerns.push(
      "No court order records are being tracked despite evidence of youth justice involvement through behaviour plans — the home should review whether any children have active orders requiring compliance monitoring.",
    );
  }

  if (planReviewRate < 50 && totalBehaviourPlans > 0) {
    concerns.push(
      `Only ${planReviewRate}% of behaviour plans reviewed — plans exist but are not being monitored for effectiveness, meaning the home cannot evidence whether interventions are reducing offending behaviour.`,
    );
  } else if (planReviewRate < 70 && planReviewRate >= 50 && totalBehaviourPlans > 0) {
    concerns.push(
      `Behaviour plan review rate at ${planReviewRate}% — not all offending behaviour plans are being reviewed regularly to assess progress and effectiveness.`,
    );
  }

  if (childPlanInvolvementRate < 50 && totalBehaviourPlans > 0) {
    concerns.push(
      `Only ${childPlanInvolvementRate}% child involvement in behaviour plan creation — children's views about their offending behaviour and what might help them change are not being sought, undermining the voice of the child.`,
    );
  }

  if ((avgProgressRating ?? 0) < 2.5 && totalBehaviourPlans > 0) {
    concerns.push(
      `Average behaviour plan progress rating at only ${avgProgressRating}/5 — children are not making sufficient progress against their offending behaviour targets, indicating plans may need restructuring.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: YouthJusticeRecommendation[] = [];
  let rank = 0;

  if (courtOrderAdherenceRate < 50 && totalCourtOrders > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review court order compliance support for all children — ensure every child with an active order has a named staff member responsible for monitoring compliance, with daily condition checks and proactive support to prevent breaches.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (breachRate > 50 && totalCourtOrders > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an urgent review of all court order breaches — analyse patterns, identify systemic factors contributing to non-compliance, and implement enhanced monitoring and support arrangements to prevent further breaches.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (behaviourPlanComplianceRate < 40 && totalBehaviourPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul offending behaviour plans — review all plans with YOT workers, ensure targets are realistic and achievable, involve children meaningfully in the planning process, and establish regular structured reviews to track progress.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (yotEngagementRate < 40 && totalYotRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve YOT liaison arrangements — establish regular scheduled meetings, ensure home staff and children attend consistently, complete all agreed actions, and share information with the wider team to support effective multi-agency working.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (noReoffendingRate < 50 && totalPreventionProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all prevention programmes — when more than half of children reoffend despite intervention, the programmes may be unsuitable, insufficiently intensive, or poorly matched to individual needs. Seek specialist assessment and consider alternative approaches.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (childEngagementRate < 50 && childEngDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop strategies to improve children's engagement with youth justice processes — work with each child individually to understand barriers to participation and adapt approaches to be more child-centred, motivating, and meaningful.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Children's experiences",
    });
  }

  if (totalYotRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement structured YOT liaison recording for every child with youth justice involvement — without documented meetings, actions, and outcomes, the home cannot evidence effective partnership working.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (restorativeJusticeRate < 50 && totalRjRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve children's preparation for and participation in restorative justice processes — ensure children understand the purpose, are supported by staff throughout, and that reflections and outcomes are properly documented.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (yotActionCompletionRate < 50 && totalYotRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an action tracker for YOT meeting outcomes — assign ownership of each action, set completion deadlines, and review progress at team meetings to ensure agreed actions are followed through consistently.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (rjFollowUpCompletionRate < 50 && rjFollowUpRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all restorative justice follow-up actions are completed — the therapeutic impact of restorative processes depends on consistent follow-through to reinforce learning and support behavioural change.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (planReviewRate < 50 && totalBehaviourPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular review schedule for all offending behaviour plans — unreviewed plans cannot be evidenced as effective and may become misaligned with children's current circumstances and needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (childPlanInvolvementRate < 50 && totalBehaviourPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children meaningfully in their offending behaviour plan creation and review — ask children about their understanding of their behaviour, what triggers offending, and what strategies they think might help them change.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's experiences",
    });
  }

  if (
    preventionEffectivenessRate >= 50 &&
    preventionEffectivenessRate < 65 &&
    totalPreventionProgrammes > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen prevention programme delivery — review session attendance barriers, adapt programme content to individual needs, and establish clearer measurable outcomes to track effectiveness.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    courtOrderAdherenceRate >= 50 &&
    courtOrderAdherenceRate < 70 &&
    totalCourtOrders > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve court order compliance support — review monitoring arrangements, ensure staff understand each child's specific conditions, and provide proactive daily support to prevent breaches.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    yotEngagementRate >= 40 &&
    yotEngagementRate < 70 &&
    totalYotRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen YOT liaison quality — focus on improving action completion rates, ensuring information is shared with the full team, and capturing children's views at every meeting.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    behaviourPlanComplianceRate >= 40 &&
    behaviourPlanComplianceRate < 65 &&
    totalBehaviourPlans > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance behaviour plan effectiveness through more frequent reviews, greater child involvement, and specialist input where needed — aim for all plans to show evidence of positive change.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (
    restorativeJusticeRate >= 50 &&
    restorativeJusticeRate < 70 &&
    totalRjRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance restorative justice participation by improving preparation, staff support during sessions, and ensuring children's reflections are documented to capture learning and developmental progress.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70 &&
    childEngDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Seek regular feedback from children about their experiences of youth justice processes and adapt approaches based on what children say helps them engage and make progress.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children's experiences",
    });
  }

  if (measurableOutcomesRate < 70 && totalPreventionProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all prevention programmes have documented measurable outcomes — without clear outcome metrics, the home cannot evidence whether programmes are effectively reducing reoffending risk.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (sessionAttendanceRate < 70 && totalSessionsPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve prevention programme session attendance — identify and address barriers to attendance such as scheduling conflicts, transport, motivation, or competing activities. Consider whether programmes are suitable for individual children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: YouthJusticeInsight[] = [];

  // -- Critical insights --

  if (courtOrderAdherenceRate < 50 && totalCourtOrders > 0) {
    insights.push({
      text: `Only ${courtOrderAdherenceRate}% court order adherence. Ofsted expects children's homes to actively support children in complying with court-imposed conditions. Failure to do so puts children at risk of escalating legal consequences, including custodial sentences, and raises serious questions about the home's capacity to meet Reg 5 requirements.`,
      severity: "critical",
    });
  }

  if (breachRate > 50 && totalCourtOrders > 0) {
    insights.push({
      text: `${breachRate}% of court orders have experienced breaches. Frequent breaches indicate systemic failure in compliance support — children are being set up to fail rather than supported to succeed. Each breach carries serious consequences for the child's legal status, future prospects, and emotional wellbeing.`,
      severity: "critical",
    });
  }

  if (behaviourPlanComplianceRate < 40 && totalBehaviourPlans > 0) {
    insights.push({
      text: `Only ${behaviourPlanComplianceRate}% behaviour plan compliance. When offending behaviour plans are not effectively implemented, children miss the opportunity for structured support to understand and change their behaviour. This represents a missed therapeutic window and increases reoffending risk.`,
      severity: "critical",
    });
  }

  if (yotEngagementRate < 40 && totalYotRecords > 0) {
    insights.push({
      text: `Only ${yotEngagementRate}% YOT engagement. Effective multi-agency working with Youth Offending Teams is essential for managing children's justice involvement. Poor engagement means actions go uncompleted, information is not shared, and children do not benefit from specialist YOT expertise.`,
      severity: "critical",
    });
  }

  if (noReoffendingRate < 50 && totalPreventionProgrammes > 0) {
    insights.push({
      text: `More than half of children on prevention programmes have reoffended. When prevention efforts fail at this scale, it suggests programmes may be poorly matched to children's needs, insufficiently intensive, or that underlying factors driving offending behaviour have not been addressed.`,
      severity: "critical",
    });
  }

  if (childEngagementRate < 50 && childEngDenom > 0) {
    insights.push({
      text: `Only ${childEngagementRate}% overall child engagement in youth justice processes. When children are not participating in the processes designed to help them, those processes become performative rather than therapeutic. Ofsted views child engagement as fundamental to effective care under SCCIF.`,
      severity: "critical",
    });
  }

  if (totalYotRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No YOT liaison records exist despite children being on placement. Without documented multi-agency engagement, the home cannot evidence that children with youth justice involvement are receiving coordinated support from specialist professionals.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    yotEngagementRate >= 40 &&
    yotEngagementRate < 70 &&
    totalYotRecords > 0
  ) {
    insights.push({
      text: `YOT engagement at ${yotEngagementRate}% — improving but inconsistent. Some meetings are missed, actions go uncompleted, or information is not shared with the wider team. Consistent multi-agency working is essential for effective youth justice management.`,
      severity: "warning",
    });
  }

  if (
    behaviourPlanComplianceRate >= 40 &&
    behaviourPlanComplianceRate < 65 &&
    totalBehaviourPlans > 0
  ) {
    insights.push({
      text: `Behaviour plan compliance at ${behaviourPlanComplianceRate}% — plans exist but are not consistently driving positive change. Review whether targets are realistic, whether children are genuinely involved, and whether sufficient specialist support is available.`,
      severity: "warning",
    });
  }

  if (
    restorativeJusticeRate >= 50 &&
    restorativeJusticeRate < 70 &&
    totalRjRecords > 0
  ) {
    insights.push({
      text: `Restorative justice engagement at ${restorativeJusticeRate}% — some children are not fully participating or benefiting. Consider whether children are adequately prepared, staff-supported, and whether the restorative approach is being adapted to each child's developmental level and needs.`,
      severity: "warning",
    });
  }

  if (
    courtOrderAdherenceRate >= 50 &&
    courtOrderAdherenceRate < 70 &&
    totalCourtOrders > 0
  ) {
    insights.push({
      text: `Court order adherence at ${courtOrderAdherenceRate}% — some children are not fully complying with court conditions. Early identification of compliance difficulties and proactive support can prevent breaches and their serious consequences.`,
      severity: "warning",
    });
  }

  if (
    preventionEffectivenessRate >= 50 &&
    preventionEffectivenessRate < 65 &&
    totalPreventionProgrammes > 0
  ) {
    insights.push({
      text: `Prevention programme effectiveness at ${preventionEffectivenessRate}% — programmes are having limited impact. Consider whether the right programmes are being commissioned, whether session frequency is sufficient, and whether children's individual criminogenic needs are being addressed.`,
      severity: "warning",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70 &&
    childEngDenom > 0
  ) {
    insights.push({
      text: `Child engagement at ${childEngagementRate}% — a notable proportion of children are not actively participating in youth justice processes. Explore whether approaches need to be more creative, age-appropriate, or trauma-informed to increase engagement.`,
      severity: "warning",
    });
  }

  if (breachRate > 25 && breachRate <= 50 && totalCourtOrders > 0) {
    insights.push({
      text: `${breachRate}% breach rate across court orders — while not a majority, this indicates that some children are struggling to comply with conditions. Proactive daily compliance checks and individual support plans can help prevent escalation.`,
      severity: "warning",
    });
  }

  if (
    noReoffendingRate >= 50 &&
    noReoffendingRate < 70 &&
    totalPreventionProgrammes > 0
  ) {
    insights.push({
      text: `${100 - noReoffendingRate}% reoffending rate despite prevention programmes — a significant minority of children are reoffending. Consider whether programme intensity, duration, or type needs adjustment for these children.`,
      severity: "warning",
    });
  }

  if (
    yotActionCompletionRate >= 50 &&
    yotActionCompletionRate < 70 &&
    totalYotRecords > 0
  ) {
    insights.push({
      text: `YOT action completion at ${yotActionCompletionRate}% — some agreed actions are not being followed through. Incomplete actions damage professional relationships and may leave gaps in children's support plans.`,
      severity: "warning",
    });
  }

  if (
    planReviewRate >= 50 &&
    planReviewRate < 70 &&
    totalBehaviourPlans > 0
  ) {
    insights.push({
      text: `Behaviour plan review rate at ${planReviewRate}% — not all plans are being regularly reviewed. Without consistent review, the home cannot evidence that interventions are effective or adapt approaches when needed.`,
      severity: "warning",
    });
  }

  if (
    (avgProgressRating ?? 0) >= 2.5 &&
    (avgProgressRating ?? 0) < 3.5 &&
    totalBehaviourPlans > 0
  ) {
    insights.push({
      text: `Average behaviour plan progress at ${avgProgressRating}/5 — progress is mediocre across the home. This suggests that interventions may need to be more targeted, intensive, or better matched to individual children's needs.`,
      severity: "warning",
    });
  }

  if (
    sessionAttendanceRate >= 50 &&
    sessionAttendanceRate < 70 &&
    totalSessionsPlanned > 0
  ) {
    insights.push({
      text: `Prevention programme session attendance at ${sessionAttendanceRate}% — inconsistent attendance reduces programme effectiveness. Investigate whether timing, location, relevance, or motivation are barriers to consistent attendance.`,
      severity: "warning",
    });
  }

  // Programme type analysis
  const programmeTypes: Record<string, number> = {};
  for (const p of prevention_programme_records) {
    programmeTypes[p.programme_type] = (programmeTypes[p.programme_type] ?? 0) + 1;
  }
  const topProgrammes = Object.entries(programmeTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topProgrammes.length > 0) {
    const formatted = topProgrammes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most utilised prevention programme types: ${formatted}. Understanding programme distribution helps assess whether the home's intervention portfolio matches children's individual criminogenic needs and risk profiles.`,
      severity: "warning",
    });
  }

  // Order type analysis
  const orderTypes: Record<string, number> = {};
  for (const o of court_order_records) {
    orderTypes[o.order_type] = (orderTypes[o.order_type] ?? 0) + 1;
  }
  const topOrders = Object.entries(orderTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topOrders.length > 0) {
    const formatted = topOrders
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Court order types: ${formatted}. The nature and volume of court orders across the home informs resource planning and specialist training requirements for staff supporting children through the justice system.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (justice_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding youth justice and offending management — YOT liaison is excellent, behaviour plans are effective, court orders are adhered to, restorative justice processes are meaningful, and prevention programmes are reducing reoffending. This is strong evidence for Reg 5 and Reg 12 compliance.",
      severity: "positive",
    });
  }

  if (
    yotEngagementRate >= 90 &&
    yotActionCompletionRate >= 90 &&
    totalYotRecords > 0
  ) {
    insights.push({
      text: `${yotEngagementRate}% YOT engagement with ${yotActionCompletionRate}% action completion — the home demonstrates exemplary multi-agency partnership working with Youth Offending Teams, ensuring agreed actions are consistently followed through and children receive coordinated specialist support.`,
      severity: "positive",
    });
  }

  if (
    courtOrderAdherenceRate >= 90 &&
    breachRate === 0 &&
    totalCourtOrders > 0
  ) {
    insights.push({
      text: `${courtOrderAdherenceRate}% court order adherence with zero breaches — the home proactively supports children to comply with court-imposed conditions, with effective monitoring that prevents non-compliance before it occurs. This protects children from escalating legal consequences.`,
      severity: "positive",
    });
  }

  if (
    behaviourPlanComplianceRate >= 85 &&
    evidenceOfChangeRate >= 80 &&
    totalBehaviourPlans > 0
  ) {
    insights.push({
      text: `${behaviourPlanComplianceRate}% behaviour plan compliance with ${evidenceOfChangeRate}% showing evidence of change — offending behaviour plans are not just administrative documents but are driving genuine positive behavioural change in children's lives.`,
      severity: "positive",
    });
  }

  if (
    restorativeJusticeRate >= 90 &&
    rjEmpathyRate >= 80 &&
    totalRjRecords > 0
  ) {
    insights.push({
      text: `${restorativeJusticeRate}% restorative justice engagement with ${rjEmpathyRate}% empathy demonstrated — children are meaningfully participating in restorative processes and developing genuine victim awareness. This is a key protective factor against reoffending.`,
      severity: "positive",
    });
  }

  if (
    preventionEffectivenessRate >= 85 &&
    noReoffendingRate >= 90 &&
    totalPreventionProgrammes > 0
  ) {
    insights.push({
      text: `${preventionEffectivenessRate}% prevention effectiveness with ${noReoffendingRate}% non-reoffending rate — the home's prevention programmes are demonstrably effective, with children attending, engaging, progressing, and crucially, not reoffending. This evidences outstanding reoffending prevention.`,
      severity: "positive",
    });
  }

  if (
    childEngagementRate >= 90 &&
    childEngDenom > 0
  ) {
    insights.push({
      text: `${childEngagementRate}% overall child engagement — children are actively participating across all youth justice processes. This level of engagement reflects genuinely child-centred practice where children feel heard, supported, and motivated to make positive changes.`,
      severity: "positive",
    });
  }

  if (
    noReoffendingRate >= 90 &&
    totalPreventionProgrammes > 0
  ) {
    insights.push({
      text: `${noReoffendingRate}% of children on prevention programmes have not reoffended — the home's approach to diversion and rehabilitation is highly effective. This demonstrates that with the right support, children in care can break the cycle of offending.`,
      severity: "positive",
    });
  }

  if (
    yotChildViewsRate >= 90 &&
    childPlanInvolvementRate >= 90 &&
    totalYotRecords > 0 &&
    totalBehaviourPlans > 0
  ) {
    insights.push({
      text: `${yotChildViewsRate}% child views captured at YOT meetings and ${childPlanInvolvementRate}% involvement in behaviour planning — children's voices are central to how the home manages youth justice engagement. Ofsted views this as evidence of genuinely child-centred practice.`,
      severity: "positive",
    });
  }

  if (
    rjFollowUpCompletionRate >= 90 &&
    rjFollowUpRequired > 0
  ) {
    insights.push({
      text: `${rjFollowUpCompletionRate}% restorative justice follow-up completion — the home consistently follows through on actions identified during restorative processes, reinforcing learning and supporting sustained behavioural change.`,
      severity: "positive",
    });
  }

  if (
    (avgYotQualityRating ?? 0) >= 4.0 &&
    (avgProgressRating ?? 0) >= 4.0 &&
    totalYotRecords > 0 &&
    totalBehaviourPlans > 0
  ) {
    insights.push({
      text: `Average YOT quality rating ${avgYotQualityRating}/5 and behaviour plan progress ${avgProgressRating}/5 — both multi-agency working and individual intervention quality are rated highly, indicating a well-functioning youth justice support system within the home.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (justice_rating === "outstanding") {
    headline =
      "Outstanding youth justice and offending management — YOT liaison is excellent, court orders are adhered to, behaviour plans drive change, and prevention programmes are effective.";
  } else if (justice_rating === "good") {
    headline = `Good youth justice and offending management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (justice_rating === "adequate") {
    headline = `Adequate youth justice and offending management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure effective justice engagement and offending prevention.`;
  } else {
    headline = `Youth justice and offending management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's justice involvement is properly managed.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    justice_rating,
    justice_score: score,
    headline,
    total_yot_records: totalYotRecords,
    total_court_orders: totalCourtOrders,
    total_prevention_programmes: totalPreventionProgrammes,
    yot_engagement_rate: yotEngagementRate,
    behaviour_plan_compliance_rate: behaviourPlanComplianceRate,
    restorative_justice_rate: restorativeJusticeRate,
    court_order_adherence_rate: courtOrderAdherenceRate,
    prevention_effectiveness_rate: preventionEffectivenessRate,
    child_engagement_rate: childEngagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
