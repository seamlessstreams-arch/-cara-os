import { describe, it, expect } from "vitest";
import {
  parseRegulationNumber,
  verifyRegulationRef,
  verifyRegulationRefs,
  KNOWN_REGULATION_NUMBERS,
} from "../regulation-verify";
import { PRACTICE_PATTERNS_ALL } from "../practice-patterns";

describe("parseRegulationNumber", () => {
  it("extracts the number from common spellings", () => {
    expect(parseRegulationNumber("reg-14")).toBe(14);
    expect(parseRegulationNumber("Reg 14")).toBe(14);
    expect(parseRegulationNumber("Regulation 45")).toBe(45);
    expect(parseRegulationNumber("r45")).toBe(45);
    expect(parseRegulationNumber("14")).toBe(14);
  });
  it("returns null when there is no number", () => {
    expect(parseRegulationNumber("statement of purpose")).toBeNull();
    expect(parseRegulationNumber("")).toBeNull();
  });
});

describe("verifyRegulationRef — the F safety rail", () => {
  it("verifies a catalogued regulation", () => {
    const r = verifyRegulationRef("reg-14");
    expect(r.verified).toBe(true);
    expect(r.number).toBe(14);
  });

  it("flags a reg number absent from the catalogue as UNVERIFIED (eval case)", () => {
    const r = verifyRegulationRef("Reg 99");
    expect(r.verified).toBe(false);
    expect(r.number).toBe(99);
    expect(r.reason).toMatch(/not in the catalogue/i);
  });

  it("flags a reference with no number as unverified", () => {
    const r = verifyRegulationRef("the quality standards");
    expect(r.verified).toBe(false);
    expect(r.reason).toMatch(/no regulation number/i);
  });

  it("the catalogue is non-empty and contains known core regs", () => {
    expect(KNOWN_REGULATION_NUMBERS.size).toBeGreaterThan(0);
    expect(KNOWN_REGULATION_NUMBERS.has(45)).toBe(true); // Reg 45 is core to Cara
    expect(KNOWN_REGULATION_NUMBERS.has(14)).toBe(true);
  });
});

describe("verifyRegulationRefs — batch", () => {
  it("reports all-verified vs the unverified set", () => {
    const b = verifyRegulationRefs(["reg-14", "reg-45", "Reg 99"]);
    expect(b.allVerified).toBe(false);
    expect(b.unverified).toEqual(["Reg 99"]);
  });
  it("is all-verified when every ref is catalogued", () => {
    expect(verifyRegulationRefs(["reg-14", "reg-45"]).allVerified).toBe(true);
  });
});

describe("seeded patterns cite only catalogued regulations", () => {
  it("every regulation_ref on every seeded pattern verifies against the spine", () => {
    for (const p of PRACTICE_PATTERNS_ALL) {
      const b = verifyRegulationRefs(p.regulation_refs);
      expect(b.allVerified, `${p.id}: unverified ${b.unverified.join(", ")}`).toBe(true);
    }
  });
});
