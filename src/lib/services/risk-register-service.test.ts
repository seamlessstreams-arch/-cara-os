import { describe, it, expect } from "vitest";
import {
  computeRiskScore,
  getRiskLevel,
  computeRiskMetrics,
  identifyRiskAlerts,
} from "./risk-register-service";
import type { RiskEntry } from "./risk-register-service";

// -- Factory ------------------------------------------------------------------

function makeEntry(overrides: Partial<RiskEntry> = {}): RiskEntry {
  return {
    id: "rr-1",
    home_id: "home-1",
    risk_title: "Staff shortage",
    risk_description: "Ongoing staffing pressure",
    risk_category: "staffing",
    likelihood: 3,
    impact: 3,
    risk_score: 9,
    risk_status: "open",
    mitigations: ["Agency staff"],
    risk_owner: "Manager A",
    review_frequency: "monthly",
    last_review_date: null,
    next_review_date: "2026-06-01",
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

// -- computeRiskScore ---------------------------------------------------------

describe("computeRiskScore", () => {
  it("returns likelihood * impact", () => {
    expect(computeRiskScore(4, 5)).toBe(20);
    expect(computeRiskScore(1, 1)).toBe(1);
  });
});

// -- getRiskLevel -------------------------------------------------------------

describe("getRiskLevel", () => {
  it("returns critical for score >= 20", () => {
    expect(getRiskLevel(20)).toBe("critical");
    expect(getRiskLevel(25)).toBe("critical");
  });

  it("returns high for score 12-19", () => {
    expect(getRiskLevel(12)).toBe("high");
    expect(getRiskLevel(19)).toBe("high");
  });

  it("returns medium for score 6-11", () => {
    expect(getRiskLevel(6)).toBe("medium");
    expect(getRiskLevel(11)).toBe("medium");
  });

  it("returns low for score 1-5", () => {
    expect(getRiskLevel(1)).toBe("low");
    expect(getRiskLevel(5)).toBe("low");
  });
});

// -- computeRiskMetrics -------------------------------------------------------

describe("computeRiskMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeRiskMetrics([]);
    expect(m.total_risks).toBe(0);
    expect(m.open_risks).toBe(0);
    expect(m.critical_risks).toBe(0);
    expect(m.average_risk_score).toBeNull();;
    expect(m.highest_risk_score).toBeNull();;
    expect(m.risks_without_mitigations).toBe(0);
    expect(m.review_overdue_count).toBe(0);
    expect(m.child_specific_risks).toBe(0);
  });

  it("counts by status correctly", () => {
    const entries = [
      makeEntry({ id: "1", risk_status: "open" }),
      makeEntry({ id: "2", risk_status: "mitigated" }),
      makeEntry({ id: "3", risk_status: "escalated" }),
      makeEntry({ id: "4", risk_status: "closed" }),
    ];
    const m = computeRiskMetrics(entries);
    expect(m.open_risks).toBe(1);
    expect(m.mitigated_risks).toBe(1);
    expect(m.escalated_risks).toBe(1);
    expect(m.closed_risks).toBe(1);
  });

  it("counts risk levels from scores", () => {
    const entries = [
      makeEntry({ id: "1", risk_score: 25 }), // critical
      makeEntry({ id: "2", risk_score: 15 }), // high
      makeEntry({ id: "3", risk_score: 8 }),  // medium
      makeEntry({ id: "4", risk_score: 3 }),  // low
    ];
    const m = computeRiskMetrics(entries);
    expect(m.critical_risks).toBe(1);
    expect(m.high_risks).toBe(1);
    expect(m.medium_risks).toBe(1);
    expect(m.low_risks).toBe(1);
  });

  it("computes average and highest risk score", () => {
    const entries = [
      makeEntry({ id: "1", risk_score: 10 }),
      makeEntry({ id: "2", risk_score: 20 }),
    ];
    const m = computeRiskMetrics(entries);
    expect(m.average_risk_score).toBe(15);
    expect(m.highest_risk_score).toBe(20);
  });

  it("counts risks without mitigations (excluding closed)", () => {
    const entries = [
      makeEntry({ id: "1", mitigations: [], risk_status: "open" }),
      makeEntry({ id: "2", mitigations: [], risk_status: "closed" }),
    ];
    const m = computeRiskMetrics(entries);
    expect(m.risks_without_mitigations).toBe(1);
  });

  it("counts overdue reviews (excluding closed)", () => {
    const entries = [
      makeEntry({ id: "1", next_review_date: "2020-01-01", risk_status: "open" }),
      makeEntry({ id: "2", next_review_date: "2020-01-01", risk_status: "closed" }),
    ];
    const m = computeRiskMetrics(entries);
    expect(m.review_overdue_count).toBe(1);
  });

  it("counts child-specific risks", () => {
    const entries = [
      makeEntry({ id: "1", child_id: "child-1" }),
      makeEntry({ id: "2", child_id: null }),
    ];
    const m = computeRiskMetrics(entries);
    expect(m.child_specific_risks).toBe(1);
  });
});

// -- identifyRiskAlerts -------------------------------------------------------

describe("identifyRiskAlerts", () => {
  const now = new Date("2026-05-21");

  it("returns empty for empty array", () => {
    expect(identifyRiskAlerts([], now)).toEqual([]);
  });

  it("fires critical alert for score >= 20 and not closed", () => {
    const entries = [makeEntry({ risk_score: 20, risk_status: "open" })];
    const alerts = identifyRiskAlerts(entries, now);
    const hit = alerts.find((a) => a.type === "critical_risk");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("does NOT fire critical alert for score 20 when closed", () => {
    const entries = [makeEntry({ risk_score: 20, risk_status: "closed" })];
    const alerts = identifyRiskAlerts(entries, now);
    expect(alerts.find((a) => a.type === "critical_risk")).toBeUndefined();
  });

  it("fires critical alert for escalated status", () => {
    const entries = [makeEntry({ risk_status: "escalated" })];
    const alerts = identifyRiskAlerts(entries, now);
    const hit = alerts.find((a) => a.type === "risk_escalated");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires high alert for open risk with no mitigations", () => {
    const entries = [makeEntry({ mitigations: [], risk_status: "open" })];
    const alerts = identifyRiskAlerts(entries, now);
    const hit = alerts.find((a) => a.type === "no_mitigations");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires medium alert for overdue review", () => {
    const entries = [makeEntry({ next_review_date: "2020-01-01", risk_status: "open" })];
    const alerts = identifyRiskAlerts(entries, now);
    const hit = alerts.find((a) => a.type === "review_overdue");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("fires high alert for safeguarding risk with score >= 12 and not closed", () => {
    const entries = [makeEntry({ risk_category: "safeguarding", risk_score: 12, risk_status: "open" })];
    const alerts = identifyRiskAlerts(entries, now);
    const hit = alerts.find((a) => a.type === "safeguarding_risk");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });
});
