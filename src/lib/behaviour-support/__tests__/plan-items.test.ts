import { describe, it, expect } from "vitest";
import {
  toBehaviours, toTriggers, toStages, toStrategies, toSafetyItems,
  isBehaviourComplete, isSafetyItemComplete, incompleteCount, toList,
} from "@/lib/behaviour-support/plan-items";

describe("BSP clinical items — a half-answered row must not become a record", () => {
  it("keeps a complete behaviour and drops one missing its severity", () => {
    const rows = [
      { behaviour: "Hitting out at bedtime", frequency: "weekly" as const, severity: "high" as const, trend: "stable" as const },
      { behaviour: "Leaving the house at night", frequency: "rare" as const, trend: "improving" as const }, // no severity
    ];
    expect(toBehaviours(rows)).toEqual([
      { behaviour: "Hitting out at bedtime", frequency: "weekly", severity: "high", trend: "stable" },
    ]);
  });

  it("never invents the missing enum — the dropped row is simply absent", () => {
    // This is the whole point: #930 could not wire these fields because
    // guessing severity/trend states an assessment nobody made.
    const out = toBehaviours([{ behaviour: "Shouting" }]);
    expect(out).toEqual([]);
  });

  it("drops a trigger without a category or likelihood", () => {
    expect(toTriggers([
      { trigger: "Unannounced visitors", category: "social", likelihood: "high" },
      { trigger: "Loud noise" },
    ])).toEqual([{ trigger: "Unannounced visitors", category: "social", likelihood: "high" }]);
  });

  it("splits a stage's strategies into a list and requires a staff approach", () => {
    expect(toStages([
      { stage: "amber", strategies: "Offer space, Lower voice\nReduce demands", staff_approach: "One familiar adult only" },
      { stage: "red", strategies: "Clear the area" }, // no staff_approach
    ])).toEqual([
      { stage: "amber", strategies: ["Offer space", "Lower voice", "Reduce demands"], staff_approach: "One familiar adult only" },
    ]);
  });

  it("requires an effectiveness rating on a positive strategy", () => {
    expect(toStrategies([
      { strategy: "Evening walk", frequency: "daily", effectiveness: "effective" },
      { strategy: "Reward chart", frequency: "weekly" },
    ])).toEqual([{ strategy: "Evening walk", frequency: "daily", effectiveness: "effective" }]);
  });

  it("requires at least one member of staff on a safety response", () => {
    expect(isSafetyItemComplete({ scenario: "Leaves the building", response: "Follow at distance", staff_required: "0" })).toBe(false);
    expect(toSafetyItems([
      { scenario: "Leaves the building", response: "Follow at distance, call manager", staff_required: "2" },
    ])).toEqual([{ scenario: "Leaves the building", response: "Follow at distance, call manager", staff_required: 2 }]);
  });

  it("trims text but does not accept whitespace as an answer", () => {
    expect(isBehaviourComplete({ behaviour: "   ", frequency: "daily", severity: "low", trend: "stable" })).toBe(false);
    expect(toBehaviours([{ behaviour: "  Kicking doors  ", frequency: "daily", severity: "low", trend: "stable" }]))
      .toEqual([{ behaviour: "Kicking doors", frequency: "daily", severity: "low", trend: "stable" }]);
  });

  it("counts started-but-unfinished rows so the user is told, not silently ignored", () => {
    const n = incompleteCount(
      [{ behaviour: "Shouting" }],                 // started, incomplete
      [{}],                                        // untouched — not counted
      [{ stage: "green" }],                        // started, incomplete
      [],
      [{ scenario: "Refuses to come in", response: "", staff_required: "" }], // started
    );
    expect(n).toBe(3);
  });

  it("toList tolerates commas, newlines and stray blanks", () => {
    expect(toList("a, b\n\n c ,,")).toEqual(["a", "b", "c"]);
  });
});
