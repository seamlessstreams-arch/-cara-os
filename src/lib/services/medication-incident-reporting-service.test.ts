import { describe, it, expect } from "vitest";
import {
  computeMedicationIncidentMetrics,
  computeMedicationIncidentAlerts,
  generateMedicationIncidentCaraInsights,
  type MedicationIncidentReportRow,
} from "./medication-incident-reporting-service";

function makeRow(overrides: Partial<MedicationIncidentReportRow> = {}): MedicationIncidentReportRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    incident_date: "2026-05-01",
    incident_type: "wrong_dose",
    incident_severity: "no_harm",
    investigation_status: "closed",
    contributing_factor: "human_error" as string,
    staff_involved: "Staff A",
    medication_name: "Ibuprofen",
    gp_notified: true,
    parent_notified: true,
    social_worker_notified: true,
    ofsted_notified: true,
    root_cause_identified: true,
    learning_shared: true,
    duty_of_candour_applied: true,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMedicationIncidentMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMedicationIncidentMetrics([]);
    expect(m.total_incidents).toBe(0);
    expect(m.serious_harm_count).toBe(0);
    expect(m.moderate_harm_count).toBe(0);
    expect(m.near_miss_count).toBe(0);
    expect(m.open_investigation_count).toBe(0);
    expect(m.gp_notified_rate).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const rows = [
      makeRow({ id: "r1", incident_severity: "serious_harm", investigation_status: "reported", child_name: "A" }),
      makeRow({ id: "r2", incident_severity: "moderate_harm", investigation_status: "under_investigation", child_name: "B" }),
      makeRow({ id: "r3", incident_type: "near_miss", incident_severity: "no_harm", child_name: "A", gp_notified: false }),
      makeRow({ id: "r4", incident_severity: "death", child_name: "C" }),
    ];
    const m = computeMedicationIncidentMetrics(rows);
    expect(m.total_incidents).toBe(4);
    expect(m.serious_harm_count).toBe(2); // serious_harm + death
    expect(m.moderate_harm_count).toBe(1);
    expect(m.near_miss_count).toBe(1);
    expect(m.open_investigation_count).toBe(2); // reported + under_investigation
    expect(m.unique_children).toBe(3);
    // gp_notified: 3 out of 4 = 75%
    expect(m.gp_notified_rate).toBe(75);
  });

  it("builds type_breakdown and severity_breakdown", () => {
    const rows = [
      makeRow({ incident_type: "wrong_dose" }),
      makeRow({ id: "r2", incident_type: "wrong_dose" }),
      makeRow({ id: "r3", incident_type: "adverse_reaction" }),
    ];
    const m = computeMedicationIncidentMetrics(rows);
    expect(m.type_breakdown).toEqual({ wrong_dose: 2, adverse_reaction: 1 });
  });
});

describe("computeMedicationIncidentAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(computeMedicationIncidentAlerts([])).toEqual([]);
  });

  it("returns empty array when no alert conditions are met", () => {
    const rows = [makeRow()];
    expect(computeMedicationIncidentAlerts(rows)).toEqual([]);
  });

  it("fires critical alert for serious_harm_ofsted_not_notified", () => {
    const rows = [makeRow({ incident_severity: "serious_harm", ofsted_notified: false })];
    const alerts = computeMedicationIncidentAlerts(rows);
    const match = alerts.find((a) => a.type === "serious_harm_ofsted_not_notified");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for duty_of_candour_not_applied on moderate+ harm", () => {
    const rows = [makeRow({ incident_severity: "moderate_harm", duty_of_candour_applied: false })];
    const alerts = computeMedicationIncidentAlerts(rows);
    const match = alerts.find((a) => a.type === "duty_of_candour_not_applied");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for multiple_incidents_same_child when >= 2", () => {
    const rows = [
      makeRow({ id: "r1", child_name: "Child A" }),
      makeRow({ id: "r2", child_name: "Child A" }),
    ];
    const alerts = computeMedicationIncidentAlerts(rows);
    const match = alerts.find((a) => a.type === "multiple_incidents_same_child");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
    expect(match!.message).toContain("2");
  });

  it("fires medium alert for closed_without_root_cause", () => {
    const rows = [makeRow({ investigation_status: "closed", root_cause_identified: false })];
    const alerts = computeMedicationIncidentAlerts(rows);
    const match = alerts.find((a) => a.type === "closed_without_root_cause");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

describe("generateMedicationIncidentCaraInsights", () => {
  it("returns 3 insights", () => {
    const metrics = computeMedicationIncidentMetrics([]);
    const alerts = computeMedicationIncidentAlerts([]);
    const insights = generateMedicationIncidentCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[pink]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("includes critical/high alert counts in amber insight when alerts present", () => {
    const rows = [
      makeRow({ incident_severity: "serious_harm", ofsted_notified: false }),
    ];
    const metrics = computeMedicationIncidentMetrics(rows);
    const alerts = computeMedicationIncidentAlerts(rows);
    const insights = generateMedicationIncidentCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("1 critical");
  });
});
