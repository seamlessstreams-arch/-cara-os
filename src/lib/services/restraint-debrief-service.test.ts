import { describe, it, expect } from "vitest";
import {
  computeRestraintDebriefMetrics,
  identifyRestraintDebriefAlerts,
} from "./restraint-debrief-service";
import type { RestraintDebriefRecord } from "./restraint-debrief-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<RestraintDebriefRecord> = {}): RestraintDebriefRecord {
  return {
    id: "rd-1",
    home_id: "home-1",
    debrief_type: "child_debrief",
    restraint_type: "planned_intervention",
    debrief_outcome: "no_concerns",
    child_emotional_state: "calm",
    debrief_date: "2026-05-10",
    child_name: "Alex",
    child_id: null,
    staff_involved: "Staff A",
    child_debrief_completed: true,
    staff_debrief_completed: true,
    medical_check_done: true,
    body_map_completed: true,
    ofsted_notified: true,
    social_worker_notified: true,
    parent_notified: true,
    witness_statements_taken: true,
    cctv_reviewed: false,
    proportionate_response: true,
    learning_documented: true,
    plan_updated: true,
    issues_found: [],
    actions_taken: [],
    debriefed_by: "Manager A",
    restraint_duration_minutes: 5,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeRestraintDebriefMetrics -------------------------------------------

describe("computeRestraintDebriefMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeRestraintDebriefMetrics([]);
    expect(m.total_debriefs).toBe(0);
    expect(m.no_concerns_count).toBe(0);
    expect(m.learning_identified_count).toBe(0);
    expect(m.investigation_count).toBe(0);
    expect(m.distressed_count).toBe(0);
    expect(m.child_debrief_rate).toBeNull();;
    expect(m.average_restraint_duration).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts outcome types correctly", () => {
    const records = [
      makeRecord({ id: "1", debrief_outcome: "no_concerns" }),
      makeRecord({ id: "2", debrief_outcome: "learning_identified" }),
      makeRecord({ id: "3", debrief_outcome: "investigation_required" }),
    ];
    const m = computeRestraintDebriefMetrics(records);
    expect(m.no_concerns_count).toBe(1);
    expect(m.learning_identified_count).toBe(1);
    expect(m.investigation_count).toBe(1);
  });

  it("counts distressed children", () => {
    const records = [
      makeRecord({ id: "1", child_emotional_state: "distressed" }),
      makeRecord({ id: "2", child_emotional_state: "calm" }),
    ];
    const m = computeRestraintDebriefMetrics(records);
    expect(m.distressed_count).toBe(1);
  });

  it("computes boolean rates as percentage to 1dp", () => {
    const records = [
      makeRecord({ id: "1", child_debrief_completed: true }),
      makeRecord({ id: "2", child_debrief_completed: true }),
      makeRecord({ id: "3", child_debrief_completed: false }),
    ];
    const m = computeRestraintDebriefMetrics(records);
    expect(m.child_debrief_rate).toBe(66.7);
  });

  it("computes average restraint duration", () => {
    const records = [
      makeRecord({ id: "1", restraint_duration_minutes: 4 }),
      makeRecord({ id: "2", restraint_duration_minutes: 6 }),
    ];
    const m = computeRestraintDebriefMetrics(records);
    expect(m.average_restraint_duration).toBe(5);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Beth" }),
      makeRecord({ id: "3", child_name: "Alex" }),
    ];
    const m = computeRestraintDebriefMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdown maps", () => {
    const records = [makeRecord({ debrief_type: "management_review", restraint_type: "ground_hold" })];
    const m = computeRestraintDebriefMetrics(records);
    expect(m.by_debrief_type["management_review"]).toBe(1);
    expect(m.by_restraint_type["ground_hold"]).toBe(1);
    expect(m.by_debrief_outcome["no_concerns"]).toBe(1);
    expect(m.by_emotional_state["calm"]).toBe(1);
  });
});

// -- identifyRestraintDebriefAlerts -------------------------------------------

describe("identifyRestraintDebriefAlerts", () => {
  it("returns empty for empty array", () => {
    expect(identifyRestraintDebriefAlerts([])).toEqual([]);
  });

  it("fires critical alert for disproportionate response", () => {
    const records = [makeRecord({ proportionate_response: false })];
    const alerts = identifyRestraintDebriefAlerts(records);
    const hit = alerts.find((a) => a.type === "disproportionate_response");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires high alert when child debrief not completed (>= 1)", () => {
    const records = [makeRecord({ child_debrief_completed: false })];
    const alerts = identifyRestraintDebriefAlerts(records);
    const hit = alerts.find((a) => a.type === "no_child_debrief");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires high alert when medical check not done (>= 1)", () => {
    const records = [makeRecord({ medical_check_done: false })];
    const alerts = identifyRestraintDebriefAlerts(records);
    const hit = alerts.find((a) => a.type === "no_medical_check");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires medium alert for Ofsted not notified (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", ofsted_notified: false }),
      makeRecord({ id: "2", ofsted_notified: false }),
    ];
    const alerts = identifyRestraintDebriefAlerts(records);
    const hit = alerts.find((a) => a.type === "ofsted_not_notified");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("does NOT fire ofsted alert for only 1 not-notified", () => {
    const records = [makeRecord({ ofsted_notified: false })];
    const alerts = identifyRestraintDebriefAlerts(records);
    expect(alerts.find((a) => a.type === "ofsted_not_notified")).toBeUndefined();
  });

  it("fires medium alert for learning not documented (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", learning_documented: false }),
      makeRecord({ id: "2", learning_documented: false }),
    ];
    const alerts = identifyRestraintDebriefAlerts(records);
    const hit = alerts.find((a) => a.type === "learning_not_documented");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });
});
