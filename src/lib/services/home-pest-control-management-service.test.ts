import { describe, it, expect } from "vitest";
import {
  computePestControlManagementMetrics,
  identifyPestControlManagementAlerts,
  generatePestControlManagementCaraInsights,
  type HomePestControlManagementRow,
} from "./home-pest-control-management-service";

function makeRow(overrides: Partial<HomePestControlManagementRow> = {}): HomePestControlManagementRow {
  return {
    id: "row-1",
    home_id: "home-1",
    inspection_date: "2026-05-01",
    inspector_name: "Inspector A",
    pest_type: "Rodents",
    location: "Kitchen",
    severity: "None Found",
    treatment_required: false,
    treatment_method: null,
    treatment_date: null,
    treatment_completed: false,
    proofing_adequate: true,
    hygiene_satisfactory: true,
    food_storage_adequate: true,
    waste_management_ok: true,
    re_inspection_required: false,
    re_inspection_date: null,
    compliance_status: "Clear",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computePestControlManagementMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computePestControlManagementMetrics([]);
    expect(m.total_inspections).toBe(0);
    expect(m.active_issue_count).toBe(0);
    expect(m.infestation_count).toBe(0);
    expect(m.treatment_required_count).toBe(0);
    expect(m.treatment_completion_rate).toBe(0);
    expect(m.proofing_rate).toBe(0);
    expect(m.hygiene_rate).toBe(0);
    expect(m.food_storage_rate).toBe(0);
    expect(m.waste_management_rate).toBe(0);
    expect(m.re_inspection_due_count).toBe(0);
    expect(m.unique_locations).toBe(0);
    expect(m.unique_inspectors).toBe(0);
  });

  it("counts and rates correctly for populated data", () => {
    const rows = [
      makeRow({ id: "r1", severity: "Infestation", compliance_status: "Active Issue", treatment_required: true, treatment_completed: true, proofing_adequate: false, location: "Kitchen" }),
      makeRow({ id: "r2", severity: "High", treatment_required: true, treatment_completed: false, hygiene_satisfactory: false, food_storage_adequate: false, waste_management_ok: false, location: "Dining Room", inspector_name: "Inspector B" }),
      makeRow({ id: "r3", re_inspection_required: true }),
    ];
    const m = computePestControlManagementMetrics(rows);
    expect(m.total_inspections).toBe(3);
    expect(m.active_issue_count).toBe(1);
    expect(m.infestation_count).toBe(1);
    expect(m.treatment_required_count).toBe(2);
    // 1 of 2 treatment_required completed = 50%
    expect(m.treatment_completion_rate).toBe(50);
    // proofing: 2/3
    expect(m.proofing_rate).toBe(66.7);
    // hygiene: 2/3
    expect(m.hygiene_rate).toBe(66.7);
    // food_storage: 2/3
    expect(m.food_storage_rate).toBe(66.7);
    // waste_management: 2/3
    expect(m.waste_management_rate).toBe(66.7);
    expect(m.re_inspection_due_count).toBe(1);
    expect(m.unique_locations).toBe(2);
    expect(m.unique_inspectors).toBe(2);
  });
});

describe("identifyPestControlManagementAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyPestControlManagementAlerts([])).toEqual([]);
  });

  it("returns no alerts for clean data", () => {
    const alerts = identifyPestControlManagementAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical infestation_found alert for Infestation severity", () => {
    const rows = [makeRow({ severity: "Infestation" })];
    const alerts = identifyPestControlManagementAlerts(rows);
    const found = alerts.find((a) => a.type === "infestation_found");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical food_storage_active_pest alert", () => {
    const rows = [makeRow({ food_storage_adequate: false, compliance_status: "Active Issue" })];
    const alerts = identifyPestControlManagementAlerts(rows);
    const found = alerts.find((a) => a.type === "food_storage_active_pest");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high hygiene_unsatisfactory alert", () => {
    const rows = [makeRow({ hygiene_satisfactory: false })];
    const alerts = identifyPestControlManagementAlerts(rows);
    const found = alerts.find((a) => a.type === "hygiene_unsatisfactory");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires high active_issue_no_treatment alert", () => {
    const rows = [makeRow({ compliance_status: "Active Issue", treatment_required: false })];
    const alerts = identifyPestControlManagementAlerts(rows);
    const found = alerts.find((a) => a.type === "active_issue_no_treatment");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium proofing_inadequate alert", () => {
    const rows = [makeRow({ proofing_adequate: false })];
    const alerts = identifyPestControlManagementAlerts(rows);
    const found = alerts.find((a) => a.type === "proofing_inadequate");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("fires medium re_inspection_overdue alert when date is in the past", () => {
    const rows = [makeRow({ re_inspection_required: true, re_inspection_date: "2020-01-01" })];
    const alerts = identifyPestControlManagementAlerts(rows);
    const found = alerts.find((a) => a.type === "re_inspection_overdue");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });
});

describe("generatePestControlManagementCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generatePestControlManagementCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights with correct tags for data with alerts", () => {
    const rows = [makeRow({ severity: "Infestation" })];
    const insights = generatePestControlManagementCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[lime]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });
});
