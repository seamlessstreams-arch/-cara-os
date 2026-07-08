import { describe, it, expect } from "vitest";
import { getChildTwin } from "@/lib/cpie/get-child-twin";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { getStore } from "@/lib/db/store";
import { mentionsAny } from "@/lib/text/keyword-match";

const ask = (q: string, role = "registered_manager") =>
  answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot: buildAskSnapshot(getStore()), role });

describe("CPIE — Good Parenting / Lived Experience dimension", () => {
  it("reads a rich childhood for Alex (movie night, swimming, guitar) as good parenting", () => {
    const t = getChildTwin("yp_alex")!;
    const gp = t.goodParenting.data;
    expect(gp.livedExperienceRead.toLowerCase()).toContain("childhood");
    expect(gp.signalsPresent.some((p) => p.label === "Ordinary childhood")).toBe(true);
    expect(gp.signalsPresent.some((p) => p.label === "Fun & laughter")).toBe(true);
    expect(t.goodParenting.confidence).not.toBe("none");
  });

  it("surfaces thin markers as prompts, not blame (Alex is thin on warmth)", () => {
    const t = getChildTwin("yp_alex")!;
    // Alex's logs are activity-rich but not physically affectionate — honestly flagged.
    expect(t.goodParenting.data.signalsThin.join(" ").toLowerCase()).toContain("warmth");
  });

  it("flags a sparse child honestly (Casey — care delivered more than childhood lived)", () => {
    const t = getChildTwin("yp_casey")!;
    expect(t.goodParenting.data.signalsPresent.length).toBe(0);
    expect(t.goodParenting.data.livedExperienceRead.toLowerCase()).toContain("care delivered more than a childhood");
    expect(t.goodParenting.confidence).toBe("none");
  });

  it("detection is word-boundary safe (no substring false positives)", () => {
    // The engine relies on mentionsAny — prove the traps stay shut.
    expect(mentionsAny("we discussed the funeral", ["fun"])).toBe(false);
    expect(mentionsAny("the sparkling water", ["park"])).toBe(false);
    expect(mentionsAny("the walkway was clear", ["walk"])).toBe(false);
  });

  it("does not disturb the existing twin (all dimensions still build)", () => {
    const t = getChildTwin("yp_alex")!;
    expect(t.identity.data.interests.length).toBeGreaterThan(0);
    expect(t.strengths.data.achievements.length).toBeGreaterThan(0);
    expect(t.emotional.data.triggers.length).toBeGreaterThan(0);
  });
});

describe("CPIE — Ask CARA lived-experience read", () => {
  it('answers "does Alex experience a childhood here?" from the twin', () => {
    const a = ask("Does Alex experience a childhood here?");
    expect(a.intent).toBe("lived_experience");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toContain("childhood");
    expect(a.disclaimer?.toLowerCase()).toContain("receive care");
  });

  it("recognises 'how does life feel for' and 'good parenting' phrasings", () => {
    expect(ask("How does life feel for Alex?").intent).toBe("lived_experience");
    expect(ask("Is this good parenting for Jordan?").intent).toBe("lived_experience");
  });

  it("is care-team gated", () => {
    expect(ask("Does Alex experience a childhood here?", "external_visitor").intent).toBe("access_denied");
  });

  it("does not hijack neighbouring child skills", () => {
    expect(ask("Who is Alex?").intent).toBe("child_identity");
    expect(ask("What should be in Alex's weekly summary?").intent).toBe("weekly_summary");
    expect(ask("How is Alex progressing?").intent).toBe("child_progress");
  });
});
