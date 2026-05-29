// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ETHNIC HAIR & SKINCARE INTELLIGENCE ENGINE
// Monitors culturally appropriate personal care — ethnic hair care provision,
// skincare routine adequacy, culturally specific product availability,
// specialist referral access, staff training, and child satisfaction with
// personal care.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Positive identity), Reg 7 (Individual child's plan —
// children's views).
// SCCIF: "Experiences and progress of children", identity outcomes.
// Store keys: hairCareRecords, skincareRoutineRecords, productProvisionRecords,
//             specialistReferralRecords, childSatisfactionRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HairCareRecordInput {
  id: string;
  child_id: string;
  date: string;
  hair_type: "afro" | "afro_caribbean" | "mixed_texture" | "asian" | "other_ethnic" | "unspecified";
  care_plan_in_place: boolean;
  care_plan_reviewed: boolean;
  care_plan_review_date: string;
  appropriate_products_used: boolean;
  products_culturally_matched: boolean;
  styling_preferences_documented: boolean;
  child_voice_captured: boolean;
  child_satisfied: boolean;
  protective_styling_offered: boolean;
  staff_competent: boolean;
  staff_trained_ethnic_hair: boolean;
  external_specialist_used: boolean;
  specialist_name: string;
  frequency_appropriate: boolean;
  scalp_condition_healthy: boolean;
  condition_concerns: string;
  notes: string;
  created_at: string;
}

export interface SkincareRoutineRecordInput {
  id: string;
  child_id: string;
  date: string;
  skin_type: "melanin_rich" | "combination" | "sensitive" | "eczema_prone" | "dry" | "other";
  routine_in_place: boolean;
  routine_documented: boolean;
  routine_followed_consistently: boolean;
  products_appropriate_for_skin_type: boolean;
  products_culturally_specific: boolean;
  moisturising_frequency_adequate: boolean;
  spf_protection_provided: boolean;
  dermatological_needs_identified: boolean;
  dermatological_needs_met: boolean;
  child_educated_on_routine: boolean;
  child_independent_in_routine: boolean;
  child_satisfied: boolean;
  staff_knowledgeable: boolean;
  condition_concerns: string;
  notes: string;
  created_at: string;
}

export interface ProductProvisionRecordInput {
  id: string;
  date: string;
  product_category: "hair_oil" | "hair_cream" | "shampoo" | "conditioner" | "detangler" | "edge_control" | "moisturiser" | "body_butter" | "shea_butter" | "cocoa_butter" | "sunscreen_melanin" | "specialist_skincare" | "other";
  brand_name: string;
  culturally_appropriate: boolean;
  child_id: string | null;
  requested_by_child: boolean;
  in_stock: boolean;
  budget_adequate: boolean;
  sourced_from_specialist_supplier: boolean;
  quality_rating: number; // 1-5
  child_approved: boolean;
  replacement_ordered_timely: boolean;
  notes: string;
  created_at: string;
}

export interface SpecialistReferralRecordInput {
  id: string;
  child_id: string;
  referral_date: string;
  specialist_type: "afro_hair_specialist" | "trichologist" | "barber_culturally_skilled" | "dermatologist" | "skin_specialist" | "braider" | "loctician" | "other";
  referral_reason: string;
  referral_made: boolean;
  appointment_date: string;
  appointment_attended: boolean;
  waiting_time_days: number;
  outcome_positive: boolean;
  child_satisfied: boolean;
  follow_up_needed: boolean;
  follow_up_arranged: boolean;
  staff_advocated: boolean;
  notes: string;
  created_at: string;
}

export interface ChildSatisfactionRecordInput {
  id: string;
  child_id: string;
  date: string;
  satisfaction_area: "hair_care" | "skincare" | "products" | "specialist_access" | "staff_competence" | "overall";
  satisfaction_rating: number; // 1-5
  child_feels_listened_to: boolean;
  child_feels_culturally_respected: boolean;
  child_preferences_acted_on: boolean;
  child_can_choose_products: boolean;
  child_can_choose_stylist: boolean;
  child_educated_about_care: boolean;
  child_confident_in_self_care: boolean;
  complaints_raised: boolean;
  complaint_resolved: boolean;
  feedback_text: string;
  notes: string;
  created_at: string;
}

export interface EthnicHairSkincareInput {
  today: string;
  total_children: number;
  hair_care_records: HairCareRecordInput[];
  skincare_routine_records: SkincareRoutineRecordInput[];
  product_provision_records: ProductProvisionRecordInput[];
  specialist_referral_records: SpecialistReferralRecordInput[];
  child_satisfaction_records: ChildSatisfactionRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EthnicHairSkincareRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface EthnicHairSkincareInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface EthnicHairSkincareRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface EthnicHairSkincareResult {
  haircare_rating: EthnicHairSkincareRating;
  haircare_score: number;
  headline: string;
  total_hair_care_records: number;
  total_skincare_records: number;
  total_product_records: number;
  total_specialist_referrals: number;
  total_satisfaction_records: number;
  hair_care_rate: number;
  skincare_routine_rate: number;
  product_availability_rate: number;
  specialist_access_rate: number;
  staff_training_rate: number;
  child_satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: EthnicHairSkincareRecommendation[];
  insights: EthnicHairSkincareInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): EthnicHairSkincareRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: EthnicHairSkincareRating,
  score: number,
  headline: string,
): EthnicHairSkincareResult {
  return {
    haircare_rating: rating,
    haircare_score: score,
    headline,
    total_hair_care_records: 0,
    total_skincare_records: 0,
    total_product_records: 0,
    total_specialist_referrals: 0,
    total_satisfaction_records: 0,
    hair_care_rate: 0,
    skincare_routine_rate: 0,
    product_availability_rate: 0,
    specialist_access_rate: 0,
    staff_training_rate: 0,
    child_satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeEthnicHairSkincare(
  input: EthnicHairSkincareInput,
): EthnicHairSkincareResult {
  const {
    total_children,
    hair_care_records,
    skincare_routine_records,
    product_provision_records,
    specialist_referral_records,
    child_satisfaction_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    hair_care_records.length === 0 &&
    skincare_routine_records.length === 0 &&
    product_provision_records.length === 0 &&
    specialist_referral_records.length === 0 &&
    child_satisfaction_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess ethnic hair and skincare provision.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No ethnic hair care or skincare data recorded despite children on placement — culturally appropriate personal care provision requires urgent attention.",
      ),
      concerns: [
        "No hair care records, skincare routine records, product provision records, specialist referral records, or child satisfaction records exist despite children being on placement — the home cannot evidence culturally appropriate personal care provision.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of ethnic hair care provision, skincare routines, culturally appropriate product availability, specialist referral access, and child satisfaction to evidence culturally competent personal care for every child.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
        },
        {
          rank: 2,
          recommendation:
            "Assess each child's ethnic hair care and skincare needs immediately — develop individualised care plans that reflect the child's hair type, skin type, cultural background, and personal preferences, informed by the child's own voice.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Individual child's plan",
        },
      ],
      insights: [
        {
          text: "The complete absence of ethnic hair care and skincare records means the home cannot demonstrate culturally appropriate personal care provision. This is a fundamental gap in identity support — children from diverse ethnic backgrounds must have access to appropriate hair care, skincare products, specialist support, and staff who understand their needs. Ofsted will consider this under Reg 5 (positive identity) and SCCIF experiences and progress.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Hair care metrics ---
  const totalHairCareRecords = hair_care_records.length;

  const hairCarePlansInPlace = hair_care_records.filter((h) => h.care_plan_in_place).length;
  const hairCarePlanRate = pct(hairCarePlansInPlace, totalHairCareRecords);

  const hairCarePlansReviewed = hair_care_records.filter((h) => h.care_plan_in_place && h.care_plan_reviewed).length;
  const hairCarePlanReviewRate = pct(hairCarePlansReviewed, totalHairCareRecords);

  const appropriateProductsUsed = hair_care_records.filter((h) => h.appropriate_products_used).length;
  const appropriateProductsRate = pct(appropriateProductsUsed, totalHairCareRecords);

  const culturallyMatchedProducts = hair_care_records.filter((h) => h.products_culturally_matched).length;
  const culturallyMatchedRate = pct(culturallyMatchedProducts, totalHairCareRecords);

  const stylingPrefsDocumented = hair_care_records.filter((h) => h.styling_preferences_documented).length;
  const stylingPrefsRate = pct(stylingPrefsDocumented, totalHairCareRecords);

  const childVoiceCapturedHair = hair_care_records.filter((h) => h.child_voice_captured).length;
  const childVoiceHairRate = pct(childVoiceCapturedHair, totalHairCareRecords);

  const childSatisfiedHair = hair_care_records.filter((h) => h.child_satisfied).length;
  const childSatisfiedHairRate = pct(childSatisfiedHair, totalHairCareRecords);

  const protectiveStylingOffered = hair_care_records.filter((h) => h.protective_styling_offered).length;
  const protectiveStylingRate = pct(protectiveStylingOffered, totalHairCareRecords);

  const staffCompetentHair = hair_care_records.filter((h) => h.staff_competent).length;
  const staffCompetentHairRate = pct(staffCompetentHair, totalHairCareRecords);

  const staffTrainedEthnicHair = hair_care_records.filter((h) => h.staff_trained_ethnic_hair).length;
  const staffTrainedEthnicHairRate = pct(staffTrainedEthnicHair, totalHairCareRecords);

  const externalSpecialistsUsedHair = hair_care_records.filter((h) => h.external_specialist_used).length;
  const externalSpecialistHairRate = pct(externalSpecialistsUsedHair, totalHairCareRecords);

  const frequencyAppropriate = hair_care_records.filter((h) => h.frequency_appropriate).length;
  const frequencyAppropriateRate = pct(frequencyAppropriate, totalHairCareRecords);

  const scalpHealthy = hair_care_records.filter((h) => h.scalp_condition_healthy).length;
  const scalpHealthRate = pct(scalpHealthy, totalHairCareRecords);

  // Unique children with hair care records
  const uniqueChildrenHairCare = new Set(hair_care_records.map((h) => h.child_id)).size;
  const hairCareCoverage = total_children > 0 ? pct(uniqueChildrenHairCare, total_children) : 0;

  // Composite hair care rate: average of care plan rate, appropriate products, culturally matched, child voice, frequency
  const hairCareRate = totalHairCareRecords > 0
    ? Math.round((hairCarePlanRate + appropriateProductsRate + culturallyMatchedRate + childVoiceHairRate + frequencyAppropriateRate) / 5)
    : 0;

  // --- Skincare routine metrics ---
  const totalSkincareRecords = skincare_routine_records.length;

  const routinesInPlace = skincare_routine_records.filter((s) => s.routine_in_place).length;
  const routineInPlaceRate = pct(routinesInPlace, totalSkincareRecords);

  const routinesDocumented = skincare_routine_records.filter((s) => s.routine_documented).length;
  const routineDocumentedRate = pct(routinesDocumented, totalSkincareRecords);

  const routinesFollowed = skincare_routine_records.filter((s) => s.routine_followed_consistently).length;
  const routineFollowedRate = pct(routinesFollowed, totalSkincareRecords);

  const productsAppropriate = skincare_routine_records.filter((s) => s.products_appropriate_for_skin_type).length;
  const productsAppropriateRate = pct(productsAppropriate, totalSkincareRecords);

  const productsCulturallySpecific = skincare_routine_records.filter((s) => s.products_culturally_specific).length;
  const productsCulturallySpecificRate = pct(productsCulturallySpecific, totalSkincareRecords);

  const moisturisingAdequate = skincare_routine_records.filter((s) => s.moisturising_frequency_adequate).length;
  const moisturisingRate = pct(moisturisingAdequate, totalSkincareRecords);

  const spfProvided = skincare_routine_records.filter((s) => s.spf_protection_provided).length;
  const spfRate = pct(spfProvided, totalSkincareRecords);

  const dermatologicalNeedsIdentified = skincare_routine_records.filter((s) => s.dermatological_needs_identified).length;
  const dermatologicalNeedsMetCount = skincare_routine_records.filter((s) => s.dermatological_needs_identified && s.dermatological_needs_met).length;
  const dermatologicalNeedsMetRate = pct(dermatologicalNeedsMetCount, dermatologicalNeedsIdentified);

  const childEducatedSkincare = skincare_routine_records.filter((s) => s.child_educated_on_routine).length;
  const childEducatedSkincareRate = pct(childEducatedSkincare, totalSkincareRecords);

  const childIndependentSkincare = skincare_routine_records.filter((s) => s.child_independent_in_routine).length;
  const childIndependentSkincareRate = pct(childIndependentSkincare, totalSkincareRecords);

  const childSatisfiedSkincare = skincare_routine_records.filter((s) => s.child_satisfied).length;
  const childSatisfiedSkincareRate = pct(childSatisfiedSkincare, totalSkincareRecords);

  const staffKnowledgeableSkincare = skincare_routine_records.filter((s) => s.staff_knowledgeable).length;
  const staffKnowledgeableSkincareRate = pct(staffKnowledgeableSkincare, totalSkincareRecords);

  // Unique children with skincare records
  const uniqueChildrenSkincare = new Set(skincare_routine_records.map((s) => s.child_id)).size;
  const skincareCoverage = total_children > 0 ? pct(uniqueChildrenSkincare, total_children) : 0;

  // Composite skincare routine rate
  const skincareRoutineRate = totalSkincareRecords > 0
    ? Math.round((routineInPlaceRate + productsAppropriateRate + moisturisingRate + routineFollowedRate + childEducatedSkincareRate) / 5)
    : 0;

  // --- Product provision metrics ---
  const totalProductRecords = product_provision_records.length;

  const culturallyAppropriateProducts = product_provision_records.filter((p) => p.culturally_appropriate).length;
  const culturallyAppropriateProductRate = pct(culturallyAppropriateProducts, totalProductRecords);

  const productsInStock = product_provision_records.filter((p) => p.in_stock).length;
  const inStockRate = pct(productsInStock, totalProductRecords);

  const budgetAdequate = product_provision_records.filter((p) => p.budget_adequate).length;
  const budgetAdequateRate = pct(budgetAdequate, totalProductRecords);

  const childRequestedProducts = product_provision_records.filter((p) => p.requested_by_child).length;
  const childRequestedRate = pct(childRequestedProducts, totalProductRecords);

  const childApprovedProducts = product_provision_records.filter((p) => p.child_approved).length;
  const childApprovedRate = pct(childApprovedProducts, totalProductRecords);

  const specialistSourced = product_provision_records.filter((p) => p.sourced_from_specialist_supplier).length;
  const specialistSourcedRate = pct(specialistSourced, totalProductRecords);

  const replacementTimely = product_provision_records.filter((p) => p.replacement_ordered_timely).length;
  const replacementTimelyRate = pct(replacementTimely, totalProductRecords);

  const qualitySum = product_provision_records.reduce((sum, p) => sum + p.quality_rating, 0);
  const avgProductQuality = totalProductRecords > 0
    ? Math.round((qualitySum / totalProductRecords) * 100) / 100
    : 0;

  // Composite product availability rate
  const productAvailabilityRate = totalProductRecords > 0
    ? Math.round((culturallyAppropriateProductRate + inStockRate + budgetAdequateRate + childApprovedRate) / 4)
    : 0;

  // --- Specialist referral metrics ---
  const totalSpecialistReferrals = specialist_referral_records.length;

  const referralsMade = specialist_referral_records.filter((r) => r.referral_made).length;
  const referralMadeRate = pct(referralsMade, totalSpecialistReferrals);

  const appointmentsAttended = specialist_referral_records.filter((r) => r.referral_made && r.appointment_attended).length;
  const appointmentAttendedRate = pct(appointmentsAttended, totalSpecialistReferrals);

  const outcomesPositive = specialist_referral_records.filter((r) => r.appointment_attended && r.outcome_positive).length;
  const outcomePositiveRate = pct(outcomesPositive, totalSpecialistReferrals);

  const childSatisfiedSpecialist = specialist_referral_records.filter((r) => r.appointment_attended && r.child_satisfied).length;
  const childSatisfiedSpecialistRate = pct(childSatisfiedSpecialist, totalSpecialistReferrals);

  const followUpNeeded = specialist_referral_records.filter((r) => r.follow_up_needed).length;
  const followUpArranged = specialist_referral_records.filter((r) => r.follow_up_needed && r.follow_up_arranged).length;
  const followUpArrangedRate = pct(followUpArranged, followUpNeeded);

  const staffAdvocated = specialist_referral_records.filter((r) => r.staff_advocated).length;
  const staffAdvocatedRate = pct(staffAdvocated, totalSpecialistReferrals);

  const avgWaitingTime = totalSpecialistReferrals > 0
    ? Math.round(specialist_referral_records.reduce((sum, r) => sum + r.waiting_time_days, 0) / totalSpecialistReferrals)
    : 0;

  // Unique children with specialist referrals
  const uniqueChildrenSpecialist = new Set(specialist_referral_records.map((r) => r.child_id)).size;

  // Composite specialist access rate
  const specialistAccessRate = totalSpecialistReferrals > 0
    ? Math.round((referralMadeRate + appointmentAttendedRate + outcomePositiveRate + childSatisfiedSpecialistRate) / 4)
    : 0;

  // --- Staff training composite ---
  // Combines hair care staff competency, ethnic hair training, skincare staff knowledge
  const staffTrainingNumerators: number[] = [];
  const staffTrainingDenominators: number[] = [];

  if (totalHairCareRecords > 0) {
    staffTrainingNumerators.push(staffCompetentHair);
    staffTrainingDenominators.push(totalHairCareRecords);
    staffTrainingNumerators.push(staffTrainedEthnicHair);
    staffTrainingDenominators.push(totalHairCareRecords);
  }
  if (totalSkincareRecords > 0) {
    staffTrainingNumerators.push(staffKnowledgeableSkincare);
    staffTrainingDenominators.push(totalSkincareRecords);
  }

  const totalStaffTrainNum = staffTrainingNumerators.reduce((a, b) => a + b, 0);
  const totalStaffTrainDenom = staffTrainingDenominators.reduce((a, b) => a + b, 0);
  const staffTrainingRate = pct(totalStaffTrainNum, totalStaffTrainDenom);

  // --- Child satisfaction composite ---
  const satisfactionNumerators: number[] = [];
  const satisfactionDenominators: number[] = [];

  if (totalHairCareRecords > 0) {
    satisfactionNumerators.push(childSatisfiedHair);
    satisfactionDenominators.push(totalHairCareRecords);
  }
  if (totalSkincareRecords > 0) {
    satisfactionNumerators.push(childSatisfiedSkincare);
    satisfactionDenominators.push(totalSkincareRecords);
  }
  if (totalSpecialistReferrals > 0) {
    satisfactionNumerators.push(childSatisfiedSpecialist);
    satisfactionDenominators.push(totalSpecialistReferrals);
  }

  // Include child satisfaction survey records
  const totalSatisfactionRecords = child_satisfaction_records.length;
  const satisfiedSurveys = child_satisfaction_records.filter((s) => s.satisfaction_rating >= 4).length;
  if (totalSatisfactionRecords > 0) {
    satisfactionNumerators.push(satisfiedSurveys);
    satisfactionDenominators.push(totalSatisfactionRecords);
  }

  const totalSatisNum = satisfactionNumerators.reduce((a, b) => a + b, 0);
  const totalSatisDenom = satisfactionDenominators.reduce((a, b) => a + b, 0);
  const childSatisfactionRate = pct(totalSatisNum, totalSatisDenom);

  // --- Additional satisfaction survey metrics ---
  const feelsListenedTo = child_satisfaction_records.filter((s) => s.child_feels_listened_to).length;
  const feelsListenedToRate = pct(feelsListenedTo, totalSatisfactionRecords);

  const feelsCulturallyRespected = child_satisfaction_records.filter((s) => s.child_feels_culturally_respected).length;
  const feelsCulturallyRespectedRate = pct(feelsCulturallyRespected, totalSatisfactionRecords);

  const preferencesActedOn = child_satisfaction_records.filter((s) => s.child_preferences_acted_on).length;
  const preferencesActedOnRate = pct(preferencesActedOn, totalSatisfactionRecords);

  const canChooseProducts = child_satisfaction_records.filter((s) => s.child_can_choose_products).length;
  const canChooseProductsRate = pct(canChooseProducts, totalSatisfactionRecords);

  const canChooseStylist = child_satisfaction_records.filter((s) => s.child_can_choose_stylist).length;
  const canChooseStylistRate = pct(canChooseStylist, totalSatisfactionRecords);

  const confidentSelfCare = child_satisfaction_records.filter((s) => s.child_confident_in_self_care).length;
  const confidentSelfCareRate = pct(confidentSelfCare, totalSatisfactionRecords);

  const complaintsRaised = child_satisfaction_records.filter((s) => s.complaints_raised).length;
  const complaintsResolved = child_satisfaction_records.filter((s) => s.complaints_raised && s.complaint_resolved).length;
  const complaintResolutionRate = pct(complaintsResolved, complaintsRaised);

  const avgSatisfactionRating = totalSatisfactionRecords > 0
    ? Math.round((child_satisfaction_records.reduce((sum, s) => sum + s.satisfaction_rating, 0) / totalSatisfactionRecords) * 100) / 100
    : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: hairCareRate (>=90: +5, >=70: +3) ---
  if (hairCareRate >= 90) score += 5;
  else if (hairCareRate >= 70) score += 3;

  // --- Bonus 2: skincareRoutineRate (>=90: +5, >=70: +3) ---
  if (skincareRoutineRate >= 90) score += 5;
  else if (skincareRoutineRate >= 70) score += 3;

  // --- Bonus 3: productAvailabilityRate (>=90: +4, >=70: +2) ---
  if (productAvailabilityRate >= 90) score += 4;
  else if (productAvailabilityRate >= 70) score += 2;

  // --- Bonus 4: specialistAccessRate (>=90: +4, >=70: +2) ---
  if (specialistAccessRate >= 90) score += 4;
  else if (specialistAccessRate >= 70) score += 2;

  // --- Bonus 5: staffTrainingRate (>=90: +5, >=70: +3) ---
  if (staffTrainingRate >= 90) score += 5;
  else if (staffTrainingRate >= 70) score += 3;

  // --- Bonus 6: childSatisfactionRate (>=90: +5, >=70: +3) ---
  if (childSatisfactionRate >= 90) score += 5;
  else if (childSatisfactionRate >= 70) score += 3;

  // Max bonuses = 5+5+4+4+5+5 = 28

  // ── Penalties ─────────────────────────────────────────────────────────

  // hairCareRate < 40 → -5 (guarded)
  if (hairCareRate < 40 && hair_care_records.length > 0) score -= 5;

  // skincareRoutineRate < 40 → -5 (guarded)
  if (skincareRoutineRate < 40 && skincare_routine_records.length > 0) score -= 5;

  // staffTrainingRate < 30 → -5 (guarded)
  if (staffTrainingRate < 30 && totalStaffTrainDenom > 0) score -= 5;

  // childSatisfactionRate < 30 → -3 (guarded)
  if (childSatisfactionRate < 30 && totalSatisDenom > 0) score -= 3;

  score = clamp(score, 0, 100);

  const haircare_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (hairCareRate >= 90 && totalHairCareRecords > 0) {
    strengths.push(
      `${hairCareRate}% ethnic hair care quality — the home demonstrates excellent culturally appropriate hair care with individualised care plans, appropriate products, and children's preferences consistently captured and respected.`,
    );
  } else if (hairCareRate >= 70 && totalHairCareRecords > 0) {
    strengths.push(
      `${hairCareRate}% ethnic hair care quality — good provision of culturally appropriate hair care with care plans and suitable products in place for children.`,
    );
  }

  if (skincareRoutineRate >= 90 && totalSkincareRecords > 0) {
    strengths.push(
      `${skincareRoutineRate}% skincare routine adequacy — excellent skincare provision with appropriate products, consistent routines, and children educated on self-care for their skin type.`,
    );
  } else if (skincareRoutineRate >= 70 && totalSkincareRecords > 0) {
    strengths.push(
      `${skincareRoutineRate}% skincare routine quality — good skincare provision with routines documented and culturally appropriate products available.`,
    );
  }

  if (productAvailabilityRate >= 90 && totalProductRecords > 0) {
    strengths.push(
      `${productAvailabilityRate}% product availability — culturally appropriate products are consistently in stock, within budget, and approved by children. The home ensures children have access to the products they need and want.`,
    );
  } else if (productAvailabilityRate >= 70 && totalProductRecords > 0) {
    strengths.push(
      `${productAvailabilityRate}% product availability — good provision of culturally appropriate hair and skincare products, with reasonable stock levels and budget allocation.`,
    );
  }

  if (specialistAccessRate >= 90 && totalSpecialistReferrals > 0) {
    strengths.push(
      `${specialistAccessRate}% specialist access quality — referrals are made promptly, appointments attended, outcomes positive, and children satisfied with specialist care. The home actively connects children with culturally skilled specialists.`,
    );
  } else if (specialistAccessRate >= 70 && totalSpecialistReferrals > 0) {
    strengths.push(
      `${specialistAccessRate}% specialist access — good access to culturally appropriate hair care and skincare specialists with positive outcomes for children.`,
    );
  }

  if (staffTrainingRate >= 90 && totalStaffTrainDenom > 0) {
    strengths.push(
      `${staffTrainingRate}% staff competency in ethnic hair and skincare — staff are well-trained and knowledgeable in caring for diverse hair types and skin tones, enabling confident and respectful care provision.`,
    );
  } else if (staffTrainingRate >= 70 && totalStaffTrainDenom > 0) {
    strengths.push(
      `${staffTrainingRate}% staff competency — good levels of staff training and knowledge in ethnic hair care and skincare for diverse children.`,
    );
  }

  if (childSatisfactionRate >= 90 && totalSatisDenom > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction — children are overwhelmingly satisfied with their personal care provision, feeling listened to and culturally respected. Their voices drive care decisions.`,
    );
  } else if (childSatisfactionRate >= 70 && totalSatisDenom > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction — children are generally satisfied with their hair care and skincare provision and feel their preferences are respected.`,
    );
  }

  if (protectiveStylingRate >= 90 && totalHairCareRecords > 0) {
    strengths.push(
      `Protective styling offered in ${protectiveStylingRate}% of hair care records — children's hair is being actively protected and maintained according to cultural best practice.`,
    );
  }

  if (feelsCulturallyRespectedRate >= 90 && totalSatisfactionRecords > 0) {
    strengths.push(
      `${feelsCulturallyRespectedRate}% of children feel culturally respected in their personal care — the home has created an environment where diversity in personal care is genuinely valued and celebrated.`,
    );
  } else if (feelsCulturallyRespectedRate >= 70 && totalSatisfactionRecords > 0) {
    strengths.push(
      `${feelsCulturallyRespectedRate}% of children feel culturally respected — the majority of children feel their cultural identity is respected through personal care provision.`,
    );
  }

  if (canChooseProductsRate >= 90 && totalSatisfactionRecords > 0) {
    strengths.push(
      `${canChooseProductsRate}% of children can choose their own products — children exercise genuine agency over their personal care, reflecting strong identity support.`,
    );
  }

  if (confidentSelfCareRate >= 90 && totalSatisfactionRecords > 0) {
    strengths.push(
      `${confidentSelfCareRate}% of children are confident in self-care — the home is successfully developing children's independence and confidence in managing their own hair and skincare.`,
    );
  } else if (confidentSelfCareRate >= 70 && totalSatisfactionRecords > 0) {
    strengths.push(
      `${confidentSelfCareRate}% of children are confident in self-care — good progress in building children's independence in personal care routines.`,
    );
  }

  if (hairCareCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has ethnic hair care records — the home ensures all children's hair care needs are individually assessed and provided for.",
    );
  } else if (hairCareCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${hairCareCoverage}% of children have hair care records — strong coverage ensuring most children's ethnic hair care needs are documented and met.`,
    );
  }

  if (skincareCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has skincare routine records — comprehensive coverage ensuring all children's skincare needs are individually assessed and addressed.",
    );
  } else if (skincareCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${skincareCoverage}% of children have skincare records — good coverage of individual skincare assessment and provision.`,
    );
  }

  if (scalpHealthRate >= 90 && totalHairCareRecords > 0) {
    strengths.push(
      `${scalpHealthRate}% healthy scalp condition — excellent hair care practice maintaining children's scalp health through appropriate products and techniques.`,
    );
  }

  if (dermatologicalNeedsMetRate >= 90 && dermatologicalNeedsIdentified > 0) {
    strengths.push(
      `${dermatologicalNeedsMetRate}% of identified dermatological needs being met — the home responds effectively to children's skin conditions and specialist requirements.`,
    );
  }

  if (complaintResolutionRate >= 100 && complaintsRaised > 0) {
    strengths.push(
      "All personal care complaints have been resolved — the home responds effectively to children's concerns about their hair and skincare provision.",
    );
  }

  if (avgProductQuality >= 4.0 && totalProductRecords > 0) {
    strengths.push(
      `Product quality averaging ${avgProductQuality}/5 — the home invests in high-quality, culturally appropriate hair and skincare products that meet children's needs and expectations.`,
    );
  }

  if (staffAdvocatedRate >= 90 && totalSpecialistReferrals > 0) {
    strengths.push(
      `Staff advocated for specialist access in ${staffAdvocatedRate}% of referrals — staff actively champion children's right to culturally appropriate specialist care.`,
    );
  }

  if (followUpArrangedRate >= 90 && followUpNeeded > 0) {
    strengths.push(
      `${followUpArrangedRate}% of specialist follow-ups arranged — the home ensures continuity of specialist care for children's hair and skin needs.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (hairCareRate < 40 && totalHairCareRecords > 0) {
    concerns.push(
      `Only ${hairCareRate}% ethnic hair care quality — significant deficits in care planning, product appropriateness, cultural matching, and capturing children's preferences. Children's ethnic hair care needs are not being adequately met.`,
    );
  } else if (hairCareRate < 70 && hairCareRate >= 40 && totalHairCareRecords > 0) {
    concerns.push(
      `Ethnic hair care quality at ${hairCareRate}% — inconsistencies in care planning, product selection, or capturing children's hair care preferences require improvement.`,
    );
  }

  if (skincareRoutineRate < 40 && totalSkincareRecords > 0) {
    concerns.push(
      `Only ${skincareRoutineRate}% skincare routine adequacy — fundamental gaps in skincare routines, product appropriateness, or consistency. Children's skincare needs are being neglected.`,
    );
  } else if (skincareRoutineRate < 70 && skincareRoutineRate >= 40 && totalSkincareRecords > 0) {
    concerns.push(
      `Skincare routine adequacy at ${skincareRoutineRate}% — skincare routines are not consistently in place, documented, or followed with appropriate products.`,
    );
  }

  if (productAvailabilityRate < 50 && totalProductRecords > 0) {
    concerns.push(
      `Only ${productAvailabilityRate}% product availability — culturally appropriate hair and skincare products are not consistently available, in stock, or approved by children. This represents a failure to meet children's basic personal care needs.`,
    );
  } else if (productAvailabilityRate < 70 && productAvailabilityRate >= 50 && totalProductRecords > 0) {
    concerns.push(
      `Product availability at ${productAvailabilityRate}% — gaps in culturally appropriate product provision, stock management, or budget allocation for children's hair and skincare needs.`,
    );
  }

  if (specialistAccessRate < 50 && totalSpecialistReferrals > 0) {
    concerns.push(
      `Only ${specialistAccessRate}% specialist access quality — referrals are not being made, appointments are missed, or outcomes are poor. Children are being denied access to culturally appropriate specialist care.`,
    );
  } else if (specialistAccessRate < 70 && specialistAccessRate >= 50 && totalSpecialistReferrals > 0) {
    concerns.push(
      `Specialist access at ${specialistAccessRate}% — some referrals are not being actioned promptly or resulting in positive outcomes for children.`,
    );
  }

  if (staffTrainingRate < 30 && totalStaffTrainDenom > 0) {
    concerns.push(
      `Only ${staffTrainingRate}% staff competency in ethnic hair and skincare — the majority of staff are not trained or confident in caring for diverse hair types and skin tones. This represents a serious capacity gap that directly impacts children's wellbeing and identity.`,
    );
  } else if (staffTrainingRate < 70 && staffTrainingRate >= 30 && totalStaffTrainDenom > 0) {
    concerns.push(
      `Staff competency at ${staffTrainingRate}% — not all staff are trained in ethnic hair care and skincare, limiting the home's ability to provide consistent culturally appropriate care.`,
    );
  }

  if (childSatisfactionRate < 30 && totalSatisDenom > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction — the majority of children are dissatisfied with their personal care provision. Children's voices are not being heard or acted upon regarding their hair care and skincare needs.`,
    );
  } else if (childSatisfactionRate < 70 && childSatisfactionRate >= 30 && totalSatisDenom > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — not all children are satisfied with their hair care and skincare provision. Preferences and concerns need closer attention.`,
    );
  }

  if (hairCareCoverage < 50 && total_children > 0 && totalHairCareRecords > 0) {
    concerns.push(
      `Only ${hairCareCoverage}% of children have hair care records — many children's ethnic hair care needs may not be assessed or provided for.`,
    );
  }

  if (skincareCoverage < 50 && total_children > 0 && totalSkincareRecords > 0) {
    concerns.push(
      `Only ${skincareCoverage}% of children have skincare records — many children's skincare needs may not be individually assessed.`,
    );
  }

  if (feelsCulturallyRespectedRate < 50 && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${feelsCulturallyRespectedRate}% of children feel culturally respected in personal care — this indicates the home may not be creating an environment where diversity in hair and skincare is valued and supported.`,
    );
  } else if (feelsCulturallyRespectedRate < 70 && feelsCulturallyRespectedRate >= 50 && totalSatisfactionRecords > 0) {
    concerns.push(
      `Cultural respect in personal care at ${feelsCulturallyRespectedRate}% — some children do not feel culturally respected in how their hair and skincare needs are managed.`,
    );
  }

  if (avgWaitingTime > 28 && totalSpecialistReferrals > 0) {
    concerns.push(
      `Average specialist waiting time is ${avgWaitingTime} days — children are waiting too long for culturally appropriate specialist hair and skincare appointments.`,
    );
  }

  if (scalpHealthRate < 60 && totalHairCareRecords > 0) {
    concerns.push(
      `Only ${scalpHealthRate}% healthy scalp condition — poor hair care practices or inappropriate products may be affecting children's scalp health.`,
    );
  }

  if (dermatologicalNeedsMetRate < 60 && dermatologicalNeedsIdentified > 0) {
    concerns.push(
      `Only ${dermatologicalNeedsMetRate}% of identified dermatological needs being met — children's skin conditions are being identified but not adequately addressed.`,
    );
  }

  if (complaintsRaised > 0 && complaintResolutionRate < 50) {
    concerns.push(
      `Only ${complaintResolutionRate}% of personal care complaints resolved — children's concerns about hair and skincare provision are not being adequately addressed.`,
    );
  }

  if (inStockRate < 60 && totalProductRecords > 0) {
    concerns.push(
      `Only ${inStockRate}% of culturally appropriate products in stock — frequent stock-outs mean children cannot access the hair and skincare products they need.`,
    );
  }

  if (culturallyMatchedRate < 50 && totalHairCareRecords > 0) {
    concerns.push(
      `Only ${culturallyMatchedRate}% of hair care uses culturally matched products — children may be receiving generic products that are not suitable for their hair type, damaging hair health and cultural identity.`,
    );
  }

  if (childVoiceHairRate < 50 && totalHairCareRecords > 0) {
    concerns.push(
      `Child voice captured in only ${childVoiceHairRate}% of hair care records — children's views and preferences about their own hair care are not being routinely sought or recorded.`,
    );
  }

  if (followUpArrangedRate < 50 && followUpNeeded > 0) {
    concerns.push(
      `Only ${followUpArrangedRate}% of specialist follow-ups arranged — children requiring ongoing specialist care for hair or skin are not receiving continuity of treatment.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: EthnicHairSkincareRecommendation[] = [];
  let rank = 0;

  if (hairCareRate < 40 && totalHairCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review ethnic hair care provision — develop individualised hair care plans for every child, ensure culturally matched products are available, capture children's styling preferences, and provide hair care at an appropriate frequency. Each plan must reflect the child's hair type, cultural heritage, and personal wishes.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (skincareRoutineRate < 40 && totalSkincareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently establish skincare routines for all children — ensure routines use products appropriate for each child's skin type and tone, are followed consistently, and educate children about caring for their own skin. Melanin-rich skin has specific moisturising and SPF needs that must be understood.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (staffTrainingRate < 30 && totalStaffTrainDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently provide ethnic hair and skincare training for all staff — staff must understand diverse hair types (afro, Afro-Caribbean, mixed texture, Asian), appropriate products, protective styling, moisturising for melanin-rich skin, and the cultural significance of personal care. Without this knowledge, staff cannot provide competent care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — Staff training",
    });
  }

  if (childSatisfactionRate < 30 && totalSatisDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address children's dissatisfaction with personal care — seek children's views about their hair and skincare provision, identify specific concerns, and implement changes that reflect their preferences. Children must feel listened to and culturally respected in their personal care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (productAvailabilityRate < 50 && totalProductRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve culturally appropriate product provision — identify each child's preferred hair and skincare products, source from specialist suppliers where needed, ensure adequate budget allocation, and maintain stock levels so children always have access to the products they need.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (specialistAccessRate < 50 && totalSpecialistReferrals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve access to culturally appropriate specialists — build relationships with local Afro-Caribbean hairdressers, barbers, trichologists, and dermatologists experienced with diverse skin tones. Ensure referrals are actioned promptly and children attend appointments.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (feelsCulturallyRespectedRate < 50 && totalSatisfactionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the cultural respect gap in personal care — children must feel that their ethnic identity is valued through personal care provision. Review whether staff attitudes, product choices, and care approaches genuinely reflect and celebrate children's cultural backgrounds.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (totalHairCareRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording ethnic hair care provision immediately — each child should have a documented hair care plan reflecting their hair type, cultural background, product preferences, and styling wishes. The absence of any hair care records is a significant gap.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (totalSkincareRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording skincare routines immediately — each child's skin type and specific needs should be assessed and documented with an appropriate routine using culturally suitable products.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (hairCareRate >= 40 && hairCareRate < 70 && totalHairCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen ethnic hair care provision by ensuring all children have reviewed care plans, culturally matched products, documented styling preferences, and their voice captured in care decisions. Target at least 70% across all hair care indicators.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (skincareRoutineRate >= 40 && skincareRoutineRate < 70 && totalSkincareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve skincare routines by ensuring all children have documented, consistently followed routines with appropriate products and education about their skin type. Target moisturising adequacy and SPF provision for all children.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (staffTrainingRate >= 30 && staffTrainingRate < 70 && totalStaffTrainDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand ethnic hair and skincare training across all staff — ensure every team member can confidently provide culturally appropriate hair care and skincare. Consider specialist trainers and peer learning from staff with relevant cultural knowledge.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Staff training",
    });
  }

  if (childSatisfactionRate >= 30 && childSatisfactionRate < 70 && totalSatisDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve child satisfaction by regularly consulting children about their personal care preferences, acting on their feedback, and ensuring they feel in control of their own hair and skincare choices.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (avgWaitingTime > 28 && totalSpecialistReferrals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reduce specialist waiting times — build a network of readily accessible culturally appropriate hair and skin specialists to ensure children are seen within a reasonable timeframe. Long waits may affect children's wellbeing and self-esteem.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (productAvailabilityRate >= 50 && productAvailabilityRate < 70 && totalProductRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve product provision to ensure culturally appropriate products are consistently available — review stock management, supplier arrangements, and budget allocation. Involve children in product selection to increase approval and satisfaction.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (specialistAccessRate >= 50 && specialistAccessRate < 70 && totalSpecialistReferrals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve specialist referral outcomes by ensuring appointments are attended, outcomes are positive, and children are satisfied with specialist care. Build relationships with trusted specialists and provide transport support where needed.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (childVoiceHairRate < 50 && totalHairCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Routinely capture children's voices in hair care decisions — ask children about their preferred styles, products, frequency of care, and who they want providing care. Hair is deeply personal and culturally significant — children must have agency.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (confidentSelfCareRate < 50 && totalSatisfactionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop children's confidence and independence in personal care — provide education about their hair type and skin type, teach self-care techniques, and create opportunities for children to practise and develop these essential life skills.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (feelsCulturallyRespectedRate >= 50 && feelsCulturallyRespectedRate < 70 && totalSatisfactionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen cultural respect in personal care — review how staff approach hair and skincare conversations, ensure products and techniques reflect children's cultural heritage, and celebrate diversity in personal care as part of the home's identity-affirming practice.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (hairCareCoverage < 80 && hairCareCoverage >= 50 && total_children > 0 && totalHairCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend hair care record coverage to include all children — ensure every child's hair care needs are individually assessed, documented, and provided for regardless of their ethnic background.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (skincareCoverage < 80 && skincareCoverage >= 50 && total_children > 0 && totalSkincareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend skincare record coverage to include all children — ensure every child's skincare needs are individually assessed and addressed with appropriate routines and products.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: EthnicHairSkincareInsight[] = [];

  // -- Critical insights --

  if (hairCareRate < 40 && totalHairCareRecords > 0) {
    insights.push({
      text: `Only ${hairCareRate}% ethnic hair care quality. Inadequate hair care for children from diverse ethnic backgrounds is a failure of identity support under Reg 5. Hair care is deeply personal and culturally significant — poor provision damages children's self-esteem, cultural identity, and physical wellbeing. Ofsted will consider this a serious shortcoming.`,
      severity: "critical",
    });
  }

  if (skincareRoutineRate < 40 && totalSkincareRecords > 0) {
    insights.push({
      text: `Only ${skincareRoutineRate}% skincare routine adequacy. Melanin-rich skin has specific moisturising, protection, and care needs. Failing to provide adequate skincare routines with appropriate products constitutes neglect of children's physical and identity needs under Reg 5.`,
      severity: "critical",
    });
  }

  if (staffTrainingRate < 30 && totalStaffTrainDenom > 0) {
    insights.push({
      text: `Only ${staffTrainingRate}% staff competency in ethnic hair and skincare. Without adequate training, staff cannot provide competent care for children's diverse hair and skin needs. This is not merely a knowledge gap — it signals institutional neglect of children's cultural identity and physical care needs. Ofsted expects staff to be equipped to meet every child's identity needs.`,
      severity: "critical",
    });
  }

  if (childSatisfactionRate < 30 && totalSatisDenom > 0) {
    insights.push({
      text: `Only ${childSatisfactionRate}% child satisfaction with personal care. Children are telling us through their dissatisfaction that their hair and skincare needs are not being met. Under Reg 7, children's views must inform their care — low satisfaction in such a personal area directly impacts self-esteem, identity, and emotional wellbeing.`,
      severity: "critical",
    });
  }

  if (totalHairCareRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No ethnic hair care records despite children being on placement. The absence of any hair care provision records means the home cannot evidence that children's ethnic hair care needs are being assessed or met. This is a fundamental gap in identity support and personal care provision.",
      severity: "critical",
    });
  }

  if (totalSkincareRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No skincare routine records despite children being on placement. Without documented skincare routines, the home cannot demonstrate that children's skin type and tone-specific needs are being identified and addressed. This is particularly important for children with melanin-rich skin who require specific moisturising and SPF provision.",
      severity: "critical",
    });
  }

  if (feelsCulturallyRespectedRate < 50 && totalSatisfactionRecords > 0) {
    insights.push({
      text: `Only ${feelsCulturallyRespectedRate}% of children feel culturally respected in personal care. When children do not feel their cultural identity is respected in something as personal as hair and skincare, it erodes their sense of belonging and self-worth. This requires immediate cultural competency intervention.`,
      severity: "critical",
    });
  }

  if (culturallyMatchedRate < 40 && totalHairCareRecords > 0) {
    insights.push({
      text: `Only ${culturallyMatchedRate}% of hair care uses culturally matched products. Using generic or inappropriate products on diverse hair types can cause damage, breakage, and pain. Culturally matched products are not a luxury — they are a basic requirement for children's physical care and identity support.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (hairCareRate >= 40 && hairCareRate < 70 && totalHairCareRecords > 0) {
    insights.push({
      text: `Ethnic hair care quality at ${hairCareRate}% — while some provision is in place, inconsistencies in care planning, product matching, or capturing children's preferences mean hair care is not yet at the standard required. Strengthening care plans and cultural matching would improve outcomes.`,
      severity: "warning",
    });
  }

  if (skincareRoutineRate >= 40 && skincareRoutineRate < 70 && totalSkincareRecords > 0) {
    insights.push({
      text: `Skincare routine adequacy at ${skincareRoutineRate}% — routines exist but gaps in consistency, product appropriateness, or children's education mean skincare provision is not yet comprehensive. Regular review and improved product sourcing would strengthen this area.`,
      severity: "warning",
    });
  }

  if (staffTrainingRate >= 30 && staffTrainingRate < 70 && totalStaffTrainDenom > 0) {
    insights.push({
      text: `Staff competency in ethnic hair and skincare at ${staffTrainingRate}% — some staff have relevant knowledge but training is not universal. Inconsistent staff competency means children's experience of personal care varies depending on who is on shift.`,
      severity: "warning",
    });
  }

  if (childSatisfactionRate >= 30 && childSatisfactionRate < 70 && totalSatisDenom > 0) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — some children are satisfied but many are not. Understanding the specific concerns of dissatisfied children and acting on their feedback is essential to improving personal care provision.`,
      severity: "warning",
    });
  }

  if (productAvailabilityRate >= 50 && productAvailabilityRate < 70 && totalProductRecords > 0) {
    insights.push({
      text: `Product availability at ${productAvailabilityRate}% — while some culturally appropriate products are available, inconsistencies in stock levels, budget allocation, or child approval mean product provision is not yet reliable.`,
      severity: "warning",
    });
  }

  if (specialistAccessRate >= 50 && specialistAccessRate < 70 && totalSpecialistReferrals > 0) {
    insights.push({
      text: `Specialist access at ${specialistAccessRate}% — referrals are being made but outcomes, attendance, or child satisfaction are not consistently positive. Building stronger relationships with trusted specialists would improve this area.`,
      severity: "warning",
    });
  }

  if (avgWaitingTime > 21 && avgWaitingTime <= 28 && totalSpecialistReferrals > 0) {
    insights.push({
      text: `Average specialist waiting time is ${avgWaitingTime} days — while within acceptable limits, reducing waiting times would better serve children's needs and demonstrate proactive care.`,
      severity: "warning",
    });
  }

  if (confidentSelfCareRate >= 30 && confidentSelfCareRate < 70 && totalSatisfactionRecords > 0) {
    insights.push({
      text: `Only ${confidentSelfCareRate}% of children confident in self-care. Building children's independence in managing their own hair and skincare is an important life skill and contributes to their identity development. More education and practice opportunities would help.`,
      severity: "warning",
    });
  }

  if (protectiveStylingRate < 50 && totalHairCareRecords > 0) {
    insights.push({
      text: `Protective styling offered in only ${protectiveStylingRate}% of hair care records. Protective styles (braids, twists, locs, wraps) are essential for maintaining afro and textured hair health. The home should ensure protective styling is routinely offered and accessible.`,
      severity: "warning",
    });
  }

  if (childEducatedSkincareRate < 50 && totalSkincareRecords > 0) {
    insights.push({
      text: `Only ${childEducatedSkincareRate}% of children educated about their skincare routine. Teaching children to understand and manage their own skincare is essential for independence, especially for children approaching leaving care. This is both a care need and a life skill.`,
      severity: "warning",
    });
  }

  // Identify specialist type coverage gaps
  const specialistTypes: Record<string, number> = {};
  for (const r of specialist_referral_records) {
    specialistTypes[r.specialist_type] = (specialistTypes[r.specialist_type] ?? 0) + 1;
  }
  const allSpecialistTypes = [
    "afro_hair_specialist",
    "trichologist",
    "barber_culturally_skilled",
    "dermatologist",
    "skin_specialist",
    "braider",
    "loctician",
  ];
  const missingSpecialistTypes = allSpecialistTypes.filter(
    (t) => !specialistTypes[t] || specialistTypes[t] === 0,
  );
  if (missingSpecialistTypes.length >= 4 && totalSpecialistReferrals > 3) {
    insights.push({
      text: `Specialist referral network limited — no referrals to ${missingSpecialistTypes.slice(0, 3).join(", ")} specialists. A broader network of culturally skilled hair and skincare specialists would give children more choice and better access to appropriate care.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (haircare_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding ethnic hair and skincare provision — children's hair care and skincare needs are met with culturally appropriate products, skilled staff, specialist access, and genuine respect for children's cultural identity and personal preferences. This is a model of identity-affirming personal care.",
      severity: "positive",
    });
  }

  if (hairCareRate >= 90 && staffTrainedEthnicHairRate >= 90 && totalHairCareRecords > 0) {
    insights.push({
      text: `${hairCareRate}% hair care quality with ${staffTrainedEthnicHairRate}% staff trained in ethnic hair care — the home combines high-quality care planning with staff competency, ensuring children receive knowledgeable, culturally appropriate hair care from people who understand their needs.`,
      severity: "positive",
    });
  }

  if (skincareRoutineRate >= 90 && moisturisingRate >= 90 && totalSkincareRecords > 0) {
    insights.push({
      text: `${skincareRoutineRate}% skincare routine quality with ${moisturisingRate}% adequate moisturising — comprehensive skincare provision ensures children's skin is properly cared for with appropriate products and consistent routines.`,
      severity: "positive",
    });
  }

  if (childSatisfactionRate >= 90 && feelsCulturallyRespectedRate >= 90 && totalSatisDenom > 0 && totalSatisfactionRecords > 0) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction with ${feelsCulturallyRespectedRate}% feeling culturally respected — children genuinely feel that their cultural identity is valued and their personal care preferences are heard and acted upon. This is the gold standard for identity-affirming care.`,
      severity: "positive",
    });
  }

  if (productAvailabilityRate >= 90 && avgProductQuality >= 4.0 && totalProductRecords > 0) {
    insights.push({
      text: `${productAvailabilityRate}% product availability with quality averaging ${avgProductQuality}/5 — the home invests in high-quality, culturally appropriate products that are consistently available and approved by children.`,
      severity: "positive",
    });
  }

  if (specialistAccessRate >= 90 && staffAdvocatedRate >= 90 && totalSpecialistReferrals > 0) {
    insights.push({
      text: `${specialistAccessRate}% specialist access with ${staffAdvocatedRate}% staff advocacy — staff actively champion children's access to culturally appropriate specialists, ensuring referrals are made, appointments attended, and outcomes are positive.`,
      severity: "positive",
    });
  }

  if (confidentSelfCareRate >= 90 && totalSatisfactionRecords > 0) {
    insights.push({
      text: `${confidentSelfCareRate}% of children are confident in managing their own hair and skincare — the home is successfully developing children's independence in personal care, equipping them with essential life skills for the future.`,
      severity: "positive",
    });
  }

  if (hairCareCoverage >= 100 && skincareCoverage >= 100 && total_children > 0) {
    insights.push({
      text: "Every child has both hair care and skincare records — comprehensive coverage ensures no child's personal care needs are overlooked, demonstrating systematic attention to culturally appropriate care for all children.",
      severity: "positive",
    });
  }

  if (complaintResolutionRate >= 100 && complaintsRaised > 0) {
    insights.push({
      text: "All personal care complaints resolved — the home demonstrates a responsive approach to children's concerns about hair and skincare, ensuring issues are addressed and children feel heard.",
      severity: "positive",
    });
  }

  if (canChooseProductsRate >= 90 && canChooseStylistRate >= 90 && totalSatisfactionRecords > 0) {
    insights.push({
      text: `${canChooseProductsRate}% of children can choose their products and ${canChooseStylistRate}% can choose their stylist — children exercise genuine agency over their personal care, a powerful demonstration of identity support and respect for individual preferences.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (haircare_rating === "outstanding") {
    headline =
      "Outstanding ethnic hair and skincare provision — culturally appropriate care is embedded, staff are well-trained, children are satisfied, and personal care genuinely supports children's identity and wellbeing.";
  } else if (haircare_rating === "good") {
    headline = `Good ethnic hair and skincare provision — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (haircare_rating === "adequate") {
    headline = `Adequate ethnic hair and skincare provision — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure culturally appropriate personal care for all children.`;
  } else {
    headline = `Ethnic hair and skincare provision is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children receive culturally appropriate hair care, skincare, and identity-affirming personal care.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    haircare_rating,
    haircare_score: score,
    headline,
    total_hair_care_records: totalHairCareRecords,
    total_skincare_records: totalSkincareRecords,
    total_product_records: totalProductRecords,
    total_specialist_referrals: totalSpecialistReferrals,
    total_satisfaction_records: totalSatisfactionRecords,
    hair_care_rate: hairCareRate,
    skincare_routine_rate: skincareRoutineRate,
    product_availability_rate: productAvailabilityRate,
    specialist_access_rate: specialistAccessRate,
    staff_training_rate: staffTrainingRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
