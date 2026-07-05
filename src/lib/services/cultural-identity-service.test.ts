import { describe, it, expect } from "vitest";
import {
  computeIdentityMetrics,
  identifyIdentityAlerts,
  type IdentityProfile,
  type IdentityAction,
} from "./cultural-identity-service";

const NOW = new Date("2026-05-21T12:00:00Z");

/** A date n days ago, but returns today if that would leave the current calendar
 *  quarter — so "this quarter" fixtures stay in-quarter at a quarter boundary.
 *  (computeIdentityMetrics uses the real current date for its quarter maths.) */
function daysAgoInQuarter(n: number): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const target = new Date();
  target.setDate(target.getDate() - n);
  const sameQuarter = target.getFullYear() === now.getFullYear() && Math.floor(target.getMonth() / 3) === q;
  return (sameQuarter ? target : now).toISOString().split("T")[0];
}

function makeProfile(overrides: Partial<IdentityProfile> = {}): IdentityProfile {
  return {
    id: "prof-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    ethnicity: "British",
    religion: "None",
    first_language: "English",
    additional_languages: [],
    cultural_needs: "Standard",
    dietary_requirements: "None",
    religious_practices: "None",
    identity_needs: "Standard",
    hair_skin_care_needs: "Standard",
    clothing_preferences: "Standard",
    festivals_celebrated: [],
    community_links: ["Local youth club"],
    child_views_on_identity: "Happy with current support",
    support_plan: "Continue current provisions",
    last_reviewed_date: "2026-03-01",
    reviewed_by: "Staff A",
    next_review_date: "2026-09-01",
    status: "active",
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

function makeAction(overrides: Partial<IdentityAction> = {}): IdentityAction {
  return {
    id: "act-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    action_date: "2026-05-01",
    recorded_by: "Staff A",
    action_type: "cultural_activity",
    description: "Visited cultural centre",
    outcome: "Positive engagement",
    child_feedback: "I enjoyed it",
    child_satisfaction: "positive",
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("cultural-identity-service", () => {
  // ── computeIdentityMetrics ────────────────────────────────────────────

  describe("computeIdentityMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeIdentityMetrics([], []);
      expect(m.children_with_profiles).toBe(0);
      expect(m.total_children).toBe(0);
      expect(m.profile_review_rate).toBe(0);
      expect(m.actions_this_quarter).toBe(0);
      expect(m.satisfaction_rate).toBe(0);
      expect(m.avg_actions_per_child).toBe(0);
    });

    it("computes populated metrics", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: "2026-03-01", community_links: ["Club A"] }),
        makeProfile({ id: "p2", child_id: "c2", status: "active", last_reviewed_date: "2025-01-01", community_links: [] }),
        makeProfile({ id: "p3", child_id: "c3", status: "archived" }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_type: "cultural_activity", child_satisfaction: "positive", action_date: daysAgoInQuarter(1) }),
        makeAction({ id: "a2", child_id: "c1", action_type: "language_support", child_satisfaction: "very_positive", action_date: daysAgoInQuarter(2) }),
        makeAction({ id: "a3", child_id: "c2", action_type: "dietary_provision", child_satisfaction: "negative", action_date: daysAgoInQuarter(3) }),
      ];
      const m = computeIdentityMetrics(profiles, actions);
      expect(m.children_with_profiles).toBe(2); // only active
      expect(m.total_children).toBe(3);
      // Reviewed within 6 months: p1 (2026-03-01 is within 183 days of NOW)
      expect(m.profile_review_rate).toBe(50);
      // All 3 actions are in Q2 2026 (Apr-Jun)
      expect(m.actions_this_quarter).toBe(3);
      // satisfaction: positive + very_positive = 2 out of 3 with feedback
      expect(m.satisfaction_rate).toBeCloseTo(66.7, 1);
      expect(m.children_with_community_links).toBe(1);
      expect(m.children_with_language_support).toBe(1);
      expect(m.avg_actions_per_child).toBe(1.5); // 3 actions / 2 unique children
    });
  });

  // ── identifyIdentityAlerts ────────────────────────────────────────────

  describe("identifyIdentityAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyIdentityAlerts([], [], NOW)).toEqual([]);
    });

    it("flags profile_review_overdue (high) when not reviewed in 6+ months", () => {
      const profiles = [makeProfile({ last_reviewed_date: "2025-01-01", status: "active" })];
      const alerts = identifyIdentityAlerts(profiles, [], NOW);
      expect(alerts.some((a) => a.category === "profile_review_overdue" && a.severity === "high")).toBe(true);
    });

    it("flags profile_review_overdue (high) when never reviewed", () => {
      const profiles = [makeProfile({ last_reviewed_date: null, status: "active" })];
      const alerts = identifyIdentityAlerts(profiles, [], NOW);
      expect(alerts.some((a) => a.category === "profile_review_overdue" && a.severity === "high")).toBe(true);
    });

    it("flags no_recent_actions (medium) when no actions in 3+ months", () => {
      const profiles = [makeProfile({ child_id: "c1", status: "active" })];
      const actions = [makeAction({ child_id: "c1", action_date: "2025-01-01" })];
      const alerts = identifyIdentityAlerts(profiles, actions, NOW);
      expect(alerts.some((a) => a.category === "no_recent_actions" && a.severity === "medium")).toBe(true);
    });

    it("flags no_community_links (medium) when profile has no community links", () => {
      const profiles = [makeProfile({ community_links: [], status: "active" })];
      const alerts = identifyIdentityAlerts(profiles, [], NOW);
      expect(alerts.some((a) => a.category === "no_community_links" && a.severity === "medium")).toBe(true);
    });

    it("flags negative_feedback (high) on action with negative satisfaction", () => {
      const actions = [makeAction({ child_satisfaction: "negative" })];
      const alerts = identifyIdentityAlerts([], actions, NOW);
      expect(alerts.some((a) => a.category === "negative_feedback" && a.severity === "high")).toBe(true);
    });

    it("flags language_support_needed (medium) when first language not English and no language actions", () => {
      const profiles = [makeProfile({ first_language: "Arabic", child_id: "c1", status: "active" })];
      const alerts = identifyIdentityAlerts(profiles, [], NOW);
      expect(alerts.some((a) => a.category === "language_support_needed" && a.severity === "medium")).toBe(true);
    });

    it("flags dietary_not_documented (low) when ethnicity present but no dietary requirements", () => {
      const profiles = [makeProfile({ ethnicity: "South Asian", dietary_requirements: "", status: "active" })];
      const alerts = identifyIdentityAlerts(profiles, [], NOW);
      expect(alerts.some((a) => a.category === "dietary_not_documented" && a.severity === "low")).toBe(true);
    });

    it("sorts alerts with critical first", () => {
      const profiles = [makeProfile({ last_reviewed_date: null, community_links: [], status: "active" })];
      const actions = [makeAction({ child_id: "c99", child_name: "Unknown" })]; // triggers no_identity_profile
      const alerts = identifyIdentityAlerts(profiles, actions, NOW);
      if (alerts.length > 1) {
        expect(alerts[0].severity).toBe("critical");
      }
    });
  });
});
