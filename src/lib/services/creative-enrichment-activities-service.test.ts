import { describe, it, expect } from "vitest";
import {
  computeCreativeEnrichmentMetrics,
  identifyCreativeEnrichmentAlerts,
  type CreativeEnrichmentActivitiesRecord,
} from "./creative-enrichment-activities-service";

function makeRecord(overrides: Partial<CreativeEnrichmentActivitiesRecord> = {}): CreativeEnrichmentActivitiesRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    activity_type: "art_drawing",
    engagement_level: "engaged",
    skill_development: "good_progress",
    creative_output: "completed_piece",
    activity_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    facilitated_by: "Staff A",
    child_choice_offered: true,
    age_appropriate: true,
    therapeutic_value: true,
    peer_interaction: true,
    self_expression_supported: true,
    achievement_recognised: true,
    resources_available: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    family_updated: true,
    continuation_planned: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("creative-enrichment-activities-service", () => {
  // ── computeCreativeEnrichmentMetrics ───────────────────────────────────

  describe("computeCreativeEnrichmentMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeCreativeEnrichmentMetrics([]);
      expect(m.total_activities).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.reluctant_count).toBe(0);
      expect(m.child_choice_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });

    it("computes populated metrics", () => {
      const records = [
        makeRecord({ id: "r1", child_name: "A", engagement_level: "refused", skill_development: "no_progress", creative_output: "no_output" }),
        makeRecord({ id: "r2", child_name: "B", engagement_level: "reluctant", child_choice_offered: false }),
        makeRecord({ id: "r3", child_name: "A", engagement_level: "deeply_engaged" }),
      ];
      const m = computeCreativeEnrichmentMetrics(records);
      expect(m.total_activities).toBe(3);
      expect(m.refused_count).toBe(1);
      expect(m.reluctant_count).toBe(1);
      expect(m.no_progress_count).toBe(1);
      expect(m.no_output_count).toBe(1);
      expect(m.unique_children).toBe(2);
      // child_choice: 2 of 3
      expect(m.child_choice_rate).toBeCloseTo(66.7, 1);
      expect(m.by_engagement_level["refused"]).toBe(1);
      expect(m.by_engagement_level["reluctant"]).toBe(1);
    });

    it("computes boolean rates correctly", () => {
      const records = [
        makeRecord({ id: "r1", therapeutic_value: true, peer_interaction: false }),
        makeRecord({ id: "r2", therapeutic_value: false, peer_interaction: true }),
      ];
      const m = computeCreativeEnrichmentMetrics(records);
      expect(m.therapeutic_value_rate).toBe(50);
      expect(m.peer_interaction_rate).toBe(50);
    });
  });

  // ── identifyCreativeEnrichmentAlerts ───────────────────────────────────

  describe("identifyCreativeEnrichmentAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyCreativeEnrichmentAlerts([])).toEqual([]);
    });

    it("flags refused_no_expression (critical) when refused without self-expression support", () => {
      const records = [makeRecord({ engagement_level: "refused", self_expression_supported: false })];
      const alerts = identifyCreativeEnrichmentAlerts(records);
      expect(alerts.some((a) => a.type === "refused_no_expression" && a.severity === "critical")).toBe(true);
    });

    it("flags achievement_not_recognised (high) when >= 1 not recognised", () => {
      const records = [makeRecord({ achievement_recognised: false })];
      const alerts = identifyCreativeEnrichmentAlerts(records);
      expect(alerts.some((a) => a.type === "achievement_not_recognised" && a.severity === "high")).toBe(true);
    });

    it("flags no_child_choice (high) when >= 1 no choice offered", () => {
      const records = [makeRecord({ child_choice_offered: false })];
      const alerts = identifyCreativeEnrichmentAlerts(records);
      expect(alerts.some((a) => a.type === "no_child_choice" && a.severity === "high")).toBe(true);
    });

    it("flags continuation_not_planned (medium) when >= 2 without continuation", () => {
      const records = [
        makeRecord({ id: "r1", continuation_planned: false }),
        makeRecord({ id: "r2", continuation_planned: false }),
      ];
      const alerts = identifyCreativeEnrichmentAlerts(records);
      expect(alerts.some((a) => a.type === "continuation_not_planned" && a.severity === "medium")).toBe(true);
    });

    it("does NOT flag continuation_not_planned for only 1 record", () => {
      const records = [makeRecord({ continuation_planned: false })];
      const alerts = identifyCreativeEnrichmentAlerts(records);
      expect(alerts.some((a) => a.type === "continuation_not_planned")).toBe(false);
    });

    it("flags resources_not_available (medium) when >= 2 without resources", () => {
      const records = [
        makeRecord({ id: "r1", resources_available: false }),
        makeRecord({ id: "r2", resources_available: false }),
      ];
      const alerts = identifyCreativeEnrichmentAlerts(records);
      expect(alerts.some((a) => a.type === "resources_not_available" && a.severity === "medium")).toBe(true);
    });
  });
});
