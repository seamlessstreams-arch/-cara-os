// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LAUNDRY & LINEN MANAGEMENT INTELLIGENCE ENGINE
// Monitors laundry service timeliness, linen adequacy and condition, personal
// clothing care respect, hygiene compliance, and child satisfaction across the
// home. Ensures every child experiences clean, well-maintained clothing and
// linen that respects their preferences, cultural needs, and independence.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises — fit-for-purpose living conditions),
// Reg 5 (Engaging with the wider system to support children's needs).
// SCCIF: "Children's experiences and progress".
// Store keys: laundryServiceRecords, linenAdequacyRecords,
//             clothingCareRecords, hygieneComplianceRecords,
//             childSatisfactionRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LaundryServiceRecordInput {
  id: string;
  child_id: string;
  date: string;
  laundry_type: "personal_clothing" | "bedding" | "towels" | "specialist_items" | "communal_linen" | "other";
  items_collected: boolean;
  items_returned: boolean;
  returned_within_24h: boolean;
  returned_clean: boolean;
  returned_undamaged: boolean;
  child_preferences_followed: boolean;
  labelling_intact: boolean;
  mixed_with_others: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface LinenAdequacyRecordInput {
  id: string;
  child_id: string;
  assessment_date: string;
  bedding_sufficient: boolean;
  bedding_clean: boolean;
  bedding_condition_good: boolean;
  towels_sufficient: boolean;
  towels_clean: boolean;
  towels_condition_good: boolean;
  spare_linen_available: boolean;
  linen_age_appropriate: boolean;
  linen_child_chosen: boolean;
  seasonal_bedding_provided: boolean;
  mattress_condition_good: boolean;
  pillow_condition_good: boolean;
  overall_adequacy_score: number | null; // 1-5
  issues_identified: string[];
  issues_resolved: boolean;
  resolution_date: string | null;
  assessed_by: string;
  created_at: string;
}

export interface ClothingCareRecordInput {
  id: string;
  child_id: string;
  date: string;
  clothing_type: "everyday" | "school_uniform" | "cultural_religious" | "special_occasion" | "sports_activewear" | "nightwear" | "outerwear" | "other";
  care_instructions_followed: boolean;
  clothing_returned_to_correct_child: boolean;
  clothing_condition_maintained: boolean;
  child_preferences_respected: boolean;
  cultural_needs_met: boolean;
  clothing_labelled: boolean;
  ironing_pressing_done: boolean;
  stain_treatment_attempted: boolean;
  child_involved_in_care: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface HygieneComplianceRecordInput {
  id: string;
  assessment_date: string;
  laundry_area_clean: boolean;
  laundry_area_ventilated: boolean;
  equipment_maintained: boolean;
  detergent_appropriate: boolean;
  allergen_safe_products_used: boolean;
  temperature_wash_correct: boolean;
  separation_protocols_followed: boolean;
  infection_control_measures_met: boolean;
  soiled_linen_handled_correctly: boolean;
  drying_facilities_adequate: boolean;
  storage_clean_appropriate: boolean;
  staff_trained: boolean;
  hand_hygiene_observed: boolean;
  overall_compliance_score: number | null; // 1-5
  issues_identified: string[];
  issues_resolved: boolean;
  resolution_date: string | null;
  assessed_by: string;
  created_at: string;
}

export interface ChildSatisfactionRecordInput {
  id: string;
  child_id: string;
  date: string;
  satisfaction_rating: number; // 1-5
  clothing_clean_enough: boolean;
  clothing_returned_timely: boolean;
  clothing_handled_with_care: boolean;
  bedding_comfortable: boolean;
  preferences_listened_to: boolean;
  allowed_to_do_own_laundry: boolean;
  wants_more_independence: boolean;
  cultural_needs_respected: boolean;
  favourite_items_treated_well: boolean;
  feels_respected: boolean;
  feedback_text: string | null;
  staff_member: string;
  created_at: string;
}

export interface LaundryLinenInput {
  today: string;
  total_children: number;
  laundry_service_records: LaundryServiceRecordInput[];
  linen_adequacy_records: LinenAdequacyRecordInput[];
  clothing_care_records: ClothingCareRecordInput[];
  hygiene_compliance_records: HygieneComplianceRecordInput[];
  child_satisfaction_records: ChildSatisfactionRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type LaundryLinenRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface LaundryLinenInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface LaundryLinenRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface LaundryLinenResult {
  laundry_rating: LaundryLinenRating;
  laundry_score: number | null;
  headline: string;
  total_service_records: number;
  total_linen_assessments: number;
  total_clothing_care_records: number;
  total_hygiene_assessments: number;
  total_satisfaction_records: number;
  laundry_timeliness_rate: number | null;
  linen_adequacy_rate: number | null;
  clothing_care_rate: number | null;
  hygiene_compliance_rate: number | null;
  child_satisfaction_rate: number | null;
  child_independence_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: LaundryLinenRecommendation[];
  insights: LaundryLinenInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): LaundryLinenRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: LaundryLinenRating,
  score: number,
  headline: string,
): LaundryLinenResult {
  return {
    laundry_rating: rating,
    laundry_score: score,
    headline,
    total_service_records: 0,
    total_linen_assessments: 0,
    total_clothing_care_records: 0,
    total_hygiene_assessments: 0,
    total_satisfaction_records: 0,
    laundry_timeliness_rate: 0,
    linen_adequacy_rate: 0,
    clothing_care_rate: 0,
    hygiene_compliance_rate: 0,
    child_satisfaction_rate: 0,
    child_independence_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeLaundryLinenManagement(
  input: LaundryLinenInput,
): LaundryLinenResult {
  const {
    total_children,
    laundry_service_records,
    linen_adequacy_records,
    clothing_care_records,
    hygiene_compliance_records,
    child_satisfaction_records,
  } = input;

  // ── Special case: all empty + 0 children -> insufficient_data ──────────
  const allEmpty =
    laundry_service_records.length === 0 &&
    linen_adequacy_records.length === 0 &&
    clothing_care_records.length === 0 &&
    hygiene_compliance_records.length === 0 &&
    child_satisfaction_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess laundry and linen management.",
    );
  }

  // ── Special case: all empty + children > 0 -> inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No laundry or linen management data recorded despite children on placement — laundry and linen management requires urgent attention.",
      ),
      concerns: [
        "No laundry service records, linen adequacy assessments, clothing care records, hygiene compliance checks, or child satisfaction records exist despite children being on placement — the home cannot evidence adequate laundry and linen management or respect for children's personal clothing.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of laundry services, linen adequacy assessments, clothing care, hygiene compliance, and child satisfaction to evidence the home's management of children's laundry and linen needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child's clothing is laundered and returned promptly, linen is adequate and well maintained, and children's preferences and cultural needs are respected in all laundry and clothing care practices.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
        },
      ],
      insights: [
        {
          text: "The complete absence of laundry and linen management records means Ofsted cannot verify that children's clothing is treated with care, linen meets acceptable standards, or hygiene protocols are followed. This represents a fundamental gap in Reg 25 compliance and undermines evidence that the home promotes children's dignity and wellbeing.",
          severity: "critical",
        },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTE CORE METRICS
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. Laundry service metrics ─────────────────────────────────────────
  const totalServiceRecords = laundry_service_records.length;

  const itemsCollected = laundry_service_records.filter((r) => r.items_collected).length;
  const collectionRate = pct(itemsCollected, totalServiceRecords);

  const itemsReturned = laundry_service_records.filter((r) => r.items_returned).length;
  const returnRate = pct(itemsReturned, totalServiceRecords);

  const returnedWithin24h = laundry_service_records.filter((r) => r.returned_within_24h).length;
  const timelinessRate = pct(returnedWithin24h, totalServiceRecords);

  const returnedClean = laundry_service_records.filter((r) => r.returned_clean).length;
  const cleanlinessRate = pct(returnedClean, totalServiceRecords);

  const returnedUndamaged = laundry_service_records.filter((r) => r.returned_undamaged).length;
  const undamagedRate = pct(returnedUndamaged, totalServiceRecords);

  const preferencesFollowed = laundry_service_records.filter((r) => r.child_preferences_followed).length;
  const preferenceRate = pct(preferencesFollowed, totalServiceRecords);

  const labellingIntact = laundry_service_records.filter((r) => r.labelling_intact).length;
  const labellingRate = pct(labellingIntact, totalServiceRecords);

  const notMixedWithOthers = laundry_service_records.filter((r) => !r.mixed_with_others).length;
  const separationRate = pct(notMixedWithOthers, totalServiceRecords);

  // Composite laundry timeliness: collected + returned + within 24h + clean + undamaged
  const laundryTimelinessNumerator = itemsCollected + itemsReturned + returnedWithin24h + returnedClean + returnedUndamaged;
  const laundryTimelinessDenominator = totalServiceRecords * 5;
  const laundryTimelinessRate = pct(laundryTimelinessNumerator, laundryTimelinessDenominator);

  // ── 2. Linen adequacy metrics ──────────────────────────────────────────
  const totalLinenAssessments = linen_adequacy_records.length;

  const linenChecks = [
    (r: LinenAdequacyRecordInput) => r.bedding_sufficient,
    (r: LinenAdequacyRecordInput) => r.bedding_clean,
    (r: LinenAdequacyRecordInput) => r.bedding_condition_good,
    (r: LinenAdequacyRecordInput) => r.towels_sufficient,
    (r: LinenAdequacyRecordInput) => r.towels_clean,
    (r: LinenAdequacyRecordInput) => r.towels_condition_good,
    (r: LinenAdequacyRecordInput) => r.spare_linen_available,
    (r: LinenAdequacyRecordInput) => r.linen_age_appropriate,
    (r: LinenAdequacyRecordInput) => r.seasonal_bedding_provided,
    (r: LinenAdequacyRecordInput) => r.mattress_condition_good,
    (r: LinenAdequacyRecordInput) => r.pillow_condition_good,
  ];
  const totalLinenChecksPossible = totalLinenAssessments * linenChecks.length;
  let totalLinenChecksPassed = 0;
  for (const rec of linen_adequacy_records) {
    for (const check of linenChecks) {
      if (check(rec)) totalLinenChecksPassed++;
    }
  }
  const linenAdequacyRate = pct(totalLinenChecksPassed, totalLinenChecksPossible);

  const linenChildChosen = linen_adequacy_records.filter((r) => r.linen_child_chosen).length;
  const linenChildChoiceRate = pct(linenChildChosen, totalLinenAssessments);

  const linenIssuesIdentified = linen_adequacy_records.filter(
    (r) => r.issues_identified.length > 0,
  ).length;
  const linenIssuesResolved = linen_adequacy_records.filter(
    (r) => r.issues_identified.length > 0 && r.issues_resolved,
  ).length;
  const linenIssueResolutionRate = pct(linenIssuesResolved, linenIssuesIdentified);

  const linenScoreSum = linen_adequacy_records.reduce(
    (sum, r) => sum + (r.overall_adequacy_score ?? 0),
    0,
  );
  const avgLinenScore =
    totalLinenAssessments > 0
      ? Math.round((linenScoreSum / totalLinenAssessments) * 100) / 100
      : null;

  // ── 3. Clothing care metrics ───────────────────────────────────────────
  const totalClothingCareRecords = clothing_care_records.length;

  const careInstructionsFollowed = clothing_care_records.filter((r) => r.care_instructions_followed).length;
  const careInstructionRate = pct(careInstructionsFollowed, totalClothingCareRecords);

  const returnedToCorrectChild = clothing_care_records.filter((r) => r.clothing_returned_to_correct_child).length;
  const correctReturnRate = pct(returnedToCorrectChild, totalClothingCareRecords);

  const conditionMaintained = clothing_care_records.filter((r) => r.clothing_condition_maintained).length;
  const conditionRate = pct(conditionMaintained, totalClothingCareRecords);

  const clothingPrefsRespected = clothing_care_records.filter((r) => r.child_preferences_respected).length;
  const clothingPreferenceRate = pct(clothingPrefsRespected, totalClothingCareRecords);

  const culturalNeedsMet = clothing_care_records.filter((r) => r.cultural_needs_met).length;
  const culturalCareRate = pct(culturalNeedsMet, totalClothingCareRecords);

  const clothingLabelled = clothing_care_records.filter((r) => r.clothing_labelled).length;
  const clothingLabelRate = pct(clothingLabelled, totalClothingCareRecords);

  const ironingDone = clothing_care_records.filter((r) => r.ironing_pressing_done).length;
  const ironingRate = pct(ironingDone, totalClothingCareRecords);

  const stainTreated = clothing_care_records.filter((r) => r.stain_treatment_attempted).length;
  const stainTreatmentRate = pct(stainTreated, totalClothingCareRecords);

  const childInvolvedInCare = clothing_care_records.filter((r) => r.child_involved_in_care).length;
  const childCareInvolvementRate = pct(childInvolvedInCare, totalClothingCareRecords);

  // Composite clothing care: care instructions + correct return + condition + prefs + cultural
  const clothingCareNumerator = careInstructionsFollowed + returnedToCorrectChild + conditionMaintained + clothingPrefsRespected + culturalNeedsMet;
  const clothingCareDenominator = totalClothingCareRecords * 5;
  const clothingCareRate = pct(clothingCareNumerator, clothingCareDenominator);

  // ── 4. Hygiene compliance metrics ──────────────────────────────────────
  const totalHygieneAssessments = hygiene_compliance_records.length;

  const hygieneChecks = [
    (r: HygieneComplianceRecordInput) => r.laundry_area_clean,
    (r: HygieneComplianceRecordInput) => r.laundry_area_ventilated,
    (r: HygieneComplianceRecordInput) => r.equipment_maintained,
    (r: HygieneComplianceRecordInput) => r.detergent_appropriate,
    (r: HygieneComplianceRecordInput) => r.allergen_safe_products_used,
    (r: HygieneComplianceRecordInput) => r.temperature_wash_correct,
    (r: HygieneComplianceRecordInput) => r.separation_protocols_followed,
    (r: HygieneComplianceRecordInput) => r.infection_control_measures_met,
    (r: HygieneComplianceRecordInput) => r.soiled_linen_handled_correctly,
    (r: HygieneComplianceRecordInput) => r.drying_facilities_adequate,
    (r: HygieneComplianceRecordInput) => r.storage_clean_appropriate,
    (r: HygieneComplianceRecordInput) => r.staff_trained,
    (r: HygieneComplianceRecordInput) => r.hand_hygiene_observed,
  ];
  const totalHygieneChecksPossible = totalHygieneAssessments * hygieneChecks.length;
  let totalHygieneChecksPassed = 0;
  for (const rec of hygiene_compliance_records) {
    for (const check of hygieneChecks) {
      if (check(rec)) totalHygieneChecksPassed++;
    }
  }
  const hygieneComplianceRate = pct(totalHygieneChecksPassed, totalHygieneChecksPossible);

  const hygieneIssuesIdentified = hygiene_compliance_records.filter(
    (r) => r.issues_identified.length > 0,
  ).length;
  const hygieneIssuesResolved = hygiene_compliance_records.filter(
    (r) => r.issues_identified.length > 0 && r.issues_resolved,
  ).length;
  const hygieneIssueResolutionRate = pct(hygieneIssuesResolved, hygieneIssuesIdentified);

  const hygieneScoreSum = hygiene_compliance_records.reduce(
    (sum, r) => sum + (r.overall_compliance_score ?? 0),
    0,
  );
  const avgHygieneScore =
    totalHygieneAssessments > 0
      ? Math.round((hygieneScoreSum / totalHygieneAssessments) * 100) / 100
      : null;

  const infectionControlMet = hygiene_compliance_records.filter((r) => r.infection_control_measures_met).length;
  const infectionControlRate = pct(infectionControlMet, totalHygieneAssessments);

  const soiledLinenCorrect = hygiene_compliance_records.filter((r) => r.soiled_linen_handled_correctly).length;
  const soiledLinenRate = pct(soiledLinenCorrect, totalHygieneAssessments);

  const staffTrained = hygiene_compliance_records.filter((r) => r.staff_trained).length;
  const staffTrainedRate = pct(staffTrained, totalHygieneAssessments);

  // ── 5. Child satisfaction metrics ──────────────────────────────────────
  const totalSatisfactionRecords = child_satisfaction_records.length;

  const satisfactionSum = child_satisfaction_records.reduce((sum, r) => sum + r.satisfaction_rating, 0);
  const avgSatisfactionRating =
    totalSatisfactionRecords > 0
      ? Math.round((satisfactionSum / totalSatisfactionRecords) * 100) / 100
      : null;

  const clothingCleanEnough = child_satisfaction_records.filter((r) => r.clothing_clean_enough).length;
  const cleanEnoughRate = pct(clothingCleanEnough, totalSatisfactionRecords);

  const clothingReturnedTimely = child_satisfaction_records.filter((r) => r.clothing_returned_timely).length;
  const returnedTimelyRate = pct(clothingReturnedTimely, totalSatisfactionRecords);

  const handledWithCare = child_satisfaction_records.filter((r) => r.clothing_handled_with_care).length;
  const handledWithCareRate = pct(handledWithCare, totalSatisfactionRecords);

  const beddingComfortable = child_satisfaction_records.filter((r) => r.bedding_comfortable).length;
  const beddingComfortRate = pct(beddingComfortable, totalSatisfactionRecords);

  const preferencesListened = child_satisfaction_records.filter((r) => r.preferences_listened_to).length;
  const preferencesListenedRate = pct(preferencesListened, totalSatisfactionRecords);

  const feelsRespected = child_satisfaction_records.filter((r) => r.feels_respected).length;
  const feelsRespectedRate = pct(feelsRespected, totalSatisfactionRecords);

  const allowedOwnLaundry = child_satisfaction_records.filter((r) => r.allowed_to_do_own_laundry).length;
  const ownLaundryRate = pct(allowedOwnLaundry, totalSatisfactionRecords);

  const wantsMoreIndependence = child_satisfaction_records.filter((r) => r.wants_more_independence).length;
  const wantsMoreIndependenceRate = pct(wantsMoreIndependence, totalSatisfactionRecords);

  const culturalNeedsRespected = child_satisfaction_records.filter((r) => r.cultural_needs_respected).length;
  const culturalRespectRate = pct(culturalNeedsRespected, totalSatisfactionRecords);

  const favouriteItemsTreated = child_satisfaction_records.filter((r) => r.favourite_items_treated_well).length;
  const favouriteItemsRate = pct(favouriteItemsTreated, totalSatisfactionRecords);

  // Composite child satisfaction: clean + timely + handled with care + bedding comfortable + prefs listened + feels respected
  const satisfactionNumerator = clothingCleanEnough + clothingReturnedTimely + handledWithCare + beddingComfortable + preferencesListened + feelsRespected;
  const satisfactionDenominator = totalSatisfactionRecords * 6;
  const childSatisfactionRate = pct(satisfactionNumerator, satisfactionDenominator);

  // Child independence rate: allowed own laundry + child involved in care
  const independenceNumerator = allowedOwnLaundry + childInvolvedInCare;
  const independenceDenominator = totalSatisfactionRecords + totalClothingCareRecords;
  const childIndependenceRate = pct(independenceNumerator, independenceDenominator);

  // ══════════════════════════════════════════════════════════════════════════
  // SCORING: base 52, max bonuses +28, 4 penalties guarded by .length > 0
  // ══════════════════════════════════════════════════════════════════════════

  let score = 52;

  // --- Bonus 1: laundryTimelinessRate (>=90: +4, >=70: +2) ---
  if (laundryTimelinessRate >= 90) score += 4;
  else if (laundryTimelinessRate >= 70) score += 2;

  // --- Bonus 2: linenAdequacyRate (>=90: +4, >=70: +2) ---
  if (linenAdequacyRate >= 90) score += 4;
  else if (linenAdequacyRate >= 70) score += 2;

  // --- Bonus 3: clothingCareRate (>=90: +4, >=70: +2) ---
  if (clothingCareRate >= 90) score += 4;
  else if (clothingCareRate >= 70) score += 2;

  // --- Bonus 4: hygieneComplianceRate (>=90: +4, >=70: +2) ---
  if (hygieneComplianceRate >= 90) score += 4;
  else if (hygieneComplianceRate >= 70) score += 2;

  // --- Bonus 5: childSatisfactionRate (>=90: +4, >=70: +2) ---
  if (childSatisfactionRate >= 90) score += 4;
  else if (childSatisfactionRate >= 70) score += 2;

  // --- Bonus 6: childIndependenceRate (>=80: +4, >=50: +2) ---
  if (childIndependenceRate >= 80) score += 4;
  else if (childIndependenceRate >= 50) score += 2;

  // --- Bonus 7: linenIssueResolutionRate (>=90 or no issues: +2, >=70: +1) ---
  if (linenIssuesIdentified === 0 && totalLinenAssessments > 0) score += 2;
  else if (linenIssueResolutionRate >= 90) score += 2;
  else if (linenIssueResolutionRate >= 70) score += 1;

  // --- Bonus 8: culturalCareRate (>=90: +2, >=70: +1) ---
  if (culturalCareRate >= 90) score += 2;
  else if (culturalCareRate >= 70) score += 1;

  // ── Penalties (4, guarded by array.length > 0) ────────────────────────

  // Penalty 1: laundryTimelinessRate < 50 -> -5
  if (laundryTimelinessRate < 50 && laundry_service_records.length > 0) score -= 5;

  // Penalty 2: linenAdequacyRate < 50 -> -5
  if (linenAdequacyRate < 50 && linen_adequacy_records.length > 0) score -= 5;

  // Penalty 3: hygieneComplianceRate < 50 -> -5
  if (hygieneComplianceRate < 50 && hygiene_compliance_records.length > 0) score -= 5;

  // Penalty 4: childSatisfactionRate < 40 -> -3
  if (childSatisfactionRate < 40 && child_satisfaction_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const laundry_rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  // -- Laundry timeliness strengths --
  if (laundryTimelinessRate >= 90 && totalServiceRecords > 0) {
    strengths.push(
      `${laundryTimelinessRate}% laundry service quality — clothing and linen are collected, laundered, and returned promptly in clean, undamaged condition, demonstrating excellent service management.`,
    );
  } else if (laundryTimelinessRate >= 70 && totalServiceRecords > 0) {
    strengths.push(
      `${laundryTimelinessRate}% laundry service quality — the home generally provides a timely and effective laundry service for children's clothing and linen.`,
    );
  }

  // -- Timeliness sub-metric strength --
  if (timelinessRate >= 90 && totalServiceRecords > 0) {
    strengths.push(
      `${timelinessRate}% of laundry returned within 24 hours — children's clothing is turned around promptly, ensuring they always have clean items available and do not experience unnecessary disruption.`,
    );
  } else if (timelinessRate >= 70 && totalServiceRecords > 0 && laundryTimelinessRate < 90) {
    strengths.push(
      `${timelinessRate}% of laundry returned within 24 hours — the majority of children's clothing is returned in a timely manner.`,
    );
  }

  // -- Linen adequacy strengths --
  if (linenAdequacyRate >= 90 && totalLinenAssessments > 0) {
    strengths.push(
      `${linenAdequacyRate}% linen adequacy — bedding, towels, and linen consistently meet high standards for sufficiency, cleanliness, condition, and age-appropriateness across the home.`,
    );
  } else if (linenAdequacyRate >= 70 && totalLinenAssessments > 0) {
    strengths.push(
      `${linenAdequacyRate}% linen adequacy — the majority of linen assessments confirm acceptable standards of bedding, towels, and related items.`,
    );
  }

  // -- Linen child choice --
  if (linenChildChoiceRate >= 80 && totalLinenAssessments > 0) {
    strengths.push(
      `${linenChildChoiceRate}% of children involved in choosing their linen — children exercise agency in personalising their bedroom environment, supporting their sense of belonging and identity.`,
    );
  } else if (linenChildChoiceRate >= 60 && totalLinenAssessments > 0) {
    strengths.push(
      `${linenChildChoiceRate}% of children involved in choosing their linen — the home encourages children to personalise their sleeping environment.`,
    );
  }

  // -- Clothing care strengths --
  if (clothingCareRate >= 90 && totalClothingCareRecords > 0) {
    strengths.push(
      `${clothingCareRate}% clothing care quality — care instructions are followed, clothing is returned to the correct child in good condition, and children's preferences and cultural needs are respected consistently.`,
    );
  } else if (clothingCareRate >= 70 && totalClothingCareRecords > 0) {
    strengths.push(
      `${clothingCareRate}% clothing care quality — the home generally handles children's clothing with appropriate care and respect for preferences.`,
    );
  }

  // -- Cultural care --
  if (culturalCareRate >= 90 && totalClothingCareRecords > 0) {
    strengths.push(
      `${culturalCareRate}% cultural needs met in clothing care — the home demonstrates excellent sensitivity to children's cultural and religious clothing requirements, reflecting inclusive and respectful practice.`,
    );
  } else if (culturalCareRate >= 70 && totalClothingCareRecords > 0) {
    strengths.push(
      `${culturalCareRate}% cultural needs met in clothing care — the home generally respects children's cultural clothing requirements.`,
    );
  }

  // -- Hygiene compliance strengths --
  if (hygieneComplianceRate >= 90 && totalHygieneAssessments > 0) {
    strengths.push(
      `${hygieneComplianceRate}% hygiene compliance — laundry facilities, equipment, processes, and infection control measures consistently meet high standards, protecting children's health and wellbeing.`,
    );
  } else if (hygieneComplianceRate >= 70 && totalHygieneAssessments > 0) {
    strengths.push(
      `${hygieneComplianceRate}% hygiene compliance — the majority of hygiene and infection control standards are met in laundry operations.`,
    );
  }

  // -- Infection control --
  if (infectionControlRate >= 90 && totalHygieneAssessments > 0) {
    strengths.push(
      `${infectionControlRate}% infection control measures met — the home maintains robust infection prevention protocols in laundry handling, reducing cross-contamination risk for children.`,
    );
  }

  // -- Child satisfaction strengths --
  if (childSatisfactionRate >= 90 && totalSatisfactionRecords > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction — children report that their clothing is clean, returned on time, handled with care, and that their preferences are listened to. This reflects a service that genuinely respects children's dignity.`,
    );
  } else if (childSatisfactionRate >= 70 && totalSatisfactionRecords > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction — the majority of children report positive experiences with laundry and linen services.`,
    );
  }

  // -- Child feels respected --
  if (feelsRespectedRate >= 90 && totalSatisfactionRecords > 0) {
    strengths.push(
      `${feelsRespectedRate}% of children feel respected in how their clothing and belongings are handled — this is a powerful indicator that the home values children as individuals and treats their possessions with dignity.`,
    );
  } else if (feelsRespectedRate >= 70 && totalSatisfactionRecords > 0 && childSatisfactionRate < 90) {
    strengths.push(
      `${feelsRespectedRate}% of children feel respected in how their clothing is handled — the majority of children feel their belongings are treated with care.`,
    );
  }

  // -- Child independence strengths --
  if (childIndependenceRate >= 80 && (totalSatisfactionRecords > 0 || totalClothingCareRecords > 0)) {
    strengths.push(
      `${childIndependenceRate}% child independence in laundry — children are actively supported to develop practical life skills by participating in their own laundry and clothing care, preparing them for independence.`,
    );
  } else if (childIndependenceRate >= 50 && (totalSatisfactionRecords > 0 || totalClothingCareRecords > 0)) {
    strengths.push(
      `${childIndependenceRate}% child independence in laundry — the home provides opportunities for children to participate in their own laundry care.`,
    );
  }

  // -- Linen issue resolution --
  if (linenIssueResolutionRate >= 90 && linenIssuesIdentified > 0) {
    strengths.push(
      `${linenIssueResolutionRate}% of linen issues resolved — identified problems with bedding, towels, or linen are addressed promptly, ensuring children's comfort is maintained.`,
    );
  } else if (linenIssueResolutionRate >= 70 && linenIssuesIdentified > 0) {
    strengths.push(
      `${linenIssueResolutionRate}% of linen issues resolved — the home generally addresses identified linen problems in a reasonable timeframe.`,
    );
  }

  // -- Hygiene issue resolution --
  if (hygieneIssueResolutionRate >= 90 && hygieneIssuesIdentified > 0) {
    strengths.push(
      `${hygieneIssueResolutionRate}% of hygiene issues resolved — identified hygiene concerns are remediated promptly, maintaining safe laundry practices.`,
    );
  }

  // -- Clothing separation --
  if (separationRate >= 90 && totalServiceRecords > 0) {
    strengths.push(
      `${separationRate}% of children's laundry kept separate — personal clothing is not mixed with other children's items, respecting individual ownership and preventing loss or damage of personal belongings.`,
    );
  }

  // -- Stain treatment --
  if (stainTreatmentRate >= 80 && totalClothingCareRecords > 0) {
    strengths.push(
      `${stainTreatmentRate}% stain treatment rate — staff make active efforts to pre-treat stains before washing, demonstrating care for the longevity and appearance of children's clothing.`,
    );
  }

  // -- Ironing --
  if (ironingRate >= 80 && totalClothingCareRecords > 0) {
    strengths.push(
      `${ironingRate}% ironing and pressing completed — children's clothing is presented to a good standard, supporting their self-esteem and sense of being valued.`,
    );
  }

  // -- Average satisfaction rating --
  if ((avgSatisfactionRating ?? 0) >= 4.0 && totalSatisfactionRecords > 0) {
    strengths.push(
      `Average child satisfaction rating of ${avgSatisfactionRating}/5 — children consistently rate the laundry and linen service positively, indicating the home meets their expectations for clothing care and comfort.`,
    );
  } else if ((avgSatisfactionRating ?? 0) >= 3.5 && totalSatisfactionRecords > 0) {
    strengths.push(
      `Average child satisfaction rating of ${avgSatisfactionRating}/5 — children generally rate the laundry and linen service favourably.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  // -- Laundry timeliness concerns --
  if (laundryTimelinessRate < 50 && totalServiceRecords > 0) {
    concerns.push(
      `Only ${laundryTimelinessRate}% laundry service quality — children's clothing and linen are not consistently collected, laundered, and returned in clean, undamaged condition within acceptable timescales. This undermines children's dignity and access to clean clothing.`,
    );
  } else if (laundryTimelinessRate < 70 && laundryTimelinessRate >= 50 && totalServiceRecords > 0) {
    concerns.push(
      `Laundry service quality at ${laundryTimelinessRate}% — some children's clothing is not being returned in a timely, clean, or undamaged state, requiring improvement to meet acceptable standards.`,
    );
  }

  // -- Timeliness sub-metric concern --
  if (timelinessRate < 50 && totalServiceRecords > 0) {
    concerns.push(
      `Only ${timelinessRate}% of laundry returned within 24 hours — children are waiting too long for clean clothing, which impacts their daily routines, self-esteem, and sense of being cared for.`,
    );
  } else if (timelinessRate < 70 && timelinessRate >= 50 && totalServiceRecords > 0) {
    concerns.push(
      `Laundry turnaround within 24 hours at ${timelinessRate}% — a notable proportion of children experience delays in having clean clothing returned.`,
    );
  }

  // -- Linen adequacy concerns --
  if (linenAdequacyRate < 50 && totalLinenAssessments > 0) {
    concerns.push(
      `Only ${linenAdequacyRate}% linen adequacy — a significant proportion of bedding, towels, and linen standards are not being met. Children may be sleeping with insufficient, unclean, or worn-out bedding, which directly affects their comfort, health, and sense of being valued.`,
    );
  } else if (linenAdequacyRate < 70 && linenAdequacyRate >= 50 && totalLinenAssessments > 0) {
    concerns.push(
      `Linen adequacy at ${linenAdequacyRate}% — some linen standards are not consistently met across children's bedrooms, requiring attention to ensure all children have adequate, clean, and comfortable bedding and towels.`,
    );
  }

  // -- Clothing care concerns --
  if (clothingCareRate < 50 && totalClothingCareRecords > 0) {
    concerns.push(
      `Only ${clothingCareRate}% clothing care quality — care instructions are not being followed, clothing is being returned to wrong children, condition is not maintained, and children's preferences and cultural needs are not respected. This represents a fundamental failure to treat children's personal belongings with dignity.`,
    );
  } else if (clothingCareRate < 70 && clothingCareRate >= 50 && totalClothingCareRecords > 0) {
    concerns.push(
      `Clothing care quality at ${clothingCareRate}% — some aspects of clothing care need improvement, including following care instructions, maintaining condition, and respecting children's preferences.`,
    );
  }

  // -- Cultural care concerns --
  if (culturalCareRate < 50 && totalClothingCareRecords > 0) {
    concerns.push(
      `Only ${culturalCareRate}% cultural needs met in clothing care — children's cultural and religious clothing requirements are not being respected, which fails to promote their identity and may cause distress.`,
    );
  } else if (culturalCareRate < 70 && culturalCareRate >= 50 && totalClothingCareRecords > 0) {
    concerns.push(
      `Cultural needs met at ${culturalCareRate}% in clothing care — the home is not consistently meeting all children's cultural and religious clothing requirements.`,
    );
  }

  // -- Hygiene compliance concerns --
  if (hygieneComplianceRate < 50 && totalHygieneAssessments > 0) {
    concerns.push(
      `Only ${hygieneComplianceRate}% hygiene compliance — laundry facilities, equipment, and infection control measures are falling significantly below acceptable standards, creating potential health risks for children.`,
    );
  } else if (hygieneComplianceRate < 70 && hygieneComplianceRate >= 50 && totalHygieneAssessments > 0) {
    concerns.push(
      `Hygiene compliance at ${hygieneComplianceRate}% — some laundry hygiene and infection control standards are not being met consistently, requiring attention.`,
    );
  }

  // -- Infection control concern --
  if (infectionControlRate < 50 && totalHygieneAssessments > 0) {
    concerns.push(
      `Only ${infectionControlRate}% infection control measures met — the home's laundry infection prevention protocols are inadequate, putting children at risk of cross-contamination and illness.`,
    );
  } else if (infectionControlRate < 70 && infectionControlRate >= 50 && totalHygieneAssessments > 0) {
    concerns.push(
      `Infection control at ${infectionControlRate}% — some laundry infection prevention measures are not consistently followed.`,
    );
  }

  // -- Child satisfaction concerns --
  if (childSatisfactionRate < 40 && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction — children report that clothing is not clean enough, not returned on time, not handled with care, bedding is uncomfortable, and their preferences are not listened to. This indicates a service that does not meet children's basic expectations or promote their dignity.`,
    );
  } else if (childSatisfactionRate < 70 && childSatisfactionRate >= 40 && totalSatisfactionRecords > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not satisfied with the laundry and linen service, indicating room for improvement in meeting children's needs.`,
    );
  }

  // -- Feels respected concern --
  if (feelsRespectedRate < 50 && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${feelsRespectedRate}% of children feel respected in how their clothing is handled — when children do not feel their belongings are treated with care, it undermines their sense of being valued and their trust in the home.`,
    );
  } else if (feelsRespectedRate < 70 && feelsRespectedRate >= 50 && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${feelsRespectedRate}% of children feel respected — some children do not feel their clothing and belongings are handled with sufficient care.`,
    );
  }

  // -- Child independence concerns --
  if (childIndependenceRate < 30 && (totalSatisfactionRecords > 0 || totalClothingCareRecords > 0)) {
    concerns.push(
      `Only ${childIndependenceRate}% child independence in laundry — children are not being given sufficient opportunities to learn practical laundry skills, which is essential for their preparation for independence and adult life.`,
    );
  } else if (childIndependenceRate < 50 && childIndependenceRate >= 30 && (totalSatisfactionRecords > 0 || totalClothingCareRecords > 0)) {
    concerns.push(
      `Child independence at ${childIndependenceRate}% — more children should be supported to participate in their own laundry care as part of independence skill development.`,
    );
  }

  // -- Wants more independence concern --
  if (wantsMoreIndependenceRate > 50 && totalSatisfactionRecords > 0) {
    concerns.push(
      `${wantsMoreIndependenceRate}% of children want more independence in laundry — children are expressing a desire for greater autonomy that the home is not currently meeting. Responding to this would both respect children's wishes and build life skills.`,
    );
  }

  // -- Linen issue resolution concern --
  if (linenIssueResolutionRate < 50 && linenIssuesIdentified > 0) {
    concerns.push(
      `Only ${linenIssueResolutionRate}% of identified linen issues resolved — problems with bedding, towels, or linen are persisting without remediation, leaving children with substandard conditions.`,
    );
  } else if (linenIssueResolutionRate < 70 && linenIssueResolutionRate >= 50 && linenIssuesIdentified > 0) {
    concerns.push(
      `Linen issue resolution at ${linenIssueResolutionRate}% — some identified linen problems are not being addressed in a timely manner.`,
    );
  }

  // -- Separation concern --
  if (separationRate < 70 && totalServiceRecords > 0) {
    concerns.push(
      `Only ${separationRate}% of children's laundry kept separate — mixing children's clothing with others' risks damage, loss, and undermines the sense that personal belongings are treated as individual property.`,
    );
  }

  // -- Average satisfaction rating concern --
  if ((avgSatisfactionRating ?? 0) < 2.5 && totalSatisfactionRecords > 0) {
    concerns.push(
      `Average child satisfaction rating at only ${avgSatisfactionRating}/5 — children consistently rate the laundry and linen service poorly, indicating systemic issues with how the home manages clothing and linen.`,
    );
  } else if ((avgSatisfactionRating ?? 0) < 3.0 && (avgSatisfactionRating ?? 0) >= 2.5 && totalSatisfactionRecords > 0) {
    concerns.push(
      `Average satisfaction rating at ${avgSatisfactionRating}/5 — children's ratings of the laundry and linen service are below acceptable standards.`,
    );
  }

  // -- Missing record type concerns --
  if (totalServiceRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No laundry service records exist despite children being on placement — the home cannot evidence that clothing is collected, laundered, and returned in a timely and appropriate manner.",
    );
  }

  if (totalLinenAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No linen adequacy assessments recorded — the home cannot evidence that children's bedding, towels, and linen meet appropriate standards of sufficiency, cleanliness, and condition.",
    );
  }

  if (totalClothingCareRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No clothing care records exist — the home cannot demonstrate that children's personal clothing is handled with appropriate care, that care instructions are followed, or that preferences and cultural needs are respected.",
    );
  }

  if (totalHygieneAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No hygiene compliance assessments recorded — the home cannot evidence that laundry facilities, equipment, and processes meet health and safety standards or that infection control measures are in place.",
    );
  }

  if (totalSatisfactionRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child satisfaction records for laundry and linen — the home has not sought children's views on how their clothing and bedding are managed, which is essential evidence for the voice of the child.",
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  const recommendations: LaundryLinenRecommendation[] = [];
  let rank = 0;

  if (laundryTimelinessRate < 50 && totalServiceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review the laundry service to ensure children's clothing and linen are collected, washed, and returned within 24 hours in a clean and undamaged state. Identify bottlenecks in the current process and establish clear accountability for turnaround times.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (hygieneComplianceRate < 50 && totalHygieneAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an immediate review of laundry hygiene practices including equipment maintenance, wash temperatures, infection control protocols, and soiled linen handling. Ensure staff receive training in hygiene standards and infection prevention in laundry operations.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (linenAdequacyRate < 50 && totalLinenAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately assess all children's bedding, towels, and linen — replace items that are insufficient, unclean, or in poor condition. Ensure every child has adequate, clean, comfortable, and age-appropriate linen that meets their individual needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (clothingCareRate < 50 && totalClothingCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul clothing care practices — train staff to follow care instructions, ensure clothing is returned to the correct child, maintain condition through proper washing and handling, and respect children's preferences and cultural needs in all clothing care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (childSatisfactionRate < 40 && totalSatisfactionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult children individually about their laundry and linen experiences — low satisfaction indicates the service does not meet their expectations. Redesign practices based on children's feedback to promote their dignity and sense of being valued.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (culturalCareRate < 50 && totalClothingCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide immediate training on culturally sensitive clothing care — ensure all staff understand and respect children's cultural and religious clothing requirements, including appropriate washing methods, handling, and storage of culturally significant garments.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (infectionControlRate < 50 && totalHygieneAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently strengthen infection control measures in laundry operations — ensure proper separation of soiled and clean items, correct wash temperatures, appropriate use of disinfectants, and staff adherence to hand hygiene protocols.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalServiceRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate recording of laundry services for every child — document collection, washing, return, and condition of clothing to evidence that the home manages laundry effectively and respectfully.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalLinenAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence regular linen adequacy assessments for all children — document the sufficiency, cleanliness, condition, and appropriateness of bedding, towels, and linen to evidence Reg 25 compliance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalHygieneAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish regular hygiene compliance audits of laundry facilities and processes — document equipment condition, wash protocols, infection control, and staff training to evidence safe practices.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalSatisfactionRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin collecting child satisfaction feedback on laundry and linen services — seek children's views on cleanliness, timeliness, care of belongings, and comfort to evidence the voice of the child.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (linenIssueResolutionRate < 50 && linenIssuesIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a linen issue tracker to ensure all identified problems are resolved promptly — children should not have to sleep with inadequate or damaged bedding while waiting for replacement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (childIndependenceRate < 30 && (totalSatisfactionRecords > 0 || totalClothingCareRecords > 0)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create structured opportunities for children to learn laundry skills — sorting, washing, drying, ironing, and folding are essential life skills that prepare children for independence and should be part of their development plans.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (wantsMoreIndependenceRate > 50 && totalSatisfactionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Respond to children's expressed desire for more laundry independence — develop age-appropriate opportunities for children to manage their own laundry, respecting their wishes while providing guidance and support.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (separationRate < 70 && totalServiceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's laundry is kept separate from other children's items — implement labelling systems and clear procedures so that personal clothing is treated as individual property and returned to the correct owner.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    laundryTimelinessRate >= 50 &&
    laundryTimelinessRate < 70 &&
    totalServiceRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve laundry service quality to at least 70% — review process bottlenecks, staffing allocation, and equipment capacity to ensure children receive a consistently timely and effective service.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    linenAdequacyRate >= 50 &&
    linenAdequacyRate < 70 &&
    totalLinenAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve linen adequacy standards — conduct a comprehensive audit of all bedding, towels, and linen, replacing items that are worn, insufficient, or not age-appropriate.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    clothingCareRate >= 50 &&
    clothingCareRate < 70 &&
    totalClothingCareRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance clothing care practices through staff training — focus on following care instructions, maintaining condition, and ensuring children's preferences and cultural needs are consistently respected.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (
    hygieneComplianceRate >= 50 &&
    hygieneComplianceRate < 70 &&
    totalHygieneAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve hygiene compliance by addressing specific areas of non-compliance — review equipment maintenance schedules, staff training on infection control, and environmental standards for laundry areas.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    childSatisfactionRate >= 40 &&
    childSatisfactionRate < 70 &&
    totalSatisfactionRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Seek regular child feedback on laundry and linen services and adapt practices accordingly — aim to increase satisfaction above 70% by responding to children's specific concerns and preferences.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (linenChildChoiceRate < 50 && totalLinenAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve more children in choosing their own linen and bedding — allowing children to personalise their sleeping environment supports their sense of belonging, identity, and ownership of their personal space.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children's experiences and progress",
    });
  }

  if (stainTreatmentRate < 50 && totalClothingCareRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve stain treatment practices before washing — pre-treating stains protects children's clothing from permanent damage and demonstrates that the home values children's belongings.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  const insights: LaundryLinenInsight[] = [];

  // ── Critical insights ─────────────────────────────────────────────────

  if (laundryTimelinessRate < 50 && totalServiceRecords > 0) {
    insights.push({
      text: `Only ${laundryTimelinessRate}% laundry service quality. Ofsted expects children in residential care to have access to clean, well-maintained clothing at all times. When the laundry service fails to collect, wash, and return items promptly and in good condition, children may be left without clean clothing, which directly impacts their dignity, self-esteem, and daily routines.`,
      severity: "critical",
    });
  }

  if (linenAdequacyRate < 50 && totalLinenAssessments > 0) {
    insights.push({
      text: `Only ${linenAdequacyRate}% linen adequacy. Children's bedding, towels, and linen do not consistently meet acceptable standards. Sleeping in insufficient, unclean, or worn-out bedding affects children's comfort, health, and their sense of being valued. Under Reg 25, the home must ensure premises and facilities are fit for purpose.`,
      severity: "critical",
    });
  }

  if (hygieneComplianceRate < 50 && totalHygieneAssessments > 0) {
    insights.push({
      text: `Only ${hygieneComplianceRate}% hygiene compliance. Laundry facilities and processes are falling below acceptable hygiene and infection control standards. This creates tangible health risks for children, particularly around cross-contamination of soiled items. Immediate remediation is required to meet Reg 25 premises standards.`,
      severity: "critical",
    });
  }

  if (childSatisfactionRate < 40 && totalSatisfactionRecords > 0) {
    insights.push({
      text: `Only ${childSatisfactionRate}% child satisfaction. Children are reporting that their clothing is not clean enough, not returned on time, not handled with care, and that their preferences are not listened to. When children feel their belongings are disrespected, it damages their trust in the home and undermines the therapeutic relationship.`,
      severity: "critical",
    });
  }

  if (clothingCareRate < 50 && totalClothingCareRecords > 0) {
    insights.push({
      text: `Only ${clothingCareRate}% clothing care quality. Personal clothing is not being handled with appropriate care — care instructions are not followed, clothing is returned to wrong children, and children's preferences and cultural needs are not respected. For looked-after children, personal clothing often carries deep emotional significance, and its mishandling can be experienced as a profound disrespect.`,
      severity: "critical",
    });
  }

  if (culturalCareRate < 50 && totalClothingCareRecords > 0) {
    insights.push({
      text: `Only ${culturalCareRate}% cultural needs met in clothing care. Failing to respect children's cultural and religious clothing requirements is a significant concern under Reg 5 and SCCIF expectations. Cultural garments often require specific care methods, and their mishandling can cause distress and undermine children's cultural identity.`,
      severity: "critical",
    });
  }

  if (infectionControlRate < 50 && totalHygieneAssessments > 0) {
    insights.push({
      text: `Only ${infectionControlRate}% infection control measures met. Inadequate infection prevention in laundry operations creates direct health risks for children. Proper separation of soiled items, correct wash temperatures, and staff adherence to hand hygiene are essential safeguards that are not currently in place.`,
      severity: "critical",
    });
  }

  if (totalServiceRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No laundry service records exist despite children being on placement. Without laundry tracking, the home cannot evidence that children have access to clean clothing, that turnaround times are acceptable, or that personal items are handled with care. This is a fundamental gap in Reg 25 evidence.",
      severity: "critical",
    });
  }

  if (totalLinenAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No linen adequacy assessments recorded. Ofsted expects children's living conditions — including bedding and linen — to be assessed for appropriateness. The absence of assessment records means the home cannot demonstrate that children's linen is fit for purpose.",
      severity: "critical",
    });
  }

  if (totalHygieneAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No hygiene compliance assessments recorded. The home cannot evidence that laundry facilities meet health and safety standards, that equipment is maintained, or that infection control protocols are followed. This is a significant gap in premises compliance.",
      severity: "critical",
    });
  }

  // ── Warning insights ──────────────────────────────────────────────────

  if (
    laundryTimelinessRate >= 50 &&
    laundryTimelinessRate < 70 &&
    totalServiceRecords > 0
  ) {
    insights.push({
      text: `Laundry service quality at ${laundryTimelinessRate}% — improving but inconsistent. Some children are not receiving a reliably timely laundry service. Review whether capacity, staffing, or equipment issues are creating bottlenecks.`,
      severity: "warning",
    });
  }

  if (
    linenAdequacyRate >= 50 &&
    linenAdequacyRate < 70 &&
    totalLinenAssessments > 0
  ) {
    insights.push({
      text: `Linen adequacy at ${linenAdequacyRate}% — some children's bedding and towels are not consistently meeting all standards. Linen quality has a direct impact on sleep quality, comfort, and children's perception of how much the home values their wellbeing.`,
      severity: "warning",
    });
  }

  if (
    clothingCareRate >= 50 &&
    clothingCareRate < 70 &&
    totalClothingCareRecords > 0
  ) {
    insights.push({
      text: `Clothing care quality at ${clothingCareRate}% — some aspects of how children's clothing is handled need improvement. Inconsistent care can lead to clothing damage, loss of favourite items, and children feeling their belongings are not valued.`,
      severity: "warning",
    });
  }

  if (
    hygieneComplianceRate >= 50 &&
    hygieneComplianceRate < 70 &&
    totalHygieneAssessments > 0
  ) {
    insights.push({
      text: `Hygiene compliance at ${hygieneComplianceRate}% — some standards are not consistently met. Even moderate non-compliance with hygiene protocols can create risk, particularly around infection control and soiled linen handling.`,
      severity: "warning",
    });
  }

  if (
    childSatisfactionRate >= 40 &&
    childSatisfactionRate < 70 &&
    totalSatisfactionRecords > 0
  ) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children are not fully satisfied with laundry and linen services. Children's views on seemingly mundane services like laundry are important indicators of how cared for and respected they feel in the home.`,
      severity: "warning",
    });
  }

  if (
    childIndependenceRate < 50 &&
    childIndependenceRate >= 30 &&
    (totalSatisfactionRecords > 0 || totalClothingCareRecords > 0)
  ) {
    insights.push({
      text: `Child independence at ${childIndependenceRate}% — more children should be supported to develop laundry skills. Learning to care for one's own clothing is a fundamental life skill that supports transition to independence and builds self-efficacy.`,
      severity: "warning",
    });
  }

  if (
    feelsRespectedRate >= 50 &&
    feelsRespectedRate < 70 &&
    totalSatisfactionRecords > 0
  ) {
    insights.push({
      text: `Only ${feelsRespectedRate}% of children feel respected in how their clothing is handled. How a home treats children's personal belongings is a meaningful indicator of its culture. Children who do not feel their possessions are respected may struggle to feel truly at home.`,
      severity: "warning",
    });
  }

  if (
    (avgSatisfactionRating ?? 0) >= 2.5 &&
    (avgSatisfactionRating ?? 0) < 3.5 &&
    totalSatisfactionRecords > 0
  ) {
    insights.push({
      text: `Average satisfaction rating at ${avgSatisfactionRating}/5 — children's overall experience of laundry and linen services is mediocre. This suggests systemic factors are affecting service quality rather than isolated issues.`,
      severity: "warning",
    });
  }

  if (separationRate < 70 && totalServiceRecords > 0) {
    insights.push({
      text: `Only ${separationRate}% of laundry kept separate — children's clothing is frequently mixed with others'. For looked-after children, having their personal items treated as distinct property is important for their sense of ownership and identity.`,
      severity: "warning",
    });
  }

  if (wantsMoreIndependenceRate > 50 && totalSatisfactionRecords > 0) {
    insights.push({
      text: `${wantsMoreIndependenceRate}% of children want more independence in laundry — this is a clear signal from children that they are ready for greater autonomy. The home should respond by creating structured, age-appropriate opportunities for self-sufficiency.`,
      severity: "warning",
    });
  }

  // Laundry type analysis
  const laundryTypes: Record<string, number> = {};
  for (const r of laundry_service_records) {
    laundryTypes[r.laundry_type] = (laundryTypes[r.laundry_type] ?? 0) + 1;
  }
  const topLaundryTypes = Object.entries(laundryTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topLaundryTypes.length > 0) {
    const formatted = topLaundryTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common laundry types processed: ${formatted}. Understanding the volume and type distribution helps the home plan capacity, allocate resources, and ensure all categories of clothing and linen receive appropriate attention.`,
      severity: "warning",
    });
  }

  // Clothing type analysis
  const clothingTypes: Record<string, number> = {};
  for (const r of clothing_care_records) {
    clothingTypes[r.clothing_type] = (clothingTypes[r.clothing_type] ?? 0) + 1;
  }
  const topClothingTypes = Object.entries(clothingTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topClothingTypes.length > 0) {
    const formatted = topClothingTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common clothing types cared for: ${formatted}. Different garment types require different care approaches — ensuring staff understand care instructions for each category protects children's clothing and demonstrates competent practice.`,
      severity: "warning",
    });
  }

  // ── Positive insights ─────────────────────────────────────────────────

  if (laundry_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding laundry and linen management — children's clothing is collected, laundered, and returned promptly in excellent condition, linen meets high standards, hygiene compliance is robust, and children report high satisfaction. This is strong evidence for Reg 25 compliance and children's experiences and progress under SCCIF.",
      severity: "positive",
    });
  }

  if (
    laundryTimelinessRate >= 90 &&
    childSatisfactionRate >= 90 &&
    totalServiceRecords > 0 &&
    totalSatisfactionRecords > 0
  ) {
    insights.push({
      text: `${laundryTimelinessRate}% laundry service quality with ${childSatisfactionRate}% child satisfaction — the combination of excellent service delivery and high child approval demonstrates a laundry service that genuinely meets children's needs and expectations, promoting their dignity and sense of being cared for.`,
      severity: "positive",
    });
  }

  if (
    linenAdequacyRate >= 90 &&
    totalLinenAssessments > 0
  ) {
    insights.push({
      text: `${linenAdequacyRate}% linen adequacy — children's bedding, towels, and linen consistently meet high standards across all assessed domains. Well-maintained linen contributes to children's comfort, health, and their sense that the home is a place where they are valued and cared for.`,
      severity: "positive",
    });
  }

  if (
    clothingCareRate >= 90 &&
    culturalCareRate >= 90 &&
    totalClothingCareRecords > 0
  ) {
    insights.push({
      text: `${clothingCareRate}% clothing care quality with ${culturalCareRate}% cultural needs met — the home handles children's personal clothing with exceptional care, following instructions, maintaining condition, and respecting both individual preferences and cultural requirements. This reflects a service that treats children's belongings as important and meaningful.`,
      severity: "positive",
    });
  }

  if (
    hygieneComplianceRate >= 90 &&
    infectionControlRate >= 90 &&
    totalHygieneAssessments > 0
  ) {
    insights.push({
      text: `${hygieneComplianceRate}% hygiene compliance with ${infectionControlRate}% infection control — the home maintains exemplary standards of hygiene and infection prevention in laundry operations. This protects children's health and demonstrates rigorous compliance with premises standards.`,
      severity: "positive",
    });
  }

  if (
    childSatisfactionRate >= 90 &&
    feelsRespectedRate >= 90 &&
    totalSatisfactionRecords > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction with ${feelsRespectedRate}% feeling respected — children overwhelmingly feel that their clothing and belongings are handled with care and that their preferences are listened to. This is a powerful indicator of a home culture that values children as individuals.`,
      severity: "positive",
    });
  }

  if (
    childIndependenceRate >= 80 &&
    (totalSatisfactionRecords > 0 || totalClothingCareRecords > 0)
  ) {
    insights.push({
      text: `${childIndependenceRate}% child independence in laundry — children are actively supported to develop practical laundry skills, building competence and confidence in self-care. This contributes directly to their preparation for independence and reflects genuinely child-centred practice.`,
      severity: "positive",
    });
  }

  if (
    linenIssueResolutionRate >= 90 &&
    linenIssuesIdentified > 0
  ) {
    insights.push({
      text: `${linenIssueResolutionRate}% of linen issues resolved — the home responds promptly when problems with bedding or linen are identified, ensuring children's comfort is quickly restored. This proactive approach demonstrates effective premises management.`,
      severity: "positive",
    });
  }

  if (
    separationRate >= 90 &&
    totalServiceRecords > 0
  ) {
    insights.push({
      text: `${separationRate}% of laundry kept separate — the home consistently treats children's clothing as individual property, preventing mixing and loss. This respect for personal ownership is an important aspect of promoting children's identity and dignity.`,
      severity: "positive",
    });
  }

  if (
    (avgSatisfactionRating ?? 0) >= 4.0 &&
    totalSatisfactionRecords > 0
  ) {
    insights.push({
      text: `Average satisfaction rating of ${avgSatisfactionRating}/5 — children consistently rate the laundry and linen service highly. Sustained positive ratings across multiple children indicate a systemically well-managed service that meets children's expectations.`,
      severity: "positive",
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════════════════════════

  let headline: string;

  if (laundry_rating === "outstanding") {
    headline =
      "Outstanding laundry and linen management — children's clothing and linen are handled with care, returned promptly, and children report high satisfaction with the service.";
  } else if (laundry_rating === "good") {
    headline = `Good laundry and linen management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (laundry_rating === "adequate") {
    headline = `Adequate laundry and linen management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's clothing and linen needs are fully met.`;
  } else {
    headline = `Laundry and linen management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's clothing and linen are managed to an acceptable standard.`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════════

  return {
    laundry_rating,
    laundry_score: score,
    headline,
    total_service_records: totalServiceRecords,
    total_linen_assessments: totalLinenAssessments,
    total_clothing_care_records: totalClothingCareRecords,
    total_hygiene_assessments: totalHygieneAssessments,
    total_satisfaction_records: totalSatisfactionRecords,
    laundry_timeliness_rate: laundryTimelinessRate,
    linen_adequacy_rate: linenAdequacyRate,
    clothing_care_rate: clothingCareRate,
    hygiene_compliance_rate: hygieneComplianceRate,
    child_satisfaction_rate: childSatisfactionRate,
    child_independence_rate: childIndependenceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
