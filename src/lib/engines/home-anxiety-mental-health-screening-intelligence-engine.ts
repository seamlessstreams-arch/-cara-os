// ==============================================================================
// CORNERSTONE -- HOME ANXIETY & MENTAL HEALTH SCREENING INTELLIGENCE ENGINE
// Monitors how well the home identifies, screens, and responds to children's
// anxiety and mental health needs. Evaluates screening completion rates,
// anxiety assessment frequency, CAMHS referral timeliness, wellbeing
// check-in regularity, and early intervention effectiveness.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (Health care of children), Reg 5 (Engaging with the wider
// system to ensure needs are met).
// SCCIF: "Children's physical, mental and emotional health needs are
// identified, assessed and met."
// Store keys: screeningRecords, anxietyAssessmentRecords,
//             camhsReferralRecords, wellbeingCheckinRecords,
//             earlyInterventionRecords
// ==============================================================================

// -- Input Types -------------------------------------------------------------

export interface ScreeningRecordInput {
  id: string;
  child_id: string;
  screening_date: string;
  screening_type: "initial" | "periodic" | "triggered" | "annual" | "specialist";
  tool_used: string;
  completed: boolean;
  score: number;
  threshold_exceeded: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  screener_name: string;
  child_consented: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface AnxietyAssessmentRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessment_type: "gad7" | "rcads" | "scared" | "phq_a" | "clinical" | "self_report" | "other";
  assessor_name: string;
  severity: "minimal" | "mild" | "moderate" | "severe";
  score: number;
  previous_score: number | null;
  improvement_noted: boolean;
  child_involved: boolean;
  professional_input: boolean;
  action_plan_created: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface CamhsReferralRecordInput {
  id: string;
  child_id: string;
  referral_date: string;
  reason: string;
  urgency: "routine" | "urgent" | "emergency";
  accepted: boolean;
  acceptance_date: string | null;
  first_appointment_date: string | null;
  days_to_first_appointment: number | null;
  currently_active: boolean;
  discharged: boolean;
  discharge_date: string | null;
  outcome_positive: boolean;
  child_engaged: boolean;
  home_supported_attendance: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface WellbeingCheckinRecordInput {
  id: string;
  child_id: string;
  checkin_date: string;
  checkin_type: "daily" | "weekly" | "keyworker" | "ad_hoc" | "structured";
  mood_rating: number; // 1-10
  concerns_raised: boolean;
  concerns_actioned: boolean;
  child_engaged: boolean;
  staff_name: string;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface EarlyInterventionRecordInput {
  id: string;
  child_id: string;
  intervention_type: "cbt_based" | "mindfulness" | "therapeutic_play" | "counselling" | "peer_support" | "psychoeducation" | "relaxation" | "other";
  start_date: string;
  end_date: string | null;
  active: boolean;
  sessions_planned: number;
  sessions_completed: number;
  baseline_score: number; // 1-10
  current_score: number; // 1-10
  target_score: number; // 1-10
  child_reported_improvement: boolean;
  staff_reported_improvement: boolean;
  professional_involved: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface AnxietyMentalHealthInput {
  today: string;
  total_children: number;
  screening_records: ScreeningRecordInput[];
  anxiety_assessment_records: AnxietyAssessmentRecordInput[];
  camhs_referral_records: CamhsReferralRecordInput[];
  wellbeing_checkin_records: WellbeingCheckinRecordInput[];
  early_intervention_records: EarlyInterventionRecordInput[];
}

// -- Output Types ------------------------------------------------------------

export type AnxietyMentalHealthRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AnxietyMentalHealthInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AnxietyMentalHealthRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface AnxietyMentalHealthResult {
  mental_health_rating: AnxietyMentalHealthRating;
  mental_health_score: number;
  headline: string;
  total_screenings: number;
  screening_completion_rate: number;
  anxiety_assessment_rate: number;
  camhs_referral_rate: number;
  wellbeing_checkin_rate: number;
  early_intervention_rate: number;
  child_engagement_rate: number;
  assessment_improvement_avg: number;
  intervention_progress_avg: number;
  strengths: string[];
  concerns: string[];
  recommendations: AnxietyMentalHealthRecommendation[];
  insights: AnxietyMentalHealthInsight[];
}

// -- Helpers -----------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AnxietyMentalHealthRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory ----------------------------------------------------

function emptyResult(
  rating: AnxietyMentalHealthRating,
  score: number,
  headline: string,
): AnxietyMentalHealthResult {
  return {
    mental_health_rating: rating,
    mental_health_score: score,
    headline,
    total_screenings: 0,
    screening_completion_rate: 0,
    anxiety_assessment_rate: 0,
    camhs_referral_rate: 0,
    wellbeing_checkin_rate: 0,
    early_intervention_rate: 0,
    child_engagement_rate: 0,
    assessment_improvement_avg: 0,
    intervention_progress_avg: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute ------------------------------------------------------------

export function computeAnxietyMentalHealthScreening(
  input: AnxietyMentalHealthInput,
): AnxietyMentalHealthResult {
  const {
    total_children,
    screening_records,
    anxiety_assessment_records,
    camhs_referral_records,
    wellbeing_checkin_records,
    early_intervention_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data -----------
  const allEmpty =
    screening_records.length === 0 &&
    anxiety_assessment_records.length === 0 &&
    camhs_referral_records.length === 0 &&
    wellbeing_checkin_records.length === 0 &&
    early_intervention_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess anxiety and mental health screening.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate ----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No mental health screening data recorded despite children on placement -- screening, assessment, and wellbeing monitoring require urgent attention.",
      ),
      concerns: [
        "No screening records, anxiety assessments, CAMHS referrals, wellbeing check-ins, or early intervention records exist despite children being on placement -- the home cannot evidence that children's mental health needs are being identified or addressed.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured mental health screening for all children to identify anxiety and emotional wellbeing needs. Every child should receive an initial screening within their first week of placement and periodic re-screening thereafter.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
        },
        {
          rank: 2,
          recommendation:
            "Establish a wellbeing check-in framework to ensure children's emotional and mental health is monitored regularly. Keyworkers should conduct at least weekly structured wellbeing conversations with each child.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider system",
        },
      ],
      insights: [
        {
          text: "The complete absence of mental health screening and wellbeing records means the home cannot demonstrate that children's anxiety and mental health needs are identified, assessed, or supported. Ofsted expects evidence that children's emotional and mental health is actively monitored and that appropriate support is provided under Reg 14.",
          severity: "critical",
        },
      ],
    };
  }

  // ========================================================================
  // COMPUTE CORE METRICS
  // ========================================================================

  // --- Screening completion ---
  const totalScreenings = screening_records.length;
  const completedScreenings = screening_records.filter(
    (s) => s.completed,
  ).length;
  const screeningCompletionRate = pct(completedScreenings, totalScreenings);

  const uniqueChildrenScreened = new Set(
    screening_records.filter((s) => s.completed).map((s) => s.child_id),
  ).size;
  const screeningCoverageRate =
    total_children > 0 ? pct(uniqueChildrenScreened, total_children) : 0;

  const screeningsWithConsent = screening_records.filter(
    (s) => s.child_consented,
  ).length;
  const consentRate = pct(screeningsWithConsent, totalScreenings);

  const screeningsExceedingThreshold = screening_records.filter(
    (s) => s.completed && s.threshold_exceeded,
  ).length;
  const thresholdExceededRate = pct(screeningsExceedingThreshold, completedScreenings);

  const screeningsRequiringFollowUp = screening_records.filter(
    (s) => s.follow_up_required,
  ).length;
  const screeningsWithFollowUpCompleted = screening_records.filter(
    (s) => s.follow_up_required && s.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(
    screeningsWithFollowUpCompleted,
    screeningsRequiringFollowUp,
  );

  const overdueScreeningReviews = screening_records.filter(
    (s) => s.review_overdue,
  ).length;
  const screeningReviewComplianceRate =
    totalScreenings > 0
      ? pct(totalScreenings - overdueScreeningReviews, totalScreenings)
      : 0;

  // --- Anxiety assessments ---
  const totalAssessments = anxiety_assessment_records.length;
  const uniqueChildrenAssessed = new Set(
    anxiety_assessment_records.map((a) => a.child_id),
  ).size;
  const anxietyAssessmentRate =
    total_children > 0 ? pct(uniqueChildrenAssessed, total_children) : 0;

  const assessmentsShowingImprovement = anxiety_assessment_records.filter(
    (a) => a.improvement_noted,
  ).length;
  const assessmentImprovementRate = pct(
    assessmentsShowingImprovement,
    totalAssessments,
  );

  const assessmentsWithChildInvolvement = anxiety_assessment_records.filter(
    (a) => a.child_involved,
  ).length;
  const assessmentChildInvolvementRate = pct(
    assessmentsWithChildInvolvement,
    totalAssessments,
  );

  const assessmentsWithProfessionalInput = anxiety_assessment_records.filter(
    (a) => a.professional_input,
  ).length;
  const assessmentProfessionalRate = pct(
    assessmentsWithProfessionalInput,
    totalAssessments,
  );

  const assessmentsWithActionPlan = anxiety_assessment_records.filter(
    (a) => a.action_plan_created,
  ).length;
  const actionPlanRate = pct(assessmentsWithActionPlan, totalAssessments);

  const overdueAssessmentReviews = anxiety_assessment_records.filter(
    (a) => a.review_overdue,
  ).length;

  const severeAssessments = anxiety_assessment_records.filter(
    (a) => a.severity === "severe",
  ).length;
  const moderateAssessments = anxiety_assessment_records.filter(
    (a) => a.severity === "moderate",
  ).length;

  // Assessment improvement average (score change for those with previous_score)
  const assessmentsWithPrevious = anxiety_assessment_records.filter(
    (a) => a.previous_score !== null,
  );
  const assessmentImprovementValues = assessmentsWithPrevious.map((a) => {
    const prev = a.previous_score as number;
    return prev > 0 ? clamp(Math.round(((prev - a.score) / prev) * 100), -100, 100) : 0;
  });
  const assessmentImprovementAvg =
    assessmentImprovementValues.length > 0
      ? Math.round(
          assessmentImprovementValues.reduce((sum, v) => sum + v, 0) /
            assessmentImprovementValues.length,
        )
      : 0;

  // --- CAMHS referrals ---
  const totalReferrals = camhs_referral_records.length;
  const uniqueChildrenReferred = new Set(
    camhs_referral_records.map((r) => r.child_id),
  ).size;
  const camhsReferralRate =
    total_children > 0 ? pct(uniqueChildrenReferred, total_children) : 0;

  const acceptedReferrals = camhs_referral_records.filter(
    (r) => r.accepted,
  ).length;
  const referralAcceptanceRate = pct(acceptedReferrals, totalReferrals);

  const referralsWithFirstAppt = camhs_referral_records.filter(
    (r) => r.first_appointment_date !== null,
  ).length;
  const referralTimelinessRate = pct(referralsWithFirstAppt, acceptedReferrals);

  const referralDaysToAppt = camhs_referral_records
    .filter((r) => r.days_to_first_appointment !== null && r.days_to_first_appointment! > 0)
    .map((r) => r.days_to_first_appointment as number);
  const avgDaysToFirstAppt =
    referralDaysToAppt.length > 0
      ? Math.round(
          referralDaysToAppt.reduce((sum, d) => sum + d, 0) /
            referralDaysToAppt.length,
        )
      : 0;

  const activeReferrals = camhs_referral_records.filter(
    (r) => r.currently_active,
  ).length;

  const childEngagedWithCamhs = camhs_referral_records.filter(
    (r) => r.child_engaged,
  ).length;
  const camhsChildEngagementRate = pct(childEngagedWithCamhs, totalReferrals);

  const homeSupportedAttendance = camhs_referral_records.filter(
    (r) => r.home_supported_attendance,
  ).length;
  const attendanceSupportRate = pct(homeSupportedAttendance, totalReferrals);

  const positiveOutcomeReferrals = camhs_referral_records.filter(
    (r) => r.outcome_positive,
  ).length;
  const referralOutcomeRate = pct(positiveOutcomeReferrals, totalReferrals);

  const overdueReferralReviews = camhs_referral_records.filter(
    (r) => r.review_overdue,
  ).length;

  const urgentReferrals = camhs_referral_records.filter(
    (r) => r.urgency === "urgent" || r.urgency === "emergency",
  ).length;

  // --- Wellbeing check-ins ---
  const totalCheckins = wellbeing_checkin_records.length;
  const uniqueChildrenCheckedIn = new Set(
    wellbeing_checkin_records.map((w) => w.child_id),
  ).size;
  const wellbeingCheckinRate =
    total_children > 0 ? pct(uniqueChildrenCheckedIn, total_children) : 0;

  const engagedCheckins = wellbeing_checkin_records.filter(
    (w) => w.child_engaged,
  ).length;
  const checkinEngagementRate = pct(engagedCheckins, totalCheckins);

  const checkinsWithConcerns = wellbeing_checkin_records.filter(
    (w) => w.concerns_raised,
  ).length;
  const concernsActionedCount = wellbeing_checkin_records.filter(
    (w) => w.concerns_raised && w.concerns_actioned,
  ).length;
  const concernsActionedRate = pct(concernsActionedCount, checkinsWithConcerns);

  const checkinsRequiringFollowUp = wellbeing_checkin_records.filter(
    (w) => w.follow_up_required,
  ).length;
  const checkinsWithFollowUpDone = wellbeing_checkin_records.filter(
    (w) => w.follow_up_required && w.follow_up_completed,
  ).length;
  const checkinFollowUpRate = pct(checkinsWithFollowUpDone, checkinsRequiringFollowUp);

  const checkinsWithNotes = wellbeing_checkin_records.filter(
    (w) => w.notes_recorded,
  ).length;
  const checkinDocumentationRate = pct(checkinsWithNotes, totalCheckins);

  const moodRatingSum = wellbeing_checkin_records.reduce(
    (sum, w) => sum + w.mood_rating,
    0,
  );
  const avgMoodRating =
    totalCheckins > 0
      ? Math.round((moodRatingSum / totalCheckins) * 100) / 100
      : 0;

  // --- Early intervention ---
  const totalInterventions = early_intervention_records.length;
  const activeInterventions = early_intervention_records.filter(
    (i) => i.active,
  ).length;

  const uniqueChildrenWithIntervention = new Set(
    early_intervention_records.map((i) => i.child_id),
  ).size;
  const earlyInterventionRate =
    total_children > 0 ? pct(uniqueChildrenWithIntervention, total_children) : 0;

  const interventionsShowingImprovement = early_intervention_records.filter(
    (i) => i.current_score > i.baseline_score,
  ).length;
  const interventionEffectivenessRate = pct(
    interventionsShowingImprovement,
    totalInterventions,
  );

  const interventionProgressValues = early_intervention_records
    .filter((i) => i.target_score > i.baseline_score)
    .map((i) => {
      const range = i.target_score - i.baseline_score;
      const progress = i.current_score - i.baseline_score;
      return clamp(Math.round((progress / range) * 100), 0, 100);
    });
  const interventionProgressAvg =
    interventionProgressValues.length > 0
      ? Math.round(
          interventionProgressValues.reduce((sum, v) => sum + v, 0) /
            interventionProgressValues.length,
        )
      : 0;

  const childReportedImprovement = early_intervention_records.filter(
    (i) => i.child_reported_improvement,
  ).length;
  const childReportedImprovementRate = pct(childReportedImprovement, totalInterventions);

  const staffReportedImprovement = early_intervention_records.filter(
    (i) => i.staff_reported_improvement,
  ).length;
  const staffReportedImprovementRate = pct(staffReportedImprovement, totalInterventions);

  const sessionsCompletedTotal = early_intervention_records.reduce(
    (sum, i) => sum + i.sessions_completed,
    0,
  );
  const sessionsPlannedTotal = early_intervention_records.reduce(
    (sum, i) => sum + i.sessions_planned,
    0,
  );
  const sessionCompletionRate = pct(sessionsCompletedTotal, sessionsPlannedTotal);

  const overdueInterventionReviews = early_intervention_records.filter(
    (i) => i.review_overdue && i.active,
  ).length;

  const professionalInvolved = early_intervention_records.filter(
    (i) => i.professional_involved,
  ).length;
  const professionalInvolvementRate = pct(professionalInvolved, totalInterventions);

  // --- Child engagement rate (composite) ---
  const totalEngagementOpportunities =
    totalScreenings + totalAssessments + totalReferrals + totalCheckins + totalInterventions;
  const totalEngaged =
    screeningsWithConsent +
    assessmentsWithChildInvolvement +
    childEngagedWithCamhs +
    engagedCheckins +
    childReportedImprovement;
  const childEngagementRate = pct(totalEngaged, totalEngagementOpportunities);

  // ========================================================================
  // SCORING: base 52, max bonuses +28, 4 penalties
  // ========================================================================

  let score = 52;

  // --- Bonus 1: screeningCompletionRate (>=95: +4, >=80: +2) ---
  if (screeningCompletionRate >= 95) score += 4;
  else if (screeningCompletionRate >= 80) score += 2;

  // --- Bonus 2: anxietyAssessmentRate (>=90: +4, >=70: +2) ---
  if (anxietyAssessmentRate >= 90) score += 4;
  else if (anxietyAssessmentRate >= 70) score += 2;

  // --- Bonus 3: wellbeingCheckinRate (>=95: +4, >=80: +2) ---
  if (wellbeingCheckinRate >= 95) score += 4;
  else if (wellbeingCheckinRate >= 80) score += 2;

  // --- Bonus 4: interventionEffectivenessRate (>=90: +4, >=70: +2) ---
  if (interventionEffectivenessRate >= 90) score += 4;
  else if (interventionEffectivenessRate >= 70) score += 2;

  // --- Bonus 5: followUpCompletionRate (>=95: +3, >=80: +1) ---
  if (followUpCompletionRate >= 95) score += 3;
  else if (followUpCompletionRate >= 80) score += 1;

  // --- Bonus 6: childEngagementRate (>=90: +3, >=70: +1) ---
  if (childEngagementRate >= 90) score += 3;
  else if (childEngagementRate >= 70) score += 1;

  // --- Bonus 7: concernsActionedRate (>=95: +3, >=80: +1) ---
  if (concernsActionedRate >= 95) score += 3;
  else if (concernsActionedRate >= 80) score += 1;

  // --- Bonus 8: sessionCompletionRate (>=90: +2, >=70: +1) ---
  if (sessionCompletionRate >= 90) score += 2;
  else if (sessionCompletionRate >= 70) score += 1;

  // --- Bonus 9: screeningReviewComplianceRate (>=100: +1, >=80: +1) ---
  if (screeningReviewComplianceRate >= 100) score += 1;
  else if (screeningReviewComplianceRate >= 80) score += 1;

  // ---- Penalties (guarded by array.length > 0) ----

  // screeningCoverageRate < 50 -> -5
  if (screeningCoverageRate < 50 && screening_records.length > 0) score -= 5;

  // anxietyAssessmentRate < 40 -> -5
  if (anxietyAssessmentRate < 40 && anxiety_assessment_records.length > 0) score -= 5;

  // wellbeingCheckinRate < 50 -> -4
  if (wellbeingCheckinRate < 50 && wellbeing_checkin_records.length > 0) score -= 4;

  // interventionEffectivenessRate < 40 -> -4
  if (interventionEffectivenessRate < 40 && early_intervention_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const mental_health_rating = toRating(score);

  // ========================================================================
  // STRENGTHS
  // ========================================================================

  const strengths: string[] = [];

  if (screeningCompletionRate >= 95 && totalScreenings > 0) {
    strengths.push(
      `${screeningCompletionRate}% screening completion rate -- the home demonstrates exemplary commitment to completing mental health screenings for all children.`,
    );
  } else if (screeningCompletionRate >= 80 && totalScreenings > 0) {
    strengths.push(
      `${screeningCompletionRate}% screening completion -- strong adherence to mental health screening protocols across the home.`,
    );
  }

  if (screeningCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has been screened for mental health needs -- the home ensures no child's emotional wellbeing goes unassessed.",
    );
  } else if (screeningCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${screeningCoverageRate}% of children have been screened -- good coverage in identifying children's mental health needs.`,
    );
  }

  if (anxietyAssessmentRate >= 90 && total_children > 0) {
    strengths.push(
      `${anxietyAssessmentRate}% of children have received anxiety assessments -- the home proactively identifies and monitors anxiety levels across the cohort.`,
    );
  } else if (anxietyAssessmentRate >= 70 && total_children > 0) {
    strengths.push(
      `${anxietyAssessmentRate}% anxiety assessment coverage -- the majority of children's anxiety levels are being formally assessed and tracked.`,
    );
  }

  if (wellbeingCheckinRate >= 95 && total_children > 0) {
    strengths.push(
      `${wellbeingCheckinRate}% of children receiving wellbeing check-ins -- the home maintains comprehensive emotional monitoring, ensuring every child's wellbeing is regularly reviewed.`,
    );
  } else if (wellbeingCheckinRate >= 80 && total_children > 0) {
    strengths.push(
      `${wellbeingCheckinRate}% wellbeing check-in coverage -- strong routine monitoring of children's emotional health.`,
    );
  }

  if (interventionEffectivenessRate >= 90 && totalInterventions > 0) {
    strengths.push(
      `${interventionEffectivenessRate}% of early interventions showing improvement -- interventions are highly effective in supporting children's mental health recovery.`,
    );
  } else if (interventionEffectivenessRate >= 70 && totalInterventions > 0) {
    strengths.push(
      `${interventionEffectivenessRate}% of early interventions showing improvement -- the majority of mental health interventions are achieving positive outcomes for children.`,
    );
  }

  if (followUpCompletionRate >= 95 && screeningsRequiringFollowUp > 0) {
    strengths.push(
      `${followUpCompletionRate}% of screening follow-ups completed -- the home consistently acts on screening results, ensuring children identified as needing support receive it promptly.`,
    );
  } else if (followUpCompletionRate >= 80 && screeningsRequiringFollowUp > 0) {
    strengths.push(
      `${followUpCompletionRate}% screening follow-up completion -- the home generally acts on screening findings to provide appropriate support.`,
    );
  }

  if (childEngagementRate >= 90 && totalEngagementOpportunities > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement across mental health activities -- children are actively participating in their own mental health care, reflecting a child-centred approach.`,
    );
  } else if (childEngagementRate >= 70 && totalEngagementOpportunities > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement rate -- good levels of children's participation in mental health screening and support activities.`,
    );
  }

  if (concernsActionedRate >= 95 && checkinsWithConcerns > 0) {
    strengths.push(
      `${concernsActionedRate}% of concerns raised in wellbeing check-ins have been actioned -- the home responds swiftly and comprehensively when children express distress or worry.`,
    );
  } else if (concernsActionedRate >= 80 && checkinsWithConcerns > 0) {
    strengths.push(
      `${concernsActionedRate}% of raised concerns actioned -- the home responds to the majority of children's expressed worries and distress.`,
    );
  }

  if (referralAcceptanceRate >= 90 && totalReferrals > 0) {
    strengths.push(
      `${referralAcceptanceRate}% CAMHS referral acceptance rate -- the home makes well-evidenced, appropriate referrals to specialist mental health services.`,
    );
  } else if (referralAcceptanceRate >= 70 && totalReferrals > 0) {
    strengths.push(
      `${referralAcceptanceRate}% referral acceptance -- the home generally submits appropriate CAMHS referrals that meet the threshold for specialist services.`,
    );
  }

  if (attendanceSupportRate >= 90 && totalReferrals > 0) {
    strengths.push(
      `${attendanceSupportRate}% home-supported CAMHS attendance -- the home actively facilitates children's engagement with specialist mental health services.`,
    );
  } else if (attendanceSupportRate >= 70 && totalReferrals > 0) {
    strengths.push(
      `${attendanceSupportRate}% supported attendance at CAMHS appointments -- the home generally ensures children can access their specialist appointments.`,
    );
  }

  if (assessmentImprovementRate >= 80 && totalAssessments > 0) {
    strengths.push(
      `${assessmentImprovementRate}% of anxiety assessments showing improvement -- the home's mental health support is delivering measurable reductions in children's anxiety.`,
    );
  } else if (assessmentImprovementRate >= 60 && totalAssessments > 0) {
    strengths.push(
      `${assessmentImprovementRate}% of assessments showing improvement -- the majority of children are experiencing reductions in their anxiety levels over time.`,
    );
  }

  if (actionPlanRate >= 90 && totalAssessments > 0) {
    strengths.push(
      `${actionPlanRate}% of anxiety assessments result in action plans -- the home systematically translates assessment findings into structured support for each child.`,
    );
  } else if (actionPlanRate >= 70 && totalAssessments > 0) {
    strengths.push(
      `${actionPlanRate}% action plan creation rate -- the home generally produces care plans following anxiety assessments.`,
    );
  }

  if (checkinDocumentationRate >= 90 && totalCheckins > 0) {
    strengths.push(
      `${checkinDocumentationRate}% of wellbeing check-ins have documented notes -- strong recording practice supports evidence of ongoing emotional health monitoring.`,
    );
  }

  if (sessionCompletionRate >= 90 && sessionsPlannedTotal > 0) {
    strengths.push(
      `${sessionCompletionRate}% of planned intervention sessions completed -- the home reliably delivers the mental health support it has committed to.`,
    );
  } else if (sessionCompletionRate >= 70 && sessionsPlannedTotal > 0) {
    strengths.push(
      `${sessionCompletionRate}% intervention session completion -- the home generally follows through on planned mental health interventions.`,
    );
  }

  if (professionalInvolvementRate >= 80 && totalInterventions > 0) {
    strengths.push(
      `${professionalInvolvementRate}% of interventions involve professional input -- the home draws on specialist mental health expertise to support children effectively.`,
    );
  }

  if (screeningReviewComplianceRate >= 100 && totalScreenings > 0) {
    strengths.push(
      "All screening reviews are up to date -- the home ensures mental health assessments remain current and reflective of children's evolving needs.",
    );
  } else if (screeningReviewComplianceRate >= 80 && totalScreenings > 0) {
    strengths.push(
      `${screeningReviewComplianceRate}% screening review compliance -- strong adherence to review timescales for mental health screenings.`,
    );
  }

  if (avgMoodRating >= 7.0 && totalCheckins > 0) {
    strengths.push(
      `Average mood rating of ${avgMoodRating}/10 across wellbeing check-ins -- children generally report positive emotional states, indicating a supportive home environment.`,
    );
  }

  // ========================================================================
  // CONCERNS
  // ========================================================================

  const concerns: string[] = [];

  if (screeningCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${screeningCoverageRate}% of children have been screened for mental health needs -- the majority of children's emotional wellbeing has not been formally assessed, preventing early identification of anxiety and mental health difficulties.`,
    );
  } else if (screeningCoverageRate < 80 && screeningCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `Screening coverage at ${screeningCoverageRate}% -- some children's mental health needs remain unassessed, which may result in undetected anxiety or emotional difficulties.`,
    );
  }

  if (screeningCompletionRate < 50 && totalScreenings > 0) {
    concerns.push(
      `Only ${screeningCompletionRate}% of screenings completed -- the majority of initiated mental health screenings are not being finished, severely undermining the home's ability to identify children's needs.`,
    );
  } else if (screeningCompletionRate < 80 && screeningCompletionRate >= 50 && totalScreenings > 0) {
    concerns.push(
      `Screening completion rate at ${screeningCompletionRate}% -- incomplete screenings mean some children's mental health needs may not be fully identified.`,
    );
  }

  if (anxietyAssessmentRate < 40 && total_children > 0 && totalAssessments > 0) {
    concerns.push(
      `Only ${anxietyAssessmentRate}% of children have received anxiety assessments -- the majority of children's anxiety levels are unmonitored, meaning early signs of escalation may be missed.`,
    );
  } else if (anxietyAssessmentRate < 70 && anxietyAssessmentRate >= 40 && total_children > 0) {
    concerns.push(
      `Anxiety assessment coverage at ${anxietyAssessmentRate}% -- not all children have had formal anxiety assessments, leaving potential gaps in understanding individual mental health needs.`,
    );
  }

  if (wellbeingCheckinRate < 50 && total_children > 0 && totalCheckins > 0) {
    concerns.push(
      `Only ${wellbeingCheckinRate}% of children receiving wellbeing check-ins -- the majority of children's day-to-day emotional health is not being routinely monitored.`,
    );
  } else if (wellbeingCheckinRate < 80 && wellbeingCheckinRate >= 50 && total_children > 0) {
    concerns.push(
      `Wellbeing check-in coverage at ${wellbeingCheckinRate}% -- some children are not receiving regular emotional health monitoring, creating gaps in the home's understanding of their wellbeing.`,
    );
  }

  if (interventionEffectivenessRate < 40 && totalInterventions > 0) {
    concerns.push(
      `Only ${interventionEffectivenessRate}% of early interventions showing improvement -- the majority of mental health interventions are not achieving their intended outcomes, suggesting a need for fundamental review of the home's therapeutic approach.`,
    );
  } else if (interventionEffectivenessRate < 70 && interventionEffectivenessRate >= 40 && totalInterventions > 0) {
    concerns.push(
      `Intervention effectiveness at ${interventionEffectivenessRate}% -- not all mental health interventions are achieving positive outcomes. Review is needed to ensure interventions are appropriately matched to individual children's needs.`,
    );
  }

  if (followUpCompletionRate < 50 && screeningsRequiringFollowUp > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of screening follow-ups completed -- children identified as needing further assessment or support are not receiving it, creating a dangerous gap between identification and action.`,
    );
  } else if (followUpCompletionRate < 80 && followUpCompletionRate >= 50 && screeningsRequiringFollowUp > 0) {
    concerns.push(
      `Follow-up completion at ${followUpCompletionRate}% -- not all children flagged during screening are receiving timely follow-up, delaying access to support.`,
    );
  }

  if (concernsActionedRate < 50 && checkinsWithConcerns > 0) {
    concerns.push(
      `Only ${concernsActionedRate}% of concerns raised in wellbeing check-ins have been actioned -- children are reporting worries that the home is not responding to, undermining trust and the value of the check-in process.`,
    );
  } else if (concernsActionedRate < 80 && concernsActionedRate >= 50 && checkinsWithConcerns > 0) {
    concerns.push(
      `Concerns actioned rate at ${concernsActionedRate}% -- some children's expressed worries are not being followed up, which may discourage them from sharing in future.`,
    );
  }

  if (childEngagementRate < 50 && totalEngagementOpportunities > 0) {
    concerns.push(
      `Child engagement at only ${childEngagementRate}% across mental health activities -- most children are not actively participating in their own mental health care, which limits the effectiveness of support.`,
    );
  } else if (childEngagementRate < 70 && childEngagementRate >= 50 && totalEngagementOpportunities > 0) {
    concerns.push(
      `Child engagement rate at ${childEngagementRate}% -- a significant proportion of children are not fully engaged with their mental health screening and support.`,
    );
  }

  if (overdueScreeningReviews > 0 && totalScreenings > 0) {
    concerns.push(
      `${overdueScreeningReviews} screening review${overdueScreeningReviews !== 1 ? "s are" : " is"} overdue -- without timely reviews, screenings may not reflect children's current mental health status.`,
    );
  }

  if (overdueAssessmentReviews > 0 && totalAssessments > 0) {
    concerns.push(
      `${overdueAssessmentReviews} anxiety assessment review${overdueAssessmentReviews !== 1 ? "s are" : " is"} overdue -- children's anxiety levels may have changed since their last assessment, and overdue reviews prevent timely response to escalation.`,
    );
  }

  if (overdueReferralReviews > 0 && totalReferrals > 0) {
    concerns.push(
      `${overdueReferralReviews} CAMHS referral review${overdueReferralReviews !== 1 ? "s are" : " is"} overdue -- active referrals require regular review to ensure children are receiving the specialist support they need.`,
    );
  }

  if (overdueInterventionReviews > 0 && activeInterventions > 0) {
    concerns.push(
      `${overdueInterventionReviews} active intervention review${overdueInterventionReviews !== 1 ? "s are" : " is"} overdue -- interventions without timely review may continue ineffectively or miss opportunities to adjust approach.`,
    );
  }

  if (severeAssessments > 0) {
    concerns.push(
      `${severeAssessments} child${severeAssessments !== 1 ? "ren have" : " has"} severe anxiety -- children with severe anxiety require immediate, intensive support and regular specialist review.`,
    );
  }

  if (referralAcceptanceRate < 50 && totalReferrals > 0) {
    concerns.push(
      `Only ${referralAcceptanceRate}% of CAMHS referrals accepted -- low acceptance rates may indicate referrals are not meeting thresholds, documentation is insufficient, or there are barriers to accessing specialist services.`,
    );
  }

  if (avgDaysToFirstAppt > 90 && referralDaysToAppt.length > 0) {
    concerns.push(
      `Average wait of ${avgDaysToFirstAppt} days to first CAMHS appointment -- extended waits leave children without specialist support during a critical period.`,
    );
  }

  if (sessionCompletionRate < 50 && sessionsPlannedTotal > 0) {
    concerns.push(
      `Only ${sessionCompletionRate}% of planned intervention sessions completed -- the home is not delivering the mental health support it has committed to, potentially leaving children's needs unmet.`,
    );
  }

  if (checkinDocumentationRate < 70 && totalCheckins > 0) {
    concerns.push(
      `Wellbeing check-in documentation at only ${checkinDocumentationRate}% -- poor recording makes it difficult to evidence the quality of emotional health monitoring.`,
    );
  }

  if (actionPlanRate < 50 && totalAssessments > 0) {
    concerns.push(
      `Only ${actionPlanRate}% of anxiety assessments result in action plans -- assessments without structured follow-up plans fail to translate findings into practical support for children.`,
    );
  }

  if (avgMoodRating < 4.0 && totalCheckins > 0) {
    concerns.push(
      `Average mood rating of ${avgMoodRating}/10 across wellbeing check-ins -- children are consistently reporting low mood, indicating widespread emotional distress that requires immediate therapeutic response.`,
    );
  }

  // ========================================================================
  // RECOMMENDATIONS
  // ========================================================================

  const recommendations: AnxietyMentalHealthRecommendation[] = [];
  let rank = 0;

  if (screeningCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement mental health screening for all children -- every child's emotional and mental health needs must be formally assessed to enable early identification of anxiety and other difficulties. Screen within the first week of placement and at regular intervals thereafter.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (followUpCompletionRate < 50 && screeningsRequiringFollowUp > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently complete all outstanding screening follow-ups -- children identified as needing further assessment or support must not be left without action. Implement a tracking system to ensure every flagged screening triggers a documented response within 48 hours.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (anxietyAssessmentRate < 40 && total_children > 0 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend anxiety assessments to all children -- without formal anxiety assessment, the home cannot identify children who may be suffering in silence. Use validated tools such as GAD-7, RCADS, or SCARED to ensure assessments are clinically robust.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (wellbeingCheckinRate < 50 && total_children > 0 && totalCheckins > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently extend wellbeing check-ins to all children -- every child needs regular, structured emotional health monitoring to detect emerging difficulties early and provide responsive support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (interventionEffectivenessRate < 40 && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and redesign ineffective mental health interventions -- when the majority of interventions are not achieving improvement, the therapeutic approach needs fundamental reassessment with specialist input from CAMHS or clinical psychology.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (concernsActionedRate < 50 && checkinsWithConcerns > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a system to ensure every concern raised during wellbeing check-ins receives a documented response within 24 hours. Children who share worries and see no action will disengage from the process.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Children's mental and emotional health needs are met",
    });
  }

  if (severeAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children with severe anxiety assessments have active specialist support plans, CAMHS involvement, and weekly review. Severe anxiety requires intensive, clinically-informed intervention.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (avgMoodRating < 4.0 && totalCheckins > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address widespread low mood across the home -- consistently low mood ratings indicate systemic emotional distress. Consider environmental factors, peer dynamics, and whether the home's therapeutic milieu is genuinely supportive.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Children's wellbeing and emotional health",
    });
  }

  if (overdueScreeningReviews > 0 && totalScreenings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue screening reviews -- children's mental health needs evolve and screenings must be kept current to ensure care remains appropriate and responsive.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (overdueAssessmentReviews > 0 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue anxiety assessment reviews -- anxiety levels fluctuate, and out-of-date assessments may lead to inadequate or excessive intervention.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (overdueInterventionReviews > 0 && activeInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue intervention reviews -- without timely review, the home cannot ensure interventions remain appropriate and effective for each child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (
    screeningCoverageRate >= 50 &&
    screeningCoverageRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend screening coverage to all children -- aim for 100% coverage to ensure every child's mental health needs are formally identified.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (
    anxietyAssessmentRate >= 40 &&
    anxietyAssessmentRate < 70 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase anxiety assessment coverage to at least 70% -- children without formal anxiety assessment may have undetected needs that worsen without early intervention.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (
    wellbeingCheckinRate >= 50 &&
    wellbeingCheckinRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend wellbeing check-ins to all children -- aim for at least weekly structured check-ins for every child to maintain continuous emotional health monitoring.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Children's wellbeing and emotional health",
    });
  }

  if (
    interventionEffectivenessRate >= 40 &&
    interventionEffectivenessRate < 70 &&
    totalInterventions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review mental health interventions not showing improvement -- consider whether different approaches, increased professional input, or adjusted goals would better serve each child's needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (sessionCompletionRate < 70 && sessionsPlannedTotal > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve intervention session completion rate -- when planned sessions are not delivered, children miss out on committed support. Review staffing, scheduling, and barriers to consistent delivery.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (referralAcceptanceRate < 50 && totalReferrals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review CAMHS referral quality and documentation -- low acceptance rates suggest referrals may not be meeting thresholds. Work with CAMHS to understand criteria and ensure referrals are well-evidenced.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider system",
    });
  }

  if (actionPlanRate < 70 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every anxiety assessment results in a documented action plan -- assessments without structured follow-up fail to translate findings into practical support for children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (assessmentChildInvolvementRate < 70 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child involvement in anxiety assessments -- children must be active participants in understanding their own mental health to ensure assessments are accurate and meaningful.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Voice of the child",
    });
  }

  if (checkinDocumentationRate < 70 && totalCheckins > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve wellbeing check-in documentation -- each check-in should have recorded notes detailing the child's emotional state, any concerns raised, and actions taken.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care of children",
    });
  }

  if (professionalInvolvementRate < 50 && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase professional involvement in early interventions -- specialist mental health expertise will improve the quality and effectiveness of therapeutic support for children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider system",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70 &&
    totalEngagementOpportunities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore ways to increase children's engagement with their mental health care -- consider age-appropriate approaches, creative methods, and ensuring children understand the purpose and benefits of participation.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Voice of the child",
    });
  }

  if (
    concernsActionedRate >= 50 &&
    concernsActionedRate < 80 &&
    checkinsWithConcerns > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the response rate to concerns raised in wellbeing check-ins -- ensure all staff understand that every concern raised by a child requires a documented response and follow-through.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Children's mental and emotional health needs are met",
    });
  }

  // ========================================================================
  // INSIGHTS
  // ========================================================================

  const insights: AnxietyMentalHealthInsight[] = [];

  // -- Critical insights --

  if (screeningCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${screeningCoverageRate}% of children have been screened for mental health needs. Without formal screening, the home cannot identify children who may be experiencing anxiety, depression, or other emotional difficulties. Ofsted expects evidence that children's mental health is actively assessed and monitored under Reg 14.`,
      severity: "critical",
    });
  }

  if (anxietyAssessmentRate < 40 && total_children > 0 && totalAssessments > 0) {
    insights.push({
      text: `Only ${anxietyAssessmentRate}% of children have received anxiety assessments. Looked-after children are disproportionately affected by anxiety, and without formal assessment using validated tools, the home cannot evidence that it understands or is responding to children's anxiety needs.`,
      severity: "critical",
    });
  }

  if (wellbeingCheckinRate < 50 && total_children > 0 && totalCheckins > 0) {
    insights.push({
      text: `Only ${wellbeingCheckinRate}% of children receive regular wellbeing check-ins. Without routine emotional health monitoring, the home cannot detect changes in children's mental state early enough to intervene before difficulties escalate.`,
      severity: "critical",
    });
  }

  if (interventionEffectivenessRate < 40 && totalInterventions > 0) {
    insights.push({
      text: `Only ${interventionEffectivenessRate}% of early interventions showing improvement. When most interventions are not working, this indicates a systemic issue -- interventions may not be appropriately matched to children's needs, professionally informed, or consistently delivered. A fundamental review with specialist input is needed.`,
      severity: "critical",
    });
  }

  if (followUpCompletionRate < 50 && screeningsRequiringFollowUp > 0) {
    insights.push({
      text: `Only ${followUpCompletionRate}% of screening follow-ups completed. This is a critical safety gap -- children have been identified as needing further assessment or support, but the home has failed to act. This means known risks are not being managed and children may deteriorate without intervention.`,
      severity: "critical",
    });
  }

  if (severeAssessments > 0 && totalAssessments > 0) {
    const severePct = pct(severeAssessments, totalAssessments);
    insights.push({
      text: `${severeAssessments} child${severeAssessments !== 1 ? "ren" : ""} assessed with severe anxiety (${severePct}% of assessments). Children with severe anxiety are at significant risk of self-harm, disengagement, and placement breakdown. These children require intensive, clinically-informed support with regular specialist review.`,
      severity: "critical",
    });
  }

  if (avgMoodRating < 4.0 && totalCheckins > 0) {
    insights.push({
      text: `Average mood rating of ${avgMoodRating}/10 indicates widespread emotional distress across the home. Consistently low mood across the cohort suggests environmental or systemic factors may be contributing to children's poor emotional health, beyond individual clinical needs.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    screeningCoverageRate >= 50 &&
    screeningCoverageRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Screening coverage at ${screeningCoverageRate}% -- improving but some children still lack a formal mental health screening. Each unscreened child may have unidentified emotional difficulties affecting their daily experience and wellbeing.`,
      severity: "warning",
    });
  }

  if (
    anxietyAssessmentRate >= 40 &&
    anxietyAssessmentRate < 70 &&
    total_children > 0
  ) {
    insights.push({
      text: `Anxiety assessment coverage at ${anxietyAssessmentRate}% -- a proportion of children have not been formally assessed for anxiety. Given the prevalence of anxiety among looked-after children, this gap may mean some children's needs remain hidden.`,
      severity: "warning",
    });
  }

  if (
    interventionEffectivenessRate >= 40 &&
    interventionEffectivenessRate < 70 &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `Intervention effectiveness at ${interventionEffectivenessRate}% -- some interventions are not achieving the expected improvement. Consider whether the approach, intensity, or therapeutic model needs adjustment for individual children.`,
      severity: "warning",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70 &&
    totalEngagementOpportunities > 0
  ) {
    insights.push({
      text: `Child engagement at ${childEngagementRate}% -- a notable proportion of children are not actively participating in their mental health care. Engagement is essential for therapeutic benefit; consider whether approaches feel meaningful and accessible to each child.`,
      severity: "warning",
    });
  }

  if (
    concernsActionedRate >= 50 &&
    concernsActionedRate < 80 &&
    checkinsWithConcerns > 0
  ) {
    insights.push({
      text: `Concerns actioned rate at ${concernsActionedRate}% -- some children's expressed worries are not being followed up. When children share concerns and see no response, they learn that sharing is pointless, which erodes the therapeutic relationship.`,
      severity: "warning",
    });
  }

  if (overdueScreeningReviews > 0 && totalScreenings > 0) {
    insights.push({
      text: `${overdueScreeningReviews} screening review${overdueScreeningReviews !== 1 ? "s" : ""} overdue. Children's mental health needs change rapidly, particularly during placement transitions. Out-of-date screenings may lead to inappropriate or insufficient support.`,
      severity: "warning",
    });
  }

  if (overdueAssessmentReviews > 0 && totalAssessments > 0) {
    insights.push({
      text: `${overdueAssessmentReviews} anxiety assessment review${overdueAssessmentReviews !== 1 ? "s" : ""} overdue. Anxiety levels can fluctuate significantly, and overdue reviews may mean the home is responding to a child's previous state rather than their current needs.`,
      severity: "warning",
    });
  }

  if (overdueInterventionReviews > 0 && activeInterventions > 0) {
    insights.push({
      text: `${overdueInterventionReviews} active intervention${overdueInterventionReviews !== 1 ? "s have" : " has"} overdue reviews. Without timely review, ineffective interventions may continue unchanged while children's needs remain unmet.`,
      severity: "warning",
    });
  }

  if (sessionCompletionRate < 70 && sessionCompletionRate >= 50 && sessionsPlannedTotal > 0) {
    insights.push({
      text: `Session completion at ${sessionCompletionRate}% -- planned sessions are not being consistently delivered. Gaps in planned support may reduce the cumulative benefit of mental health interventions for children.`,
      severity: "warning",
    });
  }

  if (moderateAssessments > 0 && totalAssessments > 0) {
    const moderatePct = pct(moderateAssessments, totalAssessments);
    if (moderatePct >= 30) {
      insights.push({
        text: `${moderateAssessments} child${moderateAssessments !== 1 ? "ren" : ""} assessed with moderate anxiety (${moderatePct}% of assessments). Moderate anxiety can escalate to severe without appropriate intervention. Ensure these children have active support plans and regular monitoring.`,
        severity: "warning",
      });
    }
  }

  if (avgDaysToFirstAppt > 60 && referralDaysToAppt.length > 0) {
    insights.push({
      text: `Average wait of ${avgDaysToFirstAppt} days to first CAMHS appointment. Extended waiting periods leave children without specialist support and may lead to deterioration. Consider what interim therapeutic support the home can provide while children wait.`,
      severity: "warning",
    });
  }

  // Analysis of intervention types
  const interventionTypeCounts: Record<string, number> = {};
  for (const iv of early_intervention_records.filter((i) => i.active)) {
    interventionTypeCounts[iv.intervention_type] =
      (interventionTypeCounts[iv.intervention_type] ?? 0) + 1;
  }
  const topInterventionTypes = Object.entries(interventionTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topInterventionTypes.length > 0 && activeInterventions >= 3) {
    const ivStr = topInterventionTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Active intervention types: ${ivStr}. A diverse intervention portfolio suggests the home tailors its therapeutic approach to individual children's needs rather than applying a one-size-fits-all model.`,
      severity: "warning",
    });
  }

  // Analysis of assessment types
  const assessmentTypeCounts: Record<string, number> = {};
  for (const a of anxiety_assessment_records) {
    assessmentTypeCounts[a.assessment_type] =
      (assessmentTypeCounts[a.assessment_type] ?? 0) + 1;
  }
  const topAssessmentTypes = Object.entries(assessmentTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topAssessmentTypes.length > 0 && totalAssessments >= 3) {
    const atStr = topAssessmentTypes
      .map(([t, c]) => `${t.replace(/_/g, " ").toUpperCase()} (${c})`)
      .join(", ");
    insights.push({
      text: `Assessment tools used: ${atStr}. Using validated, recognised assessment tools demonstrates the home's commitment to evidence-based mental health practice.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (mental_health_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding anxiety and mental health screening -- children's emotional needs are comprehensively identified, assessed, and supported through a robust framework of screening, assessment, wellbeing monitoring, and early intervention. This is strong evidence of child-centred mental health care under Reg 14.",
      severity: "positive",
    });
  }

  if (
    screeningCoverageRate >= 100 &&
    screeningCompletionRate >= 95 &&
    total_children > 0 &&
    totalScreenings > 0
  ) {
    insights.push({
      text: "Every child screened with a 95%+ completion rate -- the home excels at identifying each child's mental health needs through comprehensive, reliable screening. This creates a strong foundation for targeted support.",
      severity: "positive",
    });
  }

  if (
    anxietyAssessmentRate >= 90 &&
    assessmentImprovementRate >= 80 &&
    total_children > 0 &&
    totalAssessments > 0
  ) {
    insights.push({
      text: `${anxietyAssessmentRate}% anxiety assessment coverage with ${assessmentImprovementRate}% showing improvement -- the home not only identifies anxiety comprehensively but achieves measurable reductions through effective support.`,
      severity: "positive",
    });
  }

  if (
    wellbeingCheckinRate >= 95 &&
    concernsActionedRate >= 95 &&
    total_children > 0 &&
    checkinsWithConcerns > 0
  ) {
    insights.push({
      text: `${wellbeingCheckinRate}% wellbeing check-in coverage with ${concernsActionedRate}% of concerns actioned -- children's emotional health is monitored comprehensively and their expressed worries are consistently responded to, building trust and therapeutic engagement.`,
      severity: "positive",
    });
  }

  if (
    interventionEffectivenessRate >= 90 &&
    childReportedImprovementRate >= 80 &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `${interventionEffectivenessRate}% of interventions showing improvement with ${childReportedImprovementRate}% of children reporting benefit -- both objective measures and children's own experience confirm that early interventions are working effectively.`,
      severity: "positive",
    });
  }

  if (
    followUpCompletionRate >= 95 &&
    screeningsRequiringFollowUp > 0
  ) {
    insights.push({
      text: `${followUpCompletionRate}% screening follow-up completion -- the home closes the loop between identification and action, ensuring that screening is not merely a bureaucratic exercise but a genuine pathway to support.`,
      severity: "positive",
    });
  }

  if (
    childEngagementRate >= 90 &&
    totalEngagementOpportunities > 0
  ) {
    insights.push({
      text: `${childEngagementRate}% child engagement across mental health activities -- children are actively participating in their own care, which is powerful evidence that the home's approach is child-centred and therapeutically meaningful.`,
      severity: "positive",
    });
  }

  if (
    sessionCompletionRate >= 90 &&
    professionalInvolvementRate >= 80 &&
    sessionsPlannedTotal > 0 &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `${sessionCompletionRate}% session completion with ${professionalInvolvementRate}% professional involvement -- the home delivers interventions reliably and draws on specialist expertise, creating a robust foundation for effective mental health support.`,
      severity: "positive",
    });
  }

  if (
    staffReportedImprovementRate >= 80 &&
    childReportedImprovementRate >= 80 &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `Both staff (${staffReportedImprovementRate}%) and children (${childReportedImprovementRate}%) report improvement -- the convergence of staff observation and child self-report provides compelling evidence that mental health interventions are genuinely transformative.`,
      severity: "positive",
    });
  }

  if (
    attendanceSupportRate >= 90 &&
    camhsChildEngagementRate >= 90 &&
    totalReferrals > 0
  ) {
    insights.push({
      text: `${attendanceSupportRate}% CAMHS attendance support with ${camhsChildEngagementRate}% child engagement -- the home actively facilitates specialist mental health care and children are engaging positively, maximising the benefit of CAMHS involvement.`,
      severity: "positive",
    });
  }

  if (
    referralOutcomeRate >= 80 &&
    totalReferrals > 0
  ) {
    insights.push({
      text: `${referralOutcomeRate}% positive outcomes from CAMHS referrals -- the home's referral pathway is producing tangible benefits for children, with specialist input translating into measurable improvement.`,
      severity: "positive",
    });
  }

  // ========================================================================
  // HEADLINE
  // ========================================================================

  let headline: string;

  if (mental_health_rating === "outstanding") {
    headline =
      "Outstanding anxiety and mental health screening -- children's emotional needs are comprehensively identified, assessed, and supported through effective screening, CAMHS pathways, and early intervention.";
  } else if (mental_health_rating === "good") {
    headline = `Good anxiety and mental health screening -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (mental_health_rating === "adequate") {
    headline = `Adequate anxiety and mental health screening -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's mental health needs are fully met.`;
  } else {
    headline = `Anxiety and mental health screening is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's emotional and mental health needs are identified and supported.`;
  }

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    mental_health_rating,
    mental_health_score: score,
    headline,
    total_screenings: totalScreenings,
    screening_completion_rate: screeningCompletionRate,
    anxiety_assessment_rate: anxietyAssessmentRate,
    camhs_referral_rate: camhsReferralRate,
    wellbeing_checkin_rate: wellbeingCheckinRate,
    early_intervention_rate: earlyInterventionRate,
    child_engagement_rate: childEngagementRate,
    assessment_improvement_avg: assessmentImprovementAvg,
    intervention_progress_avg: interventionProgressAvg,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
