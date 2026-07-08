import { describe, it, expect } from "vitest";
import { getChildTwin, getAllChildTwins } from "@/lib/cpie/get-child-twin";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { getStore } from "@/lib/db/store";

const ask = (q: string, role = "registered_manager") =>
  answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot: buildAskSnapshot(getStore()), role });

describe("CPIE — Digital Twin (slice 1)", () => {
  it("builds a whole-child twin for Alex from his records and his own words", () => {
    const t = getChildTwin("yp_alex");
    expect(t).toBeTruthy();
    expect(t!.identity.data.interests).toContain("Football");
    expect(t!.identity.confidence).not.toBe("none");
    expect(t!.strengths.data.achievements.length).toBeGreaterThan(0);
    expect(t!.aspirations.data.aspirations.some((a) => a.aspiration.toLowerCase().includes("coach"))).toBe(true);
    expect(t!.lifeStory.data.memories.some((m) => !!m.childVoice)).toBe(true);
    expect(t!.emotional.data.triggers.length).toBeGreaterThan(0);
  });

  it("every conclusion is traceable: dimensions carry evidence + confidence", () => {
    const t = getChildTwin("yp_alex")!;
    expect(t.strengths.evidence.length).toBeGreaterThan(0);
    expect(t.strengths.evidence.every((e) => e.weight >= 1)).toBe(true);
    expect(["high", "moderate", "low", "none"]).toContain(t.livedExperience.confidence);
  });

  it("significance beats frequency: a celebrated achievement outweighs a routine entry", () => {
    const t = getChildTwin("yp_alex")!;
    const celebrated = t.strengths.evidence.find((e) => e.note?.includes("Winning goal"));
    expect(celebrated?.weight).toBe(4); // 3 + celebrated bonus
  });

  it("missing information is first-class intelligence (sparse child has honest gaps)", () => {
    const t = getChildTwin("yp_casey");
    expect(t).toBeTruthy();
    expect(t!.missingInformation.length).toBeGreaterThan(0);
    expect(t!.missingInformation.join(" ").toLowerCase()).toContain("aspiration");
  });

  it("the chokepoint memoises until the child's world changes", () => {
    const a = getChildTwin("yp_alex");
    const b = getChildTwin("yp_alex");
    expect(b).toBe(a); // same object — no rebuild without a store change
    const store = getStore();
    store.positiveAchievements.push({
      id: "pach_test_1", child_id: "yp_alex", date: new Date().toISOString().slice(0, 10),
      category: "social", title: "Test entry", description: "t", recorded_by: "t", shared_with: [], celebrated_how: "", child_reaction: "",
    } as (typeof store.positiveAchievements)[number]);
    const c = getChildTwin("yp_alex");
    expect(c).not.toBe(a); // the twin evolved with the new record
    store.positiveAchievements.pop();
  });

  it("returns twins for all current children", () => {
    expect(getAllChildTwins().length).toBeGreaterThanOrEqual(3);
  });
});

describe("CPIE — Ask CARA consumes the twin", () => {
  it('"Who is Alex?" answers with identity, not incidents', () => {
    const a = ask("Who is Alex?");
    expect(a.intent).toBe("child_identity");
    expect(a.answered).toBe(true);
    expect(a.text).toContain("Football");
    expect(a.text.toLowerCase()).not.toContain("incident");
  });

  it("answers strengths/aspiration questions from the twin", () => {
    expect(ask("What is Alex good at?").intent).toBe("child_identity");
    expect(ask("What are Alex's aspirations?").text.toLowerCase()).toContain("coach");
  });

  it("keeps contact questions routed to contacts", () => {
    expect(ask("Who is Alex's social worker?").intent).toBe("contacts");
  });

  it("keeps trigger questions routed to the trigger read", () => {
    expect(ask("What triggers Alex?").intent).toBe("child_triggers");
  });

  it("child summary now opens with who the child is", () => {
    const a = ask("Tell me about Alex");
    expect(a.intent).toBe("child_summary");
    expect(a.text).toContain("Who Alex is:");
  });

  it("no regressions on core skills", () => {
    expect(ask("What needs my attention?").intent).toBe("attention");
    expect(ask("Are we ready for inspection?").intent).toBe("inspection_readiness");
    expect(ask("What is the CARE model?").intent).toBe("practice_guidance");
  });
});
