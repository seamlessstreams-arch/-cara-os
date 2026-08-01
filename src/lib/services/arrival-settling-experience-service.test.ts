import { describe, it, expect } from "vitest";
import { computeArrivalSettlingMetrics, identifyArrivalSettlingAlerts } from "./arrival-settling-experience-service";
import type { ArrivalSettlingExperienceRecord } from "./arrival-settling-experience-service";

function makeRecord(overrides: Partial<ArrivalSettlingExperienceRecord> = {}): ArrivalSettlingExperienceRecord {
  return {
    id: "rec-1", home_id: "home-1", arrival_stage: "first_day_welcome",
    settling_quality: "settled_well", welcome_assessment: "good",
    comfort_level: "comfortable", session_date: "2026-05-15",
    child_name: "Alex", child_id: "child-1", supported_by: "staff-1",
    room_prepared: true, personal_items_respected: true,
    child_preferences_asked: true, tour_provided: true,
    peer_introductions_made: true, key_worker_assigned: true,
    care_plan_reflects: true, social_worker_informed: true,
    parent_informed: true, emergency_contacts_confirmed: true,
    dietary_needs_checked: true, recorded_promptly: true,
    issues_found: [], actions_taken: [], next_review_date: null, notes: null,
    created_at: "2026-05-15T00:00:00Z", updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

describe("computeArrivalSettlingMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeArrivalSettlingMetrics([]);
    expect(result.total_reviews).toBe(0);
    expect(result.distressed_count).toBe(0);
    expect(result.poor_welcome_count).toBe(0);
    expect(result.room_prepared_rate).toBeNull();;
    expect(result.unique_children).toBe(0);
  });

  it("counts distressed, poor welcome, uncomfortable, unsettled", () => {
    const records = [
      makeRecord({ id: "r1", settling_quality: "very_distressed", welcome_assessment: "poor", comfort_level: "very_uncomfortable" }),
      makeRecord({ id: "r2", settling_quality: "unsettled", welcome_assessment: "not_provided", comfort_level: "uncomfortable" }),
      makeRecord({ id: "r3", settling_quality: "settled_well", welcome_assessment: "excellent", comfort_level: "very_comfortable" }),
    ];
    const result = computeArrivalSettlingMetrics(records);
    expect(result.distressed_count).toBe(1);
    expect(result.poor_welcome_count).toBe(2); // poor + not_provided
    expect(result.uncomfortable_count).toBe(2);
    expect(result.unsettled_count).toBe(2); // unsettled + very_distressed
  });

  it("computes boolean rates", () => {
    const records = [
      makeRecord({ id: "r1", room_prepared: true, key_worker_assigned: true }),
      makeRecord({ id: "r2", room_prepared: false, key_worker_assigned: false }),
    ];
    const result = computeArrivalSettlingMetrics(records);
    expect(result.room_prepared_rate).toBe(50);
    expect(result.key_worker_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "r1", child_name: "Alex" }),
      makeRecord({ id: "r2", child_name: "Alex" }),
      makeRecord({ id: "r3", child_name: "Jordan" }),
    ];
    const result = computeArrivalSettlingMetrics(records);
    expect(result.unique_children).toBe(2);
  });

  it("groups by stage, quality, welcome, comfort", () => {
    const records = [
      makeRecord({ id: "r1", arrival_stage: "first_day_welcome", settling_quality: "settled_well" }),
      makeRecord({ id: "r2", arrival_stage: "first_week_review", settling_quality: "adjusting" }),
    ];
    const result = computeArrivalSettlingMetrics(records);
    expect(result.by_arrival_stage["first_day_welcome"]).toBe(1);
    expect(result.by_arrival_stage["first_week_review"]).toBe(1);
    expect(result.by_settling_quality["settled_well"]).toBe(1);
    expect(result.by_settling_quality["adjusting"]).toBe(1);
  });

  it("computes all boolean rates at 100% when all true", () => {
    const records = [makeRecord()];
    const result = computeArrivalSettlingMetrics(records);
    expect(result.room_prepared_rate).toBe(100);
    expect(result.tour_rate).toBe(100);
    expect(result.emergency_contacts_rate).toBe(100);
    expect(result.dietary_needs_rate).toBe(100);
  });
});

describe("identifyArrivalSettlingAlerts", () => {
  it("returns empty array for empty data", () => {
    const result = identifyArrivalSettlingAlerts([]);
    expect(result).toEqual([]);
  });

  it("flags very distressed with poor welcome as critical", () => {
    const records = [
      makeRecord({ id: "r1", settling_quality: "very_distressed", welcome_assessment: "poor" }),
    ];
    const result = identifyArrivalSettlingAlerts(records);
    const alerts = result.filter((a) => a.type === "distressed_poor_welcome");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("flags no room prepared", () => {
    const records = [makeRecord({ id: "r1", room_prepared: false })];
    const result = identifyArrivalSettlingAlerts(records);
    const alerts = result.filter((a) => a.type === "no_room_prepared");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags no key worker", () => {
    const records = [makeRecord({ id: "r1", key_worker_assigned: false })];
    const result = identifyArrivalSettlingAlerts(records);
    const alerts = result.filter((a) => a.type === "no_key_worker");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags no preferences asked (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "r1", child_preferences_asked: false }),
      makeRecord({ id: "r2", child_preferences_asked: false }),
    ];
    const result = identifyArrivalSettlingAlerts(records);
    const alerts = result.filter((a) => a.type === "no_preferences_asked");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("medium");
  });

  it("flags no peer introductions (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "r1", peer_introductions_made: false }),
      makeRecord({ id: "r2", peer_introductions_made: false }),
    ];
    const result = identifyArrivalSettlingAlerts(records);
    const alerts = result.filter((a) => a.type === "no_peer_introductions");
    expect(alerts.length).toBe(1);
  });

  it("returns no alerts when all checks pass", () => {
    const records = [makeRecord()];
    const result = identifyArrivalSettlingAlerts(records);
    expect(result.length).toBe(0);
  });
});
