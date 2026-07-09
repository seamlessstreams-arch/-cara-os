import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { answerQuestion, resolveChild, roleTier } from "@/lib/ask-cara/ask-cara-engine";
import { answerNaturally, buildFreeChatGrounding } from "../ask-cara-natural";

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

  it("free-chat grounding wraps the tier-scoped pack with the only-from-this rule", () => {
    const answer = answerQuestion({ question: "tell me about Alex", asOf, role: "registered_manager", snapshot });
    const g = buildFreeChatGrounding({ question: "tell me about Alex", snapshot, tier: "management", answer, child: resolveChild("tell me about alex", snapshot), asOf });
    expect(g).toContain("CARA PLATFORM INTELLIGENCE");
    expect(g).toContain("did not happen");
    expect(g).toContain("THE CHILD — Alex");
  });
});
