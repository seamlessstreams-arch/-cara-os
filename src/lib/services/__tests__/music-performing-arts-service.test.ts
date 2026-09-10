import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";
import {
  validateMusicPerformingArts,
  ACTIVITY_TYPES,
  ENGAGEMENT_LEVELS,
  MOOD_LEVELS,
  GROUP_TYPES,
  computeAlerts,
  computeMetrics,
  type MusicPerformingArtsRow,
} from "../music-performing-arts-service";

const now = todayStr();

function makeRow(overrides?: Partial<MusicPerformingArtsRow>): MusicPerformingArtsRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    session_date: now,
    facilitator_name: "Staff A",
    activity_type: "Guitar",
    therapeutic_intent: false,
    therapist_qualified: null,
    instrument_provided: true,
    child_choice: true,
    engagement_level: "Engaged",
    emotional_expression: true,
    confidence_building: true,
    social_interaction: true,
    performance_opportunity: false,
    achievement_noted: null,
    group_or_individual: "Individual",
    mood_before: "Neutral",
    mood_after: "Positive",
    linked_to_care_plan: true,
    notes: null,
    created_at: now,
    updated_at: now,
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("music-performing-arts-service", () => {
  describe("validateMusicPerformingArts", () => {
    it("valid complete record passes validation", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: "2025-03-01",
        facilitatorName: "Staff A",
        activityType: "Guitar",
        therapeuticIntent: false,
        therapistQualified: null,
        engagementLevel: "Engaged",
        moodBefore: "Neutral",
        moodAfter: "Positive",
        performanceOpportunity: false,
        childChoice: true,
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("missing child name fails", () => {
      const result = validateMusicPerformingArts({
        childName: "",
        sessionDate: "2025-03-01",
        facilitatorName: "Staff A",
        activityType: "Guitar",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Child name is required");
    });

    it("missing session date fails", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: undefined,
        facilitatorName: "Staff A",
        activityType: "Guitar",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContainEqual(expect.stringContaining("Session date is required"));
    });

    it("future date fails", () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0];
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: futureDate,
        facilitatorName: "Staff A",
        activityType: "Guitar",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("future"));
    });

    it("invalid activity type fails", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: "2025-03-01",
        facilitatorName: "Staff A",
        activityType: "Banjo Playing",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Activity type must be one of"));
    });

    it("invalid engagement level fails", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: "2025-03-01",
        facilitatorName: "Staff A",
        activityType: "Guitar",
        engagementLevel: "Super Keen",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Engagement level must be one of"));
    });

    it("invalid mood before value fails", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: "2025-03-01",
        facilitatorName: "Staff A",
        activityType: "Guitar",
        moodBefore: "Terrible",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Mood before must be one of"));
    });

    it("invalid mood after value fails", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: "2025-03-01",
        facilitatorName: "Staff A",
        activityType: "Guitar",
        moodAfter: "Amazing",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Mood after must be one of"));
    });

    it("therapeutic intent without qualified therapist fails with CHR 2015 Reg 9 reference", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: "2025-03-01",
        facilitatorName: "Staff A",
        activityType: "Music Therapy",
        therapeuticIntent: true,
        therapistQualified: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("CHR 2015 Reg 9");
    });

    it("performance opportunity without child choice produces warning", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: "2025-03-01",
        facilitatorName: "Staff A",
        activityType: "Drama/Acting",
        performanceOpportunity: true,
        childChoice: false,
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("Performance opportunity");
    });

    it("valid therapeutic session passes when therapist is qualified", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: "2025-03-01",
        facilitatorName: "Dr Therapist",
        activityType: "Music Therapy",
        therapeuticIntent: true,
        therapistQualified: true,
        engagementLevel: "Engaged",
        moodBefore: "Low",
        moodAfter: "Positive",
        performanceOpportunity: false,
        childChoice: true,
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("missing facilitator name fails", () => {
      const result = validateMusicPerformingArts({
        childName: "Child A",
        sessionDate: "2025-03-01",
        facilitatorName: "",
        activityType: "Guitar",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Facilitator name is required"));
    });
  });

  describe("computeMetrics", () => {
    it("returns expected structure from sample data", () => {
      const rows = [
        makeRow({ child_name: "Child A", activity_type: "Guitar", engagement_level: "Engaged", mood_before: "Neutral", mood_after: "Positive" }),
        makeRow({ id: "row-2", child_name: "Child B", activity_type: "Choir", engagement_level: "Enthusiastic", mood_before: "Low", mood_after: "Positive" }),
        makeRow({ id: "row-3", child_name: "Child A", activity_type: "Guitar", engagement_level: "Participated", mood_before: "Neutral", mood_after: "Neutral" }),
      ];
      const metrics = computeMetrics(rows);
      expect(metrics.total_sessions).toBe(3);
      expect(metrics.unique_children).toBe(2);
      expect(metrics.by_activity_type["Guitar"]).toBe(2);
      expect(metrics.by_activity_type["Choir"]).toBe(1);
      expect(metrics.by_engagement_level["Engaged"]).toBe(1);
      expect(metrics.by_engagement_level["Enthusiastic"]).toBe(1);
      expect(metrics.by_group_type["Individual"]).toBe(3);
      expect(metrics.average_sessions_per_child).toBe(1.5);
    });

    it("returns zeros for empty array", () => {
      const metrics = computeMetrics([]);
      expect(metrics.total_sessions).toBe(0);
      expect(metrics.unique_children).toBe(0);
      expect(metrics.engagement_rate).toBeNull();;
      expect(metrics.mood_improvement_rate).toBeNull();;
      expect(metrics.average_sessions_per_child).toBeNull();;
    });

    it("calculates mood improvement rate correctly", () => {
      const rows = [
        makeRow({ mood_before: "Low", mood_after: "Positive" }),
        makeRow({ id: "row-2", mood_before: "Neutral", mood_after: "Neutral" }),
      ];
      const metrics = computeMetrics(rows);
      expect(metrics.mood_improvement_rate).toBe(50);
    });

    it("calculates engagement rate from positive levels", () => {
      const rows = [
        makeRow({ engagement_level: "Engaged" }),
        makeRow({ id: "row-2", engagement_level: "Refused" }),
      ];
      const metrics = computeMetrics(rows);
      expect(metrics.engagement_rate).toBe(50);
    });
  });

  describe("computeAlerts", () => {
    it("returns empty array when no issues", () => {
      const rows = [makeRow()];
      const alerts = computeAlerts(rows);
      expect(alerts.length).toBe(0);
    });

    it("returns critical alert for therapeutic intent without qualified therapist", () => {
      const rows = [makeRow({ therapeutic_intent: true, therapist_qualified: false })];
      const alerts = computeAlerts(rows);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe("critical");
      expect(alerts[0].type).toBe("therapeutic_no_qualified_therapist");
    });

    it("returns high alert for performance without child choice", () => {
      const rows = [makeRow({ performance_opportunity: true, child_choice: false })];
      const alerts = computeAlerts(rows);
      const found = alerts.find((a) => a.type === "performance_without_consent");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
    });

    it("returns high alert for repeated refusal (3+ by same child)", () => {
      const rows = [
        makeRow({ id: "r1", child_name: "Child X", engagement_level: "Refused" }),
        makeRow({ id: "r2", child_name: "Child X", engagement_level: "Refused" }),
        makeRow({ id: "r3", child_name: "Child X", engagement_level: "Refused" }),
      ];
      const alerts = computeAlerts(rows);
      const found = alerts.find((a) => a.type === "repeated_refusal");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
    });
  });

  describe("ACTIVITY_TYPES", () => {
    it("contains expected values", () => {
      expect(ACTIVITY_TYPES).toContain("Guitar");
      expect(ACTIVITY_TYPES).toContain("Music Therapy");
      expect(ACTIVITY_TYPES).toContain("Drama/Acting");
      expect(ACTIVITY_TYPES).toContain("Choir");
      expect(ACTIVITY_TYPES).toContain("Songwriting");
    });

    it("has 16 activity types", () => {
      expect(ACTIVITY_TYPES.length).toBe(16);
    });
  });

  describe("ENGAGEMENT_LEVELS", () => {
    it("has 5 levels", () => {
      expect(ENGAGEMENT_LEVELS.length).toBe(5);
    });

    it("contains Refused through Enthusiastic", () => {
      expect(ENGAGEMENT_LEVELS).toContain("Refused");
      expect(ENGAGEMENT_LEVELS).toContain("Enthusiastic");
    });
  });

  describe("MOOD_LEVELS", () => {
    it("has 5 levels", () => {
      expect(MOOD_LEVELS.length).toBe(5);
    });

    it("contains Very Low through Very Positive", () => {
      expect(MOOD_LEVELS).toContain("Very Low");
      expect(MOOD_LEVELS).toContain("Very Positive");
    });
  });

  describe("GROUP_TYPES", () => {
    it("has 4 types", () => {
      expect(GROUP_TYPES.length).toBe(4);
    });

    it("contains Individual, Pair, Small Group, Large Group", () => {
      expect(GROUP_TYPES).toContain("Individual");
      expect(GROUP_TYPES).toContain("Pair");
      expect(GROUP_TYPES).toContain("Small Group");
      expect(GROUP_TYPES).toContain("Large Group");
    });
  });
});
