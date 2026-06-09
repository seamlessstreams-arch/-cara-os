import { describe, it, expect } from "vitest";
import { computeShiftBriefing, type ShiftBriefingInput } from "../shift-briefing-engine";

const TODAY = "2026-06-09";
function at(days: number): string {
  const d = new Date(TODAY + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function base(over: Partial<ShiftBriefingInput> = {}): ShiftBriefingInput {
  return {
    today: TODAY,
    on_duty: [],
    tasks: [],
    reviews: [],
    medications: [],
    events: [],
    ...over,
  };
}

describe("computeShiftBriefing", () => {
  it("empty → zero summary, gap warning, calm headline", () => {
    const r = computeShiftBriefing(base());
    expect(r.summary).toEqual({ on_duty: 0, tasks_due: 0, reviews_due: 0, open_incidents: 0, meds_active: 0 });
    expect(r.on_duty.gap_warning).toMatch(/No staff on duty/);
    expect(r.headline).toMatch(/No staff clocked on/);
    expect(r.headline).toMatch(/nothing outstanding/);
  });

  it("splits on-duty into now (in_progress) vs upcoming (scheduled), ignores completed", () => {
    const r = computeShiftBriefing(base({
      on_duty: [
        { staff_id: "s1", staff_name: "Olivia", shift_type: "day", start_time: "08:00", end_time: "17:00", status: "in_progress" },
        { staff_id: "s2", staff_name: "Anna", shift_type: "sleep_in", start_time: "22:00", end_time: "07:00", status: "scheduled" },
        { staff_id: "s3", staff_name: "Ghost", shift_type: "day", status: "completed" },
      ],
    }));
    expect(r.on_duty.now.map((m) => m.staff_name)).toEqual(["Olivia"]);
    expect(r.on_duty.upcoming.map((m) => m.staff_name)).toEqual(["Anna"]);
    expect(r.on_duty.total).toBe(2);
    expect(r.on_duty.gap_warning).toBeNull();
    expect(r.summary.on_duty).toBe(1);
    expect(r.on_duty.now[0].shift_label).toBe("Day · 08:00–17:00");
  });

  it("warns when nobody is clocked on but a shift is scheduled", () => {
    const r = computeShiftBriefing(base({
      on_duty: [{ staff_id: "s2", staff_name: "Anna", shift_type: "sleep_in", status: "scheduled" }],
    }));
    expect(r.on_duty.now).toHaveLength(0);
    expect(r.on_duty.gap_warning).toMatch(/not started/);
  });

  it("classifies tasks: overdue vs due-today, excludes future & closed", () => {
    const r = computeShiftBriefing(base({
      tasks: [
        { id: "t1", title: "Old task", due_date: at(-5), status: "active" },
        { id: "t2", title: "Due now", due_date: at(0), status: "in_progress" },
        { id: "t3", title: "Future", due_date: at(3), status: "active" },
        { id: "t4", title: "Done", due_date: at(-2), status: "completed" },
        { id: "t5", title: "No date", due_date: null, status: "active" },
      ],
    }));
    expect(r.tasks.overdue.map((t) => t.id)).toEqual(["t1"]);
    expect(r.tasks.overdue[0].days_overdue).toBe(5);
    expect(r.tasks.due_today.map((t) => t.id)).toEqual(["t2"]);
    expect(r.tasks.count).toBe(2);
  });

  it("classifies reviews within the horizon: overdue vs due-soon, drops far-future", () => {
    const r = computeShiftBriefing(base({
      review_horizon_days: 7,
      reviews: [
        { id: "r1", plan_type: "PEP", child_id: "c1", child_name: "Alex", review_date: at(-3) },   // overdue
        { id: "r2", plan_type: "LAC Review", child_id: "c2", child_name: "Jordan", review_date: at(4) }, // due soon
        { id: "r3", plan_type: "Pathway Plan", child_id: "c3", child_name: "Casey", review_date: at(30) }, // beyond horizon
      ],
    }));
    expect(r.reviews.overdue.map((x) => x.id)).toEqual(["r1"]);
    expect(r.reviews.overdue[0].days_to_review).toBe(-3);
    expect(r.reviews.due_soon.map((x) => x.id)).toEqual(["r2"]);
    expect(r.reviews.count).toBe(2);
  });

  it("splits medications into regular and prn", () => {
    const r = computeShiftBriefing(base({
      medications: [
        { id: "m1", child_id: "c1", child_name: "Casey", name: "Melatonin", dosage: "3mg", frequency: "Nightly", prn: false },
        { id: "m2", child_id: "c2", child_name: "Alex", name: "Ibuprofen", dosage: "200mg", frequency: "PRN", prn: true },
      ],
    }));
    expect(r.medications.regular_count).toBe(1);
    expect(r.medications.prn_count).toBe(1);
    expect(r.medications.count).toBe(2);
    // regular sorts before prn
    expect(r.medications.items[0].name).toBe("Melatonin");
  });

  it("surfaces open & recent incidents and today/overnight log, flags significant", () => {
    const r = computeShiftBriefing(base({
      recent_days: 3,
      events: [
        { id: "i1", kind: "incident", date: at(-2), summary: "Missing from care", category: "missing_from_care", severity: "high", status: "open" },
        { id: "i2", kind: "incident", date: at(-10), summary: "Old closed incident", category: "complaint", severity: "low", status: "closed" }, // too old + closed → excluded
        { id: "l1", kind: "log", date: at(0), time: "09:00", summary: "Good morning", category: "general", is_significant: false },
        { id: "l2", kind: "log", date: at(-1), time: "23:00", summary: "Significant overnight note", category: "health", is_significant: true },
        { id: "l3", kind: "log", date: at(-5), summary: "Too old", category: "general" }, // outside today+overnight
      ],
    }));
    expect(r.events.incidents.map((e) => e.id)).toEqual(["i1"]);
    expect(r.events.open_incident_count).toBe(1);
    expect(r.events.recent_log.map((e) => e.id).sort()).toEqual(["l1", "l2"]);
    expect(r.events.significant_log.map((e) => e.id)).toEqual(["l2"]);
  });

  it("builds an attention rollup ordered critical → high → medium", () => {
    const r = computeShiftBriefing(base({
      events: [{ id: "i1", kind: "incident", date: at(-1), summary: "Missing", category: "missing_from_care", severity: "high", status: "open" }],
      reviews: [{ id: "r1", plan_type: "PEP", child_id: "c1", child_name: "Alex", review_date: at(-4) }],
      tasks: [{ id: "t1", title: "Chase GP", due_date: at(-2), status: "active" }],
    }));
    // high-severity open incident → critical; overdue review → high; overdue task (<7d) → medium
    expect(r.attention.map((a) => a.severity)).toEqual(["critical", "high", "medium"]);
    expect(r.attention.map((a) => a.kind)).toEqual(["incident", "review", "task"]);
    expect(r.attention[0].label).toMatch(/Open incident/);
    expect(r.summary.open_incidents).toBe(1);
  });

  it("headline aggregates the live counts", () => {
    const r = computeShiftBriefing(base({
      on_duty: [{ staff_id: "s1", staff_name: "Olivia", shift_type: "day", status: "in_progress" }],
      tasks: [{ id: "t1", title: "x", due_date: at(-1), status: "active" }],
      events: [{ id: "i1", kind: "incident", date: at(-1), summary: "y", category: "complaint", severity: "medium", status: "open" }],
    }));
    expect(r.headline).toMatch(/1 on duty now/);
    expect(r.headline).toMatch(/1 task due \(1 overdue\)/);
    expect(r.headline).toMatch(/1 open incident to be aware of/);
  });

  it("is deterministic for a fixed today", () => {
    const input = base({
      on_duty: [{ staff_id: "s1", staff_name: "Olivia", shift_type: "day", status: "in_progress" }],
      tasks: [{ id: "t1", title: "x", due_date: at(-1), status: "active" }],
      reviews: [{ id: "r1", plan_type: "PEP", child_id: "c1", review_date: at(-2) }],
    });
    expect(computeShiftBriefing(input)).toEqual(computeShiftBriefing(input));
  });
});
