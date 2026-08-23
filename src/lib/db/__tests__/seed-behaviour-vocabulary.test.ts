import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import type { BehaviourDirection, BehaviourIntensity } from "@/types/extended";

// `store.behaviourLog` used to be assigned through a blanket `] as
// BehaviourEntry[]`, and 17 of its rows carried words the type does not admit:
// direction "concerning" (11 rows) where BehaviourDirection says "concern",
// and intensity "medium" (5) / "severe" (1) where BehaviourIntensity says
// "moderate" / "critical".
//
// It was invisible from every direction. The cast satisfied the compiler, the
// rows even carried `as const`, and the engines that consume behaviour keep
// their OWN vocabulary (concerning / medium / severe) so the wrong words read
// as plausible. What it broke was the code that trusted the type:
// behaviour-log/page.tsx counts `direction === "concern" && (intensity ===
// "high" || "critical")`. Measured against the seed, that tile read 5 where
// the truth is 9 — four serious concerning entries, including the one
// recorded as a self-harm attempt, invisible to the home's own counter.
//
// The cast is gone, so the compiler now checks these rows. This asserts the
// same thing at runtime, because the next blanket cast someone adds would
// take the compiler back out of the loop.

const DIRECTIONS: BehaviourDirection[] = ["positive", "concern"];
const INTENSITIES: BehaviourIntensity[] = ["low", "moderate", "high", "critical"];

describe("seeded behaviour log speaks the vocabulary its type declares", () => {
  it("has enough rows to be worth checking", () => {
    // Non-vacuity: an empty log would satisfy every assertion below.
    expect(getStore().behaviourLog.length).toBeGreaterThan(20);
  });

  it("uses only declared BehaviourDirection values", () => {
    const found = [...new Set(getStore().behaviourLog.map((b) => b.direction))].sort();
    expect(found).toEqual([...DIRECTIONS].sort());
  });

  it("uses only declared BehaviourIntensity values", () => {
    const found = new Set(getStore().behaviourLog.map((b) => b.intensity));
    for (const v of found) expect(INTENSITIES).toContain(v);
  });

  it("still records serious behaviour that the home's own counter can see", () => {
    // behaviour-log/page.tsx's high/critical tile reads exactly this.
    const serious = getStore().behaviourLog.filter(
      (b) => b.direction === "concern" && (b.intensity === "high" || b.intensity === "critical"),
    );
    expect(serious.length).toBeGreaterThan(0);
  });
});
