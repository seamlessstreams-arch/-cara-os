// ==============================================================================
// CORNERSTONE -- HOME PLACEMENT STABILITY & PERMANENCE INTELLIGENCE ENGINE
// Tracks placement quality, stability metrics, unplanned placement endings,
// breakdown prevention effectiveness, matching quality, and placement duration
// analysis. Aggregates across all children at the home level.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 11 (Positive relationships),
// Reg 36 (Admission and matching), SCCIF overall effectiveness.
// Store keys: placementRecords, matchingAssessmentRecords,
//             stabilityMeetingRecords, disruptionPreventionRecords,
//             placementReviewRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface PlacementRecordInput {
  id: string;
  child_id: string;
  start_date: string;
  end_date: string | null;
  placement_type: "emergency" | "planned" | "short_term" | "long_term" | "respite" | "bridging";
  ending_type: "planned" | "unplanned" | "breakdown" | "positive_move_on" | "ongoing" | null;
  ending_reason: string;
  duration_days: number;
  stability_rating: number; // 1-5
  child_consulted_on_admission: boolean;
  child_views_recorded: boolean;
  care_plan_in_place: boolean;
  risk_assessment_completed: boolean;
  impact_assessment_completed: boolean;
  key_worker_assigned: boolean;
  key_worker_assigned_within_48h: boolean;
  settling_in_plan: boolean;
  matching_score: number; // 0-100
  parent_carer_notified: boolean;
  social_worker_notified: boolean;
  disruption_meeting_held: boolean;
  placement_plan_reviewed: boolean;
  child_satisfaction: number; // 1-5
  peer_impact_assessed: boolean;
  created_at: string;
}

export interface MatchingAssessmentRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor: string;
  matching_criteria_met: boolean;
  needs_assessment_completed: boolean;
  risk_compatibility_assessed: boolean;
  existing_residents_considered: boolean;
  cultural_match_considered: boolean;
  education_continuity_assessed: boolean;
  health_needs_assessed: boolean;
  location_suitability_assessed: boolean;
  family_contact_impact_assessed: boolean;
  overall_match_score: number; // 0-100
  match_approved: boolean;
  conditions_attached: string[];
  child_views_sought: boolean;
  child_views_positive: boolean;
  outcome: "placed" | "not_placed" | "deferred" | "pending";
  reg_36_compliant: boolean;
  created_at: string;
}

export interface StabilityMeetingRecordInput {
  id: string;
  child_id: string;
  meeting_date: string;
  meeting_type: "scheduled" | "emergency" | "review" | "disruption_risk";
  attendees_count: number;
  child_attended: boolean;
  child_views_represented: boolean;
  social_worker_attended: boolean;
  parent_carer_attended: boolean;
  key_issues_identified: string[];
  actions_agreed: number;
  actions_completed: number;
  stability_risk_level: "low" | "medium" | "high" | "critical";
  outcome: "stable" | "at_risk" | "intervention_needed" | "breakdown_prevented";
  follow_up_date: string | null;
  follow_up_completed: boolean;
  created_at: string;
}

export interface DisruptionPreventionRecordInput {
  id: string;
  child_id: string;
  identified_date: string;
  risk_level: "low" | "medium" | "high" | "critical";
  trigger_factors: string[];
  intervention_type: "additional_support" | "respite" | "mediation" | "therapeutic" | "environmental_change" | "staffing_change" | "multi_agency" | "other";
  intervention_date: string;
  intervention_timely: boolean;
  outcome: "prevented" | "delayed" | "not_prevented" | "ongoing";
  placement_preserved: boolean;
  child_consulted: boolean;
  multi_agency_involved: boolean;
  review_completed: boolean;
  lessons_learned_documented: boolean;
  created_at: string;
}

export interface PlacementReviewRecordInput {
  id: string;
  child_id: string;
  review_date: string;
  review_type: "initial" | "statutory" | "additional" | "disruption";
  child_attended: boolean;
  child_views_captured: boolean;
  social_worker_attended: boolean;
  parent_carer_involved: boolean;
  placement_plan_updated: boolean;
  care_plan_aligned: boolean;
  permanence_plan_discussed: boolean;
  permanence_plan_in_place: boolean;
  outcomes_reviewed: boolean;
  actions_from_previous_review: number;
  actions_completed_from_previous: number;
  next_review_date: string | null;
  overall_placement_quality: number; // 1-5
  recommendation: "continue" | "additional_support" | "placement_change" | "step_down" | "independence";
  created_at: string;
}

export interface PlacementStabilityInput {
  today: string;
  total_children: number;
  placement_records: PlacementRecordInput[];
  matching_assessment_records: MatchingAssessmentRecordInput[];
  stability_meeting_records: StabilityMeetingRecordInput[];
  disruption_prevention_records: DisruptionPreventionRecordInput[];
  placement_review_records: PlacementReviewRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type PlacementStabilityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PlacementStabilityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PlacementStabilityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PlacementStabilityResult {
  stability_rating: PlacementStabilityRating;
  stability_score: number;
  headline: string;
  placement_stability_rate: number;
  matching_quality_rate: number;
  stability_meeting_rate: number;
  disruption_prevention_rate: number;
  planned_ending_rate: number;
  child_consultation_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: PlacementStabilityRecommendation[];
  insights: PlacementStabilityInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PlacementStabilityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: PlacementStabilityRating,
  score: number,
  headline: string,
): PlacementStabilityResult {
  return {
    stability_rating: rating,
    stability_score: score,
    headline,
    placement_stability_rate: 0,
    matching_quality_rate: 0,
    stability_meeting_rate: 0,
    disruption_prevention_rate: 0,
    planned_ending_rate: 0,
    child_consultation_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computePlacementStabilityPermanence(
  input: PlacementStabilityInput,
): PlacementStabilityResult {
  const {
    today,
    total_children,
    placement_records,
    matching_assessment_records,
    stability_meeting_records,
    disruption_prevention_records,
    placement_review_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    placement_records.length === 0 &&
    matching_assessment_records.length === 0 &&
    stability_meeting_records.length === 0 &&
    disruption_prevention_records.length === 0 &&
    placement_review_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess placement stability and permanence.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No placement stability, matching, disruption prevention, or review data recorded despite children on placement -- placement quality assurance requires urgent attention.",
      ),
      concerns: [
        "No placement records, matching assessments, stability meetings, disruption prevention records, or placement reviews exist despite children being on placement -- the home cannot evidence that placements are stable, well-matched, or effectively monitored.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of placement admissions, matching assessments, stability meetings, disruption prevention interventions, and placement reviews to evidence the home's commitment to placement stability and permanence.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 36 -- Admission and matching",
        },
        {
          rank: 2,
          recommendation:
            "Conduct immediate matching assessments for all current residents and ensure Reg 36 impact assessments are completed, documented, and reviewed at each admission.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
        },
      ],
      insights: [
        {
          text: "The complete absence of placement stability and permanence records means Ofsted cannot verify that children are appropriately matched, that placements are stable, or that disruption prevention is effective. This represents a fundamental gap in Reg 36 compliance and SCCIF overall effectiveness.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  const todayDate = new Date(today + "T00:00:00");

  // ==========================================
  // METRIC 1 -- Placement Stability Rate
  // ==========================================
  // Proportion of placements that are stable (ongoing, planned ending, or
  // positive move-on) vs total placements that have an ending type.

  const totalPlacements = placement_records.length;
  const endedPlacements = placement_records.filter(
    (r) => r.ending_type !== null && r.ending_type !== "ongoing",
  );
  const totalEnded = endedPlacements.length;
  const ongoingPlacements = placement_records.filter(
    (r) => r.ending_type === "ongoing" || r.ending_type === null,
  );
  const totalOngoing = ongoingPlacements.length;

  // Stable = ongoing + planned + positive_move_on
  const stablePlacements = placement_records.filter(
    (r) =>
      r.ending_type === "ongoing" ||
      r.ending_type === null ||
      r.ending_type === "planned" ||
      r.ending_type === "positive_move_on",
  ).length;
  const placementStabilityRate = pct(stablePlacements, totalPlacements);

  // Unplanned endings & breakdowns
  const unplannedEndings = endedPlacements.filter(
    (r) => r.ending_type === "unplanned",
  ).length;
  const breakdowns = endedPlacements.filter(
    (r) => r.ending_type === "breakdown",
  ).length;
  const unplannedEndingRate = pct(unplannedEndings + breakdowns, totalEnded > 0 ? totalEnded : totalPlacements);
  const breakdownRate = pct(breakdowns, totalEnded > 0 ? totalEnded : totalPlacements);

  // Planned ending rate (for ended placements)
  const plannedEndings = endedPlacements.filter(
    (r) => r.ending_type === "planned" || r.ending_type === "positive_move_on",
  ).length;
  const plannedEndingRate = totalEnded > 0 ? pct(plannedEndings, totalEnded) : 100;

  // Care plan & risk assessment on admission
  const carePlanInPlace = placement_records.filter((r) => r.care_plan_in_place).length;
  const carePlanRate = pct(carePlanInPlace, totalPlacements);

  const riskAssessmentCompleted = placement_records.filter((r) => r.risk_assessment_completed).length;
  const riskAssessmentRate = pct(riskAssessmentCompleted, totalPlacements);

  const impactAssessmentCompleted = placement_records.filter((r) => r.impact_assessment_completed).length;
  const impactAssessmentRate = pct(impactAssessmentCompleted, totalPlacements);

  const keyWorkerAssigned = placement_records.filter((r) => r.key_worker_assigned).length;
  const keyWorkerRate = pct(keyWorkerAssigned, totalPlacements);

  const keyWorkerWithin48h = placement_records.filter((r) => r.key_worker_assigned_within_48h).length;
  const keyWorkerTimelyRate = pct(keyWorkerWithin48h, totalPlacements);

  const settlingInPlans = placement_records.filter((r) => r.settling_in_plan).length;
  const settlingInRate = pct(settlingInPlans, totalPlacements);

  // Placement satisfaction
  const placementSatisfactionSum = placement_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const placementSatisfactionAvg =
    totalPlacements > 0
      ? Math.round((placementSatisfactionSum / totalPlacements) * 100) / 100
      : 0;

  // Stability ratings on placements
  const stabilityRatingSum = placement_records.reduce(
    (sum, r) => sum + r.stability_rating, 0,
  );
  const stabilityRatingAvg =
    totalPlacements > 0
      ? Math.round((stabilityRatingSum / totalPlacements) * 100) / 100
      : 0;

  // Peer impact assessed
  const peerImpactAssessed = placement_records.filter((r) => r.peer_impact_assessed).length;
  const peerImpactRate = pct(peerImpactAssessed, totalPlacements);

  // Average placement duration (days) for ongoing placements
  const ongoingDurations = ongoingPlacements.map((r) => {
    const startMs = new Date(r.start_date + "T00:00:00").getTime();
    const nowMs = todayDate.getTime();
    const diff = nowMs - startMs;
    return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : r.duration_days;
  });
  const avgOngoingDuration =
    ongoingDurations.length > 0
      ? Math.round(ongoingDurations.reduce((a, b) => a + b, 0) / ongoingDurations.length)
      : 0;

  // Average matching score on placements
  const matchingScoreSum = placement_records.reduce(
    (sum, r) => sum + r.matching_score, 0,
  );
  const avgPlacementMatchScore =
    totalPlacements > 0 ? Math.round(matchingScoreSum / totalPlacements) : 0;

  // ==========================================
  // METRIC 2 -- Matching Quality Rate
  // ==========================================

  const totalMatchingAssessments = matching_assessment_records.length;
  const matchingCriteriaMet = matching_assessment_records.filter(
    (r) => r.matching_criteria_met,
  ).length;
  const matchingCriteriaRate = pct(matchingCriteriaMet, totalMatchingAssessments);

  const needsAssessmentDone = matching_assessment_records.filter(
    (r) => r.needs_assessment_completed,
  ).length;
  const needsAssessmentRate = pct(needsAssessmentDone, totalMatchingAssessments);

  const riskCompatibilityAssessed = matching_assessment_records.filter(
    (r) => r.risk_compatibility_assessed,
  ).length;
  const riskCompatibilityRate = pct(riskCompatibilityAssessed, totalMatchingAssessments);

  const existingResidentsConsidered = matching_assessment_records.filter(
    (r) => r.existing_residents_considered,
  ).length;
  const existingResidentsRate = pct(existingResidentsConsidered, totalMatchingAssessments);

  const culturalMatchConsidered = matching_assessment_records.filter(
    (r) => r.cultural_match_considered,
  ).length;
  const culturalMatchRate = pct(culturalMatchConsidered, totalMatchingAssessments);

  const educationContinuityAssessed = matching_assessment_records.filter(
    (r) => r.education_continuity_assessed,
  ).length;
  const educationContinuityRate = pct(educationContinuityAssessed, totalMatchingAssessments);

  const reg36Compliant = matching_assessment_records.filter(
    (r) => r.reg_36_compliant,
  ).length;
  const reg36ComplianceRate = pct(reg36Compliant, totalMatchingAssessments);

  const matchApproved = matching_assessment_records.filter((r) => r.match_approved).length;
  const matchApprovalRate = pct(matchApproved, totalMatchingAssessments);

  const matchChildViewsSought = matching_assessment_records.filter(
    (r) => r.child_views_sought,
  ).length;
  const matchChildViewsRate = pct(matchChildViewsSought, totalMatchingAssessments);

  const matchChildViewsPositive = matching_assessment_records.filter(
    (r) => r.child_views_positive,
  ).length;
  const matchPositiveViewsRate = pct(
    matchChildViewsPositive,
    matchChildViewsSought > 0 ? matchChildViewsSought : totalMatchingAssessments,
  );

  const overallMatchScoreSum = matching_assessment_records.reduce(
    (sum, r) => sum + r.overall_match_score, 0,
  );
  const avgMatchScore =
    totalMatchingAssessments > 0
      ? Math.round(overallMatchScoreSum / totalMatchingAssessments)
      : 0;

  // Composite matching quality rate
  const matchingQualityRate =
    totalMatchingAssessments > 0
      ? Math.round(
          (matchingCriteriaRate +
            reg36ComplianceRate +
            needsAssessmentRate +
            riskCompatibilityRate +
            existingResidentsRate) /
            5,
        )
      : 0;

  // ==========================================
  // METRIC 3 -- Stability Meeting Rate
  // ==========================================

  const totalStabilityMeetings = stability_meeting_records.length;

  const childAttendedMeetings = stability_meeting_records.filter(
    (r) => r.child_attended,
  ).length;
  const childAttendanceMeetingRate = pct(childAttendedMeetings, totalStabilityMeetings);

  const childViewsRepresented = stability_meeting_records.filter(
    (r) => r.child_views_represented,
  ).length;
  const childViewsMeetingRate = pct(childViewsRepresented, totalStabilityMeetings);

  const socialWorkerAttendedMeetings = stability_meeting_records.filter(
    (r) => r.social_worker_attended,
  ).length;
  const socialWorkerMeetingRate = pct(socialWorkerAttendedMeetings, totalStabilityMeetings);

  const totalActionsAgreed = stability_meeting_records.reduce(
    (sum, r) => sum + r.actions_agreed, 0,
  );
  const totalActionsCompleted = stability_meeting_records.reduce(
    (sum, r) => sum + r.actions_completed, 0,
  );
  const meetingActionCompletionRate = pct(totalActionsCompleted, totalActionsAgreed);

  const followUpRequired = stability_meeting_records.filter(
    (r) => r.follow_up_date !== null,
  );
  const followUpCompleted = followUpRequired.filter(
    (r) => r.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpRequired.length);

  const breakdownPreventedMeetings = stability_meeting_records.filter(
    (r) => r.outcome === "breakdown_prevented",
  ).length;

  const emergencyMeetings = stability_meeting_records.filter(
    (r) => r.meeting_type === "emergency" || r.meeting_type === "disruption_risk",
  ).length;

  const highRiskMeetings = stability_meeting_records.filter(
    (r) => r.stability_risk_level === "high" || r.stability_risk_level === "critical",
  ).length;

  // Unique children with stability meetings vs total children
  const uniqueChildrenWithMeetings = new Set(
    stability_meeting_records.map((r) => r.child_id),
  ).size;
  const meetingCoverageRate = pct(uniqueChildrenWithMeetings, total_children);

  // Composite stability meeting rate
  const stabilityMeetingRate =
    totalStabilityMeetings > 0
      ? Math.round(
          (childViewsMeetingRate +
            meetingActionCompletionRate +
            followUpCompletionRate) /
            3,
        )
      : 0;

  // ==========================================
  // METRIC 4 -- Disruption Prevention Rate
  // ==========================================

  const totalDisruptionRecords = disruption_prevention_records.length;
  const preventedDisruptions = disruption_prevention_records.filter(
    (r) => r.outcome === "prevented",
  ).length;
  const disruptionPreventionRate = pct(preventedDisruptions, totalDisruptionRecords);

  const placementPreserved = disruption_prevention_records.filter(
    (r) => r.placement_preserved,
  ).length;
  const placementPreservedRate = pct(placementPreserved, totalDisruptionRecords);

  const timelyInterventions = disruption_prevention_records.filter(
    (r) => r.intervention_timely,
  ).length;
  const timelyInterventionRate = pct(timelyInterventions, totalDisruptionRecords);

  const childConsultedDisruption = disruption_prevention_records.filter(
    (r) => r.child_consulted,
  ).length;
  const childConsultedDisruptionRate = pct(childConsultedDisruption, totalDisruptionRecords);

  const multiAgencyInvolved = disruption_prevention_records.filter(
    (r) => r.multi_agency_involved,
  ).length;
  const multiAgencyRate = pct(multiAgencyInvolved, totalDisruptionRecords);

  const reviewCompletedDisruption = disruption_prevention_records.filter(
    (r) => r.review_completed,
  ).length;
  const reviewCompletedRate = pct(reviewCompletedDisruption, totalDisruptionRecords);

  const lessonsDocumented = disruption_prevention_records.filter(
    (r) => r.lessons_learned_documented,
  ).length;
  const lessonsDocumentedRate = pct(lessonsDocumented, totalDisruptionRecords);

  const highCriticalDisruptions = disruption_prevention_records.filter(
    (r) => r.risk_level === "high" || r.risk_level === "critical",
  ).length;
  const highCriticalPreventedDisruptions = disruption_prevention_records.filter(
    (r) =>
      (r.risk_level === "high" || r.risk_level === "critical") &&
      r.outcome === "prevented",
  ).length;
  const highRiskPreventionRate = pct(highCriticalPreventedDisruptions, highCriticalDisruptions);

  // ==========================================
  // METRIC 5 -- Planned Ending Rate
  // (already computed above from placement_records)
  // ==========================================

  // ==========================================
  // METRIC 6 -- Child Consultation Rate
  // ==========================================
  // Composite of child consultation across all placement processes

  const childConsultedOnAdmission = placement_records.filter(
    (r) => r.child_consulted_on_admission,
  ).length;
  const childConsultedAdmissionRate = pct(childConsultedOnAdmission, totalPlacements);

  const childViewsRecorded = placement_records.filter(
    (r) => r.child_views_recorded,
  ).length;
  const childViewsRecordedRate = pct(childViewsRecorded, totalPlacements);

  const reviewChildViewsCaptured = placement_review_records.filter(
    (r) => r.child_views_captured,
  ).length;
  const reviewChildViewsRate = pct(reviewChildViewsCaptured, placement_review_records.length);

  // Composite child consultation rate
  // Two signals per placement (consulted on admission + views recorded), one per other record type
  const consultationDenominator =
    (totalPlacements * 2) + totalMatchingAssessments + totalStabilityMeetings + totalDisruptionRecords + placement_review_records.length;
  const consultationNumerator =
    childConsultedOnAdmission +
    childViewsRecorded +
    matchChildViewsSought +
    childViewsRepresented +
    childConsultedDisruption +
    reviewChildViewsCaptured;
  const childConsultationRate = clamp(pct(consultationNumerator, consultationDenominator), 0, 100);

  // ==========================================
  // PLACEMENT REVIEWS sub-metrics
  // ==========================================

  const totalReviews = placement_review_records.length;

  const reviewChildAttended = placement_review_records.filter(
    (r) => r.child_attended,
  ).length;
  const reviewChildAttendanceRate = pct(reviewChildAttended, totalReviews);

  const reviewSocialWorkerAttended = placement_review_records.filter(
    (r) => r.social_worker_attended,
  ).length;
  const reviewSocialWorkerRate = pct(reviewSocialWorkerAttended, totalReviews);

  const reviewParentInvolved = placement_review_records.filter(
    (r) => r.parent_carer_involved,
  ).length;
  const reviewParentRate = pct(reviewParentInvolved, totalReviews);

  const placementPlanUpdated = placement_review_records.filter(
    (r) => r.placement_plan_updated,
  ).length;
  const placementPlanUpdateRate = pct(placementPlanUpdated, totalReviews);

  const carePlanAligned = placement_review_records.filter(
    (r) => r.care_plan_aligned,
  ).length;
  const carePlanAlignmentRate = pct(carePlanAligned, totalReviews);

  const permanencePlanDiscussed = placement_review_records.filter(
    (r) => r.permanence_plan_discussed,
  ).length;
  const permanencePlanRate = pct(permanencePlanDiscussed, totalReviews);

  const permanencePlanInPlace = placement_review_records.filter(
    (r) => r.permanence_plan_in_place,
  ).length;
  const permanenceInPlaceRate = pct(permanencePlanInPlace, totalReviews);

  const outcomesReviewed = placement_review_records.filter(
    (r) => r.outcomes_reviewed,
  ).length;
  const outcomesReviewedRate = pct(outcomesReviewed, totalReviews);

  const totalPreviousActions = placement_review_records.reduce(
    (sum, r) => sum + r.actions_from_previous_review, 0,
  );
  const totalPreviousActionsCompleted = placement_review_records.reduce(
    (sum, r) => sum + r.actions_completed_from_previous, 0,
  );
  const reviewActionCompletionRate = pct(totalPreviousActionsCompleted, totalPreviousActions);

  const reviewQualitySum = placement_review_records.reduce(
    (sum, r) => sum + r.overall_placement_quality, 0,
  );
  const reviewQualityAvg =
    totalReviews > 0
      ? Math.round((reviewQualitySum / totalReviews) * 100) / 100
      : 0;

  // ==========================================
  // SCORING: base 52, max bonuses = +28
  // ==========================================

  let score = 52;

  // --- Bonus 1: Placement stability rate (>=90: +5, >=75: +3, >=60: +1) ---
  if (placementStabilityRate >= 90) score += 5;
  else if (placementStabilityRate >= 75) score += 3;
  else if (placementStabilityRate >= 60) score += 1;

  // --- Bonus 2: Matching quality rate (>=85: +4, >=70: +2) ---
  if (matchingQualityRate >= 85) score += 4;
  else if (matchingQualityRate >= 70) score += 2;

  // --- Bonus 3: Disruption prevention rate (>=80: +3, >=60: +1) ---
  if (disruptionPreventionRate >= 80) score += 3;
  else if (disruptionPreventionRate >= 60) score += 1;

  // --- Bonus 4: Planned ending rate (>=90: +3, >=70: +1) ---
  if (plannedEndingRate >= 90) score += 3;
  else if (plannedEndingRate >= 70) score += 1;

  // --- Bonus 5: Child consultation rate (>=80: +3, >=60: +1) ---
  if (childConsultationRate >= 80) score += 3;
  else if (childConsultationRate >= 60) score += 1;

  // --- Bonus 6: Reg 36 compliance rate (>=95: +3, >=80: +1) ---
  if (reg36ComplianceRate >= 95) score += 3;
  else if (reg36ComplianceRate >= 80) score += 1;

  // --- Bonus 7: Stability meeting action completion (>=85: +3, >=65: +1) ---
  if (meetingActionCompletionRate >= 85) score += 3;
  else if (meetingActionCompletionRate >= 65) score += 1;

  // --- Bonus 8: Review action completion rate (>=85: +2, >=65: +1) ---
  if (reviewActionCompletionRate >= 85) score += 2;
  else if (reviewActionCompletionRate >= 65) score += 1;

  // --- Bonus 9: Permanence planning rate (>=80: +2, >=50: +1) ---
  if (permanencePlanRate >= 80) score += 2;
  else if (permanencePlanRate >= 50) score += 1;

  // -- Penalties (4 with guards, -3 to -6 each) ----------------------------

  // Penalty 1: High breakdown rate -> -6
  if (breakdownRate > 20 && totalPlacements > 0) score -= 6;

  // Penalty 2: Low matching quality -> -5
  if (matchingQualityRate < 50 && totalMatchingAssessments > 0) score -= 5;

  // Penalty 3: Low disruption prevention -> -4
  if (disruptionPreventionRate < 40 && totalDisruptionRecords > 0) score -= 4;

  // Penalty 4: Low child consultation rate -> -3
  if (childConsultationRate < 40 && consultationDenominator > 0) score -= 3;

  score = clamp(score, 0, 100);

  const stability_rating = toRating(score);

  // ==========================================
  // STRENGTHS (10-15 conditions)
  // ==========================================

  const strengths: string[] = [];

  // S1: Placement stability rate high
  if (placementStabilityRate >= 90 && totalPlacements > 0) {
    strengths.push(
      `${placementStabilityRate}% of placements are stable (ongoing, planned endings, or positive move-on) -- the home demonstrates exceptional placement stability across all residents.`,
    );
  } else if (placementStabilityRate >= 75 && totalPlacements > 0) {
    strengths.push(
      `${placementStabilityRate}% placement stability rate -- the majority of children experience sustained, secure placements.`,
    );
  }

  // S2: Zero breakdowns
  if (breakdowns === 0 && totalEnded > 0) {
    strengths.push(
      "No placement breakdowns recorded -- every ended placement was managed through planned transitions or positive move-on, reflecting skilled disruption prevention.",
    );
  }

  // S3: Matching quality
  if (matchingQualityRate >= 85 && totalMatchingAssessments > 0) {
    strengths.push(
      `${matchingQualityRate}% matching quality composite rate -- comprehensive assessment of needs, risks, and compatibility consistently informs admission decisions.`,
    );
  } else if (matchingQualityRate >= 70 && totalMatchingAssessments > 0) {
    strengths.push(
      `${matchingQualityRate}% matching quality rate -- good evidence of thorough matching assessments prior to placement.`,
    );
  }

  // S4: Reg 36 compliance
  if (reg36ComplianceRate >= 95 && totalMatchingAssessments > 0) {
    strengths.push(
      `${reg36ComplianceRate}% Reg 36 compliance rate across matching assessments -- the home demonstrates robust regulatory adherence in admission and matching processes.`,
    );
  } else if (reg36ComplianceRate >= 80 && totalMatchingAssessments > 0) {
    strengths.push(
      `${reg36ComplianceRate}% Reg 36 compliance in matching assessments -- strong regulatory alignment in the admission process.`,
    );
  }

  // S5: Disruption prevention effectiveness
  if (disruptionPreventionRate >= 80 && totalDisruptionRecords > 0) {
    strengths.push(
      `${disruptionPreventionRate}% disruption prevention success rate -- interventions effectively preserve placements and prevent breakdowns.`,
    );
  } else if (disruptionPreventionRate >= 60 && totalDisruptionRecords > 0) {
    strengths.push(
      `${disruptionPreventionRate}% disruption prevention rate -- the home demonstrates effective intervention when placements are at risk.`,
    );
  }

  // S6: Timely interventions
  if (timelyInterventionRate >= 90 && totalDisruptionRecords > 0) {
    strengths.push(
      `${timelyInterventionRate}% of disruption prevention interventions are timely -- the home responds swiftly when placement stability is threatened.`,
    );
  }

  // S7: Planned ending rate
  if (plannedEndingRate >= 90 && totalEnded > 0) {
    strengths.push(
      `${plannedEndingRate}% of placement endings are planned or represent positive move-on -- children experience well-managed transitions.`,
    );
  } else if (plannedEndingRate >= 75 && totalEnded > 0) {
    strengths.push(
      `${plannedEndingRate}% planned ending rate -- most placement transitions are managed in a structured, child-centred way.`,
    );
  }

  // S8: Child consultation rate
  if (childConsultationRate >= 80) {
    strengths.push(
      `${childConsultationRate}% child consultation rate across placement processes -- children's views are consistently sought and recorded in admissions, matching, stability meetings, and reviews.`,
    );
  } else if (childConsultationRate >= 65) {
    strengths.push(
      `${childConsultationRate}% child consultation rate -- good evidence that children's views inform placement decisions.`,
    );
  }

  // S9: Permanence planning
  if (permanencePlanRate >= 80 && totalReviews > 0) {
    strengths.push(
      `Permanence plans discussed in ${permanencePlanRate}% of placement reviews -- the home actively plans for children's long-term futures.`,
    );
  }

  // S10: Key worker assignment timeliness
  if (keyWorkerTimelyRate >= 90 && totalPlacements > 0) {
    strengths.push(
      `${keyWorkerTimelyRate}% of children have a key worker assigned within 48 hours of admission -- new arrivals receive immediate relational support.`,
    );
  }

  // S11: High average satisfaction
  if (placementSatisfactionAvg >= 4.0 && totalPlacements > 0) {
    strengths.push(
      `Children's placement satisfaction averages ${placementSatisfactionAvg}/5 -- residents report positive experiences of their placements.`,
    );
  }

  // S12: Meeting action completion
  if (meetingActionCompletionRate >= 85 && totalActionsAgreed > 0) {
    strengths.push(
      `${meetingActionCompletionRate}% of stability meeting actions completed -- agreed interventions are followed through effectively.`,
    );
  }

  // S13: Review quality high
  if (reviewQualityAvg >= 4.0 && totalReviews > 0) {
    strengths.push(
      `Overall placement quality averages ${reviewQualityAvg}/5 in reviews -- reviewers rate the home's placement provision highly.`,
    );
  }

  // S14: Lessons learned documentation
  if (lessonsDocumentedRate >= 90 && totalDisruptionRecords > 0) {
    strengths.push(
      `Lessons learned documented in ${lessonsDocumentedRate}% of disruption prevention cases -- the home demonstrates strong reflective practice and continuous improvement.`,
    );
  }

  // S15: Impact assessments completed
  if (impactAssessmentRate >= 90 && totalPlacements > 0) {
    strengths.push(
      `${impactAssessmentRate}% of admissions have completed impact assessments -- the home carefully considers the effect of each new admission on existing residents.`,
    );
  }

  // ==========================================
  // CONCERNS (8-12 conditions)
  // ==========================================

  const concerns: string[] = [];

  // C1: Breakdown rate
  if (breakdowns > 0 && totalPlacements > 0) {
    concerns.push(
      `${breakdowns} placement breakdown(s) recorded (${breakdownRate}% of ended placements) -- each breakdown represents a significant disruption to a child's stability and requires thorough analysis to prevent recurrence.`,
    );
  }

  // C2: Unplanned endings
  if (unplannedEndings > 0 && totalPlacements > 0) {
    concerns.push(
      `${unplannedEndings} unplanned placement ending(s) recorded (${unplannedEndingRate}% of endings include unplanned and breakdowns) -- unplanned endings can cause trauma and should be minimised through early intervention.`,
    );
  }

  // C3: Low matching quality
  if (matchingQualityRate < 60 && totalMatchingAssessments > 0) {
    concerns.push(
      `Matching quality composite rate at ${matchingQualityRate}% -- matching assessments are not consistently meeting the required standard for needs assessment, risk compatibility, and consideration of existing residents.`,
    );
  }

  // C4: Low Reg 36 compliance
  if (reg36ComplianceRate < 80 && totalMatchingAssessments > 0) {
    concerns.push(
      `Only ${reg36ComplianceRate}% of matching assessments are Reg 36 compliant -- the home is at risk of non-compliance with CHR 2015 Reg 36 admission and matching requirements.`,
    );
  }

  // C5: Low disruption prevention
  if (disruptionPreventionRate < 50 && totalDisruptionRecords > 0) {
    concerns.push(
      `Only ${disruptionPreventionRate}% of disruption prevention interventions successfully prevent placement breakdown -- intervention effectiveness needs urgent review.`,
    );
  }

  // C6: Low child consultation
  if (childConsultationRate < 50 && consultationDenominator > 0) {
    concerns.push(
      `Child consultation rate at ${childConsultationRate}% -- children's views are not consistently sought across placement processes, undermining child-centred practice and SCCIF expectations.`,
    );
  }

  // C7: No stability meetings despite children
  if (totalStabilityMeetings === 0 && total_children > 0) {
    concerns.push(
      "No stability meetings recorded despite children on placement -- proactive placement monitoring through regular stability meetings is essential for early identification of placement risks.",
    );
  }

  // C8: Low follow-up completion
  if (followUpCompletionRate < 60 && followUpRequired.length > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of stability meeting follow-up actions completed -- failure to complete agreed follow-up actions undermines the effectiveness of stability meetings.`,
    );
  }

  // C9: Low care plan rate
  if (carePlanRate < 80 && totalPlacements > 0) {
    concerns.push(
      `Only ${carePlanRate}% of placements have a care plan in place -- each child must have a documented care plan at admission as required under Reg 5.`,
    );
  }

  // C10: Low risk assessment rate
  if (riskAssessmentRate < 80 && totalPlacements > 0) {
    concerns.push(
      `Only ${riskAssessmentRate}% of placements have completed risk assessments -- risk assessments at admission are essential for safeguarding and placement planning.`,
    );
  }

  // C11: Poor permanence planning
  if (permanencePlanRate < 50 && totalReviews > 0) {
    concerns.push(
      `Permanence plans discussed in only ${permanencePlanRate}% of reviews -- insufficient permanence planning means children's long-term stability may not be adequately addressed.`,
    );
  }

  // C12: Low settling-in plan rate
  if (settlingInRate < 70 && totalPlacements > 0) {
    concerns.push(
      `Only ${settlingInRate}% of placements have settling-in plans -- new arrivals need structured support to build relationships and adjust to their new environment.`,
    );
  }

  // ==========================================
  // RECOMMENDATIONS (ranked, with urgency and regulatory ref)
  // ==========================================

  const recommendations: PlacementStabilityRecommendation[] = [];
  let recRank = 0;

  // R1: Breakdowns present
  if (breakdowns > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Conduct thorough disruption meetings for every placement breakdown, document root causes and lessons learned, and implement systemic changes to prevent recurrence. Review matching processes and disruption prevention protocols.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 -- Positive relationships",
    });
  }

  // R2: Low Reg 36 compliance
  if (reg36ComplianceRate < 80 && totalMatchingAssessments > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Strengthen Reg 36 compliance by implementing a structured matching assessment checklist ensuring needs assessment, risk compatibility, impact on existing residents, and cultural/educational continuity are systematically evaluated before every admission.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 -- Admission and matching",
    });
  }

  // R3: Low matching quality
  if (matchingQualityRate < 65 && totalMatchingAssessments > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Review and enhance the quality of matching assessments. Ensure all five key domains (needs, risk compatibility, existing residents, cultural match, educational continuity) are comprehensively assessed with documented evidence for every admission decision.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 -- Admission and matching",
    });
  }

  // R4: Low disruption prevention
  if (disruptionPreventionRate < 60 && totalDisruptionRecords > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Review the effectiveness of disruption prevention interventions. Consider expanding the range of interventions available (therapeutic support, respite, multi-agency involvement) and ensure interventions are deployed swiftly when placement risk is identified.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  // R5: Low child consultation
  if (childConsultationRate < 60) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Embed child consultation as a mandatory element across all placement processes -- admissions, matching, stability meetings, disruption prevention, and placement reviews. Ensure children's views are sought, recorded, and demonstrably influence decisions.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Overall effectiveness",
    });
  }

  // R6: No stability meetings
  if (totalStabilityMeetings === 0 && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Establish a schedule of regular stability meetings for all children on placement. These should proactively monitor placement quality, identify emerging risks, and agree actions to sustain placement stability before concerns escalate.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  // R7: Low permanence planning
  if (permanencePlanRate < 60 && totalReviews > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Ensure permanence planning is discussed and documented in every placement review. Each child should have a clear permanence plan outlining their long-term placement pathway, whether that is long-term stability, return home, or transition to independence.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  // R8: Low care plan rate
  if (carePlanRate < 90 && totalPlacements > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Ensure every child has a documented care plan at the point of admission. The care plan should address all assessed needs and be developed in consultation with the child, their social worker, and parents/carers where appropriate.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  // R9: Low risk assessment rate
  if (riskAssessmentRate < 90 && totalPlacements > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Complete risk assessments for all current and future placements at the point of admission. Risk assessments should be dynamic, regularly reviewed, and shared with relevant staff to inform care planning.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 -- Admission and matching",
    });
  }

  // R10: Low impact assessment rate
  if (impactAssessmentRate < 80 && totalPlacements > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Conduct Reg 36 impact assessments for every new admission, considering the effect on existing residents' safety, wellbeing, and placement stability. Document outcomes and share with the staff team.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 -- Admission and matching",
    });
  }

  // R11: Low follow-up completion
  if (followUpCompletionRate < 70 && followUpRequired.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Improve follow-up action completion from stability meetings. Assign clear ownership of each action, set deadlines, and track completion through supervision to ensure agreed interventions are delivered.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 -- Positive relationships",
    });
  }

  // R12: Low settling-in plan rate
  if (settlingInRate < 80 && totalPlacements > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Develop settling-in plans for every new admission. These should cover the first days and weeks, include introductions to staff and peers, routines, expectations, and named support contacts to help children feel safe and welcome.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 -- Positive relationships",
    });
  }

  // R13: Enhance lessons learned
  if (lessonsDocumentedRate < 70 && totalDisruptionRecords > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Strengthen lessons-learned documentation following disruption prevention interventions. Systematic capture of what worked, what did not, and what should change will build organisational learning and improve future placement stability.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Overall effectiveness",
    });
  }

  // R14: Low key worker timeliness
  if (keyWorkerTimelyRate < 80 && totalPlacements > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Ensure every child is assigned a key worker within 48 hours of admission to provide immediate relational stability and a trusted point of contact during the critical settling-in period.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 -- Positive relationships",
    });
  }

  // ==========================================
  // INSIGHTS (with severity)
  // ==========================================

  const insights: PlacementStabilityInsight[] = [];

  // I1: Zero breakdowns
  if (breakdowns === 0 && totalPlacements >= 3) {
    insights.push({
      text: `The home has maintained zero placement breakdowns across ${totalPlacements} placements -- this is a strong indicator of effective matching, proactive stability monitoring, and skilled disruption prevention, directly supporting SCCIF overall effectiveness.`,
      severity: "positive",
    });
  }

  // I2: Multiple breakdowns
  if (breakdowns >= 2 && totalPlacements > 0) {
    insights.push({
      text: `${breakdowns} placement breakdowns recorded -- a pattern of breakdowns suggests systemic issues in matching, transition planning, or disruption prevention that require immediate strategic review. Ofsted will scrutinise whether the home can sustain stable placements for all children.`,
      severity: "critical",
    });
  } else if (breakdowns === 1 && totalPlacements > 0) {
    insights.push({
      text: "One placement breakdown recorded -- while a single breakdown may reflect individual circumstances, a thorough disruption meeting and root cause analysis should be completed to identify any preventable factors.",
      severity: "warning",
    });
  }

  // I3: High disruption prevention with high-risk cases
  if (highRiskPreventionRate >= 80 && highCriticalDisruptions >= 2) {
    insights.push({
      text: `${highRiskPreventionRate}% of high/critical risk disruption situations were successfully prevented -- the home demonstrates exceptional capability in managing the most challenging placement risks, preserving stability even when under significant pressure.`,
      severity: "positive",
    });
  }

  // I4: Low matching quality contributing to instability
  if (matchingQualityRate < 50 && unplannedEndingRate > 30 && totalMatchingAssessments > 0) {
    insights.push({
      text: `Low matching quality (${matchingQualityRate}%) combined with high unplanned endings (${unplannedEndingRate}%) suggests that inadequate matching assessments may be contributing to placement instability. Ofsted will expect to see clear evidence that Reg 36 admission and matching processes are robust and effective.`,
      severity: "critical",
    });
  }

  // I5: Excellent child consultation across processes
  if (childConsultationRate >= 85 && consultationDenominator >= 5) {
    insights.push({
      text: `${childConsultationRate}% child consultation rate across all placement processes -- the home demonstrates exemplary child-centred practice, consistently ensuring children's views inform decisions about their placements, matching, stability, and reviews.`,
      severity: "positive",
    });
  }

  // I6: Low child consultation
  if (childConsultationRate < 40 && consultationDenominator > 0) {
    insights.push({
      text: `Child consultation rate at only ${childConsultationRate}% -- Ofsted expects children's voices to be central to all placement decisions. The current rate suggests children's views are not being systematically sought or recorded across admissions, matching, and reviews.`,
      severity: "critical",
    });
  }

  // I7: Strong meeting action completion
  if (meetingActionCompletionRate >= 90 && totalActionsAgreed >= 5) {
    insights.push({
      text: `${meetingActionCompletionRate}% of stability meeting actions completed -- the home demonstrates strong operational follow-through, translating meeting discussions into concrete actions that support placement stability.`,
      severity: "positive",
    });
  }

  // I8: Poor follow-up completion
  if (followUpCompletionRate < 50 && followUpRequired.length >= 3) {
    insights.push({
      text: `Only ${followUpCompletionRate}% of stability meeting follow-ups completed -- unfinished follow-up actions mean identified risks may not be addressed, potentially allowing placement concerns to escalate unchecked.`,
      severity: "warning",
    });
  }

  // I9: Permanence planning gap
  if (permanencePlanRate < 40 && totalReviews >= 3) {
    insights.push({
      text: `Permanence plans discussed in only ${permanencePlanRate}% of placement reviews -- without systematic permanence planning, children may experience prolonged uncertainty about their long-term future, which undermines their sense of security and belonging.`,
      severity: "critical",
    });
  }

  // I10: Long average placement duration (positive)
  if (avgOngoingDuration >= 180 && totalOngoing >= 2) {
    insights.push({
      text: `Average ongoing placement duration is ${avgOngoingDuration} days -- sustained placements indicate that the home provides a stable, nurturing environment where children can develop secure relationships and a sense of belonging.`,
      severity: "positive",
    });
  }

  // I11: High Reg 36 compliance
  if (reg36ComplianceRate >= 95 && totalMatchingAssessments >= 3) {
    insights.push({
      text: `${reg36ComplianceRate}% Reg 36 compliance across ${totalMatchingAssessments} matching assessments -- the home demonstrates exemplary regulatory compliance in admission and matching, ensuring each child's placement is thoroughly assessed before a decision is made.`,
      severity: "positive",
    });
  }

  // I12: Proactive stability meetings
  if (meetingCoverageRate >= 80 && totalStabilityMeetings >= 3) {
    insights.push({
      text: `Stability meetings cover ${meetingCoverageRate}% of children on placement -- the home takes a proactive approach to monitoring placement quality and identifying emerging risks before they threaten stability.`,
      severity: "positive",
    });
  }

  // I13: Emergency meetings proportion high
  if (emergencyMeetings > 0 && totalStabilityMeetings > 0) {
    const emergencyProportion = pct(emergencyMeetings, totalStabilityMeetings);
    if (emergencyProportion > 40) {
      insights.push({
        text: `${emergencyProportion}% of stability meetings are emergency or disruption-risk -- a high proportion of reactive meetings suggests the home may need to strengthen early identification of placement risks through routine monitoring.`,
        severity: "warning",
      });
    }
  }

  // I14: No matching assessments despite placements
  if (totalMatchingAssessments === 0 && totalPlacements > 0) {
    insights.push({
      text: "No matching assessments recorded despite active placements -- the absence of documented matching assessments means the home cannot evidence that Reg 36 admission and matching requirements have been met. This is likely to be identified as a significant shortfall in any Ofsted inspection.",
      severity: "critical",
    });
  }

  // I15: Multi-agency involvement in disruption prevention
  if (multiAgencyRate >= 80 && totalDisruptionRecords >= 3) {
    insights.push({
      text: `Multi-agency involvement in ${multiAgencyRate}% of disruption prevention cases -- the home effectively engages external professionals to support placement stability, demonstrating strong partnership working.`,
      severity: "positive",
    });
  }

  // ==========================================
  // HEADLINE
  // ==========================================

  let headline = "";
  if (stability_rating === "outstanding") {
    headline =
      "Exceptional placement stability and permanence -- robust matching, effective disruption prevention, and strong child consultation ensure children experience secure, sustained placements.";
  } else if (stability_rating === "good") {
    headline =
      "Good placement stability and permanence -- matching processes and disruption prevention are effective with some areas for development in consistency across all placement processes.";
  } else if (stability_rating === "adequate") {
    headline =
      "Adequate placement stability -- while some placement processes are in place, matching quality, disruption prevention, or permanence planning need strengthening to ensure all children experience stable placements.";
  } else {
    headline =
      "Inadequate placement stability -- significant gaps in matching quality, disruption prevention, or permanence planning mean children's placement stability cannot be assured.";
  }

  return {
    stability_rating,
    stability_score: score,
    headline,
    placement_stability_rate: placementStabilityRate,
    matching_quality_rate: matchingQualityRate,
    stability_meeting_rate: stabilityMeetingRate,
    disruption_prevention_rate: disruptionPreventionRate,
    planned_ending_rate: plannedEndingRate,
    child_consultation_rate: childConsultationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
