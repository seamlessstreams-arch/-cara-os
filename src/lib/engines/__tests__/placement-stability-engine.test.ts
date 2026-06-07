// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT STABILITY ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePlacementStability,
  daysBetween,
  computeAge,
  computeStabilityScore,
  classifyStabilityLevel,
  computeMoodTrend,
  type PlacementStabilityInput,
  type ChildInput,
  type DailyLogInput,
  type IncidentInput,
  type MissingEpisodeInput,
  type KeyworkSessionInput,
  type OutcomeTargetInput,
} from "../placement-stability-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-24";

function makeChild(overrides: Partial<ChildInput> = {}): ChildInput {
  return {
    id: "child_1",
    first_name: "Alex",
    preferred_name: null,
    date_of_birth: "2010-03-14",
    placement_start: "2025-09-01",
    placement_end: null,
    key_worker_id: "staff_1",
    risk_flags: [],
    status: "current",
    ...overrides,
  };
}

function makeDailyLog(overrides: Partial<DailyLogInput> = {}): DailyLogInput {
  return {
    id: "dl_1",
    child_id: "child_1",
    date: "2026-05-20",
    mood_score: 7,
    entry_type: "general",
    is_significant: false,
    ...overrides,
  };
}

function makeIncident(overrides: Partial<IncidentInput> = {}): IncidentInput {
  return {
    id: "inc_1",
    child_id: "child_1",
    date: "2026-05-15",
    type: "behaviour",
    severity: "medium",
    ...overrides,
  };
}

function makeMissing(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  return {
    id: "mfc_1",
    child_id: "child_1",
    date_missing: "2026-05-10",
    status: "closed",
    risk_level: "medium",
    ...overrides,
  };
}

function makeKeywork(overrides: Partial<KeyworkSessionInput> = {}): KeyworkSessionInput {
  return {
    id: "kw_1",
    child_id: "child_1",
    date: "2026-05-18",
    mood_before: 3,
    mood_after: 4,
    type: "one_to_one",
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<OutcomeTargetInput> = {}): OutcomeTargetInput {
  return {
    id: "ot_1",
    child_id: "child_1",
    domain: "emotional_wellbeing",
    direction: "improving",
    current_rating: 3,
    target_rating: 4,
    baseline_rating: 2,
    status: "active",
    ...overrides,
  };
}

function makeInput(overrides: Partial<PlacementStabilityInput> = {}): PlacementStabilityInput {
  return {
    children: [],
    dailyLogs: [],
    incidents: [],
    missingEpisodes: [],
    keyworkSessions: [],
    outcomeTargets: [],
    today: TODAY,
    ...overrides,
  };
}

// ── Unit Tests: daysBetween ─────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-24", "2026-05-24")).toBe(0);
  });

  it("returns positive for later date", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
  });

  it("returns negative if b is before a", () => {
    expect(daysBetween("2026-05-24", "2026-05-20")).toBe(-4);
  });

  it("handles year boundaries", () => {
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
  });

  it("computes full year correctly", () => {
    expect(daysBetween("2025-01-01", "2026-01-01")).toBe(365);
  });
});

// ── Unit Tests: computeAge ──────────────────────────────────────────────────

describe("computeAge", () => {
  it("computes age correctly mid-year", () => {
    expect(computeAge("2010-03-14", "2026-05-24")).toBe(16);
  });

  it("returns age before birthday this year", () => {
    expect(computeAge("2010-08-22", "2026-05-24")).toBe(15);
  });

  it("returns age on exact birthday", () => {
    expect(computeAge("2010-05-24", "2026-05-24")).toBe(16);
  });

  it("returns age the day before birthday", () => {
    expect(computeAge("2010-05-25", "2026-05-24")).toBe(15);
  });
});

// ── Unit Tests: computeStabilityScore ───────────────────────────────────────

describe("computeStabilityScore", () => {
  it("returns base score of 50 + bonuses for ideal child", () => {
    const score = computeStabilityScore({
      placementDays: 400,
      avgMood: 8,
      incidentCount30d: 0,
      missingCount30d: 0,
      keyworkCount30d: 5,
      outcomeProgress: 80,
      riskFlagCount: 0,
    });
    // 50 + 20 (365+) + 15 (mood 8) + 10 (0 incidents) + 5 (0 missing) + 10 (kw>=4) + 10 (outcome>=75) = 120 → clamped to 100
    expect(score).toBe(100);
  });

  it("returns minimum score for struggling child", () => {
    const score = computeStabilityScore({
      placementDays: 10,
      avgMood: 2,
      incidentCount30d: 5,
      missingCount30d: 3,
      keyworkCount30d: 0,
      outcomeProgress: 10,
      riskFlagCount: 4,
    });
    // 50 + 0 (< 30 days) + (-5) (mood < 3) + (-25) (incidents > 3) + (-20) (missing > 1) + (-5) (kw=0) + (-5) (progress < 25) + (-10) (risk >= 3) = -20 → clamped to 0
    expect(score).toBe(0);
  });

  it("handles null mood", () => {
    const score = computeStabilityScore({
      placementDays: 200,
      avgMood: null,
      incidentCount30d: 0,
      missingCount30d: 0,
      keyworkCount30d: 2,
      outcomeProgress: 50,
      riskFlagCount: 0,
    });
    // 50 + 15 (180+) + 0 (null mood) + 10 (0 incidents) + 5 (0 missing) + 5 (kw>=2) + 5 (progress>=50) = 90
    expect(score).toBe(90);
  });

  it("gives placement bonus for 90+ days", () => {
    const score = computeStabilityScore({
      placementDays: 100,
      avgMood: 5,
      incidentCount30d: 1,
      missingCount30d: 0,
      keyworkCount30d: 2,
      outcomeProgress: 50,
      riskFlagCount: 0,
    });
    // 50 + 10 (90+) + 10 (mood>=5) + (-5) (1 incident) + 5 (0 missing) + 5 (kw>=2) + 5 (progress>=50) = 80
    expect(score).toBe(80);
  });

  it("penalises risk flags", () => {
    const withFlags = computeStabilityScore({
      placementDays: 100,
      avgMood: 5,
      incidentCount30d: 1,
      missingCount30d: 0,
      keyworkCount30d: 2,
      outcomeProgress: 50,
      riskFlagCount: 2,
    });
    const withoutFlags = computeStabilityScore({
      placementDays: 100,
      avgMood: 5,
      incidentCount30d: 1,
      missingCount30d: 0,
      keyworkCount30d: 2,
      outcomeProgress: 50,
      riskFlagCount: 0,
    });
    // 2 risk flags = -5 penalty
    expect(withFlags).toBe(withoutFlags - 5);
  });
});

// ── Unit Tests: classifyStabilityLevel ──────────────────────────────────────

describe("classifyStabilityLevel", () => {
  it("classifies 80+ as excellent", () => {
    expect(classifyStabilityLevel(80)).toBe("excellent");
    expect(classifyStabilityLevel(100)).toBe("excellent");
  });

  it("classifies 65-79 as good", () => {
    expect(classifyStabilityLevel(65)).toBe("good");
    expect(classifyStabilityLevel(79)).toBe("good");
  });

  it("classifies 45-64 as moderate", () => {
    expect(classifyStabilityLevel(45)).toBe("moderate");
    expect(classifyStabilityLevel(64)).toBe("moderate");
  });

  it("classifies 25-44 as at_risk", () => {
    expect(classifyStabilityLevel(25)).toBe("at_risk");
    expect(classifyStabilityLevel(44)).toBe("at_risk");
  });

  it("classifies below 25 as critical", () => {
    expect(classifyStabilityLevel(24)).toBe("critical");
    expect(classifyStabilityLevel(0)).toBe("critical");
  });
});

// ── Unit Tests: computeMoodTrend ────────────────────────────────────────────

describe("computeMoodTrend", () => {
  it("returns insufficient_data with no moods", () => {
    expect(computeMoodTrend([], [])).toBe("insufficient_data");
  });

  it("returns insufficient_data with only 1 recent mood and no older", () => {
    expect(computeMoodTrend([5], [])).toBe("insufficient_data");
  });

  it("returns stable with 2+ recent moods and no older", () => {
    expect(computeMoodTrend([5, 6, 7], [])).toBe("stable");
  });

  it("returns improving when recent avg exceeds older by > 0.8", () => {
    expect(computeMoodTrend([7, 8, 8], [5, 5, 5])).toBe("improving");
  });

  it("returns declining when recent avg is < older by > 0.8", () => {
    expect(computeMoodTrend([4, 4, 3], [6, 6, 6])).toBe("declining");
  });

  it("returns stable when difference is within 0.8", () => {
    expect(computeMoodTrend([5, 6, 5], [5, 5, 5])).toBe("stable");
  });

  it("returns insufficient_data with 0 recent and some older", () => {
    expect(computeMoodTrend([], [5, 5, 5])).toBe("insufficient_data");
  });
});

// ── Integration: Empty Input ────────────────────────────────────────────────

describe("computePlacementStability — empty input", () => {
  it("returns empty profiles and no-children insight", () => {
    const result = computePlacementStability(makeInput());
    expect(result.children).toEqual([]);
    expect(result.home_metrics.total_children).toBe(0);
    expect(result.insights.length).toBe(1);
    expect(result.insights[0].severity).toBe("positive");
    expect(result.insights[0].text).toContain("No current placements");
  });
});

// ── Integration: Single Stable Child ────────────────────────────────────────

describe("computePlacementStability — single stable child", () => {
  const child = makeChild({
    id: "yp_1",
    first_name: "Jordan",
    preferred_name: "Jordan",
    date_of_birth: "2011-08-22",
    placement_start: "2025-11-15",
    key_worker_id: "staff_anna",
    risk_flags: [],
  });

  // Recent mood logs (last 14 days: May 10-24)
  const recentLogs: DailyLogInput[] = [
    makeDailyLog({ id: "dl_r1", child_id: "yp_1", date: "2026-05-20", mood_score: 8 }),
    makeDailyLog({ id: "dl_r2", child_id: "yp_1", date: "2026-05-18", mood_score: 7 }),
    makeDailyLog({ id: "dl_r3", child_id: "yp_1", date: "2026-05-16", mood_score: 8 }),
    makeDailyLog({ id: "dl_r4", child_id: "yp_1", date: "2026-05-12", mood_score: 7 }),
  ];

  // Older mood logs (14-28 days ago: Apr 26 - May 10)
  const olderLogs: DailyLogInput[] = [
    makeDailyLog({ id: "dl_o1", child_id: "yp_1", date: "2026-05-08", mood_score: 7 }),
    makeDailyLog({ id: "dl_o2", child_id: "yp_1", date: "2026-05-05", mood_score: 6 }),
    makeDailyLog({ id: "dl_o3", child_id: "yp_1", date: "2026-04-28", mood_score: 7 }),
  ];

  const keywork: KeyworkSessionInput[] = [
    makeKeywork({ id: "kw_1", child_id: "yp_1", date: "2026-05-20" }),
    makeKeywork({ id: "kw_2", child_id: "yp_1", date: "2026-05-14" }),
    makeKeywork({ id: "kw_3", child_id: "yp_1", date: "2026-05-07" }),
    makeKeywork({ id: "kw_4", child_id: "yp_1", date: "2026-04-30" }),
  ];

  const outcomes: OutcomeTargetInput[] = [
    makeOutcome({ id: "ot_1", child_id: "yp_1", direction: "improving" }),
    makeOutcome({ id: "ot_2", child_id: "yp_1", direction: "improving" }),
    makeOutcome({ id: "ot_3", child_id: "yp_1", direction: "stable" }),
  ];

  const input = makeInput({
    children: [child],
    dailyLogs: [...recentLogs, ...olderLogs],
    incidents: [],
    missingEpisodes: [],
    keyworkSessions: keywork,
    outcomeTargets: outcomes,
  });

  const result = computePlacementStability(input);

  it("produces one child profile", () => {
    expect(result.children.length).toBe(1);
  });

  it("computes correct age", () => {
    expect(result.children[0].age).toBe(14);
  });

  it("computes placement days from start to today", () => {
    // 2025-11-15 to 2026-05-24 = 190 days
    expect(result.children[0].placement_days).toBe(190);
  });

  it("has zero incidents and missing", () => {
    expect(result.children[0].incident_count_30d).toBe(0);
    expect(result.children[0].missing_count_30d).toBe(0);
  });

  it("excludes future-dated incidents from the 30-day window", () => {
    const r = computePlacementStability(makeInput({
      children: [makeChild({ id: "child_1" })],
      incidents: [
        makeIncident({ id: "past", child_id: "child_1", date: "2026-05-20" }),   // within 30d
        makeIncident({ id: "future", child_id: "child_1", date: "2026-06-30" }), // future → excluded
      ],
    }));
    expect(r.children[0].incident_count_30d).toBe(1);
  });

  it("clamps placement_days to 0 for a future placement_start", () => {
    const r = computePlacementStability(makeInput({
      children: [makeChild({ id: "child_1", placement_start: "2099-01-01" })],
    }));
    expect(r.children[0].placement_days).toBe(0);
  });

  it("counts keywork sessions in 30 day window", () => {
    expect(result.children[0].keywork_count_30d).toBe(4);
  });

  it("computes outcome progress", () => {
    // 2 improving out of 3 active = 67%
    expect(result.children[0].outcome_progress).toBe(67);
  });

  it("computes average recent mood", () => {
    // (8 + 7 + 8 + 7) / 4 = 7.5
    expect(result.children[0].avg_mood_recent).toBe(7.5);
  });

  it("detects stable/improving mood trend", () => {
    // recent avg 7.5, older avg 6.67 → diff 0.83 → improving
    expect(result.children[0].mood_trend).toBe("improving");
  });

  it("assigns high stability score", () => {
    expect(result.children[0].stability_score).toBeGreaterThanOrEqual(80);
    expect(result.children[0].stability_level).toBe("excellent");
  });

  it("identifies protective factors", () => {
    const pf = result.children[0].protective_factors;
    expect(pf).toContain("Consistently positive mood");
    expect(pf).toContain("Regular keywork engagement");
    expect(pf).toContain("Incident-free this month");
    expect(pf).toContain("No missing episodes");
    expect(pf).toContain("Allocated key worker");
  });

  it("produces positive home metrics", () => {
    expect(result.home_metrics.total_children).toBe(1);
    expect(result.home_metrics.children_at_risk).toBe(0);
    expect(result.home_metrics.children_critical).toBe(0);
    expect(result.home_metrics.incident_rate_per_child_30d).toBe(0);
  });

  it("generates positive insights", () => {
    expect(result.insights.some((i) => i.severity === "positive")).toBe(true);
  });
});

// ── Integration: At-Risk Child ──────────────────────────────────────────────

describe("computePlacementStability — at-risk child", () => {
  const child = makeChild({
    id: "yp_2",
    first_name: "Alex",
    preferred_name: "Alex",
    date_of_birth: "2010-03-14",
    placement_start: "2025-09-01",
    key_worker_id: "staff_1",
    risk_flags: ["missing from care", "exploitation concern"],
  });

  // Declining moods
  const recentLogs: DailyLogInput[] = [
    makeDailyLog({ id: "dl_r1", child_id: "yp_2", date: "2026-05-22", mood_score: 4 }),
    makeDailyLog({ id: "dl_r2", child_id: "yp_2", date: "2026-05-20", mood_score: 3 }),
    makeDailyLog({ id: "dl_r3", child_id: "yp_2", date: "2026-05-17", mood_score: 4 }),
  ];
  const olderLogs: DailyLogInput[] = [
    makeDailyLog({ id: "dl_o1", child_id: "yp_2", date: "2026-05-06", mood_score: 6 }),
    makeDailyLog({ id: "dl_o2", child_id: "yp_2", date: "2026-05-02", mood_score: 6 }),
    makeDailyLog({ id: "dl_o3", child_id: "yp_2", date: "2026-04-28", mood_score: 7 }),
  ];

  // Multiple incidents
  const incidents: IncidentInput[] = [
    makeIncident({ id: "inc_1", child_id: "yp_2", date: "2026-05-20" }),
    makeIncident({ id: "inc_2", child_id: "yp_2", date: "2026-05-15" }),
    makeIncident({ id: "inc_3", child_id: "yp_2", date: "2026-05-10" }),
    makeIncident({ id: "inc_4", child_id: "yp_2", date: "2026-05-05" }),
  ];

  // Multiple missing episodes
  const missing: MissingEpisodeInput[] = [
    makeMissing({ id: "mfc_1", child_id: "yp_2", date_missing: "2026-05-18" }),
    makeMissing({ id: "mfc_2", child_id: "yp_2", date_missing: "2026-05-08" }),
  ];

  // No keywork
  const input = makeInput({
    children: [child],
    dailyLogs: [...recentLogs, ...olderLogs],
    incidents,
    missingEpisodes: missing,
    keyworkSessions: [],
    outcomeTargets: [
      makeOutcome({ id: "ot_1", child_id: "yp_2", direction: "declining" }),
      makeOutcome({ id: "ot_2", child_id: "yp_2", direction: "stable" }),
    ],
  });

  const result = computePlacementStability(input);
  const profile = result.children[0];

  it("detects declining mood", () => {
    expect(profile.mood_trend).toBe("declining");
  });

  it("counts incidents correctly", () => {
    expect(profile.incident_count_30d).toBe(4);
  });

  it("counts missing episodes correctly", () => {
    expect(profile.missing_count_30d).toBe(2);
  });

  it("assigns low stability score", () => {
    expect(profile.stability_score).toBeLessThan(45);
  });

  it("classifies as at_risk or critical", () => {
    expect(["at_risk", "critical"]).toContain(profile.stability_level);
  });

  it("identifies risk factors", () => {
    expect(profile.risk_factors).toContain("missing from care");
    expect(profile.risk_factors).toContain("exploitation concern");
    expect(profile.risk_factors).toContain("High incident frequency");
    expect(profile.risk_factors).toContain("Repeat missing episodes");
    expect(profile.risk_factors).toContain("Declining mood trend");
    expect(profile.risk_factors).toContain("No keywork in 30 days");
  });

  it("generates disruption indicators", () => {
    expect(result.disruption_indicators.length).toBeGreaterThan(0);
    const types = result.disruption_indicators.map((d) => d.indicator);
    expect(types).toContain("repeat_missing");
    expect(types).toContain("high_incidents");
    expect(types).toContain("declining_mood");
    expect(types).toContain("no_keywork");
  });

  it("generates warning/critical insights", () => {
    const severities = result.insights.map((i) => i.severity);
    expect(severities).toContain("warning");
  });

  it("home metrics reflect at-risk children", () => {
    expect(result.home_metrics.children_at_risk + result.home_metrics.children_critical).toBeGreaterThan(0);
  });
});

// ── Integration: Early Placement Fragility ──────────────────────────────────

describe("computePlacementStability — early placement fragility", () => {
  const child = makeChild({
    id: "yp_new",
    first_name: "Sam",
    date_of_birth: "2012-01-15",
    placement_start: "2026-05-10", // 14 days ago
    risk_flags: [],
  });

  const incidents: IncidentInput[] = [
    makeIncident({ id: "inc_1", child_id: "yp_new", date: "2026-05-20" }),
    makeIncident({ id: "inc_2", child_id: "yp_new", date: "2026-05-17" }),
  ];

  const result = computePlacementStability(makeInput({
    children: [child],
    incidents,
  }));

  it("detects early placement fragility indicator", () => {
    const indicators = result.disruption_indicators.map((d) => d.indicator);
    expect(indicators).toContain("early_placement_fragility");
  });

  it("early placement is flagged as high severity", () => {
    const fragility = result.disruption_indicators.find((d) => d.indicator === "early_placement_fragility");
    expect(fragility?.severity).toBe("high");
  });

  it("adds early placement risk factor", () => {
    expect(result.children[0].risk_factors).toContain("Early placement (< 4 weeks)");
  });
});

// ── Integration: Wellbeing Trend ────────────────────────────────────────────

describe("computePlacementStability — wellbeing trend", () => {
  const child = makeChild({ id: "yp_1" });

  // Create mood logs for last 14 days
  const logs: DailyLogInput[] = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date("2026-05-24T00:00:00Z");
    d.setDate(d.getDate() - i);
    logs.push(makeDailyLog({
      id: `dl_${i}`,
      child_id: "yp_1",
      date: d.toISOString().slice(0, 10),
      mood_score: 6 + (i % 3), // varies 6-8
    }));
  }

  const result = computePlacementStability(makeInput({
    children: [child],
    dailyLogs: logs,
  }));

  it("produces wellbeing data points for days with logs", () => {
    expect(result.wellbeing_trend.length).toBeGreaterThan(0);
    expect(result.wellbeing_trend.length).toBeLessThanOrEqual(14);
  });

  it("each data point has date, avg_mood, child_count", () => {
    for (const point of result.wellbeing_trend) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(point.avg_mood).toBeGreaterThanOrEqual(1);
      expect(point.avg_mood).toBeLessThanOrEqual(10);
      expect(point.child_count).toBeGreaterThanOrEqual(1);
    }
  });
});

// ── Integration: Multi-Child Home ───────────────────────────────────────────

describe("computePlacementStability — multi-child home", () => {
  const children: ChildInput[] = [
    makeChild({
      id: "yp_stable",
      first_name: "Jordan",
      preferred_name: "Jordan",
      date_of_birth: "2011-08-22",
      placement_start: "2025-11-15",
      risk_flags: [],
    }),
    makeChild({
      id: "yp_struggling",
      first_name: "Alex",
      preferred_name: "Alex",
      date_of_birth: "2010-03-14",
      placement_start: "2025-09-01",
      risk_flags: ["self-harm"],
    }),
    makeChild({
      id: "yp_ended",
      first_name: "Previous",
      date_of_birth: "2008-01-01",
      placement_start: "2025-01-01",
      placement_end: "2026-03-01",
      status: "ended",
    }),
  ];

  const dailyLogs: DailyLogInput[] = [
    // Jordan — positive
    makeDailyLog({ id: "dl_j1", child_id: "yp_stable", date: "2026-05-22", mood_score: 8 }),
    makeDailyLog({ id: "dl_j2", child_id: "yp_stable", date: "2026-05-20", mood_score: 7 }),
    // Alex — lower
    makeDailyLog({ id: "dl_a1", child_id: "yp_struggling", date: "2026-05-22", mood_score: 4 }),
    makeDailyLog({ id: "dl_a2", child_id: "yp_struggling", date: "2026-05-20", mood_score: 3 }),
    makeDailyLog({ id: "dl_a3", child_id: "yp_struggling", date: "2026-05-02", mood_score: 6 }),
    makeDailyLog({ id: "dl_a4", child_id: "yp_struggling", date: "2026-04-28", mood_score: 6 }),
  ];

  const incidents: IncidentInput[] = [
    makeIncident({ id: "inc_1", child_id: "yp_struggling", date: "2026-05-15" }),
    makeIncident({ id: "inc_2", child_id: "yp_struggling", date: "2026-05-10" }),
    makeIncident({ id: "inc_3", child_id: "yp_struggling", date: "2026-05-05" }),
  ];

  const keywork: KeyworkSessionInput[] = [
    makeKeywork({ id: "kw_1", child_id: "yp_stable", date: "2026-05-20" }),
    makeKeywork({ id: "kw_2", child_id: "yp_stable", date: "2026-05-14" }),
    makeKeywork({ id: "kw_3", child_id: "yp_stable", date: "2026-05-07" }),
    makeKeywork({ id: "kw_4", child_id: "yp_stable", date: "2026-04-30" }),
  ];

  const result = computePlacementStability(makeInput({
    children,
    dailyLogs,
    incidents,
    keyworkSessions: keywork,
  }));

  it("excludes ended placements", () => {
    expect(result.children.length).toBe(2);
    expect(result.home_metrics.total_children).toBe(2);
  });

  it("sorts by stability score (lowest first)", () => {
    expect(result.children[0].stability_score).toBeLessThanOrEqual(result.children[1].stability_score);
  });

  it("computes home-level average stability score", () => {
    const avg = Math.round(
      (result.children[0].stability_score + result.children[1].stability_score) / 2
    );
    expect(result.home_metrics.average_stability_score).toBe(avg);
  });

  it("computes incident rate per child", () => {
    // 3 total incidents / 2 children = 1.5
    expect(result.home_metrics.incident_rate_per_child_30d).toBe(1.5);
  });

  it("computes keywork frequency per child", () => {
    // 4 total keywork / 2 children = 2.0
    expect(result.home_metrics.keywork_frequency_per_child_30d).toBe(2);
  });

  it("computes placement breakdown risk percentage", () => {
    // children at moderate or below / total × 100
    expect(result.home_metrics.placement_breakdown_risk).toBeGreaterThanOrEqual(0);
    expect(result.home_metrics.placement_breakdown_risk).toBeLessThanOrEqual(100);
  });
});

// ── Integration: Outcome Progress ───────────────────────────────────────────

describe("computePlacementStability — outcome progress", () => {
  const child = makeChild({ id: "yp_1" });

  it("gives 50% neutral when no targets exist", () => {
    const result = computePlacementStability(makeInput({
      children: [child],
      outcomeTargets: [],
    }));
    expect(result.children[0].outcome_progress).toBe(50);
  });

  it("counts improving targets as progress", () => {
    const result = computePlacementStability(makeInput({
      children: [child],
      outcomeTargets: [
        makeOutcome({ id: "ot_1", child_id: "yp_1", direction: "improving" }),
        makeOutcome({ id: "ot_2", child_id: "yp_1", direction: "improving" }),
        makeOutcome({ id: "ot_3", child_id: "yp_1", direction: "declining" }),
        makeOutcome({ id: "ot_4", child_id: "yp_1", direction: "stable" }),
      ],
    }));
    // 2 improving / 4 active = 50%
    expect(result.children[0].outcome_progress).toBe(50);
  });

  it("counts targets meeting target_rating as progress", () => {
    const result = computePlacementStability(makeInput({
      children: [child],
      outcomeTargets: [
        makeOutcome({ id: "ot_1", child_id: "yp_1", direction: "stable", current_rating: 4, target_rating: 4 }),
        makeOutcome({ id: "ot_2", child_id: "yp_1", direction: "stable", current_rating: 2, target_rating: 4 }),
      ],
    }));
    // First meets target (current >= target), second doesn't = 50%
    expect(result.children[0].outcome_progress).toBe(50);
  });

  it("ignores non-active targets", () => {
    const result = computePlacementStability(makeInput({
      children: [child],
      outcomeTargets: [
        makeOutcome({ id: "ot_1", child_id: "yp_1", direction: "improving", status: "active" }),
        makeOutcome({ id: "ot_2", child_id: "yp_1", direction: "declining", status: "completed" }),
      ],
    }));
    // Only 1 active, and it's improving = 100%
    expect(result.children[0].outcome_progress).toBe(100);
  });
});

// ── Integration: Disruption Indicators Severity Sorting ─────────────────────

describe("computePlacementStability — disruption indicator sorting", () => {
  const child = makeChild({
    id: "yp_1",
    placement_start: "2025-09-01",
    risk_flags: [],
  });

  // Triggers: high_incidents (medium — 3 incidents) + declining_mood + no_keywork
  const logs: DailyLogInput[] = [
    makeDailyLog({ id: "dl_1", child_id: "yp_1", date: "2026-05-20", mood_score: 3 }),
    makeDailyLog({ id: "dl_2", child_id: "yp_1", date: "2026-05-15", mood_score: 4 }),
    makeDailyLog({ id: "dl_3", child_id: "yp_1", date: "2026-05-03", mood_score: 6 }),
    makeDailyLog({ id: "dl_4", child_id: "yp_1", date: "2026-04-28", mood_score: 7 }),
  ];

  const incidents: IncidentInput[] = [
    makeIncident({ id: "inc_1", child_id: "yp_1", date: "2026-05-20" }),
    makeIncident({ id: "inc_2", child_id: "yp_1", date: "2026-05-15" }),
    makeIncident({ id: "inc_3", child_id: "yp_1", date: "2026-05-10" }),
  ];

  const result = computePlacementStability(makeInput({
    children: [child],
    dailyLogs: logs,
    incidents,
  }));

  it("sorts disruption indicators by severity (high first)", () => {
    if (result.disruption_indicators.length > 1) {
      for (let i = 1; i < result.disruption_indicators.length; i++) {
        const prevSev = result.disruption_indicators[i - 1].severity;
        const currSev = result.disruption_indicators[i].severity;
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        expect(order[prevSev]).toBeLessThanOrEqual(order[currSev]);
      }
    }
  });
});

// ── Integration: Insight Generation ─────────────────────────────────────────

describe("computePlacementStability — insight generation", () => {
  it("generates incident-free insight when no incidents across all children", () => {
    const result = computePlacementStability(makeInput({
      children: [
        makeChild({ id: "yp_1" }),
        makeChild({ id: "yp_2", first_name: "Casey", date_of_birth: "2009-12-05", placement_start: "2026-01-10" }),
      ],
      dailyLogs: [
        makeDailyLog({ id: "dl_1", child_id: "yp_1", date: "2026-05-20", mood_score: 7 }),
        makeDailyLog({ id: "dl_2", child_id: "yp_2", date: "2026-05-20", mood_score: 6 }),
      ],
      keyworkSessions: [
        makeKeywork({ id: "kw_1", child_id: "yp_1", date: "2026-05-20" }),
        makeKeywork({ id: "kw_2", child_id: "yp_2", date: "2026-05-20" }),
      ],
    }));

    const incFreeInsight = result.insights.find((i) =>
      i.text.includes("Zero incidents")
    );
    expect(incFreeInsight).toBeDefined();
    expect(incFreeInsight!.severity).toBe("positive");
  });

  it("generates no-keywork warning insight", () => {
    // Child with > 14 days placement and no keywork
    const result = computePlacementStability(makeInput({
      children: [makeChild({ id: "yp_1", placement_start: "2025-09-01" })],
      keyworkSessions: [],
    }));

    const kwInsight = result.insights.find((i) =>
      i.text.includes("no keywork sessions")
    );
    expect(kwInsight).toBeDefined();
    expect(kwInsight!.severity).toBe("warning");
  });

  it("generates critical insight when child is critical", () => {
    const result = computePlacementStability(makeInput({
      children: [makeChild({
        id: "yp_1",
        placement_start: "2026-05-10", // 14 days
        risk_flags: ["self-harm", "exploitation", "absconding"],
      })],
      incidents: [
        makeIncident({ id: "inc_1", child_id: "yp_1", date: "2026-05-22" }),
        makeIncident({ id: "inc_2", child_id: "yp_1", date: "2026-05-20" }),
        makeIncident({ id: "inc_3", child_id: "yp_1", date: "2026-05-18" }),
        makeIncident({ id: "inc_4", child_id: "yp_1", date: "2026-05-15" }),
        makeIncident({ id: "inc_5", child_id: "yp_1", date: "2026-05-12" }),
      ],
      missingEpisodes: [
        makeMissing({ id: "mfc_1", child_id: "yp_1", date_missing: "2026-05-20" }),
        makeMissing({ id: "mfc_2", child_id: "yp_1", date_missing: "2026-05-15" }),
      ],
    }));

    const criticalInsight = result.insights.find((i) => i.severity === "critical");
    expect(criticalInsight).toBeDefined();
    expect(criticalInsight!.text).toContain("critical stability level");
  });

  it("ensures at least one insight is always generated", () => {
    const result = computePlacementStability(makeInput({
      children: [makeChild({ id: "yp_1" })],
    }));
    expect(result.insights.length).toBeGreaterThan(0);
  });
});

// ── Integration: Full Oak House Scenario ────────────────────────────────────

describe("computePlacementStability — Oak House integration", () => {
  const children: ChildInput[] = [
    {
      id: "yp_alex", first_name: "Alex", preferred_name: "Alex",
      date_of_birth: "2010-03-14", placement_start: "2025-09-01",
      placement_end: null, key_worker_id: "staff_edward",
      risk_flags: ["missing from care", "exploitation concern"],
      status: "current",
    },
    {
      id: "yp_jordan", first_name: "Jordan", preferred_name: "Jordan",
      date_of_birth: "2011-08-22", placement_start: "2025-11-15",
      placement_end: null, key_worker_id: "staff_anna",
      risk_flags: [],
      status: "current",
    },
    {
      id: "yp_casey", first_name: "Casey", preferred_name: "Casey",
      date_of_birth: "2009-12-05", placement_start: "2026-01-10",
      placement_end: null, key_worker_id: "staff_chervelle",
      risk_flags: ["medication refusal", "sleep disturbance"],
      status: "current",
    },
  ];

  // Alex: recent mood declining, older stable
  // Jordan: recent mood high, stable
  // Casey: moderate mood, slight improvement
  const dailyLogs: DailyLogInput[] = [
    // Alex recent (declining)
    makeDailyLog({ id: "dl_a1", child_id: "yp_alex", date: "2026-05-22", mood_score: 4 }),
    makeDailyLog({ id: "dl_a2", child_id: "yp_alex", date: "2026-05-19", mood_score: 5 }),
    makeDailyLog({ id: "dl_a3", child_id: "yp_alex", date: "2026-05-15", mood_score: 4 }),
    // Alex older
    makeDailyLog({ id: "dl_a4", child_id: "yp_alex", date: "2026-05-06", mood_score: 6 }),
    makeDailyLog({ id: "dl_a5", child_id: "yp_alex", date: "2026-05-01", mood_score: 6 }),
    // Jordan recent (positive)
    makeDailyLog({ id: "dl_j1", child_id: "yp_jordan", date: "2026-05-22", mood_score: 8 }),
    makeDailyLog({ id: "dl_j2", child_id: "yp_jordan", date: "2026-05-18", mood_score: 7 }),
    makeDailyLog({ id: "dl_j3", child_id: "yp_jordan", date: "2026-05-14", mood_score: 8 }),
    // Jordan older
    makeDailyLog({ id: "dl_j4", child_id: "yp_jordan", date: "2026-05-05", mood_score: 7 }),
    makeDailyLog({ id: "dl_j5", child_id: "yp_jordan", date: "2026-04-30", mood_score: 7 }),
    // Casey recent (moderate, improving)
    makeDailyLog({ id: "dl_c1", child_id: "yp_casey", date: "2026-05-22", mood_score: 6 }),
    makeDailyLog({ id: "dl_c2", child_id: "yp_casey", date: "2026-05-18", mood_score: 6 }),
    makeDailyLog({ id: "dl_c3", child_id: "yp_casey", date: "2026-05-14", mood_score: 7 }),
    // Casey older
    makeDailyLog({ id: "dl_c4", child_id: "yp_casey", date: "2026-05-06", mood_score: 5 }),
    makeDailyLog({ id: "dl_c5", child_id: "yp_casey", date: "2026-05-02", mood_score: 5 }),
  ];

  // Alex has incidents; others don't
  const incidents: IncidentInput[] = [
    makeIncident({ id: "inc_1", child_id: "yp_alex", date: "2026-05-20", type: "behaviour" }),
    makeIncident({ id: "inc_2", child_id: "yp_alex", date: "2026-05-12", type: "behaviour" }),
    makeIncident({ id: "inc_3", child_id: "yp_alex", date: "2026-05-05", type: "aggression" }),
  ];

  // Alex has recent missing episode
  const missingEpisodes: MissingEpisodeInput[] = [
    makeMissing({ id: "mfc_1", child_id: "yp_alex", date_missing: "2026-05-15", risk_level: "high" }),
  ];

  // Keywork: Alex 3, Jordan 4, Casey 2
  const keyworkSessions: KeyworkSessionInput[] = [
    makeKeywork({ id: "kw_a1", child_id: "yp_alex", date: "2026-05-21" }),
    makeKeywork({ id: "kw_a2", child_id: "yp_alex", date: "2026-05-14" }),
    makeKeywork({ id: "kw_a3", child_id: "yp_alex", date: "2026-05-01" }),
    makeKeywork({ id: "kw_j1", child_id: "yp_jordan", date: "2026-05-22" }),
    makeKeywork({ id: "kw_j2", child_id: "yp_jordan", date: "2026-05-16" }),
    makeKeywork({ id: "kw_j3", child_id: "yp_jordan", date: "2026-05-10" }),
    makeKeywork({ id: "kw_j4", child_id: "yp_jordan", date: "2026-05-02" }),
    makeKeywork({ id: "kw_c1", child_id: "yp_casey", date: "2026-05-19" }),
    makeKeywork({ id: "kw_c2", child_id: "yp_casey", date: "2026-05-08" }),
  ];

  // Outcomes: Alex improving on 4/6, Jordan improving on 4/5, Casey improving on 3/5
  const outcomeTargets: OutcomeTargetInput[] = [
    makeOutcome({ id: "ot_a1", child_id: "yp_alex", direction: "improving" }),
    makeOutcome({ id: "ot_a2", child_id: "yp_alex", direction: "improving" }),
    makeOutcome({ id: "ot_a3", child_id: "yp_alex", direction: "improving" }),
    makeOutcome({ id: "ot_a4", child_id: "yp_alex", direction: "improving" }),
    makeOutcome({ id: "ot_a5", child_id: "yp_alex", direction: "declining" }),
    makeOutcome({ id: "ot_a6", child_id: "yp_alex", direction: "stable" }),
    makeOutcome({ id: "ot_j1", child_id: "yp_jordan", direction: "improving" }),
    makeOutcome({ id: "ot_j2", child_id: "yp_jordan", direction: "improving" }),
    makeOutcome({ id: "ot_j3", child_id: "yp_jordan", direction: "improving" }),
    makeOutcome({ id: "ot_j4", child_id: "yp_jordan", direction: "improving" }),
    makeOutcome({ id: "ot_j5", child_id: "yp_jordan", direction: "stable" }),
    makeOutcome({ id: "ot_c1", child_id: "yp_casey", direction: "improving" }),
    makeOutcome({ id: "ot_c2", child_id: "yp_casey", direction: "improving" }),
    makeOutcome({ id: "ot_c3", child_id: "yp_casey", direction: "improving" }),
    makeOutcome({ id: "ot_c4", child_id: "yp_casey", direction: "stable" }),
    makeOutcome({ id: "ot_c5", child_id: "yp_casey", direction: "stable" }),
  ];

  const result = computePlacementStability(makeInput({
    children,
    dailyLogs,
    incidents,
    missingEpisodes,
    keyworkSessions,
    outcomeTargets,
  }));

  it("processes all 3 current children", () => {
    expect(result.children.length).toBe(3);
    expect(result.home_metrics.total_children).toBe(3);
  });

  it("Alex is lowest stability (sorted first)", () => {
    expect(result.children[0].child_id).toBe("yp_alex");
  });

  it("Jordan has highest stability", () => {
    // Jordan should be last (highest score)
    expect(result.children[2].child_id).toBe("yp_jordan");
  });

  it("Alex shows declining mood", () => {
    const alex = result.children.find((c) => c.child_id === "yp_alex")!;
    expect(alex.mood_trend).toBe("declining");
  });

  it("Jordan shows stable/improving mood", () => {
    const jordan = result.children.find((c) => c.child_id === "yp_jordan")!;
    expect(["stable", "improving"]).toContain(jordan.mood_trend);
  });

  it("Casey shows improving mood", () => {
    const casey = result.children.find((c) => c.child_id === "yp_casey")!;
    expect(casey.mood_trend).toBe("improving");
  });

  it("home average mood is computed across children with data", () => {
    expect(result.home_metrics.avg_mood_home).not.toBeNull();
    expect(result.home_metrics.avg_mood_home!).toBeGreaterThan(0);
  });

  it("generates wellbeing trend data points", () => {
    expect(result.wellbeing_trend.length).toBeGreaterThan(0);
  });

  it("generates meaningful insights mix", () => {
    expect(result.insights.length).toBeGreaterThan(0);
    // Should have at least a warning about Alex
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("disruption indicators reference Alex", () => {
    const alexIndicators = result.disruption_indicators.filter((d) => d.child_id === "yp_alex");
    expect(alexIndicators.length).toBeGreaterThan(0);
  });

  it("Jordan has no disruption indicators", () => {
    const jordanIndicators = result.disruption_indicators.filter((d) => d.child_id === "yp_jordan");
    expect(jordanIndicators.length).toBe(0);
  });

  it("computes correct ages", () => {
    const alex = result.children.find((c) => c.child_id === "yp_alex")!;
    const jordan = result.children.find((c) => c.child_id === "yp_jordan")!;
    const casey = result.children.find((c) => c.child_id === "yp_casey")!;
    expect(alex.age).toBe(16);
    expect(jordan.age).toBe(14);
    expect(casey.age).toBe(16);
  });

  it("computes correct placement days", () => {
    const alex = result.children.find((c) => c.child_id === "yp_alex")!;
    const jordan = result.children.find((c) => c.child_id === "yp_jordan")!;
    const casey = result.children.find((c) => c.child_id === "yp_casey")!;
    expect(alex.placement_days).toBe(daysBetween("2025-09-01", TODAY)); // 265
    expect(jordan.placement_days).toBe(daysBetween("2025-11-15", TODAY)); // 190
    expect(casey.placement_days).toBe(daysBetween("2026-01-10", TODAY)); // 134
  });
});
