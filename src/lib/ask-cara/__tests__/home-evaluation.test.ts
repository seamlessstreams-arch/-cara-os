import { describe, it, expect } from "vitest";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { getStore } from "@/lib/db/store";

const snap = buildAskSnapshot(getStore());
const ask = (q: string, role = "registered_manager") =>
  answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot: snap, role });

describe("Ask CARA — home-level evaluation (inspection readiness)", () => {
  it("snapshot carries the home evaluation with the three SCCIF areas", () => {
    expect(snap.homeEvaluation).toBeTruthy();
    expect(snap.homeEvaluation!.areas.length).toBe(3);
  });

  it("answers 'are we ready for inspection?' with evidence posture, never a grade", () => {
    const a = ask("Are we ready for an Ofsted inspection?");
    expect(a.intent).toBe("inspection_readiness");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toContain("evidence");
    expect(a.text.toLowerCase()).toContain("not a prediction");
    // Grade-verdict phrases must never appear (readiness posture only).
    expect(a.text.toLowerCase()).not.toMatch(/likely to be judged|would be graded|predicted grade|you would get/);
    expect(a.sources.length).toBeGreaterThan(0);
  });

  it("is management-gated", () => {
    const a = ask("Are we inspection ready?", "residential_care_worker");
    expect(a.intent).toBe("access_denied");
  });

  it("home overview now includes the engines' read", () => {
    const a = ask("How is the home doing?");
    expect(a.intent).toBe("home_overview");
    expect(a.text).toContain("My read from the engines");
    expect(a.text.toLowerCase()).toContain("inspection evidence");
  });

  it("keeps ordering: policy question about inspections still wins", () => {
    const a = ask("What does our policy say about inspections?");
    expect(a.intent).toBe("policy_guidance");
  });

  it("does not disturb other skills", () => {
    expect(ask("What triggers Alex?").intent).toBe("child_triggers");
    expect(ask("What is the CARE model?").intent).toBe("practice_guidance");
    expect(ask("What needs my attention?").intent).toBe("attention");
  });
});
