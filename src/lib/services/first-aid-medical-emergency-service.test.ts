import { describe, it, expect } from "vitest";
import {
  computeFirstAidMetrics,
  identifyFirstAidAlerts,
  type FirstAidMedicalEmergencyRecord,
} from "./first-aid-medical-emergency-service";

function makeRecord(overrides: Partial<FirstAidMedicalEmergencyRecord> = {}): FirstAidMedicalEmergencyRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    incident_type: "minor_injury",
    severity_level: "minor",
    response_quality: "good",
    outcome_assessment: "full_recovery",
    incident_date: "2026-05-21",
    child_name: "Alex",
    child_id: "child-1",
    responded_by: "Staff A",
    first_aid_trained: true,
    correct_procedure_followed: true,
    equipment_available: true,
    ambulance_called: false,
    parent_notified: true,
    gp_informed: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    incident_recorded: true,
    ofsted_notified: false,
    debrief_completed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── computeFirstAidMetrics ──────────────────────────────────────────────

describe("computeFirstAidMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeFirstAidMetrics([]);
    expect(result.total_incidents).toBe(0);
    expect(result.serious_count).toBe(0);
    expect(result.poor_response_count).toBe(0);
    expect(result.hospitalised_count).toBe(0);
    expect(result.untrained_count).toBe(0);
    expect(result.first_aid_trained_rate).toBeNull();;
    expect(result.unique_children).toBe(0);
  });

  it("computes counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "r1", severity_level: "serious", response_quality: "poor", outcome_assessment: "hospitalised", first_aid_trained: false, child_name: "Alex" }),
      makeRecord({ id: "r2", severity_level: "life_threatening", response_quality: "failed", outcome_assessment: "full_recovery", first_aid_trained: true, child_name: "Ben" }),
      makeRecord({ id: "r3", severity_level: "minor", response_quality: "good", outcome_assessment: "full_recovery", first_aid_trained: true, child_name: "Alex" }),
    ];
    const result = computeFirstAidMetrics(records);

    expect(result.total_incidents).toBe(3);
    // serious + life_threatening = 2
    expect(result.serious_count).toBe(2);
    // poor + failed = 2
    expect(result.poor_response_count).toBe(2);
    expect(result.hospitalised_count).toBe(1);
    expect(result.untrained_count).toBe(1);
    // 2/3 trained = 66.7%
    expect(result.first_aid_trained_rate).toBe(66.7);
    expect(result.unique_children).toBe(2);
    expect(result.by_severity_level).toEqual({
      serious: 1,
      life_threatening: 1,
      minor: 1,
    });
  });
});

// ── identifyFirstAidAlerts ──────────────────────────────────────────────

describe("identifyFirstAidAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyFirstAidAlerts([])).toEqual([]);
  });

  it("triggers serious_poor_response critical alert", () => {
    const records = [
      makeRecord({ severity_level: "serious", response_quality: "poor" }),
    ];
    const alerts = identifyFirstAidAlerts(records);
    const critical = alerts.find((a) => a.type === "serious_poor_response");
    expect(critical).toBeDefined();
    expect(critical!.severity).toBe("critical");
  });

  it("triggers serious_poor_response for life_threatening + failed", () => {
    const records = [
      makeRecord({ severity_level: "life_threatening", response_quality: "failed" }),
    ];
    const alerts = identifyFirstAidAlerts(records);
    const critical = alerts.find((a) => a.type === "serious_poor_response");
    expect(critical).toBeDefined();
    expect(critical!.severity).toBe("critical");
  });

  it("triggers untrained_responder high alert when >= 1 untrained", () => {
    const records = [makeRecord({ first_aid_trained: false })];
    const alerts = identifyFirstAidAlerts(records);
    const untrained = alerts.find((a) => a.type === "untrained_responder");
    expect(untrained).toBeDefined();
    expect(untrained!.severity).toBe("high");
  });

  it("triggers incorrect_procedure high alert when >= 1", () => {
    const records = [makeRecord({ correct_procedure_followed: false })];
    const alerts = identifyFirstAidAlerts(records);
    const ip = alerts.find((a) => a.type === "incorrect_procedure");
    expect(ip).toBeDefined();
    expect(ip!.severity).toBe("high");
  });

  it("triggers no_debrief medium alert when >= 2 without debrief", () => {
    const records = [
      makeRecord({ id: "r1", debrief_completed: false }),
      makeRecord({ id: "r2", debrief_completed: false }),
    ];
    const alerts = identifyFirstAidAlerts(records);
    const noDebrief = alerts.find((a) => a.type === "no_debrief");
    expect(noDebrief).toBeDefined();
    expect(noDebrief!.severity).toBe("medium");
  });

  it("triggers no_equipment medium alert when >= 2 without equipment", () => {
    const records = [
      makeRecord({ id: "r1", equipment_available: false }),
      makeRecord({ id: "r2", equipment_available: false }),
    ];
    const alerts = identifyFirstAidAlerts(records);
    const noEquip = alerts.find((a) => a.type === "no_equipment");
    expect(noEquip).toBeDefined();
    expect(noEquip!.severity).toBe("medium");
  });

  it("does NOT trigger no_debrief when only 1 record missing debrief", () => {
    const records = [makeRecord({ debrief_completed: false })];
    const alerts = identifyFirstAidAlerts(records);
    expect(alerts.find((a) => a.type === "no_debrief")).toBeUndefined();
  });
});
