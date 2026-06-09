import { describe, it, expect } from "vitest";
import { computeSupervisionOverview, type ReflectiveSupervisionRecord, type StaffLite } from "../supervision-engine";

const TODAY = "2026-06-09";
function at(days: number): string {
  const d = new Date(TODAY + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function rec(over: Partial<ReflectiveSupervisionRecord> & { id: string; staff_id: string; date: string }): ReflectiveSupervisionRecord {
  return {
    supervisor_id: "sup", type: "1:1", emotional_wellbeing: "", wellbeing_score: 4, workload: "",
    safeguarding_concerns: "", relationships_with_children: "", reflective_practice: "", pace_examples: "",
    professional_boundaries: "", training_needs: [], confidence_level: 4, manager_feedback: "", actions: [],
    follow_up_date: null, created_at: over.date, ...over,
  };
}

const STAFF: StaffLite[] = [
  { id: "s_current", name: "Current Carer" },
  { id: "s_overdue", name: "Overdue Carer" },
  { id: "s_due", name: "DueSoon Carer" },
  { id: "s_never", name: "Never Carer" },
];

describe("computeSupervisionOverview", () => {
  it("classifies current / due-soon / overdue / never (6-weekly cadence)", () => {
    const r = computeSupervisionOverview({
      today: TODAY, staff: STAFF, interval_days: 42, due_soon_days: 7,
      records: [
        rec({ id: "1", staff_id: "s_current", date: at(-10) }),  // due in 32d → current
        rec({ id: "2", staff_id: "s_overdue", date: at(-60) }),  // due 18d ago → overdue
        rec({ id: "3", staff_id: "s_due", date: at(-38) }),      // due in 4d → due_soon
        // s_never: no record
      ],
    });
    const byId = Object.fromEntries(r.by_staff.map((s) => [s.staff_id, s.status]));
    expect(byId["s_current"]).toBe("current");
    expect(byId["s_overdue"]).toBe("overdue");
    expect(byId["s_due"]).toBe("due_soon");
    expect(byId["s_never"]).toBe("never");
    expect(r.summary.total_staff).toBe(4);
    expect(r.summary.current).toBe(1);
    expect(r.summary.overdue).toBe(2); // overdue + never
    expect(r.summary.supervision_rate).toBe(25);
  });

  it("uses the latest record per staff", () => {
    const r = computeSupervisionOverview({
      today: TODAY, staff: [{ id: "s", name: "S" }], interval_days: 42,
      records: [rec({ id: "old", staff_id: "s", date: at(-90), wellbeing_score: 1 }), rec({ id: "new", staff_id: "s", date: at(-5), wellbeing_score: 5 })],
    });
    expect(r.by_staff[0].last_date).toBe(at(-5));
    expect(r.by_staff[0].wellbeing_score).toBe(5);
    expect(r.by_staff[0].status).toBe("current");
  });

  it("flags low wellbeing and low confidence as support indicators", () => {
    const r = computeSupervisionOverview({
      today: TODAY, staff: [{ id: "s", name: "S" }],
      records: [rec({ id: "1", staff_id: "s", date: at(-3), wellbeing_score: 2, confidence_level: 2 })],
    });
    expect(r.by_staff[0].wellbeing_flag).toBe(true);
    expect(r.by_staff[0].confidence_flag).toBe(true);
    expect(r.summary.wellbeing_concerns).toBe(1);
    expect(r.summary.confidence_concerns).toBe(1);
  });

  it("counts outstanding (not-done) actions", () => {
    const r = computeSupervisionOverview({
      today: TODAY, staff: [{ id: "s", name: "S" }],
      records: [rec({ id: "1", staff_id: "s", date: at(-3), actions: [{ action: "a", done: false }, { action: "b", done: true }, { action: "c" }] })],
    });
    expect(r.by_staff[0].outstanding_actions).toBe(2);
    expect(r.summary.outstanding_actions).toBe(2);
  });

  it("aggregates recurring training needs across records, most common first", () => {
    const r = computeSupervisionOverview({
      today: TODAY, staff: [{ id: "a", name: "A" }, { id: "b", name: "B" }],
      records: [
        rec({ id: "1", staff_id: "a", date: at(-3), training_needs: ["de-escalation", "recording"] }),
        rec({ id: "2", staff_id: "b", date: at(-3), training_needs: ["de-escalation"] }),
      ],
    });
    expect(r.recurring_training_needs[0]).toEqual({ need: "de-escalation", count: 2 });
    expect(r.recurring_training_needs.find((n) => n.need === "recording")?.count).toBe(1);
  });

  it("sorts by_staff worst-first (never/overdue before current)", () => {
    const r = computeSupervisionOverview({
      today: TODAY, staff: STAFF, interval_days: 42,
      records: [rec({ id: "1", staff_id: "s_current", date: at(-5) }), rec({ id: "2", staff_id: "s_overdue", date: at(-70) })],
    });
    expect(["never", "overdue"]).toContain(r.by_staff[0].status);
    expect(r.by_staff[r.by_staff.length - 1].status).toBe("current");
  });

  it("is deterministic", () => {
    const args = { today: TODAY, staff: STAFF, records: [rec({ id: "1", staff_id: "s_current", date: at(-5) })] };
    expect(computeSupervisionOverview(args)).toEqual(computeSupervisionOverview(args));
  });
});
