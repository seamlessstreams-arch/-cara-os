import { describe, it, expect } from "vitest";
import {
  computeChildBehaviourSafety,
  type ChildBehaviourSafetyInput,
  type BehaviourEntryInput,
  type IncidentInput,
  type RestraintInput,
  type MissingEpisodeInput,
  type SanctionRewardInput,
  type SleepEntryInput,
  type BehaviourSupportPlanInput,
} from "../child-behaviour-safety-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeBehaviour(overrides: Partial<BehaviourEntryInput> = {}): BehaviourEntryInput {
  return {
    id: "beh_1",
    date: "2026-05-20",
    time: "10:00",
    direction: "positive",
    intensity: "low",
    title: "Completed morning routine",
    trigger: "",
    strategy_used: "",
    outcome: "Good cooperation",
    ...overrides,
  };
}

function makeIncident(overrides: Partial<IncidentInput> = {}): IncidentInput {
  return {
    id: "inc_1",
    date: "2026-05-20",
    type: "aggression",
    severity: "medium",
    description: "Verbal aggression towards peer",
    de_escalation_attempted: true,
    physical_intervention: false,
    oversight_completed: true,
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: "rst_1",
    date: "2026-05-20",
    duration_minutes: 8,
    reason: "Imminent harm to self",
    type: "standing_hold",
    de_escalation_attempted: true,
    debrief_completed: true,
    injuries: 0,
    reviewed: true,
    ...overrides,
  };
}

function makeMissing(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  return {
    id: "miss_1",
    date: "2026-05-20",
    duration_hours: 2,
    category: "missing",
    risk_level: "medium",
    return_interview_completed: true,
    ...overrides,
  };
}

function makeSR(overrides: Partial<SanctionRewardInput> = {}): SanctionRewardInput {
  return {
    id: "sr_1",
    date: "2026-05-20",
    direction: "reward",
    title: "Extra screen time",
    proportionate: true,
    child_response: "Pleased",
    ...overrides,
  };
}

function makeSleep(overrides: Partial<SleepEntryInput> = {}): SleepEntryInput {
  return {
    id: "slp_1",
    date: "2026-05-20",
    bedtime: "21:30",
    wake_time: "07:00",
    quality: 4,
    disturbances: 0,
    notes: "",
    ...overrides,
  };
}

function makeBSP(overrides: Partial<BehaviourSupportPlanInput> = {}): BehaviourSupportPlanInput {
  return {
    id: "bsp_1",
    status: "active",
    last_reviewed: "2026-05-01",
    strategies: ["Low arousal", "Distraction", "Choice board"],
    triggers: ["Peer conflict", "Fatigue", "Family contact"],
    positive_approaches: ["Verbal praise", "Reward chart"],
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildBehaviourSafetyInput> = {}): ChildBehaviourSafetyInput {
  return {
    today: TODAY,
    child_id: "yp_1",
    child_name: "Alex",
    behaviour_entries: [],
    incidents: [],
    restraints: [],
    missing_episodes: [],
    sanctions_rewards: [],
    sleep_entries: [],
    behaviour_support_plan: null,
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeChildBehaviourSafety", () => {
  it("returns all required top-level fields", () => {
    const result = computeChildBehaviourSafety(baseInput());
    expect(result).toHaveProperty("generated_at", TODAY);
    expect(result).toHaveProperty("child_id", "yp_1");
    expect(result).toHaveProperty("child_name", "Alex");
    expect(result).toHaveProperty("safety_status");
    expect(result).toHaveProperty("safety_score");
    expect(result).toHaveProperty("headline");
    expect(result).toHaveProperty("behaviour_profile");
    expect(result).toHaveProperty("incident_profile");
    expect(result).toHaveProperty("restraint_profile");
    expect(result).toHaveProperty("missing_profile");
    expect(result).toHaveProperty("sanction_reward_balance");
    expect(result).toHaveProperty("sleep_profile");
    expect(result).toHaveProperty("bsp_compliance");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("concerns");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("insights");
  });

  it("handles empty input without crashing", () => {
    const result = computeChildBehaviourSafety(baseInput());
    expect(result.safety_score).toBeGreaterThanOrEqual(0);
    expect(result.behaviour_profile.total_entries_30d).toBe(0);
    expect(result.incident_profile.total_30d).toBe(0);
    expect(result.restraint_profile.total_30d).toBe(0);
    expect(result.missing_profile.total_30d).toBe(0);
  });

  // ── Behaviour Profile ─────────────────────────────────────────────────

  it("computes positive ratio correctly", () => {
    const entries = [
      makeBehaviour({ id: "b1", direction: "positive", date: "2026-05-20" }),
      makeBehaviour({ id: "b2", direction: "positive", date: "2026-05-19" }),
      makeBehaviour({ id: "b3", direction: "positive", date: "2026-05-18" }),
      makeBehaviour({ id: "b4", direction: "concerning", date: "2026-05-17", intensity: "medium" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.behaviour_profile.positive_ratio).toBe(75);
    expect(result.behaviour_profile.positive_count_30d).toBe(3);
    expect(result.behaviour_profile.concerning_count_30d).toBe(1);
  });

  it("detects improving behaviour trend", () => {
    const entries = [
      // Older (31-60d ago) — mostly concerning
      makeBehaviour({ id: "b1", date: "2026-04-10", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b2", date: "2026-04-12", direction: "concerning", intensity: "high" }),
      makeBehaviour({ id: "b3", date: "2026-04-14", direction: "positive" }),
      // Recent (0-30d) — mostly positive
      makeBehaviour({ id: "b4", date: "2026-05-10", direction: "positive" }),
      makeBehaviour({ id: "b5", date: "2026-05-15", direction: "positive" }),
      makeBehaviour({ id: "b6", date: "2026-05-20", direction: "positive" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.behaviour_profile.trend).toBe("improving");
    expect(result.strengths.some((s) => s.includes("improving"))).toBe(true);
  });

  it("detects declining behaviour trend", () => {
    const entries = [
      // Older — mostly positive
      makeBehaviour({ id: "b1", date: "2026-04-10", direction: "positive" }),
      makeBehaviour({ id: "b2", date: "2026-04-12", direction: "positive" }),
      makeBehaviour({ id: "b3", date: "2026-04-14", direction: "positive" }),
      // Recent — mostly concerning
      makeBehaviour({ id: "b4", date: "2026-05-10", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b5", date: "2026-05-15", direction: "concerning", intensity: "high" }),
      makeBehaviour({ id: "b6", date: "2026-05-20", direction: "positive" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.behaviour_profile.trend).toBe("declining");
    expect(result.concerns.some((c) => c.includes("declining"))).toBe(true);
  });

  it("identifies top triggers", () => {
    const entries = [
      makeBehaviour({ id: "b1", date: "2026-05-20", direction: "concerning", trigger: "Peer conflict", intensity: "medium" }),
      makeBehaviour({ id: "b2", date: "2026-05-19", direction: "concerning", trigger: "Peer conflict", intensity: "medium" }),
      makeBehaviour({ id: "b3", date: "2026-05-18", direction: "concerning", trigger: "Fatigue", intensity: "low" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.behaviour_profile.top_triggers[0]).toBe("Peer conflict");
  });

  it("identifies effective strategies", () => {
    const entries = [
      makeBehaviour({ id: "b1", date: "2026-05-20", direction: "positive", strategy_used: "Visual schedule" }),
      makeBehaviour({ id: "b2", date: "2026-05-19", direction: "positive", strategy_used: "Visual schedule" }),
      makeBehaviour({ id: "b3", date: "2026-05-18", direction: "positive", strategy_used: "Choice board" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.behaviour_profile.effective_strategies[0]).toBe("Visual schedule");
    expect(result.strengths.some((s) => s.includes("strategies identified"))).toBe(true);
  });

  it("detects time-of-day patterns", () => {
    const entries = [
      makeBehaviour({ id: "b1", date: "2026-05-20", time: "19:30", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b2", date: "2026-05-19", time: "20:00", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b3", date: "2026-05-18", time: "18:45", direction: "concerning", intensity: "low" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.behaviour_profile.time_patterns[0]?.period).toBe("evening");
    expect(result.behaviour_profile.time_patterns[0]?.count).toBe(3);
  });

  it("counts high/severe behaviours", () => {
    const entries = [
      makeBehaviour({ id: "b1", date: "2026-05-20", direction: "concerning", intensity: "high" }),
      makeBehaviour({ id: "b2", date: "2026-05-19", direction: "concerning", intensity: "severe" }),
      makeBehaviour({ id: "b3", date: "2026-05-18", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b4", date: "2026-05-17", direction: "concerning", intensity: "high" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.behaviour_profile.high_severe_count_30d).toBe(3);
  });

  it("flags low positive ratio", () => {
    const entries = [
      makeBehaviour({ id: "b1", date: "2026-05-20", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b2", date: "2026-05-19", direction: "concerning", intensity: "high" }),
      makeBehaviour({ id: "b3", date: "2026-05-18", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b4", date: "2026-05-17", direction: "concerning", intensity: "low" }),
      makeBehaviour({ id: "b5", date: "2026-05-16", direction: "positive" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.behaviour_profile.positive_ratio).toBe(20);
    expect(result.concerns.some((c) => c.includes("positive") && c.includes("recording"))).toBe(true);
  });

  // ── Incident Profile ──────────────────────────────────────────────────

  it("computes incident counts and types", () => {
    const incidents = [
      makeIncident({ id: "i1", date: "2026-05-20", type: "aggression" }),
      makeIncident({ id: "i2", date: "2026-05-10", type: "property_damage" }),
      makeIncident({ id: "i3", date: "2026-04-01", type: "aggression" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ incidents }));
    expect(result.incident_profile.total_30d).toBe(2);
    expect(result.incident_profile.total_90d).toBe(3);
    expect(result.incident_profile.by_type[0]?.type).toBe("aggression");
  });

  it("flags critical severity incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", date: "2026-05-20", severity: "critical" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ incidents }));
    expect(result.concerns.some((c) => c.includes("Critical severity"))).toBe(true);
    expect(result.recommendations.some((r) => r.urgency === "immediate" && r.domain === "incidents")).toBe(true);
  });

  it("computes de-escalation rate", () => {
    const incidents = [
      makeIncident({ id: "i1", date: "2026-05-20", de_escalation_attempted: true }),
      makeIncident({ id: "i2", date: "2026-05-10", de_escalation_attempted: true }),
      makeIncident({ id: "i3", date: "2026-04-01", de_escalation_attempted: false }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ incidents }));
    expect(result.incident_profile.de_escalation_rate).toBe(67);
  });

  it("counts open/unreviewed incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", date: "2026-05-20", oversight_completed: false }),
      makeIncident({ id: "i2", date: "2026-05-10", oversight_completed: false }),
      makeIncident({ id: "i3", date: "2026-04-01", oversight_completed: true }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ incidents }));
    expect(result.incident_profile.open_count).toBe(2);
    expect(result.concerns.some((c) => c.includes("awaiting oversight"))).toBe(true);
  });

  it("gives strength for 100% de-escalation", () => {
    const incidents = [
      makeIncident({ id: "i1", date: "2026-05-20", de_escalation_attempted: true }),
      makeIncident({ id: "i2", date: "2026-05-10", de_escalation_attempted: true }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ incidents }));
    expect(result.incident_profile.de_escalation_rate).toBe(100);
    expect(result.strengths.some((s) => s.includes("De-escalation"))).toBe(true);
  });

  it("gives strength for no recent incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", date: "2026-03-01" }), // older than 30d
    ];
    const result = computeChildBehaviourSafety(baseInput({ incidents }));
    expect(result.incident_profile.total_30d).toBe(0);
    expect(result.strengths.some((s) => s.includes("No incidents"))).toBe(true);
  });

  // ── Restraint Profile ─────────────────────────────────────────────────

  it("computes restraint counts and debrief rate", () => {
    const restraints = [
      makeRestraint({ id: "r1", date: "2026-05-20", debrief_completed: true }),
      makeRestraint({ id: "r2", date: "2026-05-10", debrief_completed: false }),
      makeRestraint({ id: "r3", date: "2026-04-01", debrief_completed: true }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ restraints }));
    expect(result.restraint_profile.total_30d).toBe(2);
    expect(result.restraint_profile.total_90d).toBe(3);
    expect(result.restraint_profile.debrief_rate).toBe(67);
  });

  it("flags restraint injuries", () => {
    const restraints = [
      makeRestraint({ id: "r1", date: "2026-05-20", injuries: 1 }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ restraints }));
    expect(result.restraint_profile.injury_count).toBe(1);
    expect(result.concerns.some((c) => c.includes("injury"))).toBe(true);
  });

  it("flags unreviewed restraints", () => {
    const restraints = [
      makeRestraint({ id: "r1", date: "2026-05-20", reviewed: false }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ restraints }));
    expect(result.restraint_profile.unreviewed_count).toBe(1);
    expect(result.concerns.some((c) => c.includes("unreviewed"))).toBe(true);
  });

  it("gives strength for zero restraints when previously used", () => {
    const restraints = [
      makeRestraint({ id: "r1", date: "2026-03-01" }), // older than 30d
    ];
    const result = computeChildBehaviourSafety(baseInput({
      restraints,
      incidents: [makeIncident({ id: "i1", date: "2026-03-05" })], // also older
    }));
    expect(result.restraint_profile.total_30d).toBe(0);
    expect(result.strengths.some((s) => s.includes("No physical interventions"))).toBe(true);
  });

  it("gives strength for 100% debrief rate", () => {
    const restraints = [
      makeRestraint({ id: "r1", date: "2026-05-20", debrief_completed: true }),
      makeRestraint({ id: "r2", date: "2026-05-10", debrief_completed: true }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ restraints }));
    expect(result.restraint_profile.debrief_rate).toBe(100);
    expect(result.strengths.some((s) => s.includes("debriefed"))).toBe(true);
  });

  // ── Missing Profile ───────────────────────────────────────────────────

  it("computes missing episode counts", () => {
    const episodes = [
      makeMissing({ id: "m1", date: "2026-05-20" }),
      makeMissing({ id: "m2", date: "2026-04-20" }),
      makeMissing({ id: "m3", date: "2026-03-20" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ missing_episodes: episodes }));
    expect(result.missing_profile.total_30d).toBe(1);
    expect(result.missing_profile.total_90d).toBe(3);
  });

  it("detects repeat missing pattern", () => {
    const episodes = [
      makeMissing({ id: "m1", date: "2026-05-20" }),
      makeMissing({ id: "m2", date: "2026-05-10" }),
      makeMissing({ id: "m3", date: "2026-04-20" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ missing_episodes: episodes }));
    expect(result.missing_profile.repeat_missing).toBe(true);
  });

  it("flags high-risk missing episodes", () => {
    const episodes = [
      makeMissing({ id: "m1", date: "2026-05-20", risk_level: "high" }),
      makeMissing({ id: "m2", date: "2026-05-10", risk_level: "cs_risk" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ missing_episodes: episodes }));
    expect(result.missing_profile.high_risk_count).toBe(2);
    expect(result.concerns.some((c) => c.includes("high-risk"))).toBe(true);
  });

  it("flags incomplete return interviews", () => {
    const episodes = [
      makeMissing({ id: "m1", date: "2026-05-20", return_interview_completed: true }),
      makeMissing({ id: "m2", date: "2026-05-10", return_interview_completed: false }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ missing_episodes: episodes }));
    expect(result.missing_profile.return_interview_rate).toBe(50);
    expect(result.concerns.some((c) => c.includes("Return interview"))).toBe(true);
  });

  it("gives strength for 100% return interview rate", () => {
    const episodes = [
      makeMissing({ id: "m1", date: "2026-05-20", return_interview_completed: true }),
      makeMissing({ id: "m2", date: "2026-05-10", return_interview_completed: true }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ missing_episodes: episodes }));
    expect(result.missing_profile.return_interview_rate).toBe(100);
    expect(result.strengths.some((s) => s.includes("return interviews"))).toBe(true);
  });

  // ── Sanction / Reward Balance ─────────────────────────────────────────

  it("computes reward-to-sanction ratio", () => {
    const sr = [
      makeSR({ id: "sr1", date: "2026-05-20", direction: "reward" }),
      makeSR({ id: "sr2", date: "2026-05-19", direction: "reward" }),
      makeSR({ id: "sr3", date: "2026-05-18", direction: "reward" }),
      makeSR({ id: "sr4", date: "2026-05-17", direction: "sanction" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ sanctions_rewards: sr }));
    expect(result.sanction_reward_balance.rewards_30d).toBe(3);
    expect(result.sanction_reward_balance.sanctions_30d).toBe(1);
    expect(result.sanction_reward_balance.ratio).toBe(3);
    expect(result.sanction_reward_balance.balance_rating).toBe("positive");
  });

  it("flags sanctions-heavy balance", () => {
    const sr = [
      makeSR({ id: "sr1", date: "2026-05-20", direction: "sanction" }),
      makeSR({ id: "sr2", date: "2026-05-19", direction: "sanction" }),
      makeSR({ id: "sr3", date: "2026-05-18", direction: "reward" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ sanctions_rewards: sr }));
    expect(result.sanction_reward_balance.balance_rating).toBe("sanctions_heavy");
    expect(result.concerns.some((c) => c.includes("Sanctions outweigh"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "sanctions_rewards")).toBe(true);
  });

  it("gives strength for positive balance", () => {
    const sr = [
      makeSR({ id: "sr1", date: "2026-05-20", direction: "reward" }),
      makeSR({ id: "sr2", date: "2026-05-19", direction: "reward" }),
      makeSR({ id: "sr3", date: "2026-05-18", direction: "reward" }),
      makeSR({ id: "sr4", date: "2026-05-17", direction: "sanction" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ sanctions_rewards: sr }));
    expect(result.strengths.some((s) => s.includes("Reward-to-sanction"))).toBe(true);
  });

  // ── Sleep Profile ─────────────────────────────────────────────────────

  it("computes average sleep quality", () => {
    const sleeps = [
      makeSleep({ id: "s1", date: "2026-05-20", quality: 4 }),
      makeSleep({ id: "s2", date: "2026-05-19", quality: 3 }),
      makeSleep({ id: "s3", date: "2026-05-18", quality: 5 }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ sleep_entries: sleeps }));
    expect(result.sleep_profile.entries_14d).toBe(3);
    expect(result.sleep_profile.avg_quality).toBe(4);
  });

  it("flags poor sleep quality", () => {
    const sleeps = [
      makeSleep({ id: "s1", date: "2026-05-20", quality: 2, disturbances: 3 }),
      makeSleep({ id: "s2", date: "2026-05-19", quality: 1, disturbances: 4 }),
      makeSleep({ id: "s3", date: "2026-05-18", quality: 2, disturbances: 2 }),
      makeSleep({ id: "s4", date: "2026-05-17", quality: 2, disturbances: 3 }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ sleep_entries: sleeps }));
    expect(result.sleep_profile.avg_quality).toBeLessThan(2.5);
    expect(result.concerns.some((c) => c.includes("sleep quality"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "sleep")).toBe(true);
  });

  it("gives strength for good sleep", () => {
    const sleeps = [
      makeSleep({ id: "s1", date: "2026-05-20", quality: 4 }),
      makeSleep({ id: "s2", date: "2026-05-19", quality: 5 }),
      makeSleep({ id: "s3", date: "2026-05-18", quality: 4 }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ sleep_entries: sleeps }));
    expect(result.strengths.some((s) => s.includes("sleep quality"))).toBe(true);
  });

  // ── BSP Compliance ────────────────────────────────────────────────────

  it("recognises current BSP", () => {
    const result = computeChildBehaviourSafety(baseInput({
      behaviour_support_plan: makeBSP(),
    }));
    expect(result.bsp_compliance.has_plan).toBe(true);
    expect(result.bsp_compliance.plan_current).toBe(true);
    expect(result.bsp_compliance.strategies_count).toBe(3);
    expect(result.bsp_compliance.triggers_documented).toBe(3);
    expect(result.strengths.some((s) => s.includes("Behaviour support plan"))).toBe(true);
  });

  it("flags missing BSP when concerning behaviours present", () => {
    const entries = [
      makeBehaviour({ id: "b1", date: "2026-05-20", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b2", date: "2026-05-19", direction: "concerning", intensity: "high" }),
      makeBehaviour({ id: "b3", date: "2026-05-18", direction: "concerning", intensity: "medium" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.bsp_compliance.has_plan).toBe(false);
    expect(result.concerns.some((c) => c.includes("no behaviour support plan"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "bsp")).toBe(true);
  });

  // ── Safety Score & Status ─────────────────────────────────────────────

  it("scores high for stable child with positive pattern", () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeBehaviour({ id: `b${i}`, date: `2026-05-${String(13 + i).padStart(2, "0")}`, direction: "positive" }),
    );
    const result = computeChildBehaviourSafety(baseInput({
      behaviour_entries: entries,
      behaviour_support_plan: makeBSP(),
      sleep_entries: [
        makeSleep({ id: "s1", date: "2026-05-20", quality: 4 }),
        makeSleep({ id: "s2", date: "2026-05-19", quality: 5 }),
        makeSleep({ id: "s3", date: "2026-05-18", quality: 4 }),
      ],
      sanctions_rewards: [
        makeSR({ id: "sr1", date: "2026-05-20", direction: "reward" }),
        makeSR({ id: "sr2", date: "2026-05-19", direction: "reward" }),
        makeSR({ id: "sr3", date: "2026-05-18", direction: "reward" }),
        makeSR({ id: "sr4", date: "2026-05-17", direction: "sanction" }),
      ],
    }));
    expect(["stable", "improving"]).toContain(result.safety_status);
    expect(result.safety_score).toBeGreaterThanOrEqual(70);
  });

  it("scores critical for child with multiple risk factors", () => {
    const result = computeChildBehaviourSafety(baseInput({
      behaviour_entries: [
        makeBehaviour({ id: "b1", date: "2026-05-20", direction: "concerning", intensity: "severe" }),
        makeBehaviour({ id: "b2", date: "2026-05-19", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b3", date: "2026-05-18", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b4", date: "2026-05-17", direction: "concerning", intensity: "medium" }),
        makeBehaviour({ id: "b5", date: "2026-05-16", direction: "positive" }),
      ],
      incidents: [
        makeIncident({ id: "i1", date: "2026-05-20", severity: "critical" }),
        makeIncident({ id: "i2", date: "2026-05-15", severity: "high" }),
        makeIncident({ id: "i3", date: "2026-05-10", severity: "medium" }),
      ],
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-20", injuries: 1, debrief_completed: false }),
        makeRestraint({ id: "r2", date: "2026-05-15", debrief_completed: false }),
      ],
      missing_episodes: [
        makeMissing({ id: "m1", date: "2026-05-20", risk_level: "high" }),
        makeMissing({ id: "m2", date: "2026-05-10", risk_level: "cs_risk" }),
        makeMissing({ id: "m3", date: "2026-04-20", risk_level: "high", return_interview_completed: false }),
      ],
    }));
    expect(result.safety_status).toBe("critical");
    expect(result.safety_score).toBeLessThan(40);
    expect(result.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("clamps score between 0 and 100", () => {
    const result = computeChildBehaviourSafety(baseInput());
    expect(result.safety_score).toBeGreaterThanOrEqual(0);
    expect(result.safety_score).toBeLessThanOrEqual(100);
  });

  // ── Headline ──────────────────────────────────────────────────────────

  it("includes key info in headline", () => {
    const result = computeChildBehaviourSafety(baseInput({
      incidents: [makeIncident({ id: "i1", date: "2026-05-20" })],
      restraints: [makeRestraint({ id: "r1", date: "2026-05-20" })],
      missing_episodes: [makeMissing({ id: "m1", date: "2026-05-20" })],
    }));
    expect(result.headline).toContain("1 incident");
    expect(result.headline).toContain("1 restraint");
    expect(result.headline).toContain("1 missing episode");
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────

  it("generates critical insight for high behaviours + restraints", () => {
    const result = computeChildBehaviourSafety(baseInput({
      behaviour_entries: [
        makeBehaviour({ id: "b1", date: "2026-05-20", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b2", date: "2026-05-19", direction: "concerning", intensity: "severe" }),
        makeBehaviour({ id: "b3", date: "2026-05-18", direction: "concerning", intensity: "high" }),
      ],
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-20" }),
        makeRestraint({ id: "r2", date: "2026-05-15" }),
      ],
    }));
    expect(result.insights.some((i) => i.severity === "critical" && i.text.includes("strategies are not preventing escalation"))).toBe(true);
  });

  it("generates critical insight for repeat high-risk missing", () => {
    const episodes = [
      makeMissing({ id: "m1", date: "2026-05-20", risk_level: "high" }),
      makeMissing({ id: "m2", date: "2026-05-10", risk_level: "cs_risk" }),
      makeMissing({ id: "m3", date: "2026-04-20", risk_level: "high" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ missing_episodes: episodes }));
    expect(result.insights.some((i) => i.severity === "critical" && i.text.includes("exploitation vulnerability"))).toBe(true);
  });

  it("generates warning for time-of-day pattern", () => {
    const entries = [
      makeBehaviour({ id: "b1", date: "2026-05-20", time: "19:30", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b2", date: "2026-05-19", time: "20:00", direction: "concerning", intensity: "medium" }),
      makeBehaviour({ id: "b3", date: "2026-05-18", time: "18:45", direction: "concerning", intensity: "low" }),
    ];
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("evening"))).toBe(true);
  });

  it("generates positive insight for stable/improving status", () => {
    const entries = Array.from({ length: 6 }, (_, i) =>
      makeBehaviour({ id: `b${i}`, date: `2026-05-${String(15 + i).padStart(2, "0")}`, direction: "positive" }),
    );
    const result = computeChildBehaviourSafety(baseInput({ behaviour_entries: entries }));
    expect(result.insights.some((i) => i.severity === "positive")).toBe(true);
  });

  it("generates positive insight for zero restraints and incidents", () => {
    const result = computeChildBehaviourSafety(baseInput({
      restraints: [makeRestraint({ id: "r1", date: "2026-03-01" })],
      incidents: [makeIncident({ id: "i1", date: "2026-03-01" })],
    }));
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("Zero restraints and zero incidents"))).toBe(true);
  });

  // ── Recommendations ordering ──────────────────────────────────────────

  it("orders recommendations by urgency (immediate first)", () => {
    const result = computeChildBehaviourSafety(baseInput({
      incidents: [makeIncident({ id: "i1", date: "2026-05-20", severity: "critical" })],
      behaviour_entries: [
        makeBehaviour({ id: "b1", date: "2026-05-20", direction: "concerning", intensity: "medium" }),
        makeBehaviour({ id: "b2", date: "2026-05-19", direction: "concerning", intensity: "medium" }),
        makeBehaviour({ id: "b3", date: "2026-05-18", direction: "concerning", intensity: "medium" }),
      ],
      sleep_entries: [
        makeSleep({ id: "s1", date: "2026-05-20", quality: 1 }),
        makeSleep({ id: "s2", date: "2026-05-19", quality: 2 }),
        makeSleep({ id: "s3", date: "2026-05-18", quality: 1 }),
        makeSleep({ id: "s4", date: "2026-05-17", quality: 2 }),
      ],
    }));
    const urgencies = result.recommendations.map((r) => r.urgency);
    const order = { immediate: 0, soon: 1, planned: 2 };
    for (let i = 1; i < urgencies.length; i++) {
      expect(order[urgencies[i]]).toBeGreaterThanOrEqual(order[urgencies[i - 1]]);
    }
  });
});
