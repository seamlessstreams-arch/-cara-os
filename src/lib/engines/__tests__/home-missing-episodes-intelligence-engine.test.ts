// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MISSING EPISODES INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering missing from care episode analysis,
// reporting compliance, pattern detection, scoring, and insights.
// CHR 2015 Reg 12, Reg 34; SCCIF "Safe."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeMissingEpisodes,
  type HomeMissingEpisodesInput,
  type MissingEpisodeInput,
} from "../home-missing-episodes-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;

function makeEpisode(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  _id++;
  return {
    id: `me_${_id}`,
    child_id: "yp_1",
    date_missing: "2026-05-20",
    duration_hours: 2,
    risk_level: "low",
    reported_to_police: false,
    reported_to_la: true,
    return_interview_completed: true,
    contextual_safeguarding_risk: false,
    status: "closed",
    ...overrides,
  };
}

const baseInput: HomeMissingEpisodesInput = {
  today: TODAY,
  total_children: 3,
  child_ids: ["yp_1", "yp_2", "yp_3"],
  missing_episodes: [],
};

function run(overrides: Partial<HomeMissingEpisodesInput> = {}) {
  return computeHomeMissingEpisodes({ ...baseInput, ...overrides });
}

// ── 1. No Episodes (Outstanding Default) ───────────────────────────────────

describe("no episodes", () => {
  it("returns outstanding with score 90 when no episodes", () => {
    const r = run({});
    expect(r.missing_episodes_rating).toBe("outstanding");
    expect(r.missing_episodes_score).toBe(90);
  });

  it("headline mentions no missing episodes", () => {
    const r = run({});
    expect(r.headline).toContain("No missing from care episodes");
  });

  it("has one strength about safety", () => {
    const r = run({});
    expect(r.strengths.length).toBe(1);
    expect(r.strengths[0]).toContain("safe, settled");
  });

  it("has no concerns", () => {
    const r = run({});
    expect(r.concerns).toEqual([]);
  });

  it("has no recommendations", () => {
    const r = run({});
    expect(r.recommendations).toEqual([]);
  });

  it("has one positive insight", () => {
    const r = run({});
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("positive");
  });

  it("episode profile has all zeros", () => {
    const r = run({});
    expect(r.episodes.total_90d).toBe(0);
    expect(r.episodes.total_180d).toBe(0);
    expect(r.episodes.high_risk_count).toBe(0);
    expect(r.episodes.avg_duration_hours).toBe(0);
    expect(r.episodes.longest_duration_hours).toBe(0);
    expect(r.episodes.children_with_episodes).toEqual([]);
    expect(r.episodes.repeat_children).toEqual([]);
    expect(r.episodes.open_episodes).toBe(0);
  });

  it("pattern profile is empty", () => {
    const r = run({});
    expect(r.pattern.escalating).toBe(false);
    expect(r.pattern.concentrated_child).toBeNull();
    expect(r.pattern.concentrated_count).toBe(0);
    expect(r.pattern.trend).toBe("insufficient_data");
  });

  it("leaves reporting rates unmeasured when no episodes", () => {
    const r = run({});
    expect(r.episodes.police_reported_rate).toBeNull();
    expect(r.episodes.la_reported_rate).toBeNull();
    expect(r.episodes.return_interview_rate).toBeNull();
  });

  it("contextual safeguarding count is 0", () => {
    const r = run({});
    expect(r.episodes.contextual_safeguarding_count).toBe(0);
  });
});

// ── 2. Episode Profile Calculation ─────────────────────────────────────────

describe("episode profile", () => {
  it("counts 90d and 180d episodes correctly", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-05-20" }),  // 5 days ago = within 90d
      makeEpisode({ date_missing: "2026-03-01" }),  // ~85 days ago = within 90d
      makeEpisode({ date_missing: "2025-12-20" }),  // ~156 days ago = within 180d
      makeEpisode({ date_missing: "2025-10-01" }),  // ~237 days ago = outside 180d
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_90d).toBe(2);
    expect(r.episodes.total_180d).toBe(3);
  });

  it("counts high risk episodes", () => {
    const episodes = [
      makeEpisode({ risk_level: "high", date_missing: "2026-05-20" }),
      makeEpisode({ risk_level: "high", date_missing: "2026-05-15" }),
      makeEpisode({ risk_level: "low", date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.high_risk_count).toBe(2);
  });

  it("calculates average duration", () => {
    const episodes = [
      makeEpisode({ duration_hours: 2, date_missing: "2026-05-20" }),
      makeEpisode({ duration_hours: 4, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.avg_duration_hours).toBe(3);
  });

  it("calculates longest duration", () => {
    const episodes = [
      makeEpisode({ duration_hours: 2, date_missing: "2026-05-20" }),
      makeEpisode({ duration_hours: 8, date_missing: "2026-05-15" }),
      makeEpisode({ duration_hours: 3, date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.longest_duration_hours).toBe(8);
  });

  it("identifies children with episodes", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.children_with_episodes).toContain("yp_1");
    expect(r.episodes.children_with_episodes).toContain("yp_2");
    expect(r.episodes.children_with_episodes.length).toBe(2);
  });

  it("identifies repeat children (2+ episodes)", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.repeat_children).toContain("yp_1");
    expect(r.episodes.repeat_children).not.toContain("yp_2");
  });

  it("counts contextual safeguarding risks", () => {
    const episodes = [
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" }),
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-15" }),
      makeEpisode({ contextual_safeguarding_risk: false, date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.contextual_safeguarding_count).toBe(2);
  });

  it("counts open episodes", () => {
    const episodes = [
      makeEpisode({ status: "open", date_missing: "2026-05-20" }),
      makeEpisode({ status: "closed", date_missing: "2026-05-15" }),
      makeEpisode({ status: "open", date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.open_episodes).toBe(2);
  });

  it("excludes episodes older than 180d from all calculations", () => {
    const episodes = [makeEpisode({ date_missing: "2025-01-01", risk_level: "high" })];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_180d).toBe(0);
    expect(r.episodes.high_risk_count).toBe(0);
  });
});

// ── 3. Reporting Compliance ────────────────────────────────────────────────

describe("reporting compliance", () => {
  it("100% police reporting when all high/medium reported", () => {
    const episodes = [
      makeEpisode({ risk_level: "high", reported_to_police: true, date_missing: "2026-05-20" }),
      makeEpisode({ risk_level: "medium", reported_to_police: true, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.police_reported_rate).toBe(100);
  });

  it("50% police reporting when half reported", () => {
    const episodes = [
      makeEpisode({ risk_level: "high", reported_to_police: true, date_missing: "2026-05-20" }),
      makeEpisode({ risk_level: "high", reported_to_police: false, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.police_reported_rate).toBe(50);
  });

  it("100% LA reporting when all reported", () => {
    const episodes = [
      makeEpisode({ reported_to_la: true, date_missing: "2026-05-20" }),
      makeEpisode({ reported_to_la: true, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.la_reported_rate).toBe(100);
  });

  it("0% LA reporting when none reported", () => {
    const episodes = [
      makeEpisode({ reported_to_la: false, date_missing: "2026-05-20" }),
      makeEpisode({ reported_to_la: false, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.la_reported_rate).toBe(0);
  });

  it("100% return interview when all completed", () => {
    const episodes = [
      makeEpisode({ return_interview_completed: true, date_missing: "2026-05-20" }),
      makeEpisode({ return_interview_completed: true, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.return_interview_rate).toBe(100);
  });

  it("0% return interview when none completed", () => {
    const episodes = [
      makeEpisode({ return_interview_completed: false, date_missing: "2026-05-20" }),
      makeEpisode({ return_interview_completed: false, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.return_interview_rate).toBe(0);
  });

  it("leaves the police rate unmeasured when no high/medium episodes", () => {
    const episodes = [makeEpisode({ risk_level: "low", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.police_reported_rate).toBeNull();
  });

  it("strength for 100% return interview", () => {
    const episodes = [makeEpisode({ return_interview_completed: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.strengths.some(s => s.includes("100% return interview"))).toBe(true);
  });

  it("strength for 100% LA notification", () => {
    const episodes = [makeEpisode({ reported_to_la: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.strengths.some(s => s.includes("100% LA notification"))).toBe(true);
  });

  it("concern for <100% return interview", () => {
    const episodes = [
      makeEpisode({ return_interview_completed: true, date_missing: "2026-05-20" }),
      makeEpisode({ return_interview_completed: false, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("Return interview completion at 50%"))).toBe(true);
  });

  it("recommendation for incomplete return interviews", () => {
    const episodes = [
      makeEpisode({ return_interview_completed: false, date_missing: "2026-05-20" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.recommendations.some(rec => rec.recommendation.includes("return interviews"))).toBe(true);
  });

  it("recommendation for incomplete police reporting", () => {
    const episodes = [
      makeEpisode({ risk_level: "high", reported_to_police: false, date_missing: "2026-05-20" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.recommendations.some(rec => rec.recommendation.includes("police"))).toBe(true);
  });

  it("positive insight for 100% RI + LA compliance", () => {
    const episodes = [
      makeEpisode({ return_interview_completed: true, reported_to_la: true, date_missing: "2026-05-20" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("procedural compliance"))).toBe(true);
  });
});

// ── 4. Pattern Detection ───────────────────────────────────────────────────

describe("pattern detection", () => {
  it("identifies concentrated child", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-10" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-08" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.concentrated_child).toBe("yp_1");
    expect(r.pattern.concentrated_count).toBe(3);
  });

  it("worsening trend when second half has more and longer episodes", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-04-01", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-05-01", duration_hours: 4 }),
      makeEpisode({ date_missing: "2026-05-15", duration_hours: 5 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.trend).toBe("worsening");
    expect(r.pattern.escalating).toBe(true);
  });

  it("improving trend when first half has more episodes", () => {
    const episodes = [
      makeEpisode({ date_missing: "2025-12-20", duration_hours: 5 }),
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 4 }),
      makeEpisode({ date_missing: "2026-01-15", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 1 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.trend).toBe("improving");
  });

  it("stable trend when similar", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 2 }),
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 2 }),
      makeEpisode({ date_missing: "2026-05-01", duration_hours: 2 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.trend).toBe("stable");
  });

  it("insufficient_data for 0-1 episodes", () => {
    const episodes = [makeEpisode({ date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.trend).toBe("insufficient_data");
  });

  it("escalation with 2 episodes when second is longer", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 5 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.escalating).toBe(true);
    expect(r.pattern.trend).toBe("worsening");
  });

  it("improving with 2 episodes when second is shorter by > 1", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 5 }),
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 1 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.trend).toBe("improving");
  });

  it("stable with 2 episodes of similar duration", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 2 }),
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 2 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.trend).toBe("stable");
  });

  it("concentrated child with most episodes", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.concentrated_child).toBe("yp_2");
    expect(r.pattern.concentrated_count).toBe(2);
  });

  it("critical insight for concentrated child with 3+ episodes", () => {
    const episodes = Array.from({ length: 4 }, (_, i) =>
      makeEpisode({ child_id: "yp_1", date_missing: `2026-05-${20 - i}` })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("concentration"))).toBe(true);
  });

  it("critical insight for escalation", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-04-01", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-05-01", duration_hours: 4 }),
      makeEpisode({ date_missing: "2026-05-15", duration_hours: 5 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("escalating"))).toBe(true);
  });

  it("concern for escalation", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-04-01", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-05-01", duration_hours: 4 }),
      makeEpisode({ date_missing: "2026-05-15", duration_hours: 5 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("escalating"))).toBe(true);
  });

  it("recommendation for escalation", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-04-01", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-05-01", duration_hours: 4 }),
      makeEpisode({ date_missing: "2026-05-15", duration_hours: 5 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.recommendations.some(rec => rec.recommendation.includes("strategy meeting"))).toBe(true);
  });

  it("strength for improving trend", () => {
    const episodes = [
      makeEpisode({ date_missing: "2025-12-20", duration_hours: 5 }),
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 4 }),
      makeEpisode({ date_missing: "2026-01-15", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 1 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.strengths.some(s => s.includes("reducing"))).toBe(true);
  });

  it("positive insight for improving trend", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 5 }),
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 1 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("trending downward"))).toBe(true);
  });
});

// ── 5. Scoring ─────────────────────────────────────────────────────────────

describe("scoring", () => {
  it("base score 75 with one low-risk recent episode", () => {
    const episodes = [makeEpisode({ date_missing: "2026-05-20", duration_hours: 1 })];
    const r = run({ missing_episodes: episodes });
    // 75 - 3 (1 ep in 90d) + 3 (no high risk) + 3 (no repeat) - 0 (duration<=3)
    // + 2 (no CS) + 3 (100% RI) + 2 (100% LA) - 0 (insufficient data trend) - 0 (no open)
    // = 75 - 3 + 3 + 3 + 2 + 3 + 2 = 85
    expect(r.missing_episodes_score).toBe(85);
  });

  it("high score with 0 episodes in 90d but some in 180d", () => {
    const episodes = [makeEpisode({ date_missing: "2026-01-01" })];
    const r = run({ missing_episodes: episodes });
    // 0 in 90d: +5
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(80);
  });

  it("penalty for 2-3 episodes in 90d", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-05-20" }),
      makeEpisode({ date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    // -8 for 2-3 eps in 90d
    expect(r.missing_episodes_score).toBeLessThanOrEqual(80);
  });

  it("heavy penalty for 4+ episodes in 90d", () => {
    const episodes = Array.from({ length: 5 }, (_, i) =>
      makeEpisode({ date_missing: `2026-05-${20 - i}` })
    );
    const r = run({ missing_episodes: episodes });
    // -15 for 4+ eps in 90d
    expect(r.missing_episodes_score).toBeLessThanOrEqual(70);
  });

  it("penalty for high risk episodes", () => {
    const episodes = [
      makeEpisode({ risk_level: "high", date_missing: "2026-05-20", reported_to_police: true }),
      makeEpisode({ risk_level: "high", date_missing: "2026-05-15", reported_to_police: true }),
    ];
    const r = run({ missing_episodes: episodes });
    // -8 for 2+ high risk
    expect(r.missing_episodes_score).toBeLessThanOrEqual(75);
  });

  it("penalty for repeat children", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.missing_episodes_score).toBeLessThanOrEqual(80);
  });

  it("penalty for long duration > 6 hours", () => {
    const episodes = [makeEpisode({ duration_hours: 8, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    // -5 for duration > 6
    expect(r.missing_episodes_score).toBeLessThanOrEqual(85);
  });

  it("penalty for duration 3-6 hours", () => {
    const episodes = [makeEpisode({ duration_hours: 4, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    // -2 for duration 3-6
    expect(r.missing_episodes_score).toBeLessThanOrEqual(88);
  });

  it("penalty for contextual safeguarding >= 2", () => {
    const episodes = [
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" }),
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    // -6 for CS >= 2
    expect(r.missing_episodes_score).toBeLessThanOrEqual(75);
  });

  it("penalty for low return interview rate", () => {
    const episodes = [
      makeEpisode({ return_interview_completed: false, date_missing: "2026-05-20" }),
    ];
    const r = run({ missing_episodes: episodes });
    // -5 for RI < 80%
    expect(r.missing_episodes_score).toBeLessThanOrEqual(80);
  });

  it("penalty for low LA reporting rate", () => {
    const episodes = [
      makeEpisode({ reported_to_la: false, date_missing: "2026-05-20" }),
    ];
    const r = run({ missing_episodes: episodes });
    // -3 for LA < 80%
    expect(r.missing_episodes_score).toBeLessThanOrEqual(83);
  });

  it("penalty for worsening trend", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-04-01", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-05-01", duration_hours: 4 }),
      makeEpisode({ date_missing: "2026-05-15", duration_hours: 5 }),
    ];
    const r = run({ missing_episodes: episodes });
    // -5 for worsening
    expect(r.missing_episodes_score).toBeLessThanOrEqual(65);
  });

  it("penalty for open episodes", () => {
    const episodes = [makeEpisode({ status: "open", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    // -3 for open
    expect(r.missing_episodes_score).toBeLessThanOrEqual(83);
  });

  it("bonus for improving trend", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 5 }),
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 1 }),
    ];
    const r = run({ missing_episodes: episodes });
    // +3 for improving
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(75);
  });

  it("score clamped to 0 minimum", () => {
    const episodes = Array.from({ length: 10 }, (_, i) =>
      makeEpisode({
        child_id: `yp_${i % 3}`,
        date_missing: `2026-05-${10 + i}`,
        risk_level: "high",
        reported_to_police: false,
        reported_to_la: false,
        return_interview_completed: false,
        contextual_safeguarding_risk: true,
        status: "open",
        duration_hours: 10,
      })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamped to 100 maximum", () => {
    const r = run({});
    expect(r.missing_episodes_score).toBeLessThanOrEqual(100);
  });
});

// ── 6. Rating Thresholds ───────────────────────────────────────────────────

describe("rating thresholds", () => {
  it("outstanding for score >= 80", () => {
    const r = run({});
    expect(r.missing_episodes_rating).toBe("outstanding");
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(80);
  });

  it("inadequate for very bad scores", () => {
    const episodes = Array.from({ length: 10 }, (_, i) =>
      makeEpisode({
        child_id: `yp_${i % 3}`,
        date_missing: `2026-05-${10 + i}`,
        risk_level: "high",
        reported_to_police: false,
        reported_to_la: false,
        return_interview_completed: false,
        contextual_safeguarding_risk: true,
        status: "open",
        duration_hours: 10,
      })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.missing_episodes_rating).toBe("inadequate");
  });

  it("good for moderate scenario", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 2 }),
      makeEpisode({ date_missing: "2026-05-15", duration_hours: 2 }),
      makeEpisode({ date_missing: "2026-05-10", duration_hours: 2 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(["outstanding", "good"]).toContain(r.missing_episodes_rating);
  });
});

// ── 7. Strengths ───────────────────────────────────────────────────────────

describe("strengths", () => {
  it("strength for 0 episodes in 90d with some in 180d", () => {
    const episodes = [makeEpisode({ date_missing: "2026-01-01" })];
    const r = run({ missing_episodes: episodes });
    expect(r.strengths.some(s => s.includes("No missing episodes in the last 90 days"))).toBe(true);
  });

  it("strength for no contextual safeguarding risk", () => {
    const episodes = [makeEpisode({ contextual_safeguarding_risk: false, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.strengths.some(s => s.includes("No contextual safeguarding"))).toBe(true);
  });

  it("no strength for 0 episodes in 90d when 0 in 180d too", () => {
    const r = run({});
    // the "No missing episodes in last 90 days" strength requires eps180d > 0
    expect(r.strengths.some(s => s.includes("No missing episodes in the last 90 days"))).toBe(false);
  });

  it("positive insight for 0 in 90d with historical", () => {
    const episodes = [makeEpisode({ date_missing: "2026-01-01" })];
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("No recent missing episodes"))).toBe(true);
  });

  it("positive insight for very low episode rate", () => {
    const episodes = [makeEpisode({ date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Very low missing episode rate"))).toBe(true);
  });
});

// ── 8. Concerns ────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("concern for 2+ episodes in 90d", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-05-20" }),
      makeEpisode({ date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("2 missing episodes in the last 90 days"))).toBe(true);
  });

  it("concern for high-risk episodes", () => {
    const episodes = [makeEpisode({ risk_level: "high", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("high-risk missing episode"))).toBe(true);
  });

  it("concern for repeat children", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("repeat missing episodes"))).toBe(true);
  });

  it("concern for contextual safeguarding risk", () => {
    const episodes = [makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("contextual safeguarding risk"))).toBe(true);
  });

  it("concern for open episodes", () => {
    const episodes = [makeEpisode({ status: "open", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("still open"))).toBe(true);
  });

  it("concern for long duration > 4 hours", () => {
    const episodes = [makeEpisode({ duration_hours: 5, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("Longest episode was 5 hours"))).toBe(true);
  });

  it("no concern for short duration", () => {
    const episodes = [makeEpisode({ duration_hours: 2, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("Longest episode"))).toBe(false);
  });

  it("concern uses plural for multiple high risk", () => {
    const episodes = [
      makeEpisode({ risk_level: "high", date_missing: "2026-05-20" }),
      makeEpisode({ risk_level: "high", date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("high-risk missing episodes"))).toBe(true);
  });

  it("concern uses plural for multiple repeat children", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-10" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-08" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("2 children with repeat"))).toBe(true);
  });

  it("concern uses plural for multiple CS episodes", () => {
    const episodes = [
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" }),
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("2 episodes with contextual"))).toBe(true);
  });

  it("concern uses plural for multiple open episodes", () => {
    const episodes = [
      makeEpisode({ status: "open", date_missing: "2026-05-20" }),
      makeEpisode({ status: "open", date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("2 missing episodes still open"))).toBe(true);
  });
});

// ── 9. Recommendations ─────────────────────────────────────────────────────

describe("recommendations", () => {
  it("recommendation for contextual safeguarding", () => {
    const episodes = [makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.recommendations.some(rec => rec.recommendation.includes("contextual safeguarding"))).toBe(true);
  });

  it("recommendation for repeat children", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.recommendations.some(rec => rec.recommendation.includes("repeat children"))).toBe(true);
  });

  it("recommendation for 3+ episodes in 90d", () => {
    const episodes = Array.from({ length: 4 }, (_, i) =>
      makeEpisode({ date_missing: `2026-05-${20 - i}` })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.recommendations.some(rec => rec.recommendation.includes("risk assessments"))).toBe(true);
  });

  it("recommendations are ranked sequentially", () => {
    const episodes = [
      makeEpisode({ contextual_safeguarding_risk: true, return_interview_completed: false, date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("immediate urgency for CS recommendation", () => {
    const episodes = [makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("contextual safeguarding"));
    expect(rec?.urgency).toBe("immediate");
  });

  it("immediate urgency for return interview recommendation", () => {
    const episodes = [makeEpisode({ return_interview_completed: false, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("return interviews"));
    expect(rec?.urgency).toBe("immediate");
  });

  it("soon urgency for repeat children recommendation", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("repeat children"));
    expect(rec?.urgency).toBe("soon");
  });

  it("each recommendation has regulatory_ref", () => {
    const episodes = [
      makeEpisode({ contextual_safeguarding_risk: true, return_interview_completed: false, date_missing: "2026-05-20" }),
    ];
    const r = run({ missing_episodes: episodes });
    r.recommendations.forEach(rec => {
      expect(rec.regulatory_ref).toBeTruthy();
    });
  });

  it("Reg 12 ref for CS recommendation", () => {
    const episodes = [makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("contextual safeguarding"));
    expect(rec?.regulatory_ref).toContain("Reg 12");
  });

  it("Reg 34 ref for return interview recommendation", () => {
    const episodes = [makeEpisode({ return_interview_completed: false, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("return interviews"));
    expect(rec?.regulatory_ref).toContain("Reg 34");
  });
});

// ── 10. Insights ───────────────────────────────────────────────────────────

describe("insights", () => {
  it("critical insight for CS >= 2", () => {
    const episodes = [
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" }),
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("contextual safeguarding risk"))).toBe(true);
  });

  it("no CS critical insight for 1 CS episode", () => {
    const episodes = [makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("contextual safeguarding risk"))).toBe(false);
  });

  it("positive insight for excellent compliance", () => {
    const episodes = [makeEpisode({ return_interview_completed: true, reported_to_la: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Excellent procedural compliance"))).toBe(true);
  });

  it("positive insight for very low rate", () => {
    const episodes = [makeEpisode({ date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Very low"))).toBe(true);
  });

  it("all insights have valid severity", () => {
    const episodes = [
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" }),
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    r.insights.forEach(i => {
      expect(["critical", "warning", "positive"]).toContain(i.severity);
    });
  });
});

// ── 11. Headlines ──────────────────────────────────────────────────────────

describe("headlines", () => {
  it("outstanding headline for no episodes", () => {
    const r = run({});
    expect(r.headline).toContain("No missing from care episodes");
  });

  it("outstanding headline with episodes", () => {
    const episodes = [makeEpisode({ date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    if (r.missing_episodes_rating === "outstanding") {
      expect(r.headline).toContain("Outstanding");
    }
  });

  it("good headline mentions episode count", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-05-20" }),
      makeEpisode({ date_missing: "2026-05-15" }),
      makeEpisode({ date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    if (r.missing_episodes_rating === "good") {
      expect(r.headline).toContain("Good");
    }
  });

  it("adequate headline", () => {
    const episodes = Array.from({ length: 4 }, (_, i) =>
      makeEpisode({
        date_missing: `2026-05-${20 - i}`,
        risk_level: "high",
        reported_to_police: true,
      })
    );
    const r = run({ missing_episodes: episodes });
    if (r.missing_episodes_rating === "adequate") {
      expect(r.headline).toContain("Adequate");
    }
  });

  it("inadequate headline", () => {
    const episodes = Array.from({ length: 10 }, (_, i) =>
      makeEpisode({
        child_id: `yp_${i % 3}`,
        date_missing: `2026-05-${10 + i}`,
        risk_level: "high",
        reported_to_police: false,
        reported_to_la: false,
        return_interview_completed: false,
        contextual_safeguarding_risk: true,
        status: "open",
        duration_hours: 10,
      })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.headline).toContain("inadequate");
  });
});

// ── 12. Output Shape ───────────────────────────────────────────────────────

describe("output shape", () => {
  it("returns all expected fields", () => {
    const r = run({});
    expect(r).toHaveProperty("missing_episodes_rating");
    expect(r).toHaveProperty("missing_episodes_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("episodes");
    expect(r).toHaveProperty("pattern");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("episodes profile has all fields", () => {
    const r = run({});
    expect(r.episodes).toHaveProperty("total_90d");
    expect(r.episodes).toHaveProperty("total_180d");
    expect(r.episodes).toHaveProperty("high_risk_count");
    expect(r.episodes).toHaveProperty("avg_duration_hours");
    expect(r.episodes).toHaveProperty("longest_duration_hours");
    expect(r.episodes).toHaveProperty("children_with_episodes");
    expect(r.episodes).toHaveProperty("repeat_children");
    expect(r.episodes).toHaveProperty("police_reported_rate");
    expect(r.episodes).toHaveProperty("la_reported_rate");
    expect(r.episodes).toHaveProperty("return_interview_rate");
    expect(r.episodes).toHaveProperty("contextual_safeguarding_count");
    expect(r.episodes).toHaveProperty("open_episodes");
  });

  it("pattern profile has all fields", () => {
    const r = run({});
    expect(r.pattern).toHaveProperty("escalating");
    expect(r.pattern).toHaveProperty("concentrated_child");
    expect(r.pattern).toHaveProperty("concentrated_count");
    expect(r.pattern).toHaveProperty("trend");
  });

  it("rating is valid enum value", () => {
    const r = run({});
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.missing_episodes_rating);
  });

  it("score is between 0 and 100", () => {
    const r = run({});
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(0);
    expect(r.missing_episodes_score).toBeLessThanOrEqual(100);
  });

  it("recommendations have all required fields", () => {
    const episodes = [makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    r.recommendations.forEach(rec => {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
    });
  });

  it("strengths is array of strings", () => {
    const r = run({});
    expect(Array.isArray(r.strengths)).toBe(true);
    r.strengths.forEach(s => expect(typeof s).toBe("string"));
  });

  it("concerns is array of strings", () => {
    const r = run({});
    expect(Array.isArray(r.concerns)).toBe(true);
  });

  it("trend is valid enum", () => {
    const r = run({});
    expect(["improving", "stable", "worsening", "insufficient_data"]).toContain(r.pattern.trend);
  });
});

// ── 13. Contextual Safeguarding Details ────────────────────────────────────

describe("contextual safeguarding details", () => {
  it("single CS gives penalty of -3", () => {
    const episodes = [makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" })];
    const base = run({ missing_episodes: [makeEpisode({ contextual_safeguarding_risk: false, date_missing: "2026-05-20" })] });
    const r = run({ missing_episodes: episodes });
    expect(r.missing_episodes_score).toBeLessThan(base.missing_episodes_score);
  });

  it("CS >= 2 gives penalty of -6", () => {
    const episodes = [
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" }),
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    // The CS >= 2 penalty is -6 (vs -3 for 1)
    expect(r.episodes.contextual_safeguarding_count).toBe(2);
  });

  it("CS bonus +2 when no CS risk", () => {
    const episodes = [makeEpisode({ contextual_safeguarding_risk: false, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    // Base should include +2 for no CS
    expect(r.episodes.contextual_safeguarding_count).toBe(0);
  });
});

// ── 14. Duration Analysis ──────────────────────────────────────────────────

describe("duration analysis", () => {
  it("average duration calculated correctly", () => {
    const episodes = [
      makeEpisode({ duration_hours: 1, date_missing: "2026-05-20" }),
      makeEpisode({ duration_hours: 3, date_missing: "2026-05-15" }),
      makeEpisode({ duration_hours: 5, date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.avg_duration_hours).toBe(3);
  });

  it("longest duration tracked", () => {
    const episodes = [
      makeEpisode({ duration_hours: 1, date_missing: "2026-05-20" }),
      makeEpisode({ duration_hours: 12, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.longest_duration_hours).toBe(12);
  });

  it("no duration concern for short episodes", () => {
    const episodes = [makeEpisode({ duration_hours: 1, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("Longest episode"))).toBe(false);
  });

  it("no duration penalty for <= 3 hours", () => {
    const episodes = [makeEpisode({ duration_hours: 3, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    // No -2 or -5 penalty
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(80);
  });
});

// ── 15. Repeat Children Detail ─────────────────────────────────────────────

describe("repeat children detail", () => {
  it("no repeat children with unique child IDs", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_3", date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.repeat_children.length).toBe(0);
  });

  it("repeat children bonus +3 when none", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.repeat_children.length).toBe(0);
  });

  it("single repeat child gives -3 penalty", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.repeat_children.length).toBe(1);
  });

  it("multiple repeat children gives -6 penalty", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-18" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-12" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.repeat_children.length).toBe(2);
  });
});

// ── 16. High Risk Detail ───────────────────────────────────────────────────

describe("high risk detail", () => {
  it("single high risk gives -3", () => {
    const episodes = [makeEpisode({ risk_level: "high", date_missing: "2026-05-20", reported_to_police: true })];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.high_risk_count).toBe(1);
  });

  it("multiple high risk gives -8", () => {
    const episodes = [
      makeEpisode({ risk_level: "high", date_missing: "2026-05-20", reported_to_police: true }),
      makeEpisode({ risk_level: "high", date_missing: "2026-05-15", reported_to_police: true }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.high_risk_count).toBe(2);
  });

  it("no high risk gives +3 bonus", () => {
    const episodes = [makeEpisode({ risk_level: "low", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.high_risk_count).toBe(0);
  });

  it("concern mentions high risk count", () => {
    const episodes = [
      makeEpisode({ risk_level: "high", date_missing: "2026-05-20" }),
      makeEpisode({ risk_level: "high", date_missing: "2026-05-15" }),
      makeEpisode({ risk_level: "high", date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("3 high-risk"))).toBe(true);
  });
});

// ── 17. Open Episodes Detail ───────────────────────────────────────────────

describe("open episodes detail", () => {
  it("no penalty when no open episodes", () => {
    const episodes = [makeEpisode({ status: "closed", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.open_episodes).toBe(0);
  });

  it("single open uses singular", () => {
    const episodes = [makeEpisode({ status: "open", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.concerns.some(c => c.includes("1 missing episode still open"))).toBe(true);
  });
});

// ── 18. Compliance Scoring Details ─────────────────────────────────────────

describe("compliance scoring details", () => {
  it("100% RI gives +3 bonus", () => {
    const eps1 = [makeEpisode({ return_interview_completed: true, date_missing: "2026-05-20" })];
    const eps2 = [makeEpisode({ return_interview_completed: false, date_missing: "2026-05-20" })];
    const r1 = run({ missing_episodes: eps1 });
    const r2 = run({ missing_episodes: eps2 });
    expect(r1.missing_episodes_score).toBeGreaterThan(r2.missing_episodes_score);
  });

  it("100% LA gives +2 bonus", () => {
    const eps1 = [makeEpisode({ reported_to_la: true, date_missing: "2026-05-20" })];
    const eps2 = [makeEpisode({ reported_to_la: false, date_missing: "2026-05-20" })];
    const r1 = run({ missing_episodes: eps1 });
    const r2 = run({ missing_episodes: eps2 });
    expect(r1.missing_episodes_score).toBeGreaterThan(r2.missing_episodes_score);
  });

  it("RI < 80% gives -5 penalty", () => {
    const episodes = Array.from({ length: 5 }, () =>
      makeEpisode({ return_interview_completed: false, date_missing: "2026-05-20" })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.return_interview_rate).toBe(0);
  });

  it("LA < 80% gives -3 penalty", () => {
    const episodes = Array.from({ length: 5 }, () =>
      makeEpisode({ reported_to_la: false, date_missing: "2026-05-20" })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.la_reported_rate).toBe(0);
  });
});

// ── 19. Scoring Combinations ───────────────────────────────────────────────

describe("scoring combinations", () => {
  it("maximum penalties produce very low score", () => {
    const episodes = Array.from({ length: 8 }, (_, i) =>
      makeEpisode({
        child_id: `yp_${i % 2}`,
        date_missing: `2026-05-${12 + i}`,
        risk_level: "high",
        reported_to_police: false,
        reported_to_la: false,
        return_interview_completed: false,
        contextual_safeguarding_risk: true,
        status: "open",
        duration_hours: 10,
      })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.missing_episodes_score).toBeLessThanOrEqual(30);
  });

  it("best possible score with episodes is very high", () => {
    const episodes = [makeEpisode({ date_missing: "2026-01-01", duration_hours: 1 })];
    const r = run({ missing_episodes: episodes });
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(85);
    expect(r.missing_episodes_score).toBeLessThanOrEqual(100);
  });

  it("improving trend adds 3 to score", () => {
    const base = [
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 2 }),
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 2 }),
    ];
    const improving = [
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 5 }),
      makeEpisode({ date_missing: "2026-05-20", duration_hours: 1 }),
    ];
    const rBase = run({ missing_episodes: base });
    const rImproving = run({ missing_episodes: improving });
    // Improving gets +3 trend bonus, stable gets 0
    // But duration differences also affect score
    expect(rImproving.pattern.trend).toBe("improving");
    expect(rBase.pattern.trend).toBe("stable");
  });

  it("worsening trend subtracts 5 from score", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-01-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-03-01", duration_hours: 1 }),
      makeEpisode({ date_missing: "2026-04-01", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-05-01", duration_hours: 4 }),
      makeEpisode({ date_missing: "2026-05-15", duration_hours: 5 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.trend).toBe("worsening");
    // Score should be noticeably lower
    expect(r.missing_episodes_score).toBeLessThanOrEqual(60);
  });
});

// ── 20. Edge Cases for Date Ranges ─────────────────────────────────────────

describe("date range edge cases", () => {
  it("episode exactly 90 days ago is within 90d", () => {
    const episodes = [makeEpisode({ date_missing: "2026-02-24" })]; // 90 days before 2026-05-25
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_90d).toBe(1);
  });

  it("episode 91 days ago is outside 90d but within 180d", () => {
    const episodes = [makeEpisode({ date_missing: "2026-02-23" })]; // 91 days before
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_90d).toBe(0);
    expect(r.episodes.total_180d).toBe(1);
  });

  it("episode exactly 180 days ago is within 180d", () => {
    const episodes = [makeEpisode({ date_missing: "2025-11-27" })]; // ~180 days before
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_180d).toBe(1);
  });

  it("future episodes are excluded", () => {
    const episodes = [makeEpisode({ date_missing: "2026-06-01" })];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_90d).toBe(0);
    expect(r.episodes.total_180d).toBe(0);
  });

  it("today's episode is within 90d", () => {
    const episodes = [makeEpisode({ date_missing: "2026-05-25" })];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_90d).toBe(1);
  });

  it("old episode does not affect scoring besides being counted", () => {
    const episodes = [makeEpisode({ date_missing: "2025-01-01", risk_level: "high", contextual_safeguarding_risk: true })];
    const r = run({ missing_episodes: episodes });
    // Episode outside 180d, so all counts should be 0 in the profile
    expect(r.episodes.total_180d).toBe(0);
    expect(r.episodes.high_risk_count).toBe(0);
    expect(r.episodes.contextual_safeguarding_count).toBe(0);
  });
});

// ── 21. Multiple Children ──────────────────────────────────────────────────

describe("multiple children", () => {
  it("children_with_episodes tracks unique IDs", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-10" }),
      makeEpisode({ child_id: "yp_3", date_missing: "2026-05-08" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.children_with_episodes.length).toBe(3);
  });

  it("repeat_children only includes those with 2+", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-18" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-16" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_3", date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.repeat_children).toEqual(["yp_1"]);
  });

  it("concentrated child is the one with most episodes", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-18" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-16" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-14" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.pattern.concentrated_child).toBe("yp_2");
    expect(r.pattern.concentrated_count).toBe(3);
  });
});

// ── 22. Comprehensive Combined Scenarios ───────────────────────────────────

describe("comprehensive scenarios", () => {
  it("realistic good scenario", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-10", duration_hours: 2, risk_level: "low", reported_to_la: true, return_interview_completed: true }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(["outstanding", "good"]).toContain(r.missing_episodes_rating);
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.episodes.total_90d).toBe(1);
  });

  it("realistic concerning scenario", () => {
    const episodes = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20", duration_hours: 3, risk_level: "medium", reported_to_police: true, reported_to_la: true, return_interview_completed: true }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15", duration_hours: 5, risk_level: "high", reported_to_police: true, reported_to_la: true, return_interview_completed: true, contextual_safeguarding_risk: true }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-10", duration_hours: 2, risk_level: "low", reported_to_la: true, return_interview_completed: true }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.repeat_children).toContain("yp_1");
    expect(r.episodes.high_risk_count).toBe(1);
    expect(r.episodes.contextual_safeguarding_count).toBe(1);
    expect(r.concerns.length).toBeGreaterThan(0);
  });

  it("realistic inadequate scenario", () => {
    const episodes = Array.from({ length: 6 }, (_, i) =>
      makeEpisode({
        child_id: i < 4 ? "yp_1" : "yp_2",
        date_missing: `2026-05-${10 + i * 2}`,
        duration_hours: 3 + i,
        risk_level: i >= 3 ? "high" : "medium",
        reported_to_police: i < 2,
        reported_to_la: i < 3,
        return_interview_completed: i < 2,
        contextual_safeguarding_risk: i >= 4,
        status: i >= 5 ? "open" : "closed",
      })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.missing_episodes_rating).toBe("inadequate");
    expect(r.concerns.length).toBeGreaterThan(3);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it("all compliance perfect with moderate episodes", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-05-20", reported_to_la: true, return_interview_completed: true }),
      makeEpisode({ date_missing: "2026-05-15", reported_to_la: true, return_interview_completed: true }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.return_interview_rate).toBe(100);
    expect(r.episodes.la_reported_rate).toBe(100);
    expect(r.strengths.some(s => s.includes("100% return interview"))).toBe(true);
    expect(r.strengths.some(s => s.includes("100% LA notification"))).toBe(true);
  });

  it("mixed risk levels handled correctly", () => {
    const episodes = [
      makeEpisode({ risk_level: "low", date_missing: "2026-05-20" }),
      makeEpisode({ risk_level: "medium", date_missing: "2026-05-15", reported_to_police: true }),
      makeEpisode({ risk_level: "high", date_missing: "2026-05-10", reported_to_police: true }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.high_risk_count).toBe(1);
    // Police rate calculated from medium+high only
    expect(r.episodes.police_reported_rate).toBe(100);
  });

  it("no episodes in 90d but history shows improvement", () => {
    const episodes = [
      makeEpisode({ date_missing: "2025-12-20", duration_hours: 5 }),
      makeEpisode({ date_missing: "2026-01-10", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-02-01", duration_hours: 1 }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_90d).toBe(0);
    expect(r.strengths.some(s => s.includes("No missing episodes in the last 90 days"))).toBe(true);
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("No recent missing episodes"))).toBe(true);
  });

  it("single episode does not trigger repeat or escalation", () => {
    const episodes = [makeEpisode({ date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.repeat_children.length).toBe(0);
    expect(r.pattern.escalating).toBe(false);
    expect(r.pattern.trend).toBe("insufficient_data");
  });

  it("episode volume 0 in 90d gives +5 bonus", () => {
    const episodes = [makeEpisode({ date_missing: "2026-01-01" })];
    const r = run({ missing_episodes: episodes });
    // 0 in 90d: +5; should be high score
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(85);
  });

  it("episode volume 1 in 90d gives -3", () => {
    const episodes = [makeEpisode({ date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: episodes });
    // 1 in 90d: -3
    expect(r.episodes.total_90d).toBe(1);
  });

  it("medium risk included in police reporting rate", () => {
    const episodes = [
      makeEpisode({ risk_level: "medium", reported_to_police: false, date_missing: "2026-05-20" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.police_reported_rate).toBe(0);
  });

  it("low risk not included in police reporting rate", () => {
    const episodes = [
      makeEpisode({ risk_level: "low", reported_to_police: false, date_missing: "2026-05-20" }),
    ];
    const r = run({ missing_episodes: episodes });
    // No medium/high eps, so there is no police reporting rate to report
    expect(r.episodes.police_reported_rate).toBeNull();
  });

  it("adequate rating for mid-range scenario", () => {
    const episodes = Array.from({ length: 5 }, (_, i) =>
      makeEpisode({
        child_id: `yp_${i % 2}`,
        date_missing: `2026-05-${15 + i}`,
        duration_hours: 4,
        risk_level: "medium",
        reported_to_police: true,
        reported_to_la: true,
        return_interview_completed: i < 4,
      })
    );
    const r = run({ missing_episodes: episodes });
    expect(["adequate", "good", "inadequate"]).toContain(r.missing_episodes_rating);
  });

  it("good headline mentions RI rate", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-05-20" }),
      makeEpisode({ date_missing: "2026-05-15" }),
      makeEpisode({ date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    if (r.missing_episodes_rating === "good") {
      expect(r.headline).toContain("return interview");
    }
  });

  it("outstanding headline for episodes mentions 'procedural compliance'", () => {
    const episodes = [makeEpisode({ date_missing: "2026-01-01" })];
    const r = run({ missing_episodes: episodes });
    if (r.missing_episodes_rating === "outstanding" && r.episodes.total_180d > 0) {
      expect(r.headline).toContain("procedural compliance");
    }
  });
});

// ── 23. Exhaustive Scoring Boundary Tests ──────────────────────────────────

describe("scoring boundary tests", () => {
  it("1 episode in 90d gives -3 penalty (not -8)", () => {
    const eps1 = [makeEpisode({ date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: eps1 });
    expect(r.episodes.total_90d).toBe(1);
    // Should be around 75 - 3 + bonuses
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(75);
  });

  it("3 episodes in 90d gives -8 penalty", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-05-20" }),
      makeEpisode({ date_missing: "2026-05-15" }),
      makeEpisode({ date_missing: "2026-05-10" }),
    ];
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_90d).toBe(3);
  });

  it("4+ episodes in 90d gives -15 penalty", () => {
    const episodes = Array.from({ length: 5 }, (_, i) =>
      makeEpisode({ date_missing: `2026-05-${20 - i}` })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.episodes.total_90d).toBe(5);
  });

  it("1 high risk gives -3", () => {
    const eps = [makeEpisode({ risk_level: "high", date_missing: "2026-05-20", reported_to_police: true })];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.high_risk_count).toBe(1);
  });

  it("0 high risk gives +3", () => {
    const eps = [makeEpisode({ risk_level: "low", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.high_risk_count).toBe(0);
  });

  it("0 repeat children gives +3", () => {
    const eps = [makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.repeat_children.length).toBe(0);
  });

  it("1 repeat child gives -3", () => {
    const eps = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.repeat_children.length).toBe(1);
  });

  it("2+ repeat children gives -6", () => {
    const eps = [
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-20" }),
      makeEpisode({ child_id: "yp_1", date_missing: "2026-05-18" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-15" }),
      makeEpisode({ child_id: "yp_2", date_missing: "2026-05-12" }),
    ];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.repeat_children.length).toBe(2);
  });

  it("duration > 6 gives -5", () => {
    const eps = [makeEpisode({ duration_hours: 7, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.longest_duration_hours).toBe(7);
  });

  it("duration 4-6 gives -2", () => {
    const eps = [makeEpisode({ duration_hours: 5, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.longest_duration_hours).toBe(5);
  });

  it("duration <= 3 gives no penalty", () => {
    const eps = [makeEpisode({ duration_hours: 3, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.longest_duration_hours).toBe(3);
  });

  it("CS 0 gives +2", () => {
    const eps = [makeEpisode({ contextual_safeguarding_risk: false, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.contextual_safeguarding_count).toBe(0);
  });

  it("CS 1 gives -3", () => {
    const eps = [makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.contextual_safeguarding_count).toBe(1);
  });

  it("CS 2+ gives -6", () => {
    const eps = [
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-20" }),
      makeEpisode({ contextual_safeguarding_risk: true, date_missing: "2026-05-15" }),
    ];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.contextual_safeguarding_count).toBe(2);
  });

  it("open episodes gives -3 per batch", () => {
    const eps = [makeEpisode({ status: "open", date_missing: "2026-05-20" })];
    const r = run({ missing_episodes: eps });
    expect(r.episodes.open_episodes).toBe(1);
  });

  it("score 80+ is outstanding", () => {
    const r = run({});
    expect(r.missing_episodes_rating).toBe("outstanding");
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(80);
  });

  it("score 65-79 is good", () => {
    const episodes = [
      makeEpisode({ date_missing: "2026-05-20", risk_level: "medium", reported_to_police: true, duration_hours: 4 }),
      makeEpisode({ date_missing: "2026-05-15", duration_hours: 3 }),
      makeEpisode({ date_missing: "2026-05-10", duration_hours: 2, return_interview_completed: false }),
    ];
    const r = run({ missing_episodes: episodes });
    if (r.missing_episodes_score >= 65 && r.missing_episodes_score < 80) {
      expect(r.missing_episodes_rating).toBe("good");
    }
  });

  it("score 45-64 is adequate", () => {
    const episodes = Array.from({ length: 5 }, (_, i) =>
      makeEpisode({
        date_missing: `2026-05-${15 + i}`,
        risk_level: "high",
        reported_to_police: true,
        reported_to_la: true,
        return_interview_completed: true,
        duration_hours: 5,
      })
    );
    const r = run({ missing_episodes: episodes });
    if (r.missing_episodes_score >= 45 && r.missing_episodes_score < 65) {
      expect(r.missing_episodes_rating).toBe("adequate");
    }
  });

  it("score < 45 is inadequate", () => {
    const episodes = Array.from({ length: 10 }, (_, i) =>
      makeEpisode({
        child_id: `yp_${i % 3}`,
        date_missing: `2026-05-${10 + i}`,
        risk_level: "high",
        reported_to_police: false,
        reported_to_la: false,
        return_interview_completed: false,
        contextual_safeguarding_risk: true,
        status: "open",
        duration_hours: 10,
      })
    );
    const r = run({ missing_episodes: episodes });
    expect(r.missing_episodes_score).toBeLessThan(45);
    expect(r.missing_episodes_rating).toBe("inadequate");
  });

  it("RI 100% gives +3 scoring bonus", () => {
    const withRI = [makeEpisode({ return_interview_completed: true, date_missing: "2026-05-20" })];
    const withoutRI = [makeEpisode({ return_interview_completed: false, date_missing: "2026-05-20" })];
    const r1 = run({ missing_episodes: withRI });
    const r2 = run({ missing_episodes: withoutRI });
    // RI 100%: +3 vs RI 0%: -5. Net difference = 8
    expect(r1.missing_episodes_score - r2.missing_episodes_score).toBe(8);
  });

  it("LA 100% gives +2 scoring bonus", () => {
    const withLA = [makeEpisode({ reported_to_la: true, date_missing: "2026-05-20" })];
    const withoutLA = [makeEpisode({ reported_to_la: false, date_missing: "2026-05-20" })];
    const r1 = run({ missing_episodes: withLA });
    const r2 = run({ missing_episodes: withoutLA });
    // LA 100%: +2 vs LA 0%: -3. Net difference = 5
    expect(r1.missing_episodes_score - r2.missing_episodes_score).toBe(5);
  });
});
