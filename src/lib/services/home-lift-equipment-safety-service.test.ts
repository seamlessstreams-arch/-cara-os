import { describe, it, expect } from "vitest";
import {
  computeLiftEquipmentSafetyMetrics,
  identifyLiftEquipmentSafetyAlerts,
  generateLiftEquipmentSafetyCaraInsights,
  type HomeLiftEquipmentSafetyRow,
} from "./home-lift-equipment-safety-service";

function makeRow(overrides: Partial<HomeLiftEquipmentSafetyRow> = {}): HomeLiftEquipmentSafetyRow {
  return {
    id: "row-1",
    home_id: "home-1",
    inspection_date: "2026-05-01",
    inspector_name: "Inspector A",
    equipment_type: "Passenger Lift",
    equipment_location: "Main Hallway",
    inspection_type: "LOLER Thorough Examination",
    result: "Satisfactory",
    defects_found: 0,
    remedial_completed: false,
    certificate_issued: true,
    safe_working_load_confirmed: true,
    next_inspection_date: "2026-11-01",
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeLiftEquipmentSafetyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeLiftEquipmentSafetyMetrics([]);
    expect(m.total_inspections).toBe(0);
    expect(m.prohibited_count).toBe(0);
    expect(m.major_defects_count).toBe(0);
    expect(m.minor_defects_count).toBe(0);
    expect(m.remedial_completion_rate).toBe(0);
    expect(m.certificate_rate).toBe(0);
    expect(m.swl_confirmed_rate).toBe(0);
    expect(m.next_inspection_rate).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.defects_total).toBe(0);
    expect(m.unique_inspectors).toBe(0);
  });

  it("counts totals and breakdowns correctly", () => {
    const rows = [
      makeRow({ id: "r1", result: "Prohibited Use", compliance_status: "Prohibited", defects_found: 3, remedial_completed: true, equipment_type: "Stairlift" }),
      makeRow({ id: "r2", result: "Major Defects", compliance_status: "Non-Compliant", defects_found: 2, remedial_completed: false, inspector_name: "Inspector B" }),
      makeRow({ id: "r3", result: "Minor Defects", defects_found: 1, remedial_completed: true }),
      makeRow({ id: "r4", result: "Satisfactory", certificate_issued: false, safe_working_load_confirmed: false, next_inspection_date: null }),
    ];
    const m = computeLiftEquipmentSafetyMetrics(rows);
    expect(m.total_inspections).toBe(4);
    expect(m.prohibited_count).toBe(1);
    expect(m.major_defects_count).toBe(1);
    expect(m.minor_defects_count).toBe(1);
    expect(m.defects_total).toBe(6);
    expect(m.unique_inspectors).toBe(2);
    // non_compliant_count includes Non-Compliant and Prohibited
    expect(m.non_compliant_count).toBe(2);
    // remedial: 3 rows have defects > 0, 2 completed => 66.7%
    expect(m.remedial_completion_rate).toBe(66.7);
    // certificate: 3/4 = 75%
    expect(m.certificate_rate).toBe(75);
    // swl: 3/4 = 75%
    expect(m.swl_confirmed_rate).toBe(75);
    // next_inspection: 3/4 = 75%
    expect(m.next_inspection_rate).toBe(75);
    // breakdowns
    expect(m.by_equipment_type["Stairlift"]).toBe(1);
    expect(m.by_equipment_type["Passenger Lift"]).toBe(3);
    expect(m.by_result["Prohibited Use"]).toBe(1);
    expect(m.by_compliance_status["Prohibited"]).toBe(1);
  });
});

describe("identifyLiftEquipmentSafetyAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyLiftEquipmentSafetyAlerts([])).toEqual([]);
  });

  it("returns no alerts for fully compliant data", () => {
    const rows = [makeRow()];
    const alerts = identifyLiftEquipmentSafetyAlerts(rows);
    expect(alerts).toEqual([]);
  });

  it("fires critical prohibited_use alert", () => {
    const rows = [makeRow({ result: "Prohibited Use" })];
    const alerts = identifyLiftEquipmentSafetyAlerts(rows);
    const found = alerts.find((a) => a.type === "prohibited_use");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
    expect(found!.record_id).toBe("row-1");
  });

  it("fires critical major_defects_unremediated alert when remedial_completed is false", () => {
    const rows = [makeRow({ result: "Major Defects", defects_found: 2, remedial_completed: false })];
    const alerts = identifyLiftEquipmentSafetyAlerts(rows);
    const found = alerts.find((a) => a.type === "major_defects_unremediated");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("does NOT fire major_defects_unremediated when remedial_completed is true", () => {
    const rows = [makeRow({ result: "Major Defects", defects_found: 2, remedial_completed: true })];
    const alerts = identifyLiftEquipmentSafetyAlerts(rows);
    expect(alerts.find((a) => a.type === "major_defects_unremediated")).toBeUndefined();
  });

  it("fires high non_compliant and prohibited_compliance alerts", () => {
    const rows = [
      makeRow({ id: "r1", compliance_status: "Non-Compliant" }),
      makeRow({ id: "r2", compliance_status: "Prohibited" }),
    ];
    const alerts = identifyLiftEquipmentSafetyAlerts(rows);
    expect(alerts.filter((a) => a.type === "non_compliant")).toHaveLength(1);
    expect(alerts.filter((a) => a.type === "prohibited_compliance")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "non_compliant")!.severity).toBe("high");
    expect(alerts.find((a) => a.type === "prohibited_compliance")!.severity).toBe("high");
  });

  it("fires medium swl_not_confirmed alert", () => {
    const rows = [makeRow({ safe_working_load_confirmed: false })];
    const alerts = identifyLiftEquipmentSafetyAlerts(rows);
    const found = alerts.find((a) => a.type === "swl_not_confirmed");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });
});

describe("generateLiftEquipmentSafetyCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateLiftEquipmentSafetyCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for populated data with alerts", () => {
    const rows = [
      makeRow({ result: "Prohibited Use", compliance_status: "Prohibited", defects_found: 1 }),
    ];
    const insights = generateLiftEquipmentSafetyCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });
});
