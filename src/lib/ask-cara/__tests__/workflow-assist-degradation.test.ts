import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";

// Mirrors deterministicAssistText in /api/v1/cara/route.ts
function assist(question: string, pageContext?: string): string {
  const snapshot = buildAskSnapshot(getStore());
  const q = question.trim() || (pageContext ? `What needs my attention on ${pageContext}?` : "What needs my attention today?");
  return answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot, context: { pageTitle: pageContext } }).text;
}

describe("workflow assistant deterministic assist", () => {
  it("snapshot has real seeded data", () => {
    const snap = buildAskSnapshot(getStore());
    expect(snap.children.length).toBeGreaterThan(0);
    expect(snap.incidents.length).toBeGreaterThan(0);
  });
  it("answers workflow questions with substantive record-based text", () => {
    for (const q of ["what's overdue?", "who needs a review?", "what needs my attention today?", "what should I do after this incident?"]) {
      const text = assist(q);
      expect(text.length).toBeGreaterThan(40);
      expect(text.toLowerCase()).not.toContain("running on its deterministic engine"); // not the catch fallback
    }
  });
  it("falls back to a page-context question when prompt is empty", () => {
    const text = assist("", "Incidents");
    expect(text.length).toBeGreaterThan(40);
  });
});
