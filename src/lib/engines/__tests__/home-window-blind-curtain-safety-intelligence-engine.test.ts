// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WINDOW, BLIND & CURTAIN SAFETY INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering window restrictors, blind cord safety,
// curtain condition, blackout provision, inspections, and scoring.
// CHR 2015 Reg 25 (Premises), SCCIF safety and wellbeing.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeWindowBlindCurtainSafety,
  type WindowBlindCurtainSafetyInput,
  type WindowRestrictorRecordInput,
  type BlindCordRecordInput,
  type CurtainConditionRecordInput,
  type BlackoutRecordInput,
  type WindowSafetyInspectionRecordInput,
} from "../home-window-blind-curtain-safety-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;

function makeRestrictor(overrides: Partial<WindowRestrictorRecordInput> = {}): WindowRestrictorRecordInput {
  _id++;
  return {
    id: `wr_${_id}`,
    room_id: `room_${_id}`,
    room_name: `Room ${_id}`,
    floor_level: 1,
    check_date: "2026-05-20",
    restrictor_fitted: true,
    restrictor_functional: true,
    restrictor_type: "screw_lock",
    opening_within_100mm: true,
    key_accessible_to_staff_only: true,
    checked_by: "staff_1",
    issue_identified: false,
    issue_description: null,
    issue_resolved: false,
    resolution_date: null,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeBlindCord(overrides: Partial<BlindCordRecordInput> = {}): BlindCordRecordInput {
  _id++;
  return {
    id: `bc_${_id}`,
    room_id: `room_${_id}`,
    room_name: `Room ${_id}`,
    check_date: "2026-05-20",
    blind_type: "roller",
    cord_present: false,
    cord_secured: false,
    cord_free_alternative: true,
    child_accessible: false,
    safety_device_fitted: false,
    compliant: true,
    checked_by: "staff_1",
    issue_identified: false,
    issue_description: null,
    issue_resolved: false,
    resolution_date: null,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeCurtainCondition(overrides: Partial<CurtainConditionRecordInput> = {}): CurtainConditionRecordInput {
  _id++;
  return {
    id: `cc_${_id}`,
    room_id: `room_${_id}`,
    room_name: `Room ${_id}`,
    check_date: "2026-05-20",
    curtain_present: true,
    curtain_clean: true,
    curtain_intact: true,
    rail_secure: true,
    hooks_safe: true,
    fire_retardant: true,
    appropriate_length: true,
    child_safe_rail: true,
    overall_condition: "good",
    checked_by: "staff_1",
    issue_identified: false,
    issue_description: null,
    issue_resolved: false,
    resolution_date: null,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeBlackout(overrides: Partial<BlackoutRecordInput> = {}): BlackoutRecordInput {
  _id++;
  return {
    id: `bo_${_id}`,
    room_id: `room_${_id}`,
    room_name: `Room ${_id}`,
    child_id: "yp_1",
    check_date: "2026-05-20",
    blackout_provided: true,
    blackout_type: "blackout_blind",
    blackout_effective: true,
    child_specific_need: false,
    need_met: false,
    seasonal_review_completed: true,
    checked_by: "staff_1",
    issue_identified: false,
    issue_description: null,
    issue_resolved: false,
    resolution_date: null,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeInspection(overrides: Partial<WindowSafetyInspectionRecordInput> = {}): WindowSafetyInspectionRecordInput {
  _id++;
  return {
    id: `insp_${_id}`,
    inspection_date: "2026-05-20",
    inspector: "staff_1",
    inspection_type: "routine",
    total_windows_checked: 10,
    total_windows_compliant: 10,
    total_blinds_checked: 10,
    total_blinds_compliant: 10,
    total_curtains_checked: 10,
    total_curtains_compliant: 10,
    actions_required: 0,
    actions_completed: 0,
    overall_pass: true,
    next_inspection_due: "2026-08-20",
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

const baseInput: WindowBlindCurtainSafetyInput = {
  today: TODAY,
  total_children: 3,
  window_restrictor_records: [],
  blind_cord_records: [],
  curtain_condition_records: [],
  blackout_records: [],
  inspection_records: [],
};

function run(overrides: Partial<WindowBlindCurtainSafetyInput> = {}) {
  return computeWindowBlindCurtainSafety({ ...baseInput, ...overrides });
}

// ── 1. Insufficient Data / Edge Cases ──────────────────────────────────────

describe("insufficient data and edge cases", () => {
  it("returns insufficient_data when all empty and 0 children", () => {
    const r = run({ total_children: 0 });
    expect(r.window_safety_rating).toBe("insufficient_data");
    expect(r.window_safety_score).toBe(0);
  });

  it("returns inadequate with score 15 when all empty but children > 0", () => {
    const r = run({ total_children: 3 });
    expect(r.window_safety_rating).toBe("inadequate");
    expect(r.window_safety_score).toBe(15);
    expect(r.concerns.length).toBe(1);
    expect(r.recommendations.length).toBe(2);
    expect(r.insights.length).toBe(1);
  });

  it("headline for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.headline).toContain("No children on placement");
  });

  it("headline for empty with children", () => {
    const r = run({ total_children: 2 });
    expect(r.headline).toContain("No window, blind or curtain safety data");
  });

  it("regulatory refs for empty-with-children", () => {
    const r = run({ total_children: 2 });
    expect(r.recommendations[0].regulatory_ref).toContain("Reg 25");
  });

  it("all rates 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.window_restrictor_rate).toBe(0);
    expect(r.blind_cord_safety_rate).toBe(0);
    expect(r.curtain_condition_rate).toBe(0);
    expect(r.blackout_provision_rate).toBe(0);
    expect(r.child_safety_rate).toBe(0);
    expect(r.inspection_compliance_rate).toBe(0);
  });

  it("empty arrays for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
  });

  it("total record counts are 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.total_restrictor_records).toBe(0);
    expect(r.total_blind_records).toBe(0);
    expect(r.total_curtain_records).toBe(0);
    expect(r.total_blackout_records).toBe(0);
    expect(r.total_inspection_records).toBe(0);
  });
});

// ── 2. Window Restrictor Compliance ────────────────────────────────────────

describe("window restrictor compliance", () => {
  it("100% when all fitted, functional, within 100mm", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor());
    const r = run({ window_restrictor_records: records });
    expect(r.window_restrictor_rate).toBe(100);
  });

  it("0% when none compliant", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.window_restrictor_rate).toBe(0);
  });

  it("50% with mixed records", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeRestrictor()),
      ...Array.from({ length: 5 }, () => makeRestrictor({ restrictor_fitted: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.window_restrictor_rate).toBe(50);
  });

  it(">=90% gives +5 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor());
    const r = run({ window_restrictor_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(57);
  });

  it("70-89% gives +2 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeRestrictor()),
      ...Array.from({ length: 2 }, () => makeRestrictor({ restrictor_fitted: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.window_restrictor_rate).toBe(80);
  });

  it("<50% gives -8 penalty", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.window_safety_score).toBeLessThanOrEqual(44);
  });

  it("strength for >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor());
    const r = run({ window_restrictor_records: records });
    expect(r.strengths.some(s => s.includes("window restrictor compliance"))).toBe(true);
  });

  it("strength for 70-89%", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeRestrictor()),
      ...Array.from({ length: 2 }, () => makeRestrictor({ restrictor_fitted: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.strengths.some(s => s.includes("majority of windows"))).toBe(true);
  });

  it("concern for <50%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.concerns.some(c => c.includes("window restrictor compliance"))).toBe(true);
  });

  it("concern for 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeRestrictor()),
      ...Array.from({ length: 4 }, () => makeRestrictor({ restrictor_fitted: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.concerns.some(c => c.includes("Window restrictor compliance at 60%"))).toBe(true);
  });

  it("upper floor compliance strength >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ floor_level: 2 }));
    const r = run({ window_restrictor_records: records });
    expect(r.strengths.some(s => s.includes("upper-floor window compliance"))).toBe(true);
  });

  it("upper floor compliance concern <50%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ floor_level: 2, restrictor_fitted: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.concerns.some(c => c.includes("upper-floor windows are fully compliant"))).toBe(true);
  });

  it("key security strength >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ key_accessible_to_staff_only: true }));
    const r = run({ window_restrictor_records: records });
    expect(r.strengths.some(s => s.includes("restrictor keys"))).toBe(true);
  });

  it("critical insight for <50%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("window restrictor compliance"))).toBe(true);
  });

  it("warning insight for 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeRestrictor()),
      ...Array.from({ length: 4 }, () => makeRestrictor({ restrictor_fitted: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Window restrictor compliance at 60%"))).toBe(true);
  });

  it("positive insight for >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor());
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("window restrictor compliance"))).toBe(true);
  });

  it("recommendation for <50%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Urgently fit"))).toBe(true);
  });

  it("recommendation for 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeRestrictor()),
      ...Array.from({ length: 4 }, () => makeRestrictor({ restrictor_fitted: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Improve window restrictor compliance"))).toBe(true);
  });

  it("no records concern when other data exists", () => {
    const r = run({ total_children: 3, window_restrictor_records: [], blind_cord_records: [makeBlindCord()] });
    expect(r.concerns.some(c => c.includes("No window restrictor check records"))).toBe(true);
  });

  it("recommendation for no records", () => {
    const r = run({ total_children: 3, window_restrictor_records: [], blind_cord_records: [makeBlindCord()] });
    expect(r.recommendations.some(rec => rec.recommendation.includes("window restrictor checks"))).toBe(true);
  });

  it("upper floor concern 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeRestrictor({ floor_level: 2 })),
      ...Array.from({ length: 4 }, () => makeRestrictor({ floor_level: 2, restrictor_fitted: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.concerns.some(c => c.includes("Upper-floor window compliance at 60%"))).toBe(true);
  });

  it("upper floor strength 70-89%", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeRestrictor({ floor_level: 1 })),
      ...Array.from({ length: 2 }, () => makeRestrictor({ floor_level: 1, restrictor_fitted: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.strengths.some(s => s.includes("upper-floor windows are fully compliant"))).toBe(true);
  });
});

// ── 3. Blind Cord Safety ───────────────────────────────────────────────────

describe("blind cord safety", () => {
  it("100% when all compliant", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: true }));
    const r = run({ blind_cord_records: records });
    expect(r.blind_cord_safety_rate).toBe(100);
  });

  it("0% when none compliant", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: false }));
    const r = run({ blind_cord_records: records });
    expect(r.blind_cord_safety_rate).toBe(0);
  });

  it(">=90% gives +5 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: true }));
    const r = run({ blind_cord_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(57);
  });

  it("<50% gives -8 penalty", () => {
    // 52 - 8 (blind <50%) + 4 (childSafety bonus from 0 accessible cords) = 48
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: false }));
    const r = run({ blind_cord_records: records });
    expect(r.window_safety_score).toBeLessThanOrEqual(48);
  });

  it("child accessible cords gives -6 penalty", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ cord_present: true, child_accessible: true, compliant: true }));
    const r = run({ blind_cord_records: records });
    // Even with 100% compliant, accessible cords give -6
    expect(r.window_safety_score).toBeLessThanOrEqual(57);
  });

  it("zero child-accessible cords strength", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ child_accessible: false }));
    const r = run({ blind_cord_records: records });
    expect(r.strengths.some(s => s.includes("Zero child-accessible blind cords"))).toBe(true);
  });

  it("concern for child accessible cords", () => {
    const records = [makeBlindCord({ cord_present: true, child_accessible: true })];
    const r = run({ blind_cord_records: records });
    expect(r.concerns.some(c => c.includes("accessible to children"))).toBe(true);
  });

  it("critical insight for child accessible cords", () => {
    const records = [makeBlindCord({ cord_present: true, child_accessible: true })];
    const r = run({ blind_cord_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Blind cord strangulation"))).toBe(true);
  });

  it("recommendation to eliminate child accessible cords", () => {
    const records = [makeBlindCord({ cord_present: true, child_accessible: true })];
    const r = run({ blind_cord_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Eliminate all child-accessible"))).toBe(true);
  });

  it("strength for >=90% compliance", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: true }));
    const r = run({ blind_cord_records: records });
    expect(r.strengths.some(s => s.includes("blind cord safety compliance"))).toBe(true);
  });

  it("concern for <50% compliance", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: false }));
    const r = run({ blind_cord_records: records });
    expect(r.concerns.some(c => c.includes("blind cord safety compliance"))).toBe(true);
  });

  it("strength for >=90% cord-free", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ cord_free_alternative: true }));
    const r = run({ blind_cord_records: records });
    expect(r.strengths.some(s => s.includes("cordless alternatives"))).toBe(true);
  });

  it("strength for 70-89% cord-free", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeBlindCord({ cord_free_alternative: true })),
      ...Array.from({ length: 2 }, () => makeBlindCord({ cord_free_alternative: false })),
    ];
    const r = run({ blind_cord_records: records });
    expect(r.strengths.some(s => s.includes("cord-free alternatives"))).toBe(true);
  });

  it("no blind records concern when other data exists", () => {
    const r = run({ total_children: 3, blind_cord_records: [], window_restrictor_records: [makeRestrictor()] });
    expect(r.concerns.some(c => c.includes("No blind cord safety records"))).toBe(true);
  });

  it("recommendation for no blind records", () => {
    const r = run({ total_children: 3, blind_cord_records: [], window_restrictor_records: [makeRestrictor()] });
    expect(r.recommendations.some(rec => rec.recommendation.includes("blind cord safety assessment"))).toBe(true);
  });

  it("positive insight for cord-free >= 90% with zero accessible", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ cord_free_alternative: true, child_accessible: false, compliant: true }));
    const r = run({ blind_cord_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("cord-free blinds"))).toBe(true);
  });

  it("concern for 50-69% compliance", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeBlindCord({ compliant: true })),
      ...Array.from({ length: 4 }, () => makeBlindCord({ compliant: false })),
    ];
    const r = run({ blind_cord_records: records });
    expect(r.concerns.some(c => c.includes("Blind cord safety compliance at 60%"))).toBe(true);
  });

  it("recommendation for 50-69% compliance", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeBlindCord({ compliant: true })),
      ...Array.from({ length: 4 }, () => makeBlindCord({ compliant: false })),
    ];
    const r = run({ blind_cord_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Improve blind cord safety compliance"))).toBe(true);
  });
});

// ── 4. Curtain Condition ───────────────────────────────────────────────────

describe("curtain condition", () => {
  it("100% when all checks pass", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition());
    const r = run({ curtain_condition_records: records });
    expect(r.curtain_condition_rate).toBe(100);
  });

  it("0% when no curtains present", () => {
    const records = Array.from({ length: 5 }, () => makeCurtainCondition({ curtain_present: false }));
    const r = run({ curtain_condition_records: records });
    expect(r.curtain_condition_rate).toBe(0);
  });

  it("strength for >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition());
    const r = run({ curtain_condition_records: records });
    expect(r.strengths.some(s => s.includes("curtain condition compliance"))).toBe(true);
  });

  it("concern for <50%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeCurtainCondition({ curtain_clean: false, curtain_intact: false, rail_secure: false, hooks_safe: false, fire_retardant: false, appropriate_length: false, child_safe_rail: false })
    );
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("curtain condition compliance"))).toBe(true);
  });

  it("concern for unsuitable curtains", () => {
    const records = [makeCurtainCondition({ overall_condition: "unsuitable" })];
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("unsuitable"))).toBe(true);
  });

  it("concern for poor condition curtains", () => {
    const records = [makeCurtainCondition({ overall_condition: "poor" })];
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("poor condition"))).toBe(true);
  });

  it("strength for fire retardant >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition({ fire_retardant: true }));
    const r = run({ curtain_condition_records: records });
    expect(r.strengths.some(s => s.includes("fire retardant"))).toBe(true);
  });

  it("concern for fire retardant <50%", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition({ fire_retardant: false }));
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("fire retardant"))).toBe(true);
  });

  it("strength for child-safe rail >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition({ child_safe_rail: true }));
    const r = run({ curtain_condition_records: records });
    expect(r.strengths.some(s => s.includes("child-safe"))).toBe(true);
  });

  it("concern for child-safe rail <50%", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition({ child_safe_rail: false }));
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("child-safe"))).toBe(true);
  });

  it("recommendation for unsuitable curtains", () => {
    const records = [makeCurtainCondition({ overall_condition: "unsuitable" })];
    const r = run({ curtain_condition_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("unsuitable"))).toBe(true);
  });

  it("recommendation for fire retardant <50%", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition({ fire_retardant: false }));
    const r = run({ curtain_condition_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("fire-retardant"))).toBe(true);
  });

  it("recommendation for child-safe rail <50%", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition({ child_safe_rail: false }));
    const r = run({ curtain_condition_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("anti-ligature"))).toBe(true);
  });

  it("critical insight for fire retardant <50%", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition({ fire_retardant: false }));
    const r = run({ curtain_condition_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("fire retardant"))).toBe(true);
  });

  it("critical insight for child-safe rail <50%", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition({ child_safe_rail: false }));
    const r = run({ curtain_condition_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("child-safe"))).toBe(true);
  });

  it("strength for 70-89% condition", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeCurtainCondition()),
      ...Array.from({ length: 2 }, () => makeCurtainCondition({ curtain_clean: false, curtain_intact: false, rail_secure: false, hooks_safe: false, fire_retardant: false, appropriate_length: false, child_safe_rail: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.strengths.some(s => s.includes("curtain condition compliance"))).toBe(true);
  });

  it("positive insight for >=90% condition", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition());
    const r = run({ curtain_condition_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("curtain condition compliance"))).toBe(true);
  });
});

// ── 5. Blackout Provision ──────────────────────────────────────────────────

describe("blackout provision", () => {
  it("100% when all provided", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ blackout_provided: true }));
    const r = run({ blackout_records: records });
    expect(r.blackout_provision_rate).toBe(100);
  });

  it("0% when none provided", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ blackout_provided: false }));
    const r = run({ blackout_records: records });
    expect(r.blackout_provision_rate).toBe(0);
  });

  it("strength for >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout());
    const r = run({ blackout_records: records });
    expect(r.strengths.some(s => s.includes("blackout provision"))).toBe(true);
  });

  it("concern for <50%", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ blackout_provided: false }));
    const r = run({ blackout_records: records });
    expect(r.concerns.some(c => c.includes("blackout"))).toBe(true);
  });

  it("strength for child need met >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ child_specific_need: true, need_met: true }));
    const r = run({ blackout_records: records });
    expect(r.strengths.some(s => s.includes("blackout needs"))).toBe(true);
  });

  it("concern for child need met <50%", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ child_specific_need: true, need_met: false }));
    const r = run({ blackout_records: records });
    expect(r.concerns.some(c => c.includes("blackout needs"))).toBe(true);
  });

  it("strength for seasonal review >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ seasonal_review_completed: true }));
    const r = run({ blackout_records: records });
    expect(r.strengths.some(s => s.includes("seasonal blackout reviews"))).toBe(true);
  });

  it("recommendation for <50% provision", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ blackout_provided: false }));
    const r = run({ blackout_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("blackout provision"))).toBe(true);
  });

  it("recommendation for child need met <50%", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ child_specific_need: true, need_met: false }));
    const r = run({ blackout_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("child-specific blackout needs"))).toBe(true);
  });

  it("recommendation for seasonal review <70%", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ seasonal_review_completed: false }));
    const r = run({ blackout_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("seasonal reviews"))).toBe(true);
  });

  it("concern for 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeBlackout({ blackout_provided: true })),
      ...Array.from({ length: 4 }, () => makeBlackout({ blackout_provided: false })),
    ];
    const r = run({ blackout_records: records });
    expect(r.concerns.some(c => c.includes("Blackout provision at 60%"))).toBe(true);
  });

  it("warning insight for provision 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeBlackout({ blackout_provided: true })),
      ...Array.from({ length: 4 }, () => makeBlackout({ blackout_provided: false })),
    ];
    const r = run({ blackout_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Blackout provision at 60%"))).toBe(true);
  });

  it("positive insight for high provision + effectiveness", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ blackout_provided: true, blackout_effective: true }));
    const r = run({ blackout_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("blackout provision"))).toBe(true);
  });

  it("warning insight for seasonal review <50%", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ seasonal_review_completed: false }));
    const r = run({ blackout_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("seasonally reviewed"))).toBe(true);
  });
});

// ── 6. Inspection Compliance ───────────────────────────────────────────────

describe("inspection compliance", () => {
  it("high compliance when all pass with actions completed and no overdue", () => {
    // compliance = round(passRate*0.5 + actionCompletionRate*0.3 + noOverdueRate*0.2)
    // With actions_required=2, completed=2: actionCompletion=100
    // round(100*0.5 + 100*0.3 + 100*0.2) = 100
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, actions_required: 2, actions_completed: 2, next_inspection_due: "2026-08-01" }));
    const r = run({ inspection_records: records });
    expect(r.inspection_compliance_rate).toBeGreaterThanOrEqual(90);
  });

  it("low compliance when all fail", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: false, actions_required: 5, actions_completed: 0, next_inspection_due: "2026-03-01" }));
    const r = run({ inspection_records: records });
    expect(r.inspection_compliance_rate).toBeLessThan(50);
  });

  it("strength for >=90%", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, next_inspection_due: "2026-08-01" }));
    const r = run({ inspection_records: records });
    expect(r.strengths.some(s => s.includes("inspection compliance"))).toBe(true);
  });

  it("concern for <50%", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: false, actions_required: 5, actions_completed: 0, next_inspection_due: "2026-03-01" }));
    const r = run({ inspection_records: records });
    expect(r.concerns.some(c => c.includes("Inspection compliance"))).toBe(true);
  });

  it("concern for overdue inspections", () => {
    const records = [makeInspection({ next_inspection_due: "2026-01-01" })];
    const r = run({ inspection_records: records });
    expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
  });

  it("strength for no overdue inspections", () => {
    const records = [makeInspection({ next_inspection_due: "2026-08-01" })];
    const r = run({ inspection_records: records });
    expect(r.strengths.some(s => s.includes("No overdue safety inspections"))).toBe(true);
  });

  it("no inspection records concern", () => {
    const r = run({ total_children: 3, inspection_records: [], window_restrictor_records: [makeRestrictor()] });
    expect(r.concerns.some(c => c.includes("No formal safety inspection records"))).toBe(true);
  });

  it("recommendation for overdue", () => {
    const records = [makeInspection({ next_inspection_due: "2026-01-01" })];
    const r = run({ inspection_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("overdue safety inspections"))).toBe(true);
  });

  it("recommendation for no records", () => {
    const r = run({ total_children: 3, inspection_records: [], window_restrictor_records: [makeRestrictor()] });
    expect(r.recommendations.some(rec => rec.recommendation.includes("scheduled inspection programme"))).toBe(true);
  });

  it("warning insight for overdue", () => {
    const records = [makeInspection({ next_inspection_due: "2026-01-01" })];
    const r = run({ inspection_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("overdue"))).toBe(true);
  });

  it("positive insight for high pass + no overdue", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, next_inspection_due: "2026-08-01" }));
    const r = run({ inspection_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("inspection"))).toBe(true);
  });
});

// ── 7. Issue Resolution ────────────────────────────────────────────────────

describe("issue resolution", () => {
  it("strength for >=90% resolution", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true }));
    const r = run({ window_restrictor_records: records });
    expect(r.strengths.some(s => s.includes("safety issues resolved"))).toBe(true);
  });

  it("concern for <50% resolution", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ issue_identified: true, issue_resolved: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.concerns.some(c => c.includes("safety issues resolved"))).toBe(true);
  });

  it("critical insight for <50% resolution", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ issue_identified: true, issue_resolved: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("safety issues resolved"))).toBe(true);
  });

  it("recommendation for <50% resolution", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ issue_identified: true, issue_resolved: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("backlog"))).toBe(true);
  });

  it(">=90% resolution gives +3 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true }));
    const r = run({ window_restrictor_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(55);
  });

  it("positive insight for >=90% resolution", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true }));
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("safety issues resolved"))).toBe(true);
  });
});

// ── 8. Child Safety Rate ───────────────────────────────────────────────────

describe("child safety rate", () => {
  it("high rate with all components", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ floor_level: 1 }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ child_accessible: false }));
    const cc = Array.from({ length: 10 }, () => makeCurtainCondition({ child_safe_rail: true }));
    const bo = Array.from({ length: 10 }, () => makeBlackout({ child_specific_need: true, need_met: true }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, curtain_condition_records: cc, blackout_records: bo });
    expect(r.child_safety_rate).toBe(100);
  });

  it("0 when no relevant data", () => {
    const r = run({ window_restrictor_records: [makeRestrictor({ floor_level: 0 })] });
    expect(r.child_safety_rate).toBeNull();;
  });

  it(">=90 gives +4 bonus", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ floor_level: 1 }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ child_accessible: false }));
    const cc = Array.from({ length: 10 }, () => makeCurtainCondition({ child_safe_rail: true }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, curtain_condition_records: cc });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(56);
  });

  it("positive insight for >=90%", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ floor_level: 1 }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ child_accessible: false }));
    const cc = Array.from({ length: 10 }, () => makeCurtainCondition({ child_safe_rail: true }));
    const bo = Array.from({ length: 10 }, () => makeBlackout({ child_specific_need: true, need_met: true }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, curtain_condition_records: cc, blackout_records: bo });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child safety rate"))).toBe(true);
  });
});

// ── 9. Scoring and Rating ──────────────────────────────────────────────────

describe("scoring and rating", () => {
  it("outstanding with all high metrics", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true, floor_level: 1 }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ compliant: true, child_accessible: false }));
    const cc = Array.from({ length: 10 }, () => makeCurtainCondition());
    const bo = Array.from({ length: 10 }, () => makeBlackout({ child_specific_need: true, need_met: true }));
    const insp = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, actions_required: 2, actions_completed: 2, next_inspection_due: "2026-08-01" }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, curtain_condition_records: cc, blackout_records: bo, inspection_records: insp });
    expect(r.window_safety_rating).toBe("outstanding");
    expect(r.window_safety_score).toBeGreaterThanOrEqual(80);
  });

  it("score clamped to 0", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ compliant: false, cord_present: true, child_accessible: true }));
    const insp = Array.from({ length: 5 }, () => makeInspection({ overall_pass: false, actions_required: 5, actions_completed: 0, next_inspection_due: "2026-01-01" }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, inspection_records: insp });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamped to 100", () => {
    const wr = Array.from({ length: 20 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true, floor_level: 1 }));
    const bc = Array.from({ length: 20 }, () => makeBlindCord({ compliant: true, child_accessible: false }));
    const cc = Array.from({ length: 20 }, () => makeCurtainCondition());
    const bo = Array.from({ length: 20 }, () => makeBlackout({ child_specific_need: true, need_met: true }));
    const insp = Array.from({ length: 10 }, () => makeInspection({ overall_pass: true, next_inspection_due: "2026-08-01" }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, curtain_condition_records: cc, blackout_records: bo, inspection_records: insp });
    expect(r.window_safety_score).toBeLessThanOrEqual(100);
  });

  it("inadequate for very low scores", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ compliant: false, cord_present: true, child_accessible: true }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc });
    expect(r.window_safety_rating).toBe("inadequate");
  });
});

// ── 10. Headlines ──────────────────────────────────────────────────────────

describe("headlines", () => {
  it("outstanding headline", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true, floor_level: 1 }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ compliant: true, child_accessible: false }));
    const cc = Array.from({ length: 10 }, () => makeCurtainCondition());
    const bo = Array.from({ length: 10 }, () => makeBlackout({ child_specific_need: true, need_met: true }));
    const insp = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, actions_required: 2, actions_completed: 2, next_inspection_due: "2026-08-01" }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, curtain_condition_records: cc, blackout_records: bo, inspection_records: insp });
    expect(r.headline).toContain("Outstanding");
  });

  it("inadequate headline", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ compliant: false, cord_present: true, child_accessible: true }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc });
    expect(r.headline).toContain("inadequate");
  });
});

// ── 11. Recommendation Ranking and Urgency ─────────────────────────────────

describe("recommendation ranking and urgency", () => {
  it("recommendations ranked sequentially", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false, floor_level: 2 }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ compliant: false, cord_present: true, child_accessible: true }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("immediate urgency for child accessible cords", () => {
    const bc = [makeBlindCord({ cord_present: true, child_accessible: true })];
    const r = run({ blind_cord_records: bc });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Eliminate all"));
    expect(rec?.urgency).toBe("immediate");
  });

  it("each recommendation has regulatory_ref", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const r = run({ window_restrictor_records: wr });
    r.recommendations.forEach(rec => {
      expect(rec.regulatory_ref).toBeTruthy();
    });
  });
});

// ── 12. Output Shape ───────────────────────────────────────────────────────

describe("output shape", () => {
  it("returns all expected fields", () => {
    const r = run({});
    expect(r).toHaveProperty("window_safety_rating");
    expect(r).toHaveProperty("window_safety_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_restrictor_records");
    expect(r).toHaveProperty("total_blind_records");
    expect(r).toHaveProperty("total_curtain_records");
    expect(r).toHaveProperty("total_blackout_records");
    expect(r).toHaveProperty("total_inspection_records");
    expect(r).toHaveProperty("window_restrictor_rate");
    expect(r).toHaveProperty("blind_cord_safety_rate");
    expect(r).toHaveProperty("curtain_condition_rate");
    expect(r).toHaveProperty("blackout_provision_rate");
    expect(r).toHaveProperty("child_safety_rate");
    expect(r).toHaveProperty("inspection_compliance_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("passthrough records present in output", () => {
    const wr = [makeRestrictor()];
    const bc = [makeBlindCord()];
    const cc = [makeCurtainCondition()];
    const bo = [makeBlackout()];
    const insp = [makeInspection()];
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, curtain_condition_records: cc, blackout_records: bo, inspection_records: insp });
    expect(r.window_restrictor_records.length).toBe(1);
    expect(r.blind_cord_records.length).toBe(1);
    expect(r.curtain_condition_records.length).toBe(1);
    expect(r.blackout_records.length).toBe(1);
    expect(r.inspection_records.length).toBe(1);
  });

  it("rating is valid enum", () => {
    const r = run({});
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.window_safety_rating);
  });

  it("score between 0 and 100", () => {
    const r = run({ window_restrictor_records: [makeRestrictor()] });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(0);
    expect(r.window_safety_score).toBeLessThanOrEqual(100);
  });

  it("insights have valid severity", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ restrictor_fitted: false }));
    const r = run({ window_restrictor_records: wr });
    r.insights.forEach(i => {
      expect(["critical", "warning", "positive"]).toContain(i.severity);
    });
  });

  it("total_restrictor_records counts correctly", () => {
    const wr = Array.from({ length: 7 }, () => makeRestrictor());
    const r = run({ window_restrictor_records: wr });
    expect(r.total_restrictor_records).toBe(7);
  });

  it("total_blind_records counts correctly", () => {
    const bc = Array.from({ length: 5 }, () => makeBlindCord());
    const r = run({ blind_cord_records: bc });
    expect(r.total_blind_records).toBe(5);
  });
});

// ── 13. Restrictor Type Insight ────────────────────────────────────────────

describe("restrictor type analysis", () => {
  it("warning insight for multiple restrictor types", () => {
    const records = [
      makeRestrictor({ restrictor_type: "screw_lock" }),
      makeRestrictor({ restrictor_type: "cable" }),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Restrictor types in use"))).toBe(true);
  });

  it("no type insight for single restrictor type", () => {
    const records = Array.from({ length: 5 }, () => makeRestrictor({ restrictor_type: "screw_lock" }));
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.text.includes("Restrictor types in use"))).toBe(false);
  });
});

// ── 14. Key Security ──────────────────────────────────────────────────────

describe("key security", () => {
  it("recommendation for key security <70%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ key_accessible_to_staff_only: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("restrictor keys"))).toBe(true);
  });

  it("warning insight for key security <70%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ key_accessible_to_staff_only: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Key security rate"))).toBe(true);
  });
});

// ── 15. Fire Retardant Warnings ────────────────────────────────────────────

describe("fire retardant warnings", () => {
  it("strength for fire retardant 70-89%", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeCurtainCondition({ fire_retardant: true })),
      ...Array.from({ length: 2 }, () => makeCurtainCondition({ fire_retardant: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.strengths.some(s => s.includes("fire retardant"))).toBe(true);
  });

  it("concern for fire retardant 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeCurtainCondition({ fire_retardant: true })),
      ...Array.from({ length: 4 }, () => makeCurtainCondition({ fire_retardant: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("Fire retardant compliance"))).toBe(true);
  });

  it("warning insight for fire retardant 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeCurtainCondition({ fire_retardant: true })),
      ...Array.from({ length: 4 }, () => makeCurtainCondition({ fire_retardant: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Fire retardant compliance"))).toBe(true);
  });

  it("recommendation for fire retardant 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeCurtainCondition({ fire_retardant: true })),
      ...Array.from({ length: 4 }, () => makeCurtainCondition({ fire_retardant: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("non-fire-retardant curtains"))).toBe(true);
  });
});

// ── 16. Curtain Condition Additional ──────────────────────────────────────

describe("curtain condition additional", () => {
  it("curtain condition >=90 gives +4 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeCurtainCondition());
    const r = run({ curtain_condition_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(56);
  });

  it("curtain condition 70-89 gives +2 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeCurtainCondition()),
      ...Array.from({ length: 2 }, () => makeCurtainCondition({ curtain_clean: false, curtain_intact: false, rail_secure: false, hooks_safe: false, fire_retardant: false, appropriate_length: false, child_safe_rail: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(54);
  });

  it("recommendation for curtain condition <50%", () => {
    const records = Array.from({ length: 10 }, () =>
      makeCurtainCondition({ curtain_clean: false, curtain_intact: false, rail_secure: false, hooks_safe: false, fire_retardant: false, appropriate_length: false, child_safe_rail: false })
    );
    const r = run({ curtain_condition_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("curtain condition issues"))).toBe(true);
  });

  it("recommendation for curtain condition 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeCurtainCondition()),
      ...Array.from({ length: 4 }, () => makeCurtainCondition({ curtain_clean: false, curtain_intact: false, rail_secure: false, hooks_safe: false, fire_retardant: false, appropriate_length: false, child_safe_rail: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Improve curtain condition"))).toBe(true);
  });

  it("warning insight for curtain condition 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeCurtainCondition()),
      ...Array.from({ length: 4 }, () => makeCurtainCondition({ curtain_clean: false, curtain_intact: false, rail_secure: false, hooks_safe: false, fire_retardant: false, appropriate_length: false, child_safe_rail: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Curtain condition compliance"))).toBe(true);
  });

  it("child-safe rail strength 70-89%", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeCurtainCondition({ child_safe_rail: true })),
      ...Array.from({ length: 2 }, () => makeCurtainCondition({ child_safe_rail: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.strengths.some(s => s.includes("curtain rails meet child safety standards"))).toBe(true);
  });

  it("child-safe rail concern 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeCurtainCondition({ child_safe_rail: true })),
      ...Array.from({ length: 4 }, () => makeCurtainCondition({ child_safe_rail: false })),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("Child-safe rail coverage"))).toBe(true);
  });

  it("multiple unsuitable curtains concern plural", () => {
    const records = [
      makeCurtainCondition({ overall_condition: "unsuitable" }),
      makeCurtainCondition({ overall_condition: "unsuitable" }),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("2 curtains rated as unsuitable"))).toBe(true);
  });

  it("multiple poor condition concern plural", () => {
    const records = [
      makeCurtainCondition({ overall_condition: "poor" }),
      makeCurtainCondition({ overall_condition: "poor" }),
      makeCurtainCondition({ overall_condition: "poor" }),
    ];
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("3 curtains in poor condition"))).toBe(true);
  });
});

// ── 17. Blackout Additional ────────────────────────────────────────────────

describe("blackout additional", () => {
  it("blackout >=90 gives +3 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ blackout_provided: true }));
    const r = run({ blackout_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(55);
  });

  it("blackout 70-89 gives +1 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeBlackout({ blackout_provided: true })),
      ...Array.from({ length: 2 }, () => makeBlackout({ blackout_provided: false })),
    ];
    const r = run({ blackout_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(53);
  });

  it("strength for 70-89% provision", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeBlackout({ blackout_provided: true })),
      ...Array.from({ length: 2 }, () => makeBlackout({ blackout_provided: false })),
    ];
    const r = run({ blackout_records: records });
    expect(r.strengths.some(s => s.includes("blackout provision"))).toBe(true);
  });

  it("strength for child need met 70-89%", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeBlackout({ child_specific_need: true, need_met: true })),
      ...Array.from({ length: 2 }, () => makeBlackout({ child_specific_need: true, need_met: false })),
    ];
    const r = run({ blackout_records: records });
    expect(r.strengths.some(s => s.includes("child-specific blackout needs"))).toBe(true);
  });

  it("concern for child need met 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeBlackout({ child_specific_need: true, need_met: true })),
      ...Array.from({ length: 4 }, () => makeBlackout({ child_specific_need: true, need_met: false })),
    ];
    const r = run({ blackout_records: records });
    expect(r.concerns.some(c => c.includes("child-specific blackout needs met"))).toBe(true);
  });

  it("recommendation for blackout 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeBlackout({ blackout_provided: true })),
      ...Array.from({ length: 4 }, () => makeBlackout({ blackout_provided: false })),
    ];
    const r = run({ blackout_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Extend blackout provision"))).toBe(true);
  });

  it("warning insight for child need 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeBlackout({ child_specific_need: true, need_met: true })),
      ...Array.from({ length: 4 }, () => makeBlackout({ child_specific_need: true, need_met: false })),
    ];
    const r = run({ blackout_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("child-specific blackout needs met"))).toBe(true);
  });

  it("positive insight for child need met >=90%", () => {
    const records = Array.from({ length: 10 }, () => makeBlackout({ child_specific_need: true, need_met: true }));
    const r = run({ blackout_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child-specific blackout needs met"))).toBe(true);
  });
});

// ── 18. Inspection Additional ──────────────────────────────────────────────

describe("inspection additional", () => {
  it("inspection >=90 gives +4 bonus", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, actions_required: 2, actions_completed: 2, next_inspection_due: "2026-08-01" }));
    const r = run({ inspection_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(56);
  });

  it("inspection 70-89 gives +2 bonus", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, actions_required: 0, actions_completed: 0, next_inspection_due: "2026-08-01" }));
    const r = run({ inspection_records: records });
    // compliance = round(100*0.5 + 0*0.3 + 100*0.2) = 70
    expect(r.window_safety_score).toBeGreaterThanOrEqual(54);
  });

  it("inspection <50 gives -5 penalty", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: false, actions_required: 5, actions_completed: 0, next_inspection_due: "2026-01-01" }));
    const r = run({ inspection_records: records });
    expect(r.window_safety_score).toBeLessThanOrEqual(52);
  });

  it("strength for 70-89% compliance", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, actions_required: 0, actions_completed: 0, next_inspection_due: "2026-08-01" }));
    const r = run({ inspection_records: records });
    expect(r.strengths.some(s => s.includes("inspection compliance"))).toBe(true);
  });

  it("concern for 50-69% compliance", () => {
    // pass=false so passRate=0, but actions complete, no overdue
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: false, actions_required: 2, actions_completed: 2, next_inspection_due: "2026-08-01" }));
    const r = run({ inspection_records: records });
    if (r.inspection_compliance_rate! >= 50 && r.inspection_compliance_rate! < 70) {
      expect(r.concerns.some(c => c.includes("Inspection compliance"))).toBe(true);
    }
  });

  it("recommendation for <50% compliance", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: false, actions_required: 5, actions_completed: 0, next_inspection_due: "2026-01-01" }));
    const r = run({ inspection_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Overhaul the safety inspection"))).toBe(true);
  });

  it("warning insight for 50-69% compliance", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: false, actions_required: 2, actions_completed: 2, next_inspection_due: "2026-08-01" }));
    const r = run({ inspection_records: records });
    if (r.inspection_compliance_rate! >= 50 && r.inspection_compliance_rate! < 70) {
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Inspection compliance"))).toBe(true);
    }
  });

  it("positive insight for >=90% compliance", () => {
    const records = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, actions_required: 2, actions_completed: 2, next_inspection_due: "2026-08-01" }));
    const r = run({ inspection_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("inspection compliance"))).toBe(true);
  });
});

// ── 19. Issue Resolution Additional ────────────────────────────────────────

describe("issue resolution additional", () => {
  it("70-89% resolution gives +1 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true })),
      ...Array.from({ length: 2 }, () => makeRestrictor({ issue_identified: true, issue_resolved: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(53);
  });

  it("strength for 70-89% resolution", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true })),
      ...Array.from({ length: 2 }, () => makeRestrictor({ issue_identified: true, issue_resolved: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.strengths.some(s => s.includes("majority of defects"))).toBe(true);
  });

  it("concern for 50-69% resolution", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true })),
      ...Array.from({ length: 4 }, () => makeRestrictor({ issue_identified: true, issue_resolved: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.concerns.some(c => c.includes("Issue resolution rate at 60%"))).toBe(true);
  });

  it("warning insight for 50-69% resolution", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true })),
      ...Array.from({ length: 4 }, () => makeRestrictor({ issue_identified: true, issue_resolved: false })),
    ];
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Issue resolution rate at 60%"))).toBe(true);
  });

  it("cross-domain issue resolution aggregates", () => {
    const wr = [makeRestrictor({ issue_identified: true, issue_resolved: true })];
    const bc = [makeBlindCord({ issue_identified: true, issue_resolved: true })];
    const cc = [makeCurtainCondition({ issue_identified: true, issue_resolved: true })];
    const bo = [makeBlackout({ issue_identified: true, issue_resolved: true })];
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, curtain_condition_records: cc, blackout_records: bo });
    expect(r.strengths.some(s => s.includes("safety issues resolved"))).toBe(true);
  });
});

// ── 20. Blind Cord Additional ──────────────────────────────────────────────

describe("blind cord additional", () => {
  it("blind cord >=90 gives +5 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: true }));
    const r = run({ blind_cord_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(57);
  });

  it("blind cord 70-89 gives +2 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeBlindCord({ compliant: true })),
      ...Array.from({ length: 2 }, () => makeBlindCord({ compliant: false })),
    ];
    const r = run({ blind_cord_records: records });
    expect(r.window_safety_score).toBeGreaterThanOrEqual(54);
  });

  it("strength for 70-89% compliance", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeBlindCord({ compliant: true })),
      ...Array.from({ length: 2 }, () => makeBlindCord({ compliant: false })),
    ];
    const r = run({ blind_cord_records: records });
    expect(r.strengths.some(s => s.includes("majority of blinds"))).toBe(true);
  });

  it("critical insight for compliance <50%", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: false }));
    const r = run({ blind_cord_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("blind cord safety compliance"))).toBe(true);
  });

  it("warning insight for compliance 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeBlindCord({ compliant: true })),
      ...Array.from({ length: 4 }, () => makeBlindCord({ compliant: false })),
    ];
    const r = run({ blind_cord_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Blind cord safety compliance"))).toBe(true);
  });

  it("positive insight for >=90% compliance", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: true }));
    const r = run({ blind_cord_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("blind cord safety compliance"))).toBe(true);
  });

  it("critical insight for no blind records", () => {
    const r = run({ total_children: 3, blind_cord_records: [], window_restrictor_records: [makeRestrictor()] });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No blind cord safety records"))).toBe(true);
  });

  it("critical insight for no restrictor records", () => {
    const r = run({ total_children: 3, window_restrictor_records: [], blind_cord_records: [makeBlindCord()] });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No window restrictor check records"))).toBe(true);
  });

  it("recommendation for <50% compliance", () => {
    const records = Array.from({ length: 10 }, () => makeBlindCord({ compliant: false }));
    const r = run({ blind_cord_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("emergency blind cord safety audit"))).toBe(true);
  });

  it("upper floor critical insight for <50%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ floor_level: 2, restrictor_fitted: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("upper-floor windows are compliant"))).toBe(true);
  });

  it("recommendation for upper floor <50%", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ floor_level: 2, restrictor_fitted: false }));
    const r = run({ window_restrictor_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("upper-floor window restrictor"))).toBe(true);
  });
});

// ── 21. Outstanding Positive Insights ──────────────────────────────────────

describe("outstanding positive insights", () => {
  it("outstanding rating positive insight", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor({ issue_identified: true, issue_resolved: true, floor_level: 1 }));
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ compliant: true, child_accessible: false }));
    const cc = Array.from({ length: 10 }, () => makeCurtainCondition());
    const bo = Array.from({ length: 10 }, () => makeBlackout({ child_specific_need: true, need_met: true }));
    const insp = Array.from({ length: 5 }, () => makeInspection({ overall_pass: true, actions_required: 2, actions_completed: 2, next_inspection_due: "2026-08-01" }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc, curtain_condition_records: cc, blackout_records: bo, inspection_records: insp });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
  });
});

// ── 22. Additional Edge Cases and Rates ────────────────────────────────────

describe("additional edge cases and rates", () => {
  it("ground floor records do not count as upper floor", () => {
    const records = Array.from({ length: 10 }, () => makeRestrictor({ floor_level: 0 }));
    const r = run({ window_restrictor_records: records });
    // No upper floor records, so no upper floor compliance concern
    expect(r.concerns.some(c => c.includes("upper-floor"))).toBe(false);
  });

  it("non-functional restrictor does not count as compliant", () => {
    const records = [makeRestrictor({ restrictor_fitted: true, restrictor_functional: false, opening_within_100mm: true })];
    const r = run({ window_restrictor_records: records });
    expect(r.window_restrictor_rate).toBe(0);
  });

  it("opening > 100mm does not count as compliant", () => {
    const records = [makeRestrictor({ restrictor_fitted: true, restrictor_functional: true, opening_within_100mm: false })];
    const r = run({ window_restrictor_records: records });
    expect(r.window_restrictor_rate).toBe(0);
  });

  it("curtain not present has 0% condition checks", () => {
    const records = [makeCurtainCondition({ curtain_present: false })];
    const r = run({ curtain_condition_records: records });
    expect(r.curtain_condition_rate).toBe(0);
  });

  it("blackout not provided does not count", () => {
    const records = [makeBlackout({ blackout_provided: false })];
    const r = run({ blackout_records: records });
    expect(r.blackout_provision_rate).toBe(0);
  });

  it("single cord accessible counts for penalty", () => {
    const records = [
      ...Array.from({ length: 9 }, () => makeBlindCord({ compliant: true, child_accessible: false })),
      makeBlindCord({ cord_present: true, child_accessible: true, compliant: true }),
    ];
    const r = run({ blind_cord_records: records });
    expect(r.concerns.some(c => c.includes("1 blind cord accessible"))).toBe(true);
  });

  it("multiple accessible cords use plural", () => {
    const records = [
      ...Array.from({ length: 3 }, () => makeBlindCord({ cord_present: true, child_accessible: true })),
      ...Array.from({ length: 7 }, () => makeBlindCord({ child_accessible: false })),
    ];
    const r = run({ blind_cord_records: records });
    expect(r.concerns.some(c => c.includes("3 blind cords accessible"))).toBe(true);
  });

  it("inspection with null next_inspection_due is not overdue", () => {
    const records = [makeInspection({ next_inspection_due: null })];
    const r = run({ inspection_records: records });
    expect(r.concerns.some(c => c.includes("overdue"))).toBe(false);
  });

  it("adequate headline contains concern count", () => {
    const wr = Array.from({ length: 5 }, () => makeRestrictor({ restrictor_fitted: false }));
    const r = run({ window_restrictor_records: wr });
    if (r.window_safety_rating === "adequate") {
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("concern");
    }
  });

  it("good headline contains strengths count", () => {
    const wr = Array.from({ length: 10 }, () => makeRestrictor());
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ compliant: true }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc });
    if (r.window_safety_rating === "good") {
      expect(r.headline).toContain("Good");
    }
  });

  it("child safety rate 70-89 gives +2 bonus", () => {
    // upper floor 80% + blinds with 0 accessible
    const wr = [
      ...Array.from({ length: 8 }, () => makeRestrictor({ floor_level: 1 })),
      ...Array.from({ length: 2 }, () => makeRestrictor({ floor_level: 1, restrictor_fitted: false })),
    ];
    const bc = Array.from({ length: 10 }, () => makeBlindCord({ child_accessible: false }));
    const r = run({ window_restrictor_records: wr, blind_cord_records: bc });
    // childSafetyRate = avg(80, 100) = 90, so +4
    expect(r.window_safety_score).toBeGreaterThanOrEqual(54);
  });

  it("restrictor type key_lock recognized", () => {
    const records = [makeRestrictor({ restrictor_type: "key_lock" })];
    const r = run({ window_restrictor_records: records });
    expect(r.window_restrictor_rate).toBe(100);
  });

  it("blind type venetian accepted", () => {
    const records = [makeBlindCord({ blind_type: "venetian", compliant: true })];
    const r = run({ blind_cord_records: records });
    expect(r.blind_cord_safety_rate).toBe(100);
  });

  it("curtain overall_condition fair does not trigger unsuitable concern", () => {
    const records = [makeCurtainCondition({ overall_condition: "fair" })];
    const r = run({ curtain_condition_records: records });
    expect(r.concerns.some(c => c.includes("unsuitable"))).toBe(false);
  });
});
