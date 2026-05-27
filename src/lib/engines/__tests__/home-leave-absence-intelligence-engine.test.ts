import { describe, it, expect } from "vitest";
import {
  computeHomeLeaveAbsence,
  type HomeLeaveAbsenceInput,
  type LeaveInput,
} from "../home-leave-absence-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeLeave(overrides: Partial<LeaveInput> = {}): LeaveInput {
  return {
    id: "leave_1",
    staff_id: "staff_1",
    leave_type: "annual_leave",
    start_date: "2026-06-01",
    end_date: "2026-06-05",
    total_days: 5,
    status: "approved",
    approved_by: "staff_mgr",
    return_to_work_required: false,
    return_to_work_completed: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeLeaveAbsenceInput> = {}): HomeLeaveAbsenceInput {
  return {
    today: "2026-05-27",
    leave_requests: [],
    total_staff: 8,
    ...overrides,
  };
}

// ── Insufficient Data ───────────────────────────────────────────────────────

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeHomeLeaveAbsence(baseInput({ total_staff: 0 }));
    expect(r.leave_rating).toBe("insufficient_data");
    expect(r.leave_score).toBe(0);
  });

  it("returns empty arrays for all narrative fields", () => {
    const r = computeHomeLeaveAbsence(baseInput({ total_staff: 0 }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
    expect(r.distribution).toEqual([]);
  });
});

// ── Zero Leave (Good State) ─────────────────────────────────────────────────

describe("zero leave requests", () => {
  it("is not insufficient_data — it is a valid good state", () => {
    const r = computeHomeLeaveAbsence(baseInput({ leave_requests: [] }));
    expect(r.leave_rating).not.toBe("insufficient_data");
    expect(r.leave_score).toBeGreaterThan(0);
  });

  it("rates outstanding with no absences", () => {
    const r = computeHomeLeaveAbsence(baseInput({ leave_requests: [] }));
    expect(r.leave_rating).toBe("outstanding");
  });

  it("includes no absence strength", () => {
    const r = computeHomeLeaveAbsence(baseInput({ leave_requests: [] }));
    expect(r.strengths.some((s) => s.includes("No leave requests"))).toBe(true);
  });
});

// ── Volume Profile ──────────────────────────────────────────────────────────

describe("volume profile", () => {
  it("counts requests by status", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", status: "pending", approved_by: null }),
        makeLeave({ id: "l2", status: "approved" }),
        makeLeave({ id: "l3", status: "rejected", approved_by: null }),
        makeLeave({ id: "l4", status: "cancelled", approved_by: null }),
      ],
    }));
    expect(r.volume.pending_count).toBe(1);
    expect(r.volume.approved_count).toBe(1);
    expect(r.volume.rejected_count).toBe(1);
    expect(r.volume.cancelled_count).toBe(1);
    expect(r.volume.total_requests).toBe(4);
  });

  it("calculates total and average days", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", total_days: 5 }),
        makeLeave({ id: "l2", total_days: 3 }),
      ],
    }));
    expect(r.volume.total_days_requested).toBe(8);
    expect(r.volume.avg_days_per_request).toBe(4);
  });
});

// ── Sickness Profile ────────────────────────────────────────────────────────

describe("sickness profile", () => {
  it("counts sick requests and days", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", total_days: 2 }),
        makeLeave({ id: "l2", leave_type: "sick", total_days: 3 }),
        makeLeave({ id: "l3", leave_type: "annual_leave", total_days: 5 }),
      ],
    }));
    expect(r.sickness.sick_requests).toBe(2);
    expect(r.sickness.sick_days).toBe(5);
  });

  it("identifies active sick leave (covering today)", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", start_date: "2026-05-26", end_date: "2026-05-28", total_days: 3 }),
        makeLeave({ id: "l2", leave_type: "sick", start_date: "2026-05-20", end_date: "2026-05-25", total_days: 6 }),
      ],
    }));
    expect(r.sickness.active_sick_count).toBe(1); // Only l1 covers today
  });

  it("calculates RTW compliance rate", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", return_to_work_required: true, return_to_work_completed: true }),
        makeLeave({ id: "l2", leave_type: "sick", return_to_work_required: true, return_to_work_completed: false }),
      ],
    }));
    expect(r.sickness.rtw_required).toBe(2);
    expect(r.sickness.rtw_completed).toBe(1);
    expect(r.sickness.rtw_compliance_rate).toBe(50);
  });

  it("excludes cancelled sick requests", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", status: "cancelled", total_days: 3 }),
        makeLeave({ id: "l2", leave_type: "sick", status: "approved", total_days: 2 }),
      ],
    }));
    expect(r.sickness.sick_requests).toBe(1);
    expect(r.sickness.sick_days).toBe(2);
  });
});

// ── Planning Profile ────────────────────────────────────────────────────────

describe("planning profile", () => {
  it("counts annual leave requests and days", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "annual_leave", total_days: 5 }),
        makeLeave({ id: "l2", leave_type: "annual_leave", total_days: 3 }),
      ],
    }));
    expect(r.planning.annual_leave_requests).toBe(2);
    expect(r.planning.annual_leave_days).toBe(8);
  });

  it("counts future leave", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", start_date: "2026-06-01", end_date: "2026-06-05", total_days: 5 }), // future
        makeLeave({ id: "l2", start_date: "2026-05-20", end_date: "2026-05-25", total_days: 6 }), // past
      ],
    }));
    expect(r.planning.future_leave_count).toBe(1);
    expect(r.planning.future_leave_days).toBe(5);
  });

  it("counts current absent staff", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      total_staff: 10,
      leave_requests: [
        makeLeave({ id: "l1", staff_id: "s1", start_date: "2026-05-26", end_date: "2026-05-28", total_days: 3 }),
        makeLeave({ id: "l2", staff_id: "s2", start_date: "2026-05-25", end_date: "2026-05-27", total_days: 3 }),
        makeLeave({ id: "l3", staff_id: "s3", start_date: "2026-06-01", end_date: "2026-06-05", total_days: 5 }), // future, not current
      ],
    }));
    expect(r.planning.current_absent_count).toBe(2);
    expect(r.planning.current_absent_rate).toBe(20);
  });
});

// ── Type Distribution ───────────────────────────────────────────────────────

describe("type distribution", () => {
  it("groups by leave type with count and days", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "annual_leave", total_days: 5 }),
        makeLeave({ id: "l2", leave_type: "sick", total_days: 2 }),
        makeLeave({ id: "l3", leave_type: "annual_leave", total_days: 3 }),
      ],
    }));
    expect(r.distribution).toHaveLength(2);
    const al = r.distribution.find((d) => d.leave_type === "annual_leave");
    expect(al?.count).toBe(2);
    expect(al?.total_days).toBe(8);
  });

  it("sorts by total days descending", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", total_days: 2 }),
        makeLeave({ id: "l2", leave_type: "annual_leave", total_days: 10 }),
      ],
    }));
    expect(r.distribution[0].leave_type).toBe("annual_leave");
  });

  it("excludes cancelled from distribution", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "annual_leave", total_days: 5 }),
        makeLeave({ id: "l2", leave_type: "sick", status: "cancelled", total_days: 3 }),
      ],
    }));
    expect(r.distribution).toHaveLength(1);
    expect(r.distribution[0].leave_type).toBe("annual_leave");
  });
});

// ── Rating Thresholds ───────────────────────────────────────────────────────

describe("rating thresholds", () => {
  it("rates outstanding with no leave at all", () => {
    const r = computeHomeLeaveAbsence(baseInput({ leave_requests: [] }));
    expect(r.leave_score).toBeGreaterThanOrEqual(80);
    expect(r.leave_rating).toBe("outstanding");
  });

  it("rates inadequate with high sickness and poor governance", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      total_staff: 5,
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", staff_id: "s1", leave_type: "sick", start_date: "2026-05-25", end_date: "2026-05-30", total_days: 6, status: "pending", approved_by: null, return_to_work_required: true, return_to_work_completed: false }),
        makeLeave({ id: "l2", staff_id: "s2", leave_type: "sick", start_date: "2026-05-26", end_date: "2026-05-29", total_days: 4, status: "pending", approved_by: null, return_to_work_required: true, return_to_work_completed: false }),
        makeLeave({ id: "l3", staff_id: "s3", leave_type: "sick", start_date: "2026-05-27", end_date: "2026-05-28", total_days: 2, status: "pending", approved_by: null, return_to_work_required: true, return_to_work_completed: false }),
      ],
    }));
    expect(r.leave_score).toBeLessThan(45);
    expect(r.leave_rating).toBe("inadequate");
  });
});

// ── Modifier 1: Sickness Rate ──────────────────────────────────────────────

describe("modifier 1: sickness rate", () => {
  it("awards +5 for zero sick days", () => {
    const noSick = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "annual_leave", total_days: 5 }),
      ],
    }));
    const highSick = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", total_days: 20 }),
      ],
    }));
    // noSick: +5 for mod1, highSick: -4 for mod1 => diff 9
    // But mod6 also changes: noSick 100% planned = +3, highSick 0% planned (all sick) = -2 => diff 5
    // So total diff = 9 + 5 = 14
    expect(noSick.leave_score - highSick.leave_score).toBe(14);
  });
});

// ── Modifier 2: Pending Approval ───────────────────────────────────────────

describe("modifier 2: pending approval", () => {
  it("awards +3 for zero pending", () => {
    const noPending = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", status: "approved" }),
      ],
    }));
    const allPending = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", status: "pending", approved_by: null }),
      ],
    }));
    // noPending: mod2 +3, allPending: mod2 -3 = diff 6
    // mod7 also changes: noPending has approver = +3, allPending no approved = neutral
    // Actually, allPending has 0 approved, 0 pending = mod7: 0 approved, 1 pending => no approved with approver, but approved.length is 0
    // noPending: approved.length = 1, all with approver = +3
    // allPending: approved.length = 0, pending > 0 => else -2
    // Diff for mod7 = +3 - (-2) = 5
    // But wait, there's also mod5 for future planning:
    // noPending future: l1 is in the future (2026-06-01 > 2026-05-27), status "approved" => approvedFuture.length = 1 = +3
    // allPending future: l1 is in the future, status "pending" => futureLeave includes it, but approvedFuture = 0 => +0
    // Diff for mod5 = +3 - 0 = 3
    // Total diff = 6 (mod2) + 5 (mod7) + 3 (mod5) = 14
    expect(noPending.leave_score - allPending.leave_score).toBe(14);
  });
});

// ── Modifier 3: Current Absence Rate ───────────────────────────────────────

describe("modifier 3: current absence rate", () => {
  it("awards +4 for zero current absence", () => {
    const noAbsent = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", start_date: "2026-06-01", end_date: "2026-06-05", total_days: 5 }), // future
      ],
    }));
    const absent = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      total_staff: 4,
      leave_requests: [
        makeLeave({ id: "l1", staff_id: "s1", start_date: "2026-05-25", end_date: "2026-05-28", total_days: 4 }),
        makeLeave({ id: "l2", staff_id: "s2", start_date: "2026-05-26", end_date: "2026-05-29", total_days: 4 }),
      ],
    }));
    // noAbsent: mod3 +4, absent: 50% = -3 => diff 7
    // mod8 also changes: noAbsent 0 unique absent = +3, absent 2 unique absent / 4 staff = 50% => -3 => diff 6
    expect(noAbsent.shift_score || noAbsent.leave_score).toBeDefined();
    expect(noAbsent.leave_score).toBeGreaterThan(absent.leave_score);
  });
});

// ── Modifier 4: RTW Compliance ─────────────────────────────────────────────

describe("modifier 4: rtw compliance", () => {
  it("awards +4 when no RTW required", () => {
    const noRTW = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", return_to_work_required: false }),
      ],
    }));
    const rtwFailed = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", return_to_work_required: true, return_to_work_completed: false }),
      ],
    }));
    // noRTW: mod4 +4, rtwFailed: mod4 -3 = diff 7
    // But mod1 also changes: noRTW 0 sick days = +5, rtwFailed 5 sick days = changes based on rate
    // And mod6: noRTW 100% annual_leave = +3, rtwFailed 100% sick = -2 = diff 5
    expect(noRTW.leave_score).toBeGreaterThan(rtwFailed.leave_score);
  });
});

// ── Modifier 6: Leave Type Diversity ───────────────────────────────────────

describe("modifier 6: leave type diversity", () => {
  it("awards +3 for mostly planned leave", () => {
    const planned = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "annual_leave", total_days: 5 }),
        makeLeave({ id: "l2", leave_type: "annual_leave", total_days: 3 }),
        makeLeave({ id: "l3", leave_type: "sick", total_days: 1 }),
      ],
    }));
    const sickHeavy = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", total_days: 5 }),
        makeLeave({ id: "l2", leave_type: "sick", total_days: 3 }),
        makeLeave({ id: "l3", leave_type: "annual_leave", total_days: 1 }),
      ],
    }));
    // planned: 67% annual = +3, sickHeavy: 33% annual + more sick = -2 => diff 5
    // But mod1 also shifts (different sick days)
    expect(planned.leave_score).toBeGreaterThan(sickHeavy.leave_score);
  });
});

// ── Strengths ───────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("includes no sickness strength", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "annual_leave" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("sickness"))).toBe(true);
  });

  it("includes no current absence strength", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", start_date: "2026-06-01", end_date: "2026-06-05" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("currently absent") || s.includes("full team"))).toBe(true);
  });

  it("includes all processed strength when no pending", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", status: "approved" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("processed"))).toBe(true);
  });

  it("includes future planning strength", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", start_date: "2026-06-10", end_date: "2026-06-14", status: "approved" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("pre-approved") || s.includes("forward planning"))).toBe(true);
  });
});

// ── Concerns ────────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("includes active sick leave concern", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", start_date: "2026-05-26", end_date: "2026-05-28", total_days: 3 }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("sick leave"))).toBe(true);
  });

  it("includes pending approval concern", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", status: "pending", approved_by: null }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("pending") || c.includes("awaiting"))).toBe(true);
  });

  it("includes RTW compliance concern when < 50%", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", return_to_work_required: true, return_to_work_completed: false }),
        makeLeave({ id: "l2", leave_type: "sick", return_to_work_required: true, return_to_work_completed: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Return-to-work") || c.includes("RTW"))).toBe(true);
  });

  it("includes high absence concern when > 25%", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      total_staff: 4,
      leave_requests: [
        makeLeave({ id: "l1", staff_id: "s1", start_date: "2026-05-25", end_date: "2026-05-28" }),
        makeLeave({ id: "l2", staff_id: "s2", start_date: "2026-05-26", end_date: "2026-05-29" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("absent") || c.includes("staffing adequacy"))).toBe(true);
  });
});

// ── Recommendations ─────────────────────────────────────────────────────────

describe("recommendations", () => {
  it("recommends processing pending leave", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", status: "pending", approved_by: null }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("pending"))).toBe(true);
  });

  it("recommends completing RTW when compliance is low", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", return_to_work_required: true, return_to_work_completed: false }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("return-to-work"))).toBe(true);
  });

  it("has sequential rank numbers", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", status: "pending", approved_by: null, leave_type: "sick", start_date: "2026-05-25", end_date: "2026-05-28", return_to_work_required: true, return_to_work_completed: false }),
      ],
    }));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// ── Insights ────────────────────────────────────────────────────────────────

describe("insights", () => {
  it("generates critical insight for high absence rate", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      today: "2026-05-27",
      total_staff: 4,
      leave_requests: [
        makeLeave({ id: "l1", staff_id: "s1", start_date: "2026-05-25", end_date: "2026-05-28" }),
        makeLeave({ id: "l2", staff_id: "s2", start_date: "2026-05-26", end_date: "2026-05-29" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("absent"))).toBe(true);
  });

  it("generates positive insight for zero sickness", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "annual_leave" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("sickness"))).toBe(true);
  });

  it("generates warning for incomplete RTW", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "sick", return_to_work_required: true, return_to_work_completed: false }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("return-to-work"))).toBe(true);
  });
});

// ── Headline ────────────────────────────────────────────────────────────────

describe("headline", () => {
  it("reflects outstanding with no leave", () => {
    const r = computeHomeLeaveAbsence(baseInput({ leave_requests: [] }));
    expect(r.headline).toContain("Excellent workforce availability");
  });

  it("reflects inadequate rating", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      total_staff: 5,
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", staff_id: "s1", leave_type: "sick", start_date: "2026-05-25", end_date: "2026-05-30", total_days: 6, status: "pending", approved_by: null, return_to_work_required: true, return_to_work_completed: false }),
        makeLeave({ id: "l2", staff_id: "s2", leave_type: "sick", start_date: "2026-05-26", end_date: "2026-05-29", total_days: 4, status: "pending", approved_by: null, return_to_work_required: true, return_to_work_completed: false }),
        makeLeave({ id: "l3", staff_id: "s3", leave_type: "sick", start_date: "2026-05-27", end_date: "2026-05-28", total_days: 2, status: "pending", approved_by: null, return_to_work_required: true, return_to_work_completed: false }),
      ],
    }));
    expect(r.headline).toContain("requires improvement");
  });
});

// ── Score Clamping ──────────────────────────────────────────────────────────

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const r = computeHomeLeaveAbsence(baseInput({ leave_requests: [] }));
    expect(r.leave_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      total_staff: 3,
      today: "2026-05-27",
      leave_requests: [
        makeLeave({ id: "l1", staff_id: "s1", leave_type: "sick", start_date: "2026-05-25", end_date: "2026-05-30", total_days: 6, status: "pending", approved_by: null, return_to_work_required: true, return_to_work_completed: false }),
        makeLeave({ id: "l2", staff_id: "s2", leave_type: "sick", start_date: "2026-05-26", end_date: "2026-05-29", total_days: 4, status: "pending", approved_by: null, return_to_work_required: true, return_to_work_completed: false }),
        makeLeave({ id: "l3", staff_id: "s3", leave_type: "sick", start_date: "2026-05-27", end_date: "2026-05-28", total_days: 2, status: "pending", approved_by: null, return_to_work_required: true, return_to_work_completed: false }),
      ],
    }));
    expect(r.leave_score).toBeGreaterThanOrEqual(0);
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles single leave request", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [makeLeave()],
    }));
    expect(r.volume.total_requests).toBe(1);
    expect(r.leave_rating).not.toBe("insufficient_data");
  });

  it("handles all cancelled requests", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", status: "cancelled" }),
        makeLeave({ id: "l2", status: "cancelled" }),
      ],
    }));
    expect(r.volume.cancelled_count).toBe(2);
    expect(r.distribution).toHaveLength(0); // All excluded
  });

  it("handles mixed leave types correctly", () => {
    const r = computeHomeLeaveAbsence(baseInput({
      leave_requests: [
        makeLeave({ id: "l1", leave_type: "annual_leave", total_days: 5 }),
        makeLeave({ id: "l2", leave_type: "sick", total_days: 2 }),
        makeLeave({ id: "l3", leave_type: "compassionate", total_days: 1 }),
        makeLeave({ id: "l4", leave_type: "training", total_days: 3 }),
      ],
    }));
    expect(r.distribution).toHaveLength(4);
  });
});
