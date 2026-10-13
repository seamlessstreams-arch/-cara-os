import { describe, it, expect } from "vitest";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import type { AskCaraSnapshot } from "@/lib/ask-cara/types";

// Mirrors the shape buildLiveAskSnapshot produces: the live-safe collections
// populated, the store-only ones empty. This checks the engine-reuse contract —
// that answerQuestion answers child-scoped questions from a PARTIAL (live-safe)
// snapshot without throwing.
function snap(over: Partial<AskCaraSnapshot> = {}): AskCaraSnapshot {
  return {
    children: [{ id: "yp_1", firstName: "Alex", name: "Alex River", dob: "2012-03-01", status: "current" }],
    staff: [],
    incidents: [],
    tasks: [],
    restraints: [],
    missingEpisodes: [],
    dailyLogs: [],
    medications: [],
    reviews: [],
    shifts: [],
    keyWork: [],
    contacts: [],
    supervisions: [],
    training: [],
    ...over,
  };
}

const VALID_LABELS = ["fact", "account", "analysis", "hypothesis", "action", "context"];

describe("notebook grounded Ask (engine reuse with a live-safe partial snapshot)", () => {
  it("answers a child-scoped question from a partial snapshot, with epistemic labels and sources", () => {
    const s = snap({
      incidents: [{ id: "i1", type: "missing_from_care", severity: "high", childId: "yp_1", date: "2026-10-05", status: "closed", requiresOversight: false, hasOversight: false }],
    });
    const a = answerQuestion({ question: "What incidents have there been for Alex?", asOf: "2026-10-13", snapshot: s, context: { childId: "yp_1" } });
    expect(a.answered).toBe(true);
    expect(a.labelled.every((l) => VALID_LABELS.includes(l.label))).toBe(true);
    expect(a.sources.length).toBeGreaterThan(0);
  });

  it("stays honest with no data — produces text, never throws", () => {
    const a = answerQuestion({ question: "How is Alex doing?", asOf: "2026-10-13", snapshot: snap(), context: { childId: "yp_1" } });
    expect(typeof a.text).toBe("string");
    expect(a.text.length).toBeGreaterThan(0);
  });

  it("accepts the partial live-safe shape without throwing", () => {
    expect(() => answerQuestion({ question: "What reviews are due for Alex?", asOf: "2026-10-13", snapshot: snap(), context: { childId: "yp_1" } })).not.toThrow();
  });
});
