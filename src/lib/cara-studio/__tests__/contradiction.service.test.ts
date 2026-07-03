// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — CONTRADICTION SERVICE: presentation-sentiment predicates
// Regression tests for the keyword-matching bug class (project_keyword_matching_bugs):
// bare `.includes()` read "unsettled" as "settled" and "no concerns" as a concern,
// inverting the behaviour-conflict detection.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  readsAsPositivePresentation,
  readsAsNegativePresentation,
} from "../contradiction.service";

describe("readsAsPositivePresentation", () => {
  it("does NOT read 'unsettled' as positive (was: 'unsettled' ⊃ 'settled')", () => {
    expect(readsAsPositivePresentation("Child was unsettled and withdrawn all evening")).toBe(false);
  });

  it("does NOT read 'not positive' as positive", () => {
    expect(readsAsPositivePresentation("The visit was not positive at all")).toBe(false);
  });

  it("reads a genuinely settled record as positive", () => {
    expect(readsAsPositivePresentation("Child was settled and happy throughout")).toBe(true);
  });

  it("reads 'no concerns' as positive", () => {
    expect(readsAsPositivePresentation("No concerns during the visit, presented well")).toBe(true);
  });
});

describe("readsAsNegativePresentation", () => {
  it("does NOT read 'no concerns' as negative (was: 'no concerns' ⊃ 'concerns')", () => {
    expect(readsAsNegativePresentation("No concerns during the visit, presented well")).toBe(false);
  });

  it("does NOT read 'without concerns' as negative", () => {
    expect(readsAsNegativePresentation("Day passed without concerns")).toBe(false);
  });

  it("reads 'unsettled' as negative", () => {
    expect(readsAsNegativePresentation("Child was distressed and unsettled")).toBe(true);
  });

  it("reads a genuine concern as negative", () => {
    expect(readsAsNegativePresentation("Staff raised concerns about the placement")).toBe(true);
  });
});

describe("behaviour-conflict inversion (the fixed contradiction)", () => {
  it("does NOT flag a negative-A / positive-B pair as a conflicting presentation", () => {
    // Previously: A 'unsettled' read positive + B 'no concerns' read negative → false contradiction
    const aNegative = "Child was unsettled and withdrawn all evening";
    const bPositive = "No concerns during the visit, presented well";
    expect(readsAsPositivePresentation(aNegative) && readsAsNegativePresentation(bPositive)).toBe(false);
  });

  it("still flags a genuine positive-A / negative-B conflict", () => {
    const aPositive = "Child was settled and happy throughout";
    const bNegative = "Child was distressed and unsettled";
    expect(readsAsPositivePresentation(aPositive) && readsAsNegativePresentation(bNegative)).toBe(true);
  });
});
