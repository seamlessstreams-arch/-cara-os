import { describe, it, expect } from "vitest";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { getStore } from "@/lib/db/store";
import { answerPracticeQuestion, looksLikePracticeQuestion } from "@/lib/ask-cara/practice-knowledge";

const snap = buildAskSnapshot(getStore());
const ask = (q: string) => answerQuestion({ question: q, asOf: "2026-07-07", snapshot: snap, role: "registered_manager" });

describe("Ask CARA — practice knowledge fusion", () => {
  it("answers a framework question from the knowledge base, with a cited source", () => {
    for (const q of [
      "What does trauma-informed practice mean?",
      "What is the CARE model?",
      "How should I use PACE with a child?",
      "How do I respond to attachment difficulties?",
    ]) {
      const a = ask(q);
      expect(a.intent, q).toBe("practice_guidance");
      expect(a.answered, q).toBe(true);
      expect(a.sources.length, q).toBeGreaterThan(0);
      expect(a.text.length, q).toBeGreaterThan(80);
    }
  });

  it("names the framework it's grounded in", () => {
    expect(ask("What is the CARE model?").text.toLowerCase()).toContain("care");
    expect(ask("Tell me about contextual safeguarding").text.toLowerCase()).toContain("contextual");
  });

  it("does NOT hijack record questions", () => {
    expect(ask("How many restraints have no debrief?").intent).toBe("restraints");
    expect(ask("What's overdue?").intent).toBe("overdue_tasks");
    expect(ask("Who is placed here?").intent).toBe("children_list");
    expect(ask("What needs my attention?").intent).toBe("attention");
  });

  it("falls through (never fabricates) when the knowledge base has no match", () => {
    expect(answerPracticeQuestion("how do i win the lottery")).toBeNull();
    expect(ask("how do i win the lottery").intent).not.toBe("practice_guidance");
  });

  it("marker detector separates practice framing from record lookups", () => {
    expect(looksLikePracticeQuestion("how do i de-escalate a situation")).toBe(true);
    expect(looksLikePracticeQuestion("how many incidents this week")).toBe(false);
    expect(looksLikePracticeQuestion("what's overdue")).toBe(false);
  });
});
