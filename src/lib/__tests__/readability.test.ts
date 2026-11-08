import { describe, it, expect } from "vitest";
import {
  countSyllables,
  assessReadability,
  bandForReadingAge,
  readingTargetForNeeds,
  checkReadability,
} from "../readability";

const SIMPLE = "The cat sat on the mat. The dog ran fast.";
const COMPLEX =
  "The multidisciplinary practitioners systematically facilitated comprehensive developmental interventions, subsequently demonstrating considerable improvements in the beneficiaries' psychological equilibrium and overall resilience.";

describe("countSyllables", () => {
  it("counts cleanly-handled words deterministically", () => {
    expect(countSyllables("cat")).toBe(1);
    expect(countSyllables("the")).toBe(1); // <= 3 letters → 1
    expect(countSyllables("hello")).toBe(2);
    expect(countSyllables("table")).toBe(2);
    expect(countSyllables("water")).toBe(2);
    expect(countSyllables("elephant")).toBe(3);
  });
  it("is robust to punctuation and empties", () => {
    expect(countSyllables("cat!")).toBe(1);
    expect(countSyllables("")).toBe(0);
    expect(countSyllables("...")).toBe(0);
  });
});

describe("assessReadability", () => {
  it("scores simple child text at a low grade", () => {
    const s = assessReadability(SIMPLE);
    expect(s.words).toBe(10);
    expect(s.sentences).toBe(2);
    expect(s.grade).toBeLessThanOrEqual(5);
    expect(s.readingAge).toBe(s.grade + 5);
  });
  it("scores dense clinical text much higher", () => {
    const c = assessReadability(COMPLEX);
    expect(c.grade).toBeGreaterThanOrEqual(9);
    expect(c.polysyllables).toBeGreaterThan(3);
  });
  it("ranks complex above simple", () => {
    expect(assessReadability(COMPLEX).grade).toBeGreaterThan(assessReadability(SIMPLE).grade);
  });
  it("never returns a negative grade and handles empty text", () => {
    const e = assessReadability("");
    expect(e.grade).toBe(0);
    expect(e.readingAge).toBe(5);
    expect(assessReadability("one two three").grade).toBeGreaterThanOrEqual(0);
  });
});

describe("bandForReadingAge", () => {
  it("maps ages to bands", () => {
    expect(bandForReadingAge(6)).toBe("age 5–7");
    expect(bandForReadingAge(8)).toBe("age 7–9");
    expect(bandForReadingAge(10)).toBe("age 9–11");
    expect(bandForReadingAge(13)).toBe("age 11–14");
    expect(bandForReadingAge(20)).toBe("age 14+");
  });
});

describe("readingTargetForNeeds", () => {
  it("tightens the target for literacy-affecting needs", () => {
    expect(readingTargetForNeeds(["dyslexia"]).maxReadingAge).toBe(9);
    expect(readingTargetForNeeds(["eal"]).maxReadingAge).toBe(9);
    expect(readingTargetForNeeds(["low_literacy"]).maxReadingAge).toBe(9);
  });
  it("uses a default child band otherwise", () => {
    expect(readingTargetForNeeds(["adhd"]).maxReadingAge).toBe(11);
    expect(readingTargetForNeeds([]).maxReadingAge).toBe(11);
  });
  it("prefers an explicit recorded reading age", () => {
    const t = readingTargetForNeeds(["dyslexia"], 6);
    expect(t.maxReadingAge).toBe(6);
    expect(t.reason).toMatch(/recorded reading age/);
  });
  it("ignores an invalid recorded reading age", () => {
    expect(readingTargetForNeeds([], 0).maxReadingAge).toBe(11);
    expect(readingTargetForNeeds([], null).maxReadingAge).toBe(11);
  });
});

describe("checkReadability", () => {
  it("passes simple text against a default target with no flag", () => {
    const r = checkReadability(SIMPLE, readingTargetForNeeds([]));
    expect(r.withinTarget).toBe(true);
    expect(r.flag).toBeNull();
  });
  it("flags complex text against a tight target, visibly and with advice", () => {
    const r = checkReadability(COMPLEX, readingTargetForNeeds(["dyslexia"]));
    expect(r.withinTarget).toBe(false);
    expect(r.flag).toBeTruthy();
    expect(r.flag).toMatch(/simplify/i);
  });
});
