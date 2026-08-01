import { describe, it, expect } from "vitest";
import {
  computeVisitMetrics,
  identifyVisitAlerts,
} from "./provider-visits-service";
import type { ProviderVisit } from "./provider-visits-service";

// -- Factory ------------------------------------------------------------------

const NOW = new Date("2026-05-21T12:00:00Z");

function makeVisit(overrides: Partial<ProviderVisit> = {}): ProviderVisit {
  return {
    id: "visit-1",
    home_id: "home-1",
    visit_type: "social_worker",
    visitor_name: "Jane Smith",
    visitor_organisation: "LA Services",
    visit_date: "2026-05-15",
    visit_status: "completed",
    outcome: "satisfactory",
    children_seen: ["Alex"],
    children_spoken_privately: ["Alex"],
    staff_spoken_to: ["Staff A"],
    premises_inspected: true,
    records_reviewed: true,
    actions_raised: [],
    actions_completed: 0,
    report_received: true,
    report_date: "2026-05-16",
    next_visit_due: "2026-06-15",
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

// -- computeVisitMetrics ------------------------------------------------------

describe("computeVisitMetrics", () => {
  it("returns zeroes for empty visits", () => {
    const m = computeVisitMetrics([], NOW);
    expect(m.total_visits).toBe(0);
    expect(m.completed_visits).toBe(0);
    expect(m.scheduled_visits).toBe(0);
    expect(m.overdue_visits).toBe(0);
    expect(m.cancelled_visits).toBe(0);
    expect(m.satisfactory_rate).toBeNull();;
    expect(m.concerns_raised_count).toBe(0);
    expect(m.actions_outstanding).toBe(0);
    expect(m.reports_pending).toBe(0);
    expect(m.reg_44_completed).toBe(0);
    expect(m.sw_visits_completed).toBe(0);
  });

  it("counts statuses correctly", () => {
    const visits = [
      makeVisit({ id: "1", visit_status: "completed" }),
      makeVisit({ id: "2", visit_status: "scheduled", visit_date: "2026-06-01" }),
      makeVisit({ id: "3", visit_status: "overdue" }),
      makeVisit({ id: "4", visit_status: "cancelled" }),
    ];
    const m = computeVisitMetrics(visits, NOW);
    expect(m.completed_visits).toBe(1);
    expect(m.scheduled_visits).toBe(1);
    expect(m.cancelled_visits).toBe(1);
    expect(m.overdue_visits).toBe(1); // explicitly overdue only
  });

  it("counts scheduled visits past date as additional overdue", () => {
    const visits = [
      makeVisit({ id: "1", visit_status: "scheduled", visit_date: "2026-05-01" }), // past
      makeVisit({ id: "2", visit_status: "scheduled", visit_date: "2026-06-01" }), // future
    ];
    const m = computeVisitMetrics(visits, NOW);
    expect(m.overdue_visits).toBe(1);
  });

  it("computes satisfactory rate from completed visits only", () => {
    const visits = [
      makeVisit({ id: "1", visit_status: "completed", outcome: "satisfactory" }),
      makeVisit({ id: "2", visit_status: "completed", outcome: "concerns_raised" }),
      makeVisit({ id: "3", visit_status: "cancelled", outcome: null }),
    ];
    const m = computeVisitMetrics(visits, NOW);
    expect(m.satisfactory_rate).toBe(50);
  });

  it("computes actions outstanding", () => {
    const visits = [
      makeVisit({ id: "1", actions_raised: ["a", "b", "c"], actions_completed: 1 }),
      makeVisit({ id: "2", actions_raised: ["d"], actions_completed: 0 }),
    ];
    const m = computeVisitMetrics(visits, NOW);
    expect(m.actions_outstanding).toBe(3); // (3-1) + (1-0)
  });

  it("counts reports pending for completed visits without report", () => {
    const visits = [
      makeVisit({ id: "1", visit_status: "completed", report_received: false }),
      makeVisit({ id: "2", visit_status: "completed", report_received: true }),
    ];
    const m = computeVisitMetrics(visits, NOW);
    expect(m.reports_pending).toBe(1);
  });

  it("computes children_seen_rate based on children_spoken_privately", () => {
    const visits = [
      makeVisit({ id: "1", visit_status: "completed", children_spoken_privately: ["Alex"] }),
      makeVisit({ id: "2", visit_status: "completed", children_spoken_privately: [] }),
    ];
    const m = computeVisitMetrics(visits, NOW);
    expect(m.children_seen_rate).toBe(50);
  });

  it("counts reg_44 completed and overdue", () => {
    const visits = [
      makeVisit({ id: "1", visit_type: "reg_44", visit_status: "completed" }),
      makeVisit({ id: "2", visit_type: "reg_44", visit_status: "overdue" }),
      makeVisit({ id: "3", visit_type: "social_worker", visit_status: "completed" }),
    ];
    const m = computeVisitMetrics(visits, NOW);
    expect(m.reg_44_completed).toBe(1);
    expect(m.reg_44_overdue).toBe(1);
    expect(m.sw_visits_completed).toBe(1);
  });

  it("populates breakdown records", () => {
    const visits = [
      makeVisit({ id: "1", visit_type: "reg_44", outcome: "satisfactory" }),
      makeVisit({ id: "2", visit_type: "social_worker", outcome: "concerns_raised" }),
    ];
    const m = computeVisitMetrics(visits, NOW);
    expect(m.by_visit_type).toEqual({ reg_44: 1, social_worker: 1 });
    expect(m.by_outcome).toEqual({ satisfactory: 1, concerns_raised: 1 });
  });
});

// -- identifyVisitAlerts ------------------------------------------------------

describe("identifyVisitAlerts", () => {
  it("returns empty alerts for empty visits", () => {
    expect(identifyVisitAlerts([], NOW)).toHaveLength(0);
  });

  it("returns empty alerts for fully compliant completed visit", () => {
    expect(identifyVisitAlerts([makeVisit()], NOW)).toHaveLength(0);
  });

  it("fires critical alert for overdue reg_44 visit", () => {
    const visits = [makeVisit({ visit_type: "reg_44", visit_status: "overdue" })];
    const alerts = identifyVisitAlerts(visits, NOW);
    const reg44 = alerts.filter((a) => a.type === "reg_44_overdue");
    expect(reg44).toHaveLength(1);
    expect(reg44[0].severity).toBe("critical");
  });

  it("fires high alert for concerns raised with outstanding actions", () => {
    const visits = [
      makeVisit({ outcome: "concerns_raised", actions_raised: ["fix this"], actions_completed: 0 }),
    ];
    const alerts = identifyVisitAlerts(visits, NOW);
    expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "actions_outstanding")!.severity).toBe("high");
  });

  it("fires medium alert for report not received after 14 days", () => {
    const visits = [
      makeVisit({ visit_status: "completed", report_received: false, visit_date: "2026-05-01" }),
    ];
    const alerts = identifyVisitAlerts(visits, NOW);
    expect(alerts.filter((a) => a.type === "report_overdue")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "report_overdue")!.severity).toBe("medium");
  });

  it("does NOT fire report_overdue for recent completed visit without report", () => {
    const visits = [
      makeVisit({ visit_status: "completed", report_received: false, visit_date: "2026-05-20" }),
    ];
    const alerts = identifyVisitAlerts(visits, NOW);
    expect(alerts.filter((a) => a.type === "report_overdue")).toHaveLength(0);
  });

  it("fires critical for scheduled reg_44 past date (visit_overdue_by_date)", () => {
    const visits = [
      makeVisit({ visit_type: "reg_44", visit_status: "scheduled", visit_date: "2026-05-01" }),
    ];
    const alerts = identifyVisitAlerts(visits, NOW);
    const overdue = alerts.filter((a) => a.type === "visit_overdue_by_date");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("critical");
  });

  it("fires high for scheduled non-reg_44 past date", () => {
    const visits = [
      makeVisit({ visit_type: "social_worker", visit_status: "scheduled", visit_date: "2026-05-01" }),
    ];
    const alerts = identifyVisitAlerts(visits, NOW);
    const overdue = alerts.filter((a) => a.type === "visit_overdue_by_date");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("high");
  });

  it("fires medium alert for children seen but not spoken to privately", () => {
    const visits = [
      makeVisit({
        visit_status: "completed",
        children_seen: ["Alex"],
        children_spoken_privately: [],
      }),
    ];
    const alerts = identifyVisitAlerts(visits, NOW);
    expect(alerts.filter((a) => a.type === "no_private_discussion")).toHaveLength(1);
  });
});
