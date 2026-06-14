import { describe, it, expect } from "vitest";
import {
  computeGasSafetyMetrics,
  identifyGasSafetyAlerts,
  generateGasSafetyCaraInsights,
  type HomeGasSafetyRow,
} from "./home-gas-safety-service";

function makeRow(
  overrides: Partial<HomeGasSafetyRow> = {},
): HomeGasSafetyRow {
  return {
    id: "row-1",
    home_id: "home-1",
    inspection_date: "2026-04-01",
    engineer_name: "Engineer A",
    gas_safe_registration: "GS12345",
    inspection_type: "Annual CP12",
    appliance_location: "Kitchen",
    result: "Safe",
    defects_found: 0,
    remedial_completed: false,
    certificate_issued: true,
    certificate_number: "CERT001",
    carbon_monoxide_alarm_tested: true,
    next_inspection_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeGasSafetyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeGasSafetyMetrics([]);
    expect(m.total_inspections).toBe(0);
    expect(m.immediately_dangerous_count).toBe(0);
    expect(m.certificate_rate).toBe(0);
    expect(m.remedial_completion_rate).toBe(0);
    expect(m.defects_total).toBe(0);
    expect(m.unique_engineers).toBe(0);
  });

  it("counts populated data correctly", () => {
    const rows = [
      makeRow({ id: "r1", result: "Safe", engineer_name: "A", certificate_issued: true, next_inspection_date: "2027-01-01" }),
      makeRow({ id: "r2", result: "Immediately Dangerous", engineer_name: "B", defects_found: 2, remedial_completed: true, certificate_issued: false, compliance_status: "Non-Compliant" }),
      makeRow({ id: "r3", result: "At Risk", engineer_name: "A", defects_found: 1, remedial_completed: false, compliance_status: "Expired" }),
    ];
    const m = computeGasSafetyMetrics(rows);
    expect(m.total_inspections).toBe(3);
    expect(m.immediately_dangerous_count).toBe(1);
    expect(m.at_risk_count).toBe(1);
    expect(m.safe_count).toBe(1);
    expect(m.certificate_rate).toBe(66.7); // 2/3
    expect(m.remedial_completion_rate).toBe(50); // 1 of 2 with defects
    expect(m.co_alarm_rate).toBe(100);
    expect(m.next_inspection_scheduled_rate).toBe(33.3);
    expect(m.non_compliant_count).toBe(2); // Non-Compliant + Expired
    expect(m.defects_total).toBe(3);
    expect(m.unique_engineers).toBe(2);
  });
});

describe("identifyGasSafetyAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyGasSafetyAlerts([])).toEqual([]);
  });

  it("returns empty for all-good rows", () => {
    expect(identifyGasSafetyAlerts([makeRow()])).toEqual([]);
  });

  it("critical: immediately_dangerous when result is Immediately Dangerous", () => {
    const rows = [makeRow({ result: "Immediately Dangerous" })];
    const alerts = identifyGasSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "immediately_dangerous" && a.severity === "critical")).toBe(true);
  });

  it("critical: at_risk_unremediated when At Risk and remedial not completed", () => {
    const rows = [makeRow({ result: "At Risk", remedial_completed: false })];
    const alerts = identifyGasSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "at_risk_unremediated" && a.severity === "critical")).toBe(true);
  });

  it("does NOT fire at_risk_unremediated when remedial IS completed", () => {
    const rows = [makeRow({ result: "At Risk", remedial_completed: true })];
    const alerts = identifyGasSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "at_risk_unremediated")).toBe(false);
  });

  it("high: non_compliant when compliance_status is Non-Compliant", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const alerts = identifyGasSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "non_compliant" && a.severity === "high")).toBe(true);
  });

  it("high: expired_compliance when compliance_status is Expired", () => {
    const rows = [makeRow({ compliance_status: "Expired" })];
    const alerts = identifyGasSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "expired_compliance" && a.severity === "high")).toBe(true);
  });

  it("medium: co_alarm_not_tested when carbon_monoxide_alarm_tested is false", () => {
    const rows = [makeRow({ carbon_monoxide_alarm_tested: false })];
    const alerts = identifyGasSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "co_alarm_not_tested" && a.severity === "medium")).toBe(true);
  });

  it("medium: inspection_overdue when next_inspection_date is in the past", () => {
    const rows = [makeRow({ next_inspection_date: "2020-01-01" })];
    const alerts = identifyGasSafetyAlerts(rows);
    expect(alerts.some((a) => a.type === "inspection_overdue" && a.severity === "medium")).toBe(true);
  });
});

describe("generateGasSafetyCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const insights = generateGasSafetyCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    expect(generateGasSafetyCaraInsights([])).toHaveLength(3);
  });
});
