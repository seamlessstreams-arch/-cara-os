import { describe, it, expect } from "vitest";
import {
  computeStaffConflictMetrics,
  computeStaffConflictAlerts,
  generateStaffConflictCaraInsights,
} from "./staff-conflict-of-interest-service";
import type { StaffConflictOfInterestRow } from "./staff-conflict-of-interest-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<StaffConflictOfInterestRow> = {}): StaffConflictOfInterestRow {
  return {
    id: "row-1",
    home_id: "home-1",
    staff_name: "James Allen",
    staff_id: "staff-1",
    declaration_date: "2026-04-01",
    conflict_type: "financial_interest",
    risk_level: "low",
    mitigation_status: "in_place",
    declaration_status: "accepted",
    conflict_description: "Minor financial interest",
    mitigation_plan: "Documented and managed",
    reviewed_by: "Senior Manager",
    annual_review_completed: true,
    manager_aware: true,
    documented_in_file: true,
    no_impact_on_children_confirmed: true,
    organisational_learning: true,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffConflictMetrics -----------------------------------------------

describe("computeStaffConflictMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeStaffConflictMetrics([]);
    expect(m.total_declarations).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.critical_risk_count).toBe(0);
    expect(m.escalated_count).toBe(0);
    expect(m.mitigation_failed_count).toBe(0);
    expect(m.annual_review_rate).toBe(0);
    expect(m.manager_aware_rate).toBe(0);
    expect(m.documented_rate).toBe(0);
    expect(m.no_impact_confirmed_rate).toBe(0);
    expect(m.mitigation_in_place_rate).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("counts risk levels and statuses correctly", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "high" }),
      makeRow({ id: "2", risk_level: "critical" }),
      makeRow({ id: "3", declaration_status: "escalated" }),
      makeRow({ id: "4", mitigation_status: "failed" }),
    ];
    const m = computeStaffConflictMetrics(rows);
    expect(m.high_risk_count).toBe(1);
    expect(m.critical_risk_count).toBe(1);
    expect(m.escalated_count).toBe(1);
    expect(m.mitigation_failed_count).toBe(1);
  });

  it("calculates mitigation_in_place_rate only for rows needing mitigation", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "low", mitigation_status: "in_place" }),
      makeRow({ id: "2", risk_level: "high", mitigation_status: "planned" }),
      makeRow({ id: "3", risk_level: "none_identified", mitigation_status: "not_required" }),
    ];
    const m = computeStaffConflictMetrics(rows);
    // Mitigation needed = rows where risk != none_identified => 2 rows
    // Mitigation in place = 1 => 50%
    expect(m.mitigation_in_place_rate).toBe(50);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", manager_aware: true, documented_in_file: true }),
      makeRow({ id: "2", manager_aware: false, documented_in_file: false }),
    ];
    const m = computeStaffConflictMetrics(rows);
    expect(m.manager_aware_rate).toBe(50);
    expect(m.documented_rate).toBe(50);
  });

  it("builds conflict_type_breakdown", () => {
    const rows = [
      makeRow({ id: "1", conflict_type: "financial_interest" }),
      makeRow({ id: "2", conflict_type: "financial_interest" }),
      makeRow({ id: "3", conflict_type: "personal_relationship" }),
    ];
    const m = computeStaffConflictMetrics(rows);
    expect(m.conflict_type_breakdown).toEqual({ financial_interest: 2, personal_relationship: 1 });
  });
});

// -- computeStaffConflictAlerts ------------------------------------------------

describe("computeStaffConflictAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeStaffConflictAlerts([])).toEqual([]);
  });

  it("returns empty array for safe rows", () => {
    expect(computeStaffConflictAlerts([makeRow()])).toEqual([]);
  });

  it("fires critical alert for critical risk + failed mitigation", () => {
    const rows = [makeRow({ risk_level: "critical", mitigation_status: "failed" })];
    const alerts = computeStaffConflictAlerts(rows);
    const match = alerts.find((a) => a.type === "critical_mitigation_failed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("does NOT fire critical_mitigation_failed for critical risk + in_place mitigation", () => {
    const rows = [makeRow({ risk_level: "critical", mitigation_status: "in_place" })];
    const alerts = computeStaffConflictAlerts(rows);
    const match = alerts.find((a) => a.type === "critical_mitigation_failed");
    expect(match).toBeUndefined();
  });

  it("fires high alert for high risk + manager not aware", () => {
    const rows = [makeRow({ risk_level: "high", manager_aware: false })];
    const alerts = computeStaffConflictAlerts(rows);
    const match = alerts.find((a) => a.type === "high_risk_manager_unaware");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for declarations_not_reviewed (threshold >= 2)", () => {
    const rows = [
      makeRow({ id: "1", declaration_status: "submitted" }),
      makeRow({ id: "2", declaration_status: "submitted" }),
    ];
    const alerts = computeStaffConflictAlerts(rows);
    const match = alerts.find((a) => a.type === "declarations_not_reviewed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("does NOT fire declarations_not_reviewed with only 1 submitted", () => {
    const rows = [makeRow({ declaration_status: "submitted" })];
    const alerts = computeStaffConflictAlerts(rows);
    const match = alerts.find((a) => a.type === "declarations_not_reviewed");
    expect(match).toBeUndefined();
  });

  it("fires medium alert for annual_reviews_incomplete (threshold >= 2)", () => {
    const rows = [
      makeRow({ id: "1", annual_review_completed: false }),
      makeRow({ id: "2", annual_review_completed: false }),
    ];
    const alerts = computeStaffConflictAlerts(rows);
    const match = alerts.find((a) => a.type === "annual_reviews_incomplete");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

// -- generateStaffConflictCaraInsights ----------------------------------------

describe("generateStaffConflictCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const m = computeStaffConflictMetrics([]);
    const a = computeStaffConflictAlerts([]);
    const insights = generateStaffConflictCaraInsights(m, a);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[cyan]");
    expect(insights[2]).toContain("[reflect]");
  });
});
