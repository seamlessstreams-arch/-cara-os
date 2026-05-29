// ==============================================================================
// CORNERSTONE -- HOME RESTORATIVE PRACTICE & CONFLICT RESOLUTION INTELLIGENCE ENGINE
// Monitors restorative practice quality -- restorative conference completion,
// conflict resolution effectiveness, relationship repair tracking, mediation
// quality, and child voice in resolution processes.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging with the wider system), Reg 12 (Positive relationships),
// Reg 35 (Behaviour management), SCCIF "Experiences and progress of children".
// Store keys: restorativeConferenceRecords, conflictResolutionRecords,
//             relationshipRepairRecords, mediationRecords, childVoiceRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface RestorativeConferenceRecordInput {
  id: string;
  child_id: string;
  date: string;
  conference_type: "full_conference" | "mini_conference" | "circle" | "shuttle_mediation" | "family_group" | "peer_conference" | "other";
  incident_id: string;
  incident_type: "conflict" | "bullying" | "property_damage" | "verbal_aggression" | "physical_aggression" | "relationship_breakdown" | "rule_breach" | "other";
  facilitator_id: string;
  facilitator_trained: boolean;
  participants_invited: number;
  participants_attended: number;
  child_participated: boolean;
  child_prepared_beforehand: boolean;
  harmed_party_present: boolean;
  harmed_party_views_captured: boolean;
  agreement_reached: boolean;
  agreement_documented: boolean;
  agreement_actions: number;
  agreement_actions_completed: number;
  follow_up_scheduled: boolean;
  follow_up_completed: boolean;
  child_satisfaction: number; // 1-5
  completed: boolean;
  duration_minutes: number;
  created_at: string;
}

export interface ConflictResolutionRecordInput {
  id: string;
  child_id: string;
  date: string;
  conflict_type: "peer_conflict" | "staff_child_conflict" | "family_conflict" | "community_conflict" | "group_conflict" | "other";
  severity: "low" | "medium" | "high" | "critical";
  resolution_method: "restorative_conversation" | "mediation" | "conference" | "problem_solving" | "de_escalation" | "referral" | "other";
  resolved: boolean;
  resolution_time_hours: number;
  both_parties_satisfied: boolean;
  underlying_cause_identified: boolean;
  underlying_cause_addressed: boolean;
  recurrence_within_30_days: boolean;
  sanctions_used: boolean;
  restorative_approach_used: boolean;
  staff_id: string;
  staff_trained_in_restorative: boolean;
  child_voice_captured: boolean;
  follow_up_completed: boolean;
  created_at: string;
}

export interface RelationshipRepairRecordInput {
  id: string;
  child_id: string;
  date: string;
  relationship_type: "peer" | "staff" | "family" | "community" | "professional" | "other";
  other_party_id: string;
  initial_damage_level: "minor" | "moderate" | "significant" | "severe";
  repair_approach: "restorative_conversation" | "joint_activity" | "letter_of_apology" | "mediated_meeting" | "therapeutic_session" | "informal_discussion" | "other";
  repair_initiated_by: "child" | "other_party" | "staff" | "mutual";
  sessions_planned: number;
  sessions_completed: number;
  progress_rating: number; // 1-5 (1=no progress, 5=fully repaired)
  child_feels_heard: boolean;
  other_party_feels_heard: boolean;
  ongoing_support_in_place: boolean;
  relationship_restored: boolean;
  child_satisfaction: number; // 1-5
  created_at: string;
}

export interface MediationRecordInput {
  id: string;
  child_id: string;
  date: string;
  mediation_type: "formal" | "informal" | "peer_mediation" | "adult_mediation" | "shuttle_mediation" | "group_mediation" | "other";
  mediator_id: string;
  mediator_trained: boolean;
  mediator_type: "staff" | "external_mediator" | "peer_mediator" | "independent_advocate" | "other";
  parties_involved: number;
  all_parties_consented: boolean;
  child_prepared: boolean;
  ground_rules_established: boolean;
  each_party_heard: boolean;
  agreement_reached: boolean;
  agreement_documented: boolean;
  agreement_fair_to_all: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  child_satisfaction: number; // 1-5
  mediation_quality_score: number; // 1-5 (staff assessment of process quality)
  duration_minutes: number;
  created_at: string;
}

export interface ChildVoiceRecordInput {
  id: string;
  child_id: string;
  date: string;
  context: "restorative_conference" | "conflict_resolution" | "mediation" | "relationship_repair" | "feedback_session" | "review" | "complaint" | "other";
  voice_captured: boolean;
  capture_method: "direct_conversation" | "written_statement" | "advocate_represented" | "creative_expression" | "questionnaire" | "keywork_session" | "other";
  child_felt_listened_to: boolean;
  child_views_influenced_outcome: boolean;
  child_understood_process: boolean;
  child_felt_safe_to_speak: boolean;
  follow_up_feedback_given: boolean;
  child_satisfaction: number; // 1-5
  barriers_to_participation: string[];
  additional_support_needed: boolean;
  additional_support_provided: boolean;
  created_at: string;
}

export interface RestorativePracticeInput {
  today: string;
  total_children: number;
  restorative_conference_records: RestorativeConferenceRecordInput[];
  conflict_resolution_records: ConflictResolutionRecordInput[];
  relationship_repair_records: RelationshipRepairRecordInput[];
  mediation_records: MediationRecordInput[];
  child_voice_records: ChildVoiceRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type RestorativePracticeRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RestorativePracticeInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RestorativePracticeRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface RestorativePracticeResult {
  restorative_rating: RestorativePracticeRating;
  restorative_score: number;
  headline: string;
  conference_completion_rate: number;
  conflict_resolution_rate: number;
  relationship_repair_rate: number;
  mediation_quality_rate: number;
  child_voice_rate: number;
  satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: RestorativePracticeRecommendation[];
  insights: RestorativePracticeInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): RestorativePracticeRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: RestorativePracticeRating,
  score: number,
  headline: string,
): RestorativePracticeResult {
  return {
    restorative_rating: rating,
    restorative_score: score,
    headline,
    conference_completion_rate: 0,
    conflict_resolution_rate: 0,
    relationship_repair_rate: 0,
    mediation_quality_rate: 0,
    child_voice_rate: 0,
    satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeRestorativePracticeConflictResolution(
  input: RestorativePracticeInput,
): RestorativePracticeResult {
  const {
    total_children,
    restorative_conference_records,
    conflict_resolution_records,
    relationship_repair_records,
    mediation_records,
    child_voice_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    restorative_conference_records.length === 0 &&
    conflict_resolution_records.length === 0 &&
    relationship_repair_records.length === 0 &&
    mediation_records.length === 0 &&
    child_voice_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess restorative practice and conflict resolution.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No restorative practice or conflict resolution data recorded despite children on placement -- restorative conferences, conflict resolution, relationship repair, mediation, and child voice in resolution processes require urgent attention.",
      ),
      concerns: [
        "No restorative conference, conflict resolution, relationship repair, mediation, or child voice records exist despite children being on placement -- the home cannot evidence a restorative approach to behaviour management and conflict resolution.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of restorative conferences, conflict resolution events, relationship repair plans, mediation sessions, and child voice in resolution processes to evidence the home's restorative approach.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
        },
        {
          rank: 2,
          recommendation:
            "Train all staff in restorative practice principles and ensure restorative approaches are embedded in the home's behaviour management policy and daily practice.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
        },
      ],
      insights: [
        {
          text: "The complete absence of restorative practice and conflict resolution records means Ofsted cannot verify that the home uses restorative approaches to manage behaviour, resolve conflict, or repair relationships. This represents a fundamental gap in Reg 12 and Reg 35 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Restorative conference completion ---
  const totalConferences = restorative_conference_records.length;
  const completedConferences = restorative_conference_records.filter((r) => r.completed).length;
  const conferenceCompletionRate = pct(completedConferences, totalConferences);

  const agreementReached = restorative_conference_records.filter((r) => r.agreement_reached).length;
  const agreementRate = pct(agreementReached, totalConferences);

  const agreementDocumented = restorative_conference_records.filter((r) => r.agreement_documented).length;
  const agreementDocumentedRate = pct(agreementDocumented, totalConferences);

  const totalAgreementActions = restorative_conference_records.reduce(
    (sum, r) => sum + r.agreement_actions, 0,
  );
  const totalAgreementActionsCompleted = restorative_conference_records.reduce(
    (sum, r) => sum + r.agreement_actions_completed, 0,
  );
  const agreementActionCompletionRate = pct(totalAgreementActionsCompleted, totalAgreementActions);

  const childParticipated = restorative_conference_records.filter((r) => r.child_participated).length;
  const childParticipationRate = pct(childParticipated, totalConferences);

  const childPrepared = restorative_conference_records.filter((r) => r.child_prepared_beforehand).length;
  const childPreparationRate = pct(childPrepared, totalConferences);

  const harmedPartyPresent = restorative_conference_records.filter((r) => r.harmed_party_present).length;
  const harmedPartyPresentRate = pct(harmedPartyPresent, totalConferences);

  const harmedPartyViewsCaptured = restorative_conference_records.filter((r) => r.harmed_party_views_captured).length;
  const harmedPartyViewsRate = pct(harmedPartyViewsCaptured, totalConferences);

  const facilitatorTrained = restorative_conference_records.filter((r) => r.facilitator_trained).length;
  const facilitatorTrainedRate = pct(facilitatorTrained, totalConferences);

  const followUpScheduled = restorative_conference_records.filter((r) => r.follow_up_scheduled).length;
  const followUpScheduledRate = pct(followUpScheduled, totalConferences);

  const followUpCompleted = restorative_conference_records.filter((r) => r.follow_up_completed).length;
  const conferenceFollowUpCompletionRate = pct(followUpCompleted, followUpScheduled);

  const totalParticipantsInvited = restorative_conference_records.reduce(
    (sum, r) => sum + r.participants_invited, 0,
  );
  const totalParticipantsAttended = restorative_conference_records.reduce(
    (sum, r) => sum + r.participants_attended, 0,
  );
  const participantAttendanceRate = pct(totalParticipantsAttended, totalParticipantsInvited);

  const conferenceSatisfactionSum = restorative_conference_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const conferenceSatisfactionAvg =
    totalConferences > 0
      ? Math.round((conferenceSatisfactionSum / totalConferences) * 100) / 100
      : 0;

  // --- Conflict resolution effectiveness ---
  const totalConflicts = conflict_resolution_records.length;
  const resolvedConflicts = conflict_resolution_records.filter((r) => r.resolved).length;
  const conflictResolutionRate = pct(resolvedConflicts, totalConflicts);

  const bothPartiesSatisfied = conflict_resolution_records.filter((r) => r.both_parties_satisfied).length;
  const bothPartiesSatisfiedRate = pct(bothPartiesSatisfied, totalConflicts);

  const underlyingCauseIdentified = conflict_resolution_records.filter((r) => r.underlying_cause_identified).length;
  const underlyingCauseIdentifiedRate = pct(underlyingCauseIdentified, totalConflicts);

  const underlyingCauseAddressed = conflict_resolution_records.filter((r) => r.underlying_cause_addressed).length;
  const underlyingCauseAddressedRate = pct(underlyingCauseAddressed, underlyingCauseIdentified);

  const recurrenceWithin30Days = conflict_resolution_records.filter((r) => r.recurrence_within_30_days).length;
  const recurrenceRate = pct(recurrenceWithin30Days, totalConflicts);

  const restorativeApproachUsed = conflict_resolution_records.filter((r) => r.restorative_approach_used).length;
  const restorativeApproachRate = pct(restorativeApproachUsed, totalConflicts);

  const sanctionsUsed = conflict_resolution_records.filter((r) => r.sanctions_used).length;
  const sanctionsRate = pct(sanctionsUsed, totalConflicts);

  const conflictStaffTrained = conflict_resolution_records.filter((r) => r.staff_trained_in_restorative).length;
  const conflictStaffTrainedRate = pct(conflictStaffTrained, totalConflicts);

  const conflictVoiceCaptured = conflict_resolution_records.filter((r) => r.child_voice_captured).length;
  const conflictVoiceCapturedRate = pct(conflictVoiceCaptured, totalConflicts);

  const conflictFollowUpCompleted = conflict_resolution_records.filter((r) => r.follow_up_completed).length;
  const conflictFollowUpRate = pct(conflictFollowUpCompleted, totalConflicts);

  const highSeverityConflicts = conflict_resolution_records.filter(
    (r) => r.severity === "high" || r.severity === "critical",
  ).length;
  const highSeverityRate = pct(highSeverityConflicts, totalConflicts);

  const highSeverityResolved = conflict_resolution_records.filter(
    (r) => (r.severity === "high" || r.severity === "critical") && r.resolved,
  ).length;
  const highSeverityResolutionRate = pct(highSeverityResolved, highSeverityConflicts);

  // Average resolution time
  const resolvedWithTime = conflict_resolution_records.filter((r) => r.resolved && r.resolution_time_hours > 0);
  const avgResolutionTimeHours =
    resolvedWithTime.length > 0
      ? Math.round(
          (resolvedWithTime.reduce((sum, r) => sum + r.resolution_time_hours, 0) /
            resolvedWithTime.length) * 10,
        ) / 10
      : 0;

  // --- Relationship repair tracking ---
  const totalRepairRecords = relationship_repair_records.length;
  const relationshipRestored = relationship_repair_records.filter((r) => r.relationship_restored).length;
  const relationshipRepairRate = pct(relationshipRestored, totalRepairRecords);

  const totalRepairSessionsPlanned = relationship_repair_records.reduce(
    (sum, r) => sum + r.sessions_planned, 0,
  );
  const totalRepairSessionsCompleted = relationship_repair_records.reduce(
    (sum, r) => sum + r.sessions_completed, 0,
  );
  const repairSessionCompletionRate = pct(totalRepairSessionsCompleted, totalRepairSessionsPlanned);

  const childFeelsHeard = relationship_repair_records.filter((r) => r.child_feels_heard).length;
  const childFeelsHeardRate = pct(childFeelsHeard, totalRepairRecords);

  const otherPartyFeelsHeard = relationship_repair_records.filter((r) => r.other_party_feels_heard).length;
  const otherPartyFeelsHeardRate = pct(otherPartyFeelsHeard, totalRepairRecords);

  const ongoingSupportInPlace = relationship_repair_records.filter((r) => r.ongoing_support_in_place).length;
  const ongoingSupportRate = pct(ongoingSupportInPlace, totalRepairRecords);

  const childInitiatedRepair = relationship_repair_records.filter((r) => r.repair_initiated_by === "child").length;
  const childInitiatedRepairRate = pct(childInitiatedRepair, totalRepairRecords);

  const mutualInitiatedRepair = relationship_repair_records.filter((r) => r.repair_initiated_by === "mutual").length;
  const mutualInitiatedRate = pct(mutualInitiatedRepair, totalRepairRecords);

  const progressRatingSum = relationship_repair_records.reduce(
    (sum, r) => sum + r.progress_rating, 0,
  );
  const progressRatingAvg =
    totalRepairRecords > 0
      ? Math.round((progressRatingSum / totalRepairRecords) * 100) / 100
      : 0;

  const repairSatisfactionSum = relationship_repair_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const repairSatisfactionAvg =
    totalRepairRecords > 0
      ? Math.round((repairSatisfactionSum / totalRepairRecords) * 100) / 100
      : 0;

  const severeRepairs = relationship_repair_records.filter(
    (r) => r.initial_damage_level === "severe" || r.initial_damage_level === "significant",
  ).length;
  const severeRepairsRestored = relationship_repair_records.filter(
    (r) => (r.initial_damage_level === "severe" || r.initial_damage_level === "significant") && r.relationship_restored,
  ).length;
  const severeRepairSuccessRate = pct(severeRepairsRestored, severeRepairs);

  // --- Mediation quality ---
  const totalMediations = mediation_records.length;
  const mediationAgreementReached = mediation_records.filter((r) => r.agreement_reached).length;
  const mediationAgreementRate = pct(mediationAgreementReached, totalMediations);

  const mediationAgreementDocumented = mediation_records.filter((r) => r.agreement_documented).length;
  const mediationDocumentedRate = pct(mediationAgreementDocumented, totalMediations);

  const mediationFairToAll = mediation_records.filter((r) => r.agreement_fair_to_all).length;
  const mediationFairnessRate = pct(mediationFairToAll, totalMediations);

  const mediatorTrained = mediation_records.filter((r) => r.mediator_trained).length;
  const mediatorTrainedRate = pct(mediatorTrained, totalMediations);

  const allPartiesConsented = mediation_records.filter((r) => r.all_parties_consented).length;
  const consentRate = pct(allPartiesConsented, totalMediations);

  const childPreparedForMediation = mediation_records.filter((r) => r.child_prepared).length;
  const mediationPreparationRate = pct(childPreparedForMediation, totalMediations);

  const groundRulesEstablished = mediation_records.filter((r) => r.ground_rules_established).length;
  const groundRulesRate = pct(groundRulesEstablished, totalMediations);

  const eachPartyHeard = mediation_records.filter((r) => r.each_party_heard).length;
  const eachPartyHeardRate = pct(eachPartyHeard, totalMediations);

  const mediationFollowUpCompleted = mediation_records.filter((r) => r.follow_up_completed).length;
  const mediationFollowUpRate = pct(mediationFollowUpCompleted, totalMediations);

  const mediationQualityScoreSum = mediation_records.reduce(
    (sum, r) => sum + r.mediation_quality_score, 0,
  );
  const mediationQualityAvg =
    totalMediations > 0
      ? Math.round((mediationQualityScoreSum / totalMediations) * 100) / 100
      : 0;
  const mediationQualityRate = totalMediations > 0 ? Math.round(mediationQualityAvg * 20) : 0; // convert 1-5 to 0-100 scale

  const mediationSatisfactionSum = mediation_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const mediationSatisfactionAvg =
    totalMediations > 0
      ? Math.round((mediationSatisfactionSum / totalMediations) * 100) / 100
      : 0;

  const peerMediation = mediation_records.filter((r) => r.mediation_type === "peer_mediation").length;
  const peerMediationRate = pct(peerMediation, totalMediations);

  // --- Child voice composite ---
  const totalVoiceRecords = child_voice_records.length;
  const voiceCaptured = child_voice_records.filter((r) => r.voice_captured).length;
  const voiceCapturedRate = pct(voiceCaptured, totalVoiceRecords);

  const feltListenedTo = child_voice_records.filter((r) => r.child_felt_listened_to).length;
  const feltListenedToRate = pct(feltListenedTo, totalVoiceRecords);

  const viewsInfluencedOutcome = child_voice_records.filter((r) => r.child_views_influenced_outcome).length;
  const viewsInfluencedRate = pct(viewsInfluencedOutcome, totalVoiceRecords);

  const understoodProcess = child_voice_records.filter((r) => r.child_understood_process).length;
  const understoodProcessRate = pct(understoodProcess, totalVoiceRecords);

  const feltSafeToSpeak = child_voice_records.filter((r) => r.child_felt_safe_to_speak).length;
  const feltSafeToSpeakRate = pct(feltSafeToSpeak, totalVoiceRecords);

  const followUpFeedbackGiven = child_voice_records.filter((r) => r.follow_up_feedback_given).length;
  const followUpFeedbackRate = pct(followUpFeedbackGiven, totalVoiceRecords);

  const additionalSupportNeeded = child_voice_records.filter((r) => r.additional_support_needed).length;
  const additionalSupportProvided = child_voice_records.filter(
    (r) => r.additional_support_needed && r.additional_support_provided,
  ).length;
  const additionalSupportProvisionRate = pct(additionalSupportProvided, additionalSupportNeeded);

  const voiceBarriersPresent = child_voice_records.filter(
    (r) => r.barriers_to_participation.length > 0,
  ).length;
  const voiceBarrierRate = pct(voiceBarriersPresent, totalVoiceRecords);

  const voiceSatisfactionSum = child_voice_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const voiceSatisfactionAvg =
    totalVoiceRecords > 0
      ? Math.round((voiceSatisfactionSum / totalVoiceRecords) * 100) / 100
      : 0;

  // --- Composite child voice rate across all domains ---
  const compositeVoiceNumerator =
    voiceCaptured + conflictVoiceCaptured + childParticipated;
  const compositeVoiceDenominator =
    totalVoiceRecords + totalConflicts + totalConferences;
  const childVoiceRate = pct(compositeVoiceNumerator, compositeVoiceDenominator);

  // --- Overall satisfaction composite ---
  const satisfactionSources: number[] = [];
  if (totalConferences > 0) satisfactionSources.push(conferenceSatisfactionAvg);
  if (totalRepairRecords > 0) satisfactionSources.push(repairSatisfactionAvg);
  if (totalMediations > 0) satisfactionSources.push(mediationSatisfactionAvg);
  if (totalVoiceRecords > 0) satisfactionSources.push(voiceSatisfactionAvg);
  const overallSatisfactionAvg =
    satisfactionSources.length > 0
      ? Math.round(
          (satisfactionSources.reduce((sum, v) => sum + v, 0) / satisfactionSources.length) * 100,
        ) / 100
      : 0;
  const satisfactionRate = satisfactionSources.length > 0 ? Math.round(overallSatisfactionAvg * 20) : 0; // 1-5 -> 0-100

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: conferenceCompletionRate (>=90: +4, >=70: +2) ---
  if (conferenceCompletionRate >= 90) score += 4;
  else if (conferenceCompletionRate >= 70) score += 2;

  // --- Bonus 2: conflictResolutionRate (>=85: +4, >=70: +2) ---
  if (conflictResolutionRate >= 85) score += 4;
  else if (conflictResolutionRate >= 70) score += 2;

  // --- Bonus 3: relationshipRepairRate (>=80: +3, >=60: +1) ---
  if (relationshipRepairRate >= 80) score += 3;
  else if (relationshipRepairRate >= 60) score += 1;

  // --- Bonus 4: mediationQualityRate (>=80: +3, >=60: +1) ---
  if (mediationQualityRate >= 80) score += 3;
  else if (mediationQualityRate >= 60) score += 1;

  // --- Bonus 5: childVoiceRate (>=85: +4, >=65: +2) ---
  if (childVoiceRate >= 85) score += 4;
  else if (childVoiceRate >= 65) score += 2;

  // --- Bonus 6: restorativeApproachRate (>=90: +3, >=70: +1) ---
  if (restorativeApproachRate >= 90) score += 3;
  else if (restorativeApproachRate >= 70) score += 1;

  // --- Bonus 7: agreementActionCompletionRate (>=90: +3, >=70: +1) ---
  if (agreementActionCompletionRate >= 90) score += 3;
  else if (agreementActionCompletionRate >= 70) score += 1;

  // --- Bonus 8: satisfactionRate (>=80: +2, >=60: +1) ---
  if (satisfactionRate >= 80) score += 2;
  else if (satisfactionRate >= 60) score += 1;

  // --- Bonus 9: facilitatorTrainedRate (>=90: +2, >=70: +1) ---
  if (facilitatorTrainedRate >= 90) score += 2;
  else if (facilitatorTrainedRate >= 70) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // conferenceCompletionRate < 50 -> -5
  if (conferenceCompletionRate < 50 && totalConferences > 0) score -= 5;

  // conflictResolutionRate < 50 -> -5
  if (conflictResolutionRate < 50 && totalConflicts > 0) score -= 5;

  // childVoiceRate < 40 -> -4
  if (childVoiceRate < 40 && compositeVoiceDenominator > 0) score -= 4;

  // recurrenceRate > 40 -> -4
  if (recurrenceRate > 40 && totalConflicts > 0) score -= 4;

  score = clamp(score, 0, 100);

  const restorative_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (conferenceCompletionRate >= 90 && totalConferences > 0) {
    strengths.push(
      `${conferenceCompletionRate}% of restorative conferences completed -- the home demonstrates consistent commitment to following through on restorative processes.`,
    );
  } else if (conferenceCompletionRate >= 70 && totalConferences > 0) {
    strengths.push(
      `${conferenceCompletionRate}% restorative conference completion rate -- most conferences are being seen through to completion.`,
    );
  }

  if (agreementRate >= 90 && totalConferences > 0) {
    strengths.push(
      `Agreements reached in ${agreementRate}% of restorative conferences -- skilled facilitation is enabling parties to find common ground and agree resolutions.`,
    );
  } else if (agreementRate >= 70 && totalConferences > 0) {
    strengths.push(
      `Agreements reached in ${agreementRate}% of conferences -- good practice in achieving restorative outcomes.`,
    );
  }

  if (agreementActionCompletionRate >= 90 && totalAgreementActions > 0) {
    strengths.push(
      `${agreementActionCompletionRate}% of agreement actions completed -- the home follows through on restorative commitments, demonstrating that agreements are meaningful and enforced.`,
    );
  } else if (agreementActionCompletionRate >= 70 && totalAgreementActions > 0) {
    strengths.push(
      `${agreementActionCompletionRate}% agreement action completion rate -- good follow-through on restorative commitments.`,
    );
  }

  if (childParticipationRate >= 90 && totalConferences > 0) {
    strengths.push(
      `Children participate in ${childParticipationRate}% of restorative conferences -- children are actively involved in resolving issues that affect them.`,
    );
  }

  if (childPreparationRate >= 85 && totalConferences > 0) {
    strengths.push(
      `${childPreparationRate}% of children prepared beforehand for restorative conferences -- children are supported to understand the process and participate meaningfully.`,
    );
  }

  if (facilitatorTrainedRate >= 90 && totalConferences > 0) {
    strengths.push(
      `${facilitatorTrainedRate}% of conference facilitators are trained in restorative practice -- skilled facilitation ensures quality restorative processes.`,
    );
  }

  if (conflictResolutionRate >= 85 && totalConflicts > 0) {
    strengths.push(
      `${conflictResolutionRate}% conflict resolution rate -- the home is highly effective at resolving conflicts between and involving children.`,
    );
  } else if (conflictResolutionRate >= 70 && totalConflicts > 0) {
    strengths.push(
      `${conflictResolutionRate}% conflict resolution rate -- most conflicts are being successfully resolved.`,
    );
  }

  if (restorativeApproachRate >= 90 && totalConflicts > 0) {
    strengths.push(
      `Restorative approaches used in ${restorativeApproachRate}% of conflict resolution -- the home consistently prioritises restorative over punitive responses.`,
    );
  } else if (restorativeApproachRate >= 70 && totalConflicts > 0) {
    strengths.push(
      `Restorative approaches used in ${restorativeApproachRate}% of conflicts -- good commitment to restorative practice principles.`,
    );
  }

  if (bothPartiesSatisfiedRate >= 80 && totalConflicts > 0) {
    strengths.push(
      `Both parties satisfied in ${bothPartiesSatisfiedRate}% of conflict resolutions -- resolutions are fair and perceived as equitable by all involved.`,
    );
  }

  if (underlyingCauseIdentifiedRate >= 80 && totalConflicts > 0) {
    strengths.push(
      `Underlying causes identified in ${underlyingCauseIdentifiedRate}% of conflicts -- the home goes beyond surface-level resolution to understand root causes of conflict.`,
    );
  }

  if (recurrenceRate <= 10 && totalConflicts > 0) {
    strengths.push(
      `Conflict recurrence rate of only ${recurrenceRate}% within 30 days -- resolutions are durable and effective at preventing repeat conflicts.`,
    );
  } else if (recurrenceRate <= 20 && totalConflicts > 0) {
    strengths.push(
      `Conflict recurrence rate of ${recurrenceRate}% within 30 days -- most resolutions hold and prevent repeat conflicts.`,
    );
  }

  if (relationshipRepairRate >= 80 && totalRepairRecords > 0) {
    strengths.push(
      `${relationshipRepairRate}% of damaged relationships successfully repaired -- the home demonstrates exceptional commitment to healing and restoring connections.`,
    );
  } else if (relationshipRepairRate >= 60 && totalRepairRecords > 0) {
    strengths.push(
      `${relationshipRepairRate}% relationship repair success rate -- most relationships are being successfully restored.`,
    );
  }

  if (childFeelsHeardRate >= 90 && totalRepairRecords > 0) {
    strengths.push(
      `Children feel heard in ${childFeelsHeardRate}% of relationship repair processes -- children's voices are central to the repair journey.`,
    );
  }

  if (repairSessionCompletionRate >= 85 && totalRepairSessionsPlanned > 0) {
    strengths.push(
      `${repairSessionCompletionRate}% of planned repair sessions completed -- the home follows through on structured relationship repair plans.`,
    );
  }

  if (childInitiatedRepairRate >= 30 && totalRepairRecords > 0) {
    strengths.push(
      `${childInitiatedRepairRate}% of relationship repairs initiated by children -- children are developing the confidence and skills to take responsibility for repairing relationships.`,
    );
  }

  if (progressRatingAvg >= 4.0 && totalRepairRecords > 0) {
    strengths.push(
      `Average relationship repair progress rating of ${progressRatingAvg}/5 -- meaningful and sustained progress in restoring damaged relationships.`,
    );
  }

  if (mediationAgreementRate >= 85 && totalMediations > 0) {
    strengths.push(
      `Agreements reached in ${mediationAgreementRate}% of mediations -- skilled mediation enables constructive dialogue and mutually acceptable outcomes.`,
    );
  } else if (mediationAgreementRate >= 70 && totalMediations > 0) {
    strengths.push(
      `Agreements reached in ${mediationAgreementRate}% of mediations -- good success rate in mediated resolution.`,
    );
  }

  if (mediatorTrainedRate >= 90 && totalMediations > 0) {
    strengths.push(
      `${mediatorTrainedRate}% of mediators are trained -- high-quality mediation delivery through properly skilled practitioners.`,
    );
  }

  if (eachPartyHeardRate >= 90 && totalMediations > 0) {
    strengths.push(
      `Each party heard in ${eachPartyHeardRate}% of mediations -- the mediation process ensures all voices are genuinely listened to and considered.`,
    );
  }

  if (mediationFairnessRate >= 85 && totalMediations > 0) {
    strengths.push(
      `Agreements judged fair to all parties in ${mediationFairnessRate}% of mediations -- outcomes are balanced and equitable.`,
    );
  }

  if (mediationQualityAvg >= 4.0 && totalMediations > 0) {
    strengths.push(
      `Mediation quality averages ${mediationQualityAvg}/5 -- consistently high-quality mediation processes.`,
    );
  }

  if (peerMediationRate >= 20 && totalMediations > 0) {
    strengths.push(
      `${peerMediationRate}% of mediations are peer-led -- children are developing mediation skills and taking active roles in conflict resolution.`,
    );
  }

  if (voiceCapturedRate >= 90 && totalVoiceRecords > 0) {
    strengths.push(
      `Child voice captured in ${voiceCapturedRate}% of resolution processes -- children's views are consistently sought and recorded.`,
    );
  }

  if (feltListenedToRate >= 90 && totalVoiceRecords > 0) {
    strengths.push(
      `${feltListenedToRate}% of children felt genuinely listened to -- children experience authentic participation in resolution processes.`,
    );
  }

  if (viewsInfluencedRate >= 80 && totalVoiceRecords > 0) {
    strengths.push(
      `Children's views influenced outcomes in ${viewsInfluencedRate}% of cases -- child voice genuinely shapes resolutions rather than being tokenistic.`,
    );
  }

  if (feltSafeToSpeakRate >= 90 && totalVoiceRecords > 0) {
    strengths.push(
      `${feltSafeToSpeakRate}% of children felt safe to speak -- the home creates psychologically safe environments for children to express themselves during resolution processes.`,
    );
  }

  if (satisfactionRate >= 80) {
    strengths.push(
      `Overall satisfaction rate of ${satisfactionRate}% across restorative processes -- children feel well supported throughout conflict resolution and relationship repair.`,
    );
  }

  if (conflictStaffTrainedRate >= 90 && totalConflicts > 0) {
    strengths.push(
      `${conflictStaffTrainedRate}% of conflict-resolving staff trained in restorative practice -- the team has the skills to manage conflict restoratively.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (conferenceCompletionRate < 50 && totalConferences > 0) {
    concerns.push(
      `Only ${conferenceCompletionRate}% of restorative conferences completed -- the majority of conferences are not being seen through, undermining the restorative process and denying children the opportunity for resolution.`,
    );
  } else if (conferenceCompletionRate < 70 && conferenceCompletionRate >= 50 && totalConferences > 0) {
    concerns.push(
      `Restorative conference completion rate at ${conferenceCompletionRate}% -- too many conferences are not reaching conclusion, weakening the home's restorative approach.`,
    );
  }

  if (agreementRate < 50 && totalConferences > 0) {
    concerns.push(
      `Agreements reached in only ${agreementRate}% of restorative conferences -- conferences are frequently failing to achieve resolution, suggesting issues with facilitation quality or process design.`,
    );
  } else if (agreementRate < 70 && agreementRate >= 50 && totalConferences > 0) {
    concerns.push(
      `Agreement rate of ${agreementRate}% in restorative conferences -- some conferences are not achieving outcomes, requiring review of facilitation approaches.`,
    );
  }

  if (agreementActionCompletionRate < 50 && totalAgreementActions > 0) {
    concerns.push(
      `Only ${agreementActionCompletionRate}% of agreement actions completed -- restorative agreements are not being honoured, which damages trust in the process and teaches children that commitments are not meaningful.`,
    );
  }

  if (facilitatorTrainedRate < 70 && totalConferences > 0) {
    concerns.push(
      `Only ${facilitatorTrainedRate}% of conference facilitators trained in restorative practice -- untrained facilitation risks poor outcomes and may cause further harm.`,
    );
  }

  if (childPreparationRate < 50 && totalConferences > 0) {
    concerns.push(
      `Only ${childPreparationRate}% of children prepared before restorative conferences -- children are entering processes unprepared, which may increase anxiety and reduce meaningful participation.`,
    );
  }

  if (conflictResolutionRate < 50 && totalConflicts > 0) {
    concerns.push(
      `Only ${conflictResolutionRate}% of conflicts resolved -- the majority of conflicts remain unresolved, creating a toxic environment and increasing risk of escalation and harm.`,
    );
  } else if (conflictResolutionRate < 70 && conflictResolutionRate >= 50 && totalConflicts > 0) {
    concerns.push(
      `Conflict resolution rate at ${conflictResolutionRate}% -- too many conflicts are left unresolved, impacting children's sense of safety and wellbeing.`,
    );
  }

  if (restorativeApproachRate < 50 && totalConflicts > 0) {
    concerns.push(
      `Restorative approaches used in only ${restorativeApproachRate}% of conflicts -- the home is predominantly relying on non-restorative methods to manage conflict, contrary to best practice under Reg 35.`,
    );
  } else if (restorativeApproachRate < 70 && restorativeApproachRate >= 50 && totalConflicts > 0) {
    concerns.push(
      `Restorative approaches used in ${restorativeApproachRate}% of conflicts -- the home needs to strengthen its commitment to restorative practice as the primary conflict resolution method.`,
    );
  }

  if (recurrenceRate > 40 && totalConflicts > 0) {
    concerns.push(
      `${recurrenceRate}% conflict recurrence rate within 30 days -- resolutions are not holding, suggesting underlying causes are not being addressed and children are trapped in cycles of conflict.`,
    );
  } else if (recurrenceRate > 25 && recurrenceRate <= 40 && totalConflicts > 0) {
    concerns.push(
      `${recurrenceRate}% conflict recurrence rate within 30 days -- a significant proportion of resolved conflicts reoccur, indicating resolutions may be superficial.`,
    );
  }

  if (sanctionsRate > 50 && totalConflicts > 0) {
    concerns.push(
      `Sanctions used in ${sanctionsRate}% of conflict resolutions -- the home is over-relying on punitive responses rather than restorative approaches, contrary to Reg 35 expectations.`,
    );
  }

  if (bothPartiesSatisfiedRate < 50 && totalConflicts > 0) {
    concerns.push(
      `Both parties satisfied in only ${bothPartiesSatisfiedRate}% of resolutions -- resolutions are perceived as unfair or one-sided, undermining trust in the process.`,
    );
  }

  if (underlyingCauseIdentifiedRate < 50 && totalConflicts > 0) {
    concerns.push(
      `Underlying causes identified in only ${underlyingCauseIdentifiedRate}% of conflicts -- the home is treating symptoms rather than root causes, which drives recurrence and escalation.`,
    );
  }

  if (conflictStaffTrainedRate < 50 && totalConflicts > 0) {
    concerns.push(
      `Only ${conflictStaffTrainedRate}% of conflict-resolving staff trained in restorative practice -- untrained staff cannot deliver effective restorative resolution and may inadvertently escalate situations.`,
    );
  }

  if (relationshipRepairRate < 40 && totalRepairRecords > 0) {
    concerns.push(
      `Only ${relationshipRepairRate}% of damaged relationships successfully repaired -- the majority of relationship breakdowns are not being resolved, leaving children in fractured relationships.`,
    );
  } else if (relationshipRepairRate < 60 && relationshipRepairRate >= 40 && totalRepairRecords > 0) {
    concerns.push(
      `Relationship repair rate at ${relationshipRepairRate}% -- too many damaged relationships are not being successfully restored.`,
    );
  }

  if (childFeelsHeardRate < 50 && totalRepairRecords > 0) {
    concerns.push(
      `Children feel heard in only ${childFeelsHeardRate}% of relationship repair processes -- children's voices are not central to the repair journey, undermining the restorative ethos.`,
    );
  }

  if (repairSessionCompletionRate < 50 && totalRepairSessionsPlanned > 0) {
    concerns.push(
      `Only ${repairSessionCompletionRate}% of planned repair sessions completed -- relationship repair plans are not being followed through, denying children sustained support.`,
    );
  }

  if (mediationAgreementRate < 50 && totalMediations > 0) {
    concerns.push(
      `Agreements reached in only ${mediationAgreementRate}% of mediations -- mediation processes are frequently failing to achieve resolution, suggesting quality or process issues.`,
    );
  } else if (mediationAgreementRate < 70 && mediationAgreementRate >= 50 && totalMediations > 0) {
    concerns.push(
      `Mediation agreement rate at ${mediationAgreementRate}% -- some mediations are not achieving outcomes, requiring review.`,
    );
  }

  if (mediatorTrainedRate < 60 && totalMediations > 0) {
    concerns.push(
      `Only ${mediatorTrainedRate}% of mediators are trained -- untrained mediators risk poor process quality and may cause further harm to parties.`,
    );
  }

  if (eachPartyHeardRate < 70 && totalMediations > 0) {
    concerns.push(
      `Each party heard in only ${eachPartyHeardRate}% of mediations -- the mediation process is not consistently ensuring all voices are included.`,
    );
  }

  if (mediationQualityAvg < 3.0 && totalMediations > 0) {
    concerns.push(
      `Mediation quality averages only ${mediationQualityAvg}/5 -- overall mediation process quality is poor and requires urgent improvement.`,
    );
  }

  if (childVoiceRate < 40 && compositeVoiceDenominator > 0) {
    concerns.push(
      `Child voice captured in only ${childVoiceRate}% of resolution processes -- children's perspectives are largely absent from conflict resolution, which is a fundamental failure of the restorative approach.`,
    );
  } else if (childVoiceRate < 60 && childVoiceRate >= 40 && compositeVoiceDenominator > 0) {
    concerns.push(
      `Child voice rate at ${childVoiceRate}% -- children's views are not consistently captured or acted upon in resolution processes.`,
    );
  }

  if (feltListenedToRate < 50 && totalVoiceRecords > 0) {
    concerns.push(
      `Only ${feltListenedToRate}% of children felt genuinely listened to -- children perceive the resolution process as not truly hearing them.`,
    );
  }

  if (viewsInfluencedRate < 50 && totalVoiceRecords > 0) {
    concerns.push(
      `Children's views influenced outcomes in only ${viewsInfluencedRate}% of cases -- child voice is tokenistic rather than genuinely shaping resolutions.`,
    );
  }

  if (feltSafeToSpeakRate < 60 && totalVoiceRecords > 0) {
    concerns.push(
      `Only ${feltSafeToSpeakRate}% of children felt safe to speak during resolution processes -- children do not feel psychologically safe to express themselves, which undermines the entire restorative approach.`,
    );
  }

  if (voiceBarrierRate >= 30 && totalVoiceRecords > 0) {
    concerns.push(
      `Barriers to participation present in ${voiceBarrierRate}% of child voice records -- persistent barriers are preventing children from engaging in resolution processes.`,
    );
  }

  if (satisfactionRate < 50) {
    concerns.push(
      `Overall satisfaction rate of only ${satisfactionRate}% across restorative processes -- children do not feel well served by the home's approach to conflict resolution and relationship repair.`,
    );
  }

  if (totalConferences === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No restorative conference records despite children being on placement -- the home may not be using formal restorative processes to address conflict and behavioural incidents.",
    );
  }

  if (totalConflicts === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No conflict resolution records -- the home has not documented any conflict resolution activity, making it impossible to evidence how conflicts are managed restoratively.",
    );
  }

  if (totalVoiceRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child voice records in resolution processes -- the home cannot evidence that children's views are sought and considered in conflict resolution and restorative practice.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: RestorativePracticeRecommendation[] = [];
  let rank = 0;

  if (conferenceCompletionRate < 50 && totalConferences > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review why restorative conferences are not being completed -- identify barriers to completion (time, staffing, participant willingness) and implement solutions to ensure every conference reaches a meaningful conclusion.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (conflictResolutionRate < 50 && totalConflicts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate improvements to conflict resolution effectiveness -- unresolved conflicts create an unsafe environment. Review staff skills, response times, and resolution methods to achieve at least 70% resolution rate.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (childVoiceRate < 40 && compositeVoiceDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed child voice in all restorative and conflict resolution processes -- every child must have a genuine opportunity to be heard, to understand the process, and to influence the outcome. Train staff in child-centred facilitation techniques.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (recurrenceRate > 40 && totalConflicts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the high conflict recurrence rate by focusing on identifying and resolving underlying causes of conflict rather than surface-level symptoms. Implement post-resolution follow-up plans and monitor for recurrence patterns.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (restorativeApproachRate < 50 && totalConflicts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Transition from punitive to restorative conflict resolution -- train all staff in restorative approaches and embed restorative practice in the home's behaviour management policy as the primary response to conflict.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (facilitatorTrainedRate < 70 && totalConferences > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all staff facilitating restorative conferences are trained in restorative practice -- untrained facilitation risks poor outcomes and may re-traumatise children. Arrange accredited restorative practice training for all key staff.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (relationshipRepairRate < 40 && totalRepairRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen relationship repair processes -- develop structured repair plans with clear milestones, assign dedicated staff to support each repair journey, and ensure regular follow-up sessions are completed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (feltSafeToSpeakRate < 60 && totalVoiceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create psychologically safer environments for children during resolution processes -- review preparation, venue, timing, and facilitation style. Consider offering alternative ways for children to contribute (written statements, advocate representation).",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (sanctionsRate > 50 && totalConflicts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reduce reliance on sanctions and increase use of restorative approaches -- review the sanctions policy and ensure staff understand that restorative responses should be the default, with sanctions only used as a last resort.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (agreementActionCompletionRate < 50 && totalAgreementActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a robust tracking system for restorative agreement actions -- assign ownership, set deadlines, and review completion at team meetings. Incomplete actions undermine trust in the restorative process.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (underlyingCauseIdentifiedRate < 50 && totalConflicts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train staff to identify and address underlying causes of conflict -- use structured debrief tools after each conflict to explore triggers, patterns, and contributing factors. Record findings and develop prevention strategies.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (mediatorTrainedRate < 60 && totalMediations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all mediators are properly trained -- invest in mediation skills training for staff and consider developing a peer mediation programme to empower children as mediators.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (mediationAgreementRate < 50 && totalMediations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review mediation process quality and identify why agreements are not being reached -- consider mediator skills, preparation quality, participant readiness, and process design.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (childFeelsHeardRate < 50 && totalRepairRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children feel genuinely heard during relationship repair -- review facilitation techniques, offer children choice in how they communicate, and provide feedback on how their views influenced the repair process.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (childPreparationRate < 50 && totalConferences > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a standard preparation process for children before restorative conferences -- explain the process, clarify expectations, offer advocacy support, and check readiness before proceeding.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (viewsInfluencedRate < 50 && totalVoiceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's views genuinely influence resolution outcomes -- capture voice before decisions are made, feed back to children how their views shaped outcomes, and evidence this in records.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (conflictResolutionRate >= 50 && conflictResolutionRate < 70 && totalConflicts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve conflict resolution rate to at least 70% -- review unresolved conflicts, identify common barriers to resolution, and develop targeted strategies for different conflict types.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (repairSessionCompletionRate < 50 && totalRepairSessionsPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase completion of planned relationship repair sessions -- prioritise repair sessions in staff rotas, protect time for repair work, and monitor completion rates at team meetings.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (conferenceCompletionRate >= 50 && conferenceCompletionRate < 70 && totalConferences > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve conference completion rate to at least 70% -- review why conferences are not completing and address facilitator capacity, participant engagement, and scheduling barriers.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (restorativeApproachRate >= 50 && restorativeApproachRate < 70 && totalConflicts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the use of restorative approaches in conflict resolution to at least 70% -- provide refresher training and embed restorative conversation scripts into daily practice.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (relationshipRepairRate >= 40 && relationshipRepairRate < 60 && totalRepairRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen relationship repair approaches to achieve at least 60% success rate -- consider therapeutic support, extended timelines, and more creative repair approaches for complex situations.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (totalConferences === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement formal restorative conferences as part of the home's response to conflict and behavioural incidents -- develop a conference protocol, train facilitators, and begin recording all restorative conferences.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 -- Positive relationships",
    });
  }

  if (totalConflicts === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin structured recording of all conflict resolution events -- document conflict type, severity, resolution method, outcomes, and follow-up to build an evidence base of the home's restorative approach.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 -- Behaviour management",
    });
  }

  if (totalVoiceRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement systematic child voice capture in all resolution processes -- use structured feedback tools, satisfaction questionnaires, and keywork sessions to ensure children's perspectives are recorded and acted upon.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (voiceBarrierRate >= 30 && totalVoiceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a barriers-to-participation analysis and develop targeted interventions to remove obstacles preventing children from engaging in resolution processes.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: RestorativePracticeInsight[] = [];

  // --- Critical insights ---

  if (conferenceCompletionRate < 50 && totalConferences > 0) {
    insights.push({
      text: `Only ${conferenceCompletionRate}% of restorative conferences completed. Ofsted will view incomplete conferences as evidence that the home initiates but does not follow through on restorative processes -- this undermines trust and demonstrates a lack of commitment to restorative practice under Reg 12.`,
      severity: "critical",
    });
  }

  if (conflictResolutionRate < 50 && totalConflicts > 0) {
    insights.push({
      text: `Only ${conflictResolutionRate}% of conflicts resolved. Unresolved conflict creates an unsafe, unstable environment for children. Ofsted will view this as evidence that the home cannot effectively manage behaviour or maintain positive relationships under Reg 35 and Reg 12.`,
      severity: "critical",
    });
  }

  if (childVoiceRate < 40 && compositeVoiceDenominator > 0) {
    insights.push({
      text: `Child voice captured in only ${childVoiceRate}% of resolution processes. The near-absence of children's perspectives in conflict resolution and restorative practice means the home cannot evidence child-centred approaches. Ofsted expects children to be active participants in processes that affect them.`,
      severity: "critical",
    });
  }

  if (recurrenceRate > 40 && totalConflicts > 0) {
    insights.push({
      text: `${recurrenceRate}% of conflicts recur within 30 days. This high recurrence rate indicates resolutions are superficial and underlying issues are not being addressed. Children are trapped in cycles of conflict that damage their wellbeing and sense of safety.`,
      severity: "critical",
    });
  }

  if (restorativeApproachRate < 50 && totalConflicts > 0) {
    insights.push({
      text: `Restorative approaches used in only ${restorativeApproachRate}% of conflicts. The home is predominantly using non-restorative methods, which is inconsistent with best practice under Reg 35 and the evidence base for effective behaviour management in residential care.`,
      severity: "critical",
    });
  }

  if (sanctionsRate > 50 && totalConflicts > 0) {
    insights.push({
      text: `Sanctions used in ${sanctionsRate}% of conflict resolutions. Over-reliance on punitive responses is contrary to the restorative ethos expected under Reg 35 and can damage children's self-esteem, trust in adults, and willingness to engage in future resolution processes.`,
      severity: "critical",
    });
  }

  if (totalConferences === 0 && totalConflicts === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No restorative conference or conflict resolution records despite children being on placement. Ofsted may interpret the absence of records as evidence that the home has no structured approach to restorative practice and conflict resolution -- a significant gap in Reg 12 and Reg 35 compliance.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (conferenceCompletionRate >= 50 && conferenceCompletionRate < 70 && totalConferences > 0) {
    insights.push({
      text: `Restorative conference completion at ${conferenceCompletionRate}% -- improving but some conferences are not reaching conclusion. Each incomplete conference is a missed opportunity for resolution and learning.`,
      severity: "warning",
    });
  }

  if (conflictResolutionRate >= 50 && conflictResolutionRate < 70 && totalConflicts > 0) {
    insights.push({
      text: `Conflict resolution rate at ${conflictResolutionRate}% -- while more conflicts are being resolved, a significant proportion remain unresolved. The home needs to develop more effective strategies for complex or entrenched conflicts.`,
      severity: "warning",
    });
  }

  if (restorativeApproachRate >= 50 && restorativeApproachRate < 70 && totalConflicts > 0) {
    insights.push({
      text: `Restorative approaches used in ${restorativeApproachRate}% of conflicts -- the home is moving towards a restorative model but non-restorative responses are still too common. Consistent embedding of restorative practice requires ongoing training and supervision.`,
      severity: "warning",
    });
  }

  if (relationshipRepairRate >= 40 && relationshipRepairRate < 60 && totalRepairRecords > 0) {
    insights.push({
      text: `Relationship repair rate at ${relationshipRepairRate}% -- while some relationships are being restored, too many remain damaged. Long-term unrepaired relationships affect children's attachment, trust, and emotional wellbeing.`,
      severity: "warning",
    });
  }

  if (childVoiceRate >= 40 && childVoiceRate < 60 && compositeVoiceDenominator > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceRate}% of resolution processes -- while some consultation is happening, children's perspectives need to be more systematically sought and evidenced.`,
      severity: "warning",
    });
  }

  if (mediationAgreementRate >= 50 && mediationAgreementRate < 70 && totalMediations > 0) {
    insights.push({
      text: `Mediation agreement rate at ${mediationAgreementRate}% -- mediations are achieving some outcomes but the process could be strengthened through better preparation, trained mediators, and structured follow-up.`,
      severity: "warning",
    });
  }

  if (recurrenceRate > 25 && recurrenceRate <= 40 && totalConflicts > 0) {
    insights.push({
      text: `${recurrenceRate}% conflict recurrence within 30 days -- a notable proportion of resolved conflicts reoccur, suggesting that resolution may be addressing symptoms rather than root causes.`,
      severity: "warning",
    });
  }

  if (agreementActionCompletionRate >= 50 && agreementActionCompletionRate < 70 && totalAgreementActions > 0) {
    insights.push({
      text: `Agreement action completion at ${agreementActionCompletionRate}% -- while some commitments are being honoured, inconsistent follow-through weakens trust in the restorative process.`,
      severity: "warning",
    });
  }

  if (bothPartiesSatisfiedRate >= 50 && bothPartiesSatisfiedRate < 80 && totalConflicts > 0) {
    insights.push({
      text: `Both parties satisfied in ${bothPartiesSatisfiedRate}% of resolutions -- while the majority find resolutions acceptable, there is room to improve the fairness and perceived equity of outcomes.`,
      severity: "warning",
    });
  }

  if (feltListenedToRate >= 50 && feltListenedToRate < 80 && totalVoiceRecords > 0) {
    insights.push({
      text: `${feltListenedToRate}% of children felt genuinely listened to -- good but not yet consistent. Some children still feel their voices are not truly heard in resolution processes.`,
      severity: "warning",
    });
  }

  // --- Diversity of conference types ---
  const conferenceTypes = new Set(
    restorative_conference_records.map((r) => r.conference_type).filter((t) => t),
  );
  if (conferenceTypes.size >= 4 && totalConferences >= 5) {
    insights.push({
      text: `The home uses ${conferenceTypes.size} different conference formats -- this diversity of approach demonstrates flexibility and the ability to tailor restorative processes to different situations and children's needs.`,
      severity: "positive",
    });
  }

  // --- Positive insights ---

  if (restorative_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding restorative practice and conflict resolution -- children experience fair, child-centred resolution processes that repair relationships, address root causes, and embed their voices in outcomes. This is strong evidence for Reg 12 and Reg 35 compliance.",
      severity: "positive",
    });
  }

  if (conferenceCompletionRate >= 90 && agreementRate >= 90 && totalConferences > 0) {
    insights.push({
      text: `${conferenceCompletionRate}% conference completion with ${agreementRate}% agreement rate -- restorative conferences are consistently completed and achieving meaningful outcomes. Ofsted will recognise this as exemplary restorative practice.`,
      severity: "positive",
    });
  }

  if (conflictResolutionRate >= 85 && restorativeApproachRate >= 90 && totalConflicts > 0) {
    insights.push({
      text: `${conflictResolutionRate}% conflict resolution using restorative approaches in ${restorativeApproachRate}% of cases -- the home has successfully embedded restorative practice as its primary conflict resolution method, with highly effective outcomes.`,
      severity: "positive",
    });
  }

  if (recurrenceRate <= 10 && conflictResolutionRate >= 80 && totalConflicts > 0) {
    insights.push({
      text: `Only ${recurrenceRate}% conflict recurrence with ${conflictResolutionRate}% resolution rate -- resolutions are durable and effective, indicating that root causes are being addressed and children are learning lasting conflict resolution skills.`,
      severity: "positive",
    });
  }

  if (relationshipRepairRate >= 80 && childFeelsHeardRate >= 90 && totalRepairRecords > 0) {
    insights.push({
      text: `${relationshipRepairRate}% relationship repair success with ${childFeelsHeardRate}% of children feeling heard -- the home excels at restoring damaged relationships while ensuring children's voices drive the repair process. This is evidence of genuinely child-centred restorative practice.`,
      severity: "positive",
    });
  }

  if (childVoiceRate >= 85 && viewsInfluencedRate >= 80 && compositeVoiceDenominator > 0 && totalVoiceRecords > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceRate}% of processes with views influencing ${viewsInfluencedRate}% of outcomes -- children genuinely shape their own resolutions. This is exemplary practice in child participation and a powerful indicator of authentic restorative practice.`,
      severity: "positive",
    });
  }

  if (feltSafeToSpeakRate >= 90 && feltListenedToRate >= 90 && totalVoiceRecords > 0) {
    insights.push({
      text: `${feltSafeToSpeakRate}% of children feel safe to speak and ${feltListenedToRate}% feel genuinely listened to -- the home creates psychologically safe environments where children can express themselves freely. This is fundamental to effective restorative practice.`,
      severity: "positive",
    });
  }

  if (mediationAgreementRate >= 85 && mediatorTrainedRate >= 90 && totalMediations > 0) {
    insights.push({
      text: `${mediationAgreementRate}% mediation agreement rate with ${mediatorTrainedRate}% trained mediators -- skilled mediation is consistently achieving positive outcomes. Ofsted will recognise this as evidence of investment in professional conflict resolution.`,
      severity: "positive",
    });
  }

  if (satisfactionRate >= 80) {
    insights.push({
      text: `Overall satisfaction of ${satisfactionRate}% across restorative processes -- children feel well supported throughout conflict resolution and relationship repair. High satisfaction indicates trust in the process and confidence in adult facilitation.`,
      severity: "positive",
    });
  }

  if (childInitiatedRepairRate >= 30 && mutualInitiatedRate >= 20 && totalRepairRecords > 0) {
    insights.push({
      text: `${childInitiatedRepairRate}% child-initiated and ${mutualInitiatedRate}% mutually-initiated repairs -- children are developing the confidence, empathy, and skills to take responsibility for repairing relationships. This demonstrates embedded restorative values.`,
      severity: "positive",
    });
  }

  if (peerMediationRate >= 20 && mediationAgreementRate >= 70 && totalMediations > 0) {
    insights.push({
      text: `${peerMediationRate}% peer-led mediations with ${mediationAgreementRate}% agreement rate -- children are developing as mediators and peacemakers, building transferable life skills and contributing positively to the home community.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (restorative_rating === "outstanding") {
    headline =
      "Outstanding restorative practice and conflict resolution -- children experience fair, child-centred processes that repair relationships and embed their voices in outcomes.";
  } else if (restorative_rating === "good") {
    headline = `Good restorative practice and conflict resolution -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (restorative_rating === "adequate") {
    headline = `Adequate restorative practice and conflict resolution -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure restorative approaches are consistently applied.`;
  } else {
    headline = `Restorative practice and conflict resolution is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to embed restorative approaches and ensure children's voices shape resolution processes.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    restorative_rating,
    restorative_score: score,
    headline,
    conference_completion_rate: conferenceCompletionRate,
    conflict_resolution_rate: conflictResolutionRate,
    relationship_repair_rate: relationshipRepairRate,
    mediation_quality_rate: mediationQualityRate,
    child_voice_rate: childVoiceRate,
    satisfaction_rate: satisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
