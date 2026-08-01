import { describe, it, expect } from "vitest";
import {
  computeKeyWorkCompliance,
  computeSessionQuality,
  computeChildProgress,
  suggestSessionTopics,
  SESSION_FREQUENCY,
  KEY_WORK_TOPICS,
} from "./key-working-service";

const NOW = new Date("2026-05-21T12:00:00Z"); // Wednesday

describe("key-working-service", () => {
  // -- computeKeyWorkCompliance --------------------------------------------------

  describe("computeKeyWorkCompliance", () => {
    it("returns zeroes for empty data", () => {
      const result = computeKeyWorkCompliance([], [], NOW);
      expect(result.total_children).toBe(0);
      expect(result.children_on_track).toBe(0);
      expect(result.children_behind).toBe(0);
      expect(result.compliance_percentage).toBeNull();;
      expect(result.by_child).toHaveLength(0);
    });

    it("marks child as on_track when sessions meet requirement", () => {
      const sessions = [
        { child_id: "c1", status: "completed", completed_date: "2026-05-19T10:00:00Z" }, // Monday this week
      ];
      const placements = [{ child_id: "c1", placement_type: "standard", start_date: "2026-01-01" }];
      const result = computeKeyWorkCompliance(sessions, placements, NOW);
      expect(result.total_children).toBe(1);
      expect(result.children_on_track).toBe(1);
      expect(result.children_behind).toBe(0);
      expect(result.compliance_percentage).toBe(100);
      expect(result.by_child[0].on_track).toBe(true);
    });

    it("marks child as behind when sessions insufficient", () => {
      const sessions: { child_id: string; status: string; completed_date: string | null }[] = [];
      const placements = [{ child_id: "c1", placement_type: "standard", start_date: "2026-01-01" }];
      const result = computeKeyWorkCompliance(sessions, placements, NOW);
      expect(result.children_behind).toBe(1);
      expect(result.compliance_percentage).toBe(0);
    });

    it("uses SESSION_FREQUENCY for placement type", () => {
      // high_needs requires 2 per week
      expect(SESSION_FREQUENCY["high_needs"]).toBe(2);
      const sessions = [
        { child_id: "c1", status: "completed", completed_date: "2026-05-19T10:00:00Z" },
      ];
      const placements = [{ child_id: "c1", placement_type: "high_needs", start_date: "2026-01-01" }];
      const result = computeKeyWorkCompliance(sessions, placements, NOW);
      // Only 1 session but 2 required
      expect(result.children_behind).toBe(1);
      expect(result.by_child[0].required_per_week).toBe(2);
      expect(result.by_child[0].actual_this_week).toBe(1);
    });

    it("does not count non-completed sessions", () => {
      const sessions = [
        { child_id: "c1", status: "planned", completed_date: null },
        { child_id: "c1", status: "cancelled", completed_date: null },
      ];
      const placements = [{ child_id: "c1", placement_type: "standard", start_date: "2026-01-01" }];
      const result = computeKeyWorkCompliance(sessions, placements, NOW);
      expect(result.by_child[0].actual_this_week).toBe(0);
    });
  });

  // -- computeSessionQuality ----------------------------------------------------

  describe("computeSessionQuality", () => {
    it("returns poor quality for empty data", () => {
      const result = computeSessionQuality([]);
      expect(result.total_sessions).toBe(0);
      expect(result.avg_mood).toBe(0);
      expect(result.avg_engagement).toBe(0);
      expect(result.quality_rating).toBe("poor");
    });

    it("computes excellent quality when mood+engagement avg >= 4", () => {
      const sessions = [
        { child_mood: 5, child_engagement: 5, topics_covered: ["a", "b"], child_voice: "Great session", positive_observations: ["Engaged well"] },
        { child_mood: 4, child_engagement: 4, topics_covered: ["c"], child_voice: "Liked it", positive_observations: ["Good progress"] },
      ];
      const result = computeSessionQuality(sessions);
      expect(result.quality_rating).toBe("excellent");
      expect(result.avg_mood).toBe(4.5);
      expect(result.avg_engagement).toBe(4.5);
      expect(result.avg_topics_per_session).toBe(1.5);
      expect(result.voice_capture_rate).toBe(100);
      expect(result.positive_observation_rate).toBe(100);
    });

    it("computes good quality when combined avg >= 3 but < 4", () => {
      const sessions = [
        { child_mood: 3, child_engagement: 3, topics_covered: [], child_voice: "OK", positive_observations: [] },
      ];
      const result = computeSessionQuality(sessions);
      expect(result.quality_rating).toBe("good");
    });

    it("computes adequate quality when combined avg >= 2 but < 3", () => {
      const sessions = [
        { child_mood: 2, child_engagement: 2, topics_covered: [], child_voice: "", positive_observations: [] },
      ];
      const result = computeSessionQuality(sessions);
      expect(result.quality_rating).toBe("adequate");
      expect(result.voice_capture_rate).toBe(0);
    });

    it("computes poor quality when combined avg < 2", () => {
      const sessions = [
        { child_mood: 1, child_engagement: 1, topics_covered: [], child_voice: "", positive_observations: [] },
      ];
      const result = computeSessionQuality(sessions);
      expect(result.quality_rating).toBe("poor");
    });
  });

  // -- computeChildProgress ------------------------------------------------------

  describe("computeChildProgress", () => {
    it("returns stable trends for empty data", () => {
      const result = computeChildProgress([]);
      expect(result.total_sessions).toBe(0);
      expect(result.mood_trend).toBe("stable");
      expect(result.engagement_trend).toBe("stable");
      expect(result.cancellation_rate).toBe(0);
    });

    it("computes cancellation rate", () => {
      const sessions = [
        { status: "completed", child_mood: 3, child_engagement: 3, topics_covered: [], therapeutic_framework: "none", completed_date: "2026-05-01" },
        { status: "cancelled", child_mood: 0, child_engagement: 0, topics_covered: [], therapeutic_framework: "none", completed_date: null },
        { status: "child_declined", child_mood: 0, child_engagement: 0, topics_covered: [], therapeutic_framework: "none", completed_date: null },
      ];
      const result = computeChildProgress(sessions);
      expect(result.cancellation_rate).toBe(67); // 2/3
    });

    it("detects improving mood trend", () => {
      // Previous 5: mood 2, Recent 5: mood 4 => diff > 0.3 => improving
      const sessions = Array.from({ length: 10 }, (_, i) => ({
        status: "completed",
        child_mood: i < 5 ? 2 : 4,
        child_engagement: 3,
        topics_covered: ["topic"],
        therapeutic_framework: i >= 5 ? "pace" : "none",
        completed_date: `2026-0${i < 5 ? 3 : 5}-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
      }));
      const result = computeChildProgress(sessions);
      expect(result.mood_trend).toBe("improving");
    });

    it("collects favourite topics and frameworks used", () => {
      const sessions = [
        { status: "completed", child_mood: 3, child_engagement: 3, topics_covered: ["Education progress", "Health and wellbeing"], therapeutic_framework: "pace", completed_date: "2026-05-01" },
        { status: "completed", child_mood: 3, child_engagement: 3, topics_covered: ["Education progress"], therapeutic_framework: "cbt", completed_date: "2026-05-02" },
      ];
      const result = computeChildProgress(sessions);
      expect(result.favourite_topics[0]).toBe("Education progress");
      expect(result.therapeutic_frameworks_used).toContain("pace");
      expect(result.therapeutic_frameworks_used).toContain("cbt");
    });
  });

  // -- suggestSessionTopics ------------------------------------------------------

  describe("suggestSessionTopics", () => {
    it("returns all standard topics when no recent sessions", () => {
      const suggestions = suggestSessionTopics([], []);
      expect(suggestions.length).toBe(KEY_WORK_TOPICS.length);
    });

    it("excludes recently covered topics", () => {
      const recentSessions = [
        { topics_covered: ["Education progress", "Friendships and relationships"] },
      ];
      const suggestions = suggestSessionTopics(recentSessions, []);
      expect(suggestions).not.toContain("Education progress");
      expect(suggestions).not.toContain("Friendships and relationships");
      expect(suggestions).toContain("Family contact");
    });

    it("includes child needs not recently covered", () => {
      const recentSessions = [{ topics_covered: ["Education progress"] }];
      const childNeeds = ["Anxiety management", "Education progress"];
      const suggestions = suggestSessionTopics(recentSessions, childNeeds);
      expect(suggestions).toContain("Anxiety management");
      // Education progress already covered, so not in suggestions
      expect(suggestions).not.toContain("Education progress");
    });
  });
});
