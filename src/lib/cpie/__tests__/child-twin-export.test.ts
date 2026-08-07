import { describe, expect, it } from "vitest";
import {
  buildChildTwinExportModel,
  CHILD_STATEMENT,
  renderChildTwinHtml,
  renderChildTwinJson,
} from "../child-twin-export";
import type { ChildTwin, TwinConfidence, TwinDimension } from "../types";

// Synthetic ChildTwin literal — per the seed-fixture doctrine this NEVER reads
// seed children (they rot when other features enrich them).
function dim<T>(data: T, confidence: TwinConfidence = "moderate", gaps: string[] = []): TwinDimension<T> {
  return { data, confidence, evidence: confidence === "none" ? [] : [{ source: "test", weight: 1 }], gaps };
}

function buildTwin(overrides: Partial<ChildTwin> = {}): ChildTwin {
  return {
    childId: "yp_synthetic",
    name: "Sam",
    generatedAt: "2026-08-07T09:00:00.000Z",
    engineVersion: "1.0.0",
    identity: dim({ age: 14, culture: "British-Ghanaian", faith: undefined, interests: ["drill music", "cooking"], whatMakesThemHappy: ["beach trips"], personality: ["funny", "loyal"], communicationPreferences: ["needs time before talking"], sensoryNeeds: [] }, "high"),
    strengths: dim({ strengths: ["Cooks for the house"], achievements: [{ date: "2026-07-20", title: "Finished a 5k run", celebratedHow: "Pizza night" }] }),
    aspirations: dim({ aspirations: [{ domain: "career", aspiration: "Be a chef", nextSteps: ["College open day"] }] }),
    lifeStory: dim({ memories: [{ date: "2026-06-01", title: "First fishing trip", childVoice: "best day ever" }] }),
    voice: dim({ recentQuotes: [{ date: "2026-08-01", quote: "I feel safe here now", source: "Key-work session" }] }, "high"),
    relationships: dim({ trustedAdults: ["Olivia"], keyConnector: "Olivia", relationalStatus: "developing", friendships: ["Jay"], friendshipConcerns: [] }),
    emotional: dim({ status: "watch", trend: "improving", peakTime: "evenings", triggers: ["raised voices"], whatHelps: ["kitchen time"], phrasesThatHelp: ["no rush"], phrasesThatEscalate: ["calm down"] }),
    progress: dim({ trajectory: "improving", headline: "Two domains moving up", improving: 2, declining: 0, focus: ["education attendance"] }),
    protectiveFactors: dim({ factors: [{ label: "Trusted adult in home", source: "relationships" }] }),
    livedExperience: dim({ meaningfulMoments30d: 7, celebrations: ["birthday meal"], ordinarySignals: ["shared breakfasts"] }),
    goodParenting: dim({ livedExperienceRead: "Life here is starting to feel like a childhood.", signalsPresent: [{ label: "Warmth", count: 5 }], signalsThin: ["Choice"] }),
    risksAndNeeds: dim({ openRiskAreas: ["online contacts"], knownTriggers: ["raised voices"] }),
    curiosity: dim({ noticedPatterns: ["Settles fastest after cooking"], reflectiveQuestions: ["What does the kitchen give Sam that other spaces don't?"] }),
    contradictions: ["Emotional status 'watch' while lived experience reads warm — worth reviewing together."],
    missingInformation: ["No health assessment on record in 12 months."],
    ...overrides,
  };
}

describe("buildChildTwinExportModel", () => {
  it("keeps identity first and risks late — never the headline", () => {
    const model = buildChildTwinExportModel(buildTwin(), "2026-08-07T10:00:00.000Z");
    const keys = model.sections.map((s) => s.key);
    expect(keys[0]).toBe("identity");
    expect(keys.indexOf("risksAndNeeds")).toBeGreaterThan(9);
    expect(model.sections).toHaveLength(13);
  });

  it("carries per-dimension confidence, gaps and evidence counts", () => {
    const model = buildChildTwinExportModel(
      buildTwin({ lifeStory: dim({ memories: [] }, "none", ["No life-story work recorded"]) }),
    );
    const life = model.sections.find((s) => s.key === "lifeStory")!;
    expect(life.confidenceLabel).toBe("No evidence in the records");
    expect(life.evidenceCount).toBe(0);
    expect(life.gaps).toEqual(["No life-story work recorded"]);
    expect(renderChildTwinHtml(model)).toContain("Nothing on record for this dimension.");
  });

  it("treats contradictions and missing information as first-class, even when empty", () => {
    const withFlags = buildChildTwinExportModel(buildTwin());
    expect(withFlags.contradictions[0]).toContain("worth reviewing");
    expect(withFlags.missingInformation[0]).toContain("health assessment");
    const empty = buildChildTwinExportModel(buildTwin({ contradictions: [], missingInformation: [] }));
    const html = renderChildTwinHtml(empty);
    expect(html).toContain("No contradictions flagged.");
    expect(html).toContain("No missing-information flags.");
  });

  it("keeps the child's own words with their dates and sources", () => {
    const model = buildChildTwinExportModel(buildTwin());
    const voice = model.sections.find((s) => s.key === "voice")!;
    expect(voice.lines[0]).toContain("I feel safe here now");
    expect(voice.lines[0]).toContain("Key-work session");
  });

  it("carries the child statement on every surface", () => {
    const model = buildChildTwinExportModel(buildTwin());
    expect(model.childStatement).toBe(CHILD_STATEMENT);
    expect(renderChildTwinHtml(model)).toContain("never a child reduced to incidents or risk");
    expect(JSON.parse(renderChildTwinJson(model)).childStatement).toBe(CHILD_STATEMENT);
  });

  it("escapes HTML in twin content", () => {
    const html = renderChildTwinHtml(
      buildChildTwinExportModel(buildTwin({ contradictions: [`<script>alert("x")</script>`] })),
    );
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
