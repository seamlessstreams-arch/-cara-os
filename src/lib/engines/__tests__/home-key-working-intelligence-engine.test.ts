// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME KEY WORKING INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeKeyWorking,
  type HomeKeyWorkingInput,
  type KeyWorkingSessionInput,
} from "../home-key-working-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<KeyWorkingSessionInput> = {}): KeyWorkingSessionInput {
  return {
    id: "kw_1",
    child_id: "yp_alex",
    staff_id: "staff_darren",
    date: "2026-05-20",
    type: "one_to_one",
    duration_minutes: 35,
    has_child_voice: true,
    actions_agreed_count: 3,
    mood_before: 3,
    mood_after: 4,
    has_follow_up: true,
    follow_up_completed: true,
    linked_goals_count: 1,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeKeyWorkingInput> = {}): HomeKeyWorkingInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    child_ids: ["yp_alex", "yp_jordan", "yp_casey"],
    sessions: [
      // Alex — 3 sessions in 30d
      makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20", type: "one_to_one", mood_before: 3, mood_after: 4 }),
      makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-13", type: "therapeutic", mood_before: 2, mood_after: 4 }),
      makeSession({ id: "kw_3", child_id: "yp_alex", date: "2026-05-06", type: "goal_setting", mood_before: 3, mood_after: 5 }),
      // Jordan — 2 sessions
      makeSession({ id: "kw_4", child_id: "yp_jordan", date: "2026-05-18", type: "wellbeing_check", mood_before: 2, mood_after: 3, staff_id: "staff_anna" }),
      makeSession({ id: "kw_5", child_id: "yp_jordan", date: "2026-05-10", type: "review", mood_before: 2, mood_after: 3, staff_id: "staff_anna" }),
      // Casey — 2 sessions
      makeSession({ id: "kw_6", child_id: "yp_casey", date: "2026-05-15", type: "life_skills", mood_before: 3, mood_after: 5, staff_id: "staff_chervelle" }),
      makeSession({ id: "kw_7", child_id: "yp_casey", date: "2026-05-08", type: "informal", mood_before: 3, mood_after: 4, staff_id: "staff_chervelle" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Home Key Working Intelligence Engine", () => {

  // ── Insufficient Data ────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when no sessions", () => {
      const r = computeHomeKeyWorking({ today: "2026-05-26", total_children: 3, child_ids: ["yp_alex"], sessions: [] });
      expect(r.key_working_rating).toBe("insufficient_data");
      expect(r.key_working_score).toBe(0);
    });

    it("returns insufficient_data with only 1 session", () => {
      const r = computeHomeKeyWorking({ today: "2026-05-26", total_children: 3, child_ids: ["yp_alex"], sessions: [makeSession()] });
      expect(r.key_working_rating).toBe("insufficient_data");
    });

    it("provides recommendation when insufficient data", () => {
      const r = computeHomeKeyWorking({ today: "2026-05-26", total_children: 3, child_ids: [], sessions: [] });
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("returns empty profiles when insufficient data", () => {
      const r = computeHomeKeyWorking({ today: "2026-05-26", total_children: 3, child_ids: [], sessions: [] });
      expect(r.sessions.total_90d).toBe(0);
      expect(r.mood.sessions_with_mood).toBe(0);
      expect(r.coverage.children_with_sessions_30d).toBe(0);
    });
  });

  // ── Rating Thresholds ────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("awards outstanding for high-quality comprehensive sessions", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.key_working_score).toBeGreaterThanOrEqual(80);
      expect(r.key_working_rating).toBe("outstanding");
    });

    it("awards good for decent sessions with minor gaps", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20", mood_before: 3, mood_after: 4, actions_agreed_count: 1, linked_goals_count: 0, has_child_voice: true }),
        makeSession({ id: "kw_2", child_id: "yp_jordan", date: "2026-05-18", mood_before: 2, mood_after: 3, actions_agreed_count: 1, linked_goals_count: 0, has_child_voice: false }),
        makeSession({ id: "kw_3", child_id: "yp_casey", date: "2026-05-15", mood_before: 3, mood_after: 3, actions_agreed_count: 1, linked_goals_count: 0, has_child_voice: true }),
        makeSession({ id: "kw_4", child_id: "yp_alex", date: "2026-05-10", mood_before: 3, mood_after: 3, actions_agreed_count: 1, linked_goals_count: 0, has_child_voice: false }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.key_working_score).toBeGreaterThanOrEqual(65);
      expect(r.key_working_score).toBeLessThan(80);
      expect(r.key_working_rating).toBe("good");
    });

    it("awards adequate for poor coverage and quality", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20", has_child_voice: true, mood_before: 3, mood_after: 4, actions_agreed_count: 2, linked_goals_count: 0, has_follow_up: true, follow_up_completed: false, duration_minutes: 25 }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-10", has_child_voice: false, mood_before: 3, mood_after: 3, actions_agreed_count: 1, linked_goals_count: 0, has_follow_up: true, follow_up_completed: false, duration_minutes: 20 }),
        makeSession({ id: "kw_3", child_id: "yp_jordan", date: "2026-05-15", has_child_voice: false, mood_before: 3, mood_after: 3, actions_agreed_count: 1, linked_goals_count: 0, has_follow_up: false, follow_up_completed: false, duration_minutes: 20 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.key_working_score).toBeGreaterThanOrEqual(45);
      expect(r.key_working_score).toBeLessThan(65);
      expect(r.key_working_rating).toBe("adequate");
    });

    it("awards inadequate for extremely poor practice", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-03-01", has_child_voice: false, mood_before: 3, mood_after: 2, actions_agreed_count: 0, linked_goals_count: 0, duration_minutes: 10, has_follow_up: true, follow_up_completed: false }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-03-15", has_child_voice: false, mood_before: 3, mood_after: 2, actions_agreed_count: 0, linked_goals_count: 0, duration_minutes: 10, has_follow_up: true, follow_up_completed: false }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.key_working_score).toBeLessThan(45);
      expect(r.key_working_rating).toBe("inadequate");
    });
  });

  // ── Sessions Profile ─────────────────────────────────────────────────

  describe("sessions profile", () => {
    it("counts sessions within 90 days", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20" }),
        makeSession({ id: "kw_2", date: "2026-02-01" }),  // >90d
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.sessions.total_90d).toBe(1);
    });

    it("counts sessions within 30 days", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20" }),
        makeSession({ id: "kw_2", date: "2026-04-20" }),  // >30d
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.sessions.total_30d).toBe(1);
    });

    it("calculates average sessions per child in 30d", () => {
      const r = computeHomeKeyWorking(baseInput());
      // 7 sessions / 3 children = 2.3
      expect(r.sessions.avg_per_child_30d).toBe(2.3);
    });

    it("calculates average duration", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", duration_minutes: 30 }),
        makeSession({ id: "kw_2", date: "2026-05-13", duration_minutes: 40 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.sessions.avg_duration_minutes).toBe(35);
    });

    it("builds types distribution sorted by count", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.sessions.types_distribution.length).toBeGreaterThanOrEqual(1);
      // Sorted descending
      for (let i = 1; i < r.sessions.types_distribution.length; i++) {
        expect(r.sessions.types_distribution[i - 1].count).toBeGreaterThanOrEqual(r.sessions.types_distribution[i].count);
      }
    });

    it("calculates child voice rate", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", has_child_voice: true }),
        makeSession({ id: "kw_2", date: "2026-05-13", has_child_voice: false }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.sessions.child_voice_rate).toBe(50);
    });

    it("calculates actions per session", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", actions_agreed_count: 3 }),
        makeSession({ id: "kw_2", date: "2026-05-13", actions_agreed_count: 1 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.sessions.actions_per_session).toBe(2);
    });

    it("calculates follow-up rate from sessions with follow-ups", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", has_follow_up: true, follow_up_completed: true }),
        makeSession({ id: "kw_2", date: "2026-05-13", has_follow_up: true, follow_up_completed: false }),
        makeSession({ id: "kw_3", date: "2026-05-06", has_follow_up: false, follow_up_completed: false }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      // 1 of 2 with follow-ups = 50%
      expect(r.sessions.follow_up_rate).toBe(50);
    });

    it("leaves follow-up rate unmeasured when no follow-ups set", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", has_follow_up: false }),
        makeSession({ id: "kw_2", date: "2026-05-13", has_follow_up: false }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.sessions.follow_up_rate).toBeNull();
    });

    it("calculates goal-linked rate", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", linked_goals_count: 2 }),
        makeSession({ id: "kw_2", date: "2026-05-13", linked_goals_count: 0 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.sessions.goal_linked_rate).toBe(50);
    });
  });

  // ── Mood Profile ─────────────────────────────────────────────────────

  describe("mood profile", () => {
    it("calculates mood statistics from sessions with mood data", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.mood.sessions_with_mood).toBe(7);
      expect(r.mood.avg_mood_before).toBeGreaterThan(0);
      expect(r.mood.avg_mood_after).toBeGreaterThan(r.mood.avg_mood_before);
      expect(r.mood.avg_improvement).toBeGreaterThan(0);
    });

    it("calculates positive shift rate", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", mood_before: 2, mood_after: 4 }),  // improved
        makeSession({ id: "kw_2", date: "2026-05-13", mood_before: 3, mood_after: 3 }),  // same
        makeSession({ id: "kw_3", date: "2026-05-06", mood_before: 4, mood_after: 3 }),  // worse
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      // 1 of 3 improved
      expect(r.mood.positive_shift_rate).toBe(33);
    });

    it("handles sessions without mood data", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", mood_before: null, mood_after: null }),
        makeSession({ id: "kw_2", date: "2026-05-13", mood_before: null, mood_after: null }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.mood.sessions_with_mood).toBe(0);
      expect(r.mood.avg_mood_before).toBe(0);
      expect(r.mood.positive_shift_rate).toBe(0);
    });
  });

  // ── Coverage Profile ─────────────────────────────────────────────────

  describe("coverage profile", () => {
    it("identifies children with sessions in 30d", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.coverage.children_with_sessions_30d).toBe(3);
      expect(r.coverage.children_without_sessions_30d).toHaveLength(0);
    });

    it("identifies children without sessions in 30d", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20" }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-13" }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.coverage.children_without_sessions_30d).toContain("yp_jordan");
      expect(r.coverage.children_without_sessions_30d).toContain("yp_casey");
    });

    it("calculates average gap days between sessions", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20" }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-13" }),
        makeSession({ id: "kw_3", child_id: "yp_alex", date: "2026-05-06" }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      // gaps: 7, 7 → avg 7
      expect(r.coverage.avg_gap_days).toBe(7);
    });

    it("returns null gap days for single session per child", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20" }),
        makeSession({ id: "kw_2", child_id: "yp_jordan", date: "2026-05-15" }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.coverage.avg_gap_days).toBeNull();
    });

    it("identifies most and least session children", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.coverage.most_sessions_child).toBe("yp_alex");
      // Jordan and Casey both have 2, but one will be least
      expect(["yp_jordan", "yp_casey"]).toContain(r.coverage.least_sessions_child);
    });
  });

  // ── Trend ────────────────────────────────────────────────────────────

  describe("trend", () => {
    it("detects improving trend when later sessions have better mood shifts", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", mood_before: 2, mood_after: 5 }),
        makeSession({ id: "kw_2", date: "2026-05-15", mood_before: 2, mood_after: 5 }),
        makeSession({ id: "kw_3", date: "2026-05-01", mood_before: 3, mood_after: 3 }),
        makeSession({ id: "kw_4", date: "2026-04-25", mood_before: 3, mood_after: 3 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.trend).toBe("improving");
    });

    it("detects declining trend when later sessions have worse mood shifts", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", mood_before: 3, mood_after: 3 }),
        makeSession({ id: "kw_2", date: "2026-05-15", mood_before: 4, mood_after: 3 }),
        makeSession({ id: "kw_3", date: "2026-05-01", mood_before: 2, mood_after: 5 }),
        makeSession({ id: "kw_4", date: "2026-04-25", mood_before: 2, mood_after: 5 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.trend).toBe("declining");
    });

    it("detects stable trend", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", mood_before: 3, mood_after: 4 }),
        makeSession({ id: "kw_2", date: "2026-05-15", mood_before: 3, mood_after: 4 }),
        makeSession({ id: "kw_3", date: "2026-05-01", mood_before: 3, mood_after: 4 }),
        makeSession({ id: "kw_4", date: "2026-04-25", mood_before: 3, mood_after: 4 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.trend).toBe("stable");
    });

    it("returns insufficient_data with fewer than 4 sessions", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20" }),
        makeSession({ id: "kw_2", date: "2026-05-15" }),
        makeSession({ id: "kw_3", date: "2026-05-10" }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.trend).toBe("insufficient_data");
    });
  });

  // ── Scoring ──────────────────────────────────────────────────────────

  describe("scoring", () => {
    it("rewards high frequency sessions", () => {
      const high = baseInput();
      const low = baseInput({
        sessions: [
          makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-04-01" }),
          makeSession({ id: "kw_2", child_id: "yp_jordan", date: "2026-04-15" }),
        ],
      });
      expect(computeHomeKeyWorking(high).key_working_score).toBeGreaterThan(computeHomeKeyWorking(low).key_working_score);
    });

    it("rewards full coverage", () => {
      const full = baseInput();
      const partial = baseInput({
        sessions: [
          makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20" }),
          makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-13" }),
        ],
      });
      expect(computeHomeKeyWorking(full).key_working_score).toBeGreaterThan(computeHomeKeyWorking(partial).key_working_score);
    });

    it("rewards child voice recording", () => {
      const good = baseInput();
      const poor = baseInput({
        sessions: baseInput().sessions.map(s => ({ ...s, has_child_voice: false })),
      });
      expect(computeHomeKeyWorking(good).key_working_score).toBeGreaterThan(computeHomeKeyWorking(poor).key_working_score);
    });

    it("rewards action follow-through", () => {
      const good = baseInput();
      const poor = baseInput({
        sessions: baseInput().sessions.map(s => ({ ...s, follow_up_completed: false })),
      });
      expect(computeHomeKeyWorking(good).key_working_score).toBeGreaterThan(computeHomeKeyWorking(poor).key_working_score);
    });

    it("rewards mood improvement", () => {
      const good = baseInput();
      const poor = baseInput({
        sessions: baseInput().sessions.map(s => ({ ...s, mood_before: 3, mood_after: 2 })),
      });
      expect(computeHomeKeyWorking(good).key_working_score).toBeGreaterThan(computeHomeKeyWorking(poor).key_working_score);
    });

    it("clamps score to 0-100", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.key_working_score).toBeGreaterThanOrEqual(0);
      expect(r.key_working_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("identifies child voice as a strength when high", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.strengths.some(s => s.includes("child's own voice"))).toBe(true);
    });

    it("identifies full coverage as a strength", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.strengths.some(s => s.includes("All children"))).toBe(true);
    });

    it("identifies mood improvement as a strength", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.strengths.some(s => s.includes("mood"))).toBe(true);
    });

    it("identifies follow-up completion as a strength", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.strengths.some(s => s.includes("follow-up"))).toBe(true);
    });

    it("identifies type diversity as a strength", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.strengths.some(s => s.includes("diverse"))).toBe(true);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags children without sessions", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20" }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-13" }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.concerns.some(c => c.includes("no key working sessions"))).toBe(true);
    });

    it("flags low child voice rate", () => {
      const sessions = baseInput().sessions.map(s => ({ ...s, has_child_voice: false }));
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.concerns.some(c => c.includes("child's own voice"))).toBe(true);
    });

    it("flags poor follow-up completion", () => {
      const sessions = baseInput().sessions.map(s => ({ ...s, follow_up_completed: false }));
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.concerns.some(c => c.includes("follow-up"))).toBe(true);
    });

    it("flags declining trend", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", mood_before: 3, mood_after: 2 }),
        makeSession({ id: "kw_2", date: "2026-05-15", mood_before: 4, mood_after: 2 }),
        makeSession({ id: "kw_3", date: "2026-05-01", mood_before: 2, mood_after: 5 }),
        makeSession({ id: "kw_4", date: "2026-04-25", mood_before: 2, mood_after: 5 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.concerns.some(c => c.includes("declining"))).toBe(true);
    });

    it("flags short session duration", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", duration_minutes: 10 }),
        makeSession({ id: "kw_2", date: "2026-05-13", duration_minutes: 12 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.concerns.some(c => c.includes("minutes"))).toBe(true);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends sessions for uncovered children", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20" }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-13" }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("all children"))).toBe(true);
    });

    it("recommends child voice recording when low", () => {
      const sessions = baseInput().sessions.map(s => ({ ...s, has_child_voice: false }));
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("child's own words"))).toBe(true);
    });

    it("recommends goal linkage when low", () => {
      const sessions = baseInput().sessions.map(s => ({ ...s, linked_goals_count: 0 }));
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("care plan goals"))).toBe(true);
    });

    it("includes regulatory references", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20", has_child_voice: false, linked_goals_count: 0 }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-13", has_child_voice: false, linked_goals_count: 0 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.recommendations.every(rec => rec.regulatory_ref.length > 0)).toBe(true);
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates critical insight for uncovered children", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20" }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-13" }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Ofsted"))).toBe(true);
    });

    it("generates positive insight for therapeutic impact", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("therapeutic impact"))).toBe(true);
    });

    it("generates positive insight for outstanding practice", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Outstanding key working"))).toBe(true);
    });

    it("generates warning insight for short sessions", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", duration_minutes: 10 }),
        makeSession({ id: "kw_2", date: "2026-05-13", duration_minutes: 12 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("15 minutes"))).toBe(true);
    });
  });

  // ── Headlines ────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("provides outstanding headline", () => {
      const r = computeHomeKeyWorking(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("provides inadequate headline", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-03-01", has_child_voice: false, mood_before: 3, mood_after: 2, actions_agreed_count: 0, linked_goals_count: 0, duration_minutes: 10, has_follow_up: true, follow_up_completed: false }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-03-15", has_child_voice: false, mood_before: 3, mood_after: 2, actions_agreed_count: 0, linked_goals_count: 0, duration_minutes: 10, has_follow_up: true, follow_up_completed: false }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Edge Cases ───────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles sessions outside 90d window", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-01-01" }),
        makeSession({ id: "kw_2", date: "2026-01-15" }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.sessions.total_90d).toBe(0);
    });

    it("handles zero total children", () => {
      const r = computeHomeKeyWorking(baseInput({ total_children: 0, child_ids: [] }));
      expect(r.sessions.avg_per_child_30d).toBe(0);
    });

    it("handles all sessions for one child", () => {
      const sessions = [
        makeSession({ id: "kw_1", child_id: "yp_alex", date: "2026-05-20" }),
        makeSession({ id: "kw_2", child_id: "yp_alex", date: "2026-05-13" }),
        makeSession({ id: "kw_3", child_id: "yp_alex", date: "2026-05-06" }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.coverage.children_with_sessions_30d).toBe(1);
      expect(r.coverage.children_without_sessions_30d).toContain("yp_jordan");
    });

    it("handles sessions with null mood values", () => {
      const sessions = [
        makeSession({ id: "kw_1", date: "2026-05-20", mood_before: null, mood_after: null }),
        makeSession({ id: "kw_2", date: "2026-05-13", mood_before: 3, mood_after: 4 }),
      ];
      const r = computeHomeKeyWorking(baseInput({ sessions }));
      expect(r.mood.sessions_with_mood).toBe(1);
    });
  });
});
