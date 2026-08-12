import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";
import {
  computeSanctionRewardMetrics,
  identifyBehaviourManagementAlerts,
} from "./sanctions-rewards-service";
import type {
  SanctionRecord,
  RewardRecord,
} from "./sanctions-rewards-service";

// -- Factory Functions --------------------------------------------------------

function makeSanction(overrides: Partial<SanctionRecord> = {}): SanctionRecord {
  return {
    id: "s-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    sanction_type: "verbal_reminder",
    reason: "Disruptive behaviour",
    description: "Verbal reminder given",
    incident_date: todayStr(),
    incident_time: "14:00",
    duration_minutes: 5,
    privilege_removed: null,
    proportionate: true,
    age_appropriate: true,
    consistent_with_plan: true,
    child_informed: true,
    child_response: "Acknowledged",
    imposed_by: "staff-1",
    witnessed_by: null,
    manager_reviewed: true,
    manager_reviewed_by: "manager-1",
    manager_review_date: todayStr(),
    status: "completed",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeReward(overrides: Partial<RewardRecord> = {}): RewardRecord {
  return {
    id: "r-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    reward_type: "verbal_praise",
    reason: "Good behaviour",
    description: "Praised for helping",
    award_date: todayStr(),
    awarded_by: "staff-1",
    linked_to_target: false,
    target_description: null,
    child_response: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeSanctionRewardMetrics ---------------------------------------------

describe("computeSanctionRewardMetrics", () => {
  it("returns zeroes for empty arrays", () => {
    const r = computeSanctionRewardMetrics([], []);
    expect(r.total_sanctions).toBe(0);
    expect(r.total_rewards).toBe(0);
    expect(r.reward_to_sanction_ratio).toBeNull();;
    expect(r.proportionality_rate).toBeNull();;
    expect(r.age_appropriate_rate).toBeNull();;
    expect(r.consistent_with_plan_rate).toBeNull();;
    expect(r.manager_review_rate).toBeNull();;
    expect(r.overturned_count).toBe(0);
    expect(r.active_sanctions).toBe(0);
    expect(r.children_with_highest_sanctions).toEqual([]);
    expect(r.children_with_highest_rewards).toEqual([]);
  });

  it("computes reward-to-sanction ratio correctly", () => {
    const sanctions = [makeSanction(), makeSanction({ id: "s-2" })];
    const rewards = [makeReward(), makeReward({ id: "r-2" }), makeReward({ id: "r-3" })];
    const r = computeSanctionRewardMetrics(sanctions, rewards);
    expect(r.total_sanctions).toBe(2);
    expect(r.total_rewards).toBe(3);
    expect(r.reward_to_sanction_ratio).toBe(1.5);
  });

  it("returns total rewards as ratio when no sanctions exist", () => {
    const r = computeSanctionRewardMetrics([], [makeReward(), makeReward({ id: "r-2" })]);
    expect(r.reward_to_sanction_ratio).toBe(2);
  });

  it("counts sanctions by type", () => {
    const sanctions = [
      makeSanction({ sanction_type: "time_out" }),
      makeSanction({ id: "s-2", sanction_type: "time_out" }),
      makeSanction({ id: "s-3", sanction_type: "loss_of_privilege" }),
    ];
    const r = computeSanctionRewardMetrics(sanctions, []);
    expect(r.sanctions_by_type["time_out"]).toBe(2);
    expect(r.sanctions_by_type["loss_of_privilege"]).toBe(1);
  });

  it("computes proportionality and age-appropriate rates", () => {
    const sanctions = [
      makeSanction({ proportionate: true, age_appropriate: true }),
      makeSanction({ id: "s-2", proportionate: false, age_appropriate: false }),
    ];
    const r = computeSanctionRewardMetrics(sanctions, []);
    expect(r.proportionality_rate).toBe(50);
    expect(r.age_appropriate_rate).toBe(50);
  });

  it("counts overturned and active sanctions", () => {
    const sanctions = [
      makeSanction({ status: "overturned" }),
      makeSanction({ id: "s-2", status: "active" }),
      makeSanction({ id: "s-3", status: "active" }),
    ];
    const r = computeSanctionRewardMetrics(sanctions, []);
    expect(r.overturned_count).toBe(1);
    expect(r.active_sanctions).toBe(2);
  });

  it("ranks children with highest sanctions", () => {
    const sanctions = [
      makeSanction({ child_id: "c1", child_name: "Alex" }),
      makeSanction({ id: "s-2", child_id: "c1", child_name: "Alex" }),
      makeSanction({ id: "s-3", child_id: "c2", child_name: "Ben" }),
    ];
    const r = computeSanctionRewardMetrics(sanctions, []);
    expect(r.children_with_highest_sanctions[0].child_id).toBe("c1");
    expect(r.children_with_highest_sanctions[0].count).toBe(2);
  });
});

// -- identifyBehaviourManagementAlerts ----------------------------------------

describe("identifyBehaviourManagementAlerts", () => {
  it("returns empty array when no data", () => {
    const alerts = identifyBehaviourManagementAlerts([], []);
    expect(alerts).toEqual([]);
  });

  it("flags unreviewed sanction as medium", () => {
    const sanctions = [makeSanction({ manager_reviewed: false, status: "active" })];
    const alerts = identifyBehaviourManagementAlerts(sanctions, []);
    const unreviewed = alerts.filter((a) => a.type === "unreviewed_sanction");
    expect(unreviewed).toHaveLength(1);
    expect(unreviewed[0].severity).toBe("medium");
  });

  it("flags disproportionate sanction as high", () => {
    const sanctions = [makeSanction({ proportionate: false })];
    const alerts = identifyBehaviourManagementAlerts(sanctions, []);
    const disprop = alerts.filter((a) => a.type === "disproportionate_sanction");
    expect(disprop).toHaveLength(1);
    expect(disprop[0].severity).toBe("high");
  });

  it("flags not age-appropriate sanction as high", () => {
    const sanctions = [makeSanction({ age_appropriate: false })];
    const alerts = identifyBehaviourManagementAlerts(sanctions, []);
    const notAge = alerts.filter((a) => a.type === "not_age_appropriate");
    expect(notAge).toHaveLength(1);
    expect(notAge[0].severity).toBe("high");
  });

  it("flags inconsistent with plan as high", () => {
    const sanctions = [makeSanction({ consistent_with_plan: false })];
    const alerts = identifyBehaviourManagementAlerts(sanctions, []);
    const incons = alerts.filter((a) => a.type === "inconsistent_with_plan");
    expect(incons).toHaveLength(1);
    expect(incons[0].severity).toBe("high");
  });

  it("flags child not informed as medium", () => {
    const sanctions = [makeSanction({ child_informed: false })];
    const alerts = identifyBehaviourManagementAlerts(sanctions, []);
    const notInformed = alerts.filter((a) => a.type === "child_not_informed");
    expect(notInformed).toHaveLength(1);
    expect(notInformed[0].severity).toBe("medium");
  });

  it("flags 5+ sanctions in 30 days for a child as high", () => {
    const today = todayStr();
    const sanctions = Array.from({ length: 5 }, (_, i) =>
      makeSanction({ id: `s-${i}`, child_id: "c1", child_name: "Alex", incident_date: today }),
    );
    const alerts = identifyBehaviourManagementAlerts(sanctions, []);
    const high = alerts.filter((a) => a.type === "high_sanction_count");
    expect(high).toHaveLength(1);
    expect(high[0].severity).toBe("high");
  });

  it("flags low reward-to-sanction ratio per child as medium", () => {
    const today = todayStr();
    const sanctions = [
      makeSanction({ child_id: "c1", child_name: "Alex", incident_date: today }),
      makeSanction({ id: "s-2", child_id: "c1", child_name: "Alex", incident_date: today }),
    ];
    const rewards: RewardRecord[] = []; // 0 rewards vs 2 sanctions
    const alerts = identifyBehaviourManagementAlerts(sanctions, rewards);
    const low = alerts.filter((a) => a.type === "low_reward_to_sanction_ratio");
    expect(low).toHaveLength(1);
    expect(low[0].severity).toBe("medium");
  });

  it("sorts alerts by severity (critical first)", () => {
    const sanctions = [
      makeSanction({ proportionate: false, manager_reviewed: false, status: "active" }),
    ];
    const alerts = identifyBehaviourManagementAlerts(sanctions, []);
    expect(alerts.length).toBeGreaterThan(1);
    // high comes before medium
    const highIdx = alerts.findIndex((a) => a.severity === "high");
    const medIdx = alerts.findIndex((a) => a.severity === "medium");
    if (highIdx >= 0 && medIdx >= 0) {
      expect(highIdx).toBeLessThan(medIdx);
    }
  });
});
