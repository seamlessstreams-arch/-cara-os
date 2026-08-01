import { describe, it, expect } from "vitest";
import {
  computeStaffReflectiveMetrics,
  identifyStaffReflectiveAlerts,
} from "./staff-reflective-practice-service";
import type { StaffReflectivePracticeRecord } from "./staff-reflective-practice-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffReflectivePracticeRecord> = {}): StaffReflectivePracticeRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    reflection_type: "individual_reflection",
    reflection_model: "gibbs",
    reflection_outcome: "practice_improved",
    reflection_depth: "deep",
    reflection_date: "2026-04-01",
    staff_name: "Alice Smith",
    facilitator_name: "Manager A",
    child_focused: true,
    values_explored: true,
    emotions_acknowledged: true,
    learning_identified: true,
    action_plan_created: true,
    practice_changed: true,
    shared_with_team: true,
    linked_to_supervision: true,
    linked_to_training: true,
    evidence_documented: true,
    manager_reviewed: true,
    child_impact_considered: true,
    ethical_considerations: true,
    issues_found: [],
    actions_taken: [],
    session_duration_minutes: 45,
    next_reflection_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffReflectiveMetrics --------------------------------------------

describe("computeStaffReflectiveMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeStaffReflectiveMetrics([]);
    expect(m.total_reflections).toBe(0);
    expect(m.practice_improved_count).toBe(0);
    expect(m.further_support_count).toBe(0);
    expect(m.deep_count).toBe(0);
    expect(m.surface_count).toBe(0);
    expect(m.child_focused_rate).toBeNull();;
    expect(m.average_duration).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts outcome and depth categories correctly", () => {
    const records = [
      makeRecord({ id: "1", reflection_outcome: "practice_improved", reflection_depth: "deep" }),
      makeRecord({ id: "2", reflection_outcome: "further_support_needed", reflection_depth: "transformative" }),
      makeRecord({ id: "3", reflection_outcome: "learning_identified", reflection_depth: "surface" }),
      makeRecord({ id: "4", reflection_outcome: "action_planned", reflection_depth: "moderate" }),
    ];
    const m = computeStaffReflectiveMetrics(records);
    expect(m.total_reflections).toBe(4);
    expect(m.practice_improved_count).toBe(1);
    expect(m.further_support_count).toBe(1);
    expect(m.deep_count).toBe(2); // deep + transformative
    expect(m.surface_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", child_focused: true, values_explored: true }),
      makeRecord({ id: "2", child_focused: false, values_explored: false }),
    ];
    const m = computeStaffReflectiveMetrics(records);
    expect(m.child_focused_rate).toBe(50);
    expect(m.values_explored_rate).toBe(50);
  });

  it("calculates average duration correctly", () => {
    const records = [
      makeRecord({ id: "1", session_duration_minutes: 30 }),
      makeRecord({ id: "2", session_duration_minutes: 60 }),
    ];
    const m = computeStaffReflectiveMetrics(records);
    expect(m.average_duration).toBe(45);
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Bob" }),
      makeRecord({ id: "3", staff_name: "Alice" }),
    ];
    const m = computeStaffReflectiveMetrics(records);
    expect(m.unique_staff).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", reflection_type: "individual_reflection", reflection_model: "gibbs" }),
      makeRecord({ id: "2", reflection_type: "group_reflection", reflection_model: "gibbs" }),
      makeRecord({ id: "3", reflection_type: "individual_reflection", reflection_model: "kolb" }),
    ];
    const m = computeStaffReflectiveMetrics(records);
    expect(m.by_reflection_type).toEqual({ individual_reflection: 2, group_reflection: 1 });
    expect(m.by_reflection_model).toEqual({ gibbs: 2, kolb: 1 });
  });

  it("returns 100% rates when all booleans true", () => {
    const records = [makeRecord(), makeRecord({ id: "2" })];
    const m = computeStaffReflectiveMetrics(records);
    expect(m.emotions_acknowledged_rate).toBe(100);
    expect(m.learning_identified_rate).toBe(100);
    expect(m.action_plan_created_rate).toBe(100);
    expect(m.practice_changed_rate).toBe(100);
    expect(m.shared_with_team_rate).toBe(100);
    expect(m.linked_to_supervision_rate).toBe(100);
    expect(m.linked_to_training_rate).toBe(100);
    expect(m.evidence_documented_rate).toBe(100);
    expect(m.manager_reviewed_rate).toBe(100);
    expect(m.child_impact_rate).toBe(100);
  });
});

// -- identifyStaffReflectiveAlerts --------------------------------------------

describe("identifyStaffReflectiveAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifyStaffReflectiveAlerts([])).toEqual([]);
  });

  it("returns no alerts for fully compliant records", () => {
    const alerts = identifyStaffReflectiveAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical for critical incident not linked to supervision", () => {
    const records = [
      makeRecord({ id: "r1", reflection_type: "critical_incident", linked_to_supervision: false, staff_name: "Alice" }),
    ];
    const alerts = identifyStaffReflectiveAlerts(records);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe("critical_incident_no_supervision");
  });

  it("does NOT fire critical for non-critical incident not linked to supervision", () => {
    const records = [
      makeRecord({ id: "r1", reflection_type: "individual_reflection", linked_to_supervision: false }),
    ];
    const alerts = identifyStaffReflectiveAlerts(records);
    expect(alerts.filter((a) => a.type === "critical_incident_no_supervision").length).toBe(0);
  });

  it("fires high for child impact not considered (>= 1)", () => {
    const records = [makeRecord({ id: "r1", child_impact_considered: false })];
    const alerts = identifyStaffReflectiveAlerts(records);
    const match = alerts.filter((a) => a.type === "no_child_impact");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires high for learning not identified only when >= 2", () => {
    const one = [makeRecord({ id: "r1", learning_identified: false })];
    expect(identifyStaffReflectiveAlerts(one).filter((a) => a.type === "no_learning_identified").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", learning_identified: false }),
      makeRecord({ id: "r2", learning_identified: false }),
    ];
    const alerts = identifyStaffReflectiveAlerts(two);
    const match = alerts.filter((a) => a.type === "no_learning_identified");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires medium for evidence not documented only when >= 2", () => {
    const one = [makeRecord({ id: "r1", evidence_documented: false })];
    expect(identifyStaffReflectiveAlerts(one).filter((a) => a.type === "evidence_not_documented").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", evidence_documented: false }),
      makeRecord({ id: "r2", evidence_documented: false }),
    ];
    const alerts = identifyStaffReflectiveAlerts(two);
    const match = alerts.filter((a) => a.type === "evidence_not_documented");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("fires medium for not shared with team only when >= 3", () => {
    const two = [
      makeRecord({ id: "r1", shared_with_team: false }),
      makeRecord({ id: "r2", shared_with_team: false }),
    ];
    expect(identifyStaffReflectiveAlerts(two).filter((a) => a.type === "not_shared_with_team").length).toBe(0);

    const three = [
      makeRecord({ id: "r1", shared_with_team: false }),
      makeRecord({ id: "r2", shared_with_team: false }),
      makeRecord({ id: "r3", shared_with_team: false }),
    ];
    const alerts = identifyStaffReflectiveAlerts(three);
    const match = alerts.filter((a) => a.type === "not_shared_with_team");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });
});
