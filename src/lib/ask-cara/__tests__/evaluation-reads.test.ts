import { describe, it, expect } from "vitest";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { getStore } from "@/lib/db/store";

const snap = buildAskSnapshot(getStore());
const ask = (q: string, role = "registered_manager") =>
  answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot: snap, role });

describe("Ask CARA — evaluation reads (leg three)", () => {
  it("snapshot carries evaluations computed from the engines", () => {
    expect(snap.evaluations?.length ?? 0).toBeGreaterThan(0);
    const withAny = (snap.evaluations ?? []).filter((e) => e.outcome || e.emotional || e.relational);
    expect(withAny.length).toBeGreaterThan(0);
  });

  it("answers 'what triggers X?' from the emotional-safety engine", () => {
    const a = ask("What triggers Alex?");
    expect(a.intent).toBe("child_triggers");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toContain("emotional safety");
    expect(a.sources.length).toBeGreaterThan(0);
  });

  it("answers relationship questions from the relational timeline", () => {
    const a = ask("How are Alex's relationships?");
    expect(a.intent).toBe("child_relationships");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toContain("relational safety");
  });

  it("answers progress questions from the outcome engine", () => {
    const a = ask("How is Alex progressing?");
    expect(a.intent).toBe("child_progress");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toMatch(/improving|stable|declining/);
  });

  it("gives a home-level progress rollup when no child is named", () => {
    const a = ask("Is anyone making progress?");
    expect(a.intent).toBe("child_progress");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toContain("across the home");
  });

  it("child summary now includes the engines' read", () => {
    const a = ask("Tell me about Alex");
    expect(a.intent).toBe("child_summary");
    expect(a.text).toContain("My read from the engines");
  });

  it("does not disturb existing record skills", () => {
    expect(ask("What's overdue?").intent).toBe("overdue_tasks");
    expect(ask("How is the home doing?").intent).toBe("home_overview");
    expect(ask("What needs my attention?").intent).toBe("attention");
    expect(ask("What is the CARE model?").intent).toBe("practice_guidance");
  });

  it("evaluation reads are role-gated to the care team", () => {
    const a = ask("What triggers Alex?", "external_visitor");
    expect(a.intent).toBe("access_denied");
  });
});
