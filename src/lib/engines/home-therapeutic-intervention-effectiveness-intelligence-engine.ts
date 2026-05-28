// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME THERAPEUTIC INTERVENTION EFFECTIVENESS INTELLIGENCE ENGINE
// Evaluates the effectiveness of therapeutic interventions for children in care:
// therapy session attendance, intervention outcome tracking, therapeutic progress
// assessments, treatment plan adherence, and therapeutic relationship quality.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 12 (Health and well-being), Reg 7 (Child's plan).
// SCCIF: "Health and well-being" — children receive therapeutic support
// that is responsive to their assessed emotional and psychological needs.
// Store keys: therapySessionRecords, interventionOutcomeRecords,
//             therapeuticProgressRecords, treatmentPlanRecords,
//             therapeuticRelationshipRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TherapySessionInput {
  id: string;
  child_id: string;
  session_date: string;
  therapist_name: string;
  therapy_type: "cbt" | "play_therapy" | "art_therapy" | "emdr" | "family_therapy" | "psychotherapy" | "group_therapy" | "other";
  scheduled: boolean;
  attended: boolean;
  cancellation_reason: string | null;
  cancelled_by: "child" | "therapist" | "home" | null;
  session_duration_minutes: number;
  session_quality_rating: number; // 1-5
  child_engagement_rating: number; // 1-5
  goals_addressed: number;
  goals_total: number;
  follow_up_actions_identified: number;
  follow_up_actions_completed: number;
  notes_completed: boolean;
  created_at: string;
}

export interface InterventionOutcomeInput {
  id: string;
  child_id: string;
  intervention_name: string;
  intervention_type: "therapeutic" | "behavioural" | "educational" | "social" | "sensory" | "trauma_informed";
  start_date: string;
  end_date: string | null;
  active: boolean;
  baseline_score: number; // 0-100
  current_score: number; // 0-100
  target_score: number; // 0-100
  measurement_tool: string;
  positive_outcome: boolean;
  outcome_measured: boolean;
  review_date: string | null;
  review_completed: boolean;
  evidence_documented: boolean;
  created_at: string;
}

export interface TherapeuticProgressInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessment_type: "sdq" | "rcads" | "core_om" | "clinical_review" | "progress_review" | "other";
  assessor_name: string;
  domains_assessed: number;
  domains_improving: number;
  domains_stable: number;
  domains_declining: number;
  overall_progress: "significant_improvement" | "improvement" | "stable" | "decline" | "significant_decline";
  risk_level: "low" | "medium" | "high" | "critical";
  next_review_date: string | null;
  recommendations_made: number;
  recommendations_actioned: number;
  child_involved_in_assessment: boolean;
  created_at: string;
}

export interface TreatmentPlanInput {
  id: string;
  child_id: string;
  plan_name: string;
  plan_type: "individual" | "group" | "crisis" | "maintenance" | "transition";
  created_date: string;
  review_date: string | null;
  active: boolean;
  total_goals: number;
  goals_on_track: number;
  goals_achieved: number;
  goals_behind: number;
  goals_not_started: number;
  interventions_planned: number;
  interventions_delivered: number;
  child_involved_in_planning: boolean;
  carer_involved_in_planning: boolean;
  multi_agency_input: boolean;
  last_reviewed_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface TherapeuticRelationshipInput {
  id: string;
  child_id: string;
  therapist_name: string;
  relationship_start_date: string;
  active: boolean;
  trust_rating: number; // 1-5
  rapport_rating: number; // 1-5
  communication_rating: number; // 1-5
  consistency_rating: number; // 1-5
  child_feedback_positive: boolean;
  child_feels_heard: boolean;
  child_feels_safe: boolean;
  therapeutic_alliance_score: number; // 0-100
  continuity_maintained: boolean;
  therapist_changes: number;
  assessment_date: string;
  created_at: string;
}

export interface TherapeuticInterventionEffectivenessInput {
  today: string;
  total_children: number;
  therapy_sessions: TherapySessionInput[];
  intervention_outcomes: InterventionOutcomeInput[];
  therapeutic_progress_records: TherapeuticProgressInput[];
  treatment_plans: TreatmentPlanInput[];
  therapeutic_relationship_records: TherapeuticRelationshipInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TherapeuticRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TherapeuticInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface TherapeuticRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface TherapeuticInterventionEffectivenessResult {
  therapeutic_rating: TherapeuticRating;
  therapeutic_score: number;
  headline: string;
  total_sessions: number;
  total_interventions: number;
  total_progress_assessments: number;
  total_treatment_plans: number;
  total_relationships: number;
  therapy_attendance_rate: number;
  intervention_effectiveness_rate: number;
  progress_assessment_coverage_rate: number;
  treatment_adherence_rate: number;
  therapeutic_relationship_quality_rate: number;
  child_engagement_rate: number;
  session_quality_avg: number;
  goals_achievement_rate: number;
  follow_up_completion_rate: number;
  progress_improvement_rate: number;
  plan_review_compliance_rate: number;
  therapeutic_alliance_avg: number;
  therapist_continuity_rate: number;
  child_involvement_rate: number;
  evidence_documentation_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: TherapeuticRecommendation[];
  insights: TherapeuticInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): TherapeuticRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: TherapeuticRating,
  score: number,
  headline: string,
): TherapeuticInterventionEffectivenessResult {
  return {
    therapeutic_rating: rating,
    therapeutic_score: score,
    headline,
    total_sessions: 0,
    total_interventions: 0,
    total_progress_assessments: 0,
    total_treatment_plans: 0,
    total_relationships: 0,
    therapy_attendance_rate: 0,
    intervention_effectiveness_rate: 0,
    progress_assessment_coverage_rate: 0,
    treatment_adherence_rate: 0,
    therapeutic_relationship_quality_rate: 0,
    child_engagement_rate: 0,
    session_quality_avg: 0,
    goals_achievement_rate: 0,
    follow_up_completion_rate: 0,
    progress_improvement_rate: 0,
    plan_review_compliance_rate: 0,
    therapeutic_alliance_avg: 0,
    therapist_continuity_rate: 0,
    child_involvement_rate: 0,
    evidence_documentation_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeTherapeuticInterventionEffectiveness(
  input: TherapeuticInterventionEffectivenessInput,
): TherapeuticInterventionEffectivenessResult {
  const {
    total_children,
    therapy_sessions,
    intervention_outcomes,
    therapeutic_progress_records,
    treatment_plans,
    therapeutic_relationship_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    therapy_sessions.length === 0 &&
    intervention_outcomes.length === 0 &&
    therapeutic_progress_records.length === 0 &&
    treatment_plans.length === 0 &&
    therapeutic_relationship_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess therapeutic intervention effectiveness.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No therapeutic intervention data recorded despite children on placement — therapeutic support and intervention tracking require urgent attention.",
      ),
      concerns: [
        "No therapy sessions, intervention outcomes, progress assessments, treatment plans, or therapeutic relationship records exist despite children being on placement — the home cannot evidence that therapeutic needs are being assessed, met, or monitored.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of therapy sessions, intervention outcomes, progress assessments, and treatment plans to evidence that children's therapeutic needs are being identified and addressed in line with their care plans.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child with identified therapeutic needs has a documented treatment plan with measurable goals, regular reviews, and evidence of therapeutic relationship quality monitoring.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
        },
      ],
      insights: [
        {
          text: "The complete absence of therapeutic intervention records means Ofsted cannot verify that children's emotional and psychological needs are being met through appropriate therapeutic support. This represents a fundamental gap in Reg 12 compliance and the home's duty to promote children's health and well-being.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Therapy session metrics ---
  const totalSessions = therapy_sessions.length;
  const scheduledSessions = therapy_sessions.filter((s) => s.scheduled).length;
  const attendedSessions = therapy_sessions.filter((s) => s.attended).length;
  const therapyAttendanceRate = pct(attendedSessions, scheduledSessions);

  const sessionQualitySum = therapy_sessions.reduce(
    (sum, s) => sum + s.session_quality_rating,
    0,
  );
  const sessionQualityAvg =
    totalSessions > 0
      ? Math.round((sessionQualitySum / totalSessions) * 100) / 100
      : 0;

  const childEngagementSum = therapy_sessions.reduce(
    (sum, s) => sum + s.child_engagement_rating,
    0,
  );
  const childEngagementAvg =
    totalSessions > 0
      ? Math.round((childEngagementSum / totalSessions) * 100) / 100
      : 0;
  // Convert engagement avg (1-5) to a percentage for the card display
  const childEngagementRate = totalSessions > 0 ? Math.round(childEngagementAvg * 20) : 0;

  const totalGoalsAddressed = therapy_sessions.reduce(
    (sum, s) => sum + s.goals_addressed,
    0,
  );
  const totalGoalsInSessions = therapy_sessions.reduce(
    (sum, s) => sum + s.goals_total,
    0,
  );
  const goalsAchievementRate = pct(totalGoalsAddressed, totalGoalsInSessions);

  const totalFollowUpIdentified = therapy_sessions.reduce(
    (sum, s) => sum + s.follow_up_actions_identified,
    0,
  );
  const totalFollowUpCompleted = therapy_sessions.reduce(
    (sum, s) => sum + s.follow_up_actions_completed,
    0,
  );
  const followUpCompletionRate = pct(totalFollowUpCompleted, totalFollowUpIdentified);

  const sessionsWithNotesCompleted = therapy_sessions.filter((s) => s.notes_completed).length;
  const notesCompletionRate = pct(sessionsWithNotesCompleted, totalSessions);

  // --- Cancellation analysis ---
  const cancelledSessions = therapy_sessions.filter((s) => s.scheduled && !s.attended).length;
  const cancelledByChild = therapy_sessions.filter(
    (s) => s.scheduled && !s.attended && s.cancelled_by === "child",
  ).length;
  const cancelledByTherapist = therapy_sessions.filter(
    (s) => s.scheduled && !s.attended && s.cancelled_by === "therapist",
  ).length;
  const cancelledByHome = therapy_sessions.filter(
    (s) => s.scheduled && !s.attended && s.cancelled_by === "home",
  ).length;

  // --- Intervention outcome metrics ---
  const totalInterventions = intervention_outcomes.length;
  const activeInterventions = intervention_outcomes.filter((i) => i.active).length;
  const positiveOutcomes = intervention_outcomes.filter(
    (i) => i.outcome_measured && i.positive_outcome,
  ).length;
  const measuredOutcomes = intervention_outcomes.filter((i) => i.outcome_measured).length;
  const interventionEffectivenessRate = pct(positiveOutcomes, measuredOutcomes);

  const evidenceDocumented = intervention_outcomes.filter((i) => i.evidence_documented).length;
  const evidenceDocumentationRate = pct(evidenceDocumented, totalInterventions);

  const reviewsCompleted = intervention_outcomes.filter((i) => i.review_completed).length;
  const interventionReviewRate = pct(reviewsCompleted, totalInterventions);

  // --- Intervention improvement analysis ---
  const interventionsWithImprovement = intervention_outcomes.filter(
    (i) => i.current_score > i.baseline_score,
  ).length;
  const interventionsDeclined = intervention_outcomes.filter(
    (i) => i.current_score < i.baseline_score,
  ).length;
  const interventionsOnTarget = intervention_outcomes.filter(
    (i) => i.current_score >= i.target_score,
  ).length;

  // --- Therapeutic progress metrics ---
  const totalProgressAssessments = therapeutic_progress_records.length;

  const uniqueChildrenWithProgress = new Set(
    therapeutic_progress_records.map((p) => p.child_id),
  ).size;
  const progressAssessmentCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithProgress, total_children) : 0;

  const domainsAssessedTotal = therapeutic_progress_records.reduce(
    (sum, p) => sum + p.domains_assessed,
    0,
  );
  const domainsImprovingTotal = therapeutic_progress_records.reduce(
    (sum, p) => sum + p.domains_improving,
    0,
  );
  const domainsStableTotal = therapeutic_progress_records.reduce(
    (sum, p) => sum + p.domains_stable,
    0,
  );
  const domainsDecliningTotal = therapeutic_progress_records.reduce(
    (sum, p) => sum + p.domains_declining,
    0,
  );
  const progressImprovementRate = pct(domainsImprovingTotal, domainsAssessedTotal);

  const progressRecsActioned = therapeutic_progress_records.reduce(
    (sum, p) => sum + p.recommendations_actioned,
    0,
  );
  const progressRecsMade = therapeutic_progress_records.reduce(
    (sum, p) => sum + p.recommendations_made,
    0,
  );
  const progressRecsActionedRate = pct(progressRecsActioned, progressRecsMade);

  const childInvolvedInAssessment = therapeutic_progress_records.filter(
    (p) => p.child_involved_in_assessment,
  ).length;
  const childInvolvementInAssessmentRate = pct(childInvolvedInAssessment, totalProgressAssessments);

  // Overall progress distribution
  const significantImprovement = therapeutic_progress_records.filter(
    (p) => p.overall_progress === "significant_improvement",
  ).length;
  const improvement = therapeutic_progress_records.filter(
    (p) => p.overall_progress === "improvement",
  ).length;
  const stable = therapeutic_progress_records.filter(
    (p) => p.overall_progress === "stable",
  ).length;
  const decline = therapeutic_progress_records.filter(
    (p) => p.overall_progress === "decline",
  ).length;
  const significantDecline = therapeutic_progress_records.filter(
    (p) => p.overall_progress === "significant_decline",
  ).length;

  // Risk level distribution
  const highRiskCount = therapeutic_progress_records.filter(
    (p) => p.risk_level === "high" || p.risk_level === "critical",
  ).length;

  // --- Treatment plan metrics ---
  const totalTreatmentPlans = treatment_plans.length;
  const activePlans = treatment_plans.filter((p) => p.active).length;

  const totalPlanGoals = treatment_plans.reduce((sum, p) => sum + p.total_goals, 0);
  const goalsOnTrack = treatment_plans.reduce((sum, p) => sum + p.goals_on_track, 0);
  const goalsAchieved = treatment_plans.reduce((sum, p) => sum + p.goals_achieved, 0);
  const goalsBehind = treatment_plans.reduce((sum, p) => sum + p.goals_behind, 0);
  const goalsNotStarted = treatment_plans.reduce((sum, p) => sum + p.goals_not_started, 0);
  const treatmentAdherenceRate = pct(goalsOnTrack + goalsAchieved, totalPlanGoals);

  const interventionsPlanned = treatment_plans.reduce(
    (sum, p) => sum + p.interventions_planned,
    0,
  );
  const interventionsDelivered = treatment_plans.reduce(
    (sum, p) => sum + p.interventions_delivered,
    0,
  );
  const interventionDeliveryRate = pct(interventionsDelivered, interventionsPlanned);

  const childInvolvedInPlanning = treatment_plans.filter(
    (p) => p.child_involved_in_planning,
  ).length;
  const carerInvolvedInPlanning = treatment_plans.filter(
    (p) => p.carer_involved_in_planning,
  ).length;
  const multiAgencyInput = treatment_plans.filter((p) => p.multi_agency_input).length;

  const childPlanningInvolvementRate = pct(childInvolvedInPlanning, totalTreatmentPlans);
  const carerPlanningInvolvementRate = pct(carerInvolvedInPlanning, totalTreatmentPlans);
  const multiAgencyRate = pct(multiAgencyInput, totalTreatmentPlans);

  const reviewOverduePlans = treatment_plans.filter((p) => p.active && p.review_overdue).length;
  const activeReviewedPlans = activePlans > 0 ? activePlans - reviewOverduePlans : 0;
  const planReviewComplianceRate = pct(activeReviewedPlans, activePlans);

  // --- Therapeutic relationship metrics ---
  const totalRelationships = therapeutic_relationship_records.length;
  const activeRelationships = therapeutic_relationship_records.filter((r) => r.active).length;

  const trustSum = therapeutic_relationship_records.reduce(
    (sum, r) => sum + r.trust_rating,
    0,
  );
  const rapportSum = therapeutic_relationship_records.reduce(
    (sum, r) => sum + r.rapport_rating,
    0,
  );
  const communicationSum = therapeutic_relationship_records.reduce(
    (sum, r) => sum + r.communication_rating,
    0,
  );
  const consistencySum = therapeutic_relationship_records.reduce(
    (sum, r) => sum + r.consistency_rating,
    0,
  );

  const avgTrust =
    totalRelationships > 0
      ? Math.round((trustSum / totalRelationships) * 100) / 100
      : 0;
  const avgRapport =
    totalRelationships > 0
      ? Math.round((rapportSum / totalRelationships) * 100) / 100
      : 0;
  const avgCommunication =
    totalRelationships > 0
      ? Math.round((communicationSum / totalRelationships) * 100) / 100
      : 0;
  const avgConsistency =
    totalRelationships > 0
      ? Math.round((consistencySum / totalRelationships) * 100) / 100
      : 0;

  // Overall relationship quality: average of all four sub-ratings, scaled to percentage
  const overallRelationshipAvg =
    totalRelationships > 0
      ? (avgTrust + avgRapport + avgCommunication + avgConsistency) / 4
      : 0;
  const therapeuticRelationshipQualityRate =
    totalRelationships > 0 ? Math.round(overallRelationshipAvg * 20) : 0;

  const allianceScoreSum = therapeutic_relationship_records.reduce(
    (sum, r) => sum + r.therapeutic_alliance_score,
    0,
  );
  const therapeuticAllianceAvg =
    totalRelationships > 0
      ? Math.round((allianceScoreSum / totalRelationships) * 100) / 100
      : 0;

  const continuityMaintained = therapeutic_relationship_records.filter(
    (r) => r.continuity_maintained,
  ).length;
  const therapistContinuityRate = pct(continuityMaintained, totalRelationships);

  const totalTherapistChanges = therapeutic_relationship_records.reduce(
    (sum, r) => sum + r.therapist_changes,
    0,
  );

  const childFeelsHeard = therapeutic_relationship_records.filter(
    (r) => r.child_feels_heard,
  ).length;
  const childFeelsSafe = therapeutic_relationship_records.filter(
    (r) => r.child_feels_safe,
  ).length;
  const childFeedbackPositive = therapeutic_relationship_records.filter(
    (r) => r.child_feedback_positive,
  ).length;

  const childFeelsHeardRate = pct(childFeelsHeard, totalRelationships);
  const childFeelsSafeRate = pct(childFeelsSafe, totalRelationships);
  const childFeedbackPositiveRate = pct(childFeedbackPositive, totalRelationships);

  // --- Child involvement composite ---
  // Combine child involvement in assessments and planning
  const childInvolvementTotal =
    childInvolvedInAssessment + childInvolvedInPlanning;
  const childInvolvementDenom =
    totalProgressAssessments + totalTreatmentPlans;
  const childInvolvementRate = pct(childInvolvementTotal, childInvolvementDenom);

  // ── Scoring: base 52, 9 bonus categories summing to 28 (max 80) ──────

  let score = 52;

  // --- Bonus 1: therapyAttendanceRate (>=90: +4, >=70: +2) ---
  if (therapyAttendanceRate >= 90) score += 4;
  else if (therapyAttendanceRate >= 70) score += 2;

  // --- Bonus 2: interventionEffectivenessRate (>=90: +4, >=70: +2) ---
  if (interventionEffectivenessRate >= 90) score += 4;
  else if (interventionEffectivenessRate >= 70) score += 2;

  // --- Bonus 3: progressAssessmentCoverageRate (>=100: +3, >=80: +1) ---
  if (progressAssessmentCoverageRate >= 100) score += 3;
  else if (progressAssessmentCoverageRate >= 80) score += 1;

  // --- Bonus 4: treatmentAdherenceRate (>=90: +3, >=70: +1) ---
  if (treatmentAdherenceRate >= 90) score += 3;
  else if (treatmentAdherenceRate >= 70) score += 1;

  // --- Bonus 5: therapeuticRelationshipQualityRate (>=80: +3, >=60: +1) ---
  if (therapeuticRelationshipQualityRate >= 80) score += 3;
  else if (therapeuticRelationshipQualityRate >= 60) score += 1;

  // --- Bonus 6: childEngagementRate (>=80: +3, >=60: +1) ---
  if (childEngagementRate >= 80) score += 3;
  else if (childEngagementRate >= 60) score += 1;

  // --- Bonus 7: followUpCompletionRate (>=90: +3, >=70: +1) ---
  if (followUpCompletionRate >= 90) score += 3;
  else if (followUpCompletionRate >= 70) score += 1;

  // --- Bonus 8: planReviewComplianceRate (>=100: +2, >=80: +1) ---
  if (planReviewComplianceRate >= 100) score += 2;
  else if (planReviewComplianceRate >= 80) score += 1;

  // --- Bonus 9: therapistContinuityRate (>=90: +3, >=70: +1) ---
  if (therapistContinuityRate >= 90) score += 3;
  else if (therapistContinuityRate >= 70) score += 1;

  // Total max bonus: 4+4+3+3+3+3+3+2+3 = 28 → base 52 + 28 = 80 (outstanding)

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: therapyAttendanceRate < 50 → -5 (guard: scheduledSessions > 0)
  if (therapyAttendanceRate < 50 && scheduledSessions > 0) score -= 5;

  // Penalty 2: interventionEffectivenessRate < 50 → -5 (guard: measuredOutcomes > 0)
  if (interventionEffectivenessRate < 50 && measuredOutcomes > 0) score -= 5;

  // Penalty 3: treatmentAdherenceRate < 40 → -5 (guard: totalPlanGoals > 0)
  if (treatmentAdherenceRate < 40 && totalPlanGoals > 0) score -= 5;

  // Penalty 4: therapeuticRelationshipQualityRate < 40 → -3 (guard: totalRelationships > 0)
  if (therapeuticRelationshipQualityRate < 40 && totalRelationships > 0) score -= 3;

  score = clamp(score, 0, 100);

  const therapeutic_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // Therapy attendance strengths
  if (therapyAttendanceRate >= 90 && scheduledSessions > 0) {
    strengths.push(
      `${therapyAttendanceRate}% therapy session attendance — children are consistently attending their therapeutic sessions, demonstrating strong engagement with therapeutic support.`,
    );
  } else if (therapyAttendanceRate >= 70 && scheduledSessions > 0) {
    strengths.push(
      `${therapyAttendanceRate}% therapy attendance rate — the majority of scheduled sessions are attended, indicating good engagement with therapeutic provision.`,
    );
  }

  // Intervention effectiveness strengths
  if (interventionEffectivenessRate >= 90 && measuredOutcomes > 0) {
    strengths.push(
      `${interventionEffectivenessRate}% of measured interventions showing positive outcomes — therapeutic interventions are highly effective and delivering meaningful improvements for children.`,
    );
  } else if (interventionEffectivenessRate >= 70 && measuredOutcomes > 0) {
    strengths.push(
      `${interventionEffectivenessRate}% intervention effectiveness — the majority of therapeutic interventions are producing positive outcomes for children.`,
    );
  }

  // Progress assessment coverage strengths
  if (progressAssessmentCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has therapeutic progress assessments — comprehensive coverage ensures no child's therapeutic needs go unmonitored.",
    );
  } else if (progressAssessmentCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${progressAssessmentCoverageRate}% progress assessment coverage — the majority of children have documented therapeutic progress assessments.`,
    );
  }

  // Treatment adherence strengths
  if (treatmentAdherenceRate >= 90 && totalPlanGoals > 0) {
    strengths.push(
      `${treatmentAdherenceRate}% treatment plan adherence — goals are on track or achieved across the vast majority of treatment plans, demonstrating strong delivery of planned interventions.`,
    );
  } else if (treatmentAdherenceRate >= 70 && totalPlanGoals > 0) {
    strengths.push(
      `${treatmentAdherenceRate}% treatment adherence rate — the majority of treatment plan goals are on track or achieved.`,
    );
  }

  // Therapeutic relationship quality strengths
  if (therapeuticRelationshipQualityRate >= 80 && totalRelationships > 0) {
    strengths.push(
      `Therapeutic relationship quality at ${therapeuticRelationshipQualityRate}% — children have strong, trusting relationships with their therapists, which is the foundation of effective therapeutic work.`,
    );
  } else if (therapeuticRelationshipQualityRate >= 60 && totalRelationships > 0) {
    strengths.push(
      `Therapeutic relationship quality at ${therapeuticRelationshipQualityRate}% — positive therapeutic relationships are supporting children's engagement with therapy.`,
    );
  }

  // Child engagement strengths
  if (childEngagementRate >= 80 && totalSessions > 0) {
    strengths.push(
      `Child engagement rated at ${childEngagementRate}% across therapy sessions — children are actively participating in and benefiting from their therapeutic work.`,
    );
  } else if (childEngagementRate >= 60 && totalSessions > 0) {
    strengths.push(
      `Child engagement at ${childEngagementRate}% — most children are engaging meaningfully in their therapy sessions.`,
    );
  }

  // Follow-up completion strengths
  if (followUpCompletionRate >= 90 && totalFollowUpIdentified > 0) {
    strengths.push(
      `${followUpCompletionRate}% of therapy follow-up actions completed — the home ensures therapeutic recommendations are acted upon between sessions.`,
    );
  } else if (followUpCompletionRate >= 70 && totalFollowUpIdentified > 0) {
    strengths.push(
      `${followUpCompletionRate}% follow-up completion rate — most therapeutic actions identified in sessions are being carried through.`,
    );
  }

  // Plan review compliance strengths
  if (planReviewComplianceRate >= 100 && activePlans > 0) {
    strengths.push(
      "All active treatment plans are reviewed on schedule — consistent review ensures plans remain responsive to children's changing needs.",
    );
  } else if (planReviewComplianceRate >= 80 && activePlans > 0) {
    strengths.push(
      `${planReviewComplianceRate}% of treatment plans reviewed on time — strong compliance with review schedules ensures plans remain current.`,
    );
  }

  // Therapist continuity strengths
  if (therapistContinuityRate >= 90 && totalRelationships > 0) {
    strengths.push(
      `${therapistContinuityRate}% therapist continuity maintained — children benefit from consistent therapeutic relationships without disruption.`,
    );
  } else if (therapistContinuityRate >= 70 && totalRelationships > 0) {
    strengths.push(
      `${therapistContinuityRate}% therapist continuity rate — most children experience stability in their therapeutic relationships.`,
    );
  }

  // Session quality strengths
  if (sessionQualityAvg >= 4.0 && totalSessions > 0) {
    strengths.push(
      `Session quality averaging ${sessionQualityAvg}/5 — high-quality therapeutic sessions that effectively address children's needs.`,
    );
  } else if (sessionQualityAvg >= 3.0 && totalSessions > 0) {
    strengths.push(
      `Session quality averaging ${sessionQualityAvg}/5 — competent therapeutic sessions supporting children's progress.`,
    );
  }

  // Therapeutic alliance strengths
  if (therapeuticAllianceAvg >= 80 && totalRelationships > 0) {
    strengths.push(
      `Therapeutic alliance scores averaging ${therapeuticAllianceAvg}/100 — children have strong working alliances with their therapists, supporting effective therapeutic outcomes.`,
    );
  } else if (therapeuticAllianceAvg >= 60 && totalRelationships > 0) {
    strengths.push(
      `Therapeutic alliance averaging ${therapeuticAllianceAvg}/100 — adequate working alliances support ongoing therapeutic engagement.`,
    );
  }

  // Evidence documentation strengths
  if (evidenceDocumentationRate >= 90 && totalInterventions > 0) {
    strengths.push(
      `${evidenceDocumentationRate}% of interventions have documented evidence — the home can demonstrate the impact of therapeutic work to external stakeholders and Ofsted.`,
    );
  } else if (evidenceDocumentationRate >= 70 && totalInterventions > 0) {
    strengths.push(
      `${evidenceDocumentationRate}% evidence documentation rate — the majority of interventions have documented evidence of effectiveness.`,
    );
  }

  // Child involvement strengths
  if (childInvolvementRate >= 90 && childInvolvementDenom > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in assessments and planning — children are active participants in their therapeutic journey, not passive recipients.`,
    );
  } else if (childInvolvementRate >= 70 && childInvolvementDenom > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement rate — most children are involved in their therapeutic assessments and treatment planning.`,
    );
  }

  // Multi-agency working strengths
  if (multiAgencyRate >= 80 && totalTreatmentPlans > 0) {
    strengths.push(
      `${multiAgencyRate}% of treatment plans incorporate multi-agency input — therapeutic provision is well-integrated with wider professional support.`,
    );
  }

  // Child feels heard and safe strengths
  if (childFeelsHeardRate >= 90 && totalRelationships > 0) {
    strengths.push(
      `${childFeelsHeardRate}% of children report feeling heard by their therapist — children's voices are genuinely valued within the therapeutic relationship.`,
    );
  }

  if (childFeelsSafeRate >= 90 && totalRelationships > 0) {
    strengths.push(
      `${childFeelsSafeRate}% of children report feeling safe with their therapist — a safe therapeutic environment underpins effective therapy.`,
    );
  }

  // Progress improvement strengths
  if (progressImprovementRate >= 70 && domainsAssessedTotal > 0) {
    strengths.push(
      `${progressImprovementRate}% of assessed domains showing improvement — therapeutic interventions are driving meaningful progress across children's assessed needs.`,
    );
  }

  // Notes completion strengths
  if (notesCompletionRate >= 90 && totalSessions > 0) {
    strengths.push(
      `${notesCompletionRate}% session notes completion — comprehensive recording supports continuity of care and evidences therapeutic work.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // Therapy attendance concerns
  if (therapyAttendanceRate < 50 && scheduledSessions > 0) {
    concerns.push(
      `Only ${therapyAttendanceRate}% therapy session attendance — the majority of scheduled therapeutic sessions are not being attended, severely limiting the effectiveness of therapeutic provision and undermining children's access to support.`,
    );
  } else if (therapyAttendanceRate < 70 && therapyAttendanceRate >= 50 && scheduledSessions > 0) {
    concerns.push(
      `Therapy attendance at ${therapyAttendanceRate}% — a significant proportion of scheduled sessions are missed, reducing the continuity and effectiveness of therapeutic work.`,
    );
  }

  // Cancellation analysis concerns
  if (cancelledSessions > 0 && scheduledSessions > 0) {
    const cancelRate = pct(cancelledSessions, scheduledSessions);
    if (cancelRate >= 30) {
      const parts: string[] = [];
      if (cancelledByChild > 0) parts.push(`${cancelledByChild} by child`);
      if (cancelledByTherapist > 0) parts.push(`${cancelledByTherapist} by therapist`);
      if (cancelledByHome > 0) parts.push(`${cancelledByHome} by home`);
      concerns.push(
        `${cancelRate}% session cancellation rate (${parts.join(", ")}) — high cancellation rates disrupt therapeutic progress and may indicate systemic barriers to accessing therapy.`,
      );
    }
  }

  // Intervention effectiveness concerns
  if (interventionEffectivenessRate < 50 && measuredOutcomes > 0) {
    concerns.push(
      `Only ${interventionEffectivenessRate}% intervention effectiveness — the majority of therapeutic interventions are not producing positive outcomes, suggesting the approach may need fundamental review.`,
    );
  } else if (
    interventionEffectivenessRate < 70 &&
    interventionEffectivenessRate >= 50 &&
    measuredOutcomes > 0
  ) {
    concerns.push(
      `Intervention effectiveness at ${interventionEffectivenessRate}% — a significant proportion of interventions are not achieving positive outcomes for children.`,
    );
  }

  // Progress assessment coverage concerns
  if (progressAssessmentCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${progressAssessmentCoverageRate}% of children have therapeutic progress assessments — the majority of children's therapeutic progress is not being formally monitored or assessed.`,
    );
  } else if (
    progressAssessmentCoverageRate < 80 &&
    progressAssessmentCoverageRate >= 50 &&
    total_children > 0
  ) {
    concerns.push(
      `Progress assessment coverage at ${progressAssessmentCoverageRate}% — not all children receiving therapeutic support have documented progress assessments.`,
    );
  }

  // Treatment adherence concerns
  if (treatmentAdherenceRate < 40 && totalPlanGoals > 0) {
    concerns.push(
      `Only ${treatmentAdherenceRate}% treatment plan adherence — the majority of treatment plan goals are not on track or achieved, indicating significant gaps between planned and actual therapeutic delivery.`,
    );
  } else if (
    treatmentAdherenceRate < 70 &&
    treatmentAdherenceRate >= 40 &&
    totalPlanGoals > 0
  ) {
    concerns.push(
      `Treatment adherence at ${treatmentAdherenceRate}% — a proportion of treatment plan goals are not progressing as planned.`,
    );
  }

  // Therapeutic relationship quality concerns
  if (therapeuticRelationshipQualityRate < 40 && totalRelationships > 0) {
    concerns.push(
      `Therapeutic relationship quality at only ${therapeuticRelationshipQualityRate}% — poor therapeutic relationships undermine the foundation of effective therapy and may leave children feeling unsupported.`,
    );
  } else if (
    therapeuticRelationshipQualityRate < 60 &&
    therapeuticRelationshipQualityRate >= 40 &&
    totalRelationships > 0
  ) {
    concerns.push(
      `Therapeutic relationship quality at ${therapeuticRelationshipQualityRate}% — relationships need strengthening to support effective therapeutic outcomes.`,
    );
  }

  // Child engagement concerns
  if (childEngagementRate < 40 && totalSessions > 0) {
    concerns.push(
      `Child engagement at only ${childEngagementRate}% — children are not actively engaging in their therapy sessions, which significantly limits the therapeutic benefit.`,
    );
  } else if (childEngagementRate < 60 && childEngagementRate >= 40 && totalSessions > 0) {
    concerns.push(
      `Child engagement at ${childEngagementRate}% — engagement levels suggest some children are not fully benefiting from their therapeutic sessions.`,
    );
  }

  // Follow-up completion concerns
  if (followUpCompletionRate < 50 && totalFollowUpIdentified > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of therapy follow-up actions completed — without follow-through between sessions, therapeutic gains are unlikely to be sustained in daily life.`,
    );
  } else if (
    followUpCompletionRate < 70 &&
    followUpCompletionRate >= 50 &&
    totalFollowUpIdentified > 0
  ) {
    concerns.push(
      `Follow-up completion at ${followUpCompletionRate}% — some therapeutic actions identified in sessions are not being carried through between sessions.`,
    );
  }

  // Plan review concerns
  if (reviewOverduePlans > 0 && activePlans > 0) {
    const overdueRate = pct(reviewOverduePlans, activePlans);
    if (overdueRate >= 30) {
      concerns.push(
        `${reviewOverduePlans} active treatment plan${reviewOverduePlans !== 1 ? "s" : ""} overdue for review (${overdueRate}%) — overdue reviews mean plans may no longer reflect children's current therapeutic needs.`,
      );
    }
  }

  // Therapist continuity concerns
  if (therapistContinuityRate < 50 && totalRelationships > 0) {
    concerns.push(
      `Therapist continuity at only ${therapistContinuityRate}% — frequent therapist changes disrupt therapeutic relationships and can cause regression in children who have experienced multiple placement breakdowns.`,
    );
  } else if (
    therapistContinuityRate < 70 &&
    therapistContinuityRate >= 50 &&
    totalRelationships > 0
  ) {
    concerns.push(
      `Therapist continuity at ${therapistContinuityRate}% — some children are experiencing changes in their therapist, which can undermine trust and therapeutic progress.`,
    );
  }

  // Therapist changes concern
  if (totalTherapistChanges > 3 && totalRelationships > 0) {
    concerns.push(
      `${totalTherapistChanges} therapist changes recorded across relationships — frequent changes may re-traumatise children and undermine the stability they need for therapeutic progress.`,
    );
  }

  // Child involvement concerns
  if (childInvolvementRate < 50 && childInvolvementDenom > 0) {
    concerns.push(
      `Only ${childInvolvementRate}% child involvement in therapeutic assessments and planning — children are not being adequately included as active participants in decisions about their therapeutic journey.`,
    );
  }

  // Child feels heard/safe concerns
  if (childFeelsHeardRate < 50 && totalRelationships > 0) {
    concerns.push(
      `Only ${childFeelsHeardRate}% of children report feeling heard by their therapist — if children do not feel listened to, the therapeutic relationship cannot function effectively.`,
    );
  }

  if (childFeelsSafeRate < 50 && totalRelationships > 0) {
    concerns.push(
      `Only ${childFeelsSafeRate}% of children report feeling safe with their therapist — without a sense of safety, children cannot engage authentically in therapeutic work.`,
    );
  }

  // Declining domains concern
  if (domainsDecliningTotal > 0 && domainsAssessedTotal > 0) {
    const declineRate = pct(domainsDecliningTotal, domainsAssessedTotal);
    if (declineRate >= 20) {
      concerns.push(
        `${declineRate}% of assessed therapeutic domains are declining — a significant proportion of children's assessed areas are worsening despite intervention, requiring urgent review of therapeutic approaches.`,
      );
    }
  }

  // High risk concerns
  if (highRiskCount > 0 && totalProgressAssessments > 0) {
    const highRiskRate = pct(highRiskCount, totalProgressAssessments);
    if (highRiskRate >= 20) {
      concerns.push(
        `${highRiskCount} progress assessment${highRiskCount !== 1 ? "s" : ""} rated high/critical risk (${highRiskRate}%) — children at elevated therapeutic risk require intensified support and more frequent monitoring.`,
      );
    }
  }

  // Evidence documentation concerns
  if (evidenceDocumentationRate < 50 && totalInterventions > 0) {
    concerns.push(
      `Only ${evidenceDocumentationRate}% of interventions have documented evidence — without evidence documentation, the home cannot demonstrate the impact of therapeutic work to Ofsted or placing authorities.`,
    );
  }

  // Notes completion concerns
  if (notesCompletionRate < 70 && totalSessions > 0) {
    concerns.push(
      `Session notes completion at only ${notesCompletionRate}% — incomplete session records undermine continuity of care and the home's ability to evidence therapeutic work.`,
    );
  }

  // No sessions concern
  if (totalSessions === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No therapy sessions recorded despite children being on placement — this may indicate children with therapeutic needs are not receiving the sessions identified in their care plans.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: TherapeuticRecommendation[] = [];
  let rank = 0;

  // Immediate recommendations
  if (therapyAttendanceRate < 50 && scheduledSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review barriers to therapy attendance — identify why children are not attending scheduled sessions and implement strategies to improve engagement, including transport, timing adjustments, and motivational approaches.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (interventionEffectivenessRate < 50 && measuredOutcomes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an urgent review of therapeutic intervention approaches — if the majority of interventions are not producing positive outcomes, the therapeutic model, therapist match, or intervention timing may need fundamental reassessment.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (treatmentAdherenceRate < 40 && totalPlanGoals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review treatment plan delivery — with the majority of goals not on track, convene a multi-disciplinary review to identify barriers, realign resources, and ensure planned interventions are actually being delivered.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (therapeuticRelationshipQualityRate < 40 && totalRelationships > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Take immediate action to improve therapeutic relationship quality — consider therapist matching reviews, additional training, or changes to therapeutic approach to ensure children have trusting, effective relationships with their therapists.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (progressAssessmentCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child with therapeutic needs has a documented progress assessment — without regular assessment, the home cannot evidence whether therapeutic interventions are working or whether adjustments are needed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (childFeelsSafeRate < 50 && totalRelationships > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address children's sense of safety in therapeutic relationships — review therapist approaches, session environments, and any factors that may be causing children to feel unsafe during therapy.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (childFeelsHeardRate < 50 && totalRelationships > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve how therapists capture and respond to children's voices — children must feel genuinely heard within therapeutic relationships for therapy to be effective.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  // Soon recommendations
  if (followUpCompletionRate < 50 && totalFollowUpIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a system to track and complete therapy follow-up actions — therapeutic gains made in sessions need reinforcement through between-session activities and support from care staff.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (therapistContinuityRate < 70 && totalRelationships > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review therapist continuity and develop strategies to reduce therapist changes — children in care who have experienced multiple relationship disruptions need stability in their therapeutic relationships above all.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (reviewOverduePlans > 0 && activePlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Complete ${reviewOverduePlans} overdue treatment plan review${reviewOverduePlans !== 1 ? "s" : ""} — overdue reviews mean children's therapeutic plans may not reflect their current needs and progress.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (childInvolvementRate < 50 && childInvolvementDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child involvement in therapeutic assessments and treatment planning — children should be active participants in decisions about their therapeutic journey, not passive recipients of interventions decided by professionals.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (evidenceDocumentationRate < 50 && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve evidence documentation for therapeutic interventions — without documented evidence of outcomes, the home cannot demonstrate to Ofsted or placing authorities that therapeutic investment is achieving results.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (notesCompletionRate < 70 && totalSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve therapy session notes completion to support continuity of care — complete notes are essential for tracking progress, informing care staff, and evidencing therapeutic work during inspections.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  // Planned recommendations
  if (
    therapyAttendanceRate >= 50 &&
    therapyAttendanceRate < 70 &&
    scheduledSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop targeted strategies to improve therapy attendance to at least 70% — explore creative engagement approaches, flexible scheduling, and preparation support to help children attend consistently.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (
    interventionEffectivenessRate >= 50 &&
    interventionEffectivenessRate < 70 &&
    measuredOutcomes > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and optimise intervention approaches to improve effectiveness — consider whether intervention types, duration, or intensity need adjustment to better meet children's individual needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (
    progressAssessmentCoverageRate >= 50 &&
    progressAssessmentCoverageRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend therapeutic progress assessments to cover all children receiving therapeutic support — aim for 100% coverage to ensure every child's therapeutic journey is systematically monitored.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (
    treatmentAdherenceRate >= 40 &&
    treatmentAdherenceRate < 70 &&
    totalPlanGoals > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve treatment plan adherence by reviewing resource allocation and delivery capacity — identify which goals are falling behind and whether additional support is needed.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (
    therapeuticRelationshipQualityRate >= 40 &&
    therapeuticRelationshipQualityRate < 60 &&
    totalRelationships > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Invest in improving therapeutic relationship quality through therapist training, supervision, and child feedback — stronger relationships lead to better therapeutic outcomes.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (multiAgencyRate < 50 && totalTreatmentPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase multi-agency input into treatment planning — therapeutic plans should incorporate perspectives from education, social work, and health professionals to ensure holistic support.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (totalSessions === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently assess whether children on placement have unmet therapeutic needs — the absence of therapy sessions may indicate that therapeutic needs identified in care plans are not being addressed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (
    followUpCompletionRate >= 50 &&
    followUpCompletionRate < 70 &&
    totalFollowUpIdentified > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen between-session follow-up by involving care staff in supporting therapeutic actions — care staff are critical to reinforcing therapeutic strategies in children's daily lives.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  if (
    childEngagementRate >= 40 &&
    childEngagementRate < 60 &&
    totalSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore approaches to increase child engagement in therapy — consider whether the therapeutic modality, session format, or therapist match needs adjusting to better engage children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Health and well-being",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: TherapeuticInsight[] = [];

  // -- Critical insights --

  if (therapyAttendanceRate < 50 && scheduledSessions > 0) {
    insights.push({
      text: `Only ${therapyAttendanceRate}% therapy attendance. Ofsted will view poor therapy attendance as evidence that children's emotional and psychological needs are not being prioritised, directly undermining Reg 12 compliance. The home must demonstrate that it actively supports children to attend and engage with therapeutic provision.`,
      severity: "critical",
    });
  }

  if (interventionEffectivenessRate < 50 && measuredOutcomes > 0) {
    insights.push({
      text: `Only ${interventionEffectivenessRate}% of interventions showing positive outcomes. When the majority of therapeutic interventions fail to produce improvement, it raises fundamental questions about whether the right interventions are being used, whether therapists are adequately matched to children, and whether the home environment supports therapeutic progress.`,
      severity: "critical",
    });
  }

  if (treatmentAdherenceRate < 40 && totalPlanGoals > 0) {
    insights.push({
      text: `Treatment plan adherence at only ${treatmentAdherenceRate}%. Ofsted expects treatment plans to be living documents that drive delivery — when the majority of goals are not on track, it suggests plans exist on paper but are not being meaningfully implemented in children's daily care.`,
      severity: "critical",
    });
  }

  if (therapeuticRelationshipQualityRate < 40 && totalRelationships > 0) {
    insights.push({
      text: `Therapeutic relationship quality at ${therapeuticRelationshipQualityRate}%. Research consistently shows that the quality of the therapeutic relationship is the single strongest predictor of therapeutic outcomes for children in care. Poor relationship quality undermines all other therapeutic investment.`,
      severity: "critical",
    });
  }

  if (childFeelsSafeRate < 50 && totalRelationships > 0) {
    insights.push({
      text: `Only ${childFeelsSafeRate}% of children feel safe with their therapist. For children who have experienced trauma, abuse, or neglect, feeling unsafe in a therapeutic relationship may cause re-traumatisation rather than healing. This requires immediate attention.`,
      severity: "critical",
    });
  }

  if (totalSessions === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No therapy sessions recorded despite children being on placement. Ofsted will question whether the home is meeting its Reg 12 duty to promote children's health and well-being if no therapeutic provision is evidenced for children with identified emotional or psychological needs.",
      severity: "critical",
    });
  }

  if (significantDecline > 0 && totalProgressAssessments > 0) {
    const sigDeclineRate = pct(significantDecline, totalProgressAssessments);
    if (sigDeclineRate >= 10) {
      insights.push({
        text: `${significantDecline} progress assessment${significantDecline !== 1 ? "s" : ""} show significant decline (${sigDeclineRate}%). Children whose therapeutic progress is significantly declining require urgent multi-disciplinary review to understand why current approaches are failing and what alternative support is needed.`,
        severity: "critical",
      });
    }
  }

  // -- Warning insights --

  if (
    therapyAttendanceRate >= 50 &&
    therapyAttendanceRate < 70 &&
    scheduledSessions > 0
  ) {
    insights.push({
      text: `Therapy attendance at ${therapyAttendanceRate}% — improving but still means a significant number of sessions are missed. Each missed session represents a lost opportunity for therapeutic progress and may indicate unresolved barriers to accessing support.`,
      severity: "warning",
    });
  }

  if (
    interventionEffectivenessRate >= 50 &&
    interventionEffectivenessRate < 70 &&
    measuredOutcomes > 0
  ) {
    insights.push({
      text: `Intervention effectiveness at ${interventionEffectivenessRate}% — while some interventions are working, a significant proportion are not achieving positive outcomes. Consider whether individual intervention plans need adjustment based on ongoing progress monitoring.`,
      severity: "warning",
    });
  }

  if (
    progressAssessmentCoverageRate >= 50 &&
    progressAssessmentCoverageRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Progress assessment coverage at ${progressAssessmentCoverageRate}% — not all children have formal therapeutic progress assessments. Without systematic monitoring, the home cannot identify when interventions need adjusting or when children are regressing.`,
      severity: "warning",
    });
  }

  if (
    treatmentAdherenceRate >= 40 &&
    treatmentAdherenceRate < 70 &&
    totalPlanGoals > 0
  ) {
    insights.push({
      text: `Treatment adherence at ${treatmentAdherenceRate}% — while some goals are on track, a proportion of planned interventions are falling behind schedule. Regular multi-disciplinary reviews can help identify and remove barriers to delivery.`,
      severity: "warning",
    });
  }

  if (
    therapeuticRelationshipQualityRate >= 40 &&
    therapeuticRelationshipQualityRate < 60 &&
    totalRelationships > 0
  ) {
    insights.push({
      text: `Therapeutic relationship quality at ${therapeuticRelationshipQualityRate}% — relationships need strengthening. Consider whether therapist matching, session frequency, or the therapeutic environment could be improved to build stronger alliances.`,
      severity: "warning",
    });
  }

  if (
    childEngagementRate >= 40 &&
    childEngagementRate < 60 &&
    totalSessions > 0
  ) {
    insights.push({
      text: `Child engagement at ${childEngagementRate}% — moderate engagement levels suggest some children are not fully connecting with their therapy. Consider whether the therapeutic modality is appropriate for each child's developmental stage and communication style.`,
      severity: "warning",
    });
  }

  if (
    followUpCompletionRate >= 50 &&
    followUpCompletionRate < 70 &&
    totalFollowUpIdentified > 0
  ) {
    insights.push({
      text: `Follow-up completion at ${followUpCompletionRate}% — therapeutic actions identified in sessions are not consistently being completed between sessions. Care staff need to be better supported to reinforce therapeutic strategies in daily life.`,
      severity: "warning",
    });
  }

  if (
    therapistContinuityRate >= 50 &&
    therapistContinuityRate < 70 &&
    totalRelationships > 0
  ) {
    insights.push({
      text: `Therapist continuity at ${therapistContinuityRate}% — some children are experiencing therapist changes that may disrupt their therapeutic progress. For children with attachment difficulties, therapist changes can trigger re-enactment of earlier abandonment experiences.`,
      severity: "warning",
    });
  }

  if (goalsBehind > 0 && totalPlanGoals > 0) {
    const behindRate = pct(goalsBehind, totalPlanGoals);
    if (behindRate >= 20 && behindRate < 50) {
      insights.push({
        text: `${behindRate}% of treatment plan goals are behind schedule — these goals need targeted attention and may require resource reallocation or revised timelines to prevent further drift from the treatment plan.`,
        severity: "warning",
      });
    }
  }

  if (goalsNotStarted > 0 && totalPlanGoals > 0) {
    const notStartedRate = pct(goalsNotStarted, totalPlanGoals);
    if (notStartedRate >= 20) {
      insights.push({
        text: `${notStartedRate}% of treatment plan goals have not been started — unstarted goals indicate that aspects of children's treatment plans are not being activated, potentially leaving therapeutic needs unaddressed.`,
        severity: "warning",
      });
    }
  }

  // Therapy type distribution insight
  const therapyTypeCounts: Record<string, number> = {};
  for (const s of therapy_sessions) {
    therapyTypeCounts[s.therapy_type] = (therapyTypeCounts[s.therapy_type] ?? 0) + 1;
  }
  const therapyTypes = Object.entries(therapyTypeCounts).sort((a, b) => b[1] - a[1]);
  if (therapyTypes.length === 1 && totalSessions > 5) {
    insights.push({
      text: `All ${totalSessions} therapy sessions use the same modality (${therapyTypes[0][0].replace(/_/g, " ")}). Children have different therapeutic needs and communication styles — consider whether a single approach adequately serves the diversity of children's needs.`,
      severity: "warning",
    });
  }

  // Unmeasured outcomes insight
  if (totalInterventions > 0) {
    const unmeasured = totalInterventions - measuredOutcomes;
    if (unmeasured > 0) {
      const unmeasuredRate = pct(unmeasured, totalInterventions);
      if (unmeasuredRate >= 30) {
        insights.push({
          text: `${unmeasuredRate}% of interventions have not had their outcomes measured — without measurement, the home cannot determine whether therapeutic investment is producing results or whether alternative approaches are needed.`,
          severity: "warning",
        });
      }
    }
  }

  // -- Positive insights --

  if (therapeutic_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding therapeutic intervention effectiveness — children attend therapy consistently, interventions produce positive outcomes, progress is systematically assessed, treatment plans are adhered to, and therapeutic relationships are strong. This is compelling evidence of Reg 12 compliance and genuine commitment to children's emotional well-being.",
      severity: "positive",
    });
  }

  if (
    therapyAttendanceRate >= 90 &&
    childEngagementRate >= 80 &&
    scheduledSessions > 0 &&
    totalSessions > 0
  ) {
    insights.push({
      text: `${therapyAttendanceRate}% attendance with ${childEngagementRate}% engagement — children are not only attending therapy but actively engaging with the therapeutic process. This combination of attendance and engagement is the strongest predictor of positive therapeutic outcomes.`,
      severity: "positive",
    });
  }

  if (
    interventionEffectivenessRate >= 90 &&
    evidenceDocumentationRate >= 90 &&
    measuredOutcomes > 0 &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `${interventionEffectivenessRate}% intervention effectiveness with ${evidenceDocumentationRate}% evidence documentation — the home can robustly demonstrate that therapeutic interventions are working and that evidence supports continued investment. This is powerful evidence for Ofsted and placing authorities.`,
      severity: "positive",
    });
  }

  if (
    treatmentAdherenceRate >= 90 &&
    planReviewComplianceRate >= 100 &&
    totalPlanGoals > 0 &&
    activePlans > 0
  ) {
    insights.push({
      text: `${treatmentAdherenceRate}% treatment adherence with all plans reviewed on time — treatment plans are living documents that are systematically delivered and regularly reviewed. This demonstrates that the home translates therapeutic planning into consistent delivery.`,
      severity: "positive",
    });
  }

  if (
    therapeuticRelationshipQualityRate >= 80 &&
    therapeuticAllianceAvg >= 80 &&
    totalRelationships > 0
  ) {
    insights.push({
      text: `Therapeutic relationship quality at ${therapeuticRelationshipQualityRate}% with alliance scores averaging ${therapeuticAllianceAvg}/100 — children have strong, trusting relationships with their therapists. Research consistently identifies the therapeutic relationship as the single strongest predictor of positive outcomes.`,
      severity: "positive",
    });
  }

  if (
    childFeelsHeardRate >= 90 &&
    childFeelsSafeRate >= 90 &&
    totalRelationships > 0
  ) {
    insights.push({
      text: `${childFeelsHeardRate}% of children feel heard and ${childFeelsSafeRate}% feel safe in therapy — children experience their therapeutic relationships as safe, supportive spaces where their voices genuinely matter. This is the foundation of effective therapeutic work.`,
      severity: "positive",
    });
  }

  if (
    therapistContinuityRate >= 90 &&
    totalRelationships > 0
  ) {
    insights.push({
      text: `${therapistContinuityRate}% therapist continuity — the home has maintained stable therapeutic relationships, which is particularly important for children who have experienced multiple placement and relationship disruptions. Continuity supports deeper therapeutic work.`,
      severity: "positive",
    });
  }

  if (
    progressImprovementRate >= 70 &&
    domainsAssessedTotal > 0
  ) {
    insights.push({
      text: `${progressImprovementRate}% of assessed domains showing improvement — therapeutic interventions are driving measurable progress across children's assessed needs. This is strong evidence that the home's therapeutic approach is effective.`,
      severity: "positive",
    });
  }

  if (
    childInvolvementRate >= 90 &&
    childInvolvementDenom > 0
  ) {
    insights.push({
      text: `${childInvolvementRate}% child involvement in therapeutic assessments and planning — children are active co-producers of their therapeutic journey. This child-centred approach empowers children and ensures interventions are meaningful and relevant.`,
      severity: "positive",
    });
  }

  if (
    multiAgencyRate >= 80 &&
    totalTreatmentPlans > 0
  ) {
    insights.push({
      text: `${multiAgencyRate}% of treatment plans incorporate multi-agency input — the home works effectively with external professionals to ensure therapeutic provision is holistic and well-coordinated across education, health, and social care.`,
      severity: "positive",
    });
  }

  if (
    followUpCompletionRate >= 90 &&
    totalFollowUpIdentified > 0
  ) {
    insights.push({
      text: `${followUpCompletionRate}% of therapy follow-up actions completed — the home ensures that therapeutic strategies identified in sessions are reinforced in children's daily lives, maximising the impact of therapeutic work.`,
      severity: "positive",
    });
  }

  if (
    notesCompletionRate >= 90 &&
    totalSessions > 0
  ) {
    insights.push({
      text: `${notesCompletionRate}% session notes completion — comprehensive documentation supports continuity of care, enables effective handover between professionals, and provides robust evidence of therapeutic work for inspections.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (therapeutic_rating === "outstanding") {
    headline =
      "Outstanding therapeutic intervention effectiveness — children attend therapy consistently, interventions are effective, and therapeutic relationships are strong.";
  } else if (therapeutic_rating === "good") {
    headline = `Good therapeutic intervention effectiveness — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (therapeutic_rating === "adequate") {
    headline = `Adequate therapeutic intervention effectiveness — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's therapeutic needs are effectively met.`;
  } else {
    headline = `Therapeutic intervention effectiveness is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children receive effective therapeutic support.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    therapeutic_rating,
    therapeutic_score: score,
    headline,
    total_sessions: totalSessions,
    total_interventions: totalInterventions,
    total_progress_assessments: totalProgressAssessments,
    total_treatment_plans: totalTreatmentPlans,
    total_relationships: totalRelationships,
    therapy_attendance_rate: therapyAttendanceRate,
    intervention_effectiveness_rate: interventionEffectivenessRate,
    progress_assessment_coverage_rate: progressAssessmentCoverageRate,
    treatment_adherence_rate: treatmentAdherenceRate,
    therapeutic_relationship_quality_rate: therapeuticRelationshipQualityRate,
    child_engagement_rate: childEngagementRate,
    session_quality_avg: sessionQualityAvg,
    goals_achievement_rate: goalsAchievementRate,
    follow_up_completion_rate: followUpCompletionRate,
    progress_improvement_rate: progressImprovementRate,
    plan_review_compliance_rate: planReviewComplianceRate,
    therapeutic_alliance_avg: therapeuticAllianceAvg,
    therapist_continuity_rate: therapistContinuityRate,
    child_involvement_rate: childInvolvementRate,
    evidence_documentation_rate: evidenceDocumentationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
