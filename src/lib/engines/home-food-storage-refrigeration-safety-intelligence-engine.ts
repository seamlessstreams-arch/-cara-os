import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FOOD STORAGE & REFRIGERATION SAFETY INTELLIGENCE ENGINE
// Monitors fridge/freezer temperature logging, food storage compliance,
// use-by date checking, food hygiene ratings, and cross-contamination
// prevention across the home.
// Measures temperature logging, storage compliance, date checking, hygiene
// rating, cross-contamination prevention, and staff training.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 25 (Premises), Food Safety Act 1990, SCCIF safety.
// Store keys: temperatureLogRecords, storageComplianceRecords,
//             dateCheckRecords, hygieneRatingRecords,
//             crossContaminationRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TemperatureLogRecordInput {
  id: string;
  date: string;
  appliance_id: string;
  appliance_type: "fridge" | "freezer" | "walk_in_fridge" | "walk_in_freezer" | "prep_fridge" | "other";
  appliance_name: string;
  recorded_temperature_celsius: number;
  target_min_celsius: number;
  target_max_celsius: number;
  in_range: boolean;
  corrective_action_taken: boolean;
  corrective_action_details: string | null;
  recorded_by: string;
  time_of_check: string;
  thermometer_calibrated: boolean;
  second_check_done: boolean;
  second_check_temperature: number | null;
  notes: string | null;
  created_at: string;
}

export interface StorageComplianceRecordInput {
  id: string;
  date: string;
  area_checked: "fridge" | "freezer" | "dry_store" | "pantry" | "vegetable_rack" | "cupboard" | "other";
  area_name: string;
  items_correctly_stored: boolean;
  raw_separated_from_cooked: boolean;
  items_covered_wrapped: boolean;
  items_labelled: boolean;
  items_dated: boolean;
  no_floor_storage: boolean;
  correct_shelf_positioning: boolean;
  no_overcrowding: boolean;
  allergen_items_segregated: boolean;
  checked_by: string;
  issues_found: string[];
  issues_resolved: boolean;
  resolution_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface DateCheckRecordInput {
  id: string;
  date: string;
  area_checked: string;
  total_items_checked: number;
  items_in_date: number;
  items_out_of_date: number;
  items_removed: number;
  items_approaching_expiry: number;
  use_by_dates_visible: boolean;
  open_dates_marked: boolean;
  fifo_rotation_followed: boolean;
  checked_by: string;
  corrective_actions: string | null;
  notes: string | null;
  created_at: string;
}

export interface HygieneRatingRecordInput {
  id: string;
  date: string;
  assessment_type: "internal_audit" | "eho_inspection" | "spot_check" | "deep_clean_check" | "monthly_review" | "other";
  assessor: string;
  fridge_cleanliness: number; // 1-5
  freezer_cleanliness: number; // 1-5
  storage_area_cleanliness: number; // 1-5
  food_handling_practice: number; // 1-5
  hand_washing_compliance: boolean;
  cleaning_schedule_followed: boolean;
  pest_control_satisfactory: boolean;
  waste_disposal_correct: boolean;
  overall_hygiene_score: number | null; // 1-5
  issues_identified: string[];
  issues_resolved: boolean;
  resolution_date: string | null;
  eho_rating: number | null; // 0-5 for EHO inspections
  notes: string | null;
  created_at: string;
}

export interface CrossContaminationRecordInput {
  id: string;
  date: string;
  check_type: "routine" | "post_delivery" | "post_incident" | "spot_check" | "training_observation" | "other";
  colour_coded_boards_used: boolean;
  separate_utensils_raw_cooked: boolean;
  allergen_separation_maintained: boolean;
  hand_washing_between_tasks: boolean;
  gloves_changed_appropriately: boolean;
  raw_food_stored_below_cooked: boolean;
  separate_prep_areas_used: boolean;
  cleaning_between_tasks: boolean;
  staff_member_observed: string;
  checked_by: string;
  issues_found: string[];
  corrective_action_taken: boolean;
  corrective_action_details: string | null;
  notes: string | null;
  created_at: string;
}

export interface FoodStorageRefrigerationSafetyInput {
  today: string;
  total_children: number;
  temperature_log_records: TemperatureLogRecordInput[];
  storage_compliance_records: StorageComplianceRecordInput[];
  date_check_records: DateCheckRecordInput[];
  hygiene_rating_records: HygieneRatingRecordInput[];
  cross_contamination_records: CrossContaminationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FoodStorageRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FoodStorageInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface FoodStorageRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface FoodStorageRefrigerationSafetyResult {
  food_storage_rating: FoodStorageRating;
  food_storage_score: number | null;
  headline: string;
  total_temperature_logs: number;
  total_storage_checks: number;
  total_date_checks: number;
  total_hygiene_assessments: number;
  total_cross_contamination_checks: number;
  temperature_logging_rate: number | null;
  storage_compliance_rate: number | null;
  date_checking_rate: number | null;
  hygiene_rating_rate: number | null;
  cross_contamination_rate: number | null;
  staff_training_rate: number | null;
  temperature_log_records: TemperatureLogRecordInput[];
  storage_compliance_records: StorageComplianceRecordInput[];
  date_check_records: DateCheckRecordInput[];
  hygiene_rating_records: HygieneRatingRecordInput[];
  cross_contamination_records: CrossContaminationRecordInput[];
  strengths: string[];
  concerns: string[];
  recommendations: FoodStorageRecommendation[];
  insights: FoodStorageInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FoodStorageRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: FoodStorageRating,
  score: number,
  headline: string,
): FoodStorageRefrigerationSafetyResult {
  return {
    food_storage_rating: rating,
    food_storage_score: score,
    headline,
    total_temperature_logs: 0,
    total_storage_checks: 0,
    total_date_checks: 0,
    total_hygiene_assessments: 0,
    total_cross_contamination_checks: 0,
    temperature_logging_rate: null,
    storage_compliance_rate: null,
    date_checking_rate: null,
    hygiene_rating_rate: null,
    cross_contamination_rate: null,
    staff_training_rate: null,
    temperature_log_records: [],
    storage_compliance_records: [],
    date_check_records: [],
    hygiene_rating_records: [],
    cross_contamination_records: [],
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeFoodStorageRefrigerationSafety(
  input: FoodStorageRefrigerationSafetyInput,
): FoodStorageRefrigerationSafetyResult {
  const {
    total_children,
    temperature_log_records,
    storage_compliance_records,
    date_check_records,
    hygiene_rating_records,
    cross_contamination_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    temperature_log_records.length === 0 &&
    storage_compliance_records.length === 0 &&
    date_check_records.length === 0 &&
    hygiene_rating_records.length === 0 &&
    cross_contamination_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess food storage and refrigeration safety.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No food storage or refrigeration safety data recorded despite children on placement — food safety monitoring requires urgent attention.",
      ),
      concerns: [
        "No temperature logs, storage compliance checks, date checks, hygiene assessments, or cross-contamination prevention records exist despite children being on placement — the home cannot evidence food safety management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement immediate recording of fridge/freezer temperatures, food storage compliance checks, use-by date monitoring, hygiene audits, and cross-contamination prevention measures to evidence the home's food safety practices.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all staff responsible for food handling receive food hygiene training and that daily temperature logging and storage checks are embedded as standard practice.",
          urgency: "immediate",
          regulatory_ref: "Food Safety Act 1990",
        },
      ],
      insights: [
        {
          text: "The complete absence of food storage and refrigeration safety records means Ofsted and Environmental Health cannot verify that children's food is stored safely, temperatures are monitored, or cross-contamination risks are managed. This represents a fundamental gap in Reg 25 compliance and Food Safety Act 1990 obligations.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Temperature logging metrics ---
  const totalTempLogs = temperature_log_records.length;

  const tempsInRange = temperature_log_records.filter((r) => r.in_range).length;
  const temperatureComplianceRate = rate(tempsInRange, totalTempLogs);

  const tempsWithCorrectiveAction = temperature_log_records.filter(
    (r) => !r.in_range && r.corrective_action_taken,
  ).length;
  const tempsOutOfRange = temperature_log_records.filter((r) => !r.in_range).length;
  const correctiveActionRate = rate(tempsWithCorrectiveAction, tempsOutOfRange);

  const thermometerCalibrated = temperature_log_records.filter((r) => r.thermometer_calibrated).length;
  const calibrationRate = rate(thermometerCalibrated, totalTempLogs);

  // Composite temperature logging rate: in_range + calibrated + (corrective if out of range)
  const tempNumerator = tempsInRange + thermometerCalibrated;
  const tempDenominator = totalTempLogs * 2;
  const temperatureLoggingRate = rate(tempNumerator, tempDenominator);

  // Unique appliances checked
  const uniqueAppliances = new Set(temperature_log_records.map((r) => r.appliance_id)).size;

  // --- Storage compliance metrics ---
  const totalStorageChecks = storage_compliance_records.length;

  const storageComplianceChecks = [
    (s: StorageComplianceRecordInput) => s.items_correctly_stored,
    (s: StorageComplianceRecordInput) => s.raw_separated_from_cooked,
    (s: StorageComplianceRecordInput) => s.items_covered_wrapped,
    (s: StorageComplianceRecordInput) => s.items_labelled,
    (s: StorageComplianceRecordInput) => s.items_dated,
    (s: StorageComplianceRecordInput) => s.no_floor_storage,
    (s: StorageComplianceRecordInput) => s.correct_shelf_positioning,
    (s: StorageComplianceRecordInput) => s.no_overcrowding,
    (s: StorageComplianceRecordInput) => s.allergen_items_segregated,
  ];

  const totalStorageChecksPossible = totalStorageChecks * storageComplianceChecks.length;
  let totalStorageChecksPassed = 0;
  for (const rec of storage_compliance_records) {
    for (const check of storageComplianceChecks) {
      if (check(rec)) totalStorageChecksPassed++;
    }
  }
  const storageComplianceRate = rate(totalStorageChecksPassed, totalStorageChecksPossible);

  const storageIssuesIdentified = storage_compliance_records.filter(
    (s) => s.issues_found.length > 0,
  ).length;
  const storageIssuesResolved = storage_compliance_records.filter(
    (s) => s.issues_found.length > 0 && s.issues_resolved,
  ).length;
  const storageIssueResolutionRate = rate(storageIssuesResolved, storageIssuesIdentified);

  const rawSeparationCompliant = storage_compliance_records.filter((s) => s.raw_separated_from_cooked).length;
  const rawSeparationRate = rate(rawSeparationCompliant, totalStorageChecks);

  const allergenSegregationCompliant = storage_compliance_records.filter((s) => s.allergen_items_segregated).length;
  const allergenSegregationRate = rate(allergenSegregationCompliant, totalStorageChecks);

  // --- Date checking metrics ---
  const totalDateChecks = date_check_records.length;

  const totalItemsChecked = date_check_records.reduce((sum, d) => sum + d.total_items_checked, 0);
  const totalItemsInDate = date_check_records.reduce((sum, d) => sum + d.items_in_date, 0);
  const totalItemsOutOfDate = date_check_records.reduce((sum, d) => sum + d.items_out_of_date, 0);
  const totalItemsRemoved = date_check_records.reduce((sum, d) => sum + d.items_removed, 0);
  const totalItemsApproachingExpiry = date_check_records.reduce((sum, d) => sum + d.items_approaching_expiry, 0);

  const dateComplianceRate = rate(totalItemsInDate, totalItemsChecked);

  const outOfDateRemovalRate = rate(totalItemsRemoved, totalItemsOutOfDate);

  const useByVisibleRecords = date_check_records.filter((d) => d.use_by_dates_visible).length;

  const fifoFollowedRecords = date_check_records.filter((d) => d.fifo_rotation_followed).length;
  const fifoRate = rate(fifoFollowedRecords, totalDateChecks);

  // Composite date checking rate: compliance + visibility + FIFO
  const dateCheckNumerator = totalItemsInDate + useByVisibleRecords + fifoFollowedRecords;
  const dateCheckDenominator = totalItemsChecked + totalDateChecks + totalDateChecks;
  const dateCheckingRate = rate(dateCheckNumerator, dateCheckDenominator);

  // --- Hygiene rating metrics ---
  const totalHygieneAssessments = hygiene_rating_records.length;

  const hygieneScoreSum = hygiene_rating_records.reduce((sum, h) => sum + (h.overall_hygiene_score ?? 0), 0);
  const avgHygieneScore =
    totalHygieneAssessments > 0
      ? Math.round((hygieneScoreSum / totalHygieneAssessments) * 100) / 100
      : null;

  const handWashingCompliant = hygiene_rating_records.filter((h) => h.hand_washing_compliance).length;
  const handWashingRate = rate(handWashingCompliant, totalHygieneAssessments);

  const cleaningScheduleFollowed = hygiene_rating_records.filter((h) => h.cleaning_schedule_followed).length;
  const cleaningScheduleRate = rate(cleaningScheduleFollowed, totalHygieneAssessments);

  const wasteDisposalCorrect = hygiene_rating_records.filter((h) => h.waste_disposal_correct).length;
  const wasteDisposalRate = rate(wasteDisposalCorrect, totalHygieneAssessments);

  const hygieneIssuesIdentified = hygiene_rating_records.filter(
    (h) => h.issues_identified.length > 0,
  ).length;
  const hygieneIssuesResolved = hygiene_rating_records.filter(
    (h) => h.issues_identified.length > 0 && h.issues_resolved,
  ).length;
  const hygieneIssueResolutionRate = rate(hygieneIssuesResolved, hygieneIssuesIdentified);

  // Composite hygiene rating rate: avg score scaled to percent
  const hygieneRatingRate = totalHygieneAssessments > 0 ? Math.round((avgHygieneScore ?? 0) * 20) : null;

  // EHO rating analysis
  const ehoInspections = hygiene_rating_records.filter((h) => h.eho_rating !== null);
  const latestEhoRating = ehoInspections.length > 0
    ? ehoInspections.sort((a, b) => b.date.localeCompare(a.date))[0].eho_rating
    : null;

  // --- Cross-contamination prevention metrics ---
  const totalCrossContamChecks = cross_contamination_records.length;

  const crossContamChecks = [
    (c: CrossContaminationRecordInput) => c.colour_coded_boards_used,
    (c: CrossContaminationRecordInput) => c.separate_utensils_raw_cooked,
    (c: CrossContaminationRecordInput) => c.allergen_separation_maintained,
    (c: CrossContaminationRecordInput) => c.hand_washing_between_tasks,
    (c: CrossContaminationRecordInput) => c.gloves_changed_appropriately,
    (c: CrossContaminationRecordInput) => c.raw_food_stored_below_cooked,
    (c: CrossContaminationRecordInput) => c.separate_prep_areas_used,
    (c: CrossContaminationRecordInput) => c.cleaning_between_tasks,
  ];

  const totalCrossContamChecksPossible = totalCrossContamChecks * crossContamChecks.length;
  let totalCrossContamChecksPassed = 0;
  for (const rec of cross_contamination_records) {
    for (const check of crossContamChecks) {
      if (check(rec)) totalCrossContamChecksPassed++;
    }
  }
  const crossContaminationRate = rate(totalCrossContamChecksPassed, totalCrossContamChecksPossible);

  const handWashingBetweenTasksRate = rate(
    cross_contamination_records.filter((c) => c.hand_washing_between_tasks).length,
    totalCrossContamChecks,
  );

  // --- Staff training metrics (derived from observation records) ---
  const trainingObservations = cross_contamination_records.filter(
    (c) => c.check_type === "training_observation",
  );

  let trainingChecksPassed = 0;
  let trainingChecksPossible = 0;
  for (const rec of trainingObservations) {
    for (const check of crossContamChecks) {
      trainingChecksPossible++;
      if (check(rec)) trainingChecksPassed++;
    }
  }
  const staffTrainingRate =
    trainingChecksPossible > 0
      ? rate(trainingChecksPassed, trainingChecksPossible)
      : (totalCrossContamChecks > 0 ? crossContaminationRate : 0);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: temperatureComplianceRate (>=95: +5, >=80: +3, >=70: +1) ---
  if (meets(temperatureComplianceRate, 95) && totalTempLogs > 0) score += 5;
  else if (meets(temperatureComplianceRate, 80) && totalTempLogs > 0) score += 3;
  else if (meets(temperatureComplianceRate, 70) && totalTempLogs > 0) score += 1;

  // --- Bonus 2: storageComplianceRate (>=90: +5, >=75: +3, >=60: +1) ---
  if (meets(storageComplianceRate, 90) && totalStorageChecks > 0) score += 5;
  else if (meets(storageComplianceRate, 75) && totalStorageChecks > 0) score += 3;
  else if (meets(storageComplianceRate, 60) && totalStorageChecks > 0) score += 1;

  // --- Bonus 3: dateCheckingRate (>=90: +4, >=70: +2) ---
  if (meets(dateCheckingRate, 90) && totalDateChecks > 0) score += 4;
  else if (meets(dateCheckingRate, 70) && totalDateChecks > 0) score += 2;

  // --- Bonus 4: hygieneRatingRate (>=90: +5, >=70: +3, >=50: +1) ---
  if ((hygieneRatingRate ?? 0) >= 90 && totalHygieneAssessments > 0) score += 5;
  else if ((hygieneRatingRate ?? 0) >= 70 && totalHygieneAssessments > 0) score += 3;
  else if ((hygieneRatingRate ?? 0) >= 50 && totalHygieneAssessments > 0) score += 1;

  // --- Bonus 5: crossContaminationRate (>=90: +5, >=75: +3, >=60: +1) ---
  if (meets(crossContaminationRate, 90) && totalCrossContamChecks > 0) score += 5;
  else if (meets(crossContaminationRate, 75) && totalCrossContamChecks > 0) score += 3;
  else if (meets(crossContaminationRate, 60) && totalCrossContamChecks > 0) score += 1;

  // --- Bonus 6: calibrationRate (>=90: +2, >=70: +1) ---
  if (meets(calibrationRate, 90) && totalTempLogs > 0) score += 2;
  else if (meets(calibrationRate, 70) && totalTempLogs > 0) score += 1;

  // --- Bonus 7: EHO rating (5: +2, 4: +1) ---
  if (latestEhoRating !== null && latestEhoRating >= 5) score += 2;
  else if (latestEhoRating !== null && latestEhoRating >= 4) score += 1;

  // Total maximum bonuses: 5+5+4+5+5+2+2 = 28

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // temperatureComplianceRate < 50 → -5 (guarded)
  if (below(temperatureComplianceRate, 50) && totalTempLogs > 0) score -= 5;

  // storageComplianceRate < 50 → -5 (guarded)
  if (below(storageComplianceRate, 50) && totalStorageChecks > 0) score -= 5;

  // crossContaminationRate < 50 → -5 (guarded)
  if (below(crossContaminationRate, 50) && totalCrossContamChecks > 0) score -= 5;

  // dateComplianceRate < 70 (high proportion out of date) → -3 (guarded)
  if (below(dateComplianceRate, 70) && totalItemsChecked > 0) score -= 3;

  score = clamp(score, 0, 100);

  const food_storage_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(temperatureComplianceRate, 95) && totalTempLogs > 0) {
    strengths.push(
      `${temperatureComplianceRate}% temperature compliance across ${uniqueAppliances} appliance${uniqueAppliances !== 1 ? "s" : ""} — fridge and freezer temperatures are consistently maintained within safe ranges, demonstrating robust temperature monitoring.`,
    );
  } else if (meets(temperatureComplianceRate, 80) && totalTempLogs > 0) {
    strengths.push(
      `${temperatureComplianceRate}% temperature compliance — the home maintains good temperature control across refrigeration equipment.`,
    );
  }

  if (meets(storageComplianceRate, 90) && totalStorageChecks > 0) {
    strengths.push(
      `${storageComplianceRate}% food storage compliance — items are correctly stored, labelled, dated, and separated, with raw/cooked segregation and allergen management consistently maintained.`,
    );
  } else if (meets(storageComplianceRate, 75) && totalStorageChecks > 0) {
    strengths.push(
      `${storageComplianceRate}% food storage compliance — the home generally maintains good storage practices with appropriate separation and labelling.`,
    );
  }

  if (meets(dateComplianceRate, 95) && totalItemsChecked > 0) {
    strengths.push(
      `${dateComplianceRate}% of food items within use-by date — the home maintains excellent date management, ensuring children are never served expired food.`,
    );
  } else if (meets(dateComplianceRate, 85) && totalItemsChecked > 0) {
    strengths.push(
      `${dateComplianceRate}% of food items within use-by date — good date management with effective stock rotation.`,
    );
  }

  if (meets(crossContaminationRate, 90) && totalCrossContamChecks > 0) {
    strengths.push(
      `${crossContaminationRate}% cross-contamination prevention compliance — colour-coded boards, separate utensils, allergen separation, and hygiene practices are consistently followed, protecting children from food-borne illness.`,
    );
  } else if (meets(crossContaminationRate, 75) && totalCrossContamChecks > 0) {
    strengths.push(
      `${crossContaminationRate}% cross-contamination prevention compliance — the home generally maintains effective separation and hygiene practices during food preparation.`,
    );
  }

  if ((hygieneRatingRate ?? 0) >= 90 && totalHygieneAssessments > 0) {
    strengths.push(
      `${hygieneRatingRate}% hygiene rating across assessments — fridges, freezers, and storage areas are consistently clean, with food handling practices meeting high standards.`,
    );
  } else if ((hygieneRatingRate ?? 0) >= 70 && totalHygieneAssessments > 0) {
    strengths.push(
      `${hygieneRatingRate}% hygiene rating — the home maintains generally good hygiene standards across food storage and preparation areas.`,
    );
  }

  if (meets(calibrationRate, 90) && totalTempLogs > 0) {
    strengths.push(
      `${calibrationRate}% thermometer calibration rate — temperature monitoring equipment is regularly calibrated, ensuring accurate readings that can be relied upon for food safety compliance.`,
    );
  } else if (meets(calibrationRate, 70) && totalTempLogs > 0) {
    strengths.push(
      `${calibrationRate}% thermometer calibration — the home generally maintains calibrated temperature monitoring equipment.`,
    );
  }

  if (meets(correctiveActionRate, 90) && tempsOutOfRange > 0) {
    strengths.push(
      `${correctiveActionRate}% corrective action taken when temperatures out of range — staff respond promptly and appropriately when refrigeration temperatures exceed safe limits.`,
    );
  } else if (meets(correctiveActionRate, 70) && tempsOutOfRange > 0) {
    strengths.push(
      `${correctiveActionRate}% corrective action rate for out-of-range temperatures — the home generally responds to temperature deviations.`,
    );
  }

  if (meets(fifoRate, 90) && totalDateChecks > 0) {
    strengths.push(
      `${fifoRate}% FIFO (first in, first out) rotation compliance — stock rotation is consistently followed, minimising waste and ensuring children eat the freshest food available.`,
    );
  } else if (meets(fifoRate, 70) && totalDateChecks > 0) {
    strengths.push(
      `${fifoRate}% FIFO rotation compliance — the home generally follows stock rotation principles.`,
    );
  }

  if (meets(outOfDateRemovalRate, 95) && totalItemsOutOfDate > 0) {
    strengths.push(
      `${outOfDateRemovalRate}% of out-of-date items removed — expired food is promptly identified and removed from storage, eliminating the risk of children consuming unsafe food.`,
    );
  } else if (meets(outOfDateRemovalRate, 80) && totalItemsOutOfDate > 0) {
    strengths.push(
      `${outOfDateRemovalRate}% of out-of-date items removed — the home generally removes expired food promptly.`,
    );
  }

  if (latestEhoRating !== null && latestEhoRating >= 5) {
    strengths.push(
      `Environmental Health Officer rating of ${latestEhoRating}/5 — the home has achieved the highest food hygiene rating, demonstrating exemplary food safety standards.`,
    );
  } else if (latestEhoRating !== null && latestEhoRating >= 4) {
    strengths.push(
      `Environmental Health Officer rating of ${latestEhoRating}/5 — the home has achieved a good food hygiene rating from its most recent inspection.`,
    );
  }

  if (meets(handWashingRate, 90) && totalHygieneAssessments > 0) {
    strengths.push(
      `${handWashingRate}% hand washing compliance — staff consistently follow hand hygiene protocols during food handling.`,
    );
  }

  if (meets(cleaningScheduleRate, 90) && totalHygieneAssessments > 0) {
    strengths.push(
      `${cleaningScheduleRate}% cleaning schedule adherence — kitchen and food storage cleaning schedules are consistently followed.`,
    );
  }

  if (meets(allergenSegregationRate, 90) && totalStorageChecks > 0) {
    strengths.push(
      `${allergenSegregationRate}% allergen segregation compliance — allergen-containing items are consistently separated and clearly identified, protecting children with allergies.`,
    );
  } else if (meets(allergenSegregationRate, 75) && totalStorageChecks > 0) {
    strengths.push(
      `${allergenSegregationRate}% allergen segregation — the home generally maintains appropriate allergen separation in food storage.`,
    );
  }

  if (meets(rawSeparationRate, 95) && totalStorageChecks > 0) {
    strengths.push(
      `${rawSeparationRate}% raw/cooked separation compliance — raw and cooked foods are consistently separated in storage, eliminating a key cross-contamination risk.`,
    );
  }

  if (meets(storageIssueResolutionRate, 90) && storageIssuesIdentified > 0) {
    strengths.push(
      `${storageIssueResolutionRate}% of storage issues resolved — identified food storage problems are addressed promptly.`,
    );
  }

  if (meets(hygieneIssueResolutionRate, 90) && hygieneIssuesIdentified > 0) {
    strengths.push(
      `${hygieneIssueResolutionRate}% of hygiene issues resolved — identified hygiene concerns are addressed and rectified promptly.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(temperatureComplianceRate, 50) && totalTempLogs > 0) {
    concerns.push(
      `Only ${temperatureComplianceRate}% of temperature readings are within safe range — the majority of fridge/freezer temperatures are outside safe limits, creating a serious food safety risk for children.`,
    );
  } else if (below(temperatureComplianceRate, 70) && meets(temperatureComplianceRate, 50) && totalTempLogs > 0) {
    concerns.push(
      `Temperature compliance at ${temperatureComplianceRate}% — a significant proportion of temperature readings fall outside safe ranges, increasing the risk of bacterial growth and food spoilage.`,
    );
  } else if (below(temperatureComplianceRate, 80) && meets(temperatureComplianceRate, 70) && totalTempLogs > 0) {
    concerns.push(
      `Temperature compliance at ${temperatureComplianceRate}% — some temperature readings are outside acceptable ranges and require attention.`,
    );
  }

  if (below(storageComplianceRate, 50) && totalStorageChecks > 0) {
    concerns.push(
      `Only ${storageComplianceRate}% food storage compliance — the majority of storage checks fail to meet required standards for separation, labelling, dating, and positioning, creating significant food safety risks.`,
    );
  } else if (below(storageComplianceRate, 70) && meets(storageComplianceRate, 50) && totalStorageChecks > 0) {
    concerns.push(
      `Food storage compliance at ${storageComplianceRate}% — inconsistent compliance with storage standards may expose children to food safety risks.`,
    );
  }

  if (below(dateComplianceRate, 70) && totalItemsChecked > 0) {
    concerns.push(
      `Only ${dateComplianceRate}% of food items within use-by date — a high proportion of food is out of date, creating a direct risk that children may consume expired and potentially unsafe food.`,
    );
  } else if (below(dateComplianceRate, 85) && meets(dateComplianceRate, 70) && totalItemsChecked > 0) {
    concerns.push(
      `Date compliance at ${dateComplianceRate}% — some food items are past their use-by date, requiring improved stock rotation and date management.`,
    );
  }

  if (below(crossContaminationRate, 50) && totalCrossContamChecks > 0) {
    concerns.push(
      `Only ${crossContaminationRate}% cross-contamination prevention compliance — fundamental food safety practices including colour-coded board use, utensil separation, and hygiene measures are not being followed, placing children at risk of food-borne illness.`,
    );
  } else if (below(crossContaminationRate, 70) && meets(crossContaminationRate, 50) && totalCrossContamChecks > 0) {
    concerns.push(
      `Cross-contamination prevention at ${crossContaminationRate}% — inconsistent adherence to separation and hygiene practices during food preparation increases contamination risk.`,
    );
  }

  if ((hygieneRatingRate ?? 0) < 50 && totalHygieneAssessments > 0) {
    concerns.push(
      `Overall hygiene rating at only ${hygieneRatingRate}% — food storage areas, fridges, and freezers are not meeting acceptable cleanliness standards, which directly impacts food safety.`,
    );
  } else if ((hygieneRatingRate ?? 0) < 70 && (hygieneRatingRate ?? 0) >= 50 && totalHygieneAssessments > 0) {
    concerns.push(
      `Hygiene rating at ${hygieneRatingRate}% — some areas of food storage and preparation do not consistently meet required hygiene standards.`,
    );
  }

  if (below(correctiveActionRate, 50) && tempsOutOfRange > 0) {
    concerns.push(
      `Only ${correctiveActionRate}% corrective action rate when temperatures are out of range — staff are not consistently responding to temperature deviations, allowing food to remain at unsafe temperatures.`,
    );
  } else if (below(correctiveActionRate, 70) && meets(correctiveActionRate, 50) && tempsOutOfRange > 0) {
    concerns.push(
      `Corrective action rate at ${correctiveActionRate}% for out-of-range temperatures — not all temperature deviations are being addressed promptly.`,
    );
  }

  if (below(outOfDateRemovalRate, 70) && totalItemsOutOfDate > 0) {
    concerns.push(
      `Only ${outOfDateRemovalRate}% of expired food items removed — out-of-date food remains in storage, creating a direct risk that children may consume unsafe food.`,
    );
  } else if (below(outOfDateRemovalRate, 90) && meets(outOfDateRemovalRate, 70) && totalItemsOutOfDate > 0) {
    concerns.push(
      `Out-of-date removal rate at ${outOfDateRemovalRate}% — some expired items are not being promptly removed from storage.`,
    );
  }

  if (below(rawSeparationRate, 70) && totalStorageChecks > 0) {
    concerns.push(
      `Raw/cooked separation compliance at only ${rawSeparationRate}% — raw and cooked foods are not consistently separated, creating a serious cross-contamination risk under Food Safety Act 1990.`,
    );
  }

  if (below(allergenSegregationRate, 70) && totalStorageChecks > 0) {
    concerns.push(
      `Allergen segregation at only ${allergenSegregationRate}% — allergen-containing items are not consistently separated, creating a risk to children with food allergies.`,
    );
  }

  if (below(handWashingRate, 70) && totalHygieneAssessments > 0) {
    concerns.push(
      `Hand washing compliance at only ${handWashingRate}% — staff are not consistently following hand hygiene protocols during food handling.`,
    );
  }

  if (below(calibrationRate, 50) && totalTempLogs > 0) {
    concerns.push(
      `Only ${calibrationRate}% thermometer calibration rate — uncalibrated thermometers may produce inaccurate readings, undermining the reliability of temperature monitoring.`,
    );
  }

  if (below(fifoRate, 50) && totalDateChecks > 0) {
    concerns.push(
      `Only ${fifoRate}% FIFO rotation compliance — stock is not being rotated correctly, increasing the risk of food expiring before use.`,
    );
  }

  if (latestEhoRating !== null && latestEhoRating <= 2) {
    concerns.push(
      `Environmental Health Officer rating of ${latestEhoRating}/5 — the home has a poor food hygiene rating from its most recent EHO inspection, requiring urgent improvement.`,
    );
  } else if (latestEhoRating !== null && latestEhoRating === 3) {
    concerns.push(
      `Environmental Health Officer rating of ${latestEhoRating}/5 — the home's food hygiene rating is only 'generally satisfactory' and improvements are needed to achieve a good rating.`,
    );
  }

  if (totalTempLogs === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No fridge or freezer temperature logs exist despite children being on placement — the home cannot evidence that refrigeration equipment is operating within safe temperature ranges.",
    );
  }

  if (totalStorageChecks === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No food storage compliance checks recorded — the home cannot evidence that food is stored safely, labelled correctly, or segregated appropriately.",
    );
  }

  if (totalDateChecks === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No use-by date checks recorded — the home cannot evidence that food within its use-by date is being served to children.",
    );
  }

  if (totalCrossContamChecks === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No cross-contamination prevention checks recorded — the home cannot evidence that measures are in place to prevent cross-contamination during food storage and preparation.",
    );
  }

  if (below(cleaningScheduleRate, 70) && totalHygieneAssessments > 0) {
    concerns.push(
      `Cleaning schedule adherence at only ${cleaningScheduleRate}% — kitchen and food storage area cleaning schedules are not being followed consistently.`,
    );
  }

  if (below(wasteDisposalRate, 70) && totalHygieneAssessments > 0) {
    concerns.push(
      `Waste disposal compliance at only ${wasteDisposalRate}% — food waste is not being disposed of correctly, which may attract pests and compromise hygiene.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: FoodStorageRecommendation[] = [];
  let rank = 0;

  if (below(temperatureComplianceRate, 50) && totalTempLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently investigate and rectify fridge/freezer temperature failures — check thermostat settings, door seals, defrost schedules, and appliance condition. Consider replacing unreliable equipment immediately to prevent food safety risks.",
      urgency: "immediate",
      regulatory_ref: "Food Safety Act 1990 — Temperature control",
    });
  }

  if (below(crossContaminationRate, 50) && totalCrossContamChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate corrective training on cross-contamination prevention — ensure all staff understand and consistently apply colour-coded chopping boards, separate utensils for raw/cooked food, allergen segregation, and hand hygiene between food handling tasks.",
      urgency: "immediate",
      regulatory_ref: "Food Safety Act 1990 — Cross-contamination",
    });
  }

  if (below(storageComplianceRate, 50) && totalStorageChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all food storage areas — ensure raw food is stored below cooked food, items are properly labelled and dated, allergens are segregated, and storage areas are not overcrowded. Implement daily storage compliance checks.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(dateComplianceRate, 70) && totalItemsChecked > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement daily use-by date checks with immediate removal of expired items — establish FIFO stock rotation, clear open date marking, and staff accountability for date management. No child should ever be served food past its use-by date.",
      urgency: "immediate",
      regulatory_ref: "Food Safety Act 1990 — Date marking",
    });
  }

  if (below(rawSeparationRate, 70) && totalStorageChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enforce strict raw/cooked food separation in all storage areas — raw meat must always be stored below and separate from ready-to-eat food to prevent bacterial contamination.",
      urgency: "immediate",
      regulatory_ref: "Food Safety Act 1990 — Cross-contamination",
    });
  }

  if (latestEhoRating !== null && latestEhoRating <= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and implement an urgent food hygiene improvement plan addressing all areas identified in the EHO inspection — a rating of " + latestEhoRating + "/5 requires significant and immediate improvement to protect children.",
      urgency: "immediate",
      regulatory_ref: "Food Safety Act 1990 — EHO inspection",
    });
  }

  if (below(allergenSegregationRate, 70) && totalStorageChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve allergen management — ensure all allergen-containing items are clearly identified, segregated in storage, and that staff understand the risks of allergen cross-contact for children with food allergies.",
      urgency: "immediate",
      regulatory_ref: "Food Safety Act 1990 — Allergen management",
    });
  }

  if (totalTempLogs === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate daily temperature logging for all fridge and freezer units — record temperatures at least twice daily using calibrated thermometers and document corrective actions for any readings outside safe ranges.",
      urgency: "immediate",
      regulatory_ref: "Food Safety Act 1990 — Temperature control",
    });
  }

  if (totalStorageChecks === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence regular food storage compliance checks covering labelling, dating, separation, shelf positioning, allergen segregation, and storage conditions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalCrossContamChecks === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement cross-contamination prevention monitoring — record routine observations of colour-coded board use, utensil separation, hand washing compliance, and cleaning between tasks.",
      urgency: "immediate",
      regulatory_ref: "Food Safety Act 1990 — Cross-contamination",
    });
  }

  if (below(correctiveActionRate, 50) && tempsOutOfRange > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all out-of-range temperature readings trigger documented corrective action — staff must know the procedure for responding to temperature failures, including assessing food safety and adjusting equipment.",
      urgency: "soon",
      regulatory_ref: "Food Safety Act 1990 — Temperature control",
    });
  }

  if (below(handWashingRate, 70) && totalHygieneAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reinforce hand washing protocols for all food handling staff — provide refresher training and ensure hand washing facilities are accessible and well-stocked at all times.",
      urgency: "soon",
      regulatory_ref: "Food Safety Act 1990 — Hygiene",
    });
  }

  if (below(calibrationRate, 50) && totalTempLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a thermometer calibration schedule — uncalibrated thermometers produce unreliable readings. Calibrate or replace equipment to ensure temperature logs are accurate and evidentially sound.",
      urgency: "soon",
      regulatory_ref: "Food Safety Act 1990 — Temperature monitoring",
    });
  }

  if (below(fifoRate, 50) && totalDateChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement and enforce FIFO (first in, first out) stock rotation across all food storage areas — train staff on rotating stock at delivery and during date checks to minimise food waste and expiry risk.",
      urgency: "soon",
      regulatory_ref: "Food Safety Act 1990 — Date management",
    });
  }

  if (
    meets(temperatureComplianceRate, 50) &&
    below(temperatureComplianceRate, 80) &&
    totalTempLogs > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve fridge and freezer temperature compliance to at least 80% — review equipment maintenance schedules, thermostat settings, and staff temperature-checking procedures.",
      urgency: "soon",
      regulatory_ref: "Food Safety Act 1990 — Temperature control",
    });
  }

  if (
    meets(storageComplianceRate, 50) &&
    below(storageComplianceRate, 75) &&
    totalStorageChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve food storage compliance through staff guidance on correct storage procedures — focus on labelling, dating, shelf positioning, and raw/cooked separation.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(crossContaminationRate, 50) &&
    below(crossContaminationRate, 75) &&
    totalCrossContamChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance cross-contamination prevention through targeted training and supervision — identify specific areas of non-compliance and provide practical guidance to staff.",
      urgency: "planned",
      regulatory_ref: "Food Safety Act 1990 — Cross-contamination",
    });
  }

  if (
    (hygieneRatingRate ?? 0) >= 50 &&
    (hygieneRatingRate ?? 0) < 70 &&
    totalHygieneAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve overall food hygiene standards — review cleaning schedules, food handling practices, and storage area cleanliness to raise the hygiene rating above 70%.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(cleaningScheduleRate, 70) && totalHygieneAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve adherence to kitchen and food storage cleaning schedules — assign clear responsibilities and conduct regular checks to ensure cleaning tasks are completed.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(outOfDateRemovalRate, 70) &&
    below(outOfDateRemovalRate, 95) &&
    totalItemsOutOfDate > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the out-of-date food removal process to achieve 95%+ — ensure every expired item is promptly removed during date checks and that removal is documented.",
      urgency: "planned",
      regulatory_ref: "Food Safety Act 1990 — Date marking",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: FoodStorageInsight[] = [];

  // -- Critical insights --

  if (below(temperatureComplianceRate, 50) && totalTempLogs > 0) {
    insights.push({
      text: `Only ${temperatureComplianceRate}% of temperature readings within safe range. Under the Food Safety Act 1990, food must be stored at temperatures that prevent bacterial growth — fridge temperatures must be between 0-5°C and freezers at -18°C or below. Persistent temperature failures create a direct risk of food-borne illness for children.`,
      severity: "critical",
    });
  }

  if (below(crossContaminationRate, 50) && totalCrossContamChecks > 0) {
    insights.push({
      text: `Only ${crossContaminationRate}% cross-contamination prevention compliance. Cross-contamination is one of the leading causes of food-borne illness. When colour-coded boards, utensil separation, and hygiene practices are not followed, children are at direct risk of bacterial contamination — this is a fundamental food safety failure.`,
      severity: "critical",
    });
  }

  if (below(storageComplianceRate, 50) && totalStorageChecks > 0) {
    insights.push({
      text: `Only ${storageComplianceRate}% food storage compliance. Incorrect food storage — including inadequate separation of raw and cooked foods, missing labels, and overcrowded storage — creates conditions for bacterial contamination and makes it impossible to trace food safety issues. This represents a Reg 25 compliance failure.`,
      severity: "critical",
    });
  }

  if (below(dateComplianceRate, 70) && totalItemsChecked > 0) {
    insights.push({
      text: `Only ${dateComplianceRate}% of food items within use-by date with ${totalItemsOutOfDate} expired items found. Serving food past its use-by date is a criminal offence under the Food Safety Act 1990. The home must implement daily date checks with immediate removal and destruction of expired items.`,
      severity: "critical",
    });
  }

  if (below(rawSeparationRate, 70) && totalStorageChecks > 0) {
    insights.push({
      text: `Raw/cooked separation compliance at only ${rawSeparationRate}%. Raw meat, poultry, and fish must always be stored below and separate from ready-to-eat food to prevent pathogenic bacteria from contaminating food that will not undergo further cooking. This is a fundamental food safety requirement.`,
      severity: "critical",
    });
  }

  if (latestEhoRating !== null && latestEhoRating <= 2) {
    insights.push({
      text: `EHO rating of ${latestEhoRating}/5. Environmental Health Officer inspections assess food hygiene standards, structural compliance, and confidence in management. A rating of ${latestEhoRating} indicates significant food safety concerns that must be urgently addressed to protect children and meet regulatory expectations.`,
      severity: "critical",
    });
  }

  if (totalTempLogs === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No fridge or freezer temperature logs exist despite children being on placement. Temperature monitoring is a legal requirement under the Food Safety Act 1990 — without logs, the home cannot demonstrate that food is stored at safe temperatures. Ofsted and Environmental Health Officers will view this absence as a serious compliance gap.",
      severity: "critical",
    });
  }

  if (totalStorageChecks === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No food storage compliance checks recorded. Without documented checks, the home cannot evidence that food is stored safely, labelled correctly, dated, or separated appropriately — these are basic food safety requirements under both Reg 25 and the Food Safety Act 1990.",
      severity: "critical",
    });
  }

  if (totalCrossContamChecks === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No cross-contamination prevention records exist. Cross-contamination prevention is a core food safety requirement — the absence of any monitoring means the home cannot evidence that colour-coded boards, utensil separation, or hygiene practices are being followed.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(temperatureComplianceRate, 50) &&
    below(temperatureComplianceRate, 80) &&
    totalTempLogs > 0
  ) {
    insights.push({
      text: `Temperature compliance at ${temperatureComplianceRate}% — improving but not yet at the level expected. Even occasional temperature deviations can allow bacterial growth to unsafe levels. Review appliance maintenance schedules and staff temperature-checking procedures.`,
      severity: "warning",
    });
  }

  if (
    meets(storageComplianceRate, 50) &&
    below(storageComplianceRate, 75) &&
    totalStorageChecks > 0
  ) {
    insights.push({
      text: `Food storage compliance at ${storageComplianceRate}% — some storage standards are not consistently met. Inconsistent labelling, dating, or separation practices increase the risk of food safety incidents and make traceability difficult during any food safety investigation.`,
      severity: "warning",
    });
  }

  if (
    meets(crossContaminationRate, 50) &&
    below(crossContaminationRate, 75) &&
    totalCrossContamChecks > 0
  ) {
    insights.push({
      text: `Cross-contamination prevention at ${crossContaminationRate}% — some food safety practices are being missed. Even occasional lapses in separation, utensil use, or hygiene can introduce pathogens to ready-to-eat food. Targeted training and supervision are needed.`,
      severity: "warning",
    });
  }

  if (
    (hygieneRatingRate ?? 0) >= 50 &&
    (hygieneRatingRate ?? 0) < 70 &&
    totalHygieneAssessments > 0
  ) {
    insights.push({
      text: `Hygiene rating at ${hygieneRatingRate}% — food storage and preparation areas are not consistently clean. Poor hygiene creates conditions for bacterial contamination and pest attraction. A structured cleaning regime with accountability is required.`,
      severity: "warning",
    });
  }

  if (
    meets(correctiveActionRate, 50) &&
    below(correctiveActionRate, 70) &&
    tempsOutOfRange > 0
  ) {
    insights.push({
      text: `Corrective action rate at ${correctiveActionRate}% for temperature deviations — some out-of-range readings are not receiving documented corrective action. Staff must understand the procedure for responding to temperature failures and the importance of recording actions taken.`,
      severity: "warning",
    });
  }

  if (
    meets(dateComplianceRate, 70) &&
    below(dateComplianceRate, 85) &&
    totalItemsChecked > 0
  ) {
    insights.push({
      text: `Date compliance at ${dateComplianceRate}% — some food items are approaching or past their use-by date. While the majority of stock is in date, any expired food in storage is unacceptable under the Food Safety Act 1990. Strengthen daily date checks and FIFO rotation.`,
      severity: "warning",
    });
  }

  if (
    meets(fifoRate, 50) &&
    below(fifoRate, 70) &&
    totalDateChecks > 0
  ) {
    insights.push({
      text: `FIFO rotation at ${fifoRate}% — stock is not always being rotated correctly. Without consistent first-in-first-out practices, food is more likely to expire before use, increasing both waste and the risk of serving out-of-date items.`,
      severity: "warning",
    });
  }

  if (
    meets(allergenSegregationRate, 50) &&
    below(allergenSegregationRate, 75) &&
    totalStorageChecks > 0
  ) {
    insights.push({
      text: `Allergen segregation at ${allergenSegregationRate}% — allergen management in storage is inconsistent. For children with food allergies, inadequate segregation can have life-threatening consequences. Review allergen storage protocols urgently.`,
      severity: "warning",
    });
  }

  if (
    meets(calibrationRate, 50) &&
    below(calibrationRate, 70) &&
    totalTempLogs > 0
  ) {
    insights.push({
      text: `Thermometer calibration at ${calibrationRate}% — not all temperature readings can be relied upon. Uncalibrated thermometers may show temperatures within range when they are actually not, creating a false sense of compliance.`,
      severity: "warning",
    });
  }

  if (totalItemsApproachingExpiry > 0 && totalDateChecks > 0) {
    const approachingPct = rate(totalItemsApproachingExpiry, totalItemsChecked);
    if (above(approachingPct, 20)) {
      insights.push({
        text: `${totalItemsApproachingExpiry} items (${approachingPct}%) approaching expiry dates. While these items are still safe, a high proportion of stock nearing its use-by date suggests purchasing or menu planning could be improved to reduce waste and ensure freshness.`,
        severity: "warning",
      });
    }
  }

  if (latestEhoRating !== null && latestEhoRating === 3) {
    insights.push({
      text: `EHO rating of 3/5 — 'generally satisfactory'. While not urgent, this rating indicates areas for improvement that, if addressed, would strengthen the home's food safety position and improve confidence in food management at Ofsted inspection.`,
      severity: "warning",
    });
  }

  // Appliance type analysis for temperature issues
  const applianceTypeIssues: Record<string, { total: number; outOfRange: number }> = {};
  for (const log of temperature_log_records) {
    const key = log.appliance_type;
    if (!applianceTypeIssues[key]) applianceTypeIssues[key] = { total: 0, outOfRange: 0 };
    applianceTypeIssues[key].total++;
    if (!log.in_range) applianceTypeIssues[key].outOfRange++;
  }

  const problematicAppliances = Object.entries(applianceTypeIssues)
    .filter(([, v]) => v.total >= 3 && above(rate(v.outOfRange, v.total), 30))
    .sort((a, b) => rate(b[1].outOfRange, b[1].total)! - rate(a[1].outOfRange, a[1].total)!);

  if (problematicAppliances.length > 0) {
    const formatted = problematicAppliances
      .map(([type, v]) => `${type.replace(/_/g, " ")} (${rate(v.outOfRange, v.total)}% out of range)`)
      .join(", ");
    insights.push({
      text: `Temperature issues by appliance type: ${formatted}. Identifying which appliances have recurring temperature problems enables targeted maintenance or replacement decisions.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (food_storage_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding food storage and refrigeration safety — temperatures are consistently monitored, food is stored correctly, date management is rigorous, hygiene standards are high, and cross-contamination prevention measures are consistently applied. This is strong evidence for Reg 25 and Food Safety Act 1990 compliance.",
      severity: "positive",
    });
  }

  if (
    meets(temperatureComplianceRate, 95) &&
    meets(calibrationRate, 90) &&
    totalTempLogs > 0
  ) {
    insights.push({
      text: `${temperatureComplianceRate}% temperature compliance with ${calibrationRate}% thermometer calibration — the combination of accurate, calibrated monitoring and consistent temperature control demonstrates exemplary refrigeration management. Children's food is stored at safe temperatures with reliable evidence to support this.`,
      severity: "positive",
    });
  }

  if (
    meets(storageComplianceRate, 90) &&
    meets(rawSeparationRate, 95) &&
    totalStorageChecks > 0
  ) {
    insights.push({
      text: `${storageComplianceRate}% storage compliance with ${rawSeparationRate}% raw/cooked separation — food is stored safely, correctly labelled, appropriately dated, and properly segregated. This level of storage management significantly reduces food safety risk.`,
      severity: "positive",
    });
  }

  if (
    meets(crossContaminationRate, 90) &&
    meets(handWashingBetweenTasksRate, 90) &&
    totalCrossContamChecks > 0
  ) {
    insights.push({
      text: `${crossContaminationRate}% cross-contamination prevention with ${handWashingBetweenTasksRate}% hand washing compliance — the home consistently applies robust food hygiene practices during preparation, including colour-coded boards, separate utensils, and thorough hygiene between tasks.`,
      severity: "positive",
    });
  }

  if (
    meets(dateComplianceRate, 95) &&
    meets(fifoRate, 90) &&
    totalDateChecks > 0
  ) {
    insights.push({
      text: `${dateComplianceRate}% date compliance with ${fifoRate}% FIFO rotation — the home manages food dates rigorously, with effective stock rotation ensuring children always receive fresh, safe food.`,
      severity: "positive",
    });
  }

  if (
    (hygieneRatingRate ?? 0) >= 90 &&
    meets(cleaningScheduleRate, 90) &&
    totalHygieneAssessments > 0
  ) {
    insights.push({
      text: `${hygieneRatingRate}% hygiene rating with ${cleaningScheduleRate}% cleaning schedule adherence — food storage and preparation areas are consistently clean and well maintained, demonstrating a strong food hygiene culture.`,
      severity: "positive",
    });
  }

  if (latestEhoRating !== null && latestEhoRating >= 5) {
    insights.push({
      text: `EHO rating of 5/5 — the home has achieved the highest Environmental Health Officer food hygiene rating. This provides strong, independent evidence that food safety management meets the highest standards and children are well protected.`,
      severity: "positive",
    });
  }

  if (
    meets(correctiveActionRate, 90) &&
    tempsOutOfRange > 0
  ) {
    insights.push({
      text: `${correctiveActionRate}% corrective action rate for temperature deviations — when temperatures fall outside safe ranges, staff consistently take and document appropriate corrective action. This demonstrates a responsive, safety-first approach to temperature management.`,
      severity: "positive",
    });
  }

  if (
    meets(storageIssueResolutionRate, 90) &&
    meets(hygieneIssueResolutionRate, 90) &&
    storageIssuesIdentified > 0 &&
    hygieneIssuesIdentified > 0
  ) {
    insights.push({
      text: `${storageIssueResolutionRate}% storage issue resolution and ${hygieneIssueResolutionRate}% hygiene issue resolution — the home consistently identifies and addresses food safety issues promptly, demonstrating a proactive approach to maintaining standards.`,
      severity: "positive",
    });
  }

  if (
    meets(allergenSegregationRate, 90) &&
    totalStorageChecks > 0
  ) {
    insights.push({
      text: `${allergenSegregationRate}% allergen segregation compliance — allergen-containing items are consistently separated and identified in storage, protecting children with food allergies. This is particularly important in a residential setting where multiple children with different dietary needs share kitchen and storage facilities.`,
      severity: "positive",
    });
  }

  if (
    meets(outOfDateRemovalRate, 95) &&
    totalItemsOutOfDate > 0
  ) {
    insights.push({
      text: `${outOfDateRemovalRate}% of expired items promptly removed — when out-of-date food is identified, it is immediately removed from storage. This ensures children are never at risk of consuming expired food and demonstrates effective food safety monitoring.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (food_storage_rating === "outstanding") {
    headline =
      "Outstanding food storage and refrigeration safety — temperatures are consistently monitored, food is stored correctly, and cross-contamination prevention measures are robustly applied.";
  } else if (food_storage_rating === "good") {
    headline = `Good food storage and refrigeration safety — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (food_storage_rating === "adequate") {
    headline = `Adequate food storage and refrigeration safety — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure food safety standards are consistently met.`;
  } else {
    headline = `Food storage and refrigeration safety is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children from food safety risks.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    food_storage_rating,
    food_storage_score: score,
    headline,
    total_temperature_logs: totalTempLogs,
    total_storage_checks: totalStorageChecks,
    total_date_checks: totalDateChecks,
    total_hygiene_assessments: totalHygieneAssessments,
    total_cross_contamination_checks: totalCrossContamChecks,
    temperature_logging_rate: temperatureLoggingRate,
    storage_compliance_rate: storageComplianceRate,
    date_checking_rate: dateCheckingRate,
    hygiene_rating_rate: hygieneRatingRate,
    cross_contamination_rate: crossContaminationRate,
    staff_training_rate: staffTrainingRate,
    temperature_log_records,
    storage_compliance_records,
    date_check_records,
    hygiene_rating_records,
    cross_contamination_records,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
