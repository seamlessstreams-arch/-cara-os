import { describe, it, expect } from "vitest";
import {
  PRACTICE_PATTERNS,
  PRACTICE_PATTERNS_ALL,
  CLAIM_BASIS_META,
  validatePracticePattern,
  getPatternsByDomain,
  getPatternsByRegulation,
  getPatternsByClaimBasis,
  getPatternById,
  type PracticePattern,
} from "../practice-patterns";

function base(): PracticePattern {
  return {
    id: "pp_test",
    name: "Test pattern",
    summary: "A paraphrased summary in Cara's own words.",
    domains: ["reg-45"],
    claim_basis: "good_practice",
    regulation_refs: [],
    quality_standard_refs: [],
    key_questions: ["Did it make a difference?"],
    evidence_indicators: ["impact stated"],
    failure_modes: ["activity only"],
    source: { author: "Someone (Role)", platform: "LinkedIn" },
    provenance: "derived_external",
    confidence: "medium",
    retrieved_at: "2026-11-09",
    status: "approved",
  };
}

describe("validatePracticePattern — attribution gate", () => {
  it("rejects a derived_external pattern with no author attribution", () => {
    const p = base();
    p.source = { author: "", platform: "LinkedIn" };
    const r = validatePracticePattern(p);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /author attribution/i.test(e))).toBe(true);
  });

  it("rejects a derived_external pattern with no platform", () => {
    const p = base();
    p.source = { author: "Someone", platform: "" };
    expect(validatePracticePattern(p).ok).toBe(false);
  });

  it("accepts a well-formed, attributed pattern", () => {
    expect(validatePracticePattern(base()).ok).toBe(true);
  });

  it("rejects a regulation claim_basis that cites no regulation_ref", () => {
    const p = base();
    p.claim_basis = "regulation";
    p.regulation_refs = [];
    const r = validatePracticePattern(p);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /regulation_ref/i.test(e))).toBe(true);
  });

  it("rejects an invalid claim_basis", () => {
    const p = base();
    // @ts-expect-error — deliberately invalid
    p.claim_basis = "vibes";
    expect(validatePracticePattern(p).ok).toBe(false);
  });

  it("does not require attribution for a cara_authored pattern", () => {
    const p = base();
    p.provenance = "cara_authored";
    p.claim_basis = "cara_doctrine";
    p.source = { author: "", platform: "" };
    expect(validatePracticePattern(p).ok).toBe(true);
  });
});

describe("seeded library integrity", () => {
  it("every seeded pattern passes validation (nothing unattributed slips in)", () => {
    for (const p of PRACTICE_PATTERNS_ALL) {
      const r = validatePracticePattern(p);
      expect(r.ok, `${p.id}: ${r.errors.join("; ")}`).toBe(true);
    }
  });

  it("every derived_external seed carries author + platform attribution", () => {
    for (const p of PRACTICE_PATTERNS_ALL.filter((x) => x.provenance === "derived_external")) {
      expect(p.source.author.trim().length, p.id).toBeGreaterThan(0);
      expect(p.source.platform.trim().length, p.id).toBeGreaterThan(0);
    }
  });

  it("every seeded claim_basis is a known, inspectable basis", () => {
    for (const p of PRACTICE_PATTERNS_ALL) {
      expect(CLAIM_BASIS_META[p.claim_basis], p.id).toBeTruthy();
    }
  });

  it("pattern ids are unique", () => {
    const ids = PRACTICE_PATTERNS_ALL.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("seeds at least the ten brief patterns, all approved", () => {
    expect(PRACTICE_PATTERNS.length).toBeGreaterThanOrEqual(10);
    expect(PRACTICE_PATTERNS.every((p) => p.status === "approved")).toBe(true);
  });

  it("a regulation-linked pattern resolves from the reg spine key", () => {
    expect(getPatternsByRegulation("reg-45").length).toBeGreaterThan(0);
  });
});

describe("retrieval helpers", () => {
  it("getPatternsByDomain filters by domain", () => {
    const r = getPatternsByDomain("admissions");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.domains.includes("admissions"))).toBe(true);
  });

  it("getPatternsByClaimBasis separates practitioner_view from good_practice", () => {
    const views = getPatternsByClaimBasis("practitioner_view");
    expect(views.every((p) => p.claim_basis === "practitioner_view")).toBe(true);
    // the two kinds must be distinguishable (the whole point of claim_basis)
    const gp = getPatternsByClaimBasis("good_practice");
    expect(views.some((v) => gp.includes(v))).toBe(false);
  });

  it("getPatternById returns a seeded pattern", () => {
    expect(getPatternById("pp_evidence_to_evaluation")?.name).toMatch(/evaluation/i);
    expect(getPatternById("nope")).toBeUndefined();
  });
});
