import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { answerQuestion, resolveChild, roleTier } from "@/lib/ask-cara/ask-cara-engine";
import { answerNaturally, buildFreeChatGrounding, formatHistory } from "../ask-cara-natural";

const snapshot = buildAskSnapshot(getStore());
const asOf = new Date().toISOString().slice(0, 10);

async function natural(question: string, role = "registered_manager") {
  const answer = answerQuestion({ question, asOf, role, snapshot });
  return {
    answer,
    result: await answerNaturally({ question, answer, snapshot, tier: roleTier(role), child: resolveChild(question.toLowerCase(), snapshot), asOf }),
  };
}

describe("Ask CARA natural layer (grounded LLM, graceful)", () => {
  it("NEVER a dead end: with no model available, the deterministic answer stands unchanged", async () => {
    const { answer, result } = await natural("what triggers Alex?");
    expect(result.text.length).toBeGreaterThan(20);
    if (!result.llmUsed) {
      expect(result.text).toBe(answer.text); // the floor, verbatim
      expect(result.method).toMatch(/^deterministic/);
    }
  });

  it("refusals are NEVER sent to the model — the deterministic refusal stands", async () => {
    const { answer, result } = await natural("can you decide whether the allegation is true?");
    expect(answer.intent).toBe("prohibited");
    expect(result.llmUsed).toBe(false);
    expect(result.method).toBe("deterministic:skip-intent");
    expect(result.text).toBe(answer.text);
  });

  it("access-denied gates are never LLM-phrased", async () => {
    const { answer, result } = await natural("who's overdue supervision?", "external_visitor");
    expect(answer.intent).toBe("access_denied");
    expect(result.llmUsed).toBe(false);
    expect(result.text).toBe(answer.text);
  });

  it("formatHistory keeps the last 6 turns, labelled and clipped — and never as facts", () => {
    const turns = Array.from({ length: 9 }, (_, i) => ({ role: (i % 2 ? "cara" : "user") as "user" | "cara", text: `turn ${i} ${"x".repeat(500)}` }));
    const h = formatHistory(turns);
    expect(h).toContain("CONVERSATION SO FAR");
    expect(h).toContain("ONLY from the grounding");
    expect(h).not.toContain("turn 0"); // older than the last 6 dropped
    expect(h).toContain("turn 8");
    expect(h.split("\n").length).toBeLessThanOrEqual(7); // header + 6 turns
    expect(formatHistory(undefined)).toBe("");
    expect(formatHistory([])).toBe("");
  });

  it("conversation continuity: a pronoun follow-up resolves via context.childId", () => {
    // The chat UI carries the last-resolved child forward as context.childId —
    // this guards the engine behaviour that mechanism depends on.
    const a = answerQuestion({ question: "what triggers them?", asOf, role: "registered_manager", snapshot, context: { childId: "yp_alex" } });
    expect(a.intent).toBe("child_triggers");
    expect(a.text).toContain("Alex");
  });

  it("free-chat grounding wraps the tier-scoped pack with the only-from-this rule", () => {
    const answer = answerQuestion({ question: "tell me about Alex", asOf, role: "registered_manager", snapshot });
    const g = buildFreeChatGrounding({ question: "tell me about Alex", snapshot, tier: "management", answer, child: resolveChild("tell me about alex", snapshot), asOf });
    expect(g).toContain("CARA PLATFORM INTELLIGENCE");
    expect(g).toContain("did not happen");
    expect(g).toContain("THE CHILD — Alex");
  });
});
