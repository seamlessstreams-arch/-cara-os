import { describe, it, expect } from "vitest";
import {
  computeRiskScore,
  computeRiskProfile,
  computeRiskTrend,
  isReviewOverdue,
  computeChildRiskSummary,
} from "./risk-assessment-service";
import type { RiskLevel } from "./risk-assessment-service";

// -- Helper types for pure functions ------------------------------------------

type ProfileInput = { category: string; current_risk_level: RiskLevel; status: string };
type ChildInput = { child_id: string | null; category: string; current_risk_level: RiskLevel; status: string };

function makeProfileRow(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    category: "self_harm",
    current_risk_level: "medium",
    status: "active",
    ...overrides,
  };
}

function makeChildRow(overrides: Partial<ChildInput> = {}): ChildInput {
  return {
    child_id: "child-1",
    category: "self_harm",
    current_risk_level: "medium",
    status: "active",
    ...overrides,
  };
}

// -- computeRiskScore ---------------------------------------------------------

describe("computeRiskScore", () => {
  it("returns score = likelihood * impact", () => {
    expect(computeRiskScore(3, 4).score).toBe(12);
  });

  it("returns very_low for score 1-4", () => {
    expect(computeRiskScore(1, 1).level).toBe("very_low");
    expect(computeRiskScore(2, 2).level).toBe("very_low");
  });

  it("returns low for score 5-8", () => {
    expect(computeRiskScore(1, 5).level).toBe("low");
    expect(computeRiskScore(2, 4).level).toBe("low");
  });

  it("returns medium for score 9-12", () => {
    expect(computeRiskScore(3, 3).level).toBe("medium");
    expect(computeRiskScore(3, 4).level).toBe("medium");
  });

  it("returns high for score 13-19", () => {
    expect(computeRiskScore(3, 5).level).toBe("high");
    expect(computeRiskScore(4, 4).level).toBe("high");
  });

  it("returns very_high for score 20-25", () => {
    expect(computeRiskScore(4, 5).level).toBe("very_high");
    expect(computeRiskScore(5, 5).level).toBe("very_high");
  });
});

// -- computeRiskProfile -------------------------------------------------------

describe("computeRiskProfile", () => {
  it("returns defaults for empty array", () => {
    const p = computeRiskProfile([]);
    expect(p.total_assessments).toBe(0);
    expect(p.active).toBe(0);
    expect(p.by_level.very_high).toBe(0);
    expect(p.highest_risk_category).toBeNull();
    expect(p.overall_risk_level).toBe("very_low");
    expect(p.needs_immediate_review).toBe(0);
  });

  it("counts active assessments (active + escalated)", () => {
    const rows = [
      makeProfileRow({ status: "active" }),
      makeProfileRow({ status: "escalated" }),
      makeProfileRow({ status: "closed" }),
    ];
    const p = computeRiskProfile(rows);
    expect(p.total_assessments).toBe(3);
    expect(p.active).toBe(2);
  });

  it("determines overall risk level from highest active", () => {
    const rows = [
      makeProfileRow({ current_risk_level: "low", status: "active" }),
      makeProfileRow({ current_risk_level: "very_high", status: "active" }),
    ];
    const p = computeRiskProfile(rows);
    expect(p.overall_risk_level).toBe("very_high");
  });

  it("counts needs_immediate_review for very_high and high active", () => {
    const rows = [
      makeProfileRow({ current_risk_level: "very_high", status: "active" }),
      makeProfileRow({ current_risk_level: "high", status: "escalated" }),
      makeProfileRow({ current_risk_level: "medium", status: "active" }),
    ];
    const p = computeRiskProfile(rows);
    expect(p.needs_immediate_review).toBe(2);
  });

  it("populates by_level and by_category", () => {
    const rows = [
      makeProfileRow({ current_risk_level: "high", category: "exploitation" }),
    ];
    const p = computeRiskProfile(rows);
    expect(p.by_level.high).toBe(1);
    expect(p.by_category["exploitation"]).toBe(1);
  });
});

// -- computeRiskTrend ---------------------------------------------------------

describe("computeRiskTrend", () => {
  it("returns stable when no change", () => {
    const current = [makeProfileRow({ current_risk_level: "high", status: "active" })];
    const previous = [makeProfileRow({ current_risk_level: "high", status: "active" })];
    const t = computeRiskTrend(current, previous);
    expect(t.direction).toBe("stable");
    expect(t.change_count).toBe(0);
  });

  it("returns improving when high-plus active decreases", () => {
    const current: ProfileInput[] = [];
    const previous = [makeProfileRow({ current_risk_level: "very_high", status: "active" })];
    const t = computeRiskTrend(current, previous);
    expect(t.direction).toBe("improving");
    expect(t.closed_risks).toBe(1);
  });

  it("returns deteriorating when high-plus active increases", () => {
    const current = [
      makeProfileRow({ current_risk_level: "very_high", status: "active" }),
      makeProfileRow({ current_risk_level: "high", status: "active" }),
    ];
    const previous = [makeProfileRow({ current_risk_level: "medium", status: "active" })];
    const t = computeRiskTrend(current, previous);
    expect(t.direction).toBe("deteriorating");
    expect(t.new_risks).toBe(1);
  });
});

// -- isReviewOverdue ----------------------------------------------------------

describe("isReviewOverdue", () => {
  it("returns true when now is past the review date", () => {
    expect(isReviewOverdue("2026-01-01", new Date("2026-06-01"))).toBe(true);
  });

  it("returns false when now is before the review date", () => {
    expect(isReviewOverdue("2026-12-01", new Date("2026-06-01"))).toBe(false);
  });
});

// -- computeChildRiskSummary --------------------------------------------------

describe("computeChildRiskSummary", () => {
  it("returns defaults for empty array", () => {
    const s = computeChildRiskSummary([]);
    expect(s.child_id).toBeNull();
    expect(s.total).toBe(0);
    expect(s.active_high_plus).toBe(0);
    expect(s.recommended_review_frequency).toBe("quarterly");
    expect(s.flag_level).toBe("green");
  });

  it("returns weekly review and red flag for very_high active", () => {
    const rows = [makeChildRow({ current_risk_level: "very_high", status: "active" })];
    const s = computeChildRiskSummary(rows);
    expect(s.recommended_review_frequency).toBe("weekly");
    expect(s.flag_level).toBe("red");
    expect(s.active_high_plus).toBe(1);
  });

  it("returns fortnightly review and red flag for high active", () => {
    const rows = [makeChildRow({ current_risk_level: "high", status: "active" })];
    const s = computeChildRiskSummary(rows);
    expect(s.recommended_review_frequency).toBe("fortnightly");
    expect(s.flag_level).toBe("red");
  });

  it("returns monthly review and amber flag for medium active", () => {
    const rows = [makeChildRow({ current_risk_level: "medium", status: "active" })];
    const s = computeChildRiskSummary(rows);
    expect(s.recommended_review_frequency).toBe("monthly");
    expect(s.flag_level).toBe("amber");
  });

  it("lists unique categories", () => {
    const rows = [
      makeChildRow({ category: "self_harm" }),
      makeChildRow({ category: "exploitation" }),
      makeChildRow({ category: "self_harm" }),
    ];
    const s = computeChildRiskSummary(rows);
    expect(s.categories).toContain("self_harm");
    expect(s.categories).toContain("exploitation");
    expect(s.categories).toHaveLength(2);
  });
});
