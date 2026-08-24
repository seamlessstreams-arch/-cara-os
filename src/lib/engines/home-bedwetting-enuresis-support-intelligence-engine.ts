// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BEDWETTING & ENURESIS SUPPORT INTELLIGENCE ENGINE
// Monitors enuresis management quality — management plan coverage, discreet
// support provision, dignity preservation in care, medical referral tracking,
// and child emotional wellbeing around bedwetting.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Contact between children and parents/others),
// Reg 14 (Health care), SCCIF: Health and wellbeing.
// Store keys: enuresisManagementPlanRecords, enuresisDiscreetSupportRecords,
//             enuresisDignityPreservationRecords, enuresisMedicalReferralRecords,
//             enuresisEmotionalWellbeingRecords
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ManagementPlanRecordInput {
  id: string;
  child_id: string;
  plan_created_date: string;
  plan_type: "individual_enuresis_plan" | "continence_plan" | "night_management_plan" | "medical_led_plan" | "combined_support_plan" | "other";
  plan_active: boolean;
  reviewed: boolean;
  review_date: string | null;
  review_frequency: "weekly" | "fortnightly" | "monthly" | "quarterly" | "as_needed";
  child_involved_in_planning: boolean;
  parent_carer_informed: boolean;
  triggers_identified: boolean;
  triggers_documented: string | null;
  night_routine_documented: boolean;
  fluid_intake_guidance_included: boolean;
  protective_bedding_in_place: boolean;
  alarm_system_used: boolean;
  medication_component: boolean;
  medication_name: string | null;
  progress_rating: number; // 1-5
  outcomes_documented: boolean;
  staff_trained_on_plan: boolean;
  last_incident_date: string | null;
  incident_frequency: "nightly" | "several_per_week" | "weekly" | "fortnightly" | "monthly" | "occasional" | "resolved";
  goals: string | null;
  created_at: string;
}

export interface DiscreetSupportRecordInput {
  id: string;
  child_id: string;
  date: string;
  support_type: "bedding_change" | "laundry_management" | "night_check" | "morning_routine" | "protective_products" | "alarm_response" | "clothing_change" | "other";
  handled_discreetly: boolean;
  child_aware_of_discretion: boolean;
  other_children_unaware: boolean;
  staff_approach_appropriate: boolean;
  child_dignity_maintained: boolean;
  private_storage_used: boolean;
  timing_appropriate: boolean;
  staff_member: string;
  child_feedback: "positive" | "neutral" | "negative" | "not_sought" | null;
  notes: string | null;
  created_at: string;
}

export interface DignityPreservationRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  private_laundry_arrangement: boolean;
  discreet_bedding_storage: boolean;
  room_access_restricted_appropriately: boolean;
  no_peer_awareness_incidents: boolean;
  child_not_blamed_or_shamed: boolean;
  language_used_sensitively: boolean;
  child_empowered_in_management: boolean;
  self_management_skills_taught: boolean;
  age_appropriate_explanation_given: boolean;
  normalisation_approach_used: boolean;
  overnight_stays_supported: boolean;
  school_trip_support_provided: boolean;
  peer_teasing_addressed: boolean;
  peer_teasing_incidents: number;
  overall_dignity_score: number; // 1-5
  issues_identified: string[];
  issues_resolved: boolean;
  resolution_date: string | null;
  assessed_by: string;
  created_at: string;
}

export interface MedicalReferralRecordInput {
  id: string;
  child_id: string;
  referral_date: string;
  referral_type: "gp" | "paediatrician" | "enuresis_clinic" | "continence_service" | "camhs" | "school_nurse" | "other";
  referral_reason: string;
  referral_made_by: string;
  referral_accepted: boolean;
  appointment_date: string | null;
  appointment_attended: boolean;
  outcome_documented: boolean;
  outcome_summary: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  medication_prescribed: boolean;
  medication_name: string | null;
  medication_reviewed: boolean;
  treatment_plan_received: boolean;
  treatment_plan_implemented: boolean;
  professional_advice_shared_with_staff: boolean;
  child_consented_to_referral: boolean;
  parent_informed: boolean;
  social_worker_informed: boolean;
  created_at: string;
}

export interface EmotionalWellbeingRecordInput {
  id: string;
  child_id: string;
  date: string;
  assessment_type: "keywork_session" | "direct_observation" | "child_self_report" | "staff_assessment" | "professional_assessment" | "other";
  emotional_impact_level: "none" | "mild" | "moderate" | "significant" | "severe";
  child_self_esteem_rating: number; // 1-5
  child_anxiety_around_bedtime: boolean;
  child_anxiety_around_sleepovers: boolean;
  child_avoids_overnight_activities: boolean;
  child_talks_openly_about_issue: boolean;
  child_feels_supported: boolean;
  child_feels_embarrassed: boolean;
  child_feels_different: boolean;
  peer_relationship_impact: "none" | "mild" | "moderate" | "significant";
  school_impact: "none" | "mild" | "moderate" | "significant";
  therapeutic_support_offered: boolean;
  therapeutic_support_accepted: boolean;
  therapeutic_support_type: string | null;
  coping_strategies_in_place: boolean;
  coping_strategies_effective: boolean;
  progress_since_last_assessment: "improved" | "stable" | "declined" | "first_assessment";
  staff_member: string;
  child_voice_captured: boolean;
  child_wishes_recorded: string | null;
  confidence_in_management: boolean;
  notes: string | null;
  created_at: string;
}

export interface BedwettingEnuresisInput {
  today: string;
  total_children: number;
  management_plan_records: ManagementPlanRecordInput[];
  discreet_support_records: DiscreetSupportRecordInput[];
  dignity_preservation_records: DignityPreservationRecordInput[];
  medical_referral_records: MedicalReferralRecordInput[];
  emotional_wellbeing_records: EmotionalWellbeingRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type BedwettingEnuresisRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BedwettingEnuresisInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface BedwettingEnuresisRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface BedwettingEnuresisResult {
  enuresis_rating: BedwettingEnuresisRating;
  enuresis_score: number;
  headline: string;
  total_management_plans: number;
  total_support_interactions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  management_plan_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  discreet_support_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  dignity_preservation_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  medical_referral_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  emotional_wellbeing_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_confidence_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: BedwettingEnuresisRecommendation[];
  insights: BedwettingEnuresisInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Was `d === 0 ? 0 : …`: nothing recorded read as 0%, not as unmeasured.
function pct(n: number, d: number): number | null {
  return rate(n, d);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): BedwettingEnuresisRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: BedwettingEnuresisRating,
  score: number,
  headline: string,
): BedwettingEnuresisResult {
  return {
    enuresis_rating: rating,
    enuresis_score: score,
    headline,
    total_management_plans: 0,
    total_support_interactions: 0,
    management_plan_rate: 0,
    discreet_support_rate: 0,
    dignity_preservation_rate: 0,
    medical_referral_rate: 0,
    emotional_wellbeing_rate: 0,
    child_confidence_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeBedwettingEnuresisSupport(
  input: BedwettingEnuresisInput,
): BedwettingEnuresisResult {
  const {
    total_children,
    management_plan_records,
    discreet_support_records,
    dignity_preservation_records,
    medical_referral_records,
    emotional_wellbeing_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    management_plan_records.length === 0 &&
    discreet_support_records.length === 0 &&
    dignity_preservation_records.length === 0 &&
    medical_referral_records.length === 0 &&
    emotional_wellbeing_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess bedwetting and enuresis support quality.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No bedwetting or enuresis support data recorded despite children on placement — enuresis management requires urgent attention.",
      ),
      concerns: [
        "No enuresis management plans, discreet support records, dignity preservation assessments, medical referrals, or emotional wellbeing records exist despite children being on placement — the home cannot evidence that children experiencing bedwetting are being supported with dignity and appropriate care.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of enuresis management plans, discreet support interactions, dignity preservation assessments, medical referrals, and emotional wellbeing monitoring to evidence the home's approach to supporting children who experience bedwetting.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
        {
          rank: 2,
          recommendation:
            "Ensure any child experiencing bedwetting has an individual management plan that is reviewed regularly, with discreet support arrangements and medical referrals in place where appropriate.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Contact and dignity",
        },
      ],
      insights: [
        {
          text: "The complete absence of enuresis support records means Ofsted cannot verify that children experiencing bedwetting are being supported with dignity, that management plans exist, or that appropriate medical guidance has been sought. This represents a fundamental gap in Reg 14 health care compliance and Reg 5 dignity requirements.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Management plan metrics ---
  const totalManagementPlans = management_plan_records.length;

  const reviewedPlans = management_plan_records.filter((p) => p.reviewed).length;
  const planReviewRate = pct(reviewedPlans, totalManagementPlans);

  const childInvolvedInPlanning = management_plan_records.filter(
    (p) => p.child_involved_in_planning,
  ).length;
  const childInvolvementRate = pct(childInvolvedInPlanning, totalManagementPlans);

  const staffTrainedOnPlan = management_plan_records.filter((p) => p.staff_trained_on_plan).length;
  const staffTrainedRate = pct(staffTrainedOnPlan, totalManagementPlans);

  const progressSum = management_plan_records.reduce((sum, p) => sum + p.progress_rating, 0);
  // Null on empty — no management plans ⇒ no progress to rate; "0/5" would
  // read as "children under a plan and making no progress".
  const avgProgressRating: number | null =
    totalManagementPlans > 0
      ? Math.round((progressSum / totalManagementPlans) * 100) / 100
      : null;

  // Management plan rate: composite of active, reviewed, child involved, triggers, night routine, staff trained
  const planQualityChecks = [
    (p: ManagementPlanRecordInput) => p.plan_active,
    (p: ManagementPlanRecordInput) => p.reviewed,
    (p: ManagementPlanRecordInput) => p.child_involved_in_planning,
    (p: ManagementPlanRecordInput) => p.triggers_identified,
    (p: ManagementPlanRecordInput) => p.night_routine_documented,
    (p: ManagementPlanRecordInput) => p.staff_trained_on_plan,
  ];
  const totalPlanChecksPossible = totalManagementPlans * planQualityChecks.length;
  let totalPlanChecksPassed = 0;
  for (const rec of management_plan_records) {
    for (const check of planQualityChecks) {
      if (check(rec)) totalPlanChecksPassed++;
    }
  }
  const managementPlanRate = pct(totalPlanChecksPassed, totalPlanChecksPossible);

  // --- Discreet support metrics ---
  const totalDiscreetSupport = discreet_support_records.length;

  // Discreet support rate: composite of discretion, privacy, staff approach, dignity, timing
  const supportQualityChecks = [
    (s: DiscreetSupportRecordInput) => s.handled_discreetly,
    (s: DiscreetSupportRecordInput) => s.other_children_unaware,
    (s: DiscreetSupportRecordInput) => s.staff_approach_appropriate,
    (s: DiscreetSupportRecordInput) => s.child_dignity_maintained,
    (s: DiscreetSupportRecordInput) => s.timing_appropriate,
  ];
  const totalSupportChecksPossible = totalDiscreetSupport * supportQualityChecks.length;
  let totalSupportChecksPassed = 0;
  for (const rec of discreet_support_records) {
    for (const check of supportQualityChecks) {
      if (check(rec)) totalSupportChecksPassed++;
    }
  }
  const discreetSupportRate = pct(totalSupportChecksPassed, totalSupportChecksPossible);

  // --- Dignity preservation metrics ---
  const totalDignityRecords = dignity_preservation_records.length;

  const dignityChecks = [
    (d: DignityPreservationRecordInput) => d.private_laundry_arrangement,
    (d: DignityPreservationRecordInput) => d.discreet_bedding_storage,
    (d: DignityPreservationRecordInput) => d.room_access_restricted_appropriately,
    (d: DignityPreservationRecordInput) => d.no_peer_awareness_incidents,
    (d: DignityPreservationRecordInput) => d.child_not_blamed_or_shamed,
    (d: DignityPreservationRecordInput) => d.language_used_sensitively,
    (d: DignityPreservationRecordInput) => d.child_empowered_in_management,
    (d: DignityPreservationRecordInput) => d.normalisation_approach_used,
    (d: DignityPreservationRecordInput) => d.age_appropriate_explanation_given,
  ];
  const totalDignityChecksPossible = totalDignityRecords * dignityChecks.length;
  let totalDignityChecksPassed = 0;
  for (const rec of dignity_preservation_records) {
    for (const check of dignityChecks) {
      if (check(rec)) totalDignityChecksPassed++;
    }
  }
  const dignityPreservationRate = pct(totalDignityChecksPassed, totalDignityChecksPossible);

  const selfManagementTaught = dignity_preservation_records.filter((d) => d.self_management_skills_taught).length;
  const selfManagementRate = pct(selfManagementTaught, totalDignityRecords);

  const overnightStaysSupported = dignity_preservation_records.filter((d) => d.overnight_stays_supported).length;
  const overnightSupportRate = pct(overnightStaysSupported, totalDignityRecords);

  const noPeerAwareness = dignity_preservation_records.filter((d) => d.no_peer_awareness_incidents).length;
  const peerAwarenessRate = pct(noPeerAwareness, totalDignityRecords);

  const notBlamedShamed = dignity_preservation_records.filter((d) => d.child_not_blamed_or_shamed).length;
  const noBlamingRate = pct(notBlamedShamed, totalDignityRecords);

  // --- Medical referral metrics ---
  const totalMedicalReferrals = medical_referral_records.length;

  const followUpRequired = medical_referral_records.filter((r) => r.follow_up_required).length;
  const followUpCompleted = medical_referral_records.filter(
    (r) => r.follow_up_required && r.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpRequired);

  const adviceSharedWithStaff = medical_referral_records.filter((r) => r.professional_advice_shared_with_staff).length;
  const adviceSharedRate = pct(adviceSharedWithStaff, totalMedicalReferrals);

  // Medical referral rate: composite of accepted, attended, outcome documented, advice shared
  const referralQualityChecks = [
    (r: MedicalReferralRecordInput) => r.referral_accepted,
    (r: MedicalReferralRecordInput) => r.appointment_attended,
    (r: MedicalReferralRecordInput) => r.outcome_documented,
    (r: MedicalReferralRecordInput) => r.professional_advice_shared_with_staff,
  ];
  const totalReferralChecksPossible = totalMedicalReferrals * referralQualityChecks.length;
  let totalReferralChecksPassed = 0;
  for (const rec of medical_referral_records) {
    for (const check of referralQualityChecks) {
      if (check(rec)) totalReferralChecksPassed++;
    }
  }
  const medicalReferralRate = pct(totalReferralChecksPassed, totalReferralChecksPossible);

  // --- Emotional wellbeing metrics ---
  const totalEmotionalRecords = emotional_wellbeing_records.length;

  const feelsSupported = emotional_wellbeing_records.filter((e) => e.child_feels_supported).length;
  const feelsSupportedRate = pct(feelsSupported, totalEmotionalRecords);

  const childVoiceCaptured = emotional_wellbeing_records.filter((e) => e.child_voice_captured).length;
  const childVoiceRate = pct(childVoiceCaptured, totalEmotionalRecords);

  const copingStrategiesInPlace = emotional_wellbeing_records.filter((e) => e.coping_strategies_in_place).length;
  const copingStrategiesRate = pct(copingStrategiesInPlace, totalEmotionalRecords);

  const copingEffective = emotional_wellbeing_records.filter(
    (e) => e.coping_strategies_in_place && e.coping_strategies_effective,
  ).length;
  const copingEffectivenessRate = pct(copingEffective, copingStrategiesInPlace);

  const confidenceInManagement = emotional_wellbeing_records.filter((e) => e.confidence_in_management).length;
  const childConfidenceRate = pct(confidenceInManagement, totalEmotionalRecords);

  const declinedProgress = emotional_wellbeing_records.filter((e) => e.progress_since_last_assessment === "declined").length;
  const assessmentsWithProgress = emotional_wellbeing_records.filter(
    (e) => e.progress_since_last_assessment !== "first_assessment",
  ).length;

  const feelsEmbarrassed = emotional_wellbeing_records.filter((e) => e.child_feels_embarrassed).length;
  const embarrassmentRate = pct(feelsEmbarrassed, totalEmotionalRecords);

  const anxietyBedtime = emotional_wellbeing_records.filter((e) => e.child_anxiety_around_bedtime).length;
  const bedtimeAnxietyRate = pct(anxietyBedtime, totalEmotionalRecords);

  const avoidsSleepover = emotional_wellbeing_records.filter((e) => e.child_avoids_overnight_activities).length;
  const avoidsSleepoverRate = pct(avoidsSleepover, totalEmotionalRecords);

  const selfEsteemSum = emotional_wellbeing_records.reduce((sum, e) => sum + e.child_self_esteem_rating, 0);
  // Null on empty — no emotional-wellbeing records ⇒ no self-esteem to average.
  const avgSelfEsteem: number | null =
    totalEmotionalRecords > 0
      ? Math.round((selfEsteemSum / totalEmotionalRecords) * 100) / 100
      : null;

  const significantImpact = emotional_wellbeing_records.filter(
    (e) => e.emotional_impact_level === "significant" || e.emotional_impact_level === "severe",
  ).length;
  const significantImpactRate = pct(significantImpact, totalEmotionalRecords);

  const peerRelationshipImpact = emotional_wellbeing_records.filter(
    (e) => e.peer_relationship_impact === "significant" || e.peer_relationship_impact === "moderate",
  ).length;
  const peerImpactRate = pct(peerRelationshipImpact, totalEmotionalRecords);

  const schoolImpact = emotional_wellbeing_records.filter(
    (e) => e.school_impact === "significant" || e.school_impact === "moderate",
  ).length;
  const schoolImpactRate = pct(schoolImpact, totalEmotionalRecords);

  // Emotional wellbeing rate: composite of feels supported, voice captured, coping strategies, confidence
  const emotionalQualityChecks = [
    (e: EmotionalWellbeingRecordInput) => e.child_feels_supported,
    (e: EmotionalWellbeingRecordInput) => e.child_voice_captured,
    (e: EmotionalWellbeingRecordInput) => e.coping_strategies_in_place,
    (e: EmotionalWellbeingRecordInput) => e.confidence_in_management,
  ];
  const totalEmotionalChecksPossible = totalEmotionalRecords * emotionalQualityChecks.length;
  let totalEmotionalChecksPassed = 0;
  for (const rec of emotional_wellbeing_records) {
    for (const check of emotionalQualityChecks) {
      if (check(rec)) totalEmotionalChecksPassed++;
    }
  }
  const emotionalWellbeingRate = pct(totalEmotionalChecksPassed, totalEmotionalChecksPossible);

  // Total support interactions for result
  const totalSupportInteractions = totalDiscreetSupport;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: managementPlanRate (>=90: +4, >=70: +2) ---
  if (meets(managementPlanRate, 90)) score += 4;
  else if (meets(managementPlanRate, 70)) score += 2;

  // --- Bonus 2: discreetSupportRate (>=90: +4, >=70: +2) ---
  if (meets(discreetSupportRate, 90)) score += 4;
  else if (meets(discreetSupportRate, 70)) score += 2;

  // --- Bonus 3: dignityPreservationRate (>=90: +4, >=70: +2) ---
  if (meets(dignityPreservationRate, 90)) score += 4;
  else if (meets(dignityPreservationRate, 70)) score += 2;

  // --- Bonus 4: medicalReferralRate (>=85: +3, >=65: +1) ---
  if (meets(medicalReferralRate, 85)) score += 3;
  else if (meets(medicalReferralRate, 65)) score += 1;

  // --- Bonus 5: emotionalWellbeingRate (>=90: +3, >=70: +1) ---
  if (meets(emotionalWellbeingRate, 90)) score += 3;
  else if (meets(emotionalWellbeingRate, 70)) score += 1;

  // --- Bonus 6: childConfidenceRate (>=90: +3, >=70: +1) ---
  if (meets(childConfidenceRate, 90)) score += 3;
  else if (meets(childConfidenceRate, 70)) score += 1;

  // --- Bonus 7: planReviewRate (>=90: +3, >=70: +1) ---
  if (meets(planReviewRate, 90)) score += 3;
  else if (meets(planReviewRate, 70)) score += 1;

  // --- Bonus 8: followUpCompletionRate (>=90: +2, >=70: +1) ---
  if (meets(followUpCompletionRate, 90)) score += 2;
  else if (meets(followUpCompletionRate, 70)) score += 1;

  // --- Bonus 9: noBlamingRate (>=95: +2, >=80: +1) ---
  if (meets(noBlamingRate, 95)) score += 2;
  else if (meets(noBlamingRate, 80)) score += 1;

  // ── Penalties (guarded by array.length > 0) ───────────────────────────

  // Penalty 1: managementPlanRate < 50 → -5
  if (below(managementPlanRate, 50) && management_plan_records.length > 0) score -= 5;

  // Penalty 2: discreetSupportRate < 50 → -5
  if (below(discreetSupportRate, 50) && discreet_support_records.length > 0) score -= 5;

  // Penalty 3: dignityPreservationRate < 50 → -5
  if (below(dignityPreservationRate, 50) && dignity_preservation_records.length > 0) score -= 5;

  // Penalty 4: significantImpactRate > 50 → -3
  if (above(significantImpactRate, 50) && emotional_wellbeing_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const enuresis_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(managementPlanRate, 90) && totalManagementPlans > 0) {
    strengths.push(
      `${managementPlanRate}% management plan quality — enuresis management plans are comprehensive, actively reviewed, child-centred, and staff are properly trained, demonstrating outstanding care planning for children experiencing bedwetting.`,
    );
  } else if (meets(managementPlanRate, 70) && totalManagementPlans > 0) {
    strengths.push(
      `${managementPlanRate}% management plan quality — the home maintains good-quality enuresis management plans with generally strong coverage of key elements.`,
    );
  }

  if (meets(discreetSupportRate, 90) && totalDiscreetSupport > 0) {
    strengths.push(
      `${discreetSupportRate}% discreet support quality — bedwetting support is consistently handled with exceptional discretion, preserving children's privacy and maintaining their dignity at all times.`,
    );
  } else if (meets(discreetSupportRate, 70) && totalDiscreetSupport > 0) {
    strengths.push(
      `${discreetSupportRate}% discreet support quality — the home generally handles bedwetting support with appropriate discretion and respect for children's privacy.`,
    );
  }

  if (meets(dignityPreservationRate, 90) && totalDignityRecords > 0) {
    strengths.push(
      `${dignityPreservationRate}% dignity preservation — the home consistently protects children's dignity through private laundry arrangements, discreet storage, sensitive language, and empowering children to manage their own care.`,
    );
  } else if (meets(dignityPreservationRate, 70) && totalDignityRecords > 0) {
    strengths.push(
      `${dignityPreservationRate}% dignity preservation — the home generally takes appropriate steps to protect children's dignity around bedwetting.`,
    );
  }

  if (meets(medicalReferralRate, 85) && totalMedicalReferrals > 0) {
    strengths.push(
      `${medicalReferralRate}% medical referral quality — referrals are accepted, appointments attended, outcomes documented, and professional advice shared with staff, demonstrating excellent health care coordination under Reg 14.`,
    );
  } else if (meets(medicalReferralRate, 65) && totalMedicalReferrals > 0) {
    strengths.push(
      `${medicalReferralRate}% medical referral quality — the home generally manages enuresis-related medical referrals effectively.`,
    );
  }

  if (meets(emotionalWellbeingRate, 90) && totalEmotionalRecords > 0) {
    strengths.push(
      `${emotionalWellbeingRate}% emotional wellbeing support — children feel supported, their voices are captured, coping strategies are in place, and they have confidence in managing their bedwetting.`,
    );
  } else if (meets(emotionalWellbeingRate, 70) && totalEmotionalRecords > 0) {
    strengths.push(
      `${emotionalWellbeingRate}% emotional wellbeing support — the home generally supports children's emotional needs around bedwetting effectively.`,
    );
  }

  if (meets(childConfidenceRate, 90) && totalEmotionalRecords > 0) {
    strengths.push(
      `${childConfidenceRate}% child confidence in self-management — children feel empowered and confident in managing their bedwetting, reflecting sensitive staff practice and effective skill-building.`,
    );
  } else if (meets(childConfidenceRate, 70) && totalEmotionalRecords > 0) {
    strengths.push(
      `${childConfidenceRate}% child confidence in self-management — most children feel capable of managing aspects of their bedwetting with appropriate support.`,
    );
  }

  if (meets(noBlamingRate, 95) && totalDignityRecords > 0) {
    strengths.push(
      `${noBlamingRate}% no-blame approach — staff consistently avoid blaming or shaming children about bedwetting, creating a safe and accepting environment that normalises enuresis.`,
    );
  } else if (meets(noBlamingRate, 80) && totalDignityRecords > 0) {
    strengths.push(
      `${noBlamingRate}% no-blame approach — staff generally avoid blaming or shaming children, maintaining a supportive atmosphere.`,
    );
  }

  if (meets(peerAwarenessRate, 90) && totalDignityRecords > 0) {
    strengths.push(
      `${peerAwarenessRate}% peer privacy maintained — other children are consistently kept unaware of bedwetting incidents, protecting children from potential embarrassment and peer teasing.`,
    );
  } else if (meets(peerAwarenessRate, 70) && totalDignityRecords > 0) {
    strengths.push(
      `${peerAwarenessRate}% peer privacy maintained — the home generally prevents other children from becoming aware of bedwetting incidents.`,
    );
  }

  if (meets(planReviewRate, 90) && totalManagementPlans > 0) {
    strengths.push(
      `${planReviewRate}% of management plans reviewed — the home actively monitors and adapts enuresis management approaches, ensuring plans remain current and effective.`,
    );
  } else if (meets(planReviewRate, 70) && totalManagementPlans > 0) {
    strengths.push(
      `${planReviewRate}% of management plans reviewed — the home generally reviews enuresis plans to assess effectiveness.`,
    );
  }

  if (meets(followUpCompletionRate, 90) && followUpRequired > 0) {
    strengths.push(
      `${followUpCompletionRate}% medical follow-up completion — all required follow-up appointments and actions are completed, demonstrating thorough health care oversight.`,
    );
  } else if (meets(followUpCompletionRate, 70) && followUpRequired > 0) {
    strengths.push(
      `${followUpCompletionRate}% medical follow-up completion — the home generally completes required follow-up actions from medical referrals.`,
    );
  }

  if (meets(childInvolvementRate, 90) && totalManagementPlans > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in care planning — children are actively consulted about their enuresis management, ensuring plans reflect their preferences and promote autonomy.`,
    );
  } else if (meets(childInvolvementRate, 70) && totalManagementPlans > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in care planning — most children are consulted about their management plans.`,
    );
  }

  if (meets(selfManagementRate, 80) && totalDignityRecords > 0) {
    strengths.push(
      `${selfManagementRate}% self-management skills teaching — the home actively builds children's independence by teaching them to manage aspects of their bedwetting themselves, promoting dignity and life skills.`,
    );
  }

  if (meets(overnightSupportRate, 80) && totalDignityRecords > 0) {
    strengths.push(
      `${overnightSupportRate}% overnight stay support — children who experience bedwetting are supported to participate in sleepovers and overnight activities, ensuring they are not excluded from normal childhood experiences.`,
    );
  }

  if (meets(copingStrategiesRate, 80) && totalEmotionalRecords > 0) {
    strengths.push(
      `${copingStrategiesRate}% of children have coping strategies in place — the home ensures children have practical and emotional tools to manage the impact of bedwetting on their daily lives.`,
    );
  }

  if (meets(adviceSharedRate, 90) && totalMedicalReferrals > 0) {
    strengths.push(
      `${adviceSharedRate}% professional advice shared with staff — medical guidance is consistently cascaded to the team, ensuring all staff provide consistent, evidence-based support.`,
    );
  }

  if (meets(staffTrainedRate, 90) && totalManagementPlans > 0) {
    strengths.push(
      `${staffTrainedRate}% staff trained on individual plans — all staff supporting children with enuresis understand and can implement each child's specific management plan.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(managementPlanRate, 50) && totalManagementPlans > 0) {
    concerns.push(
      `Only ${managementPlanRate}% management plan quality — enuresis management plans lack key elements: plans may not be active, reviewed, child-centred, or staff may not be trained. This means children's bedwetting is not being managed systematically.`,
    );
  } else if (below(managementPlanRate, 70) && meets(managementPlanRate, 50) && totalManagementPlans > 0) {
    concerns.push(
      `Management plan quality at ${managementPlanRate}% — some enuresis plans are missing key elements such as regular reviews, child involvement, or staff training, reducing their effectiveness.`,
    );
  }

  if (below(discreetSupportRate, 50) && totalDiscreetSupport > 0) {
    concerns.push(
      `Only ${discreetSupportRate}% discreet support quality — bedwetting support is frequently not handled discreetly, potentially exposing children to embarrassment and undermining their dignity. This is a serious safeguarding concern.`,
    );
  } else if (below(discreetSupportRate, 70) && meets(discreetSupportRate, 50) && totalDiscreetSupport > 0) {
    concerns.push(
      `Discreet support quality at ${discreetSupportRate}% — bedwetting support is not consistently handled with appropriate discretion, putting some children at risk of embarrassment.`,
    );
  }

  if (below(dignityPreservationRate, 50) && totalDignityRecords > 0) {
    concerns.push(
      `Only ${dignityPreservationRate}% dignity preservation — the home is failing to protect children's dignity around bedwetting across multiple domains including laundry, storage, language, and peer awareness. Children deserve to have their privacy absolutely protected in this sensitive area.`,
    );
  } else if (below(dignityPreservationRate, 70) && meets(dignityPreservationRate, 50) && totalDignityRecords > 0) {
    concerns.push(
      `Dignity preservation at ${dignityPreservationRate}% — some aspects of dignity protection around bedwetting are inconsistent, with gaps in privacy arrangements or staff practice.`,
    );
  }

  if (below(medicalReferralRate, 50) && totalMedicalReferrals > 0) {
    concerns.push(
      `Only ${medicalReferralRate}% medical referral quality — enuresis-related medical referrals are not being effectively managed: appointments may be missed, outcomes not documented, or professional advice not shared with staff. This undermines Reg 14 health care requirements.`,
    );
  } else if (below(medicalReferralRate, 65) && meets(medicalReferralRate, 50) && totalMedicalReferrals > 0) {
    concerns.push(
      `Medical referral quality at ${medicalReferralRate}% — some medical referrals for enuresis are not being fully followed through, with gaps in attendance, documentation, or information sharing.`,
    );
  }

  if (below(emotionalWellbeingRate, 50) && totalEmotionalRecords > 0) {
    concerns.push(
      `Only ${emotionalWellbeingRate}% emotional wellbeing support — children experiencing bedwetting are not feeling adequately supported emotionally, their voices are not being captured, and coping strategies are insufficient. The emotional impact of enuresis requires sensitive, proactive intervention.`,
    );
  } else if (below(emotionalWellbeingRate, 70) && meets(emotionalWellbeingRate, 50) && totalEmotionalRecords > 0) {
    concerns.push(
      `Emotional wellbeing support at ${emotionalWellbeingRate}% — some children's emotional needs around bedwetting are not being fully addressed, with gaps in voice capture, coping support, or confidence building.`,
    );
  }

  if (below(childConfidenceRate, 50) && totalEmotionalRecords > 0) {
    concerns.push(
      `Only ${childConfidenceRate}% child confidence in self-management — most children do not feel confident managing their bedwetting, suggesting the home needs to do more to empower children and build their independence around enuresis care.`,
    );
  } else if (below(childConfidenceRate, 70) && meets(childConfidenceRate, 50) && totalEmotionalRecords > 0) {
    concerns.push(
      `Child confidence at ${childConfidenceRate}% — a significant proportion of children lack confidence in managing their bedwetting, indicating more work is needed on skill-building and empowerment.`,
    );
  }

  if (above(significantImpactRate, 50) && totalEmotionalRecords > 0) {
    concerns.push(
      `${significantImpactRate}% of children experience significant or severe emotional impact from bedwetting — the high emotional burden on children indicates that current support strategies are not effectively mitigating the psychological effects of enuresis.`,
    );
  } else if (above(significantImpactRate, 30) && (significantImpactRate !== null && significantImpactRate <= 50) && totalEmotionalRecords > 0) {
    concerns.push(
      `${significantImpactRate}% of children experience significant or severe emotional impact — a notable proportion of children are suffering emotionally from their bedwetting, requiring more targeted intervention.`,
    );
  }

  if (above(embarrassmentRate, 50) && totalEmotionalRecords > 0) {
    concerns.push(
      `${embarrassmentRate}% of children feel embarrassed about bedwetting — more than half of children report feeling embarrassed, indicating that normalisation and dignity preservation approaches need strengthening.`,
    );
  } else if (above(embarrassmentRate, 30) && (embarrassmentRate !== null && embarrassmentRate <= 50) && totalEmotionalRecords > 0) {
    concerns.push(
      `${embarrassmentRate}% of children feel embarrassed about bedwetting — a notable proportion of children feel embarrassment, suggesting dignity preservation measures could be improved.`,
    );
  }

  if (below(noBlamingRate, 90) && totalDignityRecords > 0) {
    concerns.push(
      `No-blame approach at ${noBlamingRate}% — some children are being blamed or shamed about bedwetting, which is wholly unacceptable. Every child must be supported without any suggestion that bedwetting is their fault.`,
    );
  }

  if (above(bedtimeAnxietyRate, 40) && totalEmotionalRecords > 0) {
    concerns.push(
      `${bedtimeAnxietyRate}% of children experience anxiety around bedtime related to bedwetting — bedtime has become a source of stress rather than rest, which compounds the negative impact on children's overall wellbeing.`,
    );
  }

  if (above(avoidsSleepoverRate, 40) && totalEmotionalRecords > 0) {
    concerns.push(
      `${avoidsSleepoverRate}% of children avoid overnight activities due to bedwetting — children are self-excluding from normal childhood experiences, indicating the home needs to provide more proactive support for overnight stays.`,
    );
  }

  if (totalManagementPlans === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No enuresis management plans exist despite children being on placement — the home cannot evidence that children experiencing bedwetting have structured support in place.",
    );
  }

  if (totalDignityRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No dignity preservation assessments recorded — the home cannot evidence that children's dignity is being actively protected around bedwetting incidents.",
    );
  }

  if (totalMedicalReferrals === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No medical referrals for enuresis recorded — the home cannot evidence that appropriate medical guidance has been sought for children experiencing bedwetting, as required by Reg 14.",
    );
  }

  // below()/meets() are null-safe: unmeasured (no emotional-wellbeing records)
  // never fires a "self-esteem too low" concern without evidence.
  if (below(avgSelfEsteem, 2.5)) {
    concerns.push(
      `Average self-esteem rating at only ${avgSelfEsteem}/5 — children's self-esteem is significantly impacted by bedwetting, requiring urgent therapeutic support and confidence-building interventions.`,
    );
  } else if (below(avgSelfEsteem, 3.0) && meets(avgSelfEsteem, 2.5)) {
    concerns.push(
      `Average self-esteem rating at ${avgSelfEsteem}/5 — children's self-esteem around bedwetting is below acceptable levels and requires targeted intervention.`,
    );
  }

  if (above(peerImpactRate, 30) && totalEmotionalRecords > 0) {
    concerns.push(
      `${peerImpactRate}% of children report moderate or significant peer relationship impact from bedwetting — enuresis is affecting children's friendships and social connections, requiring active intervention.`,
    );
  }

  if (above(schoolImpactRate, 30) && totalEmotionalRecords > 0) {
    concerns.push(
      `${schoolImpactRate}% of children report moderate or significant school impact from bedwetting — enuresis is affecting children's education and school experience, which requires liaison with schools.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: BedwettingEnuresisRecommendation[] = [];
  let rank = 0;

  if (below(managementPlanRate, 50) && totalManagementPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and strengthen all enuresis management plans — ensure every plan is active, regularly reviewed, includes child involvement, documents triggers and night routines, and that all staff are trained on individual plans.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(discreetSupportRate, 50) && totalDiscreetSupport > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate staff training on discreet bedwetting support — every interaction must protect the child's privacy and dignity. Review laundry, bedding change, and morning routines to eliminate any risk of exposure to other children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Contact and dignity",
    });
  }

  if (below(dignityPreservationRate, 50) && totalDignityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently overhaul dignity preservation arrangements — establish private laundry systems, discreet storage, restricted room access during changes, and ensure all staff use sensitive, normalising language. No child should ever feel ashamed or exposed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Contact and dignity",
    });
  }

  if (below(noBlamingRate, 90) && totalDignityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address any instances of blaming or shaming around bedwetting immediately — provide whole-team training on the involuntary nature of enuresis and the absolute requirement to support children without blame. This is a non-negotiable standard of care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Contact and dignity",
    });
  }

  if (above(significantImpactRate, 50) && totalEmotionalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission specialist emotional support for children significantly impacted by bedwetting — when more than half of children experience significant or severe emotional impact, the home's current approach is insufficient and specialist therapeutic input is required.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalManagementPlans === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create individual enuresis management plans for every child who experiences bedwetting — plans should include triggers, night routines, fluid guidance, protective bedding, and clear staff responsibilities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalDignityRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement regular dignity preservation assessments for all children experiencing bedwetting — assess private laundry arrangements, discreet storage, peer awareness prevention, language sensitivity, and self-management skill development.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Contact and dignity",
    });
  }

  if (totalMedicalReferrals === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child experiencing persistent bedwetting has been referred for appropriate medical assessment — Reg 14 requires that children's health needs are addressed through professional medical input.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(medicalReferralRate, 50) && totalMedicalReferrals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve medical referral follow-through — ensure all referrals are accepted, appointments attended, outcomes documented, and professional advice shared with the full staff team to enable consistent, evidence-based care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(emotionalWellbeingRate, 50) && totalEmotionalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen emotional wellbeing support for children experiencing bedwetting — ensure every child feels supported, has their voice captured, has coping strategies in place, and is building confidence in self-management.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (below(childConfidenceRate, 50) && totalEmotionalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop structured confidence-building programmes for children with enuresis — teach self-management skills, normalise the experience, and empower children to feel in control of their own care.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (below(followUpCompletionRate, 50) && followUpRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a medical follow-up tracker for enuresis referrals — ensure all follow-up appointments are booked, attended, and outcomes documented to maintain continuity of care.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(planReviewRate, 50) && totalManagementPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular review schedule for all enuresis management plans — unreviewed plans cannot be evidenced as effective and may not reflect children's current needs or progress.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(childInvolvementRate, 50) && totalManagementPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children more actively in their enuresis management planning — ask children about their experiences, preferences, and what helps them feel supported. Plans created without the child's input cannot be truly child-centred.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    meets(managementPlanRate, 50) &&
    below(managementPlanRate, 70) &&
    totalManagementPlans > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve management plan quality to at least 70% — ensure all plans include child involvement, regular reviews, documented triggers, and staff training to provide comprehensive enuresis support.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    meets(discreetSupportRate, 50) &&
    below(discreetSupportRate, 70) &&
    totalDiscreetSupport > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance discreet support practices to achieve consistent privacy protection — review and improve timing, storage arrangements, and staff approaches to bedwetting support to ensure every interaction fully protects the child's dignity.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Contact and dignity",
    });
  }

  if (
    meets(dignityPreservationRate, 50) &&
    below(dignityPreservationRate, 70) &&
    totalDignityRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen dignity preservation measures — address specific gaps in private laundry, discreet storage, peer awareness prevention, or self-management skill teaching to ensure comprehensive dignity protection.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Contact and dignity",
    });
  }

  if (
    meets(emotionalWellbeingRate, 50) &&
    below(emotionalWellbeingRate, 70) &&
    totalEmotionalRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance emotional wellbeing support through more consistent voice capture, coping strategy development, and confidence building — aim for every child to feel fully supported in managing the emotional aspects of enuresis.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (above(avoidsSleepoverRate, 30) && totalEmotionalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create proactive plans to support children's participation in overnight activities — provide portable protective products, discreet support arrangements, and confidence-building to prevent self-exclusion from normal childhood experiences.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (
    meets(medicalReferralRate, 50) &&
    below(medicalReferralRate, 65) &&
    totalMedicalReferrals > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve medical referral pathway management — ensure all appointments are attended, outcomes documented, treatment plans implemented, and professional advice shared consistently with the staff team.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    meets(childConfidenceRate, 50) &&
    below(childConfidenceRate, 70) &&
    totalEmotionalRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Continue building children's confidence through age-appropriate self-management training, positive reinforcement, and normalisation of the enuresis experience to enable greater independence.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (below(selfManagementRate, 60) && totalDignityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop self-management skills programmes for children — teach children age-appropriate ways to manage bedding changes, laundry, and protective products independently, building confidence and autonomy.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Health and wellbeing",
    });
  }

  if (above(peerImpactRate, 30) && totalEmotionalRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the peer relationship impact of bedwetting through targeted social skills work, enhanced privacy measures, and where appropriate, anti-bullying interventions to protect affected children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Contact and dignity",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: BedwettingEnuresisInsight[] = [];

  // -- Critical insights --

  if (below(managementPlanRate, 50) && totalManagementPlans > 0) {
    insights.push({
      text: `Only ${managementPlanRate}% management plan quality. Ofsted expects children's health needs, including enuresis, to be managed through structured, reviewed, and child-centred plans. Poor plan quality means children's bedwetting is not being addressed systematically, undermining Reg 14 compliance.`,
      severity: "critical",
    });
  }

  if (below(discreetSupportRate, 50) && totalDiscreetSupport > 0) {
    insights.push({
      text: `Only ${discreetSupportRate}% discreet support quality. Bedwetting is an intensely personal and sensitive issue for children in care. When support is not handled discreetly, children are exposed to potential humiliation, peer teasing, and lasting psychological harm. This represents a failure of basic dignity preservation.`,
      severity: "critical",
    });
  }

  if (below(dignityPreservationRate, 50) && totalDignityRecords > 0) {
    insights.push({
      text: `Only ${dignityPreservationRate}% dignity preservation. Children who experience bedwetting are among the most vulnerable to loss of dignity in residential care. Multiple failings across laundry, storage, language, and peer awareness indicate systemic shortcomings that require urgent whole-home action.`,
      severity: "critical",
    });
  }

  if (below(noBlamingRate, 90) && totalDignityRecords > 0) {
    insights.push({
      text: `No-blame approach at only ${noBlamingRate}%. Any instance of blaming or shaming a child for bedwetting is unacceptable. Enuresis is involuntary and often linked to trauma, developmental factors, or medical conditions. Staff must understand that blame compounds children's distress and damages the care relationship.`,
      severity: "critical",
    });
  }

  if (above(significantImpactRate, 50) && totalEmotionalRecords > 0) {
    insights.push({
      text: `${significantImpactRate}% of children experience significant or severe emotional impact from bedwetting. The emotional toll of enuresis in looked-after children — who already carry the burden of adverse childhood experiences — can be profound. Chronic distress, low self-esteem, and social withdrawal require specialist therapeutic intervention.`,
      severity: "critical",
    });
  }

  if (totalManagementPlans === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No enuresis management plans exist despite children being on placement. Without structured plans, the home cannot evidence that bedwetting is being managed proactively, that triggers are understood, or that individualised night routines are in place. This is a fundamental gap in health care provision.",
      severity: "critical",
    });
  }

  if (totalMedicalReferrals === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No medical referrals for enuresis recorded. Reg 14 requires that children's health needs are met through appropriate professional input. Persistent bedwetting may have medical causes that require investigation and treatment — the absence of any referrals means the home cannot evidence that medical advice has been sought.",
      severity: "critical",
    });
  }

  if (below(medicalReferralRate, 50) && totalMedicalReferrals > 0) {
    insights.push({
      text: `Only ${medicalReferralRate}% medical referral quality. When medical referrals are not properly followed through — missed appointments, undocumented outcomes, professional advice not shared with staff — children miss out on medical treatment that could resolve or improve their enuresis.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(managementPlanRate, 50) &&
    below(managementPlanRate, 70) &&
    totalManagementPlans > 0
  ) {
    insights.push({
      text: `Management plan quality at ${managementPlanRate}% — improving but inconsistent. Some plans may lack child involvement, regular reviews, or documented triggers. Strengthening these elements will ensure a more systematic approach to enuresis management across the home.`,
      severity: "warning",
    });
  }

  if (
    meets(discreetSupportRate, 50) &&
    below(discreetSupportRate, 70) &&
    totalDiscreetSupport > 0
  ) {
    insights.push({
      text: `Discreet support quality at ${discreetSupportRate}% — some interactions are not fully discreet. Even occasional lapses in discretion can have a significant impact on a child's sense of safety and dignity. Consistency is essential.`,
      severity: "warning",
    });
  }

  if (
    meets(dignityPreservationRate, 50) &&
    below(dignityPreservationRate, 70) &&
    totalDignityRecords > 0
  ) {
    insights.push({
      text: `Dignity preservation at ${dignityPreservationRate}% — some aspects of dignity protection are inconsistent. Review specific domains (laundry, storage, language, empowerment) to identify where gaps exist and target improvements.`,
      severity: "warning",
    });
  }

  if (
    meets(childConfidenceRate, 50) &&
    below(childConfidenceRate, 70) &&
    totalEmotionalRecords > 0
  ) {
    insights.push({
      text: `Child confidence in self-management at ${childConfidenceRate}% — some children lack confidence in managing their bedwetting. Building independence through age-appropriate skill teaching and positive reinforcement can significantly improve children's sense of control.`,
      severity: "warning",
    });
  }

  if (
    meets(emotionalWellbeingRate, 50) &&
    below(emotionalWellbeingRate, 70) &&
    totalEmotionalRecords > 0
  ) {
    insights.push({
      text: `Emotional wellbeing support at ${emotionalWellbeingRate}% — some children's emotional needs around bedwetting are not fully met. Gaps in voice capture, coping strategies, or feelings of being supported weaken the home's ability to mitigate the psychological impact of enuresis.`,
      severity: "warning",
    });
  }

  if (
    above(embarrassmentRate, 30) &&
    (embarrassmentRate !== null && embarrassmentRate <= 50) &&
    totalEmotionalRecords > 0
  ) {
    insights.push({
      text: `${embarrassmentRate}% of children feel embarrassed about bedwetting — normalisation approaches and dignity preservation may need strengthening to reduce feelings of shame and difference among affected children.`,
      severity: "warning",
    });
  }

  if (
    above(bedtimeAnxietyRate, 20) &&
    (bedtimeAnxietyRate !== null && bedtimeAnxietyRate <= 40) &&
    totalEmotionalRecords > 0
  ) {
    insights.push({
      text: `${bedtimeAnxietyRate}% of children experience bedtime anxiety related to bedwetting — the fear of wetting the bed is creating stress around what should be a calm, supportive time. Therapeutic approaches may help address this anticipatory anxiety.`,
      severity: "warning",
    });
  }

  if (
    above(avoidsSleepoverRate, 20) &&
    (avoidsSleepoverRate !== null && avoidsSleepoverRate <= 40) &&
    totalEmotionalRecords > 0
  ) {
    insights.push({
      text: `${avoidsSleepoverRate}% of children avoid overnight activities due to bedwetting — children are missing out on normal childhood experiences. The home should proactively plan how to support participation with discreet arrangements.`,
      severity: "warning",
    });
  }

  if (
    meets(planReviewRate, 50) &&
    below(planReviewRate, 70) &&
    totalManagementPlans > 0
  ) {
    insights.push({
      text: `Plan review rate at ${planReviewRate}% — not all enuresis management plans are being regularly reviewed. Without consistent review, plans may drift from children's current needs and progress cannot be properly tracked.`,
      severity: "warning",
    });
  }

  if (
    meets(followUpCompletionRate, 50) &&
    below(followUpCompletionRate, 70) &&
    followUpRequired > 0
  ) {
    insights.push({
      text: `Medical follow-up completion at ${followUpCompletionRate}% — some required follow-up actions from enuresis referrals are not being completed, which may result in gaps in treatment or missed opportunities for medical improvement.`,
      severity: "warning",
    });
  }

  if (declinedProgress > 0 && assessmentsWithProgress > 0) {
    const declinedRate = pct(declinedProgress, assessmentsWithProgress);
    if (above(declinedRate, 20)) {
      insights.push({
        text: `${declinedRate}% of emotional wellbeing assessments show declining progress — some children's emotional state around bedwetting is worsening, which requires immediate review of support strategies and possible therapeutic referral.`,
        severity: "warning",
      });
    }
  }

  // Incident frequency analysis
  const frequencyDistribution: Record<string, number> = {};
  for (const p of management_plan_records) {
    frequencyDistribution[p.incident_frequency] = (frequencyDistribution[p.incident_frequency] ?? 0) + 1;
  }
  const highFrequency = (frequencyDistribution["nightly"] ?? 0) + (frequencyDistribution["several_per_week"] ?? 0);
  if (highFrequency > 0 && totalManagementPlans > 0) {
    const highFreqRate = pct(highFrequency, totalManagementPlans);
    if (above(highFreqRate, 30)) {
      insights.push({
        text: `${highFreqRate}% of children experience bedwetting nightly or several times per week — high-frequency enuresis often indicates underlying medical, developmental, or emotional factors that require specialist assessment and targeted intervention beyond standard management plans.`,
        severity: "warning",
      });
    }
  }

  // Referral type analysis
  const referralTypes: Record<string, number> = {};
  for (const r of medical_referral_records) {
    referralTypes[r.referral_type] = (referralTypes[r.referral_type] ?? 0) + 1;
  }
  const topReferralTypes = Object.entries(referralTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topReferralTypes.length > 0) {
    const formatted = topReferralTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Medical referral pathway distribution: ${formatted}. Understanding which services children are being referred to helps the home assess whether the right professional input is being accessed and whether gaps exist in the referral pathway.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (enuresis_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding bedwetting and enuresis support — management plans are comprehensive and reviewed, support is consistently discreet, children's dignity is protected across all domains, medical referrals are effectively managed, and children feel emotionally supported and confident. This is strong evidence for Reg 5 dignity and Reg 14 health care compliance.",
      severity: "positive",
    });
  }

  if (
    meets(managementPlanRate, 90) &&
    meets(staffTrainedRate, 90) &&
    totalManagementPlans > 0
  ) {
    insights.push({
      text: `${managementPlanRate}% plan quality with ${staffTrainedRate}% staff training — the combination of high-quality plans and thorough staff training ensures that every team member can provide consistent, informed support to children experiencing bedwetting.`,
      severity: "positive",
    });
  }

  if (
    meets(discreetSupportRate, 90) &&
    meets(dignityPreservationRate, 90) &&
    totalDiscreetSupport > 0 &&
    totalDignityRecords > 0
  ) {
    insights.push({
      text: `${discreetSupportRate}% discreet support with ${dignityPreservationRate}% dignity preservation — the home provides an exemplary standard of privacy and dignity protection for children experiencing bedwetting. Children's personal experiences are handled with consistent sensitivity and respect.`,
      severity: "positive",
    });
  }

  if (
    meets(noBlamingRate, 95) &&
    meets(peerAwarenessRate, 90) &&
    totalDignityRecords > 0
  ) {
    insights.push({
      text: `${noBlamingRate}% no-blame approach with ${peerAwarenessRate}% peer privacy — the home creates a genuinely safe environment where children are never blamed for bedwetting and their privacy is consistently protected from peers. This is foundational to children's emotional safety.`,
      severity: "positive",
    });
  }

  if (
    meets(medicalReferralRate, 85) &&
    meets(followUpCompletionRate, 90) &&
    totalMedicalReferrals > 0
  ) {
    insights.push({
      text: `${medicalReferralRate}% referral quality with ${followUpCompletionRate}% follow-up completion — the home demonstrates excellent health care coordination for enuresis, ensuring children receive consistent medical input and professional advice is acted upon. This is strong Reg 14 compliance.`,
      severity: "positive",
    });
  }

  if (
    meets(emotionalWellbeingRate, 90) &&
    meets(childConfidenceRate, 90) &&
    totalEmotionalRecords > 0
  ) {
    insights.push({
      text: `${emotionalWellbeingRate}% emotional wellbeing with ${childConfidenceRate}% child confidence — children feel supported, have effective coping strategies, and are confident in managing their bedwetting. This demonstrates that the home's approach is successfully mitigating the emotional impact of enuresis.`,
      severity: "positive",
    });
  }

  if (
    meets(childInvolvementRate, 90) &&
    totalManagementPlans > 0
  ) {
    insights.push({
      text: `${childInvolvementRate}% child involvement in care planning — children's voices genuinely shape their enuresis management plans. This child-centred approach ensures interventions are meaningful, respectful of individual preferences, and more likely to be effective.`,
      severity: "positive",
    });
  }

  if (
    meets(overnightSupportRate, 80) &&
    totalDignityRecords > 0
  ) {
    insights.push({
      text: `${overnightSupportRate}% overnight stay support — the home actively enables children to participate in sleepovers and overnight activities despite bedwetting, ensuring they are not excluded from formative childhood experiences. This promotes normalisation and social inclusion.`,
      severity: "positive",
    });
  }

  if (
    meets(copingStrategiesRate, 90) &&
    meets(copingEffectivenessRate, 80) &&
    totalEmotionalRecords > 0
  ) {
    insights.push({
      text: `${copingStrategiesRate}% coping strategies in place with ${copingEffectivenessRate}% effectiveness — children have practical and emotional tools to manage the impact of bedwetting, and these strategies are demonstrably working to reduce distress and build resilience.`,
      severity: "positive",
    });
  }

  // meets() is null-safe: no plans ⇒ no "strong progress" insight fires.
  if (meets(avgProgressRating, 4.0)) {
    insights.push({
      text: `Average progress rating of ${avgProgressRating}/5 — children are making strong progress under their enuresis management plans. The home's approach is evidencing positive outcomes and continuous improvement in managing bedwetting.`,
      severity: "positive",
    });
  }

  if (
    meets(feelsSupportedRate, 90) &&
    meets(childVoiceRate, 90) &&
    totalEmotionalRecords > 0
  ) {
    insights.push({
      text: `${feelsSupportedRate}% of children feel supported with ${childVoiceRate}% voice capture — children experiencing bedwetting feel listened to and cared for. Their views and feelings are consistently recorded, demonstrating that the home values and responds to the voice of the child around this sensitive issue.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (enuresis_rating === "outstanding") {
    headline =
      "Outstanding bedwetting and enuresis support — management plans are comprehensive, support is consistently discreet, dignity is fully preserved, and children feel emotionally supported and confident.";
  } else if (enuresis_rating === "good") {
    headline = `Good bedwetting and enuresis support — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (enuresis_rating === "adequate") {
    headline = `Adequate bedwetting and enuresis support — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children experiencing bedwetting are fully supported with dignity and appropriate care.`;
  } else {
    headline = `Bedwetting and enuresis support is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's dignity, health, and emotional wellbeing are protected.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    enuresis_rating,
    enuresis_score: score,
    headline,
    total_management_plans: totalManagementPlans,
    total_support_interactions: totalSupportInteractions,
    management_plan_rate: managementPlanRate,
    discreet_support_rate: discreetSupportRate,
    dignity_preservation_rate: dignityPreservationRate,
    medical_referral_rate: medicalReferralRate,
    emotional_wellbeing_rate: emotionalWellbeingRate,
    child_confidence_rate: childConfidenceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
