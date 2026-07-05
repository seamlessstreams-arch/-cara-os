// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABC BEHAVIOUR ENGINE TESTS · §16
//
// Pins: A→B→C chains aggregate (case-insensitively via the shared normaliser);
// containment counts high/critical as NOT contained; strategy containedRate;
// missing-A / missing-C recording signals; frequency ordering.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildABCProfiles } from "../abc-behaviour-engine";
import type { ABCBehaviourInput, ABCEntryInput } from "../types";

const entry = (o: Partial<ABCEntryInput> = {}): ABCEntryInput => ({
  childId: "yp_alex",
  date: "2026-07-01",
  antecedent: "Phone call with family",
  trigger: "",
  direction: "concern",
  intensity: "high",
  strategy: "Offered quiet space",
  ...o,
});

const run = (entries: ABCEntryInput[], children = [{ id: "yp_alex", name: "Alex" }]) =>
  buildABCProfiles({ homeId: "home_oak", asOf: "2026-07-05", children, entries } as ABCBehaviourInput);

describe("chain building", () => {
  it("aggregates identical A→B→C chains and counts occurrences", () => {
    const r = run([entry(), entry(), entry({ strategy: "Redirected to activity" })]);
    const p = r.children[0];
    const top = p.chains[0];
    expect(top.count).toBe(2); // two identical phone-call → high concern → quiet space
    expect(top.antecedent).toBe("Phone call with family");
    expect(top.consequence).toBe("Offered quiet space");
    expect(p.chains).toHaveLength(2);
  });

  it("groups antecedents case-insensitively (shared normaliser)", () => {
    const r = run([entry({ antecedent: "Phone call" }), entry({ antecedent: "phone   call" })]);
    // Both normalise to the same antecedent → one chain of count 2.
    expect(r.children[0].antecedents).toHaveLength(1);
    expect(r.children[0].chains[0].count).toBe(2);
  });
});

describe("containment", () => {
  it("counts low/moderate/positive as contained and high/critical as not", () => {
    const r = run([
      entry({ intensity: "low" }),
      entry({ intensity: "moderate" }),
      entry({ intensity: "high" }),
      entry({ intensity: "critical" }),
      entry({ direction: "positive", intensity: "high" }), // positive overrides
    ]);
    const contained = r.children[0].chains.reduce((s, c) => s + c.containedCount, 0);
    expect(contained).toBe(3); // low, moderate, positive
  });

  it("computes a strategy containment rate", () => {
    const r = run([
      entry({ strategy: "De-escalation script", intensity: "low" }),
      entry({ strategy: "De-escalation script", intensity: "high" }),
    ]);
    const s = r.children[0].strategies.find((x) => x.strategy === "De-escalation script");
    expect(s?.uses).toBe(2);
    expect(s?.containedRate).toBe(50);
  });
});

describe("behaviour labels", () => {
  it("labels by direction and intensity band", () => {
    const r = run([entry({ intensity: "high" }), entry({ direction: "positive", intensity: "low" })]);
    const labels = r.children[0].behaviours.map((b) => b.label);
    expect(labels).toContain("High-level concern");
    expect(labels).toContain("Positive behaviour");
  });
});

describe("recording-quality signals", () => {
  it("reports the share of episodes missing an antecedent or a strategy", () => {
    const r = run([
      entry({ antecedent: "", trigger: "", strategy: "" }),
      entry({ antecedent: "Told no", strategy: "Talked it through" }),
    ]);
    expect(r.children[0].unrecordedAntecedentRate).toBe(50);
    expect(r.children[0].unrecordedStrategyRate).toBe(50);
  });
});

describe("ordering and shape", () => {
  it("orders children by episode count and chains by frequency", () => {
    const r = run(
      [entry({ childId: "yp_alex" }), entry({ childId: "yp_alex" }), entry({ childId: "yp_casey" })],
      [{ id: "yp_alex", name: "Alex" }, { id: "yp_casey", name: "Casey" }]
    );
    expect(r.children[0].childId).toBe("yp_alex"); // more episodes first
    expect(r.summary.totalEpisodes).toBe(3);
    expect(r.disclaimer).toMatch(/not a judgement or a prediction/i);
  });

  it("returns no children for no entries", () => {
    expect(run([]).children).toEqual([]);
  });
});
