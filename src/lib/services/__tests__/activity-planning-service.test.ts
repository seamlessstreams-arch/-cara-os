// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ACTIVITY PLANNING SERVICE TESTS
// Pure-function tests for activity metrics, alert identification,
// constant validation, CRUD fallback, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_STATUSES,
  PARTICIPATION_LEVELS,
  ENJOYMENT_RATINGS,
  _testing,
} from "../activity-planning-service";

import type {
  Activity,
  ActivityParticipation,
  ActivityCategory,
  ActivityStatus,
  ParticipationLevel,
  EnjoymentRating,
} from "../activity-planning-service";

const { computeActivityMetrics, identifyActivityAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const NOW = new Date("2026-05-13");

function makeActivity(
  overrides: Partial<{
    id: string;
    home_id: string;
    title: string;
    description: string;
    category: ActivityCategory;
    activity_date: string;
    start_time: string;
    end_time: string;
    location: string;
    led_by: string;
    status: ActivityStatus;
    max_participants: number;
    risk_assessed: boolean;
    cost: number;
    external_provider: boolean;
    provider_name: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }> = {},
): Activity {
  return {
    id: "id" in overrides ? overrides.id! : crypto.randomUUID(),
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    title: "title" in overrides ? overrides.title! : "Football Session",
    description: "description" in overrides ? overrides.description! : "Weekly football",
    category: "category" in overrides ? overrides.category! : "sport_fitness",
    activity_date: "activity_date" in overrides ? overrides.activity_date! : "2026-05-10",
    start_time: "start_time" in overrides ? overrides.start_time! : "10:00",
    end_time: "end_time" in overrides ? overrides.end_time! : "11:00",
    location: "location" in overrides ? overrides.location! : "Sports Hall",
    led_by: "led_by" in overrides ? overrides.led_by! : "staff-1",
    status: "status" in overrides ? overrides.status! : "completed",
    max_participants: "max_participants" in overrides ? overrides.max_participants! : 8,
    risk_assessed: "risk_assessed" in overrides ? overrides.risk_assessed! : true,
    cost: "cost" in overrides ? overrides.cost! : 0,
    external_provider: "external_provider" in overrides ? overrides.external_provider! : false,
    provider_name: "provider_name" in overrides ? overrides.provider_name! : null,
    notes: "notes" in overrides ? overrides.notes! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-05-01T10:00:00Z",
  };
}

function makeParticipation(
  overrides: Partial<{
    id: string;
    home_id: string;
    activity_id: string;
    child_name: string;
    child_id: string;
    participation_level: ParticipationLevel;
    enjoyment_rating: EnjoymentRating | null;
    staff_observations: string | null;
    skills_developed: string[];
    follow_up_needed: boolean;
    follow_up_notes: string | null;
    created_at: string;
  }> = {},
): ActivityParticipation {
  return {
    id: "id" in overrides ? overrides.id! : crypto.randomUUID(),
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    activity_id: "activity_id" in overrides ? overrides.activity_id! : "act-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alex",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    participation_level: "participation_level" in overrides ? overrides.participation_level! : "full",
    enjoyment_rating: "enjoyment_rating" in overrides ? overrides.enjoyment_rating! : "enjoyed",
    staff_observations: "staff_observations" in overrides ? overrides.staff_observations! : null,
    skills_developed: "skills_developed" in overrides ? overrides.skills_developed! : [],
    follow_up_needed: "follow_up_needed" in overrides ? overrides.follow_up_needed! : false,
    follow_up_notes: "follow_up_notes" in overrides ? overrides.follow_up_notes! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-10T10:00:00Z",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("ACTIVITY_CATEGORIES", () => {
  it("has exactly 15 entries", () => {
    expect(ACTIVITY_CATEGORIES).toHaveLength(15);
  });

  it("has unique category values", () => {
    const values = ACTIVITY_CATEGORIES.map((c) => c.category);
    expect(new Set(values).size).toBe(15);
  });

  it("has non-empty labels for all entries", () => {
    for (const c of ACTIVITY_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("contains sport_fitness", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("sport_fitness");
  });

  it("contains creative_arts", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("creative_arts");
  });

  it("contains music", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("music");
  });

  it("contains outdoor_adventure", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("outdoor_adventure");
  });

  it("contains cooking_baking", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("cooking_baking");
  });

  it("contains educational", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("educational");
  });

  it("contains cultural", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("cultural");
  });

  it("contains religious_spiritual", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("religious_spiritual");
  });

  it("contains community_volunteering", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("community_volunteering");
  });

  it("contains social_outing", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("social_outing");
  });

  it("contains therapeutic", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("therapeutic");
  });

  it("contains life_skills", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("life_skills");
  });

  it("contains technology_digital", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("technology_digital");
  });

  it("contains reading_literacy", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("reading_literacy");
  });

  it("contains other", () => {
    expect(ACTIVITY_CATEGORIES.map((c) => c.category)).toContain("other");
  });

  it("maps sport_fitness to 'Sport & Fitness'", () => {
    const found = ACTIVITY_CATEGORIES.find((c) => c.category === "sport_fitness");
    expect(found?.label).toBe("Sport & Fitness");
  });

  it("maps creative_arts to 'Creative Arts'", () => {
    const found = ACTIVITY_CATEGORIES.find((c) => c.category === "creative_arts");
    expect(found?.label).toBe("Creative Arts");
  });

  it("maps religious_spiritual to 'Religious/Spiritual'", () => {
    const found = ACTIVITY_CATEGORIES.find((c) => c.category === "religious_spiritual");
    expect(found?.label).toBe("Religious/Spiritual");
  });

  it("maps technology_digital to 'Technology & Digital'", () => {
    const found = ACTIVITY_CATEGORIES.find((c) => c.category === "technology_digital");
    expect(found?.label).toBe("Technology & Digital");
  });
});

describe("ACTIVITY_STATUSES", () => {
  it("has exactly 6 entries", () => {
    expect(ACTIVITY_STATUSES).toHaveLength(6);
  });

  it("has unique status values", () => {
    const values = ACTIVITY_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(6);
  });

  it("has non-empty labels for all entries", () => {
    for (const s of ACTIVITY_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("contains planned", () => {
    expect(ACTIVITY_STATUSES.map((s) => s.status)).toContain("planned");
  });

  it("contains confirmed", () => {
    expect(ACTIVITY_STATUSES.map((s) => s.status)).toContain("confirmed");
  });

  it("contains in_progress", () => {
    expect(ACTIVITY_STATUSES.map((s) => s.status)).toContain("in_progress");
  });

  it("contains completed", () => {
    expect(ACTIVITY_STATUSES.map((s) => s.status)).toContain("completed");
  });

  it("contains cancelled", () => {
    expect(ACTIVITY_STATUSES.map((s) => s.status)).toContain("cancelled");
  });

  it("contains postponed", () => {
    expect(ACTIVITY_STATUSES.map((s) => s.status)).toContain("postponed");
  });

  it("maps in_progress to 'In Progress'", () => {
    const found = ACTIVITY_STATUSES.find((s) => s.status === "in_progress");
    expect(found?.label).toBe("In Progress");
  });

  it("maps cancelled to 'Cancelled'", () => {
    const found = ACTIVITY_STATUSES.find((s) => s.status === "cancelled");
    expect(found?.label).toBe("Cancelled");
  });
});

describe("PARTICIPATION_LEVELS", () => {
  it("has exactly 5 entries", () => {
    expect(PARTICIPATION_LEVELS).toHaveLength(5);
  });

  it("has unique level values", () => {
    const values = PARTICIPATION_LEVELS.map((p) => p.level);
    expect(new Set(values).size).toBe(5);
  });

  it("has non-empty labels for all entries", () => {
    for (const p of PARTICIPATION_LEVELS) {
      expect(p.label.length).toBeGreaterThan(0);
    }
  });

  it("contains full", () => {
    expect(PARTICIPATION_LEVELS.map((p) => p.level)).toContain("full");
  });

  it("contains partial", () => {
    expect(PARTICIPATION_LEVELS.map((p) => p.level)).toContain("partial");
  });

  it("contains observed_only", () => {
    expect(PARTICIPATION_LEVELS.map((p) => p.level)).toContain("observed_only");
  });

  it("contains declined", () => {
    expect(PARTICIPATION_LEVELS.map((p) => p.level)).toContain("declined");
  });

  it("contains absent", () => {
    expect(PARTICIPATION_LEVELS.map((p) => p.level)).toContain("absent");
  });

  it("maps full to 'Full Participation'", () => {
    const found = PARTICIPATION_LEVELS.find((p) => p.level === "full");
    expect(found?.label).toBe("Full Participation");
  });

  it("maps observed_only to 'Observed Only'", () => {
    const found = PARTICIPATION_LEVELS.find((p) => p.level === "observed_only");
    expect(found?.label).toBe("Observed Only");
  });
});

describe("ENJOYMENT_RATINGS", () => {
  it("has exactly 5 entries", () => {
    expect(ENJOYMENT_RATINGS).toHaveLength(5);
  });

  it("has unique rating values", () => {
    const values = ENJOYMENT_RATINGS.map((e) => e.rating);
    expect(new Set(values).size).toBe(5);
  });

  it("has non-empty labels for all entries", () => {
    for (const e of ENJOYMENT_RATINGS) {
      expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it("contains loved_it", () => {
    expect(ENJOYMENT_RATINGS.map((e) => e.rating)).toContain("loved_it");
  });

  it("contains enjoyed", () => {
    expect(ENJOYMENT_RATINGS.map((e) => e.rating)).toContain("enjoyed");
  });

  it("contains neutral", () => {
    expect(ENJOYMENT_RATINGS.map((e) => e.rating)).toContain("neutral");
  });

  it("contains disliked", () => {
    expect(ENJOYMENT_RATINGS.map((e) => e.rating)).toContain("disliked");
  });

  it("contains refused", () => {
    expect(ENJOYMENT_RATINGS.map((e) => e.rating)).toContain("refused");
  });

  it("maps loved_it to 'Loved It'", () => {
    const found = ENJOYMENT_RATINGS.find((e) => e.rating === "loved_it");
    expect(found?.label).toBe("Loved It");
  });

  it("maps refused to 'Refused'", () => {
    const found = ENJOYMENT_RATINGS.find((e) => e.rating === "refused");
    expect(found?.label).toBe("Refused");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeActivityMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeActivityMetrics", () => {
  describe("empty inputs", () => {
    it("returns zeros for empty activities and participations", () => {
      const m = computeActivityMetrics([], [], 0, NOW);
      expect(m.total_activities).toBe(0);
      expect(m.completed_activities).toBe(0);
      expect(m.upcoming_activities).toBe(0);
      expect(m.cancelled_rate).toBe(0);
      expect(m.total_participations).toBe(0);
      expect(m.full_participation_rate).toBe(0);
      expect(m.enjoyment_positive_rate).toBe(0);
      expect(m.children_participating).toBe(0);
      expect(m.participation_coverage).toBe(0);
      expect(m.follow_up_needed).toBe(0);
      expect(m.risk_assessed_rate).toBe(0);
      expect(m.total_cost).toBe(0);
      expect(m.external_provider_count).toBe(0);
      expect(m.avg_skills_developed).toBe(0);
    });

    it("returns empty grouping objects for empty inputs", () => {
      const m = computeActivityMetrics([], [], 0, NOW);
      expect(m.by_category).toEqual({});
      expect(m.by_status).toEqual({});
      expect(m.by_participation).toEqual({});
      expect(m.by_enjoyment).toEqual({});
    });
  });

  describe("total_activities", () => {
    it("counts all activities regardless of status", () => {
      const acts = [
        makeActivity({ status: "completed" }),
        makeActivity({ status: "planned" }),
        makeActivity({ status: "cancelled" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.total_activities).toBe(3);
    });
  });

  describe("completed_activities", () => {
    it("counts only completed activities", () => {
      const acts = [
        makeActivity({ status: "completed" }),
        makeActivity({ status: "completed" }),
        makeActivity({ status: "planned" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.completed_activities).toBe(2);
    });

    it("returns 0 when no activities are completed", () => {
      const acts = [makeActivity({ status: "planned" })];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.completed_activities).toBe(0);
    });
  });

  describe("upcoming_activities", () => {
    it("counts planned activities with future date", () => {
      const acts = [
        makeActivity({ status: "planned", activity_date: "2026-05-20" }),
        makeActivity({ status: "confirmed", activity_date: "2026-06-01" }),
        makeActivity({ status: "planned", activity_date: "2026-04-01" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.upcoming_activities).toBe(2);
    });

    it("counts confirmed activities with future date", () => {
      const acts = [
        makeActivity({ status: "confirmed", activity_date: "2026-05-15" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.upcoming_activities).toBe(1);
    });

    it("excludes completed activities with future date", () => {
      const acts = [
        makeActivity({ status: "completed", activity_date: "2026-06-01" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.upcoming_activities).toBe(0);
    });

    it("includes activities on the same date as now", () => {
      const acts = [
        makeActivity({ status: "planned", activity_date: "2026-05-13" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.upcoming_activities).toBe(1);
    });
  });

  describe("cancelled_rate", () => {
    it("calculates percentage correctly", () => {
      const acts = [
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "completed" }),
        makeActivity({ status: "completed" }),
        makeActivity({ status: "completed" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.cancelled_rate).toBe(25);
    });

    it("rounds to one decimal place", () => {
      const acts = [
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "completed" }),
        makeActivity({ status: "completed" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.cancelled_rate).toBe(33.3);
    });

    it("returns 0 when no activities", () => {
      const m = computeActivityMetrics([], [], 0, NOW);
      expect(m.cancelled_rate).toBe(0);
    });

    it("returns 100 when all activities cancelled", () => {
      const acts = [
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "cancelled" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.cancelled_rate).toBe(100);
    });
  });

  describe("total_participations", () => {
    it("counts all participations", () => {
      const parts = [makeParticipation(), makeParticipation(), makeParticipation()];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.total_participations).toBe(3);
    });
  });

  describe("full_participation_rate", () => {
    it("calculates full participation percentage", () => {
      const parts = [
        makeParticipation({ participation_level: "full" }),
        makeParticipation({ participation_level: "full" }),
        makeParticipation({ participation_level: "partial" }),
        makeParticipation({ participation_level: "declined" }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.full_participation_rate).toBe(50);
    });

    it("returns 0 when no participations", () => {
      const m = computeActivityMetrics([], [], 0, NOW);
      expect(m.full_participation_rate).toBe(0);
    });
  });

  describe("enjoyment_positive_rate", () => {
    it("counts loved_it and enjoyed over rated participations", () => {
      const parts = [
        makeParticipation({ enjoyment_rating: "loved_it" }),
        makeParticipation({ enjoyment_rating: "enjoyed" }),
        makeParticipation({ enjoyment_rating: "neutral" }),
        makeParticipation({ enjoyment_rating: "disliked" }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.enjoyment_positive_rate).toBe(50);
    });

    it("excludes null enjoyment ratings from denominator", () => {
      const parts = [
        makeParticipation({ enjoyment_rating: "loved_it" }),
        makeParticipation({ enjoyment_rating: null }),
        makeParticipation({ enjoyment_rating: null }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.enjoyment_positive_rate).toBe(100);
    });

    it("returns 0 when all ratings are null", () => {
      const parts = [
        makeParticipation({ enjoyment_rating: null }),
        makeParticipation({ enjoyment_rating: null }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.enjoyment_positive_rate).toBe(0);
    });
  });

  describe("children_participating", () => {
    it("counts unique child_ids with full or partial participation", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
        makeParticipation({ child_id: "c1", participation_level: "full" }),
        makeParticipation({ child_id: "c2", participation_level: "partial" }),
        makeParticipation({ child_id: "c3", participation_level: "declined" }),
      ];
      const m = computeActivityMetrics([], parts, 5, NOW);
      expect(m.children_participating).toBe(2);
    });

    it("excludes declined and absent from unique children", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "declined" }),
        makeParticipation({ child_id: "c2", participation_level: "absent" }),
      ];
      const m = computeActivityMetrics([], parts, 2, NOW);
      expect(m.children_participating).toBe(0);
    });

    it("deduplicates same child_id across multiple participations", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
        makeParticipation({ child_id: "c1", participation_level: "partial" }),
        makeParticipation({ child_id: "c1", participation_level: "full" }),
      ];
      const m = computeActivityMetrics([], parts, 3, NOW);
      expect(m.children_participating).toBe(1);
    });
  });

  describe("participation_coverage", () => {
    it("calculates coverage as percentage of totalChildren", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
        makeParticipation({ child_id: "c2", participation_level: "partial" }),
      ];
      const m = computeActivityMetrics([], parts, 4, NOW);
      expect(m.participation_coverage).toBe(50);
    });

    it("returns 0 when totalChildren is 0", () => {
      const parts = [makeParticipation({ child_id: "c1", participation_level: "full" })];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.participation_coverage).toBe(0);
    });

    it("returns 100 when all children participate", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
        makeParticipation({ child_id: "c2", participation_level: "partial" }),
      ];
      const m = computeActivityMetrics([], parts, 2, NOW);
      expect(m.participation_coverage).toBe(100);
    });
  });

  describe("follow_up_needed", () => {
    it("counts participations that need follow up", () => {
      const parts = [
        makeParticipation({ follow_up_needed: true }),
        makeParticipation({ follow_up_needed: true }),
        makeParticipation({ follow_up_needed: false }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.follow_up_needed).toBe(2);
    });

    it("returns 0 when no follow-ups needed", () => {
      const parts = [makeParticipation({ follow_up_needed: false })];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.follow_up_needed).toBe(0);
    });
  });

  describe("risk_assessed_rate", () => {
    it("calculates percentage of risk-assessed activities", () => {
      const acts = [
        makeActivity({ risk_assessed: true }),
        makeActivity({ risk_assessed: true }),
        makeActivity({ risk_assessed: false }),
        makeActivity({ risk_assessed: false }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.risk_assessed_rate).toBe(50);
    });

    it("returns 0 when no activities exist", () => {
      const m = computeActivityMetrics([], [], 0, NOW);
      expect(m.risk_assessed_rate).toBe(0);
    });
  });

  describe("total_cost", () => {
    it("sums all activity costs", () => {
      const acts = [
        makeActivity({ cost: 25.5 }),
        makeActivity({ cost: 10 }),
        makeActivity({ cost: 0 }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.total_cost).toBe(35.5);
    });

    it("returns 0 with no activities", () => {
      const m = computeActivityMetrics([], [], 0, NOW);
      expect(m.total_cost).toBe(0);
    });
  });

  describe("external_provider_count", () => {
    it("counts activities with external providers", () => {
      const acts = [
        makeActivity({ external_provider: true }),
        makeActivity({ external_provider: true }),
        makeActivity({ external_provider: false }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.external_provider_count).toBe(2);
    });
  });

  describe("avg_skills_developed", () => {
    it("averages skills across active participations only", () => {
      const parts = [
        makeParticipation({ participation_level: "full", skills_developed: ["teamwork", "fitness"] }),
        makeParticipation({ participation_level: "partial", skills_developed: ["creativity"] }),
        makeParticipation({ participation_level: "absent", skills_developed: [] }),
      ];
      // active = full + partial + observed_only = 2
      // total skills from ALL participations = 2 + 1 + 0 = 3
      // avg = 3 / 2 = 1.5
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.avg_skills_developed).toBe(1.5);
    });

    it("returns 0 when no active participations exist", () => {
      const parts = [
        makeParticipation({ participation_level: "absent", skills_developed: ["x"] }),
        makeParticipation({ participation_level: "declined", skills_developed: ["y"] }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.avg_skills_developed).toBe(0);
    });

    it("returns 0 for empty participations", () => {
      const m = computeActivityMetrics([], [], 0, NOW);
      expect(m.avg_skills_developed).toBe(0);
    });

    it("rounds to one decimal place", () => {
      const parts = [
        makeParticipation({ participation_level: "full", skills_developed: ["a", "b", "c"] }),
        makeParticipation({ participation_level: "full", skills_developed: ["d"] }),
        makeParticipation({ participation_level: "full", skills_developed: ["e"] }),
      ];
      // total skills = 3+1+1 = 5, active = 3, avg = 5/3 = 1.6666... => 1.7
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.avg_skills_developed).toBe(1.7);
    });
  });

  describe("by_category", () => {
    it("groups activities by category", () => {
      const acts = [
        makeActivity({ category: "sport_fitness" }),
        makeActivity({ category: "sport_fitness" }),
        makeActivity({ category: "music" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.by_category).toEqual({ sport_fitness: 2, music: 1 });
    });

    it("returns empty object when no activities", () => {
      const m = computeActivityMetrics([], [], 0, NOW);
      expect(m.by_category).toEqual({});
    });
  });

  describe("by_status", () => {
    it("groups activities by status", () => {
      const acts = [
        makeActivity({ status: "completed" }),
        makeActivity({ status: "completed" }),
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "planned", activity_date: "2026-05-20" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.by_status).toEqual({ completed: 2, cancelled: 1, planned: 1 });
    });
  });

  describe("by_participation", () => {
    it("groups participations by level", () => {
      const parts = [
        makeParticipation({ participation_level: "full" }),
        makeParticipation({ participation_level: "full" }),
        makeParticipation({ participation_level: "declined" }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.by_participation).toEqual({ full: 2, declined: 1 });
    });
  });

  describe("by_enjoyment", () => {
    it("groups participations by enjoyment rating", () => {
      const parts = [
        makeParticipation({ enjoyment_rating: "loved_it" }),
        makeParticipation({ enjoyment_rating: "loved_it" }),
        makeParticipation({ enjoyment_rating: "neutral" }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.by_enjoyment).toEqual({ loved_it: 2, neutral: 1 });
    });

    it("excludes null enjoyment ratings from grouping", () => {
      const parts = [
        makeParticipation({ enjoyment_rating: "enjoyed" }),
        makeParticipation({ enjoyment_rating: null }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.by_enjoyment).toEqual({ enjoyed: 1 });
    });
  });

  describe("single-item edge cases", () => {
    it("handles single completed activity", () => {
      const acts = [makeActivity({ status: "completed", risk_assessed: true, cost: 15 })];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.total_activities).toBe(1);
      expect(m.completed_activities).toBe(1);
      expect(m.cancelled_rate).toBe(0);
      expect(m.risk_assessed_rate).toBe(100);
      expect(m.total_cost).toBe(15);
    });

    it("handles single participation", () => {
      const parts = [makeParticipation({ participation_level: "full", enjoyment_rating: "loved_it" })];
      const m = computeActivityMetrics([], parts, 1, NOW);
      expect(m.total_participations).toBe(1);
      expect(m.full_participation_rate).toBe(100);
      expect(m.enjoyment_positive_rate).toBe(100);
    });
  });

  describe("all-cancelled scenario", () => {
    it("returns 100% cancelled rate when all cancelled", () => {
      const acts = [
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "cancelled" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.cancelled_rate).toBe(100);
      expect(m.completed_activities).toBe(0);
    });
  });

  describe("all same category", () => {
    it("groups all into one category bucket", () => {
      const acts = [
        makeActivity({ category: "music" }),
        makeActivity({ category: "music" }),
        makeActivity({ category: "music" }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(Object.keys(m.by_category)).toHaveLength(1);
      expect(m.by_category["music"]).toBe(3);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyActivityAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyActivityAlerts", () => {
  describe("empty inputs", () => {
    it("returns empty alerts for no activities and no participations", () => {
      const alerts = identifyActivityAlerts([], [], 0, NOW);
      expect(alerts).toEqual([]);
    });
  });

  describe("not_risk_assessed", () => {
    it("flags planned future activity without risk assessment", () => {
      const acts = [
        makeActivity({
          id: "act-1",
          title: "Hiking Trip",
          status: "planned",
          activity_date: "2026-05-20",
          risk_assessed: false,
        }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "not_risk_assessed");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
      expect(found!.id).toBe("act-1");
      expect(found!.message).toContain("Hiking Trip");
      expect(found!.message).toContain("2026-05-20");
    });

    it("flags confirmed future activity without risk assessment", () => {
      const acts = [
        makeActivity({
          id: "act-2",
          title: "Swimming",
          status: "confirmed",
          activity_date: "2026-06-01",
          risk_assessed: false,
        }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "not_risk_assessed");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
    });

    it("does not flag completed activities without risk assessment", () => {
      const acts = [
        makeActivity({
          status: "completed",
          activity_date: "2026-06-01",
          risk_assessed: false,
        }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "not_risk_assessed");
      expect(found).toBeUndefined();
    });

    it("does not flag risk-assessed planned activities", () => {
      const acts = [
        makeActivity({
          status: "planned",
          activity_date: "2026-05-20",
          risk_assessed: true,
        }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "not_risk_assessed");
      expect(found).toBeUndefined();
    });

    it("does not flag planned activities in the past", () => {
      const acts = [
        makeActivity({
          status: "planned",
          activity_date: "2026-04-01",
          risk_assessed: false,
        }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "not_risk_assessed");
      expect(found).toBeUndefined();
    });

    it("flags multiple non-risk-assessed activities", () => {
      const acts = [
        makeActivity({ id: "a1", status: "planned", activity_date: "2026-05-20", risk_assessed: false, title: "A" }),
        makeActivity({ id: "a2", status: "confirmed", activity_date: "2026-05-25", risk_assessed: false, title: "B" }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.filter((a) => a.type === "not_risk_assessed");
      expect(found).toHaveLength(2);
    });
  });

  describe("low_participation", () => {
    it("flags when fewer unique children participate than totalChildren", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 3, NOW);
      const found = alerts.find((a) => a.type === "low_participation");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
      expect(found!.id).toBe("participation_gap");
    });

    it("uses singular 'child has' when gap is 1", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 2, NOW);
      const found = alerts.find((a) => a.type === "low_participation");
      expect(found!.message).toContain("1 child has");
    });

    it("uses plural 'children have' when gap is more than 1", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 4, NOW);
      const found = alerts.find((a) => a.type === "low_participation");
      expect(found!.message).toContain("3 children have");
    });

    it("does not flag when all children participate", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
        makeParticipation({ child_id: "c2", participation_level: "partial" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 2, NOW);
      const found = alerts.find((a) => a.type === "low_participation");
      expect(found).toBeUndefined();
    });

    it("does not flag when totalChildren is 0", () => {
      const alerts = identifyActivityAlerts([], [], 0, NOW);
      const found = alerts.find((a) => a.type === "low_participation");
      expect(found).toBeUndefined();
    });

    it("considers only full and partial as active participation", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "observed_only" }),
        makeParticipation({ child_id: "c2", participation_level: "declined" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 2, NOW);
      const found = alerts.find((a) => a.type === "low_participation");
      expect(found).toBeDefined();
      expect(found!.message).toContain("2 children have");
    });
  });

  describe("repeated_decline", () => {
    it("flags child with 3 or more declined/absent participations", () => {
      const parts = [
        makeParticipation({ child_name: "Sam", participation_level: "declined" }),
        makeParticipation({ child_name: "Sam", participation_level: "absent" }),
        makeParticipation({ child_name: "Sam", participation_level: "declined" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 0, NOW);
      const found = alerts.find((a) => a.type === "repeated_decline");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
      expect(found!.message).toContain("Sam");
      expect(found!.message).toContain("3 activities");
    });

    it("does not flag child with fewer than 3 declines", () => {
      const parts = [
        makeParticipation({ child_name: "Jo", participation_level: "declined" }),
        makeParticipation({ child_name: "Jo", participation_level: "absent" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 0, NOW);
      const found = alerts.find((a) => a.type === "repeated_decline");
      expect(found).toBeUndefined();
    });

    it("counts declined and absent separately by child name", () => {
      const parts = [
        makeParticipation({ child_name: "A", participation_level: "declined" }),
        makeParticipation({ child_name: "A", participation_level: "declined" }),
        makeParticipation({ child_name: "A", participation_level: "declined" }),
        makeParticipation({ child_name: "B", participation_level: "absent" }),
        makeParticipation({ child_name: "B", participation_level: "absent" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 0, NOW);
      const declined = alerts.filter((a) => a.type === "repeated_decline");
      expect(declined).toHaveLength(1);
      expect(declined[0].message).toContain("A");
    });

    it("does not count full participation toward decline count", () => {
      const parts = [
        makeParticipation({ child_name: "C", participation_level: "full" }),
        makeParticipation({ child_name: "C", participation_level: "full" }),
        makeParticipation({ child_name: "C", participation_level: "full" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 0, NOW);
      const found = alerts.find((a) => a.type === "repeated_decline");
      expect(found).toBeUndefined();
    });
  });

  describe("high_cancellation", () => {
    it("flags when >30% of 5+ activities are cancelled", () => {
      const acts = [
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "completed" }),
        makeActivity({ status: "completed" }),
        makeActivity({ status: "completed" }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "high_cancellation");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
      expect(found!.message).toContain("40%");
    });

    it("does not flag when fewer than 5 activities", () => {
      const acts = [
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "completed" }),
        makeActivity({ status: "completed" }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "high_cancellation");
      expect(found).toBeUndefined();
    });

    it("does not flag when cancellation rate is exactly 30%", () => {
      // 30% = 3/10, need >30% to trigger
      const acts: Activity[] = [];
      for (let i = 0; i < 3; i++) acts.push(makeActivity({ status: "cancelled" }));
      for (let i = 0; i < 7; i++) acts.push(makeActivity({ status: "completed" }));
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "high_cancellation");
      expect(found).toBeUndefined();
    });

    it("flags at 31% cancellation rate with 5+ activities", () => {
      // Need >30% with >=5 activities. 4/12 = 33.3%
      const acts: Activity[] = [];
      for (let i = 0; i < 4; i++) acts.push(makeActivity({ status: "cancelled" }));
      for (let i = 0; i < 8; i++) acts.push(makeActivity({ status: "completed" }));
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "high_cancellation");
      expect(found).toBeDefined();
    });
  });

  describe("follow_up_pending", () => {
    it("flags when there are follow-ups needed", () => {
      const parts = [
        makeParticipation({ follow_up_needed: true }),
        makeParticipation({ follow_up_needed: true }),
        makeParticipation({ follow_up_needed: false }),
      ];
      const alerts = identifyActivityAlerts([], parts, 0, NOW);
      const found = alerts.find((a) => a.type === "follow_up_pending");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
      expect(found!.id).toBe("follow_ups");
    });

    it("uses singular when 1 follow-up needed", () => {
      const parts = [makeParticipation({ follow_up_needed: true })];
      const alerts = identifyActivityAlerts([], parts, 0, NOW);
      const found = alerts.find((a) => a.type === "follow_up_pending");
      expect(found!.message).toContain("1 activity participation requires");
    });

    it("uses plural when multiple follow-ups needed", () => {
      const parts = [
        makeParticipation({ follow_up_needed: true }),
        makeParticipation({ follow_up_needed: true }),
        makeParticipation({ follow_up_needed: true }),
      ];
      const alerts = identifyActivityAlerts([], parts, 0, NOW);
      const found = alerts.find((a) => a.type === "follow_up_pending");
      expect(found!.message).toContain("3 activity participations require");
    });

    it("does not flag when no follow-ups needed", () => {
      const parts = [makeParticipation({ follow_up_needed: false })];
      const alerts = identifyActivityAlerts([], parts, 0, NOW);
      const found = alerts.find((a) => a.type === "follow_up_pending");
      expect(found).toBeUndefined();
    });
  });

  describe("combined scenarios", () => {
    it("returns multiple alert types simultaneously", () => {
      const acts = [
        makeActivity({ id: "a1", status: "planned", activity_date: "2026-05-20", risk_assessed: false, title: "Trip" }),
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "cancelled" }),
        makeActivity({ status: "completed" }),
        makeActivity({ status: "completed" }),
      ];
      const parts = [
        makeParticipation({ child_name: "X", child_id: "cx", participation_level: "declined" }),
        makeParticipation({ child_name: "X", child_id: "cx", participation_level: "absent" }),
        makeParticipation({ child_name: "X", child_id: "cx", participation_level: "declined" }),
        makeParticipation({ follow_up_needed: true }),
      ];
      const alerts = identifyActivityAlerts(acts, parts, 3, NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("not_risk_assessed");
      expect(types).toContain("high_cancellation");
      expect(types).toContain("repeated_decline");
      expect(types).toContain("follow_up_pending");
      expect(types).toContain("low_participation");
    });

    it("produces no alerts when everything is healthy", () => {
      const acts = [
        makeActivity({ status: "completed", risk_assessed: true }),
        makeActivity({ status: "completed", risk_assessed: true }),
      ];
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full", follow_up_needed: false }),
        makeParticipation({ child_id: "c2", participation_level: "full", follow_up_needed: false }),
      ];
      const alerts = identifyActivityAlerts(acts, parts, 2, NOW);
      expect(alerts).toHaveLength(0);
    });
  });

  describe("message content", () => {
    it("includes activity title in not_risk_assessed message", () => {
      const acts = [
        makeActivity({
          id: "a1",
          title: "Zoo Visit",
          status: "planned",
          activity_date: "2026-05-20",
          risk_assessed: false,
        }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      expect(alerts[0].message).toContain("Zoo Visit");
    });

    it("includes child name in repeated_decline message", () => {
      const parts = [
        makeParticipation({ child_name: "Jordan", participation_level: "declined" }),
        makeParticipation({ child_name: "Jordan", participation_level: "declined" }),
        makeParticipation({ child_name: "Jordan", participation_level: "declined" }),
      ];
      const alerts = identifyActivityAlerts([], parts, 0, NOW);
      const found = alerts.find((a) => a.type === "repeated_decline");
      expect(found!.message).toContain("Jordan");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallback (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

describe("CRUD fallback (Supabase disabled)", () => {
  it("listActivities returns ok with empty data", async () => {
    const { listActivities } = await import("../activity-planning-service");
    const result = await listActivities("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listActivities returns ok with filters", async () => {
    const { listActivities } = await import("../activity-planning-service");
    const result = await listActivities("home-1", { category: "music", status: "planned" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createActivity returns error when Supabase disabled", async () => {
    const { createActivity } = await import("../activity-planning-service");
    const result = await createActivity({
      homeId: "home-1",
      title: "Test",
      description: "Desc",
      category: "music",
      activityDate: "2026-05-20",
      startTime: "10:00",
      endTime: "11:00",
      location: "Hall",
      ledBy: "staff-1",
      maxParticipants: 6,
      riskAssessed: true,
      cost: 0,
      externalProvider: false,
    });
    expect(result).toEqual({ ok: false, error: "Supabase not configured" });
  });

  it("updateActivity returns error when Supabase disabled", async () => {
    const { updateActivity } = await import("../activity-planning-service");
    const result = await updateActivity("act-1", { title: "Updated" });
    expect(result).toEqual({ ok: false, error: "Supabase not configured" });
  });

  it("listParticipations returns ok with empty data", async () => {
    const { listParticipations } = await import("../activity-planning-service");
    const result = await listParticipations("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listParticipations returns ok with filters", async () => {
    const { listParticipations } = await import("../activity-planning-service");
    const result = await listParticipations("home-1", { activityId: "act-1", childId: "c-1" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createParticipation returns error when Supabase disabled", async () => {
    const { createParticipation } = await import("../activity-planning-service");
    const result = await createParticipation({
      homeId: "home-1",
      activityId: "act-1",
      childName: "Test Child",
      childId: "child-1",
      participationLevel: "full",
      skillsDeveloped: [],
      followUpNeeded: false,
    });
    expect(result).toEqual({ ok: false, error: "Supabase not configured" });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("large datasets", () => {
    it("handles 100 activities correctly", () => {
      const acts: Activity[] = [];
      for (let i = 0; i < 60; i++) acts.push(makeActivity({ status: "completed", cost: 10 }));
      for (let i = 0; i < 20; i++) acts.push(makeActivity({ status: "cancelled" }));
      for (let i = 0; i < 20; i++) acts.push(makeActivity({ status: "planned", activity_date: "2026-05-20" }));
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.total_activities).toBe(100);
      expect(m.completed_activities).toBe(60);
      expect(m.cancelled_rate).toBe(20);
      expect(m.total_cost).toBe(600);
      expect(m.upcoming_activities).toBe(20);
    });

    it("handles 200 participations correctly", () => {
      const parts: ActivityParticipation[] = [];
      for (let i = 0; i < 100; i++) {
        parts.push(
          makeParticipation({
            child_id: `child-${i % 10}`,
            participation_level: "full",
            enjoyment_rating: "loved_it",
          }),
        );
      }
      for (let i = 0; i < 100; i++) {
        parts.push(
          makeParticipation({
            child_id: `child-${(i % 10) + 10}`,
            participation_level: "partial",
            enjoyment_rating: "enjoyed",
          }),
        );
      }
      const m = computeActivityMetrics([], parts, 20, NOW);
      expect(m.total_participations).toBe(200);
      expect(m.children_participating).toBe(20);
      expect(m.participation_coverage).toBe(100);
      expect(m.enjoyment_positive_rate).toBe(100);
    });
  });

  describe("totalChildren = 0", () => {
    it("returns 0 coverage with zero totalChildren", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.participation_coverage).toBe(0);
    });

    it("does not produce low_participation alert with zero totalChildren", () => {
      const alerts = identifyActivityAlerts([], [], 0, NOW);
      expect(alerts.filter((a) => a.type === "low_participation")).toHaveLength(0);
    });
  });

  describe("empty skills_developed arrays", () => {
    it("computes avg_skills_developed as 0 when all arrays empty", () => {
      const parts = [
        makeParticipation({ participation_level: "full", skills_developed: [] }),
        makeParticipation({ participation_level: "full", skills_developed: [] }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.avg_skills_developed).toBe(0);
    });
  });

  describe("default now parameter", () => {
    it("computeActivityMetrics uses default now when not provided", () => {
      const acts = [
        makeActivity({ status: "planned", activity_date: "2099-12-31" }),
      ];
      const m = computeActivityMetrics(acts, [], 0);
      expect(m.upcoming_activities).toBe(1);
    });

    it("identifyActivityAlerts uses default now when not provided", () => {
      const acts = [
        makeActivity({
          id: "a1",
          title: "Future Trip",
          status: "planned",
          activity_date: "2099-12-31",
          risk_assessed: false,
        }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0);
      const found = alerts.find((a) => a.type === "not_risk_assessed");
      expect(found).toBeDefined();
    });
  });

  describe("type safety", () => {
    it("Activity interface fields are correct types in factory helper", () => {
      const a = makeActivity();
      expect(typeof a.id).toBe("string");
      expect(typeof a.home_id).toBe("string");
      expect(typeof a.title).toBe("string");
      expect(typeof a.description).toBe("string");
      expect(typeof a.category).toBe("string");
      expect(typeof a.activity_date).toBe("string");
      expect(typeof a.start_time).toBe("string");
      expect(typeof a.end_time).toBe("string");
      expect(typeof a.location).toBe("string");
      expect(typeof a.led_by).toBe("string");
      expect(typeof a.status).toBe("string");
      expect(typeof a.max_participants).toBe("number");
      expect(typeof a.risk_assessed).toBe("boolean");
      expect(typeof a.cost).toBe("number");
      expect(typeof a.external_provider).toBe("boolean");
      expect(typeof a.created_at).toBe("string");
      expect(typeof a.updated_at).toBe("string");
    });

    it("ActivityParticipation interface fields are correct types in factory helper", () => {
      const p = makeParticipation();
      expect(typeof p.id).toBe("string");
      expect(typeof p.home_id).toBe("string");
      expect(typeof p.activity_id).toBe("string");
      expect(typeof p.child_name).toBe("string");
      expect(typeof p.child_id).toBe("string");
      expect(typeof p.participation_level).toBe("string");
      expect(Array.isArray(p.skills_developed)).toBe(true);
      expect(typeof p.follow_up_needed).toBe("boolean");
      expect(typeof p.created_at).toBe("string");
    });

    it("Activity nullable fields default to null", () => {
      const a = makeActivity();
      expect(a.provider_name).toBeNull();
      expect(a.notes).toBeNull();
    });

    it("ActivityParticipation nullable fields can be null", () => {
      const p = makeParticipation({ enjoyment_rating: null, staff_observations: null, follow_up_notes: null });
      expect(p.enjoyment_rating).toBeNull();
      expect(p.staff_observations).toBeNull();
      expect(p.follow_up_notes).toBeNull();
    });
  });

  describe("duplicate child_id deduplication", () => {
    it("deduplicates across many participations for coverage", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "full" }),
        makeParticipation({ child_id: "c1", participation_level: "partial" }),
        makeParticipation({ child_id: "c2", participation_level: "full" }),
        makeParticipation({ child_id: "c2", participation_level: "full" }),
        makeParticipation({ child_id: "c3", participation_level: "partial" }),
        makeParticipation({ child_id: "c3", participation_level: "partial" }),
      ];
      const m = computeActivityMetrics([], parts, 5, NOW);
      expect(m.children_participating).toBe(3);
      expect(m.participation_coverage).toBe(60);
    });
  });

  describe("mixed participation and enjoyment edge cases", () => {
    it("observed_only counts as active for avg_skills_developed", () => {
      const parts = [
        makeParticipation({ participation_level: "observed_only", skills_developed: ["observation"] }),
      ];
      // active = 1 (observed_only), total skills = 1, avg = 1
      const m = computeActivityMetrics([], parts, 0, NOW);
      expect(m.avg_skills_developed).toBe(1);
    });

    it("observed_only does not count for children_participating", () => {
      const parts = [
        makeParticipation({ child_id: "c1", participation_level: "observed_only" }),
      ];
      const m = computeActivityMetrics([], parts, 1, NOW);
      expect(m.children_participating).toBe(0);
    });

    it("handles mix of all enjoyment ratings", () => {
      const parts = [
        makeParticipation({ enjoyment_rating: "loved_it" }),
        makeParticipation({ enjoyment_rating: "enjoyed" }),
        makeParticipation({ enjoyment_rating: "neutral" }),
        makeParticipation({ enjoyment_rating: "disliked" }),
        makeParticipation({ enjoyment_rating: "refused" }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      // 2 positive out of 5 rated = 40%
      expect(m.enjoyment_positive_rate).toBe(40);
    });

    it("handles mix of all participation levels", () => {
      const parts = [
        makeParticipation({ participation_level: "full" }),
        makeParticipation({ participation_level: "partial" }),
        makeParticipation({ participation_level: "observed_only" }),
        makeParticipation({ participation_level: "declined" }),
        makeParticipation({ participation_level: "absent" }),
      ];
      const m = computeActivityMetrics([], parts, 0, NOW);
      // full = 1 out of 5 = 20%
      expect(m.full_participation_rate).toBe(20);
      expect(m.by_participation).toEqual({
        full: 1,
        partial: 1,
        observed_only: 1,
        declined: 1,
        absent: 1,
      });
    });
  });

  describe("cancelled activities do not flag risk alert", () => {
    it("cancelled future activity without risk assessment is not flagged", () => {
      const acts = [
        makeActivity({
          status: "cancelled",
          activity_date: "2026-05-20",
          risk_assessed: false,
        }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "not_risk_assessed");
      expect(found).toBeUndefined();
    });
  });

  describe("postponed activities do not flag risk alert", () => {
    it("postponed future activity without risk assessment is not flagged", () => {
      const acts = [
        makeActivity({
          status: "postponed",
          activity_date: "2026-05-20",
          risk_assessed: false,
        }),
      ];
      const alerts = identifyActivityAlerts(acts, [], 0, NOW);
      const found = alerts.find((a) => a.type === "not_risk_assessed");
      expect(found).toBeUndefined();
    });
  });

  describe("external_provider with provider_name", () => {
    it("counts external providers correctly with names", () => {
      const acts = [
        makeActivity({ external_provider: true, provider_name: "Sports Academy" }),
        makeActivity({ external_provider: true, provider_name: "Music School" }),
        makeActivity({ external_provider: false, provider_name: null }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.external_provider_count).toBe(2);
    });
  });

  describe("cost edge cases", () => {
    it("handles decimal costs correctly", () => {
      const acts = [
        makeActivity({ cost: 10.99 }),
        makeActivity({ cost: 5.01 }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.total_cost).toBe(16);
    });

    it("handles zero cost activities", () => {
      const acts = [
        makeActivity({ cost: 0 }),
        makeActivity({ cost: 0 }),
      ];
      const m = computeActivityMetrics(acts, [], 0, NOW);
      expect(m.total_cost).toBe(0);
    });
  });
});
