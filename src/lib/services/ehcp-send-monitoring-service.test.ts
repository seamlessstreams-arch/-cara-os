import { describe, it, expect } from "vitest";
import {
  computeEhcpSendMetrics,
  identifyEhcpSendAlerts,
  type EhcpSendMonitoringRecord,
} from "./ehcp-send-monitoring-service";

function makeRecord(overrides: Partial<EhcpSendMonitoringRecord> = {}): EhcpSendMonitoringRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    send_category: "cognition_learning",
    ehcp_status: "plan_issued",
    provision_delivery: "fully_delivered",
    outcome_progress: "on_track",
    session_date: "2026-05-01",
    recorded_by: "Staff A",
    primary_need_description: "Learning support",
    provision_summary: "1:1 TA support",
    specialist_provision: null,
    therapy_provision: null,
    annual_review_date: null,
    last_review_outcome: null,
    outcomes_detail: null,
    parent_carer_views: null,
    child_views: null,
    professional_advice: null,
    local_authority_contact: null,
    approved_by: null,
    approved_at: null,
    next_review_date: null,
    notes: null,
    ehcp_in_place: true,
    annual_review_completed: true,
    provision_monitored: true,
    outcomes_tracked: true,
    child_views_captured: true,
    parent_views_captured: true,
    professional_advice_sought: true,
    local_authority_engaged: true,
    school_liaison_active: true,
    transport_arranged: false,
    transition_planned: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("ehcp-send-monitoring-service", () => {
  // ── computeEhcpSendMetrics ────────────────────────────────────────

  describe("computeEhcpSendMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeEhcpSendMetrics([]);
      expect(m.total_records).toBe(0);
      expect(m.not_delivered_count).toBe(0);
      expect(m.below_expected_count).toBe(0);
      expect(m.review_due_count).toBe(0);
      expect(m.no_ehcp_count).toBe(0);
      expect(m.ehcp_in_place_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });

    it("computes counts and rates for populated data", () => {
      const records = [
        makeRecord({ id: "1", provision_delivery: "not_delivered", outcome_progress: "below_expected", ehcp_status: "annual_review_due", ehcp_in_place: false }),
        makeRecord({ id: "2", provision_delivery: "fully_delivered", outcome_progress: "on_track", ehcp_in_place: true }),
        makeRecord({ id: "3", provision_delivery: "not_delivered", outcome_progress: "significantly_below", ehcp_in_place: true }),
      ];
      const m = computeEhcpSendMetrics(records);
      expect(m.total_records).toBe(3);
      expect(m.not_delivered_count).toBe(2);
      expect(m.below_expected_count).toBe(2); // below_expected + significantly_below
      expect(m.review_due_count).toBe(1);
      expect(m.no_ehcp_count).toBe(1);
      // ehcp_in_place: 2/3 = 66.7%
      expect(m.ehcp_in_place_rate).toBe(66.7);
    });

    it("builds breakdowns by category and status", () => {
      const records = [
        makeRecord({ id: "1", send_category: "autism_spectrum", ehcp_status: "plan_issued" }),
        makeRecord({ id: "2", send_category: "autism_spectrum", ehcp_status: "annual_review_due" }),
      ];
      const m = computeEhcpSendMetrics(records);
      expect(m.by_send_category["autism_spectrum"]).toBe(2);
      expect(m.by_ehcp_status["plan_issued"]).toBe(1);
      expect(m.by_ehcp_status["annual_review_due"]).toBe(1);
    });
  });

  // ── identifyEhcpSendAlerts ────────────────────────────────────────

  describe("identifyEhcpSendAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyEhcpSendAlerts([])).toHaveLength(0);
    });

    it("fires not_delivered_below_expected (critical) per-record", () => {
      const rec = makeRecord({
        id: "a1",
        provision_delivery: "not_delivered",
        outcome_progress: "below_expected",
      });
      const alerts = identifyEhcpSendAlerts([rec]);
      const found = alerts.filter((a) => a.type === "not_delivered_below_expected");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
      expect(found[0].record_id).toBe("a1");
    });

    it("fires no_ehcp_in_place (high) when >= 1 without EHCP", () => {
      const rec = makeRecord({ id: "a2", ehcp_in_place: false });
      const alerts = identifyEhcpSendAlerts([rec]);
      const found = alerts.filter((a) => a.type === "no_ehcp_in_place");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires child_views_not_captured (high) when >= 1 without child views", () => {
      const rec = makeRecord({ id: "a3", child_views_captured: false });
      const alerts = identifyEhcpSendAlerts([rec]);
      const found = alerts.filter((a) => a.type === "child_views_not_captured");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires annual_review_overdue (medium) when >= 2 without review", () => {
      const records = [
        makeRecord({ id: "r1", annual_review_completed: false }),
        makeRecord({ id: "r2", annual_review_completed: false }),
      ];
      const alerts = identifyEhcpSendAlerts(records);
      const found = alerts.filter((a) => a.type === "annual_review_overdue");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("fires no_transition_planned (medium) when >= 2 without transition", () => {
      const records = [
        makeRecord({ id: "t1", transition_planned: false }),
        makeRecord({ id: "t2", transition_planned: false }),
      ];
      const alerts = identifyEhcpSendAlerts(records);
      const found = alerts.filter((a) => a.type === "no_transition_planned");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("does not fire annual_review_overdue with only 1 record missing review", () => {
      const records = [makeRecord({ id: "r1", annual_review_completed: false })];
      const alerts = identifyEhcpSendAlerts(records);
      const found = alerts.filter((a) => a.type === "annual_review_overdue");
      expect(found).toHaveLength(0);
    });
  });
});
