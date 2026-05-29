// ==============================================================================
// CORNERSTONE -- HOME MENSTRUATION & PUBERTY SUPPORT INTELLIGENCE ENGINE
// Monitors puberty education delivery, menstruation support provision,
// product availability, dignity in puberty care, and age-appropriate body
// confidence building across the home.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging, activities, hobbies, needs), Reg 14 (Health care),
// Reg 7 (Child's plan), SCCIF "Health and wellbeing".
// Store keys: pubertyEducationRecords, menstruationSupportRecords,
//             productAvailabilityRecords, dignityCareRecords,
//             bodyConfidenceRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface PubertyEducationRecordInput {
  id: string;
  child_id: string;
  date: string;
  topic:
    | "physical_changes"
    | "emotional_changes"
    | "menstruation"
    | "hygiene"
    | "consent_boundaries"
    | "relationships"
    | "body_image"
    | "reproductive_health"
    | "gender_identity"
    | "other";
  delivery_method:
    | "one_to_one"
    | "group_session"
    | "keywork_session"
    | "external_professional"
    | "printed_resource"
    | "online_resource"
    | "peer_led"
    | "other";
  age_appropriate: boolean;
  child_engaged: boolean;
  child_understanding_demonstrated: boolean;
  staff_confident: boolean;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  child_satisfaction: number; // 1-5
  cultural_sensitivity_considered: boolean;
  parent_carer_informed: boolean;
  notes: string;
  created_at: string;
}

export interface MenstruationSupportRecordInput {
  id: string;
  child_id: string;
  date: string;
  support_type:
    | "first_period_support"
    | "ongoing_management"
    | "pain_management"
    | "emotional_support"
    | "product_guidance"
    | "medical_referral"
    | "hygiene_support"
    | "cycle_tracking"
    | "other";
  support_provided: boolean;
  staff_responsive: boolean;
  response_timely: boolean;
  child_comfort_level: number; // 1-5
  privacy_maintained: boolean;
  preferred_staff_available: boolean;
  medical_needs_addressed: boolean;
  pain_managed_effectively: boolean;
  school_absence_due_to_period: boolean;
  school_absence_managed: boolean;
  child_voice_captured: boolean;
  notes: string;
  created_at: string;
}

export interface ProductAvailabilityRecordInput {
  id: string;
  date: string;
  product_type:
    | "pads"
    | "tampons"
    | "period_underwear"
    | "menstrual_cup"
    | "pain_relief"
    | "hot_water_bottle"
    | "hygiene_products"
    | "disposal_bags"
    | "spare_clothing"
    | "other";
  available: boolean;
  accessible_location: boolean;
  discreet_access: boolean;
  variety_offered: boolean;
  child_choice_respected: boolean;
  stock_adequate: boolean;
  last_stock_check_date: string | null;
  budget_allocated: boolean;
  notes: string;
  created_at: string;
}

export interface DignityCareRecordInput {
  id: string;
  child_id: string;
  date: string;
  context:
    | "menstruation"
    | "bathing"
    | "dressing"
    | "medical_appointment"
    | "physical_changes_discussion"
    | "personal_shopping"
    | "other";
  privacy_respected: boolean;
  child_preferences_followed: boolean;
  gender_appropriate_staff: boolean;
  embarrassment_minimised: boolean;
  child_felt_comfortable: boolean;
  child_satisfaction: number; // 1-5
  dignity_concern_raised: boolean;
  dignity_concern_resolved: boolean;
  cultural_needs_met: boolean;
  notes: string;
  created_at: string;
}

export interface BodyConfidenceRecordInput {
  id: string;
  child_id: string;
  date: string;
  activity_type:
    | "positive_body_talk"
    | "self_esteem_session"
    | "media_literacy"
    | "healthy_lifestyle"
    | "peer_support"
    | "therapeutic_intervention"
    | "physical_activity"
    | "personal_care_routine"
    | "identity_exploration"
    | "other";
  age_appropriate: boolean;
  child_engaged: boolean;
  positive_outcome_observed: boolean;
  staff_modelled_positive_behaviour: boolean;
  child_self_assessment: number; // 1-5
  concerns_identified: boolean;
  concerns_actioned: boolean;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  notes: string;
  created_at: string;
}

export interface MenstruationPubertyInput {
  today: string;
  total_children: number;
  puberty_education_records: PubertyEducationRecordInput[];
  menstruation_support_records: MenstruationSupportRecordInput[];
  product_availability_records: ProductAvailabilityRecordInput[];
  dignity_care_records: DignityCareRecordInput[];
  body_confidence_records: BodyConfidenceRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type MenstruationPubertyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MenstruationPubertyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface MenstruationPubertyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface MenstruationPubertyResult {
  puberty_rating: MenstruationPubertyRating;
  puberty_score: number;
  headline: string;
  puberty_education_rate: number;
  menstruation_support_rate: number;
  product_availability_rate: number;
  dignity_care_rate: number;
  body_confidence_rate: number;
  child_comfort_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: MenstruationPubertyRecommendation[];
  insights: MenstruationPubertyInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MenstruationPubertyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: MenstruationPubertyRating,
  score: number,
  headline: string,
): MenstruationPubertyResult {
  return {
    puberty_rating: rating,
    puberty_score: score,
    headline,
    puberty_education_rate: 0,
    menstruation_support_rate: 0,
    product_availability_rate: 0,
    dignity_care_rate: 0,
    body_confidence_rate: 0,
    child_comfort_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeMenstruationPubertySupport(
  input: MenstruationPubertyInput,
): MenstruationPubertyResult {
  const {
    total_children,
    puberty_education_records,
    menstruation_support_records,
    product_availability_records,
    dignity_care_records,
    body_confidence_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    puberty_education_records.length === 0 &&
    menstruation_support_records.length === 0 &&
    product_availability_records.length === 0 &&
    dignity_care_records.length === 0 &&
    body_confidence_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess menstruation and puberty support.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No menstruation or puberty support data recorded despite children on placement -- puberty education, menstruation support, product availability, dignity care, and body confidence building require urgent attention.",
      ),
      concerns: [
        "No puberty education, menstruation support, product availability, dignity care, or body confidence records exist despite children being on placement -- the home cannot evidence any structured support for children going through puberty.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of puberty education delivery, menstruation support, product availability, dignity in puberty care, and body confidence activities to evidence the home's commitment to supporting children through puberty with dignity and sensitivity.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 -- Health care",
        },
        {
          rank: 2,
          recommendation:
            "Assess every child's puberty-related needs and ensure age-appropriate education and support arrangements are in place, documented in their care plan, and regularly reviewed.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
        },
      ],
      insights: [
        {
          text: "The complete absence of menstruation and puberty support records means Ofsted cannot verify that children's puberty-related health and wellbeing needs are being met. This represents a fundamental gap in Reg 14 compliance and the home's duty to provide age-appropriate health care and education.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Puberty education delivery ---
  const totalEducationRecords = puberty_education_records.length;
  const ageAppropriateEducation = puberty_education_records.filter((r) => r.age_appropriate).length;
  const ageAppropriateRate = pct(ageAppropriateEducation, totalEducationRecords);

  const childEngagedEducation = puberty_education_records.filter((r) => r.child_engaged).length;
  const engagementRate = pct(childEngagedEducation, totalEducationRecords);

  const understandingDemonstrated = puberty_education_records.filter(
    (r) => r.child_understanding_demonstrated,
  ).length;
  const understandingRate = pct(understandingDemonstrated, totalEducationRecords);

  const staffConfident = puberty_education_records.filter((r) => r.staff_confident).length;
  const staffConfidenceRate = pct(staffConfident, totalEducationRecords);

  const followUpPlanned = puberty_education_records.filter((r) => r.follow_up_planned).length;
  const followUpCompleted = puberty_education_records.filter((r) => r.follow_up_completed).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpPlanned);

  const educationSatisfactionSum = puberty_education_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const educationSatisfactionAvg =
    totalEducationRecords > 0
      ? Math.round((educationSatisfactionSum / totalEducationRecords) * 100) / 100
      : 0;

  const culturalSensitivity = puberty_education_records.filter(
    (r) => r.cultural_sensitivity_considered,
  ).length;
  const culturalSensitivityRate = pct(culturalSensitivity, totalEducationRecords);

  const parentInformed = puberty_education_records.filter((r) => r.parent_carer_informed).length;
  const parentInformedRate = pct(parentInformed, totalEducationRecords);

  const uniqueChildrenEducated = new Set(
    puberty_education_records.map((r) => r.child_id),
  ).size;

  // Puberty education composite rate
  const pubertyEducationRate =
    totalEducationRecords > 0
      ? Math.round((ageAppropriateRate + engagementRate + understandingRate) / 3)
      : 0;

  // --- Menstruation support provision ---
  const totalMenstruationRecords = menstruation_support_records.length;
  const supportProvided = menstruation_support_records.filter((r) => r.support_provided).length;
  const supportProvidedRate = pct(supportProvided, totalMenstruationRecords);

  const staffResponsive = menstruation_support_records.filter((r) => r.staff_responsive).length;
  const staffResponsiveRate = pct(staffResponsive, totalMenstruationRecords);

  const responseTimely = menstruation_support_records.filter((r) => r.response_timely).length;
  const timelyResponseRate = pct(responseTimely, totalMenstruationRecords);

  const privacyMaintained = menstruation_support_records.filter((r) => r.privacy_maintained).length;
  const privacyRate = pct(privacyMaintained, totalMenstruationRecords);

  const preferredStaffAvailable = menstruation_support_records.filter(
    (r) => r.preferred_staff_available,
  ).length;
  const preferredStaffRate = pct(preferredStaffAvailable, totalMenstruationRecords);

  const medicalNeedsAddressed = menstruation_support_records.filter(
    (r) => r.medical_needs_addressed,
  ).length;
  const medicalAddressedRate = pct(medicalNeedsAddressed, totalMenstruationRecords);

  const painManaged = menstruation_support_records.filter(
    (r) => r.pain_managed_effectively,
  ).length;
  const painManagedRate = pct(painManaged, totalMenstruationRecords);

  const menstruationComfortSum = menstruation_support_records.reduce(
    (sum, r) => sum + r.child_comfort_level, 0,
  );
  const menstruationComfortAvg =
    totalMenstruationRecords > 0
      ? Math.round((menstruationComfortSum / totalMenstruationRecords) * 100) / 100
      : 0;

  const schoolAbsenceDueToPeriod = menstruation_support_records.filter(
    (r) => r.school_absence_due_to_period,
  ).length;
  const schoolAbsenceManaged = menstruation_support_records.filter(
    (r) => r.school_absence_due_to_period && r.school_absence_managed,
  ).length;
  const schoolAbsenceManagedRate = pct(schoolAbsenceManaged, schoolAbsenceDueToPeriod);

  const menstruationVoiceCaptured = menstruation_support_records.filter(
    (r) => r.child_voice_captured,
  ).length;
  const menstruationVoiceRate = pct(menstruationVoiceCaptured, totalMenstruationRecords);

  const uniqueChildrenSupported = new Set(
    menstruation_support_records.map((r) => r.child_id),
  ).size;

  // Menstruation support composite rate
  const menstruationSupportRate =
    totalMenstruationRecords > 0
      ? Math.round((supportProvidedRate + staffResponsiveRate + privacyRate) / 3)
      : 0;

  // --- Product availability ---
  const totalProductRecords = product_availability_records.length;
  const productsAvailable = product_availability_records.filter((r) => r.available).length;
  const productAvailableRate = pct(productsAvailable, totalProductRecords);

  const accessibleLocation = product_availability_records.filter(
    (r) => r.accessible_location,
  ).length;
  const accessibleLocationRate = pct(accessibleLocation, totalProductRecords);

  const discreetAccess = product_availability_records.filter((r) => r.discreet_access).length;
  const discreetAccessRate = pct(discreetAccess, totalProductRecords);

  const varietyOffered = product_availability_records.filter((r) => r.variety_offered).length;
  const varietyRate = pct(varietyOffered, totalProductRecords);

  const childChoiceRespected = product_availability_records.filter(
    (r) => r.child_choice_respected,
  ).length;
  const choiceRespectedRate = pct(childChoiceRespected, totalProductRecords);

  const stockAdequate = product_availability_records.filter((r) => r.stock_adequate).length;
  const stockAdequateRate = pct(stockAdequate, totalProductRecords);

  const budgetAllocated = product_availability_records.filter((r) => r.budget_allocated).length;
  const budgetAllocatedRate = pct(budgetAllocated, totalProductRecords);

  // Product availability composite rate
  const productAvailabilityRate =
    totalProductRecords > 0
      ? Math.round((productAvailableRate + accessibleLocationRate + discreetAccessRate) / 3)
      : 0;

  // --- Dignity in puberty care ---
  const totalDignityRecords = dignity_care_records.length;
  const privacyRespectedDignity = dignity_care_records.filter((r) => r.privacy_respected).length;
  const dignityPrivacyRate = pct(privacyRespectedDignity, totalDignityRecords);

  const preferencesFollowed = dignity_care_records.filter(
    (r) => r.child_preferences_followed,
  ).length;
  const preferencesFollowedRate = pct(preferencesFollowed, totalDignityRecords);

  const genderAppropriateStaff = dignity_care_records.filter(
    (r) => r.gender_appropriate_staff,
  ).length;
  const genderAppropriateRate = pct(genderAppropriateStaff, totalDignityRecords);

  const embarrassmentMinimised = dignity_care_records.filter(
    (r) => r.embarrassment_minimised,
  ).length;
  const embarrassmentMinimisedRate = pct(embarrassmentMinimised, totalDignityRecords);

  const childFeltComfortable = dignity_care_records.filter(
    (r) => r.child_felt_comfortable,
  ).length;
  const comfortableRate = pct(childFeltComfortable, totalDignityRecords);

  const dignitySatisfactionSum = dignity_care_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const dignitySatisfactionAvg =
    totalDignityRecords > 0
      ? Math.round((dignitySatisfactionSum / totalDignityRecords) * 100) / 100
      : 0;

  const dignityConcernsRaised = dignity_care_records.filter(
    (r) => r.dignity_concern_raised,
  ).length;
  const dignityConcernsResolved = dignity_care_records.filter(
    (r) => r.dignity_concern_raised && r.dignity_concern_resolved,
  ).length;
  const dignityConcernResolutionRate = pct(dignityConcernsResolved, dignityConcernsRaised);

  const culturalNeedsMet = dignity_care_records.filter((r) => r.cultural_needs_met).length;
  const culturalNeedsMetRate = pct(culturalNeedsMet, totalDignityRecords);

  // Dignity care composite rate
  const dignityCareRate =
    totalDignityRecords > 0
      ? Math.round((dignityPrivacyRate + preferencesFollowedRate + comfortableRate) / 3)
      : 0;

  // --- Body confidence building ---
  const totalBodyConfidenceRecords = body_confidence_records.length;
  const bcAgeAppropriate = body_confidence_records.filter((r) => r.age_appropriate).length;
  const bcAgeAppropriateRate = pct(bcAgeAppropriate, totalBodyConfidenceRecords);

  const bcChildEngaged = body_confidence_records.filter((r) => r.child_engaged).length;
  const bcEngagementRate = pct(bcChildEngaged, totalBodyConfidenceRecords);

  const positiveOutcome = body_confidence_records.filter(
    (r) => r.positive_outcome_observed,
  ).length;
  const positiveOutcomeRate = pct(positiveOutcome, totalBodyConfidenceRecords);

  const staffModelled = body_confidence_records.filter(
    (r) => r.staff_modelled_positive_behaviour,
  ).length;
  const staffModelledRate = pct(staffModelled, totalBodyConfidenceRecords);

  const bcSelfAssessmentSum = body_confidence_records.reduce(
    (sum, r) => sum + r.child_self_assessment, 0,
  );
  const bcSelfAssessmentAvg =
    totalBodyConfidenceRecords > 0
      ? Math.round((bcSelfAssessmentSum / totalBodyConfidenceRecords) * 100) / 100
      : 0;

  const bcConcernsIdentified = body_confidence_records.filter(
    (r) => r.concerns_identified,
  ).length;
  const bcConcernsActioned = body_confidence_records.filter(
    (r) => r.concerns_identified && r.concerns_actioned,
  ).length;
  const bcConcernActionRate = pct(bcConcernsActioned, bcConcernsIdentified);

  const bcFollowUpPlanned = body_confidence_records.filter((r) => r.follow_up_planned).length;
  const bcFollowUpCompleted = body_confidence_records.filter((r) => r.follow_up_completed).length;
  const bcFollowUpCompletionRate = pct(bcFollowUpCompleted, bcFollowUpPlanned);

  const uniqueChildrenBodyConfidence = new Set(
    body_confidence_records.map((r) => r.child_id),
  ).size;

  // Body confidence composite rate
  const bodyConfidenceRate =
    totalBodyConfidenceRecords > 0
      ? Math.round((bcAgeAppropriateRate + bcEngagementRate + positiveOutcomeRate) / 3)
      : 0;

  // --- Child comfort composite ---
  // Blends menstruation comfort, dignity comfort, and education satisfaction
  const comfortNumerator =
    (totalMenstruationRecords > 0 ? menstruationComfortAvg : 0) +
    (totalDignityRecords > 0 ? dignitySatisfactionAvg : 0) +
    (totalEducationRecords > 0 ? educationSatisfactionAvg : 0);
  const comfortDenominator =
    (totalMenstruationRecords > 0 ? 1 : 0) +
    (totalDignityRecords > 0 ? 1 : 0) +
    (totalEducationRecords > 0 ? 1 : 0);
  const avgComfortScore =
    comfortDenominator > 0
      ? Math.round((comfortNumerator / comfortDenominator) * 100) / 100
      : 0;
  const childComfortRate = comfortDenominator > 0 ? Math.round((avgComfortScore / 5) * 100) : 0;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: pubertyEducationRate (>=90: +4, >=70: +2) ---
  if (pubertyEducationRate >= 90) score += 4;
  else if (pubertyEducationRate >= 70) score += 2;

  // --- Bonus 2: menstruationSupportRate (>=90: +4, >=70: +2) ---
  if (menstruationSupportRate >= 90) score += 4;
  else if (menstruationSupportRate >= 70) score += 2;

  // --- Bonus 3: productAvailabilityRate (>=95: +4, >=80: +2) ---
  if (productAvailabilityRate >= 95) score += 4;
  else if (productAvailabilityRate >= 80) score += 2;

  // --- Bonus 4: dignityCareRate (>=90: +4, >=70: +2) ---
  if (dignityCareRate >= 90) score += 4;
  else if (dignityCareRate >= 70) score += 2;

  // --- Bonus 5: bodyConfidenceRate (>=80: +3, >=60: +1) ---
  if (bodyConfidenceRate >= 80) score += 3;
  else if (bodyConfidenceRate >= 60) score += 1;

  // --- Bonus 6: childComfortRate (>=80: +3, >=60: +1) ---
  if (childComfortRate >= 80) score += 3;
  else if (childComfortRate >= 60) score += 1;

  // --- Bonus 7: staffConfidenceRate (>=90: +3, >=70: +1) ---
  if (staffConfidenceRate >= 90) score += 3;
  else if (staffConfidenceRate >= 70) score += 1;

  // --- Bonus 8: culturalSensitivityRate (>=90: +2, >=70: +1) ---
  if (culturalSensitivityRate >= 90) score += 2;
  else if (culturalSensitivityRate >= 70) score += 1;

  // --- Bonus 9: staffModelledRate (>=80: +3, >=60: +1) ---
  if (staffModelledRate >= 80) score += 3;
  else if (staffModelledRate >= 60) score += 1;

  // --- Bonus 10: painManagedRate (>=90: +2, >=70: +1) ---
  if (painManagedRate >= 90) score += 2;
  else if (painManagedRate >= 70) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // pubertyEducationRate < 50 -> -5
  if (pubertyEducationRate < 50 && totalEducationRecords > 0) score -= 5;

  // menstruationSupportRate < 50 -> -5
  if (menstruationSupportRate < 50 && totalMenstruationRecords > 0) score -= 5;

  // productAvailabilityRate < 50 -> -5
  if (productAvailabilityRate < 50 && totalProductRecords > 0) score -= 5;

  // dignityCareRate < 50 -> -4
  if (dignityCareRate < 50 && totalDignityRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const puberty_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (pubertyEducationRate >= 90 && totalEducationRecords > 0) {
    strengths.push(
      `Puberty education rate at ${pubertyEducationRate}% -- the home delivers outstanding age-appropriate puberty education with strong child engagement and demonstrated understanding.`,
    );
  } else if (pubertyEducationRate >= 70 && totalEducationRecords > 0) {
    strengths.push(
      `Puberty education rate at ${pubertyEducationRate}% -- good delivery of age-appropriate puberty education with children generally engaging well.`,
    );
  }

  if (ageAppropriateRate >= 95 && totalEducationRecords > 0) {
    strengths.push(
      `${ageAppropriateRate}% of puberty education sessions are age-appropriate -- content is carefully tailored to each child's developmental stage.`,
    );
  }

  if (staffConfidenceRate >= 90 && totalEducationRecords > 0) {
    strengths.push(
      `Staff demonstrate confidence in ${staffConfidenceRate}% of puberty education sessions -- staff are well trained and comfortable delivering sensitive puberty-related content.`,
    );
  }

  if (educationSatisfactionAvg >= 4.0 && totalEducationRecords > 0) {
    strengths.push(
      `Children's satisfaction with puberty education averages ${educationSatisfactionAvg}/5 -- children feel well supported and informed about puberty-related changes.`,
    );
  }

  if (culturalSensitivityRate >= 90 && totalEducationRecords > 0) {
    strengths.push(
      `Cultural sensitivity considered in ${culturalSensitivityRate}% of puberty education -- the home respects and accommodates diverse cultural perspectives on puberty and menstruation.`,
    );
  }

  if (understandingRate >= 80 && totalEducationRecords > 0) {
    strengths.push(
      `Children demonstrate understanding in ${understandingRate}% of puberty education sessions -- education is effective in building knowledge and confidence.`,
    );
  }

  if (menstruationSupportRate >= 90 && totalMenstruationRecords > 0) {
    strengths.push(
      `Menstruation support rate at ${menstruationSupportRate}% -- the home provides outstanding, responsive menstruation support with strong privacy practices.`,
    );
  } else if (menstruationSupportRate >= 70 && totalMenstruationRecords > 0) {
    strengths.push(
      `Menstruation support rate at ${menstruationSupportRate}% -- good provision of menstruation support with appropriate staff responsiveness and privacy.`,
    );
  }

  if (supportProvidedRate >= 95 && totalMenstruationRecords > 0) {
    strengths.push(
      `Menstruation support provided in ${supportProvidedRate}% of recorded instances -- children consistently receive the support they need during their periods.`,
    );
  }

  if (staffResponsiveRate >= 90 && totalMenstruationRecords > 0) {
    strengths.push(
      `Staff responsive in ${staffResponsiveRate}% of menstruation support instances -- staff react sensitively and promptly to children's menstruation needs.`,
    );
  }

  if (timelyResponseRate >= 90 && totalMenstruationRecords > 0) {
    strengths.push(
      `Timely response in ${timelyResponseRate}% of menstruation support instances -- children do not have to wait for help when they need it.`,
    );
  }

  if (privacyRate >= 95 && totalMenstruationRecords > 0) {
    strengths.push(
      `Privacy maintained in ${privacyRate}% of menstruation support instances -- children's dignity is consistently protected during intimate care.`,
    );
  }

  if (painManagedRate >= 90 && totalMenstruationRecords > 0) {
    strengths.push(
      `Pain managed effectively in ${painManagedRate}% of menstruation support instances -- children's physical comfort is prioritised during menstruation.`,
    );
  }

  if (menstruationComfortAvg >= 4.0 && totalMenstruationRecords > 0) {
    strengths.push(
      `Children's comfort level with menstruation support averages ${menstruationComfortAvg}/5 -- children feel at ease seeking and receiving menstruation support.`,
    );
  }

  if (productAvailabilityRate >= 95 && totalProductRecords > 0) {
    strengths.push(
      `Product availability rate at ${productAvailabilityRate}% -- menstruation products are consistently available, accessible, and discreetly located.`,
    );
  } else if (productAvailabilityRate >= 80 && totalProductRecords > 0) {
    strengths.push(
      `Product availability rate at ${productAvailabilityRate}% -- good availability and access to menstruation products throughout the home.`,
    );
  }

  if (discreetAccessRate >= 90 && totalProductRecords > 0) {
    strengths.push(
      `Discreet access to products in ${discreetAccessRate}% of checks -- children can access menstruation products without embarrassment.`,
    );
  }

  if (varietyRate >= 80 && totalProductRecords > 0) {
    strengths.push(
      `Product variety offered in ${varietyRate}% of checks -- children have real choice in menstruation products reflecting their individual preferences.`,
    );
  }

  if (choiceRespectedRate >= 90 && totalProductRecords > 0) {
    strengths.push(
      `Child choice respected in ${choiceRespectedRate}% of product provision -- children's preferences for specific products are consistently honoured.`,
    );
  }

  if (stockAdequateRate >= 90 && totalProductRecords > 0) {
    strengths.push(
      `Stock adequate in ${stockAdequateRate}% of checks -- the home maintains reliable supplies of menstruation products so children are never left without.`,
    );
  }

  if (dignityCareRate >= 90 && totalDignityRecords > 0) {
    strengths.push(
      `Dignity care rate at ${dignityCareRate}% -- outstanding protection of children's privacy, preferences, and comfort during puberty-related care.`,
    );
  } else if (dignityCareRate >= 70 && totalDignityRecords > 0) {
    strengths.push(
      `Dignity care rate at ${dignityCareRate}% -- good practice in protecting children's dignity during puberty-related care interactions.`,
    );
  }

  if (genderAppropriateRate >= 90 && totalDignityRecords > 0) {
    strengths.push(
      `Gender-appropriate staff available in ${genderAppropriateRate}% of dignity care interactions -- children have access to staff they feel comfortable with during sensitive care.`,
    );
  }

  if (embarrassmentMinimisedRate >= 90 && totalDignityRecords > 0) {
    strengths.push(
      `Embarrassment minimised in ${embarrassmentMinimisedRate}% of dignity care interactions -- staff demonstrate sensitivity and skill in reducing children's discomfort.`,
    );
  }

  if (dignitySatisfactionAvg >= 4.0 && totalDignityRecords > 0) {
    strengths.push(
      `Children's satisfaction with dignity care averages ${dignitySatisfactionAvg}/5 -- children feel their privacy and dignity are respected.`,
    );
  }

  if (culturalNeedsMetRate >= 90 && totalDignityRecords > 0) {
    strengths.push(
      `Cultural needs met in ${culturalNeedsMetRate}% of dignity care interactions -- the home accommodates diverse cultural expectations around puberty and modesty.`,
    );
  }

  if (bodyConfidenceRate >= 80 && totalBodyConfidenceRecords > 0) {
    strengths.push(
      `Body confidence rate at ${bodyConfidenceRate}% -- the home delivers effective, age-appropriate body confidence activities with strong child engagement and positive outcomes.`,
    );
  } else if (bodyConfidenceRate >= 60 && totalBodyConfidenceRecords > 0) {
    strengths.push(
      `Body confidence rate at ${bodyConfidenceRate}% -- good progress in body confidence building with children generally engaging positively.`,
    );
  }

  if (positiveOutcomeRate >= 80 && totalBodyConfidenceRecords > 0) {
    strengths.push(
      `Positive outcomes observed in ${positiveOutcomeRate}% of body confidence activities -- activities are making a measurable difference to children's self-esteem and body image.`,
    );
  }

  if (staffModelledRate >= 80 && totalBodyConfidenceRecords > 0) {
    strengths.push(
      `Staff model positive body image in ${staffModelledRate}% of activities -- staff consistently demonstrate healthy attitudes that reinforce children's body confidence.`,
    );
  }

  if (bcSelfAssessmentAvg >= 4.0 && totalBodyConfidenceRecords > 0) {
    strengths.push(
      `Children's body confidence self-assessment averages ${bcSelfAssessmentAvg}/5 -- children report feeling good about their bodies and physical development.`,
    );
  }

  if (bcConcernActionRate >= 90 && bcConcernsIdentified > 0) {
    strengths.push(
      `${bcConcernActionRate}% of body confidence concerns actioned -- the home responds effectively when body image issues are identified.`,
    );
  }

  if (followUpCompletionRate >= 80 && followUpPlanned > 0) {
    strengths.push(
      `${followUpCompletionRate}% of puberty education follow-ups completed -- the home demonstrates commitment to ongoing, sustained puberty education.`,
    );
  }

  if (preferredStaffRate >= 80 && totalMenstruationRecords > 0) {
    strengths.push(
      `Preferred staff available in ${preferredStaffRate}% of menstruation support instances -- children can access the specific staff they trust for intimate care.`,
    );
  }

  if (schoolAbsenceManagedRate >= 90 && schoolAbsenceDueToPeriod > 0) {
    strengths.push(
      `${schoolAbsenceManagedRate}% of period-related school absences managed effectively -- the home ensures menstruation does not unnecessarily disrupt children's education.`,
    );
  }

  if (childComfortRate >= 80) {
    strengths.push(
      `Overall child comfort rate at ${childComfortRate}% -- children feel safe, supported, and comfortable across all puberty and menstruation care interactions.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (pubertyEducationRate < 50 && totalEducationRecords > 0) {
    concerns.push(
      `Puberty education rate at only ${pubertyEducationRate}% -- the majority of puberty education sessions are not age-appropriate, not engaging children, or not demonstrating understanding. Children are not receiving adequate preparation for puberty.`,
    );
  } else if (pubertyEducationRate >= 50 && pubertyEducationRate < 70 && totalEducationRecords > 0) {
    concerns.push(
      `Puberty education rate at ${pubertyEducationRate}% -- some puberty education sessions are not meeting the standard for age-appropriateness, engagement, or child understanding.`,
    );
  }

  if (ageAppropriateRate < 70 && totalEducationRecords > 0) {
    concerns.push(
      `Only ${ageAppropriateRate}% of puberty education sessions rated age-appropriate -- children may be receiving content that is too advanced or too basic for their developmental stage.`,
    );
  }

  if (staffConfidenceRate < 60 && totalEducationRecords > 0) {
    concerns.push(
      `Staff confidence in only ${staffConfidenceRate}% of puberty education sessions -- staff may lack the training or comfort to deliver sensitive puberty-related content effectively.`,
    );
  }

  if (educationSatisfactionAvg < 3.0 && totalEducationRecords > 0) {
    concerns.push(
      `Children's satisfaction with puberty education averages only ${educationSatisfactionAvg}/5 -- children do not feel well supported in understanding puberty.`,
    );
  }

  if (culturalSensitivityRate < 60 && totalEducationRecords > 0) {
    concerns.push(
      `Cultural sensitivity considered in only ${culturalSensitivityRate}% of puberty education -- the home may not be adequately accommodating diverse cultural perspectives on puberty and menstruation.`,
    );
  }

  if (menstruationSupportRate < 50 && totalMenstruationRecords > 0) {
    concerns.push(
      `Menstruation support rate at only ${menstruationSupportRate}% -- the majority of menstruation support interactions are failing in provision, staff responsiveness, or privacy. Children are not receiving adequate care during their periods.`,
    );
  } else if (menstruationSupportRate >= 50 && menstruationSupportRate < 70 && totalMenstruationRecords > 0) {
    concerns.push(
      `Menstruation support rate at ${menstruationSupportRate}% -- some aspects of menstruation care need improvement in support provision, staff responsiveness, or privacy.`,
    );
  }

  if (supportProvidedRate < 70 && totalMenstruationRecords > 0) {
    concerns.push(
      `Menstruation support provided in only ${supportProvidedRate}% of recorded instances -- children are not consistently receiving the help they need during their periods.`,
    );
  }

  if (privacyRate < 80 && totalMenstruationRecords > 0) {
    concerns.push(
      `Privacy maintained in only ${privacyRate}% of menstruation support instances -- children's dignity is not being consistently protected during intimate care.`,
    );
  }

  if (painManagedRate < 60 && totalMenstruationRecords > 0) {
    concerns.push(
      `Pain managed effectively in only ${painManagedRate}% of instances -- children are experiencing avoidable discomfort during menstruation due to inadequate pain management.`,
    );
  }

  if (menstruationComfortAvg < 3.0 && totalMenstruationRecords > 0) {
    concerns.push(
      `Children's comfort with menstruation support averages only ${menstruationComfortAvg}/5 -- children feel uncomfortable or embarrassed seeking menstruation support.`,
    );
  }

  if (productAvailabilityRate < 50 && totalProductRecords > 0) {
    concerns.push(
      `Product availability rate at only ${productAvailabilityRate}% -- menstruation products are not consistently available, accessible, or discreetly located. Children may be left without essential products.`,
    );
  } else if (productAvailabilityRate >= 50 && productAvailabilityRate < 80 && totalProductRecords > 0) {
    concerns.push(
      `Product availability rate at ${productAvailabilityRate}% -- gaps exist in the availability, accessibility, or discreet placement of menstruation products.`,
    );
  }

  if (stockAdequateRate < 70 && totalProductRecords > 0) {
    concerns.push(
      `Stock adequate in only ${stockAdequateRate}% of checks -- the home is not maintaining reliable supplies of menstruation products, risking children being left without essential items.`,
    );
  }

  if (discreetAccessRate < 70 && totalProductRecords > 0) {
    concerns.push(
      `Discreet access to products in only ${discreetAccessRate}% of checks -- children may feel embarrassed accessing menstruation products due to their placement or visibility.`,
    );
  }

  if (varietyRate < 50 && totalProductRecords > 0) {
    concerns.push(
      `Product variety offered in only ${varietyRate}% of checks -- limited product choice restricts children's ability to manage their periods in ways that suit them.`,
    );
  }

  if (dignityCareRate < 50 && totalDignityRecords > 0) {
    concerns.push(
      `Dignity care rate at only ${dignityCareRate}% -- the majority of puberty-related care interactions are failing to protect children's privacy, respect their preferences, or ensure their comfort. This is a fundamental failure of dignity in care.`,
    );
  } else if (dignityCareRate >= 50 && dignityCareRate < 70 && totalDignityRecords > 0) {
    concerns.push(
      `Dignity care rate at ${dignityCareRate}% -- some puberty-related care interactions are not adequately protecting children's privacy, preferences, or comfort.`,
    );
  }

  if (genderAppropriateRate < 60 && totalDignityRecords > 0) {
    concerns.push(
      `Gender-appropriate staff available in only ${genderAppropriateRate}% of dignity care interactions -- children may not have access to staff they feel comfortable with for sensitive care.`,
    );
  }

  if (embarrassmentMinimisedRate < 70 && totalDignityRecords > 0) {
    concerns.push(
      `Embarrassment minimised in only ${embarrassmentMinimisedRate}% of dignity care interactions -- staff may lack the skills or awareness to reduce children's discomfort during sensitive care.`,
    );
  }

  if (dignitySatisfactionAvg < 3.0 && totalDignityRecords > 0) {
    concerns.push(
      `Children's satisfaction with dignity care averages only ${dignitySatisfactionAvg}/5 -- children do not feel their privacy and dignity are adequately respected.`,
    );
  }

  if (dignityConcernsRaised > 0 && dignityConcernResolutionRate < 70) {
    concerns.push(
      `Only ${dignityConcernResolutionRate}% of dignity concerns resolved -- children have raised concerns about their dignity that have not been adequately addressed.`,
    );
  }

  if (bodyConfidenceRate < 50 && totalBodyConfidenceRecords > 0) {
    concerns.push(
      `Body confidence rate at only ${bodyConfidenceRate}% -- body confidence activities are not age-appropriate, not engaging children, or not producing positive outcomes.`,
    );
  } else if (bodyConfidenceRate >= 50 && bodyConfidenceRate < 60 && totalBodyConfidenceRecords > 0) {
    concerns.push(
      `Body confidence rate at ${bodyConfidenceRate}% -- body confidence building needs strengthening in age-appropriateness, engagement, or outcomes.`,
    );
  }

  if (bcSelfAssessmentAvg < 3.0 && totalBodyConfidenceRecords > 0) {
    concerns.push(
      `Children's body confidence self-assessment averages only ${bcSelfAssessmentAvg}/5 -- children report low confidence in their bodies and physical development, indicating unmet needs.`,
    );
  }

  if (positiveOutcomeRate < 50 && totalBodyConfidenceRecords > 0) {
    concerns.push(
      `Positive outcomes observed in only ${positiveOutcomeRate}% of body confidence activities -- activities are not achieving their intended effect on children's self-esteem and body image.`,
    );
  }

  if (bcConcernsIdentified > 0 && bcConcernActionRate < 50) {
    concerns.push(
      `Only ${bcConcernActionRate}% of body confidence concerns actioned -- identified concerns about children's body image are not being addressed.`,
    );
  }

  if (totalEducationRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No puberty education records despite children being on placement -- the home may not be providing any structured puberty education to prepare children for the physical and emotional changes of puberty.",
    );
  }

  if (totalMenstruationRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No menstruation support records -- the home has not documented any menstruation support provision, making it impossible to evidence responsive, dignified menstrual care.",
    );
  }

  if (totalProductRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No product availability records -- the home has not documented whether menstruation products are available, accessible, or adequate for children's needs.",
    );
  }

  if (schoolAbsenceDueToPeriod > 0 && schoolAbsenceManagedRate < 50) {
    concerns.push(
      `Only ${schoolAbsenceManagedRate}% of period-related school absences managed -- menstruation is disrupting children's education and the home is not taking adequate steps to mitigate this.`,
    );
  }

  if (childComfortRate < 50 && comfortDenominator > 0) {
    concerns.push(
      `Overall child comfort rate at only ${childComfortRate}% -- children feel uncomfortable, embarrassed, or unsupported across puberty and menstruation care interactions.`,
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: MenstruationPubertyRecommendation[] = [];
  let rank = 0;

  if (pubertyEducationRate < 50 && totalEducationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and improve puberty education delivery -- ensure all sessions are age-appropriate, actively engage children, and include assessment of understanding. Provide staff training in delivering sensitive puberty content.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (menstruationSupportRate < 50 && totalMenstruationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately improve menstruation support provision -- ensure every child receives responsive, private, and timely support during their period. Review staff training, rota arrangements, and privacy protocols.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (productAvailabilityRate < 50 && totalProductRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure menstruation products are consistently available, accessible in discreet locations, and offered in sufficient variety to meet all children's preferences. Implement regular stock checks and allocate a dedicated budget.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging needs",
    });
  }

  if (dignityCareRate < 50 && totalDignityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address dignity failures in puberty care -- ensure all puberty-related interactions protect children's privacy, follow their preferences, and involve gender-appropriate staff. Implement dignity standards training for all staff.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (bodyConfidenceRate < 50 && totalBodyConfidenceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and deliver effective body confidence activities that are age-appropriate, engaging, and producing positive outcomes. Consider specialist support for children with significant body image concerns.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (childComfortRate < 50 && comfortDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise improving children's comfort across all puberty and menstruation interactions -- conduct child consultations to understand barriers to comfort and implement changes based on their feedback.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (staffConfidenceRate < 60 && totalEducationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide specialist training for all care staff on delivering puberty and menstruation education confidently and sensitively. Include practical strategies for managing difficult conversations.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (painManagedRate < 60 && totalMenstruationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review pain management approaches during menstruation -- ensure pain relief is readily available, hot water bottles and comfort items are accessible, and staff know how to offer effective support.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (privacyRate < 80 && totalMenstruationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen privacy protocols during menstruation support -- review physical environments, staff communication practices, and documentation to ensure children's dignity is consistently protected.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (culturalSensitivityRate < 60 && totalEducationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure puberty education is culturally sensitive for all children -- assess each child's cultural background and tailor education content and delivery to respect their family's values and beliefs about puberty.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging needs",
    });
  }

  if (genderAppropriateRate < 60 && totalDignityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review rota and staffing arrangements to ensure gender-appropriate staff are available for all puberty-related care interactions. Children must be able to choose which staff support them.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (stockAdequateRate < 70 && totalProductRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a regular stock-checking schedule for menstruation products and maintain adequate supplies at all times. Ensure the budget covers the full range of products children need.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging needs",
    });
  }

  if (discreetAccessRate < 70 && totalProductRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the placement of menstruation products to ensure children can access them discreetly without having to ask staff or access them in shared areas where they may feel embarrassed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging needs",
    });
  }

  if (pubertyEducationRate >= 50 && pubertyEducationRate < 70 && totalEducationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve puberty education quality to at least 70% -- review session content for age-appropriateness, explore new engagement methods, and assess children's understanding more consistently.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (menstruationSupportRate >= 50 && menstruationSupportRate < 70 && totalMenstruationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen menstruation support to at least 70% -- focus on improving staff responsiveness, ensuring privacy, and providing consistent direct support.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (dignityCareRate >= 50 && dignityCareRate < 70 && totalDignityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve dignity care practices during puberty-related interactions to at least 70% -- focus on following children's preferences, minimising embarrassment, and maintaining privacy.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (bodyConfidenceRate >= 50 && bodyConfidenceRate < 60 && totalBodyConfidenceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop body confidence activities further -- explore new approaches, seek specialist input, and ensure activities are consistently producing positive outcomes for children.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (bcConcernsIdentified > 0 && bcConcernActionRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address all identified body confidence concerns -- develop individual support plans for children with body image issues and consider referrals to specialist services where appropriate.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (dignityConcernsRaised > 0 && dignityConcernResolutionRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Resolve all outstanding dignity concerns raised by children -- implement a dignity concern tracking and resolution system with clear timescales and accountability.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (schoolAbsenceDueToPeriod > 0 && schoolAbsenceManagedRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a period management protocol that minimises school absence -- ensure children have pain relief, products, and support in school, and liaise with schools about period-positive policies.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalEducationRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement structured puberty education for all children -- develop an age-appropriate curriculum covering physical changes, emotional changes, menstruation, hygiene, relationships, and body confidence.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalMenstruationRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording menstruation support provision -- ensure every instance of menstruation support is documented to evidence responsive, dignified care.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalProductRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement regular product availability audits -- check availability, accessibility, stock levels, and variety of menstruation products on a systematic basis.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging needs",
    });
  }

  if (parentInformedRate < 50 && totalEducationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve communication with parents and carers about puberty education -- ensure families are informed and involved in supporting their child's puberty journey where appropriate.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (varietyRate < 50 && totalProductRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand the variety of menstruation products available -- consult children about their preferences and ensure a range of pads, tampons, period underwear, and other products are offered.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging needs",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: MenstruationPubertyInsight[] = [];

  // --- Critical insights ---

  if (pubertyEducationRate < 50 && totalEducationRecords > 0) {
    insights.push({
      text: `Puberty education rate at only ${pubertyEducationRate}%. Ofsted will view the failure to provide adequate puberty education as evidence that the home is not meeting children's health and development needs -- a direct failure under Reg 14.`,
      severity: "critical",
    });
  }

  if (menstruationSupportRate < 50 && totalMenstruationRecords > 0) {
    insights.push({
      text: `Menstruation support rate at only ${menstruationSupportRate}%. Failing to provide responsive, private, and adequate menstruation support is a fundamental care failure that undermines children's dignity, health, and wellbeing.`,
      severity: "critical",
    });
  }

  if (productAvailabilityRate < 50 && totalProductRecords > 0) {
    insights.push({
      text: `Product availability at only ${productAvailabilityRate}%. Children cannot manage their periods effectively without reliable access to products. This is a basic care provision failure that Ofsted will view as evidence of inadequate health care under Reg 14.`,
      severity: "critical",
    });
  }

  if (dignityCareRate < 50 && totalDignityRecords > 0) {
    insights.push({
      text: `Dignity care rate at only ${dignityCareRate}%. Children's privacy, preferences, and comfort are not being protected during puberty-related care. This represents a serious failure in Reg 14 compliance and risks significant emotional harm to vulnerable children.`,
      severity: "critical",
    });
  }

  if (totalEducationRecords === 0 && totalMenstruationRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No puberty education or menstruation support records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's puberty-related health needs have not been assessed, planned for, or supported -- this is a significant omission under Reg 14.",
      severity: "critical",
    });
  }

  if (bodyConfidenceRate < 50 && totalBodyConfidenceRecords > 0) {
    insights.push({
      text: `Body confidence rate at only ${bodyConfidenceRate}%. Children going through puberty need active support to develop a positive body image. Inadequate body confidence building can contribute to low self-esteem, mental health difficulties, and disordered eating.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (pubertyEducationRate >= 50 && pubertyEducationRate < 70 && totalEducationRecords > 0) {
    insights.push({
      text: `Puberty education rate at ${pubertyEducationRate}% -- improving but not yet consistently meeting children's needs. Each session that is not age-appropriate or fails to engage children represents a missed opportunity to prepare them for puberty.`,
      severity: "warning",
    });
  }

  if (menstruationSupportRate >= 50 && menstruationSupportRate < 70 && totalMenstruationRecords > 0) {
    insights.push({
      text: `Menstruation support rate at ${menstruationSupportRate}% -- while some support is in place, gaps in provision, responsiveness, or privacy mean not all children are receiving dignified menstrual care.`,
      severity: "warning",
    });
  }

  if (productAvailabilityRate >= 50 && productAvailabilityRate < 80 && totalProductRecords > 0) {
    insights.push({
      text: `Product availability at ${productAvailabilityRate}% -- while products are sometimes available, inconsistent accessibility or stock levels mean children cannot always rely on having what they need.`,
      severity: "warning",
    });
  }

  if (dignityCareRate >= 50 && dignityCareRate < 70 && totalDignityRecords > 0) {
    insights.push({
      text: `Dignity care at ${dignityCareRate}% -- some improvement needed to ensure all puberty-related interactions consistently protect children's privacy, preferences, and comfort.`,
      severity: "warning",
    });
  }

  if (bodyConfidenceRate >= 50 && bodyConfidenceRate < 80 && totalBodyConfidenceRecords > 0) {
    insights.push({
      text: `Body confidence rate at ${bodyConfidenceRate}% -- body confidence activities are partially effective but need strengthening to produce consistently positive outcomes for all children.`,
      severity: "warning",
    });
  }

  if (childComfortRate >= 50 && childComfortRate < 80 && comfortDenominator > 0) {
    insights.push({
      text: `Child comfort rate at ${childComfortRate}% -- some children feel comfortable with puberty and menstruation care but the experience is not yet consistently positive for all.`,
      severity: "warning",
    });
  }

  if (staffConfidenceRate >= 60 && staffConfidenceRate < 90 && totalEducationRecords > 0) {
    insights.push({
      text: `Staff confidence at ${staffConfidenceRate}% in puberty education delivery -- while some staff are comfortable, others may need additional training and support to deliver sensitive content effectively.`,
      severity: "warning",
    });
  }

  if (culturalSensitivityRate >= 60 && culturalSensitivityRate < 90 && totalEducationRecords > 0) {
    insights.push({
      text: `Cultural sensitivity at ${culturalSensitivityRate}% -- generally considered but not consistently applied. Every child's cultural background shapes how they experience puberty, and the home must accommodate these differences.`,
      severity: "warning",
    });
  }

  if (painManagedRate >= 60 && painManagedRate < 90 && totalMenstruationRecords > 0) {
    insights.push({
      text: `Pain management effective in ${painManagedRate}% of instances -- most children's pain is managed but some are experiencing avoidable discomfort during menstruation.`,
      severity: "warning",
    });
  }

  if (schoolAbsenceDueToPeriod > 0 && schoolAbsenceManagedRate >= 50 && schoolAbsenceManagedRate < 90) {
    insights.push({
      text: `Period-related school absence management at ${schoolAbsenceManagedRate}% -- some absences are well managed but the home could do more to ensure menstruation does not disrupt children's education.`,
      severity: "warning",
    });
  }

  if (followUpCompletionRate < 60 && followUpPlanned > 0) {
    insights.push({
      text: `Only ${followUpCompletionRate}% of puberty education follow-ups completed -- planned follow-up sessions are not being delivered, which undermines the continuity and impact of puberty education.`,
      severity: "warning",
    });
  }

  // --- Diversity insight ---
  const educationTopics = new Set(
    puberty_education_records.map((r) => r.topic).filter((t) => t),
  );
  const supportTypes = new Set(
    menstruation_support_records.map((r) => r.support_type).filter((t) => t),
  );
  if (educationTopics.size >= 5 && totalEducationRecords > 0) {
    insights.push({
      text: `Puberty education covers ${educationTopics.size} distinct topics -- the home provides a broad curriculum addressing multiple aspects of puberty including physical changes, emotional changes, and relationships. This breadth supports comprehensive preparation for puberty.`,
      severity: "positive",
    });
  }

  // --- Positive insights ---

  if (puberty_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding menstruation and puberty support -- children receive age-appropriate education, responsive menstruation care, reliable product access, dignified interactions, and effective body confidence building. This is strong evidence for Reg 14 compliance and holistic, child-centred health care.",
      severity: "positive",
    });
  }

  if (pubertyEducationRate >= 90 && menstruationSupportRate >= 90 && totalEducationRecords > 0 && totalMenstruationRecords > 0) {
    insights.push({
      text: `Puberty education at ${pubertyEducationRate}% and menstruation support at ${menstruationSupportRate}% -- the home provides comprehensive, high-quality puberty and menstruation care. Ofsted will recognise this as evidence of genuinely child-centred health provision.`,
      severity: "positive",
    });
  }

  if (productAvailabilityRate >= 95 && dignityCareRate >= 90 && totalProductRecords > 0 && totalDignityRecords > 0) {
    insights.push({
      text: `Product availability at ${productAvailabilityRate}% with dignity care at ${dignityCareRate}% -- children have reliable access to products and receive dignified care. This combination evidences the home's commitment to supporting children through puberty with sensitivity and respect.`,
      severity: "positive",
    });
  }

  if (bodyConfidenceRate >= 80 && bcSelfAssessmentAvg >= 4.0 && totalBodyConfidenceRecords > 0) {
    insights.push({
      text: `Body confidence rate at ${bodyConfidenceRate}% with children's self-assessment averaging ${bcSelfAssessmentAvg}/5 -- the home actively builds children's body confidence, and children report feeling positive about their bodies. This is exemplary practice in supporting wellbeing through puberty.`,
      severity: "positive",
    });
  }

  if (childComfortRate >= 80 && comfortDenominator > 0) {
    insights.push({
      text: `Overall child comfort rate at ${childComfortRate}% -- children feel genuinely safe, supported, and comfortable across all puberty and menstruation interactions. This level of comfort is essential for looked-after children who may have experienced neglect or abuse.`,
      severity: "positive",
    });
  }

  if (staffConfidenceRate >= 90 && staffModelledRate >= 80 && totalEducationRecords > 0 && totalBodyConfidenceRecords > 0) {
    insights.push({
      text: `Staff confidence at ${staffConfidenceRate}% in education delivery and positive body modelling at ${staffModelledRate}% -- staff are well equipped to support children through puberty and actively model healthy attitudes that reinforce children's self-esteem.`,
      severity: "positive",
    });
  }

  if (culturalSensitivityRate >= 90 && culturalNeedsMetRate >= 90 && totalEducationRecords > 0 && totalDignityRecords > 0) {
    insights.push({
      text: `Cultural sensitivity at ${culturalSensitivityRate}% in education and cultural needs met at ${culturalNeedsMetRate}% in care -- the home demonstrates outstanding cultural competence in puberty support, respecting diverse beliefs and practices around puberty and menstruation.`,
      severity: "positive",
    });
  }

  if (privacyRate >= 95 && discreetAccessRate >= 90 && totalMenstruationRecords > 0 && totalProductRecords > 0) {
    insights.push({
      text: `Privacy maintained at ${privacyRate}% in support interactions with ${discreetAccessRate}% discreet product access -- the home has embedded a culture of privacy and discretion that allows children to manage their periods without embarrassment.`,
      severity: "positive",
    });
  }

  if (schoolAbsenceManagedRate >= 90 && schoolAbsenceDueToPeriod > 0) {
    insights.push({
      text: `${schoolAbsenceManagedRate}% of period-related school absences managed effectively -- the home proactively ensures menstruation does not disrupt children's education, demonstrating joined-up health and education support.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (puberty_rating === "outstanding") {
    headline =
      "Outstanding menstruation and puberty support -- children receive comprehensive, dignified, and culturally sensitive puberty education, menstruation care, and body confidence building.";
  } else if (puberty_rating === "good") {
    headline = `Good menstruation and puberty support -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (puberty_rating === "adequate") {
    headline = `Adequate menstruation and puberty support -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's puberty-related health and wellbeing needs are fully met.`;
  } else {
    headline = `Menstruation and puberty support is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children receive dignified, responsive puberty care.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    puberty_rating,
    puberty_score: score,
    headline,
    puberty_education_rate: pubertyEducationRate,
    menstruation_support_rate: menstruationSupportRate,
    product_availability_rate: productAvailabilityRate,
    dignity_care_rate: dignityCareRate,
    body_confidence_rate: bodyConfidenceRate,
    child_comfort_rate: childComfortRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
