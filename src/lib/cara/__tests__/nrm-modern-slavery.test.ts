import { describe, expect, it } from "vitest";
import {
  NRM_DEFINITION,
  MODERN_SLAVERY_DEFINITION,
  TRAFFICKING_VS_SMUGGLING,
  NRM_CHILD_PRINCIPLE,
  NRM_WORDING,
  SECTION_45_DEFENCE,
  MODERN_SLAVERY_INDICATORS,
  NRM_GUIDANCE_BLOCK,
  assessNRMIndicators,
} from "../nrm-modern-slavery";

describe("nrm-modern-slavery — knowledge is faithful & safety-correct", () => {
  it("the advisory wording is ADVICE (consider), never a decision", () => {
    expect(NRM_WORDING.toLowerCase()).toContain("consider");
    expect(NRM_WORDING).toContain("NRM");
    // never asserts a referral is definitely required / decided
    expect(NRM_WORDING.toLowerCase()).not.toContain("a referral is required");
    expect(NRM_WORDING.toLowerCase()).not.toContain("must refer");
  });

  it("centres the child-as-victim and no-consent principle", () => {
    expect(NRM_CHILD_PRINCIPLE.toLowerCase()).toContain("no consent is needed");
    expect(SECTION_45_DEFENCE).toContain("Section 45");
    expect(SECTION_45_DEFENCE.toLowerCase()).toContain("victim");
    expect(NRM_GUIDANCE_BLOCK.toLowerCase()).toContain("victim, not an offender");
    expect(NRM_GUIDANCE_BLOCK.toLowerCase()).toContain("never decide");
  });

  it("distinguishes trafficking from smuggling and defines modern slavery", () => {
    expect(TRAFFICKING_VS_SMUGGLING.toLowerCase()).toContain("not the same as smuggling");
    expect(MODERN_SLAVERY_DEFINITION.toLowerCase()).toContain("forced or compulsory labour");
    expect(NRM_DEFINITION.toLowerCase()).toContain("in addition to standard safeguarding");
  });

  it("covers the core indicator groups", () => {
    expect(MODERN_SLAVERY_INDICATORS.map((g) => g.key)).toEqual(
      expect.arrayContaining([
        "control_coercion", "trafficking_movement", "criminal_exploitation",
        "sexual_exploitation", "labour_servitude", "control_of_identity",
      ]),
    );
    for (const g of MODERN_SLAVERY_INDICATORS) expect(g.cues.length).toBeGreaterThan(0);
  });
});

describe("nrm-modern-slavery — deterministic NRM consideration (advice only)", () => {
  it("advises CONSIDER for county-lines / criminal exploitation and quotes the cue", () => {
    const a = assessNRMIndicators("He is being made to run drugs on a county lines and has multiple phones.");
    expect(a.adviseConsiderReferral).toBe(true);
    expect(a.indicators.map((i) => i.key)).toContain("criminal_exploitation");
    expect(a.advice).toBe(NRM_WORDING);
    expect(a.rationale.toLowerCase()).toContain("victim, not an offender");
  });

  it("detects trafficking/movement and labour servitude", () => {
    expect(assessNRMIndicators("she was trafficked to another city").indicators.map((i) => i.key)).toContain("trafficking_movement");
    expect(assessNRMIndicators("found working in a car wash, not paid").indicators.map((i) => i.key)).toContain("labour_servitude");
  });

  it("gives NO advice for a clean record, and dedups within a group", () => {
    const clean = assessNRMIndicators("He baked a cake and played football with staff.");
    expect(clean.adviseConsiderReferral).toBe(false);
    expect(clean.advice).toBe("");
    expect(clean.indicators).toEqual([]);
    expect(assessNRMIndicators("")).toMatchObject({ adviseConsiderReferral: false });
    // one hit per indicator group even if several cues match
    const dup = assessNRMIndicators("county lines, county line, running drugs");
    expect(dup.indicators.filter((i) => i.key === "criminal_exploitation")).toHaveLength(1);
  });
});
