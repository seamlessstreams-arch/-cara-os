import { describe, it, expect } from "vitest";
import {
  computeSensoryMetrics,
  identifySensoryAlerts,
} from "./sensory-profile-service";
import type { SensoryProfile } from "./sensory-profile-service";

// -- Factory Function ---------------------------------------------------------

function makeProfile(overrides: Partial<SensoryProfile> = {}): SensoryProfile {
  return {
    id: "sp-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    sensory_domain: "auditory",
    sensitivity_level: "typical",
    triggers: ["loud noises"],
    calming_strategies: ["noise-cancelling headphones"],
    adaptations: ["noise_reduction"],
    adaptation_details: null,
    profile_status: "current",
    assessed_by: "OT-1",
    assessed_date: "2026-04-01",
    next_review_date: "2026-10-01",
    occupational_therapist_input: true,
    staff_trained: true,
    child_views: "I don't like loud sounds",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeSensoryMetrics ----------------------------------------------------

describe("computeSensoryMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSensoryMetrics([], 5);
    expect(m.total_profiles).toBe(0);
    expect(m.children_assessed).toBe(0);
    expect(m.assessment_coverage).toBe(0);
    expect(m.current_profiles).toBe(0);
    expect(m.outdated_profiles).toBe(0);
    expect(m.hyper_sensitive_count).toBe(0);
    expect(m.hypo_sensitive_count).toBe(0);
    expect(m.seeking_count).toBe(0);
    expect(m.staff_trained_rate).toBeNull();;
    expect(m.ot_input_rate).toBeNull();;
    expect(m.child_views_rate).toBeNull();;
    expect(m.adaptations_in_place).toBe(0);
  });

  it("computes assessment coverage correctly", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1" }),
      makeProfile({ id: "p2", child_id: "c2" }),
    ];
    const m = computeSensoryMetrics(profiles, 4);
    expect(m.children_assessed).toBe(2);
    // coverage = (2/4) * 100 = 50
    expect(m.assessment_coverage).toBe(50);
  });

  it("counts profile statuses", () => {
    const profiles = [
      makeProfile({ id: "p1", profile_status: "current" }),
      makeProfile({ id: "p2", profile_status: "outdated" }),
      makeProfile({ id: "p3", profile_status: "under_review" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.current_profiles).toBe(1);
    expect(m.outdated_profiles).toBe(1);
    expect(m.under_review_count).toBe(1);
  });

  it("counts sensitivity levels", () => {
    const profiles = [
      makeProfile({ id: "p1", sensitivity_level: "hyper_sensitive" }),
      makeProfile({ id: "p2", sensitivity_level: "hypo_sensitive" }),
      makeProfile({ id: "p3", sensitivity_level: "seeking" }),
      makeProfile({ id: "p4", sensitivity_level: "typical" }),
    ];
    const m = computeSensoryMetrics(profiles, 4);
    expect(m.hyper_sensitive_count).toBe(1);
    expect(m.hypo_sensitive_count).toBe(1);
    expect(m.seeking_count).toBe(1);
  });

  it("computes staff trained and OT input rates", () => {
    const profiles = [
      makeProfile({ id: "p1", staff_trained: true, occupational_therapist_input: true }),
      makeProfile({ id: "p2", staff_trained: false, occupational_therapist_input: false }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.staff_trained_rate).toBe(50);
    expect(m.ot_input_rate).toBe(50);
  });

  it("computes child views rate (non-null child_views)", () => {
    const profiles = [
      makeProfile({ id: "p1", child_views: "Some views" }),
      makeProfile({ id: "p2", child_views: null }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.child_views_rate).toBe(50);
  });

  it("counts profiles with adaptations in place", () => {
    const profiles = [
      makeProfile({ id: "p1", adaptations: ["noise_reduction", "lighting"] }),
      makeProfile({ id: "p2", adaptations: [] }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.adaptations_in_place).toBe(1);
  });

  it("builds by_sensory_domain and by_adaptation_type breakdowns", () => {
    const profiles = [
      makeProfile({ id: "p1", sensory_domain: "visual", adaptations: ["lighting", "colour_scheme"] }),
      makeProfile({ id: "p2", sensory_domain: "visual", adaptations: ["lighting"] }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.by_sensory_domain["visual"]).toBe(2);
    expect(m.by_adaptation_type["lighting"]).toBe(2);
    expect(m.by_adaptation_type["colour_scheme"]).toBe(1);
  });
});

// -- identifySensoryAlerts ----------------------------------------------------

describe("identifySensoryAlerts", () => {
  it("returns empty array when all children assessed and profiles current", () => {
    const profiles = [makeProfile()];
    const alerts = identifySensoryAlerts(profiles, 1);
    // No outdated, staff trained, review not overdue, has adaptations
    const criticalOrHigh = alerts.filter((a) => a.severity === "critical" || a.severity === "high");
    // Only the profile_gap should not fire since 1 child, 1 assessed
    expect(alerts.filter((a) => a.type === "no_profile")).toHaveLength(0);
  });

  it("flags children without profiles as high", () => {
    const profiles = [makeProfile({ child_id: "c1" })];
    const alerts = identifySensoryAlerts(profiles, 3);
    const gap = alerts.filter((a) => a.type === "no_profile");
    expect(gap).toHaveLength(1);
    expect(gap[0].severity).toBe("high");
    expect(gap[0].message).toContain("2");
  });

  it("flags outdated profiles as medium", () => {
    const profiles = [makeProfile({ profile_status: "outdated" })];
    const alerts = identifySensoryAlerts(profiles, 1);
    const outdated = alerts.filter((a) => a.type === "profile_outdated");
    expect(outdated).toHaveLength(1);
    expect(outdated[0].severity).toBe("medium");
  });

  it("flags staff not trained on hyper/hypo sensitive as high", () => {
    const profiles = [makeProfile({ sensitivity_level: "hyper_sensitive", staff_trained: false })];
    const alerts = identifySensoryAlerts(profiles, 1);
    const noTrained = alerts.filter((a) => a.type === "staff_not_trained");
    expect(noTrained).toHaveLength(1);
    expect(noTrained[0].severity).toBe("high");
  });

  it("does not flag staff not trained for typical sensitivity", () => {
    const profiles = [makeProfile({ sensitivity_level: "typical", staff_trained: false })];
    const alerts = identifySensoryAlerts(profiles, 1);
    const noTrained = alerts.filter((a) => a.type === "staff_not_trained");
    expect(noTrained).toHaveLength(0);
  });

  it("flags review overdue as medium", () => {
    const profiles = [makeProfile({ next_review_date: "2020-01-01" })];
    const alerts = identifySensoryAlerts(profiles, 1);
    const overdue = alerts.filter((a) => a.type === "review_overdue");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("medium");
  });

  it("flags hyper-sensitive without adaptations as high", () => {
    const profiles = [makeProfile({ sensitivity_level: "hyper_sensitive", adaptations: [] })];
    const alerts = identifySensoryAlerts(profiles, 1);
    const noAdapt = alerts.filter((a) => a.type === "no_adaptations");
    expect(noAdapt).toHaveLength(1);
    expect(noAdapt[0].severity).toBe("high");
  });

  it("does not flag hyper-sensitive with adaptations present", () => {
    const profiles = [makeProfile({ sensitivity_level: "hyper_sensitive", adaptations: ["noise_reduction"] })];
    const alerts = identifySensoryAlerts(profiles, 1);
    const noAdapt = alerts.filter((a) => a.type === "no_adaptations");
    expect(noAdapt).toHaveLength(0);
  });
});
