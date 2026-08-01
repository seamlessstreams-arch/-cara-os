import { describe, it, expect } from "vitest";
import {
  computeLeisureRecreationMetrics,
  identifyLeisureRecreationAlerts,
  type LeisureRecreationActivitiesRecord,
} from "./leisure-recreation-activities-service";

function makeRecord(
  overrides: Partial<LeisureRecreationActivitiesRecord> = {},
): LeisureRecreationActivitiesRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    activity_type: "sport",
    participation_level: "enthusiastic",
    enjoyment_rating: "loved_it",
    skill_development: "good_growth",
    activity_date: "2026-05-20",
    child_name: "Child A",
    child_id: "child-1",
    facilitated_by: "Staff A",
    child_chose_activity: true,
    age_appropriate: true,
    inclusive_access: true,
    peer_interaction: true,
    community_based: true,
    new_experience: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    risk_assessed: true,
    transport_arranged: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

describe("computeLeisureRecreationMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeLeisureRecreationMetrics([]);
    expect(m.total_activities).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.disliked_count).toBe(0);
    expect(m.decline_count).toBe(0);
    expect(m.no_choice_count).toBe(0);
    expect(m.child_chose_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Child A", participation_level: "refused", skill_development: "decline", child_chose_activity: false, community_based: false, risk_assessed: false }),
      makeRecord({ id: "2", child_name: "Child B", enjoyment_rating: "disliked", inclusive_access: false }),
      makeRecord({ id: "3", child_name: "Child A", enjoyment_rating: "hated" }),
      makeRecord({ id: "4", child_name: "Child C", activity_type: "music" }),
    ];
    const m = computeLeisureRecreationMetrics(records);
    expect(m.total_activities).toBe(4);
    expect(m.refused_count).toBe(1);
    expect(m.disliked_count).toBe(2); // disliked + hated
    expect(m.decline_count).toBe(1);
    expect(m.no_choice_count).toBe(1);
    expect(m.unique_children).toBe(3);
    expect(m.child_chose_rate).toBe(75);
    expect(m.inclusive_access_rate).toBe(75);
    expect(m.by_activity_type["sport"]).toBe(3);
    expect(m.by_activity_type["music"]).toBe(1);
    expect(m.by_participation_level["refused"]).toBe(1);
    expect(m.by_enjoyment_rating["disliked"]).toBe(1);
    expect(m.by_enjoyment_rating["hated"]).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", age_appropriate: true, peer_interaction: false }),
      makeRecord({ id: "2", age_appropriate: false, peer_interaction: false }),
    ];
    const m = computeLeisureRecreationMetrics(records);
    expect(m.age_appropriate_rate).toBe(50);
    expect(m.peer_interaction_rate).toBe(0);
  });
});

describe("identifyLeisureRecreationAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyLeisureRecreationAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("triggers refused_declining (critical) when participation=refused AND skill_development=decline", () => {
    const records = [
      makeRecord({ id: "r1", participation_level: "refused", skill_development: "decline", child_name: "Alex" }),
    ];
    const alerts = identifyLeisureRecreationAlerts(records);
    const a = alerts.find((x) => x.type === "refused_declining");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
    expect(a!.id).toBe("r1");
  });

  it("triggers no_child_choice (high) when >= 1 activity has child_chose_activity=false", () => {
    const records = [
      makeRecord({ id: "1", child_chose_activity: false }),
    ];
    const alerts = identifyLeisureRecreationAlerts(records);
    const a = alerts.find((x) => x.type === "no_child_choice");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers not_inclusive (high) when >= 1 activity has inclusive_access=false", () => {
    const records = [
      makeRecord({ id: "1", inclusive_access: false }),
    ];
    const alerts = identifyLeisureRecreationAlerts(records);
    const a = alerts.find((x) => x.type === "not_inclusive");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers not_risk_assessed (medium) when >= 2 activities have risk_assessed=false", () => {
    const records = [
      makeRecord({ id: "1", risk_assessed: false }),
      makeRecord({ id: "2", risk_assessed: false }),
    ];
    const alerts = identifyLeisureRecreationAlerts(records);
    const a = alerts.find((x) => x.type === "not_risk_assessed");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("does NOT trigger not_risk_assessed when only 1 activity is not risk assessed", () => {
    const records = [
      makeRecord({ id: "1", risk_assessed: false }),
      makeRecord({ id: "2", risk_assessed: true }),
    ];
    const alerts = identifyLeisureRecreationAlerts(records);
    expect(alerts.find((x) => x.type === "not_risk_assessed")).toBeUndefined();
  });

  it("triggers no_community_activities (medium) when >= 2 are not community_based", () => {
    const records = [
      makeRecord({ id: "1", community_based: false }),
      makeRecord({ id: "2", community_based: false }),
    ];
    const alerts = identifyLeisureRecreationAlerts(records);
    const a = alerts.find((x) => x.type === "no_community_activities");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("does NOT trigger no_community_activities when only 1 is not community_based", () => {
    const records = [
      makeRecord({ id: "1", community_based: false }),
      makeRecord({ id: "2", community_based: true }),
    ];
    const alerts = identifyLeisureRecreationAlerts(records);
    expect(alerts.find((x) => x.type === "no_community_activities")).toBeUndefined();
  });
});
