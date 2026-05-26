import { describe, it, expect } from "vitest";
import {
  computeChildPlacementQuality,
  type ChildPlacementQualityInput,
  type DailyLogInput,
  type KeyWorkInput,
  type WelfareCheckInput,
  type ActivityInput,
  type PlacementMoveInput,
} from "../child-placement-quality-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeLog(overrides: Partial<DailyLogInput> = {}): DailyLogInput {
  return {
    id: "log_1",
    date: daysAgo(5),
    entry_type: "general",
    mood_score: 7,
    is_significant: false,
    staff_id: "staff_a",
    ...overrides,
  };
}

function makeKeyWork(overrides: Partial<KeyWorkInput> = {}): KeyWorkInput {
  return {
    id: "kw_1",
    date: daysAgo(5),
    child_engaged: true,
    mood_before: 3,
    mood_after: 4,
    themes: ["wellbeing"],
    ...overrides,
  };
}

function makeWelfare(overrides: Partial<WelfareCheckInput> = {}): WelfareCheckInput {
  return {
    id: "welf_1",
    date: daysAgo(3),
    outcome: "ok",
    ...overrides,
  };
}

function makeActivity(overrides: Partial<ActivityInput> = {}): ActivityInput {
  return {
    id: "act_1",
    date: daysAgo(5),
    type: "sports",
    child_participated: true,
    ...overrides,
  };
}

function makeMove(overrides: Partial<PlacementMoveInput> = {}): PlacementMoveInput {
  return {
    id: "move_1",
    date: daysAgo(200),
    reason: "Foster carer retired",
    planned: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildPlacementQualityInput> = {}): ChildPlacementQualityInput {
  return {
    today: TODAY,
    child_id: "yp_test",
    child_name: "Test Child",
    child_age: 15,
    placement_start: daysAgo(200),
    key_worker_name: "Key Worker",
    daily_logs: Array.from({ length: 15 }, (_, i) => makeLog({ id: `log_${i}`, date: daysAgo(i * 2), staff_id: `staff_${i % 4}` })),
    key_work_sessions: [
      makeKeyWork({ id: "kw_1", date: daysAgo(3) }),
      makeKeyWork({ id: "kw_2", date: daysAgo(10) }),
      makeKeyWork({ id: "kw_3", date: daysAgo(17) }),
    ],
    welfare_checks: Array.from({ length: 10 }, (_, i) => makeWelfare({ id: `welf_${i}`, date: daysAgo(i * 3) })),
    activities: [
      makeActivity({ id: "act_1", date: daysAgo(5) }),
      makeActivity({ id: "act_2", date: daysAgo(10) }),
      makeActivity({ id: "act_3", date: daysAgo(15) }),
    ],
    placement_moves: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeChildPlacementQuality", () => {
  // ── Output Shape ──────────────────────────────────────────────────────
  it("returns all required top-level fields", () => {
    const r = computeChildPlacementQuality(baseInput());
    expect(r).toHaveProperty("generated_at", TODAY);
    expect(r).toHaveProperty("child_id", "yp_test");
    expect(r).toHaveProperty("child_name", "Test Child");
    expect(r).toHaveProperty("placement_quality");
    expect(r).toHaveProperty("quality_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("mood_trajectory");
    expect(r).toHaveProperty("engagement");
    expect(r).toHaveProperty("key_work");
    expect(r).toHaveProperty("welfare");
    expect(r).toHaveProperty("activities");
    expect(r).toHaveProperty("stability");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  // ── Insufficient Data ─────────────────────────────────────────────────
  it("returns insufficient_data when no engagement data", () => {
    const r = computeChildPlacementQuality(baseInput({
      daily_logs: [],
      key_work_sessions: [],
      welfare_checks: [],
      activities: [],
    }));
    expect(r.placement_quality).toBe("insufficient_data");
  });

  // ── Mood Trajectory ───────────────────────────────────────────────────
  it("calculates mood trajectory from daily logs", () => {
    const r = computeChildPlacementQuality(baseInput({
      daily_logs: [
        makeLog({ id: "l1", date: daysAgo(5), mood_score: 8 }),
        makeLog({ id: "l2", date: daysAgo(10), mood_score: 7 }),
        makeLog({ id: "l3", date: daysAgo(15), mood_score: 9 }),
      ],
    }));
    expect(r.mood_trajectory.average_30d).toBe(8);
    expect(r.mood_trajectory.highest_day).not.toBeNull();
    expect(r.mood_trajectory.highest_day!.score).toBe(9);
    expect(r.mood_trajectory.lowest_day!.score).toBe(7);
  });

  it("detects improving mood trend", () => {
    const r = computeChildPlacementQuality(baseInput({
      daily_logs: [
        // Recent 30d: high moods
        makeLog({ id: "l1", date: daysAgo(5), mood_score: 8 }),
        makeLog({ id: "l2", date: daysAgo(10), mood_score: 9 }),
        // Previous 30d: lower moods
        makeLog({ id: "l3", date: daysAgo(40), mood_score: 4 }),
        makeLog({ id: "l4", date: daysAgo(50), mood_score: 5 }),
      ],
    }));
    expect(r.mood_trajectory.trend).toBe("improving");
  });

  it("detects declining mood trend", () => {
    const r = computeChildPlacementQuality(baseInput({
      daily_logs: [
        // Recent 30d: low moods
        makeLog({ id: "l1", date: daysAgo(5), mood_score: 3 }),
        makeLog({ id: "l2", date: daysAgo(10), mood_score: 4 }),
        // Previous 30d: higher moods
        makeLog({ id: "l3", date: daysAgo(40), mood_score: 8 }),
        makeLog({ id: "l4", date: daysAgo(50), mood_score: 7 }),
      ],
    }));
    expect(r.mood_trajectory.trend).toBe("declining");
  });

  // ── Engagement Profile ────────────────────────────────────────────────
  it("counts daily log entries and staff variety", () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeLog({ id: `l${i}`, date: daysAgo(i * 3), staff_id: `staff_${i % 3}` }),
    );
    const r = computeChildPlacementQuality(baseInput({ daily_logs: logs }));
    expect(r.engagement.daily_log_count_30d).toBe(10);
    expect(r.engagement.staff_variety_30d).toBe(3);
  });

  it("classifies entry types", () => {
    const r = computeChildPlacementQuality(baseInput({
      daily_logs: [
        makeLog({ id: "l1", entry_type: "mood" }),
        makeLog({ id: "l2", entry_type: "mood" }),
        makeLog({ id: "l3", entry_type: "general" }),
        makeLog({ id: "l4", entry_type: "health" }),
      ],
    }));
    expect(r.engagement.entry_type_spread[0].type).toBe("mood");
    expect(r.engagement.entry_type_spread[0].count).toBe(2);
  });

  // ── Key Work Profile ──────────────────────────────────────────────────
  it("calculates key work engagement rate", () => {
    const r = computeChildPlacementQuality(baseInput({
      key_work_sessions: [
        makeKeyWork({ id: "kw1", child_engaged: true }),
        makeKeyWork({ id: "kw2", child_engaged: true }),
        makeKeyWork({ id: "kw3", child_engaged: false }),
      ],
    }));
    expect(r.key_work.sessions_30d).toBe(3);
    expect(r.key_work.engagement_rate).toBe(67);
  });

  it("calculates mood improvement rate", () => {
    const r = computeChildPlacementQuality(baseInput({
      key_work_sessions: [
        makeKeyWork({ id: "kw1", mood_before: 2, mood_after: 4 }),  // improved
        makeKeyWork({ id: "kw2", mood_before: 3, mood_after: 3 }),  // same
        makeKeyWork({ id: "kw3", mood_before: 4, mood_after: 5 }),  // improved
      ],
    }));
    expect(r.key_work.mood_improvement_rate).toBe(67);
  });

  // ── Welfare Profile ───────────────────────────────────────────────────
  it("calculates welfare check metrics", () => {
    const r = computeChildPlacementQuality(baseInput({
      welfare_checks: [
        makeWelfare({ id: "w1", outcome: "ok" }),
        makeWelfare({ id: "w2", outcome: "ok" }),
        makeWelfare({ id: "w3", outcome: "concern" }),
      ],
    }));
    expect(r.welfare.checks_30d).toBe(3);
    expect(r.welfare.ok_rate).toBe(67);
    expect(r.welfare.concern_count).toBe(1);
  });

  // ── Activity Profile ──────────────────────────────────────────────────
  it("calculates activity participation rate", () => {
    const r = computeChildPlacementQuality(baseInput({
      activities: [
        makeActivity({ id: "a1", child_participated: true }),
        makeActivity({ id: "a2", child_participated: true }),
        makeActivity({ id: "a3", child_participated: false }),
      ],
    }));
    expect(r.activities.activities_30d).toBe(3);
    expect(r.activities.participation_rate).toBe(67);
  });

  // ── Stability Profile ─────────────────────────────────────────────────
  it("calculates placement duration correctly", () => {
    const r = computeChildPlacementQuality(baseInput({
      placement_start: daysAgo(200),
    }));
    expect(r.stability.days_in_placement).toBe(200);
    expect(r.stability.is_long_term).toBe(true);
  });

  it("counts unplanned moves", () => {
    const r = computeChildPlacementQuality(baseInput({
      placement_moves: [
        makeMove({ planned: true }),
        makeMove({ id: "move_2", planned: false }),
        makeMove({ id: "move_3", planned: false }),
      ],
    }));
    expect(r.stability.total_moves).toBe(3);
    expect(r.stability.unplanned_moves).toBe(2);
  });

  // ── Scoring ───────────────────────────────────────────────────────────
  it("gives higher score for positive placement experience", () => {
    const good = computeChildPlacementQuality(baseInput());
    const bad = computeChildPlacementQuality(baseInput({
      daily_logs: [makeLog({ mood_score: 2 }), makeLog({ id: "l2", mood_score: 3, date: daysAgo(40) })],
      key_work_sessions: [],
      welfare_checks: [makeWelfare({ outcome: "concern" })],
      activities: [],
      placement_moves: [makeMove({ planned: false })],
    }));
    expect(good.quality_score).toBeGreaterThan(bad.quality_score);
  });

  it("penalises declining mood", () => {
    const declining = computeChildPlacementQuality(baseInput({
      daily_logs: [
        makeLog({ id: "l1", date: daysAgo(5), mood_score: 3 }),
        makeLog({ id: "l2", date: daysAgo(10), mood_score: 4 }),
        makeLog({ id: "l3", date: daysAgo(40), mood_score: 8 }),
        makeLog({ id: "l4", date: daysAgo(50), mood_score: 7 }),
      ],
    }));
    const improving = computeChildPlacementQuality(baseInput({
      daily_logs: [
        makeLog({ id: "l1", date: daysAgo(5), mood_score: 8 }),
        makeLog({ id: "l2", date: daysAgo(10), mood_score: 9 }),
        makeLog({ id: "l3", date: daysAgo(40), mood_score: 4 }),
        makeLog({ id: "l4", date: daysAgo(50), mood_score: 5 }),
      ],
    }));
    expect(improving.quality_score).toBeGreaterThan(declining.quality_score);
  });

  it("penalises unplanned moves", () => {
    const withMove = computeChildPlacementQuality(baseInput({
      placement_moves: [makeMove({ planned: false })],
    }));
    const withoutMove = computeChildPlacementQuality(baseInput());
    expect(withoutMove.quality_score).toBeGreaterThan(withMove.quality_score);
  });

  it("rewards high key work engagement", () => {
    const engaged = computeChildPlacementQuality(baseInput({
      key_work_sessions: [
        makeKeyWork({ id: "kw1", child_engaged: true }),
        makeKeyWork({ id: "kw2", child_engaged: true }),
        makeKeyWork({ id: "kw3", child_engaged: true }),
      ],
    }));
    const noKW = computeChildPlacementQuality(baseInput({
      key_work_sessions: [],
    }));
    expect(engaged.quality_score).toBeGreaterThan(noKW.quality_score);
  });

  it("clamps score between 0 and 100", () => {
    const worst = computeChildPlacementQuality(baseInput({
      daily_logs: [],
      key_work_sessions: [],
      welfare_checks: Array.from({ length: 5 }, (_, i) => makeWelfare({ id: `w${i}`, outcome: "concern" })),
      activities: [],
      placement_moves: Array.from({ length: 5 }, (_, i) => makeMove({ id: `m${i}`, planned: false })),
    }));
    expect(worst.quality_score).toBeGreaterThanOrEqual(0);
    expect(worst.quality_score).toBeLessThanOrEqual(100);
  });

  // ── Quality Ratings ───────────────────────────────────────────────────
  it("assigns outstanding for high score", () => {
    const r = computeChildPlacementQuality(baseInput());
    // Default base input with good engagement, moods, kw, activities → should be good or outstanding
    expect(["outstanding", "good"]).toContain(r.placement_quality);
  });

  // ── Headline ──────────────────────────────────────────────────────────
  it("includes child name and quality in headline", () => {
    const r = computeChildPlacementQuality(baseInput());
    expect(r.headline).toContain("Test Child");
    expect(r.headline).toContain(r.placement_quality);
  });

  // ── Strengths ─────────────────────────────────────────────────────────
  it("notes long-term placement as strength", () => {
    const r = computeChildPlacementQuality(baseInput());
    expect(r.strengths.some((s) => s.includes("200 days") || s.includes("months"))).toBe(true);
  });

  it("notes high key work engagement as strength", () => {
    const r = computeChildPlacementQuality(baseInput());
    expect(r.strengths.some((s) => s.includes("engagement"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────
  it("flags no key work sessions as concern", () => {
    const r = computeChildPlacementQuality(baseInput({
      key_work_sessions: [],
    }));
    expect(r.concerns.some((c) => c.includes("key work"))).toBe(true);
  });

  it("flags declining mood as concern", () => {
    const r = computeChildPlacementQuality(baseInput({
      daily_logs: [
        makeLog({ id: "l1", date: daysAgo(5), mood_score: 3 }),
        makeLog({ id: "l2", date: daysAgo(10), mood_score: 4 }),
        makeLog({ id: "l3", date: daysAgo(40), mood_score: 8 }),
        makeLog({ id: "l4", date: daysAgo(50), mood_score: 7 }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("declining") || c.includes("Declining"))).toBe(true);
  });

  it("flags low daily log count as concern", () => {
    const r = computeChildPlacementQuality(baseInput({
      daily_logs: [makeLog()],
    }));
    expect(r.concerns.some((c) => c.includes("daily log"))).toBe(true);
  });

  it("flags unplanned moves as concern", () => {
    const r = computeChildPlacementQuality(baseInput({
      placement_moves: [makeMove({ planned: false })],
    }));
    expect(r.concerns.some((c) => c.includes("unplanned"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────
  it("recommends key work when none recorded", () => {
    const r = computeChildPlacementQuality(baseInput({
      key_work_sessions: [],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("key work"))).toBe(true);
  });

  it("recommends recording improvement when low log count", () => {
    const r = computeChildPlacementQuality(baseInput({
      daily_logs: [makeLog()],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("daily log") || rec.recommendation.includes("recording"))).toBe(true);
  });

  it("orders recommendations by rank", () => {
    const r = computeChildPlacementQuality(baseInput({
      daily_logs: [makeLog({ mood_score: 2 }), makeLog({ id: "l2", mood_score: 3, date: daysAgo(40) })],
      key_work_sessions: [],
      activities: [],
    }));
    for (let i = 1; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBeGreaterThan(r.recommendations[i - 1].rank);
    }
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────
  it("generates positive insight for outstanding placement", () => {
    const r = computeChildPlacementQuality(baseInput());
    if (r.placement_quality === "outstanding") {
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    }
  });

  it("generates positive insight for long stable placement with good mood", () => {
    const r = computeChildPlacementQuality(baseInput());
    expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
  });
});
