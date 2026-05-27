import { describe, it, expect } from "vitest";
import {
  computeHomeShiftPattern,
  type HomeShiftPatternInput,
  type ShiftInput,
  type ShiftSwapInput,
} from "../home-shift-pattern-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeShift(overrides: Partial<ShiftInput> = {}): ShiftInput {
  return {
    id: "shift_1",
    staff_id: "staff_1",
    date: "2026-05-26",
    shift_type: "day",
    start_time: "08:00",
    end_time: "17:00",
    actual_start: "08:00",
    actual_end: "17:00",
    overtime_minutes: 0,
    status: "completed",
    is_open_shift: false,
    ...overrides,
  };
}

function makeSwap(overrides: Partial<ShiftSwapInput> = {}): ShiftSwapInput {
  return {
    id: "swap_1",
    requester_id: "staff_1",
    target_staff_id: "staff_2",
    status: "pending",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeShiftPatternInput> = {}): HomeShiftPatternInput {
  return {
    today: "2026-05-27",
    shifts: [makeShift()],
    shift_swaps: [],
    total_staff: 8,
    ...overrides,
  };
}

// ── Insufficient Data ───────────────────────────────────────────────────────

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeHomeShiftPattern(baseInput({ total_staff: 0 }));
    expect(r.shift_rating).toBe("insufficient_data");
    expect(r.shift_score).toBe(0);
  });

  it("returns insufficient_data when shifts array is empty", () => {
    const r = computeHomeShiftPattern(baseInput({ shifts: [] }));
    expect(r.shift_rating).toBe("insufficient_data");
    expect(r.shift_score).toBe(0);
  });

  it("returns empty arrays for all narrative fields", () => {
    const r = computeHomeShiftPattern(baseInput({ shifts: [] }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });
});

// ── Coverage Profile ────────────────────────────────────────────────────────

describe("coverage profile", () => {
  it("counts shifts by status", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", status: "completed" }),
        makeShift({ id: "s2", status: "in_progress" }),
        makeShift({ id: "s3", status: "scheduled" }),
        makeShift({ id: "s4", status: "scheduled" }),
      ],
    }));
    expect(r.coverage.completed_shifts).toBe(1);
    expect(r.coverage.in_progress_shifts).toBe(1);
    expect(r.coverage.scheduled_shifts).toBe(2);
    expect(r.coverage.total_shifts).toBe(4);
  });

  it("counts open shifts", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", is_open_shift: false }),
        makeShift({ id: "s2", is_open_shift: true, staff_id: "" }),
        makeShift({ id: "s3", is_open_shift: true, staff_id: "" }),
      ],
    }));
    expect(r.coverage.open_shifts).toBe(2);
    expect(r.coverage.open_shift_rate).toBe(67);
  });

  it("counts unique staff working", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", staff_id: "staff_a" }),
        makeShift({ id: "s2", staff_id: "staff_b" }),
        makeShift({ id: "s3", staff_id: "staff_a" }),
        makeShift({ id: "s4", staff_id: "" }), // open shift
      ],
    }));
    expect(r.coverage.unique_staff_working).toBe(2);
  });

  it("counts day and sleep-in shifts", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", shift_type: "day" }),
        makeShift({ id: "s2", shift_type: "day" }),
        makeShift({ id: "s3", shift_type: "sleep_in" }),
      ],
    }));
    expect(r.coverage.day_shifts).toBe(2);
    expect(r.coverage.sleep_in_shifts).toBe(1);
  });
});

// ── Punctuality Profile ─────────────────────────────────────────────────────

describe("punctuality profile", () => {
  it("calculates on-time rate (within 5 min)", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", start_time: "08:00", actual_start: "08:00" }), // on time
        makeShift({ id: "s2", start_time: "08:00", actual_start: "07:58" }), // 2 min early = on time
        makeShift({ id: "s3", start_time: "08:00", actual_start: "08:04" }), // 4 min late = on time
        makeShift({ id: "s4", start_time: "08:00", actual_start: "08:10" }), // 10 min late
      ],
    }));
    expect(r.punctuality.on_time_count).toBe(3);
    expect(r.punctuality.on_time_rate).toBe(75);
    expect(r.punctuality.late_count).toBe(1);
  });

  it("calculates average delay", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", start_time: "08:00", actual_start: "08:05" }), // +5
        makeShift({ id: "s2", start_time: "10:00", actual_start: "10:00" }), // 0
        makeShift({ id: "s3", start_time: "07:00", actual_start: "06:58" }), // -2
      ],
    }));
    // avg = (5 + 0 + -2) / 3 = 1.0
    expect(r.punctuality.avg_delay_minutes).toBe(1);
  });

  it("counts early arrivals", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", start_time: "08:00", actual_start: "07:50" }), // -10 = early
        makeShift({ id: "s2", start_time: "08:00", actual_start: "07:55" }), // -5 = on time
      ],
    }));
    expect(r.punctuality.early_count).toBe(1);
  });

  it("excludes shifts without actual_start", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", actual_start: "08:00" }),
        makeShift({ id: "s2", actual_start: null }),
        makeShift({ id: "s3", actual_start: "" }),
      ],
    }));
    expect(r.punctuality.shifts_with_actual_start).toBe(1);
  });
});

// ── Overtime Profile ────────────────────────────────────────────────────────

describe("overtime profile", () => {
  it("calculates total and average overtime", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", overtime_minutes: 15 }),
        makeShift({ id: "s2", overtime_minutes: 0 }),
        makeShift({ id: "s3", overtime_minutes: 30, status: "in_progress" }),
      ],
    }));
    expect(r.overtime.total_overtime_minutes).toBe(45);
    // completed (2) + in_progress (1) = 3, so avg = 45/3 = 15
    expect(r.overtime.avg_overtime_per_shift).toBe(15);
    expect(r.overtime.shifts_with_overtime).toBe(2);
    expect(r.overtime.overtime_rate).toBe(67);
  });
});

// ── Workload Profile ────────────────────────────────────────────────────────

describe("workload profile", () => {
  it("calculates staff shift counts", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", staff_id: "staff_a" }),
        makeShift({ id: "s2", staff_id: "staff_a" }),
        makeShift({ id: "s3", staff_id: "staff_a" }),
        makeShift({ id: "s4", staff_id: "staff_b" }),
      ],
    }));
    expect(r.workload.max_shifts_per_staff).toBe(3);
    expect(r.workload.min_shifts_per_staff).toBe(1);
    expect(r.workload.fairness_ratio).toBeCloseTo(0.33, 1);
  });

  it("sorts staff by shift count descending", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", staff_id: "staff_a" }),
        makeShift({ id: "s2", staff_id: "staff_b" }),
        makeShift({ id: "s3", staff_id: "staff_b" }),
      ],
    }));
    expect(r.workload.staff_shift_counts[0].staff_id).toBe("staff_b");
  });

  it("handles single staff correctly", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", staff_id: "staff_a" }),
        makeShift({ id: "s2", staff_id: "staff_a" }),
      ],
    }));
    expect(r.workload.fairness_ratio).toBe(1);
    expect(r.workload.max_shifts_per_staff).toBe(2);
    expect(r.workload.min_shifts_per_staff).toBe(2);
  });

  it("excludes open shifts (empty staff_id) from workload counts", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", staff_id: "staff_a" }),
        makeShift({ id: "s2", staff_id: "", is_open_shift: true }),
      ],
    }));
    expect(r.workload.staff_shift_counts).toHaveLength(1);
  });
});

// ── Swap Profile ────────────────────────────────────────────────────────────

describe("swap profile", () => {
  it("counts swap statuses", () => {
    const r = computeHomeShiftPattern(baseInput({
      shift_swaps: [
        makeSwap({ id: "sw1", status: "pending" }),
        makeSwap({ id: "sw2", status: "approved" }),
        makeSwap({ id: "sw3", status: "rejected" }),
      ],
    }));
    expect(r.swaps.total_swaps).toBe(3);
    expect(r.swaps.pending_swaps).toBe(1);
    expect(r.swaps.approved_swaps).toBe(1);
    expect(r.swaps.rejected_swaps).toBe(1);
  });

  it("calculates resolution rate", () => {
    const r = computeHomeShiftPattern(baseInput({
      shift_swaps: [
        makeSwap({ id: "sw1", status: "pending" }),
        makeSwap({ id: "sw2", status: "approved" }),
        makeSwap({ id: "sw3", status: "approved" }),
      ],
    }));
    // 2 resolved / 3 total = 67%
    expect(r.swaps.resolution_rate).toBe(67);
  });
});

// ── Rating Thresholds ───────────────────────────────────────────────────────

describe("rating thresholds", () => {
  it("rates outstanding at score >= 80", () => {
    const r = computeHomeShiftPattern(baseInput({
      total_staff: 8,
      shifts: [
        makeShift({ id: "s1", staff_id: "staff_a", status: "completed", shift_type: "day" }),
        makeShift({ id: "s2", staff_id: "staff_b", status: "completed", shift_type: "day" }),
        makeShift({ id: "s3", staff_id: "staff_c", status: "completed", shift_type: "day" }),
        makeShift({ id: "s4", staff_id: "staff_d", status: "completed", shift_type: "sleep_in", actual_start: null, actual_end: null }),
        makeShift({ id: "s5", staff_id: "staff_e", status: "completed", shift_type: "day" }),
        makeShift({ id: "s6", staff_id: "staff_f", status: "completed", shift_type: "day" }),
        makeShift({ id: "s7", staff_id: "staff_g", status: "completed", shift_type: "sleep_in", actual_start: null, actual_end: null }),
      ],
      shift_swaps: [],
    }));
    expect(r.shift_score).toBeGreaterThanOrEqual(80);
    expect(r.shift_rating).toBe("outstanding");
  });

  it("rates inadequate at score < 45", () => {
    const r = computeHomeShiftPattern(baseInput({
      total_staff: 20,
      shifts: [
        makeShift({ id: "s1", staff_id: "staff_a", status: "scheduled", is_open_shift: true, actual_start: null, actual_end: null, shift_type: "day" }),
        makeShift({ id: "s2", staff_id: "", status: "scheduled", is_open_shift: true, actual_start: null, actual_end: null, shift_type: "day" }),
        makeShift({ id: "s3", staff_id: "", status: "scheduled", is_open_shift: true, actual_start: null, actual_end: null, shift_type: "day" }),
        makeShift({ id: "s4", staff_id: "staff_a", status: "scheduled", actual_start: null, actual_end: null, shift_type: "day" }),
      ],
      shift_swaps: [
        makeSwap({ id: "sw1", status: "pending" }),
        makeSwap({ id: "sw2", status: "pending" }),
        makeSwap({ id: "sw3", status: "pending" }),
        makeSwap({ id: "sw4", status: "pending" }),
      ],
    }));
    expect(r.shift_score).toBeLessThan(45);
    expect(r.shift_rating).toBe("inadequate");
  });
});

// ── Modifier 1: Open Shift Rate ────────────────────────────────────────────

describe("modifier 1: open shift rate", () => {
  it("awards +4 for 0 open shifts", () => {
    const noOpen = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", is_open_shift: false }),
        makeShift({ id: "s2", is_open_shift: false }),
      ],
    }));
    // 50% open = > 15% => -3
    const halfOpen = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", is_open_shift: false }),
        makeShift({ id: "s2", is_open_shift: true, staff_id: "" }),
      ],
    }));
    // +4 vs -3 = 7 diff, plus mod4 changes (unique staff: 1 vs 1, coverage same)
    // Actually the open shift also affects coverage (unique staff stays same since s2 has empty staff_id)
    expect(noOpen.shift_score).toBeGreaterThan(halfOpen.shift_score);
  });
});

// ── Modifier 2: Punctuality ────────────────────────────────────────────────

describe("modifier 2: punctuality", () => {
  it("awards +4 for >= 90% on-time rate", () => {
    const punctual = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", start_time: "08:00", actual_start: "08:00" }),
        makeShift({ id: "s2", start_time: "08:00", actual_start: "08:02" }),
        makeShift({ id: "s3", start_time: "08:00", actual_start: "07:58" }),
      ],
    }));
    const late = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", start_time: "08:00", actual_start: "08:15" }),
        makeShift({ id: "s2", start_time: "08:00", actual_start: "08:20" }),
        makeShift({ id: "s3", start_time: "08:00", actual_start: "08:30" }),
      ],
    }));
    // 100% on-time = +4, 0% on-time = -3 => diff 7
    expect(punctual.shift_score - late.shift_score).toBe(7);
  });
});

// ── Modifier 3: Overtime Burden ────────────────────────────────────────────

describe("modifier 3: overtime burden", () => {
  it("awards +3 for low overtime", () => {
    const low = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", overtime_minutes: 0 }),
        makeShift({ id: "s2", overtime_minutes: 0 }),
      ],
    }));
    const high = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", overtime_minutes: 60 }),
        makeShift({ id: "s2", overtime_minutes: 60 }),
      ],
    }));
    // avg 0 = +3, avg 60 = -3 => diff 6
    expect(low.shift_score - high.shift_score).toBe(6);
  });
});

// ── Modifier 4: Staff Coverage Spread ──────────────────────────────────────

describe("modifier 4: staff coverage spread", () => {
  it("awards +4 for >= 80% staff rostered", () => {
    const high = computeHomeShiftPattern(baseInput({
      total_staff: 5,
      shifts: [
        makeShift({ id: "s1", staff_id: "a" }),
        makeShift({ id: "s2", staff_id: "b" }),
        makeShift({ id: "s3", staff_id: "c" }),
        makeShift({ id: "s4", staff_id: "d" }),
      ],
    }));
    const low = computeHomeShiftPattern(baseInput({
      total_staff: 20,
      shifts: [
        makeShift({ id: "s1", staff_id: "a" }),
        makeShift({ id: "s2", staff_id: "b" }),
        makeShift({ id: "s3", staff_id: "c" }),
        makeShift({ id: "s4", staff_id: "d" }),
      ],
    }));
    // 80% = +4, 20% (4/20) = -3 => diff 7 from mod4
    // Both have same fairness (4 staff, 1 shift each = ratio 1.0 => mod8 +3)
    // So diff is purely mod4: 7
    expect(high.shift_score - low.shift_score).toBe(7);
  });
});

// ── Modifier 5: Shift Type Balance ─────────────────────────────────────────

describe("modifier 5: shift type balance", () => {
  it("awards +3 for balanced day/sleep-in mix", () => {
    const balanced = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", shift_type: "day" }),
        makeShift({ id: "s2", shift_type: "day" }),
        makeShift({ id: "s3", shift_type: "day" }),
        makeShift({ id: "s4", shift_type: "sleep_in", actual_start: null }),
      ],
    }));
    const allDay = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", shift_type: "day" }),
        makeShift({ id: "s2", shift_type: "day" }),
        makeShift({ id: "s3", shift_type: "day" }),
        makeShift({ id: "s4", shift_type: "day" }),
      ],
    }));
    // balanced: 25% sleep-in = +3, allDay: 0 sleep-in = -2 => diff 5
    expect(balanced.shift_score - allDay.shift_score).toBe(5);
  });
});

// ── Modifier 6: Swap Resolution ────────────────────────────────────────────

describe("modifier 6: swap resolution", () => {
  it("awards +3 for no swaps needed", () => {
    const noSwaps = computeHomeShiftPattern(baseInput({
      shift_swaps: [],
    }));
    const pendingSwaps = computeHomeShiftPattern(baseInput({
      shift_swaps: [
        makeSwap({ id: "sw1", status: "pending" }),
        makeSwap({ id: "sw2", status: "pending" }),
        makeSwap({ id: "sw3", status: "pending" }),
        makeSwap({ id: "sw4", status: "pending" }),
      ],
    }));
    // no swaps = +3, all pending (0% resolution) = -2 => diff 5
    expect(noSwaps.shift_score - pendingSwaps.shift_score).toBe(5);
  });
});

// ── Modifier 7: Completion Rate ────────────────────────────────────────────

describe("modifier 7: completion rate", () => {
  it("awards +4 for >= 70% completion", () => {
    const high = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", status: "completed" }),
        makeShift({ id: "s2", status: "completed" }),
        makeShift({ id: "s3", status: "completed" }),
      ],
    }));
    const low = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", status: "scheduled", actual_start: null, actual_end: null }),
        makeShift({ id: "s2", status: "scheduled", actual_start: null, actual_end: null }),
        makeShift({ id: "s3", status: "scheduled", actual_start: null, actual_end: null }),
      ],
    }));
    // Mod7: 100% completed = +4, 0% completed = -3 => diff 7
    // Mod2: high 100% on-time = +4, low neutral (no actual starts) = 0 => diff 4
    // Mod3: high has completedShifts so avg 0 overtime = +3, low has 0 completedShifts = neutral => diff 3
    // Total diff = 7 + 4 + 3 = 14
    expect(high.shift_score - low.shift_score).toBe(14);
  });
});

// ── Modifier 8: Workload Fairness ──────────────────────────────────────────

describe("modifier 8: workload fairness", () => {
  it("awards +3 for fair distribution", () => {
    const fair = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", staff_id: "a" }),
        makeShift({ id: "s2", staff_id: "b" }),
        makeShift({ id: "s3", staff_id: "c" }),
      ],
    }));
    const unfair = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", staff_id: "a" }),
        makeShift({ id: "s2", staff_id: "a" }),
        makeShift({ id: "s3", staff_id: "a" }),
        makeShift({ id: "s4", staff_id: "a" }),
        makeShift({ id: "s5", staff_id: "a" }),
        makeShift({ id: "s6", staff_id: "b" }),
      ],
    }));
    // fair: ratio 1.0 => +3, unfair: ratio 0.2 => +0 => diff 3
    // But other modifiers also change (unique staff 3 vs 2, coverage)
    expect(fair.shift_score).toBeGreaterThan(unfair.shift_score);
  });
});

// ── Strengths ───────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("includes no open shifts strength", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [makeShift({ is_open_shift: false })],
    }));
    expect(r.strengths.some((s) => s.includes("All shifts filled"))).toBe(true);
  });

  it("includes punctuality strength when >= 90%", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", actual_start: "08:00" }),
        makeShift({ id: "s2", actual_start: "08:02" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("punctuality"))).toBe(true);
  });

  it("includes no swaps strength when empty", () => {
    const r = computeHomeShiftPattern(baseInput({
      shift_swaps: [],
    }));
    expect(r.strengths.some((s) => s.includes("swap"))).toBe(true);
  });

  it("includes shift mix strength", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", shift_type: "day" }),
        makeShift({ id: "s2", shift_type: "sleep_in" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("sleep-in") || s.includes("24-hour"))).toBe(true);
  });
});

// ── Concerns ────────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("includes open shifts concern", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", is_open_shift: true, staff_id: "" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("open shift"))).toBe(true);
  });

  it("includes punctuality concern when < 50%", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", start_time: "08:00", actual_start: "08:20" }),
        makeShift({ id: "s2", start_time: "08:00", actual_start: "08:25" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("punctuality"))).toBe(true);
  });

  it("includes pending swaps concern", () => {
    const r = computeHomeShiftPattern(baseInput({
      shift_swaps: [makeSwap({ status: "pending" })],
    }));
    expect(r.concerns.some((c) => c.includes("swap"))).toBe(true);
  });

  it("includes no sleep-in concern", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", shift_type: "day" }),
        makeShift({ id: "s2", shift_type: "day" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("sleep-in") || c.includes("overnight"))).toBe(true);
  });
});

// ── Recommendations ─────────────────────────────────────────────────────────

describe("recommendations", () => {
  it("recommends filling open shifts", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", is_open_shift: true, staff_id: "" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("open shift") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends resolving pending swaps", () => {
    const r = computeHomeShiftPattern(baseInput({
      shift_swaps: [makeSwap({ status: "pending" })],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("swap"))).toBe(true);
  });

  it("has sequential rank numbers", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", is_open_shift: true, staff_id: "", actual_start: "08:20", start_time: "08:00" }),
      ],
      shift_swaps: [makeSwap({ status: "pending" })],
    }));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// ── Insights ────────────────────────────────────────────────────────────────

describe("insights", () => {
  it("generates critical insight for multiple open shifts", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", is_open_shift: true, staff_id: "" }),
        makeShift({ id: "s2", is_open_shift: true, staff_id: "" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("unfilled"))).toBe(true);
  });

  it("generates positive insight for high punctuality", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", actual_start: "08:00" }),
        makeShift({ id: "s2", actual_start: "08:02" }),
        makeShift({ id: "s3", actual_start: "07:59" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("on time"))).toBe(true);
  });

  it("generates warning for pending swaps", () => {
    const r = computeHomeShiftPattern(baseInput({
      shift_swaps: [makeSwap({ status: "pending" })],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("swap"))).toBe(true);
  });
});

// ── Headline ────────────────────────────────────────────────────────────────

describe("headline", () => {
  it("reflects outstanding rating", () => {
    const r = computeHomeShiftPattern(baseInput({
      total_staff: 8,
      shifts: [
        makeShift({ id: "s1", staff_id: "a", status: "completed", shift_type: "day" }),
        makeShift({ id: "s2", staff_id: "b", status: "completed", shift_type: "day" }),
        makeShift({ id: "s3", staff_id: "c", status: "completed", shift_type: "day" }),
        makeShift({ id: "s4", staff_id: "d", status: "completed", shift_type: "sleep_in", actual_start: null }),
        makeShift({ id: "s5", staff_id: "e", status: "completed", shift_type: "day" }),
        makeShift({ id: "s6", staff_id: "f", status: "completed", shift_type: "day" }),
        makeShift({ id: "s7", staff_id: "g", status: "completed", shift_type: "sleep_in", actual_start: null }),
      ],
    }));
    expect(r.headline).toContain("Strong shift management");
  });

  it("reflects inadequate rating", () => {
    const r = computeHomeShiftPattern(baseInput({
      total_staff: 20,
      shifts: [
        makeShift({ id: "s1", staff_id: "", is_open_shift: true, status: "scheduled", actual_start: null, shift_type: "day" }),
        makeShift({ id: "s2", staff_id: "", is_open_shift: true, status: "scheduled", actual_start: null, shift_type: "day" }),
        makeShift({ id: "s3", staff_id: "", is_open_shift: true, status: "scheduled", actual_start: null, shift_type: "day" }),
      ],
      shift_swaps: [
        makeSwap({ status: "pending" }),
        makeSwap({ status: "pending" }),
      ],
    }));
    expect(r.headline).toContain("requires improvement");
  });
});

// ── Score Clamping ──────────────────────────────────────────────────────────

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const r = computeHomeShiftPattern(baseInput({
      total_staff: 3,
      shifts: Array.from({ length: 20 }, (_, i) =>
        makeShift({
          id: `s${i}`,
          staff_id: `staff_${i % 3}`,
          shift_type: i % 5 === 0 ? "sleep_in" : "day",
          actual_start: i % 5 === 0 ? null : "08:00",
        }),
      ),
    }));
    expect(r.shift_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const r = computeHomeShiftPattern(baseInput({
      total_staff: 50,
      shifts: [
        makeShift({ id: "s1", staff_id: "", is_open_shift: true, status: "scheduled", actual_start: null, shift_type: "day" }),
      ],
      shift_swaps: [
        makeSwap({ status: "pending" }),
        makeSwap({ status: "pending" }),
      ],
    }));
    expect(r.shift_score).toBeGreaterThanOrEqual(0);
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles single shift correctly", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [makeShift()],
    }));
    expect(r.coverage.total_shifts).toBe(1);
    expect(r.shift_score).toBeGreaterThan(0);
    expect(r.shift_rating).not.toBe("insufficient_data");
  });

  it("handles all sleep-in shifts", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ id: "s1", shift_type: "sleep_in", actual_start: null }),
        makeShift({ id: "s2", shift_type: "sleep_in", actual_start: null }),
      ],
    }));
    expect(r.coverage.sleep_in_shifts).toBe(2);
    expect(r.coverage.day_shifts).toBe(0);
  });

  it("handles zero overtime gracefully", () => {
    const r = computeHomeShiftPattern(baseInput({
      shifts: [
        makeShift({ overtime_minutes: 0 }),
      ],
    }));
    expect(r.overtime.total_overtime_minutes).toBe(0);
    expect(r.overtime.avg_overtime_per_shift).toBe(0);
  });
});
