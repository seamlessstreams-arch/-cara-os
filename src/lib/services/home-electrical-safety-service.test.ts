import { describe, it, expect } from "vitest";
import {
  computeElectricalSafetyMetrics,
  identifyElectricalSafetyAlerts,
  generateElectricalSafetyCaraInsights,
  type HomeElectricalSafetyRow,
} from "./home-electrical-safety-service";

function makeRow(
  overrides: Partial<HomeElectricalSafetyRow> = {},
): HomeElectricalSafetyRow {
  return {
    id: "row-1",
    home_id: "home-1",
    inspection_date: "2026-04-01",
    inspector_name: "Inspector A",
    inspection_type: "EICR",
    result: "Satisfactory",
    certificate_number: null,
    defects_found: 0,
    c1_defects: 0,
    c2_defects: 0,
    c3_defects: 0,
    fi_defects: 0,
    remedial_completed: false,
    next_inspection_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeElectricalSafetyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeElectricalSafetyMetrics([]);
    expect(m.total_inspections).toBe(0);
    expect(m.unsatisfactory_count).toBe(0);
    expect(m.c1_total).toBe(0);
    expect(m.satisfactory_rate).toBe(0);
    expect(m.remedial_completion_rate).toBe(0);
    expect(m.unique_inspectors).toBe(0);
  });

  it("counts populated data correctly", () => {
    const rows = [
      makeRow({ id: "r1", result: "Satisfactory", inspector_name: "A", next_inspection_date: "2027-01-01" }),
      makeRow({ id: "r2", result: "Unsatisfactory", inspector_name: "B", defects_found: 3, c1_defects: 1, c2_defects: 1, c3_defects: 1, remedial_completed: true }),
      makeRow({ id: "r3", result: "Satisfactory", inspector_name: "A", compliance_status: "Critical Non-Compliance" }),
    ];
    const m = computeElectricalSafetyMetrics(rows);
    expect(m.total_inspections).toBe(3);
    expect(m.unsatisfactory_count).toBe(1);
    expect(m.c1_total).toBe(1);
    expect(m.c2_total).toBe(1);
    expect(m.c3_total).toBe(1);
    expect(m.satisfactory_rate).toBe(66.7);
    expect(m.remedial_completion_rate).toBe(100); // 1 defective, 1 completed
    expect(m.next_inspection_scheduled_rate).toBe(33.3);
    expect(m.non_compliant_count).toBe(1); // Critical Non-Compliance
    expect(m.unique_inspectors).toBe(2);
    expect(m.by_result).toEqual({ Satisfactory: 2, Unsatisfactory: 1 });
  });
});

describe("identifyElectricalSafetyAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyElectricalSafetyAlerts([])).toEqual([]);
  });

  it("returns empty for all-good rows", () => {
    const rows = [makeRow()];
    expect(identifyElectricalSafetyAlerts(rows)).toEqual([]);
  });

  it("critical: c1_danger_present when c1_defects > 0", () => {
    const rows = [makeRow({ c1_defects: 2 })];
    const alerts = identifyElectricalSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "c1_danger_present" && a.severity === "critical")).toBe(true);
  });

  it("critical: unsatisfactory_unremediated when Unsatisfactory and remedial not completed", () => {
    const rows = [makeRow({ result: "Unsatisfactory", remedial_completed: false })];
    const alerts = identifyElectricalSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "unsatisfactory_unremediated" && a.severity === "critical")).toBe(true);
  });

  it("does NOT fire unsatisfactory_unremediated when remedial IS completed", () => {
    const rows = [makeRow({ result: "Unsatisfactory", remedial_completed: true })];
    const alerts = identifyElectricalSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "unsatisfactory_unremediated")).toBe(false);
  });

  it("high: c2_potentially_dangerous when c2_defects > 0 and remedial not completed", () => {
    const rows = [makeRow({ c2_defects: 1, defects_found: 1, remedial_completed: false })];
    const alerts = identifyElectricalSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "c2_potentially_dangerous" && a.severity === "high")).toBe(true);
  });

  it("high: critical_non_compliance and major_non_compliance", () => {
    const rows = [
      makeRow({ id: "r1", compliance_status: "Critical Non-Compliance" }),
      makeRow({ id: "r2", compliance_status: "Major Non-Compliance" }),
    ];
    const alerts = identifyElectricalSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "critical_non_compliance" && a.severity === "high")).toBe(true);
    expect(alerts.some((a) => a.type === "major_non_compliance" && a.severity === "high")).toBe(true);
  });

  it("medium: inspection_overdue when next_inspection_date is in the past", () => {
    const rows = [makeRow({ next_inspection_date: "2020-01-01" })];
    const alerts = identifyElectricalSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "inspection_overdue" && a.severity === "medium")).toBe(true);
  });
});

describe("generateElectricalSafetyCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [makeRow()];
    const insights = generateElectricalSafetyCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("1 electrical safety inspections");
  });

  it("returns 3 insights for empty data", () => {
    const insights = generateElectricalSafetyCaraInsights([]);
    expect(insights).toHaveLength(3);
  });
});
