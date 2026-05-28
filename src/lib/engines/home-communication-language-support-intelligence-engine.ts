// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME COMMUNICATION & LANGUAGE SUPPORT INTELLIGENCE ENGINE
// Tracks speech and language support quality — communication assessments,
// speech therapy engagement, communication aid provision, inclusive
// communication practices, and staff training in communication needs.
// Critical for Ofsted under Children's Homes Regulations 2015:
//   Reg 5 (quality of care), Reg 7 (children's views/wishes),
//   Reg 12 (positive relationships), SCCIF voice of the child.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Store keys: communicationAssessmentRecords, speechTherapyRecords,
//             communicationAidRecords, inclusivePracticeRecords,
//             staffCommunicationTrainingRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CommunicationAssessmentRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor: string;
  assessment_type: "initial" | "review" | "specialist" | "annual" | "ad_hoc";
  speech_level_assessed: boolean;
  language_comprehension_assessed: boolean;
  expressive_language_assessed: boolean;
  non_verbal_communication_assessed: boolean;
  communication_needs_identified: boolean;
  needs_documented: boolean;
  support_plan_created: boolean;
  support_plan_reviewed: boolean;
  child_involved_in_assessment: boolean;
  child_views_recorded: boolean;
  outcomes_shared_with_team: boolean;
  progress_rating: number; // 1-5
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface SpeechTherapyRecordInput {
  id: string;
  child_id: string;
  session_date: string;
  therapist: string;
  therapy_type: "individual" | "group" | "consultation" | "review" | "assessment";
  session_attended: boolean;
  session_completed: boolean;
  child_engaged: boolean;
  targets_set: boolean;
  targets_met: boolean;
  home_practice_assigned: boolean;
  home_practice_completed: boolean;
  staff_guidance_provided: boolean;
  progress_rating: number; // 1-5
  next_session_date: string | null;
  discharge_planned: boolean;
  notes: string | null;
  created_at: string;
}

export interface CommunicationAidRecordInput {
  id: string;
  child_id: string;
  aid_type: "visual_schedule" | "pecs" | "makaton" | "aac_device" | "social_story" | "communication_board" | "symbol_system" | "talking_mat" | "digital_app" | "other";
  provision_date: string;
  aid_available: boolean;
  aid_in_use: boolean;
  aid_maintained: boolean;
  child_trained_on_aid: boolean;
  staff_trained_on_aid: boolean;
  effectiveness_rating: number; // 1-5
  review_date: string | null;
  reviewed: boolean;
  child_feedback_positive: boolean;
  replacement_needed: boolean;
  replacement_actioned: boolean;
  notes: string | null;
  created_at: string;
}

export interface InclusivePracticeRecordInput {
  id: string;
  date: string;
  practice_area: "meetings" | "daily_routines" | "activities" | "mealtimes" | "key_sessions" | "house_meetings" | "reviews" | "complaints_process" | "other";
  communication_needs_considered: boolean;
  adaptations_made: boolean;
  adaptation_type: string | null;
  all_children_included: boolean;
  child_feedback_sought: boolean;
  child_feedback_positive: boolean;
  staff_member: string;
  barriers_identified: string | null;
  barriers_addressed: boolean;
  notes: string | null;
  created_at: string;
}

export interface StaffCommunicationTrainingRecordInput {
  id: string;
  staff_id: string;
  training_date: string;
  training_type: "makaton" | "pecs" | "aac" | "autism_communication" | "speech_language_awareness" | "inclusive_communication" | "de_escalation_communication" | "therapeutic_communication" | "general" | "other";
  training_completed: boolean;
  competency_assessed: boolean;
  competency_passed: boolean;
  refresher_due_date: string | null;
  refresher_completed: boolean;
  applied_in_practice: boolean;
  trainer: string | null;
  notes: string | null;
  created_at: string;
}

export interface CommunicationLanguageSupportInput {
  today: string;
  total_children: number;
  communication_assessment_records: CommunicationAssessmentRecordInput[];
  speech_therapy_records: SpeechTherapyRecordInput[];
  communication_aid_records: CommunicationAidRecordInput[];
  inclusive_practice_records: InclusivePracticeRecordInput[];
  staff_communication_training_records: StaffCommunicationTrainingRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type CommunicationSupportRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CommunicationSupportInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface CommunicationSupportRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface CommunicationLanguageSupportResult {
  communication_rating: CommunicationSupportRating;
  communication_score: number;
  headline: string;
  total_assessments: number;
  total_therapy_sessions: number;
  assessment_coverage_rate: number;
  therapy_engagement_rate: number;
  aid_provision_rate: number;
  inclusive_practice_rate: number;
  staff_training_rate: number;
  child_progress_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: CommunicationSupportRecommendation[];
  insights: CommunicationSupportInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): CommunicationSupportRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: CommunicationSupportRating,
  score: number,
  headline: string,
): CommunicationLanguageSupportResult {
  return {
    communication_rating: rating,
    communication_score: score,
    headline,
    total_assessments: 0,
    total_therapy_sessions: 0,
    assessment_coverage_rate: 0,
    therapy_engagement_rate: 0,
    aid_provision_rate: 0,
    inclusive_practice_rate: 0,
    staff_training_rate: 0,
    child_progress_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeCommunicationLanguageSupport(
  input: CommunicationLanguageSupportInput,
): CommunicationLanguageSupportResult {
  const {
    total_children,
    communication_assessment_records,
    speech_therapy_records,
    communication_aid_records,
    inclusive_practice_records,
    staff_communication_training_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    communication_assessment_records.length === 0 &&
    speech_therapy_records.length === 0 &&
    communication_aid_records.length === 0 &&
    inclusive_practice_records.length === 0 &&
    staff_communication_training_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess communication and language support.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No communication or language support data recorded despite children on placement — communication support requires urgent attention.",
      ),
      concerns: [
        "No communication assessments, speech therapy records, communication aids, inclusive practice records, or staff communication training exist despite children being on placement — the home cannot evidence adequate communication and language support.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of communication assessments, speech therapy engagement, communication aid provision, inclusive practices, and staff training to evidence the home's support for children's communication and language needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has a documented communication assessment with identified needs, and that staff are trained to support children's individual communication requirements through inclusive, adapted practices.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Children's views and wishes",
        },
      ],
      insights: [
        {
          text: "The complete absence of communication and language support records means Ofsted cannot verify that children's communication needs are being identified, met, or that inclusive practices are in place. This represents a fundamental gap in Reg 5, Reg 7, and Reg 12 compliance — without this evidence the home cannot demonstrate that every child can express their views, wishes, and feelings.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Communication assessment metrics ---
  const totalAssessments = communication_assessment_records.length;

  const uniqueChildrenAssessed = new Set(
    communication_assessment_records.map((r) => r.child_id),
  ).size;
  const assessmentCoverageRate =
    total_children > 0 ? pct(uniqueChildrenAssessed, total_children) : 0;

  const needsIdentified = communication_assessment_records.filter(
    (r) => r.communication_needs_identified,
  ).length;
  const needsIdentificationRate = pct(needsIdentified, totalAssessments);

  const needsDocumented = communication_assessment_records.filter(
    (r) => r.needs_documented,
  ).length;
  const needsDocumentationRate = pct(needsDocumented, totalAssessments);

  const supportPlanCreated = communication_assessment_records.filter(
    (r) => r.support_plan_created,
  ).length;
  const supportPlanRate = pct(supportPlanCreated, totalAssessments);

  const supportPlanReviewed = communication_assessment_records.filter(
    (r) => r.support_plan_reviewed,
  ).length;
  const supportPlanReviewRate = pct(supportPlanReviewed, totalAssessments);

  const childInvolvedInAssessment = communication_assessment_records.filter(
    (r) => r.child_involved_in_assessment,
  ).length;
  const childInvolvementRate = pct(childInvolvedInAssessment, totalAssessments);

  const childViewsRecorded = communication_assessment_records.filter(
    (r) => r.child_views_recorded,
  ).length;
  const childViewsRate = pct(childViewsRecorded, totalAssessments);

  const outcomesShared = communication_assessment_records.filter(
    (r) => r.outcomes_shared_with_team,
  ).length;
  const outcomesSharedRate = pct(outcomesShared, totalAssessments);

  const assessmentChecks = [
    (r: CommunicationAssessmentRecordInput) => r.speech_level_assessed,
    (r: CommunicationAssessmentRecordInput) => r.language_comprehension_assessed,
    (r: CommunicationAssessmentRecordInput) => r.expressive_language_assessed,
    (r: CommunicationAssessmentRecordInput) => r.non_verbal_communication_assessed,
  ];
  const totalAssessmentChecksPossible = totalAssessments * assessmentChecks.length;
  let totalAssessmentChecksPassed = 0;
  for (const rec of communication_assessment_records) {
    for (const check of assessmentChecks) {
      if (check(rec)) totalAssessmentChecksPassed++;
    }
  }
  const assessmentComprehensivenessRate = pct(totalAssessmentChecksPassed, totalAssessmentChecksPossible);

  const assessmentProgressSum = communication_assessment_records.reduce(
    (sum, r) => sum + r.progress_rating,
    0,
  );
  const avgAssessmentProgress =
    totalAssessments > 0
      ? Math.round((assessmentProgressSum / totalAssessments) * 100) / 100
      : 0;

  // --- Speech therapy metrics ---
  const totalTherapySessions = speech_therapy_records.length;

  const sessionsAttended = speech_therapy_records.filter(
    (r) => r.session_attended,
  ).length;
  const therapyAttendanceRate = pct(sessionsAttended, totalTherapySessions);

  const sessionsCompleted = speech_therapy_records.filter(
    (r) => r.session_completed,
  ).length;
  const therapyCompletionRate = pct(sessionsCompleted, totalTherapySessions);

  const childEngagedInTherapy = speech_therapy_records.filter(
    (r) => r.child_engaged,
  ).length;
  const therapyEngagementRate = pct(childEngagedInTherapy, totalTherapySessions);

  const targetsSet = speech_therapy_records.filter((r) => r.targets_set).length;
  const targetsSetRate = pct(targetsSet, totalTherapySessions);

  const targetsMet = speech_therapy_records.filter((r) => r.targets_met).length;
  const targetsMetRate = pct(targetsMet, totalTherapySessions);

  const homePracticeAssigned = speech_therapy_records.filter(
    (r) => r.home_practice_assigned,
  ).length;
  const homePracticeCompleted = speech_therapy_records.filter(
    (r) => r.home_practice_assigned && r.home_practice_completed,
  ).length;
  const homePracticeCompletionRate = pct(homePracticeCompleted, homePracticeAssigned);

  const staffGuidanceProvided = speech_therapy_records.filter(
    (r) => r.staff_guidance_provided,
  ).length;
  const staffGuidanceRate = pct(staffGuidanceProvided, totalTherapySessions);

  const therapyProgressSum = speech_therapy_records.reduce(
    (sum, r) => sum + r.progress_rating,
    0,
  );
  const avgTherapyProgress =
    totalTherapySessions > 0
      ? Math.round((therapyProgressSum / totalTherapySessions) * 100) / 100
      : 0;

  // --- Communication aid metrics ---
  const totalAids = communication_aid_records.length;

  const aidsAvailable = communication_aid_records.filter(
    (r) => r.aid_available,
  ).length;
  const aidAvailabilityRate = pct(aidsAvailable, totalAids);

  const aidsInUse = communication_aid_records.filter(
    (r) => r.aid_in_use,
  ).length;
  const aidUsageRate = pct(aidsInUse, totalAids);

  const aidsMaintained = communication_aid_records.filter(
    (r) => r.aid_maintained,
  ).length;
  const aidMaintenanceRate = pct(aidsMaintained, totalAids);

  const childTrainedOnAid = communication_aid_records.filter(
    (r) => r.child_trained_on_aid,
  ).length;
  const childAidTrainingRate = pct(childTrainedOnAid, totalAids);

  const staffTrainedOnAid = communication_aid_records.filter(
    (r) => r.staff_trained_on_aid,
  ).length;
  const staffAidTrainingRate = pct(staffTrainedOnAid, totalAids);

  const aidsReviewed = communication_aid_records.filter(
    (r) => r.reviewed,
  ).length;
  const aidReviewRate = pct(aidsReviewed, totalAids);

  const childFeedbackPositiveOnAids = communication_aid_records.filter(
    (r) => r.child_feedback_positive,
  ).length;
  const aidChildFeedbackRate = pct(childFeedbackPositiveOnAids, totalAids);

  const replacementsNeeded = communication_aid_records.filter(
    (r) => r.replacement_needed,
  ).length;
  const replacementsActioned = communication_aid_records.filter(
    (r) => r.replacement_needed && r.replacement_actioned,
  ).length;
  const replacementActionRate = pct(replacementsActioned, replacementsNeeded);

  // Aid provision rate: composite of available + in use + maintained + child trained
  const aidProvisionNumerator = aidsAvailable + aidsInUse + aidsMaintained + childTrainedOnAid;
  const aidProvisionDenominator = totalAids * 4;
  const aidProvisionRate = pct(aidProvisionNumerator, aidProvisionDenominator);

  const aidEffectivenessSum = communication_aid_records.reduce(
    (sum, r) => sum + r.effectiveness_rating,
    0,
  );
  const avgAidEffectiveness =
    totalAids > 0
      ? Math.round((aidEffectivenessSum / totalAids) * 100) / 100
      : 0;

  // --- Inclusive practice metrics ---
  const totalInclusivePractice = inclusive_practice_records.length;

  const needsConsidered = inclusive_practice_records.filter(
    (r) => r.communication_needs_considered,
  ).length;
  const needsConsideredRate = pct(needsConsidered, totalInclusivePractice);

  const adaptationsMade = inclusive_practice_records.filter(
    (r) => r.adaptations_made,
  ).length;
  const adaptationRate = pct(adaptationsMade, totalInclusivePractice);

  const allChildrenIncluded = inclusive_practice_records.filter(
    (r) => r.all_children_included,
  ).length;
  const inclusionRate = pct(allChildrenIncluded, totalInclusivePractice);

  const feedbackSought = inclusive_practice_records.filter(
    (r) => r.child_feedback_sought,
  ).length;
  const feedbackSoughtRate = pct(feedbackSought, totalInclusivePractice);

  const feedbackPositive = inclusive_practice_records.filter(
    (r) => r.child_feedback_positive,
  ).length;
  const feedbackPositiveRate = pct(feedbackPositive, totalInclusivePractice);

  const barriersIdentified = inclusive_practice_records.filter(
    (r) => r.barriers_identified !== null && r.barriers_identified !== "",
  ).length;
  const barriersAddressed = inclusive_practice_records.filter(
    (r) =>
      r.barriers_identified !== null &&
      r.barriers_identified !== "" &&
      r.barriers_addressed,
  ).length;
  const barrierResolutionRate = pct(barriersAddressed, barriersIdentified);

  // Inclusive practice rate: composite of needs considered + adaptations + all included + feedback sought
  const inclusivePracticeNumerator = needsConsidered + adaptationsMade + allChildrenIncluded + feedbackSought;
  const inclusivePracticeDenominator = totalInclusivePractice * 4;
  const inclusivePracticeRate = pct(inclusivePracticeNumerator, inclusivePracticeDenominator);

  // --- Staff communication training metrics ---
  const totalTrainingRecords = staff_communication_training_records.length;

  const trainingCompleted = staff_communication_training_records.filter(
    (r) => r.training_completed,
  ).length;
  const trainingCompletionRate = pct(trainingCompleted, totalTrainingRecords);

  const competencyAssessed = staff_communication_training_records.filter(
    (r) => r.competency_assessed,
  ).length;
  const competencyAssessmentRate = pct(competencyAssessed, totalTrainingRecords);

  const competencyPassed = staff_communication_training_records.filter(
    (r) => r.competency_passed,
  ).length;
  const competencyPassRate = pct(competencyPassed, totalTrainingRecords);

  const appliedInPractice = staff_communication_training_records.filter(
    (r) => r.applied_in_practice,
  ).length;
  const practiceApplicationRate = pct(appliedInPractice, totalTrainingRecords);

  const refreshersDue = staff_communication_training_records.filter(
    (r) => r.refresher_due_date !== null && r.refresher_due_date !== "",
  ).length;
  const refreshersCompleted = staff_communication_training_records.filter(
    (r) =>
      r.refresher_due_date !== null &&
      r.refresher_due_date !== "" &&
      r.refresher_completed,
  ).length;
  const refresherCompletionRate = pct(refreshersCompleted, refreshersDue);

  // Staff training rate: composite of completed + competency passed + applied in practice
  const staffTrainingNumerator = trainingCompleted + competencyPassed + appliedInPractice;
  const staffTrainingDenominator = totalTrainingRecords * 3;
  const staffTrainingRate = pct(staffTrainingNumerator, staffTrainingDenominator);

  // --- Child progress rate: combines assessment progress + therapy progress ---
  const allProgressRatings: number[] = [];
  for (const r of communication_assessment_records) {
    allProgressRatings.push(r.progress_rating);
  }
  for (const r of speech_therapy_records) {
    allProgressRatings.push(r.progress_rating);
  }
  const totalProgressRatings = allProgressRatings.length;
  const progressSum = allProgressRatings.reduce((sum, v) => sum + v, 0);
  const avgProgress =
    totalProgressRatings > 0
      ? Math.round((progressSum / totalProgressRatings) * 100) / 100
      : 0;
  // Convert 1-5 progress to 0-100 scale
  const childProgressRate =
    totalProgressRatings > 0 ? Math.round(((avgProgress - 1) / 4) * 100) : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: assessmentCoverageRate (>=90: +4, >=70: +2) ---
  if (assessmentCoverageRate >= 90) score += 4;
  else if (assessmentCoverageRate >= 70) score += 2;

  // --- Bonus 2: therapyEngagementRate (>=90: +4, >=70: +2) ---
  if (therapyEngagementRate >= 90) score += 4;
  else if (therapyEngagementRate >= 70) score += 2;

  // --- Bonus 3: aidProvisionRate (>=85: +3, >=65: +1) ---
  if (aidProvisionRate >= 85) score += 3;
  else if (aidProvisionRate >= 65) score += 1;

  // --- Bonus 4: inclusivePracticeRate (>=85: +3, >=65: +1) ---
  if (inclusivePracticeRate >= 85) score += 3;
  else if (inclusivePracticeRate >= 65) score += 1;

  // --- Bonus 5: staffTrainingRate (>=85: +3, >=65: +1) ---
  if (staffTrainingRate >= 85) score += 3;
  else if (staffTrainingRate >= 65) score += 1;

  // --- Bonus 6: childInvolvementRate (>=90: +3, >=70: +1) ---
  if (childInvolvementRate >= 90) score += 3;
  else if (childInvolvementRate >= 70) score += 1;

  // --- Bonus 7: homePracticeCompletionRate (>=90: +3, >=70: +1) ---
  if (homePracticeCompletionRate >= 90) score += 3;
  else if (homePracticeCompletionRate >= 70) score += 1;

  // --- Bonus 8: childProgressRate (>=75: +2, >=50: +1) ---
  if (childProgressRate >= 75) score += 2;
  else if (childProgressRate >= 50) score += 1;

  // --- Bonus 9: supportPlanReviewRate (>=90: +3, >=70: +1) ---
  if (supportPlanReviewRate >= 90) score += 3;
  else if (supportPlanReviewRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // assessmentCoverageRate < 40 → -6 (guarded by records > 0)
  if (assessmentCoverageRate < 40 && totalAssessments > 0) score -= 6;

  // therapyEngagementRate < 50 → -5 (guarded by records > 0)
  if (therapyEngagementRate < 50 && totalTherapySessions > 0) score -= 5;

  // inclusivePracticeRate < 40 → -5 (guarded by records > 0)
  if (inclusivePracticeRate < 40 && totalInclusivePractice > 0) score -= 5;

  // staffTrainingRate < 40 → -3 (guarded by records > 0)
  if (staffTrainingRate < 40 && totalTrainingRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const communication_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (assessmentCoverageRate >= 90 && totalAssessments > 0) {
    strengths.push(
      `${assessmentCoverageRate}% assessment coverage — the home has completed communication assessments for nearly all children, ensuring every child's speech, language, and communication needs are identified and documented.`,
    );
  } else if (assessmentCoverageRate >= 70 && totalAssessments > 0) {
    strengths.push(
      `${assessmentCoverageRate}% assessment coverage — the majority of children have had their communication and language needs assessed and recorded.`,
    );
  }

  if (therapyEngagementRate >= 90 && totalTherapySessions > 0) {
    strengths.push(
      `${therapyEngagementRate}% speech therapy engagement — children consistently engage with speech and language therapy sessions, indicating effective preparation, motivation, and therapist-child rapport.`,
    );
  } else if (therapyEngagementRate >= 70 && totalTherapySessions > 0) {
    strengths.push(
      `${therapyEngagementRate}% therapy engagement — the majority of children engage well with speech and language therapy sessions.`,
    );
  }

  if (aidProvisionRate >= 85 && totalAids > 0) {
    strengths.push(
      `${aidProvisionRate}% communication aid provision quality — aids are consistently available, in active use, well maintained, and children are trained in their use, enabling effective communication across all settings.`,
    );
  } else if (aidProvisionRate >= 65 && totalAids > 0) {
    strengths.push(
      `${aidProvisionRate}% communication aid provision — the home generally ensures aids are available and in use for children who need them.`,
    );
  }

  if (inclusivePracticeRate >= 85 && totalInclusivePractice > 0) {
    strengths.push(
      `${inclusivePracticeRate}% inclusive communication practice — the home consistently considers communication needs, makes adaptations, ensures all children are included, and actively seeks feedback on communication support.`,
    );
  } else if (inclusivePracticeRate >= 65 && totalInclusivePractice > 0) {
    strengths.push(
      `${inclusivePracticeRate}% inclusive practice — the home generally considers children's communication needs and makes appropriate adaptations.`,
    );
  }

  if (staffTrainingRate >= 85 && totalTrainingRecords > 0) {
    strengths.push(
      `${staffTrainingRate}% staff communication training quality — staff consistently complete training, pass competency assessments, and apply communication skills in their daily practice with children.`,
    );
  } else if (staffTrainingRate >= 65 && totalTrainingRecords > 0) {
    strengths.push(
      `${staffTrainingRate}% staff training quality — the majority of staff have completed communication training and apply their learning in practice.`,
    );
  }

  if (childInvolvementRate >= 90 && totalAssessments > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in communication assessments — children are actively included in their own assessment process, ensuring their views and preferences shape the support they receive.`,
    );
  } else if (childInvolvementRate >= 70 && totalAssessments > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in assessments — most children participate in their communication assessments.`,
    );
  }

  if (therapyAttendanceRate >= 90 && totalTherapySessions > 0) {
    strengths.push(
      `${therapyAttendanceRate}% speech therapy attendance — the home ensures children attend their scheduled therapy sessions consistently, demonstrating commitment to supporting communication development.`,
    );
  } else if (therapyAttendanceRate >= 70 && totalTherapySessions > 0) {
    strengths.push(
      `${therapyAttendanceRate}% therapy attendance — the majority of scheduled speech therapy sessions are attended.`,
    );
  }

  if (homePracticeCompletionRate >= 90 && homePracticeAssigned > 0) {
    strengths.push(
      `${homePracticeCompletionRate}% home practice completion — therapy exercises and activities assigned for home are consistently completed, reinforcing therapeutic progress between sessions.`,
    );
  } else if (homePracticeCompletionRate >= 70 && homePracticeAssigned > 0) {
    strengths.push(
      `${homePracticeCompletionRate}% home practice completion — the home generally supports the completion of therapy exercises between sessions.`,
    );
  }

  if (childViewsRate >= 90 && totalAssessments > 0) {
    strengths.push(
      `${childViewsRate}% of assessments record children's views — children's own perspectives on their communication are consistently captured and documented, evidencing voice of the child in communication support.`,
    );
  } else if (childViewsRate >= 70 && totalAssessments > 0) {
    strengths.push(
      `${childViewsRate}% of assessments record child views — children's perspectives on their communication are generally captured.`,
    );
  }

  if (supportPlanReviewRate >= 90 && totalAssessments > 0) {
    strengths.push(
      `${supportPlanReviewRate}% of communication support plans reviewed — the home actively monitors whether communication interventions are effective and adapts approaches based on review outcomes.`,
    );
  } else if (supportPlanReviewRate >= 70 && totalAssessments > 0) {
    strengths.push(
      `${supportPlanReviewRate}% of support plans reviewed — the home generally reviews communication support plans to assess effectiveness.`,
    );
  }

  if (staffGuidanceRate >= 90 && totalTherapySessions > 0) {
    strengths.push(
      `${staffGuidanceRate}% of therapy sessions include staff guidance — therapists consistently provide guidance to care staff, enabling them to reinforce therapeutic approaches in daily interactions.`,
    );
  }

  if (outcomesSharedRate >= 90 && totalAssessments > 0) {
    strengths.push(
      `${outcomesSharedRate}% of assessment outcomes shared with the team — assessment findings are disseminated to all staff, ensuring consistent, informed communication support across the home.`,
    );
  }

  if (barrierResolutionRate >= 90 && barriersIdentified > 0) {
    strengths.push(
      `${barrierResolutionRate}% of identified communication barriers addressed — the home proactively removes obstacles to inclusive communication, demonstrating commitment to accessibility for all children.`,
    );
  }

  if (assessmentComprehensivenessRate >= 90 && totalAssessments > 0) {
    strengths.push(
      `${assessmentComprehensivenessRate}% assessment comprehensiveness — assessments consistently cover speech, language comprehension, expressive language, and non-verbal communication, providing a thorough picture of each child's needs.`,
    );
  }

  if (avgAidEffectiveness >= 4.0 && totalAids > 0) {
    strengths.push(
      `Average communication aid effectiveness rating of ${avgAidEffectiveness}/5 — the aids provided are genuinely helping children to communicate more effectively.`,
    );
  }

  if (targetsMetRate >= 80 && totalTherapySessions > 0) {
    strengths.push(
      `${targetsMetRate}% of therapy targets met — children are making excellent progress against their speech and language therapy goals.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (assessmentCoverageRate < 40 && totalAssessments > 0) {
    concerns.push(
      `Only ${assessmentCoverageRate}% assessment coverage — the majority of children have not had their communication and language needs assessed. Without assessment, the home cannot identify or meet children's communication requirements.`,
    );
  } else if (assessmentCoverageRate >= 40 && assessmentCoverageRate < 70 && totalAssessments > 0) {
    concerns.push(
      `Assessment coverage at ${assessmentCoverageRate}% — a significant number of children still lack communication assessments, meaning their needs may go unidentified and unmet.`,
    );
  }

  if (therapyEngagementRate < 50 && totalTherapySessions > 0) {
    concerns.push(
      `Only ${therapyEngagementRate}% therapy engagement — the majority of children are not engaging with speech therapy sessions. Poor engagement undermines therapeutic progress and may indicate sessions are not appropriately tailored to children's needs and interests.`,
    );
  } else if (therapyEngagementRate >= 50 && therapyEngagementRate < 70 && totalTherapySessions > 0) {
    concerns.push(
      `Therapy engagement at ${therapyEngagementRate}% — some children are not fully engaging with speech and language therapy, potentially limiting their progress.`,
    );
  }

  if (aidProvisionRate < 40 && totalAids > 0) {
    concerns.push(
      `Communication aid provision quality at only ${aidProvisionRate}% — aids are not consistently available, in use, maintained, or children are not trained to use them effectively. Children who need communication aids are being disadvantaged.`,
    );
  } else if (aidProvisionRate >= 40 && aidProvisionRate < 65 && totalAids > 0) {
    concerns.push(
      `Aid provision quality at ${aidProvisionRate}% — some aspects of communication aid support need improvement, whether availability, usage, maintenance, or child training.`,
    );
  }

  if (inclusivePracticeRate < 40 && totalInclusivePractice > 0) {
    concerns.push(
      `Inclusive communication practice at only ${inclusivePracticeRate}% — the home is not consistently considering children's communication needs, making adaptations, or ensuring all children are included in activities and processes.`,
    );
  } else if (inclusivePracticeRate >= 40 && inclusivePracticeRate < 65 && totalInclusivePractice > 0) {
    concerns.push(
      `Inclusive practice at ${inclusivePracticeRate}% — there are gaps in how consistently the home adapts its practices to include all children regardless of communication ability.`,
    );
  }

  if (staffTrainingRate < 40 && totalTrainingRecords > 0) {
    concerns.push(
      `Staff communication training quality at only ${staffTrainingRate}% — staff are not consistently completing training, passing competency assessments, or applying communication skills in practice with children.`,
    );
  } else if (staffTrainingRate >= 40 && staffTrainingRate < 65 && totalTrainingRecords > 0) {
    concerns.push(
      `Staff training quality at ${staffTrainingRate}% — some staff have gaps in their communication training, competency, or practical application of skills.`,
    );
  }

  if (childInvolvementRate < 50 && totalAssessments > 0) {
    concerns.push(
      `Only ${childInvolvementRate}% child involvement in communication assessments — children are not being sufficiently included in assessing their own communication needs, undermining the voice of the child in a core area of their daily life.`,
    );
  }

  if (therapyAttendanceRate < 50 && totalTherapySessions > 0) {
    concerns.push(
      `Only ${therapyAttendanceRate}% speech therapy attendance — children are missing the majority of their scheduled therapy sessions, seriously impacting their communication development.`,
    );
  } else if (therapyAttendanceRate >= 50 && therapyAttendanceRate < 70 && totalTherapySessions > 0) {
    concerns.push(
      `Speech therapy attendance at ${therapyAttendanceRate}% — a significant proportion of scheduled sessions are not being attended, limiting therapeutic progress.`,
    );
  }

  if (homePracticeCompletionRate < 50 && homePracticeAssigned > 0) {
    concerns.push(
      `Only ${homePracticeCompletionRate}% of assigned home practice completed — therapy exercises are not being followed through between sessions, reducing the effectiveness of speech therapy interventions.`,
    );
  } else if (homePracticeCompletionRate >= 50 && homePracticeCompletionRate < 70 && homePracticeAssigned > 0) {
    concerns.push(
      `Home practice completion at ${homePracticeCompletionRate}% — some therapy exercises are not being completed between sessions.`,
    );
  }

  if (supportPlanRate < 50 && totalAssessments > 0) {
    concerns.push(
      `Only ${supportPlanRate}% of assessments have resulted in a support plan — communication needs are being identified but not systematically addressed through documented support plans.`,
    );
  }

  if (childViewsRate < 50 && totalAssessments > 0) {
    concerns.push(
      `Only ${childViewsRate}% of assessments record children's views — children's own perspectives on their communication needs are not being routinely captured.`,
    );
  }

  if (needsDocumentationRate < 50 && totalAssessments > 0) {
    concerns.push(
      `Only ${needsDocumentationRate}% of identified communication needs are documented — without proper documentation, needs cannot be shared with the team or addressed through consistent support.`,
    );
  }

  if (totalAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No communication assessments exist despite children being on placement — the home cannot evidence that children's speech, language, and communication needs have been identified.",
    );
  }

  if (totalTrainingRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No staff communication training records exist — the home cannot evidence that staff have the skills and knowledge to support children's communication needs effectively.",
    );
  }

  if (replacementActionRate < 50 && replacementsNeeded > 0) {
    concerns.push(
      `Only ${replacementActionRate}% of needed communication aid replacements actioned — children are left without functioning aids, limiting their ability to communicate.`,
    );
  }

  if (avgAidEffectiveness < 2.5 && totalAids > 0) {
    concerns.push(
      `Average communication aid effectiveness rating at only ${avgAidEffectiveness}/5 — the aids currently provided are not meeting children's communication needs effectively and require review.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: CommunicationSupportRecommendation[] = [];
  let rank = 0;

  if (assessmentCoverageRate < 40 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently assess the communication and language needs of all children on placement — every child must have a documented communication assessment to identify their speech, language, and communication requirements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (totalAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement communication assessments for every child immediately — without any assessments, the home cannot evidence that children's communication needs are known, let alone met.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (therapyEngagementRate < 50 && totalTherapySessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review speech therapy provision to improve child engagement — explore alternative therapy approaches, session timing, and therapeutic rapport. Children who do not engage with therapy cannot make progress with their communication.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (inclusivePracticeRate < 40 && totalInclusivePractice > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul inclusive communication practices across the home — ensure every activity, meeting, routine, and process considers children's communication needs and makes appropriate adaptations so no child is excluded.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views and wishes",
    });
  }

  if (totalTrainingRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a staff communication training programme immediately — without any training records, the home cannot evidence that staff have the skills to support children's diverse communication needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (staffTrainingRate < 40 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address gaps in staff communication training — ensure all staff complete required training, are assessed for competency, and actively apply their learning in daily practice with children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (childInvolvementRate < 50 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children more actively in their communication assessments — use accessible methods to enable children to share their views about their communication and the support they want.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (therapyAttendanceRate < 50 && totalTherapySessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address speech therapy non-attendance — identify and remove barriers to attendance, ensure the home prioritises therapy appointments, and involve children in planning around their sessions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (aidProvisionRate < 40 && totalAids > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all communication aids across the home — ensure every aid is available, in active use, maintained, and that children are trained in its use. Children cannot exercise their right to communicate without functioning aids.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views and wishes",
    });
  }

  if (homePracticeCompletionRate < 50 && homePracticeAssigned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve home practice completion rates for speech therapy — provide staff with clear guidance, build practice into daily routines, and create accountability systems to ensure therapy exercises are completed between sessions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (supportPlanRate < 50 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every communication assessment results in a documented support plan — identified needs must be translated into actionable, individualised plans that staff can implement in daily practice.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (assessmentCoverageRate >= 40 && assessmentCoverageRate < 70 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend communication assessment coverage to at least 70% of children — prioritise children who have not yet been assessed and ensure their communication needs are documented.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (therapyEngagementRate >= 50 && therapyEngagementRate < 70 && totalTherapySessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve therapy engagement through collaborative goal-setting with children and adapting session formats to individual preferences and learning styles.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 — Positive relationships",
    });
  }

  if (inclusivePracticeRate >= 40 && inclusivePracticeRate < 65 && totalInclusivePractice > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance inclusive communication practices — focus on consistently considering communication needs, making adaptations, and seeking children's feedback on whether they feel included.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views and wishes",
    });
  }

  if (staffTrainingRate >= 40 && staffTrainingRate < 65 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen staff communication training programme — ensure all staff progress from completion through competency assessment to practical application in their daily work with children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (supportPlanReviewRate < 70 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a schedule for reviewing all communication support plans — regular review ensures interventions remain relevant and effective as children's needs change over time.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (outcomesSharedRate < 70 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the sharing of assessment outcomes with the whole team — all staff need to understand each child's communication needs and how to support them consistently.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (childViewsRate < 70 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's views are routinely recorded during communication assessments — use age-appropriate and accessible methods to capture how children experience their communication and what support they want.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (aidProvisionRate >= 40 && aidProvisionRate < 65 && totalAids > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve communication aid quality — review availability, usage patterns, maintenance, and training to ensure aids are truly supporting children's daily communication.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views and wishes",
    });
  }

  if (refresherCompletionRate < 70 && refreshersDue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure staff complete communication training refreshers on time — skills and knowledge degrade without reinforcement, potentially leaving gaps in the home's ability to support children's communication.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: CommunicationSupportInsight[] = [];

  // -- Critical insights --

  if (assessmentCoverageRate < 40 && totalAssessments > 0) {
    insights.push({
      text: `Only ${assessmentCoverageRate}% assessment coverage. Ofsted expects every child's communication needs to be identified and addressed. Without comprehensive assessment, the home cannot demonstrate that it knows what each child needs to communicate effectively — this is fundamental to Reg 5 compliance and the voice of the child.`,
      severity: "critical",
    });
  }

  if (therapyEngagementRate < 50 && totalTherapySessions > 0) {
    insights.push({
      text: `Only ${therapyEngagementRate}% therapy engagement. When children do not engage with speech therapy, their communication development stalls. Low engagement may indicate that therapy provision is not child-centred, sessions are poorly timed, or children have not been involved in setting their own goals.`,
      severity: "critical",
    });
  }

  if (inclusivePracticeRate < 40 && totalInclusivePractice > 0) {
    insights.push({
      text: `Inclusive communication practice at only ${inclusivePracticeRate}%. When the home does not consistently adapt its practices for children's communication needs, those children are effectively excluded from expressing their views, participating in decisions, and engaging fully in daily life. This is a direct barrier to Reg 7 compliance.`,
      severity: "critical",
    });
  }

  if (staffTrainingRate < 40 && totalTrainingRecords > 0) {
    insights.push({
      text: `Staff communication training quality at only ${staffTrainingRate}%. Staff who lack communication skills cannot support children with speech, language, or communication needs effectively. This creates a systemic gap that affects every interaction between staff and children.`,
      severity: "critical",
    });
  }

  if (totalAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No communication assessments exist despite children being on placement. Without any assessments, the home cannot evidence that children's communication and language needs have been identified. This is a critical gap — children with unidentified communication needs may be unable to express their views, wishes, and feelings.",
      severity: "critical",
    });
  }

  if (totalTrainingRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No staff communication training records exist. The absence of any training evidence means Ofsted cannot verify that staff have the skills to identify and support children's communication needs. Effective communication is the foundation of positive relationships under Reg 12.",
      severity: "critical",
    });
  }

  if (therapyAttendanceRate < 50 && totalTherapySessions > 0) {
    insights.push({
      text: `Only ${therapyAttendanceRate}% speech therapy attendance. Children in care often have significant speech and language needs, and missed therapy sessions compound developmental delays. The home has a responsibility to prioritise and facilitate attendance.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (assessmentCoverageRate >= 40 && assessmentCoverageRate < 70 && totalAssessments > 0) {
    insights.push({
      text: `Assessment coverage at ${assessmentCoverageRate}% — improving but incomplete. Some children still lack communication assessments, meaning their needs may be invisible to the team and unsupported in daily practice.`,
      severity: "warning",
    });
  }

  if (therapyEngagementRate >= 50 && therapyEngagementRate < 70 && totalTherapySessions > 0) {
    insights.push({
      text: `Therapy engagement at ${therapyEngagementRate}% — some children are not fully engaging with speech therapy. Consider whether session content, timing, or approach needs adapting to individual children's preferences and needs.`,
      severity: "warning",
    });
  }

  if (inclusivePracticeRate >= 40 && inclusivePracticeRate < 65 && totalInclusivePractice > 0) {
    insights.push({
      text: `Inclusive practice at ${inclusivePracticeRate}% — the home does not consistently adapt its practices for all children's communication needs. Inconsistency means some children may feel excluded or unable to participate fully.`,
      severity: "warning",
    });
  }

  if (staffTrainingRate >= 40 && staffTrainingRate < 65 && totalTrainingRecords > 0) {
    insights.push({
      text: `Staff training quality at ${staffTrainingRate}% — gaps exist between completing training and applying it in practice. Supervision and reflective practice should focus on embedding communication skills in daily interactions.`,
      severity: "warning",
    });
  }

  if (homePracticeCompletionRate >= 50 && homePracticeCompletionRate < 70 && homePracticeAssigned > 0) {
    insights.push({
      text: `Home practice completion at ${homePracticeCompletionRate}% — therapy exercises are not being consistently followed through between sessions. Research shows that regular practice between sessions significantly accelerates communication development.`,
      severity: "warning",
    });
  }

  if (childInvolvementRate >= 50 && childInvolvementRate < 70 && totalAssessments > 0) {
    insights.push({
      text: `Child involvement in assessments at ${childInvolvementRate}% — not all children are being actively included in their own communication assessments. Children's views about their communication needs and preferences are essential for effective, child-centred support.`,
      severity: "warning",
    });
  }

  if (supportPlanReviewRate >= 50 && supportPlanReviewRate < 70 && totalAssessments > 0) {
    insights.push({
      text: `Support plan review rate at ${supportPlanReviewRate}% — not all communication support plans are being regularly reviewed. Without consistent review, interventions may drift from children's current needs as they develop.`,
      severity: "warning",
    });
  }

  if (aidProvisionRate >= 40 && aidProvisionRate < 65 && totalAids > 0) {
    insights.push({
      text: `Communication aid provision at ${aidProvisionRate}% — some aids are not fully meeting their potential. Review whether aids are available when needed, actively used by children, properly maintained, and whether training has been effective.`,
      severity: "warning",
    });
  }

  if (therapyAttendanceRate >= 50 && therapyAttendanceRate < 70 && totalTherapySessions > 0) {
    insights.push({
      text: `Therapy attendance at ${therapyAttendanceRate}% — some sessions are being missed. Identify barriers such as scheduling conflicts, transport issues, or children's reluctance and address them proactively.`,
      severity: "warning",
    });
  }

  if (refresherCompletionRate < 50 && refreshersDue > 0) {
    insights.push({
      text: `Only ${refresherCompletionRate}% of refresher training completed on time — staff communication skills may be degrading without timely reinforcement, potentially affecting the quality of support provided to children.`,
      severity: "warning",
    });
  }

  // Aid type analysis
  const aidTypes: Record<string, number> = {};
  for (const a of communication_aid_records) {
    aidTypes[a.aid_type] = (aidTypes[a.aid_type] ?? 0) + 1;
  }
  const topAidTypes = Object.entries(aidTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topAidTypes.length > 0) {
    const formatted = topAidTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most used communication aid types: ${formatted}. Understanding the range of aids in use helps ensure the home has appropriate resources and staff training aligned to children's actual communication methods.`,
      severity: "warning",
    });
  }

  // Training type analysis
  const trainingTypes: Record<string, number> = {};
  for (const t of staff_communication_training_records) {
    trainingTypes[t.training_type] = (trainingTypes[t.training_type] ?? 0) + 1;
  }
  const topTrainingTypes = Object.entries(trainingTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topTrainingTypes.length > 0) {
    const formatted = topTrainingTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common staff communication training types: ${formatted}. Ensure training provision is aligned to the communication needs of children currently in placement — training should be needs-led rather than generic.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (communication_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding communication and language support — children's communication needs are comprehensively assessed, therapy engagement is high, aids are effectively provided, inclusive practices are embedded, and staff are well trained. This provides strong evidence of Reg 5, Reg 7, and Reg 12 compliance, with the voice of the child central to practice.",
      severity: "positive",
    });
  }

  if (assessmentCoverageRate >= 90 && childInvolvementRate >= 90 && totalAssessments > 0) {
    insights.push({
      text: `${assessmentCoverageRate}% assessment coverage with ${childInvolvementRate}% child involvement — the home ensures nearly all children's communication needs are assessed with their active participation. This child-centred approach means support is tailored to what each child actually needs and wants.`,
      severity: "positive",
    });
  }

  if (therapyEngagementRate >= 90 && therapyAttendanceRate >= 90 && totalTherapySessions > 0) {
    insights.push({
      text: `${therapyAttendanceRate}% therapy attendance with ${therapyEngagementRate}% engagement — children consistently attend and engage with speech therapy, maximising the therapeutic benefit. The home is enabling children to make real progress with their communication.`,
      severity: "positive",
    });
  }

  if (inclusivePracticeRate >= 85 && feedbackPositiveRate >= 90 && totalInclusivePractice > 0) {
    insights.push({
      text: `${inclusivePracticeRate}% inclusive practice with ${feedbackPositiveRate}% positive child feedback — the home embeds inclusive communication across all aspects of daily life and children report feeling included. This demonstrates genuine commitment to every child being heard and valued.`,
      severity: "positive",
    });
  }

  if (staffTrainingRate >= 85 && practiceApplicationRate >= 90 && totalTrainingRecords > 0) {
    insights.push({
      text: `${staffTrainingRate}% staff training quality with ${practiceApplicationRate}% application in practice — staff are not only completing communication training but actively using their skills in daily interactions with children. This translates training investment into real outcomes.`,
      severity: "positive",
    });
  }

  if (homePracticeCompletionRate >= 90 && homePracticeAssigned > 0) {
    insights.push({
      text: `${homePracticeCompletionRate}% home practice completion — the home ensures therapy exercises are consistently practised between sessions, reinforcing therapeutic progress and demonstrating that communication development is prioritised in daily life.`,
      severity: "positive",
    });
  }

  if (aidProvisionRate >= 85 && aidChildFeedbackRate >= 90 && totalAids > 0) {
    insights.push({
      text: `${aidProvisionRate}% aid provision quality with ${aidChildFeedbackRate}% positive child feedback — communication aids are not only well managed but genuinely valued by children as effective tools for expressing themselves.`,
      severity: "positive",
    });
  }

  if (childViewsRate >= 90 && outcomesSharedRate >= 90 && totalAssessments > 0) {
    insights.push({
      text: `${childViewsRate}% of assessments capture children's views and ${outcomesSharedRate}% of outcomes are shared with the team — there is excellent information flow from child to assessment to team, ensuring consistent, informed support across all staff.`,
      severity: "positive",
    });
  }

  if (barrierResolutionRate >= 90 && barriersIdentified > 0) {
    insights.push({
      text: `${barrierResolutionRate}% of communication barriers addressed — the home proactively identifies and removes obstacles to inclusive communication, demonstrating a genuine commitment to ensuring every child can participate fully.`,
      severity: "positive",
    });
  }

  if (targetsMetRate >= 80 && avgTherapyProgress >= 4.0 && totalTherapySessions > 0) {
    insights.push({
      text: `${targetsMetRate}% of therapy targets met with average progress of ${avgTherapyProgress}/5 — children are making excellent progress with their speech and language goals. The combination of therapy, home support, and inclusive practices is producing real outcomes.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (communication_rating === "outstanding") {
    headline =
      "Outstanding communication and language support — children's communication needs are comprehensively assessed, therapy engagement is strong, inclusive practices are embedded, and staff are well trained to support every child's voice.";
  } else if (communication_rating === "good") {
    headline = `Good communication and language support — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (communication_rating === "adequate") {
    headline = `Adequate communication and language support — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure all children's communication needs are met.`;
  } else {
    headline = `Communication and language support is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children can express their views, wishes, and feelings.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    communication_rating,
    communication_score: score,
    headline,
    total_assessments: totalAssessments,
    total_therapy_sessions: totalTherapySessions,
    assessment_coverage_rate: assessmentCoverageRate,
    therapy_engagement_rate: therapyEngagementRate,
    aid_provision_rate: aidProvisionRate,
    inclusive_practice_rate: inclusivePracticeRate,
    staff_training_rate: staffTrainingRate,
    child_progress_rate: childProgressRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
