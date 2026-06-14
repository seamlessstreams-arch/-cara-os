import { describe, expect, it } from "vitest";
import {
  CONTEXTUAL_SAFEGUARDING_PARADIGM,
  ECOLOGICAL_CONTEXTS,
  DIAGNOSTIC_MATRIX,
  CORE_ETHICAL_PILLARS,
  EXTRA_FAMILIAL_HARM_CONTEXTS,
  OPERATIONAL_LEVELS,
  GUARDIANSHIP_VS_SURVEILLANCE,
  DATA_ETHICS_GUARDRAILS,
  CONTEXT_CONFERENCE_QUESTIONS,
  CONTEXTUAL_SAFEGUARDING_GUIDANCE_BLOCK,
  GUARDIANSHIP_NOT_SURVEILLANCE_BLOCK,
  extraFamilialHarmContexts,
  contextualSafeguardingReflections,
  contextualSafeguardingQuestions,
  coreEthicalPillarNames,
  guardianshipNotSurveillanceChecks,
  efhSignSpotting,
  hasExtraFamilialMarkers,
} from "../contextual-safeguarding";

describe("contextual-safeguarding — structured data is complete & faithful", () => {
  it("encodes the four ecological contexts beyond the front door", () => {
    expect(ECOLOGICAL_CONTEXTS).toHaveLength(4);
    const keys = ECOLOGICAL_CONTEXTS.map((c) => c.key);
    expect(keys).toEqual(["family_home", "peer_groups", "schools_neighbourhoods", "online_spaces"]);
    for (const c of ECOLOGICAL_CONTEXTS) expect(c.note).toBeTruthy();
  });

  it("has the diagnostic matrix with traditional vs contextual for every dimension", () => {
    expect(DIAGNOSTIC_MATRIX.length).toBeGreaterThanOrEqual(5);
    for (const d of DIAGNOSTIC_MATRIX) {
      expect(d.traditional).toBeTruthy();
      expect(d.contextual).toBeTruthy();
    }
    expect(DIAGNOSTIC_MATRIX.map((d) => d.key)).toContain("locus_of_risk");
  });

  it("has the six core ethical pillars", () => {
    expect(CORE_ETHICAL_PILLARS).toHaveLength(6);
    expect(coreEthicalPillarNames()).toEqual(
      expect.arrayContaining(["Ecological", "Collaborative", "Rights-based", "Strengths-based", "Evidence-informed", "Ethic of care"]),
    );
  });

  it("has the five EFH location-contexts plus an exploitation-markers context, each with cues and a reflection", () => {
    expect(EXTRA_FAMILIAL_HARM_CONTEXTS).toHaveLength(6);
    expect(EXTRA_FAMILIAL_HARM_CONTEXTS.map((c) => c.key)).toEqual(
      expect.arrayContaining(["peer_networks", "school_environments", "neighbourhood", "public_transport", "online_spaces", "exploitation"]),
    );
    for (const c of EXTRA_FAMILIAL_HARM_CONTEXTS) {
      expect(c.cues.length).toBeGreaterThan(0);
      expect(c.reflection).toBeTruthy();
    }
    expect(extraFamilialHarmContexts()).toContain("Online spaces");
  });

  it("has both operational levels (individual + environmental casework)", () => {
    expect(OPERATIONAL_LEVELS.map((l) => l.level)).toEqual([1, 2]);
    for (const l of OPERATIONAL_LEVELS) expect(l.practiceExample).toBeTruthy();
  });

  it("encodes the guardianship-vs-surveillance matrix and the three Signs-of-Safety questions", () => {
    expect(GUARDIANSHIP_VS_SURVEILLANCE.length).toBeGreaterThanOrEqual(3);
    for (const g of GUARDIANSHIP_VS_SURVEILLANCE) {
      expect(g.surveillance).toBeTruthy();
      expect(g.guardianship).toBeTruthy();
    }
    expect(CONTEXT_CONFERENCE_QUESTIONS).toHaveLength(3);
  });
});

describe("contextual-safeguarding — guidance blocks ground the model + ethic", () => {
  it("the LLM guidance block names the paradigm, guardianship-not-surveillance and the bias ratchet", () => {
    const block = CONTEXTUAL_SAFEGUARDING_GUIDANCE_BLOCK.toLowerCase();
    expect(block).toContain("beyond the front door");
    expect(block).toContain("guardianship, not surveillance");
    expect(block).toContain("bias ratchet");
  });

  it("the ethics-only block leads with guardianship, not surveillance", () => {
    expect(GUARDIANSHIP_NOT_SURVEILLANCE_BLOCK).toContain("guardianship, not surveillance");
  });

  it("the paradigm statement credits the model and centres the context, not the child", () => {
    expect(CONTEXTUAL_SAFEGUARDING_PARADIGM).toContain("Firmin");
    expect(CONTEXTUAL_SAFEGUARDING_PARADIGM.toLowerCase()).toContain("beyond the front door");
  });

  it("exposes the data-ethics guardrails for Cara's own flagging", () => {
    expect(DATA_ETHICS_GUARDRAILS.length).toBeGreaterThanOrEqual(4);
    expect(guardianshipNotSurveillanceChecks()).toEqual(DATA_ETHICS_GUARDRAILS);
    expect(guardianshipNotSurveillanceChecks().join(" ").toLowerCase()).toContain("trojan horse");
  });
});

describe("contextual-safeguarding — deterministic EFH sign-spotting", () => {
  it("detects county-lines / exploitation markers and quotes the cue", () => {
    const hits = efhSignSpotting("Staff are worried he may be involved in county lines and went missing overnight.");
    const keys = hits.map((h) => h.key);
    expect(keys).toContain("exploitation");
    const exploitation = hits.find((h) => h.key === "exploitation")!;
    expect(["county lines", "missing", "went missing"]).toContain(exploitation.cue);
    expect(exploitation.reflection).toBeTruthy();
  });

  it("detects transport, online, school and peer contexts", () => {
    expect(efhSignSpotting("seen at the train station out of area").map((h) => h.key)).toContain("public_transport");
    expect(efhSignSpotting("messaging an older male on Snapchat").map((h) => h.key)).toEqual(
      expect.arrayContaining(["online_spaces", "peer_networks"]),
    );
    expect(efhSignSpotting("he was excluded from school again").map((h) => h.key)).toContain("school_environments");
  });

  it("returns one hit per context (deduped) and nothing for a clean record", () => {
    const hits = efhSignSpotting("online online online and snapchat too");
    expect(hits.filter((h) => h.key === "online_spaces")).toHaveLength(1);
    expect(efhSignSpotting("The young person enjoyed baking a cake with staff and felt proud.")).toEqual([]);
    expect(efhSignSpotting("")).toEqual([]);
    expect(hasExtraFamilialMarkers("carrying a knife for protection")).toBe(true);
    expect(hasExtraFamilialMarkers("read a book and went to bed calmly")).toBe(false);
  });

  it("contextualSafeguardingQuestions returns one CaraQuestion-shaped item per context", () => {
    const qs = contextualSafeguardingQuestions();
    expect(qs).toHaveLength(EXTRA_FAMILIAL_HARM_CONTEXTS.length);
    for (const q of qs) {
      expect(q.domain).toBe("contextual_safeguarding");
      expect(q.question).toBeTruthy();
    }
    expect(contextualSafeguardingReflections()).toHaveLength(EXTRA_FAMILIAL_HARM_CONTEXTS.length);
  });
});
