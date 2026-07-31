// ==============================================================================
// CARA -- HOME PET & ANIMAL THERAPY INTELLIGENCE ENGINE
// Monitors animal-assisted therapy quality across the home -- therapy session
// frequency, pet care responsibility allocation, therapeutic animal interaction
// outcomes, animal welfare compliance, and child engagement with animals.
// Measures therapy frequency rate, pet care responsibility rate, interaction
// outcome rate, welfare compliance rate, child engagement rate, and child
// benefit rate.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging with the wider community), SCCIF: experiences and
// progress for children. HOME-LEVEL engine.
// Store keys: therapySessionRecords, petCareRecords, animalInteractionRecords,
//             animalWelfareRecords, childEngagementRecords
// ==============================================================================

import { above, below, meets } from "@/lib/metrics/rate";

// -- Input Types -------------------------------------------------------------

export interface TherapySessionInput {
  id: string;
  child_id: string;
  session_date: string;
  session_type: "individual" | "group" | "structured" | "informal" | "assessment";
  animal_type: string;
  animal_name: string;
  therapist_name: string;
  duration_minutes: number;
  goals_set: boolean;
  goals_met: boolean;
  child_engagement_rating: number; // 1-5
  outcome_rating: number; // 1-5
  child_feedback_positive: boolean;
  staff_present: boolean;
  risk_assessment_completed: boolean;
  notes_recorded: boolean;
  follow_up_planned: boolean;
  created_at: string;
}

export interface PetCareInput {
  id: string;
  child_id: string;
  animal_id: string;
  animal_type: string;
  care_date: string;
  care_type: "feeding" | "grooming" | "exercise" | "cleaning" | "health_check" | "general";
  responsibility_assigned: boolean;
  responsibility_completed: boolean;
  supervised: boolean;
  child_initiated: boolean;
  child_engagement_rating: number; // 1-5
  skills_demonstrated: string[];
  staff_observer: string;
  notes_recorded: boolean;
  created_at: string;
}

export interface AnimalInteractionInput {
  id: string;
  child_id: string;
  animal_id: string;
  animal_type: string;
  interaction_date: string;
  interaction_type: "therapeutic" | "recreational" | "educational" | "bonding" | "calming" | "reward";
  duration_minutes: number;
  setting: "indoor" | "outdoor" | "visit" | "off_site";
  child_mood_before: number; // 1-5
  child_mood_after: number; // 1-5
  positive_outcome: boolean;
  behavioural_improvement: boolean;
  emotional_regulation_observed: boolean;
  risk_assessment_current: boolean;
  staff_present: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface AnimalWelfareInput {
  id: string;
  animal_id: string;
  animal_type: string;
  animal_name: string;
  check_date: string;
  check_type: "routine" | "veterinary" | "welfare_audit" | "environment" | "behavioural";
  health_status: "excellent" | "good" | "fair" | "poor" | "critical";
  welfare_standards_met: boolean;
  environment_suitable: boolean;
  diet_appropriate: boolean;
  exercise_adequate: boolean;
  veterinary_up_to_date: boolean;
  insurance_current: boolean;
  risk_assessment_current: boolean;
  concerns_identified: boolean;
  concerns_actioned: boolean;
  next_review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface ChildEngagementInput {
  id: string;
  child_id: string;
  assessment_date: string;
  engagement_level: "high" | "moderate" | "low" | "disengaged" | "refused";
  therapeutic_benefit_observed: boolean;
  confidence_improved: boolean;
  empathy_demonstrated: boolean;
  responsibility_skills_improved: boolean;
  social_skills_improved: boolean;
  emotional_regulation_improved: boolean;
  child_self_reported_benefit: boolean;
  staff_reported_benefit: boolean;
  overall_progress_rating: number; // 1-5
  barriers_identified: string[];
  support_plan_in_place: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface PetAnimalTherapyInput {
  today: string;
  total_children: number;
  therapy_session_records: TherapySessionInput[];
  pet_care_records: PetCareInput[];
  animal_interaction_records: AnimalInteractionInput[];
  animal_welfare_records: AnimalWelfareInput[];
  child_engagement_records: ChildEngagementInput[];
}

// -- Output Types ------------------------------------------------------------

export type PetAnimalTherapyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PetAnimalTherapyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PetAnimalTherapyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PetAnimalTherapyResult {
  therapy_rating: PetAnimalTherapyRating;
  therapy_score: number;
  headline: string;
  total_sessions: number;
  therapy_frequency_rate: number;
  pet_care_responsibility_rate: number;
  interaction_outcome_rate: number;
  welfare_compliance_rate: number;
  child_engagement_rate: number;
  child_benefit_rate: number;
  // The 6 rate fields above use pct() directly (deterministic 0 on empty).
  // The 2 avg fields below are null on empty: no source records ⇒ no signal.
  // Fab-0 doctrine.
  session_goal_achievement_avg: number | null;
  mood_improvement_avg: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: PetAnimalTherapyRecommendation[];
  insights: PetAnimalTherapyInsight[];
}

// -- Helpers -----------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PetAnimalTherapyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory ----------------------------------------------------

function emptyResult(
  rating: PetAnimalTherapyRating,
  score: number,
  headline: string,
): PetAnimalTherapyResult {
  return {
    therapy_rating: rating,
    therapy_score: score,
    headline,
    total_sessions: 0,
    therapy_frequency_rate: 0,
    pet_care_responsibility_rate: 0,
    interaction_outcome_rate: 0,
    welfare_compliance_rate: 0,
    child_engagement_rate: 0,
    child_benefit_rate: 0,
    session_goal_achievement_avg: null,
    mood_improvement_avg: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute ------------------------------------------------------------

export function computePetAnimalTherapy(
  input: PetAnimalTherapyInput,
): PetAnimalTherapyResult {
  const {
    total_children,
    therapy_session_records,
    pet_care_records,
    animal_interaction_records,
    animal_welfare_records,
    child_engagement_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data -----------
  const allEmpty =
    therapy_session_records.length === 0 &&
    pet_care_records.length === 0 &&
    animal_interaction_records.length === 0 &&
    animal_welfare_records.length === 0 &&
    child_engagement_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess pet and animal therapy provision.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate ----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No pet or animal therapy data recorded despite children on placement -- animal-assisted therapy provision requires urgent attention.",
      ),
      concerns: [
        "No therapy session records, pet care records, animal interaction records, welfare records, or child engagement records exist despite children being on placement -- the home cannot evidence any animal-assisted therapy provision or animal welfare compliance.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Establish structured animal-assisted therapy sessions with clear therapeutic goals for children who would benefit, ensuring sessions are led by trained staff or qualified therapists with documented risk assessments.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
        },
        {
          rank: 2,
          recommendation:
            "Implement comprehensive animal welfare monitoring and compliance tracking to ensure all therapy animals receive appropriate veterinary care, environmental conditions, and welfare checks in line with the Animal Welfare Act 2006.",
          urgency: "immediate",
          regulatory_ref: "SCCIF -- Experiences and progress",
        },
      ],
      insights: [
        {
          text: "The complete absence of animal therapy records means the home cannot demonstrate how animal-assisted interventions contribute to children's therapeutic progress, emotional regulation, or development of responsibility and empathy skills. Where animal therapy is part of the home's provision, comprehensive recording is essential for Ofsted evidence.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics ------------------------------------------------

  // --- Therapy session frequency & coverage ---
  const totalSessions = therapy_session_records.length;
  const uniqueChildrenWithSessions = new Set(
    therapy_session_records.map((s) => s.child_id),
  ).size;
  const therapyFrequencyRate =
    total_children > 0 ? pct(uniqueChildrenWithSessions, total_children) : 0;

  const sessionsWithGoalsSet = therapy_session_records.filter(
    (s) => s.goals_set,
  ).length;
  const goalSettingRate = pct(sessionsWithGoalsSet, totalSessions);

  const sessionsWithGoalsMet = therapy_session_records.filter(
    (s) => s.goals_set && s.goals_met,
  ).length;
  const goalAchievementRate = pct(sessionsWithGoalsMet, sessionsWithGoalsSet);

  const sessionsWithPositiveFeedback = therapy_session_records.filter(
    (s) => s.child_feedback_positive,
  ).length;
  const sessionFeedbackRate = pct(sessionsWithPositiveFeedback, totalSessions);

  const sessionsWithRiskAssessment = therapy_session_records.filter(
    (s) => s.risk_assessment_completed,
  ).length;
  const sessionRiskAssessmentRate = pct(sessionsWithRiskAssessment, totalSessions);

  const sessionsWithNotes = therapy_session_records.filter(
    (s) => s.notes_recorded,
  ).length;
  const sessionDocumentationRate = pct(sessionsWithNotes, totalSessions);

  const sessionsWithFollowUp = therapy_session_records.filter(
    (s) => s.follow_up_planned,
  ).length;
  const followUpRate = pct(sessionsWithFollowUp, totalSessions);

  const sessionEngagementSum = therapy_session_records.reduce(
    (sum, s) => sum + s.child_engagement_rating,
    0,
  );
  const sessionEngagementAvg: number | null =
    totalSessions > 0
      ? Math.round((sessionEngagementSum / totalSessions) * 100) / 100
      : null;

  const sessionOutcomeSum = therapy_session_records.reduce(
    (sum, s) => sum + s.outcome_rating,
    0,
  );
  const sessionOutcomeAvg: number | null =
    totalSessions > 0
      ? Math.round((sessionOutcomeSum / totalSessions) * 100) / 100
      : null;

  const sessionGoalAchievementAvg: number | null =
    sessionsWithGoalsSet > 0
      ? Math.round((sessionsWithGoalsMet / sessionsWithGoalsSet) * 100) / 100
      : null;

  // --- Pet care responsibility ---
  const totalCareRecords = pet_care_records.length;
  const careWithResponsibilityAssigned = pet_care_records.filter(
    (c) => c.responsibility_assigned,
  ).length;
  const careWithResponsibilityCompleted = pet_care_records.filter(
    (c) => c.responsibility_assigned && c.responsibility_completed,
  ).length;
  const petCareResponsibilityRate = pct(
    careWithResponsibilityCompleted,
    careWithResponsibilityAssigned,
  );

  const uniqueChildrenWithCare = new Set(
    pet_care_records.map((c) => c.child_id),
  ).size;
  const careParticipationRate =
    total_children > 0 ? pct(uniqueChildrenWithCare, total_children) : 0;

  const childInitiatedCare = pet_care_records.filter(
    (c) => c.child_initiated,
  ).length;
  const childInitiatedCareRate = pct(childInitiatedCare, totalCareRecords);

  const careSupervised = pet_care_records.filter(
    (c) => c.supervised,
  ).length;
  const supervisionRate = pct(careSupervised, totalCareRecords);

  const careEngagementSum = pet_care_records.reduce(
    (sum, c) => sum + c.child_engagement_rating,
    0,
  );
  const careEngagementAvg: number | null =
    totalCareRecords > 0
      ? Math.round((careEngagementSum / totalCareRecords) * 100) / 100
      : null;

  const careNotesRecorded = pet_care_records.filter(
    (c) => c.notes_recorded,
  ).length;
  const careDocumentationRate = pct(careNotesRecorded, totalCareRecords);

  // --- Animal interaction outcomes ---
  const totalInteractions = animal_interaction_records.length;
  const positiveInteractions = animal_interaction_records.filter(
    (i) => i.positive_outcome,
  ).length;
  const interactionOutcomeRate = pct(positiveInteractions, totalInteractions);

  const behaviouralImprovements = animal_interaction_records.filter(
    (i) => i.behavioural_improvement,
  ).length;
  const behaviouralImprovementRate = pct(behaviouralImprovements, totalInteractions);

  const emotionalRegulationObserved = animal_interaction_records.filter(
    (i) => i.emotional_regulation_observed,
  ).length;
  const emotionalRegulationRate = pct(emotionalRegulationObserved, totalInteractions);

  const interactionsWithRiskAssessment = animal_interaction_records.filter(
    (i) => i.risk_assessment_current,
  ).length;
  const interactionRiskAssessmentRate = pct(interactionsWithRiskAssessment, totalInteractions);

  const interactionsWithStaff = animal_interaction_records.filter(
    (i) => i.staff_present,
  ).length;
  const interactionSupervisionRate = pct(interactionsWithStaff, totalInteractions);

  const interactionsWithNotes = animal_interaction_records.filter(
    (i) => i.notes_recorded,
  ).length;
  const interactionDocumentationRate = pct(interactionsWithNotes, totalInteractions);

  // Mood improvement
  const moodImprovementValues = animal_interaction_records
    .filter((i) => i.child_mood_before > 0 && i.child_mood_after > 0)
    .map((i) => i.child_mood_after - i.child_mood_before);
  const moodImprovementAvg: number | null =
    moodImprovementValues.length > 0
      ? Math.round(
          (moodImprovementValues.reduce((sum, v) => sum + v, 0) /
            moodImprovementValues.length) *
            100,
        ) / 100
      : null;

  const moodImprovedCount = moodImprovementValues.filter((v) => v > 0).length;
  const moodImprovementRate = pct(moodImprovedCount, moodImprovementValues.length);

  // --- Animal welfare compliance ---
  const totalWelfareChecks = animal_welfare_records.length;
  const welfareStandardsMet = animal_welfare_records.filter(
    (w) => w.welfare_standards_met,
  ).length;
  const welfareComplianceRate = pct(welfareStandardsMet, totalWelfareChecks);

  const vetUpToDate = animal_welfare_records.filter(
    (w) => w.veterinary_up_to_date,
  ).length;
  const vetComplianceRate = pct(vetUpToDate, totalWelfareChecks);

  const environmentSuitable = animal_welfare_records.filter(
    (w) => w.environment_suitable,
  ).length;
  const environmentRate = pct(environmentSuitable, totalWelfareChecks);

  const dietAppropriate = animal_welfare_records.filter(
    (w) => w.diet_appropriate,
  ).length;
  const dietRate = pct(dietAppropriate, totalWelfareChecks);

  const exerciseAdequate = animal_welfare_records.filter(
    (w) => w.exercise_adequate,
  ).length;
  const exerciseRate = pct(exerciseAdequate, totalWelfareChecks);

  const insuranceCurrent = animal_welfare_records.filter(
    (w) => w.insurance_current,
  ).length;
  const insuranceRate = pct(insuranceCurrent, totalWelfareChecks);

  const riskAssessmentCurrent = animal_welfare_records.filter(
    (w) => w.risk_assessment_current,
  ).length;
  const welfareRiskAssessmentRate = pct(riskAssessmentCurrent, totalWelfareChecks);

  const concernsIdentified = animal_welfare_records.filter(
    (w) => w.concerns_identified,
  ).length;
  const concernsActioned = animal_welfare_records.filter(
    (w) => w.concerns_identified && w.concerns_actioned,
  ).length;
  const concernsActionedRate = pct(concernsActioned, concernsIdentified);

  const overdueWelfareReviews = animal_welfare_records.filter(
    (w) => w.review_overdue,
  ).length;

  const poorHealthAnimals = animal_welfare_records.filter(
    (w) => w.health_status === "poor" || w.health_status === "critical",
  ).length;

  // --- Child engagement rates ---
  const totalEngagementRecords = child_engagement_records.length;
  const uniqueChildrenWithEngagement = new Set(
    child_engagement_records.map((e) => e.child_id),
  ).size;
  const childEngagementCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithEngagement, total_children) : 0;

  const highModerateEngagement = child_engagement_records.filter(
    (e) => e.engagement_level === "high" || e.engagement_level === "moderate",
  ).length;
  const childEngagementRate = pct(highModerateEngagement, totalEngagementRecords);

  const therapeuticBenefitObserved = child_engagement_records.filter(
    (e) => e.therapeutic_benefit_observed,
  ).length;
  const therapeuticBenefitRate = pct(therapeuticBenefitObserved, totalEngagementRecords);

  const confidenceImproved = child_engagement_records.filter(
    (e) => e.confidence_improved,
  ).length;
  const confidenceImprovementRate = pct(confidenceImproved, totalEngagementRecords);

  const empathyDemonstrated = child_engagement_records.filter(
    (e) => e.empathy_demonstrated,
  ).length;
  const empathyRate = pct(empathyDemonstrated, totalEngagementRecords);

  const responsibilitySkillsImproved = child_engagement_records.filter(
    (e) => e.responsibility_skills_improved,
  ).length;
  const responsibilityImprovementRate = pct(responsibilitySkillsImproved, totalEngagementRecords);

  const socialSkillsImproved = child_engagement_records.filter(
    (e) => e.social_skills_improved,
  ).length;
  const socialSkillsRate = pct(socialSkillsImproved, totalEngagementRecords);

  const emotionalRegulationImproved = child_engagement_records.filter(
    (e) => e.emotional_regulation_improved,
  ).length;
  const emotionalRegulationImprovementRate = pct(emotionalRegulationImproved, totalEngagementRecords);

  const childSelfReportedBenefit = child_engagement_records.filter(
    (e) => e.child_self_reported_benefit,
  ).length;
  const childSelfReportedBenefitRate = pct(childSelfReportedBenefit, totalEngagementRecords);

  const staffReportedBenefit = child_engagement_records.filter(
    (e) => e.staff_reported_benefit,
  ).length;
  const staffReportedBenefitRate = pct(staffReportedBenefit, totalEngagementRecords);

  const supportPlanInPlace = child_engagement_records.filter(
    (e) => e.support_plan_in_place,
  ).length;
  const supportPlanRate = pct(supportPlanInPlace, totalEngagementRecords);

  const overdueEngagementReviews = child_engagement_records.filter(
    (e) => e.review_overdue,
  ).length;

  const progressRatingSum = child_engagement_records.reduce(
    (sum, e) => sum + e.overall_progress_rating,
    0,
  );
  const progressRatingAvg: number | null =
    totalEngagementRecords > 0
      ? Math.round((progressRatingSum / totalEngagementRecords) * 100) / 100
      : null;

  // --- Child benefit rate (composite across sessions, interactions, engagement) ---
  const totalBenefitOpportunities =
    totalSessions + totalInteractions + totalEngagementRecords;
  const totalBenefitPositive =
    sessionsWithPositiveFeedback + positiveInteractions + childSelfReportedBenefit;
  const childBenefitRate = pct(totalBenefitPositive, totalBenefitOpportunities);

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: therapyFrequencyRate (>=90: +4, >=70: +2) ---
  if (therapyFrequencyRate >= 90) score += 4;
  else if (therapyFrequencyRate >= 70) score += 2;

  // --- Bonus 2: petCareResponsibilityRate (>=90: +4, >=70: +2) ---
  if (petCareResponsibilityRate >= 90) score += 4;
  else if (petCareResponsibilityRate >= 70) score += 2;

  // --- Bonus 3: interactionOutcomeRate (>=90: +4, >=70: +2) ---
  if (interactionOutcomeRate >= 90) score += 4;
  else if (interactionOutcomeRate >= 70) score += 2;

  // --- Bonus 4: welfareComplianceRate (>=100: +4, >=80: +2) ---
  if (welfareComplianceRate >= 100) score += 4;
  else if (welfareComplianceRate >= 80) score += 2;

  // --- Bonus 5: childEngagementRate (>=90: +4, >=70: +2) ---
  if (childEngagementRate >= 90) score += 4;
  else if (childEngagementRate >= 70) score += 2;

  // --- Bonus 6: childBenefitRate (>=90: +4, >=70: +2) ---
  if (childBenefitRate >= 90) score += 4;
  else if (childBenefitRate >= 70) score += 2;

  // --- Bonus 7: sessionRiskAssessmentRate (>=100: +2, >=80: +1) ---
  if (sessionRiskAssessmentRate >= 100) score += 2;
  else if (sessionRiskAssessmentRate >= 80) score += 1;

  // --- Bonus 8: goalAchievementRate (>=90: +2, >=70: +1) ---
  if (goalAchievementRate >= 90) score += 2;
  else if (goalAchievementRate >= 70) score += 1;

  // -- Penalties (guarded by array.length > 0) -----------------------------

  // therapyFrequencyRate < 40 -> -5
  if (therapyFrequencyRate < 40 && therapy_session_records.length > 0) score -= 5;

  // welfareComplianceRate < 50 -> -5
  if (welfareComplianceRate < 50 && animal_welfare_records.length > 0) score -= 5;

  // interactionOutcomeRate < 40 -> -4
  if (interactionOutcomeRate < 40 && animal_interaction_records.length > 0) score -= 4;

  // childEngagementRate < 40 -> -4
  if (childEngagementRate < 40 && child_engagement_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const therapy_rating = toRating(score);

  // -- Strengths -----------------------------------------------------------

  const strengths: string[] = [];

  if (therapyFrequencyRate >= 90 && total_children > 0) {
    strengths.push(
      `${therapyFrequencyRate}% of children are accessing animal-assisted therapy sessions -- the home provides comprehensive therapeutic coverage through animal interactions.`,
    );
  } else if (therapyFrequencyRate >= 70 && total_children > 0) {
    strengths.push(
      `${therapyFrequencyRate}% of children are engaging in therapy sessions with animals -- strong participation in the home's animal-assisted therapy programme.`,
    );
  }

  if (petCareResponsibilityRate >= 90 && careWithResponsibilityAssigned > 0) {
    strengths.push(
      `${petCareResponsibilityRate}% of assigned pet care responsibilities are completed -- children demonstrate excellent follow-through on their animal care duties, building responsibility and nurturing skills.`,
    );
  } else if (petCareResponsibilityRate >= 70 && careWithResponsibilityAssigned > 0) {
    strengths.push(
      `${petCareResponsibilityRate}% pet care responsibility completion -- children are generally reliable in fulfilling their animal care duties.`,
    );
  }

  if (interactionOutcomeRate >= 90 && totalInteractions > 0) {
    strengths.push(
      `${interactionOutcomeRate}% of animal interactions achieve positive outcomes -- interactions are highly effective in supporting children's emotional and behavioural development.`,
    );
  } else if (interactionOutcomeRate >= 70 && totalInteractions > 0) {
    strengths.push(
      `${interactionOutcomeRate}% positive interaction outcomes -- the majority of children's animal interactions are achieving therapeutic or developmental benefit.`,
    );
  }

  if (welfareComplianceRate >= 100 && totalWelfareChecks > 0) {
    strengths.push(
      "All animal welfare checks meet required standards -- the home demonstrates exemplary commitment to the wellbeing of therapy animals.",
    );
  } else if (welfareComplianceRate >= 80 && totalWelfareChecks > 0) {
    strengths.push(
      `${welfareComplianceRate}% welfare compliance -- the home maintains a high standard of animal welfare across its therapy provision.`,
    );
  }

  if (childEngagementRate >= 90 && totalEngagementRecords > 0) {
    strengths.push(
      `${childEngagementRate}% of children show high or moderate engagement with animal therapy -- children are actively invested in their animal-assisted interventions.`,
    );
  } else if (childEngagementRate >= 70 && totalEngagementRecords > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement in animal therapy -- strong levels of participation and investment from children.`,
    );
  }

  if (childBenefitRate >= 90 && totalBenefitOpportunities > 0) {
    strengths.push(
      `${childBenefitRate}% of animal therapy touchpoints report positive child outcomes -- children consistently benefit from the home's animal-assisted provision.`,
    );
  } else if (childBenefitRate >= 70 && totalBenefitOpportunities > 0) {
    strengths.push(
      `${childBenefitRate}% positive child benefit across animal therapy activities -- the majority of children are gaining therapeutic value from animal interactions.`,
    );
  }

  if (goalAchievementRate >= 90 && sessionsWithGoalsSet > 0) {
    strengths.push(
      `${goalAchievementRate}% of therapy session goals are achieved -- sessions are purposeful and delivering intended therapeutic outcomes for children.`,
    );
  } else if (goalAchievementRate >= 70 && sessionsWithGoalsSet > 0) {
    strengths.push(
      `${goalAchievementRate}% goal achievement in therapy sessions -- the majority of sessions meet their therapeutic objectives.`,
    );
  }

  if (sessionRiskAssessmentRate >= 100 && totalSessions > 0) {
    strengths.push(
      "Every therapy session has a completed risk assessment -- the home prioritises child safety in all animal-assisted interactions.",
    );
  } else if (sessionRiskAssessmentRate >= 80 && totalSessions > 0) {
    strengths.push(
      `${sessionRiskAssessmentRate}% of therapy sessions have completed risk assessments -- strong safety practice in animal-assisted therapy delivery.`,
    );
  }

  if (moodImprovementRate >= 80 && moodImprovementValues.length > 0) {
    strengths.push(
      `${moodImprovementRate}% of animal interactions result in improved child mood -- interactions are demonstrably calming and emotionally regulating for children.`,
    );
  } else if (moodImprovementRate >= 60 && moodImprovementValues.length > 0) {
    strengths.push(
      `${moodImprovementRate}% of interactions show mood improvement -- animal interactions are generally supporting children's emotional wellbeing.`,
    );
  }

  if (emotionalRegulationRate >= 80 && totalInteractions > 0) {
    strengths.push(
      `Emotional regulation observed in ${emotionalRegulationRate}% of animal interactions -- animals are serving as effective co-regulators for children's emotional states.`,
    );
  }

  if (empathyRate >= 80 && totalEngagementRecords > 0) {
    strengths.push(
      `${empathyRate}% of children demonstrate improved empathy through animal therapy -- caring for animals is developing children's capacity for compassion and understanding.`,
    );
  }

  if (childInitiatedCareRate >= 50 && totalCareRecords > 0) {
    strengths.push(
      `${childInitiatedCareRate}% of pet care activities are child-initiated -- children proactively seek out caring roles, showing genuine investment in animal welfare.`,
    );
  }

  if (vetComplianceRate >= 100 && totalWelfareChecks > 0) {
    strengths.push(
      "All therapy animals have up-to-date veterinary care -- the home ensures animals are healthy and fit for therapeutic work with children.",
    );
  }

  if (sessionDocumentationRate >= 90 && totalSessions > 0) {
    strengths.push(
      `${sessionDocumentationRate}% of therapy sessions have documented notes -- strong recording practice supporting evidence of therapeutic provision.`,
    );
  }

  if (concernsActionedRate >= 100 && concernsIdentified > 0) {
    strengths.push(
      "All identified animal welfare concerns have been actioned -- the home responds promptly and effectively to any welfare issues.",
    );
  }

  if (responsibilityImprovementRate >= 80 && totalEngagementRecords > 0) {
    strengths.push(
      `${responsibilityImprovementRate}% of children show improved responsibility skills through animal care -- the programme effectively develops life skills alongside therapeutic benefits.`,
    );
  }

  if (behaviouralImprovementRate >= 70 && totalInteractions > 0) {
    strengths.push(
      `Behavioural improvement observed in ${behaviouralImprovementRate}% of animal interactions -- animal-assisted interventions are positively influencing children's behaviour.`,
    );
  }

  // -- Concerns ------------------------------------------------------------

  const concerns: string[] = [];

  if (therapyFrequencyRate < 40 && total_children > 0 && totalSessions > 0) {
    concerns.push(
      `Only ${therapyFrequencyRate}% of children are accessing animal-assisted therapy -- the majority of children are not benefiting from the home's therapy animal provision, indicating potential barriers to access or insufficient session availability.`,
    );
  } else if (therapyFrequencyRate < 70 && therapyFrequencyRate >= 40 && total_children > 0) {
    concerns.push(
      `Therapy session coverage at ${therapyFrequencyRate}% -- some children are not accessing animal-assisted therapy. Review whether all children who could benefit have been offered appropriate sessions.`,
    );
  }

  if (petCareResponsibilityRate < 50 && careWithResponsibilityAssigned > 0) {
    concerns.push(
      `Only ${petCareResponsibilityRate}% of assigned pet care responsibilities are completed -- children are not following through on their animal care duties, which may indicate insufficient support, inappropriate task allocation, or disengagement.`,
    );
  } else if (petCareResponsibilityRate < 70 && petCareResponsibilityRate >= 50 && careWithResponsibilityAssigned > 0) {
    concerns.push(
      `Pet care responsibility completion at ${petCareResponsibilityRate}% -- some children are not completing their assigned animal care tasks. Consider whether tasks are age-appropriate and adequately supported.`,
    );
  }

  if (interactionOutcomeRate < 40 && totalInteractions > 0) {
    concerns.push(
      `Only ${interactionOutcomeRate}% of animal interactions achieve positive outcomes -- the majority of interactions are not delivering therapeutic benefit, suggesting a need for fundamental review of the interaction programme's design and delivery.`,
    );
  } else if (interactionOutcomeRate < 70 && interactionOutcomeRate >= 40 && totalInteractions > 0) {
    concerns.push(
      `Interaction outcome rate at ${interactionOutcomeRate}% -- not all animal interactions are achieving positive results. Review whether interactions are appropriately structured and matched to individual children's needs.`,
    );
  }

  if (welfareComplianceRate < 50 && totalWelfareChecks > 0) {
    concerns.push(
      `Only ${welfareComplianceRate}% of animal welfare checks meet required standards -- serious animal welfare deficits that must be addressed immediately. The home has a legal duty under the Animal Welfare Act 2006 to ensure the welfare of all animals in its care.`,
    );
  } else if (welfareComplianceRate < 80 && welfareComplianceRate >= 50 && totalWelfareChecks > 0) {
    concerns.push(
      `Welfare compliance at ${welfareComplianceRate}% -- some animal welfare standards are not being met. All therapy animals must receive consistent welfare provision to legal standards.`,
    );
  }

  if (childEngagementRate < 40 && totalEngagementRecords > 0) {
    concerns.push(
      `Only ${childEngagementRate}% of children show adequate engagement with animal therapy -- the majority of children are disengaged, suggesting the programme may not be meeting their needs or interests.`,
    );
  } else if (childEngagementRate < 70 && childEngagementRate >= 40 && totalEngagementRecords > 0) {
    concerns.push(
      `Child engagement rate at ${childEngagementRate}% -- a significant proportion of children are not fully engaged with the animal therapy programme. Individual assessments should identify barriers and adapt provision.`,
    );
  }

  if (childBenefitRate < 50 && totalBenefitOpportunities > 0) {
    concerns.push(
      `Only ${childBenefitRate}% positive benefit reported across animal therapy activities -- children are not consistently experiencing therapeutic value from the home's animal-assisted provision.`,
    );
  } else if (childBenefitRate < 70 && childBenefitRate >= 50 && totalBenefitOpportunities > 0) {
    concerns.push(
      `Child benefit rate at ${childBenefitRate}% -- not all children are reporting positive outcomes from animal therapy. Individual review is needed to tailor the approach.`,
    );
  }

  if (sessionRiskAssessmentRate < 80 && totalSessions > 0) {
    concerns.push(
      `Only ${sessionRiskAssessmentRate}% of therapy sessions have completed risk assessments -- all sessions involving children and animals must have documented risk assessments to ensure child safety.`,
    );
  }

  if (interactionRiskAssessmentRate < 80 && totalInteractions > 0) {
    concerns.push(
      `Only ${interactionRiskAssessmentRate}% of animal interactions have current risk assessments -- interactions without risk assessment expose children to unmanaged risks.`,
    );
  }

  if (poorHealthAnimals > 0) {
    concerns.push(
      `${poorHealthAnimals} animal${poorHealthAnimals !== 1 ? "s" : ""} in poor or critical health -- animals in poor health should not be used for therapy and require immediate veterinary attention.`,
    );
  }

  if (overdueWelfareReviews > 0 && totalWelfareChecks > 0) {
    concerns.push(
      `${overdueWelfareReviews} animal welfare review${overdueWelfareReviews !== 1 ? "s are" : " is"} overdue -- welfare checks must be conducted on schedule to ensure ongoing compliance and animal wellbeing.`,
    );
  }

  if (overdueEngagementReviews > 0 && totalEngagementRecords > 0) {
    concerns.push(
      `${overdueEngagementReviews} child engagement review${overdueEngagementReviews !== 1 ? "s are" : " is"} overdue -- without timely reviews, the home cannot ensure the therapy programme remains appropriately matched to each child's evolving needs.`,
    );
  }

  if (vetComplianceRate < 80 && totalWelfareChecks > 0) {
    concerns.push(
      `Only ${vetComplianceRate}% of animals have up-to-date veterinary care -- therapy animals must have current veterinary records to ensure they are safe and healthy for interaction with children.`,
    );
  }

  if (insuranceRate < 80 && totalWelfareChecks > 0) {
    concerns.push(
      `Only ${insuranceRate}% of therapy animals have current insurance -- all therapy animals should be insured to protect the home, staff, and children.`,
    );
  }

  if (goalSettingRate < 50 && totalSessions > 0) {
    concerns.push(
      `Goals set for only ${goalSettingRate}% of therapy sessions -- sessions without clear goals lack therapeutic purpose and cannot evidence targeted outcomes.`,
    );
  }

  if (sessionDocumentationRate < 70 && totalSessions > 0) {
    concerns.push(
      `Session documentation at only ${sessionDocumentationRate}% -- inadequate recording makes it difficult to evidence therapeutic progress and outcomes for Ofsted.`,
    );
  }

  if (concernsIdentified > 0 && concernsActionedRate < 80) {
    concerns.push(
      `Only ${concernsActionedRate}% of identified animal welfare concerns have been actioned -- unresolved welfare concerns represent a failure in the home's duty of care to therapy animals.`,
    );
  }

  // -- Recommendations -----------------------------------------------------

  const recommendations: PetAnimalTherapyRecommendation[] = [];
  let rank = 0;

  if (welfareComplianceRate < 50 && totalWelfareChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address animal welfare compliance -- all therapy animals must meet welfare standards including appropriate environment, diet, exercise, veterinary care, and freedom from distress. Non-compliance risks prosecution under the Animal Welfare Act 2006 and undermines the therapeutic programme.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (poorHealthAnimals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately arrange veterinary assessment for animals in poor or critical health -- animals that are unwell must not be used for therapy sessions and require appropriate medical intervention. Consider temporary suspension of therapy involving affected animals.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Health and safety",
    });
  }

  if (sessionRiskAssessmentRate < 80 && totalSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every therapy session has a completed risk assessment before it takes place -- risk assessments must consider the child's individual needs, the animal's temperament, and environmental factors. No session should proceed without documented risk management.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (therapyFrequencyRate < 40 && total_children > 0 && totalSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently expand therapy session access to ensure all children who could benefit are offered animal-assisted interventions -- review barriers to participation and increase session availability to achieve equitable access across the home.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress",
    });
  }

  if (interactionOutcomeRate < 40 && totalInteractions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and redesign the animal interaction programme -- when the majority of interactions are not achieving positive outcomes, the programme structure, animal selection, and individual matching need fundamental reassessment with input from qualified animal-assisted therapy practitioners.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (childEngagementRate < 40 && totalEngagementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct individual assessments to understand why children are not engaging with animal therapy -- consider whether the programme design, animal types, session structure, or environmental factors are creating barriers. Adapt provision based on each child's preferences and therapeutic needs.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress",
    });
  }

  if (interactionRiskAssessmentRate < 80 && totalInteractions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all animal interactions have current risk assessments -- every interaction between a child and an animal must be governed by a documented assessment of potential risks, including allergies, behavioural triggers, and animal temperament.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (childBenefitRate < 50 && totalBenefitOpportunities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the overall therapeutic value of the animal therapy programme -- when fewer than half of all touchpoints report positive benefit, the programme may need restructuring, different animals, or alternative approaches to animal-assisted intervention.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress",
    });
  }

  if (concernsIdentified > 0 && concernsActionedRate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Action all outstanding animal welfare concerns without delay -- unresolved concerns compromise animal wellbeing and may indicate systemic issues in the home's welfare monitoring and response processes.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (vetComplianceRate < 80 && totalWelfareChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all therapy animal veterinary records up to date -- schedule outstanding veterinary appointments and implement a calendar system to prevent future lapses in veterinary compliance.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and safety",
    });
  }

  if (overdueWelfareReviews > 0 && totalWelfareChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue animal welfare reviews -- regular welfare checks are essential to ensure ongoing compliance with welfare standards and to identify emerging concerns before they become serious.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (overdueEngagementReviews > 0 && totalEngagementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue child engagement reviews -- without timely assessment of each child's engagement and progress, the home cannot evidence that the therapy programme is meeting individual needs.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress",
    });
  }

  if (
    therapyFrequencyRate >= 40 &&
    therapyFrequencyRate < 70 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase therapy session coverage to reach at least 70% of children -- identify children who are not currently participating and assess whether they would benefit from animal-assisted therapy, adapting the offer to suit individual preferences.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress",
    });
  }

  if (
    interactionOutcomeRate >= 40 &&
    interactionOutcomeRate < 70 &&
    totalInteractions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review animal interactions that are not achieving positive outcomes -- consider whether the interaction type, duration, animal choice, or setting needs adjustment for individual children.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (
    petCareResponsibilityRate >= 50 &&
    petCareResponsibilityRate < 70 &&
    careWithResponsibilityAssigned > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve pet care responsibility completion rates -- ensure assigned tasks are age-appropriate, adequately supported, and that children understand the importance of consistent animal care. Use positive reinforcement to build reliable caring habits.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress",
    });
  }

  if (petCareResponsibilityRate < 50 && careWithResponsibilityAssigned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review pet care responsibility allocation -- when fewer than half of assigned tasks are completed, the allocation may be inappropriate or unsupported. Ensure tasks match each child's developmental stage and that staff provide adequate scaffolding.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress",
    });
  }

  if (goalSettingRate < 50 && totalSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Set clear therapeutic goals for every animal therapy session -- goals should be specific, measurable, and linked to each child's care plan. Sessions without goals cannot demonstrate purposeful therapeutic intent.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (
    welfareComplianceRate >= 50 &&
    welfareComplianceRate < 80 &&
    totalWelfareChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve animal welfare compliance to at least 80% -- implement a structured welfare monitoring framework with regular audits to ensure all therapy animals consistently receive appropriate care, environment, and veterinary attention.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (
    childEngagementRate >= 40 &&
    childEngagementRate < 70 &&
    totalEngagementRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child engagement rates in animal therapy -- use individual consultations with children to understand preferences and barriers, and adapt the programme to increase engagement through choice, variety, and child-led activity.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress",
    });
  }

  if (sessionDocumentationRate < 70 && totalSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve therapy session documentation -- each session should have recorded notes detailing goals, activities, child engagement, outcomes, and follow-up actions to build a comprehensive evidence base of therapeutic provision.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (insuranceRate < 80 && totalWelfareChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all therapy animals have current insurance -- implement an insurance tracking system with renewal reminders to maintain continuous cover for all animals involved in the therapy programme.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and safety",
    });
  }

  if (
    childBenefitRate >= 50 &&
    childBenefitRate < 70 &&
    totalBenefitOpportunities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore ways to increase the therapeutic benefit of animal interactions for children -- regularly seek children's views on what aspects of the programme they find most helpful and adapt provision to maximise positive outcomes.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress",
    });
  }

  if (supportPlanRate < 70 && totalEngagementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children participating in animal therapy have a support plan in place -- plans should outline individual therapeutic goals, preferred animals and interactions, risk management, and progress indicators.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  // -- Insights ------------------------------------------------------------

  const insights: PetAnimalTherapyInsight[] = [];

  // -- Critical insights --

  if (welfareComplianceRate < 50 && totalWelfareChecks > 0) {
    insights.push({
      text: `Only ${welfareComplianceRate}% of animal welfare checks meet required standards. The home has a legal obligation under the Animal Welfare Act 2006 to ensure the welfare of all animals in its care, and failure to meet welfare standards may constitute a criminal offence. Ofsted will view animal welfare failures as a serious safeguarding concern under Reg 5.`,
      severity: "critical",
    });
  }

  if (therapyFrequencyRate < 40 && total_children > 0 && totalSessions > 0) {
    insights.push({
      text: `Only ${therapyFrequencyRate}% of children access animal-assisted therapy sessions. Where the home offers animal therapy as part of its provision, equitable access is essential. Children who could benefit but are not accessing sessions represent missed therapeutic opportunities under the SCCIF experiences and progress framework.`,
      severity: "critical",
    });
  }

  if (interactionOutcomeRate < 40 && totalInteractions > 0) {
    insights.push({
      text: `Only ${interactionOutcomeRate}% of animal interactions achieve positive outcomes. When most interactions are not delivering benefit, this indicates a systemic issue with the programme's design, delivery, or matching of animals to children's needs. A fundamental review with specialist input is needed.`,
      severity: "critical",
    });
  }

  if (childEngagementRate < 40 && totalEngagementRecords > 0) {
    insights.push({
      text: `Only ${childEngagementRate}% of children show adequate engagement with animal therapy. Low engagement across the programme suggests it may not be meeting children's needs or interests. Without meaningful engagement, the therapeutic value of animal-assisted intervention is severely diminished.`,
      severity: "critical",
    });
  }

  if (poorHealthAnimals > 0 && sessionRiskAssessmentRate < 80) {
    insights.push({
      text: `${poorHealthAnimals} animal${poorHealthAnimals !== 1 ? "s" : ""} in poor or critical health and ${100 - sessionRiskAssessmentRate}% of sessions lack risk assessments. The combination of compromised animal health and missing risk assessments creates significant risk to both children and animals during therapy interactions.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    therapyFrequencyRate >= 40 &&
    therapyFrequencyRate < 70 &&
    total_children > 0
  ) {
    insights.push({
      text: `Therapy session coverage at ${therapyFrequencyRate}% -- improving but some children still lack access to animal-assisted therapy. Each child who could benefit should have the opportunity to participate in appropriately structured sessions.`,
      severity: "warning",
    });
  }

  if (
    interactionOutcomeRate >= 40 &&
    interactionOutcomeRate < 70 &&
    totalInteractions > 0
  ) {
    insights.push({
      text: `Interaction outcome rate at ${interactionOutcomeRate}% -- some animal interactions are not achieving positive results. Consider whether the type of interaction, animal selection, or session structure needs adjustment for individual children.`,
      severity: "warning",
    });
  }

  if (
    welfareComplianceRate >= 50 &&
    welfareComplianceRate < 80 &&
    totalWelfareChecks > 0
  ) {
    insights.push({
      text: `Welfare compliance at ${welfareComplianceRate}% -- some welfare checks are not meeting required standards. Any lapse in animal welfare undermines the therapeutic programme and may expose the home to legal and regulatory risk.`,
      severity: "warning",
    });
  }

  if (
    childEngagementRate >= 40 &&
    childEngagementRate < 70 &&
    totalEngagementRecords > 0
  ) {
    insights.push({
      text: `Child engagement at ${childEngagementRate}% -- a notable proportion of children are not fully engaged with the animal therapy programme. Individual assessment should identify barriers and inform adaptations to improve participation.`,
      severity: "warning",
    });
  }

  if (
    childBenefitRate >= 50 &&
    childBenefitRate < 70 &&
    totalBenefitOpportunities > 0
  ) {
    insights.push({
      text: `Child benefit rate at ${childBenefitRate}% -- not all children are reporting positive outcomes from animal therapy. The subjective experience of each child is the most important measure of whether the programme is genuinely helping them.`,
      severity: "warning",
    });
  }

  if (overdueWelfareReviews > 0 && totalWelfareChecks > 0) {
    insights.push({
      text: `${overdueWelfareReviews} animal welfare review${overdueWelfareReviews !== 1 ? "s" : ""} overdue. Therapy animals require regular welfare checks to ensure ongoing health, appropriate environment, and fitness for therapeutic work. Overdue reviews may mask emerging welfare concerns.`,
      severity: "warning",
    });
  }

  if (overdueEngagementReviews > 0 && totalEngagementRecords > 0) {
    insights.push({
      text: `${overdueEngagementReviews} child engagement review${overdueEngagementReviews !== 1 ? "s" : ""} overdue. Without timely review of each child's engagement and progress, the home cannot evidence that the programme continues to meet individual therapeutic needs.`,
      severity: "warning",
    });
  }

  if (goalSettingRate < 70 && goalSettingRate >= 50 && totalSessions > 0) {
    insights.push({
      text: `Goals set for only ${goalSettingRate}% of therapy sessions. Sessions without clear therapeutic goals are less likely to deliver purposeful outcomes and cannot evidence targeted progress for individual children.`,
      severity: "warning",
    });
  }

  if (
    petCareResponsibilityRate >= 50 &&
    petCareResponsibilityRate < 70 &&
    careWithResponsibilityAssigned > 0
  ) {
    insights.push({
      text: `Pet care responsibility completion at ${petCareResponsibilityRate}% -- some children are not following through on their animal care duties. This may indicate that tasks need better support, clearer expectations, or adjustment to match each child's capabilities.`,
      severity: "warning",
    });
  }

  if (sessionDocumentationRate < 70 && sessionDocumentationRate >= 50 && totalSessions > 0) {
    insights.push({
      text: `Session documentation at ${sessionDocumentationRate}% -- gaps in recording make it difficult to evidence the therapeutic value of the programme and track individual children's progress over time.`,
      severity: "warning",
    });
  }

  // Analysis of animal types used in therapy
  const animalTypeCounts: Record<string, number> = {};
  for (const s of therapy_session_records) {
    const at = s.animal_type.toLowerCase();
    animalTypeCounts[at] = (animalTypeCounts[at] ?? 0) + 1;
  }
  const topAnimalTypes = Object.entries(animalTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topAnimalTypes.length > 0 && totalSessions >= 3) {
    const typeStr = topAnimalTypes
      .map(([t, c]) => `${t} (${c})`)
      .join(", ");
    insights.push({
      text: `Therapy sessions by animal type: ${typeStr}. Consider whether the range of therapy animals reflects the diverse needs and preferences of all children, including those who may prefer smaller animals or have specific phobias.`,
      severity: "warning",
    });
  }

  // Analysis of interaction types
  const interactionTypeCounts: Record<string, number> = {};
  for (const i of animal_interaction_records) {
    interactionTypeCounts[i.interaction_type] = (interactionTypeCounts[i.interaction_type] ?? 0) + 1;
  }
  const topInteractionTypes = Object.entries(interactionTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topInteractionTypes.length > 0 && totalInteractions >= 3) {
    const itStr = topInteractionTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Interaction types: ${itStr}. A varied programme of therapeutic, recreational, and educational animal interactions suggests the home tailors its provision to children's individual therapeutic and developmental goals.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (therapy_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding animal-assisted therapy provision -- children receive high-quality, well-documented therapy with healthy, well-cared-for animals, and the programme delivers demonstrable therapeutic benefit. This is strong evidence of enriching experiences and positive progress under the SCCIF framework.",
      severity: "positive",
    });
  }

  if (
    therapyFrequencyRate >= 90 &&
    goalAchievementRate >= 90 &&
    total_children > 0 &&
    sessionsWithGoalsSet > 0
  ) {
    insights.push({
      text: `${therapyFrequencyRate}% of children accessing therapy with ${goalAchievementRate}% goal achievement -- the home provides comprehensive, purposeful animal-assisted therapy that consistently delivers on its therapeutic objectives for children.`,
      severity: "positive",
    });
  }

  if (
    welfareComplianceRate >= 100 &&
    vetComplianceRate >= 100 &&
    totalWelfareChecks > 0
  ) {
    insights.push({
      text: "All welfare checks meet standards with 100% veterinary compliance -- the home demonstrates exemplary care for its therapy animals, ensuring they are healthy, well-maintained, and fit for therapeutic work. This protects both animals and children.",
      severity: "positive",
    });
  }

  if (
    interactionOutcomeRate >= 90 &&
    moodImprovementRate >= 80 &&
    totalInteractions > 0 &&
    moodImprovementValues.length > 0
  ) {
    insights.push({
      text: `${interactionOutcomeRate}% positive interaction outcomes with ${moodImprovementRate}% mood improvement observed -- animal interactions are highly effective in supporting children's emotional wellbeing, with measurable improvement in mood following interactions.`,
      severity: "positive",
    });
  }

  if (
    childEngagementRate >= 90 &&
    childBenefitRate >= 90 &&
    totalEngagementRecords > 0 &&
    totalBenefitOpportunities > 0
  ) {
    insights.push({
      text: `${childEngagementRate}% child engagement with ${childBenefitRate}% positive benefit -- children are deeply invested in the animal therapy programme and overwhelmingly report that it helps them. This child-centred evidence is powerful for Ofsted.`,
      severity: "positive",
    });
  }

  if (
    petCareResponsibilityRate >= 90 &&
    responsibilityImprovementRate >= 80 &&
    careWithResponsibilityAssigned > 0 &&
    totalEngagementRecords > 0
  ) {
    insights.push({
      text: `${petCareResponsibilityRate}% care responsibility completion with ${responsibilityImprovementRate}% showing improved responsibility skills -- caring for animals is effectively developing children's sense of responsibility, reliability, and nurturing capacity.`,
      severity: "positive",
    });
  }

  if (
    empathyRate >= 80 &&
    socialSkillsRate >= 70 &&
    totalEngagementRecords > 0
  ) {
    insights.push({
      text: `${empathyRate}% of children demonstrate improved empathy and ${socialSkillsRate}% show improved social skills through animal therapy -- the programme is effectively developing children's emotional intelligence and interpersonal capabilities.`,
      severity: "positive",
    });
  }

  if (
    emotionalRegulationRate >= 80 &&
    emotionalRegulationImprovementRate >= 70 &&
    totalInteractions > 0 &&
    totalEngagementRecords > 0
  ) {
    insights.push({
      text: `Emotional regulation observed in ${emotionalRegulationRate}% of interactions with ${emotionalRegulationImprovementRate}% showing sustained improvement -- animals are serving as effective co-regulators, helping children develop lasting emotional self-management skills.`,
      severity: "positive",
    });
  }

  if (
    staffReportedBenefitRate >= 80 &&
    childSelfReportedBenefitRate >= 80 &&
    totalEngagementRecords > 0
  ) {
    insights.push({
      text: `Both staff (${staffReportedBenefitRate}%) and children (${childSelfReportedBenefitRate}%) report therapeutic benefit -- the convergence of staff observation and child self-report provides compelling evidence that the animal therapy programme is genuinely transformative.`,
      severity: "positive",
    });
  }

  if (
    sessionRiskAssessmentRate >= 100 &&
    welfareRiskAssessmentRate >= 100 &&
    totalSessions > 0 &&
    totalWelfareChecks > 0
  ) {
    insights.push({
      text: "All therapy sessions and welfare checks have current risk assessments -- the home operates a comprehensive risk management framework for its animal therapy programme, ensuring both child safety and animal welfare are consistently protected.",
      severity: "positive",
    });
  }

  if (
    concernsActionedRate >= 100 &&
    concernsIdentified > 0
  ) {
    insights.push({
      text: "All identified animal welfare concerns have been actioned -- the home demonstrates responsive and responsible animal welfare management, addressing issues promptly to maintain the highest standards of care.",
      severity: "positive",
    });
  }

  // -- Headline ------------------------------------------------------------

  let headline: string;

  if (therapy_rating === "outstanding") {
    headline =
      "Outstanding animal-assisted therapy provision -- children benefit from comprehensive, well-documented therapy with healthy, well-cared-for animals delivering demonstrable therapeutic outcomes.";
  } else if (therapy_rating === "good") {
    headline = `Good animal-assisted therapy provision -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (therapy_rating === "adequate") {
    headline = `Adequate animal-assisted therapy provision -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children and animals receive optimal care and therapeutic benefit.`;
  } else {
    headline = `Animal-assisted therapy provision is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's safety, animal welfare, and therapeutic quality.`;
  }

  // -- Return --------------------------------------------------------------

  return {
    therapy_rating,
    therapy_score: score,
    headline,
    total_sessions: totalSessions,
    therapy_frequency_rate: therapyFrequencyRate,
    pet_care_responsibility_rate: petCareResponsibilityRate,
    interaction_outcome_rate: interactionOutcomeRate,
    welfare_compliance_rate: welfareComplianceRate,
    child_engagement_rate: childEngagementRate,
    child_benefit_rate: childBenefitRate,
    session_goal_achievement_avg: sessionGoalAchievementAvg,
    mood_improvement_avg: moodImprovementAvg,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
