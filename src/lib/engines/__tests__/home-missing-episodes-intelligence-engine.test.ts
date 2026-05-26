// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MISSING EPISODES INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeMissingEpisodes,
  type HomeMissingEpisodesInput,
  type MissingEpisodeInput,
} from "../home-missing-episodes-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEpisode(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  return {
    id: "mfc_1",
    child_id: "yp_alex",
    date_missing: "2026-05-20",
    duration_hours: 2,
    risk_level: "medium",
    reported_to_police: false,
    reported_to_la: true,
    return_interview_completed: true,
    contextual_safeguarding_risk: false,
    status: "closed",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeMissingEpisodesInput> = {}): HomeMissingEpisodesInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    child_ids: ["yp_alex", "yp_jordan", "yp_casey"],
    missing_episodes: [
      makeEpisode({ id: "m1", date_missing: "2026-05-20", duration_hours: 2, risk_level: "medium" }),
      makeEpisode({ id: "m2", date_missing: "2026-04-10", duration_hours: 1.5, risk_level: "low" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Missing Episodes Intelligence Engine", () => {

  // ── Structure ─────────────────────────────────────────────────────────────

  it("returns a well-shaped result", () => {
    const r = computeHomeMissingEpisodes(baseInput());
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

  it("assigns a valid rating", () => {
    const r = computeHomeMissingEpisodes(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.missing_episodes_rating);
  });

  it("scores between 0 and 100", () => {
    const r = computeHomeMissingEpisodes(baseInput());
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(0);
    expect(r.missing_episodes_score).toBeLessThanOrEqual(100);
  });

  it("episode profile has correct shape", () => {
    const r = computeHomeMissingEpisodes(baseInput());
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

  it("pattern profile has correct shape", () => {
    const r = computeHomeMissingEpisodes(baseInput());
    expect(r.pattern).toHaveProperty("escalating");
    expect(r.pattern).toHaveProperty("concentrated_child");
    expect(r.pattern).toHaveProperty("concentrated_count");
    expect(r.pattern).toHaveProperty("trend");
  });

  // ── Zero Episodes (Safety engine: outstanding) ────────────────────────────

  it("returns outstanding with score 90 when no episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({ missing_episodes: [] }));
    expect(r.missing_episodes_rating).toBe("outstanding");
    expect(r.missing_episodes_score).toBe(90);
  });

  it("returns empty profiles when no episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({ missing_episodes: [] }));
    expect(r.episodes.total_90d).toBe(0);
    expect(r.episodes.total_180d).toBe(0);
    expect(r.episodes.high_risk_count).toBe(0);
    expect(r.episodes.children_with_episodes).toEqual([]);
    expect(r.episodes.repeat_children).toEqual([]);
    expect(r.episodes.open_episodes).toBe(0);
  });

  it("returns insufficient_data trend when no episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({ missing_episodes: [] }));
    expect(r.pattern.trend).toBe("insufficient_data");
    expect(r.pattern.escalating).toBe(false);
    expect(r.pattern.concentrated_child).toBeNull();
  });

  it("includes positive headline when no episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({ missing_episodes: [] }));
    expect(r.headline.toLowerCase()).toContain("no missing");
  });

  it("includes strength about safety when no episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({ missing_episodes: [] }));
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("includes positive insight when no episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({ missing_episodes: [] }));
    expect(r.insights.length).toBeGreaterThan(0);
    expect(r.insights[0].severity).toBe("positive");
  });

  // ── Episode Counting ──────────────────────────────────────────────────────

  it("correctly counts 90-day episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20" }),   // 6 days ago — in 90d
        makeEpisode({ id: "m2", date_missing: "2026-03-01" }),   // ~86 days — in 90d
        makeEpisode({ id: "m3", date_missing: "2026-01-01" }),   // ~145 days — NOT in 90d but in 180d
      ],
    }));
    expect(r.episodes.total_90d).toBe(2);
    expect(r.episodes.total_180d).toBe(3);
  });

  it("excludes episodes older than 180 days", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20" }),   // in 180d
        makeEpisode({ id: "m2", date_missing: "2025-10-01" }),   // >180d ago
      ],
    }));
    expect(r.episodes.total_180d).toBe(1);
  });

  it("counts high-risk episodes correctly", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "high" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", risk_level: "low" }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", risk_level: "high" }),
      ],
    }));
    expect(r.episodes.high_risk_count).toBe(2);
  });

  // ── Duration Metrics ──────────────────────────────────────────────────────

  it("calculates average duration correctly", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", duration_hours: 2 }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", duration_hours: 4 }),
      ],
    }));
    expect(r.episodes.avg_duration_hours).toBe(3);
  });

  it("identifies longest duration correctly", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", duration_hours: 1.5 }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", duration_hours: 6.5 }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", duration_hours: 3 }),
      ],
    }));
    expect(r.episodes.longest_duration_hours).toBe(6.5);
  });

  // ── Children Tracking ─────────────────────────────────────────────────────

  it("identifies children with episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.episodes.children_with_episodes).toContain("yp_alex");
    expect(r.episodes.children_with_episodes).toContain("yp_jordan");
    expect(r.episodes.children_with_episodes.length).toBe(2);
  });

  it("identifies repeat children (2+ episodes)", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_alex" }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.episodes.repeat_children).toContain("yp_alex");
    expect(r.episodes.repeat_children).not.toContain("yp_jordan");
  });

  it("does not flag single-episode children as repeat", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.episodes.repeat_children).toEqual([]);
  });

  // ── Reporting Compliance ──────────────────────────────────────────────────

  it("calculates 100% police report rate when all high/medium reported", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "high", reported_to_police: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", risk_level: "medium", reported_to_police: true }),
      ],
    }));
    expect(r.episodes.police_reported_rate).toBe(100);
  });

  it("calculates reduced police report rate for non-compliance", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "high", reported_to_police: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", risk_level: "high", reported_to_police: false }),
      ],
    }));
    expect(r.episodes.police_reported_rate).toBe(50);
  });

  it("calculates 100% LA notification rate", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", reported_to_la: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", reported_to_la: true }),
      ],
    }));
    expect(r.episodes.la_reported_rate).toBe(100);
  });

  it("detects reduced LA notification rate", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", reported_to_la: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", reported_to_la: false }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", reported_to_la: false }),
      ],
    }));
    expect(r.episodes.la_reported_rate).toBe(33);
  });

  it("calculates 100% return interview rate", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", return_interview_completed: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", return_interview_completed: true }),
      ],
    }));
    expect(r.episodes.return_interview_rate).toBe(100);
  });

  it("detects incomplete return interviews", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", return_interview_completed: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", return_interview_completed: false }),
      ],
    }));
    expect(r.episodes.return_interview_rate).toBe(50);
  });

  // ── Contextual Safeguarding ───────────────────────────────────────────────

  it("counts contextual safeguarding episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", contextual_safeguarding_risk: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", contextual_safeguarding_risk: true }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", contextual_safeguarding_risk: false }),
      ],
    }));
    expect(r.episodes.contextual_safeguarding_count).toBe(2);
  });

  // ── Open Episodes ─────────────────────────────────────────────────────────

  it("counts open episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", status: "open" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", status: "closed" }),
      ],
    }));
    expect(r.episodes.open_episodes).toBe(1);
  });

  // ── Pattern Detection ─────────────────────────────────────────────────────

  it("detects concentrated child pattern", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_alex" }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", child_id: "yp_alex" }),
        makeEpisode({ id: "m4", date_missing: "2026-03-01", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.pattern.concentrated_child).toBe("yp_alex");
    expect(r.pattern.concentrated_count).toBe(3);
  });

  it("detects worsening trend with escalating duration and frequency", () => {
    // 5 episodes: mid=2, firstHalf=[m1,m2](2 eps), secondHalf=[m3,m4,m5](3 eps, longer avg)
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 1 }),
        makeEpisode({ id: "m2", date_missing: "2026-02-10", duration_hours: 1.5 }),
        makeEpisode({ id: "m3", date_missing: "2026-03-20", duration_hours: 3 }),
        makeEpisode({ id: "m4", date_missing: "2026-04-10", duration_hours: 4 }),
        makeEpisode({ id: "m5", date_missing: "2026-05-05", duration_hours: 5 }),
      ],
    }));
    // secondHalf.length(3) > firstHalf.length(2) AND avgDurSecond(4) > avgDurFirst(1.25) → worsening
    expect(r.pattern.trend).toBe("worsening");
    expect(r.pattern.escalating).toBe(true);
  });

  it("detects improving trend when episodes reduce", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-10", duration_hours: 5 }),
        makeEpisode({ id: "m2", date_missing: "2026-01-25", duration_hours: 4 }),
        makeEpisode({ id: "m3", date_missing: "2026-02-10", duration_hours: 3 }),
        makeEpisode({ id: "m4", date_missing: "2026-05-20", duration_hours: 1 }),
      ],
    }));
    // sorted: m1 jan10, m2 jan25, m3 feb10, m4 may20 → first half [m1,m2] second half [m3,m4]
    // avgDurFirst = (5+4)/2=4.5, avgDurSecond = (3+1)/2=2
    // secondHalf.length (2) === firstHalf.length (2) → NOT more
    // avgDurSecond (2) < avgDurFirst(4.5) - 0.5 → improving
    expect(r.pattern.trend).toBe("improving");
    expect(r.pattern.escalating).toBe(false);
  });

  it("detects stable trend when no significant change", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 2 }),
        makeEpisode({ id: "m2", date_missing: "2026-03-15", duration_hours: 2 }),
        makeEpisode({ id: "m3", date_missing: "2026-05-15", duration_hours: 2 }),
      ],
    }));
    expect(r.pattern.trend).toBe("stable");
    expect(r.pattern.escalating).toBe(false);
  });

  it("returns insufficient_data trend with fewer than 2 episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20" }),
      ],
    }));
    expect(r.pattern.trend).toBe("insufficient_data");
  });

  it("handles 2-episode worsening via duration increase > 1h", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-03-01", duration_hours: 1 }),
        makeEpisode({ id: "m2", date_missing: "2026-05-20", duration_hours: 4 }),
      ],
    }));
    // last duration(4) > first duration(1) + 1 → worsening
    expect(r.pattern.trend).toBe("worsening");
    expect(r.pattern.escalating).toBe(true);
  });

  it("handles 2-episode improving via duration decrease > 1h", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-03-01", duration_hours: 5 }),
        makeEpisode({ id: "m2", date_missing: "2026-05-20", duration_hours: 1 }),
      ],
    }));
    // last(1) < first(5) - 1 → improving
    expect(r.pattern.trend).toBe("improving");
  });

  it("handles 2-episode stable when duration within threshold", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-03-01", duration_hours: 2 }),
        makeEpisode({ id: "m2", date_missing: "2026-05-20", duration_hours: 2.5 }),
      ],
    }));
    // last(2.5) NOT > first(2) + 1 AND last(2.5) NOT < first(2) - 1 → stable
    expect(r.pattern.trend).toBe("stable");
  });

  // ── Scoring: Safety Engine Base ───────────────────────────────────────────

  it("starts from base 75 for safety engine", () => {
    // Single low-risk, fully compliant episode — should score close to base
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "low", reported_to_la: true, return_interview_completed: true, contextual_safeguarding_risk: false }),
      ],
    }));
    // base 75, -3 (1 ep in 90d), +3 (0 high risk), +3 (no repeat), +2 (no CS), +3 (RI 100), +2 (LA 100)
    // = 85 → outstanding
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(80);
    expect(r.missing_episodes_rating).toBe("outstanding");
  });

  // ── Rating Boundaries ─────────────────────────────────────────────────────

  it("rates outstanding (score >= 80)", () => {
    // Minimal episodes, full compliance
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-04-10", risk_level: "low", return_interview_completed: true, reported_to_la: true, contextual_safeguarding_risk: false }),
      ],
    }));
    expect(r.missing_episodes_rating).toBe("outstanding");
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(80);
  });

  it("rates good (65 <= score < 80)", () => {
    // A few episodes, mostly compliant but one missed return interview
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "medium", reported_to_police: true, child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", risk_level: "low", child_id: "yp_jordan" }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", risk_level: "low", child_id: "yp_casey", return_interview_completed: false }),
      ],
    }));
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(65);
    expect(r.missing_episodes_score).toBeLessThan(80);
    expect(r.missing_episodes_rating).toBe("good");
  });

  it("rates adequate (45 <= score < 65)", () => {
    // Multiple episodes, repeat child, some non-compliance
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "high", reported_to_police: true, child_id: "yp_alex", return_interview_completed: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", risk_level: "medium", reported_to_police: false, child_id: "yp_alex", return_interview_completed: true }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", risk_level: "high", reported_to_police: true, child_id: "yp_alex", return_interview_completed: false }),
        makeEpisode({ id: "m4", date_missing: "2026-02-10", risk_level: "medium", reported_to_police: false, child_id: "yp_jordan", duration_hours: 5, return_interview_completed: false }),
      ],
    }));
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(45);
    expect(r.missing_episodes_score).toBeLessThan(65);
    expect(r.missing_episodes_rating).toBe("adequate");
  });

  it("rates inadequate (score < 45)", () => {
    // Many high-risk episodes, repeat children, poor compliance, escalating, CS risk, open
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "high", child_id: "yp_alex", reported_to_police: false, reported_to_la: false, return_interview_completed: false, contextual_safeguarding_risk: true, status: "open", duration_hours: 8 }),
        makeEpisode({ id: "m2", date_missing: "2026-05-10", risk_level: "high", child_id: "yp_alex", reported_to_police: false, reported_to_la: false, return_interview_completed: false, contextual_safeguarding_risk: true, duration_hours: 6 }),
        makeEpisode({ id: "m3", date_missing: "2026-04-20", risk_level: "high", child_id: "yp_alex", reported_to_police: false, reported_to_la: false, return_interview_completed: false, contextual_safeguarding_risk: true, duration_hours: 4 }),
        makeEpisode({ id: "m4", date_missing: "2026-04-05", risk_level: "high", child_id: "yp_jordan", reported_to_police: false, reported_to_la: false, return_interview_completed: false, contextual_safeguarding_risk: true, duration_hours: 3 }),
        makeEpisode({ id: "m5", date_missing: "2026-03-15", risk_level: "medium", child_id: "yp_jordan", reported_to_police: false, reported_to_la: false, return_interview_completed: false, duration_hours: 2 }),
      ],
    }));
    expect(r.missing_episodes_score).toBeLessThan(45);
    expect(r.missing_episodes_rating).toBe("inadequate");
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────────

  it("penalises high-risk episodes", () => {
    const noHigh = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "low" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", risk_level: "low" }),
      ],
    }));
    const withHigh = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "high" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", risk_level: "high" }),
      ],
    }));
    expect(withHigh.missing_episodes_score).toBeLessThan(noHigh.missing_episodes_score);
  });

  it("penalises repeat children", () => {
    const noRepeat = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_jordan" }),
      ],
    }));
    const withRepeat = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_alex" }),
      ],
    }));
    expect(withRepeat.missing_episodes_score).toBeLessThan(noRepeat.missing_episodes_score);
  });

  it("penalises long duration episodes", () => {
    const short = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", duration_hours: 1 }),
      ],
    }));
    const long = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", duration_hours: 8 }),
      ],
    }));
    expect(long.missing_episodes_score).toBeLessThan(short.missing_episodes_score);
  });

  it("penalises contextual safeguarding risk", () => {
    const noCS = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", contextual_safeguarding_risk: false }),
      ],
    }));
    const withCS = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", contextual_safeguarding_risk: true }),
      ],
    }));
    expect(withCS.missing_episodes_score).toBeLessThan(noCS.missing_episodes_score);
  });

  it("penalises incomplete return interviews", () => {
    const complete = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", return_interview_completed: true }),
      ],
    }));
    const incomplete = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", return_interview_completed: false }),
      ],
    }));
    expect(incomplete.missing_episodes_score).toBeLessThan(complete.missing_episodes_score);
  });

  it("penalises open episodes", () => {
    const closed = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", status: "closed" }),
      ],
    }));
    const open = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", status: "open" }),
      ],
    }));
    expect(open.missing_episodes_score).toBeLessThan(closed.missing_episodes_score);
  });

  it("rewards improving trend", () => {
    const stable = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 2 }),
        makeEpisode({ id: "m2", date_missing: "2026-03-15", duration_hours: 2 }),
        makeEpisode({ id: "m3", date_missing: "2026-05-15", duration_hours: 2 }),
      ],
    }));
    const improving = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 5 }),
        makeEpisode({ id: "m2", date_missing: "2026-03-15", duration_hours: 3 }),
        makeEpisode({ id: "m3", date_missing: "2026-05-15", duration_hours: 1 }),
      ],
    }));
    expect(improving.missing_episodes_score).toBeGreaterThan(stable.missing_episodes_score);
  });

  it("penalises worsening trend", () => {
    const stable = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 2 }),
        makeEpisode({ id: "m2", date_missing: "2026-03-15", duration_hours: 2 }),
        makeEpisode({ id: "m3", date_missing: "2026-05-15", duration_hours: 2 }),
      ],
    }));
    const worsening = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 1 }),
        makeEpisode({ id: "m2", date_missing: "2026-03-20", duration_hours: 3 }),
        makeEpisode({ id: "m3", date_missing: "2026-04-10", duration_hours: 4 }),
        makeEpisode({ id: "m4", date_missing: "2026-05-05", duration_hours: 5 }),
      ],
    }));
    expect(worsening.missing_episodes_score).toBeLessThan(stable.missing_episodes_score);
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  it("notes strength when no episodes in last 90 days but some in 180d", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-10" }), // ~136 days ago, in 180d but NOT 90d
      ],
    }));
    expect(r.strengths.some(s => s.toLowerCase().includes("no missing episodes in the last 90 days"))).toBe(true);
  });

  it("notes strength for 100% return interview completion", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", return_interview_completed: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", return_interview_completed: true }),
      ],
    }));
    expect(r.strengths.some(s => s.toLowerCase().includes("return interview"))).toBe(true);
  });

  it("notes strength for 100% LA notification rate", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", reported_to_la: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", reported_to_la: true }),
      ],
    }));
    expect(r.strengths.some(s => s.toLowerCase().includes("la notification"))).toBe(true);
  });

  it("notes strength for improving trend", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 5 }),
        makeEpisode({ id: "m2", date_missing: "2026-03-15", duration_hours: 3 }),
        makeEpisode({ id: "m3", date_missing: "2026-05-15", duration_hours: 1 }),
      ],
    }));
    expect(r.strengths.some(s => s.toLowerCase().includes("reducing"))).toBe(true);
  });

  it("notes strength for no contextual safeguarding risk", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", contextual_safeguarding_risk: false }),
      ],
    }));
    expect(r.strengths.some(s => s.toLowerCase().includes("contextual safeguarding"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  it("raises concern for multiple 90d episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("missing episodes in the last 90 days"))).toBe(true);
  });

  it("raises concern for high-risk episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "high" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("high-risk"))).toBe(true);
  });

  it("raises concern for repeat children", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_alex" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("repeat"))).toBe(true);
  });

  it("raises concern for CS risk", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", contextual_safeguarding_risk: true }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("contextual safeguarding"))).toBe(true);
  });

  it("raises concern for incomplete return interviews", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", return_interview_completed: false }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("return interview"))).toBe(true);
  });

  it("raises concern for escalating pattern", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 1 }),
        makeEpisode({ id: "m2", date_missing: "2026-02-10", duration_hours: 1.5 }),
        makeEpisode({ id: "m3", date_missing: "2026-03-20", duration_hours: 3 }),
        makeEpisode({ id: "m4", date_missing: "2026-04-10", duration_hours: 4 }),
        makeEpisode({ id: "m5", date_missing: "2026-05-05", duration_hours: 5 }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("escalat"))).toBe(true);
  });

  it("raises concern for open episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", status: "open" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("open"))).toBe(true);
  });

  it("raises concern for long duration episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", duration_hours: 6 }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("hours"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  it("recommends CS strategy for contextual safeguarding risk", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", contextual_safeguarding_risk: true }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.regulatory_ref === "Reg 12")).toBe(true);
  });

  it("recommends completing return interviews", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", return_interview_completed: false }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("return interview"))).toBe(true);
  });

  it("recommends targeted strategy for repeat children", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_alex" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("repeat"))).toBe(true);
  });

  it("recommends strategy meeting for escalating pattern", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 1 }),
        makeEpisode({ id: "m2", date_missing: "2026-02-10", duration_hours: 1.5 }),
        makeEpisode({ id: "m3", date_missing: "2026-03-20", duration_hours: 3 }),
        makeEpisode({ id: "m4", date_missing: "2026-04-10", duration_hours: 4 }),
        makeEpisode({ id: "m5", date_missing: "2026-05-05", duration_hours: 5 }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("strategy meeting"))).toBe(true);
  });

  it("recommendations have ranked order", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", contextual_safeguarding_risk: true, return_interview_completed: false, child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_alex" }),
      ],
    }));
    const ranks = r.recommendations.map(rec => rec.rank);
    for (let i = 0; i < ranks.length - 1; i++) {
      expect(ranks[i]).toBeLessThan(ranks[i + 1]);
    }
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  it("generates critical insight for CS risk >= 2", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", contextual_safeguarding_risk: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", contextual_safeguarding_risk: true }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.toLowerCase().includes("contextual safeguarding"))).toBe(true);
  });

  it("generates critical insight for escalating pattern", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-15", duration_hours: 1 }),
        makeEpisode({ id: "m2", date_missing: "2026-02-10", duration_hours: 1.5 }),
        makeEpisode({ id: "m3", date_missing: "2026-03-20", duration_hours: 3 }),
        makeEpisode({ id: "m4", date_missing: "2026-04-10", duration_hours: 4 }),
        makeEpisode({ id: "m5", date_missing: "2026-05-05", duration_hours: 5 }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.toLowerCase().includes("escalat"))).toBe(true);
  });

  it("generates positive insight when no recent episodes despite history", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-10" }), // ~136 days, in 180d not 90d
      ],
    }));
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("no recent"))).toBe(true);
  });

  it("generates positive insight for full procedural compliance", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", return_interview_completed: true, reported_to_la: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", return_interview_completed: true, reported_to_la: true }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("compliance"))).toBe(true);
  });

  it("generates positive insight for low episode rate", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      total_children: 4,
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20" }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("low missing episode rate"))).toBe(true);
  });

  it("generates critical insight for concentrated child with 3+ episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_alex" }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", child_id: "yp_alex" }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("3 missing episodes"))).toBe(true);
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  it("outstanding headline mentions excellent or outstanding", () => {
    const r = computeHomeMissingEpisodes(baseInput({ missing_episodes: [] }));
    const hl = r.headline.toLowerCase();
    expect(hl.includes("outstanding") || hl.includes("excellent")).toBe(true);
  });

  it("good headline mentions good", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "medium", reported_to_police: true, child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", risk_level: "low", child_id: "yp_jordan" }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", risk_level: "low", child_id: "yp_casey", return_interview_completed: false }),
      ],
    }));
    expect(r.headline.toLowerCase()).toContain("good");
  });

  it("adequate headline mentions adequate", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "high", reported_to_police: true, child_id: "yp_alex", return_interview_completed: true }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", risk_level: "medium", reported_to_police: false, child_id: "yp_alex", return_interview_completed: true }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", risk_level: "high", reported_to_police: true, child_id: "yp_alex", return_interview_completed: false }),
        makeEpisode({ id: "m4", date_missing: "2026-02-10", risk_level: "medium", reported_to_police: false, child_id: "yp_jordan", duration_hours: 5, return_interview_completed: false }),
      ],
    }));
    expect(r.headline.toLowerCase()).toContain("adequate");
  });

  it("inadequate headline mentions inadequate", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "high", child_id: "yp_alex", reported_to_police: false, reported_to_la: false, return_interview_completed: false, contextual_safeguarding_risk: true, status: "open", duration_hours: 8 }),
        makeEpisode({ id: "m2", date_missing: "2026-05-10", risk_level: "high", child_id: "yp_alex", reported_to_police: false, reported_to_la: false, return_interview_completed: false, contextual_safeguarding_risk: true, duration_hours: 6 }),
        makeEpisode({ id: "m3", date_missing: "2026-04-20", risk_level: "high", child_id: "yp_alex", reported_to_police: false, reported_to_la: false, return_interview_completed: false, contextual_safeguarding_risk: true, duration_hours: 4 }),
        makeEpisode({ id: "m4", date_missing: "2026-04-05", risk_level: "high", child_id: "yp_jordan", reported_to_police: false, reported_to_la: false, return_interview_completed: false, contextual_safeguarding_risk: true, duration_hours: 3 }),
        makeEpisode({ id: "m5", date_missing: "2026-03-15", risk_level: "medium", child_id: "yp_jordan", reported_to_police: false, reported_to_la: false, return_interview_completed: false, duration_hours: 2 }),
      ],
    }));
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });

  // ── Score Clamping ────────────────────────────────────────────────────────

  it("clamps score to minimum 0", () => {
    // Extreme worst case
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: Array.from({ length: 10 }, (_, i) => makeEpisode({
        id: `m${i}`,
        date_missing: `2026-05-${String(15 + (i % 10)).padStart(2, "0")}`,
        risk_level: "high",
        child_id: i < 5 ? "yp_alex" : "yp_jordan",
        reported_to_police: false,
        reported_to_la: false,
        return_interview_completed: false,
        contextual_safeguarding_risk: true,
        status: "open",
        duration_hours: 8 + i,
      })),
    }));
    expect(r.missing_episodes_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to maximum 100", () => {
    const r = computeHomeMissingEpisodes(baseInput({ missing_episodes: [] }));
    expect(r.missing_episodes_score).toBeLessThanOrEqual(100);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("handles future-dated episodes gracefully (excluded from windows)", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-06-15" }), // future — daysBetween < 0
      ],
    }));
    expect(r.episodes.total_90d).toBe(0);
    expect(r.episodes.total_180d).toBe(0);
  });

  it("handles single child with multiple episodes correctly", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      child_ids: ["yp_alex"],
      total_children: 1,
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_alex" }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", child_id: "yp_alex" }),
      ],
    }));
    expect(r.episodes.children_with_episodes).toEqual(["yp_alex"]);
    expect(r.episodes.repeat_children).toEqual(["yp_alex"]);
    expect(r.pattern.concentrated_child).toBe("yp_alex");
    expect(r.pattern.concentrated_count).toBe(3);
  });

  it("handles all episodes outside 90d but inside 180d", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-01-10" }),
        makeEpisode({ id: "m2", date_missing: "2025-12-15" }),
      ],
    }));
    expect(r.episodes.total_90d).toBe(0);
    expect(r.episodes.total_180d).toBe(2);
    // No 90d episodes → +5 bonus
    expect(r.strengths.some(s => s.toLowerCase().includes("no missing episodes in the last 90 days"))).toBe(true);
  });

  it("correctly handles 100% police rate when no medium/high episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", risk_level: "low", reported_to_police: false }),
      ],
    }));
    // Low-risk not counted in police rate → defaults to 100%
    expect(r.episodes.police_reported_rate).toBe(100);
  });

  it("correctly identifies multiple repeat children", () => {
    const r = computeHomeMissingEpisodes(baseInput({
      missing_episodes: [
        makeEpisode({ id: "m1", date_missing: "2026-05-20", child_id: "yp_alex" }),
        makeEpisode({ id: "m2", date_missing: "2026-04-10", child_id: "yp_alex" }),
        makeEpisode({ id: "m3", date_missing: "2026-03-15", child_id: "yp_jordan" }),
        makeEpisode({ id: "m4", date_missing: "2026-02-10", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.episodes.repeat_children).toContain("yp_alex");
    expect(r.episodes.repeat_children).toContain("yp_jordan");
    expect(r.episodes.repeat_children.length).toBe(2);
  });

  it("no concerns or recommendations when 0 episodes", () => {
    const r = computeHomeMissingEpisodes(baseInput({ missing_episodes: [] }));
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
  });
});
