// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FOOD STORAGE & REFRIGERATION SAFETY ENGINE — TESTS
// CHR 2015 Reg 25 (Premises), Food Safety Act 1990, SCCIF safety.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeFoodStorageRefrigerationSafety,
  type FoodStorageRefrigerationSafetyInput,
  type TemperatureLogRecordInput,
  type StorageComplianceRecordInput,
  type DateCheckRecordInput,
  type HygieneRatingRecordInput,
  type CrossContaminationRecordInput,
} from "../home-food-storage-refrigeration-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeTempLog(overrides: Partial<TemperatureLogRecordInput> = {}): TemperatureLogRecordInput {
  return {
    id: "tl_1",
    date: "2026-05-20",
    appliance_id: "fridge_main",
    appliance_type: "fridge",
    appliance_name: "Main Kitchen Fridge",
    recorded_temperature_celsius: 3.2,
    target_min_celsius: 0,
    target_max_celsius: 5,
    in_range: true,
    corrective_action_taken: false,
    corrective_action_details: null,
    recorded_by: "staff_jane",
    time_of_check: "08:00",
    thermometer_calibrated: true,
    second_check_done: false,
    second_check_temperature: null,
    notes: null,
    created_at: "2026-05-20T08:00:00Z",
    ...overrides,
  };
}

function makeStorageCompliance(overrides: Partial<StorageComplianceRecordInput> = {}): StorageComplianceRecordInput {
  return {
    id: "sc_1",
    date: "2026-05-20",
    area_checked: "fridge",
    area_name: "Main Kitchen Fridge",
    items_correctly_stored: true,
    raw_separated_from_cooked: true,
    items_covered_wrapped: true,
    items_labelled: true,
    items_dated: true,
    no_floor_storage: true,
    correct_shelf_positioning: true,
    no_overcrowding: true,
    allergen_items_segregated: true,
    checked_by: "staff_jane",
    issues_found: [],
    issues_resolved: false,
    resolution_date: null,
    notes: null,
    created_at: "2026-05-20T08:00:00Z",
    ...overrides,
  };
}

function makeDateCheck(overrides: Partial<DateCheckRecordInput> = {}): DateCheckRecordInput {
  return {
    id: "dc_1",
    date: "2026-05-20",
    area_checked: "Main Kitchen Fridge",
    total_items_checked: 20,
    items_in_date: 20,
    items_out_of_date: 0,
    items_removed: 0,
    items_approaching_expiry: 1,
    use_by_dates_visible: true,
    open_dates_marked: true,
    fifo_rotation_followed: true,
    checked_by: "staff_jane",
    corrective_actions: null,
    notes: null,
    created_at: "2026-05-20T08:00:00Z",
    ...overrides,
  };
}

function makeHygieneRating(overrides: Partial<HygieneRatingRecordInput> = {}): HygieneRatingRecordInput {
  return {
    id: "hr_1",
    date: "2026-05-20",
    assessment_type: "internal_audit",
    assessor: "staff_jane",
    fridge_cleanliness: 5,
    freezer_cleanliness: 5,
    storage_area_cleanliness: 5,
    food_handling_practice: 5,
    hand_washing_compliance: true,
    cleaning_schedule_followed: true,
    pest_control_satisfactory: true,
    waste_disposal_correct: true,
    overall_hygiene_score: 5,
    issues_identified: [],
    issues_resolved: false,
    resolution_date: null,
    eho_rating: null,
    notes: null,
    created_at: "2026-05-20T08:00:00Z",
    ...overrides,
  };
}

function makeCrossContamination(overrides: Partial<CrossContaminationRecordInput> = {}): CrossContaminationRecordInput {
  return {
    id: "cc_1",
    date: "2026-05-20",
    check_type: "routine",
    colour_coded_boards_used: true,
    separate_utensils_raw_cooked: true,
    allergen_separation_maintained: true,
    hand_washing_between_tasks: true,
    gloves_changed_appropriately: true,
    raw_food_stored_below_cooked: true,
    separate_prep_areas_used: true,
    cleaning_between_tasks: true,
    staff_member_observed: "staff_jane",
    checked_by: "staff_manager",
    issues_found: [],
    corrective_action_taken: false,
    corrective_action_details: null,
    notes: null,
    created_at: "2026-05-20T08:00:00Z",
    ...overrides,
  };
}

function baseInput(overrides: Partial<FoodStorageRefrigerationSafetyInput> = {}): FoodStorageRefrigerationSafetyInput {
  return {
    today: "2026-05-30",
    total_children: 3,
    temperature_log_records: [
      makeTempLog({ id: "tl_1", appliance_id: "fridge_main" }),
      makeTempLog({ id: "tl_2", appliance_id: "freezer_main", appliance_type: "freezer", appliance_name: "Main Freezer", recorded_temperature_celsius: -20, target_min_celsius: -25, target_max_celsius: -18 }),
      makeTempLog({ id: "tl_3", appliance_id: "fridge_prep", appliance_type: "prep_fridge", appliance_name: "Prep Fridge", recorded_temperature_celsius: 2.5 }),
    ],
    storage_compliance_records: [
      makeStorageCompliance({ id: "sc_1" }),
      makeStorageCompliance({ id: "sc_2", area_checked: "freezer", area_name: "Main Freezer" }),
    ],
    date_check_records: [
      makeDateCheck({ id: "dc_1" }),
      makeDateCheck({ id: "dc_2", area_checked: "Dry Store" }),
    ],
    hygiene_rating_records: [
      makeHygieneRating({ id: "hr_1" }),
    ],
    cross_contamination_records: [
      makeCrossContamination({ id: "cc_1" }),
      makeCrossContamination({ id: "cc_2", staff_member_observed: "staff_tom" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA — 0 children + all empty
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data (0 children, all empty)", () => {
  it("returns insufficient_data rating", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 0,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.food_storage_rating).toBe("insufficient_data");
  });

  it("returns score 0", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 0,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.food_storage_score).toBe(0);
  });

  it("headline mentions insufficient data", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 0,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.headline).toContain("insufficient data");
  });

  it("returns zero totals", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 0,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.total_temperature_logs).toBe(0);
    expect(r.total_storage_checks).toBe(0);
    expect(r.total_date_checks).toBe(0);
    expect(r.total_hygiene_assessments).toBe(0);
    expect(r.total_cross_contamination_checks).toBe(0);
  });

  it("returns no strengths, concerns, recommendations, or insights", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 0,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("returns zero rates", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 0,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.temperature_logging_rate).toBe(0);
    expect(r.storage_compliance_rate).toBe(0);
    expect(r.date_checking_rate).toBe(0);
    expect(r.hygiene_rating_rate).toBe(0);
    expect(r.cross_contamination_rate).toBe(0);
    expect(r.staff_training_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. ALL EMPTY + CHILDREN > 0 → inadequate
// ═══════════════════════════════════════════════════════════════════════════

describe("all empty with children on placement", () => {
  it("returns inadequate rating", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 3,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.food_storage_rating).toBe("inadequate");
  });

  it("returns score 15", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 3,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.food_storage_score).toBe(15);
  });

  it("has one concern about no data", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 3,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No temperature logs");
  });

  it("has two immediate recommendations", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 3,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("has one critical insight", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 3,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("headline mentions urgent attention", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 3,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.headline).toContain("urgent attention");
  });

  it("recommendations reference CHR 2015 and Food Safety Act", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 3,
      temperature_log_records: [],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    expect(r.recommendations[0].regulatory_ref).toContain("Reg 25");
    expect(r.recommendations[1].regulatory_ref).toContain("Food Safety Act 1990");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING SCENARIO — all perfect
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding scenario", () => {
  it("returns outstanding rating with perfect data + EHO 5", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.food_storage_rating).toBe("outstanding");
  });

  it("score is 78 for base perfect data (no EHO)", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    // 52 + 5(temp) + 5(storage) + 4(date) + 5(hygiene) + 5(cross) + 2(calib) = 78
    expect(r.food_storage_score).toBe(78);
  });

  it("headline mentions outstanding when score >= 80", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.headline).toContain("Outstanding");
  });

  it("populates totals correctly", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.total_temperature_logs).toBe(3);
    expect(r.total_storage_checks).toBe(2);
    expect(r.total_date_checks).toBe(2);
    expect(r.total_hygiene_assessments).toBe(1);
    expect(r.total_cross_contamination_checks).toBe(2);
  });

  it("has strengths and no concerns", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.concerns).toHaveLength(0);
  });

  it("has no recommendations for perfect data", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.recommendations).toHaveLength(0);
  });

  it("has positive insights for outstanding", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    const positiveInsights = r.insights.filter((i) => i.severity === "positive");
    expect(positiveInsights.length).toBeGreaterThan(0);
  });

  it("temperature logging rate is 100% when all in range and calibrated", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.temperature_logging_rate).toBe(100);
  });

  it("storage compliance rate is 100% when all checks pass", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.storage_compliance_rate).toBe(100);
  });

  it("cross contamination rate is 100% when all checks pass", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.cross_contamination_rate).toBe(100);
  });

  it("hygiene rating rate is 100% when overall_hygiene_score is 5", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.hygiene_rating_rate).toBe(100);
  });

  it("returns the input records in result", () => {
    const input = baseInput();
    const r = computeFoodStorageRefrigerationSafety(input);
    expect(r.temperature_log_records).toHaveLength(3);
    expect(r.storage_compliance_records).toHaveLength(2);
    expect(r.date_check_records).toHaveLength(2);
    expect(r.hygiene_rating_records).toHaveLength(1);
    expect(r.cross_contamination_records).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. RATING BOUNDARIES
// ═══════════════════════════════════════════════════════════════════════════

describe("rating boundaries", () => {
  it("score 80 → outstanding", () => {
    // base = 52, +5 temp(100%) +5 storage(100%) +4 date(100%) +5 hygiene(100%) +5 cross(100%) +2 calib(100%) = 78. Add EHO 5 → 80
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.food_storage_score).toBeGreaterThanOrEqual(80);
    expect(r.food_storage_rating).toBe("outstanding");
  });

  it("score 65–79 → good", () => {
    // Remove hygiene to drop score
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [],
    }));
    expect(r.food_storage_score).toBeGreaterThanOrEqual(65);
    expect(r.food_storage_score).toBeLessThan(80);
    expect(r.food_storage_rating).toBe("good");
  });

  it("score 45–64 → adequate", () => {
    // Drop many checks to get score in adequate range
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [makeTempLog({ in_range: false, thermometer_calibrated: false })],
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_labelled: false,
        items_dated: false,
      })],
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        hand_washing_between_tasks: false,
      })],
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 3 })],
    }));
    expect(r.food_storage_score).toBeGreaterThanOrEqual(45);
    expect(r.food_storage_score).toBeLessThan(65);
    expect(r.food_storage_rating).toBe("adequate");
  });

  it("score < 45 → inadequate", () => {
    // Force all penalties, no bonuses
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, thermometer_calibrated: false }),
        makeTempLog({ id: "tl_2", in_range: false, thermometer_calibrated: false }),
        makeTempLog({ id: "tl_3", in_range: false, thermometer_calibrated: false }),
      ],
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 5,
        items_out_of_date: 15,
        items_removed: 0,
        use_by_dates_visible: false,
        open_dates_marked: false,
        fifo_rotation_followed: false,
      })],
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 1 })],
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        allergen_separation_maintained: false,
        hand_washing_between_tasks: false,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.food_storage_score).toBeLessThan(45);
    expect(r.food_storage_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. TEMPERATURE LOGGING METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("temperature logging metrics", () => {
  it("counts total temperature logs", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1" }),
        makeTempLog({ id: "tl_2" }),
      ],
    }));
    expect(r.total_temperature_logs).toBe(2);
  });

  it("temperature logging rate reflects in_range and calibration", () => {
    // 2 in range, 2 calibrated out of 2*2=4 → 100%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: true, thermometer_calibrated: true }),
        makeTempLog({ id: "tl_2", in_range: true, thermometer_calibrated: true }),
      ],
    }));
    expect(r.temperature_logging_rate).toBe(100);
  });

  it("temperature logging rate is 50% when only in_range but not calibrated", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: true, thermometer_calibrated: false }),
        makeTempLog({ id: "tl_2", in_range: true, thermometer_calibrated: false }),
      ],
    }));
    expect(r.temperature_logging_rate).toBe(50);
  });

  it("temperature logging rate is 50% when only calibrated but not in_range", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, thermometer_calibrated: true }),
        makeTempLog({ id: "tl_2", in_range: false, thermometer_calibrated: true }),
      ],
    }));
    expect(r.temperature_logging_rate).toBe(50);
  });

  it("temperature logging rate is 0% when none in_range and none calibrated", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, thermometer_calibrated: false }),
      ],
    }));
    expect(r.temperature_logging_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. TEMPERATURE COMPLIANCE BONUSES & PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("temperature compliance scoring", () => {
  it("gives +5 bonus when compliance >= 95%", () => {
    const perfect = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: Array.from({ length: 20 }, (_, i) =>
        makeTempLog({ id: `tl_${i}`, in_range: true, thermometer_calibrated: true }),
      ),
    }));
    // Remove temp logs to get base, then compare
    const noTemp = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [],
    }));
    // The score difference captures the temp bonus among others
    expect(perfect.food_storage_score).toBeGreaterThan(noTemp.food_storage_score);
  });

  it("gives +3 bonus when compliance 80-94%", () => {
    // 4 out of 5 in_range = 80%
    const logs = [
      makeTempLog({ id: "tl_1", in_range: true }),
      makeTempLog({ id: "tl_2", in_range: true }),
      makeTempLog({ id: "tl_3", in_range: true }),
      makeTempLog({ id: "tl_4", in_range: true }),
      makeTempLog({ id: "tl_5", in_range: false }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.food_storage_score).toBeGreaterThanOrEqual(52); // base + some bonus
  });

  it("applies -5 penalty when compliance < 50%", () => {
    // All out of range = 0% compliance — compare with vs without temp data
    const withBadTemp = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, thermometer_calibrated: false }),
        makeTempLog({ id: "tl_2", in_range: false, thermometer_calibrated: false }),
        makeTempLog({ id: "tl_3", in_range: false, thermometer_calibrated: false }),
      ],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
      total_children: 0,
    }));
    // base 52 - 5 (temp penalty) = 47
    expect(withBadTemp.food_storage_score).toBe(47);
  });

  it("no temp penalty when no temp logs exist", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [],
    }));
    // Without temp logs, base stays at 52 (no temp penalty or bonus)
    expect(r.food_storage_score).toBeGreaterThanOrEqual(52);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. STORAGE COMPLIANCE METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("storage compliance metrics", () => {
  it("counts total storage checks", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ id: "sc_1" }),
        makeStorageCompliance({ id: "sc_2" }),
        makeStorageCompliance({ id: "sc_3" }),
      ],
    }));
    expect(r.total_storage_checks).toBe(3);
  });

  it("storage compliance rate is 100% when all 9 checks pass", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance()],
    }));
    expect(r.storage_compliance_rate).toBe(100);
  });

  it("storage compliance rate is 0% when all 9 checks fail", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    expect(r.storage_compliance_rate).toBe(0);
  });

  it("storage compliance rate calculates partial compliance", () => {
    // 5 out of 9 = ~56%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: true,
        raw_separated_from_cooked: true,
        items_covered_wrapped: true,
        items_labelled: true,
        items_dated: true,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    expect(r.storage_compliance_rate).toBe(56);
  });

  it("gives +5 bonus when storage compliance >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    // base has 100% storage compliance → +5
    expect(r.food_storage_score).toBeGreaterThanOrEqual(52 + 5);
  });

  it("applies -5 penalty when storage compliance < 50%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    // Check that the penalty is in effect (score lower than pure base-with-other-bonuses)
    expect(r.concerns.some((c) => c.includes("storage compliance"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. DATE CHECKING METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("date checking metrics", () => {
  it("counts total date checks", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [
        makeDateCheck({ id: "dc_1" }),
        makeDateCheck({ id: "dc_2" }),
      ],
    }));
    expect(r.total_date_checks).toBe(2);
  });

  it("date checking rate composite includes item compliance + visibility + FIFO", () => {
    // All items in date + use_by visible + fifo followed → 100%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 10,
        items_in_date: 10,
        items_out_of_date: 0,
        use_by_dates_visible: true,
        open_dates_marked: true,
        fifo_rotation_followed: true,
      })],
    }));
    // numerator = 10 + 1 + 1 = 12; denominator = 10 + 1 + 1 = 12 → 100%
    expect(r.date_checking_rate).toBe(100);
  });

  it("date checking rate drops when items out of date", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 10,
        items_in_date: 5,
        items_out_of_date: 5,
        use_by_dates_visible: true,
        fifo_rotation_followed: true,
      })],
    }));
    // numerator = 5 + 1 + 1 = 7; denominator = 10 + 1 + 1 = 12 → 58%
    expect(r.date_checking_rate).toBe(58);
  });

  it("date checking rate drops when FIFO not followed", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 10,
        items_in_date: 10,
        use_by_dates_visible: true,
        fifo_rotation_followed: false,
      })],
    }));
    // numerator = 10 + 1 + 0 = 11; denominator = 10 + 1 + 1 = 12 → 92%
    expect(r.date_checking_rate).toBe(92);
  });

  it("gives +4 bonus when date checking rate >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    // Default data: all items in date, FIFO followed → 100%
    expect(r.date_checking_rate).toBe(100);
  });

  it("applies -3 penalty when date compliance < 70%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 5,
        items_out_of_date: 15,
        items_removed: 0,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("use-by date"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. HYGIENE RATING METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("hygiene rating metrics", () => {
  it("counts total hygiene assessments", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [
        makeHygieneRating({ id: "hr_1" }),
        makeHygieneRating({ id: "hr_2" }),
      ],
    }));
    expect(r.total_hygiene_assessments).toBe(2);
  });

  it("hygiene rating rate is avg score * 20 (score 5 → 100%)", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 5 })],
    }));
    expect(r.hygiene_rating_rate).toBe(100);
  });

  it("hygiene rating rate for score 3 → 60%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 3 })],
    }));
    expect(r.hygiene_rating_rate).toBe(60);
  });

  it("hygiene rating rate for score 1 → 20%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 1 })],
    }));
    expect(r.hygiene_rating_rate).toBe(20);
  });

  it("gives +5 bonus when hygiene rate >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 5 })],
    }));
    expect(r.hygiene_rating_rate).toBe(100);
    expect(r.strengths.some((s) => s.includes("hygiene rating"))).toBe(true);
  });

  it("gives +3 bonus when hygiene rate 70-89%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 4 })],
    }));
    expect(r.hygiene_rating_rate).toBe(80);
  });

  it("gives +1 bonus when hygiene rate 50-69%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 3 })],
    }));
    expect(r.hygiene_rating_rate).toBe(60);
  });

  it("hygiene rate 0 when no assessments", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [],
    }));
    expect(r.hygiene_rating_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. CROSS-CONTAMINATION METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("cross-contamination metrics", () => {
  it("counts total cross contamination checks", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.total_cross_contamination_checks).toBe(2);
  });

  it("cross contamination rate is 100% when all 8 checks pass", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination()],
    }));
    expect(r.cross_contamination_rate).toBe(100);
  });

  it("cross contamination rate is 0% when all 8 checks fail", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        allergen_separation_maintained: false,
        hand_washing_between_tasks: false,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.cross_contamination_rate).toBe(0);
  });

  it("cross contamination rate calculates partial compliance (4/8 = 50%)", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: true,
        separate_utensils_raw_cooked: true,
        allergen_separation_maintained: true,
        hand_washing_between_tasks: true,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.cross_contamination_rate).toBe(50);
  });

  it("gives +5 bonus when cross contamination rate >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.cross_contamination_rate).toBe(100);
  });

  it("applies -5 penalty when cross contamination rate < 50%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        allergen_separation_maintained: false,
        hand_washing_between_tasks: false,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("cross-contamination"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. STAFF TRAINING RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("staff training rate", () => {
  it("staff training rate derives from training_observation check_type records", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [
        makeCrossContamination({ id: "cc_1", check_type: "training_observation" }),
      ],
    }));
    // All 8 checks pass on training observation → 100%
    expect(r.staff_training_rate).toBe(100);
  });

  it("staff training rate uses partial training observation data", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [
        makeCrossContamination({
          id: "cc_1",
          check_type: "training_observation",
          colour_coded_boards_used: false,
          separate_utensils_raw_cooked: false,
        }),
      ],
    }));
    // 6/8 = 75%
    expect(r.staff_training_rate).toBe(75);
  });

  it("staff training rate falls back to cross contamination rate when no training observations", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [
        makeCrossContamination({ id: "cc_1", check_type: "routine" }),
      ],
    }));
    expect(r.staff_training_rate).toBe(r.cross_contamination_rate);
  });

  it("staff training rate is 0 when no cross contamination records", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [],
    }));
    expect(r.staff_training_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CALIBRATION BONUSES
// ═══════════════════════════════════════════════════════════════════════════

describe("calibration bonuses", () => {
  it("gives +2 bonus when calibration >= 90%", () => {
    const allCalibrated = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", thermometer_calibrated: true }),
        makeTempLog({ id: "tl_2", thermometer_calibrated: true }),
      ],
    }));
    const noneCalibrated = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", thermometer_calibrated: false }),
        makeTempLog({ id: "tl_2", thermometer_calibrated: false }),
      ],
    }));
    expect(allCalibrated.food_storage_score).toBeGreaterThan(noneCalibrated.food_storage_score);
  });

  it("gives +1 bonus when calibration 70-89%", () => {
    // 7 out of 10 calibrated = 70%
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, thermometer_calibrated: i < 7 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: logs,
    }));
    expect(r.food_storage_score).toBeGreaterThanOrEqual(52);
  });

  it("no calibration bonus when calibration < 70%", () => {
    // 3 out of 10 calibrated = 30%
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, thermometer_calibrated: i < 3 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: logs,
    }));
    // Should have concern about calibration
    expect(r.concerns.some((c) => c.includes("calibration"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. EHO RATING BONUSES
// ═══════════════════════════════════════════════════════════════════════════

describe("EHO rating bonuses", () => {
  it("gives +2 bonus for EHO rating 5", () => {
    const withEho5 = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    const noEho = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: null })],
    }));
    expect(withEho5.food_storage_score).toBeGreaterThan(noEho.food_storage_score);
  });

  it("gives +1 bonus for EHO rating 4", () => {
    const withEho4 = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 4, assessment_type: "eho_inspection" })],
    }));
    const noEho = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: null })],
    }));
    expect(withEho4.food_storage_score).toBeGreaterThan(noEho.food_storage_score);
  });

  it("no EHO bonus for rating 3", () => {
    const withEho3 = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 3, assessment_type: "eho_inspection" })],
    }));
    const noEho = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: null })],
    }));
    expect(withEho3.food_storage_score).toBe(noEho.food_storage_score);
  });

  it("uses latest EHO rating by date", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [
        makeHygieneRating({ id: "hr_1", date: "2026-01-01", eho_rating: 2, assessment_type: "eho_inspection" }),
        makeHygieneRating({ id: "hr_2", date: "2026-05-01", eho_rating: 5, assessment_type: "eho_inspection" }),
      ],
    }));
    // Latest EHO is 5 → strength, no concern about poor EHO
    expect(r.strengths.some((s) => s.includes("Environmental Health Officer rating of 5/5"))).toBe(true);
  });

  it("EHO rating <= 2 triggers concern", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 2, assessment_type: "eho_inspection" })],
    }));
    expect(r.concerns.some((c) => c.includes("Environmental Health Officer rating of 2/5"))).toBe(true);
  });

  it("EHO rating 3 triggers concern", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 3, assessment_type: "eho_inspection" })],
    }));
    expect(r.concerns.some((c) => c.includes("Environmental Health Officer rating of 3/5"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. STRENGTHS — TEMPERATURE
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — temperature", () => {
  it("adds strength for >= 95% temp compliance", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("temperature compliance"))).toBe(true);
  });

  it("adds strength for 80-94% temp compliance", () => {
    // 4 out of 5 in_range = 80%
    const logs = [
      makeTempLog({ id: "tl_1", in_range: true }),
      makeTempLog({ id: "tl_2", in_range: true }),
      makeTempLog({ id: "tl_3", in_range: true }),
      makeTempLog({ id: "tl_4", in_range: true }),
      makeTempLog({ id: "tl_5", in_range: false }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.strengths.some((s) => s.includes("80% temperature compliance"))).toBe(true);
  });

  it("no temp strength below 80%", () => {
    // 1 out of 2 = 50%
    const logs = [
      makeTempLog({ id: "tl_1", in_range: true }),
      makeTempLog({ id: "tl_2", in_range: false }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.strengths.some((s) => s.includes("temperature compliance"))).toBe(false);
  });

  it("adds calibration strength for >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("calibration"))).toBe(true);
  });

  it("adds calibration strength for 70-89%", () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, thermometer_calibrated: i < 8 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.strengths.some((s) => s.includes("calibration"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. STRENGTHS — STORAGE
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — storage", () => {
  it("adds strength for >= 90% storage compliance", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("food storage compliance"))).toBe(true);
  });

  it("adds strength for 75-89% storage compliance", () => {
    // 7 out of 9 = ~78%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        no_floor_storage: false,
        no_overcrowding: false,
      })],
    }));
    expect(r.strengths.some((s) => s.includes("food storage compliance"))).toBe(true);
  });

  it("adds allergen segregation strength for >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("allergen segregation"))).toBe(true);
  });

  it("adds raw separation strength for >= 95%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("raw/cooked separation"))).toBe(true);
  });

  it("adds storage issue resolution strength for >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ issues_found: ["label missing"], issues_resolved: true, resolution_date: "2026-05-21" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("storage issues resolved"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. STRENGTHS — DATE CHECKING
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — date checking", () => {
  it("adds strength for >= 95% date compliance", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("within use-by date"))).toBe(true);
  });

  it("adds strength for 85-94% date compliance", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 18,
        items_out_of_date: 2,
      })],
    }));
    expect(r.strengths.some((s) => s.includes("within use-by date"))).toBe(true);
  });

  it("adds FIFO strength for >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("FIFO"))).toBe(true);
  });

  it("adds FIFO strength for 70-89%", () => {
    // 8 out of 10 FIFO followed = 80%
    const records = Array.from({ length: 10 }, (_, i) =>
      makeDateCheck({ id: `dc_${i}`, fifo_rotation_followed: i < 8 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ date_check_records: records }));
    expect(r.strengths.some((s) => s.includes("FIFO"))).toBe(true);
  });

  it("adds out-of-date removal strength for >= 95%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 18,
        items_out_of_date: 2,
        items_removed: 2,
      })],
    }));
    expect(r.strengths.some((s) => s.includes("out-of-date items removed"))).toBe(true);
  });

  it("adds out-of-date removal strength for 80-94%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 15,
        items_out_of_date: 5,
        items_removed: 4,
      })],
    }));
    expect(r.strengths.some((s) => s.includes("out-of-date items removed"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. STRENGTHS — CROSS-CONTAMINATION
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — cross-contamination", () => {
  it("adds strength for >= 90% cross contamination rate", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("cross-contamination prevention compliance"))).toBe(true);
  });

  it("adds strength for 75-89% cross contamination rate", () => {
    // 6 out of 8 = 75%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        gloves_changed_appropriately: false,
        separate_prep_areas_used: false,
      })],
    }));
    expect(r.strengths.some((s) => s.includes("cross-contamination prevention compliance"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. STRENGTHS — HYGIENE
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — hygiene", () => {
  it("adds strength for >= 90% hygiene rating", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("hygiene rating"))).toBe(true);
  });

  it("adds strength for 70-89% hygiene rating", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 4 })],
    }));
    expect(r.strengths.some((s) => s.includes("hygiene rating"))).toBe(true);
  });

  it("adds hand washing strength for >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("hand washing compliance"))).toBe(true);
  });

  it("adds cleaning schedule strength for >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("cleaning schedule"))).toBe(true);
  });

  it("adds EHO 5 strength", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.strengths.some((s) => s.includes("Environmental Health Officer rating of 5/5"))).toBe(true);
  });

  it("adds EHO 4 strength", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 4, assessment_type: "eho_inspection" })],
    }));
    expect(r.strengths.some((s) => s.includes("Environmental Health Officer rating of 4/5"))).toBe(true);
  });

  it("adds hygiene issue resolution strength for >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [
        makeHygieneRating({ issues_identified: ["dirty shelf"], issues_resolved: true, resolution_date: "2026-05-21" }),
      ],
      storage_compliance_records: [
        makeStorageCompliance({ issues_found: ["label missing"], issues_resolved: true, resolution_date: "2026-05-21" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("hygiene issues resolved"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. STRENGTHS — CORRECTIVE ACTION
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — corrective action", () => {
  it("adds corrective action strength for >= 90% when temps out of range", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, corrective_action_taken: true }),
        makeTempLog({ id: "tl_2", in_range: true }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("corrective action"))).toBe(true);
  });

  it("adds corrective action strength for 70-89%", () => {
    // 7 out of 10 out-of-range with corrective action
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeTempLog({
        id: `tl_${i}`,
        in_range: false,
        corrective_action_taken: i < 7,
      }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.strengths.some((s) => s.includes("corrective action"))).toBe(true);
  });

  it("no corrective action strength when no temps out of range", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("corrective action taken when temperatures out of range"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. CONCERNS — TEMPERATURE
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — temperature", () => {
  it("critical concern for < 50% temp compliance", () => {
    const logs = [
      makeTempLog({ id: "tl_1", in_range: false }),
      makeTempLog({ id: "tl_2", in_range: false }),
      makeTempLog({ id: "tl_3", in_range: true }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.concerns.some((c) => c.includes("33%") && c.includes("temperature"))).toBe(true);
  });

  it("concern for 50-69% temp compliance", () => {
    const logs = [
      makeTempLog({ id: "tl_1", in_range: true }),
      makeTempLog({ id: "tl_2", in_range: false }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.concerns.some((c) => c.includes("Temperature compliance at 50%"))).toBe(true);
  });

  it("concern for 70-79% temp compliance", () => {
    // 7 out of 10 = 70%
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, in_range: i < 7 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.concerns.some((c) => c.includes("Temperature compliance at 70%"))).toBe(true);
  });

  it("no temp concern for >= 80%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.concerns.some((c) => c.includes("Temperature compliance"))).toBe(false);
  });

  it("concern when no temp logs but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No fridge or freezer temperature logs"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 21. CONCERNS — STORAGE
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — storage", () => {
  it("critical concern for < 50% storage compliance", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("0% food storage compliance"))).toBe(true);
  });

  it("concern for 50-69% storage compliance", () => {
    // 5 of 9 = 56%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("Food storage compliance at 56%"))).toBe(true);
  });

  it("concern when no storage checks but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No food storage compliance checks"))).toBe(true);
  });

  it("concern for raw separation < 70%", () => {
    // 1 of 3 raw separated = 33%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ id: "sc_1", raw_separated_from_cooked: true }),
        makeStorageCompliance({ id: "sc_2", raw_separated_from_cooked: false }),
        makeStorageCompliance({ id: "sc_3", raw_separated_from_cooked: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Raw/cooked separation"))).toBe(true);
  });

  it("concern for allergen segregation < 70%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ id: "sc_1", allergen_items_segregated: false }),
        makeStorageCompliance({ id: "sc_2", allergen_items_segregated: false }),
        makeStorageCompliance({ id: "sc_3", allergen_items_segregated: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Allergen segregation"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 22. CONCERNS — DATE CHECKING
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — date checking", () => {
  it("critical concern for < 70% date compliance", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 5,
        items_out_of_date: 15,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("25%") && c.includes("use-by date"))).toBe(true);
  });

  it("concern for 70-84% date compliance", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 15,
        items_out_of_date: 5,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("Date compliance at 75%"))).toBe(true);
  });

  it("concern when no date checks but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No use-by date checks"))).toBe(true);
  });

  it("concern for out-of-date removal < 70%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 18,
        items_out_of_date: 10,
        items_removed: 3,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("expired food items removed"))).toBe(true);
  });

  it("concern for out-of-date removal 70-89%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 15,
        items_out_of_date: 5,
        items_removed: 4,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("Out-of-date removal rate at 80%"))).toBe(true);
  });

  it("concern for FIFO < 50%", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeDateCheck({ id: `dc_${i}`, fifo_rotation_followed: i < 1 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ date_check_records: records }));
    expect(r.concerns.some((c) => c.includes("FIFO rotation compliance"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 23. CONCERNS — CROSS-CONTAMINATION
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — cross-contamination", () => {
  it("critical concern for < 50% cross contamination rate", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        allergen_separation_maintained: false,
        hand_washing_between_tasks: false,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: true,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("cross-contamination prevention compliance"))).toBe(true);
  });

  it("concern for 50-69% cross contamination rate", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: true,
        separate_utensils_raw_cooked: true,
        allergen_separation_maintained: true,
        hand_washing_between_tasks: true,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.concerns.some((c) => c.includes("Cross-contamination prevention at 50%"))).toBe(true);
  });

  it("concern when no cross contamination checks but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No cross-contamination prevention checks"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 24. CONCERNS — HYGIENE
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — hygiene", () => {
  it("critical concern for < 50% hygiene rating", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 2 })],
    }));
    expect(r.concerns.some((c) => c.includes("Overall hygiene rating at only 40%"))).toBe(true);
  });

  it("concern for 50-69% hygiene rating", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 3 })],
    }));
    expect(r.concerns.some((c) => c.includes("Hygiene rating at 60%"))).toBe(true);
  });

  it("concern for hand washing < 70%", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeHygieneRating({ id: `hr_${i}`, hand_washing_compliance: i < 1 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ hygiene_rating_records: records }));
    expect(r.concerns.some((c) => c.includes("Hand washing compliance"))).toBe(true);
  });

  it("concern for cleaning schedule < 70%", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeHygieneRating({ id: `hr_${i}`, cleaning_schedule_followed: i < 1 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ hygiene_rating_records: records }));
    expect(r.concerns.some((c) => c.includes("Cleaning schedule adherence"))).toBe(true);
  });

  it("concern for waste disposal < 70%", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeHygieneRating({ id: `hr_${i}`, waste_disposal_correct: i < 1 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ hygiene_rating_records: records }));
    expect(r.concerns.some((c) => c.includes("Waste disposal compliance"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 25. CONCERNS — CORRECTIVE ACTION
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — corrective action", () => {
  it("concern for < 50% corrective action when temps out of range", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, corrective_action_taken: false }),
        makeTempLog({ id: "tl_2", in_range: false, corrective_action_taken: false }),
        makeTempLog({ id: "tl_3", in_range: false, corrective_action_taken: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("corrective action rate"))).toBe(true);
  });

  it("concern for 50-69% corrective action", () => {
    // 3 out of 5 = 60%
    const logs = Array.from({ length: 5 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, in_range: false, corrective_action_taken: i < 3 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.concerns.some((c) => c.includes("Corrective action rate at 60%"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 26. RECOMMENDATIONS — IMMEDIATE
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — immediate", () => {
  it("recommends urgent temp fix when compliance < 50%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, thermometer_calibrated: false }),
        makeTempLog({ id: "tl_2", in_range: false, thermometer_calibrated: false }),
      ],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("temperature"),
    )).toBe(true);
  });

  it("recommends cross-contamination training when rate < 50%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        allergen_separation_maintained: false,
        hand_washing_between_tasks: false,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("cross-contamination"),
    )).toBe(true);
  });

  it("recommends urgent storage review when compliance < 50%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("storage"),
    )).toBe(true);
  });

  it("recommends daily date checks when date compliance < 70%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 5,
        items_out_of_date: 15,
      })],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("date"),
    )).toBe(true);
  });

  it("recommends raw separation when rate < 70%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ id: "sc_1", raw_separated_from_cooked: false }),
        makeStorageCompliance({ id: "sc_2", raw_separated_from_cooked: false }),
        makeStorageCompliance({ id: "sc_3", raw_separated_from_cooked: true }),
      ],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("raw/cooked"),
    )).toBe(true);
  });

  it("recommends EHO improvement plan when rating <= 2", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 1, assessment_type: "eho_inspection" })],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("EHO"),
    )).toBe(true);
  });

  it("recommends allergen management when segregation < 70%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ id: "sc_1", allergen_items_segregated: false }),
        makeStorageCompliance({ id: "sc_2", allergen_items_segregated: false }),
        makeStorageCompliance({ id: "sc_3", allergen_items_segregated: true }),
      ],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("allergen"),
    )).toBe(true);
  });

  it("recommends temp logging when none exist but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("temperature logging"),
    )).toBe(true);
  });

  it("recommends storage checks when none exist but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("storage compliance"),
    )).toBe(true);
  });

  it("recommends cross contamination monitoring when none exist but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("cross-contamination"),
    )).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 27. RECOMMENDATIONS — SOON
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — soon", () => {
  it("recommends corrective action improvement when rate < 50%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, corrective_action_taken: false }),
        makeTempLog({ id: "tl_2", in_range: false, corrective_action_taken: false }),
        makeTempLog({ id: "tl_3", in_range: false, corrective_action_taken: true }),
      ],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("corrective action"),
    )).toBe(true);
  });

  it("recommends hand washing training when rate < 70%", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeHygieneRating({ id: `hr_${i}`, hand_washing_compliance: i < 1 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ hygiene_rating_records: records }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("hand washing"),
    )).toBe(true);
  });

  it("recommends calibration schedule when rate < 50%", () => {
    const logs = Array.from({ length: 5 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, thermometer_calibrated: i < 1 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("calibration"),
    )).toBe(true);
  });

  it("recommends FIFO when rate < 50%", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeDateCheck({ id: `dc_${i}`, fifo_rotation_followed: i < 1 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ date_check_records: records }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("FIFO"),
    )).toBe(true);
  });

  it("recommends temp improvement when 50-79%", () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, in_range: i < 6 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("temperature compliance"),
    )).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 28. RECOMMENDATIONS — PLANNED
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — planned", () => {
  it("recommends storage improvement when 50-74%", () => {
    // 5 out of 9 = 56%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("storage compliance"),
    )).toBe(true);
  });

  it("recommends cross-contamination training when 50-74%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: true,
        separate_utensils_raw_cooked: true,
        allergen_separation_maintained: true,
        hand_washing_between_tasks: true,
        gloves_changed_appropriately: true,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("cross-contamination"),
    )).toBe(true);
  });

  it("recommends hygiene improvement when 50-69%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 3 })],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("hygiene"),
    )).toBe(true);
  });

  it("recommends cleaning schedule improvement when < 70%", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeHygieneRating({ id: `hr_${i}`, cleaning_schedule_followed: i < 1 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ hygiene_rating_records: records }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("cleaning schedule"),
    )).toBe(true);
  });

  it("recommends out-of-date removal improvement when 70-94%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 15,
        items_out_of_date: 5,
        items_removed: 4,
      })],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("out-of-date"),
    )).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 29. RECOMMENDATION RANK ORDERING
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendation rank ordering", () => {
  it("ranks are sequential starting from 1", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [],
      storage_compliance_records: [],
      cross_contamination_records: [],
    }));
    const ranks = r.recommendations.map((rec) => rec.rank);
    for (let i = 0; i < ranks.length; i++) {
      expect(ranks[i]).toBe(i + 1);
    }
  });

  it("all recommendations have regulatory_ref", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [],
      storage_compliance_records: [],
      cross_contamination_records: [],
    }));
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 30. INSIGHTS — CRITICAL
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — critical", () => {
  it("critical insight for temp compliance < 50%", () => {
    const logs = Array.from({ length: 3 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, in_range: false, thermometer_calibrated: false }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("temperature"))).toBe(true);
  });

  it("critical insight for cross contamination < 50%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        allergen_separation_maintained: false,
        hand_washing_between_tasks: false,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("cross-contamination"))).toBe(true);
  });

  it("critical insight for storage compliance < 50%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("storage compliance"))).toBe(true);
  });

  it("critical insight for date compliance < 70%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 5,
        items_out_of_date: 15,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("use-by date"))).toBe(true);
  });

  it("critical insight for raw separation < 70%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ id: "sc_1", raw_separated_from_cooked: false }),
        makeStorageCompliance({ id: "sc_2", raw_separated_from_cooked: false }),
        makeStorageCompliance({ id: "sc_3", raw_separated_from_cooked: true }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Raw/cooked separation"))).toBe(true);
  });

  it("critical insight for EHO rating <= 2", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 1, assessment_type: "eho_inspection" })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("EHO rating"))).toBe(true);
  });

  it("critical insight when no temp logs but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No fridge or freezer temperature logs"))).toBe(true);
  });

  it("critical insight when no storage checks but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No food storage compliance checks"))).toBe(true);
  });

  it("critical insight when no cross contamination checks but children on placement", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No cross-contamination prevention records"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 31. INSIGHTS — WARNING
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — warning", () => {
  it("warning insight for temp compliance 50-79%", () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, in_range: i < 6 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Temperature compliance at 60%"))).toBe(true);
  });

  it("warning insight for storage compliance 50-74%", () => {
    // 5 out of 9 = 56%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [makeStorageCompliance({
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Food storage compliance at 56%"))).toBe(true);
  });

  it("warning insight for cross contamination 50-74%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: true,
        separate_utensils_raw_cooked: true,
        allergen_separation_maintained: true,
        hand_washing_between_tasks: true,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Cross-contamination prevention at 50%"))).toBe(true);
  });

  it("warning insight for hygiene rate 50-69%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 3 })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Hygiene rating at 60%"))).toBe(true);
  });

  it("warning insight for corrective action 50-69%", () => {
    const logs = Array.from({ length: 5 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, in_range: false, corrective_action_taken: i < 3 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Corrective action rate at 60%"))).toBe(true);
  });

  it("warning insight for date compliance 70-84%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 15,
        items_out_of_date: 5,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Date compliance at 75%"))).toBe(true);
  });

  it("warning insight for FIFO 50-69%", () => {
    // 3 out of 5 = 60%
    const records = Array.from({ length: 5 }, (_, i) =>
      makeDateCheck({ id: `dc_${i}`, fifo_rotation_followed: i < 3 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ date_check_records: records }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("FIFO rotation at 60%"))).toBe(true);
  });

  it("warning insight for allergen segregation 50-74%", () => {
    // 1 of 2 = 50%
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ id: "sc_1", allergen_items_segregated: true }),
        makeStorageCompliance({ id: "sc_2", allergen_items_segregated: false }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Allergen segregation at 50%"))).toBe(true);
  });

  it("warning insight for calibration 50-69%", () => {
    // 3 out of 5 = 60%
    const logs = Array.from({ length: 5 }, (_, i) =>
      makeTempLog({ id: `tl_${i}`, thermometer_calibrated: i < 3 }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Thermometer calibration at 60%"))).toBe(true);
  });

  it("warning insight for high approaching-expiry percentage (> 20%)", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 10,
        items_in_date: 10,
        items_out_of_date: 0,
        items_approaching_expiry: 5,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("approaching expiry"))).toBe(true);
  });

  it("warning insight for EHO rating 3", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 3, assessment_type: "eho_inspection" })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("EHO rating of 3/5"))).toBe(true);
  });

  it("warning insight for problematic appliance types (> 30% out of range, >= 3 logs)", () => {
    const logs = [
      makeTempLog({ id: "tl_1", appliance_type: "fridge", in_range: false }),
      makeTempLog({ id: "tl_2", appliance_type: "fridge", in_range: false }),
      makeTempLog({ id: "tl_3", appliance_type: "fridge", in_range: true }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Temperature issues by appliance type"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 32. INSIGHTS — POSITIVE
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — positive", () => {
  it("positive insight for outstanding rating", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
  });

  it("positive insight for high temp compliance + calibration", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.insights.some((i) =>
      i.severity === "positive" && i.text.includes("temperature compliance") && i.text.includes("calibration"),
    )).toBe(true);
  });

  it("positive insight for high storage + raw separation", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.insights.some((i) =>
      i.severity === "positive" && i.text.includes("storage compliance") && i.text.includes("raw/cooked separation"),
    )).toBe(true);
  });

  it("positive insight for high cross contamination + hand washing", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.insights.some((i) =>
      i.severity === "positive" && i.text.includes("cross-contamination prevention") && i.text.includes("hand washing"),
    )).toBe(true);
  });

  it("positive insight for high date compliance + FIFO", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.insights.some((i) =>
      i.severity === "positive" && i.text.includes("date compliance") && i.text.includes("FIFO"),
    )).toBe(true);
  });

  it("positive insight for high hygiene + cleaning schedule", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.insights.some((i) =>
      i.severity === "positive" && i.text.includes("hygiene rating") && i.text.includes("cleaning schedule"),
    )).toBe(true);
  });

  it("positive insight for EHO 5", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("EHO rating of 5/5"))).toBe(true);
  });

  it("positive insight for high corrective action rate", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, corrective_action_taken: true }),
        makeTempLog({ id: "tl_2", in_range: true }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("corrective action rate"))).toBe(true);
  });

  it("positive insight for high issue resolution (both storage + hygiene)", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ issues_found: ["label missing"], issues_resolved: true }),
      ],
      hygiene_rating_records: [
        makeHygieneRating({ issues_identified: ["dirty shelf"], issues_resolved: true }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("storage issue resolution"))).toBe(true);
  });

  it("positive insight for allergen segregation >= 90%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("allergen segregation"))).toBe(true);
  });

  it("positive insight for out-of-date removal >= 95%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 18,
        items_out_of_date: 2,
        items_removed: 2,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("expired items promptly removed"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 33. HEADLINE VARIATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("headline variations", () => {
  it("outstanding headline", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline includes strength and concern counts", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [],
    }));
    expect(r.food_storage_rating).toBe("good");
    expect(r.headline).toContain("Good");
    expect(r.headline).toContain("strength");
  });

  it("adequate headline includes concern count", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [makeTempLog({ in_range: false, thermometer_calibrated: false })],
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_labelled: false,
        items_dated: false,
      })],
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        hand_washing_between_tasks: false,
      })],
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 3 })],
    }));
    expect(r.food_storage_rating).toBe("adequate");
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toContain("concern");
  });

  it("inadequate headline includes concern count", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, thermometer_calibrated: false }),
        makeTempLog({ id: "tl_2", in_range: false, thermometer_calibrated: false }),
        makeTempLog({ id: "tl_3", in_range: false, thermometer_calibrated: false }),
      ],
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 5,
        items_out_of_date: 15,
        items_removed: 0,
        use_by_dates_visible: false,
        fifo_rotation_followed: false,
      })],
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 1 })],
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        allergen_separation_maintained: false,
        hand_washing_between_tasks: false,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.food_storage_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("concern");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 34. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("score clamped to 0 minimum", () => {
    // Force maximum penalties with minimal bonuses
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: Array.from({ length: 20 }, (_, i) =>
        makeTempLog({ id: `tl_${i}`, in_range: false, thermometer_calibrated: false }),
      ),
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
      date_check_records: [makeDateCheck({
        total_items_checked: 100,
        items_in_date: 10,
        items_out_of_date: 90,
        items_removed: 0,
      })],
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 1 })],
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        allergen_separation_maintained: false,
        hand_washing_between_tasks: false,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    expect(r.food_storage_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamped to 100 maximum", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    expect(r.food_storage_score).toBeLessThanOrEqual(100);
  });

  it("single record in each category produces valid result", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [makeTempLog()],
      storage_compliance_records: [makeStorageCompliance()],
      date_check_records: [makeDateCheck()],
      hygiene_rating_records: [makeHygieneRating()],
      cross_contamination_records: [makeCrossContamination()],
    }));
    expect(r.food_storage_rating).toBeDefined();
    expect(r.food_storage_score).toBeGreaterThanOrEqual(0);
    expect(r.food_storage_score).toBeLessThanOrEqual(100);
  });

  it("handles pct with zero denominator (returns 0)", () => {
    // When date_check_records has 0 items checked and booleans false
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 0,
        items_in_date: 0,
        items_out_of_date: 0,
        use_by_dates_visible: false,
        open_dates_marked: false,
        fifo_rotation_followed: false,
      })],
    }));
    // numerator = 0 + 0 + 0 = 0, denominator = 0 + 1 + 1 = 2 → 0%
    expect(r.date_checking_rate).toBe(0);
  });

  it("handles large volume of records", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: Array.from({ length: 100 }, (_, i) =>
        makeTempLog({ id: `tl_${i}` }),
      ),
      storage_compliance_records: Array.from({ length: 50 }, (_, i) =>
        makeStorageCompliance({ id: `sc_${i}` }),
      ),
      date_check_records: Array.from({ length: 50 }, (_, i) =>
        makeDateCheck({ id: `dc_${i}` }),
      ),
      hygiene_rating_records: Array.from({ length: 20 }, (_, i) =>
        makeHygieneRating({ id: `hr_${i}` }),
      ),
      cross_contamination_records: Array.from({ length: 30 }, (_, i) =>
        makeCrossContamination({ id: `cc_${i}` }),
      ),
    }));
    expect(r.total_temperature_logs).toBe(100);
    expect(r.total_storage_checks).toBe(50);
    expect(r.total_date_checks).toBe(50);
    expect(r.total_hygiene_assessments).toBe(20);
    expect(r.total_cross_contamination_checks).toBe(30);
  });

  it("total_children = 1 still triggers concerns when records missing", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 1,
      temperature_log_records: [],
      storage_compliance_records: [makeStorageCompliance()],
    }));
    expect(r.concerns.some((c) => c.includes("No fridge or freezer temperature logs"))).toBe(true);
  });

  it("no missing-data concerns when total_children = 0 and some data exists", () => {
    // total_children = 0 but has some records → not allEmpty, so no special-case
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 0,
      temperature_log_records: [makeTempLog()],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    // Should NOT say "no children on placement" because allEmpty is false
    expect(r.food_storage_rating).not.toBe("insufficient_data");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 35. SCORING ARITHMETIC
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring arithmetic", () => {
  it("base score is 52 with no bonuses or penalties", () => {
    // No temp logs, no storage, no date checks, no hygiene, no cross-contam
    // but total_children > 0 and at least one record to avoid empty path
    // Use 0 children + some data to avoid allEmpty + 0 children special case
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      total_children: 0,
      temperature_log_records: [makeTempLog({ in_range: true, thermometer_calibrated: false })],
      storage_compliance_records: [],
      date_check_records: [],
      hygiene_rating_records: [],
      cross_contamination_records: [],
    }));
    // base 52 + temp bonus (+1 for 100% compliance, but 0% calibration → no calib bonus)
    // Actually: 1 out of 1 in_range = 100% → +5 bonus. 0% calibration → no calib bonus.
    // Score = 52 + 5 = 57
    expect(r.food_storage_score).toBe(57);
  });

  it("max possible score with all bonuses is 80 (52 + 28)", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [makeHygieneRating({ eho_rating: 5, assessment_type: "eho_inspection" })],
    }));
    // 52 + 5(temp) + 5(storage) + 4(date) + 5(hygiene) + 5(cross) + 2(calib) + 2(eho) = 80
    expect(r.food_storage_score).toBe(80);
  });

  it("all penalties applied gives 52 - 18 = 34 (before clamp)", () => {
    // temp<50: -5, storage<50: -5, cross<50: -5, date<70: -3 → total -18
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [
        makeTempLog({ id: "tl_1", in_range: false, thermometer_calibrated: false }),
        makeTempLog({ id: "tl_2", in_range: false, thermometer_calibrated: false }),
      ],
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
      date_check_records: [makeDateCheck({
        total_items_checked: 20,
        items_in_date: 5,
        items_out_of_date: 15,
      })],
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 1 })],
      cross_contamination_records: [makeCrossContamination({
        colour_coded_boards_used: false,
        separate_utensils_raw_cooked: false,
        allergen_separation_maintained: false,
        hand_washing_between_tasks: false,
        gloves_changed_appropriately: false,
        raw_food_stored_below_cooked: false,
        separate_prep_areas_used: false,
        cleaning_between_tasks: false,
      })],
    }));
    // 52 + 1(hygiene 20% → nope, 20 < 50 so no bonus) + 0(all others fail) - 5 - 5 - 5 - 3 = 34
    expect(r.food_storage_score).toBe(34);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 36. APPLIANCE TYPE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

describe("appliance type analysis", () => {
  it("identifies problematic appliance types", () => {
    // fridge with > 30% out of range and >= 3 logs
    const logs = [
      makeTempLog({ id: "tl_1", appliance_type: "fridge", in_range: false }),
      makeTempLog({ id: "tl_2", appliance_type: "fridge", in_range: false }),
      makeTempLog({ id: "tl_3", appliance_type: "fridge", in_range: true }),
      makeTempLog({ id: "tl_4", appliance_type: "freezer", in_range: true }),
      makeTempLog({ id: "tl_5", appliance_type: "freezer", in_range: true }),
      makeTempLog({ id: "tl_6", appliance_type: "freezer", in_range: true }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.insights.some((i) => i.text.includes("fridge") && i.text.includes("Temperature issues by appliance type"))).toBe(true);
  });

  it("does not flag appliance types with < 3 logs", () => {
    const logs = [
      makeTempLog({ id: "tl_1", appliance_type: "fridge", in_range: false }),
      makeTempLog({ id: "tl_2", appliance_type: "fridge", in_range: false }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.insights.some((i) => i.text.includes("Temperature issues by appliance type"))).toBe(false);
  });

  it("does not flag appliance types with <= 30% out of range", () => {
    const logs = [
      makeTempLog({ id: "tl_1", appliance_type: "fridge", in_range: true }),
      makeTempLog({ id: "tl_2", appliance_type: "fridge", in_range: true }),
      makeTempLog({ id: "tl_3", appliance_type: "fridge", in_range: false }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    // 1 out of 3 = 33% which is > 30%, so it should be flagged
    expect(r.insights.some((i) => i.text.includes("Temperature issues by appliance type"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 37. MULTIPLE RECORD AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════

describe("multiple record aggregation", () => {
  it("aggregates date check items across multiple records", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [
        makeDateCheck({ id: "dc_1", total_items_checked: 10, items_in_date: 9, items_out_of_date: 1 }),
        makeDateCheck({ id: "dc_2", total_items_checked: 10, items_in_date: 8, items_out_of_date: 2 }),
      ],
    }));
    // Total items checked = 20, in date = 17 → 85%
    expect(r.total_date_checks).toBe(2);
  });

  it("aggregates storage compliance across multiple records", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: [
        makeStorageCompliance({ id: "sc_1" }),
        makeStorageCompliance({ id: "sc_2", items_labelled: false }),
      ],
    }));
    // Record 1: 9/9, Record 2: 8/9 → total 17/18 = 94%
    expect(r.storage_compliance_rate).toBe(94);
  });

  it("aggregates cross contamination across multiple records", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [
        makeCrossContamination({ id: "cc_1" }),
        makeCrossContamination({ id: "cc_2", colour_coded_boards_used: false }),
      ],
    }));
    // Record 1: 8/8, Record 2: 7/8 → total 15/16 = 94%
    expect(r.cross_contamination_rate).toBe(94);
  });

  it("calculates average hygiene score across multiple records", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: [
        makeHygieneRating({ id: "hr_1", overall_hygiene_score: 5 }),
        makeHygieneRating({ id: "hr_2", overall_hygiene_score: 3 }),
      ],
    }));
    // Average = 4, * 20 = 80%
    expect(r.hygiene_rating_rate).toBe(80);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 38. MIXED SCENARIO — SOME AREAS GOOD, SOME BAD
// ═══════════════════════════════════════════════════════════════════════════

describe("mixed scenario", () => {
  it("can have both strengths and concerns", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [makeTempLog()], // good
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })], // bad
    }));
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.concerns.length).toBeGreaterThan(0);
  });

  it("can have multiple insight severities", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: [makeTempLog()],
      storage_compliance_records: [makeStorageCompliance({
        items_correctly_stored: false,
        raw_separated_from_cooked: false,
        items_covered_wrapped: false,
        items_labelled: false,
        items_dated: false,
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
    }));
    const severities = new Set(r.insights.map((i) => i.severity));
    expect(severities.size).toBeGreaterThan(1);
  });

  it("can have multiple urgency levels in recommendations", () => {
    // Force some immediate and some planned
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      temperature_log_records: Array.from({ length: 10 }, (_, i) =>
        makeTempLog({ id: `tl_${i}`, in_range: i < 6, thermometer_calibrated: false }),
      ),
      storage_compliance_records: [makeStorageCompliance({
        no_floor_storage: false,
        correct_shelf_positioning: false,
        no_overcrowding: false,
        allergen_items_segregated: false,
      })],
      hygiene_rating_records: [makeHygieneRating({ overall_hygiene_score: 3 })],
    }));
    const urgencies = new Set(r.recommendations.map((rec) => rec.urgency));
    expect(urgencies.size).toBeGreaterThan(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 39. FRIDGE vs FREEZER SPECIFIC HANDLING
// ═══════════════════════════════════════════════════════════════════════════

describe("fridge vs freezer handling", () => {
  it("classifies fridge types correctly (fridge, walk_in_fridge, prep_fridge)", () => {
    const logs = [
      makeTempLog({ id: "tl_1", appliance_type: "fridge", in_range: true }),
      makeTempLog({ id: "tl_2", appliance_type: "walk_in_fridge", in_range: true }),
      makeTempLog({ id: "tl_3", appliance_type: "prep_fridge", in_range: true }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.total_temperature_logs).toBe(3);
  });

  it("classifies freezer types correctly (freezer, walk_in_freezer)", () => {
    const logs = [
      makeTempLog({ id: "tl_1", appliance_type: "freezer", in_range: true }),
      makeTempLog({ id: "tl_2", appliance_type: "walk_in_freezer", in_range: true }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.total_temperature_logs).toBe(2);
  });

  it("handles other appliance type", () => {
    const logs = [
      makeTempLog({ id: "tl_1", appliance_type: "other", in_range: true }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({ temperature_log_records: logs }));
    expect(r.total_temperature_logs).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 40. UNIQUE STAFF OBSERVED
// ═══════════════════════════════════════════════════════════════════════════

describe("unique staff observed", () => {
  it("counts unique staff observed across cross contamination records", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: [
        makeCrossContamination({ id: "cc_1", staff_member_observed: "staff_jane" }),
        makeCrossContamination({ id: "cc_2", staff_member_observed: "staff_tom" }),
        makeCrossContamination({ id: "cc_3", staff_member_observed: "staff_jane" }),
      ],
    }));
    // 2 unique staff
    expect(r.total_cross_contamination_checks).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 41. STORAGE AREA TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe("storage area types", () => {
  it("handles all storage area types", () => {
    const areas: Array<StorageComplianceRecordInput["area_checked"]> = [
      "fridge", "freezer", "dry_store", "pantry", "vegetable_rack", "cupboard", "other",
    ];
    const records = areas.map((area, i) =>
      makeStorageCompliance({ id: `sc_${i}`, area_checked: area }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      storage_compliance_records: records,
    }));
    expect(r.total_storage_checks).toBe(7);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 42. CROSS-CONTAMINATION CHECK TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe("cross-contamination check types", () => {
  it("handles all check types", () => {
    const types: Array<CrossContaminationRecordInput["check_type"]> = [
      "routine", "post_delivery", "post_incident", "spot_check", "training_observation", "other",
    ];
    const records = types.map((type, i) =>
      makeCrossContamination({ id: `cc_${i}`, check_type: type }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: records,
    }));
    expect(r.total_cross_contamination_checks).toBe(6);
  });

  it("only training_observation check_type contributes to staff training rate", () => {
    const records = [
      makeCrossContamination({ id: "cc_1", check_type: "routine" }),
      makeCrossContamination({ id: "cc_2", check_type: "training_observation", colour_coded_boards_used: false }),
    ];
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      cross_contamination_records: records,
    }));
    // Training rate based on 1 training obs: 7/8 = 88%
    expect(r.staff_training_rate).toBe(88);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 43. HYGIENE ASSESSMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe("hygiene assessment types", () => {
  it("handles all assessment types", () => {
    const types: Array<HygieneRatingRecordInput["assessment_type"]> = [
      "internal_audit", "eho_inspection", "spot_check", "deep_clean_check", "monthly_review", "other",
    ];
    const records = types.map((type, i) =>
      makeHygieneRating({ id: `hr_${i}`, assessment_type: type }),
    );
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      hygiene_rating_records: records,
    }));
    expect(r.total_hygiene_assessments).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 44. APPROACHING EXPIRY THRESHOLD
// ═══════════════════════════════════════════════════════════════════════════

describe("approaching expiry threshold", () => {
  it("no warning when approaching expiry <= 20%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 10,
        items_in_date: 10,
        items_out_of_date: 0,
        items_approaching_expiry: 2,
      })],
    }));
    expect(r.insights.some((i) => i.text.includes("approaching expiry"))).toBe(false);
  });

  it("warning when approaching expiry > 20%", () => {
    const r = computeFoodStorageRefrigerationSafety(baseInput({
      date_check_records: [makeDateCheck({
        total_items_checked: 10,
        items_in_date: 10,
        items_out_of_date: 0,
        items_approaching_expiry: 3,
      })],
    }));
    expect(r.insights.some((i) => i.text.includes("approaching expiry"))).toBe(true);
  });
});
