// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF DEBRIEF & EMOTIONAL SUPPORT INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 33: staff must be supported. NICE: emotional support after events.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStaffDebriefEmotionalSupport,
  type StaffDebriefInput,
  type DebriefRecordInput,
  type StaffWellbeingCheckInput,
} from "../home-staff-debrief-emotional-support-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDebrief(overrides: Partial<DebriefRecordInput> = {}): DebriefRecordInput {
  return {
    id: "dbr_test",
    type: "post_incident",
    status: "completed",
    emotional_impact: "moderate",
    follow_up_needed: false,
    follow_up_completed: false,
    learning_points_count: 3,
    support_offered_count: 2,
    staff_involved_count: 2,
    ...overrides,
  };
}

function makeWellbeingCheck(overrides: Partial<StaffWellbeingCheckInput> = {}): StaffWellbeingCheckInput {
  return {
    id: "wbc_test",
    staff_id: "staff_1",
    check_completed: true,
    concerns_raised: false,
    support_provided: true,
    ...overrides,
  };
}

/**
 * baseInput: score 82 outstanding
 * 8 staff, 6 debriefs all completed with learning+support,
 * 2 needing follow-up both completed, 0 overdue,
 * 8 wellbeing checks all completed.
 *
 * Base: 52
 * mod1 completion 100% >=90% → +5 = 57
 * mod2 follow-up 100% >=90% → +6 = 63
 * mod3 overdue 0% → +5 = 68
 * mod4 learning 100% >=90% → +5 = 73
 * mod5 support 100% >=90% → +4 = 77
 * mod6 wellbeing 100% >=90% → +5 = 82
 */
function baseInput(overrides: Partial<StaffDebriefInput> = {}): StaffDebriefInput {
  const debriefs: DebriefRecordInput[] = [
    makeDebrief({ id: "dbr_1", type: "post_incident", follow_up_needed: true, follow_up_completed: true }),
    makeDebrief({ id: "dbr_2", type: "post_restraint", follow_up_needed: true, follow_up_completed: true }),
    makeDebrief({ id: "dbr_3", type: "post_missing" }),
    makeDebrief({ id: "dbr_4", type: "critical_event" }),
    makeDebrief({ id: "dbr_5", type: "emotional_support" }),
    makeDebrief({ id: "dbr_6", type: "tci_reflection" }),
  ];

  const wellbeing_checks: StaffWellbeingCheckInput[] = Array.from({ length: 8 }, (_, i) =>
    makeWellbeingCheck({ id: `wbc_${i + 1}`, staff_id: `staff_${i + 1}` }),
  );

  return {
    today: "2026-05-27",
    total_staff: 8,
    debriefs,
    wellbeing_checks,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ total_staff: 0 }));
    expect(r.debrief_rating).toBe("insufficient_data");
    expect(r.debrief_score).toBe(0);
  });

  it("returns score 0 when total_staff is 0", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ total_staff: 0 }));
    expect(r.debrief_score).toBe(0);
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ total_staff: 0 }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns zero for all metrics when total_staff is 0", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ total_staff: 0 }));
    expect(r.total_debriefs).toBe(0);
    expect(r.completion_rate).toBe(0);
    expect(r.follow_up_completion_rate).toBe(0);
    expect(r.high_impact_count).toBe(0);
    expect(r.overdue_debriefs).toBe(0);
    expect(r.wellbeing_check_rate).toBe(0);
  });

  it("sets an appropriate headline for insufficient data", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ total_staff: 0 }));
    expect(r.headline).toContain("No active staff");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. BASE INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

describe("base input (outstanding scenario)", () => {
  it("returns outstanding rating for well-performing home", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.debrief_rating).toBe("outstanding");
  });

  it("returns score of 82", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.debrief_score).toBe(82);
  });

  it("calculates correct total_debriefs", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.total_debriefs).toBe(6);
  });

  it("calculates 100% completion rate", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.completion_rate).toBe(100);
  });

  it("calculates 100% follow-up completion rate", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.follow_up_completion_rate).toBe(100);
  });

  it("reports 0 overdue debriefs", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.overdue_debriefs).toBe(0);
  });

  it("reports 100% wellbeing check rate", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.wellbeing_check_rate).toBe(100);
  });

  it("returns outstanding headline", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.headline).toContain("Exemplary");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for score >= 80", () => {
    // base = 82, outstanding
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.debrief_rating).toBe("outstanding");
    expect(r.debrief_score).toBeGreaterThanOrEqual(80);
  });

  it("returns good for score >= 65 and < 80", () => {
    // Drop wellbeing checks to 0 → mod6 goes from +5 to -1 (delta -6) → 82-6=76
    // Drop follow-ups: make none needed → mod2 goes from +6 to +3 (delta -3) → 76-3=73
    // That's 73 which is good
    const debriefs = [
      makeDebrief({ id: "dbr_1" }),
      makeDebrief({ id: "dbr_2" }),
      makeDebrief({ id: "dbr_3" }),
      makeDebrief({ id: "dbr_4" }),
      makeDebrief({ id: "dbr_5" }),
      makeDebrief({ id: "dbr_6" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({
      debriefs,
      wellbeing_checks: [],
    }));
    // 52 + 5(completion100%) + 3(no follow-up needed) + 5(0 overdue) + 5(learning100%) + 4(support100%) + (-1)(no checks) = 73
    expect(r.debrief_score).toBe(73);
    expect(r.debrief_rating).toBe("good");
  });

  it("returns adequate for score >= 45 and < 65", () => {
    // 52 + 2(completion 70-89%) + 3(no follow-ups needed) + 0(overdue <25%) + 0(learning 40-69%) + 0(support 40-69%) + (-1)(no checks)
    // = 56 → adequate
    const debriefs = [
      makeDebrief({ id: "d1", status: "completed", learning_points_count: 2, support_offered_count: 1 }),
      makeDebrief({ id: "d2", status: "completed", learning_points_count: 2, support_offered_count: 1 }),
      makeDebrief({ id: "d3", status: "completed", learning_points_count: 0, support_offered_count: 0 }),
      makeDebrief({ id: "d4", status: "scheduled", learning_points_count: 0, support_offered_count: 0 }),
      makeDebrief({ id: "d5", status: "overdue", learning_points_count: 0, support_offered_count: 0 }),
    ];
    // completion: 3/5 = 60% → +2 (>=40 but <70 → 0... wait >=70 → +2)
    // Actually 60% is <70, so mod1 = 0
    // Let me recalc: 3/5=60% → >=40% → 0
    // mod2: none need follow-up → +3
    // mod3: 1 overdue / 5 = 20% → <25% → 0
    // mod4: 2/5 = 40% → >=40% → 0
    // mod5: 2/5 = 40% → >=40% → 0
    // mod6: no checks → -1
    // total: 52 + 0 + 3 + 0 + 0 + 0 + (-1) = 54 → adequate
    const r = computeStaffDebriefEmotionalSupport({
      today: "2026-05-27",
      total_staff: 8,
      debriefs,
      wellbeing_checks: [],
    });
    expect(r.debrief_score).toBe(54);
    expect(r.debrief_rating).toBe("adequate");
  });

  it("returns inadequate for score < 45", () => {
    // 52 + (-5)(completion<40%) + (-5)(follow-up<40%) + (-4)(overdue>=25%) + (-5)(learning<40%) + (-4)(support<40%) + (-5)(wellbeing<40%)
    // = 52 - 5 - 5 - 4 - 5 - 4 - 5 = 24 → inadequate
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue", follow_up_needed: true, follow_up_completed: false, learning_points_count: 0, support_offered_count: 0 }),
      makeDebrief({ id: "d2", status: "overdue", follow_up_needed: true, follow_up_completed: false, learning_points_count: 0, support_offered_count: 0 }),
      makeDebrief({ id: "d3", status: "declined", follow_up_needed: true, follow_up_completed: false, learning_points_count: 0, support_offered_count: 0 }),
      makeDebrief({ id: "d4", status: "scheduled", learning_points_count: 0, support_offered_count: 0 }),
    ];
    // completion: 0/4 = 0% → -5
    // follow-up: 0/3 = 0% → -5
    // overdue: 2/4 = 50% → -4
    // learning: 0/4 = 0% → -5
    // support: 0/4 = 0% → -4
    // wellbeing: 0/10 = 0% → ... wait no checks
    const checks = [
      makeWellbeingCheck({ id: "w1", check_completed: false }),
      makeWellbeingCheck({ id: "w2", check_completed: false }),
      makeWellbeingCheck({ id: "w3", check_completed: false }),
    ];
    // wellbeing: 0/3 = 0% → -5
    const r = computeStaffDebriefEmotionalSupport({
      today: "2026-05-27",
      total_staff: 8,
      debriefs,
      wellbeing_checks: checks,
    });
    expect(r.debrief_score).toBe(24);
    expect(r.debrief_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. MOD1: DEBRIEF COMPLETION RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: debrief completion rate", () => {
  it("awards +5 when completion >= 90%", () => {
    // All 6 completed, base scenario
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    // base scenario has +5 for mod1
    expect(r.completion_rate).toBe(100);
    expect(r.debrief_score).toBe(82);
  });

  it("awards +2 when completion >= 70% and < 90%", () => {
    // 5/6 = 83% → +5 actually since 83 >= 90? No, 83 < 90, so +2
    // Wait 83 >= 70 → +2
    const debriefs = baseInput().debriefs.map((d, i) =>
      i === 5 ? { ...d, status: "scheduled" } : d,
    );
    // 5/6 = 83% → +2
    // mod1 delta vs base: +2 - +5 = -3 → 82 - 3 = 79
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.completion_rate).toBe(83);
    expect(r.debrief_score).toBe(79);
  });

  it("awards 0 when completion >= 40% and < 70%", () => {
    // 3/6 = 50% → 0
    const debriefs = baseInput().debriefs.map((d, i) =>
      i >= 3 ? { ...d, status: "scheduled" } : d,
    );
    // 3/6=50% → 0, delta -5 → 82-5 = 77
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.completion_rate).toBe(50);
    expect(r.debrief_score).toBe(77);
  });

  it("awards -5 when completion < 40%", () => {
    // 1/6 = 17% → -5
    const debriefs = baseInput().debriefs.map((d, i) =>
      i >= 1 ? { ...d, status: "scheduled" } : d,
    );
    // 1/6=17% → -5, delta -10 → 82-10=72
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.completion_rate).toBe(17);
    expect(r.debrief_score).toBe(72);
  });

  it("awards +2 when 0 debriefs exist", () => {
    // 0 debriefs → +2 for mod1, mod3 also +2 (0 debriefs), mod4 0, mod5 0
    // 52 + 2(mod1) + 3(mod2 no follow-up needed from 0 debriefs) + 2(mod3) + 0(mod4) + 0(mod5) + 5(mod6 wellbeing 100%)
    // = 52 + 2 + 3 + 2 + 0 + 0 + 5 = 64
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs: [] }));
    expect(r.total_debriefs).toBe(0);
    expect(r.debrief_score).toBe(64);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. MOD2: FOLLOW-UP COMPLETION
// ═══════════════════════════════════════════════════════════════════════════

describe("mod2: follow-up completion", () => {
  it("awards +6 when follow-up completion >= 90%", () => {
    // base scenario: 2 needing, 2 completed = 100% → +6
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.follow_up_completion_rate).toBe(100);
  });

  it("awards +3 when follow-up completion >= 70% and < 90%", () => {
    // 3 needing, 2 completed = 67%... that's < 70, so +0
    // 5 needing, 4 completed = 80% → +3
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_needed: true, follow_up_completed: true }),
      makeDebrief({ id: "d2", follow_up_needed: true, follow_up_completed: true }),
      makeDebrief({ id: "d3", follow_up_needed: true, follow_up_completed: true }),
      makeDebrief({ id: "d4", follow_up_needed: true, follow_up_completed: true }),
      makeDebrief({ id: "d5", follow_up_needed: true, follow_up_completed: false }),
    ];
    // follow-up: 4/5 = 80% → +3
    // mod2 delta vs base: +3 - +6 = -3 → also mod1: 5/5=100% → +5 same
    // mod3: 0 overdue/5 → +5
    // mod4: all have learning >0 → 5/5=100% → +5
    // mod5: all have support >0 → 5/5=100% → +4
    // mod6: 8 checks all complete → +5
    // total: 52 + 5 + 3 + 5 + 5 + 4 + 5 = 79
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.follow_up_completion_rate).toBe(80);
    expect(r.debrief_score).toBe(79);
  });

  it("awards 0 when follow-up completion >= 40% and < 70%", () => {
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_needed: true, follow_up_completed: true }),
      makeDebrief({ id: "d2", follow_up_needed: true, follow_up_completed: false }),
    ];
    // follow-up: 1/2 = 50% → 0
    // mod2 delta: 0 - 6 = -6
    // mod1: 2/2=100% → +5
    // mod3: 0 overdue → +5
    // mod4: 2/2=100% → +5
    // mod5: 2/2=100% → +4
    // mod6: +5
    // total: 52 + 5 + 0 + 5 + 5 + 4 + 5 = 76
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.follow_up_completion_rate).toBe(50);
    expect(r.debrief_score).toBe(76);
  });

  it("awards -5 when follow-up completion < 40%", () => {
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d2", follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d3", follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d4" }),
    ];
    // follow-up: 0/3 = 0% → -5
    // mod2 delta: -5 - 6 = -11
    // mod1: 4/4=100% → +5
    // mod3: 0 overdue → +5
    // mod4: 4/4=100% → +5
    // mod5: 4/4=100% → +4
    // mod6: +5
    // total: 52 + 5 + (-5) + 5 + 5 + 4 + 5 = 71
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.follow_up_completion_rate).toBe(0);
    expect(r.debrief_score).toBe(71);
  });

  it("awards +3 when no follow-ups are needed", () => {
    // base scenario without follow-up_needed debriefs
    const debriefs = baseInput().debriefs.map((d) => ({
      ...d,
      follow_up_needed: false,
      follow_up_completed: false,
    }));
    // mod2: none needed → +3, delta -3 → 82-3 = 79
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.follow_up_completion_rate).toBe(0); // pct(0,0) = 0
    expect(r.debrief_score).toBe(79);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. MOD3: OVERDUE CONTROL
// ═══════════════════════════════════════════════════════════════════════════

describe("mod3: overdue control", () => {
  it("awards +5 when 0% overdue", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.overdue_debriefs).toBe(0);
  });

  it("awards +2 when overdue < 10%", () => {
    // Need overdue rate > 0 and < 10%. Use 1/11 = 9%
    const debriefs = [
      ...Array.from({ length: 10 }, (_, i) => makeDebrief({ id: `d${i}` })),
      makeDebrief({ id: "d_overdue", status: "overdue" }),
    ];
    // 1/11 = 9% → +2
    // mod1: 10/11 = 91% → +5
    // mod2: none need follow-up → +3
    // mod3: 9% → +2
    // mod4: 11/11 all have learning → but overdue one also has learning by default → 11/11=100% → +5
    // mod5: 11/11=100% → +4
    // mod6: 8 checks → +5
    // total: 52 + 5 + 3 + 2 + 5 + 4 + 5 = 76
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.overdue_debriefs).toBe(1);
    expect(r.debrief_score).toBe(76);
  });

  it("awards 0 when overdue >= 10% and < 25%", () => {
    // 1/5 = 20% → 0
    const debriefs = [
      makeDebrief({ id: "d1" }),
      makeDebrief({ id: "d2" }),
      makeDebrief({ id: "d3" }),
      makeDebrief({ id: "d4" }),
      makeDebrief({ id: "d5", status: "overdue" }),
    ];
    // mod1: 4/5=80% → +2 (>=70)
    // mod2: none need follow-up → +3
    // mod3: 20% → 0
    // mod4: 5/5=100% → +5
    // mod5: 5/5=100% → +4
    // mod6: +5
    // total: 52 + 2 + 3 + 0 + 5 + 4 + 5 = 71
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.overdue_debriefs).toBe(1);
    expect(r.debrief_score).toBe(71);
  });

  it("awards -4 when overdue >= 25%", () => {
    // 2/4 = 50% → -4
    const debriefs = [
      makeDebrief({ id: "d1" }),
      makeDebrief({ id: "d2" }),
      makeDebrief({ id: "d3", status: "overdue" }),
      makeDebrief({ id: "d4", status: "overdue" }),
    ];
    // mod1: 2/4=50% → 0
    // mod2: none need follow-up → +3
    // mod3: 50% → -4
    // mod4: 4/4=100% → +5
    // mod5: 4/4=100% → +4
    // mod6: +5
    // total: 52 + 0 + 3 + (-4) + 5 + 4 + 5 = 65
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.overdue_debriefs).toBe(2);
    expect(r.debrief_score).toBe(65);
  });

  it("awards +2 when 0 debriefs exist (for overdue control)", () => {
    // Already tested in mod1 section, verify overdue is 0
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs: [] }));
    expect(r.overdue_debriefs).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. MOD4: LEARNING CAPTURE
// ═══════════════════════════════════════════════════════════════════════════

describe("mod4: learning capture", () => {
  it("awards +5 when learning capture >= 90%", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    // all 6 debriefs have learning_points_count = 3 → 100% → +5
    expect(r.debrief_score).toBe(82);
  });

  it("awards +2 when learning capture >= 70% and < 90%", () => {
    // 5/6 = 83% → +2 (>=70 but <90)
    const debriefs = baseInput().debriefs.map((d, i) =>
      i === 5 ? { ...d, learning_points_count: 0 } : d,
    );
    // mod4 delta: +2 - +5 = -3 → 82 - 3 = 79
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.debrief_score).toBe(79);
  });

  it("awards 0 when learning capture >= 40% and < 70%", () => {
    // 3/6 = 50% → 0
    const debriefs = baseInput().debriefs.map((d, i) =>
      i >= 3 ? { ...d, learning_points_count: 0 } : d,
    );
    // mod4 delta: 0 - 5 = -5 → 82 - 5 = 77
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.debrief_score).toBe(77);
  });

  it("awards -5 when learning capture < 40%", () => {
    // 1/6 = 17% → -5
    const debriefs = baseInput().debriefs.map((d, i) =>
      i >= 1 ? { ...d, learning_points_count: 0 } : d,
    );
    // mod4 delta: -5 - 5 = -10 → 82 - 10 = 72
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.debrief_score).toBe(72);
  });

  it("awards 0 when 0 debriefs for learning capture", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs: [] }));
    // Already tested total score is 64
    expect(r.debrief_score).toBe(64);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. MOD5: SUPPORT PROVISION
// ═══════════════════════════════════════════════════════════════════════════

describe("mod5: support provision", () => {
  it("awards +4 when support provision >= 90%", () => {
    // base: all 6 have support_offered_count=2 → 100% → +4
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.debrief_score).toBe(82);
  });

  it("awards +1 when support provision >= 70% and < 90%", () => {
    // 5/6 = 83% → +1 (>=70)
    const debriefs = baseInput().debriefs.map((d, i) =>
      i === 5 ? { ...d, support_offered_count: 0 } : d,
    );
    // mod5 delta: +1 - +4 = -3 → 82 - 3 = 79
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.debrief_score).toBe(79);
  });

  it("awards 0 when support provision >= 40% and < 70%", () => {
    // 3/6 = 50% → 0
    const debriefs = baseInput().debriefs.map((d, i) =>
      i >= 3 ? { ...d, support_offered_count: 0 } : d,
    );
    // mod5 delta: 0 - 4 = -4 → 82 - 4 = 78
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.debrief_score).toBe(78);
  });

  it("awards -4 when support provision < 40%", () => {
    // 1/6 = 17% → -4
    const debriefs = baseInput().debriefs.map((d, i) =>
      i >= 1 ? { ...d, support_offered_count: 0 } : d,
    );
    // mod5 delta: -4 - 4 = -8 → 82 - 8 = 74
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.debrief_score).toBe(74);
  });

  it("awards 0 when 0 debriefs for support provision", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs: [] }));
    expect(r.debrief_score).toBe(64);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. MOD6: WELLBEING CHECK COVERAGE
// ═══════════════════════════════════════════════════════════════════════════

describe("mod6: wellbeing check coverage", () => {
  it("awards +5 when wellbeing check rate >= 90%", () => {
    // base: 8/8 = 100% → +5
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.wellbeing_check_rate).toBe(100);
  });

  it("awards +2 when wellbeing check rate >= 70% and < 90%", () => {
    // 6/8 = 75% → +2
    const checks = baseInput().wellbeing_checks.map((c, i) =>
      i >= 6 ? { ...c, check_completed: false } : c,
    );
    // mod6 delta: +2 - +5 = -3 → 82 - 3 = 79
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: checks }));
    expect(r.wellbeing_check_rate).toBe(75);
    expect(r.debrief_score).toBe(79);
  });

  it("awards 0 when wellbeing check rate >= 40% and < 70%", () => {
    // 4/8 = 50% → 0
    const checks = baseInput().wellbeing_checks.map((c, i) =>
      i >= 4 ? { ...c, check_completed: false } : c,
    );
    // mod6 delta: 0 - 5 = -5 → 82 - 5 = 77
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: checks }));
    expect(r.wellbeing_check_rate).toBe(50);
    expect(r.debrief_score).toBe(77);
  });

  it("awards -5 when wellbeing check rate < 40%", () => {
    // 2/8 = 25% → -5
    const checks = baseInput().wellbeing_checks.map((c, i) =>
      i >= 2 ? { ...c, check_completed: false } : c,
    );
    // mod6 delta: -5 - 5 = -10 → 82 - 10 = 72
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: checks }));
    expect(r.wellbeing_check_rate).toBe(25);
    expect(r.debrief_score).toBe(72);
  });

  it("awards -1 when 0 wellbeing checks exist", () => {
    // mod6 delta: -1 - 5 = -6 → 82 - 6 = 76
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: [] }));
    expect(r.wellbeing_check_rate).toBe(0);
    expect(r.debrief_score).toBe(76);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. METRICS COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════

describe("metrics computation", () => {
  it("counts total_debriefs correctly", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.total_debriefs).toBe(6);
  });

  it("calculates completion_rate as pct(completed, total)", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "completed" }),
      makeDebrief({ id: "d2", status: "completed" }),
      makeDebrief({ id: "d3", status: "scheduled" }),
      makeDebrief({ id: "d4", status: "overdue" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.completion_rate).toBe(50); // 2/4
  });

  it("calculates follow_up_completion_rate correctly", () => {
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_needed: true, follow_up_completed: true }),
      makeDebrief({ id: "d2", follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d3", follow_up_needed: false }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.follow_up_completion_rate).toBe(50); // 1/2
  });

  it("counts high_impact_count for high and significant", () => {
    const debriefs = [
      makeDebrief({ id: "d1", emotional_impact: "low" }),
      makeDebrief({ id: "d2", emotional_impact: "moderate" }),
      makeDebrief({ id: "d3", emotional_impact: "high" }),
      makeDebrief({ id: "d4", emotional_impact: "significant" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.high_impact_count).toBe(2);
  });

  it("counts overdue_debriefs correctly", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "completed" }),
      makeDebrief({ id: "d2", status: "overdue" }),
      makeDebrief({ id: "d3", status: "overdue" }),
      makeDebrief({ id: "d4", status: "scheduled" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.overdue_debriefs).toBe(2);
  });

  it("calculates wellbeing_check_rate correctly", () => {
    const checks = [
      makeWellbeingCheck({ id: "w1", check_completed: true }),
      makeWellbeingCheck({ id: "w2", check_completed: true }),
      makeWellbeingCheck({ id: "w3", check_completed: false }),
      makeWellbeingCheck({ id: "w4", check_completed: false }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: checks }));
    expect(r.wellbeing_check_rate).toBe(50); // 2/4
  });

  it("returns 0 for completion_rate when no debriefs", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs: [] }));
    expect(r.completion_rate).toBe(0);
  });

  it("returns 0 for follow_up_completion_rate when none need follow-up", () => {
    const debriefs = [makeDebrief({ id: "d1", follow_up_needed: false })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.follow_up_completion_rate).toBe(0);
  });

  it("returns 0 for wellbeing_check_rate when no checks", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: [] }));
    expect(r.wellbeing_check_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes completion strength when >= 90%", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("debriefs completed"))).toBe(true);
  });

  it("includes follow-up strength when >= 90%", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Follow-up"))).toBe(true);
  });

  it("includes no overdue strength", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("No overdue"))).toBe(true);
  });

  it("includes learning capture strength when >= 90%", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Learning points"))).toBe(true);
  });

  it("includes support provision strength when >= 90%", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("Emotional support"))).toBe(true);
  });

  it("includes wellbeing check strength when >= 90%", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("wellbeing checks completed"))).toBe(true);
  });

  it("includes no high impact strength when applicable", () => {
    // base debriefs have emotional_impact = "moderate", not high/significant
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.strengths.some((s) => s.includes("No high or significant"))).toBe(true);
  });

  it("does not include strengths when criteria not met", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue", emotional_impact: "high", learning_points_count: 0, support_offered_count: 0, follow_up_needed: true, follow_up_completed: false }),
    ];
    const checks = [makeWellbeingCheck({ id: "w1", check_completed: false })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs, wellbeing_checks: checks }));
    expect(r.strengths.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("raises concern when completion < 70%", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "completed" }),
      makeDebrief({ id: "d2", status: "scheduled" }),
      makeDebrief({ id: "d3", status: "scheduled" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.concerns.some((c) => c.includes("debriefs completed"))).toBe(true);
  });

  it("raises concern when debriefs are overdue", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue" }),
      makeDebrief({ id: "d2" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  it("raises concern when follow-up completion < 70%", () => {
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d2", follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d3", follow_up_needed: true, follow_up_completed: true }),
    ];
    // 1/3 = 33% < 70%
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.concerns.some((c) => c.includes("Follow-up completion"))).toBe(true);
  });

  it("raises concern when high impact debriefs exist", () => {
    const debriefs = [
      makeDebrief({ id: "d1", emotional_impact: "high" }),
      makeDebrief({ id: "d2" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.concerns.some((c) => c.includes("high or significant emotional impact"))).toBe(true);
  });

  it("raises concern when learning capture < 40%", () => {
    const debriefs = [
      makeDebrief({ id: "d1", learning_points_count: 0 }),
      makeDebrief({ id: "d2", learning_points_count: 0 }),
      makeDebrief({ id: "d3", learning_points_count: 1 }),
    ];
    // 1/3 = 33% < 40%
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.concerns.some((c) => c.includes("Learning points"))).toBe(true);
  });

  it("raises concern when support provision < 40%", () => {
    const debriefs = [
      makeDebrief({ id: "d1", support_offered_count: 0 }),
      makeDebrief({ id: "d2", support_offered_count: 0 }),
      makeDebrief({ id: "d3", support_offered_count: 1 }),
    ];
    // 1/3 = 33% < 40%
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.concerns.some((c) => c.includes("Emotional support is not being offered"))).toBe(true);
  });

  it("raises concern when wellbeing check rate < 40%", () => {
    const checks = [
      makeWellbeingCheck({ id: "w1", check_completed: false }),
      makeWellbeingCheck({ id: "w2", check_completed: false }),
      makeWellbeingCheck({ id: "w3", check_completed: true }),
    ];
    // 1/3 = 33% < 40%
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: checks }));
    expect(r.concerns.some((c) => c.includes("wellbeing checks completed"))).toBe(true);
  });

  it("has no concerns for a well-performing home", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.concerns.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends completing overdue debriefs with immediate urgency", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue" }),
      makeDebrief({ id: "d2" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("overdue"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 33");
  });

  it("recommends follow-up completion when rate < 70%", () => {
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d2", follow_up_needed: true, follow_up_completed: false }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("follow-up"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends enhanced support for high-impact debriefs", () => {
    const debriefs = [
      makeDebrief({ id: "d1", emotional_impact: "high" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("high-impact"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
    expect(rec!.regulatory_ref).toBe("NICE Staff Wellbeing");
  });

  it("recommends learning capture improvement when rate < 70%", () => {
    const debriefs = [
      makeDebrief({ id: "d1", learning_points_count: 0 }),
      makeDebrief({ id: "d2", learning_points_count: 0 }),
      makeDebrief({ id: "d3", learning_points_count: 1 }),
    ];
    // 1/3 = 33% < 70%
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("learning"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends wellbeing check improvement when rate < 70%", () => {
    const checks = [
      makeWellbeingCheck({ id: "w1", check_completed: false }),
      makeWellbeingCheck({ id: "w2", check_completed: true }),
      makeWellbeingCheck({ id: "w3", check_completed: false }),
    ];
    // 1/3 = 33% < 70%
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: checks }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("wellbeing check"));
    expect(rec).toBeDefined();
    expect(rec!.regulatory_ref).toBe("NICE Staff Wellbeing");
  });

  it("caps recommendations at 5", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue", follow_up_needed: true, follow_up_completed: false, emotional_impact: "high", learning_points_count: 0, support_offered_count: 0 }),
      makeDebrief({ id: "d2", status: "overdue", follow_up_needed: true, follow_up_completed: false, emotional_impact: "significant", learning_points_count: 0, support_offered_count: 0 }),
      makeDebrief({ id: "d3", status: "declined", follow_up_needed: true, follow_up_completed: false, learning_points_count: 0, support_offered_count: 0 }),
    ];
    const checks = [
      makeWellbeingCheck({ id: "w1", check_completed: false }),
      makeWellbeingCheck({ id: "w2", check_completed: false }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs, wellbeing_checks: checks }));
    expect(r.recommendations.length).toBeLessThanOrEqual(5);
  });

  it("assigns sequential rank numbers", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue", follow_up_needed: true, follow_up_completed: false, emotional_impact: "high" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });

  it("returns no recommendations for a well-performing home", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.recommendations.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("generates critical insight for >= 3 overdue debriefs", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue" }),
      makeDebrief({ id: "d2", status: "overdue" }),
      makeDebrief({ id: "d3", status: "overdue" }),
      makeDebrief({ id: "d4" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    const insight = r.insights.find((i) => i.text.includes("systemic failure"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });

  it("generates warning insight for 1-2 overdue debriefs", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue" }),
      makeDebrief({ id: "d2" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    const insight = r.insights.find((i) => i.text.includes("overdue"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates critical insight for >= 3 high impact debriefs", () => {
    const debriefs = [
      makeDebrief({ id: "d1", emotional_impact: "high" }),
      makeDebrief({ id: "d2", emotional_impact: "significant" }),
      makeDebrief({ id: "d3", emotional_impact: "high" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    const insight = r.insights.find((i) => i.text.includes("sustained emotional pressure"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });

  it("generates warning insight for 1-2 high impact debriefs", () => {
    const debriefs = [
      makeDebrief({ id: "d1", emotional_impact: "high" }),
      makeDebrief({ id: "d2" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    const insight = r.insights.find((i) => i.text.includes("monitor staff closely"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates positive insight when all debriefs completed", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    const insight = r.insights.find((i) => i.text.includes("All debriefs completed"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("caps insights at 3", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue", emotional_impact: "high" }),
      makeDebrief({ id: "d2", status: "overdue", emotional_impact: "significant" }),
      makeDebrief({ id: "d3", status: "overdue", emotional_impact: "high" }),
      makeDebrief({ id: "d4", status: "completed" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.insights.length).toBeLessThanOrEqual(3);
  });

  it("returns no insights when nothing notable", () => {
    // No overdue, no high impact, not all completed (some scheduled)
    const debriefs = [
      makeDebrief({ id: "d1", status: "completed" }),
      makeDebrief({ id: "d2", status: "scheduled" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.insights.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("returns outstanding headline for outstanding rating", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.headline).toContain("Exemplary");
  });

  it("returns good headline for good rating", () => {
    const debriefs = baseInput().debriefs.map((d) => ({
      ...d,
      follow_up_needed: false,
      follow_up_completed: false,
    }));
    // Score: 82 - 3 (mod2 delta) = 79 → good? Let me verify
    // Actually need to drop below 80. Use no checks too.
    const r = computeStaffDebriefEmotionalSupport(baseInput({
      debriefs,
      wellbeing_checks: [],
    }));
    // 52 + 5 + 3 + 5 + 5 + 4 + (-1) = 73 → good
    expect(r.headline).toContain("Good debrief practices");
  });

  it("returns adequate headline for adequate rating", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "completed" }),
      makeDebrief({ id: "d2", status: "completed" }),
      makeDebrief({ id: "d3", status: "scheduled" }),
      makeDebrief({ id: "d4", status: "scheduled" }),
      makeDebrief({ id: "d5", status: "overdue" }),
    ];
    // mod1: 2/5=40% → 0; mod2: +3; mod3: 1/5=20% → 0; mod4: +5; mod5: +4; mod6: -1
    // 52 + 0 + 3 + 0 + 5 + 4 + (-1) = 63 → adequate (but close to good)
    // Actually 63 is < 65 → adequate
    const r = computeStaffDebriefEmotionalSupport({
      today: "2026-05-27",
      total_staff: 8,
      debriefs,
      wellbeing_checks: [],
    });
    expect(r.debrief_rating).toBe("adequate");
    expect(r.headline).toContain("adequate");
  });

  it("returns inadequate headline for inadequate rating", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue", learning_points_count: 0, support_offered_count: 0, follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d2", status: "overdue", learning_points_count: 0, support_offered_count: 0, follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d3", status: "declined", learning_points_count: 0, support_offered_count: 0 }),
    ];
    const checks = [
      makeWellbeingCheck({ id: "w1", check_completed: false }),
      makeWellbeingCheck({ id: "w2", check_completed: false }),
    ];
    const r = computeStaffDebriefEmotionalSupport({
      today: "2026-05-27",
      total_staff: 8,
      debriefs,
      wellbeing_checks: checks,
    });
    expect(r.debrief_rating).toBe("inadequate");
    expect(r.headline).toContain("deficiencies");
  });

  it("returns insufficient_data headline for insufficient data", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ total_staff: 0 }));
    expect(r.headline).toContain("No active staff");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles single debrief correctly", () => {
    const debriefs = [makeDebrief({ id: "d1" })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(1);
    expect(r.completion_rate).toBe(100);
  });

  it("handles all debriefs overdue", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue" }),
      makeDebrief({ id: "d2", status: "overdue" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.overdue_debriefs).toBe(2);
    expect(r.completion_rate).toBe(0);
  });

  it("handles all debriefs declined", () => {
    const debriefs = [
      makeDebrief({ id: "d1", status: "declined" }),
      makeDebrief({ id: "d2", status: "declined" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.completion_rate).toBe(0);
  });

  it("handles follow_up_completed true when follow_up_needed is false", () => {
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_needed: false, follow_up_completed: true }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    // Should not count toward follow-up metrics since follow_up_needed is false
    expect(r.follow_up_completion_rate).toBe(0);
  });

  it("handles mixed emotional impact levels", () => {
    const debriefs = [
      makeDebrief({ id: "d1", emotional_impact: "low" }),
      makeDebrief({ id: "d2", emotional_impact: "moderate" }),
      makeDebrief({ id: "d3", emotional_impact: "high" }),
      makeDebrief({ id: "d4", emotional_impact: "significant" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.high_impact_count).toBe(2);
  });

  it("handles all wellbeing checks incomplete", () => {
    const checks = baseInput().wellbeing_checks.map((c) => ({
      ...c,
      check_completed: false,
    }));
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: checks }));
    expect(r.wellbeing_check_rate).toBe(0);
  });

  it("handles 1 staff member correctly", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ total_staff: 1 }));
    expect(r.debrief_rating).not.toBe("insufficient_data");
  });

  it("handles large numbers of debriefs", () => {
    const debriefs = Array.from({ length: 50 }, (_, i) =>
      makeDebrief({ id: `d${i}` }),
    );
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(50);
  });

  it("handles debriefs with zero staff_involved_count", () => {
    const debriefs = [makeDebrief({ id: "d1", staff_involved_count: 0 })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. SCORE CLAMPING
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("clamps score to minimum 0", () => {
    // Max negative: 52 + (-5) + (-5) + (-4) + (-5) + (-4) + (-5) = 24
    // Can't reach below 0 with current modifiers, but let's verify it doesn't go negative
    const debriefs = [
      makeDebrief({ id: "d1", status: "overdue", follow_up_needed: true, follow_up_completed: false, learning_points_count: 0, support_offered_count: 0 }),
      makeDebrief({ id: "d2", status: "overdue", follow_up_needed: true, follow_up_completed: false, learning_points_count: 0, support_offered_count: 0 }),
      makeDebrief({ id: "d3", status: "overdue", follow_up_needed: true, follow_up_completed: false, learning_points_count: 0, support_offered_count: 0 }),
    ];
    const checks = [
      makeWellbeingCheck({ id: "w1", check_completed: false }),
    ];
    const r = computeStaffDebriefEmotionalSupport({
      today: "2026-05-27",
      total_staff: 8,
      debriefs,
      wellbeing_checks: checks,
    });
    expect(r.debrief_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to maximum 100", () => {
    // Max positive: 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    // Can't exceed 100 with current modifiers, but verify
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.debrief_score).toBeLessThanOrEqual(100);
  });

  it("minimum possible score with all negative modifiers is still >= 0", () => {
    // 52 + (-5) + (-5) + (-4) + (-5) + (-4) + (-5) = 24
    const debriefs = Array.from({ length: 4 }, (_, i) =>
      makeDebrief({
        id: `d${i}`,
        status: "overdue",
        follow_up_needed: true,
        follow_up_completed: false,
        learning_points_count: 0,
        support_offered_count: 0,
      }),
    );
    const checks = [makeWellbeingCheck({ id: "w1", check_completed: false })];
    const r = computeStaffDebriefEmotionalSupport({
      today: "2026-05-27",
      total_staff: 8,
      debriefs,
      wellbeing_checks: checks,
    });
    // 52 + (-5) + (-5) + (-4) + (-5) + (-4) + (-5) = 24
    expect(r.debrief_score).toBe(24);
    expect(r.debrief_score).toBeGreaterThanOrEqual(0);
  });

  it("maximum possible score with all positive modifiers is 82", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    expect(r.debrief_score).toBe(82);
    expect(r.debrief_score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. PCT HELPER BEHAVIOUR
// ═══════════════════════════════════════════════════════════════════════════

describe("pct helper behaviour (via metrics)", () => {
  it("returns 0 when denominator is 0 (completion_rate with 0 debriefs)", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs: [] }));
    expect(r.completion_rate).toBe(0);
  });

  it("returns 0 when denominator is 0 (wellbeing_check_rate with 0 checks)", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput({ wellbeing_checks: [] }));
    expect(r.wellbeing_check_rate).toBe(0);
  });

  it("rounds to nearest integer", () => {
    // 1/3 = 33.33... should round to 33
    const debriefs = [
      makeDebrief({ id: "d1", status: "completed" }),
      makeDebrief({ id: "d2", status: "scheduled" }),
      makeDebrief({ id: "d3", status: "scheduled" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.completion_rate).toBe(33);
  });

  it("returns 100 when numerator equals denominator", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    expect(r.completion_rate).toBe(100);
    expect(r.wellbeing_check_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. COMBINED MODIFIER INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("combined modifier interactions", () => {
  it("stacks multiple negative modifiers correctly", () => {
    // Low completion, poor follow-up, overdue, no learning, no support, poor wellbeing
    const debriefs = [
      makeDebrief({
        id: "d1",
        status: "overdue",
        follow_up_needed: true,
        follow_up_completed: false,
        learning_points_count: 0,
        support_offered_count: 0,
      }),
      makeDebrief({
        id: "d2",
        status: "overdue",
        follow_up_needed: true,
        follow_up_completed: false,
        learning_points_count: 0,
        support_offered_count: 0,
      }),
    ];
    const checks = [
      makeWellbeingCheck({ id: "w1", check_completed: false }),
    ];
    const r = computeStaffDebriefEmotionalSupport({
      today: "2026-05-27",
      total_staff: 8,
      debriefs,
      wellbeing_checks: checks,
    });
    // mod1: 0/2=0% → -5; mod2: 0/2=0% → -5; mod3: 2/2=100% → -4;
    // mod4: 0/2=0% → -5; mod5: 0/2=0% → -4; mod6: 0/1=0% → -5
    // total: 52 - 5 - 5 - 4 - 5 - 4 - 5 = 24
    expect(r.debrief_score).toBe(24);
    expect(r.debrief_rating).toBe("inadequate");
  });

  it("stacks multiple positive modifiers correctly", () => {
    const r = computeStaffDebriefEmotionalSupport(baseInput());
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    expect(r.debrief_score).toBe(82);
    expect(r.debrief_rating).toBe("outstanding");
  });

  it("mixed positive and negative modifiers produce correct score", () => {
    // Good completion but poor follow-up and no checks
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d2", follow_up_needed: true, follow_up_completed: false }),
      makeDebrief({ id: "d3" }),
    ];
    // mod1: 3/3=100% → +5
    // mod2: 0/2=0% → -5
    // mod3: 0 overdue → +5
    // mod4: 3/3=100% → +5
    // mod5: 3/3=100% → +4
    // mod6: no checks → -1
    // total: 52 + 5 - 5 + 5 + 5 + 4 - 1 = 65 → good
    const r = computeStaffDebriefEmotionalSupport({
      today: "2026-05-27",
      total_staff: 8,
      debriefs,
      wellbeing_checks: [],
    });
    expect(r.debrief_score).toBe(65);
    expect(r.debrief_rating).toBe("good");
  });

  it("0 debriefs with no wellbeing checks", () => {
    // mod1: 0 debriefs → +2; mod2: none needed → +3; mod3: 0 debriefs → +2;
    // mod4: 0 debriefs → 0; mod5: 0 debriefs → 0; mod6: 0 checks → -1
    // total: 52 + 2 + 3 + 2 + 0 + 0 - 1 = 58 → adequate
    const r = computeStaffDebriefEmotionalSupport({
      today: "2026-05-27",
      total_staff: 8,
      debriefs: [],
      wellbeing_checks: [],
    });
    expect(r.debrief_score).toBe(58);
    expect(r.debrief_rating).toBe("adequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. DEBRIEF TYPE COVERAGE
// ═══════════════════════════════════════════════════════════════════════════

describe("debrief type coverage", () => {
  it("handles post_incident type debriefs", () => {
    const debriefs = [makeDebrief({ id: "d1", type: "post_incident" })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(1);
  });

  it("handles post_restraint type debriefs", () => {
    const debriefs = [makeDebrief({ id: "d1", type: "post_restraint" })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(1);
  });

  it("handles post_missing type debriefs", () => {
    const debriefs = [makeDebrief({ id: "d1", type: "post_missing" })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(1);
  });

  it("handles critical_event type debriefs", () => {
    const debriefs = [makeDebrief({ id: "d1", type: "critical_event" })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(1);
  });

  it("handles emotional_support type debriefs", () => {
    const debriefs = [makeDebrief({ id: "d1", type: "emotional_support" })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(1);
  });

  it("handles tci_reflection type debriefs", () => {
    const debriefs = [makeDebrief({ id: "d1", type: "tci_reflection" })];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(1);
  });

  it("processes mixed types without error", () => {
    const debriefs = [
      makeDebrief({ id: "d1", type: "post_incident" }),
      makeDebrief({ id: "d2", type: "post_restraint" }),
      makeDebrief({ id: "d3", type: "emotional_support" }),
      makeDebrief({ id: "d4", type: "tci_reflection" }),
    ];
    const r = computeStaffDebriefEmotionalSupport(baseInput({ debriefs }));
    expect(r.total_debriefs).toBe(4);
  });

  it("all types contribute equally to metrics", () => {
    const type1 = [makeDebrief({ id: "d1", type: "post_incident" })];
    const type2 = [makeDebrief({ id: "d1", type: "tci_reflection" })];
    const r1 = computeStaffDebriefEmotionalSupport(baseInput({ debriefs: type1 }));
    const r2 = computeStaffDebriefEmotionalSupport(baseInput({ debriefs: type2 }));
    expect(r1.debrief_score).toBe(r2.debrief_score);
    expect(r1.completion_rate).toBe(r2.completion_rate);
  });
});
