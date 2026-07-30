// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME AROMATHERAPY & WELLBEING THERAPIES INTELLIGENCE ENGINE
// Monitors complementary therapy provision across the home — aromatherapy
// session quality, wellbeing therapy access, relaxation programme effectiveness,
// sensory-based calming techniques, and child benefit tracking.
// Measures aromatherapy access rate, therapy quality rate, relaxation
// effectiveness rate, calming technique rate, child benefit rate, and
// child engagement rate.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging with the wider community, enrichment activities),
// Reg 14 (Physical and mental health promotion).
// SCCIF: experiences and progress for children. HOME-LEVEL engine.
// Store keys: aromatherapySessionRecords, wellbeingTherapyRecords,
//             relaxationProgrammeRecords, calmingTechniqueRecords,
//             childBenefitRecords
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meets } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AromatherapySessionRecordInput {
  id: string;
  child_id: string;
  session_date: string;
  session_type: "individual" | "group" | "drop_in" | "structured" | "assessment";
  therapist_name: string;
  therapist_qualified: boolean;
  oils_used: string[];
  application_method: "diffuser" | "massage" | "inhalation" | "bath" | "compress" | "topical" | "room_spray";
  consent_obtained: boolean;
  allergy_check_completed: boolean;
  contraindication_check_completed: boolean;
  duration_minutes: number;
  child_mood_before: number; // 1-5
  child_mood_after: number; // 1-5
  child_engagement_rating: number; // 1-5
  child_feedback_positive: boolean;
  session_goals_set: boolean;
  session_goals_met: boolean;
  adverse_reaction: boolean;
  adverse_reaction_details: string | null;
  risk_assessment_current: boolean;
  notes_recorded: boolean;
  follow_up_planned: boolean;
  created_at: string;
}

export interface WellbeingTherapyRecordInput {
  id: string;
  child_id: string;
  therapy_date: string;
  therapy_type: "aromatherapy" | "reflexology" | "massage" | "reiki" | "mindfulness" | "yoga" | "meditation" | "art_therapy" | "music_therapy" | "other";
  therapist_name: string;
  therapist_qualified: boolean;
  session_format: "individual" | "group" | "paired";
  duration_minutes: number;
  consent_obtained: boolean;
  child_engagement_rating: number; // 1-5
  therapeutic_benefit_observed: boolean;
  child_feedback_positive: boolean;
  child_self_reported_benefit: boolean;
  mood_improvement_observed: boolean;
  anxiety_reduction_observed: boolean;
  sleep_improvement_reported: boolean;
  staff_present: boolean;
  notes_recorded: boolean;
  follow_up_planned: boolean;
  referral_source: string | null;
  created_at: string;
}

export interface RelaxationProgrammeRecordInput {
  id: string;
  child_id: string;
  programme_name: string;
  start_date: string;
  review_date: string | null;
  reviewed: boolean;
  programme_type: "breathing_exercises" | "progressive_relaxation" | "guided_imagery" | "sensory_room" | "nature_based" | "movement_based" | "creative" | "combined";
  frequency_per_week: number;
  sessions_attended: number;
  sessions_planned: number;
  child_engagement_rating: number; // 1-5
  effectiveness_rating: number; // 1-5
  child_feedback_positive: boolean;
  child_involved_in_planning: boolean;
  measurable_outcomes_set: boolean;
  measurable_outcomes_achieved: boolean;
  anxiety_level_before: number; // 1-10
  anxiety_level_after: number; // 1-10
  programme_active: boolean;
  staff_trained: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface CalmingTechniqueRecordInput {
  id: string;
  child_id: string;
  technique_date: string;
  technique_type: "essential_oil_diffusion" | "sensory_box" | "weighted_blanket" | "tactile_tools" | "sound_therapy" | "light_therapy" | "breathing_technique" | "grounding_exercise" | "aromatherapy_inhaler" | "other";
  context: "bedtime" | "anxiety_episode" | "post_incident" | "daily_routine" | "transition" | "meltdown" | "request" | "other";
  child_initiated: boolean;
  staff_guided: boolean;
  duration_minutes: number;
  effectiveness_rating: number; // 1-5
  child_mood_before: number; // 1-5
  child_mood_after: number; // 1-5
  child_feedback_positive: boolean;
  technique_appropriate: boolean;
  sensory_profile_considered: boolean;
  de_escalation_achieved: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface ChildBenefitRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessment_period_start: string;
  assessment_period_end: string;
  therapies_accessed: string[];
  sessions_attended_count: number;
  sessions_offered_count: number;
  overall_wellbeing_improvement: boolean;
  emotional_regulation_improved: boolean;
  anxiety_reduced: boolean;
  sleep_quality_improved: boolean;
  behaviour_improved: boolean;
  confidence_improved: boolean;
  social_skills_improved: boolean;
  self_care_skills_improved: boolean;
  child_self_reported_benefit: boolean;
  staff_reported_benefit: boolean;
  overall_progress_rating: number; // 1-5
  child_voice_captured: boolean;
  child_wants_to_continue: boolean;
  barriers_identified: string[];
  support_plan_updated: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface AromatherapyWellbeingInput {
  today: string;
  total_children: number;
  aromatherapy_session_records: AromatherapySessionRecordInput[];
  wellbeing_therapy_records: WellbeingTherapyRecordInput[];
  relaxation_programme_records: RelaxationProgrammeRecordInput[];
  calming_technique_records: CalmingTechniqueRecordInput[];
  child_benefit_records: ChildBenefitRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AromatherapyWellbeingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AromatherapyWellbeingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AromatherapyWellbeingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface AromatherapyWellbeingResult {
  wellbeing_therapy_rating: AromatherapyWellbeingRating;
  wellbeing_therapy_score: number;
  headline: string;
  total_aromatherapy_sessions: number;
  total_wellbeing_therapies: number;
  total_relaxation_programmes: number;
  total_calming_techniques: number;
  total_child_benefit_assessments: number;
  aromatherapy_access_rate: number;
  therapy_quality_rate: number;
  relaxation_effectiveness_rate: number;
  calming_technique_rate: number;
  child_benefit_rate: number;
  child_engagement_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: AromatherapyWellbeingRecommendation[];
  insights: AromatherapyWellbeingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AromatherapyWellbeingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: AromatherapyWellbeingRating,
  score: number,
  headline: string,
): AromatherapyWellbeingResult {
  return {
    wellbeing_therapy_rating: rating,
    wellbeing_therapy_score: score,
    headline,
    total_aromatherapy_sessions: 0,
    total_wellbeing_therapies: 0,
    total_relaxation_programmes: 0,
    total_calming_techniques: 0,
    total_child_benefit_assessments: 0,
    aromatherapy_access_rate: 0,
    therapy_quality_rate: 0,
    relaxation_effectiveness_rate: 0,
    calming_technique_rate: 0,
    child_benefit_rate: 0,
    child_engagement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeAromatherapyWellbeingTherapies(
  input: AromatherapyWellbeingInput,
): AromatherapyWellbeingResult {
  const {
    total_children,
    aromatherapy_session_records,
    wellbeing_therapy_records,
    relaxation_programme_records,
    calming_technique_records,
    child_benefit_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    aromatherapy_session_records.length === 0 &&
    wellbeing_therapy_records.length === 0 &&
    relaxation_programme_records.length === 0 &&
    calming_technique_records.length === 0 &&
    child_benefit_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess aromatherapy and wellbeing therapy provision.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No aromatherapy or wellbeing therapy data recorded despite children on placement — complementary therapy provision requires urgent attention.",
      ),
      concerns: [
        "No aromatherapy session records, wellbeing therapy records, relaxation programme records, calming technique records, or child benefit assessments exist despite children being on placement — the home cannot evidence any complementary therapy provision or wellbeing support.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of aromatherapy sessions, wellbeing therapies, relaxation programmes, calming techniques, and child benefit assessments to evidence the home's complementary therapy provision and impact on children's wellbeing.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging with wider community",
        },
        {
          rank: 2,
          recommendation:
            "Assess each child's individual wellbeing needs and develop a complementary therapy offer that includes aromatherapy, relaxation programmes, and sensory-based calming techniques tailored to their preferences and therapeutic goals.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
        },
      ],
      insights: [
        {
          text: "The complete absence of aromatherapy and wellbeing therapy records means Ofsted cannot verify that children have access to complementary therapies, relaxation support, or sensory-based calming interventions. This represents a significant gap in evidencing holistic wellbeing promotion under Reg 5 and Reg 14.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Aromatherapy session metrics ---
  const totalAromaSessions = aromatherapy_session_records.length;

  const aromaConsentObtained = aromatherapy_session_records.filter(
    (r) => r.consent_obtained,
  ).length;
  const aromaConsentRate = pct(aromaConsentObtained, totalAromaSessions);

  const aromaAllergyChecked = aromatherapy_session_records.filter(
    (r) => r.allergy_check_completed,
  ).length;
  const aromaAllergyCheckRate = pct(aromaAllergyChecked, totalAromaSessions);

  const aromaContraChecked = aromatherapy_session_records.filter(
    (r) => r.contraindication_check_completed,
  ).length;
  const aromaContraCheckRate = pct(aromaContraChecked, totalAromaSessions);

  const aromaQualifiedTherapist = aromatherapy_session_records.filter(
    (r) => r.therapist_qualified,
  ).length;
  const aromaQualifiedRate = pct(aromaQualifiedTherapist, totalAromaSessions);

  const aromaGoalsSet = aromatherapy_session_records.filter(
    (r) => r.session_goals_set,
  ).length;
  const aromaGoalsSetRate = pct(aromaGoalsSet, totalAromaSessions);

  const aromaGoalsMet = aromatherapy_session_records.filter(
    (r) => r.session_goals_set && r.session_goals_met,
  ).length;
  const aromaGoalsMetRate = pct(aromaGoalsMet, aromaGoalsSet);

  const aromaChildPositive = aromatherapy_session_records.filter(
    (r) => r.child_feedback_positive,
  ).length;
  const aromaChildPositiveRate = pct(aromaChildPositive, totalAromaSessions);

  const aromaAdverseReactions = aromatherapy_session_records.filter(
    (r) => r.adverse_reaction,
  ).length;
  const aromaAdverseRate = pct(aromaAdverseReactions, totalAromaSessions);

  const aromaRiskAssessmentCurrent = aromatherapy_session_records.filter(
    (r) => r.risk_assessment_current,
  ).length;
  const aromaRiskAssessmentRate = pct(aromaRiskAssessmentCurrent, totalAromaSessions);

  const aromaNotesRecorded = aromatherapy_session_records.filter(
    (r) => r.notes_recorded,
  ).length;
  const aromaNotesRate = pct(aromaNotesRecorded, totalAromaSessions);

  const aromaMoodImproved = aromatherapy_session_records.filter(
    (r) => r.child_mood_after > r.child_mood_before,
  ).length;
  const aromaMoodImprovedRate = pct(aromaMoodImproved, totalAromaSessions);

  const aromaEngagementSum = aromatherapy_session_records.reduce(
    (sum, r) => sum + r.child_engagement_rating,
    0,
  );
  const avgAromaEngagement: number | null =
    totalAromaSessions > 0
      ? Math.round((aromaEngagementSum / totalAromaSessions) * 100) / 100
      : null;

  // Unique children accessing aromatherapy
  const uniqueChildrenAroma = new Set(
    aromatherapy_session_records.map((r) => r.child_id),
  ).size;
  const aromatherapyAccessRate =
    total_children > 0 ? pct(uniqueChildrenAroma, total_children) : 0;

  // Aromatherapy safety composite: consent + allergy + contra + risk assessment
  const aromaSafetyNumerator =
    aromaConsentObtained + aromaAllergyChecked + aromaContraChecked + aromaRiskAssessmentCurrent;
  const aromaSafetyDenominator = totalAromaSessions * 4;
  const aromaSafetyRate = pct(aromaSafetyNumerator, aromaSafetyDenominator);

  // --- Wellbeing therapy metrics ---
  const totalWellbeingTherapies = wellbeing_therapy_records.length;

  const wellbeingConsentObtained = wellbeing_therapy_records.filter(
    (r) => r.consent_obtained,
  ).length;
  const wellbeingConsentRate = pct(wellbeingConsentObtained, totalWellbeingTherapies);

  const wellbeingQualifiedTherapist = wellbeing_therapy_records.filter(
    (r) => r.therapist_qualified,
  ).length;
  const wellbeingQualifiedRate = pct(wellbeingQualifiedTherapist, totalWellbeingTherapies);

  const wellbeingBenefitObserved = wellbeing_therapy_records.filter(
    (r) => r.therapeutic_benefit_observed,
  ).length;
  const wellbeingBenefitRate = pct(wellbeingBenefitObserved, totalWellbeingTherapies);

  const wellbeingChildPositive = wellbeing_therapy_records.filter(
    (r) => r.child_feedback_positive,
  ).length;
  const wellbeingChildPositiveRate = pct(wellbeingChildPositive, totalWellbeingTherapies);

  const wellbeingChildSelfReport = wellbeing_therapy_records.filter(
    (r) => r.child_self_reported_benefit,
  ).length;
  const wellbeingChildSelfReportRate = pct(wellbeingChildSelfReport, totalWellbeingTherapies);

  const wellbeingMoodImproved = wellbeing_therapy_records.filter(
    (r) => r.mood_improvement_observed,
  ).length;
  const wellbeingMoodImprovedRate = pct(wellbeingMoodImproved, totalWellbeingTherapies);

  const wellbeingAnxietyReduced = wellbeing_therapy_records.filter(
    (r) => r.anxiety_reduction_observed,
  ).length;
  const wellbeingAnxietyReducedRate = pct(wellbeingAnxietyReduced, totalWellbeingTherapies);

  const wellbeingSleepImproved = wellbeing_therapy_records.filter(
    (r) => r.sleep_improvement_reported,
  ).length;
  const wellbeingSleepImprovedRate = pct(wellbeingSleepImproved, totalWellbeingTherapies);

  const wellbeingEngagementSum = wellbeing_therapy_records.reduce(
    (sum, r) => sum + r.child_engagement_rating,
    0,
  );
  const avgWellbeingEngagement: number | null =
    totalWellbeingTherapies > 0
      ? Math.round((wellbeingEngagementSum / totalWellbeingTherapies) * 100) / 100
      : null;

  const wellbeingNotesRecorded = wellbeing_therapy_records.filter(
    (r) => r.notes_recorded,
  ).length;
  const wellbeingNotesRate = pct(wellbeingNotesRecorded, totalWellbeingTherapies);

  const wellbeingStaffPresent = wellbeing_therapy_records.filter(
    (r) => r.staff_present,
  ).length;
  const wellbeingStaffPresentRate = pct(wellbeingStaffPresent, totalWellbeingTherapies);

  // Unique children accessing any wellbeing therapy
  const uniqueChildrenWellbeing = new Set(
    wellbeing_therapy_records.map((r) => r.child_id),
  ).size;

  // Therapy quality composite: qualified + consent + benefit + notes
  const therapyQualityNumerator =
    aromaQualifiedTherapist +
    aromaConsentObtained +
    aromaNotesRecorded +
    wellbeingQualifiedTherapist +
    wellbeingConsentObtained +
    wellbeingNotesRecorded;
  const therapyQualityDenominator = (totalAromaSessions + totalWellbeingTherapies) * 3;
  const therapyQualityRate = pct(therapyQualityNumerator, therapyQualityDenominator);

  // --- Relaxation programme metrics ---
  const totalRelaxationProgrammes = relaxation_programme_records.length;

  const relaxationActive = relaxation_programme_records.filter(
    (r) => r.programme_active,
  ).length;

  const relaxationReviewed = relaxation_programme_records.filter(
    (r) => r.reviewed,
  ).length;
  const relaxationReviewRate = pct(relaxationReviewed, totalRelaxationProgrammes);

  const relaxationChildPositive = relaxation_programme_records.filter(
    (r) => r.child_feedback_positive,
  ).length;
  const relaxationChildPositiveRate = pct(relaxationChildPositive, totalRelaxationProgrammes);

  const relaxationChildInvolved = relaxation_programme_records.filter(
    (r) => r.child_involved_in_planning,
  ).length;
  const relaxationChildInvolvedRate = pct(relaxationChildInvolved, totalRelaxationProgrammes);

  const relaxationOutcomesSet = relaxation_programme_records.filter(
    (r) => r.measurable_outcomes_set,
  ).length;
  const relaxationOutcomesSetRate = pct(relaxationOutcomesSet, totalRelaxationProgrammes);

  const relaxationOutcomesAchieved = relaxation_programme_records.filter(
    (r) => r.measurable_outcomes_set && r.measurable_outcomes_achieved,
  ).length;
  const relaxationOutcomesAchievedRate = pct(relaxationOutcomesAchieved, relaxationOutcomesSet);

  const relaxationStaffTrained = relaxation_programme_records.filter(
    (r) => r.staff_trained,
  ).length;
  const relaxationStaffTrainedRate = pct(relaxationStaffTrained, totalRelaxationProgrammes);

  const relaxationEffectivenessSum = relaxation_programme_records.reduce(
    (sum, r) => sum + r.effectiveness_rating,
    0,
  );
  const avgRelaxationEffectiveness: number | null =
    totalRelaxationProgrammes > 0
      ? Math.round((relaxationEffectivenessSum / totalRelaxationProgrammes) * 100) / 100
      : null;

  const relaxationAnxietyReduced = relaxation_programme_records.filter(
    (r) => r.anxiety_level_after < r.anxiety_level_before,
  ).length;
  const relaxationAnxietyReducedRate = pct(relaxationAnxietyReduced, totalRelaxationProgrammes);

  const relaxationAttendanceRate =
    totalRelaxationProgrammes > 0
      ? pct(
          relaxation_programme_records.reduce((sum, r) => sum + r.sessions_attended, 0),
          relaxation_programme_records.reduce((sum, r) => sum + r.sessions_planned, 0),
        )
      : 0;

  const relaxationEngagementSum = relaxation_programme_records.reduce(
    (sum, r) => sum + r.child_engagement_rating,
    0,
  );
  const avgRelaxationEngagement: number | null =
    totalRelaxationProgrammes > 0
      ? Math.round((relaxationEngagementSum / totalRelaxationProgrammes) * 100) / 100
      : null;

  // Relaxation effectiveness composite: outcomes achieved + anxiety reduced + child positive + reviewed
  const relaxEffNumerator =
    relaxationOutcomesAchieved + relaxationAnxietyReduced + relaxationChildPositive + relaxationReviewed;
  const relaxEffDenominator = totalRelaxationProgrammes * 4;
  const relaxationEffectivenessRate = pct(relaxEffNumerator, relaxEffDenominator);

  // --- Calming technique metrics ---
  const totalCalmingTechniques = calming_technique_records.length;

  const calmingEffective = calming_technique_records.filter(
    (r) => r.effectiveness_rating >= 4,
  ).length;
  const calmingEffectiveRate = pct(calmingEffective, totalCalmingTechniques);

  const calmingChildPositive = calming_technique_records.filter(
    (r) => r.child_feedback_positive,
  ).length;
  const calmingChildPositiveRate = pct(calmingChildPositive, totalCalmingTechniques);

  const calmingChildInitiated = calming_technique_records.filter(
    (r) => r.child_initiated,
  ).length;
  const calmingChildInitiatedRate = pct(calmingChildInitiated, totalCalmingTechniques);

  const calmingMoodImproved = calming_technique_records.filter(
    (r) => r.child_mood_after > r.child_mood_before,
  ).length;
  const calmingMoodImprovedRate = pct(calmingMoodImproved, totalCalmingTechniques);

  const calmingDeEscalated = calming_technique_records.filter(
    (r) => r.de_escalation_achieved,
  ).length;
  const calmingDeEscalationRate = pct(calmingDeEscalated, totalCalmingTechniques);

  const calmingSensoryConsidered = calming_technique_records.filter(
    (r) => r.sensory_profile_considered,
  ).length;
  const calmingSensoryRate = pct(calmingSensoryConsidered, totalCalmingTechniques);

  const calmingAppropriate = calming_technique_records.filter(
    (r) => r.technique_appropriate,
  ).length;
  const calmingAppropriateRate = pct(calmingAppropriate, totalCalmingTechniques);

  const calmingNotesRecorded = calming_technique_records.filter(
    (r) => r.notes_recorded,
  ).length;
  const calmingNotesRate = pct(calmingNotesRecorded, totalCalmingTechniques);

  const calmingEffectivenessSum = calming_technique_records.reduce(
    (sum, r) => sum + r.effectiveness_rating,
    0,
  );
  const avgCalmingEffectiveness: number | null =
    totalCalmingTechniques > 0
      ? Math.round((calmingEffectivenessSum / totalCalmingTechniques) * 100) / 100
      : null;

  // Calming technique composite: effective + appropriate + sensory considered + de-escalation
  const calmingCompositeNumerator =
    calmingEffective + calmingAppropriate + calmingSensoryConsidered + calmingDeEscalated;
  const calmingCompositeDenominator = totalCalmingTechniques * 4;
  const calmingTechniqueRate = pct(calmingCompositeNumerator, calmingCompositeDenominator);

  // --- Child benefit metrics ---
  const totalBenefitAssessments = child_benefit_records.length;

  const benefitOverallImproved = child_benefit_records.filter(
    (r) => r.overall_wellbeing_improvement,
  ).length;
  const benefitOverallRate = pct(benefitOverallImproved, totalBenefitAssessments);

  const benefitEmotionalRegulation = child_benefit_records.filter(
    (r) => r.emotional_regulation_improved,
  ).length;
  const benefitEmotionalRate = pct(benefitEmotionalRegulation, totalBenefitAssessments);

  const benefitAnxietyReduced = child_benefit_records.filter(
    (r) => r.anxiety_reduced,
  ).length;
  const benefitAnxietyRate = pct(benefitAnxietyReduced, totalBenefitAssessments);

  const benefitSleepImproved = child_benefit_records.filter(
    (r) => r.sleep_quality_improved,
  ).length;
  const benefitSleepRate = pct(benefitSleepImproved, totalBenefitAssessments);

  const benefitBehaviourImproved = child_benefit_records.filter(
    (r) => r.behaviour_improved,
  ).length;
  const benefitBehaviourRate = pct(benefitBehaviourImproved, totalBenefitAssessments);

  const benefitConfidenceImproved = child_benefit_records.filter(
    (r) => r.confidence_improved,
  ).length;
  const benefitConfidenceRate = pct(benefitConfidenceImproved, totalBenefitAssessments);

  const benefitChildSelfReport = child_benefit_records.filter(
    (r) => r.child_self_reported_benefit,
  ).length;
  const benefitChildSelfReportRate = pct(benefitChildSelfReport, totalBenefitAssessments);

  const benefitStaffReport = child_benefit_records.filter(
    (r) => r.staff_reported_benefit,
  ).length;
  const benefitStaffReportRate = pct(benefitStaffReport, totalBenefitAssessments);

  const benefitChildVoice = child_benefit_records.filter(
    (r) => r.child_voice_captured,
  ).length;
  const benefitChildVoiceRate = pct(benefitChildVoice, totalBenefitAssessments);

  const benefitWantsContinue = child_benefit_records.filter(
    (r) => r.child_wants_to_continue,
  ).length;
  const benefitWantsContinueRate = pct(benefitWantsContinue, totalBenefitAssessments);

  const benefitSupportPlanUpdated = child_benefit_records.filter(
    (r) => r.support_plan_updated,
  ).length;
  const benefitSupportPlanRate = pct(benefitSupportPlanUpdated, totalBenefitAssessments);

  const benefitProgressSum = child_benefit_records.reduce(
    (sum, r) => sum + r.overall_progress_rating,
    0,
  );
  const avgBenefitProgress: number | null =
    totalBenefitAssessments > 0
      ? Math.round((benefitProgressSum / totalBenefitAssessments) * 100) / 100
      : null;

  const benefitReviewOverdue = child_benefit_records.filter(
    (r) => r.review_overdue,
  ).length;
  const benefitReviewOverdueRate = pct(benefitReviewOverdue, totalBenefitAssessments);

  // Attendance/access composite
  const totalSessionsOffered = child_benefit_records.reduce(
    (sum, r) => sum + r.sessions_offered_count,
    0,
  );
  const totalSessionsAttended = child_benefit_records.reduce(
    (sum, r) => sum + r.sessions_attended_count,
    0,
  );
  const sessionAttendanceRate = pct(totalSessionsAttended, totalSessionsOffered);

  // Child benefit composite: overall improvement + child self report + staff report + child voice
  const childBenefitNumerator =
    benefitOverallImproved + benefitChildSelfReport + benefitStaffReport + benefitChildVoice;
  const childBenefitDenominator = totalBenefitAssessments * 4;
  const childBenefitRate = pct(childBenefitNumerator, childBenefitDenominator);

  // --- Global engagement composite ---
  // Across aromatherapy + wellbeing + calming (engagement ratings + positive feedback)
  const engagementPositiveNumerator =
    aromaChildPositive +
    wellbeingChildPositive +
    calmingChildPositive +
    relaxationChildPositive;
  const engagementPositiveDenominator =
    totalAromaSessions + totalWellbeingTherapies + totalCalmingTechniques + totalRelaxationProgrammes;
  const childEngagementRate = pct(engagementPositiveNumerator, engagementPositiveDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: aromatherapyAccessRate (>=80: +4, >=50: +2) ---
  if (aromatherapyAccessRate >= 80) score += 4;
  else if (aromatherapyAccessRate >= 50) score += 2;

  // --- Bonus 2: therapyQualityRate (>=90: +4, >=70: +2) ---
  if (therapyQualityRate >= 90) score += 4;
  else if (therapyQualityRate >= 70) score += 2;

  // --- Bonus 3: relaxationEffectivenessRate (>=85: +4, >=65: +2) ---
  if (relaxationEffectivenessRate >= 85) score += 4;
  else if (relaxationEffectivenessRate >= 65) score += 2;

  // --- Bonus 4: calmingTechniqueRate (>=85: +3, >=65: +1) ---
  if (calmingTechniqueRate >= 85) score += 3;
  else if (calmingTechniqueRate >= 65) score += 1;

  // --- Bonus 5: childBenefitRate (>=85: +4, >=65: +2) ---
  if (childBenefitRate >= 85) score += 4;
  else if (childBenefitRate >= 65) score += 2;

  // --- Bonus 6: childEngagementRate (>=90: +3, >=70: +1) ---
  if (childEngagementRate >= 90) score += 3;
  else if (childEngagementRate >= 70) score += 1;

  // --- Bonus 7: aromaSafetyRate (>=95: +3, >=80: +1) ---
  if (aromaSafetyRate >= 95) score += 3;
  else if (aromaSafetyRate >= 80) score += 1;

  // --- Bonus 8: relaxationChildInvolvedRate (>=90: +3, >=70: +1) ---
  if (relaxationChildInvolvedRate >= 90) score += 3;
  else if (relaxationChildInvolvedRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // therapyQualityRate < 40 → -5
  if (therapyQualityRate < 40 && (totalAromaSessions + totalWellbeingTherapies) > 0) score -= 5;

  // relaxationEffectivenessRate < 40 → -5
  if (relaxationEffectivenessRate < 40 && totalRelaxationProgrammes > 0) score -= 5;

  // childBenefitRate < 40 → -5
  if (childBenefitRate < 40 && totalBenefitAssessments > 0) score -= 5;

  // aromaAdverseRate > 20 → -3
  if (aromaAdverseRate > 20 && totalAromaSessions > 0) score -= 3;

  score = clamp(score, 0, 100);

  const wellbeing_therapy_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (aromatherapyAccessRate >= 80 && total_children > 0) {
    strengths.push(
      `${aromatherapyAccessRate}% aromatherapy access rate — the majority of children on placement have access to aromatherapy sessions, demonstrating the home's commitment to complementary therapy provision.`,
    );
  } else if (aromatherapyAccessRate >= 50 && total_children > 0) {
    strengths.push(
      `${aromatherapyAccessRate}% of children have accessed aromatherapy sessions — the home offers aromatherapy to a reasonable proportion of its children.`,
    );
  }

  if (therapyQualityRate >= 90 && (totalAromaSessions + totalWellbeingTherapies) > 0) {
    strengths.push(
      `${therapyQualityRate}% therapy quality — sessions are delivered by qualified therapists with proper consent, and notes are consistently recorded, evidencing high-quality complementary therapy practice.`,
    );
  } else if (therapyQualityRate >= 70 && (totalAromaSessions + totalWellbeingTherapies) > 0) {
    strengths.push(
      `${therapyQualityRate}% therapy quality rate — the home generally maintains good standards in complementary therapy delivery.`,
    );
  }

  if (aromaSafetyRate >= 95 && totalAromaSessions > 0) {
    strengths.push(
      `${aromaSafetyRate}% aromatherapy safety compliance — consent, allergy checks, contraindication checks, and risk assessments are consistently completed before every session, demonstrating exemplary safeguarding practice.`,
    );
  } else if (aromaSafetyRate >= 80 && totalAromaSessions > 0) {
    strengths.push(
      `${aromaSafetyRate}% aromatherapy safety compliance — the home generally maintains good safety standards in aromatherapy delivery.`,
    );
  }

  if (relaxationEffectivenessRate >= 85 && totalRelaxationProgrammes > 0) {
    strengths.push(
      `${relaxationEffectivenessRate}% relaxation programme effectiveness — outcomes are achieved, anxiety is reduced, children provide positive feedback, and programmes are regularly reviewed.`,
    );
  } else if (relaxationEffectivenessRate >= 65 && totalRelaxationProgrammes > 0) {
    strengths.push(
      `${relaxationEffectivenessRate}% relaxation programme effectiveness — programmes are generally achieving their intended outcomes.`,
    );
  }

  if (calmingTechniqueRate >= 85 && totalCalmingTechniques > 0) {
    strengths.push(
      `${calmingTechniqueRate}% calming technique effectiveness — sensory-based calming interventions are appropriate, effective, consider children's sensory profiles, and successfully de-escalate situations.`,
    );
  } else if (calmingTechniqueRate >= 65 && totalCalmingTechniques > 0) {
    strengths.push(
      `${calmingTechniqueRate}% calming technique effectiveness — sensory-based calming techniques are generally well matched to children's needs.`,
    );
  }

  if (childBenefitRate >= 85 && totalBenefitAssessments > 0) {
    strengths.push(
      `${childBenefitRate}% child benefit rate — complementary therapies are demonstrably improving children's wellbeing, with evidence from child self-reports, staff observations, and captured child voice.`,
    );
  } else if (childBenefitRate >= 65 && totalBenefitAssessments > 0) {
    strengths.push(
      `${childBenefitRate}% child benefit rate — the home can evidence that complementary therapies are benefiting the majority of participating children.`,
    );
  }

  if (childEngagementRate >= 90 && engagementPositiveDenominator > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement across therapies — children consistently provide positive feedback and actively engage with complementary therapy sessions, reflecting child-centred, meaningful provision.`,
    );
  } else if (childEngagementRate >= 70 && engagementPositiveDenominator > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement rate — the majority of children engage positively with the complementary therapy offer.`,
    );
  }

  if (aromaMoodImprovedRate >= 80 && totalAromaSessions > 0) {
    strengths.push(
      `${aromaMoodImprovedRate}% mood improvement following aromatherapy sessions — children's emotional state consistently improves after aromatherapy, demonstrating therapeutic impact.`,
    );
  } else if (aromaMoodImprovedRate >= 60 && totalAromaSessions > 0) {
    strengths.push(
      `${aromaMoodImprovedRate}% mood improvement after aromatherapy — a good proportion of children experience mood improvement following sessions.`,
    );
  }

  if (calmingChildInitiatedRate >= 70 && totalCalmingTechniques > 0) {
    strengths.push(
      `${calmingChildInitiatedRate}% of calming techniques child-initiated — children are independently using sensory-based calming strategies, demonstrating internalised self-regulation skills.`,
    );
  } else if (calmingChildInitiatedRate >= 50 && totalCalmingTechniques > 0) {
    strengths.push(
      `${calmingChildInitiatedRate}% of calming techniques child-initiated — a good proportion of children are independently seeking out calming strategies.`,
    );
  }

  if (relaxationChildInvolvedRate >= 90 && totalRelaxationProgrammes > 0) {
    strengths.push(
      `${relaxationChildInvolvedRate}% child involvement in relaxation programme planning — children actively shape their own relaxation programmes, ensuring interventions are personalised and meaningful.`,
    );
  } else if (relaxationChildInvolvedRate >= 70 && totalRelaxationProgrammes > 0) {
    strengths.push(
      `${relaxationChildInvolvedRate}% child involvement in planning — most children are consulted about their relaxation programmes.`,
    );
  }

  if (wellbeingAnxietyReducedRate >= 80 && totalWellbeingTherapies > 0) {
    strengths.push(
      `${wellbeingAnxietyReducedRate}% anxiety reduction observed following wellbeing therapies — complementary therapies are effectively supporting children's emotional regulation and mental health.`,
    );
  }

  if (calmingDeEscalationRate >= 85 && totalCalmingTechniques > 0) {
    strengths.push(
      `${calmingDeEscalationRate}% de-escalation achieved through calming techniques — sensory-based interventions are highly effective in supporting children during times of heightened anxiety or distress.`,
    );
  }

  if (benefitWantsContinueRate >= 90 && totalBenefitAssessments > 0) {
    strengths.push(
      `${benefitWantsContinueRate}% of children want to continue their complementary therapies — children value and look forward to their therapy sessions, reflecting genuinely child-centred provision.`,
    );
  }

  if (aromaGoalsMetRate >= 85 && aromaGoalsSet > 0) {
    strengths.push(
      `${aromaGoalsMetRate}% of aromatherapy session goals met — sessions have clear therapeutic objectives that are consistently achieved, demonstrating focused, outcome-oriented practice.`,
    );
  }

  if (aromaAdverseRate === 0 && totalAromaSessions > 0) {
    strengths.push(
      "Zero adverse reactions recorded across all aromatherapy sessions — the home's safety protocols, allergy checks, and contraindication screening are effectively preventing harm.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (therapyQualityRate < 40 && (totalAromaSessions + totalWellbeingTherapies) > 0) {
    concerns.push(
      `Only ${therapyQualityRate}% therapy quality — a significant proportion of complementary therapy sessions lack qualified therapists, proper consent, or adequate notes. This undermines the safety and therapeutic value of the provision.`,
    );
  } else if (therapyQualityRate < 70 && therapyQualityRate >= 40 && (totalAromaSessions + totalWellbeingTherapies) > 0) {
    concerns.push(
      `Therapy quality rate at ${therapyQualityRate}% — some sessions are not meeting the expected standards for therapist qualification, consent, or documentation.`,
    );
  }

  if (relaxationEffectivenessRate < 40 && totalRelaxationProgrammes > 0) {
    concerns.push(
      `Only ${relaxationEffectivenessRate}% relaxation programme effectiveness — programmes are not achieving measurable outcomes, children's anxiety is not reducing, and reviews are not being conducted. This means resources are being allocated without demonstrable benefit.`,
    );
  } else if (relaxationEffectivenessRate < 65 && relaxationEffectivenessRate >= 40 && totalRelaxationProgrammes > 0) {
    concerns.push(
      `Relaxation programme effectiveness at ${relaxationEffectivenessRate}% — programmes need improvement in achieving measurable outcomes and reducing children's anxiety levels.`,
    );
  }

  if (childBenefitRate < 40 && totalBenefitAssessments > 0) {
    concerns.push(
      `Only ${childBenefitRate}% child benefit rate — complementary therapies are not demonstrating measurable improvements in children's wellbeing. The home cannot evidence that therapy provision is achieving its intended purpose.`,
    );
  } else if (childBenefitRate < 65 && childBenefitRate >= 40 && totalBenefitAssessments > 0) {
    concerns.push(
      `Child benefit rate at ${childBenefitRate}% — evidence of therapeutic benefit needs strengthening, particularly through child self-report and staff observation.`,
    );
  }

  if (calmingTechniqueRate < 40 && totalCalmingTechniques > 0) {
    concerns.push(
      `Only ${calmingTechniqueRate}% calming technique effectiveness — sensory-based calming interventions are not appropriately matched to children's needs, not considering sensory profiles, or not achieving de-escalation. Staff require additional training in sensory-based calming approaches.`,
    );
  } else if (calmingTechniqueRate < 65 && calmingTechniqueRate >= 40 && totalCalmingTechniques > 0) {
    concerns.push(
      `Calming technique effectiveness at ${calmingTechniqueRate}% — some sensory-based interventions are not achieving the intended calming or de-escalation outcomes.`,
    );
  }

  if (aromaSafetyRate < 70 && totalAromaSessions > 0) {
    concerns.push(
      `Aromatherapy safety compliance at only ${aromaSafetyRate}% — consent, allergy checks, contraindication screening, or risk assessments are not consistently completed. This represents a significant safeguarding gap in the use of essential oils and aromatherapy products with children.`,
    );
  } else if (aromaSafetyRate < 80 && aromaSafetyRate >= 70 && totalAromaSessions > 0) {
    concerns.push(
      `Aromatherapy safety compliance at ${aromaSafetyRate}% — some safety checks are being missed before sessions, which must be addressed to protect children from adverse reactions.`,
    );
  }

  if (aromaAdverseRate > 20 && totalAromaSessions > 0) {
    concerns.push(
      `${aromaAdverseRate}% adverse reaction rate in aromatherapy sessions — this is unacceptably high and indicates that safety screening, oil selection, or application methods need urgent review.`,
    );
  } else if (aromaAdverseRate > 10 && aromaAdverseRate <= 20 && totalAromaSessions > 0) {
    concerns.push(
      `${aromaAdverseRate}% adverse reaction rate in aromatherapy — some children are experiencing adverse reactions. Review allergy screening protocols and oil selection.`,
    );
  }

  if (childEngagementRate < 50 && engagementPositiveDenominator > 0) {
    concerns.push(
      `Only ${childEngagementRate}% child engagement across therapies — the majority of children are not positively engaging with complementary therapy provision. This may indicate that the therapy offer does not align with children's preferences or needs.`,
    );
  } else if (childEngagementRate < 70 && childEngagementRate >= 50 && engagementPositiveDenominator > 0) {
    concerns.push(
      `Child engagement at ${childEngagementRate}% — a significant proportion of children are not reporting positive engagement with the complementary therapy offer.`,
    );
  }

  if (aromatherapyAccessRate < 30 && total_children > 0 && totalAromaSessions > 0) {
    concerns.push(
      `Only ${aromatherapyAccessRate}% of children have accessed aromatherapy — the therapy offer is not reaching the majority of children on placement. Review whether barriers to access exist.`,
    );
  }

  if (relaxationChildInvolvedRate < 50 && totalRelaxationProgrammes > 0) {
    concerns.push(
      `Only ${relaxationChildInvolvedRate}% child involvement in relaxation programme planning — children's views and preferences about their relaxation needs are not being sought, undermining the voice of the child.`,
    );
  }

  if (benefitChildVoiceRate < 50 && totalBenefitAssessments > 0) {
    concerns.push(
      `Only ${benefitChildVoiceRate}% of child benefit assessments capture the child's voice — children's own views about the impact of therapies are not being recorded, which weakens the evidence base and Ofsted's ability to hear from children directly.`,
    );
  }

  if (benefitReviewOverdueRate > 30 && totalBenefitAssessments > 0) {
    concerns.push(
      `${benefitReviewOverdueRate}% of child benefit assessments are overdue for review — outcomes are not being monitored in a timely way, which may mean children's changing needs are not being identified.`,
    );
  }

  if (totalAromaSessions === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No aromatherapy session records exist despite children being on placement — the home cannot evidence that aromatherapy is available or being offered to children.",
    );
  }

  if (totalBenefitAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child benefit assessments recorded — the home cannot evidence whether complementary therapies are actually improving children's outcomes and wellbeing.",
    );
  }

  if (wellbeingQualifiedRate < 70 && totalWellbeingTherapies > 0) {
    concerns.push(
      `Only ${wellbeingQualifiedRate}% of wellbeing therapy sessions delivered by qualified therapists — children should receive complementary therapies from appropriately trained and qualified practitioners.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: AromatherapyWellbeingRecommendation[] = [];
  let rank = 0;

  if (therapyQualityRate < 40 && (totalAromaSessions + totalWellbeingTherapies) > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review complementary therapy quality standards — ensure all sessions are delivered by qualified therapists with documented consent, and that comprehensive session notes are recorded. Children's safety and therapeutic benefit depend on professional, well-documented practice.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (aromaSafetyRate < 70 && totalAromaSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory pre-session safety protocols for all aromatherapy sessions — consent, allergy checks, contraindication screening, and current risk assessments must be completed and documented before any essential oils are used with children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (aromaAdverseRate > 20 && totalAromaSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an urgent review of aromatherapy adverse reactions — the high adverse reaction rate indicates systemic issues with safety screening, oil selection, dilution ratios, or application methods. Suspend aromatherapy until a full review is completed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (relaxationEffectivenessRate < 40 && totalRelaxationProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul relaxation programme design — programmes must have clear measurable outcomes, be regularly reviewed, and demonstrate anxiety reduction. Involve children in programme planning and ensure staff are trained in evidence-based relaxation techniques.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with wider community",
    });
  }

  if (childBenefitRate < 40 && totalBenefitAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the impact of the entire complementary therapy programme — when child benefit rates are low, the home must assess whether therapies are meeting children's actual needs and whether resources should be redirected to more effective interventions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (childEngagementRate < 50 && engagementPositiveDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult children about the complementary therapy offer — low engagement indicates the current provision may not align with children's interests, preferences, or needs. Redesign the offer based on children's feedback.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (totalAromaSessions === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce aromatherapy provision with appropriately qualified therapists — assess children's interest and suitability, obtain consent, and begin recording session data to evidence this complementary therapy offering.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with wider community",
    });
  }

  if (totalBenefitAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence child benefit assessments for all children accessing complementary therapies — without outcome measurement, the home cannot evidence whether its therapy provision is making a meaningful difference to children's wellbeing.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (calmingTechniqueRate < 40 && totalCalmingTechniques > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide targeted training on sensory-based calming techniques — staff must understand individual sensory profiles, appropriate technique selection, and de-escalation strategies to ensure calming interventions are effective.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (relaxationChildInvolvedRate < 50 && totalRelaxationProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children in their relaxation programme planning — ask children about their preferences, what helps them relax, and what they would like to try to create genuinely child-centred programmes.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (benefitChildVoiceRate < 50 && totalBenefitAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Systematically capture children's own views in benefit assessments — children's self-reported experiences of therapy are essential evidence for Ofsted and for understanding whether provision is truly meaningful.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (benefitReviewOverdueRate > 30 && totalBenefitAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a schedule for reviewing all child benefit assessments — overdue reviews mean changing needs may not be identified and therapy plans may drift from children's current requirements.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (
    therapyQualityRate >= 40 &&
    therapyQualityRate < 70 &&
    (totalAromaSessions + totalWellbeingTherapies) > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve therapy quality standards to at least 70% — ensure all therapists are qualified, consent is always obtained, and session notes are consistently recorded to build a robust evidence base.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (
    relaxationEffectivenessRate >= 40 &&
    relaxationEffectivenessRate < 65 &&
    totalRelaxationProgrammes > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance relaxation programme effectiveness through regular review cycles — set clear measurable outcomes, track anxiety reduction, and adapt programmes based on children's feedback and progress.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with wider community",
    });
  }

  if (
    calmingTechniqueRate >= 40 &&
    calmingTechniqueRate < 65 &&
    totalCalmingTechniques > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve calming technique effectiveness through sensory profiling — ensure each child has an up-to-date sensory profile that informs technique selection and that staff match interventions to individual needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (
    childBenefitRate >= 40 &&
    childBenefitRate < 65 &&
    totalBenefitAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen child benefit evidence by triangulating child self-reports, staff observations, and measurable outcome data — a multi-source evidence approach provides the strongest basis for demonstrating therapeutic impact.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70 &&
    engagementPositiveDenominator > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Seek regular child feedback on the therapy offer and adapt provision accordingly — aim to increase positive engagement above 70% by responding to children's preferences and interests.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (aromatherapyAccessRate < 50 && aromatherapyAccessRate > 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend aromatherapy access to more children on placement — assess each child's suitability, interest, and potential benefit, removing any barriers to access.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with wider community",
    });
  }

  if (wellbeingQualifiedRate < 70 && totalWellbeingTherapies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all wellbeing therapy sessions are delivered by qualified therapists — children in care deserve professionally delivered complementary therapies that are safe and therapeutically beneficial.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health and wellbeing",
    });
  }

  if (relaxationStaffTrainedRate < 70 && totalRelaxationProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Invest in staff training for delivering relaxation programmes — trained staff can provide consistent, evidence-based relaxation support as part of children's daily routines.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with wider community",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: AromatherapyWellbeingInsight[] = [];

  // -- Critical insights --

  if (therapyQualityRate < 40 && (totalAromaSessions + totalWellbeingTherapies) > 0) {
    insights.push({
      text: `Only ${therapyQualityRate}% therapy quality rate. Ofsted expects complementary therapies to be delivered by qualified practitioners with proper consent and documentation. Poor therapy quality undermines both the safety of the provision and the home's ability to evidence therapeutic benefit for children.`,
      severity: "critical",
    });
  }

  if (aromaSafetyRate < 70 && totalAromaSessions > 0) {
    insights.push({
      text: `Aromatherapy safety compliance at only ${aromaSafetyRate}%. Essential oils can cause allergic reactions, skin irritation, or interact with medications. Incomplete safety screening before aromatherapy sessions with looked-after children represents a significant safeguarding concern under Reg 14.`,
      severity: "critical",
    });
  }

  if (aromaAdverseRate > 20 && totalAromaSessions > 0) {
    insights.push({
      text: `${aromaAdverseRate}% adverse reaction rate in aromatherapy. This is unacceptably high and suggests systemic failures in safety screening, contraindication checking, or oil selection. Children in care are a vulnerable population and aromatherapy must be delivered with the highest safety standards.`,
      severity: "critical",
    });
  }

  if (relaxationEffectivenessRate < 40 && totalRelaxationProgrammes > 0) {
    insights.push({
      text: `Only ${relaxationEffectivenessRate}% relaxation programme effectiveness. Relaxation programmes exist but are not achieving their intended purpose — outcomes are not met, anxiety is not reducing, and programmes are not reviewed. This represents a significant waste of resources and a missed opportunity to support children's emotional wellbeing.`,
      severity: "critical",
    });
  }

  if (childBenefitRate < 40 && totalBenefitAssessments > 0) {
    insights.push({
      text: `Only ${childBenefitRate}% child benefit rate. The home's complementary therapy provision is not translating into measurable improvements in children's wellbeing. Without demonstrable benefit, Ofsted may question whether the provision meets children's actual needs or whether resources should be directed to more effective interventions.`,
      severity: "critical",
    });
  }

  if (totalAromaSessions === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No aromatherapy session records exist despite children being on placement. Without session data, the home cannot evidence that aromatherapy is available, safe, or beneficial. This is a gap in the home's complementary therapy evidence base.",
      severity: "critical",
    });
  }

  if (totalBenefitAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No child benefit assessments recorded. Without outcome measurement, the home cannot demonstrate to Ofsted that its complementary therapy investment is actually improving children's lives. Benefit tracking is essential for evidencing impact under SCCIF.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    therapyQualityRate >= 40 &&
    therapyQualityRate < 70 &&
    (totalAromaSessions + totalWellbeingTherapies) > 0
  ) {
    insights.push({
      text: `Therapy quality at ${therapyQualityRate}% — improving but inconsistent. Some sessions lack qualified therapists, consent documentation, or comprehensive notes. Strengthening these fundamentals will improve both safety and the evidence base.`,
      severity: "warning",
    });
  }

  if (
    relaxationEffectivenessRate >= 40 &&
    relaxationEffectivenessRate < 65 &&
    totalRelaxationProgrammes > 0
  ) {
    insights.push({
      text: `Relaxation programme effectiveness at ${relaxationEffectivenessRate}% — programmes have some impact but are not consistently achieving outcomes or reducing anxiety. Consider whether programme design, frequency, or staff training need adjustment.`,
      severity: "warning",
    });
  }

  if (
    childBenefitRate >= 40 &&
    childBenefitRate < 65 &&
    totalBenefitAssessments > 0
  ) {
    insights.push({
      text: `Child benefit rate at ${childBenefitRate}% — some children are benefiting from complementary therapies but the evidence base needs strengthening. Multi-source evidence (child, staff, measurable outcomes) provides the most robust picture.`,
      severity: "warning",
    });
  }

  if (
    calmingTechniqueRate >= 40 &&
    calmingTechniqueRate < 65 &&
    totalCalmingTechniques > 0
  ) {
    insights.push({
      text: `Calming technique effectiveness at ${calmingTechniqueRate}% — some sensory-based interventions are not achieving their intended calming or de-escalation outcomes. Individual sensory profiles and technique matching may need review.`,
      severity: "warning",
    });
  }

  if (
    childEngagementRate >= 50 &&
    childEngagementRate < 70 &&
    engagementPositiveDenominator > 0
  ) {
    insights.push({
      text: `Child engagement at ${childEngagementRate}% — a notable proportion of children are not positively engaging with complementary therapies. Engagement is a precondition for therapeutic benefit — consider whether the therapy offer matches children's preferences and developmental stage.`,
      severity: "warning",
    });
  }

  if (
    aromaSafetyRate >= 70 &&
    aromaSafetyRate < 80 &&
    totalAromaSessions > 0
  ) {
    insights.push({
      text: `Aromatherapy safety compliance at ${aromaSafetyRate}% — some safety checks are occasionally missed. Given the potential for adverse reactions in children, particularly those on medication, aim for 95%+ compliance with all pre-session safety protocols.`,
      severity: "warning",
    });
  }

  if (
    aromatherapyAccessRate >= 30 &&
    aromatherapyAccessRate < 50 &&
    total_children > 0
  ) {
    insights.push({
      text: `Aromatherapy access at ${aromatherapyAccessRate}% — fewer than half of children on placement have accessed aromatherapy. Consider whether barriers to access exist (consent, suitability, awareness) and whether all children have been offered the opportunity.`,
      severity: "warning",
    });
  }

  if (relaxationChildInvolvedRate < 50 && totalRelaxationProgrammes > 0) {
    insights.push({
      text: `Only ${relaxationChildInvolvedRate}% child involvement in relaxation programme planning — children's views about what helps them relax are not being sought. Child-centred relaxation programmes are more likely to be effective and sustained.`,
      severity: "warning",
    });
  }

  if (benefitChildVoiceRate < 50 && totalBenefitAssessments > 0) {
    insights.push({
      text: `Only ${benefitChildVoiceRate}% of benefit assessments capture the child's voice. Children's own perspective on whether therapies help them is the most powerful evidence of impact — Ofsted inspectors specifically seek this under SCCIF.`,
      severity: "warning",
    });
  }

  if (benefitReviewOverdueRate > 30 && totalBenefitAssessments > 0) {
    insights.push({
      text: `${benefitReviewOverdueRate}% of benefit assessments are overdue for review. Without timely reviews, the home cannot track whether therapies continue to meet children's evolving needs or identify when changes to the therapy plan are required.`,
      severity: "warning",
    });
  }

  if (
    aromaAdverseRate > 10 &&
    aromaAdverseRate <= 20 &&
    totalAromaSessions > 0
  ) {
    insights.push({
      text: `${aromaAdverseRate}% adverse reaction rate in aromatherapy — while not at critical levels, this warrants investigation. Review oil selection, dilution ratios, and individual sensitivity profiles to reduce adverse reactions.`,
      severity: "warning",
    });
  }

  // Therapy type analysis
  const therapyTypes: Record<string, number> = {};
  for (const t of wellbeing_therapy_records) {
    therapyTypes[t.therapy_type] = (therapyTypes[t.therapy_type] ?? 0) + 1;
  }
  const topTherapies = Object.entries(therapyTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topTherapies.length > 0) {
    const formatted = topTherapies
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most accessed wellbeing therapies: ${formatted}. Understanding therapy type preferences helps the home shape its complementary offer around children's interests and therapeutic needs.`,
      severity: "warning",
    });
  }

  // Calming technique context analysis
  const calmingContexts: Record<string, number> = {};
  for (const c of calming_technique_records) {
    calmingContexts[c.context] = (calmingContexts[c.context] ?? 0) + 1;
  }
  const topContexts = Object.entries(calmingContexts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topContexts.length > 0) {
    const formatted = topContexts
      .map(([ctx, count]) => `${ctx.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common contexts for calming techniques: ${formatted}. Identifying when children most need calming support helps the home proactively embed sensory strategies into daily routines and transition planning.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (wellbeing_therapy_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding aromatherapy and wellbeing therapy provision — complementary therapies are safe, high quality, effective, and child-centred. Children benefit measurably from the therapy offer, and their voices shape the provision. This is strong evidence for Reg 5 and Reg 14 compliance.",
      severity: "positive",
    });
  }

  if (
    aromaSafetyRate >= 95 &&
    aromaAdverseRate === 0 &&
    totalAromaSessions > 0
  ) {
    insights.push({
      text: `${aromaSafetyRate}% safety compliance with zero adverse reactions — the home's aromatherapy safety protocols are exemplary. Consent, allergy checks, contraindication screening, and risk assessments are consistently completed, protecting children from harm.`,
      severity: "positive",
    });
  }

  if (
    therapyQualityRate >= 90 &&
    (totalAromaSessions + totalWellbeingTherapies) > 0
  ) {
    insights.push({
      text: `${therapyQualityRate}% therapy quality — complementary therapy sessions are consistently delivered by qualified therapists, with proper consent and thorough documentation. This provides a robust evidence base for Ofsted.`,
      severity: "positive",
    });
  }

  if (
    relaxationEffectivenessRate >= 85 &&
    relaxationAnxietyReducedRate >= 80 &&
    totalRelaxationProgrammes > 0
  ) {
    insights.push({
      text: `${relaxationEffectivenessRate}% relaxation programme effectiveness with ${relaxationAnxietyReducedRate}% anxiety reduction — relaxation programmes are achieving their goals and measurably reducing children's anxiety. This demonstrates evidence-based practice that directly promotes children's emotional wellbeing.`,
      severity: "positive",
    });
  }

  if (
    childBenefitRate >= 85 &&
    benefitChildSelfReportRate >= 80 &&
    totalBenefitAssessments > 0
  ) {
    insights.push({
      text: `${childBenefitRate}% child benefit rate with ${benefitChildSelfReportRate}% child self-reported benefit — children themselves confirm that complementary therapies are improving their wellbeing. This is the strongest possible evidence of therapeutic impact.`,
      severity: "positive",
    });
  }

  if (
    calmingTechniqueRate >= 85 &&
    calmingDeEscalationRate >= 85 &&
    totalCalmingTechniques > 0
  ) {
    insights.push({
      text: `${calmingTechniqueRate}% calming technique effectiveness with ${calmingDeEscalationRate}% de-escalation achieved — sensory-based calming interventions are highly effective, well matched to children's needs, and consistently achieve their intended outcomes.`,
      severity: "positive",
    });
  }

  if (
    childEngagementRate >= 90 &&
    engagementPositiveDenominator > 0
  ) {
    insights.push({
      text: `${childEngagementRate}% child engagement across all complementary therapies — children actively and positively engage with the therapy offer, indicating that provision is genuinely aligned with their interests and preferences.`,
      severity: "positive",
    });
  }

  if (
    calmingChildInitiatedRate >= 70 &&
    totalCalmingTechniques > 0
  ) {
    insights.push({
      text: `${calmingChildInitiatedRate}% of calming techniques child-initiated — children are independently recognising when they need sensory support and proactively using calming strategies. This demonstrates genuine skill-building and internalised self-regulation.`,
      severity: "positive",
    });
  }

  if (
    relaxationChildInvolvedRate >= 90 &&
    relaxationChildPositiveRate >= 90 &&
    totalRelaxationProgrammes > 0
  ) {
    insights.push({
      text: `${relaxationChildInvolvedRate}% child involvement in planning with ${relaxationChildPositiveRate}% positive feedback — children co-design their relaxation programmes and value the resulting provision. This is exemplary child-centred practice.`,
      severity: "positive",
    });
  }

  if (
    benefitWantsContinueRate >= 90 &&
    totalBenefitAssessments > 0
  ) {
    insights.push({
      text: `${benefitWantsContinueRate}% of children want to continue their complementary therapies — this is a powerful indicator that children find real value in the provision and that it contributes positively to their experience of living in the home.`,
      severity: "positive",
    });
  }

  if (
    wellbeingMoodImprovedRate >= 80 &&
    wellbeingAnxietyReducedRate >= 80 &&
    totalWellbeingTherapies > 0
  ) {
    insights.push({
      text: `${wellbeingMoodImprovedRate}% mood improvement and ${wellbeingAnxietyReducedRate}% anxiety reduction from wellbeing therapies — complementary therapies are having a measurable positive impact on children's emotional state, supporting Reg 14 compliance.`,
      severity: "positive",
    });
  }

  if (
    meets(avgBenefitProgress, 4.0) &&
    totalBenefitAssessments > 0
  ) {
    insights.push({
      text: `Average child progress rating of ${avgBenefitProgress}/5 across benefit assessments — children are making strong progress through their complementary therapy journeys, demonstrating sustained therapeutic benefit over time.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (wellbeing_therapy_rating === "outstanding") {
    headline =
      "Outstanding aromatherapy and wellbeing therapy provision — complementary therapies are safe, effective, and child-centred, with demonstrable benefits to children's wellbeing.";
  } else if (wellbeing_therapy_rating === "good") {
    headline = `Good aromatherapy and wellbeing therapy provision — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (wellbeing_therapy_rating === "adequate") {
    headline = `Adequate aromatherapy and wellbeing therapy provision — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children benefit fully from complementary therapies.`;
  } else {
    headline = `Aromatherapy and wellbeing therapy provision is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure safe, effective, and beneficial therapy provision.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    wellbeing_therapy_rating,
    wellbeing_therapy_score: score,
    headline,
    total_aromatherapy_sessions: totalAromaSessions,
    total_wellbeing_therapies: totalWellbeingTherapies,
    total_relaxation_programmes: totalRelaxationProgrammes,
    total_calming_techniques: totalCalmingTechniques,
    total_child_benefit_assessments: totalBenefitAssessments,
    aromatherapy_access_rate: aromatherapyAccessRate,
    therapy_quality_rate: therapyQualityRate,
    relaxation_effectiveness_rate: relaxationEffectivenessRate,
    calming_technique_rate: calmingTechniqueRate,
    child_benefit_rate: childBenefitRate,
    child_engagement_rate: childEngagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
