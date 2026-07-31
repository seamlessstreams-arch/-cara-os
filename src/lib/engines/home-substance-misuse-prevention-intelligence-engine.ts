// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SUBSTANCE MISUSE PREVENTION INTELLIGENCE ENGINE
// Tracks substance misuse prevention quality — substance awareness education,
// risk assessment completion, early intervention programmes, referral tracking,
// and harm reduction strategies.
// Measures education coverage, risk assessment completion, intervention
// effectiveness, referral compliance, harm reduction adoption, and child awareness.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 14 (Health care),
// Reg 34 (Safeguarding), SCCIF safety and health.
// Store keys: substanceEducationRecords, substanceRiskAssessmentRecords,
//             earlyInterventionRecords, substanceReferralRecords,
//             harmReductionRecords
// ══════════════════════════════════════════════════════════════════════════════

import { meets, below } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SubstanceEducationRecordInput {
  id: string;
  child_id: string;
  date: string;
  topic: "alcohol" | "drugs" | "solvents" | "vaping" | "prescription_misuse" | "legal_highs" | "general_awareness" | "other";
  session_type: "individual" | "group" | "workshop" | "online" | "external_provider" | "other";
  attended: boolean;
  engaged: boolean;
  understanding_demonstrated: boolean;
  child_feedback_positive: boolean;
  age_appropriate: boolean;
  facilitator: string;
  duration_minutes: number;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  linked_to_risk_assessment: boolean;
  notes: string;
  created_at: string;
}

export interface SubstanceRiskAssessmentRecordInput {
  id: string;
  child_id: string;
  date: string;
  assessment_type: "initial" | "review" | "triggered" | "routine";
  risk_level: "low" | "medium" | "high" | "very_high";
  completed: boolean;
  completed_by: string;
  risk_factors_identified: number;
  protective_factors_identified: number;
  action_plan_created: boolean;
  action_plan_reviewed: boolean;
  review_date: string | null;
  review_overdue: boolean;
  shared_with_social_worker: boolean;
  shared_with_health: boolean;
  parental_involvement: boolean;
  child_involved_in_assessment: boolean;
  notes: string;
  created_at: string;
}

export interface EarlyInterventionRecordInput {
  id: string;
  child_id: string;
  date: string;
  intervention_type: "motivational_interviewing" | "brief_intervention" | "therapeutic" | "mentoring" | "peer_support" | "family_work" | "diversionary_activity" | "other";
  trigger: "risk_assessment" | "staff_concern" | "self_referral" | "incident" | "routine_monitoring" | "external_referral" | "other";
  status: "planned" | "in_progress" | "completed" | "discontinued";
  sessions_planned: number;
  sessions_completed: number;
  child_engaged: boolean;
  outcomes_positive: boolean;
  measurable_improvement: boolean;
  risk_level_reduced: boolean;
  facilitator: string;
  reviewed: boolean;
  review_date: string | null;
  notes: string;
  created_at: string;
}

export interface SubstanceReferralRecordInput {
  id: string;
  child_id: string;
  date: string;
  referral_to: "camhs" | "substance_misuse_service" | "yot" | "gp" | "school_nurse" | "specialist_provider" | "social_worker" | "other";
  reason: string;
  urgency: "emergency" | "urgent" | "routine";
  referral_made_within_target: boolean;
  target_days: number;
  actual_days: number;
  accepted: boolean;
  appointment_date: string | null;
  appointment_attended: boolean;
  outcome_recorded: boolean;
  outcome_positive: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  child_consented: boolean;
  parent_informed: boolean;
  social_worker_informed: boolean;
  notes: string;
  created_at: string;
}

export interface HarmReductionRecordInput {
  id: string;
  child_id: string;
  date: string;
  strategy_type: "safety_planning" | "needle_exchange_awareness" | "overdose_prevention" | "safer_use_education" | "testing_awareness" | "relapse_prevention" | "exit_planning" | "peer_influence_management" | "other";
  implemented: boolean;
  child_engaged: boolean;
  child_understands_strategy: boolean;
  reviewed: boolean;
  review_date: string | null;
  review_overdue: boolean;
  effectiveness_rating: number; // 1-5
  risk_reduced: boolean;
  documented: boolean;
  shared_with_team: boolean;
  linked_to_care_plan: boolean;
  notes: string;
  created_at: string;
}

export interface SubstanceMisuseInput {
  today: string;
  total_children: number;
  substance_education_records: SubstanceEducationRecordInput[];
  risk_assessment_records: SubstanceRiskAssessmentRecordInput[];
  early_intervention_records: EarlyInterventionRecordInput[];
  referral_records: SubstanceReferralRecordInput[];
  harm_reduction_records: HarmReductionRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SubstanceMisuseRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SubstanceMisuseInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SubstanceMisuseRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SubstanceMisuseResult {
  substance_rating: SubstanceMisuseRating;
  substance_score: number;
  headline: string;
  total_education_records: number;
  total_risk_assessment_records: number;
  total_early_intervention_records: number;
  total_referral_records: number;
  total_harm_reduction_records: number;
  education_coverage_rate: number;
  // fab-0: null when no records.
  risk_assessment_rate: number | null;
  // fab-0: null when no records.
  intervention_effectiveness_rate: number | null;
  // fab-0: null when no records.
  referral_compliance_rate: number | null;
  // fab-0: null when no records.
  harm_reduction_rate: number | null;
  child_awareness_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: SubstanceMisuseRecommendation[];
  insights: SubstanceMisuseInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SubstanceMisuseRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: SubstanceMisuseRating,
  score: number,
  headline: string,
): SubstanceMisuseResult {
  return {
    substance_rating: rating,
    substance_score: score,
    headline,
    total_education_records: 0,
    total_risk_assessment_records: 0,
    total_early_intervention_records: 0,
    total_referral_records: 0,
    total_harm_reduction_records: 0,
    education_coverage_rate: 0,
    risk_assessment_rate: null,
    intervention_effectiveness_rate: null,
    referral_compliance_rate: null,
    harm_reduction_rate: null,
    child_awareness_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeSubstanceMisusePrevention(
  input: SubstanceMisuseInput,
): SubstanceMisuseResult {
  const {
    total_children,
    substance_education_records,
    risk_assessment_records,
    early_intervention_records,
    referral_records,
    harm_reduction_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    substance_education_records.length === 0 &&
    risk_assessment_records.length === 0 &&
    early_intervention_records.length === 0 &&
    referral_records.length === 0 &&
    harm_reduction_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess substance misuse prevention.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No substance misuse prevention data recorded despite children on placement — substance awareness education, risk assessments, and harm reduction strategies require urgent attention.",
      ),
      concerns: [
        "No substance education records, risk assessments, early intervention programmes, referral records, or harm reduction strategies exist despite children being on placement — the home cannot evidence substance misuse prevention or safeguarding children from substance-related harm.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of substance awareness education, risk assessments, early intervention programmes, referral tracking, and harm reduction strategies to evidence the home's commitment to substance misuse prevention and children's safety.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
        },
        {
          rank: 2,
          recommendation:
            "Develop an age-appropriate substance awareness education programme for all children that covers alcohol, drugs, solvents, vaping, and prescription misuse as part of the home's safeguarding and health responsibilities.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
      ],
      insights: [
        {
          text: "The complete absence of substance misuse prevention records means the home cannot demonstrate it is safeguarding children from substance-related harm, providing health education, or meeting its duty of care. This represents a critical gap in safeguarding and health provision under Regulations 5, 14, and 34.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Substance education metrics ---
  const totalEducationRecords = substance_education_records.length;
  const attendedEducation = substance_education_records.filter((e) => e.attended).length;
  const educationAttendanceRate = pct(attendedEducation, totalEducationRecords);

  const engagedEducation = substance_education_records.filter((e) => e.attended && e.engaged).length;
  const educationEngagementRate = pct(engagedEducation, totalEducationRecords);

  const understandingDemonstrated = substance_education_records.filter(
    (e) => e.attended && e.understanding_demonstrated,
  ).length;
  const understandingRate = pct(understandingDemonstrated, totalEducationRecords);

  const ageAppropriate = substance_education_records.filter((e) => e.age_appropriate).length;
  const ageAppropriateRate = pct(ageAppropriate, totalEducationRecords);

  const positiveFeedbackEducation = substance_education_records.filter(
    (e) => e.attended && e.child_feedback_positive,
  ).length;
  const positiveFeedbackRate = pct(positiveFeedbackEducation, totalEducationRecords);

  const linkedToRiskAssessment = substance_education_records.filter(
    (e) => e.linked_to_risk_assessment,
  ).length;
  const linkedToRiskAssessmentRate = pct(linkedToRiskAssessment, totalEducationRecords);

  const followUpPlanned = substance_education_records.filter((e) => e.follow_up_planned).length;
  const followUpCompleted = substance_education_records.filter(
    (e) => e.follow_up_planned && e.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpPlanned);

  const uniqueChildrenInEducation = new Set(
    substance_education_records.filter((e) => e.attended).map((e) => e.child_id),
  ).size;
  const educationCoverageRate = total_children > 0 ? pct(uniqueChildrenInEducation, total_children) : 0;

  // Distinct topics covered
  const topicsCovered = new Set(substance_education_records.map((e) => e.topic)).size;

  // --- Risk assessment metrics ---
  const totalRiskAssessmentRecords = risk_assessment_records.length;
  const completedAssessments = risk_assessment_records.filter((r) => r.completed).length;
  const riskAssessmentCompletionRate = pct(completedAssessments, totalRiskAssessmentRecords);

  const actionPlanCreated = risk_assessment_records.filter(
    (r) => r.completed && r.action_plan_created,
  ).length;
  const actionPlanRate = pct(actionPlanCreated, completedAssessments);

  const actionPlanReviewed = risk_assessment_records.filter(
    (r) => r.action_plan_created && r.action_plan_reviewed,
  ).length;
  const actionPlanReviewRate = pct(actionPlanReviewed, actionPlanCreated);

  const reviewOverdue = risk_assessment_records.filter((r) => r.review_overdue).length;
  const reviewOverdueRate = pct(reviewOverdue, totalRiskAssessmentRecords);

  const sharedWithSocialWorker = risk_assessment_records.filter(
    (r) => r.completed && r.shared_with_social_worker,
  ).length;
  const socialWorkerSharingRate = pct(sharedWithSocialWorker, completedAssessments);

  const sharedWithHealth = risk_assessment_records.filter(
    (r) => r.completed && r.shared_with_health,
  ).length;
  const healthSharingRate = pct(sharedWithHealth, completedAssessments);

  const childInvolvedInAssessment = risk_assessment_records.filter(
    (r) => r.completed && r.child_involved_in_assessment,
  ).length;
  const childInvolvementRate = pct(childInvolvedInAssessment, completedAssessments);

  const uniqueChildrenAssessed = new Set(
    risk_assessment_records.filter((r) => r.completed).map((r) => r.child_id),
  ).size;
  const riskAssessmentCoverageRate = total_children > 0 ? pct(uniqueChildrenAssessed, total_children) : 0;

  const highRiskCount = risk_assessment_records.filter(
    (r) => r.risk_level === "high" || r.risk_level === "very_high",
  ).length;
  const highRiskRate = pct(highRiskCount, totalRiskAssessmentRecords);

  // Composite risk assessment rate: average of completion rate and coverage
  // fab-0: null when no risk assessment records.
  const riskAssessmentRate: number | null =
    totalRiskAssessmentRecords > 0
      ? Math.round((riskAssessmentCompletionRate + riskAssessmentCoverageRate) / 2)
      : null;

  // --- Early intervention metrics ---
  const totalInterventionRecords = early_intervention_records.length;
  const completedInterventions = early_intervention_records.filter(
    (i) => i.status === "completed",
  ).length;
  const interventionCompletionRate = pct(completedInterventions, totalInterventionRecords);

  const engagedInterventions = early_intervention_records.filter((i) => i.child_engaged).length;
  const interventionEngagementRate = pct(engagedInterventions, totalInterventionRecords);

  const positiveOutcomes = early_intervention_records.filter(
    (i) => (i.status === "completed" || i.status === "in_progress") && i.outcomes_positive,
  ).length;
  const positiveOutcomeCount = positiveOutcomes;

  const measurableImprovement = early_intervention_records.filter(
    (i) => i.measurable_improvement,
  ).length;
  const measurableImprovementRate = pct(measurableImprovement, totalInterventionRecords);

  const riskReduced = early_intervention_records.filter((i) => i.risk_level_reduced).length;
  const riskReductionRate = pct(riskReduced, totalInterventionRecords);

  const totalSessionsPlanned = early_intervention_records.reduce(
    (sum, i) => sum + i.sessions_planned,
    0,
  );
  const totalSessionsCompleted = early_intervention_records.reduce(
    (sum, i) => sum + i.sessions_completed,
    0,
  );
  const sessionCompletionRate = pct(totalSessionsCompleted, totalSessionsPlanned);

  const reviewedInterventions = early_intervention_records.filter((i) => i.reviewed).length;
  const interventionReviewRate = pct(reviewedInterventions, totalInterventionRecords);

  // Composite intervention effectiveness: engagement + measurable improvement + risk reduction
  // fab-0: null when no intervention records.
  const interventionEffectivenessRate: number | null =
    totalInterventionRecords > 0
      ? Math.round(
          (interventionEngagementRate + measurableImprovementRate + riskReductionRate) / 3,
        )
      : null;

  // --- Referral metrics ---
  const totalReferralRecords = referral_records.length;
  const referralsMadeWithinTarget = referral_records.filter(
    (r) => r.referral_made_within_target,
  ).length;
  const referralTimelinessRate = pct(referralsMadeWithinTarget, totalReferralRecords);

  const acceptedReferrals = referral_records.filter((r) => r.accepted).length;
  const referralAcceptanceRate = pct(acceptedReferrals, totalReferralRecords);

  const appointmentsAttended = referral_records.filter(
    (r) => r.appointment_date && r.appointment_attended,
  ).length;
  const appointmentsWithDates = referral_records.filter((r) => r.appointment_date).length;
  const appointmentAttendanceRate = pct(appointmentsAttended, appointmentsWithDates);

  const outcomesRecorded = referral_records.filter((r) => r.outcome_recorded).length;
  const outcomeRecordingRate = pct(outcomesRecorded, totalReferralRecords);

  const positiveReferralOutcomes = referral_records.filter(
    (r) => r.outcome_recorded && r.outcome_positive,
  ).length;
  const positiveReferralOutcomeRate = pct(positiveReferralOutcomes, outcomesRecorded);

  const followUpRequired = referral_records.filter((r) => r.follow_up_required).length;
  const followUpDone = referral_records.filter(
    (r) => r.follow_up_required && r.follow_up_completed,
  ).length;
  const referralFollowUpRate = pct(followUpDone, followUpRequired);

  const childConsented = referral_records.filter((r) => r.child_consented).length;
  const childConsentRate = pct(childConsented, totalReferralRecords);

  const socialWorkerInformed = referral_records.filter((r) => r.social_worker_informed).length;
  const socialWorkerInformedRate = pct(socialWorkerInformed, totalReferralRecords);

  const emergencyReferrals = referral_records.filter((r) => r.urgency === "emergency").length;
  const urgentReferrals = referral_records.filter((r) => r.urgency === "urgent").length;

  // Composite referral compliance: timeliness + outcome recording + follow-up
  // fab-0: null when no referrals.
  const referralComplianceRate: number | null =
    totalReferralRecords > 0
      ? Math.round(
          (referralTimelinessRate + outcomeRecordingRate + (followUpRequired > 0 ? referralFollowUpRate : 100)) / 3,
        )
      : null;

  // --- Harm reduction metrics ---
  const totalHarmReductionRecords = harm_reduction_records.length;
  const implementedHarmReduction = harm_reduction_records.filter((h) => h.implemented).length;
  const harmReductionImplementationRate = pct(implementedHarmReduction, totalHarmReductionRecords);

  const childEngagedHarmReduction = harm_reduction_records.filter(
    (h) => h.implemented && h.child_engaged,
  ).length;
  const harmReductionEngagementRate = pct(childEngagedHarmReduction, totalHarmReductionRecords);

  const childUnderstandsStrategy = harm_reduction_records.filter(
    (h) => h.implemented && h.child_understands_strategy,
  ).length;
  const strategyUnderstandingRate = pct(childUnderstandsStrategy, totalHarmReductionRecords);

  const riskReducedHarmReduction = harm_reduction_records.filter(
    (h) => h.implemented && h.risk_reduced,
  ).length;
  const harmReductionRiskReductionRate = pct(riskReducedHarmReduction, totalHarmReductionRecords);

  const documentedHarmReduction = harm_reduction_records.filter(
    (h) => h.implemented && h.documented,
  ).length;
  const harmReductionDocumentationRate = pct(documentedHarmReduction, totalHarmReductionRecords);

  const linkedToCarePlan = harm_reduction_records.filter(
    (h) => h.implemented && h.linked_to_care_plan,
  ).length;
  const carePlanLinkageRate = pct(linkedToCarePlan, totalHarmReductionRecords);

  const sharedWithTeam = harm_reduction_records.filter(
    (h) => h.implemented && h.shared_with_team,
  ).length;
  const teamSharingRate = pct(sharedWithTeam, totalHarmReductionRecords);

  const harmReductionReviewOverdue = harm_reduction_records.filter(
    (h) => h.review_overdue,
  ).length;
  const harmReductionOverdueRate = pct(harmReductionReviewOverdue, totalHarmReductionRecords);

  const effectivenessSum = harm_reduction_records
    .filter((h) => h.implemented)
    .reduce((sum, h) => sum + h.effectiveness_rating, 0);
  // fab-0: null when no implemented harm-reduction strategies.
  const avgEffectiveness: number | null =
    implementedHarmReduction > 0
      ? Math.round((effectivenessSum / implementedHarmReduction) * 100) / 100
      : null;

  const uniqueChildrenHarmReduction = new Set(
    harm_reduction_records.filter((h) => h.implemented).map((h) => h.child_id),
  ).size;

  // Composite harm reduction rate: implementation + engagement + documentation
  // fab-0: null when no harm-reduction records.
  const harmReductionRate: number | null =
    totalHarmReductionRecords > 0
      ? Math.round(
          (harmReductionImplementationRate + harmReductionEngagementRate + harmReductionDocumentationRate) / 3,
        )
      : null;

  // --- Child awareness composite ---
  // Composite across education understanding, risk assessment child involvement,
  // intervention engagement, consent in referrals, and harm reduction understanding
  const awarenessNumerators: number[] = [];
  const awarenessDenominators: number[] = [];

  if (totalEducationRecords > 0) {
    awarenessNumerators.push(understandingDemonstrated);
    awarenessDenominators.push(totalEducationRecords);
  }
  if (completedAssessments > 0) {
    awarenessNumerators.push(childInvolvedInAssessment);
    awarenessDenominators.push(completedAssessments);
  }
  if (totalInterventionRecords > 0) {
    awarenessNumerators.push(engagedInterventions);
    awarenessDenominators.push(totalInterventionRecords);
  }
  if (totalReferralRecords > 0) {
    awarenessNumerators.push(childConsented);
    awarenessDenominators.push(totalReferralRecords);
  }
  if (totalHarmReductionRecords > 0) {
    awarenessNumerators.push(childUnderstandsStrategy);
    awarenessDenominators.push(totalHarmReductionRecords);
  }

  const totalAwarenessNum = awarenessNumerators.reduce((a, b) => a + b, 0);
  const totalAwarenessDenom = awarenessDenominators.reduce((a, b) => a + b, 0);
  const childAwarenessRate = pct(totalAwarenessNum, totalAwarenessDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: educationCoverageRate (>=90: +4, >=70: +2) ---
  if (educationCoverageRate >= 90) score += 4;
  else if (educationCoverageRate >= 70) score += 2;

  // --- Bonus 2: riskAssessmentRate (>=90: +4, >=70: +2) ---
  if (meets(riskAssessmentRate, 90)) score += 4;
  else if (meets(riskAssessmentRate, 70)) score += 2;

  // --- Bonus 3: interventionEffectivenessRate (>=90: +3, >=70: +1) ---
  if (meets(interventionEffectivenessRate, 90)) score += 3;
  else if (meets(interventionEffectivenessRate, 70)) score += 1;

  // --- Bonus 4: referralComplianceRate (>=90: +3, >=70: +1) ---
  if (meets(referralComplianceRate, 90)) score += 3;
  else if (meets(referralComplianceRate, 70)) score += 1;

  // --- Bonus 5: harmReductionRate (>=90: +3, >=70: +1) ---
  if (meets(harmReductionRate, 90)) score += 3;
  else if (meets(harmReductionRate, 70)) score += 1;

  // --- Bonus 6: childAwarenessRate (>=90: +3, >=70: +1) ---
  if (childAwarenessRate >= 90) score += 3;
  else if (childAwarenessRate >= 70) score += 1;

  // --- Bonus 7: educationEngagementRate (>=90: +3, >=70: +1) ---
  if (educationEngagementRate >= 90) score += 3;
  else if (educationEngagementRate >= 70) score += 1;

  // --- Bonus 8: sessionCompletionRate (>=90: +3, >=70: +1) ---
  if (sessionCompletionRate >= 90) score += 3;
  else if (sessionCompletionRate >= 70) score += 1;

  // --- Bonus 9: avgEffectiveness (>=4.0: +2, >=3.0: +1) ---
  if (meets(avgEffectiveness, 4.0)) score += 2;
  else if (meets(avgEffectiveness, 3.0)) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // educationCoverageRate < 30 → -5 (guarded)
  if (educationCoverageRate < 30 && substance_education_records.length > 0) score -= 5;

  // riskAssessmentRate < 40 → -5 (guarded)
  if (below(riskAssessmentRate, 40) && risk_assessment_records.length > 0) score -= 5;

  // referralComplianceRate < 40 → -4 (guarded)
  if (below(referralComplianceRate, 40) && referral_records.length > 0) score -= 4;

  // harmReductionRate < 30 → -4 (guarded)
  if (below(harmReductionRate, 30) && harm_reduction_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const substance_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (educationCoverageRate >= 90 && total_children > 0) {
    strengths.push(
      `${educationCoverageRate}% of children have received substance awareness education — the home demonstrates comprehensive coverage ensuring all children are informed about substance misuse risks.`,
    );
  } else if (educationCoverageRate >= 70 && total_children > 0) {
    strengths.push(
      `${educationCoverageRate}% substance education coverage — good reach across children for substance awareness education.`,
    );
  }

  if (totalRiskAssessmentRecords > 0 && meets(riskAssessmentRate, 90)) {
    strengths.push(
      `${riskAssessmentRate}% risk assessment rate — the home maintains excellent substance risk assessment completion and coverage, enabling early identification of vulnerability.`,
    );
  } else if (totalRiskAssessmentRecords > 0 && meets(riskAssessmentRate, 70)) {
    strengths.push(
      `${riskAssessmentRate}% risk assessment rate — good completion and coverage of substance misuse risk assessments across children.`,
    );
  }

  if (totalInterventionRecords > 0 && meets(interventionEffectivenessRate, 90)) {
    strengths.push(
      `${interventionEffectivenessRate}% early intervention effectiveness — children are engaging with interventions that demonstrate measurable improvement and risk reduction.`,
    );
  } else if (totalInterventionRecords > 0 && meets(interventionEffectivenessRate, 70)) {
    strengths.push(
      `${interventionEffectivenessRate}% intervention effectiveness — early intervention programmes are achieving positive outcomes for children.`,
    );
  }

  if (totalReferralRecords > 0 && meets(referralComplianceRate, 90)) {
    strengths.push(
      `${referralComplianceRate}% referral compliance — referrals are timely, outcomes are recorded, and follow-up is consistently completed.`,
    );
  } else if (totalReferralRecords > 0 && meets(referralComplianceRate, 70)) {
    strengths.push(
      `${referralComplianceRate}% referral compliance — the home demonstrates good practice in making and tracking substance-related referrals.`,
    );
  }

  if (totalHarmReductionRecords > 0 && meets(harmReductionRate, 90)) {
    strengths.push(
      `${harmReductionRate}% harm reduction rate — harm reduction strategies are well-implemented, children are engaged, and documentation is thorough.`,
    );
  } else if (totalHarmReductionRecords > 0 && meets(harmReductionRate, 70)) {
    strengths.push(
      `${harmReductionRate}% harm reduction rate — the home applies and documents harm reduction strategies effectively.`,
    );
  }

  if (childAwarenessRate >= 90 && totalAwarenessDenom > 0) {
    strengths.push(
      `${childAwarenessRate}% child awareness rate across substance misuse prevention activities — children demonstrate strong understanding, engagement, and involvement in their own safety.`,
    );
  } else if (childAwarenessRate >= 70 && totalAwarenessDenom > 0) {
    strengths.push(
      `${childAwarenessRate}% child awareness — good levels of children's understanding and participation across substance misuse prevention.`,
    );
  }

  if (educationEngagementRate >= 90 && totalEducationRecords > 0) {
    strengths.push(
      `${educationEngagementRate}% engagement in substance education sessions — children are actively participating in and benefiting from substance awareness programmes.`,
    );
  } else if (educationEngagementRate >= 70 && totalEducationRecords > 0) {
    strengths.push(
      `${educationEngagementRate}% education engagement rate — good levels of children's active participation in substance awareness sessions.`,
    );
  }

  if (sessionCompletionRate >= 90 && totalSessionsPlanned > 0) {
    strengths.push(
      `${sessionCompletionRate}% of planned intervention sessions completed — the home follows through on early intervention programmes consistently.`,
    );
  } else if (sessionCompletionRate >= 70 && totalSessionsPlanned > 0) {
    strengths.push(
      `${sessionCompletionRate}% of planned intervention sessions completed — good adherence to planned early intervention programmes.`,
    );
  }

  if (implementedHarmReduction > 0 && meets(avgEffectiveness, 4.0)) {
    strengths.push(
      `Harm reduction strategies averaging ${avgEffectiveness}/5 effectiveness — implemented strategies are delivering meaningful risk reduction for children.`,
    );
  } else if (implementedHarmReduction > 0 && meets(avgEffectiveness, 3.0)) {
    strengths.push(
      `Harm reduction strategies averaging ${avgEffectiveness}/5 effectiveness — strategies are having a positive impact on children's safety.`,
    );
  }

  if (actionPlanRate >= 90 && completedAssessments > 0) {
    strengths.push(
      `${actionPlanRate}% of completed risk assessments have action plans — risk identification is consistently followed by structured support planning.`,
    );
  }

  if (socialWorkerSharingRate >= 90 && completedAssessments > 0) {
    strengths.push(
      `${socialWorkerSharingRate}% of assessments shared with social workers — excellent multi-agency communication supporting children's substance misuse prevention.`,
    );
  }

  if (carePlanLinkageRate >= 90 && totalHarmReductionRecords > 0) {
    strengths.push(
      `${carePlanLinkageRate}% of harm reduction strategies linked to care plans — substance misuse prevention is embedded within children's broader care planning.`,
    );
  }

  if (childInvolvementRate >= 90 && completedAssessments > 0) {
    strengths.push(
      `${childInvolvementRate}% of risk assessments involved the child — children's voice is central to understanding and addressing substance misuse risk.`,
    );
  }

  if (ageAppropriateRate >= 95 && totalEducationRecords > 0) {
    strengths.push(
      "Substance education is age-appropriate in virtually all sessions — the home ensures materials and delivery are tailored to each child's developmental stage.",
    );
  }

  if (referralTimelinessRate >= 95 && totalReferralRecords > 0) {
    strengths.push(
      `${referralTimelinessRate}% of referrals made within target timescales — the home responds promptly when children need specialist substance misuse support.`,
    );
  }

  if (topicsCovered >= 5 && totalEducationRecords > 0) {
    strengths.push(
      `Substance education covers ${topicsCovered} distinct topic areas — the home provides comprehensive awareness across the full range of substance misuse risks.`,
    );
  }

  if (riskReductionRate >= 90 && totalInterventionRecords > 0) {
    strengths.push(
      `${riskReductionRate}% of interventions resulted in reduced risk levels — early intervention is effectively lowering children's vulnerability to substance misuse.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (educationCoverageRate < 30 && total_children > 0 && totalEducationRecords > 0) {
    concerns.push(
      `Only ${educationCoverageRate}% of children have received substance awareness education — the majority of children have not been provided with age-appropriate information about substance misuse risks, representing a significant gap in safeguarding.`,
    );
  } else if (educationCoverageRate >= 30 && educationCoverageRate < 70 && total_children > 0) {
    concerns.push(
      `Substance education coverage at ${educationCoverageRate}% — not all children have received substance awareness education, leaving some without essential safety information.`,
    );
  }

  if (totalRiskAssessmentRecords > 0 && below(riskAssessmentRate, 40)) {
    concerns.push(
      `Risk assessment rate at only ${riskAssessmentRate}% — the home is not adequately completing or covering substance misuse risk assessments, meaning vulnerable children may not be identified early enough.`,
    );
  } else if (totalRiskAssessmentRecords > 0 && riskAssessmentRate !== null && riskAssessmentRate >= 40 && riskAssessmentRate < 70) {
    concerns.push(
      `Risk assessment rate at ${riskAssessmentRate}% — substance misuse risk assessments are not consistently completed or covering all children, limiting the home's ability to identify and respond to emerging risks.`,
    );
  }

  if (totalInterventionRecords > 0 && below(interventionEffectivenessRate, 40)) {
    concerns.push(
      `Early intervention effectiveness at only ${interventionEffectivenessRate}% — children are not engaging with or benefiting from early intervention programmes, suggesting approaches need fundamental review.`,
    );
  } else if (totalInterventionRecords > 0 && interventionEffectivenessRate !== null && interventionEffectivenessRate >= 40 && interventionEffectivenessRate < 70) {
    concerns.push(
      `Early intervention effectiveness at ${interventionEffectivenessRate}% — some interventions are not achieving measurable outcomes, and review of approaches is needed to improve impact.`,
    );
  }

  if (totalReferralRecords > 0 && below(referralComplianceRate, 40)) {
    concerns.push(
      `Referral compliance at only ${referralComplianceRate}% — referrals are not being made in time, outcomes are not recorded, or follow-up is not completed, meaning children may not be receiving the specialist support they need.`,
    );
  } else if (totalReferralRecords > 0 && referralComplianceRate !== null && referralComplianceRate >= 40 && referralComplianceRate < 70) {
    concerns.push(
      `Referral compliance at ${referralComplianceRate}% — inconsistencies in referral timeliness, outcome recording, or follow-up require improvement to ensure children access specialist services effectively.`,
    );
  }

  if (totalHarmReductionRecords > 0 && below(harmReductionRate, 30)) {
    concerns.push(
      `Harm reduction rate at only ${harmReductionRate}% — harm reduction strategies are poorly implemented, children are not engaged, or documentation is inadequate, leaving children at unnecessary risk.`,
    );
  } else if (totalHarmReductionRecords > 0 && harmReductionRate !== null && harmReductionRate >= 30 && harmReductionRate < 70) {
    concerns.push(
      `Harm reduction rate at ${harmReductionRate}% — implementation, engagement, or documentation of harm reduction strategies needs improvement to better protect children.`,
    );
  }

  if (childAwarenessRate < 30 && totalAwarenessDenom > 0) {
    concerns.push(
      `Child awareness at only ${childAwarenessRate}% — children are not demonstrating understanding, engagement, or involvement in substance misuse prevention activities, undermining the effectiveness of the home's approach.`,
    );
  } else if (childAwarenessRate >= 30 && childAwarenessRate < 70 && totalAwarenessDenom > 0) {
    concerns.push(
      `Child awareness at ${childAwarenessRate}% — not all children are demonstrating understanding or active involvement in substance misuse prevention.`,
    );
  }

  if (reviewOverdueRate >= 30 && totalRiskAssessmentRecords > 0) {
    concerns.push(
      `${reviewOverdueRate}% of risk assessments are overdue for review — overdue reviews mean risk levels may have changed without the home being aware, creating a safeguarding gap.`,
    );
  } else if (reviewOverdueRate >= 15 && reviewOverdueRate < 30 && totalRiskAssessmentRecords > 0) {
    concerns.push(
      `${reviewOverdueRate}% of risk assessments are overdue for review — some assessments need timely review to ensure risk levels remain current and actions are appropriate.`,
    );
  }

  if (harmReductionOverdueRate >= 30 && totalHarmReductionRecords > 0) {
    concerns.push(
      `${harmReductionOverdueRate}% of harm reduction strategies are overdue for review — strategies may no longer be effective or appropriate without timely review.`,
    );
  }

  if (educationEngagementRate < 40 && totalEducationRecords > 0) {
    concerns.push(
      `Only ${educationEngagementRate}% engagement in substance education — children are not actively participating in education sessions, suggesting the approach needs to be more engaging and relevant.`,
    );
  }

  if (sessionCompletionRate < 50 && totalSessionsPlanned > 0) {
    concerns.push(
      `Only ${sessionCompletionRate}% of planned intervention sessions completed — incomplete interventions mean children are not receiving the full programme of support.`,
    );
  }

  if (ageAppropriateRate < 70 && totalEducationRecords > 0) {
    concerns.push(
      `Only ${ageAppropriateRate}% of substance education sessions rated as age-appropriate — education that is not developmentally suitable may be ineffective or inappropriate for some children.`,
    );
  }

  if (highRiskRate >= 40 && totalRiskAssessmentRecords > 0) {
    concerns.push(
      `${highRiskRate}% of assessments indicate high or very high risk — a significant proportion of children are assessed as highly vulnerable to substance misuse, requiring intensive support and monitoring.`,
    );
  }

  if (totalEducationRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No substance awareness education records despite children being on placement — all children should receive age-appropriate substance misuse prevention education as part of their health and safeguarding support.",
    );
  }

  if (totalRiskAssessmentRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No substance misuse risk assessments recorded — without systematic risk assessment, the home cannot identify children who may be vulnerable to substance misuse or target interventions appropriately.",
    );
  }

  if (teamSharingRate < 50 && totalHarmReductionRecords > 0) {
    concerns.push(
      `Only ${teamSharingRate}% of harm reduction strategies shared with the team — staff may not be aware of children's harm reduction plans, undermining consistent and safe practice.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: SubstanceMisuseRecommendation[] = [];
  let rank = 0;

  if (educationCoverageRate < 30 && total_children > 0 && totalEducationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently extend substance awareness education to all children — develop an age-appropriate programme covering alcohol, drugs, solvents, vaping, and prescription misuse. Every child must receive education as part of the home's safeguarding responsibility.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (totalRiskAssessmentRecords > 0 && below(riskAssessmentRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a systematic substance misuse risk assessment process — ensure every child receives an initial assessment on admission, with routine reviews and triggered reassessments following any concerns or incidents.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (totalReferralRecords > 0 && below(referralComplianceRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve the substance misuse referral pathway — referrals must be made within target timescales, outcomes must be recorded, and follow-up completed. Assign a designated staff member to track referral progress.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalHarmReductionRecords > 0 && below(harmReductionRate, 30)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen harm reduction strategy implementation — ensure strategies are properly implemented, children understand and engage with them, and they are documented and linked to care plans. Review current strategies for effectiveness.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (childAwarenessRate < 30 && totalAwarenessDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's understanding and involvement in substance misuse prevention — use child-centred approaches, ensure education is interactive and relevant, involve children in their own risk assessments, and explain harm reduction strategies in accessible language.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child / Safety",
    });
  }

  if (totalEducationRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a substance awareness education programme immediately — all children should receive age-appropriate education about substance misuse risks, harm reduction, and how to seek help as part of the home's health and safeguarding provision.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalRiskAssessmentRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce a substance misuse risk assessment framework — without assessments, the home cannot identify vulnerability, plan interventions, or evidence its safeguarding approach to substance misuse prevention.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (reviewOverdueRate >= 30 && totalRiskAssessmentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address overdue risk assessment reviews as a priority — implement a review tracking system with alerts and assign responsibility for ensuring all assessments are reviewed within the required timescales.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (totalInterventionRecords > 0 && below(interventionEffectivenessRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and redesign early intervention programmes — current approaches are not achieving engagement, measurable improvement, or risk reduction. Consider specialist training for staff, external provision, or different therapeutic modalities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (educationEngagementRate < 40 && totalEducationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Redesign substance education delivery to improve engagement — use interactive methods, peer-led approaches, real-world scenarios, and link sessions to children's interests and lived experiences.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (sessionCompletionRate < 50 && totalSessionsPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve completion rates for planned intervention sessions — identify barriers to attendance and engagement, adjust scheduling, and ensure children understand the purpose and value of the intervention.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (teamSharingRate < 50 && totalHarmReductionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all harm reduction strategies are shared with the team — staff must be aware of each child's harm reduction plan to provide consistent, safe support. Incorporate into handover processes and supervision.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (harmReductionOverdueRate >= 30 && totalHarmReductionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address overdue harm reduction strategy reviews — implement a review calendar with automated reminders to ensure strategies remain current, effective, and appropriate to each child's changing needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (ageAppropriateRate < 70 && totalEducationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review substance education materials for age-appropriateness — ensure all content is developmentally suitable, using different approaches for younger children and adolescents. Seek guidance from health professionals where needed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    educationCoverageRate >= 30 &&
    educationCoverageRate < 70 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend substance education coverage to reach all children — identify children who have not yet participated and create accessible, engaging opportunities tailored to their age, understanding, and individual risk profile.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (
    totalRiskAssessmentRecords > 0 &&
    riskAssessmentRate !== null &&
    riskAssessmentRate >= 40 &&
    riskAssessmentRate < 70
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve risk assessment completion and coverage — ensure all children have a current substance misuse risk assessment and that reviews are completed on schedule.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    totalReferralRecords > 0 &&
    referralComplianceRate !== null &&
    referralComplianceRate >= 40 &&
    referralComplianceRate < 70
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve referral tracking and follow-up — ensure all referral outcomes are recorded, follow-up is completed, and children are supported throughout the referral process.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    totalInterventionRecords > 0 &&
    interventionEffectivenessRate !== null &&
    interventionEffectivenessRate >= 40 &&
    interventionEffectivenessRate < 70
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen early intervention impact — review the range of interventions offered, consider specialist input, and ensure all interventions are reviewed for effectiveness with measurable outcome indicators.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    totalHarmReductionRecords > 0 &&
    harmReductionRate !== null &&
    harmReductionRate >= 30 &&
    harmReductionRate < 70
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve harm reduction strategy quality — focus on ensuring children understand and engage with their strategies, that documentation is complete, and that strategies are linked to care plans and shared with the team.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  if (
    childAwarenessRate >= 30 &&
    childAwarenessRate < 70 &&
    totalAwarenessDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's participation in substance misuse prevention — ensure education sessions check for understanding, involve children in their own risk assessments, and explain harm reduction strategies clearly.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child / Health",
    });
  }

  if (carePlanLinkageRate < 70 && totalHarmReductionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Link all harm reduction strategies to children's care plans — substance misuse prevention must be embedded within the broader care planning framework to ensure consistency and continuity of approach.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    socialWorkerSharingRate < 70 &&
    completedAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve multi-agency communication — ensure substance misuse risk assessments are routinely shared with social workers and health professionals to support coordinated safeguarding and health provision.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: SubstanceMisuseInsight[] = [];

  // -- Critical insights --

  if (educationCoverageRate < 30 && total_children > 0 && totalEducationRecords > 0) {
    insights.push({
      text: `Only ${educationCoverageRate}% of children have received substance awareness education. Without preventive education, children lack the knowledge and skills to recognise and resist substance misuse pressures. Under Reg 14 (health care) and Reg 34 (safeguarding), the home has a duty to equip children with this essential awareness.`,
      severity: "critical",
    });
  }

  if (totalRiskAssessmentRecords > 0 && below(riskAssessmentRate, 40)) {
    insights.push({
      text: `Substance misuse risk assessment rate at only ${riskAssessmentRate}%. Incomplete or absent risk assessments mean the home cannot evidence that it knows which children are vulnerable, what their risk factors are, or what protective measures are in place. This is a fundamental safeguarding concern.`,
      severity: "critical",
    });
  }

  if (totalReferralRecords > 0 && below(referralComplianceRate, 40)) {
    insights.push({
      text: `Referral compliance at only ${referralComplianceRate}%. When children need specialist substance misuse support, the home is not consistently making timely referrals, recording outcomes, or following up. This means children may not be accessing the specialist help they need.`,
      severity: "critical",
    });
  }

  if (totalHarmReductionRecords > 0 && below(harmReductionRate, 30)) {
    insights.push({
      text: `Harm reduction rate at only ${harmReductionRate}%. Where children are known to be at risk, harm reduction strategies are not being effectively implemented, children are not engaged, or documentation is inadequate. This leaves vulnerable children without practical safety measures.`,
      severity: "critical",
    });
  }

  if (childAwarenessRate < 30 && totalAwarenessDenom > 0) {
    insights.push({
      text: `Child awareness at only ${childAwarenessRate}%. Children are not demonstrating understanding of substance misuse risks, not involved in their own risk assessments, and not engaged in prevention activities. The child's voice and participation are central to effective substance misuse prevention — without them, interventions are unlikely to succeed.`,
      severity: "critical",
    });
  }

  if (totalEducationRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No substance awareness education records exist despite children being on placement. Substance misuse prevention education is a core health and safeguarding responsibility. Without it, children are denied essential knowledge about risks, harm reduction, and how to seek help.",
      severity: "critical",
    });
  }

  if (totalRiskAssessmentRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No substance misuse risk assessments recorded. Without systematic risk assessment, the home has no evidence base for targeting prevention, early intervention, or safeguarding responses. Children's vulnerability to substance misuse cannot be properly understood or managed.",
      severity: "critical",
    });
  }

  if (highRiskRate >= 50 && totalRiskAssessmentRecords > 0) {
    insights.push({
      text: `${highRiskRate}% of assessments indicate high or very high risk. A majority of assessed children are significantly vulnerable to substance misuse, requiring intensive, specialist-informed prevention, robust harm reduction, and close multi-agency working to safeguard them effectively.`,
      severity: "critical",
    });
  }

  if (reviewOverdueRate >= 40 && totalRiskAssessmentRecords > 0) {
    insights.push({
      text: `${reviewOverdueRate}% of risk assessments are overdue for review. Children's circumstances and risk levels can change rapidly — overdue reviews create gaps in the home's understanding of current risk and may result in outdated or inappropriate support plans.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    educationCoverageRate >= 30 &&
    educationCoverageRate < 70 &&
    total_children > 0
  ) {
    insights.push({
      text: `Substance education coverage at ${educationCoverageRate}% — improving but a significant number of children have not yet received substance awareness education. All children, regardless of perceived risk, benefit from preventive education.`,
      severity: "warning",
    });
  }

  if (
    totalRiskAssessmentRecords > 0 &&
    riskAssessmentRate !== null &&
    riskAssessmentRate >= 40 &&
    riskAssessmentRate < 70
  ) {
    insights.push({
      text: `Risk assessment rate at ${riskAssessmentRate}% — while some assessments are in place, inconsistent completion or coverage means the home's picture of substance misuse vulnerability is incomplete. Strengthening this area would improve targeted support.`,
      severity: "warning",
    });
  }

  if (
    totalInterventionRecords > 0 &&
    interventionEffectivenessRate !== null &&
    interventionEffectivenessRate >= 40 &&
    interventionEffectivenessRate < 70
  ) {
    insights.push({
      text: `Early intervention effectiveness at ${interventionEffectivenessRate}% — some programmes are working but overall impact is inconsistent. Reviewing the types of interventions offered, staff training, and child engagement approaches may improve outcomes.`,
      severity: "warning",
    });
  }

  if (
    totalReferralRecords > 0 &&
    referralComplianceRate !== null &&
    referralComplianceRate >= 40 &&
    referralComplianceRate < 70
  ) {
    insights.push({
      text: `Referral compliance at ${referralComplianceRate}% — the home is making referrals but inconsistencies in timeliness, outcome recording, or follow-up mean some children may fall through gaps in the referral pathway.`,
      severity: "warning",
    });
  }

  if (
    totalHarmReductionRecords > 0 &&
    harmReductionRate !== null &&
    harmReductionRate >= 30 &&
    harmReductionRate < 70
  ) {
    insights.push({
      text: `Harm reduction rate at ${harmReductionRate}% — strategies are in place but implementation, engagement, or documentation needs strengthening to ensure all children with identified risks have effective, well-understood safety measures.`,
      severity: "warning",
    });
  }

  if (
    childAwarenessRate >= 30 &&
    childAwarenessRate < 70 &&
    totalAwarenessDenom > 0
  ) {
    insights.push({
      text: `Child awareness at ${childAwarenessRate}% — some children demonstrate understanding but many are not yet engaged in their own substance misuse prevention. The home should consider how to make education, assessments, and harm reduction more child-centred and participatory.`,
      severity: "warning",
    });
  }

  if (
    reviewOverdueRate >= 15 &&
    reviewOverdueRate < 40 &&
    totalRiskAssessmentRecords > 0
  ) {
    insights.push({
      text: `${reviewOverdueRate}% of risk assessments are overdue for review — while not yet critical, timely reviews are essential to maintain an accurate and current understanding of each child's substance misuse risk profile.`,
      severity: "warning",
    });
  }

  if (
    educationEngagementRate >= 40 &&
    educationEngagementRate < 70 &&
    totalEducationRecords > 0
  ) {
    insights.push({
      text: `Substance education engagement at ${educationEngagementRate}% — not all children are actively participating in sessions. Consider whether the format, content, and delivery method are engaging and relevant to children's experiences and interests.`,
      severity: "warning",
    });
  }

  if (
    sessionCompletionRate >= 50 &&
    sessionCompletionRate < 70 &&
    totalSessionsPlanned > 0
  ) {
    insights.push({
      text: `Intervention session completion at ${sessionCompletionRate}% — some planned sessions are not being delivered. Incomplete programmes may limit the effectiveness of early intervention and leave children without the full benefit of planned support.`,
      severity: "warning",
    });
  }

  if (
    implementedHarmReduction > 0 &&
    avgEffectiveness !== null &&
    avgEffectiveness >= 2.0 &&
    avgEffectiveness < 3.0
  ) {
    insights.push({
      text: `Harm reduction effectiveness averaging ${avgEffectiveness}/5 — strategies are in place but not yet delivering strong outcomes. Review underperforming strategies and consider whether different approaches or specialist input would be more effective.`,
      severity: "warning",
    });
  }

  if (
    harmReductionOverdueRate >= 15 &&
    harmReductionOverdueRate < 30 &&
    totalHarmReductionRecords > 0
  ) {
    insights.push({
      text: `${harmReductionOverdueRate}% of harm reduction strategies are overdue for review — while not yet critical, timely reviews ensure strategies remain relevant and effective as children's circumstances change.`,
      severity: "warning",
    });
  }

  // Identify concentration in referral types
  const referralTypeCounts: Record<string, number> = {};
  for (const r of referral_records) {
    referralTypeCounts[r.referral_to] = (referralTypeCounts[r.referral_to] ?? 0) + 1;
  }
  const topReferralTypes = Object.entries(referralTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  if (topReferralTypes.length > 0 && totalReferralRecords >= 5) {
    const topTypeCount = topReferralTypes[0][1];
    const topTypeRate = pct(topTypeCount, totalReferralRecords);
    if (topTypeRate >= 70) {
      insights.push({
        text: `${topTypeRate}% of referrals are to ${topReferralTypes[0][0].replace(/_/g, " ")} — while this may reflect appropriate referral practice, consider whether children could benefit from a wider range of specialist services.`,
        severity: "warning",
      });
    }
  }

  // Identify intervention trigger patterns
  const triggerCounts: Record<string, number> = {};
  for (const i of early_intervention_records) {
    triggerCounts[i.trigger] = (triggerCounts[i.trigger] ?? 0) + 1;
  }
  const incidentTriggers = triggerCounts["incident"] ?? 0;
  if (totalInterventionRecords >= 3 && pct(incidentTriggers, totalInterventionRecords) >= 60) {
    insights.push({
      text: `${pct(incidentTriggers, totalInterventionRecords)}% of early interventions are triggered by incidents rather than proactive identification — the home should strengthen routine monitoring and risk assessment to identify vulnerability before incidents occur.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (substance_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding substance misuse prevention — education coverage is comprehensive, risk assessments are thorough, early interventions are effective, referrals are well-managed, and harm reduction strategies are embedded. This proactive approach significantly safeguards children from substance-related harm.",
      severity: "positive",
    });
  }

  if (
    educationCoverageRate >= 90 &&
    educationEngagementRate >= 90 &&
    total_children > 0 &&
    totalEducationRecords > 0
  ) {
    insights.push({
      text: `${educationCoverageRate}% education coverage with ${educationEngagementRate}% engagement — substance awareness education reaches virtually all children and they are actively participating. This comprehensive, engaging approach gives children the knowledge and skills to make informed choices about substance misuse.`,
      severity: "positive",
    });
  }

  if (
    totalRiskAssessmentRecords > 0 &&
    completedAssessments > 0 &&
    meets(riskAssessmentRate, 90) &&
    actionPlanRate >= 90
  ) {
    insights.push({
      text: `${riskAssessmentRate}% risk assessment rate with ${actionPlanRate}% action plan creation — risk identification is systematic and consistently followed by structured support planning. The home can evidence a robust approach to identifying and responding to substance misuse vulnerability.`,
      severity: "positive",
    });
  }

  if (
    totalInterventionRecords > 0 &&
    meets(interventionEffectivenessRate, 90) &&
    riskReductionRate >= 90
  ) {
    insights.push({
      text: `${interventionEffectivenessRate}% intervention effectiveness with ${riskReductionRate}% risk reduction — early interventions are genuinely effective, with children engaging, improving, and having their risk levels reduced. This demonstrates excellent practice in responding early to substance misuse concerns.`,
      severity: "positive",
    });
  }

  if (
    totalReferralRecords > 0 &&
    meets(referralComplianceRate, 90)
  ) {
    insights.push({
      text: `${referralComplianceRate}% referral compliance — the home demonstrates outstanding practice in managing substance-related referrals, ensuring children access specialist support promptly and that outcomes are tracked and followed up.`,
      severity: "positive",
    });
  }

  if (
    totalHarmReductionRecords > 0 &&
    meets(harmReductionRate, 90) &&
    meets(avgEffectiveness, 4.0)
  ) {
    insights.push({
      text: `${harmReductionRate}% harm reduction rate with effectiveness averaging ${avgEffectiveness}/5 — harm reduction strategies are well-implemented, children understand and engage with them, and they are delivering meaningful safety outcomes.`,
      severity: "positive",
    });
  }

  if (
    childAwarenessRate >= 90 &&
    totalAwarenessDenom > 0
  ) {
    insights.push({
      text: `${childAwarenessRate}% child awareness across all substance misuse prevention activities — children are demonstrating understanding, participating in their own safety, and engaging actively with prevention efforts. Their voice is genuinely central to the home's approach.`,
      severity: "positive",
    });
  }

  if (
    childInvolvementRate >= 90 &&
    completedAssessments > 0
  ) {
    insights.push({
      text: `${childInvolvementRate}% of risk assessments involve the child — the home places children's voice and participation at the heart of substance misuse risk assessment, ensuring assessments reflect children's own understanding and experiences.`,
      severity: "positive",
    });
  }

  if (
    socialWorkerSharingRate >= 90 &&
    healthSharingRate >= 90 &&
    completedAssessments > 0
  ) {
    insights.push({
      text: `Risk assessments shared with social workers (${socialWorkerSharingRate}%) and health professionals (${healthSharingRate}%) — the home demonstrates excellent multi-agency information sharing, supporting coordinated safeguarding and health responses to substance misuse risk.`,
      severity: "positive",
    });
  }

  if (
    carePlanLinkageRate >= 90 &&
    totalHarmReductionRecords > 0
  ) {
    insights.push({
      text: `${carePlanLinkageRate}% of harm reduction strategies linked to care plans — substance misuse prevention is genuinely embedded within children's broader care planning, ensuring a consistent, holistic approach to their safety and wellbeing.`,
      severity: "positive",
    });
  }

  if (
    topicsCovered >= 5 &&
    ageAppropriateRate >= 90 &&
    totalEducationRecords > 0
  ) {
    insights.push({
      text: `Substance education covers ${topicsCovered} distinct topic areas with ${ageAppropriateRate}% age-appropriateness — the home provides comprehensive, developmentally suitable awareness education across the full spectrum of substance misuse risks.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (substance_rating === "outstanding") {
    headline =
      "Outstanding substance misuse prevention — education coverage is comprehensive, risk assessments are thorough, early interventions are effective, and harm reduction strategies are well-embedded.";
  } else if (substance_rating === "good") {
    headline = `Good substance misuse prevention — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (substance_rating === "adequate") {
    headline = `Adequate substance misuse prevention — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure effective prevention, early intervention, and harm reduction.`;
  } else {
    headline = `Substance misuse prevention is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve education coverage, risk assessment, intervention effectiveness, and harm reduction.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    substance_rating,
    substance_score: score,
    headline,
    total_education_records: totalEducationRecords,
    total_risk_assessment_records: totalRiskAssessmentRecords,
    total_early_intervention_records: totalInterventionRecords,
    total_referral_records: totalReferralRecords,
    total_harm_reduction_records: totalHarmReductionRecords,
    education_coverage_rate: educationCoverageRate,
    risk_assessment_rate: riskAssessmentRate,
    intervention_effectiveness_rate: interventionEffectivenessRate,
    referral_compliance_rate: referralComplianceRate,
    harm_reduction_rate: harmReductionRate,
    child_awareness_rate: childAwarenessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
