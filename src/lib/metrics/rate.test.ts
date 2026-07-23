import { describe, it, expect } from "vitest";
import { rate, rateOf, meanOf, weightedMeanOf, meets, below, formatRate } from "./rate";

describe("rate", () => {
  it("returns null for an empty population rather than a flattering 100", () => {
    // The whole point: 0 records must not read as full compliance.
    expect(rate(0, 0)).toBeNull();
    expect(rate(5, 0)).toBeNull();
    expect(rate(0, -1)).toBeNull();
  });

  it("computes a rounded percentage when there is something to measure", () => {
    expect(rate(1, 1)).toBe(100);
    expect(rate(0, 4)).toBe(0);
    expect(rate(2, 3)).toBe(67);
  });

  it("returns null rather than NaN for non-finite input", () => {
    expect(rate(NaN, 10)).toBeNull();
    expect(rate(1, NaN)).toBeNull();
  });
});

describe("rateOf", () => {
  it("is null when the base collection is empty", () => {
    expect(rateOf([], [])).toBeNull();
  });

  it("measures the matching subset against the whole", () => {
    expect(rateOf([1, 2], [1, 2, 3, 4])).toBe(50);
  });
});

describe("meanOf", () => {
  it("is null when nothing is measured", () => {
    expect(meanOf([])).toBeNull();
    expect(meanOf([null, undefined, null])).toBeNull();
  });

  it("ignores unmeasured values instead of counting them as zero or full marks", () => {
    // 80 alone — not 40 (null as 0) and not 90 (null as 100).
    expect(meanOf([80, null])).toBe(80);
    expect(meanOf([100, 50, null, undefined])).toBe(75);
  });
});

describe("weightedMeanOf", () => {
  it("renormalises the weights over measured entries only", () => {
    // Safeguarding is the only measured domain, so it IS the score — the
    // unmeasured 25/20/20 weights must not drag it toward a default.
    const result = weightedMeanOf([
      { score: 60, weight: 0.35 },
      { score: null, weight: 0.25 },
      { score: null, weight: 0.2 },
      { score: null, weight: 0.2 },
    ]);
    expect(result).toBe(60);
  });

  it("is null when every entry is unmeasured", () => {
    expect(weightedMeanOf([{ score: null, weight: 1 }])).toBeNull();
  });

  it("weights measured entries against each other", () => {
    expect(weightedMeanOf([
      { score: 100, weight: 0.5 },
      { score: 0, weight: 0.5 },
    ])).toBe(50);
  });
});

describe("meets / below", () => {
  it("never treats unmeasured as a pass", () => {
    expect(meets(null, 85)).toBe(false);
    expect(meets(undefined, 0)).toBe(false);
  });

  it("never treats unmeasured as a failure either", () => {
    // Both false for null is deliberate: an unmeasured domain should raise a
    // "no records" gap, not a fabricated breach.
    expect(below(null, 85)).toBe(false);
    expect(below(undefined, 85)).toBe(false);
  });

  it("compares real scores normally", () => {
    expect(meets(85, 85)).toBe(true);
    expect(meets(84, 85)).toBe(false);
    expect(below(84, 85)).toBe(true);
    expect(below(85, 85)).toBe(false);
  });
});

describe("formatRate", () => {
  it("renders unmeasured as an em dash, not 0%", () => {
    expect(formatRate(null)).toBe("—");
    expect(formatRate(undefined)).toBe("—");
    expect(formatRate(null, "Not yet measured")).toBe("Not yet measured");
  });

  it("renders a measured rate with a percent sign", () => {
    expect(formatRate(0)).toBe("0%");
    expect(formatRate(87)).toBe("87%");
  });
});
