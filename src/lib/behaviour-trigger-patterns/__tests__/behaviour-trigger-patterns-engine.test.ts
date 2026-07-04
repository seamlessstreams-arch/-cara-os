import { describe, it, expect } from "vitest";
import {
  computeBehaviourTriggerPatterns,
  isConcern, intensityRank, normaliseTrigger, daysAgo,
  type BehaviourPatternInput,
  type BehaviourEntryInput,
} from "../behaviour-trigger-patterns-engine";

const TODAY = "2026-06-02";
function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const ago = (n: number) => addDays(TODAY, -n);

const entry = (o: Partial<BehaviourEntryInput> & { child_id: string }): BehaviourEntryInput => ({
  date: ago(5), direction: "concern", intensity: "moderate", trigger: "", antecedent: "", strategy_used: "", ...o,
});
function run(p: Partial<BehaviourPatternInput>): BehaviourPatternInput {
  return { children: [], entries: [], today: TODAY, ...p };
}

// ══════════════════════════════════════════════════════════════════════════════
describe("normalisation helpers", () => {
  it("treats concern/concerning as a concern", () => {
    expect(isConcern("concern")).toBe(true);
    expect(isConcern("concerning")).toBe(true);
    expect(isConcern("positive")).toBe(false);
  });
  it("ranks intensity with medium == moderate", () => {
    expect(intensityRank("low")).toBe(1);
    expect(intensityRank("medium")).toBe(2);
    expect(intensityRank("moderate")).toBe(2);
    expect(intensityRank("high")).toBe(3);
    expect(intensityRank("critical")).toBe(4);
  });
  it("ranks the legacy 'severe' vocabulary at the top — regression: it fell through to 1 (below 'low'), silently flattening genuine escalation in trajectory math", () => {
    expect(intensityRank("severe")).toBe(4);
    expect(intensityRank("SEVERE")).toBe(4);
  });
  it("normalises triggers for grouping", () => {
    expect(normaliseTrigger("  Family   Contact ")).toBe("family contact");
  });
  it("daysAgo counts whole days", () => {
    expect(daysAgo(ago(7), TODAY)).toBe(7);
  });
});

describe("empty input", () => {
  const r = computeBehaviourTriggerPatterns(run({}));
  it("returns no children and a zeroed overview", () => {
    expect(r.children).toHaveLength(0);
    expect(r.overview.children_analysed).toBe(0);
    expect(r.alerts).toHaveLength(0);
  });
});

describe("escalating child with a recurring trigger and unsupported high-intensity incident", () => {
  const A = "a";
  const r = computeBehaviourTriggerPatterns(run({
    children: [{ id: A, name: "Alex" }],
    entries: [
      entry({ child_id: A, date: ago(50), intensity: "low", trigger: "family contact" }),
      entry({ child_id: A, date: ago(45), intensity: "moderate", trigger: "Family Contact" }),
      entry({ child_id: A, date: ago(10), intensity: "high", trigger: "family contact", strategy_used: "" }),
      entry({ child_id: A, date: ago(5), intensity: "critical", trigger: "gaming", strategy_used: "Low-arousal approach" }),
      entry({ child_id: A, date: ago(8), direction: "positive", intensity: "low", trigger: "" }),
    ],
  }));
  const c = r.children[0];

  it("detects an escalating intensity trajectory", () => {
    expect(c.intensity_trajectory).toBe("escalating");
  });
  it("surfaces the recurring trigger (case/space-insensitive grouping)", () => {
    expect(c.top_triggers[0].trigger.toLowerCase()).toContain("family contact");
    expect(c.top_triggers[0].count).toBe(3);
  });
  it("measures de-escalation strategy coverage and unsupported high-intensity incidents", () => {
    expect(c.strategy_coverage_pct).toBe(25); // 1 of 4 concerning has a strategy
    expect(c.high_intensity_unsupported).toBe(1); // the ago(10) high incident
  });
  it("scores a high/critical concern and raises a critical alert + insight", () => {
    expect(["high", "critical"]).toContain(c.concern_level);
    expect(r.alerts.some((a) => a.severity === "critical" || a.severity === "high")).toBe(true);
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });
  it("recommends updating the behaviour support plan", () => {
    expect(c.recommended_actions.some((a) => /behaviour support plan/i.test(a.action))).toBe(true);
  });
});

describe("reinforcement balance", () => {
  it("computes a positive-to-concerning ratio and flags imbalance", () => {
    const r = computeBehaviourTriggerPatterns(run({
      children: [{ id: "b", name: "Bo" }],
      entries: [
        entry({ child_id: "b", date: ago(5), intensity: "low", trigger: "noise" }),
        entry({ child_id: "b", date: ago(12), intensity: "low", trigger: "noise" }),
      ],
    }));
    const c = r.children[0];
    expect(c.positive_90d).toBe(0);
    expect(c.reinforcement_ratio).toBe(0);
    expect(c.flags.some((f) => /reinforcement may be imbalanced/i.test(f))).toBe(true);
  });
});

describe("home-wide triggers and overview", () => {
  const r = computeBehaviourTriggerPatterns(run({
    children: [{ id: "a", name: "Alex" }, { id: "b", name: "Bo" }],
    entries: [
      entry({ child_id: "a", date: ago(5), trigger: "transitions" }),
      entry({ child_id: "a", date: ago(15), trigger: "transitions" }),
      entry({ child_id: "b", date: ago(8), trigger: "transitions" }),
      entry({ child_id: "b", date: ago(20), trigger: "noise" }),
    ],
  }));
  it("aggregates the most common home-wide trigger", () => {
    expect(r.overview.top_home_triggers[0].trigger.toLowerCase()).toBe("transitions");
    expect(r.overview.top_home_triggers[0].count).toBe(3);
  });
  it("counts children and total concerning entries", () => {
    expect(r.overview.children_analysed).toBe(2);
    expect(r.overview.total_concerning_90d).toBe(4);
  });
  it("orders children by concern score (highest first)", () => {
    for (let i = 1; i < r.children.length; i++) {
      expect(r.children[i - 1].concern_score).toBeGreaterThanOrEqual(r.children[i].concern_score);
    }
  });
});

describe("positive cohort", () => {
  it("emits a positive insight when nothing is escalating or high-concern", () => {
    const r = computeBehaviourTriggerPatterns(run({
      children: [{ id: "a", name: "Alex" }],
      entries: [
        entry({ child_id: "a", date: ago(5), direction: "positive", intensity: "low" }),
        entry({ child_id: "a", date: ago(20), direction: "positive", intensity: "low" }),
        entry({ child_id: "a", date: ago(15), intensity: "low", trigger: "noise", strategy_used: "redirection" }),
      ],
    }));
    expect(r.children[0].concern_level).toBe("low");
    expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const input = run({
      children: [{ id: "a", name: "Alex" }],
      entries: [entry({ child_id: "a", date: ago(5), trigger: "noise", strategy_used: "redirection" })],
    });
    const x = computeBehaviourTriggerPatterns(input);
    const y = computeBehaviourTriggerPatterns(input);
    expect(JSON.stringify(x)).toBe(JSON.stringify(y));
  });
});
