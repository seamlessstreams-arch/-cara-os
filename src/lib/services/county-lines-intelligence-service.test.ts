import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateCountyLinesIntelligence,
  generateCaraInsights,
  type CountyLinesIntelligenceRow,
} from "./county-lines-intelligence-service";

function makeRow(overrides: Partial<CountyLinesIntelligenceRow> = {}): CountyLinesIntelligenceRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    assessment_date: "2026-05-01",
    assessor_name: "Staff A",
    intelligence_type: "Risk Assessment",
    risk_level: "Medium",
    indicators_present: "Some indicators noted here with detail",
    travel_patterns_noted: false,
    new_possessions_noted: false,
    phone_activity_concerns: false,
    missing_episodes_linked: false,
    peer_association_concerns: false,
    drug_related_concerns: false,
    debt_bondage_suspected: false,
    violence_intimidation_present: false,
    nrm_referral_made: false,
    nrm_referral_date: null,
    police_notified: true,
    social_worker_informed: true,
    multi_agency_meeting_held: true,
    safety_plan_in_place: true,
    disruption_activity: null,
    child_views_obtained: true,
    outcome: "Ongoing Monitoring",
    status: "Active",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("county-lines-intelligence-service", () => {
  // ── computeMetrics ────────────────────────────────────────────────────

  describe("computeMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeMetrics([]);
      expect(m.total_records).toBe(0);
      expect(m.high_risk_count).toBe(0);
      expect(m.critical_count).toBe(0);
      expect(m.nrm_referral_rate).toBe(0);
      expect(m.unique_children).toBe(0);
      expect(m.average_indicators_per_record).toBe(0);
    });

    it("computes populated metrics", () => {
      const rows = [
        makeRow({ id: "r1", child_name: "A", risk_level: "High", travel_patterns_noted: true, nrm_referral_made: true, outcome: "Escalated" }),
        makeRow({ id: "r2", child_name: "B", risk_level: "Critical", debt_bondage_suspected: true, phone_activity_concerns: true, outcome: "NRM Accepted" }),
        makeRow({ id: "r3", child_name: "A", risk_level: "Medium", status: "Archived", disruption_activity: "Disruption ops" }),
      ];
      const m = computeMetrics(rows);
      expect(m.total_records).toBe(3);
      expect(m.high_risk_count).toBe(1);
      expect(m.critical_count).toBe(1);
      expect(m.high_critical_count).toBe(2);
      expect(m.unique_children).toBe(2);
      expect(m.active_cases).toBe(2);
      expect(m.nrm_accepted_count).toBe(1);
      expect(m.by_risk_level["High"]).toBe(1);
      expect(m.by_risk_level["Critical"]).toBe(1);
      // Indicators: r1=1, r2=2, r3=0 => 3/3 = 1.0
      expect(m.average_indicators_per_record).toBe(1);
      expect(m.disruption_activity_rate).toBeGreaterThan(0);
      // escalation: 1 out of 3
      expect(m.escalation_rate).toBe(33.3);
    });
  });

  // ── computeAlerts ─────────────────────────────────────────────────────

  describe("computeAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(computeAlerts([])).toEqual([]);
    });

    it("flags critical_no_safety_plan for Critical + no plan + Active", () => {
      const rows = [makeRow({ risk_level: "Critical", safety_plan_in_place: false, status: "Active" })];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "critical_no_safety_plan" && a.severity === "critical")).toBe(true);
    });

    it("flags exploitation_no_police for debt bondage without police notification", () => {
      const rows = [makeRow({ debt_bondage_suspected: true, police_notified: false, status: "Active" })];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "exploitation_no_police" && a.severity === "critical")).toBe(true);
    });

    it("flags critical_no_nrm for Critical + no NRM + Active", () => {
      const rows = [makeRow({ risk_level: "Critical", nrm_referral_made: false, status: "Active" })];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "critical_no_nrm" && a.severity === "critical")).toBe(true);
    });

    it("flags high_risk_no_multi_agency for High/Critical without meeting", () => {
      const rows = [makeRow({ risk_level: "High", multi_agency_meeting_held: false, status: "Active" })];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "high_risk_no_multi_agency" && a.severity === "high")).toBe(true);
    });

    it("flags multiple_indicators_no_disruption for 4+ indicators without disruption", () => {
      const rows = [makeRow({
        travel_patterns_noted: true,
        new_possessions_noted: true,
        phone_activity_concerns: true,
        missing_episodes_linked: true,
        disruption_activity: null,
        status: "Active",
      })];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "multiple_indicators_no_disruption" && a.severity === "high")).toBe(true);
    });

    it("flags nrm_rejected_review (medium) for NRM Rejected + Active", () => {
      const rows = [makeRow({ outcome: "NRM Rejected", status: "Active" })];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "nrm_rejected_review" && a.severity === "medium")).toBe(true);
    });
  });

  // ── validateCountyLinesIntelligence ────────────────────────────────────

  describe("validateCountyLinesIntelligence", () => {
    it("returns valid for complete input", () => {
      const result = validateCountyLinesIntelligence({
        childName: "Child A",
        assessmentDate: "2026-05-01",
        assessorName: "Staff A",
        intelligenceType: "Risk Assessment",
        riskLevel: "Medium",
        indicatorsPresent: "Some indicators noted",
        outcome: "Ongoing Monitoring",
        status: "Active",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns errors for missing required fields", () => {
      const result = validateCountyLinesIntelligence({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("Child name"))).toBe(true);
      expect(result.errors.some((e) => e.includes("Assessment date"))).toBe(true);
    });

    it("requires NRM referral date when NRM referral made", () => {
      const result = validateCountyLinesIntelligence({
        childName: "A",
        assessmentDate: "2026-05-01",
        assessorName: "B",
        intelligenceType: "NRM Referral",
        riskLevel: "High",
        indicatorsPresent: "Some indicators",
        outcome: "NRM Accepted",
        nrmReferralMade: true,
        nrmReferralDate: null,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("NRM referral date is required"))).toBe(true);
    });
  });

  // ── generateCaraInsights ──────────────────────────────────────────────

  describe("generateCaraInsights", () => {
    it("returns 3 insights for populated data", () => {
      const rows = [makeRow()];
      const insights = generateCaraInsights(rows);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toContain("[sky]");
    });
  });
});
