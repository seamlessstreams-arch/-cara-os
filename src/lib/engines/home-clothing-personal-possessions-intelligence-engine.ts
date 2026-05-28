// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CLOTHING & PERSONAL POSSESSIONS INTELLIGENCE ENGINE
// Tracks whether children have adequate, appropriate clothing and personal
// possessions — clothing allowance usage, seasonal wardrobe reviews, personal
// item inventories, dignity and choice in clothing, and replacement timeliness.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 7 (Children's views, wishes & feelings).
// SCCIF: "Experiences and progress of children".
// Store keys: clothingAllowanceRecords, wardrobeReviewRecords,
//             personalInventoryRecords, clothingRequestRecords,
//             possessionSafeguardingRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ClothingAllowanceRecordInput {
  id: string;
  child_id: string;
  period_start: string;
  period_end: string;
  allowance_amount_gbp: number;
  amount_spent_gbp: number;
  child_involved_in_shopping: boolean;
  child_chose_own_items: boolean;
  age_appropriate: boolean;
  seasonal_needs_met: boolean;
  receipts_retained: boolean;
  budget_category: "clothing" | "footwear" | "accessories" | "school_uniform" | "sports_kit" | "other";
  quality_rating: number; // 1-5
  notes: string;
  created_at: string;
}

export interface WardrobeReviewRecordInput {
  id: string;
  child_id: string;
  review_date: string;
  reviewer: string;
  season: "spring" | "summer" | "autumn" | "winter";
  adequate_clothing: boolean;
  adequate_footwear: boolean;
  adequate_outerwear: boolean;
  adequate_school_uniform: boolean;
  adequate_nightwear: boolean;
  adequate_underwear: boolean;
  items_needing_replacement: number;
  items_replaced: number;
  child_consulted: boolean;
  child_satisfied: boolean;
  cultural_religious_needs_met: boolean;
  dignity_maintained: boolean;
  overall_adequate: boolean;
  action_plan_created: boolean;
  action_plan_completed: boolean;
  notes: string;
  created_at: string;
}

export interface PersonalInventoryRecordInput {
  id: string;
  child_id: string;
  inventory_date: string;
  total_items_recorded: number;
  items_accounted_for: number;
  items_missing: number;
  items_damaged: number;
  items_replaced: number;
  sentimental_items_safeguarded: boolean;
  electronics_recorded: boolean;
  child_involved_in_inventory: boolean;
  storage_adequate: boolean;
  privacy_respected: boolean;
  photographic_record: boolean;
  inventory_complete: boolean;
  notes: string;
  created_at: string;
}

export interface ClothingRequestRecordInput {
  id: string;
  child_id: string;
  request_date: string;
  item_requested: string;
  request_type: "replacement" | "new_need" | "growth" | "seasonal" | "preference" | "school" | "activity" | "other";
  urgency: "urgent" | "standard" | "low";
  fulfilled: boolean;
  fulfilment_date: string | null;
  days_to_fulfil: number;
  child_satisfied_with_outcome: boolean;
  child_choice_respected: boolean;
  reason_if_unfulfilled: string;
  cost_gbp: number;
  notes: string;
  created_at: string;
}

export interface PossessionSafeguardingRecordInput {
  id: string;
  child_id: string;
  date: string;
  event_type: "loss" | "damage" | "theft" | "confiscation" | "return" | "safekeeping" | "audit";
  item_description: string;
  item_value_gbp: number;
  sentimental_value: boolean;
  resolved: boolean;
  resolution_date: string | null;
  days_to_resolve: number;
  child_informed: boolean;
  child_satisfied: boolean;
  replacement_provided: boolean;
  compensation_offered: boolean;
  incident_documented: boolean;
  staff_involved: string;
  notes: string;
  created_at: string;
}

export interface ClothingPossessionsInput {
  today: string;
  total_children: number;
  clothing_allowance_records: ClothingAllowanceRecordInput[];
  wardrobe_review_records: WardrobeReviewRecordInput[];
  personal_inventory_records: PersonalInventoryRecordInput[];
  clothing_request_records: ClothingRequestRecordInput[];
  possession_safeguarding_records: PossessionSafeguardingRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ClothingPossessionsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ClothingPossessionsInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ClothingPossessionsRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ClothingPossessionsResult {
  clothing_rating: ClothingPossessionsRating;
  clothing_score: number;
  headline: string;
  total_allowance_records: number;
  total_wardrobe_reviews: number;
  total_inventory_records: number;
  total_request_records: number;
  total_safeguarding_records: number;
  allowance_utilisation_rate: number;
  wardrobe_adequacy_rate: number;
  inventory_completeness_rate: number;
  request_fulfilment_rate: number;
  possession_safeguarding_rate: number;
  child_choice_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: ClothingPossessionsRecommendation[];
  insights: ClothingPossessionsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ClothingPossessionsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: ClothingPossessionsRating,
  score: number,
  headline: string,
): ClothingPossessionsResult {
  return {
    clothing_rating: rating,
    clothing_score: score,
    headline,
    total_allowance_records: 0,
    total_wardrobe_reviews: 0,
    total_inventory_records: 0,
    total_request_records: 0,
    total_safeguarding_records: 0,
    allowance_utilisation_rate: 0,
    wardrobe_adequacy_rate: 0,
    inventory_completeness_rate: 0,
    request_fulfilment_rate: 0,
    possession_safeguarding_rate: 0,
    child_choice_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeClothingPersonalPossessions(
  input: ClothingPossessionsInput,
): ClothingPossessionsResult {
  const {
    total_children,
    clothing_allowance_records,
    wardrobe_review_records,
    personal_inventory_records,
    clothing_request_records,
    possession_safeguarding_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    clothing_allowance_records.length === 0 &&
    wardrobe_review_records.length === 0 &&
    personal_inventory_records.length === 0 &&
    clothing_request_records.length === 0 &&
    possession_safeguarding_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess clothing and personal possessions.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No clothing or personal possessions data recorded despite children on placement — clothing provision, wardrobe reviews, and possession safeguarding require urgent attention.",
      ),
      concerns: [
        "No clothing allowance records, wardrobe reviews, personal inventories, clothing requests, or possession safeguarding records exist despite children being on placement — the home cannot evidence that children's clothing and personal possession needs are being met.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of clothing allowances, wardrobe reviews, personal inventories, and clothing requests to evidence that every child has adequate, appropriate clothing and that their preferences and dignity are respected.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Establish a personal possessions safeguarding system including inventories, secure storage, and incident recording to protect children's belongings and demonstrate respect for their property.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes & feelings",
        },
      ],
      insights: [
        {
          text: "The complete absence of clothing and personal possessions records means the home cannot demonstrate that children have adequate wardrobes, that their preferences are respected, or that their belongings are safeguarded. This is a significant gap in quality of care under Regulation 5 and represents a failure to evidence respect for children's dignity and individuality.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Clothing allowance metrics ---
  const totalAllowanceRecords = clothing_allowance_records.length;

  const totalAllowance = clothing_allowance_records.reduce(
    (sum, r) => sum + r.allowance_amount_gbp,
    0,
  );
  const totalSpent = clothing_allowance_records.reduce(
    (sum, r) => sum + r.amount_spent_gbp,
    0,
  );
  // Utilisation = how much of the allowance is actually being used for the child
  // 100% is ideal; under-spend may mean children aren't getting what they need
  const allowanceUtilisationRate = pct(totalSpent, totalAllowance);

  const childInvolvedShopping = clothing_allowance_records.filter(
    (r) => r.child_involved_in_shopping,
  ).length;
  const childInvolvedShoppingRate = pct(childInvolvedShopping, totalAllowanceRecords);

  const childChoseItems = clothing_allowance_records.filter(
    (r) => r.child_chose_own_items,
  ).length;
  const childChoseItemsRate = pct(childChoseItems, totalAllowanceRecords);

  const ageAppropriateCount = clothing_allowance_records.filter(
    (r) => r.age_appropriate,
  ).length;
  const ageAppropriateRate = pct(ageAppropriateCount, totalAllowanceRecords);

  const seasonalNeedsMet = clothing_allowance_records.filter(
    (r) => r.seasonal_needs_met,
  ).length;
  const seasonalNeedsMetRate = pct(seasonalNeedsMet, totalAllowanceRecords);

  const receiptsRetained = clothing_allowance_records.filter(
    (r) => r.receipts_retained,
  ).length;
  const receiptsRetainedRate = pct(receiptsRetained, totalAllowanceRecords);

  const qualitySum = clothing_allowance_records.reduce(
    (sum, r) => sum + r.quality_rating,
    0,
  );
  const avgQualityRating =
    totalAllowanceRecords > 0
      ? Math.round((qualitySum / totalAllowanceRecords) * 100) / 100
      : 0;

  const uniqueChildrenWithAllowance = new Set(
    clothing_allowance_records.map((r) => r.child_id),
  ).size;
  const allowanceChildCoverage =
    total_children > 0 ? pct(uniqueChildrenWithAllowance, total_children) : 0;

  // --- Wardrobe review metrics ---
  const totalWardrobeReviews = wardrobe_review_records.length;

  const adequateWardrobes = wardrobe_review_records.filter(
    (r) => r.overall_adequate,
  ).length;
  const wardrobeAdequacyRate = pct(adequateWardrobes, totalWardrobeReviews);

  const adequateClothing = wardrobe_review_records.filter(
    (r) => r.adequate_clothing,
  ).length;
  const adequateClothingRate = pct(adequateClothing, totalWardrobeReviews);

  const adequateFootwear = wardrobe_review_records.filter(
    (r) => r.adequate_footwear,
  ).length;
  const adequateFootwearRate = pct(adequateFootwear, totalWardrobeReviews);

  const adequateOuterwear = wardrobe_review_records.filter(
    (r) => r.adequate_outerwear,
  ).length;
  const adequateOuterwearRate = pct(adequateOuterwear, totalWardrobeReviews);

  const adequateSchoolUniform = wardrobe_review_records.filter(
    (r) => r.adequate_school_uniform,
  ).length;
  const adequateSchoolUniformRate = pct(adequateSchoolUniform, totalWardrobeReviews);

  const adequateNightwear = wardrobe_review_records.filter(
    (r) => r.adequate_nightwear,
  ).length;
  const adequateNightwearRate = pct(adequateNightwear, totalWardrobeReviews);

  const adequateUnderwear = wardrobe_review_records.filter(
    (r) => r.adequate_underwear,
  ).length;
  const adequateUnderwearRate = pct(adequateUnderwear, totalWardrobeReviews);

  const childConsulted = wardrobe_review_records.filter(
    (r) => r.child_consulted,
  ).length;
  const childConsultedRate = pct(childConsulted, totalWardrobeReviews);

  const childSatisfied = wardrobe_review_records.filter(
    (r) => r.child_satisfied,
  ).length;
  const childSatisfiedRate = pct(childSatisfied, totalWardrobeReviews);

  const culturalReligiousMet = wardrobe_review_records.filter(
    (r) => r.cultural_religious_needs_met,
  ).length;
  const culturalReligiousRate = pct(culturalReligiousMet, totalWardrobeReviews);

  const dignityMaintained = wardrobe_review_records.filter(
    (r) => r.dignity_maintained,
  ).length;
  const dignityMaintainedRate = pct(dignityMaintained, totalWardrobeReviews);

  const totalItemsNeedingReplacement = wardrobe_review_records.reduce(
    (sum, r) => sum + r.items_needing_replacement,
    0,
  );
  const totalItemsReplaced = wardrobe_review_records.reduce(
    (sum, r) => sum + r.items_replaced,
    0,
  );
  const replacementRate = pct(totalItemsReplaced, totalItemsNeedingReplacement);

  const actionPlanCreated = wardrobe_review_records.filter(
    (r) => r.action_plan_created,
  ).length;
  const actionPlanCompleted = wardrobe_review_records.filter(
    (r) => r.action_plan_created && r.action_plan_completed,
  ).length;
  const actionPlanCompletionRate = pct(actionPlanCompleted, actionPlanCreated);

  const uniqueChildrenReviewed = new Set(
    wardrobe_review_records.map((r) => r.child_id),
  ).size;
  const reviewChildCoverage =
    total_children > 0 ? pct(uniqueChildrenReviewed, total_children) : 0;

  // Check seasonal coverage
  const seasonsReviewed = new Set(
    wardrobe_review_records.map((r) => r.season),
  );
  const seasonsCoveredCount = seasonsReviewed.size; // max 4

  // --- Personal inventory metrics ---
  const totalInventoryRecords = personal_inventory_records.length;

  const totalItemsRecorded = personal_inventory_records.reduce(
    (sum, r) => sum + r.total_items_recorded,
    0,
  );
  const totalItemsAccountedFor = personal_inventory_records.reduce(
    (sum, r) => sum + r.items_accounted_for,
    0,
  );
  const inventoryCompletenessRate = pct(totalItemsAccountedFor, totalItemsRecorded);

  const completeInventories = personal_inventory_records.filter(
    (r) => r.inventory_complete,
  ).length;
  const inventoryCompleteRate = pct(completeInventories, totalInventoryRecords);

  const totalMissing = personal_inventory_records.reduce(
    (sum, r) => sum + r.items_missing,
    0,
  );
  const totalDamaged = personal_inventory_records.reduce(
    (sum, r) => sum + r.items_damaged,
    0,
  );
  const missingRate = pct(totalMissing, totalItemsRecorded);
  const damagedRate = pct(totalDamaged, totalItemsRecorded);

  const sentimentalSafeguarded = personal_inventory_records.filter(
    (r) => r.sentimental_items_safeguarded,
  ).length;
  const sentimentalSafeguardedRate = pct(sentimentalSafeguarded, totalInventoryRecords);

  const electronicsRecorded = personal_inventory_records.filter(
    (r) => r.electronics_recorded,
  ).length;
  const electronicsRecordedRate = pct(electronicsRecorded, totalInventoryRecords);

  const childInvolvedInventory = personal_inventory_records.filter(
    (r) => r.child_involved_in_inventory,
  ).length;
  const childInvolvedInventoryRate = pct(childInvolvedInventory, totalInventoryRecords);

  const storageAdequate = personal_inventory_records.filter(
    (r) => r.storage_adequate,
  ).length;
  const storageAdequateRate = pct(storageAdequate, totalInventoryRecords);

  const privacyRespected = personal_inventory_records.filter(
    (r) => r.privacy_respected,
  ).length;
  const privacyRespectedRate = pct(privacyRespected, totalInventoryRecords);

  const photographicRecord = personal_inventory_records.filter(
    (r) => r.photographic_record,
  ).length;
  const photographicRecordRate = pct(photographicRecord, totalInventoryRecords);

  const uniqueChildrenInventoried = new Set(
    personal_inventory_records.map((r) => r.child_id),
  ).size;
  const inventoryChildCoverage =
    total_children > 0 ? pct(uniqueChildrenInventoried, total_children) : 0;

  // --- Clothing request metrics ---
  const totalRequestRecords = clothing_request_records.length;

  const fulfilledRequests = clothing_request_records.filter(
    (r) => r.fulfilled,
  ).length;
  const requestFulfilmentRate = pct(fulfilledRequests, totalRequestRecords);

  const urgentRequests = clothing_request_records.filter(
    (r) => r.urgency === "urgent",
  ).length;
  const urgentFulfilled = clothing_request_records.filter(
    (r) => r.urgency === "urgent" && r.fulfilled,
  ).length;
  const urgentFulfilmentRate = pct(urgentFulfilled, urgentRequests);

  const fulfilledRecords = clothing_request_records.filter((r) => r.fulfilled);
  const totalDaysToFulfil = fulfilledRecords.reduce(
    (sum, r) => sum + r.days_to_fulfil,
    0,
  );
  const avgDaysToFulfil =
    fulfilledRecords.length > 0
      ? Math.round((totalDaysToFulfil / fulfilledRecords.length) * 100) / 100
      : 0;

  const urgentFulfilledRecords = clothing_request_records.filter(
    (r) => r.urgency === "urgent" && r.fulfilled,
  );
  const urgentDaysTotal = urgentFulfilledRecords.reduce(
    (sum, r) => sum + r.days_to_fulfil,
    0,
  );
  const avgUrgentDays =
    urgentFulfilledRecords.length > 0
      ? Math.round((urgentDaysTotal / urgentFulfilledRecords.length) * 100) / 100
      : 0;

  const childSatisfiedRequest = clothing_request_records.filter(
    (r) => r.fulfilled && r.child_satisfied_with_outcome,
  ).length;
  const childSatisfiedRequestRate = pct(childSatisfiedRequest, fulfilledRequests);

  const choiceRespectedRequest = clothing_request_records.filter(
    (r) => r.child_choice_respected,
  ).length;
  const choiceRespectedRequestRate = pct(choiceRespectedRequest, totalRequestRecords);

  // --- Possession safeguarding metrics ---
  const totalSafeguardingRecords = possession_safeguarding_records.length;

  const resolvedIncidents = possession_safeguarding_records.filter(
    (r) => r.resolved,
  ).length;
  const possessionSafeguardingRate = pct(resolvedIncidents, totalSafeguardingRecords);

  const documentedIncidents = possession_safeguarding_records.filter(
    (r) => r.incident_documented,
  ).length;
  const documentedRate = pct(documentedIncidents, totalSafeguardingRecords);

  const childInformedIncidents = possession_safeguarding_records.filter(
    (r) => r.child_informed,
  ).length;
  const childInformedRate = pct(childInformedIncidents, totalSafeguardingRecords);

  const childSatisfiedIncidents = possession_safeguarding_records.filter(
    (r) => r.resolved && r.child_satisfied,
  ).length;
  const childSatisfiedIncidentRate = pct(childSatisfiedIncidents, resolvedIncidents);

  const replacementsProvided = possession_safeguarding_records.filter(
    (r) => r.replacement_provided,
  ).length;
  const replacementProvidedRate = pct(replacementsProvided, totalSafeguardingRecords);

  const compensationOffered = possession_safeguarding_records.filter(
    (r) => r.compensation_offered,
  ).length;

  const lossTheftDamage = possession_safeguarding_records.filter(
    (r) => r.event_type === "loss" || r.event_type === "theft" || r.event_type === "damage",
  );
  const lossTheftDamageCount = lossTheftDamage.length;
  const lossTheftDamageResolved = lossTheftDamage.filter((r) => r.resolved).length;
  const lossTheftDamageResolvedRate = pct(lossTheftDamageResolved, lossTheftDamageCount);

  const sentimentalIncidents = possession_safeguarding_records.filter(
    (r) => r.sentimental_value,
  );
  const sentimentalResolved = sentimentalIncidents.filter((r) => r.resolved).length;
  const sentimentalResolvedRate = pct(sentimentalResolved, sentimentalIncidents.length);

  const resolvedSafeguardingRecords = possession_safeguarding_records.filter(
    (r) => r.resolved,
  );
  const totalDaysToResolve = resolvedSafeguardingRecords.reduce(
    (sum, r) => sum + r.days_to_resolve,
    0,
  );
  const avgDaysToResolve =
    resolvedSafeguardingRecords.length > 0
      ? Math.round((totalDaysToResolve / resolvedSafeguardingRecords.length) * 100) / 100
      : 0;

  const confiscations = possession_safeguarding_records.filter(
    (r) => r.event_type === "confiscation",
  );
  const confiscationCount = confiscations.length;

  // --- Child choice composite ---
  // Composite across allowance child choice, wardrobe consultation, inventory involvement, request choice
  const childChoiceNumerators: number[] = [];
  const childChoiceDenominators: number[] = [];

  if (totalAllowanceRecords > 0) {
    childChoiceNumerators.push(childChoseItems);
    childChoiceDenominators.push(totalAllowanceRecords);
  }
  if (totalWardrobeReviews > 0) {
    childChoiceNumerators.push(childConsulted);
    childChoiceDenominators.push(totalWardrobeReviews);
  }
  if (totalInventoryRecords > 0) {
    childChoiceNumerators.push(childInvolvedInventory);
    childChoiceDenominators.push(totalInventoryRecords);
  }
  if (totalRequestRecords > 0) {
    childChoiceNumerators.push(choiceRespectedRequest);
    childChoiceDenominators.push(totalRequestRecords);
  }

  const totalChildChoiceNum = childChoiceNumerators.reduce((a, b) => a + b, 0);
  const totalChildChoiceDenom = childChoiceDenominators.reduce((a, b) => a + b, 0);
  const childChoiceRate = pct(totalChildChoiceNum, totalChildChoiceDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: allowanceUtilisationRate (>=80: +4, >=60: +2) ---
  // High utilisation means the allowance is being properly used for children
  if (allowanceUtilisationRate >= 80) score += 4;
  else if (allowanceUtilisationRate >= 60) score += 2;

  // --- Bonus 2: wardrobeAdequacyRate (>=90: +4, >=70: +2) ---
  if (wardrobeAdequacyRate >= 90) score += 4;
  else if (wardrobeAdequacyRate >= 70) score += 2;

  // --- Bonus 3: inventoryCompletenessRate (>=95: +3, >=80: +1) ---
  if (inventoryCompletenessRate >= 95) score += 3;
  else if (inventoryCompletenessRate >= 80) score += 1;

  // --- Bonus 4: requestFulfilmentRate (>=90: +3, >=70: +1) ---
  if (requestFulfilmentRate >= 90) score += 3;
  else if (requestFulfilmentRate >= 70) score += 1;

  // --- Bonus 5: possessionSafeguardingRate (>=90: +3, >=70: +1) ---
  if (possessionSafeguardingRate >= 90) score += 3;
  else if (possessionSafeguardingRate >= 70) score += 1;

  // --- Bonus 6: childChoiceRate (>=90: +3, >=70: +1) ---
  if (childChoiceRate >= 90) score += 3;
  else if (childChoiceRate >= 70) score += 1;

  // --- Bonus 7: dignityMaintainedRate (>=95: +3, >=80: +1) ---
  if (dignityMaintainedRate >= 95) score += 3;
  else if (dignityMaintainedRate >= 80) score += 1;

  // --- Bonus 8: replacementRate (>=90: +3, >=70: +1) ---
  if (replacementRate >= 90) score += 3;
  else if (replacementRate >= 70) score += 1;

  // --- Bonus 9: avgQualityRating (>=4.0: +2, >=3.0: +1) ---
  if (avgQualityRating >= 4.0) score += 2;
  else if (avgQualityRating >= 3.0) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // wardrobeAdequacyRate < 50 → -6 (guarded by array length)
  if (wardrobeAdequacyRate < 50 && totalWardrobeReviews > 0) score -= 6;

  // requestFulfilmentRate < 50 → -5 (guarded)
  if (requestFulfilmentRate < 50 && totalRequestRecords > 0) score -= 5;

  // childChoiceRate < 30 → -3 (guarded)
  if (childChoiceRate < 30 && totalChildChoiceDenom > 0) score -= 3;

  // possessionSafeguardingRate < 50 → -4 (guarded)
  if (possessionSafeguardingRate < 50 && totalSafeguardingRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const clothing_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (allowanceUtilisationRate >= 80 && totalAllowanceRecords > 0) {
    strengths.push(
      `${allowanceUtilisationRate}% clothing allowance utilisation — children's clothing budgets are being well-used to ensure they have appropriate, quality clothing.`,
    );
  } else if (allowanceUtilisationRate >= 60 && totalAllowanceRecords > 0) {
    strengths.push(
      `${allowanceUtilisationRate}% clothing allowance utilisation — reasonable use of clothing budgets to support children's clothing needs.`,
    );
  }

  if (wardrobeAdequacyRate >= 90 && totalWardrobeReviews > 0) {
    strengths.push(
      `${wardrobeAdequacyRate}% wardrobe adequacy across reviews — children consistently have adequate, appropriate clothing meeting their needs.`,
    );
  } else if (wardrobeAdequacyRate >= 70 && totalWardrobeReviews > 0) {
    strengths.push(
      `${wardrobeAdequacyRate}% wardrobe adequacy rate — the majority of wardrobe reviews confirm children have appropriate clothing.`,
    );
  }

  if (inventoryCompletenessRate >= 95 && totalInventoryRecords > 0) {
    strengths.push(
      `${inventoryCompletenessRate}% inventory completeness — personal possessions are thoroughly tracked and accounted for, demonstrating respect for children's property.`,
    );
  } else if (inventoryCompletenessRate >= 80 && totalInventoryRecords > 0) {
    strengths.push(
      `${inventoryCompletenessRate}% inventory completeness rate — good tracking of children's personal possessions.`,
    );
  }

  if (requestFulfilmentRate >= 90 && totalRequestRecords > 0) {
    strengths.push(
      `${requestFulfilmentRate}% of clothing requests fulfilled — the home responds promptly and effectively to children's clothing needs and preferences.`,
    );
  } else if (requestFulfilmentRate >= 70 && totalRequestRecords > 0) {
    strengths.push(
      `${requestFulfilmentRate}% clothing request fulfilment rate — the home generally meets children's clothing requests.`,
    );
  }

  if (possessionSafeguardingRate >= 90 && totalSafeguardingRecords > 0) {
    strengths.push(
      `${possessionSafeguardingRate}% of possession safeguarding incidents resolved — the home demonstrates strong commitment to protecting and resolving issues with children's belongings.`,
    );
  } else if (possessionSafeguardingRate >= 70 && totalSafeguardingRecords > 0) {
    strengths.push(
      `${possessionSafeguardingRate}% possession safeguarding resolution rate — the home generally resolves issues with children's personal property.`,
    );
  }

  if (childChoiceRate >= 90 && totalChildChoiceDenom > 0) {
    strengths.push(
      `${childChoiceRate}% child choice rate across clothing and possessions decisions — children's preferences, dignity, and individuality are consistently respected.`,
    );
  } else if (childChoiceRate >= 70 && totalChildChoiceDenom > 0) {
    strengths.push(
      `${childChoiceRate}% child choice in clothing and possessions matters — good levels of respect for children's preferences and autonomy.`,
    );
  }

  if (dignityMaintainedRate >= 95 && totalWardrobeReviews > 0) {
    strengths.push(
      `${dignityMaintainedRate}% of wardrobe reviews confirm dignity maintained — the home consistently ensures children's dignity through appropriate, well-maintained clothing.`,
    );
  } else if (dignityMaintainedRate >= 80 && totalWardrobeReviews > 0) {
    strengths.push(
      `Dignity maintained in ${dignityMaintainedRate}% of wardrobe reviews — children are generally dressed appropriately and with dignity.`,
    );
  }

  if (replacementRate >= 90 && totalItemsNeedingReplacement > 0) {
    strengths.push(
      `${replacementRate}% of items identified for replacement have been replaced — the home acts promptly on wardrobe review findings.`,
    );
  } else if (replacementRate >= 70 && totalItemsNeedingReplacement > 0) {
    strengths.push(
      `${replacementRate}% replacement rate for items identified in wardrobe reviews — the home generally follows through on replacing worn or outgrown clothing.`,
    );
  }

  if (avgQualityRating >= 4.0 && totalAllowanceRecords > 0) {
    strengths.push(
      `Average clothing quality rating ${avgQualityRating}/5 — children are receiving good quality clothing that is durable and appropriate.`,
    );
  } else if (avgQualityRating >= 3.0 && totalAllowanceRecords > 0) {
    strengths.push(
      `Average clothing quality rating ${avgQualityRating}/5 — clothing quality is satisfactory overall.`,
    );
  }

  if (childInvolvedShoppingRate >= 90 && totalAllowanceRecords > 0) {
    strengths.push(
      `Children involved in ${childInvolvedShoppingRate}% of clothing shopping trips — excellent practice in respecting children's views and building independence.`,
    );
  }

  if (culturalReligiousRate >= 95 && totalWardrobeReviews > 0) {
    strengths.push(
      `Cultural and religious clothing needs met in ${culturalReligiousRate}% of reviews — the home demonstrates strong respect for children's cultural identity and heritage.`,
    );
  }

  if (sentimentalSafeguardedRate >= 90 && totalInventoryRecords > 0) {
    strengths.push(
      `Sentimental items safeguarded in ${sentimentalSafeguardedRate}% of inventories — the home recognises and protects items of emotional significance to children.`,
    );
  }

  if (urgentFulfilmentRate >= 95 && urgentRequests > 0) {
    strengths.push(
      `${urgentFulfilmentRate}% of urgent clothing requests fulfilled — the home responds effectively to children's immediate clothing needs.`,
    );
  }

  if (childSatisfiedRate >= 90 && totalWardrobeReviews > 0) {
    strengths.push(
      `${childSatisfiedRate}% child satisfaction in wardrobe reviews — children are happy with their clothing provision and feel their preferences are heard.`,
    );
  }

  if (seasonsCoveredCount >= 4 && totalWardrobeReviews > 0) {
    strengths.push(
      "Wardrobe reviews cover all four seasons — the home proactively ensures children's clothing is appropriate throughout the year.",
    );
  }

  if (privacyRespectedRate >= 95 && totalInventoryRecords > 0) {
    strengths.push(
      `Privacy respected in ${privacyRespectedRate}% of inventory processes — children's right to privacy is upheld during personal possession checks.`,
    );
  }

  if (storageAdequateRate >= 90 && totalInventoryRecords > 0) {
    strengths.push(
      `Adequate storage confirmed in ${storageAdequateRate}% of inventories — children have appropriate space to keep and organise their belongings.`,
    );
  }

  if (receiptsRetainedRate >= 90 && totalAllowanceRecords > 0) {
    strengths.push(
      `Receipts retained for ${receiptsRetainedRate}% of clothing purchases — excellent financial governance and accountability.`,
    );
  }

  if (allowanceChildCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has clothing allowance records — all children are receiving their clothing entitlement.",
    );
  } else if (allowanceChildCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${allowanceChildCoverage}% of children have clothing allowance records — good coverage of clothing provision.`,
    );
  }

  if (documentedRate >= 90 && totalSafeguardingRecords > 0) {
    strengths.push(
      `${documentedRate}% of possession incidents documented — strong record-keeping supports accountability and demonstrates respect for children's property.`,
    );
  }

  if (avgDaysToFulfil <= 3 && fulfilledRecords.length > 0) {
    strengths.push(
      `Average clothing request fulfilment in ${avgDaysToFulfil} days — the home responds rapidly to children's clothing needs.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (wardrobeAdequacyRate < 50 && totalWardrobeReviews > 0) {
    concerns.push(
      `Only ${wardrobeAdequacyRate}% of wardrobe reviews show adequate clothing — the majority of children do not have adequate wardrobes, representing a serious failure in quality of care and children's dignity.`,
    );
  } else if (wardrobeAdequacyRate < 70 && wardrobeAdequacyRate >= 50 && totalWardrobeReviews > 0) {
    concerns.push(
      `Wardrobe adequacy at ${wardrobeAdequacyRate}% — a significant proportion of children's wardrobes are not meeting minimum standards.`,
    );
  }

  if (requestFulfilmentRate < 50 && totalRequestRecords > 0) {
    concerns.push(
      `Only ${requestFulfilmentRate}% of clothing requests fulfilled — the majority of children's clothing needs and preferences are going unmet, indicating a serious gap in care provision.`,
    );
  } else if (requestFulfilmentRate < 70 && requestFulfilmentRate >= 50 && totalRequestRecords > 0) {
    concerns.push(
      `Clothing request fulfilment at ${requestFulfilmentRate}% — a significant proportion of children's clothing requests are not being met.`,
    );
  }

  if (childChoiceRate < 30 && totalChildChoiceDenom > 0) {
    concerns.push(
      `Only ${childChoiceRate}% child choice rate — children are rarely involved in decisions about their clothing and possessions, undermining their dignity, individuality, and sense of agency.`,
    );
  } else if (childChoiceRate < 70 && childChoiceRate >= 30 && totalChildChoiceDenom > 0) {
    concerns.push(
      `Child choice rate at ${childChoiceRate}% — not all children are consistently involved in clothing and possession decisions affecting them.`,
    );
  }

  if (possessionSafeguardingRate < 50 && totalSafeguardingRecords > 0) {
    concerns.push(
      `Only ${possessionSafeguardingRate}% of possession safeguarding incidents resolved — children's belongings are not being adequately protected or issues resolved, failing to demonstrate respect for their property.`,
    );
  } else if (possessionSafeguardingRate < 70 && possessionSafeguardingRate >= 50 && totalSafeguardingRecords > 0) {
    concerns.push(
      `Possession safeguarding resolution at ${possessionSafeguardingRate}% — not all issues with children's belongings are being resolved satisfactorily.`,
    );
  }

  if (allowanceUtilisationRate < 40 && totalAllowanceRecords > 0) {
    concerns.push(
      `Only ${allowanceUtilisationRate}% clothing allowance utilisation — children's clothing budgets are significantly under-spent, which may indicate that children are not receiving adequate clothing or are not being supported to use their allowance.`,
    );
  } else if (allowanceUtilisationRate < 60 && allowanceUtilisationRate >= 40 && totalAllowanceRecords > 0) {
    concerns.push(
      `Clothing allowance utilisation at ${allowanceUtilisationRate}% — under-utilisation may suggest children's clothing needs are not being fully met.`,
    );
  }

  if (inventoryCompletenessRate < 70 && totalInventoryRecords > 0) {
    concerns.push(
      `Inventory completeness at ${inventoryCompletenessRate}% — a significant proportion of children's possessions are unaccounted for, indicating inadequate safeguarding of personal property.`,
    );
  } else if (inventoryCompletenessRate < 80 && inventoryCompletenessRate >= 70 && totalInventoryRecords > 0) {
    concerns.push(
      `Inventory completeness at ${inventoryCompletenessRate}% — some children's possessions are not being fully tracked and accounted for.`,
    );
  }

  if (dignityMaintainedRate < 80 && totalWardrobeReviews > 0) {
    concerns.push(
      `Dignity maintained in only ${dignityMaintainedRate}% of wardrobe reviews — some children may be wearing clothing that is worn, ill-fitting, or otherwise fails to maintain their dignity. This is a fundamental requirement of quality care.`,
    );
  }

  if (culturalReligiousRate < 80 && totalWardrobeReviews > 0) {
    concerns.push(
      `Cultural and religious clothing needs met in only ${culturalReligiousRate}% of reviews — failing to meet children's cultural and religious needs undermines their identity, dignity, and sense of belonging.`,
    );
  }

  if (missingRate >= 15 && totalInventoryRecords > 0) {
    concerns.push(
      `${missingRate}% of inventoried items missing — a high rate of missing items suggests inadequate safeguarding of children's personal possessions.`,
    );
  } else if (missingRate >= 8 && missingRate < 15 && totalInventoryRecords > 0) {
    concerns.push(
      `${missingRate}% of inventoried items missing — some children's possessions are going missing, requiring improved safeguarding measures.`,
    );
  }

  if (urgentFulfilmentRate < 80 && urgentRequests > 0) {
    concerns.push(
      `Only ${urgentFulfilmentRate}% of urgent clothing requests fulfilled — children's immediate clothing needs are not being prioritised effectively.`,
    );
  }

  if (confiscationCount > 0) {
    const returnedConfiscations = confiscations.filter((r) => r.resolved).length;
    if (returnedConfiscations < confiscationCount) {
      concerns.push(
        `${confiscationCount} confiscation${confiscationCount > 1 ? "s" : ""} recorded with ${confiscationCount - returnedConfiscations} item${confiscationCount - returnedConfiscations !== 1 ? "s" : ""} not yet returned — confiscation of personal possessions must be carefully managed, time-limited, and documented to protect children's rights.`,
      );
    }
  }

  if (avgDaysToFulfil > 14 && fulfilledRecords.length > 0) {
    concerns.push(
      `Average clothing request fulfilment takes ${avgDaysToFulfil} days — children are waiting too long for clothing needs to be met, which can impact their dignity and wellbeing.`,
    );
  } else if (avgDaysToFulfil > 7 && avgDaysToFulfil <= 14 && fulfilledRecords.length > 0) {
    concerns.push(
      `Average clothing request fulfilment takes ${avgDaysToFulfil} days — response times could be improved to better meet children's needs promptly.`,
    );
  }

  if (reviewChildCoverage < 80 && total_children > 0 && totalWardrobeReviews > 0) {
    concerns.push(
      `Only ${reviewChildCoverage}% of children have had wardrobe reviews — not all children's clothing needs are being assessed through formal reviews.`,
    );
  }

  if (storageAdequateRate < 70 && totalInventoryRecords > 0) {
    concerns.push(
      `Only ${storageAdequateRate}% of inventories confirm adequate storage — children may not have appropriate space to keep and organise their personal belongings.`,
    );
  }

  if (childSatisfiedRequestRate < 60 && fulfilledRequests > 0) {
    concerns.push(
      `Only ${childSatisfiedRequestRate}% child satisfaction with fulfilled clothing requests — even when requests are fulfilled, children are not happy with the outcomes, suggesting their preferences are not being adequately considered.`,
    );
  }

  if (replacementRate < 50 && totalItemsNeedingReplacement > 0) {
    concerns.push(
      `Only ${replacementRate}% of items identified for replacement have been replaced — wardrobe review findings are not being acted upon.`,
    );
  } else if (replacementRate < 70 && replacementRate >= 50 && totalItemsNeedingReplacement > 0) {
    concerns.push(
      `Replacement rate at ${replacementRate}% — some items identified in wardrobe reviews for replacement have not yet been actioned.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: ClothingPossessionsRecommendation[] = [];
  let rank = 0;

  if (wardrobeAdequacyRate < 50 && totalWardrobeReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and address wardrobe adequacy for every child — conduct immediate assessments and procure essential clothing items to ensure all children have adequate, appropriate wardrobes that maintain their dignity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (requestFulfilmentRate < 50 && totalRequestRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the backlog of unfulfilled clothing requests immediately — review all outstanding requests, prioritise by urgency, and establish a system to ensure timely fulfilment of children's clothing needs and preferences.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (childChoiceRate < 30 && totalChildChoiceDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed children's voice and choice in all clothing and possessions decisions — ensure children are consulted on wardrobe reviews, involved in shopping, and their preferences respected in clothing requests. This is fundamental to respecting their dignity and individuality.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes & feelings",
    });
  }

  if (possessionSafeguardingRate < 50 && totalSafeguardingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a robust possession safeguarding system — review all unresolved incidents, establish clear protocols for reporting and resolving loss, damage, or theft of children's belongings, and ensure children are kept informed throughout.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (dignityMaintainedRate < 80 && totalWardrobeReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently ensure that all children's clothing maintains their dignity — identify children whose clothing is worn, ill-fitting, or inappropriate, and take immediate steps to provide suitable replacement items.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (culturalReligiousRate < 80 && totalWardrobeReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assess and meet every child's cultural and religious clothing needs — engage with children and their families to understand specific requirements, and ensure these are recorded, budgeted for, and provided without delay.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes & feelings",
    });
  }

  if (urgentFulfilmentRate < 80 && urgentRequests > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a fast-track process for urgent clothing requests — children's immediate clothing needs must be met within 24-48 hours. Review barriers to urgent fulfilment and ensure emergency clothing budgets are accessible.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (inventoryCompletenessRate < 70 && totalInventoryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a comprehensive audit of all children's personal possessions — reconcile inventories, investigate missing items, and implement improved tracking systems to safeguard children's belongings.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    allowanceUtilisationRate >= 40 &&
    allowanceUtilisationRate < 60 &&
    totalAllowanceRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review clothing allowance utilisation to ensure children are receiving their full entitlement — explore whether under-spend reflects unmet needs or barriers to spending such as limited shopping opportunities.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    requestFulfilmentRate >= 50 &&
    requestFulfilmentRate < 70 &&
    totalRequestRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve clothing request fulfilment processes — review reasons for unfulfilled requests, ensure adequate budgets are available, and establish clear timescales for responding to children's clothing needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    childChoiceRate >= 30 &&
    childChoiceRate < 70 &&
    totalChildChoiceDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's involvement in clothing and possessions decisions — create regular opportunities for children to express preferences, participate in shopping, and contribute to wardrobe reviews and inventory processes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes & feelings",
    });
  }

  if (
    possessionSafeguardingRate >= 50 &&
    possessionSafeguardingRate < 70 &&
    totalSafeguardingRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen possession safeguarding processes — improve incident documentation, ensure timely resolution, and communicate outcomes to children to build trust that their belongings are respected and protected.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (replacementRate < 70 && totalItemsNeedingReplacement > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a system to track and action wardrobe review replacement recommendations — items identified as needing replacement should be procured within agreed timescales to ensure children always have adequate clothing.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (avgDaysToFulfil > 14 && fulfilledRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reduce average clothing request fulfilment time — review procurement processes and consider maintaining a small stock of essential items to reduce wait times for children.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (storageAdequateRate < 70 && totalInventoryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve storage provision for children's personal possessions — ensure every child has adequate, secure, and accessible storage space for their clothing and belongings.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (
    wardrobeAdequacyRate >= 50 &&
    wardrobeAdequacyRate < 70 &&
    totalWardrobeReviews > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop targeted wardrobe improvement plans for children whose wardrobes are not meeting adequacy standards — identify specific gaps and create individual shopping plans with children to address them.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    inventoryCompletenessRate >= 70 &&
    inventoryCompletenessRate < 80 &&
    totalInventoryRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve personal inventory tracking to at least 80% completeness — consider using photographic records and involving children in the inventory process to improve accuracy and ownership.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (reviewChildCoverage < 80 && total_children > 0 && totalWardrobeReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children have at least one formal wardrobe review — extend review coverage to every child and establish a regular seasonal review cycle to proactively identify and address clothing needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (seasonsCoveredCount < 4 && totalWardrobeReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement wardrobe reviews across all four seasons — seasonal reviews ensure children always have weather-appropriate clothing and that seasonal needs such as winter coats and summer clothing are addressed proactively.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    childSatisfiedRequestRate >= 40 &&
    childSatisfiedRequestRate < 60 &&
    fulfilledRequests > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve child satisfaction with clothing request outcomes — explore why children are dissatisfied even when requests are fulfilled, and ensure their preferences and style choices are genuinely considered.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes & feelings",
    });
  }

  if (photographicRecordRate < 50 && totalInventoryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce photographic records of children's personal possessions — this creates an evidence-based inventory that protects against loss and supports insurance or replacement claims.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: ClothingPossessionsInsight[] = [];

  // -- Critical insights --

  if (wardrobeAdequacyRate < 50 && totalWardrobeReviews > 0) {
    insights.push({
      text: `Only ${wardrobeAdequacyRate}% of wardrobe reviews show adequate clothing. Children not having adequate wardrobes is a fundamental failure in quality of care (Reg 5). Inspectors will immediately identify if children are wearing worn, ill-fitting, or inappropriate clothing — this directly impacts dignity and wellbeing.`,
      severity: "critical",
    });
  }

  if (requestFulfilmentRate < 50 && totalRequestRecords > 0) {
    insights.push({
      text: `Only ${requestFulfilmentRate}% of clothing requests fulfilled. When children ask for clothing and their requests go unmet, it communicates that their needs and preferences do not matter. This undermines trust and directly contradicts the requirement to listen to and act on children's views (Reg 7).`,
      severity: "critical",
    });
  }

  if (childChoiceRate < 30 && totalChildChoiceDenom > 0) {
    insights.push({
      text: `Child choice rate at only ${childChoiceRate}%. Children are not being involved in decisions about their own clothing and possessions. Having choice over what they wear is fundamental to dignity, identity, and normalising their experience in care. Ofsted expects children to have the same opportunities as their peers.`,
      severity: "critical",
    });
  }

  if (possessionSafeguardingRate < 50 && totalSafeguardingRecords > 0) {
    insights.push({
      text: `Only ${possessionSafeguardingRate}% of possession incidents resolved. Failing to protect and resolve issues with children's personal belongings signals to them that their property is not valued or respected. For children in care, personal possessions often carry heightened emotional significance.`,
      severity: "critical",
    });
  }

  if (dignityMaintainedRate < 70 && totalWardrobeReviews > 0) {
    insights.push({
      text: `Dignity maintained in only ${dignityMaintainedRate}% of wardrobe reviews. Every child has a right to be dressed in clothing that maintains their dignity. Inspectors meeting children will form an immediate impression of whether clothing is adequate, clean, well-fitting, and age-appropriate.`,
      severity: "critical",
    });
  }

  if (totalWardrobeReviews === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No wardrobe reviews recorded despite children being on placement. Without formal wardrobe reviews the home cannot demonstrate that it proactively assesses and meets children's clothing needs. Seasonal reviews should be standard practice to ensure children always have appropriate clothing.",
      severity: "critical",
    });
  }

  if (totalInventoryRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No personal inventory records despite children being on placement. Without inventories the home cannot evidence that children's personal possessions are tracked and safeguarded. This is particularly important for children arriving in care who may have limited possessions of high sentimental value.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    wardrobeAdequacyRate >= 50 &&
    wardrobeAdequacyRate < 70 &&
    totalWardrobeReviews > 0
  ) {
    insights.push({
      text: `Wardrobe adequacy at ${wardrobeAdequacyRate}% — improving but a significant minority of children's wardrobes are not meeting standards. Individual clothing plans targeting specific gaps would help ensure every child has an adequate wardrobe.`,
      severity: "warning",
    });
  }

  if (
    requestFulfilmentRate >= 50 &&
    requestFulfilmentRate < 70 &&
    totalRequestRecords > 0
  ) {
    insights.push({
      text: `Clothing request fulfilment at ${requestFulfilmentRate}% — while some requests are met, the fulfilment rate is below where it should be. Reviewing procurement processes and ensuring adequate budgets would improve responsiveness.`,
      severity: "warning",
    });
  }

  if (
    childChoiceRate >= 30 &&
    childChoiceRate < 70 &&
    totalChildChoiceDenom > 0
  ) {
    insights.push({
      text: `Child choice rate at ${childChoiceRate}% — some children are involved in clothing and possession decisions but this is not consistent. Embedding children's voice as standard practice across all clothing-related activities would strengthen this area.`,
      severity: "warning",
    });
  }

  if (
    possessionSafeguardingRate >= 50 &&
    possessionSafeguardingRate < 70 &&
    totalSafeguardingRecords > 0
  ) {
    insights.push({
      text: `Possession safeguarding resolution at ${possessionSafeguardingRate}% — while some incidents are resolved, the rate needs improvement. Clearer protocols and timescales for resolving possession issues would build children's trust.`,
      severity: "warning",
    });
  }

  if (
    allowanceUtilisationRate >= 40 &&
    allowanceUtilisationRate < 60 &&
    totalAllowanceRecords > 0
  ) {
    insights.push({
      text: `Clothing allowance utilisation at ${allowanceUtilisationRate}% — under-utilisation may indicate that children are not being supported to shop for clothing or that their needs are not being proactively identified. Consider whether shopping opportunities are frequent enough and accessible.`,
      severity: "warning",
    });
  }

  if (
    inventoryCompletenessRate >= 70 &&
    inventoryCompletenessRate < 80 &&
    totalInventoryRecords > 0
  ) {
    insights.push({
      text: `Inventory completeness at ${inventoryCompletenessRate}% — while reasonable, unaccounted items represent a gap in possession safeguarding. Involving children in the inventory process can improve accuracy and give them ownership.`,
      severity: "warning",
    });
  }

  if (
    replacementRate >= 50 &&
    replacementRate < 70 &&
    totalItemsNeedingReplacement > 0
  ) {
    insights.push({
      text: `Replacement rate for wardrobe review items at ${replacementRate}% — items identified as needing replacement are not all being actioned. Without follow-through, wardrobe reviews become a tick-box exercise rather than a genuine quality improvement tool.`,
      severity: "warning",
    });
  }

  if (
    avgDaysToFulfil > 7 &&
    avgDaysToFulfil <= 14 &&
    fulfilledRecords.length > 0
  ) {
    insights.push({
      text: `Average clothing request fulfilment takes ${avgDaysToFulfil} days — while not excessive, children should not routinely wait more than a week for clothing needs. Consider maintaining a small stock of essentials or establishing relationships with local suppliers for faster procurement.`,
      severity: "warning",
    });
  }

  if (
    seasonsCoveredCount >= 2 &&
    seasonsCoveredCount < 4 &&
    totalWardrobeReviews > 0
  ) {
    insights.push({
      text: `Wardrobe reviews cover ${seasonsCoveredCount} of 4 seasons — gaps in seasonal review coverage mean some children's weather-appropriate clothing needs may not be proactively assessed. Year-round review cycles prevent clothing gaps.`,
      severity: "warning",
    });
  }

  if (
    childSatisfiedRequestRate >= 40 &&
    childSatisfiedRequestRate < 60 &&
    fulfilledRequests > 0
  ) {
    insights.push({
      text: `Only ${childSatisfiedRequestRate}% child satisfaction with fulfilled requests — even when clothing is provided, children are not happy with outcomes. This may indicate that preferences, style, brands, or age-appropriateness are not being adequately considered.`,
      severity: "warning",
    });
  }

  if (confiscationCount >= 3) {
    insights.push({
      text: `${confiscationCount} confiscation events recorded. While occasional confiscation may be justified for safety reasons, a pattern of confiscations may indicate a punitive approach to behaviour management that conflicts with children's rights. Review whether confiscation is proportionate, time-limited, and properly documented.`,
      severity: "warning",
    });
  }

  // Analyse budget categories
  const categoryCounts: Record<string, number> = {};
  for (const r of clothing_allowance_records) {
    categoryCounts[r.budget_category] = (categoryCounts[r.budget_category] ?? 0) + 1;
  }
  const allCategories = ["clothing", "footwear", "accessories", "school_uniform", "sports_kit"];
  const missingCategories = allCategories.filter(
    (c) => !categoryCounts[c] || categoryCounts[c] === 0,
  );
  if (missingCategories.length >= 3 && totalAllowanceRecords > 3) {
    insights.push({
      text: `Clothing allowance spending concentrated in limited categories — no spending recorded in ${missingCategories.join(", ")}. A broader range of clothing purchases ensures children's full wardrobe needs are met including school uniform, sports kit, and accessories.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (clothing_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding practice in clothing and personal possessions — children have adequate, quality clothing, their preferences are respected, possessions are safeguarded, and their dignity is consistently maintained. This evidences genuine respect for children as individuals under Regulation 5 and Regulation 7.",
      severity: "positive",
    });
  }

  if (
    wardrobeAdequacyRate >= 90 &&
    dignityMaintainedRate >= 95 &&
    totalWardrobeReviews > 0
  ) {
    insights.push({
      text: `${wardrobeAdequacyRate}% wardrobe adequacy with ${dignityMaintainedRate}% dignity maintained — children consistently have adequate wardrobes and their dignity is upheld through appropriate, well-maintained clothing. This is exactly what inspectors want to see.`,
      severity: "positive",
    });
  }

  if (
    requestFulfilmentRate >= 90 &&
    childSatisfiedRequestRate >= 85 &&
    totalRequestRecords > 0 &&
    fulfilledRequests > 0
  ) {
    insights.push({
      text: `${requestFulfilmentRate}% request fulfilment with ${childSatisfiedRequestRate}% child satisfaction — the home is both responsive to children's clothing needs and ensures outcomes match their preferences. This demonstrates genuine person-centred practice.`,
      severity: "positive",
    });
  }

  if (
    childChoiceRate >= 90 &&
    totalChildChoiceDenom > 0
  ) {
    insights.push({
      text: `${childChoiceRate}% child choice across clothing and possessions decisions — children are genuinely involved in choices about what they wear and how their belongings are managed. This supports identity development, dignity, and independence.`,
      severity: "positive",
    });
  }

  if (
    inventoryCompletenessRate >= 95 &&
    sentimentalSafeguardedRate >= 90 &&
    totalInventoryRecords > 0
  ) {
    insights.push({
      text: `${inventoryCompletenessRate}% inventory completeness with ${sentimentalSafeguardedRate}% sentimental items safeguarded — the home demonstrates exceptional care in tracking and protecting children's personal possessions, including items of emotional significance.`,
      severity: "positive",
    });
  }

  if (
    possessionSafeguardingRate >= 90 &&
    documentedRate >= 90 &&
    totalSafeguardingRecords > 0
  ) {
    insights.push({
      text: `${possessionSafeguardingRate}% possession incidents resolved with ${documentedRate}% documented — the home handles possession issues professionally, resolves them effectively, and maintains clear records. This builds children's trust that their belongings are valued and protected.`,
      severity: "positive",
    });
  }

  if (
    allowanceChildCoverage >= 100 &&
    childInvolvedShoppingRate >= 90 &&
    total_children > 0 &&
    totalAllowanceRecords > 0
  ) {
    insights.push({
      text: "Every child has clothing allowance records and children are involved in the vast majority of shopping trips — this demonstrates that clothing provision is individualised, inclusive, and respects children's autonomy and developing independence.",
      severity: "positive",
    });
  }

  if (
    replacementRate >= 90 &&
    avgDaysToFulfil <= 3 &&
    totalItemsNeedingReplacement > 0 &&
    fulfilledRecords.length > 0
  ) {
    insights.push({
      text: `${replacementRate}% replacement follow-through with average ${avgDaysToFulfil}-day fulfilment — the home acts quickly on identified needs and responds rapidly to clothing requests. Children are not left waiting for essential items.`,
      severity: "positive",
    });
  }

  if (
    culturalReligiousRate >= 95 &&
    totalWardrobeReviews > 0
  ) {
    insights.push({
      text: `Cultural and religious clothing needs met in ${culturalReligiousRate}% of reviews — the home demonstrates genuine respect for children's cultural identity and heritage through appropriate clothing provision. This supports children's sense of belonging and self-worth.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (clothing_rating === "outstanding") {
    headline =
      "Outstanding clothing and personal possessions practice — children have adequate, quality clothing, their choices are respected, possessions are safeguarded, and dignity is consistently maintained.";
  } else if (clothing_rating === "good") {
    headline = `Good clothing and personal possessions practice — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (clothing_rating === "adequate") {
    headline = `Adequate clothing and personal possessions practice — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children have appropriate clothing and their possessions are safeguarded.`;
  } else {
    headline = `Clothing and personal possessions practice is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children have adequate clothing, their preferences are respected, and their belongings are protected.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    clothing_rating,
    clothing_score: score,
    headline,
    total_allowance_records: totalAllowanceRecords,
    total_wardrobe_reviews: totalWardrobeReviews,
    total_inventory_records: totalInventoryRecords,
    total_request_records: totalRequestRecords,
    total_safeguarding_records: totalSafeguardingRecords,
    allowance_utilisation_rate: allowanceUtilisationRate,
    wardrobe_adequacy_rate: wardrobeAdequacyRate,
    inventory_completeness_rate: inventoryCompletenessRate,
    request_fulfilment_rate: requestFulfilmentRate,
    possession_safeguarding_rate: possessionSafeguardingRate,
    child_choice_rate: childChoiceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
