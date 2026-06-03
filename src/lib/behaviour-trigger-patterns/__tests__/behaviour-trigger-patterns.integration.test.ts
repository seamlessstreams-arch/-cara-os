// Integration test: runs Behaviour Trigger & Escalation patterns against the REAL
// demo store seed (the same mapping the API route performs).
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import {
  computeBehaviourTriggerPatterns,
  type BehaviourChildRef,
  type BehaviourEntryInput,
} from "../behaviour-trigger-patterns-engine";

const d = (v: unknown, fb = ""): string => (v == null ? fb : v.toString().slice(0, 10));

describe("behaviour-trigger-patterns integration (real seed data)", () => {
  const store = getStore();

  const children: BehaviourChildRef[] = (store.youngPeople as any[])
    .filter((yp) => yp.status === "current")
    .map((yp) => ({ id: yp.id, name: yp.preferred_name || `${yp.first_name} ${yp.last_name}`.trim() }));
  const entries: BehaviourEntryInput[] = (store.behaviourLog as any[])
    .filter((b) => b.child_id)
    .map((b) => ({
      child_id: b.child_id,
      date: d(b.date ?? b.created_at),
      direction: b.direction ?? "concern",
      intensity: b.intensity ?? "low",
      trigger: b.trigger ?? "",
      antecedent: b.antecedent ?? "",
      strategy_used: b.strategy_used ?? "",
    }));

  const result = computeBehaviourTriggerPatterns({ children, entries });

  it("analyses children from the real behaviour log", () => {
    expect(entries.length).toBeGreaterThan(0);
    expect(result.children.length).toBeGreaterThan(0);
    expect(result.overview.children_analysed).toBe(result.children.length);
  });

  it("normalises the seed's 'concerning'/'medium' values and counts concerns", () => {
    // The seed uses direction "concerning" and intensity "medium"; the engine must
    // still recognise these as concerns with a valid intensity rank.
    expect(result.overview.total_concerning_90d).toBeGreaterThan(0);
  });

  it("produces a usable overview with home-wide triggers", () => {
    expect(Array.isArray(result.overview.top_home_triggers)).toBe(true);
    expect(typeof result.overview.avg_reinforcement_ratio).toBe("number");
  });
});
