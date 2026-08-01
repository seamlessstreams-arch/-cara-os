// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK REGISTER SERVICE TESTS
// Pure-function tests for risk scoring, risk level classification,
// risk metrics computation, risk alert identification, and constants.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeRiskScore,
  getRiskLevel,
  RISK_CATEGORIES,
  RISK_STATUSES,
  REVIEW_FREQUENCIES,
  _testing,
} from "../risk-register-service";
import type {
  RiskEntry,
  RiskCategory,
  RiskStatus,
  ReviewFrequency,
  LikelihoodRating,
  ImpactRating,
} from "../risk-register-service";

const { computeRiskMetrics, identifyRiskAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fixed "now" for deterministic date tests. */
const NOW = new Date("2026-06-01T00:00:00Z");

let _uid = 0;
function uid(): string {
  _uid++;
  return `test-risk-${_uid.toString().padStart(4, "0")}`;
}

/** Factory helper to create a RiskEntry with sensible defaults. */
function makeEntry(overrides: Partial<RiskEntry> = {}): RiskEntry {
  const likelihood: LikelihoodRating = (overrides.likelihood as LikelihoodRating) ?? 3;
  const impact: ImpactRating = (overrides.impact as ImpactRating) ?? 3;
  return {
    id: uid(),
    home_id: "home-001",
    risk_title: "Test Risk",
    risk_description: "A test risk entry",
    risk_category: "operational",
    likelihood,
    impact,
    risk_score: likelihood * impact,
    risk_status: "open",
    mitigations: ["Mitigation A"],
    risk_owner: "Manager A",
    review_frequency: "monthly",
    last_review_date: "2026-01-01",
    next_review_date: "2026-07-01",
    child_id: null,
    child_name: null,
    linked_incident_ids: [],
    escalated_to: null,
    date_identified: "2026-01-01",
    date_closed: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("RISK_CATEGORIES", () => {
  it("has exactly 11 entries", () => {
    expect(RISK_CATEGORIES).toHaveLength(11);
  });

  it("each entry has category and label strings", () => {
    for (const rc of RISK_CATEGORIES) {
      expect(rc).toHaveProperty("category");
      expect(rc).toHaveProperty("label");
      expect(typeof rc.category).toBe("string");
      expect(typeof rc.label).toBe("string");
    }
  });

  it("contains all expected categories", () => {
    const cats = RISK_CATEGORIES.map((c) => c.category);
    expect(cats).toContain("safeguarding");
    expect(cats).toContain("health_safety");
    expect(cats).toContain("staffing");
    expect(cats).toContain("operational");
    expect(cats).toContain("environmental");
    expect(cats).toContain("financial");
    expect(cats).toContain("reputational");
    expect(cats).toContain("regulatory");
    expect(cats).toContain("individual_child");
    expect(cats).toContain("community");
    expect(cats).toContain("other");
  });

  it("has unique categories", () => {
    const cats = RISK_CATEGORIES.map((c) => c.category);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it("has non-empty labels", () => {
    for (const rc of RISK_CATEGORIES) {
      expect(rc.label.length).toBeGreaterThan(0);
    }
  });
});

describe("RISK_STATUSES", () => {
  it("has exactly 6 entries", () => {
    expect(RISK_STATUSES).toHaveLength(6);
  });

  it("each entry has status and label strings", () => {
    for (const rs of RISK_STATUSES) {
      expect(rs).toHaveProperty("status");
      expect(rs).toHaveProperty("label");
      expect(typeof rs.status).toBe("string");
      expect(typeof rs.label).toBe("string");
    }
  });

  it("contains all expected statuses", () => {
    const statuses = RISK_STATUSES.map((s) => s.status);
    expect(statuses).toContain("open");
    expect(statuses).toContain("mitigated");
    expect(statuses).toContain("accepted");
    expect(statuses).toContain("escalated");
    expect(statuses).toContain("closed");
    expect(statuses).toContain("monitoring");
  });

  it("has unique statuses", () => {
    const statuses = RISK_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });
});

describe("REVIEW_FREQUENCIES", () => {
  it("has exactly 5 entries", () => {
    expect(REVIEW_FREQUENCIES).toHaveLength(5);
  });

  it("each entry has frequency and label strings", () => {
    for (const rf of REVIEW_FREQUENCIES) {
      expect(rf).toHaveProperty("frequency");
      expect(rf).toHaveProperty("label");
      expect(typeof rf.frequency).toBe("string");
      expect(typeof rf.label).toBe("string");
    }
  });

  it("contains all expected frequencies", () => {
    const freqs = REVIEW_FREQUENCIES.map((f) => f.frequency);
    expect(freqs).toContain("weekly");
    expect(freqs).toContain("fortnightly");
    expect(freqs).toContain("monthly");
    expect(freqs).toContain("quarterly");
    expect(freqs).toContain("annually");
  });

  it("has unique frequencies", () => {
    const freqs = REVIEW_FREQUENCIES.map((f) => f.frequency);
    expect(new Set(freqs).size).toBe(freqs.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeRiskScore
// ══════════════════════════════════════════════════════════════════════════════

describe("computeRiskScore", () => {
  describe("boundary combinations", () => {
    it("returns 1 for 1*1", () => {
      expect(computeRiskScore(1, 1)).toBe(1);
    });

    it("returns 2 for 1*2", () => {
      expect(computeRiskScore(1, 2)).toBe(2);
    });

    it("returns 3 for 1*3", () => {
      expect(computeRiskScore(1, 3)).toBe(3);
    });

    it("returns 4 for 1*4", () => {
      expect(computeRiskScore(1, 4)).toBe(4);
    });

    it("returns 5 for 1*5", () => {
      expect(computeRiskScore(1, 5)).toBe(5);
    });

    it("returns 2 for 2*1", () => {
      expect(computeRiskScore(2, 1)).toBe(2);
    });

    it("returns 4 for 2*2", () => {
      expect(computeRiskScore(2, 2)).toBe(4);
    });

    it("returns 6 for 2*3", () => {
      expect(computeRiskScore(2, 3)).toBe(6);
    });

    it("returns 8 for 2*4", () => {
      expect(computeRiskScore(2, 4)).toBe(8);
    });

    it("returns 10 for 2*5", () => {
      expect(computeRiskScore(2, 5)).toBe(10);
    });

    it("returns 3 for 3*1", () => {
      expect(computeRiskScore(3, 1)).toBe(3);
    });

    it("returns 6 for 3*2", () => {
      expect(computeRiskScore(3, 2)).toBe(6);
    });

    it("returns 9 for 3*3", () => {
      expect(computeRiskScore(3, 3)).toBe(9);
    });

    it("returns 12 for 3*4", () => {
      expect(computeRiskScore(3, 4)).toBe(12);
    });

    it("returns 15 for 3*5", () => {
      expect(computeRiskScore(3, 5)).toBe(15);
    });

    it("returns 4 for 4*1", () => {
      expect(computeRiskScore(4, 1)).toBe(4);
    });

    it("returns 8 for 4*2", () => {
      expect(computeRiskScore(4, 2)).toBe(8);
    });

    it("returns 12 for 4*3", () => {
      expect(computeRiskScore(4, 3)).toBe(12);
    });

    it("returns 16 for 4*4", () => {
      expect(computeRiskScore(4, 4)).toBe(16);
    });

    it("returns 20 for 4*5", () => {
      expect(computeRiskScore(4, 5)).toBe(20);
    });

    it("returns 5 for 5*1", () => {
      expect(computeRiskScore(5, 1)).toBe(5);
    });

    it("returns 10 for 5*2", () => {
      expect(computeRiskScore(5, 2)).toBe(10);
    });

    it("returns 15 for 5*3", () => {
      expect(computeRiskScore(5, 3)).toBe(15);
    });

    it("returns 20 for 5*4", () => {
      expect(computeRiskScore(5, 4)).toBe(20);
    });

    it("returns 25 for 5*5", () => {
      expect(computeRiskScore(5, 5)).toBe(25);
    });
  });

  describe("commutative property", () => {
    it("computeRiskScore(2,3) === computeRiskScore(3,2)", () => {
      expect(computeRiskScore(2, 3)).toBe(computeRiskScore(3, 2));
    });

    it("computeRiskScore(1,5) === computeRiskScore(5,1)", () => {
      expect(computeRiskScore(1, 5)).toBe(computeRiskScore(5, 1));
    });

    it("computeRiskScore(4,3) === computeRiskScore(3,4)", () => {
      expect(computeRiskScore(4, 3)).toBe(computeRiskScore(3, 4));
    });

    it("computeRiskScore(2,5) === computeRiskScore(5,2)", () => {
      expect(computeRiskScore(2, 5)).toBe(computeRiskScore(5, 2));
    });

    it("computeRiskScore(4,5) === computeRiskScore(5,4)", () => {
      expect(computeRiskScore(4, 5)).toBe(computeRiskScore(5, 4));
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRiskLevel
// ══════════════════════════════════════════════════════════════════════════════

describe("getRiskLevel", () => {
  describe("critical (>= 20)", () => {
    it("returns critical for score 20", () => {
      expect(getRiskLevel(20)).toBe("critical");
    });

    it("returns critical for score 21", () => {
      expect(getRiskLevel(21)).toBe("critical");
    });

    it("returns critical for score 25", () => {
      expect(getRiskLevel(25)).toBe("critical");
    });

    it("returns critical for score 100", () => {
      expect(getRiskLevel(100)).toBe("critical");
    });
  });

  describe("high (>= 12 and < 20)", () => {
    it("returns high for score 12", () => {
      expect(getRiskLevel(12)).toBe("high");
    });

    it("returns high for score 13", () => {
      expect(getRiskLevel(13)).toBe("high");
    });

    it("returns high for score 15", () => {
      expect(getRiskLevel(15)).toBe("high");
    });

    it("returns high for score 16", () => {
      expect(getRiskLevel(16)).toBe("high");
    });

    it("returns high for score 19", () => {
      expect(getRiskLevel(19)).toBe("high");
    });
  });

  describe("medium (>= 6 and < 12)", () => {
    it("returns medium for score 6", () => {
      expect(getRiskLevel(6)).toBe("medium");
    });

    it("returns medium for score 7", () => {
      expect(getRiskLevel(7)).toBe("medium");
    });

    it("returns medium for score 8", () => {
      expect(getRiskLevel(8)).toBe("medium");
    });

    it("returns medium for score 9", () => {
      expect(getRiskLevel(9)).toBe("medium");
    });

    it("returns medium for score 10", () => {
      expect(getRiskLevel(10)).toBe("medium");
    });

    it("returns medium for score 11", () => {
      expect(getRiskLevel(11)).toBe("medium");
    });
  });

  describe("low (< 6)", () => {
    it("returns low for score 1", () => {
      expect(getRiskLevel(1)).toBe("low");
    });

    it("returns low for score 2", () => {
      expect(getRiskLevel(2)).toBe("low");
    });

    it("returns low for score 3", () => {
      expect(getRiskLevel(3)).toBe("low");
    });

    it("returns low for score 4", () => {
      expect(getRiskLevel(4)).toBe("low");
    });

    it("returns low for score 5", () => {
      expect(getRiskLevel(5)).toBe("low");
    });

    it("returns low for score 0", () => {
      expect(getRiskLevel(0)).toBe("low");
    });
  });

  describe("exact boundaries", () => {
    it("score 20 is critical (not high)", () => {
      expect(getRiskLevel(20)).toBe("critical");
    });

    it("score 19 is high (not critical)", () => {
      expect(getRiskLevel(19)).toBe("high");
    });

    it("score 12 is high (not medium)", () => {
      expect(getRiskLevel(12)).toBe("high");
    });

    it("score 11 is medium (not high)", () => {
      expect(getRiskLevel(11)).toBe("medium");
    });

    it("score 6 is medium (not low)", () => {
      expect(getRiskLevel(6)).toBe("medium");
    });

    it("score 5 is low (not medium)", () => {
      expect(getRiskLevel(5)).toBe("low");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeRiskMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeRiskMetrics", () => {
  describe("empty array", () => {
    it("returns zeroes for all counts", () => {
      const m = computeRiskMetrics([]);
      expect(m.total_risks).toBe(0);
      expect(m.open_risks).toBe(0);
      expect(m.mitigated_risks).toBe(0);
      expect(m.escalated_risks).toBe(0);
      expect(m.closed_risks).toBe(0);
    });

    it("returns zeroes for risk level counts", () => {
      const m = computeRiskMetrics([]);
      expect(m.critical_risks).toBe(0);
      expect(m.high_risks).toBe(0);
      expect(m.medium_risks).toBe(0);
      expect(m.low_risks).toBe(0);
    });

    it("returns 0 for average_risk_score", () => {
      expect(computeRiskMetrics([]).average_risk_score).toBeNull();;
    });

    it("returns 0 for highest_risk_score", () => {
      expect(computeRiskMetrics([]).highest_risk_score).toBeNull();;
    });

    it("returns 0 for risks_without_mitigations", () => {
      expect(computeRiskMetrics([]).risks_without_mitigations).toBe(0);
    });

    it("returns 0 for review_overdue_count", () => {
      expect(computeRiskMetrics([]).review_overdue_count).toBe(0);
    });

    it("returns 0 for child_specific_risks", () => {
      expect(computeRiskMetrics([]).child_specific_risks).toBe(0);
    });

    it("returns empty by_category", () => {
      expect(computeRiskMetrics([]).by_category).toEqual({});
    });

    it("returns empty by_status", () => {
      expect(computeRiskMetrics([]).by_status).toEqual({});
    });

    it("returns empty by_risk_level", () => {
      expect(computeRiskMetrics([]).by_risk_level).toEqual({});
    });

    it("returns empty by_review_frequency", () => {
      expect(computeRiskMetrics([]).by_review_frequency).toEqual({});
    });
  });

  describe("single entry", () => {
    it("counts total_risks as 1", () => {
      const entry = makeEntry();
      expect(computeRiskMetrics([entry]).total_risks).toBe(1);
    });

    it("counts open_risks for an open entry", () => {
      const entry = makeEntry({ risk_status: "open" });
      expect(computeRiskMetrics([entry]).open_risks).toBe(1);
    });

    it("counts mitigated_risks for a mitigated entry", () => {
      const entry = makeEntry({ risk_status: "mitigated" });
      const m = computeRiskMetrics([entry]);
      expect(m.mitigated_risks).toBe(1);
      expect(m.open_risks).toBe(0);
    });

    it("counts escalated_risks for an escalated entry", () => {
      const entry = makeEntry({ risk_status: "escalated" });
      expect(computeRiskMetrics([entry]).escalated_risks).toBe(1);
    });

    it("counts closed_risks for a closed entry", () => {
      const entry = makeEntry({ risk_status: "closed" });
      expect(computeRiskMetrics([entry]).closed_risks).toBe(1);
    });

    it("classifies a low-score entry correctly", () => {
      const entry = makeEntry({ likelihood: 1, impact: 1, risk_score: 1 });
      const m = computeRiskMetrics([entry]);
      expect(m.low_risks).toBe(1);
      expect(m.medium_risks).toBe(0);
      expect(m.high_risks).toBe(0);
      expect(m.critical_risks).toBe(0);
    });

    it("classifies a medium-score entry correctly", () => {
      const entry = makeEntry({ likelihood: 2, impact: 3, risk_score: 6 });
      const m = computeRiskMetrics([entry]);
      expect(m.medium_risks).toBe(1);
    });

    it("classifies a high-score entry correctly", () => {
      const entry = makeEntry({ likelihood: 3, impact: 4, risk_score: 12 });
      const m = computeRiskMetrics([entry]);
      expect(m.high_risks).toBe(1);
    });

    it("classifies a critical-score entry correctly", () => {
      const entry = makeEntry({ likelihood: 5, impact: 5, risk_score: 25 });
      const m = computeRiskMetrics([entry]);
      expect(m.critical_risks).toBe(1);
    });

    it("computes average_risk_score for single entry", () => {
      const entry = makeEntry({ likelihood: 4, impact: 3, risk_score: 12 });
      expect(computeRiskMetrics([entry]).average_risk_score).toBe(12);
    });

    it("computes highest_risk_score for single entry", () => {
      const entry = makeEntry({ likelihood: 5, impact: 4, risk_score: 20 });
      expect(computeRiskMetrics([entry]).highest_risk_score).toBe(20);
    });
  });

  describe("multiple entries", () => {
    const entries = [
      makeEntry({ risk_status: "open", likelihood: 5, impact: 5, risk_score: 25, risk_category: "safeguarding", review_frequency: "weekly" }),
      makeEntry({ risk_status: "open", likelihood: 3, impact: 4, risk_score: 12, risk_category: "safeguarding", review_frequency: "monthly" }),
      makeEntry({ risk_status: "mitigated", likelihood: 2, impact: 3, risk_score: 6, risk_category: "operational", review_frequency: "monthly" }),
      makeEntry({ risk_status: "escalated", likelihood: 4, impact: 5, risk_score: 20, risk_category: "staffing", review_frequency: "weekly" }),
      makeEntry({ risk_status: "closed", likelihood: 1, impact: 2, risk_score: 2, risk_category: "financial", review_frequency: "quarterly" }),
    ];

    it("computes total_risks", () => {
      expect(computeRiskMetrics(entries).total_risks).toBe(5);
    });

    it("computes open_risks", () => {
      expect(computeRiskMetrics(entries).open_risks).toBe(2);
    });

    it("computes mitigated_risks", () => {
      expect(computeRiskMetrics(entries).mitigated_risks).toBe(1);
    });

    it("computes escalated_risks", () => {
      expect(computeRiskMetrics(entries).escalated_risks).toBe(1);
    });

    it("computes closed_risks", () => {
      expect(computeRiskMetrics(entries).closed_risks).toBe(1);
    });

    it("computes critical_risks", () => {
      // scores: 25 (critical), 12 (high), 6 (medium), 20 (critical), 2 (low)
      expect(computeRiskMetrics(entries).critical_risks).toBe(2);
    });

    it("computes high_risks", () => {
      expect(computeRiskMetrics(entries).high_risks).toBe(1);
    });

    it("computes medium_risks", () => {
      expect(computeRiskMetrics(entries).medium_risks).toBe(1);
    });

    it("computes low_risks", () => {
      expect(computeRiskMetrics(entries).low_risks).toBe(1);
    });

    it("computes average_risk_score rounded to 1 decimal", () => {
      // (25 + 12 + 6 + 20 + 2) / 5 = 65 / 5 = 13
      expect(computeRiskMetrics(entries).average_risk_score).toBe(13);
    });

    it("computes highest_risk_score", () => {
      expect(computeRiskMetrics(entries).highest_risk_score).toBe(25);
    });
  });

  describe("average_risk_score rounding", () => {
    it("rounds to 1 decimal place", () => {
      // scores: 7, 8 => avg = 7.5
      const entries = [
        makeEntry({ risk_score: 7 }),
        makeEntry({ risk_score: 8 }),
      ];
      expect(computeRiskMetrics(entries).average_risk_score).toBe(7.5);
    });

    it("rounds 0.333... to 0.3", () => {
      // scores: 1, 0, 0 => avg = 0.333..
      const entries = [
        makeEntry({ risk_score: 1 }),
        makeEntry({ risk_score: 0 }),
        makeEntry({ risk_score: 0 }),
      ];
      expect(computeRiskMetrics(entries).average_risk_score).toBe(0.3);
    });

    it("rounds 0.666... to 0.7", () => {
      // scores: 1, 1, 0 => avg = 0.666..
      const entries = [
        makeEntry({ risk_score: 1 }),
        makeEntry({ risk_score: 1 }),
        makeEntry({ risk_score: 0 }),
      ];
      expect(computeRiskMetrics(entries).average_risk_score).toBe(0.7);
    });
  });

  describe("risks_without_mitigations", () => {
    it("counts entries with empty mitigations array", () => {
      const entries = [
        makeEntry({ mitigations: [] }),
        makeEntry({ mitigations: ["A"] }),
      ];
      expect(computeRiskMetrics(entries).risks_without_mitigations).toBe(1);
    });

    it("excludes closed entries even with no mitigations", () => {
      const entries = [
        makeEntry({ mitigations: [], risk_status: "closed" }),
        makeEntry({ mitigations: [] }),
      ];
      expect(computeRiskMetrics(entries).risks_without_mitigations).toBe(1);
    });

    it("counts multiple entries without mitigations", () => {
      const entries = [
        makeEntry({ mitigations: [] }),
        makeEntry({ mitigations: [] }),
        makeEntry({ mitigations: [] }),
      ];
      expect(computeRiskMetrics(entries).risks_without_mitigations).toBe(3);
    });

    it("returns 0 when all have mitigations", () => {
      const entries = [
        makeEntry({ mitigations: ["A"] }),
        makeEntry({ mitigations: ["B", "C"] }),
      ];
      expect(computeRiskMetrics(entries).risks_without_mitigations).toBe(0);
    });
  });

  describe("review_overdue_count", () => {
    it("counts entries with next_review_date far in the past", () => {
      const entries = [
        makeEntry({ next_review_date: "2020-01-01" }),
      ];
      expect(computeRiskMetrics(entries).review_overdue_count).toBe(1);
    });

    it("does not count entries with next_review_date far in the future", () => {
      const entries = [
        makeEntry({ next_review_date: "2099-12-31" }),
      ];
      expect(computeRiskMetrics(entries).review_overdue_count).toBe(0);
    });

    it("does not count closed entries even if overdue", () => {
      const entries = [
        makeEntry({ next_review_date: "2020-01-01", risk_status: "closed" }),
      ];
      expect(computeRiskMetrics(entries).review_overdue_count).toBe(0);
    });

    it("does not count entries with null next_review_date", () => {
      const entries = [
        makeEntry({ next_review_date: null }),
      ];
      expect(computeRiskMetrics(entries).review_overdue_count).toBe(0);
    });

    it("counts multiple overdue entries", () => {
      const entries = [
        makeEntry({ next_review_date: "2020-01-01" }),
        makeEntry({ next_review_date: "2019-06-15" }),
        makeEntry({ next_review_date: "2099-12-31" }),
      ];
      expect(computeRiskMetrics(entries).review_overdue_count).toBe(2);
    });
  });

  describe("child_specific_risks", () => {
    it("counts entries where child_id is not null", () => {
      const entries = [
        makeEntry({ child_id: "child-001" }),
        makeEntry({ child_id: null }),
      ];
      expect(computeRiskMetrics(entries).child_specific_risks).toBe(1);
    });

    it("returns 0 when no child_ids set", () => {
      const entries = [
        makeEntry({ child_id: null }),
        makeEntry({ child_id: null }),
      ];
      expect(computeRiskMetrics(entries).child_specific_risks).toBe(0);
    });

    it("counts all when every entry has child_id", () => {
      const entries = [
        makeEntry({ child_id: "child-001" }),
        makeEntry({ child_id: "child-002" }),
        makeEntry({ child_id: "child-003" }),
      ];
      expect(computeRiskMetrics(entries).child_specific_risks).toBe(3);
    });
  });

  describe("by_category breakdown", () => {
    it("groups entries by risk_category", () => {
      const entries = [
        makeEntry({ risk_category: "safeguarding" }),
        makeEntry({ risk_category: "safeguarding" }),
        makeEntry({ risk_category: "operational" }),
      ];
      const m = computeRiskMetrics(entries);
      expect(m.by_category).toEqual({ safeguarding: 2, operational: 1 });
    });

    it("handles single category", () => {
      const entries = [makeEntry({ risk_category: "financial" })];
      expect(computeRiskMetrics(entries).by_category).toEqual({ financial: 1 });
    });

    it("handles all different categories", () => {
      const categories: RiskCategory[] = [
        "safeguarding", "health_safety", "staffing", "operational",
        "environmental", "financial", "reputational",
      ];
      const entries = categories.map((c) => makeEntry({ risk_category: c }));
      const m = computeRiskMetrics(entries);
      for (const c of categories) {
        expect(m.by_category[c]).toBe(1);
      }
    });
  });

  describe("by_status breakdown", () => {
    it("groups entries by risk_status", () => {
      const entries = [
        makeEntry({ risk_status: "open" }),
        makeEntry({ risk_status: "open" }),
        makeEntry({ risk_status: "closed" }),
        makeEntry({ risk_status: "mitigated" }),
      ];
      const m = computeRiskMetrics(entries);
      expect(m.by_status).toEqual({ open: 2, closed: 1, mitigated: 1 });
    });

    it("handles all six statuses", () => {
      const statuses: RiskStatus[] = ["open", "mitigated", "accepted", "escalated", "closed", "monitoring"];
      const entries = statuses.map((s) => makeEntry({ risk_status: s }));
      const m = computeRiskMetrics(entries);
      for (const s of statuses) {
        expect(m.by_status[s]).toBe(1);
      }
    });
  });

  describe("by_risk_level breakdown", () => {
    it("groups entries by computed risk level", () => {
      const entries = [
        makeEntry({ risk_score: 25 }), // critical
        makeEntry({ risk_score: 20 }), // critical
        makeEntry({ risk_score: 15 }), // high
        makeEntry({ risk_score: 8 }),  // medium
        makeEntry({ risk_score: 3 }),  // low
      ];
      const m = computeRiskMetrics(entries);
      expect(m.by_risk_level).toEqual({
        critical: 2,
        high: 1,
        medium: 1,
        low: 1,
      });
    });

    it("handles all same level", () => {
      const entries = [
        makeEntry({ risk_score: 1 }),
        makeEntry({ risk_score: 2 }),
        makeEntry({ risk_score: 4 }),
      ];
      const m = computeRiskMetrics(entries);
      expect(m.by_risk_level).toEqual({ low: 3 });
    });
  });

  describe("by_review_frequency breakdown", () => {
    it("groups entries by review_frequency", () => {
      const entries = [
        makeEntry({ review_frequency: "weekly" }),
        makeEntry({ review_frequency: "weekly" }),
        makeEntry({ review_frequency: "monthly" }),
        makeEntry({ review_frequency: "annually" }),
      ];
      const m = computeRiskMetrics(entries);
      expect(m.by_review_frequency).toEqual({
        weekly: 2,
        monthly: 1,
        annually: 1,
      });
    });

    it("handles all five frequencies", () => {
      const freqs: ReviewFrequency[] = ["weekly", "fortnightly", "monthly", "quarterly", "annually"];
      const entries = freqs.map((f) => makeEntry({ review_frequency: f }));
      const m = computeRiskMetrics(entries);
      for (const f of freqs) {
        expect(m.by_review_frequency[f]).toBe(1);
      }
    });
  });

  describe("return shape", () => {
    it("returns all 18 expected fields", () => {
      const m = computeRiskMetrics([]);
      const keys = Object.keys(m);
      expect(keys).toContain("total_risks");
      expect(keys).toContain("open_risks");
      expect(keys).toContain("mitigated_risks");
      expect(keys).toContain("escalated_risks");
      expect(keys).toContain("closed_risks");
      expect(keys).toContain("critical_risks");
      expect(keys).toContain("high_risks");
      expect(keys).toContain("medium_risks");
      expect(keys).toContain("low_risks");
      expect(keys).toContain("average_risk_score");
      expect(keys).toContain("highest_risk_score");
      expect(keys).toContain("risks_without_mitigations");
      expect(keys).toContain("review_overdue_count");
      expect(keys).toContain("child_specific_risks");
      expect(keys).toContain("by_category");
      expect(keys).toContain("by_status");
      expect(keys).toContain("by_risk_level");
      expect(keys).toContain("by_review_frequency");
      expect(keys).toHaveLength(18);
    });
  });

  describe("accepted and monitoring statuses", () => {
    it("does not count accepted as open, mitigated, escalated, or closed", () => {
      const entries = [makeEntry({ risk_status: "accepted" })];
      const m = computeRiskMetrics(entries);
      expect(m.open_risks).toBe(0);
      expect(m.mitigated_risks).toBe(0);
      expect(m.escalated_risks).toBe(0);
      expect(m.closed_risks).toBe(0);
      expect(m.total_risks).toBe(1);
    });

    it("does not count monitoring as open, mitigated, escalated, or closed", () => {
      const entries = [makeEntry({ risk_status: "monitoring" })];
      const m = computeRiskMetrics(entries);
      expect(m.open_risks).toBe(0);
      expect(m.mitigated_risks).toBe(0);
      expect(m.escalated_risks).toBe(0);
      expect(m.closed_risks).toBe(0);
      expect(m.total_risks).toBe(1);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyRiskAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyRiskAlerts", () => {
  describe("critical_risk alert", () => {
    it("generates alert for score >= 20 and not closed", () => {
      const entry = makeEntry({ risk_score: 20, risk_status: "open", risk_title: "Critical Fire" });
      const alerts = identifyRiskAlerts([entry], NOW);
      const crit = alerts.filter((a) => a.type === "critical_risk");
      expect(crit).toHaveLength(1);
      expect(crit[0].severity).toBe("critical");
      expect(crit[0].id).toBe(entry.id);
      expect(crit[0].message).toContain("Critical Fire");
      expect(crit[0].message).toContain("20");
    });

    it("generates alert for score 25", () => {
      const entry = makeEntry({ risk_score: 25, risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "critical_risk")).toHaveLength(1);
    });

    it("does NOT generate alert for closed entry with score >= 20", () => {
      const entry = makeEntry({ risk_score: 25, risk_status: "closed" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "critical_risk")).toHaveLength(0);
    });

    it("does NOT generate alert for score 19", () => {
      const entry = makeEntry({ risk_score: 19, risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "critical_risk")).toHaveLength(0);
    });

    it("generates alert for escalated entry with score >= 20", () => {
      const entry = makeEntry({ risk_score: 20, risk_status: "escalated" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "critical_risk")).toHaveLength(1);
    });

    it("generates alert for mitigated entry with score >= 20", () => {
      const entry = makeEntry({ risk_score: 20, risk_status: "mitigated" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "critical_risk")).toHaveLength(1);
    });
  });

  describe("risk_escalated alert", () => {
    it("generates alert for escalated status", () => {
      const entry = makeEntry({
        risk_status: "escalated",
        risk_title: "Staffing Shortage",
        escalated_to: "Director",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      const esc = alerts.filter((a) => a.type === "risk_escalated");
      expect(esc).toHaveLength(1);
      expect(esc[0].severity).toBe("critical");
      expect(esc[0].message).toContain("Staffing Shortage");
      expect(esc[0].message).toContain("Director");
    });

    it("uses 'senior management' when escalated_to is null", () => {
      const entry = makeEntry({ risk_status: "escalated", escalated_to: null });
      const alerts = identifyRiskAlerts([entry], NOW);
      const esc = alerts.filter((a) => a.type === "risk_escalated");
      expect(esc).toHaveLength(1);
      expect(esc[0].message).toContain("senior management");
    });

    it("does NOT generate for non-escalated statuses", () => {
      const statuses: RiskStatus[] = ["open", "mitigated", "accepted", "closed", "monitoring"];
      for (const s of statuses) {
        const entry = makeEntry({ risk_status: s });
        const alerts = identifyRiskAlerts([entry], NOW);
        expect(alerts.filter((a) => a.type === "risk_escalated")).toHaveLength(0);
      }
    });
  });

  describe("no_mitigations alert", () => {
    it("generates alert for open entry with empty mitigations", () => {
      const entry = makeEntry({
        risk_status: "open",
        mitigations: [],
        risk_title: "Unmitigated Risk",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      const noMit = alerts.filter((a) => a.type === "no_mitigations");
      expect(noMit).toHaveLength(1);
      expect(noMit[0].severity).toBe("high");
      expect(noMit[0].message).toContain("Unmitigated Risk");
    });

    it("does NOT generate alert for open entry with mitigations", () => {
      const entry = makeEntry({ risk_status: "open", mitigations: ["Control A"] });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "no_mitigations")).toHaveLength(0);
    });

    it("does NOT generate alert for closed entry with empty mitigations", () => {
      const entry = makeEntry({ risk_status: "closed", mitigations: [] });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "no_mitigations")).toHaveLength(0);
    });

    it("does NOT generate alert for mitigated entry with empty mitigations", () => {
      const entry = makeEntry({ risk_status: "mitigated", mitigations: [] });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "no_mitigations")).toHaveLength(0);
    });

    it("does NOT generate alert for escalated entry with empty mitigations", () => {
      const entry = makeEntry({ risk_status: "escalated", mitigations: [] });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "no_mitigations")).toHaveLength(0);
    });

    it("does NOT generate alert for accepted entry with empty mitigations", () => {
      const entry = makeEntry({ risk_status: "accepted", mitigations: [] });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "no_mitigations")).toHaveLength(0);
    });
  });

  describe("review_overdue alert", () => {
    it("generates alert when next_review_date is before now", () => {
      const entry = makeEntry({
        next_review_date: "2026-01-01",
        risk_status: "open",
        risk_title: "Overdue Review",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      const overdue = alerts.filter((a) => a.type === "review_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("medium");
      expect(overdue[0].message).toContain("Overdue Review");
      expect(overdue[0].message).toContain("2026-01-01");
    });

    it("does NOT generate alert when next_review_date is after now", () => {
      const entry = makeEntry({ next_review_date: "2027-01-01", risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(0);
    });

    it("does NOT generate alert for closed entry even if overdue", () => {
      const entry = makeEntry({ next_review_date: "2020-01-01", risk_status: "closed" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(0);
    });

    it("does NOT generate alert when next_review_date is null", () => {
      const entry = makeEntry({ next_review_date: null, risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(0);
    });

    it("generates alert for mitigated entry with overdue review", () => {
      const entry = makeEntry({ next_review_date: "2025-06-01", risk_status: "mitigated" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(1);
    });

    it("generates alert for escalated entry with overdue review", () => {
      const entry = makeEntry({ next_review_date: "2025-06-01", risk_status: "escalated" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(1);
    });
  });

  describe("safeguarding_risk alert", () => {
    it("generates alert for safeguarding category with score >= 12 and not closed", () => {
      const entry = makeEntry({
        risk_category: "safeguarding",
        risk_score: 12,
        risk_status: "open",
        risk_title: "CSE Risk",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      const sg = alerts.filter((a) => a.type === "safeguarding_risk");
      expect(sg).toHaveLength(1);
      expect(sg[0].severity).toBe("high");
      expect(sg[0].message).toContain("CSE Risk");
      expect(sg[0].message).toContain("12");
    });

    it("generates alert for safeguarding with score 15", () => {
      const entry = makeEntry({ risk_category: "safeguarding", risk_score: 15, risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "safeguarding_risk")).toHaveLength(1);
    });

    it("generates alert for safeguarding with score 25", () => {
      const entry = makeEntry({ risk_category: "safeguarding", risk_score: 25, risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "safeguarding_risk")).toHaveLength(1);
    });

    it("does NOT generate alert for safeguarding with score 11", () => {
      const entry = makeEntry({ risk_category: "safeguarding", risk_score: 11, risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "safeguarding_risk")).toHaveLength(0);
    });

    it("does NOT generate alert for safeguarding with closed status", () => {
      const entry = makeEntry({ risk_category: "safeguarding", risk_score: 20, risk_status: "closed" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "safeguarding_risk")).toHaveLength(0);
    });

    it("does NOT generate alert for non-safeguarding category even with high score", () => {
      const entry = makeEntry({ risk_category: "operational", risk_score: 20, risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "safeguarding_risk")).toHaveLength(0);
    });

    it("does NOT generate for health_safety category with score >= 12", () => {
      const entry = makeEntry({ risk_category: "health_safety", risk_score: 15, risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts.filter((a) => a.type === "safeguarding_risk")).toHaveLength(0);
    });
  });

  describe("no alerts when conditions not met", () => {
    it("returns empty array for an entry that triggers nothing", () => {
      const entry = makeEntry({
        risk_score: 5,
        risk_status: "mitigated",
        mitigations: ["Control A"],
        next_review_date: "2027-01-01",
        risk_category: "operational",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty for closed entry with high score and no mitigations and overdue review", () => {
      const entry = makeEntry({
        risk_score: 25,
        risk_status: "closed",
        mitigations: [],
        next_review_date: "2020-01-01",
        risk_category: "safeguarding",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      // closed blocks critical_risk, review_overdue, safeguarding_risk
      // closed + not open blocks no_mitigations
      // not escalated blocks risk_escalated
      expect(alerts).toHaveLength(0);
    });

    it("returns empty for empty entries array", () => {
      expect(identifyRiskAlerts([], NOW)).toHaveLength(0);
    });
  });

  describe("mixed scenarios", () => {
    it("generates multiple alert types for one entry", () => {
      const entry = makeEntry({
        risk_score: 25,
        risk_status: "escalated",
        mitigations: [],
        next_review_date: "2020-01-01",
        risk_category: "safeguarding",
        risk_title: "Multi Alert",
        escalated_to: "Ofsted",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("critical_risk");
      expect(types).toContain("risk_escalated");
      // no_mitigations requires status "open", so escalated won't trigger it
      expect(types).not.toContain("no_mitigations");
      expect(types).toContain("review_overdue");
      expect(types).toContain("safeguarding_risk");
    });

    it("generates alerts from multiple entries independently", () => {
      const entries = [
        makeEntry({ risk_score: 25, risk_status: "open", risk_category: "safeguarding" }),
        makeEntry({ risk_score: 5, risk_status: "open", mitigations: [] }),
        makeEntry({ risk_score: 8, risk_status: "mitigated", next_review_date: "2020-01-01" }),
      ];
      const alerts = identifyRiskAlerts(entries, NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("critical_risk");
      expect(types).toContain("safeguarding_risk");
      expect(types).toContain("no_mitigations");
      expect(types).toContain("review_overdue");
    });

    it("alert ids reference the correct entry", () => {
      const e1 = makeEntry({ risk_score: 25, risk_status: "open" });
      const e2 = makeEntry({ risk_score: 5, risk_status: "open", mitigations: [] });
      const alerts = identifyRiskAlerts([e1, e2], NOW);
      const critAlerts = alerts.filter((a) => a.type === "critical_risk");
      const noMitAlerts = alerts.filter((a) => a.type === "no_mitigations");
      expect(critAlerts.every((a) => a.id === e1.id)).toBe(true);
      expect(noMitAlerts.every((a) => a.id === e2.id)).toBe(true);
    });

    it("open entry with score 20 and safeguarding generates both critical_risk and safeguarding_risk", () => {
      const entry = makeEntry({
        risk_score: 20,
        risk_status: "open",
        risk_category: "safeguarding",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("critical_risk");
      expect(types).toContain("safeguarding_risk");
    });

    it("open entry with empty mitigations and overdue review gets both alerts", () => {
      const entry = makeEntry({
        risk_score: 5,
        risk_status: "open",
        mitigations: [],
        next_review_date: "2020-01-01",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_mitigations");
      expect(types).toContain("review_overdue");
    });

    it("uses the now parameter for review_overdue (not system time)", () => {
      const entry = makeEntry({
        next_review_date: "2026-06-15",
        risk_status: "open",
      });
      // With NOW = 2026-06-01, review is not yet overdue
      const alertsBefore = identifyRiskAlerts([entry], new Date("2026-06-01T00:00:00Z"));
      expect(alertsBefore.filter((a) => a.type === "review_overdue")).toHaveLength(0);

      // With a later date, review IS overdue
      const alertsAfter = identifyRiskAlerts([entry], new Date("2026-07-01T00:00:00Z"));
      expect(alertsAfter.filter((a) => a.type === "review_overdue")).toHaveLength(1);
    });
  });

  describe("alert structure", () => {
    it("each alert has type, severity, message, and id", () => {
      const entry = makeEntry({ risk_score: 25, risk_status: "open" });
      const alerts = identifyRiskAlerts([entry], NOW);
      for (const a of alerts) {
        expect(a).toHaveProperty("type");
        expect(a).toHaveProperty("severity");
        expect(a).toHaveProperty("message");
        expect(a).toHaveProperty("id");
        expect(typeof a.type).toBe("string");
        expect(typeof a.severity).toBe("string");
        expect(typeof a.message).toBe("string");
        expect(typeof a.id).toBe("string");
      }
    });

    it("severity values are restricted to critical, high, or medium", () => {
      const entry = makeEntry({
        risk_score: 25,
        risk_status: "escalated",
        mitigations: [],
        next_review_date: "2020-01-01",
        risk_category: "safeguarding",
      });
      const alerts = identifyRiskAlerts([entry], NOW);
      for (const a of alerts) {
        expect(["critical", "high", "medium"]).toContain(a.severity);
      }
    });
  });
});
