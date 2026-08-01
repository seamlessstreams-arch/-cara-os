import { describe, it, expect } from "vitest";
import {
  computeContextualSafeguardingMetrics,
  identifyContextualSafeguardingAlerts,
  type ExploitationScreening,
  type LocalityRiskAssessment,
} from "./contextual-safeguarding-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeScreening(overrides: Partial<ExploitationScreening> = {}): ExploitationScreening {
  return {
    id: "scr-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    screening_date: "2026-05-01",
    screened_by: "Staff A",
    screening_type: "cse",
    risk_level: "no_concern",
    indicators_identified: [],
    protective_factors: [],
    location_risks: [],
    peer_associations: [],
    online_risks_identified: false,
    referral_made: false,
    referral_to: null,
    referral_date: null,
    safety_plan_in_place: false,
    safety_plan_review_date: null,
    next_screening_date: null,
    status: "completed",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeLocalityRisk(overrides: Partial<LocalityRiskAssessment> = {}): LocalityRiskAssessment {
  return {
    id: "lr-1",
    home_id: "home-1",
    location_name: "Town Park",
    location_type: "park",
    risk_type: "drug_dealing",
    risk_level: "low",
    description: "Occasional reports",
    mitigation_measures: [],
    last_reviewed_date: null,
    reviewed_by: null,
    next_review_date: null,
    status: "active",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("contextual-safeguarding-service", () => {
  // ── computeContextualSafeguardingMetrics ───────────────────────────────

  describe("computeContextualSafeguardingMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeContextualSafeguardingMetrics([], [], NOW);
      expect(m.total_screenings).toBe(0);
      expect(m.children_screened).toBe(0);
      expect(m.overdue_screenings).toBe(0);
      expect(m.high_risk_locations).toBe(0);
      expect(m.referral_rate_percentage).toBeNull();;
      expect(m.active_locality_risks).toBe(0);
    });

    it("computes populated metrics", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", risk_level: "serious", referral_made: true, safety_plan_in_place: true }),
        makeScreening({ id: "s2", child_id: "c2", risk_level: "moderate", next_screening_date: "2026-01-01" }),
        makeScreening({ id: "s3", child_id: "c1", risk_level: "emerging", screening_type: "cce" }),
      ];
      const localities = [
        makeLocalityRisk({ id: "l1", risk_level: "high", status: "active" }),
        makeLocalityRisk({ id: "l2", risk_level: "very_high", status: "active" }),
        makeLocalityRisk({ id: "l3", risk_level: "low", status: "archived" }),
      ];
      const m = computeContextualSafeguardingMetrics(screenings, localities, NOW);
      expect(m.total_screenings).toBe(3);
      expect(m.children_screened).toBe(2);
      expect(m.by_risk_level.serious).toBe(1);
      expect(m.by_risk_level.moderate).toBe(1);
      expect(m.by_risk_level.emerging).toBe(1);
      expect(m.overdue_screenings).toBe(1);
      expect(m.referral_rate_percentage).toBe(33);
      expect(m.screenings_with_safety_plan).toBe(1);
      expect(m.high_risk_locations).toBe(2);
      expect(m.active_locality_risks).toBe(2);
    });
  });

  // ── identifyContextualSafeguardingAlerts ───────────────────────────────

  describe("identifyContextualSafeguardingAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyContextualSafeguardingAlerts([], [], NOW)).toEqual([]);
    });

    it("flags serious_risk (critical) for serious risk level", () => {
      const screenings = [makeScreening({ risk_level: "serious" })];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], NOW);
      expect(alerts.some((a) => a.category === "serious_risk" && a.severity === "critical")).toBe(true);
    });

    it("flags significant_risk (high) for significant risk level", () => {
      const screenings = [makeScreening({ risk_level: "significant" })];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], NOW);
      expect(alerts.some((a) => a.category === "significant_risk" && a.severity === "high")).toBe(true);
    });

    it("flags overdue_screening (high) when next_screening_date has passed", () => {
      const screenings = [makeScreening({ next_screening_date: "2026-01-01" })];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], NOW);
      expect(alerts.some((a) => a.category === "overdue_screening" && a.severity === "high")).toBe(true);
    });

    it("flags missing_safety_plan for elevated risk without safety plan", () => {
      const screenings = [
        makeScreening({ risk_level: "moderate", safety_plan_in_place: false }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], NOW);
      expect(alerts.some((a) => a.category === "missing_safety_plan")).toBe(true);
    });

    it("flags missing_safety_plan as critical for serious risk", () => {
      const screenings = [
        makeScreening({ risk_level: "serious", safety_plan_in_place: false }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], NOW);
      const msp = alerts.find((a) => a.category === "missing_safety_plan");
      expect(msp).toBeDefined();
      expect(msp!.severity).toBe("critical");
    });

    it("flags very_high_locality_risk (critical)", () => {
      const localities = [makeLocalityRisk({ risk_level: "very_high", status: "active" })];
      const alerts = identifyContextualSafeguardingAlerts([], localities, NOW);
      expect(alerts.some((a) => a.category === "very_high_locality_risk" && a.severity === "critical")).toBe(true);
    });

    it("flags unreviewed_locality_risk when next_review_date has passed", () => {
      const localities = [makeLocalityRisk({ next_review_date: "2025-01-01", status: "active" })];
      const alerts = identifyContextualSafeguardingAlerts([], localities, NOW);
      expect(alerts.some((a) => a.category === "unreviewed_locality_risk")).toBe(true);
    });

    it("sorts alerts with critical first", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "serious" }),
        makeScreening({ id: "s2", risk_level: "significant" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], NOW);
      expect(alerts.length).toBeGreaterThan(1);
      expect(alerts[0].severity).toBe("critical");
    });
  });
});
