import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateCreativeArtsActivity,
  generateCaraInsights,
  type CreativeArtsActivityRow,
} from "./creative-arts-activities-service";

function makeRow(overrides: Partial<CreativeArtsActivityRow> = {}): CreativeArtsActivityRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    activity_date: "2026-05-01",
    facilitator_name: "Staff A",
    activity_type: "Art Therapy",
    therapeutic_intent: false,
    therapist_qualified: null,
    emotional_expression_enabled: true,
    child_choice: true,
    group_or_individual: "Individual",
    engagement_level: "Engaged",
    mood_before: "Neutral",
    mood_after: "Good",
    achievement_noted: "Created a painting",
    exhibited_displayed: true,
    linked_to_care_plan: true,
    young_person_feedback: "I liked it",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("creative-arts-activities-service", () => {
  // ── computeMetrics ────────────────────────────────────────────────────

  describe("computeMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeMetrics([]);
      expect(m.total_activities).toBe(0);
      expect(m.unique_children).toBe(0);
      expect(m.therapeutic_rate).toBe(0);
      expect(m.child_choice_rate).toBe(0);
      expect(m.mood_improvement_rate).toBe(0);
      expect(m.average_engagement).toBe(0);
      expect(m.group_vs_individual_ratio).toBe("0:0");
    });

    it("computes populated metrics", () => {
      const rows = [
        makeRow({ id: "r1", child_name: "A", therapeutic_intent: true, mood_before: "Low", mood_after: "Good", engagement_level: "Enthusiastic" }),
        makeRow({ id: "r2", child_name: "B", therapeutic_intent: false, mood_before: "Good", mood_after: "Good", engagement_level: "Participated", group_or_individual: "Small Group" }),
        makeRow({ id: "r3", child_name: "A", therapeutic_intent: true, mood_before: "Neutral", mood_after: "Neutral", engagement_level: "Engaged" }),
      ];
      const m = computeMetrics(rows);
      expect(m.total_activities).toBe(3);
      expect(m.unique_children).toBe(2);
      // therapeutic: 2/3
      expect(m.therapeutic_rate).toBeCloseTo(66.7, 1);
      // mood improvement: Low->Good (improved), Good->Good (no), Neutral->Neutral (no) => 1/3
      expect(m.mood_improvement_rate).toBeCloseTo(33.3, 1);
      expect(m.music_activity_count).toBe(0);
      expect(m.visual_arts_count).toBe(3); // Art Therapy is in VISUAL_ARTS_TYPES
    });

    it("computes group_vs_individual_ratio", () => {
      const rows = [
        makeRow({ id: "r1", group_or_individual: "Individual" }),
        makeRow({ id: "r2", group_or_individual: "Small Group" }),
        makeRow({ id: "r3", group_or_individual: "Large Group" }),
      ];
      const m = computeMetrics(rows);
      expect(m.group_vs_individual_ratio).toBe("2:1");
    });
  });

  // ── computeAlerts ─────────────────────────────────────────────────────

  describe("computeAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(computeAlerts([])).toEqual([]);
    });

    it("flags unqualified_therapist (critical) for therapeutic with unqualified", () => {
      const rows = [makeRow({ therapeutic_intent: true, therapist_qualified: false })];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "unqualified_therapist" && a.severity === "critical")).toBe(true);
    });

    it("flags repeated_refusal (critical) when child refuses 3+ times", () => {
      const rows = [
        makeRow({ id: "r1", child_name: "Child A", engagement_level: "Refused" }),
        makeRow({ id: "r2", child_name: "Child A", engagement_level: "Refused" }),
        makeRow({ id: "r3", child_name: "Child A", engagement_level: "Refused" }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "repeated_refusal" && a.severity === "critical")).toBe(true);
    });

    it("flags mood_decreased (high) when mood drops during activity", () => {
      const rows = [makeRow({ mood_before: "Good", mood_after: "Low" })];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "mood_decreased" && a.severity === "high")).toBe(true);
    });

    it("flags therapeutic_not_care_planned (high)", () => {
      const rows = [makeRow({ therapeutic_intent: true, linked_to_care_plan: false })];
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "therapeutic_not_care_planned" && a.severity === "high")).toBe(true);
    });

    it("flags low_child_choice (high) when < 40% with 5+ rows", () => {
      const rows = Array.from({ length: 5 }, (_, i) =>
        makeRow({ id: `r${i}`, child_choice: i === 0 }), // only 1 out of 5 = 20%
      );
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "low_child_choice" && a.severity === "high")).toBe(true);
    });

    it("flags low_exhibition_rate (medium) when < 20% with 5+ rows", () => {
      const rows = Array.from({ length: 5 }, (_, i) =>
        makeRow({ id: `r${i}`, exhibited_displayed: false }),
      );
      const alerts = computeAlerts(rows);
      expect(alerts.some((a) => a.type === "low_exhibition_rate" && a.severity === "medium")).toBe(true);
    });
  });

  // ── validateCreativeArtsActivity ──────────────────────────────────────

  describe("validateCreativeArtsActivity", () => {
    it("returns valid for complete input", () => {
      const result = validateCreativeArtsActivity({
        childName: "Child A",
        activityDate: "2026-05-01",
        facilitatorName: "Staff A",
        activityType: "Art Therapy",
        groupOrIndividual: "Individual",
        engagementLevel: "Engaged",
        moodBefore: "Neutral",
        moodAfter: "Good",
      });
      expect(result.valid).toBe(true);
    });

    it("returns errors for missing required fields", () => {
      const result = validateCreativeArtsActivity({});
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Child name"))).toBe(true);
    });

    it("flags therapeutic intent with null therapist_qualified", () => {
      const result = validateCreativeArtsActivity({
        childName: "A",
        activityDate: "2026-05-01",
        facilitatorName: "B",
        activityType: "Art Therapy",
        therapeuticIntent: true,
        therapistQualified: null,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Therapeutic activities must record"))).toBe(true);
    });
  });

  // ── generateCaraInsights ──────────────────────────────────────────────

  describe("generateCaraInsights", () => {
    it("returns 3 insights", () => {
      const rows = [makeRow()];
      const insights = generateCaraInsights(rows);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toContain("[sky]");
    });
  });
});
