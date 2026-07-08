import { describe, it, expect } from "vitest";
import { getChildTwin } from "@/lib/cpie/get-child-twin";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { getStore } from "@/lib/db/store";

const ask = (q: string, role = "registered_manager") =>
  answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot: buildAskSnapshot(getStore()), role });

describe("CPIE — Professional Curiosity synthesis", () => {
  it("synthesises cross-dimension reflective questions for Alex", () => {
    const t = getChildTwin("yp_alex")!;
    expect(t.curiosity.data.reflectiveQuestions.length).toBeGreaterThan(0);
    // Alex: ruptures outpace repairs → a repair-focused question should surface.
    expect(t.curiosity.data.reflectiveQuestions.join(" ").toLowerCase()).toContain("repair");
  });

  it("never diagnoses — every item is a question or a 'worth noticing', not a verdict", () => {
    const t = getChildTwin("yp_alex")!;
    const all = [...t.curiosity.data.reflectiveQuestions, ...t.curiosity.data.noticedPatterns].join(" ").toLowerCase();
    expect(all).not.toMatch(/\b(diagnos|has adhd|is autistic|suffers from|disorder|attachment disorder)\b/);
    // Questions are genuinely questions.
    expect(t.curiosity.data.reflectiveQuestions.some((q) => q.includes("?"))).toBe(true);
  });

  it("always offers something to reflect on, even for a sparse child (Casey)", () => {
    const t = getChildTwin("yp_casey")!;
    expect(t.curiosity.data.reflectiveQuestions.length).toBeGreaterThan(0);
    // Sparse record → curiosity about the missing childhood / voice.
    expect(t.curiosity.data.reflectiveQuestions.join(" ").toLowerCase()).toMatch(/childhood|voice|assuming|need/);
  });

  it("does not disturb the existing twin dimensions", () => {
    const t = getChildTwin("yp_alex")!;
    expect(t.identity.data.interests.length).toBeGreaterThan(0);
    expect(t.goodParenting.data.signalsPresent.length).toBeGreaterThan(0);
  });
});

describe("CPIE — the existing reflector is now grounded in the twin (route, don't rebuild)", () => {
  it("weaves the twin's noticed patterns + questions into 'help me reflect on Alex'", () => {
    const a = ask("Help me reflect on Alex");
    expect(a.intent).toBe("reflector");
    expect(a.text).toContain("What CARA notices across Alex's whole picture");
    expect(a.text).toContain("Questions worth sitting with");
    expect(a.disclaimer?.toLowerCase()).toContain("never diagnoses");
  });

  it("still answers a generic (no-child) reflection", () => {
    const a = ask("Help me reflect");
    expect(a.intent).toBe("reflector");
    expect(a.answered).toBe(true);
  });

  it("reflector remains everyone-tier (a support worker can reflect)", () => {
    expect(ask("Help me reflect on Alex", "residential_care_worker").intent).toBe("reflector");
  });

  it("does not hijack neighbouring skills", () => {
    expect(ask("Who is Alex?").intent).toBe("child_identity");
    expect(ask("What triggers Alex?").intent).toBe("child_triggers");
    expect(ask("What needs my attention?").intent).toBe("attention");
  });
});
