// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SANCTIONS, REWARDS & CONSEQUENCE FRAMEWORK SERVICE TESTS
// Pure-function tests for sanction/reward metrics computation, behaviour
// management alert identification, and constant validation. CHR 2015 Reg 19
// (behaviour management), Reg 20 (restraint), Reg 35 (behaviour management
// standards). Covers SCCIF Experiences & Progress and Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  SANCTION_TYPES,
  REWARD_TYPES,
  SANCTION_STATUS,
  PROHIBITED_SANCTIONS,
} from "../sanctions-rewards-service";

const { computeSanctionRewardMetrics, identifyBehaviourManagementAlerts } =
  _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago from now. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal SanctionRecord with sensible defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeSanction(overrides: Record<string, unknown> = {}): any {
  return {
    id: "sanc-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    sanction_type: "verbal_reminder",
    reason: "Disruptive behaviour",
    description: "Verbal reminder given",
    incident_date: daysAgo(5),
    incident_time: "10:00",
    duration_minutes: 0,
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
    manager_review_date: daysAgo(4),
    status: "completed",
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal RewardRecord with sensible defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeReward(overrides: Record<string, unknown> = {}): any {
  return {
    id: "rew-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    reward_type: "verbal_praise",
    reason: "Good behaviour",
    description: "Praised for tidying up",
    award_date: daysAgo(5),
    awarded_by: "staff-1",
    linked_to_target: false,
    target_description: null,
    child_response: null,
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("SANCTION_TYPES", () => {
  it("has exactly 8 sanction types", () => {
    expect(SANCTION_TYPES).toHaveLength(8);
  });

  it("contains unique type values", () => {
    const types = SANCTION_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = SANCTION_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes verbal_reminder", () => {
    expect(SANCTION_TYPES.find((t) => t.type === "verbal_reminder")).toBeDefined();
  });

  it("includes time_out", () => {
    expect(SANCTION_TYPES.find((t) => t.type === "time_out")).toBeDefined();
  });

  it("includes loss_of_privilege", () => {
    expect(SANCTION_TYPES.find((t) => t.type === "loss_of_privilege")).toBeDefined();
  });

  it("includes early_bedtime", () => {
    expect(SANCTION_TYPES.find((t) => t.type === "early_bedtime")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of SANCTION_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("REWARD_TYPES", () => {
  it("has exactly 8 reward types", () => {
    expect(REWARD_TYPES).toHaveLength(8);
  });

  it("contains unique type values", () => {
    const types = REWARD_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = REWARD_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes verbal_praise", () => {
    expect(REWARD_TYPES.find((t) => t.type === "verbal_praise")).toBeDefined();
  });

  it("includes sticker_chart", () => {
    expect(REWARD_TYPES.find((t) => t.type === "sticker_chart")).toBeDefined();
  });

  it("includes pocket_money_bonus", () => {
    expect(REWARD_TYPES.find((t) => t.type === "pocket_money_bonus")).toBeDefined();
  });

  it("includes outing", () => {
    expect(REWARD_TYPES.find((t) => t.type === "outing")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of REWARD_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("SANCTION_STATUS", () => {
  it("has exactly 4 status options", () => {
    expect(SANCTION_STATUS).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const statuses = SANCTION_STATUS.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("includes active, completed, overturned, under_review", () => {
    const statuses = SANCTION_STATUS.map((s) => s.status);
    expect(statuses).toContain("active");
    expect(statuses).toContain("completed");
    expect(statuses).toContain("overturned");
    expect(statuses).toContain("under_review");
  });

  it("every entry has both status and label", () => {
    for (const entry of SANCTION_STATUS) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("PROHIBITED_SANCTIONS", () => {
  it("has exactly 8 prohibited sanctions", () => {
    expect(PROHIBITED_SANCTIONS).toHaveLength(8);
  });

  it("contains unique sanction values", () => {
    const sanctions = PROHIBITED_SANCTIONS.map((p) => p.sanction);
    expect(new Set(sanctions).size).toBe(sanctions.length);
  });

  it("contains unique label values", () => {
    const labels = PROHIBITED_SANCTIONS.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes corporal_punishment", () => {
    expect(PROHIBITED_SANCTIONS.find((p) => p.sanction === "corporal_punishment")).toBeDefined();
  });

  it("includes food_deprivation", () => {
    expect(PROHIBITED_SANCTIONS.find((p) => p.sanction === "food_deprivation")).toBeDefined();
  });

  it("includes group_punishment", () => {
    expect(PROHIBITED_SANCTIONS.find((p) => p.sanction === "group_punishment")).toBeDefined();
  });

  it("includes deprivation_of_sleep", () => {
    expect(PROHIBITED_SANCTIONS.find((p) => p.sanction === "deprivation_of_sleep")).toBeDefined();
  });

  it("every entry has sanction, label, and regulation", () => {
    for (const entry of PROHIBITED_SANCTIONS) {
      expect(entry.sanction).toBeTruthy();
      expect(entry.label).toBeTruthy();
      expect(entry.regulation).toBeTruthy();
    }
  });

  it("all regulations reference Reg 19(3)", () => {
    for (const entry of PROHIBITED_SANCTIONS) {
      expect(entry.regulation).toMatch(/Reg 19\(3\)/);
    }
  });

  it("does not overlap with SANCTION_TYPES values", () => {
    const sanctionTypeValues = SANCTION_TYPES.map((t) => t.type);
    for (const prohibited of PROHIBITED_SANCTIONS) {
      expect(sanctionTypeValues).not.toContain(prohibited.sanction);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeSanctionRewardMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeSanctionRewardMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computeSanctionRewardMetrics([], []);
    expect(result.total_sanctions).toBe(0);
    expect(result.total_rewards).toBe(0);
    expect(result.reward_to_sanction_ratio).toBe(0);
    expect(result.sanctions_by_type).toEqual({});
    expect(result.rewards_by_type).toEqual({});
    expect(result.proportionality_rate).toBe(0);
    expect(result.age_appropriate_rate).toBe(0);
    expect(result.consistent_with_plan_rate).toBe(0);
    expect(result.manager_review_rate).toBe(0);
    expect(result.children_with_highest_sanctions).toEqual([]);
    expect(result.children_with_highest_rewards).toEqual([]);
    expect(result.overturned_count).toBe(0);
    expect(result.active_sanctions).toBe(0);
  });

  it("counts total sanctions correctly", () => {
    const sanctions = [
      makeSanction({ id: "s1" }),
      makeSanction({ id: "s2" }),
      makeSanction({ id: "s3" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.total_sanctions).toBe(3);
  });

  it("counts total rewards correctly", () => {
    const rewards = [
      makeReward({ id: "r1" }),
      makeReward({ id: "r2" }),
    ];
    const result = computeSanctionRewardMetrics([], rewards);
    expect(result.total_rewards).toBe(2);
  });

  it("computes reward-to-sanction ratio correctly", () => {
    const sanctions = [makeSanction({ id: "s1" }), makeSanction({ id: "s2" })];
    const rewards = [
      makeReward({ id: "r1" }),
      makeReward({ id: "r2" }),
      makeReward({ id: "r3" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, rewards);
    expect(result.reward_to_sanction_ratio).toBe(1.5);
  });

  it("returns totalRewards as ratio when no sanctions exist but rewards do", () => {
    const rewards = [makeReward({ id: "r1" }), makeReward({ id: "r2" })];
    const result = computeSanctionRewardMetrics([], rewards);
    expect(result.reward_to_sanction_ratio).toBe(2);
  });

  it("returns 0 ratio when both arrays are empty", () => {
    const result = computeSanctionRewardMetrics([], []);
    expect(result.reward_to_sanction_ratio).toBe(0);
  });

  it("rounds ratio to two decimal places", () => {
    const sanctions = [
      makeSanction({ id: "s1" }),
      makeSanction({ id: "s2" }),
      makeSanction({ id: "s3" }),
    ];
    const rewards = [makeReward({ id: "r1" })];
    const result = computeSanctionRewardMetrics(sanctions, rewards);
    expect(result.reward_to_sanction_ratio).toBe(0.33);
  });

  it("groups sanctions by type", () => {
    const sanctions = [
      makeSanction({ id: "s1", sanction_type: "verbal_reminder" }),
      makeSanction({ id: "s2", sanction_type: "verbal_reminder" }),
      makeSanction({ id: "s3", sanction_type: "time_out" }),
      makeSanction({ id: "s4", sanction_type: "loss_of_privilege" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.sanctions_by_type).toEqual({
      verbal_reminder: 2,
      time_out: 1,
      loss_of_privilege: 1,
    });
  });

  it("groups rewards by type", () => {
    const rewards = [
      makeReward({ id: "r1", reward_type: "verbal_praise" }),
      makeReward({ id: "r2", reward_type: "verbal_praise" }),
      makeReward({ id: "r3", reward_type: "sticker_chart" }),
    ];
    const result = computeSanctionRewardMetrics([], rewards);
    expect(result.rewards_by_type).toEqual({
      verbal_praise: 2,
      sticker_chart: 1,
    });
  });

  it("computes proportionality rate as percentage", () => {
    const sanctions = [
      makeSanction({ id: "s1", proportionate: true }),
      makeSanction({ id: "s2", proportionate: true }),
      makeSanction({ id: "s3", proportionate: false }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.proportionality_rate).toBe(66.7);
  });

  it("returns 100% proportionality when all proportionate", () => {
    const sanctions = [
      makeSanction({ id: "s1", proportionate: true }),
      makeSanction({ id: "s2", proportionate: true }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.proportionality_rate).toBe(100);
  });

  it("returns 0% proportionality when none proportionate", () => {
    const sanctions = [
      makeSanction({ id: "s1", proportionate: false }),
      makeSanction({ id: "s2", proportionate: false }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.proportionality_rate).toBe(0);
  });

  it("computes age-appropriate rate as percentage", () => {
    const sanctions = [
      makeSanction({ id: "s1", age_appropriate: true }),
      makeSanction({ id: "s2", age_appropriate: false }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.age_appropriate_rate).toBe(50);
  });

  it("computes consistent-with-plan rate as percentage", () => {
    const sanctions = [
      makeSanction({ id: "s1", consistent_with_plan: true }),
      makeSanction({ id: "s2", consistent_with_plan: true }),
      makeSanction({ id: "s3", consistent_with_plan: true }),
      makeSanction({ id: "s4", consistent_with_plan: false }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.consistent_with_plan_rate).toBe(75);
  });

  it("computes manager review rate as percentage", () => {
    const sanctions = [
      makeSanction({ id: "s1", manager_reviewed: true }),
      makeSanction({ id: "s2", manager_reviewed: false }),
      makeSanction({ id: "s3", manager_reviewed: false }),
      makeSanction({ id: "s4", manager_reviewed: false }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.manager_review_rate).toBe(25);
  });

  it("counts overturned sanctions", () => {
    const sanctions = [
      makeSanction({ id: "s1", status: "overturned" }),
      makeSanction({ id: "s2", status: "overturned" }),
      makeSanction({ id: "s3", status: "completed" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.overturned_count).toBe(2);
  });

  it("counts active sanctions", () => {
    const sanctions = [
      makeSanction({ id: "s1", status: "active" }),
      makeSanction({ id: "s2", status: "active" }),
      makeSanction({ id: "s3", status: "completed" }),
      makeSanction({ id: "s4", status: "active" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.active_sanctions).toBe(3);
  });

  it("ranks children with highest sanctions descending", () => {
    const sanctions = [
      makeSanction({ id: "s1", child_id: "c1", child_name: "Alex" }),
      makeSanction({ id: "s2", child_id: "c1", child_name: "Alex" }),
      makeSanction({ id: "s3", child_id: "c1", child_name: "Alex" }),
      makeSanction({ id: "s4", child_id: "c2", child_name: "Beth" }),
      makeSanction({ id: "s5", child_id: "c2", child_name: "Beth" }),
      makeSanction({ id: "s6", child_id: "c3", child_name: "Charlie" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.children_with_highest_sanctions[0]).toEqual({
      child_id: "c1",
      child_name: "Alex",
      count: 3,
    });
    expect(result.children_with_highest_sanctions[1]).toEqual({
      child_id: "c2",
      child_name: "Beth",
      count: 2,
    });
    expect(result.children_with_highest_sanctions[2]).toEqual({
      child_id: "c3",
      child_name: "Charlie",
      count: 1,
    });
  });

  it("ranks children with highest rewards descending", () => {
    const rewards = [
      makeReward({ id: "r1", child_id: "c1", child_name: "Alex" }),
      makeReward({ id: "r2", child_id: "c2", child_name: "Beth" }),
      makeReward({ id: "r3", child_id: "c2", child_name: "Beth" }),
      makeReward({ id: "r4", child_id: "c2", child_name: "Beth" }),
    ];
    const result = computeSanctionRewardMetrics([], rewards);
    expect(result.children_with_highest_rewards[0]).toEqual({
      child_id: "c2",
      child_name: "Beth",
      count: 3,
    });
    expect(result.children_with_highest_rewards[1]).toEqual({
      child_id: "c1",
      child_name: "Alex",
      count: 1,
    });
  });

  it("limits children with highest sanctions to top 10", () => {
    const sanctions = Array.from({ length: 12 }, (_, i) =>
      makeSanction({
        id: `s${i}`,
        child_id: `c${i}`,
        child_name: `Child ${i}`,
      }),
    );
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.children_with_highest_sanctions.length).toBeLessThanOrEqual(10);
  });

  it("limits children with highest rewards to top 10", () => {
    const rewards = Array.from({ length: 12 }, (_, i) =>
      makeReward({
        id: `r${i}`,
        child_id: `c${i}`,
        child_name: `Child ${i}`,
      }),
    );
    const result = computeSanctionRewardMetrics([], rewards);
    expect(result.children_with_highest_rewards.length).toBeLessThanOrEqual(10);
  });

  it("handles mixed sanctions and rewards for the same child", () => {
    const sanctions = [
      makeSanction({ id: "s1", child_id: "c1", child_name: "Alex" }),
    ];
    const rewards = [
      makeReward({ id: "r1", child_id: "c1", child_name: "Alex" }),
      makeReward({ id: "r2", child_id: "c1", child_name: "Alex" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, rewards);
    expect(result.total_sanctions).toBe(1);
    expect(result.total_rewards).toBe(2);
    expect(result.reward_to_sanction_ratio).toBe(2);
    expect(result.children_with_highest_sanctions[0].count).toBe(1);
    expect(result.children_with_highest_rewards[0].count).toBe(2);
  });

  it("handles all-rewards scenario correctly", () => {
    const rewards = [
      makeReward({ id: "r1" }),
      makeReward({ id: "r2" }),
      makeReward({ id: "r3" }),
    ];
    const result = computeSanctionRewardMetrics([], rewards);
    expect(result.total_sanctions).toBe(0);
    expect(result.total_rewards).toBe(3);
    expect(result.reward_to_sanction_ratio).toBe(3);
    expect(result.proportionality_rate).toBe(0);
    expect(result.age_appropriate_rate).toBe(0);
    expect(result.manager_review_rate).toBe(0);
    expect(result.overturned_count).toBe(0);
    expect(result.active_sanctions).toBe(0);
  });

  it("handles all-sanctions scenario correctly", () => {
    const sanctions = [
      makeSanction({ id: "s1", proportionate: true, age_appropriate: true, manager_reviewed: true, status: "active" }),
      makeSanction({ id: "s2", proportionate: false, age_appropriate: true, manager_reviewed: false, status: "completed" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.total_rewards).toBe(0);
    expect(result.reward_to_sanction_ratio).toBe(0);
    expect(result.proportionality_rate).toBe(50);
    expect(result.age_appropriate_rate).toBe(100);
    expect(result.manager_review_rate).toBe(50);
    expect(result.active_sanctions).toBe(1);
  });

  it("handles single sanction with all flags true", () => {
    const sanctions = [
      makeSanction({
        proportionate: true,
        age_appropriate: true,
        consistent_with_plan: true,
        manager_reviewed: true,
      }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.proportionality_rate).toBe(100);
    expect(result.age_appropriate_rate).toBe(100);
    expect(result.consistent_with_plan_rate).toBe(100);
    expect(result.manager_review_rate).toBe(100);
  });

  it("handles single sanction with all flags false", () => {
    const sanctions = [
      makeSanction({
        proportionate: false,
        age_appropriate: false,
        consistent_with_plan: false,
        manager_reviewed: false,
      }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.proportionality_rate).toBe(0);
    expect(result.age_appropriate_rate).toBe(0);
    expect(result.consistent_with_plan_rate).toBe(0);
    expect(result.manager_review_rate).toBe(0);
  });

  it("accumulates multiple sanction types in sanctions_by_type", () => {
    const sanctions = [
      makeSanction({ id: "s1", sanction_type: "reparation" }),
      makeSanction({ id: "s2", sanction_type: "reparation" }),
      makeSanction({ id: "s3", sanction_type: "natural_consequence" }),
      makeSanction({ id: "s4", sanction_type: "additional_chore" }),
      makeSanction({ id: "s5", sanction_type: "additional_chore" }),
      makeSanction({ id: "s6", sanction_type: "additional_chore" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.sanctions_by_type.reparation).toBe(2);
    expect(result.sanctions_by_type.natural_consequence).toBe(1);
    expect(result.sanctions_by_type.additional_chore).toBe(3);
  });

  it("accumulates multiple reward types in rewards_by_type", () => {
    const rewards = [
      makeReward({ id: "r1", reward_type: "certificate" }),
      makeReward({ id: "r2", reward_type: "certificate" }),
      makeReward({ id: "r3", reward_type: "treat" }),
      makeReward({ id: "r4", reward_type: "outing" }),
    ];
    const result = computeSanctionRewardMetrics([], rewards);
    expect(result.rewards_by_type.certificate).toBe(2);
    expect(result.rewards_by_type.treat).toBe(1);
    expect(result.rewards_by_type.outing).toBe(1);
  });

  it("counts overturned and active as separate status", () => {
    const sanctions = [
      makeSanction({ id: "s1", status: "active" }),
      makeSanction({ id: "s2", status: "overturned" }),
      makeSanction({ id: "s3", status: "under_review" }),
      makeSanction({ id: "s4", status: "completed" }),
      makeSanction({ id: "s5", status: "active" }),
    ];
    const result = computeSanctionRewardMetrics(sanctions, []);
    expect(result.active_sanctions).toBe(2);
    expect(result.overturned_count).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyBehaviourManagementAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyBehaviourManagementAlerts", () => {
  it("returns empty array for empty inputs", () => {
    const alerts = identifyBehaviourManagementAlerts([], []);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all sanctions are fully compliant", () => {
    const sanctions = [
      makeSanction({
        proportionate: true,
        age_appropriate: true,
        consistent_with_plan: true,
        child_informed: true,
        manager_reviewed: true,
        status: "completed",
      }),
    ];
    const rewards = [makeReward()];
    const alerts = identifyBehaviourManagementAlerts(sanctions, rewards);
    expect(alerts).toEqual([]);
  });

  // ── Unreviewed sanctions ──────────────────────────────────────────────

  describe("unreviewed sanctions", () => {
    it("flags unreviewed sanction", () => {
      const sanctions = [
        makeSanction({ manager_reviewed: false, status: "active" }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const unreviewed = alerts.filter((a) => a.type === "unreviewed_sanction");
      expect(unreviewed).toHaveLength(1);
      expect(unreviewed[0].severity).toBe("medium");
    });

    it("does not flag overturned sanctions as unreviewed", () => {
      const sanctions = [
        makeSanction({ manager_reviewed: false, status: "overturned" }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const unreviewed = alerts.filter((a) => a.type === "unreviewed_sanction");
      expect(unreviewed).toHaveLength(0);
    });

    it("flags multiple unreviewed sanctions", () => {
      const sanctions = [
        makeSanction({ id: "s1", manager_reviewed: false, status: "active" }),
        makeSanction({ id: "s2", manager_reviewed: false, status: "completed" }),
        makeSanction({ id: "s3", manager_reviewed: true, status: "active" }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const unreviewed = alerts.filter((a) => a.type === "unreviewed_sanction");
      expect(unreviewed).toHaveLength(2);
    });

    it("includes child_id and sanction_id in unreviewed alert", () => {
      const sanctions = [
        makeSanction({
          id: "sanc-99",
          child_id: "child-42",
          manager_reviewed: false,
          status: "active",
        }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const unreviewed = alerts.find((a) => a.type === "unreviewed_sanction");
      expect(unreviewed?.child_id).toBe("child-42");
      expect(unreviewed?.sanction_id).toBe("sanc-99");
    });
  });

  // ── Disproportionate sanctions ────────────────────────────────────────

  describe("disproportionate sanctions", () => {
    it("flags sanction marked as not proportionate", () => {
      const sanctions = [makeSanction({ proportionate: false })];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const disp = alerts.filter((a) => a.type === "disproportionate_sanction");
      expect(disp).toHaveLength(1);
      expect(disp[0].severity).toBe("high");
    });

    it("does not flag proportionate sanctions", () => {
      const sanctions = [makeSanction({ proportionate: true })];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const disp = alerts.filter((a) => a.type === "disproportionate_sanction");
      expect(disp).toHaveLength(0);
    });

    it("message includes Reg 19 reference", () => {
      const sanctions = [makeSanction({ proportionate: false })];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const disp = alerts.find((a) => a.type === "disproportionate_sanction");
      expect(disp?.message).toContain("Reg 19");
    });
  });

  // ── Not age-appropriate ───────────────────────────────────────────────

  describe("not age-appropriate sanctions", () => {
    it("flags sanction marked as not age-appropriate", () => {
      const sanctions = [makeSanction({ age_appropriate: false })];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const ageAlerts = alerts.filter((a) => a.type === "not_age_appropriate");
      expect(ageAlerts).toHaveLength(1);
      expect(ageAlerts[0].severity).toBe("high");
    });

    it("does not flag age-appropriate sanctions", () => {
      const sanctions = [makeSanction({ age_appropriate: true })];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const ageAlerts = alerts.filter((a) => a.type === "not_age_appropriate");
      expect(ageAlerts).toHaveLength(0);
    });
  });

  // ── Inconsistent with plan ────────────────────────────────────────────

  describe("inconsistent with behaviour support plan", () => {
    it("flags sanction not consistent with plan", () => {
      const sanctions = [makeSanction({ consistent_with_plan: false })];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const planAlerts = alerts.filter((a) => a.type === "inconsistent_with_plan");
      expect(planAlerts).toHaveLength(1);
      expect(planAlerts[0].severity).toBe("high");
    });

    it("message references Reg 19 and Reg 35", () => {
      const sanctions = [makeSanction({ consistent_with_plan: false })];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const planAlert = alerts.find((a) => a.type === "inconsistent_with_plan");
      expect(planAlert?.message).toContain("Reg 19");
      expect(planAlert?.message).toContain("Reg 35");
    });
  });

  // ── Child not informed ────────────────────────────────────────────────

  describe("child not informed", () => {
    it("flags sanction where child was not informed", () => {
      const sanctions = [makeSanction({ child_informed: false })];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const notInformed = alerts.filter((a) => a.type === "child_not_informed");
      expect(notInformed).toHaveLength(1);
      expect(notInformed[0].severity).toBe("medium");
    });

    it("does not flag when child was informed", () => {
      const sanctions = [makeSanction({ child_informed: true })];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const notInformed = alerts.filter((a) => a.type === "child_not_informed");
      expect(notInformed).toHaveLength(0);
    });
  });

  // ── High sanction count per child ─────────────────────────────────────

  describe("high sanction count per child", () => {
    it("flags child with 5+ sanctions in last 30 days", () => {
      const sanctions = Array.from({ length: 5 }, (_, i) =>
        makeSanction({
          id: `s${i}`,
          child_id: "c1",
          child_name: "Alex",
          incident_date: daysAgo(i + 1),
        }),
      );
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const highCount = alerts.filter((a) => a.type === "high_sanction_count");
      expect(highCount).toHaveLength(1);
      expect(highCount[0].severity).toBe("high");
      expect(highCount[0].child_id).toBe("c1");
    });

    it("does not flag child with fewer than 5 sanctions in last 30 days", () => {
      const sanctions = Array.from({ length: 4 }, (_, i) =>
        makeSanction({
          id: `s${i}`,
          child_id: "c1",
          child_name: "Alex",
          incident_date: daysAgo(i + 1),
        }),
      );
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const highCount = alerts.filter((a) => a.type === "high_sanction_count");
      expect(highCount).toHaveLength(0);
    });

    it("does not flag child with 5+ sanctions older than 30 days", () => {
      const sanctions = Array.from({ length: 6 }, (_, i) =>
        makeSanction({
          id: `s${i}`,
          child_id: "c1",
          child_name: "Alex",
          incident_date: daysAgo(35 + i),
        }),
      );
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const highCount = alerts.filter((a) => a.type === "high_sanction_count");
      expect(highCount).toHaveLength(0);
    });

    it("flags multiple children independently", () => {
      const sanctions = [
        ...Array.from({ length: 5 }, (_, i) =>
          makeSanction({
            id: `s1-${i}`,
            child_id: "c1",
            child_name: "Alex",
            incident_date: daysAgo(i + 1),
          }),
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          makeSanction({
            id: `s2-${i}`,
            child_id: "c2",
            child_name: "Beth",
            incident_date: daysAgo(i + 1),
          }),
        ),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const highCount = alerts.filter((a) => a.type === "high_sanction_count");
      expect(highCount).toHaveLength(2);
    });

    it("includes count in message", () => {
      const sanctions = Array.from({ length: 7 }, (_, i) =>
        makeSanction({
          id: `s${i}`,
          child_id: "c1",
          child_name: "Alex",
          incident_date: daysAgo(i + 1),
        }),
      );
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const highCount = alerts.find((a) => a.type === "high_sanction_count");
      expect(highCount?.message).toContain("7 sanctions");
    });
  });

  // ── Low reward-to-sanction ratio per child ────────────────────────────

  describe("low reward-to-sanction ratio per child", () => {
    it("flags child with more sanctions than rewards in last 30 days", () => {
      const sanctions = [
        makeSanction({ id: "s1", child_id: "c1", child_name: "Alex", incident_date: daysAgo(5) }),
        makeSanction({ id: "s2", child_id: "c1", child_name: "Alex", incident_date: daysAgo(10) }),
      ];
      const rewards = [
        makeReward({ id: "r1", child_id: "c1", child_name: "Alex", award_date: daysAgo(5) }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, rewards);
      const lowRatio = alerts.filter((a) => a.type === "low_reward_to_sanction_ratio");
      expect(lowRatio).toHaveLength(1);
      expect(lowRatio[0].severity).toBe("medium");
      expect(lowRatio[0].child_id).toBe("c1");
    });

    it("does not flag when rewards equal sanctions", () => {
      const sanctions = [
        makeSanction({ id: "s1", child_id: "c1", child_name: "Alex", incident_date: daysAgo(5) }),
      ];
      const rewards = [
        makeReward({ id: "r1", child_id: "c1", child_name: "Alex", award_date: daysAgo(5) }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, rewards);
      const lowRatio = alerts.filter((a) => a.type === "low_reward_to_sanction_ratio");
      expect(lowRatio).toHaveLength(0);
    });

    it("does not flag when rewards exceed sanctions", () => {
      const sanctions = [
        makeSanction({ id: "s1", child_id: "c1", child_name: "Alex", incident_date: daysAgo(5) }),
      ];
      const rewards = [
        makeReward({ id: "r1", child_id: "c1", child_name: "Alex", award_date: daysAgo(3) }),
        makeReward({ id: "r2", child_id: "c1", child_name: "Alex", award_date: daysAgo(5) }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, rewards);
      const lowRatio = alerts.filter((a) => a.type === "low_reward_to_sanction_ratio");
      expect(lowRatio).toHaveLength(0);
    });

    it("does not flag child with only rewards and no sanctions", () => {
      const rewards = [
        makeReward({ id: "r1", child_id: "c1", child_name: "Alex", award_date: daysAgo(5) }),
      ];
      const alerts = identifyBehaviourManagementAlerts([], rewards);
      const lowRatio = alerts.filter((a) => a.type === "low_reward_to_sanction_ratio");
      expect(lowRatio).toHaveLength(0);
    });

    it("does not flag when sanctions are older than 30 days", () => {
      const sanctions = [
        makeSanction({ id: "s1", child_id: "c1", child_name: "Alex", incident_date: daysAgo(35) }),
        makeSanction({ id: "s2", child_id: "c1", child_name: "Alex", incident_date: daysAgo(40) }),
      ];
      const rewards = [
        makeReward({ id: "r1", child_id: "c1", child_name: "Alex", award_date: daysAgo(35) }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, rewards);
      const lowRatio = alerts.filter((a) => a.type === "low_reward_to_sanction_ratio");
      expect(lowRatio).toHaveLength(0);
    });

    it("includes counts in message", () => {
      const sanctions = [
        makeSanction({ id: "s1", child_id: "c1", child_name: "Alex", incident_date: daysAgo(2) }),
        makeSanction({ id: "s2", child_id: "c1", child_name: "Alex", incident_date: daysAgo(3) }),
        makeSanction({ id: "s3", child_id: "c1", child_name: "Alex", incident_date: daysAgo(4) }),
      ];
      const rewards = [
        makeReward({ id: "r1", child_id: "c1", child_name: "Alex", award_date: daysAgo(2) }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, rewards);
      const lowRatio = alerts.find((a) => a.type === "low_reward_to_sanction_ratio");
      expect(lowRatio?.message).toContain("1 rewards");
      expect(lowRatio?.message).toContain("3 sanctions");
    });
  });

  // ── Prohibited sanctions ──────────────────────────────────────────────

  describe("prohibited sanctions detected", () => {
    it("flags corporal_punishment as critical", () => {
      const sanctions = [
        makeSanction({ sanction_type: "corporal_punishment" }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const prohibited = alerts.filter((a) => a.type === "prohibited_sanction");
      expect(prohibited).toHaveLength(1);
      expect(prohibited[0].severity).toBe("critical");
    });

    it("flags food_deprivation as critical", () => {
      const sanctions = [
        makeSanction({ sanction_type: "food_deprivation" }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const prohibited = alerts.filter((a) => a.type === "prohibited_sanction");
      expect(prohibited).toHaveLength(1);
      expect(prohibited[0].severity).toBe("critical");
    });

    it("flags group_punishment as critical", () => {
      const sanctions = [
        makeSanction({ sanction_type: "group_punishment" }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const prohibited = alerts.filter((a) => a.type === "prohibited_sanction");
      expect(prohibited).toHaveLength(1);
    });

    it("flags all prohibited sanction types", () => {
      const prohibitedTypes = PROHIBITED_SANCTIONS.map((p) => p.sanction);
      for (const pType of prohibitedTypes) {
        const sanctions = [makeSanction({ id: `s-${pType}`, sanction_type: pType })];
        const alerts = identifyBehaviourManagementAlerts(sanctions, []);
        const prohibited = alerts.filter((a) => a.type === "prohibited_sanction");
        expect(prohibited.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("does not flag valid sanction types as prohibited", () => {
      const validTypes = SANCTION_TYPES.map((t) => t.type);
      for (const vType of validTypes) {
        const sanctions = [makeSanction({ id: `s-${vType}`, sanction_type: vType })];
        const alerts = identifyBehaviourManagementAlerts(sanctions, []);
        const prohibited = alerts.filter((a) => a.type === "prohibited_sanction");
        expect(prohibited).toHaveLength(0);
      }
    });

    it("includes regulation reference in message", () => {
      const sanctions = [
        makeSanction({ sanction_type: "corporal_punishment" }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const prohibited = alerts.find((a) => a.type === "prohibited_sanction");
      expect(prohibited?.message).toContain("Reg 19(3)");
    });

    it("includes label in message", () => {
      const sanctions = [
        makeSanction({ sanction_type: "humiliation" }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const prohibited = alerts.find((a) => a.type === "prohibited_sanction");
      expect(prohibited?.message).toContain("Humiliation or Degrading Treatment");
    });

    it("includes PROHIBITED SANCTION DETECTED prefix in message", () => {
      const sanctions = [
        makeSanction({ sanction_type: "deprivation_of_sleep" }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const prohibited = alerts.find((a) => a.type === "prohibited_sanction");
      expect(prohibited?.message).toContain("PROHIBITED SANCTION DETECTED");
    });
  });

  // ── Sorting ───────────────────────────────────────────────────────────

  describe("alert sorting", () => {
    it("sorts alerts by severity: critical first, then high, medium, low", () => {
      const sanctions = [
        makeSanction({
          id: "s1",
          sanction_type: "corporal_punishment",
          proportionate: true,
          age_appropriate: true,
          consistent_with_plan: true,
          child_informed: true,
          manager_reviewed: false,
          status: "active",
        }),
        makeSanction({
          id: "s2",
          proportionate: false,
          age_appropriate: true,
          consistent_with_plan: true,
          child_informed: true,
          manager_reviewed: true,
          status: "completed",
        }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      expect(alerts.length).toBeGreaterThanOrEqual(2);
      // Critical should come before high, high before medium
      const severities = alerts.map((a) => a.severity);
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      for (let i = 1; i < severities.length; i++) {
        expect(order[severities[i]]).toBeGreaterThanOrEqual(order[severities[i - 1]]);
      }
    });

    it("critical prohibited sanction appears before high disproportionate", () => {
      const sanctions = [
        makeSanction({
          id: "s1",
          proportionate: false,
          sanction_type: "verbal_reminder",
        }),
        makeSanction({
          id: "s2",
          sanction_type: "food_deprivation",
          proportionate: true,
        }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const prohibitedIdx = alerts.findIndex((a) => a.type === "prohibited_sanction");
      const dispIdx = alerts.findIndex((a) => a.type === "disproportionate_sanction");
      expect(prohibitedIdx).toBeLessThan(dispIdx);
    });
  });

  // ── Combined / complex scenarios ──────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates multiple alert types for a single problematic sanction", () => {
      const sanctions = [
        makeSanction({
          proportionate: false,
          age_appropriate: false,
          consistent_with_plan: false,
          child_informed: false,
          manager_reviewed: false,
          status: "active",
        }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("unreviewed_sanction");
      expect(types).toContain("disproportionate_sanction");
      expect(types).toContain("not_age_appropriate");
      expect(types).toContain("inconsistent_with_plan");
      expect(types).toContain("child_not_informed");
    });

    it("handles mixed compliant and non-compliant sanctions", () => {
      const sanctions = [
        makeSanction({
          id: "s1",
          proportionate: true,
          age_appropriate: true,
          consistent_with_plan: true,
          child_informed: true,
          manager_reviewed: true,
          status: "completed",
        }),
        makeSanction({
          id: "s2",
          proportionate: false,
          age_appropriate: true,
          consistent_with_plan: true,
          child_informed: true,
          manager_reviewed: true,
          status: "completed",
        }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const dispAlerts = alerts.filter((a) => a.type === "disproportionate_sanction");
      expect(dispAlerts).toHaveLength(1);
      expect(dispAlerts[0].sanction_id).toBe("s2");
    });

    it("generates high_sanction_count alongside individual alerts", () => {
      const sanctions = Array.from({ length: 6 }, (_, i) =>
        makeSanction({
          id: `s${i}`,
          child_id: "c1",
          child_name: "Alex",
          incident_date: daysAgo(i + 1),
          proportionate: i === 0 ? false : true,
          manager_reviewed: true,
          status: "completed",
        }),
      );
      const alerts = identifyBehaviourManagementAlerts(sanctions, []);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("high_sanction_count");
      expect(types).toContain("disproportionate_sanction");
    });

    it("does not double-count child for low ratio when no recent sanctions", () => {
      const sanctions = [
        makeSanction({ child_id: "c1", child_name: "Alex", incident_date: daysAgo(60) }),
      ];
      const rewards = [
        makeReward({ child_id: "c1", child_name: "Alex", award_date: daysAgo(60) }),
      ];
      const alerts = identifyBehaviourManagementAlerts(sanctions, rewards);
      const lowRatio = alerts.filter((a) => a.type === "low_reward_to_sanction_ratio");
      expect(lowRatio).toHaveLength(0);
    });
  });
});
