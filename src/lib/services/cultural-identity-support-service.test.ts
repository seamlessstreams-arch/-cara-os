import { describe, it, expect } from "vitest";
import {
  computeCulturalIdentityMetrics,
  identifyCulturalIdentityAlerts,
  type CulturalIdentitySupportRecord,
} from "./cultural-identity-support-service";

function makeRecord(overrides: Partial<CulturalIdentitySupportRecord> = {}): CulturalIdentitySupportRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    identity_area: "cultural_heritage",
    support_type: "cultural_activity",
    engagement_level: "engaged",
    cultural_competency: "competent",
    support_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    staff_name: "Staff A",
    child_views_sought: true,
    culturally_appropriate: true,
    family_consulted: true,
    identity_celebrated: true,
    resources_available: true,
    staff_trained: true,
    care_plan_reflects_identity: true,
    social_worker_informed: true,
    community_links_made: true,
    dietary_needs_met: true,
    language_supported: true,
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

describe("cultural-identity-support-service", () => {
  // ── computeCulturalIdentityMetrics ─────────────────────────────────────

  describe("computeCulturalIdentityMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeCulturalIdentityMetrics([]);
      expect(m.total_supports).toBe(0);
      expect(m.enthusiastic_count).toBe(0);
      expect(m.declined_count).toBe(0);
      expect(m.child_views_sought_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });

    it("computes populated metrics correctly", () => {
      const records = [
        makeRecord({ id: "r1", child_name: "A", engagement_level: "enthusiastic", cultural_competency: "needs_training" }),
        makeRecord({ id: "r2", child_name: "B", engagement_level: "declined", cultural_competency: "not_assessed" }),
        makeRecord({ id: "r3", child_name: "A", engagement_level: "engaged", culturally_appropriate: false, staff_trained: false }),
      ];
      const m = computeCulturalIdentityMetrics(records);
      expect(m.total_supports).toBe(3);
      expect(m.enthusiastic_count).toBe(1);
      expect(m.declined_count).toBe(1);
      expect(m.needs_training_count).toBe(1);
      expect(m.not_assessed_count).toBe(1);
      expect(m.unique_children).toBe(2);
      // culturally_appropriate: 2/3
      expect(m.culturally_appropriate_rate).toBeCloseTo(66.7, 1);
      // staff_trained: 2/3
      expect(m.staff_trained_rate).toBeCloseTo(66.7, 1);
      expect(m.by_engagement_level["enthusiastic"]).toBe(1);
      expect(m.by_engagement_level["declined"]).toBe(1);
    });

    it("computes boolean rates correctly", () => {
      const records = [
        makeRecord({ id: "r1", child_views_sought: true, family_consulted: true }),
        makeRecord({ id: "r2", child_views_sought: false, family_consulted: false }),
      ];
      const m = computeCulturalIdentityMetrics(records);
      expect(m.child_views_sought_rate).toBe(50);
      expect(m.family_consulted_rate).toBe(50);
    });

    it("includes breakdowns by identity_area and support_type", () => {
      const records = [
        makeRecord({ id: "r1", identity_area: "religious_faith", support_type: "religious_observance" }),
        makeRecord({ id: "r2", identity_area: "religious_faith", support_type: "food_dietary" }),
        makeRecord({ id: "r3", identity_area: "language", support_type: "language_support" }),
      ];
      const m = computeCulturalIdentityMetrics(records);
      expect(m.by_identity_area["religious_faith"]).toBe(2);
      expect(m.by_identity_area["language"]).toBe(1);
      expect(m.by_support_type["religious_observance"]).toBe(1);
      expect(m.by_support_type["food_dietary"]).toBe(1);
      expect(m.by_support_type["language_support"]).toBe(1);
    });
  });

  // ── identifyCulturalIdentityAlerts ─────────────────────────────────────

  describe("identifyCulturalIdentityAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyCulturalIdentityAlerts([])).toEqual([]);
    });

    it("flags declined_views_not_sought (critical) when declined and views not sought", () => {
      const records = [makeRecord({ engagement_level: "declined", child_views_sought: false })];
      const alerts = identifyCulturalIdentityAlerts(records);
      expect(alerts.some((a) => a.type === "declined_views_not_sought" && a.severity === "critical")).toBe(true);
    });

    it("flags care_plan_not_reflecting (high) when >= 1 record has no care plan reflection", () => {
      const records = [makeRecord({ care_plan_reflects_identity: false })];
      const alerts = identifyCulturalIdentityAlerts(records);
      expect(alerts.some((a) => a.type === "care_plan_not_reflecting" && a.severity === "high")).toBe(true);
    });

    it("flags not_culturally_appropriate (high) when >= 1 not appropriate", () => {
      const records = [makeRecord({ culturally_appropriate: false })];
      const alerts = identifyCulturalIdentityAlerts(records);
      expect(alerts.some((a) => a.type === "not_culturally_appropriate" && a.severity === "high")).toBe(true);
    });

    it("flags staff_not_trained (medium) when >= 2 records with untrained staff", () => {
      const records = [
        makeRecord({ id: "r1", staff_trained: false }),
        makeRecord({ id: "r2", staff_trained: false }),
      ];
      const alerts = identifyCulturalIdentityAlerts(records);
      expect(alerts.some((a) => a.type === "staff_not_trained" && a.severity === "medium")).toBe(true);
    });

    it("does NOT flag staff_not_trained for only 1 record", () => {
      const records = [makeRecord({ staff_trained: false })];
      const alerts = identifyCulturalIdentityAlerts(records);
      expect(alerts.some((a) => a.type === "staff_not_trained")).toBe(false);
    });

    it("flags family_not_consulted (medium) when >= 2 without family consultation", () => {
      const records = [
        makeRecord({ id: "r1", family_consulted: false }),
        makeRecord({ id: "r2", family_consulted: false }),
      ];
      const alerts = identifyCulturalIdentityAlerts(records);
      expect(alerts.some((a) => a.type === "family_not_consulted" && a.severity === "medium")).toBe(true);
    });

    it("does NOT flag family_not_consulted for only 1 record", () => {
      const records = [makeRecord({ family_consulted: false })];
      const alerts = identifyCulturalIdentityAlerts(records);
      expect(alerts.some((a) => a.type === "family_not_consulted")).toBe(false);
    });
  });
});
