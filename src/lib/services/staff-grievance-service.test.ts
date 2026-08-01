import { describe, it, expect } from "vitest";
import {
  computeGrievanceMetrics,
  identifyGrievanceAlerts,
} from "./staff-grievance-service";
import type { StaffGrievance } from "./staff-grievance-service";

// -- Factory -------------------------------------------------------------------

function makeGrievance(overrides: Partial<StaffGrievance> = {}): StaffGrievance {
  return {
    id: "grv-1",
    home_id: "home-1",
    staff_name: "Jane Smith",
    staff_id: "s-1",
    grievance_date: "2026-04-01",
    grievance_category: "working_conditions",
    grievance_stage: "resolved",
    grievance_outcome: "upheld",
    resolution_method: "formal_outcome",
    acknowledged_within_5_days: true,
    hearing_within_28_days: true,
    days_to_resolution: 14,
    investigating_officer: "Officer A",
    union_representative_present: false,
    appeal_lodged: false,
    appeal_outcome: null,
    learning_identified: true,
    learning_details: "Process improved",
    impact_on_children_assessed: true,
    acas_code_followed: true,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeGrievanceMetrics --------------------------------------------------

describe("computeGrievanceMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeGrievanceMetrics([]);
    expect(m.total_grievances).toBe(0);
    expect(m.open_grievances).toBe(0);
    expect(m.resolved_grievances).toBe(0);
    expect(m.upheld_count).toBe(0);
    expect(m.acknowledged_rate).toBeNull();;
    expect(m.hearing_within_28_days_rate).toBeNull();;
    expect(m.average_days_to_resolution).toBeNull();;
    expect(m.acas_code_followed_rate).toBeNull();;
  });

  it("counts open and resolved grievances correctly", () => {
    const grievances = [
      makeGrievance({ id: "1", grievance_stage: "investigating" }),
      makeGrievance({ id: "2", grievance_stage: "resolved" }),
      makeGrievance({ id: "3", grievance_stage: "withdrawn" }),
      makeGrievance({ id: "4", grievance_stage: "hearing_scheduled" }),
    ];
    const m = computeGrievanceMetrics(grievances);
    expect(m.open_grievances).toBe(2);
    expect(m.resolved_grievances).toBe(1);
  });

  it("counts outcomes correctly", () => {
    const grievances = [
      makeGrievance({ id: "1", grievance_outcome: "upheld" }),
      makeGrievance({ id: "2", grievance_outcome: "partially_upheld" }),
      makeGrievance({ id: "3", grievance_outcome: "not_upheld" }),
    ];
    const m = computeGrievanceMetrics(grievances);
    expect(m.upheld_count).toBe(1);
    expect(m.partially_upheld_count).toBe(1);
    expect(m.not_upheld_count).toBe(1);
  });

  it("computes hearing_within_28_days_rate from non-null values only", () => {
    const grievances = [
      makeGrievance({ id: "1", hearing_within_28_days: true }),
      makeGrievance({ id: "2", hearing_within_28_days: false }),
      makeGrievance({ id: "3", hearing_within_28_days: null }),
    ];
    const m = computeGrievanceMetrics(grievances);
    expect(m.hearing_within_28_days_rate).toBe(50);
  });

  it("computes average days to resolution from non-null values", () => {
    const grievances = [
      makeGrievance({ id: "1", days_to_resolution: 10 }),
      makeGrievance({ id: "2", days_to_resolution: 20 }),
      makeGrievance({ id: "3", days_to_resolution: null }),
    ];
    const m = computeGrievanceMetrics(grievances);
    expect(m.average_days_to_resolution).toBe(15);
  });

  it("computes boolean rates correctly", () => {
    const grievances = [
      makeGrievance({ id: "1", acas_code_followed: true, learning_identified: true }),
      makeGrievance({ id: "2", acas_code_followed: false, learning_identified: false }),
    ];
    const m = computeGrievanceMetrics(grievances);
    expect(m.acas_code_followed_rate).toBe(50);
    expect(m.learning_identified_rate).toBe(50);
  });

  it("builds breakdown maps", () => {
    const grievances = [
      makeGrievance({ id: "1", grievance_category: "bullying_harassment" }),
      makeGrievance({ id: "2", grievance_category: "bullying_harassment" }),
      makeGrievance({ id: "3", grievance_category: "pay_benefits" }),
    ];
    const m = computeGrievanceMetrics(grievances);
    expect(m.by_category).toEqual({ bullying_harassment: 2, pay_benefits: 1 });
  });
});

// -- identifyGrievanceAlerts --------------------------------------------------

describe("identifyGrievanceAlerts", () => {
  it("returns empty alerts for empty array", () => {
    expect(identifyGrievanceAlerts([])).toEqual([]);
  });

  it("returns empty alerts when all records compliant", () => {
    expect(identifyGrievanceAlerts([makeGrievance()])).toEqual([]);
  });

  it("fires critical alert for active bullying/harassment grievance", () => {
    const grievances = [
      makeGrievance({ id: "1", grievance_category: "bullying_harassment", grievance_stage: "investigating" }),
    ];
    const alerts = identifyGrievanceAlerts(grievances);
    const found = alerts.filter((a) => a.type === "serious_grievance");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
  });

  it("fires critical alert for active discrimination grievance", () => {
    const grievances = [
      makeGrievance({ id: "1", grievance_category: "discrimination", grievance_stage: "formal_submitted" }),
    ];
    const alerts = identifyGrievanceAlerts(grievances);
    expect(alerts.filter((a) => a.type === "serious_grievance")).toHaveLength(1);
  });

  it("fires high alert when >= 1 grievance not following ACAS code", () => {
    const grievances = [
      makeGrievance({ id: "1", acas_code_followed: false, grievance_stage: "investigating" }),
    ];
    const alerts = identifyGrievanceAlerts(grievances);
    expect(alerts.filter((a) => a.type === "acas_not_followed")).toHaveLength(1);
  });

  it("does not fire ACAS alert for informal_raised or withdrawn stages", () => {
    const grievances = [
      makeGrievance({ id: "1", acas_code_followed: false, grievance_stage: "informal_raised" }),
      makeGrievance({ id: "2", acas_code_followed: false, grievance_stage: "withdrawn" }),
    ];
    const alerts = identifyGrievanceAlerts(grievances);
    expect(alerts.filter((a) => a.type === "acas_not_followed")).toHaveLength(0);
  });

  it("fires high alert when >= 1 grievance not acknowledged within 5 days", () => {
    const grievances = [
      makeGrievance({ id: "1", acknowledged_within_5_days: false, grievance_stage: "investigating" }),
    ];
    const alerts = identifyGrievanceAlerts(grievances);
    expect(alerts.filter((a) => a.type === "late_acknowledgement")).toHaveLength(1);
  });

  it("fires medium alert when >= 2 grievances without impact assessment (excluding withdrawn/informal_raised)", () => {
    const one = [makeGrievance({ id: "1", impact_on_children_assessed: false, grievance_stage: "investigating" })];
    expect(identifyGrievanceAlerts(one).filter((a) => a.type === "no_impact_assessment")).toHaveLength(0);

    const two = [
      makeGrievance({ id: "1", impact_on_children_assessed: false, grievance_stage: "investigating" }),
      makeGrievance({ id: "2", impact_on_children_assessed: false, grievance_stage: "hearing_scheduled" }),
    ];
    const alerts = identifyGrievanceAlerts(two);
    expect(alerts.filter((a) => a.type === "no_impact_assessment")).toHaveLength(1);
  });

  it("fires medium pattern alert when >= 3 grievances in same category", () => {
    const grievances = [
      makeGrievance({ id: "1", grievance_category: "workload", grievance_stage: "investigating" }),
      makeGrievance({ id: "2", grievance_category: "workload", grievance_stage: "formal_submitted" }),
      makeGrievance({ id: "3", grievance_category: "workload", grievance_stage: "resolved" }),
    ];
    const alerts = identifyGrievanceAlerts(grievances);
    expect(alerts.filter((a) => a.type === "pattern_grievance")).toHaveLength(1);
  });
});
