import { describe, it, expect } from "vitest";
import { computeActionsRegister, type ActionInput } from "../actions-register-engine";

const TODAY = "2026-06-09";

function action(p: Partial<ActionInput> & { id: string }): ActionInput {
  return {
    text: p.text ?? "Do the thing",
    source: p.source ?? "Supervision",
    source_key: p.source_key ?? "supervision",
    owner: p.owner,
    child_id: p.child_id,
    child_name: p.child_name,
    due_date: p.due_date,
    status_raw: p.status_raw,
    done: p.done ?? false,
    id: p.id,
    source_href: p.source_href,
  };
}

describe("computeActionsRegister", () => {
  it("returns an empty summary + headline when there are no actions", () => {
    const r = computeActionsRegister({ today: TODAY, actions: [] });
    expect(r.summary.total).toBe(0);
    expect(r.summary.open).toBe(0);
    expect(r.actions).toHaveLength(0);
    expect(r.headline).toMatch(/No agreed actions/);
  });

  it("classifies urgency from due date (overdue / due_soon / scheduled / no_date)", () => {
    const r = computeActionsRegister({
      today: TODAY,
      actions: [
        action({ id: "a", due_date: "2026-06-01" }), // overdue (8 days ago)
        action({ id: "b", due_date: "2026-06-12" }), // due soon (3 days)
        action({ id: "c", due_date: "2026-07-30" }), // scheduled (far)
        action({ id: "d" }),                          // no date
      ],
    });
    const byId = Object.fromEntries(r.actions.map((a) => [a.id, a.urgency]));
    expect(byId["a"]).toBe("overdue");
    expect(byId["b"]).toBe("due_soon");
    expect(byId["c"]).toBe("scheduled");
    expect(byId["d"]).toBe("no_date");
    expect(r.summary.overdue).toBe(1);
    expect(r.summary.due_soon).toBe(1);
    expect(r.summary.no_date).toBe(1);
  });

  it("excludes done actions from the open list but counts them + completion_rate", () => {
    const r = computeActionsRegister({
      today: TODAY,
      actions: [
        action({ id: "a", done: true }),
        action({ id: "b", done: true }),
        action({ id: "c", due_date: "2026-06-01" }),
      ],
    });
    expect(r.summary.total).toBe(3);
    expect(r.summary.done).toBe(2);
    expect(r.summary.open).toBe(1);
    expect(r.summary.completion_rate).toBe(67);
    expect(r.actions.map((a) => a.id)).toEqual(["c"]); // only the open one
  });

  it("ranks open actions overdue → due_soon → scheduled → no_date, most overdue first", () => {
    const r = computeActionsRegister({
      today: TODAY,
      actions: [
        action({ id: "nodate" }),
        action({ id: "scheduled", due_date: "2026-08-01" }),
        action({ id: "duesoon", due_date: "2026-06-11" }),
        action({ id: "overdue_recent", due_date: "2026-06-06" }),
        action({ id: "overdue_old", due_date: "2026-05-01" }),
      ],
    });
    expect(r.actions.map((a) => a.id)).toEqual([
      "overdue_old", "overdue_recent", "duesoon", "scheduled", "nodate",
    ]);
  });

  it("rolls up by owner, ranked by overdue then open, Unassigned for missing owner", () => {
    const r = computeActionsRegister({
      today: TODAY,
      actions: [
        action({ id: "a", owner: "Olivia Hayes", due_date: "2026-05-01" }), // overdue
        action({ id: "b", owner: "Olivia Hayes", due_date: "2026-07-01" }), // scheduled
        action({ id: "c", owner: "Marcus Bell", due_date: "2026-07-01" }),  // scheduled
        action({ id: "d", done: true, owner: "Marcus Bell" }),              // done (excluded)
        action({ id: "e" }),                                                 // unassigned
      ],
    });
    const olivia = r.by_owner.find((o) => o.owner === "Olivia Hayes")!;
    expect(olivia.open).toBe(2);
    expect(olivia.overdue).toBe(1);
    expect(r.by_owner[0].owner).toBe("Olivia Hayes"); // most overdue first
    expect(r.by_owner.some((o) => o.owner === "Unassigned")).toBe(true);
    expect(r.by_owner.find((o) => o.owner === "Marcus Bell")!.open).toBe(1); // done excluded
  });

  it("rolls up by source", () => {
    const r = computeActionsRegister({
      today: TODAY,
      actions: [
        action({ id: "a", source: "LAC review", source_key: "lac_review", due_date: "2026-05-01" }),
        action({ id: "b", source: "Incident oversight", source_key: "incident", due_date: "2026-07-01" }),
      ],
    });
    expect(r.by_source).toHaveLength(2);
    expect(r.by_source[0].source_key).toBe("lac_review"); // has the overdue
    expect(r.by_source[0].overdue).toBe(1);
  });

  it("headline reflects all-complete and open states", () => {
    const allDone = computeActionsRegister({ today: TODAY, actions: [action({ id: "a", done: true })] });
    expect(allDone.headline).toMatch(/All 1 agreed actions are complete/);
    const someOpen = computeActionsRegister({ today: TODAY, actions: [action({ id: "a", due_date: "2026-05-01" }), action({ id: "b", done: true })] });
    expect(someOpen.headline).toMatch(/1 open action — 1 overdue/);
    expect(someOpen.headline).toMatch(/50% of all agreed actions completed/);
  });

  it("is deterministic for a fixed today", () => {
    const acts = [action({ id: "a", due_date: "2026-06-01" }), action({ id: "b" })];
    expect(computeActionsRegister({ today: TODAY, actions: acts })).toEqual(computeActionsRegister({ today: TODAY, actions: acts }));
  });
});
