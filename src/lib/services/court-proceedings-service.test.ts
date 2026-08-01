import { describe, it, expect } from "vitest";
import {
  computeCourtMetrics,
  identifyCourtAlerts,
  type CourtProceeding,
} from "./court-proceedings-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeProceeding(overrides: Partial<CourtProceeding> = {}): CourtProceeding {
  return {
    id: "proc-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    proceeding_type: "care_order",
    proceeding_status: "active",
    court_name: "Family Court",
    case_number: "FC-2026-001",
    start_date: "2026-01-01",
    next_hearing_date: "2026-06-01",
    next_hearing_type: "case_management",
    guardian_appointed: true,
    guardian_name: "Guardian A",
    solicitor_name: "Solicitor A",
    statement_status: "submitted",
    statement_deadline: "2026-05-15",
    la_social_worker: "SW A",
    home_statement_required: false,
    home_statement_submitted: false,
    court_actions: [],
    child_views_sought: true,
    child_wishes_communicated: true,
    notes: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

describe("court-proceedings-service", () => {
  // ── computeCourtMetrics ────────────────────────────────────────────────

  describe("computeCourtMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeCourtMetrics([]);
      expect(m.total_proceedings).toBe(0);
      expect(m.active_count).toBe(0);
      expect(m.concluded_count).toBe(0);
      expect(m.children_involved).toBe(0);
      expect(m.guardian_appointed_rate).toBeNull();;
      expect(m.statement_submitted_rate).toBeNull();;
      expect(m.child_views_sought_rate).toBeNull();;
    });

    it("computes populated metrics correctly", () => {
      const proceedings = [
        makeProceeding({ id: "p1", child_id: "c1", proceeding_status: "active", guardian_appointed: true, statement_status: "submitted", child_views_sought: true }),
        makeProceeding({ id: "p2", child_id: "c2", proceeding_status: "concluded", guardian_appointed: false, statement_status: "late", child_views_sought: false }),
        makeProceeding({ id: "p3", child_id: "c1", proceeding_status: "adjourned", guardian_appointed: true, statement_status: "filed_with_court", child_views_sought: true, next_hearing_date: null }),
        makeProceeding({ id: "p4", child_id: "c3", proceeding_status: "pending_decision", guardian_appointed: false, statement_status: "drafting", child_views_sought: false }),
      ];
      const m = computeCourtMetrics(proceedings);
      expect(m.total_proceedings).toBe(4);
      expect(m.active_count).toBe(1);
      expect(m.concluded_count).toBe(1);
      expect(m.adjourned_count).toBe(1);
      expect(m.pending_decision_count).toBe(1);
      expect(m.children_involved).toBe(3);
      expect(m.guardian_appointed_rate).toBe(50);
      // submitted or filed_with_court: 2 out of 4 = 50%
      expect(m.statement_submitted_rate).toBe(50);
      expect(m.statement_late_count).toBe(1);
      expect(m.child_views_sought_rate).toBe(50);
      // 3 have next_hearing_date (p1, p2, p4)
      expect(m.upcoming_hearings).toBe(3);
    });

    it("computes home_statement_submitted_rate correctly", () => {
      const proceedings = [
        makeProceeding({ id: "p1", home_statement_required: true, home_statement_submitted: true }),
        makeProceeding({ id: "p2", home_statement_required: true, home_statement_submitted: false }),
        makeProceeding({ id: "p3", home_statement_required: false, home_statement_submitted: false }),
      ];
      const m = computeCourtMetrics(proceedings);
      expect(m.home_statement_required_count).toBe(2);
      expect(m.home_statement_submitted_rate).toBe(50);
    });
  });

  // ── identifyCourtAlerts ────────────────────────────────────────────────

  describe("identifyCourtAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyCourtAlerts([], NOW)).toEqual([]);
    });

    it("flags statement_late (critical)", () => {
      const proceedings = [makeProceeding({ statement_status: "late" })];
      const alerts = identifyCourtAlerts(proceedings, NOW);
      expect(alerts.some((a) => a.type === "statement_late" && a.severity === "critical")).toBe(true);
    });

    it("flags statement_deadline_soon (high) when within 7 days", () => {
      const inFiveDays = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const proceedings = [makeProceeding({ statement_status: "drafting", statement_deadline: inFiveDays })];
      const alerts = identifyCourtAlerts(proceedings, NOW);
      expect(alerts.some((a) => a.type === "statement_deadline_soon" && a.severity === "high")).toBe(true);
    });

    it("does NOT flag statement_deadline_soon when > 7 days out", () => {
      const inTenDays = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const proceedings = [makeProceeding({ statement_status: "drafting", statement_deadline: inTenDays })];
      const alerts = identifyCourtAlerts(proceedings, NOW);
      expect(alerts.some((a) => a.type === "statement_deadline_soon")).toBe(false);
    });

    it("flags home_statement_pending (high) for active proceeding with required but unsubmitted", () => {
      const proceedings = [makeProceeding({ home_statement_required: true, home_statement_submitted: false, proceeding_status: "active" })];
      const alerts = identifyCourtAlerts(proceedings, NOW);
      expect(alerts.some((a) => a.type === "home_statement_pending" && a.severity === "high")).toBe(true);
    });

    it("flags child_views_not_sought (high) for active proceedings", () => {
      const proceedings = [makeProceeding({ child_views_sought: false, proceeding_status: "active" })];
      const alerts = identifyCourtAlerts(proceedings, NOW);
      expect(alerts.some((a) => a.type === "child_views_not_sought" && a.severity === "high")).toBe(true);
    });

    it("flags pending_decision (medium)", () => {
      const proceedings = [makeProceeding({ proceeding_status: "pending_decision" })];
      const alerts = identifyCourtAlerts(proceedings, NOW);
      expect(alerts.some((a) => a.type === "pending_decision" && a.severity === "medium")).toBe(true);
    });
  });
});
