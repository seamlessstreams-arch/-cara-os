import { describe, it, expect } from "vitest";
import {
  computeBoundaryManagementMetrics,
  identifyBoundaryManagementAlerts,
  type BoundaryManagementRecord,
} from "./boundary-management-service";

function makeRecord(overrides: Partial<BoundaryManagementRecord> = {}): BoundaryManagementRecord {
  return {
    id: "bm-1",
    home_id: "home-1",
    boundary_type: "bedtime_routine",
    child_response: "accepted",
    staff_approach: "calm_explanation",
    consistency_rating: "fully_consistent",
    incident_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    staff_name: "Staff A",
    boundary_explained: true,
    age_appropriate: true,
    child_voice_heard: true,
    trauma_informed: true,
    care_plan_consistent: true,
    relationship_maintained: true,
    de_escalation_used: false,
    restorative_offered: true,
    learning_identified: true,
    parent_informed: true,
    social_worker_informed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    recorded_by: "Staff A",
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeBoundaryManagementMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeBoundaryManagementMetrics([]);
    expect(m.total_incidents).toBe(0);
    expect(m.accepted_count).toBe(0);
    expect(m.boundary_explained_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts response types and inconsistency", () => {
    const records = [
      makeRecord({ id: "1", child_response: "accepted" }),
      makeRecord({ id: "2", child_response: "escalated" }),
      makeRecord({ id: "3", child_response: "refused" }),
      makeRecord({ id: "4", child_response: "accepted", consistency_rating: "inconsistent" }),
      makeRecord({ id: "5", child_response: "tested", consistency_rating: "contradictory" }),
    ];
    const m = computeBoundaryManagementMetrics(records);
    expect(m.total_incidents).toBe(5);
    expect(m.accepted_count).toBe(2);
    expect(m.escalated_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.inconsistent_count).toBe(2);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", boundary_explained: true, trauma_informed: true, child_voice_heard: true }),
      makeRecord({ id: "2", boundary_explained: false, trauma_informed: false, child_voice_heard: false }),
    ];
    const m = computeBoundaryManagementMetrics(records);
    expect(m.boundary_explained_rate).toBe(50);
    expect(m.trauma_informed_rate).toBe(50);
    expect(m.child_voice_rate).toBe(50);
  });

  it("builds breakdowns by type, response, approach, consistency", () => {
    const records = [
      makeRecord({ id: "1", boundary_type: "screen_time", staff_approach: "positive_reinforcement" }),
      makeRecord({ id: "2", boundary_type: "screen_time", staff_approach: "calm_explanation" }),
    ];
    const m = computeBoundaryManagementMetrics(records);
    expect(m.by_boundary_type).toEqual({ screen_time: 2 });
    expect(m.by_staff_approach).toEqual({ positive_reinforcement: 1, calm_explanation: 1 });
  });
});

describe("identifyBoundaryManagementAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyBoundaryManagementAlerts([])).toEqual([]);
  });

  it("fires critical alert when child escalated without de-escalation", () => {
    const records = [makeRecord({ id: "b1", child_response: "escalated", de_escalation_used: false })];
    const alerts = identifyBoundaryManagementAlerts(records);
    const a = alerts.find((a) => a.type === "escalated_no_deescalation");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("fires not_trauma_informed alert when >= 1 interaction not trauma-informed", () => {
    const records = [makeRecord({ trauma_informed: false })];
    const alerts = identifyBoundaryManagementAlerts(records);
    expect(alerts.find((a) => a.type === "not_trauma_informed")).toBeDefined();
    expect(alerts.find((a) => a.type === "not_trauma_informed")!.severity).toBe("high");
  });

  it("fires child_voice_not_heard alert when >= 1 interaction", () => {
    const records = [makeRecord({ child_voice_heard: false })];
    const alerts = identifyBoundaryManagementAlerts(records);
    expect(alerts.find((a) => a.type === "child_voice_not_heard")).toBeDefined();
  });

  it("fires inconsistent_boundaries alert when >= 2 inconsistent/contradictory", () => {
    const records = [
      makeRecord({ id: "1", consistency_rating: "inconsistent" }),
      makeRecord({ id: "2", consistency_rating: "contradictory" }),
    ];
    const alerts = identifyBoundaryManagementAlerts(records);
    expect(alerts.find((a) => a.type === "inconsistent_boundaries")).toBeDefined();
  });

  it("does NOT fire inconsistent_boundaries for only 1 inconsistent", () => {
    const records = [makeRecord({ consistency_rating: "inconsistent" })];
    const alerts = identifyBoundaryManagementAlerts(records);
    expect(alerts.find((a) => a.type === "inconsistent_boundaries")).toBeUndefined();
  });

  it("fires no_restorative alert when >= 3 without restorative approach", () => {
    const records = [
      makeRecord({ id: "1", restorative_offered: false }),
      makeRecord({ id: "2", restorative_offered: false }),
      makeRecord({ id: "3", restorative_offered: false }),
    ];
    const alerts = identifyBoundaryManagementAlerts(records);
    expect(alerts.find((a) => a.type === "no_restorative")).toBeDefined();
  });

  it("does NOT fire no_restorative for only 2 without restorative", () => {
    const records = [
      makeRecord({ id: "1", restorative_offered: false }),
      makeRecord({ id: "2", restorative_offered: false }),
    ];
    const alerts = identifyBoundaryManagementAlerts(records);
    expect(alerts.find((a) => a.type === "no_restorative")).toBeUndefined();
  });
});
