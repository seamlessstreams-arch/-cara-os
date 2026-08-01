import { describe, it, expect } from "vitest";
import {
  computeBehaviourSummary,
  computeChildBehaviourProfile,
  computePIAnalysis,
  identifyBehaviourAlerts,
  type BehaviourEntry,
  type RewardSanction,
} from "./behaviour-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeEntry(overrides: Partial<BehaviourEntry> = {}): BehaviourEntry {
  return {
    id: "e-1",
    home_id: "home-1",
    child_id: "child-1",
    date: "2026-05-20",
    time: "14:00",
    category: "positive",
    description: "Good engagement",
    antecedent: null,
    behaviour: "Helped with chores",
    consequence: null,
    de_escalation_used: [],
    de_escalation_effective: false,
    physical_intervention: false,
    pi_technique: null,
    pi_duration_minutes: null,
    pi_staff_involved: [],
    pi_injuries_child: false,
    pi_injuries_staff: false,
    pi_debrief_completed: false,
    pi_debrief_date: null,
    outcome: null,
    recorded_by: "Staff A",
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
    ...overrides,
  };
}

function makeReward(overrides: Partial<RewardSanction> = {}): RewardSanction {
  return {
    id: "rs-1",
    home_id: "home-1",
    child_id: "child-1",
    type: "reward",
    subtype: "verbal_praise",
    reason: "Good behaviour",
    date: "2026-05-20",
    given_by: "Staff A",
    child_response: null,
    created_at: "2026-05-20T00:00:00Z",
    ...overrides,
  };
}

describe("computeBehaviourSummary", () => {
  it("returns zeroes for empty data", () => {
    const m = computeBehaviourSummary([]);
    expect(m.total_entries).toBe(0);
    expect(m.positive_count).toBe(0);
    expect(m.pi_count).toBe(0);
    expect(m.de_escalation_success_rate).toBeNull();
  });

  it("counts categories and PI stats", () => {
    const entries = [
      makeEntry({ id: "1", category: "positive" }),
      makeEntry({ id: "2", category: "concerning" }),
      makeEntry({
        id: "3",
        category: "crisis",
        physical_intervention: true,
        pi_technique: "guide_away",
        pi_duration_minutes: 5,
        pi_injuries_child: true,
        pi_debrief_completed: true,
      }),
    ];
    const m = computeBehaviourSummary(entries);
    expect(m.total_entries).toBe(3);
    expect(m.positive_count).toBe(1);
    expect(m.concerning_count).toBe(2); // total - positive
    expect(m.pi_count).toBe(1);
    expect(m.pi_injury_rate).toBe(100);
    expect(m.pi_debrief_completion_rate).toBe(100);
    expect(m.avg_pi_duration).toBe(5);
  });

  it("computes de-escalation success rate", () => {
    const entries = [
      makeEntry({ id: "1", de_escalation_used: ["verbal_reassurance"], de_escalation_effective: true }),
      makeEntry({ id: "2", de_escalation_used: ["distraction"], de_escalation_effective: false }),
    ];
    const m = computeBehaviourSummary(entries);
    expect(m.de_escalation_success_rate).toBe(50);
    expect(m.top_de_escalation).toHaveLength(2);
  });
});

describe("computeChildBehaviourProfile", () => {
  it("returns zeroes when child has no entries", () => {
    const p = computeChildBehaviourProfile("child-x", [], []);
    expect(p.total_entries).toBe(0);
    expect(p.positive_ratio).toBeNull();
    expect(p.trend).toBe("stable");
  });

  it("computes positive ratio and PI stats for a child", () => {
    const entries = [
      makeEntry({ id: "1", child_id: "c1", category: "positive", date: "2026-05-01" }),
      makeEntry({ id: "2", child_id: "c1", category: "concerning", date: "2026-05-02" }),
      makeEntry({ id: "3", child_id: "c1", category: "positive", date: "2026-05-03", physical_intervention: true }),
    ];
    const rewards = [
      makeReward({ id: "r1", child_id: "c1", type: "reward" }),
      makeReward({ id: "r2", child_id: "c1", type: "sanction" }),
    ];
    const p = computeChildBehaviourProfile("c1", entries, rewards);
    expect(p.total_entries).toBe(3);
    // 2/3 positive = 66.7%
    expect(p.positive_ratio).toBe(66.7);
    expect(p.pi_count).toBe(1);
    expect(p.rewards_count).toBe(1);
    expect(p.sanctions_count).toBe(1);
    expect(p.reward_sanction_ratio).toBe(50);
  });

  it("detects improving trend when second half has more positives", () => {
    const entries = [
      makeEntry({ id: "1", child_id: "c1", category: "concerning", date: "2026-01-01" }),
      makeEntry({ id: "2", child_id: "c1", category: "concerning", date: "2026-01-02" }),
      makeEntry({ id: "3", child_id: "c1", category: "positive", date: "2026-05-01" }),
      makeEntry({ id: "4", child_id: "c1", category: "positive", date: "2026-05-02" }),
    ];
    const p = computeChildBehaviourProfile("c1", entries, []);
    expect(p.trend).toBe("improving");
  });
});

describe("computePIAnalysis", () => {
  it("returns zeroes for entries with no PI", () => {
    const a = computePIAnalysis([makeEntry()]);
    expect(a.total_pi).toBe(0);
    expect(a.avg_duration).toBeNull();
  });

  it("computes PI technique breakdown and time pattern", () => {
    const entries = [
      makeEntry({
        id: "1",
        physical_intervention: true,
        pi_technique: "guide_away",
        pi_duration_minutes: 3,
        pi_staff_involved: ["staff-1"],
        time: "09:00",
      }),
      makeEntry({
        id: "2",
        physical_intervention: true,
        pi_technique: "double_elbow",
        pi_duration_minutes: 7,
        pi_staff_involved: ["staff-1", "staff-2"],
        pi_injuries_child: true,
        time: "15:00",
      }),
    ];
    const a = computePIAnalysis(entries);
    expect(a.total_pi).toBe(2);
    expect(a.by_technique).toEqual({ guide_away: 1, double_elbow: 1 });
    expect(a.by_level.low).toBe(1);
    expect(a.by_level.medium).toBe(1);
    expect(a.avg_duration).toBe(5);
    expect(a.injury_incidents).toBe(1);
    expect(a.time_pattern.morning).toBe(1);
    expect(a.time_pattern.afternoon).toBe(1);
  });
});

describe("identifyBehaviourAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyBehaviourAlerts([], [])).toEqual([]);
  });

  it("fires pi_injury alert for PI with injuries", () => {
    const entries = [
      makeEntry({
        id: "1",
        physical_intervention: true,
        pi_injuries_child: true,
        date: "2026-05-20",
      }),
    ];
    const alerts = identifyBehaviourAlerts(entries, []);
    expect(alerts.find((a) => a.type === "pi_injury")).toBeDefined();
    expect(alerts.find((a) => a.type === "pi_injury")!.severity).toBe("critical");
  });

  it("fires pi_without_debrief for PI > 24h old without debrief", () => {
    const entries = [
      makeEntry({
        id: "1",
        physical_intervention: true,
        pi_debrief_completed: false,
        date: "2020-01-01",
        time: "10:00",
      }),
    ];
    const alerts = identifyBehaviourAlerts(entries, []);
    expect(alerts.find((a) => a.type === "pi_without_debrief")).toBeDefined();
  });

  it("fires low_positive_ratio when all entries in last 30 days are concerning", () => {
    // Use recent dates to be within 30-day window
    const today = new Date();
    const recentDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const entries = [
      makeEntry({ id: "1", child_id: "c1", category: "concerning", date: recentDate }),
      makeEntry({ id: "2", child_id: "c1", category: "aggression", date: recentDate }),
    ];
    const alerts = identifyBehaviourAlerts(entries, []);
    expect(alerts.find((a) => a.type === "low_positive_ratio")).toBeDefined();
  });
});
