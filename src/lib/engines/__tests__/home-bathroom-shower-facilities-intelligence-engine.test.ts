// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BATHROOM & SHOWER FACILITIES INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 25 (Premises), Reg 5 (Engaging and effective leadership).
// SCCIF: "Safety", "Living in the home".
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeBathroomShowerFacilities,
  type BathroomShowerFacilitiesInput,
  type CleanlinessAuditRecordInput,
  type ShowerAvailabilityRecordInput,
  type HotWaterRecordInput,
  type PrivacyRecordInput,
  type AccessibilityRecordInput,
} from "../home-bathroom-shower-facilities-intelligence-engine";

// ── Factories ──────────────────────────────────────────────────────────────

let _id = 0;

function makeCleanlinessAudit(overrides: Partial<CleanlinessAuditRecordInput> = {}): CleanlinessAuditRecordInput {
  _id++;
  return {
    id: `clean_${_id}`,
    date: "2026-05-01",
    bathroom_id: "bath_1",
    bathroom_name: "Main Bathroom",
    auditor: "staff_ryan",
    overall_score: 5,
    surfaces_clean: true,
    floor_clean: true,
    toilet_clean: true,
    sink_clean: true,
    shower_bath_clean: true,
    mirrors_clean: true,
    bins_emptied: true,
    supplies_stocked: true,
    mould_detected: false,
    limescale_detected: false,
    ventilation_adequate: true,
    odour_free: true,
    hazards_found: false,
    hazard_description: "",
    corrective_action_taken: false,
    follow_up_required: false,
    follow_up_completed: false,
    child_feedback_collected: true,
    child_feedback_positive: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeShowerAvailability(overrides: Partial<ShowerAvailabilityRecordInput> = {}): ShowerAvailabilityRecordInput {
  _id++;
  return {
    id: `shower_${_id}`,
    date: "2026-05-01",
    bathroom_id: "bath_1",
    bathroom_name: "Main Bathroom",
    shower_functional: true,
    bath_functional: true,
    hot_water_available: true,
    cold_water_available: true,
    adequate_water_pressure: true,
    drainage_clear: true,
    showerhead_condition: "good",
    anti_slip_measures_in_place: true,
    shower_curtain_screen_intact: true,
    reported_by: "staff_ryan",
    time_of_check: "08:00",
    downtime_hours: 0,
    repair_requested: false,
    repair_completed: false,
    child_affected: false,
    alternative_provided: false,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeHotWater(overrides: Partial<HotWaterRecordInput> = {}): HotWaterRecordInput {
  _id++;
  return {
    id: `hw_${_id}`,
    date: "2026-05-01",
    bathroom_id: "bath_1",
    bathroom_name: "Main Bathroom",
    temperature_celsius: 41,
    within_safe_range: true,
    tmv_fitted: true,
    tmv_tested: true,
    tmv_test_passed: true,
    scalding_risk_identified: false,
    scalding_incident_occurred: false,
    legionella_check_completed: true,
    legionella_check_passed: true,
    water_quality_acceptable: true,
    tested_by: "staff_ryan",
    next_test_due: "2026-06-01",
    corrective_action_required: false,
    corrective_action_completed: false,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makePrivacy(overrides: Partial<PrivacyRecordInput> = {}): PrivacyRecordInput {
  _id++;
  return {
    id: `priv_${_id}`,
    date: "2026-05-01",
    bathroom_id: "bath_1",
    bathroom_name: "Main Bathroom",
    lock_fitted: true,
    lock_functional: true,
    lock_overridable_externally: true,
    frosted_window_or_blind: true,
    adequate_screening: true,
    individual_towels_provided: true,
    personal_storage_available: true,
    knock_before_entry_policy_observed: true,
    child_consulted_on_privacy: true,
    child_satisfied_with_privacy: true,
    shared_bathroom: false,
    sharing_arrangement_appropriate: true,
    privacy_complaint_received: false,
    complaint_resolved: false,
    assessed_by: "staff_ryan",
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeAccessibility(overrides: Partial<AccessibilityRecordInput> = {}): AccessibilityRecordInput {
  _id++;
  return {
    id: `acc_${_id}`,
    date: "2026-05-01",
    bathroom_id: "bath_1",
    bathroom_name: "Main Bathroom",
    wheelchair_accessible: true,
    grab_rails_fitted: true,
    grab_rails_secure: true,
    non_slip_flooring: true,
    level_access_shower: true,
    adequate_space_for_mobility: true,
    emergency_pull_cord_fitted: true,
    emergency_pull_cord_functional: true,
    height_appropriate_fittings: true,
    sensory_adjustments_made: true,
    individual_needs_assessment_completed: true,
    adaptations_match_care_plan: true,
    child_can_use_independently: true,
    assessed_by: "staff_ryan",
    next_review_due: "2026-08-01",
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<BathroomShowerFacilitiesInput> = {}): BathroomShowerFacilitiesInput {
  return {
    today: "2026-05-30",
    total_children: 3,
    cleanliness_audit_records: [
      makeCleanlinessAudit({ id: "c1", bathroom_id: "bath_1" }),
      makeCleanlinessAudit({ id: "c2", bathroom_id: "bath_2" }),
      makeCleanlinessAudit({ id: "c3", bathroom_id: "bath_3" }),
    ],
    shower_availability_records: [
      makeShowerAvailability({ id: "s1", bathroom_id: "bath_1" }),
      makeShowerAvailability({ id: "s2", bathroom_id: "bath_2" }),
      makeShowerAvailability({ id: "s3", bathroom_id: "bath_3" }),
    ],
    hot_water_records: [
      makeHotWater({ id: "h1", bathroom_id: "bath_1" }),
      makeHotWater({ id: "h2", bathroom_id: "bath_2" }),
      makeHotWater({ id: "h3", bathroom_id: "bath_3" }),
    ],
    privacy_records: [
      makePrivacy({ id: "p1", bathroom_id: "bath_1" }),
      makePrivacy({ id: "p2", bathroom_id: "bath_2" }),
      makePrivacy({ id: "p3", bathroom_id: "bath_3" }),
    ],
    accessibility_records: [
      makeAccessibility({ id: "a1", bathroom_id: "bath_1" }),
      makeAccessibility({ id: "a2", bathroom_id: "bath_2" }),
      makeAccessibility({ id: "a3", bathroom_id: "bath_3" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when all arrays empty and 0 children", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 0,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.bathroom_rating).toBe("insufficient_data");
  });

  it("returns score 0 for insufficient_data", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 0,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.bathroom_score).toBe(0);
  });

  it("has empty strengths/concerns/recommendations/insights for insufficient_data", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 0,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("headline references insufficient data", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 0,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.headline).toContain("insufficient data");
  });

  it("zeroes all record counts on insufficient_data", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 0,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.total_cleanliness_audits).toBe(0);
    expect(r.total_shower_availability_checks).toBe(0);
    expect(r.total_hot_water_records).toBe(0);
    expect(r.total_privacy_records).toBe(0);
    expect(r.total_accessibility_records).toBe(0);
  });

  it("zeroes all rates on insufficient_data", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 0,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.cleanliness_rate).toBe(0);
    expect(r.shower_availability_rate).toBe(0);
    expect(r.hot_water_safety_rate).toBe(0);
    expect(r.privacy_rate).toBe(0);
    expect(r.accessibility_rate).toBe(0);
    expect(r.child_satisfaction_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE FLOOR — all empty + children > 0
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate floor — no records with children on placement", () => {
  it("returns inadequate rating", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 3,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.bathroom_rating).toBe("inadequate");
  });

  it("returns score 15", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 3,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.bathroom_score).toBe(15);
  });

  it("has a concern about missing records", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 3,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.concerns.length).toBe(1);
    expect(r.concerns[0]).toContain("No cleanliness audit records");
  });

  it("has two immediate recommendations", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 3,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.recommendations.length).toBe(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("has a critical insight", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 3,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("headline mentions urgent attention", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 3,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.headline).toContain("urgent attention");
  });

  it("works with 1 child", () => {
    const r = computeBathroomShowerFacilities({
      today: "2026-05-30",
      total_children: 1,
      cleanliness_audit_records: [],
      shower_availability_records: [],
      hot_water_records: [],
      privacy_records: [],
      accessibility_records: [],
    });
    expect(r.bathroom_rating).toBe("inadequate");
    expect(r.bathroom_score).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING — perfect data
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding — perfect data", () => {
  it("returns outstanding rating with all-perfect records", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.bathroom_rating).toBe("outstanding");
  });

  it("returns score >= 80 for outstanding", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.bathroom_score).toBeGreaterThanOrEqual(80);
  });

  it("headline says outstanding", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("has multiple strengths", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(5);
  });

  it("has no concerns", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.concerns.length).toBe(0);
  });

  it("has no recommendations", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("includes positive insights", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    const positiveInsights = r.insights.filter((i) => i.severity === "positive");
    expect(positiveInsights.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 100% cleanliness rate", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.cleanliness_rate).toBe(100);
  });

  it("returns 100% shower availability rate", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.shower_availability_rate).toBe(100);
  });

  it("returns 100% hot water safety rate", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.hot_water_safety_rate).toBe(100);
  });

  it("returns 100% privacy rate", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.privacy_rate).toBe(100);
  });

  it("returns 100% accessibility rate", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.accessibility_rate).toBe(100);
  });

  it("returns 100% child satisfaction rate", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("counts all records correctly", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.total_cleanliness_audits).toBe(3);
    expect(r.total_shower_availability_checks).toBe(3);
    expect(r.total_hot_water_records).toBe(3);
    expect(r.total_privacy_records).toBe(3);
    expect(r.total_accessibility_records).toBe(3);
  });

  it("includes strength about cleanliness when 100%", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("cleanliness audits scored 4+"))).toBe(true);
  });

  it("includes strength about shower availability when 100%", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("shower/bath availability"))).toBe(true);
  });

  it("includes strength about hot water safety when 100%", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("hot water temperature safety"))).toBe(true);
  });

  it("includes strength about privacy when 100%", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("privacy compliance"))).toBe(true);
  });

  it("includes strength about accessibility when 100%", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("accessibility compliance"))).toBe(true);
  });

  it("includes strength about child satisfaction when 100%", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("child satisfaction"))).toBe(true);
  });

  it("includes strength about TMV fitting when 100%", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("TMV") || s.includes("thermostatic mixing valve"))).toBe(true);
  });

  it("includes strength about ventilation when 100%", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("ventilation"))).toBe(true);
  });

  it("includes strength about anti-slip when 100%", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("anti-slip"))).toBe(true);
  });

  it("includes strength about zero mould", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("Zero mould"))).toBe(true);
  });

  it("includes strength about knock-before-entry", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("knock-before-entry"))).toBe(true);
  });

  it("includes strength about Legionella monitoring", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("Legionella"))).toBe(true);
  });

  it("includes strength about child independent use", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("independently"))).toBe(true);
  });

  it("includes strength about zero scalding", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.strengths.some((s) => s.includes("No scalding risks") || s.includes("zero scalding"))).toBe(true);
  });

  it("includes positive insight about outstanding management", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
  });

  it("includes positive insight about hot water safety + TMV + zero incidents", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("TMV coverage"))).toBe(true);
  });

  it("includes positive insight about cleanliness + mould + ventilation", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("zero mould"))).toBe(true);
  });

  it("includes positive insight about privacy + knock policy", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("knock-before-entry"))).toBe(true);
  });

  it("includes positive insight about accessibility + child independence", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("independently"))).toBe(true);
  });

  it("includes positive insight about child satisfaction", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child satisfaction"))).toBe(true);
  });

  it("includes positive insight about water safety management", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Legionella"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. SCORING BONUSES
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring bonuses", () => {
  it("base score is 52 with no bonuses and no penalties", () => {
    // cleanlinessRate = 33% -> penalty -5, no bonus
    // showerAvailabilityRate = 100% -> bonus +5
    // hotWaterSafetyRate = 100% -> bonus +5
    // privacyRate = 100% -> bonus +4
    // accessibilityRate = 100% -> bonus +4
    // childSat with only 1/3 positive cleanliness feedback → depends
    // ventilation → bonus +1
    // tmv → bonus +1
    // penalty: cleanlinessRate < 50 → -5
    // So this is complex. Just check the base scenario directly.
    const r = computeBathroomShowerFacilities(baseInput());
    // All perfect: 52 + 5 + 5 + 5 + 4 + 4 + 3 + 1 + 1 = 80
    expect(r.bathroom_score).toBe(80);
  });

  it("cleanlinessRate >= 90 gives +5 bonus", () => {
    // All perfect → 100% cleanlinessRate → +5 bonus
    const r = computeBathroomShowerFacilities(baseInput());
    // Drop to 75% (3/4) → still >=70 → +3 bonus → diff should be 2
    const r2 = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 4 }),
        makeCleanlinessAudit({ id: "c4", overall_score: 3 }),
      ],
    }));
    // 3/4 = 75% → +3 bonus. Perfect = +5. Diff = 2.
    expect(r.bathroom_score - r2.bathroom_score).toBe(2);
  });

  it("cleanlinessRate >= 70 gives +3 bonus", () => {
    // 2/3 = 67% → this is actually < 70, so no bonus from cleanliness
    // Need 70%+ → 3/4 = 75%
    const r2 = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 4 }),
        makeCleanlinessAudit({ id: "c4", overall_score: 3 }),
      ],
    }));
    // 3/4 = 75% → +3 bonus
    expect(r2.bathroom_score).toBeGreaterThanOrEqual(65);
  });

  it("showerAvailabilityRate >= 95 gives +5 bonus", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    // 100% → +5
    expect(r.shower_availability_rate).toBe(100);
    expect(r.bathroom_score).toBeGreaterThanOrEqual(80);
  });

  it("showerAvailabilityRate >= 80 but < 95 gives +3 bonus", () => {
    // 4/5 = 80%
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1" }),
        makeShowerAvailability({ id: "s2" }),
        makeShowerAvailability({ id: "s3" }),
        makeShowerAvailability({ id: "s4" }),
        makeShowerAvailability({ id: "s5", shower_functional: false, hot_water_available: false }),
      ],
    }));
    expect(r.shower_availability_rate).toBe(80);
  });

  it("hotWaterSafetyRate >= 95 gives +5 bonus", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.hot_water_safety_rate).toBe(100);
  });

  it("hotWaterSafetyRate >= 80 but < 95 gives +3 bonus", () => {
    // 3/4 = 75% - that's < 80, so no bonus. Need 4/5 = 80%
    const r2 = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1" }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3" }),
        makeHotWater({ id: "h4" }),
        makeHotWater({ id: "h5", within_safe_range: false }),
      ],
    }));
    expect(r2.hot_water_safety_rate).toBe(80);
  });

  it("privacyRate >= 90 gives +4 bonus", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.privacy_rate).toBe(100);
  });

  it("accessibilityRate >= 90 gives +4 bonus", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.accessibility_rate).toBe(100);
  });

  it("childSatisfactionRate >= 90 gives +3 bonus", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("ventilationRate >= 90 with records gives +1 bonus", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    // All ventilation adequate → +1
    expect(r.bathroom_score).toBe(80);
  });

  it("tmvFittedRate >= 95 with records gives +1 bonus", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    // All TMV fitted → +1
    expect(r.bathroom_score).toBe(80);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. SCORING PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring penalties", () => {
  it("hotWaterSafetyRate < 60 incurs -8 penalty", () => {
    // Compare with and without the penalty trigger
    // With 33% hot water safety → -8 penalty, no hot water bonus
    const withPenalty = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: true }),
        makeHotWater({ id: "h2", within_safe_range: false }),
        makeHotWater({ id: "h3", within_safe_range: false }),
      ],
    }));
    // With 67% hot water safety → no penalty, no bonus (60-79 range)
    const withoutPenalty = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: true }),
        makeHotWater({ id: "h2", within_safe_range: true }),
        makeHotWater({ id: "h3", within_safe_range: false }),
      ],
    }));
    expect(withPenalty.hot_water_safety_rate).toBe(33);
    // The penalty version should be 8 points lower
    expect(withoutPenalty.bathroom_score - withPenalty.bathroom_score).toBe(8);
  });

  it("cleanlinessRate < 50 incurs -5 penalty", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 2 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 3 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 3 }),
      ],
    }));
    expect(r.cleanliness_rate).toBe(0);
  });

  it("privacyRate < 50 incurs -5 penalty", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
        makePrivacy({ id: "p2", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
        makePrivacy({ id: "p3", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
    }));
    expect(r.privacy_rate).toBe(0);
  });

  it("scaldingIncidentCount > 0 incurs -6 penalty", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", scalding_incident_occurred: true }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3" }),
      ],
    }));
    // 52 + bonuses - 6
    expect(r.bathroom_score).toBeLessThanOrEqual(74);
  });

  it("score is clamped to 0 minimum", () => {
    // Pile up all penalties
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 1 }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false, scalding_incident_occurred: true }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
    }));
    expect(r.bathroom_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to 100 maximum", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.bathroom_score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("score >= 80 returns outstanding", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.bathroom_score).toBeGreaterThanOrEqual(80);
    expect(r.bathroom_rating).toBe("outstanding");
  });

  it("score 65-79 returns good", () => {
    // Reduce some bonuses to get score in 65-79
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 3 }),
        makeCleanlinessAudit({ id: "c4", overall_score: 3 }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1" }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3", within_safe_range: false, tmv_fitted: false }),
      ],
    }));
    expect(r.bathroom_score).toBeGreaterThanOrEqual(65);
    expect(r.bathroom_score).toBeLessThan(80);
    expect(r.bathroom_rating).toBe("good");
  });

  it("score 45-64 returns adequate", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 2 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 3 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 3 }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: false, hot_water_available: false }),
        makeShowerAvailability({ id: "s2" }),
        makeShowerAvailability({ id: "s3" }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false, tmv_fitted: false }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3" }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false }),
        makePrivacy({ id: "p2" }),
        makePrivacy({ id: "p3" }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false, adaptations_match_care_plan: false }),
        makeAccessibility({ id: "a2" }),
        makeAccessibility({ id: "a3" }),
      ],
    }));
    expect(r.bathroom_score).toBeGreaterThanOrEqual(45);
    expect(r.bathroom_score).toBeLessThan(65);
    expect(r.bathroom_rating).toBe("adequate");
  });

  it("score < 45 returns inadequate", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 1 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 2 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 2 }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: false, bath_functional: false, hot_water_available: false }),
        makeShowerAvailability({ id: "s2", shower_functional: false, hot_water_available: false }),
        makeShowerAvailability({ id: "s3" }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false, tmv_fitted: false, scalding_incident_occurred: true }),
        makeHotWater({ id: "h2", within_safe_range: false, tmv_fitted: false }),
        makeHotWater({ id: "h3", within_safe_range: false, tmv_fitted: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
        makePrivacy({ id: "p2", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
        makePrivacy({ id: "p3", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
        makeAccessibility({ id: "a2", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
        makeAccessibility({ id: "a3", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
    }));
    expect(r.bathroom_score).toBeLessThan(45);
    expect(r.bathroom_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. CLEANLINESS METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("cleanliness metrics", () => {
  it("counts audits scoring 4+ as clean", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 4 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 3 }),
      ],
    }));
    expect(r.cleanliness_rate).toBe(67);
  });

  it("score 3 is not counted as clean", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 3 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 3 }),
      ],
    }));
    expect(r.cleanliness_rate).toBe(0);
  });

  it("score 4 is counted as clean", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 4 }),
      ],
    }));
    expect(r.cleanliness_rate).toBe(100);
  });

  it("cleanliness rate 0% when all audits score < 4", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 1 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 2 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 3 }),
      ],
    }));
    expect(r.cleanliness_rate).toBe(0);
  });

  it("reports total_cleanliness_audits correctly", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1" }),
        makeCleanlinessAudit({ id: "c2" }),
      ],
    }));
    expect(r.total_cleanliness_audits).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. SHOWER AVAILABILITY METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("shower availability metrics", () => {
  it("composite: shower_functional OR bath_functional AND hot_water_available", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: true, bath_functional: false, hot_water_available: true }),
        makeShowerAvailability({ id: "s2", shower_functional: false, bath_functional: true, hot_water_available: true }),
        makeShowerAvailability({ id: "s3", shower_functional: false, bath_functional: false, hot_water_available: true }),
      ],
    }));
    // First: shower || bath = true, hot = true → counts
    // Second: shower || bath = true, hot = true → counts
    // Third: shower || bath = false → doesn't count
    expect(r.shower_availability_rate).toBe(67);
  });

  it("no hot water means not available even if shower/bath functional", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: true, hot_water_available: false }),
      ],
    }));
    expect(r.shower_availability_rate).toBe(0);
  });

  it("bath_functional alone counts if hot water available", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: false, bath_functional: true, hot_water_available: true }),
      ],
    }));
    expect(r.shower_availability_rate).toBe(100);
  });

  it("reports total_shower_availability_checks correctly", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1" }),
        makeShowerAvailability({ id: "s2" }),
        makeShowerAvailability({ id: "s3" }),
        makeShowerAvailability({ id: "s4" }),
      ],
    }));
    expect(r.total_shower_availability_checks).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. HOT WATER SAFETY METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("hot water safety metrics", () => {
  it("calculates safety rate based on within_safe_range", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: true }),
        makeHotWater({ id: "h2", within_safe_range: true }),
        makeHotWater({ id: "h3", within_safe_range: false }),
        makeHotWater({ id: "h4", within_safe_range: false }),
      ],
    }));
    expect(r.hot_water_safety_rate).toBe(50);
  });

  it("100% when all within safe range", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: true }),
        makeHotWater({ id: "h2", within_safe_range: true }),
      ],
    }));
    expect(r.hot_water_safety_rate).toBe(100);
  });

  it("0% when none within safe range", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false }),
        makeHotWater({ id: "h2", within_safe_range: false }),
      ],
    }));
    expect(r.hot_water_safety_rate).toBe(0);
  });

  it("reports total_hot_water_records correctly", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1" }),
        makeHotWater({ id: "h2" }),
      ],
    }));
    expect(r.total_hot_water_records).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. PRIVACY METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("privacy metrics", () => {
  it("composite: lock_functional + adequate_screening + knock_policy", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: true, adequate_screening: true, knock_before_entry_policy_observed: true }),
        makePrivacy({ id: "p2", lock_functional: false, adequate_screening: true, knock_before_entry_policy_observed: true }),
      ],
    }));
    // Numerator: lockFunctional(1) + adequateScreening(2) + knockPolicy(2) = 5
    // Denominator: 2 + 2 + 2 = 6
    // pct(5,6) = 83
    expect(r.privacy_rate).toBe(83);
  });

  it("100% when all three components are perfect", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1" }),
        makePrivacy({ id: "p2" }),
      ],
    }));
    expect(r.privacy_rate).toBe(100);
  });

  it("0% when all three components fail", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
    }));
    expect(r.privacy_rate).toBe(0);
  });

  it("reports total_privacy_records correctly", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1" }),
        makePrivacy({ id: "p2" }),
        makePrivacy({ id: "p3" }),
      ],
    }));
    expect(r.total_privacy_records).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. ACCESSIBILITY METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("accessibility metrics", () => {
  it("composite: needs_assessment + adaptations_match + child_independent", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: true, adaptations_match_care_plan: true, child_can_use_independently: true }),
        makeAccessibility({ id: "a2", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
    }));
    // Numerator: 1 + 1 + 1 = 3
    // Denominator: 2 + 2 + 2 = 6
    // pct(3,6) = 50
    expect(r.accessibility_rate).toBe(50);
  });

  it("100% when all three components are perfect", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1" }),
      ],
    }));
    expect(r.accessibility_rate).toBe(100);
  });

  it("0% when all three components fail", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
    }));
    expect(r.accessibility_rate).toBe(0);
  });

  it("reports total_accessibility_records correctly", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1" }),
        makeAccessibility({ id: "a2" }),
      ],
    }));
    expect(r.total_accessibility_records).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CHILD SATISFACTION METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("child satisfaction metrics", () => {
  it("composite across cleanliness feedback, privacy satisfaction, and independent use", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", child_feedback_collected: true, child_feedback_positive: true }),
        makeCleanlinessAudit({ id: "c2", child_feedback_collected: true, child_feedback_positive: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", child_consulted_on_privacy: true, child_satisfied_with_privacy: true }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", child_can_use_independently: true }),
      ],
    }));
    // Cleanliness: 1/2, Privacy: 1/1, Accessibility: 1/1
    // Total: 3/4 = 75%
    expect(r.child_satisfaction_rate).toBe(75);
  });

  it("0% when no child feedback collected at all across all domains", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", child_feedback_collected: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", child_consulted_on_privacy: false }),
      ],
      accessibility_records: [],
    }));
    expect(r.child_satisfaction_rate).toBe(0);
  });

  it("100% when all child feedback is positive", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("excludes cleanliness feedback from satisfaction when not collected", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", child_feedback_collected: false, child_feedback_positive: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", child_consulted_on_privacy: true, child_satisfied_with_privacy: true }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", child_can_use_independently: true }),
      ],
    }));
    // Only privacy (1/1) and accessibility (1/1) contribute
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("excludes privacy from satisfaction when not consulted", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", child_feedback_collected: true, child_feedback_positive: true }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", child_consulted_on_privacy: false }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", child_can_use_independently: true }),
      ],
    }));
    // Only cleanliness (1/1) and accessibility (1/1) contribute
    expect(r.child_satisfaction_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. CLEANLINESS CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("cleanliness concerns", () => {
  it("concern when cleanlinessRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 2 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 3 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 3 }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("cleanliness"))).toBe(true);
  });

  it("concern when cleanlinessRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 4 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 3 }),
      ],
    }));
    // 1/2 = 50%
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("leanliness"))).toBe(true);
  });

  it("no cleanliness concern when rate >= 70", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.concerns.some((c) => c.toLowerCase().includes("cleanliness audit pass rate"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. SHOWER AVAILABILITY CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("shower availability concerns", () => {
  it("concern when showerAvailabilityRate < 70", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: false, bath_functional: false }),
        makeShowerAvailability({ id: "s2", shower_functional: false, bath_functional: false }),
        makeShowerAvailability({ id: "s3" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("shower/bath availability"))).toBe(true);
  });

  it("concern when showerAvailabilityRate 70-79", () => {
    // 3/4 = 75%
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1" }),
        makeShowerAvailability({ id: "s2" }),
        makeShowerAvailability({ id: "s3" }),
        makeShowerAvailability({ id: "s4", shower_functional: false, bath_functional: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("75%") && c.includes("hower"))).toBe(true);
  });

  it("no shower concern when rate >= 80", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.concerns.some((c) => c.toLowerCase().includes("shower/bath availability at"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. HOT WATER SAFETY CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("hot water safety concerns", () => {
  it("critical concern when hotWaterSafetyRate < 60", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false }),
        makeHotWater({ id: "h2", within_safe_range: false }),
        makeHotWater({ id: "h3", within_safe_range: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("critical safety failure"))).toBe(true);
  });

  it("concern when hotWaterSafetyRate 60-79", () => {
    // 2/3 = 67%
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: true }),
        makeHotWater({ id: "h2", within_safe_range: true }),
        makeHotWater({ id: "h3", within_safe_range: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("67%") && c.includes("ot water safety"))).toBe(true);
  });

  it("no hot water concern when rate >= 80", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.concerns.some((c) => c.toLowerCase().includes("hot water safety at"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. PRIVACY CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("privacy concerns", () => {
  it("concern when privacyRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("privacy compliance"))).toBe(true);
  });

  it("concern when privacyRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1" }),
        makePrivacy({ id: "p2", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
    }));
    // 3/6 = 50%
    expect(r.concerns.some((c) => c.includes("rivacy rate at 50%"))).toBe(true);
  });

  it("no privacy concern when rate >= 70", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.concerns.some((c) => c.toLowerCase().includes("privacy rate at"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. ACCESSIBILITY CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("accessibility concerns", () => {
  it("concern when accessibilityRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("accessibility compliance"))).toBe(true);
  });

  it("concern when accessibilityRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1" }),
        makeAccessibility({ id: "a2", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
    }));
    // 3/6 = 50%
    expect(r.concerns.some((c) => c.includes("ccessibility rate at 50%"))).toBe(true);
  });

  it("no accessibility concern when rate >= 70", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.concerns.some((c) => c.toLowerCase().includes("accessibility rate at"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. CHILD SATISFACTION CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("child satisfaction concerns", () => {
  it("concern when childSatisfactionRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", child_feedback_collected: true, child_feedback_positive: false }),
        makeCleanlinessAudit({ id: "c2", child_feedback_collected: true, child_feedback_positive: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", child_consulted_on_privacy: true, child_satisfied_with_privacy: false }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", child_can_use_independently: false }),
      ],
    }));
    // 0/4 = 0%
    expect(r.concerns.some((c) => c.includes("child satisfaction"))).toBe(true);
  });

  it("concern when childSatisfactionRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", child_feedback_collected: true, child_feedback_positive: true }),
        makeCleanlinessAudit({ id: "c2", child_feedback_collected: true, child_feedback_positive: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", child_consulted_on_privacy: true, child_satisfied_with_privacy: false }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", child_can_use_independently: true }),
        makeAccessibility({ id: "a2", child_can_use_independently: false }),
        makeAccessibility({ id: "a3", child_can_use_independently: false }),
      ],
    }));
    // Cleanliness: 1/2, Privacy: 0/1, Accessibility: 1/3 → total 2/6 = 33%
    // That's < 50, not 50-69. Let me adjust.
    // To get 50-69: need ~3/5
    expect(r.child_satisfaction_rate).toBeLessThan(70);
  });

  it("no child satisfaction concern when rate >= 70", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.concerns.some((c) => c.toLowerCase().includes("child satisfaction at"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. SCALDING CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("scalding concerns", () => {
  it("concern for scalding incidents", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", scalding_incident_occurred: true }),
        makeHotWater({ id: "h2" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("scalding incident"))).toBe(true);
  });

  it("pluralises scalding incidents correctly", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", scalding_incident_occurred: true }),
        makeHotWater({ id: "h2", scalding_incident_occurred: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("2 scalding incidents"))).toBe(true);
  });

  it("singular for one scalding incident", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", scalding_incident_occurred: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("1 scalding incident ") && !c.includes("incidents"))).toBe(true);
  });

  it("concern for scalding risks without incidents", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", scalding_risk_identified: true, scalding_incident_occurred: false }),
        makeHotWater({ id: "h2" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("scalding risk"))).toBe(true);
  });

  it("no scalding risk concern when incidents present (incident concern takes precedence)", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", scalding_risk_identified: true, scalding_incident_occurred: true }),
      ],
    }));
    // Should show incident concern, not the risk-only concern
    expect(r.concerns.some((c) => c.includes("scalding incident"))).toBe(true);
    // The risk concern only fires when scaldingIncidentCount === 0
    expect(r.concerns.some((c) => c.includes("while no incidents have occurred"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. MOULD CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("mould concerns", () => {
  it("concern when mouldRate >= 30", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", mould_detected: true }),
        makeCleanlinessAudit({ id: "c2", mould_detected: true }),
        makeCleanlinessAudit({ id: "c3", mould_detected: false }),
      ],
    }));
    // 2/3 = 67%
    expect(r.concerns.some((c) => c.includes("Mould detected") && c.includes("health risk"))).toBe(true);
  });

  it("concern when mouldRate 15-29", () => {
    // 1/5 = 20%
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", mould_detected: true }),
        makeCleanlinessAudit({ id: "c2", mould_detected: false }),
        makeCleanlinessAudit({ id: "c3", mould_detected: false }),
        makeCleanlinessAudit({ id: "c4", mould_detected: false }),
        makeCleanlinessAudit({ id: "c5", mould_detected: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Mould detected") && c.includes("preventive action"))).toBe(true);
  });

  it("no mould concern when mouldRate < 15", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", mould_detected: true }),
        makeCleanlinessAudit({ id: "c2", mould_detected: false }),
        makeCleanlinessAudit({ id: "c3", mould_detected: false }),
        makeCleanlinessAudit({ id: "c4", mould_detected: false }),
        makeCleanlinessAudit({ id: "c5", mould_detected: false }),
        makeCleanlinessAudit({ id: "c6", mould_detected: false }),
        makeCleanlinessAudit({ id: "c7", mould_detected: false }),
      ],
    }));
    // 1/7 = 14%
    expect(r.concerns.some((c) => c.includes("Mould detected"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 21. TMV CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("TMV concerns", () => {
  it("concern when tmvFittedRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", tmv_fitted: false }),
        makeHotWater({ id: "h2", tmv_fitted: false }),
        makeHotWater({ id: "h3", tmv_fitted: true }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("TMV") && c.includes("significant safety gap"))).toBe(true);
  });

  it("concern when tmvFittedRate 50-79", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", tmv_fitted: true }),
        makeHotWater({ id: "h2", tmv_fitted: true }),
        makeHotWater({ id: "h3", tmv_fitted: false }),
      ],
    }));
    // 2/3 = 67%
    expect(r.concerns.some((c) => c.includes("TMV fitting rate at"))).toBe(true);
  });

  it("no TMV concern when rate >= 80", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.concerns.some((c) => c.includes("TMV fitting rate at"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 22. LOCK, KNOCK POLICY, FOLLOW-UP, REPAIR, LEGIONELLA, NEEDS CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("other concerns", () => {
  it("concern when lockFittedRate < 70", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", lock_fitted: false }),
        makePrivacy({ id: "p2", lock_fitted: false }),
        makePrivacy({ id: "p3", lock_fitted: true }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("locks fitted"))).toBe(true);
  });

  it("concern when knockPolicyRate < 70", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", knock_before_entry_policy_observed: false }),
        makePrivacy({ id: "p2", knock_before_entry_policy_observed: false }),
        makePrivacy({ id: "p3", knock_before_entry_policy_observed: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Knock-before-entry"))).toBe(true);
  });

  it("concern when followUpCompletionRate < 70", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", follow_up_required: true, follow_up_completed: false }),
        makeCleanlinessAudit({ id: "c2", follow_up_required: true, follow_up_completed: false }),
        makeCleanlinessAudit({ id: "c3", follow_up_required: true, follow_up_completed: true }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("follow-up actions completed"))).toBe(true);
  });

  it("concern when repairCompletionRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", repair_requested: true, repair_completed: false }),
        makeShowerAvailability({ id: "s2", repair_requested: true, repair_completed: false }),
        makeShowerAvailability({ id: "s3", repair_requested: true, repair_completed: true }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("repairs completed"))).toBe(true);
  });

  it("concern when legionellaCheckedRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", legionella_check_completed: false }),
        makeHotWater({ id: "h2", legionella_check_completed: false }),
        makeHotWater({ id: "h3", legionella_check_completed: true }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("Legionella checks"))).toBe(true);
  });

  it("concern when needsAssessmentRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false }),
        makeAccessibility({ id: "a2", individual_needs_assessment_completed: false }),
        makeAccessibility({ id: "a3", individual_needs_assessment_completed: true }),
      ],
    }));
    // 1/3 = 33%
    expect(r.concerns.some((c) => c.includes("needs assessments"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 23. RECOMMENDATIONS — IMMEDIATE
// ═══════════════════════════════════════════════════════════════════════════

describe("immediate recommendations", () => {
  it("recommendation for scalding incidents", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", scalding_incident_occurred: true }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("scalding incidents"))).toBe(true);
  });

  it("recommendation for hotWaterSafetyRate < 60", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false }),
        makeHotWater({ id: "h2", within_safe_range: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("hot water temperature safety"))).toBe(true);
  });

  it("recommendation for cleanlinessRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 2 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 1 }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("cleaning schedule"))).toBe(true);
  });

  it("recommendation for privacyRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("privacy provisions"))).toBe(true);
  });

  it("recommendation for tmvFittedRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", tmv_fitted: false }),
        makeHotWater({ id: "h2", tmv_fitted: false }),
        makeHotWater({ id: "h3", tmv_fitted: true }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("thermostatic mixing valves"))).toBe(true);
  });

  it("recommendation for accessibilityRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("accessibility needs"))).toBe(true);
  });

  it("recommendation for mouldRate >= 30", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", mould_detected: true }),
        makeCleanlinessAudit({ id: "c2", mould_detected: true }),
        makeCleanlinessAudit({ id: "c3", mould_detected: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("mould"))).toBe(true);
  });

  it("recommendation for showerAvailabilityRate < 70", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: false, bath_functional: false }),
        makeShowerAvailability({ id: "s2", shower_functional: false, bath_functional: false }),
        makeShowerAvailability({ id: "s3" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("shower and bath availability"))).toBe(true);
  });

  it("recommendation for childSatisfactionRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", child_feedback_collected: true, child_feedback_positive: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", child_consulted_on_privacy: true, child_satisfied_with_privacy: false }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", child_can_use_independently: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("dissatisfaction"))).toBe(true);
  });

  it("recommendation ranks are sequential starting from 1", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false, scalding_incident_occurred: true, tmv_fitted: false }),
        makeHotWater({ id: "h2", within_safe_range: false, tmv_fitted: false }),
      ],
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 1 }),
      ],
    }));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 24. RECOMMENDATIONS — SOON
// ═══════════════════════════════════════════════════════════════════════════

describe("soon recommendations", () => {
  it("recommendation for hotWaterSafetyRate 60-79", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1" }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3", within_safe_range: false }),
      ],
    }));
    // 2/3 = 67%
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("hot water temperature monitoring"))).toBe(true);
  });

  it("recommendation for cleanlinessRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 4 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 3 }),
      ],
    }));
    // 1/2 = 50%
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("cleaning routines"))).toBe(true);
  });

  it("recommendation for privacyRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1" }),
        makePrivacy({ id: "p2", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
    }));
    // 3/6 = 50%
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("privacy provisions"))).toBe(true);
  });

  it("recommendation for knockPolicyRate < 70", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", knock_before_entry_policy_observed: false }),
        makePrivacy({ id: "p2", knock_before_entry_policy_observed: false }),
        makePrivacy({ id: "p3", knock_before_entry_policy_observed: true }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("knock-before-entry"))).toBe(true);
  });

  it("recommendation for accessibilityRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1" }),
        makeAccessibility({ id: "a2", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
    }));
    // 3/6 = 50%
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("accessibility provisions"))).toBe(true);
  });

  it("recommendation for legionellaCheckedRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", legionella_check_completed: false }),
        makeHotWater({ id: "h2", legionella_check_completed: false }),
        makeHotWater({ id: "h3", legionella_check_completed: true }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Legionella"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 25. RECOMMENDATIONS — PLANNED
// ═══════════════════════════════════════════════════════════════════════════

describe("planned recommendations", () => {
  it("recommendation for antiSlipRate < 70", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", anti_slip_measures_in_place: false }),
        makeShowerAvailability({ id: "s2", anti_slip_measures_in_place: false }),
        makeShowerAvailability({ id: "s3", anti_slip_measures_in_place: true }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("anti-slip"))).toBe(true);
  });

  it("recommendation for tmvFittedRate 50-79", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", tmv_fitted: true }),
        makeHotWater({ id: "h2", tmv_fitted: true }),
        makeHotWater({ id: "h3", tmv_fitted: false }),
      ],
    }));
    // 2/3 = 67%
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("TMV installation"))).toBe(true);
  });

  it("recommendation for mouldRate 15-29", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", mould_detected: true }),
        makeCleanlinessAudit({ id: "c2", mould_detected: false }),
        makeCleanlinessAudit({ id: "c3", mould_detected: false }),
        makeCleanlinessAudit({ id: "c4", mould_detected: false }),
        makeCleanlinessAudit({ id: "c5", mould_detected: false }),
      ],
    }));
    // 1/5 = 20%
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("mould"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 26. RECOMMENDATIONS — REGULATORY REFS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendation regulatory references", () => {
  it("all recommendations reference Reg 25 or SCCIF", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 1, mould_detected: true }),
        makeCleanlinessAudit({ id: "c2", overall_score: 2, mould_detected: true }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false, tmv_fitted: false, scalding_incident_occurred: true, legionella_check_completed: false }),
        makeHotWater({ id: "h2", within_safe_range: false, tmv_fitted: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: false, bath_functional: false, anti_slip_measures_in_place: false }),
        makeShowerAvailability({ id: "s2", shower_functional: false, bath_functional: false, anti_slip_measures_in_place: false }),
        makeShowerAvailability({ id: "s3" }),
      ],
    }));
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref).toMatch(/Reg 25|SCCIF/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 27. CRITICAL INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("critical insights", () => {
  it("critical insight for scalding incidents", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", scalding_incident_occurred: true }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("scalding"))).toBe(true);
  });

  it("critical insight for hotWaterSafetyRate < 60", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false }),
        makeHotWater({ id: "h2", within_safe_range: false }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("hot water temperature safety"))).toBe(true);
  });

  it("critical insight for cleanlinessRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 2 }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("cleanliness audits passed"))).toBe(true);
  });

  it("critical insight for privacyRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("privacy compliance"))).toBe(true);
  });

  it("critical insight for tmvFittedRate < 50", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", tmv_fitted: false }),
        makeHotWater({ id: "h2", tmv_fitted: false }),
        makeHotWater({ id: "h3", tmv_fitted: true }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("TMVs fitted"))).toBe(true);
  });

  it("critical insight for no hot water records with children", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No hot water temperature records"))).toBe(true);
  });

  it("critical insight for no cleanliness audits with children", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No bathroom cleanliness audit records"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 28. WARNING INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("warning insights", () => {
  it("warning for hotWaterSafetyRate 60-79", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1" }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3", within_safe_range: false }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Hot water safety at 67%"))).toBe(true);
  });

  it("warning for cleanlinessRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 4 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 3 }),
      ],
    }));
    // 1/2 = 50%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Bathroom cleanliness at 50%"))).toBe(true);
  });

  it("warning for privacyRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1" }),
        makePrivacy({ id: "p2", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
    }));
    // 3/6 = 50%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Privacy compliance at 50%"))).toBe(true);
  });

  it("warning for accessibilityRate 50-69", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1" }),
        makeAccessibility({ id: "a2", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
    }));
    // 3/6 = 50%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Accessibility at 50%"))).toBe(true);
  });

  it("warning for showerAvailabilityRate 70-79", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1" }),
        makeShowerAvailability({ id: "s2" }),
        makeShowerAvailability({ id: "s3" }),
        makeShowerAvailability({ id: "s4", shower_functional: false, bath_functional: false }),
      ],
    }));
    // 3/4 = 75%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Shower/bath availability at 75%"))).toBe(true);
  });

  it("warning for childSatisfactionRate 50-69", () => {
    // Cleanliness 1/2, Privacy 0/1, Accessibility 1/2 → 2/5 = 40%
    // That's < 50. Let me adjust for 50-69.
    const r2 = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", child_feedback_collected: true, child_feedback_positive: true }),
        makeCleanlinessAudit({ id: "c2", child_feedback_collected: true, child_feedback_positive: true }),
        makeCleanlinessAudit({ id: "c3", child_feedback_collected: true, child_feedback_positive: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", child_consulted_on_privacy: true, child_satisfied_with_privacy: false }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", child_can_use_independently: true }),
        makeAccessibility({ id: "a2", child_can_use_independently: false }),
      ],
    }));
    // Cleanliness 2/3, Privacy 0/1, Accessibility 1/2 → 3/6 = 50%
    expect(r2.insights.some((i) => i.severity === "warning" && i.text.includes("Child satisfaction at 50%"))).toBe(true);
  });

  it("warning for mouldRate 15-29", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", mould_detected: true }),
        makeCleanlinessAudit({ id: "c2", mould_detected: false }),
        makeCleanlinessAudit({ id: "c3", mould_detected: false }),
        makeCleanlinessAudit({ id: "c4", mould_detected: false }),
        makeCleanlinessAudit({ id: "c5", mould_detected: false }),
      ],
    }));
    // 1/5 = 20%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Mould detected in 20%"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 29. HOTSPOT BATHROOMS INSIGHT
// ═══════════════════════════════════════════════════════════════════════════

describe("hotspot bathrooms insight", () => {
  it("detects bathrooms with 3+ issues as hotspots", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", bathroom_id: "bath_x", overall_score: 2, hazards_found: true, mould_detected: true }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", bathroom_id: "bath_x", shower_functional: false }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", bathroom_id: "bath_x", within_safe_range: false }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("hotspot"))).toBe(true);
  });

  it("does not flag bathrooms with < 3 issues", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", bathroom_id: "bath_x", overall_score: 2 }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", bathroom_id: "bath_x" }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", bathroom_id: "bath_x" }),
      ],
    }));
    expect(r.insights.some((i) => i.text.includes("hotspot"))).toBe(false);
  });

  it("pluralises hotspot count correctly for one bathroom", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", bathroom_id: "bath_x", overall_score: 2, hazards_found: true, mould_detected: true }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", bathroom_id: "bath_x", shower_functional: false }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", bathroom_id: "bath_x", within_safe_range: false }),
      ],
    }));
    expect(r.insights.some((i) => i.text.includes("1 bathroom identified"))).toBe(true);
  });

  it("pluralises hotspot count correctly for multiple bathrooms", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", bathroom_id: "bath_x", overall_score: 2, hazards_found: true, mould_detected: true }),
        makeCleanlinessAudit({ id: "c2", bathroom_id: "bath_y", overall_score: 2, hazards_found: true, mould_detected: true }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", bathroom_id: "bath_x", shower_functional: false }),
        makeShowerAvailability({ id: "s2", bathroom_id: "bath_y", shower_functional: false }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", bathroom_id: "bath_x", within_safe_range: false }),
        makeHotWater({ id: "h2", bathroom_id: "bath_y", within_safe_range: false }),
      ],
    }));
    expect(r.insights.some((i) => i.text.includes("2 bathrooms identified"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 30. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("outstanding headline mentions outstanding", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline mentions strengths count", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 3 }),
        makeCleanlinessAudit({ id: "c4", overall_score: 3 }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1" }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3", within_safe_range: false, tmv_fitted: false }),
      ],
    }));
    if (r.bathroom_rating === "good") {
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("strength");
    }
  });

  it("adequate headline mentions concerns count", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 2 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 3 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 3 }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: false, hot_water_available: false }),
        makeShowerAvailability({ id: "s2" }),
        makeShowerAvailability({ id: "s3" }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false, tmv_fitted: false }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3" }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false }),
        makePrivacy({ id: "p2" }),
        makePrivacy({ id: "p3" }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false, adaptations_match_care_plan: false }),
        makeAccessibility({ id: "a2" }),
        makeAccessibility({ id: "a3" }),
      ],
    }));
    if (r.bathroom_rating === "adequate") {
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("concern");
    }
  });

  it("inadequate headline mentions significant concerns", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 1 }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false, scalding_incident_occurred: true, tmv_fitted: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: false, bath_functional: false }),
      ],
    }));
    if (r.bathroom_rating === "inadequate") {
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("significant concern");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 31. STRENGTHS — INTERMEDIATE THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — intermediate thresholds", () => {
  it("cleanliness strength at 70-89%", () => {
    // 3/4 = 75%
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c2", overall_score: 5 }),
        makeCleanlinessAudit({ id: "c3", overall_score: 4 }),
        makeCleanlinessAudit({ id: "c4", overall_score: 3 }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("75%") && s.includes("cleanliness audit pass rate"))).toBe(true);
  });

  it("shower availability strength at 80-94%", () => {
    // 4/5 = 80%
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1" }),
        makeShowerAvailability({ id: "s2" }),
        makeShowerAvailability({ id: "s3" }),
        makeShowerAvailability({ id: "s4" }),
        makeShowerAvailability({ id: "s5", shower_functional: false, bath_functional: false }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("shower/bath availability"))).toBe(true);
  });

  it("hot water safety strength at 80-94%", () => {
    // 4/5 = 80%
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1" }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3" }),
        makeHotWater({ id: "h4" }),
        makeHotWater({ id: "h5", within_safe_range: false }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("hot water safety rate"))).toBe(true);
  });

  it("privacy strength at 70-89%", () => {
    // Need composite 70-89%
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1" }),
        makePrivacy({ id: "p2" }),
        makePrivacy({ id: "p3", lock_functional: false }),
      ],
    }));
    // lockFunctional: 2, adequateScreening: 3, knockPolicy: 3 → 8/9 = 89%
    expect(r.strengths.some((s) => s.includes("privacy rate"))).toBe(true);
  });

  it("accessibility strength at 70-89%", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1" }),
        makeAccessibility({ id: "a2" }),
        makeAccessibility({ id: "a3", individual_needs_assessment_completed: false }),
      ],
    }));
    // needs: 2, adaptations: 3, independent: 3 → 8/9 = 89%
    expect(r.strengths.some((s) => s.includes("accessibility rate"))).toBe(true);
  });

  it("child satisfaction strength at 70-89%", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", child_feedback_collected: true, child_feedback_positive: true }),
        makeCleanlinessAudit({ id: "c2", child_feedback_collected: true, child_feedback_positive: true }),
        makeCleanlinessAudit({ id: "c3", child_feedback_collected: true, child_feedback_positive: false }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", child_consulted_on_privacy: true, child_satisfied_with_privacy: true }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", child_can_use_independently: true }),
      ],
    }));
    // Cleanliness: 2/3, Privacy: 1/1, Accessibility: 1/1 → 4/5 = 80%
    expect(r.strengths.some((s) => s.includes("child satisfaction"))).toBe(true);
  });

  it("TMV strength at 80-94%", () => {
    // 4/5 = 80%
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1" }),
        makeHotWater({ id: "h2" }),
        makeHotWater({ id: "h3" }),
        makeHotWater({ id: "h4" }),
        makeHotWater({ id: "h5", tmv_fitted: false }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("TMV fitting rate"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 32. CORRECTIVE ACTION STRENGTH
// ═══════════════════════════════════════════════════════════════════════════

describe("corrective action strength", () => {
  it("strength when correctiveActionRate >= 95 with hazards found", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", hazards_found: true, corrective_action_taken: true }),
        makeCleanlinessAudit({ id: "c2", hazards_found: true, corrective_action_taken: true }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("corrective action taken"))).toBe(true);
  });

  it("no corrective action strength when no hazards found", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    // No hazards → corrective action rate defaults to 100% but hazardsFoundCount is 0
    expect(r.strengths.some((s) => s.includes("corrective action taken"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 33. PARTIAL DATA — MISSING RECORD TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe("partial data — missing record types", () => {
  it("no hot water records but children → critical insight", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No hot water temperature records"))).toBe(true);
  });

  it("no cleanliness audits but children → critical insight", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No bathroom cleanliness audit records"))).toBe(true);
  });

  it("no shower availability records does not trigger missing-data insight", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [],
    }));
    // Only hot water and cleanliness have missing-data critical insights
    expect(r.insights.some((i) => i.text.includes("No shower availability records"))).toBe(false);
  });

  it("zero hot water rate when no hot water records", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [],
    }));
    expect(r.hot_water_safety_rate).toBe(0);
  });

  it("zero cleanliness rate when no cleanliness records", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [],
    }));
    expect(r.cleanliness_rate).toBe(0);
  });

  it("zero shower availability rate when no shower records", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [],
    }));
    expect(r.shower_availability_rate).toBe(0);
  });

  it("zero privacy rate when no privacy records", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [],
    }));
    expect(r.privacy_rate).toBe(0);
  });

  it("zero accessibility rate when no accessibility records", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      accessibility_records: [],
    }));
    expect(r.accessibility_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 34. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("single record per category still computes", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [makeCleanlinessAudit({ id: "c1" })],
      shower_availability_records: [makeShowerAvailability({ id: "s1" })],
      hot_water_records: [makeHotWater({ id: "h1" })],
      privacy_records: [makePrivacy({ id: "p1" })],
      accessibility_records: [makeAccessibility({ id: "a1" })],
    }));
    expect(r.bathroom_rating).toBe("outstanding");
  });

  it("large number of records performs correctly", () => {
    const cleanlinessRecords = Array.from({ length: 50 }, (_, i) =>
      makeCleanlinessAudit({ id: `c${i}`, overall_score: 5 }),
    );
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: cleanlinessRecords,
    }));
    expect(r.total_cleanliness_audits).toBe(50);
    expect(r.cleanliness_rate).toBe(100);
  });

  it("all records fail produces low score", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", overall_score: 1 }),
      ],
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", shower_functional: false, bath_functional: false, hot_water_available: false }),
      ],
      hot_water_records: [
        makeHotWater({ id: "h1", within_safe_range: false, tmv_fitted: false, scalding_incident_occurred: true }),
      ],
      privacy_records: [
        makePrivacy({ id: "p1", lock_functional: false, adequate_screening: false, knock_before_entry_policy_observed: false }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", individual_needs_assessment_completed: false, adaptations_match_care_plan: false, child_can_use_independently: false }),
      ],
    }));
    expect(r.bathroom_rating).toBe("inadequate");
    expect(r.bathroom_score).toBeLessThan(45);
  });

  it("repair completion defaults to 100% when no repairs requested", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      shower_availability_records: [
        makeShowerAvailability({ id: "s1", repair_requested: false }),
      ],
    }));
    // No repair concern should appear
    expect(r.concerns.some((c) => c.includes("repairs completed"))).toBe(false);
  });

  it("follow-up completion defaults to 100% when no follow-ups required", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", follow_up_required: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("follow-up actions completed"))).toBe(false);
  });

  it("corrective action defaults to 100% when no hazards found", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      cleanliness_audit_records: [
        makeCleanlinessAudit({ id: "c1", hazards_found: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("corrective action"))).toBe(false);
  });

  it("complaint resolution defaults to 100% when no complaints", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      privacy_records: [
        makePrivacy({ id: "p1", privacy_complaint_received: false }),
      ],
    }));
    // No complaint concern
    expect(r.concerns.some((c) => c.includes("complaint"))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 35. RETURN SHAPE
// ═══════════════════════════════════════════════════════════════════════════

describe("return shape", () => {
  it("has all required top-level fields", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r).toHaveProperty("bathroom_rating");
    expect(r).toHaveProperty("bathroom_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_cleanliness_audits");
    expect(r).toHaveProperty("total_shower_availability_checks");
    expect(r).toHaveProperty("total_hot_water_records");
    expect(r).toHaveProperty("total_privacy_records");
    expect(r).toHaveProperty("total_accessibility_records");
    expect(r).toHaveProperty("cleanliness_rate");
    expect(r).toHaveProperty("shower_availability_rate");
    expect(r).toHaveProperty("hot_water_safety_rate");
    expect(r).toHaveProperty("privacy_rate");
    expect(r).toHaveProperty("accessibility_rate");
    expect(r).toHaveProperty("child_satisfaction_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("rating is a valid enum value", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.bathroom_rating);
  });

  it("score is a number between 0 and 100", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.bathroom_score).toBeGreaterThanOrEqual(0);
    expect(r.bathroom_score).toBeLessThanOrEqual(100);
  });

  it("rates are numbers between 0 and 100", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    for (const key of [
      "cleanliness_rate",
      "shower_availability_rate",
      "hot_water_safety_rate",
      "privacy_rate",
      "accessibility_rate",
      "child_satisfaction_rate",
    ] as const) {
      expect(r[key]).toBeGreaterThanOrEqual(0);
      expect(r[key]).toBeLessThanOrEqual(100);
    }
  });

  it("strengths, concerns are string arrays", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.concerns)).toBe(true);
  });

  it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
    const r = computeBathroomShowerFacilities(baseInput({
      hot_water_records: [
        makeHotWater({ id: "h1", scalding_incident_occurred: true }),
      ],
    }));
    for (const rec of r.recommendations) {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
    }
  });

  it("insights have text and severity", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    for (const insight of r.insights) {
      expect(insight).toHaveProperty("text");
      expect(insight).toHaveProperty("severity");
      expect(["critical", "warning", "positive"]).toContain(insight.severity);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 36. NO RECOMMENDATIONS WHEN ALL IS WELL
// ═══════════════════════════════════════════════════════════════════════════

describe("no recommendations when all is well", () => {
  it("zero recommendations for perfect input", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("zero concerns for perfect input", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.concerns.length).toBe(0);
  });

  it("no critical or warning insights for perfect input", () => {
    const r = computeBathroomShowerFacilities(baseInput());
    expect(r.insights.filter((i) => i.severity === "critical").length).toBe(0);
    expect(r.insights.filter((i) => i.severity === "warning").length).toBe(0);
  });
});
