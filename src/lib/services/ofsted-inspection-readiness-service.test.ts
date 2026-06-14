import { describe, it, expect } from "vitest";
import {
  computeOfstedReadinessMetrics,
  computeOfstedReadinessAlerts,
  generateOfstedReadinessCaraInsights,
  type OfstedInspectionReadinessRow,
} from "./ofsted-inspection-readiness-service";

function makeRow(overrides: Partial<OfstedInspectionReadinessRow> = {}): OfstedInspectionReadinessRow {
  return {
    id: "oir-1",
    home_id: "home-1",
    assessor_name: "Jane Manager",
    assessor_id: "user-1",
    assessment_date: "2026-05-01",
    readiness_area: "safety",
    readiness_rating: "good",
    evidence_status: "evidence_gathered",
    inspection_type: "full_inspection",
    evidence_documented: true,
    staff_prepared: true,
    children_consulted: true,
    environment_ready: true,
    policies_up_to_date: true,
    records_accessible: true,
    improvement_actions_identified: true,
    improvement_actions_completed: true,
    manager_self_evaluation_done: true,
    regulatory_requirements_met: true,
    previous_recommendations_addressed: true,
    mock_inspection_completed: true,
    key_findings: null,
    improvement_plan_notes: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeOfstedReadinessMetrics ──────────────────────────────────────

describe("computeOfstedReadinessMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeOfstedReadinessMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.inadequate_count).toBe(0);
    expect(m.outstanding_count).toBe(0);
    expect(m.evidence_documented_rate).toBe(0);
    expect(m.unique_assessors).toBe(0);
  });

  it("computes counts and rates for populated data", () => {
    const rows = [
      makeRow({ id: "oir-1", readiness_rating: "outstanding", evidence_status: "evidence_gathered", regulatory_requirements_met: true }),
      makeRow({ id: "oir-2", readiness_rating: "inadequate", evidence_status: "evidence_missing", regulatory_requirements_met: false, assessor_name: "RI Person" }),
      makeRow({ id: "oir-3", readiness_rating: "requires_improvement", evidence_status: "evidence_partial", regulatory_requirements_met: true }),
    ];
    const m = computeOfstedReadinessMetrics(rows);
    expect(m.total_assessments).toBe(3);
    expect(m.outstanding_count).toBe(1);
    expect(m.inadequate_count).toBe(1);
    expect(m.requires_improvement_count).toBe(1);
    expect(m.evidence_missing_count).toBe(1);
    expect(m.unique_assessors).toBe(2);
    // regulatory_met_rate = 2/3 = 66.7%
    expect(m.regulatory_met_rate).toBe(66.7);
  });

  it("computes area and rating breakdowns", () => {
    const rows = [
      makeRow({ id: "oir-1", readiness_area: "safety", readiness_rating: "good" }),
      makeRow({ id: "oir-2", readiness_area: "safety", readiness_rating: "outstanding" }),
      makeRow({ id: "oir-3", readiness_area: "health", readiness_rating: "good" }),
    ];
    const m = computeOfstedReadinessMetrics(rows);
    expect(m.area_breakdown["safety"]).toBe(2);
    expect(m.area_breakdown["health"]).toBe(1);
    expect(m.rating_breakdown["good"]).toBe(2);
    expect(m.rating_breakdown["outstanding"]).toBe(1);
  });
});

// ── computeOfstedReadinessAlerts ───────────────────────────────────────

describe("computeOfstedReadinessAlerts", () => {
  it("returns no alerts for a fully compliant row", () => {
    const rows = [makeRow()];
    const alerts = computeOfstedReadinessAlerts(rows);
    // All booleans are true and rating is good, so no alerts should fire
    expect(alerts).toHaveLength(0);
  });

  it("flags inadequate_rating (critical)", () => {
    const rows = [makeRow({ readiness_rating: "inadequate" })];
    const alerts = computeOfstedReadinessAlerts(rows);
    const found = alerts.filter((a) => a.type === "inadequate_rating");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags regulatory_not_met (critical)", () => {
    const rows = [makeRow({ regulatory_requirements_met: false })];
    const alerts = computeOfstedReadinessAlerts(rows);
    const found = alerts.filter((a) => a.type === "regulatory_not_met");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags no_improvement_actions (high) for requires_improvement without actions", () => {
    const rows = [
      makeRow({ readiness_rating: "requires_improvement", improvement_actions_identified: false }),
    ];
    const alerts = computeOfstedReadinessAlerts(rows);
    const found = alerts.filter((a) => a.type === "no_improvement_actions");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags evidence_missing_critical_area (high) for safety with evidence missing", () => {
    const rows = [
      makeRow({ readiness_area: "safety", evidence_status: "evidence_missing" }),
    ];
    const alerts = computeOfstedReadinessAlerts(rows);
    const found = alerts.filter((a) => a.type === "evidence_missing_critical_area");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags evidence_missing_critical_area (high) for leadership_management with evidence missing", () => {
    const rows = [
      makeRow({ readiness_area: "leadership_management", evidence_status: "evidence_missing" }),
    ];
    const alerts = computeOfstedReadinessAlerts(rows);
    const found = alerts.filter((a) => a.type === "evidence_missing_critical_area");
    expect(found.length).toBe(1);
  });

  it("flags mock_inspection_not_completed (medium)", () => {
    const rows = [makeRow({ mock_inspection_completed: false })];
    const alerts = computeOfstedReadinessAlerts(rows);
    const found = alerts.filter((a) => a.type === "mock_inspection_not_completed");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });

  it("flags previous_recommendations_not_addressed (medium)", () => {
    const rows = [makeRow({ previous_recommendations_addressed: false })];
    const alerts = computeOfstedReadinessAlerts(rows);
    const found = alerts.filter((a) => a.type === "previous_recommendations_not_addressed");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });
});

// ── generateOfstedReadinessCaraInsights ─────────────────────────────────

describe("generateOfstedReadinessCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [makeRow()];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights.length).toBe(3);
    expect(insights[0]).toContain("[cyan]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("returns 3 insights for empty data", () => {
    const insights = generateOfstedReadinessCaraInsights([]);
    expect(insights.length).toBe(3);
  });
});
