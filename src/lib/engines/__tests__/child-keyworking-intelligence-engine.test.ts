// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Child Keyworking Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildKeyworking,
  type ChildKeyworkingInput,
  type KeyworkSessionInput,
  type KeyworkSessionType,
} from "../child-keyworking-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeSession(overrides: Partial<KeyworkSessionInput> = {}): KeyworkSessionInput {
  return {
    id: `kw_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(5),
    type: "one_to_one",
    duration_minutes: 40,
    topics: ["Wellbeing", "School", "Goals"],
    has_child_voice: true,
    mood_before: 2,
    mood_after: 4,
    actions_count: 3,
    follow_up_completed: true,
    has_follow_up: true,
    staff_id: "staff_darren",
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildKeyworkingInput> = {}): ChildKeyworkingInput {
  return {
    today: TODAY,
    child_id: "yp_alex",
    child_name: "Alex",
    sessions: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Child Keyworking Intelligence Engine", () => {

  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeChildKeyworking(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("child_id");
    expect(r).toHaveProperty("child_name");
    expect(r).toHaveProperty("quality_rating");
    expect(r).toHaveProperty("quality_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("frequency");
    expect(r).toHaveProperty("mood_impact");
    expect(r).toHaveProperty("session_types");
    expect(r).toHaveProperty("quality_metrics");
    expect(r).toHaveProperty("key_worker_consistency");
    expect(r).toHaveProperty("key_worker_ids");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at and child details", () => {
    const r = computeChildKeyworking(baseInput());
    expect(r.generated_at).toBe(TODAY);
    expect(r.child_id).toBe("yp_alex");
    expect(r.child_name).toBe("Alex");
  });

  // ── Quality Rating ────────────────────────────────────────────────────

  it("rates no_sessions when no sessions exist", () => {
    const r = computeChildKeyworking(baseInput());
    expect(r.quality_rating).toBe("no_sessions");
    expect(r.quality_score).toBe(0);
  });

  it("rates good/outstanding with strong engagement", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ date: daysAgo(1), type: "one_to_one" }),
        makeSession({ date: daysAgo(5), type: "therapeutic" }),
        makeSession({ date: daysAgo(10), type: "wellbeing_check" }),
        makeSession({ date: daysAgo(15), type: "goal_setting" }),
        makeSession({ date: daysAgo(20), type: "life_skills" }),
        makeSession({ date: daysAgo(25), type: "informal" }),
      ],
    }));
    expect(["good", "outstanding"]).toContain(r.quality_rating);
    expect(r.quality_score).toBeGreaterThanOrEqual(65);
  });

  it("rates inadequate with poor engagement", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({
          date: daysAgo(60),
          has_child_voice: false,
          mood_before: 3,
          mood_after: 2,
          follow_up_completed: false,
          has_follow_up: true,
          duration_minutes: 10,
        }),
      ],
    }));
    expect(["inadequate", "adequate"]).toContain(r.quality_rating);
  });

  // ── Frequency ─────────────────────────────────────────────────────────

  it("counts sessions in 30d and 90d windows", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ date: daysAgo(5) }),
        makeSession({ date: daysAgo(15) }),
        makeSession({ date: daysAgo(25) }),
        makeSession({ date: daysAgo(60) }),
        makeSession({ date: daysAgo(100) }), // Outside 90d
      ],
    }));
    expect(r.frequency.sessions_30d).toBe(3);
    expect(r.frequency.sessions_90d).toBe(4);
    expect(r.frequency.total_sessions).toBe(5);
  });

  it("calculates average sessions per week", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ date: daysAgo(1) }),
        makeSession({ date: daysAgo(8) }),
        makeSession({ date: daysAgo(15) }),
        makeSession({ date: daysAgo(22) }),
      ],
    }));
    expect(r.frequency.avg_per_week_30d).toBeGreaterThan(0);
  });

  it("detects frequency trend", () => {
    // More sessions in first 45 days than last 45 → increasing
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ date: daysAgo(5) }),
        makeSession({ date: daysAgo(10) }),
        makeSession({ date: daysAgo(15) }),
        makeSession({ date: daysAgo(20) }),
        makeSession({ date: daysAgo(80) }), // Only 1 in older period
      ],
    }));
    expect(r.frequency.trend).toBe("increasing");
  });

  // ── Mood Impact ───────────────────────────────────────────────────────

  it("calculates mood impact metrics", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ mood_before: 2, mood_after: 4 }),  // +2
        makeSession({ mood_before: 3, mood_after: 4 }),  // +1
        makeSession({ mood_before: 4, mood_after: 3 }),  // -1 (negative)
      ],
    }));
    expect(r.mood_impact.avg_improvement).toBeGreaterThan(0);
    expect(r.mood_impact.positive_impact_rate).toBe(67);
    expect(r.mood_impact.negative_impact_rate).toBe(33);
  });

  it("detects 100% positive mood impact", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ mood_before: 2, mood_after: 4 }),
        makeSession({ mood_before: 1, mood_after: 3 }),
      ],
    }));
    expect(r.mood_impact.positive_impact_rate).toBe(100);
    expect(r.mood_impact.negative_impact_rate).toBe(0);
  });

  // ── Session Types ─────────────────────────────────────────────────────

  it("builds session type breakdown", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ type: "one_to_one" }),
        makeSession({ type: "one_to_one" }),
        makeSession({ type: "therapeutic" }),
      ],
    }));
    expect(r.session_types.length).toBe(2);
    const oneToOne = r.session_types.find((t) => t.type === "one_to_one");
    expect(oneToOne!.count).toBe(2);
    expect(oneToOne!.percentage).toBe(67);
  });

  // ── Quality Metrics ───────────────────────────────────────────────────

  it("computes child voice rate", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ has_child_voice: true }),
        makeSession({ has_child_voice: true }),
        makeSession({ has_child_voice: false }),
      ],
    }));
    expect(r.quality_metrics.child_voice_rate).toBe(67);
  });

  it("computes follow-up completion rate", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ has_follow_up: true, follow_up_completed: true }),
        makeSession({ has_follow_up: true, follow_up_completed: false }),
        makeSession({ has_follow_up: false, follow_up_completed: false }),
      ],
    }));
    expect(r.quality_metrics.follow_up_set_rate).toBe(67);
    expect(r.quality_metrics.follow_up_completion_rate).toBe(50);
  });

  it("computes average duration and actions", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ duration_minutes: 30, actions_count: 2 }),
        makeSession({ duration_minutes: 50, actions_count: 4 }),
      ],
    }));
    expect(r.quality_metrics.avg_duration_minutes).toBe(40);
    expect(r.quality_metrics.avg_actions_per_session).toBe(3);
  });

  it("counts unique topic variety", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ topics: ["School", "Health"] }),
        makeSession({ topics: ["School", "Family", "Goals"] }),
      ],
    }));
    expect(r.quality_metrics.topic_variety).toBe(4); // school, health, family, goals
  });

  // ── Key Worker Consistency ────────────────────────────────────────────

  it("detects consistent key worker", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ staff_id: "staff_darren" }),
        makeSession({ staff_id: "staff_darren" }),
        makeSession({ staff_id: "staff_darren" }),
      ],
    }));
    expect(r.key_worker_consistency).toBe(true);
  });

  it("detects inconsistent key workers", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ staff_id: "staff_a" }),
        makeSession({ staff_id: "staff_b" }),
        makeSession({ staff_id: "staff_c" }),
      ],
    }));
    expect(r.key_worker_consistency).toBe(false);
  });

  // ── Scoring ───────────────────────────────────────────────────────────

  it("boosts score for high frequency", () => {
    const highFreq = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ date: daysAgo(2) }),
        makeSession({ date: daysAgo(7) }),
        makeSession({ date: daysAgo(14) }),
        makeSession({ date: daysAgo(21) }),
      ],
    }));
    const lowFreq = computeChildKeyworking(baseInput({
      sessions: [makeSession({ date: daysAgo(80) })],
    }));
    expect(highFreq.quality_score).toBeGreaterThan(lowFreq.quality_score);
  });

  it("boosts score for good mood impact", () => {
    const good = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ mood_before: 1, mood_after: 5 }),
        makeSession({ mood_before: 2, mood_after: 5 }),
      ],
    }));
    const bad = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ mood_before: 4, mood_after: 2 }),
        makeSession({ mood_before: 3, mood_after: 1 }),
      ],
    }));
    expect(good.quality_score).toBeGreaterThan(bad.quality_score);
  });

  it("clamps score to 0-100", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: Array.from({ length: 20 }, (_, i) => makeSession({
        date: daysAgo(i),
        type: (["one_to_one", "therapeutic", "wellbeing_check", "goal_setting", "life_skills", "informal"] as KeyworkSessionType[])[i % 6],
      })),
    }));
    expect(r.quality_score).toBeGreaterThanOrEqual(0);
    expect(r.quality_score).toBeLessThanOrEqual(100);
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  it("generates strengths for good quality", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ date: daysAgo(3) }),
        makeSession({ date: daysAgo(10) }),
        makeSession({ date: daysAgo(17) }),
      ],
    }));
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates strength for positive mood impact", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ mood_before: 2, mood_after: 4 }),
        makeSession({ mood_before: 1, mood_after: 4 }),
        makeSession({ mood_before: 2, mood_after: 5 }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("mood"))).toBe(true);
  });

  it("generates strength for 100% child voice", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ has_child_voice: true }),
        makeSession({ has_child_voice: true }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("voice") || s.includes("Voice"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  it("generates concern for no sessions", () => {
    const r = computeChildKeyworking(baseInput());
    expect(r.concerns.some((c) => c.includes("No keyworking sessions"))).toBe(true);
  });

  it("generates concern for no recent sessions", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [makeSession({ date: daysAgo(60) })],
    }));
    expect(r.concerns.some((c) => c.includes("30 days") || c.includes("no recent"))).toBe(true);
  });

  it("generates concern for low child voice rate", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ has_child_voice: false }),
        makeSession({ has_child_voice: false }),
        makeSession({ has_child_voice: true }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("voice"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────

  it("recommends immediate action for no sessions", () => {
    const r = computeChildKeyworking(baseInput());
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("recommends resuming sessions when none in 30d", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [makeSession({ date: daysAgo(60) })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────

  it("generates critical insight for no sessions", () => {
    const r = computeChildKeyworking(baseInput());
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("generates positive insight for outstanding quality", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [
        makeSession({ date: daysAgo(1), type: "one_to_one" }),
        makeSession({ date: daysAgo(5), type: "therapeutic" }),
        makeSession({ date: daysAgo(10), type: "wellbeing_check" }),
        makeSession({ date: daysAgo(15), type: "goal_setting" }),
        makeSession({ date: daysAgo(20), type: "life_skills" }),
        makeSession({ date: daysAgo(25), type: "informal" }),
      ],
    }));
    if (r.quality_rating === "outstanding") {
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    }
  });

  // ── Headline ──────────────────────────────────────────────────────────

  it("includes quality rating in headline", () => {
    const r = computeChildKeyworking(baseInput());
    expect(r.headline).toContain(r.quality_rating);
  });

  it("mentions mood improvement in headline", () => {
    const r = computeChildKeyworking(baseInput({
      sessions: [makeSession({ mood_before: 2, mood_after: 4 })],
    }));
    expect(r.headline).toContain("mood");
  });
});
