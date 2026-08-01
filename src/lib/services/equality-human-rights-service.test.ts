import { describe, it, expect } from "vitest";
import {
  computeEqualityMetrics,
  identifyEqualityAlerts,
  type EqualityRecord,
} from "./equality-human-rights-service";

function makeRecord(overrides: Partial<EqualityRecord> = {}): EqualityRecord {
  return {
    id: "ehr-1",
    home_id: "home-1",
    assessment_type: "equality_impact_assessment",
    assessment_date: "2026-05-01",
    protected_characteristic: "disability",
    compliance_level: "fully_compliant",
    action_status: "completed",
    assessed_by: "Staff A",
    child_involved: null,
    staff_involved: null,
    description: "Annual EIA completed.",
    findings: null,
    actions_required: ["Review policy"],
    actions_completed: ["Review policy"],
    reasonable_adjustment_made: false,
    human_rights_article: null,
    discrimination_type: null,
    impact_on_child: false,
    review_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeEqualityMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeEqualityMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.eia_count).toBe(0);
    expect(m.human_rights_audit_count).toBe(0);
    expect(m.discrimination_incident_count).toBe(0);
    expect(m.reasonable_adjustment_count).toBe(0);
    expect(m.fully_compliant_rate).toBeNull();;
    expect(m.non_compliant_count).toBe(0);
    expect(m.actions_overdue_count).toBe(0);
    expect(m.actions_completed_rate).toBeNull();;
    expect(m.reasonable_adjustment_rate).toBeNull();;
    expect(m.impact_on_child_count).toBe(0);
    expect(m.review_overdue_count).toBe(0);
  });

  it("computes correct counts for populated data", () => {
    const records: EqualityRecord[] = [
      makeRecord({ id: "r1", assessment_type: "equality_impact_assessment", compliance_level: "fully_compliant" }),
      makeRecord({ id: "r2", assessment_type: "human_rights_audit", compliance_level: "non_compliant", action_status: "overdue", actions_required: ["a", "b"], actions_completed: ["a"] }),
      makeRecord({ id: "r3", assessment_type: "discrimination_incident", compliance_level: "partially_compliant", impact_on_child: true }),
      makeRecord({ id: "r4", assessment_type: "reasonable_adjustment", reasonable_adjustment_made: true, review_date: "2025-01-01" }),
    ];
    const m = computeEqualityMetrics(records);
    expect(m.total_records).toBe(4);
    expect(m.eia_count).toBe(1);
    expect(m.human_rights_audit_count).toBe(1);
    expect(m.discrimination_incident_count).toBe(1);
    expect(m.reasonable_adjustment_count).toBe(1);
    // r1 and r4 are fully_compliant (default); r2 is non_compliant; r3 is partially_compliant => 2/4 = 50%
    expect(m.fully_compliant_rate).toBe(50);
    expect(m.non_compliant_count).toBe(1);
    expect(m.actions_overdue_count).toBe(1);
    // actions_completed_rate: 4 completed / 5 required = 80%
    expect(m.actions_completed_rate).toBe(80);
    expect(m.reasonable_adjustment_rate).toBe(25); // 1/4
    expect(m.impact_on_child_count).toBe(1);
    // review_overdue: r4 review_date 2025-01-01 is in the past
    expect(m.review_overdue_count).toBe(1);
    // breakdowns
    expect(m.by_assessment_type["equality_impact_assessment"]).toBe(1);
    expect(m.by_protected_characteristic["disability"]).toBe(4);
    // r1 and r4 both default to fully_compliant
    expect(m.by_compliance_level["fully_compliant"]).toBe(2);
    expect(m.by_compliance_level["non_compliant"]).toBe(1);
  });
});

describe("identifyEqualityAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyEqualityAlerts([])).toEqual([]);
  });

  it("generates critical alert for discrimination_incident", () => {
    const records = [makeRecord({ assessment_type: "discrimination_incident" })];
    const alerts = identifyEqualityAlerts(records);
    const disc = alerts.filter((a) => a.type === "discrimination_incident");
    expect(disc).toHaveLength(1);
    expect(disc[0].severity).toBe("critical");
  });

  it("generates high alert for non-compliant finding", () => {
    const records = [makeRecord({ compliance_level: "non_compliant" })];
    const alerts = identifyEqualityAlerts(records);
    const nc = alerts.filter((a) => a.type === "non_compliant");
    expect(nc).toHaveLength(1);
    expect(nc[0].severity).toBe("high");
  });

  it("generates high alert when >= 1 action is overdue", () => {
    const records = [makeRecord({ action_status: "overdue" })];
    const alerts = identifyEqualityAlerts(records);
    const overdue = alerts.filter((a) => a.type === "actions_overdue");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("high");
  });

  it("generates medium alert for child impact without adjustment", () => {
    const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "in_progress" })];
    const alerts = identifyEqualityAlerts(records);
    const childImpact = alerts.filter((a) => a.type === "child_impact_no_adjustment");
    expect(childImpact).toHaveLength(1);
    expect(childImpact[0].severity).toBe("medium");
  });

  it("does not generate child_impact_no_adjustment if action completed", () => {
    const records = [makeRecord({ impact_on_child: true, reasonable_adjustment_made: false, action_status: "completed" })];
    const alerts = identifyEqualityAlerts(records);
    expect(alerts.filter((a) => a.type === "child_impact_no_adjustment")).toHaveLength(0);
  });

  it("generates medium alert for overdue reviews", () => {
    const records = [makeRecord({ review_date: "2025-01-01" })];
    const alerts = identifyEqualityAlerts(records);
    const reviewOverdue = alerts.filter((a) => a.type === "review_overdue");
    expect(reviewOverdue).toHaveLength(1);
    expect(reviewOverdue[0].severity).toBe("medium");
  });
});
