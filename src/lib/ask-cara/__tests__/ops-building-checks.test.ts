import { describe, it, expect } from "vitest";
import { buildAskSnapshot } from "../build-snapshot";
import { getStore } from "@/lib/db/store";

// `buildOpsIntelligence` read `rows("buildingSafetyChecks")` — a collection the
// store does not have — so it always saw an empty list and Cara never reported
// an overdue building-safety check or an action arising from one. The real
// collection is `buildingChecks`. The `rows` key is now typed to the store's
// own collections, so a phantom name is a compile error rather than silence.

describe("ops intelligence reads the building checks the store actually holds", () => {
  it("the seed records building checks — otherwise this proves nothing", () => {
    expect(getStore().buildingChecks.length).toBeGreaterThan(0);
  });

  it("surfaces an overdue check or an action required from one", () => {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);
    const done = (v: unknown) =>
      ["completed", "closed", "resolved", "done"].includes(String(v ?? "").toLowerCase());

    const expectedOverdue = store.buildingChecks.filter(
      (c) => c.due_date && String(c.due_date).slice(0, 10) < today && !done(c.status),
    ).length;
    const expectedActions = store.buildingChecks.filter(
      (c) => c.action_required && !done(c.status),
    ).length;
    // Non-vacuity: the seed must give this test something to find.
    expect(expectedOverdue + expectedActions).toBeGreaterThan(0);

    const ops = buildAskSnapshot(store).ops;
    expect(ops).toBeTruthy();
    const found =
      (ops?.healthSafety.overdue.length ?? 0) + (ops?.healthSafety.actionRequired.length ?? 0);
    expect(found).toBeGreaterThan(0);
  });
});
