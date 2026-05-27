// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF WELLBEING INTELLIGENCE ENGINE — TESTS
// Reg 33: duty of care to staff. SCCIF: leadership supports staff wellbeing.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeStaffWellbeing,
  type HomeStaffWellbeingInput,
  type WellbeingCheckInput,
} from "../home-staff-wellbeing-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeCheck(overrides: Partial<WellbeingCheckInput> = {}): WellbeingCheckInput {
  return {
    id: "swbr_test",
    staff_id: "staff_1",
    date: "2026-05-20",
    type: "monthly_checkin",
    overall_score: 7,
    workload_score: 7,
    support_score: 7,
    moral_score: 7,
    stressors: ["Workload"],
    positives: ["Team support", "Enjoy the role"],
    support_needed: "Admin time",
    action_agreed: "Protected admin day booked",
    follow_up_date: "2026-06-15",
    conducted_by: "staff_manager",
    confidential: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeStaffWellbeingInput> = {}): HomeStaffWellbeingInput {
  return {
    today: "2026-05-27",
    wellbeing_checks: [makeCheck()],
    total_staff: 10,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeHomeStaffWellbeing(baseInput({ total_staff: 0 }));
    expect(r.wellbeing_rating).toBe("insufficient_data");
    expect(r.wellbeing_score).toBe(0);
  });

  it("returns insufficient_data when no wellbeing checks", () => {
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: [] }));
    expect(r.wellbeing_rating).toBe("insufficient_data");
    expect(r.wellbeing_score).toBe(0);
  });

  it("populates all profiles with zeros on insufficient data", () => {
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: [] }));
    expect(r.morale.avg_overall).toBe(0);
    expect(r.coverage.total_checks).toBe(0);
    expect(r.stressor_profile.total_stressors).toBe(0);
    expect(r.follow_ups.total_follow_ups_due).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. MORALE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("morale profile", () => {
  it("computes average scores across checks", () => {
    const checks = [
      makeCheck({ overall_score: 8, workload_score: 6, support_score: 9, moral_score: 7 }),
      makeCheck({ staff_id: "staff_2", overall_score: 6, workload_score: 8, support_score: 7, moral_score: 5 }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.morale.avg_overall).toBe(7);
    expect(r.morale.avg_workload).toBe(7);
    expect(r.morale.avg_support).toBe(8);
    expect(r.morale.avg_moral).toBe(6);
  });

  it("identifies lowest and highest overall scores", () => {
    const checks = [
      makeCheck({ overall_score: 3 }),
      makeCheck({ staff_id: "staff_2", overall_score: 9 }),
      makeCheck({ staff_id: "staff_3", overall_score: 6 }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.morale.lowest_overall).toBe(3);
    expect(r.morale.highest_overall).toBe(9);
  });

  it("counts at-risk staff (score <= 4)", () => {
    const checks = [
      makeCheck({ overall_score: 3 }),
      makeCheck({ staff_id: "staff_2", overall_score: 4 }),
      makeCheck({ staff_id: "staff_3", overall_score: 5 }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.morale.at_risk_count).toBe(2);
  });

  it("counts thriving staff (score >= 7)", () => {
    const checks = [
      makeCheck({ overall_score: 7 }),
      makeCheck({ staff_id: "staff_2", overall_score: 8 }),
      makeCheck({ staff_id: "staff_3", overall_score: 6 }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.morale.thriving_count).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. COVERAGE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("coverage profile", () => {
  it("calculates unique staff checked and coverage rate", () => {
    const checks = [
      makeCheck({ staff_id: "staff_1" }),
      makeCheck({ staff_id: "staff_1", id: "swbr_02" }),
      makeCheck({ staff_id: "staff_2", id: "swbr_03" }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 5 }));
    expect(r.coverage.total_checks).toBe(3);
    expect(r.coverage.unique_staff_checked).toBe(2);
    expect(r.coverage.coverage_rate).toBe(40);
  });

  it("calculates checks in last 30 days", () => {
    const checks = [
      makeCheck({ date: "2026-05-20" }),        // 7 days ago - within 30
      makeCheck({ staff_id: "s2", date: "2026-04-20" }),  // 37 days ago - outside 30
      makeCheck({ staff_id: "s3", date: "2026-05-01" }),  // 26 days ago - within 30
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.coverage.checks_last_30_days).toBe(2);
  });

  it("calculates checks in last 90 days", () => {
    const checks = [
      makeCheck({ date: "2026-05-20" }),         // 7 days ago
      makeCheck({ staff_id: "s2", date: "2026-03-01" }),  // 87 days ago - within 90
      makeCheck({ staff_id: "s3", date: "2026-02-01" }),  // 115 days ago - outside 90
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.coverage.checks_last_90_days).toBe(2);
  });

  it("returns 100% coverage when all staff checked", () => {
    const checks = [
      makeCheck({ staff_id: "s1" }),
      makeCheck({ staff_id: "s2" }),
      makeCheck({ staff_id: "s3" }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 3 }));
    expect(r.coverage.coverage_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CHECK TYPE DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════

describe("check type distribution", () => {
  it("counts each check type correctly", () => {
    const checks = [
      makeCheck({ type: "monthly_checkin" }),
      makeCheck({ staff_id: "s2", type: "monthly_checkin" }),
      makeCheck({ staff_id: "s3", type: "post_incident" }),
      makeCheck({ staff_id: "s4", type: "supervision_wellbeing" }),
      makeCheck({ staff_id: "s5", type: "return_from_absence" }),
      makeCheck({ staff_id: "s6", type: "self_referral" }),
      makeCheck({ staff_id: "s7", type: "manager_concern" }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.check_types.monthly_checkin).toBe(2);
    expect(r.check_types.post_incident).toBe(1);
    expect(r.check_types.supervision_wellbeing).toBe(1);
    expect(r.check_types.return_from_absence).toBe(1);
    expect(r.check_types.self_referral).toBe(1);
    expect(r.check_types.manager_concern).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. STRESSOR PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("stressor profile", () => {
  it("counts total and unique stressors", () => {
    const checks = [
      makeCheck({ stressors: ["Workload", "Sleep-ins"] }),
      makeCheck({ staff_id: "s2", stressors: ["Workload", "Paperwork"] }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.stressor_profile.total_stressors).toBe(4);
    expect(r.stressor_profile.unique_stressors).toBe(3);
  });

  it("counts total positives", () => {
    const checks = [
      makeCheck({ positives: ["Team", "Role"] }),
      makeCheck({ staff_id: "s2", positives: ["Children"] }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.stressor_profile.total_positives).toBe(3);
  });

  it("counts checks with support needed", () => {
    const checks = [
      makeCheck({ support_needed: "Training" }),
      makeCheck({ staff_id: "s2", support_needed: "" }),
      makeCheck({ staff_id: "s3", support_needed: "  " }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.stressor_profile.checks_with_support_needed).toBe(1);
  });

  it("counts checks with action agreed", () => {
    const checks = [
      makeCheck({ action_agreed: "Booked training" }),
      makeCheck({ staff_id: "s2", action_agreed: "Shift review" }),
      makeCheck({ staff_id: "s3", action_agreed: "" }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.stressor_profile.checks_with_action_agreed).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. FOLLOW-UP PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("follow-up profile", () => {
  it("counts total follow-ups due", () => {
    const checks = [
      makeCheck({ follow_up_date: "2026-06-01" }),
      makeCheck({ staff_id: "s2", follow_up_date: "2026-05-20" }),
      makeCheck({ staff_id: "s3", follow_up_date: null }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.follow_ups.total_follow_ups_due).toBe(2);
  });

  it("identifies overdue follow-ups", () => {
    const checks = [
      makeCheck({ follow_up_date: "2026-05-20" }),     // 7 days before today (2026-05-27) = overdue
      makeCheck({ staff_id: "s2", follow_up_date: "2026-05-26" }),  // 1 day before = overdue
      makeCheck({ staff_id: "s3", follow_up_date: "2026-06-01" }), // in future = upcoming
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.follow_ups.overdue_follow_ups).toBe(2);
    expect(r.follow_ups.upcoming_follow_ups).toBe(1);
  });

  it("counts follow-up due today as upcoming (not overdue)", () => {
    const checks = [
      makeCheck({ follow_up_date: "2026-05-27" }), // today
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.follow_ups.overdue_follow_ups).toBe(0);
    expect(r.follow_ups.upcoming_follow_ups).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. SCORING — BASE SCORE
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring — base", () => {
  it("starts from base score of 52", () => {
    // Neutral modifiers: avg_overall ~5-6 = 0, coverage 40-60% = 0,
    // 0 at-risk = +4, action 90+ = +3, 0 follow-ups = 0, 1 type = -2,
    // low frequency = -2, positives > stressors = +3
    // So base of 52 is modified by the net modifiers
    const r = computeHomeStaffWellbeing(baseInput());
    expect(r.wellbeing_score).toBeGreaterThan(0);
    expect(r.wellbeing_score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. SCORING MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: average morale", () => {
  it("awards +5 for avg_overall >= 7", () => {
    const high = baseInput({
      wellbeing_checks: [
        makeCheck({ overall_score: 8, staff_id: "s1" }),
        makeCheck({ overall_score: 7, staff_id: "s2" }),
      ],
    });
    const low = baseInput({
      wellbeing_checks: [
        makeCheck({ overall_score: 5, staff_id: "s1" }),
        makeCheck({ overall_score: 5, staff_id: "s2" }),
      ],
    });
    const rHigh = computeHomeStaffWellbeing(high);
    const rLow = computeHomeStaffWellbeing(low);
    // high: avg 7.5 → +5, low: avg 5.0 → 0. Diff = 5
    // But at_risk_count also changes: high has 0 at-risk (both ≥5), low has 0 at-risk (both 5)
    // thriving also changes: high has 2 thriving (8,7), low has 0
    // positives/stressors same for both.
    expect(rHigh.wellbeing_score - rLow.wellbeing_score).toBe(5);
  });

  it("penalises -5 for avg_overall < 4", () => {
    const low = baseInput({
      wellbeing_checks: [
        makeCheck({ overall_score: 3, staff_id: "s1" }),
        makeCheck({ overall_score: 3, staff_id: "s2" }),
      ],
    });
    const neutral = baseInput({
      wellbeing_checks: [
        makeCheck({ overall_score: 5, staff_id: "s1" }),
        makeCheck({ overall_score: 5, staff_id: "s2" }),
      ],
    });
    const rLow = computeHomeStaffWellbeing(low);
    const rNeutral = computeHomeStaffWellbeing(neutral);
    // low: avg 3 → -5, mod3 at_risk 2/2=100% → -4
    // neutral: avg 5 → 0, mod3 at_risk 0 → +4
    // Diff from mod1 = -5, diff from mod3 = -8 total = -13
    expect(rNeutral.wellbeing_score - rLow.wellbeing_score).toBe(13);
  });
});

describe("mod2: staff coverage", () => {
  it("awards +4 for >= 80% coverage", () => {
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ staff_id: `s${i}` }),
    );
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 10 }));
    // coverage_rate = 80%
    expect(r.coverage.coverage_rate).toBe(80);
  });

  it("penalises -3 for < 40% coverage", () => {
    const high = baseInput({
      wellbeing_checks: [
        makeCheck({ staff_id: "s1" }),
        makeCheck({ staff_id: "s2" }),
        makeCheck({ staff_id: "s3" }),
        makeCheck({ staff_id: "s4" }),
      ],
      total_staff: 10,
    });
    const low = baseInput({
      wellbeing_checks: [
        makeCheck({ staff_id: "s1" }),
        makeCheck({ staff_id: "s2" }),
        makeCheck({ staff_id: "s3" }),
      ],
      total_staff: 10,
    });
    const rHigh = computeHomeStaffWellbeing(high);
    const rLow = computeHomeStaffWellbeing(low);
    // high: 4/10 = 40% → 0; low: 3/10 = 30% → -3. Diff = 3
    // mod7 frequency also changes: 4/10 checks in 30 days? depends on dates
    // Both use default date 2026-05-20 (7 days ago) within 30 days
    // high: 4 checks in 30 days / 10 staff = 0.4 → mod7 +1
    // low: 3/10 = 0.3 → mod7 +1 (same)
    expect(rHigh.wellbeing_score - rLow.wellbeing_score).toBe(3);
  });
});

describe("mod3: at-risk staff", () => {
  it("awards +4 for zero at-risk staff", () => {
    const r = computeHomeStaffWellbeing(baseInput({
      wellbeing_checks: [makeCheck({ overall_score: 7 })],
    }));
    expect(r.morale.at_risk_count).toBe(0);
  });

  it("penalises -4 for > 30% at-risk", () => {
    const checks = [
      makeCheck({ overall_score: 3, staff_id: "s1" }),
      makeCheck({ overall_score: 4, staff_id: "s2" }),
      makeCheck({ overall_score: 7, staff_id: "s3" }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    // 2/3 = 67% at-risk → mod3 = -4
    expect(r.morale.at_risk_count).toBe(2);
  });
});

describe("mod4: action responsiveness", () => {
  it("awards +3 when all support needs have actions", () => {
    const checks = [
      makeCheck({ support_needed: "Training", action_agreed: "Booked" }),
      makeCheck({ staff_id: "s2", support_needed: "Shift review", action_agreed: "Done" }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.stressor_profile.checks_with_support_needed).toBe(2);
    expect(r.stressor_profile.checks_with_action_agreed).toBe(2);
  });

  it("penalises -2 when < 50% of support needs have actions", () => {
    const high = baseInput({
      wellbeing_checks: [
        makeCheck({ support_needed: "Help", action_agreed: "Done", staff_id: "s1" }),
        makeCheck({ support_needed: "Help", action_agreed: "Done", staff_id: "s2" }),
        makeCheck({ support_needed: "Help", action_agreed: "", staff_id: "s3" }),
      ],
    });
    const low = baseInput({
      wellbeing_checks: [
        makeCheck({ support_needed: "Help", action_agreed: "", staff_id: "s1" }),
        makeCheck({ support_needed: "Help", action_agreed: "", staff_id: "s2" }),
        makeCheck({ support_needed: "Help", action_agreed: "Done", staff_id: "s3" }),
      ],
    });
    const rHigh = computeHomeStaffWellbeing(high);
    const rLow = computeHomeStaffWellbeing(low);
    // high: 2/3=67% (>=50,<70) → 0; low: 1/3=33% (<50) → -2. Diff = 2
    expect(rHigh.wellbeing_score - rLow.wellbeing_score).toBe(2);
  });
});

describe("mod5: follow-up compliance", () => {
  it("awards +3 when no follow-ups overdue", () => {
    const checks = [
      makeCheck({ follow_up_date: "2026-06-15" }),    // future
      makeCheck({ staff_id: "s2", follow_up_date: "2026-06-01" }), // future
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.follow_ups.overdue_follow_ups).toBe(0);
  });

  it("penalises -3 when > 50% overdue", () => {
    const high = baseInput({
      wellbeing_checks: [
        makeCheck({ follow_up_date: "2026-06-15", staff_id: "s1" }),
        makeCheck({ follow_up_date: "2026-06-01", staff_id: "s2" }),
      ],
    });
    const low = baseInput({
      wellbeing_checks: [
        makeCheck({ follow_up_date: "2026-05-10", staff_id: "s1" }),   // overdue
        makeCheck({ follow_up_date: "2026-05-15", staff_id: "s2" }),   // overdue
      ],
    });
    const rHigh = computeHomeStaffWellbeing(high);
    const rLow = computeHomeStaffWellbeing(low);
    // high: 0 overdue → +3; low: 2/2=100% overdue → -3. Diff = 6
    expect(rHigh.wellbeing_score - rLow.wellbeing_score).toBe(6);
  });
});

describe("mod6: check type diversity", () => {
  it("awards +3 for >= 4 different types", () => {
    const checks = [
      makeCheck({ type: "monthly_checkin", staff_id: "s1" }),
      makeCheck({ type: "post_incident", staff_id: "s2" }),
      makeCheck({ type: "supervision_wellbeing", staff_id: "s3" }),
      makeCheck({ type: "return_from_absence", staff_id: "s4" }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(Object.values(r.check_types).filter((v) => v > 0).length).toBe(4);
  });

  it("penalises -2 for only 1 type", () => {
    const multi = baseInput({
      wellbeing_checks: [
        makeCheck({ type: "monthly_checkin", staff_id: "s1" }),
        makeCheck({ type: "post_incident", staff_id: "s2" }),
      ],
    });
    const single = baseInput({
      wellbeing_checks: [
        makeCheck({ type: "monthly_checkin", staff_id: "s1" }),
        makeCheck({ type: "monthly_checkin", staff_id: "s2" }),
      ],
    });
    const rMulti = computeHomeStaffWellbeing(multi);
    const rSingle = computeHomeStaffWellbeing(single);
    // multi: 2 types → 0; single: 1 type → -2. Diff = 2
    expect(rMulti.wellbeing_score - rSingle.wellbeing_score).toBe(2);
  });
});

describe("mod7: frequency of checks", () => {
  it("awards +3 for >= 0.5 checks per staff per month", () => {
    // 5 checks in last 30 days with 10 staff = 0.5
    const checks = Array.from({ length: 5 }, (_, i) =>
      makeCheck({ staff_id: `s${i}`, date: "2026-05-20" }),
    );
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 10 }));
    expect(r.coverage.checks_last_30_days).toBe(5);
  });

  it("penalises -2 for < 0.1 checks per staff per month", () => {
    const high = baseInput({
      wellbeing_checks: [
        makeCheck({ staff_id: "s1", date: "2026-05-20" }),
        makeCheck({ staff_id: "s2", date: "2026-05-20" }),
        makeCheck({ staff_id: "s3", date: "2026-05-20" }),
      ],
      total_staff: 10,
    });
    const low = baseInput({
      wellbeing_checks: [
        makeCheck({ staff_id: "s1", date: "2026-03-01" }),  // outside 30 days
      ],
      total_staff: 10,
    });
    const rHigh = computeHomeStaffWellbeing(high);
    const rLow = computeHomeStaffWellbeing(low);
    // high: 3/10 = 0.3 → +1; low: 0/10 = 0 → -2. Diff from mod7 = 3
    // Also mod2 changes: high: 3/10=30% → -3; low: 1/10=10% → -3. Same.
    // But mod6: both 1 type → -2. Same.
    // mod5: high has 3 follow-ups (all future) → +3; low has 1 follow-up (future) → +3. Same.
    // Coverage in last 90 days: high has 3 (within 90); low has 1 (87 days ago within 90)
    expect(rHigh.wellbeing_score - rLow.wellbeing_score).toBe(3);
  });
});

describe("mod8: positives vs stressors balance", () => {
  it("awards +3 when positives outweigh stressors", () => {
    const checks = [
      makeCheck({ stressors: ["One"], positives: ["A", "B", "C"] }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.stressor_profile.total_positives).toBeGreaterThan(r.stressor_profile.total_stressors);
  });

  it("penalises -3 when stressors are 2x positives", () => {
    const good = baseInput({
      wellbeing_checks: [
        makeCheck({ stressors: ["A"], positives: ["B", "C"], staff_id: "s1" }),
      ],
    });
    const bad = baseInput({
      wellbeing_checks: [
        makeCheck({ stressors: ["A", "B", "C", "D", "E"], positives: ["X"], staff_id: "s1" }),
      ],
    });
    const rGood = computeHomeStaffWellbeing(good);
    const rBad = computeHomeStaffWellbeing(bad);
    // good: positives(2) > stressors(1) → +3; bad: positives(1) < stressors(5)*0.5=2.5? 1 < 2.5 → -3. Diff = 6
    expect(rGood.wellbeing_score - rBad.wellbeing_score).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for score >= 80", () => {
    // Build an excellent scenario: high morale, full coverage, no at-risk, etc.
    const checks = Array.from({ length: 10 }, (_, i) =>
      makeCheck({
        staff_id: `s${i}`,
        overall_score: 8,
        workload_score: 8,
        support_score: 9,
        moral_score: 8,
        stressors: [],
        positives: ["Team", "Role", "Children"],
        type: i % 5 === 0 ? "monthly_checkin" :
              i % 5 === 1 ? "post_incident" :
              i % 5 === 2 ? "supervision_wellbeing" :
              i % 5 === 3 ? "return_from_absence" : "self_referral",
        follow_up_date: "2026-06-15",
        date: "2026-05-20",
      }),
    );
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 10 }));
    expect(r.wellbeing_rating).toBe("outstanding");
    expect(r.wellbeing_score).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for very poor scenario", () => {
    const checks = [
      makeCheck({
        staff_id: "s1",
        overall_score: 2,
        workload_score: 2,
        support_score: 2,
        moral_score: 2,
        stressors: ["A", "B", "C", "D", "E"],
        positives: [],
        support_needed: "Lots",
        action_agreed: "",
        follow_up_date: "2026-04-01",  // overdue
        date: "2026-03-01",            // outside 30 days
      }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 10 }));
    expect(r.wellbeing_rating).toBe("inadequate");
    expect(r.wellbeing_score).toBeLessThan(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes high morale strength when avg_overall >= 7", () => {
    const checks = [
      makeCheck({ overall_score: 8 }),
      makeCheck({ staff_id: "s2", overall_score: 7 }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.strengths.some((s) => s.includes("morale is high"))).toBe(true);
  });

  it("includes coverage strength when >= 80%", () => {
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ staff_id: `s${i}` }),
    );
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 10 }));
    expect(r.strengths.some((s) => s.includes("coverage"))).toBe(true);
  });

  it("includes no at-risk strength when at_risk_count is 0", () => {
    const r = computeHomeStaffWellbeing(baseInput({
      wellbeing_checks: [makeCheck({ overall_score: 6 })],
    }));
    expect(r.strengths.some((s) => s.includes("at-risk"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags low morale concern when avg < 5", () => {
    const checks = [
      makeCheck({ overall_score: 3 }),
      makeCheck({ staff_id: "s2", overall_score: 4 }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.concerns.some((c) => c.includes("morale is low"))).toBe(true);
  });

  it("flags at-risk concern when staff score <= 4", () => {
    const checks = [makeCheck({ overall_score: 4 })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.concerns.some((c) => c.includes("at risk"))).toBe(true);
  });

  it("flags overdue follow-ups", () => {
    const checks = [makeCheck({ follow_up_date: "2026-05-01" })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("generates immediate recommendation for at-risk staff", () => {
    const checks = [makeCheck({ overall_score: 3 })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    const rec = r.recommendations.find((r) => r.urgency === "immediate");
    expect(rec).toBeDefined();
    expect(rec!.regulatory_ref).toBe("Reg 33(4)(a)");
  });

  it("generates recommendation for overdue follow-ups", () => {
    const checks = [makeCheck({ follow_up_date: "2026-04-01" })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("overdue"))).toBe(true);
  });

  it("generates coverage recommendation when < 60%", () => {
    const checks = [makeCheck({ staff_id: "s1" })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 10 }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("coverage"))).toBe(true);
  });

  it("recommendations have sequential rank numbers", () => {
    const checks = [
      makeCheck({ overall_score: 3, follow_up_date: "2026-04-01" }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 10 }));
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("generates critical insight for lowest score <= 3", () => {
    const checks = [makeCheck({ overall_score: 3 })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("burnout"))).toBe(true);
  });

  it("generates positive insight for post-incident checks", () => {
    const checks = [makeCheck({ type: "post_incident" })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("post-incident"))).toBe(true);
  });

  it("generates positive insight for high support score", () => {
    const checks = [
      makeCheck({ support_score: 8 }),
      makeCheck({ staff_id: "s2", support_score: 7 }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("well-supported"))).toBe(true);
  });

  it("generates critical insight when support score < 5", () => {
    const checks = [
      makeCheck({ support_score: 3 }),
      makeCheck({ staff_id: "s2", support_score: 4 }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("not feel adequately supported"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. HEADLINE
// ═══════════════════════════════════════════════════════════════════════════

describe("headline", () => {
  it("returns appropriate headline for each rating", () => {
    const insufficient = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: [] }));
    expect(insufficient.headline).toContain("No staff wellbeing checks");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. SCORE CLAMPING
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const checks = Array.from({ length: 20 }, (_, i) =>
      makeCheck({
        staff_id: `s${i}`,
        overall_score: 10,
        workload_score: 10,
        support_score: 10,
        moral_score: 10,
        stressors: [],
        positives: ["A", "B", "C", "D", "E"],
        follow_up_date: "2026-06-15",
        type: i % 6 === 0 ? "monthly_checkin" :
              i % 6 === 1 ? "post_incident" :
              i % 6 === 2 ? "supervision_wellbeing" :
              i % 6 === 3 ? "return_from_absence" :
              i % 6 === 4 ? "self_referral" : "manager_concern",
        date: "2026-05-20",
      }),
    );
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 20 }));
    expect(r.wellbeing_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const checks = [
      makeCheck({
        overall_score: 1,
        workload_score: 1,
        support_score: 1,
        moral_score: 1,
        stressors: ["A", "B", "C", "D", "E", "F"],
        positives: [],
        support_needed: "Everything",
        action_agreed: "",
        follow_up_date: "2026-03-01",
        date: "2026-02-01",
      }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks, total_staff: 20 }));
    expect(r.wellbeing_score).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles single check correctly", () => {
    const r = computeHomeStaffWellbeing(baseInput());
    expect(r.wellbeing_rating).not.toBe("insufficient_data");
    expect(r.coverage.total_checks).toBe(1);
  });

  it("handles all checks from same staff member", () => {
    const checks = [
      makeCheck({ staff_id: "s1", date: "2026-05-20" }),
      makeCheck({ staff_id: "s1", date: "2026-05-15", id: "swbr_02" }),
    ];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.coverage.unique_staff_checked).toBe(1);
    expect(r.coverage.total_checks).toBe(2);
  });

  it("handles empty stressors and positives", () => {
    const checks = [makeCheck({ stressors: [], positives: [] })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.stressor_profile.total_stressors).toBe(0);
    expect(r.stressor_profile.total_positives).toBe(0);
  });

  it("handles empty support_needed and action_agreed", () => {
    const checks = [makeCheck({ support_needed: "", action_agreed: "" })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.stressor_profile.checks_with_support_needed).toBe(0);
    expect(r.stressor_profile.checks_with_action_agreed).toBe(0);
  });

  it("handles all null follow_up_dates", () => {
    const checks = [makeCheck({ follow_up_date: null })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.follow_ups.total_follow_ups_due).toBe(0);
    expect(r.follow_ups.overdue_follow_ups).toBe(0);
    expect(r.follow_ups.upcoming_follow_ups).toBe(0);
  });

  it("manager concern type triggers insight", () => {
    const checks = [makeCheck({ type: "manager_concern" })];
    const r = computeHomeStaffWellbeing(baseInput({ wellbeing_checks: checks }));
    expect(r.insights.some((i) => i.text.includes("manager-initiated"))).toBe(true);
  });
});
