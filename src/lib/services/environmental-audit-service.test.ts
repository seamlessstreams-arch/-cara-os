import { describe, it, expect } from "vitest";
import {
  computeEnvironmentalAuditMetrics,
  identifyEnvironmentalAuditAlerts,
  type EnvironmentalAuditRecord,
} from "./environmental-audit-service";

function makeRecord(overrides: Partial<EnvironmentalAuditRecord> = {}): EnvironmentalAuditRecord {
  return {
    id: "audit-1",
    home_id: "home-1",
    audit_area: "communal_living",
    audit_rating: "good",
    audit_type: "scheduled_audit",
    priority_level: "low",
    audit_date: "2026-05-01",
    area_name: "Lounge",
    homely_feel: true,
    child_friendly: true,
    personalised: true,
    clean_and_tidy: true,
    well_maintained: true,
    safe_environment: true,
    accessible: true,
    adequate_lighting: true,
    temperature_comfortable: true,
    noise_appropriate: true,
    privacy_maintained: true,
    children_consulted: true,
    issues_found: [],
    actions_taken: [],
    audited_by: "Manager",
    next_audit_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("environmental-audit-service", () => {
  // ── computeEnvironmentalAuditMetrics ──────────────────────────────

  describe("computeEnvironmentalAuditMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeEnvironmentalAuditMetrics([]);
      expect(m.total_audits).toBe(0);
      expect(m.outstanding_count).toBe(0);
      expect(m.good_count).toBe(0);
      expect(m.requires_improvement_count).toBe(0);
      expect(m.inadequate_count).toBe(0);
      expect(m.homely_feel_rate).toBeNull();;
      expect(m.immediate_priority_count).toBe(0);
    });

    it("counts ratings correctly", () => {
      const records = [
        makeRecord({ id: "1", audit_rating: "outstanding" }),
        makeRecord({ id: "2", audit_rating: "good" }),
        makeRecord({ id: "3", audit_rating: "requires_improvement" }),
        makeRecord({ id: "4", audit_rating: "inadequate" }),
      ];
      const m = computeEnvironmentalAuditMetrics(records);
      expect(m.total_audits).toBe(4);
      expect(m.outstanding_count).toBe(1);
      expect(m.good_count).toBe(1);
      expect(m.requires_improvement_count).toBe(1);
      expect(m.inadequate_count).toBe(1);
    });

    it("computes boolean rates correctly", () => {
      const records = [
        makeRecord({ id: "1", homely_feel: true, child_friendly: true, safe_environment: true, children_consulted: true }),
        makeRecord({ id: "2", homely_feel: false, child_friendly: false, safe_environment: false, children_consulted: false }),
      ];
      const m = computeEnvironmentalAuditMetrics(records);
      expect(m.homely_feel_rate).toBe(50);
      expect(m.child_friendly_rate).toBe(50);
      expect(m.safe_environment_rate).toBe(50);
      expect(m.children_consulted_rate).toBe(50);
    });

    it("counts immediate priority items", () => {
      const records = [
        makeRecord({ id: "1", priority_level: "immediate" }),
        makeRecord({ id: "2", priority_level: "immediate" }),
        makeRecord({ id: "3", priority_level: "low" }),
      ];
      const m = computeEnvironmentalAuditMetrics(records);
      expect(m.immediate_priority_count).toBe(2);
    });

    it("builds breakdowns by area, rating, type, and priority", () => {
      const records = [
        makeRecord({ id: "1", audit_area: "bedrooms", audit_type: "spot_check", priority_level: "high" }),
        makeRecord({ id: "2", audit_area: "bedrooms", audit_type: "annual_review", priority_level: "low" }),
      ];
      const m = computeEnvironmentalAuditMetrics(records);
      expect(m.by_audit_area["bedrooms"]).toBe(2);
      expect(m.by_audit_type["spot_check"]).toBe(1);
      expect(m.by_audit_type["annual_review"]).toBe(1);
      expect(m.by_priority_level["high"]).toBe(1);
      expect(m.by_priority_level["low"]).toBe(1);
    });
  });

  // ── identifyEnvironmentalAuditAlerts ──────────────────────────────

  describe("identifyEnvironmentalAuditAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyEnvironmentalAuditAlerts([])).toHaveLength(0);
    });

    it("fires inadequate_unsafe (critical) for inadequate rating + not safe", () => {
      const rec = makeRecord({
        id: "iu-1",
        audit_rating: "inadequate",
        safe_environment: false,
        area_name: "Kitchen",
      });
      const alerts = identifyEnvironmentalAuditAlerts([rec]);
      const found = alerts.filter((a) => a.type === "inadequate_unsafe");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires immediate_priority (high) when >= 1 immediate priority area", () => {
      const rec = makeRecord({
        id: "ip-1",
        priority_level: "immediate",
      });
      const alerts = identifyEnvironmentalAuditAlerts([rec]);
      const found = alerts.filter((a) => a.type === "immediate_priority");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires not_child_friendly (high) when >= 2 areas not child-friendly", () => {
      const records = [
        makeRecord({ id: "cf-1", child_friendly: false }),
        makeRecord({ id: "cf-2", child_friendly: false }),
      ];
      const alerts = identifyEnvironmentalAuditAlerts(records);
      const found = alerts.filter((a) => a.type === "not_child_friendly");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires not_personalised (medium) when >= 3 areas not personalised", () => {
      const records = [
        makeRecord({ id: "np-1", personalised: false }),
        makeRecord({ id: "np-2", personalised: false }),
        makeRecord({ id: "np-3", personalised: false }),
      ];
      const alerts = identifyEnvironmentalAuditAlerts(records);
      const found = alerts.filter((a) => a.type === "not_personalised");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("fires children_not_consulted (medium) when >= 3 audits without consultation", () => {
      const records = [
        makeRecord({ id: "nc-1", children_consulted: false }),
        makeRecord({ id: "nc-2", children_consulted: false }),
        makeRecord({ id: "nc-3", children_consulted: false }),
      ];
      const alerts = identifyEnvironmentalAuditAlerts(records);
      const found = alerts.filter((a) => a.type === "children_not_consulted");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("does not fire not_child_friendly with only 1 record", () => {
      const records = [makeRecord({ id: "cf-1", child_friendly: false })];
      const alerts = identifyEnvironmentalAuditAlerts(records);
      const found = alerts.filter((a) => a.type === "not_child_friendly");
      expect(found).toHaveLength(0);
    });

    it("does not fire inadequate_unsafe when rating is inadequate but safe", () => {
      const rec = makeRecord({
        id: "is-1",
        audit_rating: "inadequate",
        safe_environment: true,
      });
      const alerts = identifyEnvironmentalAuditAlerts([rec]);
      const found = alerts.filter((a) => a.type === "inadequate_unsafe");
      expect(found).toHaveLength(0);
    });
  });
});
