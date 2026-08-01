import { describe, it, expect } from "vitest";
import {
  computeIVMetrics,
  identifyIVAlerts,
  type IndependentVisitorAssignment,
  type IndependentVisitorVisit,
} from "./independent-visitors-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeAssignment(overrides: Partial<IndependentVisitorAssignment> = {}): IndependentVisitorAssignment {
  return {
    id: "assign-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Smith",
    visitor_name: "Dr Brown",
    visitor_organisation: "IV Services Ltd",
    visitor_contact: "01onal",
    dbs_check_date: "2026-01-01",
    dbs_reference: "DBS-123",
    assignment_date: "2026-01-01",
    assignment_reason: "no_contact_with_parent",
    visit_frequency: "monthly",
    last_visit_date: "2026-04-20",
    next_visit_due: "2026-05-20",
    status: "active",
    end_date: null,
    end_reason: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeVisit(overrides: Partial<IndependentVisitorVisit> = {}): IndependentVisitorVisit {
  return {
    id: "visit-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Smith",
    assignment_id: "assign-1",
    visit_date: "2026-05-01",
    visit_duration_minutes: 60,
    visit_type: "in_person",
    visitor_name: "Dr Brown",
    location: "Home",
    child_attended: true,
    child_views: "Happy to see visitor",
    topics_discussed: ["school", "hobbies"],
    concerns_raised: false,
    concern_details: null,
    concerns_escalated: false,
    escalated_to: null,
    child_wishes_recorded: true,
    child_wishes: "Wants more outings",
    next_visit_date: "2026-06-01",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("independent-visitors-service", () => {
  // -- computeIVMetrics ---------------------------------------------------------

  describe("computeIVMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeIVMetrics([], []);
      expect(m.children_with_iv).toBe(0);
      expect(m.active_assignments).toBe(0);
      expect(m.overdue_visits).toBe(0);
      expect(m.visits_this_quarter).toBe(0);
      expect(m.avg_visit_duration).toBeNull();;
      expect(m.child_attendance_rate).toBeNull();;
      expect(m.concerns_raised_count).toBe(0);
    });

    it("counts active assignments and children with IV", () => {
      const assignments = [
        makeAssignment(),
        makeAssignment({ id: "a2", child_id: "child-2", status: "ended" }),
      ];
      const m = computeIVMetrics(assignments, []);
      expect(m.active_assignments).toBe(1);
      expect(m.children_with_iv).toBe(1);
    });

    it("counts overdue visits from active assignments", () => {
      const assignments = [
        makeAssignment({ next_visit_due: "2026-05-01" }), // past NOW
      ];
      const m = computeIVMetrics(assignments, []);
      expect(m.overdue_visits).toBe(1);
    });

    it("computes avg visit duration and attendance rate", () => {
      const visits = [
        makeVisit({ visit_duration_minutes: 60, child_attended: true }),
        makeVisit({ id: "v2", visit_duration_minutes: 90, child_attended: false }),
      ];
      const m = computeIVMetrics([], visits);
      expect(m.avg_visit_duration).toBe(75);
      expect(m.child_attendance_rate).toBe(50);
      expect(m.concerns_raised_count).toBe(0);
    });

    it("counts concerns raised", () => {
      const visits = [makeVisit({ concerns_raised: true })];
      const m = computeIVMetrics([], visits);
      expect(m.concerns_raised_count).toBe(1);
    });

    it("builds by_visit_type and by_assignment_reason breakdowns", () => {
      const assignments = [makeAssignment()];
      const visits = [makeVisit(), makeVisit({ id: "v2", visit_type: "phone_call" })];
      const m = computeIVMetrics(assignments, visits);
      expect(m.by_visit_type["in_person"]).toBe(1);
      expect(m.by_visit_type["phone_call"]).toBe(1);
      expect(m.by_assignment_reason["no_contact_with_parent"]).toBe(1);
    });
  });

  // -- identifyIVAlerts ---------------------------------------------------------

  describe("identifyIVAlerts", () => {
    it("returns no alerts for empty data", () => {
      expect(identifyIVAlerts([], [], NOW)).toHaveLength(0);
    });

    it("fires high visit_overdue when next_visit_due is past", () => {
      const assignments = [makeAssignment({ next_visit_due: "2026-05-01" })];
      const alerts = identifyIVAlerts(assignments, [], NOW);
      const overdue = alerts.find((a) => a.category === "visit_overdue");
      expect(overdue).toBeDefined();
      expect(overdue!.severity).toBe("high");
    });

    it("fires high assignment_pending_too_long after 14 days", () => {
      const assignments = [
        makeAssignment({
          status: "pending",
          assignment_date: "2026-04-01", // 50 days before NOW
        }),
      ];
      const alerts = identifyIVAlerts(assignments, [], NOW);
      expect(alerts.find((a) => a.category === "assignment_pending_too_long")).toBeDefined();
    });

    it("fires critical dbs_missing when no DBS check date", () => {
      const assignments = [makeAssignment({ dbs_check_date: null })];
      const alerts = identifyIVAlerts(assignments, [], NOW);
      expect(alerts.find((a) => a.category === "dbs_missing")).toBeDefined();
    });

    it("fires critical dbs_expired when DBS > 1 year old", () => {
      const assignments = [makeAssignment({ dbs_check_date: "2024-01-01" })];
      const alerts = identifyIVAlerts(assignments, [], NOW);
      expect(alerts.find((a) => a.category === "dbs_expired")).toBeDefined();
    });

    it("fires critical concerns_not_escalated", () => {
      const visits = [makeVisit({ concerns_raised: true, concerns_escalated: false })];
      const alerts = identifyIVAlerts([], visits, NOW);
      expect(alerts.find((a) => a.category === "concerns_not_escalated")).toBeDefined();
    });

    it("fires medium wishes_not_recorded when child attended but wishes not captured", () => {
      const visits = [makeVisit({ child_attended: true, child_wishes_recorded: false })];
      const alerts = identifyIVAlerts([], visits, NOW);
      expect(alerts.find((a) => a.category === "wishes_not_recorded")).toBeDefined();
    });

    it("fires medium child_not_attending for 3 consecutive non-attended visits", () => {
      const visits = [
        makeVisit({ id: "v1", child_attended: false, visit_date: "2026-05-01" }),
        makeVisit({ id: "v2", child_attended: false, visit_date: "2026-04-15" }),
        makeVisit({ id: "v3", child_attended: false, visit_date: "2026-04-01" }),
      ];
      const alerts = identifyIVAlerts([], visits, NOW);
      expect(alerts.find((a) => a.category === "child_not_attending")).toBeDefined();
    });

    it("fires medium ended_without_reason", () => {
      const assignments = [makeAssignment({ status: "ended", end_reason: null })];
      const alerts = identifyIVAlerts(assignments, [], NOW);
      expect(alerts.find((a) => a.category === "ended_without_reason")).toBeDefined();
    });
  });
});
