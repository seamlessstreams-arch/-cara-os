import { describe, it, expect } from "vitest";
import { fixPersonalI, tidy, asLead, softLower } from "../cara-text";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — free-text normalisation
//
// Locks the behaviour the generators depend on: the first-person pronoun stays
// upright through lowercasing, messy free text reads as a clean sentence, and
// genuinely non-pronoun "i" (i.e., list markers) is left alone.
// ══════════════════════════════════════════════════════════════════════════════

describe("fixPersonalI", () => {
  it("capitalises the standalone pronoun and its contractions", () => {
    expect(fixPersonalI("when i get angry")).toBe("when I get angry");
    expect(fixPersonalI("i think i'm okay")).toBe("I think I'm okay");
    expect(fixPersonalI("so am i")).toBe("so am I");
  });

  it("leaves non-pronoun 'i' alone (i.e., abbreviations and list markers)", () => {
    expect(fixPersonalI("safety i.e. staying safe")).toBe("safety i.e. staying safe");
    expect(fixPersonalI("step i) begin")).toBe("step i) begin");
    expect(fixPersonalI("inside the big feelings")).toBe("inside the big feelings");
  });
});

describe("softLower", () => {
  it("lowercases for mid-sentence embedding but keeps the pronoun upright", () => {
    expect(softLower("What happens in my body when I get angry")).toBe("what happens in my body when I get angry");
  });

  it("collapses whitespace and tolerates null/undefined", () => {
    expect(softLower("  Trusting   Adults  ")).toBe("trusting adults");
    expect(softLower(null)).toBe("");
    expect(softLower(undefined)).toBe("");
  });
});

describe("asLead", () => {
  it("capitalises the first letter so a lowercase aim reads as a sentence", () => {
    expect(asLead("help him name what i can do")).toBe("Help him name what I can do");
  });

  it("preserves an already-clean sentence and trims surrounding noise", () => {
    expect(asLead("  Settle at school.  ")).toBe("Settle at school.");
    expect(asLead("")).toBe("");
  });
});

describe("tidy", () => {
  it("trims, collapses whitespace and fixes the pronoun without recasing words", () => {
    expect(tidy("  What happens   when i get angry ")).toBe("What happens when I get angry");
  });
});
