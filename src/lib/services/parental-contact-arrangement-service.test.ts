import { describe, it, expect } from "vitest";
import {
  computeParentalContactMetrics,
  computeParentalContactAlerts,
} from "./parental-contact-arrangement-service";
import type { ParentalContactArrangementRow } from "./parental-contact-arrangement-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ParentalContactArrangementRow> = {}): ParentalContactArrangementRow {
  return {
    id: "pca-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    contact_date: "2026-05-10",
    contact_type: "face_to_face_supervised",
    contact_outcome: "positive",
    court_order_status: "court_ordered",
    child_experience: "happy_engaged",
    parent_carer_name: "Jane Smith",
    duration_minutes: 60,
    supervised: true,
    supervisor_name: "Staff A",
    court_order_complied: true,
    child_views_before: true,
    child_views_after: true,
    social_worker_informed: true,
    recorded_in_care_plan: true,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeParentalContactMetrics --------------------------------------------

describe("computeParentalContactMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeParentalContactMetrics([]);
    expect(m.total_contacts).toBe(0);
    expect(m.negative_count).toBe(0);
    expect(m.cancelled_count).toBe(0);
    expect(m.court_order_non_compliant_count).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.child_views_before_rate).toBeNull();; expect(m.court_compliance_rate).toBeNull();; expect(m.unique_children).toBe(0);
  });

  it("counts negative, cancelled, refused contacts", () => {
    const rows = [
      makeRow({ id: "1", contact_outcome: "negative" }),
      makeRow({ id: "2", contact_outcome: "cancelled_by_parent" }),
      makeRow({ id: "3", contact_outcome: "cancelled_by_child" }),
      makeRow({ id: "4", child_experience: "refused_contact" }),
      makeRow({ id: "5", contact_outcome: "positive" }),
    ];
    const m = computeParentalContactMetrics(rows);
    expect(m.negative_count).toBe(1);
    expect(m.cancelled_count).toBe(2);
    expect(m.refused_count).toBe(1);
  });

  it("counts court order non-compliance", () => {
    const rows = [
      makeRow({ id: "1", court_order_status: "court_ordered", court_order_complied: false }),
      makeRow({ id: "2", court_order_status: "court_ordered", court_order_complied: true }),
      makeRow({ id: "3", court_order_status: "agreed_informally", court_order_complied: false }),
    ];
    const m = computeParentalContactMetrics(rows);
    expect(m.court_order_non_compliant_count).toBe(1);
  });

  it("calculates court compliance rate only for court-ordered rows", () => {
    const rows = [
      makeRow({ id: "1", court_order_status: "court_ordered", court_order_complied: true }),
      makeRow({ id: "2", court_order_status: "court_ordered", court_order_complied: false }),
      makeRow({ id: "3", court_order_status: "agreed_informally", court_order_complied: false }),
    ];
    const m = computeParentalContactMetrics(rows);
    // 1 of 2 court-ordered complied = 50%
    expect(m.court_compliance_rate).toBe(50);
  });

  it("calculates boolean rates at 100%", () => {
    const rows = [makeRow({ id: "1" }), makeRow({ id: "2" })];
    const m = computeParentalContactMetrics(rows);
    expect(m.child_views_before_rate).toBe(100);
    expect(m.child_views_after_rate).toBe(100);
    expect(m.social_worker_informed_rate).toBe(100);
    expect(m.recorded_in_care_plan_rate).toBe(100);
  });

  it("populates outcome and experience breakdowns", () => {
    const rows = [
      makeRow({ id: "1", contact_outcome: "positive", child_experience: "happy_engaged" }),
      makeRow({ id: "2", contact_outcome: "negative", child_experience: "upset_after" }),
    ];
    const m = computeParentalContactMetrics(rows);
    expect(m.outcome_breakdown.positive).toBe(1);
    expect(m.outcome_breakdown.negative).toBe(1);
    expect(m.experience_breakdown.happy_engaged).toBe(1);
    expect(m.experience_breakdown.upset_after).toBe(1);
  });

  it("counts unique children", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex" }),
      makeRow({ id: "2", child_name: "Alex" }),
      makeRow({ id: "3", child_name: "Beth" }),
    ];
    const m = computeParentalContactMetrics(rows);
    expect(m.unique_children).toBe(2);
  });
});

// -- computeParentalContactAlerts ---------------------------------------------

describe("computeParentalContactAlerts", () => {
  it("returns empty array when no issues", () => {
    const alerts = computeParentalContactAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  it("flags critical court_order_breach_negative", () => {
    const rows = [
      makeRow({ court_order_status: "court_ordered", court_order_complied: false, contact_outcome: "negative" }),
    ];
    const alerts = computeParentalContactAlerts(rows);
    const breach = alerts.filter((a) => a.type === "court_order_breach_negative");
    expect(breach.length).toBe(1);
    expect(breach[0].severity).toBe("critical");
  });

  it("does not flag court_order_breach_negative when outcome is not negative", () => {
    const rows = [
      makeRow({ court_order_status: "court_ordered", court_order_complied: false, contact_outcome: "positive" }),
    ];
    const alerts = computeParentalContactAlerts(rows);
    const breach = alerts.filter((a) => a.type === "court_order_breach_negative");
    expect(breach.length).toBe(0);
  });

  it("flags high repeated_cancellations when >= 2 for same child", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", contact_outcome: "cancelled_by_parent" }),
      makeRow({ id: "2", child_name: "Alex", contact_outcome: "cancelled_by_child" }),
    ];
    const alerts = computeParentalContactAlerts(rows);
    const rc = alerts.filter((a) => a.type === "repeated_cancellations");
    expect(rc.length).toBe(1);
    expect(rc[0].severity).toBe("high");
  });

  it("does not flag repeated_cancellations when < 2 for same child", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", contact_outcome: "cancelled_by_parent" }),
      makeRow({ id: "2", child_name: "Beth", contact_outcome: "cancelled_by_parent" }),
    ];
    const alerts = computeParentalContactAlerts(rows);
    const rc = alerts.filter((a) => a.type === "repeated_cancellations");
    expect(rc.length).toBe(0);
  });

  it("flags high child_views_not_captured when >= 2 contacts missing views", () => {
    const rows = [
      makeRow({ id: "1", child_views_before: false }),
      makeRow({ id: "2", child_views_after: false }),
    ];
    const alerts = computeParentalContactAlerts(rows);
    const cv = alerts.filter((a) => a.type === "child_views_not_captured");
    expect(cv.length).toBe(1);
    expect(cv[0].severity).toBe("high");
  });

  it("flags medium sw_not_informed_court_ordered when >= 1", () => {
    const rows = [
      makeRow({ court_order_status: "court_ordered", social_worker_informed: false }),
    ];
    const alerts = computeParentalContactAlerts(rows);
    const sw = alerts.filter((a) => a.type === "sw_not_informed_court_ordered");
    expect(sw.length).toBe(1);
    expect(sw[0].severity).toBe("medium");
  });
});
