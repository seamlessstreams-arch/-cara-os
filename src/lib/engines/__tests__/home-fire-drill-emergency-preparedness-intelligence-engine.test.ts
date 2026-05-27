// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FIRE DRILL & EMERGENCY PREPAREDNESS ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeFireDrillPreparedness,
  type FireDrillPreparednessInput,
  type FireDrillRecordInput,
} from "../home-fire-drill-emergency-preparedness-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function makeDrill(overrides: Partial<FireDrillRecordInput> = {}): FireDrillRecordInput {
  return {
    id: "drill_test",
    drill_type: "fire_drill",
    result: "satisfactory",
    all_present: true,
    children_present_count: 6,
    staff_present_count: 3,
    evacuation_time_seconds: 100,
    has_issues: false,
    has_actions: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<FireDrillPreparednessInput> = {}): FireDrillPreparednessInput {
  return {
    today: "2026-05-27",
    total_children: 6,
    drills: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1 — INSUFFICIENT DATA GUARD
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data guard", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const r = computeFireDrillPreparedness(baseInput({ total_children: 0 }));
    expect(r.drill_rating).toBe("insufficient_data");
    expect(r.drill_score).toBe(0);
    expect(r.headline).toBe("No data available for fire drill analysis");
    expect(r.total_drills).toBe(0);
    expect(r.satisfactory_rate).toBe(0);
    expect(r.all_present_rate).toBe(0);
    expect(r.average_evacuation_time).toBe(0);
    expect(r.drill_type_variety).toBe(0);
    expect(r.issues_addressed_rate).toBe(0);
    expect(r.failed_rate).toBe(0);
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns insufficient_data even when drills are provided but total_children is 0", () => {
    const r = computeFireDrillPreparedness(
      baseInput({ total_children: 0, drills: [makeDrill()] }),
    );
    expect(r.drill_rating).toBe("insufficient_data");
    expect(r.drill_score).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2 — ZERO DRILLS (total_children > 0)
// ══════════════════════════════════════════════════════════════════════════════

describe("Zero drills with active children", () => {
  it("applies all zero-drill penalties: 52 -5 -1 -1 -2 = 43", () => {
    // Mod1: total===0 → -5, Mod2: total===0 skip, Mod3: total===0 skip,
    // Mod4: total===0 → -1, Mod5: total===0 → -1, Mod6: total===0 → -2
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.drill_score).toBe(43);
    expect(r.drill_rating).toBe("inadequate");
    expect(r.total_drills).toBe(0);
  });

  it("sets all rates to 0 when no drills", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.satisfactory_rate).toBe(0);
    expect(r.all_present_rate).toBe(0);
    expect(r.average_evacuation_time).toBe(0);
    expect(r.drill_type_variety).toBe(0);
    expect(r.issues_addressed_rate).toBe(0);
    expect(r.failed_rate).toBe(0);
  });

  it("generates the inadequate headline", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.headline).toBe(
      "Emergency preparedness is inadequate — children and staff are not properly prepared",
    );
  });

  it("produces a concern about no drills recorded", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.concerns).toContain(
      "No fire drills or emergency exercises recorded — the home is not testing its emergency procedures",
    );
  });

  it("produces an immediate recommendation to implement drills", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.recommendations).toHaveLength(1);
    expect(r.recommendations[0]).toMatchObject({
      rank: 1,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  });

  it("produces a critical insight about no drill records", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0]).toMatchObject({ severity: "critical" });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3 — MODIFIER 1: DRILL FREQUENCY
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 1 — Drill frequency", () => {
  it(">=6 drills → +5", () => {
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({ id: `d${i}` }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // 52 +5(freq) +6(sat100) +5(allPres100) +5(evac100s) +2(noIssues) -3(variety1) = 72
    expect(r.drill_score).toBe(72);
  });

  it("3 drills → +2", () => {
    const drills = Array.from({ length: 3 }, (_, i) =>
      makeDrill({ id: `d${i}` }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // 52 +2(freq) +6(sat100) +5(allPres100) +5(evac100s) +2(noIssues) -3(variety1) = 69
    expect(r.drill_score).toBe(69);
  });

  it("1 drill → no frequency modifier", () => {
    const drills = [makeDrill()];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // 52 +0(freq) +6(sat100) +5(allPres100) +5(evac100s) +2(noIssues) -3(variety1) = 67
    expect(r.drill_score).toBe(67);
  });

  it("2 drills → no frequency modifier", () => {
    const drills = Array.from({ length: 2 }, (_, i) =>
      makeDrill({ id: `d${i}` }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // 52 +0(freq) +6(sat100) +5(allPres100) +5(evac100s) +2(noIssues) -3(variety1) = 67
    expect(r.drill_score).toBe(67);
  });

  it("5 drills → +2 (not +5)", () => {
    const drills = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ id: `d${i}` }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // 52 +2(freq) +6(sat100) +5(allPres100) +5(evac100s) +2(noIssues) -3(variety1) = 69
    expect(r.drill_score).toBe(69);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4 — MODIFIER 2: SATISFACTORY RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 2 — Satisfactory rate", () => {
  it("100% satisfactory → +6", () => {
    const drills = [makeDrill({ result: "satisfactory" })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(100);
    // 52 +0(freq) +6(sat) +5(allPres) +5(evac) +2(noIssues) -3(variety) = 67
    expect(r.drill_score).toBe(67);
  });

  it("70% satisfactory → +2", () => {
    // 7 out of 10 satisfactory → 70%
    const drills = [
      ...Array.from({ length: 7 }, (_, i) => makeDrill({ id: `s${i}`, result: "satisfactory" })),
      ...Array.from({ length: 3 }, (_, i) => makeDrill({ id: `f${i}`, result: "issues_identified" })),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(70);
    // 52 +5(freq>=6) +2(sat70) +5(allPres100) +5(evac100s) +2(noIssues) -3(variety1) = 68
    expect(r.drill_score).toBe(68);
  });

  it("<50% satisfactory → -5", () => {
    // 1 out of 3 satisfactory → 33%
    const drills = [
      makeDrill({ id: "s1", result: "satisfactory" }),
      makeDrill({ id: "f1", result: "failed" }),
      makeDrill({ id: "f2", result: "failed" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(33);
    // 52 +2(freq3) -5(sat33) +5(allPres100) +5(evac100s) +2(noIssues) -3(variety1) = 58
    expect(r.drill_score).toBe(58);
  });

  it("0% satisfactory → -5", () => {
    const drills = [
      makeDrill({ id: "f1", result: "failed" }),
      makeDrill({ id: "f2", result: "failed" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(0);
  });

  it("50% satisfactory (boundary) → no modifier", () => {
    // 1 out of 2 = 50%
    const drills = [
      makeDrill({ id: "s1", result: "satisfactory" }),
      makeDrill({ id: "f1", result: "failed" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(50);
    // 52 +0(freq) +0(sat50–not <50, not >=70) +5(allPres100) +5(evac100s) +2(noIssues) -3(variety1) = 61
    expect(r.drill_score).toBe(61);
  });

  it("89% satisfactory → +2 (just below 90)", () => {
    // 8 out of 9 → 89%
    const drills = [
      ...Array.from({ length: 8 }, (_, i) => makeDrill({ id: `s${i}`, result: "satisfactory" })),
      makeDrill({ id: "f1", result: "issues_identified" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(89);
    // 52 +5(freq>=6) +2(sat89) +5(allPres100) +5(evac100s) +2(noIssues) -3(variety1) = 68
    expect(r.drill_score).toBe(68);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5 — MODIFIER 3: ALL PRESENT RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 3 — All present rate", () => {
  it("100% all present → +5", () => {
    const drills = [makeDrill({ all_present: true })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.all_present_rate).toBe(100);
  });

  it("0% all present → -4", () => {
    const drills = [
      makeDrill({ id: "d1", all_present: false }),
      makeDrill({ id: "d2", all_present: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.all_present_rate).toBe(0);
    // 52 +0(freq) +6(sat100) -4(allPres0) +5(evac100s) +2(noIssues) -3(variety1) = 58
    expect(r.drill_score).toBe(58);
  });

  it("70% all present → +2", () => {
    // 7 out of 10
    const drills = [
      ...Array.from({ length: 7 }, (_, i) => makeDrill({ id: `p${i}`, all_present: true })),
      ...Array.from({ length: 3 }, (_, i) => makeDrill({ id: `a${i}`, all_present: false })),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.all_present_rate).toBe(70);
    // 52 +5(freq>=6) +6(sat100) +2(allPres70) +5(evac100s) +2(noIssues) -3(variety1) = 69
    expect(r.drill_score).toBe(69);
  });

  it("<50% all present → -4", () => {
    // 1 out of 3 = 33%
    const drills = [
      makeDrill({ id: "p1", all_present: true }),
      makeDrill({ id: "a1", all_present: false }),
      makeDrill({ id: "a2", all_present: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.all_present_rate).toBe(33);
    // 52 +2(freq3) +6(sat100) -4(allPres33) +5(evac100s) +2(noIssues) -3(variety1) = 60
    expect(r.drill_score).toBe(60);
  });

  it("50% boundary → no modifier", () => {
    // 1 out of 2 = 50%
    const drills = [
      makeDrill({ id: "p1", all_present: true }),
      makeDrill({ id: "a1", all_present: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.all_present_rate).toBe(50);
    // 52 +0(freq) +6(sat100) +0(allPres50) +5(evac100s) +2(noIssues) -3(variety1) = 62
    expect(r.drill_score).toBe(62);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6 — MODIFIER 4: EVACUATION TIME
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 4 — Evacuation time", () => {
  it("<=120s → +5", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 120 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(120);
    // 52 +0(freq) +6(sat) +5(allPres) +5(evac) +2(noIssues) -3(variety) = 67
    expect(r.drill_score).toBe(67);
  });

  it("150s → +2 (between 121-180)", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 150 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(150);
    // 52 +0 +6 +5 +2(evac150) +2 -3 = 64
    expect(r.drill_score).toBe(64);
  });

  it("180s → +2 (boundary)", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 180 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(180);
    // 52 +0 +6 +5 +2 +2 -3 = 64
    expect(r.drill_score).toBe(64);
  });

  it("250s → no modifier (between 181-300)", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 250 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(250);
    // 52 +0 +6 +5 +0(evac250) +2 -3 = 62
    expect(r.drill_score).toBe(62);
  });

  it(">300s → -4", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 350 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(350);
    // 52 +0 +6 +5 -4(evac350) +2 -3 = 58
    expect(r.drill_score).toBe(58);
  });

  it("300s exactly → no modifier (not >300)", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 300 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(300);
    // 52 +0 +6 +5 +0 +2 -3 = 62
    expect(r.drill_score).toBe(62);
  });

  it("null evacuation_time → avgEvacTime is 0 → -1", () => {
    const drills = [makeDrill({ evacuation_time_seconds: null })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(0);
    // 52 +0 +6 +5 -1(evacNull) +2 -3 = 61
    expect(r.drill_score).toBe(61);
  });

  it("evacuation_time_seconds of 0 → avgEvacTime 0 → -1", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 0 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(0);
    // 52 +0 +6 +5 -1 +2 -3 = 61
    expect(r.drill_score).toBe(61);
  });

  it("averages evacuation times across drills with valid times", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 100 }),
      makeDrill({ id: "d2", evacuation_time_seconds: 140 }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(120);
  });

  it("ignores null evacuation times when averaging", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 100 }),
      makeDrill({ id: "d2", evacuation_time_seconds: null }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(100);
  });

  it("ignores 0 evacuation times when averaging", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 200 }),
      makeDrill({ id: "d2", evacuation_time_seconds: 0 }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7 — MODIFIER 5: ISSUES ADDRESSED RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 5 — Issues addressed rate", () => {
  it("no issues + drills present → +2", () => {
    const drills = [makeDrill({ has_issues: false })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.issues_addressed_rate).toBe(0);
    // noIssues branch → +2
    // 52 +0 +6 +5 +5 +2(noIssues) -3 = 67
    expect(r.drill_score).toBe(67);
  });

  it("100% issues addressed → +4", () => {
    const drills = [
      makeDrill({ has_issues: true, has_actions: true }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.issues_addressed_rate).toBe(100);
    // 52 +0 +6 +5 +5 +4(issues100) -3 = 69
    expect(r.drill_score).toBe(69);
  });

  it("90% issues addressed → +4", () => {
    // 9 out of 10 with issues → 9 have actions → 90%
    const drills = [
      ...Array.from({ length: 9 }, (_, i) =>
        makeDrill({ id: `a${i}`, has_issues: true, has_actions: true }),
      ),
      makeDrill({ id: "na1", has_issues: true, has_actions: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.issues_addressed_rate).toBe(90);
    // 52 +5(freq>=6) +6(sat100) +5(allPres100) +5(evac100s) +4(issues90) -3(variety1) = 74
    expect(r.drill_score).toBe(74);
  });

  it("60% issues addressed → +1", () => {
    // 3 out of 5 with issues → 3 have actions → 60%
    const drills = [
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ id: `a${i}`, has_issues: true, has_actions: true }),
      ),
      ...Array.from({ length: 2 }, (_, i) =>
        makeDrill({ id: `na${i}`, has_issues: true, has_actions: false }),
      ),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.issues_addressed_rate).toBe(60);
    // 52 +2(freq5) +6(sat100) +5(allPres100) +5(evac100s) +1(issues60) -3(variety1) = 68
    expect(r.drill_score).toBe(68);
  });

  it("<40% issues addressed → -4", () => {
    // 1 out of 3 with issues → 33%
    const drills = [
      makeDrill({ id: "a1", has_issues: true, has_actions: true }),
      makeDrill({ id: "na1", has_issues: true, has_actions: false }),
      makeDrill({ id: "na2", has_issues: true, has_actions: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.issues_addressed_rate).toBe(33);
    // 52 +2(freq3) +6(sat100) +5(allPres100) +5(evac100s) -4(issues33) -3(variety1) = 63
    expect(r.drill_score).toBe(63);
  });

  it("0% issues addressed → -4", () => {
    const drills = [
      makeDrill({ id: "na1", has_issues: true, has_actions: false }),
      makeDrill({ id: "na2", has_issues: true, has_actions: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.issues_addressed_rate).toBe(0);
    // 52 +0(freq) +6(sat100) +5(allPres100) +5(evac100s) -4(issues0) -3(variety1) = 61
    expect(r.drill_score).toBe(61);
  });

  it("40% boundary → no modifier (not <40, not >=60)", () => {
    // 2 out of 5 = 40%
    const drills = [
      ...Array.from({ length: 2 }, (_, i) =>
        makeDrill({ id: `a${i}`, has_issues: true, has_actions: true }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ id: `na${i}`, has_issues: true, has_actions: false }),
      ),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.issues_addressed_rate).toBe(40);
    // 52 +2(freq5) +6(sat100) +5(allPres100) +5(evac100s) +0(issues40) -3(variety1) = 67
    expect(r.drill_score).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8 — MODIFIER 6: DRILL TYPE VARIETY
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 6 — Drill type variety", () => {
  it("1 type → -3", () => {
    const drills = [makeDrill({ drill_type: "fire_drill" })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_type_variety).toBe(1);
    // includes -3
  });

  it("2 types → +2", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "evacuation" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_type_variety).toBe(2);
    // 52 +0(freq) +6(sat100) +5(allPres100) +5(evac100s) +2(noIssues) +2(variety2) = 72
    expect(r.drill_score).toBe(72);
  });

  it("3 types → +2", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "evacuation" }),
      makeDrill({ id: "d3", drill_type: "lockdown" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_type_variety).toBe(3);
    // 52 +2(freq3) +6(sat100) +5(allPres100) +5(evac100s) +2(noIssues) +2(variety3) = 74
    expect(r.drill_score).toBe(74);
  });

  it("4 types → +5", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "evacuation" }),
      makeDrill({ id: "d3", drill_type: "lockdown" }),
      makeDrill({ id: "d4", drill_type: "bomb_threat" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_type_variety).toBe(4);
    // 52 +2(freq4) +6(sat100) +5(allPres100) +5(evac100s) +2(noIssues) +5(variety4) = 77
    expect(r.drill_score).toBe(77);
  });

  it("5 types → +5", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "evacuation" }),
      makeDrill({ id: "d3", drill_type: "lockdown" }),
      makeDrill({ id: "d4", drill_type: "bomb_threat" }),
      makeDrill({ id: "d5", drill_type: "flood" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_type_variety).toBe(5);
    // 52 +2(freq5) +6(sat100) +5(allPres100) +5(evac100s) +2(noIssues) +5(variety5) = 77
    expect(r.drill_score).toBe(77);
  });

  it("duplicate types count as 1", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "fire_drill" }),
      makeDrill({ id: "d3", drill_type: "fire_drill" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_type_variety).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9 — SCORE CLAMPING
// ══════════════════════════════════════════════════════════════════════════════

describe("Score clamping", () => {
  it("score is clamped to 0 at minimum", () => {
    // Theoretically impossible to go below 0 with the engine, but verify clamp
    // Zero drills: 52 -5 -1 -1 -2 = 43. Already above 0.
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.drill_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to 100 at maximum", () => {
    // Best case: 52 +5 +6 +5 +5 +4 +5 = 82. Under 100, but verify clamp.
    const drills = [
      ...Array.from({ length: 6 }, (_, i) =>
        makeDrill({
          id: `d${i}`,
          drill_type: ["fire_drill", "evacuation", "lockdown", "bomb_threat"][i % 4],
          has_issues: true,
          has_actions: true,
        }),
      ),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_score).toBeLessThanOrEqual(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10 — RATING THRESHOLDS
// ══════════════════════════════════════════════════════════════════════════════

describe("Rating thresholds", () => {
  it("score 80 → outstanding", () => {
    // Need 80: 52 +5(freq6) +6(sat100) +5(allPres100) +5(evac<=120) +4(issues90+) +5(variety>=4) = 82
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        drill_type: ["fire_drill", "evacuation", "lockdown", "bomb_threat"][i % 4],
        has_issues: true,
        has_actions: true,
      }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_score).toBe(82);
    expect(r.drill_rating).toBe("outstanding");
  });

  it("score 72 → good", () => {
    // 6 drills same type: 52 +5 +6 +5 +5 +2(noIssues) -3(1type) = 72
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({ id: `d${i}` }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_score).toBe(72);
    expect(r.drill_rating).toBe("good");
  });

  it("score 67 → good", () => {
    // 1 drill satisfactory, all present, evac<=120, no issues, 1 type
    // 52 +0 +6 +5 +5 +2 -3 = 67
    const r = computeFireDrillPreparedness(baseInput({ drills: [makeDrill()] }));
    expect(r.drill_score).toBe(67);
    expect(r.drill_rating).toBe("good");
  });

  it("score 65 boundary → good", () => {
    // Need exactly 65: 52 +0(freq1) +6(sat100) +5(allPres100) +5(evac<=120) +0(issues40-59) -3(variety1)
    // 52 +0 +6 +5 +5 +0 -3 = 65
    // Need issues_addressed_rate between 40 and 59
    // 2 of 4 issues with actions = 50%
    const drills = [
      ...Array.from({ length: 2 }, (_, i) =>
        makeDrill({ id: `a${i}`, has_issues: true, has_actions: true }),
      ),
      ...Array.from({ length: 2 }, (_, i) =>
        makeDrill({ id: `na${i}`, has_issues: true, has_actions: false }),
      ),
    ];
    // But this is 4 drills, freq = +2 → 67. Let me recalculate.
    // Actually for 4 drills freq is +2. Let me use 1 drill.
    // 1 drill with 50% issue rate: need 1 drill with issues=true, actions=false → 0% → -4
    // That gives 52 +0 +6 +5 +5 -4 -3 = 61. Not 65.
    // Let me try: 2 drills, 1 issue addressed = 50%. Freq=0, sat=100, allPres=100, evac=+5, issues=0, variety=1 type
    // Actually 2 drills: freq=0. 1 issue out of 2 with issues = 50%: between 40-59 → 0
    // 52 +0 +6 +5 +5 +0 -3 = 65
    const drillsFor65 = [
      makeDrill({ id: "a1", has_issues: true, has_actions: true }),
      makeDrill({ id: "na1", has_issues: true, has_actions: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills: drillsFor65 }));
    expect(r.drill_score).toBe(65);
    expect(r.drill_rating).toBe("good");
  });

  it("score 64 → adequate", () => {
    // 52 +0(freq1) +6(sat100) +5(allPres100) +2(evac150s) +2(noIssues) -3(variety1) = 64
    const drills = [makeDrill({ evacuation_time_seconds: 150 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_score).toBe(64);
    expect(r.drill_rating).toBe("adequate");
  });

  it("score 45 → adequate", () => {
    // 52 +0(freq1) -5(sat<50) -4(allPres<50) +5(evac100s) +2(noIssues) -3(variety1) = 47
    // Need 45: 52 +0(freq1) -5(sat<50) -4(allPres<50) +5(evac100s) -4(issues<40) +2(variety2)
    // = 52 -5 -4 +5 -4 +2 = 46. Not 45.
    // Try: 52 +0 -5(sat) -4(allPres) +2(evac150) +2(noIssues) -3(variety1)
    // = 52 -5 -4 +2 +2 -3 = 44. Not 45.
    // Actually: 52 +0 -5(sat) -4(allPres) +5(evac100) +0(issues40-59) -3(variety1)
    // = 52 -5 -4 +5 +0 -3 = 45
    const drills = [
      makeDrill({ id: "f1", result: "failed", all_present: false, has_issues: true, has_actions: false }),
      makeDrill({ id: "f2", result: "failed", all_present: false, has_issues: true, has_actions: true }),
    ];
    // sat rate: 0/2 = 0% → -5. allPres: 0/2 = 0% → -4.
    // issues: 1 of 2 addressed = 50% → between 40-59 → 0.
    // freq: 0 for 2 drills. variety: 1 → -3. evac: 100s → +5
    // 52 +0 -5 -4 +5 +0 -3 = 45
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_score).toBe(45);
    expect(r.drill_rating).toBe("adequate");
  });

  it("score 44 → inadequate", () => {
    // 52 +0(freq1) -5(sat<50) -4(allPres<50) +2(evac150s) +0(issues40-59) -3(variety1)
    // = 52 -5 -4 +2 +0 -3 = 42
    // Try: 52 +0(freq2) -5(sat) -4(allPres) +5(evac100) -4(issues<40) -3(variety1)
    // = 52 -5 -4 +5 -4 -3 = 41. Not 44.
    // 52 +2(freq3) -5 -4 +5 -4 -3 = 43
    // Let me get 44: 52 +0(freq1) -5(sat<50) +0(allPres50-69) +2(evac150) +2(noIssues) -3(variety1)
    // wait allPres has to be >=50 and <70 for no modifier. That gives 0.
    // = 52 -5 +0 +2 +2 -3 = 48. No.
    // 52 +0 -5 -4 +2(evac150) +0(issues40-59) -3 = 42. Not 44.
    // 52 +0 -5 -4 +2(evac150) +2(noIssues) -3 = 44. Yes!
    const drills = [
      makeDrill({ id: "f1", result: "failed", all_present: false, evacuation_time_seconds: 150 }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // sat: 0% → -5, allPres: 0% → -4, evac: 150 → +2, noIssues → +2, variety 1 → -3
    // 52 +0 -5 -4 +2 +2 -3 = 44
    expect(r.drill_score).toBe(44);
    expect(r.drill_rating).toBe("inadequate");
  });

  it("score 43 (zero drills) → inadequate", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.drill_score).toBe(43);
    expect(r.drill_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11 — HEADLINES
// ══════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("outstanding headline", () => {
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        drill_type: ["fire_drill", "evacuation", "lockdown", "bomb_threat"][i % 4],
        has_issues: true,
        has_actions: true,
      }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.headline).toBe(
      "Emergency preparedness is exemplary — drills are frequent, effective and well-documented",
    );
  });

  it("good headline", () => {
    const r = computeFireDrillPreparedness(baseInput({ drills: [makeDrill()] }));
    expect(r.headline).toBe(
      "Good emergency preparedness with regular drills and effective issue resolution",
    );
  });

  it("adequate headline", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 150 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.headline).toBe(
      "Emergency drills occur but frequency, variety and documentation need improvement",
    );
  });

  it("inadequate headline", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.headline).toBe(
      "Emergency preparedness is inadequate — children and staff are not properly prepared",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12 — METRICS COMPUTATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Metrics computation", () => {
  it("total_drills reflects drills array length", () => {
    const drills = Array.from({ length: 4 }, (_, i) => makeDrill({ id: `d${i}` }));
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.total_drills).toBe(4);
  });

  it("failed_rate includes both failed and not_completed", () => {
    const drills = [
      makeDrill({ id: "f1", result: "failed" }),
      makeDrill({ id: "nc1", result: "not_completed" }),
      makeDrill({ id: "s1", result: "satisfactory" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.failed_rate).toBe(67); // 2/3 = 67%
  });

  it("satisfactory_rate only counts result=satisfactory", () => {
    const drills = [
      makeDrill({ id: "s1", result: "satisfactory" }),
      makeDrill({ id: "i1", result: "issues_identified" }),
      makeDrill({ id: "f1", result: "failed" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(33); // 1/3
  });

  it("average_evacuation_time rounds to nearest integer", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 100 }),
      makeDrill({ id: "d2", evacuation_time_seconds: 101 }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // (100 + 101) / 2 = 100.5 → rounds to 101 (Math.round)
    expect(r.average_evacuation_time).toBe(101);
  });

  it("issues_addressed_rate is 0 when no drills have issues", () => {
    const drills = [makeDrill({ has_issues: false })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.issues_addressed_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13 — STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("includes frequency strength when >=6 drills", () => {
    const drills = Array.from({ length: 6 }, (_, i) => makeDrill({ id: `d${i}` }));
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.strengths).toContain(
      "Regular drill frequency demonstrates ongoing commitment to emergency preparedness",
    );
  });

  it("does not include frequency strength when <6 drills", () => {
    const drills = Array.from({ length: 5 }, (_, i) => makeDrill({ id: `d${i}` }));
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.strengths).not.toContain(
      "Regular drill frequency demonstrates ongoing commitment to emergency preparedness",
    );
  });

  it("includes satisfactory strength when rate >=90%", () => {
    const drills = [makeDrill({ result: "satisfactory" })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.strengths).toContain(
      "Virtually all drills are satisfactory — the home is well-prepared for emergencies",
    );
  });

  it("includes all present strength when rate >=90%", () => {
    const drills = [makeDrill({ all_present: true })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.strengths).toContain(
      "Full participation in drills ensures everyone knows what to do in an emergency",
    );
  });

  it("includes fast evacuation strength when avg <=120s", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 100 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.strengths).toContain(
      "Evacuation times are under 2 minutes — swift and efficient emergency response",
    );
  });

  it("includes variety strength when >=4 types", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "evacuation" }),
      makeDrill({ id: "d3", drill_type: "lockdown" }),
      makeDrill({ id: "d4", drill_type: "bomb_threat" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.strengths).toContain(
      "Variety of drill types shows comprehensive emergency scenario planning",
    );
  });

  it("includes no issues strength when no issues in any drill", () => {
    const drills = [makeDrill({ has_issues: false })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.strengths).toContain(
      "No issues identified in any drill — excellent operational readiness",
    );
  });

  it("does not include no-issues strength when at least one drill has issues", () => {
    const drills = [
      makeDrill({ id: "d1", has_issues: false }),
      makeDrill({ id: "d2", has_issues: true, has_actions: true }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.strengths).not.toContain(
      "No issues identified in any drill — excellent operational readiness",
    );
  });

  it("all strengths present in exemplary scenario", () => {
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        drill_type: ["fire_drill", "evacuation", "lockdown", "bomb_threat"][i % 4],
        evacuation_time_seconds: 90,
        has_issues: false,
      }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.strengths).toHaveLength(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14 — CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("Concerns", () => {
  it("concern for no drills recorded", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.concerns).toContain(
      "No fire drills or emergency exercises recorded — the home is not testing its emergency procedures",
    );
  });

  it("concern for low satisfactory rate", () => {
    const drills = [
      makeDrill({ id: "f1", result: "failed" }),
      makeDrill({ id: "f2", result: "failed" }),
      makeDrill({ id: "s1", result: "satisfactory" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(33);
    expect(r.concerns).toContain(
      "Most drills are not satisfactory — emergency response capability is unreliable",
    );
  });

  it("concern for high failure rate (>=30%)", () => {
    // 2 out of 3 failed/not_completed = 67%
    const drills = [
      makeDrill({ id: "f1", result: "failed" }),
      makeDrill({ id: "nc1", result: "not_completed" }),
      makeDrill({ id: "s1", result: "satisfactory" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.concerns).toContain(
      "67% of drills failed or were not completed — serious safety concern",
    );
  });

  it("no failure concern when failedRate is 29%", () => {
    // 2 out of 7 = 29%
    const drills = [
      ...Array.from({ length: 5 }, (_, i) => makeDrill({ id: `s${i}`, result: "satisfactory" })),
      makeDrill({ id: "f1", result: "failed" }),
      makeDrill({ id: "f2", result: "not_completed" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.failed_rate).toBe(29);
    const failConcerns = r.concerns.filter(c => c.includes("failed or were not completed"));
    expect(failConcerns).toHaveLength(0);
  });

  it("concern for low participation", () => {
    const drills = [
      makeDrill({ id: "a1", all_present: false }),
      makeDrill({ id: "a2", all_present: false }),
      makeDrill({ id: "p1", all_present: true }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.all_present_rate).toBe(33);
    expect(r.concerns).toContain(
      "Participation in drills is poor — not everyone will know what to do in an emergency",
    );
  });

  it("concern for slow evacuation times", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 350 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.concerns).toContain(
      "Average evacuation time exceeds 5 minutes — dangerously slow emergency response",
    );
  });

  it("concern for only one drill type", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "fire_drill" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.concerns).toContain(
      "Only one type of drill is practised — the home is unprepared for varied emergency scenarios",
    );
  });

  it("no concerns for outstanding scenario", () => {
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        drill_type: ["fire_drill", "evacuation", "lockdown", "bomb_threat"][i % 4],
      }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.concerns).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15 — RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("recommends implementing drills immediately when total=0", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.recommendations[0]).toMatchObject({
      rank: 1,
      recommendation: "Implement regular fire drills and emergency exercises immediately",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  });

  it("recommends increasing frequency when total=1", () => {
    const drills = [makeDrill()];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const freqRec = r.recommendations.find(rec =>
      rec.recommendation.includes("Increase drill frequency"),
    );
    expect(freqRec).toBeDefined();
    expect(freqRec!.urgency).toBe("soon");
  });

  it("recommends increasing frequency when total=2", () => {
    const drills = [makeDrill({ id: "d1" }), makeDrill({ id: "d2" })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const freqRec = r.recommendations.find(rec =>
      rec.recommendation.includes("Increase drill frequency"),
    );
    expect(freqRec).toBeDefined();
  });

  it("does not recommend increasing frequency when total=3", () => {
    const drills = Array.from({ length: 3 }, (_, i) => makeDrill({ id: `d${i}` }));
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const freqRec = r.recommendations.find(rec =>
      rec.recommendation.includes("Increase drill frequency"),
    );
    expect(freqRec).toBeUndefined();
  });

  it("recommends addressing unsatisfactory drills when sat < 70%", () => {
    const drills = [
      makeDrill({ id: "s1", result: "satisfactory" }),
      makeDrill({ id: "f1", result: "failed" }),
      makeDrill({ id: "f2", result: "failed" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(33);
    const satRec = r.recommendations.find(rec =>
      rec.recommendation.includes("Address root causes"),
    );
    expect(satRec).toBeDefined();
    expect(satRec!.urgency).toBe("immediate");
  });

  it("recommends ensuring full participation when allPresentRate < 70%", () => {
    const drills = [
      makeDrill({ id: "p1", all_present: true }),
      makeDrill({ id: "a1", all_present: false }),
      makeDrill({ id: "a2", all_present: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const partRec = r.recommendations.find(rec =>
      rec.recommendation.includes("Ensure all children and staff"),
    );
    expect(partRec).toBeDefined();
    expect(partRec!.urgency).toBe("soon");
  });

  it("recommends diversifying drills when uniqueTypes < 2", () => {
    const drills = [makeDrill({ drill_type: "fire_drill" })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const divRec = r.recommendations.find(rec =>
      rec.recommendation.includes("Diversify emergency exercises"),
    );
    expect(divRec).toBeDefined();
    expect(divRec!.urgency).toBe("planned");
  });

  it("does not recommend diversifying when uniqueTypes >= 2", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "evacuation" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const divRec = r.recommendations.find(rec =>
      rec.recommendation.includes("Diversify emergency exercises"),
    );
    expect(divRec).toBeUndefined();
  });

  it("recommends following up on issues when issuesAddressedRate < 60%", () => {
    const drills = [
      makeDrill({ id: "na1", has_issues: true, has_actions: false }),
      makeDrill({ id: "na2", has_issues: true, has_actions: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const issueRec = r.recommendations.find(rec =>
      rec.recommendation.includes("Follow up on all issues"),
    );
    expect(issueRec).toBeDefined();
    expect(issueRec!.urgency).toBe("soon");
  });

  it("does not recommend following up when issues are addressed at 60%", () => {
    const drills = [
      ...Array.from({ length: 3 }, (_, i) =>
        makeDrill({ id: `a${i}`, has_issues: true, has_actions: true }),
      ),
      ...Array.from({ length: 2 }, (_, i) =>
        makeDrill({ id: `na${i}`, has_issues: true, has_actions: false }),
      ),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.issues_addressed_rate).toBe(60);
    const issueRec = r.recommendations.find(rec =>
      rec.recommendation.includes("Follow up on all issues"),
    );
    expect(issueRec).toBeUndefined();
  });

  it("caps recommendations to 5", () => {
    // Create a scenario that triggers all 6 possible recs (except zero-drills one)
    const drills = [
      makeDrill({
        id: "d1",
        result: "failed",
        all_present: false,
        has_issues: true,
        has_actions: false,
        drill_type: "fire_drill",
      }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.recommendations.length).toBeLessThanOrEqual(5);
  });

  it("recommendations have sequential ranks after capping", () => {
    const drills = [
      makeDrill({
        id: "d1",
        result: "failed",
        all_present: false,
        has_issues: true,
        has_actions: false,
        drill_type: "fire_drill",
      }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16 — INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Insights", () => {
  it("positive exemplary insight when sat>=90, allPres>=90, total>=6", () => {
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({ id: `d${i}` }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const exemplary = r.insights.find(ins =>
      ins.text.includes("Emergency preparedness is exemplary"),
    );
    expect(exemplary).toBeDefined();
    expect(exemplary!.severity).toBe("positive");
  });

  it("no exemplary insight when total < 6", () => {
    const drills = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ id: `d${i}` }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const exemplary = r.insights.find(ins =>
      ins.text.includes("Emergency preparedness is exemplary"),
    );
    expect(exemplary).toBeUndefined();
  });

  it("critical insight when total=0", () => {
    const r = computeFireDrillPreparedness(baseInput());
    expect(r.insights[0]).toMatchObject({
      severity: "critical",
    });
    expect(r.insights[0].text).toContain("No drill records");
  });

  it("critical insight for high failure rate >=30%", () => {
    const drills = [
      makeDrill({ id: "f1", result: "failed" }),
      makeDrill({ id: "nc1", result: "not_completed" }),
      makeDrill({ id: "s1", result: "satisfactory" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const failInsight = r.insights.find(ins =>
      ins.text.includes("High drill failure rate"),
    );
    expect(failInsight).toBeDefined();
    expect(failInsight!.severity).toBe("critical");
  });

  it("positive insight for sub-2-minute evacuation", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 100 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const evacInsight = r.insights.find(ins =>
      ins.text.includes("Sub-2-minute evacuation"),
    );
    expect(evacInsight).toBeDefined();
    expect(evacInsight!.severity).toBe("positive");
  });

  it("no evac insight when avgEvacTime is 0", () => {
    const drills = [makeDrill({ evacuation_time_seconds: null })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const evacInsight = r.insights.find(ins =>
      ins.text.includes("Sub-2-minute"),
    );
    expect(evacInsight).toBeUndefined();
  });

  it("positive insight for >=4 unique drill types", () => {
    const drills = [
      makeDrill({ id: "d1", drill_type: "fire_drill" }),
      makeDrill({ id: "d2", drill_type: "evacuation" }),
      makeDrill({ id: "d3", drill_type: "lockdown" }),
      makeDrill({ id: "d4", drill_type: "bomb_threat" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    const varInsight = r.insights.find(ins =>
      ins.text.includes("Diverse drill types"),
    );
    expect(varInsight).toBeDefined();
    expect(varInsight!.severity).toBe("positive");
  });

  it("caps insights to 3", () => {
    // Exemplary + sub-2-min evac + diverse types = 3 positive insights
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        drill_type: ["fire_drill", "evacuation", "lockdown", "bomb_threat"][i % 4],
        evacuation_time_seconds: 90,
      }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.insights.length).toBeLessThanOrEqual(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17 — INTEGRATION: BEST-CASE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Integration — Best-case scenario", () => {
  it("achieves outstanding with maximum modifiers: score 82", () => {
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        drill_type: ["fire_drill", "evacuation", "lockdown", "bomb_threat"][i % 4],
        result: "satisfactory",
        all_present: true,
        evacuation_time_seconds: 90,
        has_issues: true,
        has_actions: true,
      }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // 52 +5(freq6) +6(sat100) +5(allPres100) +5(evac90) +4(issues100) +5(variety4) = 82
    expect(r.drill_score).toBe(82);
    expect(r.drill_rating).toBe("outstanding");
    expect(r.total_drills).toBe(6);
    expect(r.satisfactory_rate).toBe(100);
    expect(r.all_present_rate).toBe(100);
    expect(r.average_evacuation_time).toBe(90);
    expect(r.drill_type_variety).toBe(4);
    expect(r.issues_addressed_rate).toBe(100);
    expect(r.failed_rate).toBe(0);
    expect(r.strengths.length).toBeGreaterThanOrEqual(4);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18 — INTEGRATION: WORST-CASE WITH DRILLS
// ══════════════════════════════════════════════════════════════════════════════

describe("Integration — Worst-case with drills", () => {
  it("minimum score with 1 drill: all negatives", () => {
    const drills = [
      makeDrill({
        result: "failed",
        all_present: false,
        evacuation_time_seconds: 400,
        has_issues: true,
        has_actions: false,
        drill_type: "fire_drill",
      }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // 52 +0(freq1) -5(sat0%) -4(allPres0%) -4(evac400) -4(issues0%) -3(variety1) = 32
    expect(r.drill_score).toBe(32);
    expect(r.drill_rating).toBe("inadequate");
    expect(r.satisfactory_rate).toBe(0);
    expect(r.all_present_rate).toBe(0);
    expect(r.average_evacuation_time).toBe(400);
    expect(r.failed_rate).toBe(100);
    expect(r.concerns.length).toBeGreaterThanOrEqual(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19 — INTEGRATION: MIXED SCENARIOS
// ══════════════════════════════════════════════════════════════════════════════

describe("Integration — Mixed scenarios", () => {
  it("adequate scenario with mixed results", () => {
    const drills = [
      makeDrill({ id: "d1", result: "satisfactory", all_present: true, evacuation_time_seconds: 150, drill_type: "fire_drill" }),
      makeDrill({ id: "d2", result: "issues_identified", all_present: false, evacuation_time_seconds: 200, drill_type: "evacuation", has_issues: true, has_actions: true }),
      makeDrill({ id: "d3", result: "failed", all_present: true, evacuation_time_seconds: 180, drill_type: "fire_drill", has_issues: true, has_actions: false }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // sat: 1/3=33% → -5. allPres: 2/3=67% → 0 (not >=70, not <50). evac: avg (150+200+180)/3=177 → +2 (<=180).
    // issues: 1 of 2 with issues = 50% → 0 (between 40-59). variety: 2 → +2.
    // 52 +2(freq3) -5(sat33) +0(allPres67) +2(evac177) +0(issues50) +2(variety2) = 53
    expect(r.drill_score).toBe(53);
    expect(r.drill_rating).toBe("adequate");
    expect(r.satisfactory_rate).toBe(33);
    expect(r.all_present_rate).toBe(67);
    expect(r.average_evacuation_time).toBe(177);
    expect(r.drill_type_variety).toBe(2);
    expect(r.issues_addressed_rate).toBe(50);
  });

  it("good scenario approaching outstanding", () => {
    const drills = Array.from({ length: 6 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        drill_type: ["fire_drill", "evacuation", "lockdown"][i % 3],
        evacuation_time_seconds: 100,
      }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // 52 +5(freq6) +6(sat100) +5(allPres100) +5(evac100) +2(noIssues) +2(variety3) = 77
    expect(r.drill_score).toBe(77);
    expect(r.drill_rating).toBe("good");
  });

  it("handles drills where all have null evacuation times", () => {
    const drills = Array.from({ length: 3 }, (_, i) =>
      makeDrill({ id: `d${i}`, evacuation_time_seconds: null }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.average_evacuation_time).toBe(0);
    // 52 +2(freq3) +6(sat100) +5(allPres100) -1(evacNull) +2(noIssues) -3(variety1) = 63
    expect(r.drill_score).toBe(63);
  });

  it("borderline adequate-to-good: score exactly 64", () => {
    // 52 +0(freq1) +6(sat100) +5(allPres100) +2(evac150) +2(noIssues) -3(variety1) = 64
    const drills = [makeDrill({ evacuation_time_seconds: 150 })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.drill_score).toBe(64);
    expect(r.drill_rating).toBe("adequate");
  });

  it("scenario with many drills but poor quality", () => {
    const drills = Array.from({ length: 8 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        result: i < 2 ? "satisfactory" : "failed",
        all_present: i < 2,
        evacuation_time_seconds: 350,
        has_issues: true,
        has_actions: false,
      }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // sat: 2/8=25% → -5. allPres: 2/8=25% → -4. evac: 350s → -4. issues: 0% → -4. variety: 1 → -3.
    // 52 +5(freq8) -5 -4 -4 -4 -3 = 37
    expect(r.drill_score).toBe(37);
    expect(r.drill_rating).toBe("inadequate");
    expect(r.failed_rate).toBe(75);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 20 — EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("single drill with no evacuation time and issues not addressed", () => {
    const drills = [
      makeDrill({
        result: "issues_identified",
        all_present: false,
        evacuation_time_seconds: null,
        has_issues: true,
        has_actions: false,
      }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // sat: 0% → -5. allPres: 0% → -4. evac: null → -1. issues: 0% → -4. variety: 1 → -3.
    // 52 +0 -5 -4 -1 -4 -3 = 35
    expect(r.drill_score).toBe(35);
  });

  it("large number of drills (20) all perfect", () => {
    const drills = Array.from({ length: 20 }, (_, i) =>
      makeDrill({
        id: `d${i}`,
        drill_type: ["fire_drill", "evacuation", "lockdown", "bomb_threat", "flood"][i % 5],
        evacuation_time_seconds: 60,
        has_issues: true,
        has_actions: true,
      }),
    );
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // 52 +5 +6 +5 +5 +4 +5 = 82
    expect(r.drill_score).toBe(82);
    expect(r.drill_rating).toBe("outstanding");
    expect(r.total_drills).toBe(20);
    expect(r.drill_type_variety).toBe(5);
  });

  it("all drills have result not_completed", () => {
    const drills = [
      makeDrill({ id: "d1", result: "not_completed" }),
      makeDrill({ id: "d2", result: "not_completed" }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(0);
    expect(r.failed_rate).toBe(100);
  });

  it("all drills have result issues_identified (not satisfactory, not failed)", () => {
    const drills = [
      makeDrill({ id: "d1", result: "issues_identified", has_issues: true, has_actions: true }),
      makeDrill({ id: "d2", result: "issues_identified", has_issues: true, has_actions: true }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    expect(r.satisfactory_rate).toBe(0);
    expect(r.failed_rate).toBe(0);
  });

  it("mix of null and valid evacuation times averages only valid ones", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 60 }),
      makeDrill({ id: "d2", evacuation_time_seconds: null }),
      makeDrill({ id: "d3", evacuation_time_seconds: 0 }),
      makeDrill({ id: "d4", evacuation_time_seconds: 180 }),
    ];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // Only d1 (60) and d4 (180) are valid → (60+180)/2 = 120
    expect(r.average_evacuation_time).toBe(120);
  });

  it("has_issues=false but has_actions=true does not count as issue", () => {
    const drills = [makeDrill({ has_issues: false, has_actions: true })];
    const r = computeFireDrillPreparedness(baseInput({ drills }));
    // withIssues = 0 → noIssues branch → +2
    expect(r.issues_addressed_rate).toBe(0);
    // 52 +0 +6 +5 +5 +2 -3 = 67
    expect(r.drill_score).toBe(67);
  });

  it("total_children value does not affect scoring (only guards)", () => {
    const drills = [makeDrill()];
    const r1 = computeFireDrillPreparedness(baseInput({ total_children: 1, drills }));
    const r2 = computeFireDrillPreparedness(baseInput({ total_children: 20, drills }));
    expect(r1.drill_score).toBe(r2.drill_score);
  });
});
