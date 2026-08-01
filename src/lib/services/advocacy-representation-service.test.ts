import { describe, it, expect } from "vitest";
import { computeAdvocacyRepresentationMetrics, identifyAdvocacyRepresentationAlerts } from "./advocacy-representation-service";
import type { AdvocacyRepresentationRecord } from "./advocacy-representation-service";

function makeRecord(overrides: Partial<AdvocacyRepresentationRecord> = {}): AdvocacyRepresentationRecord {
  return {
    id: "rec-1", home_id: "home-1", advocacy_type: "independent_advocate",
    representation_quality: "good", child_satisfaction: "satisfied",
    outcome_effectiveness: "mostly_effective", session_date: "2026-05-15",
    child_name: "Alex", child_id: "child-1", facilitated_by: "staff-1",
    child_voice_heard: true, child_understood_rights: true, independent_access: true,
    confidentiality_maintained: true, outcome_communicated: true, follow_up_arranged: true,
    care_plan_reflects: true, social_worker_informed: true, parent_informed: true,
    irm_notified: true, decision_influenced: true, recorded_promptly: true,
    issues_found: [], actions_taken: [], next_review_date: null, notes: null,
    created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeAdvocacyRepresentationMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeAdvocacyRepresentationMetrics([]);
    expect(result.total_sessions).toBe(0);
    expect(result.poor_quality_count).toBe(0);
    expect(result.child_voice_rate).toBeNull();;
    expect(result.unique_children).toBe(0);
  });

  it("counts sessions and computes boolean rates", () => {
    const records = [
      makeRecord({ id: "r1", child_voice_heard: true, independent_access: true }),
      makeRecord({ id: "r2", child_voice_heard: false, independent_access: false }),
    ];
    const result = computeAdvocacyRepresentationMetrics(records);
    expect(result.total_sessions).toBe(2);
    expect(result.child_voice_rate).toBe(50);
    expect(result.independent_access_rate).toBe(50);
  });

  it("counts poor quality and dissatisfied", () => {
    const records = [
      makeRecord({ id: "r1", representation_quality: "poor", child_satisfaction: "dissatisfied" }),
      makeRecord({ id: "r2", representation_quality: "not_provided", child_satisfaction: "very_dissatisfied" }),
      makeRecord({ id: "r3", representation_quality: "excellent", child_satisfaction: "very_satisfied" }),
    ];
    const result = computeAdvocacyRepresentationMetrics(records);
    expect(result.poor_quality_count).toBe(2);
    expect(result.dissatisfied_count).toBe(2);
  });

  it("counts ineffective and counterproductive outcomes", () => {
    const records = [
      makeRecord({ id: "r1", outcome_effectiveness: "ineffective" }),
      makeRecord({ id: "r2", outcome_effectiveness: "counterproductive" }),
      makeRecord({ id: "r3", outcome_effectiveness: "fully_effective" }),
    ];
    const result = computeAdvocacyRepresentationMetrics(records);
    expect(result.ineffective_count).toBe(1);
    expect(result.counterproductive_count).toBe(1);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "r1", child_name: "Alex" }),
      makeRecord({ id: "r2", child_name: "Alex" }),
      makeRecord({ id: "r3", child_name: "Jordan" }),
    ];
    const result = computeAdvocacyRepresentationMetrics(records);
    expect(result.unique_children).toBe(2);
  });

  it("groups by advocacy type, quality, satisfaction, effectiveness", () => {
    const records = [
      makeRecord({ id: "r1", advocacy_type: "independent_advocate", representation_quality: "excellent" }),
      makeRecord({ id: "r2", advocacy_type: "peer_advocacy", representation_quality: "good" }),
    ];
    const result = computeAdvocacyRepresentationMetrics(records);
    expect(result.by_advocacy_type["independent_advocate"]).toBe(1);
    expect(result.by_advocacy_type["peer_advocacy"]).toBe(1);
    expect(result.by_representation_quality["excellent"]).toBe(1);
  });

  it("computes all boolean rates at 100% when all true", () => {
    const records = [makeRecord()];
    const result = computeAdvocacyRepresentationMetrics(records);
    expect(result.child_voice_rate).toBe(100);
    expect(result.rights_understood_rate).toBe(100);
    expect(result.confidentiality_rate).toBe(100);
    expect(result.recorded_promptly_rate).toBe(100);
  });
});

describe("identifyAdvocacyRepresentationAlerts", () => {
  it("returns empty array for empty data", () => {
    const result = identifyAdvocacyRepresentationAlerts([]);
    expect(result).toEqual([]);
  });

  it("flags dissatisfied + counterproductive as critical", () => {
    const records = [
      makeRecord({ id: "r1", child_satisfaction: "dissatisfied", outcome_effectiveness: "counterproductive" }),
    ];
    const result = identifyAdvocacyRepresentationAlerts(records);
    const criticals = result.filter((a) => a.type === "dissatisfied_counterproductive");
    expect(criticals.length).toBe(1);
    expect(criticals[0].severity).toBe("critical");
  });

  it("flags no independent access", () => {
    const records = [makeRecord({ id: "r1", independent_access: false })];
    const result = identifyAdvocacyRepresentationAlerts(records);
    const alerts = result.filter((a) => a.type === "no_independent_access");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags child voice not heard", () => {
    const records = [makeRecord({ id: "r1", child_voice_heard: false })];
    const result = identifyAdvocacyRepresentationAlerts(records);
    const alerts = result.filter((a) => a.type === "child_voice_not_heard");
    expect(alerts.length).toBe(1);
  });

  it("flags confidentiality breach (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "r1", confidentiality_maintained: false }),
      makeRecord({ id: "r2", confidentiality_maintained: false }),
    ];
    const result = identifyAdvocacyRepresentationAlerts(records);
    const alerts = result.filter((a) => a.type === "confidentiality_breach");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("medium");
  });

  it("returns fewer alerts when all checks pass", () => {
    const goodAlerts = identifyAdvocacyRepresentationAlerts([makeRecord()]);
    const badAlerts = identifyAdvocacyRepresentationAlerts([
      makeRecord({
        independent_access: false, child_voice_heard: false,
        child_satisfaction: "dissatisfied", outcome_effectiveness: "counterproductive",
      }),
    ]);
    expect(badAlerts.length).toBeGreaterThan(goodAlerts.length);
  });
});
