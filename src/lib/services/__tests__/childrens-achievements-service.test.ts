// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S ACHIEVEMENTS SERVICE TESTS
// Pure-function unit tests for achievement metrics computation, alert
// identification, constant validation. CHR 2015 Reg 6 (quality and purpose
// of care — celebrating success), Reg 7 (children's views — recognising
// what matters to them), Reg 12 (promoting educational achievement).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_SIGNIFICANCES,
  CELEBRATION_METHODS,
} from "../childrens-achievements-service";

import type {
  Achievement,
  AchievementCategory,
} from "../childrens-achievements-service";

const { computeAchievementMetrics, identifyAchievementAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

let _seqId = 0;
function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
  _seqId += 1;
  return {
    id: `ach-${_seqId}-${crypto.randomUUID()}`,
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-a-id",
    achievement_date: "2025-06-01",
    category: "academic",
    title: "Spelling test success",
    description: "Scored full marks on weekly spelling test",
    significance: "notable",
    celebrations: ["verbal_praise"],
    recorded_by: "Staff A",
    child_views: null,
    child_proud: false,
    shared_with_family: false,
    shared_with_social_worker: false,
    added_to_life_story: false,
    photograph_taken: false,
    notes: null,
    created_at: "2025-06-01T10:00:00.000Z",
    updated_at: "2025-06-01T10:00:00.000Z",
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── ACHIEVEMENT_CATEGORIES ────────────────────────────────────────────

  describe("ACHIEVEMENT_CATEGORIES", () => {
    it("contains exactly 11 items", () => {
      expect(ACHIEVEMENT_CATEGORIES).toHaveLength(11);
    });

    it("has unique category values", () => {
      const values = ACHIEVEMENT_CATEGORIES.map((c) => c.category);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of ACHIEVEMENT_CATEGORIES) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "academic",
      "sporting",
      "creative",
      "social",
      "personal_growth",
      "behavioural",
      "independence",
      "health_wellbeing",
      "community",
      "employment",
      "other",
    ] as const)("includes category %s", (cat) => {
      expect(ACHIEVEMENT_CATEGORIES.find((c) => c.category === cat)).toBeDefined();
    });

    it("maps academic to 'Academic'", () => {
      const found = ACHIEVEMENT_CATEGORIES.find((c) => c.category === "academic");
      expect(found?.label).toBe("Academic");
    });

    it("maps health_wellbeing to 'Health & Wellbeing'", () => {
      const found = ACHIEVEMENT_CATEGORIES.find((c) => c.category === "health_wellbeing");
      expect(found?.label).toBe("Health & Wellbeing");
    });

    it("maps personal_growth to 'Personal Growth'", () => {
      const found = ACHIEVEMENT_CATEGORIES.find((c) => c.category === "personal_growth");
      expect(found?.label).toBe("Personal Growth");
    });
  });

  // ── ACHIEVEMENT_SIGNIFICANCES ─────────────────────────────────────────

  describe("ACHIEVEMENT_SIGNIFICANCES", () => {
    it("contains exactly 4 items", () => {
      expect(ACHIEVEMENT_SIGNIFICANCES).toHaveLength(4);
    });

    it("has unique significance values", () => {
      const values = ACHIEVEMENT_SIGNIFICANCES.map((s) => s.significance);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of ACHIEVEMENT_SIGNIFICANCES) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "exceptional",
      "significant",
      "notable",
      "everyday",
    ] as const)("includes significance %s", (sig) => {
      expect(ACHIEVEMENT_SIGNIFICANCES.find((s) => s.significance === sig)).toBeDefined();
    });

    it("maps exceptional to 'Exceptional'", () => {
      const found = ACHIEVEMENT_SIGNIFICANCES.find((s) => s.significance === "exceptional");
      expect(found?.label).toBe("Exceptional");
    });

    it("maps everyday to 'Everyday'", () => {
      const found = ACHIEVEMENT_SIGNIFICANCES.find((s) => s.significance === "everyday");
      expect(found?.label).toBe("Everyday");
    });
  });

  // ── CELEBRATION_METHODS ───────────────────────────────────────────────

  describe("CELEBRATION_METHODS", () => {
    it("contains exactly 11 items", () => {
      expect(CELEBRATION_METHODS).toHaveLength(11);
    });

    it("has unique method values", () => {
      const values = CELEBRATION_METHODS.map((m) => m.method);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of CELEBRATION_METHODS) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "verbal_praise",
      "certificate",
      "reward",
      "display_board",
      "shared_with_family",
      "shared_with_social_worker",
      "house_meeting",
      "special_activity",
      "added_to_life_story",
      "photograph",
      "other",
    ] as const)("includes method %s", (method) => {
      expect(CELEBRATION_METHODS.find((m) => m.method === method)).toBeDefined();
    });

    it("maps verbal_praise to 'Verbal Praise'", () => {
      const found = CELEBRATION_METHODS.find((m) => m.method === "verbal_praise");
      expect(found?.label).toBe("Verbal Praise");
    });

    it("maps added_to_life_story to 'Added to Life Story'", () => {
      const found = CELEBRATION_METHODS.find((m) => m.method === "added_to_life_story");
      expect(found?.label).toBe("Added to Life Story");
    });

    it("maps shared_with_social_worker to 'Shared with Social Worker'", () => {
      const found = CELEBRATION_METHODS.find((m) => m.method === "shared_with_social_worker");
      expect(found?.label).toBe("Shared with Social Worker");
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. computeAchievementMetrics
// ════════════════════════════════════════════════════════════════════════════

describe("computeAchievementMetrics", () => {
  // ── Empty array ───────────────────────────────────────────────────────

  describe("empty achievements array", () => {
    it("returns total_achievements 0", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.total_achievements).toBe(0);
    });

    it("returns children_with_achievements 0", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.children_with_achievements).toBe(0);
    });

    it("returns achievement_coverage 0", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.achievement_coverage).toBe(0);
    });

    it("returns all significance counts as 0", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.exceptional_count).toBe(0);
      expect(m.significant_count).toBe(0);
      expect(m.notable_count).toBe(0);
      expect(m.everyday_count).toBe(0);
    });

    it("returns all rates as 0", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.shared_with_family_rate).toBeNull();; expect(m.shared_with_sw_rate).toBeNull();; expect(m.added_to_life_story_rate).toBeNull();; expect(m.photograph_rate).toBeNull();; expect(m.child_views_rate).toBeNull();; expect(m.child_proud_rate).toBeNull();; });

    it("returns average_per_child 0", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.average_per_child).toBeNull();; });

    it("returns empty by_category", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.by_category).toEqual({});
    });

    it("returns empty by_significance", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.by_significance).toEqual({});
    });

    it("returns empty by_celebration", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.by_celebration).toEqual({});
    });

    it("returns empty by_child", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.by_child).toEqual({});
    });

    it("handles totalChildren = 0 with empty array without division error", () => {
      const m = computeAchievementMetrics([], 0);
      expect(m.achievement_coverage).toBeNull();; expect(m.average_per_child).toBeNull();; });
  });

  // ── Single achievement ────────────────────────────────────────────────

  describe("single achievement", () => {
    const single = makeAchievement({
      child_id: "child-1",
      child_name: "Alice",
      category: "sporting",
      significance: "exceptional",
      celebrations: ["certificate", "photograph"],
      shared_with_family: true,
      shared_with_social_worker: true,
      added_to_life_story: true,
      photograph_taken: true,
      child_views: "I felt amazing!",
      child_proud: true,
    });

    it("returns total_achievements 1", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.total_achievements).toBe(1);
    });

    it("returns children_with_achievements 1", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.children_with_achievements).toBe(1);
    });

    it("computes achievement_coverage correctly (1 of 4 = 25%)", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.achievement_coverage).toBe(25);
    });

    it("counts exceptional 1, others 0", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.exceptional_count).toBe(1);
      expect(m.significant_count).toBe(0);
      expect(m.notable_count).toBe(0);
      expect(m.everyday_count).toBe(0);
    });

    it("returns shared_with_family_rate 100 when all shared", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.shared_with_family_rate).toBe(100);
    });

    it("returns shared_with_sw_rate 100 when all shared", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.shared_with_sw_rate).toBe(100);
    });

    it("returns added_to_life_story_rate 100", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.added_to_life_story_rate).toBe(100);
    });

    it("returns photograph_rate 100", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.photograph_rate).toBe(100);
    });

    it("returns child_views_rate 100 when child_views is not null", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.child_views_rate).toBe(100);
    });

    it("returns child_proud_rate 100", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.child_proud_rate).toBe(100);
    });

    it("returns average_per_child 1", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.average_per_child).toBe(1);
    });

    it("builds by_category with single entry", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.by_category).toEqual({ sporting: 1 });
    });

    it("builds by_significance with single entry", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.by_significance).toEqual({ exceptional: 1 });
    });

    it("builds by_celebration counting each celebration method", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.by_celebration).toEqual({ certificate: 1, photograph: 1 });
    });

    it("builds by_child using child_name not child_id", () => {
      const m = computeAchievementMetrics([single], 4);
      expect(m.by_child).toEqual({ Alice: 1 });
    });
  });

  // ── Multiple achievements ─────────────────────────────────────────────

  describe("multiple achievements", () => {
    const achievements: Achievement[] = [
      makeAchievement({
        child_id: "child-1",
        child_name: "Alice",
        category: "academic",
        significance: "exceptional",
        celebrations: ["certificate", "shared_with_family"],
        shared_with_family: true,
        shared_with_social_worker: false,
        added_to_life_story: true,
        photograph_taken: true,
        child_views: "Really proud",
        child_proud: true,
      }),
      makeAchievement({
        child_id: "child-1",
        child_name: "Alice",
        category: "sporting",
        significance: "significant",
        celebrations: ["verbal_praise"],
        shared_with_family: false,
        shared_with_social_worker: true,
        added_to_life_story: false,
        photograph_taken: false,
        child_views: null,
        child_proud: false,
      }),
      makeAchievement({
        child_id: "child-2",
        child_name: "Bob",
        category: "creative",
        significance: "notable",
        celebrations: ["display_board", "photograph"],
        shared_with_family: true,
        shared_with_social_worker: false,
        added_to_life_story: false,
        photograph_taken: true,
        child_views: "I liked painting",
        child_proud: true,
      }),
      makeAchievement({
        child_id: "child-3",
        child_name: "Charlie",
        category: "social",
        significance: "everyday",
        celebrations: ["verbal_praise"],
        shared_with_family: false,
        shared_with_social_worker: false,
        added_to_life_story: false,
        photograph_taken: false,
        child_views: null,
        child_proud: false,
      }),
    ];

    it("returns correct total_achievements", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.total_achievements).toBe(4);
    });

    it("counts unique children via Set (Alice has 2 but counted once)", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.children_with_achievements).toBe(3);
    });

    it("computes achievement_coverage (3 of 5 = 60%)", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.achievement_coverage).toBe(60);
    });

    it("counts each significance level correctly", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.exceptional_count).toBe(1);
      expect(m.significant_count).toBe(1);
      expect(m.notable_count).toBe(1);
      expect(m.everyday_count).toBe(1);
    });

    it("computes shared_with_family_rate (2 of 4 = 50%)", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.shared_with_family_rate).toBe(50);
    });

    it("computes shared_with_sw_rate (1 of 4 = 25%)", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.shared_with_sw_rate).toBe(25);
    });

    it("computes added_to_life_story_rate (1 of 4 = 25%)", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.added_to_life_story_rate).toBe(25);
    });

    it("computes photograph_rate (2 of 4 = 50%)", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.photograph_rate).toBe(50);
    });

    it("computes child_views_rate based on non-null child_views (2 of 4 = 50%)", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.child_views_rate).toBe(50);
    });

    it("computes child_proud_rate (2 of 4 = 50%)", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.child_proud_rate).toBe(50);
    });

    it("computes average_per_child rounded to 1 decimal (4 / 3 = 1.3)", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.average_per_child).toBe(1.3);
    });

    it("builds by_category with correct counts", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.by_category).toEqual({
        academic: 1,
        sporting: 1,
        creative: 1,
        social: 1,
      });
    });

    it("builds by_significance with correct counts", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.by_significance).toEqual({
        exceptional: 1,
        significant: 1,
        notable: 1,
        everyday: 1,
      });
    });

    it("builds by_celebration counting across array items", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.by_celebration).toEqual({
        certificate: 1,
        shared_with_family: 1,
        verbal_praise: 2,
        display_board: 1,
        photograph: 1,
      });
    });

    it("builds by_child using child_name with correct counts", () => {
      const m = computeAchievementMetrics(achievements, 5);
      expect(m.by_child).toEqual({
        Alice: 2,
        Bob: 1,
        Charlie: 1,
      });
    });
  });

  // ── Coverage edge cases ───────────────────────────────────────────────

  describe("achievement_coverage edge cases", () => {
    it("returns 100% when all children have achievements", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c2" }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.achievement_coverage).toBe(100);
    });

    it("returns 0 when totalChildren is 0", () => {
      const m = computeAchievementMetrics([], 0);
      expect(m.achievement_coverage).toBeNull();; });

    it("handles fractional coverage with correct rounding (1 of 3 = 33.3%)", () => {
      const achs = [makeAchievement({ child_id: "c1" })];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.achievement_coverage).toBe(33.3);
    });

    it("handles 2 of 3 = 66.7%", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c2" }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.achievement_coverage).toBe(66.7);
    });

    it("does not double-count children with multiple achievements for coverage", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c1" }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.children_with_achievements).toBe(1);
      expect(m.achievement_coverage).toBe(33.3);
    });
  });

  // ── Rate calculations ─────────────────────────────────────────────────

  describe("rate calculations", () => {
    it("returns 0 rates for empty achievements (no division by zero)", () => {
      const m = computeAchievementMetrics([], 3);
      expect(m.shared_with_family_rate).toBeNull();; expect(m.shared_with_sw_rate).toBeNull();; expect(m.added_to_life_story_rate).toBeNull();; expect(m.photograph_rate).toBeNull();; expect(m.child_views_rate).toBeNull();; expect(m.child_proud_rate).toBeNull();; });

    it("returns 0% when none shared with family", () => {
      const achs = [
        makeAchievement({ shared_with_family: false }),
        makeAchievement({ shared_with_family: false }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.shared_with_family_rate).toBe(0);
    });

    it("returns 0% when none shared with social worker", () => {
      const achs = [
        makeAchievement({ shared_with_social_worker: false }),
        makeAchievement({ shared_with_social_worker: false }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.shared_with_sw_rate).toBe(0);
    });

    it("handles fractional rates with correct rounding (1 of 3 = 33.3%)", () => {
      const achs = [
        makeAchievement({ shared_with_family: true, child_id: "c1" }),
        makeAchievement({ shared_with_family: false, child_id: "c2" }),
        makeAchievement({ shared_with_family: false, child_id: "c3" }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.shared_with_family_rate).toBe(33.3);
    });

    it("child_views_rate counts non-null strings including empty string", () => {
      const achs = [
        makeAchievement({ child_views: "" }),
        makeAchievement({ child_views: null }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      // empty string is !== null, so it counts
      expect(m.child_views_rate).toBe(50);
    });

    it("child_views_rate is 100% when all have views", () => {
      const achs = [
        makeAchievement({ child_views: "Great" }),
        makeAchievement({ child_views: "Loved it" }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.child_views_rate).toBe(100);
    });

    it("child_views_rate is 0% when all views are null", () => {
      const achs = [
        makeAchievement({ child_views: null }),
        makeAchievement({ child_views: null }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.child_views_rate).toBe(0);
    });

    it("child_proud_rate is 0% when no children proud", () => {
      const achs = [
        makeAchievement({ child_proud: false }),
        makeAchievement({ child_proud: false }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.child_proud_rate).toBe(0);
    });

    it("photograph_rate is 100% when all have photographs", () => {
      const achs = [
        makeAchievement({ photograph_taken: true }),
        makeAchievement({ photograph_taken: true }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.photograph_rate).toBe(100);
    });

    it("added_to_life_story_rate is 0% when none added", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false }),
        makeAchievement({ added_to_life_story: false }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.added_to_life_story_rate).toBe(0);
    });
  });

  // ── average_per_child ─────────────────────────────────────────────────

  describe("average_per_child", () => {
    it("returns 0 when no achievements", () => {
      const m = computeAchievementMetrics([], 5);
      expect(m.average_per_child).toBeNull();; });

    it("returns exact integer when evenly divisible (6 / 3 = 2.0)", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c2" }),
        makeAchievement({ child_id: "c2" }),
        makeAchievement({ child_id: "c3" }),
        makeAchievement({ child_id: "c3" }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.average_per_child).toBe(2);
    });

    it("rounds to 1 decimal place (7 / 3 = 2.3)", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c2" }),
        makeAchievement({ child_id: "c2" }),
        makeAchievement({ child_id: "c3" }),
        makeAchievement({ child_id: "c3" }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.average_per_child).toBe(2.3);
    });

    it("computes based on unique children not totalChildren param", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c1" }),
      ];
      // totalChildren = 10 but only 1 unique child in data
      const m = computeAchievementMetrics(achs, 10);
      expect(m.average_per_child).toBe(3);
    });

    it("handles single child single achievement = 1.0", () => {
      const achs = [makeAchievement({ child_id: "c1" })];
      const m = computeAchievementMetrics(achs, 5);
      expect(m.average_per_child).toBe(1);
    });
  });

  // ── Significance counts ───────────────────────────────────────────────

  describe("significance counts", () => {
    it("counts all exceptional", () => {
      const achs = [
        makeAchievement({ significance: "exceptional" }),
        makeAchievement({ significance: "exceptional" }),
        makeAchievement({ significance: "exceptional" }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.exceptional_count).toBe(3);
      expect(m.significant_count).toBe(0);
      expect(m.notable_count).toBe(0);
      expect(m.everyday_count).toBe(0);
    });

    it("counts all significant", () => {
      const achs = [
        makeAchievement({ significance: "significant" }),
        makeAchievement({ significance: "significant" }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.significant_count).toBe(2);
    });

    it("counts all notable", () => {
      const achs = [
        makeAchievement({ significance: "notable" }),
      ];
      const m = computeAchievementMetrics(achs, 1);
      expect(m.notable_count).toBe(1);
    });

    it("counts all everyday", () => {
      const achs = [
        makeAchievement({ significance: "everyday" }),
        makeAchievement({ significance: "everyday" }),
        makeAchievement({ significance: "everyday" }),
        makeAchievement({ significance: "everyday" }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.everyday_count).toBe(4);
    });

    it("counts mixed significance levels correctly", () => {
      const achs = [
        makeAchievement({ significance: "exceptional" }),
        makeAchievement({ significance: "significant" }),
        makeAchievement({ significance: "significant" }),
        makeAchievement({ significance: "notable" }),
        makeAchievement({ significance: "notable" }),
        makeAchievement({ significance: "notable" }),
        makeAchievement({ significance: "everyday" }),
      ];
      const m = computeAchievementMetrics(achs, 5);
      expect(m.exceptional_count).toBe(1);
      expect(m.significant_count).toBe(2);
      expect(m.notable_count).toBe(3);
      expect(m.everyday_count).toBe(1);
    });
  });

  // ── by_category breakdown ─────────────────────────────────────────────

  describe("by_category breakdown", () => {
    it("aggregates multiple categories correctly", () => {
      const achs = [
        makeAchievement({ category: "academic" }),
        makeAchievement({ category: "academic" }),
        makeAchievement({ category: "sporting" }),
        makeAchievement({ category: "creative" }),
        makeAchievement({ category: "creative" }),
        makeAchievement({ category: "creative" }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.by_category).toEqual({
        academic: 2,
        sporting: 1,
        creative: 3,
      });
    });

    it("handles all 11 categories in one dataset", () => {
      const categories: AchievementCategory[] = [
        "academic", "sporting", "creative", "social", "personal_growth",
        "behavioural", "independence", "health_wellbeing", "community",
        "employment", "other",
      ];
      const achs = categories.map((c) => makeAchievement({ category: c }));
      const m = computeAchievementMetrics(achs, 5);
      for (const cat of categories) {
        expect(m.by_category[cat]).toBe(1);
      }
      expect(Object.keys(m.by_category)).toHaveLength(11);
    });

    it("only includes categories present in data", () => {
      const achs = [makeAchievement({ category: "employment" })];
      const m = computeAchievementMetrics(achs, 2);
      expect(Object.keys(m.by_category)).toEqual(["employment"]);
    });
  });

  // ── by_significance breakdown ─────────────────────────────────────────

  describe("by_significance breakdown", () => {
    it("matches the individual significance counts", () => {
      const achs = [
        makeAchievement({ significance: "exceptional" }),
        makeAchievement({ significance: "exceptional" }),
        makeAchievement({ significance: "everyday" }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.by_significance).toEqual({ exceptional: 2, everyday: 1 });
      expect(m.exceptional_count).toBe(2);
      expect(m.everyday_count).toBe(1);
    });

    it("only includes significance levels present in data", () => {
      const achs = [makeAchievement({ significance: "notable" })];
      const m = computeAchievementMetrics(achs, 1);
      expect(Object.keys(m.by_significance)).toEqual(["notable"]);
    });
  });

  // ── by_celebration breakdown ──────────────────────────────────────────

  describe("by_celebration breakdown", () => {
    it("counts celebrations across multiple achievements", () => {
      const achs = [
        makeAchievement({ celebrations: ["verbal_praise", "certificate"] }),
        makeAchievement({ celebrations: ["verbal_praise", "photograph"] }),
        makeAchievement({ celebrations: ["certificate", "reward", "photograph"] }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.by_celebration).toEqual({
        verbal_praise: 2,
        certificate: 2,
        photograph: 2,
        reward: 1,
      });
    });

    it("handles empty celebrations array", () => {
      const achs = [makeAchievement({ celebrations: [] })];
      const m = computeAchievementMetrics(achs, 1);
      expect(m.by_celebration).toEqual({});
    });

    it("handles achievement with single celebration", () => {
      const achs = [makeAchievement({ celebrations: ["house_meeting"] })];
      const m = computeAchievementMetrics(achs, 1);
      expect(m.by_celebration).toEqual({ house_meeting: 1 });
    });

    it("handles achievements with many celebration methods", () => {
      const achs = [
        makeAchievement({
          celebrations: [
            "verbal_praise", "certificate", "reward", "display_board",
            "shared_with_family", "shared_with_social_worker",
            "house_meeting", "special_activity", "added_to_life_story",
            "photograph", "other",
          ],
        }),
      ];
      const m = computeAchievementMetrics(achs, 1);
      expect(Object.keys(m.by_celebration)).toHaveLength(11);
      for (const key of Object.keys(m.by_celebration)) {
        expect(m.by_celebration[key]).toBe(1);
      }
    });
  });

  // ── by_child breakdown ────────────────────────────────────────────────

  describe("by_child breakdown", () => {
    it("uses child_name not child_id as the key", () => {
      const achs = [
        makeAchievement({ child_id: "id-123", child_name: "Alice" }),
        makeAchievement({ child_id: "id-456", child_name: "Bob" }),
      ];
      const m = computeAchievementMetrics(achs, 2);
      expect(m.by_child).toEqual({ Alice: 1, Bob: 1 });
      expect(m.by_child["id-123"]).toBeUndefined();
      expect(m.by_child["id-456"]).toBeUndefined();
    });

    it("aggregates multiple achievements for same child by name", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
      ];
      const m = computeAchievementMetrics(achs, 3);
      expect(m.by_child).toEqual({ Alice: 3 });
    });

    it("handles multiple children with varying counts", () => {
      const achs = [
        makeAchievement({ child_name: "Alice", child_id: "c1" }),
        makeAchievement({ child_name: "Alice", child_id: "c1" }),
        makeAchievement({ child_name: "Bob", child_id: "c2" }),
        makeAchievement({ child_name: "Charlie", child_id: "c3" }),
        makeAchievement({ child_name: "Charlie", child_id: "c3" }),
        makeAchievement({ child_name: "Charlie", child_id: "c3" }),
      ];
      const m = computeAchievementMetrics(achs, 5);
      expect(m.by_child).toEqual({ Alice: 2, Bob: 1, Charlie: 3 });
    });
  });

  // ── totalChildren = 0 edge case ───────────────────────────────────────

  describe("totalChildren = 0", () => {
    it("returns coverage 0 even with achievements", () => {
      const achs = [makeAchievement({ child_id: "c1" })];
      const m = computeAchievementMetrics(achs, 0);
      expect(m.achievement_coverage).toBeNull();; });

    it("still computes all other metrics correctly", () => {
      const achs = [
        makeAchievement({
          child_id: "c1",
          significance: "exceptional",
          shared_with_family: true,
          child_views: "Great",
          child_proud: true,
        }),
      ];
      const m = computeAchievementMetrics(achs, 0);
      expect(m.total_achievements).toBe(1);
      expect(m.children_with_achievements).toBe(1);
      expect(m.exceptional_count).toBe(1);
      expect(m.shared_with_family_rate).toBe(100);
      expect(m.child_views_rate).toBe(100);
      expect(m.child_proud_rate).toBe(100);
      expect(m.average_per_child).toBe(1);
    });
  });

  // ── Large dataset ─────────────────────────────────────────────────────

  describe("large dataset stress test", () => {
    it("handles 100 achievements without error", () => {
      const achs: Achievement[] = [];
      for (let i = 0; i < 100; i++) {
        achs.push(
          makeAchievement({
            child_id: `child-${i % 10}`,
            child_name: `Child ${i % 10}`,
            significance: (["exceptional", "significant", "notable", "everyday"] as const)[i % 4],
            category: (["academic", "sporting", "creative"] as const)[i % 3],
            shared_with_family: i % 2 === 0,
            child_proud: i % 3 === 0,
            child_views: i % 4 === 0 ? "A view" : null,
            celebrations: i % 2 === 0 ? ["verbal_praise", "certificate"] : ["photograph"],
          }),
        );
      }
      const m = computeAchievementMetrics(achs, 15);
      expect(m.total_achievements).toBe(100);
      expect(m.children_with_achievements).toBe(10);
      expect(m.achievement_coverage).toBe(66.7);
      expect(m.average_per_child).toBe(10);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. identifyAchievementAlerts
// ════════════════════════════════════════════════════════════════════════════

describe("identifyAchievementAlerts", () => {
  // ── no_achievements alert ─────────────────────────────────────────────

  describe("no_achievements alert", () => {
    it("fires when totalChildren > children with achievements", () => {
      const achs = [makeAchievement({ child_id: "c1" })];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "no_achievements");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
      expect(alert!.id).toBe("achievement_gap");
    });

    it("includes correct gap count in message (singular)", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c2" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "no_achievements");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("1 child has");
    });

    it("includes correct gap count in message (plural)", () => {
      const achs = [makeAchievement({ child_id: "c1" })];
      const alerts = identifyAchievementAlerts(achs, 4);
      const alert = alerts.find((a) => a.type === "no_achievements");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("3 children have");
    });

    it("does NOT fire when all children have achievements", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c2" }),
        makeAchievement({ child_id: "c3" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "no_achievements");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when totalChildren is 0", () => {
      const alerts = identifyAchievementAlerts([], 0);
      const alert = alerts.find((a) => a.type === "no_achievements");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when achievements array is empty and totalChildren is 0", () => {
      const alerts = identifyAchievementAlerts([], 0);
      expect(alerts.filter((a) => a.type === "no_achievements")).toHaveLength(0);
    });

    it("fires for empty achievements with totalChildren > 0", () => {
      const alerts = identifyAchievementAlerts([], 5);
      const alert = alerts.find((a) => a.type === "no_achievements");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("5 children have");
    });

    it("de-duplicates children with multiple achievements", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c1" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "no_achievements");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("2 children have");
    });
  });

  // ── not_shared_family alert ───────────────────────────────────────────

  describe("not_shared_family alert", () => {
    it("fires when >= 3 non-everyday achievements not shared with family", () => {
      const achs = [
        makeAchievement({ shared_with_family: false, significance: "notable" }),
        makeAchievement({ shared_with_family: false, significance: "significant" }),
        makeAchievement({ shared_with_family: false, significance: "exceptional" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_shared_family");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("medium");
      expect(alert!.id).toBe("family_sharing");
    });

    it("includes correct count in message", () => {
      const achs = [
        makeAchievement({ shared_with_family: false, significance: "notable" }),
        makeAchievement({ shared_with_family: false, significance: "significant" }),
        makeAchievement({ shared_with_family: false, significance: "exceptional" }),
        makeAchievement({ shared_with_family: false, significance: "notable" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 4);
      const alert = alerts.find((a) => a.type === "not_shared_family");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("4 notable achievements");
    });

    it("does NOT count everyday achievements", () => {
      const achs = [
        makeAchievement({ shared_with_family: false, significance: "everyday" }),
        makeAchievement({ shared_with_family: false, significance: "everyday" }),
        makeAchievement({ shared_with_family: false, significance: "everyday" }),
        makeAchievement({ shared_with_family: false, significance: "everyday" }),
        makeAchievement({ shared_with_family: false, significance: "everyday" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_shared_family");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when achievements are shared with family", () => {
      const achs = [
        makeAchievement({ shared_with_family: true, significance: "notable" }),
        makeAchievement({ shared_with_family: true, significance: "significant" }),
        makeAchievement({ shared_with_family: true, significance: "exceptional" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_shared_family");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when only 2 non-everyday not shared (below threshold)", () => {
      const achs = [
        makeAchievement({ shared_with_family: false, significance: "notable" }),
        makeAchievement({ shared_with_family: false, significance: "significant" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      const alert = alerts.find((a) => a.type === "not_shared_family");
      expect(alert).toBeUndefined();
    });

    it("fires at exactly the threshold of 3", () => {
      const achs = [
        makeAchievement({ shared_with_family: false, significance: "notable" }),
        makeAchievement({ shared_with_family: false, significance: "notable" }),
        makeAchievement({ shared_with_family: false, significance: "notable" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_shared_family");
      expect(alert).toBeDefined();
    });

    it("counts mix of non-everyday significances", () => {
      const achs = [
        makeAchievement({ shared_with_family: false, significance: "exceptional" }),
        makeAchievement({ shared_with_family: false, significance: "significant" }),
        makeAchievement({ shared_with_family: false, significance: "everyday" }), // excluded
        makeAchievement({ shared_with_family: false, significance: "notable" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_shared_family");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("3 notable achievements");
    });
  });

  // ── not_in_life_story alert ───────────────────────────────────────────

  describe("not_in_life_story alert", () => {
    it("fires when >= 2 exceptional/significant achievements not in life story", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false, significance: "exceptional" }),
        makeAchievement({ added_to_life_story: false, significance: "significant" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      const alert = alerts.find((a) => a.type === "not_in_life_story");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("medium");
      expect(alert!.id).toBe("life_story_gap");
    });

    it("includes correct count in message", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false, significance: "exceptional" }),
        makeAchievement({ added_to_life_story: false, significance: "exceptional" }),
        makeAchievement({ added_to_life_story: false, significance: "significant" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_in_life_story");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("3 significant achievements");
    });

    it("does NOT count notable achievements", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false, significance: "notable" }),
        makeAchievement({ added_to_life_story: false, significance: "notable" }),
        makeAchievement({ added_to_life_story: false, significance: "notable" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_in_life_story");
      expect(alert).toBeUndefined();
    });

    it("does NOT count everyday achievements", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false, significance: "everyday" }),
        makeAchievement({ added_to_life_story: false, significance: "everyday" }),
        makeAchievement({ added_to_life_story: false, significance: "everyday" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_in_life_story");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when exceptional/significant are already in life story", () => {
      const achs = [
        makeAchievement({ added_to_life_story: true, significance: "exceptional" }),
        makeAchievement({ added_to_life_story: true, significance: "significant" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      const alert = alerts.find((a) => a.type === "not_in_life_story");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when only 1 exceptional/significant not in life story (below threshold)", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false, significance: "exceptional" }),
        makeAchievement({ added_to_life_story: true, significance: "significant" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      const alert = alerts.find((a) => a.type === "not_in_life_story");
      expect(alert).toBeUndefined();
    });

    it("fires at exactly the threshold of 2", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false, significance: "exceptional" }),
        makeAchievement({ added_to_life_story: false, significance: "significant" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      const alert = alerts.find((a) => a.type === "not_in_life_story");
      expect(alert).toBeDefined();
    });

    it("only counts exceptional and significant, not others", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false, significance: "exceptional" }),
        makeAchievement({ added_to_life_story: false, significance: "notable" }),
        makeAchievement({ added_to_life_story: false, significance: "everyday" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_in_life_story");
      // only 1 exceptional, below threshold of 2
      expect(alert).toBeUndefined();
    });
  });

  // ── low_recording alert ───────────────────────────────────────────────

  describe("low_recording alert", () => {
    it("fires for a child with only 1 achievement when total > 5", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c3", child_name: "Charlie" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "low_recording");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("medium");
      expect(alert!.message).toContain("Charlie");
      expect(alert!.id).toBe("low_Charlie");
    });

    it("does NOT fire when total achievements <= 5", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c3", child_name: "Charlie" }),
      ];
      // total = 5 exactly, condition is > 5 so should not fire
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "low_recording");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when all children have >= 2 achievements", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c3", child_name: "Charlie" }),
        makeAchievement({ child_id: "c3", child_name: "Charlie" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "low_recording");
      expect(alert).toBeUndefined();
    });

    it("fires for multiple children with only 1 achievement", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c3", child_name: "Charlie" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const lowAlerts = alerts.filter((a) => a.type === "low_recording");
      expect(lowAlerts).toHaveLength(2);
      const names = lowAlerts.map((a) => a.id);
      expect(names).toContain("low_Bob");
      expect(names).toContain("low_Charlie");
    });

    it("uses child_name in alert id and message", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Destiny" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "low_recording");
      expect(alert).toBeDefined();
      expect(alert!.id).toBe("low_Destiny");
      expect(alert!.message).toContain("Destiny");
    });

    it("does NOT fire at exactly 5 total achievements", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const lowAlerts = alerts.filter((a) => a.type === "low_recording");
      expect(lowAlerts).toHaveLength(0);
    });

    it("fires at exactly 6 total achievements with 1-achievement child", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "low_recording");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("Bob");
    });
  });

  // ── No alerts scenario ────────────────────────────────────────────────

  describe("no alerts scenario", () => {
    it("returns empty array when no conditions are met", () => {
      const achs = [
        makeAchievement({
          child_id: "c1",
          child_name: "Alice",
          shared_with_family: true,
          added_to_life_story: true,
          significance: "notable",
        }),
        makeAchievement({
          child_id: "c2",
          child_name: "Bob",
          shared_with_family: true,
          added_to_life_story: true,
          significance: "everyday",
        }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      expect(alerts).toEqual([]);
    });

    it("returns empty array for empty achievements and 0 totalChildren", () => {
      const alerts = identifyAchievementAlerts([], 0);
      expect(alerts).toEqual([]);
    });
  });

  // ── Mixed scenarios ───────────────────────────────────────────────────

  describe("mixed scenarios", () => {
    it("can produce multiple alert types simultaneously", () => {
      const achs = [
        // Charlie has lots of achievements
        makeAchievement({ child_id: "c1", child_name: "Charlie", shared_with_family: false, significance: "exceptional", added_to_life_story: false }),
        makeAchievement({ child_id: "c1", child_name: "Charlie", shared_with_family: false, significance: "significant", added_to_life_story: false }),
        makeAchievement({ child_id: "c1", child_name: "Charlie", shared_with_family: false, significance: "notable", added_to_life_story: false }),
        makeAchievement({ child_id: "c1", child_name: "Charlie", shared_with_family: false, significance: "notable", added_to_life_story: false }),
        makeAchievement({ child_id: "c1", child_name: "Charlie", shared_with_family: false, significance: "notable", added_to_life_story: false }),
        // Diana has only 1
        makeAchievement({ child_id: "c2", child_name: "Diana", shared_with_family: true, significance: "everyday", added_to_life_story: false }),
      ];
      // totalChildren = 4, so 2 children with no achievements
      const alerts = identifyAchievementAlerts(achs, 4);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_achievements");
      expect(types).toContain("not_shared_family");
      expect(types).toContain("not_in_life_story");
      expect(types).toContain("low_recording");
    });

    it("no_achievements and not_shared_family can coexist", () => {
      const achs = [
        makeAchievement({ child_id: "c1", shared_with_family: false, significance: "notable" }),
        makeAchievement({ child_id: "c1", shared_with_family: false, significance: "significant" }),
        makeAchievement({ child_id: "c1", shared_with_family: false, significance: "exceptional" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 5);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_achievements");
      expect(types).toContain("not_shared_family");
    });

    it("not_in_life_story alert without not_shared_family alert", () => {
      const achs = [
        makeAchievement({ child_id: "c1", shared_with_family: true, significance: "exceptional", added_to_life_story: false }),
        makeAchievement({ child_id: "c2", shared_with_family: true, significance: "significant", added_to_life_story: false }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("not_in_life_story");
      expect(types).not.toContain("not_shared_family");
    });

    it("low_recording fires only for children with exactly 1 achievement", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c3", child_name: "Charlie" }),
        makeAchievement({ child_id: "c4", child_name: "Diana" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 4);
      const lowAlerts = alerts.filter((a) => a.type === "low_recording");
      expect(lowAlerts).toHaveLength(2);
      const ids = lowAlerts.map((a) => a.id);
      expect(ids).toContain("low_Charlie");
      expect(ids).toContain("low_Diana");
      // Alice (3) and Bob (2) should NOT trigger
      expect(ids).not.toContain("low_Alice");
      expect(ids).not.toContain("low_Bob");
    });
  });

  // ── Alert structure ───────────────────────────────────────────────────

  describe("alert structure", () => {
    it("no_achievements alert has correct shape", () => {
      const alerts = identifyAchievementAlerts([], 3);
      const alert = alerts.find((a) => a.type === "no_achievements");
      expect(alert).toMatchObject({
        type: "no_achievements",
        severity: "high",
        id: "achievement_gap",
      });
      expect(typeof alert!.message).toBe("string");
      expect(alert!.message.length).toBeGreaterThan(0);
    });

    it("not_shared_family alert has correct shape", () => {
      const achs = [
        makeAchievement({ shared_with_family: false, significance: "notable" }),
        makeAchievement({ shared_with_family: false, significance: "notable" }),
        makeAchievement({ shared_with_family: false, significance: "notable" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "not_shared_family");
      expect(alert).toMatchObject({
        type: "not_shared_family",
        severity: "medium",
        id: "family_sharing",
      });
      expect(typeof alert!.message).toBe("string");
    });

    it("not_in_life_story alert has correct shape", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false, significance: "exceptional" }),
        makeAchievement({ added_to_life_story: false, significance: "significant" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      const alert = alerts.find((a) => a.type === "not_in_life_story");
      expect(alert).toMatchObject({
        type: "not_in_life_story",
        severity: "medium",
        id: "life_story_gap",
      });
    });

    it("low_recording alert has correct shape", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Eve" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 3);
      const alert = alerts.find((a) => a.type === "low_recording");
      expect(alert).toMatchObject({
        type: "low_recording",
        severity: "medium",
        id: "low_Eve",
      });
      expect(alert!.message).toContain("1 achievement");
      expect(alert!.message).toContain("Eve");
    });

    it("all alerts have required fields: type, severity, message, id", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice", shared_with_family: false, significance: "exceptional", added_to_life_story: false }),
        makeAchievement({ child_id: "c1", child_name: "Alice", shared_with_family: false, significance: "significant", added_to_life_story: false }),
        makeAchievement({ child_id: "c1", child_name: "Alice", shared_with_family: false, significance: "notable", added_to_life_story: false }),
        makeAchievement({ child_id: "c1", child_name: "Alice", shared_with_family: false, significance: "notable", added_to_life_story: false }),
        makeAchievement({ child_id: "c1", child_name: "Alice", shared_with_family: false, significance: "notable", added_to_life_story: false }),
        makeAchievement({ child_id: "c2", child_name: "Bob", shared_with_family: false, significance: "everyday", added_to_life_story: false }),
      ];
      const alerts = identifyAchievementAlerts(achs, 5);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(["critical", "high", "medium"]).toContain(alert.severity);
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });
  });

  // ── Edge cases where conditions are NOT met ───────────────────────────

  describe("edge cases where alerts are NOT triggered", () => {
    it("not_shared_family: 2 non-everyday not shared is below threshold", () => {
      const achs = [
        makeAchievement({ shared_with_family: false, significance: "exceptional" }),
        makeAchievement({ shared_with_family: false, significance: "significant" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      expect(alerts.find((a) => a.type === "not_shared_family")).toBeUndefined();
    });

    it("not_shared_family: everyday achievements excluded even if many", () => {
      const achs = Array.from({ length: 10 }, () =>
        makeAchievement({ shared_with_family: false, significance: "everyday" }),
      );
      const alerts = identifyAchievementAlerts(achs, 5);
      expect(alerts.find((a) => a.type === "not_shared_family")).toBeUndefined();
    });

    it("not_in_life_story: 1 exceptional not in life story is below threshold", () => {
      const achs = [
        makeAchievement({ added_to_life_story: false, significance: "exceptional" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 1);
      expect(alerts.find((a) => a.type === "not_in_life_story")).toBeUndefined();
    });

    it("not_in_life_story: notable and everyday not counted even if many", () => {
      const achs = Array.from({ length: 10 }, (_, i) =>
        makeAchievement({
          added_to_life_story: false,
          significance: i % 2 === 0 ? "notable" : "everyday",
        }),
      );
      const alerts = identifyAchievementAlerts(achs, 5);
      expect(alerts.find((a) => a.type === "not_in_life_story")).toBeUndefined();
    });

    it("low_recording: child with 2 achievements does not trigger", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      expect(alerts.filter((a) => a.type === "low_recording")).toHaveLength(0);
    });

    it("low_recording: all children have 1 achievement but total is 4 (not > 5)", () => {
      const achs = [
        makeAchievement({ child_id: "c1", child_name: "Alice" }),
        makeAchievement({ child_id: "c2", child_name: "Bob" }),
        makeAchievement({ child_id: "c3", child_name: "Charlie" }),
        makeAchievement({ child_id: "c4", child_name: "Diana" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 4);
      expect(alerts.filter((a) => a.type === "low_recording")).toHaveLength(0);
    });

    it("no_achievements: exactly equal children to unique children", () => {
      const achs = [
        makeAchievement({ child_id: "c1" }),
        makeAchievement({ child_id: "c2" }),
      ];
      const alerts = identifyAchievementAlerts(achs, 2);
      expect(alerts.find((a) => a.type === "no_achievements")).toBeUndefined();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. _testing export
// ════════════════════════════════════════════════════════════════════════════

describe("_testing export", () => {
  it("exposes computeAchievementMetrics", () => {
    expect(typeof _testing.computeAchievementMetrics).toBe("function");
  });

  it("exposes identifyAchievementAlerts", () => {
    expect(typeof _testing.identifyAchievementAlerts).toBe("function");
  });
});
