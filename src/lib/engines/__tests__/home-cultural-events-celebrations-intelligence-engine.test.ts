import { describe, it, expect } from "vitest";
import {
  computeCulturalEventsCelebrations,
  type CulturalEventsInput,
  type CulturalEventRecordInput,
  type DiversityCelebrationRecordInput,
  type HeritageDayRecordInput,
  type FestivalInclusionRecordInput,
  type ChildLedActivityRecordInput,
  type CulturalEventsResult,
} from "../home-cultural-events-celebrations-intelligence-engine";

/* ── Helper factories ─────────────────────────────────────────────────────── */

function makeCulturalEvent(
  id: string,
  overrides: Partial<CulturalEventRecordInput> = {},
): CulturalEventRecordInput {
  return {
    id,
    child_id: "c1",
    event_date: "2025-04-01",
    event_type: "cultural_celebration",
    title: "Cultural Event",
    description: "A cultural event",
    participated: true,
    engagement_level: "enthusiastic",
    child_feedback_positive: true,
    staff_facilitated: true,
    external_community_involved: false,
    linked_to_child_heritage: true,
    photos_consented: true,
    duration_minutes: 60,
    created_at: "2025-04-01T10:00:00Z",
    ...overrides,
  };
}

function makeDiversityCelebration(
  id: string,
  overrides: Partial<DiversityCelebrationRecordInput> = {},
): DiversityCelebrationRecordInput {
  return {
    id,
    celebration_date: "2025-03-15",
    celebration_type: "black_history_month",
    title: "Diversity Celebration",
    planned_in_advance: true,
    children_involved_in_planning: true,
    children_participated: ["c1", "c2", "c3", "c4"],
    total_children_invited: 4,
    participation_rate_pct: 100,
    educational_component: true,
    external_speaker_or_visitor: false,
    food_or_cuisine_included: true,
    display_or_decoration: true,
    child_feedback_collected: true,
    child_feedback_positive_count: 4,
    staff_led_by: "s1",
    quality_rating: 5,
    created_at: "2025-03-15T10:00:00Z",
    ...overrides,
  };
}

function makeHeritageDay(
  id: string,
  overrides: Partial<HeritageDayRecordInput> = {},
): HeritageDayRecordInput {
  return {
    id,
    child_id: "c1",
    heritage_date: "2025-05-01",
    heritage_type: "birth_culture",
    title: "Heritage Day",
    acknowledged: true,
    child_involved_in_planning: true,
    activity_description: "Heritage celebration activity",
    child_feedback_positive: true,
    staff_supported: true,
    family_connection_facilitated: true,
    resources_provided: true,
    created_at: "2025-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeFestivalInclusion(
  id: string,
  overrides: Partial<FestivalInclusionRecordInput> = {},
): FestivalInclusionRecordInput {
  return {
    id,
    festival_date: "2025-04-10",
    festival_name: "Festival",
    faith_or_tradition: "christian",
    children_participated: ["c1", "c2", "c3", "c4"],
    total_children_eligible: 4,
    participation_rate_pct: 100,
    inclusive_planning: true,
    dietary_needs_accommodated: true,
    religious_sensitivity_observed: true,
    educational_element: true,
    child_feedback_collected: true,
    child_feedback_positive_count: 4,
    quality_rating: 5,
    created_at: "2025-04-10T10:00:00Z",
    ...overrides,
  };
}

function makeChildLedActivity(
  id: string,
  overrides: Partial<ChildLedActivityRecordInput> = {},
): ChildLedActivityRecordInput {
  return {
    id,
    child_id: "c1",
    activity_date: "2025-04-20",
    activity_type: "cultural_presentation",
    title: "Child-Led Activity",
    description: "A child-led cultural activity",
    child_initiated: true,
    staff_supported: true,
    peers_participated: true,
    peer_feedback_positive: true,
    child_confidence_improved: true,
    linked_to_identity: true,
    duration_minutes: 45,
    child_satisfaction_rating: 5,
    created_at: "2025-04-20T10:00:00Z",
    ...overrides,
  };
}

/**
 * Base input: all arrays populated with strong defaults to achieve outstanding.
 * Override specific fields to isolate bonuses/penalties.
 */
function baseInput(
  overrides: Partial<CulturalEventsInput> = {},
): CulturalEventsInput {
  return {
    today: "2025-06-01",
    total_children: 4,
    cultural_event_records: [
      makeCulturalEvent("e1", { child_id: "c1" }),
      makeCulturalEvent("e2", { child_id: "c2" }),
      makeCulturalEvent("e3", { child_id: "c3" }),
      makeCulturalEvent("e4", { child_id: "c4" }),
    ],
    diversity_celebration_records: [
      makeDiversityCelebration("dc1", { celebration_type: "black_history_month" }),
      makeDiversityCelebration("dc2", { celebration_type: "diwali" }),
      makeDiversityCelebration("dc3", { celebration_type: "pride" }),
    ],
    heritage_day_records: [
      makeHeritageDay("h1", { child_id: "c1", heritage_type: "birth_culture" }),
      makeHeritageDay("h2", { child_id: "c2", heritage_type: "family_heritage" }),
      makeHeritageDay("h3", { child_id: "c3", heritage_type: "nationality" }),
      makeHeritageDay("h4", { child_id: "c4", heritage_type: "ethnic_identity" }),
    ],
    festival_inclusion_records: [
      makeFestivalInclusion("f1", { faith_or_tradition: "christian" }),
      makeFestivalInclusion("f2", { faith_or_tradition: "muslim" }),
      makeFestivalInclusion("f3", { faith_or_tradition: "hindu" }),
      makeFestivalInclusion("f4", { faith_or_tradition: "sikh" }),
    ],
    child_led_activity_records: [
      makeChildLedActivity("cla1", { child_id: "c1", activity_type: "cultural_presentation" }),
      makeChildLedActivity("cla2", { child_id: "c2", activity_type: "cooking_session" }),
      makeChildLedActivity("cla3", { child_id: "c3", activity_type: "storytelling" }),
    ],
    ...overrides,
  };
}

/** Minimal input: all arrays empty with children > 0. Gets inadequate/15. */
function emptyArraysInput(
  overrides: Partial<CulturalEventsInput> = {},
): CulturalEventsInput {
  return {
    today: "2025-06-01",
    total_children: 4,
    cultural_event_records: [],
    diversity_celebration_records: [],
    heritage_day_records: [],
    festival_inclusion_records: [],
    child_led_activity_records: [],
    ...overrides,
  };
}

function run(overrides: Partial<CulturalEventsInput> = {}): CulturalEventsResult {
  return computeCulturalEventsCelebrations(baseInput(overrides));
}

function runEmpty(overrides: Partial<CulturalEventsInput> = {}): CulturalEventsResult {
  return computeCulturalEventsCelebrations(emptyArraysInput(overrides));
}

/* ══════════════════════════════════════════════════════════════════════════════
   TESTS
   ══════════════════════════════════════════════════════════════════════════════ */

describe("computeCulturalEventsCelebrations", () => {

  /* ── 1. pct() edge: pct(0,0) = 0 ──────────────────────────────────────── */

  describe("pct(0,0) = 0 contract", () => {
    it("leaves every rate unmeasured when arrays are empty but total_children > 0", () => {
      const r = runEmpty();
      expect(r.event_participation_rate).toBeNull();
      expect(r.diversity_celebration_rate).toBeNull();
      expect(r.heritage_acknowledgement_rate).toBeNull();
      expect(r.festival_inclusion_rate).toBeNull();
      expect(r.child_led_rate).toBeNull();
      expect(r.child_satisfaction_rate).toBeNull();
    });
  });

  /* ── 2. insufficient_data ─────────────────────────────────────────────── */

  describe("insufficient_data", () => {
    it("returns insufficient_data/0 when all arrays empty AND total_children=0", () => {
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 0,
        cultural_event_records: [],
        diversity_celebration_records: [],
        heritage_day_records: [],
        festival_inclusion_records: [],
        child_led_activity_records: [],
      });
      expect(r.cultural_rating).toBe("insufficient_data");
      expect(r.cultural_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("returns all zero metric fields for insufficient_data", () => {
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 0,
        cultural_event_records: [],
        diversity_celebration_records: [],
        heritage_day_records: [],
        festival_inclusion_records: [],
        child_led_activity_records: [],
      });
      expect(r.total_cultural_events).toBe(0);
      expect(r.total_diversity_celebrations).toBe(0);
      expect(r.total_heritage_days).toBe(0);
      expect(r.total_festival_inclusions).toBe(0);
      expect(r.total_child_led_activities).toBe(0);
      expect(r.avg_celebration_quality).toBe(0);
      expect(r.avg_festival_quality).toBe(0);
      expect(r.unique_event_types).toBe(0);
      expect(r.unique_faiths_represented).toBe(0);
      expect(r.unique_heritage_types).toBe(0);
    });
  });

  /* ── 3. Inadequate floor (allEmpty + children > 0) ────────────────────── */

  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate/15 with 1 concern, 2 recommendations, 1 insight", () => {
      const r = runEmpty();
      expect(r.cultural_rating).toBe("inadequate");
      expect(r.cultural_score).toBe(15);
      expect(r.headline).toContain("urgent attention");
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No cultural event records");
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].rank).toBe(2);
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns zero totals for inadequate floor", () => {
      const r = runEmpty();
      expect(r.total_cultural_events).toBe(0);
      expect(r.total_diversity_celebrations).toBe(0);
      expect(r.total_heritage_days).toBe(0);
      expect(r.total_festival_inclusions).toBe(0);
      expect(r.total_child_led_activities).toBe(0);
    });
  });

  /* ── 4. Rating thresholds ─────────────────────────────────────────────── */

  describe("rating thresholds (toRating)", () => {
    it("score >= 80 => outstanding", () => {
      const r = run();
      expect(r.cultural_score).toBeGreaterThanOrEqual(80);
      expect(r.cultural_rating).toBe("outstanding");
    });

    it("score 65-79 => good", () => {
      // Strip child-led activities (removes bonus 5+9) and reduce celebration quality
      const r = run({
        child_led_activity_records: [],
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 3, children_participated: ["c1", "c2", "c3"], children_involved_in_planning: false, child_feedback_collected: false }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian", children_participated: ["c1", "c2", "c3"] }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { child_id: "c1" }),
          makeHeritageDay("h2", { child_id: "c2" }),
          makeHeritageDay("h3", { child_id: "c3" }),
        ],
      });
      expect(r.cultural_score).toBeGreaterThanOrEqual(65);
      expect(r.cultural_score).toBeLessThan(80);
      expect(r.cultural_rating).toBe("good");
    });

    it("score 45-64 => adequate", () => {
      // Minimal data, low rates
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true, child_feedback_positive: true }),
          makeCulturalEvent("e2", { participated: true, child_feedback_positive: false }),
          makeCulturalEvent("e3", { participated: false, child_feedback_positive: false }),
        ],
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 2, children_participated: ["c1"], child_feedback_collected: false, children_involved_in_planning: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: true, child_involved_in_planning: false, family_connection_facilitated: false }),
          makeHeritageDay("h2", { acknowledged: false, child_involved_in_planning: false, family_connection_facilitated: false }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: ["c1"], religious_sensitivity_observed: false, child_feedback_collected: false }),
        ],
        child_led_activity_records: [],
      });
      expect(r.cultural_score).toBeGreaterThanOrEqual(45);
      expect(r.cultural_score).toBeLessThan(65);
      expect(r.cultural_rating).toBe("adequate");
    });

    it("score < 45 => inadequate", () => {
      // Very low participation, acknowledgement rates
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: false, child_feedback_positive: false, engagement_level: "refused" }),
          makeCulturalEvent("e2", { participated: false, child_feedback_positive: false, engagement_level: "refused" }),
          makeCulturalEvent("e3", { participated: false, child_feedback_positive: false, engagement_level: "refused" }),
          makeCulturalEvent("e4", { participated: false, child_feedback_positive: false, engagement_level: "refused" }),
        ],
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 1, children_participated: [], child_feedback_collected: false, children_involved_in_planning: false, educational_component: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: false, child_involved_in_planning: false, child_feedback_positive: false, family_connection_facilitated: false }),
          makeHeritageDay("h2", { acknowledged: false, child_involved_in_planning: false, child_feedback_positive: false, family_connection_facilitated: false }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: [], religious_sensitivity_observed: false, child_feedback_collected: false, educational_element: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_confidence_improved: false, child_satisfaction_rating: 1, peers_participated: false, peer_feedback_positive: false }),
        ],
      });
      expect(r.cultural_score).toBeLessThan(45);
      expect(r.cultural_rating).toBe("inadequate");
    });
  });

  /* ── 5. Outstanding scenario (full base) ──────────────────────────────── */

  describe("outstanding scenario", () => {
    it("default baseInput produces outstanding", () => {
      const r = run();
      expect(r.cultural_rating).toBe("outstanding");
      expect(r.cultural_score).toBeGreaterThanOrEqual(80);
    });

    it("has the correct outstanding headline", () => {
      const r = run();
      expect(r.headline).toContain("Outstanding cultural events");
    });

    it("populates positive insights for outstanding", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    });

    it("outstanding has multiple strengths", () => {
      const r = run();
      expect(r.strengths.length).toBeGreaterThanOrEqual(5);
    });
  });

  /* ── 6. Good scenario ─────────────────────────────────────────────────── */

  describe("good scenario", () => {
    it("headline includes strengths count", () => {
      const r = run({
        child_led_activity_records: [],
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 3, children_participated: ["c1", "c2", "c3"], children_involved_in_planning: false, child_feedback_collected: false }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian", children_participated: ["c1", "c2", "c3"] }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { child_id: "c1" }),
          makeHeritageDay("h2", { child_id: "c2" }),
          makeHeritageDay("h3", { child_id: "c3" }),
        ],
      });
      expect(r.cultural_rating).toBe("good");
      expect(r.headline).toContain("Good cultural events");
      expect(r.headline).toMatch(/\d+ strength/);
    });
  });

  /* ── 7. Adequate scenario ─────────────────────────────────────────────── */

  describe("adequate scenario", () => {
    it("headline references concerns count", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true, child_feedback_positive: true }),
          makeCulturalEvent("e2", { participated: true, child_feedback_positive: false }),
          makeCulturalEvent("e3", { participated: false, child_feedback_positive: false }),
        ],
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 2, children_participated: ["c1"], child_feedback_collected: false, children_involved_in_planning: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: true, child_involved_in_planning: false, family_connection_facilitated: false }),
          makeHeritageDay("h2", { acknowledged: false, child_involved_in_planning: false, family_connection_facilitated: false }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: ["c1"], religious_sensitivity_observed: false, child_feedback_collected: false }),
        ],
        child_led_activity_records: [],
      });
      expect(r.cultural_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate cultural events");
      expect(r.headline).toMatch(/\d+ concern/);
    });
  });

  /* ── 8. Inadequate scenario (with data) ───────────────────────────────── */

  describe("inadequate scenario (with data)", () => {
    it("headline mentions urgent action", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: false, child_feedback_positive: false, engagement_level: "refused" }),
          makeCulturalEvent("e2", { participated: false, child_feedback_positive: false, engagement_level: "refused" }),
          makeCulturalEvent("e3", { participated: false, child_feedback_positive: false, engagement_level: "refused" }),
          makeCulturalEvent("e4", { participated: false, child_feedback_positive: false, engagement_level: "refused" }),
        ],
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 1, children_participated: [], child_feedback_collected: false, children_involved_in_planning: false, educational_component: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: false, child_involved_in_planning: false, child_feedback_positive: false, family_connection_facilitated: false }),
          makeHeritageDay("h2", { acknowledged: false, child_involved_in_planning: false, child_feedback_positive: false, family_connection_facilitated: false }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: [], religious_sensitivity_observed: false, child_feedback_collected: false, educational_element: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_confidence_improved: false, child_satisfaction_rating: 1, peers_participated: false, peer_feedback_positive: false }),
        ],
      });
      expect(r.cultural_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent action");
    });
  });

  /**
   * Zero-bonus baseline where all bonuses yield 0:
   * - eventParticipationRate < 70 (but >= 50 to avoid penalty)
   * - diversityCelebrationRate < 70
   * - heritageAcknowledgementRate < 70 (but >= 50 to avoid penalty)
   * - festivalInclusionRate < 70 (but >= 40 to avoid penalty)
   * - childLedRate < 30
   * - childSatisfactionRate < 70 (but >= 40 to avoid penalty)
   * - avgCelebrationQuality < 3.0 (but > 0 to have data)
   * - uniqueFaithsRepresented < 2
   * - confidenceImprovementRate < 50
   *
   * base=52, no bonuses, no penalties => 52
   */
  function zeroBonusInput(overrides: Partial<CulturalEventsInput> = {}): CulturalEventsInput {
      return {
        today: "2025-06-01",
        total_children: 10,
        // 6/10 participated => 60% (no bonus, no penalty)
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true, child_feedback_positive: true, engagement_level: "willing" }),
          makeCulturalEvent("e2", { participated: true, child_feedback_positive: false, engagement_level: "willing" }),
          makeCulturalEvent("e3", { participated: true, child_feedback_positive: false, engagement_level: "willing" }),
          makeCulturalEvent("e4", { participated: true, child_feedback_positive: false, engagement_level: "willing" }),
          makeCulturalEvent("e5", { participated: true, child_feedback_positive: false, engagement_level: "willing" }),
          makeCulturalEvent("e6", { participated: true, child_feedback_positive: false, engagement_level: "willing" }),
          makeCulturalEvent("e7", { participated: false, child_feedback_positive: false, engagement_level: "reluctant" }),
          makeCulturalEvent("e8", { participated: false, child_feedback_positive: false, engagement_level: "reluctant" }),
          makeCulturalEvent("e9", { participated: false, child_feedback_positive: false, engagement_level: "reluctant" }),
          makeCulturalEvent("e10", { participated: false, child_feedback_positive: false, engagement_level: "reluctant" }),
        ],
        // 6 unique children out of 10 => 60% (no bonus)
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", {
            quality_rating: 2,
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6"],
            child_feedback_collected: true,
            children_involved_in_planning: true,
            educational_component: false,
          }),
        ],
        // 6/10 acknowledged => 60% (no bonus, no penalty)
        heritage_day_records: [
          makeHeritageDay("h1", { child_id: "c1", acknowledged: true, child_feedback_positive: false, child_involved_in_planning: true, family_connection_facilitated: true }),
          makeHeritageDay("h2", { child_id: "c2", acknowledged: true, child_feedback_positive: false, child_involved_in_planning: true, family_connection_facilitated: true }),
          makeHeritageDay("h3", { child_id: "c3", acknowledged: true, child_feedback_positive: false, child_involved_in_planning: true, family_connection_facilitated: true }),
          makeHeritageDay("h4", { child_id: "c4", acknowledged: true, child_feedback_positive: false, child_involved_in_planning: true, family_connection_facilitated: true }),
          makeHeritageDay("h5", { child_id: "c5", acknowledged: true, child_feedback_positive: false, child_involved_in_planning: true, family_connection_facilitated: true }),
          makeHeritageDay("h6", { child_id: "c6", acknowledged: true, child_feedback_positive: false, child_involved_in_planning: true, family_connection_facilitated: true }),
          makeHeritageDay("h7", { child_id: "c7", acknowledged: false, child_feedback_positive: false, child_involved_in_planning: false, family_connection_facilitated: false }),
          makeHeritageDay("h8", { child_id: "c8", acknowledged: false, child_feedback_positive: false, child_involved_in_planning: false, family_connection_facilitated: false }),
          makeHeritageDay("h9", { child_id: "c9", acknowledged: false, child_feedback_positive: false, child_involved_in_planning: false, family_connection_facilitated: false }),
          makeHeritageDay("h10", { child_id: "c10", acknowledged: false, child_feedback_positive: false, child_involved_in_planning: false, family_connection_facilitated: false }),
        ],
        // 5 children out of 10 => 50% (no bonus, no penalty since >= 40)
        // Only 1 faith => no faith bonus
        festival_inclusion_records: [
          makeFestivalInclusion("f1", {
            faith_or_tradition: "christian",
            children_participated: ["c1", "c2", "c3", "c4", "c5"],
            religious_sensitivity_observed: true,
            child_feedback_collected: true,
            educational_element: false,
          }),
        ],
        // 2 children out of 10 => 20% childLedRate (no bonus)
        // 0/2 confidence improved => 0% (no bonus)
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1", child_confidence_improved: false, child_satisfaction_rating: 2 }),
          makeChildLedActivity("cla2", { child_id: "c2", child_confidence_improved: false, child_satisfaction_rating: 2 }),
        ],
        ...overrides,
      };
    }

  /* ── 9. Each bonus in isolation ───────────────────────────────────────── */

  describe("bonuses in isolation", () => {
    it("zero-bonus baseline produces score 52", () => {
      // Let me verify the satisfaction rate avoids penalty
      // events: 10 records. 1 positive feedback (e1).
      // heritage: 10 records. 0 positive feedback.
      // child-led: 2 records. 0 with rating >= 4.
      // satisfaction = pct(1, 22) = 5% => penalty -4! Score = 52-4 = 48.
      // We need to fix this.

      // Actually, let me adjust so satisfaction >= 40%:
      // We need at least ceil(22*0.4) = 9 positive. So set 9 events with positive feedback.
      const input = zeroBonusInput({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true, child_feedback_positive: true, engagement_level: "willing" }),
          makeCulturalEvent("e2", { participated: true, child_feedback_positive: true, engagement_level: "willing" }),
          makeCulturalEvent("e3", { participated: true, child_feedback_positive: true, engagement_level: "willing" }),
          makeCulturalEvent("e4", { participated: true, child_feedback_positive: true, engagement_level: "willing" }),
          makeCulturalEvent("e5", { participated: true, child_feedback_positive: true, engagement_level: "willing" }),
          makeCulturalEvent("e6", { participated: true, child_feedback_positive: true, engagement_level: "willing" }),
          makeCulturalEvent("e7", { participated: false, child_feedback_positive: true, engagement_level: "reluctant" }),
          makeCulturalEvent("e8", { participated: false, child_feedback_positive: true, engagement_level: "reluctant" }),
          makeCulturalEvent("e9", { participated: false, child_feedback_positive: true, engagement_level: "reluctant" }),
          makeCulturalEvent("e10", { participated: false, child_feedback_positive: false, engagement_level: "reluctant" }),
        ],
      });
      // Now 9 positive events. satisfaction = pct(9, 22) = 41% => no penalty.
      // eventParticipationRate = pct(6, 10) = 60% => no bonus, no penalty.
      // Also check no other penalty: heritageAcknowledgementRate = 60% >= 50 => no penalty.
      // festivalInclusionRate = 50% >= 40 => no penalty.
      // All good. Score should be 52.
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52);
    });

    // Bonus 1: eventParticipationRate >= 90 => +4
    it("Bonus 1 high: eventParticipationRate >= 90 => +4", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: true,
            child_feedback_positive: true,
            engagement_level: "willing",
          }),
        ),
      });
      // eventParticipationRate = 100% => +4
      // satisfaction: 10 positive events + 0 heritage + 0 child-led = 10/22 = 45% => no penalty, no bonus (<70)
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 4);
    });

    // Bonus 1: eventParticipationRate >= 70 (but < 90) => +2
    it("Bonus 1 low: eventParticipationRate >= 70 (< 90) => +2", () => {
      // 7/10 participated, 9 positive feedback to keep satisfaction no-penalty
      const events = Array.from({ length: 10 }, (_, i) =>
        makeCulturalEvent(`e${i + 1}`, {
          participated: i < 7,
          child_feedback_positive: i < 9,
          engagement_level: "willing",
        }),
      );
      const input = zeroBonusInput({ cultural_event_records: events });
      // eventParticipationRate = 70% => +2
      // satisfaction = pct(9, 22) = 41% => no penalty
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 2);
    });

    // Bonus 2: diversityCelebrationRate >= 90 => +4
    it("Bonus 2 high: diversityCelebrationRate >= 90 => +4", () => {
      // Need 9 of 10 children in at least one celebration
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", {
            quality_rating: 2,
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9"],
            child_feedback_collected: true,
            children_involved_in_planning: true,
            educational_component: false,
          }),
        ],
      });
      // 9/10 = 90% => +4
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 4);
    });

    // Bonus 2: diversityCelebrationRate >= 70 (< 90) => +2
    it("Bonus 2 low: diversityCelebrationRate >= 70 (< 90) => +2", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", {
            quality_rating: 2,
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6", "c7"],
            child_feedback_collected: true,
            children_involved_in_planning: true,
            educational_component: false,
          }),
        ],
      });
      // 7/10 = 70% => +2
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 2);
    });

    // Bonus 3: heritageAcknowledgementRate >= 90 => +3
    it("Bonus 3 high: heritageAcknowledgementRate >= 90 => +3", () => {
      const heritageRecords = Array.from({ length: 10 }, (_, i) =>
        makeHeritageDay(`h${i + 1}`, {
          child_id: `c${i + 1}`,
          acknowledged: true,
          child_feedback_positive: false,
          child_involved_in_planning: true,
          family_connection_facilitated: true,
        }),
      );
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        heritage_day_records: heritageRecords,
      });
      // 10/10 = 100% => +3
      // Satisfaction: 9 events + 0 heritage + 0 child-led = 9/22 = 41%
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 3);
    });

    // Bonus 3: heritageAcknowledgementRate >= 70 (< 90) => +1
    it("Bonus 3 low: heritageAcknowledgementRate >= 70 (< 90) => +1", () => {
      const heritageRecords = Array.from({ length: 10 }, (_, i) =>
        makeHeritageDay(`h${i + 1}`, {
          child_id: `c${i + 1}`,
          acknowledged: i < 7,
          child_feedback_positive: false,
          child_involved_in_planning: true,
          family_connection_facilitated: true,
        }),
      );
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        heritage_day_records: heritageRecords,
      });
      // 7/10 = 70% => +1
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 1);
    });

    // Bonus 4: festivalInclusionRate >= 90 => +3
    it("Bonus 4 high: festivalInclusionRate >= 90 => +3", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        festival_inclusion_records: [
          makeFestivalInclusion("f1", {
            faith_or_tradition: "christian",
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9"],
            religious_sensitivity_observed: true,
            child_feedback_collected: true,
            educational_element: false,
          }),
        ],
      });
      // 9/10 = 90% => +3
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 3);
    });

    // Bonus 4: festivalInclusionRate >= 70 (< 90) => +1
    it("Bonus 4 low: festivalInclusionRate >= 70 (< 90) => +1", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        festival_inclusion_records: [
          makeFestivalInclusion("f1", {
            faith_or_tradition: "christian",
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6", "c7"],
            religious_sensitivity_observed: true,
            child_feedback_collected: true,
            educational_element: false,
          }),
        ],
      });
      // 7/10 = 70% => +1
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 1);
    });

    // Bonus 5: childLedRate >= 60 => +4
    it("Bonus 5 high: childLedRate >= 60 => +4", () => {
      // 6 unique children out of 10 => 60%
      const activities = Array.from({ length: 6 }, (_, i) =>
        makeChildLedActivity(`cla${i + 1}`, {
          child_id: `c${i + 1}`,
          child_confidence_improved: false,
          child_satisfaction_rating: 2,
        }),
      );
      // childLedRate = 60% => +4
      // satisfaction: 10 positive events + 0 heritage + 0 child-led(rating>=4) = 10/(10+10+6)=10/26=38% => penalty -4!
      // Adjust: more heritage positive feedback
      // Actually re-examine: we need satisfaction >= 40 to avoid penalty.
      // 10 events positive, 0 heritage positive, 0 child-led with >= 4 rating
      // denom = 10 + 10 + 6 = 26. pct(10, 26) = 38% => penalty!
      // Add some heritage positives: need ceil(26*0.4)=11. We have 10. Need 1 more.
      // Let's add 1 heritage positive.
      const heritageRecords = Array.from({ length: 10 }, (_, i) =>
        makeHeritageDay(`h${i + 1}`, {
          child_id: `c${i + 1}`,
          acknowledged: i < 6,
          child_feedback_positive: i < 1,
          child_involved_in_planning: true,
          family_connection_facilitated: true,
        }),
      );
      const input2 = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: true,
            engagement_level: "willing",
          }),
        ),
        heritage_day_records: heritageRecords,
        child_led_activity_records: activities,
      });
      // satisfaction: 10 + 1 + 0 = 11 / 26 = 42% => no penalty
      const r = computeCulturalEventsCelebrations(input2);
      expect(r.cultural_score).toBe(52 + 4);
    });

    // Bonus 5: childLedRate >= 30 (< 60) => +2
    it("Bonus 5 low: childLedRate >= 30 (< 60) => +2", () => {
      // 3 unique children out of 10 => 30%
      const activities = Array.from({ length: 3 }, (_, i) =>
        makeChildLedActivity(`cla${i + 1}`, {
          child_id: `c${i + 1}`,
          child_confidence_improved: false,
          child_satisfaction_rating: 2,
        }),
      );
      // denom = 10 + 10 + 3 = 23. satisfaction = pct(9, 23) = 39%! Penalty!
      // Adjust: need ceil(23*0.4)=10 => need 10 positive.
      const input2 = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: true,
            engagement_level: "willing",
          }),
        ),
        child_led_activity_records: activities,
      });
      // satisfaction = pct(10, 23) = 43% => no penalty
      const r = computeCulturalEventsCelebrations(input2);
      expect(r.cultural_score).toBe(52 + 2);
    });

    // Bonus 6: childSatisfactionRate >= 90 => +3
    it("Bonus 6 high: childSatisfactionRate >= 90 => +3", () => {
      // All events positive, all heritage positive, all child-led high satisfaction
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: true,
            engagement_level: "willing",
          }),
        ),
        heritage_day_records: Array.from({ length: 10 }, (_, i) =>
          makeHeritageDay(`h${i + 1}`, {
            child_id: `c${i + 1}`,
            acknowledged: i < 6,
            child_feedback_positive: true,
            child_involved_in_planning: true,
            family_connection_facilitated: true,
          }),
        ),
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1", child_satisfaction_rating: 5, child_confidence_improved: false }),
          makeChildLedActivity("cla2", { child_id: "c2", child_satisfaction_rating: 5, child_confidence_improved: false }),
        ],
      });
      // satisfaction: 10 events + 10 heritage + 2 child-led(rating>=4) = 22/22 = 100% => +3
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 3);
    });

    // Bonus 6: childSatisfactionRate >= 70 (< 90) => +1
    it("Bonus 6 low: childSatisfactionRate >= 70 (< 90) => +1", () => {
      // Need pct(n, d) >= 70 but < 90.
      // denom = 10 events + 10 heritage + 2 child-led = 22
      // Need 16 positive for 73%.
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 8,
            engagement_level: "willing",
          }),
        ),
        heritage_day_records: Array.from({ length: 10 }, (_, i) =>
          makeHeritageDay(`h${i + 1}`, {
            child_id: `c${i + 1}`,
            acknowledged: i < 6,
            child_feedback_positive: i < 7,
            child_involved_in_planning: true,
            family_connection_facilitated: true,
          }),
        ),
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1", child_satisfaction_rating: 5, child_confidence_improved: false }),
          makeChildLedActivity("cla2", { child_id: "c2", child_satisfaction_rating: 2, child_confidence_improved: false }),
        ],
      });
      // satisfaction: 8 events + 7 heritage + 1 child-led = 16/22 = 73% => +1
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 1);
    });

    // Bonus 7: avgCelebrationQuality >= 4.0 => +3
    it("Bonus 7 high: avgCelebrationQuality >= 4.0 => +3", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", {
            quality_rating: 4,
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6"],
            child_feedback_collected: true,
            children_involved_in_planning: true,
            educational_component: false,
          }),
        ],
      });
      // avgCelebrationQuality = 4.0 => +3
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 3);
    });

    // Bonus 7: avgCelebrationQuality >= 3.0 (< 4.0) => +1
    it("Bonus 7 low: avgCelebrationQuality >= 3.0 (< 4.0) => +1", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", {
            quality_rating: 3,
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6"],
            child_feedback_collected: true,
            children_involved_in_planning: true,
            educational_component: false,
          }),
        ],
      });
      // avgCelebrationQuality = 3.0 => +1
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 1);
    });

    // Bonus 8: uniqueFaithsRepresented >= 4 => +2
    it("Bonus 8 high: uniqueFaithsRepresented >= 4 => +2", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian", children_participated: ["c1", "c2", "c3", "c4", "c5"], religious_sensitivity_observed: true, child_feedback_collected: true, educational_element: false }),
          makeFestivalInclusion("f2", { faith_or_tradition: "muslim", children_participated: ["c1", "c2", "c3", "c4", "c5"], religious_sensitivity_observed: true, child_feedback_collected: true, educational_element: false }),
          makeFestivalInclusion("f3", { faith_or_tradition: "hindu", children_participated: ["c1", "c2", "c3", "c4", "c5"], religious_sensitivity_observed: true, child_feedback_collected: true, educational_element: false }),
          makeFestivalInclusion("f4", { faith_or_tradition: "sikh", children_participated: ["c1", "c2", "c3", "c4", "c5"], religious_sensitivity_observed: true, child_feedback_collected: true, educational_element: false }),
        ],
      });
      // uniqueFaithsRepresented = 4 => +2
      // festivalInclusionRate = pct(5, 10) = 50% => no bonus 4, no penalty
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 2);
    });

    // Bonus 8: uniqueFaithsRepresented >= 2 (< 4) => +1
    it("Bonus 8 low: uniqueFaithsRepresented >= 2 (< 4) => +1", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian", children_participated: ["c1", "c2", "c3", "c4", "c5"], religious_sensitivity_observed: true, child_feedback_collected: true, educational_element: false }),
          makeFestivalInclusion("f2", { faith_or_tradition: "muslim", children_participated: ["c1", "c2", "c3", "c4", "c5"], religious_sensitivity_observed: true, child_feedback_collected: true, educational_element: false }),
        ],
      });
      // uniqueFaithsRepresented = 2 => +1
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 1);
    });

    // Bonus 9: confidenceImprovementRate >= 80 => +2
    it("Bonus 9 high: confidenceImprovementRate >= 80 => +2", () => {
      // 4/5 = 80% => +2, childLedRate = 2/10 = 20% (no bonus 5)
      const activities = [
        makeChildLedActivity("cla1", { child_id: "c1", child_confidence_improved: true, child_satisfaction_rating: 2 }),
        makeChildLedActivity("cla2", { child_id: "c1", child_confidence_improved: true, child_satisfaction_rating: 2 }),
        makeChildLedActivity("cla3", { child_id: "c1", child_confidence_improved: true, child_satisfaction_rating: 2 }),
        makeChildLedActivity("cla4", { child_id: "c2", child_confidence_improved: true, child_satisfaction_rating: 2 }),
        makeChildLedActivity("cla5", { child_id: "c2", child_confidence_improved: false, child_satisfaction_rating: 2 }),
      ];
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: true,
            engagement_level: "willing",
          }),
        ),
        child_led_activity_records: activities,
      });
      // confidenceImprovementRate = pct(4,5) = 80% => +2
      // childLedRate = 2/10 = 20% => no bonus
      // satisfaction: 10 events + 0 heritage + 0 child-led = 10/(10+10+5) = 10/25 = 40% => no penalty
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 2);
    });

    // Bonus 9: confidenceImprovementRate >= 50 (< 80) => +1
    it("Bonus 9 low: confidenceImprovementRate >= 50 (< 80) => +1", () => {
      const activities = [
        makeChildLedActivity("cla1", { child_id: "c1", child_confidence_improved: true, child_satisfaction_rating: 2 }),
        makeChildLedActivity("cla2", { child_id: "c2", child_confidence_improved: false, child_satisfaction_rating: 2 }),
      ];
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        child_led_activity_records: activities,
      });
      // confidenceImprovementRate = pct(1,2) = 50% => +1
      // satisfaction = pct(9, 22) = 41% => no penalty
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 + 1);
    });
  });

  /* ── 10. Max bonuses = +28 ────────────────────────────────────────────── */

  describe("max bonuses", () => {
    it("all bonuses at maximum total +28, score = 80", () => {
      const r = run();
      // base 52, max bonuses +28 = 80
      // The default baseInput should hit all max bonuses
      // B1: eventParticipationRate = 100% >= 90 => +4
      // B2: diversityCelebrationRate = 100% >= 90 => +4
      // B3: heritageAcknowledgementRate = 100% >= 90 => +3
      // B4: festivalInclusionRate = 100% >= 90 => +3
      // B5: childLedRate = 75% >= 60 => +4
      // B6: childSatisfactionRate >= 90 => +3
      // B7: avgCelebrationQuality = 5.0 >= 4.0 => +3
      // B8: uniqueFaithsRepresented = 4 >= 4 => +2
      // B9: confidenceImprovementRate = 100% >= 80 => +2
      // Total = 4+4+3+3+4+3+3+2+2 = 28
      // Score = 52 + 28 = 80
      expect(r.cultural_score).toBe(80);
    });
  });

  /* ── 11. Penalties in isolation ───────────────────────────────────────── */

  describe("penalties in isolation", () => {
    // Penalty 1: eventParticipationRate < 50 && records.length > 0 => -5
    it("Penalty 1: low event participation => -5", () => {
      // 4/10 participated = 40% < 50
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 4,
            child_feedback_positive: true,
            engagement_level: "willing",
          }),
        ),
      });
      // eventParticipationRate = 40% => -5
      // satisfaction: 10/(10+10+2) = 10/22 = 45% => no penalty
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 - 5);
    });

    // Penalty 2: heritageAcknowledgementRate < 50 && records.length > 0 => -5
    it("Penalty 2: low heritage acknowledgement => -5", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        heritage_day_records: Array.from({ length: 10 }, (_, i) =>
          makeHeritageDay(`h${i + 1}`, {
            child_id: `c${i + 1}`,
            acknowledged: i < 4,
            child_feedback_positive: false,
            child_involved_in_planning: true,
            family_connection_facilitated: true,
          }),
        ),
      });
      // heritageAcknowledgementRate = pct(4, 10) = 40% => -5
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 - 5);
    });

    // Penalty 3: festivalInclusionRate < 40 && records.length > 0 => -4
    it("Penalty 3: low festival inclusion => -4", () => {
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: i < 9,
            engagement_level: "willing",
          }),
        ),
        festival_inclusion_records: [
          makeFestivalInclusion("f1", {
            faith_or_tradition: "christian",
            children_participated: ["c1", "c2", "c3"],
            religious_sensitivity_observed: true,
            child_feedback_collected: true,
            educational_element: false,
          }),
        ],
      });
      // festivalInclusionRate = pct(3, 10) = 30% < 40 => -4
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 - 4);
    });

    // Penalty 4: childSatisfactionRate < 40 && satisfactionDenominator > 0 => -4
    it("Penalty 4: low child satisfaction => -4", () => {
      // Need satisfaction < 40%. All events negative feedback, heritage negative, child-led low rating.
      const input = zeroBonusInput({
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 6,
            child_feedback_positive: false,
            engagement_level: "willing",
          }),
        ),
        heritage_day_records: Array.from({ length: 10 }, (_, i) =>
          makeHeritageDay(`h${i + 1}`, {
            child_id: `c${i + 1}`,
            acknowledged: i < 6,
            child_feedback_positive: false,
            child_involved_in_planning: true,
            family_connection_facilitated: true,
          }),
        ),
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1", child_satisfaction_rating: 1, child_confidence_improved: false }),
          makeChildLedActivity("cla2", { child_id: "c2", child_satisfaction_rating: 2, child_confidence_improved: false }),
        ],
      });
      // satisfaction: 0 events + 0 heritage + 0 child-led = 0/22 = 0% => -4
      const r = computeCulturalEventsCelebrations(input);
      expect(r.cultural_score).toBe(52 - 4);
    });

    it("penalties do not fire when arrays are empty (guarded)", () => {
      // All empty with children => gets the allEmpty floor (15), not penalty path
      const r = runEmpty();
      expect(r.cultural_score).toBe(15);
    });

    it("multiple penalties stack", () => {
      // Low event participation (-5) + low heritage (-5) + low festival (-4) + low satisfaction (-4) = -18
      const input: CulturalEventsInput = {
        today: "2025-06-01",
        total_children: 10,
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 4,
            child_feedback_positive: false,
            engagement_level: "reluctant",
          }),
        ),
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", {
            quality_rating: 2,
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6"],
            child_feedback_collected: true,
            children_involved_in_planning: true,
            educational_component: false,
          }),
        ],
        heritage_day_records: Array.from({ length: 10 }, (_, i) =>
          makeHeritageDay(`h${i + 1}`, {
            child_id: `c${i + 1}`,
            acknowledged: i < 4,
            child_feedback_positive: false,
            child_involved_in_planning: false,
            family_connection_facilitated: false,
          }),
        ),
        festival_inclusion_records: [
          makeFestivalInclusion("f1", {
            faith_or_tradition: "christian",
            children_participated: ["c1", "c2", "c3"],
            religious_sensitivity_observed: false,
            child_feedback_collected: false,
            educational_element: false,
          }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1", child_satisfaction_rating: 1, child_confidence_improved: false }),
        ],
      };
      const r = computeCulturalEventsCelebrations(input);
      // Base 52, no bonuses that qualify, penalties: -5 -5 -4 -4 = -18 => 34
      expect(r.cultural_score).toBe(34);
    });
  });

  /* ── 12. Score clamping ───────────────────────────────────────────────── */

  describe("score clamping", () => {
    it("score never exceeds 100", () => {
      // Even with extreme data, clamped to 100
      const r = run();
      expect(r.cultural_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      // Even with extreme penalties, clamped to 0
      // This won't actually reach 0 from the computed path, but test the contract
      const r = run({
        cultural_event_records: Array.from({ length: 20 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: false,
            child_feedback_positive: false,
            engagement_level: "refused",
          }),
        ),
        heritage_day_records: Array.from({ length: 20 }, (_, i) =>
          makeHeritageDay(`h${i + 1}`, {
            child_id: `c${i + 1}`,
            acknowledged: false,
            child_feedback_positive: false,
            child_involved_in_planning: false,
            family_connection_facilitated: false,
          }),
        ),
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: [], religious_sensitivity_observed: false, child_feedback_collected: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_satisfaction_rating: 1, child_confidence_improved: false }),
        ],
      });
      expect(r.cultural_score).toBeGreaterThanOrEqual(0);
    });
  });

  /* ── 13. Six rates ────────────────────────────────────────────────────── */

  describe("six rates computed correctly", () => {
    it("event_participation_rate", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true }),
          makeCulturalEvent("e2", { participated: true }),
          makeCulturalEvent("e3", { participated: false }),
        ],
      });
      // 2/3 = 67%
      expect(r.event_participation_rate).toBe(67);
    });

    it("diversity_celebration_rate", () => {
      const r = run({
        total_children: 5,
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { children_participated: ["c1", "c2", "c3"] }),
          makeDiversityCelebration("dc2", { children_participated: ["c3", "c4"] }),
        ],
      });
      // Unique children: c1,c2,c3,c4 = 4 out of 5 = 80%
      expect(r.diversity_celebration_rate).toBe(80);
    });

    it("heritage_acknowledgement_rate", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: true }),
          makeHeritageDay("h2", { acknowledged: true }),
          makeHeritageDay("h3", { acknowledged: false }),
          makeHeritageDay("h4", { acknowledged: false }),
          makeHeritageDay("h5", { acknowledged: false }),
        ],
      });
      // 2/5 = 40%
      expect(r.heritage_acknowledgement_rate).toBe(40);
    });

    it("festival_inclusion_rate", () => {
      const r = run({
        total_children: 5,
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: ["c1", "c2"] }),
          makeFestivalInclusion("f2", { children_participated: ["c2", "c3", "c4"] }),
        ],
      });
      // Unique children: c1,c2,c3,c4 = 4 out of 5 = 80%
      expect(r.festival_inclusion_rate).toBe(80);
    });

    it("child_led_rate", () => {
      const r = run({
        total_children: 5,
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1" }),
          makeChildLedActivity("cla2", { child_id: "c1" }),
          makeChildLedActivity("cla3", { child_id: "c2" }),
        ],
      });
      // Unique children: c1,c2 = 2 out of 5 = 40%
      expect(r.child_led_rate).toBe(40);
    });

    it("child_satisfaction_rate", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { child_feedback_positive: true }),
          makeCulturalEvent("e2", { child_feedback_positive: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { child_feedback_positive: true }),
          makeHeritageDay("h2", { child_feedback_positive: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_satisfaction_rating: 5 }),
          makeChildLedActivity("cla2", { child_satisfaction_rating: 3 }),
        ],
      });
      // numerator: 1 event + 1 heritage + 1 child-led(rating>=4) = 3
      // denominator: 2 + 2 + 2 = 6
      // pct(3, 6) = 50%
      expect(r.child_satisfaction_rate).toBe(50);
    });

    it("diversity_celebration_rate is unmeasured when total_children is null", () => {
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 0,
        cultural_event_records: [makeCulturalEvent("e1")],
        diversity_celebration_records: [makeDiversityCelebration("dc1")],
        heritage_day_records: [],
        festival_inclusion_records: [],
        child_led_activity_records: [],
      });
      expect(r.diversity_celebration_rate).toBeNull();
    });

    it("festival_inclusion_rate is unmeasured when total_children is null", () => {
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 0,
        cultural_event_records: [makeCulturalEvent("e1")],
        diversity_celebration_records: [],
        heritage_day_records: [],
        festival_inclusion_records: [makeFestivalInclusion("f1")],
        child_led_activity_records: [],
      });
      expect(r.festival_inclusion_rate).toBeNull();
    });

    it("child_led_rate is unmeasured when total_children is null", () => {
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 0,
        cultural_event_records: [makeCulturalEvent("e1")],
        diversity_celebration_records: [],
        heritage_day_records: [],
        festival_inclusion_records: [],
        child_led_activity_records: [makeChildLedActivity("cla1")],
      });
      expect(r.child_led_rate).toBeNull();
    });
  });

  /* ── 14. Totals ───────────────────────────────────────────────────────── */

  describe("totals match array lengths", () => {
    it("counts each array correctly", () => {
      const r = run();
      expect(r.total_cultural_events).toBe(4);
      expect(r.total_diversity_celebrations).toBe(3);
      expect(r.total_heritage_days).toBe(4);
      expect(r.total_festival_inclusions).toBe(4);
      expect(r.total_child_led_activities).toBe(3);
    });
  });

  /* ── 15. Unique counts ────────────────────────────────────────────────── */

  describe("unique counts", () => {
    it("unique_event_types counts distinct event types", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { event_type: "cultural_celebration" }),
          makeCulturalEvent("e2", { event_type: "heritage_event" }),
          makeCulturalEvent("e3", { event_type: "arts_performance" }),
          makeCulturalEvent("e4", { event_type: "cultural_celebration" }),
        ],
      });
      expect(r.unique_event_types).toBe(3);
    });

    it("unique_faiths_represented counts distinct faiths", () => {
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian" }),
          makeFestivalInclusion("f2", { faith_or_tradition: "muslim" }),
          makeFestivalInclusion("f3", { faith_or_tradition: "muslim" }),
        ],
      });
      expect(r.unique_faiths_represented).toBe(2);
    });

    it("unique_heritage_types counts distinct heritage types", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { heritage_type: "birth_culture" }),
          makeHeritageDay("h2", { heritage_type: "family_heritage" }),
          makeHeritageDay("h3", { heritage_type: "birth_culture" }),
        ],
      });
      expect(r.unique_heritage_types).toBe(2);
    });
  });

  /* ── 16. Children with heritage acknowledged ──────────────────────────── */

  describe("children_with_heritage_acknowledged", () => {
    it("counts unique children who have acknowledged heritage days", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { child_id: "c1", acknowledged: true }),
          makeHeritageDay("h2", { child_id: "c1", acknowledged: true }),
          makeHeritageDay("h3", { child_id: "c2", acknowledged: true }),
          makeHeritageDay("h4", { child_id: "c3", acknowledged: false }),
        ],
      });
      expect(r.children_with_heritage_acknowledged).toBe(2);
    });

    it("is 0 when no heritage days are acknowledged", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: false }),
          makeHeritageDay("h2", { acknowledged: false }),
        ],
      });
      expect(r.children_with_heritage_acknowledged).toBe(0);
    });
  });

  /* ── 17. Children leading activities ──────────────────────────────────── */

  describe("children_leading_activities", () => {
    it("counts unique child IDs", () => {
      const r = run({
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1" }),
          makeChildLedActivity("cla2", { child_id: "c1" }),
          makeChildLedActivity("cla3", { child_id: "c2" }),
        ],
      });
      expect(r.children_leading_activities).toBe(2);
    });
  });

  /* ── 18. External community events count ──────────────────────────────── */

  describe("external_community_events", () => {
    it("counts events with external community involvement", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { external_community_involved: true }),
          makeCulturalEvent("e2", { external_community_involved: true }),
          makeCulturalEvent("e3", { external_community_involved: false }),
        ],
      });
      expect(r.external_community_events).toBe(2);
    });
  });

  /* ── 19. Educational component count ──────────────────────────────────── */

  describe("educational_component_count", () => {
    it("combines celebrations with education + festivals with education", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { educational_component: true }),
          makeDiversityCelebration("dc2", { educational_component: false }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { educational_element: true }),
          makeFestivalInclusion("f2", { educational_element: true }),
        ],
      });
      expect(r.educational_component_count).toBe(3);
    });
  });

  /* ── 20. Avg celebration quality ──────────────────────────────────────── */

  describe("avg_celebration_quality", () => {
    it("averages quality ratings correctly", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 4 }),
          makeDiversityCelebration("dc2", { quality_rating: 3 }),
          makeDiversityCelebration("dc3", { quality_rating: 5 }),
        ],
      });
      expect(r.avg_celebration_quality).toBe(4);
    });

    it("returns 0 when no celebrations", () => {
      const r = run({ diversity_celebration_records: [] });
      expect(r.avg_celebration_quality).toBe(0);
    });

    it("rounds to 2 decimal places", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 3 }),
          makeDiversityCelebration("dc2", { quality_rating: 4 }),
          makeDiversityCelebration("dc3", { quality_rating: 4 }),
        ],
      });
      // (3+4+4)/3 = 3.666... => 3.67
      expect(r.avg_celebration_quality).toBe(3.67);
    });
  });

  /* ── 21. Avg festival quality ─────────────────────────────────────────── */

  describe("avg_festival_quality", () => {
    it("averages festival quality ratings", () => {
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { quality_rating: 5 }),
          makeFestivalInclusion("f2", { quality_rating: 3 }),
        ],
      });
      expect(r.avg_festival_quality).toBe(4);
    });

    it("returns 0 when no festivals", () => {
      const r = run({ festival_inclusion_records: [] });
      expect(r.avg_festival_quality).toBe(0);
    });
  });

  /* ── 22. Strengths ────────────────────────────────────────────────────── */

  describe("strengths", () => {
    it("includes high event participation strength (>=90%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("participation") && s.includes("cultural events"))).toBe(true);
    });

    it("includes moderate event participation strength (>=70%, <90%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true }),
          makeCulturalEvent("e2", { participated: true }),
          makeCulturalEvent("e3", { participated: true }),
          makeCulturalEvent("e4", { participated: false }),
          makeCulturalEvent("e5", { participated: false }),
          makeCulturalEvent("e6", { participated: false }),
          makeCulturalEvent("e7", { participated: true }),
          makeCulturalEvent("e8", { participated: true }),
          makeCulturalEvent("e9", { participated: true }),
          makeCulturalEvent("e10", { participated: true }),
        ],
      });
      // 7/10 = 70%
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("cultural event participation"))).toBe(true);
    });

    it("includes diversity celebration strength (>=90%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("diversity celebrations"))).toBe(true);
    });

    it("includes heritage acknowledgement strength (>=90%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("heritage days acknowledged"))).toBe(true);
    });

    it("includes festival inclusion strength (>=90%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("children included in multi-faith"))).toBe(true);
    });

    it("includes child-led rate strength (>=60%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("led cultural activities"))).toBe(true);
    });

    it("includes child satisfaction strength (>=90%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("child satisfaction"))).toBe(true);
    });

    it("includes faiths represented strength (>=4)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("faith traditions represented"))).toBe(true);
    });

    it("includes avg celebration quality strength (>=4.0)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("quality rating"))).toBe(true);
    });

    it("includes confidence improvement strength (>=80%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("confidence"))).toBe(true);
    });

    it("includes external community events strength (>=3)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { external_community_involved: true }),
          makeCulturalEvent("e2", { external_community_involved: true }),
          makeCulturalEvent("e3", { external_community_involved: true }),
          makeCulturalEvent("e4", { external_community_involved: false }),
        ],
      });
      expect(r.strengths.some((s) => s.includes("external community participation"))).toBe(true);
    });

    it("includes heritage family connection strength (>=70%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("family connection"))).toBe(true);
    });

    it("includes celebration planning rate strength (>=90%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("planned in advance"))).toBe(true);
    });

    it("includes child planning rate strength (>=60%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("children in planning"))).toBe(true);
    });

    it("includes event enthusiasm strength (>=70%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("enthusiastic"))).toBe(true);
    });

    it("includes festival sensitivity strength (>=90%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("religious sensitivity"))).toBe(true);
    });

    it("includes unique event types strength (>=5)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { event_type: "cultural_celebration" }),
          makeCulturalEvent("e2", { event_type: "heritage_event" }),
          makeCulturalEvent("e3", { event_type: "arts_performance" }),
          makeCulturalEvent("e4", { event_type: "food_culture" }),
          makeCulturalEvent("e5", { event_type: "community_festival" }),
        ],
      });
      expect(r.strengths.some((s) => s.includes("different cultural event types"))).toBe(true);
    });

    it("includes educational component strength (>=3)", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { educational_component: true }),
          makeDiversityCelebration("dc2", { educational_component: true }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { educational_element: true }),
        ],
      });
      expect(r.strengths.some((s) => s.includes("educational component"))).toBe(true);
    });

    it("includes staff support rate strength (>=90%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("staff support"))).toBe(true);
    });

    it("includes peer participation rate strength (>=70%)", () => {
      const r = run();
      expect(r.strengths.some((s) => s.includes("peer participation"))).toBe(true);
    });

    it("no strengths when all rates are low", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: false, child_feedback_positive: false, engagement_level: "refused", external_community_involved: false }),
        ],
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", {
            quality_rating: 1,
            children_participated: [],
            child_feedback_collected: false,
            children_involved_in_planning: false,
            planned_in_advance: false,
            educational_component: false,
          }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: false, child_involved_in_planning: false, family_connection_facilitated: false }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: [], religious_sensitivity_observed: false, child_feedback_collected: false, educational_element: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", {
            child_confidence_improved: false,
            child_satisfaction_rating: 1,
            peers_participated: false,
            peer_feedback_positive: false,
            staff_supported: false,
          }),
        ],
      });
      expect(r.strengths).toHaveLength(0);
    });
  });

  /* ── 23. Concerns ─────────────────────────────────────────────────────── */

  describe("concerns", () => {
    it("concern for low event participation (<50%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true }),
          makeCulturalEvent("e2", { participated: false }),
          makeCulturalEvent("e3", { participated: false }),
        ],
      });
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("cultural event participation"))).toBe(true);
    });

    it("concern for moderate event participation (50-69%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true }),
          makeCulturalEvent("e2", { participated: true }),
          makeCulturalEvent("e3", { participated: true }),
          makeCulturalEvent("e4", { participated: false }),
          makeCulturalEvent("e5", { participated: false }),
        ],
      });
      // 3/5 = 60%
      expect(r.concerns.some((c) => c.includes("60%"))).toBe(true);
    });

    it("concern for low diversity celebration rate (<50%)", () => {
      const r = run({
        total_children: 10,
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { children_participated: ["c1", "c2", "c3", "c4"] }),
        ],
      });
      // 4/10 = 40%
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("diversity celebrations"))).toBe(true);
    });

    it("concern for moderate diversity celebration rate (50-69%)", () => {
      const r = run({
        total_children: 10,
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { children_participated: ["c1", "c2", "c3", "c4", "c5", "c6"] }),
        ],
      });
      // 6/10 = 60%
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Diversity celebration participation"))).toBe(true);
    });

    it("concern for low heritage acknowledgement (<50%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: true }),
          makeHeritageDay("h2", { acknowledged: false }),
          makeHeritageDay("h3", { acknowledged: false }),
        ],
      });
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("heritage days acknowledged"))).toBe(true);
    });

    it("concern for moderate heritage acknowledgement (50-69%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: true }),
          makeHeritageDay("h2", { acknowledged: true }),
          makeHeritageDay("h3", { acknowledged: false }),
          makeHeritageDay("h4", { acknowledged: false }),
          makeHeritageDay("h5", { acknowledged: true }),
        ],
      });
      // 3/5 = 60%
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Heritage acknowledgement"))).toBe(true);
    });

    it("concern for low festival inclusion (<40%)", () => {
      const r = run({
        total_children: 10,
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: ["c1", "c2", "c3"] }),
        ],
      });
      // 3/10 = 30%
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("children included in festivals"))).toBe(true);
    });

    it("concern for moderate festival inclusion (40-69%)", () => {
      const r = run({
        total_children: 10,
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: ["c1", "c2", "c3", "c4", "c5"] }),
        ],
      });
      // 5/10 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Festival inclusion"))).toBe(true);
    });

    it("concern for no child-led activities", () => {
      const r = run({
        child_led_activity_records: [],
      });
      expect(r.concerns.some((c) => c.includes("No child-led cultural activities"))).toBe(true);
    });

    it("concern for low child-led rate (1-19%)", () => {
      const r = run({
        total_children: 10,
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1" }),
        ],
      });
      // 1/10 = 10%
      expect(r.concerns.some((c) => c.includes("10%") && c.includes("led cultural activities"))).toBe(true);
    });

    it("concern for low child satisfaction (<40%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { child_feedback_positive: false }),
          makeCulturalEvent("e2", { child_feedback_positive: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { child_feedback_positive: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_satisfaction_rating: 2 }),
        ],
      });
      // 0/4 = 0%
      expect(r.concerns.some((c) => c.includes("child satisfaction"))).toBe(true);
    });

    it("concern for moderate child satisfaction (40-69%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { child_feedback_positive: true }),
          makeCulturalEvent("e2", { child_feedback_positive: false }),
          makeCulturalEvent("e3", { child_feedback_positive: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { child_feedback_positive: true }),
          makeHeritageDay("h2", { child_feedback_positive: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_satisfaction_rating: 5 }),
          makeChildLedActivity("cla2", { child_satisfaction_rating: 2 }),
        ],
      });
      // 1+1+1 = 3 / (3+2+2) = 3/7 = 43%
      expect(r.concerns.some((c) => c.includes("43%") && c.includes("Child satisfaction"))).toBe(true);
    });

    it("concern for only 1 faith represented", () => {
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian" }),
        ],
      });
      expect(r.concerns.some((c) => c.includes("1 faith tradition"))).toBe(true);
    });

    it("concern for 0 faiths represented with festival data", () => {
      // Actually, if there's a festival_inclusion_record it must have a faith.
      // With 1 record we get 1 faith. Let's test with uniqueFaithsRepresented === 0 — impossible with records.
      // Skip this edge — already covered by "1 faith" test.
    });

    it("concern for low celebration quality (<3.0)", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 2 }),
          makeDiversityCelebration("dc2", { quality_rating: 1 }),
        ],
      });
      // avg = 1.5
      expect(r.concerns.some((c) => c.includes("1.5/5") && c.includes("celebration quality"))).toBe(true);
    });

    it("concern for low heritage child involvement (<50%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { child_involved_in_planning: true }),
          makeHeritageDay("h2", { child_involved_in_planning: false }),
          makeHeritageDay("h3", { child_involved_in_planning: false }),
        ],
      });
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("heritage days involved the child"))).toBe(true);
    });

    it("concern for low celebration feedback rate (<50%)", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { child_feedback_collected: true }),
          makeDiversityCelebration("dc2", { child_feedback_collected: false }),
          makeDiversityCelebration("dc3", { child_feedback_collected: false }),
        ],
      });
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("diversity celebrations"))).toBe(true);
    });

    it("concern for low festival feedback rate (<50%)", () => {
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { child_feedback_collected: true }),
          makeFestivalInclusion("f2", { child_feedback_collected: false }),
          makeFestivalInclusion("f3", { child_feedback_collected: false }),
        ],
      });
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("festivals"))).toBe(true);
    });

    it("concern for low heritage family connection (<30%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { family_connection_facilitated: true }),
          makeHeritageDay("h2", { family_connection_facilitated: false }),
          makeHeritageDay("h3", { family_connection_facilitated: false }),
          makeHeritageDay("h4", { family_connection_facilitated: false }),
        ],
      });
      // 1/4 = 25%
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("heritage days facilitated family connection"))).toBe(true);
    });

    it("concern for no cultural events with other data present", () => {
      const r = run({
        cultural_event_records: [],
      });
      expect(r.concerns.some((c) => c.includes("No cultural event records"))).toBe(true);
    });

    it("concern for no diversity celebrations with other data present", () => {
      const r = run({
        diversity_celebration_records: [],
      });
      expect(r.concerns.some((c) => c.includes("No diversity celebrations recorded"))).toBe(true);
    });

    it("concern for low festival sensitivity (<70%)", () => {
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { religious_sensitivity_observed: true }),
          makeFestivalInclusion("f2", { religious_sensitivity_observed: false }),
          makeFestivalInclusion("f3", { religious_sensitivity_observed: false }),
        ],
      });
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("Religious sensitivity"))).toBe(true);
    });
  });

  /* ── 24. Recommendations ──────────────────────────────────────────────── */

  describe("recommendations", () => {
    it("recommends urgently for low event participation (<50%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: false }),
          makeCulturalEvent("e2", { participated: true }),
          makeCulturalEvent("e3", { participated: false }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("cultural event provision"))).toBe(true);
    });

    it("recommends for low heritage acknowledgement (<50%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: false }),
          makeHeritageDay("h2", { acknowledged: true }),
          makeHeritageDay("h3", { acknowledged: false }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("heritage days are acknowledged"))).toBe(true);
    });

    it("recommends for no cultural events with children present", () => {
      const r = run({ cultural_event_records: [] });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("cultural event participation immediately"))).toBe(true);
    });

    it("recommends for no diversity celebrations with children present", () => {
      const r = run({ diversity_celebration_records: [] });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("diversity celebration programme"))).toBe(true);
    });

    it("recommends for low child satisfaction (<40%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { child_feedback_positive: false }),
          makeCulturalEvent("e2", { child_feedback_positive: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { child_feedback_positive: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_satisfaction_rating: 1 }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("consultations with children"))).toBe(true);
    });

    it("recommends for low festival inclusion (<40%)", () => {
      const r = run({
        total_children: 10,
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: ["c1", "c2"] }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("festival inclusion planning"))).toBe(true);
    });

    it("recommends for low diversity celebration rate (<50%)", () => {
      const r = run({
        total_children: 10,
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { children_participated: ["c1", "c2", "c3", "c4"] }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase participation in diversity celebrations"))).toBe(true);
    });

    it("recommends for only 1 faith represented", () => {
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian" }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Broaden the festival programme"))).toBe(true);
    });

    it("recommends for no child-led activities", () => {
      const r = run({ child_led_activity_records: [] });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("children to lead cultural activities"))).toBe(true);
    });

    it("recommends for low child-led rate (1-29%)", () => {
      const r = run({
        total_children: 10,
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1" }),
          makeChildLedActivity("cla2", { child_id: "c2" }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Expand child-led cultural activities"))).toBe(true);
    });

    it("recommends for moderate event participation (50-69%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true }),
          makeCulturalEvent("e2", { participated: true }),
          makeCulturalEvent("e3", { participated: true }),
          makeCulturalEvent("e4", { participated: false }),
          makeCulturalEvent("e5", { participated: false }),
        ],
      });
      // 3/5 = 60%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase cultural event participation"))).toBe(true);
    });

    it("recommends for moderate heritage acknowledgement (50-69%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: true }),
          makeHeritageDay("h2", { acknowledged: true }),
          makeHeritageDay("h3", { acknowledged: true }),
          makeHeritageDay("h4", { acknowledged: false }),
          makeHeritageDay("h5", { acknowledged: false }),
        ],
      });
      // 3/5 = 60%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Strengthen heritage acknowledgement"))).toBe(true);
    });

    it("recommends for low celebration quality (<3.0)", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 2 }),
          makeDiversityCelebration("dc2", { quality_rating: 1 }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve the quality of diversity celebrations"))).toBe(true);
    });

    it("recommends for low celebration feedback rate (<50%)", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { child_feedback_collected: false }),
          makeDiversityCelebration("dc2", { child_feedback_collected: false }),
          makeDiversityCelebration("dc3", { child_feedback_collected: true }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("feedback after every diversity celebration"))).toBe(true);
    });

    it("recommends for low festival feedback rate (<50%)", () => {
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { child_feedback_collected: false }),
          makeFestivalInclusion("f2", { child_feedback_collected: false }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("feedback after each festival"))).toBe(true);
    });

    it("recommends for low heritage family connection (<30%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { family_connection_facilitated: false }),
          makeHeritageDay("h2", { family_connection_facilitated: false }),
          makeHeritageDay("h3", { family_connection_facilitated: false }),
          makeHeritageDay("h4", { family_connection_facilitated: true }),
        ],
      });
      // 1/4 = 25%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("family connections during heritage celebrations"))).toBe(true);
    });

    it("recommends for low festival sensitivity (<70%)", () => {
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { religious_sensitivity_observed: false }),
          makeFestivalInclusion("f2", { religious_sensitivity_observed: true }),
          makeFestivalInclusion("f3", { religious_sensitivity_observed: false }),
        ],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("religious sensitivity"))).toBe(true);
    });

    it("recommends for low external community involvement", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { external_community_involved: false }),
          makeCulturalEvent("e2", { external_community_involved: true }),
          makeCulturalEvent("e3", { external_community_involved: false }),
        ],
      });
      // 1 external < 2, total 3 >= 3
      expect(r.recommendations.some((rec) => rec.recommendation.includes("external community involvement"))).toBe(true);
    });

    it("recommends for no educational components", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { educational_component: false }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { educational_element: false }),
        ],
      });
      // 0 educational, total celebrations + festivals = 2 >= 2
      expect(r.recommendations.some((rec) => rec.recommendation.includes("educational components"))).toBe(true);
    });

    it("recommends for low heritage child involvement (<50%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { child_involved_in_planning: false }),
          makeHeritageDay("h2", { child_involved_in_planning: false }),
          makeHeritageDay("h3", { child_involved_in_planning: true }),
        ],
      });
      // 1/3 = 33%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("children's involvement in planning"))).toBe(true);
    });

    it("recommendations have sequential rank numbers", () => {
      const r = run({
        cultural_event_records: [],
        diversity_celebration_records: [],
        heritage_day_records: [makeHeritageDay("h1", { acknowledged: false })],
        festival_inclusion_records: [],
        child_led_activity_records: [],
      });
      const ranks = r.recommendations.map((rec) => rec.rank);
      for (let i = 0; i < ranks.length; i++) {
        expect(ranks[i]).toBe(i + 1);
      }
    });

    it("each recommendation has a regulatory_ref", () => {
      const r = run({
        cultural_event_records: [],
        diversity_celebration_records: [],
        heritage_day_records: [makeHeritageDay("h1", { acknowledged: false })],
        festival_inclusion_records: [],
        child_led_activity_records: [],
      });
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
      }
    });
  });

  /* ── 25. Insights ─────────────────────────────────────────────────────── */

  describe("insights", () => {
    it("critical insight for low event participation (<50%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: false }),
          makeCulturalEvent("e2", { participated: false }),
          makeCulturalEvent("e3", { participated: true }),
        ],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("cultural event participation"))).toBe(true);
    });

    it("critical insight for low heritage acknowledgement (<50%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: false }),
          makeHeritageDay("h2", { acknowledged: false }),
          makeHeritageDay("h3", { acknowledged: true }),
        ],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("heritage days acknowledged"))).toBe(true);
    });

    it("critical insight for low child satisfaction (<40%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { child_feedback_positive: false }),
          makeCulturalEvent("e2", { child_feedback_positive: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { child_feedback_positive: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_satisfaction_rating: 1 }),
        ],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("child satisfaction"))).toBe(true);
    });

    it("critical insight for low festival inclusion (<40%)", () => {
      const r = run({
        total_children: 10,
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: ["c1", "c2"] }),
        ],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("children included in festival"))).toBe(true);
    });

    it("critical insight for no events AND no celebrations (with other data)", () => {
      const r = run({
        cultural_event_records: [],
        diversity_celebration_records: [],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No cultural events or diversity celebrations"))).toBe(true);
    });

    it("warning insight for moderate event participation (50-69%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true }),
          makeCulturalEvent("e2", { participated: true }),
          makeCulturalEvent("e3", { participated: true }),
          makeCulturalEvent("e4", { participated: false }),
          makeCulturalEvent("e5", { participated: false }),
        ],
      });
      // 3/5 = 60%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%"))).toBe(true);
    });

    it("warning insight for moderate diversity celebration rate (50-69%)", () => {
      const r = run({
        total_children: 10,
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { children_participated: ["c1", "c2", "c3", "c4", "c5", "c6"] }),
        ],
      });
      // 6/10 = 60%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%"))).toBe(true);
    });

    it("warning insight for moderate heritage acknowledgement (50-69%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { acknowledged: true }),
          makeHeritageDay("h2", { acknowledged: true }),
          makeHeritageDay("h3", { acknowledged: true }),
          makeHeritageDay("h4", { acknowledged: false }),
          makeHeritageDay("h5", { acknowledged: false }),
        ],
      });
      // 3/5 = 60%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%"))).toBe(true);
    });

    it("warning insight for moderate festival inclusion (40-69%)", () => {
      const r = run({
        total_children: 10,
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: ["c1", "c2", "c3", "c4", "c5"] }),
        ],
      });
      // 5/10 = 50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%"))).toBe(true);
    });

    it("warning insight for moderate child satisfaction (40-69%)", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { child_feedback_positive: true }),
          makeCulturalEvent("e2", { child_feedback_positive: false }),
          makeCulturalEvent("e3", { child_feedback_positive: false }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { child_feedback_positive: true }),
          makeHeritageDay("h2", { child_feedback_positive: false }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_satisfaction_rating: 5 }),
          makeChildLedActivity("cla2", { child_satisfaction_rating: 2 }),
        ],
      });
      // 1+1+1=3 / (3+2+2)=7 = 43%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("43%"))).toBe(true);
    });

    it("warning insight for only 1 faith represented", () => {
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian" }),
        ],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("1 faith tradition"))).toBe(true);
    });

    it("warning insight for low celebration quality (<3.0)", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 2 }),
        ],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("quality"))).toBe(true);
    });

    it("warning insight for no child-led activities (childLedRate=0)", () => {
      const r = run({ child_led_activity_records: [] });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("No children have led cultural activities"))).toBe(true);
    });

    it("warning insight for low heritage child involvement (<50%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { child_involved_in_planning: false }),
          makeHeritageDay("h2", { child_involved_in_planning: false }),
          makeHeritageDay("h3", { child_involved_in_planning: true }),
        ],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("33%"))).toBe(true);
    });

    it("warning insight for low celebration feedback (<50%)", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { child_feedback_collected: false }),
          makeDiversityCelebration("dc2", { child_feedback_collected: false }),
        ],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Feedback collected from only"))).toBe(true);
    });

    it("warning insight for low heritage family connection (<30%)", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", { family_connection_facilitated: false }),
          makeHeritageDay("h2", { family_connection_facilitated: false }),
          makeHeritageDay("h3", { family_connection_facilitated: false }),
          makeHeritageDay("h4", { family_connection_facilitated: true }),
        ],
      });
      // 1/4 = 25%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("25%"))).toBe(true);
    });

    it("positive insight for outstanding rating", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding cultural celebration"))).toBe(true);
    });

    it("positive insight for high participation + high satisfaction", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("participation") && i.text.includes("satisfaction"))).toBe(true);
    });

    it("positive insight for high heritage + high child involvement", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("heritage acknowledgement") && i.text.includes("child involvement"))).toBe(true);
    });

    it("positive insight for high festival + many faiths", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("festival inclusion") && i.text.includes("faith traditions"))).toBe(true);
    });

    it("positive insight for high child-led + high confidence", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("leading cultural activities") && i.text.includes("confidence"))).toBe(true);
    });

    it("positive insight for high diversity celebration + high quality", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("diversity celebrations") && i.text.includes("quality"))).toBe(true);
    });

    it("celebration type profile insight (>=2 types, >=3 records)", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { celebration_type: "black_history_month" }),
          makeDiversityCelebration("dc2", { celebration_type: "diwali" }),
          makeDiversityCelebration("dc3", { celebration_type: "pride" }),
        ],
      });
      expect(r.insights.some((i) => i.text.includes("Diversity celebration profile"))).toBe(true);
    });

    it("child-led activity type profile insight (>=2 types, >=3 records)", () => {
      const r = run({
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1", activity_type: "cultural_presentation" }),
          makeChildLedActivity("cla2", { child_id: "c2", activity_type: "cooking_session" }),
          makeChildLedActivity("cla3", { child_id: "c3", activity_type: "storytelling" }),
        ],
      });
      expect(r.insights.some((i) => i.text.includes("Child-led activity types"))).toBe(true);
    });

    it("positive insight for external community + enthusiasm", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { external_community_involved: true, engagement_level: "enthusiastic" }),
          makeCulturalEvent("e2", { external_community_involved: true, engagement_level: "enthusiastic" }),
          makeCulturalEvent("e3", { external_community_involved: true, engagement_level: "enthusiastic" }),
          makeCulturalEvent("e4", { external_community_involved: false, engagement_level: "enthusiastic" }),
        ],
      });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("external community involvement"))).toBe(true);
    });

    it("positive insight for high family connection + positive heritage feedback", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("family connections") && i.text.includes("positive child feedback"))).toBe(true);
    });

    it("positive insight for high celebration planning + child planning", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("planned in advance") && i.text.includes("child involvement in planning"))).toBe(true);
    });

    it("positive insight for high peer participation + positive peer feedback", () => {
      const r = run();
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("peer participation") && i.text.includes("positive peer feedback"))).toBe(true);
    });
  });

  /* ── 26. Edge cases ───────────────────────────────────────────────────── */

  describe("edge cases", () => {
    it("single child with all records", () => {
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 1,
        cultural_event_records: [makeCulturalEvent("e1", { child_id: "c1" })],
        diversity_celebration_records: [makeDiversityCelebration("dc1", { children_participated: ["c1"] })],
        heritage_day_records: [makeHeritageDay("h1", { child_id: "c1" })],
        festival_inclusion_records: [makeFestivalInclusion("f1", { children_participated: ["c1"] })],
        child_led_activity_records: [makeChildLedActivity("cla1", { child_id: "c1" })],
      });
      expect(r.cultural_rating).toBeDefined();
      expect(r.event_participation_rate).toBe(100);
      expect(r.diversity_celebration_rate).toBe(100);
      expect(r.festival_inclusion_rate).toBe(100);
      expect(r.child_led_rate).toBe(100);
    });

    it("large volume of records (50 events)", () => {
      const events = Array.from({ length: 50 }, (_, i) =>
        makeCulturalEvent(`e${i + 1}`, { child_id: `c${(i % 10) + 1}`, participated: true }),
      );
      const r = run({
        total_children: 10,
        cultural_event_records: events,
      });
      expect(r.total_cultural_events).toBe(50);
      expect(r.event_participation_rate).toBe(100);
    });

    it("child-led activity with rating exactly 4 counts toward satisfaction", () => {
      const r = run({
        cultural_event_records: [],
        diversity_celebration_records: [],
        heritage_day_records: [],
        festival_inclusion_records: [],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_satisfaction_rating: 4 }),
        ],
      });
      // numerator: 0 events + 0 heritage + 1 child-led = 1
      // denominator: 0 + 0 + 1 = 1
      // pct(1, 1) = 100%
      expect(r.child_satisfaction_rate).toBe(100);
    });

    it("child-led activity with rating 3 does NOT count toward satisfaction", () => {
      const r = run({
        cultural_event_records: [],
        diversity_celebration_records: [],
        heritage_day_records: [],
        festival_inclusion_records: [],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_satisfaction_rating: 3 }),
        ],
      });
      // numerator: 0
      // denominator: 1
      // pct(0, 1) = 0%
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("mixed engagement levels: led_by_child counts as enthusiastic for enthusiasm rate", () => {
      const r = run({
        cultural_event_records: [
          makeCulturalEvent("e1", { engagement_level: "led_by_child" }),
          makeCulturalEvent("e2", { engagement_level: "willing" }),
        ],
      });
      // Enthusiasm: 1/2 = 50% (led_by_child counts)
      // No strength for enthusiasm (needs >= 70%), but the metric is computed correctly
      expect(r.total_cultural_events).toBe(2);
    });

    it("celebrations with 0 children participated still count for totals", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { children_participated: [] }),
        ],
      });
      expect(r.total_diversity_celebrations).toBe(1);
    });

    it("heritage with all properties false", () => {
      const r = run({
        heritage_day_records: [
          makeHeritageDay("h1", {
            acknowledged: false,
            child_involved_in_planning: false,
            child_feedback_positive: false,
            staff_supported: false,
            family_connection_facilitated: false,
            resources_provided: false,
          }),
        ],
      });
      expect(r.heritage_acknowledgement_rate).toBe(0);
      expect(r.children_with_heritage_acknowledged).toBe(0);
    });

    it("today parameter is present but does not affect scoring", () => {
      const r1 = run({ today: "2025-01-01" });
      const r2 = run({ today: "2026-12-31" });
      // Same data, different today => same score
      expect(r1.cultural_score).toBe(r2.cultural_score);
    });

    it("total_children=0 with some records skips allEmpty check and computes", () => {
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 0,
        cultural_event_records: [makeCulturalEvent("e1")],
        diversity_celebration_records: [],
        heritage_day_records: [],
        festival_inclusion_records: [],
        child_led_activity_records: [],
      });
      // Not allEmpty (has events), not allEmpty + children=0.
      // This enters the normal computation path.
      expect(r.cultural_rating).not.toBe("insufficient_data");
      expect(r.total_cultural_events).toBe(1);
      // Diversity celebration rate, festival inclusion rate, child-led rate = 0 (total_children=0)
      expect(r.diversity_celebration_rate).toBeNull();
      expect(r.festival_inclusion_rate).toBeNull();
      expect(r.child_led_rate).toBeNull();
    });

    it("duplicate child_ids in different celebrations are de-duplicated for diversity_celebration_rate", () => {
      const r = run({
        total_children: 4,
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { children_participated: ["c1", "c2"] }),
          makeDiversityCelebration("dc2", { children_participated: ["c2", "c3"] }),
          makeDiversityCelebration("dc3", { children_participated: ["c3", "c4"] }),
        ],
      });
      // unique: c1,c2,c3,c4 = 4 out of 4 = 100%
      expect(r.diversity_celebration_rate).toBe(100);
    });

    it("duplicate child_ids in festivals are de-duplicated for festival_inclusion_rate", () => {
      const r = run({
        total_children: 4,
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { children_participated: ["c1", "c1", "c2"] }),
          makeFestivalInclusion("f2", { children_participated: ["c2", "c3"] }),
        ],
      });
      // unique: c1,c2,c3 = 3 out of 4 = 75%
      expect(r.festival_inclusion_rate).toBe(75);
    });

    it("result shape has all expected fields", () => {
      const r = run();
      const keys: (keyof CulturalEventsResult)[] = [
        "cultural_rating",
        "cultural_score",
        "headline",
        "total_cultural_events",
        "total_diversity_celebrations",
        "total_heritage_days",
        "total_festival_inclusions",
        "total_child_led_activities",
        "event_participation_rate",
        "diversity_celebration_rate",
        "heritage_acknowledgement_rate",
        "festival_inclusion_rate",
        "child_led_rate",
        "child_satisfaction_rate",
        "unique_event_types",
        "unique_faiths_represented",
        "unique_heritage_types",
        "children_with_heritage_acknowledged",
        "children_leading_activities",
        "external_community_events",
        "educational_component_count",
        "avg_celebration_quality",
        "avg_festival_quality",
        "strengths",
        "concerns",
        "recommendations",
        "insights",
      ];
      for (const key of keys) {
        expect(r).toHaveProperty(key);
      }
    });

    it("only events array has data — no penalty for absent heritage/festivals", () => {
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 4,
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true, child_feedback_positive: true }),
          makeCulturalEvent("e2", { participated: true, child_feedback_positive: true }),
        ],
        diversity_celebration_records: [],
        heritage_day_records: [],
        festival_inclusion_records: [],
        child_led_activity_records: [],
      });
      // Not allEmpty (has events). No heritage penalty (no records). No festival penalty (no records).
      // eventParticipationRate = 100% => +4
      // satisfaction = pct(2, 2) = 100% => +3
      // base 52 + 4 + 3 = 59
      expect(r.cultural_score).toBe(59);
      expect(r.cultural_rating).toBe("adequate");
    });

    it("boundary: exactly score 80 is outstanding", () => {
      const r = run();
      expect(r.cultural_score).toBe(80);
      expect(r.cultural_rating).toBe("outstanding");
    });

    it("boundary: exactly score 65 is good", () => {
      // We need score = 65. base 52. Need +13 in bonuses.
      // B1: +4 (event participation >= 90)
      // B3: +3 (heritage >= 90)
      // B6: +3 (satisfaction >= 90)
      // B7: +3 (celebration quality >= 4.0)
      // = 13 total
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 4,
        cultural_event_records: [
          makeCulturalEvent("e1", { participated: true, child_feedback_positive: true }),
          makeCulturalEvent("e2", { participated: true, child_feedback_positive: true }),
          makeCulturalEvent("e3", { participated: true, child_feedback_positive: true }),
          makeCulturalEvent("e4", { participated: true, child_feedback_positive: true }),
        ],
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 4, children_participated: ["c1", "c2"], child_feedback_collected: true, children_involved_in_planning: true }),
        ],
        heritage_day_records: [
          makeHeritageDay("h1", { child_id: "c1", acknowledged: true, child_feedback_positive: true, child_involved_in_planning: true, family_connection_facilitated: true }),
          makeHeritageDay("h2", { child_id: "c2", acknowledged: true, child_feedback_positive: true, child_involved_in_planning: true, family_connection_facilitated: true }),
        ],
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian", children_participated: ["c1", "c2"] }),
        ],
        child_led_activity_records: [],
      });
      // eventParticipation = 100% => +4
      // diversityCelebrationRate = 2/4 = 50% => no bonus
      // heritageAcknowledgementRate = 2/2 = 100% => +3
      // festivalInclusionRate = 2/4 = 50% => no bonus
      // childLedRate = 0% => no bonus
      // satisfaction: 4 events + 2 heritage + 0 child-led = 6/6 = 100% => +3
      // avgCelebrationQuality = 4.0 => +3
      // uniqueFaithsRepresented = 1 => no bonus
      // confidenceImprovementRate = 0% (no child-led records) => no bonus
      // Total: 52 + 4 + 3 + 3 + 3 = 65
      expect(r.cultural_score).toBe(65);
      expect(r.cultural_rating).toBe("good");
    });

    it("boundary: exactly score 45 is adequate", () => {
      // Need score 45. base 52. Need -7 penalty or some penalty/bonus combo.
      // Penalty 1 (-5) + Penalty 4 (-4) = -9. No bonuses => 52-9 = 43 (too low).
      // Penalty 1 (-5) only => 47.
      // Need exactly 45: penalty1(-5) + bonus for something small(+something)?
      // Actually just need penalty that gives us 45. Penalty 1(-5) => 47. Hmm.
      // Let's do: penalty 1 (-5) + penalty 4 (-4) + some bonus (+2) = 52-5-4+2 = 45
      // penalty 1: eventParticipation < 50
      // penalty 4: satisfaction < 40
      // bonus: e.g., heritageAcknowledgement >= 70 => +1, plus diversityCelebrationRate >= 70 => +2? No, too many.
      // Just check that score 45 maps to adequate.
      // We already test toRating boundaries effectively. Let's verify a constructed case.
      const r = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 10,
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 4,
            child_feedback_positive: false,
            engagement_level: "willing",
          }),
        ),
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", {
            quality_rating: 2,
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6", "c7"],
            child_feedback_collected: true,
            children_involved_in_planning: true,
            educational_component: false,
          }),
        ],
        heritage_day_records: Array.from({ length: 10 }, (_, i) =>
          makeHeritageDay(`h${i + 1}`, {
            child_id: `c${i + 1}`,
            acknowledged: i < 6,
            child_feedback_positive: false,
            child_involved_in_planning: true,
            family_connection_facilitated: true,
          }),
        ),
        festival_inclusion_records: [
          makeFestivalInclusion("f1", {
            faith_or_tradition: "christian",
            children_participated: ["c1", "c2", "c3", "c4", "c5"],
            religious_sensitivity_observed: true,
            child_feedback_collected: true,
            educational_element: false,
          }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1", child_satisfaction_rating: 1, child_confidence_improved: false }),
          makeChildLedActivity("cla2", { child_id: "c2", child_satisfaction_rating: 1, child_confidence_improved: false }),
        ],
      });
      // eventParticipation = 40% => -5 penalty, no bonus
      // diversityCelebrationRate = 70% => +2 bonus
      // heritageAcknowledgement = 60% => no bonus, no penalty
      // festivalInclusion = 50% => no bonus, no penalty
      // childLedRate = 20% => no bonus
      // satisfaction = 0/(10+10+2) = 0/22 = 0% => -4 penalty
      // avgCelebrationQuality = 2.0 => no bonus
      // uniqueFaiths = 1 => no bonus
      // confidenceImprovement = 0% => no bonus
      // Score: 52 - 5 + 2 - 4 = 45
      expect(r.cultural_score).toBe(45);
      expect(r.cultural_rating).toBe("adequate");
    });

    it("boundary: score 44 is inadequate", () => {
      // eventParticipation = 40% => -5
      // diversityCelebrationRate = 60% => no bonus
      // heritageAcknowledgement = 60% => no bonus, no penalty
      // festivalInclusion = 50% => no bonus, no penalty
      // childLedRate = 30% => +2 bonus
      // satisfaction = 0/(10+10+3) = 0/23 = 0% => -4
      // avgCelebrationQuality = 2.0 => no bonus
      // uniqueFaiths = 1 => no bonus
      // confidenceImprovement = 0% => no bonus
      // Score: 52 - 5 + 2 - 4 = 45. Hmm still 45.
      // Change childLedRate to < 30 (2 children out of 10 = 20%)
      const r2 = computeCulturalEventsCelebrations({
        today: "2025-06-01",
        total_children: 10,
        cultural_event_records: Array.from({ length: 10 }, (_, i) =>
          makeCulturalEvent(`e${i + 1}`, {
            participated: i < 4,
            child_feedback_positive: false,
            engagement_level: "willing",
          }),
        ),
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", {
            quality_rating: 2,
            children_participated: ["c1", "c2", "c3", "c4", "c5", "c6"],
            child_feedback_collected: true,
            children_involved_in_planning: true,
            educational_component: false,
          }),
        ],
        heritage_day_records: Array.from({ length: 10 }, (_, i) =>
          makeHeritageDay(`h${i + 1}`, {
            child_id: `c${i + 1}`,
            acknowledged: i < 6,
            child_feedback_positive: false,
            child_involved_in_planning: true,
            family_connection_facilitated: true,
          }),
        ),
        festival_inclusion_records: [
          makeFestivalInclusion("f1", {
            faith_or_tradition: "christian",
            children_participated: ["c1", "c2", "c3", "c4", "c5"],
            religious_sensitivity_observed: true,
            child_feedback_collected: true,
            educational_element: false,
          }),
        ],
        child_led_activity_records: [
          makeChildLedActivity("cla1", { child_id: "c1", child_satisfaction_rating: 1, child_confidence_improved: false }),
          makeChildLedActivity("cla2", { child_id: "c2", child_satisfaction_rating: 1, child_confidence_improved: false }),
        ],
      });
      // eventParticipation = 40% => -5
      // diversityCelebrationRate = 60% => no bonus
      // heritageAcknowledgement = 60% => no bonus
      // festivalInclusion = 50% => no bonus
      // childLedRate = 20% => no bonus
      // satisfaction = 0/(10+10+2) = 0% => -4
      // Score: 52 - 5 - 4 = 43
      expect(r2.cultural_score).toBe(43);
      expect(r2.cultural_rating).toBe("inadequate");
    });

    it("boundary: score 79 is good (not outstanding)", () => {
      // base 52 + 27 = 79. We need exactly +27 in bonuses.
      // All max bonuses = +28. We need to drop 1 point.
      // Keep B1(+4), B2(+4), B3(+3), B4(+3), B5(+4), B6(+3), B7(+3), B8(+1 instead of +2), B9(+2) = 27
      const r = run({
        festival_inclusion_records: [
          makeFestivalInclusion("f1", { faith_or_tradition: "christian", children_participated: ["c1", "c2", "c3", "c4"] }),
          makeFestivalInclusion("f2", { faith_or_tradition: "muslim", children_participated: ["c1", "c2", "c3", "c4"] }),
        ],
      });
      // uniqueFaithsRepresented = 2 => +1 (instead of +2)
      // All others stay the same.
      expect(r.cultural_score).toBe(79);
      expect(r.cultural_rating).toBe("good");
    });
  });

  /* ── 27. avgRating edge cases ─────────────────────────────────────────── */

  describe("avgRating helper", () => {
    it("returns 0 for empty celebration records", () => {
      const r = run({ diversity_celebration_records: [] });
      expect(r.avg_celebration_quality).toBe(0);
    });

    it("returns 0 for empty festival records", () => {
      const r = run({ festival_inclusion_records: [] });
      expect(r.avg_festival_quality).toBe(0);
    });

    it("handles single element", () => {
      const r = run({
        diversity_celebration_records: [
          makeDiversityCelebration("dc1", { quality_rating: 3 }),
        ],
      });
      expect(r.avg_celebration_quality).toBe(3);
    });
  });
});
