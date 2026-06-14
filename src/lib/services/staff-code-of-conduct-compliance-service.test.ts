import { describe, it, expect } from "vitest";
import {
  computeCodeOfConductMetrics,
  computeCodeOfConductAlerts,
  generateCodeOfConductCaraInsights,
} from "./staff-code-of-conduct-compliance-service";
import type { StaffCodeOfConductComplianceRow } from "./staff-code-of-conduct-compliance-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<StaffCodeOfConductComplianceRow> = {}): StaffCodeOfConductComplianceRow {
  return {
    id: "row-1",
    home_id: "home-1",
    staff_name: "Mark Taylor",
    staff_id: "staff-1",
    review_date: "2026-05-10",
    compliance_area: "professional_conduct",
    compliance_status: "fully_compliant",
    review_type: "annual_acknowledgement",
    action_outcome: "no_action_needed",
    code_acknowledged: true,
    training_completed: true,
    supervision_discussed: true,
    self_assessment_done: true,
    breach_reported: false,
    investigation_completed: false,
    improvement_plan_agreed: false,
    improvement_demonstrated: false,
    reviewer_name: "Senior Manager",
    breach_details: null,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeCodeOfConductMetrics -----------------------------------------------

describe("computeCodeOfConductMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeCodeOfConductMetrics([]);
    expect(m.total_reviews).toBe(0);
    expect(m.breach_count).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.investigation_count).toBe(0);
    expect(m.significant_concern_count).toBe(0);
    expect(m.code_acknowledged_rate).toBe(0);
    expect(m.training_completed_rate).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("counts status categories correctly", () => {
    const rows = [
      makeRow({ id: "1", compliance_status: "breach_identified" }),
      makeRow({ id: "2", compliance_status: "non_compliant" }),
      makeRow({ id: "3", compliance_status: "under_investigation" }),
      makeRow({ id: "4", compliance_status: "significant_concern" }),
      makeRow({ id: "5", compliance_status: "fully_compliant" }),
    ];
    const m = computeCodeOfConductMetrics(rows);
    expect(m.breach_count).toBe(1);
    expect(m.non_compliant_count).toBe(1);
    expect(m.investigation_count).toBe(1);
    expect(m.significant_concern_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", code_acknowledged: true, training_completed: true }),
      makeRow({ id: "2", code_acknowledged: false, training_completed: false }),
    ];
    const m = computeCodeOfConductMetrics(rows);
    expect(m.code_acknowledged_rate).toBe(50);
    expect(m.training_completed_rate).toBe(50);
  });

  it("builds compliance_area_breakdown", () => {
    const rows = [
      makeRow({ id: "1", compliance_area: "safeguarding_practice" }),
      makeRow({ id: "2", compliance_area: "safeguarding_practice" }),
      makeRow({ id: "3", compliance_area: "confidentiality" }),
    ];
    const m = computeCodeOfConductMetrics(rows);
    expect(m.compliance_area_breakdown).toEqual({ safeguarding_practice: 2, confidentiality: 1 });
  });
});

// -- computeCodeOfConductAlerts ------------------------------------------------

describe("computeCodeOfConductAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeCodeOfConductAlerts([])).toEqual([]);
  });

  it("fires critical alert for breach without investigation", () => {
    const rows = [makeRow({ compliance_status: "breach_identified", investigation_completed: false })];
    const alerts = computeCodeOfConductAlerts(rows);
    const match = alerts.find((a) => a.type === "breach_without_investigation");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("does NOT fire breach_without_investigation when investigation completed", () => {
    const rows = [makeRow({ compliance_status: "breach_identified", investigation_completed: true })];
    const alerts = computeCodeOfConductAlerts(rows);
    const match = alerts.find((a) => a.type === "breach_without_investigation");
    expect(match).toBeUndefined();
  });

  it("fires critical alert for non-compliant safeguarding_practice", () => {
    const rows = [makeRow({ compliance_status: "non_compliant", compliance_area: "safeguarding_practice" })];
    const alerts = computeCodeOfConductAlerts(rows);
    const match = alerts.find((a) => a.type === "non_compliant_safeguarding");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for no acknowledgement AND no training", () => {
    const rows = [makeRow({ code_acknowledged: false, training_completed: false })];
    const alerts = computeCodeOfConductAlerts(rows);
    const match = alerts.find((a) => a.type === "no_acknowledgement_no_training");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for significant_concern without improvement plan", () => {
    const rows = [makeRow({ compliance_status: "significant_concern", improvement_plan_agreed: false })];
    const alerts = computeCodeOfConductAlerts(rows);
    const match = alerts.find((a) => a.type === "significant_concern_no_plan");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for concern not discussed in supervision", () => {
    const rows = [makeRow({ compliance_status: "minor_concern", supervision_discussed: false })];
    const alerts = computeCodeOfConductAlerts(rows);
    const match = alerts.find((a) => a.type === "concern_not_in_supervision");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires medium alert for annual_acknowledgement_overdue when staff has no annual review type", () => {
    const rows = [makeRow({ review_type: "spot_check" })];
    const alerts = computeCodeOfConductAlerts(rows);
    const match = alerts.find((a) => a.type === "annual_acknowledgement_overdue");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire annual_acknowledgement_overdue when staff has annual review", () => {
    const rows = [makeRow({ review_type: "annual_acknowledgement" })];
    const alerts = computeCodeOfConductAlerts(rows);
    const match = alerts.find((a) => a.type === "annual_acknowledgement_overdue");
    expect(match).toBeUndefined();
  });
});

// -- generateCodeOfConductCaraInsights ----------------------------------------

describe("generateCodeOfConductCaraInsights", () => {
  it("returns 3 insights for empty rows", () => {
    const insights = generateCodeOfConductCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[emerald]");
    expect(insights[2]).toContain("[reflect]");
  });
});
