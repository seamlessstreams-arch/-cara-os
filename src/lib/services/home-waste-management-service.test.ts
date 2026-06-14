import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
  validateHomeWasteManagement,
  type HomeWasteManagementRow,
} from "./home-waste-management-service";

function makeRow(overrides: Partial<HomeWasteManagementRow> = {}): HomeWasteManagementRow {
  return {
    id: "row-1",
    home_id: "home-1",
    audit_date: "2026-05-01",
    auditor_name: "Auditor A",
    waste_category: "General Waste",
    collection_frequency: "Weekly",
    provider_name: "Provider A",
    annual_cost: 500,
    contamination_found: false,
    contamination_details: null,
    bin_condition: "Good",
    storage_compliant: true,
    young_people_involved: true,
    duty_of_care_compliant: true,
    waste_transfer_note_held: true,
    waste_carrier_licence_checked: true,
    next_audit_date: "2027-05-01",
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics (waste management)", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_audits).toBe(0);
    expect(m.compliant_count).toBe(0);
    expect(m.compliance_rate).toBe(0);
    expect(m.contamination_rate).toBe(0);
    expect(m.young_people_involvement_rate).toBe(0);
    expect(m.total_annual_cost).toBe(0);
    expect(m.unique_providers).toBe(0);
    expect(m.unique_auditors).toBe(0);
  });

  it("counts correctly for populated data", () => {
    const rows = [
      makeRow({ id: "r1", compliance_status: "Compliant", annual_cost: 1000, contamination_found: true }),
      makeRow({ id: "r2", compliance_status: "Non-Compliant", annual_cost: 500, bin_condition: "Replacement Needed", young_people_involved: false, auditor_name: "Auditor B" }),
      makeRow({ id: "r3", compliance_status: "Action Required", waste_category: "Clinical/Sharps", storage_compliant: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_audits).toBe(3);
    expect(m.compliant_count).toBe(1);
    expect(m.non_compliant_count).toBe(1);
    expect(m.action_required_count).toBe(1);
    // compliance_rate: 1/3
    expect(m.compliance_rate).toBe(33.3);
    expect(m.contamination_count).toBe(1);
    // contamination_rate: 1/3
    expect(m.contamination_rate).toBe(33.3);
    // yp involvement: 2/3
    expect(m.young_people_involvement_rate).toBe(66.7);
    // total_annual_cost: 1000 + 500 + 500
    expect(m.total_annual_cost).toBe(2000);
    expect(m.bin_replacement_needed_count).toBe(1);
    expect(m.regulated_waste_count).toBe(1);
    expect(m.unique_auditors).toBe(2);
  });
});

describe("computeAlerts (waste management)", () => {
  it("returns empty for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical regulated_no_transfer_note for Clinical/Sharps without transfer note", () => {
    const rows = [makeRow({ waste_category: "Clinical/Sharps", waste_transfer_note_held: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "regulated_no_transfer_note");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical regulated_no_carrier_licence for Hazardous without carrier licence check", () => {
    const rows = [makeRow({ waste_category: "Hazardous", waste_carrier_licence_checked: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "regulated_no_carrier_licence");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical hazardous_non_compliant for Clinical/Sharps Non-Compliant", () => {
    const rows = [makeRow({ waste_category: "Clinical/Sharps", compliance_status: "Non-Compliant" })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "hazardous_non_compliant");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical confidential_not_compliant", () => {
    const rows = [makeRow({ waste_category: "Confidential Documents", duty_of_care_compliant: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "confidential_not_compliant");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high non_compliant for non-hazardous Non-Compliant", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "non_compliant");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires high bin_replacement_needed", () => {
    const rows = [makeRow({ bin_condition: "Replacement Needed" })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "bin_replacement_needed")).toBeDefined();
  });

  it("fires high storage_not_compliant", () => {
    const rows = [makeRow({ storage_compliant: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "storage_not_compliant")).toBeDefined();
  });

  it("fires medium no_yp_involvement when no young people involved in any audit", () => {
    const rows = [makeRow({ young_people_involved: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "no_yp_involvement")).toBeDefined();
  });
});

describe("validateHomeWasteManagement", () => {
  it("returns valid for correct input", () => {
    const result = validateHomeWasteManagement({
      auditDate: "2026-05-01",
      auditorName: "Auditor A",
      wasteCategory: "General Waste",
      collectionFrequency: "Weekly",
      binCondition: "Good",
      complianceStatus: "Compliant",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns errors for missing required fields", () => {
    const result = validateHomeWasteManagement({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns error for negative annual cost", () => {
    const result = validateHomeWasteManagement({
      auditDate: "2026-05-01",
      auditorName: "Auditor A",
      wasteCategory: "General Waste",
      collectionFrequency: "Weekly",
      binCondition: "Good",
      complianceStatus: "Compliant",
      annualCost: -100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Annual cost cannot be negative");
  });

  it("returns error when contamination found without details", () => {
    const result = validateHomeWasteManagement({
      auditDate: "2026-05-01",
      auditorName: "Auditor A",
      wasteCategory: "General Waste",
      collectionFrequency: "Weekly",
      binCondition: "Good",
      complianceStatus: "Compliant",
      contaminationFound: true,
      contaminationDetails: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Contamination details"))).toBe(true);
  });

  it("returns error for regulated waste without transfer note", () => {
    const result = validateHomeWasteManagement({
      auditDate: "2026-05-01",
      auditorName: "Auditor A",
      wasteCategory: "Clinical/Sharps",
      collectionFrequency: "Weekly",
      binCondition: "Good",
      complianceStatus: "Compliant",
      wasteTransferNoteHeld: false,
      providerName: "Provider A",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Waste transfer note"))).toBe(true);
  });
});

describe("generateCaraInsights (waste management)", () => {
  it("returns 3 insights", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns insights with correct tags for populated data", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const insights = generateCaraInsights(rows);
    expect(insights[0]).toContain("[sky]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });
});
