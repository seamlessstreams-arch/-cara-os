// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ELECTRICITY & GAS SAFETY INTELLIGENCE ENGINE — TESTS
// Reg 25: "The premises standard — electrical and gas safety."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeElectricityGasSafety,
  type ElectricityGasSafetyInput,
  type PatTestingInput,
  type GasCertificateInput,
  type ElectricalInspectionInput,
  type CoDetectorInput,
  type ChildSafetyInput,
} from "../home-electricity-gas-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-30";

function makePat(overrides: Partial<PatTestingInput> = {}): PatTestingInput {
  return {
    id: "pat_1",
    appliance_id: "app_1",
    appliance_name: "Kettle",
    appliance_location: "Kitchen",
    appliance_category: "portable",
    test_date: "2026-04-01",
    next_test_due: "2027-04-01",
    test_overdue: false,
    result: "pass",
    tester_name: "John Smith",
    tester_qualified: true,
    visual_inspection_passed: true,
    earth_continuity_passed: true,
    insulation_resistance_passed: true,
    polarity_correct: true,
    label_attached: true,
    defect_found: false,
    defect_description: null,
    defect_resolved: false,
    removed_from_service: false,
    risk_rating: "low",
    child_accessible: false,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeGas(overrides: Partial<GasCertificateInput> = {}): GasCertificateInput {
  return {
    id: "gas_1",
    certificate_type: "cp12",
    appliance_name: "Boiler",
    appliance_location: "Utility Room",
    engineer_name: "Gas Engineer Ltd",
    gas_safe_registration: "123456",
    inspection_date: "2026-03-01",
    expiry_date: "2027-03-01",
    expired: false,
    result: "satisfactory",
    defects_found: false,
    defect_description: null,
    defect_rectified: false,
    warning_notice_issued: false,
    flue_checked: true,
    ventilation_adequate: true,
    gas_tightness_tested: true,
    operating_pressure_correct: true,
    safety_device_operational: true,
    co_reading_acceptable: true,
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeElectrical(overrides: Partial<ElectricalInspectionInput> = {}): ElectricalInspectionInput {
  return {
    id: "elec_1",
    inspection_type: "eicr",
    area_inspected: "Whole property",
    inspector_name: "Sparks Electrical",
    inspector_qualified: true,
    inspection_date: "2026-02-01",
    next_inspection_due: "2031-02-01",
    inspection_overdue: false,
    result: "satisfactory",
    c1_defects: 0,
    c2_defects: 0,
    c3_defects: 0,
    fi_defects: 0,
    defects_rectified: 0,
    total_defects: 0,
    all_defects_resolved: true,
    distribution_board_satisfactory: true,
    earthing_satisfactory: true,
    bonding_satisfactory: true,
    rcd_tested: true,
    rcd_operating_correctly: true,
    certificate_issued: true,
    created_at: "2026-02-01",
    ...overrides,
  };
}

function makeCo(overrides: Partial<CoDetectorInput> = {}): CoDetectorInput {
  return {
    id: "co_1",
    detector_location: "Kitchen",
    detector_type: "sealed_battery",
    install_date: "2025-01-01",
    expiry_date: "2030-01-01",
    expired: false,
    last_test_date: "2026-05-01",
    test_overdue: false,
    test_result: "pass",
    battery_status: "good",
    near_gas_appliance: true,
    near_sleeping_area: true,
    audible_from_bedrooms: true,
    functioning: true,
    replacement_due: false,
    positioned_correctly: true,
    child_aware_of_alarm: true,
    last_activation_date: null,
    false_alarm_count: 0,
    created_at: "2025-01-01",
    ...overrides,
  };
}

function makeChildSafety(overrides: Partial<ChildSafetyInput> = {}): ChildSafetyInput {
  return {
    id: "cs_1",
    child_id: "yp_1",
    child_name: "Jordan",
    awareness_type: "electrical_safety",
    assessment_date: "2026-04-15",
    assessed_by: "staff_darren",
    knowledge_score: 8,
    practical_demonstration: true,
    can_identify_hazards: true,
    knows_emergency_procedure: true,
    knows_how_to_report: true,
    age_appropriate_understanding: true,
    review_date: "2026-10-15",
    review_overdue: false,
    additional_support_needed: false,
    support_provided: false,
    child_engaged_in_session: true,
    created_at: "2026-04-15",
    ...overrides,
  };
}

function baseInput(overrides: Partial<ElectricityGasSafetyInput> = {}): ElectricityGasSafetyInput {
  return {
    today: TODAY,
    total_children: 3,
    total_staff: 10,
    pat_testing_records: [],
    gas_certificate_records: [],
    electrical_inspection_records: [],
    co_detector_records: [],
    child_safety_records: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. OUTPUT SHAPE
// ═══════════════════════════════════════════════════════════════════════════

describe("output shape", () => {
  it("returns all required top-level fields", () => {
    const r = computeElectricityGasSafety(baseInput());
    expect(r).toHaveProperty("electrical_rating");
    expect(r).toHaveProperty("electrical_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_appliances_tested");
    expect(r).toHaveProperty("pat_testing_rate");
    expect(r).toHaveProperty("gas_certificate_rate");
    expect(r).toHaveProperty("electrical_inspection_rate");
    expect(r).toHaveProperty("co_detector_rate");
    expect(r).toHaveProperty("child_safety_rate");
    expect(r).toHaveProperty("staff_training_rate");
    expect(r).toHaveProperty("pat_pass_rate");
    expect(r).toHaveProperty("gas_satisfactory_rate");
    expect(r).toHaveProperty("electrical_satisfactory_rate");
    expect(r).toHaveProperty("co_functioning_rate");
    expect(r).toHaveProperty("defect_resolution_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("strengths, concerns, recommendations, insights are arrays", () => {
    const r = computeElectricityGasSafety(baseInput());
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.concerns)).toBe(true);
    expect(Array.isArray(r.recommendations)).toBe(true);
    expect(Array.isArray(r.insights)).toBe(true);
  });

  it("electrical_score is between 0 and 100", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
      gas_certificate_records: [makeGas()],
    }));
    expect(r.electrical_score).toBeGreaterThanOrEqual(0);
    expect(r.electrical_score).toBeLessThanOrEqual(100);
  });

  it("all rate fields are between 0 and 100", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
      co_detector_records: [makeCo()],
      child_safety_records: [makeChildSafety()],
    }));
    for (const key of [
      "pat_testing_rate", "gas_certificate_rate", "electrical_inspection_rate",
      "co_detector_rate", "child_safety_rate", "staff_training_rate",
      "pat_pass_rate", "gas_satisfactory_rate", "electrical_satisfactory_rate",
      "co_functioning_rate", "defect_resolution_rate",
    ] as const) {
      expect(r[key]).toBeGreaterThanOrEqual(0);
      expect(r[key]).toBeLessThanOrEqual(100);
    }
  });

  it("rating is a valid value", () => {
    const r = computeElectricityGasSafety(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.electrical_rating);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when all arrays empty and 0 children", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 0 }));
    expect(r.electrical_rating).toBe("insufficient_data");
    expect(r.electrical_score).toBe(0);
  });

  it("returns headline about insufficient data when no children", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 0 }));
    expect(r.headline).toContain("insufficient data");
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights on insufficient_data", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 0 }));
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("returns zero for all rate fields on insufficient_data", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 0 }));
    expect(r.pat_testing_rate).toBe(0);
    expect(r.gas_certificate_rate).toBe(0);
    expect(r.electrical_inspection_rate).toBe(0);
    expect(r.co_detector_rate).toBe(0);
    expect(r.child_safety_rate).toBe(0);
    expect(r.staff_training_rate).toBe(0);
  });

  it("total_appliances_tested is 0 on insufficient_data", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 0 }));
    expect(r.total_appliances_tested).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. INADEQUATE — ALL EMPTY WITH CHILDREN
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate — all empty with children", () => {
  it("returns inadequate when all arrays empty but children on placement", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 3 }));
    expect(r.electrical_rating).toBe("inadequate");
    expect(r.electrical_score).toBe(15);
  });

  it("headline mentions urgent attention", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 3 }));
    expect(r.headline).toContain("urgent attention");
  });

  it("has 1 concern about no records", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 3 }));
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No PAT testing records");
  });

  it("has 2 recommendations about commissioning testing and installing CO detectors", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 3 }));
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("has 1 critical insight about absence of records", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 3 }));
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("recommendations have correct regulatory_ref", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 3 }));
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref).toContain("Reg 25");
    }
  });

  it("recommendations have sequential ranks", () => {
    const r = computeElectricityGasSafety(baseInput({ total_children: 3 }));
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. PAT TESTING RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("PAT testing rate", () => {
  it("calculates 100% when all current", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1" }),
        makePat({ id: "p2" }),
      ],
    }));
    expect(r.pat_testing_rate).toBe(100);
  });

  it("calculates 50% when half overdue", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", test_overdue: false }),
        makePat({ id: "p2", test_overdue: true }),
      ],
    }));
    expect(r.pat_testing_rate).toBe(50);
  });

  it("calculates 0% when all overdue", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", test_overdue: true }),
        makePat({ id: "p2", test_overdue: true }),
      ],
    }));
    expect(r.pat_testing_rate).toBe(0);
  });

  it("counts total_appliances_tested from pat_testing_records length", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1" }),
        makePat({ id: "p2" }),
        makePat({ id: "p3" }),
      ],
    }));
    expect(r.total_appliances_tested).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. PAT PASS RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("PAT pass rate", () => {
  it("100% when all pass", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", result: "pass" }),
        makePat({ id: "p2", result: "pass" }),
      ],
    }));
    expect(r.pat_pass_rate).toBe(100);
  });

  it("0% when all fail", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", result: "fail" }),
        makePat({ id: "p2", result: "fail" }),
      ],
    }));
    expect(r.pat_pass_rate).toBe(0);
  });

  it("50% when mixed pass/fail", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", result: "pass" }),
        makePat({ id: "p2", result: "fail" }),
      ],
    }));
    expect(r.pat_pass_rate).toBe(50);
  });

  it("advisory results do not count as pass", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", result: "advisory" }),
      ],
    }));
    expect(r.pat_pass_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. GAS CERTIFICATE RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("gas certificate rate", () => {
  it("100% when all current", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", expired: false }),
        makeGas({ id: "g2", expired: false }),
      ],
    }));
    expect(r.gas_certificate_rate).toBe(100);
  });

  it("0% when all expired", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", expired: true }),
        makeGas({ id: "g2", expired: true }),
      ],
    }));
    expect(r.gas_certificate_rate).toBe(0);
  });

  it("50% when half expired", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", expired: false }),
        makeGas({ id: "g2", expired: true }),
      ],
    }));
    expect(r.gas_certificate_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. GAS SATISFACTORY RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("gas satisfactory rate", () => {
  it("100% when all satisfactory", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", result: "satisfactory" }),
        makeGas({ id: "g2", result: "satisfactory" }),
      ],
    }));
    expect(r.gas_satisfactory_rate).toBe(100);
  });

  it("0% when all immediately_dangerous", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", result: "immediately_dangerous" }),
      ],
    }));
    expect(r.gas_satisfactory_rate).toBe(0);
  });

  it("50% when mixed satisfactory/at_risk", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", result: "satisfactory" }),
        makeGas({ id: "g2", result: "at_risk" }),
      ],
    }));
    expect(r.gas_satisfactory_rate).toBe(50);
  });

  it("not_to_current_standards does not count as satisfactory", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", result: "not_to_current_standards" }),
      ],
    }));
    expect(r.gas_satisfactory_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. ELECTRICAL INSPECTION RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("electrical inspection rate", () => {
  it("100% when all current", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", inspection_overdue: false }),
        makeElectrical({ id: "e2", inspection_overdue: false }),
      ],
    }));
    expect(r.electrical_inspection_rate).toBe(100);
  });

  it("0% when all overdue", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", inspection_overdue: true }),
        makeElectrical({ id: "e2", inspection_overdue: true }),
      ],
    }));
    expect(r.electrical_inspection_rate).toBe(0);
  });

  it("50% when half overdue", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", inspection_overdue: false }),
        makeElectrical({ id: "e2", inspection_overdue: true }),
      ],
    }));
    expect(r.electrical_inspection_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. ELECTRICAL SATISFACTORY RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("electrical satisfactory rate", () => {
  it("100% when all satisfactory", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", result: "satisfactory" }),
      ],
    }));
    expect(r.electrical_satisfactory_rate).toBe(100);
  });

  it("0% when all unsatisfactory", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", result: "unsatisfactory" }),
      ],
    }));
    expect(r.electrical_satisfactory_rate).toBe(0);
  });

  it("further_investigation does not count as satisfactory", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", result: "further_investigation" }),
      ],
    }));
    expect(r.electrical_satisfactory_rate).toBe(0);
  });

  it("improvement_required does not count as satisfactory", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", result: "improvement_required" }),
      ],
    }));
    expect(r.electrical_satisfactory_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. CO DETECTOR RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("CO detector rate", () => {
  it("100% when all tested and current", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [
        makeCo({ id: "c1", test_overdue: false }),
        makeCo({ id: "c2", test_overdue: false }),
      ],
    }));
    expect(r.co_detector_rate).toBe(100);
  });

  it("0% when all test_overdue", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [
        makeCo({ id: "c1", test_overdue: true }),
        makeCo({ id: "c2", test_overdue: true }),
      ],
    }));
    expect(r.co_detector_rate).toBe(0);
  });

  it("50% when half overdue", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [
        makeCo({ id: "c1", test_overdue: false }),
        makeCo({ id: "c2", test_overdue: true }),
      ],
    }));
    expect(r.co_detector_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. CO FUNCTIONING RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("CO functioning rate", () => {
  it("100% when all functioning", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [
        makeCo({ id: "c1", functioning: true }),
        makeCo({ id: "c2", functioning: true }),
      ],
    }));
    expect(r.co_functioning_rate).toBe(100);
  });

  it("0% when none functioning", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [
        makeCo({ id: "c1", functioning: false }),
        makeCo({ id: "c2", functioning: false }),
      ],
    }));
    expect(r.co_functioning_rate).toBe(0);
  });

  it("50% when half functioning", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [
        makeCo({ id: "c1", functioning: true }),
        makeCo({ id: "c2", functioning: false }),
      ],
    }));
    expect(r.co_functioning_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CHILD SAFETY RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("child safety rate", () => {
  it("100% when all children assessed", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 2,
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2" }),
      ],
    }));
    expect(r.child_safety_rate).toBe(100);
  });

  it("50% when half assessed", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 2,
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1" }),
      ],
    }));
    expect(r.child_safety_rate).toBe(50);
  });

  it("0% when no children assessed", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      child_safety_records: [],
    }));
    expect(r.child_safety_rate).toBe(0);
  });

  it("counts unique children, not total records", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1", awareness_type: "electrical_safety" }),
        makeChildSafety({ id: "cs2", child_id: "yp_1", awareness_type: "gas_safety" }),
        makeChildSafety({ id: "cs3", child_id: "yp_2", awareness_type: "fire_safety" }),
      ],
    }));
    // 2 unique children / 3 total = 67%
    expect(r.child_safety_rate).toBe(67);
  });

  it("returns 0 when total_children is 0", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 0,
      pat_testing_records: [makePat()],
      child_safety_records: [makeChildSafety()],
    }));
    expect(r.child_safety_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. STAFF TRAINING RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("staff training rate", () => {
  it("derived from unique assessors relative to total_staff", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 10,
      child_safety_records: [
        makeChildSafety({ id: "cs1", assessed_by: "staff_a" }),
        makeChildSafety({ id: "cs2", assessed_by: "staff_b" }),
        makeChildSafety({ id: "cs3", assessed_by: "staff_c" }),
      ],
    }));
    // 3 unique assessors / 10 staff = 30%
    expect(r.staff_training_rate).toBe(30);
  });

  it("clamped to 100 even if more unique assessors than staff", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 2,
      child_safety_records: [
        makeChildSafety({ id: "cs1", assessed_by: "staff_a" }),
        makeChildSafety({ id: "cs2", assessed_by: "staff_b" }),
        makeChildSafety({ id: "cs3", assessed_by: "staff_c" }),
      ],
    }));
    expect(r.staff_training_rate).toBe(100);
  });

  it("returns 0 when total_staff is 0", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 0,
      pat_testing_records: [makePat()],
      child_safety_records: [makeChildSafety()],
    }));
    expect(r.staff_training_rate).toBe(0);
  });

  it("counts unique assessors, not total records", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 5,
      child_safety_records: [
        makeChildSafety({ id: "cs1", assessed_by: "staff_a" }),
        makeChildSafety({ id: "cs2", assessed_by: "staff_a" }),
        makeChildSafety({ id: "cs3", assessed_by: "staff_a" }),
      ],
    }));
    // 1 unique assessor / 5 staff = 20%
    expect(r.staff_training_rate).toBe(20);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. DEFECT RESOLUTION RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("defect resolution rate", () => {
  it("100% when all PAT defects resolved", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", defect_found: true, defect_resolved: true }),
      ],
    }));
    expect(r.defect_resolution_rate).toBe(100);
  });

  it("0% when no defects resolved", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", defect_found: true, defect_resolved: false }),
      ],
    }));
    expect(r.defect_resolution_rate).toBe(0);
  });

  it("composite across PAT, gas, and electrical defects", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", defect_found: true, defect_resolved: true }),
      ],
      gas_certificate_records: [
        makeGas({ id: "g1", defects_found: true, defect_rectified: false }),
      ],
      electrical_inspection_records: [
        makeElectrical({ id: "e1", total_defects: 2, defects_rectified: 1 }),
      ],
    }));
    // Total defects: 1 pat + 1 gas + 2 electrical = 4
    // Total resolved: 1 pat + 0 gas + 1 electrical = 2
    // 2/4 = 50%
    expect(r.defect_resolution_rate).toBe(50);
  });

  it("0% when no defects at all (0/0)", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
    }));
    expect(r.defect_resolution_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. SCORING — BASE SCORE
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring — base score", () => {
  it("base score is 52 with no bonus or penalty triggers", () => {
    // 1 PAT record, current, not 100% all rates, just neutral
    // patTestingRate = 100 → +5 (will get bonus)
    // To get pure base 52, we need rates that don't trigger any bonus/penalty
    // Use a single overdue record for each to get rates at 0 (<50) but those also trigger penalties
    // Actually hard to get pure 52 — test with known combined value instead
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ id: "p1", test_overdue: false })],
      // patTestingRate = 100 → +5
    }));
    // Base 52 + patTestingRate bonus (+5) = 57
    // patPassRate = 100 but no separate bonus for that
    // gasCertificateRate, electricalInspectionRate, coDetectorRate = 0 (no records, not guarded)
    // childSafetyRate = 0, staffTrainingRate = 0
    // defectResolutionRate = 0 (no defects)
    // No penalties triggered because record counts are 0 for gas/elec/co
    expect(r.electrical_score).toBe(57);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. SCORING — BONUSES
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring — bonuses", () => {
  it("patTestingRate >= 100 adds +5", () => {
    const withPat = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
    }));
    // base 52 + patTestingRate bonus (+5) = 57
    expect(withPat.electrical_score).toBe(57);
  });

  it("patTestingRate >= 80 but < 100 adds +3", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePat({ id: `p${i}`, test_overdue: i >= 8 }), // 80% current (8/10)
    );
    const r = computeElectricityGasSafety(baseInput({ pat_testing_records: records }));
    // base 52 + 3 (pat 80%) = 55
    expect(r.electrical_score).toBe(55);
  });

  it("gasCertificateRate >= 100 adds +5", () => {
    const withGas = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas()],
    }));
    // base 52 + gasCertificateRate bonus (+5) = 57
    expect(withGas.electrical_score).toBe(57);
  });

  it("gasCertificateRate >= 80 but < 100 adds +3", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeGas({ id: `g${i}`, expired: i >= 4 }), // 80% current
    );
    const r = computeElectricityGasSafety(baseInput({ gas_certificate_records: records }));
    // base 52 + 3 (gas 80%) = 55
    expect(r.electrical_score).toBe(55);
  });

  it("electricalInspectionRate >= 100 adds +5", () => {
    const withElec = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical()],
    }));
    // base 52 + electricalInspectionRate bonus (+5) = 57
    expect(withElec.electrical_score).toBe(57);
  });

  it("electricalInspectionRate >= 80 but < 100 adds +3", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeElectrical({ id: `e${i}`, inspection_overdue: i >= 4 }), // 80%
    );
    const r = computeElectricityGasSafety(baseInput({ electrical_inspection_records: records }));
    expect(r.electrical_score).toBe(55);
  });

  it("coDetectorRate >= 100 adds +4", () => {
    const withCo = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo()],
    }));
    // base 52 + coDetectorRate bonus (+4) = 56
    expect(withCo.electrical_score).toBe(56);
  });

  it("coDetectorRate >= 80 but < 100 adds +2", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeCo({ id: `c${i}`, test_overdue: i >= 4 }), // 80% current (4/5)
    );
    const r = computeElectricityGasSafety(baseInput({ co_detector_records: records }));
    // base 52 + coDetectorRate bonus (+2) = 54
    expect(r.electrical_score).toBe(54);
  });

  it("childSafetyRate >= 100 adds +4", () => {
    // Use a PAT record in both to avoid the allEmpty special case
    const with100 = computeElectricityGasSafety(baseInput({
      total_children: 1,
      pat_testing_records: [makePat()],
      child_safety_records: [makeChildSafety({ child_id: "yp_1" })],
    }));
    const without = computeElectricityGasSafety(baseInput({
      total_children: 1,
      pat_testing_records: [makePat()],
      child_safety_records: [],
    }));
    expect(with100.electrical_score - without.electrical_score).toBe(4);
  });

  it("childSafetyRate >= 80 but < 100 adds +2", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeChildSafety({ id: `cs${i}`, child_id: `yp_${i}` }),
    );
    const r = computeElectricityGasSafety(baseInput({
      total_children: 5,
      child_safety_records: records,
    }));
    // 4/5 = 80% → +2
    expect(r.electrical_score).toBe(54);
  });

  it("staffTrainingRate >= 80 adds +3", () => {
    const assessors = Array.from({ length: 8 }, (_, i) =>
      makeChildSafety({ id: `cs${i}`, assessed_by: `staff_${i}` }),
    );
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 10,
      child_safety_records: assessors,
    }));
    // 8/10 = 80% staff training → +3
    expect(r.electrical_score).toBe(55);
  });

  it("staffTrainingRate >= 60 but < 80 adds +1", () => {
    const assessors = Array.from({ length: 6 }, (_, i) =>
      makeChildSafety({ id: `cs${i}`, assessed_by: `staff_${i}` }),
    );
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 10,
      child_safety_records: assessors,
    }));
    // 6/10 = 60% → +1
    expect(r.electrical_score).toBe(53);
  });

  it("defectResolutionRate >= 100 adds +2", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", defect_found: true, defect_resolved: true }),
      ],
    }));
    // base 52 + 5 (pat 100%) + 2 (defect 100%) = 59
    expect(r.electrical_score).toBe(59);
  });

  it("defectResolutionRate >= 80 but < 100 adds +1", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", defect_found: true, defect_resolved: true }),
        makePat({ id: "p2", defect_found: true, defect_resolved: true }),
        makePat({ id: "p3", defect_found: true, defect_resolved: true }),
        makePat({ id: "p4", defect_found: true, defect_resolved: true }),
        makePat({ id: "p5", defect_found: true, defect_resolved: false }),
      ],
    }));
    // 4/5 defects resolved = 80% → +1
    // pat testing rate 100% → +5
    // 52 + 5 + 1 = 58
    expect(r.electrical_score).toBe(58);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. SCORING — PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring — penalties", () => {
  it("patTestingRate < 50 with records gives -6", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makePat({ id: `p${i}`, test_overdue: i < 3 }), // 25% current
    );
    const r = computeElectricityGasSafety(baseInput({ pat_testing_records: records }));
    // patTestingRate = 25% → penalty -6, no bonus
    // 52 - 6 = 46
    expect(r.electrical_score).toBe(46);
  });

  it("gasCertificateRate < 50 with records gives -6", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeGas({ id: `g${i}`, expired: i < 3 }), // 25% current
    );
    const r = computeElectricityGasSafety(baseInput({ gas_certificate_records: records }));
    // 52 - 6 = 46
    expect(r.electrical_score).toBe(46);
  });

  it("electricalInspectionRate < 50 with records gives -5", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeElectrical({ id: `e${i}`, inspection_overdue: i < 3 }), // 25%
    );
    const r = computeElectricityGasSafety(baseInput({ electrical_inspection_records: records }));
    // 52 - 5 = 47
    expect(r.electrical_score).toBe(47);
  });

  it("coDetectorRate < 50 with records gives -5", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeCo({ id: `c${i}`, test_overdue: i < 3 }), // 25%
    );
    const r = computeElectricityGasSafety(baseInput({ co_detector_records: records }));
    // 52 - 5 = 47
    expect(r.electrical_score).toBe(47);
  });

  it("penalties not applied when record count is 0", () => {
    // All empty arrays → no penalties, base 52
    // But with children > 0 and all empty, it returns the special inadequate case (15)
    // Need at least one record type present to avoid special case
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
      // gas, electrical, co arrays empty — no penalty because count is 0
    }));
    // 52 + 5 (pat bonus) = 57, no penalties
    expect(r.electrical_score).toBe(57);
  });

  it("multiple penalties stack", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true })], // 0% → -6
      gas_certificate_records: [makeGas({ expired: true })], // 0% → -6
      electrical_inspection_records: [makeElectrical({ inspection_overdue: true })], // 0% → -5
      co_detector_records: [makeCo({ test_overdue: true })], // 0% → -5
    }));
    // 52 - 6 - 6 - 5 - 5 = 30
    expect(r.electrical_score).toBe(30);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. SCORING — CLAMPING
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring — clamping", () => {
  it("score never exceeds 100", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      total_staff: 3,
      pat_testing_records: [makePat()],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
      co_detector_records: [makeCo()],
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1", assessed_by: "s1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2", assessed_by: "s2" }),
        makeChildSafety({ id: "cs3", child_id: "yp_3", assessed_by: "s3" }),
      ],
    }));
    expect(r.electrical_score).toBeLessThanOrEqual(100);
  });

  it("score never goes below 0", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: Array.from({ length: 10 }, (_, i) =>
        makePat({ id: `p${i}`, test_overdue: true }),
      ),
      gas_certificate_records: Array.from({ length: 10 }, (_, i) =>
        makeGas({ id: `g${i}`, expired: true }),
      ),
      electrical_inspection_records: Array.from({ length: 10 }, (_, i) =>
        makeElectrical({ id: `e${i}`, inspection_overdue: true }),
      ),
      co_detector_records: Array.from({ length: 10 }, (_, i) =>
        makeCo({ id: `c${i}`, test_overdue: true }),
      ),
    }));
    expect(r.electrical_score).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("score >= 80 is outstanding", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      total_staff: 3,
      pat_testing_records: [makePat({ defect_found: true, defect_resolved: true })],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
      co_detector_records: [makeCo()],
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1", assessed_by: "s1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2", assessed_by: "s2" }),
        makeChildSafety({ id: "cs3", child_id: "yp_3", assessed_by: "s3" }),
      ],
    }));
    // 52 + 5 + 5 + 5 + 4 + 4 + 3 + 2 = 80
    expect(r.electrical_score).toBe(80);
    expect(r.electrical_rating).toBe("outstanding");
  });

  it("score 65-79 is good", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
    }));
    // 52 + 5 + 5 + 5 = 67
    expect(r.electrical_score).toBe(67);
    expect(r.electrical_rating).toBe("good");
  });

  it("score 45-64 is adequate", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
    }));
    // 52 + 5 = 57
    expect(r.electrical_score).toBe(57);
    expect(r.electrical_rating).toBe("adequate");
  });

  it("score < 45 is inadequate", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true })],
      gas_certificate_records: [makeGas({ expired: true })],
      electrical_inspection_records: [makeElectrical({ inspection_overdue: true })],
      co_detector_records: [makeCo({ test_overdue: true })],
    }));
    // 52 - 6 - 6 - 5 - 5 = 30
    expect(r.electrical_score).toBe(30);
    expect(r.electrical_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. STRENGTHS — PAT TESTING
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — PAT testing", () => {
  it("strength when patTestingRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
    }));
    expect(r.strengths.some((s) => s.includes("All portable appliance testing is current"))).toBe(true);
  });

  it("strength when patTestingRate >= 80 but < 100", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makePat({ id: `p${i}`, test_overdue: i >= 4 }),
    );
    const r = computeElectricityGasSafety(baseInput({ pat_testing_records: records }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("PAT testing"))).toBe(true);
  });

  it("strength when patPassRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ result: "pass" })],
    }));
    expect(r.strengths.some((s) => s.includes("Every appliance has passed PAT testing"))).toBe(true);
  });

  it("strength when patPassRate >= 90", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePat({ id: `p${i}`, result: i >= 1 ? "pass" : "fail" }),
    );
    const r = computeElectricityGasSafety(baseInput({ pat_testing_records: records }));
    expect(r.strengths.some((s) => s.includes("90%") && s.includes("PAT pass rate"))).toBe(true);
  });

  it("strength when all testers qualified", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ tester_qualified: true })],
    }));
    expect(r.strengths.some((s) => s.includes("qualified testers"))).toBe(true);
  });

  it("strength when all labels attached", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ label_attached: true })],
    }));
    expect(r.strengths.some((s) => s.includes("labels attached"))).toBe(true);
  });

  it("strength when all PAT defects resolved", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ defect_found: true, defect_resolved: true })],
    }));
    expect(r.strengths.some((s) => s.includes("All PAT defects have been resolved"))).toBe(true);
  });

  it("no PAT defect resolution strength when no defects", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ defect_found: false })],
    }));
    expect(r.strengths.some((s) => s.includes("All PAT defects"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 21. STRENGTHS — GAS SAFETY
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — gas safety", () => {
  it("strength when gasCertificateRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas()],
    }));
    expect(r.strengths.some((s) => s.includes("All gas safety certificates are current"))).toBe(true);
  });

  it("strength when gasCertificateRate >= 80", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeGas({ id: `g${i}`, expired: i >= 4 }),
    );
    const r = computeElectricityGasSafety(baseInput({ gas_certificate_records: records }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("gas safety certificates"))).toBe(true);
  });

  it("strength when gasSatisfactoryRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ result: "satisfactory" })],
    }));
    expect(r.strengths.some((s) => s.includes("All gas appliances rated satisfactory"))).toBe(true);
  });

  it("strength when gasSatisfactoryRate >= 90", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeGas({ id: `g${i}`, result: i >= 1 ? "satisfactory" : "at_risk" }),
    );
    const r = computeElectricityGasSafety(baseInput({ gas_certificate_records: records }));
    expect(r.strengths.some((s) => s.includes("90%") && s.includes("gas appliances rated satisfactory"))).toBe(true);
  });

  it("strength when all flues checked", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ flue_checked: true })],
    }));
    expect(r.strengths.some((s) => s.includes("flues have been checked"))).toBe(true);
  });

  it("strength when all safety devices operational", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ safety_device_operational: true })],
    }));
    expect(r.strengths.some((s) => s.includes("gas safety devices are operational"))).toBe(true);
  });

  it("strength when all gas defects rectified", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ defects_found: true, defect_rectified: true })],
    }));
    expect(r.strengths.some((s) => s.includes("All gas defects have been rectified"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 22. STRENGTHS — ELECTRICAL
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — electrical", () => {
  it("strength when electricalInspectionRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical()],
    }));
    expect(r.strengths.some((s) => s.includes("All electrical inspections are current"))).toBe(true);
  });

  it("strength when electricalInspectionRate >= 80", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeElectrical({ id: `e${i}`, inspection_overdue: i >= 4 }),
    );
    const r = computeElectricityGasSafety(baseInput({ electrical_inspection_records: records }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("electrical inspections current"))).toBe(true);
  });

  it("strength when electricalSatisfactoryRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ result: "satisfactory" })],
    }));
    expect(r.strengths.some((s) => s.includes("All electrical inspections rated satisfactory"))).toBe(true);
  });

  it("strength when RCDs tested and operating correctly", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ rcd_tested: true, rcd_operating_correctly: true })],
    }));
    expect(r.strengths.some((s) => s.includes("All RCDs tested and operating correctly"))).toBe(true);
  });

  it("strength when all electrical defects rectified", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ total_defects: 3, defects_rectified: 3 })],
    }));
    expect(r.strengths.some((s) => s.includes("All electrical defects have been rectified"))).toBe(true);
  });

  it("strength when earthing and bonding satisfactory", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ earthing_satisfactory: true, bonding_satisfactory: true })],
    }));
    expect(r.strengths.some((s) => s.includes("Earthing and bonding satisfactory"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 23. STRENGTHS — CO DETECTORS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — CO detectors", () => {
  it("strength when coDetectorRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo()],
    }));
    expect(r.strengths.some((s) => s.includes("All carbon monoxide detectors are tested and current"))).toBe(true);
  });

  it("strength when coDetectorRate >= 80", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeCo({ id: `c${i}`, test_overdue: i >= 4 }),
    );
    const r = computeElectricityGasSafety(baseInput({ co_detector_records: records }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("CO detectors tested"))).toBe(true);
  });

  it("strength when coFunctioningRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ functioning: true })],
    }));
    expect(r.strengths.some((s) => s.includes("All carbon monoxide detectors are functioning"))).toBe(true);
  });

  it("strength when all positioned correctly", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ positioned_correctly: true })],
    }));
    expect(r.strengths.some((s) => s.includes("All CO detectors are correctly positioned"))).toBe(true);
  });

  it("strength when >= 80% near sleeping areas", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ near_sleeping_area: true })],
    }));
    expect(r.strengths.some((s) => s.includes("CO detectors positioned near sleeping areas"))).toBe(true);
  });

  it("strength when coChildAwareRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ child_aware_of_alarm: true })],
    }));
    expect(r.strengths.some((s) => s.includes("All children are aware of CO alarm sounds"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 24. STRENGTHS — CHILD SAFETY AWARENESS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — child safety awareness", () => {
  it("strength when childSafetyRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 1,
      child_safety_records: [makeChildSafety({ child_id: "yp_1" })],
    }));
    expect(r.strengths.some((s) => s.includes("Every child has received"))).toBe(true);
  });

  it("strength when childSafetyRate >= 80", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 5,
      child_safety_records: Array.from({ length: 4 }, (_, i) =>
        makeChildSafety({ id: `cs${i}`, child_id: `yp_${i}` }),
      ),
    }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("safety awareness assessment"))).toBe(true);
  });

  it("strength when avgKnowledgeScore >= 8.0", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ knowledge_score: 9 })],
    }));
    expect(r.strengths.some((s) => s.includes("excellent understanding"))).toBe(true);
  });

  it("strength when avgKnowledgeScore >= 6.0 but < 8.0", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ knowledge_score: 7 })],
    }));
    expect(r.strengths.some((s) => s.includes("good safety understanding"))).toBe(true);
  });

  it("strength when emergencyProcedureRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ knows_emergency_procedure: true })],
    }));
    expect(r.strengths.some((s) => s.includes("Every assessed child knows the emergency procedures"))).toBe(true);
  });

  it("strength when hazardIdentificationRate >= 90%", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ can_identify_hazards: true })],
    }));
    expect(r.strengths.some((s) => s.includes("can identify electrical and gas hazards"))).toBe(true);
  });

  it("strength when childEngagementRate >= 90%", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ child_engaged_in_session: true })],
    }));
    expect(r.strengths.some((s) => s.includes("child engagement in safety sessions"))).toBe(true);
  });

  it("strength when all additional support provided", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ additional_support_needed: true, support_provided: true })],
    }));
    expect(r.strengths.some((s) => s.includes("additional safety support have received it"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 25. STRENGTHS — STAFF TRAINING
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — staff training", () => {
  it("strength when staffTrainingRate >= 80", () => {
    const assessors = Array.from({ length: 8 }, (_, i) =>
      makeChildSafety({ id: `cs${i}`, assessed_by: `staff_${i}` }),
    );
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 10,
      child_safety_records: assessors,
    }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("staff involvement"))).toBe(true);
  });

  it("strength when staffTrainingRate >= 60 but < 80", () => {
    const assessors = Array.from({ length: 6 }, (_, i) =>
      makeChildSafety({ id: `cs${i}`, assessed_by: `staff_${i}` }),
    );
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 10,
      child_safety_records: assessors,
    }));
    expect(r.strengths.some((s) => s.includes("60%") && s.includes("staff involvement"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 26. STRENGTHS — COMPOSITE
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — composite defect resolution", () => {
  it("strength when defectResolutionRate 100%", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ defect_found: true, defect_resolved: true })],
      gas_certificate_records: [makeGas({ defects_found: true, defect_rectified: true })],
    }));
    expect(r.strengths.some((s) => s.includes("zero-tolerance approach"))).toBe(true);
  });

  it("strength when defectResolutionRate >= 90", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", total_defects: 10, defects_rectified: 9 }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("90%") && s.includes("defect resolution"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 27. CONCERNS — PAT TESTING
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — PAT testing", () => {
  it("concern when patTestingRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true })],
    }));
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("PAT testing"))).toBe(true);
  });

  it("concern when patTestingRate 50-79", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePat({ id: `p${i}`, test_overdue: i >= 6 }), // 60% current
    );
    const r = computeElectricityGasSafety(baseInput({ pat_testing_records: records }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("PAT testing compliance"))).toBe(true);
  });

  it("concern when PAT failures exist", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ result: "fail" })],
    }));
    expect(r.concerns.some((c) => c.includes("failed PAT testing"))).toBe(true);
  });

  it("concern when high-risk appliances exist", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ risk_rating: "high" })],
    }));
    expect(r.concerns.some((c) => c.includes("high risk"))).toBe(true);
  });

  it("concern when child-accessible appliances have defects", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ child_accessible: true, defect_found: true })],
    }));
    expect(r.concerns.some((c) => c.includes("child-accessible"))).toBe(true);
  });

  it("concern when PAT defect resolution < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", defect_found: true, defect_resolved: false }),
        makePat({ id: "p2", defect_found: true, defect_resolved: false }),
        makePat({ id: "p3", defect_found: true, defect_resolved: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("PAT defects resolved"))).toBe(true);
  });

  it("concern when PAT tests overdue", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true })],
    }));
    expect(r.concerns.some((c) => c.includes("overdue PAT testing"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 28. CONCERNS — GAS SAFETY
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — gas safety", () => {
  it("concern when gasCertificateRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ expired: true })],
    }));
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("gas safety certificates"))).toBe(true);
  });

  it("concern when gasCertificateRate 50-79", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeGas({ id: `g${i}`, expired: i >= 6 }), // 60% current
    );
    const r = computeElectricityGasSafety(baseInput({ gas_certificate_records: records }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Gas safety certificate compliance"))).toBe(true);
  });

  it("concern when immediately dangerous appliances exist", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ result: "immediately_dangerous" })],
    }));
    expect(r.concerns.some((c) => c.includes("immediately dangerous"))).toBe(true);
  });

  it("concern when at_risk appliances exist", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ result: "at_risk" })],
    }));
    expect(r.concerns.some((c) => c.includes("at risk"))).toBe(true);
  });

  it("concern when warning notices issued", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ warning_notice_issued: true })],
    }));
    expect(r.concerns.some((c) => c.includes("gas warning notice"))).toBe(true);
  });

  it("concern when gas certificates expired", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ expired: true })],
    }));
    expect(r.concerns.some((c) => c.includes("gas safety certificate") && c.includes("expired"))).toBe(true);
  });

  it("concern when gas defect resolution < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", defects_found: true, defect_rectified: false }),
        makeGas({ id: "g2", defects_found: true, defect_rectified: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("gas defects rectified"))).toBe(true);
  });

  it("concern when gasCoReadingRate < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", co_reading_acceptable: false }),
        makeGas({ id: "g2", co_reading_acceptable: false }),
        makeGas({ id: "g3", co_reading_acceptable: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("CO readings"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 29. CONCERNS — ELECTRICAL
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — electrical", () => {
  it("concern when electricalInspectionRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ inspection_overdue: true })],
    }));
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("electrical inspections"))).toBe(true);
  });

  it("concern when electricalInspectionRate 50-79", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeElectrical({ id: `e${i}`, inspection_overdue: i >= 6 }),
    );
    const r = computeElectricityGasSafety(baseInput({ electrical_inspection_records: records }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Electrical inspection compliance"))).toBe(true);
  });

  it("concern when C1 defects exist", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ c1_defects: 2, total_defects: 2 })],
    }));
    expect(r.concerns.some((c) => c.includes("C1") && c.includes("danger present"))).toBe(true);
  });

  it("concern when C2 defects exist", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ c2_defects: 3, total_defects: 3 })],
    }));
    expect(r.concerns.some((c) => c.includes("C2") && c.includes("potentially dangerous"))).toBe(true);
  });

  it("concern when electrical defect resolution < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ total_defects: 5, defects_rectified: 2 }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("electrical defects rectified"))).toBe(true);
  });

  it("concern when rcdOperatingRate < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", rcd_operating_correctly: false }),
        makeElectrical({ id: "e2", rcd_operating_correctly: false }),
        makeElectrical({ id: "e3", rcd_operating_correctly: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("RCDs operating correctly"))).toBe(true);
  });

  it("concern when electrical inspections overdue", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ inspection_overdue: true })],
    }));
    expect(r.concerns.some((c) => c.includes("electrical inspection") && c.includes("overdue"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 30. CONCERNS — CO DETECTORS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — CO detectors", () => {
  it("concern when coDetectorRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ test_overdue: true })],
    }));
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("CO detectors"))).toBe(true);
  });

  it("concern when coDetectorRate 50-79", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeCo({ id: `c${i}`, test_overdue: i >= 6 }), // 60% current (6/10)
    );
    const r = computeElectricityGasSafety(baseInput({ co_detector_records: records }));
    expect(r.concerns.some((c) => c.includes("CO detector testing compliance"))).toBe(true);
  });

  it("concern when CO detectors not functioning", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ functioning: false })],
    }));
    expect(r.concerns.some((c) => c.includes("not functioning"))).toBe(true);
  });

  it("concern when CO detector batteries low or dead", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ battery_status: "low" })],
    }));
    expect(r.concerns.some((c) => c.includes("low or dead batteries"))).toBe(true);
  });

  it("concern when CO detectors due for replacement", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ replacement_due: true })],
    }));
    expect(r.concerns.some((c) => c.includes("due for replacement"))).toBe(true);
  });

  it("concern when CO detectors failed testing", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ test_result: "fail" })],
    }));
    expect(r.concerns.some((c) => c.includes("failed testing"))).toBe(true);
  });

  it("concern when CO detectors not positioned correctly < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [
        makeCo({ id: "c1", positioned_correctly: false }),
        makeCo({ id: "c2", positioned_correctly: false }),
        makeCo({ id: "c3", positioned_correctly: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("CO detectors positioned correctly"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 31. CONCERNS — CHILD SAFETY AWARENESS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — child safety awareness", () => {
  it("concern when childSafetyRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 5,
      child_safety_records: [makeChildSafety({ child_id: "yp_1" })],
    }));
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("safety awareness assessment"))).toBe(true);
  });

  it("concern when childSafetyRate 50-79", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("67%") && c.includes("Child safety awareness coverage"))).toBe(true);
  });

  it("concern when avgKnowledgeScore < 4.0", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ knowledge_score: 2 })],
    }));
    expect(r.concerns.some((c) => c.includes("2/10") && c.includes("lack adequate understanding"))).toBe(true);
  });

  it("concern when avgKnowledgeScore 4.0-5.9", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ knowledge_score: 5 })],
    }));
    expect(r.concerns.some((c) => c.includes("5/10") && c.includes("needs strengthening"))).toBe(true);
  });

  it("concern when emergencyProcedureRate < 70%", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [
        makeChildSafety({ id: "cs1", knows_emergency_procedure: false }),
        makeChildSafety({ id: "cs2", knows_emergency_procedure: false }),
        makeChildSafety({ id: "cs3", knows_emergency_procedure: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("emergency procedures"))).toBe(true);
  });

  it("concern when child safety reviews overdue", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ review_overdue: true })],
    }));
    expect(r.concerns.some((c) => c.includes("safety awareness review") && c.includes("overdue"))).toBe(true);
  });

  it("concern when support provision < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [
        makeChildSafety({ id: "cs1", additional_support_needed: true, support_provided: false }),
        makeChildSafety({ id: "cs2", additional_support_needed: true, support_provided: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("additional safety support"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 32. CONCERNS — STAFF TRAINING
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — staff training", () => {
  it("concern when staffTrainingRate < 40", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 10,
      child_safety_records: [
        makeChildSafety({ id: "cs1", assessed_by: "staff_a" }),
        makeChildSafety({ id: "cs2", assessed_by: "staff_b" }),
        makeChildSafety({ id: "cs3", assessed_by: "staff_c" }),
      ],
    }));
    // 3/10 = 30%
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("staff have delivered"))).toBe(true);
  });

  it("no staff training concern when staffTrainingRate >= 40", () => {
    const assessors = Array.from({ length: 4 }, (_, i) =>
      makeChildSafety({ id: `cs${i}`, assessed_by: `staff_${i}` }),
    );
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 10,
      child_safety_records: assessors,
    }));
    expect(r.concerns.some((c) => c.includes("staff have delivered safety awareness sessions"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 33. RECOMMENDATIONS — IMMEDIATE
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — immediate", () => {
  it("recommendation for immediately dangerous gas appliances", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ result: "immediately_dangerous" })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("isolate"))).toBe(true);
  });

  it("recommendation for C1 defects", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ c1_defects: 1, total_defects: 1 })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("C1"))).toBe(true);
  });

  it("recommendation for non-functioning CO detectors", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ functioning: false })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("non-functioning"))).toBe(true);
  });

  it("recommendation for child-accessible failed appliances", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ child_accessible: true, result: "fail" })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("child-accessible"))).toBe(true);
  });

  it("recommendation for gas certificate rate < 50%", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ expired: true })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("gas safety certificates"))).toBe(true);
  });

  it("recommendation for PAT testing rate < 50%", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("PAT testing"))).toBe(true);
  });

  it("recommendation for electrical inspection rate < 50%", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ inspection_overdue: true })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("electrical inspections"))).toBe(true);
  });

  it("recommendation for CO detector rate < 50%", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ test_overdue: true })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("carbon monoxide detectors"))).toBe(true);
  });

  it("recommendation for C2 defects", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ c2_defects: 2, total_defects: 2 })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("C2"))).toBe(true);
  });

  it("recommendation for low/dead CO detector batteries", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ battery_status: "dead" })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("batteries"))).toBe(true);
  });

  it("recommendation for gas warning notices", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ warning_notice_issued: true })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("warning notices"))).toBe(true);
  });

  it("recommendation for childSafetyRate < 50%", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 5,
      child_safety_records: [makeChildSafety({ child_id: "yp_1" })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("safety awareness sessions"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 34. RECOMMENDATIONS — SOON
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — soon", () => {
  it("recommendation for PAT testing 50-79%", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePat({ id: `p${i}`, test_overdue: i >= 6 }), // 60%
    );
    const r = computeElectricityGasSafety(baseInput({ pat_testing_records: records }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("PAT testing compliance"))).toBe(true);
  });

  it("recommendation for gas certificate 50-79%", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeGas({ id: `g${i}`, expired: i >= 6 }), // 60% current (6/10)
    );
    const r = computeElectricityGasSafety(baseInput({ gas_certificate_records: records }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("gas safety certificates"))).toBe(true);
  });

  it("recommendation for electrical inspection 50-79%", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeElectrical({ id: `e${i}`, inspection_overdue: i >= 6 }), // 60% current (6/10)
    );
    const r = computeElectricityGasSafety(baseInput({ electrical_inspection_records: records }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("electrical inspections"))).toBe(true);
  });

  it("recommendation for child safety 50-79%", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2" }),
      ],
    }));
    // 2/3 = 67%
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("safety awareness to all children"))).toBe(true);
  });

  it("recommendation for emergency procedure rate < 70%", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [
        makeChildSafety({ id: "cs1", knows_emergency_procedure: false }),
        makeChildSafety({ id: "cs2", knows_emergency_procedure: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("emergency procedures"))).toBe(true);
  });

  it("recommendation for rcdOperatingRate < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", rcd_operating_correctly: false }),
        makeElectrical({ id: "e2", rcd_operating_correctly: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("RCDs"))).toBe(true);
  });

  it("recommendation for CO detectors not positioned correctly < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [
        makeCo({ id: "c1", positioned_correctly: false }),
        makeCo({ id: "c2", positioned_correctly: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Reposition"))).toBe(true);
  });

  it("recommendation for gas CO reading rate < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", co_reading_acceptable: false }),
        makeGas({ id: "g2", co_reading_acceptable: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("CO readings"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 35. RECOMMENDATIONS — PLANNED
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — planned", () => {
  it("recommendation for overdue child safety reviews", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ review_overdue: true })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("overdue child safety awareness reviews"))).toBe(true);
  });

  it("recommendation for staff training rate < 60%", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 10,
      child_safety_records: [
        makeChildSafety({ assessed_by: "staff_a" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("staff participation"))).toBe(true);
  });

  it("recommendation for CO detector replacement due", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ replacement_due: true })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("replacement"))).toBe(true);
  });

  it("recommendation for PAT label rate < 90%", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", label_attached: false }),
        makePat({ id: "p2", label_attached: true }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("PAT labels"))).toBe(true);
  });

  it("recommendation for FI defects", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ fi_defects: 2, total_defects: 2 })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("further investigation"))).toBe(true);
  });

  it("recommendation for support provision rate < 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [
        makeChildSafety({ id: "cs1", additional_support_needed: true, support_provided: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("additional safety support"))).toBe(true);
  });

  it("recommendation for practical demonstration rate < 70%", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [
        makeChildSafety({ id: "cs1", practical_demonstration: false }),
        makeChildSafety({ id: "cs2", practical_demonstration: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("practical demonstration"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 36. RECOMMENDATION PROPERTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendation properties", () => {
  it("all recommendations have sequential ranks", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true, result: "fail", child_accessible: true })],
      gas_certificate_records: [makeGas({ result: "immediately_dangerous", expired: true })],
      electrical_inspection_records: [makeElectrical({ c1_defects: 1, c2_defects: 1, inspection_overdue: true, total_defects: 2 })],
      co_detector_records: [makeCo({ functioning: false, test_overdue: true, battery_status: "dead" })],
    }));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("all recommendations have regulatory_ref", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true })],
      gas_certificate_records: [makeGas({ expired: true })],
      co_detector_records: [makeCo({ functioning: false })],
    }));
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });

  it("all recommendations have valid urgency", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true })],
      child_safety_records: [makeChildSafety({ review_overdue: true })],
    }));
    for (const rec of r.recommendations) {
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 37. INSIGHTS — CRITICAL
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — critical", () => {
  it("critical insight for immediately dangerous gas appliance", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ result: "immediately_dangerous" })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("immediately dangerous"))).toBe(true);
  });

  it("critical insight for C1 defects", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ c1_defects: 1, total_defects: 1 })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("C1"))).toBe(true);
  });

  it("critical insight for patTestingRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("portable appliance testing"))).toBe(true);
  });

  it("critical insight for gasCertificateRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ expired: true })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("gas safety certificates"))).toBe(true);
  });

  it("critical insight for electricalInspectionRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ inspection_overdue: true })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("electrical inspections"))).toBe(true);
  });

  it("critical insight for coDetectorRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ test_overdue: true })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("CO detectors"))).toBe(true);
  });

  it("critical insight for non-functioning CO detectors", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ functioning: false })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("not functioning"))).toBe(true);
  });

  it("critical insight for child-accessible appliances with defects", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ child_accessible: true, defect_found: true })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("accessible to children"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 38. INSIGHTS — WARNING
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — warning", () => {
  it("warning insight for patTestingRate 50-79", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePat({ id: `p${i}`, test_overdue: i >= 6 }),
    );
    const r = computeElectricityGasSafety(baseInput({ pat_testing_records: records }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("PAT testing compliance at 60%"))).toBe(true);
  });

  it("warning insight for gasCertificateRate 50-79", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeGas({ id: `g${i}`, expired: i >= 6 }), // 60% current (6/10)
    );
    const r = computeElectricityGasSafety(baseInput({ gas_certificate_records: records }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Gas certificate compliance at 60%"))).toBe(true);
  });

  it("warning insight for electricalInspectionRate 50-79", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeElectrical({ id: `e${i}`, inspection_overdue: i >= 6 }), // 60% current (6/10)
    );
    const r = computeElectricityGasSafety(baseInput({ electrical_inspection_records: records }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Electrical inspection compliance at 60%"))).toBe(true);
  });

  it("warning insight for coDetectorRate 50-79", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeCo({ id: `c${i}`, test_overdue: i >= 6 }), // 60% current (6/10)
    );
    const r = computeElectricityGasSafety(baseInput({ co_detector_records: records }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("CO detector testing at 60%"))).toBe(true);
  });

  it("warning insight for C2 defects (when no C1)", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ c2_defects: 3, total_defects: 3 })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("C2"))).toBe(true);
  });

  it("no C2 warning insight when C1 defects also present", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ c1_defects: 1, c2_defects: 2, total_defects: 3 })],
    }));
    // C2 warning requires totalC1Defects === 0
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("C2 (potentially dangerous)"))).toBe(false);
  });

  it("warning insight for C3 defects (when no C1 or C2)", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ c3_defects: 5, total_defects: 5 })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("C3"))).toBe(true);
  });

  it("no C3 warning when C2 defects present", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ c2_defects: 1, c3_defects: 5, total_defects: 6 })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("C3 (improvement recommended)"))).toBe(false);
  });

  it("warning insight for gas at_risk (when no immediately dangerous)", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ result: "at_risk" })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("at risk"))).toBe(true);
  });

  it("no at_risk warning when immediately dangerous present", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [
        makeGas({ id: "g1", result: "immediately_dangerous" }),
        makeGas({ id: "g2", result: "at_risk" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("classified as at risk"))).toBe(false);
  });

  it("warning insight for childSafetyRate 50-79", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child safety awareness coverage at 67%"))).toBe(true);
  });

  it("warning insight for childSafetyRate < 50", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 5,
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("20%") && i.text.includes("safety awareness assessment"))).toBe(true);
  });

  it("warning insight for avgKnowledgeScore 4.0-5.9", () => {
    const r = computeElectricityGasSafety(baseInput({
      child_safety_records: [makeChildSafety({ knowledge_score: 5 })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("5/10"))).toBe(true);
  });

  it("warning insight for staffTrainingRate < 60", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_staff: 10,
      child_safety_records: [
        makeChildSafety({ assessed_by: "staff_a" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("10%") && i.text.includes("staff"))).toBe(true);
  });

  it("warning insight for defectResolutionRate 50-79", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ total_defects: 10, defects_rectified: 6 }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("defect resolution"))).toBe(true);
  });

  it("warning insight for CO replacement due (when all functioning)", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ replacement_due: true, functioning: true })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("approaching end of life"))).toBe(true);
  });

  it("no CO replacement warning when detectors not functioning", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ replacement_due: true, functioning: false })],
    }));
    // coReplacementDueCount > 0 && coNotFunctioningCount === 0 — condition fails
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("approaching end of life"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 39. INSIGHTS — CATEGORY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — category analysis", () => {
  it("PAT appliance category analysis when >= 5 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makePat({ id: `p${i}`, appliance_category: "portable" }),
    );
    const r = computeElectricityGasSafety(baseInput({ pat_testing_records: records }));
    expect(r.insights.some((i) => i.text.includes("PAT tested appliance categories"))).toBe(true);
  });

  it("no PAT category analysis when < 5 records", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makePat({ id: `p${i}` }),
    );
    const r = computeElectricityGasSafety(baseInput({ pat_testing_records: records }));
    expect(r.insights.some((i) => i.text.includes("PAT tested appliance categories"))).toBe(false);
  });

  it("gas certificate type analysis when >= 3 records", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeGas({ id: `g${i}`, certificate_type: "cp12" }),
    );
    const r = computeElectricityGasSafety(baseInput({ gas_certificate_records: records }));
    expect(r.insights.some((i) => i.text.includes("Gas safety certificate types"))).toBe(true);
  });

  it("no gas certificate type analysis when < 3 records", () => {
    const records = Array.from({ length: 2 }, (_, i) =>
      makeGas({ id: `g${i}` }),
    );
    const r = computeElectricityGasSafety(baseInput({ gas_certificate_records: records }));
    expect(r.insights.some((i) => i.text.includes("Gas safety certificate types"))).toBe(false);
  });

  it("electrical inspection type analysis when >= 3 records", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeElectrical({ id: `e${i}`, inspection_type: "eicr" }),
    );
    const r = computeElectricityGasSafety(baseInput({ electrical_inspection_records: records }));
    expect(r.insights.some((i) => i.text.includes("Electrical inspection types"))).toBe(true);
  });

  it("no electrical inspection type analysis when < 3 records", () => {
    const records = Array.from({ length: 2 }, (_, i) =>
      makeElectrical({ id: `e${i}` }),
    );
    const r = computeElectricityGasSafety(baseInput({ electrical_inspection_records: records }));
    expect(r.insights.some((i) => i.text.includes("Electrical inspection types"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 40. INSIGHTS — POSITIVE
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — positive", () => {
  it("positive insight for outstanding rating", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      total_staff: 3,
      pat_testing_records: [makePat({ defect_found: true, defect_resolved: true })],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
      co_detector_records: [makeCo()],
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1", assessed_by: "s1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2", assessed_by: "s2" }),
        makeChildSafety({ id: "cs3", child_id: "yp_3", assessed_by: "s3" }),
      ],
    }));
    expect(r.electrical_rating).toBe("outstanding");
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
  });

  it("positive insight for perfect PAT (100% testing + 100% pass)", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ result: "pass", test_overdue: false })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% pass rate"))).toBe(true);
  });

  it("positive insight for perfect gas (100% current + 100% satisfactory)", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({ expired: false, result: "satisfactory" })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("exemplary gas safety compliance"))).toBe(true);
  });

  it("positive insight for perfect electrical (100% current + 100% satisfactory)", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ inspection_overdue: false, result: "satisfactory" })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("fixed electrical installations fully meet"))).toBe(true);
  });

  it("positive insight for perfect CO detectors (100% tested + 100% functioning)", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ test_overdue: false, functioning: true })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("comprehensive CO protection"))).toBe(true);
  });

  it("positive insight for full child coverage + emergency procedure knowledge", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 1,
      child_safety_records: [makeChildSafety({ child_id: "yp_1", knows_emergency_procedure: true })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child has received safety awareness"))).toBe(true);
  });

  it("positive insight for 100% defect resolution", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ defect_found: true, defect_resolved: true })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("zero-tolerance"))).toBe(true);
  });

  it("positive insight for staff + child coverage >= 80%", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 5,
      total_staff: 5,
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1", assessed_by: "s1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2", assessed_by: "s2" }),
        makeChildSafety({ id: "cs3", child_id: "yp_3", assessed_by: "s3" }),
        makeChildSafety({ id: "cs4", child_id: "yp_4", assessed_by: "s4" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("staff involvement in safety education"))).toBe(true);
  });

  it("positive insight for perfect RCD + earthing + bonding", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({
        rcd_tested: true,
        rcd_operating_correctly: true,
        earthing_satisfactory: true,
        bonding_satisfactory: true,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("multiple layers of protection"))).toBe(true);
  });

  it("positive insight for perfect gas safety elements", () => {
    const r = computeElectricityGasSafety(baseInput({
      gas_certificate_records: [makeGas({
        flue_checked: true,
        ventilation_adequate: true,
        safety_device_operational: true,
        co_reading_acceptable: true,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("every element of gas safety"))).toBe(true);
  });

  it("positive insight for perfect CO detector positioning", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({
        positioned_correctly: true,
        near_gas_appliance: true,
        near_sleeping_area: true,
        audible_from_bedrooms: true,
      })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("placement strategy"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 41. HEADLINE
// ═══════════════════════════════════════════════════════════════════════════

describe("headline", () => {
  it("outstanding headline mentions outstanding", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      total_staff: 3,
      pat_testing_records: [makePat({ defect_found: true, defect_resolved: true })],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
      co_detector_records: [makeCo()],
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1", assessed_by: "s1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2", assessed_by: "s2" }),
        makeChildSafety({ id: "cs3", child_id: "yp_3", assessed_by: "s3" }),
      ],
    }));
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline mentions good", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
    }));
    expect(r.headline).toContain("Good");
  });

  it("adequate headline mentions adequate", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
    }));
    expect(r.headline).toContain("Adequate");
  });

  it("inadequate headline mentions inadequate", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true })],
      gas_certificate_records: [makeGas({ expired: true })],
      electrical_inspection_records: [makeElectrical({ inspection_overdue: true })],
      co_detector_records: [makeCo({ test_overdue: true })],
    }));
    expect(r.headline).toContain("inadequate");
  });

  it("good headline includes strength and concern counts", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
    }));
    expect(r.headline).toMatch(/\d+ strength/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 42. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles single record in each category", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat()],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
      co_detector_records: [makeCo()],
      child_safety_records: [makeChildSafety()],
    }));
    expect(r.electrical_rating).toBeDefined();
    expect(r.electrical_score).toBeGreaterThan(0);
  });

  it("handles large number of records", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: Array.from({ length: 100 }, (_, i) => makePat({ id: `p${i}` })),
      gas_certificate_records: Array.from({ length: 50 }, (_, i) => makeGas({ id: `g${i}` })),
      electrical_inspection_records: Array.from({ length: 20 }, (_, i) => makeElectrical({ id: `e${i}` })),
      co_detector_records: Array.from({ length: 30 }, (_, i) => makeCo({ id: `c${i}` })),
    }));
    expect(r.total_appliances_tested).toBe(100);
    expect(r.pat_testing_rate).toBe(100);
  });

  it("handles mixed valid and invalid records", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", result: "pass", test_overdue: false }),
        makePat({ id: "p2", result: "fail", test_overdue: true }),
        makePat({ id: "p3", result: "advisory", test_overdue: false }),
      ],
    }));
    expect(r.pat_testing_rate).toBe(67); // 2/3 current
    expect(r.pat_pass_rate).toBe(33); // 1/3 pass
  });

  it("child-accessible with fail counts for concern", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ child_accessible: true, result: "fail" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("child-accessible"))).toBe(true);
  });

  it("child-accessible with defect counts for concern", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ child_accessible: true, defect_found: true, result: "pass" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("child-accessible"))).toBe(true);
  });

  it("child-accessible without fail or defect does not trigger concern", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ child_accessible: true, result: "pass", defect_found: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("child-accessible"))).toBe(false);
  });

  it("battery_status dead counts same as low for concern", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ battery_status: "dead" })],
    }));
    expect(r.concerns.some((c) => c.includes("low or dead batteries"))).toBe(true);
  });

  it("battery_status good does not trigger concern", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ battery_status: "good" })],
    }));
    expect(r.concerns.some((c) => c.includes("low or dead batteries"))).toBe(false);
  });

  it("battery_status mains_powered does not trigger concern", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ battery_status: "mains_powered" })],
    }));
    expect(r.concerns.some((c) => c.includes("low or dead batteries"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 43. FULL SCENARIO — OUTSTANDING HOME
// ═══════════════════════════════════════════════════════════════════════════

describe("full scenario — outstanding home", () => {
  it("achieves outstanding with all metrics perfect", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      total_staff: 3,
      pat_testing_records: [
        makePat({ id: "p1", defect_found: true, defect_resolved: true }),
        makePat({ id: "p2" }),
      ],
      gas_certificate_records: [
        makeGas({ id: "g1", defects_found: true, defect_rectified: true }),
      ],
      electrical_inspection_records: [
        makeElectrical({ id: "e1" }),
      ],
      co_detector_records: [
        makeCo({ id: "c1" }),
      ],
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1", assessed_by: "s1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2", assessed_by: "s2" }),
        makeChildSafety({ id: "cs3", child_id: "yp_3", assessed_by: "s3" }),
      ],
    }));
    expect(r.electrical_rating).toBe("outstanding");
    expect(r.electrical_score).toBeGreaterThanOrEqual(80);
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.concerns).toHaveLength(0);
  });

  it("has positive insights and no critical insights", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      total_staff: 3,
      pat_testing_records: [makePat({ defect_found: true, defect_resolved: true })],
      gas_certificate_records: [makeGas()],
      electrical_inspection_records: [makeElectrical()],
      co_detector_records: [makeCo()],
      child_safety_records: [
        makeChildSafety({ id: "cs1", child_id: "yp_1", assessed_by: "s1" }),
        makeChildSafety({ id: "cs2", child_id: "yp_2", assessed_by: "s2" }),
        makeChildSafety({ id: "cs3", child_id: "yp_3", assessed_by: "s3" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    expect(r.insights.some((i) => i.severity === "critical")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 44. FULL SCENARIO — INADEQUATE HOME
// ═══════════════════════════════════════════════════════════════════════════

describe("full scenario — inadequate home", () => {
  it("achieves inadequate with all metrics failing", () => {
    const r = computeElectricityGasSafety(baseInput({
      total_children: 3,
      total_staff: 10,
      pat_testing_records: [
        makePat({ id: "p1", test_overdue: true, result: "fail", child_accessible: true, risk_rating: "high" }),
      ],
      gas_certificate_records: [
        makeGas({ id: "g1", expired: true, result: "immediately_dangerous", warning_notice_issued: true }),
      ],
      electrical_inspection_records: [
        makeElectrical({ id: "e1", inspection_overdue: true, c1_defects: 2, c2_defects: 3, total_defects: 5 }),
      ],
      co_detector_records: [
        makeCo({ id: "c1", test_overdue: true, functioning: false, battery_status: "dead", replacement_due: true, test_result: "fail" }),
      ],
    }));
    expect(r.electrical_rating).toBe("inadequate");
    expect(r.electrical_score).toBeLessThan(45);
    expect(r.concerns.length).toBeGreaterThan(5);
    expect(r.recommendations.length).toBeGreaterThan(5);
  });

  it("has critical insights and many recommendations", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ test_overdue: true, child_accessible: true, defect_found: true })],
      gas_certificate_records: [makeGas({ expired: true, result: "immediately_dangerous" })],
      electrical_inspection_records: [makeElectrical({ inspection_overdue: true, c1_defects: 1, total_defects: 1 })],
      co_detector_records: [makeCo({ test_overdue: true, functioning: false })],
    }));
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    expect(r.recommendations.length).toBeGreaterThan(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 45. PLURAL HANDLING
// ═══════════════════════════════════════════════════════════════════════════

describe("plural handling in concerns", () => {
  it("uses singular for 1 failed appliance", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [makePat({ result: "fail" })],
    }));
    expect(r.concerns.some((c) => c.includes("1 appliance has failed"))).toBe(true);
  });

  it("uses plural for 2+ failed appliances", () => {
    const r = computeElectricityGasSafety(baseInput({
      pat_testing_records: [
        makePat({ id: "p1", result: "fail" }),
        makePat({ id: "p2", result: "fail" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("2 appliances have failed"))).toBe(true);
  });

  it("uses singular for 1 overdue inspection", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [makeElectrical({ inspection_overdue: true })],
    }));
    expect(r.concerns.some((c) => c.includes("1 electrical inspection is overdue"))).toBe(true);
  });

  it("uses plural for 2+ overdue inspections", () => {
    const r = computeElectricityGasSafety(baseInput({
      electrical_inspection_records: [
        makeElectrical({ id: "e1", inspection_overdue: true }),
        makeElectrical({ id: "e2", inspection_overdue: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("2 electrical inspections are overdue"))).toBe(true);
  });

  it("uses singular for 1 non-functioning CO detector", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [makeCo({ functioning: false })],
    }));
    expect(r.concerns.some((c) => c.includes("1 CO detector is not functioning"))).toBe(true);
  });

  it("uses plural for 2+ non-functioning CO detectors", () => {
    const r = computeElectricityGasSafety(baseInput({
      co_detector_records: [
        makeCo({ id: "c1", functioning: false }),
        makeCo({ id: "c2", functioning: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("2 CO detectors are not functioning"))).toBe(true);
  });
});
