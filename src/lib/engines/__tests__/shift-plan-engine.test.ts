import { describe, expect, it } from "vitest";
import { computeShiftPlan, shiftWindow, type ShiftPlanInput } from "../shift-plan-engine";

const DATE = "2026-06-15";

function staffing(over: Partial<ShiftPlanInput["staffing"]> = {}): ShiftPlanInput["staffing"] {
  return { on_shift_count: 2, minimum_required: 2, shortfall: 0, is_understaffed: false, has_waking_night: true, no_night_cover: false, severity: "ok", alerts: [], ...over };
}
function input(over: Partial<ShiftPlanInput> = {}): ShiftPlanInput {
  return {
    date: DATE,
    period: "day",
    now: `${DATE}T07:00:00`,
    onShift: [{ staff_name: "Olivia", role: "RM" }, { staff_name: "Marcus" }],
    staffing: staffing(),
    events: [],
    tasks: [],
    medications: [],
    watch: [],
    ...over,
  };
}

describe("shiftWindow", () => {
  it("day window is 08:00–20:00 same date", () => {
    expect(shiftWindow(DATE, "day")).toEqual({ startIso: "2026-06-15T08:00:00", endIso: "2026-06-15T20:00:00", label: "08:00–20:00" });
  });
  it("night window spans 20:00 to 08:00 next day", () => {
    expect(shiftWindow(DATE, "night")).toEqual({ startIso: "2026-06-15T20:00:00", endIso: "2026-06-16T08:00:00", label: "20:00–08:00" });
  });
});

describe("computeShiftPlan — running order", () => {
  it("includes only events inside the shift window, time-sorted", () => {
    const r = computeShiftPlan(
      input({
        events: [
          { id: "e1", start: "2026-06-15T09:30:00", title: "GP appt", child_name: "Alex", kind: "appointment" },
          { id: "e2", start: "2026-06-15T07:00:00", title: "Too early", kind: "calendar" }, // before window
          { id: "e3", start: "2026-06-15T14:00:00", title: "Family time", child_name: "Casey", kind: "family_time" },
          { id: "e4", start: "2026-06-15T21:00:00", title: "Evening (night shift)", kind: "calendar" }, // after day window
        ],
      }),
    );
    expect(r.running_order.map((x) => x.id)).toEqual(["e1", "e3"]);
    expect(r.running_order[0].time).toBe("09:30");
  });

  it("night shift captures late-evening and early-morning events", () => {
    const r = computeShiftPlan(
      input({
        period: "night",
        events: [
          { id: "n1", start: "2026-06-15T22:00:00", title: "Settle routine", kind: "calendar" },
          { id: "n2", start: "2026-06-16T07:00:00", title: "Wake / meds", kind: "calendar" },
          { id: "n3", start: "2026-06-15T14:00:00", title: "Daytime", kind: "calendar" }, // outside night window
        ],
      }),
    );
    expect(r.running_order.map((x) => x.id)).toEqual(["n1", "n2"]);
  });
});

describe("computeShiftPlan — must-do & meds", () => {
  it("ranks overdue/due tasks and lifts overdue medium→high", () => {
    const r = computeShiftPlan(
      input({
        tasks: [
          { id: "t1", title: "Care plan", priority: "medium", due_date: "2026-06-10", status: "in_progress" }, // overdue medium→high
          { id: "t2", title: "Urgent thing", priority: "urgent", due_date: "2026-06-15", status: "not_started" },
          { id: "t3", title: "Future", priority: "high", due_date: "2026-06-20", status: "not_started" }, // not due yet
          { id: "t4", title: "Done", priority: "high", due_date: "2026-06-01", status: "completed" },
        ],
      }),
    );
    expect(r.must_do.map((m) => m.id)).toEqual(["task_t2", "task_t1"]); // urgent(critical) before overdue(high)
    expect(r.must_do[0].severity).toBe("critical");
    expect(r.must_do[1].severity).toBe("high");
  });

  it("summarises regular vs PRN medications", () => {
    const r = computeShiftPlan(
      input({
        medications: [
          { child_name: "Alex", name: "Med A", frequency: "BD", prn: false },
          { child_name: "Alex", name: "Med B", frequency: "OD", prn: false },
          { child_name: "Casey", name: "Paracetamol", frequency: null, prn: true },
        ],
      }),
    );
    expect(r.medications.regular_count).toBe(2);
    expect(r.medications.prn_count).toBe(1);
    expect(r.medications.summary).toContain("2 regular medications");
    expect(r.medications.summary).toContain("1 PRN");
  });
});

describe("computeShiftPlan — watch & staffing", () => {
  it("shows only flagged children and counts settled ones", () => {
    const r = computeShiftPlan(
      input({
        watch: [
          { child_name: "Alex", flags: ["Recent incident: physical intervention"] },
          { child_name: "Casey", flags: [] },
          { child_name: "Jordan", flags: ["Currently missing — follow protocol"] },
        ],
      }),
    );
    expect(r.young_people.map((w) => w.child_name)).toEqual(["Alex", "Jordan"]);
    expect(r.settled_count).toBe(1);
    expect(r.counts.watch).toBe(2);
  });

  it("reports understaffing in the staffing line and headline", () => {
    const r = computeShiftPlan(
      input({
        onShift: [{ staff_name: "Solo" }],
        staffing: staffing({ on_shift_count: 1, minimum_required: 2, shortfall: 1, is_understaffed: true, severity: "high", alerts: [{ type: "understaffed", severity: "high", message: "1 short of minimum" }] }),
      }),
    );
    expect(r.staffing.line).toContain("short by 1");
    expect(r.staffing.alerts).toContain("1 short of minimum");
    expect(r.headline).toContain("1 on shift");
  });

  it("offers positives on a clean, well-staffed shift", () => {
    const r = computeShiftPlan(input({ period: "night" }));
    expect(r.positives).toEqual(
      expect.arrayContaining([
        "Staffing meets the minimum for this shift",
        "No tasks outstanding for this shift",
        "No active concerns flagged across the young people",
        "Waking-night cover confirmed",
      ]),
    );
    expect(r.period_label).toBe("Night shift");
  });
});
