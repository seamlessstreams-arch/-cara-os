// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR SUPPORT SERVICE TESTS
// Pure-function unit tests for behaviour summary computation, child behaviour
// profile aggregation, PI analysis, alert identification, and constant
// validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../behaviour-service";
import {
  BEHAVIOUR_CATEGORIES,
  DE_ESCALATION_TECHNIQUES,
  PI_TECHNIQUES,
  REWARD_TYPES,
  SANCTION_TYPES,
} from "../behaviour-service";

import type { BehaviourEntry, RewardSanction } from "../behaviour-service";

const {
  computeBehaviourSummary,
  computeChildBehaviourProfile,
  computePIAnalysis,
  identifyBehaviourAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal BehaviourEntry with sensible defaults. */
function entry(
  overrides: Partial<BehaviourEntry> = {},
): BehaviourEntry {
  return {
    id: "id" in overrides ? overrides.id! : "entry-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    date: "date" in overrides ? overrides.date! : "2026-05-01",
    time: "time" in overrides ? overrides.time! : "10:00",
    category: "category" in overrides ? overrides.category! : "concerning",
    description: "description" in overrides ? overrides.description! : "Test behaviour",
    antecedent: "antecedent" in overrides ? overrides.antecedent! : null,
    behaviour: "behaviour" in overrides ? overrides.behaviour! : "Test behaviour detail",
    consequence: "consequence" in overrides ? overrides.consequence! : null,
    de_escalation_used: "de_escalation_used" in overrides ? overrides.de_escalation_used! : [],
    de_escalation_effective: "de_escalation_effective" in overrides ? overrides.de_escalation_effective! : false,
    physical_intervention: "physical_intervention" in overrides ? overrides.physical_intervention! : false,
    pi_technique: "pi_technique" in overrides ? overrides.pi_technique! : null,
    pi_duration_minutes: "pi_duration_minutes" in overrides ? overrides.pi_duration_minutes! : null,
    pi_staff_involved: "pi_staff_involved" in overrides ? overrides.pi_staff_involved! : [],
    pi_injuries_child: "pi_injuries_child" in overrides ? overrides.pi_injuries_child! : false,
    pi_injuries_staff: "pi_injuries_staff" in overrides ? overrides.pi_injuries_staff! : false,
    pi_debrief_completed: "pi_debrief_completed" in overrides ? overrides.pi_debrief_completed! : false,
    pi_debrief_date: "pi_debrief_date" in overrides ? overrides.pi_debrief_date! : null,
    outcome: "outcome" in overrides ? overrides.outcome! : null,
    recorded_by: "recorded_by" in overrides ? overrides.recorded_by! : "staff-1",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-05-01T10:00:00Z",
  };
}

/** Build a minimal RewardSanction with sensible defaults. */
function rewardSanction(
  overrides: Partial<RewardSanction> = {},
): RewardSanction {
  return {
    id: "id" in overrides ? overrides.id! : "rs-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    type: "type" in overrides ? overrides.type! : "reward",
    subtype: "subtype" in overrides ? overrides.subtype! : "verbal_praise",
    reason: "reason" in overrides ? overrides.reason! : "Good behaviour",
    date: "date" in overrides ? overrides.date! : "2026-05-01",
    given_by: "given_by" in overrides ? overrides.given_by! : "staff-1",
    child_response: "child_response" in overrides ? overrides.child_response! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
  };
}

/** Return a date string N days before a reference date. */
function daysAgo(n: number, from: Date = new Date("2026-05-13T12:00:00Z")): string {
  const d = new Date(from.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

// ── computeBehaviourSummary ─────────────────────────────────────────────

describe("computeBehaviourSummary", () => {
  it("returns zeroed stats for empty entries", () => {
    const result = computeBehaviourSummary([]);
    expect(result.total_entries).toBe(0);
    expect(result.by_category).toEqual({});
    expect(result.positive_count).toBe(0);
    expect(result.concerning_count).toBe(0);
    expect(result.pi_count).toBe(0);
    expect(result.de_escalation_success_rate).toBe(0);
    expect(result.pi_injury_rate).toBe(0);
    expect(result.pi_debrief_completion_rate).toBe(0);
    expect(result.avg_pi_duration).toBe(0);
    expect(result.top_de_escalation).toEqual([]);
  });

  it("counts total entries", () => {
    const entries = [entry(), entry({ id: "e2" }), entry({ id: "e3" })];
    const result = computeBehaviourSummary(entries);
    expect(result.total_entries).toBe(3);
  });

  it("counts by category correctly", () => {
    const entries = [
      entry({ category: "positive" }),
      entry({ id: "e2", category: "positive" }),
      entry({ id: "e3", category: "aggression" }),
      entry({ id: "e4", category: "crisis" }),
    ];
    const result = computeBehaviourSummary(entries);
    expect(result.by_category).toEqual({
      positive: 2,
      aggression: 1,
      crisis: 1,
    });
  });

  it("counts positive and concerning entries correctly", () => {
    const entries = [
      entry({ category: "positive" }),
      entry({ id: "e2", category: "positive" }),
      entry({ id: "e3", category: "aggression" }),
    ];
    const result = computeBehaviourSummary(entries);
    expect(result.positive_count).toBe(2);
    expect(result.concerning_count).toBe(1);
  });

  it("treats all non-positive entries as concerning", () => {
    const entries = [
      entry({ category: "crisis" }),
      entry({ id: "e2", category: "self_harm" }),
      entry({ id: "e3", category: "absconding" }),
    ];
    const result = computeBehaviourSummary(entries);
    expect(result.positive_count).toBe(0);
    expect(result.concerning_count).toBe(3);
  });

  it("counts PI entries correctly", () => {
    const entries = [
      entry({ physical_intervention: true }),
      entry({ id: "e2", physical_intervention: true }),
      entry({ id: "e3", physical_intervention: false }),
    ];
    const result = computeBehaviourSummary(entries);
    expect(result.pi_count).toBe(2);
  });

  it("calculates de-escalation success rate as percentage", () => {
    const entries = [
      entry({ de_escalation_used: ["verbal_reassurance"], de_escalation_effective: true }),
      entry({ id: "e2", de_escalation_used: ["distraction"], de_escalation_effective: false }),
      entry({ id: "e3", de_escalation_used: ["offering_space"], de_escalation_effective: true }),
      entry({ id: "e4", de_escalation_used: [] }), // not attempted
    ];
    const result = computeBehaviourSummary(entries);
    // 2/3 attempted were effective = 66.7%
    expect(result.de_escalation_success_rate).toBe(66.7);
  });

  it("returns 0 de-escalation success rate when none attempted", () => {
    const entries = [entry({ de_escalation_used: [] })];
    const result = computeBehaviourSummary(entries);
    expect(result.de_escalation_success_rate).toBe(0);
  });

  it("calculates PI injury rate as percentage", () => {
    const entries = [
      entry({ physical_intervention: true, pi_injuries_child: true }),
      entry({ id: "e2", physical_intervention: true, pi_injuries_staff: true }),
      entry({ id: "e3", physical_intervention: true, pi_injuries_child: false, pi_injuries_staff: false }),
    ];
    const result = computeBehaviourSummary(entries);
    // 2/3 PIs had injuries = 66.7%
    expect(result.pi_injury_rate).toBe(66.7);
  });

  it("calculates PI debrief completion rate as percentage", () => {
    const entries = [
      entry({ physical_intervention: true, pi_debrief_completed: true }),
      entry({ id: "e2", physical_intervention: true, pi_debrief_completed: false }),
      entry({ id: "e3", physical_intervention: true, pi_debrief_completed: true }),
    ];
    const result = computeBehaviourSummary(entries);
    // 2/3 = 66.7%
    expect(result.pi_debrief_completion_rate).toBe(66.7);
  });

  it("calculates average PI duration rounded to integer", () => {
    const entries = [
      entry({ physical_intervention: true, pi_duration_minutes: 5 }),
      entry({ id: "e2", physical_intervention: true, pi_duration_minutes: 10 }),
      entry({ id: "e3", physical_intervention: true, pi_duration_minutes: null }),
    ];
    const result = computeBehaviourSummary(entries);
    // (5 + 10) / 2 = 7.5 rounded to 8
    expect(result.avg_pi_duration).toBe(8);
  });

  it("returns 0 avg PI duration when no PI entries have duration", () => {
    const entries = [
      entry({ physical_intervention: true, pi_duration_minutes: null }),
    ];
    const result = computeBehaviourSummary(entries);
    expect(result.avg_pi_duration).toBe(0);
  });

  it("returns top 5 de-escalation techniques sorted by count", () => {
    const entries = [
      entry({ de_escalation_used: ["verbal_reassurance", "distraction"] }),
      entry({ id: "e2", de_escalation_used: ["verbal_reassurance", "offering_space"] }),
      entry({ id: "e3", de_escalation_used: ["verbal_reassurance", "distraction", "active_listening"] }),
      entry({ id: "e4", de_escalation_used: ["grounding_techniques", "humour", "sensory_regulation"] }),
      entry({ id: "e5", de_escalation_used: ["humour", "planned_ignoring"] }),
    ];
    const result = computeBehaviourSummary(entries);
    expect(result.top_de_escalation.length).toBeLessThanOrEqual(5);
    expect(result.top_de_escalation[0]).toEqual({ technique: "verbal_reassurance", count: 3 });
    expect(result.top_de_escalation[1]).toEqual({ technique: "distraction", count: 2 });
    expect(result.top_de_escalation[2]).toEqual({ technique: "humour", count: 2 });
  });

  it("counts injury when both child and staff are injured", () => {
    const entries = [
      entry({ physical_intervention: true, pi_injuries_child: true, pi_injuries_staff: true }),
    ];
    const result = computeBehaviourSummary(entries);
    // Only 1 incident counted, not 2
    expect(result.pi_injury_rate).toBe(100);
  });
});

// ── computeChildBehaviourProfile ────────────────────────────────────────

describe("computeChildBehaviourProfile", () => {
  it("returns zeroed profile for a child with no entries", () => {
    const result = computeChildBehaviourProfile("child-1", [], []);
    expect(result.child_id).toBe("child-1");
    expect(result.total_entries).toBe(0);
    expect(result.positive_ratio).toBe(0);
    expect(result.pi_count).toBe(0);
    expect(result.common_antecedents).toEqual([]);
    expect(result.common_categories).toEqual([]);
    expect(result.trend).toBe("stable");
    expect(result.rewards_count).toBe(0);
    expect(result.sanctions_count).toBe(0);
    expect(result.reward_sanction_ratio).toBe(0);
    expect(result.last_pi_date).toBeNull();
  });

  it("filters entries by child_id", () => {
    const entries = [
      entry({ child_id: "child-1" }),
      entry({ id: "e2", child_id: "child-2" }),
      entry({ id: "e3", child_id: "child-1" }),
    ];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    expect(result.total_entries).toBe(2);
  });

  it("calculates positive ratio as percentage", () => {
    const entries = [
      entry({ child_id: "child-1", category: "positive" }),
      entry({ id: "e2", child_id: "child-1", category: "positive" }),
      entry({ id: "e3", child_id: "child-1", category: "aggression" }),
      entry({ id: "e4", child_id: "child-1", category: "crisis" }),
    ];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    // 2/4 = 50%
    expect(result.positive_ratio).toBe(50);
  });

  it("counts PI entries and returns last PI date", () => {
    const entries = [
      entry({ child_id: "child-1", physical_intervention: true, date: "2026-03-01" }),
      entry({ id: "e2", child_id: "child-1", physical_intervention: true, date: "2026-05-10" }),
      entry({ id: "e3", child_id: "child-1", physical_intervention: false, date: "2026-05-11" }),
    ];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    expect(result.pi_count).toBe(2);
    expect(result.last_pi_date).toBe("2026-05-10");
  });

  it("returns null for last_pi_date when no PI entries", () => {
    const entries = [entry({ child_id: "child-1", physical_intervention: false })];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    expect(result.last_pi_date).toBeNull();
  });

  it("returns top 3 common antecedents sorted by frequency", () => {
    const entries = [
      entry({ child_id: "child-1", antecedent: "Peer conflict" }),
      entry({ id: "e2", child_id: "child-1", antecedent: "Peer conflict" }),
      entry({ id: "e3", child_id: "child-1", antecedent: "Peer conflict" }),
      entry({ id: "e4", child_id: "child-1", antecedent: "Transition" }),
      entry({ id: "e5", child_id: "child-1", antecedent: "Transition" }),
      entry({ id: "e6", child_id: "child-1", antecedent: "Contact with family" }),
      entry({ id: "e7", child_id: "child-1", antecedent: "Boredom" }),
    ];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    expect(result.common_antecedents).toEqual([
      "Peer conflict",
      "Transition",
      "Contact with family",
    ]);
  });

  it("ignores null and empty antecedents", () => {
    const entries = [
      entry({ child_id: "child-1", antecedent: null }),
      entry({ id: "e2", child_id: "child-1", antecedent: "" }),
      entry({ id: "e3", child_id: "child-1", antecedent: "  " }),
      entry({ id: "e4", child_id: "child-1", antecedent: "Peer conflict" }),
    ];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    expect(result.common_antecedents).toEqual(["Peer conflict"]);
  });

  it("returns common categories sorted by count descending", () => {
    const entries = [
      entry({ child_id: "child-1", category: "aggression" }),
      entry({ id: "e2", child_id: "child-1", category: "aggression" }),
      entry({ id: "e3", child_id: "child-1", category: "positive" }),
      entry({ id: "e4", child_id: "child-1", category: "crisis" }),
      entry({ id: "e5", child_id: "child-1", category: "crisis" }),
      entry({ id: "e6", child_id: "child-1", category: "crisis" }),
    ];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    expect(result.common_categories[0]).toEqual({ category: "crisis", count: 3 });
    expect(result.common_categories[1]).toEqual({ category: "aggression", count: 2 });
    expect(result.common_categories[2]).toEqual({ category: "positive", count: 1 });
  });

  it("detects improving trend when second half has more positives", () => {
    const entries = [
      entry({ child_id: "child-1", category: "aggression", date: "2026-01-01" }),
      entry({ id: "e2", child_id: "child-1", category: "aggression", date: "2026-01-02" }),
      entry({ id: "e3", child_id: "child-1", category: "positive", date: "2026-05-01" }),
      entry({ id: "e4", child_id: "child-1", category: "positive", date: "2026-05-02" }),
    ];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    expect(result.trend).toBe("improving");
  });

  it("detects declining trend when second half has fewer positives", () => {
    const entries = [
      entry({ child_id: "child-1", category: "positive", date: "2026-01-01" }),
      entry({ id: "e2", child_id: "child-1", category: "positive", date: "2026-01-02" }),
      entry({ id: "e3", child_id: "child-1", category: "aggression", date: "2026-05-01" }),
      entry({ id: "e4", child_id: "child-1", category: "aggression", date: "2026-05-02" }),
    ];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    expect(result.trend).toBe("declining");
  });

  it("returns stable trend when positive ratio difference is within threshold", () => {
    const entries = [
      entry({ child_id: "child-1", category: "positive", date: "2026-01-01" }),
      entry({ id: "e2", child_id: "child-1", category: "aggression", date: "2026-01-02" }),
      entry({ id: "e3", child_id: "child-1", category: "positive", date: "2026-05-01" }),
      entry({ id: "e4", child_id: "child-1", category: "aggression", date: "2026-05-02" }),
    ];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    // first half: 1/2=0.5, second half: 1/2=0.5 → stable
    expect(result.trend).toBe("stable");
  });

  it("returns stable trend with fewer than 2 entries", () => {
    const entries = [entry({ child_id: "child-1" })];
    const result = computeChildBehaviourProfile("child-1", entries, []);
    expect(result.trend).toBe("stable");
  });

  it("counts rewards and sanctions separately", () => {
    const rewards = [
      rewardSanction({ child_id: "child-1", type: "reward" }),
      rewardSanction({ id: "rs2", child_id: "child-1", type: "reward" }),
      rewardSanction({ id: "rs3", child_id: "child-1", type: "sanction" }),
    ];
    const result = computeChildBehaviourProfile("child-1", [], rewards);
    expect(result.rewards_count).toBe(2);
    expect(result.sanctions_count).toBe(1);
  });

  it("calculates reward/sanction ratio as percentage of rewards", () => {
    const rewards = [
      rewardSanction({ child_id: "child-1", type: "reward" }),
      rewardSanction({ id: "rs2", child_id: "child-1", type: "reward" }),
      rewardSanction({ id: "rs3", child_id: "child-1", type: "reward" }),
      rewardSanction({ id: "rs4", child_id: "child-1", type: "sanction" }),
    ];
    const result = computeChildBehaviourProfile("child-1", [], rewards);
    // 3/4 = 75%
    expect(result.reward_sanction_ratio).toBe(75);
  });

  it("returns 0 reward/sanction ratio when no rewards or sanctions", () => {
    const result = computeChildBehaviourProfile("child-1", [], []);
    expect(result.reward_sanction_ratio).toBe(0);
  });
});

// ── computePIAnalysis ───────────────────────────────────────────────────

describe("computePIAnalysis", () => {
  it("returns zeroed analysis for empty entries", () => {
    const result = computePIAnalysis([]);
    expect(result.total_pi).toBe(0);
    expect(result.by_technique).toEqual({});
    expect(result.by_level).toEqual({ low: 0, medium: 0, high: 0 });
    expect(result.avg_duration).toBe(0);
    expect(result.injury_incidents).toBe(0);
    expect(result.debrief_rate).toBe(0);
    expect(result.repeat_children).toEqual([]);
    expect(result.staff_involved).toEqual([]);
    expect(result.time_pattern).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
  });

  it("returns zeroed analysis when no entries involve PI", () => {
    const entries = [
      entry({ physical_intervention: false }),
      entry({ id: "e2", physical_intervention: false }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.total_pi).toBe(0);
  });

  it("counts total PI entries correctly", () => {
    const entries = [
      entry({ physical_intervention: true }),
      entry({ id: "e2", physical_intervention: true }),
      entry({ id: "e3", physical_intervention: false }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.total_pi).toBe(2);
  });

  it("counts techniques by name", () => {
    const entries = [
      entry({ physical_intervention: true, pi_technique: "guide_away" }),
      entry({ id: "e2", physical_intervention: true, pi_technique: "guide_away" }),
      entry({ id: "e3", physical_intervention: true, pi_technique: "double_elbow" }),
      entry({ id: "e4", physical_intervention: true, pi_technique: null }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.by_technique).toEqual({ guide_away: 2, double_elbow: 1 });
  });

  it("counts techniques by level (low/medium/high)", () => {
    const entries = [
      entry({ physical_intervention: true, pi_technique: "guide_away" }),      // low
      entry({ id: "e2", physical_intervention: true, pi_technique: "escort" }),  // low
      entry({ id: "e3", physical_intervention: true, pi_technique: "double_elbow" }), // medium
      entry({ id: "e4", physical_intervention: true, pi_technique: "wrap" }),    // medium
      entry({ id: "e5", physical_intervention: true, pi_technique: "ground_hold" }), // high
    ];
    const result = computePIAnalysis(entries);
    expect(result.by_level).toEqual({ low: 2, medium: 2, high: 1 });
  });

  it("does not count unknown techniques toward any level", () => {
    const entries = [
      entry({ physical_intervention: true, pi_technique: "unknown_hold" }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.by_technique).toEqual({ unknown_hold: 1 });
    expect(result.by_level).toEqual({ low: 0, medium: 0, high: 0 });
  });

  it("does not count null technique toward any level", () => {
    const entries = [
      entry({ physical_intervention: true, pi_technique: null }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.by_level).toEqual({ low: 0, medium: 0, high: 0 });
  });

  it("calculates average PI duration rounded to integer", () => {
    const entries = [
      entry({ physical_intervention: true, pi_duration_minutes: 3 }),
      entry({ id: "e2", physical_intervention: true, pi_duration_minutes: 7 }),
      entry({ id: "e3", physical_intervention: true, pi_duration_minutes: null }),
    ];
    const result = computePIAnalysis(entries);
    // (3 + 7) / 2 = 5
    expect(result.avg_duration).toBe(5);
  });

  it("returns 0 avg duration when all PI entries have null duration", () => {
    const entries = [
      entry({ physical_intervention: true, pi_duration_minutes: null }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.avg_duration).toBe(0);
  });

  it("counts injury incidents (child or staff)", () => {
    const entries = [
      entry({ physical_intervention: true, pi_injuries_child: true, pi_injuries_staff: false }),
      entry({ id: "e2", physical_intervention: true, pi_injuries_child: false, pi_injuries_staff: true }),
      entry({ id: "e3", physical_intervention: true, pi_injuries_child: true, pi_injuries_staff: true }),
      entry({ id: "e4", physical_intervention: true, pi_injuries_child: false, pi_injuries_staff: false }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.injury_incidents).toBe(3);
  });

  it("calculates debrief rate as percentage", () => {
    const entries = [
      entry({ physical_intervention: true, pi_debrief_completed: true }),
      entry({ id: "e2", physical_intervention: true, pi_debrief_completed: true }),
      entry({ id: "e3", physical_intervention: true, pi_debrief_completed: false }),
    ];
    const result = computePIAnalysis(entries);
    // 2/3 = 66.7%
    expect(result.debrief_rate).toBe(66.7);
  });

  it("returns 100% debrief rate when all PIs debriefed", () => {
    const entries = [
      entry({ physical_intervention: true, pi_debrief_completed: true }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.debrief_rate).toBe(100);
  });

  it("identifies repeat children with 2+ PIs sorted descending", () => {
    const entries = [
      entry({ physical_intervention: true, child_id: "child-A" }),
      entry({ id: "e2", physical_intervention: true, child_id: "child-A" }),
      entry({ id: "e3", physical_intervention: true, child_id: "child-A" }),
      entry({ id: "e4", physical_intervention: true, child_id: "child-B" }),
      entry({ id: "e5", physical_intervention: true, child_id: "child-B" }),
      entry({ id: "e6", physical_intervention: true, child_id: "child-C" }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.repeat_children).toEqual([
      { child_id: "child-A", count: 3 },
      { child_id: "child-B", count: 2 },
    ]);
    // child-C has only 1 PI so not included
  });

  it("returns top 5 staff sorted by PI involvement count", () => {
    const entries = [
      entry({ physical_intervention: true, pi_staff_involved: ["s1", "s2"] }),
      entry({ id: "e2", physical_intervention: true, pi_staff_involved: ["s1", "s3"] }),
      entry({ id: "e3", physical_intervention: true, pi_staff_involved: ["s1"] }),
    ];
    const result = computePIAnalysis(entries);
    expect(result.staff_involved[0]).toEqual({ staff_id: "s1", count: 3 });
    expect(result.staff_involved.length).toBeLessThanOrEqual(5);
  });

  it("categorises PI times into morning/afternoon/evening/night", () => {
    const entries = [
      entry({ physical_intervention: true, time: "07:30" }),  // morning
      entry({ id: "e2", physical_intervention: true, time: "11:59" }),  // morning
      entry({ id: "e3", physical_intervention: true, time: "12:00" }),  // afternoon
      entry({ id: "e4", physical_intervention: true, time: "17:59" }),  // afternoon
      entry({ id: "e5", physical_intervention: true, time: "18:00" }),  // evening
      entry({ id: "e6", physical_intervention: true, time: "21:59" }),  // evening
      entry({ id: "e7", physical_intervention: true, time: "22:00" }),  // night
      entry({ id: "e8", physical_intervention: true, time: "05:59" }),  // night
    ];
    const result = computePIAnalysis(entries);
    expect(result.time_pattern).toEqual({
      morning: 2,
      afternoon: 2,
      evening: 2,
      night: 2,
    });
  });

  it("counts hour 6 as morning and hour 5 as night", () => {
    const entries = [
      entry({ physical_intervention: true, time: "06:00" }),  // morning
      entry({ id: "e2", physical_intervention: true, time: "05:59" }),  // night
    ];
    const result = computePIAnalysis(entries);
    expect(result.time_pattern.morning).toBe(1);
    expect(result.time_pattern.night).toBe(1);
  });
});

// ── identifyBehaviourAlerts ─────────────────────────────────────────────

describe("identifyBehaviourAlerts", () => {
  // Use a fixed "now" concept via date strings relative to real time.
  // The function uses `new Date()` internally, so we use dates relative to today.
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  /** Return date string N days before today. */
  function daysBeforeToday(n: number): string {
    const d = new Date(today.getTime() - n * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  }

  it("returns empty alerts array for empty entries", () => {
    const result = identifyBehaviourAlerts([], []);
    expect(result).toEqual([]);
  });

  it("flags PI without debrief older than 24 hours", () => {
    const entries = [
      entry({
        physical_intervention: true,
        pi_debrief_completed: false,
        date: daysBeforeToday(3),
        time: "10:00",
        child_id: "child-1",
      }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "pi_without_debrief");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.child_id).toBe("child-1");
  });

  it("does not flag PI without debrief when less than 24 hours old", () => {
    // Create an entry from just 1 hour ago
    const recentDate = new Date(today.getTime() - 1 * 60 * 60 * 1000);
    const entries = [
      entry({
        physical_intervention: true,
        pi_debrief_completed: false,
        date: recentDate.toISOString().split("T")[0],
        time: recentDate.toISOString().split("T")[1].substring(0, 5),
        child_id: "child-1",
      }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "pi_without_debrief");
    expect(alert).toBeUndefined();
  });

  it("does not flag PI with debrief completed", () => {
    const entries = [
      entry({
        physical_intervention: true,
        pi_debrief_completed: true,
        date: daysBeforeToday(3),
        time: "10:00",
      }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "pi_without_debrief");
    expect(alert).toBeUndefined();
  });

  it("flags critical alert for PI with child injury", () => {
    const entries = [
      entry({
        physical_intervention: true,
        pi_injuries_child: true,
        pi_injuries_staff: false,
        date: todayStr,
      }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "pi_injury");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
    expect(alert!.message).toContain("child");
  });

  it("flags critical alert for PI with staff injury", () => {
    const entries = [
      entry({
        physical_intervention: true,
        pi_injuries_child: false,
        pi_injuries_staff: true,
        date: todayStr,
      }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "pi_injury");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("staff");
  });

  it("mentions both child and staff when both injured", () => {
    const entries = [
      entry({
        physical_intervention: true,
        pi_injuries_child: true,
        pi_injuries_staff: true,
        date: todayStr,
      }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "pi_injury");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("child and staff");
  });

  it("flags escalating behaviour when 3+ concerning/crisis/aggression in last 7 days", () => {
    const entries = [
      entry({ child_id: "child-1", category: "concerning", date: daysBeforeToday(1) }),
      entry({ id: "e2", child_id: "child-1", category: "crisis", date: daysBeforeToday(2) }),
      entry({ id: "e3", child_id: "child-1", category: "aggression", date: daysBeforeToday(3) }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "escalating_behaviour");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.child_id).toBe("child-1");
  });

  it("does not flag escalating behaviour when fewer than 3 entries in 7 days", () => {
    const entries = [
      entry({ child_id: "child-1", category: "concerning", date: daysBeforeToday(1) }),
      entry({ id: "e2", child_id: "child-1", category: "crisis", date: daysBeforeToday(2) }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "escalating_behaviour");
    expect(alert).toBeUndefined();
  });

  it("does not count non-escalating categories toward escalating alert", () => {
    const entries = [
      entry({ child_id: "child-1", category: "positive", date: daysBeforeToday(1) }),
      entry({ id: "e2", child_id: "child-1", category: "positive", date: daysBeforeToday(2) }),
      entry({ id: "e3", child_id: "child-1", category: "positive", date: daysBeforeToday(3) }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "escalating_behaviour");
    expect(alert).toBeUndefined();
  });

  it("flags high PI frequency when 3+ PIs in last 30 days", () => {
    const entries = [
      entry({ child_id: "child-1", physical_intervention: true, date: daysBeforeToday(5) }),
      entry({ id: "e2", child_id: "child-1", physical_intervention: true, date: daysBeforeToday(10) }),
      entry({ id: "e3", child_id: "child-1", physical_intervention: true, date: daysBeforeToday(15) }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "high_pi_frequency");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("does not flag high PI frequency when fewer than 3 PIs in 30 days", () => {
    const entries = [
      entry({ child_id: "child-1", physical_intervention: true, date: daysBeforeToday(5) }),
      entry({ id: "e2", child_id: "child-1", physical_intervention: true, date: daysBeforeToday(10) }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "high_pi_frequency");
    expect(alert).toBeUndefined();
  });

  it("flags low positive ratio when under 30% in last 30 days", () => {
    const entries = [
      entry({ child_id: "child-1", category: "positive", date: daysBeforeToday(5) }),
      entry({ id: "e2", child_id: "child-1", category: "aggression", date: daysBeforeToday(6) }),
      entry({ id: "e3", child_id: "child-1", category: "crisis", date: daysBeforeToday(7) }),
      entry({ id: "e4", child_id: "child-1", category: "concerning", date: daysBeforeToday(8) }),
      entry({ id: "e5", child_id: "child-1", category: "aggression", date: daysBeforeToday(9) }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "low_positive_ratio");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    // 1/5 = 20%
    expect(alert!.message).toContain("20%");
  });

  it("does not flag low positive ratio when 30% or above", () => {
    const entries = [
      entry({ child_id: "child-1", category: "positive", date: daysBeforeToday(5) }),
      entry({ id: "e2", child_id: "child-1", category: "positive", date: daysBeforeToday(6) }),
      entry({ id: "e3", child_id: "child-1", category: "aggression", date: daysBeforeToday(7) }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const alert = result.find((a) => a.type === "low_positive_ratio");
    // 2/3 = 66.7% — above 30%
    expect(alert).toBeUndefined();
  });

  it("flags sanction-heavy when more sanctions than rewards in last 30 days", () => {
    const rewards = [
      rewardSanction({ child_id: "child-1", type: "sanction", date: daysBeforeToday(5) }),
      rewardSanction({ id: "rs2", child_id: "child-1", type: "sanction", date: daysBeforeToday(6) }),
      rewardSanction({ id: "rs3", child_id: "child-1", type: "reward", date: daysBeforeToday(7) }),
    ];
    // Need at least one entry for the child to appear in childIds
    const entries = [entry({ child_id: "child-1", date: daysBeforeToday(5) })];
    const result = identifyBehaviourAlerts(entries, rewards);
    const alert = result.find((a) => a.type === "sanction_heavy");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("2 sanctions");
    expect(alert!.message).toContain("1 rewards");
  });

  it("does not flag sanction-heavy when rewards outnumber sanctions", () => {
    const rewards = [
      rewardSanction({ child_id: "child-1", type: "reward", date: daysBeforeToday(5) }),
      rewardSanction({ id: "rs2", child_id: "child-1", type: "reward", date: daysBeforeToday(6) }),
      rewardSanction({ id: "rs3", child_id: "child-1", type: "sanction", date: daysBeforeToday(7) }),
    ];
    const entries = [entry({ child_id: "child-1", date: daysBeforeToday(5) })];
    const result = identifyBehaviourAlerts(entries, rewards);
    const alert = result.find((a) => a.type === "sanction_heavy");
    expect(alert).toBeUndefined();
  });

  it("does not flag sanction-heavy when there are zero sanctions", () => {
    const rewards = [
      rewardSanction({ child_id: "child-1", type: "reward", date: daysBeforeToday(5) }),
    ];
    const entries = [entry({ child_id: "child-1", date: daysBeforeToday(5) })];
    const result = identifyBehaviourAlerts(entries, rewards);
    const alert = result.find((a) => a.type === "sanction_heavy");
    expect(alert).toBeUndefined();
  });

  it("generates alerts per-child independently", () => {
    const entries = [
      // child-1: 3 escalating entries
      entry({ child_id: "child-1", category: "concerning", date: daysBeforeToday(1) }),
      entry({ id: "e2", child_id: "child-1", category: "crisis", date: daysBeforeToday(2) }),
      entry({ id: "e3", child_id: "child-1", category: "aggression", date: daysBeforeToday(3) }),
      // child-2: only 1 escalating entry
      entry({ id: "e4", child_id: "child-2", category: "aggression", date: daysBeforeToday(1) }),
    ];
    const result = identifyBehaviourAlerts(entries, []);
    const escalating1 = result.find(
      (a) => a.type === "escalating_behaviour" && a.child_id === "child-1",
    );
    const escalating2 = result.find(
      (a) => a.type === "escalating_behaviour" && a.child_id === "child-2",
    );
    expect(escalating1).toBeDefined();
    expect(escalating2).toBeUndefined();
  });
});

// ── Constants ───────────────────────────────────────────────────────────

describe("BEHAVIOUR_CATEGORIES", () => {
  it("has exactly 10 entries", () => {
    expect(BEHAVIOUR_CATEGORIES).toHaveLength(10);
  });

  it("each entry has category and label strings", () => {
    for (const cat of BEHAVIOUR_CATEGORIES) {
      expect(typeof cat.category).toBe("string");
      expect(typeof cat.label).toBe("string");
    }
  });

  it("includes positive and crisis categories", () => {
    const categories = BEHAVIOUR_CATEGORIES.map((c) => c.category);
    expect(categories).toContain("positive");
    expect(categories).toContain("crisis");
  });

  it("includes aggression and self_harm categories", () => {
    const categories = BEHAVIOUR_CATEGORIES.map((c) => c.category);
    expect(categories).toContain("aggression");
    expect(categories).toContain("self_harm");
  });
});

describe("DE_ESCALATION_TECHNIQUES", () => {
  it("has exactly 11 entries", () => {
    expect(DE_ESCALATION_TECHNIQUES).toHaveLength(11);
  });

  it("each entry is a string", () => {
    for (const technique of DE_ESCALATION_TECHNIQUES) {
      expect(typeof technique).toBe("string");
    }
  });

  it("includes verbal_reassurance and distraction", () => {
    expect(DE_ESCALATION_TECHNIQUES).toContain("verbal_reassurance");
    expect(DE_ESCALATION_TECHNIQUES).toContain("distraction");
  });

  it("includes grounding_techniques and sensory_regulation", () => {
    expect(DE_ESCALATION_TECHNIQUES).toContain("grounding_techniques");
    expect(DE_ESCALATION_TECHNIQUES).toContain("sensory_regulation");
  });
});

describe("PI_TECHNIQUES", () => {
  it("has exactly 8 entries", () => {
    expect(PI_TECHNIQUES).toHaveLength(8);
  });

  it("each entry has technique, level, and description", () => {
    for (const pi of PI_TECHNIQUES) {
      expect(typeof pi.technique).toBe("string");
      expect(["low", "medium", "high"]).toContain(pi.level);
      expect(typeof pi.description).toBe("string");
    }
  });

  it("has correct level for guide_away (low) and ground_hold (high)", () => {
    const guideAway = PI_TECHNIQUES.find((t) => t.technique === "guide_away");
    const groundHold = PI_TECHNIQUES.find((t) => t.technique === "ground_hold");
    expect(guideAway!.level).toBe("low");
    expect(groundHold!.level).toBe("high");
  });

  it("contains 3 low, 4 medium, and 1 high technique", () => {
    const low = PI_TECHNIQUES.filter((t) => t.level === "low");
    const medium = PI_TECHNIQUES.filter((t) => t.level === "medium");
    const high = PI_TECHNIQUES.filter((t) => t.level === "high");
    expect(low).toHaveLength(3);
    expect(medium).toHaveLength(4);
    expect(high).toHaveLength(1);
  });
});

describe("REWARD_TYPES", () => {
  it("has exactly 8 entries", () => {
    expect(REWARD_TYPES).toHaveLength(8);
  });

  it("each entry is a string", () => {
    for (const r of REWARD_TYPES) {
      expect(typeof r).toBe("string");
    }
  });

  it("includes verbal_praise and token_earned", () => {
    expect(REWARD_TYPES).toContain("verbal_praise");
    expect(REWARD_TYPES).toContain("token_earned");
  });
});

describe("SANCTION_TYPES", () => {
  it("has exactly 7 entries", () => {
    expect(SANCTION_TYPES).toHaveLength(7);
  });

  it("each entry is a string", () => {
    for (const s of SANCTION_TYPES) {
      expect(typeof s).toBe("string");
    }
  });

  it("includes verbal_warning and loss_of_privilege", () => {
    expect(SANCTION_TYPES).toContain("verbal_warning");
    expect(SANCTION_TYPES).toContain("loss_of_privilege");
  });
});
