import { describe, it, expect } from "vitest";
import {
  computeRoomSharingMetrics,
  identifyRoomSharingAlerts,
} from "./room-sharing-assessment-service";
import type { RoomSharingAssessmentRecord } from "./room-sharing-assessment-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<RoomSharingAssessmentRecord> = {}): RoomSharingAssessmentRecord {
  return {
    id: "rs-1",
    home_id: "home-1",
    sharing_arrangement: "single_room",
    compatibility_rating: "compatible",
    room_risk_level: "low",
    review_frequency: "monthly",
    assessment_date: "2026-05-10",
    child_name: "Alex",
    child_id: null,
    assessed_by: "Staff A",
    child_consent_obtained: true,
    child_views_sought: true,
    safeguarding_check_done: true,
    risk_assessment_current: true,
    age_appropriate: true,
    gender_appropriate: true,
    behaviour_history_considered: true,
    social_worker_consulted: true,
    parent_informed: true,
    care_plan_reflects: true,
    privacy_maintained: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeRoomSharingMetrics ------------------------------------------------

describe("computeRoomSharingMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeRoomSharingMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.incompatible_count).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.unacceptable_risk_count).toBe(0);
    expect(m.emergency_sharing_count).toBe(0);
    expect(m.child_consent_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts specific categories", () => {
    const records = [
      makeRecord({ id: "1", compatibility_rating: "incompatible" }),
      makeRecord({ id: "2", room_risk_level: "high" }),
      makeRecord({ id: "3", room_risk_level: "unacceptable" }),
      makeRecord({ id: "4", sharing_arrangement: "emergency_sharing" }),
    ];
    const m = computeRoomSharingMetrics(records);
    expect(m.incompatible_count).toBe(1);
    expect(m.high_risk_count).toBe(1);
    expect(m.unacceptable_risk_count).toBe(1);
    expect(m.emergency_sharing_count).toBe(1);
  });

  it("computes boolean rates as percentages to 1dp", () => {
    const records = [
      makeRecord({ id: "1", child_consent_obtained: true }),
      makeRecord({ id: "2", child_consent_obtained: true }),
      makeRecord({ id: "3", child_consent_obtained: false }),
    ];
    const m = computeRoomSharingMetrics(records);
    expect(m.child_consent_rate).toBe(66.7);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Beth" }),
      makeRecord({ id: "3", child_name: "Alex" }),
    ];
    const m = computeRoomSharingMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdown maps", () => {
    const records = [
      makeRecord({ sharing_arrangement: "shared_by_choice", compatibility_rating: "highly_compatible", room_risk_level: "no_risk", review_frequency: "weekly" }),
    ];
    const m = computeRoomSharingMetrics(records);
    expect(m.by_sharing_arrangement["shared_by_choice"]).toBe(1);
    expect(m.by_compatibility_rating["highly_compatible"]).toBe(1);
    expect(m.by_room_risk_level["no_risk"]).toBe(1);
    expect(m.by_review_frequency["weekly"]).toBe(1);
  });
});

// -- identifyRoomSharingAlerts ------------------------------------------------

describe("identifyRoomSharingAlerts", () => {
  it("returns empty for empty array", () => {
    expect(identifyRoomSharingAlerts([])).toEqual([]);
  });

  it("fires critical alert for unacceptable risk without safeguarding check", () => {
    const records = [makeRecord({ room_risk_level: "unacceptable", safeguarding_check_done: false })];
    const alerts = identifyRoomSharingAlerts(records);
    const hit = alerts.find((a) => a.type === "unacceptable_no_safeguarding");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("does NOT fire critical alert for unacceptable with safeguarding check done", () => {
    const records = [makeRecord({ room_risk_level: "unacceptable", safeguarding_check_done: true })];
    const alerts = identifyRoomSharingAlerts(records);
    expect(alerts.find((a) => a.type === "unacceptable_no_safeguarding")).toBeUndefined();
  });

  it("fires high alert for no child consent in non-single room (>= 1)", () => {
    const records = [makeRecord({ child_consent_obtained: false, sharing_arrangement: "shared_by_choice" })];
    const alerts = identifyRoomSharingAlerts(records);
    const hit = alerts.find((a) => a.type === "no_child_consent");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("does NOT fire no_child_consent for single_room without consent", () => {
    const records = [makeRecord({ child_consent_obtained: false, sharing_arrangement: "single_room" })];
    const alerts = identifyRoomSharingAlerts(records);
    expect(alerts.find((a) => a.type === "no_child_consent")).toBeUndefined();
  });

  it("fires high alert for risk assessment not current (>= 1)", () => {
    const records = [makeRecord({ risk_assessment_current: false })];
    const alerts = identifyRoomSharingAlerts(records);
    const hit = alerts.find((a) => a.type === "risk_assessment_outdated");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires medium alert for privacy not maintained (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", privacy_maintained: false }),
      makeRecord({ id: "2", privacy_maintained: false }),
    ];
    const alerts = identifyRoomSharingAlerts(records);
    const hit = alerts.find((a) => a.type === "privacy_not_maintained");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("does NOT fire privacy alert for only 1 record", () => {
    const records = [makeRecord({ privacy_maintained: false })];
    const alerts = identifyRoomSharingAlerts(records);
    expect(alerts.find((a) => a.type === "privacy_not_maintained")).toBeUndefined();
  });

  it("fires medium alert for behaviour history not considered (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", behaviour_history_considered: false }),
      makeRecord({ id: "2", behaviour_history_considered: false }),
    ];
    const alerts = identifyRoomSharingAlerts(records);
    const hit = alerts.find((a) => a.type === "behaviour_not_considered");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });
});
