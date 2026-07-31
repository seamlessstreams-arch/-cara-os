// ==============================================================================
// CARA -- HOME CONTINENCE & PERSONAL HYGIENE SUPPORT INTELLIGENCE ENGINE
// Monitors continence and hygiene support quality -- continence management plans,
// personal hygiene routine support, dignity in care, age-appropriate guidance,
// and product provision.
// Measures continence plan compliance, hygiene routine quality, dignity in care,
// age-appropriate guidance, product provision, and child independence.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging with local community), Reg 14 (Health care).
// SCCIF: "Experiences and progress of children and young people".
// Store keys: continencePlanRecords, hygieneRoutineRecords, dignityCareRecords,
//             ageGuidanceRecords, productProvisionRecords
// ==============================================================================

import { above, below, meets } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface ContinencePlanRecordInput {
  id: string;
  child_id: string;
  plan_created_date: string;
  plan_review_date: string | null;
  plan_reviewed_on_time: boolean;
  condition_type: "enuresis_nocturnal" | "enuresis_diurnal" | "encopresis" | "functional" | "medical" | "stress" | "mixed" | "other";
  plan_in_place: boolean;
  plan_personalised: boolean;
  goals_set: boolean;
  goals_reviewed: boolean;
  goals_progressing: boolean;
  medical_advice_sought: boolean;
  medical_professional_involved: boolean;
  gp_referral_made: boolean;
  specialist_referral_made: boolean;
  night_management_plan: boolean;
  daytime_management_plan: boolean;
  school_plan_shared: boolean;
  triggers_identified: boolean;
  fluid_intake_monitored: boolean;
  diet_reviewed: boolean;
  toileting_schedule_in_place: boolean;
  reward_system_used: boolean;
  child_involved_in_planning: boolean;
  parent_carer_informed: boolean;
  social_worker_informed: boolean;
  confidentiality_maintained: boolean;
  staff_aware_of_plan: boolean;
  staff_trained: boolean;
  records_kept_securely: boolean;
  progress_notes_up_to_date: boolean;
  notes: string;
  created_at: string;
}

export interface HygieneRoutineRecordInput {
  id: string;
  child_id: string;
  date: string;
  routine_type: "morning" | "evening" | "bathing" | "dental" | "handwashing" | "hair_care" | "skin_care" | "nail_care" | "laundry" | "other";
  routine_supported: boolean;
  routine_completed: boolean;
  child_independent: boolean;
  child_prompted: boolean;
  child_assisted: boolean;
  child_refused: boolean;
  refusal_handled_sensitively: boolean;
  age_appropriate_approach: boolean;
  dignity_maintained: boolean;
  products_available: boolean;
  products_suitable: boolean;
  cultural_needs_met: boolean;
  sensory_needs_considered: boolean;
  same_gender_support_offered: boolean;
  privacy_respected: boolean;
  child_choice_respected: boolean;
  routine_personalised: boolean;
  encouragement_given: boolean;
  notes: string;
  created_at: string;
}

export interface DignityCareRecordInput {
  id: string;
  child_id: string;
  date: string;
  context: "continence_support" | "bathing" | "personal_care" | "medical" | "changing" | "night_care" | "school_incident" | "accident" | "other";
  dignity_maintained: boolean;
  privacy_ensured: boolean;
  consent_sought: boolean;
  child_views_respected: boolean;
  minimal_staff_involved: boolean;
  same_gender_carer_offered: boolean;
  same_gender_carer_provided: boolean;
  discrete_approach_used: boolean;
  child_embarrassment_minimised: boolean;
  peer_awareness_managed: boolean;
  clean_clothes_provided_promptly: boolean;
  bedding_changed_promptly: boolean;
  no_shaming_language: boolean;
  positive_reassurance_given: boolean;
  incident_recorded_sensitively: boolean;
  child_debriefed: boolean;
  emotional_support_offered: boolean;
  staff_followed_protocol: boolean;
  notes: string;
  created_at: string;
}

export interface AgeGuidanceRecordInput {
  id: string;
  child_id: string;
  date: string;
  guidance_type: "puberty_education" | "hygiene_education" | "continence_education" | "skin_care_guidance" | "menstrual_health" | "body_awareness" | "self_care_skills" | "product_selection" | "independence_building" | "other";
  age_appropriate: boolean;
  development_appropriate: boolean;
  delivered_sensitively: boolean;
  child_engaged: boolean;
  child_understood: boolean;
  visual_aids_used: boolean;
  materials_provided: boolean;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  delivered_by: "keyworker" | "staff" | "health_professional" | "school_nurse" | "specialist" | "other";
  child_questions_encouraged: boolean;
  child_feedback_positive: boolean;
  parent_carer_consulted: boolean;
  cultural_sensitivity_shown: boolean;
  linked_to_care_plan: boolean;
  notes: string;
  created_at: string;
}

export interface ProductProvisionRecordInput {
  id: string;
  child_id: string;
  date: string;
  product_category: "continence_pads" | "pull_ups" | "bed_protection" | "toiletries" | "sanitary_products" | "skin_care" | "dental" | "hair_care" | "deodorant" | "specialist" | "other";
  product_available: boolean;
  product_suitable: boolean;
  product_preferred_by_child: boolean;
  sufficient_quantity: boolean;
  stored_discreetly: boolean;
  easy_access_for_child: boolean;
  brand_choice_offered: boolean;
  cultural_needs_met: boolean;
  sensory_needs_met: boolean;
  replenished_on_time: boolean;
  budget_adequate: boolean;
  child_consulted_on_choice: boolean;
  age_appropriate: boolean;
  medical_recommendation_followed: boolean;
  quality_acceptable: boolean;
  child_dignity_preserved: boolean;
  staff_aware_of_needs: boolean;
  notes: string;
  created_at: string;
}

export interface ContinenceHygieneInput {
  today: string;
  total_children: number;
  continence_plan_records: ContinencePlanRecordInput[];
  hygiene_routine_records: HygieneRoutineRecordInput[];
  dignity_care_records: DignityCareRecordInput[];
  age_guidance_records: AgeGuidanceRecordInput[];
  product_provision_records: ProductProvisionRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type ContinenceHygieneRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ContinenceHygieneInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ContinenceHygieneRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ContinenceHygieneResult {
  hygiene_rating: ContinenceHygieneRating;
  hygiene_score: number;
  headline: string;
  total_continence_plans: number;
  total_hygiene_routines: number;
  total_dignity_care_records: number;
  total_age_guidance_records: number;
  total_product_provision_records: number;
  // child_independence_rate uses pct() directly (deterministic 0 on empty).
  // The 5 composite rates below are null on empty: no source records ⇒ no
  // signal. "0% continence plans / 0% hygiene routines / 0% dignity /
  // 0% age-appropriate / 0% product provision" would read as a home
  // actively neglecting personal care, not "unmeasured". Fab-0 doctrine.
  continence_plan_rate: number | null;
  hygiene_routine_rate: number | null;
  dignity_compliance_rate: number | null;
  age_appropriate_rate: number | null;
  product_provision_rate: number | null;
  child_independence_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: ContinenceHygieneRecommendation[];
  insights: ContinenceHygieneInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ContinenceHygieneRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: ContinenceHygieneRating,
  score: number,
  headline: string,
): ContinenceHygieneResult {
  return {
    hygiene_rating: rating,
    hygiene_score: score,
    headline,
    total_continence_plans: 0,
    total_hygiene_routines: 0,
    total_dignity_care_records: 0,
    total_age_guidance_records: 0,
    total_product_provision_records: 0,
    continence_plan_rate: null,
    hygiene_routine_rate: null,
    dignity_compliance_rate: null,
    age_appropriate_rate: null,
    product_provision_rate: null,
    child_independence_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeContinencePersonalHygieneSupport(
  input: ContinenceHygieneInput,
): ContinenceHygieneResult {
  const {
    total_children,
    continence_plan_records,
    hygiene_routine_records,
    dignity_care_records,
    age_guidance_records,
    product_provision_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    continence_plan_records.length === 0 &&
    hygiene_routine_records.length === 0 &&
    dignity_care_records.length === 0 &&
    age_guidance_records.length === 0 &&
    product_provision_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess continence and personal hygiene support.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No continence or personal hygiene support data recorded despite children on placement -- continence management and hygiene support require urgent attention.",
      ),
      concerns: [
        "No continence plan records, hygiene routine records, dignity care records, age-appropriate guidance records, or product provision records exist despite children being on placement -- the home cannot evidence appropriate continence management or personal hygiene support.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of continence management plans, personal hygiene routines, dignity in care practices, age-appropriate guidance, and product provision to evidence the home's support for children's continence and hygiene needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 -- Health care",
        },
        {
          rank: 2,
          recommendation:
            "Develop individualised continence management and hygiene support plans for each child, ensuring dignity, privacy, and age-appropriate care are embedded in daily practice.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the local community; SCCIF Experiences and progress",
        },
      ],
      insights: [
        {
          text: "The complete absence of continence and personal hygiene support records means the home cannot demonstrate that children's continence needs are managed with dignity, that hygiene routines are supported appropriately, or that age-appropriate guidance is provided. This represents a significant gap in health care provision under Regulation 14.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Continence plan metrics ---
  const totalContinencePlans = continence_plan_records.length;
  const plansInPlace = continence_plan_records.filter((p) => p.plan_in_place).length;
  const planInPlaceRate = pct(plansInPlace, totalContinencePlans);

  const plansPersonalised = continence_plan_records.filter((p) => p.plan_in_place && p.plan_personalised).length;
  const planPersonalisedRate = pct(plansPersonalised, totalContinencePlans);

  const plansReviewedOnTime = continence_plan_records.filter((p) => p.plan_reviewed_on_time).length;
  const planReviewRate = pct(plansReviewedOnTime, totalContinencePlans);

  const goalsSet = continence_plan_records.filter((p) => p.goals_set).length;
  const goalsSetRate = pct(goalsSet, totalContinencePlans);

  const goalsProgressing = continence_plan_records.filter((p) => p.goals_set && p.goals_progressing).length;
  const goalsProgressRate = pct(goalsProgressing, totalContinencePlans);

  const medicalInvolved = continence_plan_records.filter((p) => p.medical_professional_involved).length;
  const medicalInvolvementRate = pct(medicalInvolved, totalContinencePlans);

  const childInvolvedPlanning = continence_plan_records.filter((p) => p.child_involved_in_planning).length;
  const childInvolvedPlanningRate = pct(childInvolvedPlanning, totalContinencePlans);

  const staffTrained = continence_plan_records.filter((p) => p.staff_trained).length;
  const staffTrainedRate = pct(staffTrained, totalContinencePlans);

  const staffAware = continence_plan_records.filter((p) => p.staff_aware_of_plan).length;
  const staffAwareRate = pct(staffAware, totalContinencePlans);

  const confidentialityMaintained = continence_plan_records.filter((p) => p.confidentiality_maintained).length;
  const confidentialityRate = pct(confidentialityMaintained, totalContinencePlans);

  const progressNotesUpToDate = continence_plan_records.filter((p) => p.progress_notes_up_to_date).length;
  const progressNotesRate = pct(progressNotesUpToDate, totalContinencePlans);

  const recordsKeptSecurely = continence_plan_records.filter((p) => p.records_kept_securely).length;
  const secureRecordRate = pct(recordsKeptSecurely, totalContinencePlans);

  const triggersIdentified = continence_plan_records.filter((p) => p.triggers_identified).length;
  const triggersRate = pct(triggersIdentified, totalContinencePlans);

  const toiletingSchedules = continence_plan_records.filter((p) => p.toileting_schedule_in_place).length;
  const toiletingScheduleRate = pct(toiletingSchedules, totalContinencePlans);

  const schoolPlanShared = continence_plan_records.filter((p) => p.school_plan_shared).length;
  const schoolPlanRate = pct(schoolPlanShared, totalContinencePlans);

  const parentInformed = continence_plan_records.filter((p) => p.parent_carer_informed).length;
  const parentInformedRate = pct(parentInformed, totalContinencePlans);

  const socialWorkerInformed = continence_plan_records.filter((p) => p.social_worker_informed).length;
  const socialWorkerInformedRate = pct(socialWorkerInformed, totalContinencePlans);

  // Composite continence_plan_rate: average of planInPlace, personalised, reviewedOnTime, goals
  const continencePlanRate: number | null =
    totalContinencePlans > 0
      ? Math.round((planInPlaceRate + planPersonalisedRate + planReviewRate + goalsSetRate) / 4)
      : null;

  // --- Hygiene routine metrics ---
  const totalHygieneRoutines = hygiene_routine_records.length;
  const routinesSupported = hygiene_routine_records.filter((r) => r.routine_supported).length;
  const routineSupportRate = pct(routinesSupported, totalHygieneRoutines);

  const routinesCompleted = hygiene_routine_records.filter((r) => r.routine_completed).length;
  const routineCompletionRate = pct(routinesCompleted, totalHygieneRoutines);

  const routinesIndependent = hygiene_routine_records.filter((r) => r.child_independent).length;
  const independenceRate = pct(routinesIndependent, totalHygieneRoutines);

  const routinesPersonalised = hygiene_routine_records.filter((r) => r.routine_personalised).length;
  const routinePersonalisedRate = pct(routinesPersonalised, totalHygieneRoutines);

  const dignityInRoutines = hygiene_routine_records.filter((r) => r.dignity_maintained).length;
  const routineDignityRate = pct(dignityInRoutines, totalHygieneRoutines);

  const privacyInRoutines = hygiene_routine_records.filter((r) => r.privacy_respected).length;
  const routinePrivacyRate = pct(privacyInRoutines, totalHygieneRoutines);

  const culturalNeedsMet = hygiene_routine_records.filter((r) => r.cultural_needs_met).length;
  const culturalNeedsRate = pct(culturalNeedsMet, totalHygieneRoutines);

  const sensoryConsidered = hygiene_routine_records.filter((r) => r.sensory_needs_considered).length;
  const sensoryRate = pct(sensoryConsidered, totalHygieneRoutines);

  const childChoiceRespected = hygiene_routine_records.filter((r) => r.child_choice_respected).length;
  const childChoiceRate = pct(childChoiceRespected, totalHygieneRoutines);

  const productsAvailable = hygiene_routine_records.filter((r) => r.products_available).length;
  const productsAvailableRate = pct(productsAvailable, totalHygieneRoutines);

  const productsSuitable = hygiene_routine_records.filter((r) => r.products_suitable).length;
  const productsSuitableRate = pct(productsSuitable, totalHygieneRoutines);

  const sameGenderOffered = hygiene_routine_records.filter((r) => r.same_gender_support_offered).length;
  const sameGenderRate = pct(sameGenderOffered, totalHygieneRoutines);

  const encouragementGiven = hygiene_routine_records.filter((r) => r.encouragement_given).length;
  const encouragementRate = pct(encouragementGiven, totalHygieneRoutines);

  const ageAppropriateRoutine = hygiene_routine_records.filter((r) => r.age_appropriate_approach).length;
  const ageAppropriateRoutineRate = pct(ageAppropriateRoutine, totalHygieneRoutines);

  const routinesRefused = hygiene_routine_records.filter((r) => r.child_refused).length;
  const refusalRate = pct(routinesRefused, totalHygieneRoutines);

  const refusalsHandledSensitively = hygiene_routine_records.filter((r) => r.child_refused && r.refusal_handled_sensitively).length;
  const refusalHandlingRate = routinesRefused > 0 ? pct(refusalsHandledSensitively, routinesRefused) : 100;

  // Composite hygiene_routine_rate
  const hygieneRoutineRate: number | null =
    totalHygieneRoutines > 0
      ? Math.round(
          (routineSupportRate + routineCompletionRate + routineDignityRate + routinePrivacyRate + ageAppropriateRoutineRate) / 5,
        )
      : null;

  // --- Dignity care metrics ---
  const totalDignityCareRecords = dignity_care_records.length;
  const dignityMaintained = dignity_care_records.filter((d) => d.dignity_maintained).length;
  const dignityMaintainedRate = pct(dignityMaintained, totalDignityCareRecords);

  const privacyEnsured = dignity_care_records.filter((d) => d.privacy_ensured).length;
  const privacyEnsuredRate = pct(privacyEnsured, totalDignityCareRecords);

  const consentSought = dignity_care_records.filter((d) => d.consent_sought).length;
  const consentRate = pct(consentSought, totalDignityCareRecords);

  const childViewsRespected = dignity_care_records.filter((d) => d.child_views_respected).length;
  const childViewsRate = pct(childViewsRespected, totalDignityCareRecords);

  const discreteApproach = dignity_care_records.filter((d) => d.discrete_approach_used).length;
  const discreteApproachRate = pct(discreteApproach, totalDignityCareRecords);

  const embarrassmentMinimised = dignity_care_records.filter((d) => d.child_embarrassment_minimised).length;
  const embarrassmentMinimisedRate = pct(embarrassmentMinimised, totalDignityCareRecords);

  const noShamingLanguage = dignity_care_records.filter((d) => d.no_shaming_language).length;
  const noShamingRate = pct(noShamingLanguage, totalDignityCareRecords);

  const positiveReassurance = dignity_care_records.filter((d) => d.positive_reassurance_given).length;
  const reassuranceRate = pct(positiveReassurance, totalDignityCareRecords);

  const cleanClothesPromptly = dignity_care_records.filter((d) => d.clean_clothes_provided_promptly).length;
  const cleanClothesRate = pct(cleanClothesPromptly, totalDignityCareRecords);

  const beddingChangedPromptly = dignity_care_records.filter((d) => d.bedding_changed_promptly).length;
  const beddingChangedRate = pct(beddingChangedPromptly, totalDignityCareRecords);

  const peerAwarenessManaged = dignity_care_records.filter((d) => d.peer_awareness_managed).length;
  const peerAwarenessRate = pct(peerAwarenessManaged, totalDignityCareRecords);

  const emotionalSupportOffered = dignity_care_records.filter((d) => d.emotional_support_offered).length;
  const emotionalSupportRate = pct(emotionalSupportOffered, totalDignityCareRecords);

  const staffFollowedProtocol = dignity_care_records.filter((d) => d.staff_followed_protocol).length;
  const protocolFollowedRate = pct(staffFollowedProtocol, totalDignityCareRecords);

  const incidentRecordedSensitively = dignity_care_records.filter((d) => d.incident_recorded_sensitively).length;
  const sensitiveRecordingRate = pct(incidentRecordedSensitively, totalDignityCareRecords);

  const childDebriefed = dignity_care_records.filter((d) => d.child_debriefed).length;
  const childDebriefRate = pct(childDebriefed, totalDignityCareRecords);

  const sameGenderDignityOffered = dignity_care_records.filter((d) => d.same_gender_carer_offered).length;
  const sameGenderDignityRate = pct(sameGenderDignityOffered, totalDignityCareRecords);

  const sameGenderDignityProvided = dignity_care_records.filter((d) => d.same_gender_carer_provided).length;
  const sameGenderProvidedRate = pct(sameGenderDignityProvided, totalDignityCareRecords);

  const minimalStaffInvolved = dignity_care_records.filter((d) => d.minimal_staff_involved).length;
  const minimalStaffRate = pct(minimalStaffInvolved, totalDignityCareRecords);

  // Composite dignity_compliance_rate
  const dignityComplianceRate: number | null =
    totalDignityCareRecords > 0
      ? Math.round(
          (dignityMaintainedRate + privacyEnsuredRate + consentRate + noShamingRate + embarrassmentMinimisedRate + reassuranceRate) / 6,
        )
      : null;

  // --- Age guidance metrics ---
  const totalAgeGuidanceRecords = age_guidance_records.length;
  const ageAppropriateGuidance = age_guidance_records.filter((g) => g.age_appropriate).length;
  const ageAppropriateGuidanceRate = pct(ageAppropriateGuidance, totalAgeGuidanceRecords);

  const developmentAppropriate = age_guidance_records.filter((g) => g.development_appropriate).length;
  const developmentAppropriateRate = pct(developmentAppropriate, totalAgeGuidanceRecords);

  const deliveredSensitively = age_guidance_records.filter((g) => g.delivered_sensitively).length;
  const deliveredSensitivelyRate = pct(deliveredSensitively, totalAgeGuidanceRecords);

  const childEngagedGuidance = age_guidance_records.filter((g) => g.child_engaged).length;
  const childEngagedRate = pct(childEngagedGuidance, totalAgeGuidanceRecords);

  const childUnderstood = age_guidance_records.filter((g) => g.child_understood).length;
  const childUnderstoodRate = pct(childUnderstood, totalAgeGuidanceRecords);

  const questionsEncouraged = age_guidance_records.filter((g) => g.child_questions_encouraged).length;
  const questionsEncouragedRate = pct(questionsEncouraged, totalAgeGuidanceRecords);

  const childFeedbackPositive = age_guidance_records.filter((g) => g.child_feedback_positive).length;
  const childFeedbackPositiveRate = pct(childFeedbackPositive, totalAgeGuidanceRecords);

  const followUpPlanned = age_guidance_records.filter((g) => g.follow_up_planned).length;
  const followUpPlannedRate = pct(followUpPlanned, totalAgeGuidanceRecords);

  const followUpCompleted = age_guidance_records.filter((g) => g.follow_up_planned && g.follow_up_completed).length;
  const followUpCompletionRate = followUpPlanned > 0 ? pct(followUpCompleted, followUpPlanned) : 100;

  const materialsProvided = age_guidance_records.filter((g) => g.materials_provided).length;
  const materialsRate = pct(materialsProvided, totalAgeGuidanceRecords);

  const culturalSensitivityShown = age_guidance_records.filter((g) => g.cultural_sensitivity_shown).length;
  const culturalSensitivityRate = pct(culturalSensitivityShown, totalAgeGuidanceRecords);

  const linkedToCarePlan = age_guidance_records.filter((g) => g.linked_to_care_plan).length;
  const linkedToCarePlanRate = pct(linkedToCarePlan, totalAgeGuidanceRecords);

  const parentConsulted = age_guidance_records.filter((g) => g.parent_carer_consulted).length;
  const parentConsultedRate = pct(parentConsulted, totalAgeGuidanceRecords);

  const uniqueChildrenGuidance = new Set(
    age_guidance_records.filter((g) => g.child_engaged).map((g) => g.child_id),
  ).size;
  const guidanceChildCoverage = total_children > 0 ? pct(uniqueChildrenGuidance, total_children) : 0;

  // Composite age_appropriate_rate
  const ageAppropriateRate: number | null =
    totalAgeGuidanceRecords > 0
      ? Math.round(
          (ageAppropriateGuidanceRate + developmentAppropriateRate + deliveredSensitivelyRate + childEngagedRate) / 4,
        )
      : null;

  // --- Product provision metrics ---
  const totalProductProvisionRecords = product_provision_records.length;
  const productsAvailableProv = product_provision_records.filter((p) => p.product_available).length;
  const productAvailabilityRate = pct(productsAvailableProv, totalProductProvisionRecords);

  const productsSuitableProv = product_provision_records.filter((p) => p.product_suitable).length;
  const productSuitabilityRate = pct(productsSuitableProv, totalProductProvisionRecords);

  const productPreferred = product_provision_records.filter((p) => p.product_preferred_by_child).length;
  const productPreferredRate = pct(productPreferred, totalProductProvisionRecords);

  const sufficientQuantity = product_provision_records.filter((p) => p.sufficient_quantity).length;
  const sufficientQuantityRate = pct(sufficientQuantity, totalProductProvisionRecords);

  const storedDiscreetly = product_provision_records.filter((p) => p.stored_discreetly).length;
  const storedDiscreetlyRate = pct(storedDiscreetly, totalProductProvisionRecords);

  const easyAccess = product_provision_records.filter((p) => p.easy_access_for_child).length;
  const easyAccessRate = pct(easyAccess, totalProductProvisionRecords);

  const brandChoice = product_provision_records.filter((p) => p.brand_choice_offered).length;
  const brandChoiceRate = pct(brandChoice, totalProductProvisionRecords);

  const culturalNeedsProducts = product_provision_records.filter((p) => p.cultural_needs_met).length;
  const culturalNeedsProductRate = pct(culturalNeedsProducts, totalProductProvisionRecords);

  const sensoryNeedsProducts = product_provision_records.filter((p) => p.sensory_needs_met).length;
  const sensoryNeedsProductRate = pct(sensoryNeedsProducts, totalProductProvisionRecords);

  const replenishedOnTime = product_provision_records.filter((p) => p.replenished_on_time).length;
  const replenishedRate = pct(replenishedOnTime, totalProductProvisionRecords);

  const budgetAdequate = product_provision_records.filter((p) => p.budget_adequate).length;
  const budgetAdequateRate = pct(budgetAdequate, totalProductProvisionRecords);

  const childConsulted = product_provision_records.filter((p) => p.child_consulted_on_choice).length;
  const childConsultedRate = pct(childConsulted, totalProductProvisionRecords);

  const ageAppropriateProducts = product_provision_records.filter((p) => p.age_appropriate).length;
  const ageAppropriateProductRate = pct(ageAppropriateProducts, totalProductProvisionRecords);

  const qualityAcceptable = product_provision_records.filter((p) => p.quality_acceptable).length;
  const qualityAcceptableRate = pct(qualityAcceptable, totalProductProvisionRecords);

  const dignityPreservedProducts = product_provision_records.filter((p) => p.child_dignity_preserved).length;
  const dignityProductRate = pct(dignityPreservedProducts, totalProductProvisionRecords);

  const medicalRecFollowed = product_provision_records.filter((p) => p.medical_recommendation_followed).length;
  const medicalRecRate = pct(medicalRecFollowed, totalProductProvisionRecords);

  const staffAwareProducts = product_provision_records.filter((p) => p.staff_aware_of_needs).length;
  const staffAwareProductRate = pct(staffAwareProducts, totalProductProvisionRecords);

  // Composite product_provision_rate
  const productProvisionRate: number | null =
    totalProductProvisionRecords > 0
      ? Math.round(
          (productAvailabilityRate + productSuitabilityRate + sufficientQuantityRate + storedDiscreetlyRate + dignityProductRate) / 5,
        )
      : null;

  // --- Child independence composite ---
  const independenceNumerators: number[] = [];
  const independenceDenominators: number[] = [];

  if (totalHygieneRoutines > 0) {
    independenceNumerators.push(routinesIndependent);
    independenceDenominators.push(totalHygieneRoutines);
  }
  if (totalContinencePlans > 0) {
    independenceNumerators.push(childInvolvedPlanning);
    independenceDenominators.push(totalContinencePlans);
  }
  if (totalAgeGuidanceRecords > 0) {
    independenceNumerators.push(childEngagedGuidance);
    independenceDenominators.push(totalAgeGuidanceRecords);
  }
  if (totalProductProvisionRecords > 0) {
    independenceNumerators.push(childConsulted);
    independenceDenominators.push(totalProductProvisionRecords);
  }

  const totalIndependenceNum = independenceNumerators.reduce((a, b) => a + b, 0);
  const totalIndependenceDenom = independenceDenominators.reduce((a, b) => a + b, 0);
  const childIndependenceRate = pct(totalIndependenceNum, totalIndependenceDenom);

  // -- Scoring: base 52 -----------------------------------------------------

  let score = 52;

  // --- Bonus 1: continencePlanRate (>=90: +5, >=70: +3) ---
  if (meets(continencePlanRate, 90)) score += 5;
  else if (meets(continencePlanRate, 70)) score += 3;

  // --- Bonus 2: hygieneRoutineRate (>=90: +5, >=70: +3) ---
  if (meets(hygieneRoutineRate, 90)) score += 5;
  else if (meets(hygieneRoutineRate, 70)) score += 3;

  // --- Bonus 3: dignityComplianceRate (>=95: +5, >=80: +3) ---
  if (meets(dignityComplianceRate, 95)) score += 5;
  else if (meets(dignityComplianceRate, 80)) score += 3;

  // --- Bonus 4: ageAppropriateRate (>=90: +4, >=70: +2) ---
  if (meets(ageAppropriateRate, 90)) score += 4;
  else if (meets(ageAppropriateRate, 70)) score += 2;

  // --- Bonus 5: productProvisionRate (>=90: +4, >=70: +2) ---
  if (meets(productProvisionRate, 90)) score += 4;
  else if (meets(productProvisionRate, 70)) score += 2;

  // --- Bonus 6: childIndependenceRate (>=90: +3, >=70: +1) ---
  if (childIndependenceRate >= 90) score += 3;
  else if (childIndependenceRate >= 70) score += 1;

  // --- Bonus 7: confidentialityRate (>=95: +2) ---
  if (confidentialityRate >= 95 && totalContinencePlans > 0) score += 2;

  // Max bonuses = 5+5+5+4+4+3+2 = 28

  // -- Penalties -------------------------------------------------------------

  // below(continencePlanRate, 40) -> -5 (guarded)
  if (below(continencePlanRate, 40) && continence_plan_records.length > 0) score -= 5;

  // below(hygieneRoutineRate, 40) -> -5 (guarded)
  if (below(hygieneRoutineRate, 40) && hygiene_routine_records.length > 0) score -= 5;

  // below(dignityComplianceRate, 50) -> -5 (guarded)
  if (below(dignityComplianceRate, 50) && dignity_care_records.length > 0) score -= 5;

  // below(productProvisionRate, 40) -> -3 (guarded)
  if (below(productProvisionRate, 40) && product_provision_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const hygiene_rating = toRating(score);

  // -- Strengths --------------------------------------------------------------

  const strengths: string[] = [];

  if (meets(continencePlanRate, 90) && totalContinencePlans > 0) {
    strengths.push(
      `Continence plan compliance at ${continencePlanRate}% -- plans are in place, personalised, reviewed on time, and include clear goals. Children's continence needs are being managed proactively and comprehensively.`,
    );
  } else if (meets(continencePlanRate, 70) && totalContinencePlans > 0) {
    strengths.push(
      `Continence plan compliance at ${continencePlanRate}% -- the home maintains good standards of continence management planning for children with identified needs.`,
    );
  }

  if (meets(hygieneRoutineRate, 90) && totalHygieneRoutines > 0) {
    strengths.push(
      `Hygiene routine quality at ${hygieneRoutineRate}% -- personal hygiene routines are well-supported, completed with dignity, and respect children's privacy and age-appropriate needs.`,
    );
  } else if (meets(hygieneRoutineRate, 70) && totalHygieneRoutines > 0) {
    strengths.push(
      `Hygiene routine quality at ${hygieneRoutineRate}% -- the home provides good support for children's personal hygiene routines with appropriate attention to dignity and privacy.`,
    );
  }

  if (meets(dignityComplianceRate, 95) && totalDignityCareRecords > 0) {
    strengths.push(
      `Dignity in care compliance at ${dignityComplianceRate}% -- exemplary standards of dignity, privacy, and sensitivity in all continence and personal care interactions. Children's embarrassment is minimised and positive reassurance is consistently provided.`,
    );
  } else if (meets(dignityComplianceRate, 80) && totalDignityCareRecords > 0) {
    strengths.push(
      `Dignity in care compliance at ${dignityComplianceRate}% -- the home demonstrates strong commitment to maintaining children's dignity and privacy during personal care support.`,
    );
  }

  if (meets(ageAppropriateRate, 90) && totalAgeGuidanceRecords > 0) {
    strengths.push(
      `Age-appropriate guidance rate at ${ageAppropriateRate}% -- guidance on continence, hygiene, and personal care is consistently tailored to each child's age and developmental stage, delivered sensitively with strong engagement.`,
    );
  } else if (meets(ageAppropriateRate, 70) && totalAgeGuidanceRecords > 0) {
    strengths.push(
      `Age-appropriate guidance rate at ${ageAppropriateRate}% -- good standards of age and developmentally appropriate guidance on personal hygiene and continence matters.`,
    );
  }

  if (meets(productProvisionRate, 90) && totalProductProvisionRecords > 0) {
    strengths.push(
      `Product provision rate at ${productProvisionRate}% -- continence and hygiene products are consistently available, suitable, stored discreetly, and provided in sufficient quantities while preserving children's dignity.`,
    );
  } else if (meets(productProvisionRate, 70) && totalProductProvisionRecords > 0) {
    strengths.push(
      `Product provision rate at ${productProvisionRate}% -- the home ensures children have access to appropriate continence and hygiene products with attention to dignity and suitability.`,
    );
  }

  if (childIndependenceRate >= 90 && totalIndependenceDenom > 0) {
    strengths.push(
      `Child independence rate at ${childIndependenceRate}% -- children are actively involved in their own care planning, consulted on product choices, and encouraged towards independence in hygiene management.`,
    );
  } else if (childIndependenceRate >= 70 && totalIndependenceDenom > 0) {
    strengths.push(
      `Child independence rate at ${childIndependenceRate}% -- good levels of children's involvement in their own personal hygiene and continence management, supporting their growing independence.`,
    );
  }

  if (confidentialityRate >= 95 && totalContinencePlans > 0) {
    strengths.push(
      `${confidentialityRate}% confidentiality maintained across continence records -- the home demonstrates exemplary practice in protecting children's sensitive personal information.`,
    );
  }

  if (noShamingRate >= 95 && totalDignityCareRecords > 0) {
    strengths.push(
      `${noShamingRate}% of dignity care interactions free from shaming language -- staff consistently use positive, reassuring language when supporting children with continence and hygiene needs.`,
    );
  }

  if (medicalInvolvementRate >= 90 && totalContinencePlans > 0) {
    strengths.push(
      `${medicalInvolvementRate}% of continence plans involve medical professionals -- the home ensures clinical oversight and specialist input for children with continence needs.`,
    );
  } else if (medicalInvolvementRate >= 70 && totalContinencePlans > 0) {
    strengths.push(
      `${medicalInvolvementRate}% medical professional involvement in continence plans -- good engagement with health professionals to support children's continence management.`,
    );
  }

  if (refusalHandlingRate >= 95 && routinesRefused > 0) {
    strengths.push(
      "Refusals of hygiene support are handled sensitively in virtually all cases -- staff respond with understanding, respect children's autonomy, and re-engage without pressure or shaming.",
    );
  }

  if (culturalNeedsRate >= 90 && totalHygieneRoutines > 0) {
    strengths.push(
      `${culturalNeedsRate}% of hygiene routines meet cultural needs -- the home demonstrates excellent cultural sensitivity in personal care support.`,
    );
  }

  if (sameGenderRate >= 90 && totalHygieneRoutines > 0) {
    strengths.push(
      `Same-gender support offered in ${sameGenderRate}% of hygiene routines -- the home consistently respects children's preferences for same-gender personal care support.`,
    );
  }

  if (childEngagedRate >= 90 && totalAgeGuidanceRecords > 0) {
    strengths.push(
      `${childEngagedRate}% child engagement in age-appropriate guidance sessions -- children are actively participating in learning about personal hygiene and continence management.`,
    );
  }

  if (guidanceChildCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has received age-appropriate hygiene and continence guidance -- the home ensures inclusive personal development support across all children on placement.",
    );
  } else if (guidanceChildCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${guidanceChildCoverage}% of children have received age-appropriate guidance -- strong coverage ensuring most children are supported in understanding personal hygiene and continence matters.`,
    );
  }

  if (easyAccessRate >= 95 && totalProductProvisionRecords > 0) {
    strengths.push(
      `${easyAccessRate}% of products easily accessible to children -- children can independently access their hygiene and continence products without needing to ask, supporting dignity and independence.`,
    );
  }

  if (replenishedRate >= 95 && totalProductProvisionRecords > 0) {
    strengths.push(
      `${replenishedRate}% of products replenished on time -- the home ensures children never run out of essential hygiene and continence supplies.`,
    );
  }

  if (cleanClothesRate >= 95 && totalDignityCareRecords > 0) {
    strengths.push(
      `Clean clothes provided promptly in ${cleanClothesRate}% of dignity care incidents -- children's comfort and dignity are prioritised through swift, sensitive response to continence accidents.`,
    );
  }

  if (peerAwarenessRate >= 90 && totalDignityCareRecords > 0) {
    strengths.push(
      `Peer awareness managed in ${peerAwarenessRate}% of dignity care interactions -- the home is highly effective at protecting children from embarrassment among their peers.`,
    );
  }

  // -- Concerns ---------------------------------------------------------------

  const concerns: string[] = [];

  if (below(continencePlanRate, 40) && totalContinencePlans > 0) {
    concerns.push(
      `Continence plan compliance at only ${continencePlanRate}% -- continence management plans are significantly deficient. Plans may be absent, not personalised, not reviewed, or lack clear goals, meaning children's continence needs are not being adequately managed.`,
    );
  } else if (meets(continencePlanRate, 40) && below(continencePlanRate, 70) && totalContinencePlans > 0) {
    concerns.push(
      `Continence plan compliance at ${continencePlanRate}% -- while plans exist, gaps in personalisation, timely reviews, or goal-setting mean continence management is inconsistent.`,
    );
  }

  if (below(hygieneRoutineRate, 40) && totalHygieneRoutines > 0) {
    concerns.push(
      `Hygiene routine quality at only ${hygieneRoutineRate}% -- personal hygiene routines are poorly supported, completed without adequate dignity or privacy, or lack age-appropriate approaches. This represents a serious welfare concern.`,
    );
  } else if (meets(hygieneRoutineRate, 40) && below(hygieneRoutineRate, 70) && totalHygieneRoutines > 0) {
    concerns.push(
      `Hygiene routine quality at ${hygieneRoutineRate}% -- inconsistencies in support, dignity, privacy, or age-appropriate approaches during personal hygiene routines require improvement.`,
    );
  }

  if (below(dignityComplianceRate, 50) && totalDignityCareRecords > 0) {
    concerns.push(
      `Dignity in care compliance at only ${dignityComplianceRate}% -- children's dignity, privacy, and emotional wellbeing are not being consistently protected during continence and personal care support. This is a serious safeguarding concern.`,
    );
  } else if (meets(dignityComplianceRate, 50) && below(dignityComplianceRate, 80) && totalDignityCareRecords > 0) {
    concerns.push(
      `Dignity in care compliance at ${dignityComplianceRate}% -- while some dignity standards are met, inconsistencies in privacy, consent, reassurance, or sensitive language require attention.`,
    );
  }

  if (below(ageAppropriateRate, 40) && totalAgeGuidanceRecords > 0) {
    concerns.push(
      `Age-appropriate guidance rate at only ${ageAppropriateRate}% -- guidance on continence and hygiene is not consistently age or developmentally appropriate, delivered insensitively, or failing to engage children. This undermines children's understanding and confidence.`,
    );
  } else if (meets(ageAppropriateRate, 40) && below(ageAppropriateRate, 70) && totalAgeGuidanceRecords > 0) {
    concerns.push(
      `Age-appropriate guidance rate at ${ageAppropriateRate}% -- guidance is not consistently meeting the age and developmental needs of all children, and engagement levels suggest the approach may need review.`,
    );
  }

  if (below(productProvisionRate, 40) && totalProductProvisionRecords > 0) {
    concerns.push(
      `Product provision rate at only ${productProvisionRate}% -- children lack consistent access to suitable, sufficient, and discreetly stored continence and hygiene products. This directly impacts children's dignity and wellbeing.`,
    );
  } else if (meets(productProvisionRate, 40) && below(productProvisionRate, 70) && totalProductProvisionRecords > 0) {
    concerns.push(
      `Product provision rate at ${productProvisionRate}% -- gaps in product availability, suitability, quantity, storage, or dignity in provision require improvement.`,
    );
  }

  if (childIndependenceRate < 30 && totalIndependenceDenom > 0) {
    concerns.push(
      `Child independence rate at only ${childIndependenceRate}% -- children are not being adequately involved in their own care planning, product choices, or encouraged towards independence in hygiene and continence management.`,
    );
  } else if (childIndependenceRate >= 30 && childIndependenceRate < 70 && totalIndependenceDenom > 0) {
    concerns.push(
      `Child independence rate at ${childIndependenceRate}% -- more could be done to involve children in decisions about their personal hygiene and continence support, and to build their independence skills.`,
    );
  }

  if (noShamingRate < 80 && totalDignityCareRecords > 0) {
    concerns.push(
      `Shaming-free language maintained in only ${noShamingRate}% of dignity care interactions -- instances of inappropriate or shaming language during continence and personal care support are unacceptable and must be addressed immediately.`,
    );
  }

  if (confidentialityRate < 80 && totalContinencePlans > 0) {
    concerns.push(
      `Confidentiality maintained in only ${confidentialityRate}% of continence records -- breaches of confidentiality around children's continence needs are a serious dignity and safeguarding concern.`,
    );
  }

  if (refusalHandlingRate < 70 && routinesRefused > 0) {
    concerns.push(
      `Only ${refusalHandlingRate}% of hygiene refusals handled sensitively -- insensitive responses to children's refusal of hygiene support undermine trust and may indicate inadequate staff training.`,
    );
  }

  if (medicalInvolvementRate < 50 && totalContinencePlans > 0) {
    concerns.push(
      `Only ${medicalInvolvementRate}% of continence plans involve a medical professional -- many children with continence needs are not receiving specialist clinical input, which is required under Reg 14.`,
    );
  }

  if (staffTrainedRate < 50 && totalContinencePlans > 0) {
    concerns.push(
      `Only ${staffTrainedRate}% of continence plans have associated staff training -- staff may not be equipped to support children's continence needs effectively and sensitively.`,
    );
  }

  if (easyAccessRate < 60 && totalProductProvisionRecords > 0) {
    concerns.push(
      `Only ${easyAccessRate}% of products are easily accessible to children -- children having to ask for essential hygiene or continence products undermines their dignity and independence.`,
    );
  }

  if (peerAwarenessRate < 60 && totalDignityCareRecords > 0) {
    concerns.push(
      `Peer awareness managed in only ${peerAwarenessRate}% of dignity care interactions -- children may be exposed to embarrassment among peers during continence or personal care incidents, causing emotional harm.`,
    );
  }

  if (guidanceChildCoverage < 50 && total_children > 0 && totalAgeGuidanceRecords > 0) {
    concerns.push(
      `Only ${guidanceChildCoverage}% of children have received age-appropriate guidance -- many children are missing out on essential personal hygiene and continence education.`,
    );
  }

  if (totalContinencePlans === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No continence plan records exist despite children on placement and other hygiene data being recorded -- the home cannot evidence continence management for children who may need it.",
    );
  }

  if (totalDignityCareRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No dignity care records exist despite children on placement -- the home cannot evidence that dignity and privacy are maintained during personal care and continence support.",
    );
  }

  // -- Recommendations --------------------------------------------------------

  const recommendations: ContinenceHygieneRecommendation[] = [];
  let rank = 0;

  if (below(continencePlanRate, 40) && totalContinencePlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and strengthen all continence management plans -- ensure every child with an identified need has a personalised, goal-oriented plan that is reviewed on time and involves the child in planning decisions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (below(dignityComplianceRate, 50) && totalDignityCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Take immediate action to improve dignity in continence and personal care support -- ensure all staff understand the non-negotiable requirements for consent, privacy, sensitive language, and emotional reassurance during personal care interactions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; SCCIF Experiences and progress",
    });
  }

  if (below(hygieneRoutineRate, 40) && totalHygieneRoutines > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve personal hygiene routine support -- ensure all routines are carried out with proper dignity, privacy, and age-appropriate approaches, and that children's choices and cultural needs are respected throughout.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (noShamingRate < 80 && totalDignityCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address all instances of shaming language in continence and personal care immediately -- provide mandatory staff training on dignity-preserving communication, the psychological impact of shaming on children with continence needs, and appropriate reassurance techniques.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; SCCIF Experiences and progress",
    });
  }

  if (confidentialityRate < 80 && totalContinencePlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review confidentiality practices around continence records -- ensure all sensitive information about children's continence needs is stored securely, shared only on a need-to-know basis, and that breaches are investigated and addressed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; Data Protection Act 2018",
    });
  }

  if (below(productProvisionRate, 40) && totalProductProvisionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children have immediate access to suitable, sufficient, and discreetly stored continence and hygiene products -- review stock management, product suitability, and storage arrangements to protect children's dignity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (medicalInvolvementRate < 50 && totalContinencePlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children with continence needs have medical professional involvement -- arrange GP reviews, specialist referrals where appropriate, and ensure clinical guidance informs each child's continence management plan.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (staffTrainedRate < 50 && totalContinencePlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide comprehensive continence management training for all staff -- training should cover common continence conditions, dignity-preserving care, sensitive communication, practical management techniques, and the emotional impact on children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 -- Staff training",
    });
  }

  if (refusalHandlingRate < 70 && routinesRefused > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review staff practice around handling hygiene refusals -- ensure staff respond with patience, understanding, and respect for children's autonomy while exploring reasons for refusal and finding creative, sensitive alternatives.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress; Voice of the child",
    });
  }

  if (meets(ageAppropriateRate, 40) && below(ageAppropriateRate, 70) && totalAgeGuidanceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the quality and consistency of age-appropriate guidance on continence and hygiene -- ensure all guidance is tailored to the child's developmental stage, delivered sensitively, and uses appropriate materials and visual aids.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; SCCIF Experiences and progress",
    });
  }

  if (below(ageAppropriateRate, 40) && totalAgeGuidanceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review the approach to age-appropriate guidance -- current guidance is not meeting children's developmental needs. Engage health professionals or specialist educators to develop suitable materials and approaches for each child's age and stage.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; SCCIF Experiences and progress",
    });
  }

  if (childIndependenceRate < 30 && totalIndependenceDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop strategies to increase children's involvement and independence in their personal hygiene and continence management -- ensure children are consulted on their care plans, offered product choices, and supported to develop self-care skills at their own pace.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Voice of the child; Experiences and progress",
    });
  }

  if (easyAccessRate < 60 && totalProductProvisionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review product storage and access arrangements -- ensure children can independently and discreetly access their hygiene and continence products without needing to ask staff, which preserves dignity and promotes independence.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (peerAwarenessRate < 60 && totalDignityCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen peer awareness management during continence and personal care incidents -- develop clear protocols for managing situations discreetly to protect children from embarrassment or bullying by peers.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; SCCIF Experiences and progress",
    });
  }

  if (
    meets(continencePlanRate, 40) &&
    below(continencePlanRate, 70) &&
    totalContinencePlans > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen continence management plans to achieve consistent compliance -- ensure all plans are personalised, include measurable goals, are reviewed on schedule, and involve the child and relevant professionals.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (
    meets(hygieneRoutineRate, 40) &&
    below(hygieneRoutineRate, 70) &&
    totalHygieneRoutines > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve consistency in hygiene routine support -- review practices around dignity, privacy, and age-appropriate approaches to ensure all children receive high-quality support with their personal hygiene routines.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (
    meets(dignityComplianceRate, 50) &&
    below(dignityComplianceRate, 80) &&
    totalDignityCareRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Build on existing dignity standards to achieve consistently high compliance -- focus on areas where gaps exist such as consent-seeking, emotional support, or sensitive incident recording, and embed dignity in all personal care protocols.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; SCCIF Experiences and progress",
    });
  }

  if (
    meets(productProvisionRate, 40) &&
    below(productProvisionRate, 70) &&
    totalProductProvisionRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve product provision standards -- review availability, suitability, storage, and dignity considerations to ensure all children have consistent, dignified access to appropriate continence and hygiene products.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (
    childIndependenceRate >= 30 &&
    childIndependenceRate < 70 &&
    totalIndependenceDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's active participation in their personal hygiene and continence management -- create more opportunities for children to contribute to care planning, exercise choice over products, and develop independence skills.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Voice of the child; Experiences and progress",
    });
  }

  if (
    guidanceChildCoverage < 80 &&
    guidanceChildCoverage >= 50 &&
    total_children > 0 &&
    totalAgeGuidanceRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend age-appropriate guidance coverage to reach all children -- identify children who have not yet received guidance and develop tailored, sensitive sessions addressing their specific hygiene and continence learning needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; SCCIF Experiences and progress",
    });
  }

  if (totalContinencePlans === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assess all children for continence needs and develop management plans where required -- the absence of any continence plan records suggests either needs are unidentified or plans have not been created for children who require them.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalDignityCareRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording dignity in care practices during all personal care and continence support interactions -- the home must evidence that children's dignity and privacy are consistently maintained.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; SCCIF Experiences and progress",
    });
  }

  // -- Insights ---------------------------------------------------------------

  const insights: ContinenceHygieneInsight[] = [];

  // -- Critical insights --

  if (below(continencePlanRate, 40) && totalContinencePlans > 0) {
    insights.push({
      text: `Continence plan compliance at only ${continencePlanRate}%. Inadequate continence management planning means children's health needs are not being properly assessed, planned for, or reviewed. Under Regulation 14, the home must ensure that each child's health care needs are met, including continence management. This level of compliance indicates a systemic failure in health care planning.`,
      severity: "critical",
    });
  }

  if (below(dignityComplianceRate, 50) && totalDignityCareRecords > 0) {
    insights.push({
      text: `Dignity in care compliance at only ${dignityComplianceRate}%. Children are not consistently experiencing dignity, privacy, and sensitive care during continence and personal hygiene support. Ofsted inspectors will assess whether children are treated with dignity and respect -- this level of non-compliance represents a safeguarding concern and will significantly impact inspection judgements.`,
      severity: "critical",
    });
  }

  if (below(hygieneRoutineRate, 40) && totalHygieneRoutines > 0) {
    insights.push({
      text: `Hygiene routine quality at only ${hygieneRoutineRate}%. Personal hygiene routines are not being adequately supported, compromising children's physical health, dignity, and emotional wellbeing. Poor hygiene support can lead to health complications, social stigma, and damaged self-esteem, making this a priority welfare concern.`,
      severity: "critical",
    });
  }

  if (noShamingRate < 80 && totalDignityCareRecords > 0) {
    insights.push({
      text: `Shaming language found in ${100 - noShamingRate}% of dignity care interactions. Any use of shaming or negative language during continence and personal care support is unacceptable. Research consistently shows that shame and embarrassment around continence issues can cause lasting psychological harm, school avoidance, and social withdrawal. This must be addressed as a safeguarding priority.`,
      severity: "critical",
    });
  }

  if (confidentialityRate < 80 && totalContinencePlans > 0) {
    insights.push({
      text: `Confidentiality maintained in only ${confidentialityRate}% of continence records. Continence information is among the most sensitive personal data for children. Breaches of confidentiality can cause severe embarrassment, bullying, and emotional harm. All records must be stored securely and information shared only with those who need to know.`,
      severity: "critical",
    });
  }

  if (below(productProvisionRate, 40) && totalProductProvisionRecords > 0) {
    insights.push({
      text: `Product provision rate at only ${productProvisionRate}%. Children lack consistent access to suitable continence and hygiene products. Running out of products, having unsuitable items, or lacking discreet storage forces children into undignified situations and undermines their confidence and self-esteem. This is a basic care requirement that must be met.`,
      severity: "critical",
    });
  }

  if (totalContinencePlans === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No continence plan records exist despite children on placement and other hygiene support data being recorded. This suggests the home has not systematically assessed children for continence needs or has failed to create management plans where needed. Under Regulation 14, continence is a health care need that requires proper assessment, planning, and review.",
      severity: "critical",
    });
  }

  if (totalDignityCareRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No dignity care records exist despite children on placement. Without evidence of dignity practices during personal care and continence support, the home cannot demonstrate that children's most intimate care needs are met with appropriate sensitivity, privacy, and respect. This is a significant gap in evidence for Ofsted.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(continencePlanRate, 40) &&
    below(continencePlanRate, 70) &&
    totalContinencePlans > 0
  ) {
    insights.push({
      text: `Continence plan compliance at ${continencePlanRate}% -- improving but inconsistencies in plan personalisation, review timeliness, or goal-setting mean the home cannot fully demonstrate robust continence management. Strengthening plan quality and review processes would bring significant improvement.`,
      severity: "warning",
    });
  }

  if (
    meets(hygieneRoutineRate, 40) &&
    below(hygieneRoutineRate, 70) &&
    totalHygieneRoutines > 0
  ) {
    insights.push({
      text: `Hygiene routine quality at ${hygieneRoutineRate}% -- while routines are being supported, gaps in dignity, privacy, or age-appropriate approaches mean some children may not be receiving the sensitive, individualised hygiene support they need.`,
      severity: "warning",
    });
  }

  if (
    meets(dignityComplianceRate, 50) &&
    below(dignityComplianceRate, 80) &&
    totalDignityCareRecords > 0
  ) {
    insights.push({
      text: `Dignity in care compliance at ${dignityComplianceRate}% -- while basic standards are being met in many interactions, inconsistencies remain. Given the sensitive nature of continence and personal care, anything less than consistently high dignity standards risks causing emotional harm.`,
      severity: "warning",
    });
  }

  if (
    meets(ageAppropriateRate, 40) &&
    below(ageAppropriateRate, 70) &&
    totalAgeGuidanceRecords > 0
  ) {
    insights.push({
      text: `Age-appropriate guidance at ${ageAppropriateRate}% -- guidance is being provided but not consistently tailored to children's developmental stages or delivered in ways that fully engage them. Review whether materials, language, and approaches are appropriate for each child's age and understanding.`,
      severity: "warning",
    });
  }

  if (
    meets(productProvisionRate, 40) &&
    below(productProvisionRate, 70) &&
    totalProductProvisionRecords > 0
  ) {
    insights.push({
      text: `Product provision at ${productProvisionRate}% -- while products are generally available, gaps in suitability, storage, quantity, or dignified provision mean some children may experience embarrassment or discomfort. Review stock management and storage arrangements.`,
      severity: "warning",
    });
  }

  if (
    childIndependenceRate >= 30 &&
    childIndependenceRate < 70 &&
    totalIndependenceDenom > 0
  ) {
    insights.push({
      text: `Child independence at ${childIndependenceRate}% -- while some children are involved in their care, many are not yet actively contributing to decisions about their hygiene and continence management. Building independence in personal care is essential for children's long-term wellbeing and preparation for adulthood.`,
      severity: "warning",
    });
  }

  if (
    medicalInvolvementRate >= 50 &&
    medicalInvolvementRate < 70 &&
    totalContinencePlans > 0
  ) {
    insights.push({
      text: `Medical professional involvement at ${medicalInvolvementRate}% -- while many plans have clinical input, gaps remain. Children with continence needs should have their plans informed by appropriate medical professionals to ensure evidence-based management.`,
      severity: "warning",
    });
  }

  if (
    staffTrainedRate >= 50 &&
    staffTrainedRate < 70 &&
    totalContinencePlans > 0
  ) {
    insights.push({
      text: `Staff training on continence plans at ${staffTrainedRate}% -- not all staff supporting children with continence needs have received appropriate training. Without training, staff may respond inconsistently or insensitively to continence incidents.`,
      severity: "warning",
    });
  }

  if (
    refusalHandlingRate >= 70 &&
    refusalHandlingRate < 95 &&
    routinesRefused > 0
  ) {
    insights.push({
      text: `Hygiene refusal handling sensitivity at ${refusalHandlingRate}% -- most refusals are handled well, but some instances of insensitive handling remain. Every refusal must be met with patience and understanding to maintain trust and protect children's emotional wellbeing.`,
      severity: "warning",
    });
  }

  if (
    followUpCompletionRate < 70 &&
    followUpPlanned > 0
  ) {
    insights.push({
      text: `Follow-up completion for age-appropriate guidance at ${followUpCompletionRate}% -- planned follow-up sessions are not being consistently delivered. Follow-up is essential to reinforce learning and check children's understanding of personal hygiene and continence topics.`,
      severity: "warning",
    });
  }

  // Identify most common continence conditions
  const conditionCounts: Record<string, number> = {};
  for (const p of continence_plan_records) {
    conditionCounts[p.condition_type] = (conditionCounts[p.condition_type] ?? 0) + 1;
  }
  const topConditions = Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topConditions.length > 0 && totalContinencePlans >= 3) {
    const conditionLabels: Record<string, string> = {
      enuresis_nocturnal: "nocturnal enuresis (bedwetting)",
      enuresis_diurnal: "diurnal enuresis (daytime wetting)",
      encopresis: "encopresis (soiling)",
      functional: "functional continence issues",
      medical: "medically-related continence",
      stress: "stress-related continence",
      mixed: "mixed continence presentations",
      other: "other continence conditions",
    };
    insights.push({
      text: `The most common continence conditions across the home are ${topConditions.map(([c, count]) => `${conditionLabels[c] ?? c} (${count} plan${count !== 1 ? "s" : ""})`).join(", ")}. Understanding the profile of continence needs across the home helps inform staff training priorities and product purchasing decisions.`,
      severity: "warning",
    });
  }

  // Identify routine type distribution
  const routineTypeCounts: Record<string, number> = {};
  for (const r of hygiene_routine_records) {
    routineTypeCounts[r.routine_type] = (routineTypeCounts[r.routine_type] ?? 0) + 1;
  }
  const routineTypes = Object.keys(routineTypeCounts);
  const expectedRoutineTypes = ["morning", "evening", "bathing", "dental", "handwashing"];
  const missingRoutineTypes = expectedRoutineTypes.filter(
    (t) => !routineTypeCounts[t] || routineTypeCounts[t] === 0,
  );
  if (missingRoutineTypes.length >= 2 && totalHygieneRoutines > 3) {
    insights.push({
      text: `No records for ${missingRoutineTypes.join(", ")} hygiene routines. A comprehensive hygiene support record should cover all aspects of children's personal care. Gaps in recording may indicate gaps in practice or missed opportunities to support children's hygiene development.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (hygiene_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding continence and personal hygiene support -- continence plans are comprehensive and personalised, hygiene routines are supported with dignity and sensitivity, age-appropriate guidance is effective, and products are well-provisioned. Children's most intimate care needs are met with consistent respect, privacy, and encouragement towards independence.",
      severity: "positive",
    });
  }

  if (
    meets(continencePlanRate, 90) &&
    medicalInvolvementRate >= 90 &&
    totalContinencePlans > 0
  ) {
    insights.push({
      text: `Continence plan compliance at ${continencePlanRate}% with ${medicalInvolvementRate}% medical professional involvement -- the home demonstrates excellent, clinically-informed continence management. Plans are personalised, goal-oriented, regularly reviewed, and supported by appropriate health professionals.`,
      severity: "positive",
    });
  }

  if (
    meets(dignityComplianceRate, 95) &&
    noShamingRate >= 95 &&
    totalDignityCareRecords > 0
  ) {
    insights.push({
      text: `Dignity compliance at ${dignityComplianceRate}% with ${noShamingRate}% shaming-free interactions -- the home demonstrates exemplary practice in protecting children's dignity during continence and personal care. Staff consistently use positive language, maintain privacy, and provide emotional reassurance.`,
      severity: "positive",
    });
  }

  if (
    meets(hygieneRoutineRate, 90) &&
    routinePersonalisedRate >= 90 &&
    totalHygieneRoutines > 0
  ) {
    insights.push({
      text: `Hygiene routine quality at ${hygieneRoutineRate}% with ${routinePersonalisedRate}% personalised -- personal hygiene support is consistently high quality, individualised to each child's needs, and delivered with dignity and sensitivity.`,
      severity: "positive",
    });
  }

  if (
    meets(ageAppropriateRate, 90) &&
    childEngagedRate >= 90 &&
    totalAgeGuidanceRecords > 0
  ) {
    insights.push({
      text: `Age-appropriate guidance at ${ageAppropriateRate}% with ${childEngagedRate}% child engagement -- children are receiving well-tailored, sensitively delivered guidance that successfully engages them in understanding their personal hygiene and continence needs.`,
      severity: "positive",
    });
  }

  if (
    meets(productProvisionRate, 90) &&
    easyAccessRate >= 90 &&
    totalProductProvisionRecords > 0
  ) {
    insights.push({
      text: `Product provision at ${productProvisionRate}% with ${easyAccessRate}% easy access for children -- products are consistently available, suitable, and accessible in a way that promotes children's independence and preserves their dignity.`,
      severity: "positive",
    });
  }

  if (
    childIndependenceRate >= 90 &&
    totalIndependenceDenom > 0
  ) {
    insights.push({
      text: `Child independence at ${childIndependenceRate}% -- children are genuinely involved in decisions about their personal hygiene and continence support. They are consulted on care plans, offered choices about products, and encouraged to develop self-care skills. This person-centred approach supports children's confidence and prepares them for greater independence.`,
      severity: "positive",
    });
  }

  if (
    guidanceChildCoverage >= 100 &&
    total_children > 0 &&
    totalAgeGuidanceRecords > 0
  ) {
    insights.push({
      text: "Every child has received age-appropriate hygiene and continence guidance -- the home ensures that personal care education is an inclusive, universal part of children's development. This proactive approach supports all children, not just those with identified continence needs.",
      severity: "positive",
    });
  }

  if (
    confidentialityRate >= 95 &&
    secureRecordRate >= 95 &&
    totalContinencePlans > 0
  ) {
    insights.push({
      text: `Confidentiality at ${confidentialityRate}% with ${secureRecordRate}% secure record-keeping -- the home demonstrates outstanding data protection practice around children's most sensitive personal information. This protects children from potential embarrassment and meets statutory data protection requirements.`,
      severity: "positive",
    });
  }

  if (
    culturalNeedsRate >= 90 &&
    sensoryRate >= 90 &&
    totalHygieneRoutines > 0
  ) {
    insights.push({
      text: `Cultural needs met in ${culturalNeedsRate}% and sensory needs considered in ${sensoryRate}% of hygiene routines -- the home demonstrates inclusive, person-centred care that respects each child's cultural background and sensory profile in personal hygiene support.`,
      severity: "positive",
    });
  }

  // -- Headline ---------------------------------------------------------------

  let headline: string;

  if (hygiene_rating === "outstanding") {
    headline =
      "Outstanding continence and personal hygiene support -- plans are comprehensive, hygiene routines are dignified, age-appropriate guidance is effective, and products are well-provisioned with consistent respect for children's privacy and independence.";
  } else if (hygiene_rating === "good") {
    headline = `Good continence and personal hygiene support -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (hygiene_rating === "adequate") {
    headline = `Adequate continence and personal hygiene support -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure dignified, personalised continence management and hygiene support for all children.`;
  } else {
    headline = `Continence and personal hygiene support is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve continence management, dignity in care, and personal hygiene support for children.`;
  }

  // -- Return -----------------------------------------------------------------

  return {
    hygiene_rating,
    hygiene_score: score,
    headline,
    total_continence_plans: totalContinencePlans,
    total_hygiene_routines: totalHygieneRoutines,
    total_dignity_care_records: totalDignityCareRecords,
    total_age_guidance_records: totalAgeGuidanceRecords,
    total_product_provision_records: totalProductProvisionRecords,
    continence_plan_rate: continencePlanRate,
    hygiene_routine_rate: hygieneRoutineRate,
    dignity_compliance_rate: dignityComplianceRate,
    age_appropriate_rate: ageAppropriateRate,
    product_provision_rate: productProvisionRate,
    child_independence_rate: childIndependenceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
