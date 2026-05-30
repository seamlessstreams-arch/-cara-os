// ==============================================================================
// CORNERSTONE -- HOME CLOTHING LABELLING & STORAGE INTELLIGENCE ENGINE
// Measures clothing labelling compliance, wardrobe storage adequacy, seasonal
// rotation, child ownership respect, and condition monitoring across the home.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Living accommodation -- adequate wardrobe storage, clothing
// provision), Reg 25 (Children's guide -- personal possessions), SCCIF
// "Experiences and progress of children" (dignity, identity, personalisation).
// Store keys: clothingLabellingRecords, clothingStorageRecords,
//             clothingRotationRecords, clothingOwnershipRecords,
//             clothingConditionRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface ClothingLabellingRecordInput {
  id: string;
  child_id: string;
  date: string;
  total_items_audited: number;
  items_labelled: number;
  labelling_method: "sewn_in" | "iron_on" | "written" | "laundry_marker" | "tag" | "other";
  child_consulted_on_method: boolean;
  labels_discreet: boolean;
  labels_durable: boolean;
  labels_checked_after_wash: boolean;
  items_lost_since_last_audit: number;
  items_returned_via_label: number;
  staff_id: string;
  notes: string;
  created_at: string;
}

export interface ClothingStorageRecordInput {
  id: string;
  child_id: string;
  date: string;
  wardrobe_available: boolean;
  wardrobe_adequate_size: boolean;
  drawers_available: boolean;
  drawers_adequate_size: boolean;
  shoe_storage_available: boolean;
  storage_lockable: boolean;
  child_has_key: boolean;
  storage_clean: boolean;
  storage_personalised: boolean;
  child_satisfied_with_storage: boolean;
  overflow_items_count: number;
  notes: string;
  created_at: string;
}

export interface ClothingRotationRecordInput {
  id: string;
  child_id: string;
  date: string;
  season: "spring" | "summer" | "autumn" | "winter";
  rotation_completed: boolean;
  outgrown_items_identified: number;
  outgrown_items_replaced: number;
  seasonal_items_available: boolean;
  weather_appropriate_clothing: boolean;
  child_involved_in_choices: boolean;
  budget_allocated: boolean;
  shopping_trip_offered: boolean;
  child_satisfaction: number; // 1-5
  notes: string;
  created_at: string;
}

export interface ClothingOwnershipRecordInput {
  id: string;
  child_id: string;
  date: string;
  clothing_belongs_to_child: boolean;
  child_takes_clothing_on_moves: boolean;
  shared_clothing_policy_explained: boolean;
  child_chooses_own_clothing: boolean;
  clothing_reflects_identity: boolean;
  cultural_clothing_provided: boolean;
  religious_clothing_provided: boolean;
  child_has_occasion_wear: boolean;
  child_satisfied_with_wardrobe: boolean;
  pocket_money_for_clothing: boolean;
  notes: string;
  created_at: string;
}

export interface ClothingConditionRecordInput {
  id: string;
  child_id: string;
  date: string;
  total_items_checked: number;
  items_good_condition: number;
  items_fair_condition: number;
  items_poor_condition: number;
  items_needing_replacement: number;
  items_replaced: number;
  stains_or_damage_noted: boolean;
  repair_completed: boolean;
  underwear_adequate: boolean;
  footwear_adequate: boolean;
  child_embarrassed_by_clothing: boolean;
  school_uniform_adequate: boolean;
  notes: string;
  created_at: string;
}

export interface ClothingLabellingStorageInput {
  today: string;
  total_children: number;
  labelling_records: ClothingLabellingRecordInput[];
  storage_records: ClothingStorageRecordInput[];
  rotation_records: ClothingRotationRecordInput[];
  ownership_records: ClothingOwnershipRecordInput[];
  condition_records: ClothingConditionRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type ClothingLabellingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ClothingLabellingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ClothingLabellingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ClothingLabellingStorageResult {
  labelling_rating: ClothingLabellingRating;
  labelling_score: number;
  headline: string;
  labelling_compliance_rate: number;
  storage_adequacy_rate: number;
  seasonal_rotation_rate: number;
  ownership_respect_rate: number;
  condition_monitoring_rate: number;
  child_satisfaction_rate: number;
  labelling_records: ClothingLabellingRecordInput[];
  storage_records: ClothingStorageRecordInput[];
  rotation_records: ClothingRotationRecordInput[];
  ownership_records: ClothingOwnershipRecordInput[];
  condition_records: ClothingConditionRecordInput[];
  strengths: string[];
  concerns: string[];
  recommendations: ClothingLabellingRecommendation[];
  insights: ClothingLabellingInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ClothingLabellingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: ClothingLabellingRating,
  score: number,
  headline: string,
): ClothingLabellingStorageResult {
  return {
    labelling_rating: rating,
    labelling_score: score,
    headline,
    labelling_compliance_rate: 0,
    storage_adequacy_rate: 0,
    seasonal_rotation_rate: 0,
    ownership_respect_rate: 0,
    condition_monitoring_rate: 0,
    child_satisfaction_rate: 0,
    labelling_records: [],
    storage_records: [],
    rotation_records: [],
    ownership_records: [],
    condition_records: [],
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeClothingLabellingStorage(
  input: ClothingLabellingStorageInput,
): ClothingLabellingStorageResult {
  const {
    total_children,
    labelling_records,
    storage_records,
    rotation_records,
    ownership_records,
    condition_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    labelling_records.length === 0 &&
    storage_records.length === 0 &&
    rotation_records.length === 0 &&
    ownership_records.length === 0 &&
    condition_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess clothing labelling and storage.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No clothing labelling, storage, rotation, ownership, or condition records exist despite children on placement -- clothing management requires urgent attention.",
      ),
      concerns: [
        "No clothing labelling, storage, rotation, ownership, or condition records exist despite children being on placement -- the home cannot evidence that children's clothing is appropriately managed, labelled, stored, or maintained.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of clothing labelling audits, wardrobe storage assessments, seasonal rotation checks, ownership records, and condition monitoring to evidence the home's commitment to children's clothing needs and dignity.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation (clothing provision)",
        },
        {
          rank: 2,
          recommendation:
            "Assess every child's wardrobe storage adequacy, clothing condition, and labelling status to ensure clothing is well maintained, identifiable, and belongs to the child.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 -- Children's guide (personal possessions)",
        },
      ],
      insights: [
        {
          text: "The complete absence of clothing labelling and storage records means Ofsted cannot verify that children's clothing is appropriately managed, labelled, or stored. This represents a gap in Reg 5 compliance and the home's duty to maintain children's dignity and personal identity through their belongings.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Labelling compliance ---
  const totalLabellingRecords = labelling_records.length;
  const totalItemsAudited = labelling_records.reduce(
    (sum, r) => sum + r.total_items_audited, 0,
  );
  const totalItemsLabelled = labelling_records.reduce(
    (sum, r) => sum + r.items_labelled, 0,
  );
  const labellingComplianceRate = pct(totalItemsLabelled, totalItemsAudited);

  const discreetLabels = labelling_records.filter((r) => r.labels_discreet).length;
  const discreetRate = pct(discreetLabels, totalLabellingRecords);

  const durableLabels = labelling_records.filter((r) => r.labels_durable).length;
  const durableRate = pct(durableLabels, totalLabellingRecords);

  const postWashChecks = labelling_records.filter((r) => r.labels_checked_after_wash).length;
  const postWashCheckRate = pct(postWashChecks, totalLabellingRecords);

  const childConsultedLabelling = labelling_records.filter(
    (r) => r.child_consulted_on_method,
  ).length;
  const childConsultedLabellingRate = pct(childConsultedLabelling, totalLabellingRecords);

  const totalItemsLost = labelling_records.reduce(
    (sum, r) => sum + r.items_lost_since_last_audit, 0,
  );
  const totalItemsReturnedViaLabel = labelling_records.reduce(
    (sum, r) => sum + r.items_returned_via_label, 0,
  );
  const labelRecoveryRate = pct(totalItemsReturnedViaLabel, totalItemsLost);

  // --- Storage adequacy ---
  const totalStorageRecords = storage_records.length;
  const wardrobeAvailable = storage_records.filter((r) => r.wardrobe_available).length;
  const wardrobeAdequate = storage_records.filter(
    (r) => r.wardrobe_available && r.wardrobe_adequate_size,
  ).length;
  const drawersAvailable = storage_records.filter((r) => r.drawers_available).length;
  const drawersAdequate = storage_records.filter(
    (r) => r.drawers_available && r.drawers_adequate_size,
  ).length;
  const shoeStorageAvailable = storage_records.filter((r) => r.shoe_storage_available).length;
  const storageLockable = storage_records.filter((r) => r.storage_lockable).length;
  const childHasKey = storage_records.filter((r) => r.child_has_key).length;
  const storageClean = storage_records.filter((r) => r.storage_clean).length;
  const storagePersonalised = storage_records.filter((r) => r.storage_personalised).length;

  // Composite storage adequacy: wardrobe + drawers + shoe + clean + adequate size
  const storageComponents = totalStorageRecords > 0
    ? [
        pct(wardrobeAvailable, totalStorageRecords),
        pct(wardrobeAdequate, totalStorageRecords),
        pct(drawersAvailable, totalStorageRecords),
        pct(drawersAdequate, totalStorageRecords),
        pct(shoeStorageAvailable, totalStorageRecords),
        pct(storageClean, totalStorageRecords),
      ]
    : [];
  const storageAdequacyRate = storageComponents.length > 0
    ? Math.round(storageComponents.reduce((a, b) => a + b, 0) / storageComponents.length)
    : 0;

  const storageSatisfied = storage_records.filter(
    (r) => r.child_satisfied_with_storage,
  ).length;
  const storageSatisfactionRate = pct(storageSatisfied, totalStorageRecords);

  const lockableRate = pct(storageLockable, totalStorageRecords);
  const childKeyRate = pct(childHasKey, totalStorageRecords);
  const personalisedRate = pct(storagePersonalised, totalStorageRecords);

  const totalOverflowItems = storage_records.reduce(
    (sum, r) => sum + r.overflow_items_count, 0,
  );

  // --- Seasonal rotation ---
  const totalRotationRecords = rotation_records.length;
  const rotationsCompleted = rotation_records.filter(
    (r) => r.rotation_completed,
  ).length;
  const seasonalRotationRate = pct(rotationsCompleted, totalRotationRecords);

  const outgrownIdentified = rotation_records.reduce(
    (sum, r) => sum + r.outgrown_items_identified, 0,
  );
  const outgrownReplaced = rotation_records.reduce(
    (sum, r) => sum + r.outgrown_items_replaced, 0,
  );
  const outgrownReplacementRate = pct(outgrownReplaced, outgrownIdentified);

  const seasonalAvailable = rotation_records.filter(
    (r) => r.seasonal_items_available,
  ).length;
  const seasonalAvailabilityRate = pct(seasonalAvailable, totalRotationRecords);

  const weatherAppropriate = rotation_records.filter(
    (r) => r.weather_appropriate_clothing,
  ).length;
  const weatherAppropriateRate = pct(weatherAppropriate, totalRotationRecords);

  const childInvolvedRotation = rotation_records.filter(
    (r) => r.child_involved_in_choices,
  ).length;
  const childInvolvedRotationRate = pct(childInvolvedRotation, totalRotationRecords);

  const budgetAllocated = rotation_records.filter((r) => r.budget_allocated).length;
  const budgetAllocatedRate = pct(budgetAllocated, totalRotationRecords);

  const shoppingTripOffered = rotation_records.filter(
    (r) => r.shopping_trip_offered,
  ).length;
  const shoppingTripRate = pct(shoppingTripOffered, totalRotationRecords);

  const rotationSatisfactionSum = rotation_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const rotationSatisfactionAvg =
    totalRotationRecords > 0
      ? Math.round((rotationSatisfactionSum / totalRotationRecords) * 100) / 100
      : 0;

  // --- Ownership respect ---
  const totalOwnershipRecords = ownership_records.length;
  const clothingBelongsToChild = ownership_records.filter(
    (r) => r.clothing_belongs_to_child,
  ).length;
  const belongsToChildRate = pct(clothingBelongsToChild, totalOwnershipRecords);

  const takesOnMoves = ownership_records.filter(
    (r) => r.child_takes_clothing_on_moves,
  ).length;
  const takesOnMovesRate = pct(takesOnMoves, totalOwnershipRecords);

  const choosesOwn = ownership_records.filter(
    (r) => r.child_chooses_own_clothing,
  ).length;
  const choosesOwnRate = pct(choosesOwn, totalOwnershipRecords);

  const reflectsIdentity = ownership_records.filter(
    (r) => r.clothing_reflects_identity,
  ).length;
  const reflectsIdentityRate = pct(reflectsIdentity, totalOwnershipRecords);

  const culturalProvided = ownership_records.filter(
    (r) => r.cultural_clothing_provided,
  ).length;
  const culturalProvidedRate = pct(culturalProvided, totalOwnershipRecords);

  const religiousProvided = ownership_records.filter(
    (r) => r.religious_clothing_provided,
  ).length;
  const religiousProvidedRate = pct(religiousProvided, totalOwnershipRecords);

  const occasionWear = ownership_records.filter(
    (r) => r.child_has_occasion_wear,
  ).length;
  const occasionWearRate = pct(occasionWear, totalOwnershipRecords);

  const ownershipSatisfied = ownership_records.filter(
    (r) => r.child_satisfied_with_wardrobe,
  ).length;
  const ownershipSatisfactionRate = pct(ownershipSatisfied, totalOwnershipRecords);

  const pocketMoneyForClothing = ownership_records.filter(
    (r) => r.pocket_money_for_clothing,
  ).length;
  const pocketMoneyRate = pct(pocketMoneyForClothing, totalOwnershipRecords);

  // Composite ownership respect rate
  const ownershipComponents = totalOwnershipRecords > 0
    ? [
        belongsToChildRate,
        takesOnMovesRate,
        choosesOwnRate,
        reflectsIdentityRate,
      ]
    : [];
  const ownershipRespectRate = ownershipComponents.length > 0
    ? Math.round(ownershipComponents.reduce((a, b) => a + b, 0) / ownershipComponents.length)
    : 0;

  // --- Condition monitoring ---
  const totalConditionRecords = condition_records.length;
  const totalItemsChecked = condition_records.reduce(
    (sum, r) => sum + r.total_items_checked, 0,
  );
  const totalItemsGood = condition_records.reduce(
    (sum, r) => sum + r.items_good_condition, 0,
  );
  const totalItemsFair = condition_records.reduce(
    (sum, r) => sum + r.items_fair_condition, 0,
  );
  const totalItemsPoor = condition_records.reduce(
    (sum, r) => sum + r.items_poor_condition, 0,
  );
  const totalItemsNeedingReplacement = condition_records.reduce(
    (sum, r) => sum + r.items_needing_replacement, 0,
  );
  const totalItemsReplaced = condition_records.reduce(
    (sum, r) => sum + r.items_replaced, 0,
  );

  const goodConditionRate = pct(totalItemsGood, totalItemsChecked);
  const poorConditionRate = pct(totalItemsPoor, totalItemsChecked);
  const replacementRate = pct(totalItemsReplaced, totalItemsNeedingReplacement);
  const conditionMonitoringRate = totalConditionRecords > 0
    ? Math.round((goodConditionRate + replacementRate) / 2)
    : 0;

  const underwearAdequate = condition_records.filter(
    (r) => r.underwear_adequate,
  ).length;
  const underwearAdequateRate = pct(underwearAdequate, totalConditionRecords);

  const footwearAdequate = condition_records.filter(
    (r) => r.footwear_adequate,
  ).length;
  const footwearAdequateRate = pct(footwearAdequate, totalConditionRecords);

  const schoolUniformAdequate = condition_records.filter(
    (r) => r.school_uniform_adequate,
  ).length;
  const schoolUniformRate = pct(schoolUniformAdequate, totalConditionRecords);

  const childEmbarrassed = condition_records.filter(
    (r) => r.child_embarrassed_by_clothing,
  ).length;
  const childEmbarrassedRate = pct(childEmbarrassed, totalConditionRecords);

  const stainsDamage = condition_records.filter(
    (r) => r.stains_or_damage_noted,
  ).length;
  const stainsDamageRate = pct(stainsDamage, totalConditionRecords);

  const repairCompleted = condition_records.filter(
    (r) => r.repair_completed,
  ).length;
  const repairCompletedRate = pct(repairCompleted, stainsDamage);

  // --- Child satisfaction composite ---
  // Combine satisfaction from storage, rotation, ownership
  const satisfactionSources: number[] = [];
  if (totalStorageRecords > 0) satisfactionSources.push(storageSatisfactionRate);
  if (totalRotationRecords > 0) satisfactionSources.push(Math.round(rotationSatisfactionAvg * 20)); // scale 1-5 to 0-100
  if (totalOwnershipRecords > 0) satisfactionSources.push(ownershipSatisfactionRate);
  const childSatisfactionRate = satisfactionSources.length > 0
    ? Math.round(satisfactionSources.reduce((a, b) => a + b, 0) / satisfactionSources.length)
    : 0;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: labellingComplianceRate (>=90: +5, >=70: +2) ---
  if (labellingComplianceRate >= 90) score += 5;
  else if (labellingComplianceRate >= 70) score += 2;

  // --- Bonus 2: storageAdequacyRate (>=90: +5, >=70: +2) ---
  if (storageAdequacyRate >= 90) score += 5;
  else if (storageAdequacyRate >= 70) score += 2;

  // --- Bonus 3: seasonalRotationRate (>=90: +4, >=70: +2) ---
  if (seasonalRotationRate >= 90) score += 4;
  else if (seasonalRotationRate >= 70) score += 2;

  // --- Bonus 4: ownershipRespectRate (>=90: +4, >=70: +2) ---
  if (ownershipRespectRate >= 90) score += 4;
  else if (ownershipRespectRate >= 70) score += 2;

  // --- Bonus 5: conditionMonitoringRate (>=90: +4, >=70: +2) ---
  if (conditionMonitoringRate >= 90) score += 4;
  else if (conditionMonitoringRate >= 70) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=80: +3, >=60: +1) ---
  if (childSatisfactionRate >= 80) score += 3;
  else if (childSatisfactionRate >= 60) score += 1;

  // --- Bonus 7: weatherAppropriateRate (>=90: +3, >=70: +1) ---
  if (weatherAppropriateRate >= 90) score += 3;
  else if (weatherAppropriateRate >= 70) score += 1;

  // max bonuses = 5+5+4+4+4+3+3 = 28

  // -- Penalties (4 with guards) -------------------------------------------

  // labellingComplianceRate < 50 -> -5
  if (labellingComplianceRate < 50 && totalItemsAudited > 0) score -= 5;

  // storageAdequacyRate < 50 -> -5
  if (storageAdequacyRate < 50 && totalStorageRecords > 0) score -= 5;

  // conditionMonitoringRate < 40 -> -4
  if (conditionMonitoringRate < 40 && totalConditionRecords > 0) score -= 4;

  // childEmbarrassedRate >= 30 -> -4
  if (childEmbarrassedRate >= 30 && totalConditionRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const labelling_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (labellingComplianceRate >= 90 && totalItemsAudited > 0) {
    strengths.push(
      `${labellingComplianceRate}% of clothing items labelled -- the home demonstrates excellent labelling compliance, reducing the risk of clothing loss and supporting children's sense of ownership.`,
    );
  } else if (labellingComplianceRate >= 70 && totalItemsAudited > 0) {
    strengths.push(
      `${labellingComplianceRate}% clothing labelling rate -- most children's clothing is identifiable, reducing loss during shared laundry processes.`,
    );
  }

  if (discreetRate >= 80 && totalLabellingRecords > 0) {
    strengths.push(
      `Labels are discreet in ${discreetRate}% of audits -- the home ensures labelling does not draw unwanted attention or stigmatise children in care.`,
    );
  }

  if (durableRate >= 80 && totalLabellingRecords > 0) {
    strengths.push(
      `${durableRate}% of labels are durable and withstand washing -- consistent labelling quality reduces re-labelling burden and clothing misidentification.`,
    );
  }

  if (postWashCheckRate >= 80 && totalLabellingRecords > 0) {
    strengths.push(
      `Post-wash label checks conducted in ${postWashCheckRate}% of audits -- proactive monitoring ensures labels remain legible and intact.`,
    );
  }

  if (childConsultedLabellingRate >= 70 && totalLabellingRecords > 0) {
    strengths.push(
      `Children consulted on labelling method in ${childConsultedLabellingRate}% of cases -- respecting children's preferences about how their clothing is marked demonstrates dignity and autonomy.`,
    );
  }

  if (labelRecoveryRate >= 80 && totalItemsLost > 0) {
    strengths.push(
      `${labelRecoveryRate}% of lost items recovered via labelling -- effective labelling directly reduces clothing loss and associated distress for children.`,
    );
  }

  if (storageAdequacyRate >= 90 && totalStorageRecords > 0) {
    strengths.push(
      `Storage adequacy at ${storageAdequacyRate}% -- children have appropriate wardrobe, drawer, and shoe storage that meets their needs.`,
    );
  } else if (storageAdequacyRate >= 70 && totalStorageRecords > 0) {
    strengths.push(
      `${storageAdequacyRate}% storage adequacy rate -- most children have adequate wardrobe and drawer space for their clothing.`,
    );
  }

  if (lockableRate >= 80 && totalStorageRecords > 0) {
    strengths.push(
      `${lockableRate}% of storage is lockable -- children's clothing and personal items are secure, supporting their sense of privacy and ownership.`,
    );
  }

  if (personalisedRate >= 70 && totalStorageRecords > 0) {
    strengths.push(
      `${personalisedRate}% of storage areas personalised by children -- the home encourages children to make their wardrobe space their own.`,
    );
  }

  if (storageSatisfactionRate >= 80 && totalStorageRecords > 0) {
    strengths.push(
      `${storageSatisfactionRate}% of children satisfied with their clothing storage -- children feel they have enough space and it works for them.`,
    );
  }

  if (seasonalRotationRate >= 90 && totalRotationRecords > 0) {
    strengths.push(
      `${seasonalRotationRate}% seasonal rotation completion rate -- the home proactively ensures children have weather-appropriate clothing for each season.`,
    );
  } else if (seasonalRotationRate >= 70 && totalRotationRecords > 0) {
    strengths.push(
      `${seasonalRotationRate}% seasonal rotation rate -- good practice in managing seasonal clothing transitions.`,
    );
  }

  if (outgrownReplacementRate >= 90 && outgrownIdentified > 0) {
    strengths.push(
      `${outgrownReplacementRate}% of outgrown items replaced -- the home responds promptly when children's clothing no longer fits, preventing discomfort and embarrassment.`,
    );
  }

  if (weatherAppropriateRate >= 90 && totalRotationRecords > 0) {
    strengths.push(
      `${weatherAppropriateRate}% of children have weather-appropriate clothing -- every child is adequately dressed for the current season.`,
    );
  }

  if (childInvolvedRotationRate >= 70 && totalRotationRecords > 0) {
    strengths.push(
      `Children involved in clothing choices during ${childInvolvedRotationRate}% of rotations -- the home values children's voice in decisions about their own appearance and comfort.`,
    );
  }

  if (shoppingTripRate >= 70 && totalRotationRecords > 0) {
    strengths.push(
      `Shopping trips offered during ${shoppingTripRate}% of seasonal rotations -- children have the normalising experience of choosing their own new clothing.`,
    );
  }

  if (rotationSatisfactionAvg >= 4.0 && totalRotationRecords > 0) {
    strengths.push(
      `Children's satisfaction with seasonal clothing provision averages ${rotationSatisfactionAvg}/5 -- children feel well provided for and involved in the process.`,
    );
  }

  if (belongsToChildRate >= 90 && totalOwnershipRecords > 0) {
    strengths.push(
      `${belongsToChildRate}% of clothing belongs to the individual child -- strong ownership practice ensures children's clothing is truly theirs.`,
    );
  } else if (belongsToChildRate >= 70 && totalOwnershipRecords > 0) {
    strengths.push(
      `${belongsToChildRate}% clothing ownership rate -- most children have their own clothing rather than shared or communal items.`,
    );
  }

  if (takesOnMovesRate >= 90 && totalOwnershipRecords > 0) {
    strengths.push(
      `${takesOnMovesRate}% of children take their clothing when moving placements -- the home respects that clothing belongs to the child and travels with them.`,
    );
  }

  if (choosesOwnRate >= 80 && totalOwnershipRecords > 0) {
    strengths.push(
      `${choosesOwnRate}% of children choose their own clothing -- the home promotes autonomy and self-expression through clothing choices.`,
    );
  }

  if (reflectsIdentityRate >= 80 && totalOwnershipRecords > 0) {
    strengths.push(
      `${reflectsIdentityRate}% of children's clothing reflects their identity -- the home ensures clothing supports cultural, religious, and personal expression.`,
    );
  }

  if (occasionWearRate >= 80 && totalOwnershipRecords > 0) {
    strengths.push(
      `${occasionWearRate}% of children have occasion wear -- children can attend events, celebrations, and special occasions in appropriate clothing, just like their non-looked-after peers.`,
    );
  }

  if (ownershipSatisfactionRate >= 80 && totalOwnershipRecords > 0) {
    strengths.push(
      `${ownershipSatisfactionRate}% of children satisfied with their overall wardrobe -- children feel their clothing needs, preferences, and identity are respected.`,
    );
  }

  if (goodConditionRate >= 90 && totalItemsChecked > 0) {
    strengths.push(
      `${goodConditionRate}% of clothing in good condition -- the home maintains children's clothing to a high standard, preserving dignity and comfort.`,
    );
  } else if (goodConditionRate >= 70 && totalItemsChecked > 0) {
    strengths.push(
      `${goodConditionRate}% of clothing in good condition -- most children's clothing is well maintained.`,
    );
  }

  if (replacementRate >= 90 && totalItemsNeedingReplacement > 0) {
    strengths.push(
      `${replacementRate}% of items needing replacement have been replaced -- the home is responsive to clothing wear and tear.`,
    );
  }

  if (underwearAdequateRate >= 95 && totalConditionRecords > 0) {
    strengths.push(
      `Underwear adequate for ${underwearAdequateRate}% of children -- a fundamental dignity requirement is consistently met.`,
    );
  }

  if (footwearAdequateRate >= 90 && totalConditionRecords > 0) {
    strengths.push(
      `Footwear adequate for ${footwearAdequateRate}% of children -- children have appropriate shoes and footwear for daily activities.`,
    );
  }

  if (schoolUniformRate >= 90 && totalConditionRecords > 0) {
    strengths.push(
      `School uniform adequate for ${schoolUniformRate}% of children -- children attend school in proper uniform, supporting their sense of belonging and avoiding stigma.`,
    );
  }

  if (childEmbarrassedRate === 0 && totalConditionRecords > 0) {
    strengths.push(
      "No children report embarrassment about their clothing -- the home ensures every child can feel confident and comfortable in what they wear.",
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (labellingComplianceRate < 50 && totalItemsAudited > 0) {
    concerns.push(
      `Only ${labellingComplianceRate}% of clothing items labelled -- the majority of children's clothing is not identifiable, increasing the risk of loss and conflict during shared laundry processes.`,
    );
  } else if (labellingComplianceRate < 70 && labellingComplianceRate >= 50 && totalItemsAudited > 0) {
    concerns.push(
      `Clothing labelling at ${labellingComplianceRate}% -- significant gaps in labelling compliance increase the risk of clothing misidentification and loss.`,
    );
  }

  if (discreetRate < 50 && totalLabellingRecords > 0) {
    concerns.push(
      `Only ${discreetRate}% of labels are discreet -- visible or prominent labelling can stigmatise children in care and undermine their dignity.`,
    );
  }

  if (durableRate < 50 && totalLabellingRecords > 0) {
    concerns.push(
      `Only ${durableRate}% of labels are durable -- labels that fade or detach after washing render the labelling effort ineffective.`,
    );
  }

  if (totalItemsLost > 10 && labelRecoveryRate < 50) {
    concerns.push(
      `${totalItemsLost} items lost with only ${labelRecoveryRate}% recovery rate -- children are losing clothing at a concerning rate and labelling is not effectively preventing this.`,
    );
  }

  if (storageAdequacyRate < 50 && totalStorageRecords > 0) {
    concerns.push(
      `Storage adequacy at only ${storageAdequacyRate}% -- children do not have adequate wardrobe, drawer, or shoe storage for their clothing, compromising Reg 5 requirements.`,
    );
  } else if (storageAdequacyRate < 70 && storageAdequacyRate >= 50 && totalStorageRecords > 0) {
    concerns.push(
      `Storage adequacy at ${storageAdequacyRate}% -- some children lack adequate wardrobe or drawer space for their clothing.`,
    );
  }

  if (storageSatisfactionRate < 50 && totalStorageRecords > 0) {
    concerns.push(
      `Only ${storageSatisfactionRate}% of children satisfied with clothing storage -- children feel their storage is insufficient, which impacts their sense of home and belonging.`,
    );
  }

  if (totalOverflowItems > 5 && totalStorageRecords > 0) {
    concerns.push(
      `${totalOverflowItems} overflow clothing items recorded across the home -- storage is not keeping pace with children's clothing volume, leading to clothing piled or stored inappropriately.`,
    );
  }

  if (seasonalRotationRate < 50 && totalRotationRecords > 0) {
    concerns.push(
      `Only ${seasonalRotationRate}% of seasonal rotations completed -- children may be wearing weather-inappropriate clothing due to incomplete seasonal wardrobe management.`,
    );
  } else if (seasonalRotationRate < 70 && seasonalRotationRate >= 50 && totalRotationRecords > 0) {
    concerns.push(
      `Seasonal rotation at ${seasonalRotationRate}% -- some children's wardrobes have not been properly transitioned for the current season.`,
    );
  }

  if (weatherAppropriateRate < 70 && totalRotationRecords > 0) {
    concerns.push(
      `Only ${weatherAppropriateRate}% of children have weather-appropriate clothing -- some children may be uncomfortable or at risk due to clothing not suited to current conditions.`,
    );
  }

  if (outgrownReplacementRate < 50 && outgrownIdentified > 0) {
    concerns.push(
      `Only ${outgrownReplacementRate}% of outgrown items replaced -- children may be wearing clothing that no longer fits properly, causing discomfort and potential embarrassment.`,
    );
  }

  if (childInvolvedRotationRate < 50 && totalRotationRecords > 0) {
    concerns.push(
      `Children involved in clothing choices during only ${childInvolvedRotationRate}% of rotations -- decisions about children's clothing are being made without their input, undermining autonomy.`,
    );
  }

  if (belongsToChildRate < 70 && totalOwnershipRecords > 0) {
    concerns.push(
      `Only ${belongsToChildRate}% of clothing belongs to the individual child -- shared or communal clothing arrangements undermine children's sense of ownership and identity.`,
    );
  }

  if (takesOnMovesRate < 70 && totalOwnershipRecords > 0) {
    concerns.push(
      `Only ${takesOnMovesRate}% of children take their clothing when moving placements -- clothing that stays at the home when children move sends a damaging message about ownership and belonging.`,
    );
  }

  if (choosesOwnRate < 50 && totalOwnershipRecords > 0) {
    concerns.push(
      `Only ${choosesOwnRate}% of children choose their own clothing -- limited choice undermines children's developing autonomy and self-expression.`,
    );
  }

  if (reflectsIdentityRate < 50 && totalOwnershipRecords > 0) {
    concerns.push(
      `Only ${reflectsIdentityRate}% of children's clothing reflects their identity -- the home may not be considering cultural, religious, or personal preferences when providing clothing.`,
    );
  }

  if (conditionMonitoringRate < 40 && totalConditionRecords > 0) {
    concerns.push(
      `Condition monitoring rate at only ${conditionMonitoringRate}% -- clothing is not being adequately maintained or replaced when worn, risking children's dignity and comfort.`,
    );
  } else if (conditionMonitoringRate < 60 && conditionMonitoringRate >= 40 && totalConditionRecords > 0) {
    concerns.push(
      `Condition monitoring rate at ${conditionMonitoringRate}% -- clothing maintenance and replacement could be more responsive to wear and tear.`,
    );
  }

  if (poorConditionRate >= 20 && totalItemsChecked > 0) {
    concerns.push(
      `${poorConditionRate}% of clothing in poor condition -- a significant proportion of children's clothing is worn, damaged, or inappropriate, impacting dignity and self-esteem.`,
    );
  }

  if (replacementRate < 50 && totalItemsNeedingReplacement > 0) {
    concerns.push(
      `Only ${replacementRate}% of items needing replacement have been replaced -- children are continuing to wear clothing that has been identified as needing replacement.`,
    );
  }

  if (underwearAdequateRate < 80 && totalConditionRecords > 0) {
    concerns.push(
      `Underwear adequate for only ${underwearAdequateRate}% of children -- this is a fundamental dignity requirement that must be met for every child without exception.`,
    );
  }

  if (footwearAdequateRate < 70 && totalConditionRecords > 0) {
    concerns.push(
      `Footwear adequate for only ${footwearAdequateRate}% of children -- some children lack appropriate shoes, affecting their daily activities and comfort.`,
    );
  }

  if (schoolUniformRate < 80 && totalConditionRecords > 0) {
    concerns.push(
      `School uniform adequate for only ${schoolUniformRate}% of children -- children attending school without proper uniform may feel singled out or stigmatised.`,
    );
  }

  if (childEmbarrassedRate >= 30 && totalConditionRecords > 0) {
    concerns.push(
      `${childEmbarrassedRate}% of children report embarrassment about their clothing -- this is a significant indicator that clothing provision is failing to meet children's needs and is impacting their self-esteem and dignity.`,
    );
  } else if (childEmbarrassedRate > 0 && childEmbarrassedRate < 30 && totalConditionRecords > 0) {
    concerns.push(
      `${childEmbarrassedRate}% of children report embarrassment about their clothing -- even one child feeling embarrassed by their clothing is unacceptable and requires immediate attention.`,
    );
  }

  if (totalLabellingRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No clothing labelling audits recorded despite children on placement -- the home cannot evidence that children's clothing is identifiable or that labelling systems are in place.",
    );
  }

  if (totalConditionRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No clothing condition monitoring records -- the home has not documented whether children's clothing is in acceptable condition, undermining evidence of adequate care.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: ClothingLabellingRecommendation[] = [];
  let rank = 0;

  if (labellingComplianceRate < 50 && totalItemsAudited > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement a comprehensive clothing labelling system -- audit all children's clothing, apply discreet durable labels, and establish a post-wash checking protocol to ensure every item is identifiable and traceable.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation (clothing provision)",
    });
  }

  if (storageAdequacyRate < 50 && totalStorageRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately review and upgrade clothing storage provision for all children -- ensure every child has adequate wardrobe space, drawers, and shoe storage that meets Reg 5 requirements for living accommodation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation",
    });
  }

  if (childEmbarrassedRate >= 30 && totalConditionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address clothing embarrassment -- speak individually with every child who reports embarrassment, identify specific items causing concern, and replace them immediately. No child should feel embarrassed by what they wear.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children (dignity)",
    });
  }

  if (conditionMonitoringRate < 40 && totalConditionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement regular clothing condition audits with prompt replacement of worn, damaged, or poor-condition items. Establish a minimum standard for clothing quality and a responsive replacement process.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation (clothing provision)",
    });
  }

  if (underwearAdequateRate < 80 && totalConditionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately ensure every child has adequate underwear -- this is a non-negotiable dignity requirement. Audit each child's underwear provision and replace items that are worn, outgrown, or insufficient in quantity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation",
    });
  }

  if (belongsToChildRate < 70 && totalOwnershipRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review clothing ownership arrangements to ensure all children's clothing genuinely belongs to them. Eliminate any communal or shared clothing practices and ensure every child takes their clothing with them if they move placements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Children's guide (personal possessions)",
    });
  }

  if (seasonalRotationRate < 50 && totalRotationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a seasonal wardrobe rotation calendar and complete rotations promptly at each season change. Assess each child's wardrobe for weather-appropriate clothing and replace outgrown or missing seasonal items.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation (clothing provision)",
    });
  }

  if (weatherAppropriateRate < 70 && totalRotationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child has clothing appropriate for the current weather -- audit wardrobes against the current season and provide coats, waterproofs, warm layers, or summer clothing as needed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation",
    });
  }

  if (schoolUniformRate < 80 && totalConditionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review school uniform provision for every child and ensure adequate, well-fitting, clean uniforms are available. Children should not stand out from peers due to uniform inadequacy.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (choosesOwnRate < 50 && totalOwnershipRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's involvement in clothing choices -- offer regular shopping trips, provide catalogues or online browsing, and let children select styles that reflect their personality and preferences.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children (autonomy)",
    });
  }

  if (reflectsIdentityRate < 50 && totalOwnershipRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure clothing provision reflects each child's cultural, religious, and personal identity. Discuss clothing preferences during keywork sessions and source items that support children's self-expression.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation",
    });
  }

  if (labellingComplianceRate >= 50 && labellingComplianceRate < 70 && totalItemsAudited > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve labelling compliance to at least 70% -- identify unlabelled items and apply labels using children's preferred method. Conduct monthly labelling audits.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation",
    });
  }

  if (storageAdequacyRate >= 50 && storageAdequacyRate < 70 && totalStorageRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve clothing storage adequacy to at least 70% -- consider additional wardrobe or drawer units where space allows and ensure shoe storage is provided.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation",
    });
  }

  if (outgrownReplacementRate < 50 && outgrownIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Accelerate replacement of outgrown clothing items -- establish a responsive process so that identified outgrown items are replaced within two weeks.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation (clothing provision)",
    });
  }

  if (seasonalRotationRate >= 50 && seasonalRotationRate < 70 && totalRotationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve seasonal rotation completion to at least 70% -- assign key workers responsibility for each child's seasonal wardrobe transition.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation",
    });
  }

  if (footwearAdequateRate < 70 && totalConditionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review footwear provision for all children and ensure every child has properly fitting shoes suitable for school, outdoor activities, and daily wear.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation",
    });
  }

  if (totalLabellingRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement clothing labelling audits for every child -- establish a labelling system, document compliance, and schedule regular audits to evidence that children's clothing is identifiable.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation (clothing provision)",
    });
  }

  if (totalConditionRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin regular clothing condition monitoring for every child -- document the condition of clothing, underwear, footwear, and school uniform to evidence that children are well dressed and cared for.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Living accommodation",
    });
  }

  if (lockableRate < 50 && totalStorageRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide lockable clothing storage for children where age-appropriate and requested -- this supports children's sense of privacy and security over their belongings.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Children's guide (personal possessions)",
    });
  }

  if (occasionWearRate < 60 && totalOwnershipRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child has appropriate occasion wear for events, celebrations, and special occasions. Budget for smart clothing so children do not feel different from their non-looked-after peers.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: ClothingLabellingInsight[] = [];

  // --- Critical insights ---

  if (labellingComplianceRate < 50 && totalItemsAudited > 0) {
    insights.push({
      text: `Only ${labellingComplianceRate}% of clothing items labelled. Ofsted will view the failure to maintain adequate clothing labelling as evidence that children's personal property is not being respected or safeguarded -- a concern under Reg 5 and Reg 25.`,
      severity: "critical",
    });
  }

  if (storageAdequacyRate < 50 && totalStorageRecords > 0) {
    insights.push({
      text: `Storage adequacy at only ${storageAdequacyRate}%. Inadequate wardrobe and drawer space means children cannot properly store their clothing, impacting their dignity and the home's compliance with Reg 5 requirements for living accommodation.`,
      severity: "critical",
    });
  }

  if (childEmbarrassedRate >= 30 && totalConditionRecords > 0) {
    insights.push({
      text: `${childEmbarrassedRate}% of children report embarrassment about their clothing. This is a deeply concerning indicator that Ofsted will treat as evidence of inadequate clothing provision. No child in care should feel embarrassed by what they wear -- this undermines self-esteem, social confidence, and the home's duty of care.`,
      severity: "critical",
    });
  }

  if (conditionMonitoringRate < 40 && totalConditionRecords > 0) {
    insights.push({
      text: `Condition monitoring rate at only ${conditionMonitoringRate}%. Poor clothing condition and slow replacement suggests the home is not adequately investing in children's clothing needs. Ofsted will view this as a failure to provide the standard of living that children deserve.`,
      severity: "critical",
    });
  }

  if (underwearAdequateRate < 80 && totalConditionRecords > 0) {
    insights.push({
      text: `Underwear adequate for only ${underwearAdequateRate}% of children. Inadequate underwear provision is a fundamental care failure that Ofsted will treat as a serious concern -- every child must have sufficient clean, well-fitting underwear as a basic dignity requirement.`,
      severity: "critical",
    });
  }

  if (belongsToChildRate < 50 && totalOwnershipRecords > 0) {
    insights.push({
      text: `Only ${belongsToChildRate}% of clothing belongs to the individual child. Communal or shared clothing arrangements undermine children's sense of identity and ownership. Reg 25 requires that children's personal possessions are respected -- clothing that does not belong to the child fails this standard.`,
      severity: "critical",
    });
  }

  if (totalLabellingRecords === 0 && totalConditionRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No clothing labelling or condition monitoring records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's clothing is not being properly managed, labelled, or maintained -- a significant omission under Reg 5.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (labellingComplianceRate >= 50 && labellingComplianceRate < 70 && totalItemsAudited > 0) {
    insights.push({
      text: `Labelling compliance at ${labellingComplianceRate}% -- improving but a significant proportion of children's clothing remains unidentifiable. Each unlabelled item increases the risk of loss and conflict during shared laundry.`,
      severity: "warning",
    });
  }

  if (storageAdequacyRate >= 50 && storageAdequacyRate < 70 && totalStorageRecords > 0) {
    insights.push({
      text: `Storage adequacy at ${storageAdequacyRate}% -- while some children have adequate storage, others lack sufficient wardrobe or drawer space. Inconsistent provision risks Reg 5 non-compliance.`,
      severity: "warning",
    });
  }

  if (seasonalRotationRate >= 50 && seasonalRotationRate < 80 && totalRotationRecords > 0) {
    insights.push({
      text: `Seasonal rotation at ${seasonalRotationRate}% -- some children's wardrobes have not been fully transitioned for the season. Incomplete rotation may leave children without weather-appropriate clothing.`,
      severity: "warning",
    });
  }

  if (ownershipRespectRate >= 50 && ownershipRespectRate < 80 && totalOwnershipRecords > 0) {
    insights.push({
      text: `Ownership respect rate at ${ownershipRespectRate}% -- while ownership principles are partially in place, not all children experience full ownership of their clothing, freedom of choice, and identity expression through what they wear.`,
      severity: "warning",
    });
  }

  if (conditionMonitoringRate >= 40 && conditionMonitoringRate < 70 && totalConditionRecords > 0) {
    insights.push({
      text: `Condition monitoring at ${conditionMonitoringRate}% -- clothing maintenance is happening but replacement of worn items needs to be more responsive. Children deserve clothing in consistently good condition.`,
      severity: "warning",
    });
  }

  if (childSatisfactionRate >= 50 && childSatisfactionRate < 80) {
    insights.push({
      text: `Child satisfaction with clothing provision at ${childSatisfactionRate}% -- while some children are satisfied, others feel their clothing needs are not fully met. Individual conversations are needed to understand and address gaps.`,
      severity: "warning",
    });
  }

  if (poorConditionRate >= 10 && poorConditionRate < 20 && totalItemsChecked > 0) {
    insights.push({
      text: `${poorConditionRate}% of clothing in poor condition -- while not at critical levels, any clothing in poor condition risks undermining children's dignity and self-esteem.`,
      severity: "warning",
    });
  }

  if (outgrownReplacementRate >= 50 && outgrownReplacementRate < 80 && outgrownIdentified > 0) {
    insights.push({
      text: `Outgrown replacement rate at ${outgrownReplacementRate}% -- some children are still wearing outgrown items while replacements are pending. Children grow quickly and replacement needs to keep pace.`,
      severity: "warning",
    });
  }

  if (stainsDamageRate >= 30 && totalConditionRecords > 0) {
    insights.push({
      text: `Stains or damage noted in ${stainsDamageRate}% of condition checks -- persistent staining or damage may indicate laundry process issues or insufficient clothing stock for rotation during cleaning.`,
      severity: "warning",
    });
  }

  if (childConsultedLabellingRate < 50 && totalLabellingRecords > 0) {
    insights.push({
      text: `Children consulted on labelling method in only ${childConsultedLabellingRate}% of cases -- labelling decisions are being made without children's input. Some children may find certain labelling methods stigmatising or prefer specific approaches.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (labelling_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding clothing labelling and storage management -- children's clothing is well labelled, properly stored, seasonally appropriate, personally owned, and maintained in good condition. This evidences strong Reg 5 compliance and genuine respect for children's dignity and identity.",
      severity: "positive",
    });
  }

  if (labellingComplianceRate >= 90 && storageAdequacyRate >= 90 && totalItemsAudited > 0 && totalStorageRecords > 0) {
    insights.push({
      text: `Labelling compliance at ${labellingComplianceRate}% with storage adequacy at ${storageAdequacyRate}% -- the home provides comprehensive clothing management infrastructure. Children's clothing is identifiable and properly stored, reducing loss and supporting dignity.`,
      severity: "positive",
    });
  }

  if (seasonalRotationRate >= 90 && weatherAppropriateRate >= 90 && totalRotationRecords > 0) {
    insights.push({
      text: `${seasonalRotationRate}% seasonal rotation with ${weatherAppropriateRate}% weather-appropriate clothing -- children are consistently dressed for the season with proactive wardrobe management ensuring comfort and wellbeing.`,
      severity: "positive",
    });
  }

  if (ownershipRespectRate >= 90 && totalOwnershipRecords > 0) {
    insights.push({
      text: `Ownership respect rate at ${ownershipRespectRate}% -- children's clothing genuinely belongs to them, reflects their identity, and travels with them. The home demonstrates exemplary respect for children's personal property and autonomy under Reg 25.`,
      severity: "positive",
    });
  }

  if (childSatisfactionRate >= 80) {
    insights.push({
      text: `Child satisfaction with clothing provision at ${childSatisfactionRate}% -- children feel well dressed, confident, and respected in their clothing choices. This is strong evidence that the home prioritises children's experiences and dignity.`,
      severity: "positive",
    });
  }

  if (goodConditionRate >= 90 && replacementRate >= 90 && totalItemsChecked > 0 && totalItemsNeedingReplacement > 0) {
    insights.push({
      text: `${goodConditionRate}% of clothing in good condition with ${replacementRate}% replacement rate -- the home invests in maintaining children's clothing to a high standard and responds promptly when items need replacing.`,
      severity: "positive",
    });
  }

  if (childEmbarrassedRate === 0 && totalConditionRecords > 0 && schoolUniformRate >= 90 && footwearAdequateRate >= 90) {
    insights.push({
      text: "No children report clothing embarrassment, school uniform is adequate, and footwear provision is strong. Children can attend school and social activities feeling confident and no different from their non-looked-after peers.",
      severity: "positive",
    });
  }

  if (choosesOwnRate >= 80 && shoppingTripRate >= 70 && totalOwnershipRecords > 0 && totalRotationRecords > 0) {
    insights.push({
      text: `${choosesOwnRate}% of children choose their own clothing with shopping trips offered during ${shoppingTripRate}% of rotations -- the home provides normalising experiences where children can express their style and preferences.`,
      severity: "positive",
    });
  }

  if (culturalProvidedRate >= 80 && religiousProvidedRate >= 80 && totalOwnershipRecords > 0) {
    insights.push({
      text: `Cultural clothing provided for ${culturalProvidedRate}% and religious clothing for ${religiousProvidedRate}% of children assessed -- the home respects and supports children's cultural and religious identity through appropriate clothing provision.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (labelling_rating === "outstanding") {
    headline =
      "Outstanding clothing labelling and storage management -- children's clothing is well labelled, properly stored, seasonally rotated, personally owned, and maintained in excellent condition.";
  } else if (labelling_rating === "good") {
    headline = `Good clothing labelling and storage management -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (labelling_rating === "adequate") {
    headline = `Adequate clothing labelling and storage management -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's clothing needs and dignity are fully met.`;
  } else {
    headline = `Clothing labelling and storage management is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's clothing is properly managed, labelled, stored, and maintained.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    labelling_rating,
    labelling_score: score,
    headline,
    labelling_compliance_rate: labellingComplianceRate,
    storage_adequacy_rate: storageAdequacyRate,
    seasonal_rotation_rate: seasonalRotationRate,
    ownership_respect_rate: ownershipRespectRate,
    condition_monitoring_rate: conditionMonitoringRate,
    child_satisfaction_rate: childSatisfactionRate,
    labelling_records,
    storage_records,
    rotation_records,
    ownership_records,
    condition_records,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
