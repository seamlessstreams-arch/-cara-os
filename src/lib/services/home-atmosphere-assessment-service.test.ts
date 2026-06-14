import { describe, it, expect } from "vitest";
import {
  computeHomeAtmosphereMetrics,
  computeHomeAtmosphereAlerts,
  generateHomeAtmosphereCaraInsights,
  type HomeAtmosphereAssessmentRow,
} from "./home-atmosphere-assessment-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<HomeAtmosphereAssessmentRow> = {}): HomeAtmosphereAssessmentRow {
  return {
    id: "row-1",
    home_id: "home-1",
    assessment_date: "2026-05-01",
    atmosphere_dimension: "warmth_welcome",
    atmosphere_rating: "good",
    assessment_method: "manager_walkthrough",
    action_required: "none",
    assessor_name: "Assessor A",
    child_views_included: true,
    staff_views_included: true,
    visitor_views_included: true,
    improvement_actions_identified: false,
    actions_implemented: false,
    shared_with_children: true,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeHomeAtmosphereMetrics ─────────────────────────────────────────

describe("computeHomeAtmosphereMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeHomeAtmosphereMetrics([]);
    expect(result.total_assessments).toBe(0);
    expect(result.inadequate_count).toBe(0);
    expect(result.requires_improvement_count).toBe(0);
    expect(result.urgent_action_count).toBe(0);
    expect(result.actions_not_implemented_count).toBe(0);
    expect(result.child_views_rate).toBe(0);
    expect(result.unique_assessors).toBe(0);
  });

  it("computes correct counts with populated data", () => {
    const rows = [
      makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action", improvement_actions_identified: true, actions_implemented: false }),
      makeRow({ id: "row-2", atmosphere_rating: "requires_improvement", improvement_actions_identified: true, actions_implemented: false, child_views_included: false }),
      makeRow({ id: "row-3", assessor_name: "Assessor B", atmosphere_rating: "good" }),
    ];
    const result = computeHomeAtmosphereMetrics(rows);
    expect(result.total_assessments).toBe(3);
    expect(result.inadequate_count).toBe(1);
    expect(result.requires_improvement_count).toBe(1);
    expect(result.urgent_action_count).toBe(1);
    // actions_not_implemented: where identified AND not implemented = 2
    expect(result.actions_not_implemented_count).toBe(2);
    expect(result.unique_assessors).toBe(2);
    // child_views_rate: 2/3 = 66.7%
    expect(result.child_views_rate).toBe(66.7);
  });

  it("builds dimension and rating breakdowns", () => {
    const rows = [
      makeRow({ atmosphere_dimension: "warmth_welcome", atmosphere_rating: "good" }),
      makeRow({ id: "row-2", atmosphere_dimension: "warmth_welcome", atmosphere_rating: "excellent" }),
      makeRow({ id: "row-3", atmosphere_dimension: "safety_feeling", atmosphere_rating: "good" }),
    ];
    const result = computeHomeAtmosphereMetrics(rows);
    expect(result.dimension_breakdown.warmth_welcome).toBe(2);
    expect(result.dimension_breakdown.safety_feeling).toBe(1);
    expect(result.rating_breakdown.good).toBe(2);
    expect(result.rating_breakdown.excellent).toBe(1);
  });
});

// ── computeHomeAtmosphereAlerts ──────────────────────────────────────────

describe("computeHomeAtmosphereAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeHomeAtmosphereAlerts([])).toHaveLength(0);
  });

  it("raises critical alert for inadequate + urgent_action", () => {
    const rows = [makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action" })];
    const alerts = computeHomeAtmosphereAlerts(rows);
    const match = alerts.filter((a) => a.type === "inadequate_urgent");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises high alert for requires_improvement + actions not implemented", () => {
    const rows = [makeRow({ atmosphere_rating: "requires_improvement", improvement_actions_identified: true, actions_implemented: false })];
    const alerts = computeHomeAtmosphereAlerts(rows);
    const match = alerts.filter((a) => a.type === "improvement_actions_outstanding");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises high alert for child views missing (>= 2)", () => {
    const rows = [
      makeRow({ child_views_included: false }),
      makeRow({ id: "row-2", child_views_included: false }),
    ];
    const alerts = computeHomeAtmosphereAlerts(rows);
    const match = alerts.filter((a) => a.type === "child_views_missing");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("does NOT raise child_views_missing with only 1 missing", () => {
    const rows = [makeRow({ child_views_included: false })];
    const alerts = computeHomeAtmosphereAlerts(rows);
    expect(alerts.filter((a) => a.type === "child_views_missing")).toHaveLength(0);
  });

  it("raises medium alert for actions not implemented (>= 2)", () => {
    const rows = [
      makeRow({ improvement_actions_identified: true, actions_implemented: false }),
      makeRow({ id: "row-2", improvement_actions_identified: true, actions_implemented: false }),
    ];
    const alerts = computeHomeAtmosphereAlerts(rows);
    const match = alerts.filter((a) => a.type === "actions_not_implemented");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });
});

// ── generateHomeAtmosphereCaraInsights ───────────────────────────────────

describe("generateHomeAtmosphereCaraInsights", () => {
  it("returns 3 insights", () => {
    const metrics = computeHomeAtmosphereMetrics([makeRow()]);
    const alerts = computeHomeAtmosphereAlerts([makeRow()]);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });
});
