import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
  validateEqualityDiversityMonitoring,
  type EqualityDiversityMonitoringRow,
} from "./equality-diversity-monitoring-service";

function makeRow(overrides: Partial<EqualityDiversityMonitoringRow> = {}): EqualityDiversityMonitoringRow {
  return {
    id: "edm-1",
    home_id: "home-1",
    record_date: "2026-05-01",
    recorder_name: "Jane Smith",
    record_type: "Staff Training",
    protected_characteristic: "Race",
    child_name: null,
    staff_name: "Staff A",
    description: "Equality and diversity training delivered to all staff.",
    positive_action_taken: null,
    barriers_identified: null,
    reasonable_adjustments_made: false,
    training_delivered: true,
    policy_updated: false,
    complaint_upheld: null,
    external_agency_involved: false,
    evidence_attached: false,
    review_date: null,
    status: "Closed",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.complaint_count).toBe(0);
    expect(m.upheld_rate).toBe(0);
    expect(m.training_rate).toBe(0);
    expect(m.policy_update_rate).toBe(0);
    expect(m.reasonable_adjustment_rate).toBe(0);
    expect(m.positive_practice_count).toBe(0);
    expect(m.incident_count).toBe(0);
    expect(m.young_person_feedback_count).toBe(0);
    expect(m.staff_feedback_count).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const rows: EqualityDiversityMonitoringRow[] = [
      makeRow({ id: "r1", record_type: "Staff Training", training_delivered: true }),
      makeRow({ id: "r2", record_type: "Complaint — Discrimination", complaint_upheld: true, child_name: "Child A", status: "Action Taken" }),
      makeRow({ id: "r3", record_type: "Incident — Hate Crime", complaint_upheld: false, child_name: "Child B", status: "Recorded", external_agency_involved: true }),
      makeRow({ id: "r4", record_type: "Inclusive Practice Example" }),
      makeRow({ id: "r5", record_type: "Feedback — Young Person", child_name: "Child C" }),
      makeRow({ id: "r6", record_type: "Feedback — Staff", staff_name: "Staff B" }),
      makeRow({ id: "r7", record_type: "Reasonable Adjustment", reasonable_adjustments_made: true, policy_updated: true }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(7);
    expect(m.complaint_count).toBe(2); // Complaint + Hate Crime
    expect(m.incident_count).toBe(1); // Hate Crime only
    expect(m.positive_practice_count).toBe(1); // Inclusive Practice Example
    expect(m.young_person_feedback_count).toBe(1);
    expect(m.staff_feedback_count).toBe(1);
    // upheld_rate: 1 upheld / 2 with non-null complaint_upheld = 50%
    expect(m.upheld_rate).toBe(50);
    // training_delivered: all rows default to true (from makeRow), so 7/7 = 100%
    expect(m.training_rate).toBe(100);
    // by_record_type
    expect(m.by_record_type["Staff Training"]).toBe(1);
    expect(m.by_record_type["Complaint — Discrimination"]).toBe(1);
    expect(m.by_record_type["Incident — Hate Crime"]).toBe(1);
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("generates critical alert for hate crime not actioned", () => {
    const rows = [makeRow({ record_type: "Incident — Hate Crime", status: "Recorded", child_name: "Child A" })];
    const alerts = computeAlerts(rows);
    const hc = alerts.filter((a) => a.type === "hate_crime_not_actioned");
    expect(hc).toHaveLength(1);
    expect(hc[0].severity).toBe("critical");
  });

  it("does not generate hate_crime_not_actioned for 'Action Taken' status", () => {
    const rows = [makeRow({ record_type: "Incident — Hate Crime", status: "Action Taken", child_name: "Child A" })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "hate_crime_not_actioned")).toHaveLength(0);
  });

  it("generates critical alert for hate crime without external agency", () => {
    const rows = [makeRow({ record_type: "Incident — Hate Crime", external_agency_involved: false, child_name: "Child A" })];
    const alerts = computeAlerts(rows);
    const hcExt = alerts.filter((a) => a.type === "hate_crime_no_external_agency");
    expect(hcExt).toHaveLength(1);
    expect(hcExt[0].severity).toBe("critical");
  });

  it("generates high alert for upheld complaint without policy update", () => {
    const rows = [makeRow({ record_type: "Complaint — Discrimination", complaint_upheld: true, policy_updated: false, child_name: "Child A" })];
    const alerts = computeAlerts(rows);
    const upheld = alerts.filter((a) => a.type === "upheld_complaint_no_policy_update");
    expect(upheld).toHaveLength(1);
    expect(upheld[0].severity).toBe("high");
  });

  it("generates medium alert for no young person feedback when > 5 records", () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      makeRow({ id: `r${i}`, record_type: "Staff Training" }),
    );
    const alerts = computeAlerts(rows);
    const noYp = alerts.filter((a) => a.type === "no_yp_feedback");
    expect(noYp).toHaveLength(1);
    expect(noYp[0].severity).toBe("medium");
  });
});

describe("validateEqualityDiversityMonitoring", () => {
  it("validates a correct input", () => {
    const result = validateEqualityDiversityMonitoring({
      recordDate: "2026-05-01",
      recorderName: "Jane Smith",
      recordType: "Staff Training",
      protectedCharacteristic: "Race",
      description: "Training delivered to all staff.",
      status: "Closed",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when required fields are missing", () => {
    const result = validateEqualityDiversityMonitoring({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("fails for hate crime with Not Specific characteristic", () => {
    const result = validateEqualityDiversityMonitoring({
      recordDate: "2026-05-01",
      recorderName: "Jane",
      recordType: "Incident — Hate Crime",
      protectedCharacteristic: "Not Specific",
      childName: "Child A",
      description: "Hate crime incident occurred.",
      status: "Recorded",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("targeted protected characteristic"))).toBe(true);
  });
});

describe("generateCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[sky]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });
});
