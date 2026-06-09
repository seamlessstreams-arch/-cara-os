import { describe, it, expect } from "vitest";
import { computePlanCurrency, type PlanRecordInput } from "../plan-currency-engine";

const TODAY = "2026-06-09";
function at(days: number): string {
  const d = new Date(TODAY); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
}
const CHILDREN = [{ id: "yp_a", name: "Alex" }, { id: "yp_b", name: "Jordan" }];
const TYPES = [{ key: "pep", label: "PEP" }, { key: "risk", label: "Risk Plan" }];

function plan(p: Partial<PlanRecordInput> & { id: string; child_id: string; plan_type_key: string }): PlanRecordInput {
  return {
    plan_type: p.plan_type ?? p.plan_type_key,
    review_date: p.review_date,
    child_name: p.child_name,
    id: p.id, child_id: p.child_id, plan_type_key: p.plan_type_key,
  };
}

describe("computePlanCurrency", () => {
  it("empty → headline + zero summary", () => {
    const r = computePlanCurrency({ today: TODAY, plans: [], children: CHILDREN, plan_types: TYPES });
    expect(r.summary.total).toBe(0);
    expect(r.headline).toMatch(/No child plans/);
    // matrix still has a row per child with all "none" cells
    expect(r.matrix).toHaveLength(2);
    expect(r.matrix[0].cells.every((c) => c.status === "none")).toBe(true);
  });

  it("classifies overdue / due_soon / current / no_date", () => {
    const r = computePlanCurrency({
      today: TODAY, children: CHILDREN, plan_types: TYPES,
      plans: [
        plan({ id: "1", child_id: "yp_a", plan_type_key: "pep", review_date: at(-10) }),  // overdue
        plan({ id: "2", child_id: "yp_a", plan_type_key: "risk", review_date: at(10) }),   // due soon (<=30)
        plan({ id: "3", child_id: "yp_b", plan_type_key: "pep", review_date: at(90) }),    // current
        plan({ id: "4", child_id: "yp_b", plan_type_key: "risk", review_date: null }),     // no date
      ],
    });
    expect(r.summary.overdue).toBe(1);
    expect(r.summary.due_soon).toBe(1);
    expect(r.summary.current).toBe(1);
    expect(r.summary.no_date).toBe(1);
    // currency_rate = of 3 dated, 2 not overdue = 67%
    expect(r.summary.currency_rate).toBe(67);
  });

  it("builds a child × plan-type matrix with 'none' for missing plans + worst-of-type per cell", () => {
    const r = computePlanCurrency({
      today: TODAY, children: CHILDREN, plan_types: TYPES,
      plans: [
        plan({ id: "1", child_id: "yp_a", plan_type_key: "pep", review_date: at(-3) }),  // overdue
        plan({ id: "2", child_id: "yp_a", plan_type_key: "pep", review_date: at(90) }),  // current (same type → worst=overdue)
        // yp_a has no risk plan; yp_b has nothing
      ],
    });
    const rowA = r.matrix.find((m) => m.child_id === "yp_a")!;
    expect(rowA.cells.find((c) => c.plan_type_key === "pep")!.status).toBe("overdue"); // worst of the two
    expect(rowA.cells.find((c) => c.plan_type_key === "risk")!.status).toBe("none");
    const rowB = r.matrix.find((m) => m.child_id === "yp_b")!;
    expect(rowB.cells.every((c) => c.status === "none")).toBe(true);
  });

  it("rolls up by child (worst status) and by plan type", () => {
    const r = computePlanCurrency({
      today: TODAY, children: CHILDREN, plan_types: TYPES,
      plans: [
        plan({ id: "1", child_id: "yp_a", plan_type_key: "pep", review_date: at(-5) }),
        plan({ id: "2", child_id: "yp_a", plan_type_key: "risk", review_date: at(100) }),
        plan({ id: "3", child_id: "yp_b", plan_type_key: "pep", review_date: at(100) }),
      ],
    });
    const a = r.by_child.find((c) => c.child_id === "yp_a")!;
    expect(a.overdue).toBe(1);
    expect(a.worst).toBe("overdue");
    expect(r.by_child[0].child_id).toBe("yp_a"); // most overdue first
    const pep = r.by_plan_type.find((t) => t.plan_type_key === "pep")!;
    expect(pep.total).toBe(2);
    expect(pep.overdue).toBe(1);
  });

  it("ranks the overdue list most-overdue first", () => {
    const r = computePlanCurrency({
      today: TODAY, children: CHILDREN, plan_types: TYPES,
      plans: [
        plan({ id: "recent", child_id: "yp_a", plan_type_key: "pep", review_date: at(-2) }),
        plan({ id: "old", child_id: "yp_b", plan_type_key: "pep", review_date: at(-40) }),
      ],
    });
    expect(r.overdue.map((p) => p.id)).toEqual(["old", "recent"]);
  });

  it("headline reflects all-in-date", () => {
    const r = computePlanCurrency({
      today: TODAY, children: CHILDREN, plan_types: TYPES,
      plans: [plan({ id: "1", child_id: "yp_a", plan_type_key: "pep", review_date: at(90) })],
    });
    expect(r.headline).toMatch(/All 1 plans are in date/);
  });

  it("is deterministic for a fixed today", () => {
    const plans = [plan({ id: "1", child_id: "yp_a", plan_type_key: "pep", review_date: at(-5) })];
    const a = computePlanCurrency({ today: TODAY, plans, children: CHILDREN, plan_types: TYPES });
    const b = computePlanCurrency({ today: TODAY, plans, children: CHILDREN, plan_types: TYPES });
    expect(a).toEqual(b);
  });
});
