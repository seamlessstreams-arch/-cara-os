import { describe, it, expect } from "vitest";
import { buildActionCentre, type ActionCentreInput } from "../action-centre-engine";

const NOW = "2026-06-23T12:00:00.000Z";
const nameOf = (id: string) => ({ yp_alex: "Alex", yp_jordan: "Jordan" }[id] ?? "Child");

function input(over: Partial<ActionCentreInput> = {}): ActionCentreInput {
  return { now: NOW, reflections: [], childNameOf: nameOf, attention: [], ...over };
}

const reflection = (childId: string, actions: { id: string; description: string; owner: string; due_date: string | null; status: string }[]) =>
  ({ id: `pir_${childId}`, child_id: childId, actions }) as never;

describe("buildActionCentre", () => {
  it("reports nothing to do when empty", () => {
    const a = buildActionCentre(input());
    expect(a.total).toBe(0);
    expect(a.headline).toMatch(/up to date/i);
  });

  it("turns reflection actions into action items and marks overdue ones high", () => {
    const a = buildActionCentre(input({
      reflections: [reflection("yp_alex", [
        { id: "a1", description: "Update Staying Safe Plan", owner: "Key worker", due_date: "2026-06-01", status: "open" },
        { id: "a2", description: "Book reflective supervision", owner: "RM", due_date: "2026-12-01", status: "open" },
      ])],
    }));
    expect(a.total).toBe(2);
    const overdue = a.items.find((i) => i.id === "act_a1")!;
    expect(overdue.overdue).toBe(true);
    expect(overdue.priority).toBe("high");
    expect(overdue.child).toBe("Alex");
    expect(a.overdueCount).toBe(1);
    expect(a.openActions).toBe(2);
  });

  it("expands attention items per child", () => {
    const a = buildActionCentre(input({
      attention: [{ source: "Staying Safe Plans", label: "Children with no plan", why: "Every child needs a plan.", childNames: ["Jordan", "Casey"] }],
    }));
    expect(a.total).toBe(2);
    expect(a.items.every((i) => i.kind === "attention" && i.priority === "high")).toBe(true);
    expect(a.bySource[0].source).toBe("Staying Safe Plans");
  });

  it("sorts overdue actions before attention items", () => {
    const a = buildActionCentre(input({
      reflections: [reflection("yp_alex", [{ id: "a1", description: "Overdue thing", owner: "RM", due_date: "2026-05-01", status: "open" }])],
      attention: [{ source: "Rights & Restriction", label: "Review needed", why: "x", childNames: ["Jordan"] }],
    }));
    expect(a.items[0].overdue).toBe(true);
    expect(a.items[0].kind).toBe("action");
  });

  it("is deterministic", () => {
    const args = input({ reflections: [reflection("yp_alex", [{ id: "a1", description: "x", owner: "RM", due_date: null, status: "open" }])] });
    expect(buildActionCentre(args)).toEqual(buildActionCentre(args));
  });
});
