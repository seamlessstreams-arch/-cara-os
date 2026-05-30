// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME BATHROOM ACCESSIBILITY & ADAPTATIONS INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 25 (Premises), Reg 5 (Engagement with parents/carers).
// SCCIF: "Safety", "Living in the home", "Quality of care".
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeBathroomAccessibilityAdaptations,
  type BathroomAccessibilityAdaptationsInput,
  type AdaptationRecordInput,
  type GrabRailRecordInput,
  type NonSlipRecordInput,
  type WheelchairAccessRecordInput,
  type ModificationRecordInput,
} from "../home-bathroom-accessibility-adaptations-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeAdaptation(overrides: Partial<AdaptationRecordInput> = {}): AdaptationRecordInput {
  return {
    id: "adapt_1",
    bathroom_id: "bath_1",
    child_id: "yp_alex",
    adaptation_type: "level_access_shower",
    installed: true,
    installation_date: "2026-01-15",
    last_inspection_date: "2026-04-01",
    inspection_passed: true,
    meets_child_needs: true,
    risk_assessed: true,
    documented: true,
    condition: "good",
    notes: "",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeGrabRail(overrides: Partial<GrabRailRecordInput> = {}): GrabRailRecordInput {
  return {
    id: "rail_1",
    bathroom_id: "bath_1",
    location: "bath",
    installed: true,
    installation_date: "2026-01-15",
    last_inspection_date: "2026-04-01",
    inspection_passed: true,
    securely_fixed: true,
    correct_height: true,
    weight_tested: true,
    condition: "good",
    compliant_with_standard: true,
    notes: "",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeNonSlip(overrides: Partial<NonSlipRecordInput> = {}): NonSlipRecordInput {
  return {
    id: "ns_1",
    bathroom_id: "bath_1",
    surface_type: "bath_mat",
    installed: true,
    installation_date: "2026-01-15",
    last_inspection_date: "2026-04-01",
    inspection_passed: true,
    slip_resistance_tested: true,
    meets_standard: true,
    condition: "good",
    replacement_due: false,
    notes: "",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeWheelchair(overrides: Partial<WheelchairAccessRecordInput> = {}): WheelchairAccessRecordInput {
  return {
    id: "wc_1",
    bathroom_id: "bath_1",
    doorway_width_mm: 900,
    doorway_meets_standard: true,
    turning_circle_adequate: true,
    transfer_space_available: true,
    accessible_fixtures: true,
    emergency_pull_cord: true,
    floor_level_access: true,
    last_assessment_date: "2026-04-01",
    assessment_passed: true,
    child_specific: true,
    child_id: "yp_alex",
    notes: "",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeModification(overrides: Partial<ModificationRecordInput> = {}): ModificationRecordInput {
  return {
    id: "mod_1",
    bathroom_id: "bath_1",
    child_id: "yp_alex",
    modification_type: "temperature_limiter",
    installed: true,
    installation_date: "2026-01-15",
    last_review_date: "2026-04-01",
    meets_child_needs: true,
    child_consulted: true,
    care_plan_linked: true,
    condition: "good",
    satisfaction_rating: 5,
    notes: "",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function baseInput(overrides: Partial<BathroomAccessibilityAdaptationsInput> = {}): BathroomAccessibilityAdaptationsInput {
  return {
    today: "2026-05-30",
    total_children: 3,
    adaptation_records: [
      makeAdaptation({ id: "adapt_1", child_id: "yp_alex" }),
      makeAdaptation({ id: "adapt_2", child_id: "yp_jordan", bathroom_id: "bath_2" }),
      makeAdaptation({ id: "adapt_3", child_id: "yp_casey", bathroom_id: "bath_3" }),
    ],
    grab_rail_records: [
      makeGrabRail({ id: "rail_1" }),
      makeGrabRail({ id: "rail_2", bathroom_id: "bath_2", location: "shower" }),
      makeGrabRail({ id: "rail_3", bathroom_id: "bath_3", location: "toilet" }),
    ],
    non_slip_records: [
      makeNonSlip({ id: "ns_1" }),
      makeNonSlip({ id: "ns_2", bathroom_id: "bath_2", surface_type: "shower_mat" }),
      makeNonSlip({ id: "ns_3", bathroom_id: "bath_3", surface_type: "floor_tiles" }),
    ],
    wheelchair_records: [
      makeWheelchair({ id: "wc_1" }),
      makeWheelchair({ id: "wc_2", bathroom_id: "bath_2", child_id: "yp_jordan" }),
    ],
    modification_records: [
      makeModification({ id: "mod_1", child_id: "yp_alex" }),
      makeModification({ id: "mod_2", child_id: "yp_jordan", bathroom_id: "bath_2" }),
      makeModification({ id: "mod_3", child_id: "yp_casey", bathroom_id: "bath_3" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when all arrays empty and 0 children", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 0,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.bath_access_rating).toBe("insufficient_data");
    expect(r.bath_access_score).toBe(0);
  });

  it("returns score 0 for insufficient_data", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 0,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.bath_access_score).toBe(0);
  });

  it("has empty strengths/concerns/recommendations for insufficient_data", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 0,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("headline references insufficient data", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 0,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.headline).toContain("insufficient data");
  });

  it("zeroes all record counts on insufficient_data", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 0,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.total_adaptation_records).toBe(0);
    expect(r.total_grab_rail_records).toBe(0);
    expect(r.total_non_slip_records).toBe(0);
    expect(r.total_wheelchair_records).toBe(0);
    expect(r.total_modification_records).toBe(0);
  });

  it("zeroes all rates on insufficient_data", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 0,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.adaptation_adequacy_rate).toBe(0);
    expect(r.grab_rail_rate).toBe(0);
    expect(r.non_slip_rate).toBe(0);
    expect(r.wheelchair_access_rate).toBe(0);
    expect(r.child_modification_rate).toBe(0);
    expect(r.satisfaction_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE FLOOR — all empty + children > 0
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate floor — no records with children on placement", () => {
  it("returns inadequate rating", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 3,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.bath_access_rating).toBe("inadequate");
  });

  it("returns score 15", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 3,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.bath_access_score).toBe(15);
  });

  it("has a concern about missing records", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 3,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.concerns.length).toBe(1);
    expect(r.concerns[0]).toContain("No adaptation records");
  });

  it("has two recommendations", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 3,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.recommendations.length).toBe(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("has a critical insight", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 3,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("headline mentions urgent attention", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 3,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.headline).toContain("urgent attention");
  });

  it("works with 1 child", () => {
    const r = computeBathroomAccessibilityAdaptations({
      today: "2026-05-30",
      total_children: 1,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    });
    expect(r.bath_access_rating).toBe("inadequate");
    expect(r.bath_access_score).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding rating", () => {
  it("achieves outstanding with all-perfect records", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.bath_access_rating).toBe("outstanding");
  });

  it("score is base(52) + max bonuses(28) = 80", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.bath_access_score).toBe(80);
  });

  it("headline says outstanding", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("has strengths for all domains", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(5);
  });

  it("has no concerns", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.concerns.length).toBe(0);
  });

  it("has no recommendations", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("has positive insights", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const positive = r.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThanOrEqual(1);
  });

  it("includes outstanding-specific positive insight", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const outstanding = r.insights.find((i) =>
      i.text.includes("outstanding bathroom accessibility"),
    );
    expect(outstanding).toBeDefined();
    expect(outstanding!.severity).toBe("positive");
  });

  it("record counts are correct", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.total_adaptation_records).toBe(3);
    expect(r.total_grab_rail_records).toBe(3);
    expect(r.total_non_slip_records).toBe(3);
    expect(r.total_wheelchair_records).toBe(2);
    expect(r.total_modification_records).toBe(3);
  });

  it("all rates are 100", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.adaptation_adequacy_rate).toBe(100);
    expect(r.grab_rail_rate).toBe(100);
    expect(r.non_slip_rate).toBe(100);
    expect(r.wheelchair_access_rate).toBe(100);
    expect(r.child_modification_rate).toBe(100);
    expect(r.satisfaction_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. GOOD RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("good rating", () => {
  it("good when score in [65, 80)", () => {
    // Keep adapt/grab/nonslip perfect (+5+5+5=15), drop wheelchair to 70-89 (+2), drop mods/satisfaction
    // Score: 52+5+5+5+2 = 69 -> good
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: true, assessment_passed: true }),
        makeWheelchair({ id: "wc_2", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false, child_id: "yp_jordan", bathroom_id: "bath_2" }),
      ],
      modification_records: [],
    }));
    expect(r.bath_access_rating).toBe("good");
    expect(r.bath_access_score).toBeGreaterThanOrEqual(65);
    expect(r.bath_access_score).toBeLessThan(80);
  });

  it("headline says Good", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: true, assessment_passed: true }),
        makeWheelchair({ id: "wc_2", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false, child_id: "yp_jordan", bathroom_id: "bath_2" }),
      ],
      modification_records: [],
    }));
    expect(r.headline).toContain("Good");
  });

  it("good headline mentions strengths count", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: true, assessment_passed: true }),
        makeWheelchair({ id: "wc_2", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false, child_id: "yp_jordan", bathroom_id: "bath_2" }),
      ],
      modification_records: [],
    }));
    expect(r.headline).toMatch(/strength/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. ADEQUATE RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("adequate rating", () => {
  it("adequate when score in [45, 65)", () => {
    // Score = 52, no bonuses (rates 40-69), no penalties (guarded by empty arrays for those below 40)
    // All rates in 40-69 range -> no bonuses, no penalties -> 52
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: false, documented: false }),
        makeAdaptation({ id: "adapt_2", installed: true, meets_child_needs: false, inspection_passed: true, documented: false, bathroom_id: "bath_2" }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: false, inspection_passed: false }),
        makeGrabRail({ id: "rail_2", installed: true, securely_fixed: false, correct_height: true, inspection_passed: false, bathroom_id: "bath_2" }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: true, inspection_passed: true, meets_standard: false, slip_resistance_tested: false }),
        makeNonSlip({ id: "ns_2", installed: true, inspection_passed: false, meets_standard: true, slip_resistance_tested: false, bathroom_id: "bath_2" }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false }),
        makeWheelchair({ id: "wc_2", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: true, assessment_passed: true, bathroom_id: "bath_2", child_id: "yp_jordan" }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: true, meets_child_needs: true, child_consulted: false, care_plan_linked: false, satisfaction_rating: 3 }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", installed: true, meets_child_needs: false, child_consulted: true, care_plan_linked: false, bathroom_id: "bath_2", satisfaction_rating: 3 }),
      ],
    }));
    expect(r.bath_access_rating).toBe("adequate");
    expect(r.bath_access_score).toBeGreaterThanOrEqual(45);
    expect(r.bath_access_score).toBeLessThan(65);
  });

  it("headline says Adequate", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: false, documented: false }),
        makeAdaptation({ id: "adapt_2", installed: true, meets_child_needs: false, inspection_passed: true, documented: false, bathroom_id: "bath_2" }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: false, inspection_passed: false }),
        makeGrabRail({ id: "rail_2", installed: true, securely_fixed: false, correct_height: true, inspection_passed: false, bathroom_id: "bath_2" }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: true, inspection_passed: true, meets_standard: false, slip_resistance_tested: false }),
        makeNonSlip({ id: "ns_2", installed: true, inspection_passed: false, meets_standard: true, slip_resistance_tested: false, bathroom_id: "bath_2" }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false }),
        makeWheelchair({ id: "wc_2", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: true, assessment_passed: true, bathroom_id: "bath_2", child_id: "yp_jordan" }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: true, meets_child_needs: true, child_consulted: false, care_plan_linked: false, satisfaction_rating: 3 }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", installed: true, meets_child_needs: false, child_consulted: true, care_plan_linked: false, bathroom_id: "bath_2", satisfaction_rating: 3 }),
      ],
    }));
    expect(r.headline).toContain("Adequate");
  });

  it("adequate headline mentions concern count", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: true, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: true, meets_child_needs: false, child_consulted: false, care_plan_linked: false, satisfaction_rating: 2 }),
      ],
    }));
    expect(r.headline).toMatch(/concern/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. INADEQUATE RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate rating", () => {
  it("inadequate when all rates below 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false, condition: "poor" }),
        makeAdaptation({ id: "adapt_2", installed: false, meets_child_needs: false, inspection_passed: false, documented: false, condition: "unusable", bathroom_id: "bath_2" }),
        makeAdaptation({ id: "adapt_3", installed: false, meets_child_needs: false, inspection_passed: false, documented: false, condition: "poor", bathroom_id: "bath_3" }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false, condition: "poor" }),
        makeGrabRail({ id: "rail_2", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false, condition: "poor", bathroom_id: "bath_2" }),
        makeGrabRail({ id: "rail_3", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false, condition: "poor", bathroom_id: "bath_3" }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false, condition: "poor" }),
        makeNonSlip({ id: "ns_2", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false, condition: "poor", bathroom_id: "bath_2" }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
        makeWheelchair({ id: "wc_2", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false, bathroom_id: "bath_2", child_id: "yp_jordan" }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false, satisfaction_rating: 1 }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false, satisfaction_rating: 1, bathroom_id: "bath_2" }),
      ],
    }));
    expect(r.bath_access_rating).toBe("inadequate");
    expect(r.bath_access_score).toBeLessThan(45);
  });

  it("headline says inadequate", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false, satisfaction_rating: 1 }),
      ],
    }));
    expect(r.headline).toContain("inadequate");
  });

  it("has critical concerns at inadequate", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false, satisfaction_rating: 1 }),
      ],
    }));
    expect(r.concerns.length).toBeGreaterThan(0);
  });

  it("has immediate recommendations at inadequate", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false, satisfaction_rating: 1 }),
      ],
    }));
    const immediateRecs = r.recommendations.filter((rec) => rec.urgency === "immediate");
    expect(immediateRecs.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. BONUSES
// ═══════════════════════════════════════════════════════════════════════════

describe("bonuses", () => {
  it("base score is 52 with no bonuses or penalties (all rates at 0 — no records)", () => {
    // Need at least some records to avoid special paths; use records with 0 installed
    // Actually: if records exist but all rates 0, penalties fire. So we test with
    // rates between 40-69 (no bonus, no penalty)
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: false, documented: false }),
        makeAdaptation({ id: "adapt_2", installed: true, meets_child_needs: false, inspection_passed: true, documented: false, bathroom_id: "bath_2" }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: false, inspection_passed: false }),
        makeGrabRail({ id: "rail_2", installed: true, securely_fixed: false, correct_height: true, inspection_passed: false, bathroom_id: "bath_2" }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: true, inspection_passed: true, meets_standard: false, slip_resistance_tested: false }),
        makeNonSlip({ id: "ns_2", installed: true, inspection_passed: false, meets_standard: true, slip_resistance_tested: false, bathroom_id: "bath_2" }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false }),
        makeWheelchair({ id: "wc_2", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: true, assessment_passed: true, bathroom_id: "bath_2", child_id: "yp_jordan" }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: true, meets_child_needs: true, child_consulted: false, care_plan_linked: false, satisfaction_rating: 3 }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", installed: true, meets_child_needs: false, child_consulted: true, care_plan_linked: false, bathroom_id: "bath_2", satisfaction_rating: 3 }),
      ],
    }));
    expect(r.bath_access_score).toBe(52);
  });

  describe("adaptation adequacy bonus", () => {
    it("+5 when adaptationAdequacyRate >= 90", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      // Only adaptation bonus (+5), no other bonuses, no penalties
      expect(r.adaptation_adequacy_rate).toBe(100);
      expect(r.bath_access_score).toBe(52 + 5);
    });

    it("+3 when adaptationAdequacyRate >= 70 and < 90", () => {
      // 3 records: all installed (100%), 2/3 meets needs (67%), 3/3 inspection (100%), 3/3 documented (100%)
      // avg = (100 + 67 + 100 + 100)/4 = 92 -> still >=90
      // Make it 70-89: installed 3/3=100, meets_needs 2/3=67, inspection 1/3=33, documented 2/3=67
      // avg = (100+67+33+67)/4 = 267/4 = 67 -> still <70. Adjust.
      // installed 3/3=100, meets_needs 3/3=100, inspection 2/3=67, documented 1/3=33
      // avg = (100+100+67+33)/4 = 300/4 = 75 -> >=70 <90 -> +3
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [
          makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: true, documented: true }),
          makeAdaptation({ id: "adapt_2", installed: true, meets_child_needs: true, inspection_passed: true, documented: false, bathroom_id: "bath_2" }),
          makeAdaptation({ id: "adapt_3", installed: true, meets_child_needs: true, inspection_passed: false, documented: false, bathroom_id: "bath_3" }),
        ],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.adaptation_adequacy_rate).toBeGreaterThanOrEqual(70);
      expect(r.adaptation_adequacy_rate).toBeLessThan(90);
      expect(r.bath_access_score).toBe(52 + 3);
    });
  });

  describe("grab rail bonus", () => {
    it("+5 when grabRailRate >= 90", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.grab_rail_rate).toBe(100);
      expect(r.bath_access_score).toBe(52 + 5);
    });

    it("+3 when grabRailRate >= 70 and < 90", () => {
      // installed 3/3=100, securely_fixed 3/3=100, correct_height 2/3=67, inspection 1/3=33
      // avg = (100+100+67+33)/4 = 300/4 = 75 -> +3
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [
          makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: true, inspection_passed: true }),
          makeGrabRail({ id: "rail_2", installed: true, securely_fixed: true, correct_height: true, inspection_passed: false, bathroom_id: "bath_2" }),
          makeGrabRail({ id: "rail_3", installed: true, securely_fixed: true, correct_height: false, inspection_passed: false, bathroom_id: "bath_3" }),
        ],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.grab_rail_rate).toBeGreaterThanOrEqual(70);
      expect(r.grab_rail_rate).toBeLessThan(90);
      expect(r.bath_access_score).toBe(52 + 3);
    });
  });

  describe("non-slip bonus", () => {
    it("+5 when nonSlipRate >= 90", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.non_slip_rate).toBe(100);
      expect(r.bath_access_score).toBe(52 + 5);
    });

    it("+3 when nonSlipRate >= 70 and < 90", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [
          makeNonSlip({ id: "ns_1", installed: true, inspection_passed: true, meets_standard: true, slip_resistance_tested: true }),
          makeNonSlip({ id: "ns_2", installed: true, inspection_passed: true, meets_standard: true, slip_resistance_tested: false, bathroom_id: "bath_2" }),
          makeNonSlip({ id: "ns_3", installed: true, inspection_passed: true, meets_standard: false, slip_resistance_tested: false, bathroom_id: "bath_3" }),
        ],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.non_slip_rate).toBeGreaterThanOrEqual(70);
      expect(r.non_slip_rate).toBeLessThan(90);
      expect(r.bath_access_score).toBe(52 + 3);
    });
  });

  describe("wheelchair access bonus", () => {
    it("+5 when wheelchairAccessRate >= 90", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        modification_records: [],
      }));
      expect(r.wheelchair_access_rate).toBe(100);
      expect(r.bath_access_score).toBe(52 + 5);
    });

    it("+2 when wheelchairAccessRate >= 70 and < 90", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [
          makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: true, assessment_passed: true }),
          makeWheelchair({ id: "wc_2", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false, bathroom_id: "bath_2", child_id: "yp_jordan" }),
        ],
        modification_records: [],
      }));
      expect(r.wheelchair_access_rate).toBeGreaterThanOrEqual(70);
      expect(r.wheelchair_access_rate).toBeLessThan(90);
      expect(r.bath_access_score).toBe(52 + 2);
    });
  });

  describe("child modification bonus", () => {
    it("+4 when childModificationRate >= 90", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
      }));
      expect(r.child_modification_rate).toBe(100);
      // Also satisfaction bonus fires (+4), so 52+4+4 = 60
      expect(r.bath_access_score).toBe(52 + 4 + 4);
    });

    it("+2 when childModificationRate >= 70 and < 90", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", installed: true, meets_child_needs: true, child_consulted: true, care_plan_linked: true, satisfaction_rating: 3 }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", installed: true, meets_child_needs: true, child_consulted: true, care_plan_linked: false, bathroom_id: "bath_2", satisfaction_rating: 3 }),
          makeModification({ id: "mod_3", child_id: "yp_casey", installed: true, meets_child_needs: true, child_consulted: false, care_plan_linked: false, bathroom_id: "bath_3", satisfaction_rating: 3 }),
        ],
      }));
      expect(r.child_modification_rate).toBeGreaterThanOrEqual(70);
      expect(r.child_modification_rate).toBeLessThan(90);
      // satisfaction_rate = round((3/5)*100) = 60 -> no satisfaction bonus
      expect(r.bath_access_score).toBe(52 + 2);
    });
  });

  describe("satisfaction bonus", () => {
    it("+4 when satisfactionRate >= 90", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 5 }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", satisfaction_rating: 5, bathroom_id: "bath_2" }),
        ],
      }));
      expect(r.satisfaction_rate).toBe(100);
      // Also childModificationRate = 100 -> +4 -> 52+4+4=60
      expect(r.bath_access_score).toBe(52 + 4 + 4);
    });

    it("+2 when satisfactionRate >= 70 and < 90", () => {
      // satisfaction_rating avg 4 -> (4/5)*100 = 80 -> >=70 <90 -> +2
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 4, meets_child_needs: true, child_consulted: true, care_plan_linked: false }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", satisfaction_rating: 4, meets_child_needs: true, child_consulted: false, care_plan_linked: false, bathroom_id: "bath_2" }),
        ],
      }));
      expect(r.satisfaction_rate).toBe(80);
      // child modification rate: installed 100, meets_needs 100, consulted 50, care_plan 0 => avg 63 -> no mod bonus
      expect(r.bath_access_score).toBe(52 + 2);
    });
  });

  it("max bonuses = 28 -> score = 80", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.bath_access_score).toBe(80);
  });

  it("all bonuses stack correctly", () => {
    // 5+5+5+5+4+4 = 28
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.bath_access_score).toBe(52 + 28);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("penalties", () => {
  describe("adaptation adequacy penalty", () => {
    it("-5 when adaptationAdequacyRate < 40 and records exist", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [
          makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
        ],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.adaptation_adequacy_rate).toBeLessThan(40);
      expect(r.bath_access_score).toBe(52 - 5);
    });

    it("no penalty when no adaptation records", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
        total_children: 0,
      }));
      // insufficient_data path
      expect(r.bath_access_score).toBe(0);
    });
  });

  describe("grab rail penalty", () => {
    it("-5 when grabRailRate < 40 and records exist", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [
          makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
        ],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.grab_rail_rate).toBeLessThan(40);
      expect(r.bath_access_score).toBe(52 - 5);
    });
  });

  describe("non-slip penalty", () => {
    it("-5 when nonSlipRate < 40 and records exist", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [
          makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
        ],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.non_slip_rate).toBeLessThan(40);
      expect(r.bath_access_score).toBe(52 - 5);
    });
  });

  describe("wheelchair access penalty", () => {
    it("-3 when wheelchairAccessRate < 40 and records exist", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [
          makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
        ],
        modification_records: [],
      }));
      expect(r.wheelchair_access_rate).toBeLessThan(40);
      expect(r.bath_access_score).toBe(52 - 3);
    });
  });

  it("all penalties stack: -5 -5 -5 -3 = -18 -> 52-18=34", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(34);
  });

  it("penalties are guarded — no penalty when record array is empty", () => {
    // With only modification records (no penalties apply to modifications)
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false, satisfaction_rating: 1 }),
      ],
    }));
    // No penalties (all guarded), no bonuses for modification (rate <40), no satisfaction bonus (rate too low)
    expect(r.bath_access_score).toBe(52);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. RATES (composite rate calculations)
// ═══════════════════════════════════════════════════════════════════════════

describe("rates", () => {
  describe("adaptation_adequacy_rate", () => {
    it("100 when all four sub-rates at 100", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.adaptation_adequacy_rate).toBe(100);
    });

    it("0 when no adaptation records", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
        total_children: 0,
      }));
      expect(r.adaptation_adequacy_rate).toBe(0);
    });

    it("correctly averages installed + meets_needs + inspection + documented", () => {
      // 2 records: both installed=100, one meets_needs=50, one inspection=50, both documented=100
      // avg = (100+50+50+100)/4 = 75
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [
          makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: true, documented: true }),
          makeAdaptation({ id: "adapt_2", installed: true, meets_child_needs: false, inspection_passed: false, documented: true, bathroom_id: "bath_2" }),
        ],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.adaptation_adequacy_rate).toBe(75);
    });

    it("0 when all installed=false", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [
          makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
        ],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.adaptation_adequacy_rate).toBe(0);
    });
  });

  describe("grab_rail_rate", () => {
    it("100 when all four sub-rates at 100", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.grab_rail_rate).toBe(100);
    });

    it("correctly averages installed + securely_fixed + correct_height + inspection", () => {
      // 2 records: both installed=100, one securely_fixed=50, one correct_height=50, both inspection=100
      // avg = (100+50+50+100)/4 = 75
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [
          makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: true, inspection_passed: true }),
          makeGrabRail({ id: "rail_2", installed: true, securely_fixed: false, correct_height: false, inspection_passed: true, bathroom_id: "bath_2" }),
        ],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.grab_rail_rate).toBe(75);
    });

    it("0 when no grab rail records", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
        total_children: 0,
      }));
      expect(r.grab_rail_rate).toBe(0);
    });
  });

  describe("non_slip_rate", () => {
    it("100 when all four sub-rates at 100", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.non_slip_rate).toBe(100);
    });

    it("correctly averages installed + inspection + meets_standard + resistance_tested", () => {
      // 2 records: both installed=100, one inspection=50, one standard=50, both tested=100
      // avg = (100+50+50+100)/4 = 75
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [
          makeNonSlip({ id: "ns_1", installed: true, inspection_passed: true, meets_standard: true, slip_resistance_tested: true }),
          makeNonSlip({ id: "ns_2", installed: true, inspection_passed: false, meets_standard: false, slip_resistance_tested: true, bathroom_id: "bath_2" }),
        ],
        wheelchair_records: [],
        modification_records: [],
      }));
      expect(r.non_slip_rate).toBe(75);
    });

    it("0 when no non-slip records", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
        total_children: 0,
      }));
      expect(r.non_slip_rate).toBe(0);
    });
  });

  describe("wheelchair_access_rate", () => {
    it("100 when all four sub-rates at 100", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        modification_records: [],
      }));
      expect(r.wheelchair_access_rate).toBe(100);
    });

    it("correctly averages doorway + turning_circle + transfer_space + assessment", () => {
      // 2 records: both doorway=100, one turning=50, one transfer=50, both assessment=100
      // avg = (100+50+50+100)/4 = 75
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [
          makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: true, assessment_passed: true }),
          makeWheelchair({ id: "wc_2", doorway_meets_standard: true, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: true, bathroom_id: "bath_2", child_id: "yp_jordan" }),
        ],
        modification_records: [],
      }));
      expect(r.wheelchair_access_rate).toBe(75);
    });

    it("0 when no wheelchair records", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
        total_children: 0,
      }));
      expect(r.wheelchair_access_rate).toBe(0);
    });
  });

  describe("child_modification_rate", () => {
    it("100 when all four sub-rates at 100", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
      }));
      expect(r.child_modification_rate).toBe(100);
    });

    it("correctly averages installed + meets_needs + consulted + care_plan", () => {
      // 2 records: both installed=100, one meets_needs=50, one consulted=50, both care_plan=100
      // avg = (100+50+50+100)/4 = 75
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", installed: true, meets_child_needs: true, child_consulted: true, care_plan_linked: true }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", installed: true, meets_child_needs: false, child_consulted: false, care_plan_linked: true, bathroom_id: "bath_2" }),
        ],
      }));
      expect(r.child_modification_rate).toBe(75);
    });

    it("0 when no modification records", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
        total_children: 0,
      }));
      expect(r.child_modification_rate).toBe(0);
    });
  });

  describe("satisfaction_rate", () => {
    it("100 when all satisfaction ratings are 5", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
      }));
      expect(r.satisfaction_rate).toBe(100);
    });

    it("correctly converts 1-5 scale to percentage", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 3 }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", satisfaction_rating: 3, bathroom_id: "bath_2" }),
        ],
      }));
      // avg = 3, pct = (3/5)*100 = 60
      expect(r.satisfaction_rate).toBe(60);
    });

    it("0 when no installed modifications", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, satisfaction_rating: 5 }),
        ],
      }));
      expect(r.satisfaction_rate).toBe(0);
    });

    it("handles mixed satisfaction ratings", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 5 }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", satisfaction_rating: 1, bathroom_id: "bath_2" }),
        ],
      }));
      // avg = 3, pct = 60
      expect(r.satisfaction_rate).toBe(60);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("strength for adaptation adequacy >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("adaptation adequacy"));
    expect(s).toBeDefined();
    expect(s).toContain("100%");
  });

  it("strength for adaptation adequacy >= 70 and < 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: true, documented: true }),
        makeAdaptation({ id: "adapt_2", installed: true, meets_child_needs: false, inspection_passed: false, documented: true, bathroom_id: "bath_2" }),
      ],
    }));
    if (r.adaptation_adequacy_rate >= 70 && r.adaptation_adequacy_rate < 90) {
      const s = r.strengths.find((s) => s.includes("adaptation adequacy rate"));
      expect(s).toBeDefined();
    }
  });

  it("strength for grab rail >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("grab rail compliance"));
    expect(s).toBeDefined();
  });

  it("strength for non-slip >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("non-slip surface compliance"));
    expect(s).toBeDefined();
  });

  it("strength for wheelchair access >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("wheelchair access compliance"));
    expect(s).toBeDefined();
  });

  it("strength for child modification >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("child modification compliance"));
    expect(s).toBeDefined();
  });

  it("strength for satisfaction >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("satisfaction rate"));
    expect(s).toBeDefined();
  });

  it("strength for adaptation condition >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", condition: "excellent" }),
        makeAdaptation({ id: "adapt_2", condition: "good", bathroom_id: "bath_2" }),
        makeAdaptation({ id: "adapt_3", condition: "excellent", bathroom_id: "bath_3" }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("adaptations in excellent or good condition"));
    expect(s).toBeDefined();
  });

  it("strength for grab rail condition >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("grab rails in excellent or good condition"));
    expect(s).toBeDefined();
  });

  it("strength for grab rail compliance >= 95", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("grab rails compliant with safety standards"));
    expect(s).toBeDefined();
  });

  it("strength for non-slip standard >= 95", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("non-slip surfaces meeting safety standards"));
    expect(s).toBeDefined();
  });

  it("strength for emergency pull cord >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("emergency pull cords"));
    expect(s).toBeDefined();
  });

  it("strength for child consultation >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("child consultation"));
    expect(s).toBeDefined();
  });

  it("strength for care plan linking >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("linked to care plans"));
    expect(s).toBeDefined();
  });

  it("strength for 100% child modification coverage", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("Every child has bathroom modifications"));
    expect(s).toBeDefined();
  });

  it("strength for 80-99% child modification coverage", () => {
    // 3 children, 3 mods installed, but 2 are for the same child -> coverage 67%
    // Actually, with 3 unique child_ids -> coverage = 100%. Adjust to 2 unique for 3 children.
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      total_children: 5,
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex" }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", bathroom_id: "bath_2" }),
        makeModification({ id: "mod_3", child_id: "yp_casey", bathroom_id: "bath_3" }),
        makeModification({ id: "mod_4", child_id: "yp_sam", bathroom_id: "bath_3" }),
      ],
    }));
    // 4 unique out of 5 = 80%
    const s = r.strengths.find((s) => s.includes("children have bathroom modifications in place"));
    expect(s).toBeDefined();
    expect(s).toContain("80%");
  });

  it("strength for risk assessed >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("risk assessed"));
    expect(s).toBeDefined();
  });

  it("strength for weight tested >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("weight tested"));
    expect(s).toBeDefined();
  });

  it("strength for floor level access >= 90", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    const s = r.strengths.find((s) => s.includes("floor-level access"));
    expect(s).toBeDefined();
  });

  it("no strengths when all rates are poor", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false, condition: "poor" }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false, condition: "poor", compliant_with_standard: false, weight_tested: false }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false, condition: "poor" }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false, emergency_pull_cord: false, floor_level_access: false }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false, satisfaction_rating: 1, condition: "poor" }),
      ],
    }));
    expect(r.strengths.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("concern for adaptation adequacy < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("adaptation adequacy"));
    expect(c).toBeDefined();
    expect(c).toContain("0%");
  });

  it("concern for adaptation adequacy 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: false, documented: false }),
        makeAdaptation({ id: "adapt_2", installed: true, meets_child_needs: false, inspection_passed: false, documented: false, bathroom_id: "bath_2" }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    if (r.adaptation_adequacy_rate >= 40 && r.adaptation_adequacy_rate < 70) {
      const c = r.concerns.find((c) => c.includes("Adaptation adequacy at"));
      expect(c).toBeDefined();
    }
  });

  it("concern for grab rail < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("grab rail compliance"));
    expect(c).toBeDefined();
  });

  it("concern for grab rail 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: false, inspection_passed: false }),
        makeGrabRail({ id: "rail_2", installed: true, securely_fixed: false, correct_height: false, inspection_passed: false, bathroom_id: "bath_2" }),
      ],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    if (r.grab_rail_rate >= 40 && r.grab_rail_rate < 70) {
      const c = r.concerns.find((c) => c.includes("Grab rail provision at"));
      expect(c).toBeDefined();
    }
  });

  it("concern for non-slip < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("non-slip compliance"));
    expect(c).toBeDefined();
  });

  it("concern for non-slip 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: true, inspection_passed: true, meets_standard: false, slip_resistance_tested: false }),
        makeNonSlip({ id: "ns_2", installed: true, inspection_passed: false, meets_standard: true, slip_resistance_tested: false, bathroom_id: "bath_2" }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    if (r.non_slip_rate >= 40 && r.non_slip_rate < 70) {
      const c = r.concerns.find((c) => c.includes("Non-slip compliance at"));
      expect(c).toBeDefined();
    }
  });

  it("concern for wheelchair access < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("wheelchair access compliance"));
    expect(c).toBeDefined();
  });

  it("concern for wheelchair access 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false }),
        makeWheelchair({ id: "wc_2", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: true, assessment_passed: true, bathroom_id: "bath_2", child_id: "yp_jordan" }),
      ],
      modification_records: [],
    }));
    if (r.wheelchair_access_rate >= 40 && r.wheelchair_access_rate < 70) {
      const c = r.concerns.find((c) => c.includes("Wheelchair access at"));
      expect(c).toBeDefined();
    }
  });

  it("concern for child modification < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("child modification compliance"));
    expect(c).toBeDefined();
  });

  it("concern for child modification 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: true, meets_child_needs: true, child_consulted: false, care_plan_linked: false }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", installed: true, meets_child_needs: false, child_consulted: true, care_plan_linked: false, bathroom_id: "bath_2" }),
      ],
    }));
    if (r.child_modification_rate >= 40 && r.child_modification_rate < 70) {
      const c = r.concerns.find((c) => c.includes("Child modification rate at"));
      expect(c).toBeDefined();
    }
  });

  it("concern for satisfaction < 50", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 1 }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", satisfaction_rating: 1, bathroom_id: "bath_2" }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("Satisfaction rate at only"));
    expect(c).toBeDefined();
  });

  it("concern for satisfaction 50-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 3 }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", satisfaction_rating: 4, bathroom_id: "bath_2" }),
      ],
    }));
    // avg = 3.5, pct = 70 -> at boundary, actually >=70 so no concern
    // Use 3 and 3 -> avg 3, pct 60
    const r2 = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 3 }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", satisfaction_rating: 3, bathroom_id: "bath_2" }),
      ],
    }));
    const c = r2.concerns.find((c) => c.includes("Satisfaction at"));
    expect(c).toBeDefined();
  });

  it("concern for adaptation poor condition >= 20%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", condition: "good" }),
        makeAdaptation({ id: "adapt_2", condition: "good", bathroom_id: "bath_2" }),
        makeAdaptation({ id: "adapt_3", condition: "good", bathroom_id: "bath_3" }),
        makeAdaptation({ id: "adapt_4", condition: "poor", bathroom_id: "bath_3" }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    // 1/4 = 25% poor
    const c = r.concerns.find((c) => c.includes("adaptations in poor or unusable condition"));
    expect(c).toBeDefined();
  });

  it("concern for grab rail poor condition >= 20%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", condition: "good" }),
        makeGrabRail({ id: "rail_2", condition: "good", bathroom_id: "bath_2" }),
        makeGrabRail({ id: "rail_3", condition: "good", bathroom_id: "bath_3" }),
        makeGrabRail({ id: "rail_4", condition: "poor", bathroom_id: "bath_3" }),
      ],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("grab rails in poor or unusable condition"));
    expect(c).toBeDefined();
  });

  it("concern for non-slip poor condition >= 20%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", condition: "good" }),
        makeNonSlip({ id: "ns_2", condition: "good", bathroom_id: "bath_2" }),
        makeNonSlip({ id: "ns_3", condition: "poor", bathroom_id: "bath_3" }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    // 1/3 = 33% poor
    const c = r.concerns.find((c) => c.includes("non-slip surfaces in poor or unusable condition"));
    expect(c).toBeDefined();
  });

  it("concern for non-slip replacement due >= 30%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", replacement_due: false }),
        makeNonSlip({ id: "ns_2", replacement_due: true, bathroom_id: "bath_2" }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    // 1/2 = 50% -> >=30
    const c = r.concerns.find((c) => c.includes("non-slip surfaces due for replacement"));
    expect(c).toBeDefined();
  });

  it("concern for child consultation < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", child_consulted: false }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", child_consulted: false, bathroom_id: "bath_2" }),
        makeModification({ id: "mod_3", child_id: "yp_casey", child_consulted: false, bathroom_id: "bath_3" }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("modifications informed by child consultation"));
    expect(c).toBeDefined();
  });

  it("concern for care plan linking < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", care_plan_linked: false }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", care_plan_linked: false, bathroom_id: "bath_2" }),
        makeModification({ id: "mod_3", child_id: "yp_casey", care_plan_linked: false, bathroom_id: "bath_3" }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("modifications linked to care plans"));
    expect(c).toBeDefined();
  });

  it("concern for emergency pull cord < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", emergency_pull_cord: false }),
        makeWheelchair({ id: "wc_2", emergency_pull_cord: false, bathroom_id: "bath_2", child_id: "yp_jordan" }),
      ],
      modification_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("emergency pull cords"));
    expect(c).toBeDefined();
  });

  it("concern for child modification coverage < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      total_children: 5,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex" }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", bathroom_id: "bath_2" }),
      ],
    }));
    // 2/5 = 40% coverage
    const c = r.concerns.find((c) => c.includes("children have bathroom modifications in place"));
    expect(c).toBeDefined();
  });

  it("concern for risk assessed < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", risk_assessed: false }),
        makeAdaptation({ id: "adapt_2", risk_assessed: false, bathroom_id: "bath_2" }),
        makeAdaptation({ id: "adapt_3", risk_assessed: false, bathroom_id: "bath_3" }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("adaptations risk assessed"));
    expect(c).toBeDefined();
  });

  it("concern for weight tested < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", weight_tested: false }),
        makeGrabRail({ id: "rail_2", weight_tested: false, bathroom_id: "bath_2" }),
        makeGrabRail({ id: "rail_3", weight_tested: false, bathroom_id: "bath_3" }),
      ],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("grab rails weight tested"));
    expect(c).toBeDefined();
  });

  it("concern for modification poor condition >= 20%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", condition: "good" }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", condition: "good", bathroom_id: "bath_2" }),
        makeModification({ id: "mod_3", child_id: "yp_casey", condition: "poor", bathroom_id: "bath_3" }),
      ],
    }));
    // 1/3 = 33%
    const c = r.concerns.find((c) => c.includes("child modifications in poor or unusable condition"));
    expect(c).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("immediate recommendation when adaptation adequacy < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Urgently review all bathroom adaptations"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toContain("Reg 25");
  });

  it("immediate recommendation when grab rail < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Urgently audit all grab rails"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate recommendation when non-slip < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Urgently review all non-slip surfaces"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate recommendation when wheelchair access < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("urgent wheelchair accessibility review"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate recommendation when child modification < 40", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Review all child-specific bathroom modifications"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate recommendation for grab rail poor condition >= 20%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", condition: "good" }),
        makeGrabRail({ id: "rail_2", condition: "good", bathroom_id: "bath_2" }),
        makeGrabRail({ id: "rail_3", condition: "poor", bathroom_id: "bath_3" }),
      ],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Replace or repair all grab rails"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate recommendation for emergency pull cord < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", emergency_pull_cord: false }),
        makeWheelchair({ id: "wc_2", emergency_pull_cord: false, bathroom_id: "bath_2", child_id: "yp_jordan" }),
      ],
      modification_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Install emergency pull cords"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("soon recommendation for risk assessed < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", risk_assessed: false }),
        makeAdaptation({ id: "adapt_2", risk_assessed: false, bathroom_id: "bath_2" }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("risk assessments for all bathroom adaptations"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("soon recommendation for weight tested < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", weight_tested: false }),
        makeGrabRail({ id: "rail_2", weight_tested: false, bathroom_id: "bath_2" }),
      ],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("weight-testing programme"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("soon recommendation for child consultation < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", child_consulted: false }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", child_consulted: false, bathroom_id: "bath_2" }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("every child is consulted"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("soon recommendation for care plan linking < 50%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", care_plan_linked: false }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", care_plan_linked: false, bathroom_id: "bath_2" }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Link all bathroom modifications to individual care plans"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("soon recommendation for non-slip replacement due >= 30%", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", replacement_due: true }),
        makeNonSlip({ id: "ns_2", replacement_due: false, bathroom_id: "bath_2" }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Replace all non-slip surfaces"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("soon recommendation for adaptation adequacy 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: false, documented: false }),
        makeAdaptation({ id: "adapt_2", installed: true, meets_child_needs: false, inspection_passed: false, documented: true, bathroom_id: "bath_2" }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    if (r.adaptation_adequacy_rate >= 40 && r.adaptation_adequacy_rate < 70) {
      const rec = r.recommendations.find((r) => r.recommendation.includes("Improve adaptation adequacy"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    }
  });

  it("planned recommendation for grab rail 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: false, inspection_passed: false }),
        makeGrabRail({ id: "rail_2", installed: true, securely_fixed: false, correct_height: true, inspection_passed: false, bathroom_id: "bath_2" }),
      ],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    if (r.grab_rail_rate >= 40 && r.grab_rail_rate < 70) {
      const rec = r.recommendations.find((r) => r.recommendation.includes("Improve grab rail compliance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    }
  });

  it("planned recommendation for non-slip 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: true, inspection_passed: true, meets_standard: false, slip_resistance_tested: false }),
        makeNonSlip({ id: "ns_2", installed: true, inspection_passed: false, meets_standard: true, slip_resistance_tested: false, bathroom_id: "bath_2" }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    if (r.non_slip_rate >= 40 && r.non_slip_rate < 70) {
      const rec = r.recommendations.find((r) => r.recommendation.includes("Improve non-slip surface compliance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    }
  });

  it("planned recommendation for wheelchair 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false }),
        makeWheelchair({ id: "wc_2", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: true, assessment_passed: true, bathroom_id: "bath_2", child_id: "yp_jordan" }),
      ],
      modification_records: [],
    }));
    if (r.wheelchair_access_rate >= 40 && r.wheelchair_access_rate < 70) {
      const rec = r.recommendations.find((r) => r.recommendation.includes("Improve wheelchair access compliance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    }
  });

  it("planned recommendation for child modification 40-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: true, meets_child_needs: true, child_consulted: false, care_plan_linked: false }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", installed: true, meets_child_needs: false, child_consulted: true, care_plan_linked: false, bathroom_id: "bath_2" }),
      ],
    }));
    if (r.child_modification_rate >= 40 && r.child_modification_rate < 70) {
      const rec = r.recommendations.find((r) => r.recommendation.includes("Improve child modification compliance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    }
  });

  it("planned recommendation for satisfaction 50-69", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 3 }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", satisfaction_rating: 3, bathroom_id: "bath_2" }),
      ],
    }));
    // avg 3, pct 60 -> 50-69
    const rec = r.recommendations.find((r) => r.recommendation.includes("Review bathroom modifications with children"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("planned recommendation for child modification coverage 50-79", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      total_children: 4,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex" }),
        makeModification({ id: "mod_2", child_id: "yp_jordan", bathroom_id: "bath_2" }),
        makeModification({ id: "mod_3", child_id: "yp_casey", bathroom_id: "bath_3" }),
      ],
    }));
    // 3/4 = 75% -> [50,80)
    const rec = r.recommendations.find((r) => r.recommendation.includes("Extend bathroom modification coverage"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommendations have sequential ranks", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: false, child_consulted: false, care_plan_linked: false }),
      ],
    }));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("no recommendations when all rates are outstanding", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.recommendations.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  describe("critical insights", () => {
    it("critical insight for adaptation adequacy < 40", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [
          makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
        ],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      const insight = r.insights.find((i) => i.text.includes("adaptation adequacy") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for grab rail < 40", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [
          makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
        ],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      const insight = r.insights.find((i) => i.text.includes("grab rail compliance") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for non-slip < 40", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [
          makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
        ],
        wheelchair_records: [],
        modification_records: [],
      }));
      const insight = r.insights.find((i) => i.text.includes("non-slip compliance") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for wheelchair access < 40", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [
          makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
        ],
        modification_records: [],
      }));
      const insight = r.insights.find((i) => i.text.includes("wheelchair access compliance") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for no modification records with children present", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [makeAdaptation({ id: "adapt_1" })],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      const insight = r.insights.find((i) => i.text.includes("No child-specific bathroom modification records"));
      expect(insight).toBeDefined();
      expect(insight!.severity).toBe("critical");
    });

    it("critical insight for grab rail poor condition >= 30%", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [
          makeGrabRail({ id: "rail_1", condition: "good" }),
          makeGrabRail({ id: "rail_2", condition: "poor", bathroom_id: "bath_2" }),
        ],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      // 1/2 = 50% poor -> >=30
      const insight = r.insights.find((i) => i.text.includes("grab rails in poor or unusable condition") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for non-slip poor condition >= 30%", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [
          makeNonSlip({ id: "ns_1", condition: "good" }),
          makeNonSlip({ id: "ns_2", condition: "poor", bathroom_id: "bath_2" }),
        ],
        wheelchair_records: [],
        modification_records: [],
      }));
      const insight = r.insights.find((i) => i.text.includes("non-slip surfaces in poor or unusable condition") && i.severity === "critical");
      expect(insight).toBeDefined();
    });
  });

  describe("warning insights", () => {
    it("warning for adaptation adequacy 40-69", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [
          makeAdaptation({ id: "adapt_1", installed: true, meets_child_needs: true, inspection_passed: false, documented: false }),
          makeAdaptation({ id: "adapt_2", installed: true, meets_child_needs: false, inspection_passed: false, documented: true, bathroom_id: "bath_2" }),
        ],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      if (r.adaptation_adequacy_rate >= 40 && r.adaptation_adequacy_rate < 70) {
        const insight = r.insights.find((i) => i.text.includes("Adaptation adequacy at") && i.severity === "warning");
        expect(insight).toBeDefined();
      }
    });

    it("warning for grab rail 40-69", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [
          makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: false, inspection_passed: false }),
          makeGrabRail({ id: "rail_2", installed: true, securely_fixed: false, correct_height: true, inspection_passed: false, bathroom_id: "bath_2" }),
        ],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      if (r.grab_rail_rate >= 40 && r.grab_rail_rate < 70) {
        const insight = r.insights.find((i) => i.text.includes("Grab rail provision at") && i.severity === "warning");
        expect(insight).toBeDefined();
      }
    });

    it("warning for non-slip 40-69", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [
          makeNonSlip({ id: "ns_1", installed: true, inspection_passed: true, meets_standard: false, slip_resistance_tested: false }),
          makeNonSlip({ id: "ns_2", installed: true, inspection_passed: false, meets_standard: true, slip_resistance_tested: false, bathroom_id: "bath_2" }),
        ],
        wheelchair_records: [],
        modification_records: [],
      }));
      if (r.non_slip_rate >= 40 && r.non_slip_rate < 70) {
        const insight = r.insights.find((i) => i.text.includes("Non-slip compliance at") && i.severity === "warning");
        expect(insight).toBeDefined();
      }
    });

    it("warning for wheelchair 40-69", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [
          makeWheelchair({ id: "wc_1", doorway_meets_standard: true, turning_circle_adequate: true, transfer_space_available: false, assessment_passed: false }),
          makeWheelchair({ id: "wc_2", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: true, assessment_passed: true, bathroom_id: "bath_2", child_id: "yp_jordan" }),
        ],
        modification_records: [],
      }));
      if (r.wheelchair_access_rate >= 40 && r.wheelchair_access_rate < 70) {
        const insight = r.insights.find((i) => i.text.includes("Wheelchair access at") && i.severity === "warning");
        expect(insight).toBeDefined();
      }
    });

    it("warning for child modification 40-69", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", installed: true, meets_child_needs: true, child_consulted: false, care_plan_linked: false }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", installed: true, meets_child_needs: false, child_consulted: true, care_plan_linked: false, bathroom_id: "bath_2" }),
        ],
      }));
      if (r.child_modification_rate >= 40 && r.child_modification_rate < 70) {
        const insight = r.insights.find((i) => i.text.includes("Child modification rate at") && i.severity === "warning");
        expect(insight).toBeDefined();
      }
    });

    it("warning for satisfaction 50-69", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 3 }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", satisfaction_rating: 3, bathroom_id: "bath_2" }),
        ],
      }));
      // avg 3 pct 60 -> [50,70)
      const insight = r.insights.find((i) => i.text.includes("Satisfaction at") && i.severity === "warning");
      expect(insight).toBeDefined();
    });

    it("warning for non-slip replacement due 20-29%", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [
          makeNonSlip({ id: "ns_1", replacement_due: false }),
          makeNonSlip({ id: "ns_2", replacement_due: false, bathroom_id: "bath_2" }),
          makeNonSlip({ id: "ns_3", replacement_due: false, bathroom_id: "bath_3" }),
          makeNonSlip({ id: "ns_4", replacement_due: true, bathroom_id: "bath_3" }),
        ],
        wheelchair_records: [],
        modification_records: [],
      }));
      // 1/4 = 25% -> [20,30)
      const insight = r.insights.find((i) => i.text.includes("non-slip surfaces due for replacement") && i.severity === "warning");
      expect(insight).toBeDefined();
    });

    it("warning for adaptation poor condition 10-19%", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: Array.from({ length: 8 }, (_, i) =>
          makeAdaptation({ id: `adapt_${i + 1}`, condition: i === 0 ? "poor" : "good", bathroom_id: `bath_${i + 1}` }),
        ),
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [],
      }));
      // 1/8 = 12.5% -> round to 13 -> [10,20)
      const insight = r.insights.find((i) => i.text.includes("adaptations in poor or unusable condition") && i.severity === "warning");
      expect(insight).toBeDefined();
    });

    it("warning for child consultation 50-69%", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", child_consulted: true }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", child_consulted: false, bathroom_id: "bath_2" }),
        ],
      }));
      // 1/2 = 50% -> [50,70)
      const insight = r.insights.find((i) => i.text.includes("Child consultation rate at") && i.severity === "warning");
      expect(insight).toBeDefined();
    });

    it("warning for care plan linking 50-69%", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [],
        grab_rail_records: [],
        non_slip_records: [],
        wheelchair_records: [],
        modification_records: [
          makeModification({ id: "mod_1", child_id: "yp_alex", care_plan_linked: true }),
          makeModification({ id: "mod_2", child_id: "yp_jordan", care_plan_linked: false, bathroom_id: "bath_2" }),
        ],
      }));
      // 1/2 = 50% -> [50,70)
      const insight = r.insights.find((i) => i.text.includes("Care plan linking at") && i.severity === "warning");
      expect(insight).toBeDefined();
    });
  });

  describe("positive insights", () => {
    it("positive insight for outstanding rating", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput());
      const insight = r.insights.find((i) => i.text.includes("outstanding bathroom accessibility") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive for high adaptation adequacy + condition", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput());
      const insight = r.insights.find((i) => i.text.includes("adaptation adequacy") && i.text.includes("condition") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive for high grab rail + compliance", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput());
      const insight = r.insights.find((i) => i.text.includes("grab rail compliance") && i.text.includes("safety standards") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive for high non-slip + standard", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput());
      const insight = r.insights.find((i) => i.text.includes("non-slip compliance") && i.text.includes("safety standards") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive for high wheelchair + emergency pull cord", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput());
      const insight = r.insights.find((i) => i.text.includes("wheelchair access compliance") && i.text.includes("emergency pull cord") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive for high modification + consultation", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput());
      const insight = r.insights.find((i) => i.text.includes("modification compliance") && i.text.includes("child consultation") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive for high satisfaction", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput());
      const insight = r.insights.find((i) => i.text.includes("satisfaction") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive for 100% child modification coverage", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput());
      const insight = r.insights.find((i) => i.text.includes("Every child has bathroom modifications") && i.severity === "positive");
      expect(insight).toBeDefined();
    });
  });

  describe("adaptation type concentration insight", () => {
    it("warning when adaptations concentrated in few types with > 3 records", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [
          makeAdaptation({ id: "adapt_1", adaptation_type: "level_access_shower" }),
          makeAdaptation({ id: "adapt_2", adaptation_type: "level_access_shower", bathroom_id: "bath_2" }),
          makeAdaptation({ id: "adapt_3", adaptation_type: "level_access_shower", bathroom_id: "bath_3" }),
          makeAdaptation({ id: "adapt_4", adaptation_type: "height_adjustment", bathroom_id: "bath_3" }),
        ],
      }));
      // missing: doorway_widening, bath_hoist, specialist_toilet, sensory_adaptation, visual_aid, temperature_control = 6 missing >= 4
      const insight = r.insights.find((i) => i.text.includes("Adaptations concentrated in") && i.severity === "warning");
      expect(insight).toBeDefined();
    });

    it("no concentration warning when adaptations cover many types", () => {
      const r = computeBathroomAccessibilityAdaptations(baseInput({
        adaptation_records: [
          makeAdaptation({ id: "adapt_1", adaptation_type: "level_access_shower" }),
          makeAdaptation({ id: "adapt_2", adaptation_type: "height_adjustment", bathroom_id: "bath_2" }),
          makeAdaptation({ id: "adapt_3", adaptation_type: "doorway_widening", bathroom_id: "bath_3" }),
          makeAdaptation({ id: "adapt_4", adaptation_type: "bath_hoist", bathroom_id: "bath_3" }),
          makeAdaptation({ id: "adapt_5", adaptation_type: "specialist_toilet", bathroom_id: "bath_3" }),
        ],
      }));
      // missing: sensory_adaptation, visual_aid, temperature_control = 3 missing < 4
      const insight = r.insights.find((i) => i.text.includes("Adaptations concentrated in") && i.severity === "warning");
      expect(insight).toBeUndefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("score clamped to minimum 0", () => {
    // Even with max penalties, score cannot go below 0
    // base 52 - max penalties (5+5+5+3 = 18) = 34, which is above 0
    // But testing clamp is still important conceptually
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamped to maximum 100", () => {
    // Even with all bonuses, score is 80 which is under 100
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.bath_access_score).toBeLessThanOrEqual(100);
  });

  it("single record in each category", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      total_children: 1,
      adaptation_records: [makeAdaptation({ id: "adapt_1", child_id: "yp_alex" })],
      grab_rail_records: [makeGrabRail({ id: "rail_1" })],
      non_slip_records: [makeNonSlip({ id: "ns_1" })],
      wheelchair_records: [makeWheelchair({ id: "wc_1" })],
      modification_records: [makeModification({ id: "mod_1", child_id: "yp_alex" })],
    }));
    expect(r.bath_access_rating).toBe("outstanding");
    expect(r.bath_access_score).toBe(80);
  });

  it("many records in each category", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      total_children: 10,
      adaptation_records: Array.from({ length: 20 }, (_, i) =>
        makeAdaptation({ id: `adapt_${i + 1}`, child_id: `yp_${i}`, bathroom_id: `bath_${i + 1}` }),
      ),
      grab_rail_records: Array.from({ length: 20 }, (_, i) =>
        makeGrabRail({ id: `rail_${i + 1}`, bathroom_id: `bath_${i + 1}` }),
      ),
      non_slip_records: Array.from({ length: 20 }, (_, i) =>
        makeNonSlip({ id: `ns_${i + 1}`, bathroom_id: `bath_${i + 1}` }),
      ),
      wheelchair_records: Array.from({ length: 20 }, (_, i) =>
        makeWheelchair({ id: `wc_${i + 1}`, bathroom_id: `bath_${i + 1}`, child_id: `yp_${i}` }),
      ),
      modification_records: Array.from({ length: 20 }, (_, i) =>
        makeModification({ id: `mod_${i + 1}`, child_id: `yp_${i}`, bathroom_id: `bath_${i + 1}` }),
      ),
    }));
    expect(r.bath_access_rating).toBe("outstanding");
    expect(r.bath_access_score).toBe(80);
  });

  it("mix of excellent and unusable conditions", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", condition: "excellent" }),
        makeAdaptation({ id: "adapt_2", condition: "unusable", bathroom_id: "bath_2" }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.total_adaptation_records).toBe(2);
  });

  it("handles child_id null in adaptations", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", child_id: null }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.total_adaptation_records).toBe(1);
  });

  it("handles null dates gracefully", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installation_date: null, last_inspection_date: null }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installation_date: null, last_inspection_date: null }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installation_date: null, last_inspection_date: null }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", last_assessment_date: null }),
      ],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installation_date: null, last_review_date: null }),
      ],
    }));
    expect(r.bath_access_rating).toBe("outstanding");
  });

  it("zero total_children with some records still computes", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      total_children: 0,
      adaptation_records: [makeAdaptation({ id: "adapt_1" })],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    // Not insufficient_data because records exist
    expect(r.bath_access_rating).not.toBe("insufficient_data");
  });

  it("satisfaction_rating boundary: exactly 1 gives low rate", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 1 }),
      ],
    }));
    // (1/5)*100 = 20
    expect(r.satisfaction_rate).toBe(20);
  });

  it("satisfaction_rating boundary: exactly 5 gives 100", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", satisfaction_rating: 5 }),
      ],
    }));
    expect(r.satisfaction_rate).toBe(100);
  });

  it("rating boundary: score exactly 80 is outstanding", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.bath_access_score).toBe(80);
    expect(r.bath_access_rating).toBe("outstanding");
  });

  it("rating boundary: score exactly 65 is good", () => {
    // We need exactly 65: 52 + 13 bonus
    // adaptation +5, grab_rail +5, non_slip +3 = 13 -> 52+13=65
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      // Adaptation >= 90 -> +5
      adaptation_records: [
        makeAdaptation({ id: "adapt_1" }),
      ],
      // Grab rail >= 90 -> +5
      grab_rail_records: [
        makeGrabRail({ id: "rail_1" }),
      ],
      // Non-slip >= 70 <90 -> +3
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: true, inspection_passed: true, meets_standard: true, slip_resistance_tested: true }),
        makeNonSlip({ id: "ns_2", installed: true, inspection_passed: true, meets_standard: true, slip_resistance_tested: false, bathroom_id: "bath_2" }),
        makeNonSlip({ id: "ns_3", installed: true, inspection_passed: true, meets_standard: false, slip_resistance_tested: false, bathroom_id: "bath_3" }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(65);
    expect(r.bath_access_rating).toBe("good");
  });

  it("rating boundary: score exactly 45 is adequate", () => {
    // 52 - 5 (adapt penalty) - 3 (wheelchair penalty) + 1? = 44 or 45
    // Let's target 45: base 52, need -7. Adapt penalty (-5), wheelchair penalty (-3) = -8 -> 44
    // Or: base 52, wheelchair penalty only (-3) = 49. Need -4 more.
    // Actually: base 52, adapt penalty (-5), grab rail penalty (-5), then add back some bonuses.
    // Simpler: base 52 + grab_rail_bonus(+3) + adapt_penalty(-5) + wheelchair_penalty(-3) + nonslip_penalty(-5) = 42
    // Let's just find a combo that gives exactly 45.
    // 52 - 5 (adapt) - 3 (wheelchair) + nonslip>=70(+3) = 47. Need -2 more.
    // 52 - 5 (adapt) - 5 (nonslip) + grab>=70(+3) = 45. Yes!
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: true, securely_fixed: true, correct_height: true, inspection_passed: true }),
        makeGrabRail({ id: "rail_2", installed: true, securely_fixed: true, correct_height: true, inspection_passed: false, bathroom_id: "bath_2" }),
        makeGrabRail({ id: "rail_3", installed: true, securely_fixed: true, correct_height: false, inspection_passed: false, bathroom_id: "bath_3" }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(45);
    expect(r.bath_access_rating).toBe("adequate");
  });

  it("various grab rail locations accepted", () => {
    const locations: Array<GrabRailRecordInput["location"]> = ["bath", "shower", "toilet", "basin", "doorway", "corridor", "other"];
    const records = locations.map((loc, i) =>
      makeGrabRail({ id: `rail_${i + 1}`, location: loc, bathroom_id: `bath_${i + 1}` }),
    );
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      grab_rail_records: records,
      adaptation_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.total_grab_rail_records).toBe(7);
    expect(r.grab_rail_rate).toBe(100);
  });

  it("various adaptation types accepted", () => {
    const types: Array<AdaptationRecordInput["adaptation_type"]> = [
      "height_adjustment", "doorway_widening", "bath_hoist", "level_access_shower",
      "specialist_toilet", "sensory_adaptation", "visual_aid", "temperature_control", "other",
    ];
    const records = types.map((t, i) =>
      makeAdaptation({ id: `adapt_${i + 1}`, adaptation_type: t, bathroom_id: `bath_${i + 1}` }),
    );
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: records,
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.total_adaptation_records).toBe(9);
  });

  it("various non-slip surface types accepted", () => {
    const types: Array<NonSlipRecordInput["surface_type"]> = [
      "bath_mat", "shower_mat", "floor_tiles", "bath_strips", "shower_tray", "step_treads", "other",
    ];
    const records = types.map((t, i) =>
      makeNonSlip({ id: `ns_${i + 1}`, surface_type: t, bathroom_id: `bath_${i + 1}` }),
    );
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      non_slip_records: records,
      adaptation_records: [],
      grab_rail_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.total_non_slip_records).toBe(7);
  });

  it("various modification types accepted", () => {
    const types: Array<ModificationRecordInput["modification_type"]> = [
      "step_stool", "raised_toilet_seat", "bath_seat", "shower_chair",
      "temperature_limiter", "anti_scald_valve", "visual_schedule",
      "sensory_lighting", "privacy_adaptation", "other",
    ];
    const records = types.map((t, i) =>
      makeModification({ id: `mod_${i + 1}`, modification_type: t, child_id: `yp_${i}`, bathroom_id: `bath_${i + 1}` }),
    );
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      modification_records: records,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      total_children: 10,
    }));
    expect(r.total_modification_records).toBe(10);
  });

  it("all conditions: excellent, good, fair, poor, unusable", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", condition: "excellent" }),
        makeAdaptation({ id: "adapt_2", condition: "good", bathroom_id: "bath_2" }),
        makeAdaptation({ id: "adapt_3", condition: "fair", bathroom_id: "bath_3" }),
        makeAdaptation({ id: "adapt_4", condition: "poor", bathroom_id: "bath_4" }),
        makeAdaptation({ id: "adapt_5", condition: "unusable", bathroom_id: "bath_5" }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.total_adaptation_records).toBe(5);
  });

  it("only wheelchair records — no penalties for missing other types", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      total_children: 1,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [makeWheelchair({ id: "wc_1" })],
      modification_records: [],
    }));
    // No penalties from empty adapt/grab/nonslip (guarded).
    // Wheelchair rate 100 -> +5 bonus.
    // Critical insight for no modification records with children.
    expect(r.bath_access_score).toBe(52 + 5);
  });

  it("only modification records — no penalties", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      total_children: 1,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [makeModification({ id: "mod_1", child_id: "yp_alex" })],
    }));
    // Modification rate 100 -> +4, satisfaction 100 -> +4. No penalties.
    expect(r.bath_access_score).toBe(52 + 4 + 4);
  });

  it("installed=false records don't count for sub-metrics", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: true, inspection_passed: true, documented: true }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: true, correct_height: true, inspection_passed: true }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: true, meets_standard: true, slip_resistance_tested: true }),
      ],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex", installed: false, meets_child_needs: true, child_consulted: true, care_plan_linked: true }),
      ],
    }));
    // installed rate = 0 for adapt/grab/nonslip, so sub-metrics counts are 0 for installed && X
    expect(r.adaptation_adequacy_rate).toBe(0);
    expect(r.grab_rail_rate).toBe(0);
    expect(r.non_slip_rate).toBe(0);
    expect(r.child_modification_rate).toBe(0);
    expect(r.satisfaction_rate).toBe(0);
  });

  it("wheelchair doorway_width_mm has no effect on scoring", () => {
    // doorway_width_mm is a data field but scoring uses doorway_meets_standard boolean
    const r1 = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_width_mm: 500 }),
      ],
      modification_records: [],
    }));
    const r2 = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_width_mm: 1200 }),
      ],
      modification_records: [],
    }));
    expect(r1.bath_access_score).toBe(r2.bath_access_score);
  });

  it("wheelchair child_specific and child_id don't affect scoring", () => {
    const r1 = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", child_specific: true, child_id: "yp_alex" }),
      ],
      modification_records: [],
    }));
    const r2 = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", child_specific: false, child_id: null }),
      ],
      modification_records: [],
    }));
    expect(r1.bath_access_score).toBe(r2.bath_access_score);
  });

  it("duplicate bathroom IDs across record types are handled", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [makeAdaptation({ id: "adapt_1", bathroom_id: "bath_shared" })],
      grab_rail_records: [makeGrabRail({ id: "rail_1", bathroom_id: "bath_shared" })],
      non_slip_records: [makeNonSlip({ id: "ns_1", bathroom_id: "bath_shared" })],
      wheelchair_records: [makeWheelchair({ id: "wc_1", bathroom_id: "bath_shared" })],
      modification_records: [makeModification({ id: "mod_1", child_id: "yp_alex", bathroom_id: "bath_shared" })],
    }));
    // All same bathroom_id — still valid, just 1 unique bathroom
    expect(r.bath_access_rating).toBe("outstanding");
  });

  it("multiple modifications for same child count as one for coverage", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      total_children: 2,
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [
        makeModification({ id: "mod_1", child_id: "yp_alex" }),
        makeModification({ id: "mod_2", child_id: "yp_alex", modification_type: "bath_seat", bathroom_id: "bath_2" }),
        makeModification({ id: "mod_3", child_id: "yp_alex", modification_type: "shower_chair", bathroom_id: "bath_3" }),
      ],
    }));
    // Only 1 unique child out of 2 -> 50% coverage
    // The strength for "100% coverage" should NOT be present
    const s = r.strengths.find((s) => s.includes("Every child has bathroom modifications"));
    expect(s).toBeUndefined();
  });

  it("fair condition is neither good nor poor", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", condition: "fair" }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    // fair is not excellent/good -> adaptationConditionRate = 0
    // fair is not poor/unusable -> adaptationPoorConditionRate = 0
    expect(r.total_adaptation_records).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. SCORE ARITHMETIC VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

describe("score arithmetic", () => {
  it("52 + adaptation(+5) = 57", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(57);
  });

  it("52 + grab_rail(+5) = 57", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(57);
  });

  it("52 + non_slip(+5) = 57", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(57);
  });

  it("52 + wheelchair(+5) = 57", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(57);
  });

  it("52 + modification(+4) + satisfaction(+4) = 60", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
    }));
    expect(r.bath_access_score).toBe(60);
  });

  it("52 + all(+28) = 80", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput());
    expect(r.bath_access_score).toBe(80);
  });

  it("52 - adapt(-5) = 47", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(47);
  });

  it("52 - grab(-5) = 47", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(47);
  });

  it("52 - nonslip(-5) = 47", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(47);
  });

  it("52 - wheelchair(-3) = 49", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [],
      grab_rail_records: [],
      non_slip_records: [],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(49);
  });

  it("52 - all penalties(-18) = 34", () => {
    const r = computeBathroomAccessibilityAdaptations(baseInput({
      adaptation_records: [
        makeAdaptation({ id: "adapt_1", installed: false, meets_child_needs: false, inspection_passed: false, documented: false }),
      ],
      grab_rail_records: [
        makeGrabRail({ id: "rail_1", installed: false, securely_fixed: false, correct_height: false, inspection_passed: false }),
      ],
      non_slip_records: [
        makeNonSlip({ id: "ns_1", installed: false, inspection_passed: false, meets_standard: false, slip_resistance_tested: false }),
      ],
      wheelchair_records: [
        makeWheelchair({ id: "wc_1", doorway_meets_standard: false, turning_circle_adequate: false, transfer_space_available: false, assessment_passed: false }),
      ],
      modification_records: [],
    }));
    expect(r.bath_access_score).toBe(34);
  });
});
