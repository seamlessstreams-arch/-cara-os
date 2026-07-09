import { describe, it, expect } from "vitest";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { getStore } from "@/lib/db/store";

const snap = buildAskSnapshot(getStore());
const ask = (q: string, role = "registered_manager") =>
  answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot: snap, role });

describe("Ask CARA — weekly summary consumes the CPIE Weekly Intelligence Object", () => {
  it("carries a weekly digest per current child on the snapshot", () => {
    expect(snap.weekly?.length ?? 0).toBeGreaterThanOrEqual(3);
    const alex = snap.weekly?.find((w) => w.childId === "yp_alex");
    expect(alex).toBeTruthy();
    expect(alex!.who.toLowerCase()).toContain("football");
  });

  it('answers "what should be in Alex\'s weekly summary?" from the object', () => {
    const a = ask("What should be in Alex's weekly summary?");
    expect(a.intent).toBe("weekly_summary");
    expect(a.answered).toBe(true);
    expect(a.text).toContain("weekly summary");
    expect(a.text.toLowerCase()).toContain("characterised by"); // the CPIE narrator's prose
    expect(a.text).toContain("Overall");
    // A drafting aid, not the record.
    expect(a.disclaimer?.toLowerCase()).toContain("remains the record");
  });

  it("recognises 'summarise the week for Alex' phrasing", () => {
    expect(ask("Summarise the week for Alex").intent).toBe("weekly_summary");
    expect(ask("Write up the week for Alex").intent).toBe("weekly_summary");
  });

  it("asks which child when none is named", () => {
    const a = ask("What should be in the weekly summary?");
    expect(a.intent).toBe("weekly_summary");
    expect(a.answered).toBe(false);
    expect(a.suggestions.length).toBeGreaterThan(0);
  });

  it("is role-gated to the care team", () => {
    expect(ask("What should be in Alex's weekly summary?", "external_visitor").intent).toBe("access_denied");
  });

  it("does not hijack neighbouring child skills", () => {
    expect(ask("What triggers Alex?").intent).toBe("child_triggers");
    expect(ask("How is Alex progressing?").intent).toBe("child_progress");
    expect(ask("Who is Alex?").intent).toBe("child_identity");
    expect(ask("Tell me about Alex").intent).toBe("child_summary");
  });
});
